"""產生臨床內容驗收清單 docs/clinical-content-inventory.md。

把 src/curated/ 的全部精選內容攤平成「代碼／介面標籤／健保官方中文名／官方英文名」四欄，
依模式與面板分節，供醫師逐條核對標籤是否會誤導選碼。
資料改動後重跑本腳本即可更新。
"""

import glob
import io
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "clinical-content-inventory.md"

MODE_FILES = [
    ("內科急診", "internal_emergency.json"),
    ("內科門診", "internal_outpatient.json"),
]
QUICK_FILES = [
    ("常用慢性病", "chronic.json"),
    ("感染科常用", "infectious.json"),
    ("病原體與抗藥性附加碼", "pathogens.json"),
    ("急診快選", "emergency_quick.json"),
    ("外科快選", "surgical_quick.json"),
]
LAYER_NAMES = {"chief": "主訴", "diseases": "常見疾病", "redFlags": "優先排除（紅旗）"}


def load_db():
    rows = json.loads((ROOT / "data" / "codes.min.json").read_text(encoding="utf-8"))
    return {r[0]: r for r in rows}


def row_line(db, code, label):
    r = db.get(code)
    zh = r[3] if r else "**查無此碼**"
    en = r[2] if r else ""
    flag = "" if (r and r[1] == 1) else " ⚠️不可申報"
    return f"| `{code}`{flag} | {label} | {zh} | {en} |"


def table_header():
    return ["| 代碼 | 介面標籤 | 健保官方中文名 | 官方英文名 |", "|---|---|---|---|"]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    db = load_db()
    out = []
    out.append("# 臨床內容驗收清單")
    out.append("")
    out.append("由 `python build/inventory.py` 自動產生，資料來源為 `src/curated/`。")
    out.append("")
    out.append("**怎麼用**：看「介面標籤」與「健保官方中文名」是否語意一致。")
    out.append("標籤是看診時顯示在按鈕上的字，官方名是健保申報的正式名稱——")
    out.append("兩者可以不同（標籤是速記），但**不能語意衝突**，否則會選錯碼。")
    out.append("")

    total = 0
    for mode_name, fname in MODE_FILES:
        data = json.loads((ROOT / "src" / "curated" / fname).read_text(encoding="utf-8"))
        n_panels = sum(len(g["panels"]) for g in data)
        out.append(f"## {mode_name}（{len(data)} 個部位群組 / {n_panels} 張面板）")
        out.append("")
        for group in data:
            out.append(f"### {group['name']}")
            out.append("")
            for panel in group["panels"]:
                out.append(f"#### {panel['name']}")
                out.append("")
                out.extend(table_header())
                for layer in ("chief", "diseases", "redFlags"):
                    items = panel.get(layer) or []
                    if not items:
                        continue
                    out.append(f"| **{LAYER_NAMES[layer]}** | | | |")
                    for code, label in items:
                        out.append(row_line(db, code, label))
                        total += 1
                out.append("")

    surg = json.loads((ROOT / "src" / "curated" / "surgical_panels.json").read_text(encoding="utf-8"))
    out.append(f"## 外科（{len(surg)} 張面板）")
    out.append("")
    for panel in surg:
        out.append(f"### {panel['name']}")
        out.append("")
        out.extend(table_header())
        for code, label in panel["codes"]:
            out.append(row_line(db, code, label))
            total += 1
        out.append("")

    out.append("## 快選清單")
    out.append("")
    for title, fname in QUICK_FILES:
        items = json.loads((ROOT / "src" / "curated" / fname).read_text(encoding="utf-8"))
        out.append(f"### {title}（{len(items)} 碼）")
        out.append("")
        out.extend(table_header())
        for code, label in items:
            out.append(row_line(db, code, label))
            total += 1
        out.append("")

    rel = json.loads((ROOT / "src" / "curated" / "related.json").read_text(encoding="utf-8"))
    out.append(f"## 全域關聯表（{len(rel)} 組）")
    out.append("")
    out.append("點選左欄代碼後，右側「相關評估碼」會建議的碼。")
    out.append("")
    out.append("| 選了這個碼 | 會建議一併評估 |")
    out.append("|---|---|")
    for key in sorted(rel):
        names = []
        for c in rel[key]:
            r = db.get(c)
            names.append(f"`{c}` {r[3] if r else '?'}")
        kr = db.get(key)
        out.append(f"| `{key}` {kr[3] if kr else '?'} | " + "、".join(names) + " |")
    out.append("")
    out.append(f"---\n\n面板與快選代碼位置合計 {total} 筆。")

    OUT.parent.mkdir(exist_ok=True)
    with io.open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(out) + "\n")
    print(f"已產生 {OUT}（{OUT.stat().st_size:,} bytes，{total} 筆代碼位置）")


if __name__ == "__main__":
    main()
