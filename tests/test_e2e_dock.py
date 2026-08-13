"""E2E（1c 側掛窄欄，176×900）：對 dist/icd10.html 實跑。先由 conftest 跑 build/build.py。

DOM 契約見 .review/design-ref/impl-plan.md §4.2／§4.4。本檔只涵蓋 dock 版面；
1a 桌機在 tests/e2e_test.py、1b 手機在該階段自己的檔案。

1c 的兩條硬性性質（測試存在的理由）：
  * 176px 下**不得水平捲動**、文字不得溢出——貼在 HIS 旁邊的窄欄，一捲動就沒法用。
  * 置頂（Document Picture-in-Picture）**不支援時要顯示提示、不得靜默失敗**。
"""
import datetime
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
        s.setRegion(0);          // 取消選取（region=null）會跨模式保留，這裡明確歸位
        s.setQuery('');
        s.setSettingsOpen(false);
        s.setCartOpen(true);
        s.setTheme('light');
        s.resetPaneSizes();      // 窗格高度會寫 localStorage，殘留會讓別條測試量到上一條拖出來的高度
        s.setState({ favs: [], recent: [], expanded: {}, copied: false });
    }""")
    page.fill("#search", "")


def open_settings(page):
    if page.locator("#settings-popover").is_hidden():
        page.click("#settings-toggle")
    page.wait_for_selector("#settings-popover:not([hidden])")


MODE_OF_BUTTON_ID = {"mode-op": "outpatient", "mode-er": "emergency", "mode-surg": "surg"}


def set_mode(page, button_id):
    """看診模式已移出設定面板，改點 header 的三鈕。

    參數仍收舊的 button_id（設定 popover 裡那三顆的 id），呼叫端一個都不用改；
    對照表擺在這裡，之後真要換選擇器也只改這一處。
    """
    mode = MODE_OF_BUTTON_ID[button_id]
    page.click(f'#mode-switch [data-mode="{mode}"]')
    expect(page.locator(f'#mode-switch [data-mode="{mode}"]')).to_have_attribute("aria-pressed", "true")


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


# ---- 部位列（兩字短名、自動換行） ----
def test_region_pills_wrap_without_hscroll(pg):
    """名稱縮成兩字之後，部位列從等分兩欄 grid 改成依文字寬換行的 flex。

    原本斷言「剛好兩欄」；現在按鈕收成文字寬，176px 下一列排得下 4 顆——
    欄數不再是固定值，能守的是「不橫向捲動、不超出視窗、列數比原本少」。
    """
    pills = pg.locator("#region-pills .region-btn")
    assert pills.count() >= 4, "門診至少要有 4 個部位"
    boxes = [pills.nth(i).bounding_box() for i in range(pills.count())]

    rows = sorted({round(b["y"]) for b in boxes})
    assert len(rows) <= 4, f"{DOCK['width']}px 下部位列排了 {len(rows)} 列（縮短名稱前是 6 列）：{rows}"
    assert len({round(b["x"]) for b in boxes}) >= 2, "同一列應該擺得下多顆按鈕"

    for box in boxes:
        assert box["x"] >= 0 and box["x"] + box["width"] <= DOCK["width"] + 0.5, f"部位鈕超出視窗：{box}"
        assert box["height"] >= 20, f"部位鈕高度不足 20px：{box}"

    sw, cw = pg.eval_on_selector("#region-pills", "el => [el.scrollWidth, el.clientWidth]")
    assert sw <= cw, f"部位區橫向捲動：{sw} > {cw}"
    assert_no_hscroll(pg, "部位兩欄")

    # 兩欄是可點的 tab，不是裝飾
    pills.nth(2).click()
    expect(pills.nth(2)).to_have_attribute("aria-pressed", "true")
    expect(pills.nth(0)).to_have_attribute("aria-pressed", "false")
    assert pg.locator("#dock-panels .dock-panel").count() >= 1


def test_region_toggle_clears_selection_and_shows_all(pg):
    """已選的部位再點一次＝取消選取，改顯示全部部位的面板，且 176px 下不得破版。

    取消後每組面板前會多一條部位標題（1c 擠不下說明文字，全靠這條分辨來源部位），
    標題本身也必須守住「不得水平捲動、不得跑出視窗」這條硬性性質。
    """
    pills = pg.locator("#region-pills .region-btn")
    region_count = pills.count()
    second = pills.nth(1)
    second.click()
    expect(second).to_have_attribute("aria-pressed", "true")
    one_region_panels = pg.locator("#dock-panels .dock-panel").count()
    assert pg.locator("#dock-panels .region-heading").count() == 0, "選了部位時不該出現部位標題"

    second.click()
    expect(second).to_have_attribute("aria-pressed", "false")
    assert pg.locator('#region-pills .region-btn[aria-pressed="true"]').count() == 0, "取消後仍有部位被標為選取"
    assert pg.evaluate("() => window.ICDApp.store.getState().region") is None

    total = pg.evaluate(
        """() => {
            const d = window.ICDApp.data, mode = window.ICDApp.store.getState().mode;
            return d.regionsFor(mode).reduce((n, r, i) => n + d.panelsFor(mode, i).length, 0);
        }"""
    )
    expect(pg.locator("#dock-panels .dock-panel")).to_have_count(total)
    assert total > one_region_panels, f"顯示全部（{total}）沒有比單一部位（{one_region_panels}）多"
    expect(pg.locator("#dock-panels .region-heading")).to_have_count(region_count)
    assert_no_hscroll(pg, "取消部位選取")
    assert overflowing_elements(pg) == [], "顯示全部時有元素破版"

    pills.nth(0).click()
    expect(pills.nth(0)).to_have_attribute("aria-pressed", "true")
    assert pg.locator("#dock-panels .region-heading").count() == 0


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
def test_clipboard_syncs_on_every_cart_change(pg):
    """沒有「複製並貼入 HIS」鈕了：點一個診斷就把**目前全部代碼**寫進剪貼簿。

    醫師的動線是選碼→在 HIS 按 Ctrl+V（或 F9 熱鍵），中間那一次「按複製」是純粹的
    多餘步驟。移除按鈕之後，剪貼簿與清單必須永遠一致——不一致就會把上一位病人的
    代碼貼進這一位的病歷，所以加、減、換格式三條路徑都要驗。
    """
    assert pg.locator("#copy-all").count() == 0, "複製鈕應已移除"

    chips = pg.locator('#dock-panels .chip[data-code]:not(.cat)')
    codes = [chips.nth(i).get_attribute("data-code") for i in range(2)]

    chips.nth(0).click()
    expect(pg.locator("#cart li")).to_have_count(1)
    assert clipboard(pg) == codes[0], "點第一個診斷後剪貼簿就該是那個碼"

    chips.nth(1).click()
    expect(pg.locator("#cart li")).to_have_count(2)
    assert clipboard(pg) == "\n".join(codes), "剪貼簿要是目前全部代碼，不是最後點的那個"

    # 換格式：剪貼簿要跟著換，否則貼出去的是舊格式
    open_settings(pg)
    pg.click('#seg-format [data-format="comma"]')
    pg.click("#settings-toggle")
    assert clipboard(pg) == ",".join(codes)

    open_settings(pg)
    pg.click('#seg-format [data-format="names"]')
    pg.click("#settings-toggle")
    named = clipboard(pg)
    assert named.startswith(codes[0] + "\t") and (codes[1] + "\t") in named

    open_settings(pg)
    pg.click('#seg-format [data-format="lines"]')
    pg.click("#settings-toggle")

    # 移除一個：剪貼簿要縮短，不能留著已經拿掉的碼
    pg.locator(f'#cart li[data-code="{codes[0]}"] .cart-remove').click()
    expect(pg.locator("#cart li")).to_have_count(1)
    assert clipboard(pg) == codes[1]


def test_clear_cart_keeps_clipboard(pg):
    """清空清單**不清剪貼簿**：醫師常常是貼進 HIS 之後才按清空，
    這時把剪貼簿洗掉等於毀了他手上唯一那份。"""
    chip = first_panel_chip(pg)
    code = chip.get_attribute("data-code")
    chip.click()
    assert clipboard(pg) == code

    pg.click("#clear-cart")
    expect(pg.locator("#cart li")).to_have_count(0)
    assert clipboard(pg) == code, "清空清單不應把剪貼簿一起清掉"


def test_copy_date_button(pg):
    """「日期」鈕：HIS 的就診日期欄位吃民國格式，手打容易寫錯年份。"""
    btn = pg.locator("#copy-date")
    expect(btn).to_have_count(1)

    mode_x = pg.locator("#mode-switch").bounding_box()["x"]
    assert btn.bounding_box()["x"] < mode_x, "「日期」要排在看診模式三鈕左邊"

    btn.click()
    today = datetime.date.today()
    want = f"{today.year - 1911}-{today.month:02d}-{today.day:02d}"
    assert clipboard(pg) == want, f"剪貼簿[{clipboard(pg)}] 期望[{want}]"


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
    assert segs.count() == 5            # 版面 2 ＋ 格式 3（看診模式已移出設定，只留 header 三鈕）
    for i in range(segs.count()):
        box = segs.nth(i).bounding_box()
        assert box["x"] >= 0 and box["x"] + box["width"] <= DOCK["width"] + 0.5, f"segmented 溢出：{box}"
        assert box["height"] >= 22 - 0.5, f"小號 segmented 應該至少 22px：{box}"
    assert_no_hscroll(pg, "設定開啟")
    assert not overflowing_elements(pg), overflowing_elements(pg)

    # 看診模式已移出設定面板：header 三鈕是唯一入口，設定裡不該再有第二份
    assert pg.locator("#seg-mode").count() == 0, "設定面板不該再有看診模式 segmented"
    pg.click("#settings-toggle")
    expect(pg.locator("#settings-popover")).to_be_hidden()


def test_mode_buttons_switch_mode(pg):
    """三顆模式鈕直接並排，一次點擊就切換（1a／1b／1c 同一份行為）。

    1c 專屬的硬性條件：176px 下三顆鈕全部看得見且點得到、不得水平溢出，也不得把
    「置頂」與「設定」擠掉。三鈕與置頂／設定同列的版面性質由
    test_header_controls_share_one_row 守，這裡只管行為。
    """
    switch = pg.locator("#mode-switch")
    btns = switch.locator("[data-mode]")
    expect(btns).to_have_count(3)
    assert pg.locator("#mode-menu").count() == 0, "已改成三鈕並排，不得再有展開的選單"
    # 176px 用短標籤，完整名稱留在 title
    expect(switch.locator('[data-mode="outpatient"]')).to_have_text("門診")
    expect(switch.locator('[data-mode="outpatient"]')).to_have_attribute("title", "看診模式：內科門診")
    expect(switch.locator('[data-mode="outpatient"]')).to_have_attribute("aria-pressed", "true")

    for i in range(btns.count()):
        box = btns.nth(i).bounding_box()
        assert box is not None and box["width"] > 0, f"第 {i} 顆模式鈕量不到（被擠掉了）：{box}"
        assert box["x"] >= 0 and box["x"] + box["width"] <= DOCK["width"] + 0.5, f"模式鈕溢出：{box}"
    # 三顆鈕在同一列（並排，不是堆疊）
    tops = [btns.nth(i).bounding_box()["y"] for i in range(btns.count())]
    assert max(tops) - min(tops) < 1, f"三顆鈕沒有並排在同一列：{tops}"
    # 置頂與設定沒有被擠掉，且在模式列的下一列
    for sel in ("#pin-toggle", "#settings-toggle"):
        b = pg.locator(sel).bounding_box()
        assert b["x"] + b["width"] <= DOCK["width"] + 0.5, f"{sel} 被擠出視窗：{b}"
        assert b["y"] >= max(tops) - 0.5, f"{sel} 應在模式列同列或下方：{b}"
    assert_no_hscroll(pg, "三顆模式鈕並排")
    assert overflowing_elements(pg) == [], "模式列有元素破版"

    # 一次點擊即切換（不必先展開任何東西）
    switch.locator('[data-mode="surg"]').click()
    assert pg.get_attribute("body", "data-mode") == "surg"
    expect(switch.locator('[data-mode="surg"]')).to_have_attribute("aria-pressed", "true")
    expect(switch.locator('[data-mode="outpatient"]')).to_have_attribute("aria-pressed", "false")
    assert "is-on" in switch.locator('[data-mode="surg"]').get_attribute("class")
    assert_no_hscroll(pg, "切到外科")

    # 設定面板不再有第二份模式選單（只剩 header 這一條動線）
    open_settings(pg)
    assert pg.locator("#seg-mode").count() == 0
    pg.keyboard.press("Escape")

    set_mode(pg, "mode-op")
    expect(switch.locator('[data-mode="outpatient"]')).to_have_attribute("aria-pressed", "true")
    assert pg.get_attribute("body", "data-mode") == "outpatient"


def test_header_controls_share_one_row(pg):
    """密度原則（docs/dense-ui-principle.md）：模式三鈕＋置頂＋設定在**同一列**。

    使用者原話：「我希望這些按鈕只佔一列就好　門急診外科的按鈕不用這麼寬　緊縮跟文字
    一樣寬就好　這個介面的中心原則就是在有限的版面塞入最大量的資訊」。

    這條測試守三件事，任何一件退回去都會紅：
      1. 模式三鈕彼此同列、且所有控制項都在搜尋框那一列之下；
      2. 模式鈕是文字寬，不是等寬撐滿窄欄；
      3. 176px 下不水平溢出，置頂與設定沒有被擠出視窗，也沒有任何一個文字被裁掉。

    後來多了「日期」鈕（六個控制項），176px 排不下就會換行——原本「五個全部同列」
    的斷言在那個寬度下與「不得溢出」直接衝突，而不溢出才是硬性規則。所以同列只要求
    模式三鈕自己，其餘改為「都在視窗內、都量得到」。
    """
    sels = ('#mode-switch [data-mode="outpatient"]', '#mode-switch [data-mode="emergency"]',
            '#mode-switch [data-mode="surg"]', "#pin-toggle", "#settings-toggle", "#copy-date")
    boxes = {s: pg.locator(s).bounding_box() for s in sels}
    assert all(b and b["width"] > 0 for b in boxes.values()), f"有控制項量不到（被擠掉了）：{boxes}"

    mode_centers = {k: round(b["y"] + b["height"] / 2, 1)
                    for k, b in boxes.items() if k.startswith("#mode-switch")}
    assert max(mode_centers.values()) - min(mode_centers.values()) <= 1, \
        f"模式三鈕不在同一列：{mode_centers}"

    s_box = pg.locator("#search").bounding_box()
    for k, b in boxes.items():
        assert b["y"] >= s_box["y"] + s_box["height"] - 0.5, f"{k} 不在搜尋框下方那一列：{b}"

    # 模式鈕＝文字寬。等寬撐滿時整條 mode-switch ＝ 可用寬（164），文字寬時約 89
    avail = DOCK["width"] - 12
    switch = pg.locator("#mode-switch").bounding_box()
    assert switch["width"] <= avail * 0.65, \
        f"模式列仍在撐滿窄欄（{switch['width']} / 可用 {avail}），沒有縮成文字寬"
    op = boxes['#mode-switch [data-mode="outpatient"]']
    assert op["width"] <= 40, f"「門診」兩個字不該佔到 {op['width']}px"

    # 每一個控制項都要完整落在窄欄內（這條是硬性規則，換不換行都不能違反）
    for k, b in boxes.items():
        assert b["x"] >= 0 and b["x"] + b["width"] <= DOCK["width"] - 6 + 0.5, f"{k} 被擠出視窗：{b}"
    # 設定排在置頂之後（176px 下這一列會換行，所以「之後」可能是下一列的開頭）
    pin_b, set_b = boxes["#pin-toggle"], boxes["#settings-toggle"]
    assert set_b["y"] > pin_b["y"] + 1 or set_b["x"] > pin_b["x"], \
        f"設定應排在置頂之後：pin={pin_b} settings={set_b}"
    # 「日期」在模式三鈕左邊（同列時看 x；換行時它在上一列，y 更小也算左前方）
    op_box = boxes['#mode-switch [data-mode="outpatient"]']
    assert (boxes["#copy-date"]["y"] < op_box["y"] - 1
            or boxes["#copy-date"]["x"] < op_box["x"]), \
        f"「日期」應排在看診模式三鈕之前：{boxes['#copy-date']} vs {op_box}"

    # 誰的文字都不准被容器裁掉（置頂在 176px 是整顆藏起文字，不是裁一半，見下一條測試）
    clipped = pg.evaluate("""() => ['#mode-switch', '#pin-toggle', '#settings-toggle'].filter((s) => {
        const e = document.querySelector(s);
        return e && e.scrollWidth > e.clientWidth + 1;
    })""")
    assert clipped == [], f"控制項文字被裁切：{clipped}"

    # header 高度上限：搜尋 28 ＋ 控制列 24 ＋ 內距／間距。
    # 多了「日期」鈕之後 176px 排不下六個控制項，控制列會換行成兩列（+22px）——
    # 這是空間的物理限制，不換行就得把設定鈕擠出視窗，而不溢出是硬性規則。
    # 340px（Ctrl+Alt+D 貼齊的寬度）仍是一列，由 test_header_one_row_at_340 守。
    head = pg.locator(".dock-head").bounding_box()
    assert head["height"] <= 96, f"header 超過三列：{head['height']}px"
    assert_no_hscroll(pg, "header 併成一列")
    assert overflowing_elements(pg) == [], "header 併列後有元素破版"


def test_header_one_row_at_340(browser_ctx, page_url):
    """340px（實際貼在 HIS 旁邊的寬度）下，六個控制項要回到同一列。

    176px 換行是不得已；真正天天用的寬度不該為了那個極端情境多付一列高度。
    """
    page = browser_ctx.new_page()
    page.set_viewport_size({"width": 340, "height": 900})
    page.goto(page_url)
    page.wait_for_selector('body[data-ready="1"]', timeout=8000)
    page.evaluate("() => window.ICDApp.store.setLayout('dock')")
    page.wait_for_selector('body[data-layout="dock"]')

    sels = ("#copy-date", '#mode-switch [data-mode="outpatient"]', "#pin-toggle", "#settings-toggle")
    centers = {s: round(page.locator(s).bounding_box()["y"]
                        + page.locator(s).bounding_box()["height"] / 2, 1) for s in sels}
    assert max(centers.values()) - min(centers.values()) <= 1, f"340px 下沒有排成一列：{centers}"
    assert_no_hscroll(page, "340px header")
    page.close()


def test_pin_label_is_the_only_text_dropped_and_only_when_narrowest(browser_ctx, page_url):
    """置頂那兩個字是整列唯一塞不下、因此被讓掉的東西（算式見 dock.css 的 media query）。

    砍文字是最後手段，所以這條測試把界線釘死：
      * 176px：置頂只留 icon，但完整說明必須留在 title，狀態另有 aria-pressed；
      * 模式三鈕與「設定」的文字**任何寬度都不准砍**；
      * 使用者實際在用的 PiP 寬度（約 565px）文字必須回來。
    """
    page = browser_ctx.new_page()
    page.goto(page_url)
    page.wait_for_selector('body[data-ready="1"]')
    page.evaluate("() => window.ICDApp.store.setLayout('dock')")
    page.wait_for_selector('body[data-layout="dock"]')

    page.set_viewport_size({"width": 176, "height": 900})
    page.wait_for_timeout(120)
    expect(page.locator("#pin-toggle .dock-pin-label")).to_be_hidden()
    expect(page.locator("#pin-toggle .icn")).to_be_visible()
    assert "置頂" in page.get_attribute("#pin-toggle", "title")
    expect(page.locator("#pin-toggle")).to_have_attribute("aria-pressed", "false")
    # 沒被砍的那些
    expect(page.locator("#settings-toggle")).to_have_text("設定")
    for key, label in (("outpatient", "門診"), ("emergency", "急診"), ("surg", "外科")):
        expect(page.locator(f'#mode-switch [data-mode="{key}"]')).to_have_text(label)
    assert_no_hscroll(page, "176px 置頂只留 icon")

    page.set_viewport_size({"width": 565, "height": 900})
    page.wait_for_timeout(120)
    expect(page.locator("#pin-toggle .dock-pin-label")).to_be_visible()
    expect(page.locator("#pin-toggle .dock-pin-label")).to_have_text("置頂")
    assert_no_hscroll(page, "565px 置頂文字回來")
    page.close()


def test_region_pills_are_short_labels_without_all_button(pg):
    """部位鈕：兩字短名、擠成不超過兩列，且沒有「全部」鈕（使用者要求）。

    取消篩選的入口改回「再點一次已選的部位」那一條（由
    test_region_toggle_clears_selection_and_shows_all 覆蓋）；這裡只守住
    「全部」不會被加回來、以及短名不會又長回去——長名會把按鈕撐成六列，
    那正是這次要解決的問題。全名必須留在 title，否則兩個字看不出是哪一區。
    """
    assert pg.locator(".region-all-btn").count() == 0, "「全部」鈕應已移除"
    pills = pg.locator("#region-pills .region-btn")
    n = pills.count()
    assert n >= 4

    texts = [pills.nth(i).inner_text().strip() for i in range(n)]
    too_long = [t for t in texts if len(t) > 2]
    assert not too_long, f"部位鈕不是兩個字：{too_long}"

    for i in range(n):
        title = pills.nth(i).get_attribute("title") or ""
        assert len(title) > 2, f"第 {i} 顆部位鈕沒有把全名留在 title：{title!r}"

    rows = sorted({round(pills.nth(i).bounding_box()["y"]) for i in range(n)})
    assert len(rows) <= 3, f"{DOCK['width']}px 下部位鈕排了 {len(rows)} 列：{rows}"
    assert_no_hscroll(pg, "部位短名列")


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


def test_pin_note_success_auto_dismisses_failure_stays(browser_ctx, page_url):
    """一次性說明不得永久占版面；還沒解決的問題必須留著。

    「已開啟置頂小視窗，可拖到 HIS 旁邊」是操作說明，看過就沒用，卻在 176px 下佔兩行
    （約 27px）——密度原則要求它自己消失。「不支援／被擋下」相反：那是使用者還沒排除的
    障礙，講的是下一步怎麼做，任何時候都不准自動消失。
    """
    # (a) 失敗提示：不會自己消失
    blocked = browser_ctx.new_page()
    blocked.add_init_script(
        "Object.defineProperty(window, 'documentPictureInPicture',"
        " { value: undefined, configurable: true });"
    )
    blocked.goto(page_url)
    blocked.wait_for_selector('body[data-ready="1"]')
    blocked.evaluate("() => window.ICDApp.store.setLayout('dock')")
    blocked.wait_for_selector('body[data-layout="dock"]')
    blocked.click("#pin-toggle")
    expect(blocked.locator("#pin-note")).to_be_visible()
    blocked.wait_for_timeout(8000)          # 比成功提示的存活時間長
    expect(blocked.locator("#pin-note")).to_be_visible()
    assert "不支援" in blocked.locator("#pin-note").inner_text()
    blocked.close()

    # (b) 成功提示：先出現、再自己消失，header 縮回兩列
    page = browser_ctx.new_page()
    page.goto(page_url)
    page.wait_for_selector('body[data-ready="1"]')
    page.evaluate("() => window.ICDApp.store.setLayout('dock')")
    page.wait_for_selector('body[data-layout="dock"]')
    if not page.evaluate(PIP_PROBE):
        page.close()
        pytest.skip("此瀏覽器沒有 Document Picture-in-Picture，降級路徑在 (a) 已驗")

    before = set(browser_ctx.pages)
    page.click("#pin-toggle")
    page.wait_for_timeout(1500)
    fresh = [p for p in browser_ctx.pages if p not in before]
    assert len(fresh) == 1, "沒有開出置頂小視窗"
    pip = fresh[0]

    note = pip.locator("#pin-note")
    expect(note).to_be_visible()            # 提示先看得到
    assert "已開啟" in note.inner_text()
    tall = pip.locator(".dock-head").bounding_box()["height"]

    expect(note).to_be_hidden(timeout=12000)    # 逾時後自己讓出版面
    short = pip.locator(".dock-head").bounding_box()["height"]
    assert short < tall, f"提示消失後 header 沒有縮回去：{tall} → {short}"
    # 消失的只有提示：小視窗還在、還是置頂狀態、側欄還在小視窗裡
    assert pip.evaluate("() => !!document.getElementById('layout-dock')") is True
    assert page.evaluate("() => window.ICDApp.store.getState().pinned") is True
    expect(pip.locator("#pin-toggle")).to_have_attribute("aria-pressed", "true")

    pip.close()
    page.wait_for_timeout(600)
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
    # 部位列是換行的 flex（原本是兩欄 grid）——確認樣式真的跟著複製進小視窗
    pills_style = pip.evaluate("""() => {
        const s = getComputedStyle(document.getElementById('region-pills'));
        return { display: s.display, wrap: s.flexWrap };
    }""")
    assert pills_style == {"display": "flex", "wrap": "wrap"}, \
        f"小視窗裡沒吃到樣式（部位列不是換行 flex）：{pills_style}"
    assert pip.evaluate(
        "() => getComputedStyle(document.getElementById('clear-cart')).color"
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
    """小視窗裡切看診模式。模式已移出設定面板，改點 header 三鈕
    （走的仍是 render-dock.js 的 pipDelegate 代打，不是主文件的委派）。"""
    mode = MODE_OF_BUTTON_ID[button_id]
    pip.click(f'#mode-switch [data-mode="{mode}"]')
    pip.wait_for_timeout(300)


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
    assert page.locator("#mode-switch").count() == 1
    page.evaluate("() => window.ICDApp.store.setMode('outpatient')")
    page.wait_for_timeout(300)
    assert page.locator(".chip--warn").count() == 0, "門診模式下不得殘留可點的急診紅旗"
    page.close()


def test_pip_copy_failure_shows_fallback_inside_pip(browser_ctx, page_url):
    """R2 I5：在置頂小視窗裡複製失敗時，後備視窗與播報都要在**小視窗**裡。

    #status 與 #fallback-copy 原本寫死主文件，醫師在小視窗按複製會完全沒有回饋、
    剪貼簿也是空的——對話框開在被小視窗擋住、根本看不到的主視窗。

    改用「日期」鈕觸發：清單的自動同步刻意是靜默的（每點一個代碼就彈一次對話框
    比沒複製到更糟），而使用者**主動按**的複製失敗時仍必須跳後備視窗。
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
    assert pip.locator("#fallback-copy").is_hidden(), "清單自動同步失敗時不該跳對話框"
    pip.click("#copy-date")
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

        # 沒有複製鈕了：改格式當下就自動同步，剪貼簿必須立刻與畫面一致
        pg.wait_for_timeout(200)
        assert clipboard(pg) == expected, f"{fmt}：剪貼簿與畫面上的清單不一致"
        # 摘要列（醫師收合清單時唯一看得到的東西）也必須是同一組碼、同一個順序
        expect(pg.locator(".dock-cart-codes")).to_have_text("、".join(r["code"] for r in shown))

    open_settings(pg)
    pg.click('#seg-format [data-format="lines"]')


