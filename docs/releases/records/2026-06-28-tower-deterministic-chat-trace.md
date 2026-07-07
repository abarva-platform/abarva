# 2026-06-28-tower-deterministic-chat-trace — Tower Deterministic Chat Trace

## Release ID

`2026-06-28-tower-deterministic-chat-trace`

## Status

`candidate`

## Plain-English Summary

Tower chat now handles factual top-N Tower questions through the deterministic Tower factual spine instead of falling into a compressed advisory answer. The change also removes the Tower server-side response shaper from the Atlas chat route so the rendered answer is the selected answer, and adds a signed-in trace runner that captures the question, final Claude prompt, raw model response, and rendered response side by side.

## Layer Impact

- `global-control-lane`: Updates shared Tower chat behavior for all tenants using `/api/v1/atlas/chat`.
- `global-control-lane`: Adds QA evidence tooling for prompt/raw/render trace inspection on the deployed app.
- Data plane: No schema, migration, seed, or tenant data changes.

## Client Applicability

- All clients: Tower factual chat behavior and trace tooling.
- Specific clients: None.
- Internal only: QA trace script output.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/atlas/tower-factual-spine.ts`: Adds deterministic top-N IT program, top-N AI program, and plain IT-spend handling.
- `src/lib/atlas/orchestrator.ts`: Stops applying the shared response shaper to Tower chat responses after route selection.
- `src/lib/atlas/__tests__/tower-factual-spine.test.ts`: Adds deterministic top-N regression coverage.
- `scripts/qa/tower-prompt-raw-render-trace.mjs`: Adds signed-in deployed-app trace capture for prompt/raw/render comparison.

## QA / Validation

- PASS: `npx jest src/lib/atlas/__tests__/tower-factual-spine.test.ts --runInBand`
- PASS: `npx eslint src/lib/atlas/tower-factual-spine.ts src/lib/atlas/orchestrator.ts src/lib/atlas/__tests__/tower-factual-spine.test.ts`
- BLOCKED: `npx tsc --noEmit --pretty false` is blocked by existing missing dependency/type declarations outside this change: `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.
- PASS: `npm run release:check`
- PENDING post-deploy: run `node scripts/qa/tower-prompt-raw-render-trace.mjs` against `https://app.abarva.ai` with the SkyHarbor signed-in state and attach the generated `report.html`.

## Rollout Plan

Merge to `main`, build and deploy through the repo-owned Azure Container Apps release path, then run the signed-in trace runner against the deployed revision.

## Deployment Authority

- Repo-owned deploy workflow: Required for live ACA rollout.
- Shared runtime mutators: No local or branch deploy path is introduced.
- Approved image digest: Captured by the deployment workflow.
- ACA runtime invariant: Active revision, template image, and traffic image must match the deployed main digest.
- Worker image invariant: No worker image change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower prompt/raw/render trace on the deployed app.

## Rollback Plan

Revert this PR and redeploy the previous approved main digest. No data rollback is required.

## Audit Evidence

- PR URL.
- CI run.
- ACA deploy evidence.
- `tower-prompt-raw-render-trace-*/report.html` after deployment.

## Known Gaps

The trace runner proves answer path and rendering for selected questions. It does not replace the broader Tower deterministic bank crawl.
