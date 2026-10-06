# 2026-09-26-founder-demo-checklist-document-parity — the demo checklist document and the code inventory must name the same component

## Release ID

`2026-09-26-founder-demo-checklist-document-parity`

## Status

`candidate`

## Plain-English Summary

The document a presenter opens before a demo walk named a component the Tower rebuild
left behind. `docs/demo/ABARVA_FOUNDER_DEMO_ROUTE_CHECKLIST.md` said the Tower route's
expected component was `src/components/tower/ProgramPressureCards.tsx`, while the two
code-owned inventories — `src/lib/qa/founder-demo-route-checklist.ts` and
`src/lib/qa/route-smoke-inventory.ts` — both named
`src/components/tower/command-center/TowerCommandCenterAvaShell.tsx`, which is what the
route actually mounts. An earlier change corrected the code half and left the document,
and nothing anywhere compared the two, so the drift was free to persist and to recur.

This corrects the document and adds the missing comparison as a test: for every route the
document and the code inventory both name, the expected component must match, read out of
both files at test time rather than from a constant copied from either.

Correcting the document also falsified two things that depended on the document being
wrong, and the existing catalog-claims gate caught both rather than a reviewer noticing
them. They are repaired here and described under QA below.

## Layer Impact

Release lane: `internal-admin` — a repository control, an internal demo document and an
audit catalog's prose. No client-visible surface and no data plane.

- **Layer 1 — Client intake:** none.
- **Layer 2 — Source adapters:** none.
- **Layer 3 — Canonical model:** none. No tenant data, schema, projection or read model
  is touched.
- **Layer 4 — Products:** none at runtime. No route, component, prompt or answer path
  changes; nothing here is imported by application code.
