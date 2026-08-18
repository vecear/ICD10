"""慢病速查（DM／HTN／LIPID）：資料契約與建置期時效守門。

這份內容與 ICD 代碼有一個本質差異，本檔所有測試都是從它推出來的：
代碼可以逐碼比對健保署全庫、錯了 `validate_curated()` 就讓建置失敗；
**健保給付規定沒有任何機器可驗的權威來源**。唯一的防線是
「每條自帶出處與查證日期」＋「過舊時建置期吼一聲」——所以那兩件事本身必須有測試，
否則這份速查會安靜地變成一個看起來權威、實際上過期的東西，那比沒有更危險。

警告刻意**不是失敗**（`test_stale_data_warns_loudly_but_never_fails_the_build`）：
過期會誤導醫師，但讓建置失敗等於門診當天沒工具可用，那更糟。
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
SRC_JSON = ROOT / "src" / "curated" / "chronic_care.json"
STATE_JS = ROOT / "src" / "state.js"
DIST = ROOT / "dist" / "icd10.html"
ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def load_raw():
    return json.loads(SRC_JSON.read_text(encoding="utf-8"))


def iter_items(chronic):
    """(topic key, kind, item) 逐條展開，供各測試共用。"""
    for topic in chronic.get("topics") or []:
        for section in topic.get("sections") or []:
            for item in section.get("items") or []:
                yield topic.get("key"), section.get("kind"), item


def fake_topics(items):
    """把一串 item 包成 check_chronic_care() 吃得下的最小結構（key 用真實的三個）。"""
    return {
        "topics": [
            {"key": "dm", "sections": [{"kind": "coverage", "items": items}]},
            {"key": "htn", "sections": []},
            {"key": "lipid", "sections": []},
        ]
    }


def ok_item(**over):
    base = {"text": "示範條目", "source": "藥品給付規定 第五節 5.1", "checked": "2026-08-01"}
    base.update(over)
    return base


# ── 資料契約（內容由人工整理，這幾條是它必須守住的形狀） ──────────────────────
def test_every_item_carries_a_visible_source_and_a_parsable_checked_date():
    """出處與查證日期是這個功能的全部可信度來源，一條都不能缺。"""
    bad = []
    for key, kind, item in iter_items(load_raw()):
        head = str(item.get("text") or "(缺 text)")[:24]
        if not str(item.get("source") or "").strip():
            bad.append(f"{key}/{kind}/{head}：缺 source")
        checked = str(item.get("checked") or "")
        if not ISO_DATE.match(checked):
            bad.append(f"{key}/{kind}/{head}：checked 不是 YYYY-MM-DD（{checked!r}）")
            continue
        try:
            date.fromisoformat(checked)
        except ValueError:
            bad.append(f"{key}/{kind}/{head}：checked 不是合法日期（{checked!r}）")
    assert not bad, "\n".join(bad)


def test_source_never_carries_a_url():
    """`source` 夾帶網址會直接讓 assert_offline() 讓建置失敗（單檔零外部參照）。

    那一層是全域守門、訊息很泛；這裡先擋一次，壞掉時看得出是內容問題不是打包問題。
    """
    bad = [
        f"{key}/{kind}：{item.get('source')}"
        for key, kind, item in iter_items(load_raw())
        if "http" in str(item.get("source") or "").lower()
    ]
    assert not bad, "source 不可放網址：\n" + "\n".join(bad)


def test_effective_window_start_is_not_after_its_end():
    bad = [
        f"{key}/{kind}：{item.get('effectiveFrom')} → {item.get('effectiveTo')}"
        for key, kind, item in iter_items(load_raw())
        if item.get("effectiveFrom") and item.get("effectiveTo")
        and str(item["effectiveFrom"]) > str(item["effectiveTo"])
    ]
    assert not bad, "生效日晚於截止日：\n" + "\n".join(bad)


def test_topic_keys_match_the_mirror_in_state_js():
    """state.js 是零 DOM 的純模組，讀不到這份資料，只能各留一份鏡像。

    兩邊分歧的後果不是報錯，是「按鈕點了沒反應」——store 會擋掉不認得的 key，
    畫面完全沒有回饋。所以要在測試裡把兩份釘在一起。
    """
    mirror = re.search(r"const CHRONIC_TOPICS = \[([^\]]*)\]", STATE_JS.read_text(encoding="utf-8"))
    assert mirror, "state.js 找不到 CHRONIC_TOPICS"
    js_keys = sorted(re.findall(r"'([^']+)'", mirror.group(1)))
    json_keys = sorted(t.get("key") for t in load_raw()["topics"])
    assert js_keys == json_keys == sorted(build_module.CHRONIC_TOPIC_KEYS)


# ── 建置期時效檢查 ────────────────────────────────────────────────────────────
def test_current_data_passes_the_freshness_gate():
    """負面對照：今天這份資料應該是乾淨的，否則後面「會警告」的測試無從解讀。"""
    report = build_module.check_chronic_care(build_module.load_chronic_care())
    assert report["warnings"] == []
    assert report["items"] > 0


@pytest.mark.parametrize(
    "offset_days, expect_warning",
    [(0, False), (-1, True), (1, False)],
)
def test_freshness_boundary_is_exactly_the_configured_months(offset_days, expect_warning):
    """門檻當天不算過期，早一天才算——邊界寫死，免得「大概六個月」慢慢漂。"""
    today = date(2026, 8, 19)
    cutoff = build_module._months_before(today, build_module.CHRONIC_CHECK_MAX_MONTHS)
    assert cutoff == date(2026, 2, 19)
    checked = cutoff + timedelta(days=offset_days)
    report = build_module.check_chronic_care(
        fake_topics([ok_item(checked=checked.isoformat())]), today=today
    )
    assert bool(report["warnings"]) is expect_warning
    if expect_warning:
        assert "已超過 6 個月" in report["warnings"][0]


def test_month_arithmetic_clamps_to_the_end_of_a_shorter_month():
    assert build_module._months_before(date(2026, 8, 31), 6) == date(2026, 2, 28)
    assert build_module._months_before(date(2026, 3, 15), 6) == date(2025, 9, 15)


@pytest.mark.parametrize(
    "item, fragment",
    [
        ({"text": "無日期", "source": "某公告"}, "checked 缺漏"),
        ({"text": "壞日期", "source": "某公告", "checked": "115/07/23"}, "checked 缺漏"),
        ({"text": "無出處", "checked": "2026-08-01"}, "缺 source"),
    ],
)
def test_malformed_items_are_reported_not_silently_accepted(item, fragment):
    report = build_module.check_chronic_care(fake_topics([item]), today=date(2026, 8, 19))
    assert any(fragment in w for w in report["warnings"]), report["warnings"]


def test_topic_key_drift_is_reported():
    drifted = {"topics": [{"key": "dm", "sections": []}, {"key": "chol", "sections": []}]}
    report = build_module.check_chronic_care(drifted, today=date(2026, 8, 19))
    assert any("CHRONIC_TOPICS" in w for w in report["warnings"])


def test_empty_topics_are_tolerated():
    """開發期 sections 就是空的，那不是錯誤，不該吵。"""
    report = build_module.check_chronic_care(
        {"topics": [{"key": k, "sections": []} for k in build_module.CHRONIC_TOPIC_KEYS]},
        today=date(2026, 8, 19),
    )
    assert report["warnings"] == []
    assert report["items"] == 0
    assert report["oldest"] is None


def test_report_banner_is_hard_to_miss_and_names_the_threshold():
    report = build_module.check_chronic_care(
        fake_topics([ok_item(checked="2020-01-01")]), today=date(2026, 8, 19)
    )
    text = build_module.format_chronic_report(report)
    assert "【警告】" in text and "=" * 20 in text
    assert "2026-02-19" in text                      # 門檻日期要寫出來，不能只說「太舊」
    assert "建置不因此失敗" in text
    assert "chronic_care.json" in text               # 要修的檔案路徑


def test_stale_data_warns_loudly_but_never_fails_the_build(monkeypatch, capsys):
    """核心取捨：過期要吼，但**不能讓醫師沒工具可用**。

    用真實輸入跑一次完整 main()，只把時效報告換成過期的——證明的是「建置照樣成功、
    dist 照樣產出」，不是某個被隔離的函式回傳了什麼。
    """
    stale = build_module.check_chronic_care(
        fake_topics([ok_item(checked="2019-01-01")]), today=date(2026, 8, 19)
    )
    monkeypatch.setattr(build_module, "check_chronic_care", lambda *a, **k: stale)
    build_module.main()                              # 不得丟例外
    out = capsys.readouterr().out
    assert "【警告】" in out
    assert "assert_offline：通過" in out             # 其餘建置流程沒有被跳過
    assert DIST.exists() and DIST.stat().st_size > 1_000_000


# ── 內嵌結果 ──────────────────────────────────────────────────────────────────
def test_dist_embeds_chronic_care_and_drops_the_schema_block():
    html = DIST.read_text(encoding="utf-8")
    match = re.search(r"window\.CHRONIC_CARE = (\{.*?\});\n</script>", html, re.S)
    assert match, "dist 找不到 window.CHRONIC_CARE"
    embedded = json.loads(match.group(1))
    assert "_schema" not in embedded, "_schema 是給維護者看的說明，不該進 dist"
    assert [t["key"] for t in embedded["topics"]] == list(build_module.CHRONIC_TOPIC_KEYS)
    raw = load_raw()
    assert embedded["topics"] == raw["topics"], "內嵌內容必須與原始檔逐字相同"


def test_chronic_care_stays_out_of_the_icd_code_validation_path():
    """chronic_care.json 一個 ICD 代碼都沒有，被拉進代碼驗證只會炸出整片假錯誤。"""
    assert build_module.CHRONIC_CARE_FILE not in build_module.CURATED_KEYS
    curated_labels_input = set(build_module.CURATED_KEYS.values())
    assert "chronicCare" not in curated_labels_input
