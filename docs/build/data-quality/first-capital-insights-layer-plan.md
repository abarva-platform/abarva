# First Capital Insights Layer Plan

## Goal

Create one governed insights layer that supports both Intelligence Explorer and AI Control Tower for First Capital Financial.

The layer must not be hand-authored cards. It must be derived from tenant-scoped records, facts, Tower refresh rows, evidence, and refresh receipts.

## Shared Data Spine

1. Load First Capital substrate into tenant-scoped context tables:
   - `enterprise_context_source_files`
   - `enterprise_context_chunks`
   - structured application, initiative, and vendor rows
   - context facts/evidence where the parser path extracts them

2. Load AI Control Tower monthly refresh rows into:
   - `ai_control_refresh_runs`
   - `ai_control_sources`
   - `ai_control_initiatives`
   - `ai_control_tool_usage_monthly`
   - `ai_control_persona_productivity`
   - `ai_control_dora_metrics`
   - `ai_control_agent_outcomes`
   - `ai_control_benefit_realization`
   - `ai_control_spend_contracts`
   - `ai_control_risk_governance`
   - `ai_control_evidence_items`
   - `ai_control_context_facts`
   - `ai_control_context_relationships`
   - `ai_control_atlas_context_packs`

3. Record a refresh event with affected surfaces:
   - `intelligence`
   - `ai_control_tower`
   - `atlas`
   - `admin_setup`

4. Run `runInsightEvaluation("first-capital")` so `significance_rules` produce `context_insights`.

## Intelligence Explorer Consumption

Intelligence Explorer should read `context_insights` through `/api/intelligence/insights`.

Cards should show:

- headline
- so-what
- domain
- materiality
- confidence
- freshness
- lifecycle state
- derived record/fact ids
- evidence
- action

No fixture cards should render when `context_insights` is empty. The UI should show a governed empty state naming the missing refresh/evaluation step.

## Tower Consumption

AI Control Tower should use the same refresh as the source of truth, but rank/shape it by Tower lens:

- Value and adoption: benefits, adoption, value gaps, initiative posture.
- Productivity: persona productivity and DORA before/after rows.
- Agents: ServiceNow/ERP/AI agent outcomes, exception rates, avoided touches.
- Spend: spend/contracts, renewals, unit economics, vendor concentration.
- Risk: risk governance rows, failed/partial gates, review-required evidence.
- Evidence: `ai_control_evidence_items`, `context_insights`, and refresh receipt state.
- Actions: derived from spend, value, adoption, productivity, risk, renewal pressure, and evidence gaps; human approval remains required.

Tower should not treat actions as primary upload truth. Actions are output-side recommendations until approved.

## First Capital Initial Insight Themes

The first evaluator run should produce live DB-backed versions of these themes:

- Core banking modernization hold: FIS Horizon replacement is blocked by data migration and OCC remediation sequencing.
- FedNow/RTP restructuring: value is material, but core API, sanctions screening, and 24x7 operations gates are unresolved.
- AML/BSA model-risk readiness: AML triage automation has value but requires SR 11-7 validation evidence.
- Vendor concentration: FIS, DXC, Deloitte, NICE, Salesforce, SAP, and ACI renewals need concentration and exit analysis.
- Digital onboarding and contact center AI: candidate reductions or holds where adoption/value evidence is weak.
- AI spend proof: tools with material monthly spend and low/exception-heavy usage must prove adoption before scale.
- Evidence gaps: public-company evidence and infrastructure topology still need richer source files before board-grade claims.

## Required Execution Order

1. Stage originals to Azure Blob.
2. Commit First Capital substrate rows.
3. Commit AI Control Tower monthly refresh rows.
4. Refresh embeddings/search.
5. Record refresh event with `evaluateInsights: true`.
6. Run explicit evaluator:
   `TENANT_KEY=first-capital npm run intel:context-insights:evaluate -- --tenant=first-capital`
7. Verify:
   - `context_insights > 0`
   - `/api/intelligence/insights` returns First Capital rows
   - Tower Evidence lens shows live evidence posture
   - Atlas answers cite First Capital-only evidence

## Current Blocker

The current shell cannot resolve the Azure Postgres private host:

`pg-abarva-context-lab-001.postgres.database.azure.com`

Live load and insight evaluation must run from the private/VNet-capable job context.
