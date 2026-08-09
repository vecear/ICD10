import subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist" / "icd10.html"

def test_build_produces_single_html():
    r = subprocess.run([sys.executable, str(ROOT / "build" / "build.py")], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    html = DIST.read_text(encoding="utf-8")
    assert "%DATA%" not in html and "%SCRIPTS%" not in html, "佔位符未被取代"
    assert "window.CURATED" in html and "ICDLogic" in html
    assert 'type="application/gzip-base64"' in html
    assert "http://" not in html and "https://" not in html.replace("https://info.nhi.gov.tw", ""), "不得有外部資源參照"
    size = DIST.stat().st_size
    assert 1_000_000 < size <= 6_000_000, f"檔案大小異常: {size:,} bytes"
