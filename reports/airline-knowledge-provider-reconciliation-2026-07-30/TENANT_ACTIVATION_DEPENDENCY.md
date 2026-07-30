# `airline-demo-new` tenant activation — dependency record

**No action taken.** This is a record of what I found by reading code and committed evidence, for
whoever picks up the next gate. I did not register the tenant, bypass any guard, hardcode access,
modify auth/middleware, or route production UI to fixture data.

## The finding is more nuanced than "not activated" — there are two separate tenant registries in play

1. **`CANONICAL_TENANT_KEYS`** (`src/config/tenants/CANONICAL_TENANTS.ts`) — the long-standing,
   broadly-consumed synthetic demo tenant list (`meridian-health`, `apex-retail`, `first-capital`,
   `skyharbor-air`, `lakeshore-holdings`, `northstar-clinical`). **Confirmed: `airline-demo-new` is
   absent.** The airline entry in this list is a _different_ tenant, `skyharbor-air` ("Airline Demo",
   Delta-shaped). This is the registry most of the app's older tenant-gating code checks.
2. **`FOUNDATION_TENANT_KEYS`** (`src/lib/tenant/foundation-tenants.ts`) — a newer, narrower allowlist
   specifically for the governed Knowledge Baseline architecture. **Confirmed: `airline-demo-new` IS
   here** (alongside `healthcare-demo-new`).
3. **`datasets/tenant-inputs/tenant-input-registry.json`** — the AGENTS.md-mandated canonical identity
   source ("Tenancy comes from `datasets/tenant-inputs/tenant-input-registry.json`"). **Confirmed:
   `airline-demo-new` is absent here too** (`grep -n "airline-demo-new"` returns nothing).

## And, separately: there is a real, already-activated governed Knowledge Baseline for it

`clients/airline-demo-new/21-processing-wave-execution/08-foundation-closure/` contains exactly one
foundation-closure record as of this PR (`foundation-closure-authority-record-20260729.json` /
`.md`, dated 2026-07-29T07:55:00.000Z — used as "the most recent" per the task brief's instruction,
since it is the only one present):

- Active baseline: `airline-demo-new-source-corpus-v1.0.0:knowledge-baseline-v1`, `active: true`
- Baseline content hash: `135d860b9b104b2a2891fd108ea57286dc28bc057327498c63934c6552425549`
- Real row counts already built: `enterprise_brief_v1: 1`, `enterprise_identity_v1: 1`,
  `domain_summary_v1: 10`, `application_inventory_v1: 1,405`, `technology_estate_v1: 1,405`,
  `data_product_inventory_v1: 6,580`, `vendor_contract_inventory_v1: 420`, `search_document_v1:
37,000`, `relationship_node_v1: 34,534`, `relationship_edge_v1: 16,605`,
  `relationship_evidence_v1: 16,605` — and, notably, `metric_catalog_v1: 0` and `evidence_gap_v1: 0`.
- `reports/airline-all-module-data-plane-certification-2026-07-29.md` (present on `main`) confirms
  Home/Knowledge specifically is `90% migrated_and_proven`, "Home / Knowledge... Required and
  live-proven" via a gated admin-canary HTTP path.
- That path is real code, not aspirational: `src/app/api/knowledge/consumption/_shared.ts` defines
  `ADMIN_HTTP_CANARY_TENANTS = new Set(["airline-demo-new", "healthcare-demo-new"])`, gated behind
  `isPlatformAdminSession() || isFoundationPreviewOperatorSession() ||
isFoundationPreviewTenantSession(tenantKey)` — **not** "any signed-in session" (this repo has been
  burned by that exact gap before, per `feedback_auth_vs_authz_internal_routes` — this code correctly
  avoids it).
- `src/app/(maestro)/knowledge-preview/page.tsx` exists and is the signed-in preview surface this
  canary path serves.

