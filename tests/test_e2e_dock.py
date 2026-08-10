"""E2E（1c 側掛窄欄，176×900）：對 dist/icd10.html 實跑。先由 conftest 跑 build/build.py。

DOM 契約見 .review/design-ref/impl-plan.md §4.2／§4.4。本檔只涵蓋 dock 版面；
1a 桌機在 tests/e2e_test.py、1b 手機在該階段自己的檔案。

1c 的兩條硬性性質（測試存在的理由）：
  * 176px 下**不得水平捲動**、文字不得溢出——貼在 HIS 旁邊的窄欄，一捲動就沒法用。
  * 置頂（Document Picture-in-Picture）**不支援時要顯示提示、不得靜默失敗**。
"""
import http.server
import threading
from functools import partial
from pathlib import Path

import pytest
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 18497                       # 與 e2e_test.py（18493）錯開，避免同時起服務時撞埠
DOCK = {"width": 176, "height": 900}
WIDE = {"width": 1440, "height": 900}
PIP_PROBE = ("() => typeof window.documentPictureInPicture === 'object'"
             " && window.documentPictureInPicture !== null"
             " && typeof window.documentPictureInPicture.requestWindow === 'function'")


@pytest.fixture(scope="module")
def page_url():
    handler = partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT / "dist"))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{PORT}/icd10.html"
    srv.shutdown()


@pytest.fixture(scope="module")
def browser_ctx(page_url):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport=dict(DOCK), permissions=["clipboard-read", "clipboard-write"])
        yield ctx
        browser.close()


@pytest.fixture(scope="module")
def dock(browser_ctx, page_url):
    """主測試頁：176 寬、已切到側掛版面、全庫索引已就緒。

    版面偏好用 store 設定而不是點 UI：切版面本身另有一條測試（test_switch_layout_from_settings）
    走完整的使用者路徑，其餘測試不必每次重跑一遍。
    """
    pg = browser_ctx.new_page()
    pg.goto(page_url)
    pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
    pg.evaluate("() => window.ICDApp.store.setLayout('dock')")
    pg.wait_for_selector('body[data-layout="dock"]')
    pg.evaluate("() => window.ICDApp.data.ensureDb()")
    pg.wait_for_selector('body[data-db="ready"]', timeout=30000)
    yield pg
    pg.close()


@pytest.fixture
def pg(dock):
    reset(dock)
    return dock


# ---- 共用操作 ----
def reset(page):
    page.evaluate("""() => {
        const s = window.ICDApp.store;
        s.clearCart();
        s.setMode('outpatient');
        s.setQuery('');
        s.setSettingsOpen(false);
        s.setCartOpen(true);
        s.setTheme('light');
        s.setState({ favs: [], recent: [], expanded: {}, copied: false });
    }""")
    page.fill("#search", "")


def open_settings(page):
    if page.locator("#settings-popover").is_hidden():
        page.click("#settings-toggle")
    page.wait_for_selector("#settings-popover:not([hidden])")


def set_mode(page, button_id):
    open_settings(page)
    page.click("#" + button_id)
    expect(page.locator("#settings-popover")).to_be_hidden()


def search(page, text):
    page.fill("#search", text)
    page.wait_for_timeout(300)          # 150ms debounce ＋ 重繪


def doc_metrics(page):
    return page.evaluate("() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]")


def assert_no_hscroll(page, label):
    sw, cw = doc_metrics(page)
    assert sw <= cw, f"{label}：水平溢出 scrollWidth={sw} > clientWidth={cw}"


def overflowing_elements(page):
    """回傳「真的溢出」的元素。

    判準刻意分成兩種，不能只用 `scrollWidth > clientWidth`——那條在 1c 會整片假警報：
    設計要求長中文用 `overflow:hidden;text-overflow:ellipsis` 截斷，被截斷的元素
    scrollWidth 本來就大於 clientWidth，那是**預期行為**不是破版。真正的破版是：
      (a) 元素的框跑出視窗；或
      (b) 元素 overflow-x 是 visible（沒有裁切），內容卻仍然比自己寬。
    """
    return page.evaluate("""() => {
        const bad = [];
        const vw = document.documentElement.clientWidth;
        for (const el of document.querySelectorAll('#layout-dock, #layout-dock *')) {
            const name = el.tagName + '#' + el.id + '.' + el.className;
            const text = (el.textContent || '').slice(0, 20);
            const r = el.getBoundingClientRect();
            if (r.width > 0 && (r.left < -0.5 || r.right > vw + 0.5)) {
                bad.push('跑出視窗 ' + name + ' → ' + text);
                continue;
            }
            if (getComputedStyle(el).overflowX === 'visible'
                && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) {
                bad.push('內容外溢 ' + name + ' → ' + text);
            }
        }
        return bad;
    }""")


