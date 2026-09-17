/* 兩個計算機（CCr、降血脂）的純文字整形：把 logic.js 算出來的結果物件變成
   病歷段落與剪貼簿欄位。**零 DOM**——這裡不碰 document，所以 node 可以直接測。

   為什麼獨立成一個檔：這些函式原本跟 DOM 建構關在同一個渲染檔裡，結果是
   (1) 只能靠 Playwright E2E 間接驗證格式對不對，(2) clipboard-settings.js 這個
   「設定頁」為了拿範例資料，得反過來依賴渲染層。兩件事同一個病因。

   相依（logic.js、clipboard-format.js）用 getter 取，不在載入時抓：
   瀏覽器端靠 build.py 的 SOURCES 順序保證先載入，node 端走 require。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory({
      get logic() { return require('./logic.js'); },
      get clipboard() { return require('./clipboard-format.js'); },
    });
  } else {
    root.ICDClinicalFormat = factory({
      get logic() { return root.ICDLogic; },
      get clipboard() { return root.ICDClipboard; },
    });
  }
})(typeof self !== 'undefined' ? self : this, function (deps) {
  'use strict';

  // ── CCr ───────────────────────────────────────────────────────────────────
  /* 為什麼三種體重要並列：這個數字是拿來調抗生素劑量的，而 Cockcroft-Gault 在體重
     極端時最不準——同一位病人用實際／理想／調整體重可以差到將近兩倍。主值只是
     「依 BMI 的一般建議」（MDCalc／Brown et al 的規則），選哪個仍然是醫師的判斷，
     所以畫面一定要標明「這個數字是用什麼體重算出來的」，而不是只丟一個數字。 */
  const CCR_BASIS_LABEL = { actual: '實際體重', ideal: '理想體重', adjusted: '調整體重' };

  function ccrClipboardData(r) {
    return { CCr: r.crcl, 單位: 'mL/min', 體重依據: CCR_BASIS_LABEL[r.basis], 所用體重: r.weightUsed,
      BSA: Number.isFinite(r.bsaRaw) ? r.bsaRaw.toFixed(2) : '',
      校正CCr: Number.isFinite(r.crclIndexedRaw) ? r.crclIndexedRaw.toFixed(1) : '',
      實際CCr: r.actual, 理想CCr: r.ideal, 調整CCr: r.adjusted };
  }

  function ccrResultText(r, preferences) {
    if (!r || !r.ok) return '';
    return deps.clipboard.format('ccr', ccrClipboardData(r), preferences);
  }

  // ── 降血脂 ─────────────────────────────────────────────────────────────────
  const lipidVerdictText = (info) => deps.logic.lipidTreatmentStatus(info).text;
  const lipidPrescriptionText = (info, detail) => info.meets === true
    ? detail : lipidVerdictText(info);

  /* Fibrate 的並行說明。兩個地方共用（結果區與病歷文字），措辭只能有一份。
       TG ≧ 500 那一列是**不論共病**的，所以它的理由不是共病而是那一列本身
       （2026-08-27 使用者指出，附官方表影像）；其餘走第一列的才寫命中哪一個共病。 */
  function lipidFibrateParallelText(f) {
    if (!f.parallel) return '無心血管疾病者，給藥前應有 3–6 個月非藥物治療';
    if (f.route === 'TG ≧ 500') return '可與藥物治療並行（TG ≧ 500 該列不論有無心血管疾病）';
    const why = Array.isArray(f.parallelWhy) ? f.parallelWhy : [];
    /* 「及」不是「或」：兩個都有就寫兩個，病歷才看得出這位病人的實際狀況。 */
    return '可與藥物治療並行（' + (why.length ? why.join('及') : '心血管疾病或糖尿病') + '）';
  }

  /* 「可否並行」兩張表共用同一句話：表一講的是生活型態改變，表二條文寫「非藥物治療」，
     指的是同一件事，用兩種說法只會讓人以為是兩種要求。 */
  const lipidParallelText = (parallel) => (parallel
    ? '可與藥物治療並行（生活型態改變同時進行，當天就能開藥）'
    : '給藥前應有 3–6 個月生活型態改變／非藥物治療（做滿才給付）');

  /* 病歷文字。順序與畫面同一套思考流程（使用者 2026-09-01 指定）：
       依哪一張表 → 哪一級、憑什麼 → 能不能直接開藥 → 門檻與本例數值 → 目標 → 註記

     用字精簡到帶標籤的短行，不再是兩段連續敘述——審查醫師要找的是那幾個數字，
     不是讀一段文章。但**條文全名一定保留**：看病歷的人不知道有這個工具，
     「表一」單獨出現沒有意義（2026-08-26 使用者原話）。

     使用者的三次要求都釘在這段：
       (08-26)「要寫出符合哪些條文（看病歷的人並不知道我有這個計算器）」
       (08-27)「只要寫符合的那一條條文就好」——不達標的那張表不寫進病歷
       (09-01)「符合思考流程順序並精簡用字」
     唯一寫「不符合」的時機仍然是兩張表結論不同：開錯健保代碼就會被核刪。 */
  const LIPID_TABLE_ONE_NAME = '全民健康保險降膽固醇藥物給付規定表一';
  const LIPID_TABLE_TWO_NAME = '全民健康保險降膽固醇藥物給付規定表二';
  const LIPID_TG_TABLE_NAME = '全民健康保險降三酸甘油酯藥物給付規定表';
  const LIPID_SOURCE_NOTE = '（依藥品給付規定第二節 2.6.1，115.8.21 版）';
  const LIPID_TWO_SCOPE = '（限公告明列「不適用表一」之健保代碼）';

  /* 標籤一律兩個全形字，貼進病歷後每一行的縮排才對得齊。 */
  const lipidRow = (label, body) => '　' + label + '　' + body;

  function lipidProfileLine(r, input) {
    const bits = [];
    const age = Number(input.age);
    if (Number.isFinite(age) && age > 0) {
      bits.push(age + ' 歲' + (input.sex === 'female' ? '女性' : '男性'));
    }
    const labs = [];
    if (r.ldl !== null) labs.push('LDL-C ' + r.ldl);
    if (r.tc !== null) labs.push('TC ' + r.tc);
    const hdl = Number(input.hdl);
    if (Number.isFinite(hdl) && hdl > 0) labs.push('HDL-C ' + hdl);
    const tg = Number(input.tg);
    if (Number.isFinite(tg) && tg > 0) labs.push('TG ' + tg);
    if (labs.length) bits.push(labs.join('、') + ' mg/dL');
    return bits.join('，');
  }

  /* 一張降膽固醇表的病歷段落。表一與表二共用——兩者的欄位形狀相同，
     差別只在表二多了 TC 門檻與 TC 目標、少了 non-HDL-C。

     區塊內的順序照臨床思考流程走（使用者 2026-09-01 指定）：
       這位病人是哪一級、憑什麼 → 能不能直接開藥 → 門檻與目標 → 結論 */
  function lipidChartRows(name, info, r, scope) {
    const rows = ['降膽固醇藥物：依「' + name + '」' + (scope || '')];
    rows.push(lipidRow('分級', info.label
      + (info.why && info.why.length ? '（' + info.why.join('、') + '）' : '')));
    rows.push(lipidRow('處方', lipidPrescriptionText(info, lipidParallelText(info.parallel))));
    const gate = 'LDL-C ≧ ' + info.threshold + (info.tc ? ' 或 TC ≧ ' + info.tc : '');
    /* 只有一個數值時不重複標名稱（門檻那半句已經寫了 LDL-C）；
       兩個數值並列時才標，否則「本例 95、180」看不出哪個是哪個。 */
    const got = [];
    if (r.ldl !== null) got.push({ name: 'LDL-C', value: r.ldl });
    if (info.tc && r.tc !== null) got.push({ name: 'TC', value: r.tc });
    const shown = got.length === 1
      ? String(got[0].value)
      : got.map((g) => g.name + ' ' + g.value).join('、');
    rows.push(lipidRow('門檻', gate
      + (got.length ? ' → 本例 ' + shown + ' mg/dL' : '')
      + '，' + (info.meets === null ? '待判定' : info.meets ? '已達' : '未達')));
    if (info.target) {
      rows.push(lipidRow('目標', 'LDL-C < ' + info.target
        + (info.targetTc ? ' 或 TC < ' + info.targetTc : '')));
      if (info.nonHdlTarget) rows.push(lipidRow('次要目標', 'non-HDL-C < ' + info.nonHdlTarget));
    }
    rows.push(lipidRow('結論', lipidVerdictText(info)));
    for (const p of info.proof || []) rows.push(lipidRow('檢附', p));
    return rows;
  }

  function lipidDefaultResultText(r, input) {
    if (!r || !r.ok) return '';
    const c = input || {};
    if (r.ldl === null && r.tc === null && !(r.fibrate && r.fibrate.ok)) return '';

    const profile = lipidProfileLine(r, c);
    const out = ['【降血脂給付依據】' + profile];
    const one = r.one;
    const two = r.two;

    /* 兩張表都寫（使用者 2026-09-01：「右鍵輸出裡我希望也要有表二的判讀結果」）。

       這推翻了 08-27 的「只寫符合的那一條」——當時的理由是「一堆未達只會給審查醫師
       更多可挑的地方」。改的理由更強：**同一位病人在兩張表可能結論不同**，而走哪一張
       只看你開的品項健保代碼；病歷只寫一張，等於把「換個代碼就不符合」這件事藏起來，
       而那正是會被核刪的地方。表一先寫（主表），表二接著寫並標明它的適用範圍。 */
    if (r.ldl !== null || r.tc !== null || (r.fibrate && r.fibrate.ok)) {
      out.push('');
      for (const line of lipidChartRows(LIPID_TABLE_ONE_NAME, one, r)) out.push(line);
      out.push('');
      for (const line of lipidChartRows(LIPID_TABLE_TWO_NAME, two, r, LIPID_TWO_SCOPE)) {
        out.push(line);
      }
      /* 兩張表結論不同時再點一次名：上面兩段各自有已達／未達，但「所以該開哪一種」
         要講出來——那正是這段文字要防的核刪。 */
      if (one.meets !== null && two.meets !== null && deps.logic.lipidTreatmentStatus(one).status !== deps.logic.lipidTreatmentStatus(two).status) {
        out.push(lipidRow('註記', '兩表結論不同，請依所開品項之健保代碼適用之表別認定'));
      }
    }

    const f = r.fibrate;
    if (f && f.ok) {
      out.push('');
      out.push('降三酸甘油酯藥物：依「' + LIPID_TG_TABLE_NAME + '」');
      out.push(lipidRow('適用', f.route + ' 該列'
        + (f.why && f.why.length ? '（本例 ' + f.why.join('、') + '）' : '') + (f.meets === null ? '，待判定' : f.meets ? '，已達' : '，未達')));
      out.push(lipidRow('結論', lipidVerdictText(f)));
      for (const n of f.needs || []) out.push(lipidRow('條件', n));
      out.push(lipidRow('處方', lipidPrescriptionText(f, lipidFibrateParallelText(f))));
      out.push(lipidRow('目標', 'TG < ' + f.target));
    }

    out.push('');
    out.push(LIPID_SOURCE_NOTE);
    return out.join('\n');
  }

  function lipidClipboardData(r, input) {
    const data = { 完整結果: lipidDefaultResultText(r, input), 個案資料: lipidProfileLine(r, input || {}), 來源: LIPID_SOURCE_NOTE, sections: {} };
    for (const [key, info, name, scope] of [
      ['表一', r.one, LIPID_TABLE_ONE_NAME, ''], ['表二', r.two, LIPID_TABLE_TWO_NAME, LIPID_TWO_SCOPE],
    ]) {
      const rows = lipidChartRows(name, info, r, scope);
      const section = { 完整段落: rows.join('\n'), 表名: name, 適用範圍: scope, 依據: (info.why || []).join('、') };
      for (const line of rows.slice(1)) {
        const parts = line.slice(1).split('　');
        const label = parts.shift();
        const value = parts.join('　');
        section[label] = section[label] ? section[label] + '\n' + value : value;
      }
      data.sections[key] = section;
    }
    const f = r.fibrate;
    if (f && f.ok) {
      const section = { 表名: LIPID_TG_TABLE_NAME, 分級: f.route, 依據: (f.why || []).join('、'),
        處方: lipidPrescriptionText(f, lipidFibrateParallelText(f)), 結論: lipidVerdictText(f),
        目標: 'TG < ' + f.target, 條件: (f.needs || []).join('\n') };
      // 沿用原始病歷的 Fibrate 段落，預設內容與實際複製相同。
      const start = data.完整結果.indexOf('降三酸甘油酯藥物：');
      section.完整段落 = data.完整結果.slice(start, data.完整結果.lastIndexOf('\n\n')).trim();
      data.sections.Fibrate = section;
    }
    return data;
  }

  function lipidResultText(r, input, preferences) {
    if (!r || !r.ok || (r.ldl === null && r.tc === null && !(r.fibrate && r.fibrate.ok))) return '';
    return deps.clipboard.format('lipid', lipidClipboardData(r, input), preferences);
  }

  return {
    CCR_BASIS_LABEL, ccrClipboardData, ccrResultText,
    lipidVerdictText, lipidPrescriptionText, lipidFibrateParallelText, lipidParallelText,
    lipidProfileLine, lipidChartRows, lipidDefaultResultText, lipidClipboardData, lipidResultText,
    LIPID_TABLE_ONE_NAME, LIPID_TABLE_TWO_NAME, LIPID_TG_TABLE_NAME, LIPID_SOURCE_NOTE, LIPID_TWO_SCOPE,
  };
});
