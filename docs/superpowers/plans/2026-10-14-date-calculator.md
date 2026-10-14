# Date 日期計算器實作計畫

**目標：** 在既有工具列加入 Date，輸入日期、方向及非負整數天數後立即顯示目標日期。

**設計：** 沿用計算機浮層；起算日為第 0 天，往後滿 1 天為隔天，0 天為當天。預設起算日期為本機今天、方向為往後，天數待輸入。結果顯示西元年月日及星期。使用 UTC 日曆運算避開日光節約時間，日期限西元 0001–9999 年。不合法或超出範圍時清除結果並顯示原因。輸入僅保留於本次頁面記憶體。

**架構：** `date-calculator.js` 處理純計算；`render-date.js` 共用介面及跟隨 DOM 的事件支援 PiP；`state.js` 維持浮層互斥。三套 render 與 build 登錄新模組，獨立 CSS 延續現有配色及緊湊版面。

## 驗證與交付

- [x] 先新增並執行失敗的單元測試：前後滿天、0 天、跨月年、閏年、非法日期／天數、日期上下界。
- [x] 新增並執行失敗的 E2E：Date 入口、即時計算、清除錯誤結果、關閉與焦點、三種版面及 176px 窄欄。
- [x] 實作計算、浮層、狀態互斥與建置整合，再執行單元及 E2E。
- [x] 驗證日夜配色、跨版面輸入保留、實際 PiP 操作及無水平溢出。
- [x] 執行相關回歸測試、重建 HTML 與診間包，比對 ZIP 內 HTML 位元組。
- [x] 檢查差異並回報本機成果；本次未要求 commit 或 push。

技術文件：[MDN date input](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date)、[MDN setUTCDate](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCDate)。
