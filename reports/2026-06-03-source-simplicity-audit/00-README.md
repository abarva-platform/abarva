# Source — Apple-Grade Simplicity Audit (2026-06-03)

A subtraction audit of the **Source** product surface. The discipline: every visible element begins guilty; it earns its place by changing what the user does next. Output is a **delete list**, not a tone-of-voice memo.

**Scope:** Core + executive-artifact routes — `/source` + `/source/queue` (Decision Queue), `/source/portfolio`, `/source/events`, `/source/new`, `/source/events/[eventId]` (+ Document/Evidence/Gate/Log tabs, drawers, legacy detail), `/source/events/[eventId]/scorecard`, `/source/events/[eventId]/report`, `/source/compare`, `/source/events/[eventId]/vendors/[vendorId]`.

**Grounding:** code-first. Every quoted string and verdict traces to a file:line. Screenshot validation of the squint/hierarchy findings is the next pass (see Status).

## Deliverables

| # | File | What it is |
|---|---|---|
| 1 | [01-element-inventory.csv](01-element-inventory.csv) | **The load-bearing artifact.** Every visible element · literal text · type · **KEEP/DEMOTE/MERGE/DELETE verdict** · rationale. Spreadsheet-importable. |
| 2 | [02-per-page-cards.md](02-per-page-cards.md) | One card per page: 5-lens score (1–5), top-3 frictions, delete list, chrome word budget. Plus the surface scoreboard. |
| 3 | [03-clutter-inventory.md](03-clutter-inventory.md) | Cross-page clutter sorted by leverage: structural duplication → redundant status → internal leaks → explain-mode → earned-state hygiene. |
| 4 | [04-principles-brief.md](04-principles-brief.md) | The 1-page doctrine that survives the audit and guards against re-cluttering. |
| 5 | [05-codex-reconciliation.md](05-codex-reconciliation.md) | Cross-check against a second independent (Codex) pass: convergence (~85%), conflicts resolved against code, net-new findings adopted. |
| 6 | [06-screenshot-validation.md](06-screenshot-validation.md) | Authenticated prod-demo walk. Validates the spatial findings, **reverses one refutation**, and surfaces the highest-severity finding (below). |
| 7 | [07-target-state-sketches.md](07-target-state-sketches.md) | Redlines + target wireframes per page, the 4-homes→2 information architecture, and the canonical-scorecard / single-stage-vocabulary specs. |
| 8 | [08-source-cxo-bible.md](08-source-cxo-bible.md) | Target-state **design doctrine** (what Source is / how it's built). Companion to the testing brief — *not* the CXO Bible (mislabeled originally; corrected). |
| 9 | [09-source-cxo-testing-brief-target-state.html](09-source-cxo-testing-brief-target-state.html) | **The CXO Bible** — target-state rewrite of the Apex CXO Testing Brief. Adds the pre-flight Trust Gate, 2-surface navigation, per-stage experience bars, expanded deliverable checks, and a two-part (Value + Experience) scorecard. |
| 10 | [10-execution-plan.md](10-execution-plan.md) | **How we build it.** Milestones M0–M5 (audit → best-in-class), the 5-layer test architecture, flag-gated cutover, release lanes, and the Bible as the acceptance gate. |

## The headline findings

0. **🔴 The numbers contradict each other.** Verified live: the three home views show **3 events / $74.0M** (`/events`), **2 events / $39.0M** (`/portfolio`), and **"23 decisions"** (`/queue`) — same tenant, same session. Three independent scorecards have drifted. Highest severity; fix first.
1. **Four overlapping "home" views** of the same event set (`/source`→`/events`, `/queue`, `/portfolio`) — with **three different stage vocabularies** and two KPI vocabularies.
2. **Two parallel event-detail implementations** (new canvas + ~2,000-line legacy `SourceEventDetailPage.tsx`); the legacy one carries most jargon leaks.
3. **Redundant status conveyance** on the canvas, portfolio, scorecard, and intake — the same state told 2–4 ways.
4. **Internal-label leaks**: a literal `npm run` command in an empty state, `computeBaseline()` in buyer copy, "deterministic" ×30+, agent codenames as field labels (`STEWARD NEEDS`), raw filenames, `PAT_SRC`/`vendor_contracts` IDs, stub/outline tiers.
5. **Single-purpose pages score well** (vendor detail 4.0, Decision Queue passes the squint test); **multi-purpose/duplicated pages score worst** (Events fails it hardest). The disease is page sprawl, not bad pages.

Your predicted hypotheses: **confirmed** — chat rail ~45% (verified live), 11-stage rail always-on, duplicate status, internal-label leaks, `STEWARD/SENTINEL/ATLAS NEEDS` (verbatim), exports hogging the header (5 buttons). **Disclaimer-stacking: CONFIRMED** — the code pass wrongly refuted it (grep missed the shared AgentDock); the [screenshot pass](06-screenshot-validation.md) shows two banners stacked on every agent-rail surface. Your original hypothesis was right.

## Order of operations (and status)

1. ✅ Inventory pass (code-grounded) — `01`
2. ✅ Per-page cards + 5-lens scores — `02`
3. ✅ Delete column — `01`
4. ✅ Clutter inventory — `03`
5. ✅ Principles brief — `04`
6. ✅ **Screenshot validation** — authenticated prod-demo walk; spatial findings verified, one refutation reversed, Tier-0 data-inconsistency surfaced — `06`
7. ✅ **Target-state sketches** — redlines + target wireframes + consolidated IA — `07`
8. ✅ **CXO Bible** — the real one is the *testing brief*, rewritten against the target state — `09` (with `08` as the companion design doctrine)

**Audit arc complete.** All deliverables produced; the screenshot pass closed the loop on the spatial findings and surfaced the Tier-0 data-inconsistency, which becomes the **pre-flight Trust Gate** in the rewritten CXO Bible (`09`) — the audit and the value test now share one spine: *one truth, computed once.*

## How to act on this

Work the clutter inventory's **leverage order**: collapse duplicate pages (Tier 1) → kill the dev command + "deterministic" (Tier 3 L1–L2) → merge redundant status (Tier 2) → earned-state hygiene (Tier 5) → reword/trim (Tier 3 L3–L9, Tier 4). The Tier-1 page consolidations are the biggest single win and should be a design decision before code.

> **Design-lock note:** This audit changes *what elements exist and what they say* — it does **not** touch the locked AbarVa design system (colors, fonts, layout grid). Subtraction and relabeling only.
