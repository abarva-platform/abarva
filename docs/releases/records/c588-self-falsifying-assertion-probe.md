# c588-self-falsifying-assertion-probe — Find assertions an ordinary act of writing can falsify, by perturbing rather than parsing

## Release ID

`c588-self-falsifying-assertion-probe`

## Status

`candidate`

## Plain-English Summary

Some tests in the operator-tooling directory read working documents that the team's own agents
append notes to. A test written the wrong way round checks that a particular piece of text is
**absent** from one of those documents — which means writing a note can break the test while the
code it is supposed to be checking is perfectly correct. Two such tests were found by hand and
repaired in an earlier change. Nothing stopped the third being written.

This release adds a tool that finds them. It does not read the tests looking for suspicious-looking
code, because that was tried and it over-reports: hundreds of assertion sites match the obvious
textual patterns and nearly all of them are legitimate. Instead it **writes into a copy** of the
working documents — one ordinary note, in each document's own house style — and runs every suite
twice, once against the untouched copy and once against the written-in one. Any test whose verdict
changes was depending on what people had lately written rather than on whether the code is right.
No list of suspicious literals is maintained anywhere, and nothing is parsed.

The tool was calibrated before being trusted. It was pointed at the two tests the earlier change had
repaired, with those repairs undone, and it found both. It was then checked against the four
look-alike cases that earlier change examined and deliberately left alone — including one where
checking for absence is genuinely the right thing to do — and it leaves all four alone. Its
false-alarm rate was measured at four different settings rather than assumed, and the setting that
is both quiet and complete is the default.

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

- `scripts/exec/self-falsifying-assertion-probe.mjs` — new. A perturbation probe:
  copies the operator documents to two sandbox roots, appends one in-grammar line per document to
  one of them, runs every `scripts/exec/*.test.mjs` suite against each, and reports every case whose
  verdict flips. Four nested perturbation sources (`none`, `case-names`, `source-literals`,
  `whole-source`) and four vehicles (`register`, `backlog`, `pulse`, `backlog-filing`). Exits 1 when
  it falsifies something.
- `scripts/exec/self-falsifying-assertion-probe.test.mjs` — new, 76 cases.
- This release record.

**No workflow file is touched, and the suite is gated anyway.** The required sweep in
`.github/workflows/hygiene-gate.yml` is `for suite in scripts/exec/*.test.mjs`, a glob, so the
sixteenth suite is covered by the required context the day it lands. That is not the same thing as
wiring a new required job, which `C-588` forbids and `C-582` owns.

## QA / Validation

### Baseline over the same scope

| scope | before, on `origin/main` | after |
|---|---|---|
| all `scripts/exec/*.test.mjs` | 15 suites, 1,323 assertions, **0 failed** | 16 suites, 1,399 assertions, **0 failed** |

0 failing before, 0 failing after. The rise is the new suite's 76 cases.

Run with **no operator corpus at all**, which is the state on every CI runner, the new suite reports
74 passed, 0 failed, 2 skipped — the two cases that read a live register name themselves as skipped
rather than passing silently.

`npx eslint` on both new files exits **0**. `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` exits **0** (exit code judged, not grepped).

### Calibration (a) — RED on both known positives

The item's precondition: *a harness that cannot rediscover the two cases it was built from has
established nothing.* Both `C-587` repairs were undone in a sandbox copy of the directory
(`git show 0d7b02c6f7^:scripts/exec/<suite>.test.mjs`; neither module file has changed since, so
this is a clean revert of the repairs and nothing else), and the probe was pointed at it.

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

