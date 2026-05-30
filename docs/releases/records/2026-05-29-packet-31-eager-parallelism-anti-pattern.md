# 2026-05-29-packet-31-eager-parallelism-anti-pattern

## Release ID

`2026-05-29-packet-31-eager-parallelism-anti-pattern`

## Status

`candidate`

## Plain-English Summary

This release records a new operating-model rule learned from the production
stability fixes: retrieval code should not ask the database many questions at
once unless that parallelism is explicitly approved and budgeted.

## Layer Impact

- Operating model: adds the "Eager parallelism in retrieval paths" anti-pattern
  to Packet 31 amendments.
- App control lane: no runtime behavior change.
- Data plane: no schema or migration change.
- Release lane: records the discipline behind PRs #2443, #2444, and #2445.

## Client Applicability

- All clients: yes. The rule applies to shared multi-tenant retrieval paths.
- Specific clients: none.
- Internal only: engineering governance artifact.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds detection guidance for eager retrieval fan-out.
- Adds the universal fix shape: sequential by default; parallel retrieval
  requires an allowlist and concurrency budget.
- Records the three resolved instances: Strategic Moves, Intelligence Context,
  and Source/Tower access policy.

## QA / Validation

- PASS: `git diff --check`

## Rollout Plan

Merge as docs-only governance update after review/CI green.

## Rollback Plan

Revert the documentation PR. No runtime rollback is required.

## Audit Evidence

- PR #2443 fixed Strategic Moves portfolio fan-out.
- PR #2444 fixed Intelligence Enterprise Context fan-out.
- PR #2445 fixed Source/Tower access-policy fan-out.
- Production validation after #2445: authenticated crawl passed, health stayed
  green, and final `EMAXCONNSESSION` log sweep returned no logs.

## Known Gaps

- This amendment documents the rule. A future CI rule can enforce the static
  `Promise.all` retrieval-path scan described in the catalog entry.
