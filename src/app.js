/* 啟動層：組裝 store／data／render，決定生效版面，並把狀態變動轉成區塊重繪。
   依賴（由 build.py 依序 inline）：ICDLogic → ICDState → ICDData → ICDRender →
   ICDWide（P4 再加 ICDDock／ICDMobile）→ ICDInteractions → 本檔。 */
(function () {
  'use strict';

  // state.layout 只存使用者偏好（wide|dock）；生效版面由 resolveLayout() 依視窗寬度決定，
  // 放在 body[data-layout]。兩者不可混為一談（P2 報告疑慮 2）。
  const LAYOUT_MODULES = { wide: 'ICDWide', dock: 'ICDDock', mobile: 'ICDMobile' };
  // impl-plan §4.6；數字定義在 render-shared（設定面板的說明文案要引用同一個值）
  const MOBILE_MAX = (window.ICDRender && window.ICDRender.LAYOUT_MIN_WIDTH) || 900;
  const RESIZE_DEBOUNCE = 150;
  const PREFETCH_DELAY = 1500;     // 開機後閒置預抓全庫，不與首次互動搶資源

  const $ = (sel) => document.querySelector(sel);

  function mark(name) {
    try {
      if (typeof performance !== 'undefined' && typeof performance.mark === 'function') performance.mark(name);
    } catch (e) { /* 效能標記失敗不得影響功能 */ }
  }

  /* P4a／P4b 只要掛上 window.ICDDock／window.ICDMobile 就會自動被選用；
     還沒實作的版面一律退回 wide，body[data-layout] 永遠等於「實際掛載的版面」。 */
  function rendererFor(layout) {
    const name = LAYOUT_MODULES[layout];
    return name && window[name] ? window[name] : null;
  }

  function resolveLayout(preferred) {
    const want = preferred === 'dock' ? 'dock' : (window.innerWidth < MOBILE_MAX ? 'mobile' : 'wide');
    return rendererFor(want) ? want : 'wide';
  }

  // 載入失敗時整個工具都不能用，必須在主要內容區明講，不能只靠角落小字
  function showFatal(summary, detail) {
    const host = $('#app');
    if (host) {
      host.textContent = '';
      const card = document.createElement('div');
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
    }
    const status = $('#status');
    if (status) status.textContent = summary;
    document.body.dataset.ready = 'error';
  }

  function init() {
    let data = null;
    let current = null;          // { layout, controller }
    let resizeTimer = null;

    try {
      if (!window.ICDLogic || !window.CURATED || !window.CURATED_LABELS) {
        throw new Error('內嵌的邏輯或精選資料缺失');
      }

      const store = window.ICDState.createStore({
        // 葉碼防線的唯一出口（impl-plan R-4）：全庫就緒時以全庫為權威，未就緒時走建置期白名單
        canAdd: (code, row) => data.isAddable(code, row),
      });
      data = window.ICDData.createData({
        curated: window.CURATED,
        labels: window.CURATED_LABELS,
        logic: window.ICDLogic,
        loadDb: () => window.ICDData.loadCodesFromDocument(document),
        onDbState: (next) => store.setDbState(next),
      });
      const ctx = { store, data, logic: window.ICDLogic };

      function mount() {
        const layout = resolveLayout(store.getState().layout);
        if (current && current.layout === layout) return false;
        const host = $('#app');
        /* 換版面前一定要讓舊 controller 收尾（R2 C1）。1c 的側欄在置頂時人在 Document PiP
           小視窗裡、不在 #app 底下，clear(host) 根本清不到它；沒有這一步，被換掉的
           controller 會變成不受控的殭屍——停止更新卻仍可點，門診模式下照樣列著 14 個
           急診紅旗並能把 A41.9 敗血症加進清單，直接繞過紅旗隔離這條安全不變量。
           teardown 只在真的有東西要收（PiP 開著）時才做事，正常切版面不會多一次重繪。 */
        if (current && current.controller && typeof current.controller.teardown === 'function') {
          try { current.controller.teardown(); } catch (e) { /* 收尾失敗不得擋住換版面 */ }
        }
        window.ICDRender.clear(host);
        current = { layout, controller: rendererFor(layout).mount(host, ctx) };
        document.body.dataset.layout = layout;
        current.controller.update(null);
        return true;
      }

      document.documentElement.dataset.theme = store.getState().theme;
      document.body.dataset.mode = store.getState().mode;
      document.body.dataset.db = store.getState().dbState;

      window.ICDInteractions.wire(ctx);
      mount();

      store.subscribe((state, changed) => {
        if (changed.indexOf('theme') >= 0) document.documentElement.dataset.theme = state.theme;
        if (changed.indexOf('mode') >= 0) document.body.dataset.mode = state.mode;
        if (changed.indexOf('dbState') >= 0) {
          document.body.dataset.db = state.dbState;
          if (state.dbState === 'ready') mark('icd-db-ready');
        }
        // 偏好版面改變可能整組換掉 DOM；換掉的話新版面已經全量重繪過，不用再 update
        if (changed.indexOf('layout') >= 0 && mount()) return;
        if (current) current.controller.update(changed);
      });

      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(mount, RESIZE_DEBOUNCE);
      });

      // 供 E2E 與後續階段取用（唯讀用途；狀態變更仍一律走 action）。
      // controller 讓 E2E 能驗證卸載路徑本身（例如刻意讓 teardown 失效，檢查第二層守門）。
      window.ICDApp = {
        store, data, ctx, resolveLayout, remount: mount,
        get layout() { return current && current.layout; },
        get controller() { return current && current.controller; },
      };

      document.body.dataset.ready = '1';
      mark('icd-shell-ready');

      // 閒置預抓全庫：使用者第一次搜尋／加碼前就備好，但不擋開機
      setTimeout(() => {
        const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 0));
        idle(() => data.ensureDb(), { timeout: 3000 });
      }, PREFETCH_DELAY);
    } catch (e) {
      showFatal(
        '啟動失敗：' + e.message,
        '可能原因：檔案下載不完整或已損毀、瀏覽器版本過舊。請重新下載本 HTML 檔，並以 Edge 或 Chrome 開啟。'
      );
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
