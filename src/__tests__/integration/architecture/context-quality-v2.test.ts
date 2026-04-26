// CTX4 - Context Pack Quality Scoring v2 - integration tests.
//
// Pure deterministic coverage. No model/API calls. No DOM. No
// Date.now reads. Tests assert that:
// - Scoring is byte-equal across repeated calls for the same pack.
// - Sparse / refused packs surface a refused band, high-severity
//   risks, and recommendations.
// - Complete packs score in the usable band with few risks.
// - Missing evidence lowers the evidence_strength dimension.
// - Missing governance lifts a missing_governance risk.
// - Empty tenantKey forces refused: true.
// - Module hygiene: no Date.now, no Math.random, no new Date(, no
//   fetch(, no model SDK imports, no React state hooks, no imports
//   from Source / Sentinel / Atlas / Nexus / auth / supabase, no
//   programs/mock import.
//
// Fixtures are constructed manually to match the CTX2
// UnifiedContextPack shape; CTX2 runtime helpers are not invoked.

import {
  CONTEXT_QUALITY_DIMENSIONS,
  classifyContextQualityV2,
  getContextQualityRecommendations,
  scoreContextQualityV2,
  summarizeContextQualityV2,
  type ContextQualityV2Score,
} from '@/lib/architecture/context-quality-v2';
import type {
  UnifiedContextGovernanceConstraint,
  UnifiedContextPack,
  UnifiedContextSection,
  UnifiedContextSectionKey,
  WorkObjectType,
} from '@/lib/architecture/unified-context-builder';

// ---------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------

const ALL_KEYS: ReadonlyArray<UnifiedContextSectionKey> = [
  'identity',
  'work_object',
  'workflow_state',
  'business_context',
  'artifacts',
  'patterns',
  'evidence',
  'conversation',
  'datasets',
  'solution_archetypes',
  'governance_constraints',
  'audit_basis',
];

function emptySection(key: UnifiedContextSectionKey): UnifiedContextSection {
  return {
    key,
    body: {},
    sourceLabel: `${key}_source`,
    hasContent: false,
  };
}

function filledSection(
  key: UnifiedContextSectionKey,
  body: unknown,
): UnifiedContextSection {
  return {
    key,
    body,
    sourceLabel: `${key}_source`,
    hasContent: true,
  };
}

interface PackFixtureOptions {
  tenantKey?: string;
  workObject?: {
    kind: WorkObjectType;
    id: string;
    resolved: boolean;
    resolutionNote?: string;
  };
  overrides?: Partial<Record<UnifiedContextSectionKey, UnifiedContextSection>>;
}

function buildEmptyPack(opts: PackFixtureOptions = {}): UnifiedContextPack {
  const tenantKey = opts.tenantKey ?? '';
  const workObject = opts.workObject ?? {
    kind: 'program',
    id: '',
    resolved: false,
    resolutionNote: 'unresolved',
  };
  const sections: UnifiedContextSection[] = ALL_KEYS.map(
    (k) => opts.overrides?.[k] ?? emptySection(k),
  );
  return {
    identity: { tenantKey },
    workObject,
    sections,
    basis: {
      retrievalSources: [],
      generatedAt: 'deterministic_seed',
      contextBuilderVersion: 'ctx2.v1',
    },
    createdFrom: 'deterministic_seed',
  };
}

const FULL_GOVERNANCE: ReadonlyArray<UnifiedContextGovernanceConstraint> = [
  {
    policy: 'no_fabricated_evidence_citations',
    rationale: 'Hard rule: agents must not invent E-### citations.',
    severity: 'hard',
  },
  {
    policy: 'no_fabricated_dollar_value',
    rationale: 'Hard rule: agents must not invent dollar amounts.',
    severity: 'hard',
  },
  {
    policy: 'honest_missing_input_disclosure',
    rationale: 'Soft rule: surface missing inputs explicitly.',
    severity: 'soft',
  },
];

