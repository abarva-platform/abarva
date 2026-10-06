# 2026-09-18-route-reachability-gate-in-ci - Turn The Reachability Audit On, And Point It At Everything

## Release ID

`2026-09-18-route-reachability-gate-in-ci`

## Status

`candidate`

## Plain-English Summary

There is an audit that walks the import graph from the app's routes and reports
components no route can reach. It was written after a 425-line change landed in a
component nothing mounted.

Three things were wrong with it at once:

1. **It did not run.** It had an npm script and no workflow. Nothing invoked it in
   CI, so its result reached no one.
2. **It was failing.** Nine components had become unreachable since the baseline
   was last refreshed. Because of (1), nobody saw.
3. **It watched one directory.** `src/components/source` only. Across
   `src/components` as a whole, **398 of 898 files are unreachable from any
   route** — 294 of them outside the watched directory, reported by nothing.

Among those 294 were three AI control surfaces the control catalog counted as
controls the product has, including the Tower pressure brief with five declared
controls.

This runs the audit in CI, widens it to all of `src/components`, and records the
full 398-file baseline so a new orphan anywhere fails the build.

## Layer Impact

Audit tooling and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `.github/workflows/architecture-boundary.yml`: runs the audit. It did not run
  anywhere before this.
- `scripts/audit/source-canvas-reachability.mjs` → `scripts/audit/route-reachability-check.mjs`,
  and the npm script `audit:source-canvas-reachability` → `audit:route-reachability`.
  A script named for one directory that gates all of them is the same kind of
  misleading label this audit exists to catch.
- `docs/architecture/source-canvas-orphans.json` → `docs/architecture/unreachable-components.json`,
  regenerated: 104 Source entries → 398 across `src/components`. Its note now says
  plainly that the list is debt and not a permission slip.
- `docs/security/ai-surface-control-catalog.json`: two `unreachableReason` strings
  repointed at the renamed baseline.

## What the 398 are

Counts of unreachable files by directory, out of the files in each:

| Directory | Unreachable | Total |
|---|---|---|
| `src/components/source` | 104 | 211 |
| `src/components/knowledge` | 48 | 66 |
| `src/components/admin` | 43 | 116 |
| `src/components/home` | 41 | 90 |
| `src/components/tower` | 40 | 61 |
| `src/components/programs` | 23 | 47 |
| `src/components/strategic-moves` | 18 | 50 |
| `src/components/abarva` | 16 | 23 |
| everything else | 65 | 234 |

This release does not delete or mount any of them. It records them, so the number
can only go down by deliberate work and cannot go up by accident.

## QA / Validation

Two mutations, each applied and reverted:

| Mutation | Result |
|---|---|
| Add a new component under `src/components/tower` that no route mounts | caught, named the file |
| Baseline lists a file that is no longer an orphan, and omits one that is | caught both directions |

Status: **pass**.

- `npm run audit:route-reachability`: **exit 0** — `631 route entry points, 398
  unreachable file(s) under src/components`, `No new unreachable components`.
  Status: **pass**.
- `npm run audit:route-reachability -- --update`: **exit 0**, writes 398. Status:
  **pass**.
- `npm run audit:ai-surface-controls`: **exit 0** after the baseline rename.
  Status: **pass**.
- `npx eslint` on all three scripts: **exit 0**. Status: **pass**.
- `release-check`: **exit 0** — captured as an exit status, not read off a pipe.
  Status: **pass**.
- No TypeScript changed.
- Signed-in acceptance: **not applicable** — no product behavior changes.

## The nine that were already failing

These became unreachable before this change and are absorbed into the new
baseline, which is what turning a gate on initially requires. They are named here
rather than left inside a 398-line diff:

`SourceEventsViewToggle.tsx`, `SourcePortfolioBookPage.tsx`,
`SourcePortfolioPage.tsx`, `SourceVendorSelectionReadinessPanel.tsx`,
`canvas/bafo/BafoScenarioComparePanel.tsx`, `portfolio/MiniRail.tsx`,
`portfolio/PortfolioEmptyState.tsx`, `portfolio/PortfolioEventsTable.tsx`,
`portfolio/PortfolioFilterSidebar.tsx` — all under `src/components/source`.

## Rollout Plan

Squash-merge after required checks pass. No deploy required; it rides the next ACA
main deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: None.

## Rollback Plan

Revert through a new PR. No runtime effect either way.

## Audit Evidence

PR link, the audit's summary line, both mutation results, and the per-directory
table above.

## Known Gaps

- **398 unreachable files are recorded, not fixed.** Nothing here decides whether
  any of them should be mounted or deleted. The gate stops the number growing; it
  does not shrink it.
- The baseline has no owner or expiry per entry. A file can sit in it forever.
- The walk is static: a component mounted only through a runtime string-keyed
  registry, or a dynamic import built from a variable, reads as unreachable and
  would need a baseline entry that is really a false positive. One such case was
  found and fixed while lifting the walk — a bare side-effect import — so more may
  exist among the 398.
- Reachable is not rendered: a component imported behind a permanently false
  condition still counts as reachable.
- `src/lib`, `src/app` and `src/hooks` are not watched. Dead code there is still
  unreported.
