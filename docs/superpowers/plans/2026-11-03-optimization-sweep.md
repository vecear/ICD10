# 2026-11-03 全面優化計畫

**目標：** 一次處理六個面向的稽核發現（程式碼結構、效能、測試、診間可用性、資料時效與文件、打包交付），
不加新功能、不推翻已裁定的設計。每項都有實測證據（`檔案:行號` 或量到的數字），
稽核原始報告與量測腳本留在當次 session 的 scratchpad，重點已抄進本檔。

**基準（HEAD `9962a49`，2026-11-03 量）：**

| 項目 | 數字 |
| --- | --- |
| pytest 全套 | 667 過、3 略過、**1 失敗**（`test_every_wide_header_control_is_the_same_size`：Date 鈕加進 header 但測試清單沒補）；22 分 06 秒（六個稽核 agent 同時跑 Playwright，偏高） |
| node 單元測試 | 13 檔全過，毫秒級 |
| `dist/icd10.html` | 3,054,240 bytes，全庫資料佔 50.2% |
| `診間包.zip` | 20.77 MiB，閘門 22 MiB，餘裕 1.23 MiB |
| 全庫載入 | 2.3 秒；期間最長 long task 331～786 ms（打字會卡） |
| 搜尋 | 純函式 25～55 ms ＋ debounce 150 ms，最後一鍵到結果 190～220 ms |
| 側掛全展開 | 508 ms，其中 `fitDockRows` 353 ms |

## 立場與取捨

稽核一共列了 50 多條。下面是「做／不做／留給使用者」的裁定，理由各一句。

**做（本次全部完成）：** 見後面四個工作流。

**不做（有理由，不是遺漏）：**

- 全庫資料改前綴差分省 487 KB：診間開本機檔，zip 才 1.65 MB，收益只在寄送。
- 工作台單一面板局部更新：24～58 ms 低於可感門檻，而且要拆三版面共用的骨架。
- 六個浮層骨架與入口鈕工廠化：要動六個功能換 100 行，等第七個浮層再做。
- 拆 `mount`／`createStore` 長函式：它們是 closure 容器，拆了只是行數好看。
- `build.py` 三個 check 改成 schema 表驅動：錯誤訊息是給維護者看的臨床語意，表驅動會變空泛。
- E2E 上 CI 擋部署：headless 下 PiP 測試會整批 skip、毫秒閾值在共用 runner 上假紅。
- `pytest-xdist` 平行：所有 E2E 讀同一份 dist，conftest 每個 worker 各建一次會互相覆寫。
- 刪 `industry.css` 疑似未用的 45 行：vendored 檔，檔頭寫請勿手改。
- 慢病出處在窄欄改成換行：176px 下逐字折行多 2,809px。
- 側掛 CCr 改雙欄：2026-09-07 才定案的版面。
- 把兩份教材 PDF 整份拿掉、拆第二個 zip、抽頁子集：前者是使用者的選擇，後兩者會讓頁碼引用與同層路徑失效。
- AutoHotkey 參數拆成 ini：要在真機 HIS 測，不在這次範圍。

**判斷性選擇（我做了決定，驗收時請特別看）：**

| 編號 | 決定 | 理由 |
| --- | --- | --- |
| J1 | 教材 PDF 只做**無損**瘦身（`subset_fonts`），麻疹核心教材第 11 頁不點陣化 | 點陣化會丟掉該頁文字層，無損版已夠把餘裕拉開 |
| J2 | 側掛清單上限 120 → 160px | 120 是 09-07 單行時定的，09-17 改兩行後只裝得下 2.27 列，常見的 3 筆要捲 |
| J3 | 時效警告門檻：疫苗 3 個月、抗微生物給付 6、腎劑量 6、院內碼 3 | 疫苗政策變動快；院內碼跟品項檔一起月更 |
| J4 | CI 的資料與單元測試 job **擋住** Pages 部署 | 那些測試全是決定性的，紅了代表內容真的錯；診間交付走 zip 不受影響 |
| J5 | 設定→關於加一行「建置 YYYY-MM-DD · ICD-10-CM 2023 版」，不帶 git hash | 免責已裁定只放這裡，同處加一行不違反「面板內不放說明」；hash 會讓 dist 每次建置都變 |
| J6 | 主診斷那一列的「主」鈕改成隱藏但保留欄寬 | 點了回報「已設為主診斷」卻什麼都沒變，是假回饋 |
| J7 | 搜尋 debounce 150 → 80 ms | 搜尋純函式降到 10～25 ms 後，150 ms 的等待變成主要延遲 |
| J8 | 網址跳脫（`https:\/\/`）集中到 `embed_json()` 一處並寫明用途 | 原本散在三個模組、靜默繞過 `assert_offline`；集中後至少規則只有一份 |

