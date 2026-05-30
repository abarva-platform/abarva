# 2026-05-30-pre-w4-pr3-connector-test-probe — Connector "Test connection" real probe (PRE-W4-PR-3)

## Release ID

`2026-05-30-pre-w4-pr3-connector-test-probe`

## Status

`candidate`

## Plain-English Summary

The "Test connection" button on the connector detail page used to fake the verdict. Clicking it fired a PostHog breadcrumb, waited 250 ms, and rendered the placeholder banner `Would test connection · live probe arrives with Wave 2 PR-1`. Wave 2 PR-1 shipped weeks ago — the swap was never done.

This release rewires the button to a real probe endpoint, `POST /api/admin/connectors/[id]/test`. The route resolves the caller's tenant context (Clerk admin/maestro role + active client), executes a per-kind probe through the connector-health broker, writes an `admin_audit_log` row for every probe attempt, and returns `{ok, latencyMs, reason, probedAtIso, transition}`. The UI renders the verdict inline: green dot for healthy, red dot for failed (with a `Reconnect connector` hint when the reason is an auth-error), amber dot for rate-limited, spinner while probing.

Per the directive's persona impact analysis, this is THE highest impact-per-day fix from both PERSONA_B (Steward Day-30) and PERSONA_C (Incident) personas: it's the precondition for the Wave 4 `connector.degraded` / `connector.recovered` notification stream having ground-truth state changes to fire on.

## Layer Impact

- `runtime-app-lane`: New POST route `src/app/api/admin/connectors/[id]/test/route.ts`. Live wiring of `src/components/setup/ConnectorTestConnectionButton.tsx` from a `setTimeout` placeholder to a real `fetch` against the new route. Status taxonomy expanded from `idle | pending | placeholder` to `idle | probing | healthy | failed | rate_limited | error`.
- `broker-lane`: New broker method `testConnector(tenantKey, connectorId)` exported from `src/lib/admin/broker/connector-health-broker.ts`. New probe registry at `src/lib/admin/broker/connector-probes/index.ts`. Helper modules at `src/lib/admin/broker/connector-test-rate-limit.ts` (in-memory per-tenant rate limit, 10 probes/minute) and `src/lib/admin/connector-test-audit.ts` (audit-log writer, mirrors the `tenant-switch-audit.ts` pattern).
- `data-layer-lane`: No migrations. The audit writes go to the existing `admin_audit_log` table with `category='connector'`, `action='connector_tested'`. Metadata captures `actor_user_id`, `connector_id`, `ok`, `latency_ms`, `reason` (capped at 200 chars), `probed_at_iso`, `prior_status`, `next_status`, `transition_kind`. No credentials are written.
- `qa-validation-lane`: 7 new route tests covering auth (401/403), happy path (200 + audit write), not-found sentinel (404), per-tenant rate limit (200 × 10 then 429 with `Retry-After`), and unexpected internal error (500). 7 new broker tests covering `testConnector` not-found / inconclusive / transition derivation across the {live, degraded, disconnected, pending} priors. Component smoke test rewritten end-to-end for the live wiring (5 tests).

## Client Applicability

- All clients: the live probe is wired to every tenant's connectors. No tenant-specific gates.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The route is gated by Clerk role (`admin` or `maestro`).

## Changes Included

- `src/app/api/admin/connectors/[id]/test/route.ts` (new) — POST handler. Clerk auth, active-tenant resolution, rate-limit gate, broker invocation, audit write (fire-and-forget), JSON verdict response.
- `src/app/api/admin/connectors/[id]/test/__tests__/connector-test-route.test.ts` (new) — 7 route tests.
- `src/lib/admin/broker/connector-health-broker.ts` (modified) — added `testConnector` + `TestConnectorResult` + `TestConnectorTransition` exports. Added `deriveTransition` with the conservative posture rules: inconclusive probes never mint a transition; `live → degraded` and `degraded → live` are the only auto-mutating cases.
- `src/lib/admin/broker/connector-probes/index.ts` (new) — per-kind probe registry. HTTP probes for ERP, spend analytics, contract management, market intel, vendor portal, identity, CRM, and "other". Unsupported probe for `data_warehouse` (DB driver not yet wired). Hard 5 s timeout via `AbortController`. No retries. No OAuth.
- `src/lib/admin/broker/connector-test-rate-limit.ts` (new) — in-memory per-tenant token bucket. 10 probes / minute / tenant. Test-only `__resetConnectorTestRateLimit` for isolation.
- `src/lib/admin/connector-test-audit.ts` (new) — `writeConnectorTestAudit`. Mirrors the `tenant-switch-audit.ts` pattern: fixture-mode skip, structured warn on failure, never blocks the probe verdict reaching the UI.
- `src/lib/admin/broker/__tests__/connector-health-broker.test.ts` (modified) — added 7 `testConnector` test cases. Pre-existing `getConnectorHealth` suite unchanged.
- `src/components/setup/ConnectorTestConnectionButton.tsx` (modified) — full rewrite. `fetch` against the new route, five-state status machine, inline verdict banners. PostHog telemetry preserved + extended with a `connector_test_connection_result` capture.
- `src/components/setup/__tests__/ConnectorTestConnectionButton.test.tsx` (modified) — full rewrite. 5 tests cover happy / failed / rate-limited / error paths.
- `docs/releases/records/2026-05-30-pre-w4-pr3-connector-test-probe.md` (new) — this record.

