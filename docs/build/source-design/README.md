# Source Module Redesign — Design Package

**Audience:** Claude design module (review + refine), then Codex (implement)
**Created:** 2026-06-04
**Companion docs:** `docs/build/cxo-primers/APEX_RETAIL_SOURCE_E2E_CXO_TESTING_BRIEF_2026-06-02.md` (the bar)

---

## Reading order

| # | File | Open in browser | Purpose | Audience |
|---|---|---|---|---|
| 1 | [01-current-state-wireframes.html](./01-current-state-wireframes.html) | ✓ | What's there today · friction points · works-well anchors | Everyone — sets the baseline |
| 2 | [02-end-to-end-wireframes.html](./02-end-to-end-wireframes.html) | ✓ | Full lifecycle current state next to target state · 18 sections from entry through renewal | Design module · CXO reviewers |
| 3 | [03-build-specs.html](./03-build-specs.html) | ✓ | 19 per-surface implementation specs · file paths, props, copy, behavior, acceptance | Design module → Codex |
| 4 | [04-design-module-review.md](./04-design-module-review.md) | (Markdown) | Design module verdicts on all 19 specs · 8 cross-spec questions resolved · Wave 1 cleared | Codex |
| 5 | [05-wireframe-atlas.html](./05-wireframe-atlas.html) | ✓ | **The single visual map** · all 19 specs in one atlas · inline wireframes for every load-bearing surface · the doc Codex keeps open while building | Codex |
| 6 | [06-strategy-screen.html](./06-strategy-screen.html) | ✓ | **Full-fidelity Strategy stage** · the canonical drafting-stage canvas · pattern setter for Specs 5, 6, 8, 9 | Codex |
| 7 | [07-executive-decision-screen.html](./07-executive-decision-screen.html) | ✓ | **Full-fidelity Executive Decision page-1** · dark-charcoal header · 1+3 layout · pattern setter for Specs 12, 15 | Codex |

All files are self-contained — no build step, no JS deps. Open HTML in any browser.

---

## What each doc does

### 01 · Current-state wireframes
14 sections covering every Source page rendered today with proportions matching the production crawl screenshots. Color-coded friction calls (P1 red · P2 amber · works-well green). Identifies seven cross-cutting patterns the redesign must address.

### 02 · End-to-end wireframes
18 parts walking the full sourcing lifecycle — state machine diagram, every stage current-vs-target side by side, exports, cross-cutting patterns, renewal loop.

### 03 · Build specs
19 PR-shaped specs with file paths, component signatures, copy strings, acceptance criteria, and per-spec wireframe references. New in v2: a "Visual references" section (Part 1.5) that tells Codex which atlas section to consult per spec; three locked usage constraints in Part 3 (the "one dark moment" rule, the "no export of nothing" rule, the "empty state is a designed state" rule).

### 04 · Design module review
Per-spec verdicts (9 approved as-is · 10 approved with revisions · 0 rejected). All 8 cross-spec questions resolved with rationale. Wave 1 PR sequencing called out (parallel: Specs 4 · 2 · 7; sequential: Spec 3 after Spec 4 merges).

### 05 · Wireframe atlas
The single visual map. Cover + northstar + token strip + index table + inline wireframes for every load-bearing and net-new surface. Two pattern-setter screens (06, 07) linked from here; every other surface inherits their discipline.

### 06 · Strategy stage — full-fidelity
The canonical drafting canvas. Sentinel rail at ~30%, Next Move card leading, humanized labels, no scaffold jargon, export-gated. Squint test passes (blue "Draft with Sentinel" button unmistakable). Every drafting-stage canvas in the redesign (Scope, RFP, BAFO question pack) matches this fidelity.

### 07 · Executive Decision stage — full-fidelity
The canonical decision-rendering surface. Dark charcoal #1f2937 header — the ONLY dark moment in the lifecycle. 1+3 layout (Recommendation HUGE; Savings / Trade-off / Dissent stack smaller). Squint test passes (recommendation + savings number survive 50% blur). Decision rendering in CXO Report Slide 1 and Deal Pack Page 1 inherit this pattern.

---

## How Codex uses this package

Codex picks up the **refined `03-build-specs.html` + `04-design-module-review.md`** and ships PRs **wave-by-wave**, building against `05-wireframe-atlas.html` (visual map) and `06/07-*-screen.html` (fidelity bar).

### Wave 1 — load-bearing fixes (week 1)

**Phase 1 (parallel — 3 PRs):**
- **Spec 4** — Lifecycle routing guard (middleware, per Q4 review)
- **Spec 2** — Intake completion footer
- **Spec 7** — Artifact tile humanization (WIDENED scope per review — strings the original spec missed)

**Phase 2 (after Spec 4 merges — 1 PR):**
- **Spec 3** — Approval page (depends on routing guard existing)

### Wave 2 — canvas redesign (week 2-3)
Specs 1 · 5 · 6 · 8 — queue triage bands, Next-Move pattern, chat sizing, Strategy refit (matches `06-strategy-screen.html`)

### Wave 3 — stage depth (week 4-5)
Specs 9 · 10 · 11 · 12 — Scope/RFP, Responses/Evaluation, Pricing/BAFO, Executive Decision (matches `07-executive-decision-screen.html`)

### Wave 4 — lifecycle completion (week 6+)
Specs 13 · 14 · 15 · 16 · 17 · 18 · 19 — Transition, Value, Exports, Evidence drawer, Audit log, Attention bell, Renewal auto-event

Each spec ships as its own PR. No PR spans multiple specs.

### Reading order when picking up a spec

1. Read the spec block in **03-build-specs.html** (file paths, props, copy, behavior, acceptance)
2. Open **05-wireframe-atlas.html** and jump to the referenced section
3. If the spec implements a drafting canvas → open **06-strategy-screen.html** in a second tab; match its discipline
4. If the spec implements a decision rendering → open **07-executive-decision-screen.html**; match its discipline
5. Cross-check against **04-design-module-review.md** for the review verdict + revisions on that spec

---

## Related docs

- **The bar:** [docs/build/cxo-primers/APEX_RETAIL_SOURCE_E2E_CXO_TESTING_BRIEF_2026-06-02.md](../cxo-primers/APEX_RETAIL_SOURCE_E2E_CXO_TESTING_BRIEF_2026-06-02.md) — the CXO Testing Brief these specs are designed against
- **L6 audit:** Multiple audit memos in this session captured friction points the specs close
- **Design system memory:** Locked per `feedback_design_locked.md` (2026-04-16) · do not propose color/font changes without explicit approval

---

## Status

| Doc | State |
|---|---|
| 01 Current-state wireframes | ✓ Complete |
| 02 End-to-end wireframes | ✓ Complete |
| 03 Build specs | ✓ v2 · references atlas + pattern setters · three usage constraints locked into tokens |
| 04 Design module review | ✓ Complete · all 19 specs reviewed · 8 cross-spec Qs resolved · Wave 1 cleared |
| 05 Wireframe atlas | ✓ Complete · full atlas · all load-bearing surfaces mapped |
| 06 Strategy screen | ✓ Complete · full-fidelity drafting-stage pattern setter |
| 07 Executive Decision screen | ✓ Complete · full-fidelity decision-rendering pattern setter |
| Wave 1 PRs | ✓ Ready to start |

### Package status

The design package is complete and cross-linked. Codex can build from `03-build-specs.html`, with `04-design-module-review.md` for verdicts and `05-wireframe-atlas.html` plus `06/07` as the visual contract.
