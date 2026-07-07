# 2026-06-20-home-v2-all-client-context-explorer — Home v2 All-Client Context Explorer

## Release ID

`2026-06-20-home-v2-all-client-context-explorer`

## Status

`candidate`

## Plain-English Summary

This release makes the new Home v2 Context Explorer the authenticated `/home` surface for every configured client. The design is based on the provided standalone Home v2 artifact, but the live route binds the view to the signed-in tenant's dataset pack instead of static First Capital content. It also restores the canonical product navigation toolbar around the v2 Tower iframe.

## Layer Impact

- `global-control-lane`: `/home` and `/tower` shared route chrome changes apply to all authenticated clients.
- `client-data-lane`: no data migration; Home v2 reads existing synthetic client packs from `datasets/`.

## Client Applicability

- All clients: Apex Retail Group, First Capital Financial, Lakeshore Holdings, Meridian Health System, Northstar Clinical Technologies, SkyHarbor Air.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no.

## Changes Included

- `/home` now mounts the Home v2 Context Explorer frame inside `AppShell`.
- `/api/home/v2-frame` and `/api/home/v2-data` build tenant-specific Home v2 data from the active client only.
- `src/lib/home-v2/data.ts` defines the strict all-client pack map and stable 19-dimension schema.
- The provided standalone Home v2 frame is installed under `public/home-v2/` with server-injected data.
- `/tower` now mounts inside `AppShell`, and the embedded Tower frame hides its standalone topbar to avoid double navigation.

## QA / Validation

- Pass: focused ESLint on Home v2, Tower route, and tests.
- Pass: focused Jest integration tests for Home v2 and Tower invariants.
- Pass: `npm run audit:control-plane-purity:check`.
- Pass: `NODE_OPTIONS='--max-old-space-size=6144' npm run build`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Attempted: local browser smoke for `/home` and `/tower` against `localhost:3001`; the in-app browser redirected both routes to Clerk sign-in, so signed-in visual proof remains a post-deploy/manual-auth gate.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the image. No data migration, DNS change, feature flag, or environment-variable rollout is required.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: repo-owned deploy workflow only.
- Approved image digest: captured after deploy.
- ACA runtime invariant: template image, 100% traffic revision image, and active revision image must agree after deploy.
- Worker image invariant: not directly changed by this release, but main deploy should keep worker images aligned with the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, `/home` plus `/tower` signed-in proof for at least one tenant before claiming live.

## Rollback Plan

Revert this PR and deploy the previous approved main image. Since no data migration is included, rollback is route/code only.

## Audit Evidence

- PR URL and merge commit.
- Focused test output.
- Release gate output.
- Local browser redirect evidence for `/home` and `/tower` in the unauthenticated in-app browser.
- Post-deploy ACA digest/revision evidence.
- Signed-in browser proof for `/home` and `/tower`.

## Known Gaps

Northstar uses its existing v1 dataset pack because it does not yet have a v4 `derived-intelligence/enterprise-reads.json`. The Home v2 schema still binds Northstar explicitly and marks v1-derived confidence as partial where appropriate.
