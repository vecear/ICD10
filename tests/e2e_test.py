"""E2E：對 dist/icd10.html 實跑主要使用流程。先跑 build/build.py。"""
import http.server, json, re, threading
from functools import partial
from pathlib import Path
import pytest
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parent.parent
CURATED_DIR = ROOT / "src" / "curated"
PORT = 18493


def region_for_panel(filename, panel_name):
    """從 curated JSON 動態找出含有該面板的部位群組名稱。

    部位分群屬於內容、會隨改版調整（如本輪「神經／頭頸」在門診拆成「神經／精神」），
    測試若寫死群組名稱會在下次重整時又變成假紅燈；改成即時查表，面板搬到哪一群都不必動測試。
    """
    groups = json.loads((CURATED_DIR / filename).read_text(encoding="utf-8"))
    for region in groups:
        if any(p["name"] == panel_name for p in region["panels"]):
            return region["name"]
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
def page(page_url):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(permissions=["clipboard-read", "clipboard-write"])
        pg = ctx.new_page()
        pg.goto(page_url)
        pg.wait_for_selector('body[data-ready="1"]', timeout=5000)
        yield pg
        browser.close()


@pytest.fixture(scope="module")
def file_page(page):
    pg = page.context.new_page()
    pg.goto((ROOT / "dist" / "icd10.html").resolve().as_uri())
    pg.wait_for_selector('body[data-ready="1"]', timeout=5000)
    yield pg
    pg.close()


def reset(pg):
    pg.click("#clear-cart")
    pg.click("#mode-op")
    pg.fill("#search", "")


def ready_ms(pg):
    return pg.evaluate("""() => {
        const [ready] = performance.getEntriesByName('icd-ready');
        return ready ? ready.startTime : null;
    }""")

def test_load_and_status(page):
    expect(page.locator("#status")).to_contain_text("96,802")

def test_load_performance(page):
    ms = ready_ms(page)
    assert ms is not None, "找不到 icd-ready 效能標記"
    assert ms < 2000, f"載入至可互動花了 {ms:.0f}ms"


def test_file_url_loads(file_page):
    expect(file_page.locator("#status")).to_contain_text("96,802")
    ms = ready_ms(file_page)
    assert ms is not None, "file:// 找不到 icd-ready 效能標記"
    assert ms < 2000, f"file:// 載入至可互動花了 {ms:.0f}ms"

def test_search_english_chinese_code(page):
    reset(page)
    page.fill("#search", "cellulitis")
    # 不斷言「第一筆」：人工精選碼會被優先排到最前面，新增哪個精選碼排第一屬於內容決策、
    # 不是這裡要測的東西——只要蜂窩性組織炎的正確碼族（L03.x）確實出現在結果裡就夠了。
    expect(page.locator('#search-results .chip[data-code^="L03"]').first).to_be_visible(timeout=2000)
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

