"""E2E（1a 桌機工作台）：對 dist/icd10.html 實跑主要使用流程。先跑 build/build.py。

DOM 契約見 .review/design-ref/impl-plan.md §4。1c 側掛窄欄與 1b 手機的測試由後續階段
放在各自的檔案（tests/e2e_dock_test.py／e2e_mobile_test.py），本檔只涵蓋 wide 版面。
"""
import datetime
import http.server, json, threading
from functools import partial
from pathlib import Path
import pytest
from playwright.sync_api import sync_playwright, expect

import chronic_fixtures as cf

ROOT = Path(__file__).resolve().parent.parent
CURATED_DIR = ROOT / "src" / "curated"
PORT = 18493
WIDE = {"width": 1440, "height": 900}


def region_for_panel(filename, panel_name):
    """從 curated JSON 動態找出含有該面板的部位群組名稱。

    部位分群屬於內容、會隨改版調整，測試若寫死群組名稱會在下次重整時又變成假紅燈；
    改成即時查表，面板搬到哪一群都不必動測試。
    """
    groups = json.loads((CURATED_DIR / filename).read_text(encoding="utf-8"))
    for region in groups:
        if any(p["name"] == panel_name for p in region["panels"]):
            return region["name"]
    raise AssertionError(f"{filename} 找不到面板「{panel_name}」")


def panel_disease_count(filename, panel_name):
    """該面板 diseases 的應有筆數，即時從 curated JSON 取。

    診斷涵蓋度會隨臨床內容擴充而變，測試寫死數字只會在下次擴充時變成假紅燈。
    """
    groups = json.loads((CURATED_DIR / filename).read_text(encoding="utf-8"))
    for region in groups:
        for panel in region["panels"]:
            if panel["name"] == panel_name:
                return len(panel.get("diseases") or [])
    raise AssertionError(f"{filename} 找不到面板「{panel_name}」")


@pytest.fixture(scope="module")
def page_url():
    handler = partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT / "dist"))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    yield f"http://127.0.0.1:{PORT}/icd10.html"
    srv.shutdown()


@pytest.fixture(scope="module")
def browser_ctx(page_url):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport=dict(WIDE), permissions=["clipboard-read", "clipboard-write"])
        yield ctx
        browser.close()


@pytest.fixture(scope="module")
def page(browser_ctx, page_url):
    """主測試頁：1440 寬、全庫索引已就緒。

    全庫改成延遲載入後，「類目碼不可加入」等測試若在 index 未就緒時跑，測到的是建置期
    白名單而不是葉碼防呆（impl-plan R-4），所以這裡先把全庫拉起來再交給測試。
    """
    pg = browser_ctx.new_page()
    pg.goto(page_url)
    pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
    pg.evaluate("() => window.ICDApp.data.ensureDb()")
    pg.wait_for_selector('body[data-db="ready"]', timeout=30000)
    yield pg
    pg.close()


@pytest.fixture
def fresh_page(browser_ctx, page_url):
    """每個測試自己一份、剛開機（全庫尚未載入）的頁面，且 localStorage 是乾淨的。

    清儲存不能用 add_init_script：那是「每次導覽都會跑」，測持久化的測試一 reload
    就把剛寫進去的 favs／layout 洗掉。改成先開一頁把同源的儲存清乾淨再關掉。
    （另注意 add_init_script 收的是指令碼本體，不是函式運算式——傳 `() => {…}`
    只會建出一個沒人呼叫的箭頭函式而靜默失效。）
    """
    scrub = browser_ctx.new_page()
    scrub.goto(page_url)
    scrub.evaluate("() => { try { localStorage.clear(); } catch (e) {} }")
    scrub.close()
    pg = browser_ctx.new_page()
    yield pg
    pg.close()


# ---- 共用操作 ----
def reset(pg):
    """回到乾淨起點：空清單、門診模式、無搜尋、無最愛／最近、全部收合。

    favs／recent 會寫進 localStorage 而跨測試殘留（常用列上的 chip 會變成 DOM 中
    第一個 .chip[data-code=X]），所以一併清掉，讓每條測試的定位子都是確定的。
    """
    pg.evaluate("""() => {
        const s = window.ICDApp.store;
        s.clearCart();
        s.setMode('outpatient');
        s.setRegion(0);          // 取消選取（region=null）會跨模式保留，這裡明確歸位
        s.setQuery('');
        s.setSettingsOpen(false);
        s.setChronicTopic(null); // 慢病速查浮層蓋住整個工作區；殘留會讓後面所有點擊被它攔截
        s.resetPaneSizes();      // 窗格高度也會寫 localStorage，殘留會讓其他測試量到別條測試拖出來的高度
        s.setState({ favs: [], recent: [], expanded: {}, quickOpen: {}, copied: false });
    }""")
    pg.fill("#search", "")


def open_settings(pg):
    if pg.locator("#settings-popover").is_hidden():
        pg.click("#settings-toggle")
    pg.wait_for_selector("#settings-popover:not([hidden])")


MODE_OF_BUTTON_ID = {"mode-op": "outpatient", "mode-er": "emergency", "mode-surg": "surg"}


def set_mode(pg, button_id):
    """看診模式已從設定 popover 移除，只剩 header 的三顆鈕。

    參數仍收舊的 button_id，呼叫端一個都不用改；對照表集中在這裡。
    """
    mode = MODE_OF_BUTTON_ID[button_id]
    pg.click(f'#mode-switch [data-mode="{mode}"]')
    expect(pg.locator(f'#mode-switch [data-mode="{mode}"]')).to_have_attribute("aria-pressed", "true")


def ensure_expanded(toggle):
    if toggle.get_attribute("aria-expanded") != "true":
        toggle.click()
    expect(toggle).to_have_attribute("aria-expanded", "true")


def quick_chip(pg, group, code):
    """快選分組預設收合（設計 L158-167），要先展開才點得到。"""
    ensure_expanded(pg.locator(f'.quick-group[data-quick="{group}"] .quick-toggle'))
    return pg.locator(f'.quick-group[data-quick="{group}"] .chip[data-code="{code}"]')


def panel_card(pg, panel_name):
    return pg.locator(f'.symptom-card[data-panel="{panel_name}"]')


def search(pg, text):
    pg.fill("#search", text)
    pg.wait_for_timeout(300)      # 150ms debounce ＋ 重繪


def mark_ms(pg, name):
    return pg.evaluate(
        "(name) => { const [m] = performance.getEntriesByName(name); return m ? m.startTime : null; }",
        name,
    )


