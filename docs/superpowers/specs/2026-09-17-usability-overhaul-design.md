# 可用性與整潔總體修正設計

狀態：使用者 2026-09-17 核准「全做」。依據三份稽核（UX 實測 107 張截圖、程式碼結構、交付流程與文件），
以及指揮者對關鍵主張的抽驗（`tools/README.md:60`、三版面部位鈕 tooltip、打包腳本無 mtime 比對、
`regionShort` 取字規則、`#status` 為 sr-only、勾號規則只在 `dock.css:189`）。

## 目標

四個使用者原話對應四個方向：**更不會出錯**（醫師看得見自己剛做了什麼；交付鏈不再安靜出貨舊版）、
**更直覺**（三版面同一件事同一個做法、有回頭路）、**更美觀**（header 的層級與顏色語意）、
**更簡潔**（三版面重複收斂、大檔切分、文件與雜物歸位）。

## 設計決策（含判斷性選擇，驗收時請特別看）

### 通知列（取代只有讀屏聽得到的 `#status`）

- `interactions.js` 的 `announce()` 保留 sr-only live region，另外把同一則訊息畫到一條**可見通知列**。
- 通知列**覆蓋**在 header 下緣、不推擠內容（醫師正要點的碼不能移位）；沒有訊息時不佔任何高度。
- 成功類（已加入、已複製、已切換）2.5 秒自動收掉；失敗類（類目碼、全庫未載入、剪貼簿被拒）留到下一則訊息為止。
  `announce(message, { sticky: true })` 標記失敗類。
- 移除單筆與清空後，通知列多一顆「復原」：還原上一個清單快照，10 秒後收掉。快照只放記憶體，不持久化。
- 置頂小視窗：通知列跟著 `#status` 一起搬進 PiP 文件（`render-dock.js` 既有搬移邏輯擴大範圍）。

### 已加入勾號三版面共用

`dock.css:189` 的 `[data-in-cart="true"]::after` 規則搬到 `app.css`，三版面都顯示；紅旗色、類目虛線、附加碼標記不得被蓋掉（沿用 dock 已驗證的疊法）。

### 部位短名（判斷性選擇）

`REGION_SHORT` 改成：`'全身／感染': '感染'`、`感染科追蹤: '追蹤'`。理由：常見感染碼在前者，醫師找感染碼時看的是「感染」二字；
後者是 HIV／結核／OPAT 長期追蹤，「追蹤」才是它的身分。全名一律留在 `title`。E2E 若用短名定位要一併改。

### 清單中文名不截斷

工作台與手機的清單列改成兩行：第一行拖曳柄、序號、代碼、主／★／✕；第二行完整中文名可折行。
這是 2026-09-07「一項資訊一行」原則的直接套用，不是留白。側掛窄欄維持現狀（已是這樣）。
側掛清單列的小鈕最小高度 20px（回到密度原則自訂的邊界）。

### 打包腳本三道新閘門

1. `dist/icd10.html` 的 mtime 必須晚於 `src/**`、`build/build.py`、`data/*.json`、`健保條文/*.pdf` 全部檔案，否則中止並提示先跑 build。
2. `診間包.zip` 超過 22 MB 中止（Gmail 上限 25 MB 留餘裕），不再只印出。
3. 說明書過期檢查（已移除按鈕、行號）的掃描範圍加入 `tools/README.md`。

同時修正 `tools/README.md` 用法段（點碼即自動同步剪貼簿，沒有複製鈕），README 與 tools/README 的檔案大小改為「以打包輸出為準」。

### 搜尋回頭路與 placeholder

三版面在搜尋結果狀態都有「返回」鈕（沿用 dock 的 `#dock-search-back` 行為：清空 query、回到原部位原位置），Esc 同效。
placeholder 三版面都含「Enter 加第一筆」：工作台維持全文；側掛與手機用「搜尋碼／中英文　Enter 加第一筆」。

