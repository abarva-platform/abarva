# Knowledge Layer Implementation Plan
**Audit date:** 2026-05-05  
**Branch:** `claude/laughing-kare-a04314`  
**Source:** Gap Backlog `KNOWLEDGE_GAP_BACKLOG_2026-05-05.md`  
**Execution owner:** Claude Code (this agent). Cursor must not execute these PRs without explicit per-PR authorization.

---

## Sequencing principles

1. P0 gaps before P1 gaps — correctness before coverage.
2. Shared type changes before consumers — never break a downstream first.
3. Test-first for any catalog or schema change — no gap closed without a failing test that becomes green.
4. Commit per logical unit, PR per gap or tightly coupled gap cluster.
5. No PR merges without `npx tsc --noEmit` and relevant Jest suite green.

---

## PR Sequence

### GAP-IMPL-1 · Reconcile failure-mode catalogs

**Gap addressed:** GAP-P0-1  
**PR title:** `feat(knowledge): reconcile programs + intelligence failure-mode catalogs into shared ID space`

**Scope:**
1. Create `src/lib/programs/failure-mode-registry.ts` — unified registry that exports both catalogs under a shared `UnifiedFailureMode` type with a `catalogSource: 'programs' | 'intelligence'` discriminant and a stable `canonicalKey` string.
2. Add a mapping table: programs FM integer IDs 1–10 → canonical keys; intelligence FM string keys → canonical keys. Where there is no programs equivalent (e.g., `pilot_purgatory`), assign a new integer ID 11–12.
3. Update `failure-mode-prompt.ts` to pull from the unified registry for the phase-appropriate subset.
4. Update `detection-rules.ts` to reference canonical keys.
5. Add `src/lib/programs/__tests__/failure-mode-registry.test.ts` — asserts: every programs FM has a canonical key, every intelligence FM has a canonical key, no duplicate canonical keys, phase coverage is symmetric.

**Dependencies:** None (additive only).  
**Acceptance criteria:**
- `npx jest src/lib/programs/__tests__/failure-mode-registry.test.ts` green.
- `failure-mode-prompt.test.ts` still passes (char ceiling not exceeded).
- `ai-program-failure-modes.ts` unchanged (additive wrapper only).

---

### GAP-IMPL-2 · Source stage → Programs phase bridge

**Gap addressed:** GAP-P0-2, GAP-P2-4  
**PR title:** `feat(knowledge): add Source stage → Programs phase bridge and broker domain`

**Scope:**
1. Create `src/lib/programs/source-phase-bridge.ts` — a mapping table: Source stage IDs (Plan, RFI, Shortlist, RFP, Q&A, Initial-Bid, BAFO, Selection, Award, Onboard) → Programs phase ranges (e.g., Plan → P0–P1, RFP → P2, BAFO → P3–P4, Award → P4–P5).
2. Add `source` as an optional domain in `programs-broker-adapter.ts` requests — when a program has a linked source event, include the source lifecycle stage context.
3. Update `agent-context-broker.ts` to route `source` domain requests through `source-lifecycle-patterns.ts` for the matched pattern.
4. Add tests: `source-phase-bridge.test.ts` asserts every stage maps to at least one phase; broker integration test asserts source domain is populated when source event is present.

**Dependencies:** None.  
**Acceptance criteria:**
- New test suite green.
- `broker.test.ts` unchanged (additive domain).

---

### GAP-IMPL-3 · Archetype primers for 4 missing archetypes

**Gap addressed:** GAP-P0-3  
**PR title:** `feat(programs): add archetype primers for Platform Modernization, Supply Chain AI, Pricing AI, Store Operations AI`

**Scope:**
1. `src/lib/programs/archetype-primers/PAT-PRG-PLAT-MOD-001.ts` — Platform Modernization primer. Follows `ArchetypePrimer` interface: `patternId`, `displayName`, `smesNeeded[]`, `dataAssetsNeeded[]`, `estimatedEngagementWindow`, `phases[]` with per-phase `templates[]` and `workshops[]`.
2. `src/lib/programs/archetype-primers/PAT-PRG-SC-AI-001.ts` — Supply Chain AI primer.
3. `src/lib/programs/archetype-primers/PAT-PRG-PRICING-AI-001.ts` — Pricing AI primer.
4. `src/lib/programs/archetype-primers/PAT-PRG-STORE-OPS-001.ts` — Store Operations AI primer.
5. Register all four in `archetype-primers/index.ts`.
6. Add tests: one test file per primer validating required fields and phase coverage.

