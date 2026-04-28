// I3 · Sentinel pattern detail / evidence trail tests.
//
// Pure deterministic coverage of the I3 view helper that produces the
// tenant pattern detail surface. No React rendering, no DOM, no model
// calls. The component itself is covered by typecheck + build.

import {
  buildPatternAffectedProgramRows,
  buildPatternEvidenceTrail,
  buildPatternHandoffRows,
  buildSentinelPatternDetailView,
  isSentinelPatternKey,
  type SentinelPatternDetailView,
} from '@/lib/intelligence/sentinel-pattern-view';
import {
  buildSentinelPatternDetectionsForTenant,
  SENTINEL_PATTERN_KEYS_IN_RANK_ORDER,
  type SentinelPatternHandoffTarget,
} from '@/lib/intelligence/sentinel-pattern-detections';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import type { TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';

const plan = buildAllProgramsSeedPlan();

const ALL_HANDOFFS: SentinelPatternHandoffTarget[] = [
  'nexus',
  'atlas',
  'steward',
  'sentinel',
];

function detectedView(tenant: TenantSeedPlan): SentinelPatternDetailView | null {
  const detections = buildSentinelPatternDetectionsForTenant(tenant);
  if (detections.length === 0) return null;
  const top = detections[0];
  return buildSentinelPatternDetailView(tenant, top.patternKey);
}

// ---------------------------------------------------------------------
// isSentinelPatternKey type guard
// ---------------------------------------------------------------------

describe('isSentinelPatternKey', () => {
  it('accepts every canonical pattern key', () => {
    for (const key of SENTINEL_PATTERN_KEYS_IN_RANK_ORDER) {
      expect(isSentinelPatternKey(key)).toBe(true);
    }
  });

  it('rejects unknown pattern keys', () => {
    expect(isSentinelPatternKey('not-a-real-pattern')).toBe(false);
    expect(isSentinelPatternKey('value_not_ready')).toBe(false); // signal type, not pattern
    expect(isSentinelPatternKey('')).toBe(false);
  });
});

// ---------------------------------------------------------------------
// Detail view builds for at least one detected pattern per canonical tenant
// ---------------------------------------------------------------------

describe('buildSentinelPatternDetailView · canonical demo tenants', () => {
  it.each(plan.tenants.map((t) => [t.tenantKey, t]))(
    'builds a deterministic detail view for the top detection of %s',
    (_key, tenantParam) => {
      const tenant = tenantParam as TenantSeedPlan;
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      if (detections.length === 0) return;
      const top = detections[0];
      const a = buildSentinelPatternDetailView(tenant, top.patternKey);
      const b = buildSentinelPatternDetailView(tenant, top.patternKey);
      expect(a).not.toBeNull();
      expect(b).not.toBeNull();
      expect(a).toEqual(b);
      expect(a!.patternKey).toBe(top.patternKey);
      expect(a!.tenant.tenantKey).toBe(tenant.tenantKey);
    },
  );

  it('every detail field is populated for a real detection', () => {
    for (const tenant of plan.tenants) {
      const view = detectedView(tenant);
      if (!view) continue;
      expect(typeof view.title).toBe('string');
      expect(view.title.length).toBeGreaterThan(0);
      expect(typeof view.summary).toBe('string');
      expect(typeof view.whyItMatters).toBe('string');
      expect(typeof view.recommendedAction).toBe('string');
      expect(view.affectedPrograms.length).toBeGreaterThan(0);
      expect(view.affectedProgramRows.length).toBe(view.affectedPrograms.length);
      expect(view.sourceSignalIds.length).toBeGreaterThan(0);
      expect(view.evidenceTrail.length).toBeGreaterThan(0);
      expect(view.handoffTargets.length).toBeGreaterThan(0);
      expect(view.handoffRows.length).toBe(view.handoffTargets.length);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(view.confidenceLabel);
      expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(view.severityLabel);
      expect(view.sourceLabel).toBe('pattern_detection_read_model');
      expect(view.citationReadinessLabel).toBe('not_yet_wired');
      expect(view.citationReadinessCaption.toLowerCase()).toContain('citations are not yet wired');
      expect(view.intelligenceLandingHref).toBe(
        `/tenant/${tenant.routeSlug}/intelligence`,
      );
    }
  });
});

// ---------------------------------------------------------------------
// Unknown key returns null
// ---------------------------------------------------------------------

describe('unknown pattern key', () => {
  it('returns null for an unknown patternKey', () => {
    const tenant = plan.tenants[0];
    const view = buildSentinelPatternDetailView(tenant, 'not-a-real-pattern');
    expect(view).toBeNull();
  });

  it('returns null for a known patternKey with no detection on this tenant', () => {
    // Pick a tenant + pattern combination that does not detect.
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      const detectedKeys = new Set(detections.map((d) => d.patternKey));
      const undetected = SENTINEL_PATTERN_KEYS_IN_RANK_ORDER.find(
        (k) => !detectedKeys.has(k),
      );
      if (undetected) {
        expect(buildSentinelPatternDetailView(tenant, undetected)).toBeNull();
      }
    }
  });
});

