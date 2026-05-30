# 2026-05-30 Retail Overlay Retrieval

## Release ID

`2026-05-30-retail-overlay-retrieval`

## Status

`candidate`

## Plain-English Summary

Apex Retail Ask answers now pull from the newly loaded retail industry corpus instead of relying only on older generic pattern sources. When an Apex user asks a retail CXO question, Sentinel receives live `retail-v1` pattern chunks with pattern IDs and pack provenance in the source payload.

## Layer Impact

- Application control lane: The `/api/intelligence/ask` retrieval assembly now adds tenant-scoped retail overlay evidence before legacy pattern and worldview sources.
- Context layer: Reads existing `enterprise_context_chunks` rows where `tenant_key = 'apex-retail'` and `chunk_metadata.overlay_namespace = 'retail-v1'`; no data writes or migrations.
- QA / audit layer: Adds a Section 6.3 smoke script that runs 25 Apex Retail questions through the live Ask API and counts retail overlay grounding.

## Client Applicability

- All clients: No. Non-retail tenants do not enter the new retriever.
- Specific clients: Apex Retail receives the new `retail-v1` overlay retrieval.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- PR #2493: `feat: surface retail overlay chunks in Ask`.
- New retriever: `src/lib/intelligence/ask/retrievers/retail-overlay.ts`.
- Ask wiring: `src/lib/intelligence/ask/index.ts`.
- Smoke script: `scripts/smoke/retail-overlay-retrieval-smoke.mjs`.
- Unit coverage: `src/lib/intelligence/ask/retrievers/retail-overlay.test.ts`.

## QA / Validation

- PASS: `npx jest src/lib/intelligence/ask/retrievers/retail-overlay.test.ts src/lib/knowledge/__tests__/coverage.test.ts src/lib/knowledge/__tests__/coverage-contract-acceptance.test.ts --runInBand`.
- PASS: `npx eslint src/lib/intelligence/ask/retrievers/retail-overlay.ts src/lib/intelligence/ask/retrievers/retail-overlay.test.ts src/lib/intelligence/ask/index.ts scripts/smoke/retail-overlay-retrieval-smoke.mjs`.
- PASS: `git diff --check`.
- PASS: Live DB probe for an Apex shrink/self-checkout query returned `retail-v1:e.3.*` overlay chunks through the new retriever.

## Rollout Plan

Merge PR #2493 to main, allow Vercel production deploy, then run `node scripts/smoke/retail-overlay-retrieval-smoke.mjs --base-url https://app.abarva.ai`. Section 6.3 closes only if the production smoke passes at least 22 of 25 questions with three or more `retail-v1` chunks and two or more pattern citations.

## Rollback Plan

Revert PR #2493. The rollback is code-only and does not modify or delete the loaded `enterprise_context_chunks` overlay rows.

## Audit Evidence

- PR: https://github.com/anandsundaram-hash/abarva/pull/2493
- Post-merge production smoke artifact will be stored under `audit-artifacts/retail-overlay-retrieval-smoke/`.

## Known Gaps

Production smoke is intentionally post-merge because the current production deployment does not contain the new retriever until PR #2493 lands.