**Dependencies:** Types from `archetype-primers/types.ts` are stable — no changes needed.  
**Acceptance criteria:**
- All four primer tests green.
- `getArchetypePrimer('PAT-PRG-PLAT-MOD-001')` returns non-null.
- Apex Retail programs (Unified CDP, Supply Chain Control Tower) resolve a primer without fallback.

---

### GAP-IMPL-4 · Wire Nexus mode B and C to model executor

**Gap addressed:** GAP-P0-4  
**PR title:** `feat(programs): wire Nexus thread mode B (draft) and mode C (CXO takeover) to model executor`

**Scope:**
1. Identify the model executor entry point in `src/lib/nexus/` (the composer layer).
2. In `src/lib/programs/nexus.ts`: add `executeNexusTurn(thread, userMessage, phaseContext)` — calls composer with assembled context (broker bundle + phase pack + failure modes + thread history).
3. Mode B: composer is instructed to produce a structured draft for the active deliverable; output is written to `program_evidence_items` as a draft version.
4. Mode C: composer follows the CXO interview protocol (structured Q→A from `rightQuestions`); output is written to phase findings.
5. Add integration test: `nexus-mode-b.test.ts` asserts a draft is persisted after a mode B turn; `nexus-mode-c.test.ts` asserts phase finding is written after a mode C structured question sequence.

**Dependencies:** GAP-IMPL-1 (unified failure modes used in context assembly).  
**Acceptance criteria:**
- Mode B produces a `program_evidence_items` draft row in the test.
- Mode C writes a phase finding in the test.
- Mode A (existing `/api/chat/agent` path) is unchanged.
- `npx tsc --noEmit` clean.

---

### GAP-IMPL-5 · Add PhaseStep arrays to P3 and P4 packs

**Gap addressed:** GAP-P1-1  
**PR title:** `feat(programs): add steps[] to P3_design and P4_build phase packs`

**Scope:**
1. Author `steps[]` in `src/lib/programs/phase-packs/P3_design.ts` following the step definitions from the Training Framework (5 steps: operating-model design, solution architecture, requirements traceability, risk-tradeoff capture, design signoff).
2. Author `steps[]` in `src/lib/programs/phase-packs/P4_build.ts` (6 steps: roadmap draft, business case, change readiness, tower metric plan, vendor selection, funding approval).
3. Update `P3_design.test.ts` and `P4_build.test.ts` to assert step count and required fields.

**Dependencies:** `types.ts:PhaseStep` already defined.  
**Acceptance criteria:**
- Phase pack tests green.
- `phase-packs.test.ts` passes unchanged.

---

### GAP-IMPL-6 · Include active phase pack in Programs context bundle

**Gap addressed:** GAP-P1-3  
**PR title:** `feat(programs): inject active PhasePack into Programs broker context bundle`

**Scope:**
1. In `programs-broker-adapter.ts`: when `programId` is provided and a current phase is resolvable, call `getPhasePack(currentPhase)` and include the pack's `rightQuestions`, `antiPatterns`, and `coachingArc` in the context bundle as a new `phasePack` field.
2. Update `formatProgramsContextBlock()` to include the phase pack section in the assembled prompt block.
3. Add test: `programs-broker-adapter.test.ts` asserts phasePack is present when currentPhase is 1.

**Dependencies:** `phase-packs/index.ts` (stable), `programs-broker-adapter.ts`.  
**Acceptance criteria:**
- Broker test green.
- Phase pack content appears in the assembled context block.

---

### GAP-IMPL-7 · Apex integration adapter

**Gap addressed:** GAP-P1-5  
**PR title:** `feat(knowledge): author Apex Retail integration adapter for persisted tenant corpus`

**Scope:**
1. Create `src/lib/knowledge/private-data-plane/adapters/apex-retail.ts` — maps broker request with `tenantKey: 'apex-retail'` to Supabase-persisted tenant data (14 segments, 403 records, 257 nodes, 275 edges loaded 2026-04-30).
2. Register adapter in `registry.ts`.
3. Add smoke test: `apex-retail-adapter.test.ts` — calls adapter with a real query, asserts non-empty result set (requires Supabase service-role key in test env).
4. Confirm embeddings status — if embeddings are pending, adapter falls back to graph/segment data with a logged warning.

