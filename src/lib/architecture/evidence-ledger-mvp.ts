// EVID2 - Evidence Ledger MVP
//
// Deterministic, file-pure read model that demonstrates the canonical
// usability lifecycle of an Evidence Ledger entry. No model calls, no
// retrieval, no persistence, no live citation resolution. Every entry
// in the seed set carries an `evid-seed-` prefixed id so it cannot be
// confused with a production-shaped citation (E-### / E-####).
//
// This module is the read-only companion to the EVID1 contract. It
// gives Sentinel, Nexus, Atlas, and Steward a typed, deterministic
// surface to reason about which evidence is usable, which is blocked,
// and what intermediate state any given seed entry sits in.

// ---------------------------------------------------------------------
// Canonical usability state tuple (order is contract).
// ---------------------------------------------------------------------

export const EVIDENCE_LEDGER_USABILITY_STATES = [
  'loaded',
  'parsed',
  'indexed',
  'classified',
  'scoped',
  'cited',
  'quality_checked',
  'usable_as_evidence',
  'blocked',
] as const;

export type EvidenceLedgerUsabilityState = typeof EVIDENCE_LEDGER_USABILITY_STATES[number];

// ---------------------------------------------------------------------
// Public types.
// ---------------------------------------------------------------------

export type EvidenceLedgerCitationKind =
  | 'page'
  | 'section'
  | 'timestamp'
  | 'cell_ref'
  | 'chunk_id';

export interface EvidenceLedgerCitation {
  kind: EvidenceLedgerCitationKind;
  locator: string;
  rawSourceRef: string;
}

export type EvidenceLedgerClaimDerivation =
  | 'tenant_artifact'
  | 'workshop_note'
  | 'pattern_inference'
  | 'solution_archetype_seed';

export interface EvidenceLedgerClaim {
  claimId: string;
  text: string;
  derivedFrom: EvidenceLedgerClaimDerivation;
}

export type EvidenceLedgerScope = 'tenant' | 'program' | 'workspace';

export interface EvidenceLedgerEntry {
  id: string;
  tenantKey: string;
  sourceArtifactId: string;
  claim: EvidenceLedgerClaim;
  citation: EvidenceLedgerCitation;
  state: EvidenceLedgerUsabilityState;
  scope: EvidenceLedgerScope;
  linkedPrograms: readonly string[];
  linkedPatterns: readonly string[];
  linkedDeliverables: readonly string[];
  linkedSolutionArchetypes: readonly string[];
  linkedDatasetDomains: readonly string[];
  blockReason?: string;
  qualityNotes: readonly string[];
  createdFrom: 'deterministic_evidence_ledger_mvp';
}

export interface EvidenceLedgerValidationResult {
  entry: EvidenceLedgerEntry;
  isUsable: boolean;
  isBlocked: boolean;
  reasons: readonly string[];
}

export interface EvidenceLedgerSummary {
  totalEntries: number;
  usableCount: number;
  blockedCount: number;
  byState: Record<EvidenceLedgerUsabilityState, number>;
  uniqueTenants: readonly string[];
  uniquePrograms: readonly string[];
}

// ---------------------------------------------------------------------
// Seed entries - 14 deterministic ledger rows.
// ---------------------------------------------------------------------

const VALID_CITATION_KINDS: ReadonlySet<EvidenceLedgerCitationKind> = new Set<EvidenceLedgerCitationKind>([
  'page',
  'section',
  'timestamp',
  'cell_ref',
  'chunk_id',
]);

