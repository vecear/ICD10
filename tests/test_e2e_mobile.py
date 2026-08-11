"""E2E（1b 手機看診）：390×844、觸控模式下對 dist/icd10.html 實跑主要使用流程。

conftest.py 的 session fixture 已先跑過 build/build.py，這裡測到的一定是當前 src。
DOM 契約見 .review/design-ref/impl-plan.md §4.2／§4.4；1a 桌機的測試在 tests/e2e_test.py。

手機版的三個關鍵不變量（壞掉就是回歸）：
  1. 視窗 <900px 自動採用手機版面，且**任何狀態下都不得水平捲動**。
  2. 底部固定列永遠可見，且**不會蓋住捲動區的最後一列**（fixed 底部列的典型缺陷）。
  3. 急診紅旗不得洩漏到門診——面板與相關碼兩處都要驗（臨床安全，最高優先）。
"""
import http.server
import json
import threading
from functools import partial
from pathlib import Path

import pytest
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parent.parent
CURATED_DIR = ROOT / "src" / "curated"
PORT = 18596
MOBILE = {"width": 390, "height": 844}


def region_for_panel(filename, panel_name):
    """從 curated JSON 動態找出含有該面板的部位群組名稱（分群屬內容，會隨改版調整）。"""
    groups = json.loads((CURATED_DIR / filename).read_text(encoding="utf-8"))
    for region in groups:
        if any(p["name"] == panel_name for p in region["panels"]):
            return region["name"]
    raise AssertionError(f"{filename} 找不到面板「{panel_name}」")


@pytest.fixture(scope="module")
def page_url():
    handler = partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT / "dist"))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{PORT}/icd10.html"
    srv.shutdown()


