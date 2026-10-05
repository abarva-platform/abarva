# 2026-10-05-queue-precondition-annotation — Mark a claimable queue row that names a file the checkout does not have

## Release ID

`2026-10-05-queue-precondition-annotation`

## Status

`candidate`

## Plain-English Summary

The execution queue decides which backlog rows an agent may take. It makes that
decision from the backlog's text and from the claim register, and neither of
those can see the source tree — so a row that describes a file as *already
existing* is offered as ordinary work even when that file is not in the
repository at all. Whoever takes the row discovers that by hand, writes it down
in prose the generator does not read, and the row is offered again, unchanged,
to the next agent.

That happened on two consecutive runs against the same row, and this change was
written on the third — which paid the same cost before reading the note the
second run had left.

The queue now measures it. For every claimable row it extracts the repository
paths the row names, checks each against the tree, and when one is missing it
writes a `⚠ PRECONDITION` marker into that row naming the path, plus a caution
above the lane tables counting the affected rows.

**It annotates and never filters, and that is a design choice rather than a
half-finished job.** The paths come out of prose, and prose names things to
*create* as well as things to *use*: an acceptance that says "add a manifest
under `docs/governance/dataset-manifests/<id>.json`" names a path that is
supposed to be absent. Suppressing such a row would hide real work, which is
worse than the defect being fixed. An annotation costs a reader one sentence
and can hide nothing — so claimability, every bucket and every count in the
queue are byte-for-byte what they were.

## Layer Impact

Release lane: **`internal-admin`** — AbarVa-only operator/agent tooling. It is
not `global-control-lane`, because nothing shared by the app or the control
plane changes; not `client-data-lane`, because no schema, RLS, seed, ingestion
or retrieval path is touched; not `public-demo`, because no public route or
investor-facing artifact is involved; and not `experimental`, because it is not
flag-gated.

- **Platform tooling only.** `scripts/exec/` is the execution-queue toolchain:
  it reads operator documents and writes the queue agents take work from. No
  product surface, no tenant data, no canonical model, no runtime code path.
