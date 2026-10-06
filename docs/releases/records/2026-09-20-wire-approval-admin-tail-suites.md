# 2026-09-20-wire-approval-admin-tail-suites — Wire Approval And Admin Tail Suites

## Release ID

`2026-09-20-wire-approval-admin-tail-suites`

## Status

`candidate`

## Plain-English Summary

This release adds pull-request CI ownership for previously dark approval, lifecycle, and admin-library test coverage. It wires only suites that passed on the current base and quarantines failing or non-live-code files by exact file path.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Adds CI coverage for product-facing approval, notification, narrative, insight-rule, and admin read-model behavior without changing runtime behavior.

Control plane: Updates the pull-request unit workflow and committed test coverage census so future changes cannot silently bypass these suites.

## Client Applicability

- All clients: Shared CI control only.
- Specific clients: None.
- Internal only: Pull-request validation and release evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `.github/workflows/unit-suites.yml` adds two unit-suite steps.
- `docs/architecture/test-ci-coverage-census.json` is refreshed from the updated workflow reachability.

## QA / Validation

- Measured the eight named approval/lifecycle suites unchanged: 8 loaded, 8 collected, 8 run, 7 green; the red lifecycle file remains quarantined.
- Measured the admin library tree unchanged: 38 loaded, 38 collected, 38 run, 33 green; five red files remain quarantined.
- Counted non-test importers for every measured suite subject before wiring. Four green admin policy/runbook files had zero live importers and remain outside the CI-owned live-code set.
- `npx jest --runTestsByPath ... --no-coverage --ci`: 7 suites / 62 tests passed.
- `npx jest src/lib/admin/__tests__ ... --no-coverage --ci`: 29 suites / 232 tests passed.

## Rollout Plan

Merge to `main`. The repo-owned pull-request workflow begins enforcing the newly declared unit-suite steps on future PRs. No migration, data load, feature flag, or tenant data change is included.

## Deployment Authority

- Repo-owned deploy workflow: Not required for runtime behavior; merge may still trigger the standard web image workflow.
- Shared runtime mutators: None.
- Approved image digest: Not applicable before merge.
- ACA runtime invariant: Not applicable before merge; if a deploy runs, verify separately from CI ownership.
- Worker image invariant: Not applicable before merge.
- Feature/env flag update path: None.
- Live signed-in proof required: No. This is CI coverage only.

## Rollback Plan

Revert the workflow and census changes. This removes the added CI ownership and returns the coverage census to its prior shape.

## Audit Evidence

- Local focused Jest runs listed in QA / Validation.
- The committed coverage census diff shows the newly covered and still-quarantined files.
- Pull-request checks for unit suites, release control, lint, and typecheck.

## Known Gaps

The red lifecycle file, five red admin files, and four green-but-orphan admin policy/runbook files remain unwired. They need separate owner decisions or live-path wiring before they can become CI-owned live-code coverage.