@pytest.fixture(scope="module")
def browser_ctx(page_url):
    """真手機條件：390×844＋is_mobile＋has_touch（hover 不存在，觸控目標才是重點）。"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(
            viewport=dict(MOBILE),
            is_mobile=True,
            has_touch=True,
            device_scale_factor=2,
            permissions=["clipboard-read", "clipboard-write"],
        )
        yield ctx
        browser.close()


@pytest.fixture(scope="module")
def page(browser_ctx, page_url):
    """主測試頁：全庫索引先拉起來，類目碼防呆才測得到葉碼規則而不是建置期白名單。"""
    pg = browser_ctx.new_page()
    pg.goto(page_url)
    pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
    pg.evaluate("() => window.ICDApp.data.ensureDb()")
    pg.wait_for_selector('body[data-db="ready"]', timeout=30000)
    yield pg
    pg.close()


# ---- 共用操作 ----
def reset(pg):
    """回到乾淨起點：空清單、門診模式、無搜尋、抽屜與設定收合。"""
    pg.evaluate("""() => {
        const s = window.ICDApp.store;
        s.clearCart();
        s.setMode('outpatient');
        s.setRegion(0);          // 取消選取（region=null）會跨模式保留，這裡明確歸位
        s.setQuery('');
        s.setFormat('lines');
        s.setSettingsOpen(false);
        s.resetPaneSizes();      // 窗格高度會寫 localStorage，殘留會讓別條測試量到上一條拖出來的高度
        s.setState({ favs: [], recent: [], expanded: {}, copied: false });
    }""")
    pg.fill("#search", "")
    if pg.locator("#cart-sheet").is_visible():
        pg.click("#cart-toggle")


def go_region(pg, filename, panel_name):
    pg.click(f'.region-pill[data-region="{region_for_panel(filename, panel_name)}"]')


def search(pg, text):
    pg.fill("#search", text)
    pg.wait_for_timeout(300)      # 150ms debounce ＋ 重繪


def box(locator):
    b = locator.bounding_box()
    assert b is not None, "元素沒有可量測的位置"
    return b


def doc_metrics(pg):
    return pg.evaluate(
        """() => ({
            scrollW: document.documentElement.scrollWidth,
            clientW: document.documentElement.clientWidth,
            bodyScrollW: document.body.scrollWidth,
        })"""
    )


def assert_no_h_scroll(pg, tag):
    m = doc_metrics(pg)
    assert m["scrollW"] <= m["clientW"], f"{tag}：文件水平溢出 {m['scrollW']} > {m['clientW']}"
    assert m["bodyScrollW"] <= m["clientW"], f"{tag}：body 水平溢出 {m['bodyScrollW']} > {m['clientW']}"


# ══════════════════════════════════════════════════════════════════════════
# 版面採用與框架
# ══════════════════════════════════════════════════════════════════════════
def test_mobile_layout_is_used_at_390(page):
    """390×844 自動採用手機版面（斷點 900，impl-plan §4.6），且只掛這一套。"""
    reset(page)
    expect(page.locator("body")).to_have_attribute("data-layout", "mobile")
    expect(page.locator("#layout-mobile")).to_be_visible()
    assert page.locator("#layout-wide").count() == 0
    assert page.locator("#layout-dock").count() == 0
    # 一次只掛一套版面 → 全域 id 不得重複（impl-plan R-10）
    dupes = page.evaluate(
        """() => {
            const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
            return ids.filter((id, i) => ids.indexOf(id) !== i);
        }"""
    )
    assert dupes == [], f"重複 id：{dupes}"


@pytest.mark.parametrize("scenario", ["idle", "emergency", "surg", "search", "cart"])
def test_no_horizontal_overflow(page, scenario):
    """任何狀態下都不得水平捲動——手機上一旦溢出，整頁左右晃動就無法選碼。"""
    reset(page)
    if scenario == "emergency":
        page.evaluate("() => window.ICDApp.store.setMode('emergency')")
    elif scenario == "surg":
        page.evaluate("() => window.ICDApp.store.setMode('surg')")
    elif scenario == "search":
        search(page, "cellulitis")
    elif scenario == "cart":
        page.locator("#panels .chip--row").first.click()
        page.locator("#related .chip--row").first.click()
        page.click("#cart-toggle")
        expect(page.locator("#cart-sheet")).to_be_visible()
    page.wait_for_timeout(120)
    assert_no_h_scroll(page, scenario)


def test_touch_targets_are_at_least_44px(page):
    """觸控目標一律 ≥44px：手機上沒有 hover，點不準就是選錯碼。"""
    reset(page)
    page.locator("#panels .chip--row").first.click()      # 讓底部列與抽屜有內容
    page.click("#cart-toggle")
    expect(page.locator("#cart-sheet")).to_be_visible()
    checks = [
        ("#search", 44),
        ("#settings-toggle", 44),
        ("#copy-all", 48),
        ("#cart-toggle", 48),
        (".region-pill", 44),
        ("#panels .chip--row", 48),
        ("#cart li .cart-primary", 44),
        ("#cart li .cart-remove", 44),
        ("#clear-cart", 44),
    ]
    for selector, minimum in checks:
        b = box(page.locator(selector).first)
        assert b["height"] >= minimum - 0.5, f"{selector} 高度只有 {b['height']:.1f}px（需 ≥{minimum}）"
    # 44×44 是雙向要求，橫向也要夠
    assert box(page.locator("#settings-toggle")).get("width", 0) >= 44
    assert box(page.locator("#cart li .cart-remove").first)["width"] >= 44


# ══════════════════════════════════════════════════════════════════════════
# 部位 pill 列與面板卡片
# ══════════════════════════════════════════════════════════════════════════
def test_region_pills_scroll_horizontally(page):
    """部位是橫向捲動的 pill 列（設計 L370-374）：自己捲，不把文件撐寬。"""
    reset(page)
    pills = page.locator(".region-pill")
    assert pills.count() >= 4
    metrics = page.eval_on_selector(
        "#region-pills",
        "(el) => ({ scrollW: el.scrollWidth, clientW: el.clientWidth, overflowX: getComputedStyle(el).overflowX })",
    )
    assert metrics["overflowX"] in ("auto", "scroll")
    assert metrics["scrollW"] > metrics["clientW"], "pill 列沒有溢出，測不到橫向捲動"
    assert_no_h_scroll(page, "pill 列")
    # 所有 pill 都在同一列（沒有換行）
    tops = page.eval_on_selector_all(
        ".region-pill", "(els) => [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().top)))]"
    )
    assert len(tops) == 1, f"pill 換行了，出現 {len(tops)} 列"
    # 點第二顆 → 選取狀態與面板都跟著換
    second = pills.nth(1)
    name = second.get_attribute("data-region")
    second.click()
    expect(page.locator(f'.region-pill[data-region="{name}"]')).to_have_attribute("aria-selected", "true")
    expect(page.locator(".mobile-panel").first).to_be_visible()


def test_region_toggle_clears_selection_and_shows_all(page):
    """已選的部位再點一次＝取消選取，改顯示全部部位的面板卡，且不得撐出水平捲動。

    橫捲 pill 列擠不下「目前顯示全部」的說明，所以取消後靠每組面板前的部位標題辨識來源。
    """
    reset(page)
    pills = page.locator(".region-pill")
    region_count = pills.count()
    second = pills.nth(1)
    second.click()
    expect(second).to_have_attribute("aria-selected", "true")
    one_region_cards = page.locator(".mobile-panel").count()
    assert page.locator("#panels .region-heading").count() == 0, "選了部位時不該出現部位標題"

    second.click()
    expect(second).to_have_attribute("aria-selected", "false")
    assert page.locator('.region-pill[aria-selected="true"]').count() == 0, "取消後仍有部位被標為選取"
    assert page.evaluate("() => window.ICDApp.store.getState().region") is None

    total = page.evaluate(
        """() => {
            const d = window.ICDApp.data, mode = window.ICDApp.store.getState().mode;
            return d.regionsFor(mode).reduce((n, r, i) => n + d.panelsFor(mode, i).length, 0);
        }"""
    )
    expect(page.locator(".mobile-panel")).to_have_count(total)
    assert total > one_region_cards, f"顯示全部（{total}）沒有比單一部位（{one_region_cards}）多"
    expect(page.locator("#panels .region-heading")).to_have_count(region_count)
    assert_no_h_scroll(page, "取消部位選取")
    # 底部固定列仍在視野內（顯示全部把捲動區拉長，不得把它擠掉）
    expect(page.locator("#cart-bar")).to_be_visible()

    pills.nth(0).click()
    expect(pills.nth(0)).to_have_attribute("aria-selected", "true")
    assert page.locator("#panels .region-heading").count() == 0


def test_mode_buttons_switch_mode(page):
    """三顆模式鈕直接並排，一次點擊就切換（1a／1c／1b 同一份行為）。

    手機專屬條件：三顆鈕自己佔一行、每顆都是 ≥44px 的觸控目標，且不得撐出水平捲動。
    """
    reset(page)
    switch = page.locator("#mode-switch")
    btns = switch.locator("[data-mode]")
    expect(btns).to_have_count(3)
    assert page.locator("#mode-menu").count() == 0, "已改成三鈕並排，不得再有展開的選單"
    expect(switch.locator('[data-mode="outpatient"]')).to_have_attribute("aria-pressed", "true")
    for label in ("內科門診", "內科急診", "外科"):
        expect(switch.locator(f'[data-mode]:text-is("{label}")')).to_be_visible()

    boxes = page.eval_on_selector_all(
        "#mode-switch [data-mode]", "(els) => els.map((e) => e.getBoundingClientRect().toJSON())"
    )
    assert min(b["height"] for b in boxes) >= 43.5, \
        f"模式鈕最矮只有 {min(b['height'] for b in boxes):.1f}px（觸控門檻 44）"
    assert max(b["y"] for b in boxes) - min(b["y"] for b in boxes) < 1, f"三顆鈕沒有並排：{boxes}"
    assert max(b["x"] + b["width"] for b in boxes) <= MOBILE["width"] + 0.5, f"模式鈕溢出：{boxes}"
    # 搜尋框與設定鈕被擠到下一行，兩者都還在且維持 44px
    assert box(page.locator("#search"))["y"] > max(b["y"] for b in boxes), "搜尋框應在模式列下方"
    assert box(page.locator("#search"))["height"] >= 43.5
    assert box(page.locator("#settings-toggle"))["height"] >= 43.5
    assert_no_h_scroll(page, "三顆模式鈕並排")

    # 一次點擊即切換（不必先展開任何東西）
    switch.locator('[data-mode="emergency"]').click()
    expect(page.locator("body")).to_have_attribute("data-mode", "emergency")
    expect(switch.locator('[data-mode="emergency"]')).to_have_attribute("aria-pressed", "true")
    expect(switch.locator('[data-mode="outpatient"]')).to_have_attribute("aria-pressed", "false")
    assert "is-on" in switch.locator('[data-mode="emergency"]').get_attribute("class")
    assert_no_h_scroll(page, "切到急診")

    # 兩條動線同步：設定 sheet 裡的 segmented 也要跟著選中
    page.click("#settings-toggle")
    expect(page.locator("#mode-er")).to_have_attribute("aria-pressed", "true")
    page.click("#mode-op")                                  # 反向：popover 切了，三鈕跟著變
    expect(page.locator("#settings-popover")).to_be_hidden()
    expect(switch.locator('[data-mode="outpatient"]')).to_have_attribute("aria-pressed", "true")
    reset(page)


def test_region_all_button(page):
    """橫捲部位列最前面的「全部」鈕：未選部位時＝選中，點它＝取消部位篩選。

    手機專屬條件：它黏在最左邊（sticky），捲到最右邊也按得到，且高度守住 44px。
    """
    reset(page)
    all_btn = page.locator(".region-all-btn")
    pills = page.locator(".region-pill")
    expect(all_btn).to_have_count(1)
    region_count = pills.count()
    assert box(all_btn)["height"] >= 43.5, f"「全部」高度只有 {box(all_btn)['height']:.1f}px"
    assert box(all_btn)["x"] < box(pills.nth(0))["x"], "「全部」不在部位列最前面"

    expect(all_btn).to_have_attribute("aria-selected", "false")
    all_btn.click()
    expect(all_btn).to_have_attribute("aria-selected", "true")
    assert page.evaluate("() => window.ICDApp.store.getState().region") is None
    assert page.locator('.region-pill[aria-selected="true"]').count() == 0
    expect(page.locator("#panels .region-heading")).to_have_count(region_count)
    assert_no_h_scroll(page, "「全部」選中")

    # 橫捲到最右邊仍然按得到（sticky 黏在左緣）：第一顆部位已被捲出視窗，「全部」沒有
    page.eval_on_selector("#region-pills", "(el) => { el.scrollLeft = el.scrollWidth; }")
    page.wait_for_timeout(60)
    assert box(pills.nth(0))["x"] < 0, "部位列沒有真的捲動，測不到 sticky"
    assert box(all_btn)["x"] >= -0.5, f"捲到最右邊後「全部」被捲走了（x={box(all_btn)['x']:.0f}）"

    page.eval_on_selector("#region-pills", "(el) => { el.scrollLeft = 0; }")
    pills.nth(1).click()
    expect(all_btn).to_have_attribute("aria-selected", "false")
    assert page.locator("#panels .region-heading").count() == 0
    # 既有的「再點一次取消」快捷保留，結果與按「全部」一致
    pills.nth(1).click()
    expect(all_btn).to_have_attribute("aria-selected", "true")


def test_panel_cards_and_48px_code_rows(page):
    """面板是卡片＋滿版色帶標題；代碼是 48px 整列（左代碼、中中文、右＋）。"""
    reset(page)
    cards = page.locator(".mobile-panel[data-panel]")
    assert cards.count() >= 1
    title = cards.first.locator(".m-panel-title")
    band = title.evaluate(
        "(el) => { const cs = getComputedStyle(el); return { bg: cs.backgroundColor, w: el.getBoundingClientRect().width }; }"
    )
    card_w = box(cards.first)["width"]
    assert band["w"] >= card_w - 2, "標題色帶不是滿版"
    assert band["bg"] not in ("rgba(0, 0, 0, 0)", "transparent"), "標題色帶沒有底色"

    rows = page.locator("#panels .chip--row")
    assert rows.count() >= 2
    heights = page.eval_on_selector_all(
        "#panels .chip--row", "(els) => els.map((e) => e.getBoundingClientRect().height)"
    )
    assert min(heights) >= 47.5, f"代碼列最矮只有 {min(heights):.1f}px"
    first = rows.first
    expect(first.locator("b")).to_have_text(first.get_attribute("data-code"))
    # 右側的「＋」是 ::after，抓 computed content 驗證（不佔 DOM 節點）
    plus = first.evaluate("(el) => getComputedStyle(el, '::after').content")
    assert "＋" in plus, f"代碼列右側沒有加號提示：{plus}"


def test_panel_toggle_expands_diseases(page):
    """常見疾病預設收合，展開後可加碼（設計 L396）。"""
    reset(page)
    card = page.locator('.mobile-panel:has(.panel-toggle)').first
    toggle = card.locator(".panel-toggle")
    expect(toggle).to_have_attribute("aria-expanded", "false")
    before = card.locator(".chip--row").count()
    toggle.click()
    expect(toggle).to_have_attribute("aria-expanded", "true")
    after = card.locator(".chip--row").count()
    assert after > before, "展開後沒有多出常見疾病列"
    toggle.click()
    expect(toggle).to_have_attribute("aria-expanded", "false")
    assert card.locator(".chip--row").count() == before


# ══════════════════════════════════════════════════════════════════════════
# 加碼、底部固定列、複製
# ══════════════════════════════════════════════════════════════════════════
def test_tap_code_row_adds_and_bar_shows_summary(page):
    """觸控點擊代碼列即加入；底部固定列顯示「本次就診清單 N」與代碼串。"""
    reset(page)
    expect(page.locator("#cart-inline")).to_have_text("尚未選碼")
    first = page.locator("#panels .chip--row").first
    code = first.get_attribute("data-code")
    first.tap()                                   # 真觸控事件，不是滑鼠
    expect(page.locator("#cart-count")).to_have_text("1")
    expect(page.locator("#cart-inline")).to_have_text(code)
    second = page.locator("#related .chip--row").first
    code2 = second.get_attribute("data-code")
    second.tap()
    expect(page.locator("#cart-count")).to_have_text("2")
    expect(page.locator("#cart-inline")).to_have_text(f"{code}、{code2}")
    # 底部列在視野內且緊貼底部
    bar = box(page.locator("#cart-bar"))
    assert abs(bar["y"] + bar["height"] - MOBILE["height"]) < 1.5, "底部列沒有貼齊視窗底"


def test_cart_bar_does_not_cover_content(page):
    """取代已刪除的 test_mobile_cart_pane_not_sticky：捲到底時最後一列不得被底部列蓋住。"""
    reset(page)
    page.locator("#panels .chip--row").first.click()     # 讓相關碼區也出現，壓縮捲動區
    page.evaluate("() => { const s = document.querySelector('.m-scroll'); s.scrollTop = s.scrollHeight; }")
    page.wait_for_timeout(150)
    geom = page.evaluate(
        """() => {
            const rows = document.querySelectorAll('.m-scroll .chip--row');
            const last = rows[rows.length - 1].getBoundingClientRect();
            const scroll = document.querySelector('.m-scroll').getBoundingClientRect();
            const bar = document.getElementById('cart-bar').getBoundingClientRect();
            const related = document.getElementById('mobile-related').getBoundingClientRect();
            return { lastBottom: last.bottom, scrollBottom: scroll.bottom, barTop: bar.top, relatedTop: related.top };
        }"""
    )
    assert geom["lastBottom"] <= geom["barTop"] + 0.5, "捲到底時最後一列被底部列蓋住"
    assert geom["lastBottom"] <= geom["relatedTop"] + 0.5, "最後一列被相關碼區蓋住"
    assert geom["scrollBottom"] <= geom["relatedTop"] + 0.5, "捲動區與相關碼區重疊"


def test_copy_matches_preview_and_format(page):
    """複製鈕內容 === 抽屜裡的 #his-preview（看到的＝貼出去的），且吃設定的格式。"""
    reset(page)
    page.locator('#panels .chip--row').first.click()
    page.locator("#related .chip--row").first.click()
    codes = page.evaluate("() => window.ICDApp.store.getState().cart.map((x) => x.code)")

    page.click("#cart-toggle")
    expect(page.locator("#cart-sheet")).to_be_visible()
    page.click("#copy-all")
    clip = page.evaluate("navigator.clipboard.readText()").replace("\r\n", "\n")
    assert clip == "\n".join(codes)
    assert clip == page.locator("#his-preview").text_content()
    expect(page.locator("#copy-all")).to_contain_text("已複製")

    # 換成逗號分隔（設定 popover 內），預覽與剪貼簿同步改變
    page.click("#settings-toggle")
    page.click('#seg-format button[data-format="comma"]')
    page.keyboard.press("Escape")
    expect(page.locator("#his-format-label")).to_have_text("逗號分隔")
    page.click("#copy-all")
    clip = page.evaluate("navigator.clipboard.readText()").replace("\r\n", "\n")
    assert clip == ",".join(codes)
    assert clip == page.locator("#his-preview").text_content()


