# 2026-05-28-skyharbor-enterprise-retrieval-fallback — SkyHarbor Enterprise Retrieval Fallback

## Release ID

`2026-05-28-skyharbor-enterprise-retrieval-fallback`

## Status

`candidate`

## Plain-English Summary

This release fixes the SkyHarbor Intelligence retrieval path after diagnostics proved the data was loaded correctly but the live ask route was returning only surface context and worldview sources. The root cause was connection resolution: server-side readers preferred `ABARVA_AZURE_DATABASE_URL`, which points at a private Azure DNS host unavailable from the current app runtime, and did not fall back to `DATABASE_URL`, where the loaded SkyHarbor mirror rows are reachable. The fix keeps the private Azure lane first, but falls back safely on connection-level failures so Sentinel can actually reach the 3,240 SkyHarbor enterprise and airline-pattern chunks.

## Layer Impact

- app-control-lane: restores `/api/intelligence/ask` access to SkyHarbor enterprise context by making the shared Postgres compatibility client resilient to private-DNS connection failures.
- client-data-lane: normalizes SkyHarbor aliases before tenant enterprise and structured-fact retrieval, so app-facing `skyharbor` resolves to loaded data key `skyharbor-air`.
- corpus-knowledge-lane: makes the loaded SkyHarbor enterprise chunks and structured facts visible to Intelligence answers, including IBM dependency, value-ledger, and application-criticality questions.
- ops-release-lane: updates the Packet 29 Tier-1 verifier so it honors the requested `--output` artifact and checks the explicit Section 8 gate.

## Client Applicability

- All clients: shared DB connection fallback applies to server-side Postgres compatibility reads and Azure read/write sessions, but only on connection-level failures such as DNS/connect timeouts.
- Specific clients: SkyHarbor Air benefits immediately because its loaded context mirror is reachable through `DATABASE_URL` while the private Azure host is not resolvable from this runtime.
- Internal only: not applicable.
- Public/demo only: protects the Delta/SkyHarbor demo path and the Packet 29 verification workflow.
- Feature flag: not applicable.

## Changes Included

- `src/lib/supabase-server.ts` adds ordered connection candidates and connection-level fallback from `ABARVA_AZURE_DATABASE_URL` to `DATABASE_URL`.
- `src/lib/data-plane/read-adapters/azureSession.ts` adds the same fallback behavior for shared read and transaction sessions.
- `src/lib/knowledge/tenant-enterprise-context.ts` canonicalizes tenant keys at the retrieval entry point so `skyharbor` becomes `skyharbor-air` before chunk and structured-fact lookup.
- `src/app/api/intelligence/ask/route.ts` keeps a safe app-client-key fallback so intermittent client-row resolution failures no longer drop `tenantInventoryKey` from the ask request.
- `src/app/api/intelligence/ask/route.ts` initializes that fallback before user/context lookups, so a thrown Clerk/person/client lookup cannot erase the request-body tenant key.
- `src/lib/intelligence/ask/tenant-key-resolution.ts` centralizes the pure fallback mapping used by the ask route.
- `scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs` honors `--output verification/TIER_1_GROUND_TRUTH_RESULTS.md` and applies the Packet 29 pass gate.
- Focused tests were added for DB fallback, Azure session fallback, and SkyHarbor alias enterprise retrieval.

## QA / Validation

Passed locally:

```text
npx jest src/lib/__tests__/supabase-server.test.ts src/lib/data-plane/read-adapters/__tests__/azure-session.test.ts src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts --runInBand
npx jest src/lib/intelligence/ask/__tests__/tenant-key-resolution.test.ts src/lib/__tests__/supabase-server.test.ts src/lib/data-plane/read-adapters/__tests__/azure-session.test.ts src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts --runInBand
npx eslint src/lib/supabase-server.ts src/lib/data-plane/read-adapters/azureSession.ts src/lib/__tests__/supabase-server.test.ts src/lib/data-plane/read-adapters/__tests__/azure-session.test.ts src/lib/knowledge/tenant-enterprise-context.ts src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs scripts/skyharbor/07_verify/ground_truth_runner.mjs
node --check scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs
npx tsc --noEmit --pretty false
git diff --check
```

Standalone retriever diagnostics passed with `ABARVA_AZURE_DATABASE_URL` still present, and route fallback unit tests passed: `retrieveTenantEnterpriseSources('skyharbor-air', IBM/Amala/value-ledger query)` returned 5 enterprise sources with IBM and value-ledger evidence; alias `skyharbor` returned the same 5 canonical `skyharbor-air` sources; `retrieveTenantStructuredFacts('skyharbor', 'Top 5 apps by criticality')` returned actual SkyHarbor application rows from `public.applications`.

Direct DB validation confirmed `enterprise_context_chunks` contains 3,240 rows for `tenant_key='skyharbor-air'`, including 807 enterprise profile, 486 IT financial, 954 IT landscape, 160 org structure, and 833 program inventory chunks.

## Rollout Plan

Merge the PR to main after CI is green, deploy to Vercel production, and rerun the exact SkyHarbor semantic probe against `app.abarva.ai`. After the semantic source payload includes enterprise context, run the Packet 29 Section 8 Tier-1 verifier and publish `verification/TIER_1_GROUND_TRUTH_RESULTS.md`.

## Rollback Plan

Revert this commit and redeploy if the connection fallback causes unexpected read behavior. Rollback would restore the prior behavior of using only the first configured database URL, which is safe but would reintroduce the SkyHarbor retrieval gap whenever the private Azure DNS host is unavailable from the app runtime. No schema or data rollback is required.

## Audit Evidence

- Direct DB count: 3,240 SkyHarbor enterprise context rows under `tenant_key='skyharbor-air'` and client UUID `6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301`.
- Standalone retriever diagnostic after fix: enterprise source count 5 for both `skyharbor-air` and alias `skyharbor`, `hasIBM=true`, `hasValueLedger=true`.
- Structured-fact diagnostic after fix: SkyHarbor top-applications source returned real app rows including Cargo Capacity Rating, Baggage WorldTracer Bridge, Interline Settlement, Revenue Accounting Batch, and Loyalty Accrual Core.
- PR validation commands are listed in `QA / Validation` above.

## Known Gaps

Production semantic probe and the full 25-question Packet 29 verifier still need to be rerun after this PR is merged and deployed. The broader tenant-resolution architecture still has multiple resolution paths and should be consolidated post-demo into one helper, one fallback policy, and one regression suite.
