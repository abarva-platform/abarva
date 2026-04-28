// PRG-STA-SUGGESTED-ACTION-VIEW · Suggested action overlay view model tests.
//
// Pure TypeScript + Jest. No jsdom, no React, no model calls.
// Anchors the P-SMOKE-CDP action C cross-surface link contract
// (href: '/intelligence/t3-h03') and verifies the three-frame overlay
// state machine for linked and unlinked actions.

import {
  buildAllWorkbenchOverlayViews,
  buildSuggestedActionOverlayView,
  deriveCrossSurfaceLinkLabel,
  getCrossSurfaceActions,
} from '@/lib/programs/suggested-action-overlay-view';
import { buildProgramDetailView } from '@/lib/programs/programs-detail-view';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function cdpP3Workbench() {
  return buildProgramDetailView('apx-cdp-2026').workbench;
}

const SIMPLE_ACTION = {
  letter: 'A' as const,
  text: 'Review architecture blueprint',
  detail: 'Draft ready for sponsor review',
};

const LINKED_ACTION = {
  letter: 'C' as const,
  text: 'Brief on T3-H03 Loyalty pattern',
  detail: 'Sentinel validated Unified Loyalty Intelligence',
  href: '/intelligence/t3-h03',
};

// ─── P-SMOKE-CDP: action C cross-surface link contract ───────────────────────

describe('P-SMOKE-CDP · CDP P3 action C has cross-surface link', () => {
  const workbench = cdpP3Workbench();

  it('CDP P3 workbench has exactly 3 actions', () => {
    expect(workbench.actions).toHaveLength(3);
  });

  it('action C text matches the pattern brief', () => {
    const actionC = workbench.actions.find((a) => a.letter === 'C');
    expect(actionC?.text).toBe('Brief on T3-H03 Loyalty pattern');
  });

  it('action C has href "/intelligence/t3-h03"', () => {
    const actionC = workbench.actions.find((a) => a.letter === 'C');
    expect(actionC?.href).toBe('/intelligence/t3-h03');
  });

  it('getCrossSurfaceActions returns exactly 1 action for CDP P3', () => {
    expect(getCrossSurfaceActions(workbench)).toHaveLength(1);
  });

  it('the cross-surface action is action C', () => {
    const linked = getCrossSurfaceActions(workbench);
    expect(linked[0].letter).toBe('C');
    expect(linked[0].href).toBe('/intelligence/t3-h03');
  });
});

// ─── buildSuggestedActionOverlayView · linked action (with href) ─────────────

describe('buildSuggestedActionOverlayView · linked action (href present)', () => {
  const view = buildSuggestedActionOverlayView(LINKED_ACTION);

  it('hasCrossSurfaceLink is true', () => {
    expect(view.hasCrossSurfaceLink).toBe(true);
  });

  it('has exactly 3 frames', () => {
    expect(view.frames).toHaveLength(3);
  });

  it('frame 1 headline is "Nexus suggests"', () => {
    expect(view.frames[0].headline).toBe('Nexus suggests');
  });

  it('frame 1 bodyText is the action detail', () => {
    expect(view.frames[0].bodyText).toBe(LINKED_ACTION.detail);
  });

  it('frame 1 primaryLabel is "Proceed →"', () => {
    expect(view.frames[0].primaryLabel).toBe('Proceed →');
  });

  it('frame 1 crossSurfaceHref is null (not yet at frame 3)', () => {
    expect(view.frames[0].crossSurfaceHref).toBeNull();
  });

  it('frame 2 headline is "Confirm action"', () => {
    expect(view.frames[1].headline).toBe('Confirm action');
  });

  it('frame 2 primaryLabel is "Confirm and proceed"', () => {
    expect(view.frames[1].primaryLabel).toBe('Confirm and proceed');
  });

  it('frame 3 headline is "Action logged"', () => {
    expect(view.frames[2].headline).toBe('Action logged');
  });

  it('frame 3 crossSurfaceHref is "/intelligence/t3-h03"', () => {
    expect(view.frames[2].crossSurfaceHref).toBe('/intelligence/t3-h03');
  });

  it('frame 3 crossSurfaceLinkLabel is "View in Intelligence →"', () => {
    expect(view.frames[2].crossSurfaceLinkLabel).toBe('View in Intelligence →');
  });

  it('frame 3 primaryNavigates is true', () => {
    expect(view.frames[2].primaryNavigates).toBe(true);
  });

  it('deterministicSeed is true', () => {
    expect(view.deterministicSeed).toBe(true);
  });
});

// ─── buildSuggestedActionOverlayView · unlinked action (no href) ─────────────

