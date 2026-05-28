# Architectural Consolidation Audit

Date: 2026-05-28
Packet: Packet 30 Phase 0
Status: Audit-only, no runtime changes

## 1. Executive Summary

Packet 30's diagnosis is confirmed. Tenant resolution and context retrieval are not yet a single pipeline:

- There is no `src/lib/tenant/**` module today.
- The closest existing tenant modules are `src/lib/active-client.ts`, `src/lib/tenant-keys.ts`, `src/lib/client-config.ts`, and scattered tenant-specific helpers.
- Alias maps exist in multiple runtime places, including `src/lib/tenant-keys.ts`, `src/lib/active-client.ts`, `src/lib/azure-search/tenant-context-retriever.ts`, `src/lib/azure-search/tenant-context-backfill.ts`, `src/lib/knowledge/tenant-enterprise-context.ts`, `src/lib/intelligence/ask/tenant-fact-fingerprint.ts`, `src/lib/setup/ai-initiatives.ts`, and feature-flag helpers.
- Runtime code still imports or dynamically loads Supabase compatibility helpers in `src/app/**` and `src/lib/**`.
- The Intelligence ask route resolves tenant ID, client key, tenant inventory key, and Sentinel client ID separately, with fallback behavior in the route rather than a canonical resolver.
- Retrieval functions still take string tenant keys, not a `CanonicalTenant`.
- The current verifier exists in two paths (`scripts/skyharbor/07_verify/ground_truth_runner.mjs` and `scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs`) and is not yet the Packet 30 target architecture.

## 2. `src/lib/tenant/**` Inventory

Command:

```bash
find src/lib/tenant src/lib/tenants -maxdepth 3 -type f -print 2>/dev/null | sort
```

Result:

```text
src/lib/tenants/demo-tenant-data-tiers.ts
```

Observation: the target `src/lib/tenant/resolveTenant.ts`, `CanonicalTenant.ts`, and `aliases.ts` do not exist. The current code has tenant resolution split across adjacent modules.

## 3. Current Tenant Resolution Modules

### `src/lib/active-client.ts`

Exports observed:

- `ACTIVE_CLIENT_COOKIE`
- `getActiveClientKey(requestedClientId?: string | null)`
- `hasLockedTenantSession()`
- `getActiveClientRow(requestedClientId?: string | null)`

Findings:

- Uses Clerk `currentUser()`, cookies, role inference, email inference, `client-config`, and Supabase compatibility reads.
- Maintains `CLIENT_KEY_TO_DB_SLUGS` locally.
- Has SkyHarbor-specific alias support (`skyharbor`, `skyharbor-air`) that is not present in `src/lib/tenant-keys.ts`.
- Returns `ClientKey`, not `CanonicalTenant`.

### `src/lib/tenant-keys.ts`

Exports observed:

- `TENANT_KEY_ALIASES`
- `canonicalTenantKey()`
- `isLegacyTenantAlias()`
- `LEGACY_TENANT_ALIASES`
- `CANONICAL_TENANT_KEYS`

Findings:

- Canonicalizes only historical aliases:
  - `apexretail` -> `apex-retail`
  - `meridian` -> `meridian-health`
  - `arcturus` -> `first-capital`
- Does not include Northstar or SkyHarbor aliases.
- Is described as the single source of truth, but several other runtime modules maintain their own alias maps.

### `src/lib/client-config.ts`

Findings:

- Owns `ClientKey`, display-name canonicalization, and email/client inference.
- Used by `active-client.ts`, route logic, and feature flags.
- Overlaps with the intended Packet 31 tenant-config ownership model.

## 4. Alias Map / Lookup Table Inventory

Command:

```bash
rg -n "TENANT_ALIASES|TENANT_KEY_ALIASES|LEGACY_TENANT_ALIASES|CLIENT_KEY_ALIASES|alias" src/lib src/app scripts --glob '!node_modules'
```

High-risk runtime alias maps:

