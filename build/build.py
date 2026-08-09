"""組裝單一離線 HTML：資料 gzip+base64 內嵌、全部 JS inline。"""
import base64, gzip, hashlib, io, json, sys
from pathlib import Path

from source_manifest import SOURCE_SHA256, SOURCE_VERSION

ROOT = Path(__file__).resolve().parent.parent
SRC, DATA, DIST = ROOT / "src", ROOT / "data", ROOT / "dist"
CURATED_KEYS = {
    "chronic.json": "chronic", "infectious.json": "infectious", "pathogens.json": "pathogens",
    "surgical_panels.json": "surgicalPanels",
    "surgical_quick.json": "surgicalQuick", "related.json": "related",
    "internal_emergency.json": "internalEmergency",
    "internal_outpatient.json": "internalOutpatient",
    "emergency_quick.json": "emergencyQuick",
}


def _iter_internal_codes(groups, source, allow_red_flags):
    for region in groups:
        region_name = region["name"]
        for panel in region["panels"]:
            panel_source = f"{source}:{region_name}/{panel['name']}"
            for field in ("chief", "diseases"):
                for pair in panel.get(field, []):
                    yield f"{panel_source}:{field}", pair[0]
            if "redFlags" in panel:
                if not allow_red_flags:
                    raise ValueError(f"內科門診不可包含 redFlags：{panel_source}")
                for pair in panel["redFlags"]:
                    yield f"{panel_source}:redFlags", pair[0]
            for code, values in panel.get("related", {}).items():
                yield f"{panel_source}:related", code
                for value in values:
                    yield f"{panel_source}:related:{code}", value


def _iter_curated_codes(curated):
    for key in ("chronic", "infectious", "pathogens", "surgicalQuick", "emergencyQuick"):
        for pair in curated.get(key, []):
            yield key, pair[0]
    for key in ("surgicalPanels",):
        for panel in curated.get(key, []):
            for pair in panel["codes"]:
                yield f"{key}:{panel['name']}", pair[0]
    yield from _iter_internal_codes(curated.get("internalEmergency", []), "internalEmergency", True)
    yield from _iter_internal_codes(curated.get("internalOutpatient", []), "internalOutpatient", False)
    for key, values in curated.get("related", {}).items():
        yield "related", key
        for value in values:
            yield f"related:{key}", value


def validate_curated(curated, db):
    by_code = {row[0]: row for row in db}
    bad = []
    for source, code in _iter_curated_codes(curated):
        row = by_code.get(code)
        if row is None or len(row) < 2 or row[1] != 1:
            bad.append(f"{source}: {code}")
    if bad:
        sample = "; ".join(bad[:20])
        suffix = "" if len(bad) <= 20 else f"（另有 {len(bad) - 20} 筆）"
        raise ValueError(f"curated 含不存在或非葉碼：{sample}{suffix}")


def validate_data_metadata(raw, db):
    metadata_path = DATA / "codes.min.meta.json"
    try:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ValueError("找不到資料 metadata，請先執行 build/convert.py") from exc
    except json.JSONDecodeError as exc:
        raise ValueError("資料 metadata 不是有效 JSON，請重新執行 build/convert.py") from exc

    expected = {
        "sourceVersion": SOURCE_VERSION,
        "sourceSha256": SOURCE_SHA256,
        "dataSha256": hashlib.sha256(raw).hexdigest(),
        "rowCount": len(db),
        "leafCount": sum(1 for row in db if row[1] == 1),
    }
    if metadata != expected:
        raise ValueError("資料 metadata 不符目前來源或資料內容，請重新執行 build/convert.py")
    return expected


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    raw = (DATA / "codes.min.json").read_bytes()
    db = json.loads(raw.decode("utf-8"))
    metadata = validate_data_metadata(raw, db)
    b64 = base64.b64encode(gzip.compress(raw, 9, mtime=0)).decode("ascii")

    curated = {}
    for fname, key in CURATED_KEYS.items():
        curated[key] = json.loads((SRC / "curated" / fname).read_text(encoding="utf-8"))
    validate_curated(curated, db)
    scripts = (
        "<script>\nwindow.ICD_META = " + json.dumps(metadata, ensure_ascii=False, separators=(",", ":")) + ";\n</script>\n"
        "<script>\n/* 資料來源：健保署 ICD-10-CM（" + SOURCE_VERSION + "） */\n"
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
