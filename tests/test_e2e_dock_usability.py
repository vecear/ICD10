"""本次窄欄工作流程：鍵盤、全文辨識、個人常用與剪貼簿重送。"""
from pathlib import Path
import pytest
from playwright.sync_api import sync_playwright, expect

URL = (Path(__file__).resolve().parents[1] / 'dist/icd10.html').as_uri()


@pytest.fixture(scope='module')
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch()
        yield b
        b.close()


def open_page(browser, width=340, layout='dock'):
    page = browser.new_page(viewport={'width': width, 'height': 900})
    page.set_default_timeout(4000)
    page.add_init_script(f"localStorage.setItem('icd10.layout', JSON.stringify('{layout}'))")
    # 僅攔截 OS 寫入，驗證應用程式狀態與送出內容，不影響使用者剪貼簿。
    page.add_init_script("""window.writes=[]; Object.defineProperty(navigator,'clipboard', {
      value: { writeText: async text => { window.writes.push(text); } } });""")
    page.goto(URL)
    page.wait_for_selector('body[data-ready="1"]')
    page.evaluate('ICDApp.data.ensureDb()')
    return page


@pytest.mark.parametrize('width,layout', [(340,'dock'), (1440,'wide'), (390,'wide')])
def test_keyboard_selection_continuation_and_ime(browser, width, layout):
    page = open_page(browser, width, layout)
    search = page.locator('#search')
    search.fill('蜂窩')
    rows = page.locator('#search-results .chip:not(.cat)')
    expect(rows.first).to_be_visible()
    first = rows.nth(0).get_attribute('data-code')
    second = rows.nth(1).get_attribute('data-code')
    search.press('ArrowDown')
    expect(rows.nth(1)).to_have_attribute('data-search-active', 'true')
    search.press('Shift+Enter')
    expect(search).to_have_value('蜂窩')
    assert page.evaluate('ICDApp.store.getState().cart.map(x=>x.code)') == [second]
    search.dispatch_event('keydown', {'key':'Enter', 'isComposing': True})
    assert page.evaluate('ICDApp.store.getState().cart.length') == 1
    search.press('ArrowUp')
    search.press('Enter')
    expect(search).to_have_value('')
    assert first in page.evaluate('ICDApp.store.getState().cart.map(x=>x.code)')
    page.locator('#copy-date').focus()
    page.keyboard.press('/')
    expect(search).to_be_focused()
    page.close()


def test_copy_date_marks_other_content_and_resends_entire_cart(browser):
    page = open_page(browser)
    for code in ['I10', 'E11.9']:
        page.locator('#search').fill(code)
        page.locator('#search').press('Enter')
    page.locator('#copy-date').click()
    status = page.locator('#clipboard-sync')
    expect(status).to_contain_text('日期')
    expect(status).to_contain_text('重送')
    status.click()
    expect(status).to_contain_text('已同步')
    assert page.evaluate('writes.at(-1)') == 'I10\nE11.9'
    page.locator('#clear-cart').click()
    expect(status).to_be_hidden()
    page.close()


@pytest.mark.parametrize('width', [176,340,565])
def test_dock_names_are_complete_and_short_rows_stay_dense(browser, width):
    page = open_page(browser, width)
    page.evaluate("document.documentElement.style.setProperty('--dock-w', '565px')")
    page.wait_for_timeout(150)
    clipped = page.locator('#dock-panels .chip-zh').evaluate_all('es => es.filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent)')
    assert clipped == [], clipped
    assert page.locator('body').evaluate('(e)=>e.scrollWidth<=innerWidth')
    if width == 340:
        short = page.locator('#dock-panels .chip[data-code="I10"]').first.bounding_box()
        assert short['width'] < 200, '短名稱保留並列，不能整頁改成單欄'
    page.close()


def test_favorites_access_order_and_recent_are_separate(browser):
    page = open_page(browser)
    for code in ['I10', 'E11.9']:
        page.locator('#search').fill(code)
        page.locator('#search').press('Enter')
        page.locator(f'#cart li[data-code="{code}"] .cart-fav').click()
    page.locator('#dock-favorites-toggle').click()
    expect(page.locator('#dock-favorites')).to_be_visible()
    favorites = page.locator('#dock-favorites [data-favorite-row]')
    assert favorites.count() == 2
    before = page.evaluate('ICDApp.store.getState().favs')
    favorites.nth(1).get_by_role('button', name='往前移').click()
    assert page.evaluate('ICDApp.store.getState().favs') == list(reversed(before))
    page.locator('#clear-cart').click()
    page.locator('#dock-favorites .chip').first.click()
    assert page.evaluate('ICDApp.store.getState().cart.length') == 1
    assert page.evaluate('ICDApp.store.getState().favs') == list(reversed(before))
    page.reload()
    page.wait_for_selector('body[data-ready="1"]')
    assert page.evaluate('ICDApp.store.getState().favs') == list(reversed(before))
    page.close()


