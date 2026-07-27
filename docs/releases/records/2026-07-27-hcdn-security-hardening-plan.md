# 2026-07-27-hcdn-security-hardening-plan — Tenant Data-Plane Security Plan

## Release ID

`2026-07-27-hcdn-security-hardening-plan`

## Status

`candidate`

## Plain-English Summary

Adds a repeatable, plan-only security hardening package for the next private data-plane tenant environments. The package defines separate operational and evaluator-only storage, tenant-scoped managed identities, RBAC intent, private DNS, diagnostics, budget guardrails, and zero-data preflight checks before any migration or source load may run.

## Layer Impact

- **Lane:** `client-data-lane` for future private data-plane planning artifacts; `internal-admin` for the repeatable generator and validation harness.
- **CLIENT INTAKE:** No client templates or source data are changed.
- **SOURCE ADAPTERS:** No adapters run. The future source-load jobs now have a plan-only identity and network contract.
- **CANONICAL MODEL:** No schema is applied. The plan preserves the future role/RLS boundary for candidate, accepted, published, and evaluator-only evidence.
- **PRODUCTS:** No Home, Source, Intelligence, Moves, Tower, or Learn runtime behavior changes.

## Client Applicability

- All clients: no runtime change.
- Specific clients: two future private data-plane manifests are prepared in plan-only form.
- Internal only: yes, this is an implementation-planning and validation package.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/knowledge/build-phase2b3c-security-plan.mjs`
- `scripts/knowledge/__tests__/run-phase2b3c-security-plan-tests.mjs`
- `package.json` scripts:
  - `generate:hcdn-security-plan`
  - `test:hcdn-security-plan`
- Plan-only tenant packages under `clients/*/18-phase2b3c-azure-lab-implementation/`
- Rollup evidence under `reports/phase2b3c-security-hardening/`

## QA / Validation

- Pass: `npm run generate:hcdn-security-plan`
- Pass: `npm run test:hcdn-security-plan`
- Pass: `npm run test:hcdn-job-runner`
- Pass: `az bicep build --file clients/airline-demo-new/18-phase2b3c-azure-lab-implementation/11-security-hardening-plan/phase2b3c2b-security-hardening.bicep --stdout`
- Pass: `az bicep build --file clients/hc-demo-new/18-phase2b3c-azure-lab-implementation/11-security-hardening-plan/phase2b3c2b-security-hardening.bicep --stdout`
- Not run: Azure what-if. This PR is plan-only and the what-if must be captured immediately before any future apply.
- Not run: live signed-in browser proof, because no product runtime behavior changed.
- Pending: `npm run release:check`

## Rollout Plan

Merge only. This does not apply Azure infrastructure, migrate a database, land sources, run parsing, publish projections, or wire a product read path. The next step is independent pre-apply review, read-only Azure name and network checks, Azure what-if capture, and machine parsing of that what-if before any resource creation is authorized.

## Deployment Authority

- Repo-owned deploy workflow: normal main merge workflow only if GitHub triggers it.
- Shared runtime mutators: none.
- Approved image digest: not changed by this release.
- ACA runtime invariant: not required for plan-only artifacts; if main deploy runs, verify normally.
- Worker image invariant: not required for plan-only artifacts; if main deploy runs, verify normally.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product behavior changes.

## Rollback Plan

Revert the PR. Because this is plan-only and does not mutate Azure or database state, rollback is repository-only.

## Audit Evidence

- Generator output in `reports/phase2b3c-security-hardening/`
- Tenant validation summaries under each package `validation/` folder.
- PR checks and release-check output.

## Known Gaps

- Azure apply remains blocked.
- Database migration remains blocked.
- Source landing, parsing, publication, and runtime integration remain blocked.
- Read-only Azure global name checks, network peering scan, and what-if parsing must be run immediately before any future apply.
