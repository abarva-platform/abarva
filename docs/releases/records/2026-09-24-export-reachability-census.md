# 2026-09-24-export-reachability-census — Measure unreachable component code repository-wide, and wire the walk as one shared control

## Release ID

`2026-09-24-export-reachability-census`

## Status

`candidate`

## Plain-English Summary

A UI component can stop being used and still look completely healthy. It keeps
compiling, it keeps passing the linter, and it keeps reading as live product
code to the next engineer who opens the file. The linter's unused-code rule is
satisfied as soon as one unused piece refers to another, so a *cluster* of dead
code hides better than a single orphan does. One such cluster — ten declarations
and 567 lines — sat in a Source workspace component for about two weeks with
thirteen tests about it passing, until an earlier change removed it.

That earlier change also added a check for the problem, but the check read only
the one file it was written in. Nobody knew whether the rest of the codebase had
the same problem, and a guess was not good enough to decide what to do about it.

This change answers the question by measuring, then acts on the answer.

**The measurement: 1611 component files scanned, 6 files affected, 7 unused
declarations in total — and none of them is a renderer.** All seven are single
unused colour or font constants. There is no second hidden cluster.

**The measurement also exposed a defect in the check itself, which is the more
important finding.** Run over the whole codebase for the first time, the
original check reported 22 problems, and **15 of those 22 were wrong**. All
fifteen came from one cause: the check looked for comments by scanning text, and
a file-path example written inside a page's visible content —
`src/lib/reasoning/*` — contains the two characters that begin a comment in
code. The check treated the rest of the component as commented out, and so
reported everything the page legitimately uses as unused. This is exactly the
failure the work item warned about in advance: a check that accuses live code of
being dead is a check the team turns off. Two further errors ran the other way
and made the check silently *miss* dead code.

None of this is fixable by adjusting the text search, because each error is a
question about program syntax rather than about text. The check now asks the
TypeScript compiler, which this repository already depends on. Cost of doing so,
measured: 0.7 seconds to scan all 1611 files.

Finally, the check now lives in one shared place instead of inside one test
file, and runs automatically on pull requests that touch component code, against
a recorded list of the seven known cases. A brand-new instance fails the build;
so does a recorded case that has quietly been fixed, so the list cannot go
stale.

**Nothing was deleted.** The seven findings are recorded, not cleaned up: the
work item excludes removal deliberately, because deleting code on the strength
of a bulk report is how a live surface gets removed by accident. Each removal is
its own change with its own evidence.

## Layer Impact

**Release lane: `internal-admin`.** An engineering control and its published
measurement, visible to nobody outside the team. Not `global-control-lane`: no
shared app or control-plane behaviour changes, and no client receives anything.

- **Layer 4 (Products):** no runtime behaviour changes. No component, route,
  answer, projection or query is altered. One test file now imports a shared
  module instead of defining the same function privately; its assertion and its
  result are unchanged.
- **Layers 1–3 (intake, adapters, canonical model):** untouched. No dataset, no
  schema, no loader, no tenant data and no read model is read or written.
- **Engineering controls:** one new repository-owned control, its behavioural
  suite, its recorded baseline, and one CI job.

## Client Applicability

- All clients: no functional change. Nothing a client can see is added, removed
  or reworded.
- Specific clients: none.
- Internal only: yes — a code-quality control and its published measurement.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

| path | what |
|---|---|
| `scripts/quality/export-reachability.mjs` | new. The shared walk, the census, and a `--check` gate. Takes the shared CLI invocation guard from `scripts/exec/cli-entry.mjs` and refuses unrecognised flags. |
| `scripts/quality/export-reachability.test.mjs` | new. 19 behavioural cases. |
| `scripts/quality/export-reachability-baseline.json` | new. The seven findings, per declaration, each with a reason. |
| `.github/workflows/export-reachability.yml` | new. Runs on `src/app/**`, `src/components/**` and the control's own files. |
| `package.json` | new script `check:export-reachability`. |
| `docs/quality/export-reachability-census.md` | new. The published census and the reasoning behind the wiring decision. |
| `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts` | the private copy of the walk removed; imports the shared module. `stripComments` stays — it still scans a stylesheet, which has no TypeScript syntax to parse. |
| `scripts/exec/source-stage-map.json` | places `U-504` on the structure map, so the board and queue can see it. |

The walk was **moved, not copied**. A rule applied by hand in the places someone
happened to think of is the defect shape recorded as item T-723.

## QA / Validation

**Failing test first, then the fix, then deliberate breakage.** Same scope both
sides, no absolute counts quoted as if this change caused them.

| step | result |
|---|---|
| clean baseline: the two workspace suites on `origin/main` `c9adfff40` | 62 passed, **0 failing** |
| new suite, against the walk ported over unchanged | **5 failing / 9 passing of 14** |
| after replacing the walk with a parser-based one | **0 failing / 14 passing**, then 19/19 once the baseline cases were added |
| the two workspace suites after rewiring to the shared module | 62 passed, **0 failing** — unchanged |

The five red cases were four distinct defects, each a real file or a real
mechanism rather than an invented one:

1. `src/app/(maestro)/docs/reasoning/page.tsx` — 8 declarations reported unused;
   every one is referenced between lines 300 and 335.
