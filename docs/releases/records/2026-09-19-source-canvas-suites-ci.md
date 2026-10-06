# 2026-09-19-source-canvas-suites-ci — Source canvas front-surface suites now run in CI

## Release ID

`2026-09-19-source-canvas-suites-ci`

## Status

`candidate`

## Plain-English Summary

Three test suites covering the Source event canvas ran on developer machines and
nowhere else. No CI job named them, so deleting the behaviour they check would
not have failed a pull request. They are the highest-risk such directory the
repository's own coverage census can see: it bands them `critical` because one of
them renders an agent answer, a surface with declared controls.

The three were already passing, so nothing is being repaired here — what changes
is that they now report. Before wiring them, each was checked against a
deliberate break of the code it guards, because a suite that passes is not
automatically a suite that would notice.

The directory is wired rather than the three files by name. The sibling
directory next to it was wired file-by-file after the same discovery, which
leaves the next suite added there invisible again; naming the directory does not.

## Layer Impact

Release lane: `global-control-lane`. The change is shared repository tooling — CI
scope and a generated measurement file — with no client-scoped data, no
internal-admin capability, no public surface and no feature flag.

- **Products** — no product behaviour changes. No component, route, prompt or
  data path was modified; the only product-code edits in this work were
  mutations, applied one at a time and reverted immediately, to prove each suite
  can fail.
- **Tests / CI** — one step appended to `.github/workflows/ai-surface-control-catalog.yml`.
  The committed coverage census is refreshed to match what workflows now reach.

## Client Applicability

- All clients: no runtime change reaches any client.
- Specific clients: none.
- Internal only: yes — CI scope and a generated measurement file.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — one appended step,
  `Exercise Source canvas front-surface suites`, running
  `npx jest src/components/source/canvas/__tests__ --runInBand`.
- `docs/architecture/test-ci-coverage-census.json` — regenerated with
  `node scripts/quality/test-ci-coverage-census.mjs --write`.

## QA / Validation

**Baseline, measured on exact `origin/main` `ed56bca10` before any edit.** The
census reports 2286 Jest files under `src/`, 450 reached by a workflow, 447 by a
pull-request workflow, 1836 reached by nothing. `src/components/source/canvas/__tests__`
sits first on the uncovered governed-risk list: band `critical`, signal
`declared_ai_surface_control`, three suites, none reached. The three suites run
green: **3 suites / 9 tests / 0 failing**. Grep confirms no npm script and no
workflow names the directory or any file in it.

**Triage of the three, in the item-26 form.**

| Suite | Verdict | Reason |
|---|---|---|
| `ArtifactBlockerList.test.tsx` | **real** | Asserts every blocker's own sentence and short label render, not only the first — the specific regression the shared component exists to prevent. Passes. |
| `AvaBottomBar.test.tsx` | **real** | Drives the conversation open and asserts the agent turn renders its prose *and* its structured table and bar-chart parts. Passes. |
| `SimpleStageFront.test.tsx` | **real** | Six cases over the stage front: evidence table, working-session guide, optional-evidence rows, the artifact context manifest, and the approval gate being disabled while a required input is open. Passes. |

None was stale; none was deleted; no assertion was weakened.

**Mutation proof that the suites are load-bearing — five applied, five caught.**
Each mutation was applied to product code, the suite run, and the file restored
with `git checkout --` before the next.

| # | Mutation | Result |
|---|---|---|
| 1 | `ArtifactBlockerList` renders `blockers.slice(0, 1)` — only the first reason | 1 failed / 1 passed |
| 2 | `AvaBottomBar` stops rendering `AgentResponseParts`, keeping the prose | 1 failed / 1 total |
| 3 | Approval button `disabled={generating}` — ungated from required-evidence readiness | 1 failed / 5 passed |
| 4 | `ArtifactContextManifest` returns `null` — the pre-approval evidence disclosure disappears | 1 failed / 5 passed |
| 5 | `isRequirementReady` returns true for every requirement — the gate opens with nothing loaded | 3 failed / 3 passed |

**Mutation proof that the wiring itself can fail.** Replacing the new step's
command with `echo skipped` and re-running the census returns workflow-reached
files 453 → 450 and puts `src/components/source/canvas/__tests__` back at rank 1
of the uncovered governed-risk list. The step is therefore what produces the
coverage, not a comment that names it.

**After.** The exact command the workflow runs — `npx jest
src/components/source/canvas/__tests__ --runInBand` — reports 3 suites / 9 tests
/ 0 failing. Census after the change: 453 reached by a workflow (450 by a
pull-request workflow), 1833 by nothing; the directory is gone from the uncovered
list and `src/components/atlas/__tests__` is now rank 1.

**On the size of the census diff.** It is 351 insertions / 471 deletions, and
only three covered files of that are this change. The committed census on `main`
recorded 375 covered files while `main` itself measured 450 — the file had drifted
75 files behind because refreshing it is deliberately manual (recorded as such in
`docs/architecture/ci-gate-registry.json`, with the reason). Regenerating it here
is the documented practice for whoever re-measures, and the drift is recorded as a
separate backlog finding rather than fixed inside this change.

**Other checks.** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` with `tsconfig.tsbuildinfo` removed first — exit code judged, not
grepped. ESLint over the changed paths. `node scripts/release-check.mjs --base
origin/main --head HEAD`. `src/__tests__/behaviors/test-ci-coverage-census.test.ts`
— 12 passed, unchanged before and after.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys the
merge commit as it does for every merge. There is no runtime behaviour in this
change to roll out; the new CI step takes effect on the next pull request.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az containerapp` command is involved.
- Approved image digest: whatever the main deploy workflow builds for the merge
  commit; this change adds no image requirement.
- ACA runtime invariant: to be proven after merge with
  `scripts/deploy/check-aca-runtime-invariant.mjs`, as for any merge.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — no product code changed, so there is no
  user-visible behaviour to accept.

## Rollback Plan

Revert the commit. The workflow step disappears and the census file returns to
its previous contents; no migration, no data, no runtime state is involved.

## Audit Evidence

- The pull request and its CI run, specifically the `AI surface control catalog`
  job log showing the `Exercise Source canvas front-surface suites` step printing
  `Tests: 9 passed` — the step executing on the runner, not merely present in the
  file.
- `node scripts/quality/test-ci-coverage-census.mjs` output before and after,
  quoted above.
- The five mutation results above, each reproducible from the description.

## Known Gaps

- The committed census on `main` was 75 covered files behind what `main` measured.
  Refreshing it is manual by a documented decision, so this is a cost rather than
  a defect — but nothing reports the drift, and the file is the input to which
  directory gets wired next. Recorded as a backlog finding; not changed here.
- The census credits this directory to the `agent-dock-chat-turns` control through
  a **type-only** import of `ChatMessage` from `AgentDock`. The risk signal is
  right about the surface — `AvaBottomBar` does render agent output — but the
  evidence that produced it would score the same for a suite that only borrowed a
  type. Recorded as a backlog finding; the census scorer is not changed here.
- `src/components/atlas/__tests__` is now rank 1 uncovered, and the next four are
  larger directories with `approval_or_lifecycle_write` and `tenant_scoped_read`
  signals. Not taken here; one directory per change is the point.
