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

def test_no_duplicate_within_each_quick_list():
    """驗證兩種 curated 格式皆無不當重複碼：
    - 快選格式（單一 [[code,label], ...] 陣列）：整份清單不可有重複碼。
    - 面板格式（[{"name":.., "codes":[[code,label],...]}, ...]）：檢查『每個面板內部』不可重複碼；
      跨面板重複允許（同一碼可能同時服務不同臨床情境，如 Z47.89 同時出現在「傷口處置／術後」與
      「扭傷／拉傷」面板）。
    """
    for name in ["chronic.json", "infectious.json", "pathogens.json", "surgical_quick.json"]:
        f = CURATED_DIR / name
        if not f.exists():
            continue
        codes = [c for c, _ in json.loads(f.read_text(encoding="utf-8"))]
        assert len(codes) == len(set(codes)), f"{name} 有重複碼"

    for name in ["symptoms.json", "surgical_panels.json"]:
        f = CURATED_DIR / name
        if not f.exists():
            continue
        panels = json.loads(f.read_text(encoding="utf-8"))
        for panel in panels:
            codes = [c for c, _ in panel["codes"]]
            assert len(codes) == len(set(codes)), f"{name} 面板「{panel['name']}」內有重複碼"
