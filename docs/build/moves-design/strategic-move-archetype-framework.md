# Strategic Move Archetype Framework

**Status:** built + live-proven · 2026-06-09 · branch `feat/move-current-state-readiness` (PR #3371)
**Thesis:** _grounded authority at machine speed_ — the recommendation is computed from the
client's own evidence, every claim is traceable, deliverables are board-grade and client-
customizable without bluffing, and the engine generalizes across use cases/industries by
configuration, not custom code.

---

## 1. The spine + the variation

A **universal 7-phase spine** — Originate → Charter → Diagnose → Design → Roadmap/Business-Case
→ Mobilize → Handoff/Operate — runs every strategy Move. What varies per use case is declared by
a **`StrategicMoveArchetype`**, never hardcoded in Charter/phase code:

```
StrategicMoveArchetype { id, name, version, status, applicableIndustries/Functions,
  phaseModel[],            // per phase: required evidence, analysis methods, deliverables, gates
  evidenceFamilies[],      // the evidence the work can require
  analysisMethods[],       // composed from the method library by key
  deliverablePack[],       // board-grade deliverables, each with a quality rubric + refinement
  valueModel, riskModel, agentGuidance }
```

`src/lib/programs/archetypes/{types,registry,method-library,resolver}.ts`.

## 2. Two-axis requirement resolution (the key generalization)

```
required(phase) = archetype.requirements(phase)  ⨯  estate(profile)
```

The **archetype** says what kind of evidence the work needs; the client's real **estate**
(the `MoveProfile`, inferred from the context layer) decides which specific instruments apply and
at what severity. AI-PDLC requires an "engineering delivery baseline" — which resolves to **DORA**
for a full-stack/cloud estate, **change-cadence** for a mainframe estate, **ETL job inventory** for
a DataStage estate. No domain vocabulary is hardcoded in phase code (`resolveArchetypeRequirements`).

## 3. The governed evidence ladder (promotion-only)

`missing → staged → parsing → committed → indexed → retrievable → citation_ready →
promotion_candidate → agent_ready`. v1 reaches `committed` (rows in the backing `tower_*` table,
cited in `evidence_ledger`). **`agent_ready` is reachable ONLY through the governed promotion
workflow — never automatically.** Uploads record full governance lineage (move, tenant, archetype,
phase, family, source-basis, state). No silent missing evidence; states are reported separately.

## 4. Methods as a library

`maturity_scoring · two_gap · leverage_ranking · workpackage_roadmap_estimate · should_cost ·
sla_gap`. Archetypes **compose** methods by key. AI-PDLC picks maturity + two-gap + leverage
(→ the computed "where to start", an OUTPUT never asked); IT_SOURCING picks should-cost + sla-gap.
New archetypes pick methods — they don't fork the engine.

## 5. Grounded deliverables + prompt refinement

Deliverables are assembled from committed evidence: **every claim is cited or flagged
`[MISSING EVIDENCE]`** — `unsupportedClaims === []` by construction. The client refines by prompt
(sharpen narrative/structure/depth/audience) under an enforced **grounding guard**: the cited-claim
set never grows and missing flags persist — _"enhance quality" cannot add a fact not in the
evidence._ Versioned + logged (`deliverable-refinement.ts`, `DeliverableArtifactCard.tsx`).

## 6. Agent grounding contract

Every agent receives the **`ArchetypeContextBundle`** (tenant, archetype, phase, profile,
readiness + states, recommendation, plan, missing-evidence) before reasoning — no raw user-only
prompt reaches Claude. Every answer emits the **GroundedAnswer envelope**
(tenant, archetype, evidenceUsed, missingEvidence, citations, unsupportedClaims, confidence,
specific) or returns "insufficient context" (`archetype-context-bundle.ts`).

## 7. The 8-point rubric (scored every change)

grounded-or-silent · computed-not-asked · archetype-driven · continuity · tenant-safe ·
honest-ladder · cross-industry (swap test) · felt-rigor + control.

## 8. PR ledger (all built; PR-1..PR-6 deployed + live-proven on ACA)

| PR  | What                                                                                                                                      | Revision            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 1   | Archetype framework types + registry + two-axis resolver; `current-state-readiness` made archetype-driven (global hardcoded list deleted) | `--pr1-584382829b`  |
| 2   | Full AI-PDLC archetype; estate-resolved baselines (mainframe/DataStage/full-stack); deliverable pack                                      | (logic)             |
| 3   | World-class archetype-driven readiness panel (honest ladder hero, where-to-start math)                                                    | `--pr3-3fc7ffc45c`  |
| 4   | Governed upload lineage + honest separated states + "to unblock this charter" CTA                                                         | `--pr4-31a7f71074`  |
| 4.5 | Grounded deliverable generation + prompt refinement (no fabrication)                                                                      | `--pr45-c73c27bd70` |
| 5   | REAL move `0d14fa63` advanced P0→P1 through the real gate (governed p0-brief) + deliverable artifact-card UI                              | `--pr5b-33fe2be766` |
| 6   | ArchetypeContextBundle + grounded agent answering; SkyHarbor answer-quality report                                                        | `--pr6-b28653190a`  |
| 7   | Generality proof — IT_SOURCING_EVENT through the same engine, zero Charter-code change                                                    | (logic)             |

## 9. Live proofs (real, non-seeded move `0d14fa63`, tenant skyharbor)

- **Grounded:** DORA committed + cited to `tower_dora_metrics`; Charter cites it; maturity scored + cited.
- **Refusal:** 5 hard families flagged `[MISSING EVIDENCE]`; "make it impressive, add ROI numbers"
  refine produced **0 fabricated facts**; `unsupportedClaims === []` everywhere.
- **Swap test:** IT_SOURCING_EVENT yields entirely different P1 evidence + deliverables + answers,
  zero Charter-code change (`generality.test.ts`).
- **Tests:** 9 suites / 78 tests green; `tsc` clean.

## 10. Known gaps / next

- Richer evidence states (`indexed`→`agent_ready`) need the promotion workflow wired (the data
  model + UI already represent them honestly).
- LLM Nexus/Sentinel answers should be routed through the GroundedAnswer contract (the deterministic
  seam is the floor + test harness today).
- More archetypes; per-move archetype selection (default AI-PDLC today); CSV ingest for more families.
- Enrichment writeback (completed Moves enrich the archetype) — the self-improving flywheel.
