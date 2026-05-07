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
| A1 | Saved Clerk session expires silently — first scenario run after a few hours just lands on `/sign-in` and fails. | The error message points at "session expired" but the recovery (`npm run save-session`) is a separate step. Users blame the tool. | Detect `/sign-in` redirect inside the page wait, automatically re-launch headed browser with the sign-in URL, resume the scenario after login. One command, not two. |
| ~~A2~~ | ~~`walk-canvas` and `promote-stage` need an event URL pasted~~ **CLOSED** — both default to the most recent `create-event` `eventUrl` resolved from `runs/`. Pass `--event` to override. | n/a | n/a |
| ~~A3~~ | ~~No way to chain scenarios.~~ **CLOSED** — `npm run scenario:e2e` runs `create-event → walk-canvas → promote-stage` in one shot, single run dir, single audit log. | n/a | n/a |
| ~~A4~~ | ~~Output is technical (JSONL / CSV / per-run audit log).~~ **CLOSED** — every run now writes `summary.md` with status, per-step result JSON, and embedded screenshot links. Open this file first when reviewing a run. | n/a | n/a |
| A5 | All defaults for `create-event` are hardcoded in `scenarios.ts`. | Iterating on different event archetypes means editing TS each time. | `--fixture path/to/event.json` flag; ship a few fixtures (AMS-renewal, cloud-migration, data-platform) under `fixtures/`. |
| A6 | Headed browser is the only mode. | A 2-min run that needs a visible browser is still 2 minutes a human stares at. | `--quick` flag → headless, 0.3s jitter, tighter timeouts. |
| A7 | No way to point the tool at `localhost:3000` while iterating on the surface. | Every code change → push → wait for Vercel → run scenario. | Just doc-fix: README should call out that `TENANT_URL=http://localhost:3000/source` works as long as Clerk session is captured against localhost. |

## B. AbarVa surface gaps the tool is working around

| # | Gap | Adoption impact | Fix sketch |
|---|---|---|---|
| ~~B1~~ | ~~**No `Submit deliverable` button on artifact cards.**~~ **CLOSED** by PR adding the `Mark complete` button + status pill on the active artifact in DocumentTab. Wires to `PATCH /api/v1/source/:eventId/artifacts/:code/status`; UI updates optimistically. Locked / superseded artifacts are terminal, approved artifacts can be reopened. Inline markdown editor still pending — this slice is the status flip only. | n/a | n/a |
| B2 | **No `Mark complete` toggle on individual artifacts.** Only the `Promote stage` button at the gate level. | Stage promotion is a coarse-grained action. Users want to checkpoint their work artifact-by-artifact. | Per-artifact status pill (`draft / in_review / complete`) with one-click toggle. |
| B3 | Gate criteria don't show what's blocking promotion. | When `Promote stage` is disabled, the user has no diagnostic — they have to guess which criterion is unmet. | Inline criterion list with `pending / met / blocked` tags + a "what's missing?" link to the relevant artifact. |
| B4 | Chat lane offers no suggested prompts or "what can I ask?" affordance. | First-time users stare at an empty input. Empty input = empty value. | Three pre-filled chip suggestions per stage (`Why now?`, `Draft scope memo`, `What evidence is missing?`) — clicking populates the input, doesn't submit. |
| B5 | No onboarding flow for first-time users. | A founder demoing AbarVa to a CFO has to narrate every click. | `?onboard=1` query param triggers a 4-step tooltip tour: Portfolio → New event → Canvas → Promote. |
| ~~B6~~ | ~~`/source/new` intake doesn't autosave.~~ **CLOSED** — intake + selected category persist to `localStorage` per tenant on every change; restored on mount with a "Draft restored from autosave · Discard draft" hint. Cleared on successful submission. SSR-safe via `typeof window` guards. | n/a | n/a |
| B7 | `/source/events/<UUID>` URLs are cryptic. | Hard to bookmark, hard to share, hard to remember. | Use `code` (e.g. `SRC-APX-101`) as the URL slug; UUID stays the substrate primary key. |
| B8 | "What does Sentinel actually do?" is invisible. | Users who don't know agent-product idiom assume it's a search box. | Brief eyebrow above the chat input: *"Sentinel can draft any artifact, run the gate check, and propose your next move. Try: 'draft scope memo'."* |

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
