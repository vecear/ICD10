"""設定→關於的建置日期與資料版本（J5）：診間回報問題時靠這行對出是哪一次寄的包。"""
import json
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist" / "icd10.html"


def test_settings_shows_build_date_and_data_version(browser):
    html = DIST.read_text(encoding="utf-8")
    key = "window.ICD_META = "
    meta, _ = json.JSONDecoder().raw_decode(html, html.index(key) + len(key))
    assert meta["builtAt"] == date.today().isoformat()
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto(DIST.as_uri())
    page.click("#settings-toggle")
    page.wait_for_selector("#settings-popover:not([hidden])")
    text = page.locator("#build-note").inner_text()
    page.context.close()
    assert text == f"建置 {meta['builtAt']} · ICD-10-CM {meta['sourceVersion']}"
