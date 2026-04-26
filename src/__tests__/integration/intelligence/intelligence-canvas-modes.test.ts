// I5 · Intelligence Canvas mode switching tests.
//
// Pure deterministic coverage of the I5 helper that powers canvas
// mode switching. No React rendering, no DOM, no model calls. The
// component itself is covered by typecheck + build + a source-regex
// mount probe at the bottom of this file.

import * as fs from 'fs';
import * as path from 'path';

import {
  INTELLIGENCE_CANVAS_MODES,
  buildIntelligenceCanvasView,
  getCanvasModeLabel,
  isIntelligenceCanvasMode,
  parseCanvasModeFromSearchParam,
  type IntelligenceCanvasMode,
  type IntelligenceCanvasView,
} from '@/lib/intelligence/intelligence-canvas-modes';

const PATTERN_KEY = 'value_ledger_incompleteness';

// ---------------------------------------------------------------------
// Mode set / labels
// ---------------------------------------------------------------------

describe('INTELLIGENCE_CANVAS_MODES', () => {
  it('declares exactly four canonical modes in canonical order', () => {
    expect([...INTELLIGENCE_CANVAS_MODES]).toEqual([
      'summary',
      'evidence',
      'programs',
      'actions',
    ]);
  });

  it('isIntelligenceCanvasMode accepts every canonical mode', () => {
    for (const mode of INTELLIGENCE_CANVAS_MODES) {
      expect(isIntelligenceCanvasMode(mode)).toBe(true);
    }
  });

  it('isIntelligenceCanvasMode rejects unknown values', () => {
    expect(isIntelligenceCanvasMode('detail')).toBe(false);
    expect(isIntelligenceCanvasMode('')).toBe(false);
    expect(isIntelligenceCanvasMode(null)).toBe(false);
    expect(isIntelligenceCanvasMode(undefined)).toBe(false);
    expect(isIntelligenceCanvasMode(123)).toBe(false);
  });

  it('getCanvasModeLabel returns a non-empty human-readable label per mode', () => {
    for (const mode of INTELLIGENCE_CANVAS_MODES) {
      const label = getCanvasModeLabel(mode);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
      // Labels are Title Case
      expect(label[0]).toBe(label[0].toUpperCase());
    }
  });
});

// ---------------------------------------------------------------------
// parseCanvasModeFromSearchParam
// ---------------------------------------------------------------------

describe('parseCanvasModeFromSearchParam', () => {
  it('returns "summary" for undefined', () => {
    expect(parseCanvasModeFromSearchParam(undefined)).toBe('summary');
  });

  it('returns "summary" for null', () => {
    expect(parseCanvasModeFromSearchParam(null)).toBe('summary');
  });

  it('returns "summary" for an array (param appeared more than once)', () => {
    expect(parseCanvasModeFromSearchParam(['summary', 'evidence'])).toBe(
      'summary',
    );
    expect(parseCanvasModeFromSearchParam([])).toBe('summary');
  });

  it('returns "summary" for an empty string', () => {
    expect(parseCanvasModeFromSearchParam('')).toBe('summary');
  });

  it('returns "summary" for an unknown mode', () => {
    expect(parseCanvasModeFromSearchParam('detail')).toBe('summary');
    expect(parseCanvasModeFromSearchParam('SUMMARY')).toBe('summary');
    expect(parseCanvasModeFromSearchParam(' summary')).toBe('summary');
  });

  it('returns the canonical mode for each canonical input', () => {
    for (const mode of INTELLIGENCE_CANVAS_MODES) {
      expect(parseCanvasModeFromSearchParam(mode)).toBe(mode);
    }
  });
});

// ---------------------------------------------------------------------
// buildIntelligenceCanvasView — defaults / shape
// ---------------------------------------------------------------------

describe('buildIntelligenceCanvasView', () => {
  it('defaults to mode "summary" when mode is omitted', () => {
    const view = buildIntelligenceCanvasView({ patternKey: PATTERN_KEY });
    expect(view.mode).toBe('summary');
    expect(view.body.kind).toBe('summary');
    expect(view.surfaceLabel).toBe('Summary');
    expect(view.createdFrom).toBe('deterministic_seed');
  });

  it('exposes all four mode tabs in canonical order with active flag set', () => {
    const view = buildIntelligenceCanvasView({
      patternKey: PATTERN_KEY,
      mode: 'evidence',
    });
    const keys = view.modes.map((m) => m.key);
    expect(keys).toEqual(['summary', 'evidence', 'programs', 'actions']);
    const actives = view.modes.filter((m) => m.isActive).map((m) => m.key);
    expect(actives).toEqual(['evidence']);
  });

  it('builds hrefs that include the pattern key and ?canvas=<mode>', () => {
    const view = buildIntelligenceCanvasView({
      patternKey: PATTERN_KEY,
      tenantSlug: 'apex-retail',
    });
    for (const tab of view.modes) {
      expect(tab.href).toContain(`/intelligence/patterns/${PATTERN_KEY}`);
      expect(tab.href).toContain(`?canvas=${tab.key}`);
      expect(tab.href).toContain('/tenant/apex-retail/');
    }
  });

  it('falls back to the canonical apex-retail tenant slug when tenantSlug is omitted', () => {
    const view = buildIntelligenceCanvasView({ patternKey: PATTERN_KEY });
    expect(view.modes[0].href).toContain('/tenant/apex-retail/');
  });

  it('body.kind always matches mode', () => {
    for (const mode of INTELLIGENCE_CANVAS_MODES) {
      const view = buildIntelligenceCanvasView({
        patternKey: PATTERN_KEY,
        mode,
      });
      expect(view.body.kind).toBe(mode);
    }
  });

  it('body content lists are bounded (cap of 5)', () => {
    for (const mode of INTELLIGENCE_CANVAS_MODES) {
      const view = buildIntelligenceCanvasView({
        patternKey: PATTERN_KEY,
        mode,
      });
      const body = view.body;
      switch (body.kind) {
        case 'summary':
          expect(body.content.bullets.length).toBeLessThanOrEqual(5);
          break;
        case 'evidence':
          expect(body.content.rows.length).toBeLessThanOrEqual(5);
          break;
        case 'programs':
        case 'actions':
          expect(body.content.rows.length).toBeLessThanOrEqual(5);
          break;
      }
    }
  });

  it('honest disclaimer never claims a live runtime', () => {
    const view = buildIntelligenceCanvasView({ patternKey: PATTERN_KEY });
    const lower = view.honestDisclaimer.toLowerCase();
    expect(lower).toContain('deterministic');
    expect(lower).not.toContain('live runtime today is');
  });
});

