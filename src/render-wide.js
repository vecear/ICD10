/* 1a 桌機工作台的版面組裝（body[data-layout="wide"]）。掛 window.ICDWide。

   `mount(host, ctx)` 只建一次骨架，回傳 `{ update(changedKeys) }`；後續狀態變動只重畫
   受影響的區塊——搜尋框因此不會在每次重繪時失去焦點與游標位置。
   所有互動都由 interactions.js 以事件委派處理，這裡不掛任何 handler。 */
(function (root) {
  'use strict';

  const R = root.ICDRender;

  /* 狀態欄位 → 需要重跑的更新器。null／未列出的欄位一律全部重跑（保守但不會漏畫）。 */
  const DEPS = {
    mode: ['header', 'rail', 'panels', 'quick', 'settings'],
    region: ['rail', 'panels'],
    query: ['results', 'searchValue'],
    dbState: ['results', 'settings', 'related'],
    expanded: ['panels'],
    quickOpen: ['quick'],
    cart: ['cart', 'his', 'related'],
    relatedCode: ['related'],
    favs: ['shelf', 'cart'],
    recent: ['shelf'],
    format: ['his', 'settings'],
    copied: ['his'],
    theme: ['settings'],
    layout: ['settings'],
    shelfOpen: ['shelf', 'settings'],
    settingsOpen: ['settings'],
  };

  function mount(host, ctx) {
    const refs = {};
    const wide = R.el('div');
    wide.id = 'layout-wide';

    // ── header ──────────────────────────────────────────────────────────
    const header = R.el('header', 'app-header');
    header.append(R.el('div', 'app-brand', 'ICD-10'));
    refs.modeChip = R.el('span', null, '內科門診');
    refs.modeChip.id = 'mode-chip';
    header.appendChild(refs.modeChip);

    const search = document.createElement('input');
    search.id = 'search';
    search.className = 'input';
    search.type = 'search';
    search.autocomplete = 'off';
    search.placeholder = '搜尋：蜂窩、cellulitis、L03…　Enter 加入第一筆';
    search.setAttribute('aria-label', '搜尋診斷碼');
    refs.search = search;
    header.appendChild(search);

    const settingsToggle = R.el('button', 'btn btn-secondary', '設定');
    settingsToggle.type = 'button';
    settingsToggle.id = 'settings-toggle';
    settingsToggle.setAttribute('aria-expanded', 'false');
    settingsToggle.setAttribute('aria-haspopup', 'true');
    settingsToggle.appendChild(R.icon('chevronDown', 14));
    header.appendChild(settingsToggle);
    header.appendChild(R.settingsPopoverEl(false));
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

    const rail = R.el('nav');
    rail.id = 'region-rail';
    rail.setAttribute('role', 'tablist');
    rail.setAttribute('aria-label', '身體部位');
    refs.railTitle = R.el('div', 'kicker', '身體部位');
    refs.railTitle.id = 'region-rail-title';
    rail.appendChild(refs.railTitle);
    refs.rail = rail;
    bench.appendChild(rail);

    const sheet = R.el('div', 'worksheet');
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
    head.append(refs.panelsTitle, refs.modeHint);
    sheet.appendChild(head);

    refs.panels = R.el('div');
    refs.panels.id = 'panels';
    sheet.appendChild(refs.panels);

    refs.quick = R.el('div');
    refs.quick.id = 'quick';
    sheet.appendChild(refs.quick);
    bench.appendChild(sheet);

    // 右欄：清單 → 貼入 HIS → 相關碼
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
    cartHead.append(cartTitle, clearBtn);
    aside.appendChild(cartHead);

    const cartBox = R.el('div', 'cart-box');
    refs.cart = R.el('ul');
    refs.cart.id = 'cart';
    refs.cartEmpty = R.el('div', 'cart-empty', '點左側任何代碼加入；第一碼即主診斷，拖曳可調整順序。');
    cartBox.append(refs.cart, refs.cartEmpty);
    aside.appendChild(cartBox);

    const his = R.el('div', 'his-card blueprint');
    his.id = 'his-card';
    R.blueprint(his);
    const hisHead = R.el('div', 'his-head');
    refs.hisFormat = R.el('span', null, '每行一碼');
    refs.hisFormat.id = 'his-format-label';
    hisHead.append(R.el('span', 'kicker', '貼入 HIS'), refs.hisFormat);
    refs.hisPreview = R.el('pre', null, '（清單為空）');
    refs.hisPreview.id = 'his-preview';
    refs.copyAll = R.el('button', 'btn btn-primary blueprint', '複製並貼入 HIS');
    refs.copyAll.type = 'button';
    refs.copyAll.id = 'copy-all';
    his.append(hisHead, refs.hisPreview, refs.copyAll);
    aside.appendChild(his);

    const relatedWrap = R.el('div', 'related-wrap');
    relatedWrap.id = 'related-wrap';
    relatedWrap.appendChild(R.el('div', 'kicker', '相關疾病／評估碼'));
    refs.relatedEmpty = R.el('div', 'related-empty', '加入代碼後，這裡列出建議一併評估的診斷。');
    refs.related = R.el('div');
    refs.related.id = 'related';
    relatedWrap.append(refs.relatedEmpty, refs.related);
    aside.appendChild(relatedWrap);

    bench.appendChild(aside);
    wide.appendChild(bench);
    host.appendChild(wide);

    // ── 更新器 ──────────────────────────────────────────────────────────
    const U = {};

    U.header = () => {
      const s = ctx.store.getState();
      refs.modeChip.textContent = R.MODE_LABEL[s.mode];
      refs.panelsTitle.textContent = R.PANELS_TITLE[s.mode];
      refs.modeHint.textContent = R.MODE_HINT[s.mode];
    };

    // 只在「狀態的 query 與輸入框不同」時才回寫（例如 Esc 清空），避免打字時游標跳位
    U.searchValue = () => {
      const s = ctx.store.getState();
      if (refs.search.value !== s.query) refs.search.value = s.query;
    };

    U.rail = () => {
      const s = ctx.store.getState();
      const surg = s.mode === 'surg';
      refs.railTitle.textContent = surg ? '情境' : '身體部位';
      refs.rail.setAttribute('aria-label', surg ? '手術情境' : '身體部位');
      for (const old of Array.from(refs.rail.querySelectorAll('.region-btn'))) old.remove();
      const regions = ctx.data.regionsFor(s.mode);
      const active = ctx.data.clampRegion(s.mode, s.region);
      regions.forEach((region, i) => {
        const b = R.el('button', 'region-btn');
        b.type = 'button';
        b.dataset.region = region.name;
        b.dataset.regionIndex = String(i);
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', i === active ? 'true' : 'false');
        b.append(R.el('span', null, region.name), R.el('span', 'region-count', String(region.count)));
        refs.rail.appendChild(b);
      });
    };

    U.panels = () => {
      const s = ctx.store.getState();
      R.clear(refs.panels);
      // panelsFor() 在非急診模式一律回傳空的 redFlags——紅旗隔離只有這一個出口，
      // 渲染層不得自行從 window.CURATED 取 redFlags 繞過它（C5，臨床安全）。
      for (const panel of ctx.data.panelsFor(s.mode, s.region)) {
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
          const open = ctx.store.isExpanded(panel.name);
          const toggle = R.el('button', 'panel-toggle');
          toggle.type = 'button';
          toggle.dataset.panelToggle = panel.name;
          toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
          const marker = R.icon('chevronRight', 14);
          marker.classList.add('marker');
          toggle.append(marker, R.el('span', null, open ? '收合常見疾病' : '常見疾病 ' + panel.diseases.length));
          const body = R.el('div', 'disease-group chip-row');
          body.hidden = !open;
          for (const chip of R.chipsFromPairs(panel.diseases, ctx)) body.appendChild(chip);
          card.append(toggle, body);
        }
        refs.panels.appendChild(card);
      }
    };

    U.quick = () => {
      const s = ctx.store.getState();
      R.clear(refs.quick);
      for (const [title, list] of ctx.data.quickGroupsFor(s.mode)) {
        const open = ctx.store.isQuickOpen(title);
        const group = R.el('div', 'quick-group');
        group.dataset.quick = title;
        const toggle = R.el('button', 'quick-toggle');
        toggle.type = 'button';
        toggle.dataset.quickToggle = title;
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        const marker = R.icon('chevronRight', 14);
        marker.classList.add('marker');
        toggle.append(marker, R.el('span', null, title), R.el('span', 'quick-count', String(list.length)));
        const body = R.el('div', 'quick-body chip-row');
        body.hidden = !open;
        for (const chip of R.chipsFromPairs(list, ctx)) body.appendChild(chip);
        group.append(toggle, body);
        refs.quick.appendChild(group);
      }
    };

    U.results = () => R.renderResults(refs.resultsCard, refs.results, refs.resultNote, ctx);
    U.related = () => R.renderRelated(refs.related, refs.relatedEmpty, ctx);
    U.cart = () => R.renderCart(refs.cart, refs.cartEmpty, refs.cartCount, ctx);
    U.his = () => R.renderHis(refs.hisPreview, refs.hisFormat, refs.copyAll, ctx);
    U.shelf = () => {
      const s = ctx.store.getState();
      refs.shelf.hidden = !s.shelfOpen;
      R.renderShelf(refs.shelfChips, refs.shelfEmpty, ctx);
    };
    U.settings = () => R.syncSettings(wide, ctx);

    const ALL = Object.keys(U);

    function update(changed) {
      let names = ALL;
      if (changed && changed.length) {
        const set = new Set();
        for (const key of changed) for (const name of DEPS[key] || ALL) set.add(name);
        names = ALL.filter((n) => set.has(n));
      }
      for (const name of names) U[name]();
    }

    return { root: wide, refs, update };
  }

  root.ICDWide = { mount };
})(typeof self !== 'undefined' ? self : this);
