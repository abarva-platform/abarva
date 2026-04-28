# AbarVa Master Backlog · April 28 2026 · Morning Session

**Authoritative source for the autonomous build loop.** Replaces all prior backlog files for the current cycle.

**Version:** 1.0
**Author:** Founder
**Status:** Ready for autonomous execution
**Target agent:** Codex (GPT-5.4 high) for this morning's session; Claude Code resumes when weekly bucket refreshes (~6h 48min from morning of April 28)

---

## Reading order for the agent

1. This file (master backlog)
2. The kickoff prompt for your specific agent: `abarva-codex-session1-kickoff-prompt.md`
3. Per-module spec for the wave you pick up: `docs/build/{MODULE}_BUILD_SPEC.md` or `_DESIGN_SPEC.md`
4. Orchestration rules: `docs/build/ORCHESTRATION_SPEC.md`

If any of those are missing in `docs/build/`, the kickoff prompt tells you where to copy from.

---

## Status legend

| Symbol | Meaning |
|---|---|
| ✅ | Shipped (merged to main, smoke-passing) |
| 🟡 | In flight (PR open or branch active) |
| 🟧 | Held for human review (auto-approval failed; reason in PR) |
| ⬜ | Ready (dependencies met; can be picked up) |
| ⏸ | Blocked (dependency not yet shipped) |
| 📋 | Planned but not yet specced (needs design doc first) |
| 🔬 | Polish backlog (small, low-risk; pick up when bucket allows) |

---

## What the agent should pick first

**Top of the queue right now:**

1. **PROG-SPEC** (📋) — author the Programs per-module spec. Doc-only. Zero code risk. Critical because Programs is the largest module without a spec, blocking parallelism. **This is the right Codex morning task.**
2. **SRC-S4** (⬜) — Source Wave S4 sub-routes refresh. Small wave, ready to pick up. Run on Sonnet when Claude Code refreshes.
3. **INT-I0** (⬜) — Intelligence audit. Doc-only. Can run in parallel with anything that doesn't touch `src/components/intelligence/**`.
4. **HOME-POLISH** (🔬) — three small polish moves on Home. Tiny. Good warm-up wave or filler when waiting for a longer wave to merge.

The morning prompt directs Codex to **PROG-SPEC first** because it unblocks everything else in Programs and is doc-only (no risk to running code).

---

## The full backlog · by module

### Shell module · ✅ Complete

| Wave | Status | PR | Notes |
|---|---|---|---|
| SHELL-0 Audit | ✅ | — | Done in prior session |
| SHELL-1 Tokens | ✅ | — | `shell-tokens.ts` locked |
| SHELL-2 Layout primitives | ✅ | — | NavRail, TopBar, MiddleStrip, AgentColumn |
| SHELL-3 AppShell wrapper | ✅ | — | All surfaces wrap in this |

**No further work needed unless an architecture change forces it. Touching this module triggers escalation per `ORCHESTRATION_SPEC.md` §13.2.**

---

### Home module · 🟡 Shipped with polish pending

| Wave | Status | Notes |
|---|---|---|
| HOME-0 Default page | ✅ | `HOM-IDX-DEFAULT` shipped |
| HOME-POLISH | 🔬 | 3 polish moves identified Apr 27: tighten Nexus voice density, add peach urgency accent to gate-pending KPI, confirm middle strip presence |

**HOME-POLISH** is small (≈80 lines) and self-contained. Good filler for a session with bucket headroom.

---

### Source module · 🟡 S0–S3 shipped; S4–S6 pending

| Wave | Status | Catalog entries | Estimate | Notes |
|---|---|---|---|---|
| SRC-S0 Audit | ✅ | — | — | PR #531 |
| SRC-S1 Shell convergence | ✅ | All chrome | — | PR #545 |
| SRC-S2 Index pages | ✅ | SRC-IDX-DEFAULT, SRC-IDX-EVENTS, SRC-IDX-VALUE | — | PR #555 |
| SRC-S3 Event canvas | ✅ | SRC-DTL-CANVAS | — | PR #563 |
| **SRC-S4 Sub-routes** | ⬜ | SRC-DTL-SCORECARD, SRC-DTL-ARTIFACT | ~500 lines | **Ready** |
| SRC-S5 Commercial-intel convergence | ⬜ | (internal — 12→4 components) | ~900 lines | Likely held for human review (deletion-heavy) |
| SRC-S6a States + storyline | ⬜ | SRC-STA-LINKED-PROG, SRC-EMP-NO-EVENTS, SRC-ERR-EVENT-NOT-FOUND | ~400 lines | |
| SRC-S6b Evidence + intake | ⬜ | SRC-MOD-EVIDENCE, SRC-MOD-CONTRADICTION, SRC-FLW-INTAKE | ~600 lines | |