def test_cart_sheet_primary_and_remove(page):
    """C6：手機不做拖曳換序，改用「主」鈕；誤點的碼也要能移除。"""
    reset(page)
    page.locator("#panels .chip--row").first.click()
    page.locator("#related .chip--row").first.click()
    codes = page.evaluate("() => window.ICDApp.store.getState().cart.map((x) => x.code)")
    page.click("#cart-toggle")
    sheet = page.locator("#cart-sheet")
    expect(sheet).to_be_visible()
    expect(page.locator("#cart-toggle")).to_have_attribute("aria-expanded", "true")

    # 拖曳把手與 draggable 都不該存在（觸控裝置不觸發 HTML5 DnD，留著是假可供性）
    # 先確定真的有列可驗：count()==0 與 every() 在空清單上都會「靜默通過」
    expect(page.locator("#cart li")).to_have_count(2)
    assert page.locator("#cart li .cart-grip").count() == 0
    assert page.eval_on_selector_all("#cart li", "(els) => els.every((e) => e.draggable === false)")

    page.click(f'#cart li[data-code="{codes[1]}"] .cart-primary')
    expect(page.locator("#cart li").first).to_have_attribute("data-code", codes[1])
    expect(page.locator("#cart li").first.locator(".cart-badge")).to_have_attribute("data-primary", "true")
    # to_have_text 會正規化空白，換行的比對改用 text_content()
    assert page.locator("#his-preview").text_content() == f"{codes[1]}\n{codes[0]}"
    expect(page.locator("#cart-inline")).to_have_text(f"{codes[1]}、{codes[0]}")

    page.click(f'#cart li[data-code="{codes[0]}"] .cart-remove')
    expect(page.locator("#cart li")).to_have_count(1)
    page.click("#clear-cart")
    expect(page.locator("#cart-inline")).to_have_text("尚未選碼")
    expect(sheet).to_be_hidden()


