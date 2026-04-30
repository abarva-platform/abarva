// PR-OV2-3c: Archetype primer HTML renderer tests.
//
// Locks the contract from docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
// Sections D.0.6 + D.0.7 (open question 4) — the downloadable HTML brief
// is a self-contained, brand-faithful artifact a senior PM can email to
// their team. The shape tests keep the document honest:
//   - mirrors the in-app section ordering (Phase0Primer.tsx)
//   - escapes user content (the contract is open and future authors might
//     legitimately use `<` characters)
//   - stays under the 50 KB ceiling so it's email-friendly
//
// The renderer is server-only at runtime via `import 'server-only'`. The
// jest project config silences that boundary in tests so the function
// remains directly testable.

// `server-only` throws when imported outside a server context. Stub it
// before importing the module under test.
jest.mock('server-only', () => ({}));

import {
  CDP_ACTIVATION_PRIMER,
  CONTACT_CENTER_AI_PRIMER,
  DEMAND_FORECASTING_PRIMER,
} from '../index';
import type { ArchetypePrimer } from '../types';
import { renderArchetypePrimerHtml } from '../render-html';

describe('renderArchetypePrimerHtml · OV2-3c', () => {
  const FROZEN = new Date('2026-04-29T12:00:00.000Z');

  // Mirrors the renderer's internal escapeHtml so authored prose
  // containing `&` / `<` / `>` (e.g. "S&OP cadence inventory") matches
  // its emitted form.
  const expectedHtml = (s: string): string =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  it('returns a complete HTML document starting with <!DOCTYPE html>', () => {
    const html = renderArchetypePrimerHtml(CDP_ACTIVATION_PRIMER, {
      generatedAt: FROZEN,
    });
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('</html>');
  });

  it('includes the required <meta charset="UTF-8"> + viewport + generator tags', () => {
    const html = renderArchetypePrimerHtml(CDP_ACTIVATION_PRIMER, {
      generatedAt: FROZEN,
    });
    expect(html).toContain('<meta charset="UTF-8">');
    expect(html).toContain(
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
    );
    expect(html).toContain('<meta name="generator" content="AbarVa Programs">');
  });

  it('renders the displayName in the <title> tag', () => {
    const html = renderArchetypePrimerHtml(CDP_ACTIVATION_PRIMER, {
      generatedAt: FROZEN,
    });
    // Title appears once in <title>, once in the H1; we assert the title tag.
    expect(html).toContain(
      `<title>${expectedHtml(CDP_ACTIVATION_PRIMER.displayName)} — Phase 0 prep</title>`,
    );
  });

  it('renders the patternId in the header eyebrow', () => {
    const html = renderArchetypePrimerHtml(CDP_ACTIVATION_PRIMER, {
      generatedAt: FROZEN,
    });
    expect(html).toContain(`PHASE 0 PREP · ${CDP_ACTIVATION_PRIMER.patternId}`);
  });

  it('renders every SME role from the primer', () => {
    const html = renderArchetypePrimerHtml(CDP_ACTIVATION_PRIMER, {
      generatedAt: FROZEN,
    });
    for (const sme of CDP_ACTIVATION_PRIMER.smes) {
      expect(html).toContain(expectedHtml(sme.role));
    }
  });

  it('renders every template id (mono-rendered) plus every template title', () => {
    const html = renderArchetypePrimerHtml(CDP_ACTIVATION_PRIMER, {
      generatedAt: FROZEN,
    });
    for (const tpl of CDP_ACTIVATION_PRIMER.templates) {
      expect(html).toContain(tpl.id);
      expect(html).toContain(expectedHtml(tpl.title));
    }
  });

  it('renders every workshop title and duration', () => {
    const html = renderArchetypePrimerHtml(CDP_ACTIVATION_PRIMER, {
      generatedAt: FROZEN,
    });
    for (const ws of CDP_ACTIVATION_PRIMER.workshops) {
      expect(html).toContain(expectedHtml(ws.title));
      expect(html).toContain(`${ws.durationHours}h`);
    }
  });

  it('renders every data asset label', () => {
    const html = renderArchetypePrimerHtml(CDP_ACTIVATION_PRIMER, {
      generatedAt: FROZEN,
    });
    for (const asset of CDP_ACTIVATION_PRIMER.dataAssets) {
      expect(html).toContain(expectedHtml(asset.label));
    }
  });

  it('renders every prep checklist label', () => {
    const html = renderArchetypePrimerHtml(CDP_ACTIVATION_PRIMER, {
      generatedAt: FROZEN,
    });
    for (const item of CDP_ACTIVATION_PRIMER.prepChecklist) {
      expect(html).toContain(expectedHtml(item.label));
    }
  });

  it('renders the nine canonical sections in the same order as Phase0Primer.tsx', () => {
    const html = renderArchetypePrimerHtml(CDP_ACTIVATION_PRIMER, {
      generatedAt: FROZEN,
    });
    // Use data-section markers so we don't depend on copy.
    const order = [
      'data-section="p1-outcome"',
      'data-section="p1-steps"',
      'data-section="smes"',
      'data-section="templates"',
      'data-section="workshops"',
      'data-section="data-assets"',
      'data-section="prep-checklist"',
    ];
    let cursor = 0;
    for (const marker of order) {
      const idx = html.indexOf(marker, cursor);
      expect(idx).toBeGreaterThanOrEqual(0);
      cursor = idx + marker.length;
    }
  });

  it('escapes user content: a primer field containing <script> is not emitted live', () => {
    const dangerous: ArchetypePrimer = {
      ...CDP_ACTIVATION_PRIMER,
      displayName: 'Pwn <script>alert(1)</script>',
      p1OutcomeStatement:
        'Trust nobody — including <iframe src="evil.example"></iframe> in their P0 brief.',
    };
    const html = renderArchetypePrimerHtml(dangerous, {
      generatedAt: FROZEN,
    });
    // No live tag, no closing tag.
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('<iframe src="evil.example"></iframe>');
    // Escaped form is present.
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;iframe');
  });

  it('renders a footer with the supplied generatedAt timestamp', () => {
    const html = renderArchetypePrimerHtml(CDP_ACTIVATION_PRIMER, {
      generatedAt: FROZEN,
    });
    expect(html).toContain('Generated by AbarVa');
    expect(html).toContain(FROZEN.toISOString());
    expect(html).toContain('Phase 0 prep');
  });

  it('honours an override brand subtitle', () => {
    const html = renderArchetypePrimerHtml(CDP_ACTIVATION_PRIMER, {
      generatedAt: FROZEN,
      brandSubtitle: 'AbarVa · Apex Retail · Programs',
    });
    expect(html).toContain('AbarVa · Apex Retail · Programs');
  });

  it('stays under the 50 KB size ceiling for the CDP fixture', () => {
    const html = renderArchetypePrimerHtml(CDP_ACTIVATION_PRIMER, {
      generatedAt: FROZEN,
    });
    const size = Buffer.byteLength(html, 'utf8');
    expect(size).toBeLessThan(50 * 1024);
  });

  it('contains no <script> tags (pure document, no JS)', () => {
    const html = renderArchetypePrimerHtml(CDP_ACTIVATION_PRIMER, {
      generatedAt: FROZEN,
    });
    expect(html).not.toMatch(/<script\b/i);
  });

  it('uses inline <style> only — no external stylesheet links', () => {
    const html = renderArchetypePrimerHtml(CDP_ACTIVATION_PRIMER, {
      generatedAt: FROZEN,
    });
    expect(html).toContain('<style>');
    expect(html).not.toMatch(/<link\b[^>]*rel=["']stylesheet/i);
  });

  it('also renders the Contact Center AI primer cleanly', () => {
    const html = renderArchetypePrimerHtml(CONTACT_CENTER_AI_PRIMER, {
      generatedAt: FROZEN,
    });
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain(expectedHtml(CONTACT_CENTER_AI_PRIMER.displayName));
    for (const sme of CONTACT_CENTER_AI_PRIMER.smes) {
      expect(html).toContain(expectedHtml(sme.role));
    }
    expect(Buffer.byteLength(html, 'utf8')).toBeLessThan(50 * 1024);
  });

  it('also renders the Demand Forecasting primer cleanly', () => {
    const html = renderArchetypePrimerHtml(DEMAND_FORECASTING_PRIMER, {
      generatedAt: FROZEN,
    });
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain(expectedHtml(DEMAND_FORECASTING_PRIMER.displayName));
    for (const ws of DEMAND_FORECASTING_PRIMER.workshops) {
      expect(html).toContain(expectedHtml(ws.title));
    }
    expect(Buffer.byteLength(html, 'utf8')).toBeLessThan(50 * 1024);
  });
});
