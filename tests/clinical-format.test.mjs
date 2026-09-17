import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const F = require('../src/clinical-format.js');
const L = require('../src/logic.js');

/* 這些函式原本關在 render-shared.js 裡，只能靠 Playwright 間接驗證格式。
   搬出來後每一個都有「正常輸入」與「缺值」兩組：缺值那組守的是同一條底線——
   病歷文字裡不得出現 undefined／null，那會直接貼進病人的病歷。 */
const noHole = (text, where) => {
  assert.ok(!/undefined|null|NaN/.test(text), `${where} 出現佔位值：${text}`);
};

const CCR_FULL = { age: 60, weightKg: 70, heightCm: 170, creatinine: 1, sex: 'male' };
const LIPID_FULL = { age: 40, sex: 'male', ldl: 180, tc: 220, hdl: 55, tg: 550 };

// ── CCr ─────────────────────────────────────────────────────────────────────
test('ccrClipboardData：完整輸入給滿所有欄位', () => {
  const d = F.ccrClipboardData(L.creatinineClearance(CCR_FULL));
  assert.equal(d.單位, 'mL/min');
  assert.equal(d.體重依據, '理想體重');
  assert.equal(d.BSA, '1.82');
  assert.ok(d.CCr > 0 && d.所用體重 > 0);
});

test('ccrClipboardData：沒有身高時 BSA 與校正值留空字串，不是 undefined', () => {
  const d = F.ccrClipboardData(L.creatinineClearance({ age: 60, weightKg: 70, creatinine: 1, sex: 'male' }));
  assert.equal(d.BSA, '');
  assert.equal(d.校正CCr, '');
  assert.equal(d.體重依據, '實際體重');
});

test('ccrResultText：預設範本輸出一行完整結果', () => {
  const text = F.ccrResultText(L.creatinineClearance(CCR_FULL));
  assert.match(text, /^CCr [\d.]+ mL\/min（理想體重 [\d.]+ kg）$/);
  noHole(text, 'ccrResultText');
});

test('ccrResultText：算不出來時回空字串，不丟例外也不輸出殘句', () => {
  assert.equal(F.ccrResultText(L.creatinineClearance({})), '');
  assert.equal(F.ccrResultText(null), '');
});

// ── 判定與處方措辭 ───────────────────────────────────────────────────────────
test('lipidVerdictText：達標與資料不足各自有對應結論', () => {
  const r = L.lipidCoverage(LIPID_FULL);
  assert.equal(F.lipidVerdictText(r.one), L.lipidTreatmentStatus(r.one).text);
  assert.match(F.lipidVerdictText({ meets: null }), /待判定/);
  noHole(F.lipidVerdictText({ meets: null }), 'lipidVerdictText');
});

test('lipidPrescriptionText：達標才寫處方細節，未達標改寫結論', () => {
  assert.equal(F.lipidPrescriptionText({ meets: true }, '可直接開藥'), '可直接開藥');
  assert.match(F.lipidPrescriptionText({ meets: false }, '可直接開藥'), /未達起始門檻/);
});

test('lipidParallelText：可並行與須先非藥物治療兩種措辭', () => {
  assert.match(F.lipidParallelText(true), /可與藥物治療並行/);
  assert.match(F.lipidParallelText(false), /3–6 個月/);
});

test('lipidFibrateParallelText：TG ≧ 500 那一列不論共病，其餘寫命中的共病', () => {
  assert.match(F.lipidFibrateParallelText({ parallel: true, route: 'TG ≧ 500' }), /不論有無心血管疾病/);
  assert.equal(
    F.lipidFibrateParallelText({ parallel: true, route: 'TG 200–499', parallelWhy: ['冠心病', '糖尿病'] }),
    '可與藥物治療並行（冠心病及糖尿病）');
});

test('lipidFibrateParallelText：沒有 parallelWhy 時退回通則，不吐 undefined', () => {
  const text = F.lipidFibrateParallelText({ parallel: true, route: 'TG 200–499' });
  assert.equal(text, '可與藥物治療並行（心血管疾病或糖尿病）');
  noHole(text, 'lipidFibrateParallelText');
});

// ── 病歷文字 ─────────────────────────────────────────────────────────────────
test('lipidProfileLine：年齡性別與四項血脂依序列出', () => {
  const r = L.lipidCoverage(LIPID_FULL);
  assert.equal(F.lipidProfileLine(r, LIPID_FULL),
    '40 歲男性，LDL-C 180、TC 220、HDL-C 55、TG 550 mg/dL');
});

