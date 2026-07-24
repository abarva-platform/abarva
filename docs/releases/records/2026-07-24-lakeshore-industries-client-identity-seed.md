# 2026-07-24-lakeshore-industries-client-identity-seed — Lakeshore Industries Client Identity Seed

## Release ID

`2026-07-24-lakeshore-industries-client-identity-seed`

## Status

`candidate`

## Plain-English Summary

This release adds an operator-only seed path for the exact `lakeshore-industries` client identity. The Tower mart writer now has clean active-source data for Lakeshore Industries, but the governed write job refuses to persist rows unless the tenant resolves to a real `public.clients.id`. This patch provides the missing declared identity without reintroducing fuzzy Lakeshore aliasing.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 2 / Source adapters: no source adapter changes.
- Layer 3 / Canonical model: adds a controlled script that declares the `lakeshore-industries` client row in `public.clients`.
- Layer 4 / Products: no Tower UI behavior changes. This only unblocks the governed Tower mart write job for the exact tenant key.

## Client Applicability

- All clients: no.
- Specific clients: Lakeshore Industries / `lakeshore-industries` only.
- Internal only: the new script is operator-only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/tower/ensure-lakeshore-industries-client.mjs`
- `package.json`

## QA / Validation

- PASS: `npm run seed:tower-client:lakeshore-industries:plan`
- PASS: `node --check scripts/tower/ensure-lakeshore-industries-client.mjs`
- PASS: `npm run audit:enterprise-naming`
- PASS: `git diff --check`
- PASS: `npm run release:check`

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main workflow, then run the operator job:

```bash
npm run ops:aca-job -- --image <digest-pinned-main-image> --script seed:tower-client:lakeshore-industries:write-job --secret-env DATABASE_URL=azure-postgres-control-database-url
```

After the seed job succeeds, rerun:

```bash
npm run ops:aca-job -- --image <same-digest-pinned-main-image> --script project:tower-mart:lakeshore-industries:write-job --secret-env DATABASE_URL=azure-postgres-control-database-url
```

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the governed ACA operator job wrapper.
- Approved image digest: recorded after deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for Lakeshore Industries Tower after mart write if an authenticated tenant session exists.

## Rollback Plan

If the seed is wrong and no downstream data has been written, delete the `public.clients` row where `tenant_key = 'lakeshore-industries'`. If Tower mart rows have been written, first roll back/delete those tenant-scoped mart rows using the Tower mart run proof, then remove the client row. Do not repoint Lakeshore Industries to Lakeshore Holdings as a rollback.

## Audit Evidence

- PR URL
- ACA deploy run
- Operator seed proof bundle
- Lakeshore Industries Tower mart write proof bundle
- Signed-in browser proof when available

## Known Gaps

This release only declares the tenant identity required for the existing Tower mart write. It does not add users, grants, Clerk auth state, or tenant switcher visibility.
