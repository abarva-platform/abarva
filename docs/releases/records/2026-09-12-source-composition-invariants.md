# 2026-09-12-source-composition-invariants — Composition invariants for Contract 360

## Release ID

`2026-09-12-source-composition-invariants`

## Status

`candidate`

## Plain-English Summary

Adds two structural assertions for a rendered Contract 360 surface, and wires
them into the full-shell test that already walks several tabs.

Every defect worth fixing on this surface in one working day was found by
reading the deployed page, and the suite passed all of them — because each
render is individually correct and the falsehood only exists in composition. A
governed sentence is true; the same governed sentence four times on one tab is
noise that reads as emphasis. An identifier is a correct stored value; an
identifier in a provenance line is the vocabulary of the machine in front of an
executive.

- `expectNoIdentifierLeak` fails on a lowercase underscore-joined run in the reader's text. Contract and document ids are upper case and hyphenated, so they do not match, and the canonical-record column is exempt because it documents real table and column names under a heading that says so.
- `expectNoRepeatedGovernedSentence` fails when a sentence of eight words or more appears twice on one mounted surface.

Neither checks that a surface says the right thing. They check that it does not
say one thing twice, and does not leak an identifier.

## Layer Impact

- **Release lane:** `global-control-lane` — test-only; no product behaviour changes.
- **Layer 4 / Products:** No runtime change. New test-support module and assertions.
- **Layer 3:** No change.
- **Layer 2:** No change.

## Client Applicability

- **All clients:** Test-only.
- **Specific clients:** None.
- **Internal only:** Yes — developer tooling.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `test-support/compositionInvariants.ts`: the two assertions and their text extraction.
- `compositionInvariants.test.tsx`: ten tests pinning what each assertion must catch and what it must leave alone, using the shapes that actually shipped.
- `WorkspaceClient.ecl-browser.test.tsx`: the assertions run per tab inside the existing full-shell walk.

## QA / Validation

- Focused Jest: 27 suites, 237 tests passed across the workspace slice.
- Repository TypeScript: clean. ESLint on all three files: clean.
- **Mutation-tested, and two early attempts did not bite.** Details below, because they change what this check can be claimed to do.

### Two mutations that failed to bite, and what they showed

One mutation reverted the headline-only suppression. The test failed, but
on an assertion earlier in the same test rather than on the composition check,
so the check never ran and proved nothing.

Another made a Scope card restate a sentence — but the sentence was
guessed at rather than read off the render, and it did not match the fixture's
actual functions or counts, so no duplicate existed to find.

Both attempts were the same error: writing a mutation without establishing
up front that it reaches the condition under test.

Removing the guess revealed the real problem. The threshold was twelve words,
and much of the governed prose on these surfaces is eight to eleven — including
the Scope boundary card's own fallback, whose longest sentence is ten. A
duplication introduced there passed the check completely. At eight words the
mutation fails the test as it should, and every legitimate repeat in the
existing fixtures still passes.

### What this does not yet prove

The full-shell fixture's governed records do not reproduce the shapes that
caused the real defects — it carries one Optimize record and no Story, Scope,
Economics or Relationship records. So the wiring exercises the classes on
whatever that fixture renders, not on the records that produced the ten defects
found today. The assertions themselves are pinned against those exact shapes in
their own unit tests; the full-shell coverage is thinner than it looks.

## Rollout Plan

Merge through the protected `main` PR path. Test-only, so no runtime behaviour
changes and no data operation is required.

## Deployment Authority

- **Repo-owned deploy workflow:** `.github/workflows/aca-main-deploy.yml`
- **Shared runtime mutators:** None in this change.
- **Approved image digest:** Unchanged behaviour; digest recorded by the workflow.
- **ACA runtime invariant:** Required by the workflow as usual.
- **Worker image invariant:** Not applicable.
- **Feature/env flag update path:** Not applicable.
- **Live signed-in proof required:** No — this change alters no rendered output.

## Rollback Plan

Revert the PR. Nothing else is affected; no data or migration rollback applies.

## Audit Evidence

- PR and CI checks for this branch.
- Focused Jest, TypeScript, and ESLint output.
- The mutation results recorded above, including the two that did not bite.

## Known Gaps

The full-shell wiring is thin, as recorded above. Extending the fixture's
governed tab records to cover Story, Scope, Economics and Relationship would
make these assertions guard the exact shapes that failed; that is the obvious
next step and is not done here.

The repeated-sentence check is per mounted surface, not cumulative across a
session. A claim stated once on each of two tabs is not a repeat and should not
be, but a reader moving between tabs may still meet the same paragraph twice.
Whether that counts as duplication is an editorial question this check does not
attempt to answer.

Sentence splitting is punctuation-based. A governed field with no terminal
punctuation joins its neighbour and may escape the word threshold.
