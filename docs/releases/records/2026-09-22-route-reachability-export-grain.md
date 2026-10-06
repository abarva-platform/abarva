# 2026-09-22-route-reachability-export-grain — Route reachability gains the export grain, and stops ignoring `src/app`

## Release ID

`2026-09-22-route-reachability-export-grain`

## Status

`candidate`

## Plain-English Summary

The repository runs an audit whose whole job is to report work that shipped where no user can reach
it. It had two blind spots, and a component that renders nowhere sat inside both.

**It was not looking at `src/app`.** The watch list was `src/components` alone, so every component
colocated with a route — the entire Source preview workspace among them — was examined by nothing.
The committed baseline is the evidence: 398 orphans, every one under `src/components`, not a single
path under `src/app`.

**It asked the question at the wrong grain.** The walk is file-level: it reports files no route can
reach. A dead component inside a *live* file is therefore invisible, because the file is reached.
That is not hypothetical — `ContractRefusalChips` is exported from a Source workspace file every
Source route reaches, has no importer in the product, and renders nowhere. The audit was quiet about
it, and the file's own doc comment still describes it as something the tab shows.

This change fixes both:

- **The watch list now covers `src/app` as well as `src/components`.** The draw is **18 files**, not
  the hundreds the previous widening produced, and they are recorded as debt in the existing
  baseline rather than failed on.
- **A second pass reports exported symbols that no route-reachable file imports**, against a new
  baseline of its own. It found **94**, across 1,188 reachable files in the watched trees.

Three rules keep the second pass honest, and each was wrong in a first draft:

- **A test importer is not a mount.** The consumed set is built from the route-reachable set alone,
  so a symbol kept alive only by its own suite is still reported.
- **A mention in a file's own comment is not a use.** Comments and string literals are stripped
  before local uses are counted. Without that, the doc comment above `ContractRefusalChips` scored
  it as used and the one known-true positive went unreported — a check that cannot flag it does not
  work, and this one silently did not until the stripping was added.
- **A file-level orphan is never billed twice.** Exports inside a file no route reaches belong to
  the file baseline; reporting both would make one defect look like two.

Anything that cannot be resolved to individual names — star imports, dynamic `import()`, `require`,
`export *` re-exports — is treated as reaching every export of its target. That direction is
deliberate: a false negative costs a missed orphan, while a false positive costs the gate its
credibility, and a gate nobody believes is a gate that gets quarantined.

## Layer Impact

**Release lane: `internal-admin`.** AbarVa-only repository quality tooling. No client-facing
capability, no tenant data, no feature gate, so none of `global-control-lane`, `client-data-lane`,
`public-demo` or `experimental` applies.

- **Layer 4 — products:** none. No product surface, route, read path or rendered output changes. The
  components the new pass names are left exactly as they are; naming them is the deliverable.
- **Test, CI and release tooling:** `scripts/audit/lib/route-reachability.mjs` (shared with the AI
  surface control catalog, so both audits keep one answer to "can a user reach this"),
  `scripts/audit/route-reachability-check.mjs`, its two committed baselines, one new behavioral
  suite, and one CI step that runs it.

## Client Applicability

All clients equally, and none specifically. This is repository tooling: it changes what CI reports
about the codebase, not what any tenant sees. No tenant-scoped schema, seed, ingestion, retrieval or
private data-plane behavior is touched.

## Changes Included

- `scripts/audit/lib/route-reachability.mjs` — adds `computeExportReachability(repoRoot, watchedDirs)`:
  per-module export extraction, per-importer named-import resolution, comment- and string-stripped
  local-use counting, and the conservative `'*'` treatment of unresolvable specifiers.
- `scripts/audit/route-reachability-check.mjs` — `WATCHED` widened to `['src/components', 'src/app']`;
  second baseline `docs/architecture/unreachable-exports.json` read, written by `--update`, and
  compared on every run; `--json` now reports `watched`, `orphanExports`, `exportsAdded`,
  `exportsRemoved` and `scannedFiles`; exit status fails on a new **or** a stale export entry, the
  same contract the file baseline already had.
- `docs/architecture/unreachable-components.json` — regenerated: 398 → **416** (the 18 `src/app`
  files the widened watch now sees). Also records the `watched` list it was generated under, so a
  narrowing is visible in the artifact and not only in the script.
- `docs/architecture/unreachable-exports.json` — new. 94 entries, recorded debt.
- `src/__tests__/behaviors/route-export-reachability.test.ts` — new, 12 cases.
- `.github/workflows/unit-suites.yml` — one step running that suite by path.

One deletion worth naming: the first implementation carried an `isExcluded()` guard over the
route-reachable set. Measured before keeping it — **0 of 3,373** reachable files are excluded, so the
branch could never fire, and a mutation removing it killed nothing. It was removed rather than
shipped. An alternative that cannot be taken, inside a control that exists to report exactly that
shape, is not defensive; it is the defect wearing the control's uniform.

