# 2026-06-19-source-reasoning-spine-capture — Wire reasoning spine onto the generate route (capture-only, flag-gated) — Phase 1, Slice 1.6

## Release ID

`2026-06-19-source-reasoning-spine-capture`

## Status

`candidate`

## Plain-English Summary

First time the reasoning spine touches the live generate path — done as safely as
possible. Behind a default-OFF tenant flag (`source_reasoning_spine`), the generate
route now runs the Analysis + Recommendation stages and **captures a validated
Reasoning Envelope as generation metadata**. It does **not** change the generated
document at all: the prose is produced exactly as today. The capture is fully
guarded — when the flag is off, the spine errors, or the envelope fails the quality
gate, it records a status and the route generates byte-for-byte as before.
Rendering the envelope into the deliverable prose is a separate, later slice (1.6b).

## Layer Impact

- `global-control-lane` + `experimental` (flag-gated): the live route
  `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`
  gains one guarded call; a pure `reasoning/capture.ts`; a flag; and two optional
  metadata fields. **No schema change.** No data-plane change. With the flag off
  (the default everywhere), generation behavior is unchanged.

> Route-name correction: main's pipeline route is `[artifactCode]/generate/route.ts`
> (the spec/plan, grounded on the fork, call it `generate-from-claude` — renamed on
> main). The plan's seam reference should read `[artifactCode]/generate/route.ts`.

## Client Applicability

- All clients: behavior **unchanged** until a tenant is added to the flag allowlist.
- Specific clients: none yet (flag `includeTenants: []`).
- Internal only: no · Public/demo only: no · Feature flag: **`source_reasoning_spine`** (default OFF)

## Changes Included

- `src/lib/source/reasoning/capture.ts` + test — `captureReasoningEnvelope` (guarded; never throws).
- `generate/route.ts` — one flag-gated, guarded capture call; envelope status + JSON added to `body_generation_metadata`.
- `src/lib/features/registry.ts` — new `source_reasoning_spine` flag (tenant, default off).
- `src/lib/source/agent-generation/types.ts` — optional `reasoningStatus` + `reasoningEnvelope` on the metadata.

Stacked on Slices 1.0/1.2/1.3-1.5.

## QA / Validation

- `jest src/lib/source/reasoning/` → **PASS** (25/25; capture: flag-off no-op, flag-on captures a validated envelope, never throws).
- `eslint` on the route + changed files → **PASS** (exit 0).
- Typecheck — runs in CI ("Typecheck + reasoning-layer tests").
- **Flag-off body equivalence:** the generated body is produced by the unchanged
  code path; the capture only adds metadata. Flag-off generation is byte-identical.
- **LIVE PROOF — PENDING (per Vol4 §16.1 proof bar):** flip `source_reasoning_spine`
  on for a tenant, regenerate d01/d05/d09 against a real event on the ACA private DB,
  and confirm a validated envelope persists in `body_generation_metadata` with the
  body unchanged. Not run in this session.

## Rollout Plan

Merge after Slices 1.3-1.5. Deploy. Flag stays OFF until the live capture proof
above is run per tenant. No migration.

## Rollback Plan

Set the flag off (instant) or revert the commit. Flag-off already reproduces legacy
behavior, so risk is contained without a revert.

## Audit Evidence

- PR: `feat/source-reasoning-wire`. Tests 25/25.
- Plan: `docs/codex-handoff/SOURCE_INTELLIGENCE_OS_PHASE1_BUILD_PLAN.md`.

## Known Gaps

Capture-only: the envelope is recorded but does not yet shape the prose (Slice 1.6b
switches the prompt to render it). The envelope persists in `body_generation_metadata`
JSON; the dedicated `reasoning_envelopes` table is Slice 1.8. Slice 1.1
(classify-at-intake) still needs its additive migration. The live capture proof is
the remaining exit criterion for this slice.
