import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const L = require('../src/logic.js');
const R = require('../src/renal-dosing.js');
const data = require('../src/curated/antibiotic_dosing.json');

test('BSA 使用實際體重，校正 CCr 使用未取整的既有 CCr', () => {
  const input = {sex:'male', age:60, heightCm:180, weightKg:80, creatinine:2};
  const r = L.creatinineClearance(input);
  assert.equal(r.bsaRaw, 2);
  assert.equal(r.crclIndexedRaw, r.crclRaw * 1.73 / 2);
  assert.notEqual(r.bsaRaw, Math.sqrt(180 * r.weightUsed / 3600));
  const small = L.creatinineClearance({...input, heightCm:150, weightKg:40});
  assert.ok(small.crclIndexedRaw > small.crclRaw);
  assert.equal(small.bsaRaw, Math.sqrt(150 * 40 / 3600));
});

test('缺少／不合法身高不產生 BSA；無效病人不保留舊校正值', () => {
  for (const heightCm of ['', null, undefined, 0, -1, 251, Infinity, 'oops', true, []]) {
    const r = L.creatinineClearance({age:60,weightKg:80,creatinine:2,heightCm});
    assert.equal(r.bsaRaw, null);
    assert.equal(r.crclIndexedRaw, null);
  }
  const invalid = L.creatinineClearance({age:60,weightKg:80,heightCm:180,creatinine:''});
  assert.equal(invalid.ok, false);
  assert.equal(invalid.crclIndexedRaw, undefined);
});

test('acyclovir 依校正值跨過門檻，其他藥仍用原始 CCr', () => {
  const plan = data.drugs.find(d=>d.id==='acyclovir').regimens.find(r=>r.id==='iv-10-q8h');
  assert.equal(plan.renalMetric, 'crcl-indexed');
  const input = {crcl:28,bsa:2,renalState:'stable'};
  assert.deepEqual([R.recommend(plan,input).status,R.recommend(plan,input).rowIndex],['matched',2]);
  assert.equal(R.recommend(plan,{...input,bsa:1}).rowIndex,1);
  for (const bsa of ['',null,undefined,0,-1,Infinity,true]) {
    assert.equal(R.recommend(plan,{...input,bsa}).status,'needs-input');
  }
  assert.equal(R.recommend(plan,{...input,renalState:'ihd',bsa:null}).status,'dialysis');
  const ordinary = {...plan,renalMetric:'crcl'};
  assert.equal(R.recommend(ordinary,input).rowIndex,1);
  assert.equal(R.recommend({...plan,renalMetric:'egfr-indexed'},input).status,'manual');
});

test('校正分段用完整精度，原表多種劑量仍需人工判斷', () => {
  const plans = data.drugs.find(d=>d.id==='acyclovir').regimens;
  const iv = plans.find(r=>r.id==='iv-5-q8h');
  for (const [value, index] of [[9.9999,3],[10,2],[24.9999,2],[25,1],[50,1],[50.0001,0]]) {
    assert.equal(R.recommend(iv,{crcl:value*2/1.73,bsa:2,renalState:'stable'}).rowIndex,index);
  }
  const po = plans.find(r=>r.id==='po-400-q12h');
  assert.equal(R.recommend(po,{crcl:20,bsa:1.73,renalState:'stable'}).status,'manual');
  assert.equal(R.recommend(po,{crcl:30,bsa:1.73,renalState:'stable'}).status,'matched');
});
