# 2026-06-06 — Shared surface grounding seam + Sentinel/Source wiring

## Release ID

`2026-06-06-surface-grounding-seam`

## Status

`candidate`

## Plain-English Summary

Adds the shared, surface-agnostic seam that lets any agent surface (Sentinel/Source, Atlas/Tower, Steward/Setup) inherit the same curated Domain Function Pack depth that Nexus/Moves already binds — closing the wiring gap the corpus grounding report flagged.

- New `groundSurfaceContext()` helper: a surface passes the tenant's `(industry, function)` identity and gets back a curated grounding bundle (operating metrics, vocabulary, regulatory frames, pain themes, reference patterns, and the own-it-vs-rent posture), or an honest unbound result when no pack is catalogued. Pure, deterministic, same registry Nexus/Moves uses.
- Wires it into the **Sentinel/Source** surface additively: the Source context bundle and the Sentinel briefing now carry an optional `functionGrounding` field, and the orchestrator passes it through. All optional — existing callers are unaffected.

This is the reusable contract; the same one-line pattern grounds Atlas/Tower and Steward/Setup next.

## Layer Impact

- `global-control-lane`: adds a shared grounding seam over the expert-kernel function-pack registry and threads an optional grounding field through the Source agent-context + briefing types. Purely additive — no existing behavior changes unless a bundle is populated with grounding.

## Client Applicability

- All clients: the seam is domain-general; any tenant with a catalogued `(industry, function)` can be grounded through it.
- Internal only: No. Public/demo only: No. Feature flag: N/A.

## Changes Included

- `src/lib/programs/expert-kernel/grounding/surface-grounding.ts` — new `groundSurfaceContext()` + `SurfaceGrounding` type.
- `src/lib/programs/expert-kernel/__tests__/surface-grounding.test.ts` — grounds every catalogued cell, own-it posture for the hero packs, honest unbound for unknown identity.
- `src/lib/source/agent-context.ts` — optional `functionGrounding?: SurfaceGrounding` on `SourceAgentContextBundle`.
- `src/lib/source/multi-agent-types.ts` — optional `functionGrounding` on `SourceMultiAgentBriefing` and `SentinelSourceBriefing`.
- `src/lib/source/multi-agent-briefing.ts` + `src/lib/source/sentinel-source-orchestrator.ts` — pass-through.
- `docs/releases/records/2026-06-06-surface-grounding-seam.md` — this record.

## QA / Validation

**Status: PASS.**

- `npx jest` on the briefing/context/grounding suites (sentinel-source-orchestrator, context-validation, stage-voice-depth-briefing, surface-grounding, corpus-grounding-battery) → **5 suites / 68 tests passing.**
- `npx tsc --noEmit` → **0 non-noise errors** (only the 2 pre-existing missing-optional-dependency errors remain).
- The unrelated `src/lib/source/exports/*` markdown tests fail in this worktree on a pre-existing `jest-haste-map` duplicate-mock collision (`mdast-util-*` mock files committed on main, unmodified by this change) — not a regression from this PR.

## Rollout Plan

Merge to main. The seam is available immediately; the Source carrier + pass-through are live (optional, undefined until populated). No deploy step.

## Rollback Plan

Revert the PR. All fields are optional/additive; removal is clean. No schema or runtime state.

## Audit Evidence

- Seam + test: `src/lib/programs/expert-kernel/grounding/surface-grounding.ts` (+ test)
- Source wiring: `agent-context.ts`, `multi-agent-types.ts`, `multi-agent-briefing.ts`, `sentinel-source-orchestrator.ts`
- Pairs with #3221 (grounding battery + report that flagged the wiring gap).

## Known Gaps

- **Live population pending.** The seam, the optional carrier, and the pass-through are in place and tested, but nothing populates `functionGrounding` in the production Source path yet — doing so requires threading the tenant's `(industry, function)` identity into the Source bundle assembly (the context-builder) so it can call `groundSurfaceContext`. That is the final connect step; the Source surface currently has no industry/function field on its tenant context, so this needs a small plumbing follow-up.
- **Atlas/Tower + Steward/Setup not yet wired.** The shared helper makes their wiring the same additive pattern; scoped as the next slice.
