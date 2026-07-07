# 2026-06-09-strategic-move-archetype-framework — Strategic Move Archetype Framework

## Release ID

`2026-06-09-strategic-move-archetype-framework`

## Status

`candidate`

## Plain-English Summary

Generalizes the Moves module into a reusable **strategy-work engine**. A universal 7-phase spine
(Originate→Charter→Diagnose→Design→Roadmap/Business-Case→Mobilize→Handoff) runs every Move; what
varies per use case — evidence, analysis methods, deliverables, gate criteria, value/risk models,
agent guidance — is declared by a `StrategicMoveArchetype` rather than hardcoded in Charter/phase
code. Requirements resolve on two axes: `archetype.requirements(phase) ⨯ estate(profile)` (the
archetype says what kind of evidence the work needs; the client's real estate decides which
instruments apply — e.g. DORA for a cloud team, change-cadence for a mainframe team). Current-state
evidence enters via the governed upload path with an honest, promotion-only readiness ladder
(`agent_ready` only via governed promotion, never automatic). Deliverables are board-grade and
client-customizable by prompt, but grounded: every claim is cited or flagged `[MISSING EVIDENCE]`,
and refinement cannot add a fact not in the evidence. Agents receive an archetype context bundle and
emit a GroundedAnswer envelope (cite or refuse, never fabricate). Proven end-to-end on a real,
non-seeded SkyHarbor move and on a second archetype (IT_SOURCING_EVENT) with zero Charter-code change.

## Layer Impact

- **global-control-lane**: new archetype framework + engine modules under `src/lib/programs/archetypes/`
  and `src/lib/programs/current-state-*`, `deliverable-refinement`, `archetype-context-bundle`; the
  Moves phase workspace + readiness panel + deliverable artifact card; new read/compute routes under
  `.../current-state/*` and `.../p0-brief`. Charter/phase code is now archetype-driven (no hardcoded
  DORA/IT).
- **client-data-lane**: current-state CSV ingest commits to existing `tower_*` tables + `evidence_ledger`
  (tenant-scoped, governed lineage); the p0-brief route writes a governed `origination_brief`
  deliverable via the existing `draftModuleDeliverable`/`publishDeliverable` seam. No schema migration.

## Client Applicability

- All clients/tenants: the framework is client- and use-case-agnostic. AI-PDLC is the first full
  archetype; IT_SOURCING_EVENT proves a second use case with different evidence/deliverables and zero
  Charter-code change.
- Immediate driver: SkyHarbor real move `0d14fa63` "AI-Powered Product Development Lifecycle"
  (originated + gate-advanced to P1; not seeded).
- No behavior change for tenants/moves that don't use the new surfaces; the panel/deliverable/
  grounded-answer surfaces are additive.
- Feature flag: none (additive; default archetype AI-PDLC).

## Changes Included

- `src/lib/programs/archetypes/{types,registry,method-library,resolver}.ts` — framework + two-axis resolver.
- `src/lib/programs/current-state-{readiness,maturity,plan,ingest}.ts` — estate inference, methods, ingest.
- `src/lib/programs/deliverable-refinement.ts` — grounded generation + prompt refinement.
- `src/lib/programs/archetype-context-bundle.ts` — agent context bundle + grounded answering.
- `src/components/strategic-moves/{CurrentStateReadinessPanel,DeliverableArtifactCard}.tsx`.
- Routes: `.../current-state/{ingest,readiness,recommendation,plan,deliverable,grounded-answer}`, `.../p0-brief`.
- Docs: `docs/build/moves-design/strategic-move-archetype-framework.md`, `…/skyharbor-answer-quality.md`,
  `…/moves-consulting-engine-arc.md`, `…/current-state-readiness-model.md`.

## QA / Validation

- **Tests:** 9 archetype-framework suites / 78 unit tests green; `tsc --noEmit` clean repo-wide.
- **Live on Azure ACA (private DB), tenant skyharbor:** PR-1..PR-6 deployed + verified — readiness
  panel stamps archetypeId; ingest commits DORA→`tower_dora_metrics` + `evidence_ledger` with lineage
  (promotedToAgent:false); recommendation cites maturity + computes where-to-start; Charter deliverable
  cites DORA + flags 5 missing, adversarial "add ROI numbers" refine added 0 facts; real move
  `0d14fa63` advanced P0→P1 through the real gate on a signed origination brief; 6 CXO grounded answers
  (cite or refuse, 0 unsupported, no cross-tenant).
- **Generality / swap test:** IT_SOURCING_EVENT charter requirements + deliverable sections + grounded
  answers differ entirely from AI-PDLC with zero Charter-code change.

## Rollout Plan

Merge `feat/move-current-state-readiness` (PR #3371, squash) to `main`. Additive; the default archetype
is AI-PDLC. Build the ACA web image from `main`, deploy a revision, shift traffic. The latest verified
lab revision is `--pr6-b28653190a`.

## Rollback Plan

Revert the PR. All new surfaces are additive (new modules + routes + UI sections); the only writes are
governed (CSV ingest into existing tower\_\*/evidence_ledger; origination_brief via the existing
deliverable seam) and are valid/harmless if left in place. No schema migration to unwind. Lab rollback
anchor `--pr5b-33fe2be766` / `--e4-92f2818f57`.

## Audit Evidence

- PR #3371 + per-PR commits (PR-1 `584382829`, PR-2 `0330cd124`, PR-3 `3fc7ffc45`, PR-4 `31a7f7107`,
  PR-4.5 `c73c27bd7`, PR-5 `b0a0c1c39`/`33fe2be76`, PR-6 `b28653190`/`567eecc99`, PR-7 `283536df7`).
- `evidence_ledger` rows for every committed dataset (document_extract, tenant-scoped, lineage tags).
- `docs/build/moves-design/skyharbor-answer-quality.md` (the 6 grounded answers + verdict).

## Known Gaps

- Richer ladder states `indexed`→`agent_ready` need the promotion workflow wired (data model + UI
  already represent them honestly; nothing auto-promotes).
- LLM Nexus/Sentinel answers should be routed through the GroundedAnswer contract (the deterministic
  grounded-answer seam is the floor + test harness today).
- Per-move archetype selection (default AI-PDLC); CSV ingest wired for more families (CMDB/workforce);
  more archetypes; enrichment writeback (self-improving flywheel) not yet built.