test('lipidProfileLine：完全沒有資料時回空字串，不留孤立的標點', () => {
  const empty = L.lipidCoverage({});
  assert.equal(F.lipidProfileLine(empty, {}), '');
  assert.equal(F.lipidProfileLine(empty, { age: 0 }), '');
});

test('lipidChartRows：首行帶條文全名，其後每行都是「　標籤　內容」', () => {
  const r = L.lipidCoverage(LIPID_FULL);
  const rows = F.lipidChartRows(F.LIPID_TABLE_ONE_NAME, r.one, r);
  assert.match(rows[0], /^降膽固醇藥物：依「全民健康保險降膽固醇藥物給付規定表一」$/);
  for (const line of rows.slice(1)) assert.match(line, /^　[^　]+　.+$/);
  assert.ok(rows.some((l) => l.includes('門檻') && l.includes('本例 180 mg/dL')));
  noHole(rows.join('\n'), 'lipidChartRows');
});

test('lipidChartRows：表二帶適用範圍且沒有數值時不寫「本例」', () => {
  const empty = L.lipidCoverage({});
  const rows = F.lipidChartRows(F.LIPID_TABLE_TWO_NAME, empty.two, empty, F.LIPID_TWO_SCOPE);
  assert.ok(rows[0].endsWith(F.LIPID_TWO_SCOPE));
  assert.ok(!rows.some((l) => l.includes('本例')));
  noHole(rows.join('\n'), 'lipidChartRows 缺值');
});

test('lipidDefaultResultText：兩張表都寫，並以出處註記收尾', () => {
  const text = F.lipidDefaultResultText(L.lipidCoverage(LIPID_FULL), LIPID_FULL);
  assert.ok(text.startsWith('【降血脂給付依據】40 歲男性'));
  assert.ok(text.includes(F.LIPID_TABLE_ONE_NAME) && text.includes(F.LIPID_TABLE_TWO_NAME));
  assert.ok(text.includes(F.LIPID_TG_TABLE_NAME), 'TG 550 應觸發 fibrate 段落');
  assert.ok(text.endsWith(F.LIPID_SOURCE_NOTE));
  noHole(text, 'lipidDefaultResultText');
});

test('lipidDefaultResultText：沒有任何血脂數值時整段不輸出', () => {
  assert.equal(F.lipidDefaultResultText(L.lipidCoverage({}), {}), '');
  assert.equal(F.lipidDefaultResultText(null, {}), '');
});

test('lipidClipboardData：三個段落各自可獨立取用，欄位與完整段落一致', () => {
  const data = F.lipidClipboardData(L.lipidCoverage(LIPID_FULL), LIPID_FULL);
  assert.deepEqual(Object.keys(data.sections), ['表一', '表二', 'Fibrate']);
  assert.equal(data.來源, F.LIPID_SOURCE_NOTE);
  assert.equal(data.sections.表一.表名, F.LIPID_TABLE_ONE_NAME);
  assert.equal(data.sections.表二.適用範圍, F.LIPID_TWO_SCOPE);
  assert.ok(data.sections.表一.完整段落.includes(data.sections.表一.結論));
  assert.ok(data.sections.Fibrate.完整段落.startsWith('降三酸甘油酯藥物：'));
  noHole(JSON.stringify(data), 'lipidClipboardData');
});

test('lipidClipboardData：TG 未達 fibrate 門檻時沒有 Fibrate 段落，其餘欄位仍齊全', () => {
  const input = { age: 40, sex: 'male', ldl: 180 };
  const data = F.lipidClipboardData(L.lipidCoverage(input), input);
  assert.deepEqual(Object.keys(data.sections), ['表一', '表二']);
  assert.equal(data.個案資料, '40 歲男性，LDL-C 180 mg/dL');
  noHole(JSON.stringify(data), 'lipidClipboardData 缺 TG');
});

test('lipidResultText：套用預設範本等於完整病歷文字', () => {
  const r = L.lipidCoverage(LIPID_FULL);
  assert.equal(F.lipidResultText(r, LIPID_FULL), F.lipidDefaultResultText(r, LIPID_FULL));
});

test('lipidResultText：自訂範本只取指定段落；無資料時回空字串', () => {
  const r = L.lipidCoverage(LIPID_FULL);
  const text = F.lipidResultText(r, LIPID_FULL,
    { lipid: { template: '{表一}', sectionTemplate: '{表名}：{結論}' } });
  assert.equal(text, F.LIPID_TABLE_ONE_NAME + '：' + F.lipidVerdictText(r.one));
  assert.equal(F.lipidResultText(L.lipidCoverage({}), {}), '');
});
