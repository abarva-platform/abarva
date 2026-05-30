# 2026-05-30-setup-audit-ribbon — Setup/Admin Unified Audit Ribbon (Wave 1 PR-6)

## Release ID

`2026-05-30-setup-audit-ribbon`

## Status

`candidate`

## Plain-English Summary

Surfaces a unified 24-hour activity ribbon on the `/admin` Setup landing — Zone E of the Trust Plane verdict — that mixes substrate-import events with approval-queue events on one temporal axis, with placeholders for the (Wave 2) auth, policy, connector, and invite sources. Each row links to the full audit page filtered by source, so an incident-response admin can triage "what just happened" without leaving Setup.

This release also extends the TrustSpine broker's audit composer from substrate-only to a sorted union over substrate + approval events, capped at 50 events server-side. Connector and invite ledgers are honest empty arrays with TODOs marking the Wave 2 wiring point — the ribbon shows what is real, not synthetic.

## Layer Impact

- `runtime-app-lane`: New AuditRibbon section on the `/admin` landing between Setup panels and the bottom of the page. New audit-page filter wiring (`/admin/audit?source=<source>`). The audit-page header restates the active filter and includes a "clear filter" affordance.
- `architecture-lane`: Extends the canonical `getTrustSpine` broker contract to union approval events into `audit.last24hEvents`. Connector and invite sources remain stubbed with `// TODO(Wave 2 …)` markers; broker boundary remains intact (zero new `@/lib/supabase-server` references outside `src/lib/admin/broker/**`).
- `qa-validation-lane`: 9 broker tests (was 6), 4 AuditRibbon tests, 2 source-filter helper tests. Broker-boundary hygiene gate still passes.
- `data-plane-lane`: No schema change. The approval source reads `program_approval_requests` via the existing `getApprovalQueueForTenant` helper.

## Client Applicability

- All clients: The ribbon is rendered on every tenant's `/admin` landing. When the broker has no events it shows the muted "No activity in the last 24 hours" line — honest empty state, not a synthetic stream.
- Specific clients: None.
- Internal only: No. This is a tenant-admin surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/broker/trust-spine-broker.ts` (modified) — extended audit composer to union substrate + approval events; added connector / invite stub helpers; capped the ribbon at 50 events server-side; sorted by ts desc.
- `src/lib/admin/broker/__tests__/trust-spine-broker.test.ts` (modified) — added 3 tests covering the union, the 50-event cap, and the connector/invite stub posture.
- `src/components/admin/AuditRibbon.tsx` (new) — server-renderable ribbon UI; 6-row cap; color-keyed source chips from the locked palette; "See all in audit" footer link.
- `src/components/admin/AuditRibbonRow.tsx` (new) — thin client island that fires the `audit_ribbon_row_clicked` PostHog event and forwards the click to `/admin/audit?source=<source>`.
- `src/components/admin/__tests__/AuditRibbon.test.tsx` (new) — 4 snapshot-ish tests (6-row render, 6-row cap with overflow, empty state, optional target).
- `src/components/home/HomeOverviewV2.tsx` (modified) — added `auditEvents` prop; renders the AuditRibbon section below the Setup panels block.
- `src/app/(maestro)/admin/page.tsx` (modified) — invokes `getTrustSpine(brokerTenantKey)` and slices the top-6 audit events into the page prop.
- `src/components/setup/SetupAuditPage.tsx` (modified) — accepts an optional `filterSource` prop; filters fixture rows by surface; restates the active filter in the header and renders a "clear filter" link; shows a muted "no events match this filter" line when the filter empties the list.
- `src/app/(maestro)/admin/audit/page.tsx` (modified) — reads `?source=<source>` from `searchParams` (Next 16 Promise convention) and forwards to the page component via `isAuditSourceFilter` guard.
- `src/components/setup/__tests__/SetupAuditPage.filter.test.ts` (new) — 2 helper tests for the source-filter guard.

## QA / Validation

- PASS: `npx jest src/lib/admin/broker/__tests__/trust-spine-broker.test.ts` — 9/9.
- PASS: `npx jest src/lib/admin/__tests__/broker-boundary.test.ts` — 2/2 (no new Supabase imports outside the broker dir).
- PASS: `npx jest src/components/admin/__tests__/AuditRibbon.test.tsx` — 4/4.
- PASS: `npx jest src/components/setup/__tests__/SetupAuditPage.filter.test.ts` — 2/2.
- PASS: `npx eslint` over every touched file.
- PASS: `npx tsc --noEmit` clean.
- PASS: `npm run test:behaviors` — same 5 pre-existing failures as main (tenant-onboarding script's `CLIENT_KEY_TO_DB_SLUGS` regex, unrelated to this PR; 69/74 passing matches main).

## Rollout Plan

Merge to main after CI passes. No migration, no feature flag, no deploy gate. The landing page renders the ribbon section on every tenant — the broker-side fallback path (`getTrustSpine` failure → null → empty events) keeps the page from crashing when the substrate / approval data path is unavailable.

## Rollback Plan

Revert the PR. The audit-page filter is additive (default branch is the original full list), the AuditRibbon section is a single import in `HomeOverviewV2.tsx`, and the broker composer change degrades to "substrate only" cleanly if reverted in isolation.

## Audit Evidence

- Audit verdict driving this work: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6 Zone E (Audit ribbon) and §5.4 (Data Trust backbone).
- Predecessor broker: `src/lib/admin/broker/trust-spine-broker.ts` (introduced in `2026-05-30-admin-trust-spine-broker`).
- AuditRibbon component: `src/components/admin/AuditRibbon.tsx`.
- Audit-page filter: `src/components/setup/SetupAuditPage.tsx` + `src/app/(maestro)/admin/audit/page.tsx`.

## Known Gaps

- Connector and invite sources return empty arrays with `// TODO(Wave 2 …)` markers — there is no connector-events ledger and no `tenant_invites` table in production today. The ribbon shows substrate + approval events only until Wave 2 PR-1 / PR-2 wire those readers behind the broker boundary.
- The audit-page filter currently maps each source to a fixture surface heuristic (substrate/connector/auth/policy/invite → Setup; approval → Programs). When the audit ledger gains first-class source metadata, this heuristic should be replaced with a direct source-column filter.
- Approval rows synthesize the actor as "Program owner" rather than resolving the user id to a display name. A future identity broker will replace this.
- The PostHog `audit_ribbon_row_clicked` breadcrumb is fire-and-forget — if PostHog is not initialized in the host, the click still navigates and the catch swallows the error.
