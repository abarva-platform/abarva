# 2026-05-31-admin-maestro-menu-wireframe — Maestro admin menu wireframe

## Release ID

`2026-05-31-admin-maestro-menu-wireframe`

## Status

`candidate`

## Plain-English Summary

Adds a standalone HTML wireframe for the admin menu redesign and makes it the authenticated `/admin` home. The artifact defines how each admin page should show meaningful status, visual evidence, data completeness, and next action in the first viewport before deeper module implementation begins. It also makes executive-grade polish an explicit acceptance criterion: calm hierarchy, exact labels, balanced spacing, readable tables, and no decorative clutter.

## Layer Impact

public-demo lane: Adds a static, publicly served design-review artifact under `/design/admin-maestro-menu-wireframe-2026-05-31.html`.

internal-admin lane: Adds the same source artifact under `docs/build/` for release governance, QA planning, and implementation acceptance criteria. `/admin` now hosts the approved wireframe as the Home entry point while remaining protected by the existing Clerk admin layout.

## Client Applicability

- All clients: The design standard applies to all tenant admin menu pages.
- Specific clients: Apex Retail, SkyHarbor Air, and Meridian Health are the first intended end-to-end review clients.
- Internal only: The design source in `docs/build/`.
- Public/demo only: The static HTML wireframe route.
- Feature flag: None.

## Changes Included

- `docs/build/ADMIN_MAESTRO_MENU_WIREFRAME_2026-05-31.html`: Source design artifact and QA contract.
- `public/design/admin-maestro-menu-wireframe-2026-05-31.html`: Public static copy for production review.
- `src/app/(maestro)/admin/page.tsx`: Authenticated `/admin` home now embeds the approved Maestro wireframe instead of the legacy setup dashboard.
- Admin integration tests: Updated the route contract to treat `/admin` as the Maestro home and keep shell enforcement on the admin sub-pages.
- `docs/releases/records/2026-05-31-admin-maestro-menu-wireframe.md`: Release record.

## QA / Validation

- Passed: Parsed the HTML artifact with Python `html.parser`.
- Passed: Ran a Playwright static-file smoke at 1440x1000 and confirmed the title, H1, 12 nav sections, 11 page frames, Data Completeness section, Data Binding section, and QA section render.
- Passed: Wireframe includes a visual polish gate for desktop and mobile screenshot review before runtime implementation.
- Passed: Focused ESLint for the `/admin` home and updated route-contract tests.
- Passed: Focused Jest route-contract tests for Setup W6, admin shell enforcement, and production readiness route linkage.
- Passed: `git diff --check` and `npm run release:check -- --base origin/main --head HEAD`.
- Pending: Production deploy and three-client authenticated admin click crawl.

## Rollout Plan

Merge the focused PR to `main`. Vercel production deploy serves the public static artifact at `/design/admin-maestro-menu-wireframe-2026-05-31.html` and renders the same design from authenticated `/admin`.

## Rollback Plan

Revert the PR to restore the previous `/admin` setup dashboard host. Remove the two HTML artifacts and this release record only if the design artifact itself must also roll back. No database, data-plane, migration, or environment rollback is required.

## Audit Evidence

- PR URL after creation.
- CI status after PR checks complete.
- Vercel production deployment status after merge.
- Live smoke screenshot and route check for authenticated `/admin` plus the public static HTML path.
- Three-client browser evidence for Apex Retail, SkyHarbor Air, and Meridian Health: every home-wireframe menu link/action click, route smoke, top-of-page position, and cross-tenant text scan.

## Known Gaps

The `/admin` landing page now shows the approved Maestro design, but individual admin sub-pages still need the next implementation wave to convert the wireframe sections into native React pages with full view-model data binding.
