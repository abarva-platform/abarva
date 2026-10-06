# 2026-09-21-refresh-three-moves-phase-expectations — and one left red on purpose

## Release ID

`2026-09-21-refresh-three-moves-phase-expectations`

## Status

`candidate`

## Plain-English Summary

Four of seventy-six expectations in the Moves phase workspace suite had drifted
behind the surface they render. Three are refreshed against the current render,
each with its reason next to it. **The fourth is left red**, because it is not
the drift it was filed as.

| | before | after |
|---|---|---|
| Suite | **72 of 76** | **75 of 76** |
| Production change | — | **none** |

Counts run before and after, as the item required.

## The three that were refreshed

1. **`7 inputs available`.** The gate attestation row states completeness per
   phase (`${phase.code} inputs complete`) rather than counting inputs. The old
   count renders nowhere, so the assertion points at the row that does.
2. **The artifact link.** Not drift in the test's favour: the product added an
   explicit render format and the test was left behind. Asserted in full,
   including `format=html`, so a silent change back to a bare inline link
   fails.
3. **`getAllByText(move.name)` in a negative assertion.** That matcher throws
   when nothing matches, so the case failed for the wrong reason once the move
   name stopped rendering as its own text node. `queryAllByText` returns `[]`
   instead. The weight of the check sits in the `.mxw-contract-captured` null
   assertion directly above it, which is strictly stronger; this is kept as the
   name-specific form rather than deleted.

## The fourth, and why it stays red

It asserted `1 required next-phase prep item`. **The next-phase readiness block
does not render in that state at all** — the DOM for the case contains no
prep-item text, no readiness label and no carried-forward line. There is no
current wording to re-point it at.

Whether the block was removed deliberately or stopped rendering by regression
is not established here, and inventing a matcher to make the case green would
assert something nobody has decided. It is left failing with that recorded
beside it.

### How the measurement went wrong twice first

Two candidate matchers looked correct and were not. Grepping the failure output
for the rendered count returned `1 prep item` and then `11 prep items` — and
**both came from jest echoing this file's own source back**, including the
comment being written to justify the matcher. The probe was reading the thing
it was writing.

Bounding the search to the DOM section alone returned nothing: no count renders
at all. Recorded because the failure mode is general — a test's own text in the
failure output is not evidence about the render.

## Layer Impact

- `global-control-lane`. One test file. No product surface, tenant data,
  schema, projection, migration, flag, code path, or runtime behaviour.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

| What | Result |
|---|---|
| Suite before | **72 passed, 4 failed** |
| Suite after | **75 passed, 1 failed** |
| Components changed | **none** — `git status` shows only the test file |
| `tsc` (exit code) | 0 |
| `eslint` | clean |
| `release-check` | passed |

### Mutation results

| Mutation | Result |
|---|---|
| gate attestation copy changed | **2 fail** (was 1) |
| artifact link reverted to a bare `inline=1` | **2 fail** (was 1) |

Both refreshed assertions therefore catch a change rather than merely passing.

## Rollout Plan

Merge to `main`. Test-only. No image build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. The suite returns to 72 of 76.

## Audit Evidence

- Before and after counts from the same command.
- Both mutation results.
- The bounded DOM extract showing no prep-item text in the failing case.

## Known Gaps

- **One case is still red**, deliberately, and the question behind it — whether
  the next-phase readiness block should render in that state — is open and
  belongs to whoever owns that surface.
- **No case now covers the next-phase readiness summary** in this suite.
- **The three refreshed expectations assert the current render, not a
  specification.** They pin what the surface does today; none of them
  establishes that today's wording is the intended wording.
