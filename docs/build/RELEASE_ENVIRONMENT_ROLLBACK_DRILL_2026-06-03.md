# Release Environment and Rollback Drill Manifest

Date: 2026-06-03
Status: candidate
Backlog: T039
Release lane: internal-admin

## What Changed

Added a structured release environment model and rollback drill evidence path.

The plan distinguishes:

- local worktree,
- PR preview,
- pre-prod preview,
- first-client pilot production,
- multi-client production.

## Why It Matters

This closes a planning gap before pilot: a preview deployment is not the same as
pilot production, and first-client pilot production is not the same as
multi-client production.

The plan defines promotion gates, rollback evidence, and the operating boundary
for each environment so releases can be tested without inventing policy during
an incident.

## Drill Evidence Packet

The rollback drill evidence packet requires:

- release candidate id,
- environment name,
- owner and approver,
- trigger,
- rollback method,
- command or console action transcript,
- validation commands and results,
- deployment id before and after rollback,
- residual risk.

## Verification

Run:

```bash
node scripts/release/verify-release-environment-plan.mjs
```

Expected result: JSON report with `status: "pass"`.

## Completion Boundary

The repository-side release environment plan is complete when the runbook,
verifier, build manifest, rollback-runbook pointer, and release record merge.

T039 remains `In progress` until a real rollback drill is executed and its
evidence packet is attached.
