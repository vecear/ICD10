from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright, expect


@pytest.mark.parametrize('layout,width', [('wide', 1440), ('mobile', 390), ('dock', 176)])
def test_lipid_status_matches_clipboard(layout, width):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': width, 'height': 900},
                                permissions=['clipboard-read', 'clipboard-write'])
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto((Path(__file__).resolve().parents[1] / 'dist/icd10.html').as_uri())
        page.wait_for_selector('body[data-ready="1"]')
        page.evaluate('(layout) => window.ICDApp.store.setLayout(layout)', layout)
        expect(page.locator('#lipid-btn')).to_have_text('Lipid')
        page.locator('#lipid-btn').click()
        expect(page.locator('#lipid-title')).to_have_text('Lipid')
        for ldl, tg, hdl, expected in [
            ('180', '300', '35', ['lifestyle', 'lifestyle', 'lifestyle']),
            ('190', '500', '55', ['direct', 'lifestyle', 'direct']),
            ('60', '150', '55', ['no', 'no', 'no']),
            ('', '300', '', ['pending', 'pending', 'pending']),
        ]:
            for name, value in [('ldl', ldl), ('tg', tg), ('hdl', hdl)]:
                page.locator('#lipid-' + name).fill(value)
            blocks = page.locator('#lipid-result .lipid-block')
            expect(blocks).to_have_count(3)
            assert blocks.evaluate_all('(nodes) => nodes.map(n => n.dataset.treatmentStatus)') == expected
            verdicts = blocks.locator('.lipid-verdict').all_text_contents()
            page.locator('#lipid-copy').click()
            copied = page.evaluate('navigator.clipboard.readText()')
            for text in verdicts:
                assert text in copied
            assert '符合，可開' not in page.locator('#lipid-result').inner_text()
            if expected[0] == 'lifestyle':
                page.locator('#lipid-drug').fill('BC24131100')
                expect(page.locator('.lipid-hit-verdict')).to_contain_text('須先生活型態調整才可用藥')
                expect(page.locator('.lipid-hit.is-ok')).to_have_count(0)
                page.locator('#lipid-drug').fill('')
            assert page.locator('#lipid-panel').evaluate('(n) => n.scrollWidth <= n.clientWidth + 1')
        assert not errors
        browser.close()
