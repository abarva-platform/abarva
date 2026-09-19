# 2026-09-19-programs-lifecycle-crawl-gate - Programs Lifecycle Crawl Gate Widening

## Release ID

`2026-09-19-programs-lifecycle-crawl-gate`

## Status

`candidate`

## Plain-English Summary

This change makes the Programs lifecycle crawl inspect canonical gate aliases through the
TypeScript syntax tree instead of depending on quote formatting. It adds the repaired suite to the
dedicated Programs pull-request gate and closes the final cataloged exclusion from this triage wave.
Product runtime behavior is unchanged.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4 - Products: Programs test coverage only. Product behavior is unchanged.
- CI governance: the selected Programs gate grows from twenty-five suites and 515 tests to twenty-six suites and 530 tests, including environment-gated database cases.

## Client Applicability

- All clients: Test coverage applies to the shared Programs product surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/__tests__/integration/programs/full-lifecycle-crawl.test.ts`
- `.github/workflows/programs-governance-integration.yml`
- `docs/architecture/programs-governance-integration-triage.json`
- `src/__tests__/behaviors/programs-governance-integration-ci.test.ts`

## QA / Validation

- PASS - repaired pure lifecycle checks, 3 passed; 12 database cases remain correctly credential-gated.
- PASS - twenty-six-suite governed Programs subset, 518 passed and 12 environment-gated tests.
- PASS - workflow-removal mutation failed the wiring contract as expected.
- PASS - scoped ESLint.
- PASS - TypeScript with an 8 GB heap.
- PASS - `npm run release:check`.

## Rollout Plan

Merge the pull request to main. The repository-owned deploy workflow may carry this repository-only
change in a later image; no product behavior needs activation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only if the commit is carried in a web image.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the pull request. The Programs governance workflow returns to its prior twenty-five-suite subset;
no product or data state changes.

## Audit Evidence

- Local validation commands are listed above.

## Known Gaps

The lifecycle suite's database crawl remains dependent on approved credentials and is skipped when
they are absent. The pure gate behavior remains mandatory in every pull request.
