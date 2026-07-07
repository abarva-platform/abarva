# 2026-06-11-source-approval-from-verified-subdomain — send approval emails from the verified send.abarva.ai sender

## Release ID

`2026-06-11-source-approval-from-verified-subdomain`

## Status

`candidate`

## Plain-English Summary

The approval-request email (PR #3406) was hardcoded to send from `support@abarva.ai`.
The root domain `abarva.ai` keeps its Google MX and is intentionally NOT verified in
Resend; only the subdomain `send.abarva.ai` is verified (DKIM, SPF, DMARC, MAIL FROM MX
all confirmed at the authoritative DNS). Resend rejects sends whose from-domain is not a
verified domain, so the hardcoded sender would have bounced the moment a real API key was
configured. This change makes the sender default to the verified `support@send.abarva.ai`
and adds an env override (`SOURCE_APPROVAL_FROM_EMAIL`) for future verified addresses.
Recipient handling is unchanged (defaults to `admin@abarva.ai`; a recipient domain does
not need Resend verification).

## Layer Impact

- `global-control-lane`: the Source approval-notification sender address. No schema, no
  data migration — a constant + env resolver and a test update.

## Client Applicability

- All clients: yes — any tenant that triggers an approval-request email.
- Feature flag: none

## Changes Included

- PR (branch `fix-source-approval-from-subdomain`)
- `src/lib/source/notifications/approval-request.ts` — replace the hardcoded
  `support@abarva.ai` with `resolveApprovalFrom()` → `SOURCE_APPROVAL_FROM_EMAIL` or the
  default `support@send.abarva.ai`.
- `src/lib/source/notifications/__tests__/approval-request.test.ts` — assert the verified
  default and the env override.

## QA / Validation

- Unit suite green (9/9), including the new default-sender and override cases.
- DNS confirmed by the domain owner: `send.abarva.ai` verified in Resend (DKIM/SPF/DMARC +
  MAIL FROM MX present at Namecheap authoritative DNS); root `abarva.ai` Google MX left intact.
- Live behavior before this change verified on rc-46b0c3151: the route returns 200 with
  `channel: logged_fallback` and the logged envelope showed the (then-incorrect) sender.

## Rollout Plan

Squash-merge to main, then Azure control-lane web image roll. Real delivery additionally
requires, at the container app: secret `RESEND_API_KEY` bound to env `RESEND_API_KEY`, and
optionally `SOURCE_APPROVAL_FROM_EMAIL` (defaults to the verified `support@send.abarva.ai`)
and `SOURCE_APPROVAL_NOTIFY_TO` (defaults to `admin@abarva.ai`). Until the key is set the
channel stays in pilot-safe logged-fallback mode.

## Rollback Plan

Revert the squash commit and roll the previous web image. No data cleanup.

## Audit Evidence

- PR URL + CI run.
- Post-config proof: a real send returning a Resend id (not `console-…`) and delivery to
  `admin@abarva.ai`, captured once the API key is configured.

## Context Ingestion Evidence

Not applicable — no ingestion, parsing, embedding, or retrieval path changed.

## Known Gaps

- No approval email is auto-fired on gate state changes yet; it is triggered explicitly via
  the request-approval route / "Email approver" button (carried over from #3406).
- Real delivery is gated on the `RESEND_API_KEY` secret being set on the container app
  (owner action — a credential).
