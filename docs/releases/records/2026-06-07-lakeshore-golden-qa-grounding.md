# 2026-06-07-lakeshore-golden-qa-grounding — Lakeshore golden-question grounding

## Release ID

`2026-06-07-lakeshore-golden-qa-grounding`

## Status

`candidate`

## Plain-English Summary

Sentinel now retrieves richer Lakeshore context for the operator golden questions instead of falling back to generic advisory filler. The change makes Lakeshore tenant-key aliases work for technology inventory, prioritizes Kyriba/treasury/current-state/provenance chunks from the Azure-backed enterprise context layer, and keeps the answer contract explicit about using named loaded facts.

## Layer Impact

- `global-control-lane`: Updates shared Intelligence Ask retrieval, response policy, and synthesis grounding. The logic applies to all tenants, with Lakeshore-specific query anchors only activating for matching question terms.
- `client-data-lane`: Improves how Lakeshore's Azure-backed tenant context is discovered and cited; no schema, migration, or data mutation is included.

## Client Applicability

- All clients: alias-aware technology retrieval and richer enterprise segment selection are available globally.
- Specific clients: Lakeshore Holdings receives the intended golden-question grounding improvements.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/knowledge/tenant-technology-context.ts`: resolve tenant aliases and include provenance fields in technology sources.
- `src/lib/knowledge/tenant-enterprise-context.ts`: select KPI, evidence, vendor-contract, data-estate, and cross-program segments for golden-question terms; boost named Lakeshore/Kyriba/provenance chunks.
- `src/lib/intelligence/ask/response-policy.ts`: ground current-state technology answers in loaded Azure-backed enterprise context.
- `src/lib/intelligence/ask/synthesizer.ts`: add Lakeshore/Kyriba treasury grounding instructions.
- `src/lib/intelligence/ask/tenant-fact-fingerprint.ts`: resolve Lakeshore tenant aliases.
- Focused unit regression coverage for alias resolution, segment selection, named chunk retrieval, prompt discipline, and fact fingerprinting.

## QA / Validation

Pre-test candidate revision prepared. Focused Jest and release checks will be recorded after the required pre-test push.

## Rollout Plan

Merge to `main`; the next app deploy picks up the retrieval and synthesis changes. No migration or manual data-plane operation is required.

## Rollback Plan

Revert the commit to restore the prior retrieval, response-policy, and prompt behavior. No persisted data rollback is required.

## Audit Evidence

- PR for branch `cursor/lakeshore-golden-qa-6b6f`.
- Focused test output to be attached in the final PR revision.

## Known Gaps

Signed-in product-route golden QA still requires real Clerk and Azure credentials from the operator environment.
