from pathlib import Path
import pytest
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope='module')
def browser():
    with sync_playwright() as p:
        instance = p.chromium.launch()
        yield instance
        instance.close()


def open_app(browser, width=1440, layout='wide', timezone='Asia/Taipei'):
    page = browser.new_page(viewport={'width': width, 'height': 900}, timezone_id=timezone)
    page.add_init_script(f"localStorage.setItem('icd10.layout', JSON.stringify('{layout}'))")
    page.goto((ROOT / 'dist/icd10.html').as_uri())
    page.wait_for_function("performance.getEntriesByName('icd-shell-ready').length > 0")
    return page


@pytest.mark.parametrize('width,layout', [(1440, 'wide'), (900, 'wide'), (390, 'wide'), (340, 'dock'), (176, 'dock')])
def test_date_calculator_flow(browser, width, layout):
    page = open_app(browser, width, layout)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    entry = page.get_by_role('button', name='Date', exact=True)
    expect(entry).to_have_count(1)
    entry.click()
    panel = page.get_by_role('dialog', name='日期計算器')
    expect(panel).to_be_visible()
    page.get_by_label('起算日期', exact=True).fill('2026-10-14')
    page.get_by_label('天數', exact=True).fill('7')
    expect(page.locator('#date-calc-result')).to_contain_text('2026年10月21日')
    page.get_by_label('方向', exact=True).select_option('before')
    expect(page.locator('#date-calc-result')).to_contain_text('2026年10月7日')
    page.get_by_label('天數', exact=True).fill('0')
    expect(page.locator('#date-calc-result')).to_contain_text('2026年10月14日')
    page.get_by_label('天數', exact=True).fill('-1')
    expect(page.locator('#date-calc-result')).not_to_contain_text('2026年')
    expect(page.locator('#date-calc-result')).to_contain_text('非負整數')
    page.get_by_label('天數', exact=True).fill('')
    expect(page.locator('#date-calc-result')).to_contain_text('輸入天數')
    assert panel.evaluate('(e) => e.scrollWidth <= e.clientWidth + 1')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    page.keyboard.press('Escape')
    expect(panel).not_to_be_visible()
    expect(entry).to_be_focused()
    entry.click()
    expect(page.get_by_label('起算日期', exact=True)).to_have_value('2026-10-14')
    page.get_by_label('天數', exact=True).fill('1.5')
    expect(page.locator('#date-calc-result')).to_contain_text('非負整數')
    page.get_by_label('天數', exact=True).fill('7')
    page.get_by_label('起算日期', exact=True).fill('')
    expect(page.locator('#date-calc-result')).to_contain_text('起算日期')
    expect(page.locator('.date-calc-value')).to_have_count(0)
    page.locator('#date-calc-close').click()
    expect(panel).not_to_be_visible()
    assert not errors
    page.close()


def test_date_survives_theme_resize_and_keyboard_focus(browser):
    page = open_app(browser)
    page.locator('#date-calc-btn').click()
    page.get_by_label('起算日期', exact=True).fill('2024-02-28')
    page.get_by_label('天數', exact=True).fill('1')
    page.evaluate("window.ICDApp.ctx.store.setTheme('dark')")
    page.set_viewport_size({'width': 390, 'height': 844})
    expect(page.locator('body')).to_have_attribute('data-layout', 'mobile')
    expect(page.locator('#date-calc-result')).to_contain_text('2024年2月29日')
    page.locator('#date-calc-close').focus()
    page.keyboard.press('Shift+Tab')
    expect(page.get_by_label('天數', exact=True)).to_be_focused()
    page.keyboard.press('Tab')
    expect(page.locator('#date-calc-close')).to_be_focused()
    for selector in ['#date-calc-close', '#date-calc-start', '#date-calc-direction', '#date-calc-days']:
        assert page.locator(selector).bounding_box()['height'] >= 44
    page.keyboard.press('Escape')
    page.locator('#ccr-btn').click()
    expect(page.locator('#ccr-panel')).to_be_visible()
    page.close()


def test_date_in_real_pip(browser):
    page = open_app(browser, 565, 'dock')
    with page.context.expect_page() as event:
        page.locator('#pin-toggle').click()
    pip = event.value
    pip.locator('#date-calc-btn').click()
    pip.get_by_label('起算日期', exact=True).fill('2026-12-31')
    pip.get_by_label('天數', exact=True).fill('1')
    expect(pip.locator('#date-calc-result')).to_contain_text('2027年1月1日')
    pip.keyboard.press('Escape')
    expect(pip.locator('#date-calc-btn')).to_be_focused()
    pip.close()
    page.close()


@pytest.mark.parametrize('timezone', ['Asia/Taipei', 'America/New_York', 'Pacific/Honolulu'])
def test_calendar_days_independent_of_timezone(browser, timezone):
    page = open_app(browser, timezone=timezone)
    page.locator('#date-calc-btn').click()
    today = page.evaluate("() => {const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-')}")
    expect(page.locator('#date-calc-start')).to_have_value(today)
    page.get_by_label('起算日期', exact=True).fill('2026-03-08')
    page.get_by_label('天數', exact=True).fill('1')
    expect(page.locator('#date-calc-result')).to_contain_text('2026年3月9日')
    page.close()
