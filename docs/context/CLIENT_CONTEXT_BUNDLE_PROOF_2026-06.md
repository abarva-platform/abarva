# Context Bundle Proof (Phase 9)

_Live retrieve→ground→cite→answer on the DEPLOYED fixed image (cutover-ctxretrieval-7975a54a1), via ACA/VNet
operator job `...-uo8edvw` (Succeeded), real `askIntelligence` pipeline with Anthropic synthesis + OpenAI
embeddings + private Postgres. 2026-06-10._

## Result: CONTEXT_BUNDLE_PROVEN for all three clients

| Client | tenant_id | Grounding | Sources | Buckets | Leakage | Coverage |
|---|---|---|---|---|---|---|
| Meridian Health | 6e419b6e… | **grounded** | 7 | **TENANT** | no_leak | partial (missing it_landscape) |
| Lakeshore Holdings | 49fc8aee… | **grounded** | 3 | **TENANT** | no_leak | full |
| Apex Retail | c7578e7a… | **grounded** | 3 | **TENANT** | no_leak | full |

### Real grounded answers (from each tenant's own loaded facts)
- **Meridian Health** — _"Your most critical applications are your Epic stack and imaging infrastructure.
  Epic Hyperspace leads at $13M annual run cost, followed by Sectra PACS at $6.5M and Epic Hyperdrive at
  $6.1M — all tier-1, on-prem. Workday Financials ($6M) and Citrix Cloud ($5.6M)…"_
  Citations (TENANT): Structured application portfolio · Structured vendor contracts · Loaded context chunks ·
  cmdb_applications_services · vendors_contract_inventory · renewal_calendar — all `(meridian-health)`.
- **Lakeshore Holdings** — _"core business capabilities … cluster around financial management and treasury
  (SAP S/4HANA and Kyriba), workforce and HR (Workday HCM), and procurement and sourcing (Coupa)…"_
  Citations (TENANT): Loaded context chunks · Org structure and leadership · IT landscape — `(lakeshore-holdings)`.
- **Apex Retail** — _"highest annual run costs … APX-STERLING-OMS (legacy Java OMS, $7.7M/yr, migrate — 40%
  already rerouted to the modern order orchestrator via strangler pattern), APX-NODE-MARKET ($6.69M), …"_
  Citations (TENANT): Loaded context chunks · IT financials and funding authority · IT landscape — `(apex-retail)`.

## Governed-chain assertions (per the spec)
- **model_call_allowed**: true (real Anthropic synthesis, ~1.2–1.5k-char advisor answers).
- **grounding_status**: grounded for all 3 (TENANT-class sources, not generic corpus patterns).
- **tenant_leakage_status**: no_leak — each answer's sources are the queried tenant ONLY; no cross-tenant bleed.
- **citations_emitted**: tenant-scoped, labeled by segment + canonical tenant key.
- **missing-evidence honesty**: Meridian flagged `missing_segments: [it_landscape]`; non-fabrication intact.

## Important finding — it was the call contract, not the data
Two earlier passes returned (a) the "synthesis not configured" stub and (b) cross-industry corpus PATTERNS with
0 tenant sources. Root cause was **the harness omitting required `askIntelligence` options**, not a product or
data defect:
1. `synthesizer.ts`/`classifier.ts` bail when **`opts.tenantId`** is missing → stub answer + unscoped pattern noise.
2. `retrieveTenantEnterpriseSources` reads **`opts.tenant ?? opts.tenantInventoryKey`** (NOT `tenantClientKey`)
   → without it, returns `[]` → 0 tenant sources.
With `{ tenant, tenantId, tenantClientKey, tenantInventoryKey, userId }` all supplied, the full governed chain
retrieves the tenant's facts, grounds, cites, and refuses to fabricate. **Production verified sound:** the live
call site `src/app/api/intelligence/ask/route.ts` resolves all of these via `resolveTenant(session)` and passes
`tenantId`, `tenantClientKey`, `tenant`, and `tenantInventoryKey` to `askIntelligence` (lines 195–205). So
signed-in users get the grounded, tenant-correct, cited behavior proven here — the ungrounding was a harness
omission only, not a runtime defect. (Operational note: any FUTURE programmatic caller of `askIntelligence`
must thread the same four tenant fields; `tenantClientKey` alone silently ungrounds.)

## Status vs "ready"
This satisfies the **CONTEXT_BUNDLE_PROVEN** bar (real retrieve→ground→cite→answer, tenant-correct, isolated,
non-fabricating) for Meridian, Lakeshore, and Apex. Formal **promotion to `agent_ready`** (Phase 8) is the
separate governance stamping (requires the unbuilt PR-P2 write-path); bundle-proof does not bypass it.

## Harness
`scripts/context/clf-bundle-proof.ts` (committed). Run via the operator job on the fixed web image with the
server-only preload + Anthropic/OpenAI keys; tenant_id resolved from `clients` by tenant_key/slug.
