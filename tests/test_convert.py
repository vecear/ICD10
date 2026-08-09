import io, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "build"))
from convert import parse_rows

SAMPLE = "﻿2023年版ICD-10-CM/PCS,USE,ICD-10-CM/PCS英文名稱,ICD-10-CM/PCS中文名稱,狀態,修訂日期\n" \
         "A00,0,Cholera,霍亂,,\n" \
         'A00.0,1,"Cholera due to Vibrio cholerae 01, biovar cholerae",血清型01 cholerae霍亂弧菌所致之霍亂,,\n' \
         "e11.9 ,1,Type 2 diabetes mellitus without complications,第2型糖尿病伴無併發症,代碼新增,2023/01/01\n" \
         ",,,,,\n"

def test_parse_rows():
    rows = parse_rows(io.StringIO(SAMPLE))
    assert rows == [
        ["A00", 0, "Cholera", "霍亂"],
        ["A00.0", 1, "Cholera due to Vibrio cholerae 01, biovar cholerae", "血清型01 cholerae霍亂弧菌所致之霍亂"],
        ["E11.9", 1, "Type 2 diabetes mellitus without complications", "第2型糖尿病伴無併發症"],
    ]  # BOM 剝除、引號逗號欄位完整、code 去空白轉大寫、空列跳過

def test_parse_rows_rejects_bad_header():
    import pytest
    with pytest.raises(AssertionError):
        parse_rows(io.StringIO("代碼,錯誤表頭\nA00,0\n"))
