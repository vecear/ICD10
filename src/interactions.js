/* 互動層：一次性掛在 document 上的事件委派（版面重掛不必重綁），加上剪貼簿與拖曳。
   掛 window.ICDInteractions。三套版面共用同一份契約：
     .chip[data-code]（非 .cat）      加入代碼
     .region-btn[data-region-index]   切換部位／情境（點已選的那顆＝取消選取，改顯示全部部位）
     .panel-toggle[data-panel-toggle] 展開常見疾病
     .quick-toggle[data-quick-toggle] 展開快選分組
     #cart li 內：b.cart-code 複製單碼、.cart-primary 設為主診斷、.cart-fav ★、.cart-remove ✕
     #copy-date / #clear-cart / #settings-toggle / #theme-toggle / #shelf-toggle
     #mode-switch 內的 .mode-btn[data-mode]  header 的看診模式三鈕（一次點擊即切換）
     #chronic-btn              「健保規範條文」入口：開浮層，停在上次看的主題（chronicLast）
     [data-chronic]            慢病速查：顯示該主題（浮層內的 DM／HTN／LIPID 分頁）
     #chronic-close / #chronic-overlay 本身  關閉慢病速查（關閉鈕／點面板以外；Esc 見下方）
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

  /* 搜尋輸入的 debounce handle。放模組層而不是 wire() 的閉包，是為了讓 leaveSearch()
     也清得到它——「返回」按下時若還有一筆沒送出的字，回到導引之後會又被打開一次搜尋。 */
  let searchDebounce = null;

  /* ── 搜尋的回頭路（三套版面共用一份實作） ─────────────────────────────────────
     入口有三個：`.search-back` 鈕（class 委派，見下方 click）、搜尋框按 Esc、
     以及「搜尋中直接點部位／模式鈕」（1c 的 dock.addEventListener）。三者都只做同一件事
     ——清空 query。「回到搜尋前的捲動位置」不在這裡：那是各版面 update() 裡的 positions
     還原（1a `.worksheet`、1b `#m-scroll`、1c `.dock-scroll`，同一個資料結構）。

     `node` 決定在哪個文件找搜尋框：1c 置頂時整條側欄在 Document PiP 小視窗那個
     **另一個文件**裡，寫死 document 會找不到（同 feedbackDoc 的教訓）。 */
  function leaveSearch(ctx, node, focus) {
    const doc = (node && node.ownerDocument) || document;
    const input = doc.getElementById('search');
    if (input) input.value = '';
    clearTimeout(searchDebounce);
    ctx.store.setQuery('');
    if (focus && input) input.focus({ preventScroll: true });
  }

  /* ── 剪貼簿最後一次自動同步的結果（UX 稽核 U4） ───────────────────────────────
     沒有「複製並貼入 HIS」鈕是刻意的（點碼即自動同步），但畫面上一個字都沒說剪貼簿
     已經同步，醫師只能相信它。狀態放這裡而不是 store：它不是使用者資料，跨診次沒有意義，
     也不該進 localStorage（清單本身就刻意不持久化）。
     繪製在 render-shared 的 renderClipboardSync()；各版面的 U.his 會重畫一次，
     所以換版面／重掛之後仍顯示同一個狀態。 */
  let clipSync = null;
  const clipboardSyncInfo = () => clipSync;

  function setClipboardSync(ok) {
    clipSync = { ok: !!ok, at: new Date() };
    if (root.ICDRender && root.ICDRender.renderClipboardSync) {
      root.ICDRender.renderClipboardSync(feedbackDoc());
    }
  }

  /* ── 通知列（#notice）的逾時規則 ───────────────────────────────────────────
     成功類（已加入、已複製、已切換）2.5 秒自己收掉：看過就沒用的提示不該佔版面
     （docs/dense-ui-principle.md 手法 #4）。失敗／未解決的相反——`{ sticky: true }`
     的訊息留到下一則為止，因為它講的是使用者下一步該做什麼（類目碼要改選細碼、
     全庫還沒載入、剪貼簿被拒要逐碼複製）。附「復原」的那種給 10 秒：要讀完一句話、
     判斷是不是真的要復原、再把指標移過去，2.5 秒不夠。 */
  const NOTICE_TTL = 2500;
  const NOTICE_UNDO_TTL = 10000;
  let noticeTimer = null;
  let undoAction = null;

  function hideNotice(box) {
    box.hidden = true;
    const undo = box.querySelector('#notice-undo');
    if (undo) undo.hidden = true;
  }

  /* 可見通知列。與 #status 同一則訊息、同一個呼叫點——兩條線索不得各自漂移。
     節點由各版面的 header 掛上（render-shared 的 noticeEl），不存在就只剩播報，
     不拋錯：1c 進 PiP 小視窗那段期間節點在另一個文件裡，feedbackDoc() 已經處理。 */
  function showNotice(message, opts) {
    clearTimeout(noticeTimer);
    noticeTimer = null;
    undoAction = typeof opts.undo === 'function' ? opts.undo : null;
    const doc = feedbackDoc();
    const box = doc.getElementById('notice');
    if (!box) return;
    if (!message) { hideNotice(box); return; }
    const text = box.querySelector('.notice-text');
    if (text) text.textContent = message;
    const undo = box.querySelector('#notice-undo');
    if (undo) undo.hidden = !undoAction;
    box.hidden = false;
    box.dataset.kind = opts.sticky ? 'stay' : 'transient';
    if (opts.sticky) return;                       // 留到下一則訊息
    const ttl = undoAction ? NOTICE_UNDO_TTL : NOTICE_TTL;
    noticeTimer = setTimeout(() => {
      noticeTimer = null;
      undoAction = null;
      hideNotice(box);
    }, ttl);
  }

  /* opts: { sticky, undo }。沒有 opts 就是「成功類、無復原」，也就是絕大多數呼叫點。 */
  function announce(message, opts) {
    const status = feedbackDoc().getElementById('status');
    if (status) status.textContent = message;
    showNotice(message, opts || {});
  }

  /* 「復原」被按下。動作只跑一次就拋掉：清單復原後再按第二次會把使用者剛加的碼洗掉。 */
  function runUndo() {
    const action = undoAction;
    if (!action) return;
    undoAction = null;
    action();
    announce('已復原上一個清單變更');
  }

  /* 移除單筆／清空一律走這兩個入口，快照在動作**之前**取。
     快照只放記憶體（這個閉包），不持久化——cart 跨診次殘留＝臨床事故（impl-plan R-9）。
     1c 置頂時 render-dock.js 的代打也呼叫這兩個，規則不會兩邊漂移。 */
  function removeFromCart(ctx, code) {
    const snapshot = ctx.store.getState().cart;
    if (!ctx.store.removeCode(code)) return;
    announce('已移除 ' + code, { undo: () => ctx.store.restoreCart(snapshot) });
  }

  function clearCartWithUndo(ctx) {
    const snapshot = ctx.store.getState().cart;
    if (!snapshot.length) return;
    ctx.store.clearCart();
    announce('已清空 ' + snapshot.length + ' 筆', { undo: () => ctx.store.restoreCart(snapshot) });
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

  /* silent＝失敗時不跳手動複製視窗。自動同步剪貼簿（每加一個代碼就跑一次）走這條：
     那個視窗一秒跳一次比沒複製到還糟；失敗改用播報告知，使用者仍有機會發現。 */
  async function copyText(text, silent) {
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
      if (!silent) openFallbackCopy(text);
      return false;
    }
  }

  /* 清單列上的代碼是可點擊複製的控制項（render-shared.js 給它 role="button" ＋ tabindex）。
     滑鼠點擊、鍵盤 Enter／Space、以及 1c 進 PiP 小視窗時的代打全部共用這一份實作。 */
  function copyCartCode(node, ctx) {
    const li = node && node.closest ? node.closest('li[data-code]') : null;
    if (!li) return;
    const code = li.dataset.code;
    const item = ctx.store.getState().cart.find(x => x.code === code) || { code, zh: '' };
    const text = root.ICDClipboard.format('single', item, ctx.store.getState().clipboardFormats);
    copyText(text).then((ok) => { if (ok) announce('已複製 ' + code); });
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
      : code + ' 是類目碼或不存在，無法加入清單', { sticky: true });
  }

  function addCode(ctx, code, zh) {
    const result = ctx.store.addCode(code, zh);
    if (result === 'rejected') {
      /* 全庫未就緒時白名單只有 544 個精選碼，★最愛裡的非精選碼一定會被拒——
         以前一律播報「是類目碼或不存在」，與事實相反（R2 I3）。三態的 addability()
         能分辨「明確不可加」與「此刻無從判斷」，後者改成誠實說明並在就緒後自動補加。 */
      if (ctx.data.addability(code) === 'unknown') {
        announce('全庫尚未載入完成，' + code + ' 將在載入後自動加入…', { sticky: true });
        ctx.data.ensureDb().then(() => retryAdd(ctx, code, zh));
        return;
      }
      announce(code + ' 是類目碼或不存在，無法加入清單', { sticky: true });
      return;
    }
    announce(addedMessage(ctx, result, code, zh));
    // 相關碼的「同類目其他碼」需要全庫（impl-plan R-3）；第一次加碼就把它拉起來
    ctx.data.ensureDb();
  }

  /* chip 點擊的唯一實作。1c 的側欄搬進 PiP 小視窗後主文件的委派搆不到那棵 DOM，
     render-dock.js 得自己代打——共用這個函式，兩邊的規則不會各自漂移。 */
  // ---- header 的看診模式三鈕（三套版面共用同一份行為） ----
  /* 三顆鈕是宣告式渲染的（render-shared.js 的 modeSwitchEl／syncModeSwitch），一次點擊
     就切換，沒有任何展開動作。已經是目前模式時什麼都不做——走 setMode() 會連帶清掉
     relatedCode，等於「按了目前的模式」把右側相關碼建議清空，那是沒道理的副作用。
     設定 popover 的 segmented 走 `.seg-btn` 那條泛用委派，兩者狀態同源於 store.mode。 */
  function chooseMode(ctx, mode) {
    if (ctx.store.getState().mode === mode) return;
    ctx.store.setMode(mode);
    announce('已切換為' + ((root.ICDRender && root.ICDRender.MODE_LABEL[mode]) || mode));
  }

  /* 部位列的「全部」鈕：等於取消部位篩選。與「點已選部位再點一次」同一個結果，
     差別只在它是看得見、按得到的入口（三套版面一致）。 */
  function chooseAllRegions(ctx) {
    const was = ctx.store.getState().region;
    ctx.store.setRegion(null);
    announce(was === null ? '目前已顯示全部部位' : '已取消部位篩選，顯示全部部位');
  }

  /* ── 慢病速查（三套版面 ＋ PiP 代打共用同一份實作） ────────────────────────
     浮層蓋住整個工作區，所以焦點必須跟著走：開啟時移到關閉鈕，關閉時還給原來那顆主題鈕。
     沒有這一步，鍵盤使用者按 Tab 會走進被蓋住、看不見的東西。

     一律從 `node.ownerDocument` 找節點，不寫死 `document`：1c 置頂時整棵側欄在 Document
     PiP 小視窗那個**另一個文件**裡，主文件的 getElementById 會回 null（同 feedbackDoc 的教訓）。

     store 的通知是同步的——setChronicTopic() 回來時 controller.update() 已經跑完、DOM 也
     重畫好了，所以可以緊接著聚焦，不需要 setTimeout。 */
  const chronicDoc = (node) => (node && node.ownerDocument) || document;

  function chronicLabelOf(key) {
    const topics = (root.ICDRender && root.ICDRender.chronicTopics()) || [];
    const hit = topics.filter((t) => t.key === key)[0];
    return (hit && hit.label) || key;
  }

  function focusChronicButton(doc) {
    const btn = doc.getElementById('chronic-btn');
    if (btn) btn.focus();
  }

  /* 入口鈕與浮層內的分頁走同一條路：**只負責「顯示這個主題」，不負責關閉。**
     關閉有三個明確出口（關閉鈕、Esc、點面板外）。曾經寫成「再點一次關閉」，但浮層是
     modal——開著的時候外面那顆鈕被遮罩蓋住，那條路徑根本按不到，是死碼。 */
  function chooseChronic(ctx, key, node) {
    const doc = chronicDoc(node);
    const was = ctx.store.getState().chronicTopic;
    if (was === key) return;
    if (!ctx.store.setChronicTopic(key)) return;
    if (!was) {
      // 從無到有：焦點進浮層。換主題時不動焦點——使用者正站在剛按的那顆分頁鈕上。
      const close = doc.getElementById('chronic-close');
      if (close) close.focus();
    }
    announce('慢病速查：' + chronicLabelOf(key) + '；內容以健保署當期公告為準');
  }

  function closeChronic(ctx, node) {
    const was = ctx.store.getState().chronicTopic;
    if (!was) return false;
    ctx.store.setChronicTopic(null);
    focusChronicButton(chronicDoc(node));
    announce('已關閉慢病速查');
    return true;
  }

  /* CCr 計算機。與慢病速查同型的浮層：關閉有三個出口（關閉鈕、Esc、點面板外）。
     `node` 用來判斷事件發生在哪個 document——1c 置頂後整條窄欄在 PiP 小視窗裡，
     主文件的 getElementById 找不到那邊的節點。 */
  function ccrDoc(node) {
    return (node && node.ownerDocument) || document;
  }

  function openCcr(ctx, node) {
    if (ctx.store.getState().ccrOpen) return;
    ctx.store.setCcrOpen(true);
    const doc = ccrDoc(node);
    const age = doc.getElementById('ccr-age');
    if (age) age.focus();          // 直接落在第一個輸入格，少一次點擊
    announce('CCr 計算機已開啟，Cockcroft-Gault 估計值');
  }

  function closeCcr(ctx, node) {
    if (!ctx.store.getState().ccrOpen) return false;
    ctx.store.setCcrOpen(false);
    const btn = ccrDoc(node).getElementById('ccr-btn');
    if (btn) btn.focus();
    announce('已關閉 CCr 計算機');
    return true;
  }

  /* 任一輸入變動就重算。不經過 store：輸入值是「這一位病人」的暫態，
     每敲一鍵重繪整個版面既慢也沒必要（見 render-shared.js 的 ccrInputs 註解）。 */
  function recalcCcr(ctx, node) {
    const doc = ccrDoc(node);
    const panel = doc.getElementById('ccr-panel');
    if (panel) root.ICDRender.renderCcrResult(doc, ctx);
  }

  function chooseCcrSex(ctx, node) {
    const doc = ccrDoc(node);
    const row = doc.getElementById('ccr-sex');
    if (!row) return;
    for (const b of row.querySelectorAll('.ccr-sex-btn')) {
      const on = b === node;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('is-on', on);
    }
    recalcCcr(ctx, node);
  }

  function resetCcr(ctx, node) {
    const doc = ccrDoc(node);
    root.ICDRenalUI.reset(doc.querySelector('.renal-ui'));
    for (const id of ['ccr-age', 'ccr-weight', 'ccr-height', 'ccr-cr']) {
      const input = doc.getElementById(id);
      if (input) input.value = '';
    }
    recalcCcr(ctx, node);
    const age = doc.getElementById('ccr-age');
    if (age) age.focus();
    announce('已清除 CCr 輸入');
  }

  /* 複製結果：使用者主動按的，失敗要跳後備視窗（與「日期」鈕同一條規則，
     和清單的靜默自動同步刻意不同）。 */
  async function copyCcr(ctx, node) {
    const doc = ccrDoc(node);
    const r = ctx.logic.creatinineClearance(root.ICDRender.ccrInputs(doc));
    const text = root.ICDRender.ccrResultText(r, ctx.store.getState().clipboardFormats);
    if (!text) { announce('還沒有可複製的結果'); return; }
    if (await copyText(text)) announce('已複製：' + text);
  }

  /* 血脂給付試算。與 CCr 完全同型的浮層，使用者只要學一次。 */
  function lipidDoc(node) {
    return (node && node.ownerDocument) || document;
  }

  function openLipid(ctx, node) {
    if (ctx.store.getState().lipidOpen) return;
    ctx.store.setLipidOpen(true);
    const ldl = lipidDoc(node).getElementById('lipid-ldl');
    if (ldl) ldl.focus();      // 直接落在 LDL-C：那是這個判定唯一的必填值
    announce('血脂給付試算已開啟');
  }

  function closeLipid(ctx, node) {
    if (!ctx.store.getState().lipidOpen) return false;
    ctx.store.setLipidOpen(false);
    const btn = lipidDoc(node).getElementById('lipid-btn');
    if (btn) btn.focus();
    announce('已關閉血脂給付試算');
    return true;
  }

  /* 任一輸入或勾選變動就重算。與 CCr 同一個理由不經過 store。 */
  function recalcLipid(ctx, node) {
    const doc = lipidDoc(node);
    if (doc.getElementById('lipid-panel')) root.ICDRender.renderLipidResult(doc, ctx);
  }

  function chooseLipidSex(ctx, node) {
    const row = lipidDoc(node).getElementById('lipid-sex');
    if (!row) return;
    for (const b of row.querySelectorAll('.lipid-sex-btn')) {
      const on = b === node;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('is-on', on);
    }
    root.ICDRender.syncLipidSexRows(lipidDoc(node));
    recalcLipid(ctx, node);
  }

  function resetLipid(ctx, node) {
    const doc = lipidDoc(node);
    for (const id of ['lipid-age', 'lipid-ldl', 'lipid-tc', 'lipid-hdl', 'lipid-tg',
                      'lipid-drug']) {
      const input = doc.getElementById(id);
      if (input) input.value = '';
    }
    for (const box of doc.querySelectorAll('[data-lipid-key]')) box.checked = false;
    recalcLipid(ctx, node);
    const ldl = doc.getElementById('lipid-ldl');
    if (ldl) ldl.focus();
    announce('已清除血脂試算的輸入');
  }

  /* 複製判定。理由要一起帶走——只複製「符合」兩個字，日後被核刪時什麼都證明不了。 */
  async function copyLipid(ctx, node) {
    const doc = lipidDoc(node);
    const input = root.ICDRender.lipidInputs(doc);
    const r = ctx.logic.lipidCoverage(input);
    const text = root.ICDRender.lipidResultText(r, input, ctx.store.getState().clipboardFormats);
    if (!text) { announce('還沒有可複製的結果'); return; }
    if (await copyText(text)) announce('已複製血脂給付試算結果');
  }

  /* 設定面板的「回復預設高度」（三套版面共用）。只清**生效版面**那一組：在 176px 窄欄
     按下它，不該把桌機工作台調好的高度一起抹掉（分版面各記各的）。 */
  function resetPanes(ctx) {
    const layout = (root.ICDRender && root.ICDRender.effectiveLayout())
      || ctx.store.getState().layout;
    announce(ctx.store.resetPaneSizes(layout)
      ? '已回復本版面各區塊的預設高度'
      : '本版面各區塊都已是預設高度');
  }

  function activateChip(ctx, chip) {
    const code = chip.dataset.code;
    if (chip.classList.contains('cat') || chip.getAttribute('aria-disabled') === 'true') {
      // 以前直接 return，連播報都沒有，使用者只覺得「按了沒反應」（R2 M2）
      announce(code + ' 是類目碼，不可申報；請改選它下層的細碼', { sticky: true });
      return;
    }
    addCode(ctx, code, chipLabel(ctx, chip, code));
  }

  function chooseCopyFormat(ctx, format) {
    const previous = ctx.store.getState();
    const sameWithCustom = previous.format === format && !!previous.clipboardFormats.cart;
    if (!ctx.store.setFormat(format)) return;
    // 切回同一個舊格式時，format 值沒變；仍需把已停用的自訂內容從剪貼簿更新。
    if (sameWithCustom) {
      const text = root.ICDRender.hisText(ctx);
      if (text) copyText(text, true).then(ok => {
        if (!ok) announce('自動複製失敗，請點清單裡的代碼逐一複製', { sticky: true });
      });
    }
  }

  function wire(ctx) {
    const store = ctx.store;
    const data = ctx.data;
    let copiedTimer = null;
    let dragCode = null;

    // 不把 chip 上的 data-leaf 當成 row 傳進去：那等於讓 DOM 自證葉碼身分。
    // isAddable 自己決定權威來源（全庫 index > 建置期白名單），繞不過。
    const addFromChip = (chip) => activateChip(ctx, chip);

    /* 清單一有變動就把「目前全部代碼」同步到剪貼簿（使用者要求：點診斷即複製，
       不必再按「複製並貼入 HIS」）。改複製格式時也要重跑，否則剪貼簿停在舊格式。

       清空時**不動剪貼簿**：使用者剛把碼貼進 HIS 才按清空，這時把剪貼簿洗成空字串
       等於毀掉他手上唯一那份；留著上一組沒有壞處。

       靜默失敗但要播報——剪貼簿沒同步到卻無聲無息，下一次按 F9 會把舊清單再貼一次。 */
    function syncClipboard() {
      const text = root.ICDRender.hisText(ctx);
      if (!text) return;
      copyText(text, true).then((ok) => {
        // 成功／失敗都要留痕：「已同步 HH:MM」／「未同步」寫在既有的標題列右側（U4）
        setClipboardSync(ok);
        if (!ok) announce('自動複製失敗，請點清單裡的代碼逐一複製', { sticky: true });
      });
    }

    store.subscribe((state, changed) => {
      if (changed.indexOf('cart') < 0 && changed.indexOf('format') < 0) return;
      syncClipboard();
    });

    /* 「日期」鈕：HIS 就診日期欄位吃民國格式。這是使用者主動按的，失敗要跳手動複製
       視窗（不像自動同步那樣靜默），否則他會以為複製成功而貼到舊內容。 */
    async function copyDate() {
      const text = root.ICDClipboard.format('date', new Date(), ctx.store.getState().clipboardFormats);
      if (await copyText(text)) announce('已複製日期 ' + text);
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
      /* 慢病速查：入口鈕、浮層內分頁（[data-chronic]）、關閉鈕、以及點浮層背景
         （`target.id` 恰為 overlay 本身＝點在面板以外）。要排在泛用 `button` 那條之前。

         入口鈕開的是 chronicLast（上次看的主題），不是固定 DM：使用者在同一診裡通常
         反覆查同一個主題，每次都要多按一下分頁是純粹的損耗。 */
      if (target.closest('#chronic-btn')) {
        chooseChronic(ctx, store.getState().chronicLast, target);
        return;
      }
      const chronicBtn = target.closest('[data-chronic]');
      if (chronicBtn) { chooseChronic(ctx, chronicBtn.getAttribute('data-chronic'), chronicBtn); return; }

      if (target.closest('#lipid-btn')) { openLipid(ctx, target); return; }
      const lipidSexBtn = target.closest('.lipid-sex-btn');
      if (lipidSexBtn) { chooseLipidSex(ctx, lipidSexBtn); return; }
      if (target.closest('#lipid-close') || target.id === 'lipid-overlay') {
        closeLipid(ctx, target); return;
      }
      if (target.closest('#lipid-copy')) { copyLipid(ctx, target); return; }
      if (target.closest('#lipid-reset')) { resetLipid(ctx, target); return; }
      const ccrSexBtn = target.closest('.ccr-sex-btn');
      if (ccrSexBtn) { chooseCcrSex(ctx, ccrSexBtn); return; }
      if (target.closest('#ccr-close') || target.id === 'ccr-overlay') { closeCcr(ctx, target); return; }
      if (target.closest('#ccr-copy')) { copyCcr(ctx, target); return; }
      if (target.closest('#ccr-reset')) { resetCcr(ctx, target); return; }
      if (target.closest('#ccr-btn')) { openCcr(ctx, target); return; }
      if (target.closest('#chronic-close') || target.id === 'chronic-overlay') {
        closeChronic(ctx, target);
        return;
      }

      const chip = target.closest('.chip[data-code]');
      if (chip) { activateChip(ctx, chip); return; }

      /* header 的模式三鈕：要排在下方泛用 `.seg-btn` 那條之前——那條沒有「已是目前模式
         就不動」的守門，也不播報。設定 popover 的 #seg-mode 仍走泛用那條。 */
      const modeBtn = target.closest('#mode-switch [data-mode]');
      if (modeBtn) { chooseMode(ctx, modeBtn.getAttribute('data-mode')); return; }

      const region = target.closest('.region-btn');
      if (region) {
        store.toggleRegion(Number(region.dataset.regionIndex));
        // 只播報取消：那是「全部按鈕都變成未選取」這個看不出來的狀態；選取本身有 aria-pressed 可讀
        if (store.getState().region === null) announce('已取消部位篩選，顯示全部部位');
        return;
      }

      const panelToggle = target.closest('.panel-toggle');
      if (panelToggle) { store.toggleExpanded(panelToggle.dataset.panelToggle); return; }

      if (target.closest('#expand-all-panels')) { toggleAllPanels(ctx); return; }

      const quickToggle = target.closest('.quick-toggle');
      if (quickToggle) { store.toggleQuick(quickToggle.dataset.quickToggle); return; }

      const cartCode = target.closest('b.cart-code');
      if (cartCode) { copyCartCode(cartCode, ctx); return; }
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
        removeFromCart(ctx, remove.closest('li').dataset.code);
        return;
      }

      /* 通知列的「復原」。排在泛用 `button` 那條之前——那條會先看到 id 不在白名單裡
         就靜默 return，等於這顆鈕永遠按不動。 */
      if (target.closest('#notice-undo')) { runUndo(); return; }

      /* 搜尋的「返回」：認 class 不認 id，三套版面共用這一條（UX 稽核 U3）。
         1c 那顆的 id 仍是 #dock-search-back（既有 E2E 靠它定位），但走的是同一個 handler。
         焦點回搜尋框：按「返回」通常是要改關鍵字重搜，不是要離開搜尋。 */
      if (target.closest('.search-back')) { leaveSearch(ctx, target, true); return; }

      /* 1a 左欄的面板索引（UX 稽核 U8）。「捲到哪裡」只有渲染層算得出來（它握著中欄的
         捲動容器與那一批面板），所以走 ctx.onPanelIndex——與 #cart-toggle 同一個作法。 */
      const panelIndexItem = target.closest('.panel-index-item');
      if (panelIndexItem) {
        if (typeof ctx.onPanelIndex === 'function') ctx.onPanelIndex(panelIndexItem.dataset.panelIndex);
        return;
      }

      /* 版面切換鈕（1a 的「側掛置頂」／1c 的「展開」）。走 ctx.switchLayout 而不是
         store.setLayout：切到 dock 時還要接著開置頂小視窗，而那個 controller 只有
         app.js 拿得到。1c 置頂時這條委派搆不到，render-dock.js 有一份同樣的代打。 */
      const layoutGo = target.closest('[data-layout-go]');
      if (layoutGo) { ctx.switchLayout(layoutGo.dataset.layoutGo); return; }

      const seg = target.closest('.seg-btn');
      if (seg) {
        if (seg.dataset.mode) store.setMode(seg.dataset.mode);
        else if (seg.dataset.format) chooseCopyFormat(ctx, seg.dataset.format);
        return;
      }

      const btn = target.closest('button');
      if (!btn) return;
      if (btn.id === 'settings-toggle') { store.toggleSettings(); return; }
      if (btn.id === 'theme-toggle') { store.toggleTheme(); return; }
      if (btn.id === 'shelf-toggle') { store.toggleShelf(); return; }
      if (btn.id === 'reset-panes') { resetPanes(ctx); return; }
      if (btn.id === 'cart-toggle') { if (typeof ctx.onCartToggle === 'function') ctx.onCartToggle(); return; }
      if (btn.id === 'clear-cart') { clearCartWithUndo(ctx); return; }
      if (btn.id === 'copy-date') { copyDate(); return; }
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
      if (ev.target && ev.target.classList && ev.target.classList.contains('ccr-input')) {
        recalcCcr(ctx, ev.target);
        return;
      }
      if (ev.target && ev.target.classList && ev.target.classList.contains('lipid-input')) {
        recalcLipid(ctx, ev.target);
        return;
      }
      if (!ev.target || ev.target.id !== 'search') return;
      const value = ev.target.value;
      if (value.trim().length >= 2) data.ensureDb();     // 觸發全庫延遲載入
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => store.setQuery(value), SEARCH_DEBOUNCE);
    });

    /* 勾選變動走 change：checkbox 的正規事件是 change，input 在部分瀏覽器上不保證。 */
    document.addEventListener('change', (ev) => {
      if (ev.target && ev.target.dataset && ev.target.dataset.lipidKey) {
        recalcLipid(ctx, ev.target);
      }
    });

    document.addEventListener('keydown', (ev) => {
      if (ev.target && ev.target.id === 'search') {
        if (ev.key === 'Escape') {
          // 與「返回」鈕完全同一條路（三版面共用 leaveSearch），title 上寫的 Esc 才算實現
          leaveSearch(ctx, ev.target);
          // Esc 在其他情境都會關掉開著的浮層，搜尋框裡也要一致（R2 M3）
          if (isFallbackOpen()) closeFallbackCopy();
          else if (store.getState().lipidOpen) closeLipid(ctx, ev.target);
          else if (store.getState().ccrOpen) closeCcr(ctx, ev.target);
          else if (store.getState().chronicTopic) closeChronic(ctx, ev.target);
          else if (store.getState().settingsOpen) store.setSettingsOpen(false);
          return;
        }
        if (ev.key === 'Enter') {
          ev.preventDefault();
          clearTimeout(searchDebounce);
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
      /* b.cart-code 是 role="button" 的自訂控制項，原生按鈕的 Enter／Space 要自己補，
         否則鍵盤使用者聚焦得到卻按不動（v1 §3 的唯一破口）。Space 一定要 preventDefault，
         不然清單區會跟著捲一頁。 */
      const codeBtn = ev.target && ev.target.closest ? ev.target.closest('b.cart-code') : null;
      if (codeBtn && (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar')) {
        ev.preventDefault();
        copyCartCode(codeBtn, ctx);
        return;
      }
      if (ev.key === 'Escape') {
        if (isFallbackOpen()) { closeFallbackCopy(); return; }
        // 四個浮層互斥（開任一個會關掉其他三個），所以這裡的順序只是保險
        if (store.getState().lipidOpen) { closeLipid(ctx, ev.target); return; }
        if (store.getState().ccrOpen) { closeCcr(ctx, ev.target); return; }
        if (store.getState().chronicTopic) { closeChronic(ctx, ev.target); return; }
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

  /* 「全展開／全收合」：只動目前畫面上這一批（現在的模式＋部位），
     而且只算有常見疾病的面板——沒有疾病的面板本來就沒有展開鈕，
     把它算進去會讓「是不是全開了」永遠不成立，按鈕就再也切不到「全收合」。 */
  function panelsWithDiseases(ctx) {
    const s = ctx.store.getState();
    return ctx.data.panelsFor(s.mode, s.region)
      .filter((p) => p.diseases && p.diseases.length)
      .map((p) => p.name);
  }

  function allPanelsExpanded(ctx) {
    const names = panelsWithDiseases(ctx);
    return names.length > 0 && names.every((n) => ctx.store.isExpanded(n));
  }

  function toggleAllPanels(ctx) {
    const names = panelsWithDiseases(ctx);
    if (!names.length) return;
    const open = !allPanelsExpanded(ctx);
    ctx.store.setExpandedAll(names, open);
    announce(open ? '已展開全部常見疾病' : '已收合全部常見疾病');
  }

  root.ICDInteractions = {
    wire, chooseCopyFormat, copyText, openFallbackCopy, closeFallbackCopy, isFallbackOpen, announce,
    activateChip, copyCartCode, setFeedbackDocument,
    leaveSearch, clipboardSyncInfo,
    // 1c 置頂時 main document 的委派搆不到側欄，render-dock.js 要用同一份實作代打
    removeFromCart, clearCartWithUndo, runUndo,
    chooseMode, chooseAllRegions, resetPanes, chooseChronic, closeChronic,
    toggleAllPanels, allPanelsExpanded,
    openCcr, closeCcr, recalcCcr, chooseCcrSex, resetCcr, copyCcr,
    openLipid, closeLipid, recalcLipid, chooseLipidSex, resetLipid, copyLipid,
  };
})(typeof self !== 'undefined' ? self : this);