# ══════════════════════════════════════════════════════════════════════════
# 窗格高度手動調整（使用者原話：「我希望各個窗格的高度我可以手動調整」）
# 1c 是提出需求的版面：部位區、相關疾病、清單三條分界可調；header 那條刻意不做。
# ══════════════════════════════════════════════════════════════════════════
def pane_h(page, selector):
    return page.evaluate("(sel) => document.querySelector(sel).getBoundingClientRect().height", selector)


def sep_for(page, pane_id):
    return page.locator(f'.pane-resizer[aria-controls="{pane_id}"]')


def drag_pane(page, pane_id, dy):
    box = page.locator(f'.pane-resizer[aria-controls="{pane_id}"]').bounding_box()
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x, y + dy, steps=6)
    page.mouse.up()
    page.wait_for_timeout(150)


def with_code(page):
    """加一個碼：相關疾病區與清單區（連同它們的分隔條）才會出現。"""
    page.locator('#dock-panels .chip[data-code]:not(.cat)').first.click()
    page.wait_for_timeout(250)


def test_pane_resizers_present_with_aria(pg):
    """三條分隔條：部位區永遠在，相關疾病與清單有內容才出現（沒東西可調就不給假的線）。"""
    assert pg.locator(".pane-resizer").count() == 3
    expect(sep_for(pg, "region-pills")).to_be_visible()
    expect(sep_for(pg, "related")).to_be_hidden()
    expect(sep_for(pg, "cart-inline")).to_be_hidden()

    with_code(pg)
    for pane_id in ("region-pills", "related", "cart-inline"):
        sep = sep_for(pg, pane_id)
        expect(sep).to_be_visible()
        assert sep.get_attribute("role") == "separator"
        assert sep.get_attribute("aria-orientation") == "horizontal"
        assert sep.get_attribute("tabindex") == "0"
        assert (sep.get_attribute("aria-label") or "").endswith("高度")
        now = int(sep.get_attribute("aria-valuenow"))
        assert int(sep.get_attribute("aria-valuemin")) <= now <= int(sep.get_attribute("aria-valuemax"))
    # 分隔條要在它負責的窗格旁邊：部位區在上（往下拖變高）、清單在下（往上拖變高）
    assert sep_for(pg, "region-pills").bounding_box()["y"] > pg.locator("#region-pills").bounding_box()["y"]
    assert sep_for(pg, "cart-inline").bounding_box()["y"] < pg.locator("#cart-inline").bounding_box()["y"]


