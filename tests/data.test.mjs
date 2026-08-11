import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const L = require('../src/logic.js');
const D = require('../src/data.js');
const S = require('../src/state.js');

// ---- 測試資料（形狀與正式資料一致，內容精簡）----
const CURATED = {
  chronic: [['I10', '高血壓'], ['E11.9', '第二型糖尿病']],
  infectious: [['J18.9', '肺炎']],
  pathogens: [['B95.62', 'MRSA']],
  surgicalQuick: [['Z48.01', '手術傷口換藥']],
  emergencyQuick: [['A41.9', '敗血症']],
  surgicalPanels: [
    { name: '撕裂傷', codes: [['S01.01XA', '頭皮撕裂傷']] },
    { name: '燙傷', codes: [['T22.20XA', '肩臂二度燙傷'], ['T31.0', '燒傷體表面積']] },
  ],
  internalOutpatient: [
    {
      name: '全身／感染',
      panels: [{
        name: '發燒／寒顫',
        chief: [['R50.9', '發燒']],
        diseases: [['J18.9', '肺炎']],
        related: { 'R50.9': ['J18.9'] },
      }],
    },
    { name: '心臟血管', panels: [{ name: '胸痛', chief: [['R07.9', '胸痛']], diseases: [] }] },
  ],
  internalEmergency: [
    {
      name: '全身／感染',
      panels: [{
        name: '發燒／寒顫',
        chief: [['R50.9', '發燒']],
        diseases: [['J18.9', '肺炎']],
        redFlags: [['A41.9', '敗血症']],
        related: { 'R50.9': ['A41.9'] },
      }],
    },
  ],
  related: { 'I10': ['E78.5'] },
};

const LABELS = {
  'I10': '本態性高血壓', 'E11.9': '第2型糖尿病伴無併發症', 'J18.9': '肺炎（未明示病原體）',
  'B95.62': 'MRSA 為他處疾病之病因', 'Z48.01': '手術傷口換藥照護', 'A41.9': '敗血症（未明示）',
  'S01.01XA': '頭皮撕裂傷（初診）', 'T22.20XA': '肩臂二度燙傷（初診）', 'T31.0': '燒傷體表面積 10% 以下',
  'R50.9': '發燒（未明示）', 'R07.9': '胸痛（未明示）', 'E78.5': '高脂血症',
};

// A00 是類目碼（row[1] === 0），全庫就緒後必須被擋下
const DB = [
  ['A00', 0, 'Cholera', '霍亂'],
  ['A00.0', 1, 'Cholera due to Vibrio cholerae 01', '古典型霍亂'],
  ['I10', 1, 'Essential (primary) hypertension', '本態性高血壓'],
  ['J18.9', 1, 'Pneumonia, unspecified organism', '肺炎（未明示病原體）'],
  ['E78.5', 1, 'Hyperlipidemia, unspecified', '高脂血症'],
  ['E11', 0, 'Type 2 diabetes mellitus', '第2型糖尿病'],
];
for (let i = 0; i < 14; i++) DB.push(['E11.' + i, 1, 'Type 2 diabetes variant ' + i, '第2型糖尿病變異' + i]);

function makeData(extra) {
  return D.createData(Object.assign({
    curated: CURATED, labels: LABELS, logic: L, loadDb: () => Promise.resolve(DB),
  }, extra));
}

// 記錄 dbState 轉移序列，並統計 loadDb 實際被呼叫幾次
function makeTracked(loader) {
  const states = [];
  let calls = 0;
  const data = D.createData({
    curated: CURATED,
    labels: LABELS,
    logic: L,
    loadDb: () => { calls += 1; return Promise.resolve().then(() => loader()); },
    onDbState: (s) => states.push(s),
  });
  return { data, states, calls: () => calls };
}

