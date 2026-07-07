# Source — Execution Plan: audit → best-in-class, fully tested

How we turn the [target state](07-target-state-sketches.md) into shipped, tested code. Sequenced by leverage × dependency, each milestone independently shippable, flag-gated where risky, and gated by the [CXO Bible](09-source-cxo-testing-brief-target-state.html) acceptance bars.

## Execution principles

- **Subtraction is the work.** Most milestones *delete or merge*. Net LOC should drop.
- **Test-first against the Bible.** Every milestone names the test that proves it and the Bible bar it must pass. "Done" = tests green + bar met, not "code written."
- **Flag-gated cutover.** Risky route/IA changes ship behind an env gate (the `gate-approval-strict-mode.ts` pattern) so rollback = flag off. Dead-code deletion ships directly.
- **Release discipline (AGENTS.md).** Each milestone = `global-control-lane`, gets a release record under `docs/releases/records/`, passes `npm run release:check`.
- **Design-locked.** Subtraction / relabel / restructure only — no change to the locked color/font/layout system.
- **No prod DB mutation.** The Tier-0 fix is a **read-path** consolidation (compute existing data once); no schema change, no migration.

## What "fully tested" means here

Five layers, all wired to existing infra:

| Layer | Mechanism | New for this work |
|---|---|---|
| **Automated Trust Gate** | behavior test asserting every surface yields identical KPIs from one fixture | `src/__tests__/behaviors/source-portfolio-metrics.test.ts` |
| **Language-canon guard** | test that scrapes buyer-facing strings and fails on banned lexicon (`deterministic`, codenames, raw IDs, `computeBaseline`, dev commands) | `src/__tests__/behaviors/source-language-canon.test.ts` |
| **Nav / redirect** | `npm run test:nav` (active-state) + e2e redirect assertions | extend `tests/unit/nav-active-state` |
| **E2E journey** | Playwright — extend `tests/e2e/source/cxo-journey.spec.ts` + `golden-event-apex-ams.spec.ts` with Trust-Gate + 2-surface-nav + canvas-frame assertions | extend existing specs |
| **Manual acceptance** | the [CXO Bible](09-source-cxo-testing-brief-target-state.html): pre-flight Trust Gate + two-part (Value+Experience) scorecard, walked by a VP-IT-Sourcing persona | the Bible itself |

**Per-milestone gate:** `npm run test:before-commit` (nav + behaviors + integration + build) green, plus the milestone's named test, plus `release:check`.
**Overall "best-in-class" exit:** the CXO Bible passes — Trust Gate clears, every Value dimension ≥ 7, Consistency ≥ 7.

## Milestones

### M0 · Canonical metrics + automated Trust Gate  ·  *Tier 0*  ·  highest leverage, read-only
**Closes:** the contradictory-numbers finding (3 events/$74M vs 2/$39M).
- New `src/lib/source/portfolio-metrics.ts` — one `computeSourcePortfolioMetrics(events)` returning the canonical set: **Open value · At-risk exposure · Active · Waiting · Oldest stage age**.
- Refactor every consumer to call it: `portfolio-filtering.computePortfolioKpis`, the inline math in `SourceEventsEntryHeader` (events page), the Decision Queue, the event-canvas context strip, the value ledger.
- **Test:** `source-portfolio-metrics.test.ts` — one fixture, assert all consumers return identical numbers. + e2e: load Decisions, Portfolio, event canvas; assert headline value/count match.
- **Flag:** none (pure refactor). **Rollback:** revert commit. **Lane:** global-control-lane.

### M1 · IA consolidation + delete dead code  ·  *Tier 1*
**Closes:** 4 homes → 2; two event-detail impls → one; branch/prod redirect drift.
- **Delete** `src/components/source/SourceEventDetailPage.tsx` (2,178 LOC, **no importers — verified dead**). Removes the bulk of the jargon leaks for free.
- `/source` → Decisions (canonical home, passes squint). `/source/queue` → redirect to `/source`. `/source/events` → redirect to `/source/portfolio` — **after** moving its unique value (linked-program hint, per-event next-action) onto queue cards + portfolio rows.
- Sub-nav `Queue · Events · Portfolio` → **`Decisions · Portfolio`**.
- **Flag:** `SOURCE_IA_V2` env gate wraps the redirect/subnav cutover; resolves the prod drift deliberately.
- **Test:** `test:nav` active-state for 2 tabs; e2e redirect assertions; e2e 2-tab subnav. **Rollback:** flag off.

