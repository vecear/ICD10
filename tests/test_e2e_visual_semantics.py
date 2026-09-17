"""E2E（階段 3）：header 的視覺層級與顏色語意。

守的是「一眼就看得懂這排是什麼」這件事，來自 UX 稽核 V1／V2／V3／V5／V7／V8／V9 與
docs/superpowers/specs/2026-09-17-usability-overhaul-design.md 的「header 與顏色語意」節：

  A 顏色語意：`--his-btn` 的淺藍**只**給會寫剪貼簿的鈕。`#ccr-btn` 原本吃這個淺藍，
    可是它只是開一個浮層，而同一排語意相同的 `#chronic-btn`／`#lipid-btn` 是透明的
    ——同類三顆兩種樣式。三套版面都要同款。
  B 工作台 header 全列同尺寸（32px／13px）：改之前四種高度、三種字級，而且大小與
    使用頻率相反（最常用的「健保規範條文」最小、一診按一次的「側掛置頂」最大）。
    收尺寸不得多付高度：`.app-header` 不准超過改動前的 63px。
  C 手機日期鈕離開模式分段列：它原本在 DOM 與視覺上都屬於那個分段控制項，還是填滿的
    淺藍，與深藍的「已選中」並排＝看起來像第四個模式。移到搜尋列，44px 與 16px 兩條
    硬性下限（docs/dense-ui-principle.md §1）不准因此打折。
  D 三筆小修正：側掛摘要 13→12px、「清空」過 AA（1a 與 1b，兩邊是同一個 `.btn-ghost`
    缺陷）、手機「設定」13→14px。
  E 工作台慢病速查浮層吃掉視窗寬度（原本 1440px 只用 720）。

conftest.py 的 session fixture 已先跑過 build/build.py，所以測到的一定是當前 src。
對比度用 e2e_test.py 既有的 `contrast()`，不另抄一份公式。
"""
from pathlib import Path

import pytest
from playwright.sync_api import expect, sync_playwright

from e2e_test import contrast

ROOT = Path(__file__).resolve().parent.parent

LAYOUTS = {
    # 與 test_e2e_navigation.py 同一組設定：mobile 靠視窗寬度降級，不是可直接設定的偏好。
    "wide": {"viewport": {"width": 1440, "height": 900}, "prefer": "wide", "touch": False},
    "dock": {"viewport": {"width": 340, "height": 900}, "prefer": "dock", "touch": False},
    "mobile": {"viewport": {"width": 390, "height": 844}, "prefer": "wide", "touch": True},
}

# 改動前實測（HEAD＝1382d19，量測腳本見回報）。header 只准變矮，不准變高。
WIDE_HEADER_MAX = 63.0
HEADER_SIZE = 32          # 工作台 header 每個控制項的高度
HEADER_FONT = "13px"      # 工作台 header 每個控制項的字級

