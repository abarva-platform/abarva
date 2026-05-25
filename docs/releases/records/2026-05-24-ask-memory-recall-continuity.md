# 2026-05-24-ask-memory-recall-continuity — Ask Memory Recall Continuity

## Release ID

`2026-05-24-ask-memory-recall-continuity`

## Status

`candidate`

## Plain-English Summary

The Foundation Fix verification probe showed that Intelligence Ask session rows existed, but recap/repeat follow-ups could still drift because long Sentinel turns were truncated before the final IDs and recommendations. This patch preserves both the head and tail of long memory turns and instructs the synthesizer to answer repeat/recap/continue prompts from session memory first.

## Layer Impact

`agent-reasoning-lane`: Improves continuity for follow-up questions that refer to prior Intelligence Ask turns.

`client-data-lane`: No schema change; uses the existing session-memory tables.

## Client Applicability

- All clients: yes, authenticated Intelligence Ask sessions.
- Specific clients: Apex verification exposed the issue.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Memory formatter: `src/lib/intelligence/ask/session-memory.ts`
- Synthesis prompt instruction: `src/lib/intelligence/ask/synthesizer.ts`
- Smoke assertion: `scripts/smoke/foundation-fix-2-session-memory.spec.ts`

## QA / Validation

- `npm run smoke:foundation-fix-2-session-memory` — passed locally.
- Focused `npx eslint` on changed files — passed locally.
- `git diff --check` — passed locally.

## Rollout Plan

Merge to main and deploy. Rerun the Apex production memory probe: ask for three exact initiatives, then ask Sentinel to repeat the three it just named.

## Rollback Plan

Revert this PR. Existing session-memory tables and rows remain valid.

## Audit Evidence

Before this patch, production returned a session row and no prior-context admission, but the repeat response did not include the prior `INIT-` identifiers.

## Known Gaps

This is a continuity-strengthening patch, not the full Packet 22 Decision Dossier.
