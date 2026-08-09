import io, json, re
from pathlib import Path
import pytest

ROOT = Path(__file__).resolve().parent.parent
CURATED_DIR = ROOT / "src" / "curated"

# ICD-10-CM 代碼外形：1 個大寫字母 + 1 位數字 + 1 位英數字（涵蓋 C4A/M1A/O9A/Z3A
# 這類第3碼是字母的類目），後面可接「.」+ 1-4 位英數字。
# 用真實代碼外形取代「長度/開頭字母/含數字」的粗略啟發式——後者在 Python 下會誤判：
# str.isalpha() 對中文字元也回傳 True，導致「第2型糖尿病」「CKD 3a」「COVID-19」
# 這類含數字的中文/英文標籤被誤認成代碼（≤8 字元＋開頭是「字母」＋含數字，全部成立）。
CODE_SHAPE_RE = re.compile(r"^[A-Z]\d[A-Z0-9](\.[A-Z0-9]{1,4})?$")

@pytest.fixture(scope="module")
def leafset():
    rows = json.loads((ROOT / "data" / "codes.min.json").read_text(encoding="utf-8"))
    return {r[0] for r in rows if r[1] == 1}

def iter_codes(obj):
    """從任一 curated JSON 結構抽出所有代碼字串。"""
    if isinstance(obj, dict):                      # related.json: {code: [code,...]}
        for k, v in obj.items():
            if CODE_SHAPE_RE.match(k):
                yield k
            yield from iter_codes(v)
    elif isinstance(obj, list):
        if obj and isinstance(obj[0], str):        # [code, label] 或 [code, code, ...]
            yield obj[0]
            for x in obj[1:]:
                if isinstance(x, str) and CODE_SHAPE_RE.match(x):
                    yield x                        # related 值陣列的碼；label 不符合 ICD-10 代碼外形
        else:
            for x in obj:
                if isinstance(x, dict) and "codes" in x:   # 面板 {name, codes}
                    for c in x["codes"]:
                        yield c[0]
                else:
                    yield from iter_codes(x)

def test_all_curated_codes_are_billable_leaves(leafset):
    files = sorted(CURATED_DIR.glob("*.json"))
    assert files, "src/curated/ 下沒有 JSON"
    bad = []
    for f in files:
        data = json.loads(f.read_text(encoding="utf-8"))
        for code in iter_codes(data):
            if code not in leafset:
                bad.append(f"{f.name}: {code}")
    assert not bad, "非葉碼或不存在（用 build/lookup.py 查正確碼替換）:\n" + "\n".join(bad)


def test_internal_curated_modes_have_layered_panels():
    emergency = json.loads((CURATED_DIR / "internal_emergency.json").read_text(encoding="utf-8"))
    outpatient = json.loads((CURATED_DIR / "internal_outpatient.json").read_text(encoding="utf-8"))
    assert len(emergency) == 7
    assert len(outpatient) == 10
    assert all(region["panels"] for region in emergency + outpatient)
    assert all(
        panel.get("chief") and panel.get("diseases") and panel.get("related") is not None
        for region in emergency + outpatient
        for panel in region["panels"]
    )
    assert all(
        "redFlags" not in panel
        for region in outpatient
        for panel in region["panels"]
    )
    assert any(
        panel.get("redFlags")
        for region in emergency
        for panel in region["panels"]
    )


def test_internal_curated_modes_have_complete_disease_layers():
    for filename in ("internal_emergency.json", "internal_outpatient.json"):
        groups = json.loads((CURATED_DIR / filename).read_text(encoding="utf-8"))
        for region in groups:
            for panel in region["panels"]:
                assert panel.get("diseases"), f"{filename}/{panel['name']} 缺少 diseases"
                assert len(panel["diseases"]) >= 4, f"{filename}/{panel['name']} 疾病不足四項"
                chief_codes = {code for code, _ in panel["chief"]}
                disease_codes = [code for code, _ in panel["diseases"]]
                red_flag_codes = {code for code, _ in panel.get("redFlags", [])}
                assert len(disease_codes) == len(set(disease_codes))
                assert not chief_codes.intersection(disease_codes)
                assert not red_flag_codes.intersection(disease_codes)
                assert set(panel["related"]) == chief_codes
                assert all(panel["related"][code] for code in chief_codes)
                assert "diagnoses" not in panel


