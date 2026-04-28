// I8 · Sentinel Interaction Rail tests.
//
// Covers:
//   - View-model determinism (same input → byte-equal view)
//   - View-model contract (sections, createdFrom, caps, honest framing)
//   - Module hygiene on the view-model module (.ts)
//   - Canon hygiene on the server component (.tsx): theme import,
//     no hex literals, no DM Sans literals, no 'use client', no hooks

import {
  buildSentinelInteractionRailView,
  type SentinelInteractionRailInput,
  type SentinelInteractionRailView,
} from '@/lib/intelligence/sentinel-interaction-rail-view';

const APEX_PORTFOLIO_INPUT: SentinelInteractionRailInput = {
  tenantDisplayName: 'Apex Retail',
  observedProgramCount: 4,
};

const APEX_ANCHOR_INPUT: SentinelInteractionRailInput = {
  tenantDisplayName: 'Apex Retail',
  anchorPatternKey: 'evidence_chain_gap',
  anchorPatternName: 'Evidence chain gap',
  observedProgramCount: 4,
};

// ---------------------------------------------------------------------
// Determinism + shape
// ---------------------------------------------------------------------

describe('buildSentinelInteractionRailView · determinism', () => {
  it('returns byte-equal views across repeated calls (portfolio)', () => {
    const a = buildSentinelInteractionRailView(APEX_PORTFOLIO_INPUT);
    const b = buildSentinelInteractionRailView(APEX_PORTFOLIO_INPUT);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('returns byte-equal views across repeated calls (anchor)', () => {
    const a = buildSentinelInteractionRailView(APEX_ANCHOR_INPUT);
    const b = buildSentinelInteractionRailView(APEX_ANCHOR_INPUT);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('createdFrom is the deterministic seed marker', () => {
    const view = buildSentinelInteractionRailView(APEX_PORTFOLIO_INPUT);
    expect(view.createdFrom).toBe(
      'deterministic_sentinel_interaction_rail_seed',
    );
  });
});

describe('SentinelInteractionRailView · sections present', () => {
  const view: SentinelInteractionRailView = buildSentinelInteractionRailView(
    APEX_ANCHOR_INPUT,
  );

  it('carries the canonical eyebrow label', () => {
    expect(view.eyebrow).toBe('SENTINEL · INTELLIGENCE RAIL');
  });

  it('carries a non-empty title naming the tenant', () => {
    expect(view.title.length).toBeGreaterThan(0);
    expect(view.title).toContain('Apex Retail');
  });

  it('carries recentSignals as a non-empty array (cap 3)', () => {
    expect(Array.isArray(view.recentSignals)).toBe(true);
    expect(view.recentSignals.length).toBeGreaterThan(0);
    expect(view.recentSignals.length).toBeLessThanOrEqual(3);
    for (const s of view.recentSignals) {
      expect(typeof s.id).toBe('string');
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.summary.length).toBeGreaterThan(0);
      expect(['low', 'medium', 'high', 'critical']).toContain(s.severity);
    }
  });

  it('carries activePatterns as a non-empty array', () => {
    expect(Array.isArray(view.activePatterns)).toBe(true);
    expect(view.activePatterns.length).toBeGreaterThan(0);
    for (const p of view.activePatterns) {
      expect(typeof p.id).toBe('string');
      expect(p.patternKey.length).toBeGreaterThan(0);
      expect(p.patternName.length).toBeGreaterThan(0);
      expect(p.whyActive.length).toBeGreaterThan(0);
    }
  });

  it('carries an evidenceConfidence object with label + basis', () => {
    expect(['low', 'medium', 'high']).toContain(view.evidenceConfidence.label);
    expect(view.evidenceConfidence.basis.length).toBeGreaterThan(0);
  });

  it('carries recommendedActions as a non-empty array (all deferred today)', () => {
    expect(Array.isArray(view.recommendedActions)).toBe(true);
    expect(view.recommendedActions.length).toBeGreaterThan(0);
    expect(view.recommendedActions.length).toBeLessThanOrEqual(3);
    for (const a of view.recommendedActions) {
      expect(typeof a.id).toBe('string');
      expect(a.label.length).toBeGreaterThan(0);
      expect(a.reason.length).toBeGreaterThan(0);
      expect(a.enabled).toBe(false);
    }
  });

  it('carries a single-line disclaimer naming the deterministic seed', () => {
    expect(view.disclaimer.length).toBeGreaterThan(0);
    expect(view.disclaimer.toLowerCase()).toContain('deterministic');
  });
});

describe('SentinelInteractionRailView · anchor vs portfolio framing', () => {
  it('without an anchor pattern, the active pattern surface is portfolio_context', () => {
    const view = buildSentinelInteractionRailView(APEX_PORTFOLIO_INPUT);
    expect(view.anchorPatternKey).toBeNull();
    expect(view.anchorPatternName).toBeNull();
    expect(view.activePatterns[0]?.patternKey).toBe('portfolio_context');
  });

  it('with an anchor pattern, the active pattern surface uses the anchor', () => {
    const view = buildSentinelInteractionRailView(APEX_ANCHOR_INPUT);
    expect(view.anchorPatternKey).toBe('evidence_chain_gap');
    expect(view.anchorPatternName).toBe('Evidence chain gap');
    expect(view.activePatterns[0]?.patternKey).toBe('evidence_chain_gap');
  });
});

describe('SentinelInteractionRailView · honest framing invariants', () => {
  it('does not invent a dollar amount in any string field', () => {
    const view = buildSentinelInteractionRailView(APEX_ANCHOR_INPUT);
    const dollarPattern = /\$\s?\d[\d,]*(\.\d+)?/;
    expect(JSON.stringify(view)).not.toMatch(dollarPattern);
  });

  it('does not claim a live runtime, retrieval, or model invocation', () => {
    const view = buildSentinelInteractionRailView(APEX_ANCHOR_INPUT);
    const json = JSON.stringify(view).toLowerCase();
    expect(json).not.toContain('live retrieval enabled');
    expect(json).not.toContain('live model invocation');
    expect(json).not.toContain('claude');
    expect(json).not.toContain('openai');
  });
});

// ---------------------------------------------------------------------
// Module hygiene · sentinel-interaction-rail-view.ts
// ---------------------------------------------------------------------

describe('module hygiene · sentinel-interaction-rail-view.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/intelligence/sentinel-interaction-rail-view.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripComments(source);

  it('does not import Sentinel runtime, Atlas, Nexus, or agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import Source UI, legacy /programs, mock.ts, or auth', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
  });

  it('does not import supabase or call models', () => {
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/pinecone/i);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });
});