def test_pane_drag_and_keyboard(pg):
    with_code(pg)
    before = pane_h(pg, "#region-pills")
    drag_pane(pg, "region-pills", -50)
    after = pane_h(pg, "#region-pills")
    assert after < before - 30, f"部位區沒有被拖小：{before} → {after}"
    assert pg.evaluate("() => window.ICDApp.store.paneSizeFor('dock', 'regions')") == round(after)
    # 部位區讓出來的空間要真的給捲動內容區（不是留白，也不是把畫面撐出視窗）
    assert pane_h(pg, ".dock-scroll") > 0
    assert_no_hscroll(pg, "拖小部位區後")

    cart_before = pane_h(pg, "#cart-inline")
    drag_pane(pg, "cart-inline", -60)
    assert pane_h(pg, "#cart-inline") > cart_before + 30, "清單區往上拖應該變高"
    assert_no_hscroll(pg, "拉高清單區後")

    sep = sep_for(pg, "region-pills")
    sep.focus()
    h0 = pane_h(pg, "#region-pills")
    sep.press("ArrowDown")
    pg.wait_for_timeout(80)
    assert pane_h(pg, "#region-pills") == h0 + 16, "方向鍵一次調 16px"
    sep.press("ArrowUp")
    pg.wait_for_timeout(80)
    assert pane_h(pg, "#region-pills") == h0


