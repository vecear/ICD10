"""關鍵字/代碼前綴查全庫。用法：python build/lookup.py <關鍵字> [上限]"""
import io, json, sys
from pathlib import Path

def main():
    sys.stdout.reconfigure(encoding="utf-8")
    q = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 30
    rows = json.loads((Path(__file__).resolve().parent.parent / "data" / "codes.min.json").read_text(encoding="utf-8"))
    ql, qc = q.lower(), q.upper().replace(".", "")
    n = 0
    for code, use, en, zh in rows:
        if code.replace(".", "").startswith(qc) or ql in en.lower() or q in zh:
            print(f"{code}\tUSE={use}\t{zh}\t{en}")
            n += 1
            if n >= limit: break

if __name__ == "__main__":
    main()
