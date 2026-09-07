"""正式離線產物 + 真實 Sanford 事實資料的病人操作流程。"""
from pathlib import Path

import pytest
from renal_ui_helpers import choose
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
    context = browser.new_context(viewport={'width':340, 'height':900})
    pg = context.new_page()
    errors = []
    requests = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('request', lambda r: requests.append(r.url) if r.url.startswith('http') else None)
    pg.goto((ROOT / 'dist/icd10.html').as_uri())
    pg.wait_for_selector('body[data-ready="1"]')
    pg.evaluate("ICDApp.store.setLayout('dock')")
    pg.locator('#ccr-btn').click()
    yield pg
    context.close()
    assert not errors, errors
    assert not requests, requests


def patient(page, cr='3.6', age='68'):
    page.locator('#ccr-age').fill(age)
    page.locator('#ccr-weight').fill('72')
    page.locator('#ccr-cr').fill(cr)


def drug(page, name, regimen=None, state='stable'):
    page.get_by_label('快速選藥', exact=True).select_option(name)
    if regimen:
        choose(page.get_by_label('用藥方案', exact=True), regimen)
    choose(page.get_by_label('腎功能情境', exact=True), state)


def test_renal_state_defaults_to_stable_and_reset_restores_it(page):
    state = page.get_by_label('腎功能情境', exact=True)
    expect(state).to_have_attribute('data-value', 'stable')
    expect(state.locator('button')).to_have_text(['穩定非透析', 'IHD', 'CRRT', 'CAPD'])
    assert state.locator('button').evaluate_all('(els)=>els.map(e=>e.value)') == ['stable', 'ihd', 'crrt', 'capd']
    page.get_by_label('快速選藥', exact=True).select_option('meropenem')
    expect(page.locator('.renal-details .renal-dose').first).to_be_visible()
    choose(state, 'ihd')
    patient(page)
    expect(state).to_have_attribute('data-value', 'ihd')
    expect(page.locator('.renal-dialysis')).to_be_visible()
    page.locator('#ccr-reset').click()
    expect(state).to_have_attribute('data-value', 'stable')
    expect(page.get_by_label('快速選藥', exact=True)).to_have_value('')
    expect(page.locator('.renal-recommendation')).to_have_count(0)


def test_acyclovir_five_regimens_lookup_without_age_and_no_unit_mismatch_recommendation(page):
    page.get_by_label('搜尋學名或別名', exact=True).fill('acyclovir')
    drug(page, 'acyclovir')
    picker = page.get_by_label('用藥方案', exact=True)
    expect(picker).to_have_attribute('data-value', '')
    for regimen in ['po-400-q12h', 'po-200-five-daily', 'po-800-five-daily', 'iv-5-q8h', 'iv-10-q8h']:
        choose(picker, regimen)
        expect(page.locator('#ccr-age')).to_have_value('')
        expect(page.locator('.renal-details .renal-dose')).to_have_count(4)
        expect(page.locator('.renal-details .renal-dose').first).to_be_visible()
        expect(page.locator('.renal-output')).to_contain_text('mL/min/1.73 m²')
        expect(page.locator('.renal-status')).to_contain_text('身高')
        expect(page.locator('.renal-status')).not_to_contain_text('完成 CCr 計算後會標示')
    expect(page.locator('.renal-source')).to_contain_text('UpToDate')
    expect(page.locator('.renal-source')).to_contain_text('未提供日期')
    expect(page.get_by_role('link', name='查看藥物來源')).to_have_attribute(
        'href', 'https://www.uptodate.com/contents/acyclovir-systemic-drug-information')
    patient(page)
    for regimen in ['po-400-q12h', 'po-200-five-daily', 'po-800-five-daily', 'iv-5-q8h', 'iv-10-q8h']:
        choose(picker, regimen)
        expect(page.locator('.renal-recommendation')).to_have_count(0)
        expect(page.locator('.is-matched')).to_have_count(0)
        expect(page.locator('.renal-status')).to_contain_text('身高')
    choose(page.get_by_label('腎功能情境', exact=True), 'ihd')
    expect(page.locator('.renal-dialysis')).to_contain_text('來源未提供')
    expect(page.locator('.renal-dialysis .renal-dose')).to_have_count(0)


