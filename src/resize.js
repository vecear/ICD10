/* 窗格高度手動調整（三套版面共用）。掛 window.ICDResize。

   為什麼是共用模組：三套版面垂直堆疊的內容不同，但「拖一條線改某一區的高度」完全一樣——
   分隔條的 ARIA、滑鼠／觸控／鍵盤三種操作、夾在合理範圍、視窗變小時重新夾值，只能有
   一份實作；分頭寫必然漂移（1c 修好的毛病 1b 還在）。

   兩種容器模式（由有沒有給 flex 元素決定）：
     fill   容器是固定高度的 flex column（1c／1b 的整窗骨架）。某個窗格能長到多高，取決於
            彈性內容區還讓得出多少空間，所以上限要扣掉其他兄弟的高度與彈性區的最低高度。
     scroll 容器自己會捲動（1a 的中欄／右欄）。上限只需保留 reserve 給同欄其他內容。

   高度存在 store 的 paneSizes[版面][key]（localStorage），**分版面各記各的**：176px 側掛欄
   調出來的 60px 部位區，套到 1440 工作台毫無意義。store 只存「使用者要多高」，實際套用值
   永遠再夾一次——記住的絕對高度在小視窗會超出，這裡負責讓它退讓而不是把畫面擠爆。

   Document PiP：1c 會把整棵 DOM 搬進**另一個 document**。所以這裡不碰全域 document／window，
   分隔條一律用自己的 ownerDocument，拖曳期間再用 setPointerCapture 把事件釘在分隔條上。 */
