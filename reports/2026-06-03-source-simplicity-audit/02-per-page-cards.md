# Source — Per-Page Audit Cards

**Method:** code-grounded (screenshots pending). Each card scores the **5 lenses** 1–5 (5 = Apple-grade), lists the **top 3 frictions**, the **delete list**, and a **chrome word budget** verdict. Target for executive surfaces: **60–80 words of UI chrome** per primary view.

**5 lenses:** Clarity (know what this does in 3s) · Focus (one obvious primary job) · Calm (load proportionate to the decision) · Trust (premium, real, deterministic-feeling) · Actionability (next decision is one click away).

Reference anchors per finding: **Linear** (calm dense queues) · **Stripe** (executive numbers with restraint) · **Apple Notes/Maps** (negative space at scale).

---

## `/source` + `/source/queue` — Decision Queue
**Scores:** Clarity 4 · Focus 3 · Calm 3 · Trust 4 · Actionability 4 — **avg 3.6**

The strongest *concept* in the surface: "here is what to decide today." But it ships at two routes, and the six "I have a…" entry phrasings compete with the queue cards for the eye.

**Top 3 frictions**
1. Rendered at both `/source` and `/source/queue` — two URLs, one view.
2. Six entry-point CTAs ("I have a vendor / renewal / RFP response / business request / I need to cut spend / compare vendors") dilute the squint test — the eye doesn't land on one thing.
3. Competes with `/source/portfolio` and `/source/events` for the role of "the home page."

**Delete list:** DELETE the duplicate route · DEMOTE the six entry CTAs to one "Start" + picker.
**Chrome budget:** ~70 words — **on budget.** Hierarchy, not volume, is the issue.

---

## `/source/portfolio` — Sourcing portfolio (scorecard + table)
**Scores:** Clarity 4 · Focus 3 · Calm 3 · Trust 4 · Actionability 3 — **avg 3.4**

The subline *"N events across M tenants. K need your attention today."* is the best sentence in the whole surface — a real narrative. It's then buried under a 6-tile scorecard with overlapping metrics.

**Top 3 frictions**
1. **Event count appears 3×** on one screen: top-bar context, subline, sub-header result count.
2. **Scorecard overlap:** Total value / Open pipeline / Active / Waiting / At-risk / Oldest age — Open pipeline + Active + Waiting describe one pipeline split three ways.
3. **Three view modes** (Table / Kanban / Value chart) for a single operator — most never switch.

**Delete list:** MERGE the 3 event counts → 1 · MERGE Open pipeline+Active+Waiting → one pipeline-health metric · PROMOTE "At-risk exposure" + the narrative subline · DEMOTE Kanban/Value chart behind overflow.
**Chrome budget:** ~95 words — **over.** Cut to ~65 by merging the scorecard.

---

## `/source/events` — IT sourcing operating queue
**Scores:** Clarity 2 · Focus 2 · Calm 2 · Trust 3 · Actionability 3 — **avg 2.4**

This page is a **duplicate of `/source/portfolio`** with a *different name and a different KPI vocabulary* for the identical dataset. This is the clearest "explain mode" page in the surface.

**Top 3 frictions**
1. Second portfolio page; "IT sourcing operating queue" vs "Sourcing events" — two names, one job.
2. **39-word subline explaining the table** instead of showing it.
3. **Different KPIs than portfolio** (Events / Waiting / Blocked / Linked programs / Value at stake) — forces the user to learn two metric systems.

**Delete list:** DELETE the page; fold any unique value (linked-program hint) into `/source/portfolio`.
**Chrome budget:** ~120 words — **far over.** The fix is deletion, not trimming.

---

## `/source/new` — Sourcing event intake
**Scores:** Clarity 4 · Focus 4 · Calm 3 · Trust 3 · Actionability 4 — **avg 3.6**

Good bones: chat-fills-the-brief, one required field, one primary button. Undermined by triple progress conveyance and internal codenames on the field chips.

**Top 3 frictions**
1. **`Sentinel needs` / `Steward needs` / `Atlas needs`** chips — internal agent codenames as field labels.
2. **Progress shown 3×:** context strip ("N of M captured") + Capture Queue + per-field chips.
3. **40-word subhead + 3 guidance cards** repeat what the chat greeting already says.

**Delete list:** DELETE agent-codename chips → "Needed/Optional" · MERGE Capture Queue into the field list · DEMOTE subhead to one line + guidance to a dismissible hint · DEMOTE "Step 0 · Sentinel" eyebrow.
**Chrome budget:** ~150 words — **over** (intake legitimately needs field prompts, but the duplicate progress UI is the cut).

---

## `/source/events/[eventId]` — Event canvas (Document/Evidence/Gate/Log)
**Scores:** Clarity 3 · Focus 2 · Calm 2 · Trust 3 · Actionability 3 — **avg 2.6**

The workspace itself is reasonable; the *frame* around it is heavy: an 11-node rail, a context strip that duplicates the tab badges, three always-on export buttons, and a 45%-wide chat rail.

**Top 3 frictions**
1. **Redundant status:** context-strip eyebrow ("Readiness u/t · Artifacts a/T") restates the tab badges (Gate met/total, Evidence usable/total).
2. **11-stage rail always fully shown** even when half the stages are gated/future.
3. **Chat rail at 45% of canvas, always open;** three export buttons visible before any artifact exists.

