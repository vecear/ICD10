"""下載健保署 2023年中文版 ICD-10-CM/PCS 官方 Excel 到 data/。

來源頁：https://www.nhi.gov.tw/ch/lp-3847-1.html
（目前使用 115.05.06 更新檔；直接連結失效時回來源頁找新的 xlsx）
注意：舊的 data.gov.tw CSV API（rId=A21030000I-D20025-005）經 Big5 相容管線輸出，
非 Big5 字元全部變成字面「?」（6,955 筆中文名受害），禁止使用。
"""
import hashlib
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

from source_manifest import MIN_SIZE, SOURCE_SHA256, SOURCE_URL

DEST = Path(__file__).resolve().parent.parent / "data" / "icd10_2023_official.xlsx"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"


def sha256_file(path, chunk_size=1024 * 1024):
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(chunk_size), b""):
            digest.update(chunk)
    return digest.hexdigest()


def is_valid_xlsx(path):
    if not path.exists() or path.stat().st_size < MIN_SIZE:
        return False
    if not zipfile.is_zipfile(path):
        return False
    try:
        with zipfile.ZipFile(path) as archive:
            names = set(archive.namelist())
            return "xl/workbook.xml" in names and "[Content_Types].xml" in names
    except (OSError, zipfile.BadZipFile):
        return False


def is_current_source(path):
    return is_valid_xlsx(path) and sha256_file(path).lower() == SOURCE_SHA256.lower()


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    DEST.parent.mkdir(exist_ok=True)
    if is_current_source(DEST):
        print(f"已存在，跳過下載：{DEST} ({DEST.stat().st_size:,} bytes)")
        return
    curl = shutil.which("curl")
    if not curl:
        raise SystemExit("找不到 curl，請確認 Windows 內建 curl 可用")

    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            prefix=DEST.name + ".", suffix=".tmp", dir=DEST.parent, delete=False
        ) as temp:
            temp_path = Path(temp.name)
        result = subprocess.run(
            [
                curl,
                "-sfL",
                "--max-time",
                "120",
                "--retry",
                "2",
                "-A",
                UA,
                SOURCE_URL,
                "-o",
                str(temp_path),
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise SystemExit(f"curl 失敗（exit {result.returncode}）：{result.stderr}")
        if not is_valid_xlsx(temp_path):
            raise SystemExit("下載檔案不是有效 XLSX，來源可能異常")
        actual_hash = sha256_file(temp_path)
        if actual_hash.lower() != SOURCE_SHA256.lower():
            raise SystemExit(f"下載檔案 SHA-256 不符：{actual_hash}")
        os.replace(temp_path, DEST)
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()

    print(f"下載完成：{DEST} ({DEST.stat().st_size:,} bytes)")

if __name__ == "__main__":
    main()
