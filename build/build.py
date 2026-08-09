"""組裝單一離線 HTML：資料 gzip+base64 內嵌、全部 JS inline。"""
import base64, gzip, io, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC, DATA, DIST = ROOT / "src", ROOT / "data", ROOT / "dist"
CURATED_KEYS = {
    "chronic.json": "chronic", "infectious.json": "infectious", "pathogens.json": "pathogens",
    "symptoms.json": "symptoms", "surgical_panels.json": "surgicalPanels",
    "surgical_quick.json": "surgicalQuick", "related.json": "related",
}

def main():
    sys.stdout.reconfigure(encoding="utf-8")
    raw = (DATA / "codes.min.json").read_bytes()
    b64 = base64.b64encode(gzip.compress(raw, 9)).decode("ascii")

    curated = {}
    for fname, key in CURATED_KEYS.items():
        curated[key] = json.loads((SRC / "curated" / fname).read_text(encoding="utf-8"))
    scripts = (
        "<script>\n/* 資料來源：健保署 2023年版中文 ICD-10-CM（政府資料開放平臺 dataset 177507） */\n"
        + "window.CURATED = " + json.dumps(curated, ensure_ascii=False, separators=(",", ":")) + ";\n</script>\n"
        + "<script>\n" + (SRC / "logic.js").read_text(encoding="utf-8") + "\n</script>\n"
        + "<script>\n" + (SRC / "app.js").read_text(encoding="utf-8") + "\n</script>"
    )

    html = (SRC / "template.html").read_text(encoding="utf-8")
    html = html.replace("%DATA%", b64).replace("<!--%SCRIPTS%-->", scripts)
    DIST.mkdir(exist_ok=True)
    out = DIST / "icd10.html"
    with io.open(out, "w", encoding="utf-8", newline="\n") as f:
        f.write(html)
    print(f"輸出 {out}（{out.stat().st_size:,} bytes）")

if __name__ == "__main__":
    main()
