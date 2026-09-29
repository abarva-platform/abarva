# 2026-09-29 Source Ticket History Intake

## Release ID

`2026-09-29-source-ticket-history-intake`

## Status

`candidate`

## Plain-English Summary

The Scope ticket-history step now accepts a file of observed L2/L3 ticket counts by service tower, month, and time window. The downloadable template and upload parser agree on those fields. Finance-owned value assumptions remain a separate template and cannot by themselves satisfy the ticket-history evidence gate.

## Layer Impact

Release lane: `global-control-lane`. This changes the shared Source intake contract for enrolled clients; it does not load or alter any client's dataset by release.

- Layer 1 client intake: the ticket-history workbook requests ITSM-owned counts and source basis, not change-order spend or projected savings.
- Layer 2 source adapter: the deterministic file parser validates the whole ticket file before any row is written and preserves file hash, source row, tier, period, time window, and source basis.
- Layer 3 canonical fact model: typed, cited event facts record observed counts without representing them as financial actuals. No schema or migration change.
- Layer 4 Source: the Scope step and evidence readback use the new ticket contract. SLA baseline remains independently required on the responsibility/SLA step.

## Client Applicability

- All clients: available only where the existing Source analytics flag and authorized Source workflow are enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing `source_analytics` route gate; no new flag.

## Changes Included

- `TICKET_HISTORY_V1` template, file-backed whole-file validation, byte-hash lineage, and ticket evidence derivation.
- Scope step and required-evidence binding corrected to separate ticket history from finance and SLA inputs.
- Tests for parser, workbook, progressive task readback, evidence gate, tenant fencing, and mutation regressions.
- No migration, data build, external communication, or supplier action.

## QA / Validation

- Pass: red-first focused tests reproduced the missing ticket template and false financial-fact evidence receipt.
- Pass: removing the breach bound made the invalid-file test fail; removing file-hash grouping made the cross-file gate test fail. Both guards were restored.
- Pass: 70 Source fact/canvas suites / 776 tests, route upload suite / 11 tests, TypeScript, scoped ESLint, release check, and exact generated-scaffold measurement diff.
- Not run: PR CI, post-merge ACA runtime proof, and signed-in production replay of the exact failed Scope upload.

## Rollout Plan

Squash merge only after applicable PR CI and review are green. Let the repository-owned ACA main workflow build and deploy the merge SHA. Verify digest-pinned web template, sole 100%-traffic revision, and required worker jobs before retrying the signed-in ticket upload. No migration or operator data job is involved.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: to be recorded after workflow completion.
- ACA runtime invariant: web template and 100%-traffic revision must match the approved digest.
- Worker image invariant: required delivery jobs must match the approved digest.
- Feature/env flag update path: no change.
- Live signed-in proof required: upload the same synthetic ticket fixture, confirm typed fact readback and ticket evidence readiness, then continue the Scope step.

## Rollback Plan

Revert this release in a new PR and use the repo-owned main deploy workflow. Facts already written remain cited and tenant-scoped; a rollback does not silently delete event evidence. No database migration needs reversal.

## Audit Evidence

The PR, applicable CI, official deployment run, immutable runtime readback, and signed-in Scope replay will be appended to the private smoke ledger. This public record contains no tenant fixture or private screenshot.

## Known Gaps

- Other Scope sample-scaffold fields still require separate live-authority review; this release does not assert their completion.
- Ticket counts establish observed workload evidence only. They do not validate contract economics, SLA target terms, finance actuals, or a stage approval.
