# Source — Target-State Sketches

Redlines + target wireframes derived from the [element inventory](01-element-inventory.csv), [clutter inventory](03-clutter-inventory.md), and the live [screenshot pass](06-screenshot-validation.md). These describe the **target** experience — what survives subtraction — so the CXO Bible (next, last) can be written against it rather than against today's noise.

Notation: `KEEP` · `MERGE` (collapse with a sibling) · `RENAME` · `HIDE` (demote to overflow/tooltip/earn-before-show) · `CUT` (delete).

---

## A. Information architecture — 4 homes → 2

The Tier-0 finding (three home views show contradictory numbers) forces this before any page-level work.

```
CURRENT (what a user actually hits)                 TARGET
─────────────────────────────────────────          ─────────────────────────────────────────
/source        → redirects to /source/events        /source        → Decision Queue (canonical home)
                 (the page that FAILS squint)                          the page that PASSES squint
/source/queue  → Decision Queue (PASSES squint)      /source/portfolio → the ONE table/analysis view
/source/events → Events "operating queue" (worst)                       (absorbs /source/events)
/source/portfolio → scorecard + kanban               ── deleted ──   /source/events  (folded into portfolio)
                                                      ── deleted ──   /source/queue   (it IS /source now)
/source/events/[id] → new canvas + legacy            /source/events/[id] → ONE canvas (legacy retired)
   SourceEventDetailPage (both exist)
/source/new, …/scorecard, …/report,                  unchanged routes, cleaned per redlines below
   …/vendors/[id], /compare
```

**Sub-nav:** `Queue · Events · Portfolio` (3 tabs) → **`Decisions · Portfolio`** (2 tabs). "Decisions" = act mode (the queue). "Portfolio" = analyze mode (the table). Everything else is reached *from* an event, not from a top tab.

**One canonical scorecard, computed once** (a single shared loader; every surface reads it):

```
┌─ Source scorecard (one definition, one computation) ───────────────────┐
│  OPEN VALUE      AT-RISK         ACTIVE      WAITING     OLDEST STAGE    │
│  $39.0M          $35.0M          2           0           8d             │
│  2 open events   1 needs you     in gates    —           —              │
└────────────────────────────────────────────────────────────────────────┘
```
- Drop **"Open pipeline"** (it equals Total value — verified $39.0M == $39.0M live).
- The number that shows on `/source/events` today ($74.0M, 3 events) and the number on `/source/portfolio` ($39.0M, 2 events) must become **one** value. Pick the correct computation, compute it once, render it everywhere.

**One stage vocabulary.** Today an event is simultaneously "BAFO·Active·8d" (card), "07 BAFO" (rail), and "Evaluation & Pricing" (kanban band). Make the **11-stage model the single source of truth**; the kanban bands become *derived groupings* of those stages with matching labels. Never show three names for one state.

---

## B. `/source/events` — the worst page → mostly CUT (folds into Portfolio + Queue)

**Current blocks (squint test: FAIL — 6 competing regions):**
```
[Sentinel rail ~45%]  │  IT sourcing operating queue  +  39-word subline   [START IT SOURCING EVENT]
  + 2 disclaimers      │  ┌ KPI scorecard #1: Events/Waiting/Blocked/Linked/Value ($74.0M) ┐
                       │  ┌ KPI scorecard #2 "SOURCE EVENT PORTFOLIO": Posture/Pressure/… ($74.0M) ┐
                       │  ┌ event-card strip (horizontal scroll) ┐
                       │  ┌ SENTINEL MISSION STRIP: narrative attention cards + "Open event" ┐
                       │  ┌ PORTFOLIO WORKFLOW GUIDANCE rail: WHERE AM I / WHAT MATTERS / … ┐
```

**Redline:**
- `CUT` the page as a distinct route. Its three real jobs already live elsewhere or move:
  - "attention" narrative → **the Decision Queue already does this better** (one card, one action).
  - the event table → **Portfolio**.
  - per-event "next action" / linked-program hint → onto the **queue card** and **portfolio row**.