def test_amikacin_once_daily_can_be_looked_up_without_age(page):
    drug(page, 'amikacin')
    expect(page.get_by_label('用藥方案', exact=True)).to_have_attribute('data-value', '')
    choose(page.get_by_label('用藥方案', exact=True), 'extended-interval')
    expect(page.locator('#ccr-age')).to_have_value('')
    for interval in ['q24h', 'q36h', 'q48h', '傳統分次給法']:
        expect(page.locator('.renal-details')).to_contain_text(interval)
    expect(page.locator('.renal-details .renal-dose').first).to_be_visible()
    expect(page.locator('.renal-output')).to_contain_text('輸注開始')
    expect(page.locator('.renal-source')).to_contain_text('2026-07-22')
    expect(page.get_by_role('link', name='查看給藥與監測依據')).to_have_attribute(
        'href', 'https://web.sanfordguide.com/resolveuid/df225e148c67fda5a404d8e0ef4595c0')
    patient(page)
    expect(page.locator('.renal-status')).to_contain_text('TDM')
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    expect(page.locator('.is-matched')).to_have_count(0)
    choose(page.get_by_label('用藥方案', exact=True), 'conventional')
    expect(page.locator('.renal-source')).to_contain_text('2026-08-17')
    expect(page.locator('.renal-details')).to_contain_text('7.5 mg/kg')


def test_ceftazidime_uptodate_two_baseline_doses_and_dialysis_source(page):
    drug(page, 'ceftazidime')
    expect(page.get_by_label('用藥方案', exact=True)).to_have_attribute('data-value', '')
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    choose(page.get_by_label('用藥方案', exact=True), 'usual-1g-q8h')
    expect(page.locator('#ccr-age')).to_have_value('')
    expect(page.locator('.renal-details .renal-dose')).to_have_text([
        '1 g q8h', '1 g q12h', '1 g q24h', '500 mg q24h'])
    expect(page.locator('.renal-source')).to_contain_text('UpToDate')
    expect(page.locator('.renal-source')).to_contain_text('來源更新：未提供日期')
    expect(page.locator('.renal-source')).to_contain_text('截圖')
    expect(page.get_by_role('link', name='查看藥物來源')).to_have_attribute(
        'href', 'https://www.uptodate.com/contents/ceftazidime-drug-information')
    patient(page)  # CCr 20
    expect(page.locator('.renal-recommendation')).to_contain_text('1 g q24h')
    choose(page.get_by_label('用藥方案', exact=True), 'usual-2g-q8h')
    expect(page.locator('.renal-recommendation')).to_contain_text('2 g q24h')
    page.locator('#ccr-cr').fill('4.8')  # CCr 15
    expect(page.locator('.renal-recommendation')).to_contain_text('1 g q24h')
    choose(page.get_by_label('用藥方案', exact=True), 'usual-1g-q8h')
    expect(page.locator('.renal-recommendation')).to_contain_text('500 mg q24h')
    choose(page.get_by_label('腎功能情境', exact=True), 'ihd')
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    expect(page.locator('.renal-dialysis-source')).to_contain_text('Sanford')
    expect(page.locator('.renal-dialysis-source')).to_contain_text('2026-08-17')
    expect(page.locator('.renal-dialysis')).to_contain_text('HD 後')


def test_real_patient_result_updates_using_unrounded_ccr_and_resets(page):
    patient(page, '3.60018')
    expect(page.locator('.ccr-value')).to_have_text('20')
    drug(page, 'piperacillin-tazobactam', 'extended')
    expect(page.locator('.renal-recommendation')).to_contain_text('q12h')
    page.locator('#ccr-cr').fill('3.6')
    expect(page.locator('.renal-recommendation')).to_contain_text('q8h')
    page.locator('#ccr-cr').fill('')
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    page.locator('#ccr-reset').click()
    expect(page.get_by_label('快速選藥', exact=True)).to_have_value('')
    expect(page.get_by_label('腎功能情境', exact=True)).to_have_attribute('data-value', 'stable')


def test_regimen_must_be_chosen_and_source_details_are_complete(page):
    patient(page)
    drug(page, 'cefepime')
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    choose(page.get_by_label('用藥方案', exact=True), 'q8')
    expect(page.locator('.renal-recommendation')).to_contain_text('2 g q24h')
    page.locator('.renal-details summary').click()
    expect(page.locator('.renal-row.is-matched')).to_have_count(1)
    expect(page.locator('.renal-source')).to_contain_text('2026-09-07')
    expect(page.locator('.renal-source-link').first).to_have_attribute('href', 'https://web.sanfordguide.com/resolveuid/b319e8953ada4e3ca5dcffb31ddda7a0')


