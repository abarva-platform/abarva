# 2026-05-30-pr-e-setup-audit-broker — SetupAuditPage reads via broker (P0 Apex-leak fix)

## Release ID

`2026-05-30-pr-e-setup-audit-broker`

## Status

`candidate`

## Plain-English Summary

The `/admin/audit?tab=activity` page now reads its activity feed
through the tenant-scoped admin audit broker (`getAdminAuditEvents`),
not through the hard-coded `AUDIT_LOG_FIXTURE`. The legacy fixture
contained Apex-only content (APX-CDP-2026 gate reviews, AMS BAFO
Stage 7, ServiceNow OAuth events, etc.) and was being rendered
verbatim for every tenant — so an admin signed in to Meridian, First
Capital, Northstar Clinical, or Skyharbor Air would see Apex audit
events. After this change, non-Apex tenants render a clean empty
state ("No activity in this tenant yet.") until their tenant-scoped
admin audit log is seeded. Apex continues to see Apex events. The
existing `?source=` ribbon filter (PR-6) and the `?tab=` sub-nav
(W2-PR-2 Isolation / Approvals) both continue to work unchanged.

## Layer Impact

- `global-control-lane` (security/runtime-app-lane): the Setup audit
  page now respects the tenant resolved by `resolveAdminTenant()`
  instead of leaking the global fixture. No schema, RLS, or
  data-plane changes — pure UI/broker-wiring fix at the page seam.

## Client Applicability

- All clients: Yes — every non-Apex tenant previously leaked Apex
  audit content on this page; all tenants benefit.
- Specific clients: N/A
- Internal only: No
- Public/demo only: No (applies to demo and pilot tenants alike)
- Feature flag: None — straight switch to broker reads.

## Changes Included

- `src/components/setup/SetupAuditPage.tsx` — converted to an async
  server component; takes a required `tenantSlug` prop; calls
  `getAdminAuditEvents(tenantSlug)`; maps results to the legacy
  `AuditEntry` shape; renders `"No activity in this tenant yet."`
  when the broker returns an empty array (vs. `"No audit events
  match this filter."` when a filter excluded all rows).
- `src/components/setup/audit-entry-mapper.ts` — new mapper module:
  `mapAdminAuditToLegacyEntry` + helpers (`surfaceForCategory`,
  `severityForCategory`, `deriveActorInitials`, `humanizeAction`,
  `formatLegacyTimestamp`). Drops `targetId`, `targetKind`, and
  `actorPersonId` from the rendered row (PII hygiene).
- `src/app/(maestro)/admin/audit/page.tsx` — passes
  `tenant.tenantSlug` into `<SetupAuditPage>`; header comment
  updated to call out PR-E.
- `src/components/setup/__tests__/SetupAuditPage.broker.test.tsx` —
  new test file (6 tests): broker is called with the active
  tenantSlug; Apex tenant renders Apex events; non-Apex tenants
  render the empty state and crucially do NOT leak Apex strings;
  source filter still works on broker results; filter-empty vs.
  tenant-empty messages are distinct.
- `src/components/setup/__tests__/audit-entry-mapper.test.ts` — new
  test file (24 tests): every mapper helper plus the composite
  reshape, including a PII-hygiene assertion that the legacy entry
  does not expose `targetId`/`targetKind`/`actorPersonId`.

## QA / Validation

- PASS `npx jest src/components/setup/__tests__/SetupAuditPage
  src/components/setup/__tests__/audit-entry-mapper` — 36 tests, 3
  suites, all green.
- PASS `npx eslint` on every touched file — zero warnings/errors.
- PASS `npx tsc --noEmit` for every touched file — no new
  type errors (the only `tsc` output is the preexisting Azure SDK
  "Cannot find module" workflow artifact unrelated to this PR).

## Rollout Plan

- Merge PR to `main`.
- Vercel preview build auto-promotes on merge.
- No migrations, no flags, no manual runbook — the change is
  immediate on next deploy.

## Rollback Plan

- Revert the merge commit. The previous behavior (rendering the
  Apex-only fixture for every tenant) is restored on the next
  deploy. No data state to unwind.

## Audit Evidence

- Spec: `docs/build/ADMIN_HOME_FULL_TEST_2026-05-30.md` §2 Layer 6
  + §6 F5 + §7.4.
- PR URL: (added by `gh pr create` below).
- CI: GitHub Actions run on the PR (jest + eslint + tsc + release
  check).
- Test output: 36/36 green locally, captured in the PR description.

## Known Gaps

- `src/lib/setup/shell-setup-fixture.ts` still exports
  `AUDIT_LOG_FIXTURE` (now unused by the page itself). PR-F
  (separate) will quarantine the rest of `shell-setup-fixture.ts`
  to remove the residual Apex-only content from the bundle entirely.
- Non-Apex tenants render the empty state until their
  `admin_audit_log` is seeded; this is the correct hygiene posture
  for pilot, but a follow-on data task should backfill per-tenant
  seed events so the activity tab is non-empty for fresh tenants.
- The legacy `surface` heuristic (`approval` → Programs, everything
  else → Setup) is still string-based; a future PR can replace it
  with first-class source metadata on each `AdminAuditEvent`.