# ══════════════════════════════════════════════════════════════════════════
# 相關碼、搜尋、設定
# ══════════════════════════════════════════════════════════════════════════
def test_related_section_appears_above_cart_bar(page):
    """相關碼區在底部列上方，空的時候整段收起來，最高 190px 可捲（設計 L401-415）。"""
    reset(page)
    expect(page.locator("#mobile-related")).to_be_hidden()
    go_region(page, "internal_outpatient.json", "頭痛")
    page.click('#panels .chip--row[data-code="R51.9"]')
    related = page.locator("#mobile-related")
    expect(related).to_be_visible()
    expect(page.locator('#related .chip--row[data-code="G43.909"]')).to_have_count(1)
    assert page.locator("#related .chip--row").count() >= 1
    geom = page.evaluate(
        """() => {
            const r = document.getElementById('related');
            const wrap = document.getElementById('mobile-related').getBoundingClientRect();
            const bar = document.getElementById('cart-bar').getBoundingClientRect();
            return { maxH: parseFloat(getComputedStyle(r).maxHeight), h: r.getBoundingClientRect().height,
                     wrapBottom: wrap.bottom, barTop: bar.top };
        }"""
    )
    assert geom["maxH"] <= 190.5, f"相關碼捲動區 max-height 是 {geom['maxH']}"
    assert geom["h"] <= 190.5
    assert geom["wrapBottom"] <= geom["barTop"] + 0.5, "相關碼區不在底部列上方"
    # 加入建議碼後該碼進清單、並從建議中消失（沿用既有行為）
    page.click('#related .chip--row[data-code="G43.909"]')
    expect(page.locator("#cart-inline")).to_contain_text("G43.909")
    expect(page.locator('#related .chip--row[data-code="G43.909"]')).to_have_count(0)


