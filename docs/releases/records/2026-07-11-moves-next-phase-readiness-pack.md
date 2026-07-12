# 2026-07-11-moves-next-phase-readiness-pack — Next-Phase Readiness Pack for Moves

## Release ID

`2026-07-11-moves-next-phase-readiness-pack`

## Status

`candidate`

## Plain-English Summary

Founder invariant (recorded 2026-07-06): a phase gate must generate the NEXT phase's
instructions — what evidence is needed, in what format, and why — so a Move never starts a phase
cold. This was never built for Source, and investigation this session found the equivalent Moves
machinery (`buildFeedForwardPack`, `NextPhaseFeedForwardCard`, `MovePhaseWorkspacePanel`) real,
tested, and deterministic, but **orphaned**: the 2026-07-10 standalone-workspace migration deleted
its only caller. The current live component (`MovesPhaseStandaloneClient.tsx`) even tells the user
"The feed-forward pack has been started" on gate approval — a promise nothing behind the scenes
was fulfilling.

Rather than resurrect the orphaned, signal-mapper-less pipeline, this release builds a
"Next-Phase Readiness Pack" directly from data the standalone workspace already receives and
already computes server-side, with zero fabrication:

- **What's missing** — `MoveEvidenceNeedPacket[]` (already passed into the component, already
  move-specific and evidence-readiness-backed) filtered to open (`missing`/`partial`) needs whose
  `blockedArtifacts` include the *next* phase's deliverables.
- **What format / template** — each open need's real `acceptedFormats` and `exampleTemplate`.
- **Why it matters / next action** — each need's real `whyItMatters` and `nextAction` copy.
- **Suggested working sessions** — the next phase's own `PhaseContract.sessions`, already defined
  per-phase in this same component, now reused as forward guidance instead of only being shown
  once a phase is already open.

A phase with no open required needs is shown as ready, honestly, rather than always inventing a
punch list. This surfaces in the CURRENT phase's Gate approval step — before the user ever opens
the next phase — satisfying "generated in THIS phase, not started cold in the next."

## Layer Impact

- `global-control-lane`: `MovesPhaseStandaloneClient.tsx` is the sole phase-workspace
  implementation for all tenants — this section is visible platform-wide, no flag.

## Client Applicability

- All clients: yes — no tenant gating, no feature flag. Content is entirely per-Move real data;
  Moves with no open evidence gaps simply show a "ready" state.

## Changes Included

- `src/lib/programs/phase-templates/next-phase-readiness-pack.ts` (new): pure
  `buildNextPhaseReadinessPack()` — filters/sorts `MoveEvidenceNeedPacket[]` to the needs that
  block the next phase's artifacts, required-priority first; computes `isFullyReady`; passes
  through the next phase's suggested sessions/templates untouched. No model, no invented data.
- `src/lib/programs/phase-templates/__tests__/next-phase-readiness-pack.test.ts` (new): 5 tests —
  filtering by next-phase-blocked artifact, required-first sort, `isFullyReady` logic (required vs.
  optional vs. no open needs), exclusion of covered/waived/not_applicable packets, and the terminal
  P5→Tower handoff case.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: threads `evidenceNeedPackets`
  into `PhaseBody`; computes the readiness pack for `phase + 1` (or the Tower handoff when
  `phase === 5`) in the gate-approval branch; renders a new `mxw-readiness` section after "Gate
  criteria" listing open needs (evidence slot, priority, format, why-it-matters, next action) and
  suggested working sessions for the next phase. Added matching `.mxw-readiness*` CSS to the
  component's existing inline style block (reuses `--amber`/`--amber-tint` for required-open
  items, consistent with the rest of the file's token set).
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: added a
  regression test asserting the readiness section renders real evidence-gap data (format, why it
  matters, next action) and the next phase's suggested sessions at the Gate approval substep.

## QA / Validation

- `npx eslint` on all four changed/new files: PASS — 0 errors (isolated git worktree off
  `origin/main`, symlinked `node_modules`).
- `npx tsc --noEmit -p .`: PASS — 0 errors touching any changed file.
- `npx jest` on both test files: PASS — 5/5 (`next-phase-readiness-pack.test.ts`) + 5/5
  (`MovesPhaseStandaloneClient.test.tsx`, 4 pre-existing + 1 new).
- Live post-deploy proof: NOT YET RUN — pending merge/deploy. Plan: open a live Move's Gate
  approval step, confirm the "Next: P{n+1} ... readiness" section renders real open evidence needs
  (or the "ready" message when none are open) and the next phase's suggested sessions.

## Rollout Plan

Merge to `main` → `aca-main-deploy.yml` builds/deploys → verify ACA runtime invariant → open a
live Move's phase workspace, navigate to Gate approval, confirm the readiness section renders.

## Rollback Plan

Revert this commit. The new section is additive (new file + new prop + new JSX block); no existing
behavior, route, or API contract is changed. No data migration, no flag to unwind.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be confirmed post-merge.
- ACA runtime invariant: to be verified via `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.

## Audit Evidence

- `npx eslint` output (0 errors) and `npx tsc --noEmit -p .` output (0 errors touching changed
  files) captured in this session's terminal; reproducible via the commands in QA / Validation.
- `npx jest src/lib/programs/phase-templates/__tests__/next-phase-readiness-pack.test.ts
  src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — both suites
  green (5/5 and 5/5) as of this commit; re-run to reproduce.
- Live signed-in browser proof to be attached post-deploy per the Rollout Plan.

## Known Gaps

- The readiness pack is scoped to evidence-need data already computed for the current phase; it
  does not (yet) parse real deliverable content for downstream signals like a Move's selected
  approach, workstreams, or owners (the richer `FeedForwardSignals` shape). That would require a
  real move-state → signals mapper, which does not exist anywhere in the codebase today — noted as
  a real follow-on, not implied to be covered here.
- Live signed-in browser proof is pending deployment (see QA section).