@pytest.mark.parametrize("theme", ["light", "dark"])
def test_pane_resize_keeps_no_horizontal_overflow(pg, theme):
    """176px 的硬性規則：任何高度組合下都不得水平捲動（部位區長出捲軸時最容易破）。"""
    pg.evaluate("(t) => window.ICDApp.store.setTheme(t)", theme)
    with_code(pg)
    search(pg, "急性")
    for pane_id, dy in (("region-pills", -60), ("related", -80), ("cart-inline", -70), ("region-pills", 400)):
        drag_pane(pg, pane_id, dy)
        assert_no_hscroll(pg, f"{theme}／拖 {pane_id} {dy}")
        bad = overflowing_elements(pg)
        assert not bad, f"{theme}／拖 {pane_id} 後文字溢出：{bad}"
    # 部位區被拖到長出捲軸時，一列仍要擺得下多顆（掉成一顆一列＝大半部位要捲才看得到）
    per_row = pg.evaluate("""() => {
        const pills = [...document.querySelectorAll('#region-pills .region-btn')];
        const first = pills[0].getBoundingClientRect().top;
        return pills.filter((p) => Math.abs(p.getBoundingClientRect().top - first) < 1).length;
    }""")
    assert per_row >= 2, f"部位區長出捲軸後一列只剩 {per_row} 顆"
    pg.evaluate("() => window.ICDApp.store.setTheme('light')")


