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
            data_dir=data_dir, docs_dir=docs_dir, vaccine_dir=tmp_path / "疫苗",
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
        data_dir=data_dir, docs_dir=docs_dir, vaccine_dir=tmp_path / "疫苗",
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
            data_dir=data_dir, docs_dir=docs_dir, vaccine_dir=tmp_path / "疫苗",
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
    assert f"Gmail 附件上限 {pack_module.GMAIL_LIMIT_MB} MB" in message


def test_check_zip_size_passes_under_limit(tmp_path):
    fake_zip = tmp_path / "診間包.zip"
    fake_zip.write_bytes(b"0" * 1024)

    pack_module.check_zip_size(fake_zip, limit_mb=pack_module.ZIP_SIZE_LIMIT_MB)  # 不應拋出


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


@pytest.mark.parametrize("stale_rel", ["build/vaccine_data.py", "疫苗/新教材.pdf", "data/icd10_2023_official.xlsx"])
def test_check_dist_freshness_watches_build_modules_vaccine_sources_and_xlsx(tmp_path, stale_rel):
    """只改 build/ 其他模組、只換一份疫苗 PDF、只換官方 xlsx，也都要擋。"""
    dist = tmp_path / "dist" / "icd10.html"
    build_script = tmp_path / "build" / "build.py"
    now = time.time()
    _touch(tmp_path / "src" / "logic.js", now - 100)
    _touch(build_script, now - 100)
    _touch(dist, now)
    stale = tmp_path / stale_rel
    _touch(stale, now + 100)

    with pytest.raises(SystemExit) as exc_info:
        pack_module.check_dist_freshness(
            dist, src_dir=tmp_path / "src", build_script=build_script,
            data_dir=tmp_path / "data", docs_dir=tmp_path / "健保條文",
            vaccine_dir=tmp_path / "疫苗",
        )
    assert str(stale) in str(exc_info.value)


# ---------- 閘門：說明書行號 ----------

AHK = """; 設定區
SEND_ENTER := true
CODE_DELAY := 250
DOCK_ALSO_TOPMOST := false
"""


def _line_check(tmp_path, manual_text):
    script = tmp_path / "his-paste.ahk"
    script.write_text(AHK, encoding="utf-8")
    manual = tmp_path / "manual.txt"
    manual.write_text(manual_text, encoding="utf-8")
    return pack_module.check_manual_line_numbers(manual, script)


def test_line_check_passes_when_name_is_on_the_next_line(tmp_path):
    assert _line_check(tmp_path, "用記事本打開，把第 4 行的\nDOCK_ALSO_TOPMOST := false 改成 true。\n") == []


def test_line_check_catches_wrong_number_when_name_is_on_the_next_line(tmp_path):
    """真實說明書第 121-122 行就是這種寫法；舊版逐行比對對它是擺設。"""
    problems = _line_check(tmp_path, "用記事本打開，把第 49 行的\nDOCK_ALSO_TOPMOST := false 改成 true。\n")
    assert problems == ["DOCK_ALSO_TOPMOST：說明寫第 49 行，實際在第 4 行"]


def test_line_check_same_line_control(tmp_path):
    """對照組：同一行的寫法本來就抓得到，改寫後也要照抓。"""
    assert _line_check(tmp_path, "把第 2 行的 SEND_ENTER := true 改成 false\n") == []
    assert _line_check(tmp_path, "把第 29 行的 SEND_ENTER := true 改成 false\n") == [
        "SEND_ENTER：說明寫第 29 行，實際在第 2 行"]


def test_line_check_does_not_borrow_a_next_line_that_has_its_own_number(tmp_path):
    """下一行自己寫了「第 N 行」時不借它的設定名，否則兩句會互相誤報。"""
    text = "先把第 2 行的\n再確認第 3 行的 CODE_DELAY\n"
    assert _line_check(tmp_path, text) == []


def test_line_check_on_the_real_manual_and_script():
    assert pack_module.check_manual_line_numbers(
        ROOT / "tools" / "診間使用說明.txt", ROOT / "tools" / "his-paste.ahk") == []


# ---------- zip 先寫 tmp、閘門全過才換上 ----------

def _out_dir(tmp_path):
    out = tmp_path / "out"
    (out / "健保條文").mkdir(parents=True)
    (out / "icd10.html").write_text("new", encoding="utf-8")
    (out / "健保條文" / "a.pdf").write_bytes(b"%PDF")
    return out


def test_failed_gate_keeps_the_old_zip_and_removes_tmp(tmp_path):
    zip_path = tmp_path / "診間包.zip"
    zip_path.write_bytes(b"old good zip")

    def verify(path):
        assert path.name == "診間包.zip.tmp"
        pack_module.check_zip_size(path, limit_mb=0.0000001)

    with pytest.raises(SystemExit):
        pack_module.write_zip_atomically(_out_dir(tmp_path), zip_path, verify)
    assert zip_path.read_bytes() == b"old good zip"
    assert not (tmp_path / "診間包.zip.tmp").exists()


def test_passing_gates_replace_the_zip(tmp_path):
    import zipfile
    zip_path = tmp_path / "診間包.zip"
    zip_path.write_bytes(b"old")
    names = pack_module.write_zip_atomically(
        _out_dir(tmp_path), zip_path, lambda p: zipfile.ZipFile(p).namelist())
    assert sorted(names) == ["icd10.html", "健保條文/a.pdf"]
    assert zipfile.ZipFile(zip_path).namelist() == names
    assert not (tmp_path / "診間包.zip.tmp").exists()


def test_large_pdfs_lists_only_files_over_the_limit(tmp_path):
    out = tmp_path / "out"
    (out / "疫苗").mkdir(parents=True)
    (out / "疫苗" / "big.pdf").write_bytes(b"0" * 3000)
    (out / "疫苗" / "small.pdf").write_bytes(b"0" * 100)
    found = pack_module.large_pdfs(out, limit_mb=2000 / 1024 / 1024)
    assert [rel for rel, _ in found] == ["疫苗/big.pdf"]
