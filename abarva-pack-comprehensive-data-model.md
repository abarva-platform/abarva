# AbarVa Build Pack I · Comprehensive Client Data Model

**Date:** April 19, 2026
**Scope:** Implement the full 20-domain three-layer data model (Graph + SQL + Vector) covering cross-industry foundations plus three verticals (healthcare, financial services, retail). Canonical reference for client data going forward.
**Effort:** ~14-18 days across five phases. Phase 1 is demo-critical (4-5 days). Phases 2-5 can stretch post-demo if needed.
**Extends:** Pack H (enterprise depth) — adds 16 new data domains on top of tech_stack, projects, staff_augmentation, volumetrics already introduced.
**Why it matters:** a $10B enterprise doesn't have four tables worth of data about itself — it has tens of thousands of systems, processes, workflows, metrics. This pack gives Nexus the vocabulary to understand any enterprise the way a senior consultant does.

---

## The matrix

Each domain is captured as:
1. **Graph nodes + relationships** (Neo4j) — for traversal reasoning
2. **Structured tables** (Supabase/Postgres) — for precise metrics
3. **Vector embeddings** (Pinecone) — for semantic retrieval of narrative/context

Every client (Meridian, First Capital, Apex) gets the cross-industry domains plus their vertical's domains — never the other two verticals' domains.

### Domain summary

| # | Domain | Industry | New tables | New graph types | New Pinecone namespace |
|---|---|---|---|---|---|
| 1 | IT Infrastructure & Cloud | All | `infra_assets`, `cloud_costs` | `InfraStack`, `CloudProvider`, `Region` | `client:<id>:infra` |
| 2 | Application Landscape | All | `applications`, `integrations` | `System`, `Integration` | `client:<id>:apps` |
| 3 | Data Platform & Governance | All | `data_sources`, `data_pipelines`, `data_governance_policies` | `DataSource`, `Pipeline`, `Policy` | `client:<id>:data` |
| 4 | AI / Analytics Footprint | All | Extend `use_cases`; add `ai_models` | `AIUseCase`, `Model` | `client:<id>:ai` |
| 5 | IT Cost Model | All | `cost_centers`, `spend_breakdown` | `CostCenter` | `client:<id>:cost` |
| 6 | Engineering Productivity | All | `engineering_metrics`, `eng_teams` | `Team` | `client:<id>:eng` |
| 7 | Revenue Cycle | Healthcare | `revenue_cycle_metrics`, `claims_denials` | `RevenueCycleProcess` | `client:<id>:rcm` |
| 8 | Provider Operations | Healthcare | `provider_ops`, `clinical_units` | `OrgUnit`, `ClinicalOps` | `client:<id>:provops` |
| 9 | Clinical Workflows | Healthcare | `clinical_workflows`, `workflow_steps` | `Clinician`, `Workflow` | `client:<id>:clinical` |
| 10 | Patient Experience | Healthcare | `patient_experience`, `digital_channels` | `Patient`, `DigitalChannel` | `client:<id>:px` |
| 11 | Claims/Risk/Underwriting | FinServ | `claims_risk`, `underwriting_workflows` | `Process`, `RiskScore` | `client:<id>:claims` |
| 12 | Fraud/AML | FinServ | `fraud_metrics`, `aml_alerts` | `Transaction`, `Fraud` | `client:<id>:fraud` |
| 13 | Customer Service/Call Center | FS + Retail | `call_center_metrics`, `tickets` | `Customer`, `Agent` | `client:<id>:cs` |
| 14 | Digital Banking/CX | FinServ | `digital_metrics`, `journeys` | `User`, `Channel` | `client:<id>:digitalbanking` |
| 15 | Supply Chain/Inventory | Retail | `supply_chain`, `inventory_metrics` | `Product`, `SupplyChain` | `client:<id>:supplychain` |
| 16 | Store Operations | Retail | `store_metrics`, `stores` | `Store` | `client:<id>:stores` |
| 17 | E-commerce/Digital | Retail | `ecommerce_metrics`, `sessions_daily` | `User`, `Product` | `client:<id>:ecommerce` |
| 18 | Pricing/Promotions | Retail | `pricing_models`, `promotions` | `Strategy` | `client:<id>:pricing` |
| 19 | Customer Support/Returns | Retail | `returns_metrics`, `return_reasons` | `Order`, `Product` | `client:<id>:returns` |
| 20 | (existing Pack H) | All | `tech_stack_items`, `tech_projects`, `staff_augmentation`, `volumetrics_snapshots` | — | — |

20 domains, 40+ new tables, significant graph expansion, 20 new Pinecone namespaces per client.

---

## Phase 1 · Cross-industry foundations (days 1-5)

**Intent:** Every client gets these six domains. Highest-value for demo + broadest applicability. Must land before verticals.

Six domains: IT Infrastructure, Application Landscape, Data Platform & Governance, AI/Analytics Footprint (extend existing), IT Cost Model, Engineering Productivity.

