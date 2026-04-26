# EVID3 - Evidence Claim Support Model

Slice ID: EVID3
Slice name: Evidence Claim Support Model
Status: code_complete
Authored: 2026-04-25
Primary agent: Steward
Depends on: EVID2

## Purpose

EVID3 lands the deterministic, file-pure evaluator that scores how
well a claim made against a canonical work object is supported by the
EVID2 Evidence Ledger MVP. Given a single claim and the EVID2 entry
slice, EVID3 returns one of seven canonical support statuses with a
short rationale, a structured list of gaps, and a structured list of
contradictions.

EVID3 is the read-only successor to EVID2. It does not push the
ledger forward, does not introduce new evidence, and does not
fabricate citations. It only reads what EVID2 already contains.

EVID3 is part of Lane D in the parallel build pack. It does not call
the Model Gateway, does not retrieve from any persistence layer, does
not parse uploaded files, and does not resolve real citations.

## What Changed

- New module
  [src/lib/architecture/evidence-claim-support.ts](../../../src/lib/architecture/evidence-claim-support.ts):
  - Canonical status tuple
    `EVIDENCE_CLAIM_SUPPORT_STATUSES = ['supported',
    'partially_supported', 'unsupported', 'contradicted',
    'missing_evidence', 'stale_evidence', 'out_of_scope']`.
  - Public types: `EvidenceClaimSupportStatus`,
    `EvidenceClaimWorkObjectKind`, `EvidenceSupportedClaim`,
    `EvidenceClaimGapKind`, `EvidenceClaimGap`,
    `EvidenceClaimContradiction`, `EvidenceClaimSupportConfidence`,
    `EvidenceClaimSupportResult`, `EvidenceClaimSupportSummary`.
  - Public helpers: `evaluateClaimSupport`,
    `evaluateClaimsForWorkObject`, `summarizeClaimSupport`,
    `getUnsupportedClaims`.

- New tests
  [src/__tests__/integration/architecture/evidence-claim-support.test.ts](../../../src/__tests__/integration/architecture/evidence-claim-support.test.ts):
  - Canonical status tuple in canonical order.
  - One test per status branch (`supported`, `partially_supported`,
    `unsupported` via blocked-only, `unsupported` via
    intermediate-only, `contradicted`, `missing_evidence`,
    `stale_evidence`, `out_of_scope`).
  - `evaluateClaimsForWorkObject` returns one result per claim,
    deterministic byte-equal output across repeated calls.
  - `summarizeClaimSupport` reconciles totals, byStatus,
    unsupportedCount, contradictedCount, and averageConfidenceLabel,
    and returns honest zeros plus low confidence for empty input.
  - `getUnsupportedClaims` returns only `unsupported`,
    `missing_evidence`, `stale_evidence`, and `contradicted`.
  - Serialized output of bulk evaluation contains no production-shaped
    `E-\d{2,}` tokens.
  - Module hygiene: no imports from
    `@/lib/sentinel|atlas|nexus|agent|source|auth` or supabase; no
    `Date.now`, `Math.random`, `new Date(`, `fetch(`, anthropic,
    openai, useState, useEffect, "Coming soon", "TBD", or "Lorem
    ipsum".

- Updated `docs/build/build-slices.json` with EVID3 set to
  `code_complete`, depending on EVID2, with `risk: low` and the
  five-file allowlist.

- Updated `docs/build/production-readiness.json` to acknowledge the
  EVID3 claim-support evaluator under
  `data_evidence_knowledge_fabric` and `audit_governance`. EVID3 is
  conservative: no component is promoted, no blocker is closed.

## Canonical Support Statuses

EVID3 returns exactly one of seven statuses per claim. The canonical
order is contract-level and matches the public tuple.

1. `supported` - At least one matching evidence entry has reached
   `usable_as_evidence`, and every id in
   `expectedSupportingEvidenceIds` (if provided) is present in the
   matching usable set. Confidence: `high`.
2. `partially_supported` - At least one matching usable entry exists
   but the caller-supplied `expectedSupportingEvidenceIds` includes
   ids that are not present. Confidence: `medium`.
3. `unsupported` - Either every matching entry is `blocked`, or no
   matching entry has reached `usable_as_evidence`. Confidence:
   `low`.
4. `contradicted` - At least one matching entry is
   `usable_as_evidence` AND directly contradicts the claim (see
   contradiction rule below). Confidence: `high`.
5. `missing_evidence` - The tenant has evidence, but none of it is
   linked to the claim's work object. Confidence: `low`.
6. `stale_evidence` - The matching entries (excluding any blocked
   entries) all carry a `stale` annotation in `qualityNotes`, and
   none are usable. Confidence: `low`.
7. `out_of_scope` - No evidence exists for the claim's tenant.
   Confidence: `low`.

## Evaluation Rules

The evaluator is deterministic and proceeds in fixed order:

1. Tenant filter. Reduce `evidenceEntries` to those with
   `entry.tenantKey === claim.tenantKey`. If empty, return
   `out_of_scope` with a `tenant_scope_mismatch` gap.

