# 2026-10-04-c584-withdrawn-definition-suppression — Queue stops offering an id whose competing definition is withdrawn

## Release ID

`2026-10-04-c584-withdrawn-definition-suppression`

## Status

`candidate`

## Plain-English Summary

The execution queue is generated from the operator backlog and tells agents which
work is free to take. When one id number has two different definitions, the queue
flags the row `AMBIGUOUS` and offers it anyway.

That is wrong when one of the two definitions says it is withdrawn. The queue was
offering such a row as live work while the backlog recorded, in legible text, the
measurement that withdrew it — so an agent following the queue's own instruction
("do not ask which item is next") would start closed work.

This change makes the generator read a definition that retires itself, and refuse
to offer any id where one of its competing definitions is withdrawn or closed. The
id is not hidden: it is counted in the census table, named with the section it was
withdrawn in, and flagged as a collision somebody still has to settle.

Two live definitions of one number are a real choice and are still offered. The
suite holds that half shut so this cannot become a blanket suppression of every
ambiguous id.

## Layer Impact

- **Release lane: `internal-admin`.** AbarVa-only execution-planning tooling. No
  client-facing surface, no shared runtime, no data plane.
- **Tooling / developer-process only.** `scripts/exec/build-source-board.mjs` and
  `scripts/exec/build-execution-queue.mjs` generate operator-facing planning
  documents. Neither runs in the product runtime.
- **No change to layers 1–4** of the enterprise information architecture. No tenant
  data, no adapters, no canonical model, no product surface.

## Client Applicability

- All clients: none — no runtime behavior changes.
- Specific clients: none.
- Internal only: yes. Execution-planning toolchain.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/build-source-board.mjs` — new `RETIRED_DEFINITION` detector and
  `isRetiredDefinition`, a per-item `retiredDefinitions` field computed over the
  item's **substantive** definitions only, emitted on both summary item shapes.
- `scripts/exec/build-execution-queue.mjs` — new declared stage in
  `CLAIMABLE_STAGES`, so the funnel census row and the filter read one list; plus
  a named line in "Why that number" listing the suppressed ids and their sections.
- `scripts/exec/build-execution-queue.test.mjs` — four behavioral cases.

Deliberately **not** changed: `UPDATE_TITLE`. Widening it would move what counts as
substantive, which moves ambiguity, stage promotion and capability credit for every
id carrying the verb. The new detector decides one thing and is asked only about an
id with more than one substantive definition.

## QA / Validation

Baseline measured on pristine `origin/main` (`aa23d2c31f`) in a separate worktree,
same scope, same commands.

| suite | before | after |
|---|---|---|
| `build-execution-queue.test.mjs` | 211 passed, 0 failed | **215 passed, 0 failed** |
| `build-source-board.test.mjs` | 106 passed, 0 failed | 106 passed, 0 failed |
| `queue-provenance.test.mjs` | 30 passed, 0 failed | 30 passed, 0 failed |
| `toolchain-manifest.test.mjs` | 17 passed, 0 failed | 17 passed, 0 failed |
| `id-collision.test.mjs` | 69 passed, **1 failed** | 69 passed, **1 failed** |

The single `id-collision` failure is identical before and after — the same case,
"the reader classifies far more of the corpus as updates than as filings". It is a
live-corpus calibration case and is already filed as a separate backlog item; it is
not caused by this change and is not repaired by it.

**Red first.** The three cases written before the fix failed 3 of 3 against the
then-current generator. The negative control passed before the fix, which is the
point of it.

**Mutation proof — 4 attempted, 4 caught.**

| # | mutation | result |
|---|---|---|
| 1 | claimable stage always keeps | 2 cases red |
| 2 | suppress every ambiguous id (drop the retired condition) | negative control red |
| 3 | drop `withdrawn` from the detector | 2 cases red |
| 4 | read the title only, not the acceptance cell | acceptance-cell case red |

Mutation 4 survived the first three cases. Rather than drop the unreached branch, a
case was added for it: this backlog's older convention writes a verdict at the head
of the **acceptance** cell, which a title-only detector misses.

**One measurement reported as a survivor, not as a proof.** Widening the detector
from substantive definitions to all definitions (`substantive` → `withScopes`)
produces **identical live counts** on today's corpus, so the narrowing is not
load-bearing *today*. It is kept as a stated safety margin against the ordinary
"one live definition plus its own `CLOSED — deployed` notes" shape, and that claim
is an argument, not a measurement.

**Live corpus proof**, regenerated with the repo-owned generators against the
operator root:

- claimable `11 → 9` (one is this item's own live claim; one is the suppression).
- exactly **1** id suppressed: `C-634`.
- `C-634` appears in **0** claimable lane tables, and is still named in the census.
- the census still renders `**Reconciled**` — the arithmetic closes.

Lint: `npx eslint` over the three changed files — clean, exit 0.
Typecheck: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`,
judged on exit code.

## Rollout Plan

Merge to `main`. No image build, no Azure Container Apps deploy, no migration, no
flag. The generators are run on demand by operators and agents; the next run after
merge picks the change up.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, deploy workflows,
runtime images, flags, environment variables, worker jobs, traffic, DNS, or
environment promotion.

- Repo-owned deploy workflow: not involved.
- Shared runtime mutators: none.
- Approved image digest: n/a — no runtime image changes.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: n/a.
- Live signed-in proof required: **no** — there is no product surface in this change.

## Rollback Plan

Revert the single squash commit. The generated documents are regenerated from source
on every run and hold no state, so the previous queue returns on the next run. No
migration, no data to unwind.

## Audit Evidence

- The pull request and its CI run.
- `scripts/exec/build-execution-queue.test.mjs` — the four cases, each naming the
  defect it holds shut.
- The regenerated operator queue: the census row, its count, and the named line
  identifying the suppressed id and the section that withdrew it.

## Known Gaps

- **Disclosed against this change's own proof.** The suite that proves it runs in
  `Execution queue behavioral contract`, which is **not one of the 19 required
  contexts** on the `main` ruleset (item `C-582`). It executes on the pull request
  and cannot fail a merge, and that is true of every behavioural contract under
  `scripts/exec/`. The mutation result above is a measurement taken by hand, not a
  bar CI will hold shut on a later change.

- The suppressed id is removed from the claimable lanes; the underlying collision is
  **not** settled by this change. Pinning the live definition with `definedIn` on the
  repo-owned structure map, or recording the withdrawal against the number itself,
  is still owed and is now stated in the queue rather than implied.
- The substantive-only narrowing is unfalsified on today's corpus — see the survivor
  reported above.
- The pre-existing `id-collision` calibration failure is untouched and is tracked
  separately.
