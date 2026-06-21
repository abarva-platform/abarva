# 2026-06-21-ava-rebrand-voice-learn-complete — Ava rebrand: live voices, Learn content, and the missed long tail

## Release ID

`2026-06-21-ava-rebrand-voice-learn-complete`

## Status

`candidate`

## Plain-English Summary

A detailed verification pass found the earlier surface-by-surface Ava rebrand was only skin-deep: the LIVE agent voices still introduced themselves by the old names. This change makes the rebrand real and complete:

1. **Live agent voices → Ava.** Every runtime system prompt that said "You are Nexus/Sentinel/Atlas/Steward" now says "You are Ava" — across `src/lib/agent/voice-doctrine/*`, `src/lib/agent/prompts/*`, the per-mode map in `/api/chat/agent`, every `*/synthesis/route.ts`, the program/source artifact-draft routes, `lib/nexus`, `lib/atlas`, `lib/prompts`, `lib/programs/nexus-free-text`, and the Setup loader chat. The agent now presents as Ava when a user talks to it.
2. **Learn content rewritten** (42 files) from the old multi-agent handoff narrative ("Sentinel runs stages 1–9, Atlas takes over") to one continuous Ava who draws on named specialist expertise behind the scenes; glossaries reframed.
3. **The missed visible long tail** (~25 labels) → Ava: Setup ask bars, the Atlas signal panel, the public-site Ask affordance, the shared AskAnythingBar, intelligence/source/home agent props.
4. **Source executive-stage cluster.** The Source canvas still showed "Atlas" leading the executive stages (10–11) and "Steward" on the gate stage — the old handoff. Unified to Ava (the stage-appropriate ROLE copy stays; only the name is Ava).

Internal identifiers (component/const/type names, agent ids, route paths, telemetry), the named-specialist CATALOGS (AgentRail, ExperienceGallery roster, FourAgentDiagram, PricingTrapLog, the fabrication-guard allowlist), and genuine non-agent names (vendor "Atlas" in a scorecard) are intentionally unchanged.

## Layer Impact

- **global-control-lane + internal-admin + public-demo:** runtime agent system prompts (voice-doctrine, prompts, API synthesis/draft routes), Learn content, and remaining visible agent-name labels across home/intelligence/source/admin/setup/public-site → "Ava". No identifiers, ids, routes, telemetry, contracts, or catalogs changed.

## Client Applicability

- All clients: Yes — the agent presents as "Ava" in chat and across all surfaces and Learn content.
- Specific clients: None bespoke.
- Internal only: No (covers product + public site + admin).
- Public/demo only: Includes the public-site Ask affordance.
- Feature flag: None.

## Changes Included

- Voice layer: `src/lib/agent/voice-doctrine/{nexus,sentinel,atlas,steward}.ts`, `src/lib/agent/prompts/{engagement,engagement-create,identity,data,intelligence}.ts`, `src/lib/context-ingestion/loader/steward-chat.ts`, `src/lib/{nexus,atlas,prompts,programs}/…`.
- API route system prompts: `src/app/api/chat/agent/route.ts`, `src/app/api/{programs,source,tower}/synthesis/route.ts`, `src/app/api/programs/workspace/[moveId]/artifact/route.ts`, `src/app/api/v1/programs/[programId]/nexus/draft/route.ts`, `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`.
- Learn content: `src/components/home/learn/*`, `src/components/source/learn/*` (42 files).
- Visible labels: home/intelligence/source/admin/setup/public-site components + AskAnythingBar; Source executive-stage cluster (UniversalCanvasShell, SourceValueLedger, PersistentNexusPanel, SourceEventAgentCanvas, SourceActiveStageWorkspace, AbarVaSourceDashboard, SourceArtifactDrawer).
- Test assertions updated to "Ava" across the affected suites.

## QA / Validation

Validation: Pass. Full `tsc --noEmit` clean (0 project errors). Fast suites green: behaviors 195/195, nav 26/26. Voice/prompt suites pass (the wholly-scoped voice-doctrine + prompts + steward-chat suites). RIGOROUS test isolation: the full affected test surface was run with the change AND on pristine `main`, and the failing-test sets were diffed — after updating the stale agent-name assertions, the set of NEW failures is EMPTY. All remaining failures in those areas are pre-existing on `main` (data/context/verdict/registry fixtures) and unrelated to agent names; flake from cross-suite ordering (e.g. a board-grade PPTX suite that passes 9/9 in isolation) was identified and excluded. Completeness audit: `grep` for `"You are {Nexus|Sentinel|Atlas|Steward|Source},"` and visible `"Ask {old}"` both return ZERO. Live signed-in re-proof (the agent introduces itself as Ava in chat) runs after deploy.

## Rollout Plan

Merge to `main`; `aca-main-deploy` auto-deploys. Re-prove the agent presents as "Ava" in a live signed-in chat on a couple of surfaces.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` (auto on push to `main`).
- Shared runtime mutators: none.
- Approved image digest: built by the deploy workflow from this commit.
- ACA runtime invariant: web app + API serve the updated prompts/labels after deploy.
- Worker image invariant: n/a.
- Feature/env flag update path: n/a.
- Live signed-in proof required: Yes — agent self-introduces as Ava.

## Rollback Plan

Revert the PR — restores the prior voices/labels/Learn copy. Prompt + display strings and content; no data/migration.

## Known Gaps

- Named-specialist CATALOGS intentionally keep the four names (AgentRail, ExperienceGallery roster, public-site FourAgentDiagram, PricingTrapLog, HandoffAffordance config, the fabrication-guard allowlist).
- A few third-person voice-register descriptors (e.g. "Sentinel voice register" as a named brand-voice STYLE) remain as style references inside prompts; the agent's first-person identity is Ava.
- The legacy `AbarNexusWordmark` brand-lockup component and `AGENT_DOCK.md` dev doc are untouched.
- Live signed-in re-proof pending deploy.

## Audit Evidence

- PR URL: (filled on creation) `claude/ava-verify-learn` → `main`.
- CI: `npm run release:check`, full `tsc` clean, completeness audit (0 remaining voices/labels), mine-vs-main failing-set diff = 0 new failures.
