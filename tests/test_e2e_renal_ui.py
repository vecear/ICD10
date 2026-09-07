"""腎功能 UI 瀏覽器規格；直接載入來源，不執行或修改 build。

TEST_* 是非臨床展示資料，劑量用符號，絕不可當成處方。
ICDRenal 替身僅隔離並行開發中的純邏輯；不驗證臨床範圍演算法。
overlay/PiP 測試使用現有 dist，再掛上待整合元件。
執行：py -3.14 -m pytest tests/test_e2e_renal_ui.py -p no:cacheprovider
"""
import json
import re
from pathlib import Path

import pytest
from renal_ui_helpers import choose
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
UI = ROOT / 'src/render-renal.js'
CSS = ROOT / 'src/styles/renal.css'


def displayed(text):
    """原文每個字都保留；呈現層的分號可改為換行，括號內仍保留分號。"""
    return re.compile(re.escape(text).replace('；', r'[；\s]+').replace(';', r'[;\s]+'))

FIXTURE = r"""() => {
    const renal = [
        {label:'TEST CCr <50 mL/min', min:null, max:50, minInclusive:false,
         maxInclusive:false, dose:'TEST loading L mg/kg; maintenance M mg/kg qHh',
         note:'TEST 保留負荷劑量與單位'},
        {label:'TEST CCr ≥50 mL/min', min:50, max:null, minInclusive:true,
         maxInclusive:false, dose:'TEST B g/day', note:'TEST 第二列'}
    ];
    const dialysis = Object.fromEntries(['ihd','capd','crrt','sled'].map(key =>
        [key, [{label:'TEST '+key+' 條件甲',dose:'TEST D mg/kg',note:'TEST 透析後時機'},
               {label:'TEST '+key+' 條件乙',dose:'TEST E g/day',note:'TEST 流速／膜條件'}]]));
    const regimen = {id:'single', label:'TEST 單一方案',route:'IV',notes:['TEST 方案備註'],
                     requiresTdm:false, renal, dialysis};
    const drug = {id:'test-a',name:'TEST_Generic_A',aliases:['TEST_ALIAS'],className:'TEST_CLASS',
        sourceUrl:'https://example.invalid/renal/source',notes:['TEST 藥物備註'],regimens:[regimen]};
    window.ANTIBIOTIC_DOSING = {version:1, reviewedOn:'2026-01-02',
        source:{name:'TEST 非臨床來源',url:'https://example.invalid/',updatedOn:'2026-01-01'},
        drugs:[drug, {...drug,id:'test-multi',name:'TEST_Multi',regimens:[
            {...regimen,id:'one',label:'TEST 方案一'}, {...regimen,id:'two',label:'TEST 方案二'}]},
            {...drug,id:'test-tdm',name:'TEST_TDM',regimens:[{...regimen,requiresTdm:true}]},
            ...Array.from({length:37},(_,i)=>({...drug,id:'extra-'+i,
                name:'TEST_Extra_'+i+'_VeryLongUnbrokenGenericNameForNarrowWidth'}))]};
    window.__recommendCalls = [];
    window.__answer = {status:'matched',message:'TEST 已符合',rowIndex:0};
    window.ICDRenal = {
        searchDrugs(data,query) {
            const words=query.trim().toLowerCase().split(/\s+/);
            return data.drugs.filter(d=>words.every(w=>
                [d.name,...d.aliases,d.className].join(' ').toLowerCase().includes(w)));
        },
        recommend(regimen,input) {
            window.__recommendCalls.push(input);
            return window.__answer;
        }
    };
}"""


@pytest.fixture(scope='module')
def browser():
    with sync_playwright() as p:
        instance = p.chromium.launch()
        yield instance
        instance.close()


