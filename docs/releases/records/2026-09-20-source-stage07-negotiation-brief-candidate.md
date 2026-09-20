# 2026-09-20-source-stage07-negotiation-brief-candidate — Stage 07 Negotiation Brief Candidate

## Release ID

`2026-09-20-source-stage07-negotiation-brief-candidate`

## Status

`candidate`

## Plain-English Summary

Source Stage 07 now builds a read-only negotiation-brief candidate from the existing Evaluation / BAFO readiness projection. The candidate separates accepted facts from proposed asks and refuses export when required response, pricing-comparability, or scorecard-evidence records are missing.

The candidate does not dispatch vendor communications, create BAFO rounds, lock scores, approve awards, write tenant data, invent benchmarks, or claim savings.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4 Source: adds a deterministic read-only planner and a small Stage 07 canvas section from already-loaded response, pricing, blocker, BAFO-instruction, and scorecard-evidence records.
- Layer 1/2/3: no intake, adapter, canonical schema, migration, data-build job, or tenant-data write changed.

## Client Applicability

- All clients: Source events that can render Evaluation / BAFO readiness.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/proposal-intelligence/negotiation-brief-planner.ts`
- `src/lib/source/proposal-intelligence/index.ts`
- `src/app/(maestro)/source/events/[eventId]/page.tsx`
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/responses/EvaluationBafoReadinessPanel.tsx`
- Focused behavior and render tests for the planner and mounted panel.

## QA / Validation

- Failing-first: the new focused Jest suite initially could not resolve `buildStage07NegotiationBriefCandidate` because the planner did not exist. The first attempted run also exposed that this isolated worktree lacked `node_modules`; `npm ci` installed the repo-pinned toolchain.
- Pass: `npx jest src/lib/source/proposal-intelligence/__tests__/negotiation-brief-planner.test.ts src/components/source/canvas/responses/__tests__/EvaluationBafoReadinessPanel.test.tsx --runInBand` — 2 suites / 7 tests passed.
- Pass: `npx eslint src/lib/source/proposal-intelligence/negotiation-brief-planner.ts src/lib/source/proposal-intelligence/__tests__/negotiation-brief-planner.test.ts src/components/source/canvas/responses/EvaluationBafoReadinessPanel.tsx src/components/source/canvas/responses/__tests__/EvaluationBafoReadinessPanel.test.tsx src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/app/(maestro)/source/events/[eventId]/page.tsx`.
- Pass: `npm run typecheck` — clean.
- Tests cover the accepted-fact/proposed-ask split, response-evidence refusal, pricing-evidence refusal, scorecard-evidence refusal, UI refusal state, and no award/benchmark/savings language.

## Rollout Plan

Open a PR, wait for checks, squash-merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merge SHA. Capture deployment/runtime-invariant proof separately after merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after deployment, because the Source canvas renders a new Stage 07 read-only section.

## Rollback Plan

Revert the PR through a new PR or deploy a prior approved digest through the repo-owned ACA workflow. No database rollback is required.

## Audit Evidence

Inspect the PR diff, focused Jest output, ESLint output, release-check output, PR checks, merge SHA, ACA deploy workflow run, and post-deploy digest invariant proof.

## Known Gaps

- Signed-in browser proof is not captured in this candidate state.
- Deployment/runtime-invariant proof is not captured in this candidate state.
- The planner is a read-only candidate only; it is not a BAFO workflow engine, supplier communication channel, award approval, score-lock path, or savings model.
