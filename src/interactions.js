/* 互動層：一次性掛在 document 上的事件委派（版面重掛不必重綁），加上剪貼簿與拖曳。
   掛 window.ICDInteractions。三套版面共用同一份契約：
     .chip[data-code]（非 .cat）      加入代碼
     .region-btn[data-region-index]   切換部位／情境（點已選的那顆＝取消選取，改顯示全部部位）
     .panel-toggle[data-panel-toggle] 展開常見疾病
     .quick-toggle[data-quick-toggle] 展開快選分組
     #cart li 內：b.cart-code 複製單碼、.cart-primary 設為主診斷、.cart-fav ★、.cart-remove ✕
     #copy-all / #clear-cart / #settings-toggle / #theme-toggle / #shelf-toggle
     #seg-mode|#seg-format|#seg-layout 內的 .seg-btn
     #cart-toggle              點擊時呼叫 ctx.onCartToggle()——「切換清單面板」這個動作本身
                                共用，但「切換的是什麼」由各版面自己決定（1c 是 store 的
                                cartOpen；1b 是版面本地、預設收合的 sheetOpen，見 render-mobile.js
                                檔頭註解），各版面的 mount() 要把對應的 handler 指派給 ctx.onCartToggle。
                                1a 沒有這顆鈕，不設定也無妨。                             */
