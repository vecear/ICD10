"""E2E：鍵盤操作後焦點不掉回 <body>（UX 稽核 F5），三套版面參數化。

部位列與清單是整塊重建的，重建前焦點若在裡面就會落回 <body>，下一步得從頭 Tab：
選部位之後 18～22 次才回到第一個碼，1a 從搜尋框到第 3 筆的「主」要 201 次。
這裡釘三件事：Enter 選部位 → 焦點留在那顆部位鈕；Enter 設主 → 焦點跟著那一筆到第 1 列
（而且不能把清單捲走）；Enter 清空 → 焦點到搜尋框。
"""
from pathlib import Path

import pytest
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parent.parent
LAYOUTS = {
    "wide": ({"width": 1440, "height": 900}, "wide"),
    "dock": ({"width": 340, "height": 900}, "dock"),
    "mobile": ({"width": 390, "height": 844}, "wide"),     # 偏好 wide、寬度不足時降級成 1b
}
ACTIVE = """() => { const e = document.activeElement;
  if (!e || e === document.body) return { tag: 'BODY' };
  const li = e.closest('li[data-code]');
  return { tag: e.tagName, id: e.id, cls: String(e.className || ''),
           region: e.dataset ? e.dataset.regionIndex : null,
           code: li ? li.dataset.code : null,
           first: li ? li === li.parentNode.firstElementChild : null }; }"""


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch()
        yield b
        b.close()


@pytest.fixture(params=sorted(LAYOUTS))
def page(browser, request):
    viewport, pref = LAYOUTS[request.param]
    ctx = browser.new_context(viewport=viewport, permissions=["clipboard-read", "clipboard-write"])
    ctx.add_init_script(f"localStorage.setItem('icd10.layout', JSON.stringify('{pref}'))")
    pg = ctx.new_page()
    pg.goto((ROOT / "dist" / "icd10.html").as_uri())
    pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
    expect(pg.locator("body")).to_have_attribute("data-layout", request.param)
    pg.evaluate("() => window.ICDApp.data.ensureDb()")
    pg.wait_for_selector('body[data-db="ready"]', timeout=30000)
    yield pg
    ctx.close()


def active(page):
    return page.evaluate(ACTIVE)


def show_cart(page):
    """1b 的清單抽屜預設收合；1c 預設展開。"""
    if page.locator("#cart").is_hidden() and page.locator("#cart-toggle").count():
        page.click("#cart-toggle")
    expect(page.locator("#cart li").first).to_be_visible()


def test_enter_on_region_keeps_focus_on_that_button(page):
    btn = page.locator('.region-btn[data-region-index="2"]')
    btn.focus()
    page.keyboard.press("Enter")
    page.wait_for_timeout(200)
    assert page.evaluate("() => window.ICDApp.store.getState().region") == 2
    a = active(page)
    assert a["tag"] != "BODY", "選部位之後焦點掉回 <body>"
    assert a["region"] == "2", a


def test_enter_on_primary_follows_the_row_to_the_top(page):
    for code in ("I10", "E11.9", "E78.5"):
        page.evaluate("(c) => window.ICDApp.store.addCode(c, window.ICDApp.data.labelOf(c) || c)", code)
    show_cart(page)
    page.locator('#cart li[data-code="E78.5"] .cart-primary').focus()
    page.keyboard.press("Enter")
    page.wait_for_timeout(200)
    assert page.evaluate("() => window.ICDApp.store.getState().cart[0].code") == "E78.5"
    a = active(page)
    assert a["tag"] != "BODY", "設主之後焦點掉回 <body>"
    assert a["code"] == "E78.5" and a["first"], f"焦點沒有跟著那一筆到第 1 列：{a}"


def test_enter_on_clear_moves_focus_to_search(page):
    page.evaluate("() => window.ICDApp.store.addCode('I10', window.ICDApp.data.labelOf('I10') || 'I10')")
    show_cart(page)
    page.locator("#clear-cart").focus()
    page.keyboard.press("Enter")
    page.wait_for_timeout(200)
    assert page.evaluate("() => window.ICDApp.store.getState().cart.length") == 0
    assert active(page)["id"] == "search", active(page)