def clipboard(page):
    """Windows 的剪貼簿會把 \\n 正規化成 \\r\\n（OS／瀏覽器行為），比對前先還原。"""
    return page.evaluate("() => navigator.clipboard.readText()").replace("\r\n", "\n")


def first_panel_chip(page):
    return page.locator('#dock-panels .chip[data-code]:not(.cat)').first


# ---- 版面切換 ----
def test_switch_layout_from_settings(browser_ctx, page_url):
    """從 1a 的設定 popover 切到 1c，再縮到 176 寬——完整的使用者路徑。"""
    page = browser_ctx.new_page()
    page.set_viewport_size(dict(WIDE))
    page.goto(page_url)
    page.wait_for_selector('body[data-ready="1"]')
    page.evaluate("() => window.ICDApp.store.setLayout('wide')")
    page.wait_for_selector('body[data-layout="wide"]')

    page.click("#settings-toggle")
    page.wait_for_selector("#settings-popover:not([hidden])")
    page.click('#seg-layout [data-layout-opt="dock"]')
    page.wait_for_selector('body[data-layout="dock"]')
    expect(page.locator("#layout-dock")).to_have_count(1)
    expect(page.locator("#layout-wide")).to_have_count(0)

    page.set_viewport_size(dict(DOCK))
    page.wait_for_timeout(300)
    assert_no_hscroll(page, "切到 1c 後 176px")
    # 側掛偏好要跨診次保留（state.js 的 PERSISTED_KEYS）
    page.reload()
    page.wait_for_selector('body[data-layout="dock"]')
    page.close()


# ---- 部位兩欄 ----
def test_region_pills_two_columns_no_hscroll(pg):
    pills = pg.locator("#region-pills .region-btn")
    assert pills.count() >= 4, "門診至少要有 4 個部位"
    boxes = [pills.nth(i).bounding_box() for i in range(pills.count())]

    columns = sorted({round(b["x"]) for b in boxes})
    assert len(columns) == 2, f"部位必須排成兩欄，實得 {len(columns)} 欄：{columns}"
    rows = sorted({round(b["y"]) for b in boxes})
    assert len(rows) >= 2, "兩欄 grid 應該有多列"

    for box in boxes:
        assert box["x"] >= 0 and box["x"] + box["width"] <= DOCK["width"] + 0.5, f"部位鈕超出視窗：{box}"
        assert box["height"] >= 20, f"部位鈕高度不足 20px：{box}"

    sw, cw = pg.eval_on_selector("#region-pills", "el => [el.scrollWidth, el.clientWidth]")
    assert sw <= cw, f"部位區橫向捲動：{sw} > {cw}"
    assert_no_hscroll(pg, "部位兩欄")

    # 兩欄是可點的 tab，不是裝飾
    pills.nth(2).click()
    expect(pills.nth(2)).to_have_attribute("aria-selected", "true")
    expect(pills.nth(0)).to_have_attribute("aria-selected", "false")
    assert pg.locator("#dock-panels .dock-panel").count() >= 1


# ---- 面板展開／收合 ----
def test_panel_expand_and_collapse(pg):
    toggle = pg.locator("#dock-panels .panel-toggle").first
    panel = pg.locator("#dock-panels .dock-panel").first
    expect(toggle).to_have_attribute("aria-expanded", "false")
    assert "+ 疾病" in toggle.inner_text()

    before = panel.locator(".chip[data-code]").count()
    toggle.click()
    expect(toggle).to_have_attribute("aria-expanded", "true")
    after = panel.locator(".chip[data-code]").count()
    assert after > before, f"展開後代碼列沒有變多：{before} → {after}"
    assert "- 疾病" in toggle.inner_text()
    assert_no_hscroll(pg, "面板展開")

    toggle.click()
    expect(toggle).to_have_attribute("aria-expanded", "false")
    assert panel.locator(".chip[data-code]").count() == before