@pytest.mark.parametrize('name,regimen,state', [('vancomycin','iv','stable'),('ertapenem',None,'stable'),('meropenem',None,'ihd')])
def test_context_does_not_become_a_false_recommendation(page,name,regimen,state):
    patient(page)
    drug(page,name,regimen,state)
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    expect(page.locator('.renal-row.is-matched')).to_have_count(0)
    if state == 'ihd':
        expect(page.locator('.renal-dialysis')).to_contain_text('HD 後')
    page.locator('#ccr-age').fill('')
    expect(page.locator('.renal-details')).to_have_count(1)
    expect(page.locator('.renal-recommendation')).to_have_count(0)


def test_real_pip_move_and_reset(page):
    page.locator('#ccr-close').click()
    with page.context.expect_page() as event:
        page.locator('#pin-toggle').click()
    pip = event.value
    pip.wait_for_selector('#ccr-btn')
    pip.locator('#ccr-btn').click()
    drug(pip,'meropenem',state='ihd')
    expect(pip.locator('.renal-dialysis')).to_contain_text('500 mg q24h')
    expect(pip.locator('#ccr-age')).to_have_value('')
    patient(pip)
    drug(pip,'meropenem')
    expect(pip.locator('.renal-recommendation')).to_contain_text('500 mg q12h')
    pip.locator('#ccr-reset').click()
    expect(pip.get_by_label('快速選藥', exact=True)).to_have_value('')
    expect(pip.locator('.renal-recommendation')).to_have_count(0)
    pip.close()


@pytest.mark.parametrize('state', ['stable','ihd','crrt','capd'])
def test_lookup_without_any_patient_inputs(page, state):
    drug(page,'meropenem',state=state)
    expect(page.locator('#ccr-age')).to_have_value('')
    expect(page.locator('.renal-details')).to_have_count(1)
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    if state == 'stable':
        expect(page.locator('.renal-details .renal-dose').first).to_be_visible()
        expect(page.locator('.renal-details')).to_contain_text('1 g q8h')
        page.locator('#ccr-weight').fill('72')
        page.locator('#ccr-cr').fill('3.6')
        expect(page.locator('.renal-recommendation')).to_have_count(0)
        page.locator('#ccr-age').fill('68')
        expect(page.locator('.renal-recommendation')).to_contain_text('500 mg q12h')
    else:
        expect(page.locator('.renal-dialysis .renal-dose')).to_be_visible()


@pytest.mark.parametrize('layout,width', [('dock',176),('dock',340),('mobile',390),('wide',1440)])
def test_form_and_source_rows_fit_each_layout(page,layout,width):
    page.locator('#ccr-close').click()
    page.set_viewport_size({'width':width,'height':900})
    page.evaluate('(layout)=>ICDApp.store.setLayout(layout)', 'wide' if layout == 'mobile' else layout)
    expect(page.locator('body')).to_have_attribute('data-layout', layout)
    page.locator('#ccr-btn').click()
    patient(page)
    drug(page,'colistin','cba')
    expect(page.locator('.renal-recommendation')).to_contain_text('87.5 mg CBA q12h')
    page.locator('.renal-details summary').click()
    assert page.locator('#ccr-panel').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1')
    out = ROOT / '.review/renal'
    out.mkdir(parents=True,exist_ok=True)
    page.locator('.renal-recommendation').scroll_into_view_if_needed()
    page.screenshot(path=str(out / f'{layout}-{width}.png'))


def test_shortcuts_keep_patient_context_and_close_visible(page):
    patient(page)
    page.get_by_role('button', name='查抗菌藥', exact=True).click()
    expect(page.get_by_label('搜尋學名或別名', exact=True)).to_be_focused()
    drug(page,'meropenem')
    expect(page.locator('.renal-current')).to_contain_text('20 mL/min')
    page.locator('.renal-source').scroll_into_view_if_needed()
    assert page.locator('#ccr-close').bounding_box()['y'] >= 0
    page.get_by_role('button', name='回到病人輸入', exact=True).click()
    expect(page.locator('#ccr-age')).to_be_focused()


def test_mobile_renal_controls_are_touch_sized(page):
    page.locator('#ccr-close').click()
    page.set_viewport_size({'width':390,'height':900})
    page.evaluate("ICDApp.store.setLayout('wide')")
    page.locator('#ccr-btn').click()
    assert min(page.locator('.renal-control').evaluate_all('(els)=>els.map(e=>e.getBoundingClientRect().height)')) >= 44
