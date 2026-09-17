/* CCr 計算機（Cockcroft-Gault）：入口鈕、浮層、輸入讀取與結果渲染。
   結果文字與剪貼簿欄位的整形在 clinical-format.js（零 DOM、有單元測試）。
   渲染規則與 R 的來源見 render-dom.js。 */
(function (root) {
  'use strict';

  // render-dom.js 已經建立這個物件（build.py 的 SOURCES 保證順序）
  const R = root.ICDRender;

  /* 計算機的純文字整形（零 DOM，獨立可測）。SOURCES 保證 clinical-format.js 先載入。 */
  const CF = root.ICDClinicalFormat;

  // ---- CCr 計算機（Cockcroft-Gault） ----
  // 三種體重並列的理由見 clinical-format.js（標籤與剪貼簿欄位共用同一份）
  const CCR_BASIS_LABEL = CF.CCR_BASIS_LABEL;
  const CCR_DISCLAIMER = 'Cockcroft-Gault 估計值，僅適用腎功能穩定者。'
    + '可能高估 GFR 10–20%，體重過輕或肥胖時更不準\n實際劑量請依藥品仿單與臨床判斷。';

  /* 入口鈕掛在「健保規範條文」那一排（血脂計算機右邊），不在 header。原本排在 header 的
     「日期」右邊，但那是「開始看這一診」的位置；CCr 是查到腎功能才會用的偶發工具，
     與血脂試算同性質，兩個計算機放在一起使用者只要記一個位置。

     **不要宣稱這樣 header 就變矮了**：實測 .dock-tools 需要的寬度 249.3→218.1，
     可用只有 163，搬走之後仍然折成兩列，1c 的 .dock-head 一樣是 92px。
     真正省到的只有 231–262px 這一段寬度（見 docs/dense-ui-principle.md）。 */
  function ccrButtonEl(compact) {
    const b = R.el('button', 'btn btn-secondary ccr-btn' + (compact ? ' seg-btn--sm' : ''), 'CCr');
    b.type = 'button';
    b.id = 'ccr-btn';
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', 'ccr-panel');
    b.title = '肌酸酐廓清率（Cockcroft-Gault）：抗生素劑量調整用';
    return b;
  }

  function ccrFieldEl(id, label, unit, opts) {
    const wrap = R.el('label', 'ccr-field');
    wrap.append(R.el('span', 'ccr-label', label));
    const input = document.createElement('input');
    input.id = id;
    input.className = 'input ccr-input';
    input.type = 'number';
    input.inputMode = 'decimal';
    input.autocomplete = 'off';
    input.step = (opts && opts.step) || '1';
    if (opts && opts.placeholder) input.placeholder = opts.placeholder;
    wrap.append(input, R.el('span', 'ccr-unit', unit));
    return wrap;
  }

  function ccrOverlayEl() {
    const overlay = R.el('div', 'ccr-overlay');
    overlay.id = 'ccr-overlay';
    overlay.hidden = true;
    const panel = R.el('div', 'ccr-panel');
    panel.id = 'ccr-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'ccr-title');

    const head = R.el('div', 'ccr-head');
    const title = R.el('h2', 'ccr-title', 'CCr／抗菌藥劑量');
    title.id = 'ccr-title';
    const close = R.el('button', 'ccr-close', '關閉');
    close.type = 'button';
    close.id = 'ccr-close';
    close.title = '關閉（Esc，或點面板以外任一處）';
    head.append(title, close);

    const form = R.el('div', 'ccr-form');
    const sexRow = R.el('div', 'seg-row ccr-sex');
    sexRow.id = 'ccr-sex';
    sexRow.setAttribute('role', 'group');
    sexRow.setAttribute('aria-label', '性別');
    for (const pair of [['male', '男'], ['female', '女']]) {
      const b = R.el('button', 'seg-btn ccr-sex-btn', pair[1]);
      b.type = 'button';
      b.dataset.ccrSex = pair[0];
      b.setAttribute('aria-pressed', pair[0] === 'male' ? 'true' : 'false');
      if (pair[0] === 'male') b.classList.add('is-on');
      sexRow.appendChild(b);
    }
    form.append(sexRow,
      ccrFieldEl('ccr-age', '年齡', '歲'),
      ccrFieldEl('ccr-weight', '體重', 'kg', { step: '0.1' }),
      ccrFieldEl('ccr-height', '身高', 'cm', { placeholder: '選填' }),
      ccrFieldEl('ccr-cr', 'Cr', 'mg/dL', { step: '0.01' }));

    const result = R.el('div', 'ccr-result');
    result.id = 'ccr-result';
    result.setAttribute('aria-live', 'polite');

    const actions = R.el('div', 'ccr-actions');
    const copy = R.el('button', 'btn ccr-copy', '複製結果');
    copy.type = 'button';
    copy.id = 'ccr-copy';
    copy.disabled = true;
    const reset = R.el('button', 'btn btn-secondary ccr-reset', '清除');
    reset.type = 'button';
    reset.id = 'ccr-reset';
    const lookup = R.el('button', 'btn btn-secondary', '查抗菌藥');
    lookup.type = 'button';
    lookup.id = 'ccr-antibiotics';
    lookup.addEventListener('click', () => {
      const search = panel.querySelector('.renal-ui input[type="search"]');
      if (search) search.focus();
    });
    actions.append(lookup, copy, reset);

    panel.append(head, form, result, actions, R.el('p', 'ccr-disclaimer', CCR_DISCLAIMER));
    panel.appendChild(root.ICDRenalUI.create());
    overlay.appendChild(panel);
    return overlay;
  }

  /* 從面板讀值。刻意不經過 store：這些是「這一位病人」的數字，每敲一鍵就寫進全域狀態
     會連帶重繪整個版面，也讓它多一條被持久化的路。 */
  function ccrInputs(root2) {
    const val = (id) => {
      const node = root2.querySelector('#' + id);
      return node ? String(node.value).trim() : '';
    };
    const on = root2.querySelector('#ccr-sex .ccr-sex-btn[aria-pressed="true"]');
    return {
      sex: on ? on.dataset.ccrSex : 'male',
      age: val('ccr-age'),
      weightKg: val('ccr-weight'),
      heightCm: val('ccr-height'),
      creatinine: val('ccr-cr'),
    };
  }

  function ccrAltRow(key, kg, value, activeKey) {
    const line = R.el('div', 'ccr-alt-row' + (key === activeKey ? ' is-on' : ''));
    line.append(R.el('span', 'ccr-alt-name', CCR_BASIS_LABEL[key]),
                R.el('span', 'ccr-alt-kg', kg + ' kg'),
                R.el('span', 'ccr-alt-val', String(value)));
    return line;
  }

  function renderCcrResult(root2, ctx) {
    const box = root2.querySelector('#ccr-result');
    const copy = root2.querySelector('#ccr-copy');
    if (!box) return null;
    R.clear(box);
    const input = ccrInputs(root2);
    const r = ctx.logic.creatinineClearance(input);
    root.ICDRenalUI.update(root2.querySelector('.renal-ui'), r);
    if (copy) copy.disabled = !(r && r.ok);
    if (!r || !r.ok) {
      box.appendChild(R.el('p', 'ccr-hint', '填年齡、體重、Cr 就會算\n身高選填。'));
      return r;
    }

    const main = R.el('div', 'ccr-main');
    main.append(R.el('strong', 'ccr-value', String(r.crcl)), R.el('span', 'ccr-value-unit', 'mL/min'));
    box.appendChild(main);
    if (Number.isFinite(r.bsaRaw) && Number.isFinite(r.crclIndexedRaw)) {
      box.appendChild(R.el('p', 'ccr-bsa', 'BSA ' + r.bsaRaw.toFixed(2) + ' m²（Mosteller，實際體重）'
        + '\n校正 CCr ' + r.crclIndexedRaw.toFixed(1) + ' mL/min/1.73 m²'));
    }

    box.appendChild(R.el('p', 'ccr-basis',
      '以' + CCR_BASIS_LABEL[r.basis] + ' ' + r.weightUsed + ' kg 計算'
      + (r.bmi === null ? '' : '（BMI ' + r.bmi + '）')));

    if (r.range !== null) {
      const lo = Math.min(r.crcl, r.range);
      const hi = Math.max(r.crcl, r.range);
      box.appendChild(R.el('p', 'ccr-range',
        '範圍 ' + lo + '–' + hi + '（另一端＝' + CCR_BASIS_LABEL[r.rangeBasis] + '）'));
    }

    if (r.hasHeight && r.ibw !== null) {
      const actualKg = Math.round(Number(input.weightKg) * 10) / 10;
      const table = R.el('div', 'ccr-alt');
      table.append(ccrAltRow('actual', actualKg, r.actual, r.basis),
                   ccrAltRow('ideal', r.ibw, r.ideal, r.basis),
                   ccrAltRow('adjusted', r.adjbw, r.adjusted, r.basis));
      box.appendChild(table);
    } else {
      box.appendChild(R.el('p', 'ccr-hint',
        '填身高就會依 BMI 自動選用理想／調整體重——體重極端時那才是建議的算法。'));
    }
    return r;
  }

  function syncCcr(root2, ctx) {
    const open = !!ctx.store.getState().ccrOpen;
    const overlay = root2.querySelector('#ccr-overlay');
    const btn = root2.querySelector('#ccr-btn');
    if (overlay) overlay.hidden = !open;
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) renderCcrResult(root2, ctx);
  }

  Object.assign(root.ICDRender = root.ICDRender || {}, {
    ccrButtonEl, ccrOverlayEl, renderCcrResult, syncCcr, ccrInputs,
    CCR_DISCLAIMER, CCR_BASIS_LABEL,
  });
})(typeof self !== 'undefined' ? self : this);
