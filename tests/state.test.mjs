import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('../src/state.js');

// ---- 測試替身 ----
function fakeStorage(initial) {
  const map = new Map(Object.entries(initial || {}));
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
}

// 無痕模式／企業政策：連讀都會丟例外
function brokenStorage() {
  return {
    getItem() { throw new Error('SecurityError'); },
    setItem() { throw new Error('SecurityError'); },
    removeItem() { throw new Error('SecurityError'); },
  };
}

// 探測時可寫，之後才壞掉（配額用盡）
function flakyStorage() {
  const map = new Map();
  let writes = 0;
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem(k, v) {
      writes += 1;
      if (writes > 1) throw new Error('QuotaExceededError');
      map.set(k, String(v));
    },
    removeItem: (k) => { map.delete(k); },
  };
}

const newStore = (extra) => S.createStore(Object.assign({ storage: fakeStorage(), theme: 'light' }, extra));

test('預設狀態涵蓋計畫 §State 列出的每個欄位', () => {
  const s = newStore().getState();
  const fields = ['mode', 'region', 'query', 'expanded', 'quickOpen', 'format', 'cart', 'recent', 'favs',
    'relatedCode', 'copied', 'theme', 'layout', 'settingsOpen', 'shelfOpen', 'cartOpen', 'pinned', 'dbState'];
  for (const f of fields) assert.ok(Object.prototype.hasOwnProperty.call(s, f), `缺少狀態欄位 ${f}`);
  assert.deepEqual(s.cart, []);
  assert.equal(s.mode, 'outpatient');
  assert.equal(s.dbState, 'idle');
});

test('持久化往返：favs/theme/layout/format/recent 存得回來，cart 不存', () => {
  const backing = fakeStorage();
  const a = S.createStore({ storage: backing, theme: 'light' });
  a.setFormat('comma');
  a.setTheme('dark');
  a.setLayout('dock');
  a.toggleFav('I10');
  a.addCode('E11.9', '第2型糖尿病');
  assert.deepEqual(a.getState().cart, [{ code: 'E11.9', zh: '第2型糖尿病' }]);

  const b = S.createStore({ storage: backing, theme: 'light' });
  const s = b.getState();
  assert.equal(s.format, 'comma');
  assert.equal(s.theme, 'dark');
  assert.equal(s.layout, 'dock');
  assert.deepEqual(s.favs, ['I10']);
  assert.deepEqual(s.recent, ['E11.9']);
  assert.deepEqual(s.cart, [], 'cart 跨診次殘留＝臨床事故，絕不可持久化');
  assert.equal(backing.getItem('icd10.cart'), null);
});

test('localStorage 不可用時安靜降級成記憶體，功能不受影響', () => {
  let store;
  assert.doesNotThrow(() => { store = S.createStore({ storage: brokenStorage(), theme: 'light' }); });
  assert.equal(store.storage.available, false);
  assert.doesNotThrow(() => {
    store.toggleFav('I10');
    store.setTheme('dark');
    store.addCode('L03.90', '蜂窩性組織炎');
  });
  const s = store.getState();
  assert.deepEqual(s.favs, ['I10']);
  assert.equal(s.theme, 'dark');
  assert.deepEqual(s.cart, [{ code: 'L03.90', zh: '蜂窩性組織炎' }]);
  // 降級後同一個 store 內仍讀得到（記憶體），只是不跨診次
  assert.equal(S.createStore({ storage: brokenStorage(), theme: 'light' }).getState().favs.length, 0);
});

test('儲存中途壞掉（配額用盡）不會丟例外，改走記憶體', () => {
  const store = S.createStore({ storage: flakyStorage(), theme: 'light' });
  assert.doesNotThrow(() => {
    store.toggleFav('I10');
    store.toggleFav('J18.9');
    store.setFormat('names');
  });
  assert.deepEqual(store.getState().favs, ['J18.9', 'I10']);
  assert.equal(store.storage.available, false, '寫入失敗後應永久降級，不再重試');
});

