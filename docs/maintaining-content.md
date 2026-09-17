# 內容維護手冊

這份文件收「改資料時才要看」的維護細節：官方條文 PDF、慢病速查內容
（`chronic_care.json`）、血脂品項資料（`lipid_products.json`／`hospital_lipid_codes.json`）、
抗菌藥腎功能劑量資料（`antibiotic_dosing.json`）。怎麼用工具見 [README.md](../README.md)。

## 官方條文 PDF

檔案在 [`健保條文/`](../健保條文/)，來源網址、版本日與更新步驟寫在
[`健保條文/README.md`](../健保條文/README.md)。三條機器守門，缺一份就過不了：

1. `build/build.py` 的 `check_chronic_docs()`：`docs[].file` 對不上實際檔案就**建置失敗**。
2. `build/build.py` 的 `copy_nhi_docs()`：複製一份到 `dist/健保條文/`（進 `.gitignore`），
   讓 `dist/icd10.html` 在本機與 E2E 也點得開。
3. `tools/pack_for_clinic.py`：把 `健保條文/` 整個放進診間包，並回頭核對 zip 裡真的有那幾份。

## 慢病速查內容（`chronic_care.json`）

資料在 [`src/curated/chronic_care.json`](../src/curated/chronic_care.json)，檔頭的 `_schema`
就是欄位說明（建置時會剝掉，不進 dist）。結構是 `topics[]`（`dm`／`htn`／`lipid`）→
`sections[]`（`kind`：`target` 臨床治療目標／`coverage` 健保給付規定／`caution` 實務提醒）
→ `items[]`。每條 item：

| 欄位 | 意義 |
| --- | --- |
| `text` | 一行講完的重點，畫面上直接顯示 |
| `detail` | 展開後的補充（例外、依據、容易誤讀之處），可省略 |
| `source` | 出處名稱＋條號＋版本日期。**不可放網址**——`assert_offline()` 會讓建置失敗 |
| `checked` | 本條的查證日期（`YYYY-MM-DD`）。超過 **6 個月**建置時會印醒目警告 |
| `effectiveFrom` / `effectiveTo` | 適用區間，**兩端都含當日**，可省略（省略＝該端無限） |

**改版怎麼寫**：健保署公告換版時，**不要直接改掉舊條文**——給舊版補上
`effectiveTo`（舊制最後一天），新版另開一條帶 `effectiveFrom`（生效日）。這樣公告日到生效日
之間，醫師看到的是現行的舊制＋一則「新版將於 X 日生效」的預告；生效當天自動翻版，
不需要任何人在那天去改檔案。生效日過後可以擇期把過期條文刪掉（它已經不會顯示）。

**定期重查**：`python build/build.py` 會掃所有 `checked` 日期，超過 6 個月
（`build/build.py` 的 `CHRONIC_CHECK_MAX_MONTHS`）就印出逐條警告與門檻日期。
**警告不會讓建置失敗**——過期的規定會誤導醫師，但讓建置失敗等於門診當天沒工具可用，那更糟。
重查健保署當期公告後，更新該條的 `checked`（內容沒變也要更新：那個日期的意思是
「有人在這天確認過」，不是「這天改過」）。

三個主題的 key 在 `src/state.js` 的 `CHRONIC_TOPICS` 另有一份鏡像（狀態層是零 DOM 的純模組，
讀不到資料檔）。兩邊分歧時建置會警告，`tests/test_chronic_care.py` 也會擋。

## 血脂品項資料（`lipid_products.json`與`hospital_lipid_codes.json`）

資料在 [`src/curated/lipid_products.json`](../src/curated/lipid_products.json)（約 130 KB，
611 個代碼，其中**現行給付中 241 個**：表二 116、表一 49、其他章節 76；另 370 個支付價 0
＝已停止給付，留著但標記，因為醫師打了那個代碼要看到「已停付」而不是「查無」）。由
[`build/fetch_lipid_products.py`](../build/fetch_lipid_products.py) 從兩個官方來源產生：
健保署「健保用藥品項查詢項目檔」（開放資料，**每月更新**）＋2.6.1 的「不適用表一」對照表。
`build.py` 的 `check_lipid_products()` 檢結構（代碼樣式、重複、表別值），
並在 `checked` 超過 3 個月時警告——這份比慢病速查更會過期，門檻設得比它短。

**HIS 打的是院內收費代碼，不是健保代碼**：診間畫面（OpoC200 診間批價修改作業）顯示的是
`OCRE20` 這種院內碼，原本拿著它查不出走表一還是表二。
[`src/curated/hospital_lipid_codes.json`](../src/curated/hospital_lipid_codes.json) 存這批
hosp→健保代碼的對照，`build.py` 的 `load_hospital_lipid`／`merge_hospital_codes` 在建置時
把 hosp 併進 `lipid_products.json` 品項的 `hosp` 欄位（計算機的品項列與條文分頁的「本院品項」
區塊都吃這個欄位）；對不到現行健保代碼就讓建置直接失敗，不留一個查無結果的院內碼在畫面上。
`lipid_products.json` 每月由 `fetch_lipid_products.py` 重抓，但這個對照檔是分開存、手動維護
的靜態清單——月更後若某個健保代碼消失，要回來對照 HIS 畫面改這個檔，不會自動同步。

## 抗菌藥腎功能劑量資料（`antibiotic_dosing.json`）

Amikacin 可另選 Once-daily／延長間隔方案，附腎功能間隔、60 分鐘輸注、給藥體重及首劑濃度監測說明。依 Sanford Aminoglycosides, Overview（2026-07-22 更新）核對；15 mg/kg 的 nomogram 濃度換算不能直接外推至 20 mg/kg，介面保留 TDM 判定與該章節來源連結。

Ceftazidime 非透析分段依使用者提供的 UpToDate 成人腎功能劑量截圖整理，分為原劑量 1 g q8h 與 2 g q8h 兩個方案。截圖未顯示更新日期，介面如實標示；透析部分沿用 Sanford，另附透析來源，不視為 UpToDate 劑量。

Acyclovir 依使用者提供的 UpToDate 截圖新增 3 個 PO、2 個 IV 方案，保留原表的替代劑量、嚴重感染選項及神經毒性提醒。填入身高後，計算器以身高與實際體重計算 Mosteller BSA，再將原始 CCr × 1.73 ÷ BSA，依校正 CrCl（mL/min/1.73 m²）自動分段。缺身高仍可查表並可按「補填身高」；有多種劑量選項的列保留人工判斷。截圖未涵蓋透析給法，更新日期與未完整顯示的註腳亦如實標示。

除上述 Ceftazidime、Acyclovir 截圖外，資料由登入的 [Sanford 腎功能劑量表](https://web.sanfordguide.com/en/comparisons-1/drug-usage-dosing/renal-dosing-adjustment) 各藥 View 及補充藥頁核對；總表更新日為 2026-08-17，查閱日為 2026-09-07。各方案依其來源顯示日期。各藥附原文連結；點連結才會連網且可能需要訂閱登入，試算本身離線運作。這是所列成人方案的腎功能速查，未涵蓋所有適應症、台灣所有品項或每種製劑。

**維護資料**：`src/curated/antibiotic_dosing.json`；契約：`docs/renal-dosing-contract.md`；建置驗證：`build/renal_data.py`。資料不進 ICD 精選碼驗證。來源連結以安全 JSON 字串嵌入，不是載入資源；不得加入背景抓取或登入憑證。更新資料須重查原文與條件、執行 renal 邏輯／資料／真實流程測試並重新打包。
