/* 三套版面共用的 DOM 建構與區塊更新。掛 window.ICDRender。

   設計原則：
   1. **純宣告式**——這裡產生的節點不掛任何 closure handler，互動一律靠 interactions.js
      的事件委派（依 class 與 data-* 判斷）。因此任何區塊都可以被重建而不會漏解事件。
   2. **只讀狀態**——一律 `ctx.store.getState()` 後只讀；變更全部走 action。
      （state.js 的 getState() 回傳的是內部物件本身，就地改動會讓變更偵測靜默失效。）
   3. 內聯 SVG **不寫 xmlns**（控制者裁示 C4）：`test_build_produces_single_html` 禁止
      輸出含任何 h-t-t-p 開頭的字串，而 SVG 命名空間字串會誤觸。因此也不能用
      createElementNS（要帶命名空間網址）——改用 innerHTML 交給 HTML 剖析器建立 SVG
      節點，命名空間會自動正確，程式碼裡完全不需要出現那串網址。 */
(function (root) {
  'use strict';

  // Lucide，stroke-width 1.5（Industry 設計系統規範）
  const ICONS = {
    grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>'
      + '<circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
  };

  function icon(name, size) {
    const span = document.createElement('span');
    span.className = 'icn';
    span.setAttribute('aria-hidden', 'true');
    const s = size || 16;
    span.innerHTML = '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" '
      + 'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'
      + (ICONS[name] || '') + '</svg>';
    return span;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  /* .blueprint 的四角登記標記（設計系統要求四個 <i class="corner">）。 */
  function blueprint(node) {
    for (const pos of ['tl', 'tr', 'bl', 'br']) node.appendChild(el('i', 'corner ' + pos));
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  // ---- chip ----
  /* 附加碼判定一律問資料層（data.js 的 isAdjunct），渲染層不得自己寫一份正則。 */
  const isAdjunctCode = (ctx, code) => !!(ctx && ctx.data
    && typeof ctx.data.isAdjunct === 'function' && ctx.data.isAdjunct(code));

  /* 唯一的加碼入口。opts: {warn, cat, adjunct, star, className, title}
     `data-leaf` 讓測試與委派都能判斷葉碼；類目碼用 aria-disabled 而非 disabled——
     disabled 會讓 Playwright 的可操作性檢查直接拒絕點擊，就測不到「點了也加不進去」。

     中文標籤的 <span> 掛 `.chip-zh`：委派層要靠它取標籤文字，用 querySelector('span')
     會在 ★chip 上取到 icon 的 span（R2 M1）。
     附加碼的「附加碼」標記用 <i class="chip-tag"> 而不是 <span>：1c／1b 都有
     `.chip--dock span`／`.chip--row span` 的 flex 與 ellipsis 規則，用 span 會被裁掉。 */
  function chipEl(code, label, opts) {
    const o = opts || {};
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip'
      + (o.warn ? ' chip--warn' : '')
      + (o.cat ? ' cat' : '')
      + (o.adjunct ? ' chip--adjunct' : '')
      + (o.className ? ' ' + o.className : '');
    b.dataset.code = code;
    b.dataset.leaf = o.cat ? '0' : '1';
    if (o.adjunct) b.dataset.adjunct = '1';
    if (o.cat) b.setAttribute('aria-disabled', 'true');
    if (o.star) {
      const star = icon('star', 12);
      star.classList.add('shelf-star');
      b.appendChild(star);
    }
    const strong = el('b', null, code);
    const span = el('span', 'chip-zh', label || '');
    b.append(strong, span);
    if (o.adjunct) b.appendChild(el('i', 'chip-tag', '附加碼'));
    const base = o.title || (code + (label ? ' ' + label : '') + (o.cat ? '（類目碼，不可申報）' : ''));
    b.title = base + (o.adjunct ? '（附加碼：只能附加在主要疾病之後，不可作為主診斷）' : '');
    return b;
  }

  /* 帶 ctx 的 chip 建構：自動補上附加碼標記。凡是能拿到 ctx 的建構點都要走這裡，
     否則附加碼只在部分區域看得出來（相關碼推薦區正是原本漏掉的那一塊）。 */
  function chipWith(ctx, code, label, opts) {
    const o = Object.assign({}, opts);
    if (isAdjunctCode(ctx, code)) o.adjunct = true;
    return chipEl(code, label, o);
  }

  /* [[code, label], …] → chip 陣列；label 空白時回頭查 CURATED_LABELS／全庫。 */
  function chipsFromPairs(pairs, ctx, opts) {
    const out = [];
    for (const pair of pairs || []) {
      const code = pair[0];
      out.push(chipWith(ctx, code, pair[1] || ctx.data.labelOf(code), opts));
    }
    return out;
  }

  // ---- 搜尋結果 ----
  const DB_NOTE = {
    idle: '精選面板結果；輸入後才載入全庫',
    loading: '精選面板結果；全庫索引載入中…',
    error: '全庫載入失敗，僅顯示精選面板結果',
    ready: '',
  };

  /* 空狀態文案。全庫未就緒時的搜尋來源是精選池，而精選池沒有英文欄（建置期只注入中文），
     此時叫使用者「試試英文」是唯一保證無效的建議（R2 I1）——依 pool／dbState 給誠實
     而且真的可行的下一步。 */
  const EMPTY_FULL = '查無結果，試試英文名稱或代碼前綴';
  const EMPTY_CURATED = {
    idle: '查無結果。全庫尚未載入，目前只搜尋精選面板；請改用中文或代碼前綴',
    loading: '查無結果。全庫索引載入中，就緒後即可搜尋英文；目前請改用中文或代碼前綴',
    error: '查無結果。全庫無法載入，目前只搜尋精選面板的中文與代碼；可在設定面板重新載入全庫',
    ready: '查無結果，試試英文名稱或代碼前綴',
  };

  const emptyText = (pool, dbState) => (pool === 'full'
    ? EMPTY_FULL
    : EMPTY_CURATED[dbState] || EMPTY_CURATED.idle);

  /* card 是外層（要 hidden 切換），host 是 chip 容器，note 是右上角說明。 */
  function renderResults(card, host, note, ctx) {
    const s = ctx.store.getState();
    const q = s.query.trim();
    clear(host);
    if (q.length < 2) {
      card.hidden = true;
      note.textContent = '';
      return;
    }
    card.hidden = false;
    const rows = ctx.data.search(q);
    if (!rows.length) {
      host.appendChild(el('span', 'result-empty', emptyText(rows.pool, s.dbState)));
      note.textContent = rows.pool === 'full' ? '' : DB_NOTE[s.dbState] || '';
      return;
    }
    for (const row of rows) {
      const leaf = row[1] === 1;
      host.appendChild(chipWith(ctx, row[0], row[3], { cat: !leaf }));
    }
    if (rows.pool === 'full') {
      note.textContent = '全庫命中 ' + rows.total.toLocaleString() + ' 筆'
        + (rows.total > rows.length ? '，顯示前 ' + rows.length + ' 筆' : '')
        + '　虛線＝類目碼不可申報';
    } else {
      note.textContent = DB_NOTE[s.dbState] || '精選面板結果';
    }
  }

  // ---- 相關碼 ----
  /* 兩層：人工關聯（related.json ＋ 當前模式的症狀表）＋ 同類目其他碼。
     已在清單的碼要濾掉，移除後才會重新出現。 */
  function relatedGroups(ctx) {
    const s = ctx.store.getState();
    const code = s.relatedCode;
    if (!code) return [];
    const inCart = (c) => s.cart.some((x) => x.code === c);
    const curated = ctx.data.relatedFor(code, s.mode).filter((c) => !inCart(c));
    const seen = new Set(curated);
    const fam = ctx.data.familyFor(code)
      .map((r) => r[0])
      .filter((c) => c !== code && !inCart(c) && !seen.has(c));
    const groups = [];
    if (curated.length) groups.push({ label: '與 ' + code + ' 常見同時評估', codes: curated });
    if (fam.length) groups.push({ label: '同類目其他碼（' + code.slice(0, 3) + '）', codes: fam });
    return groups;
  }

  function renderRelated(host, empty, ctx) {
    clear(host);
    const groups = relatedGroups(ctx);
    if (empty) empty.hidden = groups.length > 0;
    for (const group of groups) {
      const wrap = el('div', 'related-group');
      wrap.appendChild(el('div', 'group-label', group.label));
      const row = el('div', 'chip-row');
      for (const code of group.codes) row.appendChild(chipWith(ctx, code, ctx.data.labelOf(code)));
      wrap.appendChild(row);
      host.appendChild(wrap);
    }
  }

  // ---- 就診清單 ----
  function cartItemEl(item, i, ctx) {
    const fav = ctx.store.isFav(item.code);
    const adjunct = isAdjunctCode(ctx, item.code);
    const li = document.createElement('li');
    li.dataset.code = item.code;
    li.draggable = true;
    li.tabIndex = 0;
    li.title = '拖曳可調整順序（或用 Alt+↑／Alt+↓）';
    if (adjunct) li.classList.add('is-adjunct');

    const grip = icon('grip', 14);
    grip.classList.add('cart-grip');
    const badge = el('span', 'cart-badge', i === 0 ? '主' : String(i + 1));
    if (i === 0) badge.dataset.primary = 'true';
    badge.title = i === 0 ? '主診斷' : '第 ' + (i + 1) + ' 順位';
    // 附加碼（B95–B97／Z16）站在第一位＝主診斷錯誤，徽章要自己看得出來
    if (adjunct && i === 0) {
      badge.dataset.warn = 'true';
      badge.title = '附加碼不可作為主診斷：請加入主要疾病並把它排到第一位';
    }

    const code = el('b', 'cart-code', item.code);
    code.title = '點擊複製此碼';
    const zh = el('span', 'cart-zh', item.zh);

    const primary = el('button', 'cart-primary', '主');
    primary.type = 'button';
    primary.title = '設為主診斷';
    const favBtn = el('button', 'cart-fav');
    favBtn.type = 'button';
    favBtn.title = fav ? '取消我的最愛' : '加入我的最愛';
    favBtn.setAttribute('aria-pressed', fav ? 'true' : 'false');
    favBtn.appendChild(icon('star', 14));
    const remove = el('button', 'cart-remove');
    remove.type = 'button';
    remove.title = '移除';
    remove.appendChild(icon('x', 14));

    li.append(grip, badge, code, zh);
    // 標記放在 .cart-zh 之外：那個 span 有 ellipsis，寫成 ::after 會被中文名擠掉一半
    if (adjunct) li.appendChild(el('i', 'chip-tag', '附加碼'));
    li.append(primary, favBtn, remove);
    return li;
  }

  function renderCart(ul, empty, count, ctx) {
    const s = ctx.store.getState();
    clear(ul);
    s.cart.forEach((item, i) => ul.appendChild(cartItemEl(item, i, ctx)));
    if (empty) empty.hidden = s.cart.length > 0;
    if (count) count.textContent = s.cart.length ? String(s.cart.length) : '';
    /* 第一位是附加碼時掛旗標，由 CSS 的 ::before 顯示整條警示（三套版面共用 #cart）。
       刻意不插一個 <li>：#cart 的 li 索引就是清單順序，拖曳換序的 indexOfRow()
       與 Alt+↑↓ 都直接用 children 索引，多一列非代碼的 li 會讓換序全部錯位。 */
    if (s.cart.length && isAdjunctCode(ctx, s.cart[0].code)) ul.dataset.primaryAdjunct = 'true';
    else delete ul.dataset.primaryAdjunct;
  }

  // ---- 貼入 HIS ----
  const FORMAT_LABEL = { lines: '每行一碼', comma: '逗號分隔', names: '碼＋名稱' };

  /* 預覽文字必須與剪貼簿內容同源：兩邊都呼叫 logic.formatCart，看到的＝貼出去的。 */
  function hisText(ctx) {
    const s = ctx.store.getState();
    return ctx.logic.formatCart(s.cart, s.format);
  }

  function renderHis(pre, formatLabel, copyBtn, ctx) {
    const s = ctx.store.getState();
    const text = hisText(ctx);
    pre.textContent = text || '（清單為空）';
    if (formatLabel) formatLabel.textContent = FORMAT_LABEL[s.format] || FORMAT_LABEL.lines;
    if (copyBtn) {
      copyBtn.textContent = s.copied ? '已複製 ✓ 可貼入 HIS' : '複製並貼入 HIS';
      blueprint(copyBtn);
      copyBtn.disabled = !s.cart.length;
    }
  }

  // ---- 常用列（★最愛在前、最近使用在後） ----
  function renderShelf(host, empty, ctx) {
    const s = ctx.store.getState();
    clear(host);
    for (const code of s.favs) {
      host.appendChild(chipWith(ctx, code, ctx.data.labelOf(code), {
        className: 'shelf-chip is-fav', star: true, title: '★ ' + code + ' ' + ctx.data.labelOf(code),
      }));
    }
    for (const code of s.recent) {
      if (s.favs.indexOf(code) >= 0) continue;
      host.appendChild(chipWith(ctx, code, ctx.data.labelOf(code), { className: 'shelf-chip' }));
    }
    if (empty) {
      empty.hidden = !!(s.favs.length || s.recent.length);
      host.appendChild(empty);       // clear() 會把它一起清掉，重新掛回來
    }
  }

  // ---- 設定 popover ----
  const MODE_DEFS = [['outpatient', '內科門診', 'mode-op'], ['emergency', '內科急診', 'mode-er'], ['surg', '外科', 'mode-surg']];
  const FORMAT_DEFS = [['lines', '每行一碼'], ['comma', '逗號分隔'], ['names', '碼＋名稱']];
  const LAYOUT_DEFS = [['wide', '工作台'], ['dock', '側掛窄欄']];
  const LAYOUT_LABEL = { wide: '工作台', dock: '側掛窄欄', mobile: '手機版面' };
  /* 生效版面的分界寬度。app.js 的 resolveLayout() 直接讀這個值，說明文案與實際判斷
     才不會各寫一個數字而慢慢分歧。 */
  const LAYOUT_MIN_WIDTH = 900;

  function segRow(id, defs, attr, small) {
    const row = el('div', 'seg-row');
    row.id = id;
    for (const def of defs) {
      const b = el('button', 'seg-btn' + (small ? ' seg-btn--sm' : ''), def[1]);
      b.type = 'button';
      b.setAttribute(attr, def[0]);
      b.setAttribute('aria-pressed', 'false');
      if (def[2]) b.id = def[2];
      row.appendChild(b);
    }
    return row;
  }

  function section(title, body) {
    const wrap = el('div', 'settings-section');
    wrap.append(el('div', 'kicker', title), body);
    return wrap;
  }

  /* 三套版面共用同一份 popover 內容（定位由各版面的 CSS 負責）。 */
  function settingsPopoverEl(small) {
    const pop = el('div', 'settings-popover');
    pop.id = 'settings-popover';
    pop.hidden = true;
    /* #layout-note 刻意放在「桌機版面」區塊之外：手機版面會把整個桌機版面區塊
       標成 .is-desktop-only 藏起來，而「視窗太窄自動改用手機版面」恰恰只在手機
       版面生效時才要講——放進去就永遠看不到。 */
    const layoutNote = el('div', 'settings-alert', '');
    layoutNote.id = 'layout-note';
    layoutNote.hidden = true;
    pop.append(
      section('桌機版面', segRow('seg-layout', LAYOUT_DEFS, 'data-layout-opt', small)),
      layoutNote,
      section('看診模式', segRow('seg-mode', MODE_DEFS, 'data-mode', small)),
      section('複製格式', segRow('seg-format', FORMAT_DEFS, 'data-format', small))
    );
    const display = el('div', 'settings-row');
    const theme = el('button', 'btn btn-secondary', '夜間模式');
    theme.type = 'button';
    theme.id = 'theme-toggle';
    const shelf = el('button', 'btn btn-secondary', '隱藏常用列');
    shelf.type = 'button';
    shelf.id = 'shelf-toggle';
    display.append(theme, shelf);
    pop.appendChild(section('顯示', display));
    const note = el('div', 'settings-note', '');
    note.id = 'db-note';
    pop.appendChild(note);
    /* 全庫載入失敗時的唯一出路。沒有這顆鈕，ensureDb() 會一直回傳快取起來的失敗 Promise，
       使用者只能重新開啟整個 HTML 檔（R2 I2）。只在 dbState==='error' 時顯示。 */
    const retry = el('button', 'btn btn-secondary db-retry', '重新載入全庫');
    retry.type = 'button';
    retry.id = 'db-retry';
    retry.hidden = true;
    pop.appendChild(retry);
    return pop;
  }

  function setPressed(row, attr, value) {
    if (!row) return;
    for (const b of row.querySelectorAll('.seg-btn')) {
      const on = b.getAttribute(attr) === value;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      // C1-2：不倚賴 :has()／屬性選擇器單一途徑，同時掛 class
      b.classList.toggle('is-on', on);
    }
  }

  /* 全庫狀態說明。數字讀 window.ICD_META.rowCount，不得寫死（換版資料後數字會說謊）。 */
  function dbNoteText(ctx) {
    const s = ctx.store.getState();
    if (s.dbState === 'ready') {
      const n = (root.ICD_META && root.ICD_META.rowCount) || ctx.data.rowCount();
      return '全庫 ' + n.toLocaleString() + ' 筆已就緒';
    }
    if (s.dbState === 'loading') return '全庫索引載入中…';
    if (s.dbState === 'error') {
      return typeof DecompressionStream === 'undefined'
        ? '瀏覽器過舊，無法解壓全庫（需 Edge／Chrome 80 以上）；精選面板仍可使用'
        : '全庫載入失敗，僅精選面板可用';
    }
    return '精選面板已載入（搜尋時才載入全庫）';
  }

  /* 生效版面 ≠ 偏好版面時的說明；一致時回空字串（呼叫端據此隱藏）。

     resolveLayout() 有兩種降級：視窗未達 LAYOUT_MIN_WIDTH 時偏好 wide 會變 mobile，
     以及偏好的版面模組不存在時退回 wide。兩種都會讓 seg-layout 顯示的選中項與眼前
     畫面對不上，沒有說明的話使用者只會覺得設定壞了。
     生效版面讀 body[data-layout]——app.js 掛載後一定會寫，且永遠等於實際掛載的版面，
     這裡不重算一次寬度，免得兩邊判斷分歧。 */
  function layoutNoteText(ctx, effective) {
    const pref = ctx.store.getState().layout;
    const now = effective || (document.body && document.body.dataset.layout) || '';
    if (!now || now === pref) return '';
    const prefLabel = LAYOUT_LABEL[pref] || pref;
    const nowLabel = LAYOUT_LABEL[now] || now;
    if (now === 'mobile') {
      return '目前生效的是手機版面：視窗寬度未達 ' + LAYOUT_MIN_WIDTH
        + ' px 時會自動改用手機版面；把視窗放寬即會回到您偏好的「' + prefLabel + '」。';
    }
    return '目前生效的是「' + nowLabel + '」：偏好的「' + prefLabel
      + '」版面無法載入，已改用「' + nowLabel + '」。';
  }

  function syncSettings(root2, ctx) {
    const s = ctx.store.getState();
    setPressed(root2.querySelector('#seg-mode'), 'data-mode', s.mode);
    setPressed(root2.querySelector('#seg-format'), 'data-format', s.format);
    setPressed(root2.querySelector('#seg-layout'), 'data-layout-opt', s.layout);
    const theme = root2.querySelector('#theme-toggle');
    if (theme) theme.textContent = s.theme === 'dark' ? '日間模式' : '夜間模式';
    const shelf = root2.querySelector('#shelf-toggle');
    if (shelf) shelf.textContent = s.shelfOpen ? '隱藏常用列' : '顯示常用列';
    const layoutNote = root2.querySelector('#layout-note');
    if (layoutNote) {
      const text = layoutNoteText(ctx);
      layoutNote.textContent = text;
      layoutNote.hidden = !text;
    }
    const note = root2.querySelector('#db-note');
    if (note) note.textContent = dbNoteText(ctx);
    const retry = root2.querySelector('#db-retry');
    if (retry) retry.hidden = s.dbState !== 'error';
    const pop = root2.querySelector('#settings-popover');
    const toggle = root2.querySelector('#settings-toggle');
    if (pop) pop.hidden = !s.settingsOpen;
    if (toggle) toggle.setAttribute('aria-expanded', s.settingsOpen ? 'true' : 'false');
  }

  const MODE_LABEL = { outpatient: '內科門診', emergency: '內科急診', surg: '外科' };
  const PANELS_TITLE = { outpatient: '內科門診主訴', emergency: '內科急診主訴', surg: '常見情境（外科）' };
  const MODE_HINT = {
    outpatient: '主訴優先，常見疾病收合在下',
    emergency: '先看主訴，再複核優先排除項目',
    surg: '選擇傷口、外傷或術後情境',
  };

  root.ICDRender = {
    icon, el, blueprint, clear, chipEl, chipWith, chipsFromPairs, emptyText,
    renderResults, relatedGroups, renderRelated,
    cartItemEl, renderCart, hisText, renderHis, renderShelf,
    settingsPopoverEl, syncSettings, dbNoteText, layoutNoteText, setPressed,
    FORMAT_LABEL, MODE_LABEL, PANELS_TITLE, MODE_HINT, LAYOUT_LABEL, LAYOUT_MIN_WIDTH,
  };
})(typeof self !== 'undefined' ? self : this);
