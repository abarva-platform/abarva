# 2026-09-20-census-reads-imports-with-a-parser — The regexes were over-crediting, not under-reading

## Release ID

`2026-09-20-census-reads-imports-with-a-parser`

## Status

`candidate`

## Plain-English Summary

The coverage census decides which directory gets wired into CI next. To do that it has to
know which modules a test file actually loads, and it read that with three regular
expressions over source text — each branch added after somebody noticed a form the previous
branches missed.

The item asked for the gap to be **bounded** rather than enumerated one form at a time. So
the whole tree was parsed with TypeScript's own scanner and the two readers compared.

**The measurement inverted the worry.** Across 2,321 test files and 5,705 runtime edges the
regexes missed **zero** edges. What they did instead was credit **608** specifiers that are
not edges at all — because to a regex, a quoted module path inside an assertion looks
exactly like one inside an import:

```ts
expect(pageSource).not.toContain('from "@/lib/active-client"');
```

The census read that as the test importing the module, from a line asserting the page must
**not** import it.

The reader is now the parser. An assertion string is not an import node.

## Layer Impact

- `global-control-lane`. One QA measurement script and its tests. No product surface,
  tenant data, schema, projection, migration, or runtime behaviour.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — a QA measurement script
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs` — three import regexes replaced by
  `runtimeModuleSpecifiers`, which walks the AST. The erasure rules are unchanged in intent
  and now come from the parser's own `isTypeOnly` flags.
- `src/__tests__/behaviors/census-reads-imports-with-a-parser.test.ts` — new, 20 cases, one
  per form, each running the reader.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` — its scratch-repo fixture
  symlinks `node_modules`, since the script now has a real dependency.

## QA / Validation

| What | Result |
|---|---|
| New reader suite | 20 passed |
| All six census suites | **82 passed, 0 failed** |
| `tsc --noEmit` | exit 0 |
| `eslint` | exit 0 |
| Mutation harness, two directions | **9 mutations, 9 caught, 0 survived** |

Direction 1 stops counting things that do load: side-effect imports, re-exports, `require()`,
dynamic `import()`, and everything after the first specifier. Direction 2 starts counting
things that load nothing: type-only imports, an all-type brace list, type-only re-exports,
and every string-argument call (which would bring `jest.mock` back).

### What the change does and does not move

Every count in the census is **identical** before and after — 2,321 files, 911 covered, 61
critical, 110 high. The top-ten governed-risk ranking is unchanged. Two of twenty-five
evidence entries change, and one of them is a real correction:

`src/lib/admin/broker/__tests__` was credited with two approval-or-lifecycle sources and now
has one. The dropped edge was

```ts
type SendArg = Parameters<typeof import('@/lib/notifications/channels/email-resend').sendEmail>[0];
```

— `typeof import()` in a **type position**, which is erased and loads nothing. In the AST it
is an `ImportTypeNode`, not a call, so the parser excludes it by construction. That is a
**third** instance of the erasure class the item cites, and it was found by the bound rather
than by someone noticing a form, which is what the acceptance asked for.

So the honest summary: no band, count or rank moves today. What moves is the evidence a
person reads when deciding what to do about a flagged directory — one of them was naming a
module the tests never load.

### The old reader was run against the same fixtures rather than assumed inadequate

| form | should be | old reader |
|---|---|---|
| a named import | counted | found |
| a bare side-effect import | counted | found |
| a dynamic import | counted | found |
| an indented import | counted | found |
| an import after a semicolon | counted | **missed** |
| a type-only import | not counted | skipped |
| `typeof import()` in a type position | not counted | **credited** |
| a `jest.mock` target | not counted | skipped |
| a module path quoted in an assertion | not counted | **credited** |
| a module path in a comment | not counted | **credited** |

**Six of ten right.** This also corrects the item's own phrasing: it named "any import
statement not at the start of its line" as unread, but the side-effect regex was anchored as
`/^[ \t]*import/`, so an *indented* statement was read fine and only one sharing a line with
something else was missed. Both are pinned in the new suite.

## Rollout Plan

Merge to `main`. No runtime rollout — a QA script and its tests. The committed census is
unchanged because the output is unchanged.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime surface changes
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting restores a reader that credits
a module a test asserts it does not import.

## Audit Evidence

- The PR diff.
- The nine mutation results; the ten-row comparison of the old reader against the same
  fixtures; the before/after census diff showing which evidence entry changed and why.

## Known Gaps

- **The script now depends on a package.** It imports TypeScript, which the repository
  already carries, but the census was previously runnable with nothing but Node. Its own
  fixture copied two files into an empty directory and had to be given `node_modules` by
  symlink. That is a real cost of the change and is recorded here rather than left for the
  next person to discover from a module-resolution error.
- **`jest.mock` targets are still not counted, and that is not a decision made here.** A mock
  loads nothing, so excluding it matches what the census asks — but it does name a module the
  suite is exercising, and there are **1,199** such targets that are not otherwise imported.
  Counting them would change what the census *means*, not how well it reads, so it is left
  as it was and filed separately.
- The 608 over-credits are now gone, but only two evidence entries depended on them. The
  remainder pointed at modules the directory also reached by a real edge, so removing them
  changed nothing visible. The value of this change is mostly that the reader can no longer
  be fooled, not that a live figure was wrong.
