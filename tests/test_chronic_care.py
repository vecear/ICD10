"""慢病速查（DM／HTN／LIPID）：資料契約與建置期時效守門。

這份內容與 ICD 代碼有一個本質差異，本檔所有測試都是從它推出來的：
代碼可以逐碼比對健保署全庫、錯了 `validate_curated()` 就讓建置失敗；
**健保給付規定沒有任何機器可驗的權威來源**。唯一的防線是
「每條自帶出處與查證日期」＋「過舊時建置期吼一聲」——所以那兩件事本身必須有測試，
否則這份速查會安靜地變成一個看起來權威、實際上過期的東西，那比沒有更危險。

警告刻意**不是失敗**（`test_stale_data_warns_loudly_but_never_fails_the_build`）：
過期會誤導醫師，但讓建置失敗等於門診當天沒工具可用，那更糟。
"""
import json
import re
import sys
from datetime import date, timedelta
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "build"))
import build as build_module

ROOT = Path(__file__).resolve().parent.parent
SRC_JSON = ROOT / "src" / "curated" / "chronic_care.json"
STATE_JS = ROOT / "src" / "state.js"
DIST = ROOT / "dist" / "icd10.html"
ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def load_raw():
    return json.loads(SRC_JSON.read_text(encoding="utf-8"))


def iter_items(chronic):
    """(topic key, kind, item) 逐條展開，供各測試共用。"""
    for topic in chronic.get("topics") or []:
        for section in topic.get("sections") or []:
            for item in section.get("items") or []:
                yield topic.get("key"), section.get("kind"), item


def fake_topics(items):
    """把一串 item 包成 check_chronic_care() 吃得下的最小結構（key 用真實的三個）。"""
    return {
        "topics": [
            {"key": "dm", "sections": [{"kind": "coverage", "items": items}]},
            {"key": "htn", "sections": []},
            {"key": "lipid", "sections": []},
        ]
    }


def ok_item(**over):
    base = {"text": "示範條目", "source": "藥品給付規定 第五節 5.1", "checked": "2026-08-01"}
    base.update(over)
    return base


# ── 資料契約（內容由人工整理，這幾條是它必須守住的形狀） ──────────────────────
def test_every_item_carries_a_visible_source_and_a_parsable_checked_date():
    """出處與查證日期是這個功能的全部可信度來源，一條都不能缺。"""
    bad = []
    for key, kind, item in iter_items(load_raw()):
        head = str(item.get("text") or "(缺 text)")[:24]
        if not str(item.get("source") or "").strip():
            bad.append(f"{key}/{kind}/{head}：缺 source")
        checked = str(item.get("checked") or "")
        if not ISO_DATE.match(checked):
            bad.append(f"{key}/{kind}/{head}：checked 不是 YYYY-MM-DD（{checked!r}）")
            continue
        try:
            date.fromisoformat(checked)
        except ValueError:
            bad.append(f"{key}/{kind}/{head}：checked 不是合法日期（{checked!r}）")
    assert not bad, "\n".join(bad)


def test_source_never_carries_a_url():
    """`source` 夾帶網址會直接讓 assert_offline() 讓建置失敗（單檔零外部參照）。

    那一層是全域守門、訊息很泛；這裡先擋一次，壞掉時看得出是內容問題不是打包問題。
    """
    bad = [
        f"{key}/{kind}：{item.get('source')}"
        for key, kind, item in iter_items(load_raw())
        if "http" in str(item.get("source") or "").lower()
    ]
    assert not bad, "source 不可放網址：\n" + "\n".join(bad)


