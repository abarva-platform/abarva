// ACT5 · AI Risk & Governance Read Model · integration tests.
//
// Purely deterministic. No DOM, no model calls, no network, no clock.
//
// Coverage:
//
// - ≥ 20 findings.
// - All 10 canonical dimensions present.
// - All 5 canonical statuses present.
// - All 4 canonical severities present.
// - ≥ 3 critical findings.
// - ≥ 5 hitlRequired findings.
// - ≥ 4 findings with governanceGate === 'fail'.
// - ≥ 2 findings carry a programKey; ≥ 2 carry an aiUseCaseKey.
// - Every finding carries ≥ 1 mitigation entry.
// - summarizeAiRiskGovernance reconciles totals.
// - governanceGatePassRate math is correct.
// - getCriticalRiskFindings, getUnaddressedFindings, and
//   getHitlRequiredFindings honor their definitions.
// - No invented dollar amounts (regex on JSON.stringify).
// - No branded vendor endorsements (deny-list scan).
// - Module hygiene: no banned imports, no banned APIs.

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  AI_RISK_GOVERNANCE_DIMENSIONS,
  AI_RISK_SEVERITIES,
  AI_RISK_STATUSES,
  GOVERNANCE_GATE_OUTCOMES,
  buildAiRiskGovernanceFindings,
  getCriticalRiskFindings,
  getHitlRequiredFindings,
  getUnaddressedFindings,
  summarizeAiRiskGovernance,
  type AiRiskGovernanceFinding,
  type AiRiskGovernanceSummary,
} from '@/lib/tower/ai-risk-governance';

const findings: readonly AiRiskGovernanceFinding[] =
  buildAiRiskGovernanceFindings();

// Resolved absolute path to the module source so we can run static
// inspection without re-importing it.
const MODULE_SOURCE_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'lib',
  'tower',
  'ai-risk-governance.ts',
);

const MODULE_SOURCE = fs.readFileSync(MODULE_SOURCE_PATH, 'utf8');

// ---------------------------------------------------------------------
// Shape & determinism
// ---------------------------------------------------------------------

