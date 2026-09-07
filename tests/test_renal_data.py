"""腎功能資料建置守門：錯誤單位、來源及不完整分段不可靜默通過。"""
import copy
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'build'))
from renal_data import validate_renal_data


def fixture_data():
    return json.loads((ROOT / 'src/curated/antibiotic_dosing.json').read_text(encoding='utf-8'))


def test_reviewed_catalog_has_core_drugs_and_sources():
    data = fixture_data()
    validate_renal_data(data)
    names = {d['name'] for d in data['drugs']}
    assert {'Meropenem', 'Cefepime', 'Piperacillin-Tazobactam', 'Vancomycin', 'TMP-SMX'} <= names
    assert len(names) >= 40


def test_acyclovir_uptodate_preserves_five_columns_and_indexed_units():
    drug = next(d for d in fixture_data()['drugs'] if d['id'] == 'acyclovir')
    expected = {
        'po-400-q12h': ['400 mg q12h', '400 mg q12h', '400 mg q12h 或減為 200 mg q12h', '200 mg q12h'],
        'po-200-five-daily': ['200 mg 每日 5 次', '200 mg 每日 5 次', '200 mg 每日 5 次或減為 200 mg q8h', '200 mg q12h'],
        'po-800-five-daily': ['800 mg 每日 5 次', '800 mg 每日 5 次', '800 mg q8h', '200 mg q12h；嚴重感染可用 400 mg q12h'],
        'iv-5-q8h': ['5 mg/kg/dose q8h', '5 mg/kg/dose q12h', '5 mg/kg/dose q24h', '2.5 mg/kg/dose q24h'],
        'iv-10-q8h': ['10 mg/kg/dose q8h', '10 mg/kg/dose q12h', '10 mg/kg/dose q24h', '5 mg/kg/dose q24h'],
    }
    assert {r['id'] for r in drug['regimens']} == set(expected)
    for reg in drug['regimens']:
        assert [r['dose'] for r in reg['renal']] == expected[reg['id']]
        assert [(r['min'], r['max'], r['minInclusive'], r['maxInclusive']) for r in reg['renal']] == [
            (50, None, False, False), (25, 50, True, True),
            (10, 25, True, False), (None, 10, False, False)]
        assert reg['renalMetric'] == 'crcl-indexed'
        assert all('mL/min/1.73 m²' in r['label'] for r in reg['renal'])
        expected_manual = [False, False, reg['id'] in ['po-400-q12h','po-200-five-daily'], reg['id'] == 'po-800-five-daily']
        assert [r['manual'] for r in reg['renal']] == expected_manual
        assert reg['source']['updatedOn'] is None and '截圖' in reg['source']['note']
        assert reg['route'] == ('PO' if reg['id'].startswith('po-') else 'IV')
        assert not reg['requiresTdm']
        assert all(not rows for rows in reg['dialysis'].values())
    assert '神經毒性' in ' '.join(drug['notes'])


@pytest.mark.parametrize('metric', [None, '', 'egfr-indexed', 'unknown'])
def test_unsupported_renal_metric_fails_build(metric):
    data = fixture_data()
    data['drugs'][0]['regimens'][0]['renalMetric'] = metric
    with pytest.raises(ValueError):
        validate_renal_data(data)


@pytest.mark.parametrize('mutation', ['source', 'duplicate', 'bounds', 'date', 'unit', 'dialysis', 'script'])
def test_bad_data_fails_build(mutation):
    data = fixture_data()
    d = data['drugs'][0]
    row = d['regimens'][0]['renal'][0]
    if mutation == 'source': d['sourceUrl'] = 'javascript:alert(1)'
    if mutation == 'duplicate': data['drugs'].append(copy.deepcopy(d))
    if mutation == 'bounds': row.update(min=50, max=20)
    if mutation == 'date': data['reviewedOn'] = '2026-99-40'
    if mutation == 'unit': row['dose'] = ''
    if mutation == 'dialysis': d['regimens'][0]['dialysis']['mystery'] = []
    if mutation == 'script': d['name'] = '</script><img src=x>'
    with pytest.raises(ValueError): validate_renal_data(data)


