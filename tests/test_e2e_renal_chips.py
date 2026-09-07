"""直接點選標籤；實際操作正式離線頁，不使用隱藏的 select。"""
from test_e2e_renal_integration import browser, page, patient
from playwright.sync_api import expect
import pytest


def test_chips_selection_keyboard_and_reset(page):
    context = page.get_by_role('group', name='腎功能情境', exact=True)
    plans = page.get_by_role('group', name='用藥方案', exact=True)
    expect(context.get_by_role('button')).to_have_text(['穩定非透析', 'IHD', 'CRRT', 'CAPD'])
    expect(context.get_by_role('button', name='穩定非透析', exact=True)).to_have_attribute('aria-pressed', 'true')
    expect(page.locator('select[aria-label="用藥方案"],select[aria-label="腎功能情境"]')).to_have_count(0)
    page.get_by_label('快速選藥', exact=True).select_option('ceftazidime')
    expect(plans.get_by_role('button')).to_have_count(2)
    expect(plans.locator('[aria-pressed="true"]')).to_have_count(0)
    first = plans.get_by_role('button', name='UpToDate・原劑量 1 g q8h', exact=True)
    first.click()
    expect(first).to_have_attribute('aria-pressed', 'true')
    patient(page)
    expect(page.locator('.renal-recommendation')).to_contain_text('1 g q24h')
    second = plans.get_by_role('button', name='UpToDate・原劑量 2 g q8h', exact=True)
    second.focus()
    second.press('Space')
    expect(second).to_be_focused()
    expect(plans.locator('[aria-pressed="true"]')).to_have_count(1)
    expect(page.locator('.renal-recommendation')).to_contain_text('2 g q24h')
    context.get_by_role('button', name='IHD', exact=True).click()
    expect(page.locator('.renal-dialysis')).to_be_visible()
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    page.locator('#ccr-reset').click()
    expect(context.get_by_role('button', name='穩定非透析', exact=True)).to_have_attribute('aria-pressed', 'true')
    expect(plans.get_by_role('button')).to_have_count(0)


@pytest.mark.parametrize('width', [176, 340, 390])
def test_long_regimen_chips_wrap_and_remain_readable(page, width):
    page.set_viewport_size({'width':width,'height':900})
    page.get_by_label('快速選藥', exact=True).select_option('acyclovir')
    plans = page.get_by_role('group', name='用藥方案', exact=True)
    expect(plans.get_by_role('button')).to_have_count(5)
    label = plans.locator('..').locator('.renal-label').bounding_box()
    assert label['height'] <= 28
    assert plans.bounding_box()['y'] - label['y'] - label['height'] <= 8
    for button in plans.get_by_role('button').all():
        button.click()
        expect(button).to_have_attribute('aria-pressed', 'true')
        assert button.evaluate('(e)=>e.scrollWidth <= e.clientWidth + 1')
    assert page.locator('#ccr-panel').evaluate('(e)=>e.scrollWidth <= e.clientWidth + 1')
