"""三套版面（1a 工作台／1c 側掛窄欄／1b 手機）E2E 共用的常數、開頁、歸零與等待。

原本 e2e_test.py、test_e2e_dock.py、test_e2e_mobile.py 各複製一份；改一處忘了另外兩處，
是三版面行為悄悄分岔的來源。chromium 行程由 conftest 的 `browser` fixture 共用，
context 仍由各檔 module 級 fixture 自己建（localStorage 隨 context 走，檔與檔互不污染）。
"""
import time
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

ROOT = Path(__file__).resolve().parent.parent

WIDE = {"width": 1440, "height": 900}
DOCK = {"width": 176, "height": 900}
MOBILE = {"width": 390, "height": 844}
VIEWPORT = {"wide": WIDE, "dock": DOCK, "mobile": MOBILE}
LAYOUTS = ("wide", "dock", "mobile")

PIP_PROBE = ("() => typeof window.documentPictureInPicture === 'object'"
             " && window.documentPictureInPicture !== null"
             " && typeof window.documentPictureInPicture.requestWindow === 'function'")

CLIPBOARD_PERMISSIONS = ["clipboard-read", "clipboard-write"]


# ---- 開 context／頁面 ----
def new_context(browser, layout, **extra):
    """該版面的標準 context。手機是真手機條件：is_mobile＋has_touch（hover 不存在，觸控目標才是重點）。"""
    opts = {"viewport": dict(VIEWPORT[layout]), "permissions": list(CLIPBOARD_PERMISSIONS)}
    if layout == "mobile":
        opts.update(is_mobile=True, has_touch=True, device_scale_factor=2)
    opts.update(extra)
    return browser.new_context(**opts)


def open_ready_page(ctx, page_url, layout=None, db=True):
    """開一頁到可互動；layout="dock" 時用 store 切到側掛；db=True 時等全庫索引就緒。

    全庫是延遲載入：「類目碼不可加入」等測試若在 index 未就緒時跑，測到的是建置期
    白名單而不是葉碼防呆（impl-plan R-4），所以主測試頁一律先把全庫拉起來。
    版面偏好用 store 設定而不是點 UI：切版面本身另有測試走完整的使用者路徑。
    """
    pg = ctx.new_page()
    pg.goto(page_url)
    pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
    if layout == "dock":
        pg.evaluate("() => window.ICDApp.store.setLayout('dock')")
        pg.wait_for_selector('body[data-layout="dock"]')
    if db:
        pg.evaluate("() => window.ICDApp.data.ensureDb().then(() => null)")
        pg.wait_for_selector('body[data-db="ready"]', timeout=30000)
    return pg


def open_fresh_page(ctx, page_url):
    """剛開機（全庫尚未載入）、localStorage 乾淨的頁面；呼叫端自己 goto、自己 close。

    清儲存不能用 add_init_script：那是「每次導覽都會跑」，測持久化的測試一 reload
    就把剛寫進去的 favs／layout 洗掉。改成先開一頁把同源的儲存清乾淨再關掉。
    （另注意 add_init_script 收的是指令碼本體，不是函式運算式——傳 `() => {…}`
    只會建出一個沒人呼叫的箭頭函式而靜默失效。）
    """
    scrub = ctx.new_page()
    scrub.goto(page_url)
    scrub.evaluate("() => { try { localStorage.clear(); } catch (e) {} }")
    scrub.close()
    return ctx.new_page()


# ---- 歸零 ----
_RESET_STORE = """(layout) => {
    const s = window.ICDApp.store;
    s.clearCart();
    s.setMode('outpatient');
    s.setRegion(0);          // 取消選取（region=null）會跨模式保留，這裡明確歸位
    s.setQuery('');
    if (layout === 'mobile') s.setFormat('lines');
    s.setSettingsOpen(false);
    s.setChronicTopic(null); // 慢病速查浮層蓋住整個工作區；殘留會讓後面所有點擊被它攔截
    if (layout === 'dock') s.setCcrOpen(false);   // 同理：CCr 面板留著開，下一條測試的點擊全部被遮罩吃掉
    s.setLipidOpen(false);   // 同理：血脂試算面板也是全幅浮層
    if (layout === 'dock') { s.setCartOpen(true); s.setTheme('light'); }
    s.resetPaneSizes();      // 窗格高度也會寫 localStorage，殘留會讓其他測試量到別條測試拖出來的高度
    /* favs／recent 會寫進 localStorage 而跨測試殘留（常用列上的 chip 會變成 DOM 中
       第一個 .chip[data-code=X]），所以一併清掉，讓每條測試的定位子都是確定的。 */
    s.setState(layout === 'wide'
        ? { favs: [], recent: [], expanded: {}, quickOpen: {}, copied: false }
        : { favs: [], recent: [], expanded: {}, copied: false });
}"""

