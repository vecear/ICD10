"""產生 src/curated/lipid_products.json：降血脂品項的「代碼／商品名／學名 → 表別」。

用法：
    python build/fetch_lipid_products.py

為什麼要有這個檔：條文只寫「降膽固醇藥物適用表一，但下表所列項目不適用表一」，
而那份例外清單是**健保代碼**層級。醫師手上有的是商品名或代碼，不是代碼清單，
所以要能反查。同一個 atorvastatin，A 廠走表一（極高風險門檻 55）、B 廠走表二（70）——
差別在藥價談判不在藥效，只能對代碼。

兩個來源：
  1. 健保署「健保用藥品項查詢項目檔」開放資料（每月更新）→ 代碼／商品名／成分／章節
  2. 藥品給付規定 第二節 2.6.1 的「不適用表一」對照表 → 哪些代碼走表二
     （逐列讀自官方 .docx；健保條文/ 底下的 PDF 是同一份的另一種格式）

**這份資料會過期**：品項檔每月更新、給付規定不定期改版。json 帶 checked 日期，
build.py 會在過舊時印警告（同慢病速查的作法）。
"""
import collections
import csv
import io
import json
import re
import subprocess
import sys
import zipfile
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "curated" / "lipid_products.json"
CACHE = ROOT / "build" / ".cache"

# 健保用藥品項查詢項目檔（政府資料開放平臺 dataset 23715 的 CSV 下載點）
ITEMS_URL = "https://info.nhi.gov.tw/api/iode0000s01/Dataset?rId=A21030000I-E41001-001"
# 藥品給付規定 第二節（.docx；健保條文/ 放的是同一份的 PDF）
SECTION2_URL = "https://www.nhi.gov.tw/ch/dl-55674-265f5be1358b4aa6991c3d7c9394991c-1.docx"

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      " (KHTML, like Gecko) Chrome/140.0 Safari/537.36")


