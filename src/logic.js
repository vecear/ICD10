/* 純邏輯層：瀏覽器掛 window.ICDLogic；node 供測試 require。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ICDLogic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function buildIndex(db, curatedCodes) {
    const nodot = new Array(db.length);
    const lowerEn = new Array(db.length);
    const byCode = new Map();
    for (let i = 0; i < db.length; i++) {
      nodot[i] = db[i][0].replace('.', '');
      lowerEn[i] = db[i][2].toLowerCase();
      byCode.set(db[i][0], db[i]);
    }
    return { db, nodot, lowerEn, byCode, curatedCodes: curatedCodes || new Set() };
  }

  // 回傳的陣列另帶 total（截斷前的命中總數），供 UI 顯示「共 N 筆，顯示前 M 筆」。
  function withTotal(rows, total) {
    rows.total = total;
    return rows;
  }

  function search(index, query, limit) {
    limit = limit || 50;
    const q = (query || '').trim();
    if (q.length < 2) return withTotal([], 0);
    const out = [];
    const seen = new Set();
    const ranks = new Map();
    const { db, nodot, lowerEn, curatedCodes } = index;
    const ql = q.toLowerCase();
    const isCode = /^[a-z][0-9a-z.]*$/i.test(q);   // 像代碼：先做代碼前綴
    const qc = isCode ? q.toUpperCase().replace(/\./g, '') : '';
    // 命中層級：0 完全相符、1 開頭相符、2 其他（僅作為「精選碼優先」之後的次要排序）
    const rankOf = (i) => {
      if ((isCode && nodot[i] === qc) || db[i][3] === q || lowerEn[i] === ql) return 0;
      if ((isCode && nodot[i].startsWith(qc)) || db[i][3].startsWith(q) || lowerEn[i].startsWith(ql)) return 1;
      return 2;
    };
    const push = (i) => {
      const row = db[i];
      if (seen.has(row[0])) return;
      seen.add(row[0]);
      ranks.set(row[0], rankOf(i));
      out.push(row);
    };
    if (isCode) {
      for (let i = 0; i < db.length; i++)
        if (nodot[i].startsWith(qc)) push(i);
    }
    for (let i = 0; i < db.length; i++)
      if (lowerEn[i].includes(ql) || db[i][3].includes(q)) push(i);
    // 人工精選（門診常用）碼優先顯示，其次依命中層級，同層級維持原順序（穩定排序）
    out.sort((a, b) =>
      ((curatedCodes.has(b[0]) ? 1 : 0) - (curatedCodes.has(a[0]) ? 1 : 0))
      || (ranks.get(a[0]) - ranks.get(b[0])));
    return withTotal(out.slice(0, limit), out.length);
  }

  function family(index, code, limit) {
    limit = limit || 20;
    const cat = code.slice(0, 3);
    const out = [];
    for (const row of index.db) {
      if (row[1] === 1 && row[0] !== code && row[0].slice(0, 3) === cat) {
        out.push(row);
        if (out.length >= limit) break;
      }
    }
    return out;
  }

  function formatCart(items, fmt) {
    if (fmt === 'comma') return items.map(x => x.code).join(',');
    if (fmt === 'names') return items.map(x => x.code + '\t' + x.zh).join('\n');
    return items.map(x => x.code).join('\n');
  }

  function mergeRelated(base, extra) {
    const out = [];
    const seen = new Set();
    for (const code of [...(base || []), ...(extra || [])]) {
      if (!seen.has(code)) {
        seen.add(code);
        out.push(code);
      }
    }
    return out;
  }

  /* HIS 的民國日期（115-08-13）。民國元年＝西元 1912 年，所以減 1911。
     月日補零：HIS 欄位是定長格式，8 月寫成 8 會對不齊。
     參數只為了測試能餵固定日期；平常不傳，用當下時間。 */
  function rocDate(date) {
    const d = date || new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return (d.getFullYear() - 1911) + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /* ── 慢病速查的時效篩選（純函式，node 可直接測） ─────────────────────────
     給付規定與 ICD 代碼最大的不同：代碼可以逐碼比對官方全庫、錯了就建置失敗；
     給付規定沒有這種驗證，只能靠資料自帶的生效日決定「今天該顯示哪一版」。

     一條的適用區間是 [effectiveFrom, effectiveTo]，兩端都**含當日**，兩個欄位都可省略
     （省略＝該端無限）。日期一律 YYYY-MM-DD，字串字典序即時間序，不必解析成 Date
     （少一層時區坑：`new Date('2026-09-01')` 是 UTC 午夜，台北時間會早一天翻版）。

     回傳三分：
       current   今天適用，正常顯示
       upcoming  已公告、尚未生效（from > today）——**必須讓醫師看得到**「新版將於 X 日生效」，
                 這是換版前後兩週最容易開錯單的時間點，藏起來等於製造一個定時陷阱
       expired   已過期（to < today），不顯示（只回傳供測試與除錯確認確實被濾掉） */
  function splitByEffective(items, today) {
    const current = [];
    const upcoming = [];
    const expired = [];
    const day = typeof today === 'string' ? today : '';
    for (const item of items || []) {
      if (!item || typeof item !== 'object') continue;
      const from = typeof item.effectiveFrom === 'string' ? item.effectiveFrom : '';
      const to = typeof item.effectiveTo === 'string' ? item.effectiveTo : '';
      if (day && to && to < day) expired.push(item);
      else if (day && from && from > day) upcoming.push(item);
      else current.push(item);
    }
    return { current, upcoming, expired };
  }

  /* 把一段條文拆成「一條一行」。
     給付條文常是四五個並列條件連在一起，在 176px 的側掛窄欄裡就是一面文字牆，
     要逐字讀才找得到自己要的那一句。

     切「。」也切「；」。分號在健保條文裡幾乎都是**另一個適用條件**的界線，
     不是句內修飾——「起始門檻：ACS／PCI／CABG 病史 LDL-C ≧ 70；心血管疾病或糖尿病 ≧ 100」
     是兩條各自成立的門檻，接在一起讀就得自己在腦中拆一次。
     （2026-08-26 使用者指定改的：原本刻意不切分號，實際使用後判定讀不動。）

     括號內的分號不切：那是括號這個單位內部的結構，切了會把括號拆成兩半。
     目前資料裡是 0 個，這是給日後新增內容的保險。

     終止符留在該段尾端，接回去等於原文（只差段間空白）——條文是臨床依據，
     少一個字都不行，E2E 也直接拿 textContent 比對資料檔。 */
  const SPLIT_OPEN = '（(【〔[';
  const SPLIT_CLOSE = '）)】〕]';
  function splitSentences(text) {
    const src = typeof text === 'string' ? text : '';
    const out = [];
    let buf = '';
    let depth = 0;
    for (const ch of src) {
      buf += ch;
      if (SPLIT_OPEN.indexOf(ch) >= 0) depth += 1;
      else if (SPLIT_CLOSE.indexOf(ch) >= 0) depth = Math.max(0, depth - 1);
      else if (ch === '。' || (ch === '；' && depth === 0)) {
        const line = buf.trim();
        if (line) out.push(line);
        buf = '';
      }
    }
    const tail = buf.trim();
    if (tail) out.push(tail);          // 沒有終止符結尾的殘句照樣要顯示，不能吞掉
    return out;
  }

  /* 一段條文開頭的「短標：」——「起始門檻：」「篩檢：」「族群目標：」「Fibrate：」。
     65 條主文有 18 條、補充有 39 條是這個形狀，而它正是醫師掃視時要找的那個詞。
     切出來讓畫面能把它標重，**不佔任何額外行高**，是這個面板性價比最高的一刀。

     只認「短且乾淨」的前導標：≤ 18 字、其間不得有別的標點。
     18 這個數字是量出來的，不是猜的：條文裡的標籤常含英文藥名與條號（「2.6.2 ezetimibe：」
     15 字、「TZD／DPP-4i／SGLT2i：」17 字），字數吃得比中文快；放到 20 以上就開始把
     整句話當標籤抓（「指引目標與健保門檻落差最大的就是 PCSK9：」22 字），標重了整行
     都在發亮，等於沒標。「evolocumab（Repatha）與 alirocumab（Praluent）：」33 字，
     那不是標籤而是主詞，兩端都排除掉。
     全形冒號才算；半形冒號在條文裡是時間與比值（1:1、8:00）。

     回傳 { lead, rest }，lead 為 '' 表示沒有前導標。lead + rest 恆等於原字串。 */
  const LEAD_STOP = '，。；、（）()';
  function splitLead(text) {
    const src = typeof text === 'string' ? text : '';
    const at = src.indexOf('：');
    if (at <= 0 || at > 18) return { lead: '', rest: src };
    for (const ch of src.slice(0, at)) {
      if (LEAD_STOP.indexOf(ch) >= 0) return { lead: '', rest: src };
    }
    return { lead: src.slice(0, at + 1), rest: src.slice(at + 1) };
  }

  /* ── Cockcroft-Gault 肌酸酐廓清率（純函式，node 可直接測） ─────────────────
     用途是抗生素劑量調整，所以「用哪個體重」比公式本身更容易出錯——這裡完全照
     MDCalc 的規格（Brown et al／Winter et al）依 BMI 選，不自己發明：

       CrCl (mL/min) = (140 − 年齡) × 體重(kg) × (女性 0.85) / (72 × Cr(mg/dL))
       IBW(Devine)   男 50 + 2.3 ×(身高吋 − 60)；女 45.5 + 2.3 ×(身高吋 − 60)
       AdjBW         IBW + 0.4 ×(實際體重 − IBW)

       BMI < 18.5     用實際體重（不調整）
       BMI 18.5–24.9  用理想體重，範圍另一端用實際體重
       BMI ≥ 25       用調整體重，範圍另一端用理想體重

     沒有身高就算不出 BMI／IBW，只能退回實際體重——那正是這個公式在體重極端時
     最不準的情形，所以回傳 basis 讓畫面明講「這個數字是用什麼體重算的」。

     回傳 ok:false 時 reason 說明缺什麼；不回傳 NaN，也不猜使用者的意思。 */
  function creatinineClearance(input) {
    const raw = input || {};
    const num = (v) => {
      if (v === '' || v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const age = num(raw.age);
    const weight = num(raw.weightKg);
    const scr = num(raw.creatinine);
    const height = num(raw.heightCm);
    const female = raw.sex === 'female';

    const missing = [];
    if (age === null || age <= 0 || age > 120) missing.push('age');
    if (weight === null || weight <= 0 || weight > 400) missing.push('weight');
    if (scr === null || scr <= 0 || scr > 30) missing.push('creatinine');
    if (missing.length) return { ok: false, missing };

    const q = female ? 0.85 : 1;
    const crclFor = (kg) => ((140 - age) * kg * q) / (72 * scr);

    const hasHeight = height !== null && height > 0 && height <= 250;
    let ibw = null;
    let adjbw = null;
    let bmi = null;
    if (hasHeight) {
      const inches = height / 2.54;
      ibw = (female ? 45.5 : 50) + 2.3 * (inches - 60);
      if (ibw < 1) ibw = null;                  // 極矮身高會讓 Devine 算出負值，那不是體重
      if (ibw !== null) adjbw = ibw + 0.4 * (weight - ibw);
      const m = height / 100;
      bmi = weight / (m * m);
    }

    /* 選體重。沒身高（或 Devine 失效）時只能用實際體重，並在 basis 標明——
       畫面要據此提醒「填身高才會依 BMI 自動選用理想／調整體重」。 */
    let basis = 'actual';
    let rangeBasis = null;
    if (ibw !== null && bmi !== null) {
      if (bmi < 18.5) basis = 'actual';
      else if (bmi < 25) { basis = 'ideal'; rangeBasis = 'actual'; }
      else { basis = 'adjusted'; rangeBasis = 'ideal'; }
    }
    const weightOf = (key) => (key === 'ideal' ? ibw : key === 'adjusted' ? adjbw : weight);

    const round1 = (n) => Math.round(n * 10) / 10;
    const result = {
      ok: true,
      crcl: round1(crclFor(weightOf(basis))),
      basis,
      weightUsed: round1(weightOf(basis)),
      actual: round1(crclFor(weight)),
      ibw: ibw === null ? null : round1(ibw),
      adjbw: adjbw === null ? null : round1(adjbw),
      bmi: bmi === null ? null : round1(bmi),
      hasHeight,
    };
    result.ideal = ibw === null ? null : round1(crclFor(ibw));
    result.adjusted = adjbw === null ? null : round1(crclFor(adjbw));
    result.range = rangeBasis ? round1(crclFor(weightOf(rangeBasis))) : null;
    result.rangeBasis = rangeBasis;
    return result;
  }

  /* ── 降血脂給付試算（純函式，node 可直接測） ──────────────────────────────
     為什麼要有這個：LIPID 的給付判定是這份速查裡最容易算錯的一塊，錯的方式有三種——
       1. 用錯表：表一（ASCVD 風險分級）是主表，表二只適用公告明列「不適用表一」的健保代碼
       2. 風險分級接錯：極高／非常高不是看單一條件，是看「冠心病**合併**什麼」的組合
       3. 危險因子數錯：兩張表的定義不同（表一 6 項含代謝症候群、HDL-C 女性 < 50；
          表二 5 項含「或停經者」、HDL-C 男女同為 < 40）
     這三件事都是機械判斷，正是計算機該接手的部分。

     依據：藥品給付規定 第二節 2.6.1 表一與表二（115.8.21 版官方 .docx 逐條核對，2026-08-26）。

     **這個函式只回報「條文怎麼算」，不做臨床建議**：回傳一定帶 why（判定理由），
     讓醫師能自己覆核每一步，而不是看一個「符合／不符合」的黑箱。 */

  /* 表一：ASCVD 風險等級 → 起始門檻＝目標值，non-HDL-C 目標為各加 30。
     parallel＝可與藥物治療並行；false 則給藥前應有 3–6 個月生活型態改變。 */
  const LIPID_ONE = [
    { level: 'veryhigh', label: '極高風險', ldl: 55, nonHdl: 85, parallel: true },
    { level: 'high', label: '非常高風險', ldl: 70, nonHdl: 100, parallel: true },
    { level: 'moderate', label: '高風險', ldl: 100, nonHdl: 130, parallel: true },
    { level: 'mid', label: '中風險', ldl: 115, nonHdl: 145, parallel: false },
    { level: 'low', label: '低風險', ldl: 130, nonHdl: 160, parallel: false },
    { level: 'none', label: '0 項心血管風險因子', ldl: 160, nonHdl: null, parallel: false },
  ];

  const lipBool = (v) => v === true;

  /* 表一的風險分級。順序即優先序，命中最高的那一級就停。
     極高與非常高刻意寫成「組合」而不是單一旗標——原文就是這樣定義的，
     攤平成單一 checkbox 等於把最容易錯的那一步推回給使用者。 */
  function lipidRiskLevel(c) {
    const veryHigh = [];
    if (lipBool(c.cad) && lipBool(c.miWithin1y)) veryHigh.push('冠狀動脈疾病合併一年內曾經歷心肌梗塞');
    if (lipBool(c.cad) && lipBool(c.mi2plus)) veryHigh.push('冠狀動脈疾病合併 ≧ 2 次心肌梗塞病史');
    if (lipBool(c.cad) && lipBool(c.multivessel)) veryHigh.push('冠狀動脈疾病合併多支冠狀動脈阻塞');
    if (lipBool(c.acsHistory) && lipBool(c.dm)) veryHigh.push('急性冠心症合併糖尿病');
    if (lipBool(c.cad) && (lipBool(c.pad) || lipBool(c.carotid))) {
      veryHigh.push('冠狀動脈疾病合併周邊動脈疾病或頸動脈狹窄');
    }
    if (lipBool(c.pad) && (lipBool(c.cad) || lipBool(c.carotid))) {
      veryHigh.push('周邊動脈疾病合併冠狀動脈疾病或頸動脈狹窄');
    }
    if (veryHigh.length) return { level: 'veryhigh', why: veryHigh };

    const high = [];
    if (lipBool(c.acsHistory)) high.push('急性冠心症病史');
    if (lipBool(c.revasc)) high.push('接受血管再通術');
    if (lipBool(c.strokeTia)) high.push('缺血性中風／TIA 合併動脈硬化相關疾病或病史');
    if (lipBool(c.padSymptomatic)) high.push('症狀性周邊動脈疾病');
    if (lipBool(c.imaging50)) high.push('影像確認 ≧ 50% 直徑狹窄');
    if (high.length) return { level: 'high', why: high };

    const mod = [];
    if (lipBool(c.dm)) mod.push('糖尿病');
    if (lipBool(c.ckd)) mod.push('未透析慢性腎臟病');
    if (lipBool(c.cac400)) mod.push('冠狀動脈鈣化分數 ≧ 400');
    const ldl = Number(c.ldl);
    if (Number.isFinite(ldl) && ldl >= 190) mod.push('LDL-C ≧ 190');
    if (mod.length) return { level: 'moderate', why: mod };

    /* 分級是靠「數因子」得來的時候，要寫出**是哪幾項**——只寫「2 項」等於要醫師
       自己回頭再數一次，而審查看的正是病歷上寫得出來的那幾項（使用者 2026-09-01）。 */
    const names = Array.isArray(c.riskFactorNamesNew) ? c.riskFactorNamesNew : [];
    const n = names.length || c.riskFactorCountNew || 0;
    /* 依據在畫面上會被包成「（依據：…）」，所以這裡不要再自帶括號，否則變成套疊。
       表一的分級名（中／低風險）看不出項數，所以項數留在這裡；名稱用冒號接。 */
    const detail = names.length ? '：' + names.join('、') : '';
    if (n >= 2) return { level: 'mid', why: ['心血管風險因子 ' + n + ' 項' + detail] };
    if (n === 1) return { level: 'low', why: ['心血管風險因子 1 項' + detail] };
    /* 0 項那一級的名稱本身就是結論，再寫一次「無心血管風險因子」是同義反覆。 */
    return { level: 'none', why: [] };
  }

  /* 代謝症候群是「五取三」的複合判準，也是表一 6 項風險因子裡**唯一要自己數的**——
     數錯就換一級門檻，正是計算機該接手的機械判斷（使用者 2026-09-01 要求拆成細項勾選）。
     細項逐字照官方「心血管風險因子定義」第六項。

     舊的 metabolicSyndrome 布林保留：呼叫端可以直接說「就是有」而不逐項勾，
     既有測試與外部呼叫不會因為這次拆分而失效。 */
  const LIPID_MS_ITEMS = [
    ['msWaist', '腹部肥胖'],
    ['msBp', '血壓偏高'],
    ['msGlucose', '空腹血糖偏高'],
    ['msTg', '空腹 TG 偏高'],
    ['msHdl', 'HDL-C 偏低'],
  ];

  function lipidMetabolic(c) {
    const src = c || {};
    const hit = LIPID_MS_ITEMS.filter((r) => lipBool(src[r[0]])).map((r) => r[1]);
    const declared = lipBool(src.metabolicSyndrome);
    return { hit, count: hit.length, declared, meets: declared || hit.length >= 3 };
  }

  /* 表一 6 項風險因子。年齡與 HDL-C 由數值自動判定，其餘勾選。 */
  function lipidRiskFactorsNew(c) {
    const hit = [];
    const female = c.sex === 'female';
    const age = Number(c.age);
    const hdl = Number(c.hdl);
    if (lipBool(c.htn)) hit.push('高血壓');
    if (Number.isFinite(age) && (female ? age >= 55 : age >= 45)) {
      hit.push(female ? '女性 ≧ 55 歲' : '男性 ≧ 45 歲');
    }
    if (lipBool(c.familyHistory)) hit.push('早發性冠心病家族史');
    if (Number.isFinite(hdl) && hdl < (female ? 50 : 40)) {
      hit.push('HDL-C < ' + (female ? 50 : 40));
    }
    if (lipBool(c.smoking)) hit.push('抽菸');
    /* 命中時帶上項數（「代謝症候群 3 項」）而不是列出細項：這個名稱會被包進
       「風險因子 2 項（…、…）」裡，再套一層括號就變成巢狀，讀起來像是兩層清單。
       是哪三項在表單上勾著、看得見，不必在這裡再抄一次。 */
    const ms = lipidMetabolic(c);
    if (ms.meets) hit.push('代謝症候群' + (ms.count ? ' ' + ms.count + ' 項' : ''));
    return hit;
  }

  /* 表二 5 項危險因子。與表一的三處差異都在這裡：多了「或停經者」、
     HDL-C 男女同為 < 40、沒有代謝症候群。 */
  function lipidRiskFactorsOld(c) {
    const hit = [];
    const female = c.sex === 'female';
    const age = Number(c.age);
    const hdl = Number(c.hdl);
    if (lipBool(c.htn)) hit.push('高血壓');
    if ((Number.isFinite(age) && (female ? age >= 55 : age >= 45))
        || (female && lipBool(c.menopause))) {
      hit.push(female ? '女性 ≧ 55 歲或停經' : '男性 ≧ 45 歲');
    }
    if (lipBool(c.familyHistory)) hit.push('早發性冠心病家族史');
    if (Number.isFinite(hdl) && hdl < 40) hit.push('HDL-C < 40');
    if (lipBool(c.smoking)) hit.push('抽菸');
    return hit;
  }

  /* 表二的兩個分層條件，由表一那組勾選推導出來——不另外要使用者再勾一次，
     那只會製造兩份互相矛盾的輸入。對應關係取自表二原文的定義：

       ACS／PCI／CABG 之冠狀動脈粥狀硬化 ← 急性冠心症病史，或接受血管再通術
       心血管疾病（表二定義）           ← 冠狀動脈粥狀硬化（冠心病），或
                                        缺血型腦血管疾病（缺血性中風／TIA／症狀性頸動脈狹窄）

     **表二的「心血管疾病」不含 PAD、不含 CKD**（表一才含），所以這裡刻意不接 pad／ckd。
     推導出來的分層另帶舉證要求：表二對冠狀動脈粥狀硬化要求「心導管證實或缺氧性
     心電圖變化或負荷試驗陽性（附檢查報告）」，TIA 與症狀性頸動脈狹窄須神經科醫師確立。
     這些是申報時才會被查的東西，所以要回報出來而不是默默假設已經有。 */
  function lipidTwoFlags(c) {
    const acs = lipBool(c.acsPciCabg) || lipBool(c.acsHistory) || lipBool(c.revasc);
    const cvd = lipBool(c.cvdOld) || lipBool(c.cad) || lipBool(c.strokeTia) || lipBool(c.carotid);
    /* 觸發的是哪一項要回報出來：表二的分層名稱（如「心血管疾病或糖尿病」）本身
       看不出這位病人是憑什麼落在那一層，而那正是病歷上要寫的東西。 */
    const acsWhy = [];
    if (lipBool(c.acsHistory)) acsWhy.push('急性冠心症病史');
    if (lipBool(c.revasc) || lipBool(c.acsPciCabg)) acsWhy.push('接受血管再通術 PCI／CABG');
    const cvdWhy = [];
    if (lipBool(c.cad)) cvdWhy.push('冠狀動脈粥狀硬化（冠心病）');
    if (lipBool(c.strokeTia)) cvdWhy.push('缺血性中風／TIA');
    if (lipBool(c.carotid)) cvdWhy.push('症狀性頸動脈狹窄');
    const proof = [];
    if (lipBool(c.cad) || lipBool(c.acsHistory)) {
      proof.push('冠狀動脈粥狀硬化之診斷依據：心導管證實、缺氧性心電圖變化或負荷試驗陽性反應報告');
    }
    if (lipBool(c.strokeTia) || lipBool(c.carotid)) {
      proof.push('暫時性腦缺血發作與症狀性頸動脈狹窄之診斷須由神經科醫師確立');
    }
    return { acs, cvd, proof, acsWhy, cvdWhy };
  }

  /* 表二分層。它的「心血管疾病」定義比表一窄：只含冠狀動脈粥狀硬化與
     缺血型腦血管疾病，**不含 PAD、不含 CKD**——最常被拿表一的印象去套錯。 */
  function lipidTableTwo(c, oldNames) {
    /* 每一層都回 why：分層名稱（如「2 個以上危險因子」）看不出這位病人憑什麼落在那一層，
       而審查看的正是病歷上寫得出來的那幾項（使用者 2026-09-01 指出）。 */
    const names = Array.isArray(oldNames) ? oldNames : [];
    const oldCount = names.length;

    if (lipBool(c.acsPciCabg)) {
      return { tier: 'acs', label: 'ACS 病史／PCI／CABG 之冠狀動脈粥狀硬化',
               why: (c.acsWhy && c.acsWhy.length) ? c.acsWhy.slice() : [],
               ldl: 70, tc: null, target: 70, targetTc: null, parallel: true };
    }
    if (lipBool(c.cvdOld) || lipBool(c.dm)) {
      const why = (c.cvdWhy && c.cvdWhy.length) ? c.cvdWhy.slice() : [];
      if (lipBool(c.dm)) why.push('糖尿病');
      return { tier: 'cvd', label: '心血管疾病或糖尿病', why, ldl: 100, tc: 160,
               target: 100, targetTc: 160, parallel: true };
    }
    if (oldCount >= 2) {
      /* 分層名稱已經寫了項數，why 只列是哪幾項——否則畫面會變成
         「2 個以上危險因子（依據：危險因子 2 項（男性 ≧ 45 歲…））」。 */
      return { tier: 'rf2', label: '2 個以上危險因子', why: names.slice(),
               ldl: 130, tc: 200, target: 130, targetTc: 200, parallel: false };
    }
    if (oldCount === 1) {
      return { tier: 'rf1', label: '1 個危險因子', why: names.slice(),
               ldl: 160, tc: 240, target: 160, targetTc: 240, parallel: false };
    }
    return { tier: 'rf0', label: '0 個危險因子', why: [],
             ldl: 190, tc: null, target: 190, targetTc: null, parallel: false };
  }

  /* Fibrate（降三酸甘油酯表）。官方表是三列：

       心血管疾病或糖尿病 │ 與藥物治療可並行          │ TG ≧ 200 且 (TC/HDL-C > 5 或 HDL-C < 40) │ 目標 < 200
       無心血管疾病       │ 給藥前應有 3–6 個月非藥物治療 │ TG ≧ 200 且 (TC/HDL-C > 5 或 HDL-C < 40) │ 目標 < 200
       無心血管疾病       │ 與藥物治療可並行          │ TG ≧ 500                            │ 目標 < 500

     **決定可否並行的是「走哪一列」，不是病人有沒有共病。** 第三列的存在就是為了讓
     無心血管疾病但 TG ≧ 500 的人也能直接用藥；把並行寫成只看共病會把那一列整個漏掉
     （2026-08-27 使用者指出，附官方表影像）。

     此表在現行官方彙編（115.8.21）中查無、狀態未確認——詳見 chronic_care.json 該條的補充。 */
  function lipidFibrate(c) {
    const tg = Number(c.tg);
    const tc = Number(c.tc);
    const hdl = Number(c.hdl);
    if (!Number.isFinite(tg) || tg <= 0) return { ok: false, reason: 'no-tg' };
    /* 官方第一列的條件是「心血管疾病**或**糖尿病」。可否並行只要命中其一，
       但畫面與病歷要寫的是**這位病人命中哪一個**——把條文的選言原樣抄過去，
       等於要醫師自己回頭對一次（使用者 2026-09-01 指出）。 */
    const cvdDisease = lipBool(c.cvdOld) || lipBool(c.acsPciCabg);
    const parallelWhy = [];
    if (cvdDisease) parallelWhy.push('心血管疾病');
    if (lipBool(c.dm)) parallelWhy.push('糖尿病');
    const hasCvd = parallelWhy.length > 0;
    if (tg >= 500) {
      /* 第三列：無心血管疾病也可並行，所以這裡不看 hasCvd。 */
      return { ok: true, meets: true, route: 'TG ≧ 500', target: 500, parallel: true,
               parallelWhy: parallelWhy.slice(),
               /* why 只放「依據」：可否並行是 parallel 旗標的事，兩者混在同一句話裡，
                  畫面與病歷都沒辦法把「哪一級／憑什麼」和「能不能直接開藥」分行講。 */
               why: ['TG ' + tg], needs: [] };
    }
    if (tg < 200) {
      return { ok: true, meets: false, route: 'TG < 200', target: 200, parallel: hasCvd,
               parallelWhy: parallelWhy.slice(), why: ['TG ' + tg + ' 未達 200'], needs: [] };
    }
    const ratio = (Number.isFinite(tc) && Number.isFinite(hdl) && hdl > 0) ? tc / hdl : null;
    const ratioHit = ratio !== null && ratio > 5;
    const hdlHit = Number.isFinite(hdl) && hdl < 40;
    /* why 只放數值與另外那半個條件：「≧ 200」已經由 route（TG 200–499）表達，
       重複寫等於同一件事講兩遍，而這段文字要貼進病歷。 */
    const why = ['TG ' + tg];
    if (ratioHit) why.push('TC/HDL-C ' + (Math.round(ratio * 100) / 100) + ' > 5');
    if (hdlHit) why.push('HDL-C ' + hdl + ' < 40');
    if (!ratioHit && !hdlHit) {
      return { ok: true, meets: false, route: 'TG 200–499', target: 200, parallel: hasCvd,
               parallelWhy: parallelWhy.slice(), why,
               needs: ['TG 200–499 還須同時 TC/HDL-C > 5 或 HDL-C < 40'] };
    }
    return { ok: true, meets: true, route: 'TG 200–499', target: 200, parallel: hasCvd,
             parallelWhy: parallelWhy.slice(), why, needs: [] };
  }

  /* ── 降血脂品項反查 ────────────────────────────────────────────────────────
     使用者 2026-09-01：「我希望計算機裡有個欄位讓我可以輸入健保代碼 或 商品名 或
     學名 然後顯示是適用表一還是表二」。

     為什麼非有不可：表一與表二的門檻差很多（極高風險 55 vs 70），而走哪一張
     **只看健保代碼**——同一個 atorvastatin，A 廠走表一、B 廠走表二。醫師手上是商品名，
     不是代碼清單，沒有反查就只能憑印象猜。

     純函式、零 DOM：品項清單由呼叫端傳進來（瀏覽器是 window.LIPID_PRODUCTS，
     node 測試直接餵陣列），這樣這一段能被單元測試釘住。 */

  const LIPID_TABLE_LABEL = { one: '表一', two: '表二' };

  /* 健保代碼：一個英文字母 ＋ 9 碼英數，共 10 碼（AC46402100、B024129100、K000123456）。
     樣式是對著實際資料推的，不是憑印象——611 個品項全部符合，開頭字母有 A/B/K/Y。
     用它判斷「使用者打的是代碼還是名字」：代碼要精準比對，名字才做模糊搜尋。 */
  const LIPID_CODE_RE = /^[A-Z][A-Z0-9]{9}$/i;

  function lipidNormalize(s) {
    return String(s == null ? '' : s).trim().toUpperCase();
  }

  /* 搜尋：代碼完全相同排最前，其次是商品名／成分的子字串比對。
     limit 是給畫面用的上限；回傳另帶 total，讓畫面能說「還有幾筆沒列出來」——
     **靜默截斷是不行的**：醫師以為只有 3 個品項，實際上有 30 個。 */
  function lipidFindProducts(products, query, limit) {
    const list = Array.isArray(products) ? products : [];
    const q = lipidNormalize(query);
    const cap = Number.isFinite(limit) && limit > 0 ? limit : 20;
    if (q.length < 2) return { query: q, exact: null, hits: [], total: 0, capped: false };

    const exactCode = LIPID_CODE_RE.test(q)
      ? list.filter((p) => lipidNormalize(p.code) === q)[0] || null
      : null;

    const hits = [];
    for (const p of list) {
      if (exactCode && p === exactCode) continue;
      const hay = lipidNormalize(p.code) + '\u0000' + lipidNormalize(p.en)
        + '\u0000' + String(p.zh || '') + '\u0000' + lipidNormalize(p.ingredient);
      if (hay.indexOf(q) >= 0 || String(p.zh || '').indexOf(String(query).trim()) >= 0) {
        hits.push(p);
      }
    }
    /* 表二排前面：它是例外，而「我開的這個是不是例外」正是要查的那件事。 */
    /* 給付中的排前面（已停付的查得到但不能開），其次表二優先——
       「我開的這個是不是那個例外」正是要查的那件事。 */
    hits.sort((a, b) => {
      const dead = (x) => (x.listed === false ? 1 : 0);
      const rank = (x) => (x.table === 'two' ? 0 : x.table === 'one' ? 1 : 2);
      return dead(a) - dead(b) || rank(a) - rank(b)
        || lipidNormalize(a.ingredient).localeCompare(lipidNormalize(b.ingredient))
        || lipidNormalize(a.code).localeCompare(lipidNormalize(b.code));
    });
    return {
      query: q,
      exact: exactCode,
      hits: hits.slice(0, cap),
      total: hits.length + (exactCode ? 1 : 0),
      capped: hits.length > cap,
    };
  }

  /* 依成分彙總：查「atorvastatin」時要回答的是「幾個走表一、幾個走表二」，
     不是丟 100 筆品項給人看。 */
  /* 已停付（支付價 0）的代碼**不列入統計**：把它們算進去會得到相反的結論。
     實測含死碼時「表一 255 / 表二 116」，只算給付中則是「表一 49 / 表二 116」——
     前者會讓人以為「大多數走表一」，而那正是會少對代碼的那個誤解。
     反查仍然找得到它們（見 lipidFindProducts），只是標成已停付。 */
  const lipidListed = (p) => p && p.listed !== false;

  function lipidSummarize(products) {
    const list = (Array.isArray(products) ? products : []).filter(lipidListed);
    const by = {};
    for (const p of list) {
      /* 用 generic（成分欄的第一個詞）分組，不用 ingredient：品項檔的鹽類寫法不一致，
         照原樣分組會把同一個學名拆成好幾堆（見 fetch_lipid_products.py 的 generic()）。 */
      const key = String(p.generic || p.ingredient || '（未標成分）');
      if (!by[key]) by[key] = { ingredient: key, one: 0, two: 0, other: 0 };
      if (p.table === 'one') by[key].one += 1;
      else if (p.table === 'two') by[key].two += 1;
      else by[key].other += 1;
    }
    return Object.keys(by).sort().map((k) => by[k]);
  }

  /* 把反查結果與病人的判定接起來（使用者要求 3）：
     「有輸入病人資料時則整合結果，顯示有符合的表一或表二可以用的藥物有哪些」。

     coverage＝lipidCoverage() 的回傳；沒有病人資料時傳 null，只回表別不下判定。
     **不合併成一個結論**：兩張表可能一符合一不符合，硬湊成「可不可以開」會把
     「換個代碼就不符合」這件事藏起來——那正是會被核刪的地方。 */
  function lipidProductVerdict(product, coverage) {
    if (!product) return null;
    const table = product.table === 'one' || product.table === 'two' ? product.table : '';
    const out = {
      code: product.code,
      name: product.en || product.zh || product.code,
      ingredient: product.ingredient || '',
      listed: product.listed !== false,
      table,
      tableLabel: LIPID_TABLE_LABEL[table] || '',
      section: product.section || '',
      meets: null,
      threshold: null,
      level: '',
    };
    /* 已停付的代碼要明講，而且要排在表別之前——「這個代碼走表一」對一個不給付的
       品項來說是誤導。查得到但不能開，跟查無此代碼是兩件事。 */
    if (!out.listed) {
      out.note = '這個代碼的支付價是 0，已停止給付——查得到但不能開。'
        + '同一個品名可能有另一個現行代碼，用品名再查一次。';
      return out;
    }
    if (!table) {
      /* 2.6.2／2.6.3／2.6.4 有自己的條件，不是表一／表二的問題；
         品項檔沒標章節的也一樣不猜。 */
      out.note = product.section
        ? '這個品項走 ' + product.section + '，有自己的給付條件，不是表一／表二的判定'
        : '品項檔未標給付規定章節，本工具不判斷它的表別';
      return out;
    }
    if (!coverage || !coverage.ok) return out;
    const info = table === 'one' ? coverage.one : coverage.two;
    out.meets = info.meets;
    out.threshold = info.threshold;
    out.level = info.label;
    out.target = info.target;
    out.tc = info.tc || null;
    return out;
  }

  /* 品名縮寫：把劑型字樣拿掉，留下「商品名＋劑量」。

     **不得動到 XL、OD、SR、ER 與引號裡的廠標**——那些是同名不同品項的關鍵
     （Lescol XL 80mg 與 Lescol 40mg 是兩回事；Tulip"SDZ" 走表一、Tulip 走表二）。
     實測 165 個現行品項：162 筆縮短、3 筆原樣、0 筆掉了劑量或修飾字。
     縮寫只用在顯示，完整品名仍要留給呼叫端放進 title。 */
  const LIPID_FORM_RE = new RegExp(
    '\\s*(?:film[\\s-]*coat(?:ed|ing)|f\\.?\\s?c\\.?|enteric[\\s-]*coated'
    + '|sugar[\\s-]*coated|prolonged[\\s-]*release|extended[\\s-]*release|hard|soft)?'
    + '\\s*(?:tablets?|tabs?|capsules?|caps?)\\b\\.?', 'ig');

  function lipidShortName(name) {
    const raw = String(name == null ? '' : name);
    const out = raw.replace(LIPID_FORM_RE, ' ').replace(/\s{2,}/g, ' ').replace(/^[\s,-]+|[\s,-]+$/g, '');
    return out || raw;
  }

  /* 某一張表底下、**現行給付中**的品項，依學名分組。
     已停付的不列：那是這一輪修掉的錯——把死碼算進去會讓人以為某個學名有一堆選擇。 */
  function lipidProductsByTable(products, table) {
    const list = (Array.isArray(products) ? products : [])
      .filter((p) => p && p.table === table && p.listed !== false);
    const by = {};
    const order = [];
    for (const p of list) {
      const key = String(p.generic || p.ingredient || '（未標成分）');
      if (!by[key]) { by[key] = { generic: key, items: [] }; order.push(key); }
      by[key].items.push({ code: p.code, name: p.en || p.zh || p.code,
                           short: lipidShortName(p.en || p.zh || p.code) });
    }
    for (const key of order) {
      by[key].items.sort((a, b) => a.short.localeCompare(b.short));
    }
    order.sort((a, b) => by[b].items.length - by[a].items.length || a.localeCompare(b));
    return order.map((k) => by[k]);
  }

  function lipidCoverage(input) {
    const c = input || {};
    const ldl = Number(c.ldl);
    const tc = Number(c.tc);

    const rfNew = lipidRiskFactorsNew(c);
    const rfOld = lipidRiskFactorsOld(c);
    const risk = lipidRiskLevel(Object.assign({}, c,
      { riskFactorCountNew: rfNew.length, riskFactorNamesNew: rfNew }));
    const row = LIPID_ONE.filter((r) => r.level === risk.level)[0];

    const hasLdl = Number.isFinite(ldl) && ldl > 0;
    const hasTc = Number.isFinite(tc) && tc > 0;
    const one = {
      level: risk.level, label: row.label, why: risk.why,
      threshold: row.ldl, target: row.ldl, nonHdlTarget: row.nonHdl,
      parallel: row.parallel,
      meets: hasLdl ? ldl >= row.ldl : null,
    };

    const twoFlags = lipidTwoFlags(c);
    const base = lipidTableTwo(
      Object.assign({}, c, {
        acsPciCabg: twoFlags.acs, cvdOld: twoFlags.cvd,
        acsWhy: twoFlags.acsWhy, cvdWhy: twoFlags.cvdWhy,
      }), rfOld);
    const twoMeets = (hasLdl && ldl >= base.ldl)
      || (base.tc !== null && hasTc && tc >= base.tc);
    const two = Object.assign({}, base, {
      threshold: base.ldl,
      meets: (hasLdl || hasTc) ? twoMeets : null,
      riskFactors: rfOld,
      proof: twoFlags.proof,
    });

    return {
      ok: true,
      /* 兩張表一律都算、都回傳。表一是主表，但公告明列一批「不適用表一」的健保代碼
         （116 項，分布在 9 種成分，含 atorvastatin、rosuvastatin）仍走表二，
         而那份清單只有開立當下查得到，所以由醫師依實際品項代碼取用哪一張。 */
      ldl: hasLdl ? ldl : null,
      tc: hasTc ? tc : null,
      riskFactorsNew: rfNew,
      one,
      two,
      /* 傳推導後的旗標：fibrate 的「可否並行」看的是有無心血管疾病或糖尿病，
         而使用者勾的是冠心病／中風那些具體項目，沒有推導就會漏判。實測踩過。 */
      fibrate: lipidFibrate(Object.assign({}, c,
        { cvdOld: twoFlags.cvd, acsPciCabg: twoFlags.acs })),
    };
  }

  return { buildIndex, search, family, formatCart, mergeRelated, rocDate, splitByEffective,
           splitSentences, splitLead, creatinineClearance,
           lipidCoverage, lipidRiskFactorsNew, lipidRiskFactorsOld, lipidMetabolic,
           lipidFindProducts, lipidSummarize, lipidProductVerdict,
           lipidShortName, lipidProductsByTable };
});