# 1a：血脂試算的輸入是**存在 DOM 裡**的（刻意不進 store：那是這一位病人的資料）。
_RESET_DOM_WIDE = """() => {
    /* store 重設不會碰它們，所以上一條測試填的 LDL-C、勾的病史、打的品項查詢
       會原樣留給下一條——實測讓「沒有病人資料時不下判定」那條測試在整批跑時變紅，
       單獨跑卻是綠的。這一類假紅／假綠比測試本身更貴，所以在這裡一次清乾淨。 */
    document.querySelectorAll('.lipid-input').forEach((n) => { n.value = ''; });
    document.querySelectorAll('[data-lipid-key]').forEach((n) => { n.checked = false; });
    /* 品項清單的開合狀態也是模組層的暫態（計算機與條文分頁共用），
       不清會漏到下一條測試——同上，這類假紅燈比測試本身更貴。 */
    if (window.ICDRender && window.ICDRender.lipidResetOpenGroups) {
        window.ICDRender.lipidResetOpenGroups();
    }
}"""

# 1c：CCr 的輸入值刻意不進 store（那是「這一位病人」的暫態），所以 store 的 reset
# 清不掉它們——測試之間要自己清，否則上一條的體重會被下一條算進去。
_RESET_DOM_DOCK = """() => {
    for (const id of ['ccr-age', 'ccr-weight', 'ccr-height', 'ccr-cr']) {
        const el = document.getElementById(id);
        if (el) el.value = '';
    }
    const male = document.querySelector('.ccr-sex-btn[data-ccr-sex="male"]');
    const female = document.querySelector('.ccr-sex-btn[data-ccr-sex="female"]');
    if (male && female) {
        male.setAttribute('aria-pressed', 'true');
        male.classList.add('is-on');
        female.setAttribute('aria-pressed', 'false');
        female.classList.remove('is-on');
    }
    /* 血脂試算：數值與勾選同樣不進 store（都是「這一位病人」的暫態），
       殘留會讓下一條測試算進上一位病人的病史。 */
    for (const id of ['lipid-age', 'lipid-ldl', 'lipid-tc', 'lipid-hdl', 'lipid-tg']) {
        const el = document.getElementById(id);
        if (el) el.value = '';
    }
    for (const box of document.querySelectorAll('[data-lipid-key]')) box.checked = false;
    const lm = document.querySelector('.lipid-sex-btn[data-lipid-sex="male"]');
    const lf = document.querySelector('.lipid-sex-btn[data-lipid-sex="female"]');
    if (lm && lf) {
        lm.setAttribute('aria-pressed', 'true');
        lm.classList.add('is-on');
        lf.setAttribute('aria-pressed', 'false');
        lf.classList.remove('is-on');
    }
    const mrow = document.querySelector('[data-lipid-row="menopause"]');
    if (mrow) mrow.hidden = true;
}"""


def reset(pg, layout):
    """回到乾淨起點：空清單、門診模式、無搜尋、無最愛／最近、全部收合、浮層全關。

    三版面共用 store 的部分；各版面只多清自己畫面上「不進 store 的暫態」。
    """
    pg.evaluate(_RESET_STORE, layout)
    if layout == "wide":
        pg.evaluate(_RESET_DOM_WIDE)
    pg.fill("#search", "")
    if layout == "dock":
        pg.evaluate(_RESET_DOM_DOCK)
    if layout == "mobile" and pg.locator("#cart-sheet").is_visible():
        pg.click("#cart-toggle")


# ---- 等待（取代寫死的 wait_for_timeout） ----
def search(pg, text):
    """輸入搜尋字並等 debounce 結束（store.query 等於輸入值；store 變動後重繪是同步的）。"""
    pg.fill("#search", text)
    wait_query(pg, text)


def wait_query(pg, text, timeout=3000):
    pg.wait_for_function("(q) => window.ICDApp.store.getState().query === q", arg=text, timeout=timeout)


def wait_until(pg, fn, message, timeout=3000, interval=25):
    """Python 端輪詢到 fn() 為真；逾時就以 message 失敗。用在 DOM 讀不到、要從 Python 判斷的條件。"""
    deadline = time.monotonic() + timeout / 1000
    while True:
        value = fn()
        if value:
            return value
        if time.monotonic() > deadline:
            raise AssertionError(f"{message}（等了 {timeout}ms）")
        pg.wait_for_timeout(interval)


def settle(pg, fn, ok, timeout=3000, interval=25):
    """輪詢 fn() 直到 ok(值) 成立或逾時，回傳最後一次的值，由呼叫端照原樣斷言（失敗訊息不變）。

    取代「寫死等 200ms 再讀」：條件一成立就往下走，機器忙時最多等到 timeout。
    """
    deadline = time.monotonic() + timeout / 1000
    while True:
        value = fn()
        if ok(value) or time.monotonic() > deadline:
            return value
        pg.wait_for_timeout(interval)


