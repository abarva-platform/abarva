# 2026-05-27-skyharbor-demo-p0-surfaces — SkyHarbor Demo P0 Surface Fixes

## Release ID

`2026-05-27-skyharbor-demo-p0-surfaces`

## Status

`candidate`

## Plain-English Summary

This release fixes three demo-spine failures surfaced by the post-deploy crawl: Move origination draft persistence was returning 403s, Tower portfolio could fall into a Server Components error boundary, and Source value could surface a connection-closed error. The affected surfaces now degrade safely instead of breaking the demo path.

## Layer Impact

Affected lanes: product-runtime lane, demo-operations lane, data-method lane.

- Product runtime: `/api/programs/origination-draft` now treats draft persistence as best-effort when tenancy is unavailable, while preserving protected submit paths.
- Product runtime: `/tower/portfolio` and `/source/value` now render explicit degraded states when tenancy or value-data reads fail.
- Demo operations: SkyHarbor gets an executable demo capture script, Azure private load runbook, and sanitized solo sign-in walkthrough.
- Data-method artifacts: SkyHarbor verification reports and checksum manifest were refreshed after the new runbook artifact was added.

## Client Applicability

- All clients: The origination draft and degraded-render protections apply to shared routes.
- Specific clients: SkyHarbor demo operations artifacts are for the SkyHarbor synthetic airline tenant.
- Internal only: Demo runbooks and capture script are internal/operator artifacts.
- Public/demo only: SkyHarbor sign-in walkthrough is a demo artifact with credentials referenced only via the credential vault.
- Feature flag: None.

## Changes Included

- PR: #2379
- Commit: `430c24a08f02765b8cc0d4347a45ea6aefbe414d`
- Runtime routes/pages:
  - `src/app/api/programs/origination-draft/route.ts`
  - `src/app/(maestro)/tower/portfolio/page.tsx`
  - `src/app/(maestro)/source/value/page.tsx`
  - `src/components/source/SourceValueLedger.tsx`
- Tests:
  - `src/__tests__/integration/programs/programs-origination-routes-guards.test.ts`
  - `src/__tests__/integration/demo-p0-graceful-degradation.test.ts`
- Demo/load artifacts:
  - `scripts/demo/skyharbor-demo-capture.mjs`
  - `scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs`
  - `docs/skyharbor/AZURE_PRIVATE_LOAD_RUNBOOK.md`
  - `docs/build/delta-pilot/SKYHARBOR_CTO_SIGNIN_HOWTO.md`

## QA / Validation

- Focused Jest passed: `npx jest src/__tests__/integration/programs/programs-origination-routes-guards.test.ts src/__tests__/integration/demo-p0-graceful-degradation.test.ts --runInBand` produced 18/18 passing tests.
- Focused ESLint passed for the touched runtime files, tests, and scripts.
- SkyHarbor substrate verifier passed: `records=645 chunks=480 entities=645 edges=259 provenance=645`.
- Airline pattern overlay verifier passed: `packs=184 patterns=2760 chunks=2760`.
- Azure loader dry-run passed: `3240 chunks`, `92 apps`, `38 initiatives`, `52 vendor contracts`.
- Node syntax checks passed for the demo capture and Azure loader scripts.
- `git diff --check` passed.
- Repo-wide `npx tsc --noEmit --pretty false` remains blocked by pre-existing SupabaseFactory/PostgresCompatClient test typing failures in data-plane adapter tests; no touched file appears in the reported failures.

## Rollout Plan

Merge PR #2379 to `main`, allow the Vercel production deployment to build, then run the post-deploy crawl against the demo-spine routes. Run the SkyHarbor Azure private load from a VNet host with `ABARVA_AZURE_DATABASE_URL` set when production data-lane loading is authorized.

## Rollback Plan

Revert PR #2379. No database migration is included. If the SkyHarbor Azure load was applied manually after merge, rerun the loader with the previous known-good corpus or restore from the Azure PostgreSQL backup/snapshot according to the private data-lane runbook.

## Audit Evidence

- PR #2379
- GitHub Actions status for PR #2379
- Local focused Jest, focused ESLint, verifiers, loader dry-run, and syntax-check output captured in the PR body.
- Post-deploy crawl artifact after merge should show the origination-draft 403, Tower portfolio server-render error, and Source value connection-closed P0s cleared.

## Known Gaps

- The live Azure private load is not performed by this PR; it requires execution from an Azure-networked host with production database credentials.
- Repo-wide typecheck remains blocked by pre-existing data-plane adapter test typing debt unrelated to this patch.
