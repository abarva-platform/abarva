# 2026-09-21-assert-the-estate-resolution-branch — thirteen visits, zero assertions

## Release ID

`2026-09-21-assert-the-estate-resolution-branch`

## Status

`candidate`

## Plain-English Summary

The archetype resolver's estate-resolution branch decides two things: whether a
requirement was resolved against the client's estate at all, and what severity
the estate gives it. Three wired suites reach that branch thirteen times and
asserted nothing about either result.

Measured before writing anything, against the three suites the workflow
actually runs:

| Mutation | Before | After |
|---|---|---|
| `estateResolved` forced to `false` | **41/41 passed — escaped** | **3 cases fail** |
| `severity = pred.severityFor(profile)` deleted | **41/41 passed — escaped** | **1 case fails** |

No production file changed. `resolver.ts` is byte-identical to `origin/main`;
the mutations above were applied, measured, and reverted.

## Why the fixture is the finding

A severity fixture only catches the second mutation when the declared and
estate-resolved severities **disagree**. `eng_performance_dora` is declared
`hard` in AI-PDLC's charter phase, and the estate predicate returns `soft` for
a known estate that is neither scrum nor continuous. Deleting the escalation
leaves it `hard`, and the case fails.

A fixture built on an estate where both rules said `hard` would have passed
whether or not the escalation ran — which is how this branch came to be visited
thirteen times without being tested.

The second case pins the opposite estate (`continuous` → `hard`) so the
softening is attributable to the estate rather than to a resolver that always
returns `soft`. The third asserts that a requirement with no estate predicate
comes back **not** estate-resolved, so the flag cannot quietly become
blanket-true.

## What this does NOT do

**It does not resolve T-456.** That item's substance is an authored-content
decision: `ANALYTICS_CAPABILITY_REPATRIATION` declares two `analysisMethods`
that `ANALYSIS_METHODS` does not define, and the choice is to author the two
methods or withdraw them from the archetype. Those are not equivalent —
authoring adds guidance an operator will be shown; withdrawing removes a
capability the archetype currently claims. It needs an owner, and the item says
so. It is untouched here.

This change is the follow-on T-456 itself marks separable: *"Adding those
assertions is a bounded follow-on to this item, not a precondition for it."*

The quarantined `resolver.test.ts` stays quarantined and stays red, and
`archetypes/__tests__` stays partially covered. Nothing here makes that suite
green, and nothing here relaxes its assertion.

## Layer Impact

- `global-control-lane`. One test file. No product surface, tenant data,
  schema, projection, migration, flag, code path, or runtime behaviour.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/lib/programs/archetypes/__tests__/ai-pdlc.test.ts` — three cases.

## QA / Validation

Measured on base `978f6633f`.

| What | Result |
|---|---|
| The three wired suites | 41 → **44 passed**, 0 failed |
| Mutation: `estateResolved` false | escaped before, **3 fail** now |
| Mutation: escalation deleted | escaped before, **1 fails** now |
| `resolver.ts` vs `origin/main` | **byte-identical** |
| `tsc` (exit code) | 0 |
| `eslint` | clean |
| `release-check` | passed |

## Rollout Plan

Merge to `main`. The three suites are already in the `Run the green Program
archetype suites` step, so the new cases run on the next pull request. No image
build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. The estate-resolution branch returns to being reached thirteen
times and asserted zero times.

## Audit Evidence

- The four mutation runs, before and after, against the exact three suites the
  workflow runs.
- `git diff` showing `resolver.ts` unchanged.

## Known Gaps

- **T-456's decision is still open** and is the larger half of that item.
- **`resolver.test.ts` is still quarantined and still red**, so
  `archetypes/__tests__` remains partially covered. The `DARK_DIRECTORY_COUNT`
  does not move.
- **Only the two named mutations were closed.** The branch has other
  behaviour — the pruning `continue` when `appliesWhen` is false — and this
  change does not claim to have measured escapes there.
