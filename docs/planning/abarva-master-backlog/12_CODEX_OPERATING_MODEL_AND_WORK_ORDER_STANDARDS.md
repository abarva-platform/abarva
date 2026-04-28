# Codex Operating Model and Work Order Standards

## Purpose

This file defines the operating discipline for all registry-driven planning and execution work.

## 1. Execution Posture

Default model: **Spark Medium**.

Escalate only for:

- non-obvious TypeScript/Next.js behavior
- repeated CI failures (2+) that are unclear
- auth/security/tenant-related ambiguity
- API/runtime boundary ambiguity

Autonomous startup source:

- `docs/planning/abarva-master-backlog/AUTONOMOUS_ORCHESTRATION_START_PROMPT.md`
- checkpoint handoff file: `docs/planning/abarva-master-backlog/BACKLOG_CURRENT_STATE.md`

## 2. Scope Discipline

Allowed:

- planning/control files under `docs/planning/abarva-master-backlog/`
- tracker files required by execution reporting

Not allowed:

- runtime code changes
- model calls
- upload/parsing implementations
- persistence migrations
- model/API routes unless specifically scoped in backlog with approval

## 3. PR Ownership Rules

- Branch-per-item
- one PR per approved item
- no unrelated files
- no global refactors in a single PR

## 4. Merge Eligibility

Codex may merge in this track when:

- item scope is bounded
- local validation passes
- GitHub checks pass
- no out-of-band file changes
- no required human approval rule is triggered

If uncertainty appears, pause and ask.

## 5. Registry-Driven Order

Always follow:

`pending` -> dependency checks -> executable -> PR -> merge -> `done`.

If dependency fails, status becomes `blocked` with blocker note.

## 6. Required Fields Standard

Each registry item must include the full set used by Codex:

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

## 7. Readiness Tracker Protocol

When scope justifies and only under merged items:

- update `docs/build/production-readiness.json`
- update source readiness trackers under `docs/abarva-source/`

No tracker changes for pure drafting-only tasks.

## 8. Progress Reporting Format

Every report includes:

- batch progress
- current slice progress
- PR queue (created/merged/blocked)
- blocker
- next action
- elapsed effort
- remaining risk

Autonomous runs must also update:

- `docs/planning/abarva-master-backlog/BACKLOG_CURRENT_STATE.md`

## 9. Conflict Rule for Shared Track Files

When two items require the same plan file:

- only one item may execute at a time,
- unless explicitly marked as non-overlapping in `cannotRunWith` metadata.

## 10. Registry Hygiene Standards

- unique IDs
- no missing required fields
- no ID dependency to non-existent items
- deterministic JSON order for repeatable reviews

## 11. Finalization Rule

An item is complete only when:

- status is `done`,
- PR is merged,
- registry fields updated,
- required validations pass,
- no follow-up execution blockers remain hidden by status.

Escalation policy reference:

- `docs/planning/abarva-master-backlog/BACKLOG_ESCALATION_POLICY.md`
