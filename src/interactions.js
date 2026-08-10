/* 互動層：一次性掛在 document 上的事件委派（版面重掛不必重綁），加上剪貼簿與拖曳。
   掛 window.ICDInteractions。三套版面共用同一份契約：
     .chip[data-code]（非 .cat）      加入代碼
     .region-btn[data-region-index]   切換部位／情境
     .panel-toggle[data-panel-toggle] 展開常見疾病
     .quick-toggle[data-quick-toggle] 展開快選分組
     #cart li 內：b.cart-code 複製單碼、.cart-primary 設為主診斷、.cart-fav ★、.cart-remove ✕
     #copy-all / #clear-cart / #settings-toggle / #theme-toggle / #shelf-toggle
     #seg-mode|#seg-format|#seg-layout 內的 .seg-btn                                  */
(function (root) {
  'use strict';

  const SEARCH_DEBOUNCE = 150;

  function announce(message) {
    const status = document.getElementById('status');
    if (status) status.textContent = message;
  }

  // ---- 剪貼簿（原 app.js copyText，行為一字不改，只換後備視窗的顯示方式） ----
  function openFallbackCopy(text) {
    const box = document.getElementById('fallback-copy');
    if (!box) return;
    box.hidden = false;
    const ta = box.querySelector('textarea');
    ta.value = text;
    ta.focus();
    ta.select();
  }

  function closeFallbackCopy() {
    const box = document.getElementById('fallback-copy');
    if (box) box.hidden = true;
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

  function wire(ctx) {
    const store = ctx.store;
    const data = ctx.data;
    let debounce = null;
    let copiedTimer = null;
    let dragCode = null;

    const isFallbackOpen = () => {
      const box = document.getElementById('fallback-copy');
      return !!box && !box.hidden;
    };

    function addFromChip(chip) {
      const code = chip.dataset.code;
      const span = chip.querySelector('span');
      const zh = data.labelOf(code) || (span ? span.textContent : '');
      // 不把 chip 上的 data-leaf 當成 row 傳進去：那等於讓 DOM 自證葉碼身分。
      // isAddable 自己決定權威來源（全庫 index > 建置期白名單），繞不過。
      const result = store.addCode(code, zh);
      if (result === 'rejected') {
        announce(code + ' 是類目碼或不存在，無法加入清單');
        return;
      }
      announce(result === 'duplicate' ? code + ' 已在清單' : '已加入 ' + code + ' ' + zh);
      // 相關碼的「同類目其他碼」需要全庫（impl-plan R-3）；第一次加碼就把它拉起來
      data.ensureDb();
    }

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
      if (btn.id === 'settings-toggle') { store.toggleSettings(); return; }
      if (btn.id === 'theme-toggle') { store.toggleTheme(); return; }
      if (btn.id === 'shelf-toggle') { store.toggleShelf(); return; }
      if (btn.id === 'clear-cart') { store.clearCart(); announce('已清空就診清單'); return; }
      if (btn.id === 'copy-all') { copyAll(); return; }
      if (btn.id === 'fallback-close') { closeFallbackCopy(); return; }
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
        if (store.getState().settingsOpen) store.setSettingsOpen(false);
        return;
      }
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

  root.ICDInteractions = { wire, copyText, openFallbackCopy, closeFallbackCopy, announce };
})(typeof self !== 'undefined' ? self : this);
