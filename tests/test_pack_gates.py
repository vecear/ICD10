"""pack_for_clinic.py 三道新閘門的測試（design doc「打包腳本三道新閘門」）。

三道閘門：(1) dist 新鮮度——dist/icd10.html 比任何來源檔舊就中止並點名哪個檔案；
(2) zip 大小——超過門檻就中止；(3) 使用說明過期掃描擴大到 tools/README.md。
每個閘門對應的函式都設計成吃明確參數（tmp_path 造的假目錄／檔案），不碰真正的
專案檔，也不需要真的跑一次完整打包。
"""
import os
import sys
import time
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import pack_for_clinic as pack_module  # noqa: E402


def _touch(path, mtime):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("x", encoding="utf-8")
    os.utime(path, (mtime, mtime))


# ---------- 閘門 1：dist 新鮮度 ----------

def test_check_dist_freshness_aborts_and_names_the_newer_file(tmp_path):
    dist = tmp_path / "dist" / "icd10.html"
    src_dir = tmp_path / "src"
    build_script = tmp_path / "build" / "build.py"
    data_dir = tmp_path / "data"
    docs_dir = tmp_path / "健保條文"

    now = time.time()
    _touch(dist, now)
    _touch(build_script, now - 100)
    _touch(data_dir / "codes.min.json", now - 100)
    _touch(docs_dir / "a.pdf", now - 100)
    stale_src = src_dir / "logic.js"
    _touch(stale_src, now + 100)  # 改完程式碼忘了重新 build

    with pytest.raises(SystemExit) as exc_info:
        pack_module.check_dist_freshness(
            dist, src_dir=src_dir, build_script=build_script,
            data_dir=data_dir, docs_dir=docs_dir,
        )
    message = str(exc_info.value)
    assert str(stale_src) in message, message
    assert "python build/build.py" in message


def test_check_dist_freshness_passes_when_dist_is_newest(tmp_path):
    dist = tmp_path / "dist" / "icd10.html"
    src_dir = tmp_path / "src"
    build_script = tmp_path / "build" / "build.py"
    data_dir = tmp_path / "data"
    docs_dir = tmp_path / "健保條文"

    now = time.time()
    _touch(src_dir / "logic.js", now - 100)
    _touch(build_script, now - 100)
    _touch(data_dir / "codes.min.json", now - 100)
    _touch(docs_dir / "a.pdf", now - 100)
    _touch(dist, now)  # dist 最新

    pack_module.check_dist_freshness(
        dist, src_dir=src_dir, build_script=build_script,
        data_dir=data_dir, docs_dir=docs_dir,
    )  # 不應拋出


def test_check_dist_freshness_catches_stale_data_json_and_pdf(tmp_path):
    """來源不只 src/——data/*.json 與 健保條文/*.pdf 變新也要抓到。"""
    dist = tmp_path / "dist" / "icd10.html"
    src_dir = tmp_path / "src"
    build_script = tmp_path / "build" / "build.py"
    data_dir = tmp_path / "data"
    docs_dir = tmp_path / "健保條文"

    now = time.time()
    _touch(src_dir / "logic.js", now - 100)
    _touch(build_script, now - 100)
    _touch(dist, now)
    stale_pdf = docs_dir / "b.pdf"
    _touch(stale_pdf, now + 100)
    _touch(data_dir / "codes.min.json", now - 100)

    with pytest.raises(SystemExit) as exc_info:
        pack_module.check_dist_freshness(
            dist, src_dir=src_dir, build_script=build_script,
            data_dir=data_dir, docs_dir=docs_dir,
        )
    assert str(stale_pdf) in str(exc_info.value)


# ---------- 閘門 2：zip 大小 ----------

def test_check_zip_size_aborts_over_limit(tmp_path):
    fake_zip = tmp_path / "診間包.zip"
    fake_zip.write_bytes(b"0" * 1024)  # 1 KB，用極小門檻逼它超標

    with pytest.raises(SystemExit) as exc_info:
        pack_module.check_zip_size(fake_zip, limit_mb=0.0001)
    message = str(exc_info.value)
    assert "MB" in message
    assert "Gmail" in message


def test_check_zip_size_passes_under_limit(tmp_path):
    fake_zip = tmp_path / "診間包.zip"
    fake_zip.write_bytes(b"0" * 1024)

    pack_module.check_zip_size(fake_zip, limit_mb=22)  # 不應拋出


# ---------- 閘門 3：說明書過期掃描含 tools/README.md ----------

@pytest.mark.parametrize("gone", ["複製並貼入 HIS", "「全部」鈕", "桌機版面"])
def test_check_gone_buttons_aborts_on_removed_button(tmp_path, gone):
    readme = tmp_path / "README.md"
    readme.write_text(f"1. 按**「{gone}」**\n", encoding="utf-8")

    with pytest.raises(SystemExit) as exc_info:
        pack_module.check_gone_buttons(readme)
    assert gone in str(exc_info.value)


def test_check_gone_buttons_allows_explanatory_removed_note(tmp_path):
    """同一行寫「已經移除」是交代舊版行為，不該被判定成還在教人按。"""
    readme = tmp_path / "README.md"
    readme.write_text("舊版那顆「複製並貼入 HIS」已經移除。\n", encoding="utf-8")

    pack_module.check_gone_buttons(readme)  # 不應拋出


def test_tools_readme_no_longer_teaches_removed_copy_button():
    """真正的 tools/README.md 修過內容後，應該通過 gone 檢查。"""
    real_readme = ROOT / "tools" / "README.md"
    pack_module.check_gone_buttons(real_readme)  # 不應拋出
