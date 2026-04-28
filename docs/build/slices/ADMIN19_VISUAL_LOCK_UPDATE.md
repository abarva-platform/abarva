# ADMIN19 — Visual Lock + Regression Update

## Metadata
- ID: ADMIN19
- Title: Visual lock + regression update for completion wave
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-completion
- Status: backlog
- Type: qa
- Dependencies: ADMIN10–ADMIN18
- Estimated complexity: S

## Purpose
Extend ADMIN7's 70-test regression suite to cover all the new canvas widgets, drawers, tabs, and stub-button components introduced by ADMIN11–18. Reaffirm hex/font/shell/logo lock across the expanded admin surface. Update WIRE2B compliance scores.

## Context
ADMIN7 locked the admin canon at 70 tests with the original 8-page footprint. ADMIN11–18 add ~30 new components (drawers, tabs, sparklines, matrices). Without a regression update, banned hex tokens + V1 shell imports could sneak back in.

## Target state
- ADMIN7 regression test suite extended with assertions for every new ADMIN11–18 component.
- Shell-level hex audit script (`scripts/integration/check_admin_design_tokens.sh`) covers the new file set.
- WIRE2B compliance scores re-audited and bumped honestly:
  - Admin: 92 → 95 (depth + drill-downs)
  - Production Readiness: 92 → 95
  - Architecture: 90 → 95 (closes ADMIN7's open component-drawer deviation)
  - Connectors / Data Trust / Users & Access / Agent Readiness / Build Progress: rescored
- All STUB buttons have accessible disabled state + reason copy.

## Allowed files
- `src/__tests__/integration/admin/admin7-visual-lock.test.ts` (extend, NOT replace)
- `src/__tests__/integration/admin/admin19-completion-visual-lock.test.ts` (new)
- `scripts/integration/check_admin_design_tokens.sh` (extend file glob)
- `src/lib/qa/wireframe-compliance-audit.ts` (rescore)
- `src/__tests__/integration/qa/wireframe-compliance-audit.test.ts` (assertions update)
- `docs/build/slices/ADMIN19_VISUAL_LOCK_UPDATE.md`

## Forbidden files
- Any source file in `src/components/admin/**` or `src/lib/admin/**` (read-only here)
- Production-readiness flip — NEVER `production_ready: true`

## Implementation scope
1. Audit every new ADMIN11–18 component for banned hex tokens.
2. Extend ADMIN7 test glob to cover new component directories.
3. Add new ADMIN19 tests asserting every new tab + drawer + stub follows the canon.
4. Re-run WIRE2B compliance audit; bump scores honestly only where deviation closed.
5. Assert STUB buttons all have `aria-disabled="true"` + reason text.

## Tests
- All new ADMIN11–18 components pass the banned-hex sweep.
- All new admin pages still import AdminCanonShellV2.
- All STUB buttons have accessible disabled state.
- WIRE2B score deltas match the rescore.

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/__tests__
npx jest src/__tests__/integration/admin/admin7-visual-lock
npx jest src/__tests__/integration/admin/admin19-completion-visual-lock
bash scripts/integration/check_admin_design_tokens.sh
bash scripts/integration/hygiene_gate.sh --skip-build
```

## Acceptance criteria
1. ADMIN7 + ADMIN19 tests both pass.
2. Hex audit script PASS across the expanded admin surface.
3. WIRE2B scores updated with honest deltas only.
4. NO `production_ready: true` flip.

## Risks
- Score inflation if rescore is optimistic. Each delta must trace to a closed deviation in WIRE2B's deviation_map.

## Founder review
Run the regression suite locally. Inspect WIRE2B scores. Verify no banned tokens.
