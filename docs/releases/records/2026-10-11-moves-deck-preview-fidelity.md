# 2026-10-11 — Reference-deck wording fidelity follow-up

## Release ID

`2026-10-11-moves-deck-preview-fidelity`

## Status

`candidate — local QA pending; signed-in fidelity proof pending`

## Plain-English Summary

The first bounded preview release returned all requested files, but its model time limit was too short for reliable slide wording. The resulting decks used too many generic fallback sentences. This follow-up uses two audited wording batches for the long edition and gives initial calls more time, while keeping the request under the preview route's limit through shorter recovery and repair calls.

## Layer Impact

- Release lane: `experimental`, behind the existing demo-only reference-deck flag.
- Layer 3: no canonical data, schema, or read-model change.
- Layer 4: wording generation timing and safe error classification for the read-only preview. The figure ledger, edition rules, and physical deck validation remain mandatory.

## Client Applicability

Specific clients: only the synthetic demo tenant enrolled in the `moves_reference_deck_v1` feature flag. Other tenants remain refused before a Move read.

## Changes Included

- Split long editions into two 11-slide audited model calls rather than four concurrent calls.
- Allow 60 seconds for initial wording, 25 seconds for parse recovery, and 20 seconds for targeted repair, without automatic SDK retry.
- Split a failed initial batch into short recovery calls that preserve slide order.
- Classify an initial model-call failure separately from an invalid model response, logging only a safe error name and status.

## QA / Validation

- **Pass** — Focused words and preview-route tests: 22 passed; changed-file ESLint, typecheck, lib-orphan audit, route/export reachability, coverage and tenancy checks, manual check, and all 11 release gates passed.
- **Pass** — A temporary reduction of the initial call limit made the full-edition batch test fail; the source was restored.
- **Not run** — Post-deploy signed-in walk with both editions and file fidelity scores.

## Rollout Plan

Merge after local and PR checks and the coverage-collision review. The repository-owned ACA main deploy workflow owns rollout. The signed-in read-only walk must upload both editions as PPTX and PDF with scores.

## Deployment Authority

This candidate does not deploy, shift traffic, run data jobs, or query a database. Model wording continues through the existing audited Anthropic egress.

## Rollback Plan

Revert this PR through the protected branch path or disable the existing demo-only reference-deck flag.

## Audit Evidence

The PR, local and CI checks, the preceding signed-in walk, and the next signed-in deck-fidelity report.

## Known Gaps

- A live deck with acceptable wording fidelity has not yet been proven on this candidate.
- External model or audit-egress failures can still cause fallback words, which lower the deck-fidelity score.
