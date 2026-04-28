# PDEL8 · Deliverable Evidence Trace Panel

Slice ID: PDEL8
Slice name: Deliverable Evidence Trace Panel
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)
Depends on: PDEL, EVID2, EVID3

PDEL8 lands the deterministic, file-pure read model and Server
Component panel that surfaces, for any program-deliverable artifact,
which EVID2 evidence supports the deliverable, what is partially
supported, what is unsupported, what is stale, what is blocked, and
what must be resolved before the deliverable can move to approval. The
approval implication is **advisory only** — PDEL8 does not implement an
approval state machine and never flips an artifact's approval status.

PDEL8 is a read-model only slice. **No DB writes, no live retrieval,
no model invocation, no fabricated citations.** Every supporting claim
resolves to an `evid-seed-` prefixed id from EVID2; no production-shaped
`E-\d+` token is ever constructed.

## What changed

- New module
  [src/lib/programs/deliverable-evidence-trace.ts](../../../src/lib/programs/deliverable-evidence-trace.ts):
  - Canonical status tuple
    `DELIVERABLE_EVIDENCE_TRACE_STATUSES = ['supported',
    'partially_supported', 'unsupported', 'missing', 'stale',
    'blocked']`.
  - Public types: `DeliverableEvidenceTrace`,
    `DeliverableEvidenceTraceStatus`,
    `DeliverableEvidenceClaim`, `DeliverableEvidenceClaimBucket`,
    `DeliverableEvidenceGap`, `DeliverableEvidenceGapKind`,
    `DeliverableEvidenceSource`, `DeliverableEvidenceTraceSummary`,
    `DeliverableEvidenceApprovalImplication`,
    `DeliverableEvidenceApprovalRecommendation`.
  - Public helpers: `buildDeliverableEvidenceTrace`,
    `buildTracesForArtifacts`.
  - Re-exports for test introspection:
    `DELIVERABLE_EVIDENCE_TRACE_SOURCE_CAPTION`,
    `DELIVERABLE_EVIDENCE_CLAIM_BUCKETS`.
  - `createdFrom` is the canonical literal
    `'deterministic_evidence_trace_seed'`.

- New Server Component
  [src/components/programs/DeliverableEvidenceTracePanel.tsx](../../../src/components/programs/DeliverableEvidenceTracePanel.tsx):
  - Reads only from the prebuilt `DeliverableEvidenceTrace`
    view-model.
  - Header with PDEL8 eyebrow, artifact title, program / tenant /
    phase metadata, and a status pill.
  - Summary strip with supported / partial / unsupported / stale /
    blocked / source counts.
  - Five claim groups (`supported`, `partially supported`,
    `unsupported`, `stale`, `blocked`); each blocked claim row
    carries the verbatim `blockReason`; each stale row carries the
    verbatim `staleNote`.
  - Source artifacts list with a per-source usability chip.
  - Approval implication block — recommendation pill, rationale,
    preconditions list, and an explicit "advisory only" caption.
  - Deterministic-source caption in the footer
    (`DELIVERABLE_EVIDENCE_TRACE_SOURCE_CAPTION`).
  - Root carries `data-deliverable-evidence-trace-panel="pdel8"` and
    `data-trace-status={trace.status}`.
  - No state, no effects, no model calls, no `Date.now`,
    `Math.random`, `new Date(`, or `fetch(` calls.

- New tests
  [src/__tests__/integration/programs/deliverable-evidence-trace.test.ts](../../../src/__tests__/integration/programs/deliverable-evidence-trace.test.ts):
  - Canonical status tuple in canonical order.
  - Determinism — byte-equal output for synthetic and real artifacts.
  - Seed coverage — synthetic Acme charter resolves
    `evid-seed-acme-charter-1`; synthetic Meridian intelligence
    workshop resolves the seed `workshop_summary` entry.
  - Unsupported claims surfaced (intermediate-only, missing,
    tenant-scope-mismatch).
  - Blocked evidence displayed with verbatim reason and approval
    implication preconditions.
  - Stale evidence downgrade (alone → status `stale`; mixed with
    usable → `partially_supported`).
  - No fake citations — every supported claim resolves to an
    `evid-seed-` prefixed id from EVID2 and carries
    `usable_as_evidence`; serialized output contains no
    production-shaped `E-\d{2,}` tokens and no `https://` URLs.
  - Summary reconciliation — counts match per-bucket arrays;
    approval implication is always `advisoryOnly: true`.
  - Module hygiene — no Sentinel / Atlas / Nexus / Agent / Source /
    Auth / mock / supabase imports; no `Date.now`,
    `Math.random`, `new Date(`, `fetch(`, anthropic, openai,
    `useState`, `useEffect`; no "Coming soon" / "TBD" / "Lorem
    ipsum" placeholder language; no `E-###` tokens in source.

- Updated `docs/build/build-slices.json` with PDEL8 set to
  `code_complete`, depending on PDEL, EVID2, EVID3, with `risk: low`
  and the four-file allowlist.

