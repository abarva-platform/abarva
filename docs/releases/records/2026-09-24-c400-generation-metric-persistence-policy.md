# 2026-09-24-c400-generation-metric-persistence-policy — Persist the exhibit-shortfall metrics, and stop the allowlist dropping the next field

## Release ID

`2026-09-24-c400-generation-metric-persistence-policy`

## Status

`candidate`

## Plain-English Summary

When a generated deliverable asks for three exhibits and only one arrives, the quality gate already
notices: it raises an advisory and docks the quality score. What it did not do was record the
numbers. The three fields the gate computes — how many exhibits were expected, how many of those
arrived, and which ones did not — were never written to the artifact's stored metrics, so nobody
could ask how often exhibits go missing or which ones go missing most.

The reason is more interesting than the symptom, and it is what this change fixes. The function
that writes per-generation metrics listed ten field names by hand. An explicit list over a type
that keeps growing cannot fail: a field added to the measured type and forgotten in the list is
dropped in silence, and nothing compared the two lists. The three exhibit fields were exactly that.

The hand-written list is now a policy keyed by the metrics type itself. Every field the quality
gate measures must say whether it is persisted, and when it is not, why — in one place, in prose a
reader can check. A field added to the metrics type and not named in that policy **does not
compile**. The writer copies fields by walking the policy rather than by naming them, so it cannot
drift from the type again.

One deliberate detail: a brief that declared no expected exhibits records **no** exhibit fields at
all, rather than a count of zero. "Not measured" and "measured, none expected" are different facts,
and a zero reads as the second.

## Layer Impact

- **Layer 4 — Products (Moves / Source deliverables).** Per-generation quality metrics stored
  alongside a generated artifact gain three fields. No product surface renders differently; nothing
  a signed-in user sees changes.
- **Layer 3 — Canonical model.** Unchanged. No schema, migration, or tenant data change: the
  metrics are written into the existing `generationMetrics` metadata object.

## Client Applicability

- All clients: yes, for artifacts generated after this deploy — three additional fields in the
  stored per-generation metrics, and only when the brief declared expected exhibits.
- Specific clients: none.
- Internal only: the metrics are an internal quality/telemetry record, not client-facing output.
- Public/demo only: no.
- Feature flag: none. The writer runs on every persisted deliverable, as it did before.

## Changes Included

- `src/lib/deliverables/orchestrator/persistence.ts` — adds `QUALITY_METRIC_PERSISTENCE`, a
  `Record<keyof QualityMetrics, …>` policy with a stated reason for every field that is not
  persisted, and rewrites `buildGenerationMetrics` to copy metric fields by walking that policy.
  Three previously dropped fields (`expectedExhibitCount`, `receivedExpectedExhibitCount`,
  `missingExpectedExhibits`) are now persisted; an absent value stays absent.
- `src/__tests__/behaviors/c400-generation-metric-persistence.test.ts` — new behavioral suite.

No other file changed. No migration, no route, no script, no flag.

## QA / Validation

**Red first, then green, same command and same scope both sides.** The focused suite was run
against a `persistence.ts` restored byte-for-byte from `origin/main` before the fix was applied:

- Before: **7 failed / 1 passed** of 8.
- After: **8 passed / 0 failed**.

The one case that passed before is *"omits the exhibit fields entirely when the brief declared no
expected exhibits"*, and it passed **vacuously** — at base the fields were never persisted under
any condition, so there was nothing for it to distinguish. It is meaningful only after the change,
which is why it is mutation-checked below rather than counted as prior coverage.

**Seven mutations, seven caught, each by the case written for it.** Every persisted field is
mutated independently, because a single assertion over the whole object passes when one field is
wrong:

