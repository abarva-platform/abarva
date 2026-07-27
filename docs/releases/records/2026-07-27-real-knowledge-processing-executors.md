# 2026-07-27-real-knowledge-processing-executors — Real Processing Executor Framework

## Release ID

`2026-07-27-real-knowledge-processing-executors`

## Status

`candidate`

## Plain-English Summary

This release converts the shared tenant data-job runner from a dispatch-only envelope into a real process-execution framework. Execute mode now resolves a process handler, acquires an idempotent run lock, runs plan/execute/verify, records counts and lineage, and only reports success after verification passes. The default handler registry now covers source registration, deterministic structured parsing, evidence/candidate extraction, normalization, entity resolution, semantic validation, explicit-review application, domain publication, baseline publication, consumption projection, Home read-model verification, and evaluator-only reconciliation. Review and publication stages still fail closed when their prerequisites are not present.

## Layer Impact

- Release lane: `client-data-lane`.
- Client intake: No client-facing template changes.
- Source adapters: Adds the shared executor framework, source-registration verification, deterministic CSV/JSON/JSONL/XLSX/text parsing, and candidate/evidence extraction.
- Canonical model: Adds code paths that can write candidates, accepted Knowledge, domain publications, active baselines, and consumption projections when run in a governed data job. No full tenant wave is executed by this code PR.
- Products: No Home, Source, Moves, Tower, Intelligence, Learn, Pricing, Cube, or aVa runtime reads change.
- Operations/governance: Adds run-lock, checkpoint, verification, semantic gate, explicit-review, last-known-good baseline, and process-failure semantics for future data-plane jobs.

## Client Applicability

- All clients: The executor framework is tenant-neutral and reusable.
- Specific clients: No client tenant is activated by this release.
- Internal only: Yes, this is operator/data-plane execution infrastructure.
- Public/demo only: No product-facing demo change.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/hcdn-job-runner.mjs`
- `scripts/knowledge/processing/executor-framework.mjs`
- `scripts/knowledge/processing/process-handlers.mjs`
- `scripts/knowledge/processing/semantic-gates.mjs`
- `scripts/knowledge/__tests__/run-hcdn-job-runner-tests.mjs`
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- `package.json` script `test:knowledge-process-executors`

Default process-handler coverage:

- `source-register-v1`: verifies landed source registry counts and evaluator separation.
- `source-parse-v1`: parses parser-visible structured sources and records terminal parse states.
- `evidence-extract-v1`: creates evidence items and working entity/fact/relationship candidates.
- `knowledge-normalize-v1`: records normalization lineage while preserving source values.
- `entity-resolve-v1`: creates deterministic canonical identity references from candidate values.
- `knowledge-validate-v1`: blocks hidden-truth exposure, broken endpoints, invalid IDs, cross-tenant records, and silent source skips.
- `knowledge-review-v1`: applies only explicit accepted review decisions; no synthetic blanket approval.
- `domain-publish-v1`: writes immutable domain publication rows from accepted Knowledge.
- `baseline-publish-v1`: activates a baseline atomically through the shared publication function.
- `projection-build-v1`: builds `consumption.*_v1` rows from the active baseline.
- `home-readmodel-v1`: verifies Home-readable projection rows.
- `reconciliation-audit-v1`: writes evaluator reconciliation output only; it does not mutate evidence, candidates, Knowledge, publications, or projections.

## QA / Validation

Local validation status before PR: pass.

- `npm run test:hcdn-job-runner` — pass.
- `npm run test:knowledge-process-executors` — pass.

Additional validation will run before merge:

- `npm run test:phase3c2e-data-layer`
- `npm run test:airline-source-landing`
- `npm run release:check`
- `git diff --check`

## Rollout Plan

Merge the code and rebuild the approved worker image through the governed Azure Container Apps lane before any execute-mode data job uses the new framework. After image digest relock, run process handlers in plan/preflight mode first. Full tenant corpus processing remains a separate execution PR and must proceed wave by wave with reconciliation after each wave.

## Deployment Authority

- Repo-owned deploy workflow: Required before worker jobs use the updated code.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured after the governed image build.
- ACA runtime invariant: Required before claiming any worker image is active.
- Worker image invariant: Required before executing data jobs with this framework.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not in this PR; product proof starts only after a published Knowledge Baseline exists.

## Rollback Plan

Revert this PR before using the new framework in worker jobs. If a later data execution has already used the framework, rollback is by stopping downstream waves and preserving the last-known-good active Knowledge Baseline pointer; this PR itself does not mutate tenant business data.

## Audit Evidence

- PR for this release.
- Focused runner and executor test output.
- Release check output.
- Future worker image digest and job preflight output before execution PRs.

## Known Gaps

- No full tenant corpus processing run is included in this code PR.
- No tenant Knowledge Baseline is published by this PR.
- No product consumption proof is included.
- Airline-specific source-family enrichment beyond the default deterministic structured parser remains part of the execution wave, where each source family can provide a stricter adapter if needed.
