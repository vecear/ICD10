/* 純邏輯層：瀏覽器掛 window.ICDRenal；node 供測試 require。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ICDRenal = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function searchDrugs(data, query) {
    const drugs = data && Array.isArray(data.drugs) ? data.drugs : [];
    const q = typeof query === 'string' ? query.trim().toLowerCase() : '';
    const words = q ? q.split(/\s+/) : [];
    return drugs.filter(drug => {
      const text = [drug.name, ...(drug.aliases || []), drug.className].join(' ').toLowerCase();
      return words.every(word => text.includes(word));
    });
  }

  // 只接受數字與非空數字字串；空白、布林、陣列不得被 Number 轉為有效輸入。
  function inputNumber(value) {
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    if (typeof value === 'string' && !value.trim()) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function result(status, message, rowIndex = null) {
    return { status, message, rowIndex };
  }

  function validRow(row) {
    if (!row || typeof row !== 'object') return false;
    // 來源邊界只允許 null 或有限數字；空字串不是無界，也不是零。
    const bound = value => value === null || (typeof value === 'number' && Number.isFinite(value));
    return bound(row.min) && bound(row.max)
      && typeof row.minInclusive === 'boolean' && typeof row.maxInclusive === 'boolean'
      && (row.min === null || row.max === null || row.min <= row.max);
  }

  function compareBoundary(value, boundary) {
    // 僅消除公式運算的二進位浮點尾差（如 15.000000000000002）。
    // 不按顯示位數取整；15.0000000001 等真正差值仍照原始區間判定。
    const tolerance = 2 * Number.EPSILON * Math.max(Math.abs(value), Math.abs(boundary));
    const difference = value - boundary;
    return Math.abs(difference) <= tolerance ? 0 : Math.sign(difference);
  }

  function recommend(regimen, input) {
    const raw = input || {};
    // 此工具僅查成人方案；年齡是 CCr 計算輸入，不是查表的前置條件。
    const state = raw.renalState;
    if (!['stable', 'aki', 'ihd', 'capd', 'crrt', 'sled'].includes(state)) {
      return result('needs-input', '請選擇有效的腎功能情境。');
    }
    if (state === 'aki') return result('unstable', 'AKI／腎功能不穩定，需人工評估，不依 CCr 自動選列。');
    if (state !== 'stable') {
      return result('dialysis', state.toUpperCase() + '：僅供來源方案對照，請核對各列適用條件；不依 CCr 自動選列，不提供單一推薦。');
    }
    if (!regimen || typeof regimen !== 'object') {
      return result('needs-input', '請選擇藥物方案。');
    }
    let crcl = inputNumber(raw.crcl);
    if (crcl === null || crcl < 0) {
      return result('needs-input', '請輸入有限且非負的 CCr（mL/min）。');
    }
    const metric = regimen.renalMetric === undefined ? 'crcl' : regimen.renalMetric;
    if (!['crcl', 'crcl-indexed'].includes(metric)) {
      return result('manual', '來源腎功能指標尚未支援自動換算，請個別核對。');
    }
    if (metric === 'crcl-indexed') {
      const bsa = inputNumber(raw.bsa);
      if (bsa === null || bsa <= 0) {
        return result('needs-input', '請補填有效身高與實際體重，以計算 BSA 及校正 CCr；仍可查閱完整表格。');
      }
      crcl = crcl * 1.73 / bsa;
      if (!Number.isFinite(crcl)) return result('needs-input', '校正 CCr 無效，請核對身高、體重與 CCr。');
    }
    const rows = regimen.renal;
    if (!Array.isArray(rows) || !rows.length || !rows.every(validRow)) {
      return result('gap', '腎功能區間資料缺漏或無效，請核對來源。');
    }

    const matches = [];
    rows.forEach((row, index) => {
      const above = row.min === null || (row.minInclusive
        ? compareBoundary(crcl, row.min) >= 0 : compareBoundary(crcl, row.min) > 0);
      const below = row.max === null || (row.maxInclusive
        ? compareBoundary(crcl, row.max) <= 0 : compareBoundary(crcl, row.max) < 0);
      if (above && below) matches.push(index);
    });
    if (!matches.length) return result('gap', 'CCr 落在來源區間缺口或表列範圍外，請核對來源。');
    if (matches.length > 1) return result('gap', '來源區間重疊，無法唯一選列，請核對來源。');

    const rowIndex = matches[0];
    if (regimen.requiresTdm) {
      return result('manual', '此方案需依來源條件個別核對，並需 TDM 監測；符合區間僅供對照，不代表已確認處方。', rowIndex);
    }
    if (rows[rowIndex].manual) {
      return result('manual', '此方案需依來源條件個別核對', rowIndex);
    }
    return result('matched', 'CCr 符合唯一腎功能區間，請核對該列劑量與適用條件。', rowIndex);
  }

  return { searchDrugs, recommend };
});
