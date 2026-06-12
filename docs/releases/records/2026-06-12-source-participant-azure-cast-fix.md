# 2026-06-12-source-participant-azure-cast-fix — Source participant Azure cast fix

## Release ID

`2026-06-12-source-participant-azure-cast-fix`

## Status

`candidate`

## Plain-English Summary

Source event creation on Azure could create the event row but then fail while assigning the creator as a participant. The Azure insert reused one SQL parameter for both the text event id column and the uuid event-row column, which made Postgres reject the statement with an inconsistent parameter-type error. This release casts the shared event id explicitly so creator assignment succeeds after event creation.

## Layer Impact

- `global-control-lane`: fixes the shared Source Azure/Postgres write adapter used by Source event creation for all clients.

## Client Applicability

- All clients: Source clients using the Azure/Postgres runtime.
- Specific clients: SkyHarbor was the live crawl that exposed the issue.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/data-plane/write-adapters/sourceWriteAdapter.ts`
- `src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts`
- `tests/e2e/source/skyharbor-it-outsourcing-self-healing-crawl.spec.ts`

## QA / Validation

- `npx jest src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts --runInBand` passed.
- `npx eslint src/lib/data-plane/write-adapters/sourceWriteAdapter.ts src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts tests/e2e/source/skyharbor-it-outsourcing-self-healing-crawl.spec.ts` passed.
- Live Source self-healing crawl rerun is required after merge and Azure redeploy.

## Rollout Plan

Merge to main, build/push a new Azure Container Apps image, deploy it to `ca-abarva-web-lab-eastus`, and rerun the SkyHarbor Source E2E crawl against `https://app.abarva.ai`.

## Rollback Plan

Revert the PR and redeploy the prior Azure Container Apps image/revision. No schema or data migration is included.

## Audit Evidence

- PR and CI checks.
- Azure Container Apps revision after redeploy.
- Playwright Source E2E crawl report after rerun.

## Known Gaps

The live crawl must be rerun after this runtime fix is deployed.
