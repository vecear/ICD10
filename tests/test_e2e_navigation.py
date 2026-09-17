"""E2E（階段 2）：三版面同一件事同一個做法、有回頭路。

守的是五件事，來自 UX 稽核 U3／U4／U8／U9／U10 與
docs/superpowers/specs/2026-09-17-usability-overhaul-design.md 的三節：

  A 搜尋「返回」三版面共用（原本只有側掛窄欄有）：清空 query、回到搜尋前的捲動位置，
    Esc 同效。
  B placeholder 三版面都寫出「Enter 加第一筆」（那是最省時間的一招）。
  C 工作台左欄的面板索引 `#panel-index`：項目＝中欄實際渲染的面板，點了捲到該面板，
    搜尋時隱藏，並把原本 333px 的死空間吃掉。
  D 手機的「全展開／全收合」（沿用 dock 的 #expand-all-panels）。
  E 剪貼簿同步狀態：成功「已同步 HH:MM」、失敗「未同步」且不自動消失。
  F 量測回歸：三版面的固定 chrome 高度不得因為上面五件事長高（密度原則）。

conftest.py 的 session fixture 已先跑過 build/build.py，所以測到的一定是當前 src。
"""
import re
from pathlib import Path

import pytest
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parent.parent

LAYOUTS = {
    # layout＝store 的偏好值；mobile 靠「視窗寬度 < LAYOUT_MIN_WIDTH」自動降級，
    # 不是一個可以直接設定的偏好（見 app.js 的 resolveLayout）。
    "wide": {"viewport": {"width": 1440, "height": 900}, "prefer": "wide", "touch": False},
    "dock": {"viewport": {"width": 340, "height": 900}, "prefer": "dock", "touch": False},
    "mobile": {"viewport": {"width": 390, "height": 844}, "prefer": "wide", "touch": True},
}

# 各版面「會捲動的內容區」——「返回」要還原的就是這一個元素的 scrollTop
SCROLLER = {"wide": ".worksheet", "dock": ".dock-scroll", "mobile": "#m-scroll"}

