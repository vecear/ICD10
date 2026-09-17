# ICD-10 臨床模式與身體部位導引 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox - [ ] syntax for tracking.

**Goal:** 將離線 ICD-10 工具改為「內科急診／內科門診／外科」三模式，讓內科症狀依身體部位快速篩選，並在點擊症狀碼後顯示常見診斷與急診優先排除提醒。

**Architecture:** 保留目前 vanilla JS、Python build pipeline、gzip+base64 單檔輸出與既有清單／搜尋／家族相關碼邏輯。新增兩份以 body region → symptom panel → chief/diagnoses/redFlags/related 組成的 curated 資料，build.py 驗證後注入 window.CURATED；logic.js 提供純函式合併相關碼，app.js 負責模式、部位導覽與卡片渲染。

**Tech Stack:** HTML/CSS、vanilla JavaScript、Node built-in test runner、Python 3.8+、pytest、Playwright。

## Global Constraints

- UI 與所有文案使用繁體中文台灣用語。
- 內科急診紅旗只作「優先排除／提醒醫師評估」，不自動加入清單、不做分流決策。
- 每個新增 curated code 必須存在於官方全庫且 USE=1；建置遇到不存在或非葉碼時失敗。
- 保留搜尋、就診清單、三種複製格式、外科面板、離線 file:// 使用方式。
- 新功能採 TDD：先寫會因現行程式缺功能而失敗的測試，再寫最小實作。
- 不 commit、不 push；完成後保留工作區修改供使用者檢視。

---

### Task 1: 內科模式資料與 build-time schema validation

**Files:**
- Create: src/curated/internal_emergency.json
- Create: src/curated/internal_outpatient.json
- Create: src/curated/emergency_quick.json
- Delete: src/curated/symptoms.json
- Modify: build/build.py
- Modify: tests/test_build.py
- Modify: tests/test_curated.py

**Interfaces:**
- window.CURATED.internalEmergency 與 window.CURATED.internalOutpatient 都是 region array；region 是 {name, panels}。
- symptom panel 是 {name, chief, diagnoses, redFlags?, related}；code pair 是 [code, label]。
- window.CURATED.emergencyQuick 是 [code, label][]。

- [ ] **Step 1: 先寫 failing tests**

在 tests/test_build.py 加入：

~~~python
def test_build_embeds_three_clinical_modes():
    html = DIST.read_text(encoding="utf-8")
    match = re.search(r"window\.CURATED = (\{.*?\});", html)
    assert match
    curated = json.loads(match.group(1))
    assert {"internalEmergency", "internalOutpatient", "emergencyQuick"} <= set(curated)
    assert curated["internalEmergency"][0]["panels"][0]["chief"]
    assert curated["internalEmergency"][0]["panels"][0]["redFlags"]
    assert "redFlags" not in curated["internalOutpatient"][0]["panels"][0]
~~~

更新 tests/test_curated.py，遞迴檢查兩份 internal JSON 的每個 region/panel 不重複。

- [ ] **Step 2: 確認測試先失敗**

Run:

~~~powershell
python -m pytest tests/test_build.py::test_build_embeds_three_clinical_modes tests/test_curated.py -v
~~~

Expected: FAIL，因現行 build 沒有三個新 key。

- [ ] **Step 3: 建立資料**

以現有 symptoms.json 已通過全庫驗證的代碼重新分組，建立：

| 模式 | 身體部位 | 症狀 |
|---|---|---|
| 急診 | 全身／感染 | 發燒／寒顫 |
| 急診 | 神經／頭頸 | 頭痛、頭暈／眩暈 |
| 急診 | 胸肺／心臟 | 胸痛／心悸、呼吸困難 |
| 急診 | 腹部／消化 | 腹痛、噁心嘔吐、腹瀉 |
| 急診 | 泌尿／生殖 | 排尿症狀、血尿 |
| 急診 | 皮膚／軟組織 | 皮疹／搔癢 |
| 急診 | 肌肉骨骼 | 背痛／頸痛、關節痛 |
| 門診 | 全身／感染 | 發燒／寒顫、疲倦／體重減輕、淋巴結腫大 |
| 門診 | 神經／頭頸 | 頭痛、頭暈／眩暈、失眠／情緒、眼／耳 |
| 門診 | 胸肺／心臟 | 咳嗽／感冒、呼吸困難、胸痛／心悸、水腫 |
| 門診 | 腹部／消化 | 腹痛、腹瀉、噁心嘔吐、便秘／排便異常 |
| 門診 | 泌尿／生殖 | 排尿症狀、血尿 |
| 門診 | 皮膚／軟組織 | 皮疹／搔癢 |
| 門診 | 肌肉骨骼 | 關節痛、背痛／頸痛、肢體麻木 |
| 門診 | 代謝／檢驗 | 檢驗異常 |