def test_search_results_are_rows_and_category_not_addable(page):
    """搜尋結果同樣是 48px 整列；類目碼虛線、點了也加不進去。"""
    reset(page)
    search(page, "cellulitis")
    expect(page.locator('#search-results .chip--row[data-code^="L03"]').first).to_be_visible(timeout=2000)
    heights = page.eval_on_selector_all(
        "#search-results .chip--row", "(els) => els.map((e) => e.getBoundingClientRect().height)"
    )
    assert min(heights) >= 47.5

    search(page, "E11")
    page.wait_for_selector("#search-results .chip.cat")
    cat = page.locator("#search-results .chip.cat").first
    expect(cat).to_have_attribute("data-leaf", "0")
    cat.click(force=True)      # aria-disabled 而非 disabled，真使用者點得下去
    expect(page.locator("#cart-inline")).to_have_text("尚未選碼")
    assert_no_h_scroll(page, "搜尋結果")


def test_settings_sheet_opens_below_header(page):
    """設定 sheet 由 header 下方展開（left:12 / right:12），Esc 與外點都能關。

    上緣不寫死數字：header 現在是「模式三鈕一行 ＋ 搜尋／設定一行」，寫死的座標會在
    header 高度一變就靜默失準。要守的是那條規則本身——sheet 不得蓋住開它的那顆鈕
    （蓋住就再點一次關不掉，同 1c 那條教訓）。
    """
    reset(page)
    pop = page.locator("#settings-popover")
    expect(pop).to_be_hidden()
    page.click("#settings-toggle")
    expect(pop).to_be_visible()
    expect(page.locator("#settings-toggle")).to_have_attribute("aria-expanded", "true")
    b = box(pop)
    toggle = box(page.locator("#settings-toggle"))
    assert abs(b["x"] - 12) < 1, f"sheet 左緣 {b['x']}"
    assert abs(b["width"] - (MOBILE["width"] - 24)) < 1, f"sheet 寬度 {b['width']}"
    assert b["y"] >= toggle["y"] + toggle["height"] - 0.5, \
        f"sheet 蓋住了開它的那顆鈕：sheet={b} toggle={toggle}"
    assert b["y"] <= toggle["y"] + toggle["height"] + 12, f"sheet 離 header 太遠：{b}"
    # 桌機才有意義的兩項（版面切換、常用列）在手機藏起來
    expect(page.locator("#seg-layout")).to_be_hidden()
    expect(page.locator("#shelf-toggle")).to_be_hidden()
    expect(page.locator("#db-note")).to_contain_text("96,802")

    # 模式切換：header 三鈕與面板一起換
    page.click("#mode-er")
    expect(pop).to_be_hidden()
    expect(page.locator('#mode-switch [data-mode="emergency"]')).to_have_attribute("aria-pressed", "true")
    expect(page.locator("body")).to_have_attribute("data-mode", "emergency")

    page.click("#settings-toggle")
    expect(pop).to_be_visible()
    page.keyboard.press("Escape")
    expect(pop).to_be_hidden()

    page.click("#settings-toggle")
    expect(pop).to_be_visible()
    page.locator("#cart-bar").click(position={"x": 5, "y": 5})    # 外點關閉
    expect(pop).to_be_hidden()


# ══════════════════════════════════════════════════════════════════════════
# 臨床安全
# ══════════════════════════════════════════════════════════════════════════
def test_red_flags_do_not_leak_into_outpatient(page):
    """最高優先：急診紅旗只屬於急診，門診的面板與相關碼都不得出現。"""
    reset(page)
    go_region(page, "internal_outpatient.json", "頭痛")
    outpatient_panel = page.locator('.mobile-panel[data-panel="頭痛"]')
    expect(outpatient_panel).to_be_visible()
    assert page.locator("#panels .chip--warn").count() == 0, "門診面板渲染出紅旗碼"
    for code in ("G03.9", "I60.9"):
        assert page.locator(f'#panels .chip[data-code="{code}"]').count() == 0

    page.click('#panels .chip--row[data-code="R51.9"]')
    expect(page.locator('#related .chip[data-code="G43.909"]')).to_have_count(1)
    expect(page.locator('#related .chip[data-code="G03.9"]')).to_have_count(0)
    expect(page.locator('#related .chip[data-code="I60.9"]')).to_have_count(0)

    # 同一個面板在急診模式才看得到紅旗
    reset(page)
    page.evaluate("() => window.ICDApp.store.setMode('emergency')")
    go_region(page, "internal_emergency.json", "頭痛")
    er_panel = page.locator('.mobile-panel[data-panel="頭痛"]')
    expect(er_panel.locator(".m-redflag-label")).to_be_visible()
    expect(er_panel.locator('.chip--warn[data-code="G03.9"]')).to_have_count(1)
    page.click('#panels .chip--row[data-code="R51.9"]')
    expect(page.locator('#related .chip[data-code="G03.9"]')).to_have_count(1)

    # 切回門診：相關碼清空，紅旗不得殘留
    page.evaluate("() => window.ICDApp.store.setMode('outpatient')")
    expect(page.locator("#related .chip")).to_have_count(0)
    expect(page.locator("#mobile-related")).to_be_hidden()
    assert page.locator("#panels .chip--warn").count() == 0