def test_every_topic_links_at_least_one_official_pdf_that_really_exists():
    """`docs[].file` 必須指到 健保條文/ 底下真的存在的檔案。

    這條與本檔其他測試的性質不同：給付規定沒有機器可驗的權威來源，但「檔案在不在」是事實，
    所以它是**失敗**不是警告（`check_chronic_docs` 直接丟例外）。
    寫錯的表現是醫師在診間點下連結、瀏覽器說找不到檔案——診間不能上網也補不了檔，
    要等下一次門診才修得掉。
    """
    raw = load_raw()
    for topic in raw["topics"]:
        docs = topic.get("docs") or []
        assert docs, f"{topic['key']} 沒有登記任何官方條文"
        for doc in docs:
            for field in ("file", "label", "version"):
                assert str(doc.get(field) or "").strip(), f"{topic['key']} 的 docs 缺 {field}：{doc}"
            path = ROOT / "健保條文" / doc["file"]
            assert path.is_file(), f"{topic['key']} 指到不存在的檔案：{path}"
    # 正向路徑：現況資料要過得了建置期守門
    build_module.check_chronic_docs({k: v for k, v in raw.items() if k != "_schema"})


def test_docs_file_never_carries_a_url():
    """同 source：只放檔名。網址會被 assert_offline() 擋下，而且診間也連不出去。"""
    bad = [
        f"{topic['key']}：{doc.get('file')}"
        for topic in load_raw()["topics"]
        for doc in (topic.get("docs") or [])
        if "http" in str(doc.get("file") or "").lower() or "//" in str(doc.get("file") or "")
    ]
    assert not bad, "docs[].file 只能是檔名：\n" + "\n".join(bad)


def test_missing_official_pdf_fails_the_build_loudly():
    """漏檔要讓建置整個停下來，而且訊息要指得出是哪一份。

    只有這條在測「壞掉時會怎樣」——上一條測的是現況是好的，兩者少一個都不夠：
    只驗現況，守門哪天被拿掉也沒人知道。
    """
    with pytest.raises(ValueError) as err:
        build_module.check_chronic_docs({
            "topics": [{"key": "dm", "docs": [{"file": "根本沒有這一份.pdf"}]}]
        })
    assert "根本沒有這一份.pdf" in str(err.value)
    assert "健保條文" in str(err.value)


def test_risk_ladder_matches_the_thresholds_in_logic_js():
    """階梯上的數字必須與 src/logic.js 的 LIPID_ONE 逐項相同。

    這一頁與血脂計算機是同一套判定的兩個出口：一個給人讀、一個算給人看。
    講的若不是同一套數字，比兩邊都沒有還糟——醫師會照頁面上的門檻開藥，
    卻拿計算機的結果貼病歷。logic.js 是零 DOM 的純模組、讀不到資料檔，
    只能兩邊各留一份，所以這裡比對（同 test_topic_keys_match_the_mirror_in_state_js）。

    判準文字本身不比對：那是逐條照官方「ASCVD風險等級定義」寫的，
    logic.js 那邊為了計算另有一套措辭，兩者不必逐字相同。
    """
    lipid = [t for t in load_raw()["topics"] if t["key"] == "lipid"][0]
    ladder = lipid.get("riskLadder")
    assert ladder, "lipid 主題要有 riskLadder"

    src = (ROOT / "src" / "logic.js").read_text(encoding="utf-8")
    block = re.search(r"const LIPID_ONE = \[(.*?)\];", src, re.S)
    assert block, "logic.js 找不到 LIPID_ONE"
    rows = re.findall(
        r"label:\s*'([^']+)',\s*ldl:\s*(\d+),\s*nonHdl:\s*(\d+|null),\s*parallel:\s*(true|false)",
        block.group(1))
    assert len(rows) == len(ladder["levels"]), (
        f"級數不一致：logic.js {len(rows)} 級、riskLadder {len(ladder['levels'])} 級")

    for (label, ldl, non_hdl, parallel), lv in zip(rows, ladder["levels"]):
        where = f"{label} vs {lv['label']}"
        assert label == lv["label"], f"分級名稱或順序不一致：{where}"
        assert int(ldl) == lv["ldl"], f"{where}：LDL-C 門檻 {ldl} != {lv['ldl']}"
        expected_non_hdl = None if non_hdl == "null" else int(non_hdl)
        assert expected_non_hdl == lv.get("nonHdl"), (
            f"{where}：non-HDL-C {non_hdl} != {lv.get('nonHdl')}")
        assert (parallel == "true") == bool(lv["parallel"]), f"{where}：可否並行不一致"

    build_module.check_risk_ladder({k: v for k, v in load_raw().items() if k != "_schema"})


