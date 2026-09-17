"""E2E（階段 1a）：醫師看得見自己剛做了什麼。

守的是五件事，全部來自 UX 稽核（U1／U2／U5／U6／V4／V6）與
docs/superpowers/specs/2026-09-17-usability-overhaul-design.md：

  A 可見通知列 `#notice`：三版面共用、覆蓋不推擠、成功類逾時收掉、失敗類留著、
    移除與清空附一顆「復原」。
  B 已加入勾號三版面共用（原本只有側掛窄欄有）。
  C 部位短名：「感染」屬於常見感染那一格，長期追蹤那格叫「追蹤」。
  D 工作台與手機的清單中文名獨立第二行、不截斷。
  E 側掛清單列小鈕 ≥ 20px（docs/dense-ui-principle.md §1 自訂的邊界）。

conftest.py 的 session fixture 已先跑過 build/build.py，所以測到的一定是當前 src。
"""
from pathlib import Path

import pytest
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parent.parent

# 通知列的兩個逾時（與 interactions.js 的 NOTICE_TTL／NOTICE_UNDO_TTL 同值）
NOTICE_TTL_MS = 2500

LAYOUTS = {
    # layout＝store 的偏好值；mobile 靠「視窗寬度 < LAYOUT_MIN_WIDTH」自動降級，
    # 不是一個可以直接設定的偏好（見 app.js 的 resolveLayout）。
    "wide": {"viewport": {"width": 1440, "height": 900}, "prefer": "wide", "touch": False},
    "dock": {"viewport": {"width": 340, "height": 900}, "prefer": "dock", "touch": False},
    "mobile": {"viewport": {"width": 390, "height": 844}, "prefer": "wide", "touch": True},
}


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as p:
        instance = p.chromium.launch()
        yield instance
        instance.close()


def _open(browser, spec):
    ctx = browser.new_context(
        viewport=dict(spec["viewport"]),
        is_mobile=spec["touch"],
        has_touch=spec["touch"],
        permissions=["clipboard-read", "clipboard-write"],
    )
    pg = ctx.new_page()
    pg.goto((ROOT / "dist" / "icd10.html").as_uri())
    pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
    pg.evaluate(f"() => window.ICDApp.store.setLayout('{spec['prefer']}')")
    pg.evaluate("() => window.ICDApp.data.ensureDb()")
    pg.wait_for_selector('body[data-db="ready"]', timeout=30000)
    return ctx, pg


@pytest.fixture(scope="module")
def pages(browser):
    """按需開頁、同一個 module 內重用（每個版面開一次頁要好幾秒）。"""
    made = {}

    def get(name):
        if name not in made:
            made[name] = _open(browser, LAYOUTS[name])
        return made[name][1]

    yield get
    for ctx, pg in made.values():
        ctx.close()


def reset(pg):
    """回到乾淨起點：空清單、門診、無搜尋、無浮層、通知列已收掉。"""
    pg.evaluate("""() => {
        const s = window.ICDApp.store;
        s.clearCart();
        s.setMode('outpatient');
        s.setRegion(0);
        s.setQuery('');
        s.setSettingsOpen(false);
        s.setChronicTopic(null);
        s.setCcrOpen(false);
        s.setLipidOpen(false);
        window.ICDInteractions.announce('');
    }""")
    pg.fill("#search", "")
    if pg.locator("#cart-sheet").count() and pg.locator("#cart-sheet").is_visible():
        pg.click("#cart-toggle")


def open_cart(pg):
    """手機的清單在收合抽屜裡；另兩個版面的 #cart 常駐。"""
    sheet = pg.locator("#cart-sheet")
    if sheet.count() and not sheet.is_visible():
        pg.click("#cart-toggle")
    expect(pg.locator("#cart")).to_be_visible()


def add(pg, code):
    """用搜尋＋Enter 加一個碼（三版面共用同一條路）。"""
    pg.fill("#search", code.replace(".", ""))
    pg.wait_for_selector("#search-results .chip:not(.cat)", timeout=5000)
    pg.locator("#search").press("Enter")
    expect(pg.locator(f'#cart li[data-code="{code}"]')).to_have_count(1)


def notice(pg):
    return pg.locator("#notice")