def next_frames(pg):
    """等兩個繪製影格：ResizeObserver（側掛的 fitDockRows、窗格夾值）在影格裡送出，
    改完視窗大小後直接量幾何前用這個，而不是寫死等幾百毫秒。

    rAF 在頁面沒有合成畫面時不觸發（背景分頁、未顯示的視窗），所以併掛 setTimeout，先到者為準。
    """
    pg.evaluate("""() => new Promise((resolve) => {
        let done = false;
        const finish = () => { if (!done) { done = true; resolve(); } };
        requestAnimationFrame(() => requestAnimationFrame(finish));
        setTimeout(finish, 100);
    })""")


PINNED_IS = "(want) => window.ICDApp.store.getState().pinned === want"


def open_pip(ctx, page, selector="#pin-toggle", clicker=None, timeout=5000):
    """點「置頂」（或「側掛置頂」）並等小視窗開出、側欄搬進去（store.pinned 變 true）。

    回傳這次新開的頁面清單；沒開出來就回空清單，交給呼叫端照原本的斷言與訊息判定。
    取代原本的「點完寫死等 1500ms 再數 ctx.pages」。
    """
    before = set(ctx.pages)
    try:
        with ctx.expect_page(timeout=timeout):
            (clicker or page).click(selector)
        page.wait_for_function(PINNED_IS, arg=True, timeout=timeout)
    except PlaywrightTimeoutError:
        pass
    return [p for p in ctx.pages if p not in before]


def wait_unpinned(page, timeout=5000):
    """小視窗關掉後 pagehide → restoreFromPip 是同步跑完的，它最後才把 store.pinned 設回 false。"""
    page.wait_for_function(PINNED_IS, arg=False, timeout=timeout)


def clipboard(pg):
    """Windows 的剪貼簿會把 \\n 正規化成 \\r\\n（OS／瀏覽器行為），比對前先還原。"""
    return pg.evaluate("() => navigator.clipboard.readText()").replace("\r\n", "\n")


_CLIP_SENTINEL = "⁣e2e-clipboard-armed"


def arm_clipboard(pg):
    """在觸發複製前放一個哨兵值；之後 await_clipboard 等到它被換掉，就知道這次複製寫入了。

    navigator.clipboard.writeText 是非同步的，點完立刻讀可能讀到上一次的內容；
    寫死等 200ms 則是機器忙時等不夠、機器快時白等。
    """
    pg.evaluate("(s) => navigator.clipboard.writeText(s)", _CLIP_SENTINEL)


def await_clipboard(pg, timeout=3000):
    text = wait_until(
        pg,
        lambda: (lambda t: t if t != _CLIP_SENTINEL else None)(clipboard(pg)),
        "觸發複製後剪貼簿一直沒有被寫入",
        timeout=timeout,
    )
    return text


def doc_overflow(pg):
    return pg.evaluate("""() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        bodyScrollW: document.body.scrollWidth,
    })""")


def assert_no_hscroll(pg, label):
    m = doc_overflow(pg)
    assert m["scrollW"] <= m["clientW"], f"{label}：文件水平溢出 {m['scrollW']} > {m['clientW']}"
    assert m["bodyScrollW"] <= m["clientW"], f"{label}：body 水平溢出 {m['bodyScrollW']} > {m['clientW']}"


# ══════════════════════════════════════════════════════════════════════════
# 三版面各抄一份的檢查（a11y 4 條、窗格高度 5 條、id 唯一）改成同一份程式碼。
# 差異只剩下面的規格表：容器 id、分隔條負責哪些窗格、各自的門檻。
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


def pane_h(pg, selector):
    return pg.evaluate("(sel) => document.querySelector(sel).getBoundingClientRect().height", selector)


def sep_for(pg, pane_id):
    return pg.locator(f'.pane-resizer[aria-controls="{pane_id}"]')


def drag_pane(pg, pane_id, dy):
    """用滑鼠拖分隔條。Chromium 的 mouse 事件同時產生 pointer 事件，走的是實作那條路。

    放開滑鼠時 resize.js 同步套用並寫 store（pointerup 處理器裡沒有排程），不必再等。
    """
    b = sep_for(pg, pane_id).bounding_box()
    x, y = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
    pg.mouse.move(x, y)
    pg.mouse.down()
    pg.mouse.move(x, y + dy, steps=6)
    pg.mouse.up()


