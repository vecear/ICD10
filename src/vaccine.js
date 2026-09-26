/* 疫苗速查：純搜尋與文字輸出，不推算個人接種資格。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ICDVaccine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const normalize = (s) => String(s || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
  function search(guide, query, group, topic) {
    const terms = normalize(query).split(' ').filter(Boolean);
    return guide.cards.filter(c => !group || group === 'all' || c.groups.includes(group))
      .filter(c => !topic || topic === 'all' || c.topics.includes(topic))
      .map((card, index) => {
        const title = normalize([card.title, ...card.aliases].join(' '));
        const text = normalize([title, ...card.answer, ...card.cautions].join(' '));
        return {card, index, matches: terms.every(t => text.includes(t)), score: terms.reduce((s, t) => s + (title.includes(t) ? 1 : 0), 0)};
      }).filter(x => x.matches).sort((a, b) => b.score - a.score || a.index - b.index).map(x => x.card);
  }
  function answerText(guide, card) {
    const refs = card.refs.map(ref => {
      const s = guide.sources.find(x => x.id === ref.source);
      return '來源：' + s.title + '（' + s.version + '，第 ' + ref.page + ' 頁）' + (s.url ? '\n' + s.url : '');
    });
    return [card.title, ...card.answer, ...card.cautions.map(x => '注意：' + x), ...refs].join('\n');
  }
  return {search, answerText};
});
