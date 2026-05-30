# 2026-05-30-pre-w4-pr2-connector-save-wired — AddConnectorPanel Save draft persists a real pending row

## Release ID

`2026-05-30-pre-w4-pr2-connector-save-wired`

## Status

`candidate`

## Plain-English Summary

PRE-W4-PR-2 of the Trust Plane pre-comms wave. Before this PR, the
AddConnectorPanel "Save draft" button fired a PostHog telemetry event
and transitioned the panel to a faux success state — no row was
written. The TODO at AddConnectorPanel.tsx:269 admitted as much.

This PR wires Save draft to a real persistence path. A new broker
function `createPendingConnector(tenantKey, …)` validates inputs,
resolves the client id, INSERTs an `admin_connectors` row with
`status='pending'`, and writes an `admin_audit_log` row with
`category='connector'` and `action='connector_added'`. That audit row
is the canonical source for the Wave 4 `connector.added` notification
event.

After Save draft succeeds, the panel transitions to a new inline
success state that links the operator to
`/admin/connectors#connector-{id}`, where the pending row appears in
the existing posture-sorted list (degraded → disconnected → live →
pending — the adapter's new `pending` lifecycle status collapses into
the page-view `deferred` bucket so sort order is unchanged).

Hard constraints honored:
  - Design system locked — no color or font changes.
  - Broker boundary intact — the panel calls a server action which
    calls the broker; only the broker writes to Supabase.
  - No credentials are stored from this panel. Save draft writes
    only `template_id`, `name`, `tenant`, `scope`, and `auth_method`
    (operator-intent string, not a credential). Credential collection
    happens later via the Configure auth flow on the detail page.
  - No OAuth execution from the panel — per the verdict safety rule.

## Layer Impact

- `data-substrate-lane`: Migration
  `supabase/migrations/20260530200000_connector_status_pending.sql`
  extends `admin_connectors.status` CHECK to include `'pending'` and
  adds three optional columns (`template_id`, `scope`, `auth_method`
  with a CHECK constraint). Additive — non-breaking for existing rows.
- `runtime-app-lane`: New broker function `createPendingConnector` in
  `connector-health-broker.ts`. New server action at
  `src/app/(maestro)/admin/connectors/_actions/create-pending-connector.ts`.
  AddConnectorPanel's `handleSaveDraft` now invokes the action. The
  adapter status enum widens to include `'pending'`; the page-view
  collapses the new status into the existing `deferred` bucket.
- `qa-validation-lane`: 7 new broker tests + 4 new server-action tests
  + 1 new AddConnectorPanel error-path test + 1 new broker posture-map
  test.

## Client Applicability

- All clients: The Save draft flow is available to any tenant admin
  on `/admin/connectors`. No fixture seeding required.
- Specific clients: None.
- Internal only: None.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `supabase/migrations/20260530200000_connector_status_pending.sql` —
  extend status CHECK + add `template_id`, `scope`, `auth_method`
  columns with a CHECK on `auth_method`.
- `src/lib/admin/data/admin-connectors-adapter-types.ts` — add
  `'pending'` to `AdminConnectorStatus`.
- `src/lib/admin/broker/connector-health-broker.ts` — new
  `createPendingConnector` function; posture mapping recognizes
  the new `pending` lifecycle status (collapses to `pending` posture).
- `src/lib/admin/connectors-page-view.ts` — adapter `'pending'` →
  page-view `'deferred'` (same posture tier, same sort key, no UI
  change).
- `src/app/(maestro)/admin/connectors/_actions/create-pending-connector.ts` —
  authority-gated server action delegating to the broker.
- `src/components/admin/AddConnectorPanel.tsx` — `handleSaveDraft`
  now calls the server action; new success-state copy with a deep
  link to `/admin/connectors#connector-{id}`; new "Saving…" disabled
  state.
- `src/lib/admin/broker/__tests__/connector-health-broker.test.ts` —
  7 new tests for `createPendingConnector` + 1 new test for the
  pending posture mapping.
- `src/app/(maestro)/admin/connectors/_actions/__tests__/create-pending-connector.test.ts` —
  4 tests: unauth, no-admin, happy path, broker-error.