def _luminance(rgb):
    def channel(v):
        v /= 255.0
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (channel(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _parse_rgb(value):
    nums = [float(x) for x in value.replace("rgba(", "").replace("rgb(", "").rstrip(")").replace("/", ",").split(",")[:3]]
    return tuple(nums)


def contrast(pg, selector):
    """回傳該元素前景／背景的 WCAG 對比度。背景透明時往上找第一個不透明祖先。"""
    pair = pg.eval_on_selector(
        selector,
        """(el) => {
            const fg = getComputedStyle(el).color;
            let node = el, bg = 'rgba(0, 0, 0, 0)';
            while (node) {
                const c = getComputedStyle(node).backgroundColor;
                if (c && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(c)) { bg = c; break; }
                node = node.parentElement;
            }
            return [fg, bg];
        }""",
    )
    l1, l2 = _luminance(_parse_rgb(pair[0])), _luminance(_parse_rgb(pair[1]))
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


# ══════════════════════════════════════════════════════════════════════════
# A. 沿用（選擇器不變或只需前置操作）
# ══════════════════════════════════════════════════════════════════════════
def test_load_and_db_note(page):
    """原 test_load_and_status：#status 改成 sr-only live region、筆數移到設定裡的 #db-note。

    數字讀 window.ICD_META.rowCount 而非寫死字串（impl-plan R-11）。
    """
    reset(page)
    open_settings(page)
    expect(page.locator("#db-note")).to_contain_text("96,802")
    page.keyboard.press("Escape")
    expect(page.locator("#settings-popover")).to_be_hidden()


def test_load_performance(fresh_page, page_url):
    """原本單一 icd-ready 指標拆成兩個：開機殼層與全庫索引分開量。"""
    fresh_page.goto(page_url)
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)
    shell = mark_ms(fresh_page, "icd-shell-ready")
    assert shell is not None, "找不到 icd-shell-ready 效能標記"
    assert shell < 1000, f"開機至可互動花了 {shell:.0f}ms"
    fresh_page.evaluate("() => window.ICDApp.data.ensureDb()")
    fresh_page.wait_for_selector('body[data-db="ready"]', timeout=30000)
    db = mark_ms(fresh_page, "icd-db-ready")
    assert db is not None, "找不到 icd-db-ready 效能標記"
    assert db - shell < 2500, f"全庫索引就緒比殼層晚了 {db - shell:.0f}ms"


def test_file_url_loads(browser_ctx):
    """file:// 直接開檔（真實使用方式）也要能啟動並載入全庫。"""
    pg = browser_ctx.new_page()
    try:
        pg.goto((ROOT / "dist" / "icd10.html").resolve().as_uri())
        pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
        assert mark_ms(pg, "icd-shell-ready") is not None
        pg.evaluate("() => window.ICDApp.data.ensureDb()")
        pg.wait_for_selector('body[data-db="ready"]', timeout=30000)
        open_settings(pg)
        expect(pg.locator("#db-note")).to_contain_text("96,802")
    finally:
        pg.close()


def test_search_english_chinese_code(page):
    reset(page)
    search(page, "cellulitis")
    # 不斷言「第一筆」：人工精選碼會被優先排到最前面，新增哪個精選碼排第一屬於內容決策。
    expect(page.locator('#search-results .chip[data-code^="L03"]').first).to_be_visible(timeout=2000)
    search(page, "蜂窩")
    expect(page.locator("#search-results .chip").first).to_contain_text("蜂窩", timeout=2000)
    search(page, "E119")
    expect(page.locator("#search-results .chip").first).to_contain_text("E11.9", timeout=2000)


def test_category_code_not_addable(page):
    reset(page)
    search(page, "E11")
    page.wait_for_selector("#search-results .chip.cat")
    cat = page.locator("#search-results .chip.cat").first
    expect(cat).to_have_attribute("aria-disabled", "true")
    expect(cat).to_have_attribute("data-leaf", "0")
    # 類目碼用 aria-disabled 而非 disabled（真實使用者點得下去，只是不該有作用），
    # Playwright 的可操作性檢查會把 aria-disabled 當成 disabled，所以要 force 才點得到。
    cat.click(force=True)
    page.wait_for_timeout(100)
    assert page.locator("#cart li").count() == 0, "類目碼被加進清單"


def inject_probe_chips(pg, codes):
    """注入「沒有 .cat class」的可點 chip，繞過 UI 層防線直接走事件委派進 addCode()。

    UI 正常渲染時會替非葉碼加上 .cat（委派處理器據此擋掉），所以 store 的 canAdd →
    data.isAddable() 那條防線在正常操作下永遠走不到。這裡刻意製造「防線被繞過」的情境。
    """
    pg.evaluate(
        """(codes) => {
            document.getElementById('probe-chips')?.remove();
            const box = document.createElement('div');
            box.id = 'probe-chips';
            box.style.cssText = 'position:fixed;left:4px;bottom:4px;z-index:999999;background:#fff';
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
    """葉碼防呆必須真的擋住，不能是死碼。全庫就緒後才跑（否則測到的是白名單，見 R-4）。"""
    reset(page)
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    try:
        # 陽性對照：注入的葉碼 chip 必須真的進得了清單 → 證明事件委派確實抵達 addCode
        inject_probe_chips(page, ["E11.9"])
        page.click('#probe-chips .chip[data-code="E11.9"]')
        expect(page.locator('#cart li[data-code="E11.9"]')).to_have_count(1)
        page.click("#clear-cart")
        expect(page.locator("#cart li")).to_have_count(0)

        probes = ["E11", "A00", "K11", "ZZZ99"]
        inject_probe_chips(page, probes)
        for code in probes:
            page.click(f'#probe-chips .chip[data-code="{code}"]')
            expect(page.locator(f'#cart li[data-code="{code}"]')).to_have_count(0)
        assert page.locator("#cart li").count() == 0, "類目碼／不存在代碼被加進就診清單（葉碼防呆失效）"
        assert not errors, f"addCode() 對非葉碼/不存在代碼拋出未捕捉例外: {errors}"
    finally:
        page.evaluate("() => document.getElementById('probe-chips')?.remove()")
        reset(page)


def test_quick_add_and_related(page):
    reset(page)
    quick_chip(page, "感染科常用", "N39.0").click()
    expect(page.locator('#cart li[data-code="N39.0"]')).to_have_count(1)
    # 人工關聯：病原碼；家族碼：N39 類目
    expect(page.locator('#related .chip[data-code="B96.20"]')).to_have_count(1)
    page.locator('#related .chip[data-code="B96.20"]').click()
    expect(page.locator('#cart li[data-code="B96.20"]')).to_have_count(1)


def test_duplicate_not_added(page):
    reset(page)
    chip = quick_chip(page, "常用慢性病", "I10")
    chip.click()
    chip.click()
    expect(page.locator("#cart li")).to_have_count(1)


def test_symptom_shows_related_diagnoses_without_auto_adding(page):
    reset(page)
    set_mode(page, "mode-er")
    page.click('.region-btn[data-region="胸肺／心臟"]')
    card = panel_card(page, "胸痛／心悸")
    expect(card.locator(".chief-group .chip[data-code='R07.9']")).to_have_count(1)
    card.locator(".chief-group .chip[data-code='R07.9']").click()
    expect(page.locator("#cart li[data-code='R07.9']")).to_have_count(1)
    expect(page.locator("#related .chip[data-code='I20.9']")).to_have_count(1)
    expect(page.locator("#cart li[data-code='I20.9']")).to_have_count(0)
    expect(card.locator(".redflag-group")).to_be_visible()


def test_symptom_shows_multiple_related_diseases_without_auto_adding(page):
    """常見疾病改為預設收合（設計 L149），先展開再驗筆數。

    筆數不寫死：診斷涵蓋度會隨臨床內容擴充而變（這正是面板存在的目的），
    寫死數字只會在下次擴充時又變成假紅燈。改成即時從 curated JSON 取應有筆數。
    """
    reset(page)
    panel_name = "咳嗽／感冒"
    expected = panel_disease_count("internal_outpatient.json", panel_name)
    page.click(f'.region-btn[data-region="{region_for_panel("internal_outpatient.json", panel_name)}"]')
    card = panel_card(page, panel_name)
    toggle = card.locator(".panel-toggle")
    expect(toggle).to_contain_text(f"常見疾病 {expected}")
    expect(card.locator(".disease-group")).to_be_hidden()
    ensure_expanded(toggle)
    expect(card.locator(".disease-group .chip")).to_have_count(expected)
    card.locator(".chief-group .chip[data-code='R05.9']").click()
    for code in ("J00", "J06.9", "J20.9", "J18.9"):
        expect(page.locator(f"#related .chip[data-code='{code}']")).to_have_count(1)
        expect(page.locator(f"#cart li[data-code='{code}']")).to_have_count(0)


def test_related_recallable_for_code_already_in_cart(page):
    """已在清單的碼再次點擊，相關碼面板要回到該碼的建議（否則多診斷動線斷掉）。"""
    reset(page)
    page.click(f'.region-btn[data-region="{region_for_panel("internal_outpatient.json", "頭痛")}"]')
    page.click('#panels .chip[data-code="R51.9"]')
    expect(page.locator('#related .chip[data-code="G43.909"]')).to_have_count(1)
    page.click('#related .chip[data-code="I10"]')
    expect(page.locator('#cart li[data-code="I10"]')).to_have_count(1)
    expect(page.locator('#related .chip[data-code="G43.909"]')).to_have_count(0)
    page.click('#panels .chip[data-code="R51.9"]')
    expect(page.locator("#cart li")).to_have_count(2)
    expect(page.locator('#related .chip[data-code="G43.909"]')).to_have_count(1)


def test_red_flags_do_not_leak_into_outpatient_related(page):
    """臨床安全：紅旗碼只屬於急診，門診相關碼不得出現。"""
    reset(page)
    page.click(f'.region-btn[data-region="{region_for_panel("internal_outpatient.json", "頭痛")}"]')
    page.click('#panels .chip[data-code="R51.9"]')
    expect(page.locator('#related .chip[data-code="G43.909"]')).to_have_count(1)
    expect(page.locator('#related .chip[data-code="G03.9"]')).to_have_count(0)
    expect(page.locator('#related .chip[data-code="I60.9"]')).to_have_count(0)
    # 門診模式的面板本身也不得渲染出紅旗盒
    expect(page.locator("#panels .redflag-group")).to_have_count(0)
    reset(page)
    set_mode(page, "mode-er")
    page.click(f'.region-btn[data-region="{region_for_panel("internal_emergency.json", "頭痛")}"]')
    page.click('#panels .chip[data-code="R51.9"]')
    expect(page.locator('#related .chip[data-code="G03.9"]')).to_have_count(1)
    expect(page.locator('#related .chip[data-code="I60.9"]')).to_have_count(1)


def test_mode_switch_resets_related(page):
    """切模式後相關碼區回到初始提示，但清單跨模式保留。"""
    reset(page)
    quick_chip(page, "常用慢性病", "I10").click()
    expect(page.locator("#related .chip").first).to_be_visible()
    set_mode(page, "mode-surg")
    expect(page.locator("#related .chip")).to_have_count(0)
    expect(page.locator(".related-empty")).to_contain_text("加入代碼後")
    expect(page.locator('#cart li[data-code="I10"]')).to_have_count(1)


def test_remove_from_cart_recomputes_related(page):
    """從清單移除後相關碼重算，被移除的碼回到建議。"""
    reset(page)
    page.click(f'.region-btn[data-region="{region_for_panel("internal_outpatient.json", "頭痛")}"]')
    page.click('#panels .chip[data-code="R51.9"]')
    page.click('#related .chip[data-code="I10"]')
    page.click('#panels .chip[data-code="R51.9"]')
    expect(page.locator('#related .chip[data-code="I10"]')).to_have_count(0)
    page.locator('#cart li[data-code="I10"] .cart-remove').click()
    expect(page.locator('#related .chip[data-code="I10"]')).to_have_count(1)


def test_remove_and_clear(page):
    reset(page)
    quick_chip(page, "常用慢性病", "I10").click()
    quick_chip(page, "常用慢性病", "E11.9").click()
    page.locator('#cart li[data-code="I10"] .cart-remove').click()
    expect(page.locator("#cart li")).to_have_count(1)
    page.click("#clear-cart")
    expect(page.locator("#cart li")).to_have_count(0)


def test_reload_clears_cart(page, page_url):
    quick_chip(page, "常用慢性病", "I10").click()
    page.reload()
    page.wait_for_selector('body[data-ready="1"]')
    expect(page.locator("#cart li")).to_have_count(0)
    page.evaluate("() => window.ICDApp.data.ensureDb()")
    page.wait_for_selector('body[data-db="ready"]', timeout=30000)


def test_cart_single_code_copy(page):
    """單碼複製（控制者裁示 C6：保留）。"""
    reset(page)
    quick_chip(page, "常用慢性病", "I10").click()
    page.locator('#cart li[data-code="I10"] b.cart-code').click()
    text = page.evaluate("navigator.clipboard.readText()").replace("\r\n", "\n")
    assert text == "I10"


# ══════════════════════════════════════════════════════════════════════════
# B. 重寫（行為在新設計已改變）
# ══════════════════════════════════════════════════════════════════════════
def test_mode_switch(page):
    """三顆模式鈕在 header（設定裡那份已移除）；外科不再隱藏部位導覽，改用 rail 顯示「情境」。"""
    reset(page)
    open_settings(page)
    assert page.locator("#seg-mode").count() == 0, "設定面板不該再有看診模式 segmented"
    page.keyboard.press("Escape")
    expect(page.locator("#panels-title")).to_contain_text("內科門診")
    expect(page.locator('#mode-switch [data-mode="outpatient"]')).to_have_attribute("aria-pressed", "true")
    expect(page.locator("#region-rail-title")).to_have_text("身體部位")
    outpatient_regions = json.loads((CURATED_DIR / "internal_outpatient.json").read_text(encoding="utf-8"))
    expect(page.locator(".region-btn")).to_have_count(len(outpatient_regions))

    set_mode(page, "mode-er")
    assert page.get_attribute("body", "data-mode") == "emergency"
    expect(page.locator("#panels-title")).to_contain_text("內科急診")
    emergency_regions = json.loads((CURATED_DIR / "internal_emergency.json").read_text(encoding="utf-8"))
    expect(page.locator(".region-btn")).to_have_count(len(emergency_regions))
    expect(page.locator(".redflag-group").first).to_be_visible()

    set_mode(page, "mode-surg")
    assert page.get_attribute("body", "data-mode") == "surg"
    expect(page.locator("#panels-title")).to_contain_text("外科")
    expect(page.locator("#region-rail-title")).to_have_text("情境")
    surgical = json.loads((CURATED_DIR / "surgical_panels.json").read_text(encoding="utf-8"))
    expect(page.locator(".region-btn")).to_have_count(len(surgical))
    expect(quick_chip(page, "外科常用", "Z48.02")).to_have_count(1)

    set_mode(page, "mode-op")
    expect(page.locator("#panels-title")).to_contain_text("內科門診")


def test_mode_buttons_switch_mode(page):
    """header 的三顆模式鈕直接並排，一次點擊就切換（使用者原話：「我不要點擊下拉
    我希望三個按鈕並排」）。設定 popover 裡原有的 segmented 保留，兩處狀態同源。

    三套版面同一份行為（1c 在 test_e2e_dock.py、1b 在 test_e2e_mobile.py）。
    """
    reset(page)
    switch = page.locator("#mode-switch")
    btns = switch.locator("[data-mode]")
    expect(btns).to_have_count(3)
    # 沒有任何展開動作：三顆鈕一開始就全部看得見、點得到
    for label in ("內科門診", "內科急診", "外科"):
        expect(switch.locator(f'[data-mode]:text-is("{label}")')).to_be_visible()
    expect(switch.locator('[data-mode="outpatient"]')).to_have_attribute("aria-pressed", "true")
    assert page.locator("#mode-menu").count() == 0, "已改成三鈕並排，不得再有展開的選單"

    # 一次點擊即切換（不必先展開任何東西）
    switch.locator('[data-mode="emergency"]').click()
    assert page.get_attribute("body", "data-mode") == "emergency"
    expect(switch.locator('[data-mode="emergency"]')).to_have_attribute("aria-pressed", "true")
    expect(switch.locator('[data-mode="outpatient"]')).to_have_attribute("aria-pressed", "false")
    expect(page.locator("#panels-title")).to_contain_text("內科急診")
    # 選中狀態不只靠屬性選擇器（C1-2）：class 也要掛上
    assert "is-on" in switch.locator('[data-mode="emergency"]').get_attribute("class")

    switch.locator('[data-mode="surg"]').click()
    assert page.get_attribute("body", "data-mode") == "surg"
    expect(page.locator("#panels-title")).to_contain_text("外科")

    # 設定面板不再有第二份模式選單（只剩 header 這一條動線）
    open_settings(page)
    assert page.locator("#seg-mode").count() == 0
    page.keyboard.press("Escape")

    set_mode(page, "mode-op")
    expect(switch.locator('[data-mode="outpatient"]')).to_have_attribute("aria-pressed", "true")
    assert page.get_attribute("body", "data-mode") == "outpatient"
    expect(switch.locator('[data-mode="surg"]')).to_have_attribute("aria-pressed", "false")

    # 點目前這個模式不得有副作用（setMode 會清掉 relatedCode ＝ 右欄建議整片消失）
    quick_chip(page, "常用慢性病", "I10").click()
    assert page.evaluate("() => window.ICDApp.store.getState().relatedCode") == "I10"
    switch.locator('[data-mode="outpatient"]').click()
    assert page.evaluate("() => window.ICDApp.store.getState().relatedCode") == "I10", \
        "按下已經選中的模式不得清掉相關碼建議"
    assert page.get_attribute("body", "data-mode") == "outpatient"


def test_panel_expand_and_add(page):
    """外科 accordion 已不存在，改測症狀卡的「常見疾病」摺疊。"""
    reset(page)
    page.click('.region-btn[data-region="胸肺／心臟"]')
    card = panel_card(page, "咳嗽／感冒")
    toggle = card.locator(".panel-toggle")
    expect(toggle).to_have_attribute("aria-expanded", "false")
    expect(card.locator(".disease-group")).to_be_hidden()
    toggle.click()
    expect(toggle).to_have_attribute("aria-expanded", "true")
    chip = card.locator(".disease-group .chip").first
    expect(chip).to_be_visible()
    code = chip.get_attribute("data-code")
    chip.click()
    expect(page.locator(f'#cart li[data-code="{code}"]')).to_have_count(1)
    toggle.click()
    expect(card.locator(".disease-group")).to_be_hidden()


def test_surgical_scenarios_use_rail(page):
    """外科情境改走 rail：切情境會換掉中間欄的卡片內容。"""
    reset(page)
    set_mode(page, "mode-surg")
    surgical = json.loads((CURATED_DIR / "surgical_panels.json").read_text(encoding="utf-8"))
    first, second = surgical[0]["name"], surgical[1]["name"]
    expect(panel_card(page, first)).to_have_count(1)
    expect(panel_card(page, first).locator(".chief-group .chip")).to_have_count(len(surgical[0]["codes"]))
    page.click(f'.region-btn[data-region="{second}"]')
    expect(panel_card(page, first)).to_have_count(0)
    expect(panel_card(page, second).locator(".chief-group .chip")).to_have_count(len(surgical[1]["codes"]))


def test_region_toggle_clears_selection_and_shows_all(page):
    """已選的部位再點一次＝取消選取，改顯示全部部位的面板（不是空白）。

    使用者原話：「我希望已經點選的部位再點一次會回到沒有點選」。取消後要顯示全部，
    是為了讓醫師整片掃過去時不必逐一點選；面板必須看得出屬於哪個部位，否則三十幾張
    卡連在一起會迷失。
    """
    reset(page)
    rail = page.locator(".region-btn")
    region_count = rail.count()
    second = rail.nth(1)
    second.click()
    expect(second).to_have_attribute("aria-pressed", "true")
    one_region_cards = page.locator("#panels .symptom-card").count()
    assert page.locator("#panels .region-heading").count() == 0, "選了部位時不該出現部位標題"

    # 再點同一顆 → 取消選取，沒有任何一個部位是 selected
    second.click()
    expect(second).to_have_attribute("aria-pressed", "false")
    assert page.locator('.region-btn[aria-pressed="true"]').count() == 0, "取消後仍有部位被標為選取"
    assert page.evaluate("() => window.ICDApp.store.getState().region") is None

    total = page.evaluate(
        """() => {
            const d = window.ICDApp.data, mode = window.ICDApp.store.getState().mode;
            return d.regionsFor(mode).reduce((n, r, i) => n + d.panelsFor(mode, i).length, 0);
        }"""
    )
    expect(page.locator("#panels .symptom-card")).to_have_count(total)
    assert total > one_region_cards, f"顯示全部（{total}）沒有比單一部位（{one_region_cards}）多"
    # 每個部位一條標題，順序與 rail 一致
    expect(page.locator("#panels .region-heading")).to_have_count(region_count)
    assert page.locator("#panels .region-heading").first.inner_text() == rail.first.get_attribute("data-region")
    sw, cw = page.evaluate("() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]")
    assert sw <= cw, f"顯示全部時水平溢出：{sw} > {cw}"

    # 點別的部位是換過去、不是取消；標題收起
    rail.nth(0).click()
    expect(rail.nth(0)).to_have_attribute("aria-pressed", "true")
    assert page.locator("#panels .region-heading").count() == 0


def test_no_region_all_button_full_names_kept(page):
    """「全部」鈕已移除（使用者要求）；取消篩選的入口是「再點一次已選的部位」，
    那條路徑由 test_region_toggle_clears_selection_and_shows_all 覆蓋。

    1a 的側欄空間充足，部位鈕維持**全名＋面板數**——兩字短名是 1c／手機的空間妥協，
    在 1440px 下只會讓資訊變少。
    """
    reset(page)
    assert page.locator(".region-all-btn").count() == 0, "「全部」鈕應已移除"

    rail = page.locator(".region-btn")
    outpatient_regions = json.loads((CURATED_DIR / "internal_outpatient.json").read_text(encoding="utf-8"))
    expect(rail).to_have_count(len(outpatient_regions))

    names = [r["name"] for r in outpatient_regions]
    shown = [rail.nth(i).locator("span").first.inner_text().strip() for i in range(rail.count())]
    assert shown == names, f"1a 的部位鈕應顯示全名：{shown}"

    sw, cw = page.evaluate("() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]")
    assert sw <= cw, f"部位列水平溢出：{sw} > {cw}"


def test_copy_formats(page):
    """複製鈕已移除：設定裡選格式，清單一變就自動同步；字串仍由 logic.formatCart 決定。"""
    reset(page)
    quick_chip(page, "常用慢性病", "I10").click()
    quick_chip(page, "常用慢性病", "E11.9").click()

    def copy_with(fmt):
        # 沒有複製鈕了：換格式當下就自動同步到剪貼簿
        open_settings(page)
        page.click(f'#seg-format button[data-format="{fmt}"]')
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)
        # Windows 剪貼簿會把 \n 正規化成 \r\n（OS/瀏覽器行為），比對前先還原
        return page.evaluate("navigator.clipboard.readText()").replace("\r\n", "\n")

    assert copy_with("lines") == "I10\nE11.9"
    assert copy_with("comma") == "I10,E11.9"
    names = copy_with("names")
    assert names.startswith("I10\t") and "E11.9\t" in names
    open_settings(page)
    page.click('#seg-format button[data-format="lines"]')
    page.keyboard.press("Escape")


def test_high_hit_search_shows_total_hint(page):
    """命中數超過顯示上限要提示總筆數；上限由 50 統一為 24（impl-plan R-11）。"""
    reset(page)
    search(page, "骨折")
    expect(page.locator(".result-note")).to_contain_text("全庫命中")
    expect(page.locator(".result-note")).to_contain_text("顯示前 24 筆")
    expect(page.locator("#search-results .chip")).to_have_count(24)


@pytest.mark.parametrize("width", [900, 1024, 1280, 1440])
def test_no_horizontal_overflow(page, width):
    """wide 版面涵蓋的寬度都不得水平溢出（三個模式都要）。

    原本的 390／768 兩案落在 mobile 斷點（<900），移到 1b 的測試檔；這裡改成 wide
    的四個代表寬度，含 1239px 以下「rail 降成頂部 pill 列」那一段。
    """
    reset(page)
    page.set_viewport_size({"width": width, "height": 900})
    try:
        for button in ("mode-er", "mode-op", "mode-surg"):
            set_mode(page, button)
            sw, cw = page.evaluate(
                "() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]"
            )
            assert sw <= cw, f"{width}px {button} 水平溢出：scrollWidth={sw} > clientWidth={cw}"
            assert page.get_attribute("body", "data-layout") == "wide"
    finally:
        page.set_viewport_size(dict(WIDE))
        set_mode(page, "mode-op")


def test_narrow_desktop_keeps_two_columns(page):
    """原 test_mobile_symptom_layout 的桌機等價版：1024px 下 rail 收成 pill 列、
    主體剩兩欄，主訴仍可點且相關碼照常出現。"""
    reset(page)
    page.set_viewport_size({"width": 1024, "height": 900})
    try:
        set_mode(page, "mode-er")
        columns = page.locator(".workbench").evaluate(
            "(el) => getComputedStyle(el).gridTemplateColumns.trim().split(/\\s+/).length"
        )
        assert columns == 2, f"1024px 應為兩欄，實得 {columns} 欄"
        expect(page.locator("#region-rail")).to_be_visible()
        page.click('.region-btn[data-region="胸肺／心臟"]')
        panel_card(page, "胸痛／心悸").locator(".chief-group .chip[data-code='R07.9']").click()
        expect(page.locator("#related .chip[data-code='I20.9']")).to_have_count(1)
    finally:
        page.set_viewport_size(dict(WIDE))


def test_cart_pane_stays_in_view_while_scrolling(page):
    """原 test_mobile_cart_pane_not_sticky 的桌機等價版：中欄捲動時清單／HIS 區不得
    離開視野，也不得被 header 蓋住（工作台的核心前提是「清單即貼上區」）。"""
    reset(page)
    set_mode(page, "mode-er")
    quick_chip(page, "感染科常用", "N39.0").click()
    page.evaluate("() => { document.querySelector('.worksheet').scrollTop = 2000; }")
    page.wait_for_timeout(100)
    overlap = page.evaluate("""() => {
        const h = document.querySelector('.app-header').getBoundingClientRect();
        const c = document.querySelector('#cart-pane').getBoundingClientRect();
        return {
            hidden: c.bottom <= 0 || c.top >= innerHeight,
            overlap: !(c.bottom <= h.top || c.top >= h.bottom),
            hisVisible: document.querySelector('#his-preview').getBoundingClientRect().top < innerHeight,
        };
    }""")
    assert not overlap["hidden"], "捲動後清單欄離開視野"
    assert not overlap["overlap"], "清單欄與 header 重疊"
    assert overlap["hisVisible"], "貼入 HIS 的預覽被推出視野"


def test_primary_copy_button_has_visible_contrast(page):
    """原本只驗「不是白底、前景不等於背景」；改成兩個主題都量實際對比度。"""
    reset(page)
    quick_chip(page, "常用慢性病", "I10").click()
    for theme in ("light", "dark"):
        page.evaluate("(t) => window.ICDApp.store.setTheme(t)", theme)
        styles = page.locator("#copy-date").evaluate(
            "(el) => ({background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color})"
        )
        assert styles["background"] != "rgb(255, 255, 255)"
        assert styles["color"] != styles["background"]
        ratio = contrast(page, "#copy-date")
        assert ratio >= 4.5, f"{theme} 主題下 #copy-date 對比只有 {ratio:.2f}:1"
    page.evaluate("() => window.ICDApp.store.setTheme('light')")


# ══════════════════════════════════════════════════════════════════════════
# C. 新增（新設計帶進來的行為）
# ══════════════════════════════════════════════════════════════════════════
def test_no_external_requests(browser_ctx, page_url):
    """零外部請求是本產品的硬規格：字型與設計系統都必須內嵌。"""
    pg = browser_ctx.new_page()
    urls = []
    pg.on("request", lambda r: urls.append(r.url))
    try:
        pg.goto(page_url)
        pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
        pg.evaluate("() => window.ICDApp.data.ensureDb()")
        pg.wait_for_selector('body[data-db="ready"]', timeout=30000)
        pg.fill("#search", "蜂窩")
        pg.wait_for_timeout(300)
        assert urls == [page_url], f"出現額外的外部請求：{urls}"
        assert pg.evaluate("() => performance.getEntriesByType('resource').length") == 0
    finally:
        pg.close()


def test_no_duplicate_ids(page):
    """契約：同一時刻只掛一套版面，所以 #search／#cart 等 id 必須全域唯一。"""
    reset(page)
    for width in (1024, 1440):
        page.set_viewport_size({"width": width, "height": 900})
        page.wait_for_timeout(250)
        result = page.evaluate("""() => {
            const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
            return { total: ids.length, uniq: new Set(ids).size, dups: ids.filter((v, i) => ids.indexOf(v) !== i) };
        }""")
        assert result["total"] == result["uniq"], f"{width}px 有重複 id：{result['dups']}"
    page.set_viewport_size(dict(WIDE))


def test_db_not_loaded_at_boot(fresh_page, page_url):
    """全庫改成延遲載入：開機時不得已經就緒（否則等於沒有延遲）。"""
    fresh_page.goto(page_url)
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)
    state = fresh_page.evaluate("""() => ({
        db: document.body.dataset.db,
        marked: performance.getEntriesByName('icd-db-ready').length,
    })""")
    assert state["db"] in ("idle", "loading"), f"開機就已 data-db={state['db']}"
    assert state["marked"] == 0
    fresh_page.fill("#search", "發燒")
    fresh_page.wait_for_selector('body[data-db="ready"]', timeout=30000)
    expect(fresh_page.locator("#search-results .chip").first).to_be_visible()


def test_search_falls_back_to_curated_pool(fresh_page, page_url):
    """全庫不可用時仍要能用精選池搜尋、且 chip 有中文（CURATED_LABELS，R-3.3）。"""
    fresh_page.add_init_script("try { delete window.DecompressionStream; } catch (e) {}")
    fresh_page.goto(page_url)
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)
    fresh_page.fill("#search", "發燒")
    fresh_page.wait_for_selector('body[data-db="error"]', timeout=10000)
    fresh_page.wait_for_timeout(300)
    first = fresh_page.locator("#search-results .chip").first
    expect(first).to_be_visible()
    expect(first.locator("span")).not_to_have_text("")
    expect(fresh_page.locator(".result-note")).to_contain_text("全庫載入失敗")
    first.click()
    expect(fresh_page.locator("#cart li")).to_have_count(1)


