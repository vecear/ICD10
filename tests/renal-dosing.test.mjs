import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const require = createRequire(import.meta.url);
const L = require('../src/logic.js');
// 在測試內載入，缺少新模組時仍可執行其他回歸測試。
const renal = () => require('../src/renal-dosing.js');

test('Acyclovir：五方案的體表面積校正 CrCl 表不得套用未校正 CCr', () => {
  const data = JSON.parse(readFileSync(new URL('../src/curated/antibiotic_dosing.json', import.meta.url), 'utf8'));
  const drug = data.drugs.find(d => d.id === 'acyclovir');
  assert.ok(drug);
  assert.equal(drug.regimens.length, 5);
  for (const plan of drug.regimens) {
    for (const [crcl, index] of [[0, 3], [9.99, 3], [10, 2], [24.99, 2], [25, 1], [50, 1], [50.01, 0]]) {
      expectResult(renal().recommend(plan, {crcl, renalState:'stable'}), 'needs-input');
      expectResult(renal().recommend(plan, {crcl, bsa:1.73, renalState:'stable'}),
        plan.renal[index].manual ? 'manual' : 'matched', index);
    }
    expectResult(renal().recommend(plan, {crcl:20, renalState:'ihd'}), 'dialysis');
  }
});

test('Ceftazidime UpToDate：兩種原劑量遵守截圖邊界，不沿用舊區間', () => {
  const data = JSON.parse(readFileSync(new URL('../src/curated/antibiotic_dosing.json', import.meta.url), 'utf8'));
  const plans = data.drugs.find(d => d.id === 'ceftazidime').regimens;
  assert.equal(plans.length, 2);
  for (const plan of plans) {
    for (const [crcl, index] of [[0, 3], [15, 3], [16, 2], [30, 2], [31, 1], [50, 1], [50.1, 0]]) {
      expectResult(renal().recommend(plan, {crcl, renalState: 'stable'}), 'matched', index);
    }
    for (const crcl of [15.5, 30.5]) {
      expectResult(renal().recommend(plan, {crcl, renalState: 'stable'}), 'gap');
    }
    expectResult(renal().recommend(plan, {crcl: 20, renalState: 'aki'}), 'unstable');
    expectResult(renal().recommend(plan, {crcl: 20, renalState: 'ihd'}), 'dialysis');
  }
});

test('CCr 計算的浮點尾差不跨越端點，真正的小數差仍保留', () => {
  const data = JSON.parse(readFileSync(new URL('../src/curated/antibiotic_dosing.json', import.meta.url), 'utf8'));
  const plan = data.drugs.find(d => d.id === 'ceftazidime').regimens[0];
  const crcl = (140 - 68) * 72 / (72 * 4.8);
  assert.ok(crcl > 15); // JS binary float: 15.000000000000002
  expectResult(renal().recommend(plan, {crcl, renalState:'stable'}), 'matched', 3);
  expectResult(renal().recommend(plan, {crcl:15 + 1e-10, renalState:'stable'}), 'gap');
  for (const boundary of [15, 20, 50]) {
    const testPlan = regimen({renal:[row(null, boundary), row(boundary, null)]});
    expectResult(recommend(testPlan, {crcl:boundary - Number.EPSILON * boundary}), 'matched', 1);
    expectResult(recommend(testPlan, {crcl:boundary - 1e-10}), 'matched', 0);
    expectResult(recommend(testPlan, {crcl:boundary + 1e-10}), 'matched', 1);
  }
});

test('Amikacin 延長間隔：保留原始邊界與 TDM，不能成為自動處方', () => {
  const data = JSON.parse(readFileSync(new URL('../src/curated/antibiotic_dosing.json', import.meta.url), 'utf8'));
  const plan = data.drugs.find(d => d.id === 'amikacin').regimens.find(r => r.id === 'extended-interval');
  assert.ok(plan);
  for (const [crcl, index] of [[19.9, 3], [20, 2], [39, 2], [40, 1], [59, 1], [60, 0], [120, 0]]) {
    expectResult(renal().recommend(plan, {crcl, renalState: 'stable'}), 'manual', index);
  }
  for (const crcl of [39.5, 59.5]) {
    expectResult(renal().recommend(plan, {crcl, renalState: 'stable'}), 'gap');
  }
});