- `src/components/admin/__tests__/AddConnectorPanel.test.tsx` —
  updated save tests + 1 new error-path test.

## QA / Validation

- PASS: `npx tsc --noEmit` — 0 new errors. Existing missing-module
  warnings (`@azure/*`, `pptxgenjs`, `@resvg/resvg-js`) are
  unchanged.
- PASS: `npx eslint src/` — 0 errors (153 pre-existing warnings, none
  in the changed files).
- PASS: `npx jest src/lib/admin/broker/__tests__/connector-health-broker.test.ts` — 17/17
- PASS: `npx jest --testPathPatterns=create-pending-connector` — 4/4
- PASS: `npx jest src/components/admin/__tests__/AddConnectorPanel.test.tsx` — 8/8
- PASS: `npx jest src/lib/admin/__tests__/broker-boundary.test.ts` — 2/2
- PASS: `npm run test:behaviors` — only pre-existing
  `tenant-onboarding.test.ts` failure (confirmed against main with
  `git stash`, unrelated to this PR).

## PII / Data Posture

- The Save draft path never collects or persists credentials.
- Only template id, name, scope (free-text), and auth-method intent
  (`'oauth' | 'api_key' | 'sso'` label) are written. The auth-method
  column carries a CHECK constraint so unsupported strings are
  rejected at the database layer.
- `admin_connectors` is RLS-locked to `service_role`.
- The audit-log row's `metadata` JSON includes the template id, the
  auth-method intent, and the scope — no PII.

## Lane Vocab

- `data-substrate-lane`: one migration (additive).
- `runtime-app-lane`: broker function + server action + panel wiring.
- `qa-validation-lane`: 13 new tests across three files.

## Authoring

PR pending. Branch: `claude/pre-w4-pr2-connector-save-wired`.

## Rollout Plan

- Merge to `main`.
- Apply migration `20260530200000_connector_status_pending.sql` via
  the standard `npm run db:migrate` flow (preview → production).
- Vercel auto-deploys the app-tier changes on merge.
- No tenant-side action required — the panel automatically uses the
  new path for all admins.

## Rollback Plan

- App-tier: revert the merged commit. The connector list rendering
  is unaffected by the new lifecycle status because adapter `pending`
  collapses to page-view `deferred` (the same sort tier) — rolling
  back the page-view + adapter changes is purely a code revert.
- DB-tier: the migration is additive (status CHECK widened, three
  optional columns). If rollback is needed:
  - `ALTER TABLE admin_connectors DROP CONSTRAINT admin_connectors_status_check;`
  - `UPDATE admin_connectors SET status='deferred' WHERE status='pending';`
  - `ALTER TABLE admin_connectors ADD CONSTRAINT admin_connectors_status_check CHECK (status IN ('not_configured','configured_stub','blocked','deferred','active'));`
  - `ALTER TABLE admin_connectors DROP COLUMN template_id, DROP COLUMN scope, DROP COLUMN auth_method;`
  - (Or simply leave the columns + the widened CHECK — they're
    inert without the app-tier writer.)

## Audit Evidence

- Source: `docs/build/PERSONA_A_TENANT_ADMIN_DAY1_2026-05-30.md`
  §4.3 (AddConnectorPanel save-draft TODO) + §9 fix #3 (wire to
  pending_connectors / broker contract).
- Telemetry: the `connector_onboarding_save_draft_clicked` PostHog
  event remains as a breadcrumb at the click boundary.
- Wave 4 source-of-truth: `admin_audit_log` rows with
  `category='connector'` and `action='connector_added'` are read by
  the Wave 4 `connector.added` notification publisher.
- Broker-boundary test: `src/lib/admin/__tests__/broker-boundary.test.ts` — 2/2.

## Known Gaps

- The live `getAdminConnectors` adapter still throws
  `AdminDataMigrationPendingError` until DATA10 lands. In fixture
  mode the new pending row will not appear in the connectors list
  because the fixture is in-memory and the broker writes to Supabase.
  Production / pilot environments using the live adapter (post-DATA10)
  will surface the pending row.
- Configure-auth flow on the detail page is unchanged — credential
  collection is out of scope for this PR.
