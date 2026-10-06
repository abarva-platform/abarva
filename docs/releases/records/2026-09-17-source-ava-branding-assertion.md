# 2026-09-17-source-ava-branding-assertion - Assert The Brand The Product Renders

## Release ID

`2026-09-17-source-ava-branding-assertion`

## Status

`candidate`

## Plain-English Summary

A Source intake-response test asserted the title "Ava sourcing read". The code, its sibling test in the same directory, and the answer engine have all rendered "aVa sourcing read" since 1 July 2026. The assertion was stale, so the test has been failing on `main` continuously since then.

Only the assertion changed. No product behavior changed, and the product spelling is treated as authoritative because three call sites agree on it.

## Layer Impact

`global-control-lane`, test-only. No product code, schema, migration, adapter, projection, route or UI change.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/__tests__/ava-intake-response-parts.test.ts`: the expected title now matches what `ava-intake-response-parts.ts:30` renders.

## QA / Validation

- The repaired suite passes.
- Broad Source aVa pattern on the merge base: 525 of 525 tests pass across 56 suites.
- Scoped ESLint clean.

## Why it stayed red for ten weeks

The pre-commit test scripts are narrowly scoped — `test:nav` covers `tests/unit/nav-active-state`, `test:behaviors` covers `src/__tests__/behaviors`, `test:integration` covers `src/__tests__/integration`. `src/lib/source/__tests__` is reached only by the bare `jest` script, and repository rulesets are in speed mode, which does not block merges on queued runners. A failing assertion in that directory is therefore invisible to the routine path.

Two files under `scripts/audit/__tests__` are also collected by jest while containing no jest tests, so a bare `jest` run reports them as failed suites. That is a collection artifact rather than a defect, and it is not changed here: narrowing the jest test match is a shared-config decision that deserves its own change.

## Rollout Plan

Squash-merge after required checks pass. No deploy is required for a test-only change; it rides the next ACA main deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None.
- Approved image digest: Not applicable to a test-only change.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: None.

## Rollback Plan

Revert through a new PR. No runtime effect either way.

## Audit Evidence

PR link and test output to be added when available.

## Known Gaps

- The routine pre-commit scripts still do not cover `src/lib/source/__tests__`, so the next stale assertion there will also stay red unnoticed. Widening that scope, and deciding whether `scripts/audit/__tests__` should be collected at all, are separate changes.
