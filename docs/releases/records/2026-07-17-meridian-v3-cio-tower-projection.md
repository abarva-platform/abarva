# 2026-07-17-meridian-v3-cio-tower-projection — Meridian V3 CIO Tower Projection Contract

## Release ID

`2026-07-17-meridian-v3-cio-tower-projection`

## Status

`candidate`

## Plain-English Summary

Adds a repeatable Meridian V3 to `cio_tower` projection dry-run and audit. The projection translates the refreshed Meridian source packet into the row families Tower needs for a CXO-grade dashboard: FY26 budget, run/change split, funded program portfolio, AI spend by platform/vendor/category, AI usage/adoption/value evidence, candidate AI opportunities, and watch/pressure signals.

This does not claim that Azure/Postgres has been written yet. It creates the governed projection and proof needed before the ACA data-build job refreshes Tower runtime rows.

## Layer Impact

- `client-data-lane`: Adds a Meridian-specific projection contract from refreshed V3 template files into the existing `cio_tower` read-model shape. No tenant data write is performed by this PR.
- `enterprise knowledge layer`: Reconciles Tower-facing facts back to the updated V3 source files, including 08, 09, 10, SA02, SA04, SA08, 14, and 18.
- `Tower runtime/read model`: Prepares `cio_tower` source/entity/fact/measure/measure-result rows for an ACA data-build job. Runtime remains unchanged until that job writes the rows and live proof passes.

## Client Applicability

- All clients: No.
- Specific clients: Meridian / Healthcare Demo only.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No runtime flag changed.

## Changes Included

- `scripts/tower/project-meridian-v3-to-cio-tower.mjs`
- `scripts/tower/audit-meridian-v3-cio-tower-projection.mjs`
- `package.json` scripts:
  - `project:meridian-v3-cio-tower`
  - `audit:meridian-v3-cio-tower-projection`

## QA / Validation

Passed locally:

```bash
npm run project:meridian-v3-cio-tower
npm run audit:meridian-v3-cio-tower-projection
```

The audit verifies:

- FY26 total technology budget is `$650.0M`.
- Run budget is `$487.5M`.
- Change budget is `$162.5M`.
- Approved program budget is `$291.9M`.
- AI-tagged spend lens is `$53.7M` and non-additive.
- Promised AI value is `$35.5M`.
- Partial finance-validated value is `$3.8M`.
- Realized/proven value remains `$0`.
- Copilot usage/adoption/value evidence is present with caveats.
- ServiceNow, Workday, GitHub Copilot, data platform, AI governance, and candidate AI Assist evidence paths are present.
- Stale `$1.1B`, `$713.0M`, and `$356.5M` Tower values are blocked from the generated projection.

## Rollout Plan

Merge to `main`, then run the governed ACA data-build job using this projection with `--write` so Azure/Postgres `cio_tower` rows are refreshed for Meridian. After the job writes rows, run signed-in Tower proof to confirm the dashboard and Tower aVa read the refreshed values and decision lenses.

## Deployment Authority

- Repo-owned deploy workflow: Required for web code rollout if this PR is merged.
- Shared runtime mutators: None in this PR.
- Approved image digest: Not applicable until deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required before ACA data-build job write.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after ACA job writes data and main deploy is live.

## Rollback Plan

Revert this PR to remove the projection/audit scripts and npm entries. If a later ACA data-build job has written Meridian `cio_tower` rows, rerun the prior approved Tower load or restore the previous `cio_tower` snapshot for Meridian.

## Audit Evidence

- `reports/meridian-v3-cio-tower-projection/projection.json`
- `reports/meridian-v3-cio-tower-projection/summary.md`
- `reports/meridian-v3-cio-tower-projection/proof.html`
- `reports/meridian-v3-cio-tower-projection/source-to-fact-lineage.csv`
- `reports/meridian-v3-cio-tower-projection/program-portfolio-lens.csv`
- `reports/meridian-v3-cio-tower-projection/usage-benefit-lens.csv`

## Known Gaps

- Azure/Postgres has not been written by this PR.
- Active Tenant Access has not been updated by this PR.
- The live Tower page will not reflect this projection until the governed ACA data-build job runs and signed-in browser proof passes.
