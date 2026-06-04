# Lakeshore Holdings — New-Tenant Setup Plan (loader-first, no seed scripts) · 2026-06-03

Stand up **Lakeshore Holdings** — a fictional analog of Morgan Street Holdings (a Chicago private
holdco) — **entirely through the new Data Loads module**, no seed-dataset scripts. This dogfoods the
loader: author synthetic dataset templates → upload/process through the module → watch the context
layer build → layer in the industry/cross-industry corpus.

**All data is synthetic and labeled "ILLUSTRATIVE / SYNTHETIC"** — no real Morgan Street/HAVI/tms/
Stanley operational data is fabricated under the real name (legal-safety, per the naming decision).

## Tenant identity (decisions to lock)
- **Display name:** Lakeshore Holdings
- **App ClientKey:** `lakeshore` · **broker/substrate key:** `lakeshore-holdings` (mirror the
  `apexretail`/`apex-retail` split — avoids the known key-mismatch bug)
- **Industry code:** diversified holdco (e.g. `DIVERSIFIED`)
- **Email domain (demo users):** `lakeshore-holdings.example.com`
- **Structure:** holdco + 3 operating companies — **Northline Supply Chain** (logistics/F&B supply
  chain), **Brightmark Marketing Services** (marketing/promotions/sourcing), **Forge & Field**
  (consumer products / DTC). Modeled inside the corpus (enterprise_profile + org_structure carry the
  opco hierarchy).

---

## Phase 0 — Provision the tenant (code/config + DB + auth) · NOT UI-only
The client registry is code, so this phase is a prerequisite the loader UI can't do.

1. Register `lakeshore` in `src/lib/client-config.ts`: `ALL_CLIENTS` entry + `CLIENT_KEY_TO_DB_NAME`
   + `CLIENT_KEY_TO_INDUSTRY_CODE` + `EMAIL_DOMAIN_TO_CLIENT_KEY` + broker-key mapping
   (`canonicalTenantKey` / `clientKeyToInventorySubstrateKey`).
2. Insert the `clients` row via the **`npm run db:migrate` / `db:seed` runner** (NOT manual prod
   mutation) → yields the `client_id` the `data_inventory_*` tables FK to.
3. Create the Clerk org + a Lakeshore admin user. *(Account creation + passwords are done by you/Codex
   — I can't create accounts or type credentials.)*
4. Confirm RLS scopes to the new `client_id`.
- **Acceptance:** sign in as the Lakeshore admin → `/admin/setup` shows **"Load data for Lakeshore
  Holdings"** with an honest empty state (0 dimensions) — tenant resolves; loader ready + empty.

## Phase 1 — Author the synthetic dataset templates (holdco-shaped, labeled)
For each corpus segment, produce a CSV/workbook populated with synthetic Lakeshore data, mapped to
the connector's expected schema (`csv-upload-connector.ts`). Priority order:

| # | Segment | Synthetic content (holdco + 3 opcos) |
|---|---|---|
| 1 | enterprise_profile | Holdco + Northline/Brightmark/Forge&Field: revenue, EBITDA, employees, geos, sectors |
| 2 | org_structure | Holdco CXOs (incl. the VP Innovation/Delivery) + opco leadership, decision rights |
| 3 | it_landscape | Per-opco systems incl. **Kyriba**, ERP, WMS/TMS (Northline), sourcing/mktg (Brightmark), DTC commerce (Forge&Field) |
| 4 | it_financials | IT/finance spend by opco |
| 5 | vendor_contracts | **Kyriba contract** + the implementation/SI partner + key vendors |
| 6 | program_inventory | **The Kyriba rollout** as a program + the AI-initiative portfolio |
| 7 | kpi_dictionary | Treasury KPIs (DSO/DPO/DIO/CCC, forecast accuracy) + opco KPIs |
| 8 | sourcing_artifacts | Brightmark sourcing; any RFP/BAFO |
| 9 | compliance | PCI (Forge&Field DTC), SOX, data privacy |
| 10 | industry_context | Supply-chain, consumer/DTC, marketing/sourcing patterns |

- **Deliverable from us:** the ready-to-upload synthetic files. **You/Codex** do the uploads.

## Phase 2 — Load through the Data Loads module (dogfood)
Per segment: `/admin/setup` (Data Loads) → **Start a governed load** → upload at
`/admin/context-layer/uploads` → **sensitive-data guard** runs → parse → schema-map → **context
chunks persisted** → approve/commit. Then run the **embeddings worker** (`src/lib/corpus/
embedding.ts`) to turn `pending` chunks into vectors.
- **Prove the safety control:** deliberately upload one row with fake PHI/PII → confirm it
  **quarantines** (the attestation/quarantine requirement you specified).
- **Watch the context layer build:** `/admin/data-trust` shows each segment populating (record count,
  coverage, last-loaded — the real snapshot the redesigned Setup page reads).
- **Acceptance per segment:** Data Trust shows N records loaded + embeddings complete.

## Phase 3 — Build the industry / cross-industry corpus (pattern packs)
Attach the reusable pattern packs as corpus content:
- **Cross-industry:** the **Finance/CFO AI pattern pack** + the **Kyriba success-platform pack**
  (already authored) — apply to any tenant.
- **Industry (opco-specific):** supply-chain (Northline), consumer/DTC (Forge&Field),
  marketing/sourcing (Brightmark) patterns.
- Loaded via `industry_context` / `evidence_ledger` segments or the pattern-pack mechanism.

## Phase 4 — Verify end-to-end (the proof)
- Sign in as Lakeshore CXO → **Intelligence** (ask → grounded answer from the new corpus), **Moves**
  (Kyriba rollout as a Move + business case + the success-platform value scorecard), **Source**
  (sourcing/RFP), **Tower** (portfolio across the 3 opcos).
- **Tenant isolation:** confirm Lakeshore sees only its data (no Apex/Meridian bleed) — run the
  isolation check.
- **Grounding:** capability-grounding shows the corpus lights up the agents.

---

## Honest dependencies & gaps
- **Loader readiness ~60%** (per the earlier audit). The **csv-upload path works today** for
  parse → sensitive-guard → chunk persist → embeddings. The full *governed approve→commit* gates +
  email/attestation + Azure service wiring are what the **pilot-loader Codex wave** (brief already
  authored) hardens. **Options:** (a) start loading via the csv path now and harden in parallel, or
  (b) run the pilot-loader wave first for the full governed experience. Recommend (a) + (b) in
  parallel.
- **Embeddings:** confirm the worker runs on a schedule/trigger (or run it manually after each load)
  so chunks become retrievable.
- **Account/credentials + prod migrations:** done by you/Codex (I can't create accounts, type
  credentials, or mutate prod outside the runners).

## Who does what
- **Us/Codex:** Phase-0 tenant-config code; the synthetic dataset template files (Phase 1); the
  pattern-pack corpus (Phase 3); verification scripts.
- **You (or Codex with creds):** Clerk org + users; run migrations/seed of the clients row; the
  uploads through the module (or Codex automates via the upload API); the embeddings run.

## Acceptance (whole tenant)
Lakeshore Holdings exists as a real tenant, **its entire corpus built through the loader UI** (zero
seed scripts), context layer populated + embedded, all 4 product surfaces grounded on it, tenant
isolation verified — a clean, repeatable, demonstrable "new client from scratch" you can show the
Morgan Street VP.