// ---------------------------------------------------------------------
// Affected programs route to canonical tenant program detail
// ---------------------------------------------------------------------

describe('affected program route invariants', () => {
  it('every affectedProgramRow routeHref points to canonical tenant programs detail', () => {
    for (const tenant of plan.tenants) {
      const view = detectedView(tenant);
      if (!view) continue;
      for (const row of view.affectedProgramRows) {
        expect(row.routeHref).toMatch(
          new RegExp(`^/tenant/${tenant.routeSlug}/programs/[\\w-]+$`),
        );
      }
    }
  });
});

// ---------------------------------------------------------------------
// Evidence trail traces back to I1 source signal IDs
// ---------------------------------------------------------------------

describe('evidence trail traceability', () => {
  it('every evidenceTrail row signalId appears in detection.sourceSignalIds', () => {
    for (const tenant of plan.tenants) {
      const view = detectedView(tenant);
      if (!view) continue;
      const known = new Set(view.sourceSignalIds);
      for (const row of view.evidenceTrail) {
        expect(known.has(row.signalId)).toBe(true);
        expect(row.routeHref).toMatch(
          new RegExp(`^/tenant/${tenant.routeSlug}/programs/[\\w-]+$`),
        );
      }
    }
  });

  it('every evidence row carries citationStatus not_yet_wired today', () => {
    for (const tenant of plan.tenants) {
      const view = detectedView(tenant);
      if (!view) continue;
      for (const row of view.evidenceTrail) {
        expect(row.citationStatus).toBe('not_yet_wired');
        expect(row.citationCaption.toLowerCase()).toContain(
          'evidence citations not yet wired',
        );
      }
    }
  });

  it('buildPatternEvidenceTrail directly returns the same rows', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      if (detections.length === 0) continue;
      const top = detections[0];
      const trail = buildPatternEvidenceTrail(top);
      expect(trail.length).toBe(top.evidenceSignals.length);
      for (let i = 0; i < trail.length; i += 1) {
        expect(trail[i].signalId).toBe(top.evidenceSignals[i].signalId);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Missing inputs surfaced
// ---------------------------------------------------------------------

describe('missing inputs', () => {
  it('view.missingInputs equals detection.missingInputs', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      if (detections.length === 0) continue;
      const top = detections[0];
      const view = buildSentinelPatternDetailView(tenant, top.patternKey);
      expect(view).not.toBeNull();
      expect(view!.missingInputs).toEqual(top.missingInputs);
    }
  });
});

// ---------------------------------------------------------------------
// Handoff rows
// ---------------------------------------------------------------------

describe('buildPatternHandoffRows', () => {
  it('produces one row per handoff target with a non-empty reason', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      if (detections.length === 0) continue;
      const top = detections[0];
      const rows = buildPatternHandoffRows(top);
      expect(rows.length).toBe(top.handoffTargets.length);
      for (const row of rows) {
        expect(ALL_HANDOFFS).toContain(row.target);
        expect(row.reason.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Affected program rows
// ---------------------------------------------------------------------

describe('buildPatternAffectedProgramRows', () => {
  it('returns the same rows as detection.affectedPrograms', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      if (detections.length === 0) continue;
      for (const det of detections) {
        const rows = buildPatternAffectedProgramRows(det);
        expect(rows).toEqual(det.affectedPrograms);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Citation / evidence gap honesty
// ---------------------------------------------------------------------

describe('citation gap honesty', () => {
  it('detail view never claims a wired citation today', () => {
    for (const tenant of plan.tenants) {
      const view = detectedView(tenant);
      if (!view) continue;
      expect(view.citationReadinessLabel).toBe('not_yet_wired');
      for (const row of view.evidenceTrail) {
        expect(row.citationStatus).toBe('not_yet_wired');
      }
    }
  });

  it('does not invent a dollar amount in any string field', () => {
    const dollarPattern = /\$\s?\d[\d,]*(\.\d+)?/;
    for (const tenant of plan.tenants) {
      const view = detectedView(tenant);
      if (!view) continue;
      const fields = [
        view.title,
        view.summary,
        view.whyItMatters,
        view.recommendedAction,
        view.patternName,
        view.citationReadinessCaption,
        view.interpretationBasis,
        ...view.missingInputs,
        ...view.affectedProgramRows.map((r) => r.programName),
        ...view.affectedProgramRows.map((r) => r.programCode),
        ...view.evidenceTrail.map((r) => r.citationCaption),
        ...view.handoffRows.map((r) => r.reason),
      ];
      for (const f of fields) {
        expect(f).not.toMatch(dollarPattern);
      }
    }
  });

  it('does not claim live Sentinel runtime', () => {
    for (const tenant of plan.tenants) {
      const view = detectedView(tenant);
      if (!view) continue;
      expect(['deterministic_seed', 'pattern_detection_read_model']).toContain(
        view.sourceLabel,
      );
      // The view never carries a "live runtime" marker.
      expect(JSON.stringify(view).toLowerCase()).not.toContain('live_runtime');
    }
  });
});

// ---------------------------------------------------------------------
// Route path helper matches I2 detection routeHref
// ---------------------------------------------------------------------

describe('route path parity with I2 detection routeHref', () => {
  it('detail view round-trips the route path used by I2 detection cards', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      for (const det of detections) {
        // Reconstruct the route the I2 component would link to.
        const expectedRoute = `/tenant/${tenant.routeSlug}/intelligence/patterns/${det.patternKey}`;
        expect(det.routeHref).toBe(expectedRoute);
        // Building the detail view from that key should yield a valid view.
        const view = buildSentinelPatternDetailView(tenant, det.patternKey);
        expect(view).not.toBeNull();
        expect(view!.patternKey).toBe(det.patternKey);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene · view helper (extension)
// ---------------------------------------------------------------------

describe('module hygiene · sentinel-pattern-view.ts (I3 extension)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/intelligence/sentinel-pattern-view.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripComments(source);

  it('exports the new I3 helpers', () => {
    expect(codeOnly).toMatch(/export function buildSentinelPatternDetailView/);
    expect(codeOnly).toMatch(/export function buildPatternEvidenceTrail/);
    expect(codeOnly).toMatch(/export function buildPatternAffectedProgramRows/);
    expect(codeOnly).toMatch(/export function buildPatternHandoffRows/);
    expect(codeOnly).toMatch(/export function isSentinelPatternKey/);
  });

  it('still imports only from the I1 detection module and the seed planner', () => {
    expect(codeOnly).toMatch(
      /from '@\/lib\/intelligence\/sentinel-pattern-detections'/,
    );
    expect(codeOnly).toMatch(/from '@\/lib\/programs\/enhancement-seed-planner'/);
  });

  it('does not import Sentinel runtime, Atlas runtime, Nexus runtime, agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import Source UI, legacy /programs routes, mock.ts, auth, or supabase', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now or Math.random or new Date', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
  });

  it('does not invoke Claude / OpenAI / Pinecone runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/pinecone/i);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · component
// ---------------------------------------------------------------------

describe('module hygiene · SentinelPatternDetail.tsx', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../components/intelligence/SentinelPatternDetail.tsx',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripComments(source);

  it('imports the I3 view types', () => {
    expect(codeOnly).toMatch(/SentinelPatternDetailView/);
    expect(codeOnly).toMatch(/from '@\/lib\/intelligence\/sentinel-pattern-view'/);
  });

  it('does not import Sentinel runtime, Atlas, Nexus, or agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import Source UI, legacy /programs routes, mock.ts, or auth', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · route page
// ---------------------------------------------------------------------

describe('module hygiene · pattern detail route page', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../app/(maestro)/tenant/[tenantSlug]/intelligence/patterns/[patternKey]/page.tsx',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripComments(source);

  it('uses assertTenantAccess and findTenantByRouteSlug', () => {
    expect(codeOnly).toMatch(/assertTenantAccess/);
    expect(codeOnly).toMatch(/findTenantByRouteSlug/);
  });

  it('falls back to notFound when tenant or detection is missing', () => {
    expect(codeOnly).toMatch(/notFound\(\)/);
  });

  it('renders the SentinelPatternDetail component for canonical pattern keys', () => {
    expect(codeOnly).toMatch(/SentinelPatternDetail/);
    expect(codeOnly).toMatch(/isSentinelPatternKey/);
  });

  it('does not import Sentinel runtime, Atlas runtime, Nexus runtime, or agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });
});

// ---------------------------------------------------------------------
// Helper: strip comments before hygiene checks
// ---------------------------------------------------------------------

function stripComments(src: string): string {
  // Line comments first; they may contain `**` glob markers whose `/*`
  // substrings would otherwise confuse the block-comment regex.
  const lineStripped = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  return lineStripped.replace(/\/\*[\s\S]*?\*\//g, '');
}
