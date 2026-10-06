# 2026-09-22-make-the-ava-citation-contract-executable

## Release ID

`2026-09-22-make-the-ava-citation-contract-executable`

## Status

`candidate`

## Plain-English Summary

`workspace-ava-contract.test.ts` opened five source files and asserted
substrings of them. All seven cases were green, and **a comment containing the
matched string satisfied any of them** — so the suite could not distinguish
working code from a comment quoting it.

One case is converted to a real call, one is added as its negative, and the
case that genuinely cannot be converted is kept and renamed to say so.

| | before | after |
|---|---|---|
| Cases | 7, all source-text | **8** |
| Executable cases | **0** | **2** |
| Source files read | 5 | **4** |

## The conversion, and the proof it was worth doing

The citation-label case asserted three template-literal strings inside
`surface-context.ts`. It now calls `retrieveSurfaceContextSources` and
inspects what comes back, plus a second case pinning the fallback so
"reads the caller's module" cannot be satisfied by a function that ignores its
input and happens to say `Source`.

Measured, in the order that matters:

| Mutation | Result |
|---|---|
| the module label hardcoded, ignoring the caller | **1 case fails** |
| the same, **plus a comment containing both asserted strings** | **1 case fails** |

The second is the point. The old case asserted exactly those strings as text,
so the comment alone would have satisfied it — the suite would have stayed
green while the behaviour it names was gone.

## The case that stays source-text, and is now named as one

`keeps Source 360 navigable without the old fixed-width cockpit canvas`
asserts class names and layout rules in a stylesheet. **jsdom does not apply
CSS**, so nothing available in this harness can evaluate what those rules do.
A `getComputedStyle` assertion would return nothing and would be *worse* than
this case, because it would look behavioural while proving less.

It is kept, prefixed `SOURCE-TEXT:`, with a comment stating that it is one and
why. A real check belongs in a browser harness; **that option is open and this
change does not foreclose it.**

## What this does not do

Three cases that render `WorkspaceClient` are still source-text. The item
states the path — the stub pattern in `contractDetailRetry.test.tsx` — and two
more read `buildViewModel.ts`, whose fixture lives in a sibling suite. Neither
is done here, and the file still reads four sources.

They are left rather than half-converted: a render harness lifted in a hurry is
how a case ends up asserting the harness instead of the surface.

## Layer Impact

- `global-control-lane`. One test file. No product surface, tenant data,
  schema, projection, migration, flag, code path, or runtime behaviour.
  `surface-context.ts` is byte-identical to `origin/main`.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts`

## QA / Validation

| What | Result |
|---|---|
| The suite | 7 passed → **8 passed**, 0 failed |
| Executable cases | 0 → **2** |
| `surface-context.ts` vs `origin/main` | **byte-identical** |
| `tsc` (exit code) | 0 |
| `eslint` | clean |
| `release-check` | passed |

## Rollout Plan

Merge to `main`. Test-only. No image build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. The citation contract returns to an assertion a comment can
satisfy.

## Audit Evidence

- Both mutation results, including the comment decoy.
- The retriever unchanged in `git status`.

## Known Gaps

- **Five of the original seven cases are still source-text**, three of them
  convertible by a path this change did not take.
- **The layout case is honest, not proven.** Naming it does not make the
  stylesheet contract verified; it makes the gap visible.
- **The suite's directory was not wired** here; that is tracked separately and
  the workflow file is contended.
