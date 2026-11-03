"""E2E：置頂小視窗（Document Picture-in-Picture）裡，主委派認得的每個控制項都要點得動。

為什麼有這一檔：1c 置頂時整條側欄被搬進 PiP 小視窗那個**另一個文件**，掛在主文件
document 上的事件委派搆不到它。以前 render-dock.js 抄了一份白名單式的代打，新控制項
沒登記進去就只在置頂時靜默失效（慢病入口、「展開」、血脂試算都漏過）——而診間用的
正是置頂模式。

現在 interactions.js 的委派改成 `bindDocument(doc)`，小視窗的文件也綁同一份。這一檔
把主委派認得的 selector 逐一在小視窗裡觸發一次，斷言 store 或 DOM 有對應的變化：
日後在主委派加了控制項卻沒在這裡補一條，至少看得出缺哪一條；而任何一條在置頂時
沒接上線，這裡就會紅燈。

不在這裡的：VAC／Anti／Date 三個浮層的事件掛在節點自己身上（跟著節點走），由
test_e2e_dock.py 的 test_pinned_every_overlay_entry_button_actually_opens 掃過；
「展開」（[data-layout-go]）會關掉小視窗，另有 test_pinned_expand_button_is_reachable_from_the_pip_window；
#fallback-close 見 test_pip_copy_failure_shows_fallback_inside_pip。
"""
import time
from pathlib import Path

import pytest
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parent.parent
WIDE = {"width": 1440, "height": 900}
PIP_PROBE = ("() => typeof window.documentPictureInPicture === 'object'"
             " && window.documentPictureInPicture !== null"
             " && typeof window.documentPictureInPicture.requestWindow === 'function'")
SEED = ("I10", "E11.9")


