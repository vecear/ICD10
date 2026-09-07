from test_e2e_renal_integration import browser, page, patient
from renal_ui_helpers import choose
from playwright.sync_api import expect


def test_bsa_calculation_and_source_metric_switch(page):
    patient(page, cr='2.8')
    page.get_by_label('快速選藥', exact=True).select_option('acyclovir')
    choose(page.get_by_label('用藥方案', exact=True), 'iv-10-q8h')
    expect(page.locator('.renal-status')).to_contain_text('身高')
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    page.get_by_role('button', name='補填身高', exact=True).click()
    expect(page.locator('#ccr-height')).to_be_focused()
    page.locator('#ccr-height').fill('180')
    expect(page.locator('.ccr-bsa')).to_contain_text('BSA')
    expect(page.locator('.renal-metric')).to_contain_text('mL/min/1.73 m²')
    expect(page.locator('.renal-recommendation')).to_contain_text('10 mg/kg/dose q24h')
    choose(page.get_by_label('用藥方案', exact=True), 'po-400-q12h')
    expect(page.locator('.renal-dose-options')).to_contain_text('400 mg q12h 或減為 200 mg q12h')
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    page.get_by_label('快速選藥', exact=True).select_option('ceftazidime')
    choose(page.get_by_label('用藥方案', exact=True), 'usual-2g-q8h')
    expect(page.locator('.renal-metric')).to_contain_text('原始 CCr')
    expect(page.locator('.renal-metric')).not_to_contain_text('1.73')
    page.get_by_label('快速選藥', exact=True).select_option('acyclovir')
    choose(page.get_by_label('用藥方案', exact=True), 'iv-10-q8h')
    page.locator('#ccr-height').fill('')
    expect(page.locator('.renal-status')).to_contain_text('身高')
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    expect(page.locator('.renal-row.is-matched')).to_have_count(0)
    expect(page.locator('.renal-details .renal-dose').first).to_be_visible()
    page.locator('#ccr-height').fill('180')
    expect(page.locator('.renal-recommendation')).to_have_count(1)
    choose(page.get_by_label('腎功能情境', exact=True), 'ihd')
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    page.locator('#ccr-reset').click()
    expect(page.locator('.ccr-bsa')).to_have_count(0)


def test_bsa_survives_real_pip_inputs(page):
    page.locator('#ccr-close').click()
    with page.context.expect_page() as event:
        page.locator('#pin-toggle').click()
    pip = event.value
    pip.locator('#ccr-btn').click()
    patient(pip, cr='2.8')
    pip.locator('#ccr-height').fill('180')
    pip.get_by_label('快速選藥', exact=True).select_option('acyclovir')
    choose(pip.get_by_label('用藥方案', exact=True), 'iv-5-q8h')
    expect(pip.locator('.renal-recommendation')).to_contain_text('5 mg/kg/dose q24h')
    pip.locator('#ccr-cr').fill('')
    expect(pip.locator('.renal-recommendation')).to_have_count(0)
    pip.close()
