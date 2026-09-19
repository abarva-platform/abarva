# 2026-09-19-intelligence-agent-tool-gate - Intelligence Agent Tool Gate

## Release ID

`2026-09-19-intelligence-agent-tool-gate`

## Status

`candidate`

## Plain-English Summary

This change makes pattern search prefer a pattern whose identifier, slug, or name matches the query
over a pattern that only repeats the same words in descriptive prose. It updates neighborhood tests
to the current canonical pattern identifier and adds all five Intelligence agent-tool suites to the
existing AI surface control gate.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4 - Products: deterministic Intelligence pattern ranking and agent-tool test coverage.
- CI governance: five previously unowned suites now run on every pull request and main push.
- Layers 1-3: unchanged.

## Client Applicability

- All clients: shared Intelligence pattern retrieval behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/agent/tools/intelligence/_shared.ts`
- `src/lib/agent/tools/intelligence/__tests__/_shared.test.ts`
- `src/lib/agent/tools/intelligence/__tests__/sentinel-tools.test.ts`
- `.github/workflows/ai-surface-control-catalog.yml`
- `docs/architecture/test-ci-coverage-census.json`

## QA / Validation

- PASS - Intelligence agent-tool directory, 5 suites / 49 tests.
- PASS - controlled mutation removing the signature preference failed the ranking test.
- PASS - current canonical neighborhood pattern emits graph and pattern artifacts.
- PASS - CI coverage census refreshed after workflow ownership was added.
- PASS - TypeScript with an 8 GB heap.
- PASS - scoped ESLint.
- PASS - `npm run release:check`.

## Rollout Plan

Merge through a pull request. The repository-owned ACA workflow may carry the deterministic ranking
change in the next web image. No data build, migration, flag, or manual runtime action is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None.
- Approved image digest: established by the deploy workflow after merge.
- ACA runtime invariant: required before calling the ranking change deployed.
- Worker image invariant: required if the deploy workflow updates a worker.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before calling the product behavior live-proven.

## Rollback Plan

Revert the pull request. Pattern ranking and CI ownership return to their previous behavior; no data
state needs reversal.

## Audit Evidence

- Local validation commands and the mutation proof are recorded in the pull request.

## Known Gaps

Authenticated product proof remains separate from repository, CI, merge, and deployment proof.