const SEED_ENTRIES: readonly EvidenceLedgerEntry[] = [
  // -------------------------------------------------------------------
  // Program-linked entries (>= 3, mix of states from loaded -> usable).
  // -------------------------------------------------------------------
  {
    id: 'evid-seed-acme-charter-1',
    tenantKey: 'acme',
    sourceArtifactId: 'artifact-acme-charter-v1',
    claim: {
      claimId: 'claim-seed-program-acme-charter-1',
      text: 'Acme contact center program names a single business owner with measurable baseline.',
      derivedFrom: 'tenant_artifact',
    },
    citation: {
      kind: 'section',
      locator: 'program/acme/charter#section-2',
      rawSourceRef: 'tenant://acme/program/contact-center/charter.md',
    },
    state: 'usable_as_evidence',
    scope: 'program',
    linkedPrograms: ['acme/contact-center'],
    linkedPatterns: [],
    linkedDeliverables: ['charter'],
    linkedSolutionArchetypes: [],
    linkedDatasetDomains: [],
    qualityNotes: [
      'quality check passed against MW2 readiness thresholds',
      'business owner cited by name in tenant artifact',
    ],
    createdFrom: 'deterministic_evidence_ledger_mvp',
  },
  {
    id: 'evid-seed-acme-baseline-2',
    tenantKey: 'acme',
    sourceArtifactId: 'artifact-acme-baseline-deck',
    claim: {
      claimId: 'claim-seed-program-acme-baseline-2',
      text: 'Acme contact center baseline AHT recorded for program kickoff.',
      derivedFrom: 'tenant_artifact',
    },
    citation: {
      kind: 'page',
      locator: 'program/acme/baseline#page-4',
      rawSourceRef: 'tenant://acme/program/contact-center/baseline-deck.pdf',
    },
    state: 'cited',
    scope: 'program',
    linkedPrograms: ['acme/contact-center'],
    linkedPatterns: [],
    linkedDeliverables: ['value_ledger'],
    linkedSolutionArchetypes: [],
    linkedDatasetDomains: [],
    qualityNotes: [
      'cited but not yet quality reviewed',
    ],
    createdFrom: 'deterministic_evidence_ledger_mvp',
  },
  {
    id: 'evid-seed-acme-rollout-3',
    tenantKey: 'acme',
    sourceArtifactId: 'artifact-acme-rollout-plan',
    claim: {
      claimId: 'claim-seed-program-acme-rollout-3',
      text: 'Acme adoption plan names change champions per region.',
      derivedFrom: 'tenant_artifact',
    },
    citation: {
      kind: 'section',
      locator: 'program/acme/rollout#section-adoption',
      rawSourceRef: 'tenant://acme/program/contact-center/rollout-plan.md',
    },
    state: 'loaded',
    scope: 'program',
    linkedPrograms: ['acme/contact-center'],
    linkedPatterns: [],
    linkedDeliverables: ['adoption_change_plan'],
    linkedSolutionArchetypes: [],
    linkedDatasetDomains: [],
    qualityNotes: [
      'awaiting parser pass before downstream use',
    ],
    createdFrom: 'deterministic_evidence_ledger_mvp',
  },
  {
    id: 'evid-seed-meridian-charter-4',
    tenantKey: 'meridian',
    sourceArtifactId: 'artifact-meridian-charter',
    claim: {
      claimId: 'claim-seed-program-meridian-charter-4',
      text: 'Meridian intelligence program charter signed by single accountable owner.',
      derivedFrom: 'tenant_artifact',
    },
    citation: {
      kind: 'section',
      locator: 'program/meridian/charter#section-owner',
      rawSourceRef: 'tenant://meridian/program/intelligence/charter.md',
    },
    state: 'usable_as_evidence',
    scope: 'program',
    linkedPrograms: ['meridian/intelligence'],
    linkedPatterns: [],
    linkedDeliverables: ['charter'],
    linkedSolutionArchetypes: [],
    linkedDatasetDomains: [],
    qualityNotes: [
      'quality reviewed against PF1 no_business_owner failure mode',
      'matches MW2 readiness owner-named gate',
    ],
    createdFrom: 'deterministic_evidence_ledger_mvp',
  },
  // -------------------------------------------------------------------
  // Pattern-linked entries (>= 3).
  // -------------------------------------------------------------------
  {
    id: 'evid-seed-acme-pattern-pilot-purgatory-5',
    tenantKey: 'acme',
    sourceArtifactId: 'artifact-acme-quarterly-review',
    claim: {
      claimId: 'claim-seed-pattern-pilot-purgatory-5',
      text: 'Acme has three pilots that have not promoted to scale within four quarters.',
      derivedFrom: 'pattern_inference',
    },
    citation: {
      kind: 'page',
      locator: 'pattern/acme/quarterly-review#page-7',
      rawSourceRef: 'tenant://acme/portfolio/quarterly-review.pdf',
    },
    state: 'classified',
    scope: 'tenant',
    linkedPrograms: [],
    linkedPatterns: ['pilot-purgatory'],
    linkedDeliverables: [],
    linkedSolutionArchetypes: [],
    linkedDatasetDomains: [],
    qualityNotes: [
      'classified into pilot-purgatory pattern; awaiting scope confirmation',
    ],
    createdFrom: 'deterministic_evidence_ledger_mvp',
  },
  {
    id: 'evid-seed-meridian-pattern-data-foundation-6',
    tenantKey: 'meridian',
    sourceArtifactId: 'artifact-meridian-data-audit',
    claim: {
      claimId: 'claim-seed-pattern-data-foundation-6',
      text: 'Meridian data audit shows two source systems lack lineage and freshness signals.',
      derivedFrom: 'pattern_inference',
    },
    citation: {
      kind: 'section',
      locator: 'pattern/meridian/data-audit#section-lineage',
      rawSourceRef: 'tenant://meridian/data/audit.md',
    },
    state: 'usable_as_evidence',
    scope: 'tenant',
    linkedPrograms: [],
    linkedPatterns: ['weak-data-foundation'],
    linkedDeliverables: [],
    linkedSolutionArchetypes: [],
    linkedDatasetDomains: [],
    qualityNotes: [
      'quality reviewed against I1 detection thresholds',
      'recurrence verified across two source systems',
    ],
    createdFrom: 'deterministic_evidence_ledger_mvp',
  },
  {
    id: 'evid-seed-acme-pattern-tool-sprawl-7',
    tenantKey: 'acme',
    sourceArtifactId: 'artifact-acme-tool-inventory',
    claim: {
      claimId: 'claim-seed-pattern-tool-sprawl-7',
      text: 'Acme tool inventory shows seven AI-adjacent tools without measured value.',
      derivedFrom: 'pattern_inference',
    },
    citation: {
      kind: 'cell_ref',
      locator: 'pattern/acme/tool-inventory#sheet-tools-row-12',
      rawSourceRef: 'tenant://acme/portfolio/tool-inventory.xlsx',
    },
    state: 'parsed',
    scope: 'tenant',
    linkedPrograms: [],
    linkedPatterns: ['ai-tool-sprawl-without-value'],
    linkedDeliverables: [],
    linkedSolutionArchetypes: [],
    linkedDatasetDomains: [],
    qualityNotes: [
      'parsed from inventory spreadsheet; classification pending',
    ],
    createdFrom: 'deterministic_evidence_ledger_mvp',
  },
  // -------------------------------------------------------------------
  // Dataset-domain-linked entries (>= 3).
  // -------------------------------------------------------------------
  {
    id: 'evid-seed-acme-dataset-customer-8',
    tenantKey: 'acme',
    sourceArtifactId: 'artifact-acme-customer-domain-doc',
    claim: {
      claimId: 'claim-seed-dataset-customer-8',
      text: 'Acme customer domain has documented data steward and refresh cadence.',
      derivedFrom: 'tenant_artifact',
    },
    citation: {
      kind: 'section',
      locator: 'dataset/acme/customer#section-stewardship',
      rawSourceRef: 'tenant://acme/datasets/customer/domain-doc.md',
    },
    state: 'indexed',
    scope: 'tenant',
    linkedPrograms: [],
    linkedPatterns: [],
    linkedDeliverables: [],
    linkedSolutionArchetypes: [],
    linkedDatasetDomains: ['acme/customer'],
    qualityNotes: [
      'indexed in dataset inventory; awaiting classification pass',
    ],
    createdFrom: 'deterministic_evidence_ledger_mvp',
  },
  {
    id: 'evid-seed-meridian-dataset-claims-9',
    tenantKey: 'meridian',
    sourceArtifactId: 'artifact-meridian-claims-domain-doc',
    claim: {
      claimId: 'claim-seed-dataset-claims-9',
      text: 'Meridian claims domain documents PII handling and access policy.',
      derivedFrom: 'tenant_artifact',
    },
    citation: {
      kind: 'section',
      locator: 'dataset/meridian/claims#section-pii',
      rawSourceRef: 'tenant://meridian/datasets/claims/domain-doc.md',
    },
    state: 'usable_as_evidence',
    scope: 'tenant',
    linkedPrograms: [],
    linkedPatterns: [],
    linkedDeliverables: [],
    linkedSolutionArchetypes: [],
    linkedDatasetDomains: ['meridian/claims'],
    qualityNotes: [
      'quality reviewed against ADM3 dataset inventory contract',
      'PII handling matches governance policy',
    ],
    createdFrom: 'deterministic_evidence_ledger_mvp',
  },
  {
    id: 'evid-seed-meridian-dataset-provider-10',
    tenantKey: 'meridian',
    sourceArtifactId: 'artifact-meridian-provider-domain-doc',
    claim: {
      claimId: 'claim-seed-dataset-provider-10',
      text: 'Meridian provider domain owner is ambiguous between two stewards.',
      derivedFrom: 'tenant_artifact',
    },
    citation: {
      kind: 'section',
      locator: 'dataset/meridian/provider#section-stewardship',
      rawSourceRef: 'tenant://meridian/datasets/provider/domain-doc.md',
    },
    state: 'blocked',
    scope: 'tenant',
    linkedPrograms: [],
    linkedPatterns: [],
    linkedDeliverables: [],
    linkedSolutionArchetypes: [],
    linkedDatasetDomains: ['meridian/provider'],
    blockReason: 'Two stewards listed for the same domain; reconciliation required before evidence usable.',
    qualityNotes: [
      'blocked pending steward reconciliation',
    ],
    createdFrom: 'deterministic_evidence_ledger_mvp',
  },
  // -------------------------------------------------------------------
  // Solution-archetype-linked entries (>= 3).
  // -------------------------------------------------------------------
  {
    id: 'evid-seed-acme-archetype-ambient-11',
    tenantKey: 'acme',
    sourceArtifactId: 'artifact-acme-ambient-discovery',
    claim: {
      claimId: 'claim-seed-archetype-ambient-11',
      text: 'Acme contact center workflow allows ambient capture during agent calls.',
      derivedFrom: 'solution_archetype_seed',
    },
    citation: {
      kind: 'timestamp',
      locator: 'archetype/acme/ambient-capture#workshop-2026-04-18T14:30:00Z',
      rawSourceRef: 'tenant://acme/workshops/ambient-capture/notes.md',
    },
    state: 'scoped',
    scope: 'workspace',
    linkedPrograms: [],
    linkedPatterns: [],
    linkedDeliverables: [],
    linkedSolutionArchetypes: ['ambient_capture_assistant'],
    linkedDatasetDomains: [],
    qualityNotes: [
      'scoped to ambient capture archetype; citation confirmed',
    ],
    createdFrom: 'deterministic_evidence_ledger_mvp',
  },
  {
    id: 'evid-seed-meridian-archetype-prior-auth-12',
    tenantKey: 'meridian',
    sourceArtifactId: 'artifact-meridian-prior-auth-discovery',
    claim: {
      claimId: 'claim-seed-archetype-prior-auth-12',
      text: 'Meridian prior auth process generates structured determinations daily.',
      derivedFrom: 'solution_archetype_seed',
    },
    citation: {
      kind: 'section',
      locator: 'archetype/meridian/prior-auth#section-determinations',
      rawSourceRef: 'tenant://meridian/workshops/prior-auth/discovery.md',
    },
    state: 'usable_as_evidence',
    scope: 'workspace',
    linkedPrograms: [],
    linkedPatterns: [],
    linkedDeliverables: [],
    linkedSolutionArchetypes: ['prior_auth_automation'],
    linkedDatasetDomains: [],
    qualityNotes: [
      'quality reviewed against SOL5 healthcare archetype contract',
      'determination sample volume matches archetype threshold',
    ],
    createdFrom: 'deterministic_evidence_ledger_mvp',
  },
  {
    id: 'evid-seed-acme-archetype-hcc-13',
    tenantKey: 'acme',
    sourceArtifactId: 'artifact-acme-hcc-readiness',
    claim: {
      claimId: 'claim-seed-archetype-hcc-13',
      text: 'Acme HCC archetype readiness lacks coder SME availability.',
      derivedFrom: 'solution_archetype_seed',
    },
    citation: {
      kind: 'section',
      locator: 'archetype/acme/hcc#section-sme-coverage',
      rawSourceRef: 'tenant://acme/workshops/hcc/readiness.md',
    },
    state: 'blocked',
    scope: 'workspace',
    linkedPrograms: [],
    linkedPatterns: [],
    linkedDeliverables: [],
    linkedSolutionArchetypes: ['hcc_capture_copilot'],
    linkedDatasetDomains: [],
    blockReason: 'Coder SME coverage falls below SOL5 archetype required threshold; cannot promote until SME identified.',
    qualityNotes: [
      'blocked pending coder SME assignment',
    ],
    createdFrom: 'deterministic_evidence_ledger_mvp',
  },
  // -------------------------------------------------------------------
  // Workshop note (covers quality_checked state).
  // -------------------------------------------------------------------
  {
    id: 'evid-seed-meridian-workshop-quality-checked-14',
    tenantKey: 'meridian',
    sourceArtifactId: 'artifact-meridian-workshop-notes',
    claim: {
      claimId: 'claim-seed-workshop-quality-checked-14',
      text: 'Meridian workshop captured measurable baseline AHT and CSAT for intelligence pilot.',
      derivedFrom: 'workshop_note',
    },
    citation: {
      kind: 'chunk_id',
      locator: 'workshop/meridian/intelligence-kickoff#chunk-0042',
      rawSourceRef: 'tenant://meridian/workshops/intelligence-kickoff/notes.md',
    },
    state: 'quality_checked',
    scope: 'workspace',
    linkedPrograms: ['meridian/intelligence'],
    linkedPatterns: [],
    linkedDeliverables: ['workshop_summary'],
    linkedSolutionArchetypes: [],
    linkedDatasetDomains: [],
    qualityNotes: [
      'quality checked against MW2 readiness rules',
      'baseline numbers preserved verbatim from workshop transcript',
    ],
    createdFrom: 'deterministic_evidence_ledger_mvp',
  },
];

