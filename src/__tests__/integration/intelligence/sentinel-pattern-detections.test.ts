// I1 · Sentinel Pattern Detection Read Model — integration tests.
//
// Pure deterministic coverage. No React rendering, no DOM, no model /
// API calls. Tests assert that:
// - Every canonical demo tenant produces deterministic detections.
// - Each pattern triggers from the documented signal types.
// - Pattern detections have stable IDs across calls.
// - Summary counts reconcile to the detection list.
// - affectedPrograms route back to canonical program detail routes.
// - No detection claims real evidence citations yet.
// - No detection invents a dollar amount.
// - No detection uses current time / randomness.
// - Module hygiene: the detection module never imports Intelligence
//   UI, Sentinel runtime, Atlas runtime, Nexus runtime, agent runtime,
//   Source UI, legacy /programs routes, mock.ts, auth, or migrations.

import {
  buildSentinelPatternDetectionsForTenant,
  buildSentinelPatternDetectionsFromProgramSignals,
  SENTINEL_PATTERN_KEYS_IN_RANK_ORDER,
  summarizeSentinelPatternDetections,
  type SentinelDetectionConfidence,
  type SentinelPatternDetection,
  type SentinelPatternHandoffTarget,
  type SentinelPatternKey,
  type SentinelPatternSeverity,
} from '@/lib/intelligence/sentinel-pattern-detections';
import {
  buildTenantProgramControlTowerSignals,
  type ProgramControlTowerSignal,
} from '@/lib/programs/programs-control-tower-signals';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import type { TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';

const plan = buildAllProgramsSeedPlan();

const ALL_PATTERN_KEYS: SentinelPatternKey[] = [
  'value_ledger_incompleteness',
  'evidence_chain_gap',
  'gate_governance_gap',
  'program_context_sparsity',
  'ai_governance_operating_model_gap',
];

const ALL_CONFIDENCES: SentinelDetectionConfidence[] = ['low', 'medium', 'high'];

const ALL_SEVERITIES: SentinelPatternSeverity[] = ['low', 'medium', 'high', 'critical'];

const ALL_HANDOFFS: SentinelPatternHandoffTarget[] = [
  'nexus',
  'atlas',
  'steward',
  'sentinel',
];

// ---------------------------------------------------------------------
// Per-tenant detection generation
// ---------------------------------------------------------------------

describe('buildSentinelPatternDetectionsForTenant · canonical demo tenants', () => {
  it.each(plan.tenants.map((t) => [t.tenantKey, t]))(
    'produces a deterministic detection list for %s',
    (_key, tenantParam) => {
      const tenant = tenantParam as TenantSeedPlan;
      if (tenant.programs.length === 0) return;
      const a = buildSentinelPatternDetectionsForTenant(tenant);
      const b = buildSentinelPatternDetectionsForTenant(tenant);
      expect(a).toEqual(b);
    },
  );

  it('every detection carries every required field', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      for (const det of detections) {
        expect(typeof det.id).toBe('string');
        expect(det.id.length).toBeGreaterThan(0);
        expect(det.tenantKey).toBe(tenant.tenantKey);
        expect(det.tenantName).toBe(tenant.displayName);
        expect(ALL_PATTERN_KEYS).toContain(det.patternKey);
        expect(typeof det.patternName).toBe('string');
        expect(ALL_CONFIDENCES).toContain(det.confidence);
        expect(ALL_SEVERITIES).toContain(det.severity);
        expect(typeof det.title).toBe('string');
        expect(det.title.length).toBeGreaterThan(0);
        expect(typeof det.summary).toBe('string');
        expect(det.summary.length).toBeGreaterThan(0);
        expect(typeof det.whyItMatters).toBe('string');
        expect(det.whyItMatters.length).toBeGreaterThan(0);
        expect(Array.isArray(det.affectedPrograms)).toBe(true);
        expect(det.affectedPrograms.length).toBeGreaterThan(0);
        expect(Array.isArray(det.sourceSignalIds)).toBe(true);
        expect(det.sourceSignalIds.length).toBeGreaterThan(0);
        expect(Array.isArray(det.evidenceSignals)).toBe(true);
        expect(det.evidenceSignals.length).toBeGreaterThan(0);
        expect(Array.isArray(det.missingInputs)).toBe(true);
        expect(typeof det.recommendedAction).toBe('string');
        expect(Array.isArray(det.handoffTargets)).toBe(true);
        expect(det.handoffTargets.length).toBeGreaterThan(0);
        for (const h of det.handoffTargets) {
          expect(ALL_HANDOFFS).toContain(h);
        }
        expect(typeof det.routeHref).toBe('string');
        expect(det.createdFrom).toBe('deterministic_seed');
      }
    }
  });

  it('detection IDs are stable and unique per tenant', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      const ids = detections.map((d) => d.id);
      const dedup = new Set(ids);
      expect(dedup.size).toBe(ids.length);
      // Stable id pattern.
      for (const det of detections) {
        expect(det.id).toBe(`sentinel:${tenant.tenantKey}:${det.patternKey}`);
      }
    }
  });

  it('detections sort by severity desc, then confidence desc, then pattern rank', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      const sevRank: Record<SentinelPatternSeverity, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      const confRank: Record<SentinelDetectionConfidence, number> = {
        high: 3,
        medium: 2,
        low: 1,
      };
      for (let i = 1; i < detections.length; i += 1) {
        const prev = detections[i - 1];
        const curr = detections[i];
        const prevSev = sevRank[prev.severity];
        const currSev = sevRank[curr.severity];
        expect(prevSev).toBeGreaterThanOrEqual(currSev);
        if (prevSev === currSev) {
          expect(confRank[prev.confidence]).toBeGreaterThanOrEqual(
            confRank[curr.confidence],
          );
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Pattern-specific detection rules
// ---------------------------------------------------------------------

describe('pattern detection rules', () => {
  function findDetection(
    list: ReadonlyArray<SentinelPatternDetection>,
    key: SentinelPatternKey,
  ): SentinelPatternDetection | undefined {
    return list.find((d) => d.patternKey === key);
  }

  it('value_ledger_incompleteness triggers when value_not_ready signals exist', () => {
    for (const tenant of plan.tenants) {
      const signals = buildTenantProgramControlTowerSignals(tenant);
      const valueSignals = signals.filter((s) => s.type === 'value_not_ready');
      const detections = buildSentinelPatternDetectionsFromProgramSignals(
        tenant,
        signals,
      );
      const det = findDetection(detections, 'value_ledger_incompleteness');
      if (valueSignals.length > 0) {
        expect(det).toBeDefined();
        // Every contributing signal id appears in sourceSignalIds.
        const ids = new Set(det!.sourceSignalIds);
        for (const s of valueSignals) expect(ids.has(s.id)).toBe(true);
      } else {
        expect(det).toBeUndefined();
      }
    }
  });

  it('evidence_chain_gap triggers when evidence_not_ready signals exist', () => {
    for (const tenant of plan.tenants) {
      const signals = buildTenantProgramControlTowerSignals(tenant);
      const evSignals = signals.filter((s) => s.type === 'evidence_not_ready');
      const detections = buildSentinelPatternDetectionsFromProgramSignals(
        tenant,
        signals,
      );
      const det = findDetection(detections, 'evidence_chain_gap');
      if (evSignals.length > 0) {
        expect(det).toBeDefined();
        const ids = new Set(det!.sourceSignalIds);
        for (const s of evSignals) expect(ids.has(s.id)).toBe(true);
      } else {
        expect(det).toBeUndefined();
      }
    }
  });

  it('gate_governance_gap triggers from gate or executive-decision signals', () => {
    for (const tenant of plan.tenants) {
      const signals = buildTenantProgramControlTowerSignals(tenant);
      const govSignals = signals.filter(
        (s) =>
          s.type === 'gate_missing_inputs'
          || s.type === 'executive_decision_needed',
      );
      const detections = buildSentinelPatternDetectionsFromProgramSignals(
        tenant,
        signals,
      );
      const det = findDetection(detections, 'gate_governance_gap');
      if (govSignals.length > 0) {
        expect(det).toBeDefined();
        const ids = new Set(det!.sourceSignalIds);
        for (const s of govSignals) expect(ids.has(s.id)).toBe(true);
      } else {
        expect(det).toBeUndefined();
      }
    }
  });

  it('program_context_sparsity triggers from context or coverage gap signals', () => {
    for (const tenant of plan.tenants) {
      const signals = buildTenantProgramControlTowerSignals(tenant);
      const ctxSignals = signals.filter(
        (s) =>
          s.type === 'context_insufficient'
          || s.type === 'deliverable_coverage_gap',
      );
      const detections = buildSentinelPatternDetectionsFromProgramSignals(
        tenant,
        signals,
      );
      const det = findDetection(detections, 'program_context_sparsity');
      if (ctxSignals.length > 0) {
        expect(det).toBeDefined();
        const ids = new Set(det!.sourceSignalIds);
        for (const s of ctxSignals) expect(ids.has(s.id)).toBe(true);
      } else {
        expect(det).toBeUndefined();
      }
    }
  });

  it('ai_governance_operating_model_gap requires at least 2 programs', () => {
    for (const tenant of plan.tenants) {
      const signals = buildTenantProgramControlTowerSignals(tenant);
      const opSignals = signals.filter(
        (s) =>
          s.type === 'value_not_ready'
          || s.type === 'evidence_not_ready'
          || s.type === 'gate_missing_inputs'
          || s.type === 'executive_decision_needed',
      );
      const distinctPrograms = new Set(opSignals.map((s) => s.programCode)).size;
      const detections = buildSentinelPatternDetectionsFromProgramSignals(
        tenant,
        signals,
      );
      const det = detections.find(
        (d) => d.patternKey === 'ai_governance_operating_model_gap',
      );
      if (distinctPrograms >= 2) {
        expect(det).toBeDefined();
        expect(det!.affectedPrograms.length).toBeGreaterThanOrEqual(2);
      } else {
        expect(det).toBeUndefined();
      }
    }
  });
});

// ---------------------------------------------------------------------
// Confidence calibration
// ---------------------------------------------------------------------

describe('detection confidence calibration', () => {
  it('confidence is high when 3+ programs are affected', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      for (const det of detections) {
        if (det.affectedPrograms.length >= 3) {
          expect(det.confidence).toBe('high');
        }
      }
    }
  });

  it('confidence is medium when 2 programs are affected', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      for (const det of detections) {
        if (det.affectedPrograms.length === 2) {
          expect(det.confidence).toBe('medium');
        }
      }
    }
  });

  it('1-program weak detections cap at low or medium confidence', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      for (const det of detections) {
        if (det.affectedPrograms.length === 1) {
          expect(['low', 'medium']).toContain(det.confidence);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Summary reconciliation
// ---------------------------------------------------------------------

describe('summarizeSentinelPatternDetections', () => {
  it('summary counts reconcile to detection list', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      const summary = summarizeSentinelPatternDetections(detections);
      expect(summary.totalCount).toBe(detections.length);

      const sumByPattern = Object.values(summary.byPattern).reduce(
        (a, b) => a + b,
        0,
      );
      const sumByConfidence = Object.values(summary.byConfidence).reduce(
        (a, b) => a + b,
        0,
      );
      const sumBySeverity = Object.values(summary.bySeverity).reduce(
        (a, b) => a + b,
        0,
      );
      expect(sumByPattern).toBe(detections.length);
      expect(sumByConfidence).toBe(detections.length);
      expect(sumBySeverity).toBe(detections.length);

      // affectedProgramCodes is union of every detection's affected programs.
      const expected = new Set<string>();
      for (const det of detections) {
        for (const ap of det.affectedPrograms) expected.add(ap.programCode);
      }
      expect(new Set(summary.affectedProgramCodes)).toEqual(expected);
      expect(summary.affectedProgramCodes).toEqual(
        Array.from(summary.affectedProgramCodes).slice().sort(),
      );
    }
  });

  it('topConfidence and topSeverity surface the most pressing detection', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      const summary = summarizeSentinelPatternDetections(detections);
      if (detections.length === 0) {
        expect(summary.topConfidence).toBeNull();
        expect(summary.topSeverity).toBeNull();
      } else {
        expect(ALL_CONFIDENCES).toContain(summary.topConfidence!);
        expect(ALL_SEVERITIES).toContain(summary.topSeverity!);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Route + safety invariants
// ---------------------------------------------------------------------

describe('detection safety invariants', () => {
  it('every affectedProgram routeHref points to the canonical tenant program detail', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      for (const det of detections) {
        for (const ap of det.affectedPrograms) {
          expect(ap.routeHref).toMatch(
            new RegExp(`^/tenant/${tenant.routeSlug}/programs/[\\w-]+$`),
          );
        }
      }
    }
  });

  it('detection routeHref points to the future intelligence pattern route', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      for (const det of detections) {
        expect(det.routeHref).toBe(
          `/tenant/${tenant.routeSlug}/intelligence/patterns/${det.patternKey}`,
        );
      }
    }
  });

  it('no detection invents a dollar amount in any string field', () => {
    const dollarPattern = /\$\s?\d[\d,]*(\.\d+)?/;
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      for (const det of detections) {
        const fields = [
          det.title,
          det.summary,
          det.whyItMatters,
          det.recommendedAction,
          det.patternName,
          ...det.missingInputs,
          ...det.affectedPrograms.map((ap) => ap.programName),
          ...det.affectedPrograms.map((ap) => ap.programCode),
        ];
        for (const f of fields) {
          expect(f).not.toMatch(dollarPattern);
        }
      }
    }
  });

  it('no detection claims real evidence citations yet (createdFrom is deterministic_seed)', () => {
    for (const tenant of plan.tenants) {
      const detections = buildSentinelPatternDetectionsForTenant(tenant);
      for (const det of detections) {
        expect(det.createdFrom).toBe('deterministic_seed');
      }
    }
  });

  it('no detection uses current time or randomness (deterministic across calls)', () => {
    for (const tenant of plan.tenants) {
      const a = buildSentinelPatternDetectionsForTenant(tenant);
      const b = buildSentinelPatternDetectionsForTenant(tenant);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      // No detection serialization includes ISO timestamps or epoch ms.
      const isoLike = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      const epochLike = /:1[0-9]{12}\b/;
      const json = JSON.stringify(a);
      expect(json).not.toMatch(isoLike);
      expect(json).not.toMatch(epochLike);
    }
  });

  it('every sourceSignalId appears in the originating signal list', () => {
    for (const tenant of plan.tenants) {
      const signals = buildTenantProgramControlTowerSignals(tenant);
      const known = new Set(signals.map((s) => s.id));
      const detections = buildSentinelPatternDetectionsFromProgramSignals(
        tenant,
        signals,
      );
      for (const det of detections) {
        for (const sid of det.sourceSignalIds) {
          expect(known.has(sid)).toBe(true);
        }
        for (const ev of det.evidenceSignals) {
          expect(known.has(ev.signalId)).toBe(true);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Empty-tenant edge
// ---------------------------------------------------------------------

describe('empty tenant edge', () => {
  it('returns an empty detection list when no signals exist', () => {
    const empty: TenantSeedPlan = {
      tenantKey: 'apexretail',
      routeSlug: 'apex-retail',
      displayName: 'Apex Retail',
      programs: [],
    };
    const detections = buildSentinelPatternDetectionsForTenant(empty);
    expect(detections).toEqual([]);
    const summary = summarizeSentinelPatternDetections(detections);
    expect(summary.totalCount).toBe(0);
    expect(summary.topConfidence).toBeNull();
    expect(summary.topSeverity).toBeNull();
    expect(summary.affectedProgramCodes).toEqual([]);
  });

  it('returns an empty detection list when given an empty signal list', () => {
    const tenant = plan.tenants.find((t) => t.tenantKey === 'apexretail')!;
    const detections = buildSentinelPatternDetectionsFromProgramSignals(
      tenant,
      [] as ReadonlyArray<ProgramControlTowerSignal>,
    );
    expect(detections).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// Pattern key rank list parity
// ---------------------------------------------------------------------

describe('SENTINEL_PATTERN_KEYS_IN_RANK_ORDER', () => {
  it('matches the canonical pattern key set', () => {
    expect(new Set(SENTINEL_PATTERN_KEYS_IN_RANK_ORDER)).toEqual(new Set(ALL_PATTERN_KEYS));
    expect(SENTINEL_PATTERN_KEYS_IN_RANK_ORDER.length).toBe(ALL_PATTERN_KEYS.length);
  });

  it('begins with the meta operating-model pattern', () => {
    expect(SENTINEL_PATTERN_KEYS_IN_RANK_ORDER[0]).toBe(
      'ai_governance_operating_model_gap',
    );
  });
});

// ---------------------------------------------------------------------
// Module hygiene — static source check
// ---------------------------------------------------------------------

describe('module hygiene · sentinel-pattern-detections.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/intelligence/sentinel-pattern-detections.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  // Strip line + block comments so hygiene assertions fire on real
  // code only (the file's own header comment honestly references
  // Date.now / model names as forbidden).
  const codeOnly = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');

  it('imports only from the S9e read model and the seed planner', () => {
    expect(source).toMatch(
      /from '@\/lib\/programs\/programs-control-tower-signals'/,
    );
    expect(source).toMatch(/from '@\/lib\/programs\/enhancement-seed-planner'/);
  });

  it('does not import Intelligence UI', () => {
    expect(codeOnly).not.toMatch(/from '@\/components\/intelligence\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/intelligence\//);
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

  it('does not import auth or migrations', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now or Math.random', () => {
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
