# Nexus Pattern Context Contract · 2026-05-05

| Field    | Value |
|----------|-------|
| Date     | 2026-05-05 |
| Status   | Design pack · read-only |
| Scope    | How Nexus loads, uses, and cites patterns in a Strategic Move session. Does not cover Intelligence Ask (different surface). |
| Companion | `NEXUS_AGENT_TRAINING_FRAMEWORK_2026-05-05.md` (what Nexus does with patterns); `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` (which patterns per phase) |

## Purpose

This contract specifies the **mechanics** of pattern context in the Nexus agent route:
- What gets loaded and when
- How patterns are represented in the system block
- How Nexus must cite and attribute patterns
- What Nexus may and may not infer from a loaded pattern
- How pattern context updates across turns

## 1 · Load sequence per session turn

```
1. PHASE ENTRY (once per phase transition)
   Load required_patterns[] for the current phase
   → Phase-pattern map: src/lib/programs/phase-pattern-map.ts (GAP-8, to create)
   → Each required pattern: fetch from DEFAULT_PATTERNS corpus by ID
   → Pack into system block section "## PHASE KNOWLEDGE BUNDLE"

2. CLASSIFIER RESULT (every turn with a user message)
   Run classifier.ts 3-stage pipeline
   → Top-3 PatternClassifierMatch results
   → Append matches above threshold 0.4 to system block section "## CONTEXTUAL PATTERNS"
   → Existing phase bundle is not replaced, only augmented

3. SIGNAL MATCH (when a signal fires)
   signal_catalog.recommended_pattern_keys[] for the matched signal
   → Load each recommended pattern by key
   → Append to "## SIGNAL PATTERNS" section
   → De-duplicate against what's already loaded

4. UPLOADED ARTIFACT (when user uploads a doc)
   source_artifacts.used_pattern_ids[] populated by broker
   → Surface used patterns as "## ARTIFACT-LINKED PATTERNS"

5. TURN SUMMARY (every turn)
   → Log pattern IDs cited in this turn to pattern_match_logs
   → Do not re-log patterns that were loaded but not referenced
```

## 2 · System block structure

The agent route (`src/app/api/chat/agent/route.ts`) assembles a system block before each model call. The pattern context sections are:

```
## ACTIVE PHASE PLAYBOOK · {phase_name}
{formatPhasePackForPrompt(pack)}                    ← existing (from phase-packs/)

## PHASE KNOWLEDGE BUNDLE
[loaded once on phase entry; P0..P5 required patterns from phase-pattern-map.ts]
Pattern: {id} — {title} ({domain}/{tier})
  Thesis: {thesis}
  Applicability: {applicability}
  Confidence: {confidence}

## CONTEXTUAL PATTERNS
[added per turn from classifier; only patterns above threshold]
Pattern: {id} — {title} (classifier confidence: {band})
  Rationale: {rationale}

## SIGNAL PATTERNS
[added when a signal fires; from signal_catalog.recommended_pattern_keys]
Pattern: {id} — {title} (triggered by signal: {signal_key})

## ARTIFACT-LINKED PATTERNS
[added when an artifact is ingested; from used_pattern_ids[]]
Pattern: {id} — {title} (linked via artifact: {artifact_name})
```

## 3 · Citation rules

### When Nexus may state a pattern as relevant
- Pattern ID is in one of the four sections above for the current turn
- Pattern's `confidence` is ≥ 0.4 (validated or authoritative tier preferred)

### How Nexus must cite
- Say: "Based on [pattern title] — this typically manifests as…"
- Do NOT fabricate the pattern ID or title (the ID must be in the loaded context)
- Do NOT paraphrase a pattern's thesis as if it were a general observation without attribution

### When Nexus must say it doesn't know
- If no loaded pattern covers the user's question: "I don't have a specific pattern for this. Let me ask a few questions to understand the situation before advising."
- If classifier confidence is below threshold: do not cite the match; instead ask clarifying questions.

### Anti-hallucination
- Do not invent pattern IDs, slugs, or titles.
- Do not cite a pattern from memory if it is not in the current system block.
- Do not claim a pattern is "industry standard" — cite the pattern's `tier` and `confidence` instead.

## 4 · Pattern context update rules across turns

| Event | Action |
|-------|--------|
| Phase transition (e.g. P1 → P2) | Reload phase bundle from the new phase's required_patterns[]. Prior phase bundle is dropped. |
| User uploads a document | Trigger broker retrieval → update `source_artifacts.used_pattern_ids[]` → append artifact-linked patterns to context. |
| User explicitly asks about a pattern | If the pattern is not loaded, retrieve it by ID from DEFAULT_PATTERNS and add to contextual section for this turn only. |
| Pattern confidence drops (engagement update) | Re-run classifier on next turn; replace the contextual patterns section. |
| Pattern used in gate evaluation | Log to `pattern_match_logs` with `match_context_jsonb` recording the gate check that triggered it. |

## 5 · Pattern fabric constraints Nexus must respect

| Constraint | Rule |
|------------|------|
| Vendor claims | Only state vendor capabilities that appear in `seed-patterns-sourcing-vendors-*.ts` or in an uploaded vendor document. Never invent vendor pricing, SLA, or roadmap. |
| AI architecture claims | Only cite architecture patterns from `seed-patterns-architecture.ts`. Never assert that a model, framework, or integration approach "works" without a loaded pattern or uploaded evidence. |
| Regulatory claims | Only cite regulatory patterns from `seed-patterns-sourcing-regulatory.ts` or `seed-patterns-sourcing-regulatory-ai.ts`. Never invent compliance requirements. |
| Failure mode claims | Only cite failure modes from the loaded system block (either 10-id or 12-key catalog). State the failure mode ID or key. |
| Baseline claims | Never assert a baseline value (cost, cycle time, defect rate, adoption rate) without a provenance source from the current session's uploaded artifacts or user-confirmed input. |

## 6 · What is NOT covered by this contract

- **Pattern authoring** (how new patterns are added to the corpus)
- **Pinecone indexing** (how patterns reach the vector store)
- **Neo4j graph** (`pattern-deliverable-query.ts`, feature-flagged)
- **Intelligence Ask** (separate J0 surface with its own citation model)
- **pattern_packs SQL table** (broker-mediated; separate from DEFAULT_PATTERNS TS corpus)

## 7 · Implementation gap

**Today** (2026-05-05): pattern context is entirely reactive. There is no `phase-pattern-map.ts`. The PHASE KNOWLEDGE BUNDLE section does not exist. The agent route only has the active phase playbook section from `formatPhasePackForPrompt(getPhasePack(promptPhase))`.

**What must be built** (see GAP-8 in the gap backlog):
1. `src/lib/programs/phase-pattern-map.ts` — `PHASE_REQUIRED_PATTERNS: Record<0|1|2|3|4|5, string[]>` and `PHASE_OPTIONAL_PATTERNS: Record<0|1|2|3|4|5, string[]>` populated from the binding matrix.
2. Agent route modification: at phase entry, `loadPhasePatternsForPrompt(phase)` → reads DEFAULT_PATTERNS by ID → serializes into "## PHASE KNOWLEDGE BUNDLE" block.
3. Citation logging: after each turn, log cited pattern IDs to `pattern_match_logs` (distinct from classifier-triggered logs).
