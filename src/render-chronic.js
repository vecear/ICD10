/* 慢病速查（DM／HTN／LIPID）整套：切換鈕、分頁、浮層與內容渲染。
   渲染規則與 R 的來源見 render-dom.js。

   本檔在 SOURCES 裡排在 render-ccr.js／render-lipid.js **之前**，所以對那兩個檔的東西
   （入口鈕、品項清單的開合狀態）一律在函式**執行時**才經 R. 取——載入時它們還不存在。 */
(function (root) {
  'use strict';

  // render-dom.js 已經建立這個物件（build.py 的 SOURCES 保證順序）
  const R = root.ICDRender;

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
    const row = R.el('div', 'chronic-switch' + (compact ? ' chronic-switch--compact' : ''));
    row.id = 'chronic-switch';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', '健保規範條文與計算機');
    const b = R.el('button', 'chronic-btn', '健保規範條文');
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
    row.append(R.lipidButtonEl(compact), R.ccrButtonEl(compact));
    return row;
  }

  /* 浮層內的主題分頁。**沒有這一排，這個功能是半殘的**：浮層是 modal，開著的時候外面
     那三顆入口鈕被遮罩蓋住，醫師想從 DM 換看 LIPID 得先關掉再開一次——而「比對兩個
     主題的目標值」正是最常見的用法（例：DAROC 的血壓目標 vs 高血壓指引的血壓目標）。
     用 aria-pressed 的一組切換鈕，不用 WAI-ARIA Tabs：那個 pattern 要求實作方向鍵的
     roving tabindex，本專案沒有，宣告了不履行比不宣告更糟（同 markRegionSelected 的理由）。 */
  function chronicTabsEl() {
    const row = R.el('div', 'chronic-tabs');
    row.id = 'chronic-tabs';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', '切換慢病速查主題');
    for (const topic of chronicTopics()) {
      const b = R.el('button', 'chronic-tab', topic.short || topic.key.toUpperCase());
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
    const overlay = R.el('div', 'chronic-overlay');
    overlay.id = 'chronic-overlay';
    overlay.hidden = true;
    const panel = R.el('div', 'chronic-panel');
    panel.id = 'chronic-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'chronic-title');
    const head = R.el('div', 'chronic-head');
    const title = R.el('h2', 'chronic-title', '');
    title.id = 'chronic-title';
    const close = R.el('button', 'chronic-close', '關閉');
    close.type = 'button';
    close.id = 'chronic-close';
    close.title = '關閉（Esc，或點面板以外任一處）';
    head.append(title, close);
    const body = R.el('div', 'chronic-body');
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
        const head = R.el('span', 'chronic-seg is-head');
        if (tag) { head.appendChild(tag); tag = null; }   // 標籤跟著抬頭走
        head.appendChild(R.el('b', 'chronic-lead', cut.lead));
        box.appendChild(head);
        segs = [cut.rest].concat(segs.slice(1));
      }
    }
    for (let i = 0; i < segs.length; i++) {
      const seg = R.el('span', 'chronic-seg');
      /* 沒有抬頭可提時，「給付」／「目標」標籤留在第一段並吃掉它的項目符號：
         標籤本身就佔著行首的標記位，再加一個符號就是「▪給付 …」，兩個標記擠在一起
         反而看不出哪個是分條。懸掛縮排照樣套用，續行仍與底下各條對齊。 */
      if (i === 0 && tag) { seg.appendChild(tag); seg.classList.add('is-tagged'); }
      /* 抬頭提走之後，各條自己的次級短標（「TG 200–499：」「TG ≧ 500：」）照樣標重——
         那正是這張表的決策欄，掃視時要比對的就是它。 */
      const cut = root.ICDLogic.splitLead(segs[i]);
      if (cut.lead) seg.appendChild(R.el('b', 'chronic-lead', cut.lead));
      seg.appendChild(document.createTextNode(cut.rest));
      box.appendChild(seg);
    }
    return box;
  }

  /* 一條規定。出處與查證日期是**可見文字**，不是 title——這是本功能與其他區塊最大的差別。 */
  function chronicItemEl(item, upcoming) {
    const li = R.el('li', 'chronic-item' + (upcoming ? ' is-upcoming' : ''));
    if (item.kind) li.dataset.kind = item.kind;
    if (upcoming) li.appendChild(R.el('p', 'chronic-soon', '新版將於 ' + item.effectiveFrom + ' 生效'));
    const line = R.el('p', 'chronic-text');
    /* 給付規定與治療目標混在同一段時（例如「別踩雷」同時收了兩者），要分得出哪條是
       哪一種——它們的可信度來源不同：給付看公告、目標看指引。
       標籤跟著抬頭（或沒抬頭時的第一段）走，不自成一行，否則每條都多一列。 */
    let tag = null;
    if (item.kind === 'coverage' || item.kind === 'target') {
      tag = R.el('span', 'chronic-kind-dot');
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
    const meta = R.el('span', 'chronic-meta');
    /* 缺漏一律顯示「未註明」而不是留白：留白看起來像「沒有這個欄位」，
       「未註明」看起來像「這條沒人查證過」——後者才是事實。 */
    const src = R.el('span', 'chronic-source', item.source || '未註明');
    /* 出處在 340px 下常常長到兩三行（「藥品給付規定 第五節 5.1 使用條件(2)（114/6/1
       生效；115.07.23 版）」），一條就吃掉三行。收成一行＋刪節號，全文留在 title——
       與部位鈕縮成兩字同一個取捨：看得到、查得到，但不佔版面。 */
    src.title = '出處：' + (item.source || '未註明');
    meta.append(src, R.el('span', 'chronic-checked', '查 ' + (item.checked || '未註明')));
    const from = item.effectiveFrom || '';
    const to = item.effectiveTo || '';
    if (from || to) {
      const window_ = from && to ? '適用 ' + from + '～' + to
        : (from ? '適用 ' + from + ' 起' : '適用至 ' + to);
      meta.appendChild(R.el('span', 'chronic-window', window_));
    }

    if (item.detail) {
      const more = R.el('details', 'chronic-more');
      const summary = document.createElement('summary');
      summary.className = 'chronic-line';
      summary.append(R.el('span', 'chronic-more-toggle', '補充'), meta);
      /* 補充是整段密集敘述（平均 206 字、最長 476），不斷行的話在窄欄裡要從頭讀到尾
         才找得到自己要的那一句。與主文共用 fillSegments，讀法完全一樣。 */
      const body = R.el('div', 'chronic-detail');
      fillSegments(body, item.detail);
      more.append(summary, body);
      li.appendChild(more);
    } else {
      const foot = R.el('p', 'chronic-line');
      foot.appendChild(meta);
      li.appendChild(foot);
    }
    return li;
  }

  function chronicSectionEl(section, today) {
    const parts = root.ICDLogic.splitByEffective(section && section.items, today);
    if (!parts.current.length && !parts.upcoming.length) return null;
    const box = R.el('section', 'chronic-section');
    const head = R.el('div', 'chronic-section-head');
    const kind = section && section.kind;
    /* title 是選填的（現行資料只給 kind）。沒有標題就拿 kind 的中文當標題——標題留白會讓
       整段內容失去脈絡，而「治療目標」與「健保給付」對醫師來說正是最需要分清楚的兩件事。 */
    const heading = (section && section.title) || CHRONIC_KIND[kind] || '其他';
    head.appendChild(R.el('h3', 'chronic-section-title', heading));
    if (CHRONIC_KIND[kind] && CHRONIC_KIND[kind] !== heading) {
      const tag = R.el('span', 'chronic-kind', CHRONIC_KIND[kind]);
      tag.dataset.kind = kind;
      head.appendChild(tag);
    }
    box.dataset.kind = kind || '';
    const list = R.el('ul', 'chronic-items');
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
    const box = R.el('section', 'chronic-section');
    box.dataset.step = group.step;
    const head = R.el('div', 'chronic-section-head');
    head.appendChild(R.el('h3', 'chronic-section-title', group.title));
    if (group.hint) head.appendChild(R.el('span', 'chronic-step-hint', group.hint));
    const list = R.el('ul', 'chronic-items');
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
     基準取**主文件**的 baseURI（渲染層跑在主視窗，document 就是主文件）。 */
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
    const box = R.el('section', 'chronic-docs');
    box.appendChild(R.el('h3', 'chronic-docs-title', '官方條文 PDF'));
    const list = R.el('ul', 'chronic-doc-list');
    for (const doc of docs) {
      const li = R.el('li', 'chronic-doc');
      const a = R.el('a', 'chronic-doc-link', doc.label || doc.file);
      a.href = chronicDocHref(doc.file);
      a.target = '_blank';
      a.rel = 'noopener';
      /* 點不開時唯一的線索就是這行 title：檔案該在哪、為什麼可能不在。 */
      a.title = CHRONIC_DOC_DIR + '／' + doc.file
        + '（隨診間包一起寄送，須與 icd10.html 解壓在同一層才點得開）';
      li.appendChild(a);
      if (doc.version) li.appendChild(R.el('span', 'chronic-doc-version', doc.version));
      if (doc.where) li.appendChild(R.el('span', 'chronic-doc-where', doc.where));
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
    const box = R.el('section', 'chronic-ladder');
    box.appendChild(R.el('h3', 'chronic-ladder-title', data.title || '風險分級'));
    if (data.lede) box.appendChild(R.el('p', 'chronic-ladder-lede', String(data.lede)));

    const list = R.el('ol', 'chronic-ladder-list');
    for (const lv of data.levels) {
      if (!lv || !lv.label) continue;
      const li = R.el('li', 'chronic-ladder-level');
      const head = R.el('p', 'chronic-ladder-head');
      head.appendChild(R.el('b', 'chronic-ladder-name', lv.label));
      /* 起始門檻與目標是同一個數字，所以寫「門檻＝目標」，不是兩個數。 */
      head.appendChild(R.el('span', 'chronic-ladder-num',
        'LDL-C 門檻＝目標 ' + lv.ldl + (lv.nonHdl ? '\nnon-HDL-C ' + lv.nonHdl : '')));
      /* 徽章只放結論「今天能不能開藥」，官方原文另起一行——原本徽章寫「可並行」
         「先做 3–6 個月」，並行什麼、做什麼都沒講（2026-09-01 使用者指出）。 */
      head.appendChild(R.el('span', 'chronic-ladder-flag' + (lv.parallel ? ' is-parallel' : ''),
        lv.parallel ? '可當天開藥' : '不可當天開藥'));
      li.appendChild(head);
      if (lv.nonDrug) {
        const nd = R.el('p', 'chronic-ladder-nondrug');
        nd.appendChild(R.el('b', 'chronic-ladder-nondrug-label', '非藥物治療'));
        nd.appendChild(document.createTextNode('　' + lv.nonDrug
          + (lv.nonDrugPlain ? '（' + lv.nonDrugPlain + '）' : '')));
        li.appendChild(nd);
      }
      if (lv.how) {
        const howEl = R.el('p', 'chronic-ladder-how');
        howEl.appendChild(R.el('b', 'chronic-ladder-nondrug-label', '判準'));
        howEl.appendChild(document.createTextNode('　' + String(lv.how)));
        li.appendChild(howEl);
      }
      if (Array.isArray(lv.criteria) && lv.criteria.length) {
        const ul = R.el('ul', 'chronic-ladder-criteria');
        for (const c of lv.criteria) ul.appendChild(R.el('li', null, String(c)));
        li.appendChild(ul);
      }
      list.appendChild(li);
    }
    box.appendChild(list);

    if (data.note) box.appendChild(R.el('p', 'chronic-ladder-note', String(data.note)));

    const f = data.factors;
    if (f && Array.isArray(f.items) && f.items.length) {
      const fb = R.el('section', 'chronic-ladder-factors');
      if (f.title) fb.appendChild(R.el('h4', 'chronic-ladder-subtitle', String(f.title)));
      const ul = R.el('ul', 'chronic-ladder-criteria');
      for (const item of f.items) ul.appendChild(R.el('li', null, String(item)));
      fb.appendChild(ul);
      if (f.note) fb.appendChild(R.el('p', 'chronic-ladder-note', String(f.note)));
      box.appendChild(fb);
    }

    const meta = R.el('p', 'chronic-t2-meta');
    if (data.source) meta.appendChild(R.el('span', 'chronic-source', String(data.source)));
    if (data.checked) meta.appendChild(R.el('span', 'chronic-checked', '查 ' + data.checked));
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

  /* 學名那一行用條文整理過的寫法（帶劑量錨點），對不上就退回品項檔的學名。
     比對用開頭：curated 是「atorvastatin（高強度例：40 mg 以上）」，品項檔是「atorvastatin」。 */
  function curatedLabelFor(items, generic) {
    const key = String(generic || '').toLowerCase();
    const hit = (items || []).filter((s) => String(s).toLowerCase().indexOf(key) === 0)[0];
    return hit || generic;
  }

  function chronicDrugsEl(key, ctx) {
    const data = chronicDrugs(key);
    if (!data) return null;
    const box = R.el('section', 'chronic-drugs');
    box.appendChild(R.el('h3', 'chronic-drugs-title', data.title || '用藥'));
    if (data.lede) box.appendChild(R.el('p', 'chronic-drugs-lede', String(data.lede)));
    const list = R.el('ul', 'chronic-drug-list');
    for (const g of data.groups) {
      if (!g || !g.klass) continue;
      const li = R.el('li', 'chronic-drug-group' + (g.covered === false ? ' is-selfpay' : ''));
      /* 每一類收合起來（使用者 2026-09-01）：五類各帶一段條件說明，全部攤開時
         這一塊比整頁其他內容加起來還長，而多數時候只要看某一類的條件。
         **給付狀態留在收合的那一行**：那是「開了病人要不要付錢」，不能藏起來。 */
      const more = R.el('details', 'chronic-drug-more');
      const key = 'klass\u0000' + g.klass;
      more.open = R.LIPID_OPEN_GROUPS.has(key);
      more.addEventListener('toggle', () => {
        if (more.open) R.LIPID_OPEN_GROUPS.add(key);
        else R.LIPID_OPEN_GROUPS.delete(key);
      });
      const head = document.createElement('summary');
      head.className = 'chronic-drug-head';
      head.appendChild(R.el('b', 'chronic-drug-klass', g.klass));
      if (g.cover) {
        head.appendChild(R.el('span',
          'chronic-drug-cover' + (g.covered === false ? ' is-selfpay' : ''), String(g.cover)));
      }
      more.appendChild(head);
      /* 展開後直接列品項（使用者 2026-09-01 選的做法），不是只列學名——
         處方單上是品名與劑量。每一筆帶表別，因為同一個學名底下兩張表都有。
         劑量錨點（「高強度例：40 mg 以上」）留在學名那一行：它來自條文本身，
         品項檔沒有這個資訊。 */
      const byGeneric = ctx ? ctx.logic.lipidProductsForClass(
        (root.LIPID_PRODUCTS && root.LIPID_PRODUCTS.products) || [], g.match) : [];
      if (byGeneric.length) {
        const ul = R.el('ul', 'chronic-drug-generics');
        for (const grp of byGeneric) {
          const gi = R.el('li', 'chronic-drug-generic');
          gi.appendChild(R.el('b', 'chronic-drug-generic-name',
            curatedLabelFor(g.items, grp.generic)));
          for (const table of ['one', 'two', '']) {
            const items = grp.items.filter((x) => (x.table || '') === table);
            if (!items.length) continue;
            const line = R.el('p', 'chronic-drug-names');
            if (table) {
              line.appendChild(R.el('span', 'lipid-hit-table is-' + table,
                table === 'one' ? '表一' : '表二'));
            }
            items.forEach((item, i) => {
              if (i) line.appendChild(document.createTextNode('、'));
              const span = R.el('span', 'lipid-drug-item', item.short);
              span.title = item.name + '（' + item.code + '）';
              line.appendChild(span);
            });
            gi.appendChild(line);
          }
          ul.appendChild(gi);
        }
        more.appendChild(ul);
      } else if (Array.isArray(g.items) && g.items.length) {
        /* 品項檔裡一個都沒有的類別（siRNA、ATP citrate lyase）：保留學名列。
           它們正是「表一點名了、健保沒收載」的那兩類，不列反而失去重點。 */
        more.appendChild(R.el('p', 'chronic-drug-names', g.items.join('、')));
      }
      if (g.note) more.appendChild(R.el('p', 'chronic-drug-note', String(g.note)));
      li.appendChild(more);
      list.appendChild(li);
    }
    box.appendChild(list);
    if (data.doseNote) box.appendChild(R.el('p', 'chronic-drug-note', String(data.doseNote)));
    if (data.note) box.appendChild(R.el('p', 'chronic-drug-note', String(data.note)));
    const meta = R.el('p', 'chronic-t2-meta');
    if (data.source) meta.appendChild(R.el('span', 'chronic-source', String(data.source)));
    if (data.checked) meta.appendChild(R.el('span', 'chronic-checked', '查 ' + data.checked));
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

  /* 使用者要求把「不適用表一」的項目完整列出來（寫學名就好）。
     每一項後面帶該成分底下的代碼數，是刻意的：光看成分名會讀成「所有 atorvastatin
     都走表二」，但實際上同成分多數品項仍走表一，只有這批特定代碼例外。
     數字讓人一眼看出這是**代碼層級**的例外清單，不是成分層級。 */
  function chronicTableTwoEl(key, ctx) {
    const data = chronicTableTwo(key);
    if (!data) return null;
    const box = R.el('section', 'chronic-t2');
    box.appendChild(R.el('h3', 'chronic-t2-title', data.title || '僅適用表二的成分'));
    if (data.lede) box.appendChild(R.el('p', 'chronic-t2-lede', data.lede));
    const list = R.el('ul', 'chronic-t2-list');
    for (const item of data.ingredients) {
      if (!item || !item.name) continue;
      const li = R.el('li', 'chronic-t2-item');
      li.appendChild(R.el('span', 'chronic-t2-name', item.name));
      if (item.codeCount) {
        li.appendChild(R.el('span', 'chronic-t2-codes', item.codeCount + ' 項'));
      }
      list.appendChild(li);
    }
    box.appendChild(list);
    if (data.caution) box.appendChild(R.el('p', 'chronic-t2-caution', String(data.caution)));
    /* 與上面那份「表一用的是哪些藥」的關係。不寫，同一個學名出現在兩塊裡
       看起來就是自相矛盾（使用者 2026-09-01 問過）。 */
    if (data.crossRef) box.appendChild(R.el('p', 'chronic-t2-crossref', String(data.crossRef)));
    /* 為什麼會有這份清單。醫師看到「同一個學名有的走表一有的走表二」的第一個反應
       是「憑什麼」——不講，這份清單看起來就是任意的（使用者 2026-09-01 問過）。 */
    if (data.why) box.appendChild(R.el('p', 'chronic-t2-why', String(data.why)));
    const meta = R.el('p', 'chronic-t2-meta');
    if (data.source) meta.appendChild(R.el('span', 'chronic-source', String(data.source)));
    if (data.checked) meta.appendChild(R.el('span', 'chronic-checked', '查 ' + data.checked));
    if (meta.childNodes.length) box.appendChild(meta);
    return box;
  }

  /* 本院實際有的品項。上面那塊列的是全國給付中的品項，但診間能開的只有本院這些，
     而且 HIS 要打的是收費代碼不是健保代碼——這一段就是把規則收束到「這裡能開什麼」。

     只在血脂主題出現：品項資料是全域一份，不擋 key 的話糖尿病面板也會冒出降血脂品項。 */
  function chronicHospitalEl(key, ctx) {
    if (key !== 'lipid') return null;
    const lp = root.LIPID_PRODUCTS || {};
    const products = lp.products || [];
    if (!products.length) return null;
    const groups = ctx.logic.lipidHospitalByTable(products);
    const buckets = [
      ['one', '表一'],
      ['two', '表二'],
      ['other', '不走表一／表二'],
    ].filter((b) => groups[b[0]] && groups[b[0]].length);
    if (!buckets.length) return null;

    const box = R.el('section', 'chronic-hosp');
    box.appendChild(R.el('h3', 'chronic-hosp-title', '本院品項'));
    for (const [bucket, label] of buckets) {
      const rows = groups[bucket];
      const grp = R.el('div', 'chronic-hosp-group');
      const head = R.el('p', 'chronic-hosp-head');
      head.appendChild(R.el('span', 'lipid-hit-table is-' + bucket, label));
      head.appendChild(R.el('span', 'chronic-hosp-count', rows.length + ' 支'));
      grp.appendChild(head);
      const list = R.el('ul', 'chronic-hosp-list');
      for (const r of rows) {
        const li = R.el('li', 'chronic-hosp-item' + (r.listed ? '' : ' is-dead'));
        li.appendChild(R.el('b', 'lipid-hit-hosp', r.hosp));
        li.appendChild(R.el('span', 'chronic-hosp-name', r.short || r.name));
        if (r.generic) li.appendChild(R.el('span', 'chronic-hosp-generic', r.generic));
        list.appendChild(li);
      }
      grp.appendChild(list);
      box.appendChild(grp);
    }
    /* 缺藥狀態刻意不記在資料裡（會過期），所以這裡要講清楚這份清單保證的是什麼、
       不保證什麼——這不是「常駐說明」，是這一塊資料的效力邊界。 */
    box.appendChild(R.el('p', 'chronic-hosp-caution',
      '收費代碼與表別以查證日為準；當天缺不缺藥看 HIS 畫面。'));
    const meta = R.el('p', 'chronic-hosp-meta');
    const hosp = lp.hospital || {};
    if (hosp.source) meta.appendChild(R.el('span', 'chronic-source', String(hosp.source)));
    if (hosp.checked) meta.appendChild(R.el('span', 'chronic-checked', '查 ' + hosp.checked));
    if (meta.childNodes.length) box.appendChild(meta);
    return box;
  }

  function renderChronic(overlay, ctx) {
    const key = ctx.store.getState().chronicTopic;
    const title = overlay.querySelector('#chronic-title');
    const body = overlay.querySelector('#chronic-body');
    R.clear(body);
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
      body.appendChild(R.el('p', 'chronic-headline', String(topic.headline)));
    }
    /* 排在速判摘要之後、分段內容之前：它決定了底下每一條門檻該讀表一還是表二，
       等於是讀下面所有數字的前提。放進「別踩雷」那一段就太深了——真正會踩到的人
       正是還沒想到要往下捲的人。 */
    /* 順序：怎麼分級（決定要看哪一列） → 哪些代碼走表二（決定要看哪一張表）。
       兩者都是讀底下每一條門檻的前提，所以排在分段內容之前。 */
    const ladder = chronicLadderEl(key);
    if (ladder) body.appendChild(ladder);
    /* 分完級之後的下一個問題就是「那要開什麼」，所以緊接在階梯後面。 */
    const drugs = chronicDrugsEl(key, ctx);
    if (drugs) body.appendChild(drugs);
    const tableTwo = chronicTableTwoEl(key, ctx);
    if (tableTwo) body.appendChild(tableTwo);
    /* 收在規則之後：先知道分級、該開什麼、哪些是例外，最後才是「本院有什麼、打哪個碼」。
       放更前面會變成先看品項再回頭找規則，那順序在核刪上是反的。 */
    const hospital = chronicHospitalEl(key, ctx);
    if (hospital) body.appendChild(hospital);
    let sections = 0;
    for (const group of chronicStepGroups(topic)) {
      const node = chronicStepEl(group, today);
      if (!node) continue;
      body.appendChild(node);
      sections += 1;
    }
    /* 空狀態要講實話：沒有內容不是「沒有規定」，是這份速查還沒整理到。 */
    if (!sections) {
      body.appendChild(R.el('p', 'chronic-empty',
        '「' + label + '」的內容尚未整理完成，請直接查健保署當期公告與現行指引。'));
    }
  }

  Object.assign(root.ICDRender = root.ICDRender || {}, {
    chronicSwitchEl, chronicTabsEl, syncChronicSwitch, chronicOverlayEl, renderChronic,
    chronicToday, chronicTopics, chronicDocsEl, chronicDocHref,
    chronicTableTwo, chronicTableTwoEl,
    chronicLadder, chronicLadderEl, chronicDrugs, chronicDrugsEl,
    CHRONIC_KIND, CHRONIC_DOC_DIR,
  });
})(typeof self !== 'undefined' ? self : this);
