# 2026-07-12-moves-signal-vocab-expansion — Broaden real-content signal vocabulary

## Release ID

`2026-07-12-moves-signal-vocab-expansion`

## Status

`candidate`

## Plain-English Summary

Follow-up to the deliverable-content carries-forward feature shipped earlier today (PR #4698).
Live validation (Stage 4) checked 3 real Moves and confirmed the fail-safe path (no fabrication)
but never found a real positive match — the shipped keyword vocabulary was only 3 words
(`workstream`, `raci`, `kpi`).

Root cause: `golden-bar.ts`'s own `extractExhibitKinds` — the function that actually validates
real generated Moves deliverables today — already recognizes a much broader real vocabulary
(`roadmap`, `timeline`, `trajectory`, `stakeholder`, `decision record`, `tradeoff`, `options`,
`cost`, `scorecard`, `baseline`, and more). The narrow 3-word list shipped this morning was an
under-scoped subset of the terms real generated content is actually expected to contain.

This release expands `SIGNAL_KEYWORDS` in `deliverable-content-signals.ts` to try each signal's
full real-keyword set in order (first real match wins), and adds two new signal keys —
`decisions` (decision record / tradeoff / options — directly relevant to "what was decided this
phase") and `cost` — since those markers are already part of golden-bar's real, live-validated
vocabulary. No new fabrication risk: a signal with no match among its keywords is still simply
absent.

## Layer Impact

- `global-control-lane`: same file, same call site, no new surface. Backward compatible — existing
  `workstreams`/`owners`/`metrics` keys unchanged in behavior for content that already matched.

## Client Applicability

- All clients: yes — no tenant gating, no feature flag. Purely improves real-world match rate; a
  Move with no matching real content still shows nothing.

## Changes Included

- `src/lib/deliverables/deliverable-content-signals.ts`: `SIGNAL_KEYWORDS` changed from
  `{key, keyword}` to `{key, keywords: string[]}`; each signal now tries its keywords in order and
  keeps the first real match. Reuses `golden-bar.ts`'s exact real marker vocabulary. Added
  `decisions` and `cost` signal keys.
- `src/lib/deliverables/__tests__/deliverable-content-signals.test.ts`: added a test proving the
  keyword-fallback behavior (a "Roadmap Overview" heading with no literal "workstream" text still
  matches the `workstreams` signal via the `roadmap` fallback keyword) and the new `decisions`
  signal.

## QA / Validation

- `npx eslint`: PASS — 0 errors on both changed files.
- `npx jest src/lib/deliverables/__tests__/deliverable-content-signals.test.ts`: PASS — 5/5 (4
  pre-existing + 1 new fallback test).
- `npx tsc --noEmit -p .`: local run crashed at the Node/V8 level (native stack trace, not a
  reported type error) — this machine has shown repeated instability running full-project tsc
  this session, unrelated to this change. CI's "Typecheck + reasoning-layer tests" / "Production
  readiness gate" jobs are the authoritative check for this PR.
- Live signed-in browser proof: pending — this is a vocabulary broadening, not a new mechanism;
  Stage 4's original 3 live checks already confirmed the fail-safe path holds. A follow-up live
  check with a real generated deliverable remains the open item tracked in
  `project_moves_readiness_pack_and_generation_pipeline` memory.

## Rollout Plan

Merge to `main` → `aca-main-deploy.yml` builds/deploys → verify ACA runtime invariant.

## Rollback Plan

Revert this commit. Purely additive/broadening within one existing file; no schema, route, or
contract changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be confirmed post-merge.
- ACA runtime invariant: to be verified via `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.

## Audit Evidence

- `npx eslint` (0 errors) and `npx jest` (5/5) output captured this session; reproducible via the
  commands above.
- CI's "Typecheck + reasoning-layer tests" / "Production readiness gate" checks on this PR are
  authoritative for type-safety given local machine constraints noted above.

## Known Gaps

- Still no confirmed live positive match against a real generated Move deliverable — this
  broadening increases the odds but does not itself prove one. Tracked as the same open Stage 4
  follow-up in `project_moves_readiness_pack_and_generation_pipeline` memory.
