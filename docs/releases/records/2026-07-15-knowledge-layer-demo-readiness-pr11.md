# 2026-07-15-knowledge-layer-demo-readiness-pr11 — Nexus Knowledge Demo Readiness

## Release ID

`2026-07-15-knowledge-layer-demo-readiness-pr11`

## Status

`candidate`

## Plain-English Summary

This release turns the hidden Nexus Knowledge preview route into a polished internal demo path. The enabled route now leads with the product story: Nexus understands governed enterprise context before aVa answers, and that same context can support Home, Moves, and Intelligence. Proof and guardrail details remain available, but they are collapsed so the visible surface is meeting-ready.

## Layer Impact

- `internal-admin`: updates the hidden `/admin/knowledge-preview` enabled view only.
- `global-control-lane`: refreshes the shared Knowledge Layer proof artifacts and deterministic screenshot so the release record matches the demo-readiness purpose.
- Runtime behavior: no default module behavior changes, no tenant data writes, no candidate promotion, and no Active Tenant Access update.

## Client Applicability

- All clients: no default product behavior change.
- Specific clients: none.
- Internal only: applies to AbarVa operators using the hidden preview route with the explicit proof token.
- Public/demo only: internal demo path only; not exposed in client navigation.
- Feature flag: the route remains hidden and requires `?proof=knowledge-layer-live-preview`.

## Changes Included

- `/admin/knowledge-preview` enabled page copy and layout now use Nexus demo-ready messaging.
- Meridian Agent Assist and Finance Analytics examples are promoted as the visible scenario cards.
- Non-Meridian scenario cards and guardrails remain available in collapsed proof details.
- Knowledge layer proof codename updates to `KNOWLEDGE-LAYER-DEMO-READINESS-PR11`.
- Audit output now writes a deterministic demo-readiness screenshot in addition to the route-proof SVG.

## QA / Validation

- `npm run audit:knowledge-layer-live-preview` — Pass.
- Isolated TypeScript compile for the preview page, live-preview builder, and audit script — Pass.
- `npx jest src/__tests__/unit/proxy-active-admin-subroutes.test.ts --runInBand` — Pass.
- `npm run release:check` — Pass.
- `git diff --check` — Pass.
- Signed-in browser proof after deploy — Not run yet.

## Rollout Plan

Merge through the protected PR path. The repo-owned ACA main deploy workflow builds and deploys the merged SHA. After deployment, run the runtime invariant, production health check, and signed-in browser proof for the hidden preview route in both disabled and enabled states.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: pending ACA main deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: unchanged.
- Feature/env flag update path: none; explicit query-token route remains the only enablement path.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR or redeploy the prior healthy ACA image. Because this change does not write tenant data, promote candidates, change module defaults, or expose navigation, rollback is limited to the hidden preview UI and proof artifacts.

## Audit Evidence

- PR URL: pending.
- Audit bundle: `reports/enterprise-knowledge-layer/live-preview-proof/`.
- Deterministic screenshot: `reports/enterprise-knowledge-layer/live-preview-proof/screenshots/deterministic-demo-readiness.svg`.
- Post-deploy evidence: pending ACA deploy, runtime invariant, health check, and signed-in browser proof.

## Known Gaps

- This does not expose the preview in client navigation.
- This does not make Home, Moves, or Intelligence consume the Knowledge Layer by default.
- This does not call Claude by default.
- This does not promote a candidate or write production tenant data.
