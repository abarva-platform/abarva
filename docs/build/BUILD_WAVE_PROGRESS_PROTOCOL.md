# Build Wave Progress Protocol

Status: active protocol
Owner: Integration Agent (Steward)
Source manifest: `docs/build/build-waves.json`
Last updated: 2026-04-26

## Purpose

`build-waves.json` is the deterministic, machine-readable wave-level
progress manifest for the AbarVa build. It tracks wave-by-wave status,
percent complete, blockers, merged PRs, and the next action across the
nine canonical build waves (Wave 0 through Wave 8).

The manifest is a read model. It does not deploy, does not poll Vercel,
does not call Claude / OpenAI / any model or live provider, and does not
fabricate progress. It is updated only by the integration agent after a
wave merge, and only with evidence visible on `main` or in the slice and
production-readiness manifests.

## Relationship to Other Manifests

`build-waves.json` aggregates the slice manifest. It is downstream of:

- `docs/build/build-slices.json` — the canonical per-slice manifest. Each
  wave's `completedSlices` MUST be a subset of slices in `build-slices.json`
  whose `status` is `code_complete` or `verified`.
- `docs/build/production-readiness.json` — the deterministic readiness
  manifest. Wave-level merge MUST run the PROD2 validator and union notes
  / blockers per the OPS1 conflict policy. Wave merges MUST NOT promote
  any production-readiness component above its honest current status.

`build-waves.json` is a roll-up; it never overrides the slice or
readiness manifests. If a wave's `completedSlices` claims a slice is
done but the slice is not `code_complete` / `verified` in
`build-slices.json`, the slice manifest is authoritative and the wave
manifest must be corrected.

## When To Update It

Update `build-waves.json` only at these moments:

- After a wave-level merge to `main` (e.g., a multi-slice integration
  PR that ships a wave).
- After an individual slice merges that closes the last open slice in a
  wave (transitioning the wave to `merged`).
- After a wave is explicitly deferred or blocked by founder decision.
- After a planned wave gains its first slice contract (transitioning
  `planned` to `in_progress`).
- During morning review, when a stale wave needs its `lastUpdated`
  refreshed because new slice merges affected wave membership.

Do NOT update `build-waves.json`:

- Inside a lane agent worktree, except for the build-operations wave
  itself (Wave 8).
- To pre-promote status before a merge has landed on `main`.
- To inflate `percentComplete` beyond the deterministic formula below.

## Status Vocabulary

`status` is one of: `planned`, `in_progress`, `merged`, `blocked`,
`deferred`.

- `planned` — wave is named and goal-stated, but has zero or non-final
  slice contracts and has not begun building.
- `in_progress` — wave has at least one slice that is `in_progress`,
  `code_complete`, or `verified` in the slice manifest, and at least one
  slice that is not yet `merged` on `main`.
- `merged` — every slice in the wave's `plannedSlices` is either
  `code_complete` / `verified` in `build-slices.json` (and therefore on
  `main`) or explicitly listed in `skippedSlices` / `blockedSlices` /
  `deferred` with a documented reason.
- `blocked` — wave cannot progress because of a documented blocker
  (founder decision, dependency missing, environmental gate). Blockers
  must be enumerated in `currentBlockers`.
- `deferred` — wave has been intentionally postponed by founder
  decision; no work is in flight.

## Validation Status Vocabulary

`validationStatus` is one of: `not_run`, `tsc_clean`, `tests_green`,
`build_green`, `ci_green`, `full_pass`, `partial`, `failing`.

- `not_run` — no validation has been performed for this wave's most
  recent merge.
- `tsc_clean` — `npx tsc --noEmit --pretty false` passes for the wave's
  HEAD on `main`.
- `tests_green` — the wave's slice tests pass via `npx jest`.
- `build_green` — `npm run build` succeeds for the wave's HEAD.
- `ci_green` — required CI gates (route smoke, persona crawler, security
  scan) pass. This requires the OPS / PROD CI gates that are still
  deferred today; do not claim `ci_green` until those gates exist.
- `full_pass` — `tsc_clean` AND `tests_green` AND `build_green` AND
  `ci_green` all hold.
