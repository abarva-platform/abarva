# 2026-05-30-setup-connector-health-broker — Connector Health Broker · Live Integrations Chip (Wave 2 PR-1)

## Release ID

`2026-05-30-setup-connector-health-broker`

## Status

`candidate`

## Plain-English Summary

The Integrations chip on the Setup landing's Trust strip is now wired to live per-tenant connector health, replacing the `evidence: 'estimated'` stub that shipped with Wave 1. An admin landing on `/admin` reads the real connector posture — total, live, degraded, last pull time, and the most attention-worthy degraded connector — directly from the canonical admin connectors adapter, without leaving the Trust strip.

The Connectors page (`/admin/connectors`) is reordered so degraded connectors appear FIRST in the flat list, in their category, and as the leading category. When one or more connectors are degraded, a sticky amber banner appears at the top of the page reading "N connector(s) need attention" with a "Review now" ghost button that jumps the admin to the first degraded row. Cosmetics use only the locked palette tokens (`COLORS.amberSoft` background, `COLORS.amberInk` dot, `COLORS.ink` text and ghost button outline).

The unified audit ribbon now mixes in connector events. Recent successful pulls within the last 24 hours emit `sync succeeded` rows; degraded connectors with a known failure reason emit `sync failed — <reason>` rows. These join the existing substrate and approval events on one temporal axis, sorted and capped server-side.

Honesty doctrine is preserved: when the connector health broker throws (e.g. the live admin_connectors DB read path is still pending behind `AdminDataMigrationPendingError`), the trust-spine broker catches the rejection in `Promise.allSettled`, logs a structured warning (`trust_spine.connector_health.degraded`), and falls back to the zeroed `'estimated'` posture so the landing renders without crashing.

## Layer Impact

- `runtime-app-lane`: New `connector-health-broker.ts` under `src/lib/admin/broker/**`; trust-spine-broker now composes connector health into the `integration` dimension and into the audit ribbon. Connectors page reorders by posture severity and renders the conditional degraded banner. ConnectorCategoryGroup adds an `id="connector-<id>"` anchor target for the banner jump.
- `qa-validation-lane`: 9 connector-health-broker unit tests (new file), 3 new trust-spine-broker tests (live integration, fallback, ribbon events), 3 new connectors page-view banner smoke tests.
- `architecture-lane`: No new direct Supabase reads — the broker composes through the existing `getAdminConnectors` adapter, preserving the broker boundary hygiene gate (PR-4).
- `data-plane-lane`: No schema change. The `admin_connectors` table already lives in `supabase/migrations/20260426120000_admin_connectors.sql`; live read remains gated on ADMIN-DATA10.

## Client Applicability

- All clients: Every tenant's `/admin` Trust strip reads live connector posture. Every tenant's `/admin/connectors` page surfaces degraded-first ordering. Both behaviors degrade gracefully when the upstream adapter throws.
- Specific clients: None.
- Internal only: No. This is a tenant-admin surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/broker/connector-health-broker.ts` (new) — canonical broker contract `getConnectorHealth(tenantKey)`; maps adapter status taxonomy to honest posture taxonomy (`live | degraded | disconnected | pending`); computes `lastPullIso`, `topDegraded`, and `perConnector` rollups.
- `src/lib/admin/broker/trust-spine-broker.ts` (modified) — imports `getConnectorHealth`; passes its result into `composeIntegration` (live posture) and `composeAuditRibbon` (connector events); catches rejection in `Promise.allSettled` and falls back to estimated zeros with a structured `console.warn`.
- `src/lib/admin/broker/__tests__/trust-spine-broker.test.ts` (modified) — mocks `getConnectorHealth`; adds 3 tests (live integration shape, broker-throw fallback, sync-succeeded / sync-failed audit events) and adjusts the pre-existing "estimated" assertion to apply to isolation only.
- `src/lib/admin/broker/__tests__/connector-health-broker.test.ts` (new) — 9 unit tests covering empty tenant, taxonomy mapping, `lastPullIso` picker, `topDegraded` picker, failureReason gating, and error propagation.
- `src/lib/admin/connectors-page-view.ts` (modified) — adds `degradedCount` + `firstDegradedId` to the page-view contract; adds `sortByPostureSeverity` helper and applies posture-first ordering to both the flat connectors list and the category groups.
- `src/lib/admin/__tests__/connectors-page-view-degraded-banner.test.ts` (new) — 3 smoke tests covering banner inputs across tenants with and without degraded rows + posture-first sort invariant.
- `src/app/(maestro)/admin/connectors/page.tsx` (modified) — renders the sticky amber banner above the action strip when `degradedCount > 0`; uses the locked palette tokens; banner links to `#connector-<firstDegradedId>` for in-page jump.
- `src/components/admin/connectors/ConnectorCategoryGroup.tsx` (modified) — adds `id={`connector-${c.id}`}` to each connector `<li>` so the banner anchor jump resolves.
- `docs/releases/records/2026-05-30-setup-connector-health-broker.md` (new) — this record.

## QA

- `npx eslint src/lib/admin/broker src/app/(maestro)/admin/connectors`
- `npx tsc --noEmit`
- `npx jest src/lib/admin/broker/__tests__ src/lib/admin/__tests__/connectors-page-view-degraded-banner.test.ts`
- `npm run test:behaviors` — pre-existing 5 failures in tenant-onboarding.test.ts are NOT part of this PR.

## Rollout

- Merge to main.
- Vercel auto-deploys preview → production. No env vars added or removed.

## Rollback

- `git revert` the squash-merge commit. No schema migration to undo. Trust strip reverts to the Wave 1 `evidence: 'estimated'` integration chip.

## Audit Evidence

- `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.4 (Data Trust backbone — Integrations is one of the four trust dimensions on the strip).
- `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §7 Wave 2 PR-1 (Connector health broker — pull connector last-pull, scope, status into TrustSpine.integration; reorder Connectors page to put degraded connectors at the top).
- Honesty / broker-boundary memory: `feedback_no_demo_thinking.md`, `feedback_broker_boundary.md`.
