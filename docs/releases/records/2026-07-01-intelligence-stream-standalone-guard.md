# 2026-07-01-intelligence-stream-standalone-guard — Intelligence Stream Standalone Guard

## Release ID

`2026-07-01-intelligence-stream-standalone-guard`

## Status

`candidate`

## Plain-English Summary

The legacy Intelligence streaming synthesis path now repairs hidden chat-history wording before it can be rendered. This closes the gap found in production smoke where Claude could still say "this session" even after the newer consultant path rejected that wording.

## Layer Impact

- `global-control-lane`: Updates Intelligence answer behavior for every tenant.
- `runtime answer contract`: Adds a post-model, pre-render standalone-language repair gate to the active Ask synthesis stream.

## Client Applicability

- All clients: yes, for Intelligence Ask answers.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts`: hardens the continuity prompt and repairs session-history wording before the answer reaches the renderer.
- `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`: adds a guardrail test proving the standalone repair gate runs before tabbed output is yielded.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts --runInBand`
  - Result: 32 tests passed.
  - Notes: existing duplicate Jest manual mock warnings and localstorage warning are unrelated to this change.
- Pass: `npm run release:check`.
- Not run yet: signed-in ACA focused Intelligence proof for Industrial Demo scale/hold/stop. This requires merge and ACA deploy first.
- Not run yet: 30-question signed-in production smoke rerun. This requires merge and ACA deploy first.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, confirm 100% traffic on the merged SHA, rerun the focused Industrial Demo Intelligence proof, then rerun the cross-surface 30-question smoke gate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Azure Container Apps web app and worker job image update through the approved main deploy workflow.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Worker image invariant: pending ACA deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this commit or roll back ACA traffic to the previous healthy revision. No schema, data, or environment migration is included.

## Audit Evidence

- PR URL: pending.
- Local QA, CI, ACA invariant, focused signed-in proof, and 30-question smoke outputs pending.

## Known Gaps

This fixes session-history wording on the active Intelligence Ask synthesis path. It does not alter the underlying V6 data packet richness.
