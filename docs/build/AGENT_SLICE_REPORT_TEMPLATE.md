# Agent Slice Report Template

Slice: companion to OPS1
Owner agents: Lane Agent (filler) + Reviewer (consumer)
Last updated: 2026-04-25
Purpose: a uniform report that every lane fills in after committing locally and before reporting back. Pairs with `AGENT_DISPATCH_OPERATING_MODEL.md` and `AGENT_BATCH_TEMPLATE.md`.

---

## How to fill this template

Replace every `<PLACEHOLDER_LIKE_THIS>` token with a concrete value. Submit the filled report as the final message of the lane's session. Do not submit code, do not submit diff text — the report is the contract.

The integrator reads this report during morning review (`AGENT_BATCH_TEMPLATE.md` §G). Missing or vague fields make the lane harder to evaluate; complete fields make a clean keep / cherry-pick decision possible without re-reading the diff.

---

## A. Slice header

```
Lane ................. <LANE_LABEL>
Slice id ............. <SLICE_ID>
Slice name ........... <SLICE_NAME>
Branch ............... pack/<SLICE_ID>-<SLUG>
HEAD sha ............. <HEAD_SHA>
Parent sha ........... <PARENT_SHA>
Worktree ............. <WORKTREE_PATH>
Commit message ....... <COMMIT_MESSAGE_LITERAL>
Files staged count ... <STAGED_COUNT>
Test count ........... <TEST_COUNT>
Validation status .... <ALL_PASS | <SUITE_NAME>_FAILED>
Date .................. <ISO_DATE>
Lane agent ........... <AGENT_DESCRIPTOR>
```

Placeholders:
- `<LANE_LABEL>` — short lane label (e.g. `Lane C`).
- `<SLICE_ID>` — uppercase slice id (e.g. `OPS1`).
- `<SLICE_NAME>` — human-readable slice name.
- `<SLUG>` — lowercase slug used in the branch path.
- `<HEAD_SHA>` — `git rev-parse HEAD` after the lane's commit.
- `<PARENT_SHA>` — `git rev-parse HEAD~1`. Should match the integrator's main HEAD captured during preflight.
- `<WORKTREE_PATH>` — full absolute path to the lane's worktree.
- `<COMMIT_MESSAGE_LITERAL>` — the literal commit message used (must equal the message specified in the dispatch prompt).
- `<STAGED_COUNT>` — exact number of files in the commit.
- `<TEST_COUNT>` — number of `it()` cases in the suite the lane authored or modified, sum across suites if multiple.
- `<ALL_PASS | <SUITE_NAME>_FAILED>` — `ALL_PASS` if every validation command exited 0, else name the failed command.
- `<ISO_DATE>` — today's ISO date.
- `<AGENT_DESCRIPTOR>` — the model/agent identifier (e.g. "Builder, Opus 4.7 long-context").

---

## B. Files staged (exactly N)

List each staged file path, one per line. The list must equal exactly the slice's `allowedFiles` and have exactly `<STAGED_COUNT>` entries.

```
1. <PATH_1>
2. <PATH_2>
3. <PATH_3>
4. docs/build/build-slices.json
5. docs/build/production-readiness.json
```

Confirm by running:
```
git diff --cached --name-only | wc -l
# Must equal <STAGED_COUNT>
```

If the count differs from the slice's specified `allowedFiles`, the lane has a hard-rule violation. Stop, report the discrepancy, do not commit.

---

## C. Test count + suite breakdown

For each test suite touched by the slice, list:

```
Suite: <SUITE_PATH>
  Test count: <COUNT>
  Pass: <YES_OR_NO>
  New tests added: <COUNT>
  Existing tests modified: <COUNT>

Suite: <SECOND_SUITE_PATH>
  ...
```

If the slice is docs-only (no tests), state explicitly:

```
No new test suites authored. Slice is documentation/JSON only.
Existing test suites that exercise the touched manifests:
  - src/__tests__/integration/admin/production-readiness-validator.test.ts (PROD2 — N tests, all passing)
```

