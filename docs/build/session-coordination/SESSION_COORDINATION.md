# Session Coordination Protocol

This repo uses a lightweight file-backed coordination plane for parallel Codex and Claude lanes.

## Required Resync Points

Before file edits, DB writes, vector publishes, cleanup, PR merge, deploy, or any claim that something is done/live, re-read:

- `docs/build/session-coordination/WORKSTREAM_STATUS.yaml`
- `docs/build/session-coordination/ACTIVE_LOCKS.yaml`
- `docs/build/session-coordination/EVENT_LOG.md`
- `git status --short --branch`

## Execution Posture

The 2026-05-02 canonical V2 package authorizes continuous execution. Lanes do not produce separate review documents before building. They record sequencing reasoning in `EVENT_LOG.md`, acquire granular locks, run standard checks, auto-merge when green inside the lane, and surface only true blockers.

## Lock Standard

Use granular resource names so independent work can proceed in parallel. Examples:

- `atrium-contract-registry`
- `metrics-corpus-tier1-healthcare`
- `setup-metrics-ingestion`
- `source-agent-grounding`

A blocker is a lock conflict the lane cannot resolve, a fundamental ambiguity in locked briefs, or a discovered constraint that invalidates the chosen sequence.
