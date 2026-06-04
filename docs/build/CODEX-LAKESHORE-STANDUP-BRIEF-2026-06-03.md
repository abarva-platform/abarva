# Codex Brief — Stand up Lakeshore Holdings (private data plane + tenant + synthetic context corpus)

**Owner:** Anand · **Date:** 2026-06-03 · **Mode:** multi-agent, parallel where independent.
**Goal:** stand up **Lakeshore Holdings** — a fictional analog of Morgan Street Holdings (Chicago
private holdco / HAVI Group) — as a **real, isolated per-client data plane**, wire the control plane
to it, and build its **entire context layer through the Data Loads module** from **synthetic, real-
world-shaped data**. This doubles as the pilot deployment rehearsal (Wave 8 + Private Data Plane gate
T341–T352).

**Companion docs (read first):** `LAKESHORE_HOLDINGS_TENANT_SETUP_PLAN_2026-06-03.md` (the loader-
first plan), `RETAIL_CFO_FINANCE_AI_PATTERN_PACK_2026-06-03.md`, `KYRIBA_ROLLOUT_SUCCESS_PLAYBOOK_
2026-06-03.md`.

**Hard constraints / guardrails**
- **No new Azure subscription.** Stand the data plane up as a **dedicated Postgres flexible server +
  Key Vault + managed identity in a NEW resource group inside the EXISTING subscription.** (Document
  the customer-owned-subscription variant as the production path.) Keep Founders Hub credits intact —
  everything under the existing billing account.
- **No connection strings in app env.** Control plane → data plane via **managed identity + Key Vault
  secret**, resolved per tenant at runtime. Defense in depth: separate server/DB **and** RLS.
- **Synthetic data only, clearly labeled "SYNTHETIC / ILLUSTRATIVE."** No real Morgan Street/HAVI/
  tms/Stanley operational data under any real name.
- Broker boundary respected; no prod DB mutation outside `db:migrate`/`db:seed` runners; typecheck-
  clean commits; release records + `release:check`.
- Account/credential steps (Clerk org, portal sign-ins) are **human steps** — Codex prepares scripts/
  instructions; Anand executes them.
- **Automate the data loads** via the upload API (not manual clicking) — **and fix any loader bugs
  encountered along the way** (this hardening is a primary goal, not a side effect).
- **Author synthetic data INTO the prebuilt templates** (the context-ingestion template registry +
  enterprise-context workbooks) — not ad-hoc files — so loads exercise the real template path.
- **Produce reviewable artifacts for Surekha**: the exact files/datasets loaded, exported and
  collected (e.g. `docs/build/lakeshore/loaded/`) so she can see precisely what was ingested.
