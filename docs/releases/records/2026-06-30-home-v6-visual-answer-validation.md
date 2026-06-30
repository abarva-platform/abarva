# 2026-06-30-home-v6-visual-answer-validation — Home V6 Visual Answer Validation

## Release ID

`2026-06-30-home-v6-visual-answer-validation`

## Status

`candidate`

## Plain-English Summary

Home V6 visual asks now distinguish between a rendered artifact and a useful visual recommendation. A good Claude executive answer will no longer be blocked merely because the deterministic packet does not include every chart/graph artifact. The response carries `artifactStatus` so the UI and QA can tell whether the answer rendered an artifact, recommended a visual structure, named an unavailable evidence gap, or did not request a visual.

## Layer Impact

- `global-control-lane`: changes shared Home KNOW answer validation and response metadata for all V6 Home tenants.
- `public-demo`: improves soft-launch demo reliability for table/chart/graph questions while preserving hard blocks for raw/debug leakage and unsupported claims.

## Client Applicability

- All clients: all tenants using the V6 Home `/api/home/know/ask` path.
- Specific clients: Healthcare Demo is the regression tenant; Retail Demo, Airline Demo, Industrial Demo, and Financial Services Demo are included in the live targeted suite.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Home V6 executive synthesis flags apply; no new flag.

## Changes Included

- Adds `artifactStatus` to `HomeKnowResponse`.
- Sets deterministic artifact status from the V6 Home response shape.
- Updates Claude synthesis validation so missing tenant display name is a warning instead of a hard block.
- Preserves good visual recommendation answers when no deterministic chart/graph artifact is available.
- Normalizes `source signals` to `source evidence` so good visual answers do not trip the generic visible-answer contract.
- Adds focused regression coverage for rendered visuals, recommendation-only visuals, unsupported invented value action, missing tenant-name warning, and the Healthcare Demo VISUAL-001 failure.

## QA / Validation

- `npx jest src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts --runInBand` passed.
- `npx eslint src/lib/home/know/home-v6-executive-synthesis.ts src/lib/home/know/v6-home-know-response.ts src/lib/home/know/home-know-contract.ts src/app/api/home/know/ask/route.ts src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts` passed.
- `npm run release:check` required before PR.
- Live signed-in targeted 25-question suite required after ACA deploy.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps workflow, verify the active ACA revision/image/traffic/health, then rerun the targeted 25-question Home V6 Claude suite.

## Deployment Authority

- Repo-owned deploy workflow: required, ACA main deploy only.
- Shared runtime mutators: none outside normal ACA deploy.
- Approved image digest: to be captured by deploy workflow.
- ACA runtime invariant: required.
- Worker image invariant: no worker change expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR or roll back to the previous ACA revision. The previous behavior blocks questionable visual answers rather than preserving them; rollback is safe but restores the Healthcare Demo VISUAL-001 failure risk.

## Audit Evidence

- Focused Jest and ESLint outputs.
- PR checks.
- ACA deploy artifact with active revision, digest-pinned image, traffic, and health.
- Targeted 25-question signed-in Home V6 Claude suite showing `table_chart_graph_ask=3/3`, Healthcare Demo VISUAL-001 passing, and `artifactStatus` present for visual asks.

## Known Gaps

This patch does not make the renderer generate new charts. It only preserves valid Claude executive answers and labels artifact availability correctly.
