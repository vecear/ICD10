"""打包診間電腦要用的整包東西，輸出 診間包/ 與 診間包.zip。

包裡有三類東西：單檔 icd10.html、AutoHotkey 熱鍵（執行檔轉成文字）、
以及 健保條文/ 底下的官方 PDF——慢病速查每個主題最上方連的就是它們，
診間不能上網，條文不跟著寄就是點下去找不到檔案。

診間電腦只能收信、不能上網下載、不能插隨身碟，而 Gmail 會封鎖 .exe（連壓縮檔裡的
也擋，它看的是內容標頭不是副檔名）。所以 AutoHotkey 的執行檔在這裡轉成純文字，
到診間用 Windows 內建的 certutil 還原——做法寫在包裡的使用說明。

用法：
    python tools/pack_for_clinic.py

改完程式碼之後跑一次，把產出的 診間包.zip 整包寄到診間、解壓覆蓋舊資料夾即可，
不需要記哪個檔有更新。每次都會重新驗證：base64 還原出來的 SHA-256 要與原檔相同，
且 zip 裡不得有任何會被郵件擋下的副檔名。
"""
import base64
import hashlib
import io
import json
import os
import re
import shutil
import sys
import zipfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
NHI_DOC_DIR_NAME = "健保條文"
NHI_DOCS = ROOT / NHI_DOC_DIR_NAME
CHRONIC_CARE = ROOT / "src" / "curated" / "chronic_care.json"
OUT_DIR = ROOT / "診間包"
OUT_ZIP = ROOT / "診間包.zip"

# 腳本在診間會被命名成 AutoHotkey64.ahk——與執行檔同名，雙擊 exe 就會自動載入它
# （實測：檔名不同名時雙擊只會開 AutoHotkey 自己的視窗）。
SCRIPT_AS = "AutoHotkey64.ahk"
ENCODED_AS = "AutoHotkey64.txt"

# Gmail 封鎖清單裡會出現在我們包裡的那些。zip 內含任一個就整封被擋。
BLOCKED_SUFFIXES = {".exe", ".bat", ".cmd", ".com", ".scr", ".ps1", ".vbs", ".js", ".jar", ".msi"}

# dist 新鮮度閘門要盯的來源：改了這些卻忘了重新 build，dist 就是安靜地舊掉。
SRC = ROOT / "src"
BUILD_SCRIPT = ROOT / "build" / "build.py"
DATA_DIR = ROOT / "data"

# 診間包.zip 超過這個門檻就中止；Gmail 附件上限 25 MB，留 3 MB 當餘裕。
ZIP_SIZE_LIMIT_MB = 22

# 使用說明裡如果還教人按這些已經移除的東西，就是打包前忘了同步文件。
GONE_PHRASES = ("複製並貼入 HIS", "「全部」鈕", "桌機版面")


def find_ahk_exe():
    """依序找 AutoHotkey64.exe：專案內 → 使用者安裝 → 系統安裝。"""
    candidates = [
        TOOLS / "AutoHotkey64.exe",
        Path(os.environ.get("LOCALAPPDATA", "")) / "Programs/AutoHotkey/v2/AutoHotkey64.exe",
        Path(os.environ.get("ProgramFiles", "")) / "AutoHotkey/v2/AutoHotkey64.exe",
    ]
    for path in candidates:
        if path.is_file():
            return path
    raise SystemExit(
        "找不到 AutoHotkey64.exe。三個辦法擇一：\n"
        "  1. winget install AutoHotkey.AutoHotkey\n"
        "  2. 到 https://github.com/AutoHotkey/AutoHotkey/releases 下載 zip 版，\n"
        "     解壓後把 AutoHotkey64.exe 放進 tools/\n"
        "  3. 直接把既有的 AutoHotkey64.exe 複製到 tools/"
    )


def check_manual_line_numbers(manual, script):
    """說明檔教使用者「改第 N 行」；動過腳本之後那些行號就偏了。

    診間沒有人能發現說明是錯的——他只會照著改到別的設定上。所以每次打包都核對，
    對不上就直接讓打包失敗。判斷方式：說明檔同一行裡同時出現「第 N 行」與設定名。
    """
    code_lines = script.read_text(encoding="utf-8").splitlines()
    actual = {}
    for i, line in enumerate(code_lines, 1):
        name = line.split(":=")[0].strip()
        if name.isidentifier() and name.isupper() and name not in actual:
            actual[name] = i

    problems = []
    for line in manual.read_text(encoding="utf-8").splitlines():
        hit = re.search(r"第\s*(\d+)\s*行", line)
        if not hit:
            continue
        for name, real in actual.items():
            if name in line and int(hit.group(1)) != real:
                problems.append(f"{name}：說明寫第 {hit.group(1)} 行，實際在第 {real} 行")
    return problems


