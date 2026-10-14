import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const D = require('../src/date-calculator.js');
const S = require('../src/state.js');

test('日期以起算日為第 0 天，前後滿天及零天', () => {
  assert.equal(typeof D.calculate, 'function');
  assert.equal(D.calculate('2026-10-14', '7', 'after').date, '2026-10-21');
  assert.equal(D.calculate('2026-10-14', '7', 'before').date, '2026-10-07');
  for (const direction of ['before', 'after']) {
    assert.equal(D.calculate('2026-10-14', '0', direction).date, '2026-10-14');
  }
  assert.equal(D.calculate('2026-10-14', '1', 'after').label, '2026年10月15日');
  assert.equal(D.calculate('2026-10-14', '1', 'after').weekday, '星期四');
});

test('跨月、跨年、閏年與世紀例外', () => {
  for (const [date, days, direction, expected] of [
    ['2026-01-31', 1, 'after', '2026-02-01'],
    ['2026-12-31', 1, 'after', '2027-01-01'],
    ['2026-01-01', 1, 'before', '2025-12-31'],
    ['2024-02-28', 1, 'after', '2024-02-29'],
    ['2024-03-01', 1, 'before', '2024-02-29'],
    ['2025-02-28', 1, 'after', '2025-03-01'],
    ['1900-02-28', 1, 'after', '1900-03-01'],
    ['2000-02-28', 1, 'after', '2000-02-29'],
    ['0099-12-31', 1, 'after', '0100-01-01'],
    ['2026-03-08', 1, 'after', '2026-03-09'],
    ['2026-11-01', 1, 'after', '2026-11-02'],
  ]) assert.equal(D.calculate(date, days, direction).date, expected);
});

test('空白、無效日期、非整數與非法方向不回傳日期', () => {
  for (const date of ['', null, '2025-02-29', '2026-04-31', '2026-13-01', '0000-01-01', '2026-1-1', 'garbage']) {
    const r = D.calculate(date, 7, 'after');
    assert.equal(r.ok, false); assert.equal(r.date, undefined); assert.ok(r.error);
  }
  for (const days of ['', ' ', null, undefined, -1, '-1', '1.5', 1.5, '1e2', true, [], Infinity, 'abc', Number.MAX_SAFE_INTEGER]) {
    const r = D.calculate('2026-10-14', days, 'after');
    assert.equal(r.ok, false); assert.equal(r.date, undefined); assert.ok(r.error);
  }
  assert.equal(D.calculate('2026-10-14', 1, 'bad').ok, false);
});

test('日期上下界不溢位', () => {
  assert.equal(D.calculate('0001-01-01', 1, 'before').ok, false);
  assert.equal(D.calculate('9999-12-31', 1, 'after').ok, false);
  assert.equal(D.calculate('0001-01-01', 0, 'after').date, '0001-01-01');
  assert.equal(D.calculate('9999-12-31', 0, 'after').date, '9999-12-31');
});

test('Date 與現有浮層互斥且不持久化', () => {
  const store = S.createStore();
  assert.equal(typeof store.setDateCalcOpen, 'function');
  for (const openOther of [
    () => store.setCcrOpen(true), () => store.setLipidOpen(true),
    () => store.setVacOpen(true), () => store.setAmOpen(true),
    () => store.setChronicTopic('dm'), () => store.setSettingsOpen(true),
  ]) {
    openOther(); store.setDateCalcOpen(true);
    const state = store.getState();
    assert.equal(state.dateCalcOpen, true);
    for (const key of ['ccrOpen', 'lipidOpen', 'vacOpen', 'amOpen', 'settingsOpen']) assert.equal(state[key], false);
    assert.equal(state.chronicTopic, null);
    openOther(); assert.equal(store.getState().dateCalcOpen, false);
  }
  assert.ok(!S.PERSISTED_KEYS.includes('dateCalcOpen'));
});
