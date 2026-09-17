/* 三套版面共用的區塊更新：搜尋結果、診斷清單、常用列、HIS 貼上文字、通知列、
   搜尋返回鈕、剪貼簿已同步標記，以及面板的全展開鈕。
   渲染規則與 R 的來源見 render-dom.js。 */
(function (root) {
  'use strict';

  // render-dom.js 已經建立這個物件（build.py 的 SOURCES 保證順序）
  const R = root.ICDRender;

  // ---- 搜尋結果 ----
  const DB_NOTE = {
    idle: '精選面板結果\n輸入後才載入全庫',
    loading: '精選面板結果\n全庫索引載入中…',
    error: '全庫載入失敗，僅顯示精選面板結果',
    ready: '',
  };

  /* 空狀態文案。全庫未就緒時的搜尋來源是精選池，而精選池沒有英文欄（建置期只注入中文），
     此時叫使用者「試試英文」是唯一保證無效的建議（R2 I1）——依 pool／dbState 給誠實
     而且真的可行的下一步。 */
  const EMPTY_FULL = '查無結果，試試英文名稱或代碼前綴';
  const EMPTY_CURATED = {
    idle: '查無結果。全庫尚未載入，目前只搜尋精選面板\n請改用中文或代碼前綴',
    loading: '查無結果。全庫索引載入中，就緒後即可搜尋英文\n目前請改用中文或代碼前綴',
    error: '查無結果。全庫無法載入，目前只搜尋精選面板的中文與代碼\n可在設定面板重新載入全庫',
    ready: '查無結果，試試英文名稱或代碼前綴',
  };

  const emptyText = (pool, dbState) => (pool === 'full'
    ? EMPTY_FULL
    : EMPTY_CURATED[dbState] || EMPTY_CURATED.idle);

  /* 只在「狀態的 query 與輸入框不同」時才回寫（例如 Esc 清空、Enter 加碼後清空），
     避免打字時游標跳位。三套版面的搜尋框行為完全一樣，只有 input 節點不同。 */
  function syncSearchValue(input, ctx) {
    const s = ctx.store.getState();
    if (input.value !== s.query) input.value = s.query;
  }

  /* card 是外層（要 hidden 切換），host 是 chip 容器，note 是右上角說明。 */
  function renderResults(card, host, note, ctx) {
    const s = ctx.store.getState();
    const q = s.query.trim();
    R.clear(host);
    if (q.length < 2) {
      card.hidden = true;
      note.textContent = '';
      return;
    }
    card.hidden = false;
    const rows = ctx.data.search(q);
    if (!rows.length) {
      host.appendChild(R.el('span', 'result-empty', emptyText(rows.pool, s.dbState)));
      note.textContent = rows.pool === 'full' ? '' : DB_NOTE[s.dbState] || '';
      return;
    }
    for (const row of rows) {
      const leaf = row[1] === 1;
      host.appendChild(R.chipWith(ctx, row[0], row[3], { cat: !leaf }));
    }
    if (rows.pool === 'full') {
      note.textContent = '全庫命中 ' + rows.total.toLocaleString() + ' 筆'
        + (rows.total > rows.length ? '，顯示前 ' + rows.length + ' 筆' : '')
        + '　虛線＝類目碼不可申報';
    } else {
      note.textContent = DB_NOTE[s.dbState] || '精選面板結果';
    }
  }

  // ---- 就診清單 ----
  function cartItemEl(item, i, ctx) {
    const fav = ctx.store.isFav(item.code);
    const adjunct = R.isAdjunctCode(ctx, item.code);
    const li = document.createElement('li');
    li.dataset.code = item.code;
    li.draggable = true;
    li.tabIndex = 0;
    li.title = '拖曳可調整順序（或用 Alt+↑／Alt+↓）';
    if (adjunct) li.classList.add('is-adjunct');

    const grip = R.icon('grip', 14);
    grip.classList.add('cart-grip');
    const badge = R.el('span', 'cart-badge', i === 0 ? '主' : String(i + 1));
    if (i === 0) badge.dataset.primary = 'true';
    badge.title = i === 0 ? '主診斷' : '第 ' + (i + 1) + ' 順位';
    // 附加碼（B95–B97／Z16）站在第一位＝主診斷錯誤，徽章要自己看得出來
    if (adjunct && i === 0) {
      badge.dataset.warn = 'true';
      badge.title = '附加碼不可作為主診斷：請加入主要疾病並把它排到第一位';
    }

    /* 可點擊就必須可聚焦、可用鍵盤觸發（v1 §3 的唯一破口：三套版面都到不了這一顆）。
       保留 <b> 而不換成 <button>：三套 CSS 都以 `b.cart-code` 選取它，換元素等於連帶
       改掉外觀，而樣式是另一條工作線。補上 role＋tabindex＋鍵盤事件同樣語意完整；
       鍵盤觸發在 interactions.js（1c 進 PiP 小視窗期間由 render-dock.js 代打）。 */
    const code = R.el('b', 'cart-code', item.code);
    code.setAttribute('role', 'button');
    code.tabIndex = 0;
    code.title = '點擊複製此碼';
    const zh = R.el('span', 'cart-zh', item.zh);

    const primary = R.el('button', 'cart-primary', '主');
    primary.type = 'button';
    primary.title = '設為主診斷';
    const favBtn = R.el('button', 'cart-fav');
    favBtn.type = 'button';
    favBtn.title = fav ? '取消我的最愛' : '加入我的最愛';
    favBtn.setAttribute('aria-pressed', fav ? 'true' : 'false');
    favBtn.appendChild(R.icon('star', 14));
    const remove = R.el('button', 'cart-remove');
    remove.type = 'button';
    remove.title = '移除';
    remove.appendChild(R.icon('x', 14));

    li.append(grip, badge, code, zh);
    // 標記放在 .cart-zh 之外：那個 span 有 ellipsis，寫成 ::after 會被中文名擠掉一半
    if (adjunct) li.appendChild(R.el('i', 'chip-tag', '附加碼'));
    li.append(primary, favBtn, remove);
    return li;
  }

  function renderCart(ul, empty, count, ctx) {
    const s = ctx.store.getState();
    R.clear(ul);
    s.cart.forEach((item, i) => ul.appendChild(cartItemEl(item, i, ctx)));
    if (empty) empty.hidden = s.cart.length > 0;
    if (count) count.textContent = s.cart.length ? String(s.cart.length) : '';
    /* 第一位是附加碼時掛旗標，由 CSS 的 ::before 顯示整條警示（三套版面共用 #cart）。
       刻意不插一個 <li>：#cart 的 li 索引就是清單順序，拖曳換序的 indexOfRow()
       與 Alt+↑↓ 都直接用 children 索引，多一列非代碼的 li 會讓換序全部錯位。 */
    if (s.cart.length && R.isAdjunctCode(ctx, s.cart[0].code)) ul.dataset.primaryAdjunct = 'true';
    else delete ul.dataset.primaryAdjunct;
  }

  /* 「清空」鈕：清單為空時停用。以前旁邊的複製鈕就這樣做（現已移除），只有這一顆
     永遠可按，同一列兩顆鈕兩套規則（v1 §3）。停用時 title 要說明原因，否則按不動像壞掉
     ——與設定面板的 #reset-panes 同一個作法。三套版面共用，各自在 U.cart 裡呼叫。 */
  function syncClearBtn(btn, ctx) {
    if (!btn) return;
    const empty = !ctx.store.getState().cart.length;
    btn.disabled = empty;
    btn.title = empty ? '清單已是空的' : '清空本次就診清單';
  }

  // ---- 貼入 HIS ----
  const FORMAT_LABEL = { lines: '每行一碼', comma: '逗號分隔', names: '碼＋名稱' };

  /* 預覽文字必須與剪貼簿內容同源：兩邊都呼叫 logic.formatCart，看到的＝貼出去的。 */
  function hisText(ctx) {
    const s = ctx.store.getState();
    return root.ICDClipboard.format('cart', s.cart, s.clipboardFormats, s.format);
  }

  function renderHis(pre, formatLabel, copyBtn, ctx) {
    const s = ctx.store.getState();
    const text = hisText(ctx);
    pre.textContent = text || '（清單為空）';
    if (formatLabel) formatLabel.textContent = s.clipboardFormats.cart ? '自訂格式' : (FORMAT_LABEL[s.format] || FORMAT_LABEL.lines);
    if (copyBtn) {
      copyBtn.textContent = s.copied ? '已複製 ✓ 可貼入 HIS' : '複製並貼入 HIS';
      R.blueprint(copyBtn);
      copyBtn.disabled = !s.cart.length;
    }
  }

  // ---- 常用列（★最愛在前、最近使用在後） ----
  function renderShelf(host, empty, ctx) {
    const s = ctx.store.getState();
    R.clear(host);
    for (const code of s.favs) {
      host.appendChild(R.chipWith(ctx, code, ctx.data.labelOf(code), {
        className: 'shelf-chip is-fav', star: true, title: '★ ' + code + ' ' + ctx.data.labelOf(code),
      }));
    }
    for (const code of s.recent) {
      if (s.favs.indexOf(code) >= 0) continue;
      host.appendChild(R.chipWith(ctx, code, ctx.data.labelOf(code), { className: 'shelf-chip' }));
    }
    if (empty) {
      empty.hidden = !!(s.favs.length || s.recent.length);
      host.appendChild(empty);       // R.clear() 會把它一起清掉，重新掛回來
    }
  }

  /* ── 搜尋的「返回」（三套版面共用一顆 .search-back） ──────────────────────────
     原本只有 1c 有（`#dock-search-back`），1a／1b 要回到原本的部位只能自己清空搜尋框，
     而 Esc 這條路沒有任何地方寫出來（UX 稽核 U3）。行為的唯一實作在 interactions.js 的
     `leaveSearch()`——清空 query 之後，「回到搜尋前的捲動位置」由各版面 update() 的
     positions 還原（三套用同一個資料結構，見各檔的 `positions`）。

     `id` 只有 1c 需要：既有 E2E（test_e2e_dock_flow.py）靠 `#dock-search-back` 定位，
     共用化不得換掉它。事件委派一律認 class，不認 id。
     擺在哪一列由各版面決定（1a 中欄標題列、1b 搜尋列、1c 搜尋列），共通點是
     **都是既有的那一列**——為回頭路另闢一列 chrome 會違反密度原則。 */
  function searchBackEl(id) {
    const b = R.el('button', 'search-back', '返回');
    b.type = 'button';
    if (id) b.id = id;
    b.title = '結束搜尋，回到原本的部位與位置（Esc）';
    b.setAttribute('aria-label', b.title);
    b.hidden = true;
    return b;
  }

  /* ── 剪貼簿同步狀態（三套版面共用一個 #clipboard-sync） ──────────────────────
     為什麼要有：沒有「複製並貼入 HIS」鈕是刻意的（點碼即自動同步），但畫面上**一個字
     都沒說剪貼簿已經同步**，醫師只能相信它；中途複製過別的東西也不會有人提醒
     （UX 稽核 U4）。

     兩個約束：
       1. **不新增任何一列**——寫在既有的「貼入 HIS」標題列（1a／1b）與清單摘要列（1c）
          右側，量測前後那幾列的高度必須相同（tests/test_e2e_navigation.py 的 BASELINE）。
       2. **失敗不自動消失**——與通知列 `{ sticky: true }` 同一個判準：它講的是使用者
          下一步該做什麼（剪貼簿被拒，要點清單裡的代碼逐一複製），下次成功才換回時間。
     狀態由 interactions.js 的 syncClipboard() 持有（`clipboardSyncInfo()`），這裡只畫。 */
  function clipboardSyncEl() {
    const s = R.el('span', 'clip-sync');
    s.id = 'clipboard-sync';
    s.hidden = true;
    return s;
  }

  function renderClipboardSync(scope) {
    if (!scope || !scope.querySelector) return;
    const node = scope.querySelector('#clipboard-sync');
    if (!node) return;
    const info = (root.ICDInteractions && root.ICDInteractions.clipboardSyncInfo
      && root.ICDInteractions.clipboardSyncInfo()) || null;
    if (!info) { node.hidden = true; node.textContent = ''; node.classList.remove('is-stale'); return; }
    const ok = !!info.ok;
    node.hidden = false;
    node.textContent = ok ? '已同步 ' + root.ICDLogic.clockHM(info.at) : '未同步';
    node.classList.toggle('is-stale', !ok);
    node.title = ok
      ? '清單已於 ' + root.ICDLogic.clockHM(info.at) + ' 同步到剪貼簿，可直接貼入 HIS'
      : '剪貼簿沒有同步到（被瀏覽器拒絕）；請點清單裡的代碼逐一複製';
  }

  /* ── 可見通知列（三套版面共用一個 #notice） ──────────────────────────────────
     為什麼要有：`#status` 是 1×1px 的 sr-only live region，只有螢幕閱讀器聽得到。
     UX 實測（2026-09-16）點一個已在清單的碼，三套版面的截圖 md5 完全相同——醫師唯一
     能做的是回頭數清單，而那是每一次點擊都在發生的事。

     三個設計約束，都不是可有可無的：
       1. **覆蓋、不推擠**（`position:absolute; top:100%`，包含塊是各版面 position:relative
          的 header）：提示出現時若把內容往下推，醫師正要點的那個碼就會移位。
       2. **不吃點擊**（`pointer-events:none`，只有「復原」鈕自己收回 auto）：這一列蓋在
          第一批診斷碼上面，讓它攔下點擊等於用回饋換掉主要動線。
       3. **沒訊息時不存在**（`hidden`）：一次性提示要自己消失（密度原則手法 #4）。
     逾時與 sticky 的規則在 interactions.js 的 announce()；這裡只建節點。

     文字段落掛 `aria-hidden`：同一則訊息已經由 #status 播報過，這裡再讀一次是重複。
     「復原」鈕**不能**一起 aria-hidden（那會讓可聚焦元素消失在 AT 的樹裡），所以它是
     #notice 的兄弟節點而不是被隱藏那段的子節點。 */
  function noticeEl() {
    const box = R.el('div');
    box.id = 'notice';
    box.hidden = true;
    const text = R.el('span', 'notice-text');
    text.setAttribute('aria-hidden', 'true');
    const undo = R.el('button', 'notice-undo', '復原');
    undo.type = 'button';
    undo.id = 'notice-undo';
    undo.title = '復原剛才的清單變更';
    undo.hidden = true;
    box.append(text, undo);
    return box;
  }

  /* 「已加入清單」勾號的唯一同步實作（三套版面共用）。原本只有 render-dock.js 有一份，
     所以工作台與手機完全看不出哪些碼已經在清單裡（UX 稽核 U2）。
     類目碼排除在外：它加不進清單，掛勾號只會製造矛盾的訊號。
     勾號本身是 app.css 的 `.chip[data-in-cart="true"]::after`——用 ::after 而不是動
     border/background，紅旗警示色、類目虛線與附加碼標記才不會被蓋掉（硬性邊界 #3）。 */
  function syncInCart(scope, ctx) {
    if (!scope) return;
    const selected = new Set(ctx.store.getState().cart.map((item) => item.code));
    for (const chip of scope.querySelectorAll('.chip:not(.cat)')) {
      const on = selected.has(chip.dataset.code);
      if (on) chip.dataset.inCart = 'true';
      else delete chip.dataset.inCart;
      chip.setAttribute('aria-label', chip.title + (on ? '（已加入清單）' : ''));
    }
  }

  /* ── 部位選單與面板的共同骨架（三套版面共用） ──────────────────────────────
     原本三個版面檔各自複寫同一段迴圈，結果是同一顆部位鈕的 tooltip 長出三種答案：
     1a 只在選取時才設、1c 一律設且帶筆數、1b 一律設但不帶筆數。差異被參數化之後，
     「哪裡不一樣」變成看得見的選項，而不是要比對三份程式碼才能發現的漂移。 */

  /* 部位選單。差異參數：
       className   額外的樣式修飾類（1c 的 region-pill--dock、1b 的 region-pill）
       short       true ＝ 鈕面只放兩字短名（空間妥協），全名一律留在 title
       count       false ＝ 不畫筆數 span（1c 的兩字鈕塞不下）
       keepOthers  true ＝ 容器裡還有別的東西（1a 的欄標題），只移除舊的 .region-btn
     tooltip 統一成「全名（N）」＋選取時的取消說明，三套版面同一句。
     回傳「現在是不是外科模式」，讓呼叫端接著處理各自的標題文字。 */
  function renderRegionMenu(container, ctx, opts) {
    const o = opts || {};
    const s = ctx.store.getState();
    const surg = s.mode === 'surg';
    container.setAttribute('aria-label', surg ? '手術情境' : '身體部位');
    // 1a 的容器裡還有欄標題，不能整個清掉
    if (o.keepOthers) for (const old of Array.from(container.querySelectorAll('.region-btn'))) old.remove();
    else R.clear(container);
    const active = ctx.data.clampRegion(s.mode, s.region);     // null ＝ 沒有選取任何部位
    ctx.data.regionsFor(s.mode).forEach((region, i) => {
      // 事件委派認的是 .region-btn ＋ data-region-index；data-region 一律是完整名稱
      // （E2E 與分組標題靠它），短名只出現在鈕面上。
      const b = R.el('button', 'region-btn' + (o.className ? ' ' + o.className : ''));
      b.type = 'button';
      b.dataset.region = region.name;
      b.dataset.regionIndex = String(i);
      const on = i === active;
      R.markRegionSelected(b, on);
      // 「再點一次取消」不是通用慣例，滑鼠使用者看不出來；鍵盤／讀屏走 aria-pressed 與播報
      b.title = region.name + '（' + region.count + '）'
        + (on ? '，再點一次取消選取，顯示全部部位' : '');
      const label = o.short ? R.regionShort(region.name) : region.name;
      if (o.count === false) b.textContent = label;
      else b.append(R.el('span', null, label), R.el('span', 'region-count', String(region.count)));
      container.appendChild(b);
    });
    return surg;
  }

  /* 面板的外兩層迴圈。`panelGroupsFor()` 是紅旗隔離的唯一出口——非急診模式一律回傳空的
     redFlags，渲染層不得自行從 window.CURATED 取 redFlags 繞過它（C5，臨床安全）。
     這個函式的存在就是為了讓那個出口只剩一處呼叫。
       before(group)        可選：該組的面板之前要插的東西（1a 認領該部位的快選卡）
       panel(panel, group)  必填：建好一張卡並自行 append 進 container
     卡片內容刻意不參數化：三套版面的卡片結構本來就不同（1a 全展開、1c 懶載入切換、
     1b 展開時內嵌），塞進同一個函式只會變成一堆 if。共用的是外層這兩圈，
     而那正是三份程式碼原本各自複寫、最容易漏改的部分。
     容器要不要先清空由呼叫端決定（1c 有自己的重建快取）。 */
  function renderPanels(container, ctx, opts) {
    const s = ctx.store.getState();
    for (const group of ctx.data.panelGroupsFor(s.mode, s.region)) {
      // group.region 只有「顯示全部部位」時才有值（見 data.js panelGroupsFor 的註解）
      if (group.region) container.appendChild(R.regionHeading(group.region));
      if (opts.before) opts.before(group);
      for (const panel of group.panels) opts.panel(panel, group);
    }
  }

  /* 1c 的「全展開／全收合」。文字會隨當下狀態換（見 render-dock.js 的 U.panels），
     所以這裡只給初值；不用圖示是因為兩個方向的圖示在 176px 分不出來。 */
  function expandAllButtonEl() {
    const b = R.el('button', 'btn btn-secondary seg-btn--sm expand-all-btn', '全展開');
    b.type = 'button';
    b.id = 'expand-all-panels';
    b.title = '把目前這一批面板的常見疾病全部展開';
    return b;
  }

  Object.assign(root.ICDRender = root.ICDRender || {}, {
    syncSearchValue, renderResults, emptyText,
    cartItemEl, renderCart, syncClearBtn, hisText, renderHis, renderShelf,
    noticeEl, syncInCart, searchBackEl, clipboardSyncEl, renderClipboardSync,
    renderRegionMenu, renderPanels,
    expandAllButtonEl, FORMAT_LABEL,
  });
})(typeof self !== 'undefined' ? self : this);
