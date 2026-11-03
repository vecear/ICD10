import base64
import hashlib
import json
import re
import subprocess, sys
from datetime import date
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
        "builtAt": date.today().isoformat(),
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
    # DOM 契約標記（impl-plan §4）。P3 改版：`region-nav` → `region-rail`，
    # 「常見相關疾病」群組標題 → `.disease-group`（收合式「常見疾病 N」）。
    for marker in ["內科急診", "內科門診", "外科", "region-rail", "symptom-card", "disease-group"]:
        assert marker in html


def test_build_embeds_fonts_and_design_system():
    """字型與設計系統必須整份內嵌在單檔裡（零外部請求的前提）。"""
    html = DIST.read_text(encoding="utf-8")
    faces = re.findall(r"@font-face\{[^}]*\}", html)
    assert len(faces) == 5, f"@font-face 規則應為 5 條（Barlow 400/500/700＋Condensed 400/600），實得 {len(faces)}"
    for face in faces:
        assert "src:url(data:font/woff2;base64," in face, f"字型未內嵌為 data: URI：{face[:80]}"
        assert "font-display:swap" in face
        assert "format('woff2')" in face
    families = {re.search(r"font-family:'([^']+)'", f).group(1) for f in faces}
    assert families == {"Barlow", "Barlow Condensed"}
    weights = sorted(int(re.search(r"font-weight:(\d+)", f).group(1)) for f in faces)
    assert weights == [400, 400, 500, 600, 700]
    # vendored 設計系統與產品層 token
    for marker in ["--color-accent:", ".blueprint", "--his-surface:", "--his-ink:", "--warn-line:", "Barlow Condensed"]:
        assert marker in html, f"設計系統缺少 {marker}"
    assert not re.search(r"@import\s*(?:url\(|['\"])", html), "不得殘留 @import（Google Fonts 連結）"


def test_embedded_fonts_decode_to_the_exact_source_woff2_files():
    """字型 payload 必須真的是 assets/fonts 那 5 個 woff2，逐位元組相同。

    R2 審查的最高優先盲點（M11）：把 base64 攔腰截斷，129 條測試全綠——因為
    test_build_embeds_fonts_and_design_system 只用 regex 驗結構（data URI 前綴、
    format('woff2')、family/weight），從不解碼 payload。字型壞掉的症狀只是瀏覽器
    無聲 fallback 到系統字，沒有任何錯誤訊息，靠人眼永遠抓不到。

    這裡驗四件事，任何一件不成立就是壞掉的字型：
      (a) base64 可嚴格解碼（validate=True：有雜字元就丟例外，不靜默丟棄）
      (b) 檔頭簽章是 wOF2
      (c) woff2 檔頭第 8–12 byte 宣告的檔案總長度 == 實際解出的位元組數（截斷必露餡）
      (d) sha256 與 assets/fonts/ 的原始檔相同（(c) 只擋截斷，這條連內容竄改都擋）
    """
    html = DIST.read_text(encoding="utf-8")
    faces = re.findall(r"@font-face\{[^}]*\}", html)
    assert len(faces) == len(build_module.FONTS), f"@font-face 數量 {len(faces)}"

    embedded = {}
    for face in faces:
        family = re.search(r"font-family:'([^']+)'", face).group(1)
        weight = int(re.search(r"font-weight:(\d+)", face).group(1))
        payload = re.search(r"src:url\(data:font/woff2;base64,([^)]*)\) format\('woff2'\)", face)
        assert payload, f"取不到 base64 payload：{face[:80]}"
        b64 = payload.group(1)
        assert b64, f"{family} {weight} 的 base64 payload 是空的"
        # validate=True：base64 只要混進非法字元就丟例外，不像預設會靜默略過
        raw = base64.b64decode(b64, validate=True)
        embedded[(family, weight)] = raw

    assert set(embedded) == {(family, weight) for _, family, weight in build_module.FONTS}

    for fname, family, weight in build_module.FONTS:
        raw = embedded[(family, weight)]
        source = (ROOT / "assets" / "fonts" / fname).read_bytes()
        assert raw[:4] == b"wOF2", f"{fname} 解出來不是合法 woff2（檔頭 {raw[:4]!r}）"
        declared = int.from_bytes(raw[8:12], "big")
        assert declared == len(raw), \
            f"{fname} woff2 檔頭宣告 {declared:,} bytes，實得 {len(raw):,} bytes（payload 被截斷或損毀）"
        assert len(raw) == len(source), \
            f"{fname} 內嵌 {len(raw):,} bytes ≠ 原始檔 {len(source):,} bytes"
        assert hashlib.sha256(raw).hexdigest() == hashlib.sha256(source).hexdigest(), \
            f"{fname} 內嵌內容與 assets/fonts/{fname} 不一致"


