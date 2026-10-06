# 2026-10-05-item26-t509-verdict-discharge — a triage verdict whose subject is gone must say where it went

## Release ID

`2026-10-05-item26-t509-verdict-discharge`

## Status

`candidate`

## Plain-English Summary

The repository keeps machine-readable triage records under `docs/architecture/*triage*.json`. Each
row names a test file, a verdict, an owning item, and a `currentAction` — an instruction written for
whoever picks the work up next.

Five rows of `docs/architecture/t509-stale-suite-triage.json` were still telling a future reader to
"leave untouched for T-513" five test files that **T-513 itself had already deleted**, in the very
change that replaced each of them with a rendering suite. The instruction outlived its subject by
two weeks, and nothing in the repository was able to say so: the one tool that counts these rows
calls them "a verdict nothing can expire", prints them, and exits 0 by design.

This change does two things. It records where those five subjects went, using the same `movedTo`
convention three other records already use. And it adds a narrow gate so the next row like this
fails a check instead of waiting to be noticed by hand.

## Layer Impact

Release lane: `internal-admin`. This is AbarVa-only CI and bookkeeping tooling.

- **Client intake (layer 1):** no impact.
- **Source adapters (layer 2):** no impact.
- **Canonical model (layer 3):** no impact. No tenant data, projection, migration or read model is
  touched.
- **Products (layer 4):** no impact. No product surface, route, component, prompt or read path
  changes. The five test files the record discusses do not exist; their successors are unmodified.

## Client Applicability

- All clients: no behavioural change.
- Specific clients: none.
- Internal only: yes — a CI gate and a triage bookkeeping record.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `docs/architecture/t509-stale-suite-triage.json` — five rows gain `movedTo` (`path`, `byItem`,
  `reason`) naming the successor suite, and their `currentAction` now records the discharge while
  quoting verbatim the instruction it replaces. Verdicts, owner items, counts, evidence and
  rationale are unchanged: they describe the file as drawn at that record's base commit, which is
  the convention `t492`/`t550` already set.
- `scripts/quality/triage-verdict-discharge-check.mjs` — new gate. For every triage row whose own
  subject is absent from the tree, it requires a declared successor (`movedTo` or `replacedBy`,
  object or bare string) **that resolves to a file that exists**.
- `scripts/quality/triage-verdict-discharge-check.test.mjs` — 9 cases, eight over throwaway
  fixtures and one over the real repository.
- `package.json` — `check:triage-verdict-discharge` runs the suite and then the gate, the shape
  `check:aca-worker-job-set-derived` already uses.
- `.github/workflows/release-control.yml` — invoked inside the job producing
  `Release record and impact note`, one of the 19 required contexts in
  `docs/ci/required-status-checks.json`.
- `docs/architecture/ci-gate-registry.json` — classified `pr-gate` with its reason, inserted in
  sorted position.

### Why this is a separate gate rather than a change to the existing report

`audit:triage-record-reconciliation` already counts these rows, as `verdictsNamingNoFile`. The gate
registry classifies it `report` — "deliberately not a gate" — and gives a sound reason: the rows it
prints under an **open** verdict are work that is **owed**, and failing on owed work turns a queue
into a red build. That judgment is left exactly as it was.

This gate covers the disjoint sub-case that reason does not reach. A row whose *subject* is absent
is not owed work: there is nothing left for an executor to do to it, and no amount of executing
closes it. The only repair is to record where the subject went.

The other gate on this subject, `check-source-workspace-quarantine.mjs`, reaches only
`held_unwired` verdicts that carry a quarantine-list entry. The five t509 rows are
`rewrite_as_behavior` and name no quarantine entry, so it never saw them.

A discharge must also resolve. Without that branch a dead row is dischargeable by pointing it at
another dead row — the same defect with one extra hop.

## QA / Validation

**Red first.** With the gate written and the record untouched: gate `exit 1`, naming exactly the
five undischarged t509 rows and no others — the four rows in `t492`/`t495`/`t550` that already
declare a successor were silent, so the gate discriminated before it was satisfied. Suite
**8 of 9 passing, 1 failing** — case `(i)`, the real-repository lock.

**After the discharge:** gate `exit 0`, reporting 11 rows that name an absent subject, all 11
declaring a successor that resolves. Suite **9 of 9**. The 11 rows cover 9 distinct paths; two
paths are recorded in two records each, which is why the census's `verdictsNamingNoFile` reads 9
while this gate counts 11. Both are correct over their own unit.

**Baseline, same scope, measured before any edit:**

| scope | before | after |
|---|---|---|
| `scripts/quality` named suites as CI runs them (`check-source-workspace-quarantine`, `triage-record-census-reconciliation`) | 14 pass / 0 fail | 14 pass / 0 fail |
| jest `t509-stale-suite-triage-record` + `t773-census-ranking-reads-triage-verdicts` | 2 suites / 16 tests / 0 fail | 2 suites / 16 tests / 0 fail |
| `triage-verdict-discharge-check` | did not exist | 9 pass / 0 fail |

