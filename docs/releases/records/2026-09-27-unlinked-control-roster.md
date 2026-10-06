# 2026-09-27-unlinked-control-roster — The AI surface control gate names the controls with no behavioral test

## Release ID

`2026-09-27-unlinked-control-roster`

## Status

`candidate`

## Plain-English Summary

The AI surface control catalog gate told us **how many** declared controls have no behavioral
test proving them. It never told us **which ones**. Every figure it printed on a passing run was
a count:

```
AI surface control catalog passed (23 surfaces, 44 declared controls, 640 route entry points).
Behavioral coverage of reachable controls: 35 of 35 (100%).
Reachable share of declared controls: 35 of 44 (79.5%).
Not on any screen: 9 of 44 controls sit on surfaces no route reaches.
```

The standing backlog item that restocks this programme is defined as "write a behavioral test for
the next declared control that has none". That question cannot be answered from any of those
lines, so answering it meant a search of the test tree rather than a read of the gate — and a
search is a thing two people do two ways and get two answers.

The report now names them, and states a zero in words rather than dropping the section:

```
Controls with no behavioral test: 5 of 44. Named here so the next one can be read off this
report rather than searched for in the test tree.
  - tower-atlas-program-pressure-brief:ai-label — src/components/tower/ProgramPressureCards.tsx — not on any screen
  - tower-atlas-program-pressure-brief:citation — …
  - tower-atlas-program-pressure-brief:confidence — …
  - tower-atlas-program-pressure-brief:human-approval-gate — …
  - tower-atlas-program-pressure-brief:risk-caveat — …
```

**Five is the size of that restocking backlog today**, and all five sit on one surface no route
reaches — which is a different problem from an untested mounted surface and is labelled as such
on each line.

### Re-verification changed the item, and the correction belongs on the record

The backlog item this closes asserted that the catalog "records no behavioral-test linkage at
all" and that each control object carries only `id`, `lane`, `owner`, `path`, `requiredControls`
and `surface`. **Both statements are false, and have been since 2026-09-18.** Measured by running
the gate, not by reading it:

- `requiredControls[].behavioralTest` carries a test path and the exact jest case names that prove
  the control (`provenCases`). 39 of 44 declared controls carry one; the other 5 carry an explicit
  `status: "none"` with a reason and the suites that reference their module.
- The linkage is enforced. Adding a control with no `behavioralTest` key fails the gate outright.
  Declaring `status: "none"` with only a short sentence fails twice over — the reason must be
  concrete, and the known suites must be enumerated and must match a walk of the tree.
- A separate checker reconciles every `provenCases` name against `jest --json`, so a case that was
  renamed, deleted or skipped cannot leave the control credited.

So two of the three things the item asked for already existed. What survived its wrong diagnosis
is its opening sentence: the report answers the restocking question with a count. That is the only
part this change builds, and the item should be read as closed against that scope.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only CI and operator reporting. It ships no
client-facing capability, no data-plane change and no feature flag, so it is not
`global-control-lane` despite touching a governance gate: the gate's verdicts are unchanged and
only what it prints alongside them is new.

- **Layer 4 — products:** none. No product surface, route, component, prompt, schema, adapter or
  dataset is touched. No runtime image content changes.