2. Work-object filter. Reduce the same-tenant slice to those linked
   to the claim's work object. The linkage rule is:

   - `program | phase | workshop | artifact` -> `linkedPrograms`
     contains `workObjectId`.
   - `pattern | tower_dimension` -> `linkedPatterns` contains
     `workObjectId`.
   - `dataset_domain` -> `linkedDatasetDomains` contains
     `workObjectId`.

   If empty, return `missing_evidence` with a
   `no_matching_evidence` gap.

3. Contradiction sweep. For every entry in the matching slice,
   check whether `entry.claim.text` or any `entry.qualityNotes`
   string contains the substring `contradicts <claim.claimId>`. If
   so, record an `EvidenceClaimContradiction` for that entry. This
   is intentionally a substring rule: EVID3 cannot do NLP and is
   honest about that. The token shape is documented so callers can
   author contradicting evidence explicitly.

4. Contradicted by usable. If any contradicting entry is
   `usable_as_evidence`, return `contradicted`. Confidence: `high`.

5. Blocked-only. If every matching entry has `state === 'blocked'`
   and there is no usable entry, return `unsupported` with an
   `evidence_blocked` gap.

6. Stale-only. If there is no usable entry, but every non-blocked
   matching entry carries a `stale` annotation in `qualityNotes`
   (case-insensitive substring match), return `stale_evidence` with
   an `evidence_stale` gap.

7. Intermediate-only. If there is still no usable entry, return
   `unsupported` with a `no_matching_evidence` gap. The rationale
   names the intermediate states observed.

8. Usable found. Compare matching usable ids against
   `expectedSupportingEvidenceIds`. If expected ids exist and any
   are missing, return `partially_supported` with a
   `no_matching_evidence` gap that names the missing ids. Otherwise
   return `supported`.

The evaluator never short-circuits in a non-deterministic way:
ordering of entries in the input slice does not change the returned
status. Sorted, deduplicated `supportingEvidenceIds` are returned in
both `supported` and `partially_supported` cases.

## No-Fabrication Invariants

- EVID3 imports only from `@/lib/architecture/evidence-ledger-mvp`.
  It does not import Sentinel, Atlas, Nexus, Agent, Source, Auth,
  or supabase.
- EVID3 does not call any model provider. There is no NLP, no LLM,
  no embedding service, and no live retrieval.
- EVID3 does not construct any `E-\d+` production-shaped citation
  identifier. It works strictly with the `evid-seed-` prefixed ids
  carried by EVID2 entries.
- EVID3 does not call `Date.now`, `new Date(`, `Math.random`, or
  `fetch(`.
- Contradiction detection is a documented substring rule
  (`contradicts <claimId>`) so callers can author counter-evidence
  explicitly without a model in the loop.
- Staleness is modeled as a `qualityNotes` substring match
  (`stale`, case-insensitive) because EVID2 has no first-class
  stale state. This is documented and tested.

## Confidence Model

- `supported` -> `high`.
- `partially_supported` -> `medium`.
- `unsupported`, `missing_evidence`, `stale_evidence`,
  `out_of_scope` -> `low`.
- `contradicted` -> `high` (the contradiction is itself usable
  evidence).

`summarizeClaimSupport` translates the per-result confidence into a
weighted average label (`low` < 1.5, `medium` < 2.5, `high`
otherwise). For empty input the average is `low`.

## What Is Honest About This Slice

- EVID3 is a deterministic evaluator over a deterministic seed
  ledger. It does not introduce any new evidence and never claims
  more than EVID2 contains.
- The status set is fixed at seven values and matches the
  contract-level tuple.
- All output is tagged `evidence_claim_support_v1`. Any future
  revisions will move to a new evaluator string rather than mutate
  this one in place.
- All result objects carry `createdFrom: 'deterministic_seed'` so
  consumers can prove the evaluator was deterministic.

## What Is Deferred

- Live evidence ingest, persistence, and retrieval (Lane B / Source
  pipeline) - not implemented.
- Real NLP-driven contradiction detection - deferred to a Sentinel
  / Atlas review stage.
- Quality scoring beyond the canonical confidence labels - deferred.
- UI surfaces that render claim-support results inside Programs,
  Intelligence, Tower, or Admin - deferred.
- Wiring of EVID3 into Atlas brief, Sentinel detections, or Steward
  audit dashboards - deferred until a future EVID4 slice.

## How EVID3 Affects Production Readiness

EVID3 is conservative on the production readiness manifest:

- `data_evidence_knowledge_fabric` gains a note that the EVID3
  claim-support evaluator has been added (deterministic; no
  fabricated citations). The component status, blockers, and next
  action are unchanged.
- `audit_governance` gains a note that EVID3 surfaces unsupported
  and contradicted claims for audit visibility. The component
  status, blockers, and next action are unchanged.
- No component is promoted. The live evidence pipeline,
  persistence, audit ledger, and security review remain explicit
  blockers.

## Validation

Required validation for this slice:

- `npx tsc --noEmit --pretty false` - pass
- `npx jest src/__tests__/integration/architecture/evidence-claim-support.test.ts` - pass
- `npx jest src/__tests__/integration/architecture/evidence-ledger-mvp.test.ts` - pass (EVID2 unchanged)
- `npm run build` - pass
- `python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"` - pass

## Status

Code complete. Pending founder review. EVID3 does not push, merge, or
deploy.
