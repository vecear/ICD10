"""臨床不變量：把歷次審查裁定過的臨床決策釘死，避免下一輪內容擴充靜默覆蓋。

為什麼需要這個檔：
2026-08-11 的內容擴充把「疫苗接種與預防」面板的 15 個疫苗可預防疾病碼加了回來——
那組碼在前一輪已被判定為虛偽申報風險而移除，但擴充者不知情，於是缺陷復活。
單靠報告與人的記憶擋不住這件事，只有測試擋得住。

新增不變量的原則：**寫意圖，不要寫當初的修法**。
例如「H10.45 不得存在」是修法（後來標籤改對就不再是問題，該斷言反而變成假警報）；
「標籤不得與官方名語意衝突」才是意圖。
"""
import io
import json
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
CURATED = ROOT / "src" / "curated"


def load(name):
    return json.loads((CURATED / name).read_text(encoding="utf-8"))


def panels(doc):
    for group in doc:
        for panel in group["panels"]:
            yield group["name"], panel


def pairs(panel, *layers):
    for layer in layers:
        for code, label in (panel.get(layer) or []):
            yield layer, code, label


INTERNAL_FILES = ("internal_outpatient.json", "internal_emergency.json")
LIST_FILES = ("chronic.json", "infectious.json", "pathogens.json",
              "emergency_quick.json", "surgical_quick.json")


def all_positions():
    """全部 curated 檔的 (來源, 面板, 代碼, 標籤)，讓不變量能一次涵蓋所有入口。"""
    for fname in INTERNAL_FILES:
        for _, panel in panels(load(fname)):
            for _, code, label in pairs(panel, "chief", "diseases", "redFlags"):
                yield fname, panel["name"], code, label
    for panel in load("surgical_panels.json"):
        for code, label in panel["codes"]:
            yield "surgical_panels.json", panel["name"], code, label
    for fname in LIST_FILES:
        for code, label in load(fname):
            yield fname, "-", code, label


def all_panels():
    """(來源說明, [(代碼, 標籤), ...])：以「同一張畫面上看得到的碼」為單位。"""
    for fname in INTERNAL_FILES:
        for _, panel in panels(load(fname)):
            yield f'{fname}／{panel["name"]}', [
                (code, label) for _, code, label in pairs(panel, "chief", "diseases", "redFlags")]
    for panel in load("surgical_panels.json"):
        yield f'surgical_panels.json／{panel["name"]}', [tuple(p) for p in panel["codes"]]