describe('buildSuggestedActionOverlayView · unlinked action (no href)', () => {
  const view = buildSuggestedActionOverlayView(SIMPLE_ACTION);

  it('hasCrossSurfaceLink is false', () => {
    expect(view.hasCrossSurfaceLink).toBe(false);
  });

  it('frame 3 crossSurfaceHref is null', () => {
    expect(view.frames[2].crossSurfaceHref).toBeNull();
  });

  it('frame 3 crossSurfaceLinkLabel is null', () => {
    expect(view.frames[2].crossSurfaceLinkLabel).toBeNull();
  });

  it('frame 3 primaryNavigates is false', () => {
    expect(view.frames[2].primaryNavigates).toBe(false);
  });

  it('frame 1 bodyText falls back to action.text when no detail', () => {
    const noDetail = {
      letter: 'B' as const,
      text: 'No detail action',
    };
    const v = buildSuggestedActionOverlayView(noDetail);
    expect(v.frames[0].bodyText).toBe('No detail action');
  });
});

// ─── deriveCrossSurfaceLinkLabel ──────────────────────────────────────────────

describe('deriveCrossSurfaceLinkLabel', () => {
  it('returns "View in Intelligence →" for /intelligence paths', () => {
    expect(deriveCrossSurfaceLinkLabel('/intelligence/t3-h03')).toBe(
      'View in Intelligence →',
    );
    expect(deriveCrossSurfaceLinkLabel('/intelligence')).toBe(
      'View in Intelligence →',
    );
  });

  it('returns "View in Source →" for /source paths', () => {
    expect(deriveCrossSurfaceLinkLabel('/source/events/abc')).toBe(
      'View in Source →',
    );
  });

  it('returns "View in Tower →" for /tower paths', () => {
    expect(deriveCrossSurfaceLinkLabel('/tower/outcomes/xyz')).toBe(
      'View in Tower →',
    );
  });

  it('returns "View program →" for /programs paths', () => {
    expect(deriveCrossSurfaceLinkLabel('/programs/apx-cdp-2026')).toBe(
      'View program →',
    );
  });

  it('returns "View →" for unknown paths', () => {
    expect(deriveCrossSurfaceLinkLabel('/unknown/something')).toBe('View →');
  });
});

// ─── buildAllWorkbenchOverlayViews ────────────────────────────────────────────

describe('buildAllWorkbenchOverlayViews · CDP P3', () => {
  const workbench = cdpP3Workbench();
  const views = buildAllWorkbenchOverlayViews(workbench);

  it('returns one view per workbench action', () => {
    expect(views).toHaveLength(workbench.actions.length);
  });

  it('action A overlay has no cross-surface link', () => {
    const viewA = views.find((v) => v.action.letter === 'A');
    expect(viewA?.hasCrossSurfaceLink).toBe(false);
  });

  it('action B overlay has no cross-surface link', () => {
    const viewB = views.find((v) => v.action.letter === 'B');
    expect(viewB?.hasCrossSurfaceLink).toBe(false);
  });

  it('action C overlay has cross-surface link to Intelligence', () => {
    const viewC = views.find((v) => v.action.letter === 'C');
    expect(viewC?.hasCrossSurfaceLink).toBe(true);
    expect(viewC?.frames[2].crossSurfaceHref).toBe('/intelligence/t3-h03');
    expect(viewC?.frames[2].crossSurfaceLinkLabel).toBe(
      'View in Intelligence →',
    );
  });
});

// ─── Determinism ─────────────────────────────────────────────────────────────

describe('buildSuggestedActionOverlayView · determinism', () => {
  it('produces identical output for identical input (linked action)', () => {
    const a = buildSuggestedActionOverlayView(LINKED_ACTION);
    const b = buildSuggestedActionOverlayView(LINKED_ACTION);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('produces identical output for identical input (unlinked action)', () => {
    const a = buildSuggestedActionOverlayView(SIMPLE_ACTION);
    const b = buildSuggestedActionOverlayView(SIMPLE_ACTION);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ─── Module hygiene ───────────────────────────────────────────────────────────

describe('suggested-action-overlay-view · module hygiene', () => {
  it('module source contains no runtime impurity', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve(
        __dirname,
        '../../../lib/programs/suggested-action-overlay-view.ts',
      ),
      'utf8',
    );
    expect(src).not.toMatch(/Date\.now/);
    expect(src).not.toMatch(/Math\.random/);
    expect(src).not.toMatch(/new Date\(/);
    expect(src).not.toMatch(/fetch\(/);
  });
});
