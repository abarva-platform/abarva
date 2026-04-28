// PDEL8 · Deliverable Evidence Trace tests.
//
// Pure deterministic, file-pure suite. No network, no model providers,
// no migrations, no time-of-day dependence.

import {
  buildEvidenceLedgerMvp,
  type EvidenceLedgerEntry,
} from '@/lib/architecture/evidence-ledger-mvp';
import {
  DELIVERABLE_EVIDENCE_CLAIM_BUCKETS,
  DELIVERABLE_EVIDENCE_TRACE_SOURCE_CAPTION,
  DELIVERABLE_EVIDENCE_TRACE_STATUSES,
  buildDeliverableEvidenceTrace,
  buildTracesForArtifacts,
  type DeliverableEvidenceTrace,
} from '@/lib/programs/deliverable-evidence-trace';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import {
  buildProgramArtifactInventory,
  type ProgramArtifact,
} from '@/lib/programs/program-artifact-inventory';

const plan = buildAllProgramsSeedPlan();
const ledger = buildEvidenceLedgerMvp();

// First two real tenants from the seed plan — used for cross-cutting
// invariants (no fake citations, summary reconciliation, module hygiene).
const realTenantA = plan.tenants[0];
const realTenantB = plan.tenants[1];
if (!realTenantA || !realTenantB) {
  throw new Error('Seed plan must expose at least two tenants.');
}
const realInventoryA = buildProgramArtifactInventory(
  realTenantA,
  realTenantA.programs[0],
);
const realInventoryB = buildProgramArtifactInventory(
  realTenantB,
  realTenantB.programs[0],
);
const allRealArtifacts: readonly ProgramArtifact[] = [
  ...realInventoryA.artifacts,
  ...realInventoryB.artifacts,
];

// Synthetic artifacts that match the EVID2 seed linkage shape
// (tenantKey + linkedPrograms entries). The EVID2 seed carries
// `acme/contact-center` and `meridian/intelligence` as program-link
// keys. We construct a synthetic uploaded charter artifact for each so
// the tests can exercise the seed-coverage branches without depending
// on the canonical demo program slugs.
function syntheticAcmeCharter(): ProgramArtifact {
  return makeArtifact({
    id: 'art:acme:contact-center:upload:charter-pdf',
    programCode: 'P-ACME-CC',
    programSlug: 'contact-center',
    tenantKey: 'acme',
    tenantRouteSlug: 'acme',
    routeHref: '/tenant/acme/programs/contact-center',
    type: 'uploaded_document',
    fileChip: 'PDF',
    title: 'P-ACME-CC · Charter (uploaded)',
    description: 'Synthetic charter artifact for PDEL8 trace coverage.',
    phaseBucket: 'charter',
    phaseSpec: 1,
    status: 'in_review',
    renderMode: 'pdf_preview',
    renderableInCanvas: false,
    evidenceUsability: 'partial',
    honestFallback: 'Synthetic test artifact.',
  });
}

function syntheticMeridianWorkshop(): ProgramArtifact {
  return makeArtifact({
    id: 'art:meridian:intelligence:workshop:charter',
    programCode: 'P-MERIDIAN-INT',
    programSlug: 'intelligence',
    tenantKey: 'meridian',
    tenantRouteSlug: 'meridian',
    routeHref: '/tenant/meridian/programs/intelligence',
    type: 'workshop_notes',
    fileChip: 'NOTE',
    title: 'Meridian intelligence workshop notes',
    description: 'Synthetic workshop notes artifact for PDEL8 trace coverage.',
    phaseBucket: 'charter',
    phaseSpec: 1,
    status: 'draft',
    renderMode: 'note_list',
    renderableInCanvas: true,
    evidenceUsability: 'partial',
    honestFallback: 'Synthetic test artifact.',
  });
}

// Helper: minimal ProgramArtifact that does not require a full inventory.
function makeArtifact(overrides: Partial<ProgramArtifact>): ProgramArtifact {
  const base: ProgramArtifact = {
    id: 'art:test:program-x:deliverable:test-instance',
    programCode: 'P-TEST',
    programSlug: 'program-x',
    tenantKey: 'tenant-t',
    tenantRouteSlug: 'tenant-t',
    routeHref: '/tenant/tenant-t/programs/program-x',
    type: 'generated_deliverable',
    fileChip: 'HTML',
    title: 'Test deliverable',
    description: 'Test description.',
    phaseBucket: 'charter',
    phaseSpec: 1,
    status: 'draft',
    renderMode: 'html_render',
    renderableInCanvas: true,
    downloadable: false,
    evidenceUsability: 'partial',
    honestFallback: 'Test fallback.',
    createdFrom: 'deterministic_seed',
  };
  return { ...base, ...overrides };
}

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


