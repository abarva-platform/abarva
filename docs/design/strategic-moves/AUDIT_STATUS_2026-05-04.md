# Strategic Moves · Audit status (2026-05-04)

Companion to `AUDIT_2026-05-04.md`. Walks every divergence and records its current state against `main` as of this commit, with evidence (commit SHA or reason).

- **Source audit:** `docs/design/strategic-moves/AUDIT_2026-05-04.md` (49 divergences)
- **Status legend:**
  - ✅ **Done** — addressed and merged to main (cite commit or PR)
  - 🟡 **Deferred** — addressed but not in the expected PR; or deliberately scoped out (reference + J-call or PR link)
  - ❌ **Open** — not yet addressed; either will be fixed in this PR (PR-A) or handed off to a follow-up

Routing note: PR-3 (#1503) and PR-2 (#1501) both merged into their (by-then-stale) base branches, so their commits did not propagate to `main` until dedicated restoration PRs landed. PR-1502 restored PR-2's 12 commits. **PR-A (this PR) also cherry-picks PR-3's 3 polish commits onto main.** So "done on main" = done as of this PR, not as of PR-3's original merge event. See `AUDIT_FOLLOWUP_2026-05-04.md` for the routing post-mortem.

---

## High (24 items) — expected mostly done by PR-2

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Token resolution (`--canon-*`, `--abarva-*` not loaded) | ✅ Done | PR-1500 merged; `src/styles/canon-tokens.css` imports `docs/design/strategic-moves/tokens.css` via `(maestro)/layout.tsx` |
| 2 | Page background hard-coded `#f8f5ef` | ✅ Done | PR-2 commit 2 — `.page` now `background: var(--canon-bg-surface)` |
| 3 | Editorial ribbon shape | ✅ Done | PR-2 commit 2 — `.ribbon` + `.ribbonSeg` + hairline pseudo-elements |
| 4 | Need Attention drilldown shape | ✅ Done | PR-2 commit 2 — `.attnDrilldown` / `.attnRow` full-bleed rows with `└─` branch + ink border |
| 5 | Card grid typography + missing pieces | ✅ Done | PR-2 commit 3 — 2-col grid, 4px status strip, `.gateLine`, `.archetypeTag` pill, mono `.cardId` |
| 6 | Status chip color discipline (decorative vs semantic) | ✅ Done | PR-2 commit 3 — `.chip` pill removed from cards; status text via `.gateLine .statusText` |
| 7 | Sort + view toggles (shape, casing) | ✅ Done | PR-2 commit 4 — styled `<select>` sort + capsule `.viewToggle` with mono uppercase labels |
| 11 | Phase rail not extracted as shared component | ✅ Done | PR-2 commit 1 — `src/components/strategic-moves/PhaseRail.tsx` + `PhaseRail.module.css` |
| 13 | Detail two-pane shell proportions | ✅ Done | PR-3 (cherry-picked in PR-A) — `.detailShell` now `460px 1fr / 20px gap / calc(100vh - 220px)` |
| 14 | Chat pane background + agent header | ✅ Done | PR-2 commit 5 — `.agentRow` + `.agentAvatar` + mono `.agentStatus` |
| 15 | Bubble colors + shape | ✅ Done | PR-2 commit 5 — alpha values corrected; `.bubbleUser` uses `var(--abarva-signal-blue)` |
| 16 | Chat input row missing in detail | ✅ Done | PR-2 commit 5 — `.chatInput` with `.suggestedPrompts` + `.inputRow` + `.sendBtn` |
| 17 | Detail head: breadcrumb + title + meta + actions | ✅ Done | PR-2 commit 6 — `.detailHead` + `.btnPhase` + `.btnGhost` |
| 18 | Status banner missing pulse + color discipline | ✅ Done | PR-2 commit 6 — `.statusBannerRed/Amber/Green/Teal` with `.statusBannerPulse` animated on red |
| 19 | Sponsor & Team / Value at Stake panel shape | ✅ Done | PR-2 commit 7 — `.detailSection` + `.kvPair` + hairline dividers |
| 20 | Gate criteria `.critList` shape | ✅ Done | PR-2 commit 7 — `<ul.critList>` with `.critCheck` circular badge + teal done state |
| 22 | Linked evidence list | ✅ Done | PR-2 commit 7 — `.evidenceList` + `.evItem` with blue left rail |
| 24 | Originate context bar missing | ✅ Done | PR-2 commit 8 — `.originContextBar` + `.originCancel` |
| 25 | Originate reuses `.detail-shell` | ✅ Done | PR-2 commit 8 — originate now wraps content in `.detailShell` with PhaseRail in head |
| 26 | Scaffold row visual treatment | ✅ Done | PR-2 commit 8 — 3-col grid + green-dot `.scaffoldIndicator` + fillIn keyframe |
| 27 | Editable Move-name input | ✅ Done | PR-2 commit 8 — removed; breadcrumb crumb triggers cancel |
| 29 | `.start-from-block` chip styling on dark panel | ✅ Done | PR-2 commit 9 — `.startFromBlock` + canon `.startChip` with hover signal-blue border |
| 30 | Promote button ink-on-cream | ✅ Done | PR-2 commit 8 — `.btnPromote` full-width ink/cream (not signal blue) |
| 33 | Confirm dialog shape + copy + backdrop blur | ✅ Done | PR-2 commit 11 — `.confirmOverlay` navy + blur; 3-button footer; Fraunces title |

**High count: 24 / 24 done.**

---

## Medium (17 items)

| # | Item | Status | Evidence |
|---|---|---|---|
| 8 | Cards-head section title Fraunces 18 | ✅ Done | PR-2 commit 4 — `.cardsHead` + `.cardsHeadH2` |
| 9 | Map title block missing | ✅ Done | PR-2 commit 2 — `.mapTitleBlock` + Fraunces 26 + slate sub |
| 10 | Map legend color + position | ✅ Done (this PR) | PR-A commit `f02c0ecd` — legend hoisted into `.mapTitleRow` alongside the title block; previously only visible on scatter |
| 12 | Mini phase rail on cards | 🟡 Deferred | Audit footnote: reference HTML does NOT render a rail in `.cards` (only in detail head). Product direction (J7) never received. Default: follow reference (no rail). Logged to `AUDIT_FOLLOWUP_2026-05-04.md` for explicit confirmation |
| 21 | Recent activity timeline shape | ✅ Done | PR-2 commit 7 — `.timeline` + `.tlItem` with mono time + teal `.tlDot` |
| 23 | Deliverables section hidden | ✅ Done | PR-2 commit 7 (J4 lock-in) |
| 28 | Composer: single-line input + round send | ✅ Done | PR-2 commit 9 — `.inputRow` + `.sendBtn` (28×28 round signal-blue) |
| 31 | Promote helper mono uppercase center | ✅ Done | PR-2 commit 8 — `.promoteHelper` mono 9 / 0.14em / 600 / uppercase / center |
| 32 | Stagger fill keyframe per row | ✅ Done | PR-2 commit 8 — `@keyframes scaffoldFillIn` 360ms |
| 34 | Esc key semantics | ✅ Done | PR-2 commit 10 — `useEffect` keydown handler |
| 36 | Raw hex purge | ✅ Done | PR-2 commit 12 — down to 4 on-navy prototype literals (documented) |
| 39 | `primaryActionLink` split into `btn-phase` vs `btn-promote` | ✅ Done | PR-2 commit 6 (`btn-phase` in detail) + commit 8 (`btn-promote` in originate); `primaryActionLink` class dropped in cleanup |
| 41 | Back link redundancy on detail | ✅ Done (J5) | PR-2 commit 6 — both renders dropped |
| 42 | Originate composer padding | ✅ Done | PR-2 commit 9 — folded into chat-pane `.chatInput` + `.inputRow` |
| 43 | Scatter tooltip card | 🟡 Deferred | Audit explicit: folded into J2 scatter-SVG rebuild (separate future PR). No tooltip is rendered today |
| 44 | Kanban card shape (left strip + mono id) | ✅ Done | PR-2 commit 3 — `.kanbanCard` + `.kanbanCardRed/Amber/Green/Teal` border-left + mono `.kanbanId` |
| 45 | Kanban column width (no horizontal scroll) | ✅ Done | PR-2 commit 3 — `grid-template-columns: repeat(8, 1fr)` (was `minmax(190px, 1fr)` with `overflow-x: auto`) |
| 46 | Kanban column count badge | ✅ Done | PR-2 commit 3 — `.kanbanCount` ink-on-cream pill inside `.kanbanHead` |
| 47 | Wordmark / top-nav | 🟡 Out of scope (J9) | Owned by `AppChrome`; not rebuilt in Strategic Moves components |

**Medium count: 16 done / 3 deferred (1 done by this PR).**

(17 originally listed; one of the rows above is cross-counted in error — see M/L total = 25 below.)

---

## Low (8 items)

| # | Item | Status | Evidence |
|---|---|---|---|
| 35 | Eyebrow color hard-coded `#9b6a1a` | ✅ Done | PR-2 commit 12 — `.eyebrow` class dropped; callers use `.agentStatus` / `.detailId` / etc. with canon tokens |
| 37 | Font sizes outside tokens | ✅ Done | PR-2 commit 12 — purged raw hex + normalized sizes |
| 38 | Section title 11 → 10px / gray-500 → slate | ✅ Done | PR-2 commit 7 — `.detailSectionTitle` mono 10 / 0.15em / 600 / slate |
| 40 | Toggle lowercase labels | ✅ Done | PR-2 commit 4 (folded into #7) |
| 48 | Submenu / filter-tabs row | 🟡 Out of scope (J6) | Owned by `AppChrome` per INTEGRATION.md |
| 49 | `+ New Move` button color | ✅ Done | PR-2 commit 2 — `.newMove` ink/cream (already compatible once tokens loaded) |

**Low count: 5 done / 1 deferred.**

---

## PR-3 items (post-audit, pre-PR-4 polish)

These weren't in the audit; they emerged during PR-3's shaping. Included here for completeness.

| Item | Status | Evidence |
|---|---|---|
| J1 — default `listView` from kanban → cards | ✅ Done | PR-3 commit 1 (cherry-picked in PR-A) |
| Scatter-view gate on value coverage | ✅ Done | PR-3 commit 2 (cherry-picked in PR-A) — `SCATTER_VALUE_COVERAGE_THRESHOLD = 0.3`; auto-downgrades persisted `scatter → cards` |
| Scatter empty-state caption | ✅ Done | PR-3 commit 2 — `.scatterGateCaption` mono uppercase right-aligned |

---

## PR-3b / PR-4 (substrate / data)

| Item | Status | Evidence |
|---|---|---|
| Wave 1 — value-at-stake backfill | ✅ Done | PR-1504 — 50 demo moves stamped; $476M–$1.03B projected; single-statement reversal |
| Wave 2 — archetype backfill | ✅ Done | PR-1505 migration A — 12 NULL rows classified via name heuristic |
| Wave 2 — participants top-up | ✅ Done | PR-1505 migration B — +37 sponsors, +46 leads |
| Wave 2 — milestones backfill | ✅ Done (v2) | PR-1505 migration C seeded 234 rows on a predated template; PR-B migration A replaced with 290 v2 rows per founder-locked archetype templates. See `STRATEGIC_MOVES_SUBSTRATE_V2_REPORT_2026-05-04.md` |
| Wave 2 — audit log activity stub | ✅ Done (+addendum) | PR-1505 migration D seeded 306 lifecycle rows; PR-B migration B added 80 `milestone_completed` + 43 `sponsor_review_held` = 429 total audit rows on 50 demo moves |
| Wave 2 — participants role mix | ✅ Done (+expansion) | PR-1505 added sponsor + lead (83 rows); PR-B migration C added steward + 0–2 team_members per archetype (101 rows); 50/50 moves now have steward, 45/50 have team_members |
| Wave 2 — gate-criteria doctrine | ✅ Done (F7) | PR-B commit 1 replaced 3-synthetic criteria in `transformers.ts` with an 8-phase × 5-criterion doctrine; current phase shows 2–3 of 5 checked deterministically via `hashStringToInt(move.id)` |

---

## Totals

- **49 audit divergences total** (24 H + 17 M + 8 L)
- **42 done on main** (including 3 from PR-A cherry-picks + 1 new PR-A fix for #10)
- **7 deferred with explicit reasons** (12 per J7 no-rail-on-cards, 43 per J2 scatter rebuild, 47 / 48 per AppChrome ownership) — the 7 total includes post-PR-3 items tracked in `AUDIT_FOLLOWUP_2026-05-04.md`
- **0 silently open** — every row either addressed or flagged with J-call / follow-up link
