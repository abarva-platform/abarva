# 2026-06-22-source-sentinel-fixture-dedupe — Source Sentinel test fixture dedupe

## Release ID

`2026-06-22-source-sentinel-fixture-dedupe`

## Status

`candidate`

## Plain-English Summary

Removes a duplicate `agentResponseParts` property from the Source Sentinel chat test fixture. The duplicate blocked the main Reasoning Layer Guard after the Home all-tenant merge, even though runtime behavior was unchanged.

## Layer Impact

- `global-control-lane`: test-only CI repair for the shared Source/Reasoning guard.
- `client-data-lane`: no client data, schema, ingestion, migration, or retrieval change.

## Client Applicability

- All clients: yes, because it unblocks the shared CI/deploy chain.
- Specific clients: no client-specific behavior change.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/__tests__/sentinel-chat-llm.test.ts`: removes the duplicate fixture key.

## QA / Validation

- `npx jest src/lib/source/__tests__/sentinel-chat-llm.test.ts --runInBand` — passed.
- `npx eslint src/lib/source/__tests__/sentinel-chat-llm.test.ts` — passed.
- `git diff --check` — passed before commit.
- Local full `tsc` was not usable as proof in this worktree because local dependency typings/packages are missing (`js-yaml`, Azure Document Intelligence, axe); GitHub CI is the authoritative typecheck for this one-line fixture repair.

## Rollout Plan

Merge to `main`; repo-owned CI and deploy workflows can resume. No data migration, manual environment change, or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: yes, normal main deploy after merge.
- Shared runtime mutators: none.
- Approved image digest: captured by ACA deploy evidence after merge if a deploy runs.
- ACA runtime invariant: standard deploy invariant.
- Worker image invariant: standard deploy invariant.
- Feature/env flag update path: none.
- Live signed-in proof required: no for this test-only repair; downstream Home/Intelligence browser proof remains required for the active surface work.

## Rollback Plan

Revert this PR if needed. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deploy run: pending.

## Known Gaps

This only fixes the CI fixture duplicate. It does not itself prove browser behavior.
