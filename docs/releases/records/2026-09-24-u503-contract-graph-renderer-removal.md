# 2026-09-24-u503-contract-graph-renderer-removal — Remove an unreachable Source workspace renderer and replace its retired scan with a reachability control

## Release ID

`2026-09-24-u503-contract-graph-renderer-removal`

## Status

`candidate`

## Plain-English Summary

The Source workspace shell carried roughly 600 lines of a graph renderer that no
part of the product could open. The tab it belonged to left the workspace
information architecture on 2026-09-10; the component stayed behind, carrying its
own `eslint-disable` comment scheduling "a focused cleanup" that never happened.
Anyone opening the file read it as live product code.

Two weeks of green tests said it was fine. They were not testing a screen — they
were counting strings in a file, so they stayed green the entire time the
component was unreachable. Those assertions were retired in an earlier change,
which left a comment in their place describing the problem and nothing that could
detect the next one.

This release deletes the renderer, the four helpers only it used, the four label
helpers reachable only through those, the subtab constant, and the twelve
stylesheet class families that styled nothing else. In place of the retired
comment it adds a control that computes what the module can actually reach: it
walks the file's own reference graph out from its exports and fails when a
top-level declaration is not reachable from any of them. That control reported
exactly the ten names this change removed, and it fails again the next time a
component the product cannot mount is added.

Nothing an operator sees changes. No screen, route, permission or data path is
touched — what is removed was, by construction, not reachable from any of them.

## Layer Impact

**Release lane: `global-control-lane`.** The change ships to every client at once
and is not feature-gated — it cannot be, because what it removes has no mount
site to gate. It is not `client-data-lane`: no schema, RLS policy, seed,
ingestion or retrieval path is touched.

- **Layer 4 — Products (Source).** Presentation only, and only code no product
  surface mounts. No behaviour change on any rendered screen.
- Layers 1–3 (client intake, source adapters, canonical model) are untouched. No
  loader, adapter, projection, migration, schema or tenant-scoped read path is
  in this change.

## Client Applicability

- All clients: no functional change; the deleted renderer was unreachable for
  every tenant.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. Nothing gated the renderer — it had no mount site at all,
  so no flag could have exposed it.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
  — removes ten top-level declarations (567 lines): the graph page component,
  `GraphVolumeTable`, `GraphSpineTable`, `GraphVolumeBars`, `GraphMappingFlow`,
  the `GRAPH_SUBTABS` constant, and the four label/title helpers
  (`graphSubtabTitle`, `plainAdapterLabel`, `plainCanonicalLabel`,
  `plainSubstrateLabel`) that nothing else called.
- `src/app/(maestro)/source/preview/workspace/workspace.css` — removes the rules
  for twelve class tokens that styled only the deleted renderer, and removes
  those tokens from three shared selector lists without touching the rules the
  lists still serve.
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts`
  — replaces the retired comment block with an executable reachability control,
  `declares no top-level symbol that nothing exported can reach`.
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.shell-behaviour.test.tsx`
  — updates a header comment that described the deleted component in the present
  tense, so it does not outlive its subject.

No route, API, migration, script or workflow file changed.

## QA / Validation

**Unreachability was proven before anything was deleted, not after.** Four
independent checks, because the absence of a JSX mount site is necessary and not
sufficient:

1. Repository-wide search for `<ContractGraphPage`: zero occurrences anywhere,
   including `docs/`. The only non-declaration hits were three comment blocks in
   two test files and one line of an earlier release record.
2. An existing suite, `tenant-resolution-source-contract.test.tsx:275`, already
   asserts the tab is retired from the workspace IA — independent truth, written
   by something other than the code under test.
3. Stylesheet reachability was measured with exact class-token matching, not a
   substring count. This matters: the shortest token is a prefix of five longer
   ones, and a word-boundary match reports all of them as live. Under exact
   matching, twelve tokens had no reference outside the deleted code.
4. Export-reachability over the module's own reference graph returned exactly the
   ten declarations this change removes, and no others — so the deletion is the
   whole dead closure and nothing beyond it.

**Failing test first, then the fix, then a deliberate break.**