**留給使用者（需要醫學判斷或只有你知道的事實）：**

1. 疫苗卡三張寫死的日期敘述已過期：新冠「查核日 2026-09-26 尚未開打」（10-01 已開打、50–64 歲公費 11-02 已起）、輪狀病毒「預計 2027-01-01 公費」。要重查疾管署公告才能改字。
2. 健保署 ICD-10 是否有比 115.05.06 更新的版本（網站回 403，agent 看不到）。
3. 診間信箱的實際收件上限：22 MiB 門檻是照 Gmail 25 MB 推的，醫院信箱常見 10～20 MB。
4. 許智堯講義與麻疹核心教材沒有任何問答卡引用；診間會開來看嗎？不會就可以整份不打包（再省 ~5 MiB）。
5. 更新診間包時「解壓覆蓋」會重置你改過的 `AutoHotkey64.ahk` 設定；要不要把參數拆成 ini？
6. 側掛的「日期」鈕與模式鈕只隔 4px、同為淺藍，容易當成第四個模式；要不要搬到設定旁？
7. 要不要加「跳到清單」的鍵盤快捷鍵（像 `/` 跳到搜尋框）？

## 工作流

四個工作流檔案不重疊，並行執行；第二階段三個在第一階段合併後再跑。

### WS-1 核心效能（`logic.js`、`data.js` 與其單元測試）

- [ ] `data.js:72` 的 `Uint8Array.from(bin, cb)` 改成 for 迴圈（185～298 ms → 10 ms，bytes 相同）
- [ ] `buildIndex` 分段：每 1～2 萬列讓出主執行緒一次，`data.js` 改走非同步版；同步版留給 node 測試，加「兩版索引相同」的測試
- [ ] `logic.js:22` 純 ASCII 欄位跳過 NFKC（實測英文 0 列需要改寫）
- [ ] 搜尋改長字串 indexOf ＋ 代碼前綴二分（`logic.js:54` `matches` 佔搜尋 CPU 55～62%）；側別與 `uti` 特殊詞維持逐列；加「新舊實作對 13 組以上查詢逐筆相同」的對照測試
- [ ] `logic.js` 匯出 `MIN_QUERY = 2`（第二階段才改用處）

### WS-2 render 層收斂（`interactions.js`、`render-*.js`、`state.js`、`app.js`）

- [ ] PiP 事件代打收斂：`interactions.js` 的 9 個 `document.addEventListener` 收進 `bindDocument(doc)`，`render-dock.js:561-786` 約 190 行代打刪除；補一個參數化 E2E——在 mock PiP 裡把主委派認得的每個 selector 各點一次
- [ ] `render-dock.js:331-348` `fitDockRows` 先讀完再一次寫入（353 → 63 ms）
- [ ] 三版面 `update()` 的「依 DEPS 重繪」與「捲動記憶三分支」收進 `render-common.js`（淨減約 20 行）
- [ ] 死碼：`render-chronic.js:274` `chronicSectionEl`、`interactions.js:428` `chooseAllRegions`、`state.js:146` `oneOf`、兩處 `copiedTimer`
- [ ] `render-vaccine.js:22-38`、`render-antimicrobial.js:9-20` 的捲動還原：rAF 與 `setTimeout` 併掛，提早 return 的分支也放回旗標
- [ ] 鍵盤焦點回復：選部位、設主診斷、清空之後焦點不掉回 `<body>`（目前 1a 要 201 次 Tab 才到第 3 筆的「主」）
- [ ] `.chronic-source` 補 `title` 全文（窄欄 20 條被截斷且沒有 title）
- [ ] `app.js:90` `teardown()` 的 catch 加一行 `console.warn`

### WS-3 樣式與可用性（`src/styles/*.css`）

- [ ] 手機中文名改可換行（`mobile.css:139`；595 個碼被截斷，成本收合 +5px、全展開 +40px）
- [ ] `dock.css` 第 413、414、425、437、447、452–453、465、467 行 9px → 10px（含「可當天開藥」旗標）
- [ ] 手機 Lipid 面板補 44px：輸入框 16px 字、close／copy／reset `min-height: 44px`、勾選 label 44px；設定 popover 三顆鈕與剪貼簿設定 token 同步補
- [ ] 手機入口列六顆 `min-width: 44px`、字級統一 14px（`antimicrobial.css:64-69`、`date-calculator.css:27`）；360px 再量一次確認不折行
- [ ] Lipid 標題列 sticky（照 `renal.css:95-100`）；六個浮層關閉鈕尺寸統一（1c 一組、1b 44）；title 改「關閉（Esc）」，整屏版面不提點外面
- [ ] 側掛 `#lipid-drug` 撐滿該列（目前 48px 寬，右側空 240px）
- [ ] 側掛清單上限 120 → 160px（J2）
- [ ] 主診斷列的「主」鈕 `visibility: hidden`（J6）
- [ ] 搜尋框 `::placeholder` 給有日夜兩值的 token（目前 4.12／3.87，目標 ≥ 4.5）
- [ ] 側掛計算機性別鈕 40 → 26px 高
- [ ] 刪未用 CSS：`.group-label`、`.lipid-t2-names`、`.lipid-t2-lead`、`.lipid-drug-cover`（`app.css`／`dock.css`）；`app.css:161`、`wide.css:184` 註解的 `render-shared` 改成實際檔名
- [ ] 每項改完三版面截圖對照，確認無橫向溢出、字級與觸控目標符合硬性邊界

