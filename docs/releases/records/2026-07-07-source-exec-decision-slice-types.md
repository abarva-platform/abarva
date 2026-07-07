# 2026-07-07-source-exec-decision-slice-types — Fix ExecDecisionSliceView type widening

## Release ID

`2026-07-07-source-exec-decision-slice-types`

## Status

`candidate`

## Plain-English Summary

The Executive-Decision per-step insight (shipped in #4545) built its value-bucket
"slices" with an array literal that had `.filter(...)` chained directly onto it. That
chaining strips TypeScript's contextual type, so each slice's `valueTypes` array was
inferred as `string[]` instead of the required `readonly ValueType[]`, producing two
`TS2322` type errors in `step-insight-builder.ts` (the live `slices` and the sample
`sampleSlices`). The errors were latent — they slipped in because the original PR's
full-project type-check verification did not actually complete, so the branch was
merged believing it was type-clean.

This change binds each array literal to its own `ExecDecisionSliceView[]` const first
(so the contextual type narrows `valueTypes` correctly), then applies `.filter(...)`.
Runtime behavior is identical — this is a compile-time typing fix only.

## Layer Impact

- `global-control-lane`: the change is in the pure, deterministic Source value-analytics
  view builder (`step-insight-builder.ts`), Executive-Decision insight path only. No
  runtime behavior change; no data-plane, schema, or tenant-scope change.

## Client Applicability

All clients that see the Source Executive-Decision step insight (behind the
`source_analytics` flag). No client-specific behavior. Rendering is unchanged; this only
restores type-correctness.

## Changes Included

- `src/lib/source/facts/view/step-insight-builder.ts`: bind the live and sample
  Executive-Decision slice literals to typed `ExecDecisionSliceView[]` consts before
  filtering, resolving two `TS2322` errors. No logic change.

## QA / Validation

Status: **pass** (type-check and lint pass for the changed file; pre-existing unrelated
errors remain out of scope).

- Full-project `tsc -p tsconfig.json --noEmit`, tracked to genuine completion:
  errors went 136 → 134; **0 remaining in `step-insight-builder.ts`** (my two are gone);
  no new errors introduced.
- `eslint` on the changed file: clean (exit 0).
- The remaining 134 errors are pre-existing and unrelated (they trace to the
  `6ebe6d4a9` canvas/executive-briefing merge — `UniversalCanvasShell` 34, `atlas/llm`
  23, `csv-upload-connector` 13, etc.) and are out of scope for this fix.

## Rollout Plan

Merge via squash to `main`. Deploys through the standard ACA main deploy workflow; no
special sequencing. Type-only change — safe to ride the next deploy.

## Deployment Authority

Only the repo-owned ACA main deploy workflow shifts shared Product/Lab web traffic. This
PR does not deploy directly and does not mutate any shared runtime, revision weight, or
Container App template.

## Rollback Plan

Revert this commit. Because runtime behavior is unchanged, rollback carries no data or
behavioral risk.

## Audit Evidence

- Before: `step-insight-builder.ts(1120,9)` and `(1186,9)` `TS2322` (valueTypes widened
  to `string[]`), from a full-project tsc on `main` @ the 136-error state.
- After: full-project tsc = 134 errors, 0 in `step-insight-builder.ts`.

## Known Gaps

This fix does NOT make CI green — 134 pre-existing errors remain, owned by the
`6ebe6d4a9` Intelligence canvas/executive-briefing workstream. `main` stays type-red
(and deploys stay risky, though the production image builds via `ignoreBuildErrors:true`)
until that feature merge is re-landed cleanly by its owner. This PR only removes the two
errors that were mine.
