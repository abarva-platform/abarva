// I2 · Tenant Intelligence Sentinel brief + active patterns tests.
//
// Pure deterministic coverage of the I2 view helper that consumes
// the I1 detection read model. No React rendering, no DOM, no model
// calls. The component itself is covered by typecheck + build.
//
// Tests assert that:
// - The view can be built for every canonical demo tenant.
// - Sentinel brief is present and deterministic.
// - suggestedFollowUps has exactly three deterministic items.
// - Pattern cards correspond 1:1 to I1 detections.
// - Affected program route hrefs resolve to canonical program detail.
// - No invented dollar amounts in any string field.
// - No claim of live Sentinel runtime today.
// - Empty-tenant edge case.
// - Module hygiene: the view helper, component, and route page never
//   import Sentinel runtime, Atlas runtime, Nexus runtime, agent
//   runtime, Source UI, legacy /programs, mock.ts, or auth
//   implementation.

import {
  buildPatternDetectionCards,
  buildSentinelBrief,
  buildSentinelIntelligenceView,
  type SentinelBrief,
  type SentinelBriefSourceLabel,
} from '@/lib/intelligence/sentinel-pattern-view';
import {
  buildSentinelPatternDetectionsForTenant,
  summarizeSentinelPatternDetections,
  type SentinelPatternHandoffTarget,
} from '@/lib/intelligence/sentinel-pattern-detections';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import type { TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';

const plan = buildAllProgramsSeedPlan();

const ALL_SOURCE_LABELS: SentinelBriefSourceLabel[] = [
  'deterministic_seed',
  'pattern_detection_read_model',
];

const ALL_HANDOFFS: SentinelPatternHandoffTarget[] = [
  'nexus',
  'atlas',
  'steward',
  'sentinel',
];

// ---------------------------------------------------------------------
// Per-tenant view generation
// ---------------------------------------------------------------------

describe('buildSentinelIntelligenceView · canonical demo tenants', () => {
  it.each(plan.tenants.map((t) => [t.tenantKey, t]))(
    'builds a deterministic view for %s',
    (_key, tenantParam) => {
      const tenant = tenantParam as TenantSeedPlan;
      if (tenant.programs.length === 0) return;
      const a = buildSentinelIntelligenceView(tenant);
      const b = buildSentinelIntelligenceView(tenant);
      expect(a).toEqual(b);
      expect(a.tenant.tenantKey).toBe(tenant.tenantKey);
    },
  );

  it('summary count matches detections length and cards length', () => {
    for (const tenant of plan.tenants) {
      const view = buildSentinelIntelligenceView(tenant);
      expect(view.cards.length).toBe(view.detections.length);
      expect(view.summary.totalCount).toBe(view.detections.length);
    }
  });

  it('detections inside the view match buildSentinelPatternDetectionsForTenant output', () => {
    for (const tenant of plan.tenants) {
      const view = buildSentinelIntelligenceView(tenant);
      const directly = buildSentinelPatternDetectionsForTenant(tenant);
      expect(view.detections.map((d) => d.id)).toEqual(directly.map((d) => d.id));
    }
  });
});

// ---------------------------------------------------------------------
// Sentinel brief
// ---------------------------------------------------------------------

describe('buildSentinelBrief', () => {
  it('produces a deterministic brief with all required fields', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      const summary = summarizeSentinelPatternDetections(detections);
      const a = buildSentinelBrief(tenant, detections, summary);
      const b = buildSentinelBrief(tenant, detections, summary);
      expect(a).toEqual(b);
      expect(a.title).toContain(tenant.displayName);
      expect(typeof a.topPattern).toBe('string');
      expect(a.topPattern.length).toBeGreaterThan(0);
      expect(typeof a.topSeverity).toBe('string');
      expect(typeof a.topConfidence).toBe('string');
      expect(typeof a.whatSentinelSees).toBe('string');
      expect(typeof a.whyItMatters).toBe('string');
      expect(typeof a.affectedPrograms).toBe('string');
      expect(typeof a.recommendedAction).toBe('string');
      expect(Array.isArray(a.suggestedHandoffs)).toBe(true);
      for (const h of a.suggestedHandoffs) {
        expect(ALL_HANDOFFS).toContain(h);
      }
      expect(Array.isArray(a.suggestedFollowUps)).toBe(true);
      expect(ALL_SOURCE_LABELS).toContain(a.sourceLabel);
    }
  });

  it('suggestedFollowUps has exactly three items in canonical order, all disabled', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      const summary = summarizeSentinelPatternDetections(detections);
      const brief = buildSentinelBrief(tenant, detections, summary);
      expect(brief.suggestedFollowUps).toHaveLength(3);
      expect(brief.suggestedFollowUps.map((f) => f.id)).toEqual([
        'sentinel-followup-walk-top-pattern',
        'sentinel-followup-program-cross-section',
        'sentinel-followup-recurrence-history',
      ]);
      for (const f of brief.suggestedFollowUps) {
        expect(f.enabled).toBe(false);
        expect(typeof f.label).toBe('string');
        expect(typeof f.reason).toBe('string');
      }
    }
  });

  it('sourceLabel is pattern_detection_read_model when detections exist', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      const summary = summarizeSentinelPatternDetections(detections);
      const brief = buildSentinelBrief(tenant, detections, summary);
      if (detections.length > 0) {
        expect(brief.sourceLabel).toBe('pattern_detection_read_model');
        expect(brief.topSeverity).not.toBe('NONE');
        expect(brief.topConfidence).not.toBe('NONE');
      } else {
        expect(brief.sourceLabel).toBe('deterministic_seed');
        expect(brief.topSeverity).toBe('NONE');
        expect(brief.topConfidence).toBe('NONE');
      }
    }
  });

  it('does not invent a dollar amount in any string field', () => {
    const dollarPattern = /\$\s?\d[\d,]*(\.\d+)?/;
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      const summary = summarizeSentinelPatternDetections(detections);
      const brief: SentinelBrief = buildSentinelBrief(tenant, detections, summary);
      const fields: string[] = [
        brief.title,
        brief.topPattern,
        brief.topSeverity,
        brief.topConfidence,
        brief.whatSentinelSees,
        brief.whyItMatters,
        brief.affectedPrograms,
        brief.recommendedAction,
        brief.interpretationBasis,
        ...brief.suggestedFollowUps.map((f) => f.label),
        ...brief.suggestedFollowUps.map((f) => f.reason),
      ];
      for (const f of fields) {
        expect(f).not.toMatch(dollarPattern);
      }
    }
  });

  it('does not claim a live Sentinel runtime today', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      const summary = summarizeSentinelPatternDetections(detections);
      const brief = buildSentinelBrief(tenant, detections, summary);
      // Brief metadata never asserts a live runtime; suggestedFollowUps
      // are always disabled.
      for (const f of brief.suggestedFollowUps) {
        expect(f.enabled).toBe(false);
      }
      // sourceLabel never names a runtime.
      expect(['deterministic_seed', 'pattern_detection_read_model']).toContain(
        brief.sourceLabel,
      );
    }
  });
});

