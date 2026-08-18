/* 狀態層：純資料、零 DOM。瀏覽器掛 window.ICDState；node 供測試 require。
   三套版面（桌機工作台／側掛窄欄／手機）共用同一份狀態：渲染層只做「讀狀態、畫畫面、送動作」，
   所有不變量（切模式清空相關碼、清單去重、主診斷在 index 0…）都必須寫在這裡，不得散落在渲染層。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ICDState = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_PREFIX = 'icd10.';
  const RECENT_LIMIT = 8;                 // 設計交付物 L512
  const FAVS_LIMIT = 40;                  // 常用列放得下的上限；避免壞掉的寫入無限膨脹 localStorage
  // 只有這六個欄位跨診次保留。cart 絕不持久化：跨診次殘留＝臨床事故（impl-plan R-9）。
  const PERSISTED_KEYS = ['favs', 'theme', 'layout', 'format', 'recent', 'paneSizes'];

  const MODES = ['outpatient', 'emergency', 'surg'];
  const FORMATS = ['lines', 'comma', 'names'];
  /* 慢病速查的三個主題。與 src/curated/chronic_care.json 的 topics[].key 是同一組值，
     build.py 會比對兩邊不一致就印警告——狀態層不得依賴資料層（零 DOM、零 window），
     所以這裡只能留一份鏡像，靠建置期守門避免慢慢分歧。 */
  const CHRONIC_TOPICS = ['dm', 'htn', 'lipid'];
  const LAYOUTS = ['wide', 'dock'];
  const THEMES = ['light', 'dark'];
  const DB_STATES = ['idle', 'loading', 'ready', 'error'];
  /* 窗格高度的分組鍵＝**生效版面**，比 LAYOUTS 多一個 mobile：mobile 不是可選的偏好
     （視窗夠窄自動生效），但它有自己的窗格，高度必須分開記——176px 側掛欄調出來的
     60px 部位區套到 1440 工作台毫無意義（使用者要求「分版面各記各的」）。 */
  const PANE_LAYOUTS = ['wide', 'dock', 'mobile'];
  const PANE_MIN = 24;      // 存得進來的最小值；各窗格自己的下限另由渲染層給（見 resize.js）
  const PANE_MAX = 4000;    // 上限只防壞資料，實際能多高由 resize.js 依當下空間再夾一次

  // ---- 儲存：不可用時安靜降級成記憶體 ----
  function memoryBacking() {
    const map = new Map();
    return {
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => { map.set(k, String(v)); },
      removeItem: (k) => { map.delete(k); },
    };
  }

  function defaultBacking() {
    // 沙箱 iframe／企業政策下光是「讀取 localStorage 這個屬性」就會丟例外，所以連取值都要包起來
    try {
      return typeof globalThis !== 'undefined' ? globalThis.localStorage : null;
    } catch (e) {
      return null;
    }
  }

  /* 包住任何 Storage-like 物件（getItem/setItem/removeItem）。
     無痕模式、file:// 限制、配額用盡都不得讓整個 app 掛掉——一律退回記憶體，功能照常、只是不跨診次保留。 */
  function safeStorage(backing) {
    const fallback = memoryBacking();
    let live = null;
    let available = false;
    try {
      if (backing && typeof backing.getItem === 'function' && typeof backing.setItem === 'function') {
        const probe = STORAGE_PREFIX + '__probe__';
        backing.setItem(probe, '1');
        backing.removeItem(probe);
        live = backing;
        available = true;
      }
    } catch (e) {
      live = null;
      available = false;
    }
    // 探測通過不代表之後每次都會成功（配額、政策中途變更）：任一次失敗就整組退回記憶體，不再重試
    const degrade = () => { live = null; available = false; };
    return {
      get available() { return available; },
      get(key) {
        if (live) {
          try { return live.getItem(key); } catch (e) { degrade(); }
        }
        return fallback.getItem(key);
      },
      set(key, value) {
        if (live) {
          try { live.setItem(key, value); return; } catch (e) { degrade(); }
        }
        fallback.setItem(key, value);
      },
      remove(key) {
        if (live) {
          try { live.removeItem(key); return; } catch (e) { degrade(); }
        }
        fallback.removeItem(key);
      },
    };
  }

  // ---- 預設值與清洗 ----
  function detectTheme() {
    try {
      if (typeof globalThis !== 'undefined' && typeof globalThis.matchMedia === 'function'
        && globalThis.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    } catch (e) { /* 沒有 matchMedia 就當淺色 */ }
    return 'light';
  }

  function defaultState(theme) {
    return {
      mode: 'outpatient',        // outpatient | emergency | surg
      region: 0,                 // 部位／情境 rail 的索引；null ＝ 沒有選取，顯示全部部位的面板
      query: '',
      expanded: {},              // { 面板名: true } 常見疾病展開
      quickOpen: {},             // { 快選分組標題: true }
      format: 'lines',           // lines | comma | names（持久化）
      cart: [],                  // [{code, zh}]，順序即優先序，index 0 為主診斷；不持久化
      recent: [],                // 最近使用代碼，最新在前，上限 RECENT_LIMIT（持久化）
      favs: [],                  // ★最愛代碼（持久化）
      relatedCode: null,         // 相關碼面板目前依據的代碼
      copied: false,             // 複製鈕的「已複製 ✓」暫態
      theme: THEMES.indexOf(theme) >= 0 ? theme : detectTheme(),
      layout: 'wide',            // wide | dock（持久化）；實際生效版面另由 resolveLayout 依寬度決定
      settingsOpen: false,
      /* 慢病速查目前開著的主題（null ＝ 關閉）。刻意**不持久化**：它是「現在正在查」的
         暫態，跨診次留著只會讓下一位病人開機就看到上一位的降血脂給付表擋住畫面。 */
      chronicTopic: null,
      shelfOpen: true,           // 常用列
      cartOpen: true,            // 1c/1b 的清單摺疊
      pinned: false,             // Document PiP 置頂
      paneSizes: {},             // { 版面: { 窗格key: 像素 } } 手動調整過的窗格高度（持久化）
      dbState: 'idle',           // idle | loading | ready | error
    };
  }

  const oneOf = (list, value, fallback) => (list.indexOf(value) >= 0 ? value : fallback);

  // 代碼字串陣列：去空白、去重、去非字串、可選上限。壞資料一律丟棄而不是讓 app 崩在渲染層。
  function sanitizeCodes(value, limit) {
    if (!Array.isArray(value)) return null;
    const out = [];
    for (const item of value) {
      if (typeof item !== 'string') continue;
      const code = item.trim();
      if (!code || out.indexOf(code) >= 0) continue;
      out.push(code);
      if (limit && out.length >= limit) break;
    }
    return out;
  }

  /* 窗格高度：{ 版面: { key: 像素 } }。壞掉的值一律丟棄而不是夾進來——夾出來的數字
     使用者從沒選過，看起來像「它自己記錯了」；丟掉就退回預設高度，至少是可解釋的。 */
  function sanitizePaneSizes(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const out = {};
    for (const layout of PANE_LAYOUTS) {
      const group = value[layout];
      if (!group || typeof group !== 'object' || Array.isArray(group)) continue;
      const clean = {};
      for (const key of Object.keys(group)) {
        const px = Number(group[key]);
        if (!Number.isFinite(px) || px < PANE_MIN || px > PANE_MAX) continue;
        clean[key] = Math.round(px);
      }
      if (Object.keys(clean).length) out[layout] = clean;
    }
    return out;
  }

  function readJson(storage, key) {
    const raw = storage.get(STORAGE_PREFIX + key);
    if (raw === null || raw === undefined) return undefined;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return undefined;      // 壞掉的值當成沒設定，不要讓 app 起不來
    }
  }

  /* 從儲存讀回持久化欄位，回傳「已清洗、可直接併進 state」的 patch。讀不到或格式不合就整欄省略。 */
  function loadPersisted(storage) {
    const patch = {};
    const theme = readJson(storage, 'theme');
    if (THEMES.indexOf(theme) >= 0) patch.theme = theme;
    const layout = readJson(storage, 'layout');
    if (LAYOUTS.indexOf(layout) >= 0) patch.layout = layout;
    const format = readJson(storage, 'format');
    if (FORMATS.indexOf(format) >= 0) patch.format = format;
    const favs = sanitizeCodes(readJson(storage, 'favs'), FAVS_LIMIT);
    if (favs) patch.favs = favs;
    const recent = sanitizeCodes(readJson(storage, 'recent'), RECENT_LIMIT);
    if (recent) patch.recent = recent;
    const paneSizes = sanitizePaneSizes(readJson(storage, 'paneSizes'));
    if (paneSizes) patch.paneSizes = paneSizes;
    return patch;
  }

  function persist(storage, key, value) {
    try {
      storage.set(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      /* safeStorage 已保證不丟例外；這層只防 JSON.stringify 遇到循環結構。持久化失敗不得影響操作。 */
    }
  }

  // ---- 狀態容器 ----
  /* options:
       storage  Storage-like（預設 globalThis.localStorage）；傳 null 可強制記憶體模式
       canAdd   (code, row) => boolean，加碼前的葉碼防線（見 data.js 的 isAddable）
       theme    覆寫初始主題（測試用）                                                     */
  function createStore(options) {
    const opts = options || {};
    const storage = safeStorage(
      Object.prototype.hasOwnProperty.call(opts, 'storage') ? opts.storage : defaultBacking()
    );
    const canAdd = typeof opts.canAdd === 'function' ? opts.canAdd : () => true;

    const state = Object.assign(defaultState(opts.theme), loadPersisted(storage));
    const subscribers = new Set();

    function getState() {
      return state;              // 唯讀約定：外部只能讀，一切變更走 action／setState（欄位一律以新物件取代）
    }

    function subscribe(fn) {
      if (typeof fn !== 'function') throw new TypeError('subscribe 需要函式');
      subscribers.add(fn);
      return () => { subscribers.delete(fn); };
    }

    function notify(changed) {
      for (const fn of Array.from(subscribers)) fn(state, changed);
    }

    /* 淺層合併；只有真的變動的欄位才會通知與持久化。回傳變動的欄位名陣列。 */
    function setState(patch) {
      if (!patch) return [];
      const changed = [];
      for (const key of Object.keys(patch)) {
        if (!Object.prototype.hasOwnProperty.call(state, key)) continue;   // 擋掉打錯字的幽靈欄位
        if (Object.is(state[key], patch[key])) continue;
        state[key] = patch[key];
        changed.push(key);
      }
      if (!changed.length) return changed;
      for (const key of changed) {
        if (PERSISTED_KEYS.indexOf(key) >= 0) persist(storage, key, state[key]);
      }
      notify(changed);
      return changed;
    }

    // ---- 清單 ----
    /* 最近使用：最新在前。內容沒變時**回傳原陣列**——setState 用 Object.is 判斷變更，
       每次都給新陣列會讓「再點一次同一個已在最前面的碼」也被當成變更，白寫一次
       localStorage 並多跑一輪常用列重繪（R2 M7）。 */
    function bumpRecent(code) {
      const prev = state.recent;
      const next = [code].concat(prev.filter((c) => c !== code)).slice(0, RECENT_LIMIT);
      if (prev.length === next.length && prev.every((c, i) => c === next[i])) return prev;
      return next;
    }

    /* 加入代碼。row 是搜尋結果自帶的資料列（[code, leaf, en, zh]），交給 canAdd 做葉碼複查。
       回傳 'added' | 'duplicate' | 'rejected'。 */
    function addCode(code, zh, row) {
      if (typeof code !== 'string' || !code) return 'rejected';
      if (!canAdd(code, row)) return 'rejected';
      const recent = bumpRecent(code);
      // 已在清單也要重新指向該碼的相關碼（否則點過的主訴就再也叫不回建議）
      if (state.cart.some((x) => x.code === code)) {
        setState({ recent, relatedCode: code, copied: false });
        return 'duplicate';
      }
      setState({
        cart: state.cart.concat([{ code, zh: zh || '' }]),
        recent,
        relatedCode: code,
        copied: false,
      });
      return 'added';
    }

    function removeCode(code) {
      const cart = state.cart.filter((x) => x.code !== code);
      if (cart.length === state.cart.length) return false;
      // 清單清空才重設相關碼；還有碼時保留 relatedCode，讓訂閱者重算（被移除的碼要回到建議清單）
      setState({ cart, copied: false, relatedCode: cart.length ? state.relatedCode : null });
      return true;
    }

    function clearCart() {
      setState({ cart: [], relatedCode: null, copied: false });
    }

    /* 設為主診斷：移到 index 0，其餘維持原相對順序。 */
    function setPrimary(code) {
      const item = state.cart.find((x) => x.code === code);
      if (!item || state.cart[0] === item) return false;
      setState({ cart: [item].concat(state.cart.filter((x) => x !== item)), copied: false });
      return true;
    }

    /* 換序：把 from 抽出來插到 to。索引不合法就什麼都不做。 */
    function reorder(from, to) {
      const n = state.cart.length;
      if (!Number.isInteger(from) || !Number.isInteger(to)) return false;
      if (from < 0 || from >= n || to < 0 || to >= n || from === to) return false;
      const next = state.cart.slice();
      const moved = next.splice(from, 1)[0];
      next.splice(to, 0, moved);
      setState({ cart: next, copied: false });
      return true;
    }

    // ---- 模式與版面 ----
    /* 切模式：相關碼是依模式產生的，**必須清空**，否則急診紅旗會洩漏到門診（C5，臨床安全）。
       部位歸零，但「沒有選取任何部位」（region === null）不是某個部位的索引，換模式後
       依然成立——強行歸零等於把醫師剛取消掉的篩選又自己裝回去。
       兩條切模式的動線（header 的三顆模式鈕與設定 popover 的 segmented）都收在這裡，
       所以設定 popover 一律關掉，選完不會留一個開著的浮層擋住剛換好的畫面。 */
    function setMode(mode) {
      if (MODES.indexOf(mode) < 0) return false;
      setState({
        mode,
        region: state.region === null ? null : 0,
        relatedCode: null,
        settingsOpen: false,
      });
      return true;
    }

    /* region 為 null ＝ 沒有選取任何部位，顯示全部部位的面板（不是顯示空白）。 */
    function setRegion(region) {
      if (region === null) { setState({ region: null }); return true; }
      const i = Number(region);
      if (!Number.isInteger(i) || i < 0) return false;
      setState({ region: i });
      return true;
    }

    /* 已選的部位再點一次就取消選取（使用者原話：「已經點選的部位再點一次會回到沒有點選」）。
       比對狀態裡的原始索引而不是渲染層 clamp 過的值：兩者只在「資料換模式縮水」的瞬間
       不同，那時畫面標亮的是第 0 個，點它會先變成真的選取第 0 個（狀態與畫面對齊），
       再點一次才取消——比直接取消更符合看到的東西。 */
    function toggleRegion(region) {
      const i = Number(region);
      if (!Number.isInteger(i) || i < 0) return false;
      return setRegion(state.region === i ? null : i);
    }

    function setLayout(layout) {
      if (LAYOUTS.indexOf(layout) < 0) return false;
      setState({ layout, settingsOpen: false });
      return true;
    }

    function setTheme(theme) {
      if (THEMES.indexOf(theme) < 0) return false;
      setState({ theme });
      return true;
    }

    const toggleTheme = () => { setState({ theme: state.theme === 'dark' ? 'light' : 'dark' }); return state.theme; };

    function setFormat(format) {
      if (FORMATS.indexOf(format) < 0) return false;
      setState({ format, copied: false });
      return true;
    }

    // ---- 窗格高度 ----
    /* 只存「使用者要多高」，不存「實際套用多高」——視窗變小時 resize.js 會把它夾小，
       但意圖要留著，視窗放大時窗格才長得回去。整棵 paneSizes 一律換成新物件：
       getState() 回傳的是內部物件本身，就地改動會讓 setState 的變更偵測靜默失效。 */
    function setPaneSize(layout, key, px) {
      if (PANE_LAYOUTS.indexOf(layout) < 0) return false;
      if (typeof key !== 'string' || !key) return false;
      const value = Number(px);
      if (!Number.isFinite(value)) return false;
      const clamped = Math.round(Math.max(PANE_MIN, Math.min(PANE_MAX, value)));
      const group = state.paneSizes[layout] || {};
      if (group[key] === clamped) return true;      // 沒變就不寫：拖曳結束值相同時不必多寫一次 localStorage
      const entry = {};
      entry[key] = clamped;
      const next = Object.assign({}, state.paneSizes);
      next[layout] = Object.assign({}, group, entry);
      setState({ paneSizes: next });
      return true;
    }

    /* 回復預設。不給版面＝全部清掉（測試與「重置一切」用）；給版面＝只清那一套，
       在 176px 窄欄按「回復預設高度」不該把桌機工作台調好的高度一起抹掉。 */
    function resetPaneSizes(layout) {
      if (layout === undefined || layout === null) {
        if (!Object.keys(state.paneSizes).length) return false;
        setState({ paneSizes: {} });
        return true;
      }
      if (PANE_LAYOUTS.indexOf(layout) < 0) return false;
      if (!state.paneSizes[layout]) return false;
      const next = Object.assign({}, state.paneSizes);
      delete next[layout];
      setState({ paneSizes: next });
      return true;
    }

    function paneSizeFor(layout, key) {
      const group = state.paneSizes[layout];
      const px = group ? group[key] : undefined;
      return typeof px === 'number' ? px : null;
    }

    const hasPaneSizes = (layout) => {
      if (layout === undefined || layout === null) return Object.keys(state.paneSizes).length > 0;
      const group = state.paneSizes[layout];
      return !!group && Object.keys(group).length > 0;
    };

    // ---- 最愛 ----
    function toggleFav(code) {
      if (typeof code !== 'string' || !code) return false;
      const on = state.favs.indexOf(code) >= 0;
      const favs = on
        ? state.favs.filter((c) => c !== code)
        : [code].concat(state.favs).slice(0, FAVS_LIMIT);
      setState({ favs });
      return !on;
    }

    const isFav = (code) => state.favs.indexOf(code) >= 0;

    // ---- 展開／收合 ----
    function toggleFlag(field, key) {
      if (typeof key !== 'string' || !key) return false;
      const next = Object.assign({}, state[field]);
      if (next[key]) delete next[key];
      else next[key] = true;
      const patch = {};
      patch[field] = next;
      setState(patch);
      return !!next[key];
    }

    const toggleExpanded = (panel) => toggleFlag('expanded', panel);
    const toggleQuick = (title) => toggleFlag('quickOpen', title);
    const isExpanded = (panel) => !!state.expanded[panel];
    const isQuickOpen = (title) => !!state.quickOpen[title];

    // ---- 其他暫態 ----
    const setQuery = (query) => { setState({ query: typeof query === 'string' ? query : '' }); };
    const setRelatedCode = (code) => { setState({ relatedCode: code || null }); };
    const setCopied = (copied) => { setState({ copied: !!copied }); };
    const setSettingsOpen = (open) => { setState({ settingsOpen: !!open }); };
    const toggleSettings = () => {
      setState({ settingsOpen: !state.settingsOpen });
      return state.settingsOpen;
    };
    /* 慢病速查：null ＝ 關閉，否則是 CHRONIC_TOPICS 之一。開啟時順手關掉設定 popover
       ——兩個浮層同時開著會互相遮蔽，而設定是「設定完就走」的動線，沒有並存的理由。
       不認得的 key 一律回 false 而不是靜默存進去：真的存進去只會畫出一個空面板，
       看起來像「這個主題沒有規定」，那是最糟的失敗方式。 */
    function setChronicTopic(key) {
      if (key === null || key === undefined || key === false) {
        setState({ chronicTopic: null });
        return true;
      }
      if (CHRONIC_TOPICS.indexOf(key) < 0) return false;
      setState({ chronicTopic: key, settingsOpen: false });
      return true;
    }

    const setShelfOpen = (open) => { setState({ shelfOpen: !!open }); };
    const toggleShelf = () => { setState({ shelfOpen: !state.shelfOpen }); return state.shelfOpen; };
    const setCartOpen = (open) => { setState({ cartOpen: !!open }); };
    const toggleCart = () => { setState({ cartOpen: !state.cartOpen }); return state.cartOpen; };
    const setPinned = (pinned) => { setState({ pinned: !!pinned }); };

    function setDbState(next) {
      if (DB_STATES.indexOf(next) < 0) return false;
      setState({ dbState: next });
      return true;
    }

    return {
      getState, setState, subscribe,
      storage,                    // 讓渲染層／測試能問 storage.available
      addCode, removeCode, clearCart, setPrimary, reorder,
      setMode, setRegion, toggleRegion, setLayout, setTheme, toggleTheme, setFormat,
      setPaneSize, resetPaneSizes, paneSizeFor, hasPaneSizes,
      toggleFav, isFav,
      toggleExpanded, toggleQuick, isExpanded, isQuickOpen,
      setQuery, setRelatedCode, setCopied, setDbState,
      setSettingsOpen, toggleSettings, setShelfOpen, toggleShelf,
      setCartOpen, toggleCart, setPinned,
      setChronicTopic,
    };
  }

  return {
    createStore, safeStorage, loadPersisted, persist, defaultState, sanitizePaneSizes,
    STORAGE_PREFIX, PERSISTED_KEYS, RECENT_LIMIT, FAVS_LIMIT,
    MODES, FORMATS, LAYOUTS, THEMES, DB_STATES, PANE_LAYOUTS, PANE_MIN, PANE_MAX,
    CHRONIC_TOPICS,
  };
});