def check_dist_freshness(dist, src_dir=None, build_script=None, data_dir=None, docs_dir=None):
    """dist/icd10.html 的 mtime 必須晚於所有原始碼／資料／官方條文。

    忘了在改完程式碼後重新跑 build.py，寄出去的就是舊版——而診間看不出來，
    因為檔案確實存在、開得起來，只是內容是改動之前的。四個參數留給測試餵
    tmp_path 造的假目錄，不帶時檢查真正的專案目錄。
    """
    src_dir = SRC if src_dir is None else src_dir
    build_script = BUILD_SCRIPT if build_script is None else build_script
    data_dir = DATA_DIR if data_dir is None else data_dir
    docs_dir = NHI_DOCS if docs_dir is None else docs_dir

    watched = [p for p in src_dir.rglob("*") if p.is_file()]
    watched.append(build_script)
    watched.extend(sorted(data_dir.glob("*.json")))
    watched.extend(sorted(docs_dir.glob("*.pdf")))

    dist_mtime = dist.stat().st_mtime
    stale = sorted(
        {p for p in watched if p.is_file() and p.stat().st_mtime > dist_mtime},
        key=str,
    )
    if stale:
        names = "\n  ".join(str(p) for p in stale)
        raise SystemExit(
            f"{dist} 比下列檔案舊，尚未重新打包最新的程式碼：\n  {names}\n"
            "請先跑 python build/build.py"
        )


def check_zip_size(zip_path, limit_mb=None):
    """診間包.zip 超過門檻就中止；Gmail 附件上限 25 MB，門檻留餘裕。"""
    limit_mb = ZIP_SIZE_LIMIT_MB if limit_mb is None else limit_mb
    size_mb = zip_path.stat().st_size / 1024 / 1024
    if size_mb > limit_mb:
        raise SystemExit(
            f"{zip_path.name} 大小 {size_mb:.2f} MB 超過 {limit_mb} MB 門檻"
            "（Gmail 附件上限 25 MB）"
        )


def check_gone_buttons(path):
    """path 若還教使用者按已經移除的東西就中止。

    「舊版那顆…已經移除」這種交代式的句子要放過——那對用過舊版的人正是有用的
    資訊，所以只在「同一行沒有提到移除」時才算數。
    """
    text = path.read_text(encoding="utf-8")
    for line in text.splitlines():
        for gone in GONE_PHRASES:
            if gone in line and "移除" not in line:
                raise SystemExit(
                    f"{path} 還在教使用者按已移除的「{gone}」：\n  {line.strip()}\n"
                    f"請先更新 {path}"
                )


def nhi_docs_referenced():
    """chronic_care.json 裡被引用到的官方條文檔名。

    build.py 已經擋過「檔案不存在」，這裡擋的是另一種：檔案在 健保條文/、
    但**沒有被複製進包裡**。兩關看的是不同的東西，不能只留一關——
    包寄出去之後沒有人會再檢查，而診間補不了檔。
    """
    raw = json.loads(CHRONIC_CARE.read_text(encoding="utf-8"))
    names = set()
    for topic in raw.get("topics") or []:
        for doc in topic.get("docs") or []:
            name = str((doc or {}).get("file") or "").strip()
            if name:
                names.add(name)
    return names


def to_pem_base64(data):
    """轉成 certutil -decode 認得的 PEM 格式（每行 64 字元）。"""
    b64 = base64.b64encode(data).decode("ascii")
    lines = [b64[i:i + 64] for i in range(0, len(b64), 64)]
    return "-----BEGIN CERTIFICATE-----\n" + "\n".join(lines) + "\n-----END CERTIFICATE-----\n"


def from_pem_base64(text):
    """還原（模擬 certutil -decode），用來自我驗證。"""
    body = "".join(line for line in text.splitlines() if "CERTIFICATE" not in line)
    return base64.b64decode(body)


