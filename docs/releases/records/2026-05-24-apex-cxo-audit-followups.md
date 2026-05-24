# 2026-05-24-apex-cxo-audit-followups — Apex CXO Audit Follow-Ups

## Release ID

`2026-05-24-apex-cxo-audit-followups`

## Status

`candidate`

## Plain-English Summary

Closes the trust gaps found during the Apex Retail CXO crawl after the first fix wave: the Home surface now uses the corrected Packet 18 Apex profile, the home IT inventory shows SAP ECC 6.0 as current state, Source event codes no longer duplicate the client name, and hard-question answers prefer buyer-owned scope and baseline evidence over generic gate text.

## Layer Impact

- `app-control-lane`: Updates Home, Source event creation, and Source deterministic answer rendering.
- `client-data-lane`: Aligns shared Apex seed/profile fixtures with the corrected Apex truth spine.
- `ops-release-lane`: Adds regression coverage for Apex Home truth-spine rendering and Source event-code/evidence behavior.

## Client Applicability

- Apex Retail: corrected revenue, employee, e-commerce, current ERP, and Source event-code behavior.
- All clients: event-code generation strips the active client display prefix before slugging.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/home/tenant-home-fixtures.ts`
- `src/lib/home/tenant-inventory.ts`
- `src/scripts/seed/_shared/enterprise-profiles.ts`
- `src/lib/source/queries.ts`
- `src/lib/source/expert-judgment/source-hard-question-answer.ts`
- Targeted regression tests.

## QA / Validation

- `npm test -- --runTestsByPath src/__tests__/integration/apex-home-truth-spine.test.ts src/lib/source/__tests__/create-sourcing-event-scaffold.test.ts src/lib/source/expert-judgment/__tests__/source-hard-question-answer.test.ts src/lib/source/__tests__/nexus-api-live-context.test.ts --runInBand` — passed.
- `npx tsc --noEmit --pretty false` — passed.
- `npx eslint src/components/home/tenant-home-fixtures.ts src/lib/home/tenant-inventory.ts src/scripts/seed/_shared/enterprise-profiles.ts src/lib/source/queries.ts src/lib/source/expert-judgment/source-hard-question-answer.ts src/__tests__/integration/apex-home-truth-spine.test.ts src/lib/source/__tests__/create-sourcing-event-scaffold.test.ts src/lib/source/expert-judgment/__tests__/source-hard-question-answer.test.ts` — passed.

## Rollout Plan

Merge to `main`, allow production deployment, then capture the final Apex CXO audit report against production.

## Rollback Plan

Revert the merge commit. No database migration is included.

## Audit Evidence

- PR URL and CI run after branch push.
- Production deployment URL after merge.
- Final Apex CXO audit report in `audit-artifacts/apex-cxo-it-source-e2e-2026-05-24/`.

## Known Gaps

- Existing Source events keep their already-persisted event codes; this change only affects newly created events.
- Intelligence still reports proof-point count from the brief payload, not the broader P18 evidence corpus; the final CXO audit report calls that out separately.