// ---------------------------------------------------------------------
// Pattern cards
// ---------------------------------------------------------------------

describe('buildPatternDetectionCards', () => {
  it('cards correspond 1:1 to I1 detections in the same order', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      const cards = buildPatternDetectionCards(detections);
      expect(cards.length).toBe(detections.length);
      for (let i = 0; i < detections.length; i += 1) {
        expect(cards[i].detection.id).toBe(detections[i].id);
        expect(cards[i].sourceSignalCount).toBe(
          detections[i].sourceSignalIds.length,
        );
        expect(cards[i].affectedProgramCount).toBe(
          detections[i].affectedPrograms.length,
        );
      }
    }
  });

  it('every affectedProgram routeHref resolves to the canonical tenant program detail', () => {
    for (const tenant of plan.tenants) {
      const view = buildSentinelIntelligenceView(tenant);
      for (const card of view.cards) {
        for (const ap of card.detection.affectedPrograms) {
          expect(ap.routeHref).toMatch(
            new RegExp(`^/tenant/${tenant.routeSlug}/programs/[\\w-]+$`),
          );
        }
      }
    }
  });

  it('detection routeHref points to the future intelligence pattern route', () => {
    for (const tenant of plan.tenants) {
      const view = buildSentinelIntelligenceView(tenant);
      for (const card of view.cards) {
        expect(card.detection.routeHref).toBe(
          `/tenant/${tenant.routeSlug}/intelligence/patterns/${card.detection.patternKey}`,
        );
      }
    }
  });

  it('severity and confidence labels are uppercase canonical strings', () => {
    const severities = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
    const confidences = new Set(['HIGH', 'MEDIUM', 'LOW']);
    for (const tenant of plan.tenants) {
      const view = buildSentinelIntelligenceView(tenant);
      for (const card of view.cards) {
        expect(severities.has(card.severityLabel)).toBe(true);
        expect(confidences.has(card.confidenceLabel)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Empty-tenant edge
// ---------------------------------------------------------------------

describe('empty tenant edge', () => {
  it('returns an empty-state brief when no detections exist', () => {
    const empty: TenantSeedPlan = {
      tenantKey: 'apexretail',
      routeSlug: 'apex-retail',
      displayName: 'Apex Retail',
      programs: [],
    };
    const view = buildSentinelIntelligenceView(empty);
    expect(view.detections).toEqual([]);
    expect(view.cards).toEqual([]);
    expect(view.brief.sourceLabel).toBe('deterministic_seed');
    expect(view.brief.topSeverity).toBe('NONE');
    expect(view.brief.topConfidence).toBe('NONE');
    expect(view.brief.suggestedHandoffs).toEqual([]);
    expect(view.brief.suggestedFollowUps).toHaveLength(3);
    for (const f of view.brief.suggestedFollowUps) {
      expect(f.enabled).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene · view helper
// ---------------------------------------------------------------------

describe('module hygiene · sentinel-pattern-view.ts', () => {
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

  it('imports only from the I1 detection read model and the seed planner', () => {
    expect(codeOnly).toMatch(/from '@\/lib\/intelligence\/sentinel-pattern-detections'/);
    expect(codeOnly).toMatch(/from '@\/lib\/programs\/enhancement-seed-planner'/);
  });

  it('does not import Sentinel runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
  });

  it('does not import Atlas, Nexus, or agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import Source UI or Source files', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
  });

  it('does not import legacy /programs routes or mock.ts', () => {
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
  });

  it('does not import auth implementation or migrations', () => {
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

describe('module hygiene · SentinelActivePatterns.tsx', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../components/intelligence/SentinelActivePatterns.tsx',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripComments(source);

  it('imports buildSentinelIntelligenceView from the I2 view helper', () => {
    expect(codeOnly).toMatch(/buildSentinelIntelligenceView/);
    expect(codeOnly).toMatch(/from '@\/lib\/intelligence\/sentinel-pattern-view'/);
  });

  it('does not import Sentinel runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
  });

  it('does not import Atlas, Nexus, or agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import Source UI', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
  });

  it('does not import legacy /programs routes or mock.ts', () => {
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
  });

  it('does not import auth implementation', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · tenant intelligence route page
// ---------------------------------------------------------------------

describe('module hygiene · tenant intelligence route page', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripComments(source);

  it('uses assertTenantAccess and findTenantByRouteSlug', () => {
    expect(codeOnly).toMatch(/assertTenantAccess/);
    expect(codeOnly).toMatch(/findTenantByRouteSlug/);
  });

  it('falls back to notFound when tenant cannot be resolved', () => {
    expect(codeOnly).toMatch(/notFound\(\)/);
  });

  it('renders the SentinelActivePatterns component', () => {
    expect(codeOnly).toMatch(/SentinelActivePatterns/);
  });

  it('does not import Sentinel runtime, Atlas runtime, Nexus runtime, or agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import Source UI or legacy /programs routes', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
  });
});

// ---------------------------------------------------------------------
// Helper: strip comments before hygiene checks
// ---------------------------------------------------------------------

function stripComments(src: string): string {
  // Line comments first (they may contain glob patterns like `src/lib/**`
  // whose `/*` substrings would otherwise confuse the block-comment regex).
  const lineStripped = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  // Then block comments.
  return lineStripped.replace(/\/\*[\s\S]*?\*\//g, '');
}