**Delete list:** MERGE context strip into tab badges (keep badges) · DEMOTE rail to done+current+next · DEMOTE exports under "Export ▾" · DEMOTE chat to collapsed/narrower default · DELETE `npm run db:backfill` empty-state copy.
**Chrome budget:** ~27 words of *persistent* chrome (good) — but the **spatial** budget (rail + strip + 45% chat) is the real overflow.

---

## `/source/events/[eventId]` (legacy `SourceEventDetailPage.tsx`)
**Scores:** Clarity 2 · Focus 2 · Calm 2 · Trust 2 · Actionability 2 — **avg 2.0**

A 2,000-line legacy event-detail component coexisting with the new canvas, carrying most of the surface's jargon leaks: "Deterministic" (30+), `PAT_SRC` codes (10).

**Top 3 frictions**
1. Two parallel event-detail surfaces is itself the friction.
2. "Deterministic event report" / "deterministic" wording throughout — internal correctness claim as buyer copy.
3. `PAT_SRC` citation codes shown instead of human source names.

**Delete list:** DELETE the legacy page (or the new canvas — pick one) · DELETE the word "deterministic" from all user copy · DEMOTE `PAT_SRC` codes to hover.
**Chrome budget:** n/a until the duplication is resolved.

---

## `/source/events/[eventId]/scorecard` — Vendor scorecard governance
**Scores:** Clarity 3 · Focus 2 · Calm 2 · Trust 3 · Actionability 3 — **avg 2.6**

**Top 3 frictions**
1. **Four stacked status conveyors** (shell badge + lifecycle strip + readiness meter + approval counter).
2. "deterministic" ×6 in governance copy.
3. Heaviest chrome page in the surface (~450 words estimated).

**Delete list:** MERGE 4 status conveyors → 1 status + 1 meter · DELETE "deterministic"/"seeded" wording.
**Chrome budget:** ~450 words est. — **far over** for an executive artifact. (Good: it *does* have explicit empty states — keep those.)

---

## `/source/events/[eventId]/report` — Event report
**Scores:** Clarity 4 · Focus 4 · Calm 4 · Trust 3 · Actionability 3 — **avg 3.6**

Clean — gate-status pills only, no redundant conveyors. Single trust paper-cut: the title.

**Top 3 frictions**
1. Titled "Deterministic event report" — internal adjective on a buyer document.
2. (none material)
3. (none material)

**Delete list:** DELETE "Deterministic" from the title → a CXO-legible name.
**Chrome budget:** ~120 words — **acceptable** for a report.

---

## `/source/compare` — Compare two events
**Scores:** Clarity 4 · Focus 4 · Calm 4 · Trust 3 · Actionability 3 — **avg 3.6**

Restrained and good (color-tint legend, minimal chrome). Loses points only on unhappy paths.

**Top 3 frictions**
1. 35-word intro feature-list promising specifics before showing them.
2. No guard when the same event is picked twice / no data — empty cells render silently.
3. (none material)

**Delete list:** DEMOTE intro to one line · ADD a real empty/duplicate guard state.
**Chrome budget:** ~58–76 words — **on budget.**

---

## `/source/events/[eventId]/vendors/[vendorId]` — Vendor detail
**Scores:** Clarity 5 · Focus 4 · Calm 4 · Trust 4 · Actionability 3 — **avg 4.0**

**The cleanest page in the surface** — 0 jargon leaks, 0 redundant status conveyors. Use it as the reference for what "good" looks like internally.

**Top 3 frictions**
1. "Step 4 / Step 6 / Sentinel" as section provenance labels (internal stage numbers + agent name).
2. Confident scorecard/BAFO headers over tables that render empty with no copy.
3. (none material)

**Delete list:** DEMOTE/reword the "Step N" provenance labels · ADD empty-row copy for scorecard/BAFO.
**Chrome budget:** ~122 words — **acceptable** (detail page legitimately carries field labels).

---

## Surface scoreboard

| Route | Clarity | Focus | Calm | Trust | Action | Avg |
|---|---|---|---|---|---|---|
| Vendor detail | 5 | 4 | 4 | 4 | 3 | **4.0** |
| Decision Queue | 4 | 3 | 3 | 4 | 4 | **3.6** |
| `/new` intake | 4 | 4 | 3 | 3 | 4 | **3.6** |
| Report | 4 | 4 | 4 | 3 | 3 | **3.6** |
| Compare | 4 | 4 | 4 | 3 | 3 | **3.6** |
| Portfolio | 4 | 3 | 3 | 4 | 3 | **3.4** |
| Event canvas | 3 | 2 | 2 | 3 | 3 | **2.6** |
| Scorecard | 3 | 2 | 2 | 3 | 3 | **2.6** |
| `/events` queue | 2 | 2 | 2 | 3 | 3 | **2.4** |
| Legacy detail | 2 | 2 | 2 | 2 | 2 | **2.0** |

**Pattern:** the *single-purpose* pages (vendor, report, compare) score well; the *multi-purpose / duplicated* pages (events queue, event canvas, legacy detail) score worst. The surface's problem is **too many pages doing overlapping jobs**, not bad individual pages.
