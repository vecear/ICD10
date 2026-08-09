# ICD-10 相關疾病完整化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將內科症狀導引中的相關診斷改為明確、較完整的常見疾病清單，並讓點擊主訴後的相關區同步呈現這些疾病而不自動加入就診清單。

**Architecture:** 以現有兩份內科 curated JSON 為唯一臨床內容來源，把混合症狀碼與疾病碼的 `diagnoses` 欄位改為只放疾病／病況碼的 `diseases`。`app.js` 只負責渲染分層與將 `related` 合併到既有推薦流程；`build.py` 與 Python 測試負責官方葉碼驗證，前端 E2E 驗證點擊與清單行為。

**Tech Stack:** vanilla JavaScript、HTML/CSS、Python 3.8+、pytest、Node built-in test runner、Playwright。

## Global Constraints

- 所有介面與資料標籤使用繁體中文台灣用語。
- `diseases` 只放常見疾病／病況碼；單純主訴或症狀碼留在 `chief`，急診高風險提醒留在 `redFlags`。
- 每個 `diseases` 代碼必須存在於目前離線官方 ICD-10 資料且為 `USE=1` 葉碼。
- 每個內科 panel 的每個 `chief` 都必須有非空 `related`，且推薦疾病不自動加入 cart。
- 急診 `redFlags` 僅作醫師評估提醒，不做自動診斷、風險分數或分流決策。
- 保留搜尋、cart、複製、外科模式、手機版與 `file://` 流程。
- 不 commit、不 push；保留目前工作區與既有未提交變更。

---

### Task 1: 先建立疾病 schema 與互動的 failing tests

**Files:**
- Modify: `tests/test_curated.py`
- Modify: `tests/test_build.py`
- Modify: `tests/e2e_test.py`

**Interfaces:**
- 內科 panel 使用 `diseases`、`chief`、`redFlags?`、`related`。
- 卡片疾病群組使用 `.disease-group`，文字為「常見相關疾病」。
- 點擊 `R05.9` 後，右側至少可找到 `J00`、`J06.9`、`J20.9`、`J18.9`，但 cart 不得因此出現這些推薦碼。

- [x] **Step 1: 寫 schema failing test**

在 `tests/test_curated.py` 增加測試，對 `internal_emergency.json` 與 `internal_outpatient.json` 的每個 panel 驗證：

```python
def test_internal_curated_modes_have_complete_disease_layers():
    for filename in ("internal_emergency.json", "internal_outpatient.json"):
        groups = json.loads((CURATED_DIR / filename).read_text(encoding="utf-8"))
        for region in groups:
            for panel in region["panels"]:
                assert panel.get("diseases"), f"{filename}/{panel['name']} 缺少 diseases"
                assert len(panel["diseases"]) >= 4, f"{filename}/{panel['name']} 疾病不足四項"
                chief_codes = {code for code, _ in panel["chief"]}
                disease_codes = [code for code, _ in panel["diseases"]]
                red_flag_codes = {code for code, _ in panel.get("redFlags", [])}
                assert len(disease_codes) == len(set(disease_codes))
                assert not chief_codes.intersection(disease_codes)
                assert not red_flag_codes.intersection(disease_codes)
                assert set(panel["related"]) == chief_codes
                assert all(panel["related"][code] for code in chief_codes)
                assert "diagnoses" not in panel
```

在 `tests/test_build.py` 的 curated assertion 中增加 `diseases`，並把 HTML marker 檢查加入 `常見相關疾病`。

在 `tests/e2e_test.py` 增加疾病呈現與不自動加入測試：

```python
def test_symptom_shows_multiple_related_diseases_without_auto_adding(page):
    reset(page)
    page.click("#mode-op")
    page.click('[data-region="胸肺／心臟"]')
    card = page.locator('.symptom-card[data-panel="咳嗽／感冒"]')
    expect(card.locator(".disease-group")).to_contain_text("常見相關疾病")
    expect(card.locator(".disease-group .chip")).to_have_count(8)
    card.locator(".chief-group .chip[data-code='R05.9']").click()
    for code in ("J00", "J06.9", "J20.9", "J18.9"):
        expect(page.locator(f"#related .chip[data-code='{code}']")).to_have_count(1)
        expect(page.locator(f"#cart li[data-code='{code}']")).to_have_count(0)
```

- [x] **Step 2: 執行 targeted tests 確認是預期失敗**

```powershell
python -m pytest tests/test_curated.py::test_internal_curated_modes_have_complete_disease_layers tests/test_build.py::test_build_embeds_three_clinical_modes tests/e2e_test.py::test_symptom_shows_multiple_related_diseases_without_auto_adding -v
```

Expected：schema test 因現有 panel 沒有 `diseases` 而失敗；若測試因 selector 或語法錯誤失敗，先修正測試本身再進入 production code。

### Task 2: 擴充並遷移內科疾病資料

**Files:**
- Modify: `src/curated/internal_emergency.json`
- Modify: `src/curated/internal_outpatient.json`
- Modify: `build/build.py`
- Modify: `tests/test_curated.py`

**Interfaces:**
- `internal_emergency.json` 與 `internal_outpatient.json` 保留既有 region/panel/chief/related 結構。
- 每個 panel 將 `diagnoses` 改名為 `diseases`，移除其中的 R-code 症狀／檢驗碼。
- `build._iter_internal_codes()` 遍歷 `chief`、`diseases`、`redFlags`、`related` key/value；門診資料出現 `redFlags` 仍要失敗。

- [x] **Step 1: 將既有欄位改為 diseases 並補齊各主訴 related**

保留既有臨床內容，並依下列實際代碼擴充；每一列的代碼都先以 `data/codes.min.json` 驗證：

| 主訴類型 | 常見疾病／病況碼 |
|---|---|
| 發燒／寒顫 | `A49.9`, `B34.9`, `J06.9`, `J11.1`, `J18.9`, `U07.1`, `A09` |
| 頭痛 | `G43.909`, `G44.209`, `I10`, `D64.9`, `F41.9` |
| 頭暈／眩暈 | `H81.10`, `H81.20`, `I95.1`, `D64.9`, `E86.0` |
| 咳嗽／感冒 | `J00`, `J06.9`, `J20.9`, `J18.9`, `J44.1`, `J45.901`, `J30.9`, `K21.9` |
| 呼吸困難 | `J18.9`, `J44.1`, `J45.901`, `I50.9`, `J69.0`, `J84.9` |
| 胸痛／心悸 | `I20.9`, `K21.9`, `I50.9`, `I10`, `F41.9`, `I49.9` |
| 腹痛 | `K29.70`, `K21.9`, `K80.20`, `K35.80`, `K81.0`, `K85.90`, `K56.609`, `K92.2` |
| 噁心嘔吐 | `K21.9`, `K29.70`, `K52.9`, `A09`, `E86.0`, `K56.609`, `K85.90` |
| 腹瀉 | `A09`, `K52.9`, `A08.4`, `K58.0`, `A04.72`, `E86.0` |
| 便秘／排便異常 | `K58.9`, `K56.609`, `K64.9`, `E03.9`, `K59.09` |
| 排尿症狀 | `N39.0`, `N30.00`, `N40.1`, `N10`, `N20.0`, `N18.9` |
| 血尿 | `N20.0`, `N30.00`, `N39.0`, `N18.9`, `N40.1` |
| 皮疹／搔癢 | `L50.9`, `L30.9`, `B02.9`, `L03.90`, `A46`, `L27.0` |
| 關節痛 | `M10.9`, `M06.9`, `M19.90`, `M17.9`, `M11.20` |
| 背痛／頸痛 | `M54.16`, `M51.26`, `M47.816`, `M48.061`, `M19.90` |
| 肢體麻木 | `G62.9`, `G56.00`, `E11.9`, `M54.16`, `N18.9` |
| 檢驗異常／代謝 | `E11.9`, `I10`, `E03.9`, `E79.0`, `N18.9`, `D64.9` |

若某候選碼在本機資料不是葉碼，改用同一臨床類別中已存在且為葉碼的代碼，不放寬 build 驗證。急診 `redFlags` 保留並補充目前已存在的 `A41.9`、`R65.20`、`I21.9`、`I26.99`、`K35.80`、`K81.0`、`K56.609`、`E86.0`、`L03.90` 等高風險提醒；一般疾病與紅旗不得重複。

