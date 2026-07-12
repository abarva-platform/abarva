# 2026-07-12-moves-deliverable-content-carries-forward — Real deliverable content in the readiness pack (Stages 2 + 3)

## Release ID

`2026-07-12-moves-deliverable-content-carries-forward`

## Status

`candidate`

## Plain-English Summary

Stages 2 and 3 of the staged plan to surface real "carries forward" content in the Moves
Next-Phase Readiness Pack (Stage 1: `2026-07-11-moves-exhibit-content-extractor.md`).

**Stage 2** — `src/lib/deliverables/deliverable-content-signals.ts`
(`readDeliverableContentSignals(moveId, deliverableTypeKey)`): reads a Move's latest generated
deliverable version content for a given type from `deliverable_versions`, and runs it through
Stage 1's `extractExhibitContent` for a small signal vocabulary (workstreams, owners/RACI,
metrics/KPI — the same terms `golden-bar.ts`'s `extractExhibitKinds` already uses). Returns real
extracted snippets, or an empty array when nothing has been generated yet or no signal matched —
never fabricated.

**Stage 3** — wires Stage 2 into the live readiness pack shipped 2026-07-11
(`2026-07-11-moves-next-phase-readiness-pack.md`):
- `next-phase-readiness-pack.ts`: `NextPhaseReadinessPack` gains a `carriesForwardContent` field
  (defaults to `[]`), passed through untouched by `buildNextPhaseReadinessPack`.
- The phase page (`.../phase/[phaseNum]/page.tsx`) reads the current phase's real gate artifact(s)
  via the existing `getGateArtifacts(phase)` registry function, calls
  `readDeliverableContentSignals` for each, dedupes by signal key, and passes the result to
  `MovesPhaseStandaloneClient` as a new `carriesForwardContent` prop.
- `MovesPhaseStandaloneClient.tsx` threads the prop through to `PhaseBody` and into
  `buildNextPhaseReadinessPack`; the Gate approval view renders a new "Carries forward from this
  phase's generated work" section, listing each real heading + extracted snippet, only when at
  least one signal was actually found.

Any read failure (deliverable not yet generated, DB error) degrades to an empty array — the section
simply doesn't render, matching the same honesty discipline as the evidence-gap section shipped
alongside it.

## Layer Impact

- `global-control-lane`: `MovesPhaseStandaloneClient.tsx` is the sole phase-workspace
  implementation for all tenants — this section is visible platform-wide, no flag.

## Client Applicability

- All clients: yes — no tenant gating, no feature flag. A Move whose current-phase gate artifact
  hasn't been generated yet (or whose content has no matching signal) simply shows no
  carries-forward section; no client sees fabricated content.

## Changes Included

- `src/lib/deliverables/deliverable-content-signals.ts` (new): `readDeliverableContentSignals`.
  Queries `deliverable_versions` joined to `deliverables_v2` by `engagement_id` +
  `deliverable_type_key`, ordered by version desc, limit 1. Uses `azureRead.query` with
  `missingTable: 'empty'` so an absent table degrades to no signals rather than throwing.
- `src/lib/deliverables/__tests__/deliverable-content-signals.test.ts` (new): 4 tests — real
  multi-signal extraction from a synthetic-but-realistic fixture, empty-array on no generated
  version, empty-array on blank content, and honest omission of a signal absent from real content.
- `src/lib/programs/phase-templates/next-phase-readiness-pack.ts`: added optional
  `carriesForwardContent` input / required output field (defaults to `[]`).
- `src/lib/programs/phase-templates/__tests__/next-phase-readiness-pack.test.ts`: 2 new tests —
  default-empty and real-signal pass-through.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`: reads the current phase's
  gate artifact type(s) via the existing `getGateArtifacts` registry function, calls Stage 2 for
  each, dedupes by signal key, passes to the client. Wrapped in try/catch (matches the existing
  `evidenceNeedPackets` pattern) so a read failure never breaks the page.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: new `carriesForwardContent` prop
  threaded through `PhaseBody` into `buildNextPhaseReadinessPack`; new `mxw-readiness-carries`
  section rendered only when signals exist; matching CSS added to the component's existing inline
  style block (reuses `--blue`/`--blue-tint`, consistent with the rest of the file's token set).
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: added
  `carriesForwardContent={[]}` to all existing render calls; 2 new tests — real content renders at
  Gate approval, and the section is honestly omitted when no signals were extracted.

## QA / Validation

- `npx eslint` on all changed/new files: PASS — 0 errors (isolated git worktree off `origin/main`,
  symlinked `node_modules`).
- `npx jest` across all four affected test files: PASS — 26/26
  (`deliverable-content-signals.test.ts` 4/4, `exhibit-content-extractor.test.ts` 8/8,
  `next-phase-readiness-pack.test.ts` 7/7, `MovesPhaseStandaloneClient.test.tsx` 7/7).
- `npx tsc --noEmit -p .`: Stage 2's file (`deliverable-content-signals.ts`) was independently
  confirmed clean in isolation. The combined Stage 2+3 full-project run did not complete locally —
  the local machine was under sustained, severe memory pressure unrelated to this change (multiple
  concurrent processes exhausted free memory; the same `tsc` invocation ran at single-digit percent
  CPU for extended periods). CI's own "Typecheck + reasoning-layer tests" and "Production readiness
  gate" checks run the identical `npx tsc --noEmit` command on dedicated runners without this
  contention, and are treated as the authoritative confirmation for this PR — do not merge if either
  fails.
- Live signed-in browser proof: NOT YET RUN — pending merge/deploy. Plan: open a real Move whose
  current-phase gate artifact has already been generated, navigate to Gate approval, confirm the
  "Carries forward" section renders real extracted content (or is honestly absent if the generated
  HTML has no matching heading/table for the signal vocabulary) — this is Stage 4 of the plan.

## Rollout Plan

Merge to `main` → `aca-main-deploy.yml` builds/deploys → verify ACA runtime invariant → Stage 4:
validate extraction against several real, already-generated Move deliverables and live-verify in a
signed-in browser.

## Rollback Plan

Revert this commit. Additive only (new file + new optional field + new prop + new JSX block); no
existing behavior, route, or API contract changes. No data migration, no flag to unwind.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be confirmed post-merge.
- ACA runtime invariant: to be verified via `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.

## Audit Evidence

- `npx eslint` output (0 errors) for all changed/new files, captured this session.
- `npx jest` output — 26/26 across four suites, captured this session; reproducible via the
  commands in QA / Validation.
- CI's typecheck/production-readiness checks on this PR are the authoritative type-safety
  confirmation given the local tsc run did not complete (see QA / Validation for why).

## Known Gaps

- Stage 4 (validate extraction against real, already-generated Move deliverables and live-verify in
  a signed-in browser) is the next and final stage of the plan — not yet run.
- The signal vocabulary (workstreams, owners, metrics) is intentionally small and reused from
  `golden-bar.ts`'s existing keyword set; it does not attempt to cover every possible downstream
  signal (e.g. selected approach, deferred options) — extending the vocabulary is a follow-on, not
  implied to be covered here.