// 純邏輯合成資料；名稱、分類、區間與文字均非臨床處方。
const DATA = { version: 1, drugs: [
  { id: 'a', name: 'TestAlpha', aliases: ['Alias One', '測試甲'], className: 'Synthetic Class', regimens: [] },
  { id: 'b', name: 'TestBeta', aliases: ['Alias Two'], className: 'Synthetic Class', regimens: [] },
  { id: 'c', name: 'TestGamma', aliases: [], className: 'Other Class', regimens: [], notes: ['hidden'] },
] };

function row(min, max, extra = {}) {
  return { label: '合成區間', min, max, minInclusive: true, maxInclusive: false, dose: '測試文字', ...extra };
}

function regimen(extra = {}) {
  return {
    id: 'test', label: '合成方案', route: 'test', notes: [], requiresTdm: false,
    renal: [row(null, 20), row(20, 50), row(50, null)],
    dialysis: { ihd: [], capd: [], crrt: [], sled: [] }, ...extra,
  };
}

function recommend(plan = regimen(), input = {}) {
  return renal().recommend(plan, { age: 60, crcl: 30, renalState: 'stable', ...input });
}

function expectResult(result, status, rowIndex = null) {
  assert.deepEqual(Object.keys(result).sort(), ['message', 'rowIndex', 'status']);
  assert.equal(result.status, status);
  assert.equal(result.rowIndex, rowIndex);
  assert.equal(typeof result.message, 'string');
  assert.ok(result.message.trim());
}

test('ICDRenal：依契約輸出 CommonJS API', () => {
  assert.doesNotThrow(renal);
  assert.deepEqual(Object.keys(renal()).sort(), ['recommend', 'searchDrugs']);
});

test('ICDRenal：UMD 全域匯出可在無 DOM 的 VM 執行', () => {
  const code = readFileSync(new URL('../src/renal-dosing.js', import.meta.url), 'utf8');
  for (const context of [{ self: {} }, {}]) {
    runInNewContext(code, context);
    const R = (context.self || context).ICDRenal;
    assert.deepEqual(Object.keys(R).sort(), ['recommend', 'searchDrugs']);
    expectResult(R.recommend(regimen(), { age: 18, crcl: 0, renalState: 'stable' }), 'matched', 0);
    assert.equal(R.searchDrugs(DATA, 'testalpha')[0], DATA.drugs[0]);
  }
});

test('searchDrugs：學名、別名、分類皆可查，保留資料順序與物件', () => {
  const R = renal();
  for (const query of ['TestAlpha', 'Alias One', '測試甲', 'alpha']) {
    assert.deepEqual(R.searchDrugs(DATA, query), [DATA.drugs[0]]);
    assert.equal(R.searchDrugs(DATA, query)[0], DATA.drugs[0]);
  }
  assert.deepEqual(R.searchDrugs(DATA, 'Synthetic Class'), DATA.drugs.slice(0, 2));
  assert.deepEqual(R.searchDrugs(DATA, 'hidden'), []);
  assert.deepEqual(R.searchDrugs(DATA, '不存在'), []);
});

test('searchDrugs：大小寫、多詞 AND、跨欄位與模糊空白', () => {
  for (const query of ['  ALIAS\tONE  ', '\n alpha\u3000CLASS\u00a0', 'one test', '  tEsT\n alPHa ']) {
    assert.deepEqual(renal().searchDrugs(DATA, query), [DATA.drugs[0]], query);
  }
  assert.deepEqual(renal().searchDrugs(DATA, 'alpha two'), []);
});

test('searchDrugs：空查詢列出所有藥物，缺少資料回空陣列', () => {
  for (const query of ['', ' \t\n\u3000', null, undefined]) {
    assert.deepEqual(renal().searchDrugs(DATA, query), DATA.drugs);
  }
  for (const data of [undefined, null, {}, { drugs: [] }]) {
    assert.deepEqual(renal().searchDrugs(data, 'alpha'), []);
  }
});

test('recommend：缺少輸入或方案時 needs-input', () => {
  expectResult(renal().recommend(), 'needs-input');
  expectResult(renal().recommend(regimen(), null), 'needs-input');
  expectResult(recommend(null), 'needs-input');
});

