# Claude Code — Programs Module Build Instructions

> **Audience.** The Claude Code agent assigned to AbarVa's Programs module build work.
>
> **Purpose.** Lock how you read the substrate audit, sequence work, surface blockers, and write back to the audit. Without this contract, the audit becomes a static document; with it, the audit becomes the operational dashboard for Programs build.
>
> **Companion artifacts.**
> - `AUDIT_PROGRAMS_SUBSTRATE.yaml` — structured backlog (75 items across 7 layers)
> - `AUDIT_PROGRAMS_SUBSTRATE.md` — narrative review version
> - `PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md` — the design source of truth
> - `AGENT_VOICE_SENTINEL.md` (PR #1259), `tests/intelligence/failure-modes/` (PR #1264), `sentinel_worldview_training_addendum.md` (PR #1291) — the Sentinel pattern Programs/Nexus should mirror
>
> **What this is not.** This is not a technical design doc; the design docs already exist. This is the operational contract for how you (Claude Code) consume them.

---

## 0. Read this entire document before touching any code

Three reasons.

First, the Programs module is substrate-heavy. The default Claude Code instinct (scaffold the route, build the UI, mock the data, iterate) produces exactly the failure modes the design doc is trying to prevent. The substrate has to land first.

Second, the audit format is new. You are the first consumer. Future audits (Intelligence, Tower, Setup, per-agent training) follow this template. How you read and write back to this audit sets the precedent.

Third, several items in the audit are `not_yet_documented` — design gaps that block their dependents. You will be tempted to "design and build in one go." Don't. Surface the gap, get a design decision, then build.

---

## 1. The substrate-before-surface principle

**Programs is not "a workflow UI with an agent." Programs is workflow engine + data model + role model + artifact system + gate engine + tenant context, and Nexus is the conversational front door of all of that.**

The substrate is the product. The agent is the front door. Agent quality is bounded by substrate completeness.

This principle has three operational consequences.

### 1.1 Build order is dependency-driven, not visibility-driven

Build the substrate before the surface that rides on it. The audit's recommended_build_sequence (Phase 1 substrate → Phase 2 workflow → Phase 3 step decomposition / templates → Phase 4 agent flows → Phase 5 governance → Phase 6 eval and telemetry) is the spine. Don't shortcut to Phase 4 agent flows because they're the visible value — they break without Phase 1-3 underneath.

### 1.2 No mocking the substrate to build the surface

If a surface item is blocked because its substrate doesn't exist (e.g., AS-INTENT-CAPTURE-FLOW depends on DM-PHASE-STEP-STATE-TABLE), do not mock the substrate to unblock the surface. Surface the dependency, complete the substrate item, then build.

The exception is honest-fixture mode: when a surface ships before substrate is real, render with a visible "fixture data" badge in dev/staging so the placeholder is never confused for real. Strip the badge when substrate lands.

### 1.3 Honest-fallback discipline

When the agent or surface encounters a substrate gap, surface the gap honestly. Don't fabricate data; don't hide the gap. The Sentinel honesty modes (worldview-pending / vector-pending / tenant-blank) are the pattern — Nexus needs equivalents (eval-harness-pending / pattern-pack-pending / template-pending / persistence-pending).

---

## 2. The four-state audit and what each means for you

Every audit item has `current_state` set to one of five values. Your behavior changes per state.

### 2.1 `built_and_verified` (5 items)

The item is shipped. Don't re-implement.

**Your action:** Reference the file/symbol when other items depend on it. If you discover the item is *not actually shipped* (audit was wrong), update the YAML state to `partial` or `documented_not_built` with a `validation_note` field explaining what's missing.

### 2.2 `partial` (5 items)

Some implementation exists; gaps remain. The audit's `gap_description` names what's missing.

**Your action:** Read the existing implementation first. Extend it; don't rebuild. Update the YAML state to `built_and_verified` only when all `acceptance_criteria` pass.

### 2.3 `documented_not_built` (50 items)

The design doc specifies it; code doesn't have it.

**Your action:** This is the build backlog. Pick items where `dependencies.blocked_by` is empty or fully `built_and_verified`. Use `acceptance_criteria` as the definition of done. Use `code_check.expected_files` and `expected_symbols` as the implementation target. Use `failure_modes_blocked` as the eval-test-coverage target.

### 2.4 `not_yet_documented` (8 items)

A design gap. No design doc covers this; needs a decision before any code.

**Your action: stop and surface the gap to the human reviewer.** Do not propose a design. Do not "make a reasonable assumption." Do not build a stub. The eight design gaps are:
- WF-P3-FULL-STEP-LIST-DESIGN
- WF-WAVE-LOOP-DESIGN
- DESIGN-OUTCOME-TRACKING-DOC
- DESIGN-OVERLAP-DETECTION-RULES
- DESIGN-PHASE-STEP-STATE-PERSISTENCE
- DESIGN-EVAL-HARNESS-SPEC
- TC-EMBEDDING-DIMENSION-RECONCILIATION
- (one more discovered during work)

When you encounter one as a blocker, post the blocker, name what design output is needed (1-3 page addendum, decision document, or schema spec), and wait. The human reviewer will produce the addendum or escalate.

### 2.5 `unknown` (7 items)

Cannot determine state from design docs alone. Repo crawl required.

**Your action:** Run `code_check.validation_command`. Update the YAML to one of the other four states based on what you find. Add a `validation_note` field with what you discovered.

---

## 3. Per-item workflow

For every item you work on, follow this exact sequence.

### 3.1 Read

Read the audit entry in full. Specifically:
- `spec_reference` — find the exact section in the design doc, read it
- `current_state` — confirm it matches reality (run `validation_command`)
- `dependencies.blocked_by` — confirm every blocker is `built_and_verified`
- `acceptance_criteria` — these are your definition of done
- `code_check.expected_files` and `expected_symbols` — these are your implementation targets
- `failure_modes_blocked` — these are eval test coverage targets

### 3.2 Confirm dependencies

For each item in `dependencies.blocked_by`, run its `validation_command` and confirm `built_and_verified` state. If any blocker is not actually in `built_and_verified` state, do not proceed. Surface the dependency gap.

### 3.3 Plan

Before writing code, post a build plan with:
- which acceptance criteria the work addresses (numbered)
- which files will be created or modified
- which tests will land (tied to `failure_modes_blocked`)
- which adjacent audit items the work touches (and their states)
- estimated complexity vs the audit's `estimated_complexity` field

If the plan exceeds the audit's complexity estimate by more than 2x, surface this — it usually means scope creep or a missed dependency.

### 3.4 Build

Implement against `acceptance_criteria`. Don't expand scope to adjacent items unless explicitly directed.

### 3.5 Test

Every `failure_modes_blocked` entry needs at least one test. Tests live in the eval harness once it exists; until then, they live in unit/integration tests with explicit naming linking back to the failure mode (e.g., `it('prevents FM-04 voice drift on complex steps', ...)`).

### 3.6 Update the audit

When the item's `acceptance_criteria` all pass:
- update `current_state` to `built_and_verified`
- add a `built_at` timestamp field
- add a `pr_reference` field with PR number
- add a `validation_note` field if any of `code_check.expected_files` differed from what was actually used

If the item is partially complete, update to `partial` and add a `partial_note` describing what's done and what remains.

### 3.7 Cascade

When an item moves to `built_and_verified`, check the audit for items that have it in `dependencies.blocked_by`. Those items may now be unblocked. Surface this in your status update.

---

## 4. The fixed sequence: Phase 1 substrate first

Do not deviate from this without explicit human direction. The first work in front of you, in order:

### Phase 1 — Substrate (foundational, cannot be parallelized with later phases)

The eight items below are the pilot-readiness foundation. None of Phase 2-6 ships durably without these.

1. **DM-GRAPH-NODES-EDGES-MIGRATION** — Postgres migration for `enterprise_graph_nodes`, `enterprise_graph_edges`, `evidence`, `enterprise_context_chunks`. pgvector extension enabled. tenant_key + RLS on every table.

2. **TC-EMBEDDING-DIMENSION-RECONCILIATION** — *This is a `not_yet_documented` item; surface to human reviewer before proceeding to step 3.* Decision: 1536 (text-embedding-3-small) for tenant data, 3072 (text-embedding-3-large) for worldview, or unified. Worldview content is locked at 3072.

3. **DM-VECTOR-EMBEDDING-PIPELINE** — Embedding pipeline runs on upload events. Records `embedding_model` + `embedding_version`. Dependent on step 2.

4. **DM-EVIDENCE-LEDGER-MIGRATION** — `evidence` table migrated. Apex synthetic dataset (412 evidence items) ingested as smoke test.

5. **TC-PERSISTENCE-INTEGRATION** — `agent-retrieval.ts` queries persistence, not fixtures. Parity tests confirm fixture vs persistence retrieval consistency on existing 152 corpus patterns.

6. **DM-PROGRAM-AUDIT-LOG-TABLE** — `program_audit_log` table, write-only, RLS-scoped.

7. **DM-PROGRAM-ATTACHMENTS-TABLE** + Supabase Storage bucket + virus scan + mime allowlist.

8. **DM-PROGRAM-NOTIFICATIONS-TABLE** + email mirror integration (Resend or Postmark — pick one and surface for human approval).

9. **DM-PROGRAM-APPROVALS-TABLE** — extension of partial existing approval plumbing.

When all of Phase 1 is `built_and_verified`, surface a milestone update before starting Phase 2.

---

## 5. Composition discipline (mirror the Sentinel pattern)

The Sentinel work shipped in PRs #1259 (voice doctrine), #1264 (regression suite), #1291 (worldview addendum) is the template for how Nexus and the Programs agent layer should be built. Follow the same pattern.

### 5.1 Voice doctrine before agent flow

Before AS-INTENT-CAPTURE-FLOW or any agent-flow work, author `AGENT_VOICE_NEXUS.md` with:
- 5 voice rules (coaching, decision-oriented, plain-language, challenges generic, surfaces failure modes by name)
- banned phrases (mirror Sentinel's 23-banned-phrase list, adapted for Nexus's coaching register)
- structural-element requirements (intent question, plan confirmation, template handoff, upload schedule)
- honesty modes (eval-harness-pending / pattern-pack-pending / template-pending / persistence-pending)
- surface-aware default behavior

Voice doctrine ships as a code artifact: a `composeNexusSystemPrompt({ phase, step, archetype, tenantKey, surface, ... })` function plus a `checkNexusVoice` validator. Not as prose-only doc.

### 5.2 Doctrine version stamp

`NEXUS_DOCTRINE_VERSION` const in `src/lib/programs/agent/voice.ts`. Stamp every system-prompt composition with the version. Telemetry events include the version. PostHog dashboards can A/B between versions. This unblocks all telemetry-driven empirical learning.

Ship this *first* — same reasoning as the Sentinel addendum's §7 priority.

### 5.3 Compose, don't parallel

Behavioral rules (word caps, citation limits, fact-vs-forecast labeling, refusal triggers) live inside `composeNexusSystemPrompt` and `checkNexusVoice`. They do *not* live in a separate prose document that runs as a parallel control loop. Two parallel control loops on the same agent drift within weeks.

### 5.4 Eval harness fold

The Programs eval harness (DESIGN-EVAL-HARNESS-SPEC, then EVAL-HARNESS-INFRASTRUCTURE) should be one suite, not per-agent. Worldview fixtures fold into the Sentinel suite at PR #1264; Nexus fixtures fold into the same suite tagged with which Programs failure modes they probe (e.g., `failureModeProbes: [4, 9, 10]`).

### 5.5 Two-stage retrieval as default

When Nexus retrieves patterns from the corpus, retrieve `claim_summary` first (top-K, ~50 tokens each), inflate to full text only for top-2-3. This is the §5 pattern from the Sentinel addendum and applies equally to Nexus.

---

## 6. Failure-mode mapping as the spine

Every item you build maps to which Programs failure modes it prevents. The 10 failure modes (per Programs design doc Section A):

1. Lack of executive sponsorship
2. Unclear success criteria
3. Lack of data foundation
4. Lack of right talent
5. Lack of business commitment to operating-model change
6. Late attention to governance/privacy/risk
7. Vendor and build-vs-buy errors
8. Pilot-to-production gap
9. Inability to measure outcomes
10. Unrealistic expectations / use-case sprawl

Every audit item has `failure_modes_blocked`. Every test you write should reference which failure mode it covers. Every commit message should cite both the audit item ID and the failure modes it addresses. Pattern: `[WF-P0-STEP-DECOMP] Add P0 step decomposition (FM-01, FM-02, FM-04, FM-10)`.

Without this discipline, the work reads as engineering hygiene. With it, the work reads as failure-mode prevention — which is the platform's value proposition.

---

## 7. What to do when you discover the audit is wrong

The audit is a working document. It will be wrong in places. When you find an inconsistency:

### 7.1 Audit overestimates what's built

Item is `built_and_verified` but the code doesn't actually have it (or has a stub).

**Your action:** Update state to `documented_not_built` or `partial`. Add `validation_note: "Audit overestimated; actual state is X because Y"`. Surface the change in your status update so downstream items that thought this was a blocker can be re-evaluated.

### 7.2 Audit underestimates what's built

Item is `documented_not_built` but the code already has it.

**Your action:** Update state to `built_and_verified`. Add `validation_note: "Audit underestimated; existing implementation at <file> meets acceptance_criteria 1-N"`. Surface so dependent items can unblock.

### 7.3 New item discovered

While building an audit item, you discover substrate work that's not in the audit but should be (e.g., a missing schema migration, a missing utility function, a missing config).

**Your action:** Add a new audit item using the same structure as existing items. Use ID prefix matching the layer (WF-/DM-/RM-/AS-/GE-/TC-/CC-) and a sequential suffix. Surface so the human reviewer knows the audit grew.

### 7.4 Acceptance criteria are wrong

Item's acceptance_criteria don't match what the design doc actually requires (or the design doc has shifted since the audit was authored).

**Your action:** Surface to human reviewer. Don't unilaterally rewrite acceptance criteria — they're the contract. The human reviewer either updates the audit or updates the design doc.

---

## 8. Status reporting

Post a status update at the start of each work session and at every milestone.

### 8.1 Session-start update

```
SESSION START
Active items: [list of audit IDs you're picking up]
Blockers: [any blockers from previous session not yet resolved]
Plan: [1-3 sentence summary of what you'll build this session]
```

### 8.2 Per-item milestone update

```
[AUDIT-ID] State change: <old> → <new>
PR: #<number>
Acceptance criteria passed: 1, 2, 3, 5 (4 deferred — see note)
Failure modes covered: FM-X, FM-Y
Cascade: unblocks [dependent audit IDs]
Note: <any deviation from acceptance_criteria, validation_note, or partial_note>
```

### 8.3 Phase-end update

When all items in a build phase (Phase 1, 2, etc.) are `built_and_verified`, post:

```
PHASE <N> COMPLETE
Items shipped: [count + list]
Audit deltas: [items that changed state, items added, items where audit was wrong]
Next phase entry conditions met: [yes/no — if no, what's missing]
Recommended next: [next phase or specific items]
```

### 8.4 Blocker surface

When a `not_yet_documented` design gap blocks progress, post:

```
DESIGN GAP BLOCKER
Audit item: <ID>
Blocking: [list of dependent audit IDs that can't proceed]
Decision needed: [1-2 sentence framing of the design question]
Proposed default: [if you have one — but don't proceed on the default without sign-off]
Estimated unblock latency: [how long the human reviewer needs]
```

---

## 9. What you do not do

Eight things off-limits.

**You do not design.** When `current_state: not_yet_documented`, you stop and surface the gap. Authoring design content (phase pack content, voice doctrine prose, pattern pack semantic content) is the human reviewer's job — typically with senior practitioner input. You can implement against authored design; you don't replace it.

**You do not estimate timelines.** No "this will take 2 days" or "I can ship by Friday." Surface scope, complexity, and dependencies; the human reviewer decides cadence.

**You do not skip Phase 1.** Substrate before surface. If a Phase 4 item is exciting, it waits.

**You do not mock substrate to unblock surface.** Honest-fixture mode (visible badge in dev) is the only acceptable interim. Silent mocks that look real are forbidden.

**You do not author content.** Phase pack content, pattern pack semantic content, template prose, voice doctrine register, eval harness golden conversations — all of these require senior practitioner review. You implement the structure; you don't write the words.

**You do not modify the design doc.** If the design doc is wrong or has shifted, surface the inconsistency. The human reviewer updates the doc.

**You do not bypass the audit's `dependencies.blocked_by`.** If a blocker isn't `built_and_verified`, you don't start the dependent. Even if the blocker "looks easy" or "is mostly there." Discipline on dependency order is what makes the audit format work.

**You do not silently expand scope.** If a build plan grows beyond the audit's `estimated_complexity` by more than 2x, surface this. Either the audit was wrong (fine; flag and continue) or there's hidden scope creep (stop and re-plan).

---

## 10. The first work in front of you

Concretely, today, this is what you do.

**Step 1.** Read this document in full.

**Step 2.** Read `AUDIT_PROGRAMS_SUBSTRATE.yaml` in full. Read `AUDIT_PROGRAMS_SUBSTRATE.md` for narrative context. Read the relevant sections of `PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md` for any item you're touching.

**Step 3.** Run `validation_command` on the 7 items where `current_state: unknown`. Update the YAML based on findings. Surface deltas.

**Step 4.** Post a session-start status update naming Phase 1 substrate as the active scope and TC-EMBEDDING-DIMENSION-RECONCILIATION as the first blocker (it's a `not_yet_documented` design gap that gates Phase 1.3 onward).

**Step 5.** Wait for the design decision on TC-EMBEDDING-DIMENSION-RECONCILIATION before proceeding past Phase 1.2 (DM-GRAPH-NODES-EDGES-MIGRATION).

**Step 6.** When the embedding decision lands, proceed through Phase 1 in the order specified in §4 above. Update the audit after each item. Cascade dependencies.

**Step 7.** When Phase 1 is complete, post a phase-end status update. Wait for human reviewer sign-off before starting Phase 2.

---

## 11. Reference summary

**Audit YAML state machine:**
```
unknown → run validation_command → one of the four below
documented_not_built → build → built_and_verified
partial → extend → built_and_verified
not_yet_documented → surface design gap → wait for addendum → documented_not_built
built_and_verified → don't touch (unless audit was wrong)
```

**Build phase order (no skipping, no parallelizing across phases):**
```
Phase 1: Substrate (data + persistence)
Phase 2: Workflow engine extensions
Phase 3: Step decomposition + pattern packs + templates [content-heavy]
Phase 4: Agent flows
Phase 5: Governance (gates + approvals)
Phase 6: Eval harness + telemetry
Phase 7 (parallel to 1-6): Design gap closure
```

**Composition discipline:**
- Doctrine version stamp ships first
- Voice doctrine = code (compose function + voice checker), not just prose
- Refusal triggers enumerated, not situational
- Two-stage retrieval (claim_summary → top-K, full text → top-2-3)
- One eval harness across agents, not per-agent

**Failure-mode mapping is the spine:**
- Every item maps to which FM it prevents
- Every test references which FM it covers
- Every commit cites audit ID + FM list

**Status reporting:**
- Session start
- Per-item milestone
- Phase end
- Design gap blocker

**What you don't do:**
- Don't design
- Don't estimate timelines
- Don't skip Phase 1
- Don't mock substrate silently
- Don't author content
- Don't modify the design doc
- Don't bypass dependencies
- Don't silently expand scope

---

**End of instructions.**

These are durable. As the audit format evolves, this instructions doc evolves. Updates to either are versioned in git history and surfaced in the next session-start update.

When in doubt, default to: surface the question, don't guess. The human reviewer prefers slow correctness over fast wrongness.