def mount(page, overlay=False):
    assert UI.exists(), '尚未實作 src/render-renal.js'
    assert CSS.exists(), '尚未實作 src/styles/renal.css'
    page.evaluate(FIXTURE)
    page.add_script_tag(path=str(UI))
    page.add_style_tag(path=str(CSS))
    page.evaluate("""overlay => {
        // 即使主代理已整合，也只保留本測試掛載的那一個實例。
        document.querySelectorAll('.renal-ui').forEach(n=>n.remove());
        window.__renalRoot = ICDRenalUI.create();
        (overlay ? document.querySelector('#ccr-panel') : document.body).append(__renalRoot);
        ICDRenalUI.update(__renalRoot,{ok:true,crcl:50,crclRaw:49.6},{age:'40',weightKg:'70'});
    }""", overlay)


@pytest.fixture
def page(browser):
    context = browser.new_context(viewport={'width':340,'height':900})
    pg = context.new_page()
    errors = []
    pg.on('pageerror', lambda error: errors.append(str(error)))
    pg.set_content('<!doctype html><html lang="zh-Hant"><body style="margin:0"></body></html>')
    mount(pg)
    yield pg
    context.close()
    assert not errors, errors


def select_ready(page, drug='test-a'):
    page.get_by_label('快速選藥', exact=True).select_option(drug)
    choose(page.get_by_label('腎功能情境', exact=True), 'stable')


def update(page, result=None, age='40'):
    page.evaluate('([result,age]) => ICDRenalUI.update(__renalRoot,result,{age})', [result,age])


def test_component_api_is_available(browser):
    assert UI.exists(), '尚未實作 src/render-renal.js'
    context = browser.new_context()
    try:
        pg = context.new_page()
        pg.add_script_tag(path=str(UI))
        assert pg.evaluate("['create','update','reset'].every(k=>typeof ICDRenalUI[k]==='function')")
    finally:
        context.close()


def test_search_alias_and_compact_quick_picker(page):
    expect(page.get_by_label('腎功能情境', exact=True)).to_have_attribute('data-value', 'stable')
    expect(page.get_by_label('快速選藥', exact=True).locator('option')).to_have_count(41)
    assert page.get_by_label('快速選藥', exact=True).bounding_box()['height'] < 60
    page.get_by_label('搜尋學名或別名', exact=True).fill(' test_alias test_class ')
    expect(page.get_by_label('快速選藥', exact=True).locator('option')).to_have_count(41)
    page.get_by_label('搜尋學名或別名', exact=True).fill('test_generic_a')
    expect(page.get_by_label('快速選藥', exact=True).locator('option')).to_have_count(2)
    page.get_by_label('快速選藥', exact=True).select_option('test-a')
    # fixture 已提供有效 CCr；預設 stable 後選單一方案即可顯示。
    expect(page.locator('.renal-recommendation')).to_be_visible()
    page.get_by_label('搜尋學名或別名', exact=True).fill('no-such-drug')
    expect(page.get_by_label('快速選藥', exact=True)).to_have_value('')
    expect(page.locator('.renal-ui')).to_contain_text('找不到')


def test_regimens_require_explicit_selection_and_single_preselects(page):
    select_ready(page, 'test-multi')
    expect(page.get_by_label('用藥方案', exact=True)).to_have_attribute('data-value', '')
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    choose(page.get_by_label('用藥方案', exact=True), 'two')
    expect(page.locator('.renal-recommendation')).to_be_visible()
    page.get_by_label('快速選藥', exact=True).select_option('test-a')
    expect(page.get_by_label('用藥方案', exact=True)).to_have_attribute('data-value', 'single')
    page.get_by_label('快速選藥', exact=True).select_option('test-multi')
    expect(page.get_by_label('用藥方案', exact=True)).to_have_attribute('data-value', '')
    expect(page.locator('.renal-recommendation')).to_have_count(0)


