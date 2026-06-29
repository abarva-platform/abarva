# 2026-06-29-demo-safe-visible-tenant-names — Demo-Safe Visible Tenant Names

## Release ID

`2026-06-29-demo-safe-visible-tenant-names`

## Status

`candidate`

## Plain-English Summary

Signed-in demo visitors should see generic tenant labels instead of composite customer names. The visible labels are Retail Demo, Airline Demo, Healthcare Demo, Financial Services Demo, Industrial Demo, and Clinical Technology Demo. Legacy names remain recognized as internal aliases for routing and data lookup, but the product chrome and agent windows scrub those names before rendering.

## Layer Impact

- `global-control-lane`: Updates shared client display policy and shared product chrome/agent rendering boundaries.
- `public-demo`: Protects demo-safe customer naming across signed-in demo routes used during soft launch.

## Client Applicability

- All clients: yes, for display-name sanitization of known demo aliases.
- Specific clients: Apex/Retail, SkyHarbor/Airline, Meridian/Healthcare, First Capital/Arcturus/Financial Services, Lakeshore/Industrial, Northstar/Clinical Technology.
- Internal only: no.
- Public/demo only: primarily demo-safe visible labeling.
- Feature flag: none.

## Changes Included

- Central demo-safe labels and scrubber in `src/lib/client-config.ts`.
- Tenant alias display names updated in `src/lib/tenant/aliases.ts`.
- Product nav/topbar scrub in `src/components/shell/AppTopBar.tsx`.
- Shared aVa/agent scrub boundaries in `src/components/ava-chat/AvaChatShell.tsx` and `src/components/agent/AgentDock.tsx`.
- Home and Intelligence surface payload/answer scrubs in `src/components/home/HomeSurface.tsx` and `src/components/intelligence-v2/IntelligenceV2Surface.tsx`.
- Page-level tenant prop fixes for Strategic Moves and Source vendor fallback.
- Strategic Moves portfolio list/card/kanban/map labels now scrub tenant names embedded in move titles, display codes, status text, sponsor labels, and map labels.

## QA / Validation

- Passed: focused lint on the changed tenant display, shell, Home, Intelligence, Source, Moves, and AgentDock files.
- Passed: focused Jest for client display canonicalization, TenantIdentityStrip, and IntelligenceV2Surface demo-safe rendering.
- Passed: behavior gate regression for board-grade tenant labels, confirming Move model labels now resolve to demo-safe names.
- Passed: focused Strategic Moves label lint and shared scrubber regression for move titles and sponsor labels containing old tenant names.
- Passed: `npm run release:check`.
- Not run yet: signed-in browser scan across Home and Intelligence for Retail Demo, Airline Demo, Healthcare Demo, Financial Services Demo, and Industrial Demo.
- Not run yet: ACA deployment proof and traffic verification.

## Rollout Plan

Merge or deploy this branch through the approved Azure Container Apps lane. Build a digest-pinned image from the exact git SHA, deploy it to `ca-abarva-web-lab-eastus`, shift 100% traffic to the healthy revision, then run signed-in browser proof.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps, not Vercel.
- Shared runtime mutators: `az acr build`, `az containerapp update`, `az containerapp ingress traffic set`.
- Approved image digest: pending.
- ACA runtime invariant: `app.abarva.ai` must resolve to the new healthy ACA revision at 100% traffic before this is released.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Rollback by shifting ACA traffic to the previous healthy revision. No migration rollback is required because this is display and rendering logic only.

## Audit Evidence

- Local validation passed on 2026-06-29: focused ESLint, focused Jest, board-grade tenant-label behavior regression, Strategic Moves visible-label regression, and release control.
- Pending live browser scan output and screenshots.
- Pending ACA revision and digest proof.

## Known Gaps

This release targets visible tenant/client labels and agent text boundaries. It intentionally keeps legacy aliases in code and data for lookup, routing, and historical compatibility.