**Dependencies:** Supabase data loaded 2026-04-30 (confirmed). Codex owns data-room persistence; Claude Code owns the adapter surface. Do not modify `enterprise-data-room-persistence.ts` — only add the adapter.  
**Acceptance criteria:**
- Adapter returns non-empty bundle for `tenantKey: 'apex-retail'`.
- Fallback to fixture is logged when called without Supabase key.
- `broker.test.ts` unchanged.

**Note:** Collision check required — `gh pr list --search "context-broker OR retrieval OR pinecone OR corpus"` before starting.

---

### GAP-IMPL-8 · Bind workshop template library to phase pack step templateRefs

**Gap addressed:** GAP-P1-7  
**PR title:** `feat(programs): bind PhaseStep.templateRefs to workshop-template-library`

**Scope:**
1. In `phase-packs/types.ts`: change `templateRefs: string[]` to `templateRefs: WorkshopTemplateKey[]` — import `WorkshopTemplateKey` from `workshop-template-library.ts`.
2. Add `resolveTemplatesForStep(step: PhaseStep): WorkshopTemplate[]` to `workshop-template-library.ts`.
3. Update all phase packs that have `steps[]` to use valid `WorkshopTemplateKey` values.
4. Add test: `workshop-template-binding.test.ts` asserts every templateRef in every step resolves to a non-null template.

**Dependencies:** GAP-IMPL-5 (P3/P4 steps must exist first).  
**Acceptance criteria:**
- Binding test green.
- `WorkshopTemplateKey` is a string literal union, not `string`.

---

### GAP-IMPL-9 · Wire failure-mode anti-pattern detection to telemetry

**Gap addressed:** GAP-P2-3  
**PR title:** `feat(programs): wire anti-pattern detection signals to failure_mode_telemetry`

**Scope:**
1. In the agent turn handler (where Nexus responds): add a post-turn hook that scans the assistant response for anti-pattern signals matching `PhaseAntiPattern.detectionHint` patterns.
2. When a match is found, call `emitFailureModeTelemetry()` from `failure-mode-telemetry.ts` with the matched FM id, phase, and program id.
3. Add test: stub the anti-pattern detection hook, assert telemetry is emitted when a known detectionHint pattern appears in the response.

**Dependencies:** GAP-IMPL-1 (unified catalog to resolve FM ids).  
**Acceptance criteria:**
- Telemetry test green.
- No additional latency on turns without pattern matches (detection is string-scan only).

---

### GAP-IMPL-10 · Per-phase pattern bundle validation test

**Gap addressed:** GAP-P2-5  
**PR title:** `test(programs): add cross-phase coverage validation for all archetype primers`

**Scope:**
1. Add `src/lib/programs/archetype-primers/__tests__/phase-coverage.test.ts`.
2. For each registered primer, for phases 0–5: assert that `templates` and `workshops` arrays for that phase are non-empty (or explicitly marked as `notApplicable`).
3. Run against all 10 primers (6 existing + 4 from GAP-IMPL-3).

**Dependencies:** GAP-IMPL-3 (4 new primers must exist).  
**Acceptance criteria:**
- Test fails for any primer/phase combination with empty guidance.
- Test passes when all primers have complete phase coverage.

---

## Dependency graph

```
GAP-IMPL-1 (catalog reconcile)
    └─ GAP-IMPL-4 (mode B/C wiring)
    └─ GAP-IMPL-9 (telemetry)

GAP-IMPL-3 (4 new primers)
    └─ GAP-IMPL-10 (phase coverage test)

GAP-IMPL-5 (P3/P4 steps)
    └─ GAP-IMPL-8 (template binding)

GAP-IMPL-6 (phase pack in bundle) — independent
GAP-IMPL-2 (source bridge) — independent
GAP-IMPL-7 (Apex adapter) — independent, requires Codex collision check
```

---

## Estimated effort

| PR | Complexity | Est. sessions |
|----|-----------|--------------|
| GAP-IMPL-1 | Medium | 1 |
| GAP-IMPL-2 | Medium | 1 |
| GAP-IMPL-3 | High (×4 primers) | 2 |
| GAP-IMPL-4 | High (model wiring) | 2 |
| GAP-IMPL-5 | Low | 0.5 |
| GAP-IMPL-6 | Low | 0.5 |
| GAP-IMPL-7 | Medium | 1 |
| GAP-IMPL-8 | Low | 0.5 |
| GAP-IMPL-9 | Medium | 1 |
| GAP-IMPL-10 | Low | 0.5 |
| **Total** | | **~10** |

Recommended execution order: 1 → 5 → 6 → 3 → 2 → 7 → 4 → 8 → 9 → 10.