def test_raw_ccr_top_recommendation_and_complete_source_rows(page):
    select_ready(page)
    assert page.evaluate('__recommendCalls.at(-1).crcl') == 49.6
    assert page.evaluate('"age" in __recommendCalls.at(-1)') is False
    expect(page.locator('.renal-recommendation')).to_contain_text('loading L mg/kg')
    expect(page.locator('.renal-ui')).to_contain_text('IV')
    details = page.locator('.renal-details')
    expect(details).not_to_have_attribute('open', '')
    assert page.locator('.renal-recommendation').bounding_box()['y'] < details.bounding_box()['y']
    details.locator('summary').click()
    expect(details.locator('.renal-row')).to_have_count(2)
    expect(details.locator('.is-matched')).to_have_count(1)
    expect(details.locator('.is-matched')).to_contain_text('TEST CCr <50 mL/min')
    expect(details).to_contain_text('TEST B g/day')
    for text in ['TEST 藥物備註','TEST 方案備註','2026-01-02','2026-01-01']:
        expect(page.locator('.renal-ui')).to_contain_text(text)
    expect(page.get_by_role('link', name='查看藥物來源')).to_have_attribute(
        'href','https://example.invalid/renal/source')


@pytest.mark.parametrize('result', [None, {'ok':False,'crclRaw':49.6},
    {'ok':True,'crcl':50}, {'ok':True,'crclRaw':None},
    {'ok':True,'crclRaw':-1}, {'ok':True,'crclRaw':'49.6'}])
def test_invalid_current_result_clears_previous_recommendation(page, result):
    select_ready(page)
    update(page, result)
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    expect(page.locator('.is-matched')).to_have_count(0)


@pytest.mark.parametrize('age', ['',None,'17','0','invalid'])
def test_adult_only_lookup_does_not_gate_on_age(page, age):
    select_ready(page)
    update(page, {'ok':True,'crclRaw':49.6}, age)
    expect(page.locator('.renal-recommendation')).to_be_visible()
    expect(page.locator('.renal-details')).to_have_count(1)


@pytest.mark.parametrize('status', ['needs-input','unstable','manual','gap'])
def test_nonmatched_never_highlights_or_recommends_even_with_row_index(page, status):
    page.evaluate('status => __answer = {status,message:"TEST 核對來源",rowIndex:0}',status)
    select_ready(page)
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    expect(page.locator('.is-matched')).to_have_count(0)
    expect(page.locator('.renal-status')).to_contain_text('TEST 核對來源')


def test_tdm_keeps_source_comparison_without_automatic_dose(page):
    select_ready(page, 'test-tdm')
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    expect(page.locator('.is-matched')).to_have_count(0)
    expect(page.locator('.renal-status')).to_contain_text('TDM')
    page.locator('.renal-details summary').click()
    expect(page.locator('.renal-details')).to_contain_text('loading L mg/kg')


def test_metric_manual_is_generic_and_not_mislabeled_tdm(page):
    page.evaluate("""() => {
        ANTIBIOTIC_DOSING.drugs[0].regimens[0].renal.forEach(row=>row.manual=true);
        __answer={status:'manual',message:'TEST 來源計量方式不同',rowIndex:0};
    }""")
    select_ready(page)
    expect(page.locator('.renal-status')).to_contain_text('此方案需依來源條件個別核對')
    expect(page.locator('.renal-status')).not_to_contain_text('TDM')
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    expect(page.locator('.is-matched')).to_have_count(0)


def test_separate_loading_and_notes_are_preserved_on_every_source_row(page):
    page.evaluate("""() => {
        const r=ANTIBIOTIC_DOSING.drugs[0].regimens[0];
        r.renal.forEach(row=>row.loading='TEST LOAD L mg/kg');
        Object.values(r.dialysis).flat().forEach(row=>row.loading='TEST DIALYSIS LOAD D mg/kg');
    }""")
    select_ready(page)
    expect(page.locator('.renal-recommendation')).to_contain_text('TEST LOAD L mg/kg')
    page.locator('.renal-details summary').click()
    for row in page.locator('.renal-details .renal-row').all():
        expect(row).to_contain_text('TEST LOAD L mg/kg')
    choose(page.get_by_label('腎功能情境',exact=True), 'crrt')
    for row in page.locator('.renal-dialysis .renal-row').all():
        expect(row).to_contain_text('TEST DIALYSIS LOAD D mg/kg')


