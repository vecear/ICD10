"""下載健保署 2023年中文版 ICD-10-CM/PCS 官方 Excel 到 data/。已存在且大小合理則跳過。

來源頁：https://www.nhi.gov.tw/ch/cp-6071-469da-3051-1.html
（「2023年中文版ICD-10-CM/PCS(正式版)(113.11.18更新)」；直接連結失效時回來源頁找新的 xlsx）
注意：舊的 data.gov.tw CSV API（rId=A21030000I-D20025-005）經 Big5 相容管線輸出，
非 Big5 字元全部變成字面「?」（6,955 筆中文名受害），禁止使用。
"""
import shutil, subprocess, sys
from pathlib import Path

URL = "https://www.nhi.gov.tw/ch/dl-66644-25490863641c4e1889522442f8262b47-1.xlsx"
DEST = Path(__file__).resolve().parent.parent / "data" / "icd10_2023_official.xlsx"
MIN_SIZE = 5 * 1024 * 1024  # 5MB：檔案實際約 7.3MB
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

def main():
    sys.stdout.reconfigure(encoding="utf-8")
    DEST.parent.mkdir(exist_ok=True)
    if DEST.exists() and DEST.stat().st_size > MIN_SIZE:
        print(f"已存在，跳過下載：{DEST} ({DEST.stat().st_size:,} bytes)")
        return
    curl = shutil.which("curl")
    if not curl:
        raise SystemExit("找不到 curl，請確認 Windows 內建 curl 可用")
    result = subprocess.run([curl, "-sL", "-A", UA, URL, "-o", str(DEST)], capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit(f"curl 失敗（exit {result.returncode}）：{result.stderr}")
    if not DEST.exists() or DEST.stat().st_size < MIN_SIZE:
        raise SystemExit("下載檔案過小，來源可能異常（若直接連結失效，回來源頁找新連結）")
    print(f"下載完成：{DEST} ({DEST.stat().st_size:,} bytes)")

if __name__ == "__main__":
    main()
