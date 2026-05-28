# 2026-05-28-skyharbor-azure-fact-fingerprint — SkyHarbor Fact Availability Alignment

## Release ID

`2026-05-28-skyharbor-azure-fact-fingerprint`

## Status

`candidate`

## Plain-English Summary

This release fixes the SkyHarbor agent's fact-availability guard so it reads the same Azure Postgres data plane that holds the SkyHarbor substrate, rather than checking Supabase and incorrectly marking applications, vendors, initiatives, financials, board context, and executive data as unavailable. It also broadens enterprise retrieval triggers for the CTO verification questions around TOM, DORA, GCC, EDP, AI tooling, cyber, sourcing, and value realization.

## Layer Impact

- app-control-lane: fixes `/api/intelligence/ask` grounding behavior through the shared ask retrieval path.
- client-data-lane: no schema or data mutation; reads existing Azure tenant data.
- ops-release-lane: improves Packet 29 Section 8 verifier fidelity by removing false data-unavailable admissions.

## Client Applicability

- Specific clients: SkyHarbor Air.
- All clients: the Azure-backed fact fingerprint path is alias-aware for existing tenants and uses the same fallback session behavior as the enterprise retriever.
- Feature flag: not applicable.

## Changes Included

- `src/lib/intelligence/ask/tenant-fact-fingerprint.ts` now resolves `tenantInventoryKey` aliases through Azure Postgres and counts availability from Azure tables/chunks.
- `skyharbor` resolves to the canonical `skyharbor-air` tenant key when tenant id is not available from the request context.
- Fact availability now recognizes SkyHarbor applications, vendor contracts, initiatives, financials, board context, and executive chunks loaded in Azure.
- `src/lib/knowledge/tenant-enterprise-context.ts` recognizes CTO demo language for target operating model, DORA, GCC, EDP true-up, Snowflake/Databricks, cyber stack, AI tooling, COBOL, and sourcing events.
- Structured tenant sources are pulled for broader SkyHarbor operating-model and modernization questions instead of letting those prompts fall through to generic worldview-only answers.
- Enterprise source retrieval now tolerates partial retrieval failures, so one failed graph/chunk/structured lookup does not erase all available tenant context for a question.
- The structured-fact retriever explicitly treats EDP true-up, AI tooling, cyber/security stack, Snowflake/Databricks, IBM/AWS, and sourcing-event questions as vendor/contract retrieval triggers.

## QA / Validation

Passed locally:

```text
npx jest src/lib/intelligence/ask/__tests__/no-fabrication.test.ts src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts --runInBand
npx eslint src/lib/intelligence/ask/tenant-fact-fingerprint.ts src/lib/intelligence/ask/__tests__/no-fabrication.test.ts src/lib/knowledge/tenant-enterprise-context.ts
npx tsc --noEmit --pretty false
git diff --check
```

## Rollout Plan

Merge to main after CI is green and deploy to production. Re-run the three focused SkyHarbor probes, then re-run Packet 29 Section 8 full 25-question verifier.

## Rollback Plan

Revert this commit if the Azure fingerprint path causes unexpected latency or availability regressions. The rollback restores the prior fact-fingerprint implementation.

## Audit Evidence

- Packet 29 production replay after PR #2387 completed but scored `9/25`, with repeated false admissions such as "application portfolio data class is marked unavailable" even though SkyHarbor has 92 applications, 52 vendor contracts, 38 initiatives, and 3,240 enterprise context chunks loaded.
- The root cause was the fact-fingerprint guard reading Supabase, while the SkyHarbor substrate lives in Azure Postgres.
- Focused production probes showed route/auth/tenant isolation were working for IBM dependency questions, so the remaining issue was data availability alignment and retrieval coverage.
- A post-deploy probe showed the AWS EDP question could still fall back to worldview-only sources; the structured-fact trigger and partial-failure tolerance were added to prevent that coverage hole.

## Known Gaps

Packet 29 demo readiness is not established by this release alone. The post-deploy 25-question verifier must still pass the gate: at least 23 of 25 questions scoring 4/5 or better and at least 18 scoring 5/5.
