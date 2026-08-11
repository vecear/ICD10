"""E2E：臨床視覺分層的守門測試（三版面 × 日／夜）。

存在的理由——這一組是**臨床安全**項目，而它們曾經在三個版面各壞過一次，且壞掉的方式
是「靜默」的（CSS 階層把顏色蓋掉，沒有任何錯誤、截圖不細看也發現不了）：

  * `.chip--row`（1b）／`.chip--dock`（1c）的 `border` shorthand 與 `.chip--warn`
    同特異度又在後 → 急診紅旗的警示邊框被整條洗掉。實測 1b 的紅旗邊框對比 1.38（日）／
    1.87（夜），與一般碼**完全相同**；手機不會 hover，所以那條線在真實使用情境下
    永遠不出現。附加碼 chip 在 1b／1c 同樣遺失。
  * `body[data-layout="dock"] .chip--dock:hover`（0,3,0）壓過 `.chip--warn:hover`
    （0,2,0）→ 1c 的紅旗 chip 一 hover 就掉回一般藍底，警示配色剛好在「準備點下去」
    那一刻消失。
  * 非文字元素（框線、虛線、握把）全面低於 WCAG 2.1 SC 1.4.11 的 3:1。
  * `.chip-tag`（附加碼標記）在 1c 被壓到 9px，踩破 docs/dense-ui-principle.md 的
    邊界 #2（≥10px）與邊界 #3（附加碼標記不得弱化）。

對比度一律用 WCAG 2.1 相對亮度公式實算，不看截圖。**解析器必須吃 `color(srgb …)`**：
Chromium 對 `color-mix()` 產生的顏色回傳的是 `color(srgb 0.11 0.12 0.13 / 0.16)` 而不是
`rgba()`，只寫 `rgba?\\(` 的解析器會靜默把所有 divider 邊框算成「對比 1.00」。

`test_contrast_measurement_is_not_vacuous` 是本檔的自我驗證：把當年那條會出事的 CSS
注回去，證明上面這些斷言真的抓得到，不是恆真式。
"""
import http.server
import threading
from functools import partial
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 18499                       # 與 e2e_test.py(18493)／dock(18497)／mobile 錯開

# 版面：名稱 → (store 版面, 視窗, 警示線所在的 border 邊)
LAYOUTS = {
    "wide": ("wide", {"width": 1440, "height": 900}, "top"),
    "dock": ("dock", {"width": 565, "height": 900}, "bottom"),
    "mobile": ("mobile", {"width": 390, "height": 844}, "top"),
}
THEMES = ("light", "dark")
NON_TEXT_MIN = 3.0                 # WCAG 2.1 SC 1.4.11（UI 元件與狀態指示）
TEXT_MIN = 4.5                     # WCAG 2.1 SC 1.4.3


# ── 顏色工具 ────────────────────────────────────────────────────────────────
def parse_color(value):
    """吃 rgb()／rgba()／color(srgb r g b / a)／#hex／transparent，回 (r, g, b, a)。"""
    v = (value or "").strip()
    if not v or v in ("transparent", "none"):
        return (0.0, 0.0, 0.0, 0.0)
    if v.startswith("color("):
        parts = v[v.index("(") + 1:v.rindex(")")].replace("/", " ").split()
        assert parts[0] == "srgb", f"未預期的色彩空間：{v}"
        nums = [float(x) for x in parts[1:]]
        return (nums[0] * 255, nums[1] * 255, nums[2] * 255, nums[3] if len(nums) > 3 else 1.0)
    if v.startswith("rgb"):
        nums = [float(x) for x in v[v.index("(") + 1:v.rindex(")")].replace(",", " ").replace("/", " ").split()]
        return (nums[0], nums[1], nums[2], nums[3] if len(nums) > 3 else 1.0)
    if v.startswith("#"):
        h = v[1:]
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 1.0)
    raise AssertionError(f"無法解析顏色：{value!r}")


def over(fg, bg):
    """把（可能半透明的）fg 疊在不透明的 bg 上。"""
    a = fg[3]
    return (fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1.0)


def luminance(c):
    def ch(x):
        x /= 255.0
        return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2])


def contrast(c1, c2):
    l1, l2 = luminance(c1), luminance(c2)
    hi, lo = max(l1, l2), min(l1, l2)
    return round((hi + 0.05) / (lo + 0.05), 2)