### Migration 029 · cross-industry core

**`db/migrations/029_cross_industry_core.sql`**

```sql
BEGIN;

-- 1. IT Infrastructure & Cloud
CREATE TABLE infra_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  cloud_provider TEXT,                    -- 'AWS', 'Azure', 'GCP', 'on_prem'
  region TEXT,
  asset_type TEXT CHECK (asset_type IN ('compute', 'storage', 'network', 'database', 'ai_accelerator')),
  service_name TEXT,                      -- 'EC2', 'RDS', 'SageMaker', etc.
  monthly_cost_usd NUMERIC(12, 2),
  utilization_pct NUMERIC(5, 2),
  tags JSONB DEFAULT '{}'::jsonb,
  touches_ai BOOLEAN DEFAULT false,
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_infra_client ON infra_assets(client_id);
CREATE INDEX idx_infra_ai ON infra_assets(touches_ai) WHERE touches_ai = true;

CREATE TABLE cloud_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  month DATE NOT NULL,
  compute_usd NUMERIC(12, 2),
  storage_usd NUMERIC(12, 2),
  network_usd NUMERIC(12, 2),
  ai_services_usd NUMERIC(12, 2),
  other_usd NUMERIC(12, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, provider, month)
);

-- 2. Application Landscape
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vendor TEXT,
  deployment_model TEXT CHECK (deployment_model IN ('on_prem', 'saas', 'hybrid', 'custom_built')),
  business_function TEXT,                 -- 'ERP', 'CRM', 'EHR', 'Order Management'
  user_count INT,
  annual_cost_usd NUMERIC(12, 2),
  criticality TEXT CHECK (criticality IN ('tier1', 'tier2', 'tier3')),
  status TEXT CHECK (status IN ('active', 'sunsetting', 'in_procurement')),
  ai_enabled BOOLEAN DEFAULT false,
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source_app_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  target_app_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  integration_type TEXT CHECK (integration_type IN ('api', 'file_transfer', 'event_stream', 'rpa', 'manual')),
  data_volume_daily TEXT,                 -- 'low' | 'medium' | 'high'
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_integrations_source ON integrations(source_app_id);
CREATE INDEX idx_integrations_target ON integrations(target_app_id);

-- 3. Data Platform & Governance
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('transactional_db', 'data_warehouse', 'data_lake', 'external_feed', 'saas_export')),
  storage_platform TEXT,                  -- 'Snowflake', 'Databricks', 'S3', 'BigQuery'
  size_tb NUMERIC(10, 2),
  record_count_millions NUMERIC(12, 2),
  refresh_frequency TEXT,                 -- 'real_time', 'hourly', 'daily', 'weekly'
  quality_score NUMERIC(3, 2),            -- 0.00 to 1.00
  governance_level TEXT CHECK (governance_level IN ('ungoverned', 'partial', 'governed', 'certified')),
  data_classes TEXT[],                    -- ['PHI', 'PII', 'financial']
  ai_ready BOOLEAN DEFAULT false,
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE data_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
  tool TEXT,                              -- 'dbt', 'Airflow', 'Fivetran', 'Informatica'
  avg_latency_minutes INT,
  failure_rate_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE data_governance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  scope TEXT,                             -- 'all_phi', 'financial_transactions', etc.
  enforcement_level TEXT CHECK (enforcement_level IN ('documented', 'automated', 'audited')),
  related_regulation_codes TEXT[],        -- ['HIPAA', 'GDPR']
  last_reviewed DATE,
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. AI Models (extends existing use_cases)
CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  use_case_id UUID REFERENCES use_cases(id) ON DELETE SET NULL,
  model_family TEXT,                      -- 'Claude', 'GPT', 'Llama', 'custom'
  model_version TEXT,
  deployment_type TEXT CHECK (deployment_type IN ('vendor_api', 'hosted', 'on_prem', 'edge')),
  status TEXT CHECK (status IN ('development', 'pilot', 'production', 'deprecated')),
  monthly_cost_usd NUMERIC(12, 2),
  token_volume_monthly_millions NUMERIC(10, 2),
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. IT Cost Model
CREATE TABLE cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                     -- 'Infrastructure', 'Applications', 'Security', 'Data', 'AI Platform'
  annual_budget_usd NUMERIC(14, 2),
  spent_ytd_usd NUMERIC(14, 2),
  run_vs_change_pct NUMERIC(5, 2),        -- e.g., 70% run, 30% change
  leader_name TEXT,
  is_demo_data BOOLEAN DEFAULT false
);

CREATE TABLE spend_breakdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  cost_center_id UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
  category TEXT CHECK (category IN ('labor_internal', 'labor_contract', 'software_license', 'cloud_infra', 'services', 'hardware')),
  month DATE NOT NULL,
  amount_usd NUMERIC(12, 2),
  is_demo_data BOOLEAN DEFAULT false
);

-- 6. Engineering Productivity
CREATE TABLE eng_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  function_area TEXT,                     -- 'platform', 'data', 'ml', 'product', 'security'
  fte_count INT,
  tooling JSONB DEFAULT '{}'::jsonb,      -- {version_control, ci_cd, project_mgmt, observability}
  is_demo_data BOOLEAN DEFAULT false
);

CREATE TABLE engineering_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  team_id UUID REFERENCES eng_teams(id) ON DELETE SET NULL,
  month DATE NOT NULL,
  deploy_frequency_per_week NUMERIC(8, 2),
  lead_time_hours NUMERIC(8, 2),
  change_fail_rate_pct NUMERIC(5, 2),
  mttr_hours NUMERIC(8, 2),
  ai_tool_adoption_pct NUMERIC(5, 2),     -- Copilot adoption
  is_demo_data BOOLEAN DEFAULT false
);

NOTIFY pgrst, 'reload schema';
COMMIT;
```

