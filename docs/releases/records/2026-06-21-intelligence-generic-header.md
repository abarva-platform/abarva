# 2026-06-21-intelligence-generic-header — Intelligence header drops client name; one-line suggested questions

## Release ID

`2026-06-21-intelligence-generic-header`

## Status

`candidate`

## Plain-English Summary

The signed-in Intelligence page header no longer shows the active client's name. It previously read "Ask anything about Apex Retail Group." (interpolating the tenant display name); it now reads "Ask anything about your enterprise." for every tenant, so the surface never renders a client/tenant name. Separately, the suggested-question chips are now constrained to a single row on desktop (they wrapped to two lines before), which lifts the Signals / Context / Corpus tabs and the executive-signals section higher on the page. This is purely presentational: no change to data, retrieval, grounding, citations, or answer behavior.

## Layer Impact

`global-control-lane` — a shared control-plane UI component (the Intelligence v2 "Lens" surface) rendered for all clients. Presentational only; no client-data-lane, schema, migration, retrieval, or answer-engine impact.

## Client Applicability

All clients. Every tenant that renders the Intelligence v2 surface receives the generic header and the single-line suggested questions. No feature flag — the behavior is unconditional.

- All clients: yes — all tenants on the Intelligence v2 surface
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`
  - Header `<h1>` renders the static string `your enterprise.` instead of `{tenantName || t.tenant.displayName}`.
  - `.chips` CSS changed to `flex-wrap:nowrap` + `overflow:hidden`, with a scoped `.chips .chip{max-width:230px}` and a `@media(max-width:760px)` rule that restores wrapping + wider chips on mobile.
  - `tenantName` prop kept in the component's type (callers still pass it) but no longer destructured/rendered; documented inline as deliberate and one-line reversible.
- This release record.

## QA / Validation

- Static render harness built from the component's exact CSS (copied verbatim) confirmed all four suggested questions fit one centered row and the metrics line + Signals/Context/Corpus tabs rise directly beneath. Result: passed.
- A second faithful full-page render (real CSS + real binding content) confirmed the generic header and the corrected tab styling. Result: passed.
- Header change is a static string swap; no client/tenant name is rendered in any code path on this surface.
- `tenantName` retained in the prop type so the route caller `src/app/(maestro)/intelligence/page.tsx` still type-checks — no caller breakage.
- The full signed-in Next.js app was not driven (Clerk-auth + private data plane, not reachable headless): live signed-in QA is pending post-deploy. Status: passed (render harness) / not run (live signed-in).

## Rollout Plan

Merge to `main` → Azure Container Apps web image build + deploy (`aca-main-deploy` auto-deploys on push to `main`). No database migration, no worker/job change, no feature flag, no environment variable change.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` (auto on push to `main`)
- Shared runtime mutators: none
- Approved image digest: produced by CI on merge to `main`
- ACA runtime invariant: web revision only; no worker/job image or queue change
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: yes — capture `/intelligence` after deploy to confirm the generic header and one-line chips for a real tenant

## Rollback Plan

Revert this PR's single commit and redeploy. The change is purely presentational, so rollback is immediate and risk-free (no migration, no data state). To restore per-tenant personalization instead of reverting, re-bind `tenantName` in the header `<h1>` (a one-line change documented in the component).

## Audit Evidence

- PR URL (added when the PR is opened) and its `release:check` + typecheck CI runs.
- Render-harness screenshots captured in the build session (one-line chips; generic header; corrected tabs).
- Post-deploy live `/intelligence` capture confirming the generic header and single-line questions for a signed-in tenant.

## Known Gaps

Live signed-in verification on ACA is pending until after deploy. The change intentionally removes per-tenant personalization from this header; if a client-safe personalized variant is wanted later, re-bind `tenantName` as noted in the component.
