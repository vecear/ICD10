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

     只認「短且乾淨」的前導標：≤ 14 字、其間不得有別的標點。
     這條界線是刻意的——「evolocumab（Repatha）與 alirocumab（Praluent）：」有 33 字，
     那不是標籤而是主詞，標重了整行都在發亮，等於沒標。
     全形冒號才算；半形冒號在條文裡是時間與比值（1:1、8:00）。

     回傳 { lead, rest }，lead 為 '' 表示沒有前導標。lead + rest 恆等於原字串。 */
  const LEAD_STOP = '，。；、（）()';
  function splitLead(text) {
    const src = typeof text === 'string' ? text : '';
    const at = src.indexOf('：');
    if (at <= 0 || at > 14) return { lead: '', rest: src };
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

  return { buildIndex, search, family, formatCart, mergeRelated, rocDate, splitByEffective,
           splitSentences, splitLead, creatinineClearance };
});