def test_pane_cannot_be_dragged_away(pg):
    """拖到極限：窗格不得消失，捲動內容區也不得被吃光。"""
    with_code(pg)
    drag_pane(pg, "region-pills", -900)
    assert pane_h(pg, "#region-pills") >= 44, "部位區被拖沒了"
    expect(pg.locator("#region-pills .region-btn").first).to_be_visible()

    drag_pane(pg, "region-pills", 2000)
    assert pane_h(pg, ".dock-scroll") >= 80, "部位區吃光了主訴面板的空間"
    expect(pg.locator("#clear-cart")).to_be_visible()
    expect(pg.locator("#cart li").first).to_be_visible()
    assert_no_hscroll(pg, "極限拖曳後")

    drag_pane(pg, "cart-inline", 900)
    assert pane_h(pg, "#cart-inline") >= 48, "清單區被拖沒了"


def test_pane_height_survives_reload(browser_ctx, page_url):
    pg = browser_ctx.new_page()
    pg.goto(page_url)
    pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
    pg.evaluate("() => { window.ICDApp.store.setLayout('dock'); window.ICDApp.store.resetPaneSizes(); }")
    pg.wait_for_selector('body[data-layout="dock"]')
    drag_pane(pg, "region-pills", -40)
    saved = round(pane_h(pg, "#region-pills"))
    assert pg.evaluate("() => window.ICDApp.store.paneSizeFor('dock', 'regions')") == saved

    pg.reload()
    pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
    pg.wait_for_selector('body[data-layout="dock"]')
    assert round(pane_h(pg, "#region-pills")) == saved, "重新整理後部位區沒有回到調好的高度"
    assert pg.evaluate("() => JSON.stringify(window.ICDApp.store.getState().paneSizes)") \
        == '{"dock":{"regions":%d}}' % saved, "1c 調的高度不得寫到別的版面"
    pg.evaluate("() => window.ICDApp.store.resetPaneSizes()")
    pg.close()


