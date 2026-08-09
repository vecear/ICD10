"""健保署 CSV → data/codes.min.json（[[code, use, en, zh], ...]）"""
import csv, io, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "icd10cm_2023_zh.csv"
OUT = ROOT / "data" / "codes.min.json"

def parse_rows(fileobj):
    reader = csv.reader(fileobj)
    header = next(reader)
    # 第一欄名含 BOM 時剝除
    header[0] = header[0].lstrip("﻿")
    assert "ICD-10" in header[0] and header[1].strip().upper() == "USE", f"表頭不符預期: {header}"
    out = []
    for r in reader:
        if not r or not r[0].strip():
            continue
        code = r[0].strip().upper()
        use = 1 if r[1].strip() == "1" else 0
        out.append([code, use, r[2].strip(), r[3].strip()])
    return out

def main():
    sys.stdout.reconfigure(encoding="utf-8")
    with io.open(RAW, encoding="utf-8-sig", newline="") as f:
        rows = parse_rows(f)
    codes = [r[0] for r in rows]
    assert len(codes) == len(set(codes)), "代碼重複"
    with io.open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(rows, f, ensure_ascii=False, separators=(",", ":"))
    n_leaf = sum(1 for r in rows if r[1] == 1)
    print(f"總筆數 {len(rows)}, 葉碼 {n_leaf}, 類目 {len(rows) - n_leaf}")

if __name__ == "__main__":
    main()
