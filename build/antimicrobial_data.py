"""抗微生物給付速查：資料結構、來源及離線引用驗證。"""
from datetime import date
import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit


def validate_antimicrobial_data(data, root):
    def require(condition, message):
        if not condition:
            raise ValueError('抗微生物給付：' + message)

    def check_date(value):
        try:
            require(isinstance(value, str) and len(value) == 10 and date.fromisoformat(value).isoformat() == value, '日期格式不合法')
        except (ValueError, TypeError):
            raise ValueError('抗微生物給付：日期格式不合法') from None

    check_date(data['version'])
    sources = {}
    for s in data['sources']:
        name = s['file']
        require(s['id'] not in sources, '來源 ID 重複')
        require(name and not any(c in name for c in '/\\:') and Path(name).suffix == '.pdf', '來源檔名不合法')
        path = root / '健保條文' / name
        require(path.is_file(), '找不到官方來源 ' + name)
        require(hashlib.sha256(path.read_bytes()).hexdigest() == s['sha256'], '來源 SHA-256 不符 ' + name)
        require(s['title'] and s['version'] and type(s['pages']) is int and s['pages'] > 0, '來源資訊不完整')
        check_date(s['checked'])
        url = urlsplit(s['url'])
        require(url.scheme == 'https' and url.hostname in {'www.nhi.gov.tw','info.nhi.gov.tw'}, '來源必須為健保署官方網站')
        sources[s['id']] = s
    require(sources, '來源清單空白')
    groups = {g['id'] for g in data['groups']}
    require(len(groups) == len(data['groups']) and 'all' in groups, '分類定義不合法')
    ids = set()
    require(data['cards'], '條文清單空白')
    for c in data['cards']:
        require(c['id'] not in ids and c['id'].startswith('10.'), '條號重複或不合法')
        ids.add(c['id'])
        require(c['title'] and c['group'] in groups - {'all'}, '標題或分類不合法')
        for key in ('summary','text'):
            require(c[key] and all(isinstance(x,str) and x.strip() for x in c[key]), '摘要或原文空白')
        require(isinstance(c['aliases'],list) and all(isinstance(x,str) and x.strip() for x in c['aliases']), '別名不合法')
        require(c['refs'], '缺少引用')
        for r in c['refs']:
            require(r['source'] in sources, '引用來源不存在')
            require(type(r['page']) is int and 1 <= r['page'] <= sources[r['source']]['pages'], '引用頁碼超出範圍')
        for key in ('effectiveFrom','effectiveTo'):
            if c.get(key): check_date(c[key])
        require(not c.get('effectiveFrom') or not c.get('effectiveTo') or c['effectiveFrom'] < c['effectiveTo'], '有效期間反向')
    require(not (ids & set(data['excludedSections'])), '排除條號仍列為有效條文')
    return data


def load_antimicrobial_data(root):
    data = json.loads((root / 'src/curated/antimicrobial_coverage.json').read_text(encoding='utf-8'))
    return validate_antimicrobial_data(data, root)


def antimicrobial_script(data):
    encoded = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<','\\u003c').replace('https://','https:\\/\\/')
    return '<script>window.ANTIMICROBIAL_COVERAGE = ' + encoded + ';</script>\n'
