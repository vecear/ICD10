/* 降血脂給付試算整套：入口鈕、浮層、品項反查、結果區塊與品項清單。
   病歷文字與剪貼簿欄位的整形在 clinical-format.js（零 DOM、有單元測試）。
   渲染規則與 R 的來源見 render-dom.js。 */
(function (root) {
  'use strict';

  // render-dom.js 已經建立這個物件（build.py 的 SOURCES 保證順序）
  const R = root.ICDRender;

  /* 計算機的純文字整形（零 DOM，獨立可測）。SOURCES 保證 clinical-format.js 先載入。 */
  const CF = root.ICDClinicalFormat;

  // ---- 血脂給付試算 ----
  /* 為什麼值得做一個計算機：LIPID 的判定有三個機械步驟特別容易錯——用錯表、
     極高／非常高的「組合」條件接錯、新舊兩表的風險因子定義混用。這三件事都不需要
     臨床判斷，只需要不出錯地照條文走，正是機器該接手的部分。

     浮層骨架刻意與 .ccr-* 同型（同樣的遮罩、關閉出口、複製與清除），使用者只要學一次。
     差別在這個是**多選輸入**：勾選項目直接用原生 checkbox 而不是 aria-pressed 的切換鈕，
     因為它們是「可複選的事實陳述」不是「模式切換」，原生元件的讀屏語意與鍵盤行為都對。 */
  const LIPID_DISCLAIMER = '依藥品給付規定 第二節 2.6.1 表一與表二（115.8.21 版）試算，'
    + '只計算條文門檻，不含臨床判斷。實際給付以審查為準\n'
    + '適用表一或表二由藥品健保代碼決定，開藥前請核對當期公告。';

  /* 勾選項目分三組，順序照使用者查閱時的思路：先問「有沒有心血管病史」，
     再問「有沒有那幾個共病」，最後才數風險因子。
     每一項的字面盡量貼原文——這些字之後會被拿去跟條文對照。 */
  const LIPID_HISTORY = [
    ['cad', '冠心病 CAD'],
    ['miWithin1y', '一年內心肌梗塞'],
    ['mi2plus', '≧ 2 次心肌梗塞'],
    ['multivessel', '多支冠狀動脈阻塞'],
    ['pad', '周邊動脈疾病'],
    ['carotid', '頸動脈狹窄'],
    ['acsHistory', '急性冠心症病史'],
    ['revasc', '血管再通術 PCI／CABG'],
    ['strokeTia', '缺血性中風／TIA'],
    ['padSymptomatic', '症狀性 PAD'],
    ['imaging50', '影像 ≧ 50% 狹窄'],
  ];
  const LIPID_COMORBID = [
    ['dm', '糖尿病'],
    ['ckd', '未透析 CKD'],
    ['cac400', '鈣化分數 ≧ 400'],
  ];
  const LIPID_FACTORS = [
    ['htn', '高血壓'],
    ['smoking', '抽菸'],
    ['familyHistory', '早發性冠心病家族史'],
    ['menopause', '已停經（僅表二計入）'],
  ];
  /* 代謝症候群拆成細項（使用者 2026-09-01）：它是 6 項風險因子裡唯一要「數」的，
     一顆勾選鈕等於把最容易錯的一步推回給使用者。標籤帶上官方的數字，
     醫師對著上面剛填的 TG／HDL-C 就能勾，不必另外查條文。 */
  const LIPID_METABOLIC = [
    ['msWaist', '腹部肥胖 男 ≧ 90／女 ≧ 80 cm'],
    ['msBp', '血壓 ≧ 130/85 或使用降壓藥'],
    ['msGlucose', '空腹血糖 ≧ 100 或使用糖尿病藥'],
    ['msTg', '空腹 TG ≧ 150 或使用降 TG 藥'],
    ['msHdl', 'HDL-C 男 < 40／女 < 50'],
  ];

  function lipidCheckEl(key, label) {
    const wrap = R.el('label', 'lipid-check');
    wrap.dataset.lipidRow = key;
    if (key === 'menopause') wrap.hidden = true;      // 預設性別是男，先藏起來
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.id = 'lipid-' + key;
    box.dataset.lipidKey = key;
    wrap.append(box, R.el('span', null, label));
    return wrap;
  }

  function lipidGroupEl(title, rows) {
    const box = R.el('fieldset', 'lipid-group');
    box.appendChild(R.el('legend', 'lipid-legend', title));
    const grid = R.el('div', 'lipid-checks');
    for (const r of rows) grid.appendChild(lipidCheckEl(r[0], r[1]));
    box.appendChild(grid);
    return box;
  }

  function lipidFieldEl(id, label, opts) {
    const wrap = R.el('label', 'lipid-field' + ((opts && opts.wide) ? ' lipid-field--wide' : ''));
    wrap.append(R.el('span', 'lipid-label', label));
    const input = document.createElement('input');
    input.id = id;
    /* .lipid-input 這個類名是**行為契約**不只是樣式：interactions.js 的 input 委派與
       render-dock.js 的 PiP 代打都認它。新欄位少了它，一般視窗會重算、置頂就不會。 */
    input.className = 'input lipid-input';
    input.autocomplete = 'off';
    if (opts && opts.text) {
      input.type = 'text';
    } else {
      input.type = 'number';
      input.inputMode = 'decimal';
      input.step = (opts && opts.step) || '1';
    }
    if (opts && opts.placeholder) input.placeholder = opts.placeholder;
    wrap.appendChild(input);
    return wrap;
  }

  /* 品項查詢的結果區塊。三種情境（使用者 2026-09-01 的三項要求）：
       有打字        → 列出命中的品項與各自的表別
       有打字＋有病人 → 每一筆再帶「以這位病人來說符不符合」
       沒打字＋有病人 → 反過來列「符合的那張表底下有哪些藥可以用」
     整合但**不合併成單一結論**：兩張表可能一符合一不符合，硬湊成「可不可以開」
     會把「換個代碼就不符合」藏起來，而那正是會被核刪的地方。 */
  const LIPID_TABLE_TAG = { one: '表一', two: '表二' };

  function lipidProductRow(v) {
    const li = R.el('li', 'lipid-hit'
      + (v.listed === false ? ' is-dead' : '')
      + ' ' + root.ICDLogic.lipidTreatmentStatus(v).className);
    const head = R.el('p', 'lipid-hit-head');
    /* 院內收費代碼排在健保代碼前面：診間打進 HIS 的是這個，健保代碼是查證時才用的。
       一個健保代碼對到兩個收費代碼（原品項與「(矯正)」）時兩個都列——
       只列一個的話，醫師打的剛好是另一個就會以為查錯了。 */
    if (v.hosp && v.hosp.length) {
      head.appendChild(R.el('b', 'lipid-hit-hosp', v.hosp.join('／')));
    }
    head.appendChild(R.el('b', 'lipid-hit-code', v.code));
    /* 已停付要蓋過表別：對一個不給付的代碼說「走表一」是誤導。 */
    if (v.listed === false) {
      head.appendChild(R.el('span', 'lipid-hit-table is-dead', '已停付'));
    } else if (v.tableLabel) {
      head.appendChild(R.el('span', 'lipid-hit-table is-' + v.table, v.tableLabel));
    }
    head.appendChild(R.el('span', 'lipid-hit-name', v.name));
    li.appendChild(head);
    const bits = [];
    if (v.ingredient) bits.push(v.ingredient);
    /* 門檻只有在算得出來時才印：沒有病人資料時分級未定，門檻也就未定——
       印「LDL-C ≧ null」比不印更糟。 */
    /* typeof 而不是 Number.isFinite(Number(x))：Number(null) 是 0、也是有限數，
       那個守衛完全不擋（實測印出「LDL-C ≧ null」）。 */
    if (v.table && typeof v.threshold === 'number') {
      bits.push('起始門檻 LDL-C ≧ ' + v.threshold
        + (v.tc ? ' 或 TC ≧ ' + v.tc : ''));
    }
    if (bits.length) li.appendChild(R.el('p', 'lipid-hit-sub', bits.join('\n')));
    if (v.note) li.appendChild(R.el('p', 'lipid-hit-note', v.note));
    if (v.meets !== null && v.meets !== undefined) {
      li.appendChild(R.el('p', 'lipid-hit-verdict',
        root.ICDLogic.lipidTreatmentStatus(v).text + '（' + v.tableLabel + ' '
        + v.level + '，門檻 LDL-C ≧ ' + v.threshold + '）'));
    }
    return li;
  }

  function lipidLookupEl(root2, ctx, r) {
    const box = R.el('section', 'lipid-lookup');
    const input = root2.querySelector('#lipid-drug');
    const query = input ? String(input.value || '').trim() : '';
    const products = (root.LIPID_PRODUCTS && root.LIPID_PRODUCTS.products) || [];
    if (!products.length) return null;
    const coverage = (r && r.ok && (r.ldl !== null || r.tc !== null)) ? r : null;

    if (query.length >= 2) {
      const found = ctx.logic.lipidFindProducts(products, query, 12);
      const live = found.hits.filter((p) => p.listed !== false).length
        + (found.exact && found.exact.listed !== false ? 1 : 0);
      box.appendChild(R.el('b', 'lipid-lookup-title',
        '品項查詢「' + query + '」　命中 ' + found.total + ' 筆'
        + (live < found.total ? '（給付中 ' + live + '，其餘已停付）' : '')));
      if (!found.total) {
        box.appendChild(R.el('p', 'lipid-lookup-empty',
          '查無此代碼／品名／學名。這份清單只收現行有效的降血脂品項（ATC C10）\n'
          + '若確定是降膽固醇藥物而不在「不適用表一」清單上，依條文即適用表一。'));
        return box;
      }
      const list = R.el('ul', 'lipid-hit-list');
      const rows = (found.exact ? [found.exact] : []).concat(found.hits);
      for (const p of rows) {
        list.appendChild(lipidProductRow(ctx.logic.lipidProductVerdict(p, coverage)));
      }
      box.appendChild(list);
      /* 截斷一定要講出來：醫師以為只有 12 個品項，實際上有 113 個。 */
      if (found.capped) {
        box.appendChild(R.el('p', 'lipid-lookup-more',
          '只列前 ' + rows.length + ' 筆，另有 ' + (found.total - rows.length)
          + ' 筆未列出——打得更精確（代碼或完整商品名）可以縮小範圍。'));
      }
      const sum = ctx.logic.lipidSummarize(
        ctx.logic.lipidFindProducts(products, query, products.length).hits);
      if (sum.length) {
        box.appendChild(R.el('p', 'lipid-lookup-sum', '依學名彙總：\n'
          + sum.map((s) => s.ingredient + '（表一 ' + s.one + '、表二 ' + s.two
            + (s.other ? '、其他章節 ' + s.other : '') + '）').join('\n')));
      }
      return box;
    }

    /* 沒打字：有病人資料時反過來列「符合的那張表底下有哪些藥」。 */
    if (!coverage) return null;
    box.appendChild(R.el('b', 'lipid-lookup-title', '各表用藥條件與適用品項'));
    const all = ctx.logic.lipidSummarize(products.filter((p) => p.table));
    for (const key of ['one', 'two']) {
      const info = key === 'one' ? r.one : r.two;
      if (info.meets === null) continue;
      const line = R.el('p', 'lipid-avail ' + root.ICDLogic.lipidTreatmentStatus(info).className);
      line.appendChild(R.el('b', 'lipid-hit-table is-' + key, LIPID_TABLE_TAG[key]));
      const names = all.filter((s) => s[key] > 0)
        .sort((a, b) => b[key] - a[key])
        .map((s) => s.ingredient + ' ' + s[key]);
      line.appendChild(document.createTextNode(
        root.ICDLogic.lipidTreatmentStatus(info).text + '\n適用品項：'
        + names.join('、')));
      box.appendChild(line);
    }
    box.appendChild(R.el('p', 'lipid-lookup-sum',
      '數字是品項數，不是劑量。同一個學名可能兩張表都有——開藥前用上面的欄位查代碼。'));
    return box;
  }

  function lipidOverlayEl() {
    const overlay = R.el('div', 'lipid-overlay');
    overlay.id = 'lipid-overlay';
    overlay.hidden = true;
    const panel = R.el('div', 'lipid-panel');
    panel.id = 'lipid-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'lipid-title');

    const head = R.el('div', 'lipid-head');
    const title = R.el('h2', 'lipid-title', 'Lipid');
    title.id = 'lipid-title';
    const close = R.el('button', 'lipid-close', '關閉');
    close.type = 'button';
    close.id = 'lipid-close';
    close.title = '關閉（Esc，或點面板以外任一處）';
    head.append(title, close);

    const form = R.el('div', 'lipid-form');
    const sexRow = R.el('div', 'seg-row lipid-sex');
    sexRow.id = 'lipid-sex';
    sexRow.setAttribute('role', 'group');
    sexRow.setAttribute('aria-label', '性別');
    for (const pair of [['male', '男'], ['female', '女']]) {
      const b = R.el('button', 'seg-btn lipid-sex-btn', pair[1]);
      b.type = 'button';
      b.dataset.lipidSex = pair[0];
      b.setAttribute('aria-pressed', pair[0] === 'male' ? 'true' : 'false');
      if (pair[0] === 'male') b.classList.add('is-on');
      sexRow.appendChild(b);
    }
    const nums = R.el('div', 'lipid-nums');
    nums.append(
      lipidFieldEl('lipid-age', '年齡'),
      lipidFieldEl('lipid-ldl', 'LDL-C'),
      lipidFieldEl('lipid-tc', 'TC', { placeholder: '選填' }),
      lipidFieldEl('lipid-hdl', 'HDL-C', { placeholder: '選填' }),
      lipidFieldEl('lipid-tg', 'TG', { placeholder: '選填' }));
    form.append(sexRow, nums,
      lipidGroupEl('心血管病史', LIPID_HISTORY),
      lipidGroupEl('共病', LIPID_COMORBID),
      lipidGroupEl('風險因子', LIPID_FACTORS),
      lipidGroupEl('代謝症候群（下列 ≧ 3 項才算 1 個風險因子）', LIPID_METABOLIC),
      /* 品項查詢排在勾選之後、結果之前：它回答的是「我開的這個走哪張表」，
         與病人條件無關，但結果要跟病人的判定一起看。 */
      lipidFieldEl('lipid-drug', '查品項',
        { text: true, wide: true, placeholder: '健保代碼／商品名／學名' }));

    const result = R.el('div', 'lipid-result');
    result.id = 'lipid-result';
    result.setAttribute('aria-live', 'polite');

    const actions = R.el('div', 'lipid-actions');
    const copy = R.el('button', 'btn lipid-copy', '複製結果');
    copy.type = 'button';
    copy.id = 'lipid-copy';
    copy.disabled = true;
    const reset = R.el('button', 'btn btn-secondary lipid-reset', '清除');
    reset.type = 'button';
    reset.id = 'lipid-reset';
    actions.append(copy, reset);

    panel.append(head, form, result, actions, R.el('p', 'lipid-disclaimer', LIPID_DISCLAIMER));
    overlay.appendChild(panel);
    return overlay;
  }

  /* 讀面板的值。與 ccrInputs 同一個理由刻意不經過 store：這些是「這一位病人」的數字。 */
  function lipidInputs(root2) {
    const val = (id) => {
      const node = root2.querySelector('#' + id);
      return node ? String(node.value).trim() : '';
    };
    const on = root2.querySelector('#lipid-sex .lipid-sex-btn[aria-pressed="true"]');
    const out = {
      sex: on ? on.dataset.lipidSex : 'male',
      age: val('lipid-age'),
      ldl: val('lipid-ldl'),
      tc: val('lipid-tc'),
      hdl: val('lipid-hdl'),
      tg: val('lipid-tg'),
      drug: val('lipid-drug'),
    };
    for (const box of root2.querySelectorAll('[data-lipid-key]')) {
      out[box.dataset.lipidKey] = box.checked === true;
    }
    return out;
  }

  /* 一張表的結果區塊。刻意把「判定」「數值比較」「理由」分成三行：
     醫師要能一眼看出這個結論是怎麼來的，而不是接受一個黑箱。
     判定與處方的措辭一律取自 clinical-format.js——畫面與病歷文字只能有一份說法。 */

  /* 區塊內的順序照臨床思考流程走（使用者 2026-09-01 指定）：
       這位病人是哪一級、憑什麼 → 能不能直接開藥 → 門檻與目標 → 結論
     原本是「分級 → 門檻 → 結論 → 依據」：依據排在結論之後，等於要求醫師先接受一個
     判定、再回頭找理由；而「能不能直接開藥」原本只有 fibrate 那一塊講。 */
  function lipidTableBlock(title, note, info, ldl, tc) {
    const box = R.el('section', 'lipid-block');
    const treatment = root.ICDLogic.lipidTreatmentStatus(info);
    box.classList.add(treatment.className);
    box.dataset.treatmentStatus = treatment.status;
    const head = R.el('div', 'lipid-block-head');
    head.append(R.el('b', 'lipid-block-title', title));
    if (note) head.appendChild(R.el('span', 'lipid-block-note', note));
    box.appendChild(head);

    // 1) 哪一級，憑什麼——依據跟著分級走，不再落到結論後面
    const level = R.el('p', 'lipid-level', info.label);
    if (info.why && info.why.length) {
      level.appendChild(R.el('span', 'lipid-why', '（依據：' + info.why.join('、') + '）'));
    }
    box.appendChild(level);

    // 2) 能不能直接開藥
    box.appendChild(R.el('p', 'lipid-parallel', CF.lipidPrescriptionText(info, CF.lipidParallelText(info.parallel))));

    // 3) 門檻與目標。non-HDL-C 存在時 LDL-C 才標「主要」——沒有次要目標的表二
    //    寫「主要目標」會讓人去找一個不存在的次要目標。
    const thr = info.threshold !== undefined ? info.threshold : info.ldl;
    const parts = ['起始門檻 LDL-C ≧ ' + thr + (info.tc ? ' 或 TC ≧ ' + info.tc : '')];
    if (info.target) {
      parts.push((info.nonHdlTarget ? '主要目標 ' : '目標 ') + 'LDL-C < ' + info.target
        + (info.targetTc ? ' 或 TC < ' + info.targetTc : ''));
    }
    if (info.nonHdlTarget) parts.push('次要目標 non-HDL-C < ' + info.nonHdlTarget);
    box.appendChild(R.el('p', 'lipid-threshold', parts.join('\n')));

    // 4) 結論
    const cmp = [];
    if (ldl !== null) cmp.push('LDL-C ' + ldl);
    if (tc !== null) cmp.push('TC ' + tc);
    if (cmp.length) box.appendChild(R.el('p', 'lipid-values', '本例 ' + cmp.join('、')));
    const verdict = R.el('p', 'lipid-verdict',
      CF.lipidVerdictText(info));
    box.appendChild(verdict);

    for (const p of info.proof || []) box.appendChild(R.el('p', 'lipid-proof', '舉證：' + p));
    return box;
  }

  /* 哪幾個學名是展開的。刻意放在模組層而不是 store：這是「現在正在看」的暫態，
     跟血脂輸入同一個道理不持久化；但**必須跨重繪保留**，否則每打一個數字就全縮回去。 */
  const LIPID_OPEN_GROUPS = new Set();
  /* 計算機與條文分頁共用同一份開合狀態（key 帶表別與學名）：在一邊展開 rosuvastatin，
     切到另一邊也是展開的——那是同一個使用者意圖的延續，不是意外。
     匯出清空的出口只給 E2E 用：測試之間不清，前一條展開的會漏到下一條，
     變成「單獨跑綠、整批跑紅」那種假紅燈。 */
  const lipidResetOpenGroups = () => { LIPID_OPEN_GROUPS.clear(); };

  /* 某一張表底下、現行給付中的品項清單（商品名＋劑量）。使用者 2026-09-01 要求
     兩張表都要這個細節——處方單上是品名與劑量，不是「statin」或「成分 35 項」。
     完整官方品名放 title：縮寫是為了掃視，要跟 HIS 對字時得看得到原名。 */
  function lipidProductListEl(ctx, table, title) {
    const products = (root.LIPID_PRODUCTS && root.LIPID_PRODUCTS.products) || [];
    const groups = ctx.logic.lipidProductsByTable(products, table);
    if (!groups.length) return null;
    const total = groups.reduce((n, g) => n + g.items.length, 0);
    const box = R.el('section', 'lipid-drugs');
    box.appendChild(R.el('b', 'lipid-drugs-title', title + '（現行給付中 ' + total + ' 項）'));
    const list = R.el('ul', 'lipid-drug-list');
    for (const g of groups) {
      const li = R.el('li', 'lipid-drug-group');
      /* 預設收合，點學名才展開（使用者 2026-09-01）：165 個品名攤開是一面牆，
         而多數時候只要看某一個學名底下有什麼。 */
      const more = R.el('details', 'lipid-drug-more');
      const key = table + '\u0000' + g.generic;
      more.open = LIPID_OPEN_GROUPS.has(key);
      /* toggle **不冒泡**，所以逐一掛而不是委派；記在模組層 Set 裡是因為
         結果區每次輸入都整個重繪，不記就會「改一個數值、展開的又縮回去」。 */
      more.addEventListener('toggle', () => {
        if (more.open) LIPID_OPEN_GROUPS.add(key);
        else LIPID_OPEN_GROUPS.delete(key);
      });
      const summary = document.createElement('summary');
      summary.className = 'lipid-drug-toggle';
      summary.append(R.el('b', 'lipid-drug-klass', g.generic),
        R.el('span', 'lipid-drug-count', g.items.length + ' 項'));
      more.appendChild(summary);
      const names = R.el('p', 'lipid-drug-names');
      g.items.forEach((item, i) => {
        if (i) names.appendChild(document.createTextNode('、'));
        const span = R.el('span', 'lipid-drug-item', item.short);
        span.title = item.name + '（' + item.code + '）';
        names.appendChild(span);
      });
      more.appendChild(names);
      li.appendChild(more);
      list.appendChild(li);
    }
    box.appendChild(list);
    return box;
  }

  function renderLipidResult(root2, ctx) {
    const box = root2.querySelector('#lipid-result');
    if (!box) return;
    R.clear(box);
    const input = lipidInputs(root2);
    const r = ctx.logic.lipidCoverage(input);
    const copy = root2.querySelector('#lipid-copy');

    const anyInput = r.ldl !== null || r.tc !== null || (r.fibrate && r.fibrate.ok);
    if (copy) copy.disabled = !anyInput;
    if (!anyInput) {
      /* 只查品項、不算病人也要能用（使用者要求 2）：所以查詢區塊排在這個 early return 之前。 */
      const soloLookup = lipidLookupEl(root2, ctx, r);
      if (soloLookup) box.appendChild(soloLookup);
      box.appendChild(R.el('p', 'lipid-hint', '輸入 LDL-C（或 TC／TG）並勾選病史後，這裡會列出表一的判定，以及表二品項的例外門檻。'));
      return;
    }

    const oneBlock = lipidTableBlock(
      '表一（ASCVD 風險分級）', '主表，多數品項適用', r.one, r.ldl, null);
    /* 適用藥物掛在表一區塊裡面（使用者 2026-09-01 要求「結果下方」）：
       表一的「處方規定」欄只寫類別（statin、ezetimibe、PCSK9…），
       不知道對應到哪些藥就等於沒寫。 */
    const drugs = lipidProductListEl(ctx, 'one', '適用藥物：商品名＋劑量');
    if (drugs) oneBlock.appendChild(drugs);
    /* 類別層級只留這一句：PCSK9 走 2.6.4 有自己的條件、siRNA 與 ATP citrate lyase
       台灣有藥但健保沒收載——它們不是表一品項，列進上面的清單會誤導，
       但完全不提又等於讓人以為表一點名的東西都能開。 */
    if (drugs) {
      oneBlock.appendChild(R.el('p', 'lipid-drug-note',
        '另：ezetimibe 與其複方走 2.6.2／2.6.3、PCSK9（evolocumab、alirocumab）走 2.6.4 '
        + '須事前審查，各有自己的條件\ninclisiran 與 bempedoic acid 台灣有藥但健保未收載，'
        + '開了就是自費。'));
    }
    box.appendChild(oneBlock);
    /* 表二退到次要：它只管公告明列「不適用表一」的那批代碼，
       但那批代碼含 atorvastatin、rosuvastatin，常到不能不算，所以是降級不是移除。 */
    const t2 = R.chronicTableTwo('lipid');
    const twoBlock = lipidTableBlock(
      '表二（例外）',
      t2 ? ('限「不適用表一」的 ' + t2.codeCount + ' 個健保代碼')
         : '限公告明列「不適用表一」之健保代碼',
      r.two, r.ldl, r.tc);
    twoBlock.classList.add('is-secondary');
    /* 使用者要求計算機這邊也把成分完整列出來：判定寫著「符合表二」時，
       下一個問題必然是「那我開的這個算不算表二」——不列出來就得跳去條文分頁再找一次。
       只列學名並帶代碼數，理由同 chronicTableTwoEl 的註解。 */
    const twoList = lipidProductListEl(ctx, 'two', '這張表的品項：商品名＋劑量');
    if (twoList) twoBlock.appendChild(twoList);
    if (t2) {
      twoBlock.appendChild(R.el('p', 'lipid-t2-caution',
        '同一個學名底下表一表二都有，且現行給付中是表二較多——依健保代碼認定，'
        + '用下面的「查品項」對一次。'));
    }
    box.appendChild(twoBlock);

    /* 兩張表結論不同時要明講。這正是這個計算機最有價值的一刻——同一位病人，
       開 A 廠牌符合、開 B 廠牌不符合，差別只在健保代碼走哪一張表。 */
    if (r.one.meets !== null && r.two.meets !== null && root.ICDLogic.lipidTreatmentStatus(r.one).status !== root.ICDLogic.lipidTreatmentStatus(r.two).status) {
      box.appendChild(R.el('p', 'lipid-split',
        '兩表結論不同，請依所開品項之健保代碼適用之表別認定'));
    }

    box.appendChild(R.el('p', 'lipid-rf',
      '表一風險因子 ' + r.riskFactorsNew.length + ' 項'
      + (r.riskFactorsNew.length ? '（' + r.riskFactorsNew.join('、') + '）' : '')
      + '\n表二危險因子 ' + r.two.riskFactors.length + ' 項'
      + (r.two.riskFactors.length ? '（' + r.two.riskFactors.join('、') + '）' : '')));

    const lookup = lipidLookupEl(root2, ctx, r);
    if (lookup) box.appendChild(lookup);

    const f = r.fibrate;
    if (f && f.ok) {
      const treatment = root.ICDLogic.lipidTreatmentStatus(f);
      const fb = R.el('section', 'lipid-block ' + treatment.className);
      fb.dataset.treatmentStatus = treatment.status;
      fb.appendChild(R.el('div', 'lipid-block-head')).appendChild(R.el('b', 'lipid-block-title', 'Fibrate'));
      // 1) 走哪一列，憑什麼（fibrate 的「級」就是官方表的那三列）
      const fLevel = R.el('p', 'lipid-level', f.route);
      if (f.why && f.why.length) {
        fLevel.appendChild(R.el('span', 'lipid-why', '（依據：' + f.why.join('、') + '）'));
      }
      fb.appendChild(fLevel);
      /* 2) 能不能直接開藥。TG ≧ 500 那一列是**不論共病**的，寫成通則會讓人以為
         無心血管疾病就一定要先做 3–6 個月（2026-08-27 使用者指出，附官方表影像）。 */
      fb.appendChild(R.el('p', 'lipid-parallel', CF.lipidPrescriptionText(f, CF.lipidFibrateParallelText(f))));
      // 3) 目標　4) 結論
      fb.appendChild(R.el('p', 'lipid-threshold', '目標 TG < ' + f.target));
      fb.appendChild(R.el('p', 'lipid-verdict', CF.lipidVerdictText(f)));
      for (const n of f.needs || []) fb.appendChild(R.el('p', 'lipid-proof', '還缺：' + n));
      box.appendChild(fb);
    }
  }

  /* 血脂給付試算的入口鈕。排在「健保規範條文」右邊、「CCr」左邊——兩個計算機都是
     「輸入數值換一個判斷」的工具，放在一起使用者只要記一個位置。
     標籤依使用者指定為 Lipid。窄欄用 seg-btn--sm 與鄰居同尺寸。 */
  function lipidButtonEl(compact) {
    const b = R.el('button', 'btn btn-secondary lipid-btn' + (compact ? ' seg-btn--sm' : ''), 'Lipid');
    b.type = 'button';
    b.id = 'lipid-btn';
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', 'lipid-panel');
    b.title = '血脂給付試算：依表一／表二算起始門檻與風險分級';
    return b;
  }

  /* 「已停經」只在女性時有意義（表二的危險因子是「女性 ≧ 55 歲**或停經者**」）。
     男性看到它只會困惑，所以直接藏起來——但藏的同時要清掉勾選，
     否則會留下「畫面上看不到、計算卻仍生效」的鬼影。 */
  function syncLipidSexRows(root2) {
    const on = root2.querySelector('#lipid-sex .lipid-sex-btn[aria-pressed="true"]');
    const female = !!on && on.dataset.lipidSex === 'female';
    const row = root2.querySelector('[data-lipid-row="menopause"]');
    if (!row) return;
    row.hidden = !female;
    if (!female) {
      const box = row.querySelector('input');
      if (box) box.checked = false;
    }
  }

  function syncLipid(root2, ctx) {
    const open = !!ctx.store.getState().lipidOpen;
    const overlay = root2.querySelector('#lipid-overlay');
    const btn = root2.querySelector('#lipid-btn');
    if (overlay) overlay.hidden = !open;
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { syncLipidSexRows(root2); renderLipidResult(root2, ctx); }
  }

  Object.assign(root.ICDRender = root.ICDRender || {}, {
    lipidButtonEl, lipidOverlayEl, renderLipidResult, syncLipid, lipidInputs,
    syncLipidSexRows, lipidResetOpenGroups, LIPID_OPEN_GROUPS, LIPID_DISCLAIMER,
  });
})(typeof self !== 'undefined' ? self : this);
