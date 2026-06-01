# 2026-06-01-ai-public-trust-pages — Public AI Trust Pages

## Release ID

`2026-06-01-ai-public-trust-pages`

## Status

`candidate`

## Plain-English Summary

Adds public Responsible AI, Model Card, and Known Limitations pages so pilot buyers can see AbarVa's AI decision-support posture, human oversight boundary, intended-use summary, and limitations without needing workspace access.

## Layer Impact

Public/demo layer: adds public informational routes and footer links on `abarva.ai`.

Control plane: updates the public canonical URL registry and metadata for the new pages.

## Client Applicability

- All clients: Receives the same public trust disclosures.
- Specific clients: None.
- Internal only: No.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- Adds `/responsible-ai/`, `/model-card/`, and `/known-limitations/` public routes.
- Adds shared public AI trust page components and content constants.
- Adds canonical URLs and footer navigation for the new trust pages.
- Updates public-site tests for canonical routes and footer discoverability.

## QA / Validation

- Pass: `./node_modules/.bin/jest tests/public-site/canonical-urls.test.ts tests/public-site/shell.test.ts`
- Pass: `./node_modules/.bin/eslint src/components/public-site/AiTrustPage.tsx src/components/public-site/Footer.tsx src/lib/public-site/ai-trust-content.ts src/lib/public-site/canonical-urls.ts src/app/(public)/responsible-ai/page.tsx src/app/(public)/model-card/page.tsx src/app/(public)/known-limitations/page.tsx tests/public-site/canonical-urls.test.ts tests/public-site/shell.test.ts`
- Pass: `./node_modules/.bin/tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main`; the public routes become available through the normal Vercel production deployment.

## Rollback Plan

Revert the PR to remove the three public routes, footer links, canonical URL entries, and tests. No database or private data-plane rollback is required.

## Audit Evidence

- Pull request and CI checks.
- Public routes: `/responsible-ai/`, `/model-card/`, `/known-limitations/`.
- Release record: `docs/releases/records/2026-06-01-ai-public-trust-pages.md`.

## Known Gaps

These pages are public disclosures only. They do not replace legal review, tenant-specific governance configuration, or private workspace controls.
