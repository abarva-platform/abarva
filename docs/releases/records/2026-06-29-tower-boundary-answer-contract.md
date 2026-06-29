# 2026-06-29-tower-boundary-answer-contract — Tower boundary answer contract

## Release ID

`2026-06-29-tower-boundary-answer-contract`

## Status

`candidate`

## Plain-English Summary

Tower chat now routes non-Tower and unsafe questions through a deterministic boundary answer instead of sending them through the Tower Claude advisory prompt. That keeps Tower focused on CIO portfolio control, prevents non-Tower prompts from leaking dashboard metric values, and preserves the rule that rendered text is exactly what the visible-answer contract contains.

## Layer Impact

- `global-control-lane`: updates the shared Tower answer path and Tower quality harness behavior for all tenants.
- `client-data-lane`: no schema or tenant data mutation. The existing `tower_outside_scope` question contract is reused for boundary traces.

## Client Applicability

- All clients: yes, for Tower chat boundary handling.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/cio-tower/answer.ts`: adds deterministic boundary classification for Home/Explorer, Intelligence, Source, Moves, safety, and outside-scope questions; returns a visible-answer JSON contract without a Claude call for those prompts.
- `src/lib/cio-tower/answer.ts`: makes JSON contract parsing tolerate harmless Claude preambles by extracting the first balanced JSON object. It does not rewrite visible prose.
- `src/lib/cio-tower/__tests__/answer.test.ts`: adds regression coverage for boundary routing, safety refusals, and parser behavior.

## QA / Validation

- `npx jest src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts --runInBand`: passed, 14 tests.
- `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts`: passed.
- Pending: TypeScript, release check, PR CI, deploy, then VNet executor/scorer rerun.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, then rerun the Tower answer executor and scorer inside the private VNet against the deployed image.

## Deployment Authority

- Repo-owned deploy workflow: required for `app.abarva.ai`.
- Shared runtime mutators: none introduced.
- Approved image digest: produced by the main deploy workflow after merge.
- ACA runtime invariant: template image, active revision, and 100% traffic must match the approved main digest.
- Worker image invariant: private operator job must be restored to the parked image after VNet proof runs.
- Feature/env flag update path: none.
- Live signed-in proof required: VNet executor/scorer proof first; browser proof only after server-side quality is green enough.

## Rollback Plan

Revert this release and redeploy the previous approved main image. No database rollback is required because this change only affects runtime routing and trace content.

## Audit Evidence

- PR: to be added.
- CI: to be added.
- VNet executor/scorer rerun: to be added after deploy.

## Known Gaps

This does not redesign Tower data or dashboard metrics. It fixes the boundary-routing failure that made handoff and safety questions go through the Tower advisory prompt and fail the right-answer scorer.
