# Programs P0 Audit

## Baseline snapshot

Programs is now the largest active module with a formal build spec and without a matching execution ledger. The canonical shell-wired family exists under `/programs/**`, while the legacy tenant-scoped family still exists under `/tenant/[tenantSlug]/programs/**` and `/src/app/(maestro)/tenant/[tenantSlug]/programs/**`. That split is the defining constraint of P0.

Verified from the repo on April 28 2026:

| Metric | Value | Notes |
|---|---:|---|
| `src/components/programs/*.tsx` | 25 | component-heavy surface with detail, overlays, origination, and phase workbench UI |
| `src/lib/programs/*.ts` | 51 | broad read-model and fixture layer; enough surface area that wave work must stay narrow |
| canonical page routes | 4 | `/programs`, `/programs/[id]`, `/programs/new`, `/programs/patterns` |
| legacy tenant routes | 4 primary route files | legacy detail, phase, deliverable, and index paths still routable |
| demo flagship | APX-CDP-2026 | now at `P3 Design` with Build gate pending |

## Route-family audit

### Canonical family

| Route | Purpose | Current posture |
|---|---|---|
| `/programs` | portfolio index | canonical, shell-wired, active |
| `/programs/[id]` | flagship detail route | canonical, shell-wired, active |
| `/programs/new` | origination flow | canonical, shell-wired, active |
| `/programs/patterns` | pattern linkage view | canonical, shell-wired, active |

### Legacy family still present

| Route family | Risk |
|---|---|
| `/tenant/[tenantSlug]/programs/**` | old architecture still expresses overlapping detail states |
| `/src/app/(maestro)/tenant/[tenantSlug]/programs/**` | shell-era tenant paths can quietly attract new work unless frozen |
| `/preview/programs/**` | useful for fixture checks, but not the canonical production family |
| `/demo/programs/new` | demo-only path that should not become the authoritative origination route |

### P0 conclusion

Programs cannot safely accept broad feature work until P1 explicitly decides how canonical routes absorb or wrap legacy behavior. The route-family convergence problem is not theoretical anymore; both families are live in the codebase.

## Current shipped state that future waves must treat as baseline

These are already shipped and should be documented as current state rather than rediscovered in later PRs:

- `APX-CDP-2026` is at `P3 Design` in `programs-fixture.ts`
- `gateStatus: 'pending'` drives the gate ribbon for the `P3 -> P4 Build` gate
- `buildProgramDetailView()` accepts `overrideCurrentPhase` so DB-backed phase truth can override fixture defaults
- `APX_CDP_2026_P3_WORKBENCH` is the current flagship workbench constant
- workbench action C deep-links to `/intelligence/t3-h03`
- the linked Source event route is `/source/events/apex-retail-ams-outsourcing-2026`
- `LinkedProgramChip` is the shared cross-surface primitive in `src/components/shell/`
- `useToast()` already exists and is used in Programs interaction overlays

Any later wave that treats these as backlog items is working from stale assumptions.

## Component surface grouping

Programs is not missing a UI surface so much as it is missing wave discipline. The component inventory already spans the major user journeys:

| Group | Examples | P0 assessment |
|---|---|---|
| portfolio/index | `ProgramsIndexPage`, portfolio rows, filters | usable but still needs explicit P2 convergence |
| detail/workbench | `ProgramDetailPage`, phase panels, workbench builders | strongest current path; P3 should stabilize this |
| interaction overlays | upload, handoff, suggested action, transition overlays | real surface area exists; P6 should normalize interaction behavior |
| governance | gate ribbon, gate approval modal, evidence flows | partially shipped and good enough to support P5 |
| origination | `ProgramOriginationPage` | already built; needs P4 formalization, not invention |

## Risks captured in P0

1. **Route drift risk.** A future agent can accidentally edit legacy and canonical families together without naming a deprecation plan.
2. **Fixture-vs-DB drift risk.** Programs already uses a fixture-first, DB-override model. Any wave touching phase truth must preserve `overrideCurrentPhase` behavior.
3. **Cross-surface link fragility.** The Source route changed recently. Programs must continue pointing at `/source/events/apex-retail-ams-outsourcing-2026`, not the retired short path.
4. **Over-broad deletion risk.** Later convergence work, especially route retirement, should be human-reviewed if it removes legacy files.

## Recommended execution order after P0

| Wave | Why next |
|---|---|
| P1 | unblocks safe canonical ownership of the route family |
| P2 | stabilizes portfolio states after route convergence rules exist |
| P3 | locks the flagship detail storyline to `P-SMOKE-CDP` |
| P5 | governance and evidence already have enough surface area to consolidate once detail is stable |
| P7 | only after canonical parity is explicit |

## Exit criteria for P0

- `docs/build/PROGRAMS_BUILD_SPEC.md` exists and is authoritative
- `docs/build/programs/` contains audit, roadmap, journal, and P1-P7 plan skeletons
- route convergence is named as the first execution blocker, not buried in notes
- the flagship `APX-CDP-2026` P3 Design storyline is treated as baseline truth