def test_table_one_drug_list_only_names_drugs_available_in_taiwan():
    """表一用藥清單：每一類都要有學名、給付狀態與 covered 旗標。

    使用者 2026-09-01：「表一是用的藥物有哪些也寫出來（僅列台灣有的）」。
    條文的處方規定欄只寫類別（statin、ezetimibe、PCSK9 單株抗體、siRNA、
    ATP citrate lyase 抑制劑），不知道對應哪些藥等於沒寫。

    covered 是這一塊最要緊的欄位：表一把 siRNA 與 ATP citrate lyase 抑制劑
    列為未達標時可考慮的選項，健保卻沒收載——只列學名不標狀態，
    等於引導醫師開一個病人要自費的藥。
    """
    lipid = [t for t in load_raw()["topics"] if t["key"] == "lipid"][0]
    drugs = lipid.get("drugs")
    assert drugs, "lipid 主題要有 drugs"
    klasses = [g["klass"] for g in drugs["groups"]]
    assert len(klasses) == len(set(klasses)), klasses
    for g in drugs["groups"]:
        assert g["items"], f"{g['klass']} 沒有列學名"
        assert str(g.get("cover") or "").strip(), f"{g['klass']} 沒有給付狀態"
        assert isinstance(g.get("covered"), bool), f"{g['klass']} 的 covered 不是布林"
    # 五類都要在：條文原文點名的就是這五類
    joined = "／".join(klasses)
    for kw in ("statin", "ezetimibe", "PCSK9", "siRNA", "ATP citrate lyase"):
        assert kw in joined, f"表一點名的「{kw}」沒有列：{klasses}"
    # 健保沒收載的那兩類要標成 covered=False
    selfpay = {g["klass"] for g in drugs["groups"] if g["covered"] is False}
    assert any("siRNA" in k for k in selfpay), selfpay
    assert any("ATP citrate lyase" in k for k in selfpay), selfpay
    build_module.check_drugs({k: v for k, v in load_raw().items() if k != "_schema"})


def test_table_one_drug_list_keeps_fibrates_out():
    """fenofibrate／gemfibrozil 不屬於表一——它們走降三酸甘油酯那張表。

    混進來的話，醫師會拿表一的 LDL-C 門檻去開 fibrate，那是兩套完全不同的條件。
    """
    lipid = [t for t in load_raw()["topics"] if t["key"] == "lipid"][0]
    names = " ".join(n for g in lipid["drugs"]["groups"] for n in g["items"])
    for banned in ("fenofibrate", "gemfibrozil"):
        assert banned not in names, f"表一用藥清單不該有 {banned}：{names}"


def test_missing_coverage_status_fails_the_build():
    with pytest.raises(ValueError) as err:
        build_module.check_drugs({"topics": [{
            "key": "lipid",
            "drugs": {"groups": [{"klass": "siRNA", "items": ["inclisiran"]}]},
        }]})
    assert "給付狀態" in str(err.value) and "siRNA" in str(err.value)


def test_every_risk_level_spells_out_the_non_drug_column():
    """每一級都要寫出官方「非藥物治療」欄的原文，不能只留一個徽章。

    使用者 2026-09-01 的原話：「可併行什麼? 3-6個月什麼? 請寫清楚」。
    官方那一欄有三種寫法（極高／非常高一種、高風險一種、中／低／0 項一種），
    壓成兩個字就把「並行的是什麼」「要先做的是什麼」都丟掉了。
    """
    lipid = [t for t in load_raw()["topics"] if t["key"] == "lipid"][0]
    for lv in lipid["riskLadder"]["levels"]:
        nd = lv.get("nonDrug") or ""
        assert nd, f"{lv['label']} 沒有寫非藥物治療"
        assert lv.get("nonDrugPlain"), f"{lv['label']} 沒有白話結論"
        if lv["parallel"]:
            assert "與藥物治療並行" in nd, f"{lv['label']}：{nd}"
        else:
            assert "3–6 個月" in nd and "生活型態" in nd, f"{lv['label']}：{nd}"
    # 官方那一欄只有三種寫法，不該長出第四種
    assert len({lv["nonDrug"] for lv in lipid["riskLadder"]["levels"]}) == 3


