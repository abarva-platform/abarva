# 2026-09-20-hygiene-gate-warning-visibility — A warning that reached only the raw log

## Release ID

`2026-09-20-hygiene-gate-warning-visibility`

## Status

`candidate`

## Plain-English Summary

The hygiene gate has three verdicts. The third exists so a real finding that must not block
the run can still be reported as a finding — before it, a check that found something printed
the same line as a check that found nothing.

It printed that verdict to stdout and nowhere else. The workflow consults only the exit
status, so the finding reached the raw job log and no place a person looks: not the pull
request, not the run summary. And the gate's own closing line said `HYGIENE GATE: PASS`
whether or not anything had been found, so even a reader of the log saw a clean verdict.

A warning now also annotates the pull request under Actions, the run summary lists every
finding, and the closing line distinguishes a clean run from a warned one. **Warnings are
not promoted to failures** — the exit status is untouched, and the acceptance forbids it.

## Layer Impact

- `global-control-lane`. One CI gate script, a new sibling script holding its reporting, and
  its tests. No product surface, tenant data, schema, projection, migration, or runtime
  behaviour.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — a CI gate
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/integration/hygiene_gate_report.sh` — new. `hygiene_warn`,
  `hygiene_verdict_line`, `hygiene_write_step_summary`. Sourced by the gate; a missing file
  is fatal.
- `scripts/integration/hygiene_gate.sh` — routes `warn` through the reporting unit and ends
  with the reporting unit's verdict line.
- `src/__tests__/behaviors/hygiene-gate-warning-is-visible.test.ts` — new, 12 cases, all
  running the reporting rather than reading it.
- `src/__tests__/behaviors/hygiene-gate-exit-codes.test.ts` — its scratch-repo fixture
  copies the new sibling file.
- `src/__tests__/integration/ops/hygiene-gate-contract.test.ts` — one assertion repaired
  (see below).

## QA / Validation

| What | Result |
|---|---|
| New visibility suite | 12 passed |
| Three hygiene suites together | 48 passed, 1 pre-existing failure unchanged |
| `tsc --noEmit` | exit 0 |
| `eslint` on the three test files | exit 0 |
| Mutation harness, three directions | **8 mutations, 8 caught, 0 survived** |

Mutations: no annotation is ever emitted; the summary lists no findings; the summary is
never written; the gate stops routing warnings through the reporting; a warned run reports a
clean pass again; a failing run is reported as a pass; annotations are emitted outside
Actions too; a newline is passed through instead of escaped.

### Where a warning surfaces was not decided here — the repository had already answered it

The acceptance asks where a warning should surface: a job summary, an annotation, or a
periodic report. That is settled by precedent rather than opinion: **eleven workflows already
write to `$GITHUB_STEP_SUMMARY`, and several already emit `::warning::` annotations.** This
follows the existing convention instead of adding a fourth one, so the item needed no owner
decision. The workflow file itself is unchanged — Actions provides
`$GITHUB_STEP_SUMMARY` to every step, so the gate writing to it is sufficient.

### Two findings the item did not name

- **There is exactly one `warn` call site** in the whole gate. The invisibility is real but
  its blast radius today is a single check.
- **The closing verdict line hid warnings too.** `HYGIENE GATE: PASS` printed whenever
  nothing failed, so the top line a reader trusts read identically for a clean run and a
  warned one. Fixing only the annotation would have left that in place.

### Verification notes

- **The real gate was run, not just the unit.** With `GITHUB_ACTIONS` and
  `GITHUB_STEP_SUMMARY` set, a live run emitted one annotation and wrote a summary listing
  the finding. A new `source` line and a written file are exactly what a unit test cannot
  prove.
- **That run also caught a type error in the new test** before the typecheck did, which is
  the gate doing its job.
- **A CI-only defect in the new suite was found and proven, not reasoned about.** The
  helper first inherited the ambient environment wholesale, so `GITHUB_ACTIONS` — always set
  in CI — would leak into the case asserting that no annotation is emitted outside Actions.
  Measured both ways: the inheriting version passes locally and **fails under
  `GITHUB_ACTIONS=true`**. Green on a developer's machine, red on the only machine whose
  answer matters. The environment is now explicit.
- **A missing reporting file is fatal.** There is no `set -e` in the gate, so a failed
  source would print an error and carry on — running every check, finding things, reporting
  none of them, and still exiting 0. A gate that cannot report is worse than one that did
  not run, because its exit status still reads as assurance.

### The one assertion repaired, and the one failure left alone

`script has PASS/FAIL summary` grepped the gate for the literal strings `HYGIENE GATE: PASS`
and `HYGIENE GATE: FAIL`. Moving the verdict into the sourced unit turned it red while the
behaviour was intact — which is the tell that it measured the text, not the gate. It now
runs the verdict function for three states and checks each is the verdict for that state.

The suite's other failure — `script does NOT contain destructive commands` — **was already
failing on `main` before this change and is left failing.** It greps the gate's source for
`git stash pop` and matches the warn message's own prose, which tells the operator *not* to
run it. That is the scanner-cannot-tell-the-thing-from-prose-about-the-thing shape, it is the
declared subject of a separate open item covering that file, and weakening it to make this
suite green is exactly what should not happen here.

## Rollout Plan

Merge to `main`. The gate runs on every PR; the next run carries the annotation and summary.
No image build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime surface changes
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting restores a gate whose
warnings reach only the raw log.

## Audit Evidence

- The PR diff.
- The live gate run: one annotation emitted, summary written with the finding listed.
- The eight mutation results, and the two-line measurement showing the ambient-environment
  version passing locally and failing under CI conditions.

## Known Gaps

- The pre-existing source-text failure described above is untouched and still red. It
  belongs to the open item covering that file.
- Only one check in the gate warns today, so the annotation path has one real producer. The
  reporting is general, but its live exercise is narrow.