def test_no_page_errors_during_main_flow(browser_ctx, page_url):
    """整段主要動線不得丟出未處理例外（手機版自己掛的 #cart-toggle 監聽是新風險面）。"""
    errors = []
    pg = browser_ctx.new_page()
    pg.on("pageerror", lambda e: errors.append(str(e)))
    try:
        pg.goto(page_url)
        pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
        pg.locator("#panels .chip--row").first.click()
        pg.click("#cart-toggle")
        pg.click("#cart-toggle")
        pg.click("#settings-toggle")
        pg.click("#mode-surg")
        pg.locator(".region-pill").last.click()
        pg.fill("#search", "L03")
        pg.wait_for_timeout(400)
        pg.click("#copy-all")
        pg.wait_for_timeout(200)
        assert errors == [], f"主要動線丟出例外：{errors}"
    finally:
        pg.close()


# ══════════════════════════════════════════════════════════════════════════
# R2 測試盲點補強（.review/r2-pipeline.md (b) 第 2、7 條）
# ══════════════════════════════════════════════════════════════════════════
def inject_probe_chips(pg, codes):
    """注入「沒有 .cat class」的可點 chip，繞過 UI 層標記直接走事件委派進 addCode()。

    正常渲染會替非葉碼加上 .cat（委派據此擋掉），所以 store 的 canAdd → data.isAddable()
    那條防線在一般操作下永遠走不到。這裡刻意製造「上游防線被繞過」的情境。
    """
    pg.evaluate(
        """(codes) => {
            document.getElementById('probe-chips')?.remove();
            const box = document.createElement('div');
            box.id = 'probe-chips';
            box.style.cssText = 'position:fixed;left:0;top:0;z-index:999999;background:#fff';
            for (const code of codes) {
                const b = document.createElement('button');
                b.className = 'chip';          // 刻意不加 .cat
                b.dataset.code = code;
                b.textContent = code;
                box.appendChild(b);
            }
            document.body.appendChild(box);
        }""",
        codes,
    )


def test_addcode_rejects_non_leaf_and_unknown_codes(page):
    """葉碼防呆在手機版也必須真的擋住（R-4，臨床安全）。

    M4 變異（isAddable 一律回 true）原本只有 wide 版面的 E2E 抓得到，1b／1c 都沒有
    對應測試——三套版面共用同一條防線，卻只有一套被真的練到。
    """
    reset(page)
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    try:
        # 陽性對照：注入的葉碼必須真的進得了清單 → 證明事件委派確實抵達 addCode
        inject_probe_chips(page, ["E11.9"])
        page.click('#probe-chips .chip[data-code="E11.9"]')
        expect(page.locator('#cart li[data-code="E11.9"]')).to_have_count(1)
        expect(page.locator("#cart-inline")).to_contain_text("E11.9")

        probes = ["E11", "A00", "K11", "ZZZ99"]
        inject_probe_chips(page, probes)
        for code in probes:
            page.click(f'#probe-chips .chip[data-code="{code}"]')
            expect(page.locator(f'#cart li[data-code="{code}"]')).to_have_count(0)
        assert page.locator("#cart li").count() == 1, \
            f"類目碼／不存在代碼被加進清單（葉碼防呆失效）：{page.locator('#cart-inline').inner_text()}"
    finally:
        page.evaluate("() => document.getElementById('probe-chips')?.remove()")
        reset(page)
    assert not errors, f"addCode() 對非葉碼/不存在代碼拋出未捕捉例外：{errors}"


def test_preferences_persist_across_reload_on_mobile(browser_ctx, page_url):
    """手機版的偏好（格式／主題／最愛）必須跨重整存活，就診清單則不得跨診次殘留。

    盲點 7：wide 有 test_favourite_toggle_and_persist／test_layout_preference_persists，
    dock 有 test_switch_layout_from_settings，1b 兩類都缺席。持久化是共用 store，
    但手機是唯一沒有常用列的版面，寫入路徑（cart sheet 裡的 ★）與桌機不同。
    """
    pg = browser_ctx.new_page()
    try:
        pg.goto(page_url)
        pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
        pg.evaluate("() => { try { localStorage.clear(); } catch (e) {} }")

        pg.locator("#panels .chip--row").first.click()
        code = pg.evaluate("() => window.ICDApp.store.getState().cart[0].code")
        pg.click("#cart-toggle")
        expect(pg.locator("#cart-sheet")).to_be_visible()
        fav = pg.locator(f'#cart li[data-code="{code}"] .cart-fav')
        expect(fav).to_have_attribute("aria-pressed", "false")
        fav.click()
        expect(fav).to_have_attribute("aria-pressed", "true")

        pg.click("#settings-toggle")
        pg.click('#seg-format button[data-format="comma"]')
        pg.click("#theme-toggle")                     # 深色模式鈕在設定 sheet 裡，先別關
        pg.keyboard.press("Escape")
        expect(pg.locator("#settings-popover")).to_be_hidden()
        expect(pg.locator("html")).to_have_attribute("data-theme", "dark")
        # 真的寫進 localStorage 了嗎（記憶體降級也會讓上面的斷言通過）
        assert pg.evaluate("() => Object.keys(localStorage).length") > 0, "偏好完全沒寫進 localStorage"

        pg.reload()
        pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
        assert pg.evaluate("() => document.body.dataset.layout") == "mobile"
        expect(pg.locator("html")).to_have_attribute("data-theme", "dark")
        expect(pg.locator("#his-format-label")).to_have_text("逗號分隔")
        assert pg.evaluate("() => window.ICDApp.store.getState().format") == "comma"
        expect(pg.locator("#cart li")).to_have_count(0)              # 清單不跨診次
        expect(pg.locator("#cart-inline")).to_have_text("尚未選碼")
        assert pg.evaluate("() => window.ICDApp.store.getState().favs") == [code], "最愛沒有存活"
        assert code in pg.evaluate("() => window.ICDApp.store.getState().recent"), "最近使用沒有存活"

        # 重新加入同一個碼，★ 必須已經是亮的（持久化真的回到了 UI，不只回到 store）
        pg.locator(f'#panels .chip[data-code="{code}"]').first.click()
        pg.click("#cart-toggle")
        expect(pg.locator(f'#cart li[data-code="{code}"] .cart-fav')).to_have_attribute("aria-pressed", "true")
    finally:
        pg.evaluate("() => { try { localStorage.clear(); } catch (e) {} }")
        pg.close()