test('recommend：空白與未知 renalState 均不得匹配', () => {
  for (const renalState of ['', ' \t\n\u3000', null, undefined, 'unknown', 'STABLE', 'hd', 0, {}, []]) {
    expectResult(recommend(regimen(), { renalState }), 'needs-input');
  }
});

test('recommend：成人專用查詢不以年齡作為門檻', () => {
  for (const age of ['', ' \t\u3000', null, undefined, NaN, Infinity, -Infinity, 'Infinity', 'abc', -1, 120.01, true, false, [], [60], {}]) {
    expectResult(recommend(regimen(), { age }), 'matched', 1);
  }
});

test('recommend：成人年齡含 18 與 120，可接受有效數字字串', () => {
  for (const age of [18, 120, ' 18 ', '120']) {
    expectResult(recommend(regimen(), { age, crcl: ' 30 ' }), 'matched', 1);
  }
});

test('recommend：沒有年齡與 CCr 仍可查透析條件', () => {
  for (const renalState of ['ihd', 'capd', 'crrt', 'sled']) {
    expectResult(renal().recommend(regimen(), { renalState }), 'dialysis');
  }
});

test('recommend：CCr 空白不轉為零，拒絕負數、非有限與非數字輸入', () => {
  for (const crcl of ['', ' \t\n\u3000', null, undefined, NaN, Infinity, -Infinity, 'Infinity', 'abc', -0.001, '-1', true, false, [], [30], {}]) {
    expectResult(recommend(regimen(), { crcl }), 'needs-input');
  }
  for (const crcl of [0, '0']) expectResult(recommend(regimen(), { crcl }), 'matched', 0);
});

test('recommend：AKI 不使用 CCr 匹配，沒有 CCr 也回 unstable', () => {
  for (const crcl of ['', undefined, NaN, -1, 0, 30, Infinity]) {
    expectResult(recommend(regimen({ requiresTdm: true }), { renalState: 'aki', crcl }), 'unstable');
  }
});

test('recommend：各透析情境不使用 CCr，也不自動選條件列', () => {
  for (const renalState of ['ihd', 'capd', 'crrt', 'sled']) {
    const plan = regimen({ requiresTdm: true, dialysis: {
      [renalState]: [{ label: '測試條件甲', dose: '測試甲' }, { label: '測試條件乙', dose: '測試乙', manual: true }],
    } });
    for (const crcl of ['', undefined, NaN, -1, 0, 30, Infinity]) {
      const result = recommend(plan, { renalState, crcl });
      expectResult(result, 'dialysis');
      assert.match(result.message.toLowerCase(), new RegExp(renalState));
      assert.match(result.message, /僅供來源方案對照/);
      assert.match(result.message, /不提供單一推薦/);
    }
  }
});

test('recommend：精確遵守開閉端點與 null 無界，不先四捨五入', () => {
  for (const [crcl, index] of [[0, 0], [19.999999, 0], [20, 1], [49.999999, 1], [50, 2], [50.000001, 2], [Number.MAX_VALUE, 2]]) {
    expectResult(recommend(regimen(), { crcl }), 'matched', index);
  }
  const plan = regimen({ renal: [row(null, 20, { maxInclusive: true }), row(20, null, { minInclusive: false })] });
  for (const [crcl, index] of [[19.999999, 0], [20, 0], [20.000001, 1]]) {
    expectResult(recommend(plan, { crcl }), 'matched', index);
  }
});

test('recommend：CCr 計算結果以 crclRaw 跨模組查詢，顯示值不會取代 raw', () => {
  for (const weightKg of [44.999, 45.001]) {
    const r = L.creatinineClearance({ age: 60, weightKg, creatinine: 1 });
    assert.equal(r.crcl, 50);
    expectResult(recommend(regimen(), { crcl: r.crclRaw }), 'matched', weightKg < 45 ? 1 : 2);
  }
});