// ---------------------------------------------------------------------
// Canon hygiene · SentinelInteractionRail.tsx
// ---------------------------------------------------------------------

describe('canon hygiene · SentinelInteractionRail.tsx', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../components/intelligence/SentinelInteractionRail.tsx',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripComments(source);

  it('imports tokens from @/lib/design/abarva-theme', () => {
    expect(codeOnly).toMatch(/from '@\/lib\/design\/abarva-theme'/);
  });

  it('imports the AbarVa AgentBadge primitive', () => {
    expect(codeOnly).toMatch(/from '@\/components\/abarva\/AgentBadge'/);
  });

  it('is a server component (no use client directive)', () => {
    expect(source).not.toMatch(/^['"]use client['"];?\s*$/m);
  });

  it('does not call any React hook', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
    expect(codeOnly).not.toMatch(/\buseMemo\b/);
    expect(codeOnly).not.toMatch(/\buseCallback\b/);
    expect(codeOnly).not.toMatch(/\buseRef\b/);
    expect(codeOnly).not.toMatch(/\buseReducer\b/);
    expect(codeOnly).not.toMatch(/\buseContext\b/);
  });

  it('does not contain raw hex color literals (canon: read tokens only)', () => {
    expect(codeOnly).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('does not contain DM Sans font-family literals', () => {
    expect(codeOnly).not.toMatch(/DM Sans/i);
  });

  it('does not import Sentinel runtime, Atlas, Nexus, or agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import Source UI, legacy /programs, mock.ts, or auth', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
  });
});

// ---------------------------------------------------------------------
// Mount wiring · SentinelPatternDetail.tsx
// ---------------------------------------------------------------------

describe('SentinelPatternDetail · mounts SentinelInteractionRail', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../components/intelligence/SentinelPatternDetail.tsx',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');

  it('imports the rail component and deterministic rail view builder', () => {
    expect(source).toMatch(
      /from '@\/components\/intelligence\/SentinelInteractionRail'/,
    );
    expect(source).toMatch(
      /from '@\/lib\/intelligence\/sentinel-interaction-rail-view'/,
    );
  });

  it('anchors the rail to the current pattern detail view', () => {
    expect(source).toContain('tenantDisplayName: view.tenant.displayName');
    expect(source).toContain('anchorPatternKey: view.patternKey');
    expect(source).toContain('anchorPatternName: view.patternName');
    expect(source).toContain('observedProgramCount: view.affectedProgramRows.length');
  });

  it('mounts the rail after source basis and before Why it matters', () => {
    const sourceBasisIndex = source.indexOf('IntelligenceSourceBasisPanel');
    const railIndex = source.indexOf('<SentinelInteractionRail');
    const whyIndex = source.indexOf('<Block heading="Why it matters">');
    expect(sourceBasisIndex).toBeGreaterThan(-1);
    expect(railIndex).toBeGreaterThan(sourceBasisIndex);
    expect(whyIndex).toBeGreaterThan(railIndex);
  });
});

function stripComments(src: string): string {
  const lineStripped = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  return lineStripped.replace(/\/\*[\s\S]*?\*\//g, '');
}
