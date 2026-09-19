# 2026-09-19-source-evaluation-bafo-readiness - Evaluation / BAFO Readiness Decision Support

## Release ID

`2026-09-19-source-evaluation-bafo-readiness`

## Status

`candidate`

## Plain-English Summary

Source now shows a compact Stage 07 decision-support view for Evaluation and BAFO readiness. It summarizes which vendor response records have been received, whether each package is comparable enough for scoring, which cited blockers or evidence gaps remain, and the single next action to take before advancing.

The view is deterministic and read-only. It uses existing governed response profiles, challenge intelligence, BAFO instruction packs, and evaluation scorecard records. It does not create rankings, benchmark claims, savings claims, messages, or award recommendations.

## Layer Impact

Layer 4 product projection only. The Source event canvas renders a new read-only projection from existing Source response and scoring records.

No Layer 1 intake, Layer 2 adapter, or Layer 3 canonical/data-plane schema behavior changed. No data writes, migrations, generated artifact persistence, or outbound communications were added.

Release lane: `global-control-lane`.

## Client Applicability

- All clients: receives the Source canvas UI/read-model behavior when Evaluation or BAFO records are present.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/proposal-intelligence/evaluation-bafo-readiness.ts` adds the pure readiness view-model builder.
- `src/components/source/canvas/responses/EvaluationBafoReadinessPanel.tsx` renders the compact decision-support panel.
- `src/app/(maestro)/source/events/[eventId]/page.tsx` builds the readiness view for Evaluation and BAFO stage views.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` passes and renders the view.
- Focused unit/render tests cover fail-closed behavior, event-scoped profile separation, blocker-first next action, and no award/benchmark claims.

## QA / Validation

- `npx jest src/lib/source/proposal-intelligence/__tests__/evaluation-bafo-readiness.test.ts src/components/source/canvas/responses/__tests__/EvaluationBafoReadinessPanel.test.tsx --runInBand`: pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`: pass.
- `npx eslint src/lib/source/proposal-intelligence/evaluation-bafo-readiness.ts src/lib/source/proposal-intelligence/__tests__/evaluation-bafo-readiness.test.ts src/components/source/canvas/responses/EvaluationBafoReadinessPanel.tsx src/components/source/canvas/responses/__tests__/EvaluationBafoReadinessPanel.test.tsx src/app/(maestro)/source/events/[eventId]/page.tsx src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: pass.
- Signed-in browser proof: not run in this candidate record.
- Runtime/deployed proof: not run in this candidate record.

## Rollout Plan

Open a PR, wait for checks, squash-merge to `main`, and allow the repo-owned Azure Container Apps deploy workflow to build and deploy the exact merge SHA. After deployment, capture the digest invariant and any required signed-in Source canvas proof separately.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: not available until the repo-owned deploy workflow builds the merge SHA.
- ACA runtime invariant: not yet captured.
- Worker image invariant: not applicable to this UI/read-model slice.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after deployment, for a Source event with Evaluation or BAFO response records.

## Rollback Plan

Revert the PR through a new PR or deploy a prior approved digest through the repo-owned ACA workflow. No database rollback is required.

## Audit Evidence

Use the PR diff, focused Jest output, TypeScript output, ESLint output, release check output, merge SHA, ACA deploy workflow run, and post-deploy digest invariant proof.

## Known Gaps

- No signed-in browser proof has been captured in this candidate state.
- No ACA runtime invariant has been captured in this candidate state.
- The panel summarizes existing governed records only; missing response profiles remain missing and produce a blocked/no-record state.
