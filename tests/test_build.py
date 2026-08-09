import hashlib
import json
import re
import subprocess, sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "build"))
import build as build_module
from source_manifest import SOURCE_SHA256, SOURCE_VERSION

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist" / "icd10.html"

def test_build_produces_single_html():
    r = subprocess.run([sys.executable, str(ROOT / "build" / "build.py")], capture_output=True, text=True, encoding="utf-8")
    assert r.returncode == 0, r.stderr
    html = DIST.read_text(encoding="utf-8")
    assert "%DATA%" not in html and "%SCRIPTS%" not in html, "佔位符未被取代"
    assert "window.CURATED" in html and "ICDLogic" in html
    match = re.search(r"window\.ICD_META = (\{.*?\});", html)
    assert match, "找不到 ICD metadata"
    raw = (ROOT / "data" / "codes.min.json").read_bytes()
    assert json.loads(match.group(1)) == {
        "sourceVersion": SOURCE_VERSION,
        "sourceSha256": SOURCE_SHA256,
        "dataSha256": hashlib.sha256(raw).hexdigest(),
        "rowCount": 96802,
        "leafCount": 73681,
    }
    assert 'type="application/gzip-base64"' in html
    assert "http://" not in html and "https://" not in html, "不得有外部資源參照"
    size = DIST.stat().st_size
    assert 1_000_000 < size <= 6_000_000, f"檔案大小異常: {size:,} bytes"


def test_build_embeds_three_clinical_modes():
    r = subprocess.run(
        [sys.executable, str(ROOT / "build" / "build.py")],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    assert r.returncode == 0, r.stderr
    html = DIST.read_text(encoding="utf-8")
    match = re.search(r"window\.CURATED = (\{.*?\});", html)
    assert match
    curated = json.loads(match.group(1))
    assert {"internalEmergency", "internalOutpatient", "emergencyQuick"} <= set(curated)
    assert curated["internalEmergency"][0]["panels"][0]["chief"]
    assert curated["internalEmergency"][0]["panels"][0]["diseases"]
    assert curated["internalEmergency"][0]["panels"][0]["redFlags"]
    assert "redFlags" not in curated["internalOutpatient"][0]["panels"][0]
    for marker in ["內科急診", "內科門診", "外科", "region-nav", "symptom-card", "常見相關疾病"]:
        assert marker in html


def test_build_rejects_non_leaf_curated_code(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    curated_dir = tmp_path / "src" / "curated"
    data_dir.mkdir(parents=True)
    curated_dir.mkdir(parents=True)
    (tmp_path / "src" / "logic.js").write_text("window.ICDLogic = {};", encoding="utf-8")
    (tmp_path / "src" / "app.js").write_text("window.APP = {};", encoding="utf-8")
    (tmp_path / "src" / "template.html").write_text(
        "<script id=icd-data>%DATA%</script><!--%SCRIPTS%-->",
        encoding="utf-8",
    )
    data_raw = '[["A00",0,"Category","類目"],["A00.0",1,"Leaf","葉碼"]]'.encode("utf-8")
    (data_dir / "codes.min.json").write_bytes(data_raw)
    (data_dir / "codes.min.meta.json").write_text(
        json.dumps(
            {
                "sourceVersion": SOURCE_VERSION,
                "sourceSha256": SOURCE_SHA256,
                "dataSha256": hashlib.sha256(data_raw).hexdigest(),
                "rowCount": 2,
                "leafCount": 1,
            }
        ),
        encoding="utf-8",
    )
    (curated_dir / "chronic.json").write_text(
        '[["A00","錯誤類目"],["NOPE","不存在代碼"]]', encoding="utf-8"
    )

    monkeypatch.setattr(build_module, "DATA", data_dir)
    monkeypatch.setattr(build_module, "SRC", tmp_path / "src")
    monkeypatch.setattr(build_module, "DIST", tmp_path / "dist")
    monkeypatch.setattr(build_module, "CURATED_KEYS", {"chronic.json": "chronic"})

    with pytest.raises(ValueError) as exc_info:
        build_module.main()
    assert "A00" in str(exc_info.value)
    assert "NOPE" in str(exc_info.value)
