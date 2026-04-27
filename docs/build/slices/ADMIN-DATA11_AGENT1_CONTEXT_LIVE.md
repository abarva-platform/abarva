# ADMIN-DATA11 — AGENT1 Context Bundle Wired to Real DB

## Metadata
- ID: ADMIN-DATA11
- Title: AGENT1 context bundle source switched from constants to live DB
- Track: 06-admin-readiness-architecture (cross-cuts 07-agent-reasoning-foundation)
- Wave: wave-admin-data
- Status: backlog
- Type: code
- Dependencies: ADMIN-DATA10
- Estimated complexity: L

## Purpose
Replace the hardcoded constants in `src/lib/agent/context-bundle.ts` (`buildAgentContext`) with reads from the new admin tables. The `AgentContextBundle` shape stays identical; only the source changes. AGENT1's deterministic editorial / posture / choices logic continues to work without modification.

## Context
Per ADMIN-DATA1 audit Section 6 + 7.7, AGENT1 currently reads tenant context from hardcoded constants for the Apex Retail demo tenant. Once admin tables are seeded (DATA10), `buildAgentContext` should read connector + dataset + blocker + setup-progress states from `admin_connectors`, `admin_datasets`, `admin_blockers`, `admin_setup_progress`. Editorial and posture logic stays untouched at the API surface — only the source-of-truth flips.

## Target state
- `src/lib/agent/context-bundle.ts` — `buildAgentContext(tenantSlug, surface, page)` becomes async; calls admin adapters internally.
- Existing `AgentContextBundle` shape preserved.
- `generateStewardEditorial`, `computeAllPostures`, `buildAgentChoices` signatures unchanged.
- All 8 admin page-views become async (or already are post-DATA3-9); page routes await.
- Feature flag `AGENT_CONTEXT_LIVE_DB=1` gates the change for safe rollback. Default off in this slice; flipped on in DATA13.
- AGENT1A + AGENT1B regression tests (180 tests across context, posture, editorial, choices) all green.

## Allowed files
- `src/lib/agent/context-bundle.ts`
- `src/lib/agent/__tests__/context-bundle.test.ts`
- `src/lib/admin/*-page-view.ts` (only to handle async if needed)
- `src/app/(maestro)/admin/**/page.tsx` (await)
- `docs/build/slices/ADMIN-DATA11_*.md`
- `docs/build/build-slices.json`

## Forbidden files
- `src/lib/agent/posture.ts`, `editorial.ts`, `choices.ts` — those have stable APIs; do not edit
- `supabase/migrations/**`
- Other admin page-views' constants beyond async signature

## Implementation scope
1. Convert `buildAgentContext` to async.
2. Inside, call `getAdminConnectors`, `getAdminDatasets`, `getAdminBlockers`, `getAdminSetupProgress` to populate the bundle.
3. Maintain the existing bundle shape exactly (same field names, types, ordering).
4. Feature flag check at entry; fall back to current hardcoded path if flag off.
5. Update consumers (page-views) for async; most already updated by DATA3-9.
6. Verify AGENT1 regression tests pass against fixture mode (flag off) AND live mode (flag on).

## Tests
- New: `context-bundle.live.test.ts` — flag-on parity vs flag-off (asserts bundle shape identical).
- AGENT1A + AGENT1B existing tests green.

## Validation
```bash
npx tsc --noEmit
npm test -- src/lib/agent
AGENT_CONTEXT_LIVE_DB=1 npm test -- src/lib/agent
npm run build
bash scripts/integration/hygiene_gate.sh --skip-build
```

## Acceptance criteria
1. `buildAgentContext` async; reads from admin adapters when flag on.
2. Bundle shape identical between flag states (parity test green).
3. AGENT1A (113 tests) + AGENT1B (67 tests) regression green in both flag states.
4. Page-views handle async correctly.
5. `production_ready` not flipped.
6. Feature flag default OFF in this slice (DATA13 flips on).

## Risks
- Bundle shape drift between hardcoded and DB → parity test catches.
- AGENT1 reasoning regression in live mode → flag off by default; rollback is single env-var flip.
- Async propagation breaks SSR caching → verified via build test.

## Founder review
With flag off: behavior identical to today. With flag on (and DATA10 seeded): `/admin/*` pages still render same content for Apex Retail; AGENT1 editorial copy may differ slightly because real DB has slight state drift (acceptable).
