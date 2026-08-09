import hashlib
import io
from pathlib import Path
from types import SimpleNamespace
import zipfile

import pytest

import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "build"))
import fetch_data


def test_fetch_does_not_skip_existing_file_that_is_not_current_source(tmp_path, monkeypatch):
    dest = tmp_path / "icd10.xlsx"
    dest.write_bytes(b"not-an-xlsx" * 2)
    monkeypatch.setattr(fetch_data, "DEST", dest)
    monkeypatch.setattr(fetch_data, "MIN_SIZE", 1)
    monkeypatch.setattr(fetch_data, "SOURCE_SHA256", "expected-current-hash", raising=False)

    calls = []

    def fake_run(args, **kwargs):
        calls.append((args, kwargs))
        return SimpleNamespace(returncode=0, stderr="")

    monkeypatch.setattr(fetch_data.shutil, "which", lambda _: "curl")
    monkeypatch.setattr(fetch_data.subprocess, "run", fake_run)

    with pytest.raises(SystemExit, match="有效 XLSX"):
        fetch_data.main()

    assert calls, "非目前來源檔案不可因大小足夠而跳過下載"


def test_fetch_preserves_existing_file_when_download_fails(tmp_path, monkeypatch):
    dest = tmp_path / "icd10.xlsx"
    original = b"old-valid-source-placeholder"
    dest.write_bytes(original)
    monkeypatch.setattr(fetch_data, "DEST", dest)
    monkeypatch.setattr(fetch_data, "MIN_SIZE", 1)
    monkeypatch.setattr(fetch_data, "SOURCE_SHA256", "expected-current-hash", raising=False)
    monkeypatch.setattr(fetch_data.shutil, "which", lambda _: "curl")

    def fake_run(args, **kwargs):
        return SimpleNamespace(returncode=7, stderr="network failure")

    monkeypatch.setattr(fetch_data.subprocess, "run", fake_run)

    with pytest.raises(SystemExit, match="curl 失敗"):
        fetch_data.main()

    assert dest.read_bytes() == original


def test_fetch_atomically_replaces_old_file_after_valid_download(tmp_path, monkeypatch):
    dest = tmp_path / "icd10.xlsx"
    dest.write_bytes(b"old-source")
    payload_buffer = io.BytesIO()
    with zipfile.ZipFile(payload_buffer, "w") as archive:
        archive.writestr("[Content_Types].xml", "")
        archive.writestr("xl/workbook.xml", "")
    payload = payload_buffer.getvalue()

    monkeypatch.setattr(fetch_data, "DEST", dest)
    monkeypatch.setattr(fetch_data, "MIN_SIZE", 1)
    monkeypatch.setattr(fetch_data, "SOURCE_SHA256", hashlib.sha256(payload).hexdigest(), raising=False)
    monkeypatch.setattr(fetch_data.shutil, "which", lambda _: "curl")

    def fake_run(args, **kwargs):
        output = Path(args[args.index("-o") + 1])
        output.write_bytes(payload)
        return SimpleNamespace(returncode=0, stderr="")

    monkeypatch.setattr(fetch_data.subprocess, "run", fake_run)

    fetch_data.main()

    assert dest.read_bytes() == payload


def test_fetch_preserves_existing_file_when_download_hash_mismatches(tmp_path, monkeypatch):
    dest = tmp_path / "icd10.xlsx"
    original = b"old-source-that-must-survive"
    dest.write_bytes(original)
    payload_buffer = io.BytesIO()
    with zipfile.ZipFile(payload_buffer, "w") as archive:
        archive.writestr("[Content_Types].xml", "")
        archive.writestr("xl/workbook.xml", "")
    payload = payload_buffer.getvalue()

    monkeypatch.setattr(fetch_data, "DEST", dest)
    monkeypatch.setattr(fetch_data, "MIN_SIZE", 1)
    monkeypatch.setattr(fetch_data, "SOURCE_SHA256", "0" * 64, raising=False)
    monkeypatch.setattr(fetch_data.shutil, "which", lambda _: "curl")

    def fake_run(args, **kwargs):
        output = Path(args[args.index("-o") + 1])
        output.write_bytes(payload)
        return SimpleNamespace(returncode=0, stderr="")

    monkeypatch.setattr(fetch_data.subprocess, "run", fake_run)

    with pytest.raises(SystemExit, match="SHA-256 不符"):
        fetch_data.main()

    assert dest.read_bytes() == original
    assert not list(tmp_path.glob("*.tmp")), "雜湊不符時應清理暫存檔"