describe('buildAiRiskGovernanceFindings · shape and determinism', () => {
  it('returns at least 20 findings', () => {
    expect(findings.length).toBeGreaterThanOrEqual(20);
  });

  it('is byte-equal across repeated calls (deterministic)', () => {
    const a = buildAiRiskGovernanceFindings();
    const b = buildAiRiskGovernanceFindings();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('exposes all ten canonical dimensions in AI_RISK_GOVERNANCE_DIMENSIONS', () => {
    expect([...AI_RISK_GOVERNANCE_DIMENSIONS]).toEqual([
      'responsible_ai_review',
      'privacy_data_protection',
      'security_red_team',
      'legal_contractual',
      'model_risk_management',
      'human_in_the_loop',
      'auditability_and_traceability',
      'regulatory_compliance',
      'third_party_vendor_risk',
      'change_management_risk',
    ]);
  });

  it('exposes all five canonical statuses', () => {
    expect([...AI_RISK_STATUSES]).toEqual([
      'unaddressed',
      'in_review',
      'mitigated',
      'accepted',
      'escalated',
    ]);
  });

  it('exposes all four canonical severities', () => {
    expect([...AI_RISK_SEVERITIES]).toEqual([
      'low',
      'medium',
      'high',
      'critical',
    ]);
  });

  it('exposes all four canonical governance gate outcomes', () => {
    expect([...GOVERNANCE_GATE_OUTCOMES]).toEqual([
      'pass',
      'partial',
      'fail',
      'not_run',
    ]);
  });

  it('every finding carries createdFrom: "deterministic_ai_risk_governance_seed"', () => {
    for (const finding of findings) {
      expect(finding.createdFrom).toBe(
        'deterministic_ai_risk_governance_seed',
      );
    }
  });

  it('every finding id matches the canonical "risk-seed-{n}" shape', () => {
    for (const finding of findings) {
      expect(finding.id).toMatch(/^risk-seed-\d+$/);
    }
  });

  it('finding ids are unique', () => {
    const ids = findings.map((finding) => finding.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every finding has a non-empty description and ownerRole', () => {
    for (const finding of findings) {
      expect(finding.description.length).toBeGreaterThan(0);
      expect(finding.ownerRole.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Dimension / status / severity coverage
// ---------------------------------------------------------------------

describe('dimension coverage', () => {
  it.each(AI_RISK_GOVERNANCE_DIMENSIONS.map((d) => [d]))(
    'has at least one finding for dimension %s',
    (dimension) => {
      const matches = findings.filter((f) => f.dimension === dimension);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('only uses canonical dimensions', () => {
    const allowed = new Set([...AI_RISK_GOVERNANCE_DIMENSIONS]);
    for (const finding of findings) {
      expect(allowed.has(finding.dimension)).toBe(true);
    }
  });
});

describe('status coverage', () => {
  it.each(AI_RISK_STATUSES.map((s) => [s]))(
    'has at least one finding for status %s',
    (status) => {
      const matches = findings.filter((f) => f.status === status);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('only uses canonical statuses', () => {
    const allowed = new Set([...AI_RISK_STATUSES]);
    for (const finding of findings) {
      expect(allowed.has(finding.status)).toBe(true);
    }
  });
});

describe('severity coverage', () => {
  it.each(AI_RISK_SEVERITIES.map((s) => [s]))(
    'has at least one finding for severity %s',
    (severity) => {
      const matches = findings.filter((f) => f.severity === severity);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('only uses canonical severities', () => {
    const allowed = new Set([...AI_RISK_SEVERITIES]);
    for (const finding of findings) {
      expect(allowed.has(finding.severity)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Per-row invariants
// ---------------------------------------------------------------------

describe('per-row invariants', () => {
  it('every finding carries at least one mitigation entry', () => {
    for (const finding of findings) {
      expect(finding.mitigations.length).toBeGreaterThanOrEqual(1);
      for (const mitigation of finding.mitigations) {
        expect(mitigation.length).toBeGreaterThan(0);
      }
    }
  });

  it('hitlRequired is a strict boolean', () => {
    for (const finding of findings) {
      expect(typeof finding.hitlRequired).toBe('boolean');
    }
  });

  it('auditableEvidenceIds is an array (possibly empty) of evidence-seed-{n} ids', () => {
    for (const finding of findings) {
      expect(Array.isArray(finding.auditableEvidenceIds)).toBe(true);
      for (const id of finding.auditableEvidenceIds) {
        expect(id).toMatch(/^evidence-seed-\d+$/);
      }
    }
  });

  it('governanceGate uses only canonical outcomes', () => {
    const allowed = new Set([...GOVERNANCE_GATE_OUTCOMES]);
    for (const finding of findings) {
      expect(allowed.has(finding.governanceGate)).toBe(true);
    }
  });

  it('programKey, when present, is a non-empty string', () => {
    for (const finding of findings) {
      if (finding.programKey !== undefined) {
        expect(finding.programKey.length).toBeGreaterThan(0);
      }
    }
  });

  it('aiUseCaseKey, when present, matches the canonical ai-use-case-seed-{n} shape', () => {
    for (const finding of findings) {
      if (finding.aiUseCaseKey !== undefined) {
        expect(finding.aiUseCaseKey).toMatch(/^ai-use-case-seed-\d+$/);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Distribution constraints (per ACT5 spec)
// ---------------------------------------------------------------------

describe('distribution constraints', () => {
  it('has at least 3 critical findings', () => {
    const critical = findings.filter((f) => f.severity === 'critical');
    expect(critical.length).toBeGreaterThanOrEqual(3);
  });

  it('has at least 5 findings that require human-in-the-loop', () => {
    const hitl = findings.filter((f) => f.hitlRequired);
    expect(hitl.length).toBeGreaterThanOrEqual(5);
  });

  it('has at least 4 findings with governanceGate === "fail"', () => {
    const failed = findings.filter((f) => f.governanceGate === 'fail');
    expect(failed.length).toBeGreaterThanOrEqual(4);
  });

  it('has at least 2 findings linked to a programKey', () => {
    const linked = findings.filter((f) => f.programKey !== undefined);
    expect(linked.length).toBeGreaterThanOrEqual(2);
  });

  it('has at least 2 findings linked to an aiUseCaseKey', () => {
    const linked = findings.filter((f) => f.aiUseCaseKey !== undefined);
    expect(linked.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------
// summarizeAiRiskGovernance
// ---------------------------------------------------------------------

describe('summarizeAiRiskGovernance', () => {
  const summary: AiRiskGovernanceSummary = summarizeAiRiskGovernance(findings);

  it('totalFindings equals the input length', () => {
    expect(summary.totalFindings).toBe(findings.length);
  });

  it('byDimension counts reconcile to totalFindings', () => {
    const sum = Object.values(summary.byDimension).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalFindings);
  });

  it('bySeverity counts reconcile to totalFindings', () => {
    const sum = Object.values(summary.bySeverity).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalFindings);
  });

  it('byStatus counts reconcile to totalFindings', () => {
    const sum = Object.values(summary.byStatus).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalFindings);
  });

  it('byDimension exposes every canonical dimension key (zero allowed)', () => {
    for (const dimension of AI_RISK_GOVERNANCE_DIMENSIONS) {
      expect(typeof summary.byDimension[dimension]).toBe('number');
    }
  });

  it('bySeverity exposes every canonical severity key (zero allowed)', () => {
    for (const severity of AI_RISK_SEVERITIES) {
      expect(typeof summary.bySeverity[severity]).toBe('number');
    }
  });

  it('byStatus exposes every canonical status key (zero allowed)', () => {
    for (const status of AI_RISK_STATUSES) {
      expect(typeof summary.byStatus[status]).toBe('number');
    }
  });

  it('hitlRequiredCount equals the count of hitlRequired === true findings', () => {
    const expected = findings.filter((f) => f.hitlRequired).length;
    expect(summary.hitlRequiredCount).toBe(expected);
  });

  it('unaddressedCount equals byStatus.unaddressed', () => {
    expect(summary.unaddressedCount).toBe(summary.byStatus.unaddressed);
  });

  it('criticalCount equals bySeverity.critical', () => {
    expect(summary.criticalCount).toBe(summary.bySeverity.critical);
  });

  it('governanceGatePassRate equals (passing findings) / totalFindings', () => {
    const passing = findings.filter(
      (f) => f.governanceGate === 'pass',
    ).length;
    const expected = passing / findings.length;
    expect(summary.governanceGatePassRate).toBeCloseTo(expected, 10);
  });

  it('governanceGatePassRate is in the closed interval [0, 1]', () => {
    expect(summary.governanceGatePassRate).toBeGreaterThanOrEqual(0);
    expect(summary.governanceGatePassRate).toBeLessThanOrEqual(1);
  });

  it('governanceGatePassRate is 0 for an empty input list', () => {
    const emptySummary = summarizeAiRiskGovernance([]);
    expect(emptySummary.governanceGatePassRate).toBe(0);
    expect(emptySummary.totalFindings).toBe(0);
  });

  it('summarizes the canonical seed when called with no arguments', () => {
    const defaultSummary = summarizeAiRiskGovernance();
    expect(defaultSummary.totalFindings).toBe(findings.length);
  });
});

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

describe('helpers', () => {
  it('getCriticalRiskFindings returns only severity === "critical"', () => {
    const critical = getCriticalRiskFindings(findings);
    expect(critical.length).toBeGreaterThanOrEqual(3);
    for (const finding of critical) {
      expect(finding.severity).toBe('critical');
    }
  });

  it('getCriticalRiskFindings excludes non-critical findings', () => {
    const critical = getCriticalRiskFindings(findings);
    const ids = new Set(critical.map((f) => f.id));
    for (const finding of findings) {
      if (finding.severity !== 'critical') {
        expect(ids.has(finding.id)).toBe(false);
      }
    }
  });

  it('getUnaddressedFindings returns only status === "unaddressed"', () => {
    const unaddressed = getUnaddressedFindings(findings);
    expect(unaddressed.length).toBeGreaterThanOrEqual(1);
    for (const finding of unaddressed) {
      expect(finding.status).toBe('unaddressed');
    }
  });

  it('getUnaddressedFindings excludes addressed findings', () => {
    const unaddressed = getUnaddressedFindings(findings);
    const ids = new Set(unaddressed.map((f) => f.id));
    for (const finding of findings) {
      if (finding.status !== 'unaddressed') {
        expect(ids.has(finding.id)).toBe(false);
      }
    }
  });

  it('getHitlRequiredFindings returns only hitlRequired === true', () => {
    const hitl = getHitlRequiredFindings(findings);
    expect(hitl.length).toBeGreaterThanOrEqual(5);
    for (const finding of hitl) {
      expect(finding.hitlRequired).toBe(true);
    }
  });

  it('getHitlRequiredFindings excludes findings that do not require HITL', () => {
    const hitl = getHitlRequiredFindings(findings);
    const ids = new Set(hitl.map((f) => f.id));
    for (const finding of findings) {
      if (!finding.hitlRequired) {
        expect(ids.has(finding.id)).toBe(false);
      }
    }
  });

  it('helper defaults summarize / filter the canonical seed when called with no arguments', () => {
    expect(getCriticalRiskFindings().length).toBe(
      getCriticalRiskFindings(findings).length,
    );
    expect(getUnaddressedFindings().length).toBe(
      getUnaddressedFindings(findings).length,
    );
    expect(getHitlRequiredFindings().length).toBe(
      getHitlRequiredFindings(findings).length,
    );
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no-fabrication invariants', () => {
  const serialized = JSON.stringify(findings);

  it('does not invent dollar amounts in any string field', () => {
    expect(serialized).not.toMatch(/\$\s*\d/);
  });

  it('does not carry branded vendor endorsements', () => {
    const denyList = [
      'OpenAI',
      'Anthropic',
      'Cohere',
      'Mistral',
      'Databricks',
      'Snowflake',
      'Microsoft Copilot',
      'GitHub Copilot',
    ];
    for (const brand of denyList) {
      expect(serialized).not.toContain(brand);
    }
  });

  it('does not carry banned placeholder language', () => {
    const banned = ['Coming soon', 'TBD', 'Lorem ipsum'];
    for (const phrase of banned) {
      expect(serialized).not.toContain(phrase);
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene', () => {
  it('does not import from forbidden runtime areas', () => {
    const forbidden = [
      "from '@/lib/source",
      "from '@/lib/sentinel",
      "from '@/lib/atlas",
      "from '@/lib/nexus",
      "from '@/lib/agent",
      "from '@/lib/auth",
      "from 'supabase",
      "from '@/supabase",
    ];
    for (const fragment of forbidden) {
      expect(MODULE_SOURCE).not.toContain(fragment);
    }
  });

  it('does not call banned timing / randomness / network APIs', () => {
    const bannedFragments = [
      'Date.now',
      'Math.random',
      'new Date(',
      'fetch(',
      'anthropic',
      'openai',
      'useState',
      'useEffect',
    ];
    for (const fragment of bannedFragments) {
      expect(MODULE_SOURCE).not.toContain(fragment);
    }
  });

  it('does not contain placeholder language in the source', () => {
    const banned = ['Coming soon', 'TBD', 'Lorem ipsum'];
    for (const phrase of banned) {
      expect(MODULE_SOURCE).not.toContain(phrase);
    }
  });
});