# ══════════════════════════════════════════════════════════════════════════
# A 可見通知列
# ══════════════════════════════════════════════════════════════════════════
@pytest.mark.parametrize("layout", ["wide", "dock", "mobile"])
def test_adding_a_code_already_in_the_cart_says_so_then_gets_out_of_the_way(pages, layout):
    """U1：點一個已在清單的碼，原本畫面零變化（三版面截圖 md5 相同）。

    現在要看得見，而且是**成功類**提示：看過就該讓出版面（密度原則手法 #4）。
    """
    pg = pages(layout)
    reset(pg)
    add(pg, "E11.9")

    pg.fill("#search", "E119")
    chip = pg.locator('#search-results .chip[data-code="E11.9"]').first
    expect(chip).to_be_visible()
    chip.click()

    expect(notice(pg)).to_be_visible()
    assert "E11.9" in notice(pg).inner_text(), notice(pg).inner_text()

    pg.wait_for_timeout(NOTICE_TTL_MS + 900)
    expect(notice(pg)).to_be_hidden()


@pytest.mark.parametrize("layout", ["wide", "dock", "mobile"])
def test_category_code_notice_stays_until_the_next_message(pages, layout):
    """失敗／未解決的提示永遠留著（密度原則手法 #4 的另一半）。

    類目碼點下去什麼都不會發生，而使用者要做的下一步是「改選下層細碼」——
    那句話 2.5 秒後消失就等於沒講。
    """
    pg = pages(layout)
    reset(pg)
    pg.fill("#search", "E11")
    pg.wait_for_selector("#search-results .chip.cat", timeout=5000)
    # 類目碼用 aria-disabled 而非 disabled，Playwright 會當成不可操作，要 force
    pg.locator("#search-results .chip.cat").first.click(force=True)

    expect(notice(pg)).to_be_visible()
    text = notice(pg).inner_text()
    assert "類目碼" in text, text

    pg.wait_for_timeout(NOTICE_TTL_MS + 900)
    expect(notice(pg)).to_be_visible()
    assert "類目碼" in notice(pg).inner_text()


@pytest.mark.parametrize("layout", ["wide", "dock", "mobile"])
def test_clear_and_remove_are_undoable(pages, layout):
    """U6：移除單筆與清空原本都不可逆，而 ✕ 與 ★ 是相鄰的兩顆小鈕。"""
    pg = pages(layout)
    reset(pg)
    for code in ("E11.9", "I10", "J06.9"):
        add(pg, code)
    open_cart(pg)
    expect(pg.locator("#cart li")).to_have_count(3)

    # ── 清空 → 復原 ──
    pg.click("#clear-cart")
    expect(pg.locator("#cart li")).to_have_count(0)
    expect(notice(pg)).to_be_visible()
    assert "3" in notice(pg).inner_text(), notice(pg).inner_text()
    undo = pg.locator("#notice-undo")
    expect(undo).to_be_visible()
    undo.click()
    open_cart(pg)
    expect(pg.locator("#cart li")).to_have_count(3)
    codes = pg.locator("#cart li").evaluate_all("els => els.map(e => e.dataset.code)")
    assert codes == ["E11.9", "I10", "J06.9"], codes

    # ── 移除單筆 → 復原（順序也要回到原樣） ──
    pg.locator('#cart li[data-code="I10"] .cart-remove').click()
    expect(pg.locator("#cart li")).to_have_count(2)
    expect(notice(pg)).to_be_visible()
    assert "I10" in notice(pg).inner_text()
    pg.locator("#notice-undo").click()
    expect(pg.locator("#cart li")).to_have_count(3)
    codes = pg.locator("#cart li").evaluate_all("els => els.map(e => e.dataset.code)")
    assert codes == ["E11.9", "I10", "J06.9"], codes


@pytest.mark.parametrize("layout", ["wide", "dock", "mobile"])
def test_notice_overlays_the_content_without_pushing_it(pages, layout):
    """通知列不得推擠內容：醫師正要點的那個碼不能在提示出現時移位。"""
    pg = pages(layout)
    reset(pg)
    scroller = {"wide": "#panels", "dock": ".dock-scroll", "mobile": "#m-scroll"}[layout]

    # 先把清單弄成「有一筆」的穩定狀態再量：加碼本身會讓 1c 的清單區出現、1b 的抽屜旗標
    # 改變，那些是清單的版面成本、不是通知列的。等提示自己收掉才取基準值。
    add(pg, "E11.9")
    pg.wait_for_timeout(NOTICE_TTL_MS + 900)
    expect(notice(pg)).to_be_hidden()

    before = pg.locator(scroller).evaluate("el => el.clientHeight")
    first_chip = pg.locator(
        "#panels .chip[data-code]:not(.cat), #dock-panels .chip[data-code]:not(.cat)").first
    first_chip.scroll_into_view_if_needed()
    y_before = first_chip.bounding_box()["y"]

    # 只讓提示出現、其他什麼都不動——announce() 是三套版面唯一的回饋入口，
    # 所以這一下走的就是真實路徑，只是把「清單也變了」那個變因拿掉。
    pg.evaluate("() => window.ICDInteractions.announce('已加入 E11.9 第二型糖尿病，未伴有併發症')")
    expect(notice(pg)).to_be_visible()
    after = pg.locator(scroller).evaluate("el => el.clientHeight")
    assert after == before, f"通知列把 {scroller} 的高度從 {before} 推成 {after}"
    assert abs(first_chip.bounding_box()["y"] - y_before) < 0.6, "提示出現時代碼移位了"


