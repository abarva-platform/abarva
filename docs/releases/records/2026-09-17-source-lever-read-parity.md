# 2026-09-17-source-lever-read-parity - Align Source lever reads

## Release ID

`2026-09-17-source-lever-read-parity`

## Status

`candidate`

## Plain-English Summary

Contract detail and the portfolio action sequence now take accountable owner and priority from the same governed action projection. Unsized opportunities name the absent sizing basis instead of a later approval gate. Source and aVa distinguish document evidence from a supported amount.

## Layer Impact

- Release lane: `global-control-lane`.
- Layers 1-3: unchanged. No schema, adapter write, or tenant data mutation.
- Layer 4: tenant-scoped contract read and client-facing Source/aVa presentation.

## Client Applicability

All clients using the governed Source contract action and optimization views. No new tenant exception.

## Changes Included

- Contract detail reads the action-candidate projection for per-opportunity owner and priority, falling back to recorded opportunity detail when absent.
- The portfolio and contract view use recorded priorities ahead of semantic fallback order.
- Unsized claim rows, contract-book annual value, evidence depth, and aVa lever answers distinguish a loaded record from an approved numeric claim.
- User-facing lever titles and date-only timing are formatted without changing persisted source text.

## QA / Validation

- PASS: focused adapter, aVa, ordering, and Source-shell behavior tests.
- PASS: TypeScript, scoped ESLint, and diff whitespace check.
- Pending: CI, ACA digest invariant, and signed-in acceptance against the deployed revision.

## Rollout Plan

Squash-merge after CI; use the repo-owned ACA main deploy workflow. Prove web and worker digest alignment, then verify the portfolio, Contract 360, and aVa answer while signed in.

## Deployment Authority

Only `.github/workflows/aca-main-deploy.yml` may change shared traffic. No manual web update or data-build job is part of this release.

## Rollback Plan

Revert this read/presentation change by PR and deploy through the same workflow. Canonical rows remain unchanged.

## Audit Evidence

Focused test output, PR CI, ACA runtime-invariant artifact, and signed-in acceptance notes.

## Known Gaps

- A source timing narrative still needs a governed correction and data-plane reload before its deadline can be trusted on every surface.
- Supplemental contract detail can carry an annual value while its identity remains outside the governed contract book; this release labels that boundary but does not join the populations.
- The absent case-thread strip and full contract-specific aVa acceptance require separate UI and signed-in proof.
