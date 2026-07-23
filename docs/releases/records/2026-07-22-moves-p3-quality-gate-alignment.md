# 2026-07-22-moves-p3-quality-gate-alignment — Align P3 claim and machinery checks

## Release ID

`2026-07-22-moves-p3-quality-gate-alignment`

## Status

`candidate`

## Plain-English Summary

Live First Capital P3 generation after PR #5409 exposed two quality-check mismatches. The numeric-claim check scanned section titles even though the deterministic repair operates on section bodies, and Operating Model prose repeated the internal label `Source Register` outside the formal appendix heading. This release aligns the numeric check with the repaired body surface and rewrites those prose-only evidence-register references while preserving the required appendix heading.

The quality gates remain strict. Unsupported numbers in body prose still block, evidence requirements are unchanged, and blocked artifacts are not promoted to client-ready status.

## Layer Impact

- `global-control-lane`: shared Moves deliverable validation and client-facing HTML sanitation change for all tenants using governed generation.
- No client-data schema, tenant data, candidate promotion, Home context, or Tower measurement behavior changes.

## Client Applicability

- All clients: yes, for governed Moves deliverable generation.
- Specific clients: live proof uses the disposable First Capital Financial sandbox Move only.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; rollback is by reverting the release.

## Changes Included

- Numeric client-fact validation scans section body prose rather than structural section titles.
- Client-facing sanitation rewrites narrative-only references to `Source Register` while retaining `Appendix A — Source Register`.
- Regression tests cover both live failure classes.

## QA / Validation

- Pass: `npx jest src/lib/deliverables/orchestrator/__tests__/orchestrator.test.ts src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts --runInBand` (31 tests).
- Pass: ESLint on all changed TypeScript files.
- Blocked locally by the shared workspace dependency state: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` reports only missing installed packages `@xyflow/react` and `@dagrejs/dagre` in unrelated Home files; GitHub Typecheck remains required before merge.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.
- Pending: post-deploy signed-in First Capital P3 generation rerun.

## Rollout Plan

Merge by PR, deploy through `.github/workflows/aca-main-deploy.yml`, verify web and deliverable-worker digest parity, then rerun the same disposable First Capital P3 batch.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: the main deploy workflow; no local or ad-hoc traffic mutation.
- Approved image digest: pending merge and workflow build.
- ACA runtime invariant: pending deployment.
- Worker image invariant: pending deployment; both deliverable worker jobs must match web.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, First Capital agent persona on the disposable proof Move.

## Rollback Plan

Revert the PR and redeploy the prior digest through the repo-owned main workflow. Existing blocked runs and persisted artifacts are not modified by this change.

## Audit Evidence

- Pre-fix live run ids: `c28f9331-17ec-4989-8e49-86aa32097ca9`, `83637056-a7e1-4bf9-a774-6be708e354dd`, `4e926beb-43e3-495f-a121-90efee798103`, `6824e0f5-7fe1-4188-8c9b-fef94b1fd8ec`.
- Pre-fix proof bundle: `proof/5409-p3-postdeploy-live-browser`.
- ACA diagnostic: Operating Model matched `source register` in narrative prose `evidence appendix (Source Register)`.
- PR URL, merge SHA, deploy workflow, digest, and post-deploy proof: pending.

## Known Gaps

- Prompt instructions alone did not eliminate the live numeric blockers; this release fixes the observed validator/repair mismatch, but post-deploy generation must prove whether any genuine unsupported body claims remain.
- Operating Model may expose another quality finding after the confirmed machinery false positive is removed. The gate remains authoritative.