- `partial` — some validation has run successfully but the full set is
  incomplete.
- `failing` — validation failed.

## Percent Complete Formula

`percentComplete` is computed deterministically:

```
percentComplete = round( len(completedSlices) / len(plannedSlices) * 100 )
```

For waves with `len(plannedSlices) === 0`, `percentComplete` is `0`.
The integration test reconciles every wave's declared `percentComplete`
against this formula within ±1 (to allow for round-half-even differences
between runtimes).

## Skipped / Blocked / Deferred Slice Rules

- `skippedSlices` lists slice IDs that were on a wave's roadmap but were
  dropped by founder decision. Each entry MUST be matched by a note in
  `production-readiness.json` or a slice contract that records why.
- `blockedSlices` lists slice IDs whose progress is paused by a known
  external or environmental blocker. Blockers MUST be enumerated in
  `currentBlockers`.
- A wave cannot reach `merged` while `blockedSlices` is non-empty unless
  every blocked slice is explicitly demoted to `skippedSlices` or
  `deferred` with founder evidence.
- `deferred` waves carry forward their planned slices unchanged until
  the founder authorizes resumption.

## PR Merge Binding

Every wave that has shipped MUST list its merged PR numbers in
`mergedPrs`. Rules:

- `mergedPrs` is an array of positive integers (GitHub PR numbers).
- A wave's merged PRs MUST exist in `git log` on `main`.
- A wave cannot reach `status: merged` with an empty `mergedPrs` array
  unless it is a documentation-only build-operations wave whose merges
  are tracked solely by slice contracts (e.g., Wave 6 verification
  runbooks, where each runbook landed in its own slice PR rather than a
  single multi-slice integration PR; in that case `mergedPrs` MAY be
  empty if every slice in `completedSlices` carries its own PR record
  in the slice manifest or git log).
- The integration agent appends to `mergedPrs` after a wave-level merge,
  preserving prior PR numbers verbatim.

## Run Metrics Requirement

After every wave merge, the integration agent MUST:

1. Run `npx tsc --noEmit --pretty false` on the wave's `main` HEAD.
2. Run the wave's slice tests (`npx jest` against the wave's
   `src/__tests__` paths).
3. Run `npm run build`.
4. Re-run the PROD2 production-readiness validator.
5. Record the highest validation rung achieved in `validationStatus`.
6. Set `productionReadinessUpdated: true` only after the validator has
   been re-run and `production-readiness.json` has been
   union-updated with the wave's notes.

Failures must be recorded honestly: prefer `partial` or `failing` over
inflating to `full_pass`.

## Conservative-Status Rule

When merging into `main`, the integration agent enforces:

- The wave manifest never marks a wave as `merged` unless every slice in
  `completedSlices` is `code_complete` or `verified` on `main`.
- The wave manifest never inflates `percentComplete` beyond the formula.
- The wave manifest never claims a CI gate exists when it does not.
- The wave manifest never names a PR number that is not present in
  `git log`.
- `currentBlockers` is preserved across edits unless evidence of
  resolution is recorded in the slice or readiness manifest.

## Cherry-Pick / Conflict Policy

When two lane PRs touch `build-waves.json`:

- Apply OPS1 conflict policy: append-only on `mergedPrs`, conservative
  status (lower of the two on conflict), union notes / blockers, take
  the lower of two declared `percentComplete` values when both lanes
  recompute (the wave is not more done than the most cautious lane
  thinks), and bump `lastUpdated`.
- Re-run the PROD2 validator after every cherry-pick.

## Lane Authority

- Lane agents do NOT update `build-waves.json` except for the
  build-operations wave they own (e.g., the Wave 8 build wave progress
  tracker lane updates Wave 8's own row).
- The integration agent owns wave manifest updates after each wave
  merge.

## What This Manifest Does NOT Claim

- Live monitoring.
- A deployed environment.
- Production readiness or production traffic.
- CI gate completion that is not actually wired.
- Any progress that cannot be traced back to a slice manifest entry,
  slice contract MD file, or merged PR on `main`.
