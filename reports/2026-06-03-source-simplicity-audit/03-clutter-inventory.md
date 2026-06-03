# Source — Clutter Inventory (cross-page, sorted by leverage)

The element inventory ([01-element-inventory.csv](01-element-inventory.csv)) is per-element. This is the **cross-page** view: the same clutter pattern repeated across pages, sorted by how much calm you buy by fixing it.

---

## TIER 0 — The numbers contradict each other (fix first; trust-breaker)

Verified live in the [screenshot pass](06-screenshot-validation.md): the three home views compute the same KPIs independently and have **drifted**.

| Home view | Event count | Value |
|---|---|---|
| `/source/events` | **3** | **$74.0M** |
| `/source/portfolio` | **2** | **$39.0M** |
| `/source/queue` | "23 decisions" | per-card |

A CXO sees 3 events / $74M, clicks once, sees 2 events / $39M. **One canonical scorecard, computed once, consumed everywhere.** This is the highest-severity finding in the audit and the strongest argument for the Tier-1 consolidation below.

## TIER 1 — Structural duplication (delete whole pages/routes)

These aren't elements; they're entire surfaces doing the same job. Highest leverage by far.

| # | Finding | Evidence | Action |
|---|---|---|---|
| S1 | **4 overlapping "home" views** of the same event set | `/source` (Decision Queue), `/source/queue` (same), `/source/portfolio` (scorecard+table), `/source/events` (operating queue) | Pick ONE home. Recommend: `/source` = Decision Queue (act-mode), `/source/portfolio` = the table (reference). Delete `/source/queue` (dupe) and `/source/events` (dupe of portfolio). |
| S2 | **2 KPI vocabularies** for one dataset | Portfolio: *Total value / Open pipeline / Active / Waiting / At-risk / Oldest age*. Events: *Events / Waiting / Blocked / Linked programs / Value at stake* | One canonical scorecard definition, used everywhere. |
| S3 | **2 parallel event-detail implementations** | New canvas (`UniversalCanvasShell` + workspace-tabs) vs legacy [SourceEventDetailPage.tsx](src/components/source/SourceEventDetailPage.tsx) (~2,000 lines) | Retire one. The legacy page carries most of the jargon leaks below. |

**These three findings account for ~40% of the surface's pages.** Fixing them is the audit's single biggest win.

---

## TIER 2 — Redundant status conveyance (pick the canonical one)

Multiple elements telling pieces of the same status story on one screen. (Validates your "duplicate status conveyance" hypothesis.)

| # | Page | Conveyors stacked | Keep | Drop/merge |
|---|---|---|---|---|
| R1 | Event canvas | context-strip eyebrow ("Readiness u/t · Artifacts a/T") **+** tab badges (Gate met/total, Evidence usable/total, Document count) | Tab badges | Context strip |
| R2 | Portfolio | event count in top-bar **+** subline **+** sub-header result | Sub-header result (next to filter) | Other two |
| R3 | Portfolio scorecard | Open pipeline **+** Active **+** Waiting (one pipeline split, 3 tiles) | One pipeline-health metric | Other two |
| R4 | Scorecard page | shell status badge **+** lifecycle strip **+** readiness meter **+** approval counter | One status + one meter | Other two |
| R5 | `/new` intake | context strip ("N of M captured") **+** Capture Queue **+** per-field chips | Per-field chips | Capture Queue + strip count |

---

## TIER 3 — Internal-label leaks (reword; each is a trust paper-cut)

The promise-asymmetry surface: UI promising sophistication, leaking developer/internal language.

