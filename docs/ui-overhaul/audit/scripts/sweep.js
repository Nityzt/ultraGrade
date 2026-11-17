async () => {
  const measure = async () => {
  const W = innerWidth, H = innerHeight;
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false;
    if (el.closest('[aria-hidden="true"]')) return false;
    return true;
  };
  const label = (el) => (el.getAttribute('aria-label') || el.innerText || el.value || el.placeholder || el.title || el.tagName).toString().trim().replace(/\s+/g, ' ').slice(0, 40);
  const sel = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
  // overflow
  const sw = document.documentElement.scrollWidth;
  const over = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.right > W + 1 && r.width > 0 && vis(el)) {
      // skip if clipped by an ancestor with overflow hidden/auto
      let p = el.parentElement, clipped = false;
      while (p && p !== document.body) {
        const o = getComputedStyle(p);
        if (/(hidden|auto|scroll|clip)/.test(o.overflowX) && p.getBoundingClientRect().right <= W + 1) { clipped = true; break; }
        p = p.parentElement;
      }
      over.push({ sel: sel(el), right: Math.round(r.right), clipped, text: label(el) });
    }
  }
  // small targets
  const small = [];
  let interactiveCount = 0;
  for (const el of document.querySelectorAll('a, button, input, select, textarea, [role=button], [role=tab]')) {
    if (!vis(el)) continue;
    if (el.type === 'hidden') continue;
    interactiveCount++;
    const r = el.getBoundingClientRect();
    if (r.width < 44 || r.height < 44) small.push({ t: label(el), w: Math.round(r.width), h: Math.round(r.height), sel: sel(el).slice(0, 70) });
  }
  // inputs font-size
  const smallFont = [];
  for (const el of document.querySelectorAll('input, select, textarea')) {
    if (!vis(el) || el.type === 'checkbox' || el.type === 'radio' || el.type === 'hidden' || el.type === 'range' || el.type === 'file') continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 16) smallFont.push({ t: label(el), fs, type: el.type || el.tagName, sel: sel(el).slice(0, 70) });
  }
  // bottom nav
  const nav = [...document.querySelectorAll('.app-bottom-nav, .demo-bottom-nav, nav')].find(n => { const cs = getComputedStyle(n); return cs.position === 'fixed' && vis(n) && n.getBoundingClientRect().bottom >= H - 2; });
  let navInfo = null;
  if (nav) {
    const scroller = [...document.querySelectorAll('main, main *, body *')].find(e => { const cs = getComputedStyle(e); return /(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 2 && !nav.contains(e) && cs.position !== 'fixed' && !e.closest('[role=dialog]'); });
    const prevY = scroller ? scroller.scrollTop : scrollY;
    if (scroller) scroller.scrollTop = scroller.scrollHeight; else window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise(r => setTimeout(r, 350));
    const navTop = nav.getBoundingClientRect().top;
    // last content element: deepest visible element in main with max bottom
    const main = document.querySelector('main') || document.body;
    let maxB = 0, maxEl = null;
    for (const el of main.querySelectorAll('*')) {
      if (nav.contains(el) || !vis(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed') continue;
      let fx = false; for (let a = el; a && a !== main; a = a.parentElement) { if (getComputedStyle(a).position === 'fixed') { fx = true; break; } } if (fx) continue;
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.bottom > maxB && el.children.length === 0) { maxB = r.bottom; maxEl = el; }
    }
    // fixed FABs overlapping
    const fabs = [...document.querySelectorAll('button, a')].filter(b => getComputedStyle(b).position === 'fixed' && vis(b) && !nav.contains(b)).map(b => { const r = b.getBoundingClientRect(); return { t: label(b), top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) }; });
    navInfo = { navSel: sel(nav), navTop: Math.round(navTop), navH: Math.round(nav.getBoundingClientRect().height), lastLeafBottom: Math.round(maxB), lastLeaf: maxEl ? label(maxEl) + ' <' + sel(maxEl).slice(0, 50) + '>' : null, hiddenBehindNav: maxB > navTop + 1, scroller: scroller ? scroller.tagName + '.' + scroller.className.toString().slice(0,40) : 'document', scrollH: document.documentElement.scrollHeight, fabs };
    if (scroller) scroller.scrollTop = prevY; else window.scrollTo(0, prevY);
  }
  return { path: location.pathname, W, H, scrollWidth: sw, hOverflow: sw > W, overflowEls: over.filter(o => !o.clipped).slice(0, 12), clippedOverflowCount: over.filter(o => o.clipped).length, interactiveCount, smallTargetsCount: small.length, smallTargets: small.slice(0, 18), smallFontInputs: smallFont.slice(0, 12), navInfo, theme: document.documentElement.getAttribute('data-theme') };
};
  const routes = ['/demo/grades','/demo/planner','/demo/timetable','/demo/life','/demo/connections','/demo/profile','/demo/ask','/demo'];
  const out = [];
  for (const r of routes) {
    history.pushState({}, '', r); dispatchEvent(new PopStateEvent('popstate'));
    await new Promise(res => setTimeout(res, 900));
    const x = await measure();
    out.push({path: x.path, hOverflow: x.hOverflow, sw: x.scrollWidth, overflowEls: x.overflowEls.slice(0,4), small: x.smallTargetsCount + '/' + x.interactiveCount, smallFont: x.smallFontInputs.length, hiddenBehindNav: x.navInfo && x.navInfo.hiddenBehindNav, lastLeaf: x.navInfo && (x.navInfo.lastLeaf + ' @' + x.navInfo.lastLeafBottom + ' navTop ' + x.navInfo.navTop)});
  }
  return out;
}