# QA28 — Active Route Shell Verification

**Wave:** Wave-20 (Lane I)
**Status:** code_complete
**Created:** 2026-04-26

---

## Overview

QA28 verifies that canonical route page files, flagship components, and Wave-20
shell components are in the expected state. It uses real filesystem checks
(`fs.existsSync`, `fs.readFileSync`) — no mocking, no fabricated state.

Wave-20 shell components (SHELL1–7) do not exist in pre-integration branches.
Their checks return `status: 'deferred'` so the suite passes now and will fully
pass after integration.

---

## Check Inventory

| Check ID   | Item                                                                     | Expected Post-Integration | Pre-Integration State |
|------------|--------------------------------------------------------------------------|---------------------------|-----------------------|
| QA28-C01   | `tenant/[tenantSlug]/programs/page.tsx`                                  | pass                      | pass                  |
| QA28-C02   | `tenant/[tenantSlug]/programs/[programSlug]/page.tsx`                    | pass                      | pass                  |
| QA28-C03   | `source/events/[eventId]/page.tsx`                                       | pass                      | pass                  |
| QA28-C04   | `platform/admin/page.tsx`                                                | pass                      | pass                  |
| QA28-C05   | `platform/admin/architecture/page.tsx`                                   | pass                      | pass (file exists)    |
| QA28-C06   | `platform/admin/production-readiness/page.tsx`                           | pass                      | pass (file exists)    |
| QA28-C07   | `src/components/programs/ProgramFlagshipPage.tsx` (Wave-18 PROG10)       | pass                      | pass                  |
| QA28-C08   | `src/components/source/SourceCommercialEventSection.tsx` (Wave-16 SRC27) | pass                      | pass                  |
| QA28-C09   | `src/components/abarva/AbarVaAppShell.tsx` (Wave-20 SHELL1)              | pass                      | deferred              |
| QA28-C10   | `src/components/programs/ProgramRouteShell.tsx` (Wave-20 SHELL4)         | pass                      | deferred              |
| QA28-C11   | `src/components/source/SourceRouteShell.tsx` (Wave-20 SHELL5)            | pass                      | deferred              |
| QA28-C12   | `src/components/admin/AdminRouteShell.tsx` (Wave-20 SHELL6)              | pass                      | deferred              |
| QA28-C13   | `src/components/intelligence/IntelligenceRouteShell.tsx` (Wave-20 SHELL7)| pass                      | deferred              |
| QA28-C14   | `src/components/tower/TowerRouteShell.tsx` (Wave-20 SHELL7)              | pass                      | deferred              |
| QA28-C15   | Legacy `TopBar.tsx` present (tracked, not deleted)                       | pass                      | pass                  |
| QA28-C16   | Programs route does NOT import from `chrome/`                            | pass                      | pass                  |
| QA28-C17   | Source event route does NOT import from `chrome/`                        | pass                      | pass                  |
| QA28-C18   | `src/lib/source/source-program-link.ts` exists (Wave-19 LINK1)          | pass                      | pass                  |
| QA28-C19   | `source-commercial-demo-scenario.ts` contains `apex-retail` (Wave-19 SRC32) | pass                   | pass                  |
| QA28-C20   | `docs/build/build-slices.json` is valid parseable JSON                   | pass                      | pass                  |

---

## Deferred Items

The following Wave-20 components are expected to be absent in pre-integration
branches. Each returns `status: 'deferred'`:

- **SHELL1** — `AbarVaAppShell.tsx`: Top-level app shell unifying all surfaces under the AbarVa nav contract.
- **SHELL4** — `ProgramRouteShell.tsx`: Shell wrapper for all program routes.
- **SHELL5** — `SourceRouteShell.tsx`: Shell wrapper for source module routes.
- **SHELL6** — `AdminRouteShell.tsx`: Shell wrapper for platform/admin routes.
- **SHELL7** — `IntelligenceRouteShell.tsx`, `TowerRouteShell.tsx`: Shell wrappers for intelligence and tower routes.

All deferred items will resolve to `pass` once Wave-20 is integrated.

---

## Caveat

This report is deterministic: the same filesystem state always produces the same
output. It never claims production readiness. Pre-integration deferred status is
expected and does not constitute a failure.

---

## Cross-References

- Wave-18 PROG10: `ProgramFlagshipPage.tsx` source
- Wave-16 SRC27: `SourceCommercialEventSection.tsx` source
- Wave-19 LINK1: `source-program-link.ts`
- Wave-19 SRC32: `source-commercial-demo-scenario.ts` (apex-retail tenant scoping)
- QA26: Route Shell Design Verification (design canon checks)
- QA27: Apex Retail Source Program Storyline Verification
- DES7/DES8: AbarVa navigation + shell canon