// ---- 延遲載入狀態機 ----
test('ensureDb：初始 idle，併發呼叫只載入一次，狀態走 idle→loading→ready', async () => {
  const t = makeTracked(() => DB);
  assert.equal(t.data.getDbState(), 'idle');
  assert.equal(t.data.isReady(), false);
  const results = await Promise.all([t.data.ensureDb(), t.data.ensureDb(), t.data.ensureDb()]);
  assert.equal(t.calls(), 1, '併發呼叫不得重複載入全庫');
  assert.deepEqual(t.states, ['loading', 'ready']);
  assert.equal(t.data.getDbState(), 'ready');
  assert.equal(t.data.isReady(), true);
  assert.equal(t.data.rowCount(), DB.length);
  assert.ok(results[0] === results[1] && results[1] === results[2], '三次應拿到同一個索引');

  await t.data.ensureDb();
  assert.equal(t.calls(), 1, '就緒後再呼叫也不得重新載入');
});

test('ensureDb：載入失敗轉 error、不丟例外、不自動重試；retryDb 才會重載', async () => {
  let ok = false;
  const t = makeTracked(() => { if (!ok) throw new Error('DecompressionStream 爆炸'); return DB; });
  const index = await t.data.ensureDb();
  assert.equal(index, null, '失敗要回傳 null，不能 reject（預抓是 fire-and-forget）');
  assert.equal(t.data.getDbState(), 'error');
  assert.match(String(t.data.getError()), /爆炸/);
  await t.data.ensureDb();
  assert.equal(t.calls(), 1, '失敗後每敲一次鍵就重下載 13MB 是不能接受的');
  ok = true;
  assert.ok(await t.data.retryDb());
  assert.equal(t.calls(), 2);
  assert.equal(t.data.getDbState(), 'ready');
  assert.deepEqual(t.states, ['loading', 'error', 'idle', 'loading', 'ready']);
});

test('ensureDb：沒有 loadDb 時直接轉 error 而不是丟例外', async () => {
  const data = D.createData({ curated: CURATED, labels: LABELS, logic: L });
  assert.equal(await data.ensureDb(), null);
  assert.equal(data.getDbState(), 'error');
});

test('競態 token：舊 token 不再是最新的', () => {
  const data = makeData();
  const first = data.nextToken();
  assert.equal(data.isCurrentToken(first), true);
  const second = data.nextToken();
  assert.equal(data.isCurrentToken(first), false);
  assert.equal(data.isCurrentToken(second), true);
});

// ---- 葉碼防線（impl-plan R-4）----
test('index 未就緒時，類目碼仍然被擋下', () => {
  const data = makeData();
  assert.equal(data.isReady(), false);
  assert.equal(data.isAddable('A00'), false, '不在精選白名單的碼（含類目碼）一律不可加入');
  assert.equal(data.isAddable('A00', ['A00', 0, 'Cholera', '霍亂']), false, '搜尋結果自帶 row[1]=0 → 擋下');
  assert.equal(data.isAddable('A00.0', ['A00.0', 1, 'x', 'y']), true, '搜尋結果自帶 row[1]=1 → 放行');
  assert.equal(data.isAddable('I10'), true, '精選白名單（建置期已驗過都是葉碼）');
  assert.equal(data.isAddable(''), false);
  assert.equal(data.isAddable(null), false);
  assert.equal(data.isAddable('沒看過的碼'), false);
});

test('index 就緒後由全庫複查，權威高於白名單', async () => {
  // 白名單被汙染（正式建置期不可能發生，這裡驗證第三重規則真的會複查）
  const data = D.createData({
    curated: CURATED, labels: Object.assign({ 'A00': '霍亂' }, LABELS), logic: L, loadDb: () => Promise.resolve(DB),
  });
  assert.equal(data.isAddable('A00'), true, '未就緒時只能相信白名單');
  await data.ensureDb();
  assert.equal(data.isAddable('A00'), false, '就緒後必須以全庫的 row[1] 為準');
  assert.equal(data.isAddable('A00', ['A00', 1, 'x', 'y']), false, '就緒後不得被偽造的 row 繞過');
  assert.equal(data.isAddable('A00.0'), true);
  assert.equal(data.isAddable('ZZZ.99'), false, '全庫沒有的碼也要擋');
});

test('整合：store 接上 isAddable 後，全庫未就緒時類目碼加不進清單', () => {
  const data = makeData();
  const store = S.createStore({
    storage: null, theme: 'light',
    canAdd: (code, row) => data.isAddable(code, row),
  });
  assert.equal(data.isReady(), false);
  assert.equal(store.addCode('A00', '霍亂'), 'rejected');
  assert.equal(store.addCode('A00', '霍亂', ['A00', 0, 'Cholera', '霍亂']), 'rejected');
  assert.deepEqual(store.getState().cart, []);
  assert.equal(store.addCode('I10', data.labelOf('I10')), 'added');
  assert.deepEqual(store.getState().cart, [{ code: 'I10', zh: '本態性高血壓' }]);
});

