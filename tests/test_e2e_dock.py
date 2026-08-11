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

    # 類目碼：一定要先「找得到」再斷言「加不進去」。
    # 原本寫成 `if cats.count(): …`，一旦 .cat 標記機制整個消失（正是要防的那個 bug）
    # count() 就是 0、斷言整段被跳過、測試照樣綠燈——tautological guard，比沒測更危險
    # （R2 審查 .review/r2-pipeline.md (b) 第 3 條）。改成固定查詢 + 硬斷言。
    search(pg, "E11")
    pg.wait_for_selector("#search-results .chip.cat", timeout=3000)
    cats = pg.locator("#search-results .chip.cat")
    assert cats.count() > 0, "查詢 E11 應該至少出現一個類目碼（E11 本身），類目碼標記可能失效"
    cat = cats.first
    expect(cat).to_have_attribute("data-leaf", "0")
    expect(cat).to_have_attribute("aria-disabled", "true")
    cat.click(force=True)                     # 類目碼點得下去，但不得加入清單
    pg.wait_for_timeout(120)
    expect(pg.locator("#cart li")).to_have_count(0)
    expect(pg.locator(".dock-cart-codes")).to_have_text("尚未選碼")

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


# ══════════════════════════════════════════════════════════════════════════
# R2 獨立審查（.review/r2-code.md）的回歸守門：置頂小視窗的生命週期
# ══════════════════════════════════════════════════════════════════════════
def open_pinned(browser_ctx, page_url):
    """開一頁、切到側掛版面、按下「置頂」，回傳 (主視窗, 小視窗)；不支援就 skip。

    視窗刻意放到 1440×900（審查報告的重現環境）：本檔預設的 176px 下，偏好切成
    「工作台」會因為未達 LAYOUT_MIN_WIDTH 而降級成手機版面，測的就不是同一件事。
    """
    page = browser_ctx.new_page()
    page.set_viewport_size(dict(WIDE))
    page.goto(page_url)
    page.wait_for_selector('body[data-ready="1"]', timeout=8000)
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
    return page, fresh[0]


def pip_click_settings(pip, selector):
    """在小視窗裡走完整動線：開設定 popover → 點裡面的鈕。

    小視窗是另一個 document，沒有自己的 window.ICDApp（指令碼只在主視窗），所以狀態
    操作一律用真實點擊走 render-dock.js 的 pipDelegate 代打，不能 pip.evaluate。
    """
    pip.click("#settings-toggle")
    pip.wait_for_selector("#settings-popover:not([hidden])")
    pip.click(selector)
    pip.wait_for_timeout(300)


def pip_set_mode(pip, button_id):
    pip_click_settings(pip, "#" + button_id)


def duplicate_ids(page):
    return page.evaluate("""() => {
        const seen = {}, dup = [];
        for (const el of document.querySelectorAll('[id]')) {
            seen[el.id] = (seen[el.id] || 0) + 1;
            if (seen[el.id] === 2) dup.push(el.id);
        }
        return dup;
    }""")


def test_layout_switch_while_pinned_tears_down_pip(browser_ctx, page_url):
    """R2 C1（臨床安全）：換版面時舊 controller 一定要收到卸載通知並收回小視窗。

    原本 app.js 的 subscriber 只要 mount() 成功就直接 return，舊的 dock controller
    永遠收不到 update(['layout'])，留在小視窗裡的側欄變成「活的殭屍」：主視窗已經切回
    門診，小視窗仍列著 14 個急診紅旗，而且**點下去真的會把 A41.9 敗血症加進清單**——
    整條路徑繞過「急診紅旗不得洩漏到門診」這個安全不變量。
    """
    page, pip = open_pinned(browser_ctx, page_url)
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    # 小視窗裡切到急診：先確認紅旗真的在（這是「殭屍化後仍可點」的前提）
    pip_set_mode(pip, "mode-er")
    assert pip.locator("#dock-panels .chip--warn").count() > 0, "急診模式下側欄應有紅旗"

    # 設定鈕也一起搬進小視窗，所以「在小視窗裡切版面」是自然動線，不是刁鑽操作。
    # 這一下會讓小視窗自己被收掉，所以點完不能再對它做任何等待（Target closed）。
    pip.click("#settings-toggle")
    pip.wait_for_selector("#settings-popover:not([hidden])")
    pip.click('#seg-layout .seg-btn[data-layout-opt="wide"]', no_wait_after=True)
    page.wait_for_selector('body[data-layout="wide"]', timeout=5000)
    page.wait_for_timeout(800)

    assert pip.is_closed(), "換版面後置頂小視窗必須被收回，否則變成不受控的殭屍"
    assert page.evaluate("() => window.ICDApp.store.getState().pinned") is False
    assert page.locator("#layout-dock").count() == 0, "主視窗不得殘留舊版面"
    assert page.locator("#layout-wide").count() == 1
    assert "置頂小視窗" not in page.evaluate("() => document.getElementById('app').textContent")

    # 切回門診：全頁不得再有任何紅旗（殘留的急診側欄若還在就會被抓到）
    page.evaluate("() => window.ICDApp.store.setMode('outpatient')")
    page.wait_for_timeout(300)
    assert page.locator(".chip--warn").count() == 0
    assert duplicate_ids(page) == []
    assert errors == [], errors
    page.close()


