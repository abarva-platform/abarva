# 2026-05-30-setup-isolation-lane — Isolation Lane · Live Isolation Chip (Wave 2 PR-2)

## Release ID

`2026-05-30-setup-isolation-lane`

## Status

`candidate`

## Plain-English Summary

Admins can now triage cross-tenant resolution events from inside Setup. A new sub-nav tab on `/admin/audit?tab=isolation` surfaces the last 24 hours of `ai_egress_audit` rows for the tenant — counts, severity, decision, workflow, intended-vs-resolved tenant (when callers stamp it into `request_metadata`), and reason. The Isolation chip on the landing Trust strip is wired to live anomaly counts and now routes to the lane on click. This is the STRESS-P0-006 incident-response surface — an admin can answer "did anything cross tenants in the last 24 hours?" from `/admin` without leaving Setup.

PII / payload material (prompt and response hashes, snapshot refs, `query_text`) is stripped server-side by the broker — the lane is metadata-only by contract, and the broker test pins the column allow-list. RLS coverage % is hardcoded at 100 with a `(RLS % estimated)` annotation in the header until a real `pg_policies` probe lands in Wave 3; the broker's `evidence` flag stays `'estimated'` regardless of query success, so the Trust strip Isolation chip reads honestly muted in the UI rather than fake-green.

The unified audit ribbon now mixes in `source: 'auth'` events from the top 5 isolation anomalies (severity desc, then ts desc). The ribbon continues to surface substrate, approval, connector, and (when wired) invite events in one strictly-temporal feed capped at 50.

## Layer Impact

- `runtime-app-lane`: New `isolation-posture-broker.ts` under `src/lib/admin/broker/**`; trust-spine-broker now composes isolation posture into the `isolation` dimension and emits up to 5 `auth` events from the top anomalies onto the audit ribbon. New `IsolationLane` component renders the lane content. New `SetupAuditTabs` component renders the Snowflake-style sub-nav strip on `/admin/audit`. The audit page accepts `?tab=isolation|activity|approvals`, switches content between IsolationLane and SetupAuditPage, and preserves the PR-6 `?source=` filter (Approvals tab implicitly maps to `source=approval`).
- `qa-validation-lane`: 10 isolation-posture-broker unit tests (new file), 4 new trust-spine-broker tests (live isolation rollups, fallback, top-anomaly, auth ribbon), 7 IsolationLane render tests (empty / populated / top-anomaly / PII safety / intended→resolved mismatch / header strip), 2 SetupAuditTabs render tests + 2 isSetupAuditTab guard tests, 2 new TrustStrip tests pinning the isolation-chip lane href. 27 net new tests.
- `architecture-lane`: No new direct Supabase reads. The broker queries `ai_egress_audit` via the canonical `azureRead` adapter (allowed under `src/lib/admin/broker/**`); broker-boundary hygiene test still passes.
- `data-plane-lane`: No schema change. The `ai_egress_audit` table is provisioned by `supabase/migrations/20260522170000_ai_egress_control_plane.sql` and patched by `…_ai_egress_audit_user_id_text.sql`. Intended/resolved tenant keys are read from `request_metadata` when callers stamp them.

## Client Applicability