def test_favourite_toggle_and_persist(fresh_page, page_url):
    """★ 切換後要進常用列，且重整後仍在（favs 持久化）。"""
    fresh_page.goto(page_url)
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)
    quick_chip(fresh_page, "常用慢性病", "I10").click()
    fav = fresh_page.locator('#cart li[data-code="I10"] .cart-fav')
    expect(fav).to_have_attribute("aria-pressed", "false")
    fav.click()
    expect(fav).to_have_attribute("aria-pressed", "true")
    expect(fresh_page.locator('#shelf .shelf-chip.is-fav[data-code="I10"]')).to_have_count(1)
    fresh_page.reload()
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)
    expect(fresh_page.locator("#cart li")).to_have_count(0)          # 清單不跨診次
    expect(fresh_page.locator('#shelf .shelf-chip.is-fav[data-code="I10"]')).to_have_count(1)


def test_recent_list_caps_at_eight(fresh_page, page_url):
    """最近使用上限 8、最新在前、不與最愛重複。"""
    fresh_page.goto(page_url)
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)
    ensure_expanded(fresh_page.locator('.quick-group[data-quick="常用慢性病"] .quick-toggle'))
    codes = fresh_page.eval_on_selector_all(
        '.quick-group[data-quick="常用慢性病"] .chip', "els => els.slice(0, 10).map(e => e.dataset.code)"
    )
    assert len(codes) == 10
    for code in codes:
        fresh_page.click(f'.quick-group[data-quick="常用慢性病"] .chip[data-code="{code}"]')
    shelf = fresh_page.eval_on_selector_all(
        "#shelf .shelf-chip:not(.is-fav)", "els => els.map(e => e.dataset.code)"
    )
    assert len(shelf) == 8, f"最近使用應恰為上限 8 筆，實得 {len(shelf)}：{shelf}"
    assert shelf[0] == codes[-1], f"最新使用的碼不在最前面：{shelf}"
    assert shelf == list(reversed(codes))[:8], f"最近使用順序不對：{shelf}"