def test_pip_close_after_layout_switch_does_not_remount_dock(browser_ctx, page_url):
    """R2 C2：restoreFromPip() 不得把已經不是生效版面的側欄塞回 #app。

    C1 修好後使用者已經到不了原始重現路徑（切版面就會收回小視窗），所以這裡**刻意把
    teardown 停掉**來模擬第一層失效，直接驗證第二層守門本身：關掉小視窗時 #app 裡
    只能有一套版面，不得出現 10 組重複 id、也不得殘留可點的急診紅旗。
    """
    page, pip = open_pinned(browser_ctx, page_url)
    pip_set_mode(pip, "mode-er")

    # 停掉第一層（teardown）：小視窗會像修復前那樣活下來
    page.evaluate("() => { window.ICDApp.controller.teardown = () => {}; }")
    page.evaluate("() => window.ICDApp.store.setLayout('wide')")
    page.wait_for_selector('body[data-layout="wide"]', timeout=5000)
    page.wait_for_timeout(400)
    assert not pip.is_closed(), "前置條件不成立：teardown 沒有被停掉，就測不到第二層"

    pip.close()                       # pagehide → restoreFromPip
    page.wait_for_timeout(800)

    layouts = page.evaluate(
        "() => Array.from(document.getElementById('app').children).map(e => e.id)"
    )
    assert layouts == ["layout-wide"], f"#app 同時掛了多套版面：{layouts}"
    assert duplicate_ids(page) == [], f"出現重複 id：{duplicate_ids(page)}"
    assert page.locator("#mode-chip").count() == 1
    page.evaluate("() => window.ICDApp.store.setMode('outpatient')")
    page.wait_for_timeout(300)
    assert page.locator(".chip--warn").count() == 0, "門診模式下不得殘留可點的急診紅旗"
    page.close()


def test_pip_copy_failure_shows_fallback_inside_pip(browser_ctx, page_url):
    """R2 I5：在置頂小視窗裡複製失敗時，後備視窗與播報都要在**小視窗**裡。

    #status 與 #fallback-copy 原本寫死主文件，醫師在小視窗按「複製並貼入 HIS」會完全
    沒有回饋、剪貼簿也是空的——對話框開在被小視窗擋住、根本看不到的主視窗。
    """
    page, pip = open_pinned(browser_ctx, page_url)
    # 小視窗自己要有這兩個節點
    assert pip.locator("#status").count() == 1
    assert pip.locator("#fallback-copy").count() == 1

    # 讓小視窗的剪貼簿與 execCommand 都失敗（＝主文件未取得焦點時的常態）
    pip.evaluate(
        """() => {
            Object.defineProperty(navigator, 'clipboard', {
                configurable: true,
                get: () => ({ writeText: () => Promise.reject(new Error('blocked')) }),
            });
            document.execCommand = () => false;
        }"""
    )
    pip.locator("#dock-panels .chip[data-code]:not(.cat)").first.click()
    pip.wait_for_timeout(200)
    pip.click("#copy-all")
    pip.wait_for_timeout(500)

    expect(pip.locator("#fallback-copy")).to_be_visible()
    assert pip.input_value("#fallback-copy textarea") != "", "後備視窗裡沒有可複製的文字"
    expect(page.locator("#fallback-copy")).to_be_hidden()       # 主視窗不該冒出對話框
    assert pip.locator("#status").inner_text() != "", "小視窗裡沒有任何播報"

    pip.click("#fallback-close")
    expect(pip.locator("#fallback-copy")).to_be_hidden()
    pip.close()
    page.wait_for_timeout(600)
    page.close()


