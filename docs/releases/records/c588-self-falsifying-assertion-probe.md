# c588-self-falsifying-assertion-probe — Find assertions an ordinary act of writing can falsify, by perturbing rather than parsing

## Release ID

`c588-self-falsifying-assertion-probe`

## Status

`candidate`

## Plain-English Summary

Some tests in the operator-tooling directory read working documents that the team's own agents
append notes to. A test written the wrong way round checks that a particular piece of text is
**absent** from one of those documents — which means writing a note can break the test while the code
it is supposed to be checking is perfectly correct. Two such tests were found by hand and repaired in
an earlier change. Nothing stopped a third being written.

This release adds a tool that finds them. It does not read the tests looking for suspicious-looking
code, because that was tried and discarded: hundreds of assertion sites match the obvious textual
patterns and nearly all of them are legitimate. Instead it **writes into a copy** of the working
documents — one ordinary note, in each document's own house style — and runs every suite twice, once
against the untouched copy and once against the written-in one. Any test whose verdict changes was
depending on what people had lately written rather than on whether the code is right. No list of
suspicious literals is maintained anywhere, and nothing is parsed.

The tool was calibrated before being trusted. Pointed at the two tests the earlier change repaired,
with those repairs undone, it finds both — and it named two more that nobody had classified, of a
shape no parser built on the earlier shape list could have matched. Checked against the four
look-alike cases that earlier change examined and deliberately left alone — including one where
checking for absence is genuinely the right thing to do — it leaves all four alone. Its false-alarm
rate was measured at four settings rather than assumed.

No product behaviour changes. No runtime, schema, tenant data, route or user-facing surface is
touched, and no new required CI job is added.

## Layer Impact

Release lane: **`internal-admin`** — AbarVa-only operations tooling. No client-facing surface and no
data plane, so neither `global-control-lane` nor `client-data-lane`.

