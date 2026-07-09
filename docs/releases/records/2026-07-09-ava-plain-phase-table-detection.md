# 2026-07-09-ava-plain-phase-table-detection — aVa Plain Phase Table Detection

## Release ID

`2026-07-09-ava-plain-phase-table-detection`

## Status

`candidate`

## Plain-English Summary

Fixes the remaining live aVa suggested-question audit defect where the deterministic Moves fallback appended a generic Markdown phase table even though Claude had already produced a complete P0-P5/Tower phase table in plain tabular form. The fallback now recognizes plain phase tables as satisfying the required Moves structure, preventing extra separator rows and duplicate generic content.

## Layer Impact

- `global-control-lane`: Updates shared Intelligence answer-mode fallback detection.
- Runtime answer quality: Prevents generic fallback table duplication when the answer already has a complete phase table.
- Export quality: Reduces risk that HTML/PDF exports include duplicate phase artifacts.

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
- Pass: `npx tsc --noEmit --project /tmp/tsconfig-ava-plain-phase-table.json`
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
- Live defect evidence: `proof/ava-suggested-followup-live-2026-07-09T05-18-11-678Z/` showed the duplicate streaming issue was resolved, but turn 0 still appended a generic Moves fallback table because the complete model-authored table was plain/tabular rather than GFM pipe syntax.
- CI / local validation: See QA section.
- Live screenshot/export proof: Pending after deploy.

## Known Gaps

This release prevents fallback duplication for complete plain phase tables. It does not independently validate the source accuracy of every tenant-specific metric emitted by Claude/aVa.
