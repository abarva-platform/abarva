# 2026-08-16-source-portfolio-value-l4-basis - Source portfolio value L4 basis

## Release ID

`2026-08-16-source-portfolio-value-l4-basis`

## Status

`candidate`

## Plain-English Summary

Source portfolio and value-ledger entry surfaces now show the governed Source L4 / cube contract basis when those rows are present. Event workflow cards remain event-scoped, but headline contract value, contract count, vendor count, and application-scope count no longer come from seeded event-only values when a refreshed governed Source projection is available.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 products: Source portfolio, Source events compatibility route, Source queue compatibility route, and Source value ledger read the governed Source workspace snapshot for headline portfolio/value basis.

Layer 3 canonical model: No schema, canonical object, or source data write is included.

## Client Applicability

- All clients: Yes. The read behavior applies to Source tenants with governed Source L4 snapshot rows.
- Specific clients: Validation focuses on the approved demo refresh scope.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source analytics flag behavior is preserved.

## Changes Included

- `src/app/(maestro)/source/portfolio/page.tsx`: loads the governed Source workspace snapshot for the active tenant and passes it to the portfolio book.
- `src/components/source/SourcePortfolioBookPage.tsx`: accepts governed Source snapshot data.
- `src/lib/source/portfolio-book-view.ts`: uses governed `source.contract_360` / vendor portfolio counts and annual value for the portfolio financial headline when present.
- `src/app/(maestro)/source/value/page.tsx`: adds a governed Source L4 / cube basis panel above the seeded value ledger and adjusts the assistant rail quote to keep the two bases separate.
- `src/components/source/SourceValueLedger.tsx`: normalizes the value-ledger prompt placeholder spelling.
- Focused tests updated for the governed L4 headline and value-ledger shell copy.

## QA / Validation

- Pass: `npm test -- src/components/source/__tests__/SourcePortfolioBookPage.honesty.test.tsx src/__tests__/integration/source/source-context-action-enforcement.test.ts src/__tests__/integration/source/source-value-ledger-shell.test.ts --runInBand`.
- Pass: `npx eslint 'src/app/(maestro)/source/portfolio/page.tsx' 'src/app/(maestro)/source/value/page.tsx' 'src/components/source/SourcePortfolioBookPage.tsx' 'src/components/source/SourceValueLedger.tsx' 'src/lib/source/portfolio-book-view.ts' 'src/components/source/__tests__/SourcePortfolioBookPage.honesty.test.tsx' 'src/__tests__/integration/source/source-context-action-enforcement.test.ts'`.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the approved image. After deploy, verify the ACA runtime invariant and rerun signed-in product proof for Source portfolio, events/queue redirects, and value ledger routes.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned main deploy workflow.
- Approved image digest: To be captured from ACA deploy evidence.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and allow the repo-owned ACA deploy workflow to restore the previous event-only portfolio/value headline behavior. No data-plane rollback is required because this release does not mutate source data.

## Audit Evidence

- PR URL, merge commit, ACA deploy evidence, runtime invariant proof, and signed-in crawl proof to be captured after merge.
- Local validation commands listed above.

## Known Gaps

This release does not create additional L4 performance/event facts and does not load realized value-ledger rows. It only changes product surfaces to prefer the governed Source L4 / cube basis where already available.