// ---------------------------------------------------------------------
// Determinism — byte-equal output across calls
// ---------------------------------------------------------------------

describe('buildIntelligenceCanvasView determinism', () => {
  it('produces byte-equal JSON across calls with identical inputs', () => {
    for (const mode of INTELLIGENCE_CANVAS_MODES) {
      const a = buildIntelligenceCanvasView({
        patternKey: PATTERN_KEY,
        mode,
        tenantSlug: 'apex-retail',
      });
      const b = buildIntelligenceCanvasView({
        patternKey: PATTERN_KEY,
        mode,
        tenantSlug: 'apex-retail',
      });
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    }
  });

  it('produces stable content regardless of mode argument permutations', () => {
    const direct: IntelligenceCanvasView = buildIntelligenceCanvasView({
      patternKey: PATTERN_KEY,
      mode: 'programs',
    });
    // Pass mode through the parser as well; result is byte-equal
    // because the parser is the identity on canonical modes.
    const parsedMode = parseCanvasModeFromSearchParam(
      'programs' as IntelligenceCanvasMode,
    );
    const parsed = buildIntelligenceCanvasView({
      patternKey: PATTERN_KEY,
      mode: parsedMode,
    });
    expect(JSON.stringify(direct)).toBe(JSON.stringify(parsed));
  });
});

// ---------------------------------------------------------------------
// Component file integration probe (regex against source)
// ---------------------------------------------------------------------

describe('IntelligenceCanvasModeTabs component file', () => {
  const componentPath = path.join(
    process.cwd(),
    'src/components/intelligence/IntelligenceCanvasModeTabs.tsx',
  );
  const pagePath = path.join(
    process.cwd(),
    'src/app/(maestro)/tenant/[tenantSlug]/intelligence/patterns/[patternKey]/page.tsx',
  );

  it('exists on disk', () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it('does not introduce client-only React patterns', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src.includes("'use client'")).toBe(false);
    expect(src.includes('"use client"')).toBe(false);
    expect(/\buseState\b/.test(src)).toBe(false);
    expect(/\buseEffect\b/.test(src)).toBe(false);
    // Forbidden non-determinism / live-call markers
    expect(/Math\.random\b/.test(src)).toBe(false);
    expect(/Date\.now\b/.test(src)).toBe(false);
    expect(/new Date\(/.test(src)).toBe(false);
    expect(/\bfetch\(/.test(src)).toBe(false);
  });

  it('mounts the canvas mode tabs marker, parser, and view builder', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toMatch(/data-intelligence-canvas-modes="i5"/);
    expect(src).toMatch(/parseCanvasModeFromSearchParam/);
    expect(src).toMatch(/buildIntelligenceCanvasView/);
    expect(src).toMatch(/from 'next\/link'/);
  });

  it('is mounted by the tenant pattern detail page', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    expect(src).toMatch(/IntelligenceCanvasModeTabs/);
    expect(src).toMatch(/searchParams/);
  });

  it('does not introduce client-only React patterns in the page', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    expect(src.includes("'use client'")).toBe(false);
    expect(/\buseState\b/.test(src)).toBe(false);
    expect(/\buseEffect\b/.test(src)).toBe(false);
  });
});

// ---------------------------------------------------------------------
// Module hygiene — no forbidden imports in the helper
// ---------------------------------------------------------------------

describe('intelligence-canvas-modes module hygiene', () => {
  const helperPath = path.join(
    process.cwd(),
    'src/lib/intelligence/intelligence-canvas-modes.ts',
  );
  const src = fs.readFileSync(helperPath, 'utf8');

  it('does not import React, Next, or any UI module', () => {
    expect(/from 'react'/.test(src)).toBe(false);
    expect(/from 'next\//.test(src)).toBe(false);
    expect(/from '@\/components\//.test(src)).toBe(false);
  });

  it('does not import any runtime / model SDK', () => {
    expect(/from 'anthropic'/.test(src)).toBe(false);
    expect(/from 'openai'/.test(src)).toBe(false);
    expect(/from '@\/lib\/sentinel\//.test(src)).toBe(false);
    expect(/from '@\/lib\/atlas\//.test(src)).toBe(false);
    expect(/from '@\/lib\/nexus\//.test(src)).toBe(false);
    expect(/from '@\/lib\/agent\//.test(src)).toBe(false);
  });

  it('does not contain forbidden non-determinism markers', () => {
    expect(/Date\.now\b/.test(src)).toBe(false);
    expect(/Math\.random\b/.test(src)).toBe(false);
    expect(/new Date\(/.test(src)).toBe(false);
    expect(/\bfetch\(/.test(src)).toBe(false);
  });

  it('does not contain placeholder copy', () => {
    const lower = src.toLowerCase();
    expect(lower.includes('coming soon')).toBe(false);
    expect(lower.includes('lorem ipsum')).toBe(false);
    expect(lower.includes('tbd')).toBe(false);
  });
});
