/* UI 層：依賴 window.ICDLogic 與 window.CURATED（build.py 注入）。 */
(function () {
  'use strict';
  const $ = (sel) => document.querySelector(sel);
  let index = null;
  const cart = [];            // [{code, zh}]
  let mode = 'im';            // 'im' | 'surg'

  // ---- 資料載入 ----
  async function loadCodes() {
    const b64 = $('#icd-data').textContent.trim();
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return JSON.parse(await new Response(stream).text());
  }

  // 蒐集所有人工精選（CURATED）出現過的代碼，供搜尋排序優先顯示
  function collectCuratedCodes(C) {
    const set = new Set();
    const addPairs = (list) => { for (const [code] of list) set.add(code); };
    addPairs(C.chronic);
    addPairs(C.infectious);
    addPairs(C.pathogens);
    addPairs(C.surgicalQuick);
    for (const p of C.symptoms) addPairs(p.codes);
    for (const p of C.surgicalPanels) addPairs(p.codes);
    for (const [code, list] of Object.entries(C.related)) {
      set.add(code);
      for (const c of list) set.add(c);
    }
    return set;
  }

  // ---- 渲染 ----
  function chip(code, label, cls) {
    const row = index.byCode.get(code);
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'chip' + (cls ? ' ' + cls : '');
    el.dataset.code = code;
    const zh = row ? row[3] : '';
    el.innerHTML = '<b></b><span></span>';
    el.querySelector('b').textContent = code;
    el.querySelector('span').textContent = label || zh;
    el.title = row ? code + ' ' + row[3] + '\n' + row[2] : code;
    return el;
  }

  function renderPanels() {
    const panels = mode === 'im' ? window.CURATED.symptoms : window.CURATED.surgicalPanels;
    $('#panels-title').textContent = mode === 'im' ? '症狀導向（內科）' : '常見情境（外科）';
    const host = $('#panels');
    host.textContent = '';
    for (const p of panels) {
      const div = document.createElement('div');
      div.className = 'panel';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = p.name;
      btn.addEventListener('click', () => div.classList.toggle('open'));
      const body = document.createElement('div');
      for (const [code, label] of p.codes) body.appendChild(chip(code, label));
      div.append(btn, body);
      host.appendChild(div);
    }
  }

  function renderQuick() {
    const host = $('#quick');
    host.textContent = '';
    const groups = mode === 'im'
      ? [['常用慢性病', window.CURATED.chronic], ['感染科常用', window.CURATED.infectious], ['病原體附加碼／抗藥性', window.CURATED.pathogens]]
      : [['外科常用', window.CURATED.surgicalQuick], ['病原體附加碼／抗藥性', window.CURATED.pathogens]];
    for (const [title, list] of groups) {
      const h = document.createElement('h2');
      h.textContent = title;
      host.appendChild(h);
      for (const [code, label] of list) host.appendChild(chip(code, label));
    }
  }

  function renderCart() {
    const ul = $('#cart');
    ul.textContent = '';
    for (const item of cart) {
      const li = document.createElement('li');
      li.dataset.code = item.code;
      li.innerHTML = '<b></b><span></span><button title="移除">✕</button>';
      li.querySelector('b').textContent = item.code;
      li.querySelector('span').textContent = item.zh;
      li.querySelector('button').addEventListener('click', () => {
        cart.splice(cart.findIndex((x) => x.code === item.code), 1);
        renderCart();
        if (!cart.length) resetRelated();
      });
      ul.appendChild(li);
    }
  }

  function renderRelated(code) {
    const host = $('#related');
    host.textContent = '';
    const curated = (window.CURATED.related[code] || []).filter((c) => !cart.some((x) => x.code === c));
    const fam = window.ICDLogic.family(index, code, 20).filter((r) => !cart.some((x) => x.code === r[0]));
    if (curated.length) {
      const lb = document.createElement('div');
      lb.className = 'group-label';
      lb.textContent = '臨床常一併評估（' + code + '）';
      host.appendChild(lb);
      for (const c of curated) host.appendChild(chip(c, ''));
    }
    if (fam.length) {
      const lb = document.createElement('div');
      lb.className = 'group-label';
      lb.textContent = '同類目其他碼（' + code.slice(0, 3) + '）';
      host.appendChild(lb);
      for (const r of fam) host.appendChild(chip(r[0], ''));
    }
    if (!curated.length && !fam.length) host.innerHTML = '<span style="color:var(--dim);font-size:13px">無相關碼建議。</span>';
  }

  function resetRelated() {
    $('#related').innerHTML = '<span style="color:var(--dim);font-size:13px">加入代碼後，這裡會列出建議一併評估的診斷碼。</span>';
  }

  function renderResults(rows) {
    const card = $('#results-card');
    const host = $('#search-results');
    host.textContent = '';
    if (!rows) { card.classList.add('hidden'); return; }
    card.classList.remove('hidden');
    if (!rows.length) { host.innerHTML = '<span style="color:var(--dim)">查無結果，試試英文或代碼前綴。</span>'; return; }
    for (const r of rows) host.appendChild(chip(r[0], '', r[1] === 1 ? '' : 'cat'));
  }

  // ---- 動作 ----
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._h);
    toast._h = setTimeout(() => t.classList.remove('show'), 1600);
  }

  function addCode(code) {
    const row = index.byCode.get(code);
    if (!row || row[1] !== 1) return;
    if (cart.some((x) => x.code === code)) { toast(code + ' 已在清單'); return; }
    cart.push({ code, zh: row[3] });
    renderCart();
    renderRelated(code);
    toast('已加入 ' + code);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        if (ok) return true;
      } catch (e2) { /* fall through */ }
      const box = $('#fallback-copy');
      box.style.display = 'flex';
      box.querySelector('textarea').value = text;
      return false;
    }
  }

  async function copyCart(fmt) {
    if (!cart.length) { toast('清單是空的'); return; }
    if (await copyText(window.ICDLogic.formatCart(cart, fmt))) toast('已複製 ' + cart.length + ' 個代碼');
  }

  function setMode(m) {
    mode = m;
    $('#mode-im').classList.toggle('active', m === 'im');
    $('#mode-surg').classList.toggle('active', m === 'surg');
    renderPanels();
    renderQuick();
  }

  // ---- 事件 ----
  function wire() {
    document.body.addEventListener('click', (ev) => {
      const c = ev.target.closest('.chip');
      if (c && !c.classList.contains('cat')) addCode(c.dataset.code);
    });
    let debounce = null;
    $('#search').addEventListener('input', (ev) => {
      clearTimeout(debounce);
      const q = ev.target.value;
      debounce = setTimeout(() => {
        renderResults(q.trim().length >= 2 ? window.ICDLogic.search(index, q, 50) : null);
      }, 150);
    });
    $('#mode-im').addEventListener('click', () => setMode('im'));
    $('#mode-surg').addEventListener('click', () => setMode('surg'));
    $('#copy-lines').addEventListener('click', () => copyCart('lines'));
    $('#copy-comma').addEventListener('click', () => copyCart('comma'));
    $('#copy-names').addEventListener('click', () => copyCart('names'));
    $('#clear-cart').addEventListener('click', () => { cart.length = 0; renderCart(); resetRelated(); });
    const fb = $('#fallback-copy');
    fb.addEventListener('click', (ev) => { if (ev.target === fb) fb.style.display = 'none'; });
  }

  // ---- 啟動 ----
  async function init() {
    if (typeof DecompressionStream === 'undefined') {
      $('#status').textContent = '瀏覽器過舊：請使用 Edge 或 Chrome 80 以上版本。';
      return;
    }
    try {
      const db = await loadCodes();
      index = window.ICDLogic.buildIndex(db, collectCuratedCodes(window.CURATED));
      renderPanels();
      renderQuick();
      wire();
      $('#status').textContent = '已載入 ' + db.length.toLocaleString() + ' 筆';
      document.body.dataset.ready = '1';
    } catch (e) {
      $('#status').textContent = '資料載入失敗：' + e.message;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
