# Source — Target-State Design Doctrine

> **Note on naming:** this is **not** "the CXO Bible." The actual CXO Bible is a *testing brief* — see [09-source-cxo-testing-brief-target-state.html](09-source-cxo-testing-brief-target-state.html), the target-state rewrite of the user's `APEX_RETAIL_SOURCE_E2E_CXO_TESTING_BRIEF`. This doc was drafted before that was clarified; it stands on its own as the **design doctrine** (what Source *is* and how it's built), the companion to the testing brief (what "good" looks like at a real event). Keep both; they serve different jobs.
>
> The canonical design doctrine for the Source surface, written against the **target state** (post-subtraction) — not today's product. Where this contradicts the current build, the current build is wrong.

---

## 1. What Source is (the press release)

> **Source tells a sourcing leader what to decide today, shows the evidence behind it, and carries the decision to a defensible close.**

Twelve words of job: *"Here is what to decide today, and why."* Everything Source renders either advances that decision or earns its removal.

Source is **not** a workflow tool you operate, a dashboard you read, or an AI you chat with. Those are means. The end is a **confident, evidenced sourcing decision** — renewal, consolidation, RFP, award — that a CXO can defend to a board.

## 2. Who it's for

A sourcing/IT executive (CIO, CDO, VP Infrastructure, procurement sponsor) and the operator working on their behalf. They are time-poor and trust-sensitive. They do not share our internal vocabulary, do not know our agents' codenames, and will distrust the entire product the moment two screens show different numbers. Build for the executive who has 90 seconds and a board meeting.

## 3. The doctrine (how we decide what exists)

Every visible element begins **guilty**. It earns its place by answering one question: *does this change what the user does next?* If not — `MERGE`, `RENAME`, `HIDE`, or `CUT`. We ship in **act mode**, not **explain mode**. (Full doctrine: [04-principles-brief.md](04-principles-brief.md). The nine principles are binding, not aspirational.)

The single non-negotiable, learned the hard way in this audit: **one truth, computed once.** When the same number is computed in three places, it drifts, and a CXO loses faith in all three. (See §5.)

## 4. The canonical information architecture

Source is **two top-level surfaces** and the event canvas. Nothing else earns a top tab.

| Surface | Route | The one job | Primary action |
|---|---|---|---|
| **Decisions** | `/source` | What needs deciding today | `Open decision →` |
| **Portfolio** | `/source/portfolio` | The full event table + the one scorecard | `New sourcing event` |
| Event canvas | `/source/events/[id]` | Work one event to a defensible close | the stage's next action |
| Intake | `/source/new` | Stand up a new event from a trigger | `Open sourcing event →` |
| Artifacts | `…/scorecard · /report · /vendors/[id] · /compare` | Reach *from* an event, never a top tab | — |

**Retired:** `/source/events` (the "operating queue" — folds into Decisions + Portfolio); `/source/queue` as a separate route (it *is* `/source`); the legacy `SourceEventDetailPage` (one canvas only). The `/source` redirect lands on **Decisions**, not on the page that fails the squint test.

## 5. The canon of truth (compute once, render everywhere)

**One scorecard.** A single shared computation, read identically by every surface:

> **Open value · At-risk exposure · Active · Waiting · Oldest stage age**

No second scorecard with reworded labels. No "Open pipeline" tile (it equals Total value). The portfolio value the executive sees on Decisions is the same value, to the dollar, on Portfolio and on the event canvas.

**One stage vocabulary.** The 11-stage model (Strategy → Value) is the single source of truth. Kanban bands are *derived groupings* of those stages, labeled consistently. An event is never "BAFO" and "Evaluation & Pricing" and "07" on three surfaces at once. On the canvas, show **done + current + next**; the rest collapse behind "All stages."

**One status.** Each piece of state has exactly one conveyor. The event canvas shows status in the **tab badges** — not also in a context strip that restates them.

## 6. Page canon (target state)

Each page: one job, one primary action, a chrome budget. Detail and wireframes in [07-target-state-sketches.md](07-target-state-sketches.md).

- **Decisions (`/source`)** — a single column of decision cards, sorted by risk × value. One posture badge, one $-at-stake, one `Open decision →` per card. A single `[+ Start ▾]` for mid-stream entry (not six peer chips). Evidence provenance is a "Where did this come from?" link, never a raw `vendor_contracts:…` ID. *This page passes the squint test today — protect it.*
- **Portfolio** — the one scorecard (§5) + the event table, **defaulting to Table** (Kanban/Value-chart behind an overflow). The narrative subline ("N events; K need you today") is the hero line.
- **Event canvas** — identity strip · collapsed stage rail · four tab badges (Document/Gate/Evidence/Log) · workspace · a **narrow, collapsed-by-default** Sentinel rail. Exports live under one `[Export ▾]`, shown only once an artifact exists. Controls appear only when earned (no "Mark Complete" on a "Not Started" draft).
- **Intake** — five fields, one required, one primary button. Progress shown **once**. No agent-codename chips. The agent greeting carries the instruction; the page doesn't repeat it.

## 7. The language canon

**Never appears in buyer-facing copy** (each is a trust paper-cut, verified live in this audit):

- Internal correctness adjectives: **"deterministic"** (say what it *is* — "citation-backed").
- Dev/runtime language: `npm run …`, `computeBaseline()`, `runtime`, `scaffold`, `hydrate`, `substrate`, `seed`/`seeded`, `minimum state`.
- Agent codenames as labels: **`STEWARD NEEDS` / `SENTINEL NEEDS` / `ATLAS NEEDS`** → "Needed". (Agents may be *named* in conversation; they are never *labels*.)
- Internal IDs and tiers as content: `PAT_SRC…`, `vendor_contracts:ven:apex:009`, raw filenames (`d01_strategy_memo-b68f21af.md`), `SOURCE_ARTIFACTS`, `TIER: STUB` / stub / outline.
- Stage-machine numbering as a label: "Step 0", "Step 4."

**The test:** say what a thing *does* for the executive, not what we call it internally. If a buyer wouldn't recognize the word, it doesn't ship.

## 8. The compliance canon

Governance is shown **when it's needed, not always.** One quiet persistent line states the rule:

> *Proposals only — a named person approves before anything is written or sent.*

The "AI may produce errors" caution is surfaced **contextually**, on the control that takes an agent action — not as a second permanent banner. A warning shown on every view, 47 times a week, becomes wallpaper and desensitizes the user to the warning that matters. Governance that is omnipresent is governance that is ignored.

## 9. What "best in class" feels like

Linear's calm dense queue. Stripe's restraint with numbers. Apple's negative space on the unhappy path. Concretely: **the Decision Queue and the vendor-detail page already feel like this** — they are the internal benchmark. Make every Source surface feel like those two.

A sourcing leader should be able to open Source, and within three seconds know: *what needs me, what it's worth, and what to do about it* — with nothing else competing for the answer.
