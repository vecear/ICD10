/* 共用 VAC 浮層。事件綁在實際節點，移入 Document PiP 後仍使用該節點的 document。 */
(function (root) {
  'use strict';
  const R = root.ICDRender;
  const guide = root.VACCINE_GUIDE;
  const V = root.ICDVaccine;
  const baseURI = document.baseURI;
  function button(text, id, cls) {
    const b = R.el('button', cls || 'btn btn-secondary', text);
    b.type = 'button';
    if (id) b.id = id;
    return b;
  }
  function vacButtonEl(compact) {
    const b = button('VAC', 'vac-btn', 'btn btn-secondary vac-btn' + (compact ? ' seg-btn--sm' : ''));
    b.title = '疫苗門診速查：接種時程、間隔、禁忌與常見問題';
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-controls', 'vac-panel');
    b.setAttribute('aria-expanded', 'false');
    return b;
  }
  function sourceLink(source, page) {
    const a = R.el('a', null, source.title + (source.file.endsWith('.pdf') ? ' · p.' + page : ''));
    a.href = new URL('疫苗/' + encodeURIComponent(source.file), baseURI).href + (source.file.endsWith('.pdf') ? '#page=' + page : '');
    a.target = '_blank';
    a.rel = 'noopener';
    return a;
  }
  function renderResults(overlay) {
    const query = overlay.querySelector('#vac-search').value;
    const group = overlay.dataset.group || 'all';
    const cards = V.search(guide, query, group);
    const results = overlay.querySelector('#vac-results');
    R.clear(results);
    overlay.querySelector('.vac-body').scrollTop = 0;
    overlay.querySelector('#vac-count').textContent = cards.length + ' 個問題 · 點擊問題展開';
    for (const b of overlay.querySelectorAll('[data-vac-group]')) b.setAttribute('aria-pressed', String(b.dataset.vacGroup === group));
    if (!cards.length) results.appendChild(R.el('p', 'vac-empty', '沒有符合的問題。可清除條件，或改搜疫苗名稱／縮寫。'));
    for (const category of guide.groups.filter(g => g.id !== 'all')) {
      const questions = cards.filter(c => c.groups.includes(category.id));
      if (!questions.length) continue;
      const section = R.el('section', 'vac-section');
      const heading = R.el('h3', 'vac-section-title', category.label + '（' + questions.length + '）');
      heading.id = 'vac-category-' + category.id;
      section.setAttribute('aria-labelledby', heading.id);
      section.appendChild(heading);
      questions.forEach(card => section.appendChild(questionEl(card)));
      results.appendChild(section);
    }
  }
  function questionEl(card) {
    const article = R.el('details', 'vac-card');
    article.dataset.vacQuestion = card.id;
    article.appendChild(R.el('summary', 'vac-question', card.title));
    const content = R.el('div', 'vac-content');
    const head = R.el('div', 'vac-card-head');
    const copy = button('複製', null, 'vac-copy btn btn-secondary');
    copy.dataset.vacCopy = card.id;
    copy.setAttribute('aria-label', '複製：' + card.title);
    head.appendChild(copy);
    content.appendChild(head);
    const answer = R.el('ul', 'vac-answer');
    card.answer.forEach(line => answer.appendChild(R.el('li', null, line)));
    content.appendChild(answer);
    if (card.cautions.length) {
      const caution = R.el('ul', 'vac-cautions');
      card.cautions.forEach(line => caution.appendChild(R.el('li', null, line)));
      content.appendChild(caution);
    }
    const refs = R.el('div', 'vac-source');
    for (const ref of card.refs) {
      const s = guide.sources.find(x => x.id === ref.source);
      const row = R.el('div');
      row.append(sourceLink(s, ref.page), R.el('span', 'vac-version', '版本：' + s.version));
      if (s.url) {
        const online = R.el('a', null, '線上來源（需連線）');
        online.href = s.url; online.target = '_blank'; online.rel = 'noopener';
        row.append(online, R.el('span', 'vac-version', '線上查核：' + s.checked));
      }
      refs.appendChild(row);
    }
    content.appendChild(refs);
    article.appendChild(content);
    return article;
  }
  function vacOverlayEl() {
    const overlay = R.el('div', 'vac-overlay');
    overlay.id = 'vac-overlay'; overlay.hidden = true;
    const panel = R.el('section', 'vac-panel');
    panel.id = 'vac-panel'; panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'vac-title');
    const head = R.el('div', 'vac-head');
    const title = R.el('h2', null, 'VAC 疫苗速查'); title.id = 'vac-title';
    head.append(title, button('關閉', 'vac-close'));
    panel.appendChild(head);
    const tools = R.el('div', 'vac-tools');
    const searchLabel = R.el('label', 'vac-search-label', '查疫苗或問題');
    const input = R.el('input', 'input');
    input.id = 'vac-search'; input.type = 'search'; input.autocomplete = 'off';
    input.placeholder = '皮蛇、HPV、懷孕、間隔…';
    searchLabel.appendChild(input);
    const row = R.el('div', 'vac-search-row');
    row.append(searchLabel, button('清除', 'vac-reset'));
    tools.appendChild(row);
    const groups = R.el('div', 'vac-groups');
    groups.setAttribute('role', 'group'); groups.setAttribute('aria-label', '疫苗種類');
    guide.groups.forEach(g => { const b = button(g.label); b.dataset.vacGroup = g.id; groups.appendChild(b); });

    const count = R.el('span', 'vac-count'); count.id = 'vac-count'; count.setAttribute('role', 'status');
    panel.appendChild(tools);
    const body = R.el('div', 'vac-body');
    body.append(groups, count);
    const results = R.el('div'); results.id = 'vac-results'; body.appendChild(results);
    const library = R.el('details', 'vac-library');
    library.appendChild(R.el('summary', null, '原始文件（' + guide.sources.length + ' 份，離線可開啟）'));
    guide.sources.forEach(s => { const row = R.el('div', 'vac-source'); row.append(sourceLink(s, 1), R.el('span', 'vac-version', s.version)); library.appendChild(row); });
    body.append(library, R.el('p', 'vac-note', guide.notice + '\n整理日期：' + guide.version));
    panel.appendChild(body); overlay.appendChild(panel);
    input.addEventListener('input', () => renderResults(overlay));
    return overlay;
  }
  function syncVac(container, ctx) {
    const overlay = container.querySelector('#vac-overlay');
    const entry = container.querySelector('#vac-btn');
    if (!overlay || !entry) return;
    const close = () => { ctx.store.setVacOpen(false); entry.focus({preventScroll:true}); };
    if (!overlay.dataset.bound) {
      overlay.dataset.bound = 'true';
      entry.addEventListener('click', ev => {
        ev.stopPropagation(); ctx.store.setVacOpen(true);
        overlay.querySelector('#vac-search').focus({preventScroll:true});
      });
      overlay.addEventListener('click', async ev => {
        const target = ev.target;
        if (target === overlay || target.closest('#vac-close')) { ev.stopPropagation(); close(); return; }
        if (target.closest('#vac-reset')) {
          overlay.querySelector('#vac-search').value = ''; overlay.dataset.group = 'all';
          renderResults(overlay); overlay.querySelector('#vac-search').focus();
        }
        const group = target.closest('[data-vac-group]');
        if (group) { overlay.dataset.group = group.dataset.vacGroup; renderResults(overlay); overlay.querySelector('.vac-body').scrollTop = 0; }
        const copy = target.closest('[data-vac-copy]');
        if (copy) {
          const card = guide.cards.find(c => c.id === copy.dataset.vacCopy);
          const ok = await root.ICDInteractions.copyText(V.answerText(guide, card));
          if (copy.isConnected) copy.textContent = ok ? '已複製' : '請手動複製';
        }
      });
      overlay.addEventListener('keydown', ev => {
        if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); close(); return; }
        if (ev.key !== 'Tab') return;
        const nodes = Array.from(overlay.querySelectorAll('button, input, a, summary')).filter(x => x.getClientRects().length && !x.disabled && !x.closest('details:not([open]) .vac-content, details:not([open]) .vac-source'));
        const first = nodes[0], last = nodes[nodes.length - 1];
        const active = overlay.ownerDocument.activeElement;
        if (ev.shiftKey && active === first) { ev.preventDefault(); last.focus(); }
        else if (!ev.shiftKey && active === last) { ev.preventDefault(); first.focus(); }
      });
    }
    const open = !!ctx.store.getState().vacOpen;
    if (open && overlay.hidden) renderResults(overlay);
    overlay.hidden = !open;
    entry.setAttribute('aria-expanded', String(open));
    if (!open) {
      overlay.querySelector('#vac-search').value = ''; overlay.dataset.group = 'all';
      R.clear(overlay.querySelector('#vac-results'));
    }
  }
  Object.assign(R, {vacButtonEl, vacOverlayEl, syncVac});
})(typeof self !== 'undefined' ? self : this);
