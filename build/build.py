"""組裝單一離線 HTML：資料 gzip+base64 內嵌、字型 base64 內嵌、全部 CSS/JS inline。"""
import base64, calendar, collections, gzip, hashlib, io, json, re, shutil, sys
from datetime import date
from pathlib import Path

from source_manifest import SOURCE_SHA256, SOURCE_VERSION
from renal_data import load_renal_data, renal_script

ROOT = Path(__file__).resolve().parent.parent
SRC, DATA, DIST = ROOT / "src", ROOT / "data", ROOT / "dist"
ASSETS = ROOT / "assets"
# 官方條文 PDF。單檔 HTML 的「零外部請求」不變（PDF 是使用者主動點開的另一份文件，
# 不是頁面載入時的子資源），但它必須與 icd10.html 放在同一層才點得開——
# 打包腳本負責診間那一份，這裡負責 dist/ 那一份，讓開發與 E2E 也點得開。
NHI_DOC_DIR_NAME = "健保條文"
NHI_DOCS = ROOT / NHI_DOC_DIR_NAME
# (檔名, font-family, font-weight)：Latin 子集，中文不內嵌（見 src/styles/app.css 的字型堆疊註解）
FONTS = [
    ("Barlow-400.woff2", "Barlow", 400),
    ("Barlow-500.woff2", "Barlow", 500),
    ("Barlow-700.woff2", "Barlow", 700),
    ("BarlowCondensed-400.woff2", "Barlow Condensed", 400),
    ("BarlowCondensed-600.woff2", "Barlow Condensed", 600),
]
# 設計系統 → 產品共用元件 → 各版面骨架。都在 :root 定義 token，靠來源順序讓後者覆寫。
# 版面各一檔（wide／後續 dock、mobile）是為了讓不同階段能並行實作而不互相覆蓋。
STYLESHEETS = ["styles/industry.css", "styles/app.css", "styles/wide.css", "styles/dock.css", "styles/mobile.css", "styles/renal.css"]
# 有序：每個模組都是 IIFE／UMD，靠這個順序保證依賴先於使用者掛上 window（無 bundler）。
# logic → state → data 都是零 DOM 的純模組（node --test 直接測），其後才碰 DOM。
SOURCES = [
    "logic.js", "renal-dosing.js", "clipboard-format.js", "state.js", "data.js",
    "resize.js",
    "render-renal.js", "clipboard-settings.js", "render-shared.js", "render-wide.js", "render-dock.js", "render-mobile.js",
    "interactions.js", "app.js",
]
CURATED_KEYS = {
    "chronic.json": "chronic", "infectious.json": "infectious", "pathogens.json": "pathogens",
    "surgical_panels.json": "surgicalPanels",
    "surgical_quick.json": "surgicalQuick", "related.json": "related",
    "internal_emergency.json": "internalEmergency",
    "internal_outpatient.json": "internalOutpatient",
    "emergency_quick.json": "emergencyQuick",
}

# ── 慢病速查（DM／HTN／LIPID：健保給付規定與臨床治療目標） ────────────────────
# **刻意不進 CURATED_KEYS。** validate_curated() 與 build_curated_labels() 會把每一項
# 當成 [ICD 碼, 中文名] 拿去比對健保全庫，而這份資料一個代碼都沒有（結構是
# topics → sections → items），走進那條路徑不是崩潰就是噴出一整片假錯誤。
# 它有自己的檢查：結構欄位齊全、日期格式、以及 checked 的時效警告（見 check_chronic_care）。
CHRONIC_CARE_FILE = "chronic_care.json"
# 降血脂品項反查（代碼／商品名／學名 → 表一或表二）。同樣**不進 CURATED_KEYS**：
# 它一個 ICD 代碼都沒有，走 validate_curated() 只會噴假錯誤。
# 由 build/fetch_lipid_products.py 從兩個官方來源產生；它比慢病速查更會過期
# （品項檔每月更新），所以門檻設得比 CHRONIC_CHECK_MAX_MONTHS 短。
LIPID_PRODUCTS_FILE = "lipid_products.json"
LIPID_PRODUCTS_MAX_MONTHS = 3
# 院內收費代碼 → 健保代碼的對照。診間畫面上醫師看到的是收費代碼，品項檔裡只有
# 健保代碼，中間這一截原本是斷的。分開存而不是加欄位進 lipid_products.json：
# 那個檔每月被 fetch_lipid_products.py 重抓覆寫，加上去的欄位下次更新就沒了。
HOSPITAL_LIPID_FILE = "hospital_lipid_codes.json"
# checked 日期超過這個月數就印醒目警告。
# **警告不是失敗**：過期的給付規定會誤導醫師，但讓建置失敗等於門診當天沒工具可用，那更糟。
CHRONIC_CHECK_MAX_MONTHS = 6
# 與 src/state.js 的 CHRONIC_TOPICS 同一組值。狀態層是零 DOM／零 window 的純模組，讀不到
# 這份資料，只能兩邊各留一份鏡像——這裡比對，避免慢慢分歧成「按鈕點了沒反應」。
CHRONIC_TOPIC_KEYS = ("dm", "htn", "lipid")


