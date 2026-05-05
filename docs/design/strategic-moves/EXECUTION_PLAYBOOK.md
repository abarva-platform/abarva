# Strategic Moves Detail Pages
## Execution Playbook · Step-by-Step Order with QA & Merge Gates

| | |
|---|---|
| **Doc ID** | `STRATEGIC_MOVES_EXECUTION_PLAYBOOK_2026-05-05` |
| **Version** | 0.1 |
| **Date** | 2026-05-05 |
| **Companion to** | `SPECS_AND_AGENT_TRAINING_WBS.md` v0.3 |
| **Repo path** | `docs/design/strategic-moves/EXECUTION_PLAYBOOK.md` |
| **Status** | Draft for kickoff |

---

## 1 · How to read this playbook

This document specifies the **execution order** of work packages defined in the WBS, with **QA built in** at each step and **merge approval gates** required before progress.

Every step has six elements:

- **Trigger** — what condition allows this step to start
- **Owner** — who picks up the work (Claude Code, Claude chat, Anand)
- **Branch + PR** — branch name and PR title convention
- **Deliverable** — what gets produced
- **Self-QA** — checks the owner runs before opening PR
- **Merge gate** — what Anand checks before merging to main
- **Unblocks** — what becomes possible after merge

Steps marked **[CRITICAL PATH]** delay everything downstream if slipped. Steps marked **[PARALLEL OK]** can run alongside other steps in the same phase. Steps marked **[HARD HOLD]** cannot start until a specific external event completes.

---

## 2 · Universal conventions (apply to every step)

### 2.1 Branch naming

| Work type | Branch prefix | Example |
|---|---|---|
| Spec doc | `spec/` | `spec/originate-l1-anatomy` |
| Agent training | `agent/` | `agent/p0-training-pack` |
| Infrastructure | `infra/` | `infra/spec-repo-skeleton` |
| Substrate migration | `substrate/` | `substrate/phase-enum-migration` |
| Implementation | `impl/` | `impl/originate-page-shell` |

**Hard rule:** every PR targets `main` directly. No stacked PRs against predecessor branches. (This was a recurring failure in prior cycles — codified as universal.)

### 2.2 PR title convention

`[CATEGORY] Description (Work-Package-ID)`

Examples:
- `[SPEC] Originate Layer 1 Anatomy (O-1.1)`
- `[AGENT] P0 Originate Training Pack (T-P0)`
- `[INFRA] Spec repo skeleton (F-02)`
- `[SUBSTRATE] Phase enum 8→6 migration (B-027)`

### 2.3 Universal self-QA checklist (every PR, every type)

The owner runs these before opening a PR. PRs that don't pass self-QA get rejected at review without further discussion.

1. Branch named per §2.1
2. PR title formatted per §2.2
3. PR description references the work package ID and links to the WBS
4. Single work package per PR (no scope creep, no opportunistic refactors)
5. Targets `main` (not a predecessor branch)
6. Decision log entry added to WBS §13 if any decisions were made during the work
7. Substrate gaps (if any) logged with link to a backlog item

### 2.4 Spec PR additional QA (Layer 1-5 docs)

8. Internal consistency: every element ID in Layer 2/3/4/5 references an ID defined in Layer 1
9. Cascade fidelity: spec describes what `16-flow-cascade.html` (locked v0.1) shows
10. Acceptance demo alignment: spec does not contradict WBS §11.4 demo script
11. Cross-spec consistency: no contradiction with other already-merged spec docs
12. Substrate verification: every data binding maps to real substrate OR backlog item

### 2.5 Agent training pack PR additional QA

8. All 21 fields of schema populated (no nulls except where field genuinely empty for this phase)
9. Required patterns resolve in catalog (no 404)
10. Required artifacts resolve to existing deliverable codes
11. Workflow steps each pass `completion_criteria` against fixture
12. 5 fixture scenarios drafted with expected behavior
13. Anti-hallucination rules tested: 3 prohibited prompts → expected refusal documented

### 2.6 Implementation PR additional QA

8. Build green
9. Tests pass (existing + new)
10. Type checks pass
11. Lint passes
12. Visual diff against design reference attached for UI work
13. Smoke test on at least 1 demo tenant
14. PR references the spec layer or training pack being implemented

### 2.7 Merge approval rules

- **Anand is the sole merge approver for every PR.** No self-merge by Claude Code or any agent under any condition.
- **Spec PRs:** Anand reviews within 3 business days of opening. If review takes longer, calendar slips, not the gate.
- **Substrate migration PRs:** Anand reviews migration SQL line-by-line. Highest care category.
- **Implementation PRs:** Anand reviews diff and runs through one happy-path interaction before approving.

### 2.8 Decision log discipline

If a decision is made during work that doesn't have a §12 entry, the owner adds it to WBS §13 (decision log) in the same PR. Decisions made silently and discovered later are the worst kind of debt.

### 2.9 Claude chat → repo handoff convention

Some steps are owned by "Claude (chat)" with a `Branch + PR` specified (Steps 0.2, 9.1, 9.2, 9.5). Claude chat has no repo write access. The handoff works as follows:

1. Claude chat produces the deliverable in the conversation as a code block or markdown block
2. Anand copies the content into a file at the specified repo path
3. Anand commits it on the specified branch and opens the PR with the specified title
4. Merge gate proceeds normally

Claude chat's "Self-QA" in these steps refers to quality checks the chat conversation runs before declaring the output ready for copy-paste. The PR title and branch are provided so Anand has zero ambiguity about naming.

---

## 3 · Execution Phases — overview

