from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright, expect

URL = (Path(__file__).resolve().parents[1] / 'dist/icd10.html').as_uri()


def open_settings(page, kind):
    page.locator('#settings-toggle').click()
    if page.locator('#clipboard-open').is_visible():
        page.locator('#clipboard-open').click()
    page.locator('#clipboard-kind').select_option(kind)


def save_template(page, template):
    page.locator('#clipboard-template').fill(template)
    page.locator('#clipboard-save').click()
    expect(page.locator('#clipboard-message')).to_contain_text('已儲存')
    page.locator('#settings-toggle').click()


@pytest.mark.parametrize('layout,width', [('wide', 1440), ('mobile', 390), ('dock', 176)])
def test_all_outputs_can_be_customized_and_persist(layout, width):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={'width': width, 'height': 900}, permissions=['clipboard-read', 'clipboard-write'])
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(URL)
        page.wait_for_selector('body[data-ready="1"]')
        if layout == 'dock':
            page.evaluate("window.ICDApp.store.setLayout('dock')")
        open_settings(page, 'date')
        expect(page.locator('#clipboard-kind option')).to_have_count(5)
        page.locator('#clipboard-template').fill('{不存在}')
        expect(page.locator('#clipboard-error')).to_contain_text('不存在')
        expect(page.locator('#clipboard-save')).to_be_disabled()
        page.locator('#clipboard-template').fill('日期：{西元年}/{月}/{日}')
        expect(page.locator('#clipboard-preview')).to_contain_text('日期：2026/09/16')
        assert page.locator('#settings-popover').evaluate('(n) => n.scrollWidth <= n.clientWidth + 1')
        page.evaluate("navigator.clipboard.writeText('keep')")
        page.locator('#clipboard-save').click()
        assert page.evaluate('navigator.clipboard.readText()').replace('\r\n', '\n') == 'keep'
        page.locator('#settings-toggle').click()
        page.locator('#copy-date').click()
        expected = page.evaluate("() => { const d = new Date(); return '日期：' + d.getFullYear() + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + String(d.getDate()).padStart(2,'0'); }")
        assert page.evaluate('navigator.clipboard.readText()').replace('\r\n', '\n') == expected
        page.reload()
        page.wait_for_selector('body[data-ready="1"]')
        open_settings(page, 'date')
        expect(page.locator('#clipboard-template')).to_have_value('日期：{西元年}/{月}/{日}')
        page.locator('#clipboard-kind').select_option('cart')
        page.locator('#clipboard-itemTemplate').fill('{序號}. {代碼} {名稱}')
        save_template(page, '診斷\n{清單}')
        page.locator('#search').fill('I10')
        page.locator('#search-results .chip[data-code="I10"]').click()
        text = page.evaluate('navigator.clipboard.readText()').replace('\r\n', '\n')
        assert text.startswith('診斷\n1. I10 ')
        if layout != 'dock':
            assert page.locator('#his-preview').text_content() == text
        else:
            assert page.evaluate('window.ICDRender.hisText(window.ICDApp.ctx)') == text
        page.locator('#search').fill('')
        open_settings(page, 'single')
        save_template(page, '單碼：{代碼}')
        # 手機清單抽屜需要先展開。
        if layout == 'mobile' or (layout == 'dock' and not page.locator('b.cart-code').first.is_visible()):
            page.locator('#cart-toggle').click()
        page.locator('b.cart-code').first.click()
        assert page.evaluate('navigator.clipboard.readText()').replace('\r\n', '\n') == '單碼：I10'
        if layout == 'mobile':
            page.locator('#cart-toggle').click()
        open_settings(page, 'ccr')
        save_template(page, '腎功能：{CCr} {單位}')
        page.locator('#ccr-btn').click()
        for key, value in [('age', '60'), ('weight', '70'), ('cr', '1')]:
            page.locator('#ccr-' + key).fill(value)
        page.locator('#ccr-copy').click()
        assert page.evaluate('navigator.clipboard.readText()').replace('\r\n', '\n').startswith('腎功能：')
        page.locator('#ccr-close').click()
        open_settings(page, 'lipid')
        page.locator('#clipboard-sectionTemplate').fill('{表名}：{結論}')
        save_template(page, '{表一}\n{表二}')
        page.locator('#lipid-btn').click()
        page.locator('#lipid-ldl').fill('180')
        page.locator('#lipid-copy').click()
        lipid = page.evaluate('navigator.clipboard.readText()').replace('\r\n', '\n')
        assert '須先生活型態調整才可用藥' in lipid
        assert '目前不符合健保起始用藥條件' in lipid
        assert '來源' not in lipid
        page.locator('#lipid-close').click()
        open_settings(page, 'date')
        page.locator('#clipboard-reset').click()
        expect(page.locator('#clipboard-template')).to_have_value('{民國年}-{月}-{日}')
        assert not errors
        browser.close()


