# 2026-09-30-source-ticket-evidence-excerpt-coverage — Preserve later parsed ticket rows

## Release ID

`2026-09-30-source-ticket-evidence-excerpt-coverage`

## Status

`candidate`

## Plain-English Summary

The ticket-history draft prompt can now see later excerpts from an uploaded, parsed Scope CSV. Previously it saw only the first 500 characters of the first excerpt, so a draft could overlook later rows. The expanded excerpt remains bounded and is explicitly marked potentially incomplete; it cannot be treated as a complete workload or SLA baseline without source-row verification.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Source draft projection only. No canonical evidence fact, tenant identity, evidence authority, approval, or supplier-facing release rule changes.

## Client Applicability

- All clients: yes, when generating a ticket-history synthesis from parsed Scope CSV evidence.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- d07 prompt version 3 requests bounded multi-excerpt coverage for Scope CSVs; unrelated artifacts retain the existing single-excerpt limit.
- Prompt tests assert later rows are visible, unrelated-stage context is unchanged, and truncated context is labeled.
- No route, schema, worker, or data-build change.

## QA / Validation

- Pass: the prompt test failed before the fix because a later ticket row was absent.
- Pass: disabling the d07 option after the fix made both new tests fail; restoring it passed the focused suite (61/61).
- Pass: all 13 adjacent generation suites, 159 tests; scoped ESLint; TypeScript `--noEmit`; `npm run release:check`; diff check.
- Not run: applicable CI, live signed-in regeneration and source-row reconciliation; record these separately before claiming acceptance.

## Rollout Plan

Squash merge through a PR after local and applicable CI validation. Only the repo-owned ACA main workflow may deploy the exact commit to the shared runtime. No migration, data job, flag change, or ad-hoc traffic command is involved.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: no ad-hoc mutator authorized.
- Approved image digest: capture from the official main deploy workflow.
- ACA runtime invariant: verify the digest-pinned web template and Healthy/Running 100%-traffic revision.
- Worker image invariant: verify both required delivery workers match the same digest.
- Feature/env flag update path: none.
- Live signed-in proof required: regenerate the ticket-history draft on a controlled synthetic event and reconcile all source rows and resulting statements.

## Rollback Plan

Revert through a PR and redeploy via the main workflow. Existing Client Finals and prior generation receipts remain in history; no data rollback is required.

## Audit Evidence

Red-first and mutation test output, PR checks, official ACA run and digest readback, then signed-in draft and source-row reconciliation. The latter proof is not claimed by this candidate record.

## Known Gaps

Parsed excerpts can still be partial. This change cannot certify a model-generated total or turn illustrative ticket rows into an operational demand baseline; human review and governed fact checks remain required.