### Graph extension: `db/graph/migrations/007_cross_industry.cypher`

```cypher
// New nodes
CREATE CONSTRAINT infra_stack_id IF NOT EXISTS FOR (i:InfraStack) REQUIRE i.id IS UNIQUE;
CREATE CONSTRAINT cloud_provider_name IF NOT EXISTS FOR (c:CloudProvider) REQUIRE c.name IS UNIQUE;
CREATE CONSTRAINT region_key IF NOT EXISTS FOR (r:Region) REQUIRE r.key IS UNIQUE;
CREATE CONSTRAINT system_id IF NOT EXISTS FOR (s:System) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT data_source_id IF NOT EXISTS FOR (d:DataSource) REQUIRE d.id IS UNIQUE;
CREATE CONSTRAINT pipeline_id IF NOT EXISTS FOR (p:Pipeline) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT policy_id IF NOT EXISTS FOR (p:Policy) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT cost_center_id IF NOT EXISTS FOR (cc:CostCenter) REQUIRE cc.id IS UNIQUE;
CREATE CONSTRAINT team_id IF NOT EXISTS FOR (t:Team) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT model_id IF NOT EXISTS FOR (m:Model) REQUIRE m.id IS UNIQUE;

// Seed cloud providers (idempotent)
MERGE (:CloudProvider {name: 'AWS'});
MERGE (:CloudProvider {name: 'Azure'});
MERGE (:CloudProvider {name: 'Google Cloud'});
MERGE (:CloudProvider {name: 'on_prem'});

// Key relationships (populated during ingestion)
// (Client) -[:HAS]-> (InfraStack) -[:RUNS_ON]-> (CloudProvider)
// (UseCase) -[:USES]-> (System) -[:INTEGRATES_WITH]-> (System)
// (System) -[:GENERATES]-> (DataSource) -[:GOVERNED_BY]-> (Policy)
// (Client) -[:SPENDS]-> (CostCenter) -[:FUNDS]-> (System)
// (Team) -[:BUILDS]-> (System)
// (AIUseCase) -[:USES]-> (Model)
```

### Seed data per client

Extend `src/scripts/seed/meridian-enterprise.ts` etc. to populate:

- 80-120 infrastructure assets per client (servers, cloud accounts, AI accelerators)
- 36 monthly cloud_costs rows (3 providers × 12 months history)
- 40-80 applications (scales with org size)
- 150-300 integrations (application graph density)
- 25-50 data sources across platforms
- 50-150 pipelines
- 15-30 governance policies
- 20-40 AI models (mostly tied to use_cases)
- 5-10 cost centers with realistic run/change splits
- 60 months of spend_breakdown per cost center × category
- 8-15 engineering teams
- 24 months of engineering metrics per team

### Pinecone ingestion

For each client, embed:
- **Infra configs and cost narratives** → `client:<id>:infra`
- **Application descriptions and architecture notes** → `client:<id>:apps`
- **Semantic data catalog descriptions** → `client:<id>:data`
- **Cost narratives and rationale** → `client:<id>:cost`
- **Engineering productivity context** → `client:<id>:eng`

Each embedded document gets metadata: `domain`, `as_of_date`, `source_system`.

### Retrieval integration

Extend `assembleRetrievalContext` (Pack B Phase 6 + Pack C Phase D) to include cross-industry namespaces when the conversation topic overlaps:

```typescript
// In retrieval router
if (topicMatches(['infrastructure', 'cloud', 'cost', 'spend'])) {
  namespaces.push(`client:${clientId}:infra`, `client:${clientId}:cost`);
}
if (topicMatches(['application', 'system', 'integration'])) {
  namespaces.push(`client:${clientId}:apps`);
}
if (topicMatches(['data', 'governance', 'pipeline', 'quality'])) {
  namespaces.push(`client:${clientId}:data`);
}
// ... etc
```