**Eleven mutations, every one verified by comparing the file's sha256 before and after and
restored byte-identical afterwards, because a no-op mutation reads exactly like a caught one.**
Every case the suite declares is killed by at least one of them, so none is reported unproven:

| # | mutation | result |
|---|---|---|
| M1 | remove one `movedTo` from the record | gate `exit 1`; kills `(i)` |
| M2 | point one `movedTo.path` at a file that does not exist | gate `exit 1`; kills `(i)` |
| M3 | `unresolved` hard-coded to `[]` | kills `(e)` |
| M4 | `declaredSuccessor` never returns null | kills `(a)`, `(f)` |
| M5 | drop the "subject still exists → skip" guard | gate `exit 1`; kills `(b)`, `(i)` |
| M6 | `successorResolves` hard-coded true | kills `(e)` |
| M7 | remove the `movedTo` object branch | kills `(c)`, `(e)`, `(i)` |
| M8 | remove the `replacedBy` string branch | kills `(d)`, `(i)` |
| M9 | remove the unreadable-JSON guard | kills `(g)` |
| M10 | widen the record pattern to every `.json` | kills `(h)` |
| M11 | delete the workflow step | `CI gate registry failed. — check:triage-verdict-discharge: classified pr-gate but no workflow invokes it` |

M11 is the one that proves the wiring rather than the logic: a gate classified `pr-gate` and invoked
by nothing is refused, so the step is load-bearing and not decoration.

**Other checks:** `audit:ci-gate-registry` exit 0; `audit:ci-gate-registry-order` exit 0, 236
entries sorted; `check-source-workspace-quarantine.mjs` exit 0; census drift — "committed census
matches this run", unchanged, because the fields added are not ones the census counts;
`npx eslint` on both new files exit 0; `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` **exit 0, judged on the exit code** and emitting no diagnostics; `prettier --check`
clean on both edited JSON files.

**The `Behavior coverage floor` is not charged.** The new suite is a `node:test` file under
`scripts/quality`, not under `src/__tests__/behaviors`, so it adds no imports to the set that floor
aggregates over.

## Rollout Plan

Merge to `main` by squash. CI only — there is no runtime component. The repo-owned
`aca-main-deploy` workflow will build and deploy an image from the merge SHA as it does for every
commit to `main`; this change contributes nothing that image serves.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command, no revision weight, no Container App template, no
  env var, no secret, no worker job.
- Approved image digest: not applicable — this change alters no runtime image contents.
- ACA runtime invariant: to be read after the post-merge deploy, read-only.
- Worker image invariant: untouched. This change does not alter the enforced worker-job set.
- Feature/env flag update path: none.
- Live signed-in proof required: **no, and none is claimed.** No product file, route, component,
  prompt or tenant-visible behaviour changes, so there is nothing to sign in and inspect. `deployed`
  is this change's ceiling by design rather than by blockage.

## Rollback Plan

Revert the squash commit. No migration, no data change, no flag, no runtime state. Reverting
restores the previous gate set exactly; the five discharged rows return to their prior text, which
is preserved verbatim inside each row's new `currentAction`.

## Audit Evidence

- The PR and its CI run, specifically the `Release record and impact note` job's step
  `Prove no triage verdict addresses a file that is gone` — the quotable line must come from that
  blocking run, not from a local invocation.
- `git show 0d7327deb1 --stat` (PR #8167, 2026-09-21): the five `.test.ts` deletions and the five
  `.test.tsx` additions in one change, which is the evidence the discharge rests on.
- `docs/releases/records/2026-09-21-t513-source-text-to-behavior.md` — T-513's own record of that
  replacement.
- `node scripts/quality/triage-verdict-discharge-check.mjs --json` — the 11 rows and their
  successors.
- `npm run audit:triage-record-reconciliation` — the sibling report, unchanged in behaviour.

## Known Gaps

- **The five discharged rows are bookkeeping, not re-measurement.** Their verdicts and execution
  counts still describe the files as drawn at T-509's base commit, exactly as `t492` and `t550` do
  for their moved rows. The successors' current behaviour is not re-asserted here, and this record
  does not claim it was.
- **42 `wire_into_ci` rows are still held and unrun**, per
  `triageVerdicts.heldByVerdict` in the census. That is owner-gated work, untouched here, and
  deliberately outside this gate's scope — those rows' subjects all exist.
- **The gate does not check that a successor is itself run by a workflow.** All five successors here
  are, and that was verified by hand against the census for this change, but the gate asserts only
  that the successor exists. A discharge pointing at a real but unrun file would pass. Extending it
  that far would make it a coverage gate rather than a bookkeeping one, which is a different
  decision and is not taken here.
- The sibling `audit:triage-record-reconciliation` remains a `report` that always exits 0. That is
  unchanged and intentional.
