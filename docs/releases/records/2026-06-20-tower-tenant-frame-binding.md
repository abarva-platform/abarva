# 2026-06-20-tower-tenant-frame-binding — Tower Tenant Frame Binding

## Release ID

`2026-06-20-tower-tenant-frame-binding`

## Status

`candidate`

## Plain-English Summary

The live post-deploy crawl showed a SkyHarbor signed-in persona seeing the Tower frame with First Capital content. This release threads the server-resolved tenant key from `/tower` into the Tower iframe/data routes and keeps those routes behind `getActiveClientRow(...)`, so locked sessions still resolve from server-trusted tenant identity. It also rewrites the standalone Tower HTML shell tenant label/title/footer plus font and logo asset URLs so they resolve from the active tenant/data pack instead of the First Capital reference shell.

## Layer Impact

- `global-control-lane`: Shared authenticated Tower routing and frame rendering changes for all clients.
- `client-data-lane`: No client data is changed. The change only selects the already configured per-client Tower data pack more explicitly.

## Client Applicability

- All clients: authenticated `/tower` users.
- Specific clients: SkyHarbor Air is the live failure case that triggered the patch.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/tower/page.tsx`: resolves the active client server-side and passes its key into the iframe URL.
- `src/app/api/tower/v2-frame/route.ts`: reads the explicit client hint, resolves through `getActiveClientRow(requestedClient)`, rewrites relative Tower asset URLs, and rewrites the standalone Tower shell title/topbar/footer to the generated tenant binding.
- `src/app/api/tower/v2-data/route.ts`: mirrors the frame route tenant hint through the same resolver.
- `src/__tests__/integration/tower/tower-invariants.test.ts`: updates Tower invariants for tenant-threading, static asset rewriting, and tenant shell rewriting.
- `src/__tests__/integration/tower/tower-authenticated-submenu-wiring.test.ts`: updates the route wiring guard.

## QA / Validation

- `npm test -- --runTestsByPath src/__tests__/integration/tower/tower-invariants.test.ts src/__tests__/integration/tower/tower-authenticated-submenu-wiring.test.ts` — passed, 2 suites / 14 tests.
- Live post-deploy crawl artifact that exposed the issue: GitHub Actions run `27859425933`, artifact `post-deploy-crawl`.
- Local inspection of `skyharbor-cto__tower-root.png` confirmed the pre-fix cross-tenant Tower frame displayed First Capital content for the SkyHarbor persona.
- Follow-up post-deploy crawl after merge commit `18184d5be8daaaf7a2ddfb058ffea9dd01bc562f`: GitHub Actions run `27860330831`, artifact `post-deploy-crawl`, comparison `P0=0`, `P1=8`, `P2=58`.
- Follow-up local inspection of `skyharbor-cto__tower-root.png` from run `27860330831` confirmed SkyHarbor data rows loaded, but the static topbar still displayed `First Capital Financial`; this release record now includes the static shell rewrite required before calling Tower live-proven.

## Rollout Plan

Merge to `main`; repo-owned ACA main deploy builds and rolls the new image. Do not flip feature flags and do not run data migration as part of this release.

## Deployment Authority

- Repo-owned deploy workflow: required, `ACA main deploy`.
- Shared runtime mutators: no manual runtime mutation required.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: must confirm template image, 100% traffic revision image, and worker job images after deploy.
- Worker image invariant: same image digest as the web revision.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, re-run signed-in crawl for Tower at least for SkyHarbor and one non-SkyHarbor persona before calling this live-proven.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy roll back to the prior app image. If live Tower proof still shows tenant mismatch after rollback, keep Tower behind the Responsible AI acknowledgment gate and route users to `/home` while investigating.

## Audit Evidence

- Pre-fix signed-in crawl artifact: GitHub Actions run `27859425933`, `post-deploy-crawl`.
- Pre-fix screenshot: `skyharbor-cto__tower-root.png` in the crawl artifact.
- Focused test command above.
- PR URL and merge/deploy evidence to be added when opened/merged.

## Known Gaps

- This does not change the agent-answer citation rubric failures from the same crawl.
- This does not provision missing Clerk personas reported by auth-bootstrap P1 findings.
- This is not live-proven until ACA runtime state and signed-in browser/crawl proof both pass after deploy.