- All clients: Every tenant's `/admin/audit?tab=isolation` lane and Isolation chip read live anomaly counts from `ai_egress_audit`. Both behaviors degrade gracefully when the upstream query fails or the client row cannot be resolved.
- Specific clients: None.
- Internal only: No. This is a tenant-admin surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/broker/isolation-posture-broker.ts` (new) — canonical broker contract `getIsolationPosture(tenantKey)`; maps `ai_egress_audit` rows to a metadata-only event shape; anomaly detection (deny / error / error_message / metadata-stamped tenant mismatch); severity mapping (error→high, deny→med, restricted+allow→med, redact_required→low, else low); top-anomaly picker (severity desc, ts desc); 24h window. RLS coverage hardcoded with `evidence: 'estimated'`. Payload-fingerprint columns are explicitly excluded from the column allow-list.
- `src/lib/admin/broker/trust-spine-broker.ts` (modified) — imports `getIsolationPosture`; replaces the estimated stub in `composeIsolation` with a real composer that passes the broker's rollups through; adds `isolationAuthAuditEvents` (top-5 anomalies as `source: 'auth'` ribbon events); fan-out of `Promise.allSettled` extended to four upstream brokers; graceful fallback with structured `console.warn` (`trust_spine.isolation_posture.degraded`).
- `src/lib/admin/broker/__tests__/isolation-posture-broker.test.ts` (new) — 10 unit tests covering empty tenant, empty window, anomaly detection, severity mapping, top-anomaly selection, query error fallback, tenant-resolve error fallback, PII column exclusion, metadata-stamped tenants, and 50-row cap.
- `src/lib/admin/broker/__tests__/trust-spine-broker.test.ts` (modified) — mocks `getIsolationPosture`; adds 4 tests (live rollups, fallback on throw, top-anomaly pass-through, auth ribbon emission with severity-rank cap at 5).
- `src/components/admin/IsolationLane.tsx` (new) — server component lane: header metric strip (RLS coverage %, resolution events 24h, anomalies 24h, refreshed), conditional top-anomaly callout with red-dot severity badge and "View event" anchor jump, events table (time / tenant + workflow / user / intended→resolved / severity + policy decision + data class / reason), muted empty state. Locked palette via `SHELL.*` tokens. Pure render — no `Date.now()` calls; the page composer passes the request-time stamp.
- `src/components/admin/SetupAuditTabs.tsx` (new) — three-tab Snowflake-style sub-nav (Activity / Isolation / Approvals); URL-searchParam driven; `isSetupAuditTab` type guard.
- `src/app/(maestro)/admin/audit/page.tsx` (modified) — accepts `?tab=…` and `?source=…`; renders `SetupAuditTabs` above the content; conditionally loads `getIsolationPosture` only on the isolation tab; Approvals tab implicitly applies the PR-6 `source=approval` filter when no explicit `?source=` is set.
- `src/components/admin/TrustStrip.tsx` (modified) — isolation chip href updated to `/admin/audit?tab=isolation` (live and empty-state variants).
- `src/components/admin/__tests__/IsolationLane.test.tsx` (new) — 7 render tests.
- `src/components/admin/__tests__/SetupAuditTabs.test.tsx` (new) — 4 tests.
- `src/components/admin/__tests__/TrustStrip.test.tsx` (modified) — 2 new tests pinning the lane-tab href on populated + empty-state chips.
- `docs/releases/records/2026-05-30-setup-isolation-lane.md` (new) — this record.

## QA

- `npx eslint src/lib/admin/broker src/components/admin/IsolationLane.tsx src/components/admin/SetupAuditTabs.tsx src/components/admin/TrustStrip.tsx 'src/app/(maestro)/admin/audit'`
- `npx tsc --noEmit`
- `npx jest src/lib/admin/broker/__tests__ src/components/admin/__tests__`
- `npx jest src/lib/admin/__tests__/broker-boundary.test.ts`
- `npm run test:behaviors` — pre-existing 5 failures in `tenant-onboarding.test.ts` are NOT part of this PR.

## Rollout

- Merge to main.
- Vercel auto-deploys preview → production. No env vars added or removed. No schema migration.

## Rollback

- `git revert` the squash-merge commit. Trust strip Isolation chip reverts to the Wave 1 estimated stub; the `?tab=isolation` URL 404s (acceptable rollback posture). No data to undo.

## Audit Evidence

- `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §4 (Persona C — incident-response admin: "Cross-tenant leak scenario… admin cannot triage from /admin").
- `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.2 job #2 ("Make tenant isolation auditable… success criterion: an admin can answer 'did anything cross tenants in the last 24 hours' without leaving Setup").
- `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.4 (Data Trust backbone — isolation is one of the four trust dimensions on the strip).
- `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §7 Wave 2 PR-2 ("Isolation lane. New /admin/audit?tab=isolation view. Reads ai_egress_audit and tenant-resolution logs. Surfaces anomaly count on the Trust strip chip. This is the answer to STRESS-P0-006-class incidents.").
- Task reference: STRESS-P0-006 (cross-tenant retrieval leak triage).
- Honesty / broker-boundary memory: `feedback_no_demo_thinking.md`, `feedback_broker_boundary.md`.