def test_pane_reset_from_settings(pg):
    open_settings(pg)
    expect(pg.locator("#reset-panes")).to_be_disabled()
    pg.click("#settings-toggle")

    default_h = pane_h(pg, "#region-pills")
    drag_pane(pg, "region-pills", -50)
    assert pane_h(pg, "#region-pills") < default_h - 30

    open_settings(pg)
    expect(pg.locator("#reset-panes")).to_be_enabled()
    pg.click("#reset-panes")
    pg.wait_for_timeout(200)
    assert pg.evaluate("() => window.ICDApp.store.paneSizeFor('dock', 'regions')") is None
    assert abs(pane_h(pg, "#region-pills") - default_h) < 1, "回復預設後高度沒回到原樣"
    assert pg.evaluate("() => document.getElementById('region-pills').style.height") == ""
    assert "回復" in pg.locator("#status").inner_text()
    expect(pg.locator("#reset-panes")).to_be_disabled()
    pg.click("#settings-toggle")


def test_pane_resize_works_inside_pip(browser_ctx, page_url):
    """置頂小視窗是另一個 document：拖曳在那裡也要能用（事件全部得走小視窗自己的文件）。"""
    page, pip = open_pinned(browser_ctx, page_url)
    errors = []
    pip.on("pageerror", lambda e: errors.append(str(e)))
    page.evaluate("() => window.ICDApp.store.resetPaneSizes()")
    pip.wait_for_timeout(200)

    expect(pip.locator('.pane-resizer[aria-controls="region-pills"]')).to_be_visible()
    before = pane_h(pip, "#region-pills")
    drag_pane(pip, "region-pills", -40)
    after = pane_h(pip, "#region-pills")
    assert after < before - 20, f"小視窗裡拖不動：{before} → {after}"
    assert page.evaluate("() => window.ICDApp.store.paneSizeFor('dock', 'regions')") == round(after)
    assert errors == [], errors

    # 小視窗高度只有 900 以下，主視窗關掉小視窗後高度要重新夾一次而不是溢出
    pip.close()
    page.wait_for_timeout(600)
    assert page.evaluate("() => !!document.getElementById('layout-dock')") is True
    assert round(pane_h(page, "#region-pills")) == round(after)
    page.evaluate("() => window.ICDApp.store.resetPaneSizes()")
    page.close()