test('壞掉或不合法的持久化值一律丟棄，不得讓 app 起不來', () => {
  const backing = fakeStorage({
    'icd10.theme': '"blue"',
    'icd10.layout': '"mobile"',
    'icd10.format': '"json"',
    'icd10.favs': '{壞掉的 JSON',
    'icd10.recent': JSON.stringify(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A1', 42]),
  });
  const s = S.createStore({ storage: backing, theme: 'light' }).getState();
  assert.equal(s.theme, 'light');
  assert.equal(s.layout, 'wide');
  assert.equal(s.format, 'lines');
  assert.deepEqual(s.favs, []);
  assert.deepEqual(s.recent, ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'], '讀回時也要套上限與去重');
});

test('切模式必須清空 relatedCode（急診紅旗不得洩漏到門診）並把部位歸零', () => {
  const store = newStore();
  store.setRegion(3);
  store.addCode('R50.9', '發燒');
  assert.equal(store.getState().relatedCode, 'R50.9');
  store.setMode('emergency');
  assert.equal(store.getState().relatedCode, null);
  assert.equal(store.getState().region, 0);
  assert.equal(store.getState().mode, 'emergency');
  // 切回門診同樣要清空
  store.addCode('A41.9', '敗血症');
  store.setMode('outpatient');
  assert.equal(store.getState().relatedCode, null);
});

test('加入重複碼不會重複進清單，但要重新指向相關碼', () => {
  const store = newStore();
  assert.equal(store.addCode('I10', '本態性高血壓'), 'added');
  store.addCode('E11.9', '第2型糖尿病');
  assert.equal(store.getState().relatedCode, 'E11.9');
  assert.equal(store.addCode('I10', '本態性高血壓'), 'duplicate');
  assert.deepEqual(store.getState().cart.map((x) => x.code), ['I10', 'E11.9']);
  assert.equal(store.getState().relatedCode, 'I10', '已在清單的碼也要能叫回它的相關碼');
});

test('canAdd 擋下的代碼不會進清單', () => {
  const store = newStore({ canAdd: (code) => code !== 'A00' });
  assert.equal(store.addCode('A00', '霍亂'), 'rejected');
  assert.deepEqual(store.getState().cart, []);
  assert.deepEqual(store.getState().recent, [], '被擋下的碼也不該進最近使用');
  assert.equal(store.addCode('A00.0', '霍亂（葉碼）'), 'added');
});

test('設為主診斷會移到第一位，其餘維持相對順序', () => {
  const store = newStore();
  for (const [c, zh] of [['I10', '高血壓'], ['E11.9', '糖尿病'], ['J18.9', '肺炎']]) store.addCode(c, zh);
  assert.equal(store.setPrimary('J18.9'), true);
  assert.deepEqual(store.getState().cart.map((x) => x.code), ['J18.9', 'I10', 'E11.9']);
  assert.equal(store.setPrimary('J18.9'), false, '已是主診斷就不動');
  assert.equal(store.setPrimary('X99'), false);
});

test('換序：把某列抽出插到另一個位置', () => {
  const store = newStore();
  for (const c of ['A', 'B', 'C', 'D']) store.addCode(c, c);
  assert.equal(store.reorder(3, 0), true);
  assert.deepEqual(store.getState().cart.map((x) => x.code), ['D', 'A', 'B', 'C']);
  assert.equal(store.reorder(0, 2), true);
  assert.deepEqual(store.getState().cart.map((x) => x.code), ['A', 'B', 'D', 'C']);
  for (const bad of [[0, 0], [-1, 1], [1, 9], [0.5, 1]]) {
    assert.equal(store.reorder(bad[0], bad[1]), false, `不合法索引 ${bad} 應該不動`);
  }
  assert.deepEqual(store.getState().cart.map((x) => x.code), ['A', 'B', 'D', 'C']);
});

test('最近使用：上限 8、去重、最新在前', () => {
  const store = newStore();
  for (let i = 1; i <= 10; i++) store.addCode('C' + i, '碼' + i);
  const recent = store.getState().recent;
  assert.equal(recent.length, S.RECENT_LIMIT);
  assert.equal(S.RECENT_LIMIT, 8);
  assert.deepEqual(recent, ['C10', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'C3']);
  store.addCode('C5', '碼5');
  assert.equal(store.getState().recent[0], 'C5');
  assert.equal(store.getState().recent.filter((c) => c === 'C5').length, 1, '不得重複');
  assert.equal(store.getState().recent.length, 8);
});

test('最愛：切換、去重、最新在前、持久化', () => {
  const backing = fakeStorage();
  const store = S.createStore({ storage: backing, theme: 'light' });
  assert.equal(store.toggleFav('I10'), true);
  assert.equal(store.toggleFav('E11.9'), true);
  assert.deepEqual(store.getState().favs, ['E11.9', 'I10']);
  assert.equal(store.isFav('I10'), true);
  assert.equal(store.toggleFav('I10'), false);
  assert.deepEqual(store.getState().favs, ['E11.9']);
  assert.equal(store.isFav('I10'), false);
  assert.deepEqual(JSON.parse(backing.getItem('icd10.favs')), ['E11.9']);
  // 超過上限不再增長
  for (let i = 0; i < S.FAVS_LIMIT + 5; i++) store.toggleFav('F' + i);
  assert.equal(store.getState().favs.length, S.FAVS_LIMIT);
});

test('移除：清單還有碼就保留 relatedCode（讓建議重算），清空才重設', () => {
  const store = newStore();
  store.addCode('R51.9', '頭痛');
  store.addCode('I10', '高血壓');
  store.setRelatedCode('R51.9');
  assert.equal(store.removeCode('I10'), true);
  assert.equal(store.getState().relatedCode, 'R51.9');
  assert.equal(store.removeCode('不存在'), false);
  assert.equal(store.removeCode('R51.9'), true);
  assert.equal(store.getState().relatedCode, null);
});

test('清空清單會一併重設相關碼', () => {
  const store = newStore();
  store.addCode('I10', '高血壓');
  store.clearCart();
  assert.deepEqual(store.getState().cart, []);
  assert.equal(store.getState().relatedCode, null);
});

test('展開／收合是不可變更新，且互不干擾', () => {
  const store = newStore();
  const before = store.getState().expanded;
  assert.equal(store.toggleExpanded('發燒／寒顫'), true);
  assert.equal(store.isExpanded('發燒／寒顫'), true);
  assert.notEqual(store.getState().expanded, before, '必須換成新物件，渲染層才能用參考比較');
  assert.equal(store.toggleExpanded('發燒／寒顫'), false);
  assert.deepEqual(store.getState().expanded, {});
  store.toggleQuick('感染科常用');
  assert.equal(store.isQuickOpen('感染科常用'), true);
  assert.deepEqual(store.getState().expanded, {}, '快選與面板展開狀態不得互相影響');
});

test('訂閱：只在真的變動時通知，並回報變動欄位；可取消訂閱', () => {
  const store = newStore();
  const seen = [];
  const off = store.subscribe((s, changed) => seen.push(changed));
  store.setMode('outpatient');                 // 與現值相同 → 不通知
  assert.equal(seen.length, 0);
  store.setMode('surg');
  assert.deepEqual(seen[0].slice().sort(), ['mode'].sort());
  seen.length = 0;
  store.addCode('I10', '高血壓');
  assert.deepEqual(seen[0].slice().sort(), ['cart', 'recent', 'relatedCode'].sort());
  off();
  store.setMode('emergency');
  assert.equal(seen.length, 1, '取消訂閱後不得再收到通知');
});

test('setState 忽略未宣告的欄位，避免打錯字建出幽靈狀態', () => {
  const store = newStore();
  assert.deepEqual(store.setState({ modee: 'surg' }), []);
  assert.equal(store.getState().mode, 'outpatient');
  assert.equal(Object.prototype.hasOwnProperty.call(store.getState(), 'modee'), false);
});

test('列舉型欄位拒絕不合法值', () => {
  const store = newStore();
  assert.equal(store.setMode('nope'), false);
  assert.equal(store.setFormat('json'), false);
  assert.equal(store.setLayout('mobile'), false, 'mobile 是計算出來的生效版面，不是可持久化的偏好');
  assert.equal(store.setTheme('blue'), false);
  assert.equal(store.setDbState('done'), false);
  const s = store.getState();
  assert.deepEqual([s.mode, s.format, s.layout, s.theme, s.dbState], ['outpatient', 'lines', 'wide', 'light', 'idle']);
  assert.equal(store.setDbState('loading'), true);
});

test('主題切換來回翻轉並持久化', () => {
  const backing = fakeStorage();
  const store = S.createStore({ storage: backing, theme: 'light' });
  assert.equal(store.toggleTheme(), 'dark');
  assert.equal(JSON.parse(backing.getItem('icd10.theme')), 'dark');
  assert.equal(store.toggleTheme(), 'light');
  assert.equal(JSON.parse(backing.getItem('icd10.theme')), 'light');
});
