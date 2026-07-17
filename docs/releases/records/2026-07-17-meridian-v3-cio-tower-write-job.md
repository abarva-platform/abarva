# 2026-07-17-meridian-v3-cio-tower-write-job — Meridian V3 CIO Tower Write Job Enablement

## Release ID

`2026-07-17-meridian-v3-cio-tower-write-job`

## Status

`candidate`

## Plain-English Summary

This release candidate adds the explicit ACA operator job script needed to write the refreshed Meridian V3 Tower projection into the governed `cio_tower` read model. The projection includes FY26 technology budget, run/change split, approved program portfolio, AI-tagged spend by vendor/tool/category, usage and benefit evidence, candidate AI opportunities, and watch/pressure signals.

## Layer Impact

- Data-plane projection: enables the existing Meridian V3 to `cio_tower` projection script to run in write mode through the approved ACA operator job path.
- Tower read model: prepares `cio_tower.source_registry`, `entities`, `facts`, `relationships`, `measures`, `question_contracts`, and `measure_results` to receive refreshed Meridian rows.
- Release control: adds proof-bundle emission so the operator wrapper can capture the generated projection artifacts from the ACA job logs.

## Client Applicability

- All clients: no default behavior change.
- Specific clients: Meridian / Healthcare Demo Tower data-build path only.
- Internal only: operator job script and proof artifacts.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `package.json`: adds `project:meridian-v3-cio-tower:write-job`.
- `scripts/tower/project-meridian-v3-to-cio-tower.mjs`: adds explicit write approval guard, proof-bundle emission, awaited write handling, and run/change classification from actual budget columns.
- `scripts/tower/project-meridian-v3-to-cio-tower.mjs`: aligns the Meridian enterprise envelope entity to the persisted `cio_tower.entities` schema by using the allowed `holding_company` entity type while preserving `entity_role=enterprise_envelope` in attributes.
- `scripts/tower/project-meridian-v3-to-cio-tower.mjs`: aligns program funding relationships to the persisted `cio_tower.relationships` schema by emitting `funds` from the enterprise envelope to each initiative instead of unsupported `funded_by`.

## QA / Validation

Before merge:

- Pass: `npm run project:meridian-v3-cio-tower`
- Pass: `npm run audit:meridian-v3-cio-tower-projection`
- Pass: `node scripts/tower/project-meridian-v3-to-cio-tower.mjs --dry-run --emit-proof-bundle --out-dir=/tmp/meridian-v3-cio-tower-proof-smoke`
- Pending: `npm run release:check`
- Pass: `git diff --check`
- Finding from first ACA write attempt: Azure/Postgres rejected `entity_type=enterprise` because `cio_tower.entities` allows `holding_company`, `portfolio_company`, `initiative`, `vendor`, `contract`, `system`, `application`, `platform`, `org_unit`, `business_function`, `capability`, `kpi`, `risk`, and `value_lever`. The projection now emits the enterprise envelope as `holding_company`.
- Finding from second ACA write attempt: Azure/Postgres rejected `relationship_type=funded_by` because `cio_tower.relationships` allows `owns`, `funds`, `supports`, `depends_on`, `supplies`, `renews`, `measures`, `blocks`, `impacts`, `rolls_up_to`, `allocates_to`, `uses`, and `governed_by`. The projection now emits `funds` relationships.

After deploy:

- Not run yet: `npm run ops:aca-job -- --image <digest-pinned-image> --script project:meridian-v3-cio-tower:write-job`.
- Not run yet: capture ACA job execution logs and proof bundle.
- Not run yet: read back `cio_tower` row counts and key values for Meridian.
- Not run yet: signed-in Tower proof for Healthcare Demo.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, then run the approved private ACA operator job using the deployed digest-pinned image. The data write is not automatic on web deploy.

## Deployment Authority

- Repo-owned deploy workflow: required for shipping the write-job script in the web/operator image.
- Shared runtime mutators: not used by this PR directly.
- Approved image digest: produced by the repo-owned ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after the ACA operator job writes and readback passes.

## Rollback Plan

If the code path is wrong before the job runs, revert this PR and redeploy. If the job has already written Meridian rows, rerun the prior known-good Meridian `cio_tower` load or restore from database backup/operator rollback evidence. The write script only targets tenant `meridian-health`.

## Audit Evidence

- PR for this release candidate.
- ACA main deploy run after merge.
- ACA operator job output folder and extracted proof bundle.
- `reports/meridian-v3-cio-tower-projection/` dry-run artifacts.
- Post-write readback report and signed-in Tower screenshots.

## Known Gaps

This PR enables the write job but does not run it, does not promote new Active Tenant Access, and does not by itself prove the live Tower page has refreshed Meridian data.
