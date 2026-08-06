# 2026-08-06-crawl-tenant-identity-normalization — Crawl Tenant Identity Normalization

## Release ID

`2026-08-06-crawl-tenant-identity-normalization`

## Status

`candidate`

## Plain-English Summary

Fixes a false-positive signed-in crawl finding where pages that visibly rendered the active tenant name in uppercase were still flagged as missing tenant identity. The crawl now normalizes case and whitespace for the tenant-identity presence check while keeping leakage checks strict and case-insensitive.

## Layer Impact

- `global-control-lane`: Updates the post-deploy crawl comparator used to prove signed-in product availability.
- `PRODUCTS`: No product runtime UI or data behavior changes. This affects proof interpretation only.

## Client Applicability

- All clients: Yes, for post-deploy crawl comparison behavior.
- Specific clients: Active airline demo workspace is the immediate proof consumer.
- Internal only: No.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `src/lib/crawl/baseline-compare.ts`: normalizes case and whitespace when checking whether the expected tenant identity is visible.
- `src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts`: adds coverage for uppercase tenant headings.

## QA / Validation

- `pass` — Targeted crawl guard test: `npm test -- --runTestsByPath src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`.
- `pass` — Release check: `npm run release:check`.
- `pass` — Signed-in post-deploy crawl replay against `https://app.abarva.ai` for Home, Source Portfolio, and Tower: `0 P0, 0 P1, 0 P2`.

## Rollout Plan

Merge through PR to `main`. This is a proof-harness change; no data migration is required. Future post-deploy crawl runs will use the normalized tenant identity check.

## Deployment Authority

- Repo-owned deploy workflow: Required by main branch policy if merged.
- Shared runtime mutators: None.
- Approved image digest: Produced by the repo-owned ACA deploy workflow if a deploy is triggered.
- ACA runtime invariant: Required if a deploy is triggered.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the incident closeout.

## Rollback Plan

Revert the comparator change if the normalized match hides a real tenant-identity regression. No database rollback is required.

## Audit Evidence

- PR URL: Pending.
- CI/deploy run: Pending.
- Signed-in crawl replay: `/tmp/skyharbor-live-core-crawl-normalized-20260806T142400Z/2026-08-06T14-24-02-834Z-local`.

## Known Gaps

No known product or data gaps. This release only changes how the crawl proof recognizes visible tenant identity when the product design renders the same tenant name in uppercase or with different whitespace.