def main():
    dist = ROOT / "dist" / "icd10.html"
    script = TOOLS / "his-paste.ahk"
    manual = TOOLS / "診間使用說明.txt"
    for path in (dist, script, manual):
        if not path.is_file():
            raise SystemExit(f"缺少 {path.relative_to(ROOT)}"
                             + ("（先跑 python build/build.py）" if path == dist else ""))

    check_dist_freshness(dist)

    wanted_docs = nhi_docs_referenced()
    missing_docs = sorted(n for n in wanted_docs if not (NHI_DOCS / n).is_file())
    if missing_docs:
        raise SystemExit(f"{NHI_DOC_DIR_NAME}/ 缺少慢病速查引用的條文檔：\n  "
                         + "\n  ".join(missing_docs))

    stale = check_manual_line_numbers(manual, script)
    if stale:
        raise SystemExit("使用說明的行號與 his-paste.ahk 對不上：\n  " + "\n  ".join(stale))

    # 說明如果還教使用者去按已經移除的東西，診間會照著找不存在的按鈕。
    # 掃描範圍含 tools/README.md：那份是 AHK 熱鍵的使用說明，一樣會教過時的按鈕。
    # README 沒有「改第 N 行」這種指令，所以只做 gone 檢查，不套行號檢查。
    for doc in (manual, TOOLS / "README.md"):
        check_gone_buttons(doc)

    exe = find_ahk_exe()
    exe_bytes = exe.read_bytes()
    exe_sha = hashlib.sha256(exe_bytes).hexdigest()

    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir()

    shutil.copy2(dist, OUT_DIR / "icd10.html")
    shutil.copy2(script, OUT_DIR / SCRIPT_AS)
    shutil.copy2(manual, OUT_DIR / "使用說明.txt")
    (OUT_DIR / ENCODED_AS).write_text(to_pem_base64(exe_bytes), encoding="ascii", newline="\n")
    doc_out = OUT_DIR / NHI_DOC_DIR_NAME
    doc_out.mkdir()
    for pdf in sorted(NHI_DOCS.glob("*.pdf")):
        shutil.copy2(pdf, doc_out / pdf.name)

    # 自我驗證 1：還原出來的位元組要與原檔一模一樣，否則診間會拿到壞掉的執行檔
    restored = from_pem_base64((OUT_DIR / ENCODED_AS).read_text(encoding="ascii"))
    restored_sha = hashlib.sha256(restored).hexdigest()
    if restored_sha != exe_sha:
        raise SystemExit(f"還原後 SHA-256 不符：{restored_sha} != {exe_sha}")

    if OUT_ZIP.exists():
        OUT_ZIP.unlink()
    with zipfile.ZipFile(OUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        # rglob 而不是 iterdir：健保條文/ 是子資料夾，只掃第一層會把條文整批漏掉，
        # 而且**不會報錯**——寄出去的包看起來完整，診間點條文才發現沒有。
        for item in sorted(OUT_DIR.rglob("*")):
            if item.is_file():
                zf.write(item, item.relative_to(OUT_DIR).as_posix())

    # 自我驗證 2：zip 大小不得超過門檻，否則寄出去可能直接被信箱容量或附件上限擋下
    check_zip_size(OUT_ZIP)

    # 自我驗證 3：zip 裡不得有會被郵件擋下的副檔名
    with zipfile.ZipFile(OUT_ZIP) as zf:
        names = zf.namelist()
    blocked = [n for n in names if Path(n).suffix.lower() in BLOCKED_SUFFIXES]
    if blocked:
        raise SystemExit(f"zip 裡有會被郵件封鎖的檔案：{blocked}")

    # 自我驗證 4：慢病速查引用的每一份條文都要真的在 zip 裡，路徑還要與網頁算出來的
    # 相對路徑一致（健保條文/檔名）。少一份的表現是診間點下去找不到檔案。
    zipped = set(names)
    lost = sorted(n for n in wanted_docs if f"{NHI_DOC_DIR_NAME}/{n}" not in zipped)
    if lost:
        raise SystemExit("zip 裡缺少慢病速查引用的條文檔：\n  " + "\n  ".join(lost))

    print(f"AutoHotkey 來源：{exe}")
    print(f"  SHA-256 {exe_sha}")
    print(f"  轉成文字後還原比對：相同 ✔")
    print()
    print(f"輸出資料夾 {OUT_DIR.name}/")
    for item in sorted(OUT_DIR.iterdir()):
        if item.is_dir():
            kids = sorted(item.iterdir())
            size = sum(k.stat().st_size for k in kids) / 1024
            print(f"  {item.name + '/':<20} {size:>8,.0f} KB（{len(kids)} 個檔）")
            for kid in kids:
                print(f"    {kid.name}")
            continue
        print(f"  {item.name:<20} {item.stat().st_size / 1024:>8,.0f} KB")
    print()
    print(f"壓縮檔 {OUT_ZIP.name}  {OUT_ZIP.stat().st_size / 1024 / 1024:.2f} MB"
          f"（Gmail 上限 25 MB）")
    print(f"  內含 {len(names)} 個檔，無執行檔副檔名 ✔")
    print(f"  慢病速查引用的 {len(wanted_docs)} 份官方條文都在包裡 ✔")
    print()
    print("把這個 zip 整包寄到診間，解壓後覆蓋原本的資料夾即可。")
    print("第一次使用要先做一次還原：見包裡的「使用說明.txt」第二步。")


if __name__ == "__main__":
    main()