# header 那一列的控制項。用 id 逐一點名而不是「header 裡所有 button」：設定 popover 與
# 通知列也掛在 .app-header 底下（popover 要跟著 header 下緣、通知列要覆蓋而不推擠），
# 它們不是這一列的成員，尺寸也不該被這條規則綁住。
WIDE_HEADER_CONTROLS = (
    "#copy-date",
    '#mode-switch [data-mode="outpatient"]',
    '#mode-switch [data-mode="emergency"]',
    '#mode-switch [data-mode="surg"]',
    "#chronic-btn",
    "#lipid-btn",
    "#ccr-btn",
    "#search",
    "#go-dock",
    "#settings-toggle",
)


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
    """回到乾淨起點：空清單、門診、全部部位、無搜尋、無浮層。"""
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
        s.setTheme('light');
    }""")
    pg.fill("#search", "")


def metrics(pg, selector):
    """回傳該元素的 offsetHeight／字級／背景色／版面座標；查無元素直接讓測試失敗。"""
    got = pg.eval_on_selector(
        selector,
        """(el) => {
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return {
                h: el.offsetHeight,
                fontSize: cs.fontSize,
                background: cs.backgroundColor,
                top: r.top,
                width: r.width,
            };
        }""",
    )
    assert got is not None, f"找不到 {selector}"
    return got


# ══════════════════════════════════════════════════════════════════════════
# B 工作台 header 全列同尺寸（V3）
# ══════════════════════════════════════════════════════════════════════════
def test_every_wide_header_control_is_the_same_size(pages):
    """稽核 V3：一列裡四種高度（32／40／28／40）、三種字級（14／13／12／16），
    而且最常用的臨床查詢是全列最小的一顆。統一之後尺寸不再攜帶語意。"""
    pg = pages("wide")
    reset(pg)
    # 先確認點名的清單沒有漏掉 header 裡任何一顆看得到的鈕，否則這個測試會在
    # 「有人多加一顆」的時候安靜地不測它——那正是四種高度當初長出來的方式。
    counted = pg.evaluate("""() => [...document.querySelectorAll('.app-header button')]
        .filter((b) => !b.closest('#settings-popover') && !b.closest('#notice') && b.offsetParent !== null)
        .length""")
    assert counted == len(WIDE_HEADER_CONTROLS) - 1, (      # −1：搜尋框是 <input> 不是 button
        f"header 有 {counted} 顆可見按鈕，但只點名了 {len(WIDE_HEADER_CONTROLS) - 1} 顆"
    )

    got = {sel: metrics(pg, sel) for sel in WIDE_HEADER_CONTROLS}

    heights = {sel: m["h"] for sel, m in got.items()}
    assert max(heights.values()) - min(heights.values()) <= 1, f"header 高度不齊：{heights}"
    assert all(abs(h - HEADER_SIZE) <= 1 for h in heights.values()), f"header 不是 {HEADER_SIZE}px：{heights}"

    fonts = {sel: m["fontSize"] for sel, m in got.items()}
    assert set(fonts.values()) == {HEADER_FONT}, f"header 字級不齊：{fonts}"


def test_unifying_the_header_did_not_make_it_taller(pages):
    """密度原則：這次是視覺整理，不是給版面加預算。32px 是往下收，header 只能變矮。"""
    pg = pages("wide")
    reset(pg)
    height = pg.evaluate(
        "() => Math.round(document.querySelector('.app-header').getBoundingClientRect().height * 10) / 10"
    )
    assert height <= WIDE_HEADER_MAX, f".app-header 長到 {height}px（改動前 {WIDE_HEADER_MAX}）"


def test_the_pin_button_is_no_longer_the_biggest_thing_in_the_row(pages):
    """V3 的另一半：「側掛置頂」一診只按一次，卻是全列最大的一顆。
    它與「設定」同一組 class，降級的作法就是尺寸對齊，不是另立第三種樣式。"""
    pg = pages("wide")
    reset(pg)
    go_dock, settings = metrics(pg, "#go-dock"), metrics(pg, "#settings-toggle")
    assert go_dock["h"] == settings["h"]
    assert go_dock["fontSize"] == settings["fontSize"]
    assert go_dock["background"] == settings["background"]
    tallest = max(metrics(pg, sel)["h"] for sel in WIDE_HEADER_CONTROLS)
    assert go_dock["h"] <= tallest, "「側掛置頂」仍是全列最高的"


# ══════════════════════════════════════════════════════════════════════════
# A 顏色語意：淺藍＝會寫剪貼簿（V1）
# ══════════════════════════════════════════════════════════════════════════
@pytest.mark.parametrize("layout", ["wide", "dock", "mobile"])
def test_the_three_reference_buttons_look_the_same(pages, layout):
    """健保規範條文／Lipid／CCr 是同類三顆（都是「開一個查閱／試算浮層」），
    卻只有 CCr 吃淺藍填色。三套版面都要同款。"""
    pg = pages(layout)
    reset(pg)
    lipid = metrics(pg, "#lipid-btn")
    assert metrics(pg, "#ccr-btn")["background"] == lipid["background"], "CCr 與 Lipid 底色不同"
    assert metrics(pg, "#chronic-btn")["background"] == lipid["background"], "健保規範條文與 Lipid 底色不同"


@pytest.mark.parametrize("layout", ["wide", "dock", "mobile"])
def test_only_the_clipboard_button_wears_the_blue(pages, layout):
    """淺藍（--his-btn）的意思是「按下去會寫剪貼簿」。日期鈕是，CCr 不是。"""
    pg = pages(layout)
    reset(pg)
    date_bg = metrics(pg, "#copy-date")["background"]
    assert date_bg != metrics(pg, "#ccr-btn")["background"], "日期與 CCr 仍是同一個底色"
    assert date_bg not in ("rgba(0, 0, 0, 0)", "transparent"), "日期鈕的淺藍不見了"


# ══════════════════════════════════════════════════════════════════════════
# C 手機日期鈕離開模式列（V2）
# ══════════════════════════════════════════════════════════════════════════
def test_mobile_date_button_is_not_a_fourth_mode(pages):
    """V2：日期鈕原本就在 `.m-mode-row` 裡，而且填滿淺藍，與深藍的「已選中」並排。
    現在它在搜尋列，與「設定」同側；模式列只剩三個模式。"""
    pg = pages("mobile")
    reset(pg)
    assert pg.eval_on_selector(
        "#copy-date", "(el) => !el.closest('.m-mode-row')"
    ), "#copy-date 還在模式分段列裡"
    assert pg.eval_on_selector(
        ".m-mode-row", "(el) => el.querySelectorAll('button').length"
    ) == 3, "模式列不是剛好三顆模式鈕"

    date, search = metrics(pg, "#copy-date"), metrics(pg, "#search")
    assert abs(date["top"] - search["top"]) < 4, f"日期鈕與搜尋框不同列：{date['top']} vs {search['top']}"
    assert date["h"] >= 44, f"日期鈕只有 {date['h']}px（觸控下限 44）"


def test_mobile_search_row_keeps_its_hard_limits(pages):
    """搬一顆鈕進來不得踩到 1b 的兩條硬性邊界，也不得把這一列折成兩列。"""
    pg = pages("mobile")
    reset(pg)
    search = metrics(pg, "#search")
    assert search["h"] >= 44, f"搜尋框只有 {search['h']}px"
    assert float(search["fontSize"].rstrip("px")) >= 16, f"搜尋框字級 {search['fontSize']}（<16 會讓瀏覽器聚焦時放大整頁）"

    def row_is_one_line():
        return pg.evaluate("""() => {
            const row = document.querySelector('.m-head-row');
            const tops = [...row.children].filter((e) => e.offsetParent !== null)
                .map((e) => Math.round(e.getBoundingClientRect().top));
            return {lines: new Set(tops).size, overflow: row.scrollWidth > row.clientWidth + 1};
        }""")

    plain = row_is_one_line()
    assert plain["lines"] == 1 and not plain["overflow"], f"搜尋列折行或溢出：{plain}"

    pg.fill("#search", "E11")                       # 搜尋狀態多一顆「返回」，仍不得折
    pg.wait_for_selector("#search-results .chip", timeout=5000)
    searching = row_is_one_line()
    pg.fill("#search", "")
    assert searching["lines"] == 1 and not searching["overflow"], f"搜尋狀態下搜尋列折行或溢出：{searching}"


# ══════════════════════════════════════════════════════════════════════════
# D 三筆小修正（V5／V7／V8）
# ══════════════════════════════════════════════════════════════════════════
def test_dock_cart_summary_is_not_the_biggest_text_in_the_column(pages):
    """V5：側掛窄欄裡最大的字原本是清單摘要（13px），比真正要點的診斷碼還大。
    它是「已經選好的東西」的回顧，層級要在代碼之下。"""
    pg = pages("dock")
    reset(pg)
    pg.evaluate("() => window.ICDApp.store.addCode('I10', '原發性高血壓')")
    expect(pg.locator(".dock-cart-codes")).to_have_text("I10")
    assert metrics(pg, ".dock-cart-codes")["fontSize"] == "12px"


@pytest.mark.parametrize("layout", ["wide", "mobile"])
@pytest.mark.parametrize("theme", ["light", "dark"])
def test_ghost_clear_button_passes_aa(pages, layout, theme):
    """V7：工作台的「清空」實測 3.81:1，低於 WCAG AA。

    1b 一起測：它與 1a 是同一個缺陷的兩個實例（都是 `.btn-ghost` 坐在淺灰底上，
    實測 3.71:1），稽核沒記到只是因為量的時候清單抽屜是收合的、那顆鈕 0×0。
    1c 不在這裡：它有自己的深底配色（--his-btn，6.76:1），走的是另一條規則。"""
    pg = pages(layout)
    reset(pg)
    pg.evaluate("() => window.ICDApp.store.addCode('I10', '原發性高血壓')")   # 空清單時是 disabled
    if layout == "mobile":
        pg.click("#cart-toggle")                # 抽屜收合時「清空」是 0×0，量不到東西
        expect(pg.locator("#clear-cart")).to_be_visible()
    pg.evaluate("(t) => window.ICDApp.store.setTheme(t)", theme)
    ratio = contrast(pg, "#clear-cart")
    pg.evaluate("() => window.ICDApp.store.setTheme('light')")
    if layout == "mobile":
        pg.click("#cart-toggle")
    assert ratio >= 4.5, f"{layout}／{theme} 主題下「清空」對比只有 {ratio:.2f}:1"


def test_mobile_settings_button_matches_the_row_it_sits_in(pages):
    """V8：同一列裡日期與模式鈕是 14px，只有「設定」是 13px，而那 1px 沒有層級意義。"""
    pg = pages("mobile")
    reset(pg)
    assert metrics(pg, "#settings-toggle")["fontSize"] == "14px"


# ══════════════════════════════════════════════════════════════════════════
# E 慢病速查浮層吃掉視窗寬度（V9）
# ══════════════════════════════════════════════════════════════════════════
def test_wide_chronic_panel_uses_the_window_it_has(pages):
    """V9：1440px 的視窗下浮層只用掉 720px，而出處條號在那個寬度會被裁掉。"""
    pg = pages("wide")
    reset(pg)
    pg.click("#chronic-btn")
    pg.wait_for_selector("#chronic-panel", timeout=5000)
    width = metrics(pg, "#chronic-panel")["width"]
    clipped = pg.evaluate("""() => [...document.querySelectorAll('#chronic-body *')]
        .filter((e) => e.scrollWidth > e.clientWidth + 1).length""")
    pg.evaluate("() => window.ICDApp.store.setChronicTopic(null)")
    assert width >= 1090, f"浮層只有 {width}px 寬"
    assert clipped == 0, f"仍有 {clipped} 個元素在浮層裡被裁掉"