// ---------------------------------------------------------------------
// Canonical tuple
// ---------------------------------------------------------------------

describe('DELIVERABLE_EVIDENCE_TRACE_STATUSES', () => {
  it('exposes the six canonical trace statuses in canonical order', () => {
    expect(DELIVERABLE_EVIDENCE_TRACE_STATUSES).toEqual([
      'supported',
      'partially_supported',
      'unsupported',
      'missing',
      'stale',
      'blocked',
    ]);
  });

  it('exposes the canonical claim buckets used by the panel', () => {
    expect(DELIVERABLE_EVIDENCE_CLAIM_BUCKETS).toEqual([
      'supported',
      'partially_supported',
      'unsupported',
      'stale',
      'blocked',
    ]);
  });
});

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildDeliverableEvidenceTrace · determinism', () => {
  it('returns byte-equal output across repeated calls for the synthetic Acme charter', () => {
    const charter = syntheticAcmeCharter();
    const first = buildDeliverableEvidenceTrace(charter, ledger);
    const second = buildDeliverableEvidenceTrace(charter, ledger);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.createdFrom).toBe('deterministic_evidence_trace_seed');
  });

  it('returns byte-equal output across repeated bulk calls for a full real inventory', () => {
    const a = buildTracesForArtifacts(realInventoryA.artifacts, ledger);
    const b = buildTracesForArtifacts(realInventoryA.artifacts, ledger);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.length).toBe(realInventoryA.artifacts.length);
  });

  it('every trace carries the canonical createdFrom marker and source caption', () => {
    const traces = buildTracesForArtifacts(realInventoryB.artifacts, ledger);
    for (const trace of traces) {
      expect(trace.createdFrom).toBe('deterministic_evidence_trace_seed');
      expect(trace.sourceCaption).toBe(
        DELIVERABLE_EVIDENCE_TRACE_SOURCE_CAPTION,
      );
    }
  });
});

// ---------------------------------------------------------------------
// Seed coverage — Acme charter is supported by EVID2.
// ---------------------------------------------------------------------

