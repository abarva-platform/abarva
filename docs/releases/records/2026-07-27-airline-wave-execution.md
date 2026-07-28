# 2026-07-27-airline-wave-execution — Airline Knowledge Wave Execution

## Release ID

`2026-07-27-airline-wave-execution`

## Status

`candidate`

## Plain-English Summary

This release records the first governed execution wave for the synthetic Airline Demo New knowledge corpus and fixes the validation rule that incorrectly treated ordinary procurement evaluation notes as restricted evaluator-only truth. It also aligns the Airline Container Apps job template with the execution surface that was proven during the wave: digest-pinned image, tenant-scoped managed identity client id, storage account, and PostgreSQL connection secret.

Post-deploy validation also exposed a retry bookkeeping defect: failed idempotency rows retained their old `run_ref`, so a retry with a new run id could pass semantic checks but fail when writing checkpoints. This release updates the executor retry semantics so non-passed idempotency rows point at the current run id, and failure recording now rolls back aborted transactions before writing failure metadata.

## Layer Impact

- `client-data-lane`: Airline Demo New source registration, parsing, evidence extraction, normalization, identity resolution, and validation evidence are tenant-scoped execution artifacts for the isolated Airline lab data plane.
- `client-data-lane`: The Airline job template is aligned to the proved ACA job execution contract: digest-pinned image, assigned managed identity client id, tenant storage, and PostgreSQL secret wiring.
- `global-control-lane`: The shared knowledge process validator now blocks only explicit restricted evaluator-only / hidden-truth markers, rather than any ordinary text containing the word evaluator.
- `global-control-lane`: The shared knowledge process executor now handles non-passed idempotency retries and aborted-transaction failure recording durably, so governed ACA job evidence keeps the root failure instead of masking it behind a transaction-aborted error.
- CLIENT INTAKE: No client-facing intake template changes.
- PRODUCTS: No product UI or runtime read path changes are included. Home, Source, Moves, Tower, Intelligence, Learn, and Pricing are not cut over by this release.

## Client Applicability

- All clients: No.
- Specific clients: Synthetic Airline Demo New execution lane only.
- Internal only: Airline controlled execution artifacts and job template hardening.
- Public/demo only: Synthetic demo tenant evidence only.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/processing/executor-framework.mjs`
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- `clients/airline-demo-new/18-phase2b3c-azure-lab-implementation/00-implementation-charter/APPROVED_BOUNDARY_SNAPSHOT.json`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/airdn-lab-foundation.bicep`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/main.bicep`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/airdn-lab-jobs.bicep`
- `clients/airline-demo-new/21-processing-wave-execution/**`

## QA / Validation

- `npm run test:knowledge-process-executors` passed locally.
- Governed ACA source registration passed: 48 operational files registered, 25 parser-visible files eligible, evaluator truth absent from source registry, all registered sources blob-backed release members.
- Governed ACA parse passed after supplying the assigned managed identity client id: 25 parser-visible sources, 99,883 parsed records, 0 silent skips.
- Governed ACA evidence extraction passed: 99,883 lineage records, 99,883 entity candidates, 99,883 fact candidates, 66,200 evidence-backed relationship candidates, 0 quarantine/conflict/blockers.
- Governed ACA normalization passed: 264,230 normalized candidate records, 0 quarantine.
- Governed ACA identity resolution passed: 99,015 resolved entity candidates, 0 unresolved, 0 ambiguous.
- Governed ACA semantic validation in the currently deployed image failed on `hidden_truth_references`; diagnostic evidence showed the blocker came from ordinary parser-visible procurement scorecard rows with `evaluator_note`, not restricted evaluator-only material.
- After deploy, governed ACA semantic-validation diagnostics showed the narrowed semantic gate itself returned all zero blockers: 25 parser-visible sources, 25 parsed terminal events, 0 hidden entity markers, 0 hidden fact markers, 0 hidden relationship markers, 0 invalid ids, 0 broken relationships, and 0 silent source skips.
- A follow-up run/ref diagnostic showed the remaining failure was executor retry bookkeeping: the same idempotency key pointed to a failed 2026-07-27 run ref while the retry attempted to write checkpoints for the 2026-07-28 run ref.
- `npm run test:knowledge-process-executors` passed locally after adding retry and aborted-transaction failure-recording coverage.
- After the retry fix was merged and deployed by the repo-owned ACA main lane, governed ACA semantic validation passed on deployed digest `sha256:420b29f3dd36ff0f8865823c3885da8ba162be1bee5b3d6b1f5e741072a4d327`: cross-tenant records 0, broken relationship endpoints 0, hidden-truth references 0, invalid ids 0, silent source skips 0, conflicts 0.
- The next governed wave, knowledge review/apply, failed safely with `no_explicit_accepted_review_decisions`. A read-only ledger diagnostic confirmed 0 review decisions and queued candidates awaiting explicit review: 99,015 entity candidates, 99,015 fact candidates, and 66,200 relationship candidates.

