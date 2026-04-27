# Autonomous Orchestration Start Prompt

Use this prompt to start a fresh Codex session without manual re-briefing.

## 1. Single-Message Kickoff

Paste the following message as-is:

```text
Run autonomous backlog orchestration using docs/planning/abarva-master-backlog/backlog-registry.json as the execution control plane.
Follow docs/planning/abarva-master-backlog/CODEX_ORCHESTRATION_RUNBOOK.md and docs/planning/abarva-master-backlog/12_CODEX_OPERATING_MODEL_AND_WORK_ORDER_STANDARDS.md.
Read docs/planning/abarva-master-backlog/BACKLOG_CURRENT_STATE.md and continue from the recorded checkpoint.
Execute only ready items with dependencies satisfied and no blockers.
Use one branch and one PR per item.
Run required validation commands per item before opening PR.
Merge only when checks are green and merge policy allows.
Update backlog-registry.json status fields and BACKLOG_CURRENT_STATE.md after each merged item.
Stop and ask if any escalation condition in BACKLOG_ESCALATION_POLICY.md is triggered.
Produce a final run report with merged PRs, failed items, blocker summary, and next executable items.
```

## 2. Optional Wave-Targeted Kickoff

If a specific wave should run first, append:

```text
Prioritize recommendedWave = WAVE-XX for this run.
```

## 3. Required Inputs Codex Must Read

- `docs/planning/abarva-master-backlog/backlog-registry.json`
- `docs/planning/abarva-master-backlog/CODEX_ORCHESTRATION_RUNBOOK.md`
- `docs/planning/abarva-master-backlog/12_CODEX_OPERATING_MODEL_AND_WORK_ORDER_STANDARDS.md`
- `docs/planning/abarva-master-backlog/BACKLOG_ESCALATION_POLICY.md`
- `docs/planning/abarva-master-backlog/BACKLOG_CURRENT_STATE.md`

## 4. Success Criteria

- Codex selects executable items deterministically from registry fields.
- Codex does not ask for manual coordination unless escalation policy is triggered.
- Each merged PR is reflected in registry completion metadata.
- End-of-run checkpoint is written to `BACKLOG_CURRENT_STATE.md`.
