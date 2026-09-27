"""VAC 查閱狀態只留在本次開啟的 app，涵蓋 DOM 重建與真正 PiP。"""
import pytest
from playwright.sync_api import expect

from test_e2e_vaccine import browser, open_app


def prepare_reading(page):
    page.locator('#vac-btn').click()
    page.locator('[data-vac-group="pneumococcal"]').click()
    page.locator('[data-vac-topic="schedule"]').click()
    page.locator('#vac-search').fill('肺炎')
    page.locator('[data-vac-question="pneumococcal"] > summary').click()
    page.locator('.vac-body').evaluate('(e) => e.scrollTop = 20')
    page.wait_for_timeout(80)
    assert page.locator('.vac-body').evaluate('(e) => e.scrollTop') == 20


def assert_reading(page, scroll=True):
    expect(page.locator('#vac-search')).to_have_value('肺炎')
    expect(page.locator('[data-vac-group="pneumococcal"]')).to_have_attribute('aria-pressed', 'true')
    expect(page.locator('[data-vac-topic="schedule"]')).to_have_attribute('aria-pressed', 'true')
    expect(page.locator('[data-vac-question="pneumococcal"]')).to_have_attribute('open', '')
    if scroll:
        page.wait_for_function("Math.abs(document.querySelector('.vac-body').scrollTop - 20) < 2")


@pytest.mark.parametrize('width,layout', [(1440, 'wide'), (390, 'wide'), (340, 'dock'), (176, 'dock')])
def test_close_reopen_preserves_reading_and_clear_resets(browser, width, layout):
    page = open_app(browser, width, layout)
    prepare_reading(page)
    page.locator('#vac-close').click()
    page.locator('#vac-btn').click()
    assert_reading(page)
    page.locator('#vac-reset').click()
    expect(page.locator('#vac-search')).to_have_value('')
    expect(page.locator('[data-vac-group="all"]')).to_have_attribute('aria-pressed', 'true')
    expect(page.locator('[data-vac-topic="all"]')).to_have_attribute('aria-pressed', 'true')
    expect(page.locator('.vac-card[open]')).to_have_count(0)
    assert page.locator('.vac-body').evaluate('(e) => e.scrollTop') == 0
    page.keyboard.press('Escape')
    page.locator('#vac-btn').click()
    expect(page.locator('.vac-card[open]')).to_have_count(0)
    expect(page.locator('#vac-search')).to_have_value('')
    page.close()


@pytest.mark.parametrize('close_before_switch', [False, True])
def test_reading_survives_wide_dock_mobile_rebuilds(browser, close_before_switch):
    page = open_app(browser)
    prepare_reading(page)
    if close_before_switch:
        page.keyboard.press('Escape')
    page.evaluate("window.ICDApp.store.setLayout('dock')")
    if close_before_switch:
        page.locator('#vac-btn').click()
    assert_reading(page)
    page.evaluate("window.ICDApp.store.setLayout('wide')")
    assert_reading(page)
    page.set_viewport_size({'width': 390, 'height': 900})
    expect(page.locator('body')).to_have_attribute('data-layout', 'mobile')
    assert_reading(page)
    page.set_viewport_size({'width': 1440, 'height': 900})
    expect(page.locator('body')).to_have_attribute('data-layout', 'wide')
    assert_reading(page)
    page.close()


def test_reading_survives_real_pip_move_and_return(browser):
    page = open_app(browser, 565, 'dock')
    prepare_reading(page)
    page.keyboard.press('Escape')
    with page.context.expect_page() as event:
        page.locator('#pin-toggle').click()
    pip = event.value
    pip.locator('#vac-btn').click()
    assert_reading(pip)
    pip.locator('.vac-body').evaluate('(e) => e.scrollTop = 20')
    pip.wait_for_timeout(80)
    pip.keyboard.press('Escape')
    pip.close()
    page.locator('#vac-btn').click()
    assert_reading(page)
    page.close()


def test_reload_discards_reading_without_browser_storage(browser):
    page = open_app(browser)
    before = page.evaluate('JSON.stringify({...localStorage})')
    prepare_reading(page)
    page.keyboard.press('Escape')
    assert page.evaluate('JSON.stringify({...localStorage})') == before
    assert page.evaluate('sessionStorage.length') == 0
    page.reload()
    page.wait_for_function("performance.getEntriesByName('icd-shell-ready').length > 0")
    page.locator('#vac-btn').click()
    expect(page.locator('#vac-search')).to_have_value('')
    expect(page.locator('[data-vac-group="all"]')).to_have_attribute('aria-pressed', 'true')
    expect(page.locator('[data-vac-topic="all"]')).to_have_attribute('aria-pressed', 'true')
    expect(page.locator('.vac-card[open]')).to_have_count(0)
    assert page.locator('.vac-body').evaluate('(e) => e.scrollTop') == 0
    page.close()
