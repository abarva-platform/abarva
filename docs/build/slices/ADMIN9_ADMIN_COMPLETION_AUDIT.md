# ADMIN9 — Admin Completion Audit + Plan

## Metadata
- ID: ADMIN9
- Title: Admin Completion Audit + Plan
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-completion
- Status: code_complete
- Type: docs
- Dependencies: ADMIN1–ADMIN8, AGENT1A+1B
- Estimated complexity: M

## Purpose
Produce three parallel audits that converge on a concrete, sequenced backlog for `wave-admin-completion`. The audit IS the deliverable — no app code is touched. The audit answers three questions: (1) what to do with the 16 live legacy `/platform/admin/*` sub-routes, (2) what depth each canonical `/admin/*` page needs beyond its current Steward editorial card + canonical canvas widget, and (3) for every interaction discovered, whether it ships now (SAFE), ships disabled (STUB), or defers to Wave 27+ (HARD-GATED).

## Context
After ADMIN1–8 + AGENT1, the canonical admin tree is locked: 8 pages at `/admin/*`, Clerk auth gate at `/admin/layout.tsx`, AGENT1 deterministic editorial / posture / choices wired across all 8 page-views, ADMIN7 visual-lock regression tests + shell hex-audit script. WIRE2B compliance scores: Admin 92, Production Readiness 92, Architecture 90. What's still unresolved: 16 live `/platform/admin/*` legacy sub-routes (some duplicating canonical pages, some hosting unique engagement-ops content, some stubs), and most canonical pages stop at the editorial card with thin or absent drill-downs. This slice produces the audit + backlog so the next wave can execute against concrete slice IDs.

## Target state
- `docs/build/ADMIN_COMPLETION_AUDIT.md` (~600 lines) ships with three audits + backlog plan + effort estimate.
- 10 slice docs ship at `docs/build/slices/ADMIN10_*.md` through `ADMIN19_*.md` (status: backlog).
- `wave-admin-completion` registered in `build-waves.json` + `backlog-registry.json` with status `planned` and ADMIN10–19 in `plannedSlices`.
- `BACKLOG_CURRENT_STATE.md` updated to reflect ADMIN9 as last completed slice + `wave-admin-completion` as next wave.

## Allowed files
- `docs/build/ADMIN_COMPLETION_AUDIT.md` (new)
- `docs/build/slices/ADMIN9_ADMIN_COMPLETION_AUDIT.md` (this file)
- `docs/build/slices/ADMIN10_*.md` through `ADMIN19_*.md` (new)
- `docs/build/build-slices.json` (append ADMIN9 + ADMIN10–19 entries)
- `docs/build/build-waves.json` (append wave-admin-completion entry)
- `docs/backlog/backlog-registry.json` (append ADMIN10–19 + wave-admin-completion)
- `docs/backlog/tracks/06-admin-readiness-architecture/BACKLOG.md` (append wave-admin-completion section)
- `docs/backlog/BACKLOG_CURRENT_STATE.md` (rewrite "last completed" + "next wave" header)

## Forbidden files
- `src/**` — no source code
- `supabase/**`, `db/**` — no migrations
- `package.json`, `package-lock.json` — no dependency changes
- Any `production_ready: true` flag flip

## Implementation scope
1. Catalogue the 19 sub-routes under `src/app/(maestro)/platform/admin/*` (plus root). Read each, record purpose / auth / data deps / reachability / disposition.
2. For each of the 8 canonical `/admin/*` pages, document the canvas content blueprint (sub-nav, drill-down, action strip, interactives, AGENT1 integration).
3. Classify every interaction discovered as SAFE / STUB / HARD-GATED with a one-line reason.
4. Write `docs/build/ADMIN_COMPLETION_AUDIT.md` with executive summary + 3 audits + backlog plan + Wave-27+ deferral list + effort estimate.
5. Generate 10 slice doc stubs (ADMIN10–19) using ADMIN3/ADMIN8 as templates.
6. Append manifest entries: `build-slices.json`, `build-waves.json`, `backlog-registry.json`.
7. Append wave-admin-completion section to track BACKLOG.md.
8. Rewrite the header of `BACKLOG_CURRENT_STATE.md` to point at ADMIN9 + wave-admin-completion.

## Tests
None — docs-only slice. Validation is JSON-parse + hygiene gate + tsc/build no-op.

## Validation
```bash
node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8'));"
node -e "JSON.parse(require('fs').readFileSync('docs/build/build-waves.json','utf8'));"
node -e "JSON.parse(require('fs').readFileSync('docs/backlog/backlog-registry.json','utf8'));"
git status --short
npx tsc --noEmit --pretty false 2>&1 | grep "error TS" | head -5
bash scripts/integration/hygiene_gate.sh --skip-build
```

## Acceptance criteria
1. Audit doc is ~400–600 lines and contains all 3 audits + executive summary + backlog plan.
2. All 17 actionable legacy routes have an honest disposition (KEEP / MERGE / DEPRECATE / REDIRECT).
3. All 8 canonical pages have canvas content blueprints with sub-nav, drill-downs, action strip, interactives, AGENT1 integration.
4. Every interaction is classified SAFE / STUB / HARD-GATED with a one-line reason.
5. 10 slice doc stubs exist for ADMIN10–19 (status: backlog).
6. `wave-admin-completion` registered with status `planned` (NOT merged).
7. ADMIN9 in `build-slices.json` is `code_complete` (the audit IS the deliverable).
8. JSON files all parse.
9. No app code touched.
10. `bash scripts/integration/hygiene_gate.sh --skip-build` passes.

## Risks
- KEEP-count inflation if disposition leans optimistic; mitigation = honest pass, only KEEP routes with genuinely unique non-engagement-ops content.
- HARD-GATED list may grow during ADMIN11–17 implementation; the audit lists known cases but does not pretend exhaustiveness for runtime-dependent affordances.

## Founder review
View `docs/build/ADMIN_COMPLETION_AUDIT.md` and the 10 slice docs in `docs/build/slices/ADMIN10_*.md`–`ADMIN19_*.md`. The wave is registered as `planned` in `build-waves.json` for execution next session.
