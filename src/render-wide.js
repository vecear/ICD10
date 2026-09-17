/* 1a 桌機工作台的版面組裝（body[data-layout="wide"]）。掛 window.ICDWide。

   `mount(host, ctx)` 只建一次骨架，回傳 `{ update(changedKeys) }`；後續狀態變動只重畫
   受影響的區塊——搜尋框因此不會在每次重繪時失去焦點與游標位置。
   所有互動都由 interactions.js 以事件委派處理，這裡不掛任何 handler。 */
(function (root) {
  'use strict';

  const R = root.ICDRender;

  /* 狀態欄位 → 需要重跑的更新器。null／未列出的欄位一律全部重跑（保守但不會漏畫）。 */
  const DEPS = {
    mode: ['header', 'rail', 'panels', 'quick', 'settings', 'panelIndex'],
    region: ['rail', 'panels', 'panelIndex'],
    query: ['results', 'searchValue', 'panelIndex'],
    // shelf 一定要在：常用列的中文名靠 data.labelOf() 查全庫，全庫就緒前是光禿禿的代碼，
    // 漏了它就得剛好動到 favs／recent／shelfOpen 才會補上中文（R2 I4）
    dbState: ['results', 'settings', 'shelf'],
    expanded: ['panels', 'panelIndex'],
    quickOpen: ['quick'],
    cart: ['cart', 'his'],
    relatedCode: [],
    favs: ['shelf', 'cart'],
    recent: ['shelf'],
    format: ['his', 'settings'],
    clipboardFormats: ['his', 'settings'],
    clipboardWarning: ['settings'],
    copied: ['his'],
    theme: ['settings'],
    layout: ['settings'],
    shelfOpen: ['shelf', 'settings'],
    settingsOpen: ['settings'],
    chronicTopic: ['chronic'],
    ccrOpen: ['ccr'],
    lipidOpen: ['lipid'],
    // 高度本身由 update() 末尾的 applyPanes() 統一處理；這裡只同步設定面板的
    // 「回復預設高度」可按狀態（不寫這條會退回全量重繪，每拖一次整片重畫）
    paneSizes: ['settings'],
  };

  function mount(host, ctx) {
    const refs = {};
    const wide = R.el('div');
    wide.id = 'layout-wide';

    // ── header ──────────────────────────────────────────────────────────
    const header = R.el('header', 'app-header');
    // 頁面唯一的 H1（sr-only）。可見的 .app-brand 只有「ICD-10」，改成 <h1> 會被
    // industry.css 的 h* 邊界值擠動版面，所以用視覺隱藏的標題補階層（見 srHeading）。
    header.append(R.srHeading(1, 'ICD-10 門診導引'), R.el('div', 'app-brand', 'ICD-10'));
    // 「日期」＋看診模式三鈕並排在 header（1440 空間充足，用全名、不壓縮）
    refs.dateBtn = R.dateBtnEl(false);
    refs.modeSwitch = R.modeSwitchEl(false);
    header.append(refs.dateBtn, refs.modeSwitch);

    /* 「健保規範條文／血脂計算機／CCr」：1a 的 header 只有一列而且 1440 下大量留白
       （搜尋框是 flex:1，讓出 200px 仍有八百多），所以這裡是三套版面中唯一把它常駐在
       固定 chrome 的——密度預算在這個寬度下不是稀缺資源。1c／1b 的空間帳完全不同，
       見那兩個檔的註解。擺在模式三鈕之後、搜尋之前：控制項集中在左側，
       搜尋仍是那個會伸縮的元素。CCr 原本單獨排在「日期」右邊，現在跟著另一個計算機走。

       尺寸與這一列的其他控制項一律 32px／13px（2026-09-17，見 wide.css 的 header 區塊）：
       原本刻意做小（28／12）是想讓它「不像第四種看診模式」，但實測的結果是**最常用的
       臨床查詢變成全列最小的一顆**。分辨靠的是外框與底色，不是大小——模式鈕有實心
       選中底色（--sel-bg），這三顆永遠是透明外框。 */
    refs.chronicSwitch = R.chronicSwitchEl(false);
    header.appendChild(refs.chronicSwitch);

    const search = document.createElement('input');
    search.id = 'search';
    search.className = 'input';
    search.type = 'search';
    search.autocomplete = 'off';
    search.placeholder = '搜尋：蜂窩、cellulitis、L03…　Enter 加入第一筆';
    search.setAttribute('aria-label', '搜尋診斷碼');
    refs.search = search;
    header.appendChild(search);

    /* 「側掛置頂」：一鍵切成側掛窄欄並開啟置頂小視窗。擺在設定鈕左邊——它取代的正是
       設定裡那組「桌機版面」，位置接近，肌肉記憶不用重學。

       header 是 nowrap 且搜尋框 flex:1／min-width:0，所以多這一顆不會水平溢出，
       是**吃搜尋框的寬度**。實測搜尋框：1920px→1119、1440px→639、1100px→299、
       900px→99（900 是 wide 的下限，也是 test_no_horizontal_overflow 在測的寬度）。
       所以 ≤1239px 時由 wide.css 把文字藏起來只留 icon，名稱走 title——
       與 1c 的置頂鈕同一套機制。 */
    header.appendChild(R.layoutToggleEl('dock', false));

    const settingsToggle = R.el('button', 'btn btn-secondary', '設定');
    settingsToggle.type = 'button';
    settingsToggle.id = 'settings-toggle';
    settingsToggle.setAttribute('aria-expanded', 'false');
    settingsToggle.setAttribute('aria-haspopup', 'true');
    settingsToggle.appendChild(R.icon('chevronDown', 14));
    header.appendChild(settingsToggle);
    header.appendChild(R.settingsPopoverEl(false));
    /* 可見通知列：絕對定位貼在 header 下緣，覆蓋常用列／內容最上緣而不推擠它們
       （醫師正要點的碼不能移位）。三套版面同一個 #notice，見 render-common.js 的 noticeEl。 */
    header.appendChild(R.noticeEl());
    wide.appendChild(header);

    // ── 常用列 ──────────────────────────────────────────────────────────
    const shelf = R.el('div');
    shelf.id = 'shelf';
    shelf.append(R.el('span', 'kicker shelf-kicker', '常用'));
    refs.shelfChips = R.el('div', 'shelf-chips');
    refs.shelfEmpty = R.el('span', 'shelf-empty', '尚未選過碼，點任何代碼即會留在這裡（★ 為我的最愛）。');
    refs.shelfChips.appendChild(refs.shelfEmpty);
    shelf.appendChild(refs.shelfChips);
    refs.shelf = shelf;
    wide.appendChild(shelf);

    // ── 三欄主體 ────────────────────────────────────────────────────────
    const bench = R.el('div', 'workbench');

    const rail = R.regionGroupEl('region-rail', '身體部位');
    refs.railTitle = R.el('div', 'kicker', '身體部位');
    refs.railTitle.id = 'region-rail-title';
    /* 原本這裡有一行 #region-all-note（「目前顯示全部部位，點任一部位可篩選」），用來
       補償「沒有任何一顆標亮」看起來像壞掉。現在 rail 最前面就有一顆「全部」鈕，未選部位
       時它自己是標亮的——狀態已經看得見，那行字變成同一件事講兩次，而且它只在 1a 且
       ≥1240px 時出現，正是使用者抱怨的「功能只有某個介面才有」。故移除（見 .review/r4-ui.md）。 */
    rail.append(refs.railTitle);
    refs.rail = rail;

    /* ── 面板索引（UX 稽核 U8） ──────────────────────────────────────────────
       部位列下方原本有 332.7px 完全空白，而中欄預設就要捲 5.8 屏、取消部位選取要捲
       27,034px——最寬的版面卻是捲最久的。這一塊把已經浪費掉的版面換成動線，
       不新增控制列、也不從內容區借任何高度（`#panels` 的 scrollHeight 前後相同）。

       **不掛在 `#region-rail` 裡面**：那是一個 `role="group" aria-label="身體部位"`，
       把面板名塞進去等於對讀屏宣告「這些也是身體部位」。改成左欄多一層 `.rail-col`
       當格線欄，部位列與索引是它的兩個兄弟，各自有自己的 group 標籤。 */
    refs.panelIndex = R.el('nav', 'panel-index');
    refs.panelIndex.id = 'panel-index';
    refs.panelIndex.setAttribute('aria-label', '面板索引');
    refs.panelIndex.append(R.el('div', 'kicker panel-index-kicker', '面板'));

    const railCol = R.el('div', 'rail-col');
    railCol.append(rail, refs.panelIndex);
    refs.railCol = railCol;
    bench.appendChild(railCol);

    /* 主要內容區＝<main>（v3 §5-1：原本只有 banner 與 complementary 兩個地標，
       中間的搜尋結果＋主訴面板不屬於任何地標，AT 的地標導覽跳不進來）。
       只有這一個 main：部位列是 role="group"、右欄是 <aside>（complementary）。 */
    const sheet = R.el('main', 'worksheet');
    sheet.append(R.srHeading(2, '診斷碼選擇'));
    const resultsCard = R.el('div');
    resultsCard.id = 'results-card';
    resultsCard.hidden = true;
    const resultsHead = R.el('div', 'results-head');
    refs.resultNote = R.el('div', 'result-note');
    resultsHead.append(R.el('div', 'results-title', '搜尋結果'), refs.resultNote);
    refs.results = R.el('div', 'chip-row');
    refs.results.id = 'search-results';
    resultsCard.append(resultsHead, refs.results);
    refs.resultsCard = resultsCard;
    sheet.appendChild(resultsCard);

    const head = R.el('div', 'worksheet-head');
    refs.panelsTitle = R.el('h3', null, '');
    refs.panelsTitle.id = 'panels-title';
    refs.modeHint = R.el('span', null, '');
    refs.modeHint.id = 'mode-hint';
    /* 「返回」擺在這一列的右側、**佔說明文字的位置**（UX 稽核 U3）：搜尋狀態下把
       `#mode-hint` 換成它，那句「每個部位最上面是常用碼…」在搜尋時本來就不適用。
       所以這顆鈕一像素都沒有多付——沒有為回頭路另闢一列 chrome。 */
    refs.searchBack = R.searchBackEl();
    head.append(refs.panelsTitle, refs.modeHint, refs.searchBack);
    sheet.appendChild(head);

    /* 快選排在面板之前（使用者 2026-09-01）：「常用慢性病」是內科門診最常用的一群碼，
       原本要捲過十幾個面板才看得到。1c／1b 沒有這一區（只有 1a render 快選）。 */
    refs.quick = R.el('div');
    refs.quick.id = 'quick';
    sheet.appendChild(refs.quick);

    refs.panels = R.el('div');
    refs.panels.id = 'panels';
    sheet.appendChild(refs.panels);
    bench.appendChild(sheet);

    // 右欄：清單 → 貼入 HIS
    const aside = R.el('aside');
    aside.id = 'cart-pane';
    const cartHead = R.el('div', 'cart-head');
    const cartTitle = R.el('h3', null, '本次就診清單 ');
    refs.cartCount = R.el('span', null, '');
    refs.cartCount.id = 'cart-count';
    cartTitle.appendChild(refs.cartCount);
    const clearBtn = R.el('button', 'btn btn-ghost', '清空');
    clearBtn.type = 'button';
    clearBtn.id = 'clear-cart';
    refs.clearCart = clearBtn;
    cartHead.append(cartTitle, clearBtn);
    aside.appendChild(cartHead);

    const cartBox = R.el('div', 'cart-box');
    cartBox.id = 'cart-box';          // 分隔條的 aria-controls 指向它
    refs.cartBox = cartBox;
    refs.cart = R.el('ul');
    refs.cart.id = 'cart';
    refs.cartEmpty = R.el('div', 'cart-empty', '點左側任何代碼加入\n第一碼即主診斷，拖曳可調整順序。');
    cartBox.append(refs.cart, refs.cartEmpty);
    aside.appendChild(cartBox);

    const his = R.el('div', 'his-card blueprint');
    his.id = 'his-card';
    R.blueprint(his);
    const hisHead = R.el('div', 'his-head');
    refs.hisFormat = R.el('span', null, '每行一碼');
    refs.hisFormat.id = 'his-format-label';
    /* 「已同步 HH:MM」（UX 稽核 U4）接在「每行一碼」旁邊：沒有複製鈕是刻意的，
       但也因此畫面上沒有任何一處說剪貼簿已經同步。不新增任何一列。 */
    refs.clipSync = R.clipboardSyncEl();
    hisHead.append(R.el('span', 'kicker', '貼入 HIS'), refs.hisFormat, refs.clipSync);
    refs.hisPreview = R.el('pre', null, '（清單為空）');
    refs.hisPreview.id = 'his-preview';
    /* 沒有複製鈕：清單一變就自動同步到剪貼簿（interactions.js 的 syncClipboard）。
       預覽區留著——它顯示的就是剪貼簿內容，貼進 HIS 前可以先核對。 */
    his.append(hisHead, refs.hisPreview);
    aside.appendChild(his);

    bench.appendChild(aside);
    wide.appendChild(bench);

    // 慢病速查浮層：掛在版面根節點底下（三套版面一致，見 render-chronic.js 的 chronicOverlayEl）
    refs.chronicOverlay = R.chronicOverlayEl();
    wide.appendChild(refs.chronicOverlay);
    refs.ccrOverlay = R.ccrOverlayEl();
    refs.lipidOverlay = R.lipidOverlayEl();
    wide.appendChild(refs.ccrOverlay);
    wide.appendChild(refs.lipidOverlay);

    host.appendChild(wide);

    /* ── 可拖曳的窗格分隔條（功能與 1b／1c 統一） ────────────────────────────
       1a 是三欄版面，垂直方向只有兩條分界真的值得可調，其餘刻意不做：
         中欄 搜尋結果↓  命中幾十筆時會把主訴面板整片推到摺線下，壓低它就能邊看結果邊選面板
         右欄 清單↓      清單長了會把「貼入 HIS」擠出視野，壓低它讓複製鈕留在視線內
       不做的：header／常用列是固定高度的控制列。三欄的**寬度**不在這次範圍內。
       這兩欄各自會捲動（.workbench > * { overflow-y:auto }），不是固定高度的 flex 盒，
       所以走 resize.js 的 scroll 模式：上限＝欄高扣掉 reserve，保證同欄其他內容還看得到。 */
    const paneOpts = { layout: 'wide', store: ctx.store };
    refs.paneGroups = [
      root.ICDResize.createGroup(Object.assign({
        container: sheet,
        reserve: 220,
        panes: [{
          key: 'results', el: refs.results, label: '搜尋結果區', sign: 1, min: 60,
          visible: () => !refs.resultsCard.hidden,
        }],
      }, paneOpts)),
      root.ICDResize.createGroup(Object.assign({
        container: aside,
        reserve: 260,
        panes: [{
          key: 'cart', el: refs.cartBox, label: '就診清單區', sign: 1, min: 60,
          visible: () => ctx.store.getState().cart.length > 0,
        }],
      }, paneOpts)),
    ];
    const applyPanes = () => { for (const g of refs.paneGroups) g.applyAll(); };

    // ── 更新器 ──────────────────────────────────────────────────────────
    const U = {};

    U.header = () => {
      const s = ctx.store.getState();
      R.syncModeSwitch(wide, ctx);
      refs.panelsTitle.textContent = R.PANELS_TITLE[s.mode];
      refs.modeHint.textContent = R.MODE_HINT[s.mode];
    };

    U.searchValue = () => R.syncSearchValue(refs.search, ctx);

    U.rail = () => {
      // 1a 的側欄有空間，用全名＋面板數；縮成兩字是 1c／手機的空間妥協，這裡不需要。
      // 容器裡還有欄標題，所以用 keepOthers 只換掉舊的 .region-btn。
      const surg = R.renderRegionMenu(refs.rail, ctx, { keepOthers: true });
      refs.railTitle.textContent = surg ? '情境' : '身體部位';
    };

    /* 中欄實際渲染出來的面板（依 DOM 順序）。面板索引**只讀這一份**，不自己再跑一次
       panelGroupsFor()——兩邊各算一次就會有「索引多一項／少一項」這種只在特定模式
       才看得到的偏差。U.panelIndex 一定排在 U.panels 之後（ALL 走物件的插入順序）。 */
    const renderedPanels = [];

    U.panels = () => {
      const s = ctx.store.getState();
      renderedPanels.length = 0;
      R.clear(refs.panels);
      const quick = ctx.data.quickGroupsFor(s.mode);
      R.renderPanels(refs.panels, ctx, {
        /* 認領這個部位的快選排在面板之前，畫成一般卡片：使用者要它「跟其他次分類一樣
           直接展開不用折疊」。急診／外科的快選 region 是 null，不會進到這裡。 */
        before: (group) => {
          for (const q of quick) {
            if (q.region !== group.name) continue;
            const card = R.el('article', 'quick-card blueprint');
            card.dataset.quick = q.title;
            R.blueprint(card);
            const title = R.el('h4', 'symptom-card-title');
            title.append(R.el('span', null, q.title),
              R.el('span', 'quick-count', String(q.items.length)));
            const body = R.el('div', 'quick-body chip-row');
            for (const chip of R.chipsFromPairs(q.items, ctx)) body.appendChild(chip);
            card.append(title, body);
            refs.panels.appendChild(card);
            renderedPanels.push({ name: q.title, card, title });
          }
        },
        panel: (panel) => {
          const card = R.el('article', 'symptom-card blueprint');
          card.dataset.panel = panel.name;
          R.blueprint(card);
          card.appendChild(R.el('h4', 'symptom-card-title', panel.name));

          const chief = R.el('div', 'chief-group chip-row');
          for (const chip of R.chipsFromPairs(panel.chief, ctx)) chief.appendChild(chip);
          card.appendChild(chief);

          if (panel.redFlags.length) {
            const box = R.el('div', 'redflag-group');
            box.appendChild(R.el('div', 'redflag-label', '優先排除／提醒評估'));
            const row = R.el('div', 'chip-row');
            for (const chip of R.chipsFromPairs(panel.redFlags, ctx, { warn: true })) row.appendChild(chip);
            box.appendChild(row);
            card.appendChild(box);
          }

          if (panel.diseases.length) {
            /* 1a 不收合，全部列出來（使用者 2026-09-01）：1440 下橫向放得完，
               而每點一次展開就是一次中斷。**1c／1b 仍然收合**——那兩套的空間帳完全不同，
               全攤開會把捲軸拉到不可用（docs/dense-ui-principle.md）。
               標題保留筆數：不然主訴碼與常見疾病之間看不出分界。 */
            card.appendChild(R.el('div', 'disease-label', '常見疾病 ' + panel.diseases.length));
            const body = R.el('div', 'disease-group chip-row');
            for (const chip of R.chipsFromPairs(panel.diseases, ctx)) body.appendChild(chip);
            card.appendChild(body);
          }
          refs.panels.appendChild(card);
          renderedPanels.push({ name: panel.name, card, title: card.querySelector('.symptom-card-title') });
        },
      });
    };

    /* ── 面板索引（左欄部位列下方的那 332.7px 空白） ────────────────────────────
       項目＝`renderedPanels`（中欄那一份），順序也一樣。沒選部位時列全部面板，
       所以這一塊自己捲（CSS 的 `flex:1` ＋ `overflow-y:auto`）。
       搜尋結果狀態整塊隱藏：那時中欄的主角是結果，索引指的面板不是使用者在看的東西。 */
    let indexItems = [];

    U.panelIndex = () => {
      const searching = ctx.store.getState().query.trim().length >= 2;
      refs.panelIndex.hidden = searching;
      for (const old of Array.from(refs.panelIndex.querySelectorAll('.panel-index-item'))) old.remove();
      indexItems = [];
      if (searching) { observeCards(); return; }
      for (const entry of renderedPanels) {
        const b = R.el('button', 'panel-index-item', entry.name);
        b.type = 'button';
        b.dataset.panelIndex = entry.name;
        b.title = entry.name + '：捲到中欄的這個面板';
        refs.panelIndex.appendChild(b);
        indexItems.push({ btn: b, entry });
      }
      observeCards();
    };

    /* 捲到某個面板：把它的標題停在捲動區可視內容的上緣。
       offset **量出來**不寫死——`.worksheet` 的 padding 是設計值、而且日後若把中欄標題列
       改成 sticky（1c 的面板標題與慢病速查的分段標題都已經是），這裡會自動跟上；
       寫死的魔術數字每次改版就失準一次（同 #settings-popover 從 93px 改 100% 的教訓）。 */
    function contentTopOffset() {
      const view = sheet.ownerDocument.defaultView;
      const cs = view.getComputedStyle(sheet);
      let sticky = 0;
      for (const kid of sheet.children) {
        const ks = view.getComputedStyle(kid);
        if (ks.position !== 'sticky') continue;
        if ((parseFloat(ks.top) || 0) > 0.5) continue;
        sticky = Math.max(sticky, kid.getBoundingClientRect().height);
      }
      return (parseFloat(cs.paddingTop) || 0) + sticky;
    }

    /* 停在上緣下面 2px，不是貼齊 0：scrollTop 會被瀏覽器捨入到子像素，貼齊 0 時實測
       會落在 -0.2px，也就是標題帶最上面那一條被切掉——那條正是它與上一張卡的分界。 */
    const PANEL_SCROLL_GAP = 2;

    function scrollToPanel(name) {
      const hit = indexItems.filter((it) => it.entry.name === name)[0];
      if (!hit) return;
      const node = hit.entry.title || hit.entry.card;
      const delta = node.getBoundingClientRect().top
        - (sheet.getBoundingClientRect().top + contentTopOffset() + PANEL_SCROLL_GAP);
      sheet.scrollTop += delta;
      markCurrent(hit.btn);
    }

    function markCurrent(btn) {
      for (const it of indexItems) {
        if (it.btn === btn) it.btn.setAttribute('aria-current', 'true');
        else it.btn.removeAttribute('aria-current');
      }
    }

    /* 「現在捲到哪個面板」用 IntersectionObserver，不用 scroll 事件：scroll 每一格都
       重新量所有面板的位置，在「全部部位」那 71 張卡片上是每次捲動都跑 71 次 layout。
       `rootMargin` 的下緣 -72% 讓只有可視區最上面那一段算數，命中的那幾張再依下面
       那條規則挑出「目前所在」。 */
    let io = null;
    const onScreen = new Set();

    function observeCards() {
      if (io) { io.disconnect(); onScreen.clear(); }
      const view = sheet.ownerDocument.defaultView;
      if (!view.IntersectionObserver || !indexItems.length) return;
      io = new view.IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) onScreen.add(e.target);
          else onScreen.delete(e.target);
        }
        /* 命中的可能有兩三張（上一張的最後幾個像素還在帶子裡），要的是「上緣已經捲過去
           的那一張的最後一張」，不是 DOM 順序的第一張——不然剛捲到第 4 個面板時，
           第 3 張只剩 3px 在畫面上卻會被標成「目前所在」。 */
        const line = sheet.getBoundingClientRect().top + contentTopOffset() + PANEL_SCROLL_GAP + 2;
        const visible = indexItems.filter((it) => onScreen.has(it.entry.card));
        if (!visible.length) return;
        const passed = visible.filter((it) => it.entry.card.getBoundingClientRect().top <= line);
        markCurrent((passed.length ? passed[passed.length - 1] : visible[0]).btn);
      }, { root: sheet, rootMargin: '0px 0px -72% 0px', threshold: 0 });
      for (const it of indexItems) io.observe(it.entry.card);
    }

    U.quick = () => {
      const s = ctx.store.getState();
      R.clear(refs.quick);
      /* 只畫沒有歸屬部位的那些（急診／外科）。有歸屬的由 U.panels 畫在部位裡面，
         這裡再畫一次就會變成同一組碼出現兩次。 */
      for (const { title, region, items } of ctx.data.quickGroupsFor(s.mode)) {
        if (region) continue;
        const open = ctx.store.isQuickOpen(title);
        const group = R.el('div', 'quick-group');
        group.dataset.quick = title;
        const toggle = R.el('button', 'quick-toggle');
        toggle.type = 'button';
        toggle.dataset.quickToggle = title;
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        const marker = R.icon('chevronRight', 14);
        marker.classList.add('marker');
        toggle.append(marker, R.el('span', null, title), R.el('span', 'quick-count', String(items.length)));
        const body = R.el('div', 'quick-body chip-row');
        body.hidden = !open;
        for (const chip of R.chipsFromPairs(items, ctx)) body.appendChild(chip);
        group.append(toggle, body);
        refs.quick.appendChild(group);
      }
    };

    U.results = () => R.renderResults(refs.resultsCard, refs.results, refs.resultNote, ctx);
    U.cart = () => {
      R.renderCart(refs.cart, refs.cartEmpty, refs.cartCount, ctx);
      R.syncClearBtn(refs.clearCart, ctx);
    };
    U.his = () => {
      R.renderHis(refs.hisPreview, refs.hisFormat, null, ctx);
      R.renderClipboardSync(wide);
    };
    U.shelf = () => {
      const s = ctx.store.getState();
      refs.shelf.hidden = !s.shelfOpen;
      R.renderShelf(refs.shelfChips, refs.shelfEmpty, ctx);
    };
    U.settings = () => R.syncSettings(wide, ctx);
    U.ccr = () => R.syncCcr(wide, ctx);
    U.lipid = () => R.syncLipid(wide, ctx);

    U.chronic = () => {
      R.syncChronicSwitch(wide, ctx);
      R.renderChronic(refs.chronicOverlay, ctx);
    };

    /* 面板索引的點擊：規則與其他互動一樣走 interactions.js 的委派，但「捲到哪裡」
       只有這個版面算得出來（它握著 sheet 與 renderedPanels），所以照 ctx.onCartToggle
       的既有作法把 handler 掛在 ctx 上往下傳，不讓互動層伸手進渲染層。 */
    ctx.onPanelIndex = (name) => scrollToPanel(name);

    const ALL = Object.keys(U);

    /* 只記本次開啟的瀏覽位置，模式／部位各記一份，不寫 localStorage
       （與 1b／1c 同一個資料結構與同一套規則，見 render-dock.js 的 positions）。
       這是「返回」能回到搜尋前那一格的來源。 */
    const positions = new Map();
    let viewKey = null;
    let searching = false;
    let lastQuery = '';

    function update(changed) {
      const state = ctx.store.getState();
      const key = state.mode + ':' + state.region;
      const query = state.query.trim();
      const nextSearching = query.length >= 2;      // 與 renderResults 同一個門檻
      const navigated = key !== viewKey;
      const oldTop = sheet.scrollTop;
      if (viewKey !== null && !searching) positions.set(viewKey, oldTop);
      let names = ALL;
      if (changed && changed.length) {
        const set = new Set();
        for (const key of changed) for (const name of DEPS[key] || ALL) set.add(name);
        names = ALL.filter((n) => set.has(n));
      }
      for (const name of names) U[name]();
      /* 「已加入」勾號：chip 是在 panels／quick／results／shelf 裡重建的，清單變動時
         那些區塊不會重畫，所以掛號要獨立跑一次（與 1c 同一條規則、同一份實作）。 */
      if (names.some((name) => ['panels', 'quick', 'results', 'shelf', 'cart'].includes(name))) {
        R.syncInCart(wide, ctx);
      }
      /* 搜尋狀態下「返回」取代說明文字（同一個位置，不多一列）。 */
      refs.searchBack.hidden = !nextSearching;
      refs.modeHint.hidden = nextSearching;
      // 內容變了（搜尋結果出現、清單加碼）就得重新夾一次高度，見 render-dock.js 同一段註解
      applyPanes();
      /* 捲動位置（三分支與 1b／1c 逐字同義）：
         進搜尋 → 回到頂端（結果卡在中欄最上面，不然它會開在可視區外）
         離開搜尋或換部位／模式 → 還原那一格記住的位置
         其餘（加碼、展開面板…）→ 原地不動
         一定要排在 applyPanes() 之後：窗格高度會改變 scrollHeight，先寫 scrollTop 會被夾掉。 */
      if (nextSearching) {
        sheet.scrollTop = (!searching || query !== lastQuery || navigated) ? 0 : oldTop;
      } else if (searching || navigated) {
        sheet.scrollTop = positions.get(key) || 0;
      } else {
        sheet.scrollTop = oldTop;
      }
      viewKey = key;
      searching = nextSearching;
      lastQuery = query;
    }

    return { root: wide, refs, update };
  }

  root.ICDWide = { mount };
})(typeof self !== 'undefined' ? self : this);