| File | Alias concern |
|---|---|
| `src/lib/tenant-keys.ts` | Historical canonical map, missing SkyHarbor/Northstar. |
| `src/lib/active-client.ts` | `CLIENT_KEY_TO_DB_SLUGS` overlaps canonical tenant resolution. |
| `src/lib/azure-search/tenant-context-retriever.ts` | Local `TENANT_KEY_ALIASES`. |
| `src/lib/azure-search/tenant-context-backfill.ts` | Local `TENANT_KEY_ALIASES`. |
| `src/lib/knowledge/tenant-enterprise-context.ts` | Local multi-value `TENANT_KEY_ALIASES`, includes SkyHarbor. |
| `src/lib/intelligence/ask/tenant-fact-fingerprint.ts` | Local `TENANT_KEY_ALIASES`, used for fact fingerprint lookup. |
| `src/lib/setup/ai-initiatives.ts` | Local `TENANT_ALIASES`. |
| `src/lib/features/is-feature-enabled.ts` | Local env tenant alias map. |
| `scripts/audit/demo-question-readiness.mjs` | Local `TENANT_ALIASES` for verifier/demo readiness. |

Conclusion: Packet 31 invariant I1 is not currently enforceable because aliases and fallback policy are spread across runtime and script code.

## 5. Tenant Key / Client Key Callsite Inventory

Command:

```bash
rg -l "clientKey|tenantKey|client_key|tenant_inventory_key|inventoryKey|TENANT_ALIASES|TENANT_KEY_ALIASES|resolveTenant|getActiveClient|activeClient" src/app src/lib --glob '!**/__tests__/**' | sort
```

Representative high-risk callsite groups:

### Orchestration / app routes

