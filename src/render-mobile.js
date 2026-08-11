/* 1b 手機看診（390×844）的版面組裝（body[data-layout="mobile"]）。掛 window.ICDMobile。

   介面與 render-wide.js 的 ICDWide 相同：`mount(host, ctx) -> { update(changedKeys) }`。
   骨架只建一次，狀態變動只重畫受影響的區塊（搜尋框因此不會在打字時失焦）。

   設計出處：.review/design-ref/new-design.dc.html 的 1b 區塊（L340-424）。
   與桌機 1a 的三個結構性差異：
   1. **整列按鈕取代 chip**：代碼一律是 48px 高的整列（`.chip--row`），左代碼、中中文、
      右「＋」，觸控目標遠大於 44px 門檻。搜尋結果由共用的 renderResults 產生，
      這裡渲染後補上 `.chip--row` 類，避免共用層為了手機多開一個參數。
   2. **不做拖曳換序**（控制者裁示 C6）：清單列拿掉拖曳把手與 draggable，排序改用「主」鈕。
      觸控裝置本來就不觸發 HTML5 DnD，留著把手只是假的可供性。
   3. **清單改成底部固定列＋可展開抽屜**：底部列永遠顯示「本次就診清單 N」與代碼串，
      點它展開抽屜才看得到逐列的主／★／✕ 與 HIS 預覽。 */
