import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import pytest

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / 'src/curated/antimicrobial_coverage.json'

def load_module():
    path = ROOT / 'build/antimicrobial_data.py'
    assert path.is_file(), '給付資料驗證模組尚未建立'
    spec = importlib.util.spec_from_file_location('antimicrobial_data', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

def test_official_chapter_has_complete_index_and_verbatim_text():
    assert FILE.is_file(), '尚未建立官方條文資料'
    data = json.loads(FILE.read_text(encoding='utf-8'))
    import pymupdf
    source = data['sources'][0]
    doc = pymupdf.open(ROOT / '健保條文' / source['file'])
    lines = [line.strip() for p in doc for line in p.get_text().splitlines() if line.strip() and not re.match(r'^第10節', line)]
    headers = {m.group(1) for line in lines if (m := re.match(r'^(10(?:\.\d+)+)\.(?![\d之])', line))}
    assert headers == {c['id'] for c in data['cards']} | set(data['excludedSections'])
    compact = lambda text: re.sub(r'\s+', '', text)
    official = compact('\n'.join(lines))
    for card in data['cards']:
        assert compact('\n'.join(card['text'])) in official, card['id']
        assert card['summary'] and card['refs']
    assert {'10.3.8', '10.7.14', '10.8.9', '10.8.10', '10.9'} <= {c['id'] for c in data['cards']}
    assert not any(c['id'] in ('10.6.2', '10.8.4') for c in data['cards'])

def test_source_hash_and_schema():
    mod = load_module()
    data = mod.load_antimicrobial_data(ROOT)
    for source in data['sources']:
        assert hashlib.sha256((ROOT / '健保條文' / source['file']).read_bytes()).hexdigest() == source['sha256']

@pytest.mark.parametrize('mutation', ['page','source','date','duplicate','blank','traversal','hash'])
def test_rejects_invalid_data(mutation):
    mod = load_module()
    data = copy.deepcopy(mod.load_antimicrobial_data(ROOT))
    if mutation == 'page': data['cards'][0]['refs'][0]['page'] = 999
    if mutation == 'source': data['cards'][0]['refs'][0]['source'] = 'missing'
    if mutation == 'date': data['cards'][0]['effectiveFrom'] = '2026-02-30'
    if mutation == 'duplicate': data['cards'].append(copy.deepcopy(data['cards'][0]))
    if mutation == 'blank': data['cards'][0]['text'] = []
    if mutation == 'traversal': data['sources'][0]['file'] = '../private.pdf'
    if mutation == 'hash': data['sources'][0]['sha256'] = '0'*64
    with pytest.raises(ValueError): mod.validate_antimicrobial_data(data, ROOT)

def test_high_risk_drug_branches_are_preserved():
    assert FILE.is_file()
    data = json.loads(FILE.read_text(encoding='utf-8'))
    cards = {c['id']: '\n'.join(c['text']) for c in data['cards']}
    for section, terms in {
        '10.3.6':['7天','14天','再照會'],
        '10.3.8':['18歲','7天','14天'],
        '10.6.10':['0.8mg/kg/day','500/mm3','2次','無法口服'],
        '10.8.3':['90天','ampicillin','應停止使用','心內膜炎'],
        '10.7.14':['事前審查','12週'],
    }.items():
        for term in terms: assert term in cards[section], (section,term)

def test_summary_uses_one_item_per_line_and_preserves_maribavir_or_branch():
    data = json.loads(FILE.read_text(encoding='utf-8'))
    for c in data['cards']:
        assert all('；' not in line for line in c['summary']), c['id']
    card = next(c for c in data['cards'] if c['id']=='10.7.14')
    assert any('未達清除 CMV 治療目的或仍有治療需求，且不符合停藥條件' in line for line in card['summary'])

def test_carbapenem_summary_does_not_invent_a_consultation_only_route():
    data = json.loads(FILE.read_text(encoding='utf-8'))
    cards = {c['id']:c for c in data['cards']}
    for key, item in [('10.5.1','第 4 項'),('10.5.2','第 2 項'),('10.5.3','第 3 項')]:
        summary = '\n'.join(cards[key]['summary'])
        assert '路徑' not in summary and '或感染症專科醫師會診' not in summary
        assert item in summary
