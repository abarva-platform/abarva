# 2026-06-02-subprocessors-public-page — Public Subprocessor Page

## Release ID

`2026-06-02-subprocessors-public-page`

## Status

`candidate`

## Plain-English Summary

Adds a public `/subprocessors` trust page that discloses AbarVa's current, optional, and legacy compatibility service providers for pilot security review and customer contracting.

## Layer Impact

Public demo and trust surface: adds a public legal/trust route, updates public-site navigation, sitemap metadata, and the Clerk public-route allow-list so the page is reachable without authentication.

Release QA: expands the browser matrix public smoke test to include `/subprocessors`.

No client data, schema, migration, ingestion, or private data-plane runtime behavior changes.

## Client Applicability

- All clients: Security reviewers and buyers get a consistent public service-provider inventory.
- Specific clients: None.
- Internal only: None.
- Public/demo only: The new route is public at `https://abarva.ai/subprocessors/`.
- Feature flag: None.

## Changes Included

- `src/app/(public)/subprocessors/page.tsx`
- `src/lib/public-site/subprocessors-content.ts`
- `src/lib/public-site/canonical-urls.ts`
- `src/app/(public)/sitemap.xml/route.ts`
- `src/components/public-site/AiTrustPage.tsx`
- `src/components/public-site/Footer.tsx`
- `src/proxy.ts`
- `tests/browser-matrix/public-surface-smoke.spec.ts`

## QA / Validation

- `git diff --check` — pass.
- `npm run browser:matrix:list` — pass; listed 40 tests across 5 browser projects, including `/subprocessors`.
- `npm run build` — pass; production build completed and emitted `/subprocessors` in the route table.
- `npm run browser:matrix` — pass; 40/40 tests passed, including `/subprocessors` across chromium, firefox, webkit, mobile-chrome, and mobile-safari.
- `npm run release:check -- --base origin/main --head HEAD` — pass after adding explicit QA statuses.
- `npm run secrets:staged` — pass; no leaks found in the staged diff.

## Rollout Plan

Merge to `main`; Vercel deploys the public route with the next production release. The page is immediately public once the deployment containing this PR is promoted.

## Rollback Plan

Revert the PR to remove the public route, content inventory, navigation links, sitemap entry, public-route allow-list entry, browser smoke coverage, and release record. No migration or data rollback is required.

## Audit Evidence

- Pull request for this release candidate.
- Local validation output from the QA / Validation commands.
- Browser Matrix Smoke CI run after PR creation.
- Production or preview deployment URL for `/subprocessors/`.

## Known Gaps

This page is an inventory and disclosure surface. Customer-specific DPAs, order forms, private data-plane addenda, regional commitments, and provider opt-outs still control the final contractual provider set for each engagement.
