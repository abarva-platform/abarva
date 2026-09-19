# 2026-09-19-source-stage07-pricing-comparability - Stage 07 Pricing Comparability Ledger

## Release ID

`2026-09-19-source-stage07-pricing-comparability`

## Status

`candidate`

## Plain-English Summary

Source Stage 07 now includes a read-only pricing comparability ledger inside the Evaluation / BAFO readiness panel. It shows each vendor's five-year TCO, year-one run cost, transition cost, one-time cost, optional cost, pricing basis, and comparability posture from existing governed response-profile fields.

The ledger fails closed when required pricing fields or pricing basis are missing. It does not normalize new data, invent benchmark ranges, select a winner, send a BAFO, lock scores, or create award recommendations.

## Layer Impact

Layer 4 product projection only. The Source canvas renders a richer read-only projection from existing vendor response pricing summary fields.

No Layer 1 intake, Layer 2 adapter, Layer 3 canonical schema, migration, data-build job, or tenant-data write changed.

Release lane: `global-control-lane`.

## Client Applicability

- All clients: Source events that have governed vendor response profiles and view Evaluation or BAFO readiness.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/proposal-intelligence/evaluation-bafo-readiness.ts`: adds pricing comparability rows and missing-pricing blockers to the deterministic Stage 07 readiness view.
- `src/components/source/canvas/responses/EvaluationBafoReadinessPanel.tsx`: renders the pricing comparability ledger.
- Focused tests cover the read-model ledger, rendered panel, fail-closed missing TCO/pricing basis behavior, and no award/benchmark claims.
- `/Users/anand/Downloads/EXECUTION_BACKLOG_20260918.md` and `/Users/anand/Downloads/source-stage-map.json`: add/mapping Stage 07 execution rows so the generated board can track Evaluation / BAFO separately from platform throughput.

## QA / Validation

- Failing-first: focused tests failed before implementation because `view.pricing` was undefined and the panel did not render `Pricing comparability`.
- Pass: `npx jest src/lib/source/proposal-intelligence/__tests__/evaluation-bafo-readiness.test.ts src/components/source/canvas/responses/__tests__/EvaluationBafoReadinessPanel.test.tsx --runInBand` — 2 suites / 6 tests passed.
- Mutation: temporarily removed the five-year TCO missing-field guard; `evaluation-bafo-readiness.test.ts` failed because the blocker no longer named missing five-year TCO. Guard restored and the focused suite passed again.

## Rollout Plan

Open a PR, wait for checks, squash-merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merge SHA. Capture deployment/runtime-invariant proof separately after merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: not available until the repo-owned workflow builds the merge SHA.
- ACA runtime invariant: not yet captured.
- Worker image invariant: not yet captured.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after deployment, because the Source canvas renders new Stage 07 pricing-readiness content.

## Rollback Plan

Revert the PR through a new PR or deploy a prior approved digest through the repo-owned ACA workflow. No database rollback is required.

## Audit Evidence

Inspect the PR diff, focused Jest output, mutation output, TypeScript/ESLint/release-check output, merge SHA, ACA deploy workflow run, and post-deploy digest invariant proof.

## Known Gaps

- Signed-in browser proof is not captured in this candidate state.
- Deployment/runtime-invariant proof is not captured in this candidate state.
- This ledger reads only existing governed response-profile pricing fields. It does not implement a new pricing parser, benchmark corpus, score lock, BAFO round, award approval, supplier communication, or canonical contract write.