def test_risk_ladder_lists_all_six_cardiovascular_risk_factors():
    """中／低／0 項那三級要數的 6 項風險因子必須寫出來——不然「風險因子 2 項」是空話。"""
    lipid = [t for t in load_raw()["topics"] if t["key"] == "lipid"][0]
    factors = lipid["riskLadder"]["factors"]["items"]
    assert len(factors) == 6, factors
    for keyword in ("高血壓", "45", "家族史", "HDL-C", "抽菸", "代謝症候群"):
        assert any(keyword in f for f in factors), f"6 項裡找不到「{keyword}」：{factors}"


def test_broken_risk_ladder_fails_the_build():
    with pytest.raises(ValueError) as err:
        build_module.check_risk_ladder({"topics": [{
            "key": "lipid",
            "riskLadder": {"levels": [{"label": "極高風險", "ldl": "55", "criteria": ["x"]}]},
        }]})
    assert "ldl" in str(err.value) and "極高風險" in str(err.value)


def test_table_two_only_list_is_complete_and_adds_up():
    """LIPID 的「不適用表一」清單要完整、而且 codeCount 對得上各成分加總。

    使用者要求把這批項目完整列出來（學名）。清單來源是健保署官方第二節 .docx 的
    2.6.1 對照表逐列讀出，再與同一份 PDF 抽取交叉比對（116 個健保代碼兩邊一致，
    2026-09-01）。這裡釘住的是**內部一致性**：畫面上會寫「限『不適用表一』的 N 個
    健保代碼」，底下列的成分加起來就必須是 N，否則那句話自相矛盾。
    """
    lipid = [t for t in load_raw()["topics"] if t["key"] == "lipid"][0]
    box = lipid.get("tableTwoOnly")
    assert box, "lipid 主題要有 tableTwoOnly"
    names = [i["name"] for i in box["ingredients"]]
    assert len(names) == len(set(names)), f"成分重複：{names}"
    assert sum(i["codeCount"] for i in box["ingredients"]) == box["codeCount"]
    assert box["codeCount"] > 0 and ISO_DATE.match(box["checked"])
    # 正向路徑：現況資料要過得了建置期守門
    build_module.check_table_two_only({k: v for k, v in load_raw().items() if k != "_schema"})


def test_table_two_only_has_no_standalone_fenofibrate():
    """官方表裡沒有單方 fenofibrate，只有 pravastatin ＋ fenofibrate 複方。

    這是 2026-09-01 對官方表核對時抓到的既有錯誤（舊資料把 fenofibrate 列成獨立成分）。
    釘住它，因為這個錯誤的方向很危險：讓人以為開單方 fenofibrate 要對表二，
    但那類品項其實走的是降三酸甘油酯那張表。
    """
    lipid = [t for t in load_raw()["topics"] if t["key"] == "lipid"][0]
    names = [i["name"] for i in lipid["tableTwoOnly"]["ingredients"]]
    assert "fenofibrate" not in names, names
    assert any("fenofibrate" in n and "複方" in n for n in names), names


def test_mismatched_code_count_fails_the_build():
    """加總對不上要讓建置停下來，訊息要指得出是哪個主題。"""
    with pytest.raises(ValueError) as err:
        build_module.check_table_two_only({"topics": [{
            "key": "lipid",
            "tableTwoOnly": {"codeCount": 99,
                             "ingredients": [{"name": "statin", "codeCount": 3}]},
        }]})
    assert "codeCount" in str(err.value) and "lipid" in str(err.value)


