# AbarVa Build Pack H · Enterprise-Scale Data + Single-Client Experience

**Date:** April 19, 2026
**Scope:** Two related fixes. (1) Re-seed the three composite clients at realistic $10B+ enterprise scale — deep tech stack, full financials, projects, staff aug, volumetrics. (2) Role-based chrome so clients never see a portfolio selector — their view feels single-tenant.
**Effort:** ~5 days. Fits Week 3. High impact on demo credibility + principle alignment.
**Why it matters:** two separate demo-killers. A CTO looks at Meridian's current $332k/month AI spend and instantly knows it's a toy (real $14B IDN is at $8-12M/month). A client user sees a toggle showing other clients' names and feels like row 23 in a database, not the platform's tenant. Both undermine the product before anyone interacts with it.

---

## The two problems

### Problem 1 · Scale mismatch

**Current Meridian seed** (from live prod inspection):
- 10 use cases
- $332k/month cost — **$4M/year**
- $22 verified value, $286k projected
- 3,130 DAU, 11,235 WAU, 59% penetration
- No hardware/services/staff spend tracked
- No projects, no volumetrics beyond seats

**A real $14B healthcare IDN** (composite realistic scale):
- 30-50 AI use cases across 8 functional domains
- **$8-12M/month** AI-related spend ($100-150M/year)
- IT budget total: 5% of revenue = **$700M/year**
- Tech stack: **150-200 vendors** across hardware, software, services, SaaS
- 40-60 active technology projects, 22+ with AI component
- Staff augmentation: **$35M/year** across 120+ contractors
- Verified value: $15-30M; projected: $120-200M
- Daily volumetrics: millions of API calls, hundreds of millions of tokens, TBs of data processed

The gap isn't small. Current seed is ~3% of realistic scale across most dimensions. Anyone from enterprise will see it in seconds.

### Problem 2 · Client toggle violates single-tenant principle

User memory: *"products are invisible to clients — the engagement is the product."*