def test_make_primary(page):
    """點「主」把該碼移到 index 0，徽章與 HIS 預覽首行同步。"""
    reset(page)
    for code in ("I10", "E11.9", "E78.5"):
        quick_chip(page, "常用慢性病", code).click()
    expect(page.locator("#cart li")).to_have_count(3)
    page.locator('#cart li[data-code="E78.5"] .cart-primary').click()
    order = page.eval_on_selector_all("#cart li", "els => els.map(e => e.dataset.code)")
    assert order == ["E78.5", "I10", "E11.9"], order
    expect(page.locator('#cart li[data-code="E78.5"] .cart-badge')).to_have_attribute("data-primary", "true")
    assert page.text_content("#his-preview").splitlines()[0] == "E78.5"


def test_cart_reorder_by_drag(page):
    """拖曳換序後主診斷徽章要落在新的第一列。"""
    reset(page)
    for code in ("I10", "E11.9", "E78.5"):
        quick_chip(page, "常用慢性病", code).click()
    page.locator('#cart li[data-code="E78.5"]').drag_to(page.locator('#cart li[data-code="I10"]'))
    order = page.eval_on_selector_all("#cart li", "els => els.map(e => e.dataset.code)")
    assert order == ["E78.5", "I10", "E11.9"], order
    expect(page.locator("#cart li").first.locator(".cart-badge")).to_have_attribute("data-primary", "true")
    expect(page.locator('#cart li[data-code="I10"] .cart-badge')).to_have_text("2")


def test_his_preview_matches_clipboard(page):
    """看到的＝貼出去的：三種格式下 #his-preview 都必須等於剪貼簿內容。"""
    reset(page)
    quick_chip(page, "常用慢性病", "I10").click()
    quick_chip(page, "常用慢性病", "E11.9").click()
    for fmt in ("lines", "comma", "names"):
        open_settings(page)
        page.click(f'#seg-format button[data-format="{fmt}"]')
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)
        clip = page.evaluate("navigator.clipboard.readText()").replace("\r\n", "\n")
        assert page.text_content("#his-preview") == clip, f"{fmt}：預覽與剪貼簿不一致"
    open_settings(page)
    page.click('#seg-format button[data-format="lines"]')
    page.keyboard.press("Escape")


def test_search_enter_adds_first_result(page):
    """Enter 直接加入第一筆並清空輸入（設計 L662）。"""
    reset(page)
    search(page, "E119")
    first_code = page.locator("#search-results .chip").first.get_attribute("data-code")
    page.focus("#search")
    page.keyboard.press("Enter")
    expect(page.locator(f'#cart li[data-code="{first_code}"]')).to_have_count(1)
    assert page.input_value("#search") == ""
    expect(page.locator("#results-card")).to_be_hidden()


def test_settings_popover_closes_on_escape_and_outside_click(page):
    reset(page)
    open_settings(page)
    page.keyboard.press("Escape")
    expect(page.locator("#settings-popover")).to_be_hidden()
    open_settings(page)
    page.click("#panels-title")
    expect(page.locator("#settings-popover")).to_be_hidden()


def test_theme_toggle_contrast(page):
    """深色模式下四個關鍵區塊仍要看得見（R-2 的 HIS 預覽、R-7 的紅旗盒框線）。"""
    reset(page)
    set_mode(page, "mode-er")
    search(page, "E11")
    page.wait_for_selector("#search-results .chip.cat")
    quick_chip(page, "感染科常用", "N39.0").click()
    open_settings(page)
    page.click("#theme-toggle")
    try:
        assert page.get_attribute("html", "data-theme") == "dark"
        page.keyboard.press("Escape")
        assert contrast(page, "#his-preview") >= 4.5
        assert contrast(page, "#copy-date") >= 4.5
        assert contrast(page, "#search-results .chip.cat") >= 4.5
        assert contrast(page, ".redflag-group .chip--warn b") >= 4.5
        # R-7：warn token 若掉回 :root 之外的選擇器，框線會靜默消失
        width = page.locator(".redflag-group").first.evaluate("(el) => getComputedStyle(el).borderTopWidth")
        assert width == "1px", f"紅旗盒框線消失：border-top-width={width}"
    finally:
        page.evaluate("() => window.ICDApp.store.setTheme('light')")
        reset(page)


def test_storage_unavailable_degrades(fresh_page, page_url):
    """localStorage 被封鎖時 App 仍可正常加碼與複製（只是不跨診次保留）。"""
    fresh_page.add_init_script(
        """
        const boom = () => { throw new Error('storage blocked'); };
        Object.defineProperty(window, 'localStorage', {
            configurable: true,
            get: () => ({ getItem: boom, setItem: boom, removeItem: boom }),
        });
        """
    )
    errors = []
    fresh_page.on("pageerror", lambda exc: errors.append(str(exc)))
    fresh_page.goto(page_url)
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)
    quick_chip(fresh_page, "常用慢性病", "I10").click()
    expect(fresh_page.locator('#cart li[data-code="I10"]')).to_have_count(1)
    fresh_page.locator('#cart li[data-code="I10"] .cart-fav').click()
    fresh_page.wait_for_timeout(200)
    clip = fresh_page.evaluate("navigator.clipboard.readText()").replace("\r\n", "\n")
    assert clip == "I10"
    assert fresh_page.evaluate("() => window.ICDApp.store.storage.available") is False
    assert not errors, f"儲存不可用時拋出未捕捉例外：{errors}"