# 改動前（HEAD＝735de0a）實測的固定 chrome 高度。這五個數字是這一階段的硬性回歸線：
# 「返回」與「已同步」一律塞進既有那一列，不得多付任何高度（docs/dense-ui-principle.md）。
BASELINE = {
    "wide_header": 63.0,          # .app-header
    "dock_head_176": 92.0,        # .dock-head（176px 下控制列折兩行）
    "dock_head_340": 67.0,        # .dock-head（使用者實際的 340px）
    "dock_cart_head": 35.1,       # .dock-cart-head（清單摘要列）
    "mobile_header": 119.0,       # .m-header
    "mobile_chronic_switch": 54.0,  # 健保規範條文｜血脂計算機｜CCr 那一排（加了「全展開」不得折行）
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
    """回到乾淨起點：空清單、門診、全部部位、無搜尋、無浮層、通知列已收掉。"""
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


def scroll_to(pg, layout, top):
    pg.evaluate(
        "([sel, top]) => { document.querySelector(sel).scrollTop = top; }",
        [SCROLLER[layout], top],
    )
    return scroll_top(pg, layout)


def scroll_top(pg, layout):
    return pg.evaluate("(sel) => document.querySelector(sel).scrollTop", SCROLLER[layout])


def search(pg, text):
    pg.fill("#search", text)
    pg.wait_for_selector("#search-results .chip", timeout=5000)


def back_btn(pg):
    return pg.locator(".search-back")


def height_of(pg, selector):
    return pg.evaluate(
        "(sel) => Math.round(document.querySelector(sel).getBoundingClientRect().height * 10) / 10",
        selector,
    )


# ══════════════════════════════════════════════════════════════════════════
# A 搜尋回頭路（U3）
# ══════════════════════════════════════════════════════════════════════════
@pytest.mark.parametrize("layout", ["wide", "dock", "mobile"])
def test_search_back_button_restores_region_and_scroll(pages, layout):
    """U3：原本只有側掛窄欄有「返回」，另兩個版面要自己清空搜尋框，而 Esc 這條路
    完全沒寫出來。三版面現在共用同一顆鈕、同一個 handler、同一份行為。

    「回到原本的位置」是這條測試的重點：醫師搜完一個碼要回去接著選附近的碼，
    如果回來落在頂端，等於每次搜尋都要重新捲一次。
    """
    pg = pages(layout)
    reset(pg)
    region = pg.evaluate("() => window.ICDApp.store.getState().region")
    parked = scroll_to(pg, layout, 400)
    assert parked > 0, f"{layout}：內容不夠長，這條測不到捲動還原"

    search(pg, "E11")
    expect(back_btn(pg)).to_be_visible()

    back_btn(pg).click()
    expect(pg.locator("#search")).to_have_value("")
    assert pg.evaluate("() => window.ICDApp.store.getState().query") == ""
    assert pg.evaluate("() => window.ICDApp.store.getState().region") == region, \
        f"{layout}：返回不該改變部位"
    assert scroll_top(pg, layout) == parked, \
        f"{layout}：返回後 scrollTop 應回到 {parked}，實得 {scroll_top(pg, layout)}"
    expect(back_btn(pg)).to_be_hidden()


@pytest.mark.parametrize("layout", ["wide", "dock", "mobile"])
def test_escape_in_the_search_box_does_the_same_as_the_back_button(pages, layout):
    """Esc 與「返回」同效（三版面）。鈕上的 title 就是這麼寫的，不能只是寫著。"""
    pg = pages(layout)
    reset(pg)
    parked = scroll_to(pg, layout, 360)
    search(pg, "E11")
    expect(back_btn(pg)).to_be_visible()

    pg.locator("#search").press("Escape")
    expect(pg.locator("#search")).to_have_value("")
    assert scroll_top(pg, layout) == parked, f"{layout}：Esc 後 scrollTop 應回到 {parked}"
    expect(back_btn(pg)).to_be_hidden()


def test_dock_keeps_its_existing_search_back_id(pages):
    """既有 E2E（test_e2e_dock_flow.py）靠 #dock-search-back 定位，共用化不得換掉它。"""
    pg = pages("dock")
    reset(pg)
    search(pg, "E11")
    back = pg.locator("#dock-search-back")
    expect(back).to_be_visible()
    classes = (back.get_attribute("class") or "").split()
    assert "search-back" in classes, f"dock 那顆也要掛共用 class，實得 {classes}"


# ══════════════════════════════════════════════════════════════════════════
# B placeholder（U10）
# ══════════════════════════════════════════════════════════════════════════
@pytest.mark.parametrize("layout", ["wide", "dock", "mobile"])
def test_search_placeholder_tells_every_layout_about_enter(pages, layout):
    """U10：三套 placeholder 原本各寫一套，只有工作台寫出「Enter 加入第一筆」，
    而那是最省時間的一招。窄的版面至少要留「Enter 加第一筆」。"""
    pg = pages(layout)
    reset(pg)
    holder = pg.locator("#search").get_attribute("placeholder")
    assert "Enter 加" in holder and "第一筆" in holder, f"{layout} placeholder：{holder}"


# ══════════════════════════════════════════════════════════════════════════
# C 工作台面板索引（U8）
# ══════════════════════════════════════════════════════════════════════════
def test_panel_index_lists_exactly_the_panels_rendered_in_the_middle_column(pages):
    """索引與中欄同一份資料來源。多一項或少一項都代表有人另外算了一次。"""
    pg = pages("wide")
    reset(pg)
    counts = pg.evaluate("""() => ({
        panels: document.querySelectorAll('#panels .symptom-card, #panels .quick-card').length,
        index: document.querySelectorAll('#panel-index .panel-index-item').length,
    })""")
    assert counts["panels"] > 3, f"測試前提不成立：中欄只渲染了 {counts['panels']} 個面板"
    assert counts["index"] == counts["panels"], counts

    names = pg.evaluate("""() => {
        const cards = [...document.querySelectorAll('#panels .symptom-card, #panels .quick-card')];
        const items = [...document.querySelectorAll('#panel-index .panel-index-item')];
        return { cards: cards.map(c => c.dataset.panel || c.dataset.quick),
                 items: items.map(i => i.dataset.panelIndex) };
    }""")
    assert names["items"] == names["cards"], "索引順序要與中欄一致"


def test_clicking_a_panel_index_item_scrolls_that_panel_under_the_sticky_head(pages):
    """點了要**捲到**，而不是只有標亮。offset 用實際量到的黏頭高度算，不寫死。"""
    pg = pages("wide")
    reset(pg)
    fourth = pg.locator("#panel-index .panel-index-item").nth(3)
    name = fourth.get_attribute("data-panel-index")
    fourth.click()
    gap = pg.evaluate("""(name) => {
        const card = document.querySelector(`#panels [data-panel="${name}"], #panels [data-quick="${name}"]`);
        const title = card.querySelector('.symptom-card-title') || card;
        const sheet = document.querySelector('.worksheet');
        const cs = getComputedStyle(sheet);
        // 捲動區可視內容的上緣＝padding-box 上緣 ＋ 目前釘在那裡的 sticky 元素高度
        let sticky = 0;
        for (const kid of sheet.children) {
            const ks = getComputedStyle(kid);
            if (ks.position === 'sticky' && (parseFloat(ks.top) || 0) <= 0.5) {
                sticky = Math.max(sticky, kid.getBoundingClientRect().height);
            }
        }
        const line = sheet.getBoundingClientRect().top + (parseFloat(cs.paddingTop) || 0) + sticky;
        return Math.round((title.getBoundingClientRect().top - line) * 10) / 10;
    }""", name)
    assert 0 <= gap <= 8, f"「{name}」標題與可視上緣差 {gap}px，應在 0–8px"
    expect(fourth).to_have_attribute("aria-current", "true")


def test_panel_index_marks_where_you_are_while_scrolling(pages):
    """捲動時索引要跟著標「目前所在」，否則它只是一份靜態目錄。

    這條測的是 IntersectionObserver 那段的判準：命中的常常有兩三張（上一張的最後
    幾個像素還在帶子裡），要的是「上緣已經捲過去的最後一張」。
    """
    pg = pages("wide")
    reset(pg)
    names = pg.evaluate(
        "() => [...document.querySelectorAll('#panel-index .panel-index-item')]"
        ".map(b => b.dataset.panelIndex)"
    )
    for want in (names[2], names[5], names[0]):
        pg.evaluate("""(name) => {
            const card = document.querySelector(`#panels [data-panel="${name}"], #panels [data-quick="${name}"]`);
            const sheet = document.querySelector('.worksheet');
            sheet.scrollTop += card.getBoundingClientRect().top
                - sheet.getBoundingClientRect().top - 18;
        }""", want)
        expect(
            pg.locator(f'#panel-index .panel-index-item[aria-current="true"]')
        ).to_have_attribute("data-panel-index", want)


def test_panel_index_follows_the_region_and_hides_while_searching(pages):
    """部位、模式、搜尋狀態改變都要更新索引；搜尋結果狀態下整塊隱藏
    （那時中欄的主角是結果，索引指向的面板不是使用者在看的東西）。"""
    pg = pages("wide")
    reset(pg)
    first = pg.locator("#panel-index .panel-index-item").count()

    pg.click('#region-rail .region-btn:nth-of-type(3)')
    second = pg.locator("#panel-index .panel-index-item").count()
    rendered = pg.locator("#panels .symptom-card, #panels .quick-card").count()
    assert second == rendered, f"切部位後索引 {second} ≠ 中欄 {rendered}"
    assert second != first or rendered != first, "換了部位但面板數完全一樣，這條測不到更新"

    search(pg, "E11")
    expect(pg.locator("#panel-index")).to_be_hidden()
    back_btn(pg).click()
    expect(pg.locator("#panel-index")).to_be_visible()
    reset(pg)


def test_panel_index_eats_the_rail_dead_space(pages):
    """U8：左欄部位列下方原本有 332.7px 完全空白，而中欄預設就要捲 5.8 屏。
    這條守的是「那塊空白真的被用掉了」，不是只掛了一個看不見的元素。"""
    pg = pages("wide")
    reset(pg)
    dead = pg.evaluate("""() => {
        const rail = document.querySelector('.rail-col') || document.getElementById('region-rail');
        const kids = [...rail.children].filter(el => el.getBoundingClientRect().height > 0);
        const last = kids[kids.length - 1];
        return Math.round((rail.getBoundingClientRect().bottom
                           - last.getBoundingClientRect().bottom) * 10) / 10;
    }""")
    assert dead < 40, f"左欄底部還空著 {dead}px（改動前是 332.7px）"


def test_panel_index_does_not_make_the_middle_column_longer(pages):
    """索引是把已經浪費掉的版面換成動線，不是拿內容區去換——中欄捲動長度必須不變。"""
    pg = pages("wide")
    reset(pg)
    assert pg.evaluate("() => document.getElementById('panels').scrollHeight") == 5249


# ══════════════════════════════════════════════════════════════════════════
# D 手機全展開（U9）
# ══════════════════════════════════════════════════════════════════════════
def test_mobile_expand_all_toggles_every_panel(pages):
    """U9：手機原本要逐一點開六個面板。沿用 dock 的 #expand-all-panels，
    44px 觸控門檻不打折，而且不得多佔一列（它接在健保規範條文那一排的右側）。"""
    pg = pages("mobile")
    reset(pg)
    pg.evaluate("() => window.ICDApp.store.setRegion(0)")
    btn = pg.locator("#expand-all-panels")
    expect(btn).to_be_visible()
    assert btn.bounding_box()["height"] >= 44, btn.bounding_box()

    total = pg.locator("#panels .panel-toggle").count()
    assert total > 1, f"測試前提不成立：只有 {total} 個可展開面板"
    btn.click()
    assert pg.locator('#panels .panel-toggle[aria-expanded="true"]').count() == total
    expect(btn).to_have_text("全收合")
    btn.click()
    assert pg.locator('#panels .panel-toggle[aria-expanded="true"]').count() == 0
    expect(btn).to_have_text("全展開")


# ══════════════════════════════════════════════════════════════════════════
# E 剪貼簿同步狀態（U4）
# ══════════════════════════════════════════════════════════════════════════
@pytest.mark.parametrize("layout", ["wide", "dock", "mobile"])
def test_clipboard_sync_shows_the_time_it_last_synced(pages, layout):
    """U4：沒有複製鈕（刻意），但也沒有任何一處說剪貼簿已經同步，醫師只能相信它。
    現在「貼入 HIS」標題列／清單摘要列右側寫出時間，不另開一列。"""
    pg = pages(layout)
    reset(pg)
    pg.evaluate("() => window.ICDApp.store.addCode('I10', '原發性高血壓')")
    if pg.locator("#cart-sheet").count():
        pg.click("#cart-toggle")          # 手機的「貼入 HIS」在抽屜裡
    mark = pg.locator("#clipboard-sync")
    expect(mark).to_be_visible()
    assert re.fullmatch(r"已同步 \d{2}:\d{2}", mark.inner_text().strip()), mark.inner_text()
    assert "is-stale" not in (mark.get_attribute("class") or "")
    reset(pg)


@pytest.mark.parametrize("layout", ["wide", "dock", "mobile"])
def test_clipboard_sync_says_未同步_and_stays_when_the_clipboard_refuses(pages, layout):
    """剪貼簿被拒是**未解決的問題**：標紅、不自動消失，下次成功才換回來
    （與通知列 sticky 那一條同一個判準）。execCommand 後備也要擋掉，
    否則測到的是後備成功而不是失敗路徑。"""
    pg = pages(layout)
    reset(pg)
    pg.evaluate("""() => {
        window.__realWrite = navigator.clipboard.writeText.bind(navigator.clipboard);
        window.__realExec = document.execCommand.bind(document);
        navigator.clipboard.writeText = () => Promise.reject(new Error('測試：拒絕寫入'));
        document.execCommand = (cmd) => (cmd === 'copy' ? false : window.__realExec(cmd));
    }""")
    try:
        pg.evaluate("() => window.ICDApp.store.addCode('I10', '原發性高血壓')")
        if pg.locator("#cart-sheet").count():
            pg.click("#cart-toggle")
        mark = pg.locator("#clipboard-sync")
        expect(mark).to_have_text("未同步")
        assert "is-stale" in (mark.get_attribute("class") or ""), mark.get_attribute("class")
        # 不自動消失：通知列的 2.5 秒逾時過了，它還在
        pg.wait_for_timeout(2800)
        expect(mark).to_have_text("未同步")
    finally:
        pg.evaluate("""() => {
            navigator.clipboard.writeText = window.__realWrite;
            document.execCommand = window.__realExec;
        }""")

    # 下一次成功就換回時間
    pg.evaluate("() => window.ICDApp.store.addCode('J06.9', '急性上呼吸道感染')")
    expect(pg.locator("#clipboard-sync")).to_have_text(re.compile(r"^已同步 \d{2}:\d{2}$"))
    reset(pg)


# ══════════════════════════════════════════════════════════════════════════
# F 量測回歸：固定 chrome 不得長高
# ══════════════════════════════════════════════════════════════════════════
def test_fixed_chrome_heights_did_not_grow(pages):
    """密度原則：「返回」與「已同步」一律塞進既有那一列。
    這些數字是改動前實測的（HEAD 735de0a），任何一項變大就是多付了版面。"""
    wide = pages("wide")
    reset(wide)
    assert height_of(wide, ".app-header") == BASELINE["wide_header"]

    dock = pages("dock")
    reset(dock)
    # 清單裡要有碼，「已同步 HH:MM」才會出現——空清單量到的是它藏起來的樣子，測不到東西
    dock.evaluate("() => window.ICDApp.store.addCode('I10', '原發性高血壓')")
    expect(dock.locator("#clipboard-sync")).to_be_visible()
    assert height_of(dock, ".dock-head") == BASELINE["dock_head_340"]
    assert height_of(dock, ".dock-cart-head") == BASELINE["dock_cart_head"]
    dock.set_viewport_size({"width": 176, "height": 900})
    try:
        assert height_of(dock, ".dock-head") == BASELINE["dock_head_176"]
        assert height_of(dock, ".dock-cart-head") == BASELINE["dock_cart_head"]
        # 176px 是最嚴的寬度：多了「已同步」不得把摘要列擠成水平捲動
        assert dock.evaluate(
            "() => document.documentElement.scrollWidth <= document.documentElement.clientWidth"
        ), "176px 出現水平捲動"
        assert dock.evaluate(
            "() => { const r = document.querySelector('.dock-cart-head');"
            " return r.scrollWidth <= r.clientWidth + 1; }"
        ), "176px 摘要列自己溢出了"
    finally:
        dock.set_viewport_size({"width": 340, "height": 900})
        reset(dock)

    mobile = pages("mobile")
    reset(mobile)
    mobile.evaluate("() => window.ICDApp.store.addCode('I10', '原發性高血壓')")
    assert height_of(mobile, ".m-header") == BASELINE["mobile_header"]
    # 加了「全展開」之後這一排仍是一列（折行就會多付 44px＋間距）
    assert height_of(mobile, "#chronic-switch") == BASELINE["mobile_chronic_switch"]
    assert mobile.evaluate(
        "() => document.documentElement.scrollWidth <= document.documentElement.clientWidth"
    ), "390px 出現水平捲動"
    # 搜尋狀態多一顆「返回」，那一列仍不得溢出（它是跟搜尋框借寬度）
    search(mobile, "E11")
    assert mobile.evaluate(
        "() => { const r = document.querySelector('.m-head-row');"
        " return r.scrollWidth <= r.clientWidth + 1; }"
    ), "搜尋狀態下手機搜尋列溢出"
    assert height_of(mobile, ".m-header") == BASELINE["mobile_header"]
    reset(mobile)
