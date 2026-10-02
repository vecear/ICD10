from pathlib import Path
import pytest
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]

@pytest.fixture
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        yield browser
        browser.close()

def open_app(browser, width, layout):
    page = browser.new_page(viewport={'width':width,'height':900})
    page.add_init_script(f"localStorage.setItem('icd10.layout', JSON.stringify('{layout}'))")
    page.goto((ROOT / 'dist/icd10.html').as_uri())
    page.wait_for_function("performance.getEntriesByName('icd-shell-ready').length > 0")
    return page

@pytest.mark.parametrize('width,layout', [(1440,'wide'),(390,'wide'),(340,'dock'),(176,'dock')])
def test_lookup_conditions_sources_and_close(browser,width,layout):
    page = open_app(browser,width,layout)
    expect(page.locator('#am-btn')).to_have_count(1)
    page.locator('#am-btn').click()
    expect(page.locator('#am-panel')).to_be_visible()
    page.locator('#am-search').fill('Zavicefta')
    expect(page.locator('.am-card')).to_have_count(1)
    page.locator('.am-card > summary').click()
    expect(page.locator('.am-content')).to_contain_text('7天')
    expect(page.locator('.am-content')).to_contain_text('14天')
    page.locator('.am-original > summary').click()
    expect(page.locator('.am-original')).to_contain_text('再照會')
    assert '#page=3' in page.locator('.am-card .am-source a').first.get_attribute('href')
    page.locator('#am-search').fill('LZD VRE')
    expect(page.locator('.am-card')).to_have_count(1)
    page.locator('.am-card > summary').click()
    page.locator('.am-original > summary').click()
    expect(page.locator('.am-original')).to_contain_text('ampicillin')
    page.locator('#am-search').fill('不存在的藥xyz')
    expect(page.locator('#am-results')).to_contain_text('不代表不給付')
    page.locator('#am-reset').click()
    page.locator('[data-am-group="antifungal"]').click()
    expect(page.locator('#am-results')).to_contain_text('Posaconazole')
    assert page.locator('#am-panel').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1')
    page.keyboard.press('Escape')
    expect(page.locator('#am-panel')).not_to_be_visible()
    expect(page.locator('#am-btn')).to_be_focused()
    page.locator('#vac-btn').click()
    expect(page.locator('#vac-panel')).to_be_visible()
    page.close()

def test_copy_and_panel_mutual_exclusion(browser):
    page = open_app(browser,1440,'wide')
    page.evaluate("window.copyResult=''; Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{window.copyResult=t;}},configurable:true})")
    page.locator('#am-btn').click()
    page.locator('#am-search').fill('cefiderocol')
    page.locator('.am-card > summary').click()
    page.locator('[data-am-copy]').click()
    expect(page.locator('[data-am-copy]')).to_have_text('已複製')
    text = page.evaluate('window.copyResult')
    assert all(t in text for t in ['10.3.8','完整條文','18歲','7天','查證日期','2026-10-02'])
    page.evaluate('window.ICDApp.ctx.store.setCcrOpen(true)')
    expect(page.locator('#am-panel')).not_to_be_visible()
    expect(page.locator('#ccr-panel')).to_be_visible()
    page.evaluate('window.ICDApp.ctx.store.setAmOpen(true)')
    expect(page.locator('#ccr-panel')).not_to_be_visible()
    expect(page.locator('#am-panel')).to_be_visible()
    page.close()

def test_lookup_in_real_pip(browser):
    page = open_app(browser,565,'dock')
    with page.context.expect_page() as event:
        page.locator('#pin-toggle').click()
    pip = event.value
    pip.locator('#am-btn').click()
    pip.locator('#am-search').fill('Posaconazole')
    pip.locator('.am-card > summary').click()
    pip.locator('.am-original > summary').click()
    expect(pip.locator('.am-original')).to_contain_text('0.8mg/kg/day')
    assert pip.locator('.am-source a').first.get_attribute('href').startswith('file:')
    pip.keyboard.press('Escape')
    expect(pip.locator('#am-panel')).not_to_be_visible()
    pip.close()
    page.close()

def test_keyboard_focus_theme_and_reading_survive_resize(browser):
    page = open_app(browser,1440,'wide')
    page.locator('#am-btn').click()
    page.locator('#am-search').fill('Linezolid')
    page.locator('.am-card > summary').click()
    page.evaluate("window.ICDApp.ctx.store.setTheme('dark')")
    expect(page.locator('.am-card[open]')).to_have_count(1)
    page.set_viewport_size({'width':390,'height':844})
    expect(page.locator('body')).to_have_attribute('data-layout','mobile')
    expect(page.locator('#am-search')).to_have_value('Linezolid')
    expect(page.locator('.am-card[open]')).to_have_count(1)
    page.locator('#am-close').focus()
    page.keyboard.press('Shift+Tab')
    expect(page.locator('.am-card .am-source a').last).to_be_focused()
    page.keyboard.press('Tab')
    expect(page.locator('#am-close')).to_be_focused()
    page.close()

def test_full_original_and_scroll_survive_layout_change(browser):
    page = open_app(browser,1440,'wide')
    page.locator('#am-btn').click()
    page.locator('#am-search').fill('10.7.3')
    page.locator('.am-card > summary').click()
    page.locator('.am-original > summary').click()
    page.locator('.am-body').evaluate('(e)=>e.scrollTop=650')
    page.wait_for_timeout(100)
    page.set_viewport_size({'width':390,'height':844})
    expect(page.locator('body')).to_have_attribute('data-layout','mobile')
    expect(page.locator('.am-original')).to_have_attribute('open','')
    page.wait_for_timeout(100)
    assert page.locator('.am-body').evaluate('(e)=>e.scrollTop') >= 600
    page.close()

def test_failed_copy_can_recover_inside_panel(browser):
    page = open_app(browser,390,'wide')
    page.evaluate("Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('denied')}},configurable:true});document.execCommand=()=>false")
    page.locator('#am-btn').click()
    page.locator('#am-search').fill('cefiderocol')
    page.locator('.am-card > summary').click()
    page.locator('[data-am-copy]').click()
    expect(page.locator('#am-panel #copy-recovery')).to_be_visible()
    page.locator('#copy-manual').click()
    assert '10.3.8' in page.locator('#fallback-copy textarea').input_value()
    page.locator('#fallback-copy textarea').focus()
    page.keyboard.press('Tab')
    assert page.evaluate("!!document.activeElement.closest('#am-panel')")
    page.locator('#am-close').click()
    expect(page.locator('#copy-recovery-home #copy-recovery')).to_be_visible()
    page.close()

def test_collapsed_result_shows_coverage_preview(browser):
    page = open_app(browser,1440,'wide')
    page.locator('#am-btn').click()
    page.locator('#am-search').fill('cefiderocol')
    expect(page.locator('.am-card[open]')).to_have_count(0)
    expect(page.locator('.am-question')).to_contain_text('18歲以上')
    expect(page.locator('.am-question')).to_contain_text('感受性')
    page.close()

@pytest.mark.parametrize('width',[900,1024,1440])
def test_desktop_toolbar_keeps_search_usable(browser,width):
    page = open_app(browser,width,'wide')
    assert page.locator('.app-header').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1')
    assert page.locator('#search').bounding_box()['width'] >= 120
    assert page.locator('.app-header').bounding_box()['height'] <= 63
    assert page.locator('#am-btn').evaluate('(e)=>getComputedStyle(e).fontSize') == '13px'
    page.close()
