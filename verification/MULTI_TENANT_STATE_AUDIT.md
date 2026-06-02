# Multi-Tenant State Audit

Date: 2026-05-28
Packet: Packet 32 Category C1 Phase A
Status: Read-only audit

## Executive Summary

The C1 audit is partially complete and blocked on direct Azure private-lane reachability from this execution environment.

Key findings:

- The repo has a read-only substrate audit script. A first run in the fresh worktree failed because dependencies were not installed there; a second run using the main worktree's dependency install reached the script and then failed on Azure private DNS.
- Running the existing audit from the main dependency install previously succeeded against the accessible database URL and produced row-count gaps for Apex, Meridian, First Capital/Brindlemark, and Northstar.
- A direct attempt to query `ABARVA_AZURE_DATABASE_URL`, and a direct run of the substrate audit against the canonical env, both failed DNS resolution for `pg-abarva-context-lab-001.postgres.database.azure.com`, which is consistent with an Azure private-lane host not reachable from this local machine.
- Because the canonical Packet 31/30 target is Azure, this report does **not** claim that Azure private-plane row counts, embedding completeness, or RLS are fully verified.

## Commands Run

Fresh C1 worktree script attempt:

```bash
node scripts/audit/db-substrate-audit.mjs
```

Result:

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'dotenv'
```

Fresh C1 worktree using main worktree dependency install:

```bash
ln -s /Users/anand/Projects/nexus/node_modules node_modules
node scripts/audit/db-substrate-audit.mjs
rm node_modules
```

Result:

```text
Postgres connection failed: getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com
```

Main dependency-install fallback:

```bash
node scripts/audit/db-substrate-audit.mjs
```

Direct Azure private-lane probe:

```bash
node -e "<readonly pg count query using ABARVA_AZURE_DATABASE_URL>"
```

Result:

```text
Error: getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com
```

## Accessible Database Row Counts

The following table is from the existing `scripts/audit/db-substrate-audit.mjs` run using the accessible database URL from the existing installed workspace.

| Table | Apex | Meridian | First Capital / Brindlemark | Northstar |
|---|---:|---:|---:|---:|
| enterprise_context_chunks | 280 / 280 | 320 / 320 | 400 / 400 | 878 / 720 |
| enterprise_context_source_files | 42 / 42 | 0 / 48 | 0 / 60 | 0 / 96 |
| applications | 120 / 120 | 140 / 140 | 180 / 180 | 240 / 240 |
| ai_initiatives | 8 / 30 | 7 / 28 | 49 / 32 | 80 / 80 |
| vendor_contracts | 25 / 45 | 0 / 50 | 70 / 70 | 90 / 90 |
| teams | null / 14 | null / 16 | null / 22 | null / 22 |
| person_client_memberships | 67 | 37 | 35 | 5 |

## Gap Summary

Accessible database gaps:

| Tenant | Gaps |
|---|---|
| Apex Retail | `ai_initiatives` gap 22; `vendor_contracts` gap 20; `teams` not queryable/available. |
| Meridian Health | `enterprise_context_source_files` gap 48; `ai_initiatives` gap 21; `vendor_contracts` gap 50; `teams` not queryable/available. |
| First Capital / Brindlemark | `enterprise_context_source_files` gap 60; `teams` not queryable/available. |
| Northstar Clinical | `enterprise_context_source_files` gap 96; `teams` not queryable/available. |

SkyHarbor is not included in the accessible fallback script output, so its stated 3,240-chunk Azure-loaded state remains unverified by this C1 run from local.

## Tenant Tier Assignment

Preliminary assignments from Packet 31 tiers and current sales context:

| Tenant | Tier | State |
|---|---|---|
| SkyHarbor Air | T1 demo / active Delta path | Azure verification blocked locally; should be verified from VNet runner. |
| Meridian Health | T1 demo / PHS proxy | Healthcare-provider sales path active; substrate has accessible row gaps. |
| Apex Retail | T1 demo | Retail demo substrate available but incomplete against P18 expected tables. |
| First Capital / Brindlemark | T1 demo frozen | Not active in immediate sales path; mark frozen unless revived. |
| Northstar Clinical | T1 demo | Medtech demo substrate has more chunks than original spec but missing source-file provenance rows. |

## RLS / Tenant Isolation Verification

Not completed in this local C1 run.

Reason: direct Azure private-lane DNS resolution failed. Running RLS checks from the fallback database would not prove the Packet 31 target state.

Required next step:

- Run the C1 audit from a VNet-connected runner or bastion host with private DNS resolution for `pg-abarva-context-lab-001.postgres.database.azure.com`.

## Fact-Fingerprint Sampling

Not completed in this local C1 run.

Reason: canonical Azure private-lane query was unreachable. The fallback counts alone do not prove chunk-to-source provenance or embedding status.

Required next step:

- Sample 10 chunks per tenant from Azure `enterprise_context_chunks`.
- Verify each chunk has segment, source artifact, tenant ID, and evidence/provenance metadata.
- Verify embeddings are present and non-null for each sampled chunk.

## C1 Closure Status

| C1 requirement | Status | Evidence |
|---|---|---|
| Query each tenant's row count per segment in Azure | Blocked | Azure host DNS `ENOTFOUND` locally. |
| Query embedding completeness | Blocked | Azure host unreachable locally. |
| Sample 10 chunks per tenant | Blocked | Azure host unreachable locally. |
| Verify RLS isolation | Blocked | Must run from private-lane environment. |
| Produce C1 report | Complete | This file. |

## Post-Packet-30 E2E Closure Protocol

This C1 audit should become the closure event for proving Packet 30 architectural consolidation worked across more than the SkyHarbor demo path. Do not reuse the SkyHarbor/airline Tier-1 question set for Apex or other tenants; each tenant needs a vertical-shaped coverage contract.

### Level Definitions

| Level | Scope | Purpose | Confidence |
|---|---|---|---|
| Level 1 targeted smoke | 3-5 authenticated known-good questions, source payload inspection, citation chains, no tenant bleed | Confirm a tenant is not obviously broken | Low-to-medium |
| Level 2 Tier-1 verifier | 25 tenant-specific questions for one persona, captured artifacts, pass threshold `>=18/25` | Prove the architecture reaches that tenant's data | High, bounded by substrate quality |
| Level 3 multi-tenant stress | Multi-persona verifier, cross-tenant prompt-injection stress, concurrent load, substrate health audit, and freeze/deprecate recommendations | Prove multi-tenant production-grade behavior | Very high |

### Execution Order After Packet 30 Phase 7

1. Apex Retail first.
   - Author an Apex-specific retail Tier-1 question set as the first step.
   - Question categories should reflect retail reality: application portfolio, SAP/ERP dependencies, Commerce Cloud, CDP/data platform, loyalty, AMS/vendor contracts, store tech, AI initiatives, integration topology, value pressure, sourcing, and Control Tower visibility.
   - Do not include SkyHarbor-only IBM/mainframe/airline categories.
   - Founder review/edit before the first full verifier run.
   - Run all Apex personas available in the roster, including CIO/CDO-style users where present.
   - Cross-tenant isolation stress: Apex vs SkyHarbor in both directions.
   - Concurrent load: at least 20 requests across Apex + SkyHarbor personas.
   - Produce `verification/APEX_E2E_VERIFICATION_REPORT.html`.
   - Pass criteria: `>=18/25` per persona, zero cross-tenant leakage, zero 5xx under load.

2. Meridian Health second.
   - Same protocol with a healthcare-provider question set, not Apex retail or SkyHarbor airline questions.
   - Produce `verification/MERIDIAN_E2E_VERIFICATION_REPORT.html`.
   - Same pass criteria.

3. First Capital and Northstar third.
   - Audit-only initially.
   - If substrate health is sufficient, run the full verifier.
   - If substrate health is stale or incomplete, recommend Freeze or Deprecate per Packet 31 tenant lifecycle guidance.

### Investor / Customer Signal

Passing Apex and Meridian Level 3 gives a defensible claim that AbarVa is not SkyHarbor-shaped luck: it runs multiple tenants across multiple verticals with tenant isolation, source-grounded answers, and a verifier that catches regressions before production.

## Recommendation

Do not use this local audit as a final C1 pass. Treat it as the Phase A start report and private-lane access blocker.

Next action:

1. Run a VNet-connected C1 audit script from Azure Bastion, ACI, or a GitHub runner with private DNS.
2. Record canonical Azure counts, embedding status, RLS checks, and sampled fact fingerprints into this report.
3. After Packet 30 Phase 7, run the Post-Packet-30 E2E closure protocol above, starting with Apex Retail.
4. Only then mark C1 complete.
