# Deliverable Intelligence Orchestrator

## Problem

Today's board-grade deliverables (Moves board-grade routes, Source export renderers)
are **kernel/template-derived**: a deterministic view-model is computed, then a renderer
emits HTML/DOCX/PPTX. There is **no Claude authoring step with expert latitude**. The
result is correct but mechanical — it reads like a filled template, not a senior
consulting artifact. The opposite failure (let Claude write freely) fabricates client
facts.

## Principle

Claude must operate in **two modes at once**:

1. **Governed factual mode** — every client-specific fact (names, owners, dates,
   financials, KPIs, systems, vendor contracts, timelines, legal terms, benchmarks,
   pricing, approvals) comes **only** from governed evidence, an approved assumption, or
   an explicit placeholder. Never invented.
2. **Expert artifact mode** — structure, narrative, exhibits, tables, decision logic,
   boilerplate, industry-standard sections, and professional language draw on Claude's
   **full expert knowledge**. Claude is explicitly told it is *not* limited to the
   minimum section list.

Do **not** over-constrain Claude into mediocre output. Do **not** optimize for short
documents.

## Architecture (`src/lib/deliverables/orchestrator/`)

| File | Responsibility |
|---|---|
| `types.ts` | The three contracts — `DeliverableIntelligenceRequest`, `DeliverableArtifactBrief`, `DeliverableGenerationPlan` — plus pass/validation/renderable types. |
| `artifact-brief-registry.ts` | Resolves the **artifact intelligence brief** for a (module × archetype × deliverable type). Briefs are data: baseline structure + expected exhibits/tables + explicit expert-latitude grant + governance boundary. Seeded with the AMS RFP reference brief; module-level default covers the rest. |
| `source-register.ts` | Turns governed candidates into clean, citation-numbered evidence (no internal ids) + the exposed Source Register; excludes `internal_only` evidence for vendor-facing audiences; provides the internal-leak scanner. |
| `prompt-builder.ts` | Builds the six-pass prompt sequence following the 8-point Prompt Construction Standard. High-stakes passes get generous token budgets (no cramped calls). |
| `generation-plan.ts` | Validates Claude's Pass-1 plan before any drafting (required sections present, only-existing citations, no fabrication-risk sections, every gap/client-complete handled). |
| `quality-validator.ts` | Pre-export gate. **Blocks** leaked internal tags, unsupported client claims, too-short docs, missing source register / decision / recommendation / risk table, tiny formatting. **Warns** on mechanical/thin/generic/under-used-evidence. |
| `orchestrator.ts` | Drives the multi-pass loop with an injected `ModelCaller` (PR-3 backs it with the audited Anthropic egress). |

## Flow

1. Resolve module/use-case/phase/deliverable → **artifact brief**.
2. Build clean **source register** from governed evidence.
3. **Pass 1 — Architect**: design the best structure (plan only, no draft).
4. **Validate the plan** (gate).
5. **Pass 2 — Evidence grounding**: map evidence → sections, flag gaps.
6. **Pass 3 — Full draft**: write the document in senior consulting style.
7. **Pass 4 — Red-team**: critique as a skeptical McKinsey partner.
8. **Pass 5 — Board-grade rewrite**: revise to a higher standard, no new client facts.
9. **Pass 6 — Render package**: structured `RenderableDeliverable`.
10. **Quality gate** → render DOCX/PPTX/XLSX/HTML (PR-4) → persist (PR-5).

## Governance boundary (enforced, not advisory)

- Plan validation blocks any `governed_facts`/`mixed` section that cites no evidence,
  uses no assumption, and has no placeholder — i.e. would fabricate.
- The quality gate blocks unsupported number/$/%/date claims and any leaked internal id.
- Vendor-facing source registers exclude `internal_only` evidence (no incumbent-spend
  leak into an issued RFP).

## Status

- **PR-1 (this):** contracts, brief registry (seed), source register, six-pass prompt
  builder, plan + quality validators, orchestrator loop (injected model), 21 tests.
- **PR-2:** full archetype brief library (AMS, ERP/SI, cloud modernization, AI-PDLC,
  Moves charter/business-case/roadmap, Source strategy/evaluation).
- **PR-3:** wire `ModelCaller` to `getAuditedAnthropicClient`.
- **PR-4:** professional renderers from `RenderableDeliverable` (+ Excel companion).
- **PR-5:** quality-gate integration, persistence, live SkyHarbor AMS proof.
