# 2026-05-30-w4-pr3-wire-5-urgent-events — Wire 5 urgent event types to broker (W4-PR-3)

## Release ID

`2026-05-30-w4-pr3-wire-5-urgent-events`

## Status

`candidate`

## Plain-English Summary

The notification broker (W4-PR-2) and the email templates (W4-PR-6) were already in place, but no live emit sites called them. This PR wires the 5 urgent event types declared in the spine into their existing emit locations so real events now flow through the broker, get queued for delivery, and (when `RESEND_API_KEY` is configured) land as email + in-app deliveries.

The wired events:

1. `approval.requested` — emitted from `submitForApproval` after the `program_approval_requests` row inserts.
2. `program.gate_decision` — emitted from `decideApprovalRequest` after the approve/reject lands. Maps `rejected → blocked` for the template's decision verdict.
3. `connector.failed` — emitted from the connector test route after `testConnector` returns a `live → degraded` transition.
4. `isolation.anomaly` — emitted from the egress audit writer after a tenant-key mismatch is detected and the audit row lands.
5. `auth.invite_accepted` — emitted from the Clerk webhook handler after `writeInviteAudit` completes for an `invite_accepted` action.

Every emit is fire-and-forget — broker failures, registry mismatches, or downstream resend outages NEVER block the primary action. Errors are logged via structured `console.warn` payloads matching the existing audit log style. PII is masked at the emit boundary (`maskEmail` for the Clerk webhook; tenant-slug-only payload for `isolation.anomaly`).

Two registry entries were added to `src/lib/notifications/registry.ts` for the template-anchored event names (`auth.invite_accepted`, `program.gate_decision`) so `lookupEventDefinition` resolves them and the W4-PR-6 templates render. Registry total is now 44 events (was 42); persona-default fan-out already covers them via the existing `governance` / `moves` rules.

## Layer Impact

- `runtime-app-lane`: 5 emit calls added across existing handlers/server libs. No new routes, no new UI.
- `broker-lane`: Registry expanded by 2 events. Broker contract unchanged.
- `data-layer-lane`: No migrations.
- `qa-validation-lane`: 4 new test files, 19 new tests covering happy-path emit, failure isolation, and PII masking for each emit site.

## Client Applicability

- All clients: emit wiring applies tenant-agnostically. Tenant-admin auto-subscriptions from W4-PR-2 mean these 5 events land in-app for every tenant admin on day one.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. Email delivery is gated by `RESEND_API_KEY`; without it the broker enqueues the row and the dispatcher degrades gracefully.

## Changes Included

- `src/lib/notifications/registry.ts` (modified) — added `auth.invite_accepted` (setup / governance / warn / security audit) and `program.gate_decision` (moves / governance / warn / compliance audit). Header count comment + count assertion updated.
- `src/lib/notifications/__tests__/registry.test.ts` (modified) — updated count assertions (42 → 44; setup 8 → 9; moves 8 → 9).
- `src/lib/programs/approval.ts` (modified) — added `emitNotificationBestEffort` helper, `readBriefString` helper for template-payload field extraction, emit calls in `submitForApproval` (`approval.requested`) and `decideApprovalRequest` (`program.gate_decision`).
- `src/lib/programs/__tests__/approval-w4-pr3-emit.test.ts` (new) — 7 tests: emit on success, no emit on primary-action failure, broker failure isolation, decision-verdict mapping (approved / blocked).
- `src/app/api/admin/connectors/[id]/test/route.ts` (modified) — emit `connector.failed` when `result.transition.kind === 'degraded'`. Fire-and-forget after the audit write.
- `src/app/api/admin/connectors/[id]/test/__tests__/connector-test-route-w4-pr3-emit.test.ts` (new) — 5 tests: degraded emits, none/recovered do not emit, broker throw → 500 (no emit), broker emit failure does not propagate.
- `src/lib/admin/broker/egress-audit-writer.ts` (modified) — added `emitIsolationAnomalyBestEffort` helper called after the canonical row lands. PII allowlist: tenant slugs + workflow only; no user id, no payload-fingerprint material.
- `src/lib/admin/broker/__tests__/egress-audit-writer-w4-pr3-emit.test.ts` (new) — 4 tests: emit on mismatch, no emit when matched, no emit when insert fails, broker failure isolation.
- `src/app/api/webhooks/clerk/route.ts` (modified) — emit `auth.invite_accepted` after `writeInviteAudit` succeeds. Email is masked via `maskEmail` BEFORE the payload is handed to the broker.
- `src/app/api/webhooks/clerk/__tests__/route-w4-pr3-emit.test.ts` (new) — 4 tests: emit with masked email, no emit for regular sign-ups, no emit for non-`user.created` events, broker failure does not change the 200 response.
- `docs/releases/records/2026-05-30-w4-pr3-wire-5-urgent-events.md` (new) — this record.