def test_real_logic_overlap_and_manual_never_recommend(page):
    logic=ROOT/'src/renal-dosing.js'
    if not logic.exists():
        pytest.skip('待純邏輯代理提供 src/renal-dosing.js')
    page.add_script_tag(path=str(logic))
    select_ready(page)
    expect(page.locator('.renal-recommendation')).to_be_visible()
    page.evaluate('ANTIBIOTIC_DOSING.drugs[0].regimens[0].renal[1].min=40')
    update(page, {'ok':True,'crclRaw':49.6})
    expect(page.locator('.renal-status')).to_have_attribute('data-status','gap')
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    expect(page.locator('.is-matched')).to_have_count(0)
    page.evaluate("""() => {
        const rows=ANTIBIOTIC_DOSING.drugs[0].regimens[0].renal;
        rows[1].min=50;
        rows.forEach(row=>row.manual=true);
    }""")
    update(page, {'ok':True,'crclRaw':49.6})
    expect(page.locator('.renal-status')).to_have_attribute('data-status','manual')
    expect(page.locator('.renal-status')).not_to_contain_text('TDM')
    expect(page.locator('.is-matched')).to_have_count(0)


def test_invalid_numeric_values_and_zero_use_current_raw_result(page):
    select_ready(page)
    for value in ['NaN','Infinity','-Infinity']:
        page.evaluate(f'ICDRenalUI.update(__renalRoot,{{ok:true,crclRaw:{value}}},{{age:40}})')
        expect(page.locator('.renal-recommendation')).to_have_count(0)
    update(page, {'ok':True,'crclRaw':0})
    expect(page.locator('.renal-recommendation')).to_be_visible()
    assert page.evaluate('__recommendCalls.at(-1).crcl') == 0


def test_missing_dependencies_recover_and_removed_data_clears_selection(page):
    select_ready(page)
    page.evaluate('() => { window.__savedData=ANTIBIOTIC_DOSING; delete window.ANTIBIOTIC_DOSING; }')
    update(page, {'ok':True,'crclRaw':49.6})
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    expect(page.locator('.renal-status')).to_contain_text('尚未載入')
    page.evaluate('() => { window.ANTIBIOTIC_DOSING=__savedData; }')
    update(page, {'ok':True,'crclRaw':49.6})
    expect(page.get_by_label('快速選藥',exact=True)).to_be_enabled()
    expect(page.get_by_label('快速選藥',exact=True)).to_have_value('')


def test_text_is_not_html_and_unsafe_source_is_not_clickable(page):
    page.evaluate("""() => {
        ANTIBIOTIC_DOSING.drugs[0].notes=['<img src=x onerror="window.__injected=true">'];
        ANTIBIOTIC_DOSING.drugs[0].sourceUrl='javascript:window.__injected=true';
    }""")
    select_ready(page)
    expect(page.locator('.renal-ui img')).to_have_count(0)
    expect(page.locator('.renal-ui a[href^="javascript:"]')).to_have_count(0)
    assert page.evaluate('window.__injected !== true')


def test_patient_update_keeps_control_focus_and_expanded_reference(page):
    select_ready(page)
    page.locator('.renal-details summary').click()
    search=page.get_by_label('搜尋學名或別名',exact=True)
    search.focus()
    update(page, {'ok':True,'crclRaw':45})
    expect(search).to_be_focused()
    expect(page.locator('.renal-details')).to_have_attribute('open','')