| # | Mutation | Result |
|---|---|---|
| M1 | `expectedExhibitCount` flipped to not-persisted | 2 failed — *"persists how many exhibits the brief asked for"* |
| M2 | `receivedExpectedExhibitCount` flipped to not-persisted | 2 failed — *"persists how many of the expected exhibits arrived"* |
| M3 | `missingExpectedExhibits` flipped to not-persisted | 2 failed — *"persists which expected exhibits did not arrive"* |
| M4a | absent-stays-absent guard removed (undefined copied through) | 1 failed — the no-expected-exhibits case |
| M4b | absent coerced with `?? 0` (a phantom zero) | 1 failed — the no-expected-exhibits case |
| M5 | a not-persisted field's reason left empty | 1 failed — *"states a reason for every field it does not persist"* |
| M6 | a new field added to the metrics **type** and not to the policy | **`tsc` exit 2**, exactly one diagnostic, naming the missing field at `persistence.ts:145` |
| M7 | the validator made to emit a metric the policy does not name | 1 failed — *"names every field the quality gate actually emits"* |

M6 is the compile-time half of the reconciliation and M7 the run-time half: the first proves a
field added to the declared type cannot be dropped quietly, the second proves a field that reaches
the gate's output without reaching the type is caught too. `types.ts` and `quality-validator.ts`
were restored after M6 and M7 and confirmed byte-identical by `git diff --stat` reporting nothing.

**Regression baseline, same command and same scope on both sides.**
`src/lib/deliverables/orchestrator/__tests__`: **25 suites / 322 tests passing before, 25 / 322
passing after** — identical, so no existing expectation moved.

**A pre-existing non-deterministic failure in `src/__tests__/behaviors`, stated rather than
absorbed.** That directory does not return a stable result on this machine, on this branch **or on
a pristine worktree of `origin/main` with none of these changes present**: two runs of the clean
base failed 1 and then 2 of 122 suites, and runs on this branch failed between 0 and 9 of 123.
Every failure is the same cause — `scripts/quality/test-ci-coverage-census.mjs` dies with
`ENOENT` on `src/lib/agent/__tests__/t743-coverage-probe.generated.test.ts`, a transient probe file
that is created and removed while other suites are enumerating and reading the test tree. This is
the class the jest config's own comment describes; its global setup/teardown hooks close the
leaked-file window between runs, not the window **within** one. Each affected suite passes when run
alone, and the census suite passes alone at 43/43. Not caused by this change and not fixed by it —
recorded so the next reader does not attribute it here.

**Typecheck and lint, judged by exit code.**
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` after removing a stale
`tsconfig.tsbuildinfo`: **exit 0, zero diagnostics**. `npx eslint` over both changed files: exit 0.
`node scripts/release-check.mjs --base origin/main --head HEAD`: recorded on the PR.

## Rollout Plan

Squash merge to `main`. The repo-owned `aca-main-deploy` workflow builds the image and shifts
traffic; no manual Azure command, no migration, no flag. The change takes effect for deliverables
generated after the new revision takes 100% traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, triggered by the merge.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded on the PR after the deploy run completes.
- ACA runtime invariant: to be proven after deploy — Container App template image must equal the
  image of the sole 100%-traffic revision.
- Worker image invariant: unchanged by this diff.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no.** Nothing rendered differs; the change writes an internal
  metrics object. A signed-in lane here would be a proof with no subject.

## Rollback Plan

Revert the single commit. No migration to unwind and no data to repair: the change adds keys to a
metrics object written per generation, so a revert simply stops adding them and leaves records
written in between valid and readable.

## Audit Evidence

- PR URL and CI run: on the PR.
- The behavioral suite `src/__tests__/behaviors/c400-generation-metric-persistence.test.ts`, which
  drives the real quality gate into the real persist path with the repository save injected.
- The before/after and mutation numbers in **QA / Validation** above.

## Known Gaps

- Eleven composition signals and the leaked-tag list remain **deliberately not persisted**, each
  with its reason stated in the policy. Persisting any of them is a metric-series decision and was
  not taken here; the policy makes the omission declared rather than silent.
- The non-deterministic `src/__tests__/behaviors` failure described above is open and pre-existing.
  It belongs to the transient-probe-file class already identified in the jest configuration; the
  remaining within-run window is not closed by this change.