### Commit sequence

```
feat(data-model): migration 029 — cross-industry foundations (infra, apps, data, cost, eng)
feat(data-model): graph extension — InfraStack, System, DataSource, Policy, CostCenter, Team, Model
feat(data-model): seed cross-industry data for three composite clients at enterprise scale
feat(data-model): retrieval integration for cross-industry Pinecone namespaces
```

---

## Phase 2 · Healthcare vertical (days 6-9)

**Intent:** Deepen Meridian specifically. Four domains: Revenue Cycle, Provider Operations, Clinical Workflows, Patient Experience. This is where Meridian becomes genuinely enterprise-credible in healthcare.

### Migration 030 · healthcare vertical

**`db/migrations/030_healthcare_domains.sql`**

```sql
BEGIN;

-- 7. Revenue Cycle
CREATE TABLE revenue_cycle_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_claims_count INT,
  denial_rate_pct NUMERIC(5, 2),
  days_in_ar NUMERIC(5, 1),
  cost_per_claim_usd NUMERIC(8, 2),
  first_pass_resolution_rate_pct NUMERIC(5, 2),
  clean_claim_rate_pct NUMERIC(5, 2),
  net_collection_rate_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, month)
);

CREATE TABLE claims_denials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  denial_category TEXT CHECK (denial_category IN ('authorization', 'eligibility', 'coding', 'documentation', 'timely_filing', 'other')),
  month DATE NOT NULL,
  count INT,
  avg_value_usd NUMERIC(10, 2),
  recoverable_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false
);

-- 8. Provider Operations
CREATE TABLE clinical_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit_type TEXT CHECK (unit_type IN ('hospital', 'clinic', 'ed', 'or', 'icu', 'specialty')),
  location TEXT,
  staff_count INT,
  annual_patient_volume INT,
  is_demo_data BOOLEAN DEFAULT false
);

CREATE TABLE provider_ops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES clinical_units(id) ON DELETE SET NULL,
  month DATE NOT NULL,
  patient_throughput INT,
  avg_visit_minutes NUMERIC(5, 1),
  utilization_pct NUMERIC(5, 2),
  nurse_to_patient_ratio NUMERIC(4, 2),
  overtime_hours INT,
  is_demo_data BOOLEAN DEFAULT false
);

-- 9. Clinical Workflows
CREATE TABLE clinical_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  workflow_name TEXT NOT NULL,            -- 'ambulatory visit documentation', 'inpatient admission', 'discharge planning'
  specialty TEXT,
  total_steps INT,
  avg_documentation_minutes NUMERIC(5, 1),
  avg_turnaround_minutes NUMERIC(5, 1),
  clinician_satisfaction_score NUMERIC(3, 1),
  is_demo_data BOOLEAN DEFAULT false
);

CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES clinical_workflows(id) ON DELETE CASCADE,
  step_order INT,
  step_name TEXT,
  avg_duration_minutes NUMERIC(5, 1),
  bottleneck_flag BOOLEAN DEFAULT false
);

-- 10. Patient Experience
CREATE TABLE digital_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                     -- 'patient portal', 'mobile app', 'call center', 'chat'
  channel_type TEXT,
  monthly_active_users INT,
  is_demo_data BOOLEAN DEFAULT false
);

CREATE TABLE patient_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  channel_id UUID REFERENCES digital_channels(id),
  avg_wait_time_minutes NUMERIC(5, 1),
  appointment_conversion_rate_pct NUMERIC(5, 2),
  portal_adoption_pct NUMERIC(5, 2),
  nps_score NUMERIC(4, 1),
  hcahps_score NUMERIC(4, 1),
  is_demo_data BOOLEAN DEFAULT false
);

NOTIFY pgrst, 'reload schema';
COMMIT;
```

### Graph extension: `008_healthcare.cypher`

```cypher
CREATE CONSTRAINT rc_process_id IF NOT EXISTS FOR (r:RevenueCycleProcess) REQUIRE r.id IS UNIQUE;
CREATE CONSTRAINT clinical_ops_id IF NOT EXISTS FOR (c:ClinicalOps) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT clinician_id IF NOT EXISTS FOR (c:Clinician) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT workflow_id IF NOT EXISTS FOR (w:Workflow) REQUIRE w.id IS UNIQUE;
CREATE CONSTRAINT patient_id IF NOT EXISTS FOR (p:Patient) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT digital_channel_id IF NOT EXISTS FOR (d:DigitalChannel) REQUIRE d.id IS UNIQUE;

// Healthcare relationship patterns:
// (UseCase) -[:IMPACTS]-> (RevenueCycleProcess)
// (OrgUnit) -[:RUNS]-> (ClinicalOps)
// (Clinician) -[:PERFORMS]-> (Workflow)
// (Patient) -[:USES]-> (DigitalChannel)
```

### Seed data — Meridian specifically

