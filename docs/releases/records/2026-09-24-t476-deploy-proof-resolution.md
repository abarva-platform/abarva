# 2026-09-24-t476-deploy-proof-resolution — Deploy-proof resolver for the execution register

## Release ID

`2026-09-24-t476-deploy-proof-resolution`

## Status

`candidate`

## Plain-English Summary

The execution register records, per item, whether the change it describes actually reached the
running product. Eighteen merged items had been sitting for three to four days on a line that says
the deploy proof is still pending. Checking the first one showed the line was wrong in the
direction nobody watches for: the deploy had already succeeded against that item's exact merge
commit *before* the line claiming it was in flight was written.

A register that says `pending` when the proof exists is a false state, exactly as much as one that
says `deployed` when it does not. It is the quieter direction, because it hides finished work
rather than inflating it, so nothing downstream ever trips over it. The generated queue reads these
lines, which makes every false `pending` an item the queue can neither offer nor retire.

This adds a repo-owned control that answers the question from evidence instead of from memory:
given a merge commit, which deploy run shipped it, and did the runtime invariant hold when it did.

**The one thing it exists to get right:** a deploy run is keyed to a commit by *ancestry*, never by
*ordering*. The deploy workflow runs under a concurrency group, so a merge's own run is frequently
cancelled by the next push and the deploy that actually carried that commit is a later run on a
descendant commit. Two opposite mistakes follow from ignoring that — treating `cancelled` as
failure records a false finding against a commit that is live, and reaching for "the next
successful run" by timestamp credits whichever branch merged next, which between two concurrently
merging branches is routinely *not* a descendant. The second is the worse direction: it writes a
false `deployed`. Both are resolved by asking git, in one direction only.

## Layer Impact

Release lane: `internal-admin`.

- **Platform tooling / release governance.** One new script and its behavioural suite under
  `scripts/exec/`, plus one step in the existing execution-queue toolchain workflow.
- **No product layer is touched.** No byte under `src/`, no migration, no data-plane change, no
  route, no schema, no tenant data. The control reads GitHub run records and the proof bundles the
  deploy workflow already uploads; it mutates nothing.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — release-governance tooling for the execution register
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/deploy-proof-resolver.mjs` — resolves a merge commit to one of `deployed`,
  `superseded` or `not_deployed`, and re-derives the runtime invariant from a deploy run's own
  uploaded proof bundle.
- `scripts/exec/deploy-proof-resolver.test.mjs` — 44 behavioural cases.
- `.github/workflows/execution-queue-toolchain.yml` — one step, beside its eleven siblings, on a
  workflow already filtered to `scripts/exec/**`.

## QA / Validation

**Failing test first.** The suite was written and run before the module existed; it failed to
resolve the import. The module was then written against it.

**Ten mutations, ten caught.** Each mutation was confirmed to apply at exactly one site, so a
mutation that changed nothing cannot be mistaken for a caught one. Baseline 44 passed, 0 failed.

| # | mutation | result |
|---|---|---|
| 1 | ancestry oracle called with its two arguments inverted | 8 failed |
| 2 | ancestry filter removed — candidates chosen by ordering alone | 5 failed |
| 3 | latest descendant chosen instead of the earliest | 1 failed |
| 4 | an in-flight run counted as a success | 3 failed |
| 5 | the merge-time floor removed | 1 failed |
| 6 | the invariant read off the bundle's own `passed` flag | 7 failed |
| 7 | template-image vs active-image comparison dropped | 3 failed |
| 8 | 100%-traffic-weight check dropped | 2 failed |
| 9 | worker-job digest check dropped | 1 failed |
| 10 | health check dropped | 1 failed |

**Baseline over the same scope, both sides.** Every suite in `scripts/exec/` at `origin/main`
`bc3535a23` and with this change: **11 suites, 905 passed, 0 failed, 4 skipped** before;
**12 suites, 946 passed, 0 failed, 4 skipped** after. Every sibling suite's number is unchanged;
the difference is this suite's 44 less the 3 cases that replaced a checkout-dependent one.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, no
diagnostics. `npx eslint` on both new files — exit 0.

**The CI step is load-bearing, not a grep.** The workflow file was parsed as YAML and the job's
step list asserted to contain the command; the workflow's existing `paths:` filter already covers
`scripts/exec/**`, so the corpus this control reads is the corpus that triggers it.

**The suite is synthetic, including its git graph.** Every run record and every commit is built
inside the test. The git-ancestry case builds a two-branch repository in a temp directory rather
than reading this checkout's own `HEAD~1`, because `actions/checkout` is shallow by default and a
case reading it would pass locally and be unreachable where it is gated. That case asserts the
distinction the whole control rests on: a *later* commit on a sibling branch is not a descendant.

**Calibrated in both directions against the real corpus, and the extras are zero.** Counted from
the corpus rather than by hand, after a first hand count of this figure came out one low:

- *Known positives.* Of the eighteen, **eight** carry a digest in their existing record and **all
  eight match this resolution exactly**; ten carry none. The two items previously resolved "by
  descendant containment" name the same carrier runs this resolver picks independently. **Zero
  disagreements.**
- *Known negative.* Handed a commit that genuinely has no deploy — this branch's own head, which
  the deploy workflow never runs against — the resolver returns `not_deployed` and exits 1. A
  detector that only ever agrees is not evidence.
- *The live path, not only the fixture path.* The reproduction command was run with no `--runs`
  file, fetching run records from GitHub directly, and returned the same verdict and digest.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow runs on merge as it does for any change; this
release adds no runtime surface, so the deploy carries it incidentally rather than delivering it.
The control is a command an agent runs; nothing schedules it.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. This release contains no `az` command, no image build, no traffic
  change and no environment or flag update.
- Approved image digest: not applicable — no runtime image is selected or pinned here.
- ACA runtime invariant: to be proven against this release's own merge SHA after the deploy run
  completes, in the same form the runbook defines.
- Worker image invariant: unchanged; no worker job template is touched.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** This is release-governance tooling with no product
  surface, so a signed-in lane would be a proof with no subject.

## Rollback Plan

Revert the PR. The script is additive and imported by nothing; removing it returns the toolchain
workflow to eleven steps. No migration, no data, no runtime state to unwind.

## Audit Evidence

- The PR, its checks, and its merge SHA.
- The eighteen resolutions, each naming a GitHub run id, the run's `createdAt`, the head commit it
  ran against, the image digest, the revision, and the runtime-invariant verdict — reproducible by
  one command from the run records and the runs' own uploaded proof bundles.
- The register correction appended for each item, which cites GitHub's own `mergedAt` rather than
  the correcting run's clock.

## Known Gaps

- **The item's stated population is wrong in the detail, and the correction is recorded rather than
  quietly absorbed.** The item says the remaining fifteen "each stop at `merged` with no deploy
  verdict either way". Eleven of the eighteen already carried a deploy verdict written by an
  earlier run. The genuinely unresolved population was **seven**. The defect the item describes is
  real; its count was not.
- The resolver reads a deploy run's uploaded proof bundle. A run old enough for its artifacts to
  have expired cannot be resolved this way, and the control says so rather than falling back to
  present-day Azure state — today's runtime is evidence about today's commit, not about a commit
  from three days ago.
- `unresolved` is deliberately not one of the item's three outcomes. It is the refusal to give one
  while a run is still in flight, and it fails closed.
