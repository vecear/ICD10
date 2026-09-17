import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const L = require('../src/logic.js');

test('HDL-C 留白不算低 HDL 風險因子，也不降低用藥門檻', () => {
  const r = L.lipidCoverage({ age: '', ldl: '150', hdl: '', tc: '' });
  assert.deepEqual(r.riskFactorsNew, []);
  assert.deepEqual(r.two.riskFactors, []);
  assert.equal(r.one.threshold, 160);
  assert.equal(r.one.meets, false);
});

test('用藥結論同時考慮門檻與生活型態前置條件', () => {
  for (const [input, expected] of [
    [{ ldl: 180 }, ['lifestyle', 'no']],
    [{ ldl: 190 }, ['direct', 'lifestyle']],
    [{ ldl: 100, dm: true }, ['direct', 'direct']],
    [{ ldl: 60, dm: true }, ['no', 'no']],
    [{ tc: 180, dm: true }, ['pending', 'direct']],
  ]) {
    const r = L.lipidCoverage(input);
    assert.deepEqual([r.one, r.two].map(x => L.lipidTreatmentStatus(x).status), expected);
  }
  const r = L.lipidCoverage({ ldl: 180 });
  assert.match(L.lipidTreatmentStatus(r.one).text, /3–6 個月.*複評仍達門檻/);
  const p = L.lipidProductVerdict({ code: 'test', table: 'one' }, r);
  assert.deepEqual(L.lipidTreatmentStatus(p), L.lipidTreatmentStatus(r.one));
});

test('Fibrate 保留直接、先生活型態、未達與資料不足的差異', () => {
  for (const [input, status] of [
    [{ tg: 500 }, 'direct'],
    [{ tg: 300, hdl: 35 }, 'lifestyle'],
    [{ tg: 300, hdl: 35, dm: true }, 'direct'],
    [{ tg: 150, dm: true }, 'no'],
    [{ tg: 300 }, 'pending'],
  ]) assert.equal(L.lipidTreatmentStatus(L.lipidCoverage(input).fibrate).status, status);
});
