# 2026-10-06-moves-gate-reads-built-tower-metric-plan — A phase gate reads the document the Move actually built

## Release ID

`2026-10-06-moves-gate-reads-built-tower-metric-plan`

## Status

`candidate`

## Plain-English Summary

The Moves P4 exit gate asks, among other things, whether a monitoring metric plan has been
drafted. The product builds exactly that document at P4: it is a declared gate artifact, it is in
the canonical P4 build set on every solution route, and the acceptance route files it under a
specific type key when a user accepts it.

The gate was looking for a different spelling of that key — one that nothing in the product has
ever written. So a user could capture the phase, run the build, accept and sign off the monitoring
metric plan, and the criterion asking for it would still read as unmet. Because the criterion is
soft and keeps a free-text fallback, this did not block the Move. It did something worse for
anyone reading the gate: the criterion showed as satisfied whenever the word "tower" or
"monitoring" appeared anywhere in the phase's captured text, and was never satisfied by the signed
document that exists to settle it. A ✓ meant vocabulary, not evidence.

This change teaches the gate the key the product actually writes, so the built and signed document
settles the criterion. It also adds a guard for the whole class: every deliverable type the
registry declares a formal gate artifact, and that the build path actually produces, must be named
somewhere in the gate evaluator. One type is excused with a written reason (see Known Gaps), and
the guard fails if that excuse ever goes stale.

No gate got stricter and no new refusal was introduced. A criterion that could previously be
satisfied by prose alone can still be satisfied by prose alone; it can now also be satisfied by the
document.

## Layer Impact

Release lane: `global-control-lane` — shared gate-evaluation behavior for all clients, not
feature-gated and not client-scoped.

- **Layer 4 (Products — Moves):** phase-gate criterion evaluation only. The set of criteria, their
  severities, and the hard/soft bar are unchanged; one criterion's accepted deliverable-type list
  gains the canonical key for the document that criterion is about.
- Layers 1–3 unchanged. No intake, adapter, canonical-model, schema, migration, or data-plane
  change. No tenant data is read or written differently.

## Client Applicability

- All clients: yes — this is shared gate-evaluation behavior, not flag-gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is additive to one lookup list, so there is nothing to enroll.

## Changes Included

- `src/lib/programs/governance.ts` — the `tower_metric_plan_drafted` criterion's deliverable lookup
  now includes the canonical registry key for the document it asks about. The pre-existing legacy
  spellings are retained, so the change is strictly additive.
- `src/lib/programs/__tests__/gate-artifact-visibility.test.ts` (new) — the class guard: every
  declared gate artifact the build path produces must be named in the gate evaluator; excused keys
  must stay genuinely unread and genuinely still be built gate artifacts.
- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts` — two behavioural cases through the
  real evaluator: the criterion is satisfied by the built document with no matching wording
  captured anywhere, and is reported unmet when neither the document nor the wording exists.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — defect reproduced before the fix. The behavioural case was written first and failed
  against the unmodified evaluator: with the signed built document present and no matching wording
  anywhere, the criterion was still reported as unmet.
- **PASS** — `npx jest --runTestsByPath src/lib/programs/__tests__/gate-artifact-visibility.test.ts
  src/lib/programs/__tests__/governance-evaluate-gates.test.ts
  src/lib/programs/__tests__/phase-gate-deliverable-reachability.test.ts` — 3 suites, 51 tests
  passing. The third suite is the pre-existing companion guard (hard, deliverable-only criteria);
  it is run here to show the two guards do not contradict each other.
- **PASS** — mutation testing, 8 mutations, 7 killed:
  - dropping the canonical key from the lookup — killed (2 tests)
  - the document type stops being a declared gate artifact — killed
  - the build path stops producing the document — killed
  - the criterion's severity changes — killed
  - removing a key from the guard's literal expected set — killed
  - removing the written excuse for the excused key — killed (2 tests)
  - the evaluator starts reading the excused key — killed
  - **1 diagnosed false survivor:** dropping the older singular spelling from the lookup changes no
    behavior, because nothing in the product can write that key — it is in no registry entry, in no
    canonical phase set, and the acceptance route resolves type keys only through the registry. It
    is retained in case historical rows carry it. A mutation that removes an unwritable key is not
    a coverage gap.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, exit 0.
- **PASS** — `npx eslint` on all three changed/added source files, exit 0.
- **PASS** — new suite proven CI-wired by census delta, not by name: `coveredTestFiles` rose by
  exactly the same amount as `testFiles` when the file was added, with the uncovered set unchanged.
- **NOT RUN** — live signed-in walk. This change has no deployment of its own and no UI surface of
  its own; it is covered by the next release that deploys.

## Rollout Plan

Squash merge to `main`. No migration, no flag, no environment variable, no worker job, no image or
traffic change. The behavior becomes active with the next ordinary deploy of `main`; it does not
require one of its own.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — unchanged by this release.
- Shared runtime mutators: none. This release runs no Azure command and mutates no shared runtime,
  revision weight, traffic split, or Container App template.
- Approved image digest: not applicable — no runtime update is part of this release.
- ACA runtime invariant: unaffected; no image, env var, flag, scale, or secret change.
- Worker image invariant: unaffected; no worker job changed.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof required: not for this release on its own. It carries no deploy and no new
  surface. The criterion's new basis is worth observing on the next signed-in walk that reaches the
  P4 gate panel, and is listed under Known Gaps for that reason.

## Rollback Plan

Revert the single merge commit. The code change is one additive entry in one lookup list, so
reverting restores the previous evaluation exactly: the criterion returns to being satisfiable only
by the older spellings or by the free-text fallback. There is no migration, no written state, no
backfill, and nothing to undo outside the repository. No stored gate decision is rewritten by this
change in either direction — the evaluator is read-only over existing rows.

## Audit Evidence

- PR URL and its CI run on this branch.
- The three suites named under QA, runnable from a clean checkout.
- The mutation table above is reproducible: each row is a single-anchor edit to a named file,
  reverted after the run.
- `docs/architecture/test-ci-coverage-census.json` diff, showing the new suite in the covered set.

## Known Gaps

- **One declared gate artifact is deliberately left unread, with the reason recorded in the guard.**
  A P3 sourcing document is a declared gate artifact that the build path produces, but the nearest
  criterion is scoped "if applicable" and passes when no vendor record exists. Teaching that
  criterion to read the sourcing document would turn a built-but-unsigned document into a new gate
  refusal. That is a decision about where the P4 bar should sit, not a drift to repair silently, so
  it is excused in the guard with a written argument. The guard fails if someone wires it up and
  leaves the stale argument standing. **Owner: product.**
- **The incoming census was stale by two files.** Two suites merged recently without a census
  refresh. This branch's regeneration therefore moves the counts by three: two inherited, one from
  this change. The inherited two were isolated and measured separately rather than absorbed
  silently.
- **Two further criterion/key mismatches were found and are deliberately not changed here.** One P5
  criterion resolves against three type keys that no registry entry declares, and one P0 artifact
  type is absent from the registry entirely, which means a *generated* P0 brief would not be seen
  as signed off by the evaluator even when it is. Neither blocks the current path: the P5 criterion
  is soft, and the P0 brief is produced today by a path that writes no generated marker. Both are
  reported rather than fixed because each would change what a gate accepts, and this release is
  scoped to a criterion that could not see its own document.
- **The declared per-archetype gate requirements remain inert.** Each archetype phase declares gate
  requirement keys that nothing in the product reads. Wiring them would add hard gates, so it stays
  a product decision. Unchanged by this release.
