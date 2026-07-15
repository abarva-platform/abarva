# 2026-07-15-meridian-data-state-reconciliation — Meridian Data State Reconciliation Proof

## Release ID

`2026-07-15-meridian-data-state-reconciliation`

## Status

`candidate`

## Plain-English Summary

Adds a Meridian Health data-state reconciliation audit and proof pack for the Agent Assist demo. The change does not rebuild the data layer, promote candidate data, write production data, or change module runtime behavior. It audits the existing Meridian standard v3 tenant inputs, generated proof pack, evidence manifest, relationship graph, source adapters, legacy leakage status, AWS/Databricks semantics, Agent Assist readiness, and Moves phase readiness.

## Layer Impact

- `client-data-lane`: tightens Meridian Health active synthetic tenant inputs where legacy labels or production-ish AWS/Databricks wording could leak into the demo path.
- `public-demo`: adds `npm run audit:meridian-data-state-reconciliation` to generate CSV, JSON, Markdown, and HTML proof artifacts for the Meridian Agent Assist CDAO demo.
- `internal-admin`: adds source-to-layer and module-readiness reports under `reports/demo-readiness/meridian-data-state/` for operator review.
- Runtime application: no runtime behavior change.

## Client Applicability

- All clients: none.
- Specific clients: Meridian Health proof/audit only.
- Internal only: AbarVa demo-readiness and engineering review.
- Public/demo only: Meridian Agent Assist CDAO demo evidence pack.
- Feature flag: none.

## Changes Included

- `scripts/audit/meridian-data-state-reconciliation.mjs`
- `package.json` script `audit:meridian-data-state-reconciliation`
- Generated reports under `reports/demo-readiness/meridian-data-state/`
- This release record.

## QA / Validation

- Pass: `npm run audit:meridian-data-state-reconciliation`
- Pass: `npm run audit:no-legacy-tenant-inputs`
- Pass: `npm run audit:canonical-tenant-inputs`
- Pass: `npm run audit:tenant-input-quality`
- Pass: `npm run audit:enterprise-knowledge-layer`
- Pass: `npm run audit:enterprise-knowledge-cache`
- Pass: `npm run audit:enterprise-knowledge-assembler`
- Pass: `npm run audit:enterprise-naming`
- Pass: `node --check scripts/audit/meridian-data-state-reconciliation.mjs`
- Pass: `git diff --check`
- Not run: `audit:meridian-agent-assist-data-demo`, `audit:meridian-agent-assist-moves-e2e`, and `audit:enterprise-demo-data-standard` are unavailable in `package.json`.
- Pass: `npm run release:check`

## Rollout Plan

Merge the PR. No ACA deploy is required because this is a report/audit command and generated proof artifact only.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR to remove the audit script, package command, release record, and generated report outputs.

## Audit Evidence

- PR URL: pending.
- Generated HTML proof: `reports/demo-readiness/meridian-data-state/meridian-data-state-reconciliation-proof.html`
- Generated summary: `reports/demo-readiness/meridian-data-state/summary.md`
- Generated CSV/JSON reports in `reports/demo-readiness/meridian-data-state/`

## Known Gaps

- The audit is repository/file-backed. It does not perform production database reads or browser proof.
- Generated Meridian v3 source adapter and relationship-graph artifacts remain synthetic/candidate proof unless explicitly promoted through the governed data-layer path.
