# 2026-06-21-ava-rebrand-home-intel-tower — Ava as the single agent voice (Home/Intelligence/Tower)

## Release ID

`2026-06-21-ava-rebrand-home-intel-tower`

## Status

`candidate`

## Plain-English Summary

Makes "Ava" the single user-facing agent name on the Home, Intelligence, and Tower surfaces. Previously these surfaces named the agent "Atlas" (Tower, Home) and "Sentinel" (Intelligence). This is a VOICE-ONLY rebrand: only user-visible strings change (headers, kickers, placeholders, aria-labels, agent display-name props, the model's self-identity in answers). The internal specialist names (Atlas/Sentinel/Nexus/Steward) are unchanged everywhere they are identifiers — component names, agent ids, telemetry keys, routes, contracts — so they continue to surface to users only as named specialists in trace/audit, never as the agent the user talks to. The shell agent-name map (`DEFAULT_AGENT`) is the single source of truth and now maps home/tower/intelligence → "Ava". The Intelligence synthesizer's self-identity is now "You are Ava".

## Layer Impact

- **global-control-lane:** user-visible agent-name strings across the Intelligence (v2/v3/v4 + app/intelligence) and Tower component trees; the shell `DEFAULT_AGENT` map (home/tower/intelligence → "Ava"); the Intelligence synthesizer system prompt self-identity + example speaker labels. No identifiers, ids, routes, telemetry, or contracts changed.

## Client Applicability

- All clients: Yes — every tenant sees "Ava" instead of "Sentinel"/"Atlas" on Home, Intelligence, and Tower.
- Specific clients: None bespoke.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None — this is the standard going forward.

## Changes Included

- `src/components/shell/AtlasPageStateProvider.tsx` — `DEFAULT_AGENT`: home/tower/intelligence → "Ava" (source/programs/setup unchanged this pass).
- `src/lib/intelligence/ask/synthesizer.ts` — self-identity "You are Ava…" (full + concise prompts), example speaker labels "AVA:", not-configured message.
- Intelligence surfaces (14 files, v2/v3/v4 + `src/app/intelligence/*`) — visible Sentinel→Ava strings + one test updated ("Ask Ava").
- Tower surfaces (17 files) — visible Atlas→Ava strings + agent display-name/initials props; the AI Control Tower kicker → "AVA · CONTROL TOWER".

## QA / Validation

Validation: Pass. Full `tsc --noEmit` clean (0 project errors, excluding the known optional-dep module noise). Fast suites green: behaviors 195/195, nav 26/26. Rebranded-surface component tests: 28 pass; the 1 failure (`AiControlTowerPage › answers executive questions`) is PRE-EXISTING — it fails identically on pristine `main` with all rebrand changes stashed, so it is unrelated to this change. One stale assertion updated (`SentinelExplorerRail.test.tsx`: "Ask Sentinel" → "Ask Ava"). Voice-only safety: only display strings changed; component names, agent ids ('sentinel'/'atlas'/'nexus'), routes, telemetry keys, and the cross-surface-consistency identifier registry are untouched. The live signed-in visual proof (Home/Intelligence/Tower chrome shows "Ava") runs after deploy.

## Rollout Plan

Merge to `main`; `aca-main-deploy` auto-deploys. Then re-prove on Apex that Home/Intelligence/Tower present "Ava".

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` (auto on push to `main`).
- Shared runtime mutators: none.
- Approved image digest: built by the deploy workflow from this commit.
- ACA runtime invariant: web app serves updated client bundle + synthesizer after deploy.
- Worker image invariant: n/a.
- Feature/env flag update path: n/a.
- Live signed-in proof required: Yes — verify the agent label reads "Ava" on Home/Intelligence/Tower after deploy.

## Rollback Plan

Revert the PR — restores the prior per-surface names. Pure display + prompt strings; no data/migration.

## Known Gaps

- Source, Moves (Nexus), and Setup (Steward) are NOT rebranded in this pass — both their shell-map entries and in-page strings remain, deliberately kept consistent; they are the next pass to do fully.
- Avatar initials updated where obvious ("At"→"Av", "SI"→"Av"); any remaining specialist-derived initials elsewhere are cosmetic.
- Pre-existing `AiControlTowerPage` test failure (unrelated) remains; not addressed here.
- Visual re-proof pending deploy.

## Audit Evidence

- PR URL: (filled on creation) `claude/ava-rebrand` → `main`.
- CI: `npm run release:check`, full `tsc` clean, behaviors 195/195 + nav 26/26, pre-existing-failure isolation documented above.
