# 2026-05-30-pre-w4-pr1-invite-wired — Wire Send Invitation to Clerk + admin_audit_log (PRE-W4-PR-1)

## Release ID

`2026-05-30-pre-w4-pr1-invite-wired`

## Status

`candidate`

## Plain-English Summary

Clicking "Send invitation" in the Invite Collaborator dialog used to do nothing real — `handleSend` flipped a local `sent` flag, no Clerk call, no email, no audit row. As of this PR the button calls a Next 16 server action that (1) issues a real Clerk invitation so the recipient gets an email with a sign-up link, and (2) writes one `admin_audit_log` row with the masked recipient email + Clerk invitation id. The dialog shows a Sending… state while the call is in flight, surfaces the Clerk invitation id on success (audit-traceable), and renders an inline error banner on failure (already-a-member, invalid email, rate-limited, etc.) without closing the dialog.

The audit row is the source-of-truth for the `auth.invite_sent` event that the Wave 4 comms surface will read. A new `/api/webhooks/clerk` handler covers the matching `auth.invite_accepted` event — when a recipient finishes Clerk sign-up, the webhook writes a second audit row carrying the same `invitation_id` so the Wave 4 timeline can group "sent → accepted" pairs.

This is a PRE-Wave-4 plumbing PR — required before the comms surface can render anything real. Without it, the comms timeline would have no live emission source for invitation events.

## Layer Impact

- `runtime-app-lane`: New server action `src/app/(maestro)/admin/users-access/_actions/send-invite.ts`. New webhook route `src/app/api/webhooks/clerk/route.ts`. `InviteCollaboratorDialog` calls the action with loading / success / error state. `InviteCollaboratorLauncher` accepts and threads a new `tenantKey` prop so the audit row resolves to the correct `clients.id` even mid-tenant-switch.
- `architecture-lane`: No new broker. The server action calls the `clerkClient.invitations.createInvitation` API and routes the audit write through the new `src/lib/admin/invite-collaborator-audit.ts` module, which mirrors the established pattern in `src/lib/admin/tenant-switch-audit.ts` (uses `azureRead` for the `clients.id` lookup and `getAzureWriteFluentClient` for the `admin_audit_log` insert — the sanctioned data-plane seams that already power the tenant-switch audit). The dialog dynamic-imports the server action so the Jest CJS VM never has to parse `@clerk/nextjs/server` (pure ESM); test injection (`sendInviteImpl` prop) is the production-safe path for unit tests.
- `governance-lane`: Every successful Clerk invitation lands one row in `admin_audit_log` (`category='auth'`, `action='invite_sent'`, `target_kind='invitation'`). Every accepted invitation (via the Clerk webhook) lands a second row (`action='invite_accepted'`). PII is masked at write time — only `first-char + domain` of the recipient email is persisted; the raw address lives in Clerk, which is the source of truth. The `invitation_id` is the join key between the two rows and back to Clerk.
- `qa-validation-lane`: 3 new test suites · 27 new tests. Server-action unit tests (12), audit-writer unit tests (13), dialog send-wiring smoke tests (2). Broker-boundary guard still passes. Runtime-supabase-imports guard still passes.
- `data-plane-lane`: No schema change. `admin_audit_log` already exists (`20260426120500_admin_audit_log.sql`). The audit write is fixture-mode safe — in `ADMIN_DATA_MODE=fixture` (default in test + local) the row is skipped and the structured-log channel carries the signal.

## Client Applicability

- All clients: applies to every tenant. The action validates the active tenancy via `requireTenancy()` and resolves to `clients.id` through the alias table.
- Specific clients: none.
- Internal only: no — every workspace admin uses this path.
- Public/demo only: no.
- Feature flag: none. Live Clerk invitations require `CLERK_SECRET_KEY` (already set in prod); the webhook requires `CLERK_WEBHOOK_SIGNING_SECRET` (must be set before the Clerk dashboard webhook subscription is enabled, otherwise the route returns 503).

## Changes Included

- `src/lib/admin/invite-collaborator-audit.ts` (new) — audit writer + PII masking helper. Resolves canonical tenant key → `clients.id`, INSERTs into `admin_audit_log` via the data-plane write client, masks emails as `first-char + domain`, never throws into the caller.
- `src/lib/admin/invite-rate-limit.ts` (new) — in-memory sliding-window limiter at 10 invites / 60 s per actor. Documented TODO to migrate to a Redis / table-backed store in W5+.
- `src/app/(maestro)/admin/users-access/_actions/send-invite.ts` (new) — Next 16 server action. Auth check + admin role check + active-tenancy check + email/role validation + rate limit + Clerk `invitations.createInvitation` + fire-and-forget audit write. Returns a discriminated-union `{ ok: true | false, ... }` result so the dialog can render typed errors.
- `src/app/api/webhooks/clerk/route.ts` (new) — Clerk webhook receiver. Verifies `svix-*` signature headers against `CLERK_WEBHOOK_SIGNING_SECRET`, handles `user.created` events whose `public_metadata` carries an `invitation_id`, writes the `invite_accepted` audit row. 503 when the signing secret is unset, 400 on signature failure, 200 on success and on unrecognized event types.
- `src/components/setup/InviteCollaboratorDialog.tsx` (modified) — `handleSend` now `await`s the server action; new `tenantKey` + `sendInviteImpl` props; new `sending` / `error` / `invitationId` local state; loading-state button copy; inline error banner; success card surfaces the Clerk invitation id as audit reference. Server action is dynamic-imported on click so the Jest CJS VM never has to parse Clerk's ESM at module-load.
- `src/components/admin/InviteCollaboratorLauncher.tsx` (modified) — accepts and threads a new optional `tenantKey` prop through to the dialog.
- `src/app/(maestro)/admin/users-access/page.tsx` (modified) — passes `tenant.tenantSlug` into `InviteCollaboratorLauncher`.
- `src/app/(maestro)/admin/users-access/_actions/__tests__/send-invite.test.ts` (new) — 12 tests covering unauthenticated, forbidden, no-active-tenant, invalid-email (×5), invalid-role, happy path (Clerk call + audit args + email normalization + masking), already-member mapping, 429 mapping, in-process rate limit at the 10th call.
- `src/lib/admin/__tests__/invite-collaborator-audit.test.ts` (new) — 13 tests covering email-masking edge cases (×7), fixture-mode skip, unresolved client_id, the masked-email-in-summary path, raw-email-never-persisted assertion, `invite_accepted` variant, error-without-throw, programs-array filtering.
- `src/components/setup/__tests__/InviteCollaboratorDialog.send.test.tsx` (new) — 2 jsdom tests covering the loading → success card transition (with audit-ref) and the failure-stays-open path with the inline error banner.
- `docs/releases/records/2026-05-30-pre-w4-pr1-invite-wired.md` (new) — this record.

