"""草稿面板的預檢：內容還沒寫進 curated 之前先擋掉不能用的碼。

用法：python build/check_panel_draft.py <草稿.json>

草稿格式與 internal_*.json 的面板相同：
  [{"file": "internal_outpatient.json", "region": "神經／精神",
    "panel": {"name": ..., "chief": [[code, label], ...], "diseases": [...],
              "related": {code: [code, ...]}}}, ...]

檢查的是「寫進去之後一定會被 build.py 或 tests 擋下來」的那些事，
在這裡先問一次，比跑完整套測試再回頭改快得多：
  1. 代碼存在且是葉碼（USE=1）——build.py validate_curated
  2. 面板內不重複、chief 與 diseases 不相交——test_curated
  3. related 的 key 恰好等於 chief 的碼，且每個 key 的建議非空——test_curated
  4. 同一碼在 internal_* 全部位置只能有一個標籤——test_clinical_invariants
  5. 官方名帶否定限定詞、同面板又有競爭碼時，標籤要寫出否定——同上
  6. 病原體／抗藥性／外因碼要標「附加碼」——同上

輸出「官方名」讓人肉眼比對標籤有沒有寫反（這是機器擋不掉的那一半）。
"""
import io
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CURATED = ROOT / "src" / "curated"
INTERNAL = ("internal_outpatient.json", "internal_emergency.json")
NEGATION = re.compile(r"未(?:伴有|伴|併發|提及)[^，,、；;。]*")
ADJUNCT = re.compile(r"^(B9[567]|Z16|[VWXY])")


def load(path):
    return json.loads(io.open(path, encoding="utf-8").read())


def existing_labels():
    """internal_* 現有的 {碼: (標籤, 出處)}，用來擋同碼兩種寫法。"""
    out = {}
    for fname in INTERNAL:
        for region in load(CURATED / fname):
            for panel in region["panels"]:
                for layer in ("chief", "diseases", "redFlags"):
                    for code, label in panel.get(layer) or []:
                        out.setdefault(code, (label, f'{fname}／{panel["name"]}'))
    return out


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    draft = load(Path(sys.argv[1]))
    db = {r[0]: r for r in load(ROOT / "data" / "codes.min.json")}
    known = existing_labels()

    bad = []
    for entry in draft:
        panel = entry["panel"]
        where = f'{entry["file"]}／{entry["region"]}／{panel["name"]}'
        layers = [(l, panel.get(l) or []) for l in ("chief", "diseases", "redFlags")]
        seen = {}
        print(f"\n=== {where} ===")
        for layer, rows in layers:
            for code, label in rows:
                row = db.get(code)
                if row is None:
                    bad.append(f"{where}:{layer}:{code} 全庫查無此碼")
                    continue
                if row[1] != 1:
                    bad.append(f"{where}:{layer}:{code} 不是葉碼（USE={row[1]}）")
                    continue
                if code in seen:
                    bad.append(f"{where}:{code} 在面板內重複（{seen[code]} 與 {layer}）")
                seen[code] = layer
                if code in known and known[code][0] != label:
                    bad.append(f'{where}:{code} 標籤「{label}」與現有「{known[code][0]}」'
                               f"（{known[code][1]}）不一致")
                if ADJUNCT.match(code.replace(".", "")) and "附加碼" not in label:
                    bad.append(f"{where}:{code} 是附加碼，標籤要標明")
                print(f"  {layer:<9} {code:<9} {label}")
                print(f"  {'':<9} {'':<9} 官方：{row[3]}")

        chief_codes = {c for c, _ in panel.get("chief") or []}
        if not chief_codes:
            bad.append(f"{where} 沒有 chief")
        if len(panel.get("diseases") or []) < 4:
            bad.append(f"{where} diseases 不足四項")
        rel = panel.get("related")
        if rel is None:
            bad.append(f"{where} 缺 related")
        else:
            if set(rel) != chief_codes:
                bad.append(f"{where} related 的 key {sorted(set(rel) ^ chief_codes)} 與 chief 不符")
            for k, v in rel.items():
                if not v:
                    bad.append(f"{where} related[{k}] 是空的")
                if k in v:
                    bad.append(f"{where} related[{k}] 自我參照")
                if len(v) != len(set(v)):
                    bad.append(f"{where} related[{k}] 有重複")
                for c in v:
                    if c not in db or db[c][1] != 1:
                        bad.append(f"{where} related[{k}] 的 {c} 不是葉碼")

        # 同面板競爭碼：官方名的否定片語在同類目其他碼上不成立 → 標籤要寫出否定
        flat = [(c, l) for _, rows in layers for c, l in rows if c in db]
        for code, label in flat:
            if any(t in label for t in ("未伴", "未併", "無")):
                continue
            for phrase in NEGATION.findall(db[code][3]):
                rivals = [o for o, _ in flat
                          if o != code and o[:3] == code[:3] and phrase not in db[o][3]]
                if rivals:
                    bad.append(f'{where}:{code}「{label}」未揭露「{phrase}」，競爭碼 {rivals}')
                    break

    print("\n" + "=" * 60)
    if bad:
        print(f"不通過（{len(bad)} 項）：")
        for b in bad:
            print("  ✘", b)
        return 1
    print("機器檢查全過。標籤與官方名的對應請自行肉眼確認（機器擋不掉寫反的意思）。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
