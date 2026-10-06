# 2026-09-20-make-a-silent-suite-fail-honestly — a stale mock hiding a real regression

## Release ID

`2026-09-20-make-a-silent-suite-fail-honestly`

## Status

`candidate`

## Plain-English Summary

`tower-grounding-client-name.test.ts` mocked a module that no longer exists.
Jest could not resolve the mock target, so the suite failed to **collect** and
ran **zero assertions**.

The dead mock is removed. The suite now collects and **runs two tests, both of
which fail** — and that is the intended outcome, not a regression introduced
here. Nothing that was passing has stopped passing; two assertions that were
invisible are now visible.

**This change deliberately leaves a red suite red.** The directory is not
reached by any workflow, so nothing in CI changes state.

## What making it run revealed

| case | verdict |
|---|---|
| "canonicalizes legacy demo client labels before Tower prompts use them" | expects the generic demo label, gets the tenant display name — **a behaviour that has stopped** |
| "passes active-client tenant candidates into the V7 Tower projection" | asserts a call into the removed module — **obsolete, can never pass** |

The first is the reason this was worth doing. A test asserting that client
labels are canonicalised before Tower prompts consume them is failing, which
means that canonicalisation is not happening on this path. It has been failing
invisibly for as long as the mock has been stale.

**Stated precisely, because the neighbouring rule is a confidentiality one: no
real client name is involved.** Both labels are synthetic fixtures from the
input registry, and neither is named here. What is broken is the
canonicalisation step, not the boundary it exists to serve. Whether the expected
label is still the right one is a decision for whoever owns Tower grounding;
this change only makes the question visible.

The gate caught an earlier draft of this record for naming one of those
fixtures in prose, which is the rule working exactly as intended on a public
repository — the mechanism is what belongs here, not the labels.

The second case can never pass again — its subject was deleted. It is left in
place rather than removed, because deleting an assertion is the owner's call and
a permanently-red case that says why is more useful than a quietly missing one.

## The premise this item started with was wrong

This was filed as "disposition for two genuinely dead suites", the expectation
being deletion. Checking first is what changed the answer:

- the subject `src/lib/atlas/tower-grounding.ts` **exists and is live**;
- only the **mock target** was gone;
- nothing anywhere in the repository imports that module, so the mock was dead
  weight rather than a hint that the subject had moved.

So this is a third distinct shape, after the two the sweep already produced: not
a deleted subject, and not a renamed one, but a **stale mock of a removed
dependency** — and the suite it silenced was testing live code the whole time.

## Layer Impact

- `global-control-lane`. One test file, one deleted `jest.mock` block. No
  product surface, tenant data, schema, projection, migration, flag, code path,
  or runtime behaviour. **No assertion was weakened, skipped or deleted.**

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — test repair
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/lib/atlas/__tests__/tower-grounding-client-name.test.ts` — the
  unresolvable `jest.mock` removed.

## QA / Validation

Measured on base `92058d0e0`.

| | before | after |
|---|---|---|
| suite collects | **no** | yes |
| **tests executed** | **0** | **2** |
| tests passing | 0 | 0 |
| tests failing | 0 | **2, honestly** |

| Other checks | Result |
|---|---|
| Nothing imports the mocked module | verified repo-wide |
| The subject module exists | verified |
| `src/lib/atlas/__tests__` reached by a workflow | **no** — so CI state is unchanged |
| The labels involved are synthetic fixtures, not real clients | verified against the tenant input registry |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

The criterion is the **test count**, not the suite status: before and after both
read as a failing suite, and only the count shows that two assertions began
executing.

## Rollout Plan

Merge to `main`. No workflow runs this directory, so no check changes colour.
The suite now reports what is wrong instead of failing to start. No image build,
migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting returns the suite
to running zero tests.

## Audit Evidence

- The before/after test counts.
- The repo-wide search showing nothing imports the mocked module.
- The census row showing the directory is uncovered.

## Known Gaps

- **The canonicalisation failure is reported, not fixed.** It is in Tower
  grounding, it needs an owner's decision about which label is correct, and
  guessing would be worse than leaving it visible.
- **One assertion can never pass.** Its subject is gone; removing it is the
  owner's call.
- **This directory still is not in CI**, so nothing prevents the next
  regression on this path from being equally invisible. Wiring it is blocked on
  the two failures above, which is the honest order of operations.
- **The third dead-suite candidate is untouched** —
  `intelligence-int2-pattern-action-canvas.test.ts` reads a component that no
  search has found under any name.
