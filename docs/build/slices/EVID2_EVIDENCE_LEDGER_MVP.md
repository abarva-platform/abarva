# EVID2 - Evidence Ledger MVP

Slice ID: EVID2
Slice name: Evidence Ledger MVP
Status: code_complete
Authored: 2026-04-25
Primary agent: Steward

## Purpose

EVID2 lands the deterministic, file-pure read model that demonstrates the
canonical lifecycle of an Evidence Ledger entry. It gives Sentinel,
Nexus, Atlas, and Steward a typed surface for reasoning about which
seed evidence is usable, which is blocked, and what intermediate
lifecycle state any given entry sits in. EVID2 is the read-only
companion to the EVID1 contract and is explicitly not a production
evidence pipeline.

EVID2 is part of Lane D in the parallel build pack. It does not call
the Model Gateway, does not retrieve from any persistence layer, does
not parse uploaded files, and does not resolve real citations.

## What Changed

- New module
  [src/lib/architecture/evidence-ledger-mvp.ts](../../../src/lib/architecture/evidence-ledger-mvp.ts):
  - Canonical usability state tuple
    `EVIDENCE_LEDGER_USABILITY_STATES = ['loaded', 'parsed',
    'indexed', 'classified', 'scoped', 'cited', 'quality_checked',
    'usable_as_evidence', 'blocked']`.
  - Public types: `EvidenceLedgerUsabilityState`,
    `EvidenceLedgerCitationKind`, `EvidenceLedgerCitation`,
    `EvidenceLedgerClaimDerivation`, `EvidenceLedgerClaim`,
    `EvidenceLedgerScope`, `EvidenceLedgerEntry`,
    `EvidenceLedgerValidationResult`, `EvidenceLedgerSummary`.
  - Public helpers: `buildEvidenceLedgerMvp`,
    `validateEvidenceLedgerEntry`, `summarizeEvidenceLedger`,
    `getUsableEvidence`, `getBlockedEvidence`,
    `explainEvidenceUsability`.
  - Fourteen deterministic seed entries spanning all nine canonical
    states, four claim derivations, three scopes, and four linkage
    classes (program, pattern, dataset domain, solution archetype).
  - Every entry id starts with `evid-seed-` and uses lowercase /
    digits / hyphens only. No `E-###` production-shaped identifier
    appears anywhere in the seed set.

- New tests
  [src/__tests__/integration/architecture/evidence-ledger-mvp.test.ts](../../../src/__tests__/integration/architecture/evidence-ledger-mvp.test.ts):
  - Determinism: byte-equal serialized output across repeated calls.
  - Canonical state tuple is in canonical order.
  - Every canonical state has at least one seed entry.
  - >= 4 entries in `usable_as_evidence`; >= 2 entries in `blocked`
    with non-empty `blockReason`.
  - >= 3 entries linked to programs, with mixed states.
  - >= 3 entries linked to intelligence patterns.
  - >= 3 entries linked to admin dataset domains.
  - >= 3 entries linked to solution archetypes.
  - Validation: `usable_as_evidence` requires non-empty `tenantKey`,
    non-empty `citation.locator`, canonical `citation.kind`, and at
    least one `qualityNotes` entry containing the substring
    `quality`.
  - Validation: `blocked` requires non-empty `blockReason`.
  - Intermediate-state entries (loaded, parsed, indexed, classified,
    scoped, cited, quality_checked) do not validate as usable.
  - No production-shaped citations: serialized JSON contains no
    `E-\d{2,}` literal.
  - No real `https://` or `http://` URLs in citation locators or
    raw source refs.
  - Summary reconciles totals, byState, usable count, and blocked
    count; partition helpers `getUsableEvidence` and
    `getBlockedEvidence` are disjoint.
  - `explainEvidenceUsability` produces a `Usable as evidence:` /
    `Blocked: <reason>` / `Not yet usable` string per canonical
    state.
  - Module hygiene: no imports from
    `@/lib/sentinel|atlas|nexus|agent|source|auth` or supabase; no
    `Date.now`, `Math.random`, `new Date(`, `fetch(`, anthropic,
    openai, useState, useEffect, "Coming soon", "TBD", or "Lorem
    ipsum".

- Updated `docs/build/build-slices.json` with EVID2 set to
  `code_complete`, depending on EVID1, with `risk: low` and the
  five-file allowlist.

- Updated `docs/build/production-readiness.json` to acknowledge the
  EVID2 ledger MVP under
  `data_evidence_knowledge_fabric` and `audit_governance`, while
  preserving every other field exactly. Live evidence pipeline and
  persistence remain explicitly deferred.

## Canonical Usability Lifecycle

