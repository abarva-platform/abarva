# Tower Module Audit — 2026-05-22

**Auditor:** automated read-only sweep on `origin/main` @ `1365d051e`
**Scope:** every Tower route, component, lib, ingestion path, integration surface, and UX state reachable from sign-in → landing → Tower
**Method:** static read of `src/app/(maestro)/tower/**`, `src/app/api/**tower**`, `src/lib/tower/**`, `src/lib/atlas/**`, `src/components/tower/**`, `supabase/migrations/**`, `scripts/seed/tower/**`, `public/templates/tower/**`
**Output:** this doc. No app code changed; no tests run; no DB touched.

## 2026-06-02 refresh note

This audit remains a May 22 empirical snapshot, not a claim that Tower has
stood still. It was rebased and lightly refreshed on 2026-06-02 against
`origin/main` @ `95bef1050` so it can land without misrepresenting the current
surface.

Material changes since the original read:

- Atlas is materially stronger than the original snapshot: the Initiative
  Archetype Corpus now has 10 archetypes, `src/lib/atlas/composition/compose.ts`
  emits the four-section `Your data / Industry context / The gap / Next move`
  structure, and `/api/v1/atlas/ask` returns `x-atlas-mode` so live-vs-fallback
  behavior is visible.
- The Tower route shape changed after the Next.js dynamic-segment conflict fix:
  value detail now lives under `tower/programs/[programId]/value`, and aggregate
  redirect routes such as `tower/programs/page.tsx`, `tower/lens/page.tsx`, and
  `tower/pressures/page.tsx` are present.
- The source-pipe verdict still appears directionally correct from static
  evidence: Tower has more templates, runbooks, notifications, and telemetry
  language, but there is still no confirmed live extractor feeding DORA,
  ServiceNow, Workday, ERP, cloud-billing, Copilot, Cursor, or Claude Code usage
  tables into Tower as a recurring production connector.

Read the rest of this document as: "what the May 22 audit found, plus the
refresh caveat above." The current product should not be judged from any single
line item below without checking whether a later PR closed that exact gap.

---

## 1. Tower surface inventory

### 1.1 Routes under `src/app/(maestro)/tower/**`

24 page files. By honest size + role:

| Route                                                      |    LOC | Kind               | Notes                                                                                  |
| ---------------------------------------------------------- | -----: | ------------------ | -------------------------------------------------------------------------------------- |
| `tower/page.tsx`                                           |    638 | **REAL**           | Tower main. Real DB reads, Atlas reasoning trace, 4 panels. (file:line evidence below) |
| `tower/portfolio/page.tsx`                                 |    200 | **REAL**           | Portfolio Value rollup. Real DB. Hardens to honest empty state on degrade.             |
| `tower/programs/[moveId]/value/page.tsx`                   |    266 | **REAL**           | Per-move value layers (projected / tracked / verified) with attestation server action. |
| `tower/onboard/page.tsx`                                   |     67 | **REAL**           | Data-setup index. Lists 5 hardcoded dimensions.                                        |
| `tower/onboard/[dimension]/page.tsx`                       |    186 | **REAL**           | Per-dimension onboarding page. Static catalog.                                         |
| `tower/portfolio-dag/page.tsx`                             |     34 | **REAL**           | Wraps `getMoveDAG()` from `move_dependencies` table.                                   |
| `tower/portfolio-dag/PortfolioDagClient.tsx`               |      – | **REAL**           | Client renderer for the DAG.                                                           |
| `tower/source-portfolio-value/page.tsx`                    |     78 | **REAL**           | Source-side cumulative-savings rollup.                                                 |
| `tower/pressures/[pressureId]/page.tsx`                    |     12 | **REDIRECT-SHELL** | `redirect('/tower?pressure=…')`.                                                       |
| `tower/programs/[programId]/page.tsx`                      |     12 | **REDIRECT-SHELL** | `redirect('/tower?detail=…')`.                                                         |
| `tower/lens/{adoption,cost,inventory,risk,value}/page.tsx` | 7 each | **REDIRECT-SHELL** | All `redirect('/tower?view=…')` (`tower/lens/value/page.tsx:6`).                       |
| `tower/activity/page.tsx`                                  |      7 | **REDIRECT-SHELL** | `redirect('/tower?view=evidence')` (`tower/activity/page.tsx:6`).                      |
| `tower/outcomes/page.tsx`                                  |      7 | **REDIRECT-SHELL** | Redirect.                                                                              |
| `tower/projects/page.tsx`                                  |      7 | **REDIRECT-SHELL** | Redirect.                                                                              |
| `tower/staff-aug/page.tsx`                                 |      7 | **REDIRECT-SHELL** | Redirect.                                                                              |
| `tower/tech-stack/page.tsx`                                |      7 | **REDIRECT-SHELL** | Redirect.                                                                              |
| `tower/volumetrics/page.tsx`                               |      7 | **REDIRECT-SHELL** | Redirect.                                                                              |
| `tower/preview/page.tsx`                                   |      7 | **REDIRECT-SHELL** | `redirect('/tower')`.                                                                  |
| `preview/tower/page.tsx`                                   |      7 | **REDIRECT-SHELL** | Redirect to `/tower`.                                                                  |
| `tenant/[tenantSlug]/tower/page.tsx`                       |     33 | **REDIRECT-SHELL** | Resolves tenant, redirects to `/tower?client=…`.                                       |
| `tenant/[tenantSlug]/tower/[surface]/page.tsx`             |     19 | **REDIRECT-SHELL** | Same pattern for sub-surfaces.                                                         |

