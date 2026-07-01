# 2026-07-01-source-p1-evaluation-scorecard — Source P1 Evaluation Scorecard

## Release ID

`2026-07-01-source-p1-evaluation-scorecard`

## Status

`candidate`

## Plain-English Summary

Source now turns the existing Vendor A/B/C response profiles, challenge log, commercial leverage seeds, and BAFO holdbacks into a normalized vendor comparison and evaluation scorecard. The output helps the sourcing team see who is leading, who is cheapest, who carries transition risk, what should advance to BAFO, and what tradeoffs executives need to decide.

## Layer Impact

- `global-control-lane`: shared Source control-plane behavior, Source event stage rendering, and Source aVa answer behavior.
- No client data-plane migration is included.
- No public marketing route is changed.

## Client Applicability

- All clients: the shared Source UI and answer engine can render the new scorecard when a deterministic vendor evaluation view is available.
- Specific clients: the synthetic SkyHarbor AMS demo path is the proof target for Vendor A/B/C data.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none added in this slice.

## Changes Included

- Added proposal-intelligence contracts and builder for `VendorEvaluationDecisionView`.
- Added normalized vendor comparison, weighted evaluation scorecard, readiness recommendation, and executive tradeoff renderer.
- Wired the decision view into Source Responses and Evaluation stages.
- Bound evaluation summaries/comparison/tradeoff evidence into the Source aVa context packet.
- Added a Source aVa answer path for vendor leader, cheapest TCO, transition risk, BAFO advance, and executive tradeoff questions.
- Retired older placeholder vendor names from evaluation fallback components.

## QA / Validation

- `npx eslint ...` — pass for touched Source files.
- `npx jest src/lib/source/proposal-intelligence/__tests__/proposal-intelligence.test.ts src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx src/lib/source/__tests__/source-answer-engine.test.ts --runInBand` — pass, 3 suites / 68 tests.
- `npm run release:check` — pass.
- `npx tsc --noEmit --pretty false` — blocked by pre-existing missing type/module declarations for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`; no Slice 4 TypeScript errors remained after local fixes.
- Live signed-in Source proof — pending after merge and ACA deployment.

## Rollout Plan

Merge to `main`, deploy via the approved Azure Container Apps main deploy workflow, wait for the new ACA revision to receive 100% ingress traffic, then verify the signed-in Source event at `/source/events/76a42ef7-ce5b-4e7c-a540-2f73cebb730f?stage=evaluation`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: none outside normal web image deployment.
- Approved image digest: assigned by the ACA deploy workflow after merge.
- ACA runtime invariant: `app.abarva.ai` must serve the deployed main SHA through `ca-abarva-web-lab-eastus`.
- Worker image invariant: no worker change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source event browser proof plus Source aVa API questions.

## Rollback Plan

Revert the release commit and redeploy main through the ACA main lane. The previous MVE profile, challenge/leverage, and BAFO instruction panels remain independent and can continue to render if this scorecard view is removed.

## Audit Evidence

- PR URL and merge commit.
- Focused Jest, eslint, and release-check output.
- ACA deploy workflow run, active revision, and image digest.
- Signed-in browser screenshot of the evaluation stage.
- API payloads for the five scorecard questions with latency and forbidden-label checks.

## Known Gaps

Live signed-in proof is pending until this branch is merged and deployed. Final evaluator score locking remains human-owned and is not automated by this slice.
