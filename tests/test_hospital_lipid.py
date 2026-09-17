"""院內收費代碼對照的資料契約與建置期守門。

這份資料的失效方式跟 lipid_products.json 不同：品項檔過期是「查不到新代碼」，
而這份過期是「院內代碼指到一個已經不存在的健保代碼」——那時工具會對一個
有效的收費代碼說「查無表別」，醫師會以為自己打錯字。所以健保代碼的存在性
是硬性檢查（建置失敗），不是警告。
"""
import json
import re
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "build"))
import build as build_module

ROOT = Path(__file__).resolve().parent.parent
SRC_JSON = ROOT / "src" / "curated" / "hospital_lipid_codes.json"
NHI_JSON = ROOT / "src" / "curated" / "lipid_products.json"
NHI_CODE_RE = re.compile(r"^[A-Z][A-Z0-9]{9}$")
HOSP_CODE_RE = re.compile(r"^[A-Z][A-Z0-9]{1,9}$")


def load():
    return json.loads(SRC_JSON.read_text(encoding="utf-8"))


def load_nhi():
    return json.loads(NHI_JSON.read_text(encoding="utf-8"))


def test_every_entry_has_a_unique_hospital_code_and_a_wellformed_nhi_code():
    items = load()["items"]
    assert len(items) > 20, f"品項數太少，可能漏抄：{len(items)}"
    seen = set()
    for it in items:
        hosp = it["hosp"]
        assert HOSP_CODE_RE.match(hosp), f"院內代碼樣式不對：{hosp}"
        assert hosp not in seen, f"院內代碼重複：{hosp}"
        seen.add(hosp)
        assert NHI_CODE_RE.match(it["code"]), f"{hosp}：健保代碼樣式不對（{it['code']}）"
        assert str(it.get("name") or "").strip(), f"{hosp}：沒有品名，人工核對時認不出是哪支"


def test_every_nhi_code_still_exists_in_the_product_file():
    """院內代碼指向的健保代碼必須存在——這是這份資料最會爛掉的地方。

    品項檔每月更新，代碼會下架。指到不存在的代碼時，工具對一個有效的收費代碼
    回「查無」，醫師會以為自己打錯。
    """
    codes = {p["code"] for p in load_nhi()["products"]}
    missing = [(it["hosp"], it["code"]) for it in load()["items"] if it["code"] not in codes]
    assert not missing, "院內代碼指到品項檔查無的健保代碼：" + str(missing)


def test_one_nhi_code_may_serve_several_hospital_codes():
    """院內的「(矯正)」品項與原品項共用同一個健保代碼，這是正常的。

    釘住這件事，免得日後有人「修掉重複」而把 POCRE 之類的刪掉。
    """
    items = load()["items"]
    by_code = {}
    for it in items:
        by_code.setdefault(it["code"], []).append(it["hosp"])
    shared = {c: hs for c, hs in by_code.items() if len(hs) > 1}
    assert shared, "預期至少有一個健保代碼對到多個院內代碼（(矯正)品項）"


def test_build_merges_hospital_codes_onto_products():
    products = [
        {"code": "AA00000001", "en": "Foo", "zh": "甲", "table": "one", "listed": True},
        {"code": "AA00000002", "en": "Bar", "zh": "乙", "table": "two", "listed": True},
    ]
    mapping = {"items": [
        {"hosp": "OFOO", "code": "AA00000001", "name": "Foo"},
        {"hosp": "POFOO", "code": "AA00000001", "name": "(矯正)Foo"},
    ]}
    merged = build_module.merge_hospital_codes(products, mapping)
    by = {p["code"]: p for p in merged}
    assert by["AA00000001"]["hosp"] == ["OFOO", "POFOO"], "同代碼的多個院內代碼要都掛上、且排序穩定"
    assert "hosp" not in by["AA00000002"], "沒有對照的品項不該長出空欄位（會被誤認為院內有這支）"


def test_unknown_nhi_code_fails_the_build():
    products = [{"code": "AA00000001", "en": "Foo", "table": "one", "listed": True}]
    mapping = {"items": [{"hosp": "OBAD", "code": "ZZ99999999", "name": "不存在"}]}
    with pytest.raises(ValueError, match="查無"):
        build_module.merge_hospital_codes(products, mapping)


def test_duplicate_hospital_code_fails_the_build():
    products = [{"code": "AA00000001", "en": "Foo", "table": "one", "listed": True}]
    mapping = {"items": [
        {"hosp": "ODUP", "code": "AA00000001", "name": "甲"},
        {"hosp": "ODUP", "code": "AA00000001", "name": "乙"},
    ]}
    with pytest.raises(ValueError, match="重複"):
        build_module.merge_hospital_codes(products, mapping)
