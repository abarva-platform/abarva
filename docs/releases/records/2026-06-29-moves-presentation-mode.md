# 2026-06-29-moves-presentation-mode — Moves Presentation Mode

## Release ID

`2026-06-29-moves-presentation-mode`

## Status

`candidate`

## Plain-English Summary

Strategic Moves detail pages now support an opt-in presentation mode for executive and marketing captures. The normal workbench remains unchanged, while `?demo=1` or `?presentation=1` shortens the Move title, shows a marketing-safe demo tenant label, collapses the aVa dock by default, reduces tabs, and discloses that the screen uses synthetic demo data.

## Layer Impact

- `global-control-lane`: Adds display-only presentation behavior to the shared Moves detail page and shell tenant label resolution.
- `public-demo`: Enables cleaner product-video screenshots without changing underlying tenant data, phase gates, artifacts, permissions, or generated deliverables.

## Client Applicability

- All clients: The normal Moves route remains unchanged unless presentation mode is explicitly requested by URL.
- Specific clients: None.
- Internal only: None.
- Public/demo only: Presentation mode is intended for demos, executive walkthroughs, and marketing capture.
- Feature flag: None; opt-in by URL parameter.

## Changes Included

- `src/app/(maestro)/strategic-moves/[moveId]/page.tsx`: recognizes `demo=1` / `presentation=1` and passes presentation mode to the Moves detail view.
- `src/components/strategic-moves/StrategicMoveDetailView.tsx`: adds display-only demo copy, shorter title, reduced tabs, synthetic-data disclosure, and presentation classes.
- `src/components/strategic-moves/StrategicMoveDetailClient.tsx`: collapses the aVa dock by default for presentation mode using a separate dock storage namespace and uses the compact demo title/code in the presentation aVa context.
- `src/components/shell/AppTopBar.tsx`: respects an explicit tenant display override before falling back to the signed-in tenant context.
- `src/components/strategic-moves/StrategicMoves.module.css`: adds presentation-mode styling.

## QA / Validation

- `pass`: Focused ESLint on touched TS/TSX files.
- `pass`: Signed-in presentation-mode proof confirmed the top-bar and main header use `Retail Demo Workspace` and `Finance Modernization & Value Realization`; follow-up patch also routes that compact title into the Journey/Explorer tree and presentation aVa context.
- `pass`: `npm run release:check`.
- `blocked`: Full TypeScript with `NODE_OPTIONS=--max-old-space-size=8192` reaches pre-existing missing optional dependency/type packages (`js-yaml`, `@azure-rest/ai-document-intelligence`, `@axe-core/playwright`) outside this change.
- `pending`: Final signed-in screenshot proof of `?demo=1` after the Journey/Explorer compact-title patch is deployed.

## Rollout Plan

Merge to `main`, build the exact git SHA through the approved Azure Container Apps lane, assign traffic only after the revision is healthy, then capture signed-in screenshots from the presentation URL.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy path.
- Shared runtime mutators: None.
- Approved image digest: Not assigned yet.
- ACA runtime invariant: Presentation mode is display-only and must not change tenant access, artifact generation, or data-plane writes.
- Worker image invariant: None.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for screenshots and shell tenant-label override.

## Rollback Plan

Revert the presentation-mode commit or remove traffic from the deployed ACA revision. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- Focused ESLint output: local command output.
- Release-check output: local command output.
- Full TypeScript output: blocked by existing dependency/type gaps outside touched files.
- Screenshot proof: pending.

## Known Gaps

- Presentation mode still uses the real signed-in tenant/session underneath; this is intentional for data safety, but video capture should use the `Retail Demo Workspace` display override and synthetic-data badge.
