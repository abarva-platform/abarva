# ADMIN-DATA13 — Visual + Data Regression Lock

## Metadata
- ID: ADMIN-DATA13
- Title: Visual + data regression lock for wave-admin-data
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-data
- Status: backlog
- Type: qa
- Dependencies: ADMIN-DATA12
- Estimated complexity: S

## Purpose
Extend the ADMIN19 regression suite to cover the new ADMIN-DATA12 Overview components and add **data parity** assertions that catch fixture-vs-live drift. Flip the `AGENT_CONTEXT_LIVE_DB=1` flag default to ON. Promote `wave-admin-data` to `merged` once lock passes.

## Context
ADMIN19 locked the visual canon for `wave-admin-completion`. ADMIN-DATA13 does the same for `wave-admin-data` — extends the existing `admin7-visual-lock` suite to include 3 new Overview components, adds a fixture-vs-live data parity test (asserts adapter shapes match between modes for the demo tenants), and audits banned-token sweep across the new files.

## Target state
- `admin7-visual-lock` suite grows from 209 to ~240 assertions (covers 3 new ADMIN-DATA12 components, plus per-page guards verifying `@/lib/admin/data` import is present where expected).
- New: `src/lib/admin/__tests__/data/admin-data-mode-parity.test.ts` — for each adapter, asserts fixture-mode and live-mode (against seed DB) return equal shapes/counts for Apex Retail.
- `AGENT_CONTEXT_LIVE_DB=1` default flipped on in `next.config.mjs` (or equivalent).
- Banned-token sweep clean across all new ADMIN-DATA files.
- `wave-admin-data` status flipped to `merged` in `build-waves.json` after this slice merges.
- WIRE2B Admin Overview rescored 92 → 96 (Overview depth shipped); honest if shipped, honest decline if not.

## Allowed files
- `src/lib/admin/__tests__/visual-lock/**`
- `src/lib/admin/__tests__/data/admin-data-mode-parity.test.ts` (new)
- `next.config.mjs` (flag default — minimal change)
- `docs/build/build-slices.json`
- `docs/build/build-waves.json`
- `docs/build/slices/ADMIN-DATA13_*.md`
- `docs/backlog/BACKLOG_CURRENT_STATE.md`

## Forbidden files
- New admin features
- `src/lib/admin/data/**` (locking, not editing)
- `supabase/migrations/**`

## Implementation scope
1. Extend `admin7-visual-lock` suite with assertions covering 3 new ADMIN-DATA12 components.
2. Add data-mode-parity test.
3. Flip `AGENT_CONTEXT_LIVE_DB` default to on.
4. Banned-token sweep audit.
5. Update WIRE2B compliance scores (honest pass).
6. Promote `wave-admin-data` to `merged`.

## Tests
- ~30 new lock assertions.
- 9 new parity tests (1 per adapter).

## Validation
```bash
npx tsc --noEmit
npm test
npm run build
bash scripts/integration/hygiene_gate.sh --skip-build
bash scripts/integration/wave_progress.sh --wave wave-admin-data
```

## Acceptance criteria
1. `admin7-visual-lock` suite grows to ~240 assertions; all green.
2. Parity tests for 9 adapters green.
3. Banned-token sweep clean across all wave files.
4. `AGENT_CONTEXT_LIVE_DB` default flipped on.
5. `wave-admin-data` status `merged`.
6. WIRE2B Admin Overview score honestly updated.
7. Full admin regression green; hygiene gate 11/11.
8. `production_ready` not promoted.

## Risks
- Parity test flakiness from `created_at` timestamp drift → strip timestamps before compare.
- Flag flip exposes regressions → rollback is single env-var; documented.

## Founder review
Run `bash scripts/integration/wave_progress.sh --wave wave-admin-data` — should show 100% with all 13 slices merged. Visit `/admin` (Overview now shows real data); WIRE2B Admin Overview score rises from 92 → 96.