Realistic numbers for a $14B healthcare IDN:

- **Revenue cycle**: monthly denial rate 8.2% (industry median ~10%), 38 days in AR, 42,000 claims/month, $95M monthly claim value
- **Clinical units**: 9 hospitals, 142 clinics, 18 ED units, 68 OR suites, 24 ICUs, 32 specialty units
- **Clinical workflows**: 45 workflows across specialties, ambulatory visit doc avg 14 minutes, inpatient admit avg 38 minutes
- **Patient experience**: patient portal 67% adoption, NPS 48, HCAHPS 72, avg wait time 24 minutes ED

### Pinecone namespaces

- `client:meridian:rcm` — denial patterns, workflow descriptions, policy narratives
- `client:meridian:provops` — operational workflow embeddings
- `client:meridian:clinical` — clinical notes patterns, workflow documentation
- `client:meridian:px` — patient experience feedback themes

### Commit

```
feat(data-model): migration 030 — healthcare vertical (RCM, ProvOps, Clinical, PX)
feat(data-model): Meridian seed with realistic healthcare domain data
```

---

## Phase 3 · Financial Services vertical (days 10-13)

**Intent:** Deepen First Capital. Four domains: Claims/Risk/Underwriting, Fraud/AML, Customer Service/Call Center (shared), Digital Banking/CX.

### Migration 031 · FS vertical

```sql
BEGIN;

-- 11. Claims/Risk/Underwriting
CREATE TABLE underwriting_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  workflow_name TEXT NOT NULL,            -- 'commercial loan underwriting', 'mortgage UW', 'credit card'
  avg_processing_days NUMERIC(5, 1),
  approval_rate_pct NUMERIC(5, 2),
  avg_loss_rate_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false
);

CREATE TABLE claims_risk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_claims_count INT,
  avg_claim_value_usd NUMERIC(10, 2),
  fraud_rate_pct NUMERIC(5, 2),
  processing_time_days NUMERIC(5, 1),
  straight_through_pct NUMERIC(5, 2),     -- STP rate, % fully automated
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, month)
);

-- 12. Fraud/AML
CREATE TABLE fraud_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  transactions_analyzed_millions NUMERIC(10, 2),
  alerts_generated_thousands NUMERIC(8, 1),
  false_positive_rate_pct NUMERIC(5, 2),
  fraud_loss_usd_thousands NUMERIC(10, 2),
  fraud_recovery_rate_pct NUMERIC(5, 2),
  detection_rate_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, month)
);

CREATE TABLE aml_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  alerts_generated INT,
  sar_filed INT,                          -- Suspicious Activity Reports
  investigation_hours_avg NUMERIC(6, 1),
  sla_adherence_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false
);

-- 13. Customer Service/Call Center
CREATE TABLE call_center_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_contacts_thousands NUMERIC(8, 1),
  aht_seconds NUMERIC(6, 1),              -- average handle time
  first_contact_resolution_pct NUMERIC(5, 2),
  csat_score NUMERIC(3, 1),
  agent_fte_count INT,
  automation_rate_pct NUMERIC(5, 2),      -- % handled by AI/IVR
  transfer_rate_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, month)
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category TEXT,
  month DATE NOT NULL,
  count INT,
  avg_resolution_hours NUMERIC(6, 1),
  is_demo_data BOOLEAN DEFAULT false
);

-- 14. Digital Banking/CX
CREATE TABLE digital_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  channel TEXT CHECK (channel IN ('mobile_app', 'web_portal', 'chat', 'api')),
  mau_thousands NUMERIC(8, 1),
  dau_thousands NUMERIC(8, 1),
  session_count_millions NUMERIC(10, 2),
  conversion_rate_pct NUMERIC(5, 2),
  retention_30d_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, month, channel)
);

CREATE TABLE journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  journey_name TEXT,                      -- 'account opening', 'loan application', 'wire transfer'
  avg_completion_minutes NUMERIC(6, 1),
  drop_off_rate_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false
);

NOTIFY pgrst, 'reload schema';
COMMIT;
```

### Graph extension: `009_finserv.cypher`

```cypher
CREATE CONSTRAINT process_id IF NOT EXISTS FOR (p:Process) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT risk_score_id IF NOT EXISTS FOR (r:RiskScore) REQUIRE r.id IS UNIQUE;
CREATE CONSTRAINT transaction_id IF NOT EXISTS FOR (t:Transaction) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT customer_id IF NOT EXISTS FOR (c:Customer) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT agent_id IF NOT EXISTS FOR (a:Agent) REQUIRE a.id IS UNIQUE;
CREATE CONSTRAINT channel_id IF NOT EXISTS FOR (c:Channel) REQUIRE c.id IS UNIQUE;

// Key patterns:
// (Process) -[:GENERATES]-> (RiskScore)
// (Transaction) -[:FLAGGED_AS]-> (Fraud)
// (Customer) -[:INTERACTS_WITH]-> (Agent)
// (User) -[:USES]-> (Channel)
```