_BG_STACK_JS = """([sel, skipSelf]) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const out = [];
    let node = skipSelf ? el.parentElement : el;
    while (node) {
        out.push(getComputedStyle(node).backgroundColor);
        const c = getComputedStyle(node).backgroundColor;
        const m = c.match(/[\\d.]+/g);
        const a = (c.startsWith('rgba') || c.startsWith('color')) && m ? parseFloat(m[m.length - 1]) : 1;
        if (a >= 1) break;
        node = node.parentElement;
    }
    out.push(getComputedStyle(document.documentElement).backgroundColor, 'rgb(255,255,255)');
    return out;
}"""


def flatten(stack):
    """把由近到遠的背景色堆疊合成成一個不透明色。"""
    acc = parse_color(stack[-1])
    for c in reversed(stack[:-1]):
        acc = over(parse_color(c), acc)
    return acc


def outer_bg(pg, selector):
    stack = pg.evaluate(_BG_STACK_JS, [selector, True])
    assert stack is not None, f"找不到元素：{selector}"
    return flatten(stack)


def inner_bg(pg, selector):
    stack = pg.evaluate(_BG_STACK_JS, [selector, False])
    assert stack is not None, f"找不到元素：{selector}"
    return flatten(stack)


def style_of(pg, selector, prop, pseudo=None):
    return pg.evaluate(
        "([sel, prop, pseudo]) => { const el = document.querySelector(sel);"
        " return el ? getComputedStyle(el, pseudo).getPropertyValue(prop) : null; }",
        [selector, prop, pseudo],
    )


def border_contrast(pg, selector, side):
    """框線色（合成到有效外底之後）與有效外底的對比。"""
    bg = outer_bg(pg, selector)
    line = over(parse_color(style_of(pg, selector, f"border-{side}-color")), bg)
    return contrast(line, bg)


def text_contrast(pg, selector):
    bg = inner_bg(pg, selector)
    fg = over(parse_color(style_of(pg, selector, "color")), bg)
    return contrast(fg, bg)


def token(pg, name):
    return pg.evaluate("(n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()", name)


def same_color(a, b):
    return tuple(round(x, 1) for x in parse_color(a)) == tuple(round(x, 1) for x in parse_color(b))


# ── 前置 ────────────────────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def page_url():
    handler = partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT / "dist"))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{PORT}/icd10.html"
    srv.shutdown()


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch()
        yield b
        b.close()


@pytest.fixture(scope="module")
def pages(browser, page_url):
    """三個版面各開一頁，全庫索引就緒；模組內共用（每個測試自己設模式與主題）。"""
    made = {}
    for name, (layout, viewport, _side) in LAYOUTS.items():
        ctx = browser.new_context(viewport=viewport)
        pg = ctx.new_page()
        pg.goto(page_url)
        pg.wait_for_selector('body[data-ready="1"]', timeout=15000)
        pg.evaluate("(l) => window.ICDApp.store.setLayout(l)", layout)
        pg.wait_for_selector(f'body[data-layout="{layout}"]')
        pg.evaluate("() => window.ICDApp.data.ensureDb()")
        pg.wait_for_selector('body[data-db="ready"]', timeout=30000)
        made[name] = pg
    yield made
    for pg in made.values():
        pg.context.close()


def use(pg, theme, mode="emergency"):
    pg.evaluate("(t) => window.ICDApp.store.setTheme(t)", theme)
    pg.evaluate("(m) => window.ICDApp.store.setMode(m)", mode)
    pg.fill("#search", "")
    pg.evaluate("() => window.ICDApp.store.clearCart()")
    pg.wait_for_timeout(250)


def search(pg, text):
    pg.fill("#search", text)
    pg.wait_for_timeout(350)


# ══════════════════════════════════════════════════════════════════════════
# P0-1 急診紅旗 chip 的警示邊框（三版面 × 日夜，靜止狀態）
# ══════════════════════════════════════════════════════════════════════════
@pytest.mark.parametrize("layout", list(LAYOUTS))
def test_warn_chip_border_uses_warn_token_and_meets_3to1(pages, layout):
    pg = pages[layout]
    side = LAYOUTS[layout][2]
    for theme in THEMES:
        use(pg, theme)
        assert pg.locator(".chip--warn").count() > 0, f"{layout}／{theme}：急診模式看不到任何紅旗 chip，斷言會變成空跑"
        line = style_of(pg, ".chip--warn", f"border-{side}-color")
        want = token(pg, "--warn-line")
        assert same_color(line, want), (
            f"{layout}／{theme}：紅旗 chip 的 border-{side}-color = {line}，"
            f"不是警示色 --warn-line({want})——多半又被某個 .chip--* 幾何規則的 border shorthand 洗掉了"
        )
        width = style_of(pg, ".chip--warn", f"border-{side}-width")
        assert width not in ("0px", ""), f"{layout}／{theme}：紅旗 chip 的 border-{side}-width = {width}，線根本沒畫"
        ratio = border_contrast(pg, ".chip--warn", side)
        assert ratio >= NON_TEXT_MIN, f"{layout}／{theme}：紅旗框對比僅 {ratio}（需 ≥{NON_TEXT_MIN}）"


