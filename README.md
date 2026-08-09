# ICD-10 門診導引

單一離線 HTML 的 ICD-10-CM 選碼工具，為門診情境設計：症狀導向面板、內科／外科模式、
慢性病與感染科常用快選、相關碼連鎖推薦、就診清單一鍵複製、全庫即時搜尋。

## 使用

直接用 Edge / Chrome（80+）開啟 [`dist/icd10.html`](dist/icd10.html)，免安裝、免網路。

- **搜尋**：中文（蜂窩）、英文（cellulitis）、代碼前綴（L03 或 E119）皆可。
- **點任何代碼**加入右側「本次就診清單」，同時跳出相關代碼（臨床關聯＋同類目）供連鎖加選。
- **複製**：每行一碼／逗號分隔／碼＋名稱 三種格式。
- 灰色代碼為類目碼（不可申報），不能加入清單。

## 開發

```bash
python build/fetch_data.py   # 下載健保署官方 xlsx（7.3MB）
python build/convert.py      # 轉 data/codes.min.json
python build/build.py        # 組裝 dist/icd10.html
python -m pytest tests/ -v   # Python 測試（資料完整性/精選碼驗證/建置/E2E）
node --test tests/logic.test.mjs
```

**開發依賴**：Python 3.8+、Node.js 18+、`pip install openpyxl pytest playwright`

## 資料來源與授權

診斷碼資料來自衛福部健保署「2023年中文版ICD-10-CM/PCS(正式版)」官方 Excel，取自[健保署網站](https://www.nhi.gov.tw/ch/cp-6071-469da-3051-1.html)，依《政府資料開放授權條款》使用。轉檔時定點修正了 10 筆原始檔錯字（詳見 `build/convert.py` 的 `TYPO_FIXES`）。

精選面板與關聯表為人工整理，僅供快速選碼參考；申報前請依臨床實況確認。

## 免責

本工具僅輔助選碼，不構成醫療或申報建議；最終診斷碼以醫師判斷與健保署現行規範為準。
