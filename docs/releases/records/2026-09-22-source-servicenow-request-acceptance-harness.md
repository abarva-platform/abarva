# 2026-09-22 Source ServiceNow Request Acceptance Harness

## Release ID

`2026-09-22-source-servicenow-request-acceptance-harness`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic, read-only acceptance harness for the synthetic ServiceNow sourcing-request fixture and the synthetic candidate-supplier registry fixture. The harness proves the ten request rows cover the ten registered Source sourcing archetypes, each request keeps complete intake depth, each mapped archetype has at least two eligible fictional supplier candidates, negative supplier controls fail closed, and requester-stated values remain unvalidated planning input rather than governed savings.

## Layer Impact

- Release lane: `public-demo`.
- Layer 1 tenant-context fixtures: reads the already committed synthetic ServiceNow request and candidate-supplier registry CSV fixtures. It adds no new client intake and does not claim real supplier, requester, ticket, contract, contact, invitation, award, or savings facts.
- Layer 2 validation discipline: composes the real ServiceNow adapter, candidate-supplier fixture validator, and read-only supplier suggestion projection into one harness. It does not edit loader, operator, workflow, migration, or data-plane writer files.
- Layer 4 Source: no runtime route, UI, event state, supplier communication, or Source event mutation changes.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: fixture acceptance evidence and engineering audit.
- Public/demo only: synthetic fixture validation only.
- Feature flag: none.

## Changes Included

- `src/__tests__/behaviors/source-servicenow-request-acceptance-harness.test.ts`
- `reports/source/servicenow-request-acceptance-matrix.json`
- `docs/releases/records/2026-09-22-source-servicenow-request-acceptance-harness.md`

## QA / Validation

- Pass: `npx jest src/__tests__/behaviors/source-servicenow-request-acceptance-harness.test.ts --runInBand`.
- Pass: mutation case removing one ServiceNow request row fails the missing-archetype denominator check.
- Pass: mutation case removing one eligible supplier candidate fails both the supplier fixture validator and the per-request candidate count.
- Pass: `npx eslint src/__tests__/behaviors/source-servicenow-request-acceptance-harness.test.ts`.
- Pass: `npx eslint src/` exits 0 with existing warnings only.
- Pass: `npm run typecheck`.
- Pass: `npm run release:check`.

## Rollout Plan

Squash-merge after checks pass. No Azure Container Apps deployment is required for product behavior because this is a repository-only acceptance harness and audit artifact. If the repo-owned main deploy workflow runs after merge, it must remain the only shared-runtime deploy path; no manual traffic, image, flag, or environment mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: not required for product behavior; if triggered by merge, `.github/workflows/aca-main-deploy.yml` is the only approved path.
- Shared runtime mutators: none.
- Approved image digest: not applicable before merge.
- ACA runtime invariant: not required for a validation-only test/report change.
- Worker image invariant: not required for a validation-only test/report change.
- Feature/env flag update path: none.
- Live signed-in proof required: no. The change has no user-facing route, component, data write, or supplier action.

## Rollback Plan

Revert the PR. This removes only the harness, generated matrix artifact, and release record. No database rollback, migration rollback, tenant-data repair, Source event repair, or supplier communication cleanup is required.

## Audit Evidence

- PR diff and CI checks.
- `reports/source/servicenow-request-acceptance-matrix.json`.
- Local Jest output for the harness and its two mutation cases.
- Release check output.

## Known Gaps

No live signed-in Source acceptance, supplier import, Azure/Postgres load, tenant write, supplier contact, invitation, NDA action, award action, or governed savings claim is included.