def test_clipboard_fallback_dialog(fresh_page, page_url):
    """剪貼簿與 execCommand 都失敗時要跳出可手動複製的後備視窗（C5，改版前無測試守）。"""
    fresh_page.add_init_script(
        """
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            get: () => ({ writeText: () => Promise.reject(new Error('blocked')) }),
        });
        document.execCommand = () => false;
        """
    )
    fresh_page.goto(page_url)
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)
    quick_chip(fresh_page, "常用慢性病", "I10").click()
    # 清單的自動同步刻意靜默：每點一個代碼就彈一次對話框比沒複製到更糟
    expect(fresh_page.locator("#fallback-copy")).to_be_hidden()

    # 使用者**主動按**的複製（日期）失敗時，仍必須跳後備視窗
    today = datetime.date.today()
    want_date = f"{today.year - 1911}-{today.month:02d}-{today.day:02d}"
    fresh_page.click("#copy-date")
    expect(fresh_page.locator("#fallback-copy")).to_be_visible()
    assert fresh_page.input_value("#fallback-copy textarea") == want_date
    fresh_page.keyboard.press("Escape")
    expect(fresh_page.locator("#fallback-copy")).to_be_hidden()
    fresh_page.click("#copy-date")
    expect(fresh_page.locator("#fallback-copy")).to_be_visible()
    fresh_page.click("#fallback-close")
    expect(fresh_page.locator("#fallback-copy")).to_be_hidden()


def test_layout_preference_persists(fresh_page, page_url):
    """設定裡的桌機版面偏好要持久化，而且要真的生效。

    P4a 掛上 window.ICDDock 之後，resolveLayout() 不再退回 wide：選了側掛窄欄就要
    真的換成 #layout-dock，重新整理後也維持。持久化程式碼從 P3 起未動過。
    """
    fresh_page.goto(page_url)
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)
    open_settings(fresh_page)
    fresh_page.click('#seg-layout button[data-layout-opt="dock"]')
    assert fresh_page.evaluate("() => window.ICDApp.store.getState().layout") == "dock"
    # 偏好一改就要立刻換版面，不是等重新整理
    assert fresh_page.get_attribute("body", "data-layout") == "dock"
    assert fresh_page.locator("#layout-dock").count() == 1
    fresh_page.reload()
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)
    assert fresh_page.evaluate("() => window.ICDApp.store.getState().layout") == "dock"
    open_settings(fresh_page)
    expect(fresh_page.locator('#seg-layout button[data-layout-opt="dock"]')).to_have_attribute("aria-pressed", "true")
    # body[data-layout] 永遠等於實際掛載的版面
    assert fresh_page.get_attribute("body", "data-layout") == "dock"
    assert fresh_page.locator("#layout-dock").count() == 1
    assert fresh_page.locator("#layout-wide").count() == 0


def test_layout_note_explains_downgrade_to_mobile(fresh_page, page_url):
    """偏好工作台但視窗過窄時，設定面板要說明「現在其實是手機版面、為什麼、怎麼回去」。

    沒有這行說明，seg-layout 上「工作台」是選中的、畫面卻是手機版，使用者只會當成壞掉
    （已實際回報過）。一致時則必須不出現，免得變成常駐雜訊。
    """
    fresh_page.set_viewport_size({"width": 800, "height": 900})
    fresh_page.goto(page_url)
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)
    assert fresh_page.evaluate("() => window.ICDApp.store.getState().layout") == "wide"
    assert fresh_page.get_attribute("body", "data-layout") == "mobile"

    open_settings(fresh_page)
    note = fresh_page.locator("#layout-note")
    expect(note).to_be_visible()
    text = note.inner_text()
    for word in ("手機版面", "900", "放寬", "工作台"):
        assert word in text, f"版面說明缺少「{word}」：{text}"

    # 放寬視窗會自動回到工作台，說明也要跟著收掉（偏好與生效一致就不解釋）
    fresh_page.set_viewport_size(dict(WIDE))
    fresh_page.wait_for_selector('body[data-layout="wide"]', timeout=5000)
    open_settings(fresh_page)
    expect(fresh_page.locator("#layout-note")).to_be_hidden()


# ══════════════════════════════════════════════════════════════════════════
# G. R2 獨立審查（.review/r2-code.md）的回歸守門
# ══════════════════════════════════════════════════════════════════════════
NON_CURATED_LEAF = "A00.0"          # 正牌葉碼，但不在建置期的 544 個精選白名單裡


def kill_decompression(pg):
    """模擬「瀏覽器不支援 DecompressionStream」——把建構子藏起來但留一份供之後還原。

    這是全庫載入失敗的**永久**狀態（舊版瀏覽器），也是 I1／I2／I3 三條缺陷唯一不會
    靠等待自行痊癒的情境，所以回歸測試一律用它，不倚賴預抓的時間差。
    """
    pg.add_init_script(
        "window.__DS = window.DecompressionStream;"
        "try { delete window.DecompressionStream; } catch (e) {}"
    )


def restore_decompression(pg):
    pg.evaluate("() => { window.DecompressionStream = window.__DS; }")


def test_empty_search_never_suggests_english_without_full_db(fresh_page, page_url):
    """R2 I1：精選池的英文欄是空的，全庫未就緒時「試試英文」是唯一保證無效的建議。"""
    kill_decompression(fresh_page)
    fresh_page.goto(page_url)
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)
    fresh_page.fill("#search", "cellulitis")
    fresh_page.wait_for_selector('body[data-db="error"]', timeout=10000)
    fresh_page.wait_for_timeout(300)

    empty = fresh_page.locator(".result-empty")
    expect(empty).to_be_visible()
    text = empty.inner_text()
    assert "試試英文" not in text, f"全庫不可用時仍叫使用者試英文：{text}"
    assert "中文" in text and "代碼" in text, f"沒有給出可行的下一步：{text}"

    # 四種 pool／dbState 組合的文案由 ICDRender.emptyText 決定，一次驗完
    variants = fresh_page.evaluate(
        """() => ({
            full: window.ICDRender.emptyText('full', 'ready'),
            idle: window.ICDRender.emptyText('curated', 'idle'),
            loading: window.ICDRender.emptyText('curated', 'loading'),
            error: window.ICDRender.emptyText('curated', 'error'),
        })"""
    )
    assert "英文" in variants["full"], variants["full"]
    for key in ("idle", "loading", "error"):
        assert "試試英文" not in variants[key], f"{key}：{variants[key]}"
        assert "中文" in variants[key] and "代碼" in variants[key], f"{key}：{variants[key]}"


def test_db_error_offers_retry_button(fresh_page, page_url):
    """R2 I2：全庫載入失敗後必須有重試路徑，否則使用者只能重開整個檔案。"""
    kill_decompression(fresh_page)
    fresh_page.goto(page_url)
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)
    fresh_page.evaluate("() => window.ICDApp.data.ensureDb()")
    fresh_page.wait_for_selector('body[data-db="error"]', timeout=10000)

    open_settings(fresh_page)
    retry = fresh_page.locator("#db-retry")
    expect(retry).to_be_visible()

    # 還原能力後按重試：要真的走到 ready，不是只換個文案
    restore_decompression(fresh_page)
    retry.click()
    fresh_page.wait_for_selector('body[data-db="ready"]', timeout=30000)
    open_settings(fresh_page)
    expect(fresh_page.locator("#db-note")).to_contain_text("96,802")
    expect(fresh_page.locator("#db-retry")).to_be_hidden()


def test_non_curated_favourite_reports_honestly_and_self_heals(fresh_page, page_url):
    """R2 I3：白名單外的★最愛在全庫未就緒時被拒，訊息不得說它「是類目碼或不存在」。"""
    kill_decompression(fresh_page)
    fresh_page.goto(page_url)
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)
    assert fresh_page.evaluate(
        "(c) => !window.CURATED_LABELS[c]", NON_CURATED_LEAF
    ), f"{NON_CURATED_LEAF} 竟在精選白名單裡，這條測試就測不到東西了"
    fresh_page.evaluate("(c) => window.ICDApp.store.setState({ favs: [c] })", NON_CURATED_LEAF)
    fresh_page.evaluate("() => window.ICDApp.data.ensureDb()")
    fresh_page.wait_for_selector('body[data-db="error"]', timeout=10000)

    chip = fresh_page.locator(f'#shelf .shelf-chip[data-code="{NON_CURATED_LEAF}"]')
    expect(chip).to_have_count(1)
    chip.click()
    fresh_page.wait_for_timeout(400)
    status = fresh_page.locator("#status").inner_text()
    assert "類目碼" not in status, f"訊息與事實相反（{NON_CURATED_LEAF} 是正牌葉碼）：{status}"
    assert "重新載入全庫" in status, f"沒有給可行的下一步：{status}"
    expect(fresh_page.locator("#cart li")).to_have_count(0)

    # 全庫救回來之後，同一顆 chip 必須真的加得進去
    restore_decompression(fresh_page)
    open_settings(fresh_page)
    fresh_page.click("#db-retry")
    fresh_page.wait_for_selector('body[data-db="ready"]', timeout=30000)
    fresh_page.locator(f'#shelf .shelf-chip[data-code="{NON_CURATED_LEAF}"]').click()
    expect(fresh_page.locator(f'#cart li[data-code="{NON_CURATED_LEAF}"]')).to_have_count(1)


def test_shelf_labels_fill_in_when_db_becomes_ready(fresh_page, page_url):
    """R2 I4：常用列的中文名要在全庫就緒的當下自己補上（dbState 的 DEPS 漏了 shelf）。"""
    fresh_page.goto(page_url)
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)
    fresh_page.evaluate("(c) => window.ICDApp.store.setState({ favs: [c] })", NON_CURATED_LEAF)
    chip = fresh_page.locator(f'#shelf .shelf-chip[data-code="{NON_CURATED_LEAF}"]')
    expect(chip).to_have_count(1)
    assert chip.locator(".chip-zh").inner_text() == "", "全庫未就緒時本來就查不到中文"

    # 只等全庫就緒，中間不做任何其他操作——會自己補上才代表 DEPS 正確
    fresh_page.evaluate("() => window.ICDApp.data.ensureDb()")
    fresh_page.wait_for_selector('body[data-db="ready"]', timeout=30000)
    fresh_page.wait_for_timeout(200)
    assert "霍亂" in chip.locator(".chip-zh").inner_text(), (
        "全庫就緒後常用列仍是光禿禿的代碼：" + chip.inner_text()
    )