def test_displayed_fields_carry_no_markdown_markers():
    """會顯示的欄位裡不得有 ** —— 渲染層刻意不解析 markdown，寫了就是字面兩顆星。

    不解析是有理由的：條文斷段有「textContent 必須逐字等於資料檔原文」的不變量
    （splitSentences，E2E 直接比對），把 **…** 變成 <b> 就會破壞它。
    所以規則是欄位存純文字、要強調就靠用字。

    `_schema` 不在檢查範圍：它是給維護者看的欄位說明，build 會剝掉、不進 dist。
    """
    raw = load_raw()
    fields = ("text", "detail", "headline", "lede", "caution", "title", "note")
    bad = []

    def walk(node, where):
        if isinstance(node, dict):
            for k, v in node.items():
                if k in fields and isinstance(v, str) and "**" in v:
                    bad.append(f"{where}.{k}：{v[:60]}")
                else:
                    walk(v, f"{where}.{k}")
        elif isinstance(node, list):
            for i, v in enumerate(node):
                walk(v, f"{where}[{i}]")

    walk(raw.get("topics"), "topics")
    assert not bad, ("顯示欄位含 markdown 記號（畫面上會是字面星號）：\n  "
                     + "\n  ".join(bad))


def test_effective_window_start_is_not_after_its_end():
    bad = [
        f"{key}/{kind}：{item.get('effectiveFrom')} → {item.get('effectiveTo')}"
        for key, kind, item in iter_items(load_raw())
        if item.get("effectiveFrom") and item.get("effectiveTo")
        and str(item["effectiveFrom"]) > str(item["effectiveTo"])
    ]
    assert not bad, "生效日晚於截止日：\n" + "\n".join(bad)


def test_topic_keys_match_the_mirror_in_state_js():
    """state.js 是零 DOM 的純模組，讀不到這份資料，只能各留一份鏡像。

    兩邊分歧的後果不是報錯，是「按鈕點了沒反應」——store 會擋掉不認得的 key，
    畫面完全沒有回饋。所以要在測試裡把兩份釘在一起。
    """
    mirror = re.search(r"const CHRONIC_TOPICS = \[([^\]]*)\]", STATE_JS.read_text(encoding="utf-8"))
    assert mirror, "state.js 找不到 CHRONIC_TOPICS"
    js_keys = sorted(re.findall(r"'([^']+)'", mirror.group(1)))
    json_keys = sorted(t.get("key") for t in load_raw()["topics"])
    assert js_keys == json_keys == sorted(build_module.CHRONIC_TOPIC_KEYS)


# ── 建置期時效檢查 ────────────────────────────────────────────────────────────
def test_current_data_passes_the_freshness_gate():
    """負面對照：今天這份資料應該是乾淨的，否則後面「會警告」的測試無從解讀。"""
    report = build_module.check_chronic_care(build_module.load_chronic_care())
    assert report["warnings"] == []
    assert report["items"] > 0


@pytest.mark.parametrize(
    "offset_days, expect_warning",
    [(0, False), (-1, True), (1, False)],
)
def test_freshness_boundary_is_exactly_the_configured_months(offset_days, expect_warning):
    """門檻當天不算過期，早一天才算——邊界寫死，免得「大概六個月」慢慢漂。"""
    today = date(2026, 8, 19)
    cutoff = build_module._months_before(today, build_module.CHRONIC_CHECK_MAX_MONTHS)
    assert cutoff == date(2026, 2, 19)
    checked = cutoff + timedelta(days=offset_days)
    report = build_module.check_chronic_care(
        fake_topics([ok_item(checked=checked.isoformat())]), today=today
    )
    assert bool(report["warnings"]) is expect_warning
    if expect_warning:
        assert "已超過 6 個月" in report["warnings"][0]


def test_month_arithmetic_clamps_to_the_end_of_a_shorter_month():
    assert build_module._months_before(date(2026, 8, 31), 6) == date(2026, 2, 28)
    assert build_module._months_before(date(2026, 3, 15), 6) == date(2025, 9, 15)


