# 2026-07-13-enterprise-profile-foundation — Enterprise Profile Foundation

## Release ID

`2026-07-13-enterprise-profile-foundation`

## Status

`candidate`

## Plain-English Summary

Enterprise Profile is now treated as a governed tenant data domain rather than a Home-page copy feature. This release adds a rich enterprise-profile input standard for active demo tenants, parses it into canonical profile records, rejects placeholder values, reports profile gaps, and produces a deterministic all-tenant proof bundle for downstream Home/aVa readiness.

This is a non-destructive data-layer foundation. It does not write production tenant data, update the Active Tenant Access Layer, promote any candidate, or change module runtime consumption.

## Layer Impact

- `client-data-lane`: adds the Enterprise Profile Foundation source shape with required identity, scale, location, leadership, mission/vision, business model, strategic-priority, source, and gap fields for active demo tenants.
- `client-data-lane`: adds `enterprise-profile-foundation/v1` mapping and placeholder rejection so `not_loaded`, `unknown`, `TBD`, `N/A`, `sample`, and similar values cannot pass as facts.
- `internal-admin`: adds `reports/enterprise-profile-foundation/latest/` with source inventory, parsed rows, canonical records, placeholder rejection report, profile gaps, source lineage, Home/aVa readiness, summary, and HTML audit report.
- `global-control-lane`: clarifies the Tenant Packet contract so enterprise profile completeness is a standard control before Home/aVa profile summaries are considered ready.
- Runtime modules: no runtime behavior change. Home/aVa consumption remains downstream and must not hand-author profile prose as source truth.

## Client Applicability

- All clients: establishes the required enterprise-profile standard for future tenant packets.
- Specific clients: active demo tenants `apex-retail`, `meridian-health`, `first-capital`, `skyharbor-air`, and `lakeshore-holdings` receive synthetic foundation source rows.
- Internal only: audit/report artifacts and data-layer foundation.
- Public/demo only: synthetic demo profile rows are planning-grade and must not be represented as real client filings.
- Feature flag: none.

Northstar is explicitly retired/excluded from active processing and appears as excluded in the audit evidence.

## Changes Included

- `datasets/enterprise-profile-foundation-v1/` with a reusable template and active-tenant synthetic source data.
- `docs/architecture/enterprise-profile-foundation.md`.
- `docs/architecture/tenant-packet-contract.md` clarification that enterprise profile must satisfy required field groups before Home/aVa profile summaries are ready.
- `src/lib/enterprise-data/source-adapters/mapping-profiles.ts` adds `enterprise-profile-foundation/v1`.
- `src/lib/enterprise-data/source-adapters/csv-source-adapter.ts` rejects placeholder values as missing and supports date/list/json transforms.
- `src/lib/enterprise-data/enterprise-profile/enterprise-profile-foundation.ts` builds canonical profile records and proof artifacts.
- `scripts/audit/build-enterprise-profile-foundation.ts`.
- `package.json` adds `npm run audit:enterprise-profile-foundation`.
- `src/lib/enterprise-data/enterprise-profile/__tests__/enterprise-profile-foundation.test.ts`.

## QA / Validation

- Pass: `npm run audit:enterprise-profile-foundation`
- Pass: `npx jest src/lib/enterprise-data/enterprise-profile/__tests__/enterprise-profile-foundation.test.ts --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`

Additional release checks must pass before merge:

- `npm run audit:tenant-packet-contract`
- `npm run audit:enterprise-naming`
- `npm run release:check`
- `git diff --check`

## Rollout Plan

Merge through the standard PR path. No database migration, production data write, active candidate promotion, or runtime module consumption change is included. ACA deployment can proceed through the repo-owned main deploy workflow, but this release is not live-proven until post-deploy health/runtime invariant and signed-in crawl evidence complete on a non-cancelled run.

## Deployment Authority

- Repo-owned deploy workflow: required for any production ACA update after merge.
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by ACA main deploy workflow after merge.
- ACA runtime invariant: required after merge/deploy before claiming live.
- Worker image invariant: unchanged; standard deploy invariant still applies.
- Feature/env flag update path: none.
- Live signed-in proof required: yes before claiming browser-visible/live-proven status.

## Rollback Plan

Revert this PR and redeploy through the same ACA main workflow if the audit or downstream build behavior regresses. No data rollback is required because this PR does not write production tenant data, promote candidates, or change active module runtime reads.

## Audit Evidence

- `reports/enterprise-profile-foundation/latest/summary.md`
- `reports/enterprise-profile-foundation/latest/tenant-profile-source-inventory.json`
- `reports/enterprise-profile-foundation/latest/parsed-enterprise-profile-records.json`
- `reports/enterprise-profile-foundation/latest/canonical-profile-records.json`
- `reports/enterprise-profile-foundation/latest/placeholder-rejection-report.json`
- `reports/enterprise-profile-foundation/latest/profile-gaps.json`
- `reports/enterprise-profile-foundation/latest/source-lineage.json`
- `reports/enterprise-profile-foundation/latest/home-ava-consumption-readiness.json`
- `reports/enterprise-profile-foundation/latest/all-tenant-profile-audit.html`

## Known Gaps

- The active demo rows are synthetic planning-grade facts, not real client filings.
- Home Summary Snapshot consumption from these canonical records is intentionally deferred to the next Home data PR.
- Existing older tenant packets may still contain thinner enterprise profile rows; this PR creates the standard and audit path rather than rewriting every historical packet in place.