def test_component_never_uses_persistent_storage(page):
    page.evaluate("""() => {
        for (const name of ['localStorage','sessionStorage','indexedDB']) {
            Object.defineProperty(window,name,{get(){throw Error('storage access: '+name)}});
        }
    }""")
    select_ready(page)
    page.get_by_label('搜尋學名或別名',exact=True).fill('TEST_Generic_A')
    update(page, {'ok':True,'crclRaw':45})
    page.evaluate('ICDRenalUI.reset(__renalRoot)')
    page.evaluate('document.body.append(ICDRenalUI.create())')
    expect(page.locator('.renal-ui').nth(1).get_by_label('快速選藥',exact=True)).to_have_value('')


def test_update_and_reset_accept_integration_component_instance(page):
    page.evaluate('ICDRenalUI.reset(__renalRoot)')
    page.evaluate('ICDRenalUI.update(document.querySelector(".renal-ui"),{ok:true,crclRaw:45},{age:40})')
    select_ready(page)
    expect(page.locator('.renal-recommendation')).to_be_visible()
    page.evaluate('ICDRenalUI.reset(document.querySelector(".renal-ui"))')
    expect(page.get_by_label('快速選藥',exact=True)).to_have_value('')
    expect(page.get_by_label('腎功能情境',exact=True)).to_have_attribute('data-value', 'stable')
    select_ready(page)
    expect(page.locator('.renal-recommendation')).to_have_count(0)


@pytest.mark.parametrize('state', ['ihd','crrt','capd'])
def test_dialysis_never_reuses_ccr_match(page, state):
    select_ready(page)
    update(page, None)
    choose(page.get_by_label('腎功能情境', exact=True), state)
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    expect(page.locator('.is-matched')).to_have_count(0)
    expect(page.locator('.renal-dialysis')).to_contain_text('TEST '+state+' 條件甲')
    expect(page.locator('.renal-dialysis')).to_contain_text('TEST '+state+' 條件乙')
    expect(page.locator('.renal-dialysis')).to_contain_text('TEST 流速／膜條件')
    expect(page.locator('.renal-dialysis')).to_contain_text('TEST 透析後時機')


def test_reset_clears_patient_search_state_and_all_selections(page):
    select_ready(page)
    page.locator('.renal-details summary').click()
    page.evaluate('ICDRenalUI.reset(__renalRoot)')
    for label in ['搜尋學名或別名','快速選藥','用藥方案','腎功能情境']:
        if label in ['用藥方案', '腎功能情境']:
            expect(page.get_by_label(label,exact=True)).to_have_attribute('data-value', 'stable' if label == '腎功能情境' else '')
        else:
            expect(page.get_by_label(label,exact=True)).to_have_value('')
    expect(page.locator('.renal-details')).to_have_count(0)
    select_ready(page)
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    expect(page.locator('.renal-details')).to_be_visible()
    expect(page.locator('.renal-status')).to_contain_text('可直接查閱')


def test_instances_do_not_share_patient_or_selection_state(page):
    select_ready(page)
    page.evaluate('document.body.append(ICDRenalUI.create())')
    second = page.locator('.renal-ui').nth(1)
    expect(second.get_by_label('快速選藥',exact=True)).to_have_value('')
    expect(second.get_by_label('腎功能情境',exact=True)).to_have_attribute('data-value', 'stable')
    expect(second.locator('.renal-recommendation')).to_have_count(0)


@pytest.mark.parametrize('width', [176,340,390,1100])
def test_no_horizontal_overflow_for_long_names_and_expanded_rows(page, width):
    page.set_viewport_size({'width':width,'height':900})
    select_ready(page, 'extra-0')
    page.locator('.renal-details summary').click()
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert page.locator('.renal-ui').evaluate("""root => [...root.querySelectorAll('*')]
        .filter(e=>e.getClientRects().length && e.tagName!=='OPTION')
        .every(e=>e.scrollWidth <= e.clientWidth+1)""")