---

## D. Validation results

For each validation command in the slice's `validationCommands`, list:

```
Command: <CMD_1>
  Exit code: <EXIT_CODE>
  Wall time: <SECONDS>
  Notes: <NOTES>

Command: <CMD_2>
  ...

Tests run: <JEST_TEST_COUNT | docs only | N/A docs only>
TSC + Build:
  npx tsc --noEmit --pretty false: <PASS | FAIL | SKIP — reason>
  npm run build: <PASS | FAIL | SKIP — reason>

JSON parse:
  build-slices.json: <PASS_OR_FAIL>
  production-readiness.json: <PASS_OR_FAIL>

PROD2 validator:
  passed: <TRUE_OR_FALSE>
  violations: <COUNT>
  violation summary: <NONE | <BRIEF>>
```

If any command failed, the lane MUST stop, NOT commit, and report the failure. A failed validation in this section indicates the lane should have aborted before staging.

Lanes that are documentation / JSON only and stage zero `.ts` / `.tsx` files MAY waive the Jest test count by reporting `Tests run: docs only` (or `N/A docs only`); the OPS7 lane report validator honors this waiver.

---

## E. Implementation notes

A short description of what the slice actually did. Bullet form preferred. Aim for 5–15 bullets covering:

- What new types / functions / read models / components / tests were introduced.
- What deterministic data sources the slice used (no live data).
- What constraints / contracts the slice respected (mention specific contract slices if relevant: SOL1, AG10, MG2, etc.).
- What banned patterns the slice avoided (no `Date.now`, no `Math.random`, no `fetch`, no `useState`, no `Coming soon`, etc.).
- Any non-obvious design decisions worth flagging during review.

```
- <BULLET_1>
- <BULLET_2>
- <BULLET_3>
- ...
```

This section is the lane's chance to explain "why this and not that" before the integrator sees the diff.

---

## F. PRT update report

The Production Readiness Tracker is the single most sensitive manifest. Report every touch.

```
Tracker updated: <YES_OR_NO>

Components touched:
  - <COMPONENT_ID_1>: notes appended? <YES_OR_NO>; nextAction updated? <YES_OR_NO>
  - <COMPONENT_ID_2>: notes appended? <YES_OR_NO>; nextAction updated? <YES_OR_NO>

Status changes:
  <NONE | <COMPONENT_ID>: <FROM> -> <TO> (justification)>

Blockers added:
  <NONE | <COMPONENT_ID>: <BLOCKER_ID> (severity, description)>

Blockers removed:
  <NONE | <COMPONENT_ID>: <BLOCKER_ID> with evidence: <EVIDENCE>>

nextAction changes:
  - <COMPONENT_ID>: <BEFORE_TEXT_SUMMARY> -> <AFTER_TEXT_SUMMARY>

overallReadinessPercent changed: <YES_OR_NO> (<FROM> -> <TO>)

stewardBrief.topBlockers changed: <YES_OR_NO> (<DELTA>)

lastUpdated bumped: <YES_OR_NO> (<NEW_DATE>)
```

If the lane was instructed not to touch the PRT, state explicitly:

```
PRT not touched. Slice is <REASON> and does not affect any production-readiness component.
```

The default for any docs / read-model / UI lane is to append a note to one or more components — not to promote a status. If the lane promoted any status, name it explicitly here so the integrator can verify the promotion against §H (conservative status) and §K (no false promotion) of the operating model.

---

## G. Hygiene confirmation

Confirm each item:

