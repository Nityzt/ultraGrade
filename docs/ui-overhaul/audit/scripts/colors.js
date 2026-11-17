() => {
  const root = getComputedStyle(document.documentElement);
  const tokens = {};
  for (const t of ['--p', '--bc', '--b1', '--b2', '--wa', '--pc', '--in']) tokens[t] = root.getPropertyValue(t).trim();
  const supports = {
    hsl_p_alpha: CSS.supports('color', 'hsl(' + tokens['--p'] + ' / .2)'),
    hsl_p: CSS.supports('color', 'hsl(' + tokens['--p'] + ')'),
    oklch_p_alpha: CSS.supports('color', 'oklch(' + tokens['--p'] + ' / .2)'),
  };
  const out = {};
  for (const c of ['.status-pill', '.status-pill-primary', '.app-rail', '.app-bottom-nav', '.demo-bottom-nav', '.demo-rail', '.action-icon', '.action-icon-primary', '.segment-control', '.skip-link', '.prompt-chip', '.command-link-card', '.hero-prompt', '.demo-ask-fab', '.timeline-dot-primary']) {
    const el = document.querySelector(c);
    if (!el) { out[c] = null; continue; }
    const cs = getComputedStyle(el);
    out[c] = { bg: cs.backgroundColor, border: cs.borderTopColor, borderW: cs.borderTopWidth, color: cs.color, outline: cs.outlineColor, shadow: cs.boxShadow.slice(0, 80) };
  }
  const a = document.activeElement;
  let focused = null;
  if (a && a !== document.body) { const cs = getComputedStyle(a); focused = { el: a.tagName + '.' + (a.className || '').toString().slice(0, 60), text: (a.innerText || a.getAttribute('aria-label') || '').slice(0, 30), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor, shadow: cs.boxShadow.slice(0, 100), focusVisible: a.matches(':focus-visible') }; }
  return { theme: document.documentElement.getAttribute('data-theme'), tokens, supports, out, focused };
}
