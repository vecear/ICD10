# ICD-10 Repo Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the ICD-10 data/build pipeline and test the actual offline delivery path without changing the intended clinical UI behavior.

**Architecture:** Keep the current vanilla JS application and Python build pipeline. Add one source manifest shared by fetching and build metadata, one build-time curated validator, and focused tests around those boundaries; update the tracked single-file distribution after regenerating data.

**Tech Stack:** Python 3.8+, `openpyxl`, `pytest`, Node.js `node:test`, Playwright Chromium, browser-native `DecompressionStream`.

## Global Constraints

- Preserve the single offline `dist/icd10.html` delivery model.
- Use the official NHI 2023-version XLSX revision `115.05.06` and record its SHA-256.
- Keep all user-facing text in Traditional Chinese Taiwan usage.
- Preserve the existing curated data and UI behavior unless validation exposes an invalid source entry.
- Do not commit or push unless the user explicitly requests it.

---

### Task 1: Source manifest and regression tests

**Files:**
- Create: `build/source_manifest.py`
- Test: `tests/test_fetch_data.py`
- Test: `tests/test_build.py`

**Interfaces:**
- `source_manifest.py` exports `SOURCE_VERSION`, `SOURCE_URL`, `SOURCE_SHA256`, `SOURCE_SHEET`, and `MIN_SIZE`.
- `fetch_data.py` exports `sha256_file(path)`, `is_valid_xlsx(path)`, and `is_current_source(path)` for tests and the CLI.
- `build.py` exports `validate_curated(curated, db)`.

- [ ] **Step 1: Add failing source validation tests**

```python
def test_current_source_requires_matching_hash(tmp_path, monkeypatch):
    path = tmp_path / "source.xlsx"
    path.write_bytes(b"not-an-xlsx")
    monkeypatch.setattr(fetch_data, "MIN_SIZE", 1)
    monkeypatch.setattr(fetch_data, "SOURCE_SHA256", fetch_data.sha256_file(path))
    assert not fetch_data.is_current_source(path)
```

- [ ] **Step 2: Add failing build validation tests**

```python
def test_validate_curated_rejects_missing_or_category_code():
    db = [["A00", 0, "Category", "類目"], ["A00.0", 1, "Leaf", "葉碼"]]
    curated = {"chronic": [["NOPE", "不存在"], ["A00", "類目"]]}
    with pytest.raises(ValueError, match="NOPE|A00"):
        validate_curated(curated, db)
```

- [ ] **Step 3: Run the targeted tests and verify they fail for the missing interfaces**

Run: `python -m pytest tests/test_fetch_data.py tests/test_build.py -q`

Expected: FAIL because the new source manifest/helpers/validator do not exist yet.

### Task 2: Harden download and update source data

**Files:**
- Modify: `build/source_manifest.py`
- Modify: `build/fetch_data.py`
- Modify: `build/convert.py`
- Modify: `tests/test_convert.py`

- [ ] **Step 1: Implement the source manifest and atomic download helpers**

Use the official `115.05.06` URL and measured SHA-256. Existing files are skipped only when they pass size, ZIP/XLSX, and hash checks. Downloads use a same-directory temporary file, `curl --max-time 120`, hash verification, then `os.replace`.

- [ ] **Step 2: Run the source tests and verify they pass**

Run: `python -m pytest tests/test_fetch_data.py -q`

- [ ] **Step 3: Run the downloader against the local old source**

Run: `python build/fetch_data.py`

Expected: the old 113.11.18 file is refreshed to the current source without leaving a partial destination on failure.

- [ ] **Step 4: Run conversion and update the typo-fix expectations for the current official workbook**

Run: `python build/convert.py`

Expected: `data/codes.min.json` contains 96,802 rows and 73,681 leaves; any upstream-corrected typo entries are removed from `TYPO_FIXES`, and remaining deterministic corrections still fail closed.

- [ ] **Step 5: Run conversion tests**

Run: `python -m pytest tests/test_convert.py tests/test_data_integrity.py -q`

### Task 3: Enforce curated validation in build

**Files:**
- Modify: `build/build.py`
- Modify: `tests/test_build.py`

- [ ] **Step 1: Implement `validate_curated(curated, db)` minimally**

Validate every code in the seven curated structures against `db`; raise a `ValueError` containing the source key and code for missing or `USE=0` entries. Call it from `main()` before writing the output file.

- [ ] **Step 2: Add source metadata to the generated HTML**

Embed only the source version and row counts in `window.ICD_META`; do not add network dependencies or change the UI flow.

- [ ] **Step 3: Run build tests**

Run: `python -m pytest tests/test_build.py -q`

Expected: invalid fixture fails and the real build produces a 1–6 MB self-contained HTML file.

### Task 4: Correct ready-time and offline E2E coverage

**Files:**
- Modify: `src/app.js`
- Modify: `tests/e2e_test.py`

- [ ] **Step 1: Add an E2E assertion for `icd-ready` performance mark and a `file://` fixture**

The performance test must read `performance.getEntriesByName('icd-ready')`; the file fixture must wait for `body[data-ready="1"]` and assert the row count.

- [ ] **Step 2: Run the new E2E tests and verify they fail before the production mark exists**

Run: `python -m pytest tests/e2e_test.py -k "performance or file_url" -q`

Expected: the ready-performance assertion fails because `src/app.js` does not yet create the mark.

- [ ] **Step 3: Add `performance.mark('icd-ready')` after successful data initialization**

Keep the existing status text and `data-ready` behavior unchanged.

- [ ] **Step 4: Run the targeted E2E tests again**

Run: `python -m pytest tests/e2e_test.py -k "performance or file_url" -q`

### Task 5: Update developer documentation and regenerate delivery artifact

**Files:**
- Modify: `README.md`
- Modify: `dist/icd10.html`

- [ ] **Step 1: Document the current data revision and browser installation command**

Add `python -m playwright install chromium` after the pip install command and state that the embedded data is the NHI 2023 version, revision `115.05.06`.

- [ ] **Step 2: Run the full build and test suite**

Run: `python build/build.py`

Run: `python -m pytest tests/ -v`

Run: `node --check src/logic.js; node --check src/app.js; node --test tests/logic.test.mjs`

- [ ] **Step 3: Verify final artifact and worktree**

Check that `dist/icd10.html` is self-contained, under 6 MB, `ICD_META` is present, no `%DATA%`/`%SCRIPTS%` placeholders remain, and `git diff --check` is clean.