def test_curated_labels_cover_every_curated_code():
    """全庫延遲載入時 chip 的中文標籤來源；漏一個碼＝那顆 chip 只剩代碼沒有中文。"""
    html = DIST.read_text(encoding="utf-8")
    match = re.search(r"window\.CURATED_LABELS = (\{.*?\});", html)
    assert match, "找不到 window.CURATED_LABELS"
    labels = json.loads(match.group(1))

    curated = {
        key: json.loads((ROOT / "src" / "curated" / fname).read_text(encoding="utf-8"))
        for fname, key in build_module.CURATED_KEYS.items()
    }
    expected = {code for _, code in build_module._iter_curated_codes(curated)}
    assert expected, "精選碼集合為空，_iter_curated_codes 可能壞了"
    assert set(labels) == expected, f"漏碼 {sorted(expected - set(labels))[:10]}／多碼 {sorted(set(labels) - expected)[:10]}"

    by_code = {row[0]: row for row in json.loads((ROOT / "data" / "codes.min.json").read_text(encoding="utf-8"))}
    for code, zh in labels.items():
        assert zh.strip(), f"{code} 的中文標籤為空"
        assert by_code[code][1] == 1, f"{code} 不是 USE=1 葉碼，不該進白名單"
        assert by_code[code][3] == zh, f"{code} 中文與 codes.min.json 不一致"


@pytest.mark.parametrize(
    "snippet",
    [
        '<link rel="stylesheet" href="https://cdn.example.com/x.css">',
        "@import url('https://fonts.googleapis.com/css2?family=Barlow');",
        '@import "http://example.com/a.css";',
        "body{background:url(/assets/bg.png)}",
        '<img src="http://example.com/logo.png">',
    ],
)
def test_assert_offline_rejects_external_references(snippet):
    with pytest.raises(ValueError) as exc_info:
        build_module.assert_offline("<html><head>" + snippet + "</head></html>")
    assert "外部參照" in str(exc_info.value)


def test_assert_offline_allows_inline_data_and_svg_namespace():
    """data: URI 與 SVG 命名空間不會發出請求，不可誤殺。"""
    build_module.assert_offline(
        '<html><style>@font-face{src:url(data:font/woff2;base64,AAAA) format("woff2")}</style>'
        '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
        '<script id="icd-data" type="application/gzip-base64">H4sIAAAA</script></html>'
    )


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
    # 慢病速查在 main() 裡是另一次檔案讀取（不走代碼驗證）。validate_curated() 目前排在它
    # 之前所以先炸，但沙箱少了這個檔就會在重排順序時變成看不懂的 FileNotFoundError。
    (curated_dir / build_module.CHRONIC_CARE_FILE).write_text(
        '{"topics":[{"key":"dm","sections":[]},{"key":"htn","sections":[]},'
        '{"key":"lipid","sections":[]}]}',
        encoding="utf-8",
    )

    monkeypatch.setattr(build_module, "DATA", data_dir)
    monkeypatch.setattr(build_module, "SRC", tmp_path / "src")
    monkeypatch.setattr(build_module, "DIST", tmp_path / "dist")
    monkeypatch.setattr(build_module, "CURATED_KEYS", {"chronic.json": "chronic"})

    with pytest.raises(ValueError) as exc_info:
        build_module.main()
    assert "A00" in str(exc_info.value)
    assert "NOPE" in str(exc_info.value)


# ── embed_json：8 段資料內嵌的唯一出口 ─────────────────────────────────────────
EMBEDDED_GLOBALS = ("ICD_META", "CURATED", "CURATED_LABELS", "CHRONIC_CARE", "LIPID_PRODUCTS",
                    "ANTIBIOTIC_DOSING", "VACCINE_GUIDE", "ANTIMICROBIAL_COVERAGE")


def _embedded(html, name):
    """回傳 (解出的值, 原始 payload 字串)。用 raw_decode 而非 regex，值裡有 `};` 也不會切錯。"""
    key = f"window.{name} = "
    start = html.index(key) + len(key)
    value, end = json.JSONDecoder().raw_decode(html, start)
    return value, html[start:end]