@pytest.mark.parametrize(
    "item, fragment",
    [
        ({"text": "無日期", "source": "某公告"}, "checked 缺漏"),
        ({"text": "壞日期", "source": "某公告", "checked": "115/07/23"}, "checked 缺漏"),
        ({"text": "無出處", "checked": "2026-08-01"}, "缺 source"),
    ],
)
def test_malformed_items_are_reported_not_silently_accepted(item, fragment):
    report = build_module.check_chronic_care(fake_topics([item]), today=date(2026, 8, 19))
    assert any(fragment in w for w in report["warnings"]), report["warnings"]


def test_topic_key_drift_is_reported():
    drifted = {"topics": [{"key": "dm", "sections": []}, {"key": "chol", "sections": []}]}
    report = build_module.check_chronic_care(drifted, today=date(2026, 8, 19))
    assert any("CHRONIC_TOPICS" in w for w in report["warnings"])


def test_empty_topics_are_tolerated():
    """開發期 sections 就是空的，那不是錯誤，不該吵。"""
    report = build_module.check_chronic_care(
        {"topics": [{"key": k, "sections": []} for k in build_module.CHRONIC_TOPIC_KEYS]},
        today=date(2026, 8, 19),
    )
    assert report["warnings"] == []
    assert report["items"] == 0
    assert report["oldest"] is None


def test_report_banner_is_hard_to_miss_and_names_the_threshold():
    report = build_module.check_chronic_care(
        fake_topics([ok_item(checked="2020-01-01")]), today=date(2026, 8, 19)
    )
    text = build_module.format_chronic_report(report)
    assert "【警告】" in text and "=" * 20 in text
    assert "2026-02-19" in text                      # 門檻日期要寫出來，不能只說「太舊」
    assert "建置不因此失敗" in text
    assert "chronic_care.json" in text               # 要修的檔案路徑


def test_stale_data_warns_loudly_but_never_fails_the_build(monkeypatch, capsys):
    """核心取捨：過期要吼，但**不能讓醫師沒工具可用**。

    用真實輸入跑一次完整 main()，只把時效報告換成過期的——證明的是「建置照樣成功、
    dist 照樣產出」，不是某個被隔離的函式回傳了什麼。
    """
    stale = build_module.check_chronic_care(
        fake_topics([ok_item(checked="2019-01-01")]), today=date(2026, 8, 19)
    )
    monkeypatch.setattr(build_module, "check_chronic_care", lambda *a, **k: stale)
    build_module.main()                              # 不得丟例外
    out = capsys.readouterr().out
    assert "【警告】" in out
    assert "assert_offline：通過" in out             # 其餘建置流程沒有被跳過
    assert DIST.exists() and DIST.stat().st_size > 1_000_000


# ── 內嵌結果 ──────────────────────────────────────────────────────────────────
def test_dist_embeds_chronic_care_and_drops_the_schema_block():
    html = DIST.read_text(encoding="utf-8")
    match = re.search(r"window\.CHRONIC_CARE = (\{.*?\});\n</script>", html, re.S)
    assert match, "dist 找不到 window.CHRONIC_CARE"
    embedded = json.loads(match.group(1))
    assert "_schema" not in embedded, "_schema 是給維護者看的說明，不該進 dist"
    assert [t["key"] for t in embedded["topics"]] == list(build_module.CHRONIC_TOPIC_KEYS)
    raw = load_raw()
    assert embedded["topics"] == raw["topics"], "內嵌內容必須與原始檔逐字相同"


def test_chronic_care_stays_out_of_the_icd_code_validation_path():
    """chronic_care.json 一個 ICD 代碼都沒有，被拉進代碼驗證只會炸出整片假錯誤。"""
    assert build_module.CHRONIC_CARE_FILE not in build_module.CURATED_KEYS
    curated_labels_input = set(build_module.CURATED_KEYS.values())
    assert "chronicCare" not in curated_labels_input