# ══════════════════════════════════════════════════════════════════════════
# 可及性（1c）：地標、標題階層、部位列語意、代碼鍵盤可達
# 依據 .review/v3-edge.md §5 的三條 ARIA 缺陷與 .review/v1-visual.md §3 的唯一破口。
# ══════════════════════════════════════════════════════════════════════════
HEADINGS_JS = """() => [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
    .filter((h) => !h.closest('[hidden]'))
    .map((h) => ({ level: Number(h.tagName[1]), text: h.textContent.trim() }))"""


def assert_heading_outline(page, label):
    """H1 恰好一個、排在最前、有 H2，且相鄰標題不得跳級（H2 → H4 是跳級）。"""
    hs = page.evaluate(HEADINGS_JS)
    levels = [h["level"] for h in hs]
    assert levels, f"{label}：整份文件沒有任何標題"
    assert levels.count(1) == 1, f"{label}：H1 應恰好一個，實際 {levels.count(1)} 個 → {hs}"
    assert levels[0] == 1, f"{label}：第一個標題不是 H1 → {hs}"
    assert 2 in levels, f"{label}：完全沒有 H2 → {hs}"
    for prev, cur in zip(levels, levels[1:]):
        assert cur <= prev + 1, f"{label}：標題跳級 H{prev} → H{cur} → {hs}"


def test_a11y_single_main_landmark(pg):
    """側掛窄欄也要有 <main>，而且只能有一個（v3 §5-1）。"""
    expect(pg.locator('main, [role="main"]')).to_have_count(1)
    scope = pg.evaluate("""() => {
        const m = document.querySelector('main');
        const has = (id) => m.contains(document.getElementById(id));
        return { panels: has('dock-panels'), results: has('search-results'),
                 pills: has('region-pills'), cart: has('cart') };
    }""")
    assert scope["panels"] and scope["results"], f"面板／搜尋結果不在 main 裡：{scope}"
    assert not scope["pills"] and not scope["cart"], f"main 把其他區塊吃進去了：{scope}"


