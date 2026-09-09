"""窄欄看診動線：搜尋可見、回到原位、連續選碼、置頂操作。"""
from pathlib import Path

import pytest
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope='module')
def browser():
    with sync_playwright() as p:
        instance = p.chromium.launch()
        yield instance
        instance.close()


@pytest.fixture
def page(browser):
    context = browser.new_context(viewport={'width': 340, 'height': 900},
                                  permissions=['clipboard-read', 'clipboard-write'])
    pg = context.new_page()
    pg.goto((ROOT / 'dist' / 'icd10.html').as_uri())
    pg.wait_for_selector('body[data-ready="1"]')
    pg.evaluate("async () => { ICDApp.store.setLayout('dock'); await ICDApp.data.ensureDb(); }")
    yield pg
    context.close()


def scroll_to(page, y):
    return page.locator('.dock-scroll').evaluate('(el,y) => {el.scrollTop=y; return el.scrollTop}', y)


def scroll_top(page):
    return page.locator('.dock-scroll').evaluate('(el) => el.scrollTop')


def test_search_is_visible_and_escape_returns_to_where_you_were(page):
    before = scroll_to(page, 420)
    assert before > 100
    page.fill('#search', '蜂窩')
    expect(page.locator('#results-card')).to_be_visible()
    assert scroll_top(page) == 0, '搜尋結果應直接出現在眼前'
    expect(page.locator('#dock-panels')).to_be_hidden()
    first = page.locator('#search-results .chip:not(.cat)').first
    assert first.bounding_box()['y'] < 400
    first.click()
    expect(first).to_have_attribute('data-in-cart', 'true')
    page.locator('#search').press('Escape')
    expect(page.locator('#dock-panels')).to_be_visible()
    assert abs(scroll_top(page) - before) <= 1


def test_switching_regions_remembers_each_position_and_leaves_search(page):
    before = scroll_to(page, 420)
    heart = page.locator('#region-pills button').filter(has_text='心肺')
    heart.click()
    assert scroll_top(page) == 0
    other = scroll_to(page, 180)
    page.locator('#region-pills button').filter(has_text='常用').click()
    assert abs(scroll_top(page) - before) <= 1
    page.fill('#search', '蜂窩')
    expect(page.locator('#results-card')).to_be_visible()
    heart.click()
    expect(page.locator('#search')).to_have_value('')
    expect(page.locator('#results-card')).to_be_hidden()
    assert abs(scroll_top(page) - other) <= 1


def test_return_cancels_pending_input_and_enter_still_adds_the_first_result(page):
    before = scroll_to(page, 180)
    page.fill('#search', '蜂窩')
    expect(page.locator('#results-card')).to_be_visible()
    page.fill('#search', '糖尿')
    page.click('#dock-search-back')
    page.wait_for_timeout(250)  # 超過 150ms debounce，確認舊輸入不會重開搜尋
    expect(page.locator('#results-card')).to_be_hidden()
    expect(page.locator('#search')).to_have_value('')
    assert abs(scroll_top(page) - before) <= 1
    page.fill('#search', 'E11.9')
    page.locator('#search').press('Enter')
    expect(page.locator('#cart li[data-code="E11.9"]')).to_have_count(1)
    expect(page.locator('#search')).to_have_value('')
    assert abs(scroll_top(page) - before) <= 1


def test_expanding_one_panel_keeps_other_nodes_and_keyboard_focus(page):
    toggle = page.locator('.dock-panel .panel-toggle').nth(3)
    toggle.scroll_into_view_if_needed()
    toggle.focus()
    page.evaluate("window.__unchangedPanel = document.querySelector('.dock-panel')")
    toggle.press('Enter')
    expect(toggle).to_have_attribute('aria-expanded', 'true')
    expect(toggle).to_be_focused()
    assert page.evaluate("window.__unchangedPanel === document.querySelector('.dock-panel')")


