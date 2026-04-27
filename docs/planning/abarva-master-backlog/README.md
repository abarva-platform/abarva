# AbarVa Master Backlog Control Plane

This folder is the autonomous execution control plane for Codex.

## Purpose

- `backlog-registry.json` is the machine-readable queue.
- `waves/` contains wave-level execution groupings for the planning-path backlog.
- `tracks/` contains the detailed slice specs Codex reads before opening a branch or PR.
- `BACKLOG_CURRENT_STATE.md` is the persistent checkpoint between autonomous sessions.

## Current bridging rule

The planning-path control plane is being reconciled to the already-merged product state on `main`.

- Slices already merged in the product may remain documented here, but should be marked `done` in the registry.
- Only slices with valid `allowedFiles`, existing `sourceFile`, and satisfied dependencies may execute.
- If a planning slice is narrower or newer than an older `docs/backlog/` version, this folder is the authority for autonomous execution.

## Execution posture

- One branch per item
- One PR per item
- Local validation before PR
- Merge only when merge policy allows
- Update registry and checkpoint after each merge