**Count:** 4 substantive product surfaces (`/tower`, `/tower/portfolio`, `/tower/programs/[moveId]/value`, `/tower/portfolio-dag`) + 2 narrow side rollups (`onboard`, `source-portfolio-value`) + **13 redirect-shells**. The earlier "12 redirect-shell" memory note is still essentially accurate — Tower's public route surface is dominated by redirects.

### 1.2 API routes

| Route                                                 | Real?          | Purpose                                                                                                                                                                                                                  |
| ----------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api/tower/upload/route.ts`                           | **REAL**       | Auth-gated CSV upload → classifier → `ingestPortfolioCsv` → Postgres `use_cases` table. 25 MB cap, role-checked, cross-tenant blocked (`upload/route.ts:49`, `:56`).                                                     |
| `api/tower/initiative-detail/route.ts`                | **REAL**       | GET by displayId; queries `ai_initiatives`.                                                                                                                                                                              |
| `api/tower/value-states/[moveId]/route.ts` + `attest` | **REAL**       | Read + attestation writes against `value_states` table.                                                                                                                                                                  |
| `api/tower/value-states/route.ts`                     | **REAL**       | Portfolio rollup.                                                                                                                                                                                                        |
| `api/tower/synthesis/route.ts`                        | **REAL (LLM)** | Anthropic streaming; portfolio narrative. **But ground truth is hardcoded** `APEX_RETAIL_PROGRAM_INSTANCES` (10 instances) at `src/lib/programs/program-instances.ts:735` plus `SOURCE_EVENT_INSTANCES` — not tenant DB. |
| `api/tower/seed-demo/route.ts`                        | **REAL**       | Admin-only bulk demo seeder.                                                                                                                                                                                             |
| `api/v1/tower/outcome-report/route.ts`                | **REAL**       | DOCX/XLSX download of tenant Tower posture; honest-sparse on thin tenants.                                                                                                                                               |
| `api/debug/tower-substrate`                           | debug          | –                                                                                                                                                                                                                        |
| `api/v1/atlas/{chat,ask,observations,signals/[id]}`   | **REAL**       | Atlas front-agent. Uses Anthropic via `getAuditedAnthropicClient` with deterministic fallback (`llm.ts:140-152`).                                                                                                        |

### 1.3 Components & libs

`src/components/tower/`: 38 files — main shell (`TowerIndexPage.tsx`, 2,500+ LOC), lens pages (Activity/Adoption/Cost/Inventory/Risk), Atlas brief canvas, pressure cards, action queue, alerts, portfolio cascade graph, provenance ribbon, upload zone, demo banner. Substantial UI surface.

`src/lib/tower/`: 80+ files. Major groupings:

- **Ledger / read models** (deterministic seeds — see §2): `ai-portfolio-inventory.ts`, `ai-adoption-usage.ts`, `ai-cost-consumption.ts`, `ai-risk-governance.ts`, `ai-productivity-dora.ts`, `ai-tool-waste-signals.ts`, `ai-value-outcome-ledger.ts`.
- **View-models computed from DB substrate**: `band-metrics-view.ts`, `pressure-cards-view.ts`, `strategic-alignment-2x2-view.ts`, `programme-gate-status-view.ts`.
- **Value-states (real Postgres)**: `value-states/{repository,calculations,db,types}.ts`.
- **Onboarding catalog** (constant): `onboarding-catalog.ts`.
- **Apex contact-centre fixture** (hardcoded portfolio card): `apex-contact-center-portfolio-fixture.ts`.
- **Outcome-report exports**: `exports/outcome-report-{docx,xlsx,payload}.ts`.
- **Atlas integration**: `atlas-observations-view.ts`, `atlas-interpretation-view.ts`, `atlas-reasoning-trace.ts`, `atlas-pattern-selectors.ts`, `atlas-citation-validator.ts`, `atlas-executive-brief-canvas.ts`.
- **Shell fixtures** (demo seed data): `shell-tower-fixture.ts`, `shell-lens-fixture.ts`, `shell-activity-fixture.ts`, `shell-outcome-fixture.ts`, `shell-program-scope-fixture.ts`.

### 1.4 Atlas (Tower's front agent)

Atlas code is **real and reasonably built**: `src/lib/atlas/{classifier,orchestrator,llm,prompt,tool-belt,scripted-engine,value-grounding,tower-grounding,rendered-response,repository,types}.ts`. It uses Claude Opus 4.7 (`llm.ts:180`), seven `query_*` tool functions, retrieval over corpus chunks, a deterministic fallback path for when the model is unavailable (`llm.ts:213-221`), and writes a reasoning trace to `atlas_reasoning_traces` on every Tower render (`tower/page.tsx:573-586`). Confidence floors are derived from the band metrics so Atlas refuses to overcommit (`orchestrator.ts:62-70`). Surfaces: `AtlasChatPanel` in Tower index, plus `AtlasRail` and `AtlasSignalDetailPanel`.

Atlas is **not stubbed**. It is the most complete agent in the product alongside Sentinel. The honest caveat is downstream: its grounding is only as real as the substrate underneath (see §2), so when the tenant has thin DB rows, Atlas produces conservative or pattern-driven prose rather than crunching real signals.

---

## 2. Data-flow classification — per panel on `/tower`

The main Tower page composes panels from many sources. Classified strictly:

| Panel / data                                                                                         | Source                                                                                                         | Classification                                | File:line                                                                           |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| Active client resolution + pilot fallback (`apexretail`/`meridian`/`arcturus`)                       | `getActiveClientRow` + `selectTowerPageReadAdapter().countClientInitiatives` over `ai_initiatives`             | **TENANT-LIVE** (gated)                       | `tower/page.tsx:59-80`                                                              |
| `towerInitiatives` (CFO 2×2, band metrics, pressures, Atlas grounding)                               | `listInitiativesForClient(clientId)` → `azureRead.select` from `ai_initiatives`                                | **TENANT-LIVE** (Azure Postgres)              | `tower/page.tsx:91-98`, `ai-initiatives/queries.ts:140-168`                         |
| `towerVendors` (Renewals · 90d tile)                                                                 | `listVendorsForClient(clientId)`                                                                               | **TENANT-LIVE**                               | `tower/page.tsx:107-114`, `ai-initiatives/queries.ts:284`                           |
| `towerSubstrateCounts` (KPIs / decisions / stakeholder notes / scenarios)                            | `countByInitiatives(table, ids)` over `ai_initiative_*` tables                                                 | **TENANT-LIVE** (fail-soft to 0)              | `tower/page.tsx:125-145`                                                            |
| `towerBandMetrics` (Portfolio ROI · Active pressures · Spend at risk · Renewals 90d · Adoption rate) | `buildTowerBandMetrics(initiatives, vendors, today, lens)` — pure projection                                   | **TENANT-LIVE** (derived)                     | `band-metrics-view.ts`                                                              |
| `towerPressures` (pressure cards)                                                                    | `buildTowerPressuresView` — pure projection from initiatives' `status_flag`                                    | **TENANT-LIVE** (derived)                     | `pressure-cards-view.ts`                                                            |
| `towerAlignment2x2`                                                                                  | `buildStrategicAlignment2x2View(initiatives)`                                                                  | **TENANT-LIVE** (derived)                     | `strategic-alignment-2x2-view.ts`                                                   |
| `MovePortfolioCardPanel` Apex Contact Center card                                                    | `buildApexPortfolioCards()` — pure constants for `apexretail` only                                             | **HARDCODED**                                 | `apex-contact-center-portfolio-fixture.ts:38-80`, gated at `tower/page.tsx:528-529` |
| `TowerSetupInitiativesPanel` (private-DB feed)                                                       | `listPersistedSetupAiInitiatives` → tenant private schema                                                      | **TENANT-LIVE** (degrades to **EMPTY-STATE**) | `tower/page.tsx:280-335`                                                            |
| `TowerHandoffProgramsPanel` (P6 handoff programs)                                                    | `selectTowerPageReadAdapter().listHandoffPrograms`                                                             | **TENANT-LIVE**                               | `tower/page.tsx:227-249`                                                            |
| `TowerHandoffSourceEventsPanel`                                                                      | `selectTowerPageReadAdapter().listHandoffSourceEvents`                                                         | **TENANT-LIVE**                               | `tower/page.tsx:251-278`                                                            |
| Atlas reasoning trace (right rail)                                                                   | `buildAtlasInterpretation` (LLM) + deterministic fallback over substrate; appended to `atlas_reasoning_traces` | **TENANT-LIVE** (derived + LLM)               | `tower/page.tsx:558-587`                                                            |

### Per panel on `/tower/portfolio`

| Panel                                      | Source                                                                                                                          | Classification  | File:line                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------- |
| Move rows (Move + Source workflow rollups) | `getPortfolioValueRollup(ctx)` → Postgres `engagements ⋈ value_states ⋈ move_instances ⋈ move_templates` + `source_value_lines` | **TENANT-LIVE** | `portfolio/page.tsx:87-105`, `value-states/repository.ts:64-94` |
| Dependency arrows                          | `move_dependencies` table                                                                                                       | **TENANT-LIVE** | `value-states/repository.ts`                                    |
| Honest empty state on degrade              | yes                                                                                                                             | **EMPTY-STATE** | `portfolio/page.tsx:170-175`                                    |

### Per panel on `/tower/programs/[moveId]/value`

| Panel                                                 | Source                                                                                                                                                                                 | Classification  | File:line                                       |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------- |
| 5 value layers × {projected, tracked, verified} cells | `getMoveValueDetail` over `value_states.{projected,tracked,verified}_jsonb` + `dora_baselines`, `application_portfolio`, `ai_tool_footprint`, `discovery_instruments`, `kill_criteria` | **TENANT-LIVE** | `value-states/repository.ts:200-348`            |
| Attestation flow                                      | server action → `attestValueLayer` → updates `value_states.verified_jsonb`, `attested_by`, `attested_at`                                                                               | **TENANT-LIVE** | `tower/programs/[moveId]/value/page.tsx:98-108` |

### Per panel on `/tower/portfolio-dag`

| Panel               | Source                                                           | Classification                            |
| ------------------- | ---------------------------------------------------------------- | ----------------------------------------- |
| Graph nodes + edges | `getMoveDAG(client.id)` over `move_dependencies` + `engagements` | **TENANT-LIVE** (fails soft to empty DAG) |

### Per panel on `/tower/onboard` and `/tower/onboard/[dimension]`

| Panel                                                                              | Source                                    | Classification         | File:line                                                                                           |
| ---------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------- |
| 5 dimensions list (Inventory / Adoption / Value / Risk / Cost)                     | `TOWER_DIMENSIONS` constant               | **HARDCODED**          | `onboarding-catalog.ts:3-77`                                                                        |
| Tier-1 system mappings (ServiceNow, Workday, M365, AWS/Azure/GCP, Okta, Snowflake) | `ONBOARDING_CATALOG` constant             | **HARDCODED**          | `onboarding-catalog.ts:91-263`                                                                      |
| Template downloads                                                                 | Static files in `public/templates/tower/` | **SEEDED** (pre-built) | `public/templates/tower/{tower-bundle.{json,xlsx}, tower-{inventory,adoption,value,risk,cost}.csv}` |

### "Shell" fixtures still in tree

`src/lib/tower/shell-*-fixture.ts` (Tower / Lens / Activity / Outcome / Program-scope). These are still **HARDCODED demo data** with vivid pressure narratives (`PRESSURE_AI_CLOUD_SPEND`, `PRESSURE_VENDOR_RISK`, etc.). Search confirms they are referenced from production code paths in the lens / activity / outcome shells — though now most lens routes redirect away, the components and fixtures remain.

### Headline classification (`/tower`)

- **TENANT-LIVE (DB-backed):** ~80% of the main page (initiatives, vendors, KPIs, decisions, stakeholder notes, scenarios, handoff programs, source events, Atlas reasoning trace persist).
- **HARDCODED:** Apex Contact Center portfolio card (one tenant only); Atlas synthesis ground truth (`APEX_RETAIL_PROGRAM_INSTANCES`); shell-\* fixtures for the lens shells still in the tree.
- **DERIVED (pure projection of live data):** band metrics, pressure cards, alignment matrix, atlas observations.
- **EMPTY-STATE:** explicit honest empty states wired in for portfolio, setup initiatives, handoff programs/source events, executive brief, and the alignment matrix.

---

## 3. Data-ingestion templates — robustness audit

### 3.1 Tower CSV templates (`public/templates/tower/`)

Build pipeline at `src/scripts/templates/{schema,generate-csv,generate-xlsx,generate-json,build-all}.ts`. Schemas at `schema.ts` for all 5 dimensions: each `DimensionTemplate` carries typed `ColumnSpec[]` with required flags, enums, lists, dates, examples (`schema.ts:25-182`).

- **Inventory** — 11 columns. Validation: type-tagged; covers status enum (`pilot|production|stalled|sunset`).
- **Adoption** — 9 columns. DAU/WAU/MAU + eligible_population + penetration % + drop-off.
- **Value** — 8 columns. baseline / observed / confidence / as_of_date.
- **Risk** — 9 columns. governance_approval_status / model_risk_level / data_classification / vendor BAA + SOC2 + residency + bias_incidents.
- **Cost** — 11 columns. Per-month spend split (LLM / compute / storage / license / integration / 6-month forward projection).

**The ingestion path actually wired through (`ingestPortfolioCsv`) ingests ONE dimension only — "portfolio" use-cases — into the `use_cases` table.** It does fuzzy column matching against `name|description|business unit|domain|stage|systems|ai type|scope|vendor|external id` (`ingest-portfolio.ts:69-90`). The other four templates (Adoption / Value / Risk / Cost) have schema files and generated CSVs in `public/templates/tower/` but **no ingestion code routes them into a DB table**. Upload route classifies non-portfolio CSVs as `needs_mapping` and returns "Parser not yet wired — manual mapping required. See Pack 11." (`api/tower/upload/route.ts:189`).

### 3.2 Robustness rating per template

| Template                  | Ingestion code       | Validation                                 | Idempotency                                      | Error handling                   | Scale                                              | Rating                          |
| ------------------------- | -------------------- | ------------------------------------------ | ------------------------------------------------ | -------------------------------- | -------------------------------------------------- | ------------------------------- |
| Inventory (→ `use_cases`) | `ingestPortfolioCsv` | fuzzy column match, stage enum, list split | **none — duplicate uploads will duplicate rows** | per-row error capture in `notes` | row-by-row inserts; no batching → slow at >1k rows | **pilot-grade**                 |
| Adoption                  | none                 | –                                          | –                                                | –                                | –                                                  | **placeholder** (template only) |
| Value                     | none                 | –                                          | –                                                | –                                | –                                                  | **placeholder**                 |
| Risk                      | none                 | –                                          | –                                                | –                                | –                                                  | **placeholder**                 |
| Cost                      | none                 | –                                          | –                                                | –                                | –                                                  | **placeholder**                 |

### 3.3 The AI Initiatives substrate templates

A parallel ingestion track exists for the AI Initiatives Registry (which is what the Tower band metrics, 2×2, and pressures actually read from). Templates at `docs/build/intelligence/ai-initiatives-package/templates/{apex-retail,first-capital-financial,meridian-health}/full_load.json` (1,824–1,850 lines each, ~50–60 initiatives + categories + goals + vendors + KPIs + decisions). Schema enforced by migration `20260507230500_ai_initiatives_registry.sql` (typed enums for `stage`, `status_flag`, `confidence_level`; FK to `ai_categories`, `ai_business_goals`; tenant-scoped via `client_id`). Natural-key uniques added by `20260507234500_ai_initiatives_natural_key_uniques.sql`.

**Rating: pilot-grade with strong schema discipline.** Strict CHECK constraints, FK integrity, tenant scoping. Per-tenant JSON-blob ingest (manual). No streaming connector; no scheduled refresh. Idempotent if natural keys hold. Three full tenants seeded.

### 3.4 Engineering substrate (`application_portfolio`, `dora_baselines`, `ai_tool_footprint`, `discovery_instruments`, `kill_criteria`)

Schemas at `supabase/migrations/20260523090000_client_extension_it_productivity.sql`. Real Postgres tables with proper CHECKs, FKs to `clients`, `engagements`, `org_topology`. Seeded for Apex by `scripts/seed/apex-it-productivity.ts` (953 LOC, 15 entity blocks).

**Rating: pilot-grade.** Schemas are production-shaped. No connector pulls live data — every population is via TS seed scripts.

### 3.5 The `data_integrations` table (Tower-side "connector" telemetry)

Seeded by `scripts/seed/tower/data.ts:652-713`. Shopify / Salesforce Commerce / Snowflake / Google CCAI / Microsoft 365 entries with status/sync/health fields. **None of these are real connectors.** They are fixture rows that paint a connector dashboard. No code in `src/lib/integrations/` (the only subdir is `ai-egress`, an LLM client) actually pulls from Shopify, Snowflake, etc.

---

## 4. Integration capability vs CIO expectation

The CIO walking up expects a Tower wired to project tooling, CMDB, ERP, engineering metrics, FinOps, AI-tooling telemetry. Here is what exists today.

| System                                                                | Present?                                      | Evidence                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Jira / Asana / MS Project / Smartsheet** (PPM)                      | **absent**                                    | No connector code under `src/lib/integrations/` or elsewhere. The only Jira mention is `'Seed-only; no live Jira pipeline is connected.'` (`ai-productivity-dora.ts` doc comment).                                                                               |
| **ServiceNow CMDB / ITSM**                                            | **absent (referenced as fixture only)**       | ServiceNow appears as a name in the onboarding catalog (`onboarding-catalog.ts:93-115`), in shell fixtures (`shell-tower-fixture.ts:36`, `shell-activity-fixture.ts`), and in connector fixtures (`admin-connectors-fixture.ts`). No code reads from ServiceNow. |
| **Jira Service Management**                                           | **absent**                                    | –                                                                                                                                                                                                                                                                |
| **Workday HCM / Oracle ERP / SAP / NetSuite**                         | **absent (referenced as documentation only)** | Workday in onboarding catalog (`onboarding-catalog.ts:117-135`). "SAP S/4HANA (planned)" is hardcoded as `status: 'not_configured'` in `admin-connectors-fixture.ts:27-40`. No live ERP read path.                                                               |
| **BambooHR / Workday HCM** (workforce)                                | **absent**                                    | –                                                                                                                                                                                                                                                                |
| **GitHub / GitLab / Bitbucket** (DORA from git)                       | **absent**                                    | `dora_baselines` table exists and is **seeded manually**; no `octokit`, no GitHub Actions polling, no webhook receiver.                                                                                                                                          |
| **Deployment systems** (CircleCI / GitHub Actions / Argo / Spinnaker) | **absent**                                    | –                                                                                                                                                                                                                                                                |
| **GitHub Copilot telemetry**                                          | **absent**                                    | Mentioned in onboarding catalog & `metric-provenance.ts:36` as a future provenance source. No telemetry adapter. `ai_tool_footprint` table is filled via seed script.                                                                                            |
| **Cursor admin usage**                                                | **absent**                                    | Mentioned by name in `band-metrics-view.ts` adoption-rate caveat copy. No integration.                                                                                                                                                                           |
| **Claude Code / Devin / other AI-coding usage**                       | **absent**                                    | No mentions of usage telemetry at all.                                                                                                                                                                                                                           |
| **Linear / Productboard / product analytics**                         | **absent**                                    | –                                                                                                                                                                                                                                                                |
| **AWS Cost Explorer / Azure Cost Management / GCP Billing**           | **absent (documented as a future path)**      | Onboarding catalog gives field mappings (`onboarding-catalog.ts:158-220`). No code reads cloud billing APIs. `data_integrations` seed entries for Snowflake/M365 are decorative.                                                                                 |
| **CSV upload (one dimension)**                                        | **present**                                   | `/api/tower/upload` → `ingestPortfolioCsv` → `use_cases` (`upload/route.ts:148`).                                                                                                                                                                                |
| **Manual JSON template load (Initiatives Registry)**                  | **present**                                   | `docs/build/intelligence/ai-initiatives-package/templates/<tenant>/full_load.json` → loaded via tenant DB seed script.                                                                                                                                           |

**Verdict: zero live source-system integrations exist.** Every "integration" surface in Tower is either a name on a card, a documentation page describing where the data lives in the customer's source system, or a CSV/JSON ingest path the customer fills by hand. The team has shipped _the contracts and the schemas_ (real DB tables for portfolio, DORA, AI tools, value states, dependencies, kill criteria) but not _the pipes_ (extractors against Jira / GitHub / ServiceNow / Workday / cloud billing / Copilot).

---

## 5. UX assessment — login through Tower

### 5.1 Login flow

- Clerk-mediated (`src/app/page.tsx:9-23`). Anonymous visitor → marketing landing (`LoggedOutLandingPage`).
- Signed-in user → `resolvePostSignInPath(role, …)` → most roles route to `/home`, NEW-client emails route to `/tower/onboard`, investors to `/investor`, admins to `/home` (`access-routing.ts:100-132`).
- Tower is **not** the default landing for any normal user. A CIO arrives via `/home` and clicks into Tower via the `AppRail` (`AppRail.tsx:20`).
- Branding is consistent with the locked AbarVa system on marketing and on Tower's onboarding pages (Fraunces serif, Inter body, `#F8F7F4` cream, black/ghost buttons — `tower/onboard/[dimension]/page.tsx:15-21`).
- Friction: thin. The mandatory pk*test*\* Clerk key noted in AGENTS.md is the only known break, and that's an env-level concern.