def _curated_json(name):
    return json.loads((ROOT / "src" / "curated" / name).read_text(encoding="utf-8"))


def test_embedded_globals_decode_to_the_source_data():
    """跳脫只能改寫法、不能改值：8 個全域變數 json.loads 回來要與原始資料完全相等。"""
    html = DIST.read_text(encoding="utf-8")
    got = {name: _embedded(html, name) for name in EMBEDDED_GLOBALS}
    for name, (_, raw) in got.items():
        assert "<" not in raw, f"window.{name} 的 payload 含未跳脫的 <"
    curated = {key: _curated_json(fname) for fname, key in build_module.CURATED_KEYS.items()}
    assert got["CURATED"][0] == curated
    by_code = {row[0]: row for row in json.loads((ROOT / "data" / "codes.min.json").read_text(encoding="utf-8"))}
    assert got["CURATED_LABELS"][0] == build_module.build_curated_labels(curated, by_code)
    assert got["CHRONIC_CARE"][0] == build_module.load_chronic_care()
    products = build_module.load_lipid_products()
    hospital = build_module.load_hospital_lipid()
    products["products"] = build_module.merge_hospital_codes(products["products"], hospital)
    products["hospital"] = {k: v for k, v in hospital.items() if k != "items"}
    assert got["LIPID_PRODUCTS"][0] == products
    assert got["ANTIBIOTIC_DOSING"][0] == _curated_json("antibiotic_dosing.json")
    assert got["VACCINE_GUIDE"][0] == _curated_json("vaccine_guide.json")
    assert got["ANTIMICROBIAL_COVERAGE"][0] == _curated_json("antimicrobial_coverage.json")


def test_embed_json_escapes_every_lt_and_keeps_the_value():
    data = {"t": "</script><!-- LDL <100 -->", "u": "https://www.cdc.gov.tw/x"}
    out = build_module.embed_json("X", data)
    body = out[len("<script>\n"):-len("\n</script>\n")]
    assert "<" not in body
    assert "https://" in body, "links=False 不跳脫網址：讓 assert_offline 照樣擋得到"
    assert json.loads(body[len("window.X = "):-1]) == data
    linked = build_module.embed_json("X", data, links=True)
    assert "https://" not in linked and json.loads(linked[len("<script>\nwindow.X = "):-len(";\n</script>\n")]) == data


def test_embed_json_rejects_close_tag_in_comment():
    with pytest.raises(ValueError, match="</"):
        build_module.embed_json("X", {}, comment="說明裡誤寫了 </b>")


# ── 時效警告 ─────────────────────────────────────────────────────────────────
def test_check_source_age_warns_only_past_the_threshold():
    today = date(2026, 11, 3)
    assert build_module.check_source_age("疫苗", "2026-08-03", 3, today) == []
    warned = build_module.check_source_age("疫苗", "2026-08-02", 3, today)
    assert len(warned) == 1 and "疫苗" in warned[0] and "3 個月" in warned[0] and "2026-08-03" in warned[0]
    assert "YYYY-MM-DD" in build_module.check_source_age("疫苗", None, 3, today)[0]


def test_source_age_warnings_cover_four_data_sets_with_injected_today():
    vaccine = _curated_json("vaccine_guide.json")
    antimicrobial = _curated_json("antimicrobial_coverage.json")
    renal = _curated_json("antibiotic_dosing.json")
    hospital = _curated_json(build_module.HOSPITAL_LIPID_FILE)
    assert build_module.source_age_warnings(vaccine, antimicrobial, renal, hospital,
                                            today=date(2026, 10, 3)) == []
    warned = build_module.source_age_warnings(vaccine, antimicrobial, renal, hospital,
                                              today=date(2030, 1, 1))
    assert len(warned) == 4
    for name in ("vaccine_guide", "antimicrobial_coverage", "antibiotic_dosing", "hospital_lipid_codes"):
        assert any(name in w for w in warned), name


def test_chronic_dated_boxes_are_scanned_for_age():
    chronic = {"topics": [{"key": k, "sections": []} for k in build_module.CHRONIC_TOPIC_KEYS]}
    chronic["topics"][2]["riskLadder"] = {"checked": "2020-01-01", "levels": []}
    chronic["topics"][2]["drugs"] = {"checked": "2026-09-01", "groups": []}
    report = build_module.check_chronic_care(chronic, today=date(2026, 11, 3))
    assert len(report["warnings"]) == 1 and "riskLadder" in report["warnings"][0]
    assert report["oldest"] == date(2020, 1, 1)
