# 2026-09-16-source-ava-named-contract-binding — Bind named contract questions safely

## Release ID

`2026-09-16-source-ava-named-contract-binding`

## Status

`candidate`

## Plain-English Summary

When a Source question names a supplier other than the contract open on the page, aVa now checks the authorized contract directory before answering. A unique match gets only the directory facts available for that contract; multiple matches require an exact contract ID. The open contract's opportunity values and evidence are not borrowed for either case.

## Layer Impact

- `global-control-lane`, Layer 4 Source aVa answer composition. The tenant-scoped contract directory remains the input; no intake, adapter, canonical, or schema change is included.

## Client Applicability

- All clients using Source Contract 360 Ask aVa with an authorized contract directory.
- No tenant-specific data mutation or feature flag.

## Changes Included

- Name-based lookup of the current tenant's contract directory with ambiguity refusal.
- Directory-only response for a different named contract, including the optimization-export path.
- Focused behavior regressions for unique, ambiguous, and export questions.

## QA / Validation

- Two named-supplier regression tests failed before the fix and pass afterward.
- Focused visual-answer suite: 16 tests passed.
- Scoped ESLint and TypeScript: passed.
- Broader Source aVa cluster: 18 suites passed, 3 suites failed (7 tests), outside this resolver. These failures remain open and are not counted as acceptance.
- Signed-in aVa question proof: pending deployment and separate tenant-chat-write approval.

## Rollout Plan

Merge through a reviewed PR and deploy through the repo-owned ACA main workflow after separate approval. No migration or data build is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the deploy workflow.
- ACA runtime invariant: verify after deployment.
- Worker image invariant: verify after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: ask about a different, uniquely named supplier and an ambiguous supplier while a contract is open; verify no selected-contract figures leak.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No schema or data rollback is needed.

## Audit Evidence

PR diff, local tests, release gate, deploy readback, and signed-in aVa answer proof when available.

## Known Gaps

This guard does not load another contract's full detail packet or answer beyond its directory facts. Broader aVa test failures and the full six-question contract acceptance set remain open.
