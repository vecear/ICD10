/* 資料層：純資料、零 DOM。瀏覽器掛 window.ICDData；node 供測試 require。
   職責：精選內容（window.CURATED）的模式化存取、中文標籤查表、全庫延遲載入的狀態機，
   以及「類目碼不可加入」的葉碼防線——後者在全庫還沒載入時一樣必須成立（impl-plan R-4）。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ICDData = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SEARCH_LIMIT = 24;     // 設計 L611（現行 50 已統一為 24，impl-plan R-11）
  const FAMILY_LIMIT = 12;     // 設計 L601

  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

  /* 附加碼：B95–B97（「分類於他處疾病之病原體」）與 Z16（抗藥性）在 ICD-10-CM 只能
     附加在主要疾病之後，**不得作為主診斷**。官方中文名（例如 Z16.11「青黴素之抗藥性」）
     完全看不出這件事，而相關碼推薦區的 chip 走的就是官方中文名——所以判斷放在資料層，
     讓三套版面在任何出現位置（面板／快選／搜尋結果／相關碼／常用列／清單）都標得出來。 */
  const ADJUNCT_RE = /^(?:B9[567]|Z16)/;
  const isAdjunct = (code) => typeof code === 'string' && ADJUNCT_RE.test(code);

  /* 蒐集所有人工精選出現過的代碼，供搜尋排序優先顯示。（原 app.js collectCuratedCodes，
     邏輯不動，只補上「欄位不存在」的防護，讓精簡的測試資料也能用。） */
  function collectCuratedCodes(C) {
    const curated = C || {};
    const set = new Set();
    const addPairs = (list) => { for (const pair of list || []) set.add(pair[0]); };
    addPairs(curated.chronic);
    addPairs(curated.infectious);
    addPairs(curated.pathogens);
    addPairs(curated.surgicalQuick);
    addPairs(curated.emergencyQuick);
    for (const p of curated.surgicalPanels || []) addPairs(p.codes);
    const addInternal = (regions) => {
      for (const region of regions || []) {
        for (const panel of region.panels || []) {
          for (const field of ['chief', 'diseases', 'redFlags']) addPairs(panel[field]);
          for (const [code, values] of Object.entries(panel.related || {})) {
            set.add(code);
            for (const value of values) set.add(value);
          }
        }
      }
    };
    addInternal(curated.internalEmergency);
    addInternal(curated.internalOutpatient);
    for (const [code, list] of Object.entries(curated.related || {})) {
      set.add(code);
      for (const c of list) set.add(c);
    }
    return set;
  }

  /* 單一模式（急診或門診）的症狀相關碼查表；**不同模式不得互相合併**（紅旗隔離的實作基礎）。 */
  function flattenSymptomRelated(regions, logic) {
    const out = {};
    for (const region of regions || []) {
      for (const panel of region.panels || []) {
        for (const [code, values] of Object.entries(panel.related || {})) {
          out[code] = logic.mergeRelated(out[code], values);
        }
      }
    }
    return out;
  }

  /* 從文件裡的 #icd-data（gzip+base64）解出全庫。原 app.js loadCodes，一字未改地搬過來。 */
  function loadCodesFromDocument(doc) {
    const host = doc || (typeof document !== 'undefined' ? document : null);
    if (!host) throw new Error('沒有 document，無法讀取內嵌資料');
    const b64 = host.getElementById('icd-data').textContent.trim();
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text().then((text) => JSON.parse(text));
  }

  /* options:
       curated    window.CURATED
       labels     window.CURATED_LABELS（建置期注入；同時是延遲載入期的加碼白名單）
       logic      window.ICDLogic（必填，一律沿用，不得自己重寫 search/family）
       loadDb     () => Promise<rows>，全庫載入器
       onDbState  (state) => void，通常接到 store.setDbState                                */
  function createData(options) {
    const opts = options || {};
    const curated = opts.curated || {};
    const labels = opts.labels || {};
    const logic = opts.logic;
    if (!logic) throw new TypeError('createData 需要 logic（window.ICDLogic）');
    const loadDb = opts.loadDb;
    const onDbState = typeof opts.onDbState === 'function' ? opts.onDbState : () => {};

    const curatedCodes = collectCuratedCodes(curated);
    // 兩個模式各一份查表，**絕不合併**：急診紅旗的相關碼不得洩漏到門診（C5）
    const symptomRelated = {
      emergency: flattenSymptomRelated(curated.internalEmergency, logic),
      outpatient: flattenSymptomRelated(curated.internalOutpatient, logic),
    };

    let index = null;          // 全庫索引，未載入前為 null
    let curatedIndex = null;   // 精選池索引（延遲建立），全庫未就緒時的搜尋來源
    let dbPromise = null;
    let dbState = 'idle';
    let lastError = null;
    let token = 0;

    function setDbState(next) {
      if (dbState === next) return;
      dbState = next;
      onDbState(next);
    }

    // ---- 標籤 ----
    /* 中文名：優先用建置期注入的精選對照表（全庫未就緒時唯一來源），其次查全庫。 */
    function labelOf(code) {
      if (has(labels, code) && labels[code]) return labels[code];
      const row = index ? index.byCode.get(code) : null;
      return row ? row[3] : '';
    }

    const rowFor = (code) => (index ? index.byCode.get(code) || null : null);

    // ---- 精選內容的模式化存取 ----
    const regionSets = (mode) => (mode === 'emergency'
      ? curated.internalEmergency || []
      : curated.internalOutpatient || []);

    /* rail／pill 用的部位（外科為情境）清單，含計數。 */
    function regionsFor(mode) {
      if (mode === 'surg') {
        return (curated.surgicalPanels || []).map((p) => ({ name: p.name, count: (p.codes || []).length }));
      }
      return regionSets(mode).map((r) => ({ name: r.name, count: (r.panels || []).length }));
    }

    /* 超界回 0（沿用現行 renderInternalPanels 的行為：切模式後部位數變少也不會空畫面）。
       region === null 是「沒有選取任何部位」＝顯示全部，不是壞值，原樣傳下去。
       **只認 null**：undefined／NaN 一律當漏傳參數回 0，免得少寫一個引數就靜默變成顯示全部。 */
    function clampRegion(mode, region) {
      if (region === null) return null;
      const total = regionsFor(mode).length;
      const i = Number(region);
      if (!total || !Number.isInteger(i) || i < 0 || i >= total) return 0;
      return i;
    }

    /* 單一部位（外科為單一情境）的面板；索引已由 clampRegion 保證合法。
       redFlags **只有急診模式**拿得到——門診資料本來就不含 redFlags（build.py 強制），
       這裡再擋一層，讓三套版面不可能各自寫錯而洩漏紅旗。 */
    function panelsAt(mode, i) {
      if (mode === 'surg') {
        const panel = (curated.surgicalPanels || [])[i];
        return panel ? [{ name: panel.name, chief: panel.codes || [], diseases: [], redFlags: [] }] : [];
      }
      const set = regionSets(mode)[i];
      if (!set) return [];
      return (set.panels || []).map((panel) => ({
        name: panel.name,
        chief: panel.chief || [],
        diseases: panel.diseases || [],
        redFlags: mode === 'emergency' ? panel.redFlags || [] : [],
      }));
    }

    /* 目前模式＋部位要顯示的面板。region 為 null（取消選取）時串接全部部位的面板。 */
    function panelsFor(mode, region) {
      const i = clampRegion(mode, region);
      if (i !== null) return panelsAt(mode, i);
      const out = [];
      regionsFor(mode).forEach((r, idx) => { for (const panel of panelsAt(mode, idx)) out.push(panel); });
      return out;
    }

    /* 渲染用的分組：[{region, panels}]。`region` 是要印在該組面板前面的部位標題，
       null 代表這組不需要標題——(1) 有選部位時只有一組，rail／pill 上已經標亮了；
       (2) 外科的「情境」本身就是面板，標題會與面板名一字不差地重複。
       顯示全部時沒有這層標題，三十幾張卡連在一起會迷失（取消選取的裁定行為）。 */
    function panelGroupsFor(mode, region) {
      const i = clampRegion(mode, region);
      if (i !== null) return [{ region: null, panels: panelsAt(mode, i) }];
      return regionsFor(mode).map((r, idx) => ({
        region: mode === 'surg' ? null : r.name,
        panels: panelsAt(mode, idx),
      }));
    }

    /* 快選分組：[[標題, [[code, label], …]], …] */
    function quickGroupsFor(mode) {
      const pathogens = ['病原體附加碼／抗藥性', curated.pathogens || []];
      if (mode === 'emergency') {
        return [['急診常見評估', curated.emergencyQuick || []], ['感染科常用', curated.infectious || []], pathogens];
      }
      if (mode === 'surg') {
        return [['外科常用', curated.surgicalQuick || []], pathogens];
      }
      return [['常用慢性病', curated.chronic || []], ['感染科常用', curated.infectious || []], pathogens];
    }

    // ---- 全庫延遲載入 ----
    /* 只在需要時觸發（輸入 ≥2 字、第一次加碼、閒置預抓）。Promise 快取起來，
       併發呼叫回同一個 Promise，dbState 只會走一次 idle→loading→ready（impl-plan R-3.2）。
       失敗時不 reject（fire-and-forget 預抓不得產生未處理的 rejection），改回傳 null；
       也不自動重試——否則每敲一次鍵就重下載一次全庫。要重試請明確呼叫 retryDb()。 */
    function ensureDb() {
      if (dbPromise) return dbPromise;
      if (typeof loadDb !== 'function') {
        lastError = new Error('沒有提供 loadDb，無法載入全庫');
        setDbState('error');
        dbPromise = Promise.resolve(null);
        return dbPromise;
      }
      setDbState('loading');
      dbPromise = Promise.resolve()
        .then(() => loadDb())
        .then((db) => {
          index = logic.buildIndex(db, curatedCodes);
          lastError = null;
          setDbState('ready');
          return index;
        })
        .catch((err) => {
          lastError = err;
          setDbState('error');
          return null;
        });
      return dbPromise;
    }

    function retryDb() {
      if (dbState === 'loading' || dbState === 'ready') return ensureDb();
      dbPromise = null;
      setDbState('idle');
      return ensureDb();
    }

    /* 競態守門（impl-plan R-3.1）：非同步流程開始前取號，回來時號碼不是最新的就丟棄結果。 */
    const nextToken = () => { token += 1; return token; };
    const isCurrentToken = (t) => t === token;

    // ---- 搜尋 ----
    /* 精選池索引：全庫未就緒時的搜尋來源。列的形狀與全庫一致（[code, leaf, en, zh]），
       渲染層不必分辨資料來自哪裡；精選碼建置期已驗證都是葉碼，故 leaf 一律 1。 */
    function curatedPool() {
      if (curatedIndex) return curatedIndex;
      const rows = Object.keys(labels).sort().map((code) => [code, 1, '', labels[code]]);
      curatedIndex = logic.buildIndex(rows, curatedCodes);
      return curatedIndex;
    }

    const searchCurated = (query, limit) => logic.search(curatedPool(), query, limit || SEARCH_LIMIT);

    /* 統一入口：全庫就緒用全庫，否則用精選池。回傳陣列另帶 total（logic 給的）與 pool。 */
    function search(query, limit) {
      const max = limit || SEARCH_LIMIT;
      const rows = index ? logic.search(index, query, max) : searchCurated(query, max);
      rows.pool = index ? 'full' : 'curated';
      return rows;
    }

    // ---- 相關碼 ----
    /* 人工關聯（全域 related.json ＋ 當前模式的症狀相關碼）。外科沒有症狀表 → 只吃全域。
       不在這裡過濾已在清單的碼：那是渲染層的事，這層只負責「哪些碼有關聯」。 */
    function relatedFor(code, mode) {
      if (!code) return [];
      const modeRelated = symptomRelated[mode] || {};
      return logic.mergeRelated((curated.related || {})[code], modeRelated[code]);
    }

    /* 同類目其他葉碼。全庫未就緒時退回精選池，讓相關碼面板不至於整段空白。 */
    function familyFor(code, limit) {
      if (!code) return [];
      return logic.family(index || curatedPool(), code, limit || FAMILY_LIMIT);
    }

    // ---- 葉碼防線（impl-plan R-4）----
    /* 「類目碼不可加入清單」在全庫延遲載入後仍必須成立。三重規則，由強到弱：
         1. index 就緒 → 全庫是唯一權威（順帶擋掉不存在的代碼）
         2. 搜尋結果列自帶 row[1]
         3. 精選白名單 CURATED_LABELS —— 安全性由 build.py 的 validate_curated()／
            build_curated_labels() 在建置期保證（強制全是 USE=1 葉碼）
       渲染層與 store 的 canAdd 都要走這個函式，不得各自判斷。

       addability() 是三態版本：'yes' 可加、'no' 明確不可加（類目碼／不存在）、
       'unknown' 全庫未就緒且不在白名單，此刻無從判斷。'unknown' 一樣不可加
       （isAddable 只認 'yes'，防線強度完全不變），差別只在呼叫端可以據此給出誠實的
       訊息與可行的下一步——★最愛裡的非精選碼在全庫就緒前被拒時，以前會播報
       「是類目碼或不存在」，與事實相反（R2 I3）。 */
    function addability(code, row) {
      if (typeof code !== 'string' || !code) return 'no';
      if (index) {
        const known = index.byCode.get(code);
        return known && known[1] === 1 ? 'yes' : 'no';
      }
      if (row) return Array.isArray(row) && row[1] === 1 ? 'yes' : 'no';
      if (has(labels, code) && !!labels[code]) return 'yes';
      return 'unknown';
    }

    const isAddable = (code, row) => addability(code, row) === 'yes';

    return {
      labelOf, rowFor, isAddable, addability, isAdjunct,
      regionsFor, panelsFor, panelGroupsFor, quickGroupsFor, clampRegion,
      ensureDb, retryDb, nextToken, isCurrentToken,
      search, searchCurated, relatedFor, familyFor,
      getIndex: () => index,
      getDbState: () => dbState,
      getError: () => lastError,
      isReady: () => !!index,
      rowCount: () => (index ? index.db.length : 0),
      curatedCodes,
      symptomRelated,
    };
  }

  return {
    createData, collectCuratedCodes, flattenSymptomRelated, loadCodesFromDocument, isAdjunct,
    SEARCH_LIMIT, FAMILY_LIMIT,
  };
});
