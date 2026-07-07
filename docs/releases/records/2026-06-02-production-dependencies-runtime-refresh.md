# 2026-06-02-production-dependencies-runtime-refresh — Production runtime dependency refresh

## Release ID

`2026-06-02-production-dependencies-runtime-refresh`

## Status

`candidate`

## Plain-English Summary

This release updates the production runtime dependency set used by the application, including Next.js, React, Clerk, Anthropic, OpenAI, Postgres, Stripe, Resend, PostHog, and document export libraries. It also makes the Clerk webhook verifier dependency explicit after the refreshed Clerk graph stopped exposing `svix` transitively. These packages sit on core runtime paths for routing, authentication, AI calls, database access, payments, email, telemetry, and document generation, so the release is treated as a controlled runtime refresh rather than a cosmetic dependency bump.

## Layer Impact

`global-control-lane`: shared application runtime dependencies. The update can affect all app surfaces indirectly through framework, auth, API client, database, telemetry, email, payment, and export behavior. No intentional product UI, route contract, data-plane schema, tenant data, or feature-flag behavior changes are included.

## Client Applicability

- All clients: Indirectly affected because shared runtime packages are updated.
- Specific clients: None.
- Internal only: CI/release operators monitor the rollout.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `@anthropic-ai/sdk`: `0.85.0` to `0.100.1`
- `@clerk/nextjs`: `7.0.11` to `7.4.2`
- `docx`: `9.6.1` to `9.7.1`
- `next`: `16.2.2` to `16.2.7`
- `openai`: `6.34.0` to `6.41.0`
- `pg`: `8.20.0` to `8.21.0`
- `posthog-js`: `1.368.0` to `1.378.1`
- `react`: `19.2.4` to `19.2.7`
- `react-dom`: `19.2.4` to `19.2.7`
- `resend`: `6.12.2` to `6.12.4`
- `svix`: add explicit dependency for Clerk webhook signature verification.
- `stripe`: `22.0.2` to `22.2.0`
- Lockfile refresh for the updated dependency graph.
- Update the existing `posthog-js` license-policy exception from `1.368.0` to `1.378.1` because the refreshed package still records `SEE LICENSE IN LICENSE` instead of an SPDX identifier.

## QA / Validation

- PASS: Branch rebased cleanly onto current `origin/main`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: `npm ci`.
- PASS: `npm run test:behaviors` passed 4 suites / 90 tests.
- FOUND/FIXED: `npx tsc --noEmit --pretty false` initially failed because `src/app/api/webhooks/clerk/route.ts` imported `svix` through an implicit Clerk transitive dependency. Added `svix` explicitly and updated the route comment.
- PASS: Re-ran `npx tsc --noEmit --pretty false` after the explicit `svix` fix.
- FOUND/FIXED: GitHub License/SBOM initially failed because `posthog-js@1.378.1` retained the same non-SPDX lockfile license text as the prior version while the policy exception was pinned to `1.368.0`. Updated the named exception to `1.378.1`.
- PASS: Re-ran `npm run compliance:supply-chain` after the `posthog-js` exception update; license check reported 0 denied and 0 unclassified packages, and SBOM generation covered 1494 components.
- NOT RUN YET: GitHub PR checks after this release record is pushed.
- NOT RUN YET: Post-merge main post-deploy crawl.

## Rollout Plan

Merge to `main` after local validation and required GitHub checks pass. Vercel will build and deploy the application with the refreshed runtime packages. The standard main post-deploy crawl must pass before the release is considered settled.

## Rollback Plan

Revert the PR to restore the prior `package.json` and `package-lock.json` dependency graph. No database migration rollback or client data rollback is required.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2772
- CI run: To be added after GitHub checks complete.
- Post-deploy crawl: To be added after merge if the standard main crawl runs.

## Known Gaps

This release does not inspect every upstream package changelog line-by-line. The safety evidence comes from scoped dependency diff review, local release-control/type/behavior validation, required CI gates, Vercel preview build status, and the main post-deploy crawl after merge. The explicit `svix` addition is intentionally part of this dependency refresh because it preserves the existing Clerk webhook verification behavior under the new dependency graph. Any surfaced runtime regression should be fixed or the dependency refresh reverted as a single rollback unit.
