# 執行進度

## 2026-09-07
- 使用者已登入 Sanford Guide；確認登入成功並開始查閱。
- 已由 Sanford 正常可見各藥 View 整理 50 藥／61 方案，另查 Teicoplanin、Colistin、Levofloxacin、Cefoperazone-sulbactam 藥頁的 loading／途徑／成分與限制。
- 本任務前的窄欄介面變更仍未提交，必須保留。
- 新增結構化資料、來源驗證、純判定與共用 CCr 元件，未儲存憑證或病人資料。
- 純邏輯測試先失敗再實作；整合測試抓到 root instance 接線錯誤並修正。
- 正式資料整合 E2E 13 項通過（含真實 PiP、raw CCr、清除、AKI／TDM／不同單位、四種尺寸與手機觸控）。
- Python 全套首輪：428 passed、3 skipped、4 failed。修正新藥物資料被舊 ICD 掃描器誤當代碼，以及三個新測試的錯誤契約／fixture 前提。
- 修正與來源註記補齊後，重跑所有受影響的資料、建置、ICD 掃描、renal 元件與正式整合測試：97 passed。Node 全套：153 passed。沒有未解決的測試失敗。
- 獨立審查完成；Teicoplanin／Pip-tazo／Ciprofloxacin／Amoxicillin 等註記已依原文補清。
- 新版 `dist/icd10.html`、`診間包/`、`診間包.zip` 已重建。ZIP 3,432,984 bytes，內含 8 檔；HTML、說明與 4 PDF 逐檔比對相同，內嵌 50 藥／61 方案與 JSON 一致。
- HTML SHA-256：`63d3016d5cefcff334ae889128acaefaa8769d52a4c2817021fe21b85971297e`。舊 ZIP 備份留於 `.review/renal/診間包-before-renal.zip`。
- 未 commit、push 或寄送。瀏覽器查閱產物排除版控；使用者帳號保持由本人登入，不留憑證到程式。

## 成人專用查表調整
- 依使用者要求移除查表與 recommendation API 的年齡門檻。選定藥物方案與情境即可查成人表及透析對照；非透析且尚無 CCr 時自動展開完整表。
- CCr 計算公式仍需年齡，不代填；無有效結果不標示個人化劑量。介面不再儲存或傳遞年齡到查表模組。
- TDD：未填資料的五種情境 E2E 先出現 5 failed，純邏輯的無年齡案例亦先失敗；實作後相關 Python 測試 94 passed、Node 全套 153 passed（含真實 PiP 查表與補填後更新）。
- 已重建離線 HTML 並重新打包；ZIP 中 HTML、使用說明及四份 PDF 比對通過。舊 ZIP 備份：`.review/renal/診間包-before-adult-lookup.zip`。

## Amikacin once-daily／延長間隔
- 已登入查核 Amikacin 藥頁（2026-08-06）及 Aminoglycosides, Overview（2026-07-22）；新增獨立延長間隔方案，保留傳統方案，共 50 藥／62 方案。
- 納入 15–20 mg/kg、q24／36／48h 腎功能分段、60 分鐘輸注、給藥體重及首劑濃度監測。15 mg/kg 才有來源明示的濃度除以 2 nomogram 換算；20 mg/kg 保留個別評估。
- 新增方案級來源驗證及連結／日期，切換方案時顯示對應依據。
- TDD：新增資料／來源測試先 4 failed，再實作後相關 Python 87 passed、Node 105 passed。真實介面驗證未填年齡查表、切換方案、TDM 與來源日期。
- 已重新建置與打包，內嵌資料及 ZIP 的 HTML、使用說明、四份 PDF 比對通過。HTML SHA-256：`6f926fd6134df3be190ade73e325c2c11c0bd02b291bb433db3f857eb5bddb93`；ZIP 3,433,564 bytes。
- 舊 ZIP：`.review/renal/診間包-before-amikacin-daily.zip`。未 commit 或 push。

## Ceftazidime 改依 UpToDate 截圖
- 非透析腎功能表改為原劑量 1 g q8h／2 g q8h 兩個方案，共 50 藥／63 方案。依使用者提供截圖逐列轉錄，未將缺漏更新日當成審閱日；截圖未涵蓋的透析資料保留原 Sanford 值及獨立來源。
- 新增 UpToDate 來源主機、來源日期未知的附註驗證、透析來源區塊。資料與驗證測試先 4 failed 再實作。
- 真實 CCr 15 案例抓到浮點尾差造成缺口，新增失敗單元測試後修正端點比較；容差僅限二進位浮點誤差，真正小數缺口不補齊。
- 最終 Python 107 passed、Node 全套 156 passed。340px 操作截圖確認兩個原劑量方案、腎功能表與透析來源顯示；另從舊 ZIP 比對其他 49 藥及原透析資料均未變動。
- 已重建與打包；ZIP 3,434,425 bytes，HTML SHA-256：`7534ba5da44b3dfe6bf9dbda41ee9889393c56e26a7f237b6c96e2605f58af39`。內嵌資料、使用說明與四份 PDF 比對通過。
- 舊 ZIP 備份：`.review/renal/診間包-before-ceftazidime-uptodate.zip`。未 commit、push 或發布。

