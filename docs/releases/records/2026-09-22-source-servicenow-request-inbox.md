# 2026-09-22-source-servicenow-request-inbox — Governed request inbox

## Release ID

`2026-09-22-source-servicenow-request-inbox`

## Status

`candidate`

## Plain-English Summary

Adds the authority model and read path for sourcing requests that arrive before a Source event exists. The Source New landing page can show imported ServiceNow requests, their proposed category and archetype, missing facts, named human mapping decision, and eventual event link without treating an imported row as accepted work.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 2 source adapters: consumes the canonical ServiceNow request shape introduced by the preceding foundation release.
- Layer 3 canonical model: adds immutable request versions plus append-only mapping decisions and event links. Proposals, human decisions, and events remain distinct authorities.
- Layer 4 Source: mounts the tenant-scoped request queue on Source New while preserving governed event access if the new registry is unavailable.

## Client Applicability

- All clients: UI and read-path behavior becomes available after the migration is separately approved and applied.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Additive migration `20260922140000_source_intake_request_authority.sql`, including an immutable SHA-256 for every imported source version.
- Fail-closed tenant-scoped request queue repository.
- Source New request queue projection for ServiceNow lineage, mapping review, missing facts, requester-stated value, and event-link status.
- Focused repository, route, and rendered component tests.

## QA / Validation

- Repository tests were written red-first and failed until the read model existed.
- Focused tests prove that a proposal never becomes a human decision, relation absence is unavailable rather than empty, and existing event workspaces remain accessible when intake authority is unavailable.
- TypeScript, scoped ESLint, migration-seal check, release check, focused Jest, and diff check are required before merge.

## Rollout Plan

Squash-merge through the protected repository workflow and deploy through `.github/workflows/aca-main-deploy.yml`. The code fails closed until the additive migration is separately approved and applied through the governed database workflow. No synthetic rows are loaded by this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending merge/deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after migration apply and a governed synthetic import.

## Rollback Plan

Revert the squash commit to remove the UI and read path. The additive tables may remain unused. If the migration has been applied, do not drop populated authority tables as part of application rollback.

## Audit Evidence

- Pull request, hosted CI, migration review, release check, focused Jest output, repo-owned ACA runtime proof, and later signed-in request-queue proof.

## Known Gaps

- Migration apply is a separate operator gate and is not authorized by this release.
- No tenant data or synthetic rows are loaded.
- The create-event command and supplier-pool proposal remain later governed releases; this change only makes their prerequisites explicit.
