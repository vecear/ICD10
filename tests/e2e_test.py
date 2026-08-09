"""E2E：對 dist/icd10.html 實跑主要使用流程。先跑 build/build.py。"""
import http.server, json, threading
from functools import partial
from pathlib import Path
import pytest
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parent.parent
PORT = 18493

@pytest.fixture(scope="module")
def page_url():
    handler = partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT / "dist"))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    yield f"http://127.0.0.1:{PORT}/icd10.html"
    srv.shutdown()

@pytest.fixture(scope="module")
def page(page_url):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(permissions=["clipboard-read", "clipboard-write"])
        pg = ctx.new_page()
        pg.goto(page_url)
        pg.wait_for_selector('body[data-ready="1"]', timeout=5000)
        yield pg
        browser.close()

def reset(pg):
    pg.click("#clear-cart")
    pg.fill("#search", "")

def test_load_and_status(page):
    expect(page.locator("#status")).to_contain_text("96,802")

def test_load_performance(page_url, page):
    ms = page.evaluate("""() => {
        const [nav] = performance.getEntriesByType('navigation');
        return nav.domContentLoadedEventEnd - nav.startTime;
    }""")
    assert ms < 2000, f"載入至 DOMContentLoaded 花了 {ms:.0f}ms"

def test_search_english_chinese_code(page):
    reset(page)
    page.fill("#search", "cellulitis")
    expect(page.locator("#search-results .chip").first).to_contain_text("L03", timeout=2000)
    page.fill("#search", "蜂窩")
    expect(page.locator("#search-results .chip").first).to_contain_text("蜂窩", timeout=2000)
    page.fill("#search", "E119")
    expect(page.locator("#search-results .chip").first).to_contain_text("E11.9", timeout=2000)

def test_category_code_not_addable(page):
    reset(page)
    page.fill("#search", "E11")
    page.wait_for_selector("#search-results .chip.cat")
    page.locator("#search-results .chip.cat").first.click()
    assert page.locator("#cart li").count() == 0

def test_quick_add_and_related(page):
    reset(page)
    # N39.0 同時出現在症狀面板（預設收合）與快速清單（#quick，恆常可見），
    # 明確限定 #quick 範圍以點擊可見的那顆（symptoms 面板另有覆蓋於 test_mode_switch 一類情境）。
    page.locator('#quick .chip[data-code="N39.0"]').first.click()
    expect(page.locator('#cart li[data-code="N39.0"]')).to_have_count(1)
    # 人工關聯：病原碼；家族碼：N39 類目
    expect(page.locator('#related .chip[data-code="B96.20"]')).to_have_count(1)
    # 連鎖：點相關碼也進清單並更新推薦
    page.locator('#related .chip[data-code="B96.20"]').click()
    expect(page.locator('#cart li[data-code="B96.20"]')).to_have_count(1)

def test_duplicate_not_added(page):
    reset(page)
    page.locator('.chip[data-code="I10"]').first.click()
    page.locator('.chip[data-code="I10"]').first.click()
    expect(page.locator("#cart li")).to_have_count(1)

def test_mode_switch(page):
    reset(page)
    page.click("#mode-surg")
    expect(page.locator("#panels-title")).to_contain_text("外科")
    expect(page.locator('#quick .chip[data-code="Z48.02"]')).to_have_count(1)
    page.click("#mode-im")
    expect(page.locator("#panels-title")).to_contain_text("內科")

def test_copy_formats(page):
    reset(page)
    page.locator('.chip[data-code="I10"]').first.click()
    page.locator('.chip[data-code="E11.9"]').first.click()
    # Windows 剪貼簿會把 \n 正規化成 \r\n（OS/瀏覽器行為，非 app 邏輯問題），比對前先還原成 \n。
    page.click("#copy-lines")
    assert page.evaluate("navigator.clipboard.readText()").replace("\r\n", "\n") == "I10\nE11.9"
    page.click("#copy-comma")
    assert page.evaluate("navigator.clipboard.readText()").replace("\r\n", "\n") == "I10,E11.9"
    page.click("#copy-names")
    text = page.evaluate("navigator.clipboard.readText()").replace("\r\n", "\n")
    assert text.startswith("I10\t") and "E11.9\t" in text

def test_remove_and_clear(page):
    reset(page)
    page.locator('.chip[data-code="I10"]').first.click()
    page.locator('.chip[data-code="E11.9"]').first.click()
    page.locator('#cart li[data-code="I10"] button').click()
    expect(page.locator("#cart li")).to_have_count(1)
    page.click("#clear-cart")
    expect(page.locator("#cart li")).to_have_count(0)

def test_reload_clears_cart(page, page_url):
    page.locator('.chip[data-code="I10"]').first.click()
    page.reload()
    page.wait_for_selector('body[data-ready="1"]')
    expect(page.locator("#cart li")).to_have_count(0)
