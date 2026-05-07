# Load Instructions · Step-by-Step Ingestion Runbook

This is the runbook for Claude Code (or a human operator) to load this package end-to-end. After this runs, the AI Initiatives Registry exists in the database and the Setup → AI Initiatives view renders for all 3 demo tenants.

---

## Prerequisites

- Database access to the AbarVa Postgres instance (or equivalent)
- Tenant rows already exist for: `apex-retail`, `first-capital-financial`, `meridian-health`
- Migration tooling configured (e.g., `pnpm db:migrate`, or whatever the project uses)
- Browser-Chrome MCP tool available for verification

---

## Step 1 · Apply schema migrations

```bash
# Create migration file
touch migrations/2026_05_07_add_ai_initiatives_registry.sql

# Copy schema from DATA_MODEL.md into the migration file
# (see DATA_MODEL.md · "Migrations" section for the full DDL)

# Apply migration
pnpm db:migrate up

# Verify tables created
psql $DATABASE_URL -c "\dt ai_*"
# Expected output: 7 tables
#   ai_categories
#   ai_business_goals
#   ai_initiatives
#   ai_initiative_kpis
#   ai_initiative_stakeholder_notes
#   ai_initiative_decisions
#   ai_initiative_vendors
#   ai_initiative_scenarios
```

**Verification:** `SELECT category_id, name FROM ai_categories ORDER BY display_order;` should return 8 rows.

---

## Step 2 · Load tenant data from JSON templates

For each tenant, run a load script that ingests the JSON template.

### 2a · Apex Retail

```bash
# Run load script (project-specific — example pseudocode)
node scripts/load-ai-initiatives-template.js \
  --tenant apex-retail \
  --template-file ai-initiatives-package/templates/apex-retail/full_load.json \
  --template-version v1.0.0
```

The load script must:

1. Look up `tenant_id` for slug `apex-retail`
2. Insert `business_goals` rows
3. Insert `initiatives` rows
4. Insert `kpi_history` rows
5. Insert `stakeholder_notes` rows
6. Insert `decisions` rows
7. Insert `vendors` rows
8. Insert `scenarios` rows

For every row inserted, set `loaded_via_template = 'apex-retail/full_load.json v1.0.0'`.

### 2b · First Capital Financial

```bash
node scripts/load-ai-initiatives-template.js \
  --tenant first-capital-financial \
  --template-file ai-initiatives-package/templates/first-capital-financial/full_load.json \
  --template-version v1.0.0
```

### 2c · Meridian Health

```bash
node scripts/load-ai-initiatives-template.js \
  --tenant meridian-health \
  --template-file ai-initiatives-package/templates/meridian-health/full_load.json \
  --template-version v1.0.0
```

---

## Step 3 · Verify data load

```sql
-- Initiative count per tenant (expect 7 each)
SELECT t.slug, COUNT(*) AS initiative_count
FROM ai_initiatives i
JOIN tenants t ON t.id = i.tenant_id
GROUP BY t.slug
ORDER BY t.slug;
-- Expected:
--   apex-retail              | 7
--   first-capital-financial  | 7
--   meridian-health          | 7

-- Aligned-callout count per tenant (expect 2 each)
SELECT t.slug, COUNT(*) AS aligned_count
FROM ai_initiatives i
JOIN tenants t ON t.id = i.tenant_id
WHERE i.aligned_callout = TRUE
GROUP BY t.slug
ORDER BY t.slug;
-- Expected:
--   apex-retail              | 2
--   first-capital-financial  | 2
--   meridian-health          | 2

-- Business goal count per tenant (expect 4 each)
SELECT t.slug, COUNT(*) AS goal_count
FROM ai_business_goals g
JOIN tenants t ON t.id = g.tenant_id
GROUP BY t.slug;
-- Expected: 4 / 4 / 4

-- Total committed annual $ across all initiatives
SELECT t.slug, SUM(i.committed_annual_usd) AS total_committed_annual
FROM ai_initiatives i
JOIN tenants t ON t.id = i.tenant_id
GROUP BY t.slug;
-- Expected (approximately):
--   apex-retail              | $11,900,000
--   first-capital-financial  | $9,800,000
--   meridian-health          | $11,900,000

-- Provenance check — every record should have loaded_via_template populated
SELECT COUNT(*) AS missing_provenance
FROM ai_initiatives
WHERE loaded_via_template IS NULL OR loaded_via_template = '';
-- Expected: 0
```

If any verification query returns unexpected results, halt and investigate. Do not proceed to Step 4.

---

## Step 4 · Build Setup → AI Initiatives view

Per `SETUP_UI_SPEC.md`, build the new Setup panel:

```
app/setup/ai-initiatives/page.tsx                            (new — view container with toggle)
app/setup/ai-initiatives/components/ByGoalView.tsx           (new)
app/setup/ai-initiatives/components/ByCategoryView.tsx       (new)
app/setup/ai-initiatives/components/AllInitiativesTable.tsx  (new)
app/setup/ai-initiatives/[initiativeId]/page.tsx             (new — detail page)
app/setup/ai-initiatives/[initiativeId]/components/OverviewTab.tsx
app/setup/ai-initiatives/[initiativeId]/components/KpisTab.tsx
app/setup/ai-initiatives/[initiativeId]/components/StakeholdersTab.tsx
app/setup/ai-initiatives/[initiativeId]/components/DecisionsTab.tsx
app/setup/ai-initiatives/[initiativeId]/components/VendorsTab.tsx
app/setup/ai-initiatives/[initiativeId]/components/ScenariosTab.tsx
app/setup/ai-initiatives/[initiativeId]/components/ProvenanceTab.tsx

hooks/useAIInitiatives.ts                                    (new)
hooks/useAIInitiative.ts                                     (new — single initiative)
hooks/useAIBusinessGoals.ts                                  (new)
hooks/useAICategories.ts                                     (new)

components/setup/SetupNav.tsx                                (update — add AI Initiatives entry)
```

