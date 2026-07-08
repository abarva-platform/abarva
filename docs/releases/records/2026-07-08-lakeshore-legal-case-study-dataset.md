# 2026-07-08-lakeshore-legal-case-study-dataset — Add Lakeshore Legal Contract Intake CXO demo dataset

## Release ID

`2026-07-08-lakeshore-legal-case-study-dataset`

## Status

`candidate`

## Plain-English Summary

Commits a synthetic, planning-grade CXO demo dataset (context spine, operational baseline metrics, estimation rate card, delivery scenarios, value model assumptions, golden test questions, master prompt, and README) for the Lakeshore Legal Contract Intake case study into the repo, so it travels with the codebase rather than depending on a local `~/Downloads` path. This is the case-study material behind the live Move `RETAIL-LEGAL-2026` ("Legal and Vendor Contract Obligation Control") already used throughout today's Moves cross-tenant rollout and aVa chat hardening work. Committing it enables any future session or agent (e.g. Codex) to run the planned end-to-end Moves browser-crawl test against real case-study content instead of only fixture data.

This is a docs/dataset addition only — no code, no schema, no product behavior change.

## Layer Impact

- **client-data-lane** (informational only): the dataset describes Lakeshore-scoped demo content, but committing these files to `docs/build/` does not load them into any tenant's data plane, context corpus, or answer-generation path. No ingestion, no embedding, no retrieval wiring. It is source material for a future manual/agent-driven upload-and-test exercise (see `docs/build/lakeshore-legal-contract-intake-cxo-demo-2026-07-05/README.md` and `MASTER_PROMPT.md` for the intended arc).

## Client Applicability

- All clients: No.
- Specific clients: Lakeshore (synthetic demo data only — the dataset's own README states: "do not claim actual Lakeshore production data or realized ROI").
- Internal only: Yes — this is a build/test asset for internal use in proving Moves end-to-end, not a client-facing artifact.
- Public/demo only: N/A.
- Feature flag: None.

## Changes Included

- `docs/build/lakeshore-legal-contract-intake-cxo-demo-2026-07-05/` (new): `01_lakeshore_context_spine.csv`, `02_legal_contract_intake_operational_baseline.csv`, `03_estimation_rate_card.csv`, `04_delivery_scenarios.csv`, `05_value_model_assumptions.csv`, `06_demo_golden_questions.csv`, `MASTER_PROMPT.md`, `README.md`.

## QA / Validation

- `npm run release:check` — passed once this record was added.
- No code changed; no tests/typecheck/lint applicable.

## Rollout Plan

Standard PR → squash-merge to `main`. This is a docs/dataset-only change — no deploy is triggered or required (no runtime code touched), though the normal `aca-main-deploy.yml` workflow will still run on merge per its own trigger rules.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unaffected by this change; may still run per its trigger rules, but has nothing runtime to deploy differently).
- Shared runtime mutators: None.
- Approved image digest: N/A — no runtime image change expected from a docs-only commit.
- ACA runtime invariant: N/A.
- Worker image invariant: N/A.
- Feature/env flag update path: N/A.
- Live signed-in proof required: No — this record only adds source material; the actual end-to-end Moves browser-crawl test using this dataset is separate, planned follow-up work (see the Codex prompt referencing this path).

## Rollback Plan

Revert the commit or delete the directory. No data migration, no runtime dependency on these files from any product code path.

## Audit Evidence

- PR URL: (added when opened)
- Source: originally provided as `~/Downloads/lakeshore-legal-contract-intake-cxo-demo-2026-07-05.zip`, extracted and committed unmodified (content-identical) into `docs/build/`.

## Known Gaps

- The end-to-end Moves phase-by-phase browser crawl using this dataset (uploading each file at its corresponding phase, verifying persistence, and grading answers against `06_demo_golden_questions.csv`'s `must_include`/`must_not_claim` columns) has not been run yet — this commit only makes the source material durably available for that follow-up.
