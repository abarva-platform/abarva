# u618 — The typecheck heap floor matches the step that runs the same compiler

## Release ID

`2026-10-08-typecheck-heap-floor-8192`

## Status

`candidate`

## Plain-English Summary

The required `Production readiness gate` runs the repository's typecheck through
a wrapper that exists for one reason: an out-of-memory abort and a clean run look
identical when the output is filtered for `error TS`, because the abort prints no
diagnostic at all. The wrapper classifies the crash honestly and fails, which is
correct.

It also sets the heap the compiler gets, and that number was **6144 MB** while
the hygiene gate — which runs the same compiler over the same type graph on the
same runner — has run at **8192** since an earlier release raised it for exactly
this reason. The lower number was an asymmetry, not a decision.

The type graph has now reached that ceiling. The compiler aborted with
`Ineffective mark-compacts near heap limit` at a peak of about **6.13 GB against
6144** on two independent branches within seven minutes, both on the first base
that included a large new module set. A re-run of one of them passed. That is
not a reason to wait: a step whose peak sits within one percent of its ceiling
passes or fails on garbage-collection timing, which is precisely the state the
earlier release documented before raising the other step. And because the gate
judges the typecheck by exit status, there is nothing here to relax — the only
lever is the budget.

This raises the wrapper's floor to 8192 and adds a case holding it at or above
the hygiene gate's own typecheck heap, read from that script, so the two
declarations cannot drift apart again.

## Layer Impact

Lane: `global-control-lane` — shared CI behaviour for all clients, not
feature-gated.

No product layer changes. Layers 1 to 4 are untouched: this is a build-tooling
limit and a test over it. No route, component, schema, migration, read model,
gate criterion or deliverable is modified, and **no runtime image or workload
changes** — the floor applies to the TypeScript compiler in CI and in a
developer's shell, not to anything that serves a request.

## Client Applicability

- All clients: no client-visible change.
- Specific clients: none.
- Internal only: yes — CI and local tooling.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/quality/typecheck.mjs` — `HEAP_FLOOR_MB` 6144 → 8192. It remains a
  **floor**: a caller who sets a higher value keeps it, and their other
  `NODE_OPTIONS` flags survive, both of which are already pinned by existing
  cases. The comment records the measurement, the asymmetry with the sibling
  step, and that a ceiling is not a cure.
- `src/__tests__/behaviors/typecheck-command.test.ts` — the literal case moves
  to 8192, and one new case asserts the floor is at or above the heap the
  hygiene gate's typecheck step declares, reading both numbers from their own
  declarations and asserting each was found before comparing them.

No workflow file changes, no census change, no new test file.

## QA / Validation

- **PASS** — `npx jest --runTestsByPath` on the typecheck suite → **15 of 15**
  (13 pre-existing).
- **PASS** — `npx jest --runTestsByPath` on the typecheck and hygiene-gate
  suites together → **46 of 46**. The hygiene gate's own
  typecheck-at-least-the-build case is in that set and is unaffected.
- **PASS** — `npm run test:behaviors` → **208 suites, 2,163 tests.**
- **PASS** — mutation testing, **three mutations, three killed or behaving as
  designed.**
  1. The floor reverted to 6144 → **2 cases fail**, the literal and the
     relationship. This is the regression itself.
  2. The floor set to 7000, a value between the old number and the sibling's →
     **2 cases fail**. This is the one that matters: a value that merely
     _raises_ the number is not enough, so the literal is not carrying the
     claim alone.
  3. The sibling step lowered to 4096 **and** the floor returned to 6144 →
     **exactly 1 case fails**, the literal. The relationship case passes,
     because 6144 is indeed at or above 4096. That is the proof it reads the
     sibling rather than a hidden constant, and therefore that it is not
     vacuous.
     Both mutated files were restored from a pre-mutation backup and **verified
     byte-identical by diff**, then the suites were re-run green.
- **PASS** — `npx eslint` on the changed test, exit 0.
- **PASS** — Prettier established **per file, in place.** Both changed files
  warn at the base as well. Every hunk the formatter would change in either file
  sits **outside** this change's added lines, established by reading the hunk
  line numbers against the added ranges. An earlier `--write` on these two files
  pulled roughly twenty pre-existing reformats into the diff; that was reverted
  and the intended edits re-applied, so the diff is five hunks and all five are
  this change's.
- **NOT RUN** — the raise is not proven to clear the crash on CI, because the
  only proof is a green run of the required gate on this branch. That run is the
  acceptance criterion for this PR rather than something this record can claim
  in advance.
- **NOT RUN** — no signed-in walk, and none is applicable: nothing here is
  observable in the product.

## Rollout Plan

Merge to `main` via squash. The floor applies to the next run of the required
gate and to any local `npm run typecheck`. No deploy, no migration, no flag, and
nothing to sequence.

Two pull requests currently in flight were red on this exact signature. Neither
can pick the fix up by re-running, because a re-run replays the original commit;
both need `main` merged forward after this lands.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No Azure command runs and no shared runtime,
  traffic weight, revision or Container App template is touched.
- Approved image digest: not applicable — no runtime image is selected, pinned
  or changed.
- ACA runtime invariant: unaffected. The change is a compiler flag in CI.
- Worker image invariant: unaffected.
- Feature/env flag update path: not applicable. `NODE_OPTIONS` here is composed
  per-process by the typecheck wrapper; no environment variable is set on any
  Container App or workflow.
- Live signed-in proof required: no — nothing in this release is observable in
  the product.

## Rollback Plan

Revert the squash commit. The floor returns to 6144 and the two cases return to
asserting it. The failure mode that revert restores is a marginal step, not a
broken one, so the revert is safe and immediate.

## Audit Evidence

- The two failed gate runs that establish the measurement, their peak-heap lines
  and the wrapper's own `typecheck: CRASHED` verdict.
- The hygiene gate script's typecheck heap assignment, which is the number this
  floor is now held against.
- The three mutation results above, in particular the third, which is the
  evidence the new case is not vacuous.

## Known Gaps

1. **This is a ceiling, not a cure.** Reducing the compiler's peak is still the
   durable fix and is still owed; the type graph will approach 8192 in time.
   This release buys headroom and makes the next approach visible as a failure
   of the same shape rather than as a mystery.
2. **The build step beside the hygiene gate's typecheck is also at 8192**, so
   raising this floor further in future means raising a set of three numbers
   that are only pairwise pinned. A single declaration for the repository's
   compiler heap would remove that, and is not attempted here.
3. **Nothing measures the peak.** The evidence is the crash trace's own
   reported heap figures from two runs. A recorded peak per run would turn the
   next approach into a trend rather than an incident, and no such measurement
   exists.