## Acyclovir 依 UpToDate 截圖新增
- 原資料未收錄 acyclovir，新增 3 個 PO、2 個 IV 方案，總計 51 藥／68 方案。保留原表劑量選項、mL/min/1.73 m² 單位、神經毒性提醒與未完整顯示的註腳說明；透析未提供，不外推。
- 所有列依單位差異設為 manual。同步修正全表需人工核對方案的空白病人提示，避免誤稱填完 CCr 就會標示劑量。
- 資料測試及提示文字 E2E 均先失敗再實作；最終相關 Python 109 passed、Node 全套 157 passed。340px 截圖確認 PO／IV 查表與單位提醒，其他 50 藥資料逐項與前版相同。
- 已重建並更新診間包；HTML、內嵌資料、使用說明與 4 PDF 的 ZIP 比對通過。HTML SHA-256：`7f138ce9ae560c1b16b6e4afb89585aafb21c9c1f15eb5a9dc39d4faf996a5a3`；ZIP 3,435,231 bytes。
- 舊 ZIP 備份：`.review/renal/診間包-before-acyclovir-uptodate.zip`。未 commit、push 或發布。

## 腎功能情境預設穩定、非透析
- 建立元件與清除時預設 stable；更新病人輸入仍保留使用者手動選擇的 AKI／透析情境。
- 新增真實介面測試先失敗後實作。相關 E2E 首輪 75 passed、1 failed；失敗來自舊測試預期需另選情境，依新預設更新後該測試通過。涵蓋初始選項、直接查表、透析後重填、清除與 PiP。
- 已重建並打包，51 藥／68 方案不變。ZIP 與 HTML、說明、PDF 比對通過；HTML SHA-256：`6bddeab520f51e28f3a49a3b500d152ce2300e38c0b77aa20e87d0b54401862a`。舊 ZIP：`.review/renal/診間包-before-default-stable.zip`。

## 腎功能選單精簡為四項
- 依序僅顯示穩定非透析、IHD、CRRT、CAPD，移除空白提示、AKI、SLED 選項；預設與清除仍為 stable。底層資料與判定邏輯未改動。
- 選項名稱與順序的 E2E 先失敗再修改，相關介面測試 72 passed，含真實 PiP、清除及透析查表。
- 已重建並打包，51 藥／68 方案。ZIP 3,435,194 bytes；HTML SHA-256：`dc7ad88366d14ffd3cb0d714ff2e5da776bb9e8f38291908ebad124d4b480f28`。ZIP 內 HTML、說明與 PDF 比對通過。
- 舊 ZIP：`.review/renal/診間包-before-four-contexts.zip`。未 commit、push 或發布。

## 用藥方案與腎功能情境改為標籤
- 將兩項 select 替換成具名群組與原生 button，選中標籤以 aria-pressed、邊框與底色表示。多方案仍須明選、單方案預選，情境維持四項及 stable 預設。
- 長方案完整換行；340px 四個情境可同列，176px 自動換行，手機標籤至少 44px 高。更新相同方案保留按鈕 DOM 與焦點，支援鍵盤及真實 PiP 搬移。
- 新增點擊／鍵盤／無橫向溢位測試先失敗再實作，將既有查表測試遷移為真實標籤 click。視覺檢查抓到原欄位 flex-basis 造成標題 78px 高，先加失敗測試再縮限樣式作用範圍。
- 最終介面測試 76 passed；176／340／390px 截圖檢查通過，整份藥物資料與前版一致。
- 已重建、打包並驗證 HTML／說明／4 PDF。ZIP 3,435,788 bytes；HTML SHA-256：`6a33f54768fa847713fbe154bcf1b3106351b25bcc81120db355ea3937f71237`。
- 舊 ZIP：`.review/renal/診間包-before-chips.zip`。未 commit、push 或發布。

## BSA 與校正 CCr 自動計算
- 新增 Mosteller BSA（身高與實際體重），有效 CCr 結果附 bsaRaw、crclIndexedRaw；缺身高仍保留原 CCr。校正方向為原始 CCr × 1.73 / BSA，保留完整精度。
- 方案 renalMetric 明確區分 crcl／crcl-indexed；acyclovir 改用後者。缺 BSA 不退回原 CCr；UI 提供補填身高、原始／校正值與本表單位。原表多種口服劑量的列保留人工判斷並顯示該區間來源選項。
- 公式與判定測試先 4 failed 後實作；補填身高按鈕亦先失敗後實作。最終 Node 全套 161 passed，相關 Python 116 passed，含清空身高／Cr、換藥指標、原表替代劑量與真實 PiP。
- 176／340／390px 實際操作與畫面檢查通過；acyclovir 劑量數字、區間與透析資料未改動，其餘 50 藥資料逐項相同。
- 已建置與打包；51 藥／68 方案，ZIP 3,437,015 bytes。HTML SHA-256：`65007bd3eb7e3756acb3dd90f4067b45c99a93d9289f126c5d6491ee4868d5a9`；ZIP 的 HTML／說明／4 PDF 比對通過。
- 舊 ZIP：`.review/renal/診間包-before-bsa.zip`。未 commit、push 或發布。

## 建議結果框改紅色
- 依截圖指定，僅將目前建議結果框改為淡紅底／紅邊，深色主題使用深紅底／淺紅邊。
- 340px 窄欄實際切換淺／深主題並擷取畫面，確認配色與既有劑量結果正常。CSS 外未改動計算或資料。
- 已重建並更新診間包，HTML／說明／4 PDF 比對通過。舊 ZIP：`.review/renal/診間包-before-red-result.zip`。
