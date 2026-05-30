# 2026-05-30-setup-connector-onboarding — Setup Connector Onboarding Panel + Test Affordance (Wave 2 PR-6)

## Release ID

`2026-05-30-setup-connector-onboarding`

## Status

`candidate`

## Plain-English Summary

First-time tenant admins can now add a connector directly from the Setup landing — they no longer have to navigate, read the Connectors page, and infer the next step. The "Connectors" panel on the `/admin` landing now carries an inline "Add connector" CTA that opens a two-pane onboarding drawer (template picker + details form) on the Connectors page. Existing connectors get a "Test connection" affordance on their detail pages so admins can sanity-check health without leaving Setup.

Per the audit verdict (`SETUP_AUDIT_2026-05-30_VERDICT.md` §4 Persona A, §7 Wave 2 PR 6), the absence of an upload affordance on the landing was an 8-12 minute time-to-first-meaningful-action drag. This PR moves that first action from "navigate, read, infer" to one click from the landing.

The Test connection and Save draft actions are placeholders: they fire PostHog telemetry and show a status banner, but the actual probe and persistence lands with the connector-health broker in Wave 2 PR-1. No OAuth flows execute here, and no credentials are collected — per project safety rules.

## Layer Impact

- `runtime-app-lane`: New `AddConnectorPanel` drawer mounted from `/admin/connectors?add=open`. New `ConnectorOnboardingHeader` strip on the Connectors page. New `ConnectorTestConnectionButton` on every connector detail page. New `PanelCardCta` client island on the Setup landing's panel grid so the locked-design panel card can carry an inline CTA without nesting anchors.
- `architecture-lane`: Extends the `PanelStatusCard` view-model in `src/lib/admin/home-overview-v2.ts` with an optional `cta` field. Broker boundary intact: no new `@/lib/supabase-server` references; the onboarding drawer reads from an in-component default-template constant; future tenant-scoped catalog will resolve through the existing broker contract.
- `qa-validation-lane`: 6 new test suites · 13 new tests covering the panel drawer (render / filter / save / test / configure auth / close), the Connectors page header, the landing-page CTA composer + DOM, the detail-page Test connection button, and the smoke test that detail page renders the button.
- `data-plane-lane`: No schema change. Draft persistence is a placeholder; the broker contract for `createPendingConnector(tenantKey, …)` lands in Wave 2 PR-1.

## Client Applicability

