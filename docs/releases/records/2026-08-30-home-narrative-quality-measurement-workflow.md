# 2026-08-30-home-narrative-quality-measurement-workflow — Home Narrative Quality Measurement Workflow

## Release ID

`2026-08-30-home-narrative-quality-measurement-workflow`

## Status

`candidate`

## Plain-English Summary

Add a manual workflow for running the Home chapter quality measurement in a governed CI
environment that has access to the model secret. The job runs the three planned
measurement variants and uploads the resulting artifacts for review.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 / Products: adds an operator QA path for Home narrative generation. The workflow
does not publish generated prose or change the Home route.

Control plane: adds a manual GitHub Actions workflow that requires the repository model
secret and uploads measurement artifacts.

Data plane: no persistence mutation, schema change, tenant promotion, or Azure data-build
execution.

## Client Applicability

- All clients: No direct product behavior change.
- Specific clients: None named in this public record.
- Internal only: Operators can manually run the measurement workflow for a selected tenant.
- Public/demo only: No public route change.
- Feature flag: None.

## Changes Included

- `.github/workflows/home-narrative-quality-measurement.yml`: manual workflow that runs
  `npm run data-build:home-chapters:measure` with the selected tenant and uploads the
  measurement output directory as an artifact.
- This release record.

## QA / Validation

- PASS: workflow YAML parsed locally with Ruby's YAML parser.
- PASS: `git diff --check`.
- PASS: workflow includes an explicit required-secret guard for `ANTHROPIC_API_KEY` before
  the measurement command runs.
- NOT RUN: live measurement workflow, because this PR only adds the manual entry point.

## Rollout Plan

Manual only through GitHub Actions `workflow_dispatch`.

## Deployment Authority

- Repo-owned deploy workflow: Not required.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No, because this is a manual QA workflow only.

## Rollback Plan

Remove `.github/workflows/home-narrative-quality-measurement.yml`. No database rollback is
required.

## Audit Evidence

- Workflow artifact: `home-narrative-quality-measurement-<tenant_key>`.
- Expected output: `<tenant_key>-home-chapter-quality-measurement.json`.

## Known Gaps

- The workflow has not yet been manually dispatched from `main`.
- Measurement output must be reviewed before changing Home chapter assembly limits,
  synthesis budget, prompts, or published content.