### 5.2 Landing on Tower

- The main `/tower` page wraps everything in `<TowerIndexPage>` inside `<AppShell>`. Submenu strip = 5 tabs (Portfolio / Scorecards / Gates / Dependencies / Executive brief) per `tower/page.tsx:159-225`. Reduced from 10 tabs in the T-2 fix package — a sane cleanup.
- Tower uses its **own** design tokens (`T = {...}` at `TowerIndexPage.tsx:45-77`) — white background `#ffffff`, not the locked `#F8F7F4` cream. Fonts are Fraunces / Inter / JetBrains Mono — locked-system aligned, but background diverges. The onboarding pages and portfolio page use the cream; the main Tower index does not. This is an **internal inconsistency**.
- Information density: high in places (CFO band, pressures, 2×2, atlas observations, handoff panels, setup initiatives feed) but the page is server-rendered with many panels strung in linear order — there is no real "above the fold" prioritization for an executive scan.
- Copy is decisive and provenance-aware. Confidence badges (`Confidence` solid/dashed/dotted underline), `MetricProvenance` tooltips, `TowerProvenanceRibbon` carry CFO-grade caveats. This is well above the typical hand-rolled dashboard bar.
- Empty states: explicit and honest. `TowerEmptyState` is used throughout — e.g. `tower/page.tsx:1825`, `tower/page.tsx:2507`. The fix wave from PR #2281 is visible.