- **Breadth + depth must be very rich** — load EVERY dimension below; do not skip any. Reuse the
  existing pattern genome (don't rebuild 10k patterns from scratch).

---

## THE LAKESHORE DESIGN (real-world-shaped — align before authoring data)

**Holdco — Lakeshore Holdings** (Chicago private investment group): ~**$3.0B revenue**, **~10,000
employees**, **50+ countries**, 3 operating companies; PE-style (acquires ≥$25M EBITDA businesses).
Shared services: Finance/Treasury (**rolling out Kyriba**), IT, HR, Procurement. Leadership incl. a
**VP Innovation/Delivery** (the buyer persona).

| Operating company | Analog | ~Revenue / employees | Core systems (legacy estate) | AI use-case flavor |
|---|---|---|---|---|
| **Northline Supply Chain** | HAVI Supply Chain | ~$1.5B / 6,000 / 30 ctry | ERP (SAP), WMS, TMS, demand planning, EDI, control tower, DW + Tableau | Supply-chain visibility, demand forecasting, freight + warehouse-labor optimization |
| **Brightmark Marketing Services** | tms | ~$0.7B / 2,500 / 20 ctry | Marketing/campaign platforms, sourcing/procurement, DAM, loyalty, PIM | Creative/content ops, sourcing optimization, campaign + promotion ROI |
| **Forge & Field** | Stanley (consumer/DTC) | ~$0.8B / 1,500 | E-commerce (SFCC/Shopify), ERP, PIM, OMS, CDP, 3PL | Demand forecasting (viral swings), inventory/markdown, personalization, CX |

**Finance/treasury narrative (the Kyriba spine):** multi-entity cash across 3 opcos + 50 countries →
the reason they buy Kyriba (multi-entity liquidity, FX across many currencies, working capital with
big DTC inventory swings at Forge & Field). The **Kyriba rollout is a program** with an SI
implementation partner, a business case, and gates — and the VP runs it as a governed Move with the
success-platform scorecard.

**Context-layer scale target (mimic a real client; ~Apex-class):** ~**450–600 records / ~250 nodes /
~275 edges / ~450 context chunks** across the 10 segments below.

| # | Segment | Synthetic rows (holdco + 3 opcos) | ~count |
|---|---|---|---|
| 1 | enterprise_profile | Holdco + 3 opcos: revenue, EBITDA, employees, geos, sectors, ownership | 4–8 |
| 2 | org_structure | Holdco CXOs (incl. VP Innovation/Delivery) + opco leadership + decision rights | 30–50 |
| 3 | it_landscape | Per-opco systems incl. **Kyriba**, ERP, WMS/TMS, ecommerce, marketing | 80–150 |
| 4 | it_financials | IT/finance spend by opco + category | 50–100 |
| 5 | vendor_contracts | **Kyriba** + the **SI implementation partner** + key vendors (renewal, spend) | 40–80 |
| 6 | program_inventory | **Kyriba rollout** + AI-initiative portfolio across opcos | 15–30 |
| 7 | kpi_dictionary | Treasury KPIs (CCC/DSO/DPO/DIO, forecast accuracy) + opco KPIs | 40–60 |
| 8 | sourcing_artifacts | Brightmark sourcing + any RFP/BAFO | 10–20 |
| 9 | compliance | PCI (Forge&Field DTC), SOX, GDPR, data privacy | 20–30 |
| 10 | industry_context | Supply-chain / consumer-DTC / marketing-sourcing + finance/CFO patterns | 20–40 |

> **Align here:** confirm the scale numbers, opco names/sizes, and the Kyriba narrative before Codex
> authors the data. Everything below assumes this design.

### Org model (rich — load this)
- **Global CIO** (holdco) — owns enterprise standards, the AI/delivery agenda.
- **Per-opco CIO** at Northline, Brightmark, Forge & Field — local autonomy vs global standards
  (the holdco IT-governance tension — make it real in decision-rights data).
- **CFO / Treasury** (holdco) — the **Kyriba sponsor**.
- **Surekha — VP Innovation/Delivery — reports to the GLOBAL CIO** (not finance). Her remit is
  **cross-portfolio**: all 3 opcos' IT + the AI/delivery agenda; she *supports* finance's Kyriba
  rollout but owns the broader program. This is the buyer persona.

### Complete dimension map (~50+ — load ALL; nothing skipped)
- **Enterprise & org:** holdco + 3 opco profiles; org + decision-rights (global CIO, 3 opco CIOs,
  CFO/treasury, Surekha); business capability map; operating model; **M&A / integration backlog**
  (PE holdco acquires constantly → un-integrated systems).
- **IT / CMDB:** application portfolio per opco (owner, lifecycle, criticality, stack, hosting);
  infrastructure (DC, cloud Azure/AWS/GCP, network, compute, storage); integration landscape (APIs,
  EDI, middleware, data flows); **data estate** (DWs, lakes, BI — modernization hook); end-user
  computing / shadow IT; **enterprise-architecture standards**.
- **Security / risk / compliance:** IAM, security posture, vulnerabilities, **incident history**;
  risk register; PCI (Forge&Field DTC), SOX, GDPR, data privacy; ESG/sustainability.
- **IT financials:** spend by opco/category, run-vs-change, license/SaaS, **FinOps/cloud cost**.
- **Vendor / sourcing:** vendor contracts (software, SI, cloud, telco) + **rate cards** + renewal/
  spend + the **Kyriba + SI implementation-partner** contracts; sourcing/RFP artifacts.
- **Programs / initiatives:** AI-initiative portfolio; **Kyriba rollout**; **modernization program**;
  **technical-debt backlog**.
- **KPIs / telemetry:** IT KPIs; **ITSM / SLAs / service management**; business KPIs; treasury KPIs
  (CCC/DSO/DPO/DIO/forecast accuracy).
- **Finance / treasury:** multi-entity cash/liquidity, FX (50 countries), working capital (DTC
  swings), the Kyriba value scorecard; **value-realization baselines**.
- **Data governance:** ownership, quality, MDM, data products (AI prerequisite).
- **Skills / workforce:** AI-talent gaps, build-vs-buy delivery (ties to rate cards).
- **Per-opco:** Northline (supply chain/logistics/warehouse/freight); Brightmark (marketing/
  promotions/loyalty/sourcing); Forge & Field (e-commerce/DTC/CDP/inventory/markdown).

### Corpus reuse strategy (do NOT build 10k patterns from scratch)
- **Tenant estate (above) = authored fresh** for Lakeshore.
- **Pattern corpus = reuse + curate + targeted-extend:**
  - **Direct reuse:** Finance/CFO + Kyriba success packs; pricing/vendor rate cards; modernization
    playbook (cross-industry).
  - **Curate from existing genome:** SkyHarbor airline overlay (~180 packs / 50+ categories) →
    transferable supply-chain/fuel/logistics/sourcing/finance/HR/cyber/data-AI-eng; Apex retail →
    Forge & Field (consumer/DTC) + Northline demand planning; First Capital → treasury/finance.
  - **Author net-new only for true gaps:** F&B supply-chain logistics, marketing-services/
    promotions, consumer-DTC drinkware.

---

## PHASE A — Private data plane (cheap-but-honest rehearsal)
1. **Bicep IaC** (in `infra/` or equivalent) for a NEW resource group in the existing subscription:
   - Azure Database for **PostgreSQL Flexible Server** (Burstable B1ms/B2s; ~$15–30/mo), pgvector
     enabled.
   - **Key Vault** (store the data-plane connection secret).
   - **User-assigned managed identity** for the control plane to read the KV secret + connect to
     Postgres (Entra auth).
   - Document (don't necessarily build) **Private Link/VNet** as the production hardening step, and
     the **customer-owned-subscription** variant.
2. Reproducible: `az deployment` script + teardown script. Acceptance: stand up/tear down in <30 min.

## PHASE B — Connectivity + client wiring
3. **Per-tenant connection routing** — a registry resolving `tenant → data-plane connection`
   (KV secret name) via managed identity; no `DATABASE_URL` per client in app env.
4. Register `lakeshore` in `src/lib/client-config.ts` (`ALL_CLIENTS` + `CLIENT_KEY_TO_DB_NAME` +
   `CLIENT_KEY_TO_INDUSTRY_CODE` + `EMAIL_DOMAIN_TO_CLIENT_KEY`) + broker key `lakeshore-holdings`
   (`canonicalTenantKey`/`clientKeyToInventorySubstrateKey`). Industry code `DIVERSIFIED`.
5. Run the `data_inventory_*` schema migrations on the new server; insert the `clients` row via the
   runner; RLS scoped to the new `client_id`.
6. **Clerk org + Lakeshore admin user** — Codex prepares the steps; **Anand executes** (creds).
- Acceptance: sign in as Lakeshore admin → `/admin/setup` shows "Load data for Lakeshore Holdings"
  with an honest empty state, reading from the **new isolated server**.

## PHASE C — Synthetic context templates (the full dimension map, real-world-rich)
> **Follow `LAKESHORE_SYNTHETIC_DATA_GENERATION_SPEC_2026-06-03.md`** — the detailed per-dimension
> generation instructions (fields, volume targets, internal-consistency rules) + the **document
> generation** (contract PDFs, policies, reports). Top-notch corpus = every dimension to volume +
> documents ingested as searchable corpus.
7. Author synthetic data **into the prebuilt templates** (context-ingestion template registry +
   enterprise-context workbooks), mapped to the `csv-upload-connector.ts` schema, labeled SYNTHETIC.
   Cover the **complete ~50+ dimension map above** (CMDB / app portfolio per opco, infra, integration,
   data estate, security, risk, compliance, IT financials/FinOps, vendor contracts + rate cards,
   programs incl. Kyriba rollout + modernization, KPIs/ITSM, finance/treasury, data governance,
   skills, M&A/integration backlog, per-opco specifics). Rich breadth + depth; nothing skipped.
   Reflect the **org model** (global CIO + 3 opco CIOs + CFO/treasury + Surekha under global CIO).
8. **Collect reviewable artifacts** under `docs/build/lakeshore/loaded/` — the exact datasets loaded,
   exported so Surekha can review precisely what was ingested.

## PHASE D — Load through the module (AUTOMATED) + build the context layer
9. **Automate the loads** via the upload API for every segment: sensitive-data guard → parse →
   schema-map → **persist context chunks** → approve/commit. Run the **embeddings worker**
   (`src/lib/corpus/embedding.ts`). **Fix any loader bugs encountered** (parsing, mapping, commit,
   embeddings) — capture each fix as a PR; hardening the loader is a primary deliverable.
10. **Prove the control:** load one row with fake PHI/PII → confirm **quarantine**.
11. Verify `/admin/data-trust` shows every dimension populating (record counts, coverage, last-loaded
    — the real snapshot the redesigned Setup page reads). Target the scale above.

## PHASE E — Corpus (reuse + curate + targeted-extend; do NOT rebuild from scratch)
12. Attach per the **Corpus reuse strategy** above: direct-reuse the Finance/CFO + Kyriba success +
    rate-card + modernization packs; **curate** the SkyHarbor/Apex/First-Capital genome into the 3
    opcos; **author net-new only** for F&B supply-chain, marketing-services, consumer-DTC gaps.

## PHASE F — Verify (the proof + the runbook)
12. Sign in as Lakeshore CXO → **Intelligence** (grounded answer), **Moves** (Kyriba rollout as a
    Move + business case + success scorecard), **Source** (sourcing/RFP), **Tower** (3-opco
    portfolio).
13. **Tenant isolation** — Lakeshore sees only its data; no Apex/Meridian bleed. Capability-grounding
    lights up.
14. **Deliver the runbook**: "stand up a new client data plane + load corpus in <2 hours" (Wave 8
    acceptance) — the repeatable deployment rehearsal for PHS/Delta/Morgan Street.

## PHASE G — Per-template How-To pages (registry-driven) + metadata-driven future
16. **Every template gets a How-To page** so a business user knows exactly how to fill it. Render it
    **from the template-registry metadata** (single source of truth — `acceptedFormats`,
    `requiredFields`, `optionalFields`, `ownerRole`) so it never drifts from the real loader and never
    overclaims. Each How-To shows:
    - which dimension/segment it feeds + what it unlocks (agent capability/grounding);
    - **accepted formats**, honestly labeled (CSV live; XLSX/JSON controlled; PDF/DOCX evidence);
    - a **column metadata table** — column name · type · required/optional · description · example ·
      validation rule;
    - a **downloadable blank template + a filled sample**;
    - the sensitive-data rule (no PHI/PII → quarantine).
    Surface at the template area (e.g. `/admin/context-layer/templates/[id]`) and link from each
    Data Loads row. For Lakeshore, every synthetic template authored ships with its How-To.
17. **Metadata-driven "load any file" (future track, design the foundation now):** let a user upload
    an arbitrary file **plus metadata** (their columns → template columns, or a described schema) and
    have the loader map + ingest it. Build on the existing `inferCsvSchemaMapping` /
    `parseFieldMappings` seam. Scope as **post-pilot**, but the How-To + registry metadata above are
    the foundation — so design them to double as the mapping contract.

## PHASE H — Loader-hardening track (parallel; the truthful-formats follow-through)
Sequenced after PR #2977's honest UX:
18. **XLSX parser + preview-before-commit** for the tabular dimensions (financials, org roles,
    application portfolio, vendor contracts) — promote XLSX from "controlled intake" to live.
19. **Document parsing (Azure Document Intelligence) — IN SCOPE (required for top-notch corpus).**
    PDF/DOCX/PPTX → structured facts + context chunks + evidence ledger with page-level provenance.
    Required because the corpus must include the generated **contract PDFs, policies, and annual/
    quarterly reports** (per the generation spec) — not just tabular metadata. New capability, build
    it; don't fake it.
20. **Fix loader bugs** found during the automated Lakeshore loads (Phase D) — each as a PR; loader
    hardening is a primary outcome of this whole exercise.

## Suggested agent split (parallel)
`infra-bicep-dataplane` · `client-wiring+routing` (Phase A/B) ‖ `synthetic-data-authoring` (Phase C,
per-segment agents) → then `load+embeddings+verify` (Phase D–F) sequentially. Integrate + release
record last.

## Outputs
Isolated Lakeshore data plane (IaC + teardown); control-plane routing via KV/managed identity;
`lakeshore` tenant wired + RLS; 10 synthetic segment files; context layer built through the loader
(embedded, Data Trust populated); corpus packs attached; 4 surfaces grounded; isolation verified;
the deployment runbook. Release record + `release:check`.
