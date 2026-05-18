# AbarVa Notification Signal Fabric

## Purpose

AbarVa notifications are operating signals, not generic activity chatter. The
fabric exists to answer four questions consistently across Source, Moves,
Tower, Intelligence, Context, Admin, and Platform operations:

1. What changed or aged enough to deserve attention?
2. Who owns the next action?
3. How loudly should AbarVa interrupt them?
4. What audit trail proves the signal was grounded and delivered?

## Core Contract

The canonical runtime contract lives in `src/lib/notifications/types.ts`.
Every module producer emits a `NotificationEvent` with:

| Field | Purpose |
|---|---|
| `tenantKey` | Tenant isolation boundary. |
| `module` | Source, Moves, Tower, Intelligence, Context, Admin, Platform, or Home. |
| `severity` | `info`, `attention`, `urgent`, or `critical`. |
| `subject` | The contract, source event, program, move, context segment, agent answer, security event, or platform resource. |
| `audience` | User, role, team, owner reference, or tenant admin. |
| `href` | Deep link to the surface where the user can act. |
| `evidenceRefs` | Records or segments that justify the signal. |
| `dedupeKey` | Stable key preventing duplicate alert spam. |

The persisted target table is `platform_notification_events` in migration
`20260517190000_platform_notification_events.sql`.

## Routing Policy

The routing policy lives in `src/lib/notifications/policy.ts`.

| Severity | Channels | Escalation |
|---|---|---|
| `critical` | In-app + immediate email | Escalates after 4h. |
| `urgent` | In-app + immediate email + digest | Escalates after 24h. |
| `attention` | In-app + digest | No immediate interruption. |
| `info` | In-app only | No interruption. |

Module teams should not decide delivery channels directly. They should emit a
well-grounded event; the policy decides how loudly it travels.

## First Producer: Source Execution Room

`src/lib/notifications/source-execution-room.ts` wires Source into the fabric.

It emits operating signals for:

- Notice window closing or overdue.
- Missing accountable owner.
- Finance, legal, security, sponsor, and IT-owner approval needs.
- Final sourcing decision due.
- Source Decision Queue bundles that are due now, next 14 days, or next 45 days.

Long-horizon Source queue items stay in the Source queue and digest. They do
not enter the alert feed, because alert fatigue is a product failure.

## Cross-Module Producers

`src/lib/notifications/module-producers.ts` adds pure producer functions for
the rest of the operating loop:

| Producer | Emits when | Deep link |
|---|---|---|
| `buildMovesDecisionNotifications` | A Move gate, mobilization plan, sourcing need, control gap, or architecture gap changes the next decision. | `/strategic-moves/[id]` |
| `buildTowerExecutiveActionNotifications` | The executive action queue surfaces critical, high, or elevated portfolio action. Watch-only items stay out of the alert feed. | `/tower` |
| `buildTowerRegulatoryRiskNotifications` | The Tower regulatory lens finds a non-low regulatory exposure such as SR 11-7, BSA/AML, fair lending, consent-order, or privacy risk. | `/tower` |
| `buildSentinelGroundingNotifications` | Sentinel has a non-info canonical grounding gap for an answer. | `/intelligence` |
| `buildSentinelConsistencyNotifications` | A Sentinel internal-consistency guard catches a material issue. | `/intelligence` |
| `buildContextTrustNotifications` | A context segment is stale or missing. Fresh and sourced segments do not create alerts. | `/home` setup context |

These producers are intentionally pure. They do not read databases, send email,
or create side effects. Callers project their module view models into the
producer inputs, persist the returned `NotificationEvent` rows if needed, and
let `routeNotification()` decide delivery.

## Email

`src/lib/notifications/email.ts` converts any `NotificationEvent` into a
Resend-compatible email using the existing `sendEmail()` helper. The helper is
fire-and-forget and falls back to console logging when `RESEND_API_KEY` is not
configured.

Production delivery workers should call email only when
`routeNotification(event).channels` includes `email_now`.

## UI Consumers

`/api/notifications` now returns legacy task / approval / phase-gate records
plus platform notification events projected into `NotificationBellItem`.

The Source Execution Room also renders a visible **Signal routing** panel so a
VP can see which alerts the room would raise and through which channels.

## Rules for Future Modules

- Do not create module-specific alert tables unless the platform event is also
  emitted.
- Do not send email directly from a page render or GET route.
- Do not alert on every status change; only alert when ownership, time, risk,
  value, or evidence freshness changes the decision.
- Every notification must deep-link to the action surface.
- Every notification must carry evidence refs or explicitly say the evidence is
  missing.
- Every notification must be tenant scoped.
- Producers should stay pure and side-effect free. Persistence, email, Slack,
  Teams, and webhook delivery belong to platform workers after policy routing.
