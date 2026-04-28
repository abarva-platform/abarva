# SHELL4 · Programs Route Shell Control

**Wave:** wave-20
**Lane:** D
**Status:** code_complete
**Date:** 2026-04-26

## Summary

SHELL4 lands `src/components/programs/ProgramRouteShell.tsx` — a thin, page-level orientation header shell for Program routes. It renders a top border strip with the canonical `PROGRAMME WORKFLOW · NEXUS-LED` label, tenant name, optional program name (in detail mode), and a deterministic-seed caveat. It does not replace `ProgramFlagshipPage` or `ProgramCanonShell`.

## What this slice proves

- A reusable `ProgramRouteShell` wrapper exists and is available for any page-level program route that needs a lightweight orientation strip.
- The shell enforces AbarVa visual canon: `#FBFAF7` background, DM Sans font, `#1B2B5C` label color, `#E8E6E1` border — no teal (`#14B8A6`), no neon, no cyber patterns.
- The shell carries an honest `Deterministic seed data. No live programme updates.` caveat.

## What this slice does NOT do

- Does NOT replace `ProgramCanonShell` (which already provides the canonical workflow orientation strip on both list and detail routes).
- Does NOT remove or alter `ProgramFlagshipPage.tsx`.
- Does NOT modify auth, migrations, or production configuration.
- Does NOT claim production readiness.

## Route wiring status

**Deferred.** Both `programs/page.tsx` and `programs/[programSlug]/page.tsx` already use `ProgramCanonShell`, which provides a workflow orientation strip (`Program workflow · Nexus-led` eyebrow + `Workflow orientation` content strip). Adding `ProgramRouteShell` as an outer wrapper would create a duplicate orientation header, violating the density canon. Wiring is deferred until a route that lacks an orientation header is identified.

## Files

- `src/components/programs/ProgramRouteShell.tsx` — new shell component
- `src/__tests__/integration/programs/program-route-shell-control.test.ts` — file-pure Jest contract
- `docs/build/slices/SHELL4_PROGRAMS_ROUTE_SHELL_CONTROL.md` — this file
- `docs/build/build-slices.json` — manifest updated
- `docs/build/production-readiness.json` — note added under programs
- `docs/build/build-waves.json` — wave-20 updated with SHELL4

## Test contract

The Jest suite (`program-route-shell-control.test.ts`) is file-pure (no jsdom, no React rendering):

1. `ProgramRouteShell.tsx` exists
2. `ProgramFlagshipPage.tsx` still exists (not deleted)
3. Programs list route file exists
4. Programs detail route file exists
5. `ProgramRouteShell.tsx` does not contain `#14B8A6`
6. `ProgramRouteShell.tsx` does not contain the word `teal`
7. `ProgramRouteShell.tsx` contains `NEXUS-LED` orientation string
8. `ProgramRouteShell.tsx` contains `Deterministic` caveat

## Production readiness

Not promoted. `production_deployment` status preserved (still blocked). The prod-deploy-verification blocker is preserved verbatim.
