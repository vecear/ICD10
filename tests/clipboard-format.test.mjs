import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require('../src/clipboard-format.js');
const S = require('../src/state.js');

test('日期使用本地年月日，預設與自訂格式皆正確', () => {
  const day = new Date(2026, 8, 16, 0, 1);
  assert.equal(C.format('date', day), '115-09-16');
  assert.equal(C.format('date', day, { date: { template: '日期：{西元年}/{月}/{日}' } }), '日期：2026/09/16');
});

test('診斷清單保留三種舊格式並允許單筆與筆間分隔自訂', () => {
  const cart = [{ code: 'I10', zh: '高血壓' }, { code: 'E11.9', zh: '糖尿病' }];
  assert.equal(C.format('cart', cart), 'I10\nE11.9');
  for (const mode of ['lines', 'comma', 'names']) {
    assert.equal(C.format('cart', cart, {}, mode), require('../src/logic.js').formatCart(cart, mode));
  }

  assert.equal(C.format('cart', cart, { cart: { template: '診斷\n{清單}', itemTemplate: '{序號}. {名稱} ({代碼})', separator: '\n' } }), '診斷\n1. 高血壓 (I10)\n2. 糖尿病 (E11.9)');
  assert.equal(C.format('single', cart[0], { single: { template: '{名稱}：{代碼}' } }), '高血壓：I10');
  assert.equal(C.format('cart', [], { cart: { template: '診斷\n{清單}' } }), '');
});

test('CCr 缺少選填資料不輸出 null 或空標籤；範本文字不被執行', () => {
  const prefs = { ccr: { template: '<b>{CCr}</b>\nBSA：{BSA}\n{單位}' } };
  assert.equal(C.format('ccr', { CCr: 85.1, 單位: 'mL/min', BSA: null }, prefs), '<b>85.1</b>\nmL/min');
});

test('Lipid 可調整每張表段落且保留原始判定文字', () => {
  const data = { 完整結果: '原始文字', 個案資料: '範例個案', sections: { 表一: { 表名: '表一', 結論: '須先生活型態調整才可用藥' }, 表二: { 表名: '表二', 結論: '目前不符合健保起始用藥條件' } } };
  assert.equal(C.format('lipid', data), '原始文字');
  const prefs = { lipid: { template: '{個案資料}\n{表一}\n{表二}\n{Fibrate}', sectionTemplate: '{表名}：{結論}' } };
  assert.equal(C.format('lipid', data, prefs), '範例個案\n表一：須先生活型態調整才可用藥\n表二：目前不符合健保起始用藥條件');
});

test('範本驗證拒絕未知欄位、破損括號、空白與超長文字', () => {
  for (const template of ['{不存在}', '{月', '{{月}}', '', 'a'.repeat(12001)]) {
    assert.ok(C.validate('date', { template }).length, template.slice(0, 20));
  }
  assert.equal(C.validate('date', { template: '{月}/{日}' }).length, 0);
  assert.ok(C.validate('cart', { ...C.defaults('cart'), itemTemplate: '{CCr}' }).length);
});

function storage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k) };
}

test('只保存設定，重開與單類還原不影響其他類別', () => {
  const backing = storage();
  const a = S.createStore({ storage: backing });
  assert.equal(a.setClipboardFormat('date', { template: '{月}/{日}' }), true);
  a.setClipboardFormat('single', { template: '{名稱} {代碼}' });
  assert.equal(a.setClipboardFormat('date', { template: '{不存在}' }), false);
  const b = S.createStore({ storage: backing });
  assert.equal(b.getState().clipboardFormats.date.template, '{月}/{日}');
  b.resetClipboardFormat('date');
  assert.equal(b.getState().clipboardFormats.date, undefined);
  assert.equal(b.getState().clipboardFormats.single.template, '{名稱} {代碼}');
  assert.deepEqual(b.getState().cart, []);
});

test('損壞設定回復預設並留下可見提示資料', () => {
  for (const raw of ['{bad', JSON.stringify({ date: { template: '{錯字}' }, single: { template: '{代碼}' } })]) {
    const s = S.createStore({ storage: storage({ 'icd10.clipboardFormats': raw }) }).getState();
    assert.equal(s.clipboardFormats.date, undefined);
    assert.ok(s.clipboardWarning);
  }
});