def _iter_internal_codes(groups, source, allow_red_flags):
    for region in groups:
        region_name = region["name"]
        for panel in region["panels"]:
            panel_source = f"{source}:{region_name}/{panel['name']}"
            for field in ("chief", "diseases"):
                for pair in panel.get(field, []):
                    yield f"{panel_source}:{field}", pair[0]
            if "redFlags" in panel:
                if not allow_red_flags:
                    raise ValueError(f"內科門診不可包含 redFlags：{panel_source}")
                for pair in panel["redFlags"]:
                    yield f"{panel_source}:redFlags", pair[0]
            for code, values in panel.get("related", {}).items():
                yield f"{panel_source}:related", code
                for value in values:
                    yield f"{panel_source}:related:{code}", value


def _iter_curated_codes(curated):
    for key in ("chronic", "infectious", "pathogens", "surgicalQuick", "emergencyQuick"):
        for pair in curated.get(key, []):
            yield key, pair[0]
    for key in ("surgicalPanels",):
        for panel in curated.get(key, []):
            for pair in panel["codes"]:
                yield f"{key}:{panel['name']}", pair[0]
    yield from _iter_internal_codes(curated.get("internalEmergency", []), "internalEmergency", True)
    yield from _iter_internal_codes(curated.get("internalOutpatient", []), "internalOutpatient", False)
    for key, values in curated.get("related", {}).items():
        yield "related", key
        for value in values:
            yield f"related:{key}", value


def validate_curated(curated, db):
    by_code = {row[0]: row for row in db}
    bad = []
    for source, code in _iter_curated_codes(curated):
        row = by_code.get(code)
        if row is None or len(row) < 2 or row[1] != 1:
            bad.append(f"{source}: {code}")
    if bad:
        sample = "; ".join(bad[:20])
        suffix = "" if len(bad) <= 20 else f"（另有 {len(bad) - 20} 筆）"
        raise ValueError(f"curated 含不存在或非葉碼：{sample}{suffix}")


def validate_data_metadata(raw, db):
    metadata_path = DATA / "codes.min.meta.json"
    try:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ValueError("找不到資料 metadata，請先執行 build/convert.py") from exc
    except json.JSONDecodeError as exc:
        raise ValueError("資料 metadata 不是有效 JSON，請重新執行 build/convert.py") from exc

    expected = {
        "sourceVersion": SOURCE_VERSION,
        "sourceSha256": SOURCE_SHA256,
        "dataSha256": hashlib.sha256(raw).hexdigest(),
        "rowCount": len(db),
        "leafCount": sum(1 for row in db if row[1] == 1),
    }
    if metadata != expected:
        raise ValueError("資料 metadata 不符目前來源或資料內容，請重新執行 build/convert.py")
    return expected


def build_curated_labels(curated, by_code):
    """產生 {碼: 中文名}，涵蓋所有精選碼（含 related.json 的 key 與 value）。

    延遲載入全庫時（impl-plan R-3.3），chip 的中文標籤沒有 index 可查，related.json
    本身又完全不帶 label——沒有這份對照表，DB 就緒前的相關碼會變成「只有代碼、沒有中文」。
    同時這份 key 集合就是 R-4 的加碼白名單，所以這裡再擋一次「必須是 USE=1 葉碼且中文非空」，
    不倚賴 validate_curated() 已經跑過（兩層防線，順序改動也不會漏）。
    """
    labels, bad = {}, []
    for source, code in _iter_curated_codes(curated):
        row = by_code.get(code)
        if row is None or len(row) < 4 or row[1] != 1 or not str(row[3]).strip():
            bad.append(f"{source}: {code}")
            continue
        labels[code] = row[3]
    if bad:
        sample = "; ".join(bad[:20])
        suffix = "" if len(bad) <= 20 else f"（另有 {len(bad) - 20} 筆）"
        raise ValueError(f"CURATED_LABELS 含非葉碼／不存在／中文為空的代碼：{sample}{suffix}")
    return dict(sorted(labels.items()))