**Two cases nobody had classified came with it**, and they are the argument for perturbing rather
than parsing. In the same run, `id-collision`'s two live cases `the live backlog reports T-721 /
T-727, which the existing detector cannot see` also went pass → fail. Both assert `found.count === 2`
over the live backlog. That matches **none** of the four textual shapes the hand enumeration
searched for — `!x.includes(...)`, `=== 0`, `not.toMatch`, `toHaveLength(0)` — so no parser built on
that shape list could have reported them, and they are still on `main` today.

They also sharpen what the class actually is. "Absence-shaped" is the wrong description; the property
all four share is that **a write which leaves the reader correct can still turn the case red.** An
exact-count assertion pinned to a live corpus has it exactly as much as an absence assertion does.

### Calibration (b) — GREEN on all four recorded rule-outs

`C-587` examined four look-alikes and left each alone with a stated reason. A probe that flags them
is a probe the next agent will rightly ignore. At the default source and vehicles, over all 16
suites:

| rule-out | shape | probe verdict |
|---|---|---|
| `id-collision` — window closed to 0.001h, `now` pinned to a past instant | `=== 0` on a live-register count, where absence genuinely IS the property | **not reported** |
| `fossil-claims` — six zero-counts on failure lists from the real parser | presence direction | **suite did not move at all** |
| `register-time-authority` — two byte-presence blocks plus a sha256 | presence, deliberate: the register is append-only | **not reported** |
| `build-execution-queue` — zero-counts over a mutated copy of the corpus | the mutation is the mechanism under test | **suite did not move at all** |

The window-closed case is the one that mattered most and it is the one the probe is structurally
right about: the probe **appends**, and no appended line can land inside a 3.6-second window days in
the past.

### Calibration (c) — the perturbation source, measured

The four sources are nested, so noise can only rise along the chain and the question is where it
stops buying signal. Each row is a full scan of all 16 suites, baseline and perturbed, on
`origin/main`, with the default vehicles.

| source | bytes appended | suites moved of 16 | cases pass → fail | rediscovers positive 1 |
|---|---|---|---|---|
| `none` | 18 KiB | **0** | **0** | no (by construction — it is the floor) |
| `case-names` | PENDING | PENDING | PENDING | **no** |
| `source-literals` | PENDING | PENDING | PENDING | **yes** |
| `whole-source` | PENDING | PENDING | PENDING | yes |

`none` is the floor and it is clean: the probe's own prose, appended to all three documents, moves
nothing. Any non-zero result at a wider source is therefore attributable to the literals, not to the
act of appending.

`case-names` is the obvious choice and it is **insufficient, for the reason the item predicted**:
neither literal `C-587` repaired ever appears in a case name. Asserted directly in the suite over a
fixture, so it cannot quietly stop being true.

`whole-source` is the maximal perturbation and is not the default.

**Vehicle noise, measured separately.** `backlog-filing` is declared but kept out of the default
set. The backlog's filing channel is item position — `## Item <id> — …` or an item-table row — so a
dated prose note about an id, however long, gives that id no second filing: with the `backlog` note
vehicle, `T-720`'s occurrence count is 3 on both sides of the probe and the case stays green at
71/0. Reaching it needs a heading in item position, which is a second *filing* of that id, so the
vehicle cannot distinguish "the assertion is self-falsifying" from "the reader correctly reported a
duplicate somebody really made". It is offered because it is the only thing that rediscovers the
second known positive, and withheld from the default because on any wider source it files every id a
suite mentions.

### Red-first, and the defect found in the probe itself

The probe's red proof is calibration (a): before it existed, nothing could rediscover either case,
and the pre-`C-587` suites are green on the live corpus today (`id-collision` 71/0), so the
assertions are *latently* falsifiable rather than currently red. Only a perturbation shows that.

Building it surfaced a real defect in its own first form, recorded because the baseline control is
what caught it. That form set `HOME`, `SOURCE_EXECUTION_HOME` **and** `EXEC_OPERATOR_ROOT` at the
child. Those last two are how a suite points its own fixture at a controlled corpus, so setting them
globally overrode an absence a case constructs: `id-collision` went 71 passed / 0 failed to **70 / 1
in the baseline run**, before any perturbation, on the case asserting the tool says `NOT READ` when
no register is present. The baseline control contained it — an already-red case cannot be reported as
a flip — but a red baseline case can no longer flip pass → fail, so the probe was *blind* on it.
`HOME` is now the only substitution and the other two are deleted from the child environment.

