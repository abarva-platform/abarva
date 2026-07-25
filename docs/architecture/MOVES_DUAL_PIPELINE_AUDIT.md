# Moves Dual Generation Pipeline Audit — Golden-Bar vs. Orchestrator

## Status

`audit — informs the P0/P1/P2 phase-contract correction; no code changed by this document`

## Why this exists

Two live artifact-generation pipelines exist in this codebase today, and — critically — **the
"Approve & Build" button in the Moves UI only invokes one of them.** The P1 Charter prompt/length
correction shipped in this session (PR #5582, `strategic-moves-artifact-standard.ts`) updates the
pipeline that button does **not** use. This audit traces both pipelines end to end so future fixes
land on the path that's actually live, or on both deliberately.

## The two pipelines

| | Golden-bar | Orchestrator |
|---|---|---|
| **Entry point** | `POST /api/v1/programs/[programId]/generate` | `POST /api/v1/deliverables/generate-phase` — **this is what the "Approve & Build" button calls** |
| **Generation function** | `generateArtifact()` (`src/lib/deliverables/generate-artifact.ts`) | `runDeliverableForTenant()` (`src/lib/deliverables/orchestrator/generate-service.ts`) |
| **Prompt builder** | `buildArtifactPrompt()` (`src/lib/deliverables/solution-prompt-factory.ts`) reading `strategic-moves-artifact-standard.ts` | `src/lib/deliverables/orchestrator/prompt-builder.ts` + `deliverable-structures.ts` — **entirely separate, does not read `strategic-moves-artifact-standard.ts` at all** |
| **Generation shape** | Single/two-pass | Six-pass: `architect → evidence_grounding → full_draft → red_team → board_grade_rewrite → render_package` |
| **Evidence/context assembly** | `assembleMoveSolutionContext` via `createMovesGenerateArtifactDeps` (`moves-generate-deps.ts`) | `assembleGovernedEvidence` (`orchestrator/evidence-assembler.ts`) — **standalone, zero import overlap** with the golden-bar context path |
| **Word/length enforcement** | `strategic-moves-artifact-standard.ts`'s `DEPTH_BY_ARTIFACT` + `golden-bar.ts`'s `meetsGoldenBar()` | `orchestrator/quality-bar-registry.ts` — **a separate, real enforcement registry** (correction to this session's earlier research, below) |
| **Quality gate** | `meetsGoldenBar()` (`golden-bar.ts`) | `evaluateDeliverableQuality()` (`deliverable-quality-contract.ts`) + `transformation-gates.ts` |
| **Rendering** | Raw sanitized HTML (`generate-artifact.ts`), separate DOCX via `phase-word-equivalent.ts` | `orchestrator/renderers.tsx` — real DOCX/PPTX/PDF with fonts/borders/AI-draft disclaimer |
| **Persistence** | `deliverables_v2` / `deliverable_versions` (`persist-move-generated-artifact.ts`) | `generated_artifacts` (`src/lib/artifacts/repository.ts`) — **a completely different table**, joined for UI display via `deliverable_runs` (`runs-repository.ts`), not synced into `deliverables_v2` |
| **Human approval writes** | `artifact_review_decisions` | Not found in the orchestrator persistence path — **unverified whether any approval action writes anywhere for orchestrator output; flagged as an open question, not confirmed absent** |

## Correction to this session's earlier research

Earlier in this session, before this audit, I reported "the orchestrator pipeline has no word-count
gate at all — depth is judged only via visual/story/architecture-completeness checks." **This was
wrong.** `orchestrator/quality-bar-registry.ts` defines hard per-deliverable-type word floors and
ceilings, most with `enforceMaxAsBlocker: true` (a real generation-blocking gate, not advisory).
Example: `charter` is `minBodyWords: 900`, `targetBodyWordsMax: 1_600`, blocking. This flows directly
into the orchestrator's own prompt text — `prompt-builder.ts` writes *"This ceiling is a HARD
QUALITY GATE, not a suggestion"* into the model prompt when the flag is set. Correcting the record
here so this doesn't propagate into future decisions.

## The consequence that matters most right now

**PR #5582 (this session) changed `strategic-moves-artifact-standard.ts`'s `p1Assignment()` and
charter's `DEPTH_BY_ARTIFACT` entry (900-1,100 target / 1,300 hard max / 3,000 tokens).** That is the
golden-bar pipeline's charter prompt. The orchestrator pipeline — the one "Approve & Build" actually
calls — has its own, pre-existing, different charter budget in `quality-bar-registry.ts`
(`minBodyWords: 900`, `targetBodyWordsMax: 1_600`, blocking) and its own separate section list/
prompt text in `deliverable-structures.ts`, untouched by that PR.

**Practically: if you run a new Move and click "Approve & Build" for the P1 Charter, you will get
the orchestrator's existing 900–1,600-word charter, built from its own six-pass prompt system and
its own evidence assembler — not the 900–1,100/1,300-hard-max standard just shipped.** The two
pipelines will keep diverging until this is deliberately reconciled. This needs a decision, not a
silent fix — see "Immediate open question" below.

## Other findings worth carrying into later phases of the correction

- **`moves_orchestrated_deliverables` feature flag's own summary text is stale.** It's described as
  gating orchestrator-vs-golden-bar routing, but the live `generate-phase/route.ts` entry point never
  checks it — every phase deliverable unconditionally goes through the orchestrator's job queue
  regardless of this flag's tenant allowlist. The flag still gates two other, apparently older,
  routes (`board-grade-business-case`, `board-artifacts/orchestrated-move-route.ts`). Worth cleaning
  up as a governance-hygiene item: either the flag's summary should be corrected, or those two older
  routes should be reconciled with the live path.
- **Every phase deliverable type has *an* orchestrator mapping** (`orchestrated-deliverable-map.ts`
  has a generic board-grade-brief fallback for any unmapped key) — but several types
  (`sourcing_strategy`, `operating_model_design`, `tower_metrics_plan`) may route through that
  generic fallback rather than a purpose-built structure, per the map file's own comments. Not
  independently confirmed against `deliverable-structures.ts`'s actual contents for those three —
  flagged as a follow-up check before assuming parity.
- **Evidence exclusion rules differ, not just implementation.** The orchestrator's evidence
  assembler explicitly requires `program_evidence_reviews.decision === 'approved'` before an
  uploaded item reaches generation (matching this session's earlier phase-scoping fix's own
  invariant) — good, consistent behavior on that specific point — but it also reads `program_modules`
  and `evidence_ledger` directly in ways golden-bar's `assembleMoveSolutionContext` path does not,
  meaning the *set* of evidence each pipeline sees for the same Move is not guaranteed identical
  even where both correctly enforce "approved only."

## Immediate open question for you

Given the orchestrator pipeline is the one actually live behind "Approve & Build," the P1 charter
correction needs to land there too before it's real for a live Move run. Options, roughly in order
of effort:

1. **Update the orchestrator's own budget/prompt to match** — change `quality-bar-registry.ts`'s
   charter entry to 900/1,100/1,300 and align `deliverable-structures.ts`'s charter section list with
   the newly-specified 12-section P1 model. Fastest path to the live pipeline actually reflecting the
   correction, but does not resolve the deeper duplication (two independent prompt systems still
   exist and can drift again).
2. **Build the shared source-of-truth module now**, per your original instruction ("where
   consolidation is too large, create a shared source of truth consumed by both pipelines") — extract
   phase assignment, word budgets, and required sections into one module both `solution-prompt-
   factory.ts` and `prompt-builder.ts` read from. Slower, but this is the real fix for "the same P0/
   P1/P2 action must not produce different artifact content based on which button invoked it."
3. **Do both**: (1) now as a stopgap so the live pipeline isn't stale, (2) as the next real increment.

I'd default to (3) unless you'd rather go straight to (2).
