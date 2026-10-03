# 2026-10-01-synthetic-load-approval-gate - Load and Serving Approval Gates

## Release ID

`2026-10-01-synthetic-load-approval-gate`

## Status

`candidate`

## Plain-English Summary

The synthetic enterprise context jobs could each be executed on the strength of values the job supplies about itself: an approval flag, an operator string and a release-record string that only had to be non-empty. None of them read the dataset's manifest. The loader recorded every row it loaded as reviewed, and the job that selects a version for Home needed no person's approval at all.

The jobs now read the dataset registry and refuse unless it approves the exact version:

- The loader, and the job that writes a Home projection, need a load approval: a named person's, for the exact assessment and source-set hash, in the one valid manifest that declares the dataset and describes what is being loaded. The loader's run must also name the release record that approval names.
- The job that makes a version Home's active assessment needs a serving approval on top of that: a named person's, for the same version, for that surface. A check-only run reports the decision and changes nothing. Retiring a served version, which returns Home to what it served before, needs neither.

No such approval is recorded today for any version, so an executing load, a projection and a promotion are each refused until one is committed through a reviewed change.

Rows are loaded as not reviewed. The load approval is recorded once, on the source files and in the proof bundle; a promotion records its serving approval in its proof. A load that fails now records the stage it failed at instead of leaving its progress at "running".

Five job scripts also no longer exit successfully without running. Their entry checks compared unresolved paths, so a run started through a symlinked directory was treated as an import: it printed nothing and exited 0. That included the retirement job.

## Layer Impact

- Release lane: `client-data-lane` for the synthetic lab jobs (operator job code only), and `global-control-lane` for the dataset-manifest contract and its CI validator.
- Layer 1: No change to source files.
- Layer 2: No change to the adapter.
- Layer 3: The loader writes `not_reviewed` instead of `confirmed` on canonical objects and relationships, and records the approval on source-file metadata. This change writes no rows.
- Layer 4: No product read path changes. The job that changes Home's serving selection gains a gate; the selection itself is untouched.

## Client Applicability

- All clients: The dataset manifest schema gains an optional `load_approval` and `serving_approval`. Existing manifests are unchanged and remain valid; a manifest whose own sign-off names an agent, team, role or delegation now produces a warning.
- Specific clients: None.
- Internal only: Operator job gates and CI validators.
- Public/demo only: Synthetic lab data only, and only after an approved, explicit job execution.
- Feature flag: None.

## Changes Included

