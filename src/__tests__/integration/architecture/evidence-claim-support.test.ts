// EVID3 - Evidence Claim Support Model tests.
//
// Deterministic, file-pure suite. No network, no model providers, no
// migrations, no time-of-day dependence.

import {
  EVIDENCE_CLAIM_SUPPORT_STATUSES,
  evaluateClaimSupport,
  evaluateClaimsForWorkObject,
  getUnsupportedClaims,
  summarizeClaimSupport,
  type EvidenceClaimSupportResult,
  type EvidenceClaimSupportStatus,
  type EvidenceSupportedClaim,
} from '@/lib/architecture/evidence-claim-support';
import type { EvidenceLedgerEntry } from '@/lib/architecture/evidence-ledger-mvp';

// ---------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------

function makeEntry(overrides: Partial<EvidenceLedgerEntry>): EvidenceLedgerEntry {
  const base: EvidenceLedgerEntry = {
    id: 'evid-seed-test-base',
    tenantKey: 'tenant-t',
    sourceArtifactId: 'artifact-test-base',
    claim: {
      claimId: 'claim-seed-test-base',
      text: 'Test claim text for fixture base.',
      derivedFrom: 'tenant_artifact',
    },
    citation: {
      kind: 'section',
      locator: 'test/base#section-1',
      rawSourceRef: 'tenant://tenant-t/test/base.md',
    },
    state: 'usable_as_evidence',
    scope: 'program',
    linkedPrograms: [],
    linkedPatterns: [],
    linkedDeliverables: [],
    linkedSolutionArchetypes: [],
    linkedDatasetDomains: [],
    qualityNotes: ['quality reviewed for test fixture'],
    createdFrom: 'deterministic_evidence_ledger_mvp',
  };
  return {
    ...base,
    ...overrides,
    claim: { ...base.claim, ...(overrides.claim ?? {}) },
    citation: { ...base.citation, ...(overrides.citation ?? {}) },
  };
}

const TENANT_T = 'tenant-t';
const TENANT_OTHER = 'tenant-other';
const PROGRAM_P = 'tenant-t/program-p';
const PROGRAM_Q = 'tenant-t/program-q';

// ---------------------------------------------------------------------
// Constant tuple
// ---------------------------------------------------------------------

describe('EVIDENCE_CLAIM_SUPPORT_STATUSES', () => {
  it('exposes the seven canonical statuses in canonical order', () => {
    expect(EVIDENCE_CLAIM_SUPPORT_STATUSES).toEqual([
      'supported',
      'partially_supported',
      'unsupported',
      'contradicted',
      'missing_evidence',
      'stale_evidence',
      'out_of_scope',
    ]);
  });
});

// ---------------------------------------------------------------------
// evaluateClaimSupport - status branches
// ---------------------------------------------------------------------

