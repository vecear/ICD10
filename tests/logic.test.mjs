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
