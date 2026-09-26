# 2026-09-26-c523-whole-contract-context-packet — Measure what the whole-contract context packet actually hands the model

## Release ID

`2026-09-26-c523-whole-contract-context-packet`

## Status

`candidate`

## Plain-English Summary

When someone asks the assistant a question about one contract, the product assembles a "contract
context packet" and hands part of it to the model. Nobody had ever measured which part. The backlog
item this record belongs to asked for a measurement first and explicitly forbade changing retrieval,
so **no runtime code changes here**: this adds one test suite and one committed baseline file.

What the measurement found, for one authorized contract on one tenant:

- The block the model receives carries **six contract scalars** — contract id, vendor name, contract
  name, annual value, actual annual spend and end date — and nothing else about the agreement.
- Of the five object kinds the specification requires (clause, definition, schedule, amendment,
  evidence reference), **the count of each one is zero**.
- Of the eight components the specification's contract-context-packet table requires, **one is
  present** (commercial position, and only through the annual-value line). The other seven are
  absent, and each is named individually in the baseline.
- The packet the server assembles is **richer than what the model is shown**. It fetches the
  optimization opportunity set, including each opportunity's label, next action and negotiation
  language, and the formatter reads none of it. The block then tells the model "Page next action: not
  established in page context" while that next action is sitting in the packet one function call
  away.
- Nothing on the packet's path can reach the governed context seam
  (`buildValidatedAgentContextBundle`). That is proved per module rather than per route, and the
  distinction matters: one of the two request paths reaches the seam's module through unrelated code,
  so a route-level audit would report the packet as governed when it is not.

The prior written premise for this item said the packet "carries a document count only". That is
corrected here: on the server-built path there is no document count either, because the builder never
writes the packet keys the summary lines read. A count would have been the better outcome.

## Layer Impact

Release lane: `global-control-lane`. It is shared control-plane tooling — one CI-run suite and one
committed baseline — and it is not gated behind a flag, so it reaches every client's build even though
it changes no client-visible behavior.

- **Layer 4 (products) — read path, measured only.** Source contract answers on the two request paths
  that format a selected-contract block. No behavior changes.
- **Layer 3 (canonical model) — untouched.** No schema, loader, projection or adapter change.
- **Tests / CI tooling.** One new suite in `src/__tests__/behaviors`, which the required
  `Coverage Threshold / Behavior coverage floor` job runs as a directory sweep.

## Client Applicability

