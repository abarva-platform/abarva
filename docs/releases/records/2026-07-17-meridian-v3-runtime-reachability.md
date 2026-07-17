# 2026-07-17-meridian-v3-runtime-reachability — Meridian Home V3 Content Path Convergence

## Release ID

`2026-07-17-meridian-v3-runtime-reachability`

## Status

`candidate`

## Plain-English Summary

This release closes a Meridian reachability gap: the new Meridian V3 approved Home content now has a canonical runtime read path before stale legacy Home story-blocks or legacy V7/V6 fallbacks. It also corrects Home preview columns for the new Meridian budget, program, and AI use-case schemas, and documents that Tower remains Postgres/runtime-data backed until a governed data-plane load and promotion sequence occurs.

## Layer Impact

- `global-control-lane`: updates Home local runtime source selection so canonical V3 approved content wins when present and valid.
- `client-data-lane`: applies Meridian-specific approved-content path convergence and proof reports for the Meridian V3 artifact stack.
- Runtime layer: Home local/file fallback path changes only; no Azure/Postgres load, candidate promotion, Active Tenant Access update, Tower runtime change, or deploy is included.

## Client Applicability

- All clients: Home runtime logic supports canonical V3 approved content where configured.
- Specific clients: Meridian Health receives the canonical approved-content configuration in this PR.
- Internal only: Review/proof reports.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/home/local-cxo-runtime.ts` now reads canonical V3 approved Home content from `datasets/tenant-inputs/<tenant_key>/approved-content/home/` before legacy `datasets/context-artifacts/approved/<tenant_key>/home-knowledge/`.
- `src/app/(maestro)/home/page.tsx` prefers canonical local V3 Home context before V7/V6 fallback when canonical approved content exists.
- Home preview columns for Meridian 08/09/10 prioritize governed budget/program/use-case fields and avoid phantom/stale fields.
- `scripts/tenant-v3/audit-home-v3-runtime-reachability.ts` proves source priority, preview columns, path convergence, stale-content absence, and Tower runtime boundary.
- Reports written under `reports/meridian-v3-runtime-reachability/`.

## QA / Validation

- Pass: `npm run audit:home-v3-runtime-reachability`
- Pass: `npm run audit:home-v3-preview-columns`
- Pass: `npm run audit:approved-content-path-convergence`
- Pending in final PR validation: broader Meridian derived/source/release checks.

## Rollout Plan

No deployment in this PR. After merge through the stacked PR sequence, Home local fallback can reach Meridian canonical V3 approved content in repository/runtime builds. Tower remains unchanged and requires a separate governed candidate data-plane load, candidate preview, promotion, and signed-in proof sequence.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable for this PR.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this artifact/path convergence PR; required later if deployed to shared runtime.

## Rollback Plan

Revert the PR. Home will return to the previous V7-first/local-legacy behavior. No database, Azure data-plane, Active Tenant Access, or Tower rollback is required.

## Audit Evidence

- `reports/meridian-v3-runtime-reachability/summary.md`
- `reports/meridian-v3-runtime-reachability/home-runtime-source-priority.md`
- `reports/meridian-v3-runtime-reachability/home-approved-content-audit.csv`
- `reports/meridian-v3-runtime-reachability/home-preview-column-audit.csv`
- `reports/meridian-v3-runtime-reachability/tower-runtime-readiness.md`
- `reports/meridian-v3-runtime-reachability/approved-content-paths.csv`
- `reports/meridian-v3-runtime-reachability/stale-content-findings.csv`
- `reports/meridian-v3-runtime-reachability/proof.html`

## Known Gaps

- Tower does not read the repo artifact files at runtime.
- Meridian artifacts are not loaded into Azure/Postgres.
- Meridian artifacts are not indexed or retrievable by live aVa/Intelligence.
- Active Tenant Access is unchanged.
- No candidate preview or active promotion occurs in this PR.
