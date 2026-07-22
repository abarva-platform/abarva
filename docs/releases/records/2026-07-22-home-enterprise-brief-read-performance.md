# 2026-07-22-home-enterprise-brief-read-performance — Home typed read-model performance and proof polish

## Release ID

`2026-07-22-home-enterprise-brief-read-performance`

## Status

`candidate`

## Plain-English Summary

Tightens the Home Enterprise Brief read path after the typed read-model shipped. Home already reads the approved Postgres pack and overlays the typed executive-read, AI-readiness, strategic-narrative, use-case, evidence, and dimension tables. This release keeps that single loader, but makes the overlay faster and removes two visible polish defects found in Meridian and FS Demo proof.

## Layer Impact

- `global-control-lane`: Home page server-render timeout and Home Enterprise Brief presentation polish.
- `client-data-lane`: additive Postgres indexes for the Home pack read model. No data mutation and no schema contract change.

## Client Applicability

- All clients: the read-model performance change applies to every Home Enterprise Brief pack.
- Specific clients: Meridian and FS Demo receive first signed-in proof, then the full tenant set.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/home/home-knowledge-design-contract.ts`: collapsed the typed overlay from multiple queued queries on one `pg.Client` into a single Postgres round-trip.
- `src/app/(maestro)/home/page.tsx`: reduced the Home pack fallback timeout from 2.5s to 1.8s after the overlay query was consolidated.
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`: fixed the tenant heading spacing and reduced the executive-read headline scale so the page reads more like a polished CXO cockpit.
- `supabase/migrations/20260722233000_home_knowledge_read_model_lookup_indexes.sql`: added pack-id-first lookup indexes for the Home typed child tables and an active-approved pack lookup index.

## QA / Validation

- `pass` — focused ESLint for Home loader, Home page, and Home Enterprise Brief surface.
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- `pass` — `npm run build` with existing Turbopack broad-file-pattern warnings only.
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD`.
- `not-run` — signed-in browser proof for Meridian and FS Demo first, then all available tenant storage states, pending merge/deploy.
- `not-run` — ACA runtime invariant, health, revision, digest, and 100% traffic evidence pending deploy.

## Rollout Plan

Merge through the protected PR path and deploy through the repo-owned Azure Container Apps main lane. Apply the additive migration as part of the normal migration path. Prove the signed-in Home page on `https://app.abarva.ai/home` for Meridian and FS Demo before expanding to the rest of the tenants.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy.
- Shared runtime mutators: none outside the normal deploy/migration path.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the prior image. The migration is additive indexes only and can remain in place safely; if required, drop the new indexes by name.

## Audit Evidence

- PR URL: pending.
- CI / local validation: pending.
- Runtime invariant proof: pending.
- Browser screenshots: pending.

## Known Gaps

- This does not implement the P3 orphaned v3 tables or regenerate missing source data. It keeps the current Postgres-first loader and improves the live read path for the tables already consumed by Home.