### 5.3 Drilldowns

- `/tower/portfolio` → real Move rows with projected/tracked/verified value pillars and a per-row drill link.
- `/tower/programs/[moveId]/value` → per-move 5-layer value grid with attestation form. Real server action. CIO-grade.
- `/tower/portfolio-dag` → graph view of dependencies. DAG client-rendered.
- The pressure cards on `/tower` deep-link into `tower/pressures/[pressureId]` — but that page is just a redirect back to `/tower?pressure=...`. So drill is **same-page query parameter** rather than a dedicated route — fine for UX, but it means the deep URL surface is shallow.
- `/tower/programs/[programId]` is also a redirect (`tower/programs/[programId]/page.tsx:11`) — there is no program detail page under Tower; the link bounces to a query-param view.

### 5.4 Visual quality vs Apple-grade bar

- Typography is high-quality, hierarchy is intentional, copy carries confidence markers — better than most enterprise dashboards.
- Loading states: minimal. There's a `tower/loading.tsx` but most server-rendered panels block-render in a single round trip; the page is heavy.
- Motion: none beyond stock anchor scroll.
- Inline styles dominate (the entire main page is inline `style={…}` objects). Hard to maintain at Apple-grade depth.
- The "white background" divergence on `/tower` proper (vs cream elsewhere) breaks the locked design system from memory.

