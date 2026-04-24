# CYCLE STATE

This is the live operating file for the AbarVa Source Foundation and Build Pack Hardening cycle.

Every session working on AbarVa Source must start by reading this file, then [docs/abarva-source/build-pack/00_MASTER_ANCHOR.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/00_MASTER_ANCHOR.md).

## Current Cycle

AbarVa Source Foundation and Build Pack Hardening

## Current Branch

codex/source-foundation

## Current Objective

Preserve Source foundation, harden the Build Pack, and prepare for controlled component implementation.

## Committed Queue

1. complete clean Source branch and commit plan
2. harden Build Pack with agent, crawler, failure mode, cross-product, commercial, and pattern depth docs
3. harden Build Pack with agent context awareness, chat/input model, and context validation harness
4. create Source agent context type definitions only
5. visually review `/source` dashboard
6. refine dashboard only after review
7. approve next component spec and wireframe
8. implement next approved component only

## Current Item

Source agent context type definitions

## Completed This Cycle

- Clean Source branch created.
- Missing split Build Pack files restored under [docs/abarva-source/build-pack](/Users/anand/Projects/nexus/docs/abarva-source/build-pack).
- Source Build Pack documentation committed on `codex/source-foundation`.
- Source foundation code and nav placement confirmed already present on updated `main`.
- Build Pack hardening layer drafted:
  - agent per-turn contract
  - crawler persona verification
  - sourcing failure-mode catalog
  - cross-product architecture
  - commercial model
  - pattern-pack content depth standard
- Build Pack anchor, agent, pattern, scorecard, and acceptance docs updated to reference the hardening layer.
- Operating state normalized to `CYCLE_STATE.md`.
- Agent Context Awareness hardening drafted:
  - context bundle requirements
  - guided chat/input model
  - file attachment behavior
  - spell-check and typo-tolerance expectations
  - context validation harness
  - vanilla-response detection
- Build Pack anchor, agent, per-turn, crawler, and acceptance docs updated to make context awareness a release gate.

## Blocked Items

- Visual review of `/source` may require authenticated access because prior local preview was blocked by Clerk redirect.
- Further Source UI implementation is blocked until Build Pack hardening and Agent Context Awareness hardening are reviewed.
- Event canvas, scorecard UI extension, artifact drawer extension, value ledger extension, vendor response flow, and AI/RFP generation are explicitly blocked.

## Notes And Discoveries

- AbarVa Source should remain a first-class workflow product under AbarVa, not nested under Programs.
- Source must not depend on `/programs`, `/preview`, `/demo`, `ProgramSurface`, or `src/lib/programs/mock.ts`.
- Build Pack hardening adds agent per-turn rules, persona crawler verification, sourcing failure-mode coverage, cross-product architecture, commercial model, and pattern-pack depth standards.
- Source should be architecturally serious before further UI buildout: deterministic state first, evidence-backed guidance second, model-assisted narrative only inside clear gates.
- Nexus must be context-first, not prompt-first. Event-specific responses require a Source Agent Context Bundle.
- Chat must support contextual suggested actions, custom input, file attachment grounding, spell-check/typo tolerance, and visible context used.
- A validation harness must reject vanilla GPT/Claude-style answers before agent/chat implementation can be considered complete.
- Source context-aware agent contract types were created without UI, API routes, model calls, upload handling, or file parsing.

## Last Status Emission

2026-04-24: Current item is Source agent context type definitions. Completed clean Source branch, restored Build Pack files, drafted hardening docs, added context awareness/chat/input/validation specs, and created the Source context/chat/attachment/quality/validation type layer. Remaining queue is review of the type contract, `/source` visual review, dashboard refinement after review, next component approval, and next approved component only. Blockers are authenticated preview friction and explicit do-not-build boundaries. Next action is review the new type definitions before any UI, route, upload, or model work.

## Next Action

Review Source agent context type definitions before any UI, route, upload, or model work.

## Explicit Do-Not-Build List

- event canvas
- scorecard UI extension
- artifact drawer extension
- value ledger extension
- vendor response flow
- AI/RFP generation
- client nav exposure
- legacy `/programs` integration
- `/preview` or `/demo` implementation

## Operating Rules

- Every session must start by reading `CYCLE_STATE.md`.
- Every session must emit current status.
- Every material task completion must update `CYCLE_STATE.md`.
- Every PR or commit must update `CYCLE_STATE.md`.
- Every blocker must be logged.
- Codex should continue to the next item in the committed queue after an approved unit of work unless the next item requires explicit user approval, is blocked, violates the do-not-build list, or is outside approved implementation scope.

## Status Emission Required Fields

Every status emission must include:

- current item
- completed this cycle
- remaining queue
- blockers
- next action

## Status Emission Cadence

- at session start
- after every commit
- after every CI failure
- after every task completion
- before handoff
- every 30 minutes of active work if long-running