def test_a11y_heading_outline(pg):
    """標題階層要完整（v3 §5-2）。1c 沒有可見標題，全部用 sr-only 補，不多占一個像素。"""
    assert_heading_outline(pg, "1c 側掛窄欄")
    assert pg.evaluate("() => document.querySelector('h1').textContent") == "ICD-10 門診導引"
    assert pg.evaluate("""() => ['h1', 'h2', '#panels-title'].every((sel) => {
        const h = document.querySelector(sel);
        return h && h.classList.contains('sr-only') && h.getBoundingClientRect().width <= 2;
    })""") is True
    # sr-only 標題不得把 176px 的窄欄撐出水平捲動
    assert_no_hscroll(pg, "補上 sr-only 標題後")


def test_a11y_region_buttons_are_toggle_buttons_not_fake_tabs(pg):
    """部位 grid 不得再宣告 tablist／tab（v3 §5-3：宣告了方向鍵契約卻沒實作）。"""
    assert pg.locator('[role="tablist"], [role="tab"]').count() == 0, "還有元素宣告 tablist／tab 語意"
    expect(pg.locator("#region-pills")).to_have_attribute("role", "group")
    expect(pg.locator("#region-pills")).to_have_attribute("aria-label", "身體部位")

    second = pg.locator("#region-pills .region-btn").nth(1)
    second.click()
    expect(second).to_have_attribute("aria-pressed", "true")
    assert pg.locator('#region-pills .region-btn[aria-pressed="true"]').count() == 1

    # 「全部」鈕已移除；取消篩選＝再點一次已選的那顆
    second.click()
    expect(second).to_have_attribute("aria-pressed", "false")
    assert pg.locator('#region-pills .region-btn[aria-pressed="true"]').count() == 0


def test_a11y_cart_code_is_keyboard_reachable_and_copies(pg):
    """b.cart-code 可點擊複製，就必須可聚焦、可鍵盤觸發（v1 §3）。"""
    pg.evaluate("() => window.ICDApp.store.addCode('I10', '本態性高血壓')")
    code = pg.locator('#cart li[data-code="I10"] b.cart-code')
    expect(code).to_have_attribute("role", "button")
    expect(code).to_have_attribute("tabindex", "0")

    pg.locator('#cart li[data-code="I10"]').focus()
    pg.keyboard.press("Tab")
    landed = pg.evaluate("""() => {
        const a = document.activeElement;
        const li = a.closest ? a.closest('li[data-code]') : null;
        const cs = getComputedStyle(a);
        return { tag: a.tagName, cls: a.className, code: li && li.dataset.code,
                 focusVisible: a.matches(':focus-visible'),
                 outline: cs.outlineWidth + ' ' + cs.outlineStyle };
    }""")
    assert landed["tag"] == "B" and "cart-code" in landed["cls"], f"Tab 沒有停在代碼上：{landed}"
    assert landed["code"] == "I10"
    assert landed["focusVisible"] is True, f"鍵盤聚焦後沒有 :focus-visible：{landed}"
    assert landed["outline"].split()[0] != "0px" and "none" not in landed["outline"], \
        f"聚焦沒有可見外框：{landed}"

    pg.keyboard.press("Enter")
    pg.wait_for_timeout(150)
    assert clipboard(pg) == "I10"
    assert pg.locator("#status").inner_text() == "已複製 I10"


def test_clear_cart_disabled_when_empty(pg):
    """清單為空時「清空」要停用——按了什麼都不會發生的鈕，看起來像壞掉。"""
    expect(pg.locator("#clear-cart")).to_be_disabled()

    pg.evaluate("() => window.ICDApp.store.addCode('I10', '本態性高血壓')")
    expect(pg.locator("#clear-cart")).to_be_enabled()

    pg.click("#clear-cart")
    expect(pg.locator("#cart li")).to_have_count(0)
    expect(pg.locator("#clear-cart")).to_be_disabled()
    assert "空" in pg.get_attribute("#clear-cart", "title")


def test_pip_requests_width_above_two_column_threshold(browser_ctx, page_url):
    """置頂小視窗的預設請求寬度要落在兩欄門檻（327px）的正確一側。

    原本請求 200px：部位 grid 與面板列都只排得出一欄，一屏可見代碼 17 個
    （.review/v2-density.md）。改成 340px 後同一屏 33 個，而 340 仍在 1c 的
    窄欄工作範圍內。這裡直接攔截 requestWindow 讀它拿到的參數，不必真的開視窗。
    """
    page = browser_ctx.new_page()
    page.add_init_script("""
        window.__pipOpts = null;
        Object.defineProperty(window, 'documentPictureInPicture', {
            configurable: true,
            value: {
                requestWindow: (opts) => {
                    window.__pipOpts = { width: opts.width, height: opts.height };
                    return Promise.reject(new Error('stub：只攔參數，不真的開視窗'));
                },
            },
        });
    """)
    page.goto(page_url)
    page.wait_for_selector('body[data-ready="1"]')
    page.evaluate("() => window.ICDApp.store.setLayout('dock')")
    page.wait_for_selector('body[data-layout="dock"]')

    page.click("#pin-toggle")
    page.wait_for_timeout(200)
    opts = page.evaluate("() => window.__pipOpts")
    assert opts is not None, "沒有呼叫 requestWindow"
    assert opts["width"] >= 327, f"請求寬度 {opts['width']}px 仍落在單欄那一側（門檻 327px）"
    page.close()