# ---- 加入代碼 ＋ 清單摘要 ----
def test_add_code_and_cart_summary(pg):
    chip = first_panel_chip(pg)
    code = chip.get_attribute("data-code")
    chip.click()

    expect(pg.locator("#cart li")).to_have_count(1)
    expect(pg.locator("#cart li").first).to_have_attribute("data-code", code)
    expect(pg.locator("#cart-count")).to_have_text("1")
    expect(pg.locator(".dock-cart-codes")).to_have_text(code)
    expect(pg.locator("#cart li .cart-badge").first).to_have_attribute("data-primary", "true")

    # 第二行的中文一定要看得到（不是被切掉、也不是空字串）
    zh = pg.locator("#cart li .cart-zh").first
    expect(zh).to_be_visible()
    assert zh.inner_text().strip(), "清單列沒有中文"
    zh_box = zh.bounding_box()
    code_box = pg.locator("#cart li b.cart-code").first.bounding_box()
    assert zh_box["y"] > code_box["y"], "中文必須排在代碼的下一行"
    assert zh_box["x"] + zh_box["width"] <= DOCK["width"] + 0.5

    # 摘要列收合／展開
    toggle = pg.locator("#cart-toggle")
    expect(toggle).to_have_attribute("aria-expanded", "true")
    toggle.click()
    expect(pg.locator("#cart-inline")).to_be_hidden()
    expect(toggle).to_have_attribute("aria-expanded", "false")
    expect(pg.locator(".dock-cart-codes")).to_have_text(code)      # 收合後仍看得到代碼
    toggle.click()
    expect(pg.locator("#cart-inline")).to_be_visible()
    expect(zh).to_be_visible()

    # 移除
    pg.locator("#cart li .cart-remove").first.click()
    expect(pg.locator("#cart li")).to_have_count(0)
    expect(pg.locator(".dock-cart-codes")).to_have_text("尚未選碼")
    assert_no_hscroll(pg, "清單操作後")


def test_cart_primary_and_clear(pg):
    chips = pg.locator('#dock-panels .chip[data-code]:not(.cat)')
    first = chips.nth(0).get_attribute("data-code")
    second = chips.nth(1).get_attribute("data-code")
    chips.nth(0).click()
    chips.nth(1).click()
    expect(pg.locator("#cart li")).to_have_count(2)

    pg.locator(f'#cart li[data-code="{second}"] .cart-primary').click()
    expect(pg.locator("#cart li").first).to_have_attribute("data-code", second)
    expect(pg.locator("#cart li").first.locator(".cart-badge")).to_have_attribute("data-primary", "true")
    expect(pg.locator(".dock-cart-codes")).to_have_text(f"{second}、{first}")

    pg.click("#clear-cart")
    expect(pg.locator("#cart li")).to_have_count(0)


# ---- 複製 ----
def test_copy_all_matches_selected_format(pg):
    chips = pg.locator('#dock-panels .chip[data-code]:not(.cat)')
    codes = [chips.nth(i).get_attribute("data-code") for i in range(2)]
    chips.nth(0).click()
    chips.nth(1).click()

    pg.click("#copy-all")
    expect(pg.locator("#copy-all")).to_contain_text("已複製")
    assert clipboard(pg) == "\n".join(codes)

    open_settings(pg)
    pg.click('#seg-format [data-format="comma"]')
    pg.click("#copy-all")
    assert clipboard(pg) == ",".join(codes)

    open_settings(pg)
    pg.click('#seg-format [data-format="names"]')
    pg.click("#copy-all")
    named = clipboard(pg)
    assert named.startswith(codes[0] + "\t") and (codes[1] + "\t") in named

    open_settings(pg)
    pg.click('#seg-format [data-format="lines"]')
    expect(pg.locator('#seg-format [data-format="lines"]')).to_have_attribute("aria-pressed", "true")
    pg.click("#settings-toggle")


