# 2026-09-21-source-stage07-bafo-reviewed-facts — Stage 07 BAFO Reviewed Facts Guard

## Release ID

`2026-09-21-source-stage07-bafo-reviewed-facts`

## Status

`candidate`

## Plain-English Summary

Source Stage 07 now has a read-only BAFO round and concession authority contract. The negotiation brief candidate can use BAFO round and concession rows only when they are versioned, evidence-backed, and reviewed by a named reviewer. If scorecard authority, evaluator identity, frozen weights, BAFO evidence, or review state is missing, the brief refuses export instead of treating advisory rows as accepted facts.

## Layer Impact

- Release lane: `global-control-lane` because this is shared Source control-plane/read-contract behavior for all clients unless later feature-gated.
- Layer 3 Canonical Enterprise Model: No schema, migration, tenant data write, score write, round write, concession write, award write, or supplier communication is included.
- Layer 4 Products: Source's Stage 07 negotiation brief surface now separates reviewed facts from proposed asks and shows BAFO review posture in the read-only panel.

## Client Applicability

- All clients: Applies wherever Source renders the Stage 07 Evaluation / BAFO readiness and negotiation brief candidate.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/proposal-intelligence/bafo-round-concession.ts`: adds the read-only BAFO round/concession view and fail-closed blockers for missing versions, evidence, reviewer identity, review timestamp, review state, or round-version linkage.
- `src/lib/source/proposal-intelligence/negotiation-brief-planner.ts`: refuses export when governed scorecard authority or BAFO round/concession review is blocked, and limits accepted BAFO facts to reviewed records.
- `src/components/source/canvas/responses/EvaluationBafoReadinessPanel.tsx`: displays reviewed fact state and citation in the negotiation brief preview.
- `src/app/(maestro)/source/events/[eventId]/page.tsx`: passes an explicit empty BAFO round/concession read model until a governed persistence reader exists, so the route fails closed instead of inventing round or concession proof.
- Focused tests for the planner and panel.

## QA / Validation

- Expected fail before implementation: `npx jest src/lib/source/proposal-intelligence/__tests__/negotiation-brief-planner.test.ts --runInBand` failed because `buildStage07BafoRoundConcessionView` did not exist.
- Pass: `npx jest src/lib/source/proposal-intelligence/__tests__/scorecard-authority.test.ts src/lib/source/proposal-intelligence/__tests__/negotiation-brief-planner.test.ts src/components/source/canvas/responses/__tests__/EvaluationBafoReadinessPanel.test.tsx --runInBand` — 15/15 passing.
- Pass: `npx jest src/lib/source/proposal-intelligence/__tests__/negotiation-brief-planner.test.ts src/components/source/canvas/responses/__tests__/EvaluationBafoReadinessPanel.test.tsx --runInBand` — 9/9 passing.
- Pass: `npx eslint src/lib/source/proposal-intelligence/bafo-round-concession.ts src/lib/source/proposal-intelligence/negotiation-brief-planner.ts src/lib/source/proposal-intelligence/__tests__/negotiation-brief-planner.test.ts src/components/source/canvas/responses/EvaluationBafoReadinessPanel.tsx src/components/source/canvas/responses/__tests__/EvaluationBafoReadinessPanel.test.tsx 'src/app/(maestro)/source/events/[eventId]/page.tsx'`
- Pass: `git diff --check`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npm run typecheck`
- Pass: `npm run release:check`
- Mutation proof: temporarily disabling the BAFO round/concession refusal branch made `npx jest src/lib/source/proposal-intelligence/__tests__/negotiation-brief-planner.test.ts --runInBand` fail because the candidate became `candidate` instead of `refused`; the mutation was reverted and the focused test returned to green.

## Rollout Plan

Merge through the protected PR path. The normal repo-owned Azure Container Apps main deploy workflow may deploy the resulting image after merge. No migration apply, data-plane write, supplier communication, award, score lock, BAFO send, concession acceptance, traffic change, or feature flag change is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: Not applicable until after merge/deploy.
- ACA runtime invariant: Not run; candidate only.
- Worker image invariant: Not run; candidate only.
- Feature/env flag update path: None.
- Live signed-in proof required: Owed after deployment for product acceptance; not performed or claimed here.

## Rollback Plan

Revert the PR. Because this is read-only product/model code with no schema apply and no tenant data writes, rollback does not require data migration.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/8170
- Local validation: Listed above.
- Backlog item: Stage 07 Evaluation / BAFO CPO fast path.

## Known Gaps

- A governed persistence reader for real BAFO round and concession rows is not included. The current route passes an empty read model and therefore refuses export until such evidence is available.
- No signed-in browser proof, deployment proof, or ACA runtime-invariant proof is claimed in this candidate record.
