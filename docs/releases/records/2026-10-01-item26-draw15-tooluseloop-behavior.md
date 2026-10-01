# 2026-10-01-item26-draw15-tooluseloop-behavior — Rewrite the item 26 draw 15 toolUseLoop byte scan as behaviour and wire it

## Release ID

`2026-10-01-item26-draw15-tooluseloop-behavior`

## Status

`candidate`

## Plain-English Summary

The fifteenth stale-suite triage draw under P3 item 26
(`docs/architecture/item26-draw15-stale-suite-triage.json`, #8767) judged twenty
test files that no continuous-integration job ran. One row,
`src/lib/agent/streaming/toolUseLoop.test.ts`, was green 1 of 1 with verdict
`rewrite_as_behavior`. Its only case read `toolUseLoop.ts` with
`fs.readFileSync` and checked that two source literals were present: the
`initialToolChoice` parameter type and the `turn === 1` spread. A comment
holding the same text would pass it, and a formatter reflow would fail it.

The subject is a live control in the multi-turn tool-use loop. An explicit
`tool_choice` forces the model to call a tool on the **first** turn only. If it
were sent on later turns, the model could never produce the confirmation text
that follows a tool result.

This change replaces the byte scan with four behavioural cases. Each one drives
`runToolUseLoop` with a scripted Anthropic client and a really registered tool,
and snapshots the request each turn sends:

- The explicit initial `tool_choice` is sent on turn 1 and is absent from
  turn 2. The tools are still offered on turn 2.
- Over a three-turn chain, `tool_choice` is present on turn 1 only.
- When no initial choice is given, no `tool_choice` key is sent at all.
- The tool runs before the next turn. That turn receives the tool's
  `tool_result` (`is_error: false`), and the streamed confirmation is what the
  writer receives.

Re-executed on base `1fe80e54c0`: 4 of 4 green. The suite is named by file in
the existing draw 15 by-file step, and its one-file directory leaves the
dark-directory baseline.

The six draw 15 rows held under T-775 are untouched. No product file is edited.

## Layer Impact

**Release lane: `global-control-lane`.** This changes shared CI tooling and
one test file. It applies equally to every client's build and sits behind no
feature gate.

- **Layer 4 (Products):** no product behaviour changes. No route, component,
  adapter, projection or canonical object is touched.
- **Platform tooling / CI:** one file is added to an existing job step. The
  coverage census, the dark-directory baseline, the draw 15 triage record and
  its control are updated to match what the repository now runs.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. This affects CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/agent/streaming/toolUseLoop.test.ts`: the byte scan is replaced by
  the four behavioural cases above.
- `.github/workflows/unit-suites.yml`: the file is added to the draw 15 by-file
  step, which is renamed `Run the item 26 draw 15 agent doctrine, CXO
  answer-quality and tool-use loop suites by named file`. It is named by file
  because `src/lib/agent` as a pattern would select every suite under it. The
  step comment is updated.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`:
  `src/lib/agent/streaming` is removed.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with the
  repo-owned `--write`. Uncovered test files went from 204 to 203, and
  untriaged unrun files from 152 to 151.
- `docs/architecture/item26-draw15-stale-suite-triage.json`: the row keeps its
  verdict, green state and counts as the snapshot at its base.
  - `readsRepositoryFileText` and `sourceTextScanner` now describe the file as
    it is (`false`), because the control re-derives them from the current
    bytes.
  - The draw-time values (`true`, `true`) are kept in a new `rewritten` block.
    That block also records the re-execution base, the 4/4 result and what
    changed.
  - The row gains `wiredInThisItem: true`, and `secondHalf.stillHeld` drops it.
- `src/__tests__/behaviors/item26-draw15-triage-record.test.ts`: a draw 15 step
  must now also run an applied rewrite. One new case covers
  `rewrite_as_behavior` rows:
  - A row not marked applied holds only while its file still reads repository
    text.
  - An applied row must:
    - be classified `false/false` now and `true/true` at draw;
    - read no repository text;
    - contain neither literal the old scan matched;
    - import `./toolUseLoop`;
    - have a green re-execution;
    - be wired.

## QA / Validation

**Re-verified on main first.** On `origin/main` `1fe80e54c0` the row was as
recorded: one case, `fs.readFileSync` over `toolUseLoop.ts`, asserting two
literals. The suite was not named in any workflow step, and
`src/lib/agent/streaming` was in the dark-directory baseline.

**Red first.** The record, workflow and control were amended with the
**original** byte-scan file restored. The draw 15 control then failed 3 of 11:
the bytes re-derivation, the new rewrite case, and the census/step case. With
the rewrite in place and the census regenerated, it passed 11 of 11.

One intermediate run failed 1 of 11 for a real reason. A helper's parameter
annotation in the new test spelled the same `initialToolChoice?:
AnthropicMessageStreamParams['tool_choice']` literal the old scan matched. The
test now uses a `ToolChoice` type alias. The control was not loosened.

**Product mutations** to `toolUseLoop.ts`. Each was applied alone, run, and
restored with a sha256 check.

| Mutation | toolUseLoop suite |
|---|---|
| M1: `tool_choice` sent on every turn (drop `turn === 1 &&`) | 2/4 fail |
| M2: the `tool_choice` spread deleted | 2/4 fail |
| M3: `tool_choice` sent on turn 2 instead of turn 1 | 2/4 fail |
| M4: the `initialToolChoice` guard dropped, so turn 1 sends `tool_choice: undefined` when none is given | 1/4 fail |
| M5: tools offered on turn 1 only | 1/4 fail |
| M6: `is_error` inverted on the tool result | 1/4 fail |
| M7: the follow-up user turn carries no tool results | 1/4 fail |

All 7 were caught. The first M7 attempt matched no text because the
indentation was wrong, so no mutation was applied. It was recorded as a miss
and re-run with the correct text.

**Control mutations:**

| Mutation | draw 15 control |
|---|---|
| C1: the file removed from the draw 15 step | 1/11 fail |
| C2: the record's re-execution set to 3/4 | 1/11 fail |
| C3: `rewrittenInThisItem` set to false | 3/11 fail |
| C4: `drawnSourceTextScanner` set to false | 1/11 fail |
| C5: the old spread literal added to the test as a comment | 1/11 fail |
| C6: the file prefixed with `#` inside the folded `run:` (a shell comment) | 1/11 fail |

All 6 were caught.

**Same-scope baseline, `src/__tests__/behaviors`:** 170 suites, 1793 tests,
0 failing on base `1fe80e54c0`, measured in a clean detached worktree. The
branch gives 170 / 1794 / 0; the one added case is the new control case.

**Other gates:**

- DOM integrity linter: 0 violations. The first CI run flagged the test's
  `Request` URL as a hardcoded localhost URL (`pre_canon_url`); it now uses an
  `example.test` host, which the loop never reads.
- census `--check`: exit 0
- triage-record census reconciliation: exit 0
- `ai-surface-control-catalog` audit: exit 0
- `tsc --noEmit` (6 GB heap): exit 0
- eslint on both changed tests: exit 0

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout:
no image, migration, flag, environment variable or traffic change. The suite
runs from the next pull request.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, runtime images,
flags, environment variables, worker jobs, traffic or DNS.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a (no runtime image change)
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no**, because no product surface changes

## Rollback Plan

Revert the pull request. That restores the test, the step, the baseline, the
census, the record and the control together. They are consistent only as a
set. There is nothing to unwind in a running environment.

## Audit Evidence

- The local run counts and the two mutation tables above.
- Runner proof from the pull request's unit-suites job log: the `PASS` line
  for `toolUseLoop.test.ts` in the draw 15 by-file step. This is recorded in
  the backlog after the run, not inferred from the YAML.

## Known Gaps

- Draw 15 still holds six rows under T-775. With this change, no draw 15 row
  is claimable under item 26.
