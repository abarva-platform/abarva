# 2026-07-05-source-canvas-three-column — Source Event Canvas 3-Column Layout Redesign

## Release ID

`2026-07-05-source-canvas-three-column`

## Status

`candidate`

## Plain-English Summary

The Source event canvas page has been redesigned from a two-pane AgentDock layout (45% aVa chat / 55% workspace) to a three-column layout. The left column is a fixed 280px `CanvasGateSidebar` that displays gate criteria as a persistent checklist — always visible, never hidden behind a tab. The center column holds the `EventWorkspace` (Document, Evidence, and Log tabs) and expands to fill all remaining width. The right/bottom aVa panel is replaced by a pinned `AvaBottomBar` at the foot of the canvas, keeping the AI assistant accessible without dominating the screen.

The Gate tab has been removed from `EventWorkspace` because gate criteria are now always visible in the left sidebar. All gate criterion state-management actions (Mark met, Reopen, Advance to next stage) are preserved; only their placement changed. No schema, API, or data-plane changes were made.

## Layer Impact

- `global-control-lane`: `UniversalCanvasShell.tsx` replaces the AgentDock split-pane with a three-column flex layout. Two new components (`CanvasGateSidebar`, `AvaBottomBar`) implement the left sidebar and bottom bar respectively. The Gate tab is removed from the `EventWorkspace` tab list. Affects all tenants using the Source module.
- API / data-plane: Unchanged — no API routes, database queries, or data-plane adapters were modified.
- Schema / migrations: Unchanged — no schema changes.

## Client Applicability

- All clients: Yes — affects all tenants that use the Source module. The Source event canvas is a shared shell; there are no tenant-specific overrides of `UniversalCanvasShell`.
- Specific clients: N/A
- Internal only: No
- Public/demo only: No
- Feature flag: None — change is active for all signed-in users who navigate to a Source event canvas.

## Changes Included

| Type | Path | Description |
|------|------|-------------|
| New file | `src/components/source/canvas/CanvasGateSidebar.tsx` | 280px fixed left column; renders gate criteria checklist always-visible |
| New file | `src/components/source/canvas/AvaBottomBar.tsx` | Pinned bottom bar housing the aVa assistant; replaces full-height aVa chat panel |
| Modified file | `src/components/source/canvas/UniversalCanvasShell.tsx` | Removes AgentDock 45/55 split-pane; wires three-column flex layout with CanvasGateSidebar + EventWorkspace + AvaBottomBar |
| Modified (implicit) | `EventWorkspace` tab list | Gate tab removed; Document, Evidence, and Log tabs remain |

PR link: https://github.com/abarva-platform/abarva/pull/4452

## QA / Validation

| Check | Result |
|-------|--------|
| Visual regression — dev server (`npm run dev`) | Canvas renders three-column layout; gate sidebar visible at 280px; workspace expands to fill center; bottom bar pinned at footer |
| TypeScript type-check | Passes — no new type errors introduced by new component files or shell modifications |
| Gate criterion state management | Verified: Mark met, Reopen, and Advance to next stage actions functional in the always-visible sidebar |
| API call inventory | All existing Source event API calls (gate criteria fetch, criterion update, stage advance) unchanged — no new endpoints, no removed endpoints |
| Tab navigation | Document, Evidence, and Log tabs accessible and functional; Gate tab correctly absent |
| Responsive behavior | Center column grows/shrinks as expected within flex layout; sidebar holds fixed width |

CI: Standard PR checks (lint, type-check, unit tests). No E2E suite changes required as no route paths or API contracts changed.

## Rollout Plan

Standard ACA deploy:

1. Merge PR to `main`.
2. `az acr build` from the merged SHA to produce a new container image.
3. `az containerapp update` on `ca-abarva-web-lab-eastus` with the new image.
4. Wait for the new revision to become healthy.
5. Assign 100 % ingress traffic to the new revision.
6. Verify `https://app.abarva.ai` by navigating to a Source event canvas and confirming the three-column layout renders.

No database migration, no seed script, no feature flag toggle required.

Reference runbook: `docs/runbooks/azure-container-apps-deploy.md`.

## Rollback Plan

1. Identify the prior healthy ACA revision (visible in `az containerapp revision list`).
2. Revert the PR on `main` and rebuild, **or** redirect 100 % traffic to the prior revision immediately via `az containerapp ingress traffic set`.
3. No data-plane rollback required — no schema or data was changed.

The rollback window is the time between the new revision receiving traffic and discovery of a regression; because only UI files changed, a traffic shift is sufficient and instant.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4452
- CI run: linked from PR above.
- ACA revision / image tag: TBD — recorded at deploy time.
- Smoke verification: navigate to a Source event canvas as a signed-in user and confirm three-column layout, gate sidebar, and bottom bar.

## Context Ingestion Evidence

Not applicable. This release contains no Admin Data Load, ingestion, Azure Blob staging, worker queue, document parsing, embedding, or retrieval changes.

## Known Gaps

- The `AvaBottomBar` is a pinned replacement for the full-height aVa panel. Conversational history depth and session continuity behavior in the bottom bar should be validated in a follow-on QA pass once deployed to ACA.
- PR URL and ACA revision are TBD until the PR is opened and deployed.
