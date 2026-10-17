# u698 — The P4 pages state an unevaluable value plan instead of requesting a 409

## Release ID

`2026-10-17-moves-p4-value-readback-unevaluable-plan`

## Status

`candidate`

## Plain-English Summary

Every P4 step page reads the Move's value case through `GET /api/v1/programs/<id>/value-case` once the value plan is saved. When the saved plan is free text, malformed, or empty, that route answers with a refusal (409 or 404) and the page showed the refusal's sentence. The page already holds the same saved text the route reads, so it was making a request whose refusal it could decide itself, and each P4 view logged a failed resource load. The post-deploy walk records that as a failed view.

One client change: the readback hook classifies the saved plan with the same reader the route uses (`readValueModel`). An empty, free-text or malformed plan shows the route's own refusal sentence (`VALUE_CASE_REFUSAL`) and makes no request. A structured plan is read from the route exactly as before.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4 (Moves P4 step pages), client only:** `src/components/strategic-moves/step-page/useP4ValueReadback.ts`. No route, engine, data, gate or flag change.

## Client Applicability

- **All clients:** any Move at P4 with the value engine enabled and a saved plan that is not a structured value model.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** unchanged (`moves_value_engine_v1`, `moves_step_pages_v3`).

## Changes Included

- `useP4ValueReadback.ts`: `unevaluablePlanDetail` returns the route's refusal sentence for an empty, free-text or invalid plan; the fetch effect, the status line and the retry affordance skip the request for those plans.
- `P4P5StepPages.test.tsx`: the three no-request cases (sentence shown, route not called, Continue disabled), plus the fetch-failure case moved onto a structured plan so the request path stays covered.

## QA / Validation

- `P4P5StepPages.test.tsx` + `MovesPhaseStandaloneClient.test.tsx`: PASS (64 + 373).
- Mutations: removing the request skip, or removing the stated refusal, each fail 3 cases: KILLED.
- `npm run typecheck`: PASS. ESLint: PASS. `npm run release:check`: PASS.
- Live walk: NOT RUN locally; the next post-deploy walk's P4 rows are the proof.

## Rollout Plan

Takes effect on the next main deploy. P4 views with an unevaluable saved plan stop logging a failed value-case load and show the same refusal sentence as before. The plan still has to be rebuilt as a structured value model before the value step can continue.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: produced by the main deploy workflow.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's P4 rows.

## Rollback Plan

Revert the squash commit and redeploy through the main deploy workflow. No data to roll back.

## Known Gaps

- **The plan itself still needs rebuilding.** This removes a failed request, not the reason the value step cannot continue; a person must build the structured value model.
- **The route is unchanged.** Server callers (reference-deck inputs) still receive the same refusals.

## Audit Evidence

- PR URL and CI run; walk 39054405722's P4 rows (HTTP 409 on value-case) as the before state.
