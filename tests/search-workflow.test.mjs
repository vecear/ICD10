import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const L = require('../src/logic.js');
const D = require('../src/data.js');
const db = JSON.parse(readFileSync(new URL('../data/codes.min.json', import.meta.url), 'utf8'));
const wanted = ['N39.0', 'L68.0', 'L94.2', 'L03.111', 'L03.112', 'L03.113',
  'L03.114', 'L03.115', 'L03.116', 'L03.119', 'L03.019', 'L03.90'];
const rows = wanted.map(code => {
  const row = db.find(row => row[0] === code);
  assert.ok(row, `正式資料缺少 ${code}`);
  return row;
});
const index = L.buildIndex(rows, new Set(['L03.115', 'N39.0']));
const codes = result => result.map(row => row[0]);

test('多詞搜尋：空白、Tab、全形空白皆採 AND，保留精選排序與 total', () => {
  const expected = ['L03.115', 'L03.111', 'L03.113'];
  for (const query of ['蜂窩 右', '  右\t蜂窩  ', '蜂窩　右']) {
    assert.deepEqual(codes(L.search(index, query)), expected);
    const limited = L.search(index, query, 1);
    assert.deepEqual(codes(limited), ['L03.115']);
    assert.equal(limited.total, 3);
  }
  assert.equal(L.search(index, '蜂窩 左 右').total, 0);
});

test('英文多詞可不相鄰、可換順序、可跨中文英文與代碼欄位', () => {
  for (const query of ['cellulitis right lower', 'lower cellulitis right',
    'CELLULITIS 下肢 右', 'l03115 蜂窩']) {
    assert.deepEqual(codes(L.search(index, query)), ['L03.115']);
  }
});

test('側別 query 只篩選名稱明示的側別，不把未明示部位當未明示側', () => {
  assert.deepEqual(codes(L.search(index, '蜂窩 右側')), ['L03.115', 'L03.111', 'L03.113']);
  assert.deepEqual(codes(L.search(index, '蜂窩 左側')), ['L03.112', 'L03.114', 'L03.116']);
  assert.deepEqual(codes(L.search(index, '蜂窩 未明示側')), ['L03.019']);
});

test('右側與左側篩選涵蓋正式名稱省略側字的右腳趾、左腳趾', () => {
  const toes = db.filter(row => ['L03.031', 'L03.032', 'L03.039'].includes(row[0]));
  const toeIndex = L.buildIndex(toes);
  assert.deepEqual(codes(L.search(toeIndex, '蜂窩 右側')), ['L03.031']);
  assert.deepEqual(codes(L.search(toeIndex, '蜂窩 左側')), ['L03.032']);
});

test('UTI 與泌尿道感染俗稱互通，且不誤中 hirsutism 或 cutis', () => {
  for (const query of ['UTI', 'uti', '泌尿道感染', '尿路感染', 'UTI 未明示']) {
    assert.deepEqual(codes(L.search(index, query)), ['N39.0']);
  }
  assert.equal(L.search(index, 'UTI 右側').total, 0);
  assert.deepEqual(codes(L.search(index, 'cutis')), ['L94.2']);
});

test('UTI 對照接受獨立縮寫與中英文名稱，不延伸至其他英文字中的片段', () => {
  const variants = L.buildIndex([
    ['A00.1', 1, 'Urinary tract infection', ''],
    ['A00.2', 1, '', '泌尿道感染'],
    ['A00.3', 1, '', '尿路感染'],
    ['A00.4', 1, '(UTI)', ''],
    ['A00.5', 1, 'Hirsutism', ''],
    ['A00.6', 1, 'Calcinosis cutis', ''],
  ]);
  assert.deepEqual(codes(L.search(variants, 'UTI')), ['A00.1', 'A00.2', 'A00.3', 'A00.4']);
});

test('UTI 不把生殖泌尿道感染擴充為一般尿路感染對照', () => {
  const genitalRows = db.filter(row => ['A60.0', 'A60.09', 'O23.9'].includes(row[0]));
  for (const row of genitalRows) {
    for (const source of [row, [row[0], row[1], '', row[3]]]) {
      assert.equal(L.search(L.buildIndex([source]), 'UTI').total, 0, row[0]);
    }
  }
});

test('全庫載入前後共用多詞與對照語意，保留 pool 與 total', async () => {
  const data = D.createData({
    logic: L,
    curated: { infectious: [['N39.0', '泌尿道感染 UTI'], ['L03.115', '右下肢蜂窩組織炎']] },
    labels: Object.fromEntries(rows.map(row => [row[0], row[3]])),
    loadDb: async () => rows,
  });
  for (const pool of ['curated', 'full']) {
    if (pool === 'full') await data.ensureDb();
    for (const query of ['UTI', '泌尿道感染', '尿路感染', 'urinary infection tract']) {
      const result = data.search(query);
      assert.deepEqual(codes(result), ['N39.0']);
      assert.equal(result.total, 1);
      assert.equal(result.pool, pool);
    }
    assert.deepEqual(codes(data.search('蜂窩 右', 1)), ['L03.115']);
    assert.equal(data.search('蜂窩 右', 1).total, 3);
  }
});

test('維持兩字最低限制與忽略小數點的代碼搜尋', () => {
  for (const query of ['', ' ', '右', 'x']) {
    assert.equal(L.search(index, query).total, 0);
  }
  assert.deepEqual(codes(L.search(index, 'n390')), ['N39.0']);
  assert.deepEqual(codes(L.search(index, 'n39.0')), ['N39.0']);
});

test('真實全庫 UTI 搜尋以 N39.0 精選碼優先且每筆都有明確對照', () => {
  const fullIndex = L.buildIndex(db, new Set(['N39.0']));
  const result = L.search(fullIndex, 'UTI', db.length);
  assert.equal(result[0][0], 'N39.0');
  assert.ok(result.total > 0);
  for (const row of result) {
    const text = `${row[2]} ${row[3]}`.normalize('NFKC').toLowerCase();
    assert.ok(/\burinary tract infection\b|\buti\b|泌尿道感染|尿路感染/.test(text), row[0]);
  }
});
