# 2026-06-21-ava-rebrand-moves-source — Ava on Moves and Source

## Release ID

`2026-06-21-ava-rebrand-moves-source`

## Status

`candidate`

## Plain-English Summary

Extends the voice-only Ava rebrand to the Moves (was "Nexus") and Source (was "Sentinel") surfaces. User-visible agent labels become "Ava" — agent name/avatar props, "Ask Ava" placeholders, "Ava will…/is running…" prose, section eyebrows, and the route-shell breadcrumb. The shell `DEFAULT_AGENT` map now maps programs/source → "Ava" (only Setup/Steward remains on its own name). Source's own chat voice is now "You are Ava" (was "You are Sentinel Source"), and the Source lib render-strings (event synopsis, seed, program handoff) say "Ava". Internal identifiers — component names (NexusProgramWorkbench, SentinelEngagementCanvas, …), agent ids ('nexus'/'sentinel'), telemetry keys, routes, contracts — are unchanged, so the specialists persist only in trace/audit, never as the agent the user talks to.

## Layer Impact

- **global-control-lane:** user-visible agent-name strings across `src/components/strategic-moves`, `src/components/programs`, `src/components/source`; the shell `DEFAULT_AGENT` map (programs/source → Ava); Source chat voice (`src/lib/source/sentinel-chat-llm.ts`) + three Source lib render-strings. No identifiers, ids, routes, telemetry, or contracts changed. A rebrand-introduced `${kind}` interpolation drop in `SourcePortfolioReactivePanel.tsx` was caught and restored.

## Client Applicability

- All clients: Yes — every tenant sees "Ava" on Moves and Source.
- Specific clients: None bespoke.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None — the standard going forward.

## Changes Included

- `src/components/strategic-moves/*` (5) + `src/components/programs/*` (13) — Nexus→Ava visible labels.
- `src/components/source/*` (45) — Sentinel/Nexus→Ava visible labels + the `${kind}` restoration.
- `src/components/shell/AtlasPageStateProvider.tsx` — `DEFAULT_AGENT`: programs/source → "Ava".
- `src/lib/source/sentinel-chat-llm.ts` (voice), `queries.ts`, `mock-seed.ts`, `source-program-handoff.ts` (render strings).
- `src/__tests__/integration/{source,programs}/*` — stale assertions updated to "Ava".

## QA / Validation

Validation: Pass. Full `tsc --noEmit` clean (0 project errors). Test isolation was done rigorously: the full Moves+Source suites were run with the change and on pristine `main`, and the failing-test sets were diffed — the set of NEW failures introduced by the rebrand is EMPTY (the change actually nets one FEWER failure, from the `${kind}` fix). All remaining failures in those suites are PRE-EXISTING on `main` and unrelated to agent names (phase labels, artifact verdicts, tenant guards, determinism fixtures, registry row counts). 14 stale agent-name assertions were updated to "Ava"; component-name identifiers in tests were intentionally left. Live signed-in re-proof (Moves + Source present "Ava") runs after deploy.

## Rollout Plan

Merge to `main`; `aca-main-deploy` auto-deploys. Re-prove on Apex that Moves and Source present "Ava".

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` (auto on push to `main`).
- Shared runtime mutators: none.
- Approved image digest: built by the deploy workflow from this commit.
- ACA runtime invariant: web app serves the updated client bundle + Source voice after deploy.
- Worker image invariant: n/a.
- Feature/env flag update path: n/a.
- Live signed-in proof required: Yes — Moves + Source agent labels read "Ava".

## Rollback Plan

Revert the PR — restores Nexus/Sentinel display + the prior Source voice. Display + prompt strings (and one one-token interpolation fix); no data/migration.

## Known Gaps

- The `learn/` training sections (Moves + Source) still narrate the OLD multi-agent model ("Sentinel for stages 1–9, Atlas takes over"; "Working with Sentinel" explainer; Glossary terms) — these need a CONTENT rewrite, not a label swap, and are deliberately deferred to a separate pass.
- `PricingTrapLog` still shows specialist badges ("SENTINEL"/"NEXUS") because the names are color-map lookup keys; treated as a trace/attribution view for now.
- `NexusReactivePanel` retains a 'Nexus' default fallback only on the no-prop path (the live render passes 'Ava').
- Setup (Steward) not rebranded — separate pass.
- Visual re-proof pending deploy.

## Audit Evidence

- PR URL: (filled on creation) `claude/ava-rebrand-moves-source` → `main`.
- CI: `npm run release:check`, full `tsc` clean, mine-vs-main failing-set diff = 0 new failures.
