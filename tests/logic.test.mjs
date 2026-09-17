import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const L = require('../src/logic.js');

const DB = [
  ['E11', 0, 'Type 2 diabetes mellitus', '第2型糖尿病'],
  ['E11.9', 1, 'Type 2 diabetes mellitus without complications', '第2型糖尿病伴無併發症'],
  ['E11.65', 1, 'Type 2 diabetes mellitus with hyperglycemia', '第2型糖尿病伴高血糖'],
  ['L03.90', 1, 'Cellulitis, unspecified', '蜂窩性組織炎'],
  ['I10', 1, 'Essential (primary) hypertension', '本態性高血壓'],
];
const idx = L.buildIndex(DB);

test('search: 代碼前綴（忽略小數點與大小寫）優先', () => {
  const r = L.search(idx, 'e119');
  assert.equal(r[0][0], 'E11.9');
});
test('search: 英文子字串', () => {
  assert.equal(L.search(idx, 'cellul')[0][0], 'L03.90');
});
test('search: 中文子字串', () => {
  assert.equal(L.search(idx, '蜂窩')[0][0], 'L03.90');
});
test('search: 過短 query 回空', () => {
  const r = L.search(idx, 'e');
  assert.equal(r.length, 0);
  assert.equal(r.total, 0);
});
test('search: total 回報截斷前的命中總數', () => {
  const all = L.search(idx, '第2型糖尿病');
  assert.equal(all.total, 3);
  const capped = L.search(idx, '第2型糖尿病', 1);
  assert.equal(capped.length, 1);
  assert.equal(capped.total, 3, '截斷後仍要回報總數，UI 才能提示「共 N 筆」');
});
test('search: 完全相符 > 名稱開頭相符 > 其他', () => {
  const db3 = [
    ['A00.1', 1, 'Other pain of throat', '其他咽喉痛'],
    ['A00.2', 1, 'Sore throat with fever', '咽喉痛併發燒'],
    ['A00.3', 1, 'Sore throat', '咽喉痛'],
  ];
  const codes = L.search(L.buildIndex(db3), '咽喉痛').map(r => r[0]);
  assert.deepEqual(codes, ['A00.3', 'A00.2', 'A00.1']);
});
test('search: 精選碼優先仍高於命中層級', () => {
  const db4 = [
    ['A00.3', 1, 'Sore throat', '咽喉痛'],
    ['A00.1', 1, 'Other pain of throat', '其他咽喉痛'],
  ];
  const idx4 = L.buildIndex(db4, new Set(['A00.1']));
  assert.deepEqual(L.search(idx4, '咽喉痛').map(r => r[0]), ['A00.1', 'A00.3']);
});
test('search: 代碼與名稱混合命中不重複', () => {
  const codes = L.search(idx, 'E11').map(r => r[0]);
  assert.deepEqual(codes, [...new Set(codes)]);
  assert.ok(codes.includes('E11.9') && codes.includes('E11.65'));
});
test('search: 人工精選碼於同字串命中時優先排序', () => {
  const db2 = [
    ['H05.01', 0, 'Cellulitis of orbit', '眼窩蜂窩組織炎'],
    ['L03.90', 1, 'Cellulitis, unspecified', '蜂窩性組織炎'],
  ];
  const idx2 = L.buildIndex(db2, new Set(['L03.90']));
  assert.equal(L.search(idx2, 'cellulitis')[0][0], 'L03.90');
});
test('family: 同類目葉碼、排除自身與類目碼', () => {
  const codes = L.family(idx, 'E11.9').map(r => r[0]);
  assert.deepEqual(codes, ['E11.65']);
});
test('formatCart 三種格式', () => {
  const items = [{ code: 'I10', zh: '本態性高血壓' }, { code: 'E11.9', zh: '第2型糖尿病伴無併發症' }];
  assert.equal(L.formatCart(items, 'lines'), 'I10\nE11.9');
  assert.equal(L.formatCart(items, 'comma'), 'I10,E11.9');
  assert.equal(L.formatCart(items, 'names'), 'I10\t本態性高血壓\nE11.9\t第2型糖尿病伴無併發症');
});

test('mergeRelated 合併人工與症狀推薦並去重', () => {
  assert.deepEqual(
    L.mergeRelated(['I20.9', 'K21.9'], ['K21.9', 'R00.0']),
    ['I20.9', 'K21.9', 'R00.0']
  );
  assert.deepEqual(L.mergeRelated(undefined, ['A41.9']), ['A41.9']);
});

test('rocDate：民國年＝西元−1911，月日補零（HIS 欄位是定長格式）', () => {
  assert.equal(L.rocDate(new Date(2026, 7, 13)), '115-08-13');
  assert.equal(L.rocDate(new Date(2026, 0, 5)), '115-01-05');   // 個位數月日一定要補零
  assert.equal(L.rocDate(new Date(2025, 11, 31)), '114-12-31');
  assert.equal(L.rocDate(new Date(1912, 0, 1)), '1-01-01');     // 民國元年
});

test('rocDate：不給參數就用今天，格式一律 民國年-月-日', () => {
  const today = L.rocDate();
  assert.match(today, /^\d{1,3}-\d{2}-\d{2}$/);
  const now = new Date();
  assert.equal(today, L.rocDate(now));
});

/* ── 慢病速查的時效篩選（splitByEffective） ──
   給付規定沒有「逐條比對官方全庫」這種驗證手段，換版當天顯示錯版本是這個功能最大的
   臨床風險，所以邊界（含當日）逐一釘死，不能只測「大致對」。 */
