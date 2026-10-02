# 抗微生物給付速查實作計畫

目標：將官方第十節有效條文製作為可離線搜尋、展開與複製的面板。
架構：JSON 保存摘要及完整條文，純 JavaScript 處理搜尋與有效期間，DOM 模組沿用既有浮層；Python 建置與打包檢查來源完整性。
技術：Python、原生 JavaScript、Node test、pytest、Playwright。於 codex/antimicrobial-coverage 分支實作，不自動 commit 或發布。

- [x] 官方資料：下載第十節 PDF；依條號完整分段，保留原文、頁碼、最新修訂生效日及來源 SHA-256。檢查刪除條文與跨頁文字；產出 src/curated/antimicrobial_coverage.json 與可重跑的 build/import_antimicrobial.py。
- [x] TDD 搜尋：先建立 tests/antimicrobial.test.mjs，驗證藥名優先、學名／商品名／縮寫／條號、複數關鍵字、分類、未生效版、複製引用。執行 node --test tests/antimicrobial.test.mjs 確認失敗，加入 src/antimicrobial.js 後確認通過。
- [x] TDD 建置：先建立 tests/test_antimicrobial_data.py，驗證條號完整、來源雜湊、頁碼、資料欄位、引用及原文一致，加入 build/antimicrobial_data.py 與 build/build.py 內嵌資料／模組。執行 python -m pytest tests/test_antimicrobial_data.py -q。
- [x] TDD 面板：先建立 tests/test_e2e_antimicrobial.py；加入 src/render-antimicrobial.js、src/styles/antimicrobial.css，將入口／面板／同步器接到三套 renderer，state.js 的開關與既有面板互斥。驗證 1440、390、340、176px 與 PiP 搜尋、篩選、複製、Esc、來源及無水平溢出。
- [x] 交付：更新 README.md、健保條文/README.md，tools/prepare_pages.py 與 tools/pack_for_clinic.py 納入新來源；新增 Pages 完整性回歸測試。執行 node --test tests/*.test.mjs、python -m pytest -q、python tools/pack_for_clinic.py，核對 zip HTML 與 PDF 雜湊。
- [x] 審查：檢查 git diff，抽查 linezolid、ceftazidime/avibactam、cefiderocol、posaconazole、HBV/HCV 條文與官方 PDF，一致後回報產物及驗證界線。

## 交付驗證紀錄

- 官方第十節 PDF：24 頁，完整索引 72 個條號（60 條有效規定、12 個標題或已刪除條號）；原文逐條與 PDF 擷取文字比對。
- Node 回歸：227 項全數通過。Python 非瀏覽器回歸：185 項全數通過。
- Playwright 採分批回歸；已確認工作台、390px 手機、340/176px 側掛、真實 PiP、複製及失敗時的手動複製、長條文展開與跨版面閱讀位置。
- 回歸修正：給付資料排除於 ICD 選碼掃描；新增入口納入原有按鈕契約；縮回手機時工具列不撐大 layout viewport；390px 工具列維持 54px、176px 側掛維持 58px。
- 最新診間包：63 個檔案、21,758,059 bytes；ZIP 的 HTML 與 dist 相同，官方 PDF SHA-256 相同；本地 Pages 準備 61 個檔案，HTML/PDF 內容比對通過。
- Git：工作開始前已同步 origin/main（f29774e），開發分支 codex/antimicrobial-coverage；無 commit、push 或 production deploy。

- 完整 Python 回歸以互不重複的分批清單完成 660 項：185 項非瀏覽器 + 95 項工作台（66 + 28 通過、1 略過）+ 176 項其餘前段（175 通過、1 略過）+ 82 項手機／導航／新功能（81 通過、1 略過）+ 122 項後段（104 先通過、18 視覺測試更新入口契約後通過）。合計 657 通過、3 略過；472 項瀏覽器測試通過。三個略過均因慢病資料沒有同時帶 effectiveTo/effectiveFrom 的換版條目。
- 最後 CSS 修正後再驗證 13 項新功能及 1 項 176px 側掛工具列：14 項全數通過；git diff --check 通過。
