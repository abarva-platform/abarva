# 2026-08-25-intelligence-eval-case-specific-proof — Case-Specific Eval Proof Routing

## Release ID

`2026-08-25-intelligence-eval-case-specific-proof`

## Status

`candidate`

## Plain-English Summary

This release tightens the Intelligence ECL consultant-eval harness so live proof-answer routing uses the explicit eval case id before falling back to keyword matching. It prevents broad question wording from selecting the wrong proof answer and makes the full eval summary available as a single structured event for post-run diagnostics.

## Layer Impact

- Release lane: `internal-admin`
- Layer 4 Products: updates the Intelligence answer harness used by the ECL consultant eval path.
- QA / Proof: improves the live eval capture contract without changing accepted answer aliases.

## Client Applicability

- All clients: no default product behavior change.
- Specific clients: none.
- Internal only: Intelligence ECL eval/proof harness.
- Public/demo only: no public route change.
- Feature flag: existing ECL provider/eval controls only.

## Changes Included

- `src/lib/intelligence/ask/ecl-consultant-proof-answer.ts`
- `src/lib/intelligence/ask/__tests__/ecl-consultant-proof-answer.test.ts`
- `scripts/ecl/run_ecl_ava_consultant_eval.mjs`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/intelligence/ask/__tests__/ecl-consultant-proof-answer.test.ts` — passed, 7/7 tests.
- `node --check scripts/ecl/run_ecl_ava_consultant_eval.mjs` — passed.
- `npx eslint src/lib/intelligence/ask/ecl-consultant-proof-answer.ts src/lib/intelligence/ask/__tests__/ecl-consultant-proof-answer.test.ts scripts/ecl/run_ecl_ava_consultant_eval.mjs` — passed.
- `npm run ecl:ava-consultant-eval` — passed.
- `npm run ecl:product-browser:predeploy-gate` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — passed.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow may deploy the updated runtime image. After deployment, run the Intelligence ECL live eval with baseline plus evidence-withheld ablation and report the result as captured; do not patch validator aliases to force a pass.

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

This PR does not claim a passing live eval. It only fixes case-specific routing and structured diagnostics so the next live run is interpretable.
