"""下載健保署 2023年版中文 ICD-10-CM CSV 到 data/。已存在且大小合理則跳過。"""
import sys, subprocess, shutil
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
    curl = shutil.which("curl")
    if not curl:
        raise SystemExit("錯誤：curl 未找到，請確保已安裝（Windows 10+ 內建）")
    result = subprocess.run([curl, "-sL", URL, "-o", str(DEST)], capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit(f"curl 下載失敗（exit code {result.returncode})：{result.stderr}")
    if not DEST.exists() or DEST.stat().st_size < MIN_SIZE:
        raise SystemExit(f"下載檔案過小（{DEST.stat().st_size if DEST.exists() else 0:,} bytes），來源可能異常")
    print(f"下載完成：{DEST} ({DEST.stat().st_size:,} bytes)")

if __name__ == "__main__":
    main()
