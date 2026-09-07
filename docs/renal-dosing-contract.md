# 抗菌藥腎功能劑量資料契約

資料檔 `src/curated/antibiotic_dosing.json`，建置後為 `window.ANTIBIOTIC_DOSING`。
頂層 `{version:1, reviewedOn:"YYYY-MM-DD", source:{name,url,updatedOn}, drugs:[...]}`。

藥物：`{id,name,aliases:[],className,sourceUrl,notes:[],regimens:[]}`。
方案：`{id,label,route,notes:[],requiresTdm:boolean,renal:[],dialysis:{ihd:[],capd:[],crrt:[],sled:[]}}`。
方案可另附 `source:{name,url,updatedOn,reviewedOn,note?}`，供不同章節的給藥／監測依據使用；未提供時沿用頂層來源與審閱日期。來源須通過 Sanford／UpToDate 指定 HTTPS 主機及日期驗證。`updatedOn:null` 僅在附有說明的 `note` 時接受，顯示「未提供日期」，不可把審閱日當成原文更新日。
若透析與非透析使用不同來源，可另附同格式 `dialysisSource`；透析區顯示其來源連結、日期與註記，底部仍顯示非透析表的方案來源。Ceftazidime 的非透析表來自使用者提供的 UpToDate 截圖，透析資料保留 Sanford 歸屬。
每個 renal 列：`{label,min:null|number,max:null|number,minInclusive:boolean,maxInclusive:boolean,dose,note?,manual?:boolean}`；null 代表無界。
透析列：`{label,dose,note?,manual?:boolean}`，保留適用條件，不依 CCr 自動選出某個 CRRT 流速或透析膜。
文字為整理後的劑量事實與繁體中文說明，保留劑量單位與必要英文。
方案可附 `renalMetric:'crcl'|'crcl-indexed'`，省略時沿用原始 CCr；不接受未支援的指標。Acyclovir 指定 crcl-indexed，原表多種劑量的列保留 manual，其餘可依校正值判定。此變更不自動換算總 mg。透析列為空代表提供來源未涵蓋，不能外推非透析 <10 的劑量。

純函式模組 `ICDRenal`（CommonJS 與 browser UMD）：
- `searchDrugs(data, query)` 回傳符合 name / aliases / className 的 drugs，大小寫不敏感、trim，可多字詞。
- `recommend(regimen, {crcl,bsa?,renalState})` → `{status,message,rowIndex}`；status 為 matched / needs-input / unstable / dialysis / manual / gap。成人專用，不另以年齡驗證使用資格。renalState 為 stable / aki / ihd / capd / crrt / sled；空白必須 needs-input。stable 使用未四捨五入、有限且非負 crcl。crcl-indexed 另需有限且正的 bsa，以 crcl × 1.73 / bsa 比較；缺 BSA 回 needs-input，不能退回原始 CCr。TDM 方案及 manual 列不得回傳 matched。透析不使用 CCr。
- `rowIndex` 無適用列為 null；TDM 可帶符合 CCr 列索引供對照，但不可當成已確認處方。

來源以整數印出的範圍可能有缺口；不擅自補齊（例如 20–49 與 >50 的 49–50），顯示需核對來源。若多列重疊亦不自動選。
CCr 原模組新增 `crclRaw` 不影響既有 `crcl` 顯示與其他欄位。
CCr 有效結果另回傳 `bsaRaw` 與 `crclIndexedRaw`（缺有效身高時為 null）。Mosteller BSA＝sqrt(heightCm × 實際 weightKg / 3600)，校正 CCr＝crclRaw × 1.73 / bsaRaw，不取整後判定。UI 每次更新覆寫 BSA，清空身高／病人時不沿用前值；目前區間若含多種劑量只顯示來源選項。其他使用 GFR、eGFR 或不明單位且標記 manual 的資料不因 BSA 功能而解鎖。
端點比較僅容許 `2 × Number.EPSILON × max(|CCr|, |端點|)` 的浮點尾差；例如公式產生的 `15.000000000000002` 視同 15。這不是依顯示值取整，`15.0000000001` 仍保留為真正的小數差。

介面為 CCr 下方獨立 DOM 元件 `ICDRenalUI.create()` / `update(root, result)` / `reset(root)`。
用藥方案與腎功能情境使用具名 `role="group"` 包含原生 button 標籤，`aria-pressed` 表達唯一選中項目，不再建立這兩項 select。多方案初始未選，單方案預選；腎功能預設 stable。未改變的選項在病人更新時保留 DOM 與焦點，事件可隨 PiP 搬移。標籤完整換行，手機至少 44px 高。
腎功能選單依序僅有 `stable`（穩定非透析）、`ihd`（IHD）、`crrt`（CRRT）、`capd`（CAPD），建立元件及清除時預設 `stable`。使用者切換透析後，更新病人輸入不會覆寫其選擇。AKI／SLED 不在選單中；底層原始資料及判定防護保留。純判定 API 仍拒絕缺漏或無效情境，不替呼叫端補值。
搜尋、藥物、方案、腎功能情境保持於本次 DOM，不存 localStorage。選定藥物方案與腎功能情境即可查成人表，不要求病人年齡或 CCr。多方案必須明選；單方案可預選。未完成 CCr 計算的非透析查詢自動展開完整表格；有有效 CCr 才標示符合列。年齡仍是 Cockcroft–Gault 公式必填值，不以預設年齡代算。透析結果必須標明其條件。搜尋與選藥固定在元件上方，窄欄禁止橫向捲動。各事件綁在元件上可隨 DOM 移入 PiP。
