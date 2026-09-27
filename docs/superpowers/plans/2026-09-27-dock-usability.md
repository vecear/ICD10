# 側掛窄欄操作改善

使用者已授權六項改善直接實作完成。本輪不提交、推送或更動 AHK 熱鍵。

目標：保留密集配置與自動複製，減少搜尋、辨認診斷、連續加選、重送清單的操作成本。
架構：沿用共用邏輯、三版面 render 與既有 store。VAC 瀏覽記憶只留於本次執行期間；收藏沿用現有本機儲存。

## 工作與驗收

- [x] 搜尋：在 `tests/search-workflow.test.mjs` 先驗證「蜂窩 右」、英文多詞、UTI 不誤中單字片段、代碼相容及精選池降級；修改 `src/logic.js`，沿用 `src/data.js` 共用搜尋介面，保留既有排序與 total。加入搜尋側別縮小條件。
- [x] 辨識：E2E 驗證 176／340／565px 長名稱無截斷、短項目仍可並列。修改 `src/render-dock.js` 與 `src/styles/dock.css`；搜尋側別文字加強辨識，不刪適用條件。
- [x] 剪貼簿：E2E 先重現清單→日期後標記仍已同步；改 `src/interactions.js` 與 `src/render-common.js`，共用狀態區可重送完整清單。覆蓋拒絕寫入、單碼／計算機／VAC 複製、空清單與 PiP；不得聲稱 HIS 收到或監測外部剪貼簿。
- [x] 個人常用：側掛分類區新增 ★ 入口，收藏固定排序、最近使用分開列，可直接選碼並調整收藏順序；更新 `src/state.js` 與 renderer。驗證收藏持久化、切版面及無水平溢出。
- [x] 鍵盤：共用搜尋結果反白、上下鍵、Enter、Shift+Enter、非輸入區 `/`；中文組字不攔截，浮層和 PiP 不誤觸。E2E 覆蓋三種版面與 PiP。
- [x] 查閱記憶：VAC 關閉重開與切版面保留 query／group／topic／展開／捲動，清除可重設，重新載入不保留。先補 E2E 再修改 `src/render-vaccine.js`；不延長個案數值存續。
- [x] 整合：Node 單元測試、Python 完整測試；真實離線 HTML 與 PiP 操作、日夜／窄寬截圖抽查，核對個案欄位未被額外保存。
- [x] 交付：更新 README、診間使用說明與密度記錄，執行 `py -3.14 build/build.py`、`py -3.14 tools/pack_for_clinic.py`，核對 dist／診間包／zip 內容一致與既有未追蹤海報保留。

## 查閱文件

- https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing
- https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
- https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText

## 驗證紀錄

- Node：215 個測試通過，0 失敗。
- 新操作回歸涵蓋三版面、中文組字、側別篩選輸入競態、剪貼簿寫入順序／失敗、收藏排序與全庫延遲載入。
- VAC 相關針對性測試：22 通過；查閱記憶只保存在 closure，不加入 store 持久化鍵。
- 真正 PiP 已操作鍵盤加選、收藏、日期覆寫與完整清單重送；另有 PiP 的 `/` 與 IME Escape 回歸案例。
- 176／340／565px × 日夜前後量測：固定區高度不變、中文名稱裁切歸零、無水平溢出；完整名稱增加的捲動量已記錄於密度文件。
- 1440px 工作台、390px 手機與三種窄欄日夜截圖已抽查；瀏覽器檢查未出現 pageerror 或外部 HTTP(S) 請求。
- 完整 Python 測試：614 通過、3 略過、1 項舊測試定位失敗（853.51 秒）。該測試的全域 selector 撞到新常用標題，已限定 `#dock-panels`；整組側掛動線重測 14 通過（13.36 秒）。因此 618 個案例中，615 個已取得通過結果、3 個略過；沒有未處理的失敗。完整測試與重測原始紀錄分別保留，未宣稱第二次完整執行。
- 3 項略過均因 `chronic_care.json` 目前沒有同時帶 effectiveTo／effectiveFrom 的換版案例，保留既有條件。
- 最終 build 通過零外部參照檢查；診間包重新產出，ZIP 21,409,347 bytes。62 個 ZIP 檔案均與工作區／打包檔案逐位元組比對一致，VAC 54 份來源與 4 份健保 PDF 齊全。
- dist、診間包與 ZIP 內 HTML 的 SHA-256 相同：`700419ff92d542c1d169cb9192e9b1be8c3e7f0467c2f6d9085fa577a50fdbb1`。
- 直接開啟診間包內 HTML，UTI／N39.0 與「蜂窩 右」搜尋通過，無 pageerror；既有未追蹤海報仍保留。
- `git diff --check` 通過。
- AHK 腳本未改動；本機無法驗證實際 HIS 接收 F9 的結果。