def test_no_duplicate_ids(page):
    """契約：同一時刻只掛一套版面，所以 #search／#cart／#copy-all 等 id 必須全域唯一。

    盲點 7：wide 與 dock 都有這條，1b 缺席。歷史上真的發生過兩套版面同時掛載、
    產生 10 組重複 id 的 Critical，而重複 id 只會讓 querySelector 悄悄選到殘留的那套。
    """
    def snapshot(tag):
        result = page.evaluate("""() => {
            const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
            return {
                total: ids.length, uniq: new Set(ids).size,
                dups: ids.filter((v, i) => ids.indexOf(v) !== i),
                roots: ['layout-wide', 'layout-dock', 'layout-mobile']
                    .filter((id) => document.getElementById(id)),
            };
        }""")
        assert result["total"] == result["uniq"], f"{tag}：重複 id {result['dups']}"
        assert result["roots"] == ["layout-mobile"], f"{tag}：掛載中的版面是 {result['roots']}"
        assert result["total"] > 10, f"{tag}：只掃到 {result['total']} 個 id，選擇器可能失效"

    reset(page)
    snapshot("初始")

    page.locator("#panels .chip--row").first.click()
    page.click("#cart-toggle")
    page.click("#settings-toggle")
    page.wait_for_timeout(150)
    snapshot("清單抽屜＋設定同時開啟")
    page.keyboard.press("Escape")

    search(page, "L03")
    snapshot("搜尋結果")
    reset(page)

    # 換版面／換回來不得留下上一套的殘骸（歷史 Critical：兩套同時掛載）
    page.set_viewport_size({"width": 1200, "height": 844})
    page.wait_for_selector('body[data-layout="wide"]', timeout=3000)
    page.set_viewport_size(dict(MOBILE))
    page.wait_for_selector('body[data-layout="mobile"]', timeout=3000)
    page.wait_for_timeout(200)
    snapshot("寬→窄來回切換後")
    reset(page)


# ══════════════════════════════════════════════════════════════════════════
# 窗格高度手動調整（與 1a／1c 同一套機制；手機的重點是**手指**拖得動）
# ══════════════════════════════════════════════════════════════════════════
def pane_h(pg, selector):
    return pg.evaluate("(sel) => document.querySelector(sel).getBoundingClientRect().height", selector)


def sep_for(pg, pane_id):
    return pg.locator(f'.pane-resizer[aria-controls="{pane_id}"]')


def sep_center(pg, pane_id):
    b = box(sep_for(pg, pane_id))
    return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2


def touch_drag(pg, pane_id, dy):
    """真觸控拖曳：CDP 的 Input.dispatchTouchEvent 產生 pointerType='touch' 的事件。

    Playwright 的 touchscreen 只有 tap，拖曳只能走 CDP。這條是手機版存在的理由——
    滑鼠拖得動不代表手指拖得動（少了 touch-action:none，手指一動就被判定成捲動頁面，
    pointermove 直接被瀏覽器收走）。

    ※ 用完這個函式的頁面**不要再用 Playwright 的 .tap()**：Chromium 在 CDP 觸控序列
      之後不再把 Playwright 合成的 tap 轉成 click（實測過 id=0／touchCancel／保留
      session 都一樣）。所以呼叫端一律另開一頁，或改用 .click()。
    """
    x, y = sep_center(pg, pane_id)
    cdp = pg.context.new_cdp_session(pg)
    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y, "id": 1}]})
    for i in range(1, 7):
        cdp.send("Input.dispatchTouchEvent",
                 {"type": "touchMove", "touchPoints": [{"x": x, "y": y + dy * i / 6, "id": 1}]})
    cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    cdp.detach()
    pg.wait_for_timeout(200)


def mouse_drag(pg, pane_id, dy):
    x, y = sep_center(pg, pane_id)
    pg.mouse.move(x, y)
    pg.mouse.down()
    pg.mouse.move(x, y + dy, steps=6)
    pg.mouse.up()
    pg.wait_for_timeout(150)


def open_sheet(pg):
    """加一個碼並展開清單抽屜：兩條分隔條都出現。一律用 click（見 touch_drag 的註記）。"""
    pg.locator('#panels .chip[data-code]:not(.cat)').first.click()
    pg.wait_for_timeout(250)
    if pg.locator("#cart-sheet").is_hidden():
        pg.click("#cart-toggle")
        pg.wait_for_timeout(250)


@pytest.fixture
def touch_page(browser_ctx, page_url):
    """觸控拖曳專用的拋棄式頁面：CDP 觸控會讓同一頁之後的 .tap() 失效，不能污染共用頁。"""
    pg = browser_ctx.new_page()
    pg.goto(page_url)
    pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
    pg.evaluate("() => window.ICDApp.store.resetPaneSizes()")
    yield pg
    pg.evaluate("() => window.ICDApp.store.resetPaneSizes()")
    pg.close()


