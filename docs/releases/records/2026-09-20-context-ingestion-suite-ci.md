# 2026-09-20-context-ingestion-suite-ci — Run Context Ingestion Tests in CI

## Release ID

`2026-09-20-context-ingestion-suite-ci`

## Status

`candidate`

## Plain-English Summary

The tests protecting structured intake, parsing, provenance, and ingestion readiness now run on
every pull request. The repair also restores required semantic metadata for document exceptions and
routes supported structured files through the format-aware parser.

## Layer Impact

- `global-control-lane`: shared ingestion behavior and CI ownership.
- Layer 2 source adapters: structured upload parsing and preflight metadata requirements.
- Database schema and tenant rows: unchanged.

## Client Applicability

- All clients: shared ingestion controls.
- Specific clients: none.
- Feature flag: none.

## Changes Included

- Requires purpose, authoritative sections, and metric definitions when document formats use the
  governed metadata path.
- Uses the format-aware parser for CSV, JSON, JSONL, and YAML intake.
- Replaces removed external test-fixture dependencies with small inline examples.
- Runs all context-ingestion suites in the unit workflow and adds a coverage-census contract.

## QA / Validation

- Baseline: 24 of 27 suites passed; 150 of 161 tests passed.
- After repair: 27 suites and 161 tests pass.
- The two tenant-context files were diffed and are divergent suites, not duplicate copies; both run.
- The tree has 45 non-test importers.
- Mutation checks cover format-aware parsing and document metadata enforcement.
- Behavior, TypeScript, lint, release control, and workflow parsing must pass before merge.

## Rollout Plan

Squash-merge through the protected repository. The repo-owned ACA deploy publishes the release; no
manual runtime mutation is authorized.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Live signed-in proof required: no; this is an intake/control change with automated behavior proof.

## Rollback Plan

Revert the squash commit. No schema or tenant-data rollback is required.

## Audit Evidence

- Baseline, repaired, and mutation results are recorded under execution item T-414.
- The behavior contract proves the entire context-ingestion tree remains owned by CI.

## Known Gaps

This release does not load any dataset or grant `agent_ready`; those states remain governed by the
existing manifest, review, indexing, and citation requirements.