def test_notice_is_reachable_inside_the_pinned_window(browser):
    """置頂小視窗是**另一個文件**：回饋 UI 沒跟過去就等於小視窗零回饋（同 #status 的教訓）。"""
    ctx, pg = _open(browser, {"viewport": {"width": 1440, "height": 900},
                              "prefer": "dock", "touch": False})
    try:
        has_pip = pg.evaluate("() => typeof window.documentPictureInPicture === 'object'"
                              " && window.documentPictureInPicture !== null"
                              " && typeof window.documentPictureInPicture.requestWindow === 'function'")
        if not has_pip:
            pytest.skip("此瀏覽器沒有 Document Picture-in-Picture")
        before = set(ctx.pages)
        pg.click("#pin-toggle")
        pg.wait_for_timeout(1500)
        fresh = [p for p in ctx.pages if p not in before]
        assert len(fresh) == 1, f"沒有開出置頂小視窗：{[p.url for p in ctx.pages]}"
        pip = fresh[0]

        assert pip.locator("#notice").count() == 1, "小視窗裡沒有通知列"
        pip.locator('#dock-panels .chip[data-code]:not(.cat)').first.click()
        pip.wait_for_timeout(250)
        expect(pip.locator("#notice")).to_be_visible()
        assert "已加入" in pip.locator("#notice").inner_text()
        pip.close()
    finally:
        ctx.close()


# ══════════════════════════════════════════════════════════════════════════
# B 已加入勾號三版面共用
# ══════════════════════════════════════════════════════════════════════════
@pytest.mark.parametrize("layout", ["wide", "mobile"])
def test_codes_in_the_cart_are_marked_in_every_layout(pages, layout):
    """U2：勾號原本只寫在 dock.css，工作台與手機看不出哪些碼已經在清單裡。"""
    pg = pages(layout)
    reset(pg)
    add(pg, "E11.9")

    chip = pg.locator('#panels .chip[data-code="E11.9"]').first
    chip.scroll_into_view_if_needed()
    expect(chip).to_have_attribute("data-in-cart", "true")
    mark = chip.evaluate("el => getComputedStyle(el, '::after').content")
    assert mark == '"✓"', f"沒有勾號：{mark!r}"
    assert "已加入清單" in (chip.get_attribute("aria-label") or "")

    # 負面對照：沒在清單裡的 chip 不得有勾號，否則上面那條會被「永遠有 ::after」蒙過去
    # ——1b 就是這樣：它的 ::after 本來是「＋」（可以加），已加入時才換成「✓」。
    off = {"wide": ("none", "normal"), "mobile": ('"＋"',)}[layout]
    other = pg.locator('#panels .chip[data-code]:not(.cat):not([data-in-cart="true"])').first
    other.scroll_into_view_if_needed()
    assert other.evaluate("el => getComputedStyle(el, '::after').content") in off


@pytest.mark.parametrize("layout", ["wide", "mobile"])
def test_checkmark_does_not_cover_the_clinical_layers(pages, layout):
    """硬性邊界 #3：紅旗警示色、類目虛線、附加碼標記不得被勾號蓋掉。"""
    pg = pages(layout)
    reset(pg)
    pg.evaluate("() => window.ICDApp.store.setMode('emergency')")
    pg.wait_for_timeout(200)

    flag = pg.locator("#panels .chip--warn[data-code]:not(.cat)").first
    flag.scroll_into_view_if_needed()
    plain = pg.locator("#panels .chip[data-code]:not(.cat):not(.chip--warn)").first
    warn_line = flag.evaluate("el => getComputedStyle(el).borderBottomColor")
    plain_line = plain.evaluate("el => getComputedStyle(el).borderBottomColor")
    assert warn_line != plain_line, "紅旗與一般碼的邊框色本來就該不同（測試前提壞了）"

    flag.click()
    expect(flag).to_have_attribute("data-in-cart", "true")
    # 指標點完還停在 chip 上，量到的會是 hover 態（--chip-line-hover ＝ --warn-ink）；
    # 要比對的是靜止態，所以先把指標移開。
    pg.mouse.move(0, 0)
    pg.wait_for_timeout(120)
    assert flag.evaluate("el => getComputedStyle(el).borderBottomColor") == warn_line, \
        "加入清單之後紅旗的警示邊框被洗掉"
    assert flag.evaluate("el => getComputedStyle(el, '::after').content") not in ("none", "normal")

    # 類目碼加不進清單，所以它只需要證明「虛線還在、也沒有被掛上勾號」
    pg.fill("#search", "E11")
    pg.wait_for_selector("#search-results .chip.cat", timeout=5000)
    cat = pg.locator("#search-results .chip.cat").first
    assert cat.evaluate("el => getComputedStyle(el).borderBottomStyle") == "dashed"
    assert cat.get_attribute("data-in-cart") is None


