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

  /* 取消部位選取（顯示全部部位）時，插在每組面板前面的部位標題。三套版面共用同一個
     結構與類名，各自的樣式限定在 styles/{wide,dock,mobile}.css 的 body[data-layout] 之下。
     用 <h3>：面板標題是 <h4>，這樣讀屏的標題階層才對得起來（1c 沒有面板標題元素，
     h3 就是那一層唯一的地標）。要不要出現由 data.panelGroupsFor() 決定，渲染層不自己判斷。 */
  function regionHeading(name) {
    return el('h3', 'region-heading', name);
  }

  /* 視覺隱藏（.sr-only）的標題。畫面上一個字都不多，但讀屏的標題導覽（H 鍵）拿得到
     頁面層級——v3 §5-2：全站原本沒有 H1／H2，階層直接從 H3／H4 開始。
     刻意不把現成的可見元素（.app-brand／.kicker／.dock-related-title）改成標題標籤：
     industry.css 的 `h1..h6 { margin: 0 0 var(--space-2) }` 會被一併帶進來而擠動版面，
     而樣式是另一條工作線的範圍。 */
  function srHeading(level, text, id) {
    const h = el('h' + level, 'sr-only', text);
    if (id) h.id = id;
    return h;
  }

  /* 部位列（含「全部」）的選中狀態，三套版面共用。

     這裡原本是 `role="tab"`（容器 `role="tablist"`）＋ `aria-selected`。那等於向讀屏
     宣告 WAI-ARIA Tabs Pattern 的鍵盤契約——roving tabindex、方向鍵在同組內移動——
     但整份 src 從來沒有實作方向鍵，使用者被語意引導去按方向鍵卻毫無反應。
     **宣告了契約卻不履行，比不宣告更糟**（v3 §5-3）。

     而且這一列本來就不是 tabs：沒有任何 tabpanel 與之對應，還允許「一個都沒選」
     （「全部」鈕）與「再點一次取消」，兩者都違反 tablist「永遠恰好一個 selected」的前提。
     所以改成本專案既有、且與 #mode-switch 完全同型的誠實作法：一組 role="group" 的
     切換鈕，狀態走 aria-pressed，鍵盤契約回到原生按鈕的 Tab／Enter／Space。

     兩個出口同時寫：
       aria-pressed   真正的狀態，AT 讀這個
       .is-on         CSS 掛鉤（C1-2：不倚賴屬性選擇器單一途徑）
     曾短暫並寫 `aria-selected` 當過渡期的 CSS 掛鉤，三個版面檔改吃 .is-on 之後已移除。 */
  function markRegionSelected(b, on) {
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.classList.toggle('is-on', !!on);
    return b;
  }

  /* 部位列的容器（三套版面共用）。role="group" ＋ aria-label 才撐得住那個標籤；
     不用 <nav>：它不是導覽，是篩選器，掛 nav 會多出一個名不副實的 navigation 地標。 */
  function regionGroupEl(id, label) {
    const box = el('div');
    box.id = id;
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', label);
    return box;
  }

  /* 部位鈕上的兩字短名（三套版面共用）。長名（「皮膚／軟組織」）在 340px 的窄欄裡
     會把按鈕撐成兩行，一排部位就吃掉半個畫面；縮到兩字才排得進兩列。
     **只改可見文字**——資料檔的分類名維持原樣，因為「顯示全部部位」時的分組標題、
     E2E 的 data-region 定位、臨床內容清單都靠它。全名一律留在 title。
     外科的九個是情境不是部位，同樣縮成兩字（滑鼠停留看得到全名）。 */
  const REGION_SHORT = {
    慢性疾病: '慢性', '全身／感染': '全身', 感染科追蹤: '感染',
    '神經／精神': '神經', '神經／頭頸': '頭頸', 眼耳鼻喉: '頭頸',
    '胸肺／心臟': '心肺', '腹部／消化': '腹部', '泌尿／生殖': '泌尿',
    '皮膚／軟組織': '皮膚', 肌肉骨骼: '骨骼', '代謝／檢驗': '代謝',
    撕裂傷: '撕裂', '挫傷／擦傷': '挫傷', '傷口處置／術後': '傷口',
    '後續照護（癒合期）': '癒合', 燒燙傷: '燒燙', '膿瘍／皮膚病灶': '膿瘍',
    肛門疾患: '肛門', '疝氣／腹部': '疝氣', '扭傷／拉傷': '扭傷',
  };

  /* 沒收錄的分類（將來新增內容時）退回「取斜線前的前兩字」，不會變成空按鈕。 */
  function regionShort(name) {
    const key = String(name || '');
    if (REGION_SHORT[key]) return REGION_SHORT[key];
    return key.split('／')[0].slice(0, 2) || key.slice(0, 2);
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

    /* 可點擊就必須可聚焦、可用鍵盤觸發（v1 §3 的唯一破口：三套版面都到不了這一顆）。
       保留 <b> 而不換成 <button>：三套 CSS 都以 `b.cart-code` 選取它，換元素等於連帶
       改掉外觀，而樣式是另一條工作線。補上 role＋tabindex＋鍵盤事件同樣語意完整；
       鍵盤觸發在 interactions.js（1c 進 PiP 小視窗期間由 render-dock.js 代打）。 */
    const code = el('b', 'cart-code', item.code);
    code.setAttribute('role', 'button');
    code.tabIndex = 0;
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
    /* 看診模式不放進設定：header 的三顆鈕已經是一次點擊就切換的主動線，
       設定裡再放一份 segmented 只是同一件事的第二個入口，兩處都要維護狀態同步。 */
    pop.append(
      section('桌機版面', segRow('seg-layout', LAYOUT_DEFS, 'data-layout-opt', small)),
      layoutNote,
      section('複製格式', segRow('seg-format', FORMAT_DEFS, 'data-format', small))
    );
    const display = el('div', 'settings-row');
    const theme = el('button', 'btn btn-secondary', '夜間模式');
    theme.type = 'button';
    theme.id = 'theme-toggle';
    const shelf = el('button', 'btn btn-secondary', '隱藏常用列');
    shelf.type = 'button';
    shelf.id = 'shelf-toggle';
    /* 拖曳分隔條調過的高度沒有其他出口：拖過頭把某一區壓到只剩下限時，光靠再拖回去
       很難回到原本的比例。這顆鈕只清「目前生效版面」那一組（見 interactions.js）。 */
    const panes = el('button', 'btn btn-secondary', '回復預設高度');
    panes.type = 'button';
    panes.id = 'reset-panes';
    display.append(theme, shelf, panes);
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
    /* 免責。放在設定 popover 是因為它是三套版面唯一都有、且隨時叫得出來的「關於」面。
       加入慢病速查之前，這個工具從不告訴醫師該做什麼——它只把已經做好的診斷決定轉成代碼，
       所以介面上不需要臨床免責。現在它會顯示治療目標與給付門檻，已經跨進臨床參考的範疇，
       這句話必須在介面上（而不只是 README）講清楚。
       浮層裡另有一句更貼近內容的但書（CHRONIC_DISCLAIMER），兩者刻意不合併：
       這一句講的是整個工具的性質，那一句講的是眼前那幾條規定能信到什麼程度。 */
    const about = el('div', 'settings-note settings-disclaimer',
      '本工具輔助選碼，不做診斷。慢病速查列出的給付規定與治療目標僅為查閱起點，'
      + '以健保署當期公告與醫師臨床判斷為準。');
    about.id = 'about-note';
    pop.appendChild(about);
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
     畫面對不上，沒有說明的話使用者只會覺得設定壞了。 */
  /* 生效版面（wide|dock|mobile）。app.js 掛載後一定會寫進 body[data-layout]，且永遠等於
     實際掛載的版面——這裡不重算一次寬度，免得兩邊判斷分歧。1c 被搬進 PiP 小視窗時，
     主文件的 body 仍標著 dock，取到的值依然正確。 */
  const effectiveLayout = () => (document.body && document.body.dataset.layout) || '';

  function layoutNoteText(ctx, effective) {
    const pref = ctx.store.getState().layout;
    const now = effective || effectiveLayout();
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
    /* 「回復預設高度」只對**生效版面**有意義（同 layoutNoteText：讀 body[data-layout]，
       不自己重算寬度）。沒調過任何高度時停用並說明，免得按了沒反應像壞掉。 */
    const panes = root2.querySelector('#reset-panes');
    if (panes) {
      const effective = effectiveLayout();
      const dirty = ctx.store.hasPaneSizes(effective);
      panes.disabled = !dirty;
      panes.title = dirty
        ? '把本版面各區塊的高度回復成預設'
        : '本版面各區塊都是預設高度（拖曳區塊之間的分隔線即可調整）';
    }
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
  /* 1c 的 176px 塞不下全名（「內科門…」）。短標籤集中在這裡一份，render-dock.js 的
     徽章、設定 popover 的短標籤與模式選單共用，不得各自再抄一份而慢慢分歧。 */
  const MODE_SHORT = { outpatient: '門診', emergency: '急診', surg: '外科' };
  const PANELS_TITLE = { outpatient: '內科門診主訴', emergency: '內科急診主訴', surg: '常見情境（外科）' };
  const MODE_HINT = {
    outpatient: '主訴優先，常見疾病收合在下',
    emergency: '先看主訴，再複核優先排除項目',
    surg: '選擇傷口、外傷或術後情境',
  };

  // ---- header 的看診模式三鈕 ----
  /* 使用者原話：「我不要點擊下拉 我希望三個按鈕並排」——三顆按鈕直接並排在 header，
     一次點擊就切換，沒有任何展開動作（不做循環切換：那會 overshoot，也看不到還有哪些選項）。
     外觀與選中表現沿用設計系統既有的 segmented（.seg-row／.seg-btn），選中狀態由
     setPressed() 同時寫 aria-pressed 與 .is-on（C1-2：不倚賴 :has() 或單一屬性選擇器）。

     三套版面共用同一份結構與行為（使用者要求「功能請統一」）；`compact` 只在 1c 的 176px
     為真，換成短標籤＋小號尺寸——那是空間限制，不是功能差異。三顆鈕各自在哪一列由各版面
     的 CSS 決定（1a 直接排在 header 那列，1b／1c 獨立成一行）。

     設定 popover 裡原本還有一份模式 segmented，已移除：同一件事兩個入口，
     兩處都要維護狀態同步，而 header 這條動線本來就更快。 */
  function modeSwitchEl(compact) {
    const row = el('div', 'seg-row mode-switch');
    row.id = 'mode-switch';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', '看診模式');
    for (const def of MODE_DEFS) {
      const b = el('button', 'seg-btn mode-btn' + (compact ? ' seg-btn--sm' : ''),
        compact ? MODE_SHORT[def[0]] : def[1]);
      b.type = 'button';
      b.dataset.mode = def[0];
      b.setAttribute('aria-pressed', 'false');
      b.title = '看診模式：' + def[1];        // 短標籤時完整名稱留在 title
      row.appendChild(b);
    }
    return row;
  }

  function syncModeSwitch(root2, ctx) {
    setPressed(root2.querySelector('#mode-switch'), 'data-mode', ctx.store.getState().mode);
  }

  /* 「日期」鈕：HIS 的就診日期欄位吃民國格式（115-08-13），手打容易錯年份。
     點一下把今天的日期放進剪貼簿，接著在 HIS 欄位 Ctrl+V（或用 F9 熱鍵）。
     排在模式三鈕左邊——它是「開始看這一診」的第一個動作。
     title 不寫死日期：按鈕是開機時建立的，跨過午夜就會與實際複製的值不一致。 */
  function dateBtnEl(compact) {
    const b = el('button', 'btn btn-secondary date-btn' + (compact ? ' seg-btn--sm' : ''), '日期');
    b.type = 'button';
    b.id = 'copy-date';
    b.title = '複製今天的日期（民國格式，例 115-08-13）到剪貼簿';
    return b;
  }

  // ---- 慢病速查（DM／HTN／LIPID） ----
  /* 使用者原話：「上面有三個按鈕 分成 DM, HTN, LIPID 然後我點這三個按鈕分別跳出你整理過的
     健保用藥規定 跟 國際指引建議目標」。內容量大（每主題 15–20 條）且是**偶爾查閱**的參考，
     所以走浮層而不是佔版面：三套版面共用同一個 #chronic-overlay 與同一份渲染，
     差別只有各版面 CSS 的尺寸與按鈕擺放位置（見各 render-*.js 的註解）。

     這一塊與工具其他部分有一個本質差異，決定了所有設計選擇：**ICD 代碼可以逐碼比對
     官方全庫、錯了建置就失敗；給付規定沒有這種驗證。** 因此時效性是一等公民：
       1. 每條的 source 與 checked 直接印在畫面上（不是 title、不是註腳）
       2. effectiveFrom／effectiveTo 依當天日期自動只留現行版（logic.splitByEffective）
       3. 已公告未生效的版本另外標「新版將於 X 日生效」，不藏起來
       4. 面板上永遠有一句但書：這是查閱起點，以健保署當期公告為準 */
  /* 三種 kind 的中文（與 chronic_care.json 的 _schema 同一組說法）。資料的 section 只帶
     kind、不帶標題，標題由這裡映射——不是可有可無的裝飾：「臨床治療目標」與「健保給付規定」
     正是這份速查最需要被分清楚的兩件事（能不能開 ≠ 該開到什麼程度）。 */
  const CHRONIC_KIND = { target: '臨床治療目標', coverage: '健保給付規定', caution: '實務提醒' };
  const CHRONIC_DISCLAIMER = '此為查閱起點，不是給付判定或治療處方：'
    + '實際給付以健保署當期公告為準，治療目標須依個別病人狀況調整。';

  /* 判定「現行版本」用的當天日期（本地時區，不是 UTC——`new Date('2026-09-01')` 是 UTC 午夜，
     台北會早一天翻版）。`window.ICD_TODAY`（YYYY-MM-DD）可覆寫，讓 E2E 能驗證換版前後
     兩個時間點；格式不符一律忽略，不讓壞值變成看起來合理的錯誤日期。 */
  function chronicToday() {
    const forced = root.ICD_TODAY;
    if (typeof forced === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(forced)) return forced;
    const d = new Date();
    const pad = (n) => (n < 10 ? '0' : '') + n;
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /* 資料由 build.py 內嵌成 window.CHRONIC_CARE（與 window.ICD_META 同一個作法）。
     開發期 sections 是空的，全部路徑都必須吃得下空值而不壞。 */
  function chronicTopics() {
    const src = root.CHRONIC_CARE;
    return src && Array.isArray(src.topics) ? src.topics.filter((t) => t && t.key) : [];
  }

  const chronicTopicOf = (key) => chronicTopics().filter((t) => t.key === key)[0] || null;

  /* 三顆入口鈕。**刻意不用 .seg-row／.seg-btn**：那組視覺在本產品的語意是「選一個狀態」
     （看診模式、複製格式），而這三顆是「開一個查閱浮層」，共用外觀會讓人以為點下去
     會切換整個工具的模式。compact＝1c／1b，省掉可見的「慢病速查」小標（空間不足），
     可讀名稱改由 group 的 aria-label 與每顆的 title 提供。 */
  function chronicSwitchEl(compact) {
    const row = el('div', 'chronic-switch' + (compact ? ' chronic-switch--compact' : ''));
    row.id = 'chronic-switch';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', '慢病速查：健保給付規定與治療目標');
    if (!compact) row.appendChild(el('span', 'kicker chronic-kicker', '慢病速查'));
    for (const topic of chronicTopics()) {
      const b = el('button', 'chronic-btn', topic.short || topic.key.toUpperCase());
      b.type = 'button';
      b.id = 'chronic-btn-' + topic.key;
      b.dataset.chronic = topic.key;
      b.setAttribute('aria-haspopup', 'dialog');
      b.setAttribute('aria-expanded', 'false');
      b.setAttribute('aria-controls', 'chronic-panel');
      b.title = '慢病速查：' + (topic.label || topic.key) + '　健保給付規定與治療目標';
      row.appendChild(b);
    }
    return row;
  }

  /* 浮層內的主題分頁。**沒有這一排，這個功能是半殘的**：浮層是 modal，開著的時候外面
     那三顆入口鈕被遮罩蓋住，醫師想從 DM 換看 LIPID 得先關掉再開一次——而「比對兩個
     主題的目標值」正是最常見的用法（例：DAROC 的血壓目標 vs 高血壓指引的血壓目標）。
     用 aria-pressed 的一組切換鈕，不用 WAI-ARIA Tabs：那個 pattern 要求實作方向鍵的
     roving tabindex，本專案沒有，宣告了不履行比不宣告更糟（同 markRegionSelected 的理由）。 */
  function chronicTabsEl() {
    const row = el('div', 'chronic-tabs');
    row.id = 'chronic-tabs';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', '切換慢病速查主題');
    for (const topic of chronicTopics()) {
      const b = el('button', 'chronic-tab', topic.short || topic.key.toUpperCase());
      b.type = 'button';
      b.id = 'chronic-tab-' + topic.key;
      b.dataset.chronic = topic.key;
      b.setAttribute('aria-pressed', 'false');
      b.title = topic.label || topic.key;
      row.appendChild(b);
    }
    return row;
  }

  /* 入口鈕與浮層內分頁同源於 store.chronicTopic，一次同步兩邊（兩處都要，否則關掉浮層後
     入口鈕會留著「展開中」的樣子）。 */
  function syncChronicSwitch(root2, ctx) {
    const open = ctx.store.getState().chronicTopic;
    for (const b of root2.querySelectorAll('#chronic-switch .chronic-btn')) {
      const on = b.dataset.chronic === open;
      b.setAttribute('aria-expanded', on ? 'true' : 'false');
      b.classList.toggle('is-on', on);        // C1-2：不倚賴單一屬性選擇器
    }
    for (const b of root2.querySelectorAll('#chronic-tabs .chronic-tab')) {
      const on = b.dataset.chronic === open;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('is-on', on);
    }
  }

  /* 浮層骨架。掛在**各版面的根節點底下**（不是 template.html）：1c 置頂時整棵 dock 會被
     搬進 Document PiP 小視窗，掛在主文件的浮層會留在看不見的主視窗裡。 */
  function chronicOverlayEl() {
    const overlay = el('div', 'chronic-overlay');
    overlay.id = 'chronic-overlay';
    overlay.hidden = true;
    const panel = el('div', 'chronic-panel');
    panel.id = 'chronic-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'chronic-title');
    const head = el('div', 'chronic-head');
    const title = el('h2', 'chronic-title', '');
    title.id = 'chronic-title';
    const close = el('button', 'chronic-close', '關閉');
    close.type = 'button';
    close.id = 'chronic-close';
    close.title = '關閉（Esc，或點面板以外任一處）';
    head.append(title, close);
    const note = el('p', 'chronic-disclaimer', CHRONIC_DISCLAIMER);
    const body = el('div', 'chronic-body');
    body.id = 'chronic-body';
    /* 分頁列刻意排在標題之後、但書之前：換主題是浮層內最高頻的動作，而但書必須緊貼內容
       （它講的是下面那些條文能信到什麼程度，不是整個工具的一般免責）。 */
    panel.append(head, chronicTabsEl(), note, body);
    overlay.appendChild(panel);
    return overlay;
  }

  /* 一條規定。出處與查證日期是**可見文字**，不是 title——這是本功能與其他區塊最大的差別。 */
  function chronicItemEl(item, upcoming) {
    const li = el('li', 'chronic-item' + (upcoming ? ' is-upcoming' : ''));
    if (upcoming) li.appendChild(el('p', 'chronic-soon', '新版將於 ' + item.effectiveFrom + ' 生效'));
    li.appendChild(el('p', 'chronic-text', String(item.text || '')));
    /* detail 收在原生 <details> 裡，預設收合但**控制項本身永遠看得見**。
       兩邊都不能選：全部攤開的話 64 條加起來是一面文字牆，176px 窄欄要捲十幾屏，
       違背「看診當下瞄一眼」；藏進 title 則等於沒有——而 detail 正是消歧義的那一層。
       實例：DAROC 的血壓目標 <140/90 與高血壓指引的 <130/80 兩者都對（後者是 722 法則的
       居家血壓），醫師看到 text 一定會懷疑寫錯，答案就在 detail 裡。
       用原生 <details> 而不是自建 toggle：鍵盤操作、展開狀態、可存取性都由瀏覽器負責，
       也不必為一個純檢視的暫態多開一個 store 欄位。 */
    if (item.detail) {
      const more = el('details', 'chronic-more');
      const summary = document.createElement('summary');
      summary.className = 'chronic-more-toggle';
      summary.textContent = '補充說明';
      more.append(summary, el('div', 'chronic-detail', String(item.detail)));
      li.appendChild(more);
    }
    const meta = el('p', 'chronic-meta');
    /* 缺漏一律顯示「未註明」而不是留白：留白看起來像「沒有這個欄位」，
       「未註明」看起來像「這條沒人查證過」——後者才是事實。 */
    meta.append(
      el('span', 'chronic-source', '出處 ' + (item.source || '未註明')),
      el('span', 'chronic-checked', '查證 ' + (item.checked || '未註明'))
    );
    const from = item.effectiveFrom || '';
    const to = item.effectiveTo || '';
    if (from || to) {
      const window_ = from && to ? '適用 ' + from + '～' + to
        : (from ? '適用 ' + from + ' 起' : '適用至 ' + to);
      meta.appendChild(el('span', 'chronic-window', window_));
    }
    li.appendChild(meta);
    return li;
  }

  function chronicSectionEl(section, today) {
    const parts = root.ICDLogic.splitByEffective(section && section.items, today);
    if (!parts.current.length && !parts.upcoming.length) return null;
    const box = el('section', 'chronic-section');
    const head = el('div', 'chronic-section-head');
    const kind = section && section.kind;
    /* title 是選填的（現行資料只給 kind）。沒有標題就拿 kind 的中文當標題——標題留白會讓
       整段內容失去脈絡，而「治療目標」與「健保給付」對醫師來說正是最需要分清楚的兩件事。 */
    const heading = (section && section.title) || CHRONIC_KIND[kind] || '其他';
    head.appendChild(el('h3', 'chronic-section-title', heading));
    if (CHRONIC_KIND[kind] && CHRONIC_KIND[kind] !== heading) {
      const tag = el('span', 'chronic-kind', CHRONIC_KIND[kind]);
      tag.dataset.kind = kind;
      head.appendChild(tag);
    }
    box.dataset.kind = kind || '';
    const list = el('ul', 'chronic-items');
    for (const item of parts.current) list.appendChild(chronicItemEl(item, false));
    for (const item of parts.upcoming) list.appendChild(chronicItemEl(item, true));
    box.append(head, list);
    return box;
  }

  function renderChronic(overlay, ctx) {
    const key = ctx.store.getState().chronicTopic;
    const title = overlay.querySelector('#chronic-title');
    const body = overlay.querySelector('#chronic-body');
    clear(body);
    overlay.hidden = !key;
    if (!key) { title.textContent = ''; return; }
    const topic = chronicTopicOf(key);
    const label = (topic && topic.label) || key;
    const short = (topic && topic.short) || key.toUpperCase();
    title.textContent = label + '（' + short + '）';
    const today = chronicToday();
    let sections = 0;
    for (const section of (topic && topic.sections) || []) {
      const node = chronicSectionEl(section, today);
      if (!node) continue;
      body.appendChild(node);
      sections += 1;
    }
    /* 空狀態要講實話：沒有內容不是「沒有規定」，是這份速查還沒整理到。 */
    if (!sections) {
      body.appendChild(el('p', 'chronic-empty',
        '「' + label + '」的內容尚未整理完成，請直接查健保署當期公告與現行指引。'));
    }
    body.appendChild(el('p', 'chronic-foot',
      '依當天日期（' + today + '）只顯示現行版本；每條的出處與查證日期就列在該條下方。'));
  }

  root.ICDRender = {
    icon, el, blueprint, clear, regionHeading, srHeading, markRegionSelected, regionGroupEl,
    regionShort, dateBtnEl,
    chipEl, chipWith, chipsFromPairs, emptyText,
    renderResults, relatedGroups, renderRelated,
    cartItemEl, renderCart, syncClearBtn, hisText, renderHis, renderShelf,
    settingsPopoverEl, syncSettings, dbNoteText, layoutNoteText, effectiveLayout, setPressed,
    modeSwitchEl, syncModeSwitch,
    chronicSwitchEl, chronicTabsEl, syncChronicSwitch, chronicOverlayEl, renderChronic,
    chronicToday, chronicTopics,
    FORMAT_LABEL, MODE_LABEL, MODE_SHORT, PANELS_TITLE, MODE_HINT, LAYOUT_LABEL, LAYOUT_MIN_WIDTH,
    CHRONIC_KIND, CHRONIC_DISCLAIMER,
  };
})(typeof self !== 'undefined' ? self : this);
