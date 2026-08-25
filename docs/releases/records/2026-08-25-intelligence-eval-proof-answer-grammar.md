# 2026-08-25-intelligence-eval-proof-answer-grammar — Proof Answer Grammar Polish

## Release ID

`2026-08-25-intelligence-eval-proof-answer-grammar`

## Status

`candidate`

## Plain-English Summary

This release adjusts a few Intelligence ECL proof-answer phrases so the public answer scrubber does not turn internal table language into awkward visible grammar. It does not change the eval validator, accepted aliases, evidence requirements, or answer logic.

## Layer Impact

- Release lane: `internal-admin`
- Layer 4 Products: updates Intelligence proof-answer wording used by the ECL consultant eval path.
- QA / Proof: adds a regression test that runs proof answers through the public answer scrubber and rejects the awkward phrases seen in the live eval preview.

## Client Applicability

- All clients: no default product behavior change.
- Specific clients: none.
- Internal only: Intelligence ECL eval/proof harness.
- Public/demo only: no public route change.
- Feature flag: existing ECL provider/eval controls only.

## Changes Included

- `src/lib/intelligence/ask/ecl-consultant-proof-answer.ts`
- `src/lib/intelligence/ask/__tests__/ecl-consultant-proof-answer.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/intelligence/ask/__tests__/ecl-consultant-proof-answer.test.ts` — passed, 9/9 tests.
- `npx eslint src/lib/intelligence/ask/ecl-consultant-proof-answer.ts src/lib/intelligence/ask/__tests__/ecl-consultant-proof-answer.test.ts` — passed.
- `npm run ecl:ava-consultant-eval` — passed.
- Additional release checks are required before merge.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow may deploy the updated runtime image. The next live eval run should preserve the already-proven baseline/ablation result while removing the visible grammar artifacts.

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

This PR only polishes visible answer grammar. It does not expand the eval case set or change scoring.
