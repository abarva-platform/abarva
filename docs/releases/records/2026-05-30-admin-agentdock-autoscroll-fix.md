# 2026-05-30-admin-agentdock-autoscroll-fix — Admin Content-First Layout and Scroll Fix

## Release ID

`2026-05-30-admin-agentdock-autoscroll-fix`

## Status

`candidate`

## Plain-English Summary

The admin page was visibly jumping or continuing downward because the embedded Steward dock used a browser-level scroll command from inside the chat thread. The admin pages were also too cluttered for Maestro consumption because the Steward dock opened as a full middle lane by default. This release confines Steward auto-scroll behavior to the dock's own message pane, makes admin pages content-first with Steward available on demand, simplifies sidebar labels, and scopes Engineering reasoning traces to the active tenant instead of showing an all-tenant view.

## Layer Impact

`global-control-lane`: Updates shared AgentDock behavior used by admin and other control-plane surfaces.

`internal-admin`: Fixes the operator experience on the authenticated admin home surface.

## Client Applicability

- All clients: Admin users on shared control-plane surfaces receive the safer dock scroll behavior.
- Specific clients: Apex Retail, Meridian Health, Northstar Clinical, First Capital, and SkyHarbor Air.
- Internal only: AbarVa admin/operator surfaces that embed the Steward dock.
- Public/demo only: Not applicable.
- Feature flag: None.

## Changes Included

- `src/components/agent/AgentDock.tsx`: Replaces document-level `scrollIntoView()` with `scrollTop = scrollHeight` on the dock thread scroller, skips initial empty-thread scrolling, and labels the collapsed Steward chip.
- `src/components/admin/AdminCanonShellV2.tsx`: Defaults Setup/Admin Steward to an on-demand collapsed chip and restores the canonical 280px sidebar width.
- `src/components/admin/AdminSidebar.tsx` and `src/lib/admin/admin-shell-config.ts`: Simplify menu text so Maestro navigation is easier to scan.
- `src/app/(maestro)/engineering/traces/page.tsx` and `src/lib/admin/admin-tenant.ts`: Scope the reasoning audit page to the active tenant and remove the all-tenant default.
- `src/components/agent/__tests__/AgentDock.test.tsx` and `src/components/admin/__tests__/admin-content-first-layout.test.ts`: Add regression coverage for the scroll boundary, content-first admin layout, and tenant-scoped reasoning audit.

## QA / Validation

- Passed: `npx eslint src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx`
- Passed: `npx jest src/components/agent/__tests__/AgentDock.test.tsx`
- Passed: `npx eslint src/components/admin/AdminCanonShellV2.tsx src/components/admin/AdminSidebar.tsx src/lib/admin/admin-shell-config.ts src/app/(maestro)/engineering/traces/page.tsx src/lib/admin/admin-tenant.ts src/components/admin/__tests__/admin-content-first-layout.test.ts`
- Passed: `npx jest src/components/admin/__tests__/admin-content-first-layout.test.ts src/lib/admin/__tests__/admin-tenant.test.ts`
- Passed: `npx jest --runTestsByPath src/components/agent/__tests__/AgentDock.test.tsx src/components/admin/__tests__/admin-content-first-layout.test.ts src/lib/admin/__tests__/admin-tenant.test.ts src/app/(maestro)/admin/connectors/_actions/__tests__/create-pending-connector.test.ts`
- Passed: `npm run release:check`
- Passed: authenticated local browser smoke on `/admin/data-trust`, `/admin/agent-readiness`, and `/engineering/traces` for Apex Retail. Each route stayed at `window.scrollY = 0`; Setup/Admin pages rendered the collapsed Steward chip and no side rail; Engineering traces did not show `All tenants`.
- Blocked by pre-existing seed-file type errors: `npx tsc --noEmit --pretty false` still fails on generated seed files missing `PatternSeed` imports.

## Rollout Plan

Merge to `main` and allow the Vercel production deployment to pick up the client component change. No migration, backfill, or manual data operation is required.

## Rollback Plan

Revert the release commit or PR. The rollback restores prior AgentDock scroll behavior and has no data impact.

## Audit Evidence

- User-reported live preview issue: `https://nexus-vert-kappa.vercel.app/admin` keeps scrolling down.
- User-provided screenshots show `/admin/engineering/traces` defaulting to all tenants and Setup/Admin pages overwhelmed by the chat lane.
- Regression tests added for the scroll boundary, content-first layout default, and tenant-scoped reasoning audit.
- Post-deploy browser smoke should record initial and delayed `window.scrollY` values.

## Known Gaps

This release fixes the top-level page scroll, the default Steward dock clutter, menu readability, and the all-tenant reasoning-audit default. Deeper redesign of dense page internals such as the full capability matrix remains follow-up work.
