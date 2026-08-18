"""慢病速查 E2E 的共用資料推導（三套版面共用同一組期望值）。

內容是人工整理、會隨健保署公告改版，測試寫死字串等於保證「下次改版就變成假紅燈」，
所以一律即時從 JSON 查表——與 e2e_test.py 既有的 region_for_panel() 同一個作法。
"""
import json
from datetime import date, timedelta
from pathlib import Path

CHRONIC_JSON = Path(__file__).resolve().parent.parent / "src" / "curated" / "chronic_care.json"


def topics():
    return json.loads(CHRONIC_JSON.read_text(encoding="utf-8"))["topics"]


def topic(key):
    for t in topics():
        if t.get("key") == key:
            return t
    raise AssertionError(f"chronic_care.json 找不到主題 {key}")


def buttons():
    """三顆按鈕應有的短標籤與完整中文名，依 JSON 的順序。"""
    return [(t["key"], t.get("short") or t["key"].upper(), t.get("label") or t["key"]) for t in topics()]


def items(key):
    for section in topic(key).get("sections") or []:
        for item in section.get("items") or []:
            yield section.get("kind"), item


def undated_topic():
    """第一個「所有條目都沒有生效日」的主題。

    要數「畫面上應該有幾條」時只能用這種主題：帶生效日的條目會依當天日期增減，
    拿它們當期望值等於寫一條會在換版當天自己壞掉的測試。
    """
    for t in topics():
        pairs = list(items(t["key"]))
        if pairs and not any(i.get("effectiveFrom") or i.get("effectiveTo") for _k, i in pairs):
            return t["key"], len(pairs)
    return None


def first_item_with_detail(key):
    """回傳第一條帶 detail 的（text, detail）。detail 是消歧義那一層，必須展得開。"""
    for _kind, item in items(key):
        if item.get("detail"):
            return item["text"], item["detail"]
    return None


def cutover_case():
    """找出「同一主題內同時有舊版（帶 effectiveTo）與新版（帶 effectiveFrom）」的那一組。

    回傳 dict：key／cutover（換版日）／before（前一天）／old_texts／new_texts；
    找不到就回 None——那代表目前資料沒有換版中的規定（內容問題，不是程式壞了），
    呼叫端 skip 並說明原因。
    """
    for t in topics():
        old, new, starts = [], [], []
        for section in t.get("sections") or []:
            for item in section.get("items") or []:
                if item.get("effectiveTo"):
                    old.append(item["text"])
                if item.get("effectiveFrom"):
                    new.append(item["text"])
                    starts.append(item["effectiveFrom"])
        if old and new:
            cutover = min(starts)
            return {
                "key": t["key"],
                "label": t.get("label") or t["key"],
                "cutover": cutover,
                "before": (date.fromisoformat(cutover) - timedelta(days=1)).isoformat(),
                "old_texts": old,
                "new_texts": new,
            }
    return None
