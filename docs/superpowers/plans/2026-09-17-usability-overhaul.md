# 可用性與整潔總體修正實作計畫

依 `docs/superpowers/specs/2026-09-17-usability-overhaul-design.md`。每階段一個 commit；同一檔案同時只有一個寫入者，
所以碰 `src/` 的階段依序執行，只碰 `tools/`、`docs/` 的階段可並行。

- [x] 階段 0：把未提交變更拆成兩個 commit（剪貼簿輸出設定／院內收費代碼反查），後者補 README 一段。規格與計畫另一個 commit。
- [x] 階段 1a（src）：通知列＋復原、勾號共用、部位短名、清單中文名兩行、側掛小鈕 20px。E2E 三版面各加斷言。
- [x] 階段 1b（tools，與 1a 並行）：打包腳本 mtime／zip 大小／`tools/README.md` 掃描三道閘門；修 tools/README 用法段；`.gitattributes`。
- [x] 階段 1c（docs，與 1a 並行）：歸檔五份舊 plan／spec 與根目錄三個規劃檔；刪 `tools/Au.*`；密度原則適用範圍改三版面。
- [x] 階段 2（src）：返回鈕三版面、placeholder 統一、工作台面板索引、手機全展開、已同步狀態。E2E 補斷言。
- [ ] 階段 3（src）：header 統一尺寸與顏色語意、手機日期鈕移位、側掛摘要 12px、清空對比、慢病浮層寬度。量測工作台前後數字寫進密度原則。
- [ ] 階段 4（src）：`syncSearchValue`、部位選單／面板工廠、切 `render-shared.js` 六檔、`clinical-format.js` 與單元測試、刪死碼與 `industry.css` 零引用 class。
- [ ] 階段 5（docs）：（5a 已做：README 決策敘事搬 `docs/decisions.md`，467→396 行）README 收斂並補新功能、`tools/診間使用說明.txt` 補新功能後重新打包。
- [ ] 階段 6：全套測試、建置、打包；全新脈絡 agent 用 Playwright 重走 UX 前五名與抽查文件；推上 GitHub。

驗證：（完成後填）
