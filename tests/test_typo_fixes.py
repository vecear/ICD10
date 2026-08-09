"""E1：健保署原始檔錯字修正（build/convert.py 的 TYPO_FIXES）守門測試。

為什麼不能只比對「修了幾筆 vs 表裡有幾筆」：那是套套邏輯——表裡刪掉一筆時，
`fixed` 與 `len(TYPO_FIXES)` 會同時變少，`assert fixed == len(TYPO_FIXES)` 照樣通過。

本檔改用「獨立寫死的期望字串」當基準，對兩個地方交叉驗證：
  (a) build/convert.py 的 TYPO_FIXES 表本身（原文＋修正後字串逐字比對、筆數固定 10）
  (b) 現行產出的 data/codes.min.json（每一筆修正結果實際存在，且原始錯字字串已絕跡）
任何一筆被刪、被改壞，或原始檔改版導致修正失效，pytest 都會紅。

EXPECTED_FIXES 是刻意重複抄寫的期望值，**不可**改成從 convert.TYPO_FIXES 匯入，
否則本檔會退化回套套邏輯。要新增／調整修正筆數時，兩邊都要改，並更新 EXPECTED_COUNT。
"""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "build"))
from convert import TYPO_FIXES

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "codes.min.json"

EXPECTED_COUNT = 10

# code -> (健保署原始檔中的錯字原文, 修正後應有的中文名)
# 依據：G72.41/I70.499 用了簡體「内/体」；8 筆 fistula 的「瘻」缺字成「?」
EXPECTED_FIXES = {
    "G72.41": ("内含体肌病變[IBM]", "內含體肌病變[IBM]"),
    "I70.499": (
        "未明示四肢自体靜脈繞道手術後之動脈粥樣硬化",
        "未明示四肢自體靜脈繞道手術後之動脈粥樣硬化",
    ),
    "K11.4": ("唾液腺?管", "唾液腺瘻管"),
    "K38.3": ("闌尾?管", "闌尾瘻管"),
    "K50.013": ("小腸克隆氏病併?管", "小腸克隆氏病併瘻管"),
    "K50.813": ("小腸及大腸克隆氏病併?管", "小腸及大腸克隆氏病併瘻管"),
    "K51.213": ("潰瘍性（慢性）直腸炎併?管", "潰瘍性（慢性）直腸炎併瘻管"),
    "K51.313": ("潰瘍性（慢性）直腸乙狀結腸炎併?管", "潰瘍性（慢性）直腸乙狀結腸炎併瘻管"),
    "K51.413": ("結腸發炎性息肉併?管", "結腸發炎性息肉併瘻管"),
    "K51.513": ("左側結腸炎併?管", "左側結腸炎併瘻管"),
}


@pytest.fixture(scope="module")
def zh_by_code():
    if not DATA.exists():
        pytest.skip("codes.min.json 不存在，先跑 build/convert.py")
    rows = json.loads(DATA.read_text(encoding="utf-8"))
    return {r[0]: r[3] for r in rows}


def test_typo_fix_table_matches_expected_entries():
    """表本身不得被刪筆／改壞：鍵集合、原文、修正後字串、總筆數逐一比對。"""
    assert len(EXPECTED_FIXES) == EXPECTED_COUNT, "本檔期望表被改動，請確認是刻意調整"
    missing = sorted(set(EXPECTED_FIXES) - set(TYPO_FIXES))
    extra = sorted(set(TYPO_FIXES) - set(EXPECTED_FIXES))
    assert not missing, f"TYPO_FIXES 少了這些代碼（被刪除？）: {missing}"
    assert not extra, f"TYPO_FIXES 多了未經確認的代碼: {extra}"
    assert len(TYPO_FIXES) == EXPECTED_COUNT, f"TYPO_FIXES 筆數 {len(TYPO_FIXES)} != {EXPECTED_COUNT}"
    wrong = [
        f"{code}: 表內 {TYPO_FIXES[code]!r} != 期望 {pair!r}"
        for code, pair in EXPECTED_FIXES.items()
        if tuple(TYPO_FIXES[code]) != pair
    ]
    assert not wrong, "TYPO_FIXES 內容與期望不符:\n" + "\n".join(wrong)


def test_generated_data_has_every_fixed_string(zh_by_code):
    """現行產出的 codes.min.json 必須逐筆帶有修正後字串（修正真的生效過）。"""
    bad = []
    for code, (_, fixed) in EXPECTED_FIXES.items():
        actual = zh_by_code.get(code)
        if actual != fixed:
            bad.append(f"{code}: 實際 {actual!r} != 期望 {fixed!r}")
    assert not bad, "codes.min.json 錯字修正未生效（請重跑 build/convert.py）:\n" + "\n".join(bad)


def test_generated_data_has_no_original_typo_string(zh_by_code):
    """原始錯字字串不得殘留在任何一筆中文名（含被其他代碼沿用的情形）。"""
    originals = {original for original, _ in EXPECTED_FIXES.values()}
    hits = sorted(
        f"{code}: {zh!r}"
        for code, zh in zh_by_code.items()
        for original in originals
        if original in zh
    )
    assert not hits, "codes.min.json 仍含未修正的錯字原文:\n" + "\n".join(hits[:10])


def test_fixed_codes_carry_no_simplified_or_missing_glyph(zh_by_code):
    """修正後這 10 筆不得再出現簡體「内/体」或缺字「?」。"""
    bad = []
    for code in EXPECTED_FIXES:
        zh = zh_by_code.get(code, "")
        for ch in ("内", "体", "?", "？", "�"):
            if ch in zh:
                bad.append(f"{code}: {zh!r} 仍含 {ch!r}")
    assert not bad, "修正後仍有簡體字／缺字:\n" + "\n".join(bad)