```
[<YES_OR_NO>] No banned imports
    (no anthropic, no openai, no @clerk/nextjs from server-only modules,
     no supabase from this slice, no fetch in deterministic read models)

[<YES_OR_NO>] No banned phrases
    (no "Coming soon", no "TBD", no "Lorem ipsum",
     no fake-vendor names, no fabricated $ amounts, no fake E-### citations)

[<YES_OR_NO>] No banned runtime calls
    (no Date.now, no Math.random, no new Date() in deterministic read models,
     no fetch, no fs writes in client modules)

[<YES_OR_NO>] No PRT promotions
    (no component status moved to a higher tier without explicit founder approval)

[<YES_OR_NO>] No model/API calls
    (no provider SDK imports, no live model invocation)

[<YES_OR_NO>] Honest disclaimers in place
    (every UI surface that renders deterministic seeds is marked accordingly)

[<YES_OR_NO>] No cross-tenant data leakage
    (tenant scope respected on every tenant-bound read)
```

A `NO` on any line is a hard-rule violation. The lane should not commit. If the lane already committed and the violation is now visible, report it explicitly so the integrator can discard.

---

## H. Hard-rule audit

A direct restate of the operating model's hard rules. Confirm each:

```
[<YES_OR_NO>] One slice = one worktree = one branch = one local commit (§B)
    Worktree: <WORKTREE_PATH>
    Branch: pack/<SLICE_ID>-<SLUG>
    Local commits on top of parent: 1

[<YES_OR_NO>] No push, no merge, no PR (§C)
    Confirmed: no `git push`, no `git merge`, no `gh pr create` was run.

[<YES_OR_NO>] No `git add .` / `git add -A` / `git add --all` (§J)
    Files staged by explicit path. Verified with `git diff --cached --name-only`.

[<YES_OR_NO>] Exactly N files staged (§J)
    Expected: <EXPECTED_N>
    Actual: <ACTUAL_N>

[<YES_OR_NO>] No false readiness promotion (§K)
    No component moved up the status ladder without explicit founder approval.

[<YES_OR_NO>] Branch hygiene confirmed (§M)
    `git branch --show-current` printed pack/<SLICE_ID>-<SLUG> at every stage.
```

---

## I. Deferred items / known gaps

If the slice intentionally defers work, list it. The integrator uses this list to decide whether the deferred items deserve a follow-up dispatch entry.

```
- <DEFERRED_ITEM_1>: deferred because <REASON>; recommended next slice: <RECOMMENDED_ID>.
- <DEFERRED_ITEM_2>: deferred because <REASON>; recommended next slice: <RECOMMENDED_ID>.
```

If nothing was deferred, state:

```
No deferred items. Slice scope was complete as specified.
```

Do not use this section to confess shortcuts or partial work that should have been completed. Partial completion is a `DISCARD` decision in morning review, not a deferred-items report.

---

## J. Recommendation to integrator

A one-line recommendation:

```
Recommend: <KEEP | AMEND | DISCARD>
Reason: <ONE_SENTENCE>
```

The integrator may override the recommendation. The lane's recommendation is advisory; the integrator's decision is authoritative.

---

## K. Run Metrics

Quantitative footprint of the lane's run. The integrator scrapes this section to track lane-level cost and to spot anomalies.

```
Wall time ............ <MM:SS or seconds>
Tool calls ........... <COUNT>
Files read ........... <COUNT>
Files written ........ <COUNT>
Tokens (approx) ...... <COUNT or "n/a">
Bash commands ........ <COUNT>
Retries / aborts ..... <COUNT or "none">
```

If any metric is unavailable in the lane's environment, write `n/a` rather than guessing.

---

## L. Blockers

If the lane hit a blocker that prevented full slice completion, list it here. If none, say so explicitly.

```
Blockers: <NONE | <SHORT_DESCRIPTION>>
```

A blocker entry should name (a) the symptom, (b) the file or command involved, and (c) the recommended next step (retry, escalate, defer, abandon).

---

## M. Final SHA line

Conclude the report with the abbreviated commit sha on its own line, prefixed with the literal `LANE-SHA:` label. The integration agent uses this line as the mechanical anchor when collecting the lane's commit.

```
LANE-SHA: <abbrev>
```

`<abbrev>` is the 7+ hex character abbreviated git sha printed by `git rev-parse --short HEAD` after the lane's local commit.

---

End of slice report template.