None of the four data-operating-model layers is affected. This is repo-owned developer tooling: one
new module and its suite under `scripts/exec/`. No intake tab, source adapter, canonical object or
product projection changes, and no tenant data is read or written. The tool reads copies of operator
documents and writes only inside a temporary sandbox it creates and removes.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — operator/agent execution tooling and its tests
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/self-falsifying-assertion-probe.mjs` — new. Copies the operator documents to two
  sandbox roots, appends one in-grammar line per document to one of them, runs every
  `scripts/exec/*.test.mjs` suite against each, and reports every case whose verdict flips. Four
  nested perturbation sources (`none`, `case-names`, `source-literals`, `whole-source`) and four
  vehicles (`register`, `backlog`, `pulse`, `backlog-filing`). Exits 1 when it falsifies something,
  and exits 2 rather than reporting a clean run when there is nothing to perturb.
- `scripts/exec/self-falsifying-assertion-probe.test.mjs` — new, 91 cases.
- This release record.

**No workflow file is touched, and the suite is gated anyway.** The required sweep in
`.github/workflows/hygiene-gate.yml` is `for suite in scripts/exec/*.test.mjs`, a glob, so the
sixteenth suite is covered by the required context `Run hygiene_gate.sh` the day it lands. That is
not the same thing as wiring a new required job, which `C-588` forbids and `C-582` owns. Cost to
that job: **1.4s**, measured with no operator corpus, against a job that runs ~4m59s on a 15-minute
budget.

## QA / Validation

### Baseline over the same scope

| scope | before, on `origin/main` `d756684bf6` | after |
|---|---|---|
| all `scripts/exec/*.test.mjs` | 15 suites, 1,324 assertions, **0 failed** | 16 suites, 1,415 assertions, **0 failed** |

0 failing before, 0 failing after. The rise is the new suite's 91 cases.

Run with **no operator corpus**, the state on every CI runner, the new suite reports 89 passed, 0
failed, 2 skipped — the two cases that read a live register name themselves as skipped rather than
passing silently.

`npx eslint` on both new files exits **0**. `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` exits **0** with zero diagnostic lines, run with `tsconfig.tsbuildinfo` removed and
the exit code judged rather than grepped. `node scripts/release-check.mjs --base origin/main --head
HEAD` → 11 of 11 gates ran and passed.

### Calibration (a) — RED on both known positives

The item's precondition: *a harness that cannot rediscover the two cases it was built from has
established nothing.* Both `C-587` repairs were undone in a sandbox copy of the directory
(`git show 0d7b02c6f7^:scripts/exec/<suite>.test.mjs`; neither module file has changed since, so this
reverts the repairs and nothing else), and the probe was pointed at it.

| known positive | suite | found | vehicle needed |
|---|---|---|---|
| `!raw.includes(LIVE_NAMED.sha)` — "no register line quotes that SHA as a full forty-character handle" | `register-merge-coverage` | **YES**, 52/0 → 51/1 | default (`register`) |
| `!byId.has("T-720")` — "the live backlog does NOT report the id whose second filing was renumbered away" | `id-collision` | **YES**, 71/0 → 68/3 | `backlog-filing` |

**2 of 2.** Reproducible:

```
WT=$(pwd); SB=$(mktemp -d); cp $WT/scripts/exec/*.mjs $WT/scripts/exec/*.json $SB/
git show 0d7b02c6f7^:scripts/exec/id-collision.test.mjs            > $SB/id-collision.test.mjs
git show 0d7b02c6f7^:scripts/exec/register-merge-coverage.test.mjs > $SB/register-merge-coverage.test.mjs
node scripts/exec/self-falsifying-assertion-probe.mjs --suite-dir $SB \
  --suite id-collision --suite register-merge-coverage --source source-literals \
  --vehicle register --vehicle backlog --vehicle pulse --vehicle backlog-filing
```

Both pre-repair suites are **green on the live corpus today** (`id-collision` 71/0,
`register-merge-coverage` 52/0), so the assertions are *latently* falsifiable rather than currently
red. Only a perturbation shows that, which is the whole case for the technique.

**Two cases nobody had classified came with it**, and they are the argument for perturbing rather
than parsing. In the same run, `id-collision`'s two live cases `the live backlog reports T-721 /
T-727, which the existing detector cannot see` also went pass → fail. Both assert `found.count === 2`
over the live backlog. That matches **none** of the four textual shapes the hand enumeration searched
for — `!x.includes(...)`, `=== 0`, `not.toMatch`, `toHaveLength(0)` — so no parser built on that
shape list could have reported them, and they are still on `main`.

They also sharpen what the class is. "Absence-shaped" is the wrong description; the property all four
share is that **a write which leaves the reader correct can still turn the case red.** An exact-count
assertion pinned to a live corpus has it exactly as much as an absence assertion does.

### Calibration (b) — GREEN on all four recorded rule-outs

`C-587` examined four look-alikes and left each alone with a stated reason. A probe that flags them is
a probe the next agent will rightly ignore. Measured over all 16 suites at the default source and
vehicles, **and again under `backlog-filing`**:

| rule-out | shape | probe verdict |
|---|---|---|
| `id-collision` — window closed to 0.001h, `now` pinned to a past instant | `=== 0` on a live-register count, where absence genuinely IS the property | **not reported** |
| `fossil-claims` — six zero-counts on failure lists from the real parser | presence direction | **suite did not move at all** |
| `register-time-authority` — two byte-presence blocks plus a sha256 | presence, deliberate: the register is append-only | **not reported** |
| `build-execution-queue` — zero-counts over a mutated copy of the corpus | the mutation is the mechanism under test | **suite did not move at all** |

The window-closed case is the one that mattered most, and the probe is structurally right about it:
the probe **appends**, and no appended line can land inside a 3.6-second window days in the past.

### Calibration (c) — the perturbation source, measured

The four sources are nested, so noise can only rise along the chain and the question is where it
stops buying signal. Each row is a full scan of all 16 suites, baseline and perturbed, on
`origin/main`, with the default vehicles.

| source | bytes appended | suites moved of 16 | cases pass → fail | rediscovers positive 1 |
|---|---|---|---|---|
| `none` | 18 KiB | **0** | **0** | no — it is the floor, by construction |
| `case-names` | 273 KiB | **0** | **0** | **no** |
| `source-literals` (default) | 2,523 KiB | **0** | **0** | **yes** |
| `whole-source` | 2,909 KiB | **0** | **0** | yes |

**The floor is clean**: the probe's own prose, appended to all three documents, moves nothing. Any
non-zero result at a wider source is therefore attributable to the quoted literals, not to the act of
appending.

**The item's prediction about `whole-source` was measured and did not hold.** It warned that
blanket-appending a suite's own source "may move `fossil-claims` and `build-execution-queue` counts
for unrelated reasons and needs its noise floor measured, not assumed". Measured: it does not — the
noise floor is 0 at every setting including the maximal one. `whole-source` is still not the default,
because it buys nothing over `source-literals` and costs more.

**`case-names` is the obvious choice and it is insufficient, for the reason the item predicted:**
neither literal `C-587` repaired ever appears in a case name. Asserted in the suite over a fixture,
so it cannot quietly stop being true.

**Vehicle noise, measured separately.** `backlog-filing` is declared but kept out of the default set.
The backlog's filing channel is item position — `## Item <id> — …` or an item-table row — so a dated
prose note about an id, however long, gives that id no second filing: with the `backlog` note
vehicle, `T-720`'s occurrence count is 3 on both sides and the case stays green at 71/0. Reaching it
needs a heading in item position, which is a second *filing* of that id, so the vehicle cannot
distinguish "the assertion is self-falsifying" from "the reader correctly reported a duplicate
somebody really made". It is offered because it is the only thing that rediscovers the second known
positive, and withheld from the default because on any wider source it files every id a suite
mentions. On current `main` it moves exactly one suite — `id-collision`, 2 cases pass → fail, the
`T-721` and `T-727` count assertions discussed above — and the four rule-outs stay green under it
too, so its over-perturbation is bounded rather than merely asserted.

**Every vehicle was proved to land, because a negative result needs independent truth.** Calibration
(a) proves the `register` vehicle lands, since it flips a real case; the backlog note and the pulse
entry flip nothing *by design*, so nothing else would catch them going quiet. Read from a kept
sandbox over the live-sized corpus: each of the three documents grows by ~28.7 KiB and carries
**exactly one** probe line, with **zero** in the baseline copy; the appended register line parses as
exactly one register entry with `announcesMerge: false` and no pull-request reference; the appended
backlog heading is present and **not** in item position. A case in the suite asserts the same three
properties over a fixture corpus so the result cannot silently stop holding.

### Three defects found in the probe itself

Recorded rather than quietly fixed, because in each case it was one of the probe's own controls that
caught it.

1. **It overrode the mechanism a suite uses to control its own corpus.** The first form set
   `SOURCE_EXECUTION_HOME` and `EXEC_OPERATOR_ROOT` as well as `HOME`. Those two are how a suite
   points its *own* fixture at a controlled corpus, so setting them globally overrode an absence a
   case constructs: `id-collision` went 71 passed / 0 failed to **70 / 1 in the baseline run**, before
   any perturbation, on the case asserting the tool says `NOT READ` when no register is present. The
   baseline control contained it — an already-red case cannot be reported as a flip — but a red
   baseline case can no longer flip pass → fail, so the probe was *blind* on it. `HOME` is now the
   only substitution and the other two are **deleted** from the child environment, so a value the
   caller had set cannot leak in either.
2. **The register renderer flattened its own grammar head.** It ran the whole line, including
   `stamp | identity |`, through the pipe-neutraliser meant only for the body, so the register's
   parser read the line's agent as `unknown` and the line was not an entry at all. Killed by the case
   `and the identity it was given`.
3. **It computed a blind spot and threw it away.** The per-case channel is keyed on the case *name*,
   so a label printed twice collapses to one entry holding the last verdict and a flip on an earlier
   occurrence is invisible. The probe built that list of collapsed labels from the start and discarded
   it; it now reports it per suite and as a count. Measured on `origin/main` with the corpus present:
   **7 labels**, 5 in `register-time-authority.test.mjs` (16 printed lines) and 2 in
   `append-claim.test.mjs` (4) — 20 lines in all; the new suite contributes none.

   **Making it report that number is what caught a wrong measurement — mine.** The figure was first
   taken by hand as *32 across 4 suites*. The probe answered 7 across 2. The hand method was wrong:
   it stripped a trailing `" — …"` from every printed line in order to drop a SKIP's reason, and so
   truncated every *label* containing an em-dash, collapsing distinct cases into one and inventing
   duplicates — it returns 22 for `register-time-authority` alone. Independent truth, an `awk` pass
   stripping the reason only on `SKIP` lines where the reason actually lives, returns 7 across 2 and
   agrees with the probe. A number computed and discarded could not have been contradicted.

### Necessity proved by mutation — 11 of 11 caught

The corpus cannot be controlled, so every mutation is on code. Baseline 91 passed / 0 failed before
each; restored and re-verified green after each.

| mutation | case(s) killed |
|---|---|
| M1 `diffSuiteRuns` reports every shared case as a flip, red or not | `a case that changed its verdict is a flip, and only that case`; `a case that was already red and stayed red is NOT a flip`; `two identical runs move in no channel at all` |
| M2 the `fail-only` dialect claims its passing cases are visible | `and it is reported as having NO visible pass lines, rather than as having no cases` |
| M3 the register renderer flattens its own grammar head with the body | `and the identity it was given`; `and the appended line parses as exactly one register line in that copy` |
| M4 `mentionedItemIds` accepts a bare three-digit number as a lane id | `a lane id is read from a literal; a bare THREE-DIGIT number is not` |
| M5 the backlog NOTE writes its heading in item position | `but NOT one in item position — which is the measured reason a prose note flips nothing` |
| M6 an unknown `--source` is accepted and treated as the default | `an unknown --source exits 2 rather than defaulting` |
| M7 `backlog-filing` is promoted into the default vehicle set | `a default plan appends to the register, the backlog and the pulse`; `backlog-filing is a declared vehicle but NOT a default one`; `and the backlog document carries exactly one probe line` |
| M8 the probe stops clearing the two variables, so the caller's values leak in | `HOME is the probe's only substitution …`; `and that holds in the perturbed run too` |
| M8b the probe points the two variables at the sandbox instead of clearing them | the same two |
| M9 a collapsed label is computed and then discarded from the report | `a collapsed label reaches the report BY NAME`; `and the report's collapsed-label count is that blind spot as a number, not zero` |
| M10 the probe exits 0 even when it falsified something | `it exits 1 when it falsified something, so its silence is usable` |

**Two drafts of this proof were themselves wrong, and both are recorded because each produced a
false reading.** The first driver reverted between mutations with `git checkout --`, which restores
`HEAD` and silently discarded five uncommitted edits to the file under test; every row after the
first was then measured against the committed version rather than the working one. It now restores
from a scratchpad copy of the file under test. And the first `M8` **survived a case that was in fact
correct**: it replaced the `const env` line while leaving the two `delete` statements standing, so
they cleared exactly what the mutation had set. A mutation that does not reproduce the defect proves
nothing about the case that would have caught it; the faithful form removes the deletes.

### Scope note on the suite's own shape

This suite is written under the rule the probe enforces: **no case in it asserts that a literal is
absent from an operator document.** The two cases that read the live register assert only that
appending the probe's own line makes its quoted subject findable, and that the appended line parses
as one register entry — properties of the append, never of the corpus. A case asserting the "before"
state would be the next instance of the defect, and `C-587` already discarded one draft repair for
exactly that.

The document list the sandbox copies is derived, not curated: a case scans every non-test `.mjs` in
the directory for operator filenames and fails if any is missing from `OPERATOR_DOCUMENTS`, so a
document added to a script cannot silently fall out of the sandbox. A second case asserts that scan
found documents at all, so an empty scan cannot pass it vacuously.

All three output dialects in the directory were found by reading all fifteen suites rather than
assumed from one, and the detection was checked against the real set: 14 suites `pass-fail-skip`, 1
`ok-fail` (`register-citation-check`), 1 `fail-only` (`worktree-sweep-hazard`).

## Rollout Plan

Merge to `main` by squash. No Azure Container Apps image build, no deploy, no migration, no feature
flag, no runtime rollout. The change is one module and one suite that run under `node`; the module is
invoked by hand and the suite joins the existing required glob.

**Where it should run is deliberately not decided here.** The item forbids wiring a required CI job
and `C-582` owns the requiredness question for corpus-reading cases. The recommendation is in
*Known Gaps*.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, deploy workflows, runtime images,
feature flags, environment variables, worker jobs, traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: not invoked
- Shared runtime mutators: none
- Approved image digest: n/a — no runtime image change
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no** — no product surface changes

## Rollback Plan

Revert the squash commit. There is no state to unwind: no migration, no runtime object, and no
document outside a temporary sandbox is written by this change. Reverting removes a diagnostic and
leaves the two `C-587` repairs in place, so nothing regresses — the class simply goes back to being
enumerated and unguarded.

## Audit Evidence

- The pull request for this record, and its squash commit on `main`.
- `node scripts/exec/self-falsifying-assertion-probe.test.mjs` → 91 passed, 0 failed, 0 skipped; with
  `HOME` pointed at an empty directory → 89 passed, 0 failed, 2 skipped.
- All 16 suites: `for f in scripts/exec/*.test.mjs; do node "$f"; done` → 1,415 passed, 0 failed.
- Calibration (a), reproducible from the four-command block above.
- Calibrations (b) and (c), reproducible as four full scans:
  `node scripts/exec/self-falsifying-assertion-probe.mjs --source <none|case-names|source-literals|whole-source> --json`,
  plus one with `--vehicle register --vehicle backlog --vehicle pulse --vehicle backlog-filing`.
- The eleven mutations in the necessity table, each a one-line edit named exactly in that table.
- `npx eslint` exit 0 on both new files; `npx tsc --noEmit` exit 0; `release-check` 11 of 11.
- The item's claim and release lines in the operator register.

## Known Gaps

- **Where this runs is not decided, on purpose.** `C-582` owns requiredness for corpus-reading cases,
  and pre-empting it here is the boundary `C-587` also respected. The recommendation, as a
  recommendation: run it on the operator host, on a schedule or on demand, and **not** as a required
  pull-request context — a CI runner has no operator corpus to perturb, so such a gate would measure
  nothing and pass, which is the shape of gate this whole backlog exists against. The
  `--operator-root` absent path exits 2 rather than reporting a clean run precisely so a misplacement
  is loud.
- **Two unclassified cases are now named and not repaired.** `id-collision`'s `T-721` and `T-727`
  count assertions are pinned to the live backlog's current state. They are reported here rather than
  changed, because repairing a count assertion over a live corpus is a second item's work and this
  release's job was to establish the class can be found. They are not reachable by the default
  vehicles, so a default run stays silent about them.
- **The probe is blind on an already-red case.** A case failing in the baseline cannot flip
  pass → fail, so the probe says nothing about it. Every baseline red is reported per suite for that
  reason.
- **One suite prints nothing on a pass.** `worktree-sweep-hazard.test.mjs` emits no per-case line for
  a passing case, so a flip there is visible only as a new `FAIL` line plus a moved total. The report
  names it under `blindSuites` rather than leaving the gap implicit.
- **Seven case labels collapse.** Measured and reported above; the totals channel still covers them,
  the per-case channel cannot.
- **`backlog-filing` cannot separate a self-falsifying assertion from a true duplicate filing.**
  Measured and stated above; it is why that vehicle is not a default.
- **The probe runs every suite twice.** A full scan of 16 suites is roughly three minutes of
  wall-clock on the operator host — cheap for an on-demand diagnostic, noticeable in a
  per-pull-request context, which is a second reason for the placement recommendation above.
- **The probe perturbs; it never removes.** An assertion falsifiable by something being *deleted*
  from an operator document is outside what this measures. The documents in question are append-only
  by convention, which is why that direction was not built, but the convention is not enforced by
  this tool.