### M2 · Event-canvas frame-strip  ·  *Tier 2 + 5*
**Closes:** redundant status, 11-node rail, 5 export buttons, 45% chat rail, earned-state.
- Merge context strip into tab badges (delete the strip). Stage rail → done+current+next + "All stages" toggle. Five header buttons → one `Export ▾`, shown only when an artifact exists. Agent rail → narrow/collapsed default (`defaultMode`/`defaultLeftPercent`). Hide "Mark Complete" until past not-started. Replace the `npm run db:backfill` empty state with calm copy.
- **Test:** behaviors (one-status assertion, earned-state) + e2e (rail collapsed, export menu, stage-rail collapse).

### M3 · Language-canon sweep + guard + disclaimer  ·  *Tier 3*
**Closes:** "deterministic" ×30+ (mostly gone after M1 delete — sweep the rest), `computeBaseline()`, codename chips → "Needed", raw filenames → human titles, `PAT_SRC`/`vendor_contracts` IDs → hover, stub/outline tiers. Disclaimer: 2 banners → **1 persistent + contextual** on action controls (AgentDock).
- **Test:** `source-language-canon.test.ts` guard (prevents regression) + snapshot/e2e.

### M4 · Decision Queue + intake polish  ·  *Tier 2/4*
**Closes:** 6 entry chips, evidence-ID leak, triple-progress, over-coaching.
- Queue: 6 "I have a…" chips → one `[+ Start ▾]`; hide raw evidence ID (keep "Where did this come from?"). Intake: keep per-field state, drop the "N captured" strip + Capture Queue; trim subhead; guidance → dismissible hint; "Step 0 · Sentinel" → "New event."
- **Test:** behaviors + e2e intake/queue.

### M5 · Acceptance — run the CXO Bible  ·  best-in-class gate
- New `tests/e2e/source/cxo-bible-acceptance.spec.ts`: automatable Bible bars — Trust Gate (numbers reconcile across 3 surfaces), non-truncation, citations present, 2-format download, banned-lexicon clean, stage-vocabulary consistent.
- **Manual:** VP-IT-Sourcing persona walks a full Apex AMS event, scores Part A (Value) + Part B (Experience). **Pass = 7+ on every Value dim AND Consistency ≥7 AND Trust Gate clears.**

## Dependency / sequence

```
M0 (metrics) ──┬─► M1 (IA + delete) ──► M2 (canvas) ──► M3 (language) ──► M4 (queue/intake) ──► M5 (Bible acceptance)
               └─► M3 language guard can start in parallel (independent of M1/M2)
```
M0 first (everything inherits the number's credibility). M1's dead-code delete can land on day one regardless. M5 runs continuously as bars come online, formally last.

## Decisions already made (with rationale)

- **Retire legacy event-detail = delete the file** — verified zero importers; not a migration.
- **Canonical home = Decisions** — it passes the squint test; Events fails it worst.
- **`/source/events` → `/source/portfolio`** — it's the table view; the operating-queue narrative folds into Decisions.
- **Cutover = flag-gated per workstream** (`SOURCE_IA_V2`, …), big-bang only for dead-code deletion. Resolves prod drift safely.
- **Read-path only** — no schema/migration; canonical metrics compute from existing data.

## Decisions that need your call

1. **Aggressiveness/scope:** full best-in-class build (M0–M5) vs a **Trust-Gate-first pilot slice** (M0 + M1 delete + M3 language only) to de-risk a near-term pilot fastest.
2. **Canonical KPI set:** confirm the five (Open value · At-risk · Active · Waiting · Oldest age), or specify the exec set you want.
3. **Mode:** start M0 now autonomously (per standing overnight-autonomy authority) vs approve this plan first.

## Definition of done (overall)

`test:before-commit` green · new Trust-Gate + language-canon guards green · `cxo-bible-acceptance.spec.ts` green · CXO Bible manual walk ≥7 everywhere with Trust Gate clear · release records filed · `release:check` clean · net LOC down.