def fetch(url, path):
    """用 curl 下載。**不要改用 urllib**：Python 3.14 對部分政府網站的憑證鏈會拒絕
    （SSLCertVerificationError: Missing Subject Key Identifier），同一個 URL curl 正常。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.is_file() and path.stat().st_size > 0:
        print(f"  用既有快取 {path.name}（{path.stat().st_size:,} bytes）")
        return path
    print(f"  下載 {url[:70]}…")
    subprocess.run(["curl", "-sSfL", "-A", UA, url, "-o", str(path)], check=True)
    print(f"  → {path.name}（{path.stat().st_size:,} bytes）")
    return path


def table_two_codes(docx):
    """從官方 .docx 讀 2.6.1 的「不適用表一」對照表，回 {代碼: 成分}。

    **不用 PDF 抽文字**：那張表跨頁，pdftotext -layout 在第二頁之後欄位會錯位
    （成分名稱欄整批黏在頁首），拿它當清單來源會錯配成分。docx 是真表格結構。
    """
    with zipfile.ZipFile(docx) as z:
        root = ET.fromstring(z.read("word/document.xml").decode("utf-8"))
    body = root.find(W + "body")
    kids = list(body)
    anchor = None
    for i, node in enumerate(kids):
        txt = "".join(t.text or "" for t in node.iter(W + "t"))
        if "不適用" in txt and "表二" in txt:
            anchor = i
            break
    if anchor is None:
        raise SystemExit("第二節 .docx 裡找不到「不適用…表二」那句，官方可能改版了")
    tbl = next((n for n in kids[anchor:] if n.tag == W + "tbl"), None)
    if tbl is None:
        raise SystemExit("錨點之後找不到表格")

    out, current = {}, ""
    for tr in tbl.findall(W + "tr"):
        cells = [("".join(t.text or "" for t in tc.iter(W + "t"))).strip()
                 for tc in tr.findall(W + "tc")]
        if len(cells) < 3:
            continue
        name, code = cells[0], cells[1]
        if name and name != "成分名稱":
            current = name
        if current and re.fullmatch(r"[A-Z0-9]{10}", code):
            out[code] = current
    if not out:
        raise SystemExit("對照表讀出 0 筆")
    return out


def ingredient(raw):
    """成分欄是「ROSUVASTATIN CALCIUM 10 MG」，取到第一個數字之前。"""
    parts = []
    for tok in str(raw).strip().split():
        if tok[:1].isdigit():
            break
        parts.append(tok)
    return " ".join(parts) or str(raw).strip()


def generic(full):
    """彙總用的學名：取第一個詞。

    品項檔的成分欄鹽類寫法不一致——ATORVASTATIN (CALCIUM)、ATORVASTATIN CALCIUM、
    ATORVASTATIN CALCIUM ANHYDROUS、ATORVASTATIN CALCIUM TRIHYDRATE 是同一個學名的
    四種寫法。照原樣分組，「atorvastatin 有幾個走表二」會被拆成四堆而看不出來。
    只取第一個詞是刻意的保守作法：不去猜鹽類對應，也不維護一張同義字表
    （那會變成另一個要跟著官方改版的東西）。
    """
    tok = str(full).split()[0] if str(full).strip() else ""
    return tok.strip("(),").lower()


def roc_today():
    d = date.today()
    return int(f"{d.year - 1911}{d.month:02d}{d.day:02d}")


def price_of(raw):
    """支付價。**0 ＝ 已停止給付**，不是免費：那些代碼永遠留在品項檔（迄日 9991231），
    價格被歸零表示不再收載。實測現行代碼裡有 6 成是這種。"""
    try:
        return float(str(raw).strip() or 0)
    except ValueError:
        return 0.0


def roc_int(raw):
    """民國日期轉整數。**不能用字串比大小**：民國 98 年是 6 碼、115 年是 7 碼，
    字串比較下 "980930" > "1150901"，民國 98 年就過期的品項會被當成現行有效留下來
    （2026-09-01 實測踩到，EZETROL 那一列）。"""
    s = str(raw).strip()
    return int(s) if s.isdigit() else 0


def main():
    print("來源檔：")
    items = fetch(ITEMS_URL, CACHE / "nhi_drug_items.csv")
    docx = fetch(SECTION2_URL, CACHE / "section2.docx")

    two = table_two_codes(docx)
    print(f"\n「不適用表一」對照表：{len(two)} 個代碼、{len(set(two.values()))} 種成分")

    csv.field_size_limit(10_000_000)
    today = roc_today()
    current, skipped = {}, 0
    with io.open(items, encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        idx = {h: i for i, h in enumerate(next(reader))}
        for r in reader:
            if not str(r[idx["ATC代碼"]]).upper().startswith("C10"):
                continue
            start = roc_int(r[idx["有效起日"]])
            end = roc_int(r[idx["有效迄日"]])
            # 只收「生效區間涵蓋今天」的那一列。**不能取起日最大的那一列**：
            # 品項檔會預先登錄未來的異動，實測 BA25337100（Tulip 20mg）有一列
            # 起日 1161201、價 0（2027 年底才停付），取它會把一個現在還在給付的品項
            # 誤標成已停付。
            if start and start > today:
                skipped += 1
                continue
            if end and end < today:
                skipped += 1
                continue
            code = r[idx["藥品代號"]].strip()
            if code not in current or start > current[code][0]:
                current[code] = (start, r)
    print(f"ATC C10 涵蓋今天的 {len(current):,} 個代碼"
          f"（另有 {skipped:,} 列的生效區間不含今天，不收）")

    products = []
    for code in sorted(current):
        r = current[code][1]
        section = str(r[idx["給付規定章節"]]).strip()
        products.append({
            "code": code,
            "en": r[idx["藥品英文名稱"]].strip(),
            "zh": r[idx["藥品中文名稱"]].strip(),
            "ingredient": ingredient(r[idx["成分"]]),
            "generic": generic(ingredient(r[idx["成分"]])),
            "price": price_of(r[idx["支付價"]]),
            "listed": price_of(r[idx["支付價"]]) > 0,
            "section": section,
            "table": ("two" if code in two
                      else "one" if section.startswith("2.6.1")
                      else ""),
        })
    seen = set(current)

    missing = sorted(set(two) - seen)
    if missing:
        raise SystemExit(
            "「不適用表一」清單裡有代碼在品項檔查無或已失效：\n  "
            + "\n  ".join(missing)
            + "\n這代表兩份官方資料對不起來，先查清楚再產檔。")

    listed = [p for p in products if p["listed"]]
    counts = collections.Counter(p["table"] or "(其他章節)" for p in listed)
    print(f"\n現行給付中 {len(listed):,} 個（另有 {len(products) - len(listed):,} 個支付價 0＝已停付）")
    print("給付中的表別分佈：")
    for k, v in counts.most_common():
        print(f"  {k:<12} {v:>5}")
    dead_two = [p["code"] for p in products if p["table"] == "two" and not p["listed"]]
    if dead_two:
        print(f"  （表二清單裡已停付的：{len(dead_two)} 個 {dead_two}）")

    data = {
        "_schema": {
            "用途": "降血脂品項的代碼／商品名／學名反查，回答「我開的這個走表一還是表二」。",
            "listed": "支付價 > 0 才是現行給付中。0 的代碼仍留在品項檔（迄日 9991231），"
                      "但已停止給付——把它們當可開的品項，工具會對一個不給付的代碼說「符合表一」。"
                      "不刪除而是標記：醫師打了那個代碼要看到「已停付」而不是「查無」，"
                      "後者會讓人以為自己打錯字。",
            "table": "one＝適用表一｜two＝公告明列不適用表一、僅適用表二｜"
                     "空字串＝不是 2.6.1 的品項（2.6.2／2.6.3／2.6.4 另有自己的條件，"
                     "或品項檔未標章節），本工具不判斷它的表別。",
            "怎麼更新": "python build/fetch_lipid_products.py（會重抓兩個官方來源）。"
                        "品項檔每月更新、給付規定不定期改版，checked 過舊時 build.py 會警告。",
            "為什麼不只存表二那 116 個": "醫師手上是商品名，不是代碼清單。"
                                        "只存例外清單就只能回答「在不在清單上」，"
                                        "沒辦法從商品名反查代碼。",
        },
        "checked": date.today().isoformat(),
        "source": "健保署健保用藥品項查詢項目檔（開放資料，每月更新）；"
                  "藥品給付規定 第二節 2.6.1「不適用表一」對照表（115.8.21 版）",
        "tableTwoCodes": len(two),
        "products": products,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n",
                   encoding="utf-8")
    print(f"\n輸出 {OUT.relative_to(ROOT)}（{OUT.stat().st_size:,} bytes，{len(products):,} 個品項）")


if __name__ == "__main__":
    main()
