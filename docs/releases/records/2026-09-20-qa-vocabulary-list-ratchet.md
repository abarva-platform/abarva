# 2026-09-20-qa-vocabulary-list-ratchet — A vocabulary list that cannot go stale silently

## Release ID

`2026-09-20-qa-vocabulary-list-ratchet`

## Status

`candidate`

## Plain-English Summary

A test validated every check's status against a hand-typed list of the statuses the type
allows. Annotating that list as `VerificationStatus[]` does not make it complete — leaving a
member out is perfectly legal — so the list can silently fall behind the union it claims to
mirror.

It did. A fifth status was added to the union and this list was not updated, so checks
producing a legitimate status read as invalid until somebody edited the list by hand.

Both vocabularies in that suite — statuses and surfaces — are now keyed on their unions
(`Record<VerificationStatus, true>`), with the array derived from the keys. Adding a member
to either union now fails the typecheck at that line, naming the member that is missing,
rather than surfacing later as a confusing assertion failure. Nothing about what the suite
asserts changes; 40 cases pass before and after.

This is the same shape as a CHECK constraint that cannot store a value the code can produce:
the set a validator accepts must be derived from the set the code can emit, not maintained
alongside it.

## Layer Impact

- `global-control-lane`. Test-only. No product surface, tenant data, schema, projection,
  runtime behaviour, or generated artifact.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — one QA test file
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/__tests__/integration/qa/intelligence-tower-blueprint-verification.test.ts` — the
  status and surface vocabularies are keyed on their unions; `VALID_STATUSES` and
  `VALID_SURFACES` are derived from those keys.

## QA / Validation

| What | Command | Result |
|---|---|---|
| The suite | `npx jest --runTestsByPath src/__tests__/integration/qa/intelligence-tower-blueprint-verification.test.ts` | 40 passed (unchanged) |
| Typecheck | `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` | exit 0 |
| Lint | `npx eslint` on the changed file | exit 0 |
| Ratchet proven, three directions | 5 mutations | **5 caught, 0 survived** |

The ratchet's whole claim is that the typecheck fails when list and union disagree. That was
demonstrated rather than asserted, in both directions and for both vocabularies:

| mutation | typecheck said |
|---|---|
| a sixth status added to the union | `TS2741: Property 'superseded' is missing` |
| a fourth surface added to the union | `TS2741: Property 'setup' is missing` |
| the list forgets `removed` again | `TS2741: Property 'removed' is missing` |
| the list forgets `shared` | `TS2741: Property 'shared' is missing` |
| the list invents a member | `TS2353: 'invented' does not exist in type` |

### Why this change is narrow, and the measurement that decided that

The pattern is repo-wide — 370 lists of a union's members written out by hand — so before
narrowing to one file the whole set was cross-checked programmatically: each list's literals
resolved against its type alias's members.

| | |
|---|---|
| vocabulary lists examined | 370 |
| list equals its union exactly | 177 |
| list omits union members | 30 |
| alias not resolvable from source | 133 |
| alias name defined twice, skipped | 26 |

All 30 omissions were then read individually, and **none is a defect**. They are deliberate
named subsets (`usable` / `unusable` partitioning a state union, a domain router's per-vertical
lists, a test's chosen fixtures) or documented sentinels — one rank table omits `failing` on
purpose, carrying the comment `// -1 if not found (covers "failing")` with explicit guards
ahead of the rank lookup. So the sweep produced a negative result, and the fix stays at the
one list that actually went stale.

Two corrections were needed to trust that scan, both worth recording because the first
version reported a result that was almost entirely its own parsing:

- It matched greedily past the declaration into the object literals that followed, reporting
  52 differences built from prose inside those literals. Reading the array by bracket
  matching from its own opening `[` fixed it.
- `tsc` exits 0 on this tree, which proves no annotated list contains a literal outside its
  union. So every "this validator accepts a value the type denies" result is a self-report
  that the scanner resolved the wrong alias. Four remained and are reported as scanner
  faults, not findings.

## Rollout Plan

Merge to `main`. No runtime rollout — the change is confined to a test file.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime surface changes
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state involved.

## Audit Evidence

- The PR diff — one file.
- The five mutation results above, each with the typecheck error it produced.
- The 370-list cross-check summary, and the reason its 30 omissions are not defects.

## Known Gaps

- The other 369 lists are unchanged. The measurement above is why: they were read, and the
  omissions among them are deliberate. If one of them later needs the same treatment, this
  file is the pattern.
- The cross-check is a one-off measurement, not a gate. Making it a gate would need it to
  distinguish a list that claims completeness from a deliberately named subset, which it
  cannot do today — it reports a subset and a stale vocabulary identically. Shipping it as a
  gate in that state would produce 30 findings on arrival, all of them wrong.