### Seed — First Capital

Realistic for $28B regional bank:

- Claims/underwriting: 140K commercial loan applications/year, 1.2M mortgage, avg processing 7 days commercial / 12 days mortgage
- Fraud: 180M transactions/month analyzed, 22K alerts/month, 8% false positive rate, $4.2M monthly fraud losses, 78% detection rate
- Call center: 1.8M contacts/month, 340 sec AHT, 72% FCR, 3,800 agents, 24% automation
- Digital banking: 8.4M mobile MAU, 72% retention 30-day, account opening journey 12 minutes / 18% drop-off

### Commit

```
feat(data-model): migration 031 — FinServ vertical (claims, fraud, call center, digital banking)
feat(data-model): First Capital seed with realistic FS domain data
```

---

## Phase 4 · Retail vertical (days 14-16)

**Intent:** Deepen Apex. Five domains: Supply Chain, Store Operations, E-commerce, Pricing/Promotions, Customer Support/Returns.

### Migration 032 · Retail vertical

```sql
BEGIN;

-- 15. Supply Chain/Inventory
CREATE TABLE supply_chain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  inventory_turns_annual NUMERIC(5, 2),
  days_inventory_outstanding NUMERIC(5, 1),
  stockout_rate_pct NUMERIC(5, 2),
  overstock_rate_pct NUMERIC(5, 2),
  demand_forecast_accuracy_pct NUMERIC(5, 2),
  supplier_otd_pct NUMERIC(5, 2),         -- on-time delivery
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, month)
);

CREATE TABLE inventory_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sku_category TEXT,
  month DATE NOT NULL,
  avg_inventory_units_thousands NUMERIC(10, 1),
  sell_through_rate_pct NUMERIC(5, 2),
  markdown_depth_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false
);

-- 16. Store Operations
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  store_number TEXT,
  format TEXT,                            -- 'flagship', 'big_box', 'urban_small', 'outlet'
  sqft INT,
  annual_revenue_usd NUMERIC(12, 2),
  is_demo_data BOOLEAN DEFAULT false
);

CREATE TABLE store_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  month DATE NOT NULL,
  sales_usd NUMERIC(12, 2),
  transactions INT,
  avg_basket_size_usd NUMERIC(8, 2),
  labor_utilization_pct NUMERIC(5, 2),
  sales_per_sqft_usd NUMERIC(8, 2),
  is_demo_data BOOLEAN DEFAULT false
);

-- 17. E-commerce/Digital
CREATE TABLE ecommerce_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  sessions_millions NUMERIC(10, 2),
  conversion_rate_pct NUMERIC(5, 2),
  avg_order_value_usd NUMERIC(8, 2),
  cart_abandonment_rate_pct NUMERIC(5, 2),
  bounce_rate_pct NUMERIC(5, 2),
  mobile_share_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, month)
);

CREATE TABLE sessions_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sessions INT,
  conversions INT,
  revenue_usd NUMERIC(12, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, date)
);

-- 18. Pricing/Promotions
CREATE TABLE pricing_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT,
  strategy TEXT CHECK (strategy IN ('cost_plus', 'competitive', 'dynamic', 'promotional')),
  scope TEXT,                             -- 'all_skus', 'category', 'channel'
  gross_margin_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false
);

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  promotion_type TEXT,                    -- 'percent_off', 'bogo', 'loyalty_reward'
  start_date DATE,
  end_date DATE,
  lift_pct NUMERIC(5, 2),
  margin_impact_usd NUMERIC(12, 2),
  is_demo_data BOOLEAN DEFAULT false
);

-- 19. Customer Support/Returns
CREATE TABLE returns_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  return_rate_pct NUMERIC(5, 2),
  avg_resolution_hours NUMERIC(6, 1),
  return_revenue_impact_usd NUMERIC(12, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, month)
);

CREATE TABLE return_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  reason TEXT,                            -- 'size', 'fit', 'defective', 'not_as_described'
  month DATE NOT NULL,
  count INT,
  is_demo_data BOOLEAN DEFAULT false
);

NOTIFY pgrst, 'reload schema';
COMMIT;
```

### Graph extension: `010_retail.cypher`

```cypher
CREATE CONSTRAINT product_id IF NOT EXISTS FOR (p:Product) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT supply_chain_id IF NOT EXISTS FOR (s:SupplyChain) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT store_id IF NOT EXISTS FOR (s:Store) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT strategy_id IF NOT EXISTS FOR (s:Strategy) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT order_id IF NOT EXISTS FOR (o:Order) REQUIRE o.id IS UNIQUE;

// Retail patterns:
// (Product) -[:MOVES_THROUGH]-> (SupplyChain)
// (Store) -[:SELLS]-> (Product)
// (User) -[:BUYS]-> (Product)
// (Product) -[:PRICED_BY]-> (Strategy)
// (Order) -[:RETURNED]-> (Product)
```

