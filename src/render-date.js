/* 日期計算器：三種版面共用，事件隨 DOM 移入 PiP，輸入僅保留於本次頁面。 */
(function (root) {
  'use strict';
  const R = root.ICDRender;
  const draft = {start: null, direction: 'after', days: ''};

  function dateCalcButtonEl(compact) {
    const b = R.el('button', 'btn btn-secondary date-calc-btn' + (compact ? ' seg-btn--sm' : ''), 'Date');
    b.type = 'button'; b.id = 'date-calc-btn'; b.title = '日期計算器：往前或往後滿幾天';
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-controls', 'date-calc-panel');
    b.setAttribute('aria-expanded', 'false');
    return b;
  }

  function dateCalcOverlayEl() {
    const overlay = R.el('div', 'date-calc-overlay');
    overlay.id = 'date-calc-overlay'; overlay.hidden = true;
    const panel = R.el('section', 'date-calc-panel'); panel.id = 'date-calc-panel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'date-calc-title');
    const head = R.el('div', 'date-calc-head');
    const title = R.el('h2', null, '日期計算器'); title.id = 'date-calc-title';
    const close = R.el('button', 'btn btn-secondary', '關閉'); close.type = 'button'; close.id = 'date-calc-close';
    head.append(title, close);
    const form = R.el('div', 'date-calc-form');
    function field(key, label, type) {
      const wrap = R.el('div', 'date-calc-field');
      const input = R.el(type === 'select' ? 'select' : 'input', 'input');
      input.id = 'date-calc-' + key; input.dataset.dateCalcKey = key;
      if (type !== 'select') {input.type = type; input.autocomplete = 'off';}
      const caption = R.el('label', null, label); caption.htmlFor = input.id;
      wrap.append(caption, input); form.appendChild(wrap);
      return input;
    }
    const start = field('start', '起算日期', 'date');
    start.min = '0001-01-01'; start.max = '9999-12-31';
    const direction = field('direction', '方向', 'select');
    for (const [value, label] of [['after', '往後（滿幾天）'], ['before', '往前']]) {
      const option = R.el('option', null, label); option.value = value; direction.appendChild(option);
    }
    const days = field('days', '天數', 'number');
    days.min = '0'; days.step = '1'; days.inputMode = 'numeric'; days.placeholder = '輸入天數';
    const result = R.el('div', 'date-calc-result'); result.id = 'date-calc-result';
    result.setAttribute('role', 'status'); result.setAttribute('aria-live', 'polite'); result.setAttribute('aria-atomic', 'true');
    const note = R.el('p', 'date-calc-note', '起算日為第 0 天，滿 1 天為隔天。');
    note.id = 'date-calc-note'; days.setAttribute('aria-describedby', note.id);
    panel.append(head, form, result, note); overlay.appendChild(panel);
    function recalculate() {
      draft.start = start.value; draft.direction = direction.value; draft.days = days.value;
      const calculated = root.ICDDateCalculator.calculate(draft.start, draft.days, draft.direction);
      R.clear(result);
      if (!calculated.ok) {result.appendChild(R.el('p', 'date-calc-hint', calculated.error)); return;}
      result.append(R.el('p', 'date-calc-summary', (direction.value === 'before' ? '往前 ' : '往後滿 ') + Number(days.value) + ' 天'),
        R.el('strong', 'date-calc-value', calculated.label), R.el('p', 'date-calc-weekday', calculated.weekday));
    }
    form.addEventListener('input', recalculate);
    form.addEventListener('change', recalculate);
    // 第一次打開時才取本機今天，避免跨午夜後仍帶著載入頁面當時的日期。
    overlay.initialize = () => {
      if (draft.start === null) {
        const today = new Date();
        draft.start = [String(today.getFullYear()).padStart(4, '0'), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
      }
      start.value = draft.start; direction.value = draft.direction; days.value = draft.days;
      recalculate();
    };
    return overlay;
  }

  function syncDateCalc(container, ctx) {
    const overlay = container.querySelector('#date-calc-overlay');
    const entry = container.querySelector('#date-calc-btn');
    if (!overlay || !entry) return;
    if (!overlay.dataset.bound) {
      overlay.dataset.bound = 'true';
      const close = () => {ctx.store.setDateCalcOpen(false); entry.focus({preventScroll: true});};
      entry.addEventListener('click', ev => {ev.stopPropagation(); ctx.store.setDateCalcOpen(true);});
      overlay.addEventListener('click', ev => {
        if (ev.target === overlay || ev.target.closest('#date-calc-close')) {
          ev.stopPropagation(); close();
        }
      });
      overlay.addEventListener('keydown', ev => {
        if (ev.isComposing || ev.keyCode === 229) return;
        if (ev.key === 'Escape') {ev.preventDefault(); ev.stopPropagation(); close(); return;}
        if (ev.key !== 'Tab') return;
        const nodes = Array.from(overlay.querySelectorAll('button,input,select')).filter(e => !e.disabled && e.getClientRects().length);
        const first = nodes[0], last = nodes[nodes.length - 1], active = overlay.ownerDocument.activeElement;
        if (ev.shiftKey && active === first) {ev.preventDefault(); last.focus();}
        else if (!ev.shiftKey && active === last) {ev.preventDefault(); first.focus();}
      });
    }
    const open = !!ctx.store.getState().dateCalcOpen;
    if (open && overlay.hidden) {
      overlay.initialize(); overlay.hidden = false;
      overlay.querySelector('#date-calc-start').focus({preventScroll: true});
    } else if (!open) overlay.hidden = true;
    entry.setAttribute('aria-expanded', String(open));
  }

  Object.assign(R, {dateCalcButtonEl, dateCalcOverlayEl, syncDateCalc});
})(typeof self !== 'undefined' ? self : this);