def test_whole_panel_heading_toggles_diseases_and_stays_reachable(page):
    header = page.locator('.dock-panel-head').first
    header.locator('.dock-panel-name').click()
    expect(header.locator('.panel-toggle')).to_have_attribute('aria-expanded', 'true')
    scroll_to(page, 150)
    top = page.locator('.dock-scroll').bounding_box()['y']
    assert abs(header.bounding_box()['y'] - top) <= 7
    header.locator('.dock-panel-name').click()
    expect(header.locator('.panel-toggle')).to_have_attribute('aria-expanded', 'false')


def test_selected_codes_stay_marked_and_removal_clears_the_mark(page):
    chip = page.locator('#dock-panels .chip').first
    code = chip.get_attribute('data-code')
    chip.click()
    expect(chip).to_have_attribute('data-in-cart', 'true')
    assert '已加入清單' in chip.get_attribute('aria-label')
    chip.click()
    expect(page.locator('#cart li')).to_have_count(1)
    page.locator('#cart .cart-remove').first.click()
    expect(chip).not_to_have_attribute('data-in-cart', 'true')
    page.fill('#search', code)
    expect(page.locator('#results-card')).to_be_visible()
    result = page.locator(f'#search-results .chip[data-code="{code}"]')
    result.click()
    expect(result).to_have_attribute('data-in-cart', 'true')
    page.click('#clear-cart')
    expect(result).not_to_have_attribute('data-in-cart', 'true')


def test_adding_a_code_near_the_bottom_keeps_that_code_in_view(page):
    # 選原本畫面最下面的碼；相關建議出現後，仍能接著看同一列附近的碼。
    index = page.locator('#dock-panels .chip').evaluate_all("""chips => {
        const bottom=document.querySelector('.dock-scroll').getBoundingClientRect().bottom;
        return chips.reduce((last,c,i) => c.getBoundingClientRect().bottom < bottom-8 ? i : last, 0);
    }""")
    chip = page.locator('#dock-panels .chip').nth(index)
    chip.click()
    bottom = page.locator('.dock-scroll').bounding_box()
    selected = chip.bounding_box()
    assert selected['y'] + selected['height'] <= bottom['y'] + bottom['height'], '加碼後原本的選碼位置被下方區塊蓋掉'


@pytest.mark.parametrize('width', [176, 340, 565])
@pytest.mark.parametrize('theme', ['light', 'dark'])
def test_lower_panes_leave_room_to_keep_selecting(page, width, theme):
    page.set_viewport_size({'width': width, 'height': 900})
    page.evaluate("([w,theme]) => { document.querySelector('#layout-dock').style.setProperty('--dock-w',w+'px'); ICDApp.store.setTheme(theme); }", [width, theme])
    page.locator('#dock-panels .chip').first.click()
    expect(page.locator('#related, #dock-related-toggle')).to_have_count(0)
    height = page.locator('.dock-scroll').bounding_box()['height']
    assert height >= 540
    # 選下一筆仍不顯示相關疾病。
    page.locator('#dock-panels .chip').nth(1).click()
    expect(page.locator('#related')).to_have_count(0)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')


def test_pip_search_return_without_related_in_the_small_window(page):
    before = scroll_to(page, 420)
    with page.context.expect_page() as event:
        page.click('#pin-toggle')
    pip = event.value
    pip.wait_for_selector('#layout-dock')
    pip.fill('#search', '蜂窩')
    expect(pip.locator('#results-card')).to_be_visible()
    assert scroll_top(pip) == 0
    pip.locator('#search-results .chip:not(.cat)').first.click()
    pip.click('#dock-search-back')
    expect(pip.locator('#search')).to_have_value('')
    assert abs(scroll_top(pip) - before) <= 1
    expect(pip.locator('#related, #dock-related-toggle')).to_have_count(0)
    before_close = scroll_top(pip)
    pip.close()
    expect(page.locator('#layout-dock')).to_be_visible()
    assert abs(scroll_top(page) - before_close) <= 1