describe('evaluateClaimSupport · status branches', () => {
  it('returns supported when a usable entry matches the claim work object', () => {
    const entries: readonly EvidenceLedgerEntry[] = [
      makeEntry({
        id: 'evid-seed-supported-1',
        tenantKey: TENANT_T,
        state: 'usable_as_evidence',
        linkedPrograms: [PROGRAM_P],
        qualityNotes: ['quality reviewed against MW2 readiness'],
      }),
    ];
    const claim: EvidenceSupportedClaim = {
      claimId: 'claim-supported-1',
      claimText: 'Program P has measurable baseline.',
      workObjectId: PROGRAM_P,
      workObjectKind: 'program',
      tenantKey: TENANT_T,
    };
    const result = evaluateClaimSupport(claim, entries);
    expect(result.status).toBe('supported');
    expect(result.supportingEvidenceIds).toEqual(['evid-seed-supported-1']);
    expect(result.gaps).toEqual([]);
    expect(result.contradictions).toEqual([]);
    expect(result.confidence).toBe('high');
    expect(result.basis).toEqual({ evaluator: 'evidence_claim_support_v1' });
    expect(result.createdFrom).toBe('deterministic_seed');
  });

  it('returns unsupported with evidence_blocked gap when only blocked entries match', () => {
    const entries: readonly EvidenceLedgerEntry[] = [
      makeEntry({
        id: 'evid-seed-blocked-1',
        tenantKey: TENANT_T,
        state: 'blocked',
        linkedPrograms: [PROGRAM_P],
        blockReason: 'Steward reconciliation required.',
        qualityNotes: ['blocked pending reconciliation'],
      }),
    ];
    const claim: EvidenceSupportedClaim = {
      claimId: 'claim-blocked-1',
      claimText: 'Program P has measurable baseline.',
      workObjectId: PROGRAM_P,
      workObjectKind: 'program',
      tenantKey: TENANT_T,
    };
    const result = evaluateClaimSupport(claim, entries);
    expect(result.status).toBe('unsupported');
    expect(result.gaps.map((g) => g.kind)).toContain('evidence_blocked');
    expect(result.confidence).toBe('low');
  });

  it('returns stale_evidence when all non-blocked matching entries carry a stale qualityNotes annotation', () => {
    const entries: readonly EvidenceLedgerEntry[] = [
      makeEntry({
        id: 'evid-seed-stale-1',
        tenantKey: TENANT_T,
        state: 'cited',
        linkedPrograms: [PROGRAM_P],
        qualityNotes: ['this evidence is stale and predates the latest cycle'],
      }),
    ];
    const claim: EvidenceSupportedClaim = {
      claimId: 'claim-stale-1',
      claimText: 'Program P has measurable baseline.',
      workObjectId: PROGRAM_P,
      workObjectKind: 'program',
      tenantKey: TENANT_T,
    };
    const result = evaluateClaimSupport(claim, entries);
    expect(result.status).toBe('stale_evidence');
    expect(result.gaps.map((g) => g.kind)).toContain('evidence_stale');
  });

  it('returns out_of_scope with tenant_scope_mismatch gap when tenants differ', () => {
    const entries: readonly EvidenceLedgerEntry[] = [
      makeEntry({
        id: 'evid-seed-other-tenant-1',
        tenantKey: TENANT_OTHER,
        state: 'usable_as_evidence',
        linkedPrograms: [PROGRAM_P],
      }),
    ];
    const claim: EvidenceSupportedClaim = {
      claimId: 'claim-out-of-scope-1',
      claimText: 'Program P has measurable baseline.',
      workObjectId: PROGRAM_P,
      workObjectKind: 'program',
      tenantKey: TENANT_T,
    };
    const result = evaluateClaimSupport(claim, entries);
    expect(result.status).toBe('out_of_scope');
    expect(result.gaps.map((g) => g.kind)).toContain('tenant_scope_mismatch');
    expect(result.supportingEvidenceIds).toEqual([]);
  });

  it('returns missing_evidence with no_matching_evidence gap when work object differs', () => {
    const entries: readonly EvidenceLedgerEntry[] = [
      makeEntry({
        id: 'evid-seed-other-program-1',
        tenantKey: TENANT_T,
        state: 'usable_as_evidence',
        linkedPrograms: [PROGRAM_Q],
      }),
    ];
    const claim: EvidenceSupportedClaim = {
      claimId: 'claim-missing-1',
      claimText: 'Program P has measurable baseline.',
      workObjectId: PROGRAM_P,
      workObjectKind: 'program',
      tenantKey: TENANT_T,
    };
    const result = evaluateClaimSupport(claim, entries);
    expect(result.status).toBe('missing_evidence');
    expect(result.gaps.map((g) => g.kind)).toContain('no_matching_evidence');
  });

  it('returns contradicted when a usable entry text contains "contradicts <claimId>"', () => {
    const entries: readonly EvidenceLedgerEntry[] = [
      makeEntry({
        id: 'evid-seed-contradicting-1',
        tenantKey: TENANT_T,
        state: 'usable_as_evidence',
        linkedPrograms: [PROGRAM_P],
        claim: {
          claimId: 'claim-seed-contradicting-1',
          text: 'This entry contradicts claim-contradicted-1 with measured counter-evidence.',
          derivedFrom: 'tenant_artifact',
        },
        qualityNotes: ['quality reviewed against contradiction protocol'],
      }),
    ];
    const claim: EvidenceSupportedClaim = {
      claimId: 'claim-contradicted-1',
      claimText: 'Program P has measurable baseline.',
      workObjectId: PROGRAM_P,
      workObjectKind: 'program',
      tenantKey: TENANT_T,
    };
    const result = evaluateClaimSupport(claim, entries);
    expect(result.status).toBe('contradicted');
    expect(result.contradictions.length).toBe(1);
    expect(result.contradictions[0].contradictingEvidenceId).toBe(
      'evid-seed-contradicting-1',
    );
  });

  it('returns partially_supported when usable entries exist but expected ids are not all present', () => {
    const entries: readonly EvidenceLedgerEntry[] = [
      makeEntry({
        id: 'evid-seed-partial-present',
        tenantKey: TENANT_T,
        state: 'usable_as_evidence',
        linkedPrograms: [PROGRAM_P],
        qualityNotes: ['quality reviewed for partial fixture'],
      }),
    ];
    const claim: EvidenceSupportedClaim = {
      claimId: 'claim-partial-1',
      claimText: 'Program P has measurable baseline.',
      workObjectId: PROGRAM_P,
      workObjectKind: 'program',
      tenantKey: TENANT_T,
      expectedSupportingEvidenceIds: [
        'evid-seed-partial-present',
        'evid-seed-partial-missing',
      ],
    };
    const result = evaluateClaimSupport(claim, entries);
    expect(result.status).toBe('partially_supported');
    expect(result.confidence).toBe('medium');
    expect(result.supportingEvidenceIds).toEqual(['evid-seed-partial-present']);
    expect(result.gaps[0].reason).toContain('evid-seed-partial-missing');
  });

  it('returns unsupported when matching entries exist but none reach usable_as_evidence', () => {
    const entries: readonly EvidenceLedgerEntry[] = [
      makeEntry({
        id: 'evid-seed-intermediate-1',
        tenantKey: TENANT_T,
        state: 'parsed',
        linkedPrograms: [PROGRAM_P],
        qualityNotes: ['parsed but not yet quality-checked'],
      }),
      makeEntry({
        id: 'evid-seed-intermediate-2',
        tenantKey: TENANT_T,
        state: 'classified',
        linkedPrograms: [PROGRAM_P],
        qualityNotes: ['classified pending scope confirmation'],
      }),
    ];
    const claim: EvidenceSupportedClaim = {
      claimId: 'claim-intermediate-1',
      claimText: 'Program P has measurable baseline.',
      workObjectId: PROGRAM_P,
      workObjectKind: 'program',
      tenantKey: TENANT_T,
    };
    const result = evaluateClaimSupport(claim, entries);
    expect(result.status).toBe('unsupported');
    expect(result.gaps.map((g) => g.kind)).toContain('no_matching_evidence');
    expect(result.confidence).toBe('low');
  });
});

