# Substrate Gap Register
## Setup Redesign Package · 3-PR run

Per `SETUP_REDESIGN_PACKAGE_2026-05-07.md` §1.7. One entry per gap: every field, table, or query the design needed but the substrate doesn't support.

| Entry | PR | What was needed | Current substrate state | Handling | Follow-up recommendation |
|---|---|---|---|---|---|
| 1 | All | `agent_capability_assessments` table for per-agent capability levels (Block 1.1 agent level, Block 5.1 per-agent state, Block 5.2 matrix cells) | Does not exist. | Derive from `data_inventory_segments.health_state` per agent-segment-dependency map (catalog §9). Implementation in `src/lib/admin/agent-capability-derivation.ts`. | Add `agent_capability_assessments` substrate when ready; remove the derivation fallback. |
| 2 | All | `segment_capability_matrix` table for 14×6 cells | Does not exist. | Derive from `health_state` + capability-relevance rule table (catalog §10). | Same as entry 1 — substrate addition would replace derivation. |
| 3 | PR C | `platform_capability_state` table for engineering-tracked items | Does not exist. | Hardcoded static list in `src/lib/admin/agent-readiness-engineering-tracked.ts` (Wave references baked in). | Substrate addition or build-manifest read; defer until engineering owns the data. |
| 4 | PR A | `tenant_settings.sso_configured` | Does not exist. | Hardcoded `false` per `users-access-page-view.ts` (already in shipped state from Fix Package PR 5). | Substrate add when SSO configuration goes live. |
| 5 | PR A | `connectors.state IN ('decision_pending', 'awaiting_review')` | Connectors table state model not as catalog assumed. | Omit connector items from Overview action queue per catalog fallback. | Verify connectors substrate model; if state machine exists with different vocabulary, translate; else add the state. |
| 6 | PR A | `audit_events` / `activity_log` table for Block 1.4 | Does not exist. | Derive from `data_inventory_segments.last_reviewed_at` and `last_ingested_at` for events in last 7 days. Filter platform-administrative entries. | Activity-log normalization is a cross-cutting concern; defer. |
| 7 | All | `clients.industry_classification` plain-language field | Substrate has `industry_code` (RETAIL / FINSERV / HEALTHCARE_IDN / ENERGY). | Static map in `setup-vocab.ts`: `industry_code` → plain-language phrase ("regulated financial-services bank", "national health system", etc.). | If a real industry-classification field is added to substrate, swap the map for it. |
| 8 | All | Wave 4 segments 15-23 | Substrate constraint `family_number BETWEEN 1 AND 14`. | Treat 14 as universe. Trust ladder shows "all 14" not "all 23". | When Wave 4 ships and segments 15-23 exist, trust ladder expand updates organically. |
