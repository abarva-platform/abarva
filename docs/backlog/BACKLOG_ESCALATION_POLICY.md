# AbarVa Autonomous Orchestration — Escalation Policy

## Purpose
Defines exactly which conditions the autonomous agent handles without human input,
and which conditions require a stop-and-notify before proceeding.

## Tier 1 — Auto-handle (no notification needed)

The agent proceeds and resolves these independently:

| Condition | Auto-resolution |
|---|---|
| build-slices.json cherry-pick conflict | Run cherry_resolve.py; union slices arrays, deduplicate by id |
| build-waves.json cherry-pick conflict | Union waves arrays, deduplicate by waveId; verify completedSlices |
| production-readiness.json conflict | Keep theirs for top-level fields; union nested notes arrays |
| TypeScript error from missing import | Add the import; re-check |
| TypeScript error from wrong prop type (read-model) | Fix the type in the read-model file only |
| Test file references wrong path | Fix the path; re-run |
| build-wave-progress test missing wave ID | Add the wave ID to EXPECTED_WAVE_IDS array |
| Hygiene gate: whitespace error | Fix the whitespace; re-run |
| Hygiene gate: JSON parse failure | Fix the JSON; re-run |
| npm build warning (non-error) | Proceed; note in final report |
| CI: GitHub Actions billing quota failure | Treat as pass if Vercel checks pass; merge |
| Duplicate slice ID in registry | Deduplicate; re-run duplicate scan |
| Lane produces 0 test files | Add at minimum a type-shape smoke test; re-run |

## Tier 2 — Auto-handle with notification

The agent resolves these but sends a PushNotification so Anand knows:

| Condition | Auto-resolution | Notification trigger |
|---|---|---|
| TypeScript error requires changing a public type interface | Make minimal change; add TODO comment | After merge |
| A lane's target file already exists with conflicting content | Accept incoming (theirs) if it's additive; log the diff | After merge |
| CI takes >10 minutes | Continue waiting up to 15 min total | At 10-min mark |
| Vercel preview deployment has a warning (not error) | Proceed | After merge |
| Build produces a new lint warning | Proceed; note in report | After merge |

## Tier 3 — Stop and notify (human required before proceeding)

The agent STOPS, writes BACKLOG_CURRENT_STATE.md with the blocker, sends PushNotification, and waits.

| Condition | Why human required |
|---|---|
| Build fails after 2 consecutive fix attempts | Risk of cascading damage; needs architect review |
| TypeScript error requires understanding business logic | Agent cannot infer intent |
| A new database migration is needed | Schema changes need human approval |
| Auth or Clerk configuration must change | Security-sensitive |
| A design decision has no page blueprint coverage | Visual/UX decision needs founder input |
| A conflict cannot be resolved by union/dedup logic | Structural conflict; could lose data |
| A slice spec says "requires founder approval" | Explicit human gate |
| A route needs to be deleted (not just wrapped) | Navigation change affects demo flow |
| Production environment variables must change | Deployment-sensitive |
| A test requires live/real user data to pass | Privacy/trust boundary |
| Merge is blocked by a human reviewer request | Governance boundary |
| A dependency slice (marked status: blocked) is needed | Cannot proceed without unblocking upstream |
| GitHub Actions fails with a code failure (not billing) | Must diagnose before merge |

## Notification format

When stopping (Tier 3), the PushNotification must include:

```
Title: "AbarVa: Autonomous run needs your input"
Body: "Wave [XX] paused at [SLICE_ID] — [CONDITION_DESCRIPTION].
Action needed: [EXACT_ACTION_ANAND_MUST_TAKE].
Context: docs/backlog/BACKLOG_CURRENT_STATE.md"
```

When completing a wave (normal path), the PushNotification must include:

```
Title: "AbarVa Wave [XX] merged"
Body: "PR #[NNN] merged. [N] slices. Next: Wave [YY] — [THEME].
[Any deferred items or decisions noted]."
```

## Loop policy

The autonomous agent loops to the next wave ONLY if:
1. BACKLOG_CURRENT_STATE.md has autoLoopEnabled: true
2. No Tier 3 blockers exist
3. The next wave has no human-required blocker conditions
4. The previous wave's build is clean on main

If autoLoopEnabled is false (default), the agent stops after one wave and waits for the next manual trigger.

## How Anand enables the loop

To enable continuous autonomous execution across multiple waves:
1. Update BACKLOG_CURRENT_STATE.md: set autoLoopEnabled: true
2. Start a session with: "Read /Users/anand/Projects/nexus/docs/backlog/BACKLOG_ORCHESTRATION_PROMPT.md and execute autonomously."
3. Agent will execute wave after wave, notifying between each, until a Tier 3 blocker or all waves complete.

To pause: update BACKLOG_CURRENT_STATE.md: set autoLoopEnabled: false. The agent will complete the current wave and stop.
