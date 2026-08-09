"""健保署官方 xlsx（ICD-10-CM 工作表）→ data/codes.min.json（[[code, use, en, zh], ...]）

含 TYPO_FIXES：修正健保署原始檔中 10 筆確定性錯字（簡體字/缺字），
每筆以「代碼＋原文完整比對」定點修正；修正筆數不符即失敗（防原始檔改版後靜默漂移）。
"""
import io, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "icd10_2023_official.xlsx"
OUT = ROOT / "data" / "codes.min.json"
SHEET = "ICD-10-CM"

# 健保署原始檔錯字定點修正表：code -> (原文, 修正後)
# 依據：G72.41/I70.499 用了簡體「内/体」；8 筆 fistula 的「瘻」缺字成「?」
TYPO_FIXES = {
    "G72.41": ("内含体肌病變[IBM]", "內含體肌病變[IBM]"),
    "I70.499": ("未明示四肢自体靜脈繞道手術後之動脈粥樣硬化", "未明示四肢自體靜脈繞道手術後之動脈粥樣硬化"),
    "K11.4": ("唾液腺?管", "唾液腺瘻管"),
    "K38.3": ("闌尾?管", "闌尾瘻管"),
    "K50.013": ("小腸克隆氏病併?管", "小腸克隆氏病併瘻管"),
    "K50.813": ("小腸及大腸克隆氏病併?管", "小腸及大腸克隆氏病併瘻管"),
    "K51.213": ("潰瘍性（慢性）直腸炎併?管", "潰瘍性（慢性）直腸炎併瘻管"),
    "K51.313": ("潰瘍性（慢性）直腸乙狀結腸炎併?管", "潰瘍性（慢性）直腸乙狀結腸炎併瘻管"),
    "K51.413": ("結腸發炎性息肉併?管", "結腸發炎性息肉併瘻管"),
    "K51.513": ("左側結腸炎併?管", "左側結腸炎併瘻管"),
}

def _clean(s):
    return " ".join(str(s).split())  # 去頭尾空白並正規化內嵌換行/連續空白

def parse_rows(rows):
    """rows: 可迭代的 tuple（第一列為表頭）。回傳 [[code, use, en, zh], ...]"""
    it = iter(rows)
    header = next(it)
    assert "ICD-10-CM" in _clean(header[0]) and _clean(header[1]).upper() == "USE", f"表頭不符預期: {header!r}"
    out = []
    for r in it:
        if not r or r[0] is None or not str(r[0]).strip():
            continue
        code = str(r[0]).strip().upper()
        use = 1 if str(r[1]).strip() == "1" else 0
        out.append([code, use, _clean(r[2]), _clean(r[3])])
    return out

def apply_typo_fixes(rows):
    fixed = 0
    for r in rows:
        fix = TYPO_FIXES.get(r[0])
        if fix and r[3] == fix[0]:
            r[3] = fix[1]
            fixed += 1
    return fixed

def main():
    sys.stdout.reconfigure(encoding="utf-8")
    import openpyxl
    wb = openpyxl.load_workbook(RAW, read_only=True)
    rows = parse_rows(wb[SHEET].iter_rows(values_only=True))
    codes = [r[0] for r in rows]
    assert len(codes) == len(set(codes)), "代碼重複"
    fixed = apply_typo_fixes(rows)
    assert fixed == len(TYPO_FIXES), f"錯字修正筆數 {fixed} != {len(TYPO_FIXES)}（原始檔可能已改版，請重新核對 TYPO_FIXES）"
    with io.open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(rows, f, ensure_ascii=False, separators=(",", ":"))
    n_leaf = sum(1 for r in rows if r[1] == 1)
    print(f"總筆數 {len(rows)}, 葉碼 {n_leaf}, 類目 {len(rows) - n_leaf}, 錯字修正 {fixed}")

if __name__ == "__main__":
    main()
