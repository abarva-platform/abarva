# Codex Orchestration Runbook

This runbook defines how Codex uses the backlog registry as the **single execution control plane**.

## 1. Purpose

The AbarVa master backlog is split into:

- `docs/planning/abarva-master-backlog/backlog-registry.json` (machine-readable execution control)
- Markdown dossiers and wave notes (product/design/source-of-truth)

Codex must treat these as a coupled pair:

- **Registry** controls execution order, safety checks, and lifecycle status.
- **Markdown** carries design intent, scope language, and acceptance criteria.

No other file should define execution order without a registry record.

## 2. Execution Loop

Canonical loop:

1. Read `docs/planning/abarva-master-backlog/backlog-registry.json`.
2. Validate registry schema and resolve dependency graph.
3. Compute executable items.
4. Group non-conflicting items into a wave-safe execution batch.
5. Launch one branch per executable item.
6. Run item validation on branch.
7. Open PR for each item.
8. Monitor check status.
9. Fix scoped failures.
10. Merge when in-scope checks are green.
11. Update completed item metadata in registry.
12. Update readiness trackers only when justified.
13. Repeat until no eligible items remain.

## 3. Executable Item Rules

An item is executable when all conditions are true:

- `status` is `pending` or `ready`.
- `dependencies` are empty or all `done`.
- `blockers` is empty.
- `allowedFiles` populated and each path is present or resolvable.
- `forbiddenFiles` populated.
- `testCommands` populated.
- `definitionOfDone` populated.
- `sourceFile` exists.
- `requiresHumanApproval` is `false`.
- No dependency loop.

Otherwise status becomes `blocked` with a blocker reason.

## 4. Parallel Execution Rules

Codex may schedule items in parallel only when:

- `allowedFiles` disjoint by path OR only non-overlapping markdown artifacts.
- No shared state-update artifacts among parallel items:
  - `docs/build/production-readiness.json`
  - `CYCLE_STATE.md`
- No runtime implementation collision (`src/**`, `public/**`, `scripts/**` etc.).
- No explicit dependency chain between the items.
- No explicit `requiresHumanApproval` dependency.

If conflict is uncertain, run sequentially.

## 5. Item Grouping for Wave Execution

Codex groups by `recommendedWave`, then by priority.

- High priority first: `P0` then `P1` then `P2`.
- Dependency-first within wave.
- Track-level conflicts: if `sourceFile`/`allowedFiles` overlap, schedule only one at a time.
- `CYCLE_STATE.md`, production-readiness state updates, and other tracker files are always last in the wave.

### Selection Algorithm

1. Filter items by wave.
2. Sort by priority, then status.
3. For each item, check dependency and file-overlap constraints.
4. Assign safe work into a single batch.
5. Start branches in parallel where safe.

## 6. Branch and PR Pattern

Per item:

- Create one branch only for the item.
- Include only files in `allowedFiles` and required markdown references.
- Do not include unrelated files.
- Commit message: `docs(planning): <concise item summary>`.
- Open PR with:
  - item scope summary
  - files changed
  - validation results
  - readiness impact
  - out-of-scope confirmation

## 7. Validation and Check Rules

For each item branch run:

1. `git diff --check`
2. all commands in `testCommands`
3. `npx tsc --noEmit --pretty false` when command includes TS checks.
4. targeted app checks if the item touches runtime planning references.

Global runbook check before merge:

- `git diff --check`
- `python3 -m json.tool docs/planning/abarva-master-backlog/backlog-registry.json` (or equivalent parser)

## 8. Registry Schema and Status Lifecycle

Item status lifecycle:

- `pending`: item exists, not yet picked
- `ready`: dependencies clear and waiting execution
- `in_progress`: branch opened/working
- `blocked`: unresolved dependencies/blockers
- `done`: PR merged and metadata written
- `superseded`: intentionally replaced by newer item

When an item merges:

- Set `status: done`
- Set `completedPr`
- Set `completedCommit`
- Set `completedAt`
- Add any readiness impact notes to the PR comment and registry state notes if needed

## 9. Registry Required Fields

Each item must include:

- `id`
- `title`
- `track`
- `priority`
- `status`
- `ownerAgent`
- `productArea`
- `recommendedWave`
- `dependencies`
- `blockers`
- `canRunInParallelWith`
- `cannotRunWith`
- `allowedFiles`
- `forbiddenFiles`
- `testCommands`
- `readinessImpact`
- `requiresHumanApproval`
- `mergePolicy`
- `sourceFile`
- `definitionOfDone`
- `executionNotes`
- `completedPr`
- `completedCommit`

Missing any required field is a hard stop for merge.

## 10. Human Approval Rules

Codex must stop and ask for explicit user approval when:

- auth/security/tenant behavior is changed
- model calls, model gateway changes, or upload/parsing behavior is introduced
- persistence or database migration behavior is changed
- production deployment decisions are required
- major UI/product judgment is needed
- non-trivial conflict in registry state or merge resolution
- CI failures are outside the item scope
- unexpected file edits appear

## 11. Merge Policy

Codex may merge without user approval only when all are true:

- Scope matches this item definition and files.
- Local validations pass.
- GitHub checks are green.
- No unexpected files.
- No unresolved conflict.
- `requiresHumanApproval` is `false`.

Otherwise request user confirmation.

## 12. Ready-to-Merge Gate

Before merge:

- Ensure PR has no extra files.
- Validate item-specific commands pass.
- Update registry metadata for the merged item.
- Re-check duplicate IDs and dependency IDs.
- Reconcile wave completion if last item in wave merges.

## 13. Readiness Tracker Updates

Only when warranted by done-items:

- `docs/build/production-readiness.json`
- `docs/abarva-source/SOURCE_PRODUCTION_READINESS_TRACKER.md`
- `docs/abarva-source/SOURCE_LAYERED_PROGRESS_TRACKER.md`

Tracker updates must not co-occur with unrelated registry items in the same wave unless explicitly safe.

## 14. Stop Conditions

Stop and pause orchestration when:

- `blocked` items exceed a hard threshold and all have unresolved causes.
- Dependency graph has a cycle.
- Critical validation failures require scope arbitration.
- Required approval for auth/security/data-plane changes is triggered.

## 15. Final Report Template

Every autonomous run must report:

- Items selected
- Items skipped and blocker reasons
- PRs created
- PRs merged
- Validation commands run
- Failures and in-scope fixes
- Readiness updates made
- Registry status updates
- Remaining blockers
- Next executable items

## 16. Run Loop Diagram

```text
Read backlog-registry.json
         v
Validate schema / IDs / required fields
         v
Find ready items (status pending/ready, deps complete, no blockers)
         v
Group non-conflicting items by wave and files
         v
Launch one branch per item
         v
Run validations and PR checks
         v
Fix scoped failures only
         v
Merge green PRs
         v
Update registry (done, PR, commit, checks)
         v
Update readiness trackers if impacted
         v
Continue or stop per stop condition
```

## 17. Safety Guardrails

Codex shall not:

- create another backlog folder
- edit `src/` or API routes from registry-only slice
- call external model APIs
- perform migrations
- treat seeded/demo content as production evidence

## 18. Conflict Safety for File Overlap

When overlap is detected:

- cancel parallel run
- schedule dependent items sequentially
- keep the wave report noting why scheduling changed