const WINDOW_ITEMS = [
  { text: '永遠適用（沒有生效日）' },
  { text: '舊表', effectiveTo: '2026-08-31' },
  { text: '新表', effectiveFrom: '2026-09-01' },
  { text: '早就結束', effectiveTo: '2025-12-31' },
  { text: '限定區間', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
];
const texts = (list) => list.map((x) => x.text);

test('splitByEffective: 換版前一天顯示舊表，新表列為即將生效', () => {
  const r = L.splitByEffective(WINDOW_ITEMS, '2026-08-31');
  assert.deepEqual(texts(r.current), ['永遠適用（沒有生效日）', '舊表', '限定區間']);
  assert.deepEqual(texts(r.upcoming), ['新表']);
  assert.deepEqual(texts(r.expired), ['早就結束']);
});
test('splitByEffective: 生效當天換成新表，舊表退場（effectiveTo 含當日、effectiveFrom 含當日）', () => {
  const r = L.splitByEffective(WINDOW_ITEMS, '2026-09-01');
  assert.deepEqual(texts(r.current), ['永遠適用（沒有生效日）', '新表', '限定區間']);
  assert.deepEqual(r.upcoming, []);
  assert.deepEqual(texts(r.expired), ['舊表', '早就結束']);   // 維持輸入順序
});
test('splitByEffective: effectiveTo 當天仍算現行（不是提前一天下架）', () => {
  const r = L.splitByEffective([{ text: 'x', effectiveTo: '2026-08-31' }], '2026-08-31');
  assert.equal(r.current.length, 1);
  assert.equal(r.expired.length, 0);
});
test('splitByEffective: effectiveFrom 的前一天還不算現行', () => {
  const r = L.splitByEffective([{ text: 'x', effectiveFrom: '2026-09-01' }], '2026-08-31');
  assert.equal(r.current.length, 0);
  assert.equal(r.upcoming.length, 1);
});
test('splitByEffective: 空／壞資料一律吃得下，不丟例外', () => {
  assert.deepEqual(L.splitByEffective(undefined, '2026-08-19'), { current: [], upcoming: [], expired: [] });
  assert.deepEqual(L.splitByEffective([], '2026-08-19').current, []);
  const r = L.splitByEffective([null, 'x', 42, { text: 'ok' }], '2026-08-19');
  assert.deepEqual(texts(r.current), ['ok']);
});
test('splitByEffective: 沒給 today 就不篩掉任何東西（寧可全顯示，不要靜默藏起規定）', () => {
  const r = L.splitByEffective(WINDOW_ITEMS, undefined);
  assert.equal(r.current.length, WINDOW_ITEMS.length);
  assert.equal(r.upcoming.length, 0);
  assert.equal(r.expired.length, 0);
});

// ── Cockcroft-Gault CCr（抗生素劑量會用到，數字錯了會直接影響給藥）──
test('CCr：新增 crclRaw，既有顯示值與所有欄位保持不變', () => {
  const { crclRaw, bsaRaw, crclIndexedRaw, ...existing } = L.creatinineClearance({
    sex: 'male', age: 60, weightKg: 70, creatinine: 1,
  });
  assert.equal(crclRaw, 5600 / 72);
  assert.equal(bsaRaw, null);
  assert.equal(crclIndexedRaw, null);
  assert.deepEqual(existing, {
    ok: true, crcl: 77.8, basis: 'actual', weightUsed: 70, actual: 77.8,
    ibw: null, adjbw: null, bmi: null, hasHeight: false,
    ideal: null, adjusted: null, range: null, rangeBasis: null,
  });
});

test('CCr：crclRaw 使用所選體重的完整精度，涵蓋男女及各種體重依據', () => {
  const maleIbw = 50 + 2.3 * (175 / 2.54 - 60);
  const femaleIbw = 45.5 + 2.3 * (160 / 2.54 - 60);
  const cases = [
    [{ sex: 'male', weightKg: 50, heightCm: 175 }, 'actual', 50, 1],
    [{ sex: 'male', weightKg: 70, heightCm: 175 }, 'ideal', maleIbw, 1],
    [{ sex: 'male', weightKg: 100, heightCm: 175 }, 'adjusted', maleIbw + 0.4 * (100 - maleIbw), 1],
    [{ sex: 'female', weightKg: 60, heightCm: 160 }, 'ideal', femaleIbw, 0.85],
    [{ sex: 'female', weightKg: 70 }, 'actual', 70, 0.85],
    [{ sex: 'female', weightKg: 40, heightCm: 90 }, 'actual', 40, 0.85],
  ];
  for (const [input, basis, kg, q] of cases) {
    const r = L.creatinineClearance({ age: 60, creatinine: 1.1, ...input });
    assert.equal(r.basis, basis);
    assert.equal(r.crclRaw, (80 * kg * q) / (72 * 1.1));
    assert.equal(r.crcl, Math.round(r.crclRaw * 10) / 10);
    assert.notEqual(r.crclRaw, r.crcl);
  }
});

test('CCr：新增 raw 不改變無效輸入的回傳形狀', () => {
  assert.deepEqual(L.creatinineClearance({ age: 60, weightKg: 70 }), {
    ok: false, missing: ['creatinine'],
  });
});

test('CCr：公式本身（男女、四捨五入到小數一位）', () => {
  // 60 歲、70 kg、Cr 1.0 → (140-60)*70/(72*1) = 77.8
  const m = L.creatinineClearance({ sex: 'male', age: 60, weightKg: 70, creatinine: 1.0 });
  assert.equal(m.crcl, 77.8);
  // 女性乘 0.85 → 77.777*0.85 = 66.1
  const f = L.creatinineClearance({ sex: 'female', age: 60, weightKg: 70, creatinine: 1.0 });
  assert.equal(f.crcl, 66.1);
});

test('CCr：沒有身高就退回實際體重，並標明 basis', () => {
  const r = L.creatinineClearance({ sex: 'male', age: 60, weightKg: 70, creatinine: 1.0 });
  assert.equal(r.basis, 'actual');
  assert.equal(r.hasHeight, false);
  assert.equal(r.ibw, null);
  assert.equal(r.bmi, null);
  assert.equal(r.range, null);
});

test('CCr：IBW 用 Devine（身高 cm 換算成吋）', () => {
  // 175 cm = 68.898 吋；男 50 + 2.3*(68.898-60) = 70.5
  const m = L.creatinineClearance({ sex: 'male', age: 50, weightKg: 70, heightCm: 175, creatinine: 1 });
  assert.equal(m.ibw, 70.5);
  // 160 cm = 62.992 吋；女 45.5 + 2.3*(62.992-60) = 52.4
  const f = L.creatinineClearance({ sex: 'female', age: 50, weightKg: 60, heightCm: 160, creatinine: 1 });
  assert.equal(f.ibw, 52.4);
});

test('CCr：依 BMI 選體重（MDCalc／Brown et al 的規則）', () => {
  // BMI 18.5-24.9 → 用理想體重，範圍另一端是實際體重
  const normal = L.creatinineClearance({ sex: 'male', age: 60, weightKg: 70, heightCm: 175, creatinine: 1 });
  assert.equal(Math.round(normal.bmi), 23);
  assert.equal(normal.basis, 'ideal');
  assert.equal(normal.rangeBasis, 'actual');
  assert.equal(normal.crcl, normal.ideal);
  assert.equal(normal.range, normal.actual);

  // BMI < 18.5 → 用實際體重，不做調整、沒有範圍
  const thin = L.creatinineClearance({ sex: 'male', age: 60, weightKg: 50, heightCm: 175, creatinine: 1 });
  assert.ok(thin.bmi < 18.5);
  assert.equal(thin.basis, 'actual');
  assert.equal(thin.rangeBasis, null);
  assert.equal(thin.crcl, thin.actual);

  // BMI ≥ 25 → 用調整體重，範圍另一端是理想體重
  const obese = L.creatinineClearance({ sex: 'male', age: 60, weightKg: 100, heightCm: 175, creatinine: 1 });
  assert.ok(obese.bmi >= 25);
  assert.equal(obese.basis, 'adjusted');
  assert.equal(obese.rangeBasis, 'ideal');
  assert.equal(obese.crcl, obese.adjusted);
  assert.equal(obese.range, obese.ideal);
});

test('CCr：調整體重＝IBW + 0.4×(實際 − IBW)', () => {
  const r = L.creatinineClearance({ sex: 'male', age: 60, weightKg: 100, heightCm: 175, creatinine: 1 });
  // IBW 70.5 → 70.5 + 0.4*(100-70.5) = 82.3
  assert.equal(r.ibw, 70.5);
  assert.equal(r.adjbw, 82.3);
  assert.equal(r.weightUsed, 82.3);
});

test('CCr：缺欄位或不合理的值一律回 ok:false，不回 NaN', () => {
  const cases = [
    {},
    { age: 60, weightKg: 70 },                                   // 缺 Cr
    { age: 0, weightKg: 70, creatinine: 1 },                     // 年齡 0
    { age: 200, weightKg: 70, creatinine: 1 },                   // 年齡超出範圍
    { age: 60, weightKg: 0, creatinine: 1 },                     // 體重 0
    { age: 60, weightKg: 70, creatinine: 0 },                    // Cr 0（會除以 0）
    { age: 60, weightKg: 70, creatinine: -1 },
    { age: 'abc', weightKg: 70, creatinine: 1 },
  ];
  for (const c of cases) {
    const r = L.creatinineClearance(c);
    assert.equal(r.ok, false, `應該擋下：${JSON.stringify(c)}`);
    assert.ok(Array.isArray(r.missing) && r.missing.length > 0);
  }
});

test('CCr：身高極端時不產生負的理想體重', () => {
  const r = L.creatinineClearance({ sex: 'female', age: 60, weightKg: 40, heightCm: 90, creatinine: 1 });
  assert.equal(r.ibw, null, '算出負值就不該當成體重用');
  assert.equal(r.basis, 'actual');
});

/* splitSentences：條文在窄欄裡是一面文字牆，斷成「一條一行」才讀得動。
   最重要的不變式是**不吞字**——條文是臨床依據，少一句比擠在一起嚴重得多。 */
test('splitSentences: 依句號斷行，句號留在句尾', () => {
  const r = L.splitSentences('較嚴格：低血糖風險低。較寬鬆：情況相反。');
  assert.deepEqual(r, ['較嚴格：低血糖風險低。', '較寬鬆：情況相反。']);
});
test('splitSentences: 沒有終止符就是一整段', () => {
  assert.deepEqual(L.splitSentences('限用於 metformin 已達最大耐受劑量'),
    ['限用於 metformin 已達最大耐受劑量']);
});
test('splitSentences: 結尾沒有句號的殘句不能被吞掉', () => {
  assert.deepEqual(L.splitSentences('第一句。第二句沒句號'), ['第一句。', '第二句沒句號']);
});
/* 2026-08-26 反轉的設計決定：原本刻意不切分號（「分號是句內結構」），
   實際在診間讀過之後判定讀不動。健保條文的分號幾乎都是**另一個適用條件**的界線。 */
test('splitSentences: 分號也斷行，分號留在段尾', () => {
  const r = L.splitSentences('ACS 病史 LDL-C ≧ 70；心血管疾病或糖尿病 ≧ 100');
  assert.deepEqual(r, ['ACS 病史 LDL-C ≧ 70；', '心血管疾病或糖尿病 ≧ 100']);
});
test('splitSentences: 括號內的分號不切（那是括號這個單位的內部結構）', () => {
  const s = '出處為藥品給付規定（114/6/1 生效；115.07.23 版）之第二節。';
  assert.deepEqual(L.splitSentences(s), [s]);
});
test('splitSentences: 括號沒關好也不能把後面整段吃掉', () => {
  // 資料打錯字（缺右括號）時寧可退回「不切」，也不可以吞字
  const s = '前段（沒關好；後段。';
  assert.equal(L.splitSentences(s).join(''), s);
});
test('splitSentences: 破折號仍然是句內結構，不切', () => {
  const s = '血壓數值不是給付條件——不會因為沒降到 130/80 被核刪。';
  assert.deepEqual(L.splitSentences(s), [s]);
});
test('splitSentences: 接回去等於原文（不吞字的硬保證）', () => {
  const s = '較嚴格（如 < 6.5%）：低血糖風險低、罹病時間短。較寬鬆（如 < 8.0～8.5%）：情況相反。'
    + '指引刻意不給單一固定數字——這是設計，不是查詢遺漏；表二另有例外。';
  assert.equal(L.splitSentences(s).join(''), s);
});
test('splitSentences: 空值與非字串回空陣列', () => {
  assert.deepEqual(L.splitSentences(''), []);
  assert.deepEqual(L.splitSentences(null), []);
  assert.deepEqual(L.splitSentences(undefined), []);
});

/* splitLead：把行首的「短標：」切出來給畫面標重。
   lead + rest 必須恆等於原字串——畫面是拿它們接起來當條文顯示的。 */
test('splitLead: 切出短標，冒號留在 lead', () => {
  assert.deepEqual(L.splitLead('起始門檻：ACS 病史 LDL-C ≧ 70'),
    { lead: '起始門檻：', rest: 'ACS 病史 LDL-C ≧ 70' });
});
test('splitLead: 冒號前太長就不是標籤（標重了整行都在發亮＝等於沒標）', () => {
  const s = 'evolocumab（Repatha）與 alirocumab（Praluent）：限重大心血管事件後一年內';
  assert.deepEqual(L.splitLead(s), { lead: '', rest: s });
  const sentence = '指引目標與健保門檻落差最大的就是 PCSK9：健保限重大事件後一年內';  // 22 字，是句子不是標籤
  assert.deepEqual(L.splitLead(sentence), { lead: '', rest: sentence });
});
/* 上限 18 而不是 14：條文的標籤常含英文藥名與條號，字數吃得比中文快。
   這兩個是實際資料裡被 14 誤殺、放寬後才抓得到的。 */
test('splitLead: 含英文藥名與條號的標籤（14 字會誤殺）照樣認得', () => {
  assert.deepEqual(L.splitLead('TZD／DPP-4i／SGLT2i：限 metformin 最大耐受仍未達標').lead,
    'TZD／DPP-4i／SGLT2i：');                                      // 17 字
  assert.deepEqual(L.splitLead('2.6.2 ezetimibe：限原發性高膽固醇血症').lead,
    '2.6.2 ezetimibe：');                                        // 15 字
});
test('splitLead: 冒號前有別的標點就不是標籤', () => {
  const s = '早晚 2 次、共 4 天：連續測';    // 冒號夠前面，是「、」把它擋掉的
  assert.deepEqual(L.splitLead(s), { lead: '', rest: s });
});
test('splitLead: 半形冒號不算（條文裡那是時間與比值）', () => {
  const s = '每時段至少 2 次讀數，早上 8:00 前測';
  assert.deepEqual(L.splitLead(s), { lead: '', rest: s });
});
test('splitLead: 沒有冒號、開頭就是冒號、空值都回整段', () => {
  assert.deepEqual(L.splitLead('限用於 metformin 已達最大耐受劑量'),
    { lead: '', rest: '限用於 metformin 已達最大耐受劑量' });
  assert.deepEqual(L.splitLead('：開頭就是冒號'), { lead: '', rest: '：開頭就是冒號' });
  assert.deepEqual(L.splitLead(''), { lead: '', rest: '' });
  assert.deepEqual(L.splitLead(null), { lead: '', rest: '' });
});
test('splitLead: lead + rest 恆等於原字串（畫面靠這條不吞字）', () => {
  for (const s of ['篩檢：每年 UACR＋Cr 各 1 次', '沒有標籤的一整段', 'Fibrate：TG 200–499']) {
    const { lead, rest } = L.splitLead(s);
    assert.equal(lead + rest, s);
  }
});

/* ── 降血脂給付試算（lipidCoverage） ───────────────────────────────────────
   這是整份速查裡最容易算錯的一塊，而且錯了會直接影響「開不開得成」。
   每一條門檻與分級都對回藥品給付規定 第二節 2.6.1 表一／表二（115.8.21 版）原文，
   不接受「大致對」。 */

/* 表一：起始門檻＝目標值，non-HDL-C 目標為各加 30。逐級釘死。 */
test('lipidCoverage 表一：五級門檻與 non-HDL-C 目標', () => {
  // 刻意用 LDL 150：填 190 以上的話「LDL-C ≧ 190 本身即高風險」會蓋掉風險因子計數那幾級
  const at = (extra) => L.lipidCoverage(Object.assign({ sex: 'male', age: 40, ldl: 150 }, extra)).one;
  assert.equal(at({ cad: true, miWithin1y: true }).threshold, 55);
  assert.equal(at({ acsHistory: true }).threshold, 70);
  assert.equal(at({ dm: true }).threshold, 100);
  assert.equal(at({ htn: true, smoking: true }).threshold, 115);   // 2 項風險因子＝中風險
  assert.equal(at({ htn: true }).threshold, 130);                  // 1 項＝低風險
  // 40 歲男性、HDL 未填 → 0 項
  assert.equal(at({}).threshold, 160);
  assert.equal(at({ cad: true, miWithin1y: true }).nonHdlTarget, 85);
  assert.equal(at({ dm: true }).nonHdlTarget, 130);
});

/* 極高風險是「冠心病**合併**什麼」的組合，不是單一旗標——這是人最容易接錯的一步。 */
test('lipidCoverage 表一：極高風險要成對命中，單獨一個條件不算', () => {
  const only = L.lipidCoverage({ sex: 'male', age: 40, ldl: 200, miWithin1y: true });
  assert.notEqual(only.one.level, 'veryhigh', '沒有冠心病時，單獨的一年內 MI 不構成極高風險');
  const pair = L.lipidCoverage({ sex: 'male', age: 40, ldl: 200, cad: true, miWithin1y: true });
  assert.equal(pair.one.level, 'veryhigh');
  assert.deepEqual(pair.one.why, ['冠狀動脈疾病合併一年內曾經歷心肌梗塞']);
  // ACS＋糖尿病是極高；但只有 ACS 是非常高
  assert.equal(L.lipidCoverage({ acsHistory: true, dm: true }).one.level, 'veryhigh');
  assert.equal(L.lipidCoverage({ acsHistory: true }).one.level, 'high');
});

test('lipidCoverage 表一：PAD 單獨不是極高，要合併冠心病或頸動脈狹窄', () => {
  assert.notEqual(L.lipidCoverage({ pad: true }).one.level, 'veryhigh');
  assert.equal(L.lipidCoverage({ pad: true, carotid: true }).one.level, 'veryhigh');
});

test('lipidCoverage 表一：LDL-C ≧ 190 本身就是高風險', () => {
  const r = L.lipidCoverage({ sex: 'male', age: 30, ldl: 195 });
  assert.equal(r.one.level, 'moderate');
  assert.ok(r.one.why.indexOf('LDL-C ≧ 190') >= 0);
});

/* 兩張表的風險因子定義有三處不同，錯一處就換一級。 */
test('lipidRiskFactors：HDL-C 女性表一 < 50、表二 < 40', () => {
  const f = { sex: 'female', age: 30, hdl: 45 };
  assert.ok(L.lipidRiskFactorsNew(f).indexOf('HDL-C < 50') >= 0, '表一女性 45 算低');
  assert.deepEqual(L.lipidRiskFactorsOld(f), [], '表二女性 45 不算低（門檻 40）');
});
test('lipidRiskFactors：「或停經者」只在表二', () => {
  const f = { sex: 'female', age: 48, menopause: true };
  assert.deepEqual(L.lipidRiskFactorsNew(f), [], '表一無「或停經者」');
  assert.deepEqual(L.lipidRiskFactorsOld(f), ['女性 ≧ 55 歲或停經']);
});
test('lipidRiskFactors：代謝症候群只在表一', () => {
  const f = { sex: 'male', age: 30, metabolicSyndrome: true };
  assert.deepEqual(L.lipidRiskFactorsNew(f), ['代謝症候群']);
  assert.deepEqual(L.lipidRiskFactorsOld(f), []);
});

/* 表二：門檻是「LDL 或 TC」兩選一，不是都要達到。 */
test('lipidCoverage 表二：TC 達標即可，不必 LDL 也達標', () => {
  const r = L.lipidCoverage({ sex: 'female', age: 58, ldl: 95, tc: 180, hdl: 55, dm: true });
  assert.equal(r.two.label, '心血管疾病或糖尿病');
  assert.equal(r.two.ldl, 100);
  assert.equal(r.two.tc, 160);
  assert.equal(r.two.meets, true, 'TC 180 ≧ 160 即符合');
  assert.equal(r.one.meets, false, '同一位病人在表一（門檻 100）反而未達——這正是要提醒的落差');
});

test('lipidCoverage 表二：分層由表一的勾選推導，且不含 PAD／CKD', () => {
  // 表二的「心血管疾病」不含 PAD，也不含 CKD
  const pad = L.lipidCoverage({ sex: 'male', age: 30, ldl: 200, padSymptomatic: true });
  assert.equal(pad.two.tier, 'rf0', 'PAD 不落入表二的心血管疾病');
  const ckd = L.lipidCoverage({ sex: 'male', age: 30, ldl: 200, ckd: true });
  assert.equal(ckd.two.tier, 'rf0', 'CKD 不落入表二的心血管疾病');
  // 冠心病與缺血性腦血管疾病才落入
  assert.equal(L.lipidCoverage({ cad: true }).two.tier, 'cvd');
  assert.equal(L.lipidCoverage({ strokeTia: true }).two.tier, 'cvd');
  // ACS／再通術走最上面那一列
  assert.equal(L.lipidCoverage({ revasc: true }).two.tier, 'acs');
  assert.equal(L.lipidCoverage({ revasc: true }).two.ldl, 70);
});

test('lipidCoverage 表二：推導出的分層要附舉證要求（申報時會被查）', () => {
  const r = L.lipidCoverage({ cad: true, ldl: 200 });
  assert.ok(r.two.proof.some((s) => s.indexOf('心導管證實') >= 0));
  const s = L.lipidCoverage({ strokeTia: true, ldl: 200 });
  assert.ok(s.two.proof.some((x) => x.indexOf('神經科醫師') >= 0));
});

/* 「並行 vs 先做 3–6 個月」決定的是今天能不能開藥，比門檻本身更常被搞錯。 */
test('lipidCoverage：極高／非常高／高可並行，中／低／0 項要先做 3–6 個月', () => {
  assert.equal(L.lipidCoverage({ dm: true }).one.parallel, true);
  assert.equal(L.lipidCoverage({ sex: 'male', age: 50, htn: true }).one.parallel, false);
});

/* 表一是主表，但表二仍適用於公告明列「不適用表一」的健保代碼，所以兩張一律都算。 */
test('lipidCoverage：一律回傳兩張表，且判定不再受日期影響', () => {
  const r = L.lipidCoverage({ ldl: 200 });
  assert.ok(r.one && r.two, '兩張表都要算——表二仍適用於公告明列的健保代碼');
  assert.equal(r.tableOneInForce, undefined, '表一的生效日開關已隨新制上路移除');
  /* 負面：塞日期進去也不該改變任何判定（舊版會依 today 換主表）。 */
  const dated = L.lipidCoverage({ ldl: 200, today: '2026-08-31' });
  assert.deepEqual(dated.one, r.one);
  assert.deepEqual(dated.two, r.two);
});

/* Fibrate：兩列的門檻都是 TG ≧ 200，決定要不要先做非藥物治療的是有無心血管疾病／糖尿病。 */
/* 使用者 2026-09-01：「符合的危險因子是什麼要寫出來」。
   畫面上原本只寫「2 個以上危險因子」，醫師得自己回頭再數一次；
   而審查看的正是病歷上寫得出來的那幾項。 */
test('lipidCoverage：靠數因子分層時，要列出是哪幾項', () => {
  const r = L.lipidCoverage({ age: 50, sex: 'male', ldl: 108, hdl: 55, htn: true });
  assert.equal(r.one.label, '中風險');
  const one = r.one.why.join('');
  assert.ok(one.includes('高血壓') && one.includes('男性 ≧ 45 歲'), one);
  assert.ok(one.includes('2 項'), '表一的分級名沒帶項數，why 要帶：' + one);
  // 表二的分層名已經寫了項數，why 只列名字，避免「2 個以上危險因子（依據：危險因子 2 項（…））」
  assert.deepEqual(r.two.why, ['高血壓', '男性 ≧ 45 歲']);
});

test('lipidCoverage：表二每一層都要有依據（原本整塊沒有 why）', () => {
  const dm = L.lipidCoverage({ age: 40, ldl: 120, dm: true });
  assert.equal(dm.two.label, '心血管疾病或糖尿病');
  assert.deepEqual(dm.two.why, ['糖尿病']);

  const cad = L.lipidCoverage({ age: 60, ldl: 120, cad: true, dm: true });
  assert.deepEqual(cad.two.why, ['冠狀動脈粥狀硬化（冠心病）', '糖尿病']);

  const acs = L.lipidCoverage({ age: 60, ldl: 120, acsHistory: true });
  assert.ok(acs.two.why.indexOf('急性冠心症病史') >= 0, acs.two.why);
});

test('lipidCoverage：0 項那一級的名稱本身就是結論，不再重複一次依據', () => {
  const r = L.lipidCoverage({ age: 30, sex: 'female', ldl: 150, hdl: 60 });
  assert.equal(r.one.label, '0 項心血管風險因子');
  assert.deepEqual(r.one.why, []);
  assert.equal(r.two.label, '0 個危險因子');
  assert.deepEqual(r.two.why, []);
});

test('lipidCoverage fibrate：TG 200–499 還要 ratio 或低 HDL', () => {
  const bare = L.lipidCoverage({ tg: 300, tc: 180, hdl: 50 }).fibrate;
  assert.equal(bare.meets, false);
  assert.ok(bare.needs[0].indexOf('TC/HDL-C') >= 0);
  const ratio = L.lipidCoverage({ tg: 300, tc: 260, hdl: 50 }).fibrate;   // 5.2 > 5
  assert.equal(ratio.meets, true);
  const lowHdl = L.lipidCoverage({ tg: 300, tc: 180, hdl: 35 }).fibrate;
  assert.equal(lowHdl.meets, true);
});
test('lipidCoverage fibrate：TG ≧ 500 可單憑 TG，目標改為 < 500', () => {
  const r = L.lipidCoverage({ tg: 600, tc: 180, hdl: 50 }).fibrate;
  assert.equal(r.meets, true);
  assert.equal(r.target, 500);
});
/* 官方表是三列，第三列專門讓「無心血管疾病但 TG ≧ 500」也能直接用藥。
   決定可否並行的是**走哪一列**，不是病人有沒有共病——原本寫成只看共病，
   把第三列整個漏掉（2026-08-27 使用者指出，附官方表影像）。 */
test('lipidCoverage fibrate：TG ≧ 500 那一列不論有無心血管疾病都可並行', () => {
  assert.equal(L.lipidCoverage({ tg: 600 }).fibrate.parallel, true,
    '無心血管疾病、TG 600 → 官方第三列「與藥物治療可並行」');
  assert.equal(L.lipidCoverage({ tg: 600, dm: true }).fibrate.parallel, true);
});
test('lipidCoverage fibrate：TG 200–499 那一列才看有無心血管疾病或糖尿病', () => {
  const bare = L.lipidCoverage({ tg: 300, tc: 180, hdl: 35 }).fibrate;
  assert.equal(bare.meets, true);
  assert.equal(bare.parallel, false, '無心血管疾病 → 給藥前應有 3–6 個月非藥物治療');
  const dm = L.lipidCoverage({ tg: 300, tc: 180, hdl: 35, dm: true }).fibrate;
  assert.equal(dm.parallel, true);
  // 冠心病走推導：使用者勾的是 cad，不是 cvdOld
  assert.equal(L.lipidCoverage({ tg: 300, tc: 180, hdl: 35, cad: true }).fibrate.parallel, true);
});
/* 官方第一列寫「心血管疾病或糖尿病」，但病歷要寫的是這位病人命中的那一個。
   使用者 2026-09-01：只有糖尿病就寫（糖尿病），兩個都有寫（心血管疾病及糖尿病）。 */
/* 代謝症候群是表一 6 項風險因子裡唯一要「數」的，數錯就換一級門檻。
   使用者 2026-09-01 要求拆成細項勾選，所以五取三的邊界要有測試。 */
/* 品項反查。使用者 2026-09-01：「輸入健保代碼 或 商品名 或 學名 然後顯示是適用表一還是表二」。
   資料由呼叫端傳進來（瀏覽器是 window.LIPID_PRODUCTS），所以這裡餵固定樣本，
   不依賴那份會隨健保署每月更新而變的檔案——否則這些測試會在資料更新那天無故變紅。 */
const LIPID_SAMPLE = [
  { code: 'B024129100', en: 'CRESTOR 20MG FILM-COATED TABLETS', zh: '冠脂妥膜衣錠20毫克',
    ingredient: 'ROSUVASTATIN CALCIUM', generic: 'rosuvastatin', section: '2.6.1.', table: 'one' },
  { code: 'BC24129100', en: 'CRESTOR 20MG FILM-COATED TABLETS', zh: '冠脂妥膜衣錠20毫克',
    ingredient: 'ROSUVASTATIN CALCIUM', generic: 'rosuvastatin', section: '2.6.1.', table: 'two' },
  { code: 'B024058100', en: 'EZETROL TABLETS 10MG', zh: '維妥力錠10毫克',
    ingredient: 'EZETIMIBE', generic: 'ezetimibe', section: '2.6.2.', table: '' },
  { code: 'AC46402100', en: 'Simvatin film coating tablets 20mg', zh: '心可穩膜衣錠',
    ingredient: 'SIMVASTATIN', generic: 'simvastatin', section: '2.6.1.', table: 'two' },
];

/* 使用者 2026-09-01：「表一就請寫有給付的品項（商品名跟劑量），
   表二請寫詳細的商品名跟劑量」。縮寫只是為了掃視，**不得改變品項身分**。 */
test('lipidShortName：拿掉劑型字樣，但 XL／OD／廠標與劑量一個都不能掉', () => {
  assert.equal(L.lipidShortName('LIPITOR FILM-COATED TABLETS 10MG'), 'LIPITOR 10MG');
  assert.equal(L.lipidShortName('Roty F.C. Tablets 20mg'), 'Roty 20mg');
  assert.equal(L.lipidShortName('Rotlip film-coated Tablets 10mg'), 'Rotlip 10mg');
  // XL 與 OD 是同名不同品項的關鍵：Lescol XL 80mg 與 Lescol 40mg 不是同一件事
  assert.equal(L.lipidShortName('LESCOL XL FILM-COATED TABLETS 80MG'), 'LESCOL XL 80MG');
  assert.equal(L.lipidShortName('LIVALO OD Tablets 2mg'), 'LIVALO OD 2mg');
  // 廠標決定走哪張表：Tulip"SDZ" 走表一、Tulip 走表二
  assert.equal(L.lipidShortName('Tulip"SDZ" Film Coated Tablet 20mg'), 'Tulip"SDZ" 20mg');
  assert.equal(L.lipidShortName('Caduet 5mg/10mg tablet'), 'Caduet 5mg/10mg');
  // 整個名字就是劑型時不能刪成空字串
  assert.equal(L.lipidShortName('SANCOS TABLETS'), 'SANCOS');
  assert.equal(L.lipidShortName(''), '');
});

/* 類別對品項用表別／章節對應，不是比學名：statin+ezetimibe 複方的成分欄開頭是 statin，
   照學名分會被算進 statin 那一類，但它走的是 2.6.3、有自己的條件。 */
test('lipidProductsForClass：依表別／章節對應，並帶回每一筆的表別', () => {
  const sample = [
    { code: 'A100000001', en: 'Alpha Tablets 10mg', generic: 'atorvastatin',
      section: '2.6.1.', table: 'one', listed: true },
    { code: 'A100000002', en: 'Beta Tablets 20mg', generic: 'atorvastatin',
      section: '2.6.1.', table: 'two', listed: true },
    { code: 'A100000003', en: 'Combo Tablets 10/10mg', generic: 'atorvastatin',
      section: '2.6.3.', table: '', listed: true },
    { code: 'A100000004', en: 'Zet Tablets 10mg', generic: 'ezetimibe',
      section: '2.6.2.', table: '', listed: true },
    { code: 'A100000005', en: 'Dead Tablets 10mg', generic: 'atorvastatin',
      section: '2.6.1.', table: 'one', listed: false },
  ];
  const statin = L.lipidProductsForClass(sample, { tables: ['one', 'two'] });
  assert.deepEqual(statin.map((g) => g.generic), ['atorvastatin']);
  assert.deepEqual(statin[0].items.map((i) => i.table), ['one', 'two'],
    '表一排前面，且每一筆要帶自己的表別');
  assert.deepEqual(statin[0].items.map((i) => i.short), ['Alpha 10mg', 'Beta 20mg'],
    '2.6.3 的複方不算 statin 那一類；已停付的不列');

  const ez = L.lipidProductsForClass(sample, { sections: ['2.6.2', '2.6.3'] });
  assert.deepEqual(ez.map((g) => g.generic).sort(), ['atorvastatin', 'ezetimibe']);

  /* 複方的主成分欄記的是排第一的成分，直接印會騙人（Caduet 記 AMLODIPINE、
     ezetimibe 複方記 statin），所以標籤可以被章節或學名蓋掉。 */
  const relabelled = L.lipidProductsForClass(sample, {
    sections: ['2.6.2', '2.6.3'],
    bySection: { '2.6.3': 'ezetimibe ＋ statin 複方' },
  });
  assert.deepEqual(relabelled.map((g) => g.generic).sort(),
    ['ezetimibe', 'ezetimibe ＋ statin 複方'], '章節標籤蓋過主成分欄');
  const byGeneric = L.lipidProductsForClass(sample, {
    tables: ['one', 'two'], labels: { atorvastatin: 'statin ＋ amlodipine 複方' },
  });
  assert.deepEqual(byGeneric.map((g) => g.generic), ['statin ＋ amlodipine 複方']);
  // 沒有 match 的類別（siRNA、ATP citrate lyase）回空陣列，畫面才會退回學名列
  assert.deepEqual(L.lipidProductsForClass(sample, undefined), []);
  assert.deepEqual(L.lipidProductsForClass(sample, {}), []);
});

test('lipidProductsByTable：只列現行給付中的，依學名分組、多的排前面', () => {
  const sample = [
    { code: 'A100000001', en: 'Alpha Tablets 10mg', generic: 'atorvastatin',
      table: 'one', listed: true },
    { code: 'A100000002', en: 'Beta F.C. Tablets 20mg', generic: 'atorvastatin',
      table: 'one', listed: true },
    { code: 'A100000003', en: 'Gamma Tablets 5mg', generic: 'rosuvastatin',
      table: 'one', listed: true },
    { code: 'A100000004', en: 'Dead Tablets 10mg', generic: 'atorvastatin',
      table: 'one', listed: false },
    { code: 'A100000005', en: 'Other Tablets 10mg', generic: 'simvastatin',
      table: 'two', listed: true },
  ];
  const one = L.lipidProductsByTable(sample, 'one');
  assert.deepEqual(one.map((g) => g.generic), ['atorvastatin', 'rosuvastatin']);
  assert.deepEqual(one[0].items.map((i) => i.short), ['Alpha 10mg', 'Beta 20mg'],
    '已停付的 Dead 不列——把死碼算進去會讓人以為某個學名有一堆選擇');
  assert.equal(one[0].items[0].code, 'A100000001', '要帶代碼，畫面才放得進 title');
  assert.deepEqual(L.lipidProductsByTable(sample, 'two').map((g) => g.generic), ['simvastatin']);
  assert.deepEqual(L.lipidProductsByTable(sample, 'nope'), []);
});

test('lipidFindProducts：代碼要精準命中，太短的字串不搜（免得整份都命中）', () => {
  const hit = L.lipidFindProducts(LIPID_SAMPLE, 'BC24129100', 10);
  assert.equal(hit.exact.code, 'BC24129100');
  assert.equal(hit.total, 1);
  assert.equal(L.lipidFindProducts(LIPID_SAMPLE, 'a', 10).total, 0, '1 個字不搜');
  assert.equal(L.lipidFindProducts(LIPID_SAMPLE, '', 10).total, 0);
});

test('lipidFindProducts：商品名（中英）與學名都查得到，表二排前面', () => {
  const en = L.lipidFindProducts(LIPID_SAMPLE, 'crestor', 10);
  assert.equal(en.total, 2);
  assert.equal(en.hits[0].table, 'two', '表二是例外，要排前面');
  assert.equal(L.lipidFindProducts(LIPID_SAMPLE, '冠脂妥', 10).total, 2, '中文商品名');
  assert.equal(L.lipidFindProducts(LIPID_SAMPLE, 'rosuvastatin', 10).total, 2, '學名');
});

test('lipidFindProducts：截斷要回報，不能靜默只給前幾筆', () => {
  const many = [];
  for (let i = 0; i < 30; i += 1) {
    many.push({ code: 'A' + String(100000000 + i), en: 'Statin ' + i,
      zh: '', ingredient: 'SIMVASTATIN', generic: 'simvastatin',
      section: '2.6.1.', table: 'one' });
  }
  const r = L.lipidFindProducts(many, 'statin', 5);
  assert.equal(r.hits.length, 5);
  assert.equal(r.total, 30, 'total 要是真實筆數，畫面才說得出還有幾筆沒列');
  assert.equal(r.capped, true);
});

test('lipidProductVerdict：同一個商品名，代碼不同就走不同的表、結論可以相反', () => {
  // 極高風險（表一門檻 55）、心血管疾病（表二門檻 100），LDL-C 75 落在兩者之間
  const cov = L.lipidCoverage({ age: 62, sex: 'male', ldl: 75, cad: true, miWithin1y: true });
  const one = L.lipidProductVerdict(LIPID_SAMPLE[0], cov);
  const two = L.lipidProductVerdict(LIPID_SAMPLE[1], cov);
  assert.equal(one.tableLabel, '表一');
  assert.equal(one.threshold, 55);
  assert.equal(one.meets, true);
  assert.equal(two.tableLabel, '表二');
  assert.equal(two.threshold, 100);
  assert.equal(two.meets, false);
});

test('lipidProductVerdict：2.6.2／2.6.3／2.6.4 的品項不猜表別', () => {
  const cov = L.lipidCoverage({ age: 62, ldl: 200 });
  const v = L.lipidProductVerdict(LIPID_SAMPLE[2], cov);
  assert.equal(v.table, '');
  assert.equal(v.meets, null);
  assert.ok(v.note.indexOf('2.6.2') >= 0, v.note);
});

test('lipidProductVerdict：沒有病人資料時只回表別，不下判定', () => {
  const v = L.lipidProductVerdict(LIPID_SAMPLE[1], null);
  assert.equal(v.tableLabel, '表二');
  assert.equal(v.meets, null);
  assert.equal(v.threshold, null, '分級未定，門檻也未定——不能印 null 給人看');
});

test('lipidSummarize：依學名彙總，鹽類寫法不同不該拆成好幾堆', () => {
  const sum = L.lipidSummarize(LIPID_SAMPLE);
  const rosu = sum.filter((s) => s.ingredient === 'rosuvastatin')[0];
  assert.deepEqual({ one: rosu.one, two: rosu.two }, { one: 1, two: 1 });
});

test('lipidMetabolic：五取三，兩項不算、三項才算', () => {
  assert.equal(L.lipidMetabolic({ msWaist: true, msBp: true }).meets, false);
  const three = L.lipidMetabolic({ msWaist: true, msBp: true, msGlucose: true });
  assert.equal(three.meets, true);
  assert.equal(three.count, 3);
  assert.deepEqual(three.hit, ['腹部肥胖', '血壓偏高', '空腹血糖偏高']);
  assert.equal(L.lipidMetabolic({}).meets, false);
  assert.equal(L.lipidMetabolic(null).meets, false);
});

test('lipidMetabolic：舊的 metabolicSyndrome 布林仍然算數（呼叫端可直接宣告）', () => {
  const r = L.lipidMetabolic({ metabolicSyndrome: true });
  assert.equal(r.meets, true);
  assert.equal(r.declared, true);
  assert.equal(r.count, 0, '直接宣告時沒有細項可列');
});

test('lipidCoverage：代謝症候群滿三項才進風險因子，且帶項數不帶巢狀括號', () => {
  const two = L.lipidCoverage({ age: 50, sex: 'male', ldl: 150, hdl: 55,
    msWaist: true, msBp: true });
  assert.equal(two.riskFactorsNew.indexOf('代謝症候群 2 項'), -1);
  assert.ok(two.riskFactorsNew.every((f) => f.indexOf('代謝症候群') < 0), two.riskFactorsNew);

  const three = L.lipidCoverage({ age: 50, sex: 'male', ldl: 150, hdl: 55,
    msWaist: true, msBp: true, msGlucose: true });
  assert.ok(three.riskFactorsNew.indexOf('代謝症候群 3 項') >= 0, three.riskFactorsNew);
  assert.equal(three.one.label, '中風險', '多了一項風險因子就從低風險升到中風險');
  // 表二那 5 項沒有代謝症候群，不得跟著跑進去
  assert.ok(three.two.riskFactors.every((f) => f.indexOf('代謝症候群') < 0), three.two.riskFactors);
});

test('lipidCoverage fibrate：並行理由要指名是心血管疾病、糖尿病、還是兩者', () => {
  const base = { tg: 325, tc: 325, hdl: 52 };          // TC/HDL-C 6.25 > 5，走 TG 200–499
  assert.deepEqual(
    L.lipidCoverage(Object.assign({ dm: true }, base)).fibrate.parallelWhy, ['糖尿病']);
  assert.deepEqual(
    L.lipidCoverage(Object.assign({ cad: true }, base)).fibrate.parallelWhy, ['心血管疾病']);
  assert.deepEqual(
    L.lipidCoverage(Object.assign({ strokeTia: true }, base)).fibrate.parallelWhy,
    ['心血管疾病'], '缺血性中風也是表二定義的心血管疾病');
  assert.deepEqual(
    L.lipidCoverage(Object.assign({ cad: true, dm: true }, base)).fibrate.parallelWhy,
    ['心血管疾病', '糖尿病'], '兩個都有就兩個都寫，順序固定');
  const none = L.lipidCoverage(base).fibrate;
  assert.equal(none.parallel, false);
  assert.deepEqual(none.parallelWhy, []);
});

test('lipidCoverage fibrate：沒填 TG 就不判定（不猜）', () => {
  assert.equal(L.lipidCoverage({ ldl: 200 }).fibrate.ok, false);
});

test('lipidCoverage：沒填 LDL-C 時 meets 回 null，不當成「不符合」', () => {
  const r = L.lipidCoverage({ dm: true });
  assert.equal(r.one.meets, null);
  assert.equal(r.two.meets, null);
  assert.equal(r.one.threshold, 100, '分級仍算得出來，只是沒有數值可比');
});
test('lipidCoverage：空值與非物件吃得下，不丟例外', () => {
  for (const v of [undefined, null, {}, 'x', 42]) {
    const r = L.lipidCoverage(v);
    assert.equal(r.ok, true);
    assert.ok(r.one && r.two);
  }
});

/* 院內收費代碼（build 期由 hospital_lipid_codes.json merge 到品項的 hosp 欄位）。
   診間畫面上醫師看到的是這個，不是健保代碼。 */
const HOSP_SAMPLE = [
  { code: 'BC24129100', en: 'CRESTOR 20MG FILM-COATED TABLETS', zh: '冠脂妥膜衣錠20毫克',
    ingredient: 'ROSUVASTATIN CALCIUM', generic: 'rosuvastatin', section: '2.6.1.',
    table: 'two', listed: true, hosp: ['OCRE20'] },
  { code: 'BC24131100', en: 'CRESTOR 10MG FILM-COATED TABLETS', zh: '冠脂妥膜衣錠10毫克',
    ingredient: 'ROSUVASTATIN CALCIUM', generic: 'rosuvastatin', section: '2.6.1.',
    table: 'one', listed: true, hosp: ['OCRE', 'POCRE'] },
  { code: 'BC22889100', en: 'LIPITOR FILM-COATED TABLETS 40MG', zh: '立普妥膜衣錠40毫克',
    ingredient: 'ATORVASTATIN CALCIUM', generic: 'atorvastatin', section: '2.6.1.',
    table: 'one', listed: true, hosp: ['POLIP4'] },
  { code: 'AC59251100', en: 'Agitin Tablets 10/20mg', zh: '愛脂婷錠10/20毫克',
    ingredient: 'EZETIMIBE', generic: 'ezetimibe', section: '2.6.3.',
    table: '', listed: true, hosp: ['OAGI'] },
  { code: 'AC99999100', en: 'Notinhouse Tablets 10mg', zh: '院外品項',
    ingredient: 'SIMVASTATIN', generic: 'simvastatin', section: '2.6.1.',
    table: 'one', listed: true },
];

test('lipidFindProducts：打院內收費代碼要精準命中', () => {
  const r = L.lipidFindProducts(HOSP_SAMPLE, 'POLIP4', 10);
  assert.equal(r.exact && r.exact.code, 'BC22889100', '收費代碼要走 exact，不是混在模糊結果裡');
  assert.equal(r.exact.table, 'one');
});

test('lipidFindProducts：院內代碼精準命中優先於前綴相同的另一支', () => {
  /* OCRE 是 OCRE20 的前綴。打 OCRE 要拿到 CRESTOR 10mg（表一），
     不能被 OCRE20（表二）搶走——兩支的表別剛好相反，選錯就是核刪。 */
  const r = L.lipidFindProducts(HOSP_SAMPLE, 'OCRE', 10);
  assert.equal(r.exact && r.exact.code, 'BC24131100');
  assert.equal(r.exact.table, 'one');
  const r20 = L.lipidFindProducts(HOSP_SAMPLE, 'OCRE20', 10);
  assert.equal(r20.exact && r20.exact.code, 'BC24129100');
  assert.equal(r20.exact.table, 'two');
});

test('lipidFindProducts：院內代碼小寫也要命中', () => {
  assert.equal(L.lipidFindProducts(HOSP_SAMPLE, 'polip4', 10).exact.code, 'BC22889100');
});

test('lipidHospitalByTable：只列院內有的，依表別分組', () => {
  const g = L.lipidHospitalByTable(HOSP_SAMPLE);
  assert.deepEqual(g.one.map((r) => r.hosp), ['OCRE', 'POCRE', 'POLIP4'],
    '同一健保代碼的多個收費代碼要各自成列——診間打的是收費代碼');
  assert.deepEqual(g.two.map((r) => r.hosp), ['OCRE20']);
  assert.deepEqual(g.other.map((r) => r.hosp), ['OAGI'], '2.6.3 複方不歸表一表二');
  const all = [...g.one, ...g.two, ...g.other].map((r) => r.code);
  assert.ok(!all.includes('AC99999100'), '沒有 hosp 的品項不該出現在院內清單');
});

test('lipidHospitalByTable：每列帶得回健保代碼與品名，才能接既有的判定', () => {
  const row = L.lipidHospitalByTable(HOSP_SAMPLE).one.find((r) => r.hosp === 'POLIP4');
  assert.equal(row.code, 'BC22889100');
  assert.equal(row.generic, 'atorvastatin');
  assert.ok(row.short && row.short.length, '要有縮寫名供掃視');
});

test('lipidProductVerdict：帶回院內收費代碼，畫面才印得出診間打的那個碼', () => {
  const p = HOSP_SAMPLE.find((x) => x.code === 'BC24131100');
  const v = L.lipidProductVerdict(p, null);
  assert.deepEqual(v.hosp, ['OCRE', 'POCRE']);
  const none = L.lipidProductVerdict(HOSP_SAMPLE.find((x) => x.code === 'AC99999100'), null);
  assert.deepEqual(none.hosp, [], '院內沒有的品項回空陣列，不是 undefined');
});