每張卡把症狀 R-code 放到 chief，把常見疾病放到 diagnoses；急診才放 redFlags。例如胸痛卡使用 R07.9/R00.2、I20.9/K21.9/R00.0，並把 I20.9 作優先排除提醒。每個 chief code 的 related 內容列出該卡常見診斷。emergency_quick.json 放 A41.9、J18.9、N10、K35.80、K81.0、E86.0、L03.90 等急診常見評估碼，寫入後由全庫測試驗證。

- [ ] **Step 4: 修改 build.py**

CURATED_KEYS 加入：

~~~python
"internal_emergency.json": "internalEmergency",
"internal_outpatient.json": "internalOutpatient",
"emergency_quick.json": "emergencyQuick",
~~~

擴充 _iter_curated_codes，走訪 internal 的 chief、diagnoses、redFlags、related key/value 與 emergencyQuick；門診出現 redFlags 時拋出 ValueError。保留既有 curated 檢查。

- [ ] **Step 5: 執行資料與建置測試**

Run:

~~~powershell
python -m pytest tests/test_build.py::test_build_embeds_three_clinical_modes tests/test_build.py::test_build_rejects_non_leaf_curated_code tests/test_curated.py -v
~~~

Expected: PASS；若新增代碼不是葉碼，修正 JSON，不放寬驗證。

### Task 2: 相關碼合併純邏輯

**Files:**
- Modify: src/logic.js
- Modify: tests/logic.test.mjs

**Interfaces:**
- mergeRelated(base, extra) 接受兩個可為 undefined 的 code arrays，回傳保留先後順序且去重的 array。
- browser window.ICDLogic 與 Node module.exports 都暴露 mergeRelated。

- [ ] **Step 1: 先寫 failing test**

~~~javascript
test('mergeRelated 合併人工與症狀推薦並去重', () => {
  assert.deepEqual(
    logic.mergeRelated(['I20.9', 'K21.9'], ['K21.9', 'R00.0']),
    ['I20.9', 'K21.9', 'R00.0']
  );
  assert.deepEqual(logic.mergeRelated(undefined, ['A41.9']), ['A41.9']);
});
~~~

- [ ] **Step 2: 確認先失敗**

Run: node --test tests/logic.test.mjs

Expected: FAIL，因 logic.mergeRelated 尚未存在。

- [ ] **Step 3: 寫最小實作**

在 src/logic.js 加入：

~~~javascript
function mergeRelated(base, extra) {
  const out = [];
  const seen = new Set();
  for (const code of [...(base || []), ...(extra || [])]) {
    if (!seen.has(code)) {
      seen.add(code);
      out.push(code);
    }
  }
  return out;
}
~~~

加入最後的 return object，不把 DOM 或 cart 狀態放進 logic.js。

- [ ] **Step 4: 驗證**

Run:

~~~powershell
node --check src/logic.js
node --test tests/logic.test.mjs
~~~

Expected: syntax check 與全部 Node tests PASS。

### Task 3: 三模式、部位導覽與症狀卡 UI

**Files:**
- Modify: src/template.html
- Modify: src/app.js
- Modify: tests/e2e_test.py

**Interfaces:**
- Template ids：mode-er、mode-op、mode-surg、region-nav、panels、quick、related。
- Region button 帶 data-region；symptom card 帶 data-panel；分組 classes 為 symptom-card、chief-group、diagnosis-group、redflag-group。
- mode 值為 emergency、outpatient、surg；預設 outpatient。
- renderInternalPanels(modeData) 顯示目前部位；renderRelated(code) 合併 existing related 與模式 related。

- [ ] **Step 1: 先更新 E2E**

將 mode switch 測試改成：

~~~python
def test_mode_switch(page):
    reset(page)
    expect(page.locator("#mode-op")).to_have_class(re.compile(r"active"))
    expect(page.locator("#panels-title")).to_contain_text("內科門診")
    expect(page.locator("#region-nav button")).to_have_count(8)
    page.click("#mode-er")
    expect(page.locator("#panels-title")).to_contain_text("內科急診")
    expect(page.locator("#region-nav button")).to_have_count(7)
    expect(page.locator(".redflag-group")).to_be_visible()
    page.click("#mode-surg")
    expect(page.locator("#panels-title")).to_contain_text("外科")
    expect(page.locator("#region-nav")).to_be_hidden()
    page.click("#mode-op")
    expect(page.locator("#panels-title")).to_contain_text("內科門診")
~~~

新增：