A second defect, caught by the suite: the register renderer ran its own `stamp | identity |` head
through the pipe-neutraliser meant for the body, so the register's parser read the line's agent as
`unknown` and the line was not a register entry at all. Killed by `and the identity it was given`.

### Necessity proved by mutation

The corpus cannot be controlled, so every mutation is on code.

| mutation | effect |
|---|---|
| PENDING | PENDING |

### Scope note on the suite's own shape

This suite is written under the rule the probe enforces: **no case in it asserts that a literal is
absent from an operator document.** The two cases that read the live register assert only that
appending the probe's own line makes its quoted subject findable and that the appended line parses
as one register entry — properties of the append, never of the corpus. A case asserting the "before"
state would be the next instance of the defect, and `C-587` already discarded one draft repair for
exactly that.

The document list the sandbox copies is derived, not curated: a case scans every non-test `.mjs` in
the directory for operator filenames and fails if any is missing from `OPERATOR_DOCUMENTS`, so a
document added to a script cannot silently fall out of the sandbox.

## Rollout Plan

Merge to `main` by squash. No Azure Container Apps image build, no deploy, no migration, no feature
flag, no runtime rollout. The change is one module and one suite that run under `node`; the module
is invoked by hand and the suite joins the existing required glob.

**Where it should run is deliberately not decided here.** The item forbids wiring a required CI job,
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
- `node scripts/exec/self-falsifying-assertion-probe.test.mjs` → 76 passed, 0 failed, 0 skipped;
  with `HOME` pointed at an empty directory → 74 passed, 0 failed, 2 skipped.
- All 16 `scripts/exec/*.test.mjs` suites: `for f in scripts/exec/*.test.mjs; do node "$f"; done`.
- Calibration (a), reproducible from the four-command block above.
- Calibration (b) and (c), reproducible as four full scans:
  `node scripts/exec/self-falsifying-assertion-probe.mjs --source <none|case-names|source-literals|whole-source> --json`.
- The mutations in the necessity table, each a one-line edit named exactly in that table.
- `npx eslint` exit 0 on both new files; `npx tsc --noEmit` exit 0.
- The item's claim and release lines in the operator register.

## Known Gaps

- **Where this runs is not decided, on purpose.** `C-582` owns requiredness for corpus-reading
  cases, and pre-empting it here is the boundary `C-587` also respected. The recommendation, as a
  recommendation: run it on a schedule or on demand against the operator host, **not** as a required
  pull-request context — on a CI runner there is no operator corpus to perturb, so the gate would
  measure nothing and pass, which is the shape of gate this whole backlog exists against. The
  `--operator-root` absent path exits 2 rather than reporting a clean run precisely so that a
  misplacement is loud.
- **The probe is blind on an already-red case.** A case failing in the baseline cannot flip
  pass → fail, so the probe says nothing about it. Every baseline red is reported per suite for that
  reason.
- **One suite prints nothing on a pass.** `worktree-sweep-hazard.test.mjs` emits no per-case line
  for a passing case, so a flip there is visible only as a new `FAIL` line plus a moved total. The
  report names it under `blindSuites` rather than leaving the gap implicit.
- **Two unclassified cases are now named and not repaired.** `id-collision`'s `T-721` and `T-727`
  count assertions are pinned to the live backlog's current state. They are reported here rather
  than changed, because repairing them is a second item's worth of work and this release's job was
  to establish the class can be found. They are not reachable by the default vehicles, so a default
  run stays silent about them.
- **`backlog-filing` cannot separate a self-falsifying assertion from a true duplicate filing.**
  Measured and stated above; it is why that vehicle is not a default.
- **The probe runs every suite twice.** A full scan of 16 suites is roughly three minutes of
  wall-clock on the operator host. That is cheap for an on-demand diagnostic and would be noticeable
  in a per-pull-request context, which is a second reason for the placement recommendation above.
