# Knowledge Layer · Implementation Plan

| Field    | Value |
|----------|-------|
| Date     | 2026-05-05 |
| Status   | Design pack · read-only |
| Input    | `docs/design/knowledge-layer/KNOWLEDGE_GAP_BACKLOG_2026-05-05.md` (10 items) |
| Output   | Sequenced wave plan for closing gaps before pilot |

## Guiding constraints

1. **PR #1517 should NOT merge until GAP-1 and GAP-2 are resolved.** The impl PR ships vocabulary that contradicts the running phase packs and failure-mode catalog — merging it creates a split-brain state that will confuse Nexus immediately.
2. **No DB migrations land before the design pack is stable.** The remap migration in PR #1517 is directionally correct but should only apply after GAP-1 + GAP-2 close, so the full 6-phase model lands coherently in one merge window.
3. **Documentation-first rule (from the original audit ask).** Design docs close first; code closes second. No new impl wave starts for a gap until the design doc says what "done" looks like.
4. **Broker boundary** (per memory rule): app-tier must not import EnterpriseDataRoom / broker / vector / graph directly — go through AgentContextBroker. Any impl touching the knowledge layer must respect this.

---

## Wave 0 — Doctrine coherence (P0 gaps; before any other code lands)

**Goal**: make the codebase coherent with the doctrine that PR #1517's doctrine doc already locked. No new features; just fixes.

**Scope**:
- **GAP-1**: Rewrite `failure-modes.ts` items 5, 9, 10 — retire P6 refs, update narrative to doctrine vocabulary. No API/schema change; test update only.
- **GAP-2**: Rename and rewrite the 6 phase packs to doctrine labels; retire `P6_OPERATE` (move to `tower-packs/` stub). Update all pack tests.

**Target**: single PR, squash to main.
**Owner**: any code agent; no coordination needed.
**Effort**: 1–2 dev-days.
**Unlock**: merge PR #1517 safely after this lands.

---

## Wave 1 — Phase-entry context quality (P1 gaps that block pilot usefulness)

**Goal**: Nexus loads the right pattern bundle when a user enters a phase, not just when the classifier fires. Fix the failure-mode catalog split.

**Scope**:
- **GAP-8**: Create `src/lib/programs/phase-pattern-map.ts` — required + optional pattern IDs per phase (P0..P5), based on `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` `required_patterns` fields. Wire into agent route at phase entry.
- **GAP-3 — Option C (boundary doc)**: Publish the federation map for the two failure-mode catalogs in code as comments + a doc section. Choose canonical boundary: Programs FM = gate eval + coaching; AI-Programs FM = Intelligence Ask + pattern matching. Cross-reference table in source. (Full merge, Option B, deferred to Wave 3.)
- **GAP-5**: Create `src/lib/source/phase-to-stage-map.ts` — P→S mapping enabling P3/P4 sourcing triggers.

**Target**: single PR or two sequential PRs (phase-pattern-map can be independent of FM boundary).
**Owner**: code agent familiar with agent route.
**Effort**: 2–3 dev-days.
**Unlock**: Nexus coaching quality improves measurably; P3/P4 sourcing handoff is wirable.

---

## Wave 2 — Pattern fabric integrity (P1 + P2 gaps)

**Goal**: close structural integrity issues in the pattern layer so agents and broker reads are safe.

**Scope**:
- **GAP-4**: Publish TypeScript interfaces for `pattern_packs` jsonb columns (`PatternPackDetectionSignal`, `PatternPackRootCause`, `PatternPackInterventionOption`, `PatternPackEvidenceRequirement`). Add Zod validators. New file: `src/lib/intelligence/pattern-pack-schema.ts`.
- **GAP-6**: Rename `generated/pattern-manifest.json` to `generated/pattern-design-pack-manifest.json`. Update all references. Update `pattern-graph-validation.ts` to document its scope limitation explicitly (design-pack only). Add CI count-freshness check.
- **GAP-7**: Publish naming doctrine section. Audit `src/components/strategic-moves/` for "program" in user-facing copy. Add grep lint check.

