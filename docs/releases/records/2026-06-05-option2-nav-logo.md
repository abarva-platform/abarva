# 2026-06-05-option2-nav-logo - Option 2 Navbar Logo

## Release ID

`2026-06-05-option2-nav-logo`

## Status

`candidate`

## Plain-English Summary

This release moves the full AbarVa Option 2 HQ logo asset package into the repo,
updates the product top toolbar to use the Option 2 compact dark nav logo at
28px height, and changes selected toolbar items from the prior underline style
to a bright white raised pill. It also removes the old public brand logo files
so active runtime paths cannot keep using stale assets.

## Layer Impact

- `global-control-lane`: Updates the shared product top bar used across
  authenticated product surfaces.
- `public-demo`: Updates public-served brand references and static brand preview
  assets.

## Client Applicability

- All clients: Authenticated product chrome uses the new Option 2 logo and
  selected-nav treatment.
- Specific clients: None.
- Internal only: Logo enforcement docs and tests are updated.
- Public/demo only: Public pages and static brand test HTML use the new assets.
- Feature flag: None.

## Changes Included

- Adds `public/brand/abarva-option2-hq-logo-assets/`.
- Removes the retired root-level `public/brand/abarva-logo*.svg`,
  `public/brand/abarva-wordmark*.svg`, and `public/brand/abarva-monogram*.svg`
  files.
- Updates `src/components/shell/AppTopBar.tsx` to use the 28px Option 2 compact
  dark nav logo and active white pill navigation.
- Updates runtime/public brand references, logo components, logo enforcement
  tests, and the logo usage enforcement packet.
- Removes the unused `AppTopBarEditorial` and `AppTopBarTwoBar` experimental
  variants and adds a deterministic guard so those ghost top bars cannot return
  silently.

## QA / Validation

Passed local validation:

- Pass: `npx jest src/__tests__/integration/design/abarva-logo.test.ts src/__tests__/integration/qa/logo-usage-enforcement.test.ts --runInBand`
- Pass: `npx jest src/__tests__/integration/design/admin1-foundation.test.ts --runInBand -t "logo asset|AbarVaLogo component"`
- Pass: `npx eslint src/components/shell/AppTopBar.tsx src/components/abarva/AbarVaLogo.tsx src/components/brand/AbarVaLogo.tsx src/lib/qa/logo-usage-enforcement.ts`
- Blocked on pre-existing stale shell assertions, not this logo change:
  `npx jest src/__tests__/integration/design/abarva-nav-shell-alignment.test.ts --runInBand`
- Pass:
  `npm run release:check -- --base origin/main --head HEAD`
- Pass:
  `git diff --cached --check`
- Pass: ghost-nav audit confirmed only canonical `AppTopBar` is mounted by
  `AppShell`; `AppTopBarBlack` is a compatibility re-export to `AppTopBar`; the
  removed `AppTopBarEditorial` and `AppTopBarTwoBar` variants have zero runtime
  imports. `AbarvaNav` remains an intentional live legacy shell path for
  `MaestroChrome` fallback/demo/investor surfaces and now consumes the refreshed
  logo primitive.

## Rollout Plan

Merge to main and allow the normal Vercel deployment path to publish the new
static assets and updated product chrome. No database migration or Azure
deployment is required.

## Rollback Plan

Revert this PR. That restores the prior public brand assets, top-bar logo path,
and active-nav underline treatment.

## Audit Evidence

- Pull request diff.
- Focused Jest output.
- Release check output.
- Git diff whitespace check output.

## Known Gaps

The selected asset is the combined Option 2 compact lockup. A later design pass
could still choose the separate symbol-plus-wordmark implementation if desired.
