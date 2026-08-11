# 1c 側掛窄欄：實作與設計交付物的刻意偏離

比對對象：`.review/design-ref/new-design.dc.html` 的 1c 區塊（L223-338）與其共用邏輯
（`layoutsDock`／`modesDock`／`formatsDock`／`togglePin`／`toggleCart` 等，L690-736）。
實作對應 `src/render-dock.js`、`src/styles/dock.css`。

`.review/` 目錄未進版控（見 `.gitignore`），原本記在該目錄下的 `p4a-report.md` 從未真正寫出，
連帶讓 `src/styles/dock.css` 檔頭「差異見 p4a-report.md」的說明指向一個不存在的檔案。
本檔改放 `docs/`（會進版控），修正這個問題；`dock.css` 已同步改指向本檔。

## 刻意偏離設計稿之處（2 項）

### 1. 設定 popover 定位：`top:46px` → `top:64px`

- 設計來源：L712-713 `settingsStyleDock`，`top:46px`。
- 實作：`src/styles/dock.css` `#settings-popover { top: 64px; }`。
- 理由：header 內距 6 ＋ 搜尋框 28 ＋ gap 5 ＝ 39，才是那排鈕（模式徽章／置頂／設定）的頂端；
  鈕高 22 ⇒ 底端 61。用設計原值 46px 會讓 popover 蓋住「設定」鈕本身的下方 15px，使用者
  再點一次關不掉（Playwright 實測 pointer events 被 popover 攔截）。64px 剛好貼在那排鈕
  下方 3px，左右與內距完全照設計不變。
- 這是唯一的**數值**偏離；判斷是交付物原型的算術錯誤，不是刻意的設計決定。

### 2. 置頂失敗／不支援時，不進入「已置頂」視覺狀態

- 設計來源：L720-728 `togglePin()`——不論真的開出小視窗、被瀏覽器擋下、或瀏覽器不支援，
  三種情況一律 `setState({ pinned: true, pinNote: ... })`。
- 實作：`src/render-dock.js` 的 `PIN_NOTE` 三種文案 ＋ `openPip()`／`setNote()`——只有真的
  透過 `documentPictureInPicture.requestWindow()` 拿到視窗才呼叫 `ctx.store.setPinned(true)`；
  被擋下或不支援時只顯示提示文字，`pinned` 維持 `false`。
- 理由：交付物原型的行為會讓「置頂」鈕呈現 active／選中樣式，但畫面上根本沒有置頂小視窗，
  等於 UI 在說謊。改成「失敗只顯示提示，不假裝已置頂」，避免使用者以為視窗開在背後找不到。
- 對應測試：`tests/test_e2e_dock.py::test_pin_unsupported_shows_note` 驗證降級路徑
  `pinned` 維持 `false` 且不拋例外。

## 設計交付物沒有、後來新增的 1c 元素

### 模式徽章的三選一選單（`#mode-menu`）

- 需求來源：使用者要求「可以在圈起來的地方直接切換門急診外科」，且三套版面**功能統一**。
  設計交付物裡 `#mode-chip` 只是靜態徽章，沒有這個控制項。
- 1c 專屬處理：`.mode-switch` 在 1c 改成 `position: static`，選單改掛在 `.dock-head` 上，
  用與設定 popover 同一組座標（`top:64px; left:6px`）。徽章本身只有約 34px 寬，選單若以
  徽章為定位基準，`.mode-switch` 的 `scrollWidth` 會大於 `clientWidth`——那正是
  `tests/test_e2e_dock.py::overflowing_elements` 判準 (b) 要抓的破版形狀，會變成一條
  永遠亮著的假警報。1a／1b 沒有這個檢查，仍以徽章為基準。
- 可見標籤沿用既有的 1c 短標籤（門診／急診／外科），完整名稱留在 `title`。

### 部位列的「全部」鈕（`.region-all-btn`）

- 需求來源：「已選取再按一下清除」三套版面本來就都能用，但沒有視覺提示，使用者以為只有
  1c 有。這顆鈕把「目前沒有篩選」變成看得見、按得到的狀態。
- 1c 專屬處理：`grid-column: 1 / -1` 橫跨兩欄——它不是「第 0 個部位」，與部位並排會被當成
  其中一區；部位數為奇數時也會替兩欄 grid 留下一格空白。
- 刻意不掛 `.region-btn`／`.region-pill--dock` 類名：那些類名的語意是「一個部位」，
  事件委派與既有測試都靠它們數部位數量。

## 確認「不是」偏離、但值得記一筆（避免日後被誤認成還有偏離沒補）

- **側掛窄欄的短標籤**（如「工作台」→「窄欄」、「內科門診」→「門診」）：設計本身就在
  L698-709 定義了 `layoutsDock`／`modesDock`／`formatsDock` 三組 1c 專用短標籤。
  `render-dock.js` 的 `SHORT_LABEL`／`shortenSegLabels()` 只是把這組短標籤套進「三版面共用」
  的 settings popover（該 popover 的預設文字是給 1a 用的全名），語意與設計一致，不是我方偏離。
- **置頂鈕 SVG 不寫 `xmlns`**：設計自己內聯的 SVG（L237）本來就沒有 `xmlns` 屬性，實作同樣
  不寫，是延續設計，不是偏離。這同時也是全域規則（`impl-plan.md` C4：內聯 SVG 帶 `xmlns` 會
  含 `http://`，踩到 `test_build_produces_single_html` 的離線檢查），不是 1c 專屬決定。
- **不使用 `color-mix()` / `:has()`**：這是全域規則（`impl-plan.md` C1：診間瀏覽器版本未知，
  一律做靜態備援），適用於全部三套版面，不是 1c 專屬。vendored 的 `industry-styles.css`
  本身大量使用 `color-mix()`，1c 沒有另外違反這條規則。
- **清單展開／收合的圖示**：`cartMarker` 用可旋轉的 Lucide `chevron-right`
  （`R.icon('chevronRight', 12)` ＋ CSS `transform: rotate()`）取代設計原型的文字符號
  `▾`／`▸`。這是全域既有決定（`impl-plan.md` R-1.5、`p3-report.md` D-8：所有版面的符號字元
  一律換成內聯 Lucide SVG，避免這些字元不在 Barlow 字型裡、fallback 到系統符號字型導致
  跨機器渲染不一致），不是 1c 專屬偏離。

## 結構性差異（設計本身即如此，非偏離）

與 1a 桌機工作台的三個結構差異——內容區是扁平列表不是卡片、部位選擇是兩欄 grid、多了
「置頂」鈕——都是 `new-design.dc.html` L226 對 1c 的原始描述本身就要求的，`render-dock.js`
檔頭已有對應說明，不在此重複列出。
