# Codex Handoff · Pilot Prep Package

**Locked:** 2026-05-09
**Pilot week:** 2026-05-12 to 2026-05-16 (next week)
**Pilot tenant:** Apex Retail (already configured · 7 initiatives, 6 vendors, KPIs/decisions/scenarios loaded)
**Pilot users:** 2-3 CXOs (CFO + CIO + possibly CTO)
**Outcome:** A Codex-sized handoff package that lets Codex do the implementation + augmentation work for next week's pilot, without consuming further Claude budget on tasks that don't need design judgment.

---

## Why this package exists

Pre-pilot critical path has 5 blockers that need to land by **end-of-day 2026-05-11** to give one full day for human smoke-test before CXOs arrive:

1. **`todayIso` is pinned to 2026-05-07** in `src/app/(maestro)/tower/page.tsx`. By pilot week it's stale — vendor renewal calculations drift.
2. **Apex substrate is thinner than insight-grade demands.** Atlas drill-downs need richer KPI history, decision dissent, stakeholder notes with consent.
3. **Atlas reasoning module not implemented.** Training package v1.1 specs the contract; ~2-3 PRs to implement.
4. **"Ask Atlas" chip doesn't exist.** ⓘ panel is static; CXOs will click and find nothing.
5. **Pilot smoke-test surface untested.** All 4 lenses, 5 tabs, drill-downs — needs end-to-end check.

This package gives Codex everything it needs to land all five.

---

## What's in the box

```
codex-handoff-pilot-prep/
├── README.md                              (this file)
├── 00-CODEX-OPERATING-MODEL.md            what Codex should + shouldn't take
├── 01-CONTEXT-BUNDLE.md                   exact files Codex needs to read first
├── 02-IMPLEMENTATION-PLAN.md              sequenced work · 5 PRs · acceptance criteria
├── 03-PILOT-PREP-CHECKLIST.md             pre-flight gate · 25 items
├── 04-CXO-SCENARIO-CATALOG.md             Apex walkthrough scripts · click paths · expected Atlas
├── 05-APEX-SUBSTRATE-AUGMENTATION.md      what to add to Apex data · schema-valid fixtures
└── 06-CRITICAL-PATH.md                    today=2026-05-09 issue + 4 other blockers
```

Total: ~1500-2000 lines. Designed to be self-contained for Codex without further Claude calls.

---

## How to give this to Codex

Recommended workflow:

1. **Set Codex's working directory** to the repo root
2. **Hand it this README first**, then `01-CONTEXT-BUNDLE.md`
3. **Codex reads the existing Atlas Training Package** (`docs/build/atlas-agent-training-package-v1/`, 13 files)
4. **Codex follows the IMPLEMENTATION_PLAN** in 02 — 5 PRs, sequenced
5. **Codex builds substrate per** 05-APEX-SUBSTRATE-AUGMENTATION.md
6. **Human runs the** 03-PILOT-PREP-CHECKLIST before CXOs arrive
7. **Human uses** 04-CXO-SCENARIO-CATALOG **as walkthrough script** during pilot

---

## What success looks like by 2026-05-11

A 25-item checklist (full list in `03-PILOT-PREP-CHECKLIST.md`) green:

- ✅ todayIso resolves correctly · vendor renewals show plausible windows
- ✅ Apex substrate has 4+ KPI quarters per initiative
- ✅ Atlas reasoning module passes ≥ 75% of 24 eval cases
- ✅ "Ask Atlas" chip launches chat with metric context
- ✅ Atlas chat answers the 12 catalog scenarios from 04-CXO-SCENARIO-CATALOG
- ✅ All 4 lenses + 5 tabs render without console errors
- ✅ ⓘ panel opens on every band tile
- ✅ 2×2 dots don't collide
- ✅ Strategic Bets row shows substrate-derived cards
- ✅ "Coming next" block visible above doctrine line
- ✅ No cross-tenant data leak (Apex-only Atlas references)
- ✅ Trace log captures observations to `atlas_reasoning_traces`
- ✅ Browser smoke pass on Vercel preview

---

## What this package is NOT

- **Not a re-spec of Atlas behavior.** That lives in `docs/build/atlas-agent-training-package-v1/`. Codex reads both packages.
- **Not a replacement for human pilot judgment.** Codex implements; humans drive the demo and read CXO body language.
- **Not a CIO View build.** That's a separate post-pilot wave.
- **Not a full reasoning v2.** v1 ship gate is 75% eval pass; tuning happens after pilot via observation cycles.

---

## Time estimate (Codex-driven)

- Day 1: Read packages + implement `todayIso` fix + Apex substrate augmentation (PRs 1-2)
- Day 2: Atlas reasoning module + system prompt + eval harness (PRs 3-4)
- Day 3: "Ask Atlas" chip + trace log table + DB migration (PR 5)
- Day 4: Eval pass + tune to ≥ 75% + smoke tests
- Day 5 (Sun): Human smoke pass + scenario rehearsal + go/no-go

Then pilot Mon-Fri.