(function (root) {
  'use strict';

  const KEY_STEP = 16;            // 鍵盤一次調整的像素
  const DEFAULT_FLEX_MIN = 80;    // fill 模式：彈性內容區至少留這麼高，否則主訴面板被擠成一條縫
  const DEFAULT_RESERVE = 160;    // scroll 模式：留給同欄其他內容的高度
  const DEFAULT_MIN = 44;         // 窗格下限：不得被拖到消失或只剩一條線

  function raf(fn) {
    if (typeof root.requestAnimationFrame === 'function') return root.requestAnimationFrame(fn);
    return setTimeout(fn, 16);
  }

  function cancelRaf(id) {
    if (typeof root.cancelAnimationFrame === 'function') root.cancelAnimationFrame(id);
    else clearTimeout(id);
  }

  /* 分隔條是 <div role="separator" tabindex="0">，不是 <button>：window splitter 的鍵盤
     契約是方向鍵，用 button 會多出 Enter／Space 觸發的語意與一整套按鈕外觀要壓掉。 */
  function separatorEl(doc, label) {
    const sep = doc.createElement('div');
    sep.className = 'pane-resizer';
    sep.setAttribute('role', 'separator');
    sep.setAttribute('aria-orientation', 'horizontal');
    sep.setAttribute('tabindex', '0');
    sep.setAttribute('aria-label', label + '高度');
    sep.title = label + '：拖曳調整高度（聚焦後可用 ↑↓）';
    return sep;
  }

  // 窗格可能包在標題／內距的外層裡（例如 1c 的「相關疾病／評估」）；分隔條要插在容器的直屬子層
  function outerChild(container, el) {
    let node = el;
    while (node && node.parentNode !== container) node = node.parentNode;
    return node || null;
  }

  const heightOf = (node) => node.getBoundingClientRect().height;

  /* opts:
       layout    'wide' | 'dock' | 'mobile'（存進 paneSizes 的分組鍵）
       store     ICDState 的 store
       container 垂直堆疊的容器
       flex      容器裡吸收剩餘空間的元素；給了就是 fill 模式，不給就是 scroll 模式
       flexMin   fill 模式下彈性區的最低高度
       reserve   scroll 模式下保留給其他內容的高度
       panes     [{ key, el, label, sign, min, scroll, visible }]
                   sign  +1 ＝ 窗格在分隔條**上方**（往下拖變高）；-1 ＝ 在下方（往上拖變高）
                   scroll false ＝ 窗格內部已有自己的捲動子元素，不要再加 overflow  */
  function createGroup(opts) {
    const container = opts.container;
    const flex = opts.flex || null;
    const flexMin = typeof opts.flexMin === 'number' ? opts.flexMin : DEFAULT_FLEX_MIN;
    const reserve = typeof opts.reserve === 'number' ? opts.reserve : DEFAULT_RESERVE;
    const store = opts.store;
    const layout = opts.layout;
    const live = {};              // 拖曳中的暫存高度：不進 store，放開才寫一次
    const panes = [];
    let frame = 0;
    let observer = null;

    for (const def of opts.panes || []) {
      const outer = outerChild(container, def.el);
      if (!outer) continue;       // 結構不符就整條不裝：寧可沒有分隔條，也不要一條拖了沒反應的
      const pane = {
        key: def.key,
        el: def.el,
        outer,
        label: def.label || '區塊',
        sign: def.sign < 0 ? -1 : 1,
        min: typeof def.min === 'number' ? def.min : DEFAULT_MIN,
        scroll: def.scroll !== false,
        visible: typeof def.visible === 'function' ? def.visible : () => true,
        sep: separatorEl(container.ownerDocument, def.label || '區塊'),
      };
      if (pane.sign > 0) container.insertBefore(pane.sep, outer.nextSibling);
      else container.insertBefore(pane.sep, outer);
      if (def.el.id) pane.sep.setAttribute('aria-controls', def.el.id);
      bind(pane);
      panes.push(pane);
    }

    /* 這個窗格現在最高可以到多少。fill 模式要真的把兄弟量一遍：其他窗格可能也被調過，
       只看容器高度會算出一個「一套用就把彈性區壓成零」的上限。 */
    function maxFor(pane) {
      const avail = container.clientHeight;
      if (!avail) return pane.min;                 // 還沒佈局（或已從文件卸下）：先不動它
      if (!flex) return Math.max(pane.min, avail - reserve);
      let used = 0;
      for (const child of container.children) {
        if (child === pane.outer) continue;
        used += child === flex ? flexMin : heightOf(child);
      }
      const extra = Math.max(0, heightOf(pane.outer) - heightOf(pane.el));
      return Math.max(pane.min, avail - used - extra);
    }

    function storedFor(pane) {
      const px = store.paneSizeFor(layout, pane.key);
      return typeof px === 'number' ? px : null;
    }

    function wantedFor(pane) {
      return Object.prototype.hasOwnProperty.call(live, pane.key) ? live[pane.key] : storedFor(pane);
    }

    function setSize(pane, px) {
      const st = pane.el.style;
      st.height = Math.round(px) + 'px';
      st.maxHeight = 'none';           // CSS 的 max-height 預設值（170／190／210px）會蓋掉較大的 height
      st.flexShrink = '0';
      if (pane.scroll) st.overflowY = 'auto';
      pane.el.dataset.paneSized = '1';
    }

    function clearSize(pane) {
      if (!pane.el.dataset.paneSized) return;
      const st = pane.el.style;
      st.height = '';
      st.maxHeight = '';
      st.flexShrink = '';
      if (pane.scroll) st.overflowY = '';
      delete pane.el.dataset.paneSized;
    }

    /* 套用所有窗格高度並同步分隔條狀態。任何重繪之後都要跑一次：內容變了、視窗變了、
       另一個窗格被拉大了，原本合法的高度都可能已經不合法。 */
    function applyAll() {
      for (const pane of panes) {
        const on = !!pane.visible();
        pane.sep.hidden = !on;
        const want = on ? wantedFor(pane) : null;
        if (want === null) clearSize(pane);
        else setSize(pane, Math.max(pane.min, Math.min(want, maxFor(pane))));
        if (!on) continue;
        /* 還沒被調過的窗格是「內容多高就多高」，可能比下限還矮（1a 的清單只有一列時
           才 44px，下限卻是 60）。valuemin／valuemax 要把當下的值包進去，否則讀屏拿到
           一組 min > now 的自相矛盾數字。 */
        const now = Math.round(heightOf(pane.el));
        pane.sep.setAttribute('aria-valuenow', String(now));
        pane.sep.setAttribute('aria-valuemin', String(Math.min(pane.min, now)));
        pane.sep.setAttribute('aria-valuemax', String(Math.max(Math.round(maxFor(pane)), now)));
      }
    }

    function schedule() {
      if (frame) return;
      frame = raf(() => { frame = 0; applyAll(); });
    }

    // 放開滑鼠／按完方向鍵才寫 store：拖曳中每一格都寫等於每秒數十次 localStorage
    function commit(pane) {
      const applied = Math.round(heightOf(pane.el));
      delete live[pane.key];
      store.setPaneSize(layout, pane.key, applied);
      applyAll();
    }

    function bind(pane) {
      pane.sep.addEventListener('pointerdown', (ev) => {
        if (ev.pointerType === 'mouse' && ev.button !== 0) return;
        ev.preventDefault();                       // 不要讓整頁選到文字
        const doc = pane.sep.ownerDocument;        // PiP 時是小視窗那個 document
        const startY = ev.clientY;
        const startH = heightOf(pane.el);
        container.classList.add('is-resizing');
        pane.sep.classList.add('is-dragging');
        try { pane.sep.setPointerCapture(ev.pointerId); } catch (e) { /* 合成事件沒有真的指標 */ }
        try { pane.sep.focus({ preventScroll: true }); } catch (e) { pane.sep.focus(); }

        const move = (e) => {
          if (e.pointerId !== undefined && e.pointerId !== ev.pointerId) return;
          live[pane.key] = startH + pane.sign * (e.clientY - startY);
          schedule();
        };
        const finish = (e) => {
          if (e && e.pointerId !== undefined && e.pointerId !== ev.pointerId) return;
          doc.removeEventListener('pointermove', move);
          doc.removeEventListener('pointerup', finish);
          doc.removeEventListener('pointercancel', finish);
          if (frame) { cancelRaf(frame); frame = 0; }
          container.classList.remove('is-resizing');
          pane.sep.classList.remove('is-dragging');
          try { pane.sep.releasePointerCapture(ev.pointerId); } catch (e2) { /* 沒抓到就不用放 */ }
          applyAll();                              // 先把最後一次移動套上去，再存實際套用值
          commit(pane);
        };
        // 掛在 document：有指標捕捉時事件仍會從分隔條冒泡上來，沒有捕捉（合成事件）時也接得到
        doc.addEventListener('pointermove', move);
        doc.addEventListener('pointerup', finish);
        doc.addEventListener('pointercancel', finish);
      });

      pane.sep.addEventListener('keydown', (ev) => {
        let dy = 0;
        if (ev.key === 'ArrowUp') dy = -KEY_STEP;
        else if (ev.key === 'ArrowDown') dy = KEY_STEP;
        else return;
        ev.preventDefault();                       // 方向鍵不要順便捲動整個內容區
        live[pane.key] = heightOf(pane.el) + pane.sign * dy;
        applyAll();
        commit(pane);
      });
    }

    /* 視窗（或 PiP 小視窗）改變大小要重新夾值。用 ResizeObserver 觀察容器本身：
       它跨 document 仍然有效（1c 被搬進 PiP 後照樣通知），而且我們從不改容器自己的尺寸，
       不會觸發 observer 迴圈。沒有 ResizeObserver 的舊瀏覽器退回 window resize。 */
    if (typeof root.ResizeObserver === 'function') {
      observer = new root.ResizeObserver(() => schedule());
      observer.observe(container);
    } else if (typeof root.addEventListener === 'function') {
      root.addEventListener('resize', schedule);
    }

    applyAll();

    return {
      applyAll,
      panes,
      destroy() {
        if (observer) observer.disconnect();
        else if (typeof root.removeEventListener === 'function') root.removeEventListener('resize', schedule);
        if (frame) { cancelRaf(frame); frame = 0; }
        for (const pane of panes) {
          clearSize(pane);
          if (pane.sep.parentNode) pane.sep.parentNode.removeChild(pane.sep);
        }
      },
    };
  }

  root.ICDResize = { createGroup, KEY_STEP, DEFAULT_MIN };
})(typeof self !== 'undefined' ? self : this);
