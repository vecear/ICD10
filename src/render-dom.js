/* 零業務邏輯的 DOM 建構工具：圖示、element 工廠、chip、部位標題與短名。
   掛 window.ICDRender——六個 render-*.js 共用同一個物件，本檔是最先載入的那個，
   由它建立，其餘五個用 Object.assign 疊上去。

   三套版面共用的渲染規則（六個檔全部適用）：
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
  /* 「感染」給常見感染那一格，不給長期追蹤（UX 稽核 U5）：醫師臨時要編一個感染碼時
     看的就是「感染」二字，而「感染科追蹤」是 HIV／結核／OPAT 的長期追蹤，「追蹤」才是
     它的身分。原本的對應剛好顛倒，是這份清單裡唯一會讓人**選到錯的碼**的問題，
     而且手機是觸控、title 永遠不會浮出來，等於無從辨識。全名一律留在 title。 */
  const REGION_SHORT = {
    '全身／感染': '感染', 感染科追蹤: '追蹤',
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

  Object.assign(root.ICDRender = root.ICDRender || {}, {
    icon, el, blueprint, clear, regionHeading, srHeading, markRegionSelected, regionGroupEl,
    regionShort, isAdjunctCode,
    chipEl, chipWith, chipsFromPairs,
  });
})(typeof self !== 'undefined' ? self : this);