def _months_before(day, months):
    """day 往前推 months 個月（月底夾到當月最後一天，2026-08-31 減 6 → 2026-02-28）。"""
    year, month = day.year, day.month - months
    while month <= 0:
        month += 12
        year -= 1
    return date(year, month, min(day.day, calendar.monthrange(year, month)[1]))


def load_chronic_care():
    """讀 chronic_care.json，剝掉 _schema 再內嵌。

    _schema 是給維護者看的欄位說明（約 1.5 KB），對執行期毫無用處，留在 dist 只會讓
    「這份東西的權威性」看起來比實際更高。維護說明留在原始檔與 README。
    """
    raw = json.loads((SRC / "curated" / CHRONIC_CARE_FILE).read_text(encoding="utf-8"))
    return {k: v for k, v in raw.items() if k != "_schema"}


def check_chronic_care(chronic, today=None):
    """慢病速查的建置期時效檢查。**只回報，永不丟例外。**

    為什麼要有這一關：ICD 代碼可以逐碼比對官方全庫、錯了 validate_curated() 就讓建置失敗；
    健保給付規定沒有任何機器可驗的權威來源，唯一的防線就是「每條自帶查證日期」＋「定期重查」。
    沒有這個提醒，這份速查會安靜地變成一個看起來權威、實際上過期的東西——那比沒有更危險。

    回傳 dict：warnings（字串清單，空＝通過）、items（總條數）、oldest（最舊的 checked）、
    cutoff（門檻日期）。
    """
    today = today or date.today()
    cutoff = _months_before(today, CHRONIC_CHECK_MAX_MONTHS)
    warnings, total, oldest, keys = [], 0, None, []
    for topic in chronic.get("topics") or []:
        key = topic.get("key") or "(缺 key)"
        keys.append(key)
        for section in topic.get("sections") or []:
            kind = section.get("kind") or "(缺 kind)"
            for item in section.get("items") or []:
                total += 1
                head = (str(item.get("text") or "(缺 text)"))[:34]
                where = f"{key}／{kind}：{head}"
                if not str(item.get("source") or "").strip():
                    warnings.append(f"{where}　缺 source（出處會顯示成「未註明」）")
                try:
                    day = date.fromisoformat(str(item.get("checked")))
                except (TypeError, ValueError):
                    warnings.append(
                        f"{where}　checked 缺漏或不是 YYYY-MM-DD（{item.get('checked')!r}）"
                    )
                    continue
                if oldest is None or day < oldest:
                    oldest = day
                if day < cutoff:
                    warnings.append(f"{where}　查證 {day}，已超過 {CHRONIC_CHECK_MAX_MONTHS} 個月")
    if sorted(keys) != sorted(CHRONIC_TOPIC_KEYS):
        warnings.append(
            f"topics 的 key 是 {sorted(keys)}，與 src/state.js 的 CHRONIC_TOPICS "
            f"{sorted(CHRONIC_TOPIC_KEYS)} 不一致——按鈕會點了沒反應"
        )
    return {"warnings": warnings, "items": total, "oldest": oldest, "cutoff": cutoff}


def load_lipid_products():
    """讀 lipid_products.json，剝掉 _schema 再內嵌（同 load_chronic_care 的理由）。"""
    raw = json.loads((SRC / "curated" / LIPID_PRODUCTS_FILE).read_text(encoding="utf-8"))
    return {k: v for k, v in raw.items() if k != "_schema"}


