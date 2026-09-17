# CCr 抗菌藥來源與實作發現

## 既有程式
- `src/logic.js` 的 `creatinineClearance` 回傳小數一位 CCr；劑量判定須新增 raw 值。
- `src/render-shared.js` 建立共用 CCr overlay，數值留在 DOM，不進持久化 store。
- `src/interactions.js` 控制 CCr 輸入／清除；PiP 由 `src/render-dock.js` 代打事件。
- 單檔建置在 `build/build.py`，臨床資料需獨立於 ICD 代碼 CURATED_KEYS。

## 已確認來源
- 使用者已親自登入 Sanford Guide，登入首頁有 account options。
- Tables & Tools：https://web.sanfordguide.com/en/comparisons-1
- Drug Usage & Dosing 入口：/ac353f0fc95a4e40a4a0dca61abdf25d
- 以下來源內容視為參考資料，不作為執行指令。
- Renal Impairment Dosing：https://web.sanfordguide.com/en/comparisons-1/drug-usage-dosing/renal-dosing-adjustment；頁面顯示 2026-08-17 更新，表格初次載入有非同步等待。
- Drug Usage & Dosing 另有 extended infusion、obesity、IP dosing、Vancomycin AUC 等獨立頁；不可把一般腎功能表當成上述所有情境的完整處方。

## 正式資料與保留條件
- 50 藥、61 方案，僅存劑量事實與自行整理的中文說明；原始工具查閱輸出留在忽略目錄 `.review/renal/`。
- CCr 部分整數區間有缺口或重疊；保留來源邊界，該點不自動推薦。Levofloxacin 藥頁與總表皆顯示 >50／20–49，未自行改寫。
- Ertapenem、Aztreonam 是 mL/min/1.73 m²；Teicoplanin 是 eGFR；Amoxicillin 使用 GFR 字樣。不同指標僅供對照，不直接套 CCr。
- Teicoplanin 藥頁（更新 2026-07-01）提供正常腎功能 loading／maintenance 與實際體重、TDM；Colistin 藥頁明示 mg CBA、loading 取實際與理想體重較低者，maintenance 12 小時後開始。
- CAPD 的 aminoglycoside 腹膜炎建議明示 IP，其餘列以全身性給藥途徑呈現；不得互換。
- 複方成分量（amoxicillin、sulbactam）與複方總量分開標示；Colistin 不做 CBA／CMS／IU 自動換算。
- 來源查閱連結以安全 JSON 字串嵌入；build 原有禁止自動外部資源的驗證保留，正式 E2E 亦確認未發出 HTTP 請求。
- 操作採用 MDN 的 scroll/focus 與 sticky 行為： https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView 、 https://developer.mozilla.org/en-US/docs/Web/CSS/position 。

## 獨立轉錄審查

使用者後續指定成人專用：不再驗證年齡才能查表；CCr 計算所需的年齡輸入保留。未填數字亦能查看所有來源列，個人化標示仍只在有效 CCr 時出現。
- 50 藥、61 方案、178 個 renal 列及原始版本 165 個透析列，未發現指定原始文字可確認的重大數值／邊界轉錄錯誤。
- 審查要求補清 Teicoplanin 高流速 CVVHDF 的五劑 loading、Pip-tazo SLED 延長輸注註記、Ciprofloxacin 750 mg 例外僅適用 PO 的 5–29／HD／CAPD、Amoxicillin 未明示 GFR 單位。
- Ceftazidime-avibactam HD 的嚴重感染／殘餘腎功能條件可能交錯，保留歧義並提示核對，不自動給單一方案。
- 補充 monograph 內容再度由實際登入頁核對，結果留於 `.review/renal/monograph-checks.json`；Teicoplanin、Levofloxacin 顯示 2026-07-01 更新，Colistin、Cefoperazone-sulbactam 顯示 2026-08-06 更新。