- Layers 1–4 of the information architecture are untouched. Nothing in this
  change reads a tenant input, an adapter, a canonical object or a product
  projection.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — operator/agent tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/claimable-preconditions.mjs` — new module. Extracts
  repo-root-anchored paths from a row's prose, walks up to the repository root,
  reports which named paths are absent, and formats the marker.
- `scripts/exec/claimable-preconditions.test.mjs` — new behavioural suite, 21
  cases. Picked up automatically by the required `scripts/exec/*.test.mjs` sweep
  in `.github/workflows/hygiene-gate.yml`; no workflow change was needed, and
  `src/__tests__/behaviors/exec-toolchain-requiredness.test.ts` is the contract
  that holds that sweep in place.
- `scripts/exec/build-execution-queue.mjs` — resolves the repository root once,
  runs the scan over the claimable rows, renders the per-row marker and a
  "caution, not a filter" block beside the existing held-path caution, and
  reports the count on the console line.
- `scripts/exec/build-execution-queue.test.mjs` — 8 new cases driving the real
  generator over fixtures.

No migration, no route, no workflow file, no dependency.

## QA / Validation

**Calibrated before it was written**, because the row that exposed this defect
says "measure before gating" and the same hazard applies to the measurement:

- Over the real corpus of **760** backlog items: **612** root-anchored paths are
  named and **11** rows name at least one absent path.
- Over the **7** rows claimable at the time: exactly **1** fires, and it is the
  true positive. **0 false positives on the claimable set.**
- Two rules earned their place by measurement, each recorded in the module
  beside the false positive it refuses:
  - **Extension alternation must be longest-first.** JavaScript alternation is
    first-match. A draft ordered `ts|tsx|json|js` matched `HomeSurface.tsx` as
    `HomeSurface.ts` and `source-stage-map.json` as `source-stage-map.js`, then
    reported both ABSENT — the tool manufacturing two defects out of two files
    that are present.
  - **The roots are an allowlist, not the directory listing.** This repository
    has a top-level `intelligence/`, and rows write relative fragments like
    `intelligence/query/route.ts` meaning `src/app/api/...`. Deriving roots from
    the listing fires on **30** rows; the allowlist fires on **11**, and the 19
    it drops are all fragments.

**Red first.** The new suite was written before the module and failed to load
(`ERR_MODULE_NOT_FOUND`). The generator cases were added before the generator
was wired.

**Baseline over the same scope, clean checkout of the same base** (`3ee3df21e8`,
a separate detached worktree): **16 suites, 0 failing before → 17 suites, 0
failing after**. New totals: `claimable-preconditions` 21/0,
`build-execution-queue` 214/0 → **222/0**.

**Necessity proved by mutation — 5 mutations, 5 caught.** Numbers in
*Audit Evidence* below.

**One assertion of my own was wrong and is recorded rather than quietly
fixed.** The no-repo-root case first asserted `!rendered.includes("⚠
PRECONDITION")` over the whole document, and it failed while the rows were
correctly unmarked: the "scan did not run" caution *names* the marker, in order
to tell the reader that its absence below is unmeasured rather than clean. A
container-wide absence assertion was met by a sibling. All five cases now assert
per lane row.

`node scripts/release-check.mjs --base origin/main --head HEAD` — result in
*Audit Evidence*.

No typecheck applies: every file changed is `.mjs`, and no `.ts` file is touched.

## Rollout Plan

Merge to `main`. **No runtime rollout.** Nothing in `scripts/exec/` is built
into an image, served by a route, or read by a Container App; the toolchain runs
on an operator host and in CI. There is no ACA deploy to prove and no signed-in
acceptance to owe, because no product surface changed.

## Deployment Authority

Not applicable — this release cannot affect Azure Container Apps, deploy
workflows, runtime images, flags, environment variables, worker jobs, traffic,
DNS or environment promotion.

- Repo-owned deploy workflow: not involved
- Shared runtime mutators: none
- Approved image digest: n/a — no image changes
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: none
- Live signed-in proof required: **no** — no product surface changed

## Rollback Plan

Revert the commit. The change is additive and self-contained: one new module,
one new suite, and four edits inside the generator (an import, a root lookup, a
marker appended to the row template, and one rendered block). Reverting restores
the previous queue text exactly, because no count, bucket or ordering was
touched. No data or state is written anywhere, so a revert needs no cleanup.

## Audit Evidence

- PR: see the pull request this record ships in.
- Suite sweep on the branch, all 17 green; baseline sweep on `3ee3df21e8`, 16
  green. Both commands and outputs are in the PR body.
- Mutation table (each mutation applied to the branch, the suites re-run, then
  reverted): in the PR body, with the named case that failed for each.
- The live corpus run: regenerating the board and queue over a **copy** of the
  operator root prints `7 claimable (6 partly gated, 1 naming an absent path)`
  and marks exactly one row — the counts otherwise identical to the run before
  the change.

## Known Gaps

- **The partly-gated table is not annotated.** The marker is rendered by the
  lane-table row template, so the six rows in *Partly gated — claimable, with a
  half you must not take* are rendered by a different path and carry no marker.
  None of them names an absent path today; it is still a gap, and extending it
  is a one-line change nobody should make without re-running the calibration.
- **The scan cannot say *why* a path is absent.** It reports the measured fact.
  Whether the file is arriving in an open pull request, was retired, or is a
  deliverable the row asks you to create is a judgement the reader makes — this
  generator deliberately does not read GitHub, following the same split as
  `fossil-claims.mjs`.
- **No new backlog id was filed for this work.** The queue's own count reports
  the `C-500`–`C-599`, `T-500`–`T-599` and `T-400`–`T-499` bands as **exhausted**,
  so there is no free number for it under the id-band rule. That is a range
  decision for the owner, and it is open.