## QA / Validation

**Red first.** The suite was written before the implementation and run against unmodified `main`:
**11 failed, 11 total** — `SyntaxError: The requested module ... does not provide an export named
'computeExportReachability'`. It stands at **12 passed, 12 total** after the change (a twelfth case
was added later, pinning the watch list).

**Two fixture cases were wrong on their first run, and the implementation was right.** The
test-only-importer and comment-mention files were not route-reachable in the fixture at all, so they
were file-baseline findings rather than export findings. The fixture was corrected to make each file
reachable through a sibling export, which is the state the case was meant to construct.

**Mutation-proved — four mutations, each killing the suite, each restored afterwards:**

| mutation | result |
|---|---|
| unmutated | 12 passed |
| comments counted as local uses | **3 failed**, 9 passed |
| a test importer counts as a mount | **3 failed**, 9 passed |
| exports inside file-level orphans double-billed | **2 failed**, 10 passed |
| `WATCHED` narrowed back to `['src/components']` | **1 failed**, 11 passed |
| restored | 12 passed |

**Proved on a real case, not a fixture.** The suite asserts the real tree reports
`src/app/(maestro)/source/preview/workspace/ContractOptimizeMethod.tsx#ContractRefusalChips` and does
**not** report the mounted `ContractOptimizeMethod` from the same file.

**The baseline was sampled for false positives before being committed**, because a baseline of noise
is how a gate gets quarantined. Seven entries were drawn across the spread and checked by hand
against the tree: six have their declaration as the only occurrence anywhere. The seventh,
`SourceDrawerShell.tsx#DrawerBanner`, has six references outside its own file and is still correct —
both importers, `SourceDecisionCanvasClient.tsx` and `SourceEvidenceDrawer.tsx`, are themselves
file-level orphans. It is a transitive true positive, and precisely the kind the file grain cannot
see: its own file is reachable.

**Clean baseline, same scope, both directions.** The three pre-existing suites that consume the
reachability library or its baseline — `source-canvas-reachability`, `lib-orphan-report`,
`route-ownership-map-is-true` — on unmodified `origin/main` `3bd2f4972`: **43 passed, 0 failed, 3
suites**. On this branch, same invocation: **43 passed, 0 failed, 3 suites**. **0 failing before, 0
after.**

**Gates:** `npm run audit:route-reachability` exit 0 ("No new unreachable components or exports").
`npm run audit:lib-orphans` exit 0, no change against its baseline. `npm run audit:ci-gate-registry`
exit 0 — no new npm script was added, the existing gate was extended, so the registry is unmoved.
`tsc --noEmit --pretty false` with `tsconfig.tsbuildinfo` deleted: **exit 0**, judged on the exit
code. `eslint` on all three changed source files: exit 0. `.github/workflows/unit-suites.yml` parsed
and the new step located by name.

## Rollout Plan

Merge to `main`; the repo-owned ACA deploy workflow carries the commit. Nothing to enable: the audit
already runs in `architecture-boundary.yml`, so the export pass gates PRs from the first run after
merge, and the new suite runs in `unit-suites.yml`.

## Deployment Authority

Repo-owned `aca-main-deploy` workflow only. No ad-hoc `az` command, no traffic shift, no revision
weight change, no env or flag mutation from this branch.

## Rollback Plan

Revert the commit. The two baselines are regenerable at any commit with
`npm run audit:route-reachability -- --update`, and reverting restores the previous watch list and
drops the export pass. No migration, no data, no runtime state.

## Audit Evidence

- Behavioral suite: `src/__tests__/behaviors/route-export-reachability.test.ts`, 12 cases, wired by
  exact path in `.github/workflows/unit-suites.yml`.
- Baselines: `docs/architecture/unreachable-components.json` (416), `docs/architecture/unreachable-exports.json` (94).
- Gate: `npm run audit:route-reachability`, already a step in `.github/workflows/architecture-boundary.yml`.

## Known Gaps

- **The 94 are recorded, not repaired.** This ships the report, not the cleanup. The baseline's own
  note says extending it instead of mounting or deleting is how an exported component with no caller
  comes to look live.
- **Named exports only.** A default export with no importer is not reported, because a default is
  imported under any name the importer chooses and resolving that needs real binding analysis. The
  grain that was costing findings is the named one.
- **Type-only exports are out of scope by design.** An unused exported type is tidiness; an unused
  exported component is a surface no user can reach.
- **The real-tree case is tied to a component whose fate is an open product decision.** When that
  decision lands, the case goes red and must be repointed at a then-current known-true positive
  rather than deleted — the suite says so at the case. Without a real case it is proved only against
  fixtures written to satisfy it.
- **The behavioral suite for the comparable `lib-orphan-report` control is still wired into no
  workflow.** Found while wiring this one; not fixed here, and not this item's scope.
