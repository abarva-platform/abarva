# 2026-09-08-source-deterministic-evidence-normalization - Deterministic Evidence Normalization

## Release ID

`2026-09-08-source-deterministic-evidence-normalization`

## Status

`candidate`

## Plain-English Summary

Source quality review now reconciles equivalent financial and temporal representations without treating ordinary words as numeric suffixes. It continues to block invented values, dates, benchmarks, and causal claims.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 - Products: Source deterministic claim review and Strategy prompt contract.

## Client Applicability

- All clients: Yes.
- Specific clients: None encoded in the release.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Require numeric magnitude suffixes to end at a word boundary.
- Read bare numeric values only from structured financial fact lines.
- Reconcile ISO months with named months and exact dates with less-precise month claims.
- Reconcile equivalent month and year durations.
- Treat an explicit missing-benchmark statement as an evidence gap, not an external market claim.
- Keep file-cited parsed evidence usable for governed drafts while retaining locator review before issue.
- Require causal interpretations to be registered as working hypotheses with owner, action, and impact.
- Bump the Strategy prompt contract to version 5.

## QA / Validation

- Focused Source generation and quality-review tests: 77 passed.
- Scoped ESLint: pass.
- TypeScript no-emit validation with 8 GB heap: pass.
- Git diff check: pass.
- Release governance check: required before merge.

## Rollout Plan

Merge through a squash PR and deploy through the repo-owned ACA main workflow. Regenerate the controlled Strategy artifact and require both deterministic and consulting-grade gates to pass before event progression.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned workflow only
- Approved image digest: captured after deployment
- ACA runtime invariant: template image, 100% traffic revision, and required workers must use the approved digest
- Worker image invariant: verify after deployment
- Feature/env flag update path: none
- Live signed-in proof? Yes

## Rollback Plan

Revert the squash commit through a new PR and deploy the revert SHA. No schema or tenant-data rollback is required.

## Audit Evidence

- PR, merge SHA, and ACA deployment run
- Focused Jest, TypeScript, ESLint, release-check, and diff-check output
- Controlled signed-in generation response, quality metadata, and artifact readback

## Known Gaps

- Deterministic normalization proves representation equivalence, not source authority. Unmatched claims remain blocked.
