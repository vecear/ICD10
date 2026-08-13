"""打包診間電腦要用的整包東西，輸出 診間包/ 與 診間包.zip。

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
import os
import re
import shutil
import sys
import zipfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
OUT_DIR = ROOT / "診間包"
OUT_ZIP = ROOT / "診間包.zip"

# 腳本在診間會被命名成 AutoHotkey64.ahk——與執行檔同名，雙擊 exe 就會自動載入它
# （實測：檔名不同名時雙擊只會開 AutoHotkey 自己的視窗）。
SCRIPT_AS = "AutoHotkey64.ahk"
ENCODED_AS = "AutoHotkey64.txt"

# Gmail 封鎖清單裡會出現在我們包裡的那些。zip 內含任一個就整封被擋。
BLOCKED_SUFFIXES = {".exe", ".bat", ".cmd", ".com", ".scr", ".ps1", ".vbs", ".js", ".jar", ".msi"}


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

    stale = check_manual_line_numbers(manual, script)
    if stale:
        raise SystemExit("使用說明的行號與 his-paste.ahk 對不上：\n  " + "\n  ".join(stale))

    # 說明如果還教使用者去按已經移除的東西，診間會照著找不存在的按鈕。
    # 「舊版那顆…已經移除」這種交代式的句子要放過——那對用過舊版的人正是有用的資訊，
    # 所以只在「同一行沒有提到移除」時才算數。
    manual_text = manual.read_text(encoding="utf-8")
    for line in manual_text.splitlines():
        for gone in ("複製並貼入 HIS", "「全部」鈕"):
            if gone in line and "移除" not in line:
                raise SystemExit(f"使用說明還在教使用者按已移除的「{gone}」：\n  {line.strip()}\n"
                                 "請先更新 tools/診間使用說明.txt")

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

    # 自我驗證 1：還原出來的位元組要與原檔一模一樣，否則診間會拿到壞掉的執行檔
    restored = from_pem_base64((OUT_DIR / ENCODED_AS).read_text(encoding="ascii"))
    restored_sha = hashlib.sha256(restored).hexdigest()
    if restored_sha != exe_sha:
        raise SystemExit(f"還原後 SHA-256 不符：{restored_sha} != {exe_sha}")

    if OUT_ZIP.exists():
        OUT_ZIP.unlink()
    with zipfile.ZipFile(OUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        for item in sorted(OUT_DIR.iterdir()):
            zf.write(item, item.name)

    # 自我驗證 2：zip 裡不得有會被郵件擋下的副檔名
    with zipfile.ZipFile(OUT_ZIP) as zf:
        names = zf.namelist()
    blocked = [n for n in names if Path(n).suffix.lower() in BLOCKED_SUFFIXES]
    if blocked:
        raise SystemExit(f"zip 裡有會被郵件封鎖的檔案：{blocked}")

    print(f"AutoHotkey 來源：{exe}")
    print(f"  SHA-256 {exe_sha}")
    print(f"  轉成文字後還原比對：相同 ✔")
    print()
    print(f"輸出資料夾 {OUT_DIR.name}/")
    for item in sorted(OUT_DIR.iterdir()):
        print(f"  {item.name:<20} {item.stat().st_size / 1024:>8,.0f} KB")
    print()
    print(f"壓縮檔 {OUT_ZIP.name}  {OUT_ZIP.stat().st_size / 1024 / 1024:.2f} MB"
          f"（Gmail 上限 25 MB）")
    print(f"  內含 {len(names)} 個檔，無執行檔副檔名 ✔")
    print()
    print("把這個 zip 整包寄到診間，解壓後覆蓋原本的資料夾即可。")
    print("第一次使用要先做一次還原：見包裡的「使用說明.txt」第二步。")


if __name__ == "__main__":
    main()