// ---------------------------------------------------------------------
// evaluateClaimsForWorkObject
// ---------------------------------------------------------------------

describe('evaluateClaimsForWorkObject', () => {
  it('returns one result per claim, in input order, deterministically', () => {
    const entries: readonly EvidenceLedgerEntry[] = [
      makeEntry({
        id: 'evid-seed-bulk-1',
        tenantKey: TENANT_T,
        state: 'usable_as_evidence',
        linkedPrograms: [PROGRAM_P],
        qualityNotes: ['quality reviewed for bulk fixture'],
      }),
    ];
    const claims: readonly EvidenceSupportedClaim[] = [
      {
        claimId: 'claim-bulk-supported',
        claimText: 'Bulk supported.',
        workObjectId: PROGRAM_P,
        workObjectKind: 'program',
        tenantKey: TENANT_T,
      },
      {
        claimId: 'claim-bulk-missing',
        claimText: 'Bulk missing.',
        workObjectId: PROGRAM_Q,
        workObjectKind: 'program',
        tenantKey: TENANT_T,
      },
    ];
    const first = evaluateClaimsForWorkObject(claims, entries);
    const second = evaluateClaimsForWorkObject(claims, entries);
    expect(first.length).toBe(2);
    expect(first[0].claimId).toBe('claim-bulk-supported');
    expect(first[0].status).toBe('supported');
    expect(first[1].claimId).toBe('claim-bulk-missing');
    expect(first[1].status).toBe('missing_evidence');
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });
});

