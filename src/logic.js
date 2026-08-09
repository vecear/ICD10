/* 純邏輯層：瀏覽器掛 window.ICDLogic；node 供測試 require。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ICDLogic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function buildIndex(db, curatedCodes) {
    const nodot = new Array(db.length);
    const lowerEn = new Array(db.length);
    const byCode = new Map();
    for (let i = 0; i < db.length; i++) {
      nodot[i] = db[i][0].replace('.', '');
      lowerEn[i] = db[i][2].toLowerCase();
      byCode.set(db[i][0], db[i]);
    }
    return { db, nodot, lowerEn, byCode, curatedCodes: curatedCodes || new Set() };
  }

  function search(index, query, limit) {
    limit = limit || 50;
    const q = (query || '').trim();
    if (q.length < 2) return [];
    const out = [];
    const seen = new Set();
    const push = (row) => { if (!seen.has(row[0])) { seen.add(row[0]); out.push(row); } };
    const { db, nodot, lowerEn, curatedCodes } = index;
    if (/^[a-z][0-9a-z.]*$/i.test(q)) {           // 像代碼：先做代碼前綴
      const qc = q.toUpperCase().replace(/\./g, '');
      for (let i = 0; i < db.length; i++)
        if (nodot[i].startsWith(qc)) push(db[i]);
    }
    const ql = q.toLowerCase();
    for (let i = 0; i < db.length; i++)
      if (lowerEn[i].includes(ql) || db[i][3].includes(q)) push(db[i]);
    // 人工精選（門診常用）碼優先顯示，其餘維持原順序（穩定排序）
    if (curatedCodes.size) out.sort((a, b) => (curatedCodes.has(b[0]) ? 1 : 0) - (curatedCodes.has(a[0]) ? 1 : 0));
    return out.slice(0, limit);
  }

  function family(index, code, limit) {
    limit = limit || 20;
    const cat = code.slice(0, 3);
    const out = [];
    for (const row of index.db) {
      if (row[1] === 1 && row[0] !== code && row[0].slice(0, 3) === cat) {
        out.push(row);
        if (out.length >= limit) break;
      }
    }
    return out;
  }

  function formatCart(items, fmt) {
    if (fmt === 'comma') return items.map(x => x.code).join(',');
    if (fmt === 'names') return items.map(x => x.code + '\t' + x.zh).join('\n');
    return items.map(x => x.code).join('\n');
  }

  return { buildIndex, search, family, formatCart };
});
