"""降血脂品項反查的資料契約與建置期守門。

這份資料與慢病速查有一個關鍵差異：它**每月會過期**（健保用藥品項是月更），
而過期的表現是「醫師查一個新代碼查不到」或「查到已經下市的品項」。
所以除了結構檢查，時效門檻也比慢病速查短（3 個月 vs 6 個月）。
"""
import json
import re
import sys
from datetime import date, timedelta
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "build"))
import build as build_module

ROOT = Path(__file__).resolve().parent.parent
SRC_JSON = ROOT / "src" / "curated" / "lipid_products.json"
CODE_RE = re.compile(r"^[A-Z][A-Z0-9]{9}$")


def load():
    return json.loads(SRC_JSON.read_text(encoding="utf-8"))


def test_every_product_has_a_code_a_name_and_a_legal_table():
    data = load()
    products = data["products"]
    assert len(products) > 300, f"品項數太少，抓取可能沒抓全：{len(products)}"
    codes = set()
    for p in products:
        assert CODE_RE.match(p["code"]), f"代碼樣式不對：{p['code']}"
        assert p["code"] not in codes, f"代碼重複：{p['code']}"
        codes.add(p["code"])
        assert (p.get("en") or p.get("zh")), f"{p['code']} 中英文品名都空的，查不到"
        assert p.get("table") in ("one", "two", ""), f"{p['code']} table 值不合法"


def test_table_two_products_match_the_official_exception_list():
    """標成表二的品項數，要等於官方「不適用表一」對照表的代碼數。

    兩份來源本來就該對得起來：fetch_lipid_products.py 就是拿那份對照表去標的。
    對不上代表抓取邏輯壞了，而壞掉的表現是醫師拿到相反的門檻。
    """
    data = load()
    two = [p for p in data["products"] if p["table"] == "two"]
    assert len(two) == data["tableTwoCodes"], (len(two), data["tableTwoCodes"])
    # 表二的品項多數落在 2.6.1，但**複方例外**：健保用藥品項檔不給複方標「給付規定章節」，
    # 而官方 2.6.1 的「不適用表一」對照表確實列了它們（實測 5 筆，都是複方：
    # pravastatin＋fenofibrate 1 筆、atorvastatin＋amlodipine 4 筆）。
    # 表別以對照表為準——它才是規定表別的那份文件，品項檔那一欄只是索引。
    blank = [p for p in two if not p["section"]]
    assert len(blank) == 5, f"章節空白的表二品項變了（原本 5 筆複方）：{[p['code'] for p in blank]}"
    for p in two:
        assert p["section"].startswith("2.6.1") or not p["section"], (
            f"{p['code']} 標成表二，章節卻是 {p['section']}")


def test_only_261_products_get_a_table():
    """只有 2.6.1 的品項才有表一／表二的問題。

    2.6.2（ezetimibe）、2.6.3（複方）、2.6.4（PCSK9）有自己的條件；
    給它們掛一個表別，等於告訴醫師一個不存在的門檻。
    """
    for p in load()["products"]:
        if p["table"] == "one":
            # 表一是「2.6.1 且不在例外清單上」推出來的，所以一定有 2.6.1 這個章節
            assert p["section"].startswith("2.6.1"), f"{p['code']} {p['section']} 不該標成表一"
        elif p["table"] == "two":
            pass          # 表別來自官方對照表，章節欄可能空白（複方，見上一條測試）
        elif p["section"].startswith("2.6.1"):
            pytest.fail(f"{p['code']} 在 2.6.1 卻沒有表別")


def test_delisted_codes_are_kept_but_marked():
    """支付價 0 的代碼要留著並標記，不能當成可開的品項。

    2026-09-01 實測：611 個現行代碼裡有 370 個支付價 0——早已停止給付，
    但永遠留在品項檔（有效迄日 9991231）。把它們當成可開的品項，工具會對一個
    不給付的代碼說「符合表一」；例如 B024129100（CRESTOR 20MG）在民國 104 年
    就歸零，而現行的 BC24129100 走的是表二，兩者門檻差 45 mg/dL。

    留著而不刪除：醫師打了那個代碼要看到「已停付」，而不是「查無此代碼」
    ——後者會讓人以為自己打錯字。
    """
    products = load()["products"]
    dead = [p for p in products if not p["listed"]]
    assert dead, "一個已停付的都沒有，listed 判定可能壞了"
    assert all(p["price"] == 0 for p in dead), "listed=False 的定義就是支付價 0"
    assert all(p["price"] > 0 for p in products if p["listed"])
    by_code = {p["code"]: p for p in products}
    assert by_code["B024129100"]["listed"] is False, "CRESTOR 20MG 舊碼早已停付"
    assert by_code["BC24129100"]["listed"] is True


def test_table_two_is_the_majority_among_reimbursed_products():
    """就**現行給付中**的品項而言，表二比表一多——不能假設「大多數走表一」。

    這一條釘的是一個實際寫錯過的判斷：把已停付的死碼算進去會得到「表一 255／表二 116」，
    看起來多數走表一；只算給付中則是「表一 49／表二 116」，而且逐學名看每一種 statin
    都是表二較多。錯的方向會讓醫師少對代碼——正是這個工具要防的事。
    """
    listed = [p for p in load()["products"] if p["listed"] and p["table"]]
    one = [p for p in listed if p["table"] == "one"]
    two = [p for p in listed if p["table"] == "two"]
    assert len(two) > len(one), (
        f"給付中的表二應多於表一（實測 {len(two)} vs {len(one)}）")
    # 官方那 116 個代碼應該全部都還在給付中——它們是 115/9/1 才公告的
    assert len(two) == load()["tableTwoCodes"], (len(two), load()["tableTwoCodes"])


def test_structure_errors_fail_the_build():
    with pytest.raises(ValueError) as err:
        build_module.check_lipid_products({"products": [
            {"code": "A123456789", "en": "x", "table": "three"}]})
    assert "table" in str(err.value)
    with pytest.raises(ValueError):
        build_module.check_lipid_products({"products": []})


def test_stale_data_warns_but_never_fails_the_build():
    """過期只警告不失敗：讓建置失敗等於門診當天沒工具可用，那更糟（同慢病速查）。"""
    old = (date.today() - timedelta(days=200)).isoformat()
    report = build_module.check_lipid_products(
        {"checked": old, "products": [{"code": "A123456789", "en": "x", "table": "one"}]})
    assert report["warnings"], "太舊要警告"
    assert any("個月" in w for w in report["warnings"])


def test_current_data_is_fresh_enough():
    report = build_module.check_lipid_products(load())
    assert not report["warnings"], (
        "品項檔該重抓了（python build/fetch_lipid_products.py）：" + str(report["warnings"]))
