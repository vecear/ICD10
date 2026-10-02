"""以已驗證的離線 HTML 與引用文件組成 GitHub Pages 網站。"""
import argparse
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def prepare_pages(root, output):
    root, output = Path(root), Path(output)
    if output.exists():
        raise FileExistsError(f'輸出目錄已存在，請使用空的新路徑：{output}')
    curated = root / 'src/curated'
    chronic = json.loads((curated / 'chronic_care.json').read_text(encoding='utf-8'))
    vaccine = json.loads((curated / 'vaccine_guide.json').read_text(encoding='utf-8'))
    antimicrobial = json.loads((curated / 'antimicrobial_coverage.json').read_text(encoding='utf-8'))
    documents = {
        '健保條文': {doc['file'] for topic in chronic['topics'] for doc in topic['docs']} | {s['file'] for s in antimicrobial['sources']},
        '疫苗': {source['file'] for source in vaccine['sources']},
    }
    files = {Path('index.html'): root / 'dist/icd10.html',
             Path('icd10.html'): root / 'dist/icd10.html'}
    for folder, names in documents.items():
        for name in sorted(names):
            if not name or name in ('.', '..') or any(char in name for char in '/\\:'):
                raise ValueError(f'來源必須是資料夾內的檔名：{name}')
            relative = Path(folder) / name
            files[relative] = root / relative
    # 所有來源完整才建立輸出；只複製清單內的檔案。
    for source in files.values():
        if not source.is_file():
            raise FileNotFoundError(f'缺少發布來源：{source}')
    output.mkdir(parents=True)
    for relative, source in files.items():
        target = output / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    return len(files)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True, help='尚未存在的網站輸出目錄')
    args = parser.parse_args()
    count = prepare_pages(ROOT, args.output)
    print(f'GitHub Pages：{count} 個檔案，輸出至 {args.output}')
