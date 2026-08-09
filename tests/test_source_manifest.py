"""E4：build/source_manifest.py 與實際原始檔／產出中繼資料的一致性驗證。

manifest 是整條資料管線的信任錨點（來源 URL＋SHA-256），但先前沒有任何測試確認
它跟 data/ 下真正被拿去轉檔的 xlsx 相符——manifest 被改壞、或 data/ 裡放的是別版
xlsx，都不會有人發現。本檔只做本機雜湊比對，**不發任何網路請求**；
檔案不存在（未下載資料的環境）一律 skip，不讓 CI 紅字。
"""
import hashlib
import json
import re
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "build"))
from source_manifest import MIN_SIZE, SOURCE_SHA256, SOURCE_SHEET, SOURCE_URL, SOURCE_VERSION

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "icd10_2023_official.xlsx"
META = ROOT / "data" / "codes.min.meta.json"

SHA256_RE = re.compile(r"^[0-9a-f]{64}$")


def sha256_file(path, chunk_size=1024 * 1024):
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(chunk_size), b""):
            digest.update(chunk)
    return digest.hexdigest()


def test_manifest_fields_are_wellformed():
    assert SHA256_RE.match(SOURCE_SHA256), f"SOURCE_SHA256 不是 64 位小寫十六進位: {SOURCE_SHA256!r}"
    assert SOURCE_URL.startswith("https://"), f"來源 URL 必須是 https: {SOURCE_URL!r}"
    assert SOURCE_URL.endswith(".xlsx"), f"來源 URL 必須指向 xlsx（舊 Big5 CSV 來源禁用）: {SOURCE_URL!r}"
    assert "nhi.gov.tw" in SOURCE_URL, f"來源必須是健保署官網: {SOURCE_URL!r}"
    assert SOURCE_SHEET == "ICD-10-CM", f"工作表名稱不符: {SOURCE_SHEET!r}"
    assert SOURCE_VERSION.strip(), "SOURCE_VERSION 不可為空"
    assert MIN_SIZE >= 1024 * 1024, f"MIN_SIZE 太小，擋不住錯誤頁面: {MIN_SIZE}"


def test_raw_xlsx_matches_manifest_sha256():
    """data/ 下實際的原始 xlsx 雜湊必須與 manifest 記載一致。"""
    if not RAW.exists():
        pytest.skip(f"原始 xlsx 不存在，先跑 build/fetch_data.py：{RAW}")
    assert RAW.stat().st_size >= MIN_SIZE, f"原始 xlsx 過小: {RAW.stat().st_size:,} bytes"
    actual = sha256_file(RAW)
    assert actual == SOURCE_SHA256.lower(), (
        f"原始 xlsx 與 manifest 不符\n  實際 {actual}\n  manifest {SOURCE_SHA256.lower()}\n"
        "（換版請同步更新 build/source_manifest.py 並重跑 convert.py）"
    )


def test_generated_metadata_matches_manifest():
    """codes.min.meta.json 記錄的來源資訊必須與 manifest 一致（產出可追溯到來源）。"""
    if not META.exists():
        pytest.skip(f"中繼資料不存在，先跑 build/convert.py：{META}")
    meta = json.loads(META.read_text(encoding="utf-8"))
    assert meta["sourceSha256"].lower() == SOURCE_SHA256.lower(), (
        f"codes.min.meta.json 的 sourceSha256 {meta['sourceSha256']} != manifest {SOURCE_SHA256}"
    )
    assert meta["sourceVersion"] == SOURCE_VERSION, (
        f"codes.min.meta.json 的 sourceVersion {meta['sourceVersion']!r} != manifest {SOURCE_VERSION!r}"
    )


def test_generated_data_hash_matches_metadata():
    """dataSha256 必須對得上實際的 codes.min.json（中繼資料不得漂移）。"""
    data = ROOT / "data" / "codes.min.json"
    if not META.exists() or not data.exists():
        pytest.skip("尚未產出 codes.min.json / codes.min.meta.json")
    meta = json.loads(META.read_text(encoding="utf-8"))
    actual = sha256_file(data)
    assert meta["dataSha256"].lower() == actual, (
        f"codes.min.meta.json 的 dataSha256 {meta['dataSha256']} != 實際 {actual}"
        "（codes.min.json 被手改或未重跑 convert.py）"
    )