### Seed — Apex

Realistic for $18B retailer (480 stores):

- Supply chain: 5.2 annual turns, 12.8% stockout rate in tier-2 SKUs, 72% demand forecast accuracy
- Stores: 480 stores × 24 months metrics, avg $37K sales/store/day, sales per sqft $420
- E-commerce: 38M monthly sessions, 3.1% conversion, $78 AOV, 68% cart abandonment, 62% mobile share
- Returns: 18.4% return rate overall (fashion-heavy), top reason "fit" (42% of returns)

### Commit

```
feat(data-model): migration 032 — Retail vertical (supply chain, stores, ecommerce, pricing, returns)
feat(data-model): Apex seed with realistic retail domain data
```

---

## Phase 5 · Intelligent retrieval across domains (days 17-18)

**Intent:** Nexus now has 20 domains of data per client. Retrieval needs to know which domains are relevant to any given conversation. Currently retrieval is topic-matched at coarse granularity — refine it.

### Topic → domain mapping

**`src/lib/agent/domain-router.ts`**

```typescript
export const DOMAIN_KEYWORDS: Record<string, string[]> = {
  infra: ['cloud', 'compute', 'storage', 'network', 'infrastructure', 'latency', 'capacity', 'ec2', 'rds'],
  apps: ['application', 'system', 'integration', 'api', 'middleware', 'vendor', 'saas'],
  data: ['data', 'pipeline', 'governance', 'quality', 'lineage', 'catalog', 'etl'],
  cost: ['cost', 'spend', 'budget', 'tco', 'roi', 'run_rate'],
  eng: ['deploy', 'cycle time', 'productivity', 'team', 'sprint', 'copilot'],
  rcm: ['revenue cycle', 'denial', 'claims', 'billing', 'ar', 'coding'],
  provops: ['throughput', 'capacity', 'staffing', 'scheduling', 'unit', 'hospital', 'clinic'],
  clinical: ['workflow', 'documentation', 'clinician', 'encounter', 'note', 'emr'],
  px: ['patient', 'portal', 'wait time', 'nps', 'hcahps', 'experience'],
  claims: ['underwriting', 'loan', 'mortgage', 'risk score', 'credit'],
  fraud: ['fraud', 'aml', 'suspicious', 'alert', 'transaction', 'sar'],
  cs: ['call center', 'aht', 'csat', 'agent', 'ticket', 'contact'],
  digitalbanking: ['mobile app', 'account opening', 'transfer', 'funnel', 'wire'],
  supplychain: ['inventory', 'stockout', 'forecast', 'supplier', 'logistics'],
  stores: ['store', 'sqft', 'retail', 'traffic', 'basket'],
  ecommerce: ['ecommerce', 'conversion', 'cart', 'aov', 'checkout'],
  pricing: ['pricing', 'promotion', 'markdown', 'margin', 'discount'],
  returns: ['return', 'refund', 'exchange', 'damaged']
};

export function detectRelevantDomains(
  query: string,
  clientIndustry: string
): string[] {
  const q = query.toLowerCase();
  const matched: string[] = [];
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some(kw => q.includes(kw))) matched.push(domain);
  }
  // Filter: only return domains applicable to this client's industry
  return matched.filter(d => isDomainApplicable(d, clientIndustry));
}
```

### Retrieval fan-out

```typescript
// In assembleRetrievalContext
const relevantDomains = detectRelevantDomains(args.userQuery, args.industry);

const pineconeQueries = relevantDomains.map(domain =>
  queryPinecone(queryVector, `client:${args.clientId}:${domain}`, { topK: 2 })
);

// In parallel: graph traversal for matching domain
const graphQueries = relevantDomains.map(domain =>
  queryGraphForDomain(domain, args.clientId)
);

const [chunks, graphFacts] = await Promise.all([
  Promise.all(pineconeQueries),
  Promise.all(graphQueries)
]);
```

### System prompt domain blocks

Each matched domain gets a labeled section in the system prompt:

```
DATA PLATFORM & GOVERNANCE (Meridian)
  From graph:
  - 32 data sources across Snowflake (18), S3 (8), RDS (6)
  - 14 governed datasets, 9 partial governance, 9 ungoverned
  - Governance policies: HIPAA-aligned PHI policy (automated), GDPR policy (documented only)
  - 98 pipelines, avg latency 42min, 2.1% failure rate

  From vector retrieval:
  [Snowflake data catalog] Patient claims warehouse serves 18 downstream
  applications. Quality score 0.87. Last certified 2025-11-20 for HIPAA...
```

Nexus now can reason across:
- "This use case needs high-quality PHI data"
- "Meridian has 14 certified datasets tagged PHI"
- "One pipeline is 2.1% failure rate — mention as risk"

### Commit