### 工作台面板索引與手機全展開

工作台左欄部位列下方的空白放**當前檢視的面板標題清單**，點了捲到該面板（扣掉 sticky 標題高度）。
沒選部位時列全部面板，索引區自己可捲動。手機沿用 dock 的 `#expand-all-panels`。

### 剪貼簿同步狀態

「貼入 HIS」標題列（工作台、手機）與側掛清單摘要列右側顯示「已同步 HH:MM」，每次成功同步更新；
同步失敗顯示「未同步」且不自動消失。不偵測外部剪貼簿變動。

### header 與顏色語意

- 淺藍填色（`--his-btn`）只給**會寫剪貼簿**的鈕：日期、CCr 複製、Lipid 複製。`#ccr-btn` 改成與 `#lipid-btn`、`#chronic-btn` 相同的次要樣式。
- 工作台 header 所有控制項統一 32px 高、13px 字；「側掛置頂」降為次要樣式。
- 手機的日期鈕移出模式分段列，放到搜尋列與「設定」同側，維持 44px。
- 側掛清單摘要字級 13→12px；手機「設定」13→14px；工作台「清空」改用 `--color-accent-700` 過 AA。
- 工作台慢病速查浮層寬度 `min(1100px, 92vw)`。

### 密度原則延伸到工作台

`docs/dense-ui-principle.md` 的適用範圍改為三套版面。本次工作台的量測（面板索引、header 整理）前後數字寫進該檔。

### 程式碼收斂

- `U.searchValue` 三份逐字重複 → `R.syncSearchValue(input, ctx)`。
- 部位選單與面板渲染抽成 `render-shared` 的工廠函式，三版面只傳差異參數；tooltip 規則統一為
  「全名（N）」＋選取時附「，再點一次取消選取，顯示全部部位」。
- `render-shared.js` 切成 `render-dom.js`、`render-common.js`、`render-settings.js`、`render-chronic.js`、`render-ccr.js`、`render-lipid.js`，
  都掛回 `window.ICDRender`，`build/build.py` 的 `SOURCES` 依序載入。
- CCr／Lipid／慢病的純文字整形函式（`*ResultText`、`*ClipboardData`）移到不碰 DOM 的 `src/clinical-format.js` 並補單元測試；
  `clipboard-settings.js` 改從它取範例資料，解除對渲染層的反向依賴。
- 刪除 `chronicTableTwoNames`、`lipidResetOpenGroups`；`industry.css` 零引用的 class 逐一以 grep（src、tests、template、build）再確認後刪除。
- `.gitattributes` 為 `*.js *.css *.py *.md *.json *.html` 釘 LF；`.txt` 與 `.ahk` 不動（診間記事本相容）。

### 文件與雜物

- README 的決策敘事（帶日期的「使用者要求」「實測」段落）搬到 `docs/decisions.md`（依日期排序），README 收到 200 行內；
  新增的通知列、返回、面板索引、已同步、復原寫進 README 與 `tools/診間使用說明.txt`。
- `docs/superpowers/` 五份已出貨的 plan／spec 與根目錄 `task_plan.md`、`progress.md`、`findings.md` 移到 `docs/superpowers/archive/`。
- 刪除 `tools/Au.png`、`Au.z01`、`Au.zip`（失敗實驗殘留，已 gitignore）。AutoHotkey 安裝檔保留（是 `AutoHotkey64.exe` 的來源證明）。
- 目前未提交的變更拆成兩個 commit（剪貼簿輸出設定；院內收費代碼反查），後者補一段 README 說明。

## 驗證

每一階段：相關 E2E 與單元測試新增或更新後綠燈、`python -m pytest -q` 全綠、`node tests/*.test.mjs` 全綠、
`python build/build.py && python tools/pack_for_clinic.py` 成功。全部完成後另派全新脈絡的 agent 用 Playwright 逐條重走 UX 報告前五名確認已修，
並抽查 README 與說明書的實際內容。
