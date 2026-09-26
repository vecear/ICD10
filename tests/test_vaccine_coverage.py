"""VAC 診間查詢契約；覆蓋檢查不能取代來源人工審閱。"""
import copy
import importlib.util
import json
from pathlib import Path
import pytest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('vaccine_coverage_data', ROOT / 'build/vaccine_data.py')
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)
TOPICS = {'types', 'indications', 'schedule', 'catchup', 'contraindications', 'special', 'reactions'}

def guide():
    return json.loads((ROOT / 'src/curated/vaccine_guide.json').read_text(encoding='utf-8'))

def test_every_vaccine_has_seven_clinical_topics():
    data = guide()
    assert {t['id'] for t in data['topics']} == TOPICS | {'all'}
    groups = {g['id'] for g in data['groups']} - {'all', 'common'}
    assert {'bcg', 'rotavirus', 'hib', 'polio', 'rabies', 'yellow-fever', 'typhoid', 'ev71'} <= groups
    for group in groups:
        cards = [c for c in data['cards'] if c['groups'] == [group]]
        assert set().union(*(set(c['topics']) for c in cards)) == TOPICS, group
    for c in data['cards']:
        assert len(c['groups']) == 1 and c['groups'][0] != 'all'
        assert c['topics'] and set(c['topics']) <= TOPICS

@pytest.mark.parametrize('mutation', ['missing', 'unknown', 'duplicate', 'coverage'])
def test_validator_rejects_bad_topics(mutation):
    data = copy.deepcopy(guide())
    if mutation == 'missing':
        data['cards'][0]['topics'] = []
    elif mutation == 'unknown':
        data['cards'][0]['topics'] = ['made-up']
    elif mutation == 'duplicate':
        data['topics'].append(data['topics'][0])
    else:
        for c in data['cards']:
            if c['groups'] == ['flu']:
                c['topics'] = [t for t in c['topics'] if t != 'reactions'] or ['types']
    with pytest.raises(ValueError, match='主題'):
        V.validate_vaccine_data(data, ROOT)

def test_new_clinical_high_risk_boundaries_are_explicit():
    cards = {c['id']: c for c in guide()['cards']}
    def text(key):
        return '\n'.join(cards[key]['answer'] + cards[key]['cautions'])
    assert '24 週' in text('rotavirus-schedule') and '32 週' in text('rotavirus-schedule')
    assert '腸套疊' in text('rotavirus-contra') and 'SCID' in text('rotavirus-contra')
    assert '2027-01-01' in text('rotavirus-schedule')
    assert '2026-10-01' in text('covid') and '84 天' in text('covid')
    assert '0、3、7、14' in text('rabies-pep')
    assert '0、7、21 或 28' in text('rabies-schedule')
    assert '終身' in text('yellow-fever-schedule') and '10 天' in text('yellow-fever-schedule')
    assert '不需' in text('bcg-catchup') and '疤' in text('bcg-catchup')
    assert '非複製型' in text('mpox-contra')
    assert '不是流感' in text('hib-types')


def test_brand_and_age_specific_schedules_keep_their_sources():
    cards = {c['id']: c for c in guide()['cards']}
    men = cards['men-infant']
    assert any('2–5 個月' in line and '6 個月' in line for line in men['answer'])
    assert any('6–11 個月' in line and '至少 2 個月' in line for line in men['answer'])
    assert any(ref['source'] == 'men-label' for ref in men['refs'])
    ev = cards['ev71-schedule']['answer']
    assert any('安拓伏' in line and '28 天' in line for line in ev)
    assert any('恩穩健' in line and '56 天' in line for line in ev)
    assert any('第 1 劑時未滿 2 歲' in line and '首劑接種日 1 年後' in line for line in ev)
    assert any('完成 MenACWY 基礎系列時未滿 7 歲' in line for line in cards['men-schedule']['answer'])
    assert any(ref['source'] == 'us-men' for ref in cards['men-schedule']['refs'])