```
Phase 0 (this week)        — Anand resolves §12, audit completes
Phase 1 (week 1)           — Foundation
Phase 2 (week 2)           — Cross-phase capability + T-P0 + O-1
Phase 3 (weeks 2-4)        — Originate canary (Layers 1-4)
Phase 4 (weeks 4-5)        — Originate Layer 5 + IG; T-P1, T-P2 in parallel
Phase 5 (weeks 4-7)        — Workspace anatomy/state/interactions; T-P3, T-P4 in parallel
Phase 6 (weeks 7-8)        — Workspace data binding + T-P5 + pack deployment
Phase 7 (weeks 8-9)        — Workspace Layer 5 + IG
Phase 8 (weeks 7-9 / 9-12) — Implementation (Originate parallel, Workspace serial)
Phase 9 (weeks 10/12)      — Acceptance
```

Phases 2-6 contain parallelism. Within a phase, steps marked [PARALLEL OK] run simultaneously.

---

## 4 · Phase 0 — Pre-kickoff (this week)

### Step 0.1 — Resolve §12 decisions [CRITICAL PATH]

- **Trigger:** WBS v0.2 received
- **Owner:** Anand
- **Branch + PR:** `spec/wbs-v0.3-decisions-resolved` · `[SPEC] WBS v0.3 — §12 decisions resolved`
- **Deliverable:** WBS v0.3 with §12 decisions D-1 through D-12 marked with chosen option and rationale
- **Self-QA:** Every D-N has a chosen option (no "TBD"), rationale stated, side effects noted
- **Merge gate:** This PR is the one Anand merges himself (it's his decisions)
- **Unblocks:** All subsequent work
- **Estimated effort:** 1 hour Anand

### Step 0.2 — F-01 methodology doc [CRITICAL PATH]

- **Trigger:** Step 0.1 merged
- **Owner:** Claude (chat)
- **Branch + PR:** `spec/methodology-foundation` · `[SPEC] Spec methodology doc (F-01)`
- **Deliverable:** `docs/design/strategic-moves/specs/SPEC_METHODOLOGY.md` defining the 5 layers, conventions, file structure, sign-off process
- **Self-QA:** A reviewer can independently produce a Layer 1 anatomy following the doc
- **Merge gate:** Anand confirms doc is sufficient for Claude Code to execute against
- **Unblocks:** F-02, F-03, all subsequent spec work
- **Estimated effort:** 3 hours Claude chat + 1 hour Anand review

### Step 0.3 — F-04 audit completion [HARD HOLD on separate workflow]

> **✅ COMPLETE** — All 7 audit docs merged via PR #1526 (2026-05-05). This step is done. F-04 gate is open. T-X and all training packs are unblocked.

- **Trigger:** Audit Claude Code workflow completes
- **Owner:** Claude Code (separate workflow)
- **Branch + PR:** Per audit workflow
- **Deliverable:** All 7 remaining audit docs merged, §11/§12 of binding matrix reconciled
- **Self-QA:** Per audit workflow
- **Merge gate:** Anand approves audit completion
- **Unblocks:** T-X (cross-phase capability), all training packs, Layer 5 of both pages
- **Estimated effort:** Tracked in audit workflow

**End of Phase 0 checkpoint:** Steps 0.1, 0.2, 0.3 all complete before Phase 1 starts.

---

## 5 · Phase 1 — Foundation week (week 1)

### Step 1.1 — F-02 spec repo skeleton [PARALLEL OK]

- **Trigger:** Step 0.2 merged
- **Owner:** Claude Code
- **Branch + PR:** `infra/spec-repo-skeleton` · `[INFRA] Spec repo skeleton (F-02)`
- **Deliverable:** Directory structure under `docs/design/strategic-moves/specs/` with placeholder files for every layer × every page; README explains layout
- **Self-QA:** Skeleton matches F-01 file path conventions exactly; every placeholder file has a one-line scope comment
- **Merge gate:** Anand glances at structure, approves
- **Unblocks:** Layer 1 work for both pages
- **Estimated effort:** 1 hour Claude Code + 15 min Anand review

### Step 1.2 — F-03 stable ID convention [PARALLEL OK]

- **Trigger:** Step 0.2 merged
- **Owner:** Claude Code
- **Branch + PR:** `spec/stable-id-convention` · `[SPEC] Stable ID convention (F-03)`
- **Deliverable:** `docs/design/strategic-moves/specs/STABLE_ID_CONVENTION.md` — naming convention, examples, anti-patterns
- **Self-QA:** Owner produces 5 sample IDs from cascade Frame 2 without ambiguity
- **Merge gate:** Anand confirms convention matches F-01 expectations
- **Unblocks:** Layer 1 work for both pages
- **Estimated effort:** 2 hours Claude Code + 30 min Anand review

### Step 1.3 — F-05 substrate migration plan [PARALLEL OK with 1.1, 1.2]

- **Trigger:** Step 0.3 (audit) merged
- **Owner:** Claude Code
- **Branch + PR:** `spec/substrate-migration-plan` · `[SPEC] Substrate migration 8→6 plan (F-05)`
- **Deliverable:** Migration plan referencing audit binding matrix; concrete tickets for B-027, B-028, B-029 with sequencing and rollback strategy
- **Self-QA:** Plan addresses every phase-related field in `governance.ts`, `phase-labels.ts`, `phase-packs/`, `failure-modes.ts`, `intelligence/seed-patterns-*.ts`
- **Merge gate:** Anand reviews migration sequencing, confirms rollback plan exists, approves
- **Unblocks:** Substrate migration execution (B-027, B-028, B-029 — separate WBS)
- **Estimated effort:** 8 hours Claude Code + 2 hours Anand review

**End of Phase 1 checkpoint:** Foundation complete. Methodology and conventions exist. Substrate migration plan committed.

---

## 6 · Phase 2 — Cross-phase capability + P0 + Originate anatomy (week 2)

Three streams run in parallel. They merge in different orders depending on Anand review cadence.

### Step 2.1 — T-X Cross-phase capability spec [PARALLEL OK]

- **Trigger:** Step 0.3 (audit) merged AND Step 1.2 (F-03) merged
- **Owner:** Claude Code
- **Branch + PR:** `agent/cross-phase-capabilities` · `[AGENT] Cross-phase capabilities + global rules (T-X)`
- **Deliverable:** `docs/design/strategic-moves/agent-training/00-cross-phase-capabilities.md` covering 8 capabilities + global behavioral rules + capability-to-phase mapping
- **Self-QA:** All 8 capabilities from WBS §4.5 covered; mapping matrix complete; no orphan references to non-existent patterns
- **Merge gate:** Anand reviews capability framing, confirms aligns with audit
- **Unblocks:** All per-phase training packs (T-P0 through T-P5)
- **Estimated effort:** 12 hours Claude Code + 2 hours Anand review

### Step 2.2 — T-P0 P0 Originate training pack [PARALLEL OK after 2.1]

- **Trigger:** Step 2.1 merged
- **Owner:** Claude Code
- **Branch + PR:** `agent/p0-training-pack` · `[AGENT] P0 Originate training pack (T-P0)`
- **Deliverable:** `docs/design/strategic-moves/agent-training/p0-originate.md` — all 21 fields populated, 5 fixture scenarios drafted, anti-hallucination tests documented
- **Self-QA:** Per §2.5 universal training pack QA — 21 fields populated, patterns resolve, fixtures drafted
- **Merge gate:** Anand reviews pack structure, spot-checks 2 of 5 fixtures, approves
- **Unblocks:** O-5 Originate Layer 5 (Knowledge Surfacing)
- **Estimated effort:** 14 hours Claude Code + 1.5 hours Anand review

### Step 2.3 — O-1.1 Originate anatomy [PARALLEL OK with 2.1, 2.2]

- **Trigger:** Step 1.1 (F-02) merged AND Step 1.2 (F-03) merged
- **Owner:** Claude Code
- **Branch + PR:** `spec/originate-l1-anatomy` · `[SPEC] Originate Layer 1 Anatomy (O-1.1)`
- **Deliverable:** `specs/originate/01-anatomy.md` with zone map, element IDs, MUST explicitly call out (a) scaffold-in-chat-lane, (b) brief-in-canvas-pane, (c) `PHASE_SHORT_NAMES` substrate gap
- **Self-QA:** Every clickable in cascade Frame 2 of Flow 2 has a stable ID; scaffold placement explicit; substrate gap logged to backlog
- **Merge gate:** Anand walks through cascade Frame 2 against anatomy doc, confirms every visible element is documented
- **Unblocks:** O-1.2 (annotated screenshot), O-2.1 (state)
- **Estimated effort:** 4 hours Claude Code + 1 hour Anand review

### Step 2.4 — O-1.2 Originate annotated screenshot

- **Trigger:** Step 2.3 merged
- **Owner:** Claude Code
- **Branch + PR:** `spec/originate-l1-screenshot` · `[SPEC] Originate Layer 1 annotated screenshot (O-1.2)`
- **Deliverable:** PNG export of cascade Frame 2 with stable IDs overlaid
- **Self-QA:** Every ID from anatomy doc visible on screenshot; no extra IDs not in anatomy
- **Merge gate:** Anand spot-checks 5 IDs against anatomy
- **Unblocks:** O-1.3 sign-off
- **Estimated effort:** 2 hours Claude Code + 15 min Anand review

### Step 2.5 — O-1.3 Originate Layer 1 sign-off

- **Trigger:** Step 2.4 merged
- **Owner:** Anand
- **Branch + PR:** N/A (sign-off recorded as comment on Step 2.3 PR or as decision log entry)
- **Deliverable:** Decision log entry: "O-1.1 + O-1.2 signed off; Originate Layer 1 frozen for spec downstream"
- **Self-QA:** Anand re-walks cascade Frame 2 with anatomy + screenshot side by side
- **Merge gate:** N/A
- **Unblocks:** O-2 (state) full execution
- **Estimated effort:** 1 hour Anand

**End of Phase 2 checkpoint:** Cross-phase capability spec merged. T-P0 merged. Originate anatomy locked.

---

## 7 · Phase 3 — Originate canary (weeks 2-4)

This phase validates the methodology on the smaller page before committing to Workspace. Failures here trigger methodology revision before Workspace work starts.

### Step 3.1 — O-2.1, O-2.2, O-2.3 Originate state

- **Trigger:** Step 2.5 (O-1.3 sign-off) recorded AND D-11 (draft persistence) resolved
- **Owner:** Claude Code
- **Branch + PR:** `spec/originate-l2-state` · `[SPEC] Originate Layer 2 State (O-2.1, O-2.2, O-2.3)`
- **Deliverable:** `specs/originate/02-state.md` with state dimensions, state matrix, edge cases (including tab-close-mid-origination per D-11)
- **Self-QA:** Every Layer 1 element ID has an entry in state matrix; edge cases include all 5 from WBS O-2.3 entry
- **Merge gate:** Anand reviews state matrix, spot-checks 3 edge cases, approves
- **Unblocks:** O-2.4 sign-off
- **Estimated effort:** 10 hours Claude Code + 2 hours Anand review

### Step 3.2 — O-2.4 Originate Layer 2 sign-off

- **Trigger:** Step 3.1 merged
- **Owner:** Anand
- **Deliverable:** Decision log entry; Layer 2 frozen
- **Unblocks:** O-3 (interactions) full execution
- **Estimated effort:** 1 hour Anand

### Step 3.3 — O-3.1 through O-3.4 Originate interactions

- **Trigger:** Step 3.2 (O-2.4 sign-off) recorded AND D-10 (URL behavior) resolved
- **Owner:** Claude Code
- **Branch + PR:** `spec/originate-l3-interactions` · `[SPEC] Originate Layer 3 Interactions (O-3.1, O-3.2, O-3.3, O-3.4)`
- **Deliverable:** `specs/originate/03-interactions.md` with interaction inventory, keyboard nav, URL state spec (per D-10), loading + error states; explicit "future phase nodes non-interactive" callout
- **Self-QA:** Every Layer 1 clickable has interaction row; URL spec aligns with D-10; keyboard tab order specified end-to-end
- **Merge gate:** Anand walks 3 interaction flows from cascade Flow 2 against doc
- **Unblocks:** O-3.5 sign-off, O-4 (data binding)
- **Estimated effort:** 11 hours Claude Code + 2 hours Anand review

### Step 3.4 — O-3.5 Originate Layer 3 sign-off

- **Trigger:** Step 3.3 merged
- **Owner:** Anand
- **Deliverable:** Decision log entry; Layer 3 frozen
- **Unblocks:** O-4 (data binding) sign-off path
- **Estimated effort:** 1 hour Anand

### Step 3.5 — O-4.1 through O-4.4 Originate data binding

- **Trigger:** Step 3.4 (O-3.5 sign-off) recorded
- **Owner:** Claude Code
- **Branch + PR:** `spec/originate-l4-data` · `[SPEC] Originate Layer 4 Data Binding (O-4.1 through O-4.4)`
- **Deliverable:** `specs/originate/04-data-bindings.md` with read bindings, write bindings, substrate gap log, audit log spec
- **Self-QA:** Per §2.4 — every binding maps to real substrate or to a backlog item; substrate gap log linked to backlog tickets; audit log shape documented for every write
- **Merge gate:** Anand reviews substrate gap log especially carefully (this is where surprises hide); approves
- **Unblocks:** O-4.5 sign-off, O-5 (knowledge surfacing) preparation
- **Estimated effort:** 14 hours Claude Code + 3 hours Anand review

### Step 3.6 — O-4.5 Originate Layer 4 sign-off

- **Trigger:** Step 3.5 merged
- **Owner:** Anand
- **Deliverable:** Decision log entry; Layer 4 frozen
- **Unblocks:** O-5 sign-off path
- **Estimated effort:** 1 hour Anand

**End of Phase 3 checkpoint:** Originate Layers 1-4 frozen. Methodology validated. Layer 5 next, but it depends on T-P0 being deployed (Phase 4).

---

## 8 · Phase 4 — Originate Layer 5 + Implementation Gate; T-P1, T-P2 in parallel (weeks 4-5)

### Step 4.1 — O-5.1 through O-5.6 Originate Knowledge Surfacing

- **Trigger:** Step 3.6 (O-4.5 sign-off) recorded AND Step 2.2 (T-P0) merged
- **Owner:** Claude Code
- **Branch + PR:** `spec/originate-l5-knowledge` · `[SPEC] Originate Layer 5 Knowledge Surfacing (O-5.1 through O-5.6)`
- **Deliverable:** `specs/originate/05-knowledge-surfacing.md` with first-message scaffold, chip ladder, evidence rules, anti-hallucination rules, hand-off contract, 5 fixture scenarios
- **Self-QA:** First-message scaffold tested against 5 fixtures; anti-hallucination rules tested with 3 prohibited prompts; chip ladder maps to Layer 3 interactions
- **Merge gate:** Anand reviews fixtures pass, spot-checks 1 anti-hallucination case
- **Unblocks:** O-5.7 sign-off
- **Estimated effort:** 18 hours Claude Code + 3 hours Anand review

### Step 4.2 — O-5.7 Originate Layer 5 sign-off

- **Trigger:** Step 4.1 merged
- **Owner:** Anand
- **Deliverable:** Decision log entry; Layer 5 frozen
- **Unblocks:** O-IG Implementation Gate
- **Estimated effort:** 1 hour Anand

### Step 4.3 — O-IG Originate Implementation Gate [CRITICAL PATH]

- **Trigger:** O-1.3, O-2.4, O-3.5, O-4.5, O-5.7 all signed AND T-P0 merged
- **Owner:** Anand
- **Branch + PR:** N/A (gate is a sign-off, not a code change)
- **Deliverable:** Decision log entry: "Originate spec complete; implementation green-lit"
- **Self-QA:** Anand walks through cascade Flow 2 against all 5 layer docs in sequence, confirms zero gaps
- **Merge gate:** N/A
- **Unblocks:** Originate implementation can start (separate WBS)
- **Estimated effort:** 2 hours Anand

### Step 4.4 — T-P1 P1 Charter training pack [PARALLEL OK with 4.1]

- **Trigger:** Step 2.1 (T-X) merged
- **Owner:** Claude Code
- **Branch + PR:** `agent/p1-training-pack` · `[AGENT] P1 Charter training pack (T-P1)`
- **Deliverable:** `docs/design/strategic-moves/agent-training/p1-charter.md` per T-P0 template
- **Self-QA:** Per §2.5
- **Merge gate:** Anand reviews structure, spot-checks fixtures
- **Unblocks:** W-5 (Workspace Layer 5) eventually
- **Estimated effort:** 16 hours Claude Code + 1.5 hours Anand review

### Step 4.5 — T-P2 P2 Diagnose training pack [PARALLEL OK with 4.4]

- **Trigger:** Step 2.1 merged
- **Owner:** Claude Code
- **Branch + PR:** `agent/p2-training-pack` · `[AGENT] P2 Diagnose training pack (T-P2)`
- **Deliverable:** Per T-P0 template
- **Self-QA:** Per §2.5
- **Merge gate:** Per training pack
- **Unblocks:** W-5 eventually
- **Estimated effort:** 18 hours Claude Code + 1.5 hours Anand review

**End of Phase 4 checkpoint:** Originate spec complete and gated. Two more training packs merged. Implementation can begin in parallel with subsequent Workspace spec work.

---

## 9 · Phase 5 — Workspace anatomy + state + interactions; T-P3, T-P4 in parallel (weeks 4-7)

This phase parallelizes aggressively. Workspace spec work runs simultaneously with training packs. Anand review queue gets busier — recommend batching reviews into 2x/week sessions during this phase.

### Step 5.1 — W-1.1 Workspace shell anatomy [PARALLEL OK]

- **Trigger:** Step 4.3 (O-IG) recorded — methodology validated by Originate canary
- **Owner:** Claude Code
- **Branch + PR:** `spec/workspace-l1-shell` · `[SPEC] Workspace Layer 1 Shell Anatomy (W-1.1)`
- **Deliverable:** `specs/workspace/01-anatomy-shell.md` covering header, rail, chat lane, sponsor strip; `PHASE_SHORT_NAMES` gap noted
- **Self-QA:** Every shell element from `15-workspace-v0.2.html` has stable ID; rail short-name vs identity-card full-name treatment explicit
- **Merge gate:** Anand walks workspace v0.2 reference against anatomy
- **Unblocks:** W-1.2 (per-phase canvas anatomy)
- **Estimated effort:** 4 hours Claude Code + 1 hour Anand review

### Step 5.2 — W-1.2 Per-phase canvas anatomy (P0, P1) [PARALLEL OK]

- **Trigger:** Step 5.1 merged
- **Owner:** Claude Code
- **Branch + PR:** `spec/workspace-l1-canvas-p0p1` · `[SPEC] Workspace Layer 1 Canvas Anatomy P0+P1 (W-1.2 partial)`
- **Deliverable:** `specs/workspace/01-anatomy-canvas-p0.md` and `01-anatomy-canvas-p1.md`
- **Self-QA:** Each phase canvas has full element ID coverage
- **Merge gate:** Anand approves both
- **Unblocks:** W-1.2 (P2, P3 batch next)
- **Estimated effort:** 4 hours Claude Code + 1 hour Anand review

### Step 5.3 — W-1.2 Per-phase canvas anatomy (P2, P3)

- **Trigger:** Step 5.2 merged
- **Same pattern as 5.2**
- **Estimated effort:** 4 hours Claude Code + 1 hour Anand review

### Step 5.4 — W-1.2 Per-phase canvas anatomy (P4, P5)

- **Trigger:** Step 5.3 merged
- **Same pattern**
- **Estimated effort:** 4 hours Claude Code + 1 hour Anand review

### Step 5.5 — W-1.3, W-1.4 View modes + screenshots

- **Trigger:** Step 5.4 merged
- **Owner:** Claude Code
- **Branch + PR:** `spec/workspace-l1-viewmodes` · `[SPEC] Workspace Layer 1 View Modes + Screenshots (W-1.3, W-1.4)`
- **Deliverable:** `specs/workspace/01-anatomy-viewmodes.md` and 4 annotated screenshots
- **Self-QA:** Past/future/handoff variants documented for every shell + canvas element
- **Merge gate:** Anand walks all 4 view modes from `15-workspace-v0.2.html`
- **Unblocks:** W-1.5 sign-off
- **Estimated effort:** 8 hours Claude Code + 2 hours Anand review

### Step 5.6 — W-1.5 Workspace Layer 1 sign-off

- **Trigger:** Step 5.5 merged
- **Owner:** Anand
- **Deliverable:** Decision log; Workspace Layer 1 frozen
- **Unblocks:** W-2 (state)
- **Estimated effort:** 3 hours Anand

### Step 5.7 — W-2.1 through W-2.4 Workspace state

- **Trigger:** Step 5.6 recorded AND Step 0.3 audit reconciliation includes P5→Tower gate count clarification
- **Owner:** Claude Code
- **Branch + PR:** `spec/workspace-l2-state` · `[SPEC] Workspace Layer 2 State (W-2.1 through W-2.4)`
- **Deliverable:** `specs/workspace/02-state.md` with full state matrix, per-phase nuances, edge cases; P5 gate count reconciled per audit
- **Self-QA:** Per §2.4; P5 gate count documented to match audit binding matrix
- **Merge gate:** Anand reviews matrix, confirms P5 reconciliation aligns with audit
- **Unblocks:** W-2.5 sign-off, W-3 (interactions)
- **Estimated effort:** 18 hours Claude Code + 3 hours Anand review

### Step 5.8 — W-2.5 Workspace Layer 2 sign-off

- **Trigger:** Step 5.7 merged
- **Owner:** Anand
- **Deliverable:** Decision log; Layer 2 frozen
- **Estimated effort:** 3 hours Anand

### Step 5.9 — W-3.1 Workspace shell interactions

- **Trigger:** Step 5.8 recorded AND D-10 resolved
- **Owner:** Claude Code
- **Branch + PR:** `spec/workspace-l3-shell` · `[SPEC] Workspace Layer 3 Shell Interactions (W-3.1)`
- **Deliverable:** `specs/workspace/03-interactions-shell.md` covering rail clicks, chat input, sponsor strip; URL spec per D-10
- **Self-QA:** Per §2.4; URL behavior aligns with D-10
- **Merge gate:** Anand reviews
- **Unblocks:** W-3.2 (per-phase interactions)
- **Estimated effort:** 4 hours Claude Code + 1 hour Anand review

### Steps 5.10 to 5.12 — W-3.2 Per-phase interactions (P0+P1, P2+P3, P4+P5)

Three batched PRs following same pattern as 5.2-5.4.
- **Estimated effort each:** 4 hours Claude Code + 1 hour Anand review

### Step 5.13 — W-3.3 through W-3.6 Workspace interaction completion

- **Trigger:** Step 5.12 merged
- **Owner:** Claude Code
- **Branch + PR:** `spec/workspace-l3-completion` · `[SPEC] Workspace Layer 3 View Variants + URL + Keyboard + States (W-3.3 through W-3.6)`
- **Deliverable:** View-mode interaction variants, full URL state spec, keyboard nav, loading + error states
- **Estimated effort:** 13 hours Claude Code + 3 hours Anand review

### Step 5.14 — W-3.7 Workspace Layer 3 sign-off

- **Trigger:** Step 5.13 merged
- **Owner:** Anand
- **Deliverable:** Decision log; Layer 3 frozen
- **Estimated effort:** 3 hours Anand

### Step 5.15 — T-P3 P3 Design training pack [PARALLEL OK]

- **Trigger:** Step 2.1 merged (concurrent with W-1, W-2, W-3 above)
- **Owner:** Claude Code
- **Branch + PR:** `agent/p3-training-pack` · `[AGENT] P3 Design training pack (T-P3)`
- **Estimated effort:** 20 hours Claude Code + 1.5 hours Anand review

### Step 5.16 — T-P4 P4 Roadmap training pack [PARALLEL OK]

- **Trigger:** Step 2.1 merged
- **Owner:** Claude Code
- **Branch + PR:** `agent/p4-training-pack` · `[AGENT] P4 Roadmap training pack (T-P4)`
- **Estimated effort:** 18 hours Claude Code + 1.5 hours Anand review

**End of Phase 5 checkpoint:** Workspace anatomy, state, and interactions all frozen. Five training packs merged (T-P0, T-P1, T-P2, T-P3, T-P4). Substrate migration should be in flight in parallel.

---

## 10 · Phase 6 — Workspace data binding + T-P5 + pack deployment infra (weeks 7-8)

### Step 6.1 — W-4.1 Workspace shell read bindings

- **Trigger:** Step 5.6 (W-1.5 sign-off) recorded
- **Owner:** Claude Code
- **Branch + PR:** `spec/workspace-l4-shell` · `[SPEC] Workspace Layer 4 Shell Read Bindings (W-4.1)`
- **Estimated effort:** 4 hours Claude Code + 1 hour Anand review

### Steps 6.2 to 6.4 — W-4.2 Per-phase canvas read bindings (P0+P1, P2+P3, P4+P5)

Three batched PRs.
- **Estimated effort each:** 6 hours Claude Code + 1 hour Anand review

### Step 6.5 — W-4.3, W-4.4, W-4.5 Workspace write bindings

- **Trigger:** Step 6.4 merged AND Step 5.14 (W-3.7) recorded
- **Owner:** Claude Code
- **Branch + PR:** `spec/workspace-l4-writes` · `[SPEC] Workspace Layer 4 Write Bindings (W-4.3, W-4.4, W-4.5)`
- **Deliverable:** Promote mutation, gate updates, artifact updates
- **Estimated effort:** 11 hours Claude Code + 2 hours Anand review

### Step 6.6 — W-4.6, W-4.7 Substrate gap log + audit log spec

- **Trigger:** Step 6.5 merged
- **Owner:** Claude Code
- **Branch + PR:** `spec/workspace-l4-gaps-and-audit` · `[SPEC] Workspace Layer 4 Substrate Gap Log + Audit Log (W-4.6, W-4.7)`
- **Estimated effort:** 6 hours Claude Code + 2 hours Anand review

### Step 6.7 — W-4.8 Workspace Layer 4 sign-off

- **Trigger:** Step 6.6 merged
- **Owner:** Anand
- **Deliverable:** Decision log; Layer 4 frozen
- **Estimated effort:** 5 hours Anand (substrate gap review is heavy)

### Step 6.8 — T-P5 P5 Mobilize training pack [PARALLEL OK]

- **Trigger:** Step 2.1 merged
- **Owner:** Claude Code
- **Branch + PR:** `agent/p5-training-pack` · `[AGENT] P5 Mobilize training pack (T-P5)`
- **Estimated effort:** 14 hours Claude Code + 1.5 hours Anand review

### Step 6.9 — T-D.1, T-D.2 Pack serialization + loader integration [PARALLEL OK]

- **Trigger:** Step 2.1 (T-X) merged AND Step 1.3 (F-05 substrate plan) merged
- **Owner:** Claude Code
- **Branch + PR:** `infra/agent-pack-loader` · `[INFRA] Agent pack serialization format + loader (T-D.1, T-D.2)`
- **Deliverable:** Pack schema (TypeScript or JSON); loader integrated into `src/app/api/chat/agent/route.ts`
- **Self-QA:** Loader works against T-P0 pack as smoke test; old phase-pack format still loads (backward compat during migration)
- **Merge gate:** Anand reviews loader code; smoke test against T-P0 demonstrated
- **Estimated effort:** 9 hours Claude Code + 2 hours Anand review

### Step 6.10 — T-D.3 Pack test harness

- **Trigger:** Step 6.9 merged
- **Owner:** Claude Code
- **Branch + PR:** `infra/agent-pack-test-harness` · `[INFRA] Agent pack test harness (T-D.3)`
- **Deliverable:** Test runner that executes fixtures from packs and validates expected behavior
- **Self-QA:** Runs against T-P0; reports pass/fail per fixture
- **Merge gate:** Anand sees harness pass T-P0 fixtures
- **Estimated effort:** 8 hours Claude Code + 1 hour Anand review

**End of Phase 6 checkpoint:** All 6 training packs merged. Workspace Layer 4 frozen. Pack loader infrastructure ready.

---

## 11 · Phase 7 — Workspace Layer 5 + Implementation Gate (weeks 8-9)

### Step 7.1 — T-D.4 Pack rollout

- **Trigger:** Steps 6.8, 6.9, 6.10 merged
- **Owner:** Claude Code
- **Branch + PR:** `infra/agent-pack-rollout` · `[INFRA] Agent pack rollout — phase by phase (T-D.4)`
- **Deliverable:** All 6 packs deployed, fixtures verified end-to-end
- **Self-QA:** Test harness passes all 30 fixtures (5 per phase × 6 phases)
- **Merge gate:** Anand sees green test report
- **Unblocks:** S-4 phase-pack file migration
- **Estimated effort:** 6 hours Claude Code + 1 hour Anand review

### Step 7.2 — S-4 Phase-pack file migration

- **Trigger:** Step 7.1 merged AND substrate migration B-027/B-028 merged
- **Owner:** Claude Code
- **Branch + PR:** `substrate/phase-pack-file-migration` · `[SUBSTRATE] Phase-pack file migration to 6-phase (S-4)`
- **Deliverable:** Old `src/lib/intelligence/phase-packs/` content removed; agent route reads from new packs only
- **Self-QA:** Existing agent functionality works against migrated structure; no fallback to old packs needed
- **Merge gate:** Anand reviews diff; smoke test on at least 2 demo tenants
- **Estimated effort:** 4 hours Claude Code + 1 hour Anand review

### Step 7.3 — W-5.1 Workspace Knowledge Surfacing overview

- **Trigger:** Step 6.7 (W-4.8) recorded AND all training packs merged
- **Owner:** Claude Code
- **Branch + PR:** `spec/workspace-l5-overview` · `[SPEC] Workspace Layer 5 Overview (W-5.1)`
- **Deliverable:** `specs/workspace/05-knowledge-surfacing-overview.md` — common patterns across phases
- **Estimated effort:** 3 hours Claude Code + 1 hour Anand review

### Steps 7.4 to 7.6 — W-5.2 Per-phase first-message scaffolds (P0+P1, P2+P3, P4+P5)

Three batched PRs.
- **Estimated effort each:** 4 hours Claude Code + 1 hour Anand review

### Step 7.7 — W-5.3 Per-phase chip ladders

- **Owner:** Claude Code
- **Branch + PR:** `spec/workspace-l5-chips` · `[SPEC] Workspace Layer 5 Chip Ladders All Phases (W-5.3)`
- **Estimated effort:** 9 hours Claude Code + 2 hours Anand review

### Step 7.8 — W-5.4, W-5.5, W-5.6 View-mode replay + preview + cross-phase nav

- **Owner:** Claude Code
- **Branch + PR:** `spec/workspace-l5-viewmodes` · `[SPEC] Workspace Layer 5 View Variants (W-5.4-5.6)`
- **Estimated effort:** 10 hours Claude Code + 2 hours Anand review

### Step 7.9 — W-5.7 Per-phase evidence + anti-hallucination rules

- **Owner:** Claude Code
- **Branch + PR:** `spec/workspace-l5-evidence` · `[SPEC] Workspace Layer 5 Evidence + Anti-Hallucination Rules (W-5.7)`
- **Estimated effort:** 6 hours Claude Code + 2 hours Anand review

### Step 7.10 — W-5.8 Fixture test scenarios

- **Trigger:** Step 7.9 merged
- **Owner:** Claude Code
- **Branch + PR:** `spec/workspace-l5-fixtures` · `[SPEC] Workspace Layer 5 Fixtures (W-5.8)`
- **Deliverable:** 30 fixtures (5 per phase) with expected Nexus behaviors; harness runs them green
- **Self-QA:** All 30 pass against deployed packs
- **Merge gate:** Anand sees green test report
- **Estimated effort:** 12 hours Claude Code + 3 hours Anand review

### Step 7.11 — W-5.9 Workspace Layer 5 sign-off

- **Trigger:** Step 7.10 merged
- **Owner:** Anand
- **Deliverable:** Decision log; Layer 5 frozen
- **Estimated effort:** 6 hours Anand

### Step 7.12 — W-IG Workspace Implementation Gate [CRITICAL PATH]

- **Trigger:** All Workspace layer sign-offs recorded AND substrate migration B-027/B-028/B-029 complete
- **Owner:** Anand
- **Deliverable:** Decision log: "Workspace spec complete; implementation green-lit"
- **Self-QA:** Anand walks both flows from cascade against all 5 layer docs
- **Unblocks:** Workspace implementation
- **Estimated effort:** 3 hours Anand

**End of Phase 7 checkpoint:** All Workspace specs frozen. All training packs deployed. Implementation can proceed.

---

## 12 · Phase 8 — Implementation (weeks 7-9 Originate, 9-12 Workspace)

Implementation is a separate WBS (not detailed here). Coordination points:

### Step 8.1 — Originate implementation [PARALLEL OK with Phases 5-7]

- **Trigger:** Step 4.3 (O-IG) recorded
- **Owner:** Claude Code (separate impl WBS)
- **Branch + PR:** Multiple PRs per `impl/originate-*` pattern
- **QA pattern:** Per §2.6 universal impl QA — build green, tests pass, smoke test, visual diff
- **Merge gate:** Anand reviews each PR
- **Estimated calendar:** 3 weeks elapsed (parallel with spec work)

### Step 8.2 — Workspace implementation

- **Trigger:** Step 7.12 (W-IG) recorded
- **Owner:** Claude Code (separate impl WBS)
- **Branch + PR:** Multiple PRs per `impl/workspace-*` pattern
- **QA pattern:** Per §2.6
- **Merge gate:** Per PR
- **Estimated calendar:** 3-4 weeks elapsed

---

## 13 · Phase 9 — Acceptance (weeks 10 / 12)

### Step 9.1 — A-1 Flow 1 acceptance script

- **Trigger:** Originate implementation complete
- **Owner:** Claude (chat)
- **Branch + PR:** `spec/acceptance-flow1` · `[SPEC] Acceptance demo script Flow 1 (A-1)`
- **Deliverable:** Step-by-step demo script with expected outputs at every step
- **Estimated effort:** 3 hours Claude chat + 30 min Anand review

### Step 9.2 — A-2 Flow 2 acceptance script

- **Trigger:** Originate implementation complete
- **Owner:** Claude (chat)
- **Branch + PR:** `spec/acceptance-flow2` · `[SPEC] Acceptance demo script Flow 2 (A-2)`
- **Estimated effort:** 2 hours Claude chat + 30 min Anand review

### Step 9.3 — A-3 Cross-tenant smoke test

- **Trigger:** Steps 9.1, 9.2 merged AND Workspace implementation complete
- **Owner:** Claude Code
- **Branch + PR:** `infra/acceptance-smoke-test` · `[INFRA] Cross-tenant smoke test runner (A-3)`
- **Deliverable:** Test runner executes both flows against all 5 demo tenants, logs failures
- **Self-QA:** Initial run reports green or surfaces issues with actionable detail
- **Merge gate:** Anand sees report
- **Estimated effort:** 4 hours Claude Code + 1 hour Anand review

### Step 9.4 — A-4 Anand acceptance walkthrough [CRITICAL PATH FINAL]

- **Trigger:** Step 9.3 merged with green report
- **Owner:** Anand (observer); Claude Code (operator)
- **Branch + PR:** N/A (live demo)
- **Deliverable:** Live demo of both flows end-to-end with Anand observing
- **Self-QA:** Operator runs through scripts once silently before live demo
- **Merge gate:** Anand says "ship it" or "fix N first"
- **Estimated effort:** 3 hours Anand + 2 hours Claude Code prep
- **Unblocks:** Closure

### Step 9.5 — A-5 Closure doc

- **Trigger:** Step 9.4 passes
- **Owner:** Claude (chat)
- **Branch + PR:** `spec/closure-doc` · `[SPEC] Strategic Moves Detail Pages launch closure (A-5)`
- **Deliverable:** `docs/build/STRATEGIC_MOVES_DETAIL_PAGES_LAUNCH_2026-XX-XX.md` — what shipped, what didn't, what's next, lessons codified
- **Estimated effort:** 2 hours Claude chat + 1 hour Anand review

**End of Phase 9 checkpoint:** Detail pages live in production. Backlog updated with v0.2 items. Closure doc committed.

---

## 14 · QA gate failures — what happens when something fails

### 14.1 Self-QA fails (caught by owner before PR)

- Owner does not open PR
- Continues work to address the gap
- No notification needed

### 14.2 Universal QA fails at PR review (Anand catches at first look)

- Anand comments on PR with specific failures
- Owner addresses, force-pushes, re-requests review
- Anand reviews again
- No process implication unless this happens 2+ times for the same PR — then escalate

### 14.3 Cross-spec consistency fails (caught after merge by downstream work)

- Owner of downstream work flags via decision log entry
- Triage: is this a defect in the merged spec or a new requirement?
- If defect: amendment PR opened against the defective spec
- If new requirement: WBS §13 gets a decision log entry; affected work packages updated

### 14.4 Implementation fails smoke test

- Implementation PR not merged
- Owner debugs; if root cause is spec defect, escalate to spec amendment
- If root cause is implementation: continue iteration

### 14.5 Acceptance walkthrough fails

- A-4 result documented in closure doc
- Specific failures triaged: blocker (must fix before launch) or non-blocker (v0.2)
- Blockers re-enter implementation queue
- Re-walkthrough scheduled within 1 week

---

## 15 · Pre-execution checklist (Anand sign-off before kickoff)

Mark each item before Phase 1 starts:

- [x] WBS v0.3 committed to repo (all decisions resolved)
- [x] §12 decisions D-1 through D-12 resolved (Step 0.1 complete)
- [ ] F-01 methodology doc merged (Step 0.2 complete)
- [x] Audit completion confirmed (Step 0.3 complete · PR #1526)
- [ ] Cascade locked at v0.1 per D-12
- [ ] Cursor exclusion confirmed per D-3
- [ ] Anand review batching schedule chosen per D-9
- [ ] Branch protection on `main` configured to require Anand approval for merge
- [ ] Decision log workflow tested (one practice entry added and committed)

When all 9 items checked: Phase 1 starts.

---

## 16 · Quick reference — order of step IDs end-to-end

For when someone needs to know "what's next."

```
Phase 0:  0.1 → 0.2 → 0.3
Phase 1:  1.1 ⫼ 1.2 ⫼ 1.3                    (parallel after 0.2/0.3)
Phase 2:  2.1 → 2.2; 2.3 → 2.4 → 2.5         (2.1+2.3 parallel)
Phase 3:  3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6
Phase 4:  4.1 → 4.2 → 4.3; 4.4 ⫼ 4.5         (4.4/4.5 parallel with 4.1)
Phase 5:  5.1 → 5.2 → 5.3 → 5.4 → 5.5 → 5.6
          → 5.7 → 5.8 → 5.9 → 5.10 → 5.11 → 5.12 → 5.13 → 5.14
          5.15 ⫼ 5.16                        (parallel throughout)
Phase 6:  6.1 → 6.2 → 6.3 → 6.4 → 6.5 → 6.6 → 6.7
          6.8 ⫼ 6.9 → 6.10                   (6.8 parallel; 6.9→6.10 sequential)
Phase 7:  7.1 → 7.2; 7.3 → 7.4 → 7.5 → 7.6
          → 7.7 → 7.8 → 7.9 → 7.10 → 7.11 → 7.12
Phase 8:  8.1 (parallel with 5-7); 8.2 (after 7.12)
Phase 9:  9.1 ⫼ 9.2 → 9.3 → 9.4 → 9.5

Legend:  →  sequential
         ⫼  parallel
```

---

## 17 · Document evolution

| Version | Date | Changes | Author |
|---|---|---|---|
| 0.1 | 2026-05-05 | Initial draft | Claude (chat) |

End of playbook.
