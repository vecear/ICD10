"""E2E（三版面通用）：docs/dense-ui-principle.md 的硬性邊界變成紅燈。

2026-11-03 UX 稽核在側掛浮層找到 9 個 9px 的 class（含「可當天開藥」旗標）、在手機 Lipid
面板找到整片低於 44px 的控制項——都是「當初只量了某一顆」的漏法。這裡不點名元素，
而是把主畫面與每個浮層整片掃一遍：

  (a) 任何情境都不得水平捲動（scrollWidth − clientWidth ＝ 0）
  (b) 可見文字一律 ≥ 10px（「低於 10px 一律不准」）
  (c) 手機寬度下 button／a／input／select／textarea／summary／label[for] 的觸控矩形 ≥ 44×44。
      豁免：行內文字連結（display:inline 的 <a>，WCAG 2.5.8 的行內例外）；
      勾選框／單選鈕量的是包住它的 <label>（那才是手指按的靶）；label[for] 只量指向勾選框／
      單選鈕的那種——指向文字欄位的標籤只是說明文字，靶是欄位本身（它照樣要 ≥ 44）；
      `#panels .chip` 另外量：列高 ≥ 44、中文名不截斷且最多兩行（2026-11-03 起可換行）。

新增浮層時把它加進 SCENARIOS，就會自動受這三條約束。
"""
from pathlib import Path

import pytest

import e2e_common as ec

ROOT = Path(__file__).resolve().parent.parent

LAYOUTS = {
    "wide": dict(viewport={"width": 1440, "height": 900}),
    "dock": dict(viewport={"width": 340, "height": 900}),
    "mobile": dict(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True),
}


def _base(pg):
    pass


def _chronic(pg):
    pg.click("#chronic-btn")
    pg.wait_for_selector("#chronic-panel", state="visible")


def _lipid(pg):
    pg.click("#lipid-btn")
    pg.wait_for_selector("#lipid-panel", state="visible")
    for key, val in [("age", "60"), ("ldl", "180"), ("tg", "300"), ("hdl", "35")]:
        pg.fill(f"#lipid-{key}", val)
    pg.check("#lipid-dm")
    pg.fill("#lipid-drug", "crestor")       # 品項命中才會出現表一／表二徽章


def _ccr(pg):
    pg.click("#ccr-btn")
    pg.wait_for_selector("#ccr-panel", state="visible")
    for key, val in [("age", "72"), ("weight", "58"), ("cr", "1.6")]:
        pg.fill(f"#ccr-{key}", val)


def _vac(pg):
    pg.click("#vac-btn")
    pg.fill("#vac-search", "HPV")
    pg.locator("#vac-results summary").first.click()


def _am(pg):
    pg.click("#am-btn")
    pg.fill("#am-search", "Zavicefta")
    pg.locator(".am-card > summary").first.click()


def _date(pg):
    pg.click("#date-calc-btn")
    pg.get_by_label("天數", exact=True).fill("7")


def _settings(pg):
    pg.click("#settings-toggle")


def _clipboard(pg):
    pg.click("#settings-toggle")
    pg.click("#clipboard-open")


# (名稱, 開啟動作, 掃描範圍)
SCENARIOS = [
    ("base", _base, "body"),
    ("chronic", _chronic, "#chronic-panel"),
    ("lipid", _lipid, "#lipid-panel"),
    ("ccr", _ccr, "#ccr-panel"),
    ("vac", _vac, "#vac-panel"),
    ("am", _am, "#am-panel"),
    ("date", _date, "#date-calc-panel"),
    ("settings", _settings, "#settings-popover"),
    ("clipboard", _clipboard, "#settings-popover"),
]