Current `/tower`: client selector shows all clients across the top. Correct for Maestro (Anand operating across portfolio). **Wrong for client users** (Sarah logging in to see Meridian's Tower).

When Sarah opens the product, she should see:

- Her org's name in the chrome (not AbarVa dominant)
- Her org's Tower (only her data, no selector)
- Her org's engagements (only hers)
- No hint that other clients exist

For her, AbarVa is single-tenant.

For Anand, AbarVa is the operator cockpit — he sees portfolio.

Same app, different chrome by role.

---

## Phase 1 · Data model extensions

**Intent:** Add the tables we need to represent a $10B+ enterprise's tech posture faithfully.

### Migration 027 · tech stack, projects, staff aug, volumetrics

**`db/migrations/027_enterprise_depth.sql`**

```sql
BEGIN;

-- Full tech stack beyond just AI vendors
CREATE TABLE tech_stack_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'hardware', 'infrastructure', 'platform', 'business_app',
    'data_platform', 'security', 'collaboration', 'dev_tools',
    'ai_platform', 'ai_model', 'service', 'staff_aug'
  )),
  vendor_name TEXT NOT NULL,
  product_name TEXT,
  deployment_model TEXT CHECK (deployment_model IN ('on_prem', 'saas', 'hybrid', 'cloud_managed', 'service_contract')),
  annual_spend_usd NUMERIC(14, 2),
  contract_start DATE,
  contract_end DATE,
  seat_count INT,
  owning_function TEXT,
  touches_ai BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('active', 'in_procurement', 'sunsetting', 'terminated')) DEFAULT 'active',
  notes TEXT,
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tech_stack_client ON tech_stack_items(client_id);
CREATE INDEX idx_tech_stack_category ON tech_stack_items(category);
CREATE INDEX idx_tech_stack_ai ON tech_stack_items(touches_ai) WHERE touches_ai = true;

-- Active technology projects
CREATE TABLE tech_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  program_domain TEXT,  -- 'cloud_migration', 'data_platform', 'ai_initiative', 'security_uplift', etc.
  status TEXT CHECK (status IN ('ideation', 'approved', 'in_flight', 'stabilizing', 'completed', 'paused', 'cancelled')),
  start_date DATE,
  planned_end_date DATE,
  total_budget_usd NUMERIC(14, 2),
  spent_to_date_usd NUMERIC(14, 2),
  exec_sponsor TEXT,
  touches_ai BOOLEAN DEFAULT false,
  linked_use_case_ids UUID[],
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tech_projects_client ON tech_projects(client_id);
CREATE INDEX idx_tech_projects_status ON tech_projects(status);

-- Staff augmentation spend (contractors, SI engagements, managed services)
CREATE TABLE staff_augmentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  engagement_type TEXT CHECK (engagement_type IN ('staff_aug', 'managed_service', 'fixed_bid', 'retainer')),
  function_area TEXT,  -- 'data_engineering', 'ml_engineering', 'security', 'pm', etc.
  headcount_fte INT,
  annual_spend_usd NUMERIC(14, 2),
  contract_start DATE,
  contract_end DATE,
  touches_ai BOOLEAN DEFAULT false,
  notes TEXT,
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_staff_aug_client ON staff_augmentation(client_id);

-- Volumetrics snapshot (daily rollup)
CREATE TABLE volumetrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  api_calls_millions NUMERIC(10, 2),
  tokens_billions NUMERIC(10, 2),
  storage_tb NUMERIC(10, 2),
  queries_millions NUMERIC(10, 2),
  active_models INT,
  data_pipelines INT,
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, snapshot_date)
);

CREATE INDEX idx_volumetrics_client_date ON volumetrics_snapshots(client_id, snapshot_date DESC);

-- Client financial profile (one row per client)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS annual_revenue_usd NUMERIC(14, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS it_budget_usd NUMERIC(14, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ai_budget_usd NUMERIC(14, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS employee_count INT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS operational_units INT;  -- hospitals, branches, stores
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_description TEXT;

NOTIFY pgrst, 'reload schema';
COMMIT;
```

### Commit

```
feat(enterprise-depth): migration 027 — tech stack, projects, staff aug, volumetrics, client financials
```

---

## Phase 2 · Enterprise-scale composite clients

**Intent:** Re-seed three demo clients at realistic scale. Every row respects naming rules (no forbidden vendor/firm names).

### Client 1 · Meridian Health System

**Financial profile**

| Metric | Value |
|---|---|
| Annual revenue | $14.2B |
| Employees | 28,400 |
| Operational units | 9 hospitals, 142 outpatient clinics, 3 research centers |
| IT budget | $710M/year (5% of revenue) |
| AI budget | $108M/year (15% of IT budget) |
| Geography | 4 states, US Midwest |

**Use cases — 38 total across 8 domains**

| Domain | Count | Examples |
|---|---|---|
| Clinical documentation | 5 | Ambient doc, visit summarization, chart summarization, discharge instructions, order entry copilot |
| Revenue cycle | 6 | Claims triage, coding audit, denial prediction, prior auth assistant, charge capture, appeals drafting |
| Operations | 5 | Staffing forecast, bed capacity, supply chain demand, OR scheduling, ED flow |
| Patient experience | 4 | Patient messaging, appointment triage, interpreter assist, portal Q&A |
| Clinical decision support | 4 | Imaging assist (cardiology, radiology), sepsis early warning, medication interaction, risk stratification |
| Research & analytics | 4 | Trial matching, cohort builder, genomic analysis, real-world evidence |
| HR & admin | 6 | Recruiting screen, IT service desk, finance reporting, policy Q&A, learning assistant, retention risk |
| Shadow / undocumented | 4 | Physician-sourced GPT usage, marketing copy generation, HR resume screening without governance, researcher local Llama deployments |

**Financials at scale**

| Dimension | Monthly | Annual |
|---|---|---|
| LLM/AI API spend | $2.8M | $33.6M |
| Compute (GPU, cloud ML) | $1.9M | $22.8M |
| AI-related SaaS licenses | $1.4M | $16.8M |
| Staff aug on AI projects | $2.1M | $25.2M |
| Services/SI AI-adjacent | $0.9M | $10.8M |
| Data platform (Snowflake, etc.) | $0.8M | $9.6M |
| **Total AI-adjacent** | **$9.9M** | **$119M** |

That's closer to what a $14B IDN actually spends.

**Tech stack — 180 items**

Representative mix (full list in seed script):

| Category | Count | Representative vendors (naming-rules compliant) |
|---|---|---|
| Hardware | 22 | Lenovo, Cisco, Arista, Pure Storage, NetApp, Juniper |
| Infrastructure / Cloud | 14 | AWS, Azure, Google Cloud, VMware, Red Hat |
| Platform | 18 | Kubernetes, Databricks, Snowflake, Informatica, Confluent |
| Business apps | 28 | Epic (EHR), Oracle (ERP), Workday (HR), Kronos (workforce), SAP (finance) |
| Security | 19 | CrowdStrike, Palo Alto Networks, Okta, Zscaler, Rapid7 |
| Collaboration | 9 | Microsoft 365, Zoom, Slack, ServiceNow, Atlassian |
| Dev tools | 11 | GitHub, GitLab, JetBrains, Docker, Terraform |
| AI platforms | 14 | Anthropic, OpenAI, Microsoft Copilot, Azure OpenAI, Google Vertex, Hugging Face, Scale AI, Nuance DAX, Epic Cognitive, Nvidia AI Enterprise |
| Services / SI | 18 | Composite names only — "Fortune-500 cloud SI," "healthcare-focused data consultancy," "regional MSP" |
| Staff aug agencies | 12 | Composite names — "national dev staffing firm," "offshore data engineering partner" |
| Other SaaS | 15 | Various small/mid apps |

**Projects — 45 active, 22 with AI component**

Representative examples:

- EHR modernization (Epic 2026 uplift) — $62M budget, 24 months, Phase 2
- Enterprise data platform (Snowflake + dbt) — $38M, 18 months, Phase 3
- AI governance program — $4.2M, ongoing
- Cloud migration Wave 3 — $22M
- Ambient clinical documentation scale-up — $18M
- Revenue cycle AI — $12M
- Cybersecurity modernization — $28M
- Patient engagement platform — $14M
- Research data platform — $22M
- Staff augmentation consolidation — $6M savings target
- ... 35 more

**Staff augmentation — 14 engagements, $35M/year**

- Data engineering team (45 FTE, offshore partner) — $9.2M
- ML engineering bench (22 FTE, onshore) — $8.8M
- Security analysts (18 FTE, managed) — $5.4M
- Program managers for AI portfolio (8 FTE) — $2.4M
- ... 10 more

**Volumetrics (daily)**

- API calls: 42M
- Tokens: 8.2B
- Active models: 47
- Data pipelines: 312
- Storage: 4.8 PB
- Monthly queries across platforms: 580M

### Client 2 · First Capital Financial

**Composite $28B regional bank**

- Revenue: $28B (consumer + commercial + wealth)
- IT budget: $2.1B/year (7.5% of revenue — higher than healthcare avg for FinServ)
- AI budget: $180M/year
- Employees: 34,000
- Branches: 890, ATMs: 2,400
- Geography: 6 states, US East Coast
- Use cases: 32 across advisor copilot, underwriting, fraud, CX, compliance, ops
- Monthly AI-adjacent spend: $14M
- Tech stack: 210 items (FinServ stacks are typically deeper — more regulatory tools)
- Projects: 58 active, 28 AI-adjacent
- Staff aug: $52M/year (heavy in ML engineering + compliance)

### Client 3 · Apex Retail Group

**Composite $18B omnichannel retailer**

- Revenue: $18B
- IT budget: $540M/year (3% of revenue — typical for retail)
- AI budget: $58M/year
- Employees: 72,000 (retail-heavy)
- Stores: 480, DCs: 12, e-commerce: yes
- Geography: National US
- Use cases: 28 across personalization, demand forecast, HR, CX, supply chain, loss prevention
- Monthly AI-adjacent spend: $5.4M
- Tech stack: 140 items
- Projects: 36 active, 18 AI-adjacent
- Staff aug: $18M/year

### Seed scripts

One orchestrator per client:

```
src/scripts/seed/meridian-enterprise.ts
src/scripts/seed/firstcapital-enterprise.ts
src/scripts/seed/apex-enterprise.ts
src/scripts/seed/_shared/
  ├ use-case-library-healthcare.ts
  ├ use-case-library-finserv.ts
  ├ use-case-library-retail.ts
  ├ vendor-whitelist.ts    (naming-rules compliant vendor list)
  ├ project-templates.ts
  └ volumetric-profiles.ts  (daily snapshots for last 90 days)
```

Each script:
1. Upserts client with financial profile
2. Inserts 30-50 use cases
3. Inserts adoption/value/risk/cost metrics per use case (scaled realistically)
4. Inserts 140-210 tech stack items
5. Inserts 36-58 projects
6. Inserts 12-14 staff aug engagements
7. Inserts 90 days of daily volumetric snapshots
8. Generates 8-12 contradictions across dimensions

Run all:
```bash
npm run seed:enterprise -- --clients meridian,firstcapital,apex
```

Idempotent — upsert on natural keys, no duplicate generation on re-run.

### Commit

```
feat(enterprise-depth): re-seed three composite clients at realistic $10B+ scale
```

---

## Phase 3 · Role-based user model

**Intent:** Introduce the concept of user roles. Maestro sees portfolio. Client Viewer sees only their client. Observer (optional) sees limited read-only view.

### Migration 028 · roles + memberships

**`db/migrations/028_user_roles.sql`**

```sql
BEGIN;

CREATE TYPE user_role_type AS ENUM ('maestro', 'client_viewer', 'observer');

ALTER TABLE persons ADD COLUMN IF NOT EXISTS primary_role user_role_type DEFAULT 'client_viewer';

-- A person can be tied to N clients with role per membership
CREATE TABLE person_client_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role user_role_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (person_id, client_id)
);

CREATE INDEX idx_memberships_person ON person_client_memberships(person_id);
CREATE INDEX idx_memberships_client ON person_client_memberships(client_id);

-- Seed Anand as maestro across all clients
-- Example, actual seed in separate script
INSERT INTO person_client_memberships (person_id, client_id, role)
SELECT p.id, c.id, 'maestro'
FROM persons p CROSS JOIN clients c
WHERE p.email = 'anand@abarva.com'
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
COMMIT;
```

### Current user helper

**`src/lib/auth/current-user.ts`**

```typescript
export interface CurrentUser {
  personId: string;
  name: string;
  email: string;
  primaryRole: 'maestro' | 'client_viewer' | 'observer';
  accessibleClients: Array<{ clientId: string; name: string; role: string }>;
  defaultClientId: string | null;  // for client_viewer, their single client
}

export async function getCurrentUser(): Promise<CurrentUser> {
  // 1. Resolve person from Clerk session
  // 2. Query person_client_memberships for their access
  // 3. If primary_role = 'maestro': accessibleClients = all
  // 4. If primary_role = 'client_viewer': accessibleClients = their memberships only
  // 5. defaultClientId = first accessible client (for client_viewer, this is their only one)
}
```

### Server-side enforcement

Every page/API that reads client data must filter through `accessibleClients`. Server Components call `getCurrentUser()`, then queries scope by `clientId IN (accessibleClientIds)`.

Never trust client-side filtering. Every Tower/Engagements/Intelligence query must explicitly restrict by membership.

### Commit

```
feat(roles): user role model — persons.primary_role + person_client_memberships
```

---

## Phase 4 · Single-client chrome

**Intent:** The nav and page headers adapt based on role. Client Viewer sees NO toggle, NO hint of other clients. Maestro sees the portfolio tooling.

### Top nav behavior

**As Maestro (Anand):**

```
[AbarVa]  Home  Engagements  Data  Intelligence  Control Tower  Admin
                                                                      [User ▾]
```

- AbarVa wordmark primary brand
- Client selector appears on Tower + Engagements pages as a sub-nav
- Admin link visible

**As Client Viewer (Sarah @ Meridian):**

```
[Meridian Health]   Home  Engagements  Data  Intelligence  Control Tower
                                                                      [User ▾]
```

- Client name/logo primary in the chrome
- AbarVa wordmark moves to footer or settings — small, not hidden but not dominant
- NO client selector anywhere
- NO Admin link
- Engagements list filtered to Meridian only (no heading that says "Portfolio" or similar)
- Control Tower shows only Meridian's data, no selector above it, just the page title "Meridian Health · Control Tower"

### Component: `AppChrome.tsx`

```tsx
export function AppChrome({ children }: { children: ReactNode }) {
  const user = useCurrentUser();

  if (user.primaryRole === 'maestro') {
    return <MaestroChrome user={user}>{children}</MaestroChrome>;
  }

  // Client viewer — single tenant feel
  const client = user.accessibleClients[0];  // they have exactly one
  return <ClientChrome user={user} client={client}>{children}</ClientChrome>;
}
```

### ClientChrome specifics

- Primary wordmark: client name in Georgia serif (same font family as AbarVa wordmark, consistent visual grammar)
- Right-hand user menu shows user's name + email + logout
- Footer: "Powered by AbarVa" — tiny, 11px, 40% opacity
- Page titles: `Meridian Health · Control Tower` (client name first, always)
- URL scope: `/tower` auto-resolves to the user's single client, no `?clientId=X` needed in the URL
- If user tries to access `/tower?clientId=<someone-else>`: 403 Not Found (never reveal other clients exist)

### Tower header — client view

```
─────────────────────────────────────────────────────
MERIDIAN HEALTH · CONTROL TOWER
as of Apr 19, 2026 · 2:47 PM

[Refresh data] [Download report]
─────────────────────────────────────────────────────

1 · INVENTORY    2 · ADOPTION    3 · VALUE    4 · RISK
5 · COST

CONTRADICTIONS · 5 ACTIVE
...
```

No selector. No portfolio hint. Just Meridian.

### Tower header — Maestro view

```
─────────────────────────────────────────────────────
CONTROL TOWER · Meridian Health
[Meridian Health] [First Capital] [Apex Retail]  [+]

Industry: HEALTHCARE_IDN · Revenue: $14.2B · IT Budget: $710M/yr
─────────────────────────────────────────────────────

1 · INVENTORY    2 · ADOPTION    ...
```

Maestro gets the selector row + a context line with client financials. Easier to stay oriented across portfolio.

### Commit

```
feat(roles): AppChrome + ClientChrome — single-tenant experience for client viewers, portfolio for Maestros
```

---

## Phase 5 · Tower panel extensions

**Intent:** Expose the new enterprise-scale data in the Tower. More breadth without cluttering.

### Existing 5 panels stay. Add a secondary row:

```
CONTROL TOWER · MERIDIAN HEALTH
────────────────────────────────────────────────────────────
[Primary · 5 dimensions as today]
[Inventory] [Adoption] [Value] [Risk] [Cost]

[Enterprise context · new row]
[Tech Stack: 180 items] [Projects: 45 · 22 AI] [Staff Aug: $35M/yr]
[Volumetrics: 42M calls/day]

[Contradictions · 8 active]
```

Four new cards in a secondary row, lighter weight visually.

**Tech Stack card:** breakdown by category, click → full table with filter/search
**Projects card:** in-flight status, % AI-touching, click → project list with budgets + linked use cases
**Staff Aug card:** total spend, FTE count, click → engagement list with function/vendor
**Volumetrics card:** daily API calls + sparkline for last 30 days, click → time-series charts

### Files

- `src/components/tower/TechStackCard.tsx`
- `src/components/tower/ProjectsCard.tsx`
- `src/components/tower/StaffAugCard.tsx`
- `src/components/tower/VolumetricsCard.tsx`
- `src/app/tower/tech-stack/page.tsx` — full tech stack view
- `src/app/tower/projects/page.tsx` — full project list
- `src/app/tower/staff-aug/page.tsx` — staff augmentation view
- `src/app/tower/volumetrics/page.tsx` — volumetric time series

Mini-visualizations (Pack D Principle 5) render inline: stacked bar for tech stack category breakdown, sparkline for volumetrics, donut for project status distribution.

### Commit

```
feat(tower): enterprise context row — tech stack, projects, staff aug, volumetrics
```

---

## Acceptance

### As Maestro (Anand):

1. Logs in → sees portfolio dashboard, 3 clients visible, Admin in nav
2. Opens `/tower` → sees client selector, picks Meridian → full Tower + enterprise context row
3. Tech Stack card shows "180 items across 12 categories." Click → table showing every vendor, spend, contract end date, AI-touching flag
4. Projects card shows "45 in flight, 22 AI-adjacent, $340M total budget, $180M spent." Click → full project list
5. Cost panel now shows $9.9M/month (scaled realistically), 6-month projection $70M
6. Can switch to First Capital or Apex via selector

### As Client Viewer (Sarah @ Meridian):

1. Logs in → sees Meridian-branded chrome, wordmark is "Meridian Health"
2. No selector anywhere. No Admin link. No hint that Apex or First Capital exist.
3. Opens Tower → sees only Meridian's Tower. URL is `/tower` (clean, no clientId param)
4. Tries to visit `/tower?clientId=<FirstCapital ID>` → 403, routed to her own Tower silently
5. Engagement list shows only Meridian engagements
6. Footer shows "Powered by AbarVa" in small gray — acknowledgment without dominance
7. Every page title reads "Meridian Health · [Surface]"

### Enterprise credibility test:

A hypothetical CTO from a real $14B healthcare IDN opens the Meridian Tower and checks three things:
- **Is the monthly AI spend plausible?** $9.9M/mo for a 28K-employee IDN: plausible.
- **Is the tech stack breadth realistic?** 180 items across hardware, software, services: plausible.
- **Are the projects/portfolio realistic?** 45 active with 22 AI-adjacent: plausible.

If plausibility holds, the demo has earned the right to the next question. If the current $332k/month number remained, the CTO would walk.

---

## Out of scope

- Custom branding per client (logo upload, color customization) — Year 2
- Multi-role users (a person who is both Maestro for AbarVa and Client Viewer at their employer) — add later if needed
- Client-to-client benchmarking visible to client viewers — only Maestro sees this; for Client, show only industry-median benchmarks (same as today)
- Audit logs / access logs for client viewers — add when enterprise customers demand

---

## Paste-to-Claude-Code

> "Pack H · Enterprise-Scale Data + Single-Client Experience. Five phases: migration 027 for tech stack / projects / staff aug / volumetrics, enterprise-scale re-seed of three composite clients (Meridian $14B healthcare, First Capital $28B bank, Apex $18B retail), role-based user model (persons.primary_role + person_client_memberships), single-client chrome (MaestroChrome vs ClientChrome components), Tower enterprise context row. Worktree `feat/enterprise-depth` from main. Respects forbidden-name guard for all vendors — whitelisted list only. Run enterprise seed scripts with idempotent upsert. Report after each phase."

---

## What this pack ships

The product stops looking like a prototype sized for a 200-person startup and starts looking like software sold into a $14B enterprise. And every client user experiences the product as theirs — no portfolio toggle, no leak of other tenants, no scaffolding that says "you're row 23."

Two simple shifts. Both land the demo.