# ══════════════════════════════════════════════════════════════════════════
# R2 測試盲點補強（.review/r2-pipeline.md (b) 第 2、5 條）
# ══════════════════════════════════════════════════════════════════════════
def inject_probe_chips(page, codes):
    """注入「沒有 .cat class」的可點 chip，繞過 UI 層標記直接走事件委派進 addCode()。

    正常渲染會替非葉碼加上 .cat（委派據此擋掉），所以 store 的 canAdd → data.isAddable()
    那條防線在一般操作下永遠走不到。這裡刻意製造「上游防線被繞過」的情境。
    """
    page.evaluate(
        """(codes) => {
            document.getElementById('probe-chips')?.remove();
            const box = document.createElement('div');
            box.id = 'probe-chips';
            box.style.cssText = 'position:fixed;left:0;bottom:0;z-index:999999;background:#fff';
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


def test_addcode_rejects_non_leaf_and_unknown_codes(pg):
    """葉碼防呆在 1c 也必須真的擋住（R-4，臨床安全）。

    M4 變異（isAddable 一律回 true）原本只有 wide 版面的 E2E 抓得到，dock 與 mobile
    兩個版面完全沒有對應測試——三套版面共用同一條防線，但只有一套被真的練到。
    """
    errors = []
    pg.on("pageerror", lambda exc: errors.append(str(exc)))
    try:
        # 陽性對照：注入的葉碼必須真的進得了清單 → 證明事件委派確實抵達 addCode
        inject_probe_chips(pg, ["E11.9"])
        pg.click('#probe-chips .chip[data-code="E11.9"]')
        expect(pg.locator('#cart li[data-code="E11.9"]')).to_have_count(1)
        pg.click("#clear-cart")
        expect(pg.locator("#cart li")).to_have_count(0)

        probes = ["E11", "A00", "K11", "ZZZ99"]
        inject_probe_chips(pg, probes)
        for code in probes:
            pg.click(f'#probe-chips .chip[data-code="{code}"]')
            expect(pg.locator(f'#cart li[data-code="{code}"]')).to_have_count(0)
        assert pg.locator("#cart li").count() == 0, "類目碼／不存在代碼被加進清單（葉碼防呆失效）"
        expect(pg.locator(".dock-cart-codes")).to_have_text("尚未選碼")
        assert not errors, f"addCode() 對非葉碼/不存在代碼拋出未捕捉例外：{errors}"
    finally:
        pg.evaluate("() => document.getElementById('probe-chips')?.remove()")


def test_copy_matches_what_the_dock_shows_in_every_format(pg):
    """看到的＝貼出去的：剪貼簿必須等於「畫面上這幾列」照選定格式組出來的字串。

    wide／mobile 都有「#his-preview 文字 == 剪貼簿」的交叉驗證，1c 只驗過剪貼簿本身
    （.review/r2-pipeline.md (b) 第 5 條）。1c 依設計沒有預覽區（renderHis 寫進不掛進
    DOM 的暫存 <pre>），所以這裡拿它真正顯示給醫師看的兩處——就診清單 #cart li 與
    摘要列 .dock-cart-codes——當作「預覽」，跟剪貼簿逐字比對。期望值一律從 DOM 讀，
    不從 store 讀：從 store 讀等於拿同一個真相來源自證。
    """
    chips = pg.locator('#dock-panels .chip[data-code]:not(.cat)')
    chips.nth(0).click()
    chips.nth(1).click()
    chips.nth(2).click()
    expect(pg.locator("#cart li")).to_have_count(3)

    for fmt, joiner in (("lines", "\n"), ("comma", ","), ("names", "\n")):
        open_settings(pg)
        pg.click(f'#seg-format [data-format="{fmt}"]')
        expect(pg.locator(f'#seg-format [data-format="{fmt}"]')).to_have_attribute("aria-pressed", "true")
        shown = pg.eval_on_selector_all(
            "#cart li[data-code]",
            """(els) => els.map((li) => ({
                code: li.dataset.code,
                zh: li.querySelector('.cart-zh').textContent,
            }))""",
        )
        assert len(shown) == 3, f"{fmt}：畫面上的清單列數不對 {shown}"
        if fmt == "names":
            expected = joiner.join(r["code"] + "\t" + r["zh"] for r in shown)
        else:
            expected = joiner.join(r["code"] for r in shown)

        pg.click("#copy-all")
        expect(pg.locator("#copy-all")).to_contain_text("已複製")
        assert clipboard(pg) == expected, f"{fmt}：剪貼簿與畫面上的清單不一致"
        # 摘要列（醫師收合清單時唯一看得到的東西）也必須是同一組碼、同一個順序
        expect(pg.locator(".dock-cart-codes")).to_have_text("、".join(r["code"] for r in shown))

    open_settings(pg)
    pg.click('#seg-format [data-format="lines"]')
