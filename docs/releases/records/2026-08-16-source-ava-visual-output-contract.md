# 2026-08-16-source-ava-visual-output-contract — Source aVa Visual Output Contract

## Release ID

`2026-08-16-source-ava-visual-output-contract`

## Status

`candidate`

## Plain-English Summary

Source aVa now receives explicit instructions to return renderable visual and table output when the user asks for it. The prior Source prompt allowed chart-style prose but discouraged chart fences, so visual requests could produce useful words without a chart the interface could render. A follow-up tightening removes the remaining Source-specific chart-fence ban and adds a turn-level visual contract whenever the user's message asks for a chart, graph, trend, or similar visual.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: updates the Source chat prompt contract only. It does not change canonical facts, calculations, source adapters, or persistence.

## Client Applicability

- All clients: yes, for Source aVa turns.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/chat/agent/route.ts`: Source prompt now requires `abarva-chart` fenced output for explicit visual requests and compact markdown tables for explicit table/ranking requests.
- `src/app/api/chat/agent/route.ts`: Source prompt now adds a turn-specific visual directive when the incoming Source message asks for chart/graph/trend output, so chart requests are handled by prompt discipline instead of post-response filtering.
- `src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts`: regression coverage pins the Source visual/table output contract.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts --runInBand`
- Pass: `npx eslint src/app/api/chat/agent/route.ts src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts`
- Pass: `npm run release:check`
- Pending: post-deploy signed-in Source aVa chart/table prompt rerun.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the web image. Live proof should rerun Source aVa chart/table questions after deployment.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required by the deploy proof bundle.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, rerun representative Source aVa visual/table prompts.

## Rollback Plan

Revert this PR to restore the previous Source prompt wording.

## Audit Evidence

- PR URL, CI checks, deploy proof bundle, and post-deploy Source aVa hard-QA excerpt.

## Known Gaps

This change improves model instruction discipline. It does not add new source data, new chart renderers, answer post-processing, or upload/parse persistence.