- `src/lib/governance/dataset-manifest.ts`: `load_approval` and `serving_approval` schemas, a named-person rule for their approvers, `resolveLoadApproval`, `resolveServingApproval`, a warning for a non-person dataset sign-off, and registry-wide rules (one manifest per dataset, each approval's release record exists).
- `src/scripts/governance/validate-context-corpus.ts`: the `manifests` check applies the registry-wide rules.
- `scripts/ecl/load_synthetic_enterprise_v1.ts`: execution gate resolved from the registry before anything is written; the insert path requires an approval bound to the pack; rows load as `not_reviewed`; failed stages are recorded.
- `scripts/ecl/project_synthetic_enterprise_home.ts`: refuses without the version's load approval.
- `scripts/ecl/promote_synthetic_enterprise_home.ts`: a promoting run refuses without the version's serving approval; a check run reports it; the admission proof records it.
- Those three, `scripts/ecl/retire_synthetic_enterprise_home.ts` and `scripts/ecl/readback_synthetic_enterprise_v2.ts`: the entry check uses the repository's `isDirectInvocation`, which compares resolved files.
- Tests: `scripts/ecl/__tests__/test_synthetic_enterprise_v1_load_gate.ts` (new), `test_synthetic_enterprise_home_gates.ts` (new), `synthetic_enterprise_gate_fixtures.ts` (new, shared fixtures), `test_synthetic_enterprise_v1_load.ts`, `test_synthetic_enterprise_v2_load.ts`, `src/lib/governance/__tests__/dataset-manifest.test.ts`.
- `.github/workflows/ecl-physical-admission.yml`: runs both gate tests, and triggers on every file the generator, adapter, jobs and tests read, including the source definitions, the relationship map and the dataset registry.
- `.github/workflows/context-corpus-governance.yml`: triggers on changes to the dataset registry, so a change that only adds an approval is validated.
- `docs/governance/NEW_DATASET_ONBOARDING_POLICY.md`: the load-approval and serving-approval rules.
- `docs/releases/records/2026-10-01-synthetic-enterprise-canonical-load.md`: one validation line corrected from not run to passed.

## QA / Validation

- PASS: `npx jest --runTestsByPath src/lib/governance/__tests__/dataset-manifest.test.ts` - 60 tests.
- PASS: `node --import tsx --test scripts/ecl/__tests__/test_synthetic_enterprise_v1_load_gate.ts` - 10 tests, including a run with every job binding present and correct and no recorded approval, which is refused, and the loader started directly, through a symlinked root, and by import.
- PASS: `node --import tsx --test scripts/ecl/__tests__/test_synthetic_enterprise_home_gates.ts` - 4 tests: the promotion and projection decisions; each of the four other job scripts started directly, through a symlinked root, and by import; and each gated job run as a process with every binding present, which stops at the registry gate, or at the next check when the registry approves. That last test was also run with approvals temporarily planted in the registry, to exercise both outcomes.
- PASS: disposable local Postgres, the workflow's full sequence: `test_synthetic_ecl_physical_admission.py`, both gate tests, the load round trips for both source versions, the Home serving-view migrations, the Home projection test, the selection migration and the promotion proof test. Counts are unchanged for both source versions, every loaded object and relationship is `not_reviewed`, all source files carry the approval, a mismatched approval and a second load are refused.
- PASS: mutation check - 56 of 56 single-condition mutants of the manifest rules, the loader gate, the projection and promotion gates, stage recording, the five entry checks and the loaded review state were each failed by a named test.
- PASS: for each source version, the loader CLI with `--execute` and a full set of job bindings exits 1 with `Load approval gate failed: manifest carries no load_approval`, before any storage or database client is created.
- PASS: the loader's read-only mode run from a directory containing only the paths the runtime image copies.
- PASS: `npm run validate:context-corpus`; a planted manifest with a non-person approver, a duplicate dataset id and a missing release record fails it on all three and passes again once removed. On the committed registry it passes and reports 11 of 24 manifests whose own sign-off is not a person.
- PASS: `tsc --noEmit` (exit 0, fresh build info), ESLint on touched files (0 errors), `npm run test:ecl-synthetic-enterprise-v1`, `npm run test:ecl-synthetic-enterprise-v2`, the adapter suite, `npm run audit:test-ci-coverage:check`.
- NOT RUN: the storage and database calls of the executing paths of the loader, projection and promotion jobs beyond what the disposable-database tests drive.
- NOT RUN: any shared lab operator execution, migration, load, projection or promotion.

## Rollout Plan

Merge through a PR; the ACA main workflow builds and deploys the image. No migration, data operation or flag change. From that image on, a load, a projection and a promotion are refused until a separate reviewed change adds the approval to the dataset's manifest. That change triggers the governance and physical-admission workflows.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for the image.
- Shared runtime mutators: None in this change.
- Approved image digest: Resolve from the successful main deploy.
- ACA runtime invariant: Required after image deployment.
- Worker image invariant: Required after image deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: No. This change is not browser-visible and loads, projects and promotes nothing.

## Rollback Plan

Revert this PR through a new reviewed PR. Reverting restores jobs that execute without a recorded approval, so do not revert it to unblock a load or a promotion; record the approval instead. The retirement job is not gated by an approval and stays available.

## Audit Evidence

- PR diff and CI checks, including the physical-admission workflow's two gate steps.
- The mutation table in the PR description.

## Known Gaps

- The named-person rule refuses strings that plainly are not a person. It cannot prove who typed the name. The control is that an approval is a committed, reviewed line bound to one source-set hash.
- An image built before this change still contains the earlier jobs. These gates apply only to runs from an image that includes them.
- The gates do not alter rows, projections or serving selections that earlier job versions have already written. Those keep the review, acceptance and serving states those versions recorded until a separate governed job corrects, replaces or retires them.
- Only these jobs read the approvals. Other operator loaders do not yet.
- The manifest's own `approved_by` is reported, not refused, when it names an agent, team, role or delegation: 11 of the 24 manifests in the registry do.
- A serving approval is bound to the assessment and source-set hash, not to the hash of the projected rows.
- Storage uploads still precede the database transaction, so a failed run leaves its immutable source blobs in place.
