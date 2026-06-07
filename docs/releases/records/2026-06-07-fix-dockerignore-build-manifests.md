# 2026-06-07-fix-dockerignore-build-manifests — Unblock main image build

## Release ID

`2026-06-07-fix-dockerignore-build-manifests`

## Status

`candidate`

## Plain-English Summary

Fixes a pre-existing build blocker: `main`'s container image cannot build because
`src/lib/admin/setup-data-load-center.ts` imports three enterprise-context
template manifests from `docs/` at build time (added 2026-06-01, #2727), while
`.dockerignore` strips `docs/`. `next build` then fails type-check
(`Cannot find module …/templates/apexretail/manifest.json`). This re-includes
`docs/enterprise-context/templates/` in the build context so the image builds.

## Layer Impact

- Lane: `global-control-lane`. Build-context configuration only; no runtime code,
  schema, or data change. Unblocks all image builds from `main` (operator/app).

## Client Applicability

- All clients: the image build is shared infrastructure. No per-client behavior change.

## Changes Included

- `.dockerignore`: re-include `docs/enterprise-context/templates/` (mirrors the
  existing `docs/design/strategic-moves/tokens.css` negation).
- `docs/build/cutover/AZURE_CUTOVER_PROOF_2026-06-07.md`: record the blocker + fix
  (cutover proof Step 8).

## QA / Validation

- `az acr build` of `abarva/web` from `main` failed `next build` type-check on the
  missing manifest; re-run with this fix builds the image
  `abarva/web:cutover-main-20260607-bea996676` (validation build).
- No runtime/script/DB-logic change; the merged gate scripts are unchanged.

## Rollout Plan

Merge to `main` (build-blocker fix). The operator/app image then builds from main.

## Rollback Plan

Revert the `.dockerignore` change. (Restores the broken build — only revert if the
build-time `docs/` imports are also removed.)

## Audit Evidence

- ACR build logs (failed before / succeeded after); cutover proof Step 8.

## Known Gaps

This fixes the build-context strip only. The deeper smell — `src/` importing from
`docs/` at build time — is left as-is to keep the fix minimal; a follow-up could
relocate those manifests under `src/` or a packaged data module.