```
feat(data-model): domain router + intelligent retrieval fan-out across 20 client data domains
```

---

## Phase 6 · Template expansion for client onboarding

**Intent:** Pack G shipped 7 templates for the Tower's 5 dimensions. This phase adds 20 domain templates for comprehensive client data capture.

Extend `src/scripts/templates/schema.ts` with domain-per-template entries. Running `npm run templates:build` generates:

- `client-infra.csv`, `client-apps.csv`, `client-data.csv`, `client-cost.csv`, `client-eng.csv` (cross-industry)
- Healthcare templates: `client-rcm.csv`, `client-provops.csv`, `client-clinical.csv`, `client-px.csv`
- FS templates: `client-claims.csv`, `client-fraud.csv`, `client-cs.csv`, `client-digitalbanking.csv`
- Retail templates: `client-supplychain.csv`, `client-stores.csv`, `client-ecommerce.csv`, `client-pricing.csv`, `client-returns.csv`
- Master `client-bundle.xlsx` with all relevant templates per industry as sheets

Onboarding flow in Pack G auto-selects which templates to surface based on industry.

### Commit

```
feat(data-model): 20 domain templates for client onboarding (CSV + Excel bundles)
```

---

## Acceptance

### Data depth test

Anand opens Meridian as Maestro and asks Nexus:

*"Sarah — given the $14B scale, what should our Phase 1 diagnostic prioritize?"*

Nexus responds with specificity that would only be possible with the matrix populated:

*"Based on Meridian's footprint — 42 AI use cases, 98 data pipelines, $710M IT budget, 8.2% denial rate, 68% cart-abandonment in your patient portal, avg 14-min documentation per encounter — the highest-ROI intersection is revenue cycle. Your denial rate is 2 points above HFMA median and your first-pass resolution is 78% vs median 84%. F008 is triggering on Copilot Clinical ROI, but the 6-month opportunity in RCM looks larger — $14M in recoverable denials per year vs $8M in documentation time-savings. Governance posture on RCM data is strong (certified quality 0.91), so it's a clean play. Want me to draft that as the Phase 1 focus?"*

Every number is backed by actual data in the 20-domain model. Not invention.

### Industry switch test

Switch to First Capital. Ask similar question. Nexus references fraud false-positive rates, commercial loan UW processing days, call center AHT — not healthcare metrics.

Switch to Apex. Nexus references stockout rates, cart abandonment, returns by reason — not FS metrics.

Each client's Nexus feels like it knows that business deeply. Because it does.

### Client view test

Sarah (client_viewer at Meridian) logs in. Opens the Tower. Sees healthcare-specific cards in Tower (RCM metrics, clinical workflow bottlenecks, patient experience trends) that Apex's Maria would never see. Industry-appropriate depth, automatically.

---

## Rollout priorities

| Phase | Days | Demo-critical? | Can defer? |
|---|---|---|---|
| 1 · Cross-industry core | 1-5 | **Yes** — all clients need it | No |
| 2 · Healthcare | 6-9 | **Yes** for Meridian demo | No |
| 3 · FinServ | 10-13 | Medium — if First Capital demo happens | Yes if healthcare-only demo |
| 4 · Retail | 14-16 | Medium — if Apex demo happens | Yes if healthcare-only demo |
| 5 · Intelligent retrieval | 17-18 | Yes — needs domains populated first | No |
| 6 · Template expansion | parallel | Low — post-demo | Yes |

**Minimum demo set:** Phase 1 + Phase 2 + Phase 5 (~11 days). Shows Meridian with real scale + cross-industry plus healthcare vertical depth + intelligent retrieval working.

**Post-demo completion:** Phases 3, 4, 6 as First Capital and Apex come into focus.

---

## Paste-to-Claude-Code

> "Pack I · Comprehensive Client Data Model. Six phases covering the 20-domain three-layer matrix from Anand's GPT framework. Extends Pack H with cross-industry foundations (infra, apps, data, cost, eng) and three verticals (healthcare, finserv, retail). Each phase: migration + graph cypher + seed data for relevant composites + Pinecone namespaces + retrieval integration. Worktree `feat/client-data-model` from main. Phase 1 is demo-critical; phases 3 and 4 can defer if we're healthcare-only for demo. Respects forbidden-name guard throughout — all vendors and firms from whitelisted lists only. Run `npm run seed:enterprise` after each phase lands to refresh the three composite clients. Report after each phase."

---

## What this pack ships

Nexus goes from knowing *"Meridian has 10 use cases and spends $332k/month on AI"* to knowing *"Meridian runs 98 data pipelines across Snowflake + S3 + RDS, handles 42K claims/month with 8.2% denial rate, operates 45 clinical workflows averaging 14 minutes documentation, and has an active AI governance policy automated for PHI but only documented for GDPR — and these facts inform every conversation Nexus has with Sarah."*

That's the shift from demo product to enterprise advisory system.
