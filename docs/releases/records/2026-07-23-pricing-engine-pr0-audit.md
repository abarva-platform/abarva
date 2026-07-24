# 2026-07-23 — Nexus Pricing Engine PR0: Current-State Audit

## Release ID

`2026-07-23-pricing-engine-pr0-audit`

## Status

`released`

## Plain-English Summary

Before building the new Nexus Pricing Engine (workforce/rate-card reference library, scope-to-effort estimator, client pricing profiles, approved ROM/business-case snapshots), we audited the real repository to see what already exists and where the new capability should live. This PR adds only a documentation file — `docs/architecture/PRICING_ENGINE_CURRENT_STATE.md` — recording that finding and the resulting build decision. No application code, schema, or runtime behavior changed.

The audit found two substantial pre-existing systems that overlap with the new engine's goals: the Moves Expert Kernel's rate-card/effort-estimator/business-case-compiler subsystem, and a dormant-but-partially-wired 321-role Workforce Economics parametric estimator. After reviewing the finding, the product decision is to build the new pricing engine fresh, per the original execution brief, as an independent `pricing_*` schema and `src/lib/pricing/` module, coexisting with those two systems for now rather than consolidating onto them.

## Layer Impact

- **Documentation only.** No `global-control-lane`, `client-data-lane`, `internal-admin`, `public-demo`, or `experimental` runtime layer is touched. No migration, API, UI, or feature flag changed.

## Client Applicability

- All clients: no change (docs only)
- Specific clients: none
- Internal only: this record and the audit doc are internal engineering artifacts
- Public/demo only: no
- Feature flag: none introduced

## Changes Included

- `docs/architecture/PRICING_ENGINE_CURRENT_STATE.md` (new) — 13-section current-state audit plus a §14 direction-decision addendum, covering: existing pricing/rate-card/business-case code, Move/Phase/Workspace/Artifact/Approval schema, admin context-layer template registry and governed load path, migration/RLS/tenant-isolation conventions, the P4 business-case cost/ROI gate (`critic.ts`'s `cfoChallenge`), decimal/currency helpers (none exist today), reusable form/wizard/table/approval components, API/server-action conventions, the context broker/validated-agent-bundle path, the canonical tenant key pattern and its alias gotcha, corrected seams versus the original brief's guesses, and a recommended schema/ownership approach for PR1+.

## QA / Validation

- `node scripts/release-check.mjs --base origin/main --head HEAD` — run locally; passed once this release record was added (Release Control Gate requires a record for any `docs/architecture/**` change).
- No migrations, tests, lint, or typecheck were run because no runtime code changed (audit-only PR, consistent with brief §11 "PR 0 ... no runtime behavior change").

## Rollout Plan

Merge to `main` via squash-merge PR. No deploy, migration, or flag flip — documentation only. No Azure Container Apps involvement.

## Deployment Authority

Not applicable — this release does not touch Azure Container Apps, deploy workflows, runtime images, feature flags, environment variables, worker jobs, traffic, or DNS.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: n/a
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a
- Live signed-in proof required: no

## Rollback Plan

Revert the PR (single documentation file). No migration or runtime rollback needed.

## Audit Evidence

- `docs/architecture/PRICING_ENGINE_CURRENT_STATE.md` (this PR)
- PR URL: recorded after PR is opened
- `release-check` pass output captured in CI run for this PR

## Known Gaps

PR1 (taxonomy normalization and reference pack) has not started. The audit identified that the brief's assumed workbook seed filename (`AbarVa_Workforce_Model_v3.xlsx`) does not exist on disk; PR1 will need to select and record an actual seed source before conversion. This is expected follow-on work, not a gap in this PR.
