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
  const r = L.search(idx, 'e');
  assert.equal(r.length, 0);
  assert.equal(r.total, 0);
});
test('search: total 回報截斷前的命中總數', () => {
  const all = L.search(idx, '第2型糖尿病');
  assert.equal(all.total, 3);
  const capped = L.search(idx, '第2型糖尿病', 1);
  assert.equal(capped.length, 1);
  assert.equal(capped.total, 3, '截斷後仍要回報總數，UI 才能提示「共 N 筆」');
});
test('search: 完全相符 > 名稱開頭相符 > 其他', () => {
  const db3 = [
    ['A00.1', 1, 'Other pain of throat', '其他咽喉痛'],
    ['A00.2', 1, 'Sore throat with fever', '咽喉痛併發燒'],
    ['A00.3', 1, 'Sore throat', '咽喉痛'],
  ];
  const codes = L.search(L.buildIndex(db3), '咽喉痛').map(r => r[0]);
  assert.deepEqual(codes, ['A00.3', 'A00.2', 'A00.1']);
});
test('search: 精選碼優先仍高於命中層級', () => {
  const db4 = [
    ['A00.3', 1, 'Sore throat', '咽喉痛'],
    ['A00.1', 1, 'Other pain of throat', '其他咽喉痛'],
  ];
  const idx4 = L.buildIndex(db4, new Set(['A00.1']));
  assert.deepEqual(L.search(idx4, '咽喉痛').map(r => r[0]), ['A00.1', 'A00.3']);
});
test('search: 代碼與名稱混合命中不重複', () => {
  const codes = L.search(idx, 'E11').map(r => r[0]);
  assert.deepEqual(codes, [...new Set(codes)]);
  assert.ok(codes.includes('E11.9') && codes.includes('E11.65'));
});
test('search: 人工精選碼於同字串命中時優先排序', () => {
  const db2 = [
    ['H05.01', 0, 'Cellulitis of orbit', '眼窩蜂窩組織炎'],
    ['L03.90', 1, 'Cellulitis, unspecified', '蜂窩性組織炎'],
  ];
  const idx2 = L.buildIndex(db2, new Set(['L03.90']));
  assert.equal(L.search(idx2, 'cellulitis')[0][0], 'L03.90');
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

test('mergeRelated 合併人工與症狀推薦並去重', () => {
  assert.deepEqual(
    L.mergeRelated(['I20.9', 'K21.9'], ['K21.9', 'R00.0']),
    ['I20.9', 'K21.9', 'R00.0']
  );
  assert.deepEqual(L.mergeRelated(undefined, ['A41.9']), ['A41.9']);
});

test('rocDate：民國年＝西元−1911，月日補零（HIS 欄位是定長格式）', () => {
  assert.equal(L.rocDate(new Date(2026, 7, 13)), '115-08-13');
  assert.equal(L.rocDate(new Date(2026, 0, 5)), '115-01-05');   // 個位數月日一定要補零
  assert.equal(L.rocDate(new Date(2025, 11, 31)), '114-12-31');
  assert.equal(L.rocDate(new Date(1912, 0, 1)), '1-01-01');     // 民國元年
});

test('rocDate：不給參數就用今天，格式一律 民國年-月-日', () => {
  const today = L.rocDate();
  assert.match(today, /^\d{1,3}-\d{2}-\d{2}$/);
  const now = new Date();
  assert.equal(today, L.rocDate(now));
});