**UX verdict: demoable with caveats.** Tower is more honest, better-typeset, and more provenance-aware than the median enterprise control tower. But: information architecture is linear-scroll, drilldowns disguise as same-page state, design system is split-personality between cream onboarding pages and white index page, and 13 of 24 routes are redirect-shells that telegraph "we have not built this yet" if anyone wanders into the URL space.

**Not yet Apple-grade.** Not yet **shippable-to-CIO**, but defensible in a 30-min walkthrough for a friendly buyer.

---

## 6. Actionability for CIO / CFO / CXO

A CIO sitting at `/tower` for a real customer — what can they actually do?

| Capability                                                            | Status                                                                                                                                       | Evidence                                                                                                                                                                                                                      |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| See which AI programs are funded and what they cost                   | **◐** (committed_annual / committed_total / measured_value loaded from `ai_initiatives` — exact figures gated behind `canViewFinancialData`) | `band-metrics-view.ts` Spend-at-risk tile; `tower/page.tsx:475-479` directional vs exact                                                                                                                                      |
| See real-time progress (DORA, story velocity, deploy freq)            | **✗** (schemas exist; no live data)                                                                                                          | `value-states/repository.ts:237-251` queries `dora_baselines` — table is seed-only (`scripts/seed/apex-it-productivity.ts`)                                                                                                   |
| See realized value vs forecast vs haircut                             | **✓** for tenants with `value_states` rows; **◐** otherwise                                                                                  | `tower/portfolio/page.tsx`, `tower/programs/[moveId]/value/page.tsx`                                                                                                                                                          |
| See live kill-criteria status across the portfolio                    | **◐**                                                                                                                                        | Table exists (`kill_criteria`), rollup queried (`value-states/repository.ts:295-310`), but no UI surface lists portfolio-wide kill status; it's only present per-Move.                                                        |
| See vendor / SI performance, sourcing cycle health, contract renewals | **◐**                                                                                                                                        | Vendors live (`ai_initiatives_vendors`), Renewals · 90d tile real. SI performance / contract renewals are partial — Source feeds Tower via the `TowerHandoffSourceEventsPanel` (`tower/page.tsx:372-401`).                    |
| See risk signals (regulatory, security, MRM) per program              | **◐**                                                                                                                                        | `ai-risk-governance.ts` is **deterministic seed-only** (no live MRM connector); `regulatory-risk-lens.ts` builds a view over it. Status_flag drives pressure cards from live initiatives — so a real risk flag flows through. |
| Drill portfolio → program → Move → artifact                           | **◐**                                                                                                                                        | Portfolio → Move-value works (`/tower/portfolio` → `/tower/programs/[moveId]/value`). Program drill bounces to a query-param view (`tower/programs/[programId]/page.tsx:11`). Artifact-level drill not in Tower.              |
| Export a board-ready Tower view                                       | **✓**                                                                                                                                        | `/api/v1/tower/outcome-report?format=docx\|xlsx` — real DOCX/XLSX export over live substrate, honest-sparse for thin tenants (`outcome-report/route.ts`).                                                                     |
| Make decisions (fund/pause/kill) that flow to Moves                   | **◐**                                                                                                                                        | Attestation flow ships (`tower/programs/[moveId]/value/page.tsx:98-108`) — finance can verify a value layer. Fund/pause/kill are **not** wired as Tower actions; they live in Programs.                                       |

