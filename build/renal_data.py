"""離線抗菌藥資料驗證；來源連結僅供使用者主動開啟。"""
import json
import math
from datetime import date
from pathlib import Path
from urllib.parse import urlparse


def validate_renal_data(data):
    def require(ok, message):
        if not ok:
            raise ValueError('抗菌藥資料：' + message)

    def text(value):
        return isinstance(value, str) and bool(value.strip()) and '<script' not in value.lower() and '</' not in value

    def source(value):
        p = urlparse(value if isinstance(value, str) else '')
        return p.scheme == 'https' and p.netloc in {'web.sanfordguide.com', 'www.uptodate.com'} and bool(p.path) and not p.query and not p.fragment

    def day(value):
        try:
            return date.fromisoformat(value).isoformat() == value and date.fromisoformat(value) <= date.today()
        except (ValueError, TypeError):
            return False

    require(isinstance(data, dict) and data.get('version') == 1, '版本錯誤')
    require(day(data.get('reviewedOn')), '查閱日期錯誤')
    s = data.get('source', {})
    require(text(s.get('name')) and source(s.get('url')) and day(s.get('updatedOn')), '來源錯誤')
    require(isinstance(data.get('drugs'), list) and data['drugs'], '藥物清單為空')
    ids = set()
    for drug in data['drugs']:
        require(text(drug.get('id')) and drug['id'] not in ids, '藥物 ID 重複或缺漏')
        ids.add(drug['id'])
        require(text(drug.get('name')) and text(drug.get('className')) and source(drug.get('sourceUrl')), '藥物名稱／來源錯誤')
        for field in ('aliases', 'notes'):
            require(isinstance(drug.get(field), list) and all(text(x) for x in drug[field]), field + ' 格式錯誤')
        require(isinstance(drug.get('regimens'), list) and drug['regimens'], '方案清單為空')
        regimen_ids = set()
        for reg in drug['regimens']:
            require(text(reg.get('id')) and reg['id'] not in regimen_ids, '方案 ID 重複或缺漏')
            regimen_ids.add(reg['id'])
            require(text(reg.get('label')) and text(reg.get('route')), '方案名稱／途徑缺漏')
            require(isinstance(reg.get('requiresTdm'), bool), 'TDM 標記錯誤')
            require(reg.get('renalMetric', 'crcl') in ('crcl', 'crcl-indexed'), '腎功能指標錯誤')
            require(isinstance(reg.get('notes'), list) and all(text(n) for n in reg['notes']), '方案註記錯誤')
            for source_field in ('source', 'dialysisSource'):
                if source_field not in reg:
                    continue
                rs = reg[source_field]
                require(isinstance(rs, dict), '方案來源格式錯誤')
                require(text(rs.get('name')) and source(rs.get('url'))
                        and day(rs.get('reviewedOn')), '方案來源錯誤')
                require('updatedOn' in rs and (day(rs['updatedOn'])
                        or (rs['updatedOn'] is None and text(rs.get('note')))), '方案來源更新日期錯誤')
                require('note' not in rs or text(rs['note']), '方案來源註記錯誤')
            require(isinstance(reg.get('renal'), list) and reg['renal'], '腎功能列缺漏')
            dialysis = reg.get('dialysis', {})
            require(set(dialysis) == {'ihd', 'capd', 'crrt', 'sled'}, '透析種類錯誤')
            require(all(isinstance(v, list) for v in dialysis.values()), '透析列格式錯誤')
            for row in reg['renal']:
                for field in ('min', 'max'):
                    v = row.get(field)
                    require(field in row and (v is None or (type(v) in (int, float) and math.isfinite(v) and v >= 0)), '分段數值錯誤')
                require(all(isinstance(row.get(f), bool) for f in ('minInclusive', 'maxInclusive')), '邊界包含標記錯誤')
                lo, hi = row['min'], row['max']
                require(lo is None or hi is None or lo < hi or (lo == hi and row['minInclusive'] and row['maxInclusive']), '分段上下界錯誤')
            for row in reg['renal'] + [r for rows in dialysis.values() for r in rows]:
                require(text(row.get('label')) and text(row.get('dose')), '劑量／列名稱缺漏')
                require('note' not in row or text(row['note']), '劑量註記錯誤')
                require('manual' not in row or isinstance(row['manual'], bool), '人工判定標記錯誤')
    return len(ids)


def load_renal_data(path):
    data = json.loads(Path(path).read_text(encoding='utf-8'))
    validate_renal_data(data)
    return data


def renal_script(data):
    validate_renal_data(data)
    # JSON slash escaping 讓文字無法提早關閉 script；此區只含資料，沒有外部載入。
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('/', '\\/').replace('<', '\\u003c')
    return '<script>\nwindow.ANTIBIOTIC_DOSING = ' + payload + ';\n</script>\n'
