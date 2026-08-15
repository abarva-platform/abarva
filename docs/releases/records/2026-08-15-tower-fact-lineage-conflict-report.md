# 2026-08-15-tower-fact-lineage-conflict-report - Tower Fact Lineage Conflict Report

## Release ID

`2026-08-15-tower-fact-lineage-conflict-report`

## Status

`candidate`

## Plain-English Summary

This candidate updates the Tower fact lineage report so it can distinguish corroborated facts, uncorroborated facts, absent facts, and conflicting facts. The report now compares values across configured source files and flags material disagreement before anyone quotes a headline number.

## Layer Impact

Release lane: `global-control-lane`.

Layer 3 / governance tooling: Strengthens deterministic source-of-record checks for Tower headline metrics. It does not change tenant data, canonical tables, Source or Tower runtime pages, loaders, retrieval, or model prompts.

## Client Applicability

- All clients: Applies to internal/reporting use of Tower lineage validation across configured tenant packs.
- Specific clients: None.
- Internal only: Yes, this is a reporting/governance script.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/tower/fact-lineage-report.mjs`
- `docs/releases/records/2026-08-15-tower-fact-lineage-conflict-report.md`

## QA / Validation

- PASS: `node scripts/tower/fact-lineage-report.mjs` completed from registry-driven active tenants and emitted `ONE_SOURCE 17`, `ABSENT 14`, `AGREE 5`, and `CONFLICT 6`.
- PASS: `node scripts/tower/fact-lineage-report.mjs --metric vendor_run_rate_usd` completed and emitted one material conflict plus uncorroborated one-source rows.
- PASS: `node scripts/tower/fact-lineage-report.mjs --metric it_budget_usd` completed and emitted one agreed tenant row plus one-source rows that must be described as uncorroborated.

## Rollout Plan

Merge through a PR. No Azure Container Apps runtime rollout, data-plane load, migration, feature flag, or signed-in browser proof is required because this is an offline governance/reporting script. Operators regenerate `reports/tower-fact-lineage/lineage.md` and `lineage.json` by running the script before quoting Tower numbers.

## Deployment Authority

- Repo-owned deploy workflow: Not required for script-only governance tooling.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the script and release-record changes in a follow-up PR. No database or runtime rollback is required.

## Audit Evidence

- Local validation command output from `node scripts/tower/fact-lineage-report.mjs`.
- PR review diff for `scripts/tower/fact-lineage-report.mjs`.
- Regenerated `reports/tower-fact-lineage/lineage.md` and `lineage.json` when an operator runs the script.

## Known Gaps

The script only evaluates configured headline metrics and configured source locations. Expanding coverage to additional metrics remains separate work.