// ---- 標籤 ----
test('labelOf：先查精選對照表，全庫就緒後才有後備', async () => {
  const data = makeData();
  assert.equal(data.labelOf('I10'), '本態性高血壓');
  assert.equal(data.labelOf('A00.0'), '', '未就緒且不在白名單 → 空字串（渲染層自行處理）');
  await data.ensureDb();
  assert.equal(data.labelOf('A00.0'), '古典型霍亂');
  assert.equal(data.labelOf('I10'), '本態性高血壓', '白名單優先於全庫');
  assert.equal(data.rowFor('I10')[2], 'Essential (primary) hypertension');
});

// ---- 精選內容存取 ----
test('regionsFor／panelsFor：三種模式各自的部位與面板', () => {
  const data = makeData();
  assert.deepEqual(data.regionsFor('outpatient'), [{ name: '全身／感染', count: 1 }, { name: '心臟血管', count: 1 }]);
  assert.deepEqual(data.regionsFor('emergency'), [{ name: '全身／感染', count: 1 }]);
  assert.deepEqual(data.regionsFor('surg'), [{ name: '撕裂傷', count: 1 }, { name: '燙傷', count: 2 }]);

  const surg = data.panelsFor('surg', 1);
  assert.equal(surg.length, 1);
  assert.equal(surg[0].name, '燙傷');
  assert.deepEqual(surg[0].chief.map((p) => p[0]), ['T22.20XA', 'T31.0']);

  assert.equal(data.panelsFor('outpatient', 1)[0].name, '胸痛');
  assert.equal(data.panelsFor('outpatient', 99)[0].name, '發燒／寒顫', '部位超界回到第一個');
  assert.equal(data.clampRegion('emergency', 5), 0);
});

test('紅旗只在急診模式出現，門診拿不到（臨床安全）', () => {
  const data = makeData();
  assert.deepEqual(data.panelsFor('emergency', 0)[0].redFlags.map((p) => p[0]), ['A41.9']);
  assert.deepEqual(data.panelsFor('outpatient', 0)[0].redFlags, []);
  // 就算門診資料被塞進 redFlags，也不得渲染出來
  const poisoned = JSON.parse(JSON.stringify(CURATED));
  poisoned.internalOutpatient[0].panels[0].redFlags = [['A41.9', '敗血症']];
  const data2 = D.createData({ curated: poisoned, labels: LABELS, logic: L });
  assert.deepEqual(data2.panelsFor('outpatient', 0)[0].redFlags, []);
});

test('quickGroupsFor：三種模式的快選分組', () => {
  const data = makeData();
  assert.deepEqual(data.quickGroupsFor('outpatient').map((g) => g[0]), ['常用慢性病', '感染科常用', '病原體附加碼／抗藥性']);
  assert.deepEqual(data.quickGroupsFor('emergency').map((g) => g[0]), ['急診常見評估', '感染科常用', '病原體附加碼／抗藥性']);
  assert.deepEqual(data.quickGroupsFor('surg').map((g) => g[0]), ['外科常用', '病原體附加碼／抗藥性']);
  assert.deepEqual(data.quickGroupsFor('outpatient')[0][1], CURATED.chronic);
});

// ---- 相關碼 ----
test('relatedFor：人工關聯＋當前模式症狀表，兩個模式不得互相洩漏', () => {
  const data = makeData();
  assert.deepEqual(data.relatedFor('R50.9', 'outpatient'), ['J18.9']);
  assert.deepEqual(data.relatedFor('R50.9', 'emergency'), ['A41.9'], '急診才看得到紅旗關聯');
  assert.deepEqual(data.relatedFor('R50.9', 'surg'), [], '外科只吃全域 related.json');
  assert.deepEqual(data.relatedFor('I10', 'outpatient'), ['E78.5']);
  assert.deepEqual(data.relatedFor(null, 'outpatient'), []);
});