@pytest.mark.parametrize(('layout','width'), [('wide',1280),('dock',176),('dock',340),('mobile',390)])
def test_existing_overlay_accepts_component_without_build(browser, layout, width):
    context = browser.new_context(viewport={'width':width,'height':900})
    try:
        pg=context.new_page()
        pg.goto((ROOT/'dist/icd10.html').as_uri())
        pg.wait_for_selector('body[data-ready="1"]')
        pg.evaluate('layout => ICDApp.store.setLayout(layout)',layout)
        pg.locator('#ccr-btn').click()
        mount(pg, overlay=True)
        select_ready(pg)
        expect(pg.locator('.renal-recommendation')).to_be_visible()
        pg.locator('.renal-details summary').click()
        assert pg.locator('.renal-ui').evaluate('e=>e.scrollWidth<=e.clientWidth')
    finally:
        context.close()


@pytest.fixture
def integrated_page(browser):
    """正式 dist、正式資料與整合 wiring；僅以記憶體替換本代理的最新版 UI。

    不執行 build、不落地改 dist；主代理重建後替換前後會完全相同。
    由 localhost 攔截回傳，保留 storage 與 Document PiP 所需的有效 origin。
    """
    built=(ROOT/'dist/icd10.html').read_text(encoding='utf-8')
    latest=UI.read_text(encoding='utf-8').strip()
    if latest not in built:
        built,count=re.subn(r'/\* 腎功能劑量 UI[\s\S]*?\}\)\(window\);',
                            lambda _:latest,built,count=1)
        assert count==1, 'dist 尚未整合腎功能 UI，請由主代理重建'
    context=browser.new_context(viewport={'width':340,'height':900})
    context.route('http://localhost/renal-ui-e2e',lambda route:route.fulfill(
        status=200,content_type='text/html; charset=utf-8',body=built))
    pg=context.new_page()
    errors=[]
    pg.on('pageerror',lambda error:errors.append(str(error)))
    pg.goto('http://localhost/renal-ui-e2e')
    pg.wait_for_selector('body[data-ready="1"]')
    pg.evaluate("ICDApp.store.setLayout('dock')")
    pg.locator('#ccr-btn').click()
    yield pg
    context.close()
    assert not errors, errors


def fill_adult_ccr(page):
    page.locator('#ccr-age').fill('40')
    page.locator('#ccr-weight').fill('70')
    page.locator('#ccr-cr').fill('1')


def test_integrated_ccr_update_clear_and_refill(integrated_page):
    page=integrated_page
    fill_adult_ccr(page)
    select_ready(page,'meropenem')
    expect(page.locator('.renal-recommendation')).to_be_visible()
    page.locator('#ccr-cr').fill('')
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    page.locator('#ccr-cr').fill('1')
    expect(page.locator('.renal-recommendation')).to_be_visible()
    page.locator('#ccr-reset').click()
    for selector in ['#ccr-age','#ccr-weight','#ccr-height','#ccr-cr']:
        expect(page.locator(selector)).to_have_value('')
    for label in ['搜尋學名或別名','快速選藥','用藥方案','腎功能情境']:
        if label in ['用藥方案', '腎功能情境']:
            expect(page.get_by_label(label,exact=True)).to_have_attribute('data-value', 'stable' if label == '腎功能情境' else '')
        else:
            expect(page.get_by_label(label,exact=True)).to_have_value('')
    fill_adult_ccr(page)
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    expect(page.locator('.renal-details')).to_have_count(0)


