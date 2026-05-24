# 2026-05-24-p21-provisioned-persona-matrix — Crawl Provisioned Persona Matrix

## Release ID

`2026-05-24-p21-provisioned-persona-matrix`

## Status

`candidate`

## Plain-English Summary

Aligns the default post-deploy crawl matrix to the five CXO demo personas currently provisioned in production. The crawl also now types credentials after Clerk is loaded, matching the existing E2E sign-in helper and avoiding hydration races. Follow-up hardening fixes the product regressions surfaced by the full crawl.

## Layer Impact

- `ops-release-lane`: unblocks the authenticated post-deploy crawl from failing on unprovisioned demo personas.
- `agent-quality-lane`: preserves five-persona coverage across Apex, Meridian, and First Capital for hard-question transcript capture.
- `app-control-lane`: adds a legacy Source redirect and defensive Tower Portfolio empty state.

## Client Applicability

- Specific clients: Apex Retail, Meridian Health, and First Capital.
- Internal only: yes.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Default crawl personas are now Apex CIO, Apex CDO, Meridian CDIO, Meridian CDAO, and First Capital CIO.
- The sign-in helper waits for Clerk to load and types credentials using keyboard events before submit.
- Home workspace navigation now points to existing canonical routes for AI initiatives, users/access, production readiness, and activity so post-deploy prefetches do not emit 404s.
- Legacy `/home/source` now redirects to `/source` so stale prefetched links do not emit 404s.
- The baseline comparator now treats missing tenant identity as P1 on first crawl without a last-known-good baseline, while still treating wrong tenant names and network/server failures as P0.
- Programs/Moves tenant labels now canonicalize retired First Capital/Meridian demo names before rendering.
- Tower Portfolio now renders an honest empty state if portfolio value reads are unavailable instead of throwing a server-render error.

## QA / Validation

- PASS: local production credential probe showed these five personas can sign in with `Demo2026!` / `424242`.
- PASS: local production single-persona crawl reached `/home` and exposed only canonical-route 404s, which this patch fixes.
- PASS: production crawl rerun reached the full surface matrix and produced an artifact package; remaining findings were comparator/baseline severity plus real route/server findings.
- PASS: `npm run smoke:p21-post-deploy-crawl`
- PASS: `npx eslint src/lib/crawl/baseline-compare.ts src/lib/programs/transformers.ts src/app/\(maestro\)/tower/portfolio/page.tsx src/app/\(maestro\)/home/source/page.tsx src/lib/crawl/persona-switcher.ts scripts/crawl scripts/smoke/p21-post-deploy-crawl.spec.ts src/components/home/tenant-home-fixtures.ts`
- PASS: `npm run build`
- PASS: `npx tsc --noEmit --pretty false`

## Rollout Plan

Merge to main. The post-deploy crawl workflow will rerun against production using only provisioned personas.

## Rollback Plan

Revert if it causes crawl-only regressions. No database or product runtime rollback is required.

## Audit Evidence

- Production sign-in accepted Apex CIO, Apex CDO, Meridian CDIO, Meridian CDAO, and First Capital CIO.
- Production sign-in rejected Apex CFO, Meridian CFO/COO, and First Capital CFO/CRO with `invalid_credentials`; those can be re-added after Clerk provisioning is refreshed.

## Known Gaps

Apex CFO and other business-CXO crawl coverage should be re-added after production Clerk demo users are provisioned.
