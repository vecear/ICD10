"""選碼只更新清單，三種版面皆不顯示相關疾病推薦。"""
from pathlib import Path

import pytest
from playwright.sync_api import expect, sync_playwright


@pytest.mark.parametrize("layout,width", [("wide", 1440), ("mobile", 390), ("dock", 340)])
def test_select_disease_without_related_suggestions(layout, width):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": width, "height": 900})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto((Path(__file__).resolve().parents[1] / "dist/icd10.html").as_uri())
        page.wait_for_selector('body[data-ready="1"]')
        page.evaluate("(layout) => window.ICDApp.store.setLayout(layout)", layout)
        page.fill("#search", "N39.0")
        chip = page.locator('#search-results .chip[data-code="N39.0"]')
        chip.click()
        chip.click()
        assert page.evaluate("window.ICDApp.store.getState().cart.map(x => x.code)") == ["N39.0"]
        expect(page.locator("#related, #related-wrap, #mobile-related, #dock-related")).to_have_count(0)
        for target in ("wide", "mobile", "dock"):
            page.evaluate("(layout) => window.ICDApp.store.setLayout(layout)", target)
            expect(page.locator("#related, #related-wrap, #mobile-related, #dock-related")).to_have_count(0)
        assert not errors
        browser.close()
