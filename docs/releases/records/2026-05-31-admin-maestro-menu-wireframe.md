# 2026-05-31-admin-maestro-menu-wireframe — Maestro admin menu wireframe

## Release ID

`2026-05-31-admin-maestro-menu-wireframe`

## Status

`candidate`

## Plain-English Summary

Adds a standalone HTML wireframe for the admin menu redesign. The artifact defines how each admin page should show meaningful status, visual evidence, data completeness, and next action in the first viewport before any app module implementation begins. It also makes executive-grade polish an explicit acceptance criterion: calm hierarchy, exact labels, balanced spacing, readable tables, and no decorative clutter.

## Layer Impact

public-demo lane: Adds a static, publicly served design-review artifact under `/design/admin-maestro-menu-wireframe-2026-05-31.html`.

internal-admin lane: Adds the same source artifact under `docs/build/` for release governance, QA planning, and implementation acceptance criteria.

## Client Applicability

- All clients: The design standard applies to all tenant admin menu pages.
- Specific clients: Apex Retail, SkyHarbor Air, and Meridian Health are the first intended end-to-end review clients.
- Internal only: The design source in `docs/build/`.
- Public/demo only: The static HTML wireframe route.
- Feature flag: None.

## Changes Included

- `docs/build/ADMIN_MAESTRO_MENU_WIREFRAME_2026-05-31.html`: Source design artifact and QA contract.
- `public/design/admin-maestro-menu-wireframe-2026-05-31.html`: Public static copy for production review.
- `docs/releases/records/2026-05-31-admin-maestro-menu-wireframe.md`: Release record.

## QA / Validation

- Passed: Parsed the HTML artifact with Python `html.parser`.
- Passed: Ran a Playwright static-file smoke at 1440x1000 and confirmed the title, H1, 12 nav sections, 11 page frames, Data Completeness section, Data Binding section, and QA section render.
- Passed: Wireframe includes a visual polish gate for desktop and mobile screenshot review before runtime implementation.
- Passed: Confirmed this release does not modify runtime app routes, components, modules, data adapters, migrations, or package files.

## Rollout Plan

Merge the focused PR to `main`. Vercel production deploy serves the public static artifact at `/design/admin-maestro-menu-wireframe-2026-05-31.html`.

## Rollback Plan

Revert the PR or remove the two HTML artifacts and this release record. No database, runtime module, or environment rollback is required.

## Audit Evidence

- PR URL after creation.
- CI status after PR checks complete.
- Vercel production deployment status after merge.
- Live smoke screenshot and route check for the public static HTML path.

## Known Gaps

This release is design-only. It does not implement the redesigned admin menu pages or bind new read-model fields into runtime UI.
