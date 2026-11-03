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

/* ── 對照測試：搜尋改成長字串 indexOf 之前的逐列實作（2026-11-03 HEAD 9962a49 原樣抄錄）──
   新實作的命中集合、排序、total 都必須與它逐筆相同；改搜尋時這裡是唯一的語意基準，不要跟著改。 */
const refNormalize = (text) => text.normalize('NFKC').toLowerCase();
const REF_UTI_NAME = /\buti\b|\burinary tract infection\b|泌尿道感染|尿路感染/;
const REF_UTI_ALIASES = 'uti urinary tract infection 泌尿道感染 尿路感染';
function refBuildIndex(rowsIn, curatedCodes) {
  const nodot = [], lowerEn = [], lowerZh = [], aliases = [];
  for (let i = 0; i < rowsIn.length; i++) {
    nodot[i] = rowsIn[i][0].replace('.', '');
    lowerEn[i] = refNormalize(rowsIn[i][2]);
    lowerZh[i] = refNormalize(rowsIn[i][3]);
    const aliasSource = lowerEn[i] + ' ' + lowerZh[i].replace(/生殖泌尿道感染/g, '');
    aliases[i] = REF_UTI_NAME.test(aliasSource) ? REF_UTI_ALIASES : '';
  }
  return { db: rowsIn, nodot, lowerEn, lowerZh, aliases, curatedCodes: curatedCodes || new Set() };
}
function refSearch(idx, query, limit) {
  limit = limit || 50;
  const q = (query || '').trim();
  if (q.length < 2) { const r = []; r.total = 0; return r; }
  const out = [], seen = new Set(), ranks = new Map();
  const { db: rdb, nodot, lowerEn, lowerZh, aliases, curatedCodes } = idx;
  const ql = refNormalize(q);
  const isCode = /^[a-z][0-9a-z.]*$/i.test(q);
  const qc = isCode ? q.toUpperCase().replace(/\./g, '') : '';
  const terms = ql.split(/\s+/).map(text => ({
    text, code: /^[a-z][0-9a-z.]*$/i.test(text) ? text.toUpperCase().replace(/\./g, '') : '',
  }));
  const matches = (i, term) => {
    if (term.code && nodot[i].startsWith(term.code)) return true;
    if (term.text === 'uti') return aliases[i] !== '';
    if (term.text === '右側') return lowerZh[i].includes('右') || /\bright\b/.test(lowerEn[i]);
    if (term.text === '左側') return lowerZh[i].includes('左') || /\bleft\b/.test(lowerEn[i]);
    return lowerEn[i].includes(term.text) || lowerZh[i].includes(term.text) || aliases[i].includes(term.text);
  };
  const rankOf = (i) => {
    if ((isCode && nodot[i] === qc) || lowerZh[i] === ql || lowerEn[i] === ql) return 0;
    if ((isCode && nodot[i].startsWith(qc)) || lowerZh[i].startsWith(ql) || lowerEn[i].startsWith(ql)) return 1;
    return 2;
  };
  const push = (i) => {
    const row = rdb[i];
    if (seen.has(row[0])) return;
    seen.add(row[0]);
    ranks.set(row[0], rankOf(i));
    out.push(row);
  };
  if (isCode) for (let i = 0; i < rdb.length; i++) if (nodot[i].startsWith(qc)) push(i);
  for (let i = 0; i < rdb.length; i++) if (terms.every(term => matches(i, term))) push(i);
  out.sort((a, b) => ((curatedCodes.has(b[0]) ? 1 : 0) - (curatedCodes.has(a[0]) ? 1 : 0))
    || (ranks.get(a[0]) - ranks.get(b[0])));
  const res = out.slice(0, limit);
  res.total = out.length;
  return res;
}

const EQUIV_QUERIES = [
  // 原型量過的 13 組
  'cellulitis', '蜂窩', 'E11', 'L03', 'ce', 'E1', 'L0', 'fracture femur', '糖尿病 腎', 'e11.9',
  'pneumonia', 'i10', 'j06',
  // 特殊詞與側別
  'uti', 'UTI', 'UTI 未明示', 'UTI 右側', 'urinary tract infection', 'tract urinary', '泌尿道感染', '尿路感染',
  '蜂窩 右側', '蜂窩 左側', '右側', '左側', 'fracture 右側', '骨折 左側 股骨', 'cutis', 'right', 'left lower',
  // 空白、單字元、過短
  '', ' ', 'x', '右', 'Z', '  蜂窩　右  ', '蜂窩\t右', 'e11 e11',
  // 全形、大小寫混合、NFKC 會產生空白的字元
  'ｃｅｌｌｕｌｉｔｉｓ', 'Ｅ１１', 'CeLLuLiTiS', 'Type 2 Diabetes', '第２型糖尿病', '¨x', 'x ¨',
  // 代碼前綴與混合
  'l03.115 蜂窩', 'n39.0', 'N390', 'a00', 'A0', 'z00', 'S72 fracture', 'e.1.1', '..', 'zz', 'Q', 'T22.2',
  '高血壓', 'hypertension', '第2型糖尿病', 'diabetes 高血糖',
];

test('對照：新搜尋與舊逐列實作在全庫上逐筆相同（代碼、順序、total）', () => {
  const curated = new Set(['N39.0', 'L03.115', 'E11.9', 'I10', 'J06.9', 'L03.90', 'S72.001A']);
  const ref = refBuildIndex(db, curated);
  const cur = L.buildIndex(db, curated);
  assert.ok(EQUIV_QUERIES.length >= 30);
  for (const query of EQUIV_QUERIES) {
    for (const limit of [undefined, 24, db.length]) {
      const want = refSearch(ref, query, limit);
      const got = L.search(cur, query, limit);
      assert.equal(got.total, want.total, `total：${JSON.stringify(query)} limit=${limit}`);
      assert.deepEqual(codes(got), codes(want), `順序：${JSON.stringify(query)} limit=${limit}`);
    }
  }
});

test('對照：精選池（中文名、英文空白）的小索引也逐筆相同', () => {
  const pool = Object.keys(Object.fromEntries(rows.map(r => [r[0], 1]))).sort()
    .map(code => [code, 1, '', rows.find(r => r[0] === code)[3]]);
  const curated = new Set(['L03.115', 'N39.0']);
  for (const query of EQUIV_QUERIES) {
    const want = refSearch(refBuildIndex(pool, curated), query);
    const got = L.search(L.buildIndex(pool, curated), query);
    assert.equal(got.total, want.total, JSON.stringify(query));
    assert.deepEqual(codes(got), codes(want), JSON.stringify(query));
  }
});
