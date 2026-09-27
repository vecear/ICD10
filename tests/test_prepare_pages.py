"""發布入口與來源文件完整性，不帶入無關本機檔案。"""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'tools' / 'prepare_pages.py'


class PreparePagesTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.output = self.root / '_site'
        for folder in ('dist', 'src/curated', '健保條文', '疫苗'):
            (self.root / folder).mkdir(parents=True)
        (self.root / 'dist/icd10.html').write_bytes(b'<html>verified app</html>')
        self.write_json('chronic_care.json', {'topics': [{'docs': [{'file': '條文.pdf'}]}]})
        self.write_json('vaccine_guide.json', {'sources': [{'file': '來源 摘要.txt'}]})
        (self.root / '健保條文/條文.pdf').write_bytes(b'%PDF-test')
        (self.root / '疫苗/來源 摘要.txt').write_text('來源', encoding='utf-8')
        spec = importlib.util.spec_from_file_location('prepare_pages', SCRIPT)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        self.prepare = module.prepare_pages

    def write_json(self, name, data):
        (self.root / 'src/curated' / name).write_text(json.dumps(data), encoding='utf-8')

    def test_entry_and_sources_match_without_unrelated_files(self):
        (self.root / '疫苗/未追蹤海報.jpg').write_bytes(b'private')
        (self.root / 'dist/unrelated.txt').write_text('not for publishing')
        self.prepare(self.root, self.output)
        self.assertEqual({p.relative_to(self.output).as_posix() for p in self.output.rglob('*') if p.is_file()},
                         {'index.html', 'icd10.html', '健保條文/條文.pdf', '疫苗/來源 摘要.txt'})
        for name in ('index.html', 'icd10.html'):
            self.assertEqual((self.output / name).read_bytes(), (self.root / 'dist/icd10.html').read_bytes())
        self.assertEqual((self.output / '疫苗/來源 摘要.txt').read_bytes(), (self.root / '疫苗/來源 摘要.txt').read_bytes())

    def test_missing_source_aborts_before_creating_output(self):
        (self.root / '健保條文/條文.pdf').unlink()
        with self.assertRaises(FileNotFoundError):
            self.prepare(self.root, self.output)
        self.assertFalse(self.output.exists())

    def test_rejects_source_outside_document_folder(self):
        self.write_json('vaccine_guide.json', {'sources': [{'file': '../secret.txt'}]})
        with self.assertRaises(ValueError):
            self.prepare(self.root, self.output)
        self.assertFalse(self.output.exists())

    def test_preserves_existing_output(self):
        self.output.mkdir()
        keep = self.output / 'keep.txt'
        keep.write_text('keep')
        with self.assertRaises(FileExistsError):
            self.prepare(self.root, self.output)
        self.assertEqual(keep.read_text(), 'keep')


if __name__ == '__main__':
    unittest.main()