- **Control plane / CI:** one new behavioral suite under `src/__tests__/behaviors/`, which
  the required behaviors job runs on every pull request, and a prose correction in
  `docs/security/ai-surface-control-catalog.json` that keeps
  `npm run audit:ai-surface-controls` green.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — a demo document, an audit catalog's prose, and two repository controls
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/demo/ABARVA_FOUNDER_DEMO_ROUTE_CHECKLIST.md` — the Tower route's **Expected
  Component** is corrected to the command-center shell the route mounts. The readiness
  caveat and the talking point on that same route, which described the retired
  pressure-card surface as what a viewer sees, are corrected with it; the caveat text now
  matches the caveat the code inventory already carries for that route.
- `src/__tests__/behaviors/founder-demo-checklist-document-parity.test.ts` — new, 2 cases.
  Parses the document at test time and compares it with `buildFounderDemoRouteChecklist()`
  per route. The population it parsed is asserted on its own first, because a parser that
  matched nothing would make the comparison vacuously true.
- `docs/security/ai-surface-control-catalog.json` — the Tower entry's `unreachableReason`
  no longer says the document points at the orphan, because it no longer does. The clause
  now names all three artifacts as agreeing on the shell. No `behavioralTest` row, no
  `knownSuites` list and no coverage figure changes.
- `src/__tests__/behaviors/unreachable-reason-claims.test.ts` — the gate's positive
  control is repointed and given an explicit premise check. See QA.

## QA / Validation

**Failing first.** The new suite on unmodified `origin/main` `36d947126` content:
**1 failed, 1 passed of 2**, and the failure names the Tower route row and both
spellings — document `ProgramPressureCards.tsx`, code
`TowerCommandCenterAvaShell.tsx`. After the document correction: **2 passed of 2**.

**The gate fails in both directions, and in two more.** Each mutation was applied to the
working tree, run, and reverted, with the control re-run green afterwards:

| # | Mutation | Result |
|---|---|---|
| 1 | Re-spell the component on the **document** side (`…CentreAvaShell.tsx`) | red — 1 failed, names the Tower route row and both spellings |
| 2 | Re-spell it on the **code** side (`…TowerCommandCenterShell.tsx`) | red — 1 failed, names the Tower route row and both spellings |
| 3 | Blind the parser's `**Route**` key so it matches nothing | red — the population assertion fires; no vacuous pass |
| 4 | Remove the `**Route**` row from one section, leaving its component row | red — named section reported as half-parsed, not silently skipped |

Mutation 4 is the one worth keeping: without it, a section that lost its route row would
drop out of the comparison and the suite would stay green over a route nobody was
checking.

**Two things the correction falsified, both caught by the C-513 gate rather than by me.**
Running the behaviors scope after the document fix went from 0 failing to **8 failing
across 3 suites** — `unreachable-reason-claims`, `catalog-coverage-two-denominators` and
`uncovered-control-known-suites` — all downstream of
`scripts/audit/ai-surface-control-catalog.mjs` exiting non-zero:

1. The Tower entry's `unreachableReason` asserted in prose that the document *still names*
   the retired component. Correcting the document made that clause stale, and the claims
   gate reported it by name. The prose is corrected here; the audit prints
   `AI surface control catalog passed (21 surfaces, 40 declared controls)` again, with
   coverage unchanged at 33 of 33 reachable and 33 of 40 declared.
2. `NAMES_A_FILE_THAT_DOES`, the claims gate's **positive control**, asserted a true
   clause about that same document line — so its premise was the defect. A positive
   control that holds only while the corpus is broken inverts the moment the corpus
   improves: it goes red for the repository getting better, which reads as a regression
   and invites someone to weaken the rule. It is repointed at
   `src/__tests__/integration/tower/program-pressure-cards.test.ts`, which names the
   component because exercising it is what that suite is for, and the test now reads that
   subject at test time and asserts the premise before asserting the rule. Mutation 5:
   point the subject at a file that does not name the component and the case goes red on
   the premise (`Expected substring: "ProgramPressureCards"`), not on the rule.
   `unreachable-reason-claims` is 8 passed of 8, with `STALE_TOWER_REASON` — the original
   false clause — still proving the gate bites.

**Scope regression, clean baseline, same scope both sides.** A detached worktree at
`origin/main` `36d947126` (not a stash) ran the same command:

- before: **142 suites, 1454 tests, 0 failing**
- after: **143 suites, 1456 tests, 0 failing**

Also green: `src/__tests__/integration/qa/founder-demo-route-checklist.test.ts` 23 of 23;
`node scripts/audit/qa-inventory-claims-check.mjs` exit 0, 22 known claims, no new stale
claims; `npx eslint` on both changed test files exit 0; typecheck
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` **exit 0** with
`tsconfig.tsbuildinfo` removed first, judged on the exit code rather than on grep output.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow builds and deploys as
it does for any merge. Nothing here changes runtime behavior, so no flag, migration or
data build is involved, and the deploy is incidental to the merge rather than the point
of it.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: whatever the main deploy workflow builds from the squash commit;
  recorded in the pulse entry after the run completes.
- ACA runtime invariant: to be verified after the deploy — Container App template image,
  100%-traffic revision image and worker job images all equal to that digest.
- Worker image invariant: unchanged by this release; verified with the same read.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**. This touches a markdown document, an audit
  catalog's prose and two test files. It reaches no route, no tenant and no rendered
  surface.

## Rollback Plan

Revert the squash commit. There is no data, migration or flag state to unwind. Reverting
restores the document's stale component name and the two gate repairs together; they must
move as one commit, because the catalog prose and the positive control are only true
while the document is correct.

## Audit Evidence

- PR: recorded on merge.
- CI: the required checks on that PR, including the behaviors job and
  **AI surface control catalog**.
- Local: the mutation table above, each entry reproducible with the command in it.
- Deploy: ACA main deploy run keyed to the squash SHA, and the digest read described
  under Deployment Authority.

## Known Gaps

- **Not fixed, and filed rather than guessed:** the same Tower row's **Validation Status**
  reads `ready` in the document and `partial` in `src/lib/qa/founder-demo-route-checklist.ts`.
  That is a second field disagreeing across the same two artifacts, and correcting it moves
  the document's summary counts (`Ready 6 / Partial 5`), which is the route-inventory
  rewrite this item explicitly excludes. The new gate covers `expectedComponent` only and
  does not assert anything about status.
- Nothing here mounts `ProgramPressureCards` or claims any control of it is on a screen.
  Whether to mount the accountability block or move its five controls remains a product
  decision, held elsewhere.
