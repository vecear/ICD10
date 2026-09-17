/* 剪貼簿純文字範本：零 DOM，不執行範本中的程式或 HTML。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ICDClipboard = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const defs = {
    date: { label: '日期按鈕', fields: ['民國年', '西元年', '月', '日', '月份', '日期'], template: '{民國年}-{月}-{日}' },
    cart: { label: '診斷清單（含自動複製）', fields: ['清單'], itemFields: ['代碼', '名稱', '序號'], template: '{清單}', itemTemplate: '{代碼}', separator: '\n' },
    single: { label: '單一診斷碼', fields: ['代碼', '名稱'], template: '{代碼}' },
    lipid: { label: 'Lipid 計算機', fields: ['完整結果', '個案資料', '表一', '表二', 'Fibrate', '來源'],
      sectionFields: ['完整段落', '表名', '適用範圍', '分級', '依據', '處方', '門檻', '目標', '次要目標', '結論', '檢附', '條件'],
      template: '{完整結果}', sectionTemplate: '{完整段落}' },
    ccr: { label: 'CCr 計算機', fields: ['CCr', '單位', '體重依據', '所用體重', 'BSA', '校正CCr', '實際CCr', '理想CCr', '調整CCr'],
      template: 'CCr {CCr} {單位}（{體重依據} {所用體重} kg）' },
  };
  const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  function defaults(kind, legacy) {
    const d = defs[kind];
    if (!d) return null;
    const out = { template: d.template };
    if (kind === 'cart') {
      out.itemTemplate = legacy === 'names' ? '{代碼}\t{名稱}' : d.itemTemplate;
      out.separator = legacy === 'comma' ? ',' : '\n';
    }
    if (kind === 'lipid') out.sectionTemplate = d.sectionTemplate;
    return out;
  }
  function validate(kind, config) {
    const d = own(defs, kind) ? defs[kind] : null;
    if (!d || !config || typeof config !== 'object' || Array.isArray(config)) return ['格式設定無效'];
    const errors = [];
    for (const [key, fields, label] of [
      ['template', d.fields, '整體範本'], ['itemTemplate', d.itemFields, '單筆範本'], ['sectionTemplate', d.sectionFields, '表格段落範本'],
    ]) {
      if (!fields) continue;
      const text = config[key];
      if (typeof text !== 'string' || !text.trim() || text.length > 12000) {
        errors.push(label + '須為 1–12000 字'); continue;
      }
      const remainder = text.replace(/\{([^{}]+)\}/g, (all, token) => {
        if (!fields.includes(token)) errors.push(label + '的欄位不存在：' + token);
        return '';
      });
      if (/[{}]/.test(remainder)) errors.push(label + '的欄位括號不完整');
    }
    if (kind === 'cart' && (typeof config.separator !== 'string' || config.separator.length > 100)) errors.push('筆間分隔最多 100 字');
    return errors;
  }
  function normalize(raw) {
    const value = {};
    let invalid = false;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { value, invalid: true };
    for (const kind of Object.keys(raw)) {
      if (!own(defs, kind) || validate(kind, raw[kind]).length) { invalid = true; continue; }
      value[kind] = {};
      for (const key of Object.keys(defaults(kind))) value[kind][key] = raw[kind][key];
    }
    return { value, invalid };
  }
  function render(template, values) {
    // 整行只有缺值欄位時連標籤一起省略；使用者刻意留的空白行則保留。
    return template.split('\n').filter(line => {
      const keys = Array.from(line.matchAll(/\{([^{}]+)\}/g), m => m[1]);
      return !keys.length || keys.some(k => own(values, k) && values[k] !== null && values[k] !== undefined && values[k] !== '');
    }).map(line => line.replace(/\{([^{}]+)\}/g, (_, key) => own(values, key) && values[key] !== null && values[key] !== undefined ? String(values[key]) : '')).join('\n');
  }
  function format(kind, data, preferences, legacy) {
    const config = Object.assign(defaults(kind), preferences && preferences[kind]);
    const errors = validate(kind, config);
    if (errors.length) throw new Error(errors.join('\n'));
    let values = data || {};
    if (kind === 'date') {
      const d = data || new Date();
      const pad = n => String(n).padStart(2, '0');
      values = { 民國年: d.getFullYear() - 1911, 西元年: d.getFullYear(), 月: pad(d.getMonth() + 1), 日: pad(d.getDate()), 月份: d.getMonth() + 1, 日期: d.getDate() };
    } else if (kind === 'cart') {
      if (!data || !data.length) return '';
      // 未自訂時保留原本三種診斷格式。
      if (!preferences || !preferences.cart) Object.assign(config, defaults(kind, legacy));
      values = { 清單: data.map((item, i) => render(config.itemTemplate, { 代碼: item.code, 名稱: item.zh, 序號: i + 1 })).join(config.separator) };
    } else if (kind === 'single') {
      values = { 代碼: data.code, 名稱: data.zh };
    } else if (kind === 'lipid') {
      values = Object.assign({}, data);
      for (const name of ['表一', '表二', 'Fibrate']) {
        values[name] = data.sections && data.sections[name] ? render(config.sectionTemplate, data.sections[name]) : '';
      }
    }
    return render(config.template, values);
  }
  function presets(kind, legacy) {
    const base = defaults(kind, legacy);
    const out = [{ label: '目前預設', config: base }];
    if (kind === 'date') out.push(
      { label: '西元 YYYY/MM/DD', config: { template: '{西元年}/{月}/{日}' } },
      { label: '民國 YYY/MM/DD', config: { template: '{民國年}/{月}/{日}' } },
      { label: '民國 YYYMMDD', config: { template: '{民國年}{月}{日}' } });
    if (kind === 'cart') for (const [name, mode] of [['代碼逐行', 'lines'], ['代碼逗號分隔', 'comma'], ['代碼與名稱', 'names']]) out.push({ label: name, config: defaults(kind, mode) });
    if (kind === 'single') out.push({ label: '代碼與名稱', config: { template: '{代碼} {名稱}' } });
    if (kind === 'ccr') out.push({ label: '簡短結果', config: { template: 'CCr {CCr} {單位}' } }, { label: '含 BSA 與校正值', config: { template: base.template + '\nBSA {BSA} m²\n校正 CCr {校正CCr} mL/min/1.73 m²' } });
    if (kind === 'lipid') out.push(
      { label: '各表可編輯段落', config: { template: '【降血脂給付依據】{個案資料}\n\n{表一}\n\n{表二}\n\n{Fibrate}\n\n{來源}', sectionTemplate: '{表名}{適用範圍}\n分級：{分級}\n依據：{依據}\n處方：{處方}\n門檻：{門檻}\n目標：{目標}\n次要目標：{次要目標}\n結論：{結論}\n檢附：{檢附}\n條件：{條件}' } },
      { label: '各表精簡結論', config: { template: '{個案資料}\n{表一}\n{表二}\n{Fibrate}', sectionTemplate: '{表名}：{結論}' } });
    return out;
  }
  return { defs, defaults, validate, normalize, render, format, presets };
});
