# Lakeshore Holdings — Synthetic Data Generation Spec (top-notch corpus) · 2026-06-03

Detailed instructions for Codex to **generate ALL dimensions** of rich, realistic, internally-
consistent synthetic data for Lakeshore Holdings — tabular **and documents (incl. contract PDFs)** —
and load every one through the Data Loads module. Companion to `CODEX-LAKESHORE-STANDUP-BRIEF-
2026-06-03.md`. **All artifacts labeled "SYNTHETIC / ILLUSTRATIVE."**

Goal: the corpus + context layer must be **top-notch** — broad (every dimension), deep (realistic
volume), and **internally consistent** so the agents are genuinely grounded.

---

## 0. Global realism principles (non-negotiable)
1. **Internal consistency / cross-references** — numbers and IDs tie ACROSS dimensions:
   - vendor spend in `it_financials` reconciles to `vendor_contracts`;
   - headcount in `org_structure` reconciles to `enterprise_profile`;
   - the **Kyriba rollout** in `program_inventory` references the **Kyriba contract** in
     `vendor_contracts` and the **SI implementation partner**;
   - apps in the CMDB reference the opco that owns them and the vendors that supply them.
2. **Holdco + 3 opcos** everywhere (Northline / Brightmark / Forge & Field), each with its **own
   CIO**, rolling up to the **Global CIO**; Surekha (VP Innovation/Delivery) under the Global CIO.
3. **Multi-currency / 50 countries** — FX exposure realistic (USD, EUR, GBP, etc.); the reason for
   Kyriba.
4. **Time-series where relevant** — quarterly KPIs/financials across ≥8 quarters so trends exist.
5. **Realistic names, not "Test 1/2/3"** — real-sounding systems (SAP S/4, Manhattan WMS, Salesforce,
   Snowflake, Tableau, Kyriba), vendors, roles. Synthetic but believable.
6. **Generated programmatically** (scripts) for reproducibility; documents via a PDF/DOCX generator.
7. **Every record/document carries provenance** (source, as-of) and is **collected for review** under
   `docs/build/lakeshore/loaded/` for Surekha.

## 1. Volume targets (rich — aim high)
| Group | Target |
|---|---|
| enterprise_profile | 4 entities (holdco + 3 opcos), full attribute set |
| org_structure | 40–60 roles (global CIO, 3 opco CIOs, CFO/treasury, Surekha, leadership + key teams) + decision-rights/RACI |
| IT / CMDB (app portfolio, infra, integration, data estate, EUC, EA standards) | **150–300 apps** + 50–100 infra + 50+ integrations across opcos |
| it_financials / FinOps | 100–200 spend lines (opco × category × quarter) |
| vendor_contracts | 60–100 vendor/contract rows **+ 8–15 contract DOCUMENTS (PDF)** |
| program_inventory | 25–40 programs (Kyriba rollout, modernization, AI portfolio) |
| KPIs / ITSM / telemetry | 60–100 KPIs + SLA/incident records |
| finance / treasury | multi-entity cash, FX, working capital, value baselines |
| security / risk / compliance | 40–60 (controls, risks, incidents, PCI/SOX/GDPR) **+ policy DOCs** |
| data governance / skills / M&A backlog | 30–60 across these |
| documents (contracts, policies, reports, architecture) | **15–25 documents** total |
| industry pattern corpus | curated from genome (see brief reuse strategy) |

Net: **~600–1,000 structured records + ~15–25 documents** — comfortably richer than the Apex drop.

## 2. Tabular generation — per dimension (fields + realism)
Author **into the prebuilt templates** (template registry + enterprise-context workbooks), mapped to
the `csv-upload-connector` schema. For each dimension below, generate the fields + volume from §1.

- **enterprise_profile** — entity, parent, revenue, EBITDA, employees, countries, sectors, ownership,
  HQ. (Holdco ~$3B / ~10k; Northline ~$1.5B/6k; Brightmark ~$0.7B/2.5k; Forge&Field ~$0.8B/1.5k.)
- **org_structure** — person, title, opco, reports-to, function, decision rights (global vs local
  CIO authority), location. Include Global CIO, 3 opco CIOs, CFO/Treasury, **Surekha (VP
  Innovation/Delivery → Global CIO)**.
- **Application portfolio (CMDB)** — app, opco owner, business capability, lifecycle (invest/sustain/
  retire), criticality, tech stack, hosting (Azure/AWS/on-prem), vendor, annual cost, integration
  count, modernization disposition. Include **Kyriba, SAP, WMS/TMS, e-commerce, marketing, CDP**.
