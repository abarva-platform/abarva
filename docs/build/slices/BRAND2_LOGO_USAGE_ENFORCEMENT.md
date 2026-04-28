# BRAND2 — Logo Usage Enforcement / Legacy Symbol Retirement

Wave: wave-21
Lane: B
Status: code_complete
Date: 2026-04-26

## What This Slice Delivers

BRAND2 lands the deterministic logo usage enforcement contract for the AbarVa platform. It defines the canonical logo asset and component paths, a set of banned legacy patterns (teal hex, Sanskrit symbol, AI sparkle, old network icon class), and a file-scan enforcement suite that runs as a Jest integration test with zero network calls, zero model calls, and zero live data dependencies.

## Files Created

- `src/lib/qa/logo-usage-enforcement.ts` — enforcement module with `runLogoUsageEnforcement()`, `getBannedLogoPatterns()`, `listLogoEnforcementTargetFiles()`
- `src/__tests__/integration/qa/logo-usage-enforcement.test.ts` — integration test suite (13 assertions)
- `docs/build/LOGO_USAGE_ENFORCEMENT.md` — enforcement authority documentation
- `docs/build/slices/BRAND2_LOGO_USAGE_ENFORCEMENT.md` — this slice contract

## Manifest Updates

- `docs/build/build-slices.json` — BRAND2 entry added
- `docs/build/production-readiness.json` — BRAND2 note appended
- `docs/build/build-waves.json` — wave-21 entry added with BRAND2

## Enforcement Checks

| Check | Status |
|---|---|
| BRAND2-C1: Logo SVG asset exists | deferred (BRAND1 must land — not a codebase defect) |
| BRAND2-C2: AbarVaLogo component exists | deferred (BRAND1 must land) |
| BRAND2-C3: Logo SVG is real asset (>1KB) | deferred (depends on C1) |
| BRAND2-C4: Legacy TopBar is dead code | pass |
| BRAND2-C5: AbarVaAppShell has no teal | pass |
| BRAND2-C7: App layout has no hardcoded wordmark | pass |
| BRAND2-C8: AppShell imports AbarVaLogo (DES9) | deferred (DES9 must land) |

failCount: 0

## Deferred Items

- BRAND2-C1, C2, C3: Blocked on BRAND1 (canonical logo asset and component)
- BRAND2-C6-*: Blocked on BRAND1 (cannot scan component that doesn't exist yet)
- BRAND2-C8: Blocked on DES9 (app shell brand lock)

## No-Production Guarantee

- No live cloud calls, no network calls, no model invocations
- No database mutations
- No authentication changes
- No route modifications
- No production_deployment status promotion
- Deterministic filesystem scans only
