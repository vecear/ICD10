# ICD-10 Repo Review 修正設計

- 日期：2026-08-09
- 狀態：已核准，進入實作

## 目標

修正 review 發現的資料版本、建置驗證、E2E 效能基準、`file://` 覆蓋與 Playwright 開發文件問題，並重新產生可交付的 `dist/icd10.html`。

## 設計

### 資料來源與下載

新增 `build/source_manifest.py` 集中管理健保署 2023 版目前修訂資訊、官方 XLSX URL、SHA-256、工作表名稱與最小檔案大小。`fetch_data.py` 以 SHA-256 判斷既有檔案是否為目前來源；不符合時下載到同一資料夾的暫存檔，通過 ZIP／XLSX／SHA-256 驗證後以 `os.replace` 原子替換，失敗時保留舊檔。

### 建置驗證與 metadata

`build.py` 讀取資料庫後，在輸出前驗證所有 curated code 都存在且 `USE=1`。驗證失敗直接停止，不產生新的 `dist`。輸出 HTML 內嵌資料版本 metadata，方便離線檔追溯來源修訂。

### 測試

- 新增下載來源判斷與格式驗證的單元測試。
- 新增 `build.py` 對不存在／非葉碼 curated entry 的失敗測試。
- 將 E2E 效能基準改為量測 `data-ready`，而非只有 `DOMContentLoaded`。
- 新增 `file://` 載入測試，保留現有 HTTP 測試以驗證剪貼簿。

### 文件

README 更新目前資料修訂版本與 `python -m playwright install chromium` 安裝步驟；歷史設計／實作紀錄不重寫，只修正現行程式與使用說明中的來源描述。

## 驗收條件

1. 現有來源檔不是目前 SHA-256 時，`fetch_data.py` 不跳過，且下載失敗不破壞舊檔。
2. `python build/build.py` 遇到無效 curated code 會失敗。
3. E2E 的效能數字代表載入完成並可互動的時間。
4. `dist/icd10.html` 可用 `file://` 載入，且所有 Python／Node／Playwright 測試通過。
5. 產物大小仍小於 6 MB，且不引入外部資源請求。