- `src/app/api/intelligence/ask/route.ts`
- `src/app/api/source/synthesis/route.ts`
- `src/app/api/v1/source/events/route.ts`
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`
- `src/app/api/v1/programs/[programId]/nexus/ask/route.ts`
- `src/app/api/programs/*`
- `src/app/api/admin/*`

### Server component tenant reads

- `src/app/(maestro)/home/page.tsx`
- `src/app/(maestro)/admin/page.tsx`
- `src/app/(maestro)/admin/context-layer/page.tsx`
- `src/app/(maestro)/source/*`
- `src/app/(maestro)/tower/*`
- `src/app/(maestro)/strategic-moves/*`
- `src/app/programs/*`

### Domain/retrieval

- `src/lib/knowledge/tenant-enterprise-context.ts`
- `src/lib/knowledge/tenant-technology-context.ts`
- `src/lib/knowledge/agent-context-broker.ts`
- `src/lib/intelligence/ask/index.ts`
- `src/lib/intelligence/ask/tenant-key-resolution.ts`
- `src/lib/intelligence/ask/tenant-fact-fingerprint.ts`
- `src/lib/azure-search/tenant-context-retriever.ts`
- `src/lib/agents/sentinel-reasoning/state-machine.ts`

Full list is large and should be regenerated before Phase 1 with the command above. Phase 1 should start with `src/app/api/intelligence/ask/route.ts`, `src/lib/knowledge/tenant-enterprise-context.ts`, and `src/lib/intelligence/ask/index.ts` because those are the live SkyHarbor failure path.

## 6. Supabase / Data-Plane Runtime Inventory

Command:

```bash
rg -n "supabase|Supabase|createServerSupabase|createServiceRoleClient|createRouteHandlerClient|from\\(" src/app src/lib --glob '!**/__tests__/**'
```

Representative runtime Supabase compatibility paths:

| File | Concern |
|---|---|
| `src/lib/active-client.ts` | `getActiveClientRow()` imports `getServerSupabase()` directly. |
| `src/app/api/onboarding/upload/route.ts` | Runtime route uses onboarding Supabase client. |
| `src/app/api/onboarding/[session]/status/route.ts` | Runtime route reads onboarding state through Supabase compatibility helper. |
| `src/app/api/onboarding/[session]/commit/route.ts` | Runtime route commits onboarding state through Supabase compatibility helper. |
| `src/app/api/notifications/dispatch/route.ts` | Runtime route reads/writes notification delivery through Supabase helper. |
| `src/app/api/admin/users/provision/route.ts` | Runtime admin route uses Supabase helper. |
| `src/lib/pilot-dashboard/aggregates.ts` | Dynamic Supabase reads for pilot dashboard and violation backend. |
| `src/lib/topics/db.ts` | Supabase helper used for engagement topics. |
| `src/lib/billing/stripe.ts` | Supabase helper used for billing/invoice updates. |
| `src/lib/notifications/store.ts` | Supabase notification store adapter remains default. |
| `src/lib/data-plane/write-adapters/*` | Several write adapters default to Supabase. |
| `src/lib/deliverables/generate.ts` | Supabase helper used for engagement/deliverable updates. |
| `src/lib/atlas/tower-grounding.ts` | Supabase helper used for tower grounding. |

Observation: Packet 30 Phase 2 is materially larger than a small import cleanup. The repo has compatibility abstractions, dynamic imports, and write adapters that still default to Supabase. Packet 30 Phase 2 should distinguish read paths from write paths because Packet 31 I2 is about data-plane reads, while several default Supabase paths are write adapters.

## 7. Retrieval / Routing Inventory

Command:

```bash
rg -n "retrieveTenantEnterpriseSources|retrieveTenantTechnologySources|retrieveTenantStructured|buildEnterpriseAgentContextBundle|tenant-enterprise-context|tenant-technology-context|tenant-context-retriever|ground_truth_runner|classifySentinelIntent|runSentinelReasoning" src app scripts
```

Key files:

| File | Role |
|---|---|
| `src/app/api/intelligence/ask/route.ts` | Resolves request tenant context and chooses Sentinel reasoning vs askIntelligence. |
| `src/lib/intelligence/ask/index.ts` | Calls enterprise, structured, technology, worldview, and surface retrievers. |
| `src/lib/knowledge/tenant-enterprise-context.ts` | Main tenant enterprise source + structured facts retriever. |
| `src/lib/knowledge/tenant-technology-context.ts` | Technology context retriever. |
| `src/lib/knowledge/agent-context-broker.ts` | Broker for enterprise context bundles. |
| `src/lib/azure-search/tenant-context-retriever.ts` | Azure search retriever with its own alias map. |
| `src/lib/agents/sentinel-reasoning/intent-classifier.ts` | Sentinel IT-productivity classifier. |
| `src/lib/agents/sentinel-reasoning/state-machine.ts` | Sentinel reasoning state machine. |
| `scripts/skyharbor/07_verify/ground_truth_runner.mjs` | Thin wrapper for staged verifier. |
| `scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs` | Current SkyHarbor ground-truth runner implementation. |

Findings:

- `retrieveTenantEnterpriseSources()` and `retrieveTenantStructuredFacts()` accept `tenantKey: string | null | undefined`, not a `CanonicalTenant`.
- Retrieval currently returns source arrays only, not `{ sources, coverage }`.
- Segment selection is regex-driven inside `tenant-enterprise-context.ts`.
- The ask route separately manages `tenantId`, `tenantInventoryKey`, `tenantClientKey`, and `sentinelClientId`.
- The current coverage behavior is implicit; no `src/lib/knowledge/coverage.ts` exists.

## 8. Current Verifier Inventory

Current paths:

- `scripts/skyharbor/07_verify/ground_truth_runner.mjs`
- `scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs`

Packet 30 target gap remains:

- No dedicated `lib/cookieJar.mjs`.
- No dedicated `lib/clerkSession.mjs`.
- No dedicated `lib/scorer.mjs`.
- Current verifier architecture should be reviewed in Phase 4 and rebuilt rather than patched.

## 9. Mermaid Dependency Graph

See `docs/architecture/CONSOLIDATION_DEPENDENCY_GRAPH.md`.

## 10. Phase 1 Recommendation

Start Phase 1 with a narrow vertical path:

1. Create `src/lib/tenant/CanonicalTenant.ts`, `aliases.ts`, and `resolveTenant.ts`.
2. Move/merge aliases from `tenant-keys.ts`, `active-client.ts`, `tenant-enterprise-context.ts`, `azure-search`, and ask-specific helpers into `src/lib/tenant/aliases.ts`.
3. Refactor `src/app/api/intelligence/ask/route.ts` to call `resolveTenant()` once and pass `CanonicalTenant` through.
4. Refactor `src/lib/intelligence/ask/index.ts`, `src/lib/knowledge/tenant-enterprise-context.ts`, and `src/lib/knowledge/tenant-technology-context.ts` to accept `CanonicalTenant`.
5. Add regression tests for SkyHarbor, Apex, Meridian, Northstar, unknown alias, body/cookie conflict, and locked persona behavior.

Do not attempt to burn all Supabase paths in Phase 1; that belongs to Packet 30 Phase 2 after tenant resolution is canonical.
