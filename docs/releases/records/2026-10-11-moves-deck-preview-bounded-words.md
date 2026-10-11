# 2026-10-11 — Bounded reference-deck words generation

## Release ID

`2026-10-11-moves-deck-preview-bounded-words`

## Status

`candidate — local validation passed; signed-in preview pending`

## Plain-English Summary

The read-only investment preview now drafts words in short audited batches instead of asking the model for every slide in one response. Each model call has a 25-second timeout and no automatic SDK retry. A failed batch is retried through the existing audited recovery path, then its affected slides use the established visible fallback if words remain unavailable. Figure lineage, edition restrictions, and physical deck checks still run before a file is returned.

## Layer Impact

- Release lane: `experimental`, behind the existing demo-only reference-deck flag.
- Layer 3: no schema, canonical data, or read-model change.
- Layer 4: bounded model wording for read-only previews. No deck artifact, deliverable run, or sign-off is persisted.

## Client Applicability

Specific clients: only the synthetic demo tenant enrolled in the `moves_reference_deck_v1` feature flag can reach this route. Tenant fencing and figure visibility remain with the existing readers.

## Changes Included

- Batch long slide sequences at six slides per audited model request.
- Bound initial, recovery, and repair model calls to 25 seconds without SDK retries.
- Recover only a failed batch and retain its original slide order.
- Cover the full investment sequence and one failed-batch recovery in focused tests.

## QA / Validation

- **Pass** — Focused words and preview-route tests: 22 passed.
- **Pass** — Raising the batch threshold in a temporary mutation made the full-edition batch test fail; the original source was restored.
- **Pass** — TypeScript typecheck, changed-file ESLint, lib-orphan audit, route/export reachability, test-coverage census, tenancy-fence census, manual check, and all 11 release gates.
- **Pending** — Signed-in production preview; record its result in the PR.

## Rollout Plan

Merge after repository checks and coverage-collision review. The repository-owned ACA main deploy workflow performs rollout. The following signed-in walk must fetch both editions as PPTX and PDF and upload fidelity scores and files.

## Deployment Authority

This candidate does not deploy, shift traffic, run a data job, or issue a direct database command. Model calls continue through audited Anthropic egress.

## Rollback Plan

Revert this change through a pull request or disable the existing demo-only reference-deck flag. The preview route remains read-only.

## Audit Evidence

Focused test output, repository gate results, PR diff, and the subsequent signed-in walk run.

## Known Gaps

- The full investment PPTX and PDF have not yet passed a fresh signed-in walk on this candidate. Local tests verify the shorter request pattern, not production latency.
- A model or audit preflight outage can still yield deterministic fallback words; the fidelity score reports that loss of drafted language.
