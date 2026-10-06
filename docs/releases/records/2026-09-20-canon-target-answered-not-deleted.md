# 2026-09-20-canon-target-answered-not-deleted — A required route that never existed

## Release ID

`2026-09-20-canon-target-answered-not-deleted`

## Status

`candidate`

## Plain-English Summary

A canon regression required `/platform/admin/architecture` to exist. It does not, so the
whole suite was excluded from CI rather than the question being answered — because "is this
a missing surface or a stale entry" is not something a file-existence check can settle.

Measured, it is settled:

- **No commit on this branch's history has ever touched that directory** — not an add, not
  a delete. The route never existed here, so it was never a regression.
- The admin tree was consolidated under `/admin/*`, and the Architecture panel went with
  that consolidation.
- There is no `/admin/architecture` either, so the surface is not living somewhere else
  under a new name. It is nowhere.

So the target entry is stale. It comes out of the required list — but into a **checked
record**, not into the bin. The item that owns this forbids settling it by deleting the
assertion without saying which answer was chosen, and a deleted entry takes the answer with
it.

The suite is no longer excluded. The quarantine drops from four suites to three, and its
ceiling drops with it.

## Layer Impact

- `global-control-lane`. One QA module, its suite, the quarantine list and its checker, and
  a stale comment in `next.config.ts`. No product surface, tenant data, schema, projection,
  migration, or runtime behaviour — the corrected comment sits beside a redirect table whose
  entries are unchanged.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — QA artifacts and one build-config comment
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/qa/design-workflow-canon-regression.ts` — `admin-architecture` moves from
  `TARGET_PAGES` into a new `RETIRED_TARGET_PAGES`, carrying the measurement as its `basis`.
- `src/__tests__/integration/qa/design-workflow-canon-regression.test.ts` — four cases that
  check the record in both directions; two count assertions rebased onto the
  required/answered split.
- `scripts/quality/qa-integration-quarantine.json` — the entry removed.
- `scripts/quality/check-qa-integration-quarantine.mjs` — `CEILING` 4 → 3.
- `next.config.ts` — a comment that named a redirect which has never existed.

## QA / Validation

| What | Result |
|---|---|
| The canon suite | **35 passed** (was 31 passed, 1 failed, and excluded) |
| Canon + admin-route parity + shell enforcement | 53 passed, 0 failed |
| Quarantine checker | clean at 3 of 39 suites; 36 run on every PR |
| `tsc --noEmit` | exit 0 |
| `eslint` | exit 0 |
| Mutation harness, three directions | **6 mutations, 6 caught, 0 survived** |

Direction 1 attacks the record: emptying the retired list (what deleting the entry would
have done), reducing its basis to a word, and re-adding the page as required. Direction 2
adds a fifth page to the required list. Direction 3 attacks the quarantine ratchet: leaving
the ceiling above the list, and putting the entry back without raising it.

### The record is checked in both directions, which is the point

A retirement that only says "this is not required" rots the moment someone builds the route.
The cases assert the file is **absent**, that the basis says what was measured, and that no
target is simultaneously required and retired. If `/platform/admin/architecture` ever
appears, the claim fails and names itself — the original entry had no such property, which
is how it came to require a route for months.

### A harness correction worth recording

One mutation first reported SURVIVED with `Tests: 0 total`. It had produced invalid
TypeScript, so the suite never ran and the harness scored a non-run as a survival — the same
defect as a harness that runs no tests and reports every mutation caught. The harness now
reports `SKIP` when a suite does not run, and the mutation was rewritten to be valid. Only
then did it become a catch.

### Two findings the item did not name

- **`next.config.ts` claimed a redirect that has never existed.** Its comment read "Legacy
  `/platform/admin{,/architecture,/production-readiness}` pages perform their own
  App-Router-level `redirect()`". The production-readiness page does exactly that; there has
  never been anything at the architecture path to do it. Naming a redirect that does not
  exist is part of how the canon entry survived.
- **A dangling `clickTarget` points at the dead path** from
  `src/lib/admin/admin-action-strip-view.ts`. Measured before reporting it: that module has
  no non-test importer and is **not reachable** from any of the 3,366 files the routes
  reach, so it is dead code carrying a stale path rather than a live 404. Recorded, not
  retargeted — choosing a destination for it is a product call, and it is filed rather than
  guessed.

## Rollout Plan

Merge to `main`. The suite runs on the next PR — it has not run on any PR while excluded. No
image build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime surface changes
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting restores an excluded suite and
a required route that has never existed.

## Audit Evidence

- The PR diff.
- `git log --diff-filter=A|D` over the route directory returning nothing on `origin/main`.
- The six mutation results, and the quarantine checker reporting clean at 3 of 39.

## Known Gaps

- **Whether an architecture surface should exist somewhere is still a product question.**
  This change says only that `/platform/admin/architecture` is not it and never was. If one
  is wanted, it is new work under the consolidated `/admin/*` tree, not a restoration.
- The dangling `clickTarget` is left pointing at the dead path. It is unreachable, so nobody
  hits it, but retargeting it means choosing where an "Architecture sign-off" action should
  lead — filed rather than decided here.
- Two suites remain quarantined, owned by their own items.
