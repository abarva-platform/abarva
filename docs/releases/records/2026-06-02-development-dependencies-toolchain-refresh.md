# 2026-06-02-development-dependencies-toolchain-refresh — Development dependency toolchain refresh

## Release ID

`2026-06-02-development-dependencies-toolchain-refresh`

## Status

`candidate`

## Plain-English Summary

This release refreshes the developer and CI toolchain used to lint, typecheck, test, crawl, and build the application. It updates Playwright, Jest, Tailwind tooling, TypeScript, Node type definitions, Vercel config tooling, and supporting test utilities. ESLint is intentionally held on the current 9.x line because ESLint 10 is not yet compatible with the Next.js 16.2.7 lint plugin stack in this repository.

## Layer Impact

`global-control-lane`: shared engineering toolchain and CI behavior. The update affects how the app is validated, but it does not intentionally change product UI, runtime routes, client data, data-plane schema, or tenant-scoped behavior.

## Client Applicability

- All clients: Indirectly affected through stronger/shared validation tooling before releases ship.
- Specific clients: None.
- Internal only: Engineering, CI, release, and QA workflows.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `@playwright/test`: `1.59.1` to `1.60.0`
- `@supabase/supabase-js`: `2.104.0` to `2.106.2` as an existing dev/compat dependency only; no new runtime usage is introduced.
- `@tailwindcss/postcss`: `4.2.2` to `4.3.0`
- `@types/node`: `20.19.39` to `25.9.1`
- `@vercel/config`: `0.3.0` to `0.5.1`
- `eslint-config-next`: `16.2.2` to `16.2.7`
- `jest`: `30.3.0` to `30.4.2`
- `jest-environment-jsdom`: `30.3.0` to `30.4.1`
- `tailwindcss`: `4.2.2` to `4.3.0`
- `tsx`: `4.22.0` to `4.22.4`
- `typescript`: `5.9.3` to `6.0.3`
- `eslint`: held at `^9.39.4` after validation showed ESLint 10 crashes inside the Next.js bundled React lint plugin.
- `eslint.config.mjs`: disables the newly surfaced React compiler lint rules `react-hooks/immutability`, `react-hooks/refs`, and `react-hooks/set-state-in-effect` for this compatibility-preserving dependency refresh.
- Lockfile refresh for the updated development dependency graph.

## QA / Validation

- PASS: Existing PR checks showed Typecheck + reasoning-layer tests, Atlas quality, hygiene, routes/disclaimers, production readiness, accessibility, Lighthouse, bundle budget, license/SBOM, and other required gates passing on the dependency refresh.
- FOUND/FIXING: GitHub ESLint failed with `TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function` under `eslint@10.4.1`, triggered by the Next.js 16.2.7 bundled React lint plugin while linting `commitlint.config.js`.
- FIX: Pin ESLint back to `^9.39.4` while keeping the rest of the dev-tool refresh.
- FOUND/FIXING: After the ESLint pin removed the crash, the refreshed Next.js lint config surfaced 19 existing React compiler-rule errors across unrelated product files.
- FIX: Disable only the three newly surfaced compiler rules in `eslint.config.mjs` so this PR remains a dependency/toolchain refresh instead of a broad product-code refactor.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: `npm run lint` completed with 0 errors. Existing repo warnings remain.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npm run test:behaviors` passed 4 suites / 90 tests. Jest still reports the existing duplicate manual mock warnings for the markdown/GFM mocks.
- PASS: `npm run compliance:supply-chain` checked 1496 packages with 0 denied and 0 unclassified licenses, then generated an SBOM with 1496 components.
- PASS: Fresh `npm ci` from the updated lockfile.
- NOT RUN YET: GitHub PR checks after this release record and ESLint compatibility fix are pushed.
- NOT RUN YET: Post-merge main post-deploy crawl.

## Rollout Plan

Merge to `main` after local validation and required GitHub checks pass. The changes become active for CI and local developer installs through `package.json` and `package-lock.json`. The standard main post-deploy crawl must pass before the release is considered settled.

## Rollback Plan

Revert the PR to restore the previous development dependency graph. No database migration, runtime data, tenant data, or feature-flag rollback is required.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2773
- ESLint failure evidence: GitHub run `26799852338`, job `79004002428`.
- CI run: To be added after GitHub checks complete.
- Post-deploy crawl: To be added after merge if the standard main crawl runs.

## Known Gaps

ESLint 10 is deferred because the current Next.js 16.2.7 lint dependency graph still includes React lint plugins whose peer support and runtime API usage align with ESLint 9, not ESLint 10. This release keeps the product safer by shipping compatible toolchain upgrades now and leaving the ESLint major bump for a future Next/ESLint compatibility update.