- **Infrastructure** — DCs, cloud accounts/subscriptions, network, compute, storage, by opco.
- **Integration landscape** — interfaces (API/EDI/file/middleware), source→target, protocol,
  data domain, criticality.
- **Data estate** — DWs, lakes, BI tools (Tableau/Power BI), pipelines — the modernization hook.
- **EUC / shadow IT** — critical spreadsheets/Access DBs (risk + modernization candidates).
- **EA standards** — standards + per-opco compliance/exceptions (the governance tension).
- **it_financials / FinOps** — spend by opco × category (run/change, license/SaaS, cloud), quarterly.
- **vendor_contracts (tabular)** — vendor, category, contract id, value (annual + TCV), start/end,
  renewal/auto-renew, notice days, owner, status, SLA ref, the **Kyriba** + **SI partner** rows.
- **program_inventory** — program, opco/holdco, type (AI/modernization/rollout), sponsor, status,
  budget, value target, gates; the **Kyriba rollout** + **legacy-analytics modernization** programs.
- **kpi_dictionary** — KPI, definition, owner, target, actual (×8 quarters): treasury (CCC/DSO/DPO/
  DIO/forecast accuracy) + IT (uptime, change-fail, MTTR) + opco business KPIs.
- **ITSM / telemetry** — services, SLAs, incidents (sev, MTTR), change records.
- **finance / treasury** — multi-entity cash positions, FX exposures by currency, working-capital,
  value-realization baselines for the Kyriba scorecard.
- **security / risk / compliance** — controls, risk register (likelihood×impact), incidents, PCI
  (Forge&Field DTC) / SOX / GDPR scope.
- **data governance** — data domains, owners, quality scores, MDM, data products.
- **skills / workforce** — roles, skills, gaps (AI talent), build-vs-buy.
- **M&A / integration backlog** — recent acquisitions, un-integrated systems, integration debt.
- **sourcing_artifacts** — RFP/BAFO records (Brightmark sourcing + any IT sourcing).

## 3. Document generation (the part you emphasized — contract PDFs etc.)
Generate **real synthetic documents** (multi-page) and load them through the document-parsing path so
their content becomes structured facts + context chunks + evidence (with page-level provenance).

**Contracts (PDF) — 8–15 docs:**
- **Kyriba license/order form + MSA** — parties (Lakeshore Treasury + Kyriba), term, annual + TCV,
  auto-renewal, termination notice, SLA/uptime, support tier, data/IP, AI/data-use clauses,
  liability cap.
- **SI implementation SOW** (Deloitte/Accenture-class analog) — scope, phases, deliverables,
  T&M vs fixed, rate schedule, milestones, acceptance, change-control.
- **Major vendor contracts** — SAP/ERP, cloud (Azure EA), WMS/TMS, marketing platform, 3PL — each
  with realistic commercial + legal terms.
- Generated as proper PDFs (e.g. via a PDF lib / the docx→pdf path), clearly watermarked SYNTHETIC.

**Policies (DOCX) — 3–5:** security policy, data-governance policy, AI-usage/responsible-AI policy,
data-classification standard.

**Reports (PDF/PPTX) — 3–5:** holdco annual report, quarterly segment performance, a board IT
update — with financials that reconcile to the tabular dimensions.

**Architecture (PDF/MD) — 2–3:** integration topology, target-state (medallion) for the
modernization program.

**Document → corpus requirement:** these documents must be **parsed into structured facts + context
chunks + the evidence ledger** with provenance back to the source document + page. This requires the
**document-parsing pipeline (Azure Document Intelligence) — IN SCOPE for top-notch corpus**, not a
future option. Extract, e.g., contract terms (parties/value/term/renewal/SLA/clauses) into
`vendor_contracts` enrichment + searchable evidence.

## 4. Load + verify (through the module)
- **Automate** all loads via the upload API (tabular + documents). Run the **embeddings worker**.
- **Prove quarantine** with one deliberately-bad PHI/PII row.
- **Verify** `/admin/data-trust` shows every dimension populated to the §1 targets; documents
  searchable with provenance; agents grounded (capability-grounding lit).
- **Collect** every loaded artifact under `docs/build/lakeshore/loaded/` for Surekha review, each
  with its **How-To page** (registry-driven; column metadata + sample).

## 5. Acceptance (top-notch bar)
All ~50 dimensions loaded to volume; contracts/policies/reports ingested as searchable corpus with
provenance; cross-dimension consistency holds (spot-check: vendor spend ↔ contracts ↔ programs);
4 surfaces (Intelligence/Moves/Source/Tower) answer Lakeshore questions grounded in the loaded
corpus; tenant isolation verified.
