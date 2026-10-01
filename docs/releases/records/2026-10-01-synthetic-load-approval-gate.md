# 2026-10-01-synthetic-load-approval-gate - Load Approval Gate

## Release ID

`2026-10-01-synthetic-load-approval-gate`

## Status

`candidate`

## Plain-English Summary

The synthetic enterprise context loader could be executed on the strength of values the job supplies about itself: an approval flag, an operator string and a release-record string that only had to be non-empty. It never read the dataset's manifest, and it recorded every row it loaded as reviewed.

The loader now reads the dataset registry and refuses to execute unless the one manifest declaring the dataset is valid, describes what is about to be loaded, and carries a load approval by a named person for the exact assessment and source-set hash. The run's release record must be the one that approval names. No such approval is recorded today, so the loader refuses every executing run until one is committed through a reviewed change.

Rows are loaded as not reviewed. The approval is recorded once, on the source files and in the proof bundle. A run that fails now records the stage it failed at instead of leaving its progress at "running".

## Layer Impact

- Release lane: `client-data-lane` for the synthetic lab loader (operator job code only), and `global-control-lane` for the dataset-manifest contract and its CI validator.
- Layer 1: No change to source files.
- Layer 2: No change to the adapter.
- Layer 3: The loader writes `not_reviewed` instead of `confirmed` on canonical objects and relationships, and records the approval on source-file metadata. This change writes no rows.
- Layer 4: No product read path or serving selection changes.

## Client Applicability

- All clients: The dataset manifest schema gains an optional `load_approval`. Existing manifests are unchanged and remain valid.
- Specific clients: None.
- Internal only: Operator job gate and CI validators.
- Public/demo only: Synthetic lab data only, and only after an approved, explicit job execution.
- Feature flag: None.

## Changes Included

- `src/lib/governance/dataset-manifest.ts`: `load_approval` schema, a named-person rule for its approver, `resolveLoadApproval`, and registry-wide rules (one manifest per dataset, the approval's release record exists).
- `src/scripts/governance/validate-context-corpus.ts`: the `manifests` check applies the registry-wide rules.
- `scripts/ecl/load_synthetic_enterprise_v1.ts`: execution gate resolved from the registry before anything is written; the insert path requires an approval bound to the pack; rows load as `not_reviewed`; failed stages are recorded.
- `scripts/ecl/__tests__/test_synthetic_enterprise_v1_load_gate.ts` (new), `scripts/ecl/__tests__/test_synthetic_enterprise_v1_load.ts`, `src/lib/governance/__tests__/dataset-manifest.test.ts`.
- `.github/workflows/ecl-physical-admission.yml`: runs the gate test, and triggers on every file the generator, adapter, loader and tests read, including the source definition, the relationship map and the dataset registry.
- `.github/workflows/context-corpus-governance.yml`: triggers on changes to the dataset registry, so a change that only adds an approval is validated.
- `docs/governance/NEW_DATASET_ONBOARDING_POLICY.md`: the load-approval rule.

## QA / Validation

- PASS: `npx jest --runTestsByPath src/lib/governance/__tests__/dataset-manifest.test.ts` - 44 tests.
- PASS: `node --import tsx --test scripts/ecl/__tests__/test_synthetic_enterprise_v1_load_gate.ts` - 9 tests, including a run with every job binding present and correct and no recorded approval, which is refused.
- PASS: disposable local Postgres - `test_synthetic_ecl_physical_admission.py`, then `test_synthetic_enterprise_v1_load.ts`: counts unchanged, every loaded object and relationship is `not_reviewed`, all source files carry the approval, a mismatched approval and a second load are refused.
- PASS: mutation check - 34 of 34 single-condition mutants of the new rules, the loader gate, stage recording and the loaded review state were each failed by a named test.
- PASS: the loader CLI with `--execute` and a full set of job bindings exits 1 with `Load approval gate failed: manifest carries no load_approval`, before any storage or database client is created.
- PASS: the loader's read-only mode run from a directory containing only the paths the runtime image copies.
- PASS: `npm run validate:context-corpus`; a planted manifest with a non-person approver, a duplicate dataset id and a missing release record fails it on all three and passes again once removed.
- PASS: `tsc --noEmit` (exit 0, fresh build info), ESLint on touched files (0 errors), `npm run test:ecl-synthetic-enterprise-v1`, the adapter suite, `npm run audit:test-ci-coverage:check`.
- NOT RUN: the executing path's storage calls, which no test exercises.
- NOT RUN: any shared lab operator execution, migration, or load.

## Rollout Plan

Merge through a PR; the ACA main workflow builds and deploys the image. No migration, data operation or flag change. From that image on, the loader refuses to execute until a separate reviewed change adds a `load_approval` to the dataset's manifest. That change triggers the governance and physical-admission workflows.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for the image.
- Shared runtime mutators: None in this change.
- Approved image digest: Resolve from the successful main deploy.
- ACA runtime invariant: Required after image deployment.
- Worker image invariant: Required after image deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: No. This change is not browser-visible and loads nothing.

## Rollback Plan

Revert this PR through a new reviewed PR. Reverting restores a loader that executes without a recorded approval, so do not revert it to unblock a load; record the approval instead.

## Audit Evidence

- PR diff and CI checks, including the physical-admission workflow's gate step.
- The mutation table in the PR description.

## Known Gaps

- The named-person rule refuses strings that plainly are not a person. It cannot prove who typed the name. The control is that an approval is a committed, reviewed line bound to one source-set hash.
- An image built before this change still contains the earlier loader. This gate applies only to runs from an image that includes it.
- The gate does not alter rows an earlier loader version has already written. Those rows keep the review and acceptance states that version recorded until a separate governed job corrects or replaces them.
- Only this loader reads `load_approval`. Other operator loaders do not yet.
- The manifest-level `approved_by` rule is unchanged: it accepts any non-empty string. In 10 of the 23 manifests in the registry it names a role, a team, a task or an agent rather than a person.
- Storage uploads still precede the database transaction, so a failed run leaves its immutable source blobs in place.