test('recommend：整數來源區間的缺口不補齊', () => {
  const plan = regimen({ renal: [row(20, 49, { maxInclusive: true }), row(50, null, { minInclusive: false })] });
  expectResult(recommend(plan, { crcl: 49 }), 'matched', 0);
  expectResult(recommend(plan, { crcl: 50.000001 }), 'matched', 1);
  for (const crcl of [0, 19.999, 49.000001, 49.9, 50]) {
    const result = recommend(plan, { crcl });
    expectResult(result, 'gap');
    assert.match(result.message, /來源/);
  }
});

test('recommend：重疊端點、重複列與無界重疊皆 fail closed', () => {
  for (const rows of [
    [row(null, 50, { maxInclusive: true }), row(50, null)],
    [row(20, 60), row(20, 60)],
    [row(null, null), row(20, 60)],
  ]) {
    for (const requiresTdm of [false, true]) {
      const result = recommend(regimen({ renal: rows, requiresTdm }), { crcl: 50 });
      expectResult(result, 'gap');
      assert.match(result.message, /重疊/);
    }
  }
});

test('recommend：空表及無效區間資料 fail closed，不把空邊界強制轉成零', () => {
  for (const renalRows of [[], null, undefined, {}, [null]]) {
    expectResult(recommend(regimen({ renal: renalRows })), 'gap');
  }
  for (const key of ['min', 'max']) {
    for (const value of ['', ' \t', undefined, NaN, Infinity, -Infinity, '0', false, [], {}]) {
      expectResult(recommend(regimen({ renal: [row(null, null, { [key]: value })] }), { crcl: 0 }), 'gap');
    }
  }
  expectResult(recommend(regimen({ renal: [row(50, 20), row(null, null)] })), 'gap');
  for (const key of ['minInclusive', 'maxInclusive']) {
    for (const value of [undefined, '', 'false', null, 0]) {
      expectResult(recommend(regimen({ renal: [row(20, 50, { [key]: value })] })), 'gap');
    }
  }
});

test('recommend：TDM 與 manual 列回 manual，唯一命中可帶 rowIndex', () => {
  const tdm = recommend(regimen({ requiresTdm: true }));
  expectResult(tdm, 'manual', 1);
  assert.match(tdm.message, /TDM/);
  assert.match(tdm.message, /監測/);
  expectResult(recommend(regimen({ renal: [row(null, null, { manual: true })] })), 'manual', 0);
  expectResult(recommend(regimen({ renal: [row(null, 20, { manual: true }), row(20, null)] })), 'matched', 1);
});

test('recommend：全列 manual 不等同 TDM，以通用訊息提示來源條件', () => {
  const plan = regimen({ renal: [row(null, 20, { manual: true }), row(20, null, { manual: true })] });
  for (const [crcl, index] of [[0, 0], [30, 1]]) {
    const result = recommend(plan, { crcl });
    expectResult(result, 'manual', index);
    assert.equal(result.message, '此方案需依來源條件個別核對');
    assert.doesNotMatch(result.message, /TDM|監測/);
  }
});

test('recommend：TDM 仍驗證輸入，沒有唯一符合列時不附索引', () => {
  const plan = regimen({ requiresTdm: true, renal: [row(20, 49, { maxInclusive: true })] });
  expectResult(recommend(plan, { crcl: '' }), 'needs-input');
  expectResult(recommend(plan, { crcl: 50 }), 'gap');
});

test('ICDRenal：搜尋與判定均不修改輸入資料', () => {
  const plan = regimen({
    renal: [row(null, null, { loading: '合成起始文字', note: '合成註記' })],
    dialysis: Object.fromEntries(['ihd', 'capd', 'crrt', 'sled'].map(state => [state, [
      { label: '合成條件甲', dose: '測試甲', loading: '起始甲', note: '註記甲' },
      { label: '合成條件乙', dose: '測試乙', loading: '起始乙', note: '註記乙' },
    ]])),
  });
  const input = { age: 60, crcl: 30, renalState: 'stable' };
  const before = structuredClone({ data: DATA, plan, input });
  renal().searchDrugs(DATA, 'alpha');
  renal().searchDrugs(DATA, '').pop();
  renal().recommend(plan, input);
  for (const renalState of ['ihd', 'capd', 'crrt', 'sled']) {
    expectResult(renal().recommend(plan, { ...input, renalState }), 'dialysis');
  }
  assert.deepEqual({ data: DATA, plan, input }, before);
});