# ══════════════════════════════════════════════════════════════════════════
# P0-2 附加碼 chip 的警示邊框
# ══════════════════════════════════════════════════════════════════════════
@pytest.mark.parametrize("layout", list(LAYOUTS))
def test_adjunct_chip_border_uses_warn_token_and_meets_3to1(pages, layout):
    pg = pages[layout]
    side = LAYOUTS[layout][2]
    for theme in THEMES:
        use(pg, theme, mode="outpatient")
        search(pg, "B95.6")
        assert pg.locator(".chip--adjunct").count() > 0, f"{layout}／{theme}：搜尋不到附加碼 chip，斷言會變成空跑"
        line = style_of(pg, ".chip--adjunct", f"border-{side}-color")
        want = token(pg, "--warn-line")
        assert same_color(line, want), (
            f"{layout}／{theme}：附加碼 chip 的 border-{side}-color = {line}，不是 --warn-line({want})"
        )
        ratio = border_contrast(pg, ".chip--adjunct", side)
        assert ratio >= NON_TEXT_MIN, f"{layout}／{theme}：附加碼框對比僅 {ratio}（需 ≥{NON_TEXT_MIN}）"
        pg.fill("#search", "")


# ══════════════════════════════════════════════════════════════════════════
# P0-3 紅旗 chip 在 hover 時不得掉回一般配色（1c 曾經一 hover 就變一般藍底）
# ══════════════════════════════════════════════════════════════════════════
@pytest.mark.parametrize("layout", list(LAYOUTS))
def test_warn_chip_keeps_warn_colours_on_hover(pages, layout):
    pg = pages[layout]
    side = LAYOUTS[layout][2]
    for theme in THEMES:
        use(pg, theme)
        chip = pg.locator(".chip--warn").first
        assert chip.count() > 0, f"{layout}／{theme}：沒有紅旗 chip 可 hover"
        chip.hover()
        pg.wait_for_timeout(120)
        bg = style_of(pg, ".chip--warn", "background-color")
        plain_hover = token(pg, "--color-accent-100")
        assert not same_color(bg, plain_hover), (
            f"{layout}／{theme}：紅旗 chip hover 後底色掉成一般碼的 hover 色 {bg}"
            "——滑鼠停在紅旗上正是準備點下去的那一刻，警示配色不得消失"
        )
        assert same_color(bg, token(pg, "--warn-surface")), (
            f"{layout}／{theme}：紅旗 chip hover 底色 = {bg}，應為 --warn-surface"
        )
        line = style_of(pg, ".chip--warn", f"border-{side}-color")
        assert same_color(line, token(pg, "--warn-ink")) or same_color(line, token(pg, "--warn-line")), (
            f"{layout}／{theme}：紅旗 chip hover 後框線 = {line}，不在警示色系內"
        )
        assert border_contrast(pg, ".chip--warn", side) >= NON_TEXT_MIN
        pg.mouse.move(2, 2)


