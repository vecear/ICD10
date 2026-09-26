from pathlib import Path
import json
import pytest
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
GUIDE = json.loads((ROOT / 'src/curated/vaccine_guide.json').read_text(encoding='utf-8'))
def group_count(group):
    return sum(c['groups'] == [group] for c in GUIDE['cards'])

@pytest.fixture
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        yield browser
        browser.close()

def open_app(browser, width=1440, layout='wide'):
    page = browser.new_page(viewport={'width': width, 'height': 900})
    page.add_init_script(f"localStorage.setItem('icd10.layout', JSON.stringify('{layout}'))")
    page.goto((ROOT / 'dist/icd10.html').as_uri())
    page.wait_for_function("performance.getEntriesByName('icd-shell-ready').length > 0")
    assert page.locator('body').get_attribute('data-layout') == ('mobile' if layout == 'wide' and width < 900 else layout)
    return page

@pytest.mark.parametrize('width,layout', [(1440,'wide'), (390,'wide'), (340,'dock'), (176,'dock')])
def test_vac_search_close_sources_and_width(browser, width, layout):
    page = open_app(browser, width, layout)
    if page.locator('body').get_attribute('data-layout') == 'mobile':
        box = page.locator('#vac-btn').bounding_box()
        assert box['height'] >= 44 and box['width'] >= 44
    page.locator('#vac-btn').click()
    expect(page.locator('#vac-panel')).to_be_visible()
    expect(page.locator('.vac-section')).to_have_count(len(GUIDE['groups']) - 1)
    expect(page.locator('.vac-card[open]')).to_have_count(0)
    page.locator('[data-vac-group="pneumococcal"]').click()
    expect(page.locator('.vac-card')).to_have_count(group_count('pneumococcal'))
    expect(page.locator('.vac-answer').first).not_to_be_visible()
    page.locator('.vac-card > summary').first.click()
    expect(page.locator('.vac-answer').first).to_be_visible()
    page.locator('.vac-card > summary').first.click()
    expect(page.locator('.vac-answer').first).not_to_be_visible()
    page.locator('#vac-reset').click()
    page.locator('#vac-search').fill('皮蛇')
    expect(page.locator('[data-vac-question="zoster"]')).to_be_visible()
    expect(page.locator('.vac-card[open]')).to_have_count(0)
    page.locator('[data-vac-question="zoster"] > summary').click()
    expect(page.locator('[data-vac-question="zoster"]')).to_contain_text('2–6 個月')
    assert page.locator('.vac-card .vac-source a').first.get_attribute('href').startswith('file:')
    page.locator('#vac-search').fill('沒有這種疫苗xyz')
    expect(page.locator('#vac-results')).to_contain_text('沒有符合')
    page.locator('#vac-reset').click()
    page.locator('[data-vac-group="tdap"]').click()
    expect(page.locator('.vac-card[open]')).to_have_count(0)
    page.locator('[data-vac-question="tdap"] > summary').click()
    expect(page.locator('#vac-results')).to_contain_text('27–36 週')
    assert page.locator('#vac-panel').evaluate('(e) => e.scrollWidth <= e.clientWidth + 1')
    page.keyboard.press('Escape')
    expect(page.locator('#vac-panel')).not_to_be_visible()
    expect(page.locator('#vac-btn')).to_be_focused()
    page.locator('#ccr-btn').click()
    expect(page.locator('#ccr-panel')).to_be_visible()
    page.close()

def test_vac_in_real_pip(browser):
    page = open_app(browser, 565, 'dock')
    with page.context.expect_page() as event:
        page.locator('#pin-toggle').click()
    pip = event.value
    pip.locator('#vac-btn').click()
    pip.locator('[data-vac-group="hpv"]').click()
    pip.locator('[data-vac-topic="contraindications"]').click()
    pip.locator('#vac-search').fill('HPV')
    expect(pip.locator('.vac-card').first).to_contain_text('HPV')
    expect(pip.locator('.vac-card[open]')).to_have_count(0)
    pip.locator('.vac-card > summary').first.click()
    expect(pip.locator('.vac-answer').first).to_be_visible()
    pip.keyboard.press('Escape')
    expect(pip.locator('#vac-btn')).to_be_focused()
    pip.close()

@pytest.mark.parametrize('width,layout', [(1440, 'wide'), (390, 'wide'), (340, 'dock'), (176, 'dock')])
def test_topics_intersect_with_vaccine_and_query_and_reset(browser, width, layout):
    page = open_app(browser, width, layout)
    page.locator('#vac-btn').click()
    page.locator('[data-vac-group="rotavirus"]').click()
    page.locator('[data-vac-topic="contraindications"]').click()
    expect(page.locator('[data-vac-topic="contraindications"]')).to_have_attribute('aria-pressed', 'true')
    expected = [c['id'] for c in GUIDE['cards'] if c['groups'] == ['rotavirus'] and 'contraindications' in c['topics']]
    assert page.locator('.vac-card').evaluate_all('(es) => es.map(e => e.dataset.vacQuestion)') == expected
    expect(page.locator('.vac-card[open]')).to_have_count(0)
    card = page.locator('[data-vac-question="rotavirus-contra"]')
    card.locator('summary').click()
    expect(card).to_contain_text('腸套疊')
    page.locator('#vac-search').fill('SCID')
    expect(page.locator('.vac-card')).to_have_count(1)
    expect(page.locator('.vac-card[open]')).to_have_count(0)
    page.locator('#vac-search').fill('找不到xyz')
    expect(page.locator('.vac-empty')).to_be_visible()
    page.locator('#vac-reset').click()
    expect(page.locator('.vac-card')).to_have_count(len(GUIDE['cards']))
    expect(page.locator('[data-vac-topic="all"]')).to_have_attribute('aria-pressed', 'true')
    page.locator('[data-vac-topic="schedule"]').click()
    page.keyboard.press('Escape')
    page.locator('#vac-btn').click()
    expect(page.locator('[data-vac-topic="all"]')).to_have_attribute('aria-pressed', 'true')
    expect(page.locator('.vac-card[open]')).to_have_count(0)
    assert page.locator('#vac-panel').evaluate('(e) => e.scrollWidth <= e.clientWidth + 1')
    page.close()