def check_lipid_products(data, today=None):
    """品項檔的結構與時效檢查。結構錯誤丟例外，過舊只警告。

    分兩種的理由同 check_chronic_docs／check_chronic_care：
      - 「欄位缺漏、表別值不合法」是機器可驗的事實 → 失敗
      - 「資料太舊」是判斷 → 警告（讓建置失敗等於門診當天沒工具可用，那更糟）
    """
    products = data.get("products") or []
    if not products:
        raise ValueError("lipid_products.json 沒有任何品項（跑 build/fetch_lipid_products.py 產生）")
    allowed = {"one", "two", ""}
    bad = []
    seen = set()
    for p in products:
        code = str((p or {}).get("code") or "").strip()
        if not code:
            bad.append("有一筆沒有代碼")
            continue
        if code in seen:
            bad.append(f"{code}：代碼重複")
        seen.add(code)
        if str(p.get("table", "")) not in allowed:
            bad.append(f"{code}：table 值不合法（{p.get('table')!r}）")
        if not str(p.get("en") or p.get("zh") or "").strip():
            bad.append(f"{code}：中英文品名都是空的，查不到就等於沒收錄")
    if bad:
        detail = "\n  ".join(bad[:10])
        more = "" if len(bad) <= 10 else f"\n  （另有 {len(bad) - 10} 筆）"
        raise ValueError(f"lipid_products.json 有 {len(bad)} 筆問題：\n  {detail}{more}")

    warnings = []
    today = today or date.today()
    cutoff = _months_before(today, LIPID_PRODUCTS_MAX_MONTHS)
    try:
        checked = date.fromisoformat(str(data.get("checked")))
    except (TypeError, ValueError):
        warnings.append(f"checked 缺漏或不是 YYYY-MM-DD（{data.get('checked')!r}）")
        checked = None
    if checked and checked < cutoff:
        warnings.append(
            f"品項檔查證 {checked}，已超過 {LIPID_PRODUCTS_MAX_MONTHS} 個月"
            "（健保用藥品項每月更新，跑 build/fetch_lipid_products.py 重抓）")
    counts = collections.Counter(str(p.get("table") or "other") for p in products)
    return {"warnings": warnings, "total": len(products), "counts": counts, "checked": checked}


def load_hospital_lipid():
    """讀院內收費代碼對照，剝掉 _schema 再用（同 load_lipid_products 的理由）。"""
    raw = json.loads((SRC / "curated" / HOSPITAL_LIPID_FILE).read_text(encoding="utf-8"))
    return {k: v for k, v in raw.items() if k != "_schema"}


def merge_hospital_codes(products, mapping):
    """把院內收費代碼掛到品項上，回傳新的 products（不就地改動）。

    掛在品項物件上而不是另存一份：分頁與計算機共用同一份 window.LIPID_PRODUCTS，
    掛上去兩邊就自動一起生效，不會養出兩份互相分歧的清單。

    **對不上就讓建置失敗**，理由同 check_chronic_docs：品項檔每月更新、代碼會下架，
    指到不存在的代碼時工具會對一個有效的收費代碼回「查無」，醫師在診間會以為自己
    打錯字——而那裡沒有人能查證。
    """
    items = (mapping or {}).get("items") or []
    known = {str((p or {}).get("code") or "") for p in products}
    by_code = {}
    seen = {}
    bad = []
    for it in items:
        hosp = str((it or {}).get("hosp") or "").strip()
        code = str((it or {}).get("code") or "").strip()
        if not hosp or not code:
            bad.append(f"有一筆缺 hosp 或 code：{it!r}")
            continue
        if hosp in seen:
            bad.append(f"{hosp}：院內代碼重複（已對到 {seen[hosp]}）")
            continue
        seen[hosp] = code
        if code not in known:
            bad.append(f"{hosp} → {code}：品項檔查無這個健保代碼")
            continue
        by_code.setdefault(code, []).append(hosp)
    if bad:
        detail = "\n  ".join(bad[:10])
        more = "" if len(bad) <= 10 else f"\n  （另有 {len(bad) - 10} 筆）"
        raise ValueError(f"{HOSPITAL_LIPID_FILE} 有 {len(bad)} 筆問題：\n  {detail}{more}")
    out = []
    for p in products:
        hosps = by_code.get(str((p or {}).get("code") or ""))
        # 沒有對照的品項不長出空欄位：空陣列會讓畫面誤判成「院內有這支」。
        out.append({**p, "hosp": sorted(hosps)} if hosps else p)
    return out