def test_side_filter_keeps_query_and_restricts_results(browser):
    page = open_page(browser)
    page.locator('#search').fill('蜂窩')
    page.locator('[data-search-side="右側"]').click()
    expect(page.locator('#search')).to_have_value('蜂窩 右側')
    expect(page.locator('#search')).to_be_focused()
    labels = page.locator('#search-results .chip-zh').all_text_contents()
    assert labels and all('右' in s for s in labels)
    page.close()


def test_side_switch_and_empty_results_keep_clear_filter(browser):
    page = open_page(browser)
    page.locator('#search').fill('蜂窩 右')
    page.locator('[data-search-side="左側"]').click()
    expect(page.locator('#search')).to_have_value('蜂窩 左側')
    page.locator('#search').fill('L03.111')
    page.locator('[data-search-side="左側"]').click()
    expect(page.locator('#search-results')).to_contain_text('查無結果')
    page.locator('[data-search-side=""]').click()
    expect(page.locator('#search')).to_have_value('L03.111')
    expect(page.locator('#search-results .chip[data-code="L03.111"]')).to_be_visible()
    page.close()


def test_open_settings_does_not_allow_search_enter_to_add_code(browser):
    page = open_page(browser)
    page.locator('#search').fill('蜂窩')
    expect(page.locator('#search-results .chip').first).to_be_visible()
    page.locator('#settings-toggle').click()
    page.locator('#search').focus()
    page.locator('#search').press('Enter')
    assert page.evaluate('ICDApp.store.getState().cart.length') == 0
    page.close()


def test_clipboard_fallback_preserves_search_focus(browser):
    page = open_page(browser)
    page.evaluate("""() => {
      navigator.clipboard.writeText = async () => { throw Error('denied'); };
      document.execCommand = cmd => cmd === 'copy';
    }""")
    search = page.locator('#search')
    search.fill('蜂窩')
    expect(page.locator('#search-results .chip').first).to_be_visible()
    search.press('Shift+Enter')
    expect(search).to_be_focused()
    expect(page.locator('#clipboard-sync')).to_contain_text('已同步')
    page.close()


def test_same_mode_returns_from_favorites_to_panels(browser):
    page = open_page(browser)
    page.locator('#dock-favorites-toggle').click()
    expect(page.locator('#dock-favorites')).to_be_visible()
    page.locator('#mode-switch [data-mode="outpatient"]').click()
    expect(page.locator('#dock-favorites')).to_be_hidden()
    expect(page.locator('#dock-panels')).to_be_visible()
    page.close()


def test_clipboard_write_order_failure_and_single_code(browser):
    page = open_page(browser)
    page.locator('#search').fill('I10')
    page.locator('#search').press('Enter')
    expect(page.locator('#clipboard-sync')).to_contain_text('已同步')
    page.evaluate("""() => {
      window.resolveCopy=null;
      navigator.clipboard.writeText = text => new Promise(resolve => {
        window.resolveCopy = () => { writes.push(text); resolve(); };
      });
      ICDInteractions.copyText('date-test', false, '日期');
    }""")
    page.wait_for_function('!!window.resolveCopy')
    page.locator('#clipboard-sync').click()
    page.evaluate('resolveCopy()')
    page.wait_for_function("writes.at(-1) === 'date-test'")
    page.wait_for_function("ICDInteractions.clipboardSyncInfo().pending")
    page.evaluate('resolveCopy()')
    expect(page.locator('#clipboard-sync')).to_contain_text('已同步')
    assert page.evaluate('writes.at(-1)') == 'I10'
    page.evaluate("navigator.clipboard.writeText = async text => { writes.push(text); }")
    page.locator('#cart .cart-code').click()
    expect(page.locator('#clipboard-sync')).to_contain_text('單一診斷')
    page.evaluate("""() => {
      navigator.clipboard.writeText = async () => { throw Error('denied'); };
      document.execCommand = () => false;
    }""")
    page.locator('#clipboard-sync').click()
    expect(page.locator('#clipboard-sync')).to_contain_text('未同步')
    expect(page.locator('#copy-recovery')).to_be_visible()
    expect(page.locator('#fallback-copy')).to_be_hidden()
    page.locator('#copy-manual').click()
    expect(page.locator('#fallback-copy')).to_be_visible()
    page.close()


def test_obsolete_clipboard_failure_does_not_cover_newer_success(browser):
    page = open_page(browser)
    page.locator('#search').fill('I10')
    page.locator('#search').press('Enter')
    expect(page.locator('#clipboard-sync')).to_contain_text('已同步')
    page.evaluate("""() => {
      navigator.clipboard.writeText = text => text === 'old-date'
        ? new Promise((resolve,reject) => { window.rejectOldCopy = reject; })
        : Promise.resolve(writes.push(text));
      document.execCommand = () => false;
      ICDInteractions.copyText('old-date', false, '日期');
    }""")
    page.wait_for_function('!!window.rejectOldCopy')
    page.locator('#clipboard-sync').click()
    page.evaluate("rejectOldCopy(Error('denied'))")
    expect(page.locator('#clipboard-sync')).to_contain_text('已同步')
    expect(page.locator('#fallback-copy')).to_be_hidden()
    assert page.evaluate('writes.at(-1)') == 'I10'
    page.close()