- `CUT` both KPI scorecards here (replaced by the single canonical one on Portfolio).
- `CUT` the 39-word subline (explain-mode).
- `CUT` the "PORTFOLIO WORKFLOW GUIDANCE" rail — it's a third status conveyor restating the mission strip.

**Target:** this URL redirects to `/source` (Decisions). Nothing of value is lost.

---

## C. `/source` (canonical home) = the Decision Queue — KEEP, lightly trim

**Current (squint: PASS) — the model to protect:**
```
SOURCE · DECISION QUEUE
23 decisions need your attention
Renewal decisions that need action today, sorted by risk and value at stake.
[NEXT 90 DAYS: 7] [WATCH: 16]

ALREADY MID-STREAM? JUMP STRAIGHT IN
[I have a vendor][I have a renewal][I have an RFP response][I have a business request][I need to cut spend][I need to compare vendors]

┌ [NEXT 90 DAYS][POSTURE: REVIEW][$1,120,000 AT STAKE]
│ Splunk — Splunk renewal in 88 days · $1.1M at stake · posture: review
│ $1,120,000/yr of medium-criticality spend reaches term-end; a posture decision is needed before re-commit.
│ ▸ 1 signal on this contract
│ Open the Renewal Cockpit and set the posture          [Open decision →]
│ Evidence: vendor_contracts:ven:apex:009 · vendor_contracts · Where did this come from?
```

**Redline:**
- `KEEP` the headline, the card list, one posture badge + one $-at-stake badge, the "Open decision →" action.
- `MERGE` the 6 "I have a…" entry chips → one **`[+ Start]`** control with a 6-item picker. Six peer chips compete with the cards for the eye.
- `RENAME`/`HIDE` the evidence line: `vendor_contracts:ven:apex:009 · vendor_contracts` → keep only **"Where did this come from?"** (the link); move the raw ID into its hover/drawer.
- `KEEP` the dual badges `[NEXT 90 DAYS][POSTURE: REVIEW]` but consider `MERGE` of the third `[$… AT STAKE]` chip with the headline (the headline already says "$1.1M at stake").

**Target:**
```
Decisions                                                         [+ Start ▾]
23 need your attention · 7 in next 90 days · 16 to watch

┌ Splunk renewal · 88 days · $1.1M · posture: review
│ Medium-criticality spend reaches term-end; set a posture before re-commit.
│ ▸ 1 signal        Where did this come from?            [Open decision →]
```

---

## D. `/source/events/[id]` — event canvas — KEEP structure, strip the frame

**Current (squint: FAIL):**
```
                                   [VALUE PROOF][VIEW IN DOSSIER][CXO REPORT][PPTX][DOWNLOAD DEAL PACK] ● ACTIVE
SOURCE › APEX › SRC-004
AMS Outsourcing 2026          (Managed Service · Strategic · Owner: CIO Office)
●━━━●━━━●━━━●━━━●━━━●━━━◉━━━○━━━○━━━○━━━○   01 Strategy … 07 BAFO … 11 Value   (all 11 always shown)
[Sentinel rail ~45%] │ STEP BAFO · Readiness 0/1 · Artifacts 0/2 · Evidence 1 sources   ← duplicates tab badges
 + 2 disclaimers     │ [Document 2][Gate 0/3][Evidence 0/1][Log]
                     │ STORED DOCUMENTS  "1 DB-backed document"  [SOURCE_ARTIFACTS]
                     │   d01_strategy_memo-b68f21af.md  [AI DRAFT]   ← raw filename
                     │   BAFO Question Pack [NOT STARTED]            [MARK COMPLETE] ← shown before earned
```

