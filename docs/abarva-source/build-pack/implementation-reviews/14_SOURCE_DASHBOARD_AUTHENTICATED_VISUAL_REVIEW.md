# Source Dashboard Authenticated Visual Review

Date: 2026-04-25

## 1. Review Context

- Route reviewed: `/source`
- Branch/main commit reviewed: `10da9df feat(source): refine dashboard front door (#212)`
- Review mode: attempted authenticated/manual browser review, but an authenticated Source dashboard session was not established.
- Authentication state: unauthenticated in local browser. The app redirected to Clerk sign-in during repeat checks.
- Screenshot availability:
  - Desktop and narrow screenshots were captured outside the repo, but they show Clerk sign-in rather than the Source dashboard:
    - `/tmp/source-dashboard-pr212-desktop.png`
    - `/tmp/source-dashboard-pr212-narrow.png`
  - No authenticated Source dashboard screenshot was captured.
- Browser/device sizes checked:
  - In-app browser narrow viewport, approximately 399 px wide.
  - Playwright desktop viewport: 1440 x 1100.
  - Playwright narrow viewport: 390 x 900.
- Auth/Clerk blocker: yes. `/source` redirects to Clerk sign-in without an authenticated session. I did not enter credentials or use stored credentials/API keys for this review.

## 2. Visual Assessment

Because authenticated access was not established, this is a limited visual review based on:

- the merged PR #212 code/static layout
- an initial local browser observation of the `/source` dashboard before subsequent Clerk redirects
- sign-in redirect checks confirming the auth blocker remains for unauthenticated sessions

Assessment:

- First-viewport hierarchy: improved directionally. The command read now leads with risk, waiting/blocked count, and value under management.
- Clarity of command read: strong in content. Narrow viewport observation suggests the large serif command read may need one more responsive polish pass to avoid clipped-looking text in constrained browser panes.
- KPI clarity: improved. `Waiting / Blocked`, `At Risk`, and `Value At Stake` are clearer than the prior generic KPI language.
- Alert pressure signal quality: improved. Alert cards now carry event, owner, aging, status, exposed value, blocker, and recommended action.
- Event-table scanability: improved by stronger event names, alert count pills, owner/pressure language, and value emphasis.
- Value-at-risk salience: improved. Value under management is surfaced in the command read, KPI strip, alert metadata, and table.
- Status/stage clarity: improved in static review through lifecycle pills and stage column treatment.
- Owner/aging/blocker visibility: materially improved in alerts and table rows.
- Next-action clarity: improved. The first viewport and table now make next moves more obvious.
- Responsive fit: not fully approved. Narrow viewport authenticated review was not completed, and the initial in-app observation suggested the command read may be too large for very narrow panes.
- Premium/off-white/elegant feel: directionally aligned with the Source workbench vision, but final judgment requires an authenticated screenshot.
- Minimal icon/symbol discipline: acceptable. The slice did not add icon clutter.
- Avoids generic dashboard feel: improved. The dashboard now reads more like a sourcing operating surface than a generic metric board.

## 3. What Works

- The dashboard now opens with a decisive operating statement rather than a passive summary.
- The most exposed event is named immediately with owner, aging, value, and next action.
- KPI labels are more accurate and less dashboard-filler-like.
- Alert cards feel closer to executive pressure signals.
- The event table is a stronger operating queue and carries the right dimensions: event, stage/status, owner/pressure, value, blocker, and next action.
- The page remains deterministic and does not imply live model behavior.
- No new Source surface or workflow scope was introduced.

## 4. What Still Feels Weak

- Authenticated visual approval is still blocked until a signed-in browser session can be established.
- The large command-read line may need responsive tuning for narrow panes so it wraps cleanly and does not feel clipped.
- The alert panel is richer, but longer real-client event names or blocker text may need tighter wrapping rules.
- The table still depends on horizontal scroll at narrow widths. That is acceptable for an operator table, but it should be manually reviewed in an authenticated browser.
- The nav showed `Login` during the local observation, so the review cannot confirm signed-in chrome, user menu, or tenant/session details.

## 5. Decision

Decision: approve with minor polish.

The dashboard direction is strong enough to be the current Source front-door baseline, but it should not be treated as fully authenticated-visually-approved until a signed-in screenshot confirms desktop and narrow responsive fit.

## 6. Recommended Next Slice

Recommended next slice: dashboard polish follow-up.

Keep it tightly scoped to:

- authenticated screenshot review findings
- command-read wrapping at narrow widths
- alert-card metadata wrapping
- event-table narrow-width fit

Do not advance to event canvas, API routes, model calls, upload/parsing, or workflow/runtime work until the front door is visually accepted.

## 7. Screenshot Notes

Screenshots captured outside the repo:

- `/tmp/source-dashboard-pr212-desktop.png`: Clerk sign-in page, not Source dashboard.
- `/tmp/source-dashboard-pr212-narrow.png`: Clerk sign-in page, not Source dashboard.

No screenshot artifact was committed.

An initial in-app browser observation briefly displayed the Source dashboard in a narrow viewport, but the session was not authenticated and subsequent checks redirected to Clerk sign-in. That observation is useful for responsive risk detection, not for final authenticated approval.

## 8. Confirmation

No code changes were made. No UI changes, API routes, model calls, upload/parsing, event canvas, scorecard UI, artifact drawer, value ledger UI, workflow engine, approval engine, vendor flow, AI/RFP generation, `/programs`, `/preview`, or `/demo` work was implemented.
