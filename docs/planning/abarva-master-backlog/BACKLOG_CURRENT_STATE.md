# Backlog Current State

This file is the persistent handoff between autonomous Codex sessions.

## 1. Last Completed Loop

- Run timestamp: `YYYY-MM-DD HH:MM TZ`
- Last completed wave: `WAVE-XX`
- Last merged PRs:
  - `#NNN` - `<title>` - `<merge_commit>`
- Registry updates applied:
  - Item IDs moved to `done`: `<id1, id2, ...>`
  - Item IDs moved to `blocked`: `<id3, id4, ...>`

## 2. Current Queue Snapshot

- Next wave candidate: `WAVE-XX`
- Ready item IDs: `<id list>`
- Blocked item IDs: `<id list>`
- Items requiring human approval: `<id list>`
- Items deferred due to conflict: `<id list>`

## 3. Current Risk and Blockers

- CI health summary: `<green | unstable | blocked>`
- Open blocker 1: `<description>`
- Open blocker 2: `<description>`
- Scope boundary risk: `<none | details>`
- Merge risk: `<none | details>`

## 4. Execution Decisions Made

- Parallel lanes launched: `<lane summary>`
- Sequential items forced by overlap: `<id list and reason>`
- Stop conditions checked: `<pass | fail>`
- Human approvals requested: `<yes/no + details>`

## 5. Next Step Contract

Codex must perform the next run in this order:

1. Read `docs/planning/abarva-master-backlog/backlog-registry.json`.
2. Read `docs/planning/abarva-master-backlog/CODEX_ORCHESTRATION_RUNBOOK.md`.
3. Read this file and continue from the latest queue snapshot.
4. Execute only items that pass executable-item rules.
5. Update this file at the end of the run.

## 6. End-of-Run Update Checklist

- Update timestamp.
- Record merged PR numbers and commits.
- Record changed item statuses.
- Record failures and in-scope fixes.
- Record remaining blockers.
- Record next recommended wave and item IDs.

## 7. Current Placeholder State

This section is intentionally explicit until the next autonomous run writes real values.

- Run timestamp: `not yet recorded`
- Last completed wave: `unknown`
- Next wave candidate: `derive from registry priority and dependency checks`
- Ready item IDs: `derive from executable-item rules`
- Blocked item IDs: `derive from dependency and blocker fields`
