# ADMIN0 — Admin Redesign Backlog Registration

## Metadata
- ID: ADMIN0
- Title: Admin Redesign Backlog Registration
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-redesign
- Status: code_complete
- Type: docs
- Dependencies: none
- Estimated complexity: S

## Purpose
Register the Admin Surface Canonical Redesign wave (ADMIN1–ADMIN7) in the canonical backlog system so future autonomous and human sessions can pick up the work. Docs-only — no app code, no routes, no migrations.

## Context
On 2026-04-27 the founder shared the new `abarva_logo_lockup_v2.svg` and 5 wireframes locking the canonical admin layout pattern. Current admin compliance score is 72/100 (WIRE2B) — the structural ceiling that requires this redesign to break.

## Target state
- Wave spec written at `docs/backlog/waves/WAVE-ADMIN-REDESIGN.md`
- 8 slice docs (ADMIN0–ADMIN7) under `docs/build/slices/`
- `docs/build/build-slices.json` carries 8 new entries (ADMIN0 = code_complete, ADMIN1–7 = backlog)
- `docs/build/build-waves.json` carries `wave-admin-redesign` planned-wave entry
- `docs/backlog/backlog-registry.json` carries the wave + 8 slices
- Track BACKLOG `06-admin-readiness-architecture/BACKLOG.md` updated with the new wave section

## Allowed files
- `docs/backlog/waves/WAVE-ADMIN-REDESIGN.md`
- `docs/build/slices/ADMIN0_BACKLOG_REGISTRATION.md`
- `docs/build/slices/ADMIN1_FOUNDATION_LOGO_TOKENS.md`
- `docs/build/slices/ADMIN2_ADMIN_SHELL_3ZONE.md`
- `docs/build/slices/ADMIN3_STEWARD_EDITORIAL.md`
- `docs/build/slices/ADMIN4_ARCHITECTURE_PAGE.md`
- `docs/build/slices/ADMIN5_PRODUCTION_READINESS_PAGE.md`
- `docs/build/slices/ADMIN6_REMAINING_SUB_PAGES.md`
- `docs/build/slices/ADMIN7_VISUAL_LOCK.md`
- `docs/build/build-slices.json`
- `docs/build/build-waves.json`
- `docs/backlog/backlog-registry.json`
- `docs/backlog/tracks/06-admin-readiness-architecture/BACKLOG.md`

## Forbidden files
- Any `src/**` (no app code, no components, no read-models)
- Any `public/**` asset (logo copy is owned by ADMIN1)
- Any migration, route, or API file
- `docs/backlog/BACKLOG_CURRENT_STATE.md` (post-merge update only, separate commit)

## Implementation scope
1. Author the wave spec at `docs/backlog/waves/WAVE-ADMIN-REDESIGN.md` covering theme, goal, founder source, lane definitions for ADMIN1–7, integration order, acceptance criteria, risks, and founder review routes.
2. Author 8 slice docs at the listed paths using the canonical slice template.
3. Append 8 entries (ADMIN0–7) to `docs/build/build-slices.json`. ADMIN0 status `code_complete`; ADMIN1–7 status `backlog`.
4. Append wave entry `wave-admin-redesign` to `docs/build/build-waves.json` with `plannedSlices: [ADMIN1..ADMIN7]`, `completedSlices: [ADMIN0]`.
5. Append wave + 8 slice entries to `docs/backlog/backlog-registry.json`.
6. Update `docs/backlog/tracks/06-admin-readiness-architecture/BACKLOG.md` with a new wave section.
7. Validate every JSON file parses cleanly.

## Tests
No new tests. This is a docs-only registration. Existing tests must remain green:
- `npx tsc --noEmit` (must remain clean — no source files touched)
- `bash scripts/integration/hygiene_gate.sh --skip-build` (must PASS)

## Validation
```bash
node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('docs/build/build-waves.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('docs/backlog/backlog-registry.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8'))"
npx tsc --noEmit --pretty false
bash scripts/integration/hygiene_gate.sh --skip-build
```

## Acceptance criteria
1. Wave spec exists at `docs/backlog/waves/WAVE-ADMIN-REDESIGN.md`.
2. 8 slice docs exist under `docs/build/slices/`.
3. `build-slices.json` has 8 new entries with the correct statuses.
4. `build-waves.json` has the new wave entry.
5. `backlog-registry.json` has the new wave + 8 slices.
6. Track BACKLOG updated.
7. All JSON files parse cleanly.
8. TypeScript clean (no source touched).
9. Hygiene gate PASS.

## Risks
- Drift from the existing slice/wave/registry shape — mitigated by reading recent NAV1G entry as the template.
- Forgetting to mark ADMIN0 as `code_complete` while ADMIN1–7 are `backlog`.
- Accidentally staging the unrelated untracked planning files in the worktree — mitigated by explicit `git add` of each file path (no `git add .`).

## Founder review
No runtime changes. Reviewers see:
- The wave spec
- The 8 slice docs
- Updated manifests

Once merged, ADMIN1–7 are eligible to execute as a separate wave.
