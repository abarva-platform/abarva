# 2026-09-20-repoint-agent-mission-panel-suite — 41 assertions that stopped running

## Release ID

`2026-09-20-repoint-agent-mission-panel-suite`

## Status

`candidate`

## Plain-English Summary

`agent-mission-panel.test.ts` read two source paths that no longer exist. Both
reads happen at module scope, so the suite stopped **collecting** rather than
failing a case: it reported as red while running **zero assertions** against a
component that is still shipped and still changing.

Its subjects were not deleted. They **moved**, from `agents/` to `agent/`:

| constant | was | is |
|---|---|---|
| `PANEL_SOURCE_PATH` | `src/components/agents/AgentMissionPanel.tsx` | `src/components/agent/AgentMissionPanel.tsx` |
| `VIEW_SOURCE_PATH` | `src/lib/agents/agent-mission-view.ts` | `src/lib/agent/agent-mission-view.ts` |

Repointing both restores the suite: **41 tests where there were 0, all
passing.**

## Why this was nearly deleted instead

This came out of a sweep for suites that fail to collect. Three were found, all
reading a subject that was not there, and the obvious disposition for all three
was to delete them as dead.

That would have been wrong here. Checking whether each subject was **deleted or
renamed** is what separated them: two are genuinely gone, and this one had
simply moved. Deleting it would have thrown away 41 working assertions about a
live component and left nothing behind to notice.

The first repoint was not enough either — the suite still collected nothing,
because there was a **second** stale constant further down the file. Re-running
after the first fix is what found it; assuming one path was the whole problem
would have shipped a suite still running zero tests and a release record
claiming otherwise.

## What this does NOT change

- **The two genuinely dead suites are untouched.**
  `tower-grounding-client-name.test.ts` imports a module that no longer exists,
  and `intelligence-int2-pattern-action-canvas.test.ts` reads a deleted
  component. Their disposition is a separate decision; this change does not make
  it.
- **Two suites in the same directory are still red** —
  `agent-mission-surface-wiring.test.ts` and `ask-anything-bar.test.ts`, 23
  failing assertions between them. They fail honestly, they are unrelated to
  this path move, and they are left red.
- **`src/components/agents` and `src/lib/agents` still exist.** This was not a
  wholesale rename, so the other suites pointing at those directories are
  correct and were left alone — confirmed by the sweep, which found no
  collection failure among them.

## Layer Impact

- `global-control-lane`. One test file, two string constants. No product
  surface, tenant data, schema, projection, migration, flag, code path, or
  runtime behaviour. **No assertion was weakened, skipped or deleted.**

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — test repair
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/__tests__/integration/agents/agent-mission-panel.test.ts` — both source
  paths repointed, with the reason recorded beside the first.

## QA / Validation

Measured on base `dc9a7f613`.

| | before | after |
|---|---|---|
| suite collects | **no** | yes |
| **tests executed** | **0** | **41** |
| tests passing | 0 | 41 |

| Other checks | Result |
|---|---|
| The directory, for context | 8 suites: 6 pass, 2 fail on assertions, **0 collection failures** |
| Both moved subjects exist at the new paths | verified with `ls` |
| Both old directories still exist, so siblings are correct | verified |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

The criterion was the **test count**, not the suite status. A suite that fails
to collect and one that runs and passes differ by whether any assertion
executed, and only the count distinguishes them — which is also why the
intermediate state after the first repoint was caught rather than shipped.

## Rollout Plan

Merge to `main`. Forty-one assertions begin executing that have not been. No
image build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting returns the suite
to running zero tests.

## Audit Evidence

- The before/after test counts.
- The two subject paths, confirmed present at their new locations.
- The directory run showing no remaining collection failures.

## Known Gaps

- **Nothing stops this recurring.** A source-reading test holds its subject's
  path as a string, so moving a file breaks the test in a way no compiler and no
  import graph will catch, and the failure mode is silence rather than a red
  assertion.
- **The coverage census cannot see this class of problem at all** — a suite that
  collects nothing still counts as a covered test file. This directory happens
  to be uncovered today, so nothing was mis-reported; the risk is that wiring it
  would have counted a zero-test suite as covered.
- **This is one of three.** The other two are not repaired here.