**Net actionability:** Tower today is a **read + attest** surface, not a **decide-and-route** surface. A CIO can see and sign; they cannot fund / pause / kill from Tower. The board-ready export is a real green tick — board prep is one click.

---

## 7. Honest verdict

**State:** Tower is **engine-ready but pipe-thin**.

The data-model contracts and the persistence layer are real and tenant-isolated: `ai_initiatives`, `ai_initiatives_vendors`, `ai_initiative_kpis/decisions/stakeholder_notes/scenarios`, `value_states`, `move_dependencies`, `kill_criteria`, `dora_baselines`, `application_portfolio`, `ai_tool_footprint`, `discovery_instruments`. Atlas is a real agent on real substrate. The CFO band, 2×2, pressure cards, alignment view, and handoff panels are all derived from live tenant rows. Tower exports a real board-ready DOCX/XLSX. PR #2281's honest empty states are visible throughout.

But every source-system integration is **absent**. The "templates" are mostly customer-facing CSV blueprints, only one of which (Inventory → `use_cases`) has an ingestion route. The DORA / AI-tool / cloud-spend / project / CMDB / ERP tables are populated by hand-written seed scripts, not by live extractors. The Tower-side `data_integrations` rows are display fixtures, not connectors. The Atlas synthesis route, the highest-leverage narrative surface, grounds on **hardcoded** `APEX_RETAIL_PROGRAM_INSTANCES` (`tower/synthesis/route.ts:6` → `program-instances.ts:735`) — not the tenant's actual programs.

