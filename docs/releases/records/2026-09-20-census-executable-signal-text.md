# 2026-09-20-census-executable-signal-text — Classify Governed Test Risk From Executable Source

## Release ID

`2026-09-20-census-executable-signal-text`

## Status

`candidate`

## Plain-English Summary

The test coverage census no longer treats words inside comments, prose strings, type-only
declarations, or Promise rejection plumbing as evidence that a product module performs an approval
or tenant-scoped action. Real lifecycle calls, tenant resolvers, runtime tenant identifiers, and
path-based governance signals continue to count.

## Layer Impact

- `internal-admin`: improves the derived ranking used to prioritize unrun test suites.
- Product and data layers: no runtime, schema, tenant-data, or product behavior changes.

## Client Applicability

- All clients: No direct product change.
- Specific clients: None.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Syntax-aware masking for non-executable source text in
  `scripts/quality/test-ci-coverage-census.mjs`.
- Behavior coverage for false-positive and true-positive governed signals.
- Regenerated `docs/architecture/test-ci-coverage-census.json`.

## QA / Validation

- Focused census behavior suite passes.
- Before/after measurement on the rebased main reduced false critical classifications from 54 to
  37 while preserving
  110 high-risk directories and the same top five genuinely governed directories.
- Mutation checks prove that restoring raw-source matching, retaining type-only tenant keys, or
  dropping real executable calls makes the focused behavior suite fail.
- TypeScript, targeted ESLint, behavior suite, and release control must pass before merge.

## Rollout Plan

Squash-merge through the protected repository. The repo-owned ACA main deploy may publish the same
commit, although this internal build-time script has no web-runtime behavior.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Resolved by the repo-owned workflow after merge.
- ACA runtime invariant: Verified by the repo-owned workflow after merge.
- Worker image invariant: Verified by the repo-owned workflow after merge.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No; there is no product surface change.

## Rollback Plan

Revert the squash commit and regenerate the census from the prior classifier. No database or tenant
state rollback is required.

## Audit Evidence

- Pull request and CI checks created from `codex/T017-measure-census-signals`.
- Focused Jest output and before/after generated census counts in the PR validation notes.

## Known Gaps

The approval signal remains intentionally name-based for executable calls. A future symbol-aware
classifier may distinguish unrelated local functions with governance-like names, but this release
does not infer ownership or weaken the current true-positive path.