def test_adjunct_codes_marked_in_every_position(page):
    """臨床審查：B95–B97／Z16 是附加碼，不可當主診斷；任何出現位置都要看得出來。

    官方中文名（例：Z16.11「青黴素之抗藥性」）完全看不出這件事，而相關碼推薦區的
    chip 走的正是官方中文名——那裡原本是唯一沒有任何標示的地方。
    """
    reset(page)
    # 1) 快選分組
    chip = quick_chip(page, "病原體附加碼／抗藥性", "B95.61")
    assert "chip--adjunct" in chip.get_attribute("class")
    assert chip.locator(".chip-tag").inner_text() == "附加碼"
    assert "不可作為主診斷" in chip.get_attribute("title")

    # 2) 搜尋結果
    search(page, "Z16.11")
    result = page.locator('#search-results .chip[data-code="Z16.11"]')
    expect(result).to_have_count(1)
    assert result.get_attribute("data-adjunct") == "1"
    page.fill("#search", "")

    # 3) 相關碼推薦區（L03.115 蜂窩組織炎 → B95.0 鏈球菌）
    reset(page)
    search(page, "L03.115")
    page.locator('#search-results .chip[data-code="L03.115"]').click()
    page.fill("#search", "")
    related = page.locator('#related .chip[data-code="B95.0"]')
    expect(related).to_have_count(1)
    assert related.get_attribute("data-adjunct") == "1", "相關碼推薦區沒有標示附加碼"
    assert related.locator(".chip-tag").count() == 1

    # 4) 站上主診斷（清單第一位）要有明確警示
    reset(page)
    quick_chip(page, "病原體附加碼／抗藥性", "B95.61").click()
    cart = page.locator("#cart")
    assert cart.get_attribute("data-primary-adjunct") == "true"
    badge = page.locator('#cart li[data-code="B95.61"] .cart-badge')
    assert badge.get_attribute("data-warn") == "true"
    assert "不可作為主診斷" in badge.get_attribute("title")
    assert "附加碼" in page.locator("#status").inner_text()
    # 加入真正的主診斷並排到第一位後，警示要消失
    quick_chip(page, "感染科常用", "A41.9").click()
    page.locator('#cart li[data-code="A41.9"] .cart-primary').click()
    assert cart.get_attribute("data-primary-adjunct") is None
    reset(page)


def test_category_chip_click_gives_feedback(page):
    """R2 M2：點虛線類目碼以前完全沒有回饋，使用者只會覺得「按了沒反應」。"""
    reset(page)
    search(page, "L03")
    cat = page.locator("#search-results .chip.cat").first
    expect(cat).to_be_visible()
    code = cat.get_attribute("data-code")
    # aria-disabled 會被 Playwright 當成 disabled，真實使用者其實點得下去，所以要 force
    cat.click(force=True)
    page.wait_for_timeout(150)
    status = page.locator("#status").inner_text()
    assert code in status and "類目碼" in status, f"點類目碼沒有回饋：{status!r}"
    expect(page.locator("#cart li")).to_have_count(0)
    page.fill("#search", "")


def test_escape_in_search_also_closes_settings(page):
    """R2 M3：Esc 在搜尋框裡原本只清查詢、不關 popover，與其他情境不一致。"""
    reset(page)
    page.fill("#search", "發燒")
    open_settings(page)
    page.focus("#search")
    page.keyboard.press("Escape")
    expect(page.locator("#settings-popover")).to_be_hidden()
    assert page.input_value("#search") == ""
    assert page.evaluate("() => window.ICDApp.store.getState().settingsOpen") is False


# ══════════════════════════════════════════════════════════════════════════
# R2 測試盲點補強（.review/r2-pipeline.md (b) 第 1、4 條）
# ══════════════════════════════════════════════════════════════════════════
def _codes_in(groups):
    out = set()
    for region in groups:
        for panel in region["panels"]:
            for field in ("chief", "diseases", "redFlags"):
                out.update(pair[0] for pair in panel.get(field, []))
            for code, values in panel.get("related", {}).items():
                out.add(code)
                out.update(values)
    return out


def _emergency_only_red_flag():
    """挑一個「急診紅旗、且門診資料完全沒出現過」的代碼，當毒化探針。

    不能寫死某個紅旗碼：紅旗碼可能同時是某張門診面板的常見疾病（A41.9 就是），
    那樣「門診不得出現這個碼」會變成假紅燈。改成從 curated 即時挑一個乾淨的。
    """
    emergency = json.loads((CURATED_DIR / "internal_emergency.json").read_text(encoding="utf-8"))
    outpatient = _codes_in(json.loads((CURATED_DIR / "internal_outpatient.json").read_text(encoding="utf-8")))
    red_flags = set()
    for region in emergency:
        for panel in region["panels"]:
            red_flags.update(pair[0] for pair in panel.get("redFlags", []))
    candidates = sorted(red_flags - outpatient)
    assert candidates, "找不到「只屬於急診」的紅旗碼，毒化探針無法成立"
    return candidates[0]


def test_embedded_fonts_actually_render_in_browser(page):
    """建置期驗過 payload 還不夠：瀏覽器要真的能把這 5 個字型解析並套用。

    盲點 1 的第二層。字型 base64 若損毀，瀏覽器會無聲 fallback 到系統字，
    畫面「看起來還好」、console 也沒有錯誤，只有 FontFace 的 status 會變 'error'。
    document.fonts 只在字型被用到時才真的下載／解析，所以這裡明確 load() 一次再驗。
    """
    reset(page)
    result = page.evaluate(
        """async () => {
            const want = [['Barlow', 400], ['Barlow', 500], ['Barlow', 700],
                          ['Barlow Condensed', 400], ['Barlow Condensed', 600]];
            const rows = [];
            for (const [family, weight] of want) {
                let thrown = null;
                try {
                    await document.fonts.load(weight + " 16px '" + family + "'", 'Abc0123');
                } catch (e) { thrown = String(e); }
                const faces = [...document.fonts].filter(
                    (f) => f.family.replace(/['"]/g, '') === family && String(f.weight) === String(weight)
                );
                rows.push({ family, weight, thrown, statuses: faces.map((f) => f.status) });
            }
            return { rows, total: document.fonts.size };
        }"""
    )
    assert result["total"] == 5, f"document.fonts 應有 5 個 @font-face，實得 {result['total']}"
    for row in result["rows"]:
        label = f"{row['family']} {row['weight']}"
        assert row["thrown"] is None, f"{label} 載入丟例外：{row['thrown']}"
        assert row["statuses"] == ["loaded"], \
            f"{label} 沒有成功載入（status={row['statuses']}）——內嵌的 woff2 很可能損毀"


def test_outpatient_never_renders_red_flags_even_with_poisoned_data(fresh_page, page_url):
    """臨床安全：就算 window.CURATED 的門診面板被塞進紅旗，畫面也一顆都不能出現。

    盲點 4（M5）：panelsFor() 那條「門診一律清空 redFlags」的防線目前只有
    data.test.mjs 用毒化假資料測得到——真實 curated 資料的門診面板本來就沒有
    redFlags 欄位（build.py 上游擋掉），E2E 從未真的練到 code 層這條防線。
    這裡在 app 開機前攔截 window.CURATED 的賦值把資料改壞，走完整渲染鏈驗證。
    """
    poison = _emergency_only_red_flag()
    fresh_page.add_init_script(
        """
        (() => {
          const POISON = '%s';
          let stored;
          Object.defineProperty(window, 'CURATED', {
            configurable: true,
            get() { return stored; },
            set(value) {
              try {
                for (const region of value.internalOutpatient) {
                  for (const panel of region.panels) panel.redFlags = [[POISON, '毒化紅旗']];
                }
                window.__poisoned = true;
              } catch (e) { window.__poisoned = String(e); }
              stored = value;
            },
          });
        })();
        """ % poison
    )
    fresh_page.goto(page_url)
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)

    # 陽性對照：毒化真的生效了，否則下面的「沒看到紅旗」毫無意義
    assert fresh_page.evaluate("() => window.__poisoned") is True, "毒化沒生效，這條測試等於沒測"
    assert fresh_page.evaluate(
        "() => window.CURATED.internalOutpatient[0].panels[0].redFlags.length"
    ) > 0

    regions = fresh_page.locator(".region-btn")
    assert regions.count() > 0
    for i in range(regions.count()):
        regions.nth(i).click()
        fresh_page.wait_for_timeout(60)
        name = regions.nth(i).inner_text()
        assert fresh_page.locator("#panels .chip--warn").count() == 0, f"門診部位「{name}」渲染出紅旗碼"
        assert fresh_page.locator(f'#panels .chip[data-code="{poison}"]').count() == 0, \
            f"門診部位「{name}」出現了被毒化塞進去的 {poison}"
        assert fresh_page.locator("#panels .redflag-group").count() == 0, \
            f"門診部位「{name}」出現紅旗區塊"

    # data 層同樣要擋住（三套版面共用的唯一出口）
    empty = fresh_page.evaluate(
        """() => {
            const n = window.ICDApp.data.regionsFor('outpatient').length;
            for (let i = 0; i < n; i++) {
                for (const p of window.ICDApp.data.panelsFor('outpatient', i)) {
                    if ((p.redFlags || []).length) return false;
                }
            }
            return true;
        }"""
    )
    assert empty is True, "data.panelsFor() 把門診的紅旗放行了"

    # 反面對照：同一份資料在急診模式下紅旗必須看得到，證明選擇器抓得到紅旗
    fresh_page.evaluate("() => window.ICDApp.store.setMode('emergency')")
    fresh_page.wait_for_timeout(120)
    assert fresh_page.locator("#panels .chip--warn").count() > 0, \
        "急診模式看不到任何紅旗，選擇器可能失效（上面的門診斷言會變成永遠成立）"


def test_full_db_is_decompressed_only_once_under_concurrent_triggers(fresh_page, page_url):
    """全庫（13MB gzip）不論被觸發幾次都只能解壓一次。

    盲點 4（M6）：ensureDb 的 `if (dbPromise) return dbPromise` 快取守門目前只有
    data.test.mjs 守著。真實踩法很平常——每敲一個字就呼叫一次 ensureDb（見
    interactions.js 的 input 委派），沒有守門的話打五個字就是五次 13MB 解壓。
    這裡用 DecompressionStream 的實際建構次數當計數器，量的是真的解壓了幾次。
    """
    fresh_page.add_init_script(
        """
        (() => {
          window.__gunzips = 0;
          const Orig = window.DecompressionStream;
          window.DecompressionStream = function (format) {
            window.__gunzips += 1;
            return new Orig(format);
          };
        })();
        """
    )
    fresh_page.goto(page_url)
    fresh_page.wait_for_selector('body[data-ready="1"]', timeout=8000)

    # (a) 真實使用者路徑：連續打字，每個字元都會觸發一次 ensureDb
    for chunk in ("蜂", "蜂窩", "蜂窩組", "蜂窩組織", "蜂窩組織炎"):
        fresh_page.fill("#search", chunk)
    # (b) 明確的併發呼叫：同一輪 microtask 內一起打進去
    fresh_page.evaluate("() => Promise.all([1,2,3,4,5].map(() => window.ICDApp.data.ensureDb()))")
    fresh_page.wait_for_selector('body[data-db="ready"]', timeout=30000)
    # 就緒之後再叫也不得重載
    fresh_page.evaluate("() => window.ICDApp.data.ensureDb()")
    fresh_page.wait_for_timeout(400)

    gunzips = fresh_page.evaluate("() => window.__gunzips")
    assert gunzips == 1, f"全庫被解壓了 {gunzips} 次，ensureDb 的快取守門失效"
    assert fresh_page.evaluate("() => window.ICDApp.data.isReady()") is True
    expect(fresh_page.locator("#search-results .chip").first).to_be_visible(timeout=3000)


# ---- 窗格高度手動調整（1a：中欄搜尋結果、右欄就診清單） ----
def pane_h(pg, selector):
    return pg.evaluate("(sel) => document.querySelector(sel).getBoundingClientRect().height", selector)


