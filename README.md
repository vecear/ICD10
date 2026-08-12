# ICD-10 門診導引

單一離線 HTML 的 ICD-10-CM 選碼工具，為看診當下設計：內科門診／內科急診／外科三種模式、
依身體部位的症狀導向面板、慢性病與感染科常用快選、相關碼連鎖推薦、就診清單一鍵貼入 HIS、
全庫即時搜尋。整個工具就是 [`dist/icd10.html`](dist/icd10.html) 一個檔案（約 1.9 MB），
免安裝、免網路、零外部請求，可直接放進診間電腦或隨身碟。

## 三種版面

| 版面 | 用途 |
| --- | --- |
| **桌機工作台**（預設） | 全螢幕三欄：左部位、中面板、右就診清單＋HIS 預覽。看診主力版面。 |
| **側掛窄欄** | 壓成一條窄欄貼在螢幕邊，讓 HIS 佔滿其餘空間；按「置頂」可用 Document Picture-in-Picture 把整條窄欄丟進永遠置頂的小視窗，浮在 HIS 上面。 |
| **手機** | 整列式觸控介面（每列 48px）、底部固定清單列與可展開抽屜。 |

桌機兩種版面在**設定 → 桌機版面**切換，選擇會記住。視窗寬度未達 900px 時會自動改用手機
版面（此時設定面板會說明目前生效的是哪一種、以及放寬視窗就會回去），因此在筆電上把視窗
縮成半螢幕也不會變成擠爆的桌機版。

## 使用

用 Edge / Chrome 開啟 [`dist/icd10.html`](dist/icd10.html)。

- **搜尋**：中文（蜂窩）、英文（cellulitis）、代碼前綴（L03 或 E119）皆可；按 Enter 直接加入第一筆。
- **內科導引**：先選內科門診或內科急診，再依身體部位挑主訴、常見相關疾病與評估碼。
- **急診提醒**：「優先排除／提醒評估」僅供醫師複核，不是自動診斷或急診分流；推薦碼需逐一點選才會加入清單。
- **外科導引**：外傷、傷口、膿瘍、疝氣與術後追蹤等常見情境。
- **點任何代碼**加入就診清單，同時跳出相關代碼（臨床關聯＋同類目）供連鎖加選。
- 灰色虛線代碼為類目碼（不可申報），點了不會加入清單。

### 就診清單

- **排序**：桌機可拖曳換序，也可用 `Alt+↑`／`Alt+↓`；任一版面都能按「主」把該碼設為主診斷（移到第一位）。
- **貼入 HIS**：預覽框顯示的字串就是複製出去的字串，可選每行一碼／逗號分隔／碼＋名稱三種格式；
  剪貼簿被瀏覽器擋下時會跳出可手動全選複製的後備視窗。
- 點清單裡的代碼可單獨複製該碼。
- 清單**不跨診次保留**，重新整理即清空。
- **連 Ctrl+V 都想省掉**：[`tools/his-paste.ahk`](tools/his-paste.ahk) 是一支 AutoHotkey 常駐小程式，
  游標點進 HIS 疾病碼欄位後按 F9 就把代碼逐一打進去。瀏覽器碰不到原生視窗，這一段只能由 OS 層補；
  用法、四道安全守門與可調參數見 [`tools/README.md`](tools/README.md)。

### 調整各區塊高度

區塊之間的細線可以**拖曳**改變上下兩區的高度（滑鼠、觸控都可以；聚焦後用 `↑`／`↓` 也行）：

| 版面 | 可調的分界 |
| --- | --- |
| 桌機工作台 | 中欄的搜尋結果區、右欄的就診清單區 |
| 側掛窄欄 | 部位區、相關疾病區、清單區 |
| 手機 | 相關碼區、清單抽屜 |

高度會分版面各記各的（窄欄調的不會套到工作台），並存在瀏覽器本機。
每個區塊都有最小高度、也不會把其他區塊擠出視野；要復原就按**設定 → 回復預設高度**。

### 常用列（工作台版面）

工作台版面頂端有一條常用列，可一鍵重加常用代碼；側掛窄欄與手機版面空間有限，不顯示這一條。

- **我的最愛**：在就診清單按 ★ 收藏（三種版面都能按），永遠排在常用列最前面。
- **最近使用**：自動記錄最近 8 個用過的代碼。