- All clients: The CTA renders on every tenant's `/admin` landing and the onboarding panel opens for every tenant. The default template list is generic (Postgres, Snowflake, Salesforce, ServiceNow, Workday, Okta, GA4, Adobe Analytics, Stripe).
- Specific clients: None.
- Internal only: No. This is a tenant-admin surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/admin/AddConnectorPanel.tsx` (new) — client drawer; two-pane layout (template picker + details form); placeholder Test connection + Save draft; "Configure auth" deep-link to existing connector detail page.
- `src/components/admin/ConnectorOnboardingHeader.tsx` (new) — server-rendered banner sitting above the existing `ConnectorsActionStrip` on the Connectors page; carries the "Add connector" button.
- `src/components/setup/ConnectorTestConnectionButton.tsx` (new) — client island; PostHog `connector_test_connection_clicked` event + transient placeholder banner. TODO marker for the Wave 2 PR-1 RPC swap.
- `src/components/home/PanelCardCta.tsx` (new) — client island that lets the Setup landing's panel-card foot row carry an inline CTA without nesting anchors.
- `src/lib/admin/home-overview-v2.ts` (modified) — added optional `cta` field on `PanelStatusCard`; wired the Connectors panel to surface "Add connector" → `/admin/connectors?add=open`.
- `src/components/home/HomeOverviewV2.tsx` (modified) — renders the `PanelCardCta` when a panel carries one; tags each panel card with `data-panel-num` for test stability.
- `src/app/(maestro)/admin/connectors/page.tsx` (modified) — parses `?add=open` from search params; mounts `<AddConnectorPanel>`; renders `<ConnectorOnboardingHeader>` above the action strip.
- `src/components/setup/ConnectorDetailPage.tsx` (modified) — renders `<ConnectorTestConnectionButton>` directly above the Data flows section.
- `src/components/admin/__tests__/AddConnectorPanel.test.tsx` (new) — 7 tests.
- `src/components/admin/__tests__/ConnectorOnboardingHeader.test.tsx` (new) — 1 test.
- `src/components/home/__tests__/HomeOverviewV2.connector-cta.test.tsx` (new) — 2 tests.
- `src/components/setup/__tests__/ConnectorTestConnectionButton.test.tsx` (new) — 2 tests.
- `src/components/setup/__tests__/ConnectorDetailPage.test-button.test.tsx` (new) — 1 test.

## QA / Validation

- PASS: `npx jest src/components/admin/__tests__/AddConnectorPanel.test.tsx` — 7/7.
- PASS: `npx jest src/components/admin/__tests__/ConnectorOnboardingHeader.test.tsx` — 1/1.
- PASS: `npx jest src/components/home/__tests__/HomeOverviewV2.connector-cta.test.tsx` — 2/2.
- PASS: `npx jest src/components/setup/__tests__/ConnectorTestConnectionButton.test.tsx` — 2/2.
- PASS: `npx jest src/components/setup/__tests__/ConnectorDetailPage.test-button.test.tsx` — 1/1.
- PASS: `npx jest src/components/admin/__tests__ src/components/home/__tests__ src/components/setup/__tests__` — 216/217 (one pre-existing `users-access-sso.test.ts` failure that reproduces on `main` at the same SHA).
- PASS: `npx jest src/lib/admin/__tests__/broker-boundary.test.ts` — 2/2.
- PASS: `npx eslint` over every touched file (only pre-existing warnings in unrelated files).
- PASS: `npx tsc --noEmit` clean.
- PASS: `npm run test:behaviors` — same 5 pre-existing failures as main (tenant-onboarding script's `CLIENT_KEY_TO_DB_SLUGS` regex, unrelated to this PR; 69/74 passing matches main).

## Rollout Plan

Merge to main after CI passes. No migration, no feature flag, no deploy gate. The panel is opt-in (only opens when `?add=open` is in the URL); the Test connection button degrades to a placeholder banner if PostHog is not initialized in the surface; the landing-page CTA renders only when the composer emits a `cta` field, so other tenants / future panel variants stay unaffected.

## Rollback Plan

Revert the PR. The composer change is additive (the `cta` field is optional and only the Connectors panel populates it); the Connectors page changes are bracketed by an `addPanelOpen` guard plus a single import; the connector detail change is one component import. No data migration to roll back.

## Audit Evidence

- Audit verdict driving this work: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §4 Persona A friction (no upload affordance from the landing); §7 Wave 2 PR 6 (Connectors action strip + onboarding flow; test-connection affordance).
- Companion Wave 2 PR (parallel): W2-PR-1 wires `TrustSpine.integration` to live data + reorders Connectors page degraded-first. This PR isolates its additions in a new `ConnectorOnboardingHeader` component to minimize merge conflict.
- AddConnectorPanel: `src/components/admin/AddConnectorPanel.tsx`.
- Onboarding header: `src/components/admin/ConnectorOnboardingHeader.tsx`.
- Test connection button: `src/components/setup/ConnectorTestConnectionButton.tsx`.

## Known Gaps

- Test connection is a placeholder. Real probe lands in Wave 2 PR-1 once the connector-health broker contract exists.
- Save draft is a placeholder. Real `createPendingConnector(tenantKey, name, template_id)` write lands in Wave 2 PR-1 behind the broker boundary. The seeded connector list on `/admin/connectors` will then render the pending row at the top.
- The default template catalog (9 entries) is in-component. A future tenant-scoped catalog will resolve through the connector broker — the panel already accepts a `templates` prop override for that swap.
- The "Configure auth" link uses the template id as the connector route segment (`/admin/connectors/${template.id}`). After Save draft becomes real, the link should target the freshly-created pending connector id, not the template id.
- PostHog breadcrumbs (`connector_onboarding_landing_cta_clicked`, `connector_onboarding_test_connection_clicked`, `connector_onboarding_save_draft_clicked`, `connector_test_connection_clicked`) are fire-and-forget; if PostHog is not initialized in the host, the catches swallow the error.
