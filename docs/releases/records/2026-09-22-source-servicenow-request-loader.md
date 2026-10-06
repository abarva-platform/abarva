# 2026-09-22-source-servicenow-request-loader - Controlled request import plan

## Release ID

`2026-09-22-source-servicenow-request-loader`

## Status

`candidate`

## Plain-English Summary

Adds an offline-first operator script that validates a native-shaped ServiceNow sourcing-request extract, proves category and archetype coverage, and produces a deterministic import plan before any database connection is allowed. Apply mode is separately gated and limited to immutable pre-event request versions.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1 client intake: validates the governed ServiceNow-shaped request file without changing it.
- Layer 2 source adapter: exercises the existing ServiceNow adapter for every row.
- Layer 3 canonical model: can append immutable request versions only after a separate operator approval and schema apply. It cannot accept mappings, create events, contact suppliers, or write procurement decisions.

## Client Applicability

- All clients: reusable operator control after tenant-specific approval.
- Specific clients: None.
- Internal only: The loader command and proof bundle are operator-facing.
- Public/demo only: The included fixture is synthetic and repository-safe.
- Feature flag: None.

## Changes Included

- `scripts/source/load-servicenow-sourcing-requests.ts`
- Plan-only npm command `source:servicenow-requests:plan`
- Behavioral tests for complete archetype coverage, offline dry-run, and apply gating.

## QA / Validation

- PASS - The ten-row synthetic extract covers every registered Source archetype across Plan, Delivery, Enterprise, and IT.
- PASS - Dry-run executed with database environment variables absent and wrote a local JSON plan with zero missing archetypes.
- PASS - Apply mode stops before database access unless both the approval environment variable and exact confirmation phrase are present.
- PASS - Focused Jest, TypeScript, scoped ESLint, and completeness-guard mutation proof.
- PENDING - Hosted CI and final release check complete on the pull request before merge.
- NOT RUN - Migration apply, tenant data import, and signed-in request-queue acceptance are separate governed gates.

## Rollout Plan

Squash-merge through the protected repository workflow and deploy application code through `.github/workflows/aca-main-deploy.yml`. Deployment does not run the loader. Migration apply and any tenant-scoped import remain separate operator gates.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending merge/deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable; this release does not run a worker.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, only after a separately approved migration and synthetic import.

## Rollback Plan

Revert the squash commit. The script has no scheduled execution and dry-run creates only local proof files.

## Audit Evidence

- Pull request, hosted CI, focused loader tests, mutation proof, release check, plan JSON, and repo-owned ACA deployment evidence.

## Known Gaps

- This release does not apply the request-authority migration or write tenant data.
- A governed ACA data-build job is required before any shared-environment apply run.
- Mapping acceptance, event creation, supplier release, and external communications remain out of scope.
