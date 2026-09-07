/* 腎功能劑量 UI。資料與判定由 ANTIBIOTIC_DOSING / ICDRenal 提供。
 * 整合：CCr 下方 append(create())；每次輸入更新都呼叫 update，無效結果也要傳入；
 * 清除病人時呼叫 reset。狀態限於本次 DOM，PiP 搬移後仍使用 root.ownerDocument。
 */
(function (host) {
  'use strict';

  const instances = new WeakMap();
  const renalStates = [
    ['stable', '穩定非透析'], ['ihd', 'IHD'], ['crrt', 'CRRT'], ['capd', 'CAPD'],
  ];

  // 並列資訊直接分行；括號內的補充保持完整，來源資料本身不改寫。
  function displayLines(text) {
    let depth = 0;
    let output = '';
    for (const ch of String(text)) {
      if ('（(【〔['.includes(ch)) depth++;
      else if ('）)】〕]'.includes(ch)) depth = Math.max(0, depth - 1);
      output += depth === 0 && (ch === '；' || ch === ';') ? '\n' : ch;
    }
    return output;
  }

  function node(root, tag, className, text) {
    const element = root.ownerDocument.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = tag === 'p' ? displayLines(text) : String(text);
    return element;
  }

  function field(root, label, tag) {
    const wrap = node(root, 'label', 'renal-field');
    const control = node(root, tag, 'renal-control');
    control.setAttribute('aria-label', label);
    wrap.append(node(root, 'span', 'renal-label', label), control);
    return {wrap, control};
  }

  function options(root, control, pairs, value) {
    control.replaceChildren();
    pairs.forEach(([key, text]) => {
      const option = node(root, 'option', '', text);
      option.value = key;
      control.append(option);
    });
    control.value = value;
  }

  function choiceField(root, label) {
    const wrap = node(root, 'div', 'renal-choice-field');
    const control = node(root, 'div', 'renal-choices');
    control.setAttribute('role', 'group');
    control.setAttribute('aria-label', label);
    wrap.append(node(root, 'span', 'renal-label', label), control);
    return {wrap, control};
  }

  function selectChoice(control, value) {
    control.dataset.value = value;
    control.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.value === value));
    });
  }

  function choices(root, control, pairs, value) {
    const buttons = Array.from(control.querySelectorAll('button'));
    // 病人輸入更新時保留相同按鈕，避免鍵盤焦點或窄欄捲動跳動。
    const same = buttons.length === pairs.length && buttons.every((button, index) =>
      button.value === pairs[index][0] && button.textContent === pairs[index][1]);
    if (!same || !control.childElementCount) {
      control.replaceChildren();
      pairs.forEach(([key, label]) => {
        const button = node(root, 'button', 'renal-chip', label);
        button.type = 'button';
        button.value = key;
        control.append(button);
      });
      if (!pairs.length) control.append(node(root, 'p', 'renal-note', '請先選藥'));
    }
    selectChoice(control, value);
  }

  function dataReady() {
    return host.ANTIBIOTIC_DOSING && Array.isArray(host.ANTIBIOTIC_DOSING.drugs)
      && host.ICDRenal && typeof host.ICDRenal.searchDrugs === 'function'
      && typeof host.ICDRenal.recommend === 'function';
  }

  function selectedDrug(state) {
    if (!dataReady()) return null;
    return host.ANTIBIOTIC_DOSING.drugs.find(drug => drug.id === state.drugId) || null;
  }

  function refreshDrugs(root, state) {
    const drugs = dataReady()
      ? host.ICDRenal.searchDrugs(host.ANTIBIOTIC_DOSING, state.search.value) : [];
    if (!drugs.some(drug => drug.id === state.drugId)) {
      state.drugId = '';
      state.regimenId = '';
    }
    options(root, state.drug, [['', drugs.length ? '請選擇藥物' : '找不到符合的藥物'],
      ...drugs.map(drug => [drug.id, drug.name])], state.drugId);
    state.drug.disabled = !drugs.length;
    state.searchHint.textContent = !dataReady() ? '劑量資料或判定模組尚未載入。'
      : drugs.length ? '符合 ' + drugs.length + ' 筆；可直接選藥或輸入學名、別名。' : '找不到符合的藥物。';
    state.searchHint.textContent = displayLines(state.searchHint.textContent);
  }

  function refreshRegimens(root, state) {
    const drug = selectedDrug(state);
    const regimens = drug ? drug.regimens : [];
    if (!regimens.some(regimen => regimen.id === state.regimenId)) state.regimenId = '';
    if (regimens.length === 1) state.regimenId = regimens[0].id;
    choices(root, state.regimen, regimens.map(regimen => [regimen.id, regimen.label]), state.regimenId);
  }

  function appendNotes(root, parent, notes) {
    (notes || []).forEach(text => parent.append(node(root, 'p', 'renal-note', text)));
  }

  function sourceLink(root, parent, label, url) {
    if (!url) return;
    // 僅使用資料提供的外部來源；不讓非 http(s) URL 成為可執行連結。
    if (!/^https?:\/\//i.test(url)) {
      parent.append(node(root, 'p', 'renal-note', '來源連結格式無效，請核對資料。'));
      return;
    }
    const link = node(root, 'a', 'renal-source-link', label);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    parent.append(link);
  }

  function sources(root, state, drug, regimen) {
    const data = host.ANTIBIOTIC_DOSING;
    const source = (regimen && regimen.source) || data.source || {};
    const footer = node(root, 'footer', 'renal-source');
    if (source.name) footer.append(node(root, 'p', '', '來源：' + source.name));
    if (source.note) footer.append(node(root, 'p', 'renal-note', source.note));
    sourceLink(root, footer, '查看藥物來源', drug.sourceUrl || source.url);
    if (drug.sourceUrl && source.url && drug.sourceUrl !== source.url) {
      sourceLink(root, footer, regimen && regimen.source ? '查看給藥與監測依據' : '查看總來源', source.url);
    }
    footer.append(node(root, 'p', '', '資料審閱：' + (source.reviewedOn || data.reviewedOn || '未提供日期')),
      node(root, 'p', '', '來源更新：' + (source.updatedOn || '未提供日期')));
    state.output.append(footer);
  }

  function rowNode(root, row, matched, indexed) {
    const item = node(root, 'li', 'renal-row' + (matched ? ' is-matched' : ''));
    item.append(node(root, 'strong', 'renal-row-label', row.label));
    appendDose(root, item, row);
    if (matched) item.append(node(root, 'span', 'renal-match-label', indexed ? '符合校正 CCr' : '符合目前 CCr'));
    if (row.manual) item.append(node(root, 'p', 'renal-note', '此列需人工核對。'));
    if (row.note) item.append(node(root, 'p', 'renal-note', row.note));
    return item;
  }

  function appendDose(root, parent, row) {
    // 多數來源將 loading 寫在 dose 內；若另有 loading 欄位也完整保留。
    if (row.loading) parent.append(node(root, 'p', 'renal-dose renal-loading', '負荷劑量：' + row.loading));
    parent.append(node(root, 'p', 'renal-dose', row.dose));
  }

  function render(root, state, keepExpanded) {
    const expanded = keepExpanded && !!state.output.querySelector('.renal-details[open]');
    state.output.replaceChildren();
    const status = node(root, 'p', 'renal-status');
    status.setAttribute('role', 'status');
    state.output.append(status);
    const drug = selectedDrug(state);
    if (!dataReady()) {
      status.textContent = '劑量資料或判定模組尚未載入。';
      return;
    }
    if (!drug) {
      status.textContent = '請選擇藥物、用藥方案與腎功能情境。';
      return;
    }
    if (state.result && state.result.ok && Number.isFinite(state.result.crclRaw)) {
      const basis = {actual:'實際體重', ideal:'理想體重', adjusted:'調整體重'}[state.result.basis];
      const current = node(root, 'div', 'renal-current');
      current.append(node(root, 'p', '', '本次 CCr ' + Math.round(state.result.crclRaw * 10) / 10 + ' mL/min'
        + (basis ? '（' + basis + ' ' + state.result.weightUsed + ' kg）' : '')));
      const edit = node(root, 'button', 'renal-edit', '回到病人輸入');
      edit.type = 'button';
      edit.addEventListener('click', () => {
        const age = root.ownerDocument.getElementById('ccr-age');
        if (age) age.focus();
      });
      current.append(edit);
      state.output.append(current);
    }
    const regimen = drug.regimens.find(item => item.id === state.regimenId);
    const renalState = state.renalState.dataset.value;
    const raw = state.result && state.result.crclRaw;
    const crcl = state.result && state.result.ok === true
      && typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : null;
    const bsa = state.result && state.result.ok === true && Number.isFinite(state.result.bsaRaw)
      && state.result.bsaRaw > 0 ? state.result.bsaRaw : null;
    const indexed = regimen && regimen.renalMetric === 'crcl-indexed';
    const metricReady = crcl !== null && (!indexed || bsa !== null);
    if (indexed && renalState === 'stable' && crcl !== null && bsa === null) {
      const fillHeight = node(root, 'button', 'renal-edit', '補填身高');
      fillHeight.type = 'button';
      fillHeight.addEventListener('click', () => {
        const height = root.ownerDocument.getElementById('ccr-height');
        if (height) height.focus();
      });
      state.output.append(fillHeight);
    }
    if (regimen && renalState === 'stable' && metricReady) {
      state.output.append(node(root, 'p', 'renal-metric', indexed
        ? '本表採校正 CCr ' + (crcl * 1.73 / bsa).toFixed(1) + ' mL/min/1.73 m²（BSA ' + bsa.toFixed(2) + ' m²）'
        : '本表採原始 CCr ' + crcl.toFixed(1) + ' mL/min'));
    }

    // 成人專用：查表不依賴病人輸入，僅個人化標示需要有效 CCr。
    if (!renalState) status.textContent = '請先選擇腎功能情境。';
    else if (!regimen) status.textContent = '請明確選擇用藥方案。';
    else {
      const manualTable = (regimen.renal || []).length > 0 && regimen.renal.every(row => row.manual);
      const answer = renalState === 'stable' && crcl === null
        ? {status: manualTable ? 'manual' : 'needs-input', rowIndex: null,
          message: manualTable ? '此方案需依來源條件個別核對；可直接查閱下方成人劑量表。'
            : indexed ? '請填年齡、實際體重、Cr 與身高，以計算校正 CCr；仍可直接查閱下方成人劑量表。'
              : '可直接查閱下方成人劑量表；完成 CCr 計算後會標示目前適用劑量。'}
        : host.ICDRenal.recommend(regimen, {crcl, bsa, renalState});
      const rows = regimen.renal || [];
      const index = Number.isInteger(answer.rowIndex) ? answer.rowIndex : -1;
      const row = rows[index];
      const matched = renalState === 'stable' && metricReady && !regimen.requiresTdm
        && answer.status === 'matched' && row && !row.manual;
      status.textContent = answer.message || '請核對來源後決定劑量。';
      status.dataset.status = answer.status;
      if (regimen.requiresTdm) {
        status.textContent = '需 TDM／個別化評估，不提供自動劑量建議；下方僅供來源對照。'
          + (answer.status !== 'matched' && answer.message ? ' ' + answer.message : '');
        status.dataset.status = 'manual';
      } else if (renalState === 'aki') {
        status.textContent = 'AKI／腎功能不穩定：不依 CCr 自動建議劑量，請個別評估並核對來源。';
        status.dataset.status = 'unstable';
      } else if (renalState !== 'stable') {
        status.textContent = '透析不使用 CCr 自動選劑量；請逐一核對透析方式、時機與各列適用條件。';
        status.dataset.status = 'dialysis';
      } else if (answer.status === 'manual' || (row && row.manual && answer.status === 'matched')) {
        const message = '此方案需依來源條件個別核對';
        status.textContent = message + (answer.status === 'manual' && answer.message
          && !answer.message.includes(message) ? '。' + answer.message : '');
        status.dataset.status = 'manual';
      }
      status.textContent = displayLines(status.textContent);
      state.output.append(node(root, 'p', 'renal-selected-drug', drug.name + '／' + regimen.label));
      if (matched) {
        const recommendation = node(root, 'div', 'renal-recommendation');
        recommendation.append(node(root, 'strong', '', '目前建議'),
          node(root, 'p', 'renal-row-label', row.label));
        appendDose(root, recommendation, row);
        if (row.note) recommendation.append(node(root, 'p', 'renal-note', row.note));
        state.output.append(recommendation);
      }
      if (indexed && metricReady && renalState === 'stable' && answer.status === 'manual' && row && !regimen.requiresTdm) {
        const alternatives = node(root, 'div', 'renal-dose-options');
        alternatives.append(node(root, 'strong', '', '目前區間的來源選項（需個別判斷）'),
          node(root, 'p', 'renal-row-label', row.label));
        appendDose(root, alternatives, row);
        if (row.note) alternatives.append(node(root, 'p', 'renal-note', row.note));
        state.output.append(alternatives);
      }
      state.output.append(node(root, 'p', 'renal-route', '給藥途徑：' + (regimen.route || '來源未提供')));
      appendNotes(root, state.output, regimen.notes);

      if (['ihd', 'capd', 'crrt', 'sled'].includes(renalState)) {
        const dialysis = node(root, 'section', 'renal-dialysis');
        dialysis.append(node(root, 'h4', '', renalStates.find(pair => pair[0] === renalState)[1] + '：來源條件對照'));
        const list = node(root, 'ul', 'renal-rows');
        const dialysisRows = (regimen.dialysis || {})[renalState] || [];
        dialysisRows.forEach(item => list.append(rowNode(root, item, false)));
        if (dialysisRows.length) dialysis.append(list);
        else dialysis.append(node(root, 'p', 'renal-note', '來源未提供此透析方式的劑量，請查核原始資料。'));
        if (regimen.dialysisSource) {
          const source = regimen.dialysisSource;
          const attribution = node(root, 'div', 'renal-dialysis-source');
          attribution.append(node(root, 'p', '', '透析來源：' + source.name));
          if (source.note) attribution.append(node(root, 'p', 'renal-note', source.note));
          sourceLink(root, attribution, '查看透析劑量依據', source.url);
          attribution.append(node(root, 'p', '', '資料審閱：' + (source.reviewedOn || '未提供日期')),
            node(root, 'p', '', '來源更新：' + (source.updatedOn || '未提供日期')));
          dialysis.append(attribution);
        }
        state.output.append(dialysis);
      }

      const details = node(root, 'details', 'renal-details');
      details.open = expanded || (renalState === 'stable' && !metricReady);
      details.append(node(root, 'summary', '', '完整腎功能劑量表（來源對照）'));
      const list = node(root, 'ul', 'renal-rows');
      rows.forEach((item, rowIndex) => list.append(rowNode(root, item, !!matched && index === rowIndex, indexed)));
      if (rows.length) details.append(list);
      else details.append(node(root, 'p', 'renal-note', '來源未提供非透析腎功能劑量列。'));
      state.output.append(details);
      state.output.append(node(root, 'p', 'renal-note',
        '劑量與負荷劑量依來源原單位呈現；mg/kg 未換算為個人總劑量。'));
    }
    appendNotes(root, state.output, drug.notes);
    sources(root, state, drug, regimen);
  }

  function create(ownerDocument) {
    // create() 維持契約；可傳入目標 document，供在另一個視窗直接新建。
    const doc = ownerDocument || host.document;
    const root = doc.createElement('section');
    root.className = 'renal-ui';
    root.setAttribute('aria-label', '抗菌藥腎功能劑量');
    root.append(node(root, 'h3', 'renal-title', '成人抗菌藥腎功能劑量'));
    const controls = node(root, 'div', 'renal-controls');
    const search = field(root, '搜尋學名或別名', 'input');
    search.control.type = 'search';
    search.control.autocomplete = 'off';
    search.control.spellcheck = false;
    const drug = field(root, '快速選藥', 'select');
    const searchHint = node(root, 'p', 'renal-search-hint');
    searchHint.setAttribute('role', 'status');
    const regimen = choiceField(root, '用藥方案');
    const renalState = choiceField(root, '腎功能情境');
    choices(root, renalState.control, renalStates, 'stable');
    controls.append(search.wrap, drug.wrap, searchHint, regimen.wrap, renalState.wrap);
    const output = node(root, 'div', 'renal-output');
    root.append(controls, output);
    const state = {search: search.control, drug: drug.control, regimen: regimen.control,
      renalState: renalState.control, searchHint, output, drugId: '', regimenId: '', result: null};
    instances.set(root, state);
    search.control.addEventListener('input', () => {
      refreshDrugs(root, state);
      refreshRegimens(root, state);
      render(root, state, false);
    });
    drug.control.addEventListener('change', () => {
      state.drugId = drug.control.value;
      state.regimenId = '';
      refreshRegimens(root, state);
      render(root, state, false);
    });
    regimen.control.addEventListener('click', event => {
      const button = event.target.closest('button.renal-chip');
      if (!button || button.parentElement !== regimen.control) return;
      state.regimenId = button.value;
      selectChoice(regimen.control, state.regimenId);
      render(root, state, false);
    });
    renalState.control.addEventListener('click', event => {
      const button = event.target.closest('button.renal-chip');
      if (!button || button.parentElement !== renalState.control) return;
      selectChoice(renalState.control, button.value);
      render(root, state, false);
    });
    refreshDrugs(root, state);
    refreshRegimens(root, state);
    render(root, state, false);
    return root;
  }

  function update(root, result) {
    const state = instances.get(root);
    if (!state) return;
    // 每次覆寫快照，不沿用先前有效的病人資料或四捨五入的 crcl。
    state.result = result ? {ok: result.ok, crclRaw: result.crclRaw, bsaRaw: result.bsaRaw,
      basis: result.basis, weightUsed: result.weightUsed} : null;
    refreshDrugs(root, state);
    refreshRegimens(root, state);
    render(root, state, true);
  }

  function reset(root) {
    const state = instances.get(root);
    if (!state) return;
    state.result = null;
    state.drugId = '';
    state.regimenId = '';
    state.search.value = '';
    selectChoice(state.renalState, 'stable');
    refreshDrugs(root, state);
    refreshRegimens(root, state);
    render(root, state, false);
  }

  host.ICDRenalUI = {create, update, reset};
})(window);