~~~python
def test_symptom_shows_related_diagnoses_without_auto_adding(page):
    reset(page)
    page.click("#mode-er")
    page.click('[data-region="胸肺／心臟"]')
    card = page.locator('.symptom-card[data-panel="胸痛／心悸"]')
    expect(card.locator(".chief-group .chip[data-code='R07.9']")).to_have_count(1)
    card.locator(".chief-group .chip[data-code='R07.9']").click()
    expect(page.locator("#cart li[data-code='R07.9']")).to_have_count(1)
    expect(page.locator("#related .chip[data-code='I20.9']")).to_have_count(1)
    expect(page.locator("#cart li[data-code='I20.9']")).to_have_count(0)
    expect(card.locator(".redflag-group")).to_be_visible()
~~~

更新外科 E2E 只修改內科 selectors，保留 mode-surg、外科快選與面板加入。

- [ ] **Step 2: 確認先失敗**

Run:

~~~powershell
python -m pytest tests/e2e_test.py::test_mode_switch tests/e2e_test.py::test_symptom_shows_related_diagnoses_without_auto_adding -v
~~~

Expected: FAIL，因現行 template 沒有三模式、region-nav、symptom-card。

- [ ] **Step 3: 修改 template CSS 與骨架**

template.html 要：

- 以 mode-er「內科急診」、mode-op「內科門診」、mode-surg「外科」取代舊內科按鈕。
- 在 panels card 加入 region-nav 與 role=tablist，保留 panels 動態 host。
- 以 symptom-grid 建立兩欄 grid，symptom-card 使用緊湊 padding；max-width 700px 時改單欄。
- region button、mode button、chip 保留 active 與 focus-visible 樣式；redflag-group 使用琥珀色提示。
- related-wrap 標題改為「相關評估碼」，手機點擊症狀後可捲到該區。

- [ ] **Step 4: 修改 app.js**

1. mode 預設 outpatient，新增 activeRegion。
2. collectCuratedCodes 遞迴收集 internal 的 chief、diagnoses、redFlags、related key/value 與 emergencyQuick。
3. flattenSymptomRelated(C) 產生 code → codes map。
4. renderInternalPanels 先畫部位按鈕，再畫目前 region 的 symptom cards；每卡依序畫 chief、diagnoses、急診 redFlags。
5. renderRelated 使用 window.ICDLogic.mergeRelated(existingRelated, symptomRelated)，再接 family 結果；推薦碼不直接放入 cart。
6. emergency 快選使用 emergencyQuick + pathogens；outpatient 使用 chronic + infectious + pathogens；surg 使用 surgicalQuick + pathogens。
7. setMode 更新三個 active 狀態、標題、region nav 與 quick；切換不清 cart。
8. wire 綁定三個模式與 region-nav，init 呼叫 setMode('outpatient')。

- [ ] **Step 5: 執行新增 E2E**

Run:

~~~powershell
python build/build.py
python -m pytest tests/e2e_test.py::test_mode_switch tests/e2e_test.py::test_symptom_shows_related_diagnoses_without_auto_adding -v
~~~

Expected: 2 tests PASS；若相關碼沒有出現，檢查 flattenSymptomRelated 與 card related key。

### Task 4: 文件、產物與完整回歸

**Files:**
- Modify: README.md
- Modify: dist/icd10.html
- Modify: tests/e2e_test.py
- Modify: tests/test_build.py

**Interfaces:**
- README 說明三模式、部位導覽與紅旗僅為提醒。
- dist 只由 python build/build.py 重新產生。

- [ ] **Step 1: 補產物與手機 smoke tests**

在 tests/test_build.py 確認產物包含 內科急診、內科門診、外科、region-nav、symptom-card，且無 %DATA%、%SCRIPTS%、http://、https://。

在 tests/e2e_test.py 加入手機 viewport，確認 region-nav 可見、symptom-card 單欄、點擊後相關評估碼可見。

- [ ] **Step 2: 更新 README**

補充：急診優先排除是供醫師複核的提示，不是自動診斷或急診分流；推薦碼需由醫師逐一點選才加入清單。

- [ ] **Step 3: 重建並完整驗證**

依序執行：

~~~powershell
python build/fetch_data.py
python build/convert.py
python build/build.py
python -m pytest tests/ -v
node --check src/logic.js
node --check src/app.js
node --test tests/logic.test.mjs
git diff --check
~~~

Expected：fetch 在目前 manifest 時 skip；convert/build exit 0；Python 與 Node 全部 PASS；git diff --check 無錯誤。

- [ ] **Step 4: 瀏覽器實際檢查**

使用 Playwright 開啟 HTTP 與 file:// 版本，確認預設門診、急診部位與紅旗、症狀點擊後相關診斷可見但未自動進 cart、外科既有流程、桌面雙欄與窄視窗單欄。

- [ ] **Step 5: 交付前檢查**

確認修改檔案在工作區、data 依 .gitignore 管理、無 .tmp；回報測試數量、產物大小與未 commit/push 狀態。