// Defensive freeze + return-the-same-instance contract is enforced by
// keeping SEED_ENTRIES module-level and never copying it. Consumers see
// readonly types and cannot mutate via the public API.

// ---------------------------------------------------------------------
// Public helpers.
// ---------------------------------------------------------------------

export function buildEvidenceLedgerMvp(): readonly EvidenceLedgerEntry[] {
  return SEED_ENTRIES;
}

export function validateEvidenceLedgerEntry(
  entry: EvidenceLedgerEntry,
): EvidenceLedgerValidationResult {
  const reasons: string[] = [];

  if (!entry.tenantKey || entry.tenantKey.trim().length === 0) {
    reasons.push('tenantKey is empty');
  }
  if (!entry.citation || !entry.citation.locator || entry.citation.locator.trim().length === 0) {
    reasons.push('citation.locator is empty');
  }
  if (!entry.citation || !VALID_CITATION_KINDS.has(entry.citation.kind)) {
    reasons.push('citation.kind is not a canonical citation kind');
  }

  const hasQualityNote = entry.qualityNotes.some((note) => note.toLowerCase().includes('quality'));

  if (entry.state === 'usable_as_evidence' && !hasQualityNote) {
    reasons.push('qualityNotes must include at least one quality note for usable_as_evidence');
  }

  if (entry.state === 'blocked') {
    if (!entry.blockReason || entry.blockReason.trim().length === 0) {
      reasons.push('blocked entry must have a non-empty blockReason');
    }
  }

  const isUsable = entry.state === 'usable_as_evidence' && reasons.length === 0;
  const isBlocked = entry.state === 'blocked'
    && !!entry.blockReason
    && entry.blockReason.trim().length > 0;

  return {
    entry,
    isUsable,
    isBlocked,
    reasons,
  };
}