def check_chronic_docs(chronic):
    """核對 chronic_care.json 的 docs[].file 都真的存在於 健保條文/。**對不上就丟例外。**

    與 check_chronic_care() 只警告不同，這一關要讓建置失敗：檔名寫錯的表現是醫師在診間
    點下連結、瀏覽器說找不到檔案——那是到了診間才會發現、而診間補不了的錯。而且這條檢查
    本身是機器可驗的（檔案在不在是事實，不是判斷），沒有理由只給警告。

    回傳實際被引用到的檔名集合。
    """
    used, missing = set(), []
    for topic in chronic.get("topics") or []:
        key = topic.get("key") or "(缺 key)"
        for doc in topic.get("docs") or []:
            name = str((doc or {}).get("file") or "").strip()
            if not name:
                missing.append(f"{key}：docs 有一筆沒寫 file")
                continue
            used.add(name)
            if not (NHI_DOCS / name).is_file():
                missing.append(f"{key}：{NHI_DOC_DIR_NAME}/{name} 不存在")
    if missing:
        raise ValueError(
            "慢病速查引用的官方條文 PDF 找不到（診間點下去會是「找不到檔案」）：\n  "
            + "\n  ".join(missing)
            + f"\n請把檔案放進 {NHI_DOC_DIR_NAME}/，或修正 chronic_care.json 的 docs[].file。"
        )
    return used


def check_drugs(chronic):
    """核對 drugs：每一類都要有 klass、至少一個學名、給付狀態與 covered 旗標。

    covered 特別要有：畫面靠它把「健保沒收載」標出來，漏了就會變成一份看起來
    全部都給付的用藥清單——那正是這一塊最容易誤導的地方。

    回傳 {topic key: 類別數}。
    """
    seen, bad = {}, []
    for topic in chronic.get("topics") or []:
        key = topic.get("key") or "(缺 key)"
        box = topic.get("drugs")
        if not box:
            continue
        groups = box.get("groups") or []
        if not groups:
            bad.append(f"{key}：drugs 沒有任何類別")
        for g in groups:
            klass = str((g or {}).get("klass") or "").strip()
            if not klass:
                bad.append(f"{key}：有一類沒寫 klass")
            if not (g or {}).get("items"):
                bad.append(f"{key}／{klass or '(無名)'}：沒有列學名")
            if not str((g or {}).get("cover") or "").strip():
                bad.append(f"{key}／{klass or '(無名)'}：沒有寫健保給付狀態")
            if not isinstance((g or {}).get("covered"), bool):
                bad.append(f"{key}／{klass or '(無名)'}：covered 不是布林值")
        seen[key] = len(groups)
    if bad:
        raise ValueError("drugs 結構有問題：\n  " + "\n  ".join(bad))
    return seen


def check_risk_ladder(chronic):
    """核對 riskLadder 的結構：每一級要有 label、正整數 ldl、至少一條 criteria。

    數字對不對（與 logic.js 的 LIPID_ONE 一致）由 tests/test_chronic_care.py 比——
    那需要讀 JS，不適合塞進建置。這裡擋的是「級數空掉」「門檻寫成字串」這類
    會讓畫面直接壞掉的結構性錯誤。

    回傳 {topic key: 級數}。
    """
    seen, bad = {}, []
    for topic in chronic.get("topics") or []:
        key = topic.get("key") or "(缺 key)"
        box = topic.get("riskLadder")
        if not box:
            continue
        levels = box.get("levels") or []
        if not levels:
            bad.append(f"{key}：riskLadder 沒有任何分級")
        for lv in levels:
            label = str((lv or {}).get("label") or "").strip()
            if not label:
                bad.append(f"{key}：有一級沒寫 label")
            ldl = (lv or {}).get("ldl")
            if not isinstance(ldl, int) or ldl < 1:
                bad.append(f"{key}／{label or '(無名)'}：ldl 不是正整數（{ldl!r}）")
            if not (lv or {}).get("criteria"):
                bad.append(f"{key}／{label or '(無名)'}：沒有寫判準")
            if not str((lv or {}).get("nonDrug") or "").strip():
                bad.append(f"{key}／{label or '(無名)'}：沒有寫非藥物治療（官方表那一欄）")
        seen[key] = len(levels)
    if bad:
        raise ValueError("riskLadder 結構有問題：\n  " + "\n  ".join(bad))
    return seen


