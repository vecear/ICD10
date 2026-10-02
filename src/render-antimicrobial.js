/* 三種版面共用的抗微生物給付浮層；事件跟隨 DOM 移入 PiP。 */
(function (root) {
  'use strict';
  const R = root.ICDRender, A = root.ICDAntimicrobial, guide = root.ANTIMICROBIAL_COVERAGE;
  const baseURI = document.baseURI;
  const reading = {query: '', group: 'all', expanded: [], originals: [], scrollTop: 0};
  let activeOverlay = null;
  let restoreVersion = 0, restoringScroll = false;
  function restoreScroll(overlay) {
    restoringScroll = true;
    const version = ++restoreVersion, top = reading.scrollTop;
    const body = overlay.querySelector('.am-body'); body.scrollTop = top;
    overlay.ownerDocument.defaultView.requestAnimationFrame(() => {
      if (version !== restoreVersion || overlay !== activeOverlay || overlay.hidden || !overlay.isConnected) return;
      body.scrollTop = top; restoringScroll = false;
    });
  }
  root.addEventListener('resize', () => {
    if (activeOverlay && !activeOverlay.hidden && activeOverlay.ownerDocument === document) restoreScroll(activeOverlay);
  });
  function button(text, id) {
    const b = R.el('button', 'btn btn-secondary', text);
    b.type = 'button';
    if (id) b.id = id;
    return b;
  }
  function amButtonEl(compact) {
    const b = button('Anti', 'am-btn');
    b.classList.add('am-btn');
    if (compact) b.classList.add('seg-btn--sm');
    b.title = '抗微生物製劑健保給付條件速查';
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-controls', 'am-panel');
    b.setAttribute('aria-expanded', 'false');
    return b;
  }
  function sourceLink(source, page) {
    const a = R.el('a', null, '官方 PDF · 第 ' + page + ' 頁');
    a.href = new URL('健保條文/' + encodeURIComponent(source.file), baseURI).href + '#page=' + page;
    a.target = '_blank'; a.rel = 'noopener';
    return a;
  }
  function remember(overlay) {
    if (!overlay || overlay.hidden || !overlay.isConnected) return;
    reading.query = overlay.querySelector('#am-search').value;
    reading.group = overlay.dataset.group;
    reading.expanded = Array.from(overlay.querySelectorAll('.am-card[open]'), e => e.dataset.amCard);
    reading.originals = Array.from(overlay.querySelectorAll('.am-original[open]'), e => e.closest('.am-card').dataset.amCard);
    if (!restoringScroll) reading.scrollTop = overlay.querySelector('.am-body').scrollTop;
  }
  function cardEl(card, restore) {
    const article = R.el('details', 'am-card');
    article.dataset.amCard = card.id;
    const summary = R.el('summary', 'am-question');
    summary.append(R.el('span', 'am-drug', card.title), R.el('span', 'am-section-id', card.id));
    summary.appendChild(R.el('span', 'am-preview', card.summary[0]));
    if (A.status(card) === 'upcoming') summary.appendChild(R.el('span', 'am-upcoming', '尚未生效 · ' + card.effectiveFrom));
    article.appendChild(summary);
    const content = R.el('div', 'am-content');
    const head = R.el('div', 'am-card-head');
    const copy = button('複製條件與來源'); copy.dataset.amCopy = card.id;
    copy.setAttribute('aria-label', '複製：' + card.title); head.appendChild(copy);
    content.appendChild(head);
    content.appendChild(R.el('p', 'am-label', '給付重點（摘要）'));
    const list = R.el('ul', 'am-answer');
    card.summary.forEach(line => list.appendChild(R.el('li', null, line)));
    content.appendChild(list);
    if (card.id !== '10.1') {
      const common = button('查看用藥通則 10.1'); common.dataset.amJump = '10.1'; content.appendChild(common);
    }
    if (card.id.startsWith('10.8.2.')) {
      const common = button('查看 Quinolone 共通規定 10.8.2'); common.dataset.amJump = '10.8.2'; content.appendChild(common);
    }
    const original = R.el('details', 'am-original');
    original.open = restore && reading.originals.includes(card.id);
    original.appendChild(R.el('summary', null, '完整條文（保留條件分支）'));
    card.text.forEach(line => {
      const p = R.el('p', 'am-line', A.displayLine(line));
      if (/^[（(]\d+[）)]/.test(line)) p.classList.add('am-sub');
      if (/^(?:[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+\.|[IVX]+\.|[A-Da-d]\.|[iv]+\.)/.test(line)) p.classList.add('am-leaf');
      original.appendChild(p);
    });
    content.appendChild(original);
    const refs = R.el('div', 'am-source');
    card.refs.forEach(ref => {
      const s = guide.sources.find(x => x.id === ref.source);
      const row = R.el('div');
      const online = R.el('a', null, '健保署線上來源');
      online.href = s.url; online.target = '_blank'; online.rel = 'noopener';
      row.append(sourceLink(s, ref.page), R.el('span', 'am-version', '版本：' + s.version + ' · 查證：' + s.checked));
      row.appendChild(online); refs.appendChild(row);
    });
    content.appendChild(refs); article.appendChild(content);
    return article;
  }
  function renderResults(overlay, restore = false) {
    if (!restore) {restoreVersion++; restoringScroll = false;}
    const results = overlay.querySelector('#am-results');
    const cards = A.search(guide, overlay.querySelector('#am-search').value, overlay.dataset.group || 'all');
    R.clear(results);
    overlay.querySelector('#am-count').textContent = cards.length + ' 條規定 · 點藥名展開';
    overlay.querySelectorAll('[data-am-group]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.amGroup === overlay.dataset.group)));
    if (!cards.length) results.appendChild(R.el('p', 'am-empty', '未找到本次收錄的專屬條文，不代表不給付或無限制。可清除分類、改搜學名，或查閱用藥通則與健保署品項資料。'));
    cards.forEach(card => {
      const node = cardEl(card, restore); node.open = restore && reading.expanded.includes(card.id); results.appendChild(node);
    });
    if (!restore) {
      overlay.querySelector('.am-body').scrollTop = 0;
      reading.expanded = []; reading.originals = []; reading.scrollTop = 0;
    }
  }
  function amOverlayEl() {
    remember(activeOverlay);
    const overlay = R.el('div', 'am-overlay'); overlay.id = 'am-overlay'; overlay.hidden = true; activeOverlay = overlay;
    overlay.dataset.group = reading.group;
    const panel = R.el('section', 'am-panel'); panel.id = 'am-panel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'am-title');
    const head = R.el('div', 'am-head'); const title = R.el('h2', null, '抗微生物製劑健保給付'); title.id = 'am-title';
    head.append(title, button('關閉', 'am-close')); panel.appendChild(head);
    const tools = R.el('div', 'am-tools'); const row = R.el('div', 'am-search-row');
    const label = R.el('label', 'am-search-label', '查藥名、縮寫、條號或條件');
    const input = R.el('input', 'input'); input.id = 'am-search'; input.type = 'search'; input.autocomplete = 'off'; input.placeholder = 'Linezolid、Zavicefta、CRAB、10.8.3…';
    label.appendChild(input); row.append(label, button('清除','am-reset')); tools.appendChild(row); panel.appendChild(tools);
    const body = R.el('div', 'am-body'); const groups = R.el('div', 'am-groups');
    groups.setAttribute('role','group'); groups.setAttribute('aria-label','抗微生物製劑分類');
    guide.groups.forEach(g => {const b = button(g.label); b.dataset.amGroup = g.id; groups.appendChild(b);});
    const common = button('用藥通則'); common.dataset.amJump = '10.1'; groups.appendChild(common);
    const count = R.el('p', 'am-count'); count.id = 'am-count'; count.setAttribute('role','status');
    body.append(groups, count); const results = R.el('div'); results.id = 'am-results'; body.appendChild(results);
    body.appendChild(R.el('p', 'am-note', guide.notice));
    panel.appendChild(body); overlay.appendChild(panel);
    input.addEventListener('input', () => {renderResults(overlay); remember(overlay);});
    body.addEventListener('scroll', () => remember(overlay));
    overlay.addEventListener('toggle', () => remember(overlay), true);
    return overlay;
  }
  function syncAm(container, ctx) {
    const overlay = container.querySelector('#am-overlay'), entry = container.querySelector('#am-btn');
    if (!overlay || !entry) return;
    const close = () => {remember(overlay); ctx.store.setAmOpen(false); entry.focus({preventScroll:true});};
    if (!overlay.dataset.bound) {
      overlay.dataset.bound = 'true';
      entry.addEventListener('click', ev => {ev.stopPropagation(); ctx.store.setAmOpen(true); overlay.querySelector('#am-search').focus({preventScroll:true});});
      overlay.addEventListener('click', async ev => {
        const t = ev.target;
        if (t === overlay || t.closest('#am-close')) {ev.stopPropagation(); close(); return;}
        if (t.closest('#am-reset')) {overlay.querySelector('#am-search').value = ''; overlay.dataset.group = 'all'; renderResults(overlay); overlay.querySelector('#am-search').focus();}
        const group = t.closest('[data-am-group]');
        if (group) {overlay.dataset.group = group.dataset.amGroup; renderResults(overlay);}
        const jump = t.closest('[data-am-jump]');
        if (jump) {
          overlay.dataset.group = 'all'; overlay.querySelector('#am-search').value = jump.dataset.amJump;
          renderResults(overlay);
          const target = Array.from(overlay.querySelectorAll('.am-card')).find(e => e.dataset.amCard === jump.dataset.amJump);
          if (target) {target.open = true; target.querySelector('summary').focus({preventScroll:true});}
        }
        const copy = t.closest('[data-am-copy]');
        if (copy) {
          const card = guide.cards.find(c => c.id === copy.dataset.amCopy);
          const ok = await root.ICDInteractions.copyText(A.answerText(guide,card), false, '抗微生物給付');
          if (copy.isConnected) copy.textContent = ok ? '已複製' : '請手動複製';
        }
        remember(overlay);
      });
      overlay.addEventListener('keydown', ev => {
        if (ev.key === 'Escape') {ev.preventDefault(); ev.stopPropagation(); close(); return;}
        if (ev.key !== 'Tab') return;
        const nodes = Array.from(overlay.querySelectorAll('button,input,textarea,a,summary')).filter(e => e.getClientRects().length && !e.disabled);
        const first = nodes[0], last = nodes[nodes.length - 1], active = overlay.ownerDocument.activeElement;
        if (ev.shiftKey && active === first) {ev.preventDefault(); last.focus();}
        else if (!ev.shiftKey && active === last) {ev.preventDefault(); first.focus();}
      });
    }
    const open = !!ctx.store.getState().amOpen;
    if (open && overlay.hidden) {
      overlay.querySelector('#am-search').value = reading.query; overlay.dataset.group = reading.group;
      restoringScroll = true;
      renderResults(overlay, true); overlay.hidden = false; restoreScroll(overlay);
    } else if (!open && !overlay.hidden) {remember(overlay); restoreVersion++; restoringScroll = false; overlay.hidden = true;}
    entry.setAttribute('aria-expanded', String(open));
  }
  Object.assign(R, {amButtonEl, amOverlayEl, syncAm});
})(typeof self !== 'undefined' ? self : this);
