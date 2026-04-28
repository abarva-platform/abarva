# ADMIN-DATA6 — `/admin/agent-readiness` Wired to Adapter

## Metadata
- ID: ADMIN-DATA6
- Title: `/admin/agent-readiness` consumes admin-agent-readiness-adapter
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-data
- Status: backlog
- Type: code
- Dependencies: ADMIN-DATA2
- Estimated complexity: M

## Purpose
Replace the per-tenant `COVERAGE` matrix and per-agent `topGap` derivation in `src/lib/admin/agent-readiness-page-view.ts` with adapter calls. Concept-level constants (`AGENT_CAPABILITIES`, `AGENT_LABELS`, `AGENT_GOVERNS`, `SURFACE_LABELS`, `TABS`, `SEED_ACTION_STRIP`) stay deterministic.

## Context
Per ADMIN-DATA1 audit Section 2.3, `COVERAGE` and `topGap` are derivable from connector + dataset readiness state. Once DATA4 + DATA5 land, this adapter's real-DB path joins those reads. Until then, fixture mode mirrors today's hardcoded values.

## Target state
- `agent-readiness-page-view.ts` removes `COVERAGE` literal and inline `topGap` strings.
- View builder calls `getAdminAgentReadiness(tenantSlug)`.
- ADMIN12 regression tests (66) green.

## Allowed files
- `src/lib/admin/agent-readiness-page-view.ts`
- `src/app/(maestro)/admin/agent-readiness/page.tsx`
- `src/lib/admin/__tests__/agent-readiness-page-view.test.ts`
- `docs/build/slices/ADMIN-DATA6_*.md`
- `docs/build/build-slices.json`

## Forbidden files
- `src/lib/admin/data/**`
- `supabase/migrations/**`
- AGENT1 context bundle (DATA11 owns that change)
- Other admin page-views

## Implementation scope
1. Async view builder.
2. Call `getAdminAgentReadiness(tenantSlug)`.
3. Replace `COVERAGE` and `topGap` derivation; keep capability + label dictionaries.
4. URL-driven sub-tabs preserved (Overview / Steward / Nexus / Sentinel / Atlas).

## Tests
- Adapter-mock tests; fixture parity vs current 4×5 coverage matrix.

## Validation
Standard.

## Acceptance criteria
1. No `COVERAGE` literal in page-view.
2. View builder async + adapter-driven.
3. ADMIN12 regression tests green.
4. URL searchParams preserved.
5. AGENT1 context bundle untouched (DATA11 scope).

## Risks
- Coupling to DATA11 — the adapter's real-DB derivation depends on connector + dataset state. Fixture mode shields against premature coupling.

## Founder review
Visit `/admin/agent-readiness`. Content identical in fixture mode.