Hook signatures:

```typescript
useAIInitiatives(tenantSlug: string, filters?: { categoryId?, goalId?, stage?, alignedOnly? })
  → { data: Initiative[], loading, error }

useAIInitiative(tenantSlug: string, initiativeId: string)
  → { data: InitiativeWithRelations, loading, error }
  // includes: category, goal, kpis[], stakeholderNotes[], decisions[], vendors[], scenarios[]

useAIBusinessGoals(tenantSlug: string)
  → { data: BusinessGoal[], loading, error }

useAICategories()
  → { data: Category[], loading, error }
```

---

## Step 5 · Browser-Chrome verification

```
Step 1 · Navigate to /setup (Castillo · Meridian)
  - assert: Setup nav contains "AI Initiatives" entry (7th item)
  - screenshot

Step 2 · Click "AI Initiatives"
  - assert: page loads at /setup/ai-initiatives
  - assert: "By Business Goal" view active by default
  - assert: 4 business goal sections render
  - assert: 7 initiatives total visible across goals
  - assert: 2 ⭐ markers (MH-01, MH-04)
  - screenshot

Step 3 · Toggle to "By Category"
  - assert: 6 category sections visible (Meridian has initiatives in CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, CAT-06)
  - screenshot

Step 4 · Toggle to "All initiatives" (table)
  - assert: 7 rows render
  - assert: filterable / sortable
  - screenshot

Step 5 · Click MH-01 · Clinical Documentation Copilot
  - assert: detail page loads
  - assert: 7 tabs (Overview · KPIs · Stakeholders · Decisions · Vendors · Scenarios · Provenance)
  - assert: aligned-callout rationale visible on Overview
  - screenshot

Step 6 · Click KPIs tab
  - assert: 2 KPIs visible (Physician satisfaction NPS · Documentation time per encounter)
  - assert: trend across quarters renders
  - assert: confidence indicators visible per cell
  - screenshot

Step 7 · Click Provenance tab
  - assert: shows "Loaded from: meridian-health/full_load.json v1.0.0"
  - assert: shows last refresh timestamp
  - screenshot

Step 8 · Switch tenant to Apex Retail
  - navigate to /setup/ai-initiatives in Apex tenant context
  - assert: 7 Apex initiatives render
  - assert: 2 ⭐ markers (AR-03, AR-05)
  - screenshot

Step 9 · Switch tenant to First Capital Financial
  - assert: 7 FCF initiatives render
  - assert: 2 ⭐ markers (FCF-04, FCF-07)
  - screenshot
```

**Total: 9 screenshots minimum. Attach all to PR description.**

---

## Step 6 · Tag substrate version

After successful verification:

```sql
INSERT INTO substrate_versions (component, version, applied_at, notes)
VALUES (
  'ai_initiatives',
  'v1.0.0',
  NOW(),
  'Initial registry · 21 initiatives across 3 demo tenants · loaded via templates'
);
```

This signals to downstream packages (Tower Fix · Intelligence Augmentation) that the substrate they depend on is now available.

---

## Step 7 · Update downstream packages

Notify (via doc updates, not code changes in this PR):

1. **Tower Fix Package master prompt** — update to note that strategic alignment 2×2 should bind to `ai_initiatives` table (not invented data). T-1 / T-2 / T-3 specs may need minor revisions to reference real initiative names.

2. **Intelligence Augmentation Package data binding catalog** — add new bindings:
   - `useAIInitiatives()` for Move card grounding
   - `useAIBusinessGoals()` for Layer column gating descriptions
   - Initiative-to-Move linkage (when a Move references an initiative)

3. **Strategic Moves originate flow** — Nexus capture should accept initiative reference (e.g., "this Move advances initiative MH-04"), creating an explicit linkage.

These are doc updates, not code; downstream PR execution can address actual code changes.

---

## Rollback plan

If the load fails halfway:

```sql
BEGIN;
DELETE FROM ai_initiative_scenarios;
DELETE FROM ai_initiative_vendors;
DELETE FROM ai_initiative_decisions;
DELETE FROM ai_initiative_stakeholder_notes;
DELETE FROM ai_initiative_kpis;
DELETE FROM ai_initiatives;
DELETE FROM ai_business_goals;
-- Categories are global; do not delete unless rolling back schema
COMMIT;
```

Then re-run loads from Step 2.

---

## Done state

After all 6 steps execute successfully:

- ✅ 21 AI initiatives loaded across 3 tenants
- ✅ 12 business goals (4 per tenant)
- ✅ ~50 KPI history records
- ✅ ~12 stakeholder notes
- ✅ ~15 decisions
- ✅ ~14 vendor records
- ✅ ~10 forward-looking scenarios
- ✅ All records carry `loaded_via_template` provenance
- ✅ Setup → AI Initiatives view renders for all 3 tenants
- ✅ Substrate version tagged v1.0.0
- ✅ Downstream packages unblocked

Total elapsed time: 2-4 days for full load + UI build + verification.
