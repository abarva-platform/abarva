# 2026-09-01-home-stale-test-repair — Three Home suites that were guarding nothing

## Release ID

`2026-09-01-home-stale-test-repair`

## Status

`candidate`

## Plain-English Summary

The ratchet that landed earlier today baselined 18 failing Home suites. I said in
that record that several of them test paths the current surface replaced and may
be better deleted than repaired.

That was true of four of the eighteen. The other fourteen test code reachable
from a live Home route. Three of those are repaired here; the rest are named
below with what each would take.

None of the three was a broken product. Each was a test that had gone stale
against a decision made after it was written, and stayed stale because nothing
ran it.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-4:** unchanged. No product code changed — only tests, and one dead
  mock removed.
- **CI:** the Home baseline is re-recorded from 18 failing suites to 15.

## Client Applicability

- No client-visible change.
- Feature flag: none.

## Changes Included

### The KNOW ask route's visible contract, which could not run at all

`route-visible-contract.test.ts` mocked five modules — two V7, three V6 — that no
longer exist. `jest.mock` on an unresolvable module is a configuration error, so
the suite failed at import and reported **zero tests** rather than a failure. It
looked like nothing.

Removing the dead mocks recovers two tests on the live `/api/home/know/ask`
route: they assert that answer-construction language never reaches a client and
that the conservative fallback is recorded when it is caught. Those are exactly
the assertions worth having on that route.

### The demo-safe sanitizer, testing a cover name rather than the behaviour

Three assertions spelled a cover name as a literal. The name table was later
changed and the literals were not, so the suite went red and stayed there.

The assertions now read the cover names from the table, so a rename cannot orphan
them again. Two derived cases are added: every raw name in the table maps to a
declared cover name, and sanitising a cover name twice leaves it alone — a cover
that the table rewrites is how a name drifts one hop further on each pass.

The audit assertion is checked by shape rather than by a transcript of the prose,
because a test that copies out the whole sentence fails on any wording change
without saying anything about the behaviour.

### The evidence resolver, tested against a rule that has since changed

The unresolved-evidence case required the machine id to appear **inside** the
statement. The statement is client-visible copy, and a machine id in front of an
executive is a leak of how the thing is built rather than an explanation, so the
implementation stopped putting it there.

The id is on the record, where an operator can reach it — the case now pins it
there, and a second case asserts the statement matches no machine identifier at
all, tying the test to the rule that caused the change.

## QA / Validation

- PASS Home surface: 555/587 across 68 suites, up from 546/582
- PASS the ratchet refused the improvement until the baseline was re-recorded,
  which is the direction it is supposed to enforce
- PASS `tsc --noEmit` clean, `eslint` 0 errors
- **Mutation-tested:** putting the machine id back into the resolver's statement
  fails the new case

## Rollout Plan

Merge to `main`. Test-only.

## Deployment Authority

- Repo-owned deploy workflow: not involved
- Shared runtime mutators: none
- ACA runtime invariant: not affected
- Live signed-in proof required: no

## Rollback Plan

Revert, and re-record the baseline.

## Audit Evidence

- Before and after counts from the ratchet, which reads a Jest report rather than
  a hand-written list.
- The mutation-test result on the resolver.

## Known Gaps

- **Twelve suites remain baselined.** Four test Home paths the current surface
  replaced; whether to repair or delete those is the sunset decision, not a test
  fix.
- **Two were deliberately not touched.** `home-data-quality` fails on a canonical
  tenant key that changed and on a named regression field that was removed.
  Rewriting a test to match code on a question of tenant identity is exactly the
  wrong move — identity is declared, not inferred from whichever side currently
  disagrees. That one needs the registry consulted, by someone who can say which
  side is right.
- The remaining six are unexamined.
