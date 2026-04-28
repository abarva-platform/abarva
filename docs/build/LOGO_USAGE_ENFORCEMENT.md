# BRAND2 — Logo Usage Enforcement / Legacy Symbol Retirement

Wave 21 · Lane B · Status: code_complete

## Overview

BRAND2 establishes the deterministic enforcement contract for canonical AbarVa logo usage across all product surfaces. It defines the canonical logo asset path, the canonical React component, a set of banned legacy patterns, and a file-scan check suite that runs without model calls, network calls, or live data.

## Canonical Logo Path

```
public/brand/abarva-logo.svg
```

This is the single source of truth for the AbarVa logo SVG. It must be placed here before any surface or component references the logo. BRAND1 is responsible for landing this asset.

## Canonical Logo Component

```
src/components/brand/AbarVaLogo.tsx
```

All product surfaces that need to display the AbarVa logo must import `AbarVaLogo` from this path. Direct SVG inlining, hardcoded wordmark spans, or image tags referencing arbitrary asset paths are prohibited.

## Banned Patterns

The following patterns are banned from any logo-related code:

| Pattern | Reason |
|---|---|
| `#14B8A6` | Legacy teal accent — retired per AbarVa Design System v2 |
| `ॐ` | Sanskrit symbol — never a canonical logo element |
| `sparkle` | Generic AI sparkle icon — not part of the AbarVa brand |
| `network-icon` | Old network icon class — replaced by canonical brand mark |

## Enforcement Rules

1. **Canonical asset first**: No surface may render the AbarVa logo before `public/brand/abarva-logo.svg` exists and is a real SVG (>1KB).
2. **Canonical component only**: All surfaces must use `<AbarVaLogo />` — not raw `<img>`, not inline SVG, not hardcoded spans.
3. **No teal in shell**: `AbarVaAppShell` must not contain `#14B8A6`.
4. **No hardcoded wordmark spans**: App layout files must not split the wordmark into separate `"Abar"` and `"Va"` spans.
5. **Legacy TopBar is dead code**: `src/components/chrome/TopBar.tsx` exists but is not imported by any active route (confirmed per SHELL2 audit). It must not be revived.
6. **DES9 wires the shell**: The DES9 lane is responsible for adding the `AbarVaLogo` import to `AbarVaAppShell`. Until DES9 lands, C8 is deferred.

## What Each Check Verifies

| Check ID | Target File | Description |
|---|---|---|
| BRAND2-C1 | `public/brand/abarva-logo.svg` | Canonical logo SVG asset exists |
| BRAND2-C2 | `src/components/brand/AbarVaLogo.tsx` | Canonical AbarVaLogo component exists |
| BRAND2-C3 | `public/brand/abarva-logo.svg` | Logo SVG is a real asset (>1KB) |
| BRAND2-C4 | `src/components/chrome/TopBar.tsx` | Legacy TopBar identified as dead code |
| BRAND2-C5 | `src/components/abarva/AbarVaAppShell.tsx` | AbarVaAppShell does not use banned teal |
| BRAND2-C6-* | `src/components/brand/AbarVaLogo.tsx` | AbarVaLogo does not contain any banned pattern |
| BRAND2-C7 | `src/app/layout.tsx` | App layout does not hardcode Abar/Va wordmark spans |
| BRAND2-C8 | `src/components/abarva/AbarVaAppShell.tsx` | App shell imports AbarVaLogo (DES9 brand lock) |

## Deferred Items

| Item | Reason | Resolves When |
|---|---|---|
| BRAND2-C1 (logo asset) | `public/brand/abarva-logo.svg` not yet created | BRAND1 lands |
| BRAND2-C2 (component) | `src/components/brand/AbarVaLogo.tsx` not yet created | BRAND1 lands |
| BRAND2-C3 (asset size) | Depends on C1 | BRAND1 lands |
| BRAND2-C6-* (banned patterns in component) | Depends on C2 | BRAND1 lands |
| BRAND2-C8 (DES9 brand lock) | AbarVaAppShell does not yet import AbarVaLogo | DES9 lands |

## Implementation

The enforcement module lives at:

```
src/lib/qa/logo-usage-enforcement.ts
```

Key exports:
- `runLogoUsageEnforcement()` — returns a `LogoUsageEnforcementReport` with all checks
- `getBannedLogoPatterns()` — returns the canonical banned pattern list
- `listLogoEnforcementTargetFiles()` — returns all files subject to enforcement
- `BANNED_LOGO_PATTERNS` — constant array of banned strings
- `CANONICAL_LOGO_ASSET` — constant path to the canonical SVG
- `CANONICAL_LOGO_COMPONENT` — constant path to the canonical React component

## Test Contract

Integration tests live at:

```
src/__tests__/integration/qa/logo-usage-enforcement.test.ts
```

The test suite asserts:
- No throws on `runLogoUsageEnforcement()`
- All checks have required fields
- `failCount === 0` in the canonical codebase
- BRAND2-C1 and BRAND2-C2 checks are present
- Banned patterns include `#14B8A6` and `ॐ`
- `overallStatus` is a valid value
- Helper exports return non-empty arrays

## Dependency Chain

```
BRAND1 (logo asset + component) → BRAND2-C1, C2, C3, C6
DES9 (app shell brand lock)     → BRAND2-C8
SHELL2 (dead code audit)        → BRAND2-C4 (already resolved)
```
