# 2026-06-24-home-chat-shell-controls — Home Chat Shell Controls

## Release ID

`2026-06-24-home-chat-shell-controls`

## Status

`candidate`

## Plain-English Summary

Home now presents a cleaner Ava chat shell: the oversized explanatory header and visible suggestion clutter are removed, the composer stays in the chat pane, and users can expand, hide, restore, or lock the chat pane to the left, right, top, or bottom of the Home canvas. The Context Explorer rail keeps accessible names and tooltips, but visible dimension labels/counts are hidden to reduce clutter on the right canvas.

## Layer Impact

- `global-control-lane`: changes the shared Home user experience for all tenants.
- Frontend only: updates the React Home shell and Home KNOW chat component. It does not change retrieval, semantic routing, data loading, tenant resolution, or the Home KNOW API contract.

## Client Applicability

- All clients: yes, all signed-in tenants using `/home`.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/home/HomeSurface.tsx`: adds icon-only chat layout controls, hide/restore behavior, dock left/right/top/bottom, expanded sizing, and a visually decluttered Context Explorer rail.
- `src/components/home/know/HomeKnowAsk.tsx`: makes the chat fill its shell, keeps the composer sticky, and suppresses visible suggestion chips when Home requests a clean shell.
- `src/components/home/__tests__/HomeSurface.test.tsx`: covers the clean shell controls and removal of visible suggestion clutter.

## QA / Validation

- `npx jest src/components/home/__tests__/HomeSurface.test.tsx src/components/home/know/__tests__/HomeKnowAsk.test.tsx --runInBand` — passed, 6 tests.
- `npx eslint src/components/home/HomeSurface.tsx src/components/home/know/HomeKnowAsk.tsx src/components/home/__tests__/HomeSurface.test.tsx src/components/home/know/__tests__/HomeKnowAsk.test.tsx` — passed.
- `git diff --check` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --project tsconfig.json` — attempted; blocked by pre-existing repo-wide missing type/module declarations for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`, not by this Home UI diff.

## Rollout Plan

Merge to `main`; deploy through the repo-owned Azure Container Apps main workflow. No data migration, DNS change, worker update, or feature-flag rollout is required.

## Deployment Authority

- Repo-owned deploy workflow: required for `app.abarva.ai`.
- Shared runtime mutators: no local or branch deploy path is authorized.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: template image, active revision image, and 100% traffic revision must match the approved main digest.
- Worker image invariant: unchanged by this frontend-only release, but main deploy workflow still validates worker image alignment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; verify `/home` for at least one tenant, then spot-check all five tenants for the same shared shell.

## Rollback Plan

Revert this PR and redeploy the previous approved main digest through the ACA main deploy workflow.

## Audit Evidence

- PR URL: to be added.
- CI run: to be added.
- Deployment evidence: to be added after ACA deployment.
- Browser proof: to be added after signed-in `/home` verification.

## Known Gaps

This release improves the Home chat shell experience only. It does not implement the broader 19-dimension semantic question layer redesign or improve answer intelligence quality.