| step | result |
|---|---|
| clean baseline, both named suites on `origin/main` | 61 passed, **0 failing** |
| new control added, before the deletion | **1 failing**, listing exactly the ten unreachable names |
| after the deletion | 62 passed, **0 failing** |
| mutation M1 — re-add one unmounted component | **RED**, naming that component and nothing else |
| mutation M2 — add a component that IS mounted | **GREEN**, so the control is not simply reporting every new symbol |

M2 is included deliberately: a control that fails on any addition is not a
reachability control, it is a size limit. Both directions were checked.

Wider scope, same worktree:

- `npx jest 'src/app/(maestro)/source'` — 41 suites, 335 tests, all passing.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  **exit 0**, 0 diagnostics. (Judged by exit code: a bare run exits 134 on this
  machine, which emits no diagnostics and greps clean while having failed.)
- `npx eslint` over all four changed files — no findings. The renderer's own
  `eslint-disable @typescript-eslint/no-unused-vars` is gone with it; the four
  label helpers had to be removed in the same change because deleting only their
  caller would have made them newly unused and turned that rule red.

Both modified suites are named by exact path in
`.github/workflows/ai-surface-control-catalog.yml`, so the new control runs in a
required job rather than in an unwired directory.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys on
merge. There is no migration, no flag, no env var and no worker job in this
change, and no data build to run.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. No agent ran an Azure mutation for this release.
- Shared runtime mutators: none. No `az containerapp update`, no traffic change,
  no revision weight change, no template edit was performed by this work.
- Approved image digest: produced by the main deploy workflow for the merge SHA;
  recorded in the deployment addendum rather than asserted here in advance.
- ACA runtime invariant: to be proven after the deploy run completes — Container
  App template image digest equal to the 100%-traffic revision digest, read from
  that run's own `runtime-invariant-proof.json`, plus a live Azure read.
- Worker image invariant: unaffected; no worker job image changes.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and this is stated rather than assumed.
  A signed-in check can only observe rendered surfaces; the code removed here is
  reachable from none of them, so a signed-in session cannot distinguish before
  from after. The acceptance that does discriminate is the reachability control,
  which runs in CI on every PR. This release must therefore be promoted no
  further than `deployed`.

## Known Gaps

- **No signed-in acceptance, and it is owed to nobody.** Named explicitly rather
  than left implied: a signed-in session renders surfaces, and the deleted code
  is reachable from none of them, so such a check could not tell this release
  apart from its predecessor. This release stops at `deployed`.
- **The control is scoped to one module.** It proves export-reachability for
  `WorkspaceExecutiveShell.tsx` only, because that is the file U-503 names. Every
  other component file in the repository can still hold an unreachable renderer
  and nothing would report it. Generalising the control to a repository-wide
  check is real work with a real false-positive question behind it (a component
  exported for a route the graph cannot see), and it is not smuggled into this
  change; it is filed as `U-504`.
- **jsdom parses no stylesheet.** The removal of the twelve class families is
  proven by exact-token reachability over the sources, not by a rendered tree —
  no test in this repository can observe a missing CSS rule. The four checks in
  QA are what stands behind the CSS half, and that is stated rather than dressed
  up as a render.
- **One judgement call is recorded, not hidden.** The backlog item enumerates the
  renderer, four private helpers and the subtab constant. Four further label
  helpers (`graphSubtabTitle`, `plainAdapterLabel`, `plainCanonicalLabel`,
  `plainSubstrateLabel`) were reachable only through those and are removed too.
  Leaving them would have been the identical defect one level down, and would
  also have turned `@typescript-eslint/no-unused-vars` red.

## Rollback Plan

Revert the single squash commit. The change is additive-free and purely
subtractive in the product file, so a revert restores the previous bytes exactly;
there is no migration to unwind and no persisted state that depends on it. A
revert also restores the ten unreachable declarations, which would put the new
reachability control back into a failing state — that is the correct and intended
consequence, and it should be read as the control working, not as a broken test.

## Audit Evidence

- PR URL and CI run: recorded on merge in the operator register.
- The reachability control itself is the durable evidence: it is checkable at any
  later date by running the named suite, and unlike a scan for an absent name it
  reports on whatever the file contains when it runs.
- Baseline and post-change numbers, and both mutation results, are in the QA
  section above with the scope they were measured over.
- Backlog item `U-503` in the execution backlog, and the claim and release lines
  in the append-only execution register.