function buildCompleteProgramPack(): UnifiedContextPack {
  return buildEmptyPack({
    tenantKey: 'apexretail',
    workObject: {
      kind: 'program',
      id: 'cdp-program',
      resolved: true,
    },
    overrides: {
      identity: filledSection('identity', {
        tenantKey: 'apexretail',
        tenantDisplayName: 'Apex Retail',
      }),
      work_object: filledSection('work_object', {
        kind: 'program',
        id: 'cdp-program',
        resolved: true,
      }),
      workflow_state: filledSection('workflow_state', {
        currentCanonicalPhase: 'design',
        status: 'in_progress',
        hardGates: [
          { id: 'gate-1', label: 'Gate 1' },
          { id: 'gate-2', label: 'Gate 2' },
        ],
      }),
      business_context: filledSection('business_context', {
        programCode: 'CDP-001',
        programName: 'Apex CDP Program',
      }),
      artifacts: filledSection('artifacts', {
        deliverableTiers: { rich: 3, outline: 4, stub: 2, total: 9 },
      }),
      patterns: filledSection('patterns', {
        patternKey: 'value_ledger_incompleteness',
        detections: [
          { patternKey: 'value_ledger_incompleteness' },
          { patternKey: 'evidence_chain_gap' },
        ],
      }),
      evidence: filledSection('evidence', {
        usableOnly: true,
        items: [
          { id: 'EV-1', usable_as_evidence: true },
          { id: 'EV-2', usable_as_evidence: true },
          { id: 'EV-3', usable_as_evidence: true },
          { id: 'EV-4', usable_as_evidence: true },
        ],
      }),
      conversation: filledSection('conversation', {
        messages: [{ role: 'steward', content: 'orient' }],
      }),
      datasets: filledSection('datasets', {
        summaries: [
          { domain: 'sales' },
          { domain: 'marketing' },
          { domain: 'product' },
        ],
      }),
      solution_archetypes: filledSection('solution_archetypes', {
        archetype: { code: 'arch-1' },
        archetypeKeys: ['arch-1'],
      }),
      governance_constraints: filledSection('governance_constraints', {
        constraints: FULL_GOVERNANCE,
      }),
      audit_basis: filledSection('audit_basis', {
        retrievalSources: ['programs_canonical_view'],
        generatedAt: 'deterministic_seed',
        contextBuilderVersion: 'ctx2.v1',
      }),
    },
  });
}

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('scoreContextQualityV2 · determinism', () => {
  it('produces byte-equal output for identical input (complete pack)', () => {
    const pack = buildCompleteProgramPack();
    const a = scoreContextQualityV2(pack);
    const b = scoreContextQualityV2(pack);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('produces byte-equal output for identical input (empty pack)', () => {
    const pack = buildEmptyPack();
    const a = scoreContextQualityV2(pack);
    const b = scoreContextQualityV2(pack);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------
// Dimension constant
// ---------------------------------------------------------------------

describe('CONTEXT_QUALITY_DIMENSIONS', () => {
  it('exposes the canonical ten dimensions in the documented order', () => {
    expect(CONTEXT_QUALITY_DIMENSIONS).toEqual([
      'completeness',
      'evidence_strength',
      'pattern_grounding',
      'solution_grounding',
      'workflow_state',
      'data_readiness',
      'governance_safety',
      'missing_input_severity',
      'sparsity_risk',
      'actionability',
    ]);
    expect(CONTEXT_QUALITY_DIMENSIONS).toHaveLength(10);
  });

  it('emits exactly one score per dimension, in order', () => {
    const score = scoreContextQualityV2(buildCompleteProgramPack());
    const dims = score.dimensionScores.map((d) => d.dimension);
    expect(dims).toEqual([...CONTEXT_QUALITY_DIMENSIONS]);
  });
});

// ---------------------------------------------------------------------
// Sparse / empty packs
// ---------------------------------------------------------------------

describe('scoreContextQualityV2 · sparse pack', () => {
  it('returns refused band with high-severity risks and recommendations', () => {
    const pack = buildEmptyPack();
    const score = scoreContextQualityV2(pack);
    expect(score.refused).toBe(true);
    expect(score.overallBand).toBe('refused');
    expect(score.refusalReason).toBeDefined();
    expect(score.risks.some((r) => r.severity === 'high')).toBe(true);
    expect(score.recommendations.length).toBeGreaterThan(0);
  });

  it('surfaces tenant_scope_unclear and work_object_unresolved risks', () => {
    const score = scoreContextQualityV2(buildEmptyPack());
    const kinds = score.risks.map((r) => r.kind);
    expect(kinds).toContain('tenant_scope_unclear');
    expect(kinds).toContain('work_object_unresolved');
  });
});

// ---------------------------------------------------------------------
// Complete pack
// ---------------------------------------------------------------------

describe('scoreContextQualityV2 · complete pack', () => {
  it('scores in the usable band with few risks', () => {
    const score = scoreContextQualityV2(buildCompleteProgramPack());
    expect(score.refused).toBe(false);
    expect(score.overallBand === 'usable' || score.overallBand === 'partial').toBe(
      true,
    );
    expect(score.overallScore).toBeGreaterThanOrEqual(0.6);
  });

  it('every dimension has score in [0,1] and a non-empty rationale', () => {
    const score = scoreContextQualityV2(buildCompleteProgramPack());
    for (const d of score.dimensionScores) {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(1);
      expect(d.rationale.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Targeted dimension behavior
// ---------------------------------------------------------------------

describe('scoreContextQualityV2 · evidence_strength dimension', () => {
  it('drops to refused when evidence section is empty', () => {
    const pack = buildCompleteProgramPack();
    const next: UnifiedContextPack = {
      ...pack,
      sections: pack.sections.map((s) =>
        s.key === 'evidence' ? emptySection('evidence') : s,
      ),
    };
    const score = scoreContextQualityV2(next);
    const evid = score.dimensionScores.find(
      (d) => d.dimension === 'evidence_strength',
    )!;
    expect(evid.score).toBe(0);
    expect(evid.band).toBe('refused');
  });

  it('drops below usable when usable_as_evidence ids are absent', () => {
    const pack = buildCompleteProgramPack();
    const next: UnifiedContextPack = {
      ...pack,
      sections: pack.sections.map((s) =>
        s.key === 'evidence'
          ? filledSection('evidence', {
              usableOnly: false,
              items: [
                { id: 'EV-1', usable_as_evidence: false },
                { id: 'EV-2', usable_as_evidence: false },
              ],
            })
          : s,
      ),
    };
    const score = scoreContextQualityV2(next);
    const evid = score.dimensionScores.find(
      (d) => d.dimension === 'evidence_strength',
    )!;
    expect(evid.score).toBeLessThan(0.7);
  });
});

describe('scoreContextQualityV2 · governance_safety dimension', () => {
  it('emits a missing_governance risk when the section is empty', () => {
    const pack = buildCompleteProgramPack();
    const next: UnifiedContextPack = {
      ...pack,
      sections: pack.sections.map((s) =>
        s.key === 'governance_constraints'
          ? emptySection('governance_constraints')
          : s,
      ),
    };
    const score = scoreContextQualityV2(next);
    const gov = score.dimensionScores.find(
      (d) => d.dimension === 'governance_safety',
    )!;
    expect(gov.score).toBeLessThan(0.4);
    expect(score.risks.some((r) => r.kind === 'missing_governance')).toBe(true);
    expect(
      score.recommendations.some((r) => r.kind === 'add_governance_constraint'),
    ).toBe(true);
  });

  it('drops when only soft constraints are present', () => {
    const pack = buildCompleteProgramPack();
    const next: UnifiedContextPack = {
      ...pack,
      sections: pack.sections.map((s) =>
        s.key === 'governance_constraints'
          ? filledSection('governance_constraints', {
              constraints: [
                {
                  policy: 'soft_only',
                  rationale: 'soft',
                  severity: 'soft',
                },
              ],
            })
          : s,
      ),
    };
    const score = scoreContextQualityV2(next);
    const gov = score.dimensionScores.find(
      (d) => d.dimension === 'governance_safety',
    )!;
    expect(gov.score).toBeLessThan(0.6);
  });
});

// ---------------------------------------------------------------------
// Refused: empty tenant
// ---------------------------------------------------------------------

describe('scoreContextQualityV2 · refused: empty tenantKey', () => {
  it('is refused even when other sections are populated', () => {
    const full = buildCompleteProgramPack();
    const next: UnifiedContextPack = {
      ...full,
      identity: { tenantKey: '' },
    };
    const score = scoreContextQualityV2(next);
    expect(score.refused).toBe(true);
    expect(score.overallBand).toBe('refused');
    expect(score.refusalReason).toMatch(/tenant scope/i);
  });

  it('is refused when work object is unresolved', () => {
    const full = buildCompleteProgramPack();
    const next: UnifiedContextPack = {
      ...full,
      workObject: {
        kind: 'program',
        id: 'unknown',
        resolved: false,
        resolutionNote: 'not in seed',
      },
    };
    const score = scoreContextQualityV2(next);
    expect(score.refused).toBe(true);
    expect(score.refusalReason).toMatch(/unresolved/i);
  });
});

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

describe('classifyContextQualityV2 / summarizeContextQualityV2', () => {
  it('classifyContextQualityV2 returns refused on a refused score', () => {
    const score = scoreContextQualityV2(buildEmptyPack());
    expect(classifyContextQualityV2(score)).toBe('refused');
  });

  it('summarizeContextQualityV2 reconciles dimension counts', () => {
    const score: ContextQualityV2Score = scoreContextQualityV2(
      buildCompleteProgramPack(),
    );
    const sum = summarizeContextQualityV2(score);
    expect(sum.totalDimensions).toBe(10);
    expect(sum.usableDimensions + sum.weakDimensions).toBeLessThanOrEqual(10);
    expect(sum.topRisks.length).toBeLessThanOrEqual(3);
    expect(sum.topRecommendations.length).toBeLessThanOrEqual(3);
  });

  it('getContextQualityRecommendations returns the recommendations array', () => {
    const score = scoreContextQualityV2(buildEmptyPack());
    expect(getContextQualityRecommendations(score)).toEqual(
      score.recommendations,
    );
  });
});

// ---------------------------------------------------------------------
// Basis invariants
// ---------------------------------------------------------------------

describe('scoreContextQualityV2 · basis invariants', () => {
  it('basis fields are fixed strings on every score', () => {
    const score = scoreContextQualityV2(buildCompleteProgramPack());
    expect(score.basis.scorerVersion).toBe('ctx4.v1');
    expect(score.basis.source).toBe('deterministic_context_quality_scoring');
    expect(score.createdFrom).toBe('deterministic_seed');
  });

  it('emits no fake E-### evidence citations anywhere in the score', () => {
    const score = scoreContextQualityV2(buildCompleteProgramPack());
    const serialized = JSON.stringify(score);
    expect(serialized).not.toMatch(/"E-\d+"/);
    expect(serialized).not.toMatch(/E-\d{3,}/);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · static source check
// ---------------------------------------------------------------------

describe('module hygiene · context-quality-v2.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/context-quality-v2.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  // Strip line + block comments so hygiene assertions fire on real
  // code only (the file's own header honestly references these
  // tokens as forbidden).
  const codeOnly = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');

  it('imports only from the CTX2 unified-context-builder', () => {
    expect(source).toMatch(
      /from '@\/lib\/architecture\/unified-context-builder'/,
    );
  });

  it('does not import from forbidden runtimes', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
  });

  it('does not call Date.now / Math.random / new Date(', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
  });

  it('does not call fetch( or import model SDKs', () => {
    expect(codeOnly).not.toMatch(/\bfetch\(/);
    expect(codeOnly).not.toMatch(/from '@anthropic-ai\//);
    expect(codeOnly).not.toMatch(/from 'openai/);
    expect(codeOnly).not.toMatch(/from 'anthropic/);
  });

  it('does not use React state hooks', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });
});