### WS-4 建置、打包、文件、CI（`build/*.py`、`tools/*`、`.github/`、`README.md`、`CLAUDE.md`、`render-settings.js`、疫苗 PDF）

- [ ] `build.py` 加 `embed_json()`，8 段內嵌統一跳脫 `<`（目前 5 段沒跳脫，`chronic_care.json` 有 104 個 `<`）；加「`<script>` 內不得出現 `</script` 以外的 `</`」檢查
- [ ] `build.py` 加 `_load_without_schema()`、`_fail()` 兩個 helper（同一段寫了 3 次與 5 次）
- [ ] 時效警告擴到疫苗、抗微生物給付、腎劑量、院內碼，並補掃 `riskLadder`／`drugs`／`tableTwoOnly` 的 `checked`（J3）
- [ ] `ICD_META.builtAt` 注入，設定→關於顯示建置日期與資料版本（J5）
- [ ] 兩份教材 PDF 無損瘦身（J1）：`subset_fonts()` ＋ `save(garbage=4, deflate=True)`，同步更新 `vaccine_guide.json` 兩筆 `sha256`；工具落在 `build/shrink_pdf.py`，README 寫明新增 PDF 時跑一次
- [ ] `pack_for_clinic.py`：先寫 `.tmp` 全部閘門通過才改名（超標 zip 現在會留在原位且被 git 追蹤）；說明書行號檢查改成「該行＋下一行」合併比對（`DOCK_ALSO_TOPMOST` 名稱在下一行，現在是擺設）；dist 新鮮度 watched 補 `build/*.py` 與 `疫苗/*`；單檔 PDF > 3 MB 印警告；`tests/test_pack_gates.py` 改引用 `ZIP_SIZE_LIMIT_MB` 常數並補行號檢查的測試
- [ ] `tools/診間使用說明.txt` 補一句「更新後重新雙擊啟動熱鍵，舊的 AutoHotkey 還在跑舊腳本」
- [ ] `.github/workflows/pages.yml` 加 test job：node 13 檔 ＋ 非 E2E 的 pytest；deploy `needs` 它（J4）
- [ ] README 檔案職責表補 15 檔；README 與 CLAUDE.md 的 `node --test` 改成逐檔執行、補「Windows 上 `python` 可能要寫 `py -3.14`」
- [ ] 修 `tests/test_e2e_visual_semantics.py:46` 的 `WIDE_HEADER_CONTROLS` 補 `#date-calc-btn`（基準上唯一的失敗）

### 第二階段（第一階段合併後）

- [ ] WS-5 `app.css` 490-1194 行拆成 `chronic.css`、`ccr.css`、`lipid.css`，`STYLESHEETS` 插在 `app` 之後 `wide` 之前；去掉分隔註解後 dist 的 `<style>` 逐位元組相等
- [ ] WS-6 `MIN_QUERY` 取代 8 處寫死的 `2`；debounce 150 → 80（J7）
- [ ] WS-7 測試瘦身：`wait_for_timeout` 57.7 秒（dock 77 處、e2e_test 49 處）改成 `expect` 重試或 `expect_page`；a11y 4 條、pane 5 條、`no_duplicate_ids` 三版面各抄一份改成 `tests/e2e_common.py` ＋ 參數化；conftest 提供 session 級 browser（context 仍 module 級）；`e2e_test.py:254,259` 效能閾值改成 `ICD_PERF_STRICT=1` 才強制；`dock_flow.py:88,134`、`navigation.py:239`、`dock.py:376-408` 的 `nth()` 改 `data-code`；測前測後各量一次全套耗時

### 第三階段：驗證與交付

- [ ] 血脂品項重抓（`fetch_lipid_products.py`，已漏 10、11 月兩次月更，12-02 起會警告）；建置失敗（院內碼對不到）就還原並回報
- [ ] 全套 pytest、13 個 node 測試、`build.py`、`pack_for_clinic.py` 全綠
- [ ] 另派 fresh-context agent 讀實際檔案驗收：逐條對本檔勾選項核對
- [ ] 每個工作流一個 commit，合併至 `main` 並推送；本檔歸檔到 `docs/superpowers/archive/`