## QA / Validation

- PASS: `npx jest src/lib/admin/__tests__/invite-collaborator-audit.test.ts` — 13/13.
- PASS: `npx jest send-invite.test` — 12/12.
- PASS: `npx jest InviteCollaboratorDialog.send` — 2/2.
- PASS: `npx jest invite-collaborator-audit send-invite InviteCollaboratorDialog.send broker-boundary` — 29/29 across 4 suites.
- PASS: `npx tsc --noEmit` — clean.
- PASS: `npx eslint` over every touched file — clean.
- PASS: `npm run audit:runtime-supabase-imports:guard` — clean (1 file / 1 import-helper match, within allowlist).
- Pre-existing-failure note: `src/lib/admin/__tests__/users-access-sso.test.ts` has one failure on this branch — that same failure (3 failures, actually) exists on the un-patched `main` baseline and is unrelated to this PR.

## Rollout Plan

Merge to main after CI passes. No migration. No feature flag. The change is additive — the dialog's send path is the only consumer of the new server action, and the webhook route is gated on `CLERK_WEBHOOK_SIGNING_SECRET` (unset → 503, no audit rows). The Vercel deploy is the rollout.

For the webhook to fire, an ops follow-up must:

1. Set `CLERK_WEBHOOK_SIGNING_SECRET` on the prod Vercel project.
2. Add a webhook subscription in the Clerk dashboard pointed at `https://<prod-host>/api/webhooks/clerk` for the `user.created` event.

Until those two steps land, the `invite_sent` row still writes (the server action is independent), and the `invite_accepted` row simply won't materialize — Wave 4 can ship the timeline UI with `invite_sent` only and the accepted column will populate once the webhook is wired.

## Rollback Plan

Revert the PR. The masthead / launcher / dialog are additive (the new props default to safe values). The new server action has a single caller (the dialog) and the webhook route has no callers other than Clerk's outbound delivery — removing the files drops the affordance back to the placeholder `setSent(true)` behavior. No audit rows or Clerk invitations issued before rollback are removed by the rollback itself; they persist as historic state.

## Audit Evidence

- Mission spec: `docs/build/PERSONA_A_TENANT_ADMIN_DAY1_2026-05-30.md` §4.4 + §9 fix #4 (referenced in PR brief — file is not present on this branch but is the spec the PR brief sources from).
- Audit trail: every successful Clerk invitation writes one row to `admin_audit_log` with `category='auth'`, `action='invite_sent'`, `metadata.invitation_id`, `metadata.invitee_email_masked`. Every accepted invitation writes a matching row with `action='invite_accepted'` and the same `invitation_id`.
- PII-masking proof: `src/lib/admin/__tests__/invite-collaborator-audit.test.ts` asserts that the raw recipient email is NOWHERE in the serialized `admin_audit_log` payload — only the masked form.
- Authority proof: `src/app/(maestro)/admin/users-access/_actions/__tests__/send-invite.test.ts` covers the unauthenticated / non-admin / no-tenancy paths; only `role === 'admin'` or `role === 'maestro'` on Clerk `publicMetadata` is permitted.
- Rate-limit proof: same suite covers the 11th call in a window being rejected with `rate_limited` and Clerk being called zero times in that case.

## Known Gaps

- The rate limit is per-process and in-memory. Behind a multi-instance deploy the effective ceiling is `10 × N` instances per actor per 60 s. Clerk's upstream rate limit catches the global case (mapped to `code: rate_limited` in the action's return). Tracked as TODO in `src/lib/admin/invite-rate-limit.ts`.
- The audit row writes only when `ADMIN_DATA_MODE=live`. Local / fixture deploys skip the write and rely on the structured-log channel — `pilot` and `production` Vercel envs must run with `ADMIN_DATA_MODE=live` for the rows to land.
- The webhook handler covers `user.created` only. Other Clerk events (e.g. `invitation.revoked`, `organizationInvitation.accepted` if Clerk Organizations are later enabled) are acknowledged with 200 + ignored and would need separate handlers. Documented in the route's header comment.
- The dialog still does not pass `programs` from a UI control — the role + surface grid is the access posture today. When per-program provisioning lands, the `programs` field is already plumbed through the action and audit row.