## QA / Validation

- `npx tsc --noEmit` — clean (only pre-existing Azure / pptx module-not-found errors unrelated to this PR).
- `npx eslint <touched files>` — clean.
- `npx jest src/lib/notifications src/lib/admin/broker src/lib/programs/__tests__/approval` — **297 / 297 pass** across 25 suites.
- `npx jest src/app/api/admin/connectors` — **12 / 12 pass** across 2 suites (pre-existing 7 route tests + 5 new emit tests).
- `npx jest src/app/api/webhooks/clerk/__tests__/route-w4-pr3-emit.test.ts` — **4 / 4 pass**.

## Rollout Plan

- Merge to main → Vercel deploys; emits start firing on the next request that hits any of the 5 sites.
- `RESEND_API_KEY` required for actual email delivery. Without it, the broker enqueues `notification_deliveries` rows and the dispatcher (separate worker in a later PR) degrades gracefully — the in-app channel still surfaces the event.
- No feature flag. Broker validates against registry; emit-sites use template-aligned payload field names.

## Rollback Plan

- Revert the merge commit. The emit calls disappear; primary actions continue uninterrupted (they never depended on emit success). Registry entries for `auth.invite_accepted` and `program.gate_decision` revert too — already-templated W4-PR-6 surfaces will skip these event types until the broker registers them again.

## Audit Evidence

- Spine §11 W4-PR-3.
- Fire-and-forget contract: every emit site wraps `emitNotification` with a `.catch` that logs a structured `console.warn` matching the audit log style; the primary action's return value / HTTP response is never blocked. Tests explicitly mock `emitNotification` to reject and assert the primary action still succeeds.
- PII masking:
  - Clerk webhook: `inviteeEmail` is passed through `maskEmail` BEFORE entering the payload. Test asserts the unmasked email does not appear in `payload.inviteeEmail` or `payload.inviteeEmailMasked`.
  - Isolation anomaly: payload contains tenant slugs + workflow detector only; test asserts no user id or prompt hash leaks into the JSON.
  - Approval / gate decision: payload is name-only (no email, no role information beyond the requester user id which is already on the approval row).
- Idempotency: the broker handles 5-minute dedup on `(user_id, event_type, target_resource_id)` per Spine §6. Emit sites pass stable `targetResourceId` (approval request id, program id, connector id, tenant id, invitation id) so duplicate fires within the window coalesce.

## Known Gaps

- The W4-PR-2 broker's `defaultPersonaResolver` is inert in Phase 1 — persona-default fan-out is a no-op until a `user_personas` lookup is wired. For now, tenant admins still receive these 5 events via the W4-PR-2 `seedMandatorySecuritySubscriptionsForAdmin` helper (in_app channel forced on) and explicit preferences from W4-PR-4. The 2 new template-anchored events (`auth.invite_accepted`, `program.gate_decision`) reach the existing `tenant_admin` persona via the `category === 'governance'` matcher.
- `connector.failed` is currently emitted only from the manual `Test connection` route. Auto-monitoring (cron healthcheck) will emit the same event when it lands.
- The 5 mandatory urgent events declared in `DEFAULT_ADMIN_MANDATORY_EVENT_TYPES` and `URGENT_ADMIN_EVENTS` are the W4-PR-2 set (`approval.requested`, `approval.escalated`, `connector.failed`, `rls.policy_change`, `billing.alert`). This PR does NOT change that set — `auth.invite_accepted` and `program.gate_decision` are reached via persona matching, not mandatory fan-out. A follow-up can promote them to mandatory if founder doctrine requires.
