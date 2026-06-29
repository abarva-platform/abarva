# 2026-06-29-tower-handoff-contract-wording — Tower handoff scorer precision

## Release ID

`2026-06-29-tower-handoff-contract-wording`

## Status

`candidate`

## Plain-English Summary

The Tower answer-contract scorer was falsely failing correct Home/Explorer handoff answers because the forbidden internal word `rows` was matched as a substring inside `browse` and `browsing`. This release makes the scorer match single-word forbidden terms as words, and slightly cleans Tower's Home/Explorer handoff copy from source browsing to source review.

## Layer Impact

- `global-control-lane`: Updates the shared Tower answer-contract quality gate and Tower boundary answer copy. No tenant-specific data or schema changes are included.

## Client Applicability

- All clients: Yes, wherever Tower answer-contract scoring and Tower boundary routing are used.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/cio-tower/answer-contract.ts`: Match simple forbidden phrases as whole words to avoid false positives such as `browse` triggering the `rows` guard.
- `src/lib/cio-tower/answer.ts`: Adjust Home/Explorer boundary wording to source review.
- `src/lib/cio-tower/__tests__/answer-contract.test.ts`: Add regression coverage proving `browse` is not treated as `rows`.

## QA / Validation

- `npx jest src/lib/cio-tower/__tests__/answer-contract.test.ts src/lib/cio-tower/__tests__/answer.test.ts --runInBand` — passed, 18/18 tests.
- `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/answer-contract.ts src/lib/cio-tower/__tests__/answer-contract.test.ts` — passed.
- `git diff --check` — passed.
- `npm run release:check` — pending before PR.

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps main deploy workflow to publish the image, then rerun the VNet Tower answer-contract scorer for `skyharbor-air`.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared ACA runtime deployment.
- Shared runtime mutators: No manual shared-runtime mutation in this PR.
- Approved image digest: Produced by the main ACA deploy after merge.
- ACA runtime invariant: Must be verified after deploy.
- Worker image invariant: Private operator may be temporarily updated to the deployed digest for VNet proof, then restored.
- Feature/env flag update path: None.
- Live signed-in proof required: Not required for the scorer-only proof; VNet scorer proof is required.

## Rollback Plan

Revert the PR if the scorer precision change masks a real forbidden phrase failure. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- Local Jest/ESLint/release-check output.
- VNet Tower answer-contract scorer output after deployment.

## Known Gaps

This release only fixes the false-positive handoff scorer failure. It does not change Tower dashboard data, deterministic metric calculations, or advisory answer generation.