def drag_pane(pg, sep_selector, dy):
    """用滑鼠拖分隔條。Chromium 的 mouse 事件同時產生 pointer 事件，走的是實作那條路。"""
    box = pg.locator(sep_selector).bounding_box()
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    pg.mouse.move(x, y)
    pg.mouse.down()
    pg.mouse.move(x, y + dy, steps=6)
    pg.mouse.up()
    pg.wait_for_timeout(150)


def sep_for(pg, pane_id):
    return pg.locator(f'.pane-resizer[aria-controls="{pane_id}"]')


def with_results_and_cart(pg):
    """讓兩條分隔條都出現：中欄要有搜尋結果、右欄要有清單。"""
    reset(pg)
    pg.fill("#search", "急性")
    pg.wait_for_timeout(300)
    pg.locator('#panels .chip[data-code]:not(.cat)').first.click()
    pg.wait_for_timeout(200)


def test_pane_resizer_only_where_it_means_something(page):
    """分隔條只出現在有東西可調的地方：沒有搜尋結果、沒有清單時不該有假的可拖線。"""
    reset(page)
    assert page.locator(".pane-resizer").count() == 2, "1a 只有兩條：搜尋結果與就診清單"
    for pane_id in ("search-results", "cart-box"):
        expect(sep_for(page, pane_id)).to_be_hidden()

    with_results_and_cart(page)
    for pane_id in ("search-results", "cart-box"):
        sep = sep_for(page, pane_id)
        expect(sep).to_be_visible()
        assert sep.get_attribute("role") == "separator"
        assert sep.get_attribute("aria-orientation") == "horizontal"
        assert sep.get_attribute("tabindex") == "0"
        now = int(sep.get_attribute("aria-valuenow"))
        assert int(sep.get_attribute("aria-valuemin")) <= now <= int(sep.get_attribute("aria-valuemax"))
    reset(page)


def test_pane_drag_changes_height_and_keyboard_works(page):
    with_results_and_cart(page)
    before = pane_h(page, "#search-results")
    drag_pane(page, '.pane-resizer[aria-controls="search-results"]', -70)
    after = pane_h(page, "#search-results")
    assert after < before - 40, f"拖曳沒有改變搜尋結果區高度：{before} → {after}"
    assert page.evaluate("() => window.ICDApp.store.paneSizeFor('wide', 'results')") == round(after)
    assert int(sep_for(page, "search-results").get_attribute("aria-valuenow")) == round(after)

    # 右欄的清單區：往下拖變高
    cart_before = pane_h(page, "#cart-box")
    drag_pane(page, '.pane-resizer[aria-controls="cart-box"]', 90)
    cart_after = pane_h(page, "#cart-box")
    assert cart_after > cart_before + 40, f"清單區沒被拉高：{cart_before} → {cart_after}"

    # 鍵盤：聚焦分隔條後方向鍵一次 16px（觸控／滑鼠以外的第三條路）
    sep = sep_for(page, "search-results")
    sep.focus()
    h0 = pane_h(page, "#search-results")
    sep.press("ArrowDown")
    page.wait_for_timeout(80)
    assert pane_h(page, "#search-results") == h0 + 16
    sep.press("ArrowUp")
    sep.press("ArrowUp")
    page.wait_for_timeout(80)
    assert pane_h(page, "#search-results") == h0 - 16
    reset(page)


def test_pane_height_survives_reload(browser_ctx, page_url):
    """調過的高度要跨重新整理保留（localStorage），且只套在調過的那套版面上。"""
    pg = browser_ctx.new_page()
    pg.goto(page_url)
    pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
    pg.evaluate("() => { window.ICDApp.store.resetPaneSizes(); window.ICDApp.store.clearCart(); }")
    pg.fill("#search", "急性")
    pg.wait_for_timeout(300)
    drag_pane(pg, '.pane-resizer[aria-controls="search-results"]', -60)
    saved = round(pane_h(pg, "#search-results"))
    assert pg.evaluate("() => window.ICDApp.store.paneSizeFor('wide', 'results')") == saved

    pg.reload()
    pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
    assert pg.evaluate("() => window.ICDApp.store.paneSizeFor('wide', 'results')") == saved
    pg.fill("#search", "急性")
    pg.wait_for_timeout(300)
    assert round(pane_h(pg, "#search-results")) == saved, "重新整理後高度沒有回到使用者調好的值"
    # 分版面各記各的：1a 調的高度不得寫進其他版面
    assert pg.evaluate("() => JSON.stringify(window.ICDApp.store.getState().paneSizes)") \
        == '{"wide":{"results":%d}}' % saved

    pg.evaluate("() => window.ICDApp.store.resetPaneSizes()")
    pg.close()


def test_pane_cannot_be_dragged_away(page):
    """拖到極限不得讓窗格消失或只剩一條線，也不得把同欄其他內容擠出視野。"""
    with_results_and_cart(page)
    drag_pane(page, '.pane-resizer[aria-controls="search-results"]', -900)
    assert pane_h(page, "#search-results") >= 60, "搜尋結果區被拖沒了"
    expect(page.locator("#search-results .chip").first).to_be_visible()

    drag_pane(page, '.pane-resizer[aria-controls="cart-box"]', 2000)
    assert pane_h(page, "#cart-box") <= page.evaluate(
        "() => document.getElementById('cart-pane').clientHeight") - 100, "清單區吃掉整欄，貼入 HIS 被擠出視野"
    expect(page.locator("#his-preview")).to_be_visible()
    expect(page.locator("#cart li").first).to_be_visible()
    reset(page)


def test_pane_reset_from_settings(page):
    """設定面板的「回復預設高度」：沒調過時停用，調過後按一下回到預設。"""
    reset(page)
    open_settings(page)
    expect(page.locator("#reset-panes")).to_be_disabled()
    page.click("#settings-toggle")

    with_results_and_cart(page)
    default_h = pane_h(page, "#search-results")
    drag_pane(page, '.pane-resizer[aria-controls="search-results"]', -70)
    assert pane_h(page, "#search-results") < default_h - 40

    open_settings(page)
    expect(page.locator("#reset-panes")).to_be_enabled()
    page.click("#reset-panes")
    page.wait_for_timeout(200)
    assert page.evaluate("() => window.ICDApp.store.paneSizeFor('wide', 'results')") is None
    assert abs(pane_h(page, "#search-results") - default_h) < 1, "回復預設後高度沒有回到原本的樣子"
    assert page.evaluate(
        "() => document.getElementById('search-results').style.height") == "", "回復預設要把 inline 高度清乾淨"
    expect(page.locator("#reset-panes")).to_be_disabled()
    page.click("#settings-toggle")
    reset(page)


# ══════════════════════════════════════════════════════════════════════════
# 可及性（1a）：地標、標題階層、部位列語意、代碼鍵盤可達
# 依據 .review/v3-edge.md §5 的三條 ARIA 缺陷與 .review/v1-visual.md §3 的唯一破口。
# ══════════════════════════════════════════════════════════════════════════
HEADINGS_JS = """() => [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
    .filter((h) => !h.closest('[hidden]'))
    .map((h) => ({ level: Number(h.tagName[1]), text: h.textContent.trim() }))"""


def assert_heading_outline(pg, label):
    """H1 恰好一個、排在最前、有 H2，且相鄰標題不得跳級（H2 → H4 是跳級）。"""
    hs = pg.evaluate(HEADINGS_JS)
    levels = [h["level"] for h in hs]
    assert levels, f"{label}：整份文件沒有任何標題"
    assert levels.count(1) == 1, f"{label}：H1 應恰好一個，實際 {levels.count(1)} 個 → {hs}"
    assert levels[0] == 1, f"{label}：第一個標題不是 H1 → {hs}"
    assert 2 in levels, f"{label}：完全沒有 H2 → {hs}"
    for prev, cur in zip(levels, levels[1:]):
        assert cur <= prev + 1, f"{label}：標題跳級 H{prev} → H{cur} → {hs}"


def test_a11y_single_main_landmark(page):
    """主要內容區要有 <main>，而且只能有一個（v3 §5-1：原本只有 banner＋complementary）。"""
    reset(page)
    expect(page.locator('main, [role="main"]')).to_have_count(1)
    scope = page.evaluate("""() => {
        const m = document.querySelector('main');
        const has = (id) => m.contains(document.getElementById(id));
        return { panels: has('panels'), results: has('search-results'),
                 rail: has('region-rail'), cart: has('cart') };
    }""")
    assert scope["panels"] and scope["results"], f"主訴面板／搜尋結果不在 main 裡：{scope}"
    # 部位列與右欄各自是 group／complementary，被包進 main 會讓地標導覽跳不開
    assert not scope["rail"] and not scope["cart"], f"main 把其他地標吃進去了：{scope}"


def test_a11y_heading_outline(page):
    """標題階層要完整（v3 §5-2：原本全站沒有 H1／H2，直接從 H3／H4 開始）。"""
    reset(page)
    assert_heading_outline(page, "1a 工作台")
    assert page.evaluate("() => document.querySelector('h1').textContent") == "ICD-10 門診導引"
    # 補階層不得在畫面上多塞可見文字：H1／H2 都是 sr-only
    assert page.evaluate("""() => ['h1', 'h2'].every((sel) => {
        const h = document.querySelector(sel);
        return h && h.classList.contains('sr-only') && h.getBoundingClientRect().width <= 2;
    })""") is True


def test_a11y_region_buttons_are_toggle_buttons_not_fake_tabs(page):
    """部位列不得再宣告 tablist／tab（v3 §5-3）。

    宣告 ARIA tabs 等於承諾 roving tabindex ＋ 方向鍵導覽，而整份 src 從來沒有實作，
    讀屏使用者會被引導去按沒有作用的方向鍵。改成與 #mode-switch 同型的 role="group"
    ＋ aria-pressed 切換鈕：宣告與實作一致，鍵盤契約就是原生按鈕的 Tab／Enter／Space。
    """
    reset(page)
    assert page.locator('[role="tablist"], [role="tab"]').count() == 0, "還有元素宣告 tablist／tab 語意"
    expect(page.locator("#region-rail")).to_have_attribute("role", "group")
    expect(page.locator("#region-rail")).to_have_attribute("aria-label", "身體部位")

    second = page.locator("#region-rail .region-btn").nth(1)
    second.click()
    expect(second).to_have_attribute("aria-pressed", "true")
    assert page.locator('#region-rail .region-btn[aria-pressed="true"]').count() == 1

    # 「全部」鈕已移除；取消篩選＝再點一次已選的那顆
    second.click()
    expect(second).to_have_attribute("aria-pressed", "false")
    assert page.locator('#region-rail .region-btn[aria-pressed="true"]').count() == 0
    reset(page)