// ---------------------------------------------------------------------
// summarizeClaimSupport
// ---------------------------------------------------------------------

describe('summarizeClaimSupport', () => {
  it('reconciles totals, byStatus, unsupported and contradicted counts', () => {
    const results: readonly EvidenceClaimSupportResult[] = [
      {
        claimId: 'a',
        status: 'supported',
        supportingEvidenceIds: ['evid-seed-a'],
        gaps: [],
        contradictions: [],
        confidence: 'high',
        rationale: 'r',
        basis: { evaluator: 'evidence_claim_support_v1' },
        createdFrom: 'deterministic_seed',
      },
      {
        claimId: 'b',
        status: 'unsupported',
        supportingEvidenceIds: [],
        gaps: [{ kind: 'no_matching_evidence', reason: 'r' }],
        contradictions: [],
        confidence: 'low',
        rationale: 'r',
        basis: { evaluator: 'evidence_claim_support_v1' },
        createdFrom: 'deterministic_seed',
      },
      {
        claimId: 'c',
        status: 'missing_evidence',
        supportingEvidenceIds: [],
        gaps: [{ kind: 'no_matching_evidence', reason: 'r' }],
        contradictions: [],
        confidence: 'low',
        rationale: 'r',
        basis: { evaluator: 'evidence_claim_support_v1' },
        createdFrom: 'deterministic_seed',
      },
      {
        claimId: 'd',
        status: 'contradicted',
        supportingEvidenceIds: [],
        gaps: [],
        contradictions: [
          { contradictingEvidenceId: 'evid-seed-x', reason: 'r' },
        ],
        confidence: 'high',
        rationale: 'r',
        basis: { evaluator: 'evidence_claim_support_v1' },
        createdFrom: 'deterministic_seed',
      },
      {
        claimId: 'e',
        status: 'stale_evidence',
        supportingEvidenceIds: [],
        gaps: [{ kind: 'evidence_stale', reason: 'r' }],
        contradictions: [],
        confidence: 'low',
        rationale: 'r',
        basis: { evaluator: 'evidence_claim_support_v1' },
        createdFrom: 'deterministic_seed',
      },
    ];
    const summary = summarizeClaimSupport(results);
    expect(summary.totalClaims).toBe(5);
    const sumByStatus = (
      Object.values(summary.byStatus) as number[]
    ).reduce((sum, n) => sum + n, 0);
    expect(sumByStatus).toBe(5);
    expect(summary.byStatus.supported).toBe(1);
    expect(summary.byStatus.unsupported).toBe(1);
    expect(summary.byStatus.missing_evidence).toBe(1);
    expect(summary.byStatus.contradicted).toBe(1);
    expect(summary.byStatus.stale_evidence).toBe(1);
    expect(summary.unsupportedCount).toBe(3); // unsupported + missing + stale
    expect(summary.contradictedCount).toBe(1);
    expect(['low', 'medium', 'high']).toContain(summary.averageConfidenceLabel);
  });

  it('returns low average confidence and zero counts on empty input', () => {
    const summary = summarizeClaimSupport([]);
    expect(summary.totalClaims).toBe(0);
    expect(summary.unsupportedCount).toBe(0);
    expect(summary.contradictedCount).toBe(0);
    expect(summary.averageConfidenceLabel).toBe('low');
  });
});