# ══════════════════════════════════════════════════════════════════════════
# P0-4 非文字狀態指示一律 ≥3:1，且文字層不得因此退步
# ══════════════════════════════════════════════════════════════════════════
@pytest.mark.parametrize("layout", list(LAYOUTS))
def test_non_text_indicators_meet_3to1(pages, layout):
    pg = pages[layout]
    side = LAYOUTS[layout][2]
    for theme in THEMES:
        use(pg, theme)
        low = []

        # (a) 急診紅旗框
        r = border_contrast(pg, ".chip--warn", side)
        if r < NON_TEXT_MIN:
            low.append(("紅旗框", r))

        # (b) 不可申報的類目碼虛線
        search(pg, "E11")
        assert pg.locator(".chip.cat").count() > 0, f"{layout}／{theme}：搜尋不到類目碼，斷言會變成空跑"
        assert "dashed" in style_of(pg, ".chip.cat", f"border-{side}-style"), "類目碼的虛線樣式不見了"
        r = border_contrast(pg, ".chip.cat", side)
        if r < NON_TEXT_MIN:
            low.append(("類目虛線", r))
        pg.fill("#search", "")
        pg.wait_for_timeout(200)

        # (c) 清單頂端的主診斷警示帶（附加碼排第一位時才出現）
        pg.evaluate("() => { const s = window.ICDApp.store; s.clearCart();"
                    " s.addCode('B95.61', '甲氧西林敏感性金黃色葡萄球菌'); }")
        pg.wait_for_timeout(300)
        assert pg.get_attribute("#cart", "data-primary-adjunct") == "true", "主診斷警示沒有觸發，斷言會變成空跑"
        band_bg = outer_bg(pg, "#cart")
        band_line = over(parse_color(style_of(pg, "#cart", "border-top-color", "::before")), band_bg)
        r = contrast(band_line, band_bg)
        if r < NON_TEXT_MIN:
            low.append(("警示帶框", r))

        # (d) 可拖曳分隔條的握把（可操作元件）
        grip_bg = outer_bg(pg, ".pane-resizer")
        grip = over(parse_color(style_of(pg, ".pane-resizer", "background-color", "::before")), grip_bg)
        r = contrast(grip, grip_bg)
        if r < NON_TEXT_MIN:
            low.append(("分隔條握把", r))

        assert not low, f"{layout}／{theme} 非文字對比未達 {NON_TEXT_MIN}:1 → " + \
                        "、".join(f"{n} {v}" for n, v in low)
        pg.evaluate("() => window.ICDApp.store.clearCart()")


@pytest.mark.parametrize("layout", list(LAYOUTS))
def test_clinical_text_layer_not_degraded(pages, layout):
    """調高框線對比不得換來文字對比下降（--warn-ink／neutral-700 都不該被動到）。"""
    pg = pages[layout]
    for theme in THEMES:
        use(pg, theme)
        low = []
        r = text_contrast(pg, ".chip--warn b")
        if r < TEXT_MIN:
            low.append(("紅旗代碼字", r))
        search(pg, "E11")
        r = text_contrast(pg, ".chip.cat")
        if r < TEXT_MIN:
            low.append(("類目碼文字", r))
        pg.fill("#search", "")
        search(pg, "B95.6")
        r = text_contrast(pg, ".chip-tag")
        if r < TEXT_MIN:
            low.append(("附加碼標記文字", r))
        pg.fill("#search", "")
        assert not low, f"{layout}／{theme} 文字對比未達 {TEXT_MIN}:1 → " + \
                        "、".join(f"{n} {v}" for n, v in low)


# ══════════════════════════════════════════════════════════════════════════
# P0-5 附加碼標記字級（dense-ui-principle.md 邊界 #2：低於 10px 一律不准）
# ══════════════════════════════════════════════════════════════════════════
@pytest.mark.parametrize("layout", list(LAYOUTS))
def test_adjunct_tag_font_size_at_least_10px(pages, layout):
    pg = pages[layout]
    use(pg, "light", mode="outpatient")
    search(pg, "B95.6")
    assert pg.locator(".chip-tag").count() > 0, f"{layout}：找不到附加碼標記，斷言會變成空跑"
    size = float(style_of(pg, ".chip-tag", "font-size").replace("px", ""))
    assert size >= 10.0, f"{layout}：附加碼標記 {size}px，低於密度原則的 10px 下限（邊界 #2／#3）"
    assert pg.locator(".chip-tag").first.inner_text().strip() == "附加碼"
    pg.fill("#search", "")


