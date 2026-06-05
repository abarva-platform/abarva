# 2026-06-05-lakeshore-private-plane-health-audit — Lakeshore Private-Plane Health Proof

## Release ID

`2026-06-05-lakeshore-private-plane-health-audit`

## Status

`candidate`

## Plain-English Summary

Adds a repeatable Lakeshore Azure private-data-plane health audit. The script inspects the live Azure subscription and writes a JSON plus HTML evidence packet that separates deployed substrate health from remaining pilot cutover watch items.

## Layer Impact

- `client-data-lane`: Adds Lakeshore-specific private-data-plane evidence collection for Azure storage, Postgres, Search, Service Bus, Key Vault, networking, identity, and observability.
- `internal-admin`: Adds an operator/auditor script and generated evidence artifact for internal readiness tracking.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: Lakeshore Holdings only.
- Internal only: The audit script and evidence packet are for AbarVa operators and auditors.
- Public/demo only: No public route change.
- Feature flag: None.

## Changes Included

- `scripts/lakeshore/private-plane-health-audit.mjs`
- Generated evidence under `audit-artifacts/lakeshore-private-plane-health/`

## QA / Validation

- PASS: `node scripts/lakeshore/private-plane-health-audit.mjs` against the live Azure subscription returned 17 pass, 4 watch, 0 fail.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. This is a script/evidence-only release and does not require a Vercel production deploy or Azure redeploy.

## Rollback Plan

Revert the PR if the audit script or evidence format is not useful. There is no runtime or infrastructure state to roll back.

## Audit Evidence

- `audit-artifacts/lakeshore-private-plane-health/*/summary.json`
- `audit-artifacts/lakeshore-private-plane-health/*/report.html`
- PR checks and release-control output.

## Known Gaps

The audit does not perform private-network in-container connectivity probes or cut over the production app runtime to the private Azure substrate. Those remain explicit pilot cutover tasks.
