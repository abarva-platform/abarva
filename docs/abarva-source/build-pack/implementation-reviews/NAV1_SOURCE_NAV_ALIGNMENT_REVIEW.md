# NAV1 — Source Routes Nav Alignment Review

**Wave:** NAV1 — Canonical AbarVa Navigation and Active Shell Alignment
**Slice ID:** NAV1D
**Type:** docs
**Status:** code_complete

## Purpose

Audit every Source route under `src/app/(maestro)/source/**` and confirm
canonical shell adoption. No app code changes.

## Inventory

| Route | Page shell | Logo treatment | Legacy chrome | Banned token |
|---|---|---|---|---|
| `/source` | `SourceCanonShell` (canonical, wraps `SourceFoundationShell`) | inherited from global nav | none | none |
| `/source/events` | `SourceCanonShell` | inherited | none | none |
| `/source/events/[eventId]` | `SourceRouteShell` + `SourceCanonShell` (event detail flagged with linked-program badge) | inherited | none | none |
| `/source/events/[eventId]/scorecard` | `SourceCanonShell` | inherited | none | none |
| `/source/events/[eventId]/artifacts/[artifactId]` | `SourceFoundationShell` | inherited | none | none |
| `/source/value` | `SourceFoundationShell` | inherited | none | none |

## Findings

- All six Source routes use a canonical shell (`SourceCanonShell`,
  `SourceRouteShell`, or `SourceFoundationShell`).
- `SourceCanonShell` wraps `SourceFoundationShell`, which renders the warm
  off-white surface (`#FBFAF7`), navy accent (`#1B2B5C`), and DM Sans body —
  fully canonical.
- No legacy chrome (`<TopBar>`, `<PrimaryNav>`) imports remain in any Source
  route.
- No Source page hand-codes the wordmark — all wordmark renders flow through
  the global nav (which already uses the canonical `AbarVaLogo` via
  `AbarvaWordmark`).
- No banned tokens (`#14B8A6`, `#0E9F8C`, `sparkle`, `ॐ`) appear in any
  Source route file.
- The `SourceRouteShell` component is intentionally a slim orientation strip
  layered above `SourceCanonShell` for event-detail views with a linked
  program — preserved as-is per slice charter.

## Files Modified

None. The Source surface is already canonical.

## Files Added

- `docs/abarva-source/build-pack/implementation-reviews/NAV1_SOURCE_NAV_ALIGNMENT_REVIEW.md` — this file.
- `docs/build/slices/NAV1D_SOURCE_NAV_ALIGNMENT.md` — slice doc.

## Files Updated

- `docs/build/build-slices.json` — adds NAV1D entry.

## Validation

- `git diff --check` — clean (docs only).
- `npx tsc --noEmit` — no new errors (no source files touched).
- `npm run build` — passes.

## Risks

- None. No source files modified.

## Next

NAV1E — Programs / Intelligence / Tower nav alignment.