@pytest.fixture(scope="module")
def pinned():
    """主視窗＋小視窗各一，整個模組共用（每開一次小視窗約 1.5 秒）。"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport=dict(WIDE),
                                  permissions=["clipboard-read", "clipboard-write"])
        page = ctx.new_page()
        page.goto((ROOT / "dist" / "icd10.html").as_uri())
        page.wait_for_selector('body[data-ready="1"]', timeout=8000)
        page.evaluate("() => window.ICDApp.store.setLayout('dock')")
        page.wait_for_selector('body[data-layout="dock"]')
        page.evaluate("() => window.ICDApp.data.ensureDb()")
        page.wait_for_selector('body[data-db="ready"]', timeout=30000)
        if not page.evaluate(PIP_PROBE):
            browser.close()
            pytest.skip("此瀏覽器沒有 Document Picture-in-Picture")
        before = set(ctx.pages)
        page.click("#pin-toggle")
        page.wait_for_timeout(1500)
        fresh = [x for x in ctx.pages if x not in before]
        assert len(fresh) == 1, "沒有開出置頂小視窗"
        pip = fresh[0]
        # 小視窗的剪貼簿換成記錄器：測的是「事件有沒有接上線」，不是剪貼簿權限與焦點
        pip.evaluate("""() => {
            window.__copies = [];
            Object.defineProperty(navigator, 'clipboard', {
                configurable: true,
                get: () => ({ writeText: (t) => { window.__copies.push(t); return Promise.resolve(); } }),
            });
        }""")
        yield page, pip
        browser.close()


def state(page, expr):
    return page.evaluate(f"() => {{ const s = window.ICDApp.store.getState(); return {expr}; }}")


def until(fn, msg, timeout=2.0):
    """輪詢到成立為止；逾時就把最後一次的值放進訊息裡。"""
    end = time.time() + timeout
    last = None
    while time.time() < end:
        last = fn()
        if last:
            return last
        time.sleep(0.05)
    raise AssertionError(f"{msg}（最後一次：{last!r}）")


def reset(page, pip):
    page.evaluate("""() => {
        const s = window.ICDApp.store;
        s.clearCart();
        s.setMode('outpatient');
        s.setRegion(0);
        s.setQuery('');
        s.setSettingsOpen(false);
        s.setChronicTopic(null);
        s.setCcrOpen(false);
        s.setLipidOpen(false);
        s.setCartOpen(true);
        s.setTheme('light');
        s.setFormat('lines');
        s.setState({ favs: [], recent: [], expanded: {}, copied: false });
        s.resetPaneSizes();
    }""")
    pip.evaluate("""() => {
        const search = document.getElementById('search');
        if (search) search.value = '';
        for (const el of document.querySelectorAll('.ccr-input, .lipid-input')) el.value = '';
        for (const box of document.querySelectorAll('[data-lipid-key]')) box.checked = false;
        const status = document.getElementById('status');
        if (status) status.textContent = '';
        const notice = document.getElementById('notice');
        if (notice) notice.hidden = true;
    }""")
    pip.wait_for_timeout(100)


def seed(page, pip):
    """清單放兩筆（I10 主、E11.9 次）。"""
    for code in SEED:
        page.evaluate("(c) => window.ICDApp.store.addCode(c, window.ICDApp.data.labelOf(c) || c)", code)
    until(lambda: pip.locator("#cart li").count() == 2, "清單沒有兩筆")


def status_text(pip):
    return pip.evaluate("() => (document.getElementById('status') || {}).textContent || ''")


def copies(pip):
    return pip.evaluate("() => window.__copies.length")


def copied(pip, before, needle=None):
    """小視窗的剪貼簿收到新的一筆（needle 有給就要包含它）。"""
    return until(lambda: copies(pip) > before
                 and (needle is None or needle in pip.evaluate("() => window.__copies.at(-1)")),
                 "沒有寫入剪貼簿")


def open_settings(pip):
    pip.click("#settings-toggle")
    expect(pip.locator("#settings-popover")).to_be_visible()


# ---- 各控制項：(動作, 斷言) 寫在同一個函式裡 --------------------------------
def case_mode_button(page, pip):
    pip.click('#mode-switch [data-mode="emergency"]')
    until(lambda: state(page, "s.mode") == "emergency", "模式鈕沒切換")


def case_region_button(page, pip):
    pip.click('.region-btn[data-region-index="2"]')
    until(lambda: state(page, "s.region") == 2, "部位鈕沒切換")


def case_panel_toggle(page, pip):
    pip.locator("#dock-panels .panel-toggle").first.click()
    until(lambda: state(page, "Object.values(s.expanded).filter(Boolean).length") == 1, "常見疾病沒展開")


def case_expand_all(page, pip):
    pip.click("#expand-all-panels")
    until(lambda: state(page, "Object.values(s.expanded).filter(Boolean).length") > 1, "全展開沒作用")


def case_chip(page, pip):
    pip.locator("#dock-panels .chip[data-code]:not(.cat)").first.click()
    until(lambda: state(page, "s.cart.length") == 1, "點代碼沒加入清單")


def case_cart_code_click(page, pip):
    seed(page, pip)
    n = copies(pip)
    pip.locator("#cart b.cart-code").first.click()
    copied(pip, n, "I10")


def case_cart_code_enter(page, pip):
    seed(page, pip)
    pip.locator("#cart b.cart-code").first.focus()
    n = copies(pip)
    pip.keyboard.press("Enter")
    copied(pip, n, "I10")


def case_cart_primary(page, pip):
    seed(page, pip)
    pip.click('#cart li[data-code="E11.9"] .cart-primary')
    until(lambda: state(page, "s.cart[0].code") == "E11.9", "設主沒作用")


def case_cart_fav(page, pip):
    seed(page, pip)
    pip.click('#cart li[data-code="I10"] .cart-fav')
    until(lambda: state(page, "s.favs.includes('I10')"), "★ 沒加入最愛")


def case_cart_remove(page, pip):
    seed(page, pip)
    pip.click('#cart li[data-code="I10"] .cart-remove')
    until(lambda: state(page, "s.cart.length") == 1, "移除沒作用")


def case_notice_undo(page, pip):
    seed(page, pip)
    pip.click('#cart li[data-code="I10"] .cart-remove')
    until(lambda: state(page, "s.cart.length") == 1, "移除沒作用")
    pip.click("#notice-undo")
    until(lambda: state(page, "s.cart.length") == 2, "復原沒作用")


def case_clear_cart(page, pip):
    seed(page, pip)
    pip.click("#clear-cart")
    until(lambda: state(page, "s.cart.length") == 0, "清空沒作用")


def case_cart_toggle(page, pip):
    pip.click("#cart-toggle")
    until(lambda: state(page, "s.cartOpen") is False, "清單摺疊鈕沒作用")


def case_clipboard_sync(page, pip):
    seed(page, pip)
    # 1c 同步成功時這顆鈕藏起來（dock.css 的 .clip-sync:not(.is-stale)）；
    # 先複製別的東西，剪貼簿不再是清單，它才會以「日期・重送」出現
    n = copies(pip)
    pip.click("#copy-date")
    copied(pip, n)
    until(lambda: pip.locator("#clipboard-sync").is_visible(), "同步狀態沒出現")
    n = copies(pip)
    pip.click("#clipboard-sync")
    copied(pip, n, "E11.9")


def case_alt_arrow_reorder(page, pip):
    seed(page, pip)
    pip.locator('#cart li[data-code="E11.9"]').focus()
    pip.keyboard.press("Alt+ArrowUp")
    until(lambda: state(page, "s.cart[0].code") == "E11.9", "Alt+↑ 沒換序")


def case_search_input(page, pip):
    pip.fill("#search", "cellulitis")
    until(lambda: state(page, "s.query") == "cellulitis", "打字沒送出查詢")


def case_search_arrow(page, pip):
    pip.fill("#search", "cellulitis")
    until(lambda: pip.locator("#search-results .chip:not(.cat)").count() > 1, "沒有搜尋結果")
    pip.keyboard.press("ArrowDown")
    until(lambda: pip.locator('#search-results [data-search-active="true"]').count() == 1
          and pip.locator("#search-results .chip:not(.cat)").nth(1).get_attribute("data-search-active") == "true",
          "方向鍵沒移動選取")


def case_search_enter(page, pip):
    pip.fill("#search", "cellulitis")
    until(lambda: pip.locator("#search-results .chip:not(.cat)").count() > 0, "沒有搜尋結果")
    pip.press("#search", "Enter")
    until(lambda: state(page, "s.cart.length") == 1, "Enter 沒加入第一筆")


def case_search_escape(page, pip):
    pip.fill("#search", "cellulitis")
    until(lambda: state(page, "s.query") == "cellulitis", "打字沒送出查詢")
    pip.press("#search", "Escape")
    until(lambda: state(page, "s.query") == "" and pip.input_value("#search") == "", "Esc 沒清掉搜尋")


def case_search_back(page, pip):
    pip.fill("#search", "cellulitis")
    until(lambda: state(page, "s.query") == "cellulitis", "打字沒送出查詢")
    pip.click(".search-back")
    until(lambda: state(page, "s.query") == "", "返回鈕沒清掉搜尋")


def case_slash_focuses_search(page, pip):
    pip.locator("#settings-toggle").focus()
    pip.keyboard.press("/")
    until(lambda: pip.evaluate("() => document.activeElement && document.activeElement.id") == "search",
          "/ 沒把焦點移到搜尋框")


def case_settings_toggle(page, pip):
    pip.click("#settings-toggle")
    until(lambda: state(page, "s.settingsOpen") is True, "設定鈕沒開啟")


def case_settings_outside_click(page, pip):
    open_settings(pip)
    pip.evaluate("() => document.getElementById('dock-panels').click()")
    until(lambda: state(page, "s.settingsOpen") is False, "點設定以外沒關閉")


def case_settings_escape(page, pip):
    open_settings(pip)
    pip.keyboard.press("Escape")
    until(lambda: state(page, "s.settingsOpen") is False, "Esc 沒關閉設定")


def case_theme_toggle(page, pip):
    open_settings(pip)
    pip.click("#theme-toggle")
    until(lambda: state(page, "s.theme") == "dark", "主題鈕沒切換")


def case_seg_format(page, pip):
    open_settings(pip)
    pip.click('#seg-format [data-format="comma"]')
    until(lambda: state(page, "s.format") == "comma", "複製格式沒切換")


def case_reset_panes(page, pip):
    page.evaluate("() => window.ICDApp.store.setPaneSize('dock', 'regions', 120)")
    open_settings(pip)
    pip.click("#reset-panes")
    until(lambda: "高度" in status_text(pip), "回復高度沒有播報")


def case_copy_date(page, pip):
    n = copies(pip)
    pip.click("#copy-date")
    copied(pip, n)


def case_chronic_entry(page, pip):
    pip.click("#chronic-btn")
    until(lambda: state(page, "s.chronicTopic") is not None, "健保規範條文沒開")


def case_chronic_tab(page, pip):
    pip.click("#chronic-btn")
    until(lambda: state(page, "s.chronicTopic") is not None, "健保規範條文沒開")
    tabs = pip.locator("#chronic-tabs [data-chronic]")
    target = tabs.nth(tabs.count() - 1).get_attribute("data-chronic")
    pip.click(f'#chronic-tabs [data-chronic="{target}"]')
    until(lambda: state(page, "s.chronicTopic") == target, "條文分頁沒切換")


def case_chronic_close(page, pip):
    pip.click("#chronic-btn")
    until(lambda: state(page, "s.chronicTopic") is not None, "健保規範條文沒開")
    pip.click("#chronic-close")
    until(lambda: state(page, "s.chronicTopic") is None, "條文關閉鈕沒作用")


def case_chronic_escape(page, pip):
    pip.click("#chronic-btn")
    until(lambda: state(page, "s.chronicTopic") is not None, "健保規範條文沒開")
    pip.keyboard.press("Escape")
    until(lambda: state(page, "s.chronicTopic") is None, "Esc 沒關閉條文")


def ccr_ready(page, pip):
    pip.click("#ccr-btn")
    until(lambda: state(page, "s.ccrOpen") is True, "CCr 沒開")


def case_ccr_entry(page, pip):
    ccr_ready(page, pip)


def case_ccr_sex(page, pip):
    ccr_ready(page, pip)
    pip.click('.ccr-sex-btn[data-ccr-sex="female"]')
    expect(pip.locator('.ccr-sex-btn[data-ccr-sex="female"]')).to_have_attribute("aria-pressed", "true")


def case_ccr_input(page, pip):
    ccr_ready(page, pip)
    for sel, v in (("#ccr-age", "60"), ("#ccr-weight", "70"), ("#ccr-cr", "1.0")):
        pip.fill(sel, v)
    expect(pip.locator(".ccr-value")).to_have_text("77.8")


def case_ccr_copy(page, pip):
    case_ccr_input(page, pip)
    n = copies(pip)
    pip.click("#ccr-copy")
    copied(pip, n, "77.8")


def case_ccr_reset(page, pip):
    case_ccr_input(page, pip)
    pip.click("#ccr-reset")
    until(lambda: pip.input_value("#ccr-age") == "", "CCr 重設沒清空")


def case_ccr_close(page, pip):
    ccr_ready(page, pip)
    pip.click("#ccr-close")
    until(lambda: state(page, "s.ccrOpen") is False, "CCr 關閉鈕沒作用")


def case_ccr_escape(page, pip):
    ccr_ready(page, pip)
    pip.keyboard.press("Escape")
    until(lambda: state(page, "s.ccrOpen") is False, "Esc 沒關閉 CCr")


def lipid_ready(page, pip):
    pip.click("#lipid-btn")
    until(lambda: state(page, "s.lipidOpen") is True, "血脂試算沒開")


def case_lipid_entry(page, pip):
    lipid_ready(page, pip)


def case_lipid_sex(page, pip):
    lipid_ready(page, pip)
    pip.click('.lipid-sex-btn[data-lipid-sex="female"]')
    expect(pip.locator('[data-lipid-row="menopause"]')).to_be_visible()


def case_lipid_input(page, pip):
    lipid_ready(page, pip)
    pip.fill("#lipid-ldl", "120")
    pip.fill("#lipid-tc", "200")
    until(lambda: "LDL-C 120" in pip.locator("#lipid-result").inner_text(), "數值輸入沒觸發重算")


def case_lipid_checkbox(page, pip):
    case_lipid_input(page, pip)
    pip.check("#lipid-cad")
    pip.check("#lipid-miWithin1y")
    until(lambda: "極高風險" in pip.locator("#lipid-result").inner_text(), "勾選沒觸發重算")


def case_lipid_copy(page, pip):
    case_lipid_input(page, pip)
    n = copies(pip)
    pip.click("#lipid-copy")
    copied(pip, n, "LDL")


def case_lipid_reset(page, pip):
    case_lipid_input(page, pip)
    pip.click("#lipid-reset")
    until(lambda: pip.input_value("#lipid-ldl") == "", "血脂重設沒清空")


def case_lipid_close(page, pip):
    lipid_ready(page, pip)
    pip.click("#lipid-close")
    until(lambda: state(page, "s.lipidOpen") is False, "血脂關閉鈕沒作用")


def case_lipid_escape(page, pip):
    lipid_ready(page, pip)
    pip.keyboard.press("Escape")
    until(lambda: state(page, "s.lipidOpen") is False, "Esc 沒關閉血脂試算")


CASES = {name[5:]: fn for name, fn in globals().items() if name.startswith("case_")}


@pytest.mark.parametrize("name", sorted(CASES))
def test_every_delegated_control_works_inside_pip(pinned, name):
    page, pip = pinned
    reset(page, pip)
    CASES[name](page, pip)


def test_pip_case_list_covers_the_main_delegate():
    """主委派（interactions.js 的 click 委派）認得的 selector，這一檔都要有對應的案例。

    不是逐字對照，是防「主委派加了一條、這裡忘了補」：抽出主委派裡 closest('…') 與
    btn.id === '…' 的字串，扣掉 1c 沒有或另有測試的那幾條，剩下的每一條都要出現在本檔。"""
    import re
    src = (ROOT / "src" / "interactions.js").read_text(encoding="utf-8")
    body = src[src.index("function bindDocument") if "function bindDocument" in src else src.index("function wire"):]
    sels = set(re.findall(r"closest\('([^']+)'\)", body)) | set(re.findall(r"btn\.id === '([\w-]+)'", body))
    not_in_dock = {
        ".quick-toggle", ".panel-index-item", "shelf-toggle",   # 1a／1b 才有
        "cart-toggle",                                         # 本檔以 #cart-toggle 涵蓋
        "fallback-close", "db-retry",                          # 另有測試／只在載入失敗時出現
        "[data-layout-go]",                                    # 會關掉小視窗，另有測試
        "button", "#settings-popover", "#settings-toggle",     # 泛用守門
        "#cart li[data-code]", "li[data-code]", "li", "b.cart-code",
        ".seg-btn",                                            # 由 #seg-format 那條涵蓋
    }
    me = Path(__file__).read_text(encoding="utf-8")
    missing = []
    for sel in sorted(sels - not_in_dock):
        probe = sel if sel.startswith(("#", ".", "[", "b.")) else "#" + sel
        key = probe.split(" ")[-1].split("[")[0] if not probe.startswith("[") else probe
        if key not in me:
            missing.append(sel)
    assert not missing, f"主委派認得但本檔沒有案例的控制項：{missing}"
