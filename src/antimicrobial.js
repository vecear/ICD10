/* 抗微生物給付：純搜尋、有效期間及完整條文文字輸出。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ICDAntimicrobial = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const normalize = s => String(s || '').normalize('NFKC').toLowerCase().replace(/\s*[+/]\s*/g, '/').replace(/\s+/g, ' ').trim();
  function today() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }
  function status(card, date = today()) {
    if (card.effectiveFrom && date < card.effectiveFrom) return 'upcoming';
    if (card.effectiveTo && date >= card.effectiveTo) return 'expired';
    return 'current';
  }
  function displayLine(line) {
    // 官方 PDF 文字擷取會將上標展平；只修正已逐項核對的 HBV/FIB-4 單位。
    return line.replace(/2×105 IU\/mL/g, '2×10⁵ IU/mL').replace(/count\(109\/L\)/g, 'count(10⁹/L)');
  }
  function search(guide, query, group = 'all', date = today()) {
    const terms = normalize(query).split(' ').filter(Boolean);
    return guide.cards.filter(c => (group === 'all' || c.group === group) && status(c, date) !== 'expired')
      .map((card, index) => {
        const name = normalize([card.id, card.title, ...card.aliases].join(' '));
        const full = normalize([name, ...card.summary, ...card.text].join(' '));
        return {card, index, matches: terms.every(t => full.includes(t)), score: terms.reduce((n, t) => n + (name.includes(t) ? 1 : 0), 0)};
      }).filter(x => x.matches).sort((a, b) => b.score - a.score || a.index - b.index).map(x => x.card);
  }
  function answerText(guide, card, date = today()) {
    const state = status(card, date);
    const refs = card.refs.map(ref => {
      const s = guide.sources.find(x => x.id === ref.source);
      return '來源：' + s.title + '（版本 ' + s.version + '，第 ' + ref.page + ' 頁）\n查證日期：' + s.checked + '\n' + s.url;
    });
    return [card.id + ' ' + card.title, ...(state === 'upcoming' ? ['尚未生效：' + card.effectiveFrom] : []),
      '給付重點（摘要）', ...card.summary, '完整條文', ...card.text.map(displayLine), ...refs].join('\n');
  }
  return {today, status, search, answerText, displayLine};
});