**Spec:** `docs/build/SOURCE_BUILD_SPEC.md`
**Smoke:** `S-SMOKE-AMS` (AMS Vendor Consolidation 2026 storyline must render end-to-end)
**Dependencies for next pick:** None — SRC-S4 is unblocked.

**SRC-S4 detail:** Refresh `ScorecardGovernancePanel` and `SourceArtifactDrawer` to paper aesthetic; add `provenance` props; produce 2 mockup HTMLs (`src-dtl-scorecard.html`, `src-dtl-artifact.html`); Sentinel voice per page. Per Source spec §S4.

---

### Programs module · 📋 No spec yet · MOST URGENT

| Wave | Status | Notes |
|---|---|---|
| **PROG-SPEC** | 📋 | **Author per-module spec — TOP PRIORITY THIS MORNING** |
| PROG-P0 Audit | ⏸ | Blocked on PROG-SPEC |
| PROG-P1 Route convergence | ⏸ | Resolves `/programs` vs `/tenant/[slug]/programs` parallelism |
| PROG-P2 Index refresh | ⏸ | PRG-IDX-DEFAULT, PRG-IDX-LINKED |
| PROG-P3 Detail spot-check | ⏸ | PRG-DTL-CANVAS — already authored in code, needs visual drift check vs catalog mockup |
| PROG-P4 Workshop modules | ⏸ | PRG-MOD-WORKSHOP-* family |
| PROG-P5 Evidence + gate | ⏸ | PRG-MOD-EVIDENCE-DRAWER, PRG-STA-GATE-PENDING, PRG-MOD-GATE-APPROVE |
| PROG-P6 States + flows | ⏸ | PRG-EMP-*, PRG-ERR-*, PRG-FLW-ORIGINATE |
| PROG-P7 Cross-surface integration | ⏸ | Programs ↔ Source, Programs ↔ Tower bidirectional links |

**Why this matters:** Programs is the most actively touched module in the recent portfolio sweep (Sprints 5G–5Q put real changes into `programs-fixture.ts`, `programs-detail-view.ts`, `ProgramDetailPage.tsx`, `ProgramOriginationPage.tsx`). But there's no formal wave breakdown, no smoke test definition, no escalation rules for the route convergence. Without the spec, the next agent picking up Programs is in undefined territory.

**Spec authoring scope** (the PROG-SPEC deliverable):
- Identify all PRG-* catalog entries (~20 from the page catalog)
- Document the route family convergence problem (`/programs` shell-wired vs `/tenant/[slug]/programs` legacy)
- Define `P-SMOKE-CDP` smoke test (APX-CDP-2026 storyline through Programs end-to-end)
- Wave breakdown P0–P7 with file-level diff estimates
- Sentinel-equivalent voice register for Nexus on Programs (operational maestro register, distinct from Nexus on Tower portfolio register)
- Document all the recent fixes from Sprints 5G–5Q so the next wave knows the current state

**This is doc-only work.** ~3,000 words. The Codex morning session can complete this without touching code.

---

### Tower module · ✅ All seven waves shipped

| Wave | Status | PR |
|---|---|---|
| TWR-T0 Audit | ✅ | — |
| TWR-T1 Portfolio skeleton | 🟧 | PR #544 (held for human review — doc-file inflation) |
| TWR-T2 Bubble chart + Cost lens | ✅ | PR #546 |
| TWR-T3 Program detail | ✅ | PR #547 |
| TWR-T4 Pressure + Decisions | ✅ | PR #549 |
| TWR-T5 Vendor + Outcome + Decision detail | ✅ | PR #552 |
| TWR-T6 Flow pages (Onboard, Reallocate, Renewal) | ✅ | PR #554 |
| TWR-T7 Empty + Error states | ✅ | PR #557 |

**Action needed from founder:** Review PR #544 when convenient. It contains T0+T1 code which is good — held only because it bundled the spec doc copies pushing it over the 1000-line auto-merge cap.

**Spec:** `docs/build/TOWER_DESIGN_SPEC.md`
**Smoke:** `T-SMOKE-PORTFOLIO`

---

### Intelligence module · ⬜ Spec ready · Build not started