describe('buildDeliverableEvidenceTrace · Acme seed coverage', () => {
  it('flags the synthetic Acme charter (uploaded) artifact as having at least one supported claim', () => {
    const charter = syntheticAcmeCharter();
    const trace = buildDeliverableEvidenceTrace(charter, ledger);
    expect(trace.summary.supportedCount).toBeGreaterThan(0);
    // The seed has a usable charter entry: evid-seed-acme-charter-1.
    const ids = trace.supportedClaims.map((c) => c.evidenceId);
    expect(ids).toContain('evid-seed-acme-charter-1');
  });

  it('synthetic Acme charter trace is supported or partially_supported (never blocked) under the seed', () => {
    const charter = syntheticAcmeCharter();
    const trace = buildDeliverableEvidenceTrace(charter, ledger);
    expect(['supported', 'partially_supported']).toContain(trace.status);
  });

  it('synthetic Meridian intelligence workshop artifact resolves a usable workshop_summary entry', () => {
    const workshop = syntheticMeridianWorkshop();
    const trace = buildDeliverableEvidenceTrace(workshop, ledger);
    // The seed carries `evid-seed-meridian-workshop-quality-checked-14`
    // linking to deliverable key `workshop_summary` AND program
    // `meridian/intelligence`. State is `quality_checked` (partial in
    // PDEL8 bucketing), so we expect at least one partial claim and no
    // missing-evidence gap.
    expect(trace.status).not.toBe('missing');
    expect(
      trace.partiallySupportedClaims.length + trace.supportedClaims.length,
    ).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// Unsupported claims surfaced
// ---------------------------------------------------------------------

describe('buildDeliverableEvidenceTrace · unsupported claims', () => {
  it('returns unsupported when only intermediate-state matching entries exist', () => {
    const artifact = makeArtifact({
      tenantKey: 'tenant-t',
      programSlug: 'program-x',
    });
    const entries: readonly EvidenceLedgerEntry[] = [
      makeEntry({
        id: 'evid-seed-intermediate-only-1',
        tenantKey: 'tenant-t',
        state: 'parsed',
        linkedPrograms: ['tenant-t/program-x'],
        qualityNotes: ['parsed but not yet quality-checked'],
      }),
      makeEntry({
        id: 'evid-seed-intermediate-only-2',
        tenantKey: 'tenant-t',
        state: 'classified',
        linkedPrograms: ['tenant-t/program-x'],
        qualityNotes: ['classified pending scope confirmation'],
      }),
    ];
    const trace = buildDeliverableEvidenceTrace(artifact, entries);
    expect(trace.status).toBe('unsupported');
    expect(trace.summary.supportedCount).toBe(0);
    expect(trace.unsupportedClaims.length).toBe(2);
    expect(trace.gaps.some((g) => g.kind === 'intermediate_only')).toBe(true);
    expect(trace.approvalImplication.recommendation).toBe(
      'hold_for_supporting_evidence',
    );
  });

  it('returns missing when no entries match the artifact', () => {
    const artifact = makeArtifact({
      tenantKey: 'tenant-t',
      programSlug: 'program-x',
    });
    const entries: readonly EvidenceLedgerEntry[] = [
      makeEntry({
        id: 'evid-seed-other-program',
        tenantKey: 'tenant-t',
        state: 'usable_as_evidence',
        linkedPrograms: ['tenant-t/program-y'],
        qualityNotes: ['quality reviewed for unrelated program'],
      }),
    ];
    const trace = buildDeliverableEvidenceTrace(artifact, entries);
    expect(trace.status).toBe('missing');
    expect(trace.summary.totalClaims).toBe(0);
    expect(trace.gaps.some((g) => g.kind === 'no_matching_evidence')).toBe(true);
    expect(trace.approvalImplication.recommendation).toBe(
      'no_supporting_evidence',
    );
  });

  it('returns missing with tenant_scope_mismatch gap when no same-tenant entries exist', () => {
    const artifact = makeArtifact({
      tenantKey: 'tenant-t',
      programSlug: 'program-x',
    });
    const entries: readonly EvidenceLedgerEntry[] = [
      makeEntry({
        id: 'evid-seed-other-tenant',
        tenantKey: 'tenant-other',
        state: 'usable_as_evidence',
        linkedPrograms: ['tenant-other/program-x'],
        qualityNotes: ['quality reviewed'],
      }),
    ];
    const trace = buildDeliverableEvidenceTrace(artifact, entries);
    expect(trace.status).toBe('missing');
    expect(trace.gaps.some((g) => g.kind === 'tenant_scope_mismatch')).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------------
// Blocked evidence surfaces with reason
// ---------------------------------------------------------------------

describe('buildDeliverableEvidenceTrace · blocked evidence with reason', () => {
  it('blocked entries appear in blockedClaims and carry the verbatim block reason', () => {
    const artifact = makeArtifact({
      tenantKey: 'tenant-t',
      programSlug: 'program-x',
    });
    const blockReason =
      'Two stewards listed for the same domain; reconciliation required before evidence usable.';
    const entries: readonly EvidenceLedgerEntry[] = [
      makeEntry({
        id: 'evid-seed-blocked-with-reason',
        tenantKey: 'tenant-t',
        state: 'blocked',
        linkedPrograms: ['tenant-t/program-x'],
        blockReason,
        qualityNotes: ['blocked pending steward reconciliation'],
      }),
    ];
    const trace = buildDeliverableEvidenceTrace(artifact, entries);
    expect(trace.status).toBe('blocked');
    expect(trace.blockedClaims.length).toBe(1);
    const claim = trace.blockedClaims[0];
    expect(claim.evidenceId).toBe('evid-seed-blocked-with-reason');
    expect(claim.blockReason).toBe(blockReason);
    expect(trace.gaps.some((g) => g.kind === 'evidence_blocked')).toBe(true);
    // Approval implication advisory must call out the block.
    expect(trace.approvalImplication.recommendation).toBe(
      'blocked_until_evidence_resolved',
    );
    expect(
      trace.approvalImplication.preconditions.some((p) =>
        p.includes(blockReason),
      ),
    ).toBe(true);
  });

  it('every blocked claim emits a non-empty blockReason on the claim itself', () => {
    const traces = buildTracesForArtifacts(
      allRealArtifacts,
      ledger,
    );
    for (const trace of traces) {
      for (const claim of trace.blockedClaims) {
        expect(typeof claim.blockReason).toBe('string');
        expect(((claim.blockReason ?? '').trim()).length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Stale evidence downgrades the trace
// ---------------------------------------------------------------------

describe('buildDeliverableEvidenceTrace · stale evidence downgrade', () => {
  it('downgrades a single matching entry flagged stale into the stale bucket', () => {
    const artifact = makeArtifact({
      tenantKey: 'tenant-t',
      programSlug: 'program-x',
    });
    const entries: readonly EvidenceLedgerEntry[] = [
      makeEntry({
        id: 'evid-seed-stale-1',
        tenantKey: 'tenant-t',
        state: 'cited',
        linkedPrograms: ['tenant-t/program-x'],
        qualityNotes: ['this evidence is stale and predates the latest cycle'],
      }),
    ];
    const trace = buildDeliverableEvidenceTrace(artifact, entries);
    expect(trace.status).toBe('stale');
    expect(trace.staleClaims.length).toBe(1);
    expect(trace.staleClaims[0].staleNote).toMatch(/stale/i);
    expect(trace.gaps.some((g) => g.kind === 'evidence_stale')).toBe(true);
    expect(trace.approvalImplication.recommendation).toBe(
      'hold_for_supporting_evidence',
    );
  });

  it('still surfaces stale entries even when usable entries exist; status becomes partially_supported', () => {
    const artifact = makeArtifact({
      tenantKey: 'tenant-t',
      programSlug: 'program-x',
    });
    const entries: readonly EvidenceLedgerEntry[] = [
      makeEntry({
        id: 'evid-seed-mix-usable',
        tenantKey: 'tenant-t',
        state: 'usable_as_evidence',
        linkedPrograms: ['tenant-t/program-x'],
        qualityNotes: ['quality reviewed for mix fixture'],
      }),
      makeEntry({
        id: 'evid-seed-mix-stale',
        tenantKey: 'tenant-t',
        state: 'cited',
        linkedPrograms: ['tenant-t/program-x'],
        qualityNotes: ['this evidence is stale and pre-dates the cycle'],
      }),
    ];
    const trace = buildDeliverableEvidenceTrace(artifact, entries);
    expect(trace.status).toBe('partially_supported');
    expect(trace.summary.supportedCount).toBe(1);
    expect(trace.summary.staleCount).toBe(1);
  });
});

// ---------------------------------------------------------------------
// No fake citations — only seeded usable evidence supports claims
// ---------------------------------------------------------------------

describe('buildDeliverableEvidenceTrace · no fake citations', () => {
  it('every supported claim resolves to an evid-seed- prefixed id from EVID2', () => {
    const traces = buildTracesForArtifacts(
      allRealArtifacts,
      ledger,
    );
    const seededIds = new Set(ledger.map((entry) => entry.id));
    for (const trace of traces) {
      for (const claim of trace.supportedClaims) {
        expect(claim.evidenceId.startsWith('evid-seed-')).toBe(true);
        expect(seededIds.has(claim.evidenceId)).toBe(true);
      }
    }
  });

  it('every supported claim corresponds to an EVID2 entry whose state is usable_as_evidence', () => {
    const traces = buildTracesForArtifacts(
      allRealArtifacts,
      ledger,
    );
    const stateById = new Map(ledger.map((e) => [e.id, e.state] as const));
    for (const trace of traces) {
      for (const claim of trace.supportedClaims) {
        expect(stateById.get(claim.evidenceId)).toBe('usable_as_evidence');
      }
    }
  });

  it('serialized traces contain no production-shaped E-### citation tokens', () => {
    const traces = buildTracesForArtifacts(
      allRealArtifacts,
      ledger,
    );
    const json = JSON.stringify(traces);
    expect(json).not.toMatch(/E-\d{2,}/);
  });

  it('serialized traces contain no https:// URLs', () => {
    const traces = buildTracesForArtifacts(
      allRealArtifacts,
      ledger,
    );
    const json = JSON.stringify(traces);
    expect(json).not.toMatch(/https:\/\//);
  });
});

// ---------------------------------------------------------------------
// Summary reconciliation
// ---------------------------------------------------------------------

describe('buildDeliverableEvidenceTrace · summary reconciliation', () => {
  it('summary counts reconcile to the per-bucket claim arrays', () => {
    const traces = buildTracesForArtifacts(
      allRealArtifacts,
      ledger,
    );
    for (const trace of traces) {
      expect(trace.summary.supportedCount).toBe(trace.supportedClaims.length);
      expect(trace.summary.partiallySupportedCount).toBe(
        trace.partiallySupportedClaims.length,
      );
      expect(trace.summary.unsupportedCount).toBe(
        trace.unsupportedClaims.length,
      );
      expect(trace.summary.staleCount).toBe(trace.staleClaims.length);
      expect(trace.summary.blockedCount).toBe(trace.blockedClaims.length);
      const sum =
        trace.supportedClaims.length +
        trace.partiallySupportedClaims.length +
        trace.unsupportedClaims.length +
        trace.staleClaims.length +
        trace.blockedClaims.length;
      if (trace.status !== 'missing') {
        expect(trace.summary.totalClaims).toBe(sum);
      } else {
        expect(trace.summary.totalClaims).toBe(0);
        expect(trace.summary.missingCount).toBe(1);
      }
    }
  });

  it('approvalImplication is always advisory only', () => {
    const traces = buildTracesForArtifacts(
      allRealArtifacts,
      ledger,
    );
    for (const trace of traces) {
      expect(trace.approvalImplication.advisoryOnly).toBe(true);
      expect(typeof trace.approvalImplication.rationale).toBe('string');
      expect(trace.approvalImplication.rationale.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene (regex)
// ---------------------------------------------------------------------

describe('module hygiene · deliverable-evidence-trace + DeliverableEvidenceTracePanel', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sources = [
    path.resolve(
      __dirname,
      '../../../lib/programs/deliverable-evidence-trace.ts',
    ),
    path.resolve(
      __dirname,
      '../../../components/programs/DeliverableEvidenceTracePanel.tsx',
    ),
  ];

  function codeOnly(src: string): string {
    return fs
      .readFileSync(src, 'utf8')
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '');
  }

  it('does not import Sentinel / Atlas / Nexus / Agent / Source / Auth / mock / supabase / app routes', () => {
    for (const src of sources) {
      const content = codeOnly(src);
      expect(content).not.toMatch(/from '@\/lib\/sentinel\//);
      expect(content).not.toMatch(/from '@\/lib\/atlas\//);
      expect(content).not.toMatch(/from '@\/lib\/nexus\//);
      expect(content).not.toMatch(/from '@\/lib\/agent\//);
      expect(content).not.toMatch(/from '@\/lib\/source\//);
      expect(content).not.toMatch(/from '@\/lib\/auth\//);
      expect(content).not.toMatch(/from '@\/lib\/programs\/mock'/);
      expect(content).not.toMatch(/from '@\/app\/programs\//);
      expect(content).not.toMatch(/from '@\/app\/\(maestro\)\/preview\//);
      expect(content).not.toMatch(/from '@\/app\/demo\//);
      expect(content).not.toMatch(/from 'supabase/);
      expect(content).not.toMatch(/from '@supabase\//);
    }
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    for (const src of sources) {
      const content = codeOnly(src);
      expect(content).not.toMatch(/Date\.now\(/);
      expect(content).not.toMatch(/Math\.random\(/);
      expect(content).not.toMatch(/new Date\(/);
      expect(content).not.toMatch(/\bfetch\(/);
    }
  });

  it('does not invoke Anthropic / OpenAI runtime', () => {
    for (const src of sources) {
      const content = codeOnly(src);
      expect(content).not.toMatch(/from 'anthropic'/);
      expect(content).not.toMatch(/from 'openai'/);
    }
  });

  it('does not use React state hooks (useState / useEffect)', () => {
    for (const src of sources) {
      const content = codeOnly(src);
      expect(content).not.toMatch(/\buseState\b/);
      expect(content).not.toMatch(/\buseEffect\b/);
    }
  });

  it('does not include placeholder language (Coming soon / TBD / Lorem ipsum)', () => {
    for (const src of sources) {
      const content = codeOnly(src);
      expect(content).not.toMatch(/Coming soon/i);
      expect(content).not.toMatch(/\bTBD\b/);
      expect(content).not.toMatch(/Lorem ipsum/i);
    }
  });

  it('contains no production-shaped E-### tokens in source', () => {
    for (const src of sources) {
      const content = codeOnly(src);
      expect(content).not.toMatch(/E-\d{2,}/);
    }
  });
});

// ---------------------------------------------------------------------
// Type exports surface
// ---------------------------------------------------------------------

describe('PDEL8 type surface', () => {
  it('compiles a DeliverableEvidenceTrace shape that the panel can consume', () => {
    const charter = syntheticAcmeCharter();
    const trace: DeliverableEvidenceTrace = buildDeliverableEvidenceTrace(
      charter,
      ledger,
    );
    expect(trace.artifactId).toBe(charter.id);
    expect(trace.tenantKey).toBe(charter.tenantKey);
    expect(trace.programSlug).toBe(charter.programSlug);
  });
});
