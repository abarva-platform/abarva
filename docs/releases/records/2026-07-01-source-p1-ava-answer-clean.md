# 2026-07-01-source-p1-ava-answer-clean — Source P1 Ava Answer Cleanup

## Release ID

`2026-07-01-source-p1-ava-answer-clean`

## Status

`candidate`

## Plain-English Summary

Source P1 evaluation answers now keep the sourcing advice visible without exposing internal table names or answer scaffolding. The Source aVa API also accepts common request field aliases such as `question`, so signed-in browser and QA calls exercise the intended question instead of falling back to the generic Source read.

## Layer Impact

- `global-control-lane`: Updates shared Source answer construction and Source aVa API request normalization for all Source tenants using this runtime path.
- `public-demo`: Improves the SkyHarbor Source P1 evaluation demo by keeping scorecard, BAFO, and finalist answers cleaner for CXO-facing review.

## Client Applicability

- All clients: Source aVa request normalization and answer rendering cleanup apply universally.
- Specific clients: SkyHarbor Source P1 proof is the primary validation target.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/source/nexus-api.ts`: accepts `prompt`, `question`, `message`, or `text` as the user prompt field.
- `src/lib/source/source-answer-engine.ts`: removes internal scaffolding such as `Mode:`, `Current state:`, `source_events`, and raw Source artifact labels from user-facing Source aVa answer parts.
- `src/lib/source/__tests__/source-answer-engine.test.ts`: adds regression checks that evaluation answer text and rendered response parts do not leak internal scaffolding.

## QA / Validation

- `npx jest src/lib/source/__tests__/source-answer-engine.test.ts --runInBand` — passed, 44 tests.
- `npx eslint src/lib/source/source-answer-engine.ts src/lib/source/nexus-api.ts src/lib/source/__tests__/source-answer-engine.test.ts` — passed.
- `git diff --check` — passed.
- `npm run release:check` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — reached repo-wide pre-existing dependency/type gaps unrelated to this patch (`js-yaml`, Azure Document Intelligence, and axe Playwright typings); scoped Source TypeScript paths are covered by Jest and ESLint above.

## Rollout Plan

Merge to `main`, build and deploy through the approved Azure Container Apps main lane, then run signed-in Source browser/API proof on the SkyHarbor evaluation stage.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow.
- Shared runtime mutators: Source aVa API and Source answer engine.
- Approved image digest: To be recorded after deployment.
- ACA runtime invariant: Verify `ca-abarva-web-lab-eastus` active revision and 100% ingress traffic.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this commit or shift ACA traffic back to the prior healthy revision if live Source proof fails. No schema or data-plane rollback is required.

## Audit Evidence

- PR URL: To be recorded.
- CI run: To be recorded.
- Deployment run and ACA revision: To be recorded.
- Signed-in Source proof ZIP: To be recorded.

## Known Gaps

Live signed-in proof and deployment evidence are pending until this candidate is merged and deployed.