def test_pip_settings_tokens_and_copy_paths():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={'width': 1100, 'height': 900}, permissions=['clipboard-read', 'clipboard-write'])
        page = context.new_page()
        page.goto(URL)
        page.wait_for_selector('body[data-ready="1"]')
        page.evaluate("window.ICDApp.store.setLayout('dock')")
        with context.expect_page() as event:
            page.locator('#pin-toggle').click()
        pip = event.value
        pip.wait_for_selector('#settings-toggle')
        open_settings(pip, 'date')
        pip.locator('#clipboard-template').fill('PiP-')
        pip.locator('[data-target-field="template"][data-clipboard-token="月"]').click()
        expect(pip.locator('#clipboard-template')).to_have_value('PiP-{月}')
        pip.locator('#clipboard-save').click()
        pip.locator('#settings-toggle').click()
        pip.locator('#copy-date').click()
        month = pip.evaluate("String(new Date().getMonth()+1).padStart(2,'0')")
        assert pip.evaluate('navigator.clipboard.readText()') == 'PiP-' + month
        open_settings(pip, 'cart')
        save_template(pip, 'PiP 清單\n{清單}')
        pip.locator('#search').fill('I10')
        pip.locator('#search-results .chip[data-code="I10"]').click()
        assert pip.evaluate('navigator.clipboard.readText()').replace('\r\n', '\n') == 'PiP 清單\nI10'
        pip.locator('#search').fill('')
        open_settings(pip, 'single')
        save_template(pip, 'PiP 單碼 {代碼}')
        pip.locator('b.cart-code').first.focus()
        pip.keyboard.press('Enter')
        assert pip.evaluate('navigator.clipboard.readText()') == 'PiP 單碼 I10'
        open_settings(pip, 'ccr')
        save_template(pip, 'PiP CCr {CCr}')
        pip.locator('#ccr-btn').click()
        for key, value in [('age', '60'), ('weight', '70'), ('cr', '1')]:
            pip.locator('#ccr-' + key).fill(value)
        pip.locator('#ccr-copy').click()
        assert pip.evaluate('navigator.clipboard.readText()').startswith('PiP CCr ')
        pip.locator('#ccr-close').click()
        open_settings(pip, 'lipid')
        pip.locator('#clipboard-sectionTemplate').fill('{結論}')
        save_template(pip, 'PiP Lipid\n{表一}')
        pip.locator('#lipid-btn').click()
        for ldl, expected in [('180', '須先生活型態'), ('190', '可直接開始用藥'), ('50', '目前不符合')]:
            pip.locator('#lipid-ldl').fill(ldl)
            pip.locator('#lipid-copy').click()
            copied = pip.evaluate('navigator.clipboard.readText()')
            assert copied.startswith('PiP Lipid')
            assert expected in copied
        pip.close()
        browser.close()


def test_old_format_switch_refreshes_saved_editor():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        page.goto(URL)
        page.wait_for_selector('body[data-ready="1"]')
        open_settings(page, 'cart')
        page.locator('#clipboard-itemTemplate').fill('custom:{代碼}')
        page.locator('#clipboard-save').click()
        page.locator('#clipboard-back').click()
        page.locator('[data-format="names"]').click()
        page.locator('#clipboard-open').click()
        expect(page.locator('#clipboard-itemTemplate')).to_have_value('{代碼}\t{名稱}')
        expect(page.locator('#clipboard-preview')).not_to_contain_text('custom:')
        browser.close()


def test_selecting_same_old_format_resynchronizes_clipboard():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1440, 'height': 900}, permissions=['clipboard-read', 'clipboard-write'])
        page.goto(URL)
        page.wait_for_selector('body[data-ready="1"]')
        open_settings(page, 'cart')
        page.locator('#clipboard-itemTemplate').fill('custom:{代碼}')
        save_template(page, '{清單}')
        page.locator('#search').fill('I10')
        page.locator('#search-results .chip[data-code="I10"]').click()
        assert page.evaluate('navigator.clipboard.readText()') == 'custom:I10'
        open_settings(page, 'cart')
        page.locator('#clipboard-back').click()
        page.locator('[data-format="lines"]').click()
        expect(page.locator('#his-preview')).to_have_text('I10')
        assert page.evaluate('navigator.clipboard.readText()') == 'I10'
        browser.close()