test('familyFor：上限 12，未就緒時退回精選池', async () => {
  const data = makeData();
  assert.deepEqual(data.familyFor('E11.9'), [], '精選池裡沒有其他 E11 開頭的碼');
  await data.ensureDb();
  const fam = data.familyFor('E11.9');
  assert.equal(fam.length, D.FAMILY_LIMIT);
  assert.equal(D.FAMILY_LIMIT, 12);
  assert.ok(fam.every((r) => r[1] === 1 && r[0] !== 'E11.9' && r[0].slice(0, 3) === 'E11'));
  assert.equal(data.familyFor('E11.9', 3).length, 3);
});

// ---- 搜尋 ----
test('search：全庫未就緒走精選池（全是葉碼），就緒後改走全庫', async () => {
  const data = makeData();
  const before = data.search('肺炎');
  assert.equal(before.pool, 'curated');
  assert.deepEqual(before.map((r) => r[0]), ['J18.9']);
  assert.ok(before.every((r) => r[1] === 1), '精選池不可能出現類目碼');
  assert.equal(data.search('霍亂').length, 0, '未就緒時查不到非精選碼');

  await data.ensureDb();
  const after = data.search('霍亂');
  assert.equal(after.pool, 'full');
  assert.deepEqual(after.map((r) => r[0]), ['A00', 'A00.0']);
  assert.equal(after.total, 2);
});

test('search：上限預設 24，且沿用 logic.search（不自己重寫）', async () => {
  const data = makeData();
  await data.ensureDb();
  const rows = data.search('第2型糖尿病');
  assert.equal(D.SEARCH_LIMIT, 24);
  assert.deepEqual(rows.map((r) => r[0]), L.search(data.getIndex(), '第2型糖尿病', 24).map((r) => r[0]));
  assert.equal(rows.total, L.search(data.getIndex(), '第2型糖尿病', 24).total);
});

// ---- 搬家過來的純函式 ----
test('collectCuratedCodes 涵蓋面板、快選與關聯表兩側', () => {
  const set = D.collectCuratedCodes(CURATED);
  for (const code of ['I10', 'E11.9', 'J18.9', 'B95.62', 'Z48.01', 'A41.9', 'S01.01XA', 'T31.0', 'R50.9', 'R07.9', 'E78.5']) {
    assert.ok(set.has(code), `精選碼集合缺少 ${code}`);
  }
  assert.deepEqual(D.collectCuratedCodes(undefined).size, 0);
});

test('flattenSymptomRelated 只攤平單一模式並去重', () => {
  const out = D.flattenSymptomRelated(CURATED.internalEmergency, L);
  assert.deepEqual(out, { 'R50.9': ['A41.9'] });
  assert.deepEqual(D.flattenSymptomRelated(undefined, L), {});
});

test('附加碼判定：B95–B97 與 Z16 是附加碼，其餘不是', () => {
  // 臨床審查：這些碼只能附加在主要疾病之後，不可作為主診斷；UI 靠這個判定做標記。
  for (const code of ['B95.0', 'B95.61', 'B96.20', 'B97.89', 'Z16', 'Z16.11', 'Z16.24']) {
    assert.equal(D.isAdjunct(code), true, code);
  }
  for (const code of ['A41.9', 'B94.8', 'B98.0', 'L03.115', 'Z17.0', 'E11.9', '', null, undefined]) {
    assert.equal(D.isAdjunct(code), false, String(code));
  }
});

test('addability：三態，unknown 一樣不可加（防線強度不變）', () => {
  // R2 I3：全庫未就緒且不在白名單時，是「無從判斷」不是「類目碼或不存在」——
  // 兩者都不可加，但呼叫端要能分辨才給得出誠實的訊息。
  const data = makeData();                       // 未載入全庫
  assert.equal(data.addability('I10'), 'yes');   // 精選白名單內
  assert.equal(data.addability('A00.0'), 'unknown');
  assert.equal(data.isAddable('A00.0'), false, 'unknown 絕不可加');
  assert.equal(data.addability('A00.0', ['A00.0', 1, '', '霍亂']), 'yes');
  assert.equal(data.addability('L03', ['L03', 0, '', '蜂窩組織炎']), 'no');
  assert.equal(data.addability(''), 'no');
});
