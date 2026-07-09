# 2026-07-09-ava-phase-fallback-polish — aVa Phase Fallback Polish

## Release ID

`2026-07-09-ava-phase-fallback-polish`

## Status

`candidate`

## Plain-English Summary

Fixes a live aVa follow-up audit defect where the deterministic Moves phase fallback appended a second generic phase table when Claude had already produced a mostly complete phase table but missed one phase. The fallback now adds only a compact completion note for missing phase labels, preserving the P0-P5/Tower contract without duplicating the answer or exposing raw table separator rows.

## Layer Impact

- `global-control-lane`: Updates shared Intelligence answer-mode assembly.
- Runtime answer quality: Keeps the governed Moves phase contract while avoiding duplicative generic fallback artifacts.
- Safety/quality layer: Adds regression coverage for the live six-turn suggested-question chain defect.

## Client Applicability

- All clients: Yes. This is shared aVa/Intelligence answer behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/answer-mode-registry.ts`
- `src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts --runInBand`
- Pass: `npx eslint src/lib/intelligence/ask/answer-mode-registry.ts src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts`
- Pass: `npx tsc --noEmit --project /tmp/tsconfig-ava-phase-fallback-runtime.json`
- Blocked: local repo-wide `npx tsc --noEmit --project tsconfig.json` was stopped after several minutes with no output; GitHub PR Typecheck gate is required before merge.
- Pass: `npm run release:check`
- Pending: live signed-in six-turn suggested-question click audit after deploy.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds the digest-pinned image, updates `ca-abarva-web-lab-eastus`, verifies health and runtime invariant, and shifts traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None from this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No migrations, data changes, feature flags, or environment changes are involved.

## Audit Evidence

- PR URL: Pending.
- Live defect evidence: `proof/ava-suggested-followup-live-2026-07-09T04-30-00-436Z/` showed six submitted follow-up turns with no stale aliases, but the deterministic fallback appended a duplicative generic Moves table because P4 was missing from the model-authored table.
- CI / local validation: See QA section.
- Live screenshot/export proof: Pending after deploy.

## Known Gaps

This release improves runtime answer assembly and display quality. It does not independently prove that every tenant-specific metric in the model-authored answer is source-accurate; source accuracy requires a separate evidence-citation audit.