# ---- 相關碼 ----
def test_related_appears_and_hides(pg):
    expect(pg.locator("#dock-related")).to_be_hidden()
    chip = first_panel_chip(pg)
    code = chip.get_attribute("data-code")
    chip.click()

    expect(pg.locator("#dock-related")).to_be_visible()
    assert pg.locator("#related .related-group").count() >= 1
    assert pg.locator("#related .chip[data-code]").count() >= 1
    assert code in pg.locator("#related .group-label").first.inner_text()
    # 相關碼是「建議」不是自動加入
    expect(pg.locator("#cart li")).to_have_count(1)

    suggestion = pg.locator("#related .chip[data-code]").first
    suggested = suggestion.get_attribute("data-code")
    suggestion.click()
    expect(pg.locator(f'#cart li[data-code="{suggested}"]')).to_have_count(1)
    assert_no_hscroll(pg, "相關碼")

    # 切模式必須清空相關碼（C5）
    set_mode(pg, "mode-er")
    expect(pg.locator("#dock-related")).to_be_hidden()


def test_red_flags_do_not_leak_into_outpatient(pg):
    """急診的紅旗碼只能出現在急診模式；門診面板一顆都不能有（C5，臨床安全）。"""
    set_mode(pg, "mode-er")
    assert pg.locator("#dock-panels .chip--warn").count() > 0, "急診應該要有紅旗碼"
    set_mode(pg, "mode-op")
    assert pg.locator("#dock-panels .chip--warn").count() == 0, "門診出現了急診紅旗碼"


# ---- 搜尋 ----
def test_search_rows_and_category_code(pg):
    search(pg, "蜂窩")
    expect(pg.locator("#results-card")).to_be_visible()
    rows = pg.locator("#search-results .chip")
    assert rows.count() > 0
    assert rows.count() <= 24
    for i in range(rows.count()):
        assert "chip--dock" in (rows.nth(i).get_attribute("class") or ""), "搜尋結果沒有套用 1c 的列狀樣式"
    assert_no_hscroll(pg, "搜尋結果")
    assert not overflowing_elements(pg), overflowing_elements(pg)

    cats = pg.locator("#search-results .chip.cat")
    if cats.count():
        cats.first.click(force=True)          # 類目碼點得下去，但不得加入清單
        expect(pg.locator("#cart li")).to_have_count(0)

    search(pg, "")
    expect(pg.locator("#results-card")).to_be_hidden()


# ---- 設定 popover ----
def test_settings_popover_fits_and_switches_mode(pg):
    open_settings(pg)
    pop = pg.locator("#settings-popover").bounding_box()
    assert pop["x"] >= 6 - 0.5 and pop["x"] + pop["width"] <= DOCK["width"] - 6 + 0.5, f"popover 超出邊界：{pop}"
    # 設計原值 46px 會蓋住「設定」鈕本身（見 dock.css 的註解），實作下移到 64px
    toggle_box = pg.locator("#settings-toggle").bounding_box()
    assert pop["y"] >= toggle_box["y"] + toggle_box["height"] - 0.5, \
        f"popover 蓋住了開它的那顆鈕：popover={pop} toggle={toggle_box}"

    segs = pg.locator("#settings-popover .seg-btn")
    assert segs.count() == 8            # 版面 2 ＋ 模式 3 ＋ 格式 3
    for i in range(segs.count()):
        box = segs.nth(i).bounding_box()
        assert box["x"] >= 0 and box["x"] + box["width"] <= DOCK["width"] + 0.5, f"segmented 溢出：{box}"
        assert box["height"] >= 22 - 0.5, f"小號 segmented 應該至少 22px：{box}"
    assert_no_hscroll(pg, "設定開啟")
    assert not overflowing_elements(pg), overflowing_elements(pg)

    pg.click("#mode-er")
    expect(pg.locator("#settings-popover")).to_be_hidden()
    expect(pg.locator("#mode-chip")).to_have_text("急診")
    assert pg.get_attribute("body", "data-mode") == "emergency"


# ---- 置頂（Document PiP） ----
def test_pin_unsupported_shows_note(browser_ctx, page_url):
    """不支援 Document PiP 時要顯示提示、不得靜默失敗、也不得假裝已置頂。"""
    page = browser_ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.add_init_script(
        "Object.defineProperty(window, 'documentPictureInPicture',"
        " { value: undefined, configurable: true });"
    )
    page.goto(page_url)
    page.wait_for_selector('body[data-ready="1"]')
    page.evaluate("() => window.ICDApp.store.setLayout('dock')")
    page.wait_for_selector('body[data-layout="dock"]')

    assert page.evaluate(PIP_PROBE) is False
    expect(page.locator("#pin-note")).to_be_hidden()
    page.click("#pin-toggle")

    expect(page.locator("#pin-note")).to_be_visible()
    assert "不支援" in page.locator("#pin-note").inner_text()
    expect(page.locator("#pin-toggle")).to_have_attribute("aria-pressed", "false")
    assert page.evaluate("() => window.ICDApp.store.getState().pinned") is False
    assert errors == [], f"置頂降級不得丟例外：{errors}"
    assert_no_hscroll(page, "置頂提示顯示後")
    page.close()