def test_entire_real_catalog_preserves_regimens_rows_notes_and_source_dates(integrated_page):
    page=integrated_page
    catalog=json.loads((ROOT/'src/curated/antibiotic_dosing.json').read_text(encoding='utf-8'))
    assert page.evaluate('ANTIBIOTIC_DOSING')==catalog, 'dist 的正式資料尚未更新'
    fill_adult_ccr(page)
    choose(page.get_by_label('腎功能情境',exact=True), 'stable')
    for drug in catalog['drugs']:
        page.get_by_label('快速選藥',exact=True).select_option(drug['id'])
        picker=page.get_by_label('用藥方案',exact=True)
        if len(drug['regimens'])>1:
            expect(picker).to_have_attribute('data-value', '')
            expect(page.locator('.renal-recommendation')).to_have_count(0)
            expect(page.locator('.renal-details')).to_have_count(0)
        else:
            expect(picker).to_have_attribute('data-value', drug['regimens'][0]['id'])
        for regimen in drug['regimens']:
            choose(picker, regimen['id'])
            page.locator('.renal-details summary').click()
            rows=page.locator('.renal-details .renal-row')
            expect(rows).to_have_count(len(regimen['renal']))
            for index,row in enumerate(regimen['renal']):
                expect(rows.nth(index).locator('.renal-row-label')).to_have_text(row['label'])
                expect(rows.nth(index).locator('.renal-dose').last).to_have_text(displayed(row['dose']))
                if row.get('note'):
                    expect(rows.nth(index)).to_contain_text(displayed(row['note']))
            if regimen['requiresTdm'] or all(row.get('manual') for row in regimen['renal']):
                expect(page.locator('.renal-recommendation')).to_have_count(0)
                expect(page.locator('.is-matched')).to_have_count(0)
                if regimen['requiresTdm']:
                    expect(page.locator('.renal-status')).to_contain_text('TDM')
                else:
                    expect(page.locator('.renal-status')).not_to_contain_text('TDM')
            expect(page.locator('.renal-route')).to_contain_text(regimen['route'])
            for note in drug['notes']+regimen['notes']:
                expect(page.locator('.renal-output')).to_contain_text(displayed(note))
            source = regimen.get('source', catalog['source'])
            expect(page.locator('.renal-source')).to_contain_text(source.get('reviewedOn', catalog['reviewedOn']))
            expect(page.locator('.renal-source')).to_contain_text(source['updatedOn'] or '未提供日期')
            expect(page.get_by_role('link',name='查看藥物來源')).to_have_attribute('href',drug['sourceUrl'])


@pytest.mark.parametrize('drug_id',['amoxicillin','aztreonam','ertapenem'])
def test_real_metric_manual_labels_are_not_highlighted(integrated_page,drug_id):
    page=integrated_page
    fill_adult_ccr(page)
    select_ready(page,drug_id)
    expect(page.locator('.renal-status')).to_contain_text('此方案需依來源條件個別核對')
    expect(page.locator('.renal-status')).not_to_contain_text('TDM')
    page.locator('.renal-details summary').click()
    expect(page.locator('.is-matched')).to_have_count(0)
    expect(page.locator('.renal-recommendation')).to_have_count(0)


def test_real_vancomycin_ihd_preserves_all_membrane_conditions(integrated_page):
    page=integrated_page
    fill_adult_ccr(page)
    page.get_by_label('快速選藥',exact=True).select_option('vancomycin')
    choose(page.get_by_label('腎功能情境',exact=True), 'ihd')
    regimen=page.evaluate("ANTIBIOTIC_DOSING.drugs.find(d=>d.id==='vancomycin').regimens[0]")
    rows=page.locator('.renal-dialysis .renal-row')
    assert len(regimen['dialysis']['ihd'])>1
    expect(rows).to_have_count(len(regimen['dialysis']['ihd']))
    for index,row in enumerate(regimen['dialysis']['ihd']):
        expect(rows.nth(index)).to_contain_text(row['label'])
        expect(rows.nth(index)).to_contain_text(displayed(row['dose']))
        if row.get('note'):
            expect(rows.nth(index)).to_contain_text(displayed(row['note']))
    expect(page.locator('.renal-recommendation')).to_have_count(0)
    expect(page.locator('.is-matched')).to_have_count(0)


