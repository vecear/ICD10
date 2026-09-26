"""VAC 來源、引用與離線交付守門。"""
import hashlib
import json
import re
import shutil
from pathlib import Path
from urllib.parse import urlsplit


def validate_vaccine_data(data, root):
    def require(condition, message):
        if not condition:
            raise ValueError('VAC：' + message)

    require(re.fullmatch(r'\d{4}-\d{2}-\d{2}', data.get('version', '')), '缺少整理版本')
    sources = {}
    for source in data['sources']:
        key, name = source['id'], source['file']
        require(key not in sources, '來源 ID 重複')
        require(Path(name).name == name and '/' not in name and '\\' not in name, '來源路徑不合法')
        require(Path(name).suffix.lower() in {'.pdf', '.txt'}, '不支援的來源格式')
        path = root / '疫苗' / name
        require(path.is_file(), '找不到來源 ' + name)
        require(hashlib.sha256(path.read_bytes()).hexdigest() == source['sha256'], '來源 SHA-256 不符 ' + name)
        require(source['title'] and source['version'] and source['pages'] > 0, '來源版本／頁數不完整')
        if source.get('url'):
            url = urlsplit(source['url'])
            require(url.scheme == 'https' and url.netloc in {
                'www.cdc.gov.tw', 'www.cdc.gov', 'health.gov.taipei', 'mcp.fda.gov.tw',
                'labeling.pfizer.com', 'www.tspccm.org.tw',
            }, '線上來源非核准的第一方網站')
        sources[key] = source
    groups = {g['id'] for g in data['groups']}
    require(len(groups) == len(data['groups']), '分類 ID 重複')
    required_topics = {'types', 'indications', 'schedule', 'catchup', 'contraindications', 'special', 'reactions'}
    topics = {t['id'] for t in data.get('topics', [])}
    require(topics == required_topics | {'all'} and len(topics) == len(data.get('topics', [])), '主題定義不完整或重複')
    coverage = {g: set() for g in groups - {'all', 'common'}}
    ids = set()
    for card in data['cards']:
        require(card['id'] not in ids, '卡片 ID 重複')
        ids.add(card['id'])
        require(card['title'] and card['answer'] and card['refs'], '答案或引用空白')
        require(len(card['groups']) == 1 and set(card['groups']) <= groups - {'all'}, '未知情境分類或歸屬不唯一')
        card_topics = card.get('topics', [])
        require(card_topics and set(card_topics) <= required_topics and len(set(card_topics)) == len(card_topics), '卡片主題空白、未知或重複')
        if card['groups'][0] in coverage:
            coverage[card['groups'][0]].update(card_topics)
        require(all(isinstance(x, str) and x.strip() for x in card['answer'] + card['cautions']), '答案含空行')
        for ref in card['refs']:
            require(ref['source'] in sources, '引用不存在')
            require(type(ref['page']) is int and 1 <= ref['page'] <= sources[ref['source']]['pages'], '引用頁碼超出範圍')
    for group, covered in coverage.items():
        require(covered == required_topics, '疫苗主題缺漏：' + group)
    return data


def load_vaccine_data(root):
    data = json.loads((root / 'src/curated/vaccine_guide.json').read_text(encoding='utf-8'))
    return validate_vaccine_data(data, root)


def copy_vaccine_sources(data, root, output):
    destination = output / '疫苗'
    destination.mkdir(parents=True, exist_ok=True)
    for source in data['sources']:
        target = destination / source['file']
        shutil.copy2(root / '疫苗' / source['file'], target)
        if hashlib.sha256(target.read_bytes()).hexdigest() != source['sha256']:
            raise ValueError('VAC：交付來源 SHA-256 不符 ' + source['file'])


def vaccine_script(data):
    # 防止資料文字意外提前結束 inline script。
    encoded = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('https://', 'https:\\/\\/')
    return '<script>window.VACCINE_GUIDE = ' + encoded + ';</script>\n'