@pytest.fixture(scope="module")
def rows():
    return json.loads((ROOT / "data" / "codes.min.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def db(rows):
    return {r[0]: r for r in rows}


@pytest.fixture(scope="module")
def positive_version(rows, db):
    """官方名帶否定限定詞的碼 → 同義但「伴有」的可申報碼。

    用官方中文名做字串代換求得（「未伴有 X」→「伴有 X」／「併 X」），不是硬編對照表：
    資料換版時對應關係會自己跟著走，不會退化成過期的清單。
    """
    by_zh = {}
    for code, use, _en, zh in rows:
        if use == 1:
            by_zh.setdefault(zh, []).append(code)

    def lookup(code):
        zh = db[code][3]
        found = []
        for negative, positive in (("未伴有", "伴有"), ("未伴有", "併"),
                                   ("未提及", "併"), ("未伴", "伴")):
            if negative in zh:
                found += [c for c in by_zh.get(zh.replace(negative, positive), []) if c != code]
        return sorted(set(found))

    return lookup


# ── 虛偽申報 ────────────────────────────────────────────────────────────────
# 疫苗可預防疾病：病人來接種當下並沒有這些病，列成可選診斷等於引導虛偽申報。
VACCINE_PREVENTABLE = {
    "J11.1", "J10.1", "U07.1", "J13", "B02.9", "B16.9", "B15.9", "B01.9",
    "B05.9", "B06.9", "B26.9", "A37.90", "A35", "A36.9", "A39.9", "A40.3", "C53.9",
}


def test_vaccination_panel_lists_no_vaccine_preventable_disease():
    """接種面板只能列接種當下真的成立的碼（接種後反應、禁忌、高風險適應症）。"""
    hits = []
    for _, panel in panels(load("internal_outpatient.json")):
        if "疫苗" not in panel["name"] and "接種" not in panel["name"]:
            continue
        for layer, code, label in pairs(panel, "chief", "diseases"):
            if code in VACCINE_PREVENTABLE:
                hits.append(f'{panel["name"]}:{layer}:{code} {label}')
    assert not hits, "接種面板列出了疫苗要預防的疾病（虛偽申報風險）：\n" + "\n".join(hits)


def test_hematuria_panel_uses_with_hematuria_cystitis():
    """血尿主訴卡不得用「未伴血尿」的膀胱炎碼——那是自相矛盾的申報。"""
    for fname in ("internal_outpatient.json", "internal_emergency.json"):
        for _, panel in panels(load(fname)):
            if panel["name"] != "血尿":
                continue
            codes = {c for _, c, _ in pairs(panel, "chief", "diseases")}
            assert "N30.00" not in codes, f"{fname} 血尿卡用了 N30.00（未伴血尿）"
            assert "N30.01" in codes, f"{fname} 血尿卡缺 N30.01（伴血尿）"


# ── 病人安全：急診紅旗 ──────────────────────────────────────────────────────
REQUIRED_RED_FLAGS = {
    "意識改變": ["I60.9"],                    # 蜘蛛膜下腔出血常以意識改變表現
    "暈厥": ["I71.00"],                       # 主動脈剝離是致命六因之一
    "局部無力／疑似中風": ["I71.00"],          # 剝離累及頸動脈可表現偏癱，且是 tPA 絕對禁忌
}


def test_emergency_red_flags_keep_lethal_differentials():
    missing = []
    for _, panel in panels(load("internal_emergency.json")):
        for key, needed in REQUIRED_RED_FLAGS.items():
            if key not in panel["name"]:
                continue
            rf = {c for c, _ in (panel.get("redFlags") or [])}
            for code in needed:
                if code not in rf:
                    missing.append(f'{panel["name"]} 缺 {code}')
    assert not missing, "急診紅旗遺漏致命鑑別：\n" + "\n".join(missing)


def test_red_flags_offer_the_worst_case_version_of_the_code(positive_version):
    """紅旗的用途是抓「漏掉會死人」的那一種，不能只給排除了併發症的版本。

    ICD-10-CM 大量疾病分成「未伴有 X」與「伴有 X」兩支，而致命的永遠是後者
    （肺栓塞併急性肺性心臟病、DKA 併昏迷、嚴重敗血症併休克…）。
    紅旗欄位只放「未伴」版，等於在最該示警的地方放了一個排除最壞情況的按鈕。
    因此：紅旗上的碼若官方名帶否定限定詞，對應的「伴有」版必須在同一張面板選得到
    （放紅旗或疾病層都可以，重點是醫師點得到）。
    """
    missing = []
    for _, panel in panels(load("internal_emergency.json")):
        present = {code for _, code, _ in pairs(panel, "chief", "diseases", "redFlags")}
        for code, _ in (panel.get("redFlags") or []):
            for sibling in positive_version(code):
                if sibling not in present:
                    missing.append(f'{panel["name"]}：紅旗 {code} 缺對應的伴併發症版 {sibling}')
    assert not missing, "紅旗只給了排除最壞情況的版本：\n" + "\n".join(missing)


def test_red_flags_stay_within_signal_budget():
    """紅旗是本工具唯一的警示訊號，數量一多就失去作用。"""
    over = []
    for _, panel in panels(load("internal_emergency.json")):
        n = len(panel.get("redFlags") or [])
        if n > 7:
            over.append(f'{panel["name"]}: {n} 個')
    assert not over, "紅旗超過 7 個上限：\n" + "\n".join(over)


def test_outpatient_has_no_red_flags():
    """紅旗僅限急診；門診出現紅旗代表模式隔離在資料層就破了。"""
    leaked = [p["name"] for _, p in panels(load("internal_outpatient.json")) if p.get("redFlags")]
    assert not leaked, f"門診面板不得有 redFlags：{leaked}"


# ── 標籤不得誤導 ────────────────────────────────────────────────────────────
def test_seventh_character_labels_do_not_say_visit_sequence():
    """S/T 第七碼 A/D 分的是積極治療期與癒合期，不是第幾次就診。"""
    bad = []
    for panel in load("surgical_panels.json"):
        for code, label in panel["codes"]:
            if "初診" in label or "複診" in label:
                bad.append(f'{panel["name"]}:{code} {label}')
    for code, label in load("surgical_quick.json"):
        if "初診" in label or "複診" in label:
            bad.append(f"quick:{code} {label}")
    assert not bad, "第七碼標籤用了就診次序的說法：\n" + "\n".join(bad)


AMBIGUOUS_LABELS = {
    # 碼 → 標籤裡必須出現的其中一個字串（否則會被讀成別的疾病）。
    # 收錄門檻：全庫存在「伴有 X」的競爭碼，但它不在同一張面板上，
    # 所以 test_competing_qualifier_codes_in_one_panel_disclose_the_negation 抓不到，
    # 只能在這裡點名。純粹「官方名有未伴有但沒人會選錯」的碼不必列。
    "R68.83": ["未伴"],        # 寒顫（未伴發燒）：與同卡 R50.9 為 Excludes1 互斥
    "E11.10": ["第二型", "2 型"],   # DKA 典型是第一型，隱藏型別會選錯
    "E10.10": ["第一型", "1 型"],
    "M62.81": ["肌肉無力", "廣泛"],  # 只寫「肌無力」會被讀成重症肌無力
    "I26.99": ["未伴"],        # 未伴急性肺性心臟病＝排除了大範圍 PE
    "G70.00": ["未伴"],        # 未伴急性惡化＝排除了肌無力危象
    "K72.90": ["未伴昏迷"],     # 曾被標成「肝性腦病變」，與官方名語意相反
    "K21.9": ["未伴食道炎"],
    "K29.70": ["未伴出血"],
    "K85.90": ["未伴壞死"],
    "K58.9": ["未伴腹瀉"],
    "K57.32": ["未伴穿孔"],
    "K80.20": ["未伴膽囊炎"],
    "K40.90": ["未伴阻塞或壞疽"],
    "K41.90": ["未伴阻塞或壞疽"],
    "K42.9": ["未伴阻塞或壞疽"],
    "K43.9": ["未伴阻塞或壞疽"],
    "K43.2": ["未伴阻塞或壞疽"],
    "K44.9": ["未伴阻塞或壞疽"],
    "K46.9": ["未伴阻塞或壞疽"],
    "B02.9": ["未伴併發"],
    "B27.90": ["未伴併發"],
    "B18.1": ["未伴 D 型"],
    "A04.72": ["非復發"],      # 復發型是 A04.71，療程完全不同
    "J11.1": ["呼吸道"],       # 併肺炎是 J11.00
    "J47.9": ["未併發"],
    "E11.9": ["未伴併發"],
    "E79.0": ["未伴"],
    "J45.909": ["無併發症"],
    "F03.90": ["無行為障礙"],   # 伴行為障礙是 F03.91
    "M47.812": ["未伴脊髓"],
    "M47.816": ["未伴脊髓"],
    "L97.509": ["未明示嚴重度"],  # 嚴重度決定清創與住院
}


def test_labels_do_not_hide_disambiguating_qualifiers():
    """限定詞被藏在官方名裡、標籤沒寫出來，醫師照著點就會選到語意相反的碼。"""
    bad = []
    for fname, panel_name, code, label in all_positions():
        need = AMBIGUOUS_LABELS.get(code)
        if need and not any(token in label for token in need):
            bad.append(f"{fname}:{panel_name}:{code} 標籤「{label}」缺少 {need}")
    assert not bad, "標籤隱藏了會改變選碼的限定詞：\n" + "\n".join(bad)


def test_one_code_keeps_one_label_everywhere_in_a_mode():
    """同一個代碼在門診與急診必須是同一個按鈕字。

    兩個模式標籤不同時，資訊少的那一側就是陷阱——而過去恰好是急診側較短
    （急診更趕、更需要限定詞攤開）。同一檔內同碼兩種寫法也一樣不可以。
    """
    seen = {}
    clashes = []
    for fname, panel_name, code, label in all_positions():
        if fname not in INTERNAL_FILES:
            continue
        if code in seen and seen[code][0] != label:
            clashes.append(f'{code}：「{seen[code][0]}」（{seen[code][1]}）'
                           f' vs 「{label}」（{fname}／{panel_name}）')
        seen.setdefault(code, (label, f"{fname}／{panel_name}"))
    assert not clashes, "同一代碼在不同位置顯示不同標籤：\n" + "\n".join(sorted(set(clashes)))


NEGATION_PHRASE = re.compile(r"未(?:伴有|伴|併發|提及)[^，,、；;。]*")


def test_competing_qualifier_codes_in_one_panel_disclose_the_negation(db):
    """同一面板同時擺著「排除併發症」與「有併發症」兩版時，否定版標籤必須寫出否定。

    兩顆按鈕並排卻長得一樣（疝氣的「未伴阻塞或壞疽」與「併阻塞」都只寫「腹股溝疝氣」、
    撕裂傷的「未伴異物」與「併異物」都只寫「頭皮撕裂傷」），等於要醫師背代碼；
    而選錯的那一邊正好是要開刀／要探查的那一型。

    判定方式：官方名裡的否定片語（「未伴有阻塞或壞疽」…）若在同面板同類目的另一個碼上不成立，
    兩者就是競爭關係，標籤非寫出否定不可。用片語比對而不是碼對碼的清單，
    才擋得住官方名措辭不對稱的情形（K40.90「未伴有阻塞或壞疽」vs K40.30「併阻塞，未伴有壞疽」）。
    """
    bad = []
    for source, code_labels in all_panels():
        for code, label in code_labels:
            if any(token in label for token in ("未伴", "未併", "無")):
                continue
            for phrase in NEGATION_PHRASE.findall(db[code][3]):
                rivals = [other for other, _ in code_labels
                          if other != code and other[:3] == code[:3]
                          and phrase not in db[other][3]]
                if rivals:
                    bad.append(f'{source}：{code}「{label}」未揭露「{phrase}」，'
                               f"同面板競爭碼 {rivals}")
                    break
    assert not bad, "同面板競爭碼的標籤分不出伴／未伴：\n" + "\n".join(bad)


def test_encounter_labels_follow_the_english_name(db):
    """第七碼的照護階段以官方英文名為準——健保中文名有誤譯。

    實例：`S81.819D` 的官方中文寫成「…之後遺症」，英文卻是 subsequent encounter。
    跟著中文標成「後遺症」會把癒合期回診寫成 sequela（S），申報與病歷都錯。
    """
    bad = []
    for fname, panel_name, code, label in all_positions():
        row = db.get(code)
        flat = code.replace(".", "")
        if not row or len(flat) != 7 or flat[0] not in "ST" or flat[6] not in "ADS":
            continue          # 只有帶第七碼的損傷／併發症碼才有照護階段可言
        english = row[2].lower()
        for token, expected in (("初期照護", "initial encounter"),
                                ("後續照護", "subsequent encounter"),
                                ("後遺症", "sequela")):
            if token in label and expected not in english:
                bad.append(f'{fname}:{panel_name}:{code} 標籤「{label}」與英文名不符：{row[2]}')
    assert not bad, "照護階段標籤與官方英文名不符：\n" + "\n".join(bad)


def test_injury_codes_offer_both_initial_and_subsequent_encounter():
    """外科每個傷害碼都要同時給得出初期（A）與後續（D）版。

    只給 A 會逼醫師在癒合期回診時沿用 A（申報錯誤）；只給 D 同理。
    """
    codes = {code for panel in load("surgical_panels.json") for code, _ in panel["codes"]}
    missing = []
    for code in sorted(codes):
        flat = code.replace(".", "")
        if len(flat) != 7 or flat[0] not in "ST" or flat[6] not in "AD":
            continue
        other = code[:-1] + ("D" if code.endswith("A") else "A")
        if other not in codes:
            missing.append(f"{code} 缺對應的 {other}")
    assert not missing, "外科傷害碼的 A／D 沒有配對：\n" + "\n".join(missing)


# ── 附加碼不可當主診斷 ──────────────────────────────────────────────────────
def _is_adverse_effect(code):
    """藥物不良作用碼（T36–T50 第六碼 5）：官方規定先碼表現，本身永遠是次診斷。"""
    flat = code.replace(".", "")
    if len(flat) != 7 or flat[0] != "T" or flat[5] != "5" or flat[6] not in "ADS":
        return False
    return flat[1:3].isdigit() and 36 <= int(flat[1:3]) <= 50


def _is_adjunct(code):
    return (code.startswith(("B95", "B96", "B97", "Z16"))
            or code[:1] in "VWXY"
            or _is_adverse_effect(code))


def test_adjunct_codes_are_marked_in_panels():
    """病原體、抗藥性與外因碼只能當次診斷；面板上要看得出來，否則會被當主診斷送出去。"""
    bad = []
    for fname in ("internal_outpatient.json", "internal_emergency.json"):
        for _, panel in panels(load(fname)):
            for layer, code, label in pairs(panel, "chief", "diseases", "redFlags"):
                if _is_adjunct(code) and "附加碼" not in label:
                    bad.append(f'{fname}:{panel["name"]}:{code} {label}')
    for panel in load("surgical_panels.json"):
        for code, label in panel["codes"]:
            if _is_adjunct(code) and "附加碼" not in label:
                bad.append(f'surgical:{panel["name"]}:{code} {label}')
    assert not bad, "附加碼未標示，可能被當主診斷：\n" + "\n".join(bad)