@pytest.mark.parametrize('width',[176,340,390])
def test_integrated_search_keeps_screen_identity_focus_and_scroll(integrated_page,width):
    page=integrated_page
    page.set_viewport_size({'width':width,'height':900})
    fill_adult_ccr(page)
    search=page.get_by_label('搜尋學名或別名',exact=True)
    search.fill('cef')
    search.focus()
    before=page.evaluate("""() => {
        window.__mainNode=document.querySelector('#layout-dock');
        window.__panelNode=document.querySelector('#ccr-panel');
        window.__searchNode=document.querySelector('.renal-ui input');
        return {panel:__panelNode.scrollTop,body:document.scrollingElement.scrollTop,
                y:__searchNode.getBoundingClientRect().y,dock:document.querySelector('.dock-scroll').scrollTop};
    }""")
    search.press_sequentially('epime',delay=10)
    expect(search).to_be_focused()
    after=page.evaluate("""() => ({panel:__panelNode.scrollTop,body:document.scrollingElement.scrollTop,
        y:__searchNode.getBoundingClientRect().y,dock:document.querySelector('.dock-scroll').scrollTop,
        same:__mainNode===document.querySelector('#layout-dock') &&
        __panelNode===document.querySelector('#ccr-panel') &&
        __searchNode===document.querySelector('.renal-ui input')})""")
    assert after.pop('same'), '搜尋不得重建主畫面、CCr 面板或搜尋輸入'
    for key in before:
        assert abs(before[key]-after[key])<=1, (width,key,before,after)
    page.get_by_label('快速選藥',exact=True).select_option('cefepime')
    expect(page.get_by_label('用藥方案',exact=True)).to_have_attribute('data-value', '')
    assert page.locator('.renal-ui').evaluate('e=>e.scrollWidth<=e.clientWidth')


def test_pip_adoption_keeps_events_and_creates_nodes_in_owner_document(browser):
    context=browser.new_context(viewport={'width':340,'height':900})
    try:
        pg=context.new_page()
        pg.goto((ROOT/'dist/icd10.html').as_uri())
        pg.wait_for_selector('body[data-ready="1"]')
        pg.evaluate("ICDApp.store.setLayout('dock')")
        pg.locator('#ccr-btn').click()
        mount(pg,overlay=True)
        fill_adult_ccr(pg)
        select_ready(pg)
        # Document PiP 由既有按鈕開啟，沿用產品的 CSS 複製及 DOM 搬移。
        pg.locator('#ccr-close').click()
        with context.expect_page() as event:
            pg.locator('#pin-toggle').click()
        pip=event.value
        pip.wait_for_selector('#layout-dock')
        pip.locator('#ccr-btn').click()
        # 原 document 的建節點能力封鎖，避免 adoptNode 掩蓋錯誤 ownerDocument。
        pg.evaluate("""() => {
            window.__originalCreate=document.createElement;
            document.createElement=()=>{throw Error('wrong ownerDocument')};
        }""")
        pip.get_by_label('快速選藥',exact=True).select_option('test-multi')
        choose(pip.get_by_label('用藥方案',exact=True), 'two')
        expect(pip.locator('.renal-recommendation')).to_be_visible()
        choose(pip.get_by_label('腎功能情境',exact=True), 'crrt')
        expect(pip.locator('.renal-dialysis')).to_contain_text('條件乙')
        pg.evaluate('ICDRenalUI.reset(__renalRoot)')
        expect(pip.get_by_label('腎功能情境',exact=True)).to_have_attribute('data-value', 'stable')
        pg.evaluate('() => { document.createElement=__originalCreate; }')
        pip.close()
        expect(pg.locator('.renal-ui')).to_be_visible()
        pg.locator('#ccr-close').click()
        pg.locator('#ccr-btn').click()
        expect(pg.get_by_label('快速選藥',exact=True)).to_have_value('')
    finally:
        context.close()
