/* UI 層：依賴 window.ICDLogic 與 window.CURATED（build.py 注入）。 */
(function () {
  'use strict';
  const $ = (sel) => document.querySelector(sel);
  let index = null;
  const cart = [];            // [{code, zh}]
  let mode = 'outpatient';    // 'emergency' | 'outpatient' | 'surg'
  let activeRegion = 0;
  // 每個模式各一份症狀相關碼查表，避免急診紅旗碼洩漏到門診
  let symptomRelated = { emergency: {}, outpatient: {} };
  let relatedCode = null;     // 目前相關碼面板所依據的代碼

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
    addPairs(C.emergencyQuick);
    for (const p of C.surgicalPanels) addPairs(p.codes);
    const addInternal = (regions) => {
      for (const region of regions || []) {
        for (const panel of region.panels) {
          for (const field of ['chief', 'diseases', 'redFlags']) addPairs(panel[field] || []);
          for (const [code, values] of Object.entries(panel.related || {})) {
            set.add(code);
            for (const value of values) set.add(value);
          }
        }
      }
    };
    addInternal(C.internalEmergency);
    addInternal(C.internalOutpatient);
    for (const [code, list] of Object.entries(C.related)) {
      set.add(code);
      for (const c of list) set.add(c);
    }
    return set;
  }

  // 單一模式（急診或門診）的症狀相關碼查表；不同模式不得互相合併
  function flattenSymptomRelated(regions) {
    const out = {};
    for (const region of regions || []) {
      for (const panel of region.panels) {
        for (const [code, values] of Object.entries(panel.related || {})) {
          out[code] = window.ICDLogic.mergeRelated(out[code], values);
        }
      }
    }
    return out;
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

  function renderCodeGroup(host, title, pairs, className) {
    if (!pairs || !pairs.length) return;
    const group = document.createElement('div');
    group.className = 'code-group ' + className;
    const label = document.createElement('div');
    label.className = 'group-label';
    label.textContent = title;
    group.appendChild(label);
    for (const [code, text] of pairs) group.appendChild(chip(code, text));
    host.appendChild(group);
  }

  function renderInternalPanels(regions) {
    const nav = $('#region-nav');
    const host = $('#panels');
    nav.hidden = false;
    host.textContent = '';
    if (!regions.length) return;
    if (activeRegion >= regions.length) activeRegion = 0;
    nav.textContent = '';
    regions.forEach((region, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'region-btn' + (i === activeRegion ? ' active' : '');
      button.dataset.region = region.name;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', i === activeRegion ? 'true' : 'false');
      button.textContent = region.name;
      button.addEventListener('click', () => {
        activeRegion = i;
        renderInternalPanels(regions);
      });
      nav.appendChild(button);
    });

    const grid = document.createElement('div');
    grid.className = 'symptom-grid';
    for (const panel of regions[activeRegion].panels) {
      const card = document.createElement('article');
      card.className = 'symptom-card';
      card.dataset.panel = panel.name;
      const title = document.createElement('h3');
      title.textContent = panel.name;
      card.appendChild(title);
      renderCodeGroup(card, '主訴／症狀碼', panel.chief, 'chief-group');
      renderCodeGroup(card, '常見相關疾病', panel.diseases, 'disease-group');
      renderCodeGroup(card, '急診優先排除／提醒評估', mode === 'emergency' ? panel.redFlags : [], 'redflag-group');
      grid.appendChild(card);
    }
    host.appendChild(grid);
  }

  function renderSurgicalPanels() {
    const nav = $('#region-nav');
    const host = $('#panels');
    nav.hidden = true;
    host.textContent = '';
    for (const panel of window.CURATED.surgicalPanels) {
      const div = document.createElement('div');
      div.className = 'panel';
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = panel.name;
      button.addEventListener('click', () => div.classList.toggle('open'));
      const body = document.createElement('div');
      for (const [code, label] of panel.codes) body.appendChild(chip(code, label));
      div.append(button, body);
      host.appendChild(div);
    }
  }

  function renderPanels() {
    if (mode === 'surg') {
      $('#panels-title').textContent = '常見情境（外科）';
      $('#mode-hint').textContent = '選擇傷口、外傷或術後情境';
      renderSurgicalPanels();
      return;
    }
    const regions = mode === 'emergency' ? window.CURATED.internalEmergency : window.CURATED.internalOutpatient;
    $('#panels-title').textContent = mode === 'emergency' ? '內科急診｜依身體部位' : '內科門診｜依身體部位';
    $('#mode-hint').textContent = mode === 'emergency'
      ? '先看主訴，再複核優先排除項目'
      : '先選部位，再選主訴或常見疾病';
    renderInternalPanels(regions);
  }

  function renderQuick() {
    const host = $('#quick');
    host.textContent = '';
    const groups = mode === 'emergency'
      ? [['急診常見評估', window.CURATED.emergencyQuick], ['感染科常用', window.CURATED.infectious], ['病原體附加碼／抗藥性', window.CURATED.pathogens]]
      : mode === 'outpatient'
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
      li.innerHTML = '<b title="點擊複製此碼"></b><span></span><button title="移除">✕</button>';
      li.querySelector('b').textContent = item.code;
      li.querySelector('b').addEventListener('click', async () => {
        if (await copyText(item.code)) toast('已複製 ' + item.code);
      });
      li.querySelector('span').textContent = item.zh;
      li.querySelector('button').addEventListener('click', () => {
        cart.splice(cart.findIndex((x) => x.code === item.code), 1);
        renderCart();
        // 移除後相關碼要重算，被移除的碼才會回到建議清單
        if (!cart.length) resetRelated();
        else if (relatedCode) renderRelated(relatedCode);
      });
      ul.appendChild(li);
    }
  }

  function renderRelated(code) {
    const host = $('#related');
    host.textContent = '';
    relatedCode = code;
    const inCart = (candidate) => cart.some((x) => x.code === candidate);
    // 外科模式只用全域 related.json；內科則另加「當前模式」的症狀相關碼
    const modeRelated = symptomRelated[mode] || {};
    const curated = window.ICDLogic.mergeRelated(
      window.CURATED.related[code],
      modeRelated[code]
    ).filter((c) => !inCart(c));
    const curatedSet = new Set(curated);
    const fam = window.ICDLogic.family(index, code, 20)
      .filter((r) => !inCart(r[0]) && !curatedSet.has(r[0]));
    if (curated.length) {
      const lb = document.createElement('div');
      lb.className = 'group-label';
      lb.textContent = '常見相關疾病／評估（' + code + '）';
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
    const relatedWrap = $('#related-wrap');
    relatedWrap.classList.remove('flash');
    void relatedWrap.offsetWidth;
    relatedWrap.classList.add('flash');
    if (window.matchMedia('(max-width: 900px)').matches) {
      relatedWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function resetRelated() {
    relatedCode = null;
    $('#related').innerHTML = '<span style="color:var(--dim);font-size:13px">加入代碼後，這裡會列出建議一併評估的疾病與診斷碼。</span>';
  }

  function renderResults(rows) {
    const card = $('#results-card');
    const host = $('#search-results');
    host.textContent = '';
    if (!rows) { card.classList.add('hidden'); return; }
    card.classList.remove('hidden');
    if (!rows.length) { host.innerHTML = '<span style="color:var(--dim)">查無結果，試試英文或代碼前綴。</span>'; return; }
    if (rows.total > rows.length) {
      const note = document.createElement('div');
      note.className = 'result-note';
      note.textContent = '共 ' + rows.total.toLocaleString() + ' 筆，顯示前 ' + rows.length + ' 筆，請輸入更精確的關鍵字。';
      host.appendChild(note);
    }
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
    // 已在清單也要重新顯示該碼的相關碼面板（否則點過的主訴就再也叫不回建議）
    if (cart.some((x) => x.code === code)) { renderRelated(code); toast(code + ' 已在清單'); return; }
    cart.push({ code, zh: row[3] });
    renderCart();
    renderRelated(code);
    toast('已加入 ' + code);
  }

  function openFallbackCopy(text) {
    const box = $('#fallback-copy');
    box.style.display = 'flex';
    const ta = box.querySelector('textarea');
    ta.value = text;
    ta.focus();
    ta.select();
  }

  function closeFallbackCopy() {
    $('#fallback-copy').style.display = 'none';
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        // 離屏：避免暫存 textarea 取得焦點時整頁跳動
        ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;border:0;padding:0;';
        ta.setAttribute('aria-hidden', 'true');
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        if (ok) return true;
      } catch (e2) { /* fall through */ }
      openFallbackCopy(text);
      return false;
    }
  }

  async function copyCart(fmt) {
    if (!cart.length) { toast('清單是空的'); return; }
    if (await copyText(window.ICDLogic.formatCart(cart, fmt))) toast('已複製 ' + cart.length + ' 個代碼');
  }

  function setMode(m) {
    mode = m;
    $('#mode-er').classList.toggle('active', m === 'emergency');
    $('#mode-op').classList.toggle('active', m === 'outpatient');
    $('#mode-surg').classList.toggle('active', m === 'surg');
    activeRegion = 0;
    renderPanels();
    renderQuick();
    // 相關碼是依模式產生的，切模式後不可沿用上一個模式的建議
    resetRelated();
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
    $('#mode-er').addEventListener('click', () => setMode('emergency'));
    $('#mode-op').addEventListener('click', () => setMode('outpatient'));
    $('#mode-surg').addEventListener('click', () => setMode('surg'));
    $('#copy-lines').addEventListener('click', () => copyCart('lines'));
    $('#copy-comma').addEventListener('click', () => copyCart('comma'));
    $('#copy-names').addEventListener('click', () => copyCart('names'));
    $('#clear-cart').addEventListener('click', () => { cart.length = 0; renderCart(); resetRelated(); });
    const fb = $('#fallback-copy');
    fb.addEventListener('click', (ev) => { if (ev.target === fb) closeFallbackCopy(); });
    $('#fallback-close').addEventListener('click', closeFallbackCopy);
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && fb.style.display === 'flex') closeFallbackCopy();
    });
  }

  // ---- 啟動 ----
  // 載入失敗時整個工具都不能用，必須在主要內容區明講，不能只靠 header 角落小字
  function showFatal(summary, detail) {
    $('#status').textContent = summary;
    const host = $('#left');
    host.textContent = '';
    const card = document.createElement('div');
    card.className = 'card fatal';
    card.id = 'fatal-error';
    card.setAttribute('role', 'alert');
    const h = document.createElement('h2');
    h.textContent = '無法載入診斷碼資料，本工具目前不能使用';
    const p1 = document.createElement('p');
    p1.textContent = summary;
    const p2 = document.createElement('p');
    p2.textContent = detail;
    card.append(h, p1, p2);
    host.appendChild(card);
    document.body.dataset.ready = 'error';
  }

  async function init() {
    if (typeof DecompressionStream === 'undefined') {
      showFatal(
        '瀏覽器過舊：不支援 DecompressionStream，無法解壓縮內嵌的診斷碼資料。',
        '請改用 Edge 或 Chrome 80 以上版本開啟本檔案（Internet Explorer 與舊版瀏覽器不支援）。'
      );
      return;
    }
    try {
      const db = await loadCodes();
      index = window.ICDLogic.buildIndex(db, collectCuratedCodes(window.CURATED));
      symptomRelated = {
        emergency: flattenSymptomRelated(window.CURATED.internalEmergency),
        outpatient: flattenSymptomRelated(window.CURATED.internalOutpatient),
      };
      wire();
      setMode('outpatient');
      $('#status').textContent = '已載入 ' + db.length.toLocaleString() + ' 筆';
      document.body.dataset.ready = '1';
      if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
        performance.mark('icd-ready');
      }
    } catch (e) {
      showFatal(
        '資料載入失敗：' + e.message,
        '可能原因：檔案下載不完整或已損毀、瀏覽器版本過舊。請重新下載本 HTML 檔，並以 Edge 或 Chrome 80 以上版本開啟。'
      );
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