13 of 24 Tower routes are redirect-shells. The remaining 11 are substantive but linearly scroll-stacked rather than executive-prioritized. The locked design system is split: cream cream on onboard pages, white on the index. Drill-down depth disguises as same-page state in several places.

| Maturity level                                                    | Tower today?                |
| ----------------------------------------------------------------- | --------------------------- |
| Pilot-customer-ready (a real CIO would actually use it on Monday) | **no**                      |
| Demo-ready (walked through in a 30-min pitch)                     | **yes**                     |
| Engine-ready but UX-thin (data tier real, presentation sparse)    | **yes — best description**  |
| Shell (routes & labels, no real depth)                            | **no** — the engine is real |

### Single biggest gap

**No live source-system integrations.** Every dial on Tower reads from a hand-loaded substrate. A CIO who plugs Tower into their actual estate gets nothing back without a multi-week ETL effort. The schemas are correct; the pipes do not exist.

### Single highest-leverage next build

**Ship the first real connector: GitHub → `dora_baselines`** (or ServiceNow CMDB → `application_portfolio`). The schemas are already production-shaped. A working extractor — even one nightly pull behind a per-tenant OAuth token — converts Tower from a beautifully-typeset read-only surface into a real Control Tower. GitHub is the cheapest first win because OAuth is standard, deployment events are well-modelled, and DORA is the metric every engineering CFO understands. Until at least one pipe is live, every other Tower investment compounds on a fixture.

