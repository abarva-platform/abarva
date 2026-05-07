# Ease-of-use backlog

Living list of friction points we hit while running the crawl /
scenario tool against AbarVa, plus the AbarVa-side gaps the tool is
*forced* to work around. Adoption in an AI-first product hinges on
removing these — every "you have to remember to…" is a tax users
won't pay twice.

Ordered loosely by how often the friction bites, not by effort. Tag
new entries as you encounter them; close them with a PR link when
fixed.

---

## A. Tool friction (this crawler / scenario runner)

| # | Friction | Why it kills adoption | Fix sketch |
|---|---|---|---|
| ~~A1~~ | ~~Saved Clerk session expires silently~~ **CLOSED** (partial) — every scenario run now probes `TENANT_URL` up front. If we land on `/sign-in` (or off-tenant), the run aborts with a clear log line and exit code 2: *"saved session is expired or invalid (landed on …). Recover: run `npm run save-session`, then re-run this scenario."* Auto-recovery (re-launch headed, save new state, resume) deferred to a future iteration — the explicit failure already removes the cryptic-mid-run-error problem. | n/a | n/a |
| ~~A2~~ | ~~`walk-canvas` and `promote-stage` need an event URL pasted~~ **CLOSED** — both default to the most recent `create-event` `eventUrl` resolved from `runs/`. Pass `--event` to override. | n/a | n/a |
| ~~A3~~ | ~~No way to chain scenarios.~~ **CLOSED** — `npm run scenario:e2e` runs `create-event → walk-canvas → promote-stage` in one shot, single run dir, single audit log. | n/a | n/a |
| ~~A4~~ | ~~Output is technical (JSONL / CSV / per-run audit log).~~ **CLOSED** — every run now writes `summary.md` with status, per-step result JSON, and embedded screenshot links. Open this file first when reviewing a run. | n/a | n/a |
| ~~A5~~ | ~~All defaults for `create-event` are hardcoded in `scenarios.ts`.~~ **CLOSED** — pass `--fixture path/to/event.json` to drive create-event with a different archetype. Three fixtures ship: `ams-renewal.json` (default-equivalent), `cloud-migration.json`, `data-platform.json`. | n/a | n/a |
| ~~A6~~ | ~~Headed browser is the only mode.~~ **CLOSED** — pass `--quick` to any scenario for headless mode. Default behavior (headed) preserved so a human can still watch. | n/a | n/a |
| ~~A7~~ | ~~No way to point the tool at `localhost:3000` while iterating on the surface.~~ **CLOSED** — README now has a "Pointing at localhost" section with the three env vars to override (`TENANT_URL`, `TENANT_HOSTNAME`, `SIGNIN_URL`) and a note about re-saving the session per environment. | n/a | n/a |

## B. AbarVa surface gaps the tool is working around

| # | Gap | Adoption impact | Fix sketch |
|---|---|---|---|
| ~~B1~~ | ~~**No `Submit deliverable` button on artifact cards.**~~ **CLOSED** by PR adding the `Mark complete` button + status pill on the active artifact in DocumentTab. Wires to `PATCH /api/v1/source/:eventId/artifacts/:code/status`; UI updates optimistically. Locked / superseded artifacts are terminal, approved artifacts can be reopened. Inline markdown editor still pending — this slice is the status flip only. | n/a | n/a |
| ~~B2~~ | ~~No `Mark complete` toggle on individual artifacts.~~ **CLOSED** by B1 — DocumentTab now has a 6-state status pill on every artifact row + the active artifact's header (`not_started / drafting / needs_review / approved / locked / superseded`) plus per-artifact `Mark complete` and `Reopen` buttons. Strictly stronger than the original B2 ask. | n/a | n/a |
| ~~B3~~ | ~~Gate criteria don't show what's blocking promotion.~~ **CLOSED** — Gate tab now shows an explicit "N criteria pending / N hard blockers before you can promote" callout above the list when the gate is unmet. Each blocker row carries the criterion title + state + linked evidence artifacts. Per-criterion state pills (Pending / Met / Not met / Waived / Deferred) replace the bare color dot. The disabled promote button is `aria-describedby` the callout for screen readers. | n/a | n/a |
| ~~B4~~ | ~~Chat lane offers no suggested prompts or "what can I ask?" affordance.~~ **CLOSED** — three per-stage suggestions already existed; clicking now POPULATES the composer (and focuses the textarea) instead of auto-submitting, so the user can edit before sending. Empty thread state now carries a one-line subtitle: *"can draft any artifact, run the gate check, and propose your next move. Try one of the three choices below — clicking fills the composer so you can edit before sending."* | n/a | n/a |
| B5 | No onboarding flow for first-time users. | A founder demoing AbarVa to a CFO has to narrate every click. | `?onboard=1` query param triggers a 4-step tooltip tour: Portfolio → New event → Canvas → Promote. |
| ~~B6~~ | ~~`/source/new` intake doesn't autosave.~~ **CLOSED** — intake + selected category persist to `localStorage` per tenant on every change; restored on mount with a "Draft restored from autosave · Discard draft" hint. Cleared on successful submission. SSR-safe via `typeof window` guards. | n/a | n/a |
| ~~B7~~ | ~~`/source/events/<UUID>` URLs are cryptic.~~ **CLOSED** — `getSourcingEvent` now accepts either a UUID or an event_code (e.g. `SRC-APX-101`). Existing UUID URLs continue to work; new shareable URLs can use the code directly. Tenant scope (`client_key`) is preserved on both lookup paths; the access-policy check resolves to `row.id` so access works either way. | n/a | n/a |
| ~~B8~~ | ~~"What does Sentinel actually do?" is invisible.~~ **CLOSED** — agent eyebrow under the chat-lane name now uses action verbs ("Drafts the scope memo, runs the gate check, proposes your next move") instead of abstract role descriptions. Pairs with the B4 empty-state subtitle. | n/a | n/a |

## C. Meta principles for "easy to use in the world of AI"

These are the recurring lenses we're applying. Add to this section
when a new principle emerges from a specific friction.

1. **Visible state.** What just happened. What I can do next. Where I am in the workflow. AI products fail when the user has to infer state from absence of feedback.
2. **Idempotence.** Re-running a step should converge, not duplicate or error. Especially for "create event" with the same intake — should be detect-or-create, not silently double.
3. **Resumability.** Partial progress is the norm — a phone call interrupts a session. Save state at every boundary.
4. **Human-readable identifiers.** UUIDs are for the substrate. URLs and chat references should use the user-facing code.
5. **One-click trial.** Fastest path from "new user" to "saw the magic" is the only metric that matters for first-time conversion.
6. **Audit trail.** Every AI action — every artifact draft, every gate ruling, every status flip — should be inspectable and explainable. Trust scales with traceability.
7. **Forgiveness.** Undo, retry, back-button. AI-suggested actions are wrong sometimes; the user must be able to step back without engineering help.
8. **Defaults > configuration.** Every flag is a tax. Ship sensible defaults and let power users override.

## D. How we use this list

- **As we build:** before adding a new feature to the tool or the
  surface, scan B and C — does the new feature avoid making any
  listed friction worse?
- **After a real user tries it:** the very first thing a new user
  trips on usually doesn't appear here yet. Add it.
- **Before declaring "done":** items in A and B are not blockers,
  but the count above 0 should be deliberately accepted. Avoid
  shipping with B1 still open longer than one cycle.
