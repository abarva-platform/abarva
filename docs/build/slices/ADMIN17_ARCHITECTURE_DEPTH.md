# ADMIN17 — Architecture Depth

## Metadata
- ID: ADMIN17
- Title: Architecture depth — per-plane drilldown + component drawer + plane health summary
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-completion
- Status: backlog
- Type: ui
- Dependencies: ADMIN9 audit, AGENT1
- Estimated complexity: M

## Purpose
Add depth to `/admin/architecture`: clicking a plane row expands to its components, component click opens a drawer with file path / dependencies / linked tests, plus a top-of-page plane health summary strip.

## Context
ADMIN4 shipped the 7-row plane stack (App / Agent / Context / Evidence / Data / Gateway+Tools / Deployment). ADMIN17 makes it drillable. The component drawer + dependency graph is the WIRE2B Architecture deviation called out in ADMIN7 ("component drawer remains an open interaction_map deviation deferred to Wave 33") — ADMIN17 closes that deviation.

## Target state
- `/admin/architecture` has 3 tabs: Planes (default) / Components / Dependencies.
- Top of page: plane health summary strip (7 mini-cards with canonical/partial/not-wired counts).
- Plane row click → expand-in-place: component list per plane.
- Component row click → drawer: file path, last-modified, owning slice, dependency edges, linked tests.
- Components tab: flat list of all components across planes with filter.
- Dependencies tab: simple list of (component → depends-on) edges.

## Allowed files
- `src/app/(maestro)/admin/architecture/page.tsx`
- `src/lib/admin/architecture-page-view.ts`
- `src/components/admin/architecture/PlaneHealthStrip.tsx` (new)
- `src/components/admin/architecture/PlaneExpand.tsx` (new)
- `src/components/admin/architecture/ComponentDrawer.tsx` (new)
- `src/components/admin/architecture/ComponentList.tsx` (new)
- `src/components/admin/architecture/DependencyList.tsx` (new)
- `src/__tests__/integration/admin/admin17-architecture-depth.test.ts` (new)
- `docs/build/slices/ADMIN17_ARCHITECTURE_DEPTH.md`

## Forbidden files
- Other admin pages
- Live filesystem walks at request time (use build-time inline manifest)

## Implementation scope
1. Extend `architecture-page-view.ts` with component manifest per plane (deterministic — list from existing `src/components/**` mapping).
2. Build 5 components.
3. Wire 3 tabs.

## Tests
- Plane expand → component list.
- Component drawer renders all metadata fields.
- Component manifest matches actual repo structure (sanity check).
- ADMIN7 visual-lock passes (this slice closes the open ADMIN7 architecture deviation).

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/components/admin/architecture src/app/\(maestro\)/admin/architecture
npx jest src/__tests__/integration/admin/admin17-architecture-depth
bash scripts/integration/check_admin_design_tokens.sh
```

## Acceptance criteria
1. 3 tabs render.
2. Plane expand + component drawer functional.
3. WIRE2B Architecture score goes 90 → 95 (component drawer deviation closed).
4. ADMIN7 visual-lock passes.

## Risks
- Component manifest must stay in sync with repo. Add a CI hint test that warns if the manifest references a missing file (advisory, not blocking).

## Founder review
Visit `/admin/architecture`. See plane health strip. Click App plane → expands. Click a component → drawer with file path + dependencies. Tab to Components → full list.
