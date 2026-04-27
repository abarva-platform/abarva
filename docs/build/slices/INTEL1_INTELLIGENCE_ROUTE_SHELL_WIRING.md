# INTEL1 — Intelligence Route Shell Wiring

**Wave:** wave-21
**Lane:** E
**Status:** code_complete
**Date:** 2026-04-26

## What This Slice Does

Wires the canonical `IntelligenceRouteShell` orientation strip into the active
intelligence route at `src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx`.

The shell provides the top-of-page agent identity strip required by the
Intelligence Page Blueprint, confirming Sentinel as the primary agent with a
visible deterministic-data caveat and tenant data tier disclosure.

## Blueprint Followed

**Yes** — `docs/platform-design/page-blueprints/INTELLIGENCE_PAGE_BLUEPRINT.md`

Key blueprint requirements satisfied:
- Sentinel brief orientation visible (orientation strip names SENTINEL as primary agent)
- Deterministic seed caveat visible (not "live Sentinel analysis")
- Tenant name visible in orientation strip
- Low-context disclosure for thin tenants wired via `dataTier` prop
- No teal (#14B8A6) used anywhere in the shell

## Design Canon Followed

**Yes** — AbarVa Design System v2

- Background: `#F8F7F4` (warm off-white)
- Font family: DM Sans, sans-serif
- No teal, no sparkles, no full-page dark mode
- Strip uses navy (`#1B2B5C`) for agent label, body-grey for caveat text
- No fake all-green status indicators

## Agent-Centric Enforcement

**Yes — Sentinel primary**

Orientation label: `INTELLIGENCE · PATTERN DETECTION · SENTINEL`

The shell explicitly names Sentinel as the primary detecting agent.
Context, confidence level (deterministic), and tier disclosure are all
surfaced in the orientation strip per the blueprint's agent-centric requirements.

## Canonical Logo

**N/A** — No logo placement required for this orientation shell component.

## Files Changed

| File | Change |
|---|---|
| `src/components/intelligence/IntelligenceRouteShell.tsx` | Enhanced: added SENTINEL to label, dataTier prop, TenantDataTier type, tier-aware caveat copy, warm-white bg fix |
| `src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx` | Wired: wrapped existing content with `<IntelligenceRouteShell>` |
| `src/__tests__/integration/intelligence/intelligence-route-shell-wiring.test.ts` | Created: 11 deterministic filesystem checks |
| `docs/build/slices/INTEL1_INTELLIGENCE_ROUTE_SHELL_WIRING.md` | Created: this doc |
| `docs/build/build-slices.json` | Updated: INTEL1 entry added |
| `docs/build/production-readiness.json` | Updated: INTEL1 wave-21 note added |
| `docs/build/build-waves.json` | Updated: wave-21 created with INTEL1 |

## Deviations

None.

## Route Wiring Status

**Done.** IntelligenceRouteShell wraps `SentinelActivePatterns` inside the
intelligence index page. The `patterns/[patternKey]` subdirectory route is
a separate follow-on wiring task (pattern_detail mode available but not yet
mounted there).