(function (root) {
  'use strict';

  const R = root.ICDRender;

  /* 狀態欄位 → 需要重跑的更新器。列出所有欄位（含手機用不到的），
     沒列到的欄位會退回「全部重跑」，那會讓每次 recent 累積都整頁重畫。 */
  const DEPS = {
    mode: ['header', 'pills', 'panels', 'related', 'settings'],
    region: ['pills', 'panels'],
    query: ['results', 'searchValue'],
    dbState: ['results', 'related', 'settings'],
    expanded: ['panels'],
    quickOpen: [],
    cart: ['cartSheet', 'cartBar', 'his', 'related'],
    relatedCode: ['related'],
    favs: ['cartSheet'],
    recent: [],
    format: ['his', 'settings'],
    copied: ['his'],
    theme: ['settings'],
    layout: ['settings'],
    shelfOpen: ['settings'],
    settingsOpen: ['settings'],
    cartOpen: ['cartSheet', 'cartBar'],
    pinned: [],
    // 高度本身由 update() 末尾的 paneGroup.applyAll() 統一處理；這裡只同步設定面板的
    // 「回復預設高度」可按狀態（不寫這條會退回全量重繪，每拖一次整片重畫）
    paneSizes: ['settings'],
  };

  function mount(host, ctx) {
    const refs = {};
    /* 抽屜開合是「這套版面自己的」檢視狀態，刻意不用 store 的 cartOpen：
       它預設 true（1c 側掛欄的清單本來就常駐），在 390×844 上會讓第一次加碼就彈出
       約 35vh 的抽屜把主訴面板整片蓋掉。版面卸載時這個旗標隨閉包一起消失。 */
    let sheetOpen = false;

    const wrap = R.el('div');
    wrap.id = 'layout-mobile';

    /* ── header：模式三鈕獨立一行 ＋ 搜尋（44px）＋設定鈕（44×44）（L349-368） ──
       390px 塞不下「三顆模式鈕＋搜尋＋設定」同一列（搜尋會被壓到剩幾十 px），所以
       模式列自己佔一行、三格等寬撐滿；觸控目標仍是 44px。互動與 1a／1c 完全一致
       （一次點擊即切換），差的只是配置——那是空間限制不是功能差異。 */
    const header = R.el('header', 'm-header');
    refs.modeSwitch = R.modeSwitchEl(false);

    const search = document.createElement('input');
    search.id = 'search';
    search.className = 'input';
    search.type = 'search';
    search.autocomplete = 'off';
    search.placeholder = '搜尋碼／中英文…';
    search.setAttribute('aria-label', '搜尋診斷碼');
    refs.search = search;

    const settingsToggle = R.el('button', 'btn btn-secondary', '設定');
    settingsToggle.type = 'button';
    settingsToggle.id = 'settings-toggle';
    settingsToggle.setAttribute('aria-expanded', 'false');
    settingsToggle.setAttribute('aria-haspopup', 'true');

    /* 共用 popover（同一份 id 與 syncSettings），但「桌機版面」與「常用列」兩項在手機
       沒有對應 UI：版面切到 dock 會讓 390px 的畫面變成 176px 窄欄且無路可回，
       常用列則手機版根本沒有。標上類名交給 CSS 藏起來——用自己建的類名而不是
       :has() 或 :first-child，免得共用層改順序就靜默失效（C1-2）。 */
    const pop = R.settingsPopoverEl(false);
    const layoutSeg = pop.querySelector('#seg-layout');
    if (layoutSeg && layoutSeg.parentNode) layoutSeg.parentNode.classList.add('is-desktop-only');
    const shelfBtn = pop.querySelector('#shelf-toggle');
    if (shelfBtn) shelfBtn.classList.add('is-desktop-only');

    const headRow = R.el('div', 'm-head-row');
    headRow.append(search, settingsToggle);
    header.append(refs.modeSwitch, headRow, pop);
    wrap.appendChild(header);

    // ── 部位／情境：橫向捲動 pill 列（L370-374） ──────────────────────────
    refs.pills = R.el('nav');
    refs.pills.id = 'region-pills';
    refs.pills.setAttribute('role', 'tablist');
    refs.pills.setAttribute('aria-label', '身體部位');
    wrap.appendChild(refs.pills);

    // ── 捲動內容：搜尋結果卡＋面板卡（L376-399） ──────────────────────────
    const scroll = R.el('div', 'm-scroll');
    scroll.id = 'm-scroll';

    const resultsCard = R.el('div');
    resultsCard.id = 'results-card';
    resultsCard.hidden = true;
    const resultsHead = R.el('div', 'results-head');
    refs.resultNote = R.el('div', 'result-note');
    resultsHead.append(R.el('div', 'results-title', '搜尋結果'), refs.resultNote);
    refs.results = R.el('div', 'm-rows');
    refs.results.id = 'search-results';
    resultsCard.append(resultsHead, refs.results);
    refs.resultsCard = resultsCard;

    refs.panels = R.el('div');
    refs.panels.id = 'panels';
    scroll.append(resultsCard, refs.panels);
    wrap.appendChild(scroll);

    // ── 相關疾病／評估碼：底部列上方，最高 190px 可捲（L401-415） ──────────
    refs.relatedWrap = R.el('section');
    refs.relatedWrap.id = 'mobile-related';
    refs.relatedWrap.hidden = true;
    refs.relatedWrap.appendChild(R.el('div', 'kicker m-related-title', '相關疾病／評估碼'));
    refs.related = R.el('div');
    refs.related.id = 'related';
    refs.relatedWrap.appendChild(refs.related);
    wrap.appendChild(refs.relatedWrap);

    /* ── 清單抽屜：底部列點開才出現 ────────────────────────────────────────
       1b 設計本身只有底部摘要列，沒有逐列清單；但控制者裁示 C6 要求手機保留「主」鈕
       （設為主診斷），而移除誤點的碼在門診現場也是必要動作。抽屜是成本最低的作法：
       預設收起時完全不佔版面，展開後共用 renderCart 產出的 li 與既有事件委派。 */
    refs.cartSheet = R.el('div', 'm-cart-sheet');
    refs.cartSheet.id = 'cart-sheet';
    refs.cartSheet.hidden = true;
    const sheetHead = R.el('div', 'm-sheet-head');
    refs.hisFormat = R.el('span', null, R.FORMAT_LABEL.lines);
    refs.hisFormat.id = 'his-format-label';
    const clearBtn = R.el('button', 'btn btn-ghost', '清空');
    clearBtn.type = 'button';
    clearBtn.id = 'clear-cart';
    sheetHead.append(R.el('span', 'kicker', '本次就診清單'), refs.hisFormat, clearBtn);

    refs.cart = R.el('ul');
    refs.cart.id = 'cart';
    refs.cartEmpty = R.el('div', 'cart-empty', '點任何代碼列即可加入。');
    refs.hisPreview = R.el('pre', null, '（清單為空）');
    refs.hisPreview.id = 'his-preview';
    refs.cartSheet.append(sheetHead, refs.cart, refs.cartEmpty, refs.hisPreview);
    wrap.appendChild(refs.cartSheet);

    // ── 底部固定列（L417-423） ────────────────────────────────────────────
    const bar = R.el('div', 'm-cart-bar');
    bar.id = 'cart-bar';
    refs.cartToggle = R.el('button', 'm-cart-summary');
    refs.cartToggle.type = 'button';
    refs.cartToggle.id = 'cart-toggle';
    refs.cartToggle.setAttribute('aria-expanded', 'false');
    refs.cartToggle.setAttribute('aria-controls', 'cart-sheet');
    const label = R.el('span', 'm-cart-label', '本次就診清單 ');
    refs.cartCount = R.el('span', null, '');
    refs.cartCount.id = 'cart-count';
    label.appendChild(refs.cartCount);
    refs.cartInline = R.el('span', null, '尚未選碼');
    refs.cartInline.id = 'cart-inline';
    refs.cartToggle.append(label, refs.cartInline);

    refs.copyAll = R.el('button', 'btn btn-primary blueprint', '複製並貼入 HIS');
    refs.copyAll.type = 'button';
    refs.copyAll.id = 'copy-all';
    bar.append(refs.cartToggle, refs.copyAll);
    wrap.appendChild(bar);

    host.appendChild(wrap);

    /* ── 可拖曳的窗格分隔條（功能與 1a／1c 統一） ────────────────────────────
       390×844 只有兩條分界值得可調：相關碼區（預設最高 190px，抽屜開著時被壓到 84px）
       與清單抽屜（預設最高 46vh）。**部位 pill 列不做**：它是單行橫向捲動列，高度就是
       一顆 44px 觸控目標，可調只會讓觸控目標變小；header 同理是固定內容。
       .m-scroll 是彈性區，吸收其他窗格讓出／占走的空間。 */
    refs.paneGroup = root.ICDResize.createGroup({
      layout: 'mobile',
      store: ctx.store,
      container: wrap,
      flex: scroll,
      flexMin: 120,
      panes: [
        {
          key: 'related', el: refs.related, label: '相關碼區', sign: -1, min: 56,
          visible: () => !refs.relatedWrap.hidden,
        },
        {
          // 抽屜自己是 flex column、內部由 ul#cart 捲動，不要再給它一層 overflow
          key: 'sheet', el: refs.cartSheet, label: '清單抽屜', sign: -1, min: 120, scroll: false,
          visible: () => !refs.cartSheet.hidden,
        },
      ],
    });

    // ── 更新器 ──────────────────────────────────────────────────────────
    const U = {};

    U.header = () => R.syncModeSwitch(wrap, ctx);

    // 只在狀態與輸入框不同時回寫（Esc 清空、Enter 加碼後清空），避免打字時游標跳位
    U.searchValue = () => {
      const s = ctx.store.getState();
      if (refs.search.value !== s.query) refs.search.value = s.query;
    };

    U.pills = () => {
      const s = ctx.store.getState();
      const surg = s.mode === 'surg';
      refs.pills.setAttribute('aria-label', surg ? '手術情境' : '身體部位');
      R.clear(refs.pills);
      const active = ctx.data.clampRegion(s.mode, s.region);     // null ＝ 沒有選取任何部位
      refs.pills.appendChild(R.regionAllBtn(active === null));   // 「全部」固定在橫捲列最前面
      ctx.data.regionsFor(s.mode).forEach((region, i) => {
        // 事件委派認的是 .region-btn＋data-region-index；.region-pill 是 1b 的樣式與測試鉤子
        const b = R.el('button', 'region-btn region-pill');
        b.type = 'button';
        b.dataset.region = region.name;
        b.dataset.regionIndex = String(i);
        b.setAttribute('role', 'tab');
        const on = i === active;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) b.title = region.name + '（再點一次取消選取，顯示全部部位）';
        b.append(R.el('span', null, region.name), R.el('span', 'region-count', String(region.count)));
        refs.pills.appendChild(b);
      });
    };

    U.panels = () => {
      const s = ctx.store.getState();
      R.clear(refs.panels);
      // panelGroupsFor() 是紅旗隔離的唯一出口：非急診模式一律回傳空的 redFlags。
      // 渲染層不得自行從 window.CURATED 取 redFlags 繞過它（C5，臨床安全）。
      for (const group of ctx.data.panelGroupsFor(s.mode, s.region)) {
        // group.region 只有「顯示全部部位」時才有值（見 data.js panelGroupsFor 的註解）
        if (group.region) refs.panels.appendChild(R.regionHeading(group.region));
        for (const panel of group.panels) {
          const card = R.el('article', 'mobile-panel');
          card.dataset.panel = panel.name;
          card.appendChild(R.el('h4', 'm-panel-title', panel.name));

          const rows = R.el('div', 'm-rows');
          for (const chip of R.chipsFromPairs(panel.chief, ctx, { className: 'chip--row' })) rows.appendChild(chip);

          /* 設計稿把紅旗直接混進同一串列、只靠配色區分（L583）。這裡多留一行標題：
             整列都是灰底白字的手機畫面上，只有邊框變色不足以說明「這些要優先排除」。 */
          if (panel.redFlags.length) {
            rows.appendChild(R.el('div', 'redflag-label m-redflag-label', '優先排除／提醒評估'));
            for (const chip of R.chipsFromPairs(panel.redFlags, ctx, { warn: true, className: 'chip--row' })) {
              rows.appendChild(chip);
            }
          }

          const open = ctx.store.isExpanded(panel.name);
          if (open && panel.diseases.length) {
            for (const chip of R.chipsFromPairs(panel.diseases, ctx, { className: 'chip--row' })) rows.appendChild(chip);
          }
          card.appendChild(rows);

          if (panel.diseases.length) {
            const toggle = R.el('button', 'panel-toggle');
            toggle.type = 'button';
            toggle.dataset.panelToggle = panel.name;
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.textContent = open ? '收合常見疾病' : '展開常見疾病 ' + panel.diseases.length;
            card.appendChild(toggle);
          }
          refs.panels.appendChild(card);
        }
      }
    };

    U.results = () => {
      R.renderResults(refs.resultsCard, refs.results, refs.resultNote, ctx);
      // 共用層產出的是 inline chip；手機一律轉成 48px 整列
      for (const chip of refs.results.querySelectorAll('.chip')) chip.classList.add('chip--row');
    };

    /* 相關碼自己渲染（不用共用的 renderRelated）：手機要整列形態，而且外層區塊
       在沒有建議時要整段收起來（設計 L799 的 mobileRelatedStyle）。
       兩層分組的邏輯仍走共用的 relatedGroups()，不在這裡另寫一套。 */
    U.related = () => {
      R.clear(refs.related);
      const groups = R.relatedGroups(ctx);
      refs.relatedWrap.hidden = !groups.length;
      for (const group of groups) {
        const wrapper = R.el('div', 'related-group');
        wrapper.appendChild(R.el('div', 'group-label', group.label));
        const rows = R.el('div', 'm-rows');
        for (const code of group.codes) {
          // chipWith 而不是 chipEl：附加碼（B95–B97／Z16）的標記要跟三套版面一致
          rows.appendChild(R.chipWith(ctx, code, ctx.data.labelOf(code), { className: 'chip--row' }));
        }
        wrapper.appendChild(rows);
        refs.related.appendChild(wrapper);
      }
    };

    U.cartSheet = () => {
      const s = ctx.store.getState();
      R.renderCart(refs.cart, refs.cartEmpty, refs.cartCount, ctx);
      /* C6：手機不做拖曳換序。把把手與 draggable 拿掉，免得留下點不動的假可供性
         （HTML5 DnD 在觸控裝置根本不觸發）；排序改用每列的「主」鈕。 */
      for (const li of refs.cart.children) {
        li.draggable = false;
        li.title = '點「主」設為主診斷';
        for (const grip of li.querySelectorAll('.cart-grip')) grip.remove();
      }
      // 清單被清空／移光時把旗標一併歸零，否則下次加碼會莫名其妙又彈出抽屜
      if (!s.cart.length) sheetOpen = false;
      const open = !!(sheetOpen && s.cart.length);
      refs.cartSheet.hidden = !open;
      // 抽屜開著時要把相關碼區壓扁讓出空間；相關碼在 DOM 上排在抽屜「之前」，
      // 兄弟選擇器搆不到，改由根節點的類名驅動。
      wrap.classList.toggle('sheet-open', open);
    };

    U.cartBar = () => {
      const s = ctx.store.getState();
      // 摘要用「、」串代碼（設計 L787）；真正要貼出去的字串在抽屜裡的 #his-preview
      refs.cartInline.textContent = s.cart.length ? s.cart.map((x) => x.code).join('、') : '尚未選碼';
      refs.cartToggle.disabled = !s.cart.length;
      refs.cartToggle.setAttribute('aria-expanded', sheetOpen && s.cart.length ? 'true' : 'false');
      refs.cartToggle.title = s.cart.length
        ? (sheetOpen ? '收合就診清單' : '展開就診清單，可設主診斷或移除')
        : '尚未選碼';
    };

    U.his = () => R.renderHis(refs.hisPreview, refs.hisFormat, refs.copyAll, ctx);
    U.settings = () => R.syncSettings(wrap, ctx);

    /* #cart-toggle 的事件委派本身在 interactions.js（共用），但「切換的是什麼」是 1b 專屬語意：
       版面本地、預設收合的 sheetOpen（見檔頭註解——刻意不用 store 的 cartOpen，否則它預設
       true，390×844 上第一次加碼就會被彈開的抽屜蓋掉主訴面板）。sheetOpen 不進 store，
       所以切換後要自己補呼叫 U.cartSheet()／U.cartBar()，不能靠 store 的 notify 觸發重繪。 */
    ctx.onCartToggle = () => {
      if (!ctx.store.getState().cart.length) return;
      sheetOpen = !sheetOpen;
      U.cartSheet();
      U.cartBar();
      // 同理：抽屜的分隔條要跟著出現／消失，也不能靠 store 的 notify
      refs.paneGroup.applyAll();
    };

    const ALL = Object.keys(U);

    function update(changed) {
      let names = ALL;
      if (changed && changed.length) {
        const set = new Set();
        for (const key of changed) for (const name of DEPS[key] || ALL) set.add(name);
        names = ALL.filter((n) => set.has(n));
      }
      for (const name of names) U[name]();
      // 內容變了（相關碼出現、抽屜展開）就得重新夾一次高度，見 render-dock.js 同一段註解
      refs.paneGroup.applyAll();
    }

    return { root: wrap, refs, update };
  }

  root.ICDMobile = { mount };
})(typeof self !== 'undefined' ? self : this);
