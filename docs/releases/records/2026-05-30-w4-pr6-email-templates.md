# 2026-05-30 Enterprise Comms Spine · Email templates for the 5 urgent events (W4-PR-6)

## Release ID

`2026-05-30-w4-pr6-email-templates`

## Status

`candidate`

## Plain-English Summary

Five branded email templates — one per urgent Wave 4 event — that the
Notifications broker will render whenever it needs to email a tenant
admin or program owner. Each template exports a `subject(payload,
tenant)`, `html(payload, tenant)`, `text(payload, tenant)` triple that
the dispatcher resolves through a small registry. The templates carry
the locked AbarVa design language (cream paper, Georgia + DM Sans,
ink and accent palette), are inline-styled for email-client safety,
and include every CAN-SPAM compliance element — physical address,
"why am I receiving this", and an unsubscribe link to the preferences
page.

The 5 events templated in this PR:

- `approval.requested` — CXO sign-off needed on a program / connector.
- `connector.failed` — Source connector stopped pulling data.
- `isolation.anomaly` — cross-tenant resolver mismatch.
- `auth.invite_accepted` — invited teammate completed sign-up.
- `program.gate_decision` — Maestro / governance gate verdict.

Templates land disconnected from the dispatcher in this PR — the
existing `email.ts` builder still wins until a follow-up PR wires the
registry into `dispatchNotificationEmailTasks`. That keeps the diff
narrow and lets us snapshot-lock the visual contract before swapping
the renderer over.

## Layer Impact

- **Runtime-app-lane:** New `src/lib/notifications/templates/` directory
  with shared chrome (`_shared/EmailShell.tsx`, `_shared/colors.ts`,
  `_shared/utils.ts`), the 5 templates, and a registry
  (`templates/index.ts`).
- **QA-validation lane:** New jest suite at
  `src/lib/notifications/templates/__tests__/template-shape.test.ts`
  with 40 assertions + 5 snapshot fixtures captured under
  `__snapshots__/template-shape.test.ts.snap`.
- **Broker boundary:** Untouched. Templates are pure functions; no
  Supabase, no fetch, no I/O. The Wave 4 broker (W4-PR-2) will consume
  the registry in a follow-up wiring PR.
- **Email pipeline:** Existing `src/lib/notifications/email.ts` and
  `dispatch.ts` are not modified — backwards-compatible. The new
  registry is additive and ready for the wiring PR.

## Client Applicability

- All clients: Yes — templates are tenant-agnostic; the `TenantBrand`
  record drives the masthead at render time.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None. The renderer is not wired yet, so there is no
  behaviour change.

## Changes Included

- `src/lib/notifications/templates/_shared/EmailShell.tsx` — shared
  chrome (masthead, footer, CTA, headline, paragraph, meta block,
  text-mode footer).
- `src/lib/notifications/templates/_shared/colors.ts` — locked palette
  + font tokens.
- `src/lib/notifications/templates/_shared/utils.ts` — `escapeHtml`,
  `formatTs`, `maskEmail`, `truncate`, `tenantHeader`, and the
  `TenantBrand` type.
- `src/lib/notifications/templates/approval-requested.tsx` — template
  for `approval.requested`.
- `src/lib/notifications/templates/connector-failed.tsx` — template
  for `connector.failed`.
- `src/lib/notifications/templates/isolation-anomaly.tsx` — template
  for `isolation.anomaly`.
- `src/lib/notifications/templates/auth-invite-accepted.tsx` —
  template for `auth.invite_accepted` (invitee email masked).
- `src/lib/notifications/templates/program-gate-decision.tsx` —
  template for `program.gate_decision`.
- `src/lib/notifications/templates/index.ts` — registry +
  `getTemplate` / `requireTemplate` / `isTemplatedEventType` helpers
  + `TEMPLATED_EVENT_TYPES` constant.
- `src/lib/notifications/templates/__tests__/template-shape.test.ts`
  — 40 assertions across registry behaviour, shape, CAN-SPAM elements,
  inline-style enforcement (no `<style>` blocks), PII masking, and
  snapshots.
- `src/lib/notifications/templates/__tests__/__snapshots__/template-shape.test.ts.snap`
  — captured baseline output for the 5 representative payloads.
- `docs/releases/records/2026-05-30-w4-pr6-email-templates.md` — this
  file.

## QA / Validation

- `npx jest src/lib/notifications/templates/__tests__` — 40 / 40 pass.
- `npx eslint src/lib/notifications/templates/` — clean.
- `npx tsc --noEmit` — clean for new code. Pre-existing
  fresh-worktree noise from Azure / pptxgenjs SDKs not installed
  locally is unrelated to this PR (per `feedback_typecheck_workflow_artifact`).
- Snapshot diff inspection: 5 snapshots captured — `subject` + `text`
  + `html` per event — regression detection for the visual contract.
- CAN-SPAM checklist enforced in test: physical address present in
  every footer, unsubscribe / preferences link present, AbarVa sender
  identification present, no `<style>` blocks anywhere.

## Rollout Plan

1. Merge to `main`.
2. No env vars, no migrations, no flag flips. Templates are inert
   until the follow-up wiring PR points
   `dispatchNotificationEmailTasks` at the registry.

## Rollback Plan

- Revert this PR. Templates and tests disappear. No downstream
  consumers exist yet, so rollback is risk-free.

## Audit Evidence

- Comms Spine §4 (channel) — email is the Phase 1 channel; templates
  honour that contract.
- Comms Spine §5 (compliance) — physical address, unsubscribe link,
  identification of sender, and PII masking on the invite event.
- Design system lock — Georgia + DM Sans, cream paper, ink + accent
  colors only. No new palette tokens introduced.

## Known Gaps

- Registry is not yet wired into the dispatcher; follow-up PR will
  replace the inline string builder in `email.ts` with
  `requireTemplate(event.sourceEventType)` lookup.
- Physical sender address is a Phase 1 placeholder per founder
  doctrine — legal will swap in the official entity address before
  pilot launch.
- `slack`, `teams`, `pagerduty` channels are not templated here —
  email-only per Phase 1 scope.
- No per-tenant brand overrides beyond `TenantBrand.name` and
  `industryTag` (custom domains / logos are Phase 2).
- 32 other event types remain untemplated; the registry rejects them
  via `getTemplate(...) === null`, causing the dispatcher (once
  wired) to fall back to `in_app` only.