---

## Appendix — file:line evidence index

- Main page: `src/app/(maestro)/tower/page.tsx:1-637`
- DB-live read funnels: `src/lib/admin/ai-initiatives/queries.ts:140`, `:284`
- Value states: `src/lib/tower/value-states/repository.ts:64-348`, migration `supabase/migrations/20260523090000_client_extension_it_productivity.sql:347`
- Apex hardcoded card: `src/lib/tower/apex-contact-center-portfolio-fixture.ts:38-80`
- Hardcoded program instances behind synthesis: `src/lib/programs/program-instances.ts:735`
- Atlas LLM: `src/lib/atlas/llm.ts:140-221` (fallback + Anthropic call)
- Deterministic-seed read models: `src/lib/tower/ai-{portfolio-inventory,adoption-usage,cost-consumption,risk-governance,productivity-dora,tool-waste-signals,value-outcome-ledger}.ts` (each carries "no live integrations" comment block)
- Ingestion path: `src/lib/tower/ingest-portfolio.ts:49-107`
- Upload route: `src/app/api/tower/upload/route.ts:14-193`
- Templates schema: `src/scripts/templates/schema.ts:1-183`
- Onboarding catalog (hardcoded): `src/lib/tower/onboarding-catalog.ts:1-272`
- Redirect-shell evidence: `src/app/(maestro)/tower/{lens/value,activity,outcomes,projects,staff-aug,tech-stack,volumetrics,preview}/page.tsx` (all 7 lines, all `redirect()`)
- Post-signin routing: `src/lib/auth/access-routing.ts:100-132`
- Outcome report export: `src/app/api/v1/tower/outcome-report/route.ts:1-40`
- "No live Jira pipeline is connected" admission: `src/lib/tower/ai-productivity-dora.ts:1-32` (file-header comment)
- Tower-side connector fixtures (not real integrations): `scripts/seed/tower/data.ts:652-713`