def test_pin_opens_pip_with_styles(browser_ctx, page_url):
    """支援時：側欄整個搬進小視窗、樣式跟著過去、關閉後搬回來。"""
    page = browser_ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(page_url)
    page.wait_for_selector('body[data-ready="1"]')
    page.evaluate("() => window.ICDApp.store.setLayout('dock')")
    page.wait_for_selector('body[data-layout="dock"]')
    if not page.evaluate(PIP_PROBE):
        page.close()
        pytest.skip("此瀏覽器沒有 Document Picture-in-Picture，降級路徑另有測試")

    before = set(browser_ctx.pages)
    page.click("#pin-toggle")
    page.wait_for_timeout(1500)
    fresh = [p for p in browser_ctx.pages if p not in before]
    assert len(fresh) == 1, f"沒有開出置頂小視窗：{[p.url for p in browser_ctx.pages]}"
    pip = fresh[0]

    assert page.evaluate("() => !!document.getElementById('layout-dock')") is False, "側欄應該已搬進小視窗"
    assert "置頂小視窗" in page.evaluate("() => document.getElementById('app').textContent")
    assert pip.evaluate("() => !!document.getElementById('layout-dock')") is True
    # CSS 全部限定在 body[data-layout="dock"]，小視窗沒補上就會變裸 HTML
    assert pip.evaluate("() => document.body.dataset.layout") == "dock"
    assert pip.evaluate("() => document.querySelectorAll('style').length") >= 1
    grid = pip.evaluate("() => getComputedStyle(document.getElementById('region-pills')).gridTemplateColumns")
    assert len(grid.split()) == 2, f"小視窗裡沒吃到樣式（部位不是兩欄）：{grid}"
    assert pip.evaluate(
        "() => getComputedStyle(document.getElementById('copy-all')).backgroundColor"
    ) == "rgb(181, 217, 253)"

    # 小視窗裡點得動（interactions.js 的委派在另一個 document 失效，1c 有自己的備援）
    pip.locator('#dock-panels .chip[data-code]:not(.cat)').first.click()
    pip.wait_for_timeout(200)
    assert pip.locator("#cart li").count() == 1
    assert page.evaluate("() => window.ICDApp.store.getState().cart.length") == 1

    pip.close()
    page.wait_for_timeout(600)
    assert page.evaluate("() => !!document.getElementById('layout-dock')") is True, "關閉小視窗後應搬回主視窗"
    assert page.evaluate("() => window.ICDApp.store.getState().pinned") is False
    expect(page.locator("#pin-toggle")).to_have_attribute("aria-pressed", "false")
    assert errors == [], errors
    page.close()


# ---- 版面健檢 ----
@pytest.mark.parametrize("theme", ["light", "dark"])
def test_no_horizontal_overflow(pg, theme):
    pg.evaluate("(t) => window.ICDApp.store.setTheme(t)", theme)
    chips = pg.locator('#dock-panels .chip[data-code]:not(.cat)')
    chips.nth(0).click()
    chips.nth(1).click()
    search(pg, "急性")
    for mode in ("mode-op", "mode-er", "mode-surg"):
        set_mode(pg, mode)
        assert_no_hscroll(pg, f"{theme}／{mode}")
        bad = overflowing_elements(pg)
        assert not bad, f"{theme}／{mode} 文字溢出：{bad}"
    pg.evaluate("() => window.ICDApp.store.setTheme('light')")


def test_no_duplicate_ids(pg):
    dupes = pg.evaluate("""() => {
        const seen = {}, dupes = [];
        for (const el of document.querySelectorAll('[id]')) {
            if (seen[el.id]) dupes.push(el.id); else seen[el.id] = 1;
        }
        return dupes;
    }""")
    assert dupes == [], f"重複 id：{dupes}"
