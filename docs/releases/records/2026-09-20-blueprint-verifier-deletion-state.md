# 2026-09-20-blueprint-verifier-deletion-state — Blueprint verifier tells a deletion from a pending merge

## Release ID

`2026-09-20-blueprint-verifier-deletion-state`

## Status

`candidate`

## Plain-English Summary

A QA verifier checks whether a list of blueprint components exist on disk. It had two
answers: found, or "not yet present … Deferred pending <slice> merge".

That second answer is a promise — it says the component is on its way. For a component
that was removed on purpose it is the opposite of true, and the report repeated that
promise twice: once from the check that asks whether the file exists, and again from the
check that reads the same file for a required caveat string. The summary line then said it
a third time, in prose: "All deferred checks will resolve to pass after integration."

This adds a fourth status, `retired`, and a small registry recording which paths are absent
because something removed them and what the evidence is. Absent-and-recorded now reports
`retired` and names the item that did the removing; absent-and-unexplained still reports
`deferred`, exactly as before. The summary line no longer promises that every absent
component is coming.

The mechanism generalises past the one instance: all six presence checks and both content
checks now resolve the absent case through one lookup, so a future retirement of any of
them cannot reintroduce the same wrong sentence from a seam nobody edited.

## Layer Impact

- `global-control-lane`. Internal QA reporting only. No product surface, no tenant data, no
  read model, no projection, no schema. The module is a deterministic filesystem inspection
  with no clock, no network, and no model calls, and that property is asserted.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — internal QA verification report
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/qa/intelligence-tower-blueprint-verification.ts`
  - `VerificationStatus` gains `retired`; the report gains `retiredCount`.
  - `KNOWN_RETIREMENTS` records, per path, which item retired it and the evidence.
  - `retirementFor(rel)` is the single exported lookup both absent-case paths call.
  - `checkPathPresence` and `checkFileContains` replace eight near-identical bodies.
  - The report caveat no longer states that every deferred check resolves to pass.
- `src/__tests__/behaviors/blueprint-verifier-knows-deletion-from-pending.test.ts` — new,
  9 cases.
- `src/__tests__/integration/qa/intelligence-tower-blueprint-verification.test.ts` — the
  status list is now exhaustive by construction rather than hand-typed, count
  reconciliation includes the new count, and a reconciliation case was added for it.

## QA / Validation

| What | Command | Result |
|---|---|---|
| New behaviour suite | `npx jest --runTestsByPath src/__tests__/behaviors/blueprint-verifier-knows-deletion-from-pending.test.ts` | 9 passed |
| Existing verifier suite | `npx jest --runTestsByPath src/__tests__/integration/qa/intelligence-tower-blueprint-verification.test.ts` | 26 passed, 1 pre-existing failure unchanged (see Known Gaps) |
| Typecheck | `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` | exit 0 |
| Lint | `npx eslint` on the three changed files | exit 0 |
| Mutation harness, both directions | 8 mutations | 8 caught, 0 survived |

The harness asserts it is running a real suite before it reports anything — a harness that
finds no tests otherwise reports every mutation as caught. Baseline is checked for 9 green
cases and the run aborts if it is not.

Mutations, in both directions:

- Claiming more than the evidence supports: every absent path resolves to the one recorded
  retirement; the lookup ignores its key and returns whichever entry is first.
- Claiming less, back toward the original bug: no path is ever retired; the registry is
  emptied; only the presence check learns and the content check keeps deferring.
- Summary disagreeing with the checks: `retiredCount` hardcoded to zero; the old caveat
  sentence restored.
- Refactor changing a check that was already correct: the presence noun collapses, so the
  four present view-model checks report the wrong noun.

Two verification notes worth recording, because both are cases where a check would have
reported success without doing its job:

- **The negative control needed its own seam.** Every blueprint path except the retired
  shell exists in the tree today, so the real report exercises only the `retired` arm — a
  suite written against the report alone would pass with the `deferred` arm deleted. The
  lookup is exported and driven directly with paths that are absent and unrecorded, so the
  arm that keeps `retired` meaning something can actually fail.
- **A surviving mutation was an equivalence, and the code was wrong, not the test.** "Ignore
  the key, take the first entry" survived, because the first version asked the registry the
  same question twice and there is exactly one entry. Collapsing it to one lookup made the
  exported seam the one the checks call; the mutation is caught now.

The exhaustiveness ratchet was proven live rather than asserted: adding a sixth member to
the status union fails the typecheck (`TS2741: Property 'superseded' is missing`) until the
list learns about it. This is the same shape as a CHECK constraint that cannot store a value
the code can produce — `retired` was added to the union and the test's hand-typed list did
not learn about it, which is how it was found.

## Rollout Plan

Merge to `main`. No runtime rollout, no image build, no migration, no flag. The module is
inspected by QA suites and produces no runtime behaviour.

## Deployment Authority

- Repo-owned deploy workflow: not exercised by this change beyond the ordinary main deploy
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime surface changes
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: no — nothing renders

## Rollback Plan

Revert the PR. No migration, no data, no runtime state; the previous revision reverts to the
previous report vocabulary with no cleanup.

## Audit Evidence

- The PR and its diff.
- The mutation harness output quoted above: 8 caught, 0 survived.
- The typecheck exit code and the ratchet's failure message.

## Known Gaps

- **`INTEL-ROUTE-01` fails, and this change does not fix it.** It reads a tenant-scoped
  intelligence route that does not exist; the intelligence route lives at a non-tenant path
  while its Tower sibling genuinely is tenant-scoped. That failure predates this change and
  is unchanged by it. Whether the tenant-scoped intelligence route is supposed to exist is
  an intent question, not something the tree answers, so it is recorded for the owner rather
  than resolved here.
- **This suite is quarantined**, so a normal CI run does not exercise it. Both suites were
  run directly against this branch and the results are quoted above rather than inferred
  from a green pipeline.
- The registry has one entry. It is a claim that something was removed on purpose, and each
  entry carries its own evidence; entries are not inferred from absence.