def check_table_two_only(chronic):
    """核對 tableTwoOnly：codeCount 要等於各成分的 codes 加總。**對不上就丟例外。**

    這是可機器驗證的算術（不像給付門檻只能靠人重查），而它錯了會很難看：畫面上會寫
    「限『不適用表一』的 N 個健保代碼」，底下列的成分加起來卻不是 N。同 check_chronic_docs()
    的判準——事實類的錯誤讓建置失敗，判斷類的才只給警告。

    回傳 {topic key: 成分數}，沒有這個欄位的主題不列入。
    """
    seen, bad = {}, []
    for topic in chronic.get("topics") or []:
        key = topic.get("key") or "(缺 key)"
        box = topic.get("tableTwoOnly")
        if not box:
            continue
        items = box.get("ingredients") or []
        if not items:
            bad.append(f"{key}：tableTwoOnly 沒有列任何成分")
            continue
        total = 0
        for item in items:
            name = str((item or {}).get("name") or "").strip()
            codes = (item or {}).get("codeCount")
            if not name:
                bad.append(f"{key}：有一項成分沒寫 name")
            if not isinstance(codes, int) or codes < 1:
                bad.append(f"{key}／{name or '(無名)'}：codeCount 不是正整數（{codes!r}）")
            else:
                total += codes
        declared = box.get("codeCount")
        if declared != total:
            bad.append(f"{key}：codeCount {declared!r} 與各成分加總 {total} 不符")
        seen[key] = len(items)
    if bad:
        raise ValueError(
            "tableTwoOnly 的清單對不上（畫面會寫出一個自相矛盾的數字）：\n  "
            + "\n  ".join(bad)
        )
    return seen


def copy_nhi_docs():
    """把 健保條文/*.pdf 複製到 dist/，讓 dist/icd10.html 的連結在本機也點得開。

    dist/健保條文/ 進 .gitignore：它是 健保條文/ 的拷貝而不是原始檔，兩份都進版控等於
    同一批二進位存兩次。診間那一份由 tools/pack_for_clinic.py 直接從 健保條文/ 複製，
    不經過 dist——少一段傳話，就少一種「dist 忘了重建所以寄出舊條文」的失敗方式。
    """
    out = DIST / NHI_DOC_DIR_NAME
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    copied = 0
    for pdf in sorted(NHI_DOCS.glob("*.pdf")):
        shutil.copy2(pdf, out / pdf.name)
        copied += 1
    return copied


def format_chronic_report(report):
    """把 check_chronic_care() 的結果排成要印出來的文字（醒目，但不影響結束碼）。"""
    if not report["warnings"]:
        oldest = report["oldest"] or "—"
        return (f"  慢病速查：{report['items']} 條，最舊查證 {oldest}"
                f"（{CHRONIC_CHECK_MAX_MONTHS} 個月門檻通過）")
    rule = "=" * 78
    lines = [
        rule,
        f"【警告】慢病速查有 {len(report['warnings'])} 條需要重查——建置不因此失敗，工具照常可用。",
        f"        門檻：checked 早於 {report['cutoff']}（{CHRONIC_CHECK_MAX_MONTHS} 個月）。",
    ]
    # 逐條列出但設上限：整份過期時 64 行會把警告本身淹掉，反而看不見（同 validate_curated 的作法）
    shown = report["warnings"][:12]
    lines += [f"  - {w}" for w in shown]
    if len(report["warnings"]) > len(shown):
        lines.append(f"  …（另有 {len(report['warnings']) - len(shown)} 條，同樣需要重查）")
    lines += [
        "        重查健保署當期公告後，更新 src/curated/chronic_care.json 的 checked 日期。",
        rule,
    ]
    return "\n".join(lines)


def embed_fonts():
    """讀 assets/fonts/*.woff2 → base64 → @font-face（font-display:swap）。"""
    rules = [
        "/* Barlow / Barlow Condensed（Copyright 2017 The Barlow Project Authors）"
        "，SIL Open Font License 1.1；\n"
        "   授權全文見原始碼庫 assets/fonts/OFL.txt（此處不附網址：單檔不得含外部參照）。\n"
        "   Latin 子集內嵌為 data: URI，中文靠字型堆疊 fallback 到系統字。 */"
    ]
    total = 0
    for fname, family, weight in FONTS:
        raw = (ASSETS / "fonts" / fname).read_bytes()
        total += len(raw)
        b64 = base64.b64encode(raw).decode("ascii")
        rules.append(
            "@font-face{font-family:'%s';font-style:normal;font-weight:%d;font-display:swap;"
            "src:url(data:font/woff2;base64,%s) format('woff2')}" % (family, weight, b64)
        )
    return "\n".join(rules), total


