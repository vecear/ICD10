/* 1c 側掛窄欄的版面組裝（body[data-layout="dock"]）。掛 window.ICDDock。

   介面與 render-wide.js 相同：`mount(host, ctx)` 只建一次骨架，回傳 `{ update(changed) }`，
   之後只重畫受影響的區塊。DOM 契約見 .review/design-ref/impl-plan.md §4.2／§4.4。

   與 1a 的三個結構差異（設計交付物 new-design.dc.html L223-338）：
   1. 內容區是**扁平列表**不是卡片——面板只剩一條標題帶＋其下的代碼列（`.chip--dock`）。
   2. 部位選擇是**兩欄 grid**（不可用下拉、不可橫向捲動），一眼全見。
   3. 多了「置頂」鈕：用 Document Picture-in-Picture 把整個側欄搬進永遠置頂的小視窗。

   互動一律靠 interactions.js 的 document 事件委派，這裡不掛 closure handler——
   **唯二例外**是 `#pin-toggle` 與 `#cart-toggle`（1c 專屬控制項，interactions.js 不認識），
   以及「側欄被搬進 PiP 視窗後」的委派備援（見 pipDelegate 的註解）。 */
(function (root) {
  'use strict';

  const R = root.ICDRender;

  const MODE_SHORT = { outpatient: '門診', emergency: '急診', surg: '外科' };
  const SEARCH_DEBOUNCE = 150;          // 與 interactions.js 同值

  /* Lucide `pin`，stroke-width 1.5；**不寫 xmlns**（控制者裁示 C4：輸出不得含 h-t-t-p 字串）。
     所以也不能用 createElementNS——改用 innerHTML 交給 HTML 剖析器建立 SVG 節點。 */
  const PIN_PATH = '<path d="M12 17v5"/>'
    + '<path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0'
    + ' 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2'
    + ' 0 0 0 0 4 1 1 0 0 1 1 1z"/>';

  /* 三種降級文案（設計 L724-727）。不支援時**只顯示提示、絕不拋例外、也不進入置頂狀態**——
     交付物原型在失敗時照樣把 pinned 設成 true，會出現「顯示置頂中但根本沒有小視窗」。 */
  const PIN_NOTE = {
    open: '已開啟置頂小視窗，可拖到 HIS 旁邊',
    blocked: '瀏覽器擋下置頂視窗；可改用瀏覽器「一律位於最上層」',
    unsupported: '此瀏覽器不支援置頂小視窗；改用 Edge／Chrome 116 以上',
  };

  function pinIcon() {
    const span = document.createElement('span');
    span.className = 'icn';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"'
      + ' stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + PIN_PATH + '</svg>';
    return span;
  }

  /* 設定 popover 是三套版面共用的（id／data-* 契約不能動），但共用版的字是給 1a 用的全名，
     擠進 164px 寬的三格 segmented 會全部變成「內科門…」。這裡只改**可見文字**，
     換成設計交付物 1c 專用的短標籤（L698-709），選擇器與行為完全不變。 */
  const SHORT_LABEL = [
    ['#seg-layout', 'data-layout-opt', { wide: '工作台', dock: '窄欄' }],
    ['#seg-mode', 'data-mode', { outpatient: '門診', emergency: '急診', surg: '外科' }],
    ['#seg-format', 'data-format', { lines: '每行', comma: '逗號', names: '碼＋名' }],
  ];

  function shortenSegLabels(pop) {
    for (const [rowSel, attr, labels] of SHORT_LABEL) {
      const row = pop.querySelector(rowSel);
      if (!row) continue;
      for (const b of row.querySelectorAll('.seg-btn')) {
        const key = b.getAttribute(attr);
        if (labels[key]) {
          b.title = b.textContent;      // 完整名稱留在 title，短標籤只是為了塞得下
          b.textContent = labels[key];
        }
      }
    }
    return pop;
  }

  /* 共用的 renderResults／renderRelated 產生的是通用 `.chip`；1c 要的是列狀的 `.chip--dock`
     （契約 §4.2 的 1c 修飾類）。與其複製一份渲染邏輯，這裡只補掛修飾類。 */
  function dockify(hostEl) {
    for (const chip of hostEl.querySelectorAll('.chip')) chip.classList.add('chip--dock');
  }

  /* 狀態欄位 → 需要重跑的更新器。**沒列到的欄位一律全部重跑**，所以「不影響 1c 的欄位」
     要顯式寫成空陣列（例如 recent：1c 沒有常用列，每次加碼都全量重繪太浪費）。 */
  const DEPS = {
    mode: ['header', 'pills', 'panels', 'settings', 'pip'],
    region: ['pills', 'panels'],
    query: ['results', 'searchValue'],
    dbState: ['results', 'related', 'settings', 'pip'],
    expanded: ['panels'],
    quickOpen: [],
    cart: ['cart', 'his', 'related'],
    relatedCode: ['related'],
    favs: [],
    recent: [],
    format: ['his', 'settings'],
    copied: ['his'],
    theme: ['settings', 'pip'],
    layout: ['settings'],
    shelfOpen: [],
    settingsOpen: ['settings'],
    cartOpen: ['cart'],
    pinned: ['pin'],
  };

  function mount(host, ctx) {
    const refs = {};
    const dock = R.el('div');
    dock.id = 'layout-dock';

    // ── header：搜尋 → 模式徽章／置頂／設定 → 提示 → 設定 popover ────────────
    const head = R.el('div', 'dock-head');

    const search = document.createElement('input');
    search.id = 'search';
    search.className = 'input';
    search.type = 'search';
    search.autocomplete = 'off';
    search.placeholder = '搜尋碼／中英文';
    search.setAttribute('aria-label', '搜尋診斷碼');
    refs.search = search;
    head.appendChild(search);

    const tools = R.el('div', 'dock-tools');
    refs.modeChip = R.el('span', null, MODE_SHORT.outpatient);
    refs.modeChip.id = 'mode-chip';
    const pin = R.el('button', 'dock-pin');
    pin.type = 'button';
    pin.id = 'pin-toggle';
    pin.title = '永遠置頂顯示（浮動小視窗）';
    pin.setAttribute('aria-pressed', 'false');
    refs.pinLabel = R.el('span', null, '置頂');
    pin.append(pinIcon(), refs.pinLabel);
    refs.pin = pin;
    const settingsToggle = R.el('button', 'btn btn-secondary', '設定');
    settingsToggle.type = 'button';
    settingsToggle.id = 'settings-toggle';
    settingsToggle.setAttribute('aria-expanded', 'false');
    settingsToggle.setAttribute('aria-haspopup', 'true');
    tools.append(refs.modeChip, R.el('span', 'dock-spacer'), pin, settingsToggle);
    head.appendChild(tools);

    refs.pinNote = R.el('div', 'dock-pin-note');
    refs.pinNote.id = 'pin-note';
    refs.pinNote.hidden = true;
    head.appendChild(refs.pinNote);
    head.appendChild(shortenSegLabels(R.settingsPopoverEl(true)));   // small：seg 用 22px／10px 的小號
    dock.appendChild(head);

    // ── 部位／情境：兩欄 grid，一眼全見（不可下拉、不可橫向捲動） ────────────
    refs.pills = R.el('nav');
    refs.pills.id = 'region-pills';
    refs.pills.setAttribute('role', 'tablist');
    refs.pills.setAttribute('aria-label', '身體部位');
    dock.appendChild(refs.pills);

    // ── 捲動內容：搜尋結果 ＋ 扁平面板列表 ────────────────────────────────
    const body = R.el('div', 'dock-scroll');
    const resultsCard = R.el('div');
    resultsCard.id = 'results-card';
    resultsCard.hidden = true;
    refs.resultNote = R.el('div', 'result-note');
    refs.results = R.el('div', 'chip-row');
    refs.results.id = 'search-results';
    resultsCard.append(refs.resultNote, refs.results);
    refs.resultsCard = resultsCard;
    body.appendChild(resultsCard);

    refs.panels = R.el('div');
    refs.panels.id = 'dock-panels';
    body.appendChild(refs.panels);
    dock.appendChild(body);

    // ── 相關疾病／評估：有建議時才出現 ──────────────────────────────────
    refs.relatedWrap = R.el('div');
    refs.relatedWrap.id = 'dock-related';
    refs.relatedWrap.hidden = true;
    refs.relatedWrap.appendChild(R.el('div', 'dock-related-title', '相關疾病／評估'));
    refs.related = R.el('div');
    refs.related.id = 'related';
    refs.relatedWrap.appendChild(refs.related);
    dock.appendChild(refs.relatedWrap);

    // ── 清單／貼入 HIS ────────────────────────────────────────────────
    const cartBox = R.el('div', 'dock-cart');
    const cartToggle = R.el('button', 'dock-cart-summary');
    cartToggle.type = 'button';
    cartToggle.id = 'cart-toggle';
    cartToggle.setAttribute('aria-controls', 'cart-inline');
    cartToggle.setAttribute('aria-expanded', 'false');
    refs.cartCount = R.el('span', null, '');
    refs.cartCount.id = 'cart-count';
    const kicker = R.el('span', 'dock-cart-kicker');
    kicker.append(document.createTextNode('清單 '), refs.cartCount);
    refs.cartCodes = R.el('span', 'dock-cart-codes', '尚未選碼');
    refs.cartMarker = R.icon('chevronRight', 12);
    refs.cartMarker.classList.add('marker');
    cartToggle.append(kicker, refs.cartCodes, refs.cartMarker);
    refs.cartToggle = cartToggle;

    refs.cartInline = R.el('div');
    refs.cartInline.id = 'cart-inline';
    refs.cartInline.hidden = true;
    refs.cart = R.el('ul');
    refs.cart.id = 'cart';
    refs.cartInline.appendChild(refs.cart);

    const bar = R.el('div', 'dock-his');
    refs.copyAll = R.el('button', 'btn', '複製並貼入 HIS');
    refs.copyAll.type = 'button';
    refs.copyAll.id = 'copy-all';
    const clearBtn = R.el('button', 'btn dock-clear', '清空');
    clearBtn.type = 'button';
    clearBtn.id = 'clear-cart';
    bar.append(refs.copyAll, clearBtn);

    cartBox.append(cartToggle, refs.cartInline, bar);
    dock.appendChild(cartBox);

    /* 複製鈕的文案／停用狀態與 1a 同源（renderHis 一併寫預覽 <pre>，1c 沒有預覽區，
       所以給它一個不掛進 DOM 的 <pre>——寧可多一個節點，也不要複製一份文案邏輯。 */
    refs.hisScratch = document.createElement('pre');

    refs.placeholder = R.el('div', 'dock-pinned-away', '已移到置頂小視窗；關閉小視窗即可回到這裡。');

    host.appendChild(dock);

    // ── Document Picture-in-Picture（置頂小視窗） ───────────────────────
    let pipWin = null;
    let pinNote = '';

    function setNote(text) {
      pinNote = text;
      U.pin();
    }

    /* 樣式全部 inline 在單一 <style> 裡，複製節點過去即可（連 @font-face 的 data: URI 一起）。
       CSS 全部限定在 body[data-layout="dock"] 之下，所以 PiP 文件的 body 必須補上同樣的屬性，
       否則小視窗會變成沒有樣式的裸 HTML。 */
    function dressPipDocument(doc) {
      const state = ctx.store.getState();
      doc.title = document.title;
      doc.documentElement.lang = document.documentElement.lang;
      doc.documentElement.dataset.theme = state.theme;
      for (const style of document.querySelectorAll('style')) doc.head.appendChild(style.cloneNode(true));
      doc.body.dataset.layout = 'dock';
      doc.body.dataset.mode = state.mode;
      doc.body.dataset.db = state.dbState;
      doc.body.dataset.ready = '1';
    }

    function restoreFromPip() {
      if (!pipWin) return;
      pipWin = null;
      if (refs.placeholder.parentNode) refs.placeholder.parentNode.removeChild(refs.placeholder);
      host.appendChild(dock);          // 跨文件 append 會自動 adopt 回主文件
      ctx.store.setPinned(false);
      setNote('');
    }

    function closePip() {
      if (!pipWin) return;
      const w = pipWin;
      restoreFromPip();
      try { if (!w.closed) w.close(); } catch (e) { /* 已被使用者關掉 */ }
    }

    function openPip() {
      const api = root.documentPictureInPicture;
      if (!api || typeof api.requestWindow !== 'function') { setNote(PIN_NOTE.unsupported); return; }
      let request = null;
      try {
        request = api.requestWindow({ width: 200, height: 900 });
      } catch (e) {
        setNote(PIN_NOTE.blocked);
        return;
      }
      if (!request || typeof request.then !== 'function') { setNote(PIN_NOTE.blocked); return; }
      request.then((w) => {
        pipWin = w;
        dressPipDocument(w.document);
        w.document.body.appendChild(dock);
        host.appendChild(refs.placeholder);
        w.addEventListener('pagehide', restoreFromPip);
        ctx.store.setPinned(true);
        setNote(PIN_NOTE.open);
      }).catch(() => { setNote(PIN_NOTE.blocked); });
    }

    const togglePin = () => { if (pipWin) closePip(); else openPip(); };

    // ── 事件：1c 專屬控制項 ＋ PiP 期間的委派備援 ───────────────────────
    /* interactions.js 的委派掛在**主文件的 document** 上。側欄被搬進 PiP 視窗後就
       不在那棵樹裡了，所有點擊都不會被處理——所以掛在側欄根節點上的這組 handler
       （跟著節點一起被 adopt 過去）在那段期間頂替。判斷條件是
       `dock.ownerDocument !== document`：在主視窗時直接讓路，不會重複處理。
       行為對齊 interactions.js；若那邊改了規則，這裡要跟著改。 */
    let searchTimer = null;
    let copiedTimer = null;

    const announce = (msg) => root.ICDInteractions.announce(msg);

    function addFromChip(chip) {
      const code = chip.dataset.code;
      const span = chip.querySelector('span');
      const zh = ctx.data.labelOf(code) || (span ? span.textContent : '');
      const result = ctx.store.addCode(code, zh);
      if (result === 'rejected') { announce(code + ' 是類目碼或不存在，無法加入清單'); return; }
      announce(result === 'duplicate' ? code + ' 已在清單' : '已加入 ' + code + ' ' + zh);
      ctx.data.ensureDb();
    }

    function copyAll() {
      const text = R.hisText(ctx);
      if (!text) { announce('清單是空的'); return; }
      root.ICDInteractions.copyText(text).then((ok) => {
        if (!ok) return;
        ctx.store.setCopied(true);
        announce('已複製 ' + ctx.store.getState().cart.length + ' 個代碼，可貼入 HIS');
        clearTimeout(copiedTimer);
        copiedTimer = setTimeout(() => ctx.store.setCopied(false), 2000);
      });
    }

    function pipDelegate(target) {
      const store = ctx.store;
      if (store.getState().settingsOpen
        && !target.closest('#settings-popover') && !target.closest('#settings-toggle')) {
        store.setSettingsOpen(false);
      }

      const chip = target.closest('.chip[data-code]');
      if (chip) {
        if (chip.classList.contains('cat') || chip.getAttribute('aria-disabled') === 'true') return;
        addFromChip(chip);
        return;
      }
      const region = target.closest('.region-btn');
      if (region) { store.setRegion(Number(region.dataset.regionIndex)); return; }
      const panelToggle = target.closest('.panel-toggle');
      if (panelToggle) { store.toggleExpanded(panelToggle.dataset.panelToggle); return; }

      const cartCode = target.closest('b.cart-code');
      if (cartCode) {
        const code = cartCode.closest('li').dataset.code;
        root.ICDInteractions.copyText(code).then((ok) => { if (ok) announce('已複製 ' + code); });
        return;
      }
      const primary = target.closest('.cart-primary');
      if (primary) {
        const code = primary.closest('li').dataset.code;
        store.setPrimary(code);
        announce(code + ' 已設為主診斷');
        return;
      }
      const fav = target.closest('.cart-fav');
      if (fav) {
        const code = fav.closest('li').dataset.code;
        announce((store.toggleFav(code) ? '已加入我的最愛：' : '已移出我的最愛：') + code);
        return;
      }
      const remove = target.closest('.cart-remove');
      if (remove) {
        const code = remove.closest('li').dataset.code;
        store.removeCode(code);
        announce('已移除 ' + code);
        return;
      }
      const seg = target.closest('.seg-btn');
      if (seg) {
        if (seg.dataset.mode) store.setMode(seg.dataset.mode);
        else if (seg.dataset.format) store.setFormat(seg.dataset.format);
        else if (seg.dataset.layoutOpt) store.setLayout(seg.dataset.layoutOpt);
        return;
      }
      const btn = target.closest('button');
      if (!btn) return;
      if (btn.id === 'settings-toggle') store.toggleSettings();
      else if (btn.id === 'theme-toggle') store.toggleTheme();
      else if (btn.id === 'clear-cart') { store.clearCart(); announce('已清空就診清單'); }
      else if (btn.id === 'copy-all') copyAll();
    }

    dock.addEventListener('click', (ev) => {
      const target = ev.target;
      if (!target || !target.closest) return;
      if (target.closest('#pin-toggle')) { togglePin(); return; }
      if (target.closest('#cart-toggle')) { ctx.store.toggleCart(); return; }
      if (dock.ownerDocument === document) return;
      pipDelegate(target);
    });

    dock.addEventListener('input', (ev) => {
      if (dock.ownerDocument === document) return;
      if (!ev.target || ev.target.id !== 'search') return;
      const value = ev.target.value;
      if (value.trim().length >= 2) ctx.data.ensureDb();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => ctx.store.setQuery(value), SEARCH_DEBOUNCE);
    });

    dock.addEventListener('keydown', (ev) => {
      if (dock.ownerDocument === document) return;
      if (!ev.target || ev.target.id !== 'search') return;
      if (ev.key === 'Escape') {
        ev.target.value = '';
        clearTimeout(searchTimer);
        ctx.store.setQuery('');
        return;
      }
      if (ev.key === 'Enter') {
        ev.preventDefault();
        clearTimeout(searchTimer);
        ctx.store.setQuery(ev.target.value);
        const first = refs.results.querySelector('.chip:not(.cat)');
        if (first) {
          addFromChip(first);
          ev.target.value = '';
          ctx.store.setQuery('');
        }
      }
    });

    // ── 更新器 ──────────────────────────────────────────────────────────
    const U = {};

    U.header = () => {
      const s = ctx.store.getState();
      refs.modeChip.textContent = MODE_SHORT[s.mode];
      refs.modeChip.title = R.MODE_LABEL[s.mode];
    };

    U.searchValue = () => {
      const s = ctx.store.getState();
      if (refs.search.value !== s.query) refs.search.value = s.query;
    };

    U.pills = () => {
      const s = ctx.store.getState();
      const surg = s.mode === 'surg';
      refs.pills.setAttribute('aria-label', surg ? '手術情境' : '身體部位');
      R.clear(refs.pills);
      const regions = ctx.data.regionsFor(s.mode);
      const active = ctx.data.clampRegion(s.mode, s.region);
      regions.forEach((region, i) => {
        const b = R.el('button', 'region-btn region-pill--dock', region.name);
        b.type = 'button';
        b.dataset.region = region.name;
        b.dataset.regionIndex = String(i);
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', i === active ? 'true' : 'false');
        // 176px 兩欄下較長的名稱會 ellipsis（設計如此），title 保住完整名稱與面板數
        b.title = region.name + '（' + region.count + '）';
        refs.pills.appendChild(b);
      });
    };

    U.panels = () => {
      const s = ctx.store.getState();
      R.clear(refs.panels);
      // 紅旗隔離只有 panelsFor() 這一個出口，渲染層不得自行讀 window.CURATED.redFlags（C5）
      for (const panel of ctx.data.panelsFor(s.mode, s.region)) {
        const open = ctx.store.isExpanded(panel.name);
        const box = R.el('div', 'dock-panel');
        box.dataset.panel = panel.name;

        const bar = R.el('div', 'dock-panel-head');
        bar.appendChild(R.el('span', 'dock-panel-name', panel.name));
        if (panel.diseases.length) {
          const toggle = R.el('button', 'panel-toggle', open ? '- 疾病' : '+ 疾病 ' + panel.diseases.length);
          toggle.type = 'button';
          toggle.dataset.panelToggle = panel.name;
          toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
          bar.appendChild(toggle);
        }
        box.appendChild(bar);

        const rows = R.el('div', 'dock-panel-rows');
        const add = (pairs, opts) => {
          for (const chip of R.chipsFromPairs(pairs, ctx, opts)) rows.appendChild(chip);
        };
        add(panel.chief, { className: 'chip--dock' });
        add(panel.redFlags, { warn: true, className: 'chip--dock' });
        if (open) add(panel.diseases, { className: 'chip--dock' });
        box.appendChild(rows);
        refs.panels.appendChild(box);
      }
    };

    U.results = () => {
      R.renderResults(refs.resultsCard, refs.results, refs.resultNote, ctx);
      dockify(refs.results);
    };

    U.related = () => {
      R.renderRelated(refs.related, null, ctx);
      dockify(refs.related);
      refs.relatedWrap.hidden = !R.relatedGroups(ctx).length;
    };

    U.cart = () => {
      const s = ctx.store.getState();
      R.renderCart(refs.cart, null, refs.cartCount, ctx);
      refs.cartCodes.textContent = s.cart.length ? s.cart.map((x) => x.code).join('、') : '尚未選碼';
      const open = !!(s.cartOpen && s.cart.length);
      refs.cartInline.hidden = !open;
      refs.cartToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    U.his = () => R.renderHis(refs.hisScratch, null, refs.copyAll, ctx);

    U.settings = () => R.syncSettings(dock, ctx);

    U.pin = () => {
      const s = ctx.store.getState();
      refs.pin.setAttribute('aria-pressed', s.pinned ? 'true' : 'false');
      refs.pin.classList.toggle('is-on', s.pinned);       // C1-2：不倚賴單一屬性選擇器
      refs.pinLabel.textContent = s.pinned ? '置頂中' : '置頂';
      refs.pinNote.textContent = pinNote;
      refs.pinNote.hidden = !pinNote;
    };

    U.pip = () => {
      if (!pipWin || pipWin.closed) return;
      const s = ctx.store.getState();
      try {
        pipWin.document.documentElement.dataset.theme = s.theme;
        pipWin.document.body.dataset.mode = s.mode;
        pipWin.document.body.dataset.db = s.dbState;
      } catch (e) { /* 小視窗已被關掉，下一次 pagehide 會清乾淨 */ }
    };

    const ALL = Object.keys(U);

    function update(changed) {
      // 換到 1a 時整套 DOM 會被 app.js 換掉，留著的小視窗會變成孤兒——先收回來
      if (changed && changed.indexOf('layout') >= 0 && ctx.store.getState().layout !== 'dock') closePip();
      let names = ALL;
      if (changed && changed.length) {
        const set = new Set();
        for (const key of changed) for (const name of DEPS[key] || ALL) set.add(name);
        names = ALL.filter((n) => set.has(n));
      }
      for (const name of names) U[name]();
    }

    return { root: dock, refs, update };
  }

  root.ICDDock = { mount };
})(typeof self !== 'undefined' ? self : this);
