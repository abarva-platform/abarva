# 2026-08-23-source-ava-hard-qa-selection — Source aVa Hard-QA Slice Runner

## Release ID

`2026-08-23-source-ava-hard-qa-selection`

## Status

`candidate`

## Plain-English Summary

The Source aVa hard-question audit can now run a selected subset of the 50-question pack while still validating the full bank. This lets operators run live answer QA in small, stable batches instead of forcing every question through one long API/browser session.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source aVa QA tooling only. No Source route, prompt, UI, persistence, or tenant data behavior changes are included.
- Controls / QA: Adds selection metadata to the report so auditors can see exactly which questions were executed and which remained unrun.

## Client Applicability

- All clients: The audit harness is tenant-agnostic.
- Specific clients: None.
- Internal only: Source aVa QA execution.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/audit/source-ava-hard-qa.mjs`
- `scripts/audit/__tests__/source-ava-hard-qa.test.ts`

## QA / Validation

- `NODE_PATH=/Users/anand/Projects/nexus/node_modules node --test scripts/audit/__tests__/source-ava-hard-qa.test.ts` passed.
- `npx eslint scripts/audit/source-ava-hard-qa.mjs scripts/audit/__tests__/source-ava-hard-qa.test.ts` passed from the clean release worktree.
- `NODE_PATH=/Users/anand/Projects/nexus/node_modules node scripts/audit/source-ava-hard-qa.mjs --out-dir /tmp/source-ava-hard-qa-selected-proof --ids OPT-001,OPT-004 --fail-on-question-bank` passed and produced `SELECTED=2/50`.

## Rollout Plan

Merge to `main` through a pull request. The repo-owned ACA workflow may deploy the resulting image because main merges trigger it, but this is an internal QA-tooling change and does not require signed-in UI proof to claim the tooling behavior.

## Deployment Authority

- Repo-owned deploy workflow: Standard main deploy workflow if triggered by merge.
- Shared runtime mutators: None.
- Approved image digest: Not applicable before merge.
- ACA runtime invariant: Required only before claiming any runtime deployment live; not required to claim this audit-tool behavior.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No for this tooling change. Live aVa answer quality still requires captured live responses.

## Rollback Plan

Revert the pull request to restore the previous all-or-nothing hard-QA execution behavior.

## Audit Evidence

- Local selected-run proof: `/tmp/source-ava-hard-qa-selected-proof`.
- Local Node test output and ESLint output from the clean release worktree.

## Known Gaps

This does not complete live execution of all 50 aVa questions. It makes that execution reliable by allowing controlled slices.
