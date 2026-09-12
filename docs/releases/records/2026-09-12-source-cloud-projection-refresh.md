# 2026-09-12-source-cloud-projection-refresh - Source Cloud Projection Refresh

## Release ID

`2026-09-12-source-cloud-projection-refresh`

## Status

`candidate`

## Plain-English Summary

This release adds explicit ACA operator entrypoints for refreshing the Source contract and cloud-consumption projection views after a database already records their migrations as applied. It repairs stale view definitions without changing the raw source package or bypassing Layer 3 readback.

## Layer Impact

`client-data-lane`: controlled database projection refresh entrypoints for Source cloud-consumption data.

## Client Applicability

- All clients: Yes, for tenants using the Source cloud-consumption projection path.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds an operator entrypoint for the Source contract/vendor/spend projection refresh.
- Adds an operator entrypoint for the cloud-consumption Layer 4 cube refresh.
- Keeps the existing readiness projection reapply entrypoint separate so each migration is auditable.

## QA / Validation

- PASS: package scripts resolve to the intended migration files.
- Required: run each refresh through `npm run ops:aca-job` with a digest-pinned image.
- Required: verify Layer 3 and Layer 4 counts after refresh.
- Required: signed-in Source Contract 360 proof for the affected cloud contracts.

## Rollout Plan

Merge through protected `main`, deploy through the repo-owned ACA workflow, prove the runtime invariant, run the projection refresh jobs, then rerun the cloud package Layer 4 job with the explicit Layer 3 run binding.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: ACA schema/data jobs only through `npm run ops:aca-job`.
- Approved image digest: To be captured after the main deploy workflow.
- ACA runtime invariant: Required before operator jobs.
- Live signed-in proof required: Source portfolio and cloud Contract 360 tabs.

## Rollback Plan

Stop the operator sequence and restore the prior approved web digest if the entrypoint fails validation. The view refresh is forward-only and idempotent; no raw source rows are deleted. Re-run the prior approved projection definition only after its schema compatibility is confirmed.

## Audit Evidence

- PR URL: pending.
- CI/check output: pending.
- ACA deploy digest and runtime invariant: pending.
- ACA projection refresh and package readback proof: pending.

## Known Gaps

This release does not manufacture archetype mappings, raw contract PDFs, invoice line detail, or SLA observations that are not present in a governed package. The separate register/depth identity gap remains visible for follow-up.
