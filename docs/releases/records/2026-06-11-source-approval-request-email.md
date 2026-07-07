# 2026-06-11-source-approval-request-email — Source approval-request email notification

## Release ID

`2026-06-11-source-approval-request-email`

## Status

`candidate`

## Plain-English Summary

A Source approver can now be notified by email that a sourcing event is waiting
for their approval, so an approval can be exercised end-to-end by email during
pilot testing. The email is sent from `support@abarva.ai` and, unless a real
approver email is supplied, goes to a default inbox `admin@abarva.ai`
(overridable via the `SOURCE_APPROVAL_NOTIFY_TO` environment variable). The
email states which event and stage gate is waiting, the tenant, who requested
it, and includes a prominent link to the review/approval surface.

Delivery uses the existing pilot-safe email channel. When a Resend API key is
configured the email is sent for real; when it is not, the channel logs a
structured record and returns a synthetic id so the workflow still completes —
useful for testing without a live mail provider. The response distinguishes the
two cases (`email_sent` vs `logged_fallback`), and reports `error` if the
channel fails.

The notification is triggered explicitly — via a new API route and an "Email
approver" button added to the Source stage-gate decision panel. It is NOT yet
auto-fired when a gate changes state.

## Layer Impact

- `global-control-lane`: shared app/control-plane behavior. Adds a new helper
  (`src/lib/source/notifications/approval-request.ts`), a new POST route
  (`/api/v1/source/events/[eventId]/request-approval`), and a UI button on the
  existing `GateDecisionPanel`. No schema, RLS, seed, ingestion, or
  data-plane changes. No new runtime dependencies — it reuses the existing
  `src/lib/email/send.ts` channel.

## Client Applicability

- All clients: Yes — any tenant whose user opens the Source stage-gate panel can
  trigger an approval-request email. The route is tenancy-scoped
  (`requireTenancy`); the email content only contains values passed in by the
  caller (event name, stage label, tenant key, requester id) — no client data
  is fetched or invented.
- Specific clients: n/a
- Internal only: No
- Public/demo only: No
- Feature flag: None

## Changes Included

- `src/lib/source/notifications/approval-request.ts` (new) — `sendApprovalRequestEmail`
  helper: recipient resolution (approverEmail → `SOURCE_APPROVAL_NOTIFY_TO` →
  `admin@abarva.ai`), AbarVa-styled HTML + plain-text bodies, sender fixed to
  `support@abarva.ai`, channel mapping over the `sendEmail` result.
- `src/app/api/v1/source/events/[eventId]/request-approval/route.ts` (new) — POST
  route, `nodejs` runtime, `force-dynamic`, tenancy-guarded, builds the review
  URL, returns `{ ok, channel, to, id, error }` with 200 on delivery / 502 on
  channel error.
- `src/components/source/GateDecisionPanel.tsx` (modified) — adds an "Email
  approver" secondary button next to "Record decision" that POSTs to the new
  route with the current stage and shows the returned channel.
- `src/lib/source/notifications/__tests__/approval-request.test.ts` (new) — jest
  unit tests (8 cases) over sender, recipient resolution, subject, and channel
  mapping.
- `docs/releases/records/2026-06-11-source-approval-request-email.md` (this record).

## QA / Validation

- `npx jest src/lib/source/notifications/__tests__/approval-request.test.ts` →
  8/8 passing. Asserts: from = `support@abarva.ai`; recipient defaults to
  `admin@abarva.ai`; `SOURCE_APPROVAL_NOTIFY_TO` override; `approverEmail` wins;
  subject contains event name + stage label; `console-*` id →
  `logged_fallback` (delivered true); real id → `email_sent`; `ok:false` →
  `error` (delivered false).
- `npm run audit:architecture-rules` → 0 violations. No Supabase/Neo4j/Pinecone/
  Vercel/OpenAI runtime imports were added; the only side-effecting dependency
  is the existing `@/lib/email/send` channel.
- `node scripts/release-check.mjs --base origin/main --head HEAD` → Release
  Control Gate passed (this record).
- HONEST note: real email delivery was NOT exercised in CI/local — without
  `RESEND_API_KEY` the channel logs instead of sending (the pilot-safe
  fallback). End-to-end real delivery requires the secret to be set on the
  container app.

## Rollout Plan

Squash-merge to `main` → Azure Container Apps web image build + revision roll.
No migration. To enable REAL email delivery (rather than the logged fallback),
additionally set `RESEND_API_KEY` (and optionally `RESEND_FROM_EMAIL` and
`SOURCE_APPROVAL_NOTIFY_TO`) as container-app secrets/env. With no key, the
feature is safe and functional in logged-fallback mode.

## Rollback Plan

Revert the squash commit and roll the previous web image. No data or schema
changes to unwind. Removing/blanking `RESEND_API_KEY` reverts to logged-only
behavior without a code change.

## Audit Evidence

- PR URL: (added on PR creation)
- CI run: Architecture Rules + Release Control Gate on the PR
- Local evidence: jest output (8/8), `audit:architecture-rules` 0 violations,
  `release-check` passed
- Email lineage: each send carries metadata headers
  `X-Abarva-eventId` and `X-Abarva-kind: source_approval_request` (via the
  existing channel's metadata mapping), and the dev fallback logs a structured
  `[email:dev-fallback]` record.

## Known Gaps

- No auto-fire: an approval-request email is NOT automatically sent on gate
  state changes — it is triggered explicitly via the route / "Email approver"
  button. Auto-firing on gate transitions is a deliberate next step.
- Logged-fallback by default: without `RESEND_API_KEY` configured on the
  container app, the email is logged, not delivered. Real delivery is unproven
  until that secret is set and a live send is observed.
- Default recipient: with no approver email and no `SOURCE_APPROVAL_NOTIFY_TO`,
  notifications go to `admin@abarva.ai` rather than a per-event approver. Wiring
  a real approver address from event/role data is future work.