**Target**: two PRs (GAP-4 independent of GAP-6+7).
**Owner**: code agent + brief review for naming string changes.
**Effort**: 2–3 dev-days.
**Unlock**: broker reads are type-safe; count references are accurate; UI copy consistent.

---

## Wave 3 — Long-term catalog unification (P2 + P3 gaps)

**Goal**: fully merge the two failure-mode catalogs into a single source of truth. Improve type richness in phase packs.

**Scope**:
- **GAP-3 — Option B (merge)**: Produce a unified `failure-modes-unified.ts` catalog that carries both integer IDs (for gate eval backward-compat) and string keys (for AI-program prompts). Migration: convert `pattern_match_logs` and gate-eval call sites to the unified type. Deprecate the split files.
- **GAP-10**: Upgrade `PhaseEvidenceItem` and `PhasePack.antiPatterns` to typed structs with `relatedFailureModeId` + `relatedFailureModeKey`. Update all 6 phase packs + tests.

**Target**: two PRs (catalog merge and type enrichment can be independent).
**Owner**: code agent; coordinate with Codex if Codex owns the Intelligence Ask surface.
**Effort**: 3–5 dev-days.
**Unlock**: single canonical failure-mode source; richer coaching context.

**Codex collision check required before starting Wave 3**: run `gh pr list --search "failure-mode OR ai-program-failure"` to confirm Codex is not in-flight on this territory.

---

## Wave 4 — Pilot audit trail (P2 gap)

**Goal**: add first-class self-approval and audit trail to gate decisions — required for pilot.

**Scope**:
- **GAP-9**: Add `approval_type`, `approved_by`, `approved_at` to gate approval record. Implement delegation token (sponsor → program lead). Wire gate approval event to `program_audit_log`. Update `governance.ts` gate evaluation to write audit rows.

**Target**: single PR with migration + logic changes.
**Owner**: code agent with DB migration authority.
**Effort**: 3–5 dev-days.
**Pilot hard requirement**: nothing in pilot can be gate-approved without this.

---

## Merge sequence and PR #1517 disposition

```
TODAY (2026-05-05):
  - Design pack docs land (this PR + predecessor binding matrix) ✅

Wave 0 (before PR #1517 merges):
  - GAP-1: failure-modes.ts P6 retire
  - GAP-2: phase-packs rename + P6_OPERATE retire
  - Then: PR #1517 merge unlocked

Wave 1 (after #1517):
  - GAP-8: phase-pattern-map
  - GAP-3 (Option C boundary): FM catalog boundary doc
  - GAP-5: P→S source stage map

Wave 2 (after Wave 1 stabilizes):
  - GAP-4: pattern-pack-schema.ts + Zod validators
  - GAP-6: manifest rename + graph-validation scope doc
  - GAP-7: naming doctrine + string audit

Wave 3 (before pilot code freeze):
  - GAP-3 (Option B merge): unified failure-mode catalog
  - GAP-10: PhaseEvidenceItem + antiPatterns typed

Wave 4 (pilot requirement):
  - GAP-9: gate approval audit trail + delegation token
```

---

## Remaining design pack deliverables (not yet blocked on any gap)

These docs can be written in parallel with Wave 0 execution:

| # | File | Purpose |
|---|------|---------|
| 1 | `docs/design/knowledge-layer/KNOWLEDGE_LAYER_INVENTORY_2026-05-05.md` | Catalog of all knowledge layer artifacts with post-doctrine delta from the 2026-04-29 audit |
| 2 | `docs/design/knowledge-layer/PATTERN_FABRIC_DESIGN_2026-05-05.md` | Target-state architecture for the pattern fabric |
| 3 | `docs/design/nexus/NEXUS_PATTERN_CONTEXT_CONTRACT_2026-05-05.md` | Agent-side contract for how Nexus loads and cites patterns per turn |
| 4 | `docs/design/agent-coordination/AGENT_COORDINATION_KNOWLEDGE_TRANSFER_PROTOCOL_2026-05-05.md` | No-loss handoff rules between Cursor/Codex/Claude agents that touch the knowledge layer |
| 5 | `scripts/audit/knowledge-layer-inventory.sql` | Read-only inspection queries for the SQL substrate |