1. `loaded` - file or artifact reference acknowledged in the ledger.
2. `parsed` - content has been parsed into addressable units.
3. `indexed` - parsed units are in the dataset / knowledge index.
4. `classified` - units have been classified by domain / pattern /
   archetype.
5. `scoped` - the entry is scoped to a tenant / program / workspace.
6. `cited` - a downstream artifact has cited the entry.
7. `quality_checked` - the entry has passed the EVID1 quality
   contract.
8. `usable_as_evidence` - the entry is approved for downstream agent
   use.
9. `blocked` - the entry cannot move forward until a named
   `blockReason` is resolved.

`buildEvidenceLedgerMvp()` exercises all nine states in a single
deterministic seed pack so downstream agents can verify their own
behavior against a known good fixture.

## Linkage Classes

Each entry exposes five readonly linkage arrays:

- `linkedPrograms` - canonical `tenant/program-slug` pairs.
- `linkedPatterns` - canonical I1 pattern keys.
- `linkedDeliverables` - canonical PDEL / deliverable keys.
- `linkedSolutionArchetypes` - canonical SOL3 / SOL5 archetype keys.
- `linkedDatasetDomains` - canonical ADM3 dataset domain keys.

Linkage arrays are seeded with canonical-shaped strings only and
contain no fabricated branded vendor names, no fabricated dollar
amounts, and no fake citations.

## Validation Rules

`validateEvidenceLedgerEntry(entry)` returns a structured
`EvidenceLedgerValidationResult` with `isUsable`, `isBlocked`, and
`reasons`. The rules are:

- `tenantKey` must be a non-empty string.
- `citation.locator` must be a non-empty string.
- `citation.kind` must be one of `page | section | timestamp |
  cell_ref | chunk_id`.
- For `state === 'usable_as_evidence'`, `qualityNotes` must include
  at least one note whose lowercase form contains `quality`.
- For `state === 'blocked'`, `blockReason` must be a non-empty
  string.

`isUsable` is only `true` when the state is `usable_as_evidence`
and there are no validation reasons. `isBlocked` is only `true`
when the state is `blocked` and the entry has a non-empty
`blockReason`.

## What Is Deterministic Today

- The seed set is module-level and frozen by `readonly` types.
  Repeated calls return byte-equal JSON.
- Validation is pure: same input -> same output.
- `summarizeEvidenceLedger` is pure: byState totals reconcile to the
  total entry count, and `uniqueTenants` / `uniquePrograms` are
  sorted and deduplicated.
- `getUsableEvidence` and `getBlockedEvidence` are disjoint
  partitions of the seed set.
- `explainEvidenceUsability` returns one of three honest categories:
  `Usable as evidence`, `Blocked`, or `Not yet usable`.

## What Is Honest About This Slice

- The module is a deterministic seed pack, not a live evidence
  pipeline. The seed entries are not derived from real tenant data.
- No `Date.now`, `new Date(`, `Math.random`, or `fetch(` is used.
- No model provider (`anthropic`, `openai`) is referenced.
- No production-shaped citation (`E-\d{2,}`) appears anywhere in the
  serialized ledger.
- No real `https://` or `http://` URL is used in any citation
  locator or raw source ref. Locators are seed strings such as
  `program/acme/charter#section-2`.
- No imports from `@/lib/sentinel/`, `@/lib/atlas/`, `@/lib/nexus/`,
  `@/lib/agent/`, `@/lib/source/`, `@/lib/auth/`, or supabase.

## What Is Deferred

- Live ingestion and parsing path (Lane B / Source pipeline) - not
  implemented by EVID2.
- Per-tenant evidence persistence and storage - deferred.
- Live citation resolution against tenant content - deferred.
- Quality scoring and confidence ranking beyond the canonical
  `qualityNotes` checklist - deferred.
- UI surfaces that render the ledger inside Programs, Intelligence,
  Tower, or Admin - deferred.
- Wiring of EVID2 into Sentinel detections, Atlas brief, or
  Nexus retrieval - deferred until a future EVID3 slice.

## How EVID2 Affects Production Readiness

EVID2 raises the visibility of the Evidence Ledger MVP without
claiming production readiness. The
`data_evidence_knowledge_fabric` and `audit_governance` components
in `production-readiness.json` are noted as having a deterministic
seed-only ledger and continue to carry the existing critical /
high blockers around live evidence pipeline, persistence, audit
ledger, and security review. The next action for each component
explicitly mentions the live evidence pipeline and persistence
work that remains.

## Validation

Required validation for this slice:

- `npx tsc --noEmit --pretty false` - pass
- `npx jest src/__tests__/integration/architecture/evidence-ledger-mvp.test.ts` - pass
- `npm run build` - pass
- `python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"` - pass

## Status

Code complete. Pending founder review. EVID2 does not push, merge, or
deploy.
