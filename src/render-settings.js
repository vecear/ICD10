/* 設定 popover、版面切換、看診模式切換與日期鈕。渲染規則與 R 的來源見 render-dom.js。 */
(function (root) {
  'use strict';

  // render-dom.js 已經建立這個物件（build.py 的 SOURCES 保證順序）
  const R = root.ICDRender;

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
    const b = R.el('button', small ? 'dock-tool layout-toggle' : 'btn btn-secondary layout-toggle');
    b.type = 'button';
    b.id = def.id;
    b.title = def.title;
    /* 文字在窄寬度會被 CSS 藏起來（display:none 會一併從無障礙樹移除），
       所以名稱另外釘在 aria-label 上，不只靠 title。 */
    b.setAttribute('aria-label', def.label);
    b.dataset.layoutGo = kind;
    b.append(R.icon(def.icon, small ? 12 : 14), R.el('span', 'layout-toggle-label', def.label));
    return b;
  }
  /* 生效版面的分界寬度。app.js 的 resolveLayout() 直接讀這個值，說明文案與實際判斷
     才不會各寫一個數字而慢慢分歧。 */
  const LAYOUT_MIN_WIDTH = 900;

  function segRow(id, defs, attr, small) {
    const row = R.el('div', 'seg-row');
    row.id = id;
    for (const def of defs) {
      const b = R.el('button', 'seg-btn' + (small ? ' seg-btn--sm' : ''), def[1]);
      b.type = 'button';
      b.setAttribute(attr, def[0]);
      b.setAttribute('aria-pressed', 'false');
      if (def[2]) b.id = def[2];
      row.appendChild(b);
    }
    return row;
  }

  function section(title, body) {
    const wrap = R.el('div', 'settings-section');
    wrap.append(R.el('div', 'kicker', title), body);
    return wrap;
  }

  /* 三套版面共用同一份 popover 內容（定位由各版面的 CSS 負責）。 */
  function settingsPopoverEl(small) {
    const pop = R.el('div', 'settings-popover');
    pop.id = 'settings-popover';
    pop.hidden = true;
    /* 版面切換不放進設定：1a 的「側掛置頂」與 1c 的「展開」已經是一次點擊就到位的
       主動線，設定裡再放一份 segmented 只是同一件事的第二個入口。

       #layout-note 留著，而且比以前更需要：它講的是「生效版面 ≠ 你的偏好」
       （視窗未達 LAYOUT_MIN_WIDTH 時自動改用手機版面）。偏好現在由按鈕設定，
       沒有這段說明的話，在窄視窗按了側掛置頂卻跑出手機版面就只會像壞掉。 */
    const layoutNote = R.el('div', 'settings-alert', '');
    layoutNote.id = 'layout-note';
    layoutNote.hidden = true;
    /* 看診模式不放進設定：header 的三顆鈕已經是一次點擊就切換的主動線，
       設定裡再放一份 segmented 只是同一件事的第二個入口，兩處都要維護狀態同步。 */
    pop.append(
      layoutNote,
      section('複製格式', segRow('seg-format', FORMAT_DEFS, 'data-format', small))
    );
    const display = R.el('div', 'settings-row');
    const theme = R.el('button', 'btn btn-secondary', '夜間模式');
    theme.type = 'button';
    theme.id = 'theme-toggle';
    const shelf = R.el('button', 'btn btn-secondary', '隱藏常用列');
    shelf.type = 'button';
    shelf.id = 'shelf-toggle';
    /* 拖曳分隔條調過的高度沒有其他出口：拖過頭把某一區壓到只剩下限時，光靠再拖回去
       很難回到原本的比例。這顆鈕只清「目前生效版面」那一組（見 interactions.js）。 */
    const panes = R.el('button', 'btn btn-secondary', '回復預設高度');
    panes.type = 'button';
    panes.id = 'reset-panes';
    display.append(theme, shelf, panes);
    pop.appendChild(section('顯示', display));
    const note = R.el('div', 'settings-note', '');
    note.id = 'db-note';
    pop.appendChild(note);
    /* 全庫載入失敗時的唯一出路。沒有這顆鈕，ensureDb() 會一直回傳快取起來的失敗 Promise，
       使用者只能重新開啟整個 HTML 檔（R2 I2）。只在 dbState==='error' 時顯示。 */
    const retry = R.el('button', 'btn btn-secondary db-retry', '重新載入全庫');
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
    const about = R.el('div', 'settings-note settings-disclaimer',
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
        ? '瀏覽器過舊，無法解壓全庫（需 Edge／Chrome 80 以上）\n精選面板仍可使用'
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
        + ' px 時會自動改用手機版面\n把視窗放寬即會回到您偏好的「' + prefLabel + '」。';
    }
    return '目前生效的是「' + nowLabel + '」：偏好的「' + prefLabel
      + '」版面無法載入，已改用「' + nowLabel + '」。';
  }

  function syncSettings(root2, ctx) {
    root.ICDClipboardUI.mount(root2.querySelector('#settings-popover'), ctx);
    const s = ctx.store.getState();
    setPressed(root2.querySelector('#seg-mode'), 'data-mode', s.mode);
    setPressed(root2.querySelector('#seg-format'), 'data-format', s.clipboardFormats.cart ? 'custom' : s.format);
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
    /* 這句只有 1a 用得到（#mode-hint 只在 wide 的 header）。1a 的常見疾病
       2026-09-01 起不收合了，原本寫「收合在下」是錯的。 */
    outpatient: '每個部位最上面是常用碼，接著是主訴與常見疾病',
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
    const row = R.el('div', 'seg-row mode-switch');
    row.id = 'mode-switch';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', '看診模式');
    for (const def of MODE_DEFS) {
      const b = R.el('button', 'seg-btn mode-btn' + (compact ? ' seg-btn--sm' : ''),
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
    const b = R.el('button', 'btn btn-secondary date-btn' + (compact ? ' seg-btn--sm' : ''), '日期');
    b.type = 'button';
    b.id = 'copy-date';
    b.title = '複製今天的日期；可在設定調整輸出格式';
    return b;
  }

  Object.assign(root.ICDRender = root.ICDRender || {}, {
    settingsPopoverEl, syncSettings, dbNoteText, layoutNoteText, effectiveLayout, setPressed,
    layoutToggleEl, modeSwitchEl, syncModeSwitch, dateBtnEl,
    MODE_LABEL, MODE_SHORT, PANELS_TITLE, MODE_HINT, LAYOUT_LABEL, LAYOUT_MIN_WIDTH,
  });
})(typeof self !== 'undefined' ? self : this);