SCAN = r"""({scope, touch}) => {
  const root = document.querySelector(scope);
  const vis = (e) => { const r = e.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return false;
    const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
  const sig = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') +
    (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const ownText = (e) => [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
  const all = [root, ...root.querySelectorAll('*')].filter(vis);
  const small = [];
  for (const e of all) {
    const t = ownText(e); if (!t) continue;
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs < 10) small.push(sig(e) + ' ' + fs + 'px「' + t.slice(0, 12) + '」');
  }
  const tiny = []; const chips = [];
  if (touch) {
    for (const e of root.querySelectorAll('button, a, input, select, textarea, summary, label[for], [role=button]')) {
      if (!vis(e) || e.type === 'hidden') continue;
      if (e.tagName === 'LABEL') {
        const target = document.getElementById(e.htmlFor);
        if (!target || !/^(checkbox|radio)$/.test(target.type)) continue;
      }
      if (e.closest('#panels') && e.classList.contains('chip')) {
        const r = e.getBoundingClientRect(); const zh = e.querySelector('.chip-zh');
        const cs = zh && getComputedStyle(zh);
        const lines = zh ? Math.round(zh.getBoundingClientRect().height / parseFloat(cs.lineHeight)) : 1;
        const cut = zh && zh.scrollWidth > zh.clientWidth + 1;
        if (r.height < 43.5 || lines > 2 || cut) chips.push(sig(e) + ' ' + e.dataset.code + ' h=' + Math.round(r.height) + ' lines=' + lines + (cut ? ' 截斷' : ''));
        continue;
      }
      if (e.tagName === 'A' && getComputedStyle(e).display === 'inline') continue;
      let box = e;
      if (e.tagName === 'INPUT' && (e.type === 'checkbox' || e.type === 'radio')) box = e.closest('label') || e;
      const r = box.getBoundingClientRect();
      if (r.width < 43.5 || r.height < 43.5) tiny.push(sig(e) + ' ' + Math.round(r.width) + '×' + Math.round(r.height));
    }
  }
  return {
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    small: [...new Set(small)], tiny: [...new Set(tiny)], chips: chips.slice(0, 10),
  };
}"""


def _open(browser, layout):
    ctx = browser.new_context(permissions=["clipboard-read", "clipboard-write"], **LAYOUTS[layout])
    pg = ctx.new_page()
    pg.goto((ROOT / "dist" / "icd10.html").as_uri())
    pg.wait_for_selector('body[data-ready="1"]', timeout=8000)
    if layout == "dock":
        pg.evaluate("() => window.ICDApp.store.setLayout('dock')")
    if layout == "mobile":
        # 主畫面全展開：讓每一個代碼列都受「≤ 兩行」檢查，而不是只有預設那幾列
        btn = pg.locator("#expand-all-panels")
        if btn.is_visible() and "全展開" in btn.inner_text():
            btn.click()
    return ctx, pg


@pytest.mark.parametrize("layout", list(LAYOUTS))
@pytest.mark.parametrize("name,open_fn,scope", SCENARIOS, ids=[s[0] for s in SCENARIOS])
def test_hard_bounds(browser, layout, name, open_fn, scope):
    ctx, pg = _open(browser, layout)
    try:
        open_fn(pg)
        ec.next_frames(pg)      # 側掛的 fitDockRows 由 ResizeObserver 在影格裡觸發
        results = []
        if name == "chronic":
            # 每個主題分頁各掃一次：9px 徽章當初只出現在 LIPID 分頁
            for i in range(pg.locator("[id^=chronic-tab-]").count()):
                pg.locator("[id^=chronic-tab-]").nth(i).click()
                results.append(pg.evaluate(SCAN, {"scope": scope, "touch": layout == "mobile"}))
        else:
            results.append(pg.evaluate(SCAN, {"scope": scope, "touch": layout == "mobile"}))
        for r in results:
            assert r["overflow"] == 0, f"{layout}/{name} 水平溢出 {r['overflow']}px"
            assert not r["small"], f"{layout}/{name} 有 < 10px 的可見文字：{r['small']}"
            assert not r["tiny"], f"{layout}/{name} 觸控目標 < 44×44：{r['tiny']}"
            assert not r["chips"], f"{layout}/{name} 代碼列低於 44px、中文名被截斷或超過兩行：{r['chips']}"
    finally:
        ctx.close()
