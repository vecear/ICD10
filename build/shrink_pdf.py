"""無損瘦身 PDF：字型子集化＋清掉沒用的物件，原地覆寫。新增教材 PDF 到 疫苗/ 時先跑一次。

用法：
    python build/shrink_pdf.py <pdf> [<pdf> ...]

為什麼需要：診間包靠 Gmail 寄送（門檻見 tools/pack_for_clinic.py 的 ZIP_SIZE_LIMIT_MB），
使用者自己做的講義常內嵌整套沒子集化的中文字型（實例：許智堯講義的微軟正黑體字型流
4.9 MB，整份 5.27 MB 裡佔了 4 MB）。

只做無損的兩件事：subset_fonts()（只留用到的字形）與 save(garbage=4, deflate=True)。
**不點陣化任何頁面**——那會丟掉文字層（無法選取、搜尋）。

自檢：頁數相同、逐頁抽出的文字相同，兩項都過才覆寫；變大就不覆寫。
**只用在使用者自己提供的教材。** 疾管署／健保署的官方檔不要跑：vaccine_guide.json 與
antimicrobial_coverage.json 登記 SHA-256 的意義是「與官方檔位元組相同」。
跑完要更新 src/curated/vaccine_guide.json 該筆的 sha256（腳本會印出新值），再重新 build。
"""
import hashlib
import os
import sys
from pathlib import Path

import pymupdf


def page_texts(doc):
    return [page.get_text() for page in doc]


def shrink(path):
    """回傳 (原始 bytes, 新 bytes, 新 sha256)；自檢失敗丟 ValueError，檔案不動。"""
    path = Path(path)
    before = path.stat().st_size
    with pymupdf.open(path) as doc:
        texts = page_texts(doc)
        doc.subset_fonts()
        data = doc.tobytes(garbage=4, deflate=True)
    with pymupdf.open("pdf", data) as check:
        if check.page_count != len(texts):
            raise ValueError(f"{path.name}：頁數 {len(texts)} → {check.page_count}，不覆寫")
        changed = [i + 1 for i, (a, b) in enumerate(zip(texts, page_texts(check))) if a != b]
        if changed:
            raise ValueError(f"{path.name}：第 {changed} 頁文字不同，不覆寫")
    if len(data) >= before:
        return before, before, hashlib.sha256(path.read_bytes()).hexdigest()
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_bytes(data)
    os.replace(tmp, path)
    return before, len(data), hashlib.sha256(data).hexdigest()


def main(argv):
    sys.stdout.reconfigure(encoding="utf-8")
    if not argv:
        raise SystemExit(__doc__)
    for arg in argv:
        before, after, sha = shrink(arg)
        print(f"{Path(arg).name}")
        print(f"  {before:,} → {after:,} bytes（{after / before:.0%}）")
        print("  自檢：頁數相同、逐頁文字相同" + ("" if after < before else "；沒有變小，未覆寫"))
        print(f"  sha256 {sha}")


if __name__ == "__main__":
    main(sys.argv[1:])