每個 `chief` 的 `related` 至少列出該主訴最相關的 4 個 `diseases`，急診可再加對應 `redFlags`。不將所有疾病清單無差別複製到每個主訴。

- [x] **Step 2: 修改 build.py 的 schema walker**

將：

```python
for field in ("chief", "diagnoses"):
```

改為：

```python
for field in ("chief", "diseases"):
```

並保留 `redFlags`、`related` 的驗證與門診禁用紅旗檢查。

- [x] **Step 3: 執行 curated/build targeted tests**

```powershell
python -m pytest tests/test_curated.py tests/test_build.py -v
```

Expected：所有 curated code 通過官方葉碼驗證；若候選碼不存在或非葉碼，修正資料後重新執行。

### Task 3: 將前端疾病層接入既有推薦流程

**Files:**
- Modify: `src/app.js`
- Modify: `src/template.html`

**Interfaces:**
- `collectCuratedCodes()` 收集 `diseases`。
- `renderInternalPanels()` 使用 `panel.diseases` 與 class `.disease-group`。
- `renderRelated()` 繼續合併人工 `CURATED.related` 與 `symptomRelated`，推薦碼不呼叫 `add()`。

- [x] **Step 1: 在 schema 測試通過後修改 app.js**

完成以下最小改動：

```javascript
for (const field of ['chief', 'diseases', 'redFlags']) addPairs(panel[field] || []);
```

並把：

```javascript
renderCodeGroup(card, '常見相關診斷', panel.diagnoses, 'diagnosis-group');
```

改為：

```javascript
renderCodeGroup(card, '常見相關疾病', panel.diseases, 'disease-group');
```

同步把 `renderRelated()` 的群組文字改為「常見相關疾病／評估（${code}）」；不改變既有 `addToCart`、去重、家族碼與手機捲動行為。

- [x] **Step 2: 更新 template 的疾病文案與樣式**

保留既有 `.symptom-card` grid、`.chief-group`、`.redflag-group` 與 responsive CSS，補上 `.disease-group` 與新標題文字；疾病 chip 使用既有可申報／類目 disabled 樣式，不新增另一套點擊邏輯。

- [x] **Step 3: 重建並跑新增 E2E**

```powershell
python build/build.py
python -m pytest tests/e2e_test.py::test_symptom_shows_multiple_related_diseases_without_auto_adding -v
```

Expected：測試看到多個疾病 chip，點擊主訴只加入主訴，相關疾病留在推薦區。

### Task 4: 文件、產物與完整回歸

**Files:**
- Modify: `README.md`
- Modify: `dist/icd10.html`
- Modify: `tests/test_build.py`
- Modify: `tests/e2e_test.py`

**Interfaces:**
- README 說明「常見相關疾病」與「急診優先排除」的差異。
- `dist/icd10.html` 只能由 build script 產生，不手動修改內嵌資料。

- [x] **Step 1: 補文件與 build artifact assertion**

README 加入：相關疾病是供醫師評估後逐一點選的建議，不代表自動診斷；急診紅旗是提醒，不會自動加入清單。`tests/test_build.py` 追加 `diseases` 與 `常見相關疾病` marker，並維持 placeholder／外部 URL 檢查。

- [x] **Step 2: 重新產生離線產物**

```powershell
python build/fetch_data.py
python build/convert.py
python build/build.py
```

Expected：fetch 因來源 hash 相同而跳過下載；convert/build exit 0，且 `dist/icd10.html` 內無未替換 placeholder。

- [x] **Step 3: 執行完整驗證**

```powershell
python -m pytest tests/ -v
node --check src/logic.js
node --check src/app.js
node --test tests/logic.test.mjs
git diff --check
```

另以現有 Playwright suite 實際驗證 HTTP 與 `file://`：預設門診、急診紅旗、點擊症狀後多個疾病可見且未自動進 cart、外科流程、桌面雙欄與手機單欄。

- [x] **Step 4: 交付前核對**

檢查 `git status --short`、產物 metadata/hash、暫存檔數量與測試輸出；回報實際測試數、產物大小與未 commit/push 狀態，不捏造未執行的結果。