| Wave | Status | Catalog entries | Estimate | Notes |
|---|---|---|---|---|
| **INT-I0 Audit** | ⬜ | — | ~200 lines (docs only) | **Ready — can run in parallel with anything not touching `src/components/intelligence/**`** |
| INT-I1 Library foundation | ⏸ | INT-IDX-LIBRARY (skeleton) | ~600 lines | Depends on I0 |
| INT-I2 Pattern detail + ProvenanceRibbon | ⏸ | INT-DTL-PATTERN | ~700 lines | Signature visual element |
| INT-I3 Signal stream + Signal detail | ⏸ | INT-IDX-SIGNALS, INT-DTL-SIGNAL | ~500 lines | Needs at least one ingestion connector live (Setup dependency) |
| INT-I4 Knowledge graph browser | ⏸ | INT-IDX-GRAPH | ~800 lines | **Hard dependency:** graph store needs ≥50 edges populated; halts if not ready |
| INT-I5 Solutions + Contradictions | ⏸ | INT-IDX-SOLUTIONS, INT-DTL-SOLUTION, INT-DTL-CONTRADICTION | ~700 lines | |
| INT-I6 Atlas synthesis + Authoring | ⏸ | INT-FLW-SYNTHESIZE, INT-FLW-AUTHOR | ~800 lines | Needs Atlas runtime via model gateway |
| INT-I7 Quality lens + Cross-surface | ⏸ | INT-LNS-QUALITY + auto-surfacing in Programs/Source/Tower | ~500 lines | Closes module |

**Spec:** `docs/build/INTELLIGENCE_DESIGN_SPEC.md` (v1.0)
**Smoke:** `I-SMOKE-CDP` (T3-H03 pattern + APX-CDP-2026 instance + 5+ graph nodes + Atlas synthesis with citations)
**Special CI rules required:** `@abarva/atlas-word-cap` (≤150 words on Atlas voice strings), strict `@abarva/no-orphan-data`

**Note for Codex morning:** I0 is doc-only audit work. Audit the existing 23 components in `src/components/intelligence/`, map them to the four-primitive model (Pattern, Signal, Solution, Contradiction), identify gaps, produce skeleton plans I1–I7. Same shape as Source S0 audit. Can run safely in parallel with PROG-SPEC.

---

### Setup module · 📋 No spec yet · Tower I3 dependency

| Wave | Status | Notes |
|---|---|---|
| SET-SPEC | 📋 | Spec authoring needed |
| SET-S0 Audit | ⏸ | Blocked on SET-SPEC |
| SET-S1 Connectors index | ⏸ | SET-IDX-CONN |
| SET-S2 Connector detail + auth | ⏸ | SET-DTL-CONN |
| SET-S3 Microsoft Graph live | ⏸ | First real connector — unblocks Tower's M365 Copilot data + Intelligence I3 |
| SET-S4 GitHub + Anthropic Console | ⏸ | Unblocks Claude Code metrics + GitHub Copilot tracking |
| SET-S5 Users + audit | ⏸ | SET-IDX-USERS, SET-LNS-AUDIT |
| SET-S6 Policies + governance | ⏸ | SET-IDX-POLICIES |

**Why Setup matters:** Without at least one live connector, Tower data stays seeded-only and Intelligence signals can't ingest. Tower I3 (signal stream) and several Tower waves explicitly depend on Setup.

**Recommended order:** SET-SPEC after PROG-SPEC, then INT-I0 in parallel with SET-S0.

---

### Components module · 📋 No spec yet · Cross-cutting

| Wave | Status | Notes |
|---|---|---|
| CMP-SPEC | 📋 | Cross-cutting design system spec |
| CMP-C0 Audit | ⏸ | |
| CMP-C1 Provenance system | ⏸ | ProvenanceRibbon, MissingInputChip, EvidenceRow |
| CMP-C2 Linked surfaces | ⏸ | LinkedProgramChip, LinkedSourceChip, etc. |
| CMP-C3 Storyline | ⏸ | Cross-surface storyline chips |

**Lower priority** — these emerge naturally as other modules need them and are typically created in-flight. Spec can be authored later.

---

## Dependency graph (high-leverage view)