- **Platform / CI tooling:** `scripts/audit/ai-surface-control-catalog.mjs` prints an additional
  section on a passing run, and stops running its audit when the module is imported rather than
  executed (it now uses the shared `isDirectInvocation` guard, so a suite can import the renderer
  without triggering a full catalog audit inside that suite's output).

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — developer and CI reporting only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/audit/ai-surface-control-catalog.mjs`
  - collects each uncovered control in the **same pass that counts it**, rather than recomputing
    the list afterwards: two walks of one catalog can disagree, and then the count and the names
    are evidence against each other instead of for the same fact;
  - exports `renderUncoveredRoster(uncovered, declared)`, which prints one sorted line per control
    (`surfaceId:kind — module path[ — not on any screen]`) and an explicit `0 of N` sentence when
    the roster is empty;
  - guards `main()` with `isDirectInvocation` so importing the module does not run the audit.
- `src/__tests__/behaviors/unlinked-control-roster.test.ts` — new behavioral suite, 7 cases.
- `docs/architecture/test-ci-coverage-census.json` — generated; refreshed with
  `npm run audit:test-ci-coverage:write` because adding one wired suite moves its counts.

## QA / Validation

Measured on a clean checkout of `origin/main` at `ab56615916`, from this branch's own worktree.

**Failing first, then passing.** The new suite is 7 of 7 failing before the change to the audit
script and 7 of 7 passing after. No other suite changes verdict: the five sibling suites that
already exercise this gate are 107 of 107 passing before and after
(`catalog-coverage-two-denominators`, `catalog-claim-binding`, `uncovered-control-known-suites`,
`control-case-proof-binding`, `unreachable-reason-claims`).

**Five mutations, five caught**, each verified to have actually changed the file before it was
run, and each reported with the cases it fired:

| # | Mutation | Failing cases |
|---|---|---|
| 1 | never collect an uncovered control (roster always empty) | 4 — every case that reads the live roster |
| 2 | collect only controls on unreachable surfaces | **1 — the blinded real-known-positive case, and nothing else** |
| 3 | emit the roster in reverse instead of sorted | 1 — the ordering case |
| 4 | return nothing instead of the `0 of N` sentence | 1 — the empty-roster case |
| 5 | remove the `isDirectInvocation` guard | 1 — the import-silence case |

**Mutation 2 is the point of the suite.** All five controls uncovered in the catalog today sit on
the same unmounted surface, so a roster that only ever named unreachable controls would satisfy
every assertion made against the live catalog. It is caught by exactly one case: the one that
takes a control which genuinely *has* a behavioral test today, blinds it in a fixture built from
the live catalog, and requires the roster to name it. A clean corpus cannot distinguish a working
detector from a blind one, so the positive has to be manufactured from real data.

**The expectations do not ratchet against the work they encourage.** Every live-catalog case walks
its expected set out of the catalog inside the case. Writing a behavioral test for one of today's
five uncovered controls shortens both sides and the suite stays green; no case pins the number 5,
the number 44, or any control id.

**Mutation 3 initially survived** and the fixture, not the fix, was at fault: two entries in
descending order have the same reverse as their sort, so the case could not tell one from the
other. It was rebuilt with three entries whose collected order, reversed order and sorted order
are all different, and the mutation is caught.

Gates run from this branch:

- `npm run audit:ai-surface-controls` — exit 0, roster printed (5 of 44).
- `npm run audit:ai-surface-control-cases` — exit 0; 39 credited controls, 128 cases, 23 suites,
  jest ran and passed every one.
- `node scripts/audit/ai-surface-control-catalog.mjs` invoked directly, and through `npm run`, both
  exit 0 and both print the audit — the invocation guard does not silence CI. Importing the module
  prints nothing.
- `node scripts/quality/test-ci-coverage-census.mjs` — reported drift (+1 test file, +1 covered),
  refreshed, now reports `committed census matches this run`.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, judged by
  exit code.
- `npx eslint` over both changed source files — exit 0.

Nothing was weakened, skipped, quarantined, de-required or deleted. No test was relaxed, no
exception list was touched, and the change edits none of the suites it reports on.

## Rollout Plan

Merge to `main`. No runtime rollout: this is CI reporting only. The new section appears in the
`AI surface control catalog` workflow job's log on the next run.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none — this change mutates no Container App, revision, traffic weight,
  env var, secret, flag, scale setting or worker job.
- Approved image digest: not applicable; no runtime image content changes.
- ACA runtime invariant: not claimed and not required by this change.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** No product surface, route, schema, adapter, prompt,
  dataset or runtime image is modified.

## Known Gaps

- **The roster reports; it does not enforce.** Nothing fails when the count is above zero, and
  nothing should — five controls on an unmounted surface is a known, declared state with a written
  reason, not a regression. What this change fixes is that the state was unreadable, not that it
  was unenforced. Whether an uncovered *reachable* control should fail the gate outright is a
  policy call for the owner and is deliberately not taken here.
- **All five controls named today are on one unreachable surface.** So the live catalog exercises
  only the unreachable branch of the line format; the reachable branch is proven by the renderer's
  own case and by the blinded-control fixture, not by production data. This is stated rather than
  papered over, because it is exactly the gap mutation 2 was written to expose.
- **The backlog item that restocks from this report still points at the catalog**, not at the
  report. Amending it is an operator-document edit and is not in this pull request.
- **No signed-in proof is offered**, because none is owed — see Deployment Authority. Nothing here
  reaches a runtime.

## Rollback Plan

Revert the single squash commit. The change is additive to a report and to one new test file; no
migration, no data, no runtime state, nothing to unwind. Reverting restores the counts-only report
and removes the suite that pins the names.

## Audit Evidence

- The PR opened for this record, and its CI run.
- The `AI surface control catalog` workflow job log on the merged SHA, which carries the roster
  section verbatim.
- `src/__tests__/behaviors/unlinked-control-roster.test.ts` — the seven cases, including the
  blinded-control positive that mutation 2 is caught by.
- The mutation table above, reproducible by applying each mutation to
  `scripts/audit/ai-surface-control-catalog.mjs` and running the suite.
