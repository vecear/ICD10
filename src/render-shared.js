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
    // 側掛：一個框、右側切出一條窄欄——就是這個動作要得到的畫面
    panelRight: '<rect width="18" height="18" x="3" y="3" rx="1"/><path d="M15 3v18"/>',
    // 展開：四角向外，回到滿版工作台
    expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>'
      + '<path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
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
  const LAYOUT_LABEL = { wide: '工作台', dock: '側掛窄欄', mobile: '手機版面' };

  /* 版面切換鈕。1a 是「側掛置頂」（切窄欄＋開置頂小視窗，一次到位），1c 是「展開」
     （回工作台）。原本這是設定裡的一組 segmented，要「先進設定選側掛窄欄、再按置頂」
     兩步；診間每天要切好幾次，所以改成兩邊各一顆直接鈕。

     兩顆是同一個角色，共用這一份結構：icon ＋ 一個可被 CSS 藏起來的文字標籤。
     空間不夠時藏文字、可讀名稱改由 title 提供——與 .dock-pin 同一套機制，
     不另外發明第二種收縮方式。data-layout-go 讓事件委派一條分支就接得住兩顆。 */
  const LAYOUT_TOGGLE = {
    dock: { id: 'go-dock', icon: 'panelRight', label: '側掛置頂',
            title: '側掛置頂：切成側掛窄欄，並開啟永遠在最上層的小視窗' },
    wide: { id: 'go-wide', icon: 'expand', label: '展開',
            title: '展開：回到工作台版面（置頂小視窗會一併關閉）' },
  };

  function layoutToggleEl(kind, small) {
    const def = LAYOUT_TOGGLE[kind];
    const b = el('button', small ? 'dock-tool layout-toggle' : 'btn btn-secondary layout-toggle');
    b.type = 'button';
    b.id = def.id;
    b.title = def.title;
    /* 文字在窄寬度會被 CSS 藏起來（display:none 會一併從無障礙樹移除），
       所以名稱另外釘在 aria-label 上，不只靠 title。 */
    b.setAttribute('aria-label', def.label);
    b.dataset.layoutGo = kind;
    b.append(icon(def.icon, small ? 12 : 14), el('span', 'layout-toggle-label', def.label));
    return b;
  }
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
    /* 版面切換不放進設定：1a 的「側掛置頂」與 1c 的「展開」已經是一次點擊就到位的
       主動線，設定裡再放一份 segmented 只是同一件事的第二個入口。

       #layout-note 留著，而且比以前更需要：它講的是「生效版面 ≠ 你的偏好」
       （視窗未達 LAYOUT_MIN_WIDTH 時自動改用手機版面）。偏好現在由按鈕設定，
       沒有這段說明的話，在窄視窗按了側掛置頂卻跑出手機版面就只會像壞掉。 */
    const layoutNote = el('div', 'settings-alert', '');
    layoutNote.id = 'layout-note';
    layoutNote.hidden = true;
    /* 看診模式不放進設定：header 的三顆鈕已經是一次點擊就切換的主動線，
       設定裡再放一份 segmented 只是同一件事的第二個入口，兩處都要維護狀態同步。 */
    pop.append(
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
       浮層裡原本另有一句更貼近內容的但書，2026-08-26 依使用者要求移除：他每天開那個面板，
       那句話每次都在，但只有第一次有用，在 176px 窄欄裡它擋掉的閱讀空間比提醒價值大。
       免責因此只剩這一處——它仍然在介面上，不是只寫在 README。 */
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
     以及偏好的版面模組不存在時退回 wide。兩種都會讓眼前的畫面與剛才按的那顆鈕
     對不上，沒有說明的話使用者只會覺得按鈕壞了。 */
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

  /* 分組順序照使用者的實際動線排（原話：「我是看到電腦上異常的數值才來看這個頁面，
     看健保有沒有給付、怎麼給付、治療目標」）——所以門檻排第一、目標排最後。
     原本照資料檔的 section 順序（目標→給付→提醒），最常查的給付門檻被推到第二屏。

     step 與 kind 是兩件事：step 決定「排在哪一段」，kind 決定「這條的可信度來自哪裡」
     （指引／給付公告／實務提醒），所以條目上仍然標 kind。 */
  const CHRONIC_STEP = [
    ['gate', '能不能開', '起始門檻'],
    ['how', '怎麼開', '路徑、劑量與追蹤'],
    ['pitfall', '別踩雷', '最常被核刪'],
    ['nocover', '不給付', '開了就是自費'],
    ['target', '治療目標', '達標後回來看'],
  ];
  const CHRONIC_STEP_LABEL = {};
  for (const row of CHRONIC_STEP) CHRONIC_STEP_LABEL[row[0]] = row[1];
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

  /* 一顆入口鈕。**刻意不用 .seg-row／.seg-btn**：那組視覺在本產品的語意是「選一個狀態」
     （看診模式、複製格式），而這顆是「開一個查閱浮層」，共用外觀會讓人以為點下去
     會切換整個工具的模式。

     原本是 DM／HTN／LIPID 三顆並排。收成一顆的理由是版面：這一排現在還要放
     「血脂計算機」與「CCr」兩個計算機（CCr 從 header 搬下來），176px 的窄欄放不下五顆。
     主題選擇沒有因此消失，只是往後挪一步——浮層最上方本來就有 DM／HTN／LIPID 分頁列，
     而且那排本來就是換主題的唯一路徑（浮層是 modal，開著時外面的鈕被遮罩蓋住）。 */
  function chronicSwitchEl(compact) {
    const row = el('div', 'chronic-switch' + (compact ? ' chronic-switch--compact' : ''));
    row.id = 'chronic-switch';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', '健保規範條文與計算機');
    const b = el('button', 'chronic-btn', '健保規範條文');
    b.type = 'button';
    b.id = 'chronic-btn';
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', 'chronic-panel');
    b.title = '健保規範條文：DM／HTN／LIPID 的給付規定、治療目標與官方條文 PDF';
    row.appendChild(b);
    /* 兩個計算機接在後面。血脂試算算的就是 LIPID 的給付門檻，CCr 是調劑量用的，
       兩者都是「輸入數值換一個判斷」，與條文查閱同一個動線，放同一排。
       這一排跟著內容捲動（1c／1b），常駐版面成本是 0。 */
    row.append(lipidButtonEl(compact), ccrButtonEl(compact));
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
      const on = !!open;
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
    const body = el('div', 'chronic-body');
    body.id = 'chronic-body';
    panel.append(head, chronicTabsEl(), body);
    overlay.appendChild(panel);
    return overlay;
  }

  /* 把一段條文攤成「一條一行」，塞進 box。主文與補充共用同一套排版，
     因為它們是同一種東西（並列的適用條件），醫師沒有理由要學兩種讀法。

     兩件事同時做，兩件都不佔額外行高：
       1. 依 logic.splitSentences 斷段（句號與括號外的分號）——分號後面幾乎都是
          **另一個適用條件**，接在一起讀就得自己在腦中拆一次。
       2. 行首的「短標：」（起始門檻：、篩檢：、Fibrate：）標重——那正是掃視時要找的詞。

     斷成兩段以上才掛 is-split（＝才有項目符號與懸掛縮排）：單段條目掛符號等於
     宣告「這裡有第二條」卻沒有，是假訊號；而 .chronic-item 本身已經有下緣線當分隔。

     promoteLead（**只有主文用**）把第一段的短標提成獨立的標題行，底下所有條件平行掛。
     來由：使用者 2026-08-26 指出「Fibrate：TG 200–499 …；／▪ TG ≧ 500 …」是錯的——
     原文是一張給付規定**表**，兩個 TG 區間是各自成立的兩列，而「Fibrate」是這張表的
     抬頭。把抬頭黏在第一列上，等於宣告它只管第一條，第二條變成沒有歸屬的孤兒。

     **補充（detail）刻意不提**：主文是「一條規定＝一個主題」，短標確實統轄整條；
     補充是散文，同一段裡會出現好幾個短標（「眼底：…。腎功能：…」共 6 段、
     「其餘依危險因子計數：…」共 9 段），把第一個提上去會把後面不相干的段落
     全掛到它底下——那是把可讀性換成錯誤的歸屬。

     不吞字、不插字：符號走 CSS ::before，textContent 接回去仍等於資料檔的原文
     （E2E 直接拿它比對 chronic_care.json，見 test_e2e_dock.py 的 chronic_snapshot）。 */
  function fillSegments(box, text, prefix, promoteLead) {
    let segs = root.ICDLogic.splitSentences(String(text || ''));
    const multi = segs.length > 1;
    if (multi) box.classList.add('is-split');
    let tag = prefix;
    if (multi && promoteLead) {
      const cut = root.ICDLogic.splitLead(segs[0]);
      if (cut.lead && cut.rest) {
        const head = el('span', 'chronic-seg is-head');
        if (tag) { head.appendChild(tag); tag = null; }   // 標籤跟著抬頭走
        head.appendChild(el('b', 'chronic-lead', cut.lead));
        box.appendChild(head);
        segs = [cut.rest].concat(segs.slice(1));
      }
    }
    for (let i = 0; i < segs.length; i++) {
      const seg = el('span', 'chronic-seg');
      /* 沒有抬頭可提時，「給付」／「目標」標籤留在第一段並吃掉它的項目符號：
         標籤本身就佔著行首的標記位，再加一個符號就是「▪給付 …」，兩個標記擠在一起
         反而看不出哪個是分條。懸掛縮排照樣套用，續行仍與底下各條對齊。 */
      if (i === 0 && tag) { seg.appendChild(tag); seg.classList.add('is-tagged'); }
      /* 抬頭提走之後，各條自己的次級短標（「TG 200–499：」「TG ≧ 500：」）照樣標重——
         那正是這張表的決策欄，掃視時要比對的就是它。 */
      const cut = root.ICDLogic.splitLead(segs[i]);
      if (cut.lead) seg.appendChild(el('b', 'chronic-lead', cut.lead));
      seg.appendChild(document.createTextNode(cut.rest));
      box.appendChild(seg);
    }
    return box;
  }

  /* 一條規定。出處與查證日期是**可見文字**，不是 title——這是本功能與其他區塊最大的差別。 */
  function chronicItemEl(item, upcoming) {
    const li = el('li', 'chronic-item' + (upcoming ? ' is-upcoming' : ''));
    if (item.kind) li.dataset.kind = item.kind;
    if (upcoming) li.appendChild(el('p', 'chronic-soon', '新版將於 ' + item.effectiveFrom + ' 生效'));
    const line = el('p', 'chronic-text');
    /* 給付規定與治療目標混在同一段時（例如「別踩雷」同時收了兩者），要分得出哪條是
       哪一種——它們的可信度來源不同：給付看公告、目標看指引。
       標籤跟著抬頭（或沒抬頭時的第一段）走，不自成一行，否則每條都多一列。 */
    let tag = null;
    if (item.kind === 'coverage' || item.kind === 'target') {
      tag = el('span', 'chronic-kind-dot');
      tag.dataset.kind = item.kind;
      tag.textContent = item.kind === 'coverage' ? '給付' : '目標';
    }
    fillSegments(line, item.text, tag, true);
    li.appendChild(line);
    /* detail 收在原生 <details> 裡，預設收合但**控制項本身永遠看得見**。
       兩邊都不能選：全部攤開的話 64 條加起來是一面文字牆，176px 窄欄要捲十幾屏，
       違背「看診當下瞄一眼」；藏進 title 則等於沒有——而 detail 正是消歧義的那一層。
       實例：DAROC 的血壓目標 <140/90 與高血壓指引的 <130/80 兩者都對（後者是 722 法則的
       居家血壓），醫師看到 text 一定會懷疑寫錯，答案就在 detail 裡。
       用原生 <details> 而不是自建 toggle：鍵盤操作、展開狀態、可存取性都由瀏覽器負責，
       也不必為一個純檢視的暫態多開一個 store 欄位。 */
    /* 出處、查證日期與「補充說明」併成同一行（原本各佔一行，64 條就是 64 行）。
       出處仍然**印在畫面上**——那條原則沒讓步，讓的只是行數。
       有 detail 的條目用原生 <details>，把 meta 放進 <summary> 裡：點整行都能展開，
       可點區域反而更大；鍵盤與可存取性照樣由瀏覽器負責。 */
    const meta = el('span', 'chronic-meta');
    /* 缺漏一律顯示「未註明」而不是留白：留白看起來像「沒有這個欄位」，
       「未註明」看起來像「這條沒人查證過」——後者才是事實。 */
    const src = el('span', 'chronic-source', item.source || '未註明');
    /* 出處在 340px 下常常長到兩三行（「藥品給付規定 第五節 5.1 使用條件(2)（114/6/1
       生效；115.07.23 版）」），一條就吃掉三行。收成一行＋刪節號，全文留在 title——
       與部位鈕縮成兩字同一個取捨：看得到、查得到，但不佔版面。 */
    src.title = '出處：' + (item.source || '未註明');
    meta.append(src, el('span', 'chronic-checked', '查 ' + (item.checked || '未註明')));
    const from = item.effectiveFrom || '';
    const to = item.effectiveTo || '';
    if (from || to) {
      const window_ = from && to ? '適用 ' + from + '～' + to
        : (from ? '適用 ' + from + ' 起' : '適用至 ' + to);
      meta.appendChild(el('span', 'chronic-window', window_));
    }

    if (item.detail) {
      const more = el('details', 'chronic-more');
      const summary = document.createElement('summary');
      summary.className = 'chronic-line';
      summary.append(el('span', 'chronic-more-toggle', '補充'), meta);
      /* 補充是整段密集敘述（平均 206 字、最長 476），不斷行的話在窄欄裡要從頭讀到尾
         才找得到自己要的那一句。與主文共用 fillSegments，讀法完全一樣。 */
      const body = el('div', 'chronic-detail');
      fillSegments(body, item.detail);
      more.append(summary, body);
      li.appendChild(more);
    } else {
      const foot = el('p', 'chronic-line');
      foot.appendChild(meta);
      li.appendChild(foot);
    }
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

  /* 把所有 section 的 items 攤平，帶上它原本的 kind，然後依 step 分組。
     沒有 step 的條目（將來新增內容時忘了標）不會消失——收到「其他」那一段，
     寧可位置不對也不要靜默不見。 */
  function chronicStepGroups(topic) {
    const all = [];
    for (const section of (topic && topic.sections) || []) {
      for (const item of section.items || []) {
        all.push(Object.assign({}, item, { kind: item.kind || section.kind }));
      }
    }
    const groups = [];
    const used = new Set();
    for (const row of CHRONIC_STEP) {
      const items = all.filter((it) => it.step === row[0]);
      items.forEach((it) => used.add(it));
      if (items.length) groups.push({ step: row[0], title: row[1], hint: row[2], items });
    }
    const rest = all.filter((it) => !used.has(it));
    if (rest.length) groups.push({ step: '', title: '其他', hint: '', items: rest });
    return groups;
  }

  function chronicStepEl(group, today) {
    const parts = root.ICDLogic.splitByEffective(group.items, today);
    if (!parts.current.length && !parts.upcoming.length) return null;
    const box = el('section', 'chronic-section');
    box.dataset.step = group.step;
    const head = el('div', 'chronic-section-head');
    head.appendChild(el('h3', 'chronic-section-title', group.title));
    if (group.hint) head.appendChild(el('span', 'chronic-step-hint', group.hint));
    const list = el('ul', 'chronic-items');
    for (const item of parts.current) list.appendChild(chronicItemEl(item, false));
    for (const item of parts.upcoming) list.appendChild(chronicItemEl(item, true));
    box.append(head, list);
    return box;
  }

  /* 官方條文 PDF 的存放資料夾——與 icd10.html 同一層。診間電腦不能上網，條文得跟著
     診間包一起寄過去；tools/pack_for_clinic.py 會把整個資料夾複製進包裡，
     build/build.py 會核對 chronic_care.json 引用的每個檔名都真的存在。 */
  const CHRONIC_DOC_DIR = '健保條文';

  /* href 一律算成絕對路徑，不留相對路徑：1c 置頂時整棵側欄被搬進 Document PiP 的小視窗，
     那個文件的 URL 是 about:blank，相對路徑會解析到 about:blank 底下，點下去必定失敗。
     基準取**主文件**的 baseURI（render-shared 跑在主視窗，document 就是主文件）。 */
  function chronicDocHref(file) {
    const rel = encodeURIComponent(CHRONIC_DOC_DIR) + '/' + encodeURIComponent(file);
    try { return new URL(rel, document.baseURI).href; } catch (err) { return rel; }
  }

  /* 主題最上方的官方條文連結。放在速判摘要之前是刻意的：這幾條速查條目本身沒有任何
     機器可驗的權威來源（見 chronic_care.json 的 _schema），能反駁它的東西就是原始條文，
     所以原始條文要是第一眼看得到的東西，不是註腳。 */
  function chronicDocsEl(topic) {
    const docs = (topic && Array.isArray(topic.docs) ? topic.docs : []).filter((d) => d && d.file);
    if (!docs.length) return null;
    const box = el('section', 'chronic-docs');
    box.appendChild(el('h3', 'chronic-docs-title', '官方條文 PDF'));
    const list = el('ul', 'chronic-doc-list');
    for (const doc of docs) {
      const li = el('li', 'chronic-doc');
      const a = el('a', 'chronic-doc-link', doc.label || doc.file);
      a.href = chronicDocHref(doc.file);
      a.target = '_blank';
      a.rel = 'noopener';
      /* 點不開時唯一的線索就是這行 title：檔案該在哪、為什麼可能不在。 */
      a.title = CHRONIC_DOC_DIR + '／' + doc.file
        + '（隨診間包一起寄送，須與 icd10.html 解壓在同一層才點得開）';
      li.appendChild(a);
      if (doc.version) li.appendChild(el('span', 'chronic-doc-version', doc.version));
      if (doc.where) li.appendChild(el('span', 'chronic-doc-where', doc.where));
      list.appendChild(li);
    }
    box.appendChild(list);
    return box;
  }

  /* 表一風險分級的階梯（只有 lipid 主題有）。使用者 2026-09-01 的原話是
     「我就不知道風險分級：極高／非常高／高／中／低 是怎麼分級的，標準又是什麼」——
     這份速查原本把判準塞在一條條目的「補充」裡（預設收合），等於預設讀者已經知道怎麼分。

     每一級把三件事並排：判準、那一級的 LDL-C 數字、能不能直接開藥。
     **數字只寫一次**：官方表裡「起始藥物治療血脂值」與「血脂目標值」是同一個數，
     分兩欄寫只會讓人以為是兩個門檻。 */
  function chronicLadder(key) {
    const topic = chronicTopicOf(key);
    const box = topic && topic.riskLadder;
    if (!box || !Array.isArray(box.levels) || !box.levels.length) return null;
    return box;
  }

  function chronicLadderEl(key) {
    const data = chronicLadder(key);
    if (!data) return null;
    const box = el('section', 'chronic-ladder');
    box.appendChild(el('h3', 'chronic-ladder-title', data.title || '風險分級'));
    if (data.lede) box.appendChild(el('p', 'chronic-ladder-lede', String(data.lede)));

    const list = el('ol', 'chronic-ladder-list');
    for (const lv of data.levels) {
      if (!lv || !lv.label) continue;
      const li = el('li', 'chronic-ladder-level');
      const head = el('p', 'chronic-ladder-head');
      head.appendChild(el('b', 'chronic-ladder-name', lv.label));
      /* 起始門檻與目標是同一個數字，所以寫「門檻＝目標」，不是兩個數。 */
      head.appendChild(el('span', 'chronic-ladder-num',
        'LDL-C 門檻＝目標 ' + lv.ldl + (lv.nonHdl ? '｜non-HDL-C ' + lv.nonHdl : '')));
      /* 徽章只放結論「今天能不能開藥」，官方原文另起一行——原本徽章寫「可並行」
         「先做 3–6 個月」，並行什麼、做什麼都沒講（2026-09-01 使用者指出）。 */
      head.appendChild(el('span', 'chronic-ladder-flag' + (lv.parallel ? ' is-parallel' : ''),
        lv.parallel ? '可當天開藥' : '不可當天開藥'));
      li.appendChild(head);
      if (lv.nonDrug) {
        const nd = el('p', 'chronic-ladder-nondrug');
        nd.appendChild(el('b', 'chronic-ladder-nondrug-label', '非藥物治療'));
        nd.appendChild(document.createTextNode('　' + lv.nonDrug
          + (lv.nonDrugPlain ? '（' + lv.nonDrugPlain + '）' : '')));
        li.appendChild(nd);
      }
      if (lv.how) {
        const howEl = el('p', 'chronic-ladder-how');
        howEl.appendChild(el('b', 'chronic-ladder-nondrug-label', '判準'));
        howEl.appendChild(document.createTextNode('　' + String(lv.how)));
        li.appendChild(howEl);
      }
      if (Array.isArray(lv.criteria) && lv.criteria.length) {
        const ul = el('ul', 'chronic-ladder-criteria');
        for (const c of lv.criteria) ul.appendChild(el('li', null, String(c)));
        li.appendChild(ul);
      }
      list.appendChild(li);
    }
    box.appendChild(list);

    if (data.note) box.appendChild(el('p', 'chronic-ladder-note', String(data.note)));

    const f = data.factors;
    if (f && Array.isArray(f.items) && f.items.length) {
      const fb = el('section', 'chronic-ladder-factors');
      if (f.title) fb.appendChild(el('h4', 'chronic-ladder-subtitle', String(f.title)));
      const ul = el('ul', 'chronic-ladder-criteria');
      for (const item of f.items) ul.appendChild(el('li', null, String(item)));
      fb.appendChild(ul);
      if (f.note) fb.appendChild(el('p', 'chronic-ladder-note', String(f.note)));
      box.appendChild(fb);
    }

    const meta = el('p', 'chronic-t2-meta');
    if (data.source) meta.appendChild(el('span', 'chronic-source', String(data.source)));
    if (data.checked) meta.appendChild(el('span', 'chronic-checked', '查 ' + data.checked));
    if (meta.childNodes.length) box.appendChild(meta);
    return box;
  }

  /* 表一點名的藥，對進台灣實際有的學名（只有 lipid 主題有）。
     使用者 2026-09-01：「我希望表一是用的藥物有哪些也寫出來（僅列台灣有的）」。
     條文的「處方規定」欄只寫類別（statin、ezetimibe、PCSK9 單株抗體、siRNA、
     ATP citrate lyase 抑制劑），不知道對應到哪些藥就等於沒寫。

     **給付狀態要跟學名並排**：表一把 siRNA 與 ATP citrate lyase 抑制劑列為未達標時
     可考慮的選項，但那是臨床路徑，健保並沒有收載——只列學名不講這件事，
     等於引導醫師去開一個病人要自費的藥。 */
  function chronicDrugs(key) {
    const topic = chronicTopicOf(key);
    const box = topic && topic.drugs;
    if (!box || !Array.isArray(box.groups) || !box.groups.length) return null;
    return box;
  }

  function chronicDrugsEl(key) {
    const data = chronicDrugs(key);
    if (!data) return null;
    const box = el('section', 'chronic-drugs');
    box.appendChild(el('h3', 'chronic-drugs-title', data.title || '用藥'));
    if (data.lede) box.appendChild(el('p', 'chronic-drugs-lede', String(data.lede)));
    const list = el('ul', 'chronic-drug-list');
    for (const g of data.groups) {
      if (!g || !g.klass) continue;
      const li = el('li', 'chronic-drug-group' + (g.covered === false ? ' is-selfpay' : ''));
      const head = el('p', 'chronic-drug-head');
      head.appendChild(el('b', 'chronic-drug-klass', g.klass));
      if (g.cover) {
        head.appendChild(el('span',
          'chronic-drug-cover' + (g.covered === false ? ' is-selfpay' : ''), String(g.cover)));
      }
      li.appendChild(head);
      if (Array.isArray(g.items) && g.items.length) {
        li.appendChild(el('p', 'chronic-drug-names', g.items.join('、')));
      }
      if (g.note) li.appendChild(el('p', 'chronic-drug-note', String(g.note)));
      list.appendChild(li);
    }
    box.appendChild(list);
    if (data.doseNote) box.appendChild(el('p', 'chronic-drug-note', String(data.doseNote)));
    if (data.note) box.appendChild(el('p', 'chronic-drug-note', String(data.note)));
    const meta = el('p', 'chronic-t2-meta');
    if (data.source) meta.appendChild(el('span', 'chronic-source', String(data.source)));
    if (data.checked) meta.appendChild(el('span', 'chronic-checked', '查 ' + data.checked));
    if (meta.childNodes.length) box.appendChild(meta);
    return box;
  }

  /* 「僅適用表二」的成分清單（只有 lipid 主題有）。條文分頁與血脂計算機共用這一份，
     不各存一份——兩份會慢慢分歧，而分歧的表現是同一件事在兩個畫面上講得不一樣。 */
  function chronicTableTwo(key) {
    const topic = chronicTopicOf(key);
    const box = topic && topic.tableTwoOnly;
    if (!box || !Array.isArray(box.ingredients) || !box.ingredients.length) return null;
    return box;
  }

  const chronicTableTwoNames = (box) =>
    box.ingredients.map((i) => (i && i.name) || '').filter(Boolean);

  /* 使用者要求把「不適用表一」的項目完整列出來（寫學名就好）。
     每一項後面帶該成分底下的代碼數，是刻意的：光看成分名會讀成「所有 atorvastatin
     都走表二」，但實際上同成分多數品項仍走表一，只有這批特定代碼例外。
     數字讓人一眼看出這是**代碼層級**的例外清單，不是成分層級。 */
  function chronicTableTwoEl(key) {
    const data = chronicTableTwo(key);
    if (!data) return null;
    const box = el('section', 'chronic-t2');
    box.appendChild(el('h3', 'chronic-t2-title', data.title || '僅適用表二的成分'));
    if (data.lede) box.appendChild(el('p', 'chronic-t2-lede', data.lede));
    const list = el('ul', 'chronic-t2-list');
    for (const item of data.ingredients) {
      if (!item || !item.name) continue;
      const li = el('li', 'chronic-t2-item');
      li.appendChild(el('span', 'chronic-t2-name', item.name));
      if (item.codeCount) {
        li.appendChild(el('span', 'chronic-t2-codes', item.codeCount + ' 項'));
      }
      list.appendChild(li);
    }
    box.appendChild(list);
    if (data.caution) box.appendChild(el('p', 'chronic-t2-caution', String(data.caution)));
    /* 與上面那份「表一用的是哪些藥」的關係。不寫，同一個學名出現在兩塊裡
       看起來就是自相矛盾（使用者 2026-09-01 問過）。 */
    if (data.crossRef) box.appendChild(el('p', 'chronic-t2-crossref', String(data.crossRef)));
    /* 為什麼會有這份清單。醫師看到「同一個學名有的走表一有的走表二」的第一個反應
       是「憑什麼」——不講，這份清單看起來就是任意的（使用者 2026-09-01 問過）。 */
    if (data.why) box.appendChild(el('p', 'chronic-t2-why', String(data.why)));
    const meta = el('p', 'chronic-t2-meta');
    if (data.source) meta.appendChild(el('span', 'chronic-source', String(data.source)));
    if (data.checked) meta.appendChild(el('span', 'chronic-checked', '查 ' + data.checked));
    if (meta.childNodes.length) box.appendChild(meta);
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
    const docs = chronicDocsEl(topic);
    if (docs) body.appendChild(docs);
    /* 速判摘要：使用者是「看到異常數值」才打開這個面板的，第一眼要能判斷
       這個數字算不算不達標／夠不夠格開藥，不必先捲過整段治療目標。 */
    if (topic && topic.headline) {
      body.appendChild(el('p', 'chronic-headline', String(topic.headline)));
    }
    /* 排在速判摘要之後、分段內容之前：它決定了底下每一條門檻該讀表一還是表二，
       等於是讀下面所有數字的前提。放進「別踩雷」那一段就太深了——真正會踩到的人
       正是還沒想到要往下捲的人。 */
    /* 順序：怎麼分級（決定要看哪一列） → 哪些代碼走表二（決定要看哪一張表）。
       兩者都是讀底下每一條門檻的前提，所以排在分段內容之前。 */
    const ladder = chronicLadderEl(key);
    if (ladder) body.appendChild(ladder);
    /* 分完級之後的下一個問題就是「那要開什麼」，所以緊接在階梯後面。 */
    const drugs = chronicDrugsEl(key);
    if (drugs) body.appendChild(drugs);
    const tableTwo = chronicTableTwoEl(key);
    if (tableTwo) body.appendChild(tableTwo);
    let sections = 0;
    for (const group of chronicStepGroups(topic)) {
      const node = chronicStepEl(group, today);
      if (!node) continue;
      body.appendChild(node);
      sections += 1;
    }
    /* 空狀態要講實話：沒有內容不是「沒有規定」，是這份速查還沒整理到。 */
    if (!sections) {
      body.appendChild(el('p', 'chronic-empty',
        '「' + label + '」的內容尚未整理完成，請直接查健保署當期公告與現行指引。'));
    }
  }

  // ---- CCr 計算機（Cockcroft-Gault） ----
  /* 為什麼三種體重要並列：這個數字是拿來調抗生素劑量的，而 Cockcroft-Gault 在體重
     極端時最不準——同一位病人用實際／理想／調整體重可以差到將近兩倍。主值只是
     「依 BMI 的一般建議」（MDCalc／Brown et al 的規則），選哪個仍然是醫師的判斷，
     所以畫面一定要標明「這個數字是用什麼體重算出來的」，而不是只丟一個數字。 */
  const CCR_BASIS_LABEL = { actual: '實際體重', ideal: '理想體重', adjusted: '調整體重' };
  const CCR_DISCLAIMER = 'Cockcroft-Gault 估計值，僅適用腎功能穩定者。'
    + '可能高估 GFR 10–20%，體重過輕或肥胖時更不準；實際劑量請依藥品仿單與臨床判斷。';

  /* 入口鈕掛在「健保規範條文」那一排（血脂計算機右邊），不在 header。原本排在 header 的
     「日期」右邊，但那是「開始看這一診」的位置；CCr 是查到腎功能才會用的偶發工具，
     與血脂試算同性質，兩個計算機放在一起使用者只要記一個位置。

     **不要宣稱這樣 header 就變矮了**：實測 .dock-tools 需要的寬度 249.3→218.1，
     可用只有 163，搬走之後仍然折成兩列，1c 的 .dock-head 一樣是 92px。
     真正省到的只有 231–262px 這一段寬度（見 docs/dense-ui-principle.md）。 */
  function ccrButtonEl(compact) {
    const b = el('button', 'btn btn-secondary ccr-btn' + (compact ? ' seg-btn--sm' : ''), 'CCr');
    b.type = 'button';
    b.id = 'ccr-btn';
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', 'ccr-panel');
    b.title = '肌酸酐廓清率（Cockcroft-Gault）：抗生素劑量調整用';
    return b;
  }

  function ccrFieldEl(id, label, unit, opts) {
    const wrap = el('label', 'ccr-field');
    wrap.append(el('span', 'ccr-label', label));
    const input = document.createElement('input');
    input.id = id;
    input.className = 'input ccr-input';
    input.type = 'number';
    input.inputMode = 'decimal';
    input.autocomplete = 'off';
    input.step = (opts && opts.step) || '1';
    if (opts && opts.placeholder) input.placeholder = opts.placeholder;
    wrap.append(input, el('span', 'ccr-unit', unit));
    return wrap;
  }

  function ccrOverlayEl() {
    const overlay = el('div', 'ccr-overlay');
    overlay.id = 'ccr-overlay';
    overlay.hidden = true;
    const panel = el('div', 'ccr-panel');
    panel.id = 'ccr-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'ccr-title');

    const head = el('div', 'ccr-head');
    const title = el('h2', 'ccr-title', 'CCr　肌酸酐廓清率');
    title.id = 'ccr-title';
    const close = el('button', 'ccr-close', '關閉');
    close.type = 'button';
    close.id = 'ccr-close';
    close.title = '關閉（Esc，或點面板以外任一處）';
    head.append(title, close);

    const form = el('div', 'ccr-form');
    const sexRow = el('div', 'seg-row ccr-sex');
    sexRow.id = 'ccr-sex';
    sexRow.setAttribute('role', 'group');
    sexRow.setAttribute('aria-label', '性別');
    for (const pair of [['male', '男'], ['female', '女']]) {
      const b = el('button', 'seg-btn ccr-sex-btn', pair[1]);
      b.type = 'button';
      b.dataset.ccrSex = pair[0];
      b.setAttribute('aria-pressed', pair[0] === 'male' ? 'true' : 'false');
      if (pair[0] === 'male') b.classList.add('is-on');
      sexRow.appendChild(b);
    }
    form.append(sexRow,
      ccrFieldEl('ccr-age', '年齡', '歲'),
      ccrFieldEl('ccr-weight', '體重', 'kg', { step: '0.1' }),
      ccrFieldEl('ccr-height', '身高', 'cm', { placeholder: '選填' }),
      ccrFieldEl('ccr-cr', 'Cr', 'mg/dL', { step: '0.01' }));

    const result = el('div', 'ccr-result');
    result.id = 'ccr-result';
    result.setAttribute('aria-live', 'polite');

    const actions = el('div', 'ccr-actions');
    const copy = el('button', 'btn ccr-copy', '複製結果');
    copy.type = 'button';
    copy.id = 'ccr-copy';
    copy.disabled = true;
    const reset = el('button', 'btn btn-secondary ccr-reset', '清除');
    reset.type = 'button';
    reset.id = 'ccr-reset';
    actions.append(copy, reset);

    panel.append(head, form, result, actions, el('p', 'ccr-disclaimer', CCR_DISCLAIMER));
    overlay.appendChild(panel);
    return overlay;
  }

  /* 從面板讀值。刻意不經過 store：這些是「這一位病人」的數字，每敲一鍵就寫進全域狀態
     會連帶重繪整個版面，也讓它多一條被持久化的路。 */
  function ccrInputs(root2) {
    const val = (id) => {
      const node = root2.querySelector('#' + id);
      return node ? String(node.value).trim() : '';
    };
    const on = root2.querySelector('#ccr-sex .ccr-sex-btn[aria-pressed="true"]');
    return {
      sex: on ? on.dataset.ccrSex : 'male',
      age: val('ccr-age'),
      weightKg: val('ccr-weight'),
      heightCm: val('ccr-height'),
      creatinine: val('ccr-cr'),
    };
  }

  function ccrResultText(r) {
    if (!r || !r.ok) return '';
    return 'CCr ' + r.crcl + ' mL/min（' + CCR_BASIS_LABEL[r.basis] + ' ' + r.weightUsed + ' kg）';
  }

  function ccrAltRow(key, kg, value, activeKey) {
    const line = el('div', 'ccr-alt-row' + (key === activeKey ? ' is-on' : ''));
    line.append(el('span', 'ccr-alt-name', CCR_BASIS_LABEL[key]),
                el('span', 'ccr-alt-kg', kg + ' kg'),
                el('span', 'ccr-alt-val', String(value)));
    return line;
  }

  function renderCcrResult(root2, ctx) {
    const box = root2.querySelector('#ccr-result');
    const copy = root2.querySelector('#ccr-copy');
    if (!box) return null;
    clear(box);
    const input = ccrInputs(root2);
    const r = ctx.logic.creatinineClearance(input);
    if (copy) copy.disabled = !(r && r.ok);
    if (!r || !r.ok) {
      box.appendChild(el('p', 'ccr-hint', '填年齡、體重、Cr 就會算；身高選填。'));
      return r;
    }

    const main = el('div', 'ccr-main');
    main.append(el('strong', 'ccr-value', String(r.crcl)), el('span', 'ccr-value-unit', 'mL/min'));
    box.appendChild(main);

    box.appendChild(el('p', 'ccr-basis',
      '以' + CCR_BASIS_LABEL[r.basis] + ' ' + r.weightUsed + ' kg 計算'
      + (r.bmi === null ? '' : '（BMI ' + r.bmi + '）')));

    if (r.range !== null) {
      const lo = Math.min(r.crcl, r.range);
      const hi = Math.max(r.crcl, r.range);
      box.appendChild(el('p', 'ccr-range',
        '範圍 ' + lo + '–' + hi + '（另一端＝' + CCR_BASIS_LABEL[r.rangeBasis] + '）'));
    }

    if (r.hasHeight && r.ibw !== null) {
      const actualKg = Math.round(Number(input.weightKg) * 10) / 10;
      const table = el('div', 'ccr-alt');
      table.append(ccrAltRow('actual', actualKg, r.actual, r.basis),
                   ccrAltRow('ideal', r.ibw, r.ideal, r.basis),
                   ccrAltRow('adjusted', r.adjbw, r.adjusted, r.basis));
      box.appendChild(table);
    } else {
      box.appendChild(el('p', 'ccr-hint',
        '填身高就會依 BMI 自動選用理想／調整體重——體重極端時那才是建議的算法。'));
    }
    return r;
  }

  // ---- 血脂給付試算 ----
  /* 為什麼值得做一個計算機：LIPID 的判定有三個機械步驟特別容易錯——用錯表、
     極高／非常高的「組合」條件接錯、新舊兩表的風險因子定義混用。這三件事都不需要
     臨床判斷，只需要不出錯地照條文走，正是機器該接手的部分。

     浮層骨架刻意與 .ccr-* 同型（同樣的遮罩、關閉出口、複製與清除），使用者只要學一次。
     差別在這個是**多選輸入**：勾選項目直接用原生 checkbox 而不是 aria-pressed 的切換鈕，
     因為它們是「可複選的事實陳述」不是「模式切換」，原生元件的讀屏語意與鍵盤行為都對。 */
  const LIPID_DISCLAIMER = '依藥品給付規定 第二節 2.6.1 表一與表二（115.8.21 版）試算，'
    + '只計算條文門檻，不含臨床判斷。實際給付以審查為準；'
    + '適用表一或表二由藥品健保代碼決定，開藥前請核對當期公告。';

  /* 勾選項目分三組，順序照使用者查閱時的思路：先問「有沒有心血管病史」，
     再問「有沒有那幾個共病」，最後才數風險因子。
     每一項的字面盡量貼原文——這些字之後會被拿去跟條文對照。 */
  const LIPID_HISTORY = [
    ['cad', '冠心病 CAD'],
    ['miWithin1y', '一年內心肌梗塞'],
    ['mi2plus', '≧ 2 次心肌梗塞'],
    ['multivessel', '多支冠狀動脈阻塞'],
    ['pad', '周邊動脈疾病'],
    ['carotid', '頸動脈狹窄'],
    ['acsHistory', '急性冠心症病史'],
    ['revasc', '血管再通術 PCI／CABG'],
    ['strokeTia', '缺血性中風／TIA'],
    ['padSymptomatic', '症狀性 PAD'],
    ['imaging50', '影像 ≧ 50% 狹窄'],
  ];
  const LIPID_COMORBID = [
    ['dm', '糖尿病'],
    ['ckd', '未透析 CKD'],
    ['cac400', '鈣化分數 ≧ 400'],
  ];
  const LIPID_FACTORS = [
    ['htn', '高血壓'],
    ['smoking', '抽菸'],
    ['familyHistory', '早發性冠心病家族史'],
    ['menopause', '已停經（僅表二計入）'],
  ];
  /* 代謝症候群拆成細項（使用者 2026-09-01）：它是 6 項風險因子裡唯一要「數」的，
     一顆勾選鈕等於把最容易錯的一步推回給使用者。標籤帶上官方的數字，
     醫師對著上面剛填的 TG／HDL-C 就能勾，不必另外查條文。 */
  const LIPID_METABOLIC = [
    ['msWaist', '腹部肥胖 男 ≧ 90／女 ≧ 80 cm'],
    ['msBp', '血壓 ≧ 130/85 或使用降壓藥'],
    ['msGlucose', '空腹血糖 ≧ 100 或使用糖尿病藥'],
    ['msTg', '空腹 TG ≧ 150 或使用降 TG 藥'],
    ['msHdl', 'HDL-C 男 < 40／女 < 50'],
  ];

  function lipidCheckEl(key, label) {
    const wrap = el('label', 'lipid-check');
    wrap.dataset.lipidRow = key;
    if (key === 'menopause') wrap.hidden = true;      // 預設性別是男，先藏起來
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.id = 'lipid-' + key;
    box.dataset.lipidKey = key;
    wrap.append(box, el('span', null, label));
    return wrap;
  }

  function lipidGroupEl(title, rows) {
    const box = el('fieldset', 'lipid-group');
    box.appendChild(el('legend', 'lipid-legend', title));
    const grid = el('div', 'lipid-checks');
    for (const r of rows) grid.appendChild(lipidCheckEl(r[0], r[1]));
    box.appendChild(grid);
    return box;
  }

  function lipidFieldEl(id, label, opts) {
    const wrap = el('label', 'lipid-field');
    wrap.append(el('span', 'lipid-label', label));
    const input = document.createElement('input');
    input.id = id;
    input.className = 'input lipid-input';
    input.type = 'number';
    input.inputMode = 'decimal';
    input.autocomplete = 'off';
    input.step = (opts && opts.step) || '1';
    if (opts && opts.placeholder) input.placeholder = opts.placeholder;
    wrap.appendChild(input);
    return wrap;
  }

  function lipidOverlayEl() {
    const overlay = el('div', 'lipid-overlay');
    overlay.id = 'lipid-overlay';
    overlay.hidden = true;
    const panel = el('div', 'lipid-panel');
    panel.id = 'lipid-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'lipid-title');

    const head = el('div', 'lipid-head');
    const title = el('h2', 'lipid-title', '血脂給付試算');
    title.id = 'lipid-title';
    const close = el('button', 'lipid-close', '關閉');
    close.type = 'button';
    close.id = 'lipid-close';
    close.title = '關閉（Esc，或點面板以外任一處）';
    head.append(title, close);

    const form = el('div', 'lipid-form');
    const sexRow = el('div', 'seg-row lipid-sex');
    sexRow.id = 'lipid-sex';
    sexRow.setAttribute('role', 'group');
    sexRow.setAttribute('aria-label', '性別');
    for (const pair of [['male', '男'], ['female', '女']]) {
      const b = el('button', 'seg-btn lipid-sex-btn', pair[1]);
      b.type = 'button';
      b.dataset.lipidSex = pair[0];
      b.setAttribute('aria-pressed', pair[0] === 'male' ? 'true' : 'false');
      if (pair[0] === 'male') b.classList.add('is-on');
      sexRow.appendChild(b);
    }
    const nums = el('div', 'lipid-nums');
    nums.append(
      lipidFieldEl('lipid-age', '年齡'),
      lipidFieldEl('lipid-ldl', 'LDL-C'),
      lipidFieldEl('lipid-tc', 'TC', { placeholder: '選填' }),
      lipidFieldEl('lipid-hdl', 'HDL-C', { placeholder: '選填' }),
      lipidFieldEl('lipid-tg', 'TG', { placeholder: '選填' }));
    form.append(sexRow, nums,
      lipidGroupEl('心血管病史', LIPID_HISTORY),
      lipidGroupEl('共病', LIPID_COMORBID),
      lipidGroupEl('風險因子', LIPID_FACTORS),
      lipidGroupEl('代謝症候群（下列 ≧ 3 項才算 1 個風險因子）', LIPID_METABOLIC));

    const result = el('div', 'lipid-result');
    result.id = 'lipid-result';
    result.setAttribute('aria-live', 'polite');

    const actions = el('div', 'lipid-actions');
    const copy = el('button', 'btn lipid-copy', '複製結果');
    copy.type = 'button';
    copy.id = 'lipid-copy';
    copy.disabled = true;
    const reset = el('button', 'btn btn-secondary lipid-reset', '清除');
    reset.type = 'button';
    reset.id = 'lipid-reset';
    actions.append(copy, reset);

    panel.append(head, form, result, actions, el('p', 'lipid-disclaimer', LIPID_DISCLAIMER));
    overlay.appendChild(panel);
    return overlay;
  }

  /* 讀面板的值。與 ccrInputs 同一個理由刻意不經過 store：這些是「這一位病人」的數字。 */
  function lipidInputs(root2) {
    const val = (id) => {
      const node = root2.querySelector('#' + id);
      return node ? String(node.value).trim() : '';
    };
    const on = root2.querySelector('#lipid-sex .lipid-sex-btn[aria-pressed="true"]');
    const out = {
      sex: on ? on.dataset.lipidSex : 'male',
      age: val('lipid-age'),
      ldl: val('lipid-ldl'),
      tc: val('lipid-tc'),
      hdl: val('lipid-hdl'),
      tg: val('lipid-tg'),
    };
    for (const box of root2.querySelectorAll('[data-lipid-key]')) {
      out[box.dataset.lipidKey] = box.checked === true;
    }
    return out;
  }

  const LIPID_VERDICT = { true: '符合起始門檻', false: '未達起始門檻', null: '待輸入 LDL-C' };

  /* 一張表的結果區塊。刻意把「判定」「數值比較」「理由」分成三行：
     醫師要能一眼看出這個結論是怎麼來的，而不是接受一個黑箱。 */
  /* 「可否並行」兩張表共用同一句話：表一講的是生活型態改變，表二條文寫「非藥物治療」，
     指的是同一件事，用兩種說法只會讓人以為是兩種要求。 */
  /* Fibrate 的並行說明。兩個地方共用（結果區與病歷文字），措辭只能有一份。
       TG ≧ 500 那一列是**不論共病**的，所以它的理由不是共病而是那一列本身
       （2026-08-27 使用者指出，附官方表影像）；其餘走第一列的才寫命中哪一個共病。 */
  function lipidFibrateParallelText(f) {
    if (!f.parallel) return '無心血管疾病者，給藥前應有 3–6 個月非藥物治療';
    if (f.route === 'TG ≧ 500') return '可與藥物治療並行（TG ≧ 500 該列不論有無心血管疾病）';
    const why = Array.isArray(f.parallelWhy) ? f.parallelWhy : [];
    /* 「及」不是「或」：兩個都有就寫兩個，病歷才看得出這位病人的實際狀況。 */
    return '可與藥物治療並行（' + (why.length ? why.join('及') : '心血管疾病或糖尿病') + '）';
  }

  const lipidParallelText = (parallel) => (parallel
    ? '可與藥物治療並行（生活型態改變同時進行，當天就能開藥）'
    : '給藥前應有 3–6 個月生活型態改變／非藥物治療（做滿才給付）');

  /* 區塊內的順序照臨床思考流程走（使用者 2026-09-01 指定）：
       這位病人是哪一級、憑什麼 → 能不能直接開藥 → 門檻與目標 → 結論
     原本是「分級 → 門檻 → 結論 → 依據」：依據排在結論之後，等於要求醫師先接受一個
     判定、再回頭找理由；而「能不能直接開藥」原本只有 fibrate 那一塊講。 */
  function lipidTableBlock(title, note, info, ldl, tc) {
    const box = el('section', 'lipid-block');
    if (info.meets === true) box.classList.add('is-ok');
    else if (info.meets === false) box.classList.add('is-no');
    const head = el('div', 'lipid-block-head');
    head.append(el('b', 'lipid-block-title', title));
    if (note) head.appendChild(el('span', 'lipid-block-note', note));
    box.appendChild(head);

    // 1) 哪一級，憑什麼——依據跟著分級走，不再落到結論後面
    const level = el('p', 'lipid-level', info.label);
    if (info.why && info.why.length) {
      level.appendChild(el('span', 'lipid-why', '（依據：' + info.why.join('、') + '）'));
    }
    box.appendChild(level);

    // 2) 能不能直接開藥
    box.appendChild(el('p', 'lipid-parallel', lipidParallelText(info.parallel)));

    // 3) 門檻與目標。non-HDL-C 存在時 LDL-C 才標「主要」——沒有次要目標的表二
    //    寫「主要目標」會讓人去找一個不存在的次要目標。
    const thr = info.threshold !== undefined ? info.threshold : info.ldl;
    const parts = ['起始門檻 LDL-C ≧ ' + thr + (info.tc ? ' 或 TC ≧ ' + info.tc : '')];
    if (info.target) {
      parts.push((info.nonHdlTarget ? '主要目標 ' : '目標 ') + 'LDL-C < ' + info.target
        + (info.targetTc ? ' 或 TC < ' + info.targetTc : ''));
    }
    if (info.nonHdlTarget) parts.push('次要目標 non-HDL-C < ' + info.nonHdlTarget);
    box.appendChild(el('p', 'lipid-threshold', parts.join('｜')));

    // 4) 結論
    const cmp = [];
    if (ldl !== null) cmp.push('LDL-C ' + ldl);
    if (tc !== null) cmp.push('TC ' + tc);
    const verdict = el('p', 'lipid-verdict',
      LIPID_VERDICT[String(info.meets)] + (cmp.length ? '（' + cmp.join('、') + '）' : ''));
    box.appendChild(verdict);

    for (const p of info.proof || []) box.appendChild(el('p', 'lipid-proof', '舉證：' + p));
    return box;
  }

  /* 表一結果下方的「適用藥物」。使用者要「學名就好」，所以把資料裡的括號補充
     （劑量錨點、商品名）在這裡剝掉——條文分頁保留完整版，那裡有空間。
     剝的是**顯示**不是資料：同一份 drugs 兩個畫面共用，剝在渲染層才不會分歧。 */
  const lipidGenericName = (name) => String(name).replace(/（[^）]*）\s*$/, '').trim();

  /* 給付狀態一定要跟學名並排：表一把 siRNA 與 ATP citrate lyase 抑制劑列為
     未達標時可考慮的選項，但健保沒收載——只列學名不講這件事，
     等於引導醫師去開一個病人要自費的藥。 */
  function lipidDrugsEl() {
    const data = chronicDrugs('lipid');
    if (!data) return null;
    const box = el('section', 'lipid-drugs');
    box.appendChild(el('b', 'lipid-drugs-title', '適用藥物（台灣有的學名）'));
    const list = el('ul', 'lipid-drug-list');
    for (const g of data.groups) {
      if (!g || !g.klass || !Array.isArray(g.items) || !g.items.length) continue;
      const li = el('li', 'lipid-drug-group' + (g.covered === false ? ' is-selfpay' : ''));
      li.appendChild(el('b', 'lipid-drug-klass', g.klass));
      if (g.cover) {
        li.appendChild(el('span',
          'lipid-drug-cover' + (g.covered === false ? ' is-selfpay' : ''), String(g.cover)));
      }
      li.appendChild(el('span', 'lipid-drug-names',
        g.items.map(lipidGenericName).join('、')));
      list.appendChild(li);
    }
    box.appendChild(list);
    return box;
  }

  function renderLipidResult(root2, ctx) {
    const box = root2.querySelector('#lipid-result');
    if (!box) return;
    clear(box);
    const input = lipidInputs(root2);
    const r = ctx.logic.lipidCoverage(input);
    const copy = root2.querySelector('#lipid-copy');

    const anyInput = r.ldl !== null || r.tc !== null || (r.fibrate && r.fibrate.ok);
    if (copy) copy.disabled = !anyInput;
    if (!anyInput) {
      box.appendChild(el('p', 'lipid-hint', '輸入 LDL-C（或 TC／TG）並勾選病史後，這裡會列出表一的判定，以及表二品項的例外門檻。'));
      return;
    }

    const oneBlock = lipidTableBlock(
      '表一（ASCVD 風險分級）', '主表，多數品項適用', r.one, r.ldl, null);
    /* 適用藥物掛在表一區塊裡面（使用者 2026-09-01 要求「結果下方」）：
       表一的「處方規定」欄只寫類別（statin、ezetimibe、PCSK9…），
       不知道對應到哪些藥就等於沒寫。 */
    const drugs = lipidDrugsEl();
    if (drugs) oneBlock.appendChild(drugs);
    box.appendChild(oneBlock);
    /* 表二退到次要：它只管公告明列「不適用表一」的那批代碼，
       但那批代碼含 atorvastatin、rosuvastatin，常到不能不算，所以是降級不是移除。 */
    const t2 = chronicTableTwo('lipid');
    const twoBlock = lipidTableBlock(
      '表二（例外）',
      t2 ? ('限「不適用表一」的 ' + t2.codeCount + ' 個健保代碼')
         : '限公告明列「不適用表一」之健保代碼',
      r.two, r.ldl, r.tc);
    twoBlock.classList.add('is-secondary');
    /* 使用者要求計算機這邊也把成分完整列出來：判定寫著「符合表二」時，
       下一個問題必然是「那我開的這個算不算表二」——不列出來就得跳去條文分頁再找一次。
       只列學名並帶代碼數，理由同 chronicTableTwoEl 的註解。 */
    if (t2) {
      const names = el('p', 'lipid-t2-names');
      names.appendChild(el('b', 'lipid-t2-lead', '這批成分：'));
      names.appendChild(document.createTextNode(
        t2.ingredients.map((i) => i.name + '（' + i.codeCount + '）').join('、')));
      twoBlock.appendChild(names);
      twoBlock.appendChild(el('p', 'lipid-t2-caution',
        '同成分多數品項仍走表一，依健保代碼認定。'));
    }
    box.appendChild(twoBlock);

    /* 兩張表結論不同時要明講。這正是這個計算機最有價值的一刻——同一位病人，
       開 A 廠牌符合、開 B 廠牌不符合，差別只在健保代碼走哪一張表。 */
    if (r.one.meets !== null && r.two.meets !== null && r.one.meets !== r.two.meets) {
      box.appendChild(el('p', 'lipid-split',
        '兩張表結論不同：符合與否取決於你要開的品項走哪一張表，開藥前務必依健保代碼核對當期公告。'));
    }

    box.appendChild(el('p', 'lipid-rf',
      '表一風險因子 ' + r.riskFactorsNew.length + ' 項'
      + (r.riskFactorsNew.length ? '（' + r.riskFactorsNew.join('、') + '）' : '')
      + '｜表二危險因子 ' + r.two.riskFactors.length + ' 項'
      + (r.two.riskFactors.length ? '（' + r.two.riskFactors.join('、') + '）' : '')));

    const f = r.fibrate;
    if (f && f.ok) {
      const fb = el('section', 'lipid-block' + (f.meets ? ' is-ok' : ' is-no'));
      fb.appendChild(el('div', 'lipid-block-head')).appendChild(el('b', 'lipid-block-title', 'Fibrate'));
      // 1) 走哪一列，憑什麼（fibrate 的「級」就是官方表的那三列）
      const fLevel = el('p', 'lipid-level', f.route);
      if (f.why && f.why.length) {
        fLevel.appendChild(el('span', 'lipid-why', '（依據：' + f.why.join('、') + '）'));
      }
      fb.appendChild(fLevel);
      /* 2) 能不能直接開藥。TG ≧ 500 那一列是**不論共病**的，寫成通則會讓人以為
         無心血管疾病就一定要先做 3–6 個月（2026-08-27 使用者指出，附官方表影像）。 */
      fb.appendChild(el('p', 'lipid-parallel', lipidFibrateParallelText(f)));
      // 3) 目標　4) 結論
      fb.appendChild(el('p', 'lipid-threshold', '目標 TG < ' + f.target));
      fb.appendChild(el('p', 'lipid-verdict', f.meets ? '符合起始門檻' : '未達起始門檻'));
      for (const n of f.needs || []) fb.appendChild(el('p', 'lipid-proof', '還缺：' + n));
      box.appendChild(fb);
    }
  }

  /* 病歷文字。順序與畫面同一套思考流程（使用者 2026-09-01 指定）：
       依哪一張表 → 哪一級、憑什麼 → 能不能直接開藥 → 門檻與本例數值 → 目標 → 註記

     用字精簡到帶標籤的短行，不再是兩段連續敘述——審查醫師要找的是那幾個數字，
     不是讀一段文章。但**條文全名一定保留**：看病歷的人不知道有這個工具，
     「表一」單獨出現沒有意義（2026-08-26 使用者原話）。

     使用者的三次要求都釘在這段：
       (08-26)「要寫出符合哪些條文（看病歷的人並不知道我有這個計算器）」
       (08-27)「只要寫符合的那一條條文就好」——不達標的那張表不寫進病歷
       (09-01)「符合思考流程順序並精簡用字」
     唯一寫「不符合」的時機仍然是兩張表結論不同：開錯健保代碼就會被核刪。 */
  const LIPID_TABLE_ONE_NAME = '全民健康保險降膽固醇藥物給付規定表一';
  const LIPID_TABLE_TWO_NAME = '全民健康保險降膽固醇藥物給付規定表二';
  const LIPID_TG_TABLE_NAME = '全民健康保險降三酸甘油酯藥物給付規定表';
  const LIPID_SOURCE_NOTE = '（依藥品給付規定第二節 2.6.1，115.8.21 版）';
  const LIPID_TWO_SCOPE = '（限公告明列「不適用表一」之健保代碼）';

  /* 標籤一律兩個全形字，貼進病歷後每一行的縮排才對得齊。 */
  const lipidRow = (label, body) => '　' + label + '　' + body;

  function lipidProfileLine(r, input) {
    const bits = [];
    const age = Number(input.age);
    if (Number.isFinite(age) && age > 0) {
      bits.push(age + ' 歲' + (input.sex === 'female' ? '女性' : '男性'));
    }
    const labs = [];
    if (r.ldl !== null) labs.push('LDL-C ' + r.ldl);
    if (r.tc !== null) labs.push('TC ' + r.tc);
    const hdl = Number(input.hdl);
    if (Number.isFinite(hdl) && hdl > 0) labs.push('HDL-C ' + hdl);
    const tg = Number(input.tg);
    if (Number.isFinite(tg) && tg > 0) labs.push('TG ' + tg);
    if (labs.length) bits.push(labs.join('、') + ' mg/dL');
    return bits.join('，');
  }

  /* 一張降膽固醇表的病歷段落。表一與表二共用——兩者的欄位形狀相同，
     差別只在表二多了 TC 門檻與 TC 目標、少了 non-HDL-C。 */
  function lipidChartRows(name, info, r, scope) {
    const rows = ['降膽固醇藥物：依「' + name + '」' + (scope || '')];
    rows.push(lipidRow('分級', info.label
      + (info.why && info.why.length ? '（' + info.why.join('、') + '）' : '')));
    rows.push(lipidRow('處方', lipidParallelText(info.parallel)));
    const gate = 'LDL-C ≧ ' + info.threshold + (info.tc ? ' 或 TC ≧ ' + info.tc : '');
    /* 只有一個數值時不重複標名稱（門檻那半句已經寫了 LDL-C）；
       兩個數值並列時才標，否則「本例 95、180」看不出哪個是哪個。 */
    const got = [];
    if (r.ldl !== null) got.push({ name: 'LDL-C', value: r.ldl });
    if (info.tc && r.tc !== null) got.push({ name: 'TC', value: r.tc });
    const shown = got.length === 1
      ? String(got[0].value)
      : got.map((g) => g.name + ' ' + g.value).join('、');
    rows.push(lipidRow('門檻', gate
      + (got.length ? ' → 本例 ' + shown + ' mg/dL' : '')
      + '，' + (info.meets === true ? '已達' : '未達')));
    if (info.target) {
      rows.push(lipidRow('目標', 'LDL-C < ' + info.target
        + (info.targetTc ? ' 或 TC < ' + info.targetTc : '')
        + (info.nonHdlTarget ? '；次要 non-HDL-C < ' + info.nonHdlTarget : '')));
    }
    for (const p of info.proof || []) rows.push(lipidRow('檢附', p));
    return rows;
  }

  function lipidResultText(r, input) {
    if (!r || !r.ok) return '';
    const c = input || {};
    if (r.ldl === null && r.tc === null && !(r.fibrate && r.fibrate.ok)) return '';

    const profile = lipidProfileLine(r, c);
    const out = ['【降血脂給付依據】' + profile];
    const one = r.one;
    const two = r.two;

    /* 兩張表都寫（使用者 2026-09-01：「右鍵輸出裡我希望也要有表二的判讀結果」）。

       這推翻了 08-27 的「只寫符合的那一條」——當時的理由是「一堆未達只會給審查醫師
       更多可挑的地方」。改的理由更強：**同一位病人在兩張表可能結論不同**，而走哪一張
       只看你開的品項健保代碼；病歷只寫一張，等於把「換個代碼就不符合」這件事藏起來，
       而那正是會被核刪的地方。表一先寫（主表），表二接著寫並標明它的適用範圍。 */
    if (r.ldl !== null || r.tc !== null) {
      out.push('');
      for (const line of lipidChartRows(LIPID_TABLE_ONE_NAME, one, r)) out.push(line);
      out.push('');
      for (const line of lipidChartRows(LIPID_TABLE_TWO_NAME, two, r, LIPID_TWO_SCOPE)) {
        out.push(line);
      }
      /* 兩張表結論不同時再點一次名：上面兩段各自有已達／未達，但「所以該開哪一種」
         要講出來——那正是這段文字要防的核刪。 */
      if (one.meets !== null && two.meets !== null && one.meets !== two.meets) {
        const okName = one.meets ? LIPID_TABLE_ONE_NAME : LIPID_TABLE_TWO_NAME;
        const noName = one.meets ? LIPID_TABLE_TWO_NAME : LIPID_TABLE_ONE_NAME;
        out.push(lipidRow('註記', '兩表結論不同：本例符合「' + okName + '」、'
          + '不符合「' + noName + '」，請依所開品項之健保代碼適用之表別認定'));
      }
    }

    const f = r.fibrate;
    if (f && f.ok && f.meets) {
      out.push('');
      out.push('降三酸甘油酯藥物：依「' + LIPID_TG_TABLE_NAME + '」');
      out.push(lipidRow('適用', f.route + ' 該列'
        + (f.why && f.why.length ? '（本例 ' + f.why.join('、') + '）' : '') + '，已達'));
      out.push(lipidRow('處方', lipidFibrateParallelText(f)));
      out.push(lipidRow('目標', 'TG < ' + f.target));
    }

    out.push('');
    out.push(LIPID_SOURCE_NOTE);
    return out.join('\n');
  }

  /* 血脂給付試算的入口鈕。排在「健保規範條文」右邊、「CCr」左邊——兩個計算機都是
     「輸入數值換一個判斷」的工具，放在一起使用者只要記一個位置。
     標籤寫全名「血脂計算機」：與同排的「健保規範條文」只差一個字時（舊標籤是「血脂」），
     很容易被當成「血脂的條文」而不是計算機。1c 窄欄用 seg-btn--sm 與鄰居同尺寸。 */
  function lipidButtonEl(compact) {
    const b = el('button', 'btn btn-secondary lipid-btn' + (compact ? ' seg-btn--sm' : ''), '血脂計算機');
    b.type = 'button';
    b.id = 'lipid-btn';
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', 'lipid-panel');
    b.title = '血脂給付試算：依表一／表二算起始門檻與風險分級';
    return b;
  }

  /* 「已停經」只在女性時有意義（表二的危險因子是「女性 ≧ 55 歲**或停經者**」）。
     男性看到它只會困惑，所以直接藏起來——但藏的同時要清掉勾選，
     否則會留下「畫面上看不到、計算卻仍生效」的鬼影。 */
  function syncLipidSexRows(root2) {
    const on = root2.querySelector('#lipid-sex .lipid-sex-btn[aria-pressed="true"]');
    const female = !!on && on.dataset.lipidSex === 'female';
    const row = root2.querySelector('[data-lipid-row="menopause"]');
    if (!row) return;
    row.hidden = !female;
    if (!female) {
      const box = row.querySelector('input');
      if (box) box.checked = false;
    }
  }

  function syncLipid(root2, ctx) {
    const open = !!ctx.store.getState().lipidOpen;
    const overlay = root2.querySelector('#lipid-overlay');
    const btn = root2.querySelector('#lipid-btn');
    if (overlay) overlay.hidden = !open;
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { syncLipidSexRows(root2); renderLipidResult(root2, ctx); }
  }

  function syncCcr(root2, ctx) {
    const open = !!ctx.store.getState().ccrOpen;
    const overlay = root2.querySelector('#ccr-overlay');
    const btn = root2.querySelector('#ccr-btn');
    if (overlay) overlay.hidden = !open;
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) renderCcrResult(root2, ctx);
  }

  root.ICDRender = {
    icon, el, blueprint, clear, regionHeading, srHeading, markRegionSelected, regionGroupEl,
    regionShort, dateBtnEl,
    chipEl, chipWith, chipsFromPairs, emptyText,
    renderResults, relatedGroups, renderRelated,
    cartItemEl, renderCart, syncClearBtn, hisText, renderHis, renderShelf,
    settingsPopoverEl, syncSettings, dbNoteText, layoutNoteText, effectiveLayout, setPressed,
    layoutToggleEl,
    modeSwitchEl, syncModeSwitch,
    chronicSwitchEl, chronicTabsEl, syncChronicSwitch, chronicOverlayEl, renderChronic,
    ccrButtonEl, ccrOverlayEl, renderCcrResult, syncCcr, ccrResultText, ccrInputs,
    lipidButtonEl, lipidOverlayEl, renderLipidResult, syncLipid, lipidResultText, lipidInputs,
    syncLipidSexRows,
    chronicToday, chronicTopics, chronicDocsEl, chronicDocHref,
    chronicTableTwo, chronicTableTwoEl, chronicTableTwoNames,
    chronicLadder, chronicLadderEl, chronicDrugs, chronicDrugsEl,
    FORMAT_LABEL, MODE_LABEL, MODE_SHORT, PANELS_TITLE, MODE_HINT, LAYOUT_LABEL, LAYOUT_MIN_WIDTH,
    CHRONIC_KIND, CCR_DISCLAIMER, CCR_BASIS_LABEL, LIPID_DISCLAIMER, CHRONIC_DOC_DIR,
  };
})(typeof self !== 'undefined' ? self : this);