最愛、最近使用、日夜主題、桌機版面偏好、各區塊高度與複製格式會存在瀏覽器本機（localStorage）；
localStorage 被停用時工具照常運作，只是不跨診次記住。**不會儲存任何病人資料。**

### 全庫延遲載入

開機只載入精選面板（544 個代碼），全庫 96,802 筆（其中可申報葉碼 73,681 筆）在開機後閒置
時或第一次搜尋時才解壓建索引。載入狀態顯示在設定面板底部；全庫還沒好之前搜尋只會回精選
面板的結果，並在結果區明講。

## 瀏覽器需求

- **Edge / Chrome 80 以上**：全庫解壓需要 `DecompressionStream`。版本過舊時精選面板仍可用，
  設定面板會說明全庫無法載入。
- **側掛窄欄的「置頂」需 Edge / Chrome 116 以上**（Document Picture-in-Picture）。不支援或被
  瀏覽器擋下時只會顯示提示，不會進入假的置頂狀態。

## 開發

```bash
python build/fetch_data.py    # 下載健保署官方 xlsx（2023 版，115.05.06 更新）
python build/convert.py       # 轉 data/codes.min.json 與來源 metadata
python build/build.py         # 組裝 dist/icd10.html（內嵌字型與資料，assert_offline 守門）
python build/inventory.py     # 產生 docs/clinical-content-inventory.md（臨床內容驗收清單）

python -m pytest -q           # Python 測試：資料完整性／精選碼／建置／三套版面 E2E
node --test tests/logic.test.mjs tests/state.test.mjs tests/data.test.mjs   # 純邏輯單元測試
```

`tests/conftest.py` 會在測試開始前自動跑一次 `build/build.py`，所以改完 `src/` 直接跑
pytest 即可，測到的一定是最新的 dist。

原始碼在 `src/`，由 `build/build.py` 依序串成單一 HTML：

| 檔案 | 職責 |
| --- | --- |
| `logic.js` | 純函式核心（搜尋、格式化、葉碼判斷），無 DOM |
| `state.js` | 單一 store：狀態、action、localStorage 持久化 |
| `data.js` | 精選內容與全庫索引的存取層、延遲載入 |
| `render-shared.js` | 三套版面共用的 DOM 建構與區塊更新（chip、清單、設定面板…） |
| `render-wide.js` / `render-dock.js` / `render-mobile.js` | 三種版面各自的骨架與更新對照表 |
| `interactions.js` | document 層事件委派（版面重建也不會漏解事件） |
| `app.js` | 啟動、依視窗寬度決定生效版面、把狀態變動轉成區塊重繪 |
| `styles/` | `industry`（設計系統）→ `app`（共用元件）→ `wide` / `dock` / `mobile` |
| `curated/` | 人工整理的面板、快選與相關碼 JSON |

**開發依賴**：Python 3.8+、Node.js 18+、`pip install openpyxl pytest playwright`，另需執行
`python -m playwright install chromium` 安裝 E2E 使用的瀏覽器。

## 字型與授權

介面標題與代碼使用 **Barlow** 與 **Barlow Condensed**，以 Latin 子集（5 個 woff2，約 108 KB）
內嵌成 data: URI，因此完全離線也能正確顯示。兩個字族皆為
Copyright 2017 The Barlow Project Authors，依 **SIL Open Font License 1.1** 使用，授權全文見
[`assets/fonts/OFL.txt`](assets/fonts/OFL.txt)。中文不內嵌字型，走系統字型堆疊（微軟正黑體、
蘋方等），以免單檔膨脹到數十 MB。

## 資料來源與授權

診斷碼資料來自衛福部健保署「2023年中文版ICD-10-CM/PCS(正式版)(115.05.06更新)」官方 Excel，取自[健保署網站](https://www.nhi.gov.tw/ch/lp-3847-1.html)，依《政府資料開放授權條款》使用。轉檔時定點修正了 10 筆原始檔錯字（詳見 `build/convert.py` 的 `TYPO_FIXES`）。

精選面板與關聯表為人工整理，僅供快速選碼參考；申報前請依臨床實況確認。

## 免責

本工具僅輔助選碼，不構成醫療或申報建議；最終診斷碼以醫師判斷與健保署現行規範為準。