export function summarizeEvidenceLedger(
  entries: readonly EvidenceLedgerEntry[],
): EvidenceLedgerSummary {
  const byState: Record<EvidenceLedgerUsabilityState, number> = {
    loaded: 0,
    parsed: 0,
    indexed: 0,
    classified: 0,
    scoped: 0,
    cited: 0,
    quality_checked: 0,
    usable_as_evidence: 0,
    blocked: 0,
  };

  const tenants = new Set<string>();
  const programs = new Set<string>();

  let usableCount = 0;
  let blockedCount = 0;

  for (const entry of entries) {
    byState[entry.state] += 1;
    if (entry.state === 'usable_as_evidence') usableCount += 1;
    if (entry.state === 'blocked') blockedCount += 1;
    if (entry.tenantKey) tenants.add(entry.tenantKey);
    for (const program of entry.linkedPrograms) {
      programs.add(program);
    }
  }

  return {
    totalEntries: entries.length,
    usableCount,
    blockedCount,
    byState,
    uniqueTenants: Array.from(tenants).sort(),
    uniquePrograms: Array.from(programs).sort(),
  };
}

export function getUsableEvidence(
  entries: readonly EvidenceLedgerEntry[],
): readonly EvidenceLedgerEntry[] {
  return entries.filter((entry) => validateEvidenceLedgerEntry(entry).isUsable);
}

export function getBlockedEvidence(
  entries: readonly EvidenceLedgerEntry[],
): readonly EvidenceLedgerEntry[] {
  return entries.filter((entry) => validateEvidenceLedgerEntry(entry).isBlocked);
}

export function explainEvidenceUsability(entry: EvidenceLedgerEntry): string {
  const result = validateEvidenceLedgerEntry(entry);
  if (result.isUsable) {
    return `Usable as evidence: tenant=${entry.tenantKey}, scope=${entry.scope}, citation=${entry.citation.kind}:${entry.citation.locator}`;
  }
  if (result.isBlocked) {
    const reason = entry.blockReason ?? 'no reason recorded';
    return `Blocked: ${reason}`;
  }
  if (result.reasons.length > 0) {
    return `Not yet usable (state=${entry.state}): ${result.reasons.join('; ')}`;
  }
  return `Not yet usable (state=${entry.state}): intermediate lifecycle state, no validation failures recorded`;
}