def test_pane_resizers_present_with_aria(page):
    """兩條分隔條：相關碼區與清單抽屜。部位 pill 列（單行橫捲）與 header 刻意不做。"""
    reset(page)
    assert page.locator(".pane-resizer").count() == 2
    for pane_id in ("related", "cart-sheet"):
        expect(sep_for(page, pane_id)).to_be_hidden()

    open_sheet(page)
    for pane_id in ("related", "cart-sheet"):
        sep = sep_for(page, pane_id)
        expect(sep).to_be_visible()
        assert sep.get_attribute("role") == "separator"
        assert sep.get_attribute("aria-orientation") == "horizontal"
        assert sep.get_attribute("tabindex") == "0"
        now = int(sep.get_attribute("aria-valuenow"))
        assert int(sep.get_attribute("aria-valuemin")) <= now <= int(sep.get_attribute("aria-valuemax"))
        # 觸控拖曳的前提：沒有 touch-action:none，手指一動就變成捲動頁面
        assert page.evaluate(
            "(id) => getComputedStyle(document.querySelector('.pane-resizer[aria-controls=\"' + id + '\"]'))"
            ".touchAction", pane_id) == "none"
        assert box(sep)["height"] >= 14, "手機的分隔條要夠厚才抓得到"
    reset(page)


def test_pane_touch_drag_resizes_sheet(touch_page):
    """手指拖清單抽屜：變高、寫進 store，底部固定列與捲動區都不能被擠爆。"""
    pg = touch_page
    open_sheet(pg)
    before = pane_h(pg, "#cart-sheet")
    touch_drag(pg, "cart-sheet", -80)
    after = pane_h(pg, "#cart-sheet")
    assert after > before + 40, f"手指拖不動抽屜：{before} → {after}"
    assert pg.evaluate("() => window.ICDApp.store.paneSizeFor('mobile', 'sheet')") == round(after)
    assert_no_h_scroll(pg, "拖高抽屜後")

    bar = box(pg.locator("#cart-bar"))
    assert bar["y"] + bar["height"] <= MOBILE["height"] + 0.5, "底部固定列被抽屜推出視窗"
    expect(pg.locator("#copy-all")).to_be_visible()
    assert pane_h(pg, ".m-scroll") >= 100, "主訴捲動區被壓到看不見"

    # 相關碼區同樣拖得動（手指）
    rel_before = pane_h(pg, "#related")
    touch_drag(pg, "related", -40)
    assert pane_h(pg, "#related") > rel_before + 20


def test_pane_mouse_drag_and_keyboard(page):
    """外接鍵盤／滑鼠（手機也可能接）：同一條分隔條三種操作都要成立。"""
    reset(page)
    open_sheet(page)
    before = pane_h(page, "#cart-sheet")
    mouse_drag(page, "cart-sheet", -60)
    assert pane_h(page, "#cart-sheet") > before + 30
    assert page.evaluate("() => window.ICDApp.store.paneSizeFor('mobile', 'sheet')") \
        == round(pane_h(page, "#cart-sheet"))

    sep = sep_for(page, "cart-sheet")
    sep.focus()
    h0 = pane_h(page, "#cart-sheet")
    sep.press("ArrowUp")
    page.wait_for_timeout(80)
    assert pane_h(page, "#cart-sheet") == h0 + 16, "抽屜在分隔條下方，↑ 應該變高"
    sep.press("ArrowDown")
    page.wait_for_timeout(80)
    assert pane_h(page, "#cart-sheet") == h0
    assert_no_h_scroll(page, "鍵盤調整後")
    reset(page)


def test_pane_cannot_be_dragged_away(page):
    """拖到極限：抽屜不得消失、主訴捲動區不得被吃光、底部固定列不得被推出視窗。"""
    reset(page)
    open_sheet(page)
    mouse_drag(page, "cart-sheet", 900)
    assert pane_h(page, "#cart-sheet") >= 120, "抽屜被拖沒了"
    expect(page.locator("#cart li").first).to_be_visible()

    mouse_drag(page, "cart-sheet", -2000)
    assert pane_h(page, ".m-scroll") >= 100, "抽屜吃光了主訴面板的空間"
    bar = box(page.locator("#cart-bar"))
    assert bar["y"] + bar["height"] <= MOBILE["height"] + 0.5, "底部固定列被推出視窗"
    expect(page.locator("#copy-all")).to_be_visible()
    assert_no_h_scroll(page, "極限拖曳後")
    reset(page)


def test_pane_height_survives_reload(browser_ctx, page_url):
    pg = browser_ctx.new_page()
    pg.goto(page_url)
    pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
    pg.evaluate("() => window.ICDApp.store.resetPaneSizes()")
    open_sheet(pg)
    mouse_drag(pg, "cart-sheet", -70)
    saved = round(pane_h(pg, "#cart-sheet"))

    pg.reload()
    pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
    assert pg.evaluate("() => window.ICDApp.store.paneSizeFor('mobile', 'sheet')") == saved
    assert pg.evaluate("() => JSON.stringify(window.ICDApp.store.getState().paneSizes)") \
        == '{"mobile":{"sheet":%d}}' % saved, "1b 調的高度不得寫到別的版面"
    open_sheet(pg)      # 清單不跨診次保留（刻意），抽屜要重新叫出來才量得到
    assert round(pane_h(pg, "#cart-sheet")) == saved, "重新整理後抽屜沒有回到調好的高度"
    pg.evaluate("() => window.ICDApp.store.resetPaneSizes()")
    pg.close()


def test_pane_reset_from_settings(page):
    reset(page)
    page.click("#settings-toggle")
    page.wait_for_selector("#settings-popover:not([hidden])")
    expect(page.locator("#reset-panes")).to_be_disabled()
    page.click("#settings-toggle")

    open_sheet(page)
    default_h = pane_h(page, "#cart-sheet")
    mouse_drag(page, "cart-sheet", -70)
    assert pane_h(page, "#cart-sheet") > default_h + 40

    page.click("#settings-toggle")
    page.wait_for_selector("#settings-popover:not([hidden])")
    expect(page.locator("#reset-panes")).to_be_enabled()
    page.click("#reset-panes")
    page.wait_for_timeout(200)
    assert page.evaluate("() => window.ICDApp.store.paneSizeFor('mobile', 'sheet')") is None
    assert abs(pane_h(page, "#cart-sheet") - default_h) < 1, "回復預設後高度沒回到原樣"
    assert page.evaluate("() => document.getElementById('cart-sheet').style.height") == ""
    expect(page.locator("#reset-panes")).to_be_disabled()
    page.click("#settings-toggle")
    reset(page)