## QA / Validation

- `npx tsc --noEmit` — clean.
- `npx eslint <new + modified files>` — clean.
- `npx jest src/lib/admin/broker/__tests__/connector-health-broker.test.ts` — **17 / 17 pass** (10 original `getConnectorHealth` + 7 new `testConnector`).
- `npx jest src/components/setup/__tests__/ConnectorTestConnectionButton.test.tsx` — **5 / 5 pass**.
- `npx jest src/app/api/admin/connectors` — **7 / 7 pass**.

## Rollout Plan

- Merge to main → route is immediately available; component picks up the new behaviour on the next deploy.
- No feature flag. The route's role gate (Clerk `admin` or `maestro`) is the safety net.
- No migrations required.
- The audit table (`admin_audit_log`) is already in place; new rows land with `category='connector'`, `action='connector_tested'`. Existing `getAdminAuditEvents` queries surface them in the audit log view without any further wiring.

## Rollback Plan

- Code path: revert the merge commit. The component falls back to the placeholder banner; the route 404s but no caller depends on it for app-tier rendering.
- Data path: no migrations to roll back. `admin_audit_log` rows with `action='connector_tested'` can be left in place (they're append-only by design) or pruned with `DELETE FROM admin_audit_log WHERE action='connector_tested'` — neither shape breaks any downstream consumer.
- Rate-limit state: in-memory only; module unload clears it.

## Audit Evidence

- Tests: 19 new tests (7 route + 7 broker + 5 component), all passing locally. CI gates: typecheck-clean, eslint-clean, jest-clean for the slice.
- Audit row shape: `admin_audit_log` insert payload includes `actor_user_id`, `connector_id`, `ok`, `latency_ms`, `reason` (capped 200 chars), `probed_at_iso`, `prior_status`, `next_status`, `transition_kind`. Credentials are never written — the probe layer is the single source of `reason` strings and only emits operator-facing text.
- Safety doctrine:
  - 5 s hard cap enforced in `httpHead` via `AbortController`.
  - No OAuth flows — the probe uses only the connector's existing stored configuration. Today the adapter doesn't expose a `healthUrl`, so HTTP probes report `probe unsupported · no health URL configured`. This is the truthful state per the honesty doctrine and short-circuits any accidental network traffic.
  - 10 probes / minute / tenant rate limit via `acquireConnectorTestSlot`. Returns `Retry-After` (seconds) on rejection.
  - Inconclusive probes (kind unsupported / no health URL) do NOT mutate connector posture. Only `live → degraded` (genuine failure) and `degraded → live` (recovery) emit transitions. This is the precondition for Wave 4's `connector.degraded` / `connector.recovered` notification stream.
- Manual-vs-auto separation (directive §6): the broker computes the transition but does NOT persist it. Manual probes (this PR) audit the verdict and surface the inline banner; the notification stream is fed exclusively by auto-monitoring (Wave 4) so a curious operator clicking "Test connection" can't spam the alerting channel.
- Persona context: PERSONA_B (Steward Day-30) §9 fix #1 and PERSONA_C (Incident) §10 fix #1 — both flagged the placeholder banner as the highest-impact fix because every Wave 4 connector notification depends on real status transitions existing.

## Known Gaps

- HTTP probes that need a per-connector health URL today return `probe unsupported · no health URL configured`. The adapter doesn't expose a `healthUrl` column. Next slice: extend `AdminConnectorRow` (or the detail-level adapter) with `config.healthUrl`, surface it through `resolveHealthUrl` in the broker, and add fixture entries for each connector kind.
- DB connectors (`data_warehouse`) return `probe unsupported for data_warehouse connectors · configure auth first`. No managed driver is wired. Next slice: thin Postgres/Snowflake "SELECT 1" probes behind a service-role connection pool with credentials stored in a hardware-key vault.
- The in-memory rate-limit is per-process. Multi-region deployments multiply the cap by replica count. Wave 5 should move the bucket to Redis or Vercel Edge Config; the contract (`acquireConnectorTestSlot`) is shaped to make that swap mechanical.
- Notification persistence + emission for `connector.degraded` / `connector.recovered` is out of scope for this PR — that's Wave 4. The broker already computes the transition; the Wave 4 PR plumbs it into the notification stream.