def fill_panes(pg, layout):
    """讓該版面所有分隔條都出現（沒東西可調時分隔條是藏起來的）。

    1a：中欄要有搜尋結果、右欄要有清單；1c：加一個碼，清單區才出現；
    1b：加一個碼並展開清單抽屜。一律用 click（手機見 test_e2e_mobile.touch_drag 的註記）。
    """
    if layout == "wide":
        search(pg, "急性")
        chips = "#panels"
    elif layout == "dock":
        chips = "#dock-panels"
    else:
        chips = "#panels"
    pg.locator(f'{chips} .chip[data-code]:not(.cat)').first.click()
    pg.wait_for_selector("#cart li", state="attached")
    if layout == "mobile" and pg.locator("#cart-sheet").is_hidden():
        pg.click("#cart-toggle")
        pg.wait_for_selector("#cart-sheet", state="visible")


def addable_codes(pg, scope, n):
    """區塊內前 n 個「不重複、可加入」的代碼，給測試用 data-code 定位。

    不用 .nth(i)：同一個碼可能同時出現在兩個面板（nth(0)／nth(1) 會點到同一個碼），
    面板順序又是資料決定的（使用者裁定「預設選取靠資料順序」），資料一增就位移。
    """
    codes = pg.eval_on_selector_all(
        f"{scope} .chip[data-code]:not(.cat)",
        "(els) => [...new Set(els.map((e) => e.dataset.code))]")
    assert len(codes) >= n, f"{scope} 只有 {len(codes)} 個可加入的代碼，不夠 {n} 個"
    return codes[:n]


def chip(pg, scope, code):
    return pg.locator(f'{scope} .chip[data-code="{code}"]').first


# 窗格規格。sign=+1：分隔條在窗格下方（往下拖變高）；-1：分隔條在窗格上方（往上拖變高）。
PANE_SPEC = {
    "wide": {
        "label": "1a 工作台",
        "count": 2,
        "hidden_until_filled": ("search-results", "cart-box"),
        "always_visible": (),
        "primary": {"id": "search-results", "key": "results", "sign": +1, "drag": -70, "min_delta": 40},
        "secondary": {"id": "cart-box", "sign": +1, "drag": 90, "min_delta": 40},
        "reload_drag": -60,
    },
    "dock": {
        "label": "1c 側掛窄欄",
        "count": 2,
        "hidden_until_filled": ("cart-inline",),
        "always_visible": ("region-pills",),
        "primary": {"id": "region-pills", "key": "regions", "sign": +1, "drag": -50, "min_delta": 30},
        "secondary": {"id": "cart-inline", "sign": -1, "drag": -60, "min_delta": 30},
        "reload_drag": -40,
    },
    "mobile": {
        "label": "1b 手機",
        "count": 1,
        "hidden_until_filled": ("cart-sheet",),
        "always_visible": (),
        "primary": {"id": "cart-sheet", "key": "sheet", "sign": -1, "drag": -60, "min_delta": 30},
        "secondary": None,
        "reload_drag": -70,
    },
}

# a11y 規格：主內容地標要包住／不得包住的區塊、部位列的容器與按鈕 class、sr-only 標題。
A11Y_SPEC = {
    "wide": {
        "label": "1a 工作台",
        "main_has": ("panels", "search-results"),
        "main_lacks": ("region-rail", "cart"),
        "regions": "#region-rail",
        "region_btn": ".region-btn",
        "sr_only": ("h1", "h2"),
    },
    "dock": {
        "label": "1c 側掛窄欄",
        "main_has": ("dock-panels", "search-results"),
        "main_lacks": ("region-pills", "cart"),
        "regions": "#region-pills",
        "region_btn": ".region-btn",
        "sr_only": ("h1", "h2", "#panels-title"),
    },
    "mobile": {
        "label": "1b 手機",
        "main_has": ("panels", "search-results"),
        "main_lacks": ("region-pills", "cart"),
        "regions": "#region-pills",
        "region_btn": ".region-pill",
        "sr_only": ("h1", "h2", "#panels-title"),
    },
}

DUPLICATE_IDS_JS = """() => {
    const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
    return {
        total: ids.length, uniq: new Set(ids).size,
        dups: ids.filter((v, i) => ids.indexOf(v) !== i),
        roots: ['layout-wide', 'layout-dock', 'layout-mobile']
            .filter((id) => document.getElementById(id)),
    };
}"""


def assert_unique_ids(pg, layout, tag):
    """契約：同一時刻只掛一套版面，所以 #search／#cart 等 id 必須全域唯一。

    歷史上真的發生過兩套版面同時掛載、產生 10 組重複 id 的 Critical，
    而重複 id 只會讓 querySelector 悄悄選到殘留的那套。
    """
    result = pg.evaluate(DUPLICATE_IDS_JS)
    assert result["total"] == result["uniq"], f"{layout}／{tag}：重複 id {result['dups']}"
    assert result["roots"] == [f"layout-{layout}"], f"{layout}／{tag}：掛載中的版面是 {result['roots']}"
    assert result["total"] > 10, f"{layout}／{tag}：只掃到 {result['total']} 個 id，選擇器可能失效"