// ---------------------------------------------------------------------
// getUnsupportedClaims
// ---------------------------------------------------------------------

describe('getUnsupportedClaims', () => {
  it('returns only unsupported, missing_evidence, stale_evidence, and contradicted results', () => {
    const allStatuses: readonly EvidenceClaimSupportStatus[] = [
      'supported',
      'partially_supported',
      'unsupported',
      'contradicted',
      'missing_evidence',
      'stale_evidence',
      'out_of_scope',
    ];
    const results: readonly EvidenceClaimSupportResult[] = allStatuses.map(
      (status, idx) => ({
        claimId: `claim-${idx}`,
        status,
        supportingEvidenceIds: [],
        gaps: [],
        contradictions: [],
        confidence: 'low',
        rationale: 'r',
        basis: { evaluator: 'evidence_claim_support_v1' },
        createdFrom: 'deterministic_seed',
      }),
    );
    const flagged = getUnsupportedClaims(results);
    const flaggedStatuses = flagged.map((r) => r.status);
    expect(flaggedStatuses).toEqual(
      expect.arrayContaining([
        'unsupported',
        'missing_evidence',
        'stale_evidence',
        'contradicted',
      ]),
    );
    expect(flaggedStatuses).not.toContain('supported');
    expect(flaggedStatuses).not.toContain('partially_supported');
    expect(flaggedStatuses).not.toContain('out_of_scope');
    expect(flagged.length).toBe(4);
  });
});

// ---------------------------------------------------------------------
// No fabricated production-shaped citation tokens
// ---------------------------------------------------------------------

describe('EVID3 · no fabricated citations in serialized output', () => {
  it('serialized results contain no production-shaped E-### tokens', () => {
    const entries: readonly EvidenceLedgerEntry[] = [
      makeEntry({
        id: 'evid-seed-no-fab-1',
        tenantKey: TENANT_T,
        state: 'usable_as_evidence',
        linkedPrograms: [PROGRAM_P],
        qualityNotes: ['quality reviewed for no-fab fixture'],
      }),
      makeEntry({
        id: 'evid-seed-no-fab-2',
        tenantKey: TENANT_T,
        state: 'blocked',
        linkedPrograms: [PROGRAM_P],
        blockReason: 'reconciliation required',
        qualityNotes: ['blocked pending steward'],
      }),
    ];
    const claims: readonly EvidenceSupportedClaim[] = [
      {
        claimId: 'claim-no-fab-1',
        claimText: 'Program P has measurable baseline.',
        workObjectId: PROGRAM_P,
        workObjectKind: 'program',
        tenantKey: TENANT_T,
      },
      {
        claimId: 'claim-no-fab-2',
        claimText: 'Program P has measurable baseline.',
        workObjectId: PROGRAM_Q,
        workObjectKind: 'program',
        tenantKey: TENANT_T,
      },
    ];
    const json = JSON.stringify(
      evaluateClaimsForWorkObject(claims, entries),
    );
    expect(json).not.toMatch(/E-\d{2,}/);
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · evidence-claim-support.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/evidence-claim-support.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not import Sentinel / Atlas / Nexus / Agent / Source / Auth runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Anthropic / OpenAI runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
  });

  it('does not use React state hooks (useState / useEffect)', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });

  it('does not include placeholder language (Coming soon / TBD / Lorem ipsum)', () => {
    expect(codeOnly).not.toMatch(/Coming soon/i);
    expect(codeOnly).not.toMatch(/\bTBD\b/);
    expect(codeOnly).not.toMatch(/Lorem ipsum/i);
  });

  it('contains no production-shaped E-### tokens in source', () => {
    expect(codeOnly).not.toMatch(/E-\d{2,}/);
  });
});