2. `src/app/(maestro)/docs/reasoning/api/page.tsx` — 7 reported the same way.
3. a module-level statement outside every declaration was in no span, so what it
   referenced looked dead.
4. an identifier inside a **string** counted as a reference, so
   `return "Orphan"` kept a dead component alive — under-reporting, silently.

**Mutations — the control has to be able to fail, and has to be able not to.**

| mutation | expected | result |
|---|---|---|
| M1 — add a two-declaration dead closure to a real component | RED, naming those two | **RED**, named `DeadRow`, `deadRowLabel`, exit 1 |
| M2 — add a component that IS reachable from an export | GREEN | **GREEN**, exit 0 |
| M3 — clean up a baselined finding without updating the baseline | RED as stale | **RED**, named `SANS`, exit 1 |
| M4 — pass `--chek` | refuse, measure nothing | **exit 2**, nothing measured |
| M5 — add a dead closure to `WorkspaceExecutiveShell.tsx` | the rewired suite fails | **1 failed / 60 passed**, naming exactly `DeadPanel`, `deadPanelCaption` |

M2 is deliberate: a control that fails on any addition is a size limit, not a
reachability control. M3 is the direction that is easy to omit, and it is why the
baseline cannot rot. M5 proves the assertion that moved is still load-bearing
where it was.

**The real known positive, not only fixtures.** The work item required this
explicitly. Run against the content of `WorkspaceExecutiveShell.tsx` at
`c26e0c219` — the parent of the earlier change's merge, so real code from
history — the walk returns exactly the ten declarations that change removed and
no others:

```
ContractGraphPage  GRAPH_SUBTABS  GraphMappingFlow  GraphSpineTable
GraphVolumeBars  GraphVolumeTable  graphSubtabTitle  plainAdapterLabel
plainCanonicalLabel  plainSubstrateLabel
```

Both the old walk and the new one find these ten. Only the new one gets the
fifteen false positives right, so correctness was gained without trading away
the true positive.

**Other gates, all from this branch:**

| command | result |
|---|---|
| `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` | **exit 0**, 0 `error TS` lines (exit code judged, not grep — a bare run exits 134 on this machine) |
| `npx eslint` over the three changed code files | **exit 0** |
| `npm run check:export-reachability` | **19/19 pass**, baseline matches, exit 0 |
| `node --test scripts/quality/cli-invocation-guard.test.mjs` | **3 pass / 0 fail**; the new CLI is one of the 10 swept and is distinguishable through a symlinked path |
| `node --test scripts/exec/build-source-board.test.mjs` / `build-execution-queue.test.mjs` | 1 pass / 0 fail each |
| board regenerated after the map edit | unmapped ids fall from **11 to 10**; `U-504` is now placeable |

## Rollout Plan

Merge to `main`. **No runtime rollout of any kind.** Nothing in this change is
imported by application code: the control is a `scripts/` module used by a test
and a CI job. No image behaviour changes, no environment variable, no flag, no
migration, no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on
  merge as it does for every change. This change contributes nothing to the
  image's behaviour.
- Shared runtime mutators: **none.** No `az containerapp` command, no traffic
  shift, no revision weight, no template edit.
- Approved image digest: not applicable — this change does not require a runtime
  image to carry it.
- ACA runtime invariant: to be recorded against the post-merge deploy run keyed
  to this change's squash SHA, as the standing rule requires, and asserted only
  once read.
- Worker image invariant: unchanged; no worker job is added or altered.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and none is claimed. Nothing here
  renders on a product surface, so there is no signed-in surface to prove and no
  signed-in acceptance is owed.

## Rollback Plan

`git revert` of the squash commit. No migration and no data change, so the
revert is complete on its own. The revert restores the private copy of the walk
inside the performance suite, which puts back the JSX false-positive behaviour —
so a revert should be followed by deleting the new CI job rather than leaving it
pointed at a removed script.

## Audit Evidence

- This branch's PR, its checks, and the merge SHA.
- `docs/quality/export-reachability-census.md` — the census, the corrected and
  uncorrected numbers, and why the wiring decision went the way it did.
- `scripts/quality/export-reachability-baseline.json` — the seven findings with
  reasons.
- The mutation table above, reproducible by the commands it names.
- `scripts/quality/export-reachability.test.mjs` — the 19 cases, including the
  two real product files that the previous walk got wrong.

## Known Gaps

- **Whether this job is a *required* check is a repository-ruleset setting and is
  not changed here.** The workflow runs on pull requests touching component
  files; making it blocking is an owner action.
- **The seven findings are not cleaned up.** That is deliberate and is the work
  item's own exclusion. Each is a separate bounded change with its own proof.
- **The census covers `src/app` and `src/components` only.** Components living
  outside those roots, and non-component modules anywhere, are not measured.
  Widening the roots is a one-flag change (`--roots`) and no measurement of the
  wider corpus is claimed here.
- **Where a local binding shadows a module-level name, the walk calls the
  module-level name reachable.** That hides dead code rather than inventing it —
  the correct direction for a control someone can switch off — but it means the
  census is a floor, not an exact count.
- Test, mock and fixture directories are excluded by construction, so dead code
  inside a suite is out of scope.
