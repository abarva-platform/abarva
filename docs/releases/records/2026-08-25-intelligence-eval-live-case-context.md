# 2026-08-25-intelligence-eval-live-case-context — Live Eval Case Context Preservation

## Release ID

`2026-08-25-intelligence-eval-live-case-context`

## Status

`candidate`

## Plain-English Summary

This release keeps the Intelligence ECL eval case identifier intact through the live ask route and removes three exact forbidden phrases from proof answers. It does not loosen the eval validator. The purpose is to let the existing frozen validator judge the answer, rather than teaching the validator more answer variants.

## Layer Impact

- Release lane: `internal-admin`
- Layer 4 Products: updates the Intelligence ask route and proof-answer path used by the ECL consultant eval harness.
- QA / Proof: adds local regression coverage for preserving ECL eval context through the live route and for keeping proof answers outside frozen phrase gates.

## Client Applicability

- All clients: no default product behavior change.
- Specific clients: none.
- Internal only: Intelligence ECL eval/proof harness.
- Public/demo only: no public route change.
- Feature flag: existing ECL provider/eval controls only.

## Changes Included

- `src/app/api/intelligence/ask/route.ts`
- `src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`
- `src/lib/intelligence/ask/types.ts`
- `src/lib/intelligence/ask/ecl-consultant-proof-answer.ts`
- `src/lib/intelligence/ask/__tests__/ecl-consultant-proof-answer.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/intelligence/ask/__tests__/ecl-consultant-proof-answer.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts` — passed, 14/14 tests.
- `npx eslint src/lib/intelligence/ask/types.ts src/app/api/intelligence/ask/route.ts src/lib/intelligence/ask/ecl-consultant-proof-answer.ts src/lib/intelligence/ask/__tests__/ecl-consultant-proof-answer.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts` — passed.
- Additional ECL/predeploy/type/release checks are required before merge.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow may deploy the updated runtime image. After deployment, run the Intelligence ECL live eval with baseline plus evidence-withheld ablation and report the captured result without patching validator aliases.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: required before claiming deployment.
- Worker image invariant: not changed by this PR.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming live Intelligence eval proof.

## Rollback Plan

Revert this PR or redeploy the prior good `main` SHA through the repo-owned ACA workflow.

## Audit Evidence

- PR URL and CI run after publication.
- Main deploy workflow run after merge.
- Live eval output for the next baseline plus evidence-withheld ablation run.

## Known Gaps

This PR does not claim a passing live eval. It preserves case context and answer phrasing so the next live eval run is interpretable under the frozen validator.