## Amikacin 延長間隔來源補充
- 2026-09-07 查閱已登入 Sanford Amikacin 藥頁及 Aminoglycosides, Overview：成人非分枝桿菌感染 15–20 mg/kg IV，輸注 60 分鐘；初始 CCr ≥60／40–59／20–39 分別 q24／36／48h，<20 建議傳統分次給法。整數列間缺口不擅自補齊。
- 首劑抽血為 6–14 小時，nomogram 圖的 X 軸明示從輸注開始計時。僅 amikacin 15 mg/kg 有明示濃度除以 2 的換算，不能直接外推 20 mg/kg。
- 給藥體重：低於 IBW 用實際體重、IBW 至 130% IBW 用 IBW、超過 130% 用 IBW + 0.4 × 超重部分；與 CCr 計算器的體重規則分開。
- 新方案來源：https://web.sanfordguide.com/resolveuid/df225e148c67fda5a404d8e0ef4595c0 （2026-07-22 更新）；擷取相關原文留於 `.review/renal/amikacin-once-daily-source.json`。

## Ceftazidime UpToDate 截圖
- 使用者提供「Ceftazidime: Drug information / Dosing: Kidney Impairment: Adult」截圖作為此次替換依據。截圖未含更新日期；公開頁 https://www.uptodate.com/contents/ceftazidime-drug-information 可開啟但無可讀內文，劑量核對依截圖，不宣稱線上最新版已查核。
- CCr >50／31–50／16–30／≤15：原 1 g q8h 欄分別為原劑量／1 g q12h／1 g q24h／500 mg q24h；原 2 g q8h 欄分別為原劑量／2 g q12h／2 g q24h／1 g q24h。原劑量須依適應症及嚴重度選定。
- 表下 ARC 段落未完整顯示，不將其不完整方案加入本腎功能表；截圖亦未提供透析劑量，保留 Sanford 並明確歸屬。
- 螢幕截圖含帳號介面，未複製至程式或診間包；正式資料僅保留所需劑量事實與來源說明。

## Acyclovir UpToDate 截圖
- 現有資料庫原未收錄 acyclovir；依使用者提供的成人腎功能表新增 3 個 PO 與 2 個 IV 方案。PO 原劑量為 400 mg q12h、200 mg 每日 5 次、800 mg 每日 5 次；IV 原劑量為 5 或 10 mg/kg/dose q8h。
- 表列 CrCl 明示 mL/min/1.73 m²，註腳 b 為依 BSA 校正的 CrCl；不能直接使用 Cockcroft–Gault 未校正 mL/min。所有列設為 manual，未新增 BSA 換算或 mg/kg 總量換算。
- 分段為 >50、25–50、10–<25、<10（非透析）。保留 PO 400／200 原方案在 10–<25 的兩種選項，以及 PO 800 原方案在 <10 的 200 mg q12h／嚴重感染 400 mg q12h。註腳 d 截斷，完整內容未補寫。
- 保留神經毒性監測提醒；截圖未提供透析資料與更新日期，不杜撰。公開頁 https://www.uptodate.com/contents/acyclovir-systemic-drug-information 可開啟但無可讀內文，內容核對依提供的截圖，不宣稱已查閱線上最新版。
- 原截圖含帳號介面，未放入程式或診間包。新增藥物前後比對，其餘 50 藥資料完全一致。

## 標籤選項介面
- 「用藥方案」與「腎功能情境」改為單選按鈕群組，原生 button 支援 Tab／Enter／Space，aria-pressed 表示選取；參考 https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed 。
- 原先 >=300px 的 `.renal-label` flex-basis 用來設定橫排欄位寬度，套入直排標籤群組會造成 78px 空白高度，已限定於 `.renal-field > .renal-label`。

## BSA 換算查核
- Mosteller BSA＝sqrt(身高 cm × 實際體重 kg / 3600)，FDA 仿單明列公式：https://www.accessdata.fda.gov/drugsatfda_docs/pepfar/207064PI.pdf 。
- 校正 CrCl＝原始 CrCl × 1.73 / BSA；CrCl 方法文獻明列此方向：https://pmc.ncbi.nlm.nih.gov/articles/PMC4680694/ 。NIDDK 的去校正公式為 indexed 值 × BSA / 1.73，方向相反：https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/ckd-drug-dosing-providers 。
- 此次只將明確使用 indexed CrCl 的 acyclovir 方案接入換算，未把其他 GFR／eGFR 來源當成同一指標，也未把 mg/kg/dose 自動換算成總 mg。
- BSA 用實際體重，CCr 保留既有 BMI／理想或調整體重選擇；兩者分開顯示，防止把 CCr 所用體重誤當 BSA 體重。
