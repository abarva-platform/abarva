# 2026-07-15-knowledge-preview-route-allowlist — Hidden Knowledge Preview Route Allowlist

## Release ID

`2026-07-15-knowledge-preview-route-allowlist`

## Status

`candidate`

## Plain-English Summary

The hidden Knowledge Layer live-preview proof route was implemented, merged, and deployed, but the direct signed-in browser proof found that `/admin/knowledge-preview` was being collapsed back to the Admin overview by the shared admin route-consolidation proxy. This release adds that proof-only route to the explicit active admin subroute allowlist so authenticated operators can open it directly. The route remains hidden from navigation and still requires the explicit proof token to run the live preview.

## Layer Impact

- Global control lane: updates shared proxy route classification for one admin proof route.
- Admin/operator surface: allows `/admin/knowledge-preview` to render as a hidden operator proof page instead of redirecting to `/admin`.
- Data layer: no data-layer writes, candidate promotion, Active Tenant Access update, or module runtime consumption change.

## Client Applicability

- All clients: no default client-facing behavior change.
- Specific clients: none.
- Internal only: authenticated operator/admin proof route only.
- Public/demo only: no.
- Feature flag: proof still requires `?proof=knowledge-layer-live-preview`.

## Changes Included

- `src/proxy.ts`: adds `/admin/knowledge-preview` to `ACTIVE_ADMIN_SUBROUTES`.
- `src/__tests__/unit/proxy-active-admin-subroutes.test.ts`: adds regression coverage proving the hidden route is auth-required, not public, and does not collapse to `/admin`.

## QA / Validation

- Pass — `npx jest src/__tests__/unit/proxy-active-admin-subroutes.test.ts --runInBand`.
- Pass — `npm run audit:knowledge-layer-live-preview`.
- Pass — `npm run release:check`.
- Pass — `git diff --check`.
- Blocked — ad hoc isolated TypeScript compile over the Jest test and `src/proxy.ts` without project config; the command did not load tsconfig path aliases or Jest globals. The focused Jest regression is the validation source for the route behavior.
- Not run — post-deploy signed-in browser proof for `/admin/knowledge-preview` and `/admin/knowledge-preview?proof=knowledge-layer-live-preview`; required after merge and ACA deploy.

## Rollout Plan

Merge through PR, deploy through the repo-owned Azure Container Apps main workflow, verify ACA runtime invariant and health, then run direct signed-in browser proof for the hidden route.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the allowlist entry and test if the proof route must be hidden behind the Admin overview again. No database rollback is required.

## Audit Evidence

- Follow-up PR URL: pending.
- Deploy workflow: pending.
- Signed-in route proof: pending.

## Known Gaps

The previous deploy proved the route code existed but also exposed the proxy allowlist gap. This release is not live-proven until the follow-up deploy and direct route proof pass.
