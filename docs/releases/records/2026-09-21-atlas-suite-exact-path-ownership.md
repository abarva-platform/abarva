# 2026-09-21-atlas-suite-exact-path-ownership — Atlas suites gain behavioral ownership

## Release ID

`2026-09-21-atlas-suite-exact-path-ownership`

## Status

`candidate`

## Plain-English Summary

Seven Atlas test suites that were green but not owned by pull-request CI are triaged by technique,
not just by color. The two suites that read source files as text now exercise the runtime subjects
they describe: scripted Atlas responses and the Atlas model-call payload. The remaining suites are
kept as exact-path CI additions after their imported boundaries were checked against the modules the
subjects actually import.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Atlas/Tower test ownership only. The release changes tests and CI coverage for
existing product behavior; it does not change rendered product output, routes, prompts shipped to
users, tenant data, or runtime data-plane code.

Control plane: The unit-suite workflow and generated test-coverage census are refreshed so future
pull requests run these exact Atlas suites instead of relying on local discovery.

## Client Applicability

- All clients: Indirectly, through stronger pull-request coverage for shared Atlas/Tower behavior.
- Specific clients: None.
- Internal only: Test and release-control evidence only.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/atlas/__tests__/scripted-cxo-language.test.ts`: replaces source-text scanning with
  behavioral calls to `runScriptedAtlasIntent` through mocked `@/lib/atlas/tool-belt` imports.
- `src/lib/atlas/llm-determinism.test.ts`: replaces `llm.ts` source scanning with a call to
  `runAtlasLlm` and an assertion over the mocked audited Anthropic client payload.
- `.github/workflows/unit-suites.yml`: adds one exact-path Jest step for the seven Atlas suites.
- `docs/architecture/test-ci-coverage-census.json`: refreshed from the repository census writer.
- This release record.

## QA / Validation

- `npx jest --runTestsByPath src/lib/atlas/__tests__/scripted-cxo-language.test.ts src/lib/atlas/llm-determinism.test.ts --no-coverage --ci` passed: 2 suites, 4 tests.
- `npx jest --runTestsByPath src/lib/atlas/__tests__/orchestrator-enterprise-read-enrichment.test.ts src/lib/atlas/__tests__/prompt-client-naming.test.ts src/lib/atlas/__tests__/rendered-response.test.ts src/lib/atlas/__tests__/scripted-cxo-language.test.ts src/lib/atlas/__tests__/tower-budget-rollup-resolution.test.ts src/lib/atlas/__tests__/tower-factual-spine.test.ts src/lib/atlas/llm-determinism.test.ts --no-coverage --ci` passed: 7 suites, 32 tests.
- `npx jest --runTestsByPath src/lib/atlas/__tests__/orchestrator-enterprise-read-enrichment.test.ts src/lib/atlas/__tests__/orchestrator-governed-tower.test.ts src/lib/atlas/__tests__/prompt-client-naming.test.ts src/lib/atlas/__tests__/rendered-response.test.ts src/lib/atlas/__tests__/scripted-cxo-language.test.ts src/lib/atlas/__tests__/tower-budget-rollup-resolution.test.ts src/lib/atlas/__tests__/tower-factual-spine.test.ts src/lib/atlas/__tests__/tower-grounding-client-name.test.ts src/lib/atlas/llm-determinism.test.ts --no-coverage --ci` passed: 9 suites, 41 tests.
- `npx jest --runTestsByPath src/__tests__/integration/atlas/atlas-invariants.test.ts src/__tests__/integration/atlas/atlas-tower-grounding-contract.test.ts --no-coverage --ci` passed: 11 passed, 4 skipped.
- `npm run audit:test-ci-coverage:write` refreshed the census to 1,794 workflow-covered files, 1,791 PR-covered files, and 557 files run by no workflow.
- `npm run audit:test-ci-coverage:check` passed with no drift.
- `npx jest --runTestsByPath src/__tests__/behaviors/test-ci-coverage-census.test.ts src/__tests__/behaviors/census-reads-imports-with-a-parser.test.ts src/__tests__/behaviors/census-drift-is-reported.test.ts --no-coverage --ci` passed: 3 suites, 65 tests.
- `npx eslint src/lib/atlas/__tests__/scripted-cxo-language.test.ts src/lib/atlas/llm-determinism.test.ts` passed.
- `node scripts/release-check.mjs --base origin/main --head HEAD` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` did not pass because of pre-existing script-scope globals outside this change: `src/lib/atlas/__tests__/orchestrator-governed-tower.test.ts` redeclares `towerState`, and `src/lib/programs/stage-readiness-workbooks/__tests__/accepted-context.test.ts` redeclares `ctx`. The T-467 rewrite initially exposed and fixed the same issue in `scripted-cxo-language.test.ts`; the remaining diagnostics are not introduced by this diff.
- Mutation proof:
  - Enterprise-read authored block scrub removed: `orchestrator-enterprise-read-enrichment` failed 2 of 11.
  - Prompt client-naming comment decoy: `prompt-client-naming` failed 1 of 1.
  - Rendered-response four-section heading changed: `rendered-response` failed 1 of 3.
  - Governed budget rollups mixed with stale derived rollups: `tower-budget-rollup-resolution` failed 1 of 2.
  - Tower factual-spine evidence phrase removed with the phrase left in a comment: `tower-factual-spine` failed 1 of 11.
  - Scripted response emitted implementation-tool language: `scripted-cxo-language` failed 1 of 1.
  - Atlas model payload used `max_tokens: 500` while the constant and comments remained: `llm-determinism` failed 1 of 3.
- Boundary proof: the Postgres half uses `docs/architecture/data-plane-test-boundary.json` and the
  `^pg$` Jest guard from T-469. Model egress is replaced at the actual imported
  `@/lib/agent/stream` boundary, and scripted/runtime data reads are replaced at the actual imported
  `@/lib/atlas/tool-belt` boundary. No outbound model call, send, migration, or tenant data mutation
  is performed by these suites.

## Rollout Plan

Merge the pull request to `main`. The repo-owned Azure Container Apps deploy workflow may build and
deploy the resulting image, but the changed behavior is limited to tests, workflow ownership, and
release evidence.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only, if this commit reaches
  `main`.
- Shared runtime mutators: None in this release.
- Approved image digest: Not applicable before merge/deploy.
- ACA runtime invariant: Not applicable before merge/deploy; no runtime behavior changes.
- Worker image invariant: Not applicable before merge/deploy; no worker behavior changes.
- Feature/env flag update path: None.
- Live signed-in proof required: No. The product surface is unchanged.

## Rollback Plan

Revert the workflow step, census refresh, release record, and the two test rewrites. No data,
schema, migration, runtime, or client-state rollback is required.

## Audit Evidence

- Focused seven-suite Jest output listed above.
- Mutation proof listed above.
- T-469 data-plane boundary artifact: `docs/architecture/data-plane-test-boundary.json`.
- Pull request and CI evidence after publication.

## Known Gaps

This release does not broaden Atlas coverage by directory. It wires the seven named suites by exact
file path only.
