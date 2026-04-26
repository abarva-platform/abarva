# Source Dashboard Mission Preview Visual Review

Date: 2026-04-26
Status: review complete with authenticated screenshot blocker
Reviewed route: `/source`
Reviewed commit: `c164c5c29f14ec5641aeb017ff56b2b20826c659`

## Purpose

Review the current merged Source dashboard after the deterministic agent mission preview milestone. This review is intentionally narrow: it assesses whether the dashboard is ready as the current baseline, whether tiny polish is safe, and what should happen next before broader Source workflow surfaces are built.

## Authenticated Review Status

Authenticated browser review did not complete in the Codex environment.

Route reachability was checked against production with:

```bash
curl -I -L --max-redirs 2 --max-time 20 https://app.abarva.ai/source
```

Result:

- `/source` returned `307` to `/sign-in?redirect=%2Fsource`.
- Clerk headers showed `x-clerk-auth-status: signed-out`.
- The app-owned sign-in route returned `200`.

Interpretation:

- The protected route and sign-in redirect path are reachable.
- An authenticated screenshot was not available because this environment does not have a signed-in browser session or user credentials.
- No visual claim below depends on a live authenticated screenshot; visual assessment is based on the merged dashboard implementation and prior Source review direction.

## Screenshot Availability

No screenshot was captured.

Blocker: no authenticated browser session was available. A future manual founder/authenticated review should capture the first viewport and confirm the visual assessment against the live app.

## First Viewport

The merged dashboard first viewport is expected to show:

- a warm off-white Source dashboard container,
- one dark navy Source Command Read panel,
- the most exposed event with owner, aging, value exposed, and next action,
- compact deterministic agent missions inside the command read,
- a light Executive Pressure Signals panel,
- KPI cards below the top row, and
- the sourcing events table immediately after the KPI strip.

This follows the prior decision to keep a single high-impact dark panel while moving the primary dashboard language toward warm off-white and table-forward Source operations.

## Source Nav Active State

Source nav active-state behavior was not re-verified with an authenticated browser session in this review. Prior Source auth/dashboard work established Source route placement and nav availability. This should be reconfirmed during the next authenticated screenshot pass.

## Mission Preview Assessment

### Usefulness

The mission preview is useful because it turns the deterministic agent mission read model into visible operating guidance without creating chat UI, model calls, or a new workflow surface.

It answers the right question for the Source dashboard: what needs attention now and which agent owns the concern.

### Nexus As Sourcing Lead

Nexus appears through deterministic mission guidance, but the first visible mission may be Steward when the stage gate is the highest-priority issue. That is correct for governance integrity, but future polish may need to make Nexus feel like the coordinating lead while still letting Steward own blockers.

Tiny polish is not recommended without an authenticated screenshot, because the current ordering may already be correct in context.

### Sentinel / Atlas / Steward Signal Clarity

The preview limits visible missions to a compact set and tries to include more than one agent before filling remaining slots. This is the right behavior: Sentinel, Atlas, and Steward are visible without becoming a noisy activity feed.

### First Viewport Attention

The command read, pressure signals, mission preview, and most exposed event together answer what needs attention. The risk is density: the first viewport may feel heavy if the mission cards make the dark command panel too tall.

This is a watch item for authenticated screenshot review, not yet a code-change finding.

### Event Table Prominence

The event table remains immediately below the KPI strip. That is acceptable for the current baseline, but Source should continue moving toward table-forward first-viewport behavior as the event canvas and data readiness surfaces mature.

### Off-White / Table-Forward Direction

The implementation uses a warm off-white page container, white KPI cards, light pressure signals, and a single dark navy command read. This aligns with the Experience System direction more closely than the earlier dark-heavy dashboard.

### Mission Preview Compactness

The preview is compact at the data level: top three missions, short labels, priority/state, evidence note, title, and recommended action. The live visual height still needs authenticated screenshot validation.

### 3 Choices + Custom

The mission preview does not yet show a visual-only three choices plus custom pattern. That is acceptable. This dashboard preview should not introduce choice chips until the event canvas or Nexus interaction surface has a clearer place for them.

## Final Decision

Approve as baseline.

Rationale:

- The current implementation is deterministic and bounded.
- Mission preview makes the agent layer visible without adding chat behavior.
- The dashboard follows the off-white, single-dark-panel direction.
- There is not enough authenticated visual evidence to justify safe polish in this slice.

## Recommended Next Slice

Route smoke coverage.

Reason: before adding more UI polish, the next high-confidence improvement is deterministic coverage that proves the `/source` dashboard mission preview can render from seeded data without model calls, upload/parsing, or API dependency.

## Explicitly Out Of Scope

- No UI changes.
- No Source runtime changes.
- No API changes.
- No model calls.
- No chat UI.
- No upload/parsing.
- No event canvas implementation.
- No scorecard, artifact drawer, or value ledger UI.
- No workflow or approval engine.

## Production Readiness Impact

No `production-readiness.json` update is recommended for this review-only slice. The review documents an authenticated screenshot blocker and does not change runtime capability, testing evidence, readiness gates, or production status.
