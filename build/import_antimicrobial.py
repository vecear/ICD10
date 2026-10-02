"""由已保存的官方 PDF 重建第十節索引與原文；摘要／別名由人工維護檔保留。

首次整理與改版時先逐條核對摘要。此腳本不自行下載、不推論新的給付條件。
用法：python build/import_antimicrobial.py
"""
import hashlib
import json
import re
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parents[1]
HEADER = re.compile(r'^(10(?:\.\d+)+)\.(?![\d之])')
MARKER = re.compile(r'^(?:\d+\.|[（(]\d+[）)]|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+\.|[IVX]+\.|[A-Da-d]\.|[iv]+\.|甲類|乙類|註[：:]|◎)')


def extract_sections(path):
    """移除頁首與空行，保留條號、頁碼及跨頁內容；不改動原文字元。"""
    sections = {}
    current = None
    with pymupdf.open(path) as doc:
        for page_number, page in enumerate(doc, 1):
            for raw in page.get_text().splitlines():
                line = raw.strip()
                if not line or re.match(r'^第10節', line):
                    continue
                match = HEADER.match(line)
                if match:
                    current = match.group(1)
                    if current in sections:
                        raise ValueError('重複條號 ' + current)
                    sections[current] = {'page':page_number,'lines':[]}
                if current:
                    sections[current]['lines'].append(line)
    return sections


def paragraphs(lines):
    result = []
    for line in lines:
        if not result or MARKER.match(line) or line in ('限','限用於','用於慢性病毒性B 型肝炎患者之條件如下：'):
            result.append(line)
        else:
            result[-1] += line
    return result


def main():
    target = ROOT / 'src/curated/antimicrobial_coverage.json'
    data = json.loads(target.read_text(encoding='utf-8'))
    source = data['sources'][0]
    path = ROOT / '健保條文' / source['file']
    sections = extract_sections(path)
    known = {c['id'] for c in data['cards']} | set(data['excludedSections'])
    if known != set(sections):
        raise ValueError('條號異動需人工核對：' + str(sorted(known ^ set(sections))))
    for card in data['cards']:
        section = sections[card['id']]
        card['text'] = paragraphs(section['lines'])
        card['refs'] = [{'source':source['id'],'page':section['page']}]
    source['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
    with pymupdf.open(path) as doc:
        source['pages'] = len(doc)
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n',encoding='utf-8',newline='\n')
    print(f'抗微生物給付：{len(data["cards"])} 條，排除 {len(data["excludedSections"])} 個分類標題／已刪除條文')


if __name__ == '__main__':
    main()