```
SHELL ✅ (locked)
   │
   ├─► HOME ✅ (polish pending 🔬)
   │
   ├─► SOURCE 🟡 (S0-S3 shipped, S4 ⬜ ready)
   │      │
   │      └─► CMP (provenance components emerge in S6)
   │
   ├─► PROGRAMS 📋 (SPEC needed FIRST)
   │      │
   │      └─► CMP (linked-program-chip already exists; will need formalization)
   │
   ├─► TOWER ✅ (all waves shipped, T1 awaiting human review)
   │      │
   │      └─► needs SETUP for live data
   │
   ├─► INTELLIGENCE ⬜ (I0 ready)
   │      │
   │      ├─► I3 needs SETUP (signal ingestion)
   │      ├─► I4 needs cross-module graph data
   │      └─► I6 needs Atlas runtime
   │
   └─► SETUP 📋 (SPEC needed)
          │
          └─► unblocks TOWER live data + INTELLIGENCE I3
```

---

## What "ready" means right now (April 28 morning)

**Fully unblocked, no dependency wait:**
- PROG-SPEC (doc-only)
- SET-SPEC (doc-only)
- INT-I0 (doc-only audit, parallel-safe)
- SRC-S4 (code work, blocked only on which agent picks it up)
- HOME-POLISH (small code work)

**Founder review needed:**
- TWR-T1 PR #544 (held for human review)

**Auto-handleable when an agent has bucket headroom:**
- SRC-S4 → SRC-S5 (likely human review) → SRC-S6a → SRC-S6b
- INT-I0 → INT-I1 → INT-I2 (these three are sequential within Intelligence)
- Anything tagged 🔬

---

## Sequencing strategy for next 72 hours

**Session 1 (this morning, Codex):**
- PROG-SPEC (~2h)
- SET-SPEC (~1h)
- INT-I0 audit (~1h)

End of Session 1: three modules unblocked, Programs ready for code waves, Setup ready for code waves, Intelligence I1 ready to pick up.

**Session 2 (later today, Claude Code on refreshed bucket):**
- SRC-S4 (~1h, Sonnet)
- INT-I1 library foundation (~1.5h, Sonnet)
- HOME-POLISH (~30min, Sonnet)
- SRC-S5 (~1.5h, likely held — Sonnet attempt then escalate)

**Session 3 (next day, mixed):**
- PROG-P0 audit (Codex morning, doc-only)
- PROG-P1 route convergence (Claude Code afternoon, this is the structural one)
- SRC-S6a + SRC-S6b in parallel via different worktrees if conflicts allow

This sequencing assumes the All-models bucket refreshes today. If it doesn't, Session 2 is also Codex-driven and we tilt toward more spec authoring rather than waves.

---

## Worktree / parallelism notes

**The orchestration spec §6 file-glob conflict rule applies.** Two agents can run simultaneously only if their file-touch globs don't intersect.

**Safe parallel pairings right now:**
- Codex on `docs/build/**` (any spec authoring) + Claude Code on `src/components/source/**` (Source S4)
- Codex on Programs spec + Claude Code on Intelligence I1 (after I0 ships)
- Two Codex agents on two different `docs/build/**` specs (PROG-SPEC and SET-SPEC don't overlap)

**Conflicts to avoid:**
- Two agents both writing to `src/components/source/**`
- Anything writing to `src/lib/architecture/**` or `src/lib/shell/shell-tokens.ts` (escalation, not parallelism)
- Two agents both writing to `docs/build/MASTER_BACKLOG.md` (this file — only the orchestrator updates it)

---

## Founder-only items

These are for you, not the agent:

1. **Review PR #544** (Tower T0+T1 — held). Likely safe merge once you've eyeballed the spec doc copies.
2. **Confirm Codex tier** for the morning session. The kickoff prompt assumes it has the same authority bounds as Claude Code; adjust if Codex needs tighter rails.
3. **Consider the Sonnet-first rule** for orchestration spec. The 75% → 98% overnight burn suggests routine waves should default to Sonnet to preserve Opus headroom for ambiguity. One-line addition to ORCHESTRATION_SPEC.md §5.
4. **Backfill JOURNAL.md** if you want the audit trail to match the spec format (Sprints 5G–5Q are thin in the journal).

These are all 5-minute tasks individually. Worth knocking out before the next bucket cycle starts.

---

## Status of this file

**Updated by:** Founder + orchestrator (append-only journal feeds into the table)
**Update protocol:** Orchestrator writes journal entries; table is regenerated from journal. Founder edits priorities directly.
**Next update:** After Session 1 completes, mark PROG-SPEC, SET-SPEC, INT-I0 as ✅ shipped and unlock dependents.

**End of master backlog v1.0**
