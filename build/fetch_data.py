"""下載健保署 2023年版中文 ICD-10-CM CSV 到 data/。已存在且大小合理則跳過。"""
import io, sys, urllib.request
from pathlib import Path

URL = "https://info.nhi.gov.tw/api/iode0000s01/Dataset?rId=A21030000I-D20025-005"
DEST = Path(__file__).resolve().parent.parent / "data" / "icd10cm_2023_zh.csv"
MIN_SIZE = 10 * 1024 * 1024  # 10MB：檔案實際約 13.7MB

def main():
    sys.stdout.reconfigure(encoding="utf-8")
    DEST.parent.mkdir(exist_ok=True)
    if DEST.exists() and DEST.stat().st_size > MIN_SIZE:
        print(f"已存在，跳過下載：{DEST} ({DEST.stat().st_size:,} bytes)")
        return
    req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        raw = resp.read()
    if len(raw) < MIN_SIZE:
        raise SystemExit(f"下載檔案過小（{len(raw):,} bytes），來源可能異常")
    DEST.write_bytes(raw)
    print(f"下載完成：{DEST} ({len(raw):,} bytes)")

if __name__ == "__main__":
    main()