(function (root) {
  'use strict';

  const SEARCH_DEBOUNCE = 150;

  /* 回饋 UI 所在的文件（R2 I5）。#status（live region）與 #fallback-copy（手動複製對話框）
     原本寫死 `document`，但 1c 把整個側欄搬進 Document PiP 小視窗後，那是**另一個文件**：
     複製失敗時對話框開在看不見的主視窗、播報也沒人聽得到，小視窗裡完全零回饋。
     render-dock.js 開／關 PiP 時呼叫 setFeedbackDocument() 切換目標。 */
  let feedbackTarget = null;

  function feedbackDoc() {
    try {
      if (feedbackTarget && feedbackTarget.defaultView && !feedbackTarget.defaultView.closed) {
        return feedbackTarget;
      }
    } catch (e) { /* 小視窗已關閉／跨文件存取失敗，退回主文件 */ }
    return document;
  }

  const setFeedbackDocument = (doc) => { feedbackTarget = doc || null; };

  function announce(message) {
    const status = feedbackDoc().getElementById('status');
    if (status) status.textContent = message;
  }

  // ---- 剪貼簿（原 app.js copyText，行為不變，只把目標文件換成 feedbackDoc()） ----
  function openFallbackCopy(text) {
    const box = feedbackDoc().getElementById('fallback-copy');
    if (!box) return;
    box.hidden = false;
    const ta = box.querySelector('textarea');
    ta.value = text;
    ta.focus();
    ta.select();
  }

  function closeFallbackCopy() {
    const box = feedbackDoc().getElementById('fallback-copy');
    if (box) box.hidden = true;
  }

  function isFallbackOpen() {
    const box = feedbackDoc().getElementById('fallback-copy');
    return !!box && !box.hidden;
  }

  async function copyText(text) {
    // 焦點在 PiP 小視窗時，主文件的 clipboard 會以「document is not focused」被拒；
    // 用目前有焦點的那個文件自己的 clipboard 才會成功。
    const doc = feedbackDoc();
    try {
      const view = doc.defaultView;
      const clipboard = view && view.navigator && view.navigator.clipboard;
      if (!clipboard) throw new Error('沒有剪貼簿 API');
      await clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        const ta = doc.createElement('textarea');
        ta.value = text;
        // 離屏：避免暫存 textarea 取得焦點時整頁跳動
        ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;border:0;padding:0;';
        ta.setAttribute('aria-hidden', 'true');
        doc.body.appendChild(ta);
        ta.select();
        const ok = doc.execCommand('copy');
        ta.remove();
        if (ok) return true;
      } catch (e2) { /* fall through */ }
      openFallbackCopy(text);
      return false;
    }
  }

  // ---- 加碼（三套版面 ＋ PiP 代打共用同一份實作） ----
  /* chip 的中文標籤。用 `.chip-zh` 而不是 querySelector('span')：★chip 的第一個 span
     是星號 icon，取到的會是空字串（R2 M1）。 */
  function chipLabel(ctx, chip, code) {
    const span = chip.querySelector('.chip-zh');
    return ctx.data.labelOf(code) || (span ? span.textContent : '');
  }

  /* 附加碼站上第一位就是主診斷錯誤，加碼當下就要講（臨床審查）。 */
  function addedMessage(ctx, result, code, zh) {
    if (result === 'duplicate') return code + ' 已在清單';
    const cart = ctx.store.getState().cart;
    const warn = cart.length && cart[0].code === code && ctx.data.isAdjunct(code)
      ? '；注意：這是附加碼，不可作為主診斷，請加入主要疾病後把它設為主'
      : '';
    return '已加入 ' + code + ' ' + zh + warn;
  }

  /* 全庫就緒後重試一次。走到這裡代表剛才是「白名單查不到、無從判斷」而不是真的不可加。 */
  function retryAdd(ctx, code, zh) {
    const label = ctx.data.labelOf(code) || zh || '';
    const result = ctx.store.addCode(code, label);
    if (result !== 'rejected') { announce(addedMessage(ctx, result, code, label)); return; }
    announce(ctx.data.getDbState() === 'error'
      ? '全庫載入失敗，' + code + ' 目前無法加入；請在設定面板按「重新載入全庫」'
      : code + ' 是類目碼或不存在，無法加入清單');
  }

  function addCode(ctx, code, zh) {
    const result = ctx.store.addCode(code, zh);
    if (result === 'rejected') {
      /* 全庫未就緒時白名單只有 544 個精選碼，★最愛裡的非精選碼一定會被拒——
         以前一律播報「是類目碼或不存在」，與事實相反（R2 I3）。三態的 addability()
         能分辨「明確不可加」與「此刻無從判斷」，後者改成誠實說明並在就緒後自動補加。 */
      if (ctx.data.addability(code) === 'unknown') {
        announce('全庫尚未載入完成，' + code + ' 將在載入後自動加入…');
        ctx.data.ensureDb().then(() => retryAdd(ctx, code, zh));
        return;
      }
      announce(code + ' 是類目碼或不存在，無法加入清單');
      return;
    }
    announce(addedMessage(ctx, result, code, zh));
    // 相關碼的「同類目其他碼」需要全庫（impl-plan R-3）；第一次加碼就把它拉起來
    ctx.data.ensureDb();
  }

  /* chip 點擊的唯一實作。1c 的側欄搬進 PiP 小視窗後主文件的委派搆不到那棵 DOM，
     render-dock.js 得自己代打——共用這個函式，兩邊的規則不會各自漂移。 */
  // ---- 模式徽章的三選一選單（三套版面共用同一份行為） ----
  /* 徽章與選單是宣告式渲染的（render-shared.js 的 modeSwitchEl／syncModeSwitch），
     這裡只負責「開關 ＋ 焦點」。焦點必須在這一層做：store 通知是同步的，動作回來時
     DOM 已經是新的，直接找元素即可；渲染層不得掛 closure handler。
     `doc` 一律由觸發元素的 ownerDocument 推得——1c 置頂時整個側欄在 Document PiP
     的另一個文件裡，寫死 document 會找不到節點（同 R2 I5 的教訓）。 */
  const docOf = (node) => (node && node.ownerDocument) || document;

  function focusModeMenu(doc) {
    const menu = doc.getElementById('mode-menu');
    if (!menu || menu.hidden) return;
    const first = menu.querySelector('[aria-checked="true"]') || menu.querySelector('[data-mode]');
    if (first && typeof first.focus === 'function') first.focus();
  }

  function closeModeMenu(ctx, doc) {
    if (!ctx.store.getState().modeMenuOpen) return false;
    ctx.store.setModeMenuOpen(false);
    const chip = (doc || document).getElementById('mode-chip');
    if (chip && typeof chip.focus === 'function') chip.focus();   // 關掉浮層要把焦點還回觸發者
    return true;
  }

  function toggleModeMenu(ctx, chip) {
    ctx.store.toggleModeMenu();
    if (ctx.store.getState().modeMenuOpen) focusModeMenu(docOf(chip));
    else if (chip && typeof chip.focus === 'function') chip.focus();
  }

  /* 點選單裡的一項。已經是目前模式時只關選單——走 setMode() 會連帶清掉 relatedCode，
     等於「按了目前的模式」把右側相關碼建議清空，那是沒道理的副作用。 */
  function chooseMode(ctx, mode, node) {
    const store = ctx.store;
    const doc = docOf(node);
    if (store.getState().mode === mode) { closeModeMenu(ctx, doc); return; }
    store.setMode(mode);                       // 一併關掉選單（見 state.js setMode）
    const chip = doc.getElementById('mode-chip');
    if (chip && typeof chip.focus === 'function') chip.focus();
    announce('已切換為' + ((root.ICDRender && root.ICDRender.MODE_LABEL[mode]) || mode));
  }

  /* 部位列的「全部」鈕：等於取消部位篩選。與「點已選部位再點一次」同一個結果，
     差別只在它是看得見、按得到的入口（三套版面一致）。 */
  function chooseAllRegions(ctx) {
    const was = ctx.store.getState().region;
    ctx.store.setRegion(null);
    announce(was === null ? '目前已顯示全部部位' : '已取消部位篩選，顯示全部部位');
  }

  /* 選單內的 ↑↓／Home／End 循環移動焦點（role="menu" 的鍵盤契約）。
     回傳是否吃掉這次按鍵。 */
  function modeMenuKey(ev) {
    const menu = ev.target && ev.target.closest ? ev.target.closest('#mode-menu') : null;
    if (!menu) return false;
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (keys.indexOf(ev.key) < 0) return false;
    const items = Array.prototype.slice.call(menu.querySelectorAll('[data-mode]'));
    if (!items.length) return false;
    const here = items.indexOf(ev.target.closest('[data-mode]'));
    let next = 0;
    if (ev.key === 'End') next = items.length - 1;
    else if (ev.key === 'ArrowDown') next = (here + 1) % items.length;
    else if (ev.key === 'ArrowUp') next = (here - 1 + items.length) % items.length;
    ev.preventDefault();
    items[next].focus();
    return true;
  }

  function activateChip(ctx, chip) {
    const code = chip.dataset.code;
    if (chip.classList.contains('cat') || chip.getAttribute('aria-disabled') === 'true') {
      // 以前直接 return，連播報都沒有，使用者只覺得「按了沒反應」（R2 M2）
      announce(code + ' 是類目碼，不可申報；請改選它下層的細碼');
      return;
    }
    addCode(ctx, code, chipLabel(ctx, chip, code));
  }

  function wire(ctx) {
    const store = ctx.store;
    const data = ctx.data;
    let debounce = null;
    let copiedTimer = null;
    let dragCode = null;

    // 不把 chip 上的 data-leaf 當成 row 傳進去：那等於讓 DOM 自證葉碼身分。
    // isAddable 自己決定權威來源（全庫 index > 建置期白名單），繞不過。
    const addFromChip = (chip) => activateChip(ctx, chip);

    async function copyAll() {
      const text = root.ICDRender.hisText(ctx);
      if (!text) { announce('清單是空的'); return; }
      if (await copyText(text)) {
        store.setCopied(true);
        announce('已複製 ' + store.getState().cart.length + ' 個代碼，可貼入 HIS');
        clearTimeout(copiedTimer);
        copiedTimer = setTimeout(() => store.setCopied(false), 2000);
      }
    }

    // ---- 點擊委派 ----
    document.addEventListener('click', (ev) => {
      const target = ev.target;
      if (!target || !target.closest) return;

      // 設定 popover 外點關閉（要在其他處理之前判斷，但不能吃掉該次點擊）
      if (store.getState().settingsOpen
        && !target.closest('#settings-popover') && !target.closest('#settings-toggle')) {
        store.setSettingsOpen(false);
      }
      // 模式選單同理（外點關閉；焦點不搶回徽章，使用者的注意力已經在別處）
      if (store.getState().modeMenuOpen
        && !target.closest('#mode-menu') && !target.closest('#mode-chip')) {
        store.setModeMenuOpen(false);
      }

      const chip = target.closest('.chip[data-code]');
      if (chip) { activateChip(ctx, chip); return; }

      // 模式徽章與其選單：要排在 `.region-btn`／泛用 button 之前
      const modeOpt = target.closest('#mode-menu [data-mode]');
      if (modeOpt) { chooseMode(ctx, modeOpt.getAttribute('data-mode'), modeOpt); return; }
      const modeChip = target.closest('#mode-chip');
      if (modeChip) { toggleModeMenu(ctx, modeChip); return; }

      const regionAll = target.closest('.region-all-btn');
      if (regionAll) { chooseAllRegions(ctx); return; }

      const region = target.closest('.region-btn');
      if (region) {
        store.toggleRegion(Number(region.dataset.regionIndex));
        // 只播報取消：那是新的、看不出來的狀態（tab 全部變成未選取），選取本身有 aria-selected
        if (store.getState().region === null) announce('已取消部位篩選，顯示全部部位');
        return;
      }

      const panelToggle = target.closest('.panel-toggle');
      if (panelToggle) { store.toggleExpanded(panelToggle.dataset.panelToggle); return; }

      const quickToggle = target.closest('.quick-toggle');
      if (quickToggle) { store.toggleQuick(quickToggle.dataset.quickToggle); return; }

      const cartCode = target.closest('b.cart-code');
      if (cartCode) {
        const code = cartCode.closest('li').dataset.code;
        copyText(code).then((ok) => { if (ok) announce('已複製 ' + code); });
        return;
      }
      const primary = target.closest('.cart-primary');
      if (primary) {
        const code = primary.closest('li').dataset.code;
        store.setPrimary(code);
        announce(code + ' 已設為主診斷'
          + (data.isAdjunct(code) ? '；注意：這是附加碼，不可作為主診斷' : ''));
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
      if (btn.id === 'settings-toggle') { store.toggleSettings(); return; }
      if (btn.id === 'theme-toggle') { store.toggleTheme(); return; }
      if (btn.id === 'shelf-toggle') { store.toggleShelf(); return; }
      if (btn.id === 'cart-toggle') { if (typeof ctx.onCartToggle === 'function') ctx.onCartToggle(); return; }
      if (btn.id === 'clear-cart') { store.clearCart(); announce('已清空就診清單'); return; }
      if (btn.id === 'copy-all') { copyAll(); return; }
      if (btn.id === 'fallback-close') { closeFallbackCopy(); return; }
      // 全庫載入失敗後的重試入口（R2 I2）；ensureDb() 會回傳快取的失敗 Promise，只能走 retryDb()
      if (btn.id === 'db-retry') { announce('正在重新載入全庫…'); data.retryDb(); return; }
    });

    // 點擊後備視窗的背景關閉
    document.addEventListener('mousedown', (ev) => {
      if (ev.target && ev.target.id === 'fallback-copy') closeFallbackCopy();
    });

    // ---- 搜尋 ----
    document.addEventListener('input', (ev) => {
      if (!ev.target || ev.target.id !== 'search') return;
      const value = ev.target.value;
      if (value.trim().length >= 2) data.ensureDb();     // 觸發全庫延遲載入
      clearTimeout(debounce);
      debounce = setTimeout(() => store.setQuery(value), SEARCH_DEBOUNCE);
    });

    document.addEventListener('keydown', (ev) => {
      if (ev.target && ev.target.id === 'search') {
        if (ev.key === 'Escape') {
          ev.target.value = '';
          clearTimeout(debounce);
          store.setQuery('');
          // Esc 在其他情境都會關掉開著的浮層，搜尋框裡也要一致（R2 M3）
          if (isFallbackOpen()) closeFallbackCopy();
          else if (store.getState().settingsOpen) store.setSettingsOpen(false);
          else if (store.getState().modeMenuOpen) store.setModeMenuOpen(false);
          return;
        }
        if (ev.key === 'Enter') {
          ev.preventDefault();
          clearTimeout(debounce);
          store.setQuery(ev.target.value);
          const first = document.querySelector('#search-results .chip:not(.cat)');
          if (first) {
            addFromChip(first);
            ev.target.value = '';
            store.setQuery('');
          }
          return;
        }
      }
      if (ev.key === 'Escape') {
        if (isFallbackOpen()) { closeFallbackCopy(); return; }
        if (closeModeMenu(ctx, docOf(ev.target))) return;
        if (store.getState().settingsOpen) store.setSettingsOpen(false);
        return;
      }
      if (modeMenuKey(ev)) return;
      // 鍵盤換序（觸控裝置不觸發 HTML5 拖放，鍵盤使用者也需要換序手段；impl-plan R-5）
      const li = ev.target && ev.target.closest ? ev.target.closest('#cart li[data-code]') : null;
      if (li && ev.altKey && (ev.key === 'ArrowUp' || ev.key === 'ArrowDown')) {
        ev.preventDefault();
        const list = Array.from(li.parentNode.children);
        const from = list.indexOf(li);
        const to = from + (ev.key === 'ArrowUp' ? -1 : 1);
        if (store.reorder(from, to)) {
          const moved = document.querySelector('#cart li[data-code="' + li.dataset.code + '"]');
          if (moved) moved.focus();
          announce(li.dataset.code + ' 移到第 ' + (to + 1) + ' 位');
        }
      }
    });

    // ---- 拖曳換序（HTML5 DnD；桌機 1a 專用，觸控另有「主」鈕與 Alt+↑↓） ----
    const indexOfRow = (li) => Array.prototype.indexOf.call(li.parentNode.children, li);

    document.addEventListener('dragstart', (ev) => {
      const li = ev.target.closest ? ev.target.closest('#cart li[data-code]') : null;
      if (!li) return;
      dragCode = li.dataset.code;
      li.classList.add('is-dragging');
      if (ev.dataTransfer) {
        ev.dataTransfer.effectAllowed = 'move';
        ev.dataTransfer.setData('text/plain', dragCode);   // Firefox 需要有資料才會開始拖曳
      }
    });

    document.addEventListener('dragover', (ev) => {
      const li = ev.target.closest ? ev.target.closest('#cart li[data-code]') : null;
      if (!li || dragCode === null) return;
      ev.preventDefault();
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
      for (const other of li.parentNode.children) other.classList.remove('is-over');
      if (li.dataset.code !== dragCode) li.classList.add('is-over');
    });

    document.addEventListener('drop', (ev) => {
      const li = ev.target.closest ? ev.target.closest('#cart li[data-code]') : null;
      if (!li || dragCode === null) return;
      ev.preventDefault();
      const from = store.getState().cart.findIndex((x) => x.code === dragCode);
      const to = indexOfRow(li);
      dragCode = null;
      if (store.reorder(from, to)) announce('清單順序已更新，主診斷為 ' + store.getState().cart[0].code);
    });

    document.addEventListener('dragend', () => {
      dragCode = null;
      for (const li of document.querySelectorAll('#cart li')) li.classList.remove('is-dragging', 'is-over');
    });
  }

  root.ICDInteractions = {
    wire, copyText, openFallbackCopy, closeFallbackCopy, isFallbackOpen, announce,
    activateChip, setFeedbackDocument,
    // 1c 置頂時 main document 的委派搆不到側欄，render-dock.js 要用同一份實作代打
    toggleModeMenu, chooseMode, closeModeMenu, chooseAllRegions, modeMenuKey,
  };
})(typeof self !== 'undefined' ? self : this);
