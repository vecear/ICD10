"""build/inventory.py 與 build/lookup.py 的煙霧測試。

兩者是開發／驗收用的工具腳本，不在 build.py 主流程上，R2 審查前完全沒有測試
（.review/r2-pipeline.md (b) 第 6 條）。inventory.py 產生的正是**醫師臨床驗收用的清單**，
內容錯了不會有任何自動化抓到——真正的風險不是腳本壞掉，是它「跑得起來但查錯碼」，
所以這裡不只驗「有輸出」，也獨立重算一次代碼筆數並檢查查表結果。

輸出路徑一律導到 tmp_path，不覆寫 repo 裡的 docs/clinical-content-inventory.md。
"""
import io
import json
import re
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "build"))
import inventory as inventory_module  # noqa: E402

CURATED = ROOT / "src" / "curated"


def _expected_code_positions():
    """獨立重算「面板與快選代碼位置」筆數，不呼叫 inventory 自己的任何函式。"""
    total = 0
    for _, fname in inventory_module.MODE_FILES:
        for group in json.loads((CURATED / fname).read_text(encoding="utf-8")):
            for panel in group["panels"]:
                for layer in ("chief", "diseases", "redFlags"):
                    total += len(panel.get(layer) or [])
    for panel in json.loads((CURATED / "surgical_panels.json").read_text(encoding="utf-8")):
        total += len(panel["codes"])
    for _, fname in inventory_module.QUICK_FILES:
        total += len(json.loads((CURATED / fname).read_text(encoding="utf-8")))
    return total


@pytest.fixture
def inventory_output(tmp_path, monkeypatch):
    """跑 inventory.main()，輸出導到 tmp_path，回傳 (markdown 文字, 終端摘要)。"""
    out = tmp_path / "clinical-content-inventory.md"
    monkeypatch.setattr(inventory_module, "OUT", out)
    # main() 會呼叫 sys.stdout.reconfigure()，pytest 攔截後的 stdout 不一定支援
    fake_stdout = io.TextIOWrapper(io.BytesIO(), encoding="utf-8", newline="\n")
    monkeypatch.setattr(sys, "stdout", fake_stdout)
    inventory_module.main()
    fake_stdout.flush()
    summary = fake_stdout.buffer.getvalue().decode("utf-8")
    assert out.exists(), "inventory.py 沒有產生任何檔案"
    return out.read_text(encoding="utf-8"), summary


def test_inventory_generates_complete_acceptance_table(inventory_output):
    """清單要涵蓋每一個精選碼位置，且每一列都查得到健保官方名稱。"""
    text, summary = inventory_output
    expected = _expected_code_positions()
    assert expected > 500, f"重算出來只有 {expected} 筆，重算邏輯本身可能壞了"

    assert text.startswith("# 臨床內容驗收清單")
    for heading in ("## 內科急診", "## 內科門診", "## 外科", "## 快選清單", "## 全域關聯表"):
        assert heading in text, f"缺少章節 {heading}"

    # 代碼列數（關聯表那節格式不同，切掉不算）
    body = text.split("## 全域關聯表")[0]
    rows = [ln for ln in body.splitlines() if re.match(r"^\| `[^`]+`", ln)]
    assert len(rows) == expected, f"清單列出 {len(rows)} 筆代碼，重算應為 {expected} 筆"
    assert f"合計 {expected} 筆" in text, "頁尾統計與實際列數不符"
    assert f"{expected} 筆代碼位置" in summary, f"終端摘要沒報出筆數：{summary!r}"

    # 每列必須是四欄，且中文／英文欄都查得到（查不到會印 **查無此碼**）
    for line in rows:
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        assert len(cells) == 4, f"欄數不對：{line}"
        assert cells[2], f"官方中文名為空：{line}"
    assert "**查無此碼**" not in text, "清單裡有查不到的代碼（db 對照壞了或精選碼失效）"
    assert "⚠️不可申報" not in text, "清單裡有非 USE=1 的代碼"

    # 關聯表：每一組的左右兩側都要帶中文，不能只有代碼
    related = text.split("## 全域關聯表")[1]
    pairs = [ln for ln in related.splitlines() if re.match(r"^\| `[^`]+`", ln)]
    expected_pairs = len(json.loads((CURATED / "related.json").read_text(encoding="utf-8")))
    assert len(pairs) == expected_pairs, f"關聯表列出 {len(pairs)} 組，實際 {expected_pairs} 組"
    assert not [ln for ln in pairs if "`?" in ln or "` ?" in ln], "關聯表有查不到中文的代碼"


def test_inventory_labels_match_the_curated_source(inventory_output):
    """介面標籤欄必須逐字來自 curated JSON——這欄正是醫師要核對的東西，不能被改寫。"""
    text, _ = inventory_output
    sample = []
    for _, fname in inventory_module.QUICK_FILES:
        items = json.loads((CURATED / fname).read_text(encoding="utf-8"))
        sample.extend(items[:3])
    assert len(sample) >= 9
    for code, label in sample:
        assert re.search(rf"^\| `{re.escape(code)}` \| {re.escape(label)} \|", text, re.M), \
            f"清單裡找不到 `{code}` / 標籤「{label}」"


def _lookup(*args):
    r = subprocess.run(
        [sys.executable, str(ROOT / "build" / "lookup.py"), *args],
        capture_output=True, text=True, encoding="utf-8", cwd=str(ROOT),
    )
    assert r.returncode == 0, r.stderr
    return [ln for ln in r.stdout.splitlines() if ln.strip()]


def test_lookup_finds_codes_by_prefix_keyword_and_respects_limit():
    """查全庫的開發工具：代碼前綴、英文、中文三種命中方式都要通，輸出是四欄 TSV。"""
    lines = _lookup("E11.9", "5")
    assert 1 <= len(lines) <= 5, f"上限沒生效或查不到：{len(lines)} 行"
    for line in lines:
        cells = line.split("\t")
        assert len(cells) == 4, f"輸出不是四欄 TSV：{line!r}"
        assert cells[1].startswith("USE="), f"第二欄應為 USE=n：{line!r}"
        assert cells[0].replace(".", "").startswith("E119"), f"前綴查詢卻回了 {cells[0]}"
    assert any(c.split("\t")[0] == "E11.9" for c in lines), "查 E11.9 卻沒有 E11.9 本身"

    # 忽略小數點：E119 應該與 E11.9 命中同一批
    assert _lookup("E119", "5") == lines

    # 上限預設 30
    assert len(_lookup("A")) == 30

    # 中文關鍵字
    zh = _lookup("蜂窩組織", "5")
    assert zh, "中文關鍵字查不到任何結果"
    assert all("蜂窩組織" in ln.split("\t")[2] for ln in zh), zh

    # 英文關鍵字（大小寫不敏感）
    en = _lookup("CELLULITIS", "5")
    assert en, "英文關鍵字查不到任何結果"
    assert all("cellulitis" in ln.split("\t")[3].lower() for ln in en), en
