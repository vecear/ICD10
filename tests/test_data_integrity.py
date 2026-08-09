import io, json, re
from pathlib import Path
import pytest

DATA = Path(__file__).resolve().parent.parent / "data" / "codes.min.json"
# 簡體專用字集（繁簡共用字不可入列，見全域 environment-gotchas）
SIMPLIFIED = set("们这时东买卖说话开关进过还没体医药区实现么头几内")

@pytest.fixture(scope="module")
def rows():
    if not DATA.exists():
        pytest.skip("codes.min.json 不存在，先跑 build/convert.py")
    return json.loads(DATA.read_text(encoding="utf-8"))

def test_counts(rows):
    assert len(rows) == 96802
    assert sum(1 for r in rows if r[1] == 1) == 73681

def test_no_replacement_char(rows):
    assert not [r for r in rows if "�" in r[2] or "�" in r[3]]

def test_no_question_mark_in_zh(rows):
    # CSV 舊來源的 Big5 缺字災情以字面「?」呈現；xlsx＋TYPO_FIXES 後應為 0
    bad = [r[0] for r in rows if "?" in r[3] or "？" in r[3]]
    assert not bad, f"中文名含問號（缺字未修）: {bad[:10]}"

def test_code_format(rows):
    pat = re.compile(r"^[A-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?$")
    bad = [r[0] for r in rows if not pat.match(r[0])]
    assert not bad, f"格式異常代碼（前10）: {bad[:10]}"

def test_no_simplified_chars(rows):
    hits = [(r[0], ch) for r in rows for ch in SIMPLIFIED if ch in r[3]]
    assert not hits, f"疑似簡體字（前10，若為誤報請將該字自 SIMPLIFIED 移除並註記）: {hits[:10]}"

def test_all_have_names(rows):
    assert not [r for r in rows if not r[2] or not r[3]]