def test_vac_copy_focus_and_offline_links(browser):
    page = open_app(browser)
    page.evaluate("window.__vacCopied = ''; Object.defineProperty(navigator, 'clipboard', {value: {writeText: async t => { window.__vacCopied = t; }}, configurable: true})")
    requested = []
    page.on('request', lambda r: requested.append(r.url))
    page.locator('#vac-btn').click()
    page.locator('.vac-body').evaluate('(e) => e.scrollTop = 1500')
    page.locator('#vac-search').fill('MMR')
    assert page.locator('.vac-body').evaluate('(e) => e.scrollTop') == 0
    page.locator('#vac-search').fill('皮蛇')
    card = page.locator('[data-vac-question="zoster"]')
    card.locator('summary').focus()
    page.keyboard.press('Enter')
    expect(card.locator('.vac-answer')).to_be_visible()
    card.locator('.vac-copy').click()
    expect(card.locator('.vac-copy')).to_have_text('已複製')
    copied = page.evaluate('window.__vacCopied')
    assert '2–6 個月' in copied and '注意：' in copied and '115 年 5 月' in copied
    page.locator('#vac-close').focus()
    page.keyboard.press('Shift+Tab')
    expect(page.locator('.vac-library > summary')).to_be_focused()
    page.keyboard.press('Tab')
    expect(page.locator('#vac-close')).to_be_focused()
    assert not any(url.startswith(('https:', 'http:')) for url in requested)
    page.locator('#vac-close').click()
    page.locator('#vac-btn').click()
    expect(page.locator('#vac-search')).to_have_value('')
    expect(page.locator('.vac-card[open]')).to_have_count(0)
    page.close()

def test_flu_children_updated_schedule_is_searchable_and_collapsed(browser):
    page = open_app(browser, 390)
    page.locator('#vac-btn').click()
    page.locator('[data-vac-group="flu"]').click()
    expect(page.locator('.vac-card')).to_have_count(group_count('flu'))
    expect(page.locator('.vac-card[open]')).to_have_count(0)
    page.locator('#vac-search').fill('兒童')
    card = page.locator('[data-vac-question="flu-child"]')
    expect(card).to_be_visible()
    card.locator('summary').click()
    expect(card.locator('.vac-answer')).to_contain_text('累計 0 或 1 劑 → 本季 2 劑')
    expect(card.locator('.vac-cautions')).to_contain_text('本季第 1 劑當天')
    expect(card.locator('.vac-source')).to_contain_text('115 年 9 月 22 日')
    assert card.locator('.vac-source a').first.get_attribute('href').startswith('file:')
    assert page.locator('#vac-panel').evaluate('(e) => e.scrollWidth <= e.clientWidth + 1')
    page.close()

@pytest.mark.parametrize('width,layout', [(1440, 'wide'), (390, 'wide'), (176, 'dock')])
def test_review_fixes_copy_and_source_destinations(browser, width, layout):
    page = open_app(browser, width, layout)
    page.evaluate("Object.defineProperty(navigator, 'clipboard', {value: {writeText: async t => { window.__vacCopied = t; }}, configurable: true})")
    page.locator('#vac-btn').click()
    page.locator('[data-vac-group="rsv"]').click()
    expect(page.locator('.vac-card[open]')).to_have_count(0)
    card = page.locator('[data-vac-question="rsv"]')
    card.locator('summary').click()
    expect(card).to_contain_text('至少間隔 14 天')
    card.locator('.vac-copy').click()
    assert '臨床意義未明' in page.evaluate('window.__vacCopied')
    link = card.locator('a[href^="https://labeling.pfizer.com/"]')
    expect(link).to_have_text('線上來源（需連線）')
    assert card.locator('a[href*="SPC20250328-4.pdf"]').get_attribute('href').endswith('#page=7')
    assert page.locator('#vac-panel').evaluate('(e) => e.scrollWidth <= e.clientWidth + 1')
    page.locator('#vac-reset').click()
    page.locator('#vac-search').fill('接觸麻疹')
    card = page.locator('[data-vac-question="measles-pep"]')
    card.locator('summary').click()
    assert card.get_by_role('link', name='麻疹接觸者醫療人員返回工作條件1130314').get_attribute('href').endswith('#page=5')
    page.close()
