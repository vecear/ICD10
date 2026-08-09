import sys
from pathlib import Path
import pytest
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "build"))
import convert
from convert import parse_rows, apply_typo_fixes, TYPO_FIXES

HEADER = ("2023年版\nICD-10-CM", "USE", "2023 CM英文名稱", "2023 CM中文名稱", "狀態", "修訂日期")

def test_parse_rows():
    rows = parse_rows([
        HEADER,
        ("A00", 0, "Cholera", "霍亂", None, None),
        ("A00.0", "1", "Cholera due to Vibrio cholerae 01,\nbiovar cholerae", "血清型01 cholerae霍亂弧菌所致之霍亂", None, None),
        ("e11.9 ", 1, "Type 2 diabetes mellitus without complications", "第二型糖尿病，未伴有併發症", "代碼新增", "2023/01/01"),
        (None, None, None, None, None, None),
    ])
    assert rows == [
        ["A00", 0, "Cholera", "霍亂"],
        ["A00.0", 1, "Cholera due to Vibrio cholerae 01, biovar cholerae", "血清型01 cholerae霍亂弧菌所致之霍亂"],
        ["E11.9", 1, "Type 2 diabetes mellitus without complications", "第二型糖尿病，未伴有併發症"],
    ]  # 表頭驗證、USE int/str 皆可、code 去空白轉大寫、內嵌換行正規化、空列跳過

def test_parse_rows_rejects_bad_header():
    with pytest.raises(AssertionError):
        parse_rows([("代碼", "錯誤表頭", "", "", "", ""), ("A00", 0, "x", "y", None, None)])

def test_apply_typo_fixes():
    rows = [["G72.41", 1, "Inclusion body myositis [IBM]", "内含体肌病變[IBM]"],
            ["K11.4", 1, "Fistula of salivary gland", "唾液腺?管"],
            ["A00", 0, "Cholera", "霍亂"]]
    assert apply_typo_fixes(rows) == 2
    assert rows[0][3] == "內含體肌病變[IBM]"
    assert rows[1][3] == "唾液腺瘻管"
    assert rows[2][3] == "霍亂"


def test_convert_rejects_stale_source_before_loading_workbook(tmp_path, monkeypatch):
    raw = tmp_path / "old.xlsx"
    raw.write_bytes(b"stale source")
    monkeypatch.setattr(convert, "RAW", raw)
    monkeypatch.setattr(convert, "is_current_source", lambda _: False)

    with pytest.raises(SystemExit, match="來源|SHA-256"):
        convert.main()
