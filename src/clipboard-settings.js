/* 設定內的剪貼簿編輯頁。事件委派掛在本頁，搬入 PiP 後仍使用同一份控制器。 */
(function (root) {
  'use strict';
  const mounted = new WeakMap();
  function mount(pop, ctx) {
    if (!pop) return;
    if (mounted.has(pop)) { mounted.get(pop)(); return; }
    const C = root.ICDClipboard;
    const doc = pop.ownerDocument;
    const node = (tag, text, id) => {
      const n = doc.createElement(tag);
      if (text) n.textContent = text;
      if (id) n.id = id;
      return n;
    };
    const button = (text, id) => {
      const n = node('button', text, id); n.type = 'button'; n.className = 'btn btn-secondary'; return n;
    };
    const general = node('div'); general.className = 'settings-general';
    general.append(...Array.from(pop.childNodes));
    const open = button('剪貼簿輸出…', 'clipboard-open');
    general.prepend(open);
    const editor = node('div', '', 'clipboard-editor');
    editor.hidden = true;
    editor.className = 'clipboard-editor';
    pop.append(general, editor);
    editor.append(button('返回設定', 'clipboard-back'), node('strong', '剪貼簿輸出'));
    editor.append(node('p', '選擇輸出項目，再修改範本。點選欄位可插入游標位置；儲存後才套用。'));
    const kindSelect = node('select', '', 'clipboard-kind');
    for (const [key, def] of Object.entries(C.defs)) {
      const opt = node('option', def.label); opt.value = key; kindSelect.append(opt);
    }
    const presetSelect = node('select', '', 'clipboard-preset');
    function labelled(label, input) {
      const wrap = node('label'); wrap.append(node('span', label), input); return wrap;
    }
    editor.append(labelled('輸出項目', kindSelect), labelled('套用預設格式', presetSelect));
    const fields = node('div'); fields.className = 'clipboard-fields'; editor.append(fields);
    const hint = node('p', '', 'clipboard-hint'); editor.append(hint);
    const error = node('p', '', 'clipboard-error'); error.setAttribute('role', 'alert'); editor.append(error);
    editor.append(node('strong', '即時預覽（使用範例資料）'));
    const preview = node('pre', '', 'clipboard-preview'); editor.append(preview);
    const actions = node('div'); actions.className = 'settings-row';
    const save = button('儲存此項', 'clipboard-save');
    actions.append(save, button('還原此項預設', 'clipboard-reset')); editor.append(actions);
    const message = node('p', '', 'clipboard-message'); message.setAttribute('role', 'status'); editor.append(message);
    const warning = node('p', '', 'clipboard-warning'); warning.setAttribute('role', 'status'); editor.append(warning);
    const updateWarning = () => {
      warning.textContent = ctx.store.getState().clipboardWarning || (ctx.store.storage.available ? '' : '目前瀏覽器無法保存設定，這次開啟期間仍可使用。');
    };
    mounted.set(pop, updateWarning);
    const drafts = {};
    let kind = 'date';
    let presetList = [];
    function current() {
      const cfg = {};
      for (const field of fields.querySelectorAll('[data-config-key]')) cfg[field.dataset.configKey] = field.value;
      return cfg;
    }
    function sample() {
      if (kind === 'date') return new Date(2026, 8, 16);
      if (kind === 'cart') return [{ code: 'I10', zh: '本態性高血壓' }, { code: 'E11.9', zh: '第2型糖尿病伴無併發症' }];
      if (kind === 'single') return { code: 'I10', zh: '本態性高血壓' };
      if (kind === 'ccr') {
        const r = ctx.logic.creatinineClearance({ age: 60, weightKg: 70, creatinine: 1, heightCm: 170, sex: 'male' });
        return root.ICDRender.ccrClipboardData(r);
      }
      const input = { age: 40, sex: 'male', ldl: 180, tc: 220, hdl: 55, tg: 550 };
      return root.ICDRender.lipidClipboardData(ctx.logic.lipidCoverage(input), input);
    }
    function updatePreview() {
      const config = current();
      const errors = C.validate(kind, config);
      error.textContent = errors.join('\n');
      save.disabled = errors.length > 0;
      preview.textContent = errors.length ? '請修正範本後再預覽。' : C.format(kind, sample(), { [kind]: config });
      hint.textContent = kind === 'lipid'
        ? '使用 {表一}、{表二}、{Fibrate} 才會套用下方段落範本；{完整結果} 保留現行完整文字。'
        : kind === 'cart' ? '整體範本中的 {清單} 會套用單筆範本與筆間分隔。筆間分隔直接輸入換行即可。' : '';
    }
    function renderFields(config) {
      fields.replaceChildren();
      const d = C.defs[kind];
      for (const [key, title, tokens] of [
        ['template', '整體範本', d.fields], ['itemTemplate', '單筆範本', d.itemFields],
        ['separator', '筆間分隔（可換行）', kind === 'cart' ? [] : null],
        ['sectionTemplate', '各表段落範本', d.sectionFields],
      ]) {
        if (!tokens) continue;
        const area = node('textarea', '', 'clipboard-' + key);
        area.rows = key === 'separator' ? 2 : key === 'sectionTemplate' ? 6 : 4;
        area.maxLength = key === 'separator' ? 100 : 12000;
        area.dataset.configKey = key;
        area.value = config[key];
        area.spellcheck = false;
        fields.append(labelled(title, area));
        const tokenRow = node('div'); tokenRow.className = 'clipboard-tokens';
        for (const token of tokens) {
          const insert = button(token);
          insert.dataset.clipboardToken = token;
          insert.dataset.targetField = key;
          insert.title = '插入 {' + token + '}';
          tokenRow.append(insert);
        }
        fields.append(tokenRow);
      }
      updatePreview();
    }
    function selectKind() {
      kind = kindSelect.value;
      presetList = C.presets(kind, ctx.store.getState().format);
      presetSelect.replaceChildren();
      const custom = node('option', '自訂／目前設定'); custom.value = ''; presetSelect.append(custom);
      presetList.forEach((preset, i) => {
        const opt = node('option', preset.label); opt.value = String(i); presetSelect.append(opt);
      });
      renderFields(drafts[kind] || ctx.store.getState().clipboardFormats[kind] || C.defaults(kind, ctx.store.getState().format));
      message.textContent = '';
    }
    pop.addEventListener('click', ev => {
      const target = ev.target.closest('button');
      if (!target) return;
      if (target === open) {
        ev.stopPropagation();
        general.hidden = true; editor.hidden = false; pop.classList.add('is-clipboard');
        selectKind(); updateWarning(); kindSelect.focus();
      } else if (editor.contains(target)) {
        ev.stopPropagation();
        if (target.id === 'clipboard-back') {
          general.hidden = false; editor.hidden = true; pop.classList.remove('is-clipboard'); open.focus();
        } else if (target.dataset.clipboardToken) {
          const area = fields.querySelector('#clipboard-' + target.dataset.targetField);
          area.setRangeText('{' + target.dataset.clipboardToken + '}', area.selectionStart, area.selectionEnd, 'end');
          area.focus(); updatePreview(); drafts[kind] = current(); message.textContent = '尚未儲存';
        } else if (target === save) {
          if (ctx.store.setClipboardFormat(kind, current())) {
            delete drafts[kind];
            message.textContent = '已儲存，後續複製將使用此格式。'; updateWarning();
          }
        } else if (target.id === 'clipboard-reset') {
          ctx.store.resetClipboardFormat(kind); delete drafts[kind]; selectKind();
          message.textContent = '已還原此項預設格式。'; updateWarning();
        }
      }
    });
    editor.addEventListener('input', ev => {
      if (!ev.target.matches('textarea')) return;
      presetSelect.value = ''; updatePreview(); drafts[kind] = current(); message.textContent = '尚未儲存';
    });
    editor.addEventListener('change', ev => {
      if (ev.target === kindSelect) selectKind();
      if (ev.target === presetSelect && presetSelect.value !== '') {
        renderFields(presetList[Number(presetSelect.value)].config); drafts[kind] = current(); message.textContent = '尚未儲存';
      }
    });
    updateWarning();
  }
  root.ICDClipboardUI = { mount };
})(typeof self !== 'undefined' ? self : this);
