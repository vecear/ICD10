"""窄欄審查回歸：延遲載入收藏名稱、PiP 視窗快捷鍵與中文組字。"""
from pathlib import Path

import pytest
from playwright.sync_api import expect, sync_playwright


URL = (Path(__file__).resolve().parents[1] / 'dist/icd10.html').as_uri()


@pytest.fixture(scope='module')
def browser():
    with sync_playwright() as p:
        instance = p.chromium.launch()
        yield instance
        instance.close()


@pytest.fixture
def page(browser):
    context = browser.new_context(viewport={'width': 340, 'height': 900})
    current = context.new_page()
    current.add_init_script("""
        localStorage.setItem('icd10.layout', JSON.stringify('dock'));
        localStorage.setItem('icd10.favs', JSON.stringify(['A00.0']));
        // 由測試明確觸發全庫載入，保留使用者先開收藏的時間順序。
        window.requestIdleCallback = () => 0;
    """)
    current.set_default_timeout(5000)
    current.goto(URL)
    current.wait_for_selector('body[data-ready="1"]')
    yield current
    context.close()


def open_real_pip(page):
    assert page.evaluate("""() => typeof documentPictureInPicture === 'object'
        && typeof documentPictureInPicture.requestWindow === 'function'"""), (
        '本回歸測試需要 Chromium 的真正 Document Picture-in-Picture'
    )
    with page.context.expect_page() as event:
        page.locator('#pin-toggle').click()
    pip = event.value
    pip.set_default_timeout(5000)
    pip.wait_for_selector('#layout-dock')
    expect(page.locator('#layout-dock')).to_have_count(0)
    return pip


def test_favorite_name_updates_when_full_database_finishes_loading(page):
    assert page.evaluate('ICDApp.data.isReady()') is False
    page.locator('#dock-favorites-toggle').click()
    favorite = page.locator('#dock-favorites [data-favorite-row="A00.0"] .chip-zh')
    expect(favorite).to_have_text('')

    page.evaluate('ICDApp.data.ensureDb()')
    assert page.evaluate('ICDApp.data.isReady()') is True
    label = page.evaluate('ICDApp.data.labelOf("A00.0")')
    assert label, '全庫載入後應有 A00.0 的官方中文名稱'
    # 不重開收藏、不切換版面，已顯示的那一列應直接補上名稱。
    expect(favorite).to_have_text(label)


def test_slash_focuses_search_from_pip_document_body(page):
    pip = open_real_pip(page)
    pip.evaluate('document.activeElement.blur()')
    assert pip.evaluate('document.activeElement === document.body') is True
    pip.keyboard.press('/')
    expect(pip.locator('#search')).to_be_focused()


def test_pip_ime_escape_keeps_settings_open(page):
    pip = open_real_pip(page)
    pip.locator('#settings-toggle').click()
    expect(pip.locator('#settings-popover')).to_be_visible()
    search = pip.locator('#search')
    search.focus()
    for composition in [{'isComposing': True}, {'keyCode': 229}]:
        search.dispatch_event('keydown', {'key': 'Escape', **composition})
        assert page.evaluate('ICDApp.store.getState().settingsOpen') is True
        expect(pip.locator('#settings-popover')).to_be_visible()
    # 同一條傳遞路徑在組字結束後仍能正常關閉。
    search.press('Escape')
    expect(pip.locator('#settings-popover')).to_be_hidden()