def build_styles():
    """@font-face ＋ STYLESHEETS 依序串接成單一 <style>。

    P1 曾用 `@layer design{}` 包起來，讓設計系統不覆蓋 template.html 裡的舊版 <style>；
    P3 已把舊版樣式整段刪除，包裝隨之拿掉——現在來源順序就是唯一的階層規則。
    """
    fonts_css, font_bytes = embed_fonts()
    parts = []
    for rel in STYLESHEETS:
        parts.append(f"/* ===== {rel} ===== */\n" + (SRC / rel).read_text(encoding="utf-8"))
    return "<style>\n" + fonts_css + "\n" + "\n\n".join(parts) + "\n</style>", font_bytes


# 唯一允許的 http(s) 字串：SVG 命名空間（不會發出請求）
_OFFLINE_ALLOW = re.compile(r"https?://(?!www\.w3\.org/2000/svg)")
_DATA_SCRIPT = re.compile(r'(?s)<script id="icd-data".*?</script>')


def assert_offline(html):
    """建置期守門：輸出不得含任何外部參照，否則直接讓建置失敗。

    E2E 也有 test_no_external_requests 這層，但那要等測試跑才會發現；這裡在建置當下就擋，
    避免 vendored 進帶 CDN 連結的資源後一路矇混到 dist。
    """
    body = _DATA_SCRIPT.sub("", html)   # 資料是 base64，不可能含 "://"，剔除只為加速與避免誤判
    violations = []
    for match in _OFFLINE_ALLOW.finditer(body):
        start = max(0, match.start() - 60)
        violations.append(body[start:match.start() + 80].replace("\n", " "))
    # 只抓真正的 at-rule 形式（`@import url(` / `@import "`），不誤判註解裡提到 @import 的說明文字
    for match in re.finditer(r"@import\s*(?:url\(|['\"])", body):
        violations.append("@import → " + body[match.start():match.start() + 120].replace("\n", " "))
    for match in re.finditer(r"url\(\s*['\"]?(?!data:)([^)'\"]{0,80})", body):
        violations.append("非 data: 的 url() → " + match.group(0).replace("\n", " "))
    if violations:
        detail = "\n".join(f"  - …{v}…" for v in violations[:10])
        more = "" if len(violations) <= 10 else f"\n  （另有 {len(violations) - 10} 處）"
        raise ValueError(f"輸出含 {len(violations)} 處外部參照，單檔必須零外部請求：\n{detail}{more}")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    raw = (DATA / "codes.min.json").read_bytes()
    db = json.loads(raw.decode("utf-8"))
    metadata = validate_data_metadata(raw, db)
    b64 = base64.b64encode(gzip.compress(raw, 9, mtime=0)).decode("ascii")

    curated = {}
    for fname, key in CURATED_KEYS.items():
        curated[key] = json.loads((SRC / "curated" / fname).read_text(encoding="utf-8"))
    validate_curated(curated, db)
    labels = build_curated_labels(curated, {row[0]: row for row in db})
    chronic = load_chronic_care()
    products = load_lipid_products()
    renal = load_renal_data(SRC / "curated" / "antibiotic_dosing.json")
    products_report = check_lipid_products(products)
    hospital_lipid = load_hospital_lipid()
    products["products"] = merge_hospital_codes(products["products"], hospital_lipid)
    # items 已經 merge 進品項了，這裡只留 meta：畫面要印出處與查證日
    # （面板不放常駐說明，可信度由每一塊自己的出處承擔）。
    products["hospital"] = {k: v for k, v in hospital_lipid.items() if k != "items"}
    chronic_docs = check_chronic_docs(chronic)
    ladder = check_risk_ladder(chronic)
    drug_groups = check_drugs(chronic)
    table_two = check_table_two_only(chronic)
    chronic_report = check_chronic_care(chronic)
    styles, font_bytes = build_styles()
    scripts = (
        "<script>\nwindow.ICD_META = " + json.dumps(metadata, ensure_ascii=False, separators=(",", ":")) + ";\n</script>\n"
        "<script>\n/* 資料來源：健保署 ICD-10-CM（" + SOURCE_VERSION + "） */\n"
        + "window.CURATED = " + json.dumps(curated, ensure_ascii=False, separators=(",", ":")) + ";\n"
        + "/* 精選碼的中文對照：全庫延遲載入時 chip 的標籤來源，同時是加碼白名單（impl-plan R-3.3／R-4） */\n"
        + "window.CURATED_LABELS = " + json.dumps(labels, ensure_ascii=False, separators=(",", ":")) + ";\n</script>\n"
        + "<script>\n/* 慢病速查：健保給付規定與臨床治療目標。**不含 ICD 代碼**，所以不走\n"
        + "   validate_curated() 的代碼驗證；它的守門是 check_chronic_care()（結構與 checked 時效）\n"
        + "   加上 assert_offline()（source 一旦夾帶網址就整個建置失敗）。維護方式見 README。 */\n"
        + "window.CHRONIC_CARE = " + json.dumps(chronic, ensure_ascii=False, separators=(",", ":")) + ";\n</script>\n"
        + "<script>\n/* 降血脂品項反查：代碼／商品名／學名 → 適用表一或表二。\n"
        + "   來源是健保署品項檔（每月更新）＋2.6.1 的「不適用表一」對照表，\n"
        + "   由 build/fetch_lipid_products.py 產生，守門是 check_lipid_products()。 */\n"
        + "window.LIPID_PRODUCTS = " + json.dumps(products, ensure_ascii=False, separators=(",", ":")) + ";\n</script>\n"
        + renal_script(renal)
        + "\n".join(
            "<script>\n" + (SRC / rel).read_text(encoding="utf-8") + "\n</script>"
            for rel in SOURCES
        )
    )

    html = (SRC / "template.html").read_text(encoding="utf-8")
    for placeholder in ("%DATA%", "<!--%STYLES%-->", "<!--%SCRIPTS%-->"):
        if placeholder not in html:
            raise ValueError(f"template.html 找不到佔位符 {placeholder}")
    html = html.replace("%DATA%", b64).replace("<!--%STYLES%-->", styles).replace("<!--%SCRIPTS%-->", scripts)
    assert_offline(html)
    DIST.mkdir(exist_ok=True)
    out = DIST / "icd10.html"
    with io.open(out, "w", encoding="utf-8", newline="\n") as f:
        f.write(html)
    copied_docs = copy_nhi_docs()
    print(
        f"輸出 {out}（{out.stat().st_size:,} bytes）\n"
        f"  字型：{len(FONTS)} 個 woff2，{font_bytes:,} bytes → base64 {(font_bytes + 2) // 3 * 4:,} bytes\n"
        f"  樣式：{' + '.join(STYLESHEETS)}，{len(styles):,} bytes（含字型）\n"
        f"  指令碼：{' → '.join(SOURCES)}\n"
        f"  CURATED_LABELS：{len(labels):,} 個精選碼\n"
        f"  表一用藥："
        + ("、".join(f"{k} {v} 類" for k, v in drug_groups.items()) or "（無）") + "\n"
        f"  降血脂品項：{products_report['total']:,} 個"
        + f"（表一 {products_report['counts'].get('one', 0)}、"
        + f"表二 {products_report['counts'].get('two', 0)}、"
        + f"其他章節 {products_report['counts'].get('other', 0)}）\n"
        f"  院內收費代碼：{sum(len(p['hosp']) for p in products['products'] if p.get('hosp'))} 個"
        + f"（對到 {sum(1 for p in products['products'] if p.get('hosp'))} 個健保代碼）\n"
        f"  風險分級階梯："
        + ("、".join(f"{k} {v} 級" for k, v in ladder.items()) or "（無）") + "\n"
        f"  僅適用表二的成分："
        + ("、".join(f"{k} {v} 種" for k, v in table_two.items()) or "（無）") + "\n"
        f"  官方條文：{NHI_DOC_DIR_NAME}/ 引用 {len(chronic_docs)} 份，"
        f"複製 {copied_docs} 個 PDF 到 dist/{NHI_DOC_DIR_NAME}/\n"
        f"  assert_offline：通過（零外部參照）"
    )
    # 時效警告排在最後印：它是要被看見的東西，夾在中間會被上面的統計淹掉
    print(format_chronic_report(chronic_report))
    for line in products_report["warnings"]:
        print(f"【警告】降血脂品項：{line}")

if __name__ == "__main__":
    main()
