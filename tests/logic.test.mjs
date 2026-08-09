import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const L = require('../src/logic.js');

const DB = [
  ['E11', 0, 'Type 2 diabetes mellitus', '第2型糖尿病'],
  ['E11.9', 1, 'Type 2 diabetes mellitus without complications', '第2型糖尿病伴無併發症'],
  ['E11.65', 1, 'Type 2 diabetes mellitus with hyperglycemia', '第2型糖尿病伴高血糖'],
  ['L03.90', 1, 'Cellulitis, unspecified', '蜂窩性組織炎'],
  ['I10', 1, 'Essential (primary) hypertension', '本態性高血壓'],
];
const idx = L.buildIndex(DB);

test('search: 代碼前綴（忽略小數點與大小寫）優先', () => {
  const r = L.search(idx, 'e119');
  assert.equal(r[0][0], 'E11.9');
});
test('search: 英文子字串', () => {
  assert.equal(L.search(idx, 'cellul')[0][0], 'L03.90');
});
test('search: 中文子字串', () => {
  assert.equal(L.search(idx, '蜂窩')[0][0], 'L03.90');
});
test('search: 過短 query 回空', () => {
  assert.deepEqual(L.search(idx, 'e'), []);
});
test('search: 代碼與名稱混合命中不重複', () => {
  const codes = L.search(idx, 'E11').map(r => r[0]);
  assert.deepEqual(codes, [...new Set(codes)]);
  assert.ok(codes.includes('E11.9') && codes.includes('E11.65'));
});
test('family: 同類目葉碼、排除自身與類目碼', () => {
  const codes = L.family(idx, 'E11.9').map(r => r[0]);
  assert.deepEqual(codes, ['E11.65']);
});
test('formatCart 三種格式', () => {
  const items = [{ code: 'I10', zh: '本態性高血壓' }, { code: 'E11.9', zh: '第2型糖尿病伴無併發症' }];
  assert.equal(L.formatCart(items, 'lines'), 'I10\nE11.9');
  assert.equal(L.formatCart(items, 'comma'), 'I10,E11.9');
  assert.equal(L.formatCart(items, 'names'), 'I10\t本態性高血壓\nE11.9\t第2型糖尿病伴無併發症');
});