Recent commit history right before this PR's base SHA (`#5756` "Fence governed Source synthesis",
`#5757` "Fence governed Tower commercial fixture", `#5758` "Fence governed Source pricing fixture",
all same day) shows this is an **active, in-flight parallel workstream** systematically activating
`airline-demo-new` module by module — not a stale or abandoned registration.

## Classification (per the task's four options)

**This is a preview-only tenant contract limitation, actively owned by another current (data-plane)
workstream — not a stale registry defect, and not simply "pending."**

- It is not a _stale registry defect_: `FOUNDATION_TENANT_KEYS`, the admin-canary allowlist, and the
  foundation-closure record are all internally consistent and recently touched together.
- It is not _simply pending with no path_: there is a real, working (per the certification report)
  HTTP path today, gated correctly, for platform-admins and foundation-preview sessions.
- It _is_ a deliberate, narrower contract than full `CANONICAL_TENANT_KEYS` membership: the "Next
  Allowed Gates" list in the foundation-closure record itself is explicit that the remaining work is
  "product consumption proof and identity mapping," including `clerk-tenant-identity-mapping`,
  `tenant-user-baseline-proof`, and `home-knowledge-no-fixture-proof` — i.e., the _next_ real gates,
  not full `CANONICAL_TENANT_KEYS` promotion, are what an ordinary signed-in tenant user needs before
  `airline-demo-new` behaves like `skyharbor-air`/`meridian-health` do for their own tenant users.
- It _is_ owned by another current workstream: the certification report's Module Certification Matrix
  shows 7 other modules (Intelligence, Moves, Source, Tower, Admin/Platform, Cube, Superset,
  Observable) at 20–70% with named next actions, all part of the same "Airline All-Module Data-Plane
  Certification" effort. This is squarely the data-plane/Codex lane per this repo's own
  `feedback_knowledge_lane_boundary` convention (Claude = UI, Codex/foundation = data-plane), and this
  PR (A) is explicitly UI/provider-reconciliation scope.

## Exact minimal change that would be required later (recorded, not made)

To let an ordinary signed-in `airline-demo-new` tenant user reach the real HTTP provider (not the
admin canary), the foundation-closure record's own "Next Allowed Gates" already names the sequence:

1. `clerk-tenant-identity-mapping` — map a Clerk org/session to `airline-demo-new` the same way other
   tenants are mapped (out of scope for Claude/UI lane; this is an identity/data-plane change).
2. `tenant-user-baseline-proof` — prove a non-admin, tenant-scoped session reaches the same baseline
   the admin canary already does.
3. Only after both of those: consider whether `airline-demo-new` should also join
   `CANONICAL_TENANT_KEYS` (broadening it beyond the foundation-tenant-specific gates), which is a
   separate, larger decision with its own blast radius across the rest of the app (every other feature
   that gates on `CANONICAL_TENANT_KEYS` membership) — not something to bundle into a Clerk mapping
   change.

None of this is mine to do in PR A. The assembler this PR builds is written against the real
`ConsumptionRuntime`/`KnowledgeConsumptionProvider` interface regardless of which concrete tenant
registry eventually authorizes a given caller — it does not special-case `airline-demo-new`'s
activation state, and it does not import or reference `FOUNDATION_TENANT_KEYS`,
`ADMIN_HTTP_CANARY_TENANTS`, or any auth/session code.

## A related, smaller finding worth flagging alongside this (not tenant-activation, but adjacent)

Two projections the foundation-closure record shows real rows for —
`consumption.technology_estate_v1` (1,405 rows) and `consumption.data_product_inventory_v1` (6,580
rows) — are **not** in `CONSUMPTION_PROJECTION_REGISTRY.json`'s 14 names, **not** in
`consumption-contracts/core.ts`'s `ProjectionName` union, and **not** read by
`consumption-server/reader.ts`'s `exploreEntities`. The data-plane build is already producing more
than the TS contract currently declares. This is a contract/registry-drift item for the data-plane
lane to reconcile (add the two projection names + a reader path), not something this PR fixes — see
the reconciliation matrix's `listDataProducts`/`listInfrastructure` rows and `RISK_ASSESSMENT.md`.
