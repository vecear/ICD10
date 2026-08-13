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

  // 回傳的陣列另帶 total（截斷前的命中總數），供 UI 顯示「共 N 筆，顯示前 M 筆」。
  function withTotal(rows, total) {
    rows.total = total;
    return rows;
  }

  function search(index, query, limit) {
    limit = limit || 50;
    const q = (query || '').trim();
    if (q.length < 2) return withTotal([], 0);
    const out = [];
    const seen = new Set();
    const ranks = new Map();
    const { db, nodot, lowerEn, curatedCodes } = index;
    const ql = q.toLowerCase();
    const isCode = /^[a-z][0-9a-z.]*$/i.test(q);   // 像代碼：先做代碼前綴
    const qc = isCode ? q.toUpperCase().replace(/\./g, '') : '';
    // 命中層級：0 完全相符、1 開頭相符、2 其他（僅作為「精選碼優先」之後的次要排序）
    const rankOf = (i) => {
      if ((isCode && nodot[i] === qc) || db[i][3] === q || lowerEn[i] === ql) return 0;
      if ((isCode && nodot[i].startsWith(qc)) || db[i][3].startsWith(q) || lowerEn[i].startsWith(ql)) return 1;
      return 2;
    };
    const push = (i) => {
      const row = db[i];
      if (seen.has(row[0])) return;
      seen.add(row[0]);
      ranks.set(row[0], rankOf(i));
      out.push(row);
    };
    if (isCode) {
      for (let i = 0; i < db.length; i++)
        if (nodot[i].startsWith(qc)) push(i);
    }
    for (let i = 0; i < db.length; i++)
      if (lowerEn[i].includes(ql) || db[i][3].includes(q)) push(i);
    // 人工精選（門診常用）碼優先顯示，其次依命中層級，同層級維持原順序（穩定排序）
    out.sort((a, b) =>
      ((curatedCodes.has(b[0]) ? 1 : 0) - (curatedCodes.has(a[0]) ? 1 : 0))
      || (ranks.get(a[0]) - ranks.get(b[0])));
    return withTotal(out.slice(0, limit), out.length);
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

  function mergeRelated(base, extra) {
    const out = [];
    const seen = new Set();
    for (const code of [...(base || []), ...(extra || [])]) {
      if (!seen.has(code)) {
        seen.add(code);
        out.push(code);
      }
    }
    return out;
  }

  /* HIS 的民國日期（115-08-13）。民國元年＝西元 1912 年，所以減 1911。
     月日補零：HIS 欄位是定長格式，8 月寫成 8 會對不齊。
     參數只為了測試能餵固定日期；平常不傳，用當下時間。 */
  function rocDate(date) {
    const d = date || new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return (d.getFullYear() - 1911) + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  return { buildIndex, search, family, formatCart, mergeRelated, rocDate };
});
