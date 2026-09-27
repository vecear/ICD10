"""底部回饋不遮擋選碼；複製失敗由使用者展開處理。"""
from pathlib import Path
import pytest
from playwright.sync_api import sync_playwright, expect

URL = (Path(__file__).resolve().parents[1] / 'dist/icd10.html').as_uri()

@pytest.fixture(scope='module')
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch()
        yield b
        b.close()

def open_page(browser, width=340, layout='dock'):
    page = browser.new_page(viewport={'width':width,'height':900})
    page.set_default_timeout(3000)
    page.add_init_script(f"localStorage.setItem('icd10.layout',JSON.stringify('{layout}'))")
    page.add_init_script("""window.writes=[]; Object.defineProperty(navigator,'clipboard',{
        value:{writeText:async text=>window.writes.push(text)},configurable:true});""")
    page.goto(URL)
    page.wait_for_selector('body[data-ready="1"]')
    page.evaluate('ICDApp.data.ensureDb().then(()=>true)')
    return page

def deny(page):
    page.evaluate("navigator.clipboard.writeText=async()=>{throw Error('denied')}; document.execCommand=()=>false")

@pytest.mark.parametrize('width,layout,area',[(176,'dock','.dock-cart'),(340,'dock','.dock-cart'),(1440,'wide','#his-card'),(390,'wide','#cart-bar')])
def test_notice_uses_existing_cart_area_without_covering_or_shifting_codes(browser,width,layout,area):
    page=open_page(browser,width,layout)
    main=page.locator('main')
    before=main.bounding_box()
    page.evaluate("ICDInteractions.announce('已加入 I10')")
    expect(page.locator(area+' #notice')).to_be_visible()
    after=main.bounding_box()
    assert abs(before['height']-after['height'])<1
    assert abs(before['y']-after['y'])<1
    box=page.locator('#notice').bounding_box()
    assert box['y']>=after['y']+after['height'] or box['x']>=after['x']+after['width']
    assert page.evaluate('document.body.scrollWidth<=innerWidth')
    page.close()

def test_expand_button_is_its_own_feedback(browser):
    page=open_page(browser)
    button=page.locator('#expand-all-panels')
    button.click()
    expect(button).to_have_text('全收合')
    expect(page.locator('#notice')).to_be_hidden()
    assert not button.get_attribute('title')
    page.close()

@pytest.mark.parametrize('width,layout',[(176,'dock'),(1440,'wide'),(390,'wide')])
def test_failed_copy_is_inline_opt_in_and_retryable(browser,width,layout):
    page=open_page(browser,width,layout)
    deny(page)
    search=page.locator('#search')
    search.focus()
    page.evaluate("ICDInteractions.copyText('待重試內容',false,'日期')")
    expect(page.locator('#copy-recovery')).to_be_visible()
    expect(page.locator('#fallback-copy')).to_be_hidden()
    expect(search).to_be_focused()
    page.evaluate("ICDInteractions.announce('其他操作完成')")
    expect(page.locator('#copy-recovery')).to_be_visible()
    page.locator('#copy-manual').click()
    expect(page.locator('#fallback-copy textarea')).to_have_value('待重試內容')
    assert page.locator('#fallback-copy').get_attribute('aria-modal')!='true'
    assert page.locator('#fallback-copy').evaluate("e=>getComputedStyle(e).position") not in ['fixed','absolute']
    page.locator('#fallback-close').click()
    expect(page.locator('#copy-manual')).to_be_focused()
    expect(page.locator('#copy-recovery')).to_be_visible()
    page.evaluate("navigator.clipboard.writeText=async text=>writes.push(text)")
    page.locator('#copy-retry').click()
    expect(page.locator('#copy-recovery')).to_be_hidden()
    assert page.evaluate('writes.at(-1)')=='待重試內容'
    page.close()

def test_manual_copy_tracks_latest_failed_cart_and_survives_layout_change(browser):
    page=open_page(browser)
    deny(page)
    page.locator('#search').fill('I10')
    page.locator('#search').press('Enter')
    expect(page.locator('#copy-recovery')).to_be_visible()
    page.locator('#copy-manual').click()
    expect(page.locator('#fallback-copy textarea')).to_have_value('I10')
    page.locator('#search').fill('E11.9')
    page.locator('#search').press('Enter')
    expect(page.locator('#fallback-copy textarea')).to_have_value('I10\nE11.9')
    page.set_viewport_size({'width':1440,'height':900})
    page.evaluate("ICDApp.store.setLayout('wide')")
    expect(page.locator('#fallback-copy textarea')).to_have_value('I10\nE11.9')
    expect(page.locator('#copy-recovery')).to_be_visible()
    page.locator('#clear-cart').click()
    expect(page.locator('#copy-recovery')).to_be_hidden()
    page.close()

def test_pip_recovery_moves_with_dock_and_returns(browser):
    page=open_page(browser)
    with page.context.expect_page() as event:
        page.locator('#pin-toggle').click()
    pip=event.value
    pip.set_default_timeout(3000)
    pip.wait_for_selector('#layout-dock')
    deny(pip)
    pip.locator('#copy-date').click()
    expect(pip.locator('.dock-cart #copy-recovery')).to_be_visible()
    expect(pip.locator('#fallback-copy')).to_be_hidden()
    pip.locator('#copy-manual').click()
    text=pip.locator('#fallback-copy textarea').input_value()
    assert text
    assert page.locator('#fallback-copy').count()==0
    pip.close()
    expect(page.locator('#fallback-copy textarea')).to_have_value(text)
    expect(page.locator('#copy-recovery')).to_be_visible()
    page.close()

def test_recovery_remains_accessible_in_vaccine_panel_and_manual_completion(browser):
    page=open_page(browser)
    deny(page)
    page.locator('#vac-btn').click()
    page.locator('.vac-card summary').first.click()
    page.locator('.vac-card[open] .vac-copy').first.click()
    expect(page.locator('#vac-panel #copy-recovery')).to_be_visible()
    expect(page.locator('#fallback-copy')).to_be_hidden()
    page.locator('#copy-manual').click()
    assert page.locator('#fallback-copy textarea').input_value()
    page.locator('#copy-done').click()
    expect(page.locator('#copy-recovery')).to_be_hidden()
    assert page.evaluate("!!document.activeElement.closest('#vac-panel')")
    page.locator('.vac-card[open] .vac-copy').first.click()
    page.locator('#copy-manual').click()
    page.locator('#vac-close').click()
    expect(page.locator('.dock-cart #copy-recovery')).to_be_visible()
    page.locator('#copy-done').click()
    expect(page.locator('#copy-recovery')).to_be_hidden()
    expect(page.locator('#search')).to_be_focused()
    page.close()