# ══════════════════════════════════════════════════════════════════════════
# C 部位短名
# ══════════════════════════════════════════════════════════════════════════
@pytest.mark.parametrize("layout", ["dock", "mobile"])
def test_the_word_infection_belongs_to_the_common_infection_group(pages, layout):
    """U5：兩字縮寫原本把辨識用的「感染」給了「感染科追蹤」（HIV／結核／OPAT）。

    手機是觸控，title 永遠不會浮出來，等於無從辨識——會選到錯的那一組碼。
    """
    pg = pages(layout)
    reset(pg)
    pills = pg.locator("#region-pills .region-btn").evaluate_all("""els => els.map((e) => ({
        short: (e.querySelector('span') ? e.querySelector('span').textContent : e.textContent).trim(),
        title: e.getAttribute('title') || '',
    }))""")
    by_short = {p["short"]: p["title"] for p in pills}

    assert "感染" in by_short, f"沒有短名為「感染」的部位鈕：{by_short}"
    assert by_short["感染"].startswith("全身／感染"), by_short["感染"]
    assert "追蹤" in by_short, f"沒有短名為「追蹤」的部位鈕：{by_short}"
    assert by_short["追蹤"].startswith("感染科追蹤"), by_short["追蹤"]
    assert "全身" not in by_short, "「全身」不該再是任何一格的短名"


# ══════════════════════════════════════════════════════════════════════════
# D 清單中文名獨立第二行、不截斷
# ══════════════════════════════════════════════════════════════════════════
@pytest.mark.parametrize("layout", ["wide", "mobile"])
def test_cart_chinese_name_is_never_truncated(pages, layout):
    """V4：貼進 HIS 前唯一的核對機會，而它在最寬的版面反而最窄（1440 下只有 136px）。"""
    pg = pages(layout)
    reset(pg)
    add(pg, "E11.9")
    open_cart(pg)

    zh = pg.locator('#cart li[data-code="E11.9"] .cart-zh')
    expect(zh).to_be_visible()
    assert zh.inner_text().strip(), "清單列沒有中文名"

    metrics = zh.evaluate("""el => ({
        sw: el.scrollWidth, cw: el.clientWidth,
        overflow: getComputedStyle(el).textOverflow,
    })""")
    assert metrics["overflow"] != "ellipsis", "中文名還在用 ellipsis 截斷"
    assert metrics["sw"] <= metrics["cw"] + 1, f"中文名被截斷：{metrics}"

    code_box = pg.locator('#cart li[data-code="E11.9"] b.cart-code').bounding_box()
    assert zh.bounding_box()["y"] > code_box["y"], "中文名必須排在代碼的下一行"


# ══════════════════════════════════════════════════════════════════════════
# E 側掛清單列的小鈕 ≥ 20px
# ══════════════════════════════════════════════════════════════════════════
@pytest.mark.parametrize("width", [176, 340])
def test_dock_cart_row_buttons_meet_the_twenty_pixel_floor(browser, width):
    """V6：`.cart-primary` 實測 18×16px，低於 docs/dense-ui-principle.md §1 自訂的 20px。"""
    ctx, pg = _open(browser, {"viewport": {"width": width, "height": 900},
                              "prefer": "dock", "touch": False})
    try:
        add(pg, "E11.9")
        expect(pg.locator("#cart li")).to_have_count(1)
        # 1c 刻意隱藏 .cart-grip／.cart-fav（176px 排不進第一行），隱藏的框高是 0，
        # 所以只量真的看得到的那幾顆。
        heights = pg.locator("#cart li button").evaluate_all("""els => els
            .filter((e) => e.getClientRects().length > 0)
            .map((e) => [e.className, e.getBoundingClientRect().height])""")
        assert heights, "清單列一顆可見的小鈕都沒有"
        too_small = [h for h in heights if h[1] < 20]
        assert not too_small, f"{width}px 下小鈕低於 20px：{too_small}"
    finally:
        ctx.close()