**Redline:**
- `HIDE` 4 of 5 header buttons → one **`[Export ▾]`** (VALUE PROOF / VIEW IN DOSSIER / CXO REPORT / PPTX / DEAL PACK). And don't show it until an artifact exists.
- `HIDE` the stage rail to **done + current + next**, with an "All stages" toggle. (Rail shows all 11 even at stage 7.)
- `CUT` the context strip ("STEP BAFO · Readiness 0/1 · Artifacts 0/2 · Evidence 1 sources") — the **tab badges already say this**. Keep the badges.
- `HIDE` the Sentinel rail to a **collapsed/narrow default** (icon or ~320px), expand on focus. Not 45%.
- `RENAME` the raw filename `d01_strategy_memo-b68f21af.md` → the human title ("Sourcing Strategy memo"); `CUT` the `SOURCE_ARTIFACTS` source label and the `[AI DRAFT]`→keep but reword.
- `HIDE` "MARK COMPLETE" until the draft is past "NOT STARTED."
- Make one persistent compliance line (see §F) instead of two stacked disclaimers.

**Target:**
```
SOURCE › Apex › AMS Outsourcing 2026                    ● Active   [Export ▾]
Managed Service · Strategic · Owner: CIO Office
✓ Pricing → ◉ BAFO → ○ Executive Decision            [All stages]
[Document 2][Gate 0/3][Evidence 0/1][Log]   ◀ Sentinel
─────────────────────────────────────────────
Sourcing Strategy memo · AI draft · approval draft
BAFO Question Pack · draft
```

---

## E. `/source/new` (intake) — KEEP bones, kill triple-progress + codenames

**Redline:**
- `CUT` two of three progress conveyors: keep the per-field state; drop "0 OF 5 CAPTURED" strip + the "Capture to move forward / 0/5" queue (they restate the fields).
- `RENAME` field chips `STEWARD NEEDS / SENTINEL NEEDS / ATLAS NEEDS` → **`Needed`** (or drop entirely; `*` already marks required). The buyer doesn't know who Steward is.
- `RENAME` "Capture to move forward" → "What we still need" (if it survives).
- `HIDE` the subhead to one line + guidance cards → a dismissible first-run hint.
- `RENAME` "Step 0 · Sentinel" eyebrow → "New event."
- `HIDE` Sentinel rail to narrow default (same as canvas).

**Target:**
```
New sourcing event                                    0 of 5 captured
Tell us the trigger in plain language; the brief fills as you talk.

Why now / trigger *           [ …                                  ]
Decision owner                [ …                                  ]
Scope boundary                [ …                                  ]
Value or savings target       [ …                                  ]
Minimum data / baseline owner [ …                                  ]
                                              [Open sourcing event →]
```

---

## F. The disclaimer — 2 stacked banners → 1 persistent line

Today, on every agent-rail surface:
> HUMAN APPROVAL REQUIRED: AGENT-SUGGESTED ACTIONS ARE PROPOSALS ONLY. A NAMED PERSON MUST APPROVE BEFORE ANY WRITE, SUBMISSION, OR EXTERNAL ACTION RUNS.
> AI may produce errors. You are responsible for decisions taken based on this output.

**Target:** one quiet persistent line in the rail footer —
> *Proposals only — a named person approves before anything is written or sent.*

— and surface the "AI may produce errors" caution **contextually**, at the moment an agent action is about to be taken (on the approve/submit control), not as permanent wallpaper. A warning shown 47 times stops being read.

---

## G. Page-level target scores (post-redline projection)

| Page | Now (avg) | Target | The move that gets it there |
|---|---|---|---|
| Decision Queue (`/source`) | 3.6 | **4.6** | merge entry chips, hide evidence ID |
| Portfolio | 3.4 | **4.4** | canonical scorecard, absorb Events, default to Table |
| Event canvas | 2.6 | **4.3** | strip frame: exports, rail, context strip, stage rail |
| Intake | 3.6 | **4.4** | kill triple-progress + codename chips |
| `/source/events` | 2.4 | **— (deleted)** | folds into Portfolio + Queue |
| Legacy detail | 2.0 | **— (deleted)** | retire; one canvas |

**Sequence to build:** Tier-0 canonical scorecard → IA consolidation (§A,B) → frame-strip the canvas (§D) → intake + queue trims (§C,E) → disclaimer (§F) → reword sweep. Then write the Bible against this target.