- All clients: no runtime change reaches any client.
- Specific clients: none.
- Internal only: yes — the baseline artifact and the suite are internal evidence.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/__tests__/behaviors/c523-whole-contract-context-packet.test.ts` — new, 46 cases.
- `docs/architecture/c523-whole-contract-context-packet.json` — new baseline, the file a later
  retrieval change has to move.
- This record.

No file under `src/lib` or `src/app` changed.

## QA / Validation

Baseline measured in this same worktree at `origin/main` before any file was added, not from a stash,
so the two numbers are over one scope:

| scope | before | after |
|---|---|---|
| `src/__tests__/behaviors` suites | 139 | 140 |
| `src/__tests__/behaviors` tests | 1370 | 1416 |
| failing | 0 | 0 |

Required behavior-coverage gate (`npm run coverage:behavior-gate`), exit 0 both times:

| metric | threshold | before | after |
|---|---|---|---|
| lines | 90 | 91.14 | 90.97 |
| statements | 90 | 91.14 | 90.97 |
| functions | 60 | 70.91 | 71.14 |
| branches | 50 | 70.99 | 69.88 |

That gate is a **directory aggregate**, so a new suite that brings previously uninstrumented modules
into the denominator moves the line percentage down even while adding covered code. The remaining
headroom on `lines` is 0.97 points. It passes, and the constraint is recorded because the next suite
in this directory inherits it.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, judged by
  exit code with `tsconfig.tsbuildinfo` removed first, because a bare run on the operator host exits
  134 on a V8 out-of-memory and emits no diagnostics.
- `npx eslint` over the new suite — exit 0.
- `npm run audit:test-ci-coverage:check` — exit 0. It reports the committed test-CI census as stale
  by exactly this change (`testFiles 2476 → 2477`, `coveredTestFiles 2029 → 2030`). That file is held
  by another live claim, so it is deliberately **not** refreshed here; see Known Gaps.

### Mutation proof

This item adds no fix, so "break the fix and confirm the test fails" is done against the **subject**.
Twelve mutations were applied through a harness that hashes the file before and after and **withholds
the verdict if the file did not change**, because a no-op edit reads exactly like a surviving
mutation. Eleven were caught; the twelfth survived and is reported rather than hidden.

| # | mutation | result |
|---|---|---|
| 1 | formatter emits an agreement-set line naming amendments and schedules | caught (5 cases) |
| 2 | formatter's "next action not established" wording changed | caught (1) |
| 3 | the kind counter is blinded to always return 0 | caught (1 — the positive control, and only it) |
| 4 | the governed-seam module is imported into the formatter | caught (3) |
| 5 | a dynamic `import(` is added to the surface retriever | caught (4) |
| 6 | the surface retriever starts reading the packet | caught (3) |
| 7 | the baseline's clause count is edited to 1 | caught (1) |
| 8 | a component key is deleted from the baseline | caught (2) |
| 9 | the baseline's packet key set is edited | caught (1) |
| 10 | the builder starts writing a key recorded as never written | caught (4) |
| 11 | the answer-format footer exclusion is removed | **survived** |
| 12 | the formatter's dataset summary is hard-coded to name clauses and definitions | caught (6) |

Mutation 3 is the case that matters most: a per-kind count of zero over a block that mentions no
contract objects cannot distinguish "no objects reach the model" from "the counter is blind". The
suite therefore drives the same counter through a real second reader — the direct page-context
path, whose dataset summary is free text — and requires a non-zero count for **every** kind there.
Blinding the counter reddens exactly that case and nothing else, which is the proof that the zero
above is a measurement rather than a silence.

Mutation 11 survived because the current footer wording happens to contain none of the five kind
markers, so excluding it changes no number today. The exclusion is kept as a guard against a reworded
footer, and it is **not** counted among the eleven: a guard no mutation can kill is not evidence.

No signed-in run was performed and none is claimed.

## Rollout Plan

Merge to `main` and let the repo-owned ACA main deploy workflow build and deploy as normal. There is
no runtime behavior to roll out: the change is a test suite and a JSON baseline, neither of which is
read at run time.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: whatever the main deploy workflow produces for the squash commit; no digest
  is pinned or overridden here.
- ACA runtime invariant: to be proven after merge by reading the run keyed to this change's own merge
  SHA, and comparing the Container App template image against the 100%-traffic revision image.
- Worker image invariant: unchanged; no worker job configuration is touched.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**. The item's acceptance is a measurement over code, and the
  suite asserts it in CI. Nothing here changes what a signed-in user sees.

## Rollback Plan

Revert the squash commit. Nothing to undo beyond deleting one suite and one JSON file; no migration,
no data, no flag, no image pin.

## Audit Evidence

- The PR for this branch, and its `Coverage Threshold / Behavior coverage floor` run.
- `docs/architecture/c523-whole-contract-context-packet.json` — the committed baseline, every field of
  which the suite re-derives and compares in both directions.
- The before/after tables above, both measured in one worktree over one scope.
- The mutation table above.

## Known Gaps

- **The measurement is one contract on one tenant, by design.** The item asked for exactly that, and
  a second contract would not change which keys the formatter reads. It would change nothing measured
  here and is not claimed as covered.
- **The committed test-CI census is left stale by one file.** `docs/architecture/test-ci-coverage-census.json`
  is held by another live claim in the execution register, so refreshing it here would collide. The
  drift is `testFiles 2476 → 2477` and `coveredTestFiles 2029 → 2030`, it fails no gate, and the
  refresh belongs to the holder of that file.
- **A request-supplied packet on one of the two paths is recorded, not repaired.** On the path that
  does not rebuild the packet server-side, the formatter is handed the request's own context and
  labels it to the model as authoritative page scope. That is measured and recorded in the baseline's
  `destinations` array, and it is out of scope for an item whose acceptance says to change no
  retrieval. A follow-up item carries it.
- **No signed-in proof, and none owed.** Stated positively so it cannot be read as an outstanding
  obligation.
