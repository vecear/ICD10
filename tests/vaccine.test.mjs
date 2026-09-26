import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const V = require('../src/vaccine.js');
const guide = require('../src/curated/vaccine_guide.json');
const S = require('../src/state.js');

test('以疫苗縮寫、俗稱及問題搜尋，標題優先', () => {
  assert.equal(V.search(guide, 'HPV')[0].id, 'hpv');
  assert.equal(V.search(guide, '皮蛇')[0].id, 'zoster');
  assert.ok(V.search(guide, 'MMR 懷孕').some(x => x.id === 'mmr'));
  assert.ok(V.search(guide, 'ｈｐｖ').length);
  assert.equal(V.search(guide, '<script>不存在</script>').length, 0);
});
test('以疫苗種類篩選，問題都有唯一歸屬且不遺漏', () => {
  assert.equal(V.search(guide, '').length, guide.cards.length);
  assert.deepEqual(V.search(guide, '', 'pneumococcal').map(x => x.id), ['pneumococcal', 'ipd']);
  assert.deepEqual(V.search(guide, '', 'rsv').map(x => x.id), ['rsv', 'palivizumab']);
  assert.ok(V.search(guide, '', 'mmr').some(x => x.id === 'measles-pep'));
  assert.ok(V.search(guide, '', 'common').some(x => x.id === 'pregnancy'));
  const assigned = guide.groups.filter(g => g.id !== 'all').flatMap(g => V.search(guide, '', g.id));
  assert.equal(assigned.length, guide.cards.length);
  assert.equal(new Set(assigned.map(x => x.id)).size, guide.cards.length);
  assert.equal(V.search(guide, '', 'unknown').length, 0);
});
test('複製答案保留限制、來源版本與每項獨立一行', () => {
  const card = guide.cards.find(x => x.id === 'pneumococcal');
  const text = V.answerText(guide, card);
  for (const line of [...card.answer, ...card.cautions]) assert.ok(text.includes(line));
  assert.match(text, /115.*8/);
  assert.match(text, /來源/);
});
test('VAC 與既有浮層互斥，重新載入不保留', () => {
  const store = S.createStore();
  store.setCcrOpen(true);
  store.setVacOpen(true);
  assert.equal(store.getState().ccrOpen, false);
  assert.equal(store.getState().vacOpen, true);
  for (const open of [() => store.setLipidOpen(true), () => store.setCcrOpen(true), () => store.setChronicTopic('dm'), () => store.setSettingsOpen(true)]) {
    store.setVacOpen(true); open(); assert.equal(store.getState().vacOpen, false);
  }
  assert.equal(S.createStore().getState().vacOpen, false);
});
