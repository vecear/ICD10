import copy
import importlib.util
import json
from pathlib import Path
import pytest
import fitz

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('vaccine_data', ROOT / 'build/vaccine_data.py')
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)

def test_sources_and_pages_are_valid():
    data = V.load_vaccine_data(ROOT)
    assert len(data['cards']) >= 20
    assert {'pneumococcal', 'hpv', 'mmr', 'rsv', 'common'} <= {g['id'] for g in data['groups']}
    assert all(len(c['groups']) == 1 and c['groups'][0] != 'all' for c in data['cards'])

def test_actual_pdf_pages_and_clinical_citations():
    data = V.load_vaccine_data(ROOT)
    sources = {s['id']: s for s in data['sources']}
    for source in sources.values():
        if source['file'].endswith('.pdf'):
            with fitz.open(ROOT / '疫苗' / source['file']) as document:
                assert len(document) == source['pages']
    for source, page, phrase in [('contra', 3, 'MMR'), ('contra', 4, 'Varicella'), ('measles', 10, '72'), ('men', 2, '抗生素')]:
        with fitz.open(ROOT / '疫苗' / sources[source]['file']) as document:
            assert phrase in document[page-1].get_text()
    cards = {c['id']: c for c in data['cards']}
    assert {'source': 'contra', 'page': 3} in cards['mmr']['refs']
    assert {'source': 'contra', 'page': 4} in cards['varicella']['refs']
    assert {'source': 'measles', 'page': 10} in cards['measles-pep']['refs']

def test_flu_children_115_schedule_and_current_source():
    data = V.load_vaccine_data(ROOT)
    cards = {c['id']: c for c in data['cards']}
    card = cards['flu-child']
    assert card['groups'] == ['flu']
    text = '\n'.join(card['answer'] + card['cautions'])
    for rule in [
        '滿 6 個月至未滿 3 歲：本季前累計 0 或 1 劑 → 本季 2 劑；累計至少 2 劑 → 本季 1 劑。',
        '滿 3 歲至未滿 9 歲：本季前未曾接種 → 本季 2 劑；曾接種至少 1 劑 → 本季 1 劑。',
        '滿 9 歲：不論過去接種史，本季 1 劑。',
        '至少間隔 4 週', '本季第 1 劑當天', '不同流感季', '自費',
    ]:
        assert rule in text
    source = next(s for s in data['sources'] if s['id'] == 'flu115')
    assert '115 年 9 月 22 日' in source['version']
    assert source['url'] == 'https://www.cdc.gov.tw/Category/QAPage/73XYTJQLONnIQaCBBi5YVw'
    assert {'source': 'flu115', 'page': 1} in card['refs']
    assert {'source': 'flu115', 'page': 1} in cards['flu']['refs']
    assert not any('首次接種通常' in line for line in cards['flu']['answer'])

@pytest.mark.parametrize('kind', ['missing', 'hash', 'page', 'duplicate'])
def test_invalid_sources_fail_build(kind):
    data = copy.deepcopy(json.loads((ROOT / 'src/curated/vaccine_guide.json').read_text(encoding='utf-8')))
    if kind == 'missing': data['sources'][0]['file'] = 'missing.pdf'
    if kind == 'hash': data['sources'][0]['sha256'] = '0' * 64
    if kind == 'page': data['cards'][0]['refs'][0]['page'] = 9999
    if kind == 'duplicate': data['cards'].append(data['cards'][0])
    with pytest.raises(ValueError): V.validate_vaccine_data(data, ROOT)

@pytest.mark.parametrize('card_id,phrases', [
    ('flu', ['不活化注射', 'LAIV', '孕婦不適用']),
    ('pregnancy', ['不活化注射', 'LAIV', '孕婦不適用']),
    ('coadmin', ['LAIV', '至少間隔 4 週', 'Abrysvo', '14 天']),
    ('child-schedule', ['四合一', 'DTaP-IPV', '滿 5 歲至入國小前']),
    ('varicella', ['公費第 1 劑', '4–6 歲', '自費第 2 劑']),
    ('rsv', ['Abrysvo', 'Tdap', '14 天', '臨床意義未明']),
])
def test_reviewed_clinical_conditions_are_present(card_id, phrases):
    card = next(c for c in V.load_vaccine_data(ROOT)['cards'] if c['id'] == card_id)
    text = '\n'.join(card['answer'] + card['cautions'])
    assert all(phrase in text for phrase in phrases)

def test_pcv13_followup_names_product_and_preserves_short_interval():
    card = next(c for c in V.load_vaccine_data(ROOT)['cards'] if c['id'] == 'pneumococcal')
    assert '成人公費' in card['title']
    line = next(t for t in card['answer'] if t.startswith('只打過 PCV13/15'))
    assert all(t in line for t in ['1 年', '1 劑 PCV20 或 PCV21'])
    exception = next(t for t in card['answer'] if '8 週' in t)
    assert all(t in exception for t in ['IPD 高風險', '65 歲以上', '1 劑 PCV20 或 PCV21'])

def test_work_citations_land_on_return_to_work_criteria():
    data = V.load_vaccine_data(ROOT)
    source = next(s for s in data['sources'] if s['id'] == 'work')
    with fitz.open(ROOT / '疫苗' / source['file']) as document:
        for card in data['cards']:
            for ref in card['refs']:
                if ref['source'] == 'work':
                    text = document[ref['page'] - 1].get_text()
                    assert ref['page'] == 5
                    assert '72' in text and '佩戴口罩' in text and 'IgG' in text

def test_rsv_spacing_distinguishes_professional_advice_from_label():
    data = V.load_vaccine_data(ROOT)
    sources = {s['id']: s for s in data['sources']}
    for cid in ['rsv', 'tdap', 'pregnancy', 'coadmin']:
        card = next(c for c in data['cards'] if c['id'] == cid)
        assert {'source': 'rsv-professional', 'page': 7} in card['refs']
        assert {'source': 'abrysvo-label', 'page': 7} in card['refs']
        assert any('可先接種 Abrysvo' in t and '14 天' in t for t in card['cautions'])
        assert any('健康非孕女性' in t and '未將同日接種列為禁忌' in t for t in card['cautions'])
    for sid, phrases in [('rsv-professional', ['14', '孕婦', '間隔']),
                         ('abrysvo-label', ['非懷孕女性', 'Tdap', '不劣性', '仍不明'])]:
        with fitz.open(ROOT / '疫苗' / sources[sid]['file']) as document:
            assert all(t in document[6].get_text() for t in phrases)

@pytest.mark.parametrize('url,allowed', [
    ('https://labeling.pfizer.com/ShowLabeling.aspx?id=21164', True),
    ('https://www.tspccm.org.tw/filedownload/10467', True),
    ('https://labeling.pfizer.com.evil.example/label', False),
    ('http://www.cdc.gov.tw/anything', False),
    ('javascript:alert(1)', False),
])
def test_primary_source_url_allowlist(url, allowed):
    data = copy.deepcopy(json.loads((ROOT / 'src/curated/vaccine_guide.json').read_text(encoding='utf-8')))
    data['sources'][0]['url'] = url
    if allowed:
        V.validate_vaccine_data(data, ROOT)
    else:
        with pytest.raises(ValueError): V.validate_vaccine_data(data, ROOT)
