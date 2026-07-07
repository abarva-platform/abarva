# Agent Golden Tenant Question Suites — 2026-06-09

Executable golden suites for **every active canonical tenant**, used to validate
that governed Nexus/Sentinel answers resolve the right tenant, retrieve the
right context, exclude un-reviewed rows, warn when evidence is missing, and emit
citations — without cross-tenant leakage or phantom/cross-namespace pattern
citations.

## Tenants (code-derived — never hand-typed)

Suites are built from `CANONICAL_TENANT_KEYS` (`src/config/tenants/CANONICAL_TENANTS.ts`),
so the set cannot drift from the registry. Current set:

| Tenant key | Name | Industry |
|------------|------|----------|
| `apex-retail` | Apex Retail | retail |
| `meridian-health` | Meridian Health System | healthcare_provider (PHS-shape) |
| `northstar-clinical` | Northstar Clinical Technologies | healthcare_medtech |
| `first-capital` | First Capital | financial_services_banking |
| `skyharbor-air` | SkyHarbor Air | airline |
| `lakeshore-holdings` | Lakeshore Holdings | diversified / private_holdings |

**SkyHarbor and Lakeshore are both included** (Lakeshore is a canonical tenant —
`diversified`). Morgan Street is not canonical and is excluded. Whether each
tenant has **loaded Azure data** is a separate ingestion-state question that the
PR-5 live run answers; these suites are the questions + assertions, generated
deterministically.

## Coverage

**11 questions per tenant** (within the required 8–12), one per category — **66
total**. Categories: leadership · company scale · industry corpus · Move context
· artifacts/evidence · KPI/value · vendor/source · systems/application landscape
· IT/data/cloud/ERP architecture · risk/failure mode · missing/unsupported
(negative test).

The full machine-readable bank is at
`docs/build/agent-context-bundle-verification-2026-06-09/golden-question-bank.json`.

## Per-question tags

Each question carries: `tenantKey`, `category`, `expectedAnswerability`
(`FULLY_ANSWERABLE` / `PARTIALLY_ANSWERABLE` / `NOT_LOADED` — a hypothesis the
PR-5 Azure run reconciles), `requiredSourceTypes`, and assertion flags
(`expectsTenantContext`, `expectsApprovedPattern`, `expectsMissingContextWarning`,
`expectsCitations`, `negativeTest`, `tenantIsolationTest`).

Expected answers are **not fabricated** — we tag answerability + required source
types, and the live run derives ground truth from each tenant's Azure-loaded
context. This honours the truth standard: "loaded" ≠ "indexed" ≠ "retrievable" ≠
"cited."

## Assertions (per `assertGoldenQuestion`)

For each question the harness asserts:

1. **correct tenant resolved** — `trace.tenant_key` matches the question's tenant.
2. **no other tenant context appears** — isolation check (live runner supplies
   the leakage signal from PR-4).
3. **≥1 relevant tenant context object retrieved** where expected.
4. **approved corpus patterns retrieved** where expected.
5. **not_reviewed / blocked / quarantined / restricted rows excluded** — read off
   the trace's `excluded_objects` (governance reasons).
6. **missing-context warning** present when evidence is insufficient.
7. **citation/evidence objects emitted**.
8. **cited object ids exist** in Azure Postgres/Search (live runner).
9. **cited pattern ids belong to the active grounding namespace** (live runner +
   PR-4 namespace validation).

## How to run

- **Lab mode (CI, no DB):** `npm run test:behaviors` exercises
  `src/__tests__/behaviors/agent-golden.test.ts` — validates the suite is
  well-formed, code-derived, fully category-covering, and that
  `assertGoldenQuestion` behaves correctly against synthetic traces.
- **Live mode (Azure Container Apps):** the PR-5 verification harness imports
  `buildGoldenSuites()` + `assertGoldenQuestion`, drives each question through the
  real Nexus/Sentinel path, and asserts against the live trace + PR-4 validation.
  This requires a real `DATABASE_URL` reachable from inside Azure (the private DB
  is not reachable from localhost).

## Status

Suites + assertions + the JSON bank are committed and lab-tested. Live pass/fail
per tenant is produced by PR-5 on ACA and recorded in
`AGENT_CONTEXT_BUNDLE_PRODUCTION_VERIFICATION_2026-06-09.md`.
