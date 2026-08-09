"""健保署官方 xlsx（ICD-10-CM 工作表）→ data/codes.min.json（[[code, use, en, zh], ...]）

含 TYPO_FIXES：修正健保署原始檔中 10 筆確定性錯字（簡體字/缺字），
每筆以「代碼＋原文完整比對」定點修正；修正筆數不符即失敗（防原始檔改版後靜默漂移）。
"""
import io, json, sys
from pathlib import Path

from fetch_data import is_current_source, sha256_file
from source_manifest import SOURCE_SHA256, SOURCE_SHEET, SOURCE_VERSION

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "icd10_2023_official.xlsx"
OUT = ROOT / "data" / "codes.min.json"
META = ROOT / "data" / "codes.min.meta.json"

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
EXPECTED_TYPO_COUNT = 10  # 釘死筆數，避免「表被刪一筆、修正數也少一筆」時斷言自我抵銷

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


def ensure_current_source(path):
    if not is_current_source(path):
        raise SystemExit(
            f"來源 XLSX 版本或 SHA-256 不符，請先執行 build/fetch_data.py：{path}"
        )


def write_metadata(rows):
    n_leaf = sum(1 for r in rows if r[1] == 1)
    metadata = {
        "sourceVersion": SOURCE_VERSION,
        "sourceSha256": SOURCE_SHA256,
        "dataSha256": sha256_file(OUT),
        "rowCount": len(rows),
        "leafCount": n_leaf,
    }
    with io.open(META, "w", encoding="utf-8", newline="\n") as f:
        json.dump(metadata, f, ensure_ascii=False, separators=(",", ":"))


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    ensure_current_source(RAW)
    import openpyxl

    wb = openpyxl.load_workbook(RAW, read_only=True)
    rows = parse_rows(wb[SOURCE_SHEET].iter_rows(values_only=True))
    codes = [r[0] for r in rows]
    assert len(codes) == len(set(codes)), "代碼重複"
    fixed = apply_typo_fixes(rows)
    # 只比對「修了幾筆 vs 表裡幾筆」是套套邏輯（表裡刪一筆時兩邊同時變少仍會通過），
    # 因此另比對每一筆的修正結果字串，並釘死預期筆數 EXPECTED_TYPO_COUNT。
    zh_by_code = {r[0]: r[3] for r in rows}
    unfixed = [code for code, (_, want) in TYPO_FIXES.items() if zh_by_code.get(code) != want]
    assert fixed == len(TYPO_FIXES) == EXPECTED_TYPO_COUNT and not unfixed, (
        f"錯字修正未如預期：修正 {fixed} 筆／表列 {len(TYPO_FIXES)} 筆／預期 {EXPECTED_TYPO_COUNT} 筆"
        f"，未修正 {unfixed}（原始檔可能已改版，或 TYPO_FIXES 遭刪改，請重新核對）"
    )
    with io.open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(rows, f, ensure_ascii=False, separators=(",", ":"))
    write_metadata(rows)
    n_leaf = sum(1 for r in rows if r[1] == 1)
    print(f"總筆數 {len(rows)}, 葉碼 {n_leaf}, 類目 {len(rows) - n_leaf}, 錯字修正 {fixed}")

if __name__ == "__main__":
    main()
