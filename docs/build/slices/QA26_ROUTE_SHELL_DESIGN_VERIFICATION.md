# QA26 — Route-to-Shell Design Verification

## Goal
Add deterministic verification that proves target routes are mounted through canonical shell ownership and highlights legacy shell bindings with explicit remediation/defer signals.

## Deliverables
- `src/lib/qa/route-shell-design-verification.ts`
- `src/__tests__/integration/qa/route-shell-design-verification.test.ts`
- `docs/build/ROUTE_SHELL_DESIGN_VERIFICATION_RUNBOOK.md`

## Verification Rules
- target routes exist
- canonical shell markers are present
- workflow markers are present
- legacy shell imports are flagged
- Source commercial route mount is checked
- non-compliant routes require explicit deferral

## Validation
- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/qa/route-shell-design-verification.test.ts`
- `npx eslint --max-warnings=0 src/lib/qa/route-shell-design-verification.ts src/__tests__/integration/qa/route-shell-design-verification.test.ts src/lib/qa/index.ts`

## Status
- `code_complete`