def test_no_duplicate_within_each_quick_list():
    """驗證兩種 curated 格式皆無不當重複碼：
    - 快選格式（單一 [[code,label], ...] 陣列）：整份清單不可有重複碼。
    - 面板格式（[{"name":.., "codes":[[code,label],...]}, ...]）：檢查『每個面板內部』不可重複碼；
      跨面板重複允許（同一碼可能同時服務不同臨床情境，如 Z47.89 同時出現在「傷口處置／術後」與
      「扭傷／拉傷」面板）。
    """
    for name in [
        "chronic.json",
        "infectious.json",
        "pathogens.json",
        "surgical_quick.json",
        "emergency_quick.json",
    ]:
        f = CURATED_DIR / name
        if not f.exists():
            continue
        codes = [c for c, _ in json.loads(f.read_text(encoding="utf-8"))]
        assert len(codes) == len(set(codes)), f"{name} 有重複碼"

    for name in ["surgical_panels.json", "internal_emergency.json", "internal_outpatient.json"]:
        f = CURATED_DIR / name
        if not f.exists():
            continue
        panels = json.loads(f.read_text(encoding="utf-8"))
        if name.startswith("internal_"):
            panels = [
                panel
                for region in panels
                for panel in region["panels"]
            ]
        for panel in panels:
            if "codes" in panel:
                codes = [c for c, _ in panel["codes"]]
            else:
                pairs = panel.get("chief", []) + panel.get("diseases", []) + panel.get("redFlags", [])
                codes = [c for c, _ in pairs]
            assert len(codes) == len(set(codes)), f"{name} 面板「{panel['name']}」內有重複碼"


def test_internal_region_and_panel_names_are_unique():
    """E3：群組（部位）名稱與同群組內面板名稱不得重複。

    重複的話 UI 會出現兩個同名分頁／兩張同名症狀卡，使用者無從分辨要點哪一個；
    E2E 以名稱定位元素（`[data-region=...]`、`.symptom-card[data-panel=...]`）也會
    因為 strict mode 命中多個而變得脆弱。
    """
    for filename in ("internal_emergency.json", "internal_outpatient.json"):
        groups = json.loads((CURATED_DIR / filename).read_text(encoding="utf-8"))
        region_names = [region["name"] for region in groups]
        dup_regions = sorted({n for n in region_names if region_names.count(n) > 1})
        assert not dup_regions, f"{filename} 群組名稱重複: {dup_regions}"

        for region in groups:
            panel_names = [panel["name"] for panel in region["panels"]]
            dup_panels = sorted({n for n in panel_names if panel_names.count(n) > 1})
            assert not dup_panels, f"{filename} 群組「{region['name']}」面板名稱重複: {dup_panels}"


def test_surgical_panel_names_are_unique():
    """外科模式是單層面板清單，同名面板一樣會讓使用者無從分辨。"""
    f = CURATED_DIR / "surgical_panels.json"
    if not f.exists():
        pytest.skip("surgical_panels.json 不存在")
    names = [panel["name"] for panel in json.loads(f.read_text(encoding="utf-8"))]
    dup = sorted({n for n in names if names.count(n) > 1})
    assert not dup, f"surgical_panels.json 面板名稱重複: {dup}"


def test_related_json_value_arrays_are_clean():
    """related.json（{code: [code, ...]} 關聯表）每個 key 的建議碼陣列：
    - 陣列內部不可有重複碼。
    - 不可包含 key 自身（自我建議無意義）。
    """
    f = CURATED_DIR / "related.json"
    if not f.exists():
        return
    related = json.loads(f.read_text(encoding="utf-8"))
    for key, values in related.items():
        assert len(values) == len(set(values)), f"related.json 的 \"{key}\" 陣列內有重複碼: {values}"
        assert key not in values, f"related.json 的 \"{key}\" 陣列內含自我參照"