# ══════════════════════════════════════════════════════════════════════════
# 自我驗證：把當年那條會出事的 CSS 注回去，證明上面的斷言抓得到
# ══════════════════════════════════════════════════════════════════════════
def test_contrast_measurement_is_not_vacuous(pages):
    """負面驗證，分兩段：

    1. 注入舊版的 `border` shorthand（`.chip--row { border: 1px solid var(--color-divider) }`）
       → 手機紅旗框必須被量到「等於一般碼、對比 <3」，證明 P0-1 的斷言不是恆真式。
    2. 注入舊版的 dock hover（`.chip--dock:hover { background: var(--color-accent-100) }`）
       → 1c 紅旗 hover 必須被量到掉成一般藍底，證明 P0-3 的斷言不是恆真式。
    """
    # (1) 邊框
    pg = pages["mobile"]
    use(pg, "light")
    good = border_contrast(pg, ".chip--warn", "top")
    assert good >= NON_TEXT_MIN
    pg.add_style_tag(content=".chip--row { border: 1px solid var(--color-divider); }")
    pg.wait_for_timeout(120)
    broken_line = style_of(pg, ".chip--warn", "border-top-color")
    broken = border_contrast(pg, ".chip--warn", "top")
    assert not same_color(broken_line, token(pg, "--warn-line")), \
        "注入舊版 shorthand 之後邊框色竟然沒變——量測抓不到這個回歸，斷言等於空跑"
    assert broken < NON_TEXT_MIN, f"注入舊版 shorthand 之後對比仍有 {broken}，量測不靈敏"
    pg.reload()
    pg.wait_for_selector('body[data-ready="1"]', timeout=15000)
    pg.evaluate("() => window.ICDApp.data.ensureDb()")
    pg.wait_for_selector('body[data-db="ready"]', timeout=30000)

    # (2) hover
    pg = pages["dock"]
    use(pg, "light")
    pg.locator(".chip--warn").first.hover()
    pg.wait_for_timeout(120)
    assert same_color(style_of(pg, ".chip--warn", "background-color"), token(pg, "--warn-surface"))
    pg.mouse.move(2, 2)
    pg.add_style_tag(content='body[data-layout="dock"] .chip--dock:hover'
                             " { background: var(--color-accent-100); }")
    pg.locator(".chip--warn").first.hover()
    pg.wait_for_timeout(120)
    assert same_color(style_of(pg, ".chip--warn", "background-color"), token(pg, "--color-accent-100")), \
        "注入舊版 dock hover 之後底色竟然沒掉成 accent-100——P0-3 的斷言抓不到這個回歸"
    pg.mouse.move(2, 2)
    pg.reload()
    pg.wait_for_selector('body[data-ready="1"]', timeout=15000)
    pg.evaluate("() => window.ICDApp.data.ensureDb()")
    pg.wait_for_selector('body[data-db="ready"]', timeout=30000)


ALLOWED_CHIP_LINE_TOKENS = ("--chip-line", "--chip-line-hover", "--warn-line", "--warn-ink", "--line-strong")


def test_layout_css_never_hardcodes_chip_border_colour():
    """靜態守門：版面檔裡任何 `.chip*` 規則的 border 顏色只准引用 --chip-*／警示色 token。

    這是「為什麼會出事」那一層的防線——瀏覽器量測只看得到目前渲染出來的組合，
    而真正的風險是**日後新增一個 chip 變體時又寫死顏色**（三次都是這樣壞的）。
    """
    import re
    for name in ("--chip-line", "--chip-line-hover", "--chip-bg", "--chip-bg-hover", "--chip-code-ink"):
        assert name in (ROOT / "src" / "styles" / "app.css").read_text(encoding="utf-8"), \
            f"app.css 少了 {name}：chip 的顏色慣例被拆掉了，紅旗邊框會再度被幾何規則洗掉"

    offenders = []
    for fname in ("wide.css", "dock.css", "mobile.css"):
        text = re.sub(r"/\*.*?\*/", "", (ROOT / "src" / "styles" / fname).read_text(encoding="utf-8"), flags=re.S)
        for selector, body in re.findall(r"([^{}]+)\{([^{}]*)\}", text):
            if ".chip" not in selector:
                continue
            for decl in body.split(";"):
                m = re.match(r"\s*(border(?:-(?:top|right|bottom|left))?(?:-color)?)\s*:(.+)", decl, re.S)
                if not m:
                    continue
                value = m.group(2)
                if not re.search(r"(#[0-9a-fA-F]{3,8}|rgba?\(|var\(--)", value):
                    continue          # border: 0 / none 之類，沒有顏色
                if any(t in value for t in ALLOWED_CHIP_LINE_TOKENS):
                    continue
                offenders.append(f"{fname}: {selector.strip()} {{ {m.group(1)}:{value.strip()} }}")
    assert not offenders, (
        "版面檔在 chip 規則裡寫死了邊框顏色，紅旗／附加碼的警示色會被 shorthand 洗掉"
        "（見 app.css 的 chip 區塊註解）：\n  " + "\n  ".join(offenders)
    )