- Updated `docs/build/production-readiness.json` to acknowledge the
  PDEL8 deliverable evidence trace panel under
  `deliverables_artifacts` and `data_evidence_knowledge_fabric`.
  PDEL8 is conservative: no component is promoted, no blocker is
  closed.

## Canonical trace statuses

PDEL8 returns exactly one of six statuses per deliverable. The
canonical order is contract-level and matches the public tuple.

1. `supported` — every matching EVID2 entry is
   `usable_as_evidence` with no negative signals.
2. `partially_supported` — at least one usable entry exists but
   partial (cited / quality_checked), unsupported (intermediate),
   stale, or blocked entries also match. **Or**: only partial-grade
   entries match (cited / quality_checked) with nothing usable.
3. `unsupported` — only intermediate-state matching entries (loaded,
   parsed, indexed, classified, scoped) exist; nothing has reached
   usable_as_evidence.
4. `missing` — no matching entries exist for the artifact, or no
   same-tenant entries exist at all.
5. `stale` — only stale-flagged matching entries exist (no usable,
   no blocked, no partial).
6. `blocked` — at least one matching entry is `blocked` and no
   usable entry covers the deliverable.

## Linkage rule

A ledger entry matches a deliverable iff:

- `entry.tenantKey === artifact.tenantKey`, **and**
- `entry.linkedPrograms` includes `${tenantKey}/${programSlug}`,
  **or**
- `entry.linkedDeliverables` includes one of the canonical ledger
  keys for the artifact type:

  | Artifact type           | Canonical EVID2 deliverable keys |
  | ----------------------- | -------------------------------- |
  | uploaded_document       | charter                          |
  | workshop_notes          | workshop_summary                 |
  | spreadsheet             | value_ledger                     |
  | other                   | (none — program-link only)       |

This is intentionally conservative: PDEL8 does not invent linkages
that EVID2 doesn't carry. When EVID2 widens the canonical deliverable
key set, the table above grows in lockstep.

## Approval implication

The approval implication is **advisory only**. PDEL8 surfaces one of:

- `ready_for_review` — every matching EVID2 entry is usable.
- `hold_for_supporting_evidence` — partial / stale / unsupported
  entries remain.
- `blocked_until_evidence_resolved` — at least one matching entry is
  blocked and no usable entry covers the deliverable.
- `no_supporting_evidence` — no matching entries exist at all.

Preconditions are sourced from EVID2 directly: every blocked entry's
`blockReason` and every stale entry's `staleNote` carries through to
the precondition list verbatim.

## What is deterministic today

- Same inputs → byte-equal output (test enforced).
- Every supported claim resolves to a seeded `evid-seed-` id and the
  EVID2 state of that id is `usable_as_evidence` (test enforced).
- Every blocked claim emits a non-empty `blockReason` (hard rule,
  test enforced).
- No `https://` URLs and no production-shaped `E-\d{2,}` tokens
  appear in the serialized trace (test enforced).
- `approvalImplication.advisoryOnly === true` for every trace (test
  enforced).
- Module hygiene: no forbidden imports, no `Date.now`,
  `Math.random`, `new Date(`, `fetch(`, anthropic, openai, useState,
  useEffect, "Coming soon", "TBD", or "Lorem ipsum" (test enforced).

## What is NOT yet wired

- Approval state machine — recommendation is advisory only.
- Live evidence ingest — EVID2 lifecycle remains seeded.
- Production-shape `E-\d+` citation registry — deferred until the
  evidence registry binding lands.
- NLP-based contradiction detection — PDEL8 only reports buckets; it
  does not surface contradictions across deliverable claims (those
  remain owned by EVID3).

## What is deferred

- **PDEL9 · live evidence registry binding** — will allow PDEL8 to
  flip from `evid-seed-` ids to real `E-\d+` citations without
  changing the trace contract.
- **PDEL10 · approval workflow** — wires the steward gate; PDEL8's
  recommendation becomes the default starting state for review.
- **PDEL canvas integration** — mounting PDEL8 inside the artifact
  canvas selection pane is owned by a follow-up canvas slice.

## Honest fallbacks used

- The footer caption explicitly names the deterministic seed and
  disclaims live retrieval / model invocation.
- The approval block carries an "advisory only" caption.
- Every blocked claim row surfaces the EVID2 `blockReason` verbatim;
  a missing reason becomes "no reason recorded in EVID2".
- Module imports nothing from Source UI, Sentinel / Atlas / Nexus /
  Agent runtime, legacy `/programs`, `mock.ts`, auth, or supabase.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/programs/deliverable-evidence-trace.test.ts` — pass
- `npm run build` — pass
- Regressions: `npx jest src/__tests__/integration/architecture/evidence-claim-support.test.ts` — pass
- Regressions: `npx jest src/__tests__/integration/programs/program-artifact-canvas.test.ts` — pass

## Status

Code complete. Pending founder review.