| # | Leak | Where | Severity | Reword to |
|---|---|---|---|---|
| L1 | **`npm run db:backfill:source-canvas`** | Document tab empty state ([DocumentTab.tsx:149](src/components/source/canvas/workspace-tabs/DocumentTab.tsx:149)) | **HIGH** — dev command shown to user | "No documents yet for this stage. They'll appear as Sentinel drafts them." |
| L2 | **"Deterministic" / "Deterministic event report"** (30+) | [SourceEventDetailPage.tsx](src/components/source/SourceEventDetailPage.tsx), scorecard, report, portfolio | **HIGH** — meaningless to buyer | Say what it is: "citation-backed report"; delete the adjective. |
| L3 | **`Sentinel needs` / `Steward needs` / `Atlas needs`** | intake field chips ([SourceOriginatePage.tsx:506](src/components/source/SourceOriginatePage.tsx:506)) | MED — agent codenames as labels | "Needed" / "Optional" |
| L4 | **`PAT_SRC…` citation codes** (10) | [SourceEventDetailPage.tsx](src/components/source/SourceEventDetailPage.tsx) | MED — internal codes in citations | Human source name; code in hover only |
| L5 | **TIER: STUB / "stub"/"outline"/"rich"** | [SourceArtifactDrawer.tsx](src/components/source/SourceArtifactDrawer.tsx), glossary | MED — internal fidelity tiers | "Draft / In progress / Final" or hide |
| L6 | **"seeded projected exposure" / "All seeded criteria"** | events scorecard, scorecard page | MED — admits demo data | Drop "seeded"; state the number plainly |
| L7 | **"substrate" / "hydrate" / "ramp"** | Document/Evidence tab copy | LOW | Plain verbs: "set up" / "fill in" |
| L8 | **"Step 0 · Sentinel" / "Step 4" / "Step 6"** | intake eyebrow, vendor section labels | LOW — internal stage numbers | Drop or use plain stage names |
| L9 | **"waiver path"** | Gate tab subline | LOW | "request an exception" |
| L10 | **`computeBaseline()`** (a function name in buyer copy) | [value/page.tsx:101](src/app/(maestro)/source/events/[eventId]/value/page.tsx#L101) | **HIGH** — worst leak in the surface | Delete; state the baseline in plain words |
| L11 | **`runtime` / `seed`** wording | [SourceValueLedger.tsx:388,399](src/components/source/SourceValueLedger.tsx#L388) | MED | Drop from CFO-facing value page |

> **Credit:** L10/L11 surfaced in Codex's parallel pass on `/source/events/[eventId]/value` (outside the original 10-route scope). Verified in code and adopted. The value page is the **least Apple-like surface in the core set** — make it CFO-clean, zero implementation language.

| R-banner | **Disclaimer stacking** (2 banners, every agent-rail surface) | "HUMAN APPROVAL REQUIRED: AGENT-SUGGESTED ACTIONS ARE PROPOSALS ONLY…" **+** "AI may produce errors. You are responsible…" — in the shared AgentDock | MED — wallpaper | One persistent line; surface the rest contextually. |

> **Correction:** the code pass *refuted* disclaimer stacking (grep missed it — the strings live in the shared AgentDock, not Source components). The [screenshot pass](06-screenshot-validation.md) **confirmed it is real** and renders on every Source surface with the agent rail. The original hypothesis was right.

---

## TIER 4 — Explain-mode copy (trim; show, don't tell)

Long helper text that explains the UI instead of letting it act.

| # | Page | Words | Action |
|---|---|---|---|
| E1 | `/source/events` subline | 39 | Delete (page deleted anyway) |
| E2 | `/new` subhead | 40 | One line |
| E3 | `/new` guidance cards (×3) | ~45 | Dismissible first-run hint |
| E4 | `/compare` intro | 35 | One line |
| E5 | Evidence tab 7-state legend | always-on glossary | Collapse to popover |

---

## TIER 5 — Earned-state hygiene (hide until earned; calm the unhappy path)

| # | Finding | Action |
|---|---|---|
| H1 | 3 export buttons (CXO Report / PPTX / Deal Pack) always visible before artifacts exist | Hide under "Export ▾" until an artifact exists |
| H2 | "Promote" disabled (not hidden) when 0 criteria evaluated | Hide until criteria exist |
| H3 | 11-stage rail always fully shown | done + current + next; "All stages" toggle |
| H4 | Sentinel chat rail open at 45% by default | collapsed/narrower default, expand on focus |
| H5 | Scorecard/BAFO tables render empty with confident headers, no copy | Add empty-row copy |
| H6 | `/compare` silently renders empty/duplicate selections | Add guard state |

---

## Leverage order (do in this sequence)

0. **Tier 0** — one canonical scorecard, computed once. Stops the numbers from contradicting each other; must precede or accompany Tier 1.
1. **Tier 1** — collapse the duplicate pages. Removes whole surfaces; everything downstream shrinks.
2. **Tier 3 L1–L2** — kill the dev command and "deterministic." Cheapest trust wins.
3. **Tier 2** — merge redundant status conveyors on the pages that survive Tier 1.
4. **Tier 5** — earned-state hygiene.
5. **Tier 3 L3–L9 + Tier 4** — rewording and trimming, surface-wide.