def inject_probe_chips(pg, codes):
    """注入「沒有 .cat class」的可點 chip，繞過 UI 層防線直接走事件委派進 addCode()。

    UI 正常渲染時會替非葉碼加上 .cat（body 的委派處理器據此擋掉），所以 addCode()
    自己的 `if (!row || row[1] !== 1) return;` 在正常操作下永遠走不到——那條防線
    因此沒有測試保護。這裡刻意製造「防線被繞過」的情境來測它。
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
    """E2：addCode() 的葉碼防呆（`row[1] !== 1`）必須真的擋住，不能是死碼。

    先用葉碼當陽性對照確認注入的 chip 真的會走到 addCode（否則本測試會變成
    「什麼都沒發生所以通過」的假綠），再用類目碼／不存在代碼驗證防線生效。
    """
    reset(page)
    errors = []

    def on_error(exc):
        errors.append(str(exc))

    page.on("pageerror", on_error)
    try:
        # 陽性對照：注入的葉碼 chip 必須真的進得了清單 → 證明事件委派確實抵達 addCode
        inject_probe_chips(page, ["E11.9"])
        page.click('#probe-chips .chip[data-code="E11.9"]')
        expect(page.locator('#cart li[data-code="E11.9"]')).to_have_count(1)
        page.click("#clear-cart")
        expect(page.locator("#cart li")).to_have_count(0)

        # 真正的受測項：類目碼（use=0）與不存在的代碼都不得進入就診清單
        probes = ["E11", "A00", "K11", "ZZZ99"]
        inject_probe_chips(page, probes)
        for code in probes:
            page.click(f'#probe-chips .chip[data-code="{code}"]')
            expect(page.locator(f'#cart li[data-code="{code}"]')).to_have_count(0)
        assert page.locator("#cart li").count() == 0, "類目碼／不存在代碼被加進就診清單（葉碼防呆失效）"
        assert not errors, f"addCode() 對非葉碼/不存在代碼拋出未捕捉例外: {errors}"
    finally:
        page.remove_listener("pageerror", on_error)
        page.evaluate("() => document.getElementById('probe-chips')?.remove()")
        reset(page)


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
    expect(page.locator("#mode-op")).to_have_class(re.compile(r"active"))
    expect(page.locator("#panels-title")).to_contain_text("內科門診")
    # 部位群組數量取自 curated 資料而非寫死數字，內容改版調整分群時測試會自動跟著資料走。
    outpatient_regions = json.loads((CURATED_DIR / "internal_outpatient.json").read_text(encoding="utf-8"))
    expect(page.locator("#region-nav button")).to_have_count(len(outpatient_regions))
    page.click("#mode-er")
    expect(page.locator("#panels-title")).to_contain_text("內科急診")
    emergency_regions = json.loads((CURATED_DIR / "internal_emergency.json").read_text(encoding="utf-8"))
    expect(page.locator("#region-nav button")).to_have_count(len(emergency_regions))
    # 用 .first：紅旗區塊擴充後同一部位內可能不只一張面板有紅旗提示，這裡只驗證「有顯示出來」。
    expect(page.locator(".redflag-group").first).to_be_visible()
    page.click("#mode-surg")
    expect(page.locator("#panels-title")).to_contain_text("外科")
    expect(page.locator("#region-nav")).to_be_hidden()
    expect(page.locator('#quick .chip[data-code="Z48.02"]')).to_have_count(1)
    page.click("#mode-op")
    expect(page.locator("#panels-title")).to_contain_text("內科門診")


def test_symptom_shows_related_diagnoses_without_auto_adding(page):
    reset(page)
    page.click("#mode-er")
    page.click('[data-region="胸肺／心臟"]')
    card = page.locator('.symptom-card[data-panel="胸痛／心悸"]')
    expect(card.locator(".chief-group .chip[data-code='R07.9']")).to_have_count(1)
    card.locator(".chief-group .chip[data-code='R07.9']").click()
    expect(page.locator("#cart li[data-code='R07.9']")).to_have_count(1)
    expect(page.locator("#related .chip[data-code='I20.9']")).to_have_count(1)
    expect(page.locator("#cart li[data-code='I20.9']")).to_have_count(0)
    expect(card.locator(".redflag-group")).to_be_visible()


def test_symptom_shows_multiple_related_diseases_without_auto_adding(page):
    reset(page)
    page.click("#mode-op")
    page.click('[data-region="胸肺／心臟"]')
    card = page.locator('.symptom-card[data-panel="咳嗽／感冒"]')
    expect(card.locator(".disease-group")).to_contain_text("常見相關疾病")
    expect(card.locator(".disease-group .chip")).to_have_count(8)
    card.locator(".chief-group .chip[data-code='R05.9']").click()
    for code in ("J00", "J06.9", "J20.9", "J18.9"):
        expect(page.locator(f"#related .chip[data-code='{code}']")).to_have_count(1)
        expect(page.locator(f"#cart li[data-code='{code}']")).to_have_count(0)


def test_related_recallable_for_code_already_in_cart(page):
    """B1：已在清單的碼再次點擊，相關碼面板要回到該碼的建議（否則多診斷動線斷掉）。"""
    reset(page)
    page.click(f'[data-region="{region_for_panel("internal_outpatient.json", "頭痛")}"]')
    page.click('#panels .chip[data-code="R51.9"]')
    expect(page.locator('#related .chip[data-code="G43.909"]')).to_have_count(1)
    page.click('#related .chip[data-code="I10"]')
    expect(page.locator('#cart li[data-code="I10"]')).to_have_count(1)
    expect(page.locator('#related .chip[data-code="G43.909"]')).to_have_count(0)
    page.click('#panels .chip[data-code="R51.9"]')
    expect(page.locator("#cart li")).to_have_count(2)
    expect(page.locator('#related .chip[data-code="G43.909"]')).to_have_count(1)


def test_red_flags_do_not_leak_into_outpatient_related(page):
    """B2：紅旗碼只屬於急診，門診相關碼不得出現。"""
    reset(page)
    page.click(f'[data-region="{region_for_panel("internal_outpatient.json", "頭痛")}"]')
    page.click('#panels .chip[data-code="R51.9"]')
    expect(page.locator('#related .chip[data-code="G43.909"]')).to_have_count(1)
    expect(page.locator('#related .chip[data-code="G03.9"]')).to_have_count(0)
    expect(page.locator('#related .chip[data-code="I60.9"]')).to_have_count(0)
    reset(page)
    page.click("#mode-er")
    page.click(f'[data-region="{region_for_panel("internal_emergency.json", "頭痛")}"]')
    page.click('#panels .chip[data-code="R51.9"]')
    expect(page.locator('#related .chip[data-code="G03.9"]')).to_have_count(1)
    expect(page.locator('#related .chip[data-code="I60.9"]')).to_have_count(1)


def test_mode_switch_resets_related(page):
    """B3：切模式後相關碼區回到初始提示，但清單跨模式保留。"""
    reset(page)
    page.locator('.chip[data-code="I10"]').first.click()
    expect(page.locator("#related .chip").first).to_be_visible()
    page.click("#mode-surg")
    expect(page.locator("#related .chip")).to_have_count(0)
    expect(page.locator("#related")).to_contain_text("加入代碼後")
    expect(page.locator('#cart li[data-code="I10"]')).to_have_count(1)


def test_remove_from_cart_recomputes_related(page):
    """B3：從清單移除後相關碼重算，被移除的碼回到建議。"""
    reset(page)
    page.click(f'[data-region="{region_for_panel("internal_outpatient.json", "頭痛")}"]')
    page.click('#panels .chip[data-code="R51.9"]')
    page.click('#related .chip[data-code="I10"]')
    page.click('#panels .chip[data-code="R51.9"]')
    expect(page.locator('#related .chip[data-code="I10"]')).to_have_count(0)
    page.locator('#cart li[data-code="I10"] button').click()
    expect(page.locator('#related .chip[data-code="I10"]')).to_have_count(1)


@pytest.mark.parametrize("width", [390, 768])
def test_no_horizontal_overflow(page, width):
    """B4：窄螢幕整頁不得水平溢出（三個模式都要）。"""
    reset(page)
    page.set_viewport_size({"width": width, "height": 844})
    try:
        for mode in ("#mode-er", "#mode-op", "#mode-surg"):
            page.click(mode)
            sw, cw = page.evaluate(
                "() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]"
            )
            assert sw <= cw, f"{width}px {mode} 水平溢出：scrollWidth={sw} > clientWidth={cw}"
    finally:
        page.set_viewport_size({"width": 1280, "height": 800})


def test_mobile_cart_pane_not_sticky(page):
    """B5：390px 清單卡必須是 static，捲動時不得被 sticky header 蓋住。"""
    reset(page)
    page.set_viewport_size({"width": 390, "height": 844})
    try:
        page.click("#mode-er")
        assert page.locator("#cart-pane").evaluate("(e) => getComputedStyle(e).position") == "static"
        page.evaluate("window.scrollTo(0, 600)")
        overlap = page.evaluate("""() => {
            const h = document.querySelector('header').getBoundingClientRect();
            const c = document.querySelector('#cart-pane').getBoundingClientRect();
            return !(c.bottom <= h.top || c.top >= h.bottom);
        }""")
        assert not overlap, "捲動時清單卡與 header 重疊"
    finally:
        page.evaluate("window.scrollTo(0, 0)")
        page.set_viewport_size({"width": 1280, "height": 800})


def test_high_hit_search_shows_total_hint(page):
    """B7：命中數超過顯示上限時要提示總筆數。"""
    reset(page)
    page.fill("#search", "骨折")
    page.wait_for_timeout(300)   # 等 150ms debounce 重繪，避免讀到上一次搜尋的殘留
    expect(page.locator(".result-note")).to_contain_text("共 ")
    expect(page.locator(".result-note")).to_contain_text("顯示前 50 筆")


def test_mobile_symptom_layout(page):
    reset(page)
    page.set_viewport_size({"width": 390, "height": 844})
    try:
        page.click("#mode-er")
        expect(page.locator("#region-nav")).to_be_visible()
        page.click('[data-region="胸肺／心臟"]')
        grid_columns = page.locator(".symptom-grid").evaluate(
            "(el) => getComputedStyle(el).gridTemplateColumns.trim().split(/\\s+/).length"
        )
        assert grid_columns == 1
        card = page.locator('.symptom-card[data-panel="胸痛／心悸"]')
        card.locator(".chief-group .chip[data-code='R07.9']").click()
        expect(page.locator("#related-wrap")).to_be_visible()
        expect(page.locator("#related .chip[data-code='I20.9']")).to_have_count(1)
    finally:
        page.set_viewport_size({"width": 1280, "height": 800})


def test_primary_copy_button_has_visible_contrast(page):
    reset(page)
    styles = page.locator("#copy-lines").evaluate(
        "(el) => ({background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color})"
    )
    assert styles["background"] != "rgb(255, 255, 255)"
    assert styles["color"] != styles["background"]


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

def test_panel_expand_and_add(page):
    reset(page)
    page.click("#mode-surg")
    panel = page.locator("#panels .panel").first
    panel.locator("button").first.click()
    chip = panel.locator(".chip").first
    expect(chip).to_be_visible()
    code = chip.get_attribute("data-code")
    chip.click()
    expect(page.locator(f'#cart li[data-code="{code}"]')).to_have_count(1)
    panel.locator("button").first.click()
    expect(panel.locator(".chip").first).not_to_be_visible()

def test_cart_single_code_copy(page):
    reset(page)
    page.locator('.chip[data-code="I10"]').first.click()
    page.locator('#cart li[data-code="I10"] b').click()
    text = page.evaluate("navigator.clipboard.readText()").replace("\r\n", "\n")
    assert text == "I10"
