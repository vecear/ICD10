# VAC 診間問答擴充計畫

使用者要求每種疫苗都能查到種類、時程、適用情況、禁忌及診間常見問題，並保留問題預設收合。依既有持續授權直接執行，不另等候中間設計確認。既有文字修訂與未追蹤的疫苗海報保留。

## 成果與範圍

- 以台灣接種建議為主，補充資料須標明地區、文件版本與適用範圍。查核日為 2026-09-26。
- 每個疫苗分類涵蓋七項：種類與差異、適用對象、時程、漏打補種、禁忌／暫緩、特殊情況、接種後反應。相關問題可同時歸入數個主題。
- 保留現有 14 個疫苗分類，增加卡介苗、輪狀病毒、Hib、小兒麻痺、狂犬病、黃熱病、傷寒與腸病毒 A71。白喉／破傷風／百日咳分類同時涵蓋兒童與成人製劑。
- 共通問題補上過敏與昏厥、免疫抑制治療、孕哺、血液製劑、同時接種、未知紀錄、旅遊、暴露後處置及接種後警訊。
- 不宣稱涵蓋所有罕見情境，也不加入自動個人化處方或接種日期計算。不同來源有差異時保留區別，不自行合併成單一規則。

## 實作

- [x] 逐項核對本機 PDF、目前疾管署公告及必要的第一方補充資料；建立離線查核摘要與 SHA-256。已公告但尚未生效的政策須明確標註生效日。
- [x] 先加入失敗測試：七項主題覆蓋、主題與疫苗交集搜尋、無效主題拒絕、重要時程／禁忌及來源對照。
- [x] 擴充 `src/curated/vaccine_guide.json`，新增 `topics` 及每張卡的 `topics`。沿用單一疫苗分類、答案、注意事項、來源與頁碼欄位。
- [x] `src/vaccine.js` 的 `search(guide, query, group, topic)` 增加主題篩選；三參數舊呼叫維持原行為。
- [x] `src/render-vaccine.js` 在捲動區加入「問題主題」按鈕，與疫苗分類及文字搜尋取交集。清除與關閉時重設，搜尋／篩選後問題仍收合。
- [x] `build/vaccine_data.py` 驗證主題與覆蓋關係；來源新增主機只允許精確的第一方 HTTPS 網域。
- [x] 更新既有測試中固定 27 題／15 區的舊預期，以資料分類與使用行為檢查代替固定題數；保留既有臨床回歸案例。
- [x] 三種版面與真實 PiP 操作、引用 PDF 抽查、全套 Node、相關 Python 測試，並人工逐卡比對來源；測試通過不能代替醫學查證。
- [x] 更新使用說明及來源／覆蓋紀錄，備份 ZIP 後重建、打包，核對 HTML、來源、說明及 ZIP 內容。

## 驗證指令

```powershell
node --test tests/vaccine.test.mjs
py -3.14 -m pytest -q tests/test_vaccine_data.py tests/test_e2e_vaccine.py --tb=short
node --test tests/*.test.mjs
py -3.14 -m pytest -q tests/test_build.py tests/test_pack_gates.py --tb=short
py -3.14 -X utf8 build/build.py
py -3.14 -X utf8 tools/pack_for_clinic.py
```

實作與查核紀錄放在 `.review/vac-expansion/`；完整臨床覆蓋與來源摘要另納入 `docs/reviews/`。

完成紀錄：`docs/reviews/2026-09-26-vac-expansion.md`。最終為 22 類、141 題、54 份來源；204 項 Node 與 64 項相關 Python／瀏覽器測試通過，診間 ZIP 已重建並核對。