def test_a11y_cart_code_is_keyboard_reachable_and_copies(page):
    """b.cart-code 可點擊複製，就必須可聚焦、可鍵盤觸發（v1 §3：三套版面都到不了它）。"""
    reset(page)
    page.evaluate("() => window.ICDApp.store.addCode('I10', '本態性高血壓')")
    code = page.locator('#cart li[data-code="I10"] b.cart-code')
    expect(code).to_have_attribute("role", "button")
    expect(code).to_have_attribute("tabindex", "0")

    # 真的走鍵盤：清單列本身可聚焦，Tab 一次就該停在代碼上
    page.locator('#cart li[data-code="I10"]').focus()
    page.keyboard.press("Tab")
    landed = page.evaluate("""() => {
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

    page.keyboard.press("Enter")
    page.wait_for_timeout(150)
    assert page.evaluate("navigator.clipboard.readText()").replace("\r\n", "\n") == "I10"
    assert page.locator("#status").inner_text() == "已複製 I10"

    # Space 也要能觸發（原生按鈕契約），而且不得讓頁面跟著捲一頁
    page.evaluate("() => { document.getElementById('status').textContent = ''; }")
    scroll_before = page.evaluate("() => window.scrollY")
    page.keyboard.press(" ")
    page.wait_for_timeout(150)
    assert page.locator("#status").inner_text() == "已複製 I10", "Space 沒有觸發複製"
    assert page.evaluate("() => window.scrollY") == scroll_before, "Space 沒有被 preventDefault"
    reset(page)


def test_clear_cart_disabled_when_empty(page):
    """清單為空時「清空」要停用——按了什麼都不會發生的鈕，看起來像壞掉。"""
    reset(page)
    expect(page.locator("#clear-cart")).to_be_disabled()

    page.evaluate("() => window.ICDApp.store.addCode('I10', '本態性高血壓')")
    expect(page.locator("#clear-cart")).to_be_enabled()

    page.click("#clear-cart")
    expect(page.locator("#cart li")).to_have_count(0)
    expect(page.locator("#clear-cart")).to_be_disabled()
    assert "空" in page.get_attribute("#clear-cart", "title"), "停用時要說明原因，否則按不動像壞掉"


# ---- 慢病速查（DM／HTN／LIPID；1a 常駐在 header） -----------------------------
# 這個功能與工具其他部分有一個本質差異，測試全部從它推出來：ICD 代碼可以逐碼比對官方全庫、
# 錯了建置就失敗；健保給付規定沒有這種驗證。所以「出處與查證日期看得見」「換版當天顯示對的
# 版本」不是加分項，是這個功能能不能用的前提。
def open_chronic(pg, key):
    pg.click(f"#chronic-btn-{key}")
    expect(pg.locator("#chronic-overlay")).to_be_visible()


def chronic_snapshot(pg):
    """把浮層內容抓成純資料再比對。

    不用 `:has-text("…")` 定位子：條文本身含括號、引號、全形符號與換行，塞進選擇器
    很容易變成語法錯誤或部分比對，出事時看起來像功能壞掉。
    """
    return pg.evaluate("""() => ({
        current: Array.from(document.querySelectorAll('.chronic-item:not(.is-upcoming) .chronic-text')).map((n) => n.textContent),
        upcoming: Array.from(document.querySelectorAll('.chronic-item.is-upcoming .chronic-text')).map((n) => n.textContent),
        soon: Array.from(document.querySelectorAll('.chronic-soon')).map((n) => n.textContent),
        foot: (document.querySelector('.chronic-foot') || {}).textContent || '',
    })""")


def chronic_page(browser_ctx, page_url, today):
    """注入當天日期的新分頁。ICD_TODAY 必須在 app 起來之前設好，所以走 add_init_script。"""
    pg = browser_ctx.new_page()
    pg.add_init_script(f"window.ICD_TODAY = '{today}';")
    pg.goto(page_url)
    pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
    # 前面的測試可能把偏好版面留在 dock（會寫進 localStorage），明確歸位才量得準
    pg.evaluate("() => window.ICDApp.store.setLayout('wide')")
    pg.wait_for_selector('body[data-layout="wide"]')
    return pg


def test_chronic_three_buttons_sit_in_the_header_and_start_closed(page):
    reset(page)
    btns = page.locator(".app-header #chronic-switch .chronic-btn")
    expect(btns).to_have_count(3)
    assert btns.all_text_contents() == [short for _k, short, _l in cf.buttons()]
    for key, _short, label in cf.buttons():
        b = page.locator(f"#chronic-btn-{key}")
        expect(b).to_be_visible()
        assert label in (b.get_attribute("title") or ""), "短標籤塞不下全名時，完整名稱要在 title"
        expect(b).to_have_attribute("aria-expanded", "false")
    expect(page.locator("#chronic-overlay")).to_be_hidden()      # 負面：預設不擋住工作區


def test_chronic_each_button_opens_its_own_topic_and_only_that_one(page):
    keys = [k for k, _s, _l in cf.buttons()]
    for key, _short, label in cf.buttons():
        reset(page)                       # 浮層是 modal：要從關閉狀態出發才點得到入口鈕
        open_chronic(page, key)
        expect(page.locator("#chronic-title")).to_contain_text(label)
        expect(page.locator(f"#chronic-btn-{key}")).to_have_attribute("aria-expanded", "true")
        for other in keys:
            if other != key:
                expect(page.locator(f"#chronic-btn-{other}")).to_have_attribute("aria-expanded", "false")
    reset(page)


@pytest.mark.parametrize("how", ["close-button", "escape", "click-outside"])
def test_chronic_panel_closes_three_ways(page, how):
    reset(page)
    key = cf.buttons()[0][0]
    open_chronic(page, key)
    if how == "close-button":
        page.click("#chronic-close")
    elif how == "escape":
        page.keyboard.press("Escape")
    else:
        # 1a 的浮層置中，左右兩側是可點的背景。
        # 1b／1c 沒有這一條：面板佔滿整屏，根本不存在「外面」（那兩個版面靠關閉鈕與 Esc）。
        box = page.locator("#chronic-panel").bounding_box()
        page.mouse.click(box["x"] / 2, box["y"] + 200)
    expect(page.locator("#chronic-overlay")).to_be_hidden()
    expect(page.locator(f"#chronic-btn-{key}")).to_have_attribute("aria-expanded", "false")


def test_chronic_tabs_switch_topic_without_closing_the_panel(page):
    """浮層是 modal，外面的入口鈕被遮罩蓋住——沒有面板內的分頁就換不了主題，
    而「比對兩個主題的目標值」（例：DAROC 的血壓目標 vs 高血壓指引的血壓目標）正是最常見的用法。"""
    reset(page)
    first, last = cf.buttons()[0], cf.buttons()[-1]
    open_chronic(page, first[0])
    expect(page.locator(f"#chronic-tab-{first[0]}")).to_have_attribute("aria-pressed", "true")
    page.click(f"#chronic-tab-{last[0]}")
    expect(page.locator("#chronic-overlay")).to_be_visible()          # 負面：換主題不得把面板關掉
    expect(page.locator("#chronic-title")).to_contain_text(last[2])
    expect(page.locator(f"#chronic-tab-{last[0]}")).to_have_attribute("aria-pressed", "true")
    expect(page.locator(f"#chronic-tab-{first[0]}")).to_have_attribute("aria-pressed", "false")
    # 外面的入口鈕也要跟著走（關掉之後不能留著「展開中」的樣子）
    expect(page.locator(f"#chronic-btn-{last[0]}")).to_have_attribute("aria-expanded", "true")
    expect(page.locator(f"#chronic-btn-{first[0]}")).to_have_attribute("aria-expanded", "false")
    reset(page)


def test_chronic_focus_moves_into_the_panel_and_returns_to_the_opener(page):
    """浮層蓋住整個工作區：焦點沒跟過去的話，Tab 會走進看不見的東西。"""
    reset(page)
    key = cf.buttons()[0][0]
    open_chronic(page, key)
    assert page.evaluate("() => document.activeElement.id") == "chronic-close"
    page.keyboard.press("Escape")
    expect(page.locator("#chronic-overlay")).to_be_hidden()
    assert page.evaluate("() => document.activeElement.id") == f"chronic-btn-{key}"


def test_chronic_shows_source_and_checked_date_as_visible_text(page):
    """出處與查證日期必須是**畫面上的文字**——這是整個功能唯一的可信度來源。"""
    reset(page)
    picked = cf.undated_topic()
    assert picked, "至少要有一個沒有生效日的主題，否則條數期望值會隨日期漂"
    key, count = picked
    open_chronic(page, key)
    expect(page.locator(".chronic-item")).to_have_count(count)
    expect(page.locator(".chronic-source")).to_have_count(count)
    expect(page.locator(".chronic-checked")).to_have_count(count)
    first_source = page.locator(".chronic-source").first
    first_checked = page.locator(".chronic-checked").first
    expect(first_source).to_be_visible()
    expect(first_checked).to_be_visible()
    _kind, item = next(cf.items(key))
    assert item["source"] in first_source.inner_text()
    assert first_checked.inner_text() == "查證 " + item["checked"]
    # 負面：不是靠 title 或註腳混過去
    assert first_source.get_attribute("title") is None
    assert first_checked.get_attribute("title") is None
    expect(page.locator(".chronic-disclaimer")).to_be_visible()
    expect(page.locator(".chronic-disclaimer")).to_contain_text("健保署當期公告")
    reset(page)


def test_chronic_detail_is_advertised_and_expandable(page):
    """detail 是消歧義那一層（例：DAROC 的血壓 <140/90 與高血壓指引的 <130/80 兩者都對，
    差在量測基準）。收合可以，但控制項要看得見、而且展得開。"""
    reset(page)
    key = cf.buttons()[0][0]
    found = cf.first_item_with_detail(key)
    assert found, f"{key} 應至少有一條帶 detail"
    _text, detail = found
    open_chronic(page, key)
    toggle = page.locator(".chronic-more-toggle").first
    expect(toggle).to_be_visible()                                    # 看得出「這條有補充說明」
    body = page.locator(".chronic-more").first.locator(".chronic-detail")
    expect(body).to_be_hidden()                                       # 負面：預設收合
    toggle.click()
    expect(body).to_be_visible()
    assert detail[:20] in body.inner_text()
    reset(page)


def test_chronic_effective_window_follows_the_injected_today(browser_ctx, page_url):
    """換版當天顯示錯版本是這個功能最大的臨床風險，所以測兩個時間點而不是只測今天。"""
    case = cf.cutover_case()
    if not case:
        pytest.skip("chronic_care.json 目前沒有換版中的條目（同時帶 effectiveTo 與 effectiveFrom）")
    old, new = set(case["old_texts"]), set(case["new_texts"])

    before = chronic_page(browser_ctx, page_url, case["before"])
    try:
        open_chronic(before, case["key"])
        snap = chronic_snapshot(before)
        assert old <= set(snap["current"]), "換版前一天：舊表必須是現行版本"
        assert new == set(snap["upcoming"]), "換版前一天：新表必須以『即將生效』出現"
        assert not (new & set(snap["current"])), "負面：新表不得混進現行條目"
        assert snap["soon"] and all(case["cutover"] in s for s in snap["soon"])
        assert case["before"] in snap["foot"], "頁尾要說明是依哪一天判定的"
    finally:
        before.close()

    after = chronic_page(browser_ctx, page_url, case["cutover"])
    try:
        open_chronic(after, case["key"])
        snap = chronic_snapshot(after)
        assert new <= set(snap["current"]), "生效當天：新表必須變成現行版本"
        assert not (old & set(snap["current"])), "負面：舊表當天就要下架"
        assert not (new & set(snap["upcoming"])), "負面：已生效的不該還掛著『即將生效』"
        assert case["cutover"] in snap["foot"]
    finally:
        after.close()