## Rollout Plan

Merge through the protected main PR lane, let the repo-owned ACA main deploy workflow build and deploy the updated digest, then rerun Airline semantic validation against the deployed image. Continue to review-apply, domain publish, baseline publish, projection build, Home read-model refresh, and reconciliation only if semantic validation passes with zero hidden-truth, cross-tenant, missing-as-zero, withheld-drift, candidate-accepted, target/current-drift, and endpoint blockers.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR outside the repo-owned deploy workflow.
- Approved image digest: Generated by the repo-owned main deploy workflow after merge.
- ACA runtime invariant: Required after deploy before rerunning the Airline validation job.
- Worker image invariant: Required after deploy before rerunning the Airline validation job.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this execution-only release; product proof is required after publication and read-model wiring complete.

## Rollback Plan

Rollback the shared ACA runtime to the previous digest if the job runner regression affects production execution. The Airline candidate records already written by the governed execution jobs remain tenant-scoped in the isolated Airline lab database; do not publish or activate a Knowledge Baseline unless the rerun validation and later reconciliation gates pass.

## Audit Evidence

- Airline execution evidence: `clients/airline-demo-new/21-processing-wave-execution/`
- Semantic validation diagnostic: `clients/airline-demo-new/21-processing-wave-execution/06-knowledge-validate/hidden-truth-diagnostic-query-logs-20260727.txt`
- Post-deploy semantic diagnostic: `clients/airline-demo-new/21-processing-wave-execution/06-knowledge-validate/knowledge-validate-sql-diagnostic-20260728-logs.txt`
- Post-deploy run/ref diagnostic: `clients/airline-demo-new/21-processing-wave-execution/06-knowledge-validate/knowledge-validate-runref-diagnostic-20260728-logs.txt`
- Retry-fix validation pass: `clients/airline-demo-new/21-processing-wave-execution/06-knowledge-validate/knowledge-validate-via-deployed-retryfix-20260728-logs.txt`
- Review/apply safe failure: `clients/airline-demo-new/21-processing-wave-execution/07-knowledge-review/knowledge-review-via-validate-job-20260728-logs.txt`
- Review ledger diagnostic: `clients/airline-demo-new/21-processing-wave-execution/07-knowledge-review/knowledge-review-decision-ledger-diagnostic-20260728-logs.txt`
- Test evidence: `npm run test:knowledge-process-executors`

## Known Gaps

- Semantic validation passed on the deployed retry-fix image. Review/apply is now blocked by missing explicit accepted review decisions; publication, baseline activation, projections, Home read model, and reconciliation have not started.
- The currently deployed Airline jobs required one-shot overrides for identity and database connection settings. This release repairs the IaC template, but a future plan/apply is required before every stage job can run without overrides.
- Evidence extraction is correct but slow at current corpus volume; it should be optimized after the controlled execution path is proven.
