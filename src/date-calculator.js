/* 純日曆日期加減：起算日為第 0 天，UTC 運算不受日光節約時間影響。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ICDDateCalculator = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function calculate(start, days, direction) {
    const fail = error => ({ok: false, error});
    if (typeof start !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(start)) {
      return fail('請輸入完整的起算日期。');
    }
    const [year, month, day] = start.split('-').map(Number);
    // setUTCFullYear 避免 Date.UTC 將 0–99 年解讀為 1900–1999 年。
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    if (year < 1 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      return fail('請輸入有效的起算日期（西元 0001–9999 年）。');
    }
    if (days === '' || (typeof days === 'string' && !days.trim())) return fail('請輸入天數。');
    if (!['string', 'number'].includes(typeof days) || !/^\d+$/.test(String(days)) || !Number.isSafeInteger(Number(days))) {
      return fail('天數請輸入 0 或正整數（非負整數）。');
    }
    if (direction !== 'before' && direction !== 'after') return fail('請選擇往前或往後。');
    date.setUTCDate(day + (direction === 'before' ? -1 : 1) * Number(days));
    const resultYear = date.getUTCFullYear();
    if (!Number.isFinite(date.getTime()) || resultYear < 1 || resultYear > 9999) {
      return fail('計算結果超出西元 0001–9999 年，請調整日期或天數。');
    }
    return {
      ok: true,
      date: date.toISOString().slice(0, 10),
      label: resultYear + '年' + (date.getUTCMonth() + 1) + '月' + date.getUTCDate() + '日',
      weekday: '星期' + '日一二三四五六'[date.getUTCDay()],
    };
  }
  return {calculate};
});