def test_high_risk_data_preserves_context():
    drugs = {d['id']: d for d in fixture_data()['drugs']}
    assert all(r['requiresTdm'] for r in drugs['vancomycin']['regimens'])
    assert all(row.get('manual') for r in drugs['ertapenem']['regimens'] for row in r['renal'])
    assert len(drugs['piperacillin-tazobactam']['regimens']) == 3
    assert len(drugs['cefepime']['regimens']) == 2
    assert len(drugs['ciprofloxacin']['regimens']) == 2
    assert any('amoxicillin' in n.lower() for n in drugs['amoxicillin-clavulanate']['notes'])
    assert all('未明示單位' in row['label'] for row in drugs['amoxicillin']['regimens'][0]['renal'])
    assert drugs['piperacillin-tazobactam']['regimens'][0]['dialysis']['sled'][0]['manual']


def test_renal_data_has_an_independent_validation_path():
    import build as build_module
    from test_curated import NO_ICD_CODE_FILES
    assert 'antibiotic_dosing.json' not in build_module.CURATED_KEYS
    assert 'antibiotic_dosing.json' in NO_ICD_CODE_FILES


def test_amikacin_extended_interval_preserves_source_conditions():
    drug = next(d for d in fixture_data()['drugs'] if d['id'] == 'amikacin')
    regimens = {r['id']: r for r in drug['regimens']}
    assert 'conventional' in regimens
    daily = regimens['extended-interval']
    assert daily['requiresTdm'] and daily['route'] == 'IV'
    assert [(r['min'], r['max'], r['dose']) for r in daily['renal'][:3]] == [
        (60, None, '15–20 mg/kg IV q24h'),
        (40, 59, '15–20 mg/kg IV q36h'),
        (20, 39, '15–20 mg/kg IV q48h')]
    assert daily['renal'][3]['max'] == 20
    assert not daily['renal'][3]['maxInclusive']
    assert daily['renal'][3]['manual']
    notes = ' '.join(daily['notes'])
    for detail in ['60 分鐘', '輸注開始', '6–14 小時', '15 mg/kg', '除以 2', '20 mg/kg', '130%', '0.4']:
        assert detail in notes
    assert daily['source']['updatedOn'] == '2026-07-22'
    assert daily['source']['url'].endswith('df225e148c67fda5a404d8e0ef4595c0')
    assert all(not rows for rows in daily['dialysis'].values())


@pytest.mark.parametrize('value', [None, {}, {'name':'來源', 'url':'javascript:alert(1)', 'updatedOn':'2026-07-22', 'reviewedOn':'2026-09-07'}])
def test_invalid_regimen_source_fails_build(value):
    data = fixture_data()
    data['drugs'][0]['regimens'][0]['source'] = value
    with pytest.raises(ValueError):
        validate_renal_data(data)


def test_ceftazidime_matches_supplied_uptodate_table():
    drug = next(d for d in fixture_data()['drugs'] if d['id'] == 'ceftazidime')
    assert drug['sourceUrl'] == 'https://www.uptodate.com/contents/ceftazidime-drug-information'
    assert [r['id'] for r in drug['regimens']] == ['usual-1g-q8h', 'usual-2g-q8h']
    for reg, doses in zip(drug['regimens'], [
            ['1 g q8h', '1 g q12h', '1 g q24h', '500 mg q24h'],
            ['2 g q8h', '2 g q12h', '2 g q24h', '1 g q24h']]):
        assert [r['dose'] for r in reg['renal']] == doses
        assert [(r['min'], r['max'], r['minInclusive'], r['maxInclusive']) for r in reg['renal']] == [
            (50, None, False, False), (31, 50, True, True),
            (16, 30, True, True), (None, 15, False, True)]
        assert reg['source']['updatedOn'] is None
        assert '截圖' in reg['source']['note']
        assert 'UpToDate' in reg['source']['name']
        assert 'Sanford' in reg['dialysisSource']['name']
        assert reg['dialysis']['crrt'][0]['dose'] == '1–2 g q8–12h'
        assert not reg['requiresTdm']


@pytest.mark.parametrize('field', ['source', 'dialysisSource'])
@pytest.mark.parametrize('mutation', ['host', 'missing-date', 'no-explanation'])
def test_regimen_attribution_rejects_invalid_or_unexplained_source(field, mutation):
    data = fixture_data()
    value = {'name':'UpToDate', 'url':'https://www.uptodate.com/contents/ceftazidime-drug-information',
             'updatedOn':'2026-07-22', 'reviewedOn':'2026-09-07'}
    if mutation == 'host': value['url'] = 'https://www.uptodate.com.example.org/contents/drug'
    if mutation == 'missing-date': del value['updatedOn']
    if mutation == 'no-explanation': value['updatedOn'] = None
    data['drugs'][0]['regimens'][0][field] = value
    with pytest.raises(ValueError):
        validate_renal_data(data)
