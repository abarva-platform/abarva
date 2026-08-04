import type { CSSProperties } from 'react';

// The design's responsive shell styles (explorer/aVa panel) are computed as
// raw CSS declaration strings (position/z-index/shadow toggles based on
// narrow/tight/wide breakpoints). React's `style` prop needs an object, so
// this parses that string the same way a browser's style attribute would.
export function cssStringToObject(css: string): CSSProperties {
  const out: Record<string, string> = {};
  css
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .forEach((rule) => {
      const idx = rule.indexOf(':');
      if (idx === -1) return;
      const prop = rule.slice(0, idx).trim();
      const value = rule.slice(idx + 1).trim();
      const camel = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      out[camel] = value;
    });
  return out as CSSProperties;
}
