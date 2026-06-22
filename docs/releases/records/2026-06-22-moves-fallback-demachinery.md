# 2026-06-22-moves-fallback-demachinery — Moves Fallback Demachinery

## Release ID

`2026-06-22-moves-fallback-demachinery`

## Status

`candidate`

## Plain-English Summary

The SkyHarbor post-deploy canary proved the grounded visual fallback now renders the architecture diagrams, but the artifact still quarantined because plan-derived wording included internal machinery vocabulary. This release sanitizes client-visible fallback text and keeps internal fallback failure details out of the Open Inputs section.

## Layer Impact

- `global-control-lane`: Tightens the shared architecture fallback renderer so profile-rendered Moves artifacts stay client-facing.
- `client-data-lane`: No schema migration or direct data mutation. The next SkyHarbor canary creates new run/artifact evidence only.

## Client Applicability

- All clients: Applies to architecture/solution-design deliverables when the grounded visual fallback is used.
- Specific clients: SkyHarbor Air is the live proving tenant.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Most visible where `deliverable_structured_exhibits` and `deliverable_quality_contract` are enabled.

## Changes Included

- `src/lib/visual-system/architecture-fallback.ts`: Rewrites plan-derived machinery terms such as `substrate`, `source register`, and `client to complete` into client-facing language.
- `src/lib/visual-system/__tests__/architecture-generation.test.ts`: Adds a regression proving banned terms do not appear in fallback-rendered architecture HTML.

## QA / Validation

- PASS: `npx jest src/lib/visual-system/__tests__/architecture-generation.test.ts --runInBand`
- PASS: `npx eslint src/lib/visual-system/architecture-fallback.ts src/lib/visual-system/__tests__/architecture-generation.test.ts`
- PASS: `npm run release:check`
- PASS: `git diff --check`
- Live canary evidence before this fix: run `faad8d82-d306-42a5-b635-4ae03bd46f78` rendered 13 SVG / 13 `data-exhibit` visuals but quarantined for `blocked_quality: non_mechanical_writing`; artifact inspection showed banned hit `{substrate}`.

## Rollout Plan

Merge to `main`, deploy through the ACA main workflow, confirm web plus both deliverable worker jobs share the same image digest, then rerun the SkyHarbor Recovery Command canary through VNet-visible data-plane jobs.

## Deployment Authority

- Repo-owned deploy workflow: GitHub Actions `aca-main-deploy`.
- Shared runtime mutators: Azure Container Apps web revision and deliverable worker jobs.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Web revision and worker jobs must run the same image digest.
- Worker image invariant: `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event` must be updated together.
- Feature/env flag update path: No new flags.
- Live signed-in proof required: Yes. Rerun the SkyHarbor canary and inspect final run/artifact visual evidence.

## Rollback Plan

Revert this release commit and redeploy the previous ACA image. No database rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3870
- CI/check output: Targeted Jest, ESLint, release check, and `git diff --check`.
- Production-lab canary evidence: SkyHarbor run `faad8d82-d306-42a5-b635-4ae03bd46f78`, artifact `f4535f7a-2d2e-4ce2-bf0c-071373da3a2e`, 13 SVG visuals / 13 `data-exhibit` sections, quarantined only for `non_mechanical_writing` due banned hit `{substrate}`.

## Known Gaps

This does not change the LLM architecture structured-output behavior itself. It ensures the deterministic visual fallback remains client-facing when it consumes plan-derived text.
