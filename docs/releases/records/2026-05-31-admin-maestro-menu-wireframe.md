# 2026-05-31-admin-maestro-menu-wireframe — Maestro admin menu wireframe

## Release ID

`2026-05-31-admin-maestro-menu-wireframe`

## Status

`candidate`

## Plain-English Summary

Adds the admin menu redesign reference and makes `/admin` a native, client-specific Maestro home. The live page shows the active client identity, loaded-data completeness, readiness facts, and next actions in the first viewport inside the original admin shell: top bar, logo, and native left admin menu remain present, with no left anchor menu, iframe, design-spec copy, or sidebar escape to the non-admin Learn route.

## Layer Impact

public-demo lane: Adds a static, publicly served design-review artifact under `/design/admin-maestro-menu-wireframe-2026-05-31.html`.

internal-admin lane: Adds the same source artifact under `docs/build/` for release governance, QA planning, and implementation acceptance criteria. `/admin` now renders a native AdminCanonShellV2 canvas as the Home entry point, preserving the original AppTopBar and AdminSidebar while remaining protected by the existing Clerk admin layout. The AdminSidebar no longer points to `/home/learn`, because that guide is outside the admin canvas and can contain cross-client reference examples.

## Client Applicability

- All clients: The design standard applies to all tenant admin menu pages.
- Specific clients: Apex Retail, SkyHarbor Air, and Meridian Health are the first intended end-to-end review clients.
- Internal only: The design source in `docs/build/`.
- Public/demo only: The static HTML wireframe route.
- Feature flag: None.

## Changes Included

- `docs/build/ADMIN_MAESTRO_MENU_WIREFRAME_2026-05-31.html`: Source design artifact and QA contract.
- `public/design/admin-maestro-menu-wireframe-2026-05-31.html`: Public static copy for production review.
- `src/app/(maestro)/admin/page.tsx`: Authenticated `/admin` home now renders natively inside the canonical AdminCanonShellV2 chrome instead of embedding the HTML reference.
- `src/components/admin/AdminSidebar.tsx`: Adds a stable sidebar marker for production browser QA so the native left admin menu cannot disappear silently.
- `src/lib/admin/admin-shell-config.ts`: Removes the Training sidebar item that exited the admin shell to `/home/learn`; Learn remains available from the top product navigation.
- `src/components/admin/admin-page-header-styles.ts`: Adds the shared admin header type scale used by native admin pages.
- `src/components/admin/EditorialCanvas.tsx`, `src/app/(maestro)/admin/page.tsx`, and `src/app/(maestro)/admin/customer/page.tsx`: Align header fonts, title size, weight, spacing, and subtitle rhythm.
- `public/design/admin-maestro-menu-wireframe-2026-05-31.html`: Public reference copy no longer presents wireframe language in the header.
- Admin integration tests: Updated the route contract to treat `/admin` as the Maestro home and keep shell enforcement on the admin sub-pages.
- `docs/releases/records/2026-05-31-admin-maestro-menu-wireframe.md`: Release record.

## QA / Validation

- Passed: Parsed the HTML artifact with Python `html.parser`.
- Passed: Ran a Playwright static-file smoke at 1440x1000 and confirmed the title, H1, 12 nav sections, 11 page frames, Data Completeness section, Data Binding section, and QA section render.
- Passed: Wireframe includes a visual polish gate for desktop and mobile screenshot review before runtime implementation.
- Passed: Focused ESLint for the `/admin` home and updated route-contract tests.
- Passed: Focused Jest route-contract tests for Setup W6, admin shell enforcement, and production readiness route linkage.
- Passed: `git diff --check` and `npm run release:check -- --base origin/main --head HEAD`.
- Pending: Production deploy and three-client authenticated admin native-page crawl, including explicit left-menu assertions.

## Rollout Plan

Merge the focused PR to `main`. Vercel production deploy serves the public static reference at `/design/admin-maestro-menu-wireframe-2026-05-31.html` and renders the native, client-specific canvas from authenticated `/admin` with the admin sidebar visible on desktop.

## Rollback Plan

Revert the PR to restore the previous `/admin` setup dashboard host. Remove the HTML artifacts and this release record only if the reference artifact itself must also roll back. No database, data-plane, migration, or environment rollback is required.

## Audit Evidence

- PR URL after creation.
- CI status after PR checks complete.
- Vercel production deployment status after merge.
- Live smoke screenshot and route check for authenticated `/admin`, the original AppTopBar/logo, native left admin menu, active client identity, and no iframe/left-anchor menu.
- Three-client browser evidence for Apex Retail, SkyHarbor Air, and Meridian Health: every home-wireframe menu link/action click, route smoke, top-of-page position, and cross-tenant text scan.

## Known Gaps

The `/admin` landing page is now native. Individual admin sub-pages still need the next implementation wave to bring the same first-viewport standard and full view-model data binding to each route.
