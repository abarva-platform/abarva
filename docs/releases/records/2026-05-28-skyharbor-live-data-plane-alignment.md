# 2026-05-28-skyharbor-live-data-plane-alignment — SkyHarbor Tenant Binding and Loader Schema

## Release ID

`2026-05-28-skyharbor-live-data-plane-alignment`

## Status

`candidate`

## Plain-English Summary

This release aligns the repository with the SkyHarbor production state already deployed for the airline demo path. It prevents SkyHarbor from falling back to Apex copy on the home page, hardens the substrate loader so the Azure and live retrieval stores can accept the airline data shape, and updates the audit target to reflect the loaded 3,240-context-chunk corpus.

## Layer Impact

- app-control-lane: adds the SkyHarbor home fixture and tenant aliases so authenticated SkyHarbor users see the correct tenant briefing instead of an Apex fallback.
- client-data-lane: extends loader preflight/schema handling for client profile fields, enterprise context chunks, initiative metadata, and JSONB embedding storage used by the SkyHarbor data load.
- corpus-knowledge-lane: updates the SkyHarbor expected chunk count from 480 tenant facts to 3,240 total chunks after adding the 2,760 airline pattern overlay.
- demo-public-lane: protects the Delta/SkyHarbor demo path by ensuring future deploys from main do not regress the production tenant binding and loader compatibility.

## Client Applicability

- All clients: loader schema preflight is generic and backwards-compatible.
- Specific clients: SkyHarbor Air receives the visible home binding and audit target change.
- Internal only: not applicable.
- Public/demo only: SkyHarbor airline demo surfaces and production smoke evidence.
- Feature flag: not applicable.

## Changes Included

- Commit `f217da474b5566cc423746d7bd85a27345d4a410`.
- `src/components/home/tenant-home-fixtures.ts` adds SkyHarbor fixture aliases and live briefing facts.
- `src/__tests__/integration/skyharbor-home-tenant-resolution.test.ts` adds regression coverage for SkyHarbor tenant resolution.
- `scripts/seed/load-tenant-substrate.ts` adds schema preflight and JSONB embedding persistence support.
- `scripts/audit/db-substrate-audit.mjs` updates the SkyHarbor expected enterprise context chunk count to 3,240.

## QA / Validation

Passed locally:

```text
TENANT_KEY=skyharbor npx tsx scripts/seed/load-tenant-substrate.ts --dry-run --concurrency=8
npx jest src/__tests__/integration/skyharbor-home-tenant-resolution.test.ts src/__tests__/integration/first-capital-tenant-resolution.test.ts src/__tests__/integration/apex-home-truth-spine.test.ts --runInBand
npx eslint src/components/home/tenant-home-fixtures.ts src/__tests__/integration/skyharbor-home-tenant-resolution.test.ts scripts/seed/load-tenant-substrate.ts scripts/audit/db-substrate-audit.mjs
npx tsc --noEmit --pretty false
```

Production smoke passed after Vercel deployment `dpl_JAfiNvwNjRML5Z66CNNvttVd4ugS`: SkyHarbor `/home` rendered `SkyHarbor Air`, `$52.1B global network carrier`, and `3.2K reasoning chunks`; the Sentinel top-applications ask returned SkyHarbor airline and IBM estate application names with no Epic or Meditech hallucination, no egress denial, and no Apex or Meridian leakage.

Azure private data-plane load passed: 3,240 total chunks, 2,760 airline overlay chunks, 480 tenant fact chunks, 92 applications, 38 initiatives, 52 vendor contracts, and 3,240 of 3,240 Azure embeddings completed.

## Rollout Plan

Merge this PR to main so the repository matches the already-live Vercel production deployment. No additional database migration is required; the loader performs idempotent schema preflight before loading tenant substrate data.

## Rollback Plan

Revert commit `f217da474b5566cc423746d7bd85a27345d4a410` and redeploy from main if the SkyHarbor fixture or loader preflight causes an unexpected regression. The Azure data load is additive for the SkyHarbor tenant and should not be deleted during code rollback unless a separate data-plane rollback is explicitly requested.

## Audit Evidence

- PR: `https://github.com/anandsundaram-hash/abarva/pull/2382`
- Production deployment: `dpl_JAfiNvwNjRML5Z66CNNvttVd4ugS`
- Production aliases: `app.abarva.ai`, `nexus-vert-kappa.vercel.app`
- Azure load verification counts: chunks 3,240; overlay chunks 2,760; applications 92; initiatives 38; vendor contracts 52; Azure embeddings 3,240 of 3,240.
- Production smoke: SkyHarbor home and top-applications Sentinel ask verified against the live deployment.

## Known Gaps

The live retrieval mirror has the SkyHarbor rows and structured facts loaded, but its embedding pass was stopped after 84 of 3,240 chunks because the pooler was too slow. The Azure private lane has the full embedded corpus, and production retrieval smoke is working from loaded text plus structured facts. Clerk prefetch CORS noise was observed for `/architecture` and `/learn`; it did not block the SkyHarbor home or Intelligence smoke path.
