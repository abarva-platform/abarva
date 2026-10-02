# 2026-10-02 — A Refused Deliverable Plan Reports the Policy Category

## Release ID

`2026-10-02-plan-refusal-diagnostics`

## Status

`candidate`

## Plain-English Summary

When the model provider stops a response under one of its usage policies, the response ends early with a "refusal" stop reason and, alongside it, the policy area and a short explanation.

An earlier change made a blocked architecture build report the stop reason. A deployed build has since shown the reason is a refusal, twice in one build, part-way through the plan. The run record said "refusal" and nothing else: not which policy area, and not the provider's explanation. Both were in the response and were being dropped.

They are now carried through and included in the failure message. Nothing about how a refusal is handled changes: the plan is still requested once more, and the build still stops if it is refused again.

## Layer Impact

**Release lane: `global-control-lane`.** Shared deliverable generation for every client; not behind a feature flag.

- **Product layer — deliverable planning:** What a plan failure reports. No change to retries, validation, model choice, or what is sent to the model.
- **AI egress:** Same governed call path; two more fields are read from the response.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients receive the behavior after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/visual-system/architecture-generation.ts`: the governed tool-call result type carries the provider's stop details.
- `src/lib/deliverables/quality/architecture-egress-adapter.ts`: return them.
- `src/lib/deliverables/planning/deliverable-plan-generation.ts`: include the policy category and explanation in the failure message.
- Tests for the adapter and the message.

## QA / Validation

- Targeted Jest: pass — planning, quality and visual-system suites, `217 tests`, 3 new and 1 updated.
- Scoped typecheck of the changed files: clean.
- Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Full typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observation that motivated the change: on a synthetic workflow, an architecture build was blocked with both plan attempts ending on a refusal stop reason, and no further detail in the run record.
- Signed-in runtime verification of this change: pending deployment, and dependent on a refusal recurring.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. The next refused plan will carry the category in its run record.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a synthetic workflow, when a refusal recurs.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved digest, or revert this change. No database migration or data mutation is included.

## Audit Evidence

- PR and exact-SHA CI checks: pending.
- Targeted test output: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- This reports a refusal; it does not resolve one. The provider's guidance is that re-sending a refused request to the same model usually fails again and that a fallback model is the remedy. Whether deliverables may fall back to a second model on a refusal is a model-policy decision that has not been made.
- Refusals are intermittent on the same inputs: one build in three completed its plan.
- Other structured generation passes on the same call path do not report refusal details.
- The provider's explanation text is passed through as given and is shown in the run record.
