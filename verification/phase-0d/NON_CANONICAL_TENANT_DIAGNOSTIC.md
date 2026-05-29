# Phase 0D Non-Canonical Tenant Diagnostic

Generated: 2026-05-29T12:11:42.987Z
Status: diagnostic complete; destructive cleanup not yet executed.

## Canonical Tenant Target

| Tenant key | Industry | Client rows found |
|---|---|---:|
| apex-retail | retail | 1 |
| meridian-health | healthcare_provider | 1 |
| northstar-clinical | healthcare_medtech | 1 |
| first-capital | financial_services_banking | 2 |
| skyharbor-air | airline | 1 |

## Retiring Tenant Findings

### Brindlemark Financial (brindlemark-financial)

- Planned action: merge-then-delete
- Client rows found: 1
- Tenant-scoped DB row hits: 2082
- Recent AI egress rows, last 30 days: 160
- Clerk diagnostic: ok
- Clerk users matched: 0
- Client row archive: verification/phase-0d/diagnostic-data/brindlemark-financial/clients.rows.json
- Recent egress archive: verification/phase-0d/diagnostic-data/brindlemark-financial/ai_egress_audit.recent_30d.json

| Table | Column | Rows | Archive |
|---|---|---:|---|
| access_scopes | client_id | 32 | verification/phase-0d/diagnostic-data/brindlemark-financial/access_scopes.client_id.json |
| ai_business_goals | client_id | 4 | verification/phase-0d/diagnostic-data/brindlemark-financial/ai_business_goals.client_id.json |
| ai_egress_audit | tenant_id | 160 | verification/phase-0d/diagnostic-data/brindlemark-financial/ai_egress_audit.tenant_id.json |
| ai_initiatives | client_id | 49 | verification/phase-0d/diagnostic-data/brindlemark-financial/ai_initiatives.client_id.json |
| applications | client_id | 180 | verification/phase-0d/diagnostic-data/brindlemark-financial/applications.client_id.json |
| atlas_reasoning_traces | tenant_id | 206 | verification/phase-0d/diagnostic-data/brindlemark-financial/atlas_reasoning_traces.tenant_id.json |
| benchmark_cohorts | client_id | 3 | verification/phase-0d/diagnostic-data/brindlemark-financial/benchmark_cohorts.client_id.json |
| briefings | client_id | 1 | verification/phase-0d/diagnostic-data/brindlemark-financial/briefings.client_id.json |
| contradiction_detection_runs | client_id | 5 | verification/phase-0d/diagnostic-data/brindlemark-financial/contradiction_detection_runs.client_id.json |
| contradictions | client_id | 21 | verification/phase-0d/diagnostic-data/brindlemark-financial/contradictions.client_id.json |
| contradictions | triggered_engagement_id | 10 | verification/phase-0d/diagnostic-data/brindlemark-financial/contradictions.triggered_engagement_id.engagement-dependent.json |
| cost_centers | client_id | 6 | verification/phase-0d/diagnostic-data/brindlemark-financial/cost_centers.client_id.json |
| engagements | client_id | 9 | verification/phase-0d/diagnostic-data/brindlemark-financial/engagements.client_id.json |
| enterprise_context_chunks | client_id | 400 | verification/phase-0d/diagnostic-data/brindlemark-financial/enterprise_context_chunks.client_id.json |
| evidence | client_id | 66 | verification/phase-0d/diagnostic-data/brindlemark-financial/evidence.client_id.json |
| executive_profiles | client_id | 1 | verification/phase-0d/diagnostic-data/brindlemark-financial/executive_profiles.client_id.json |
| external_events | client_id | 6 | verification/phase-0d/diagnostic-data/brindlemark-financial/external_events.client_id.json |
| external_sources | client_id | 8 | verification/phase-0d/diagnostic-data/brindlemark-financial/external_sources.client_id.json |
| foundational_pattern_variants | client_id | 1 | verification/phase-0d/diagnostic-data/brindlemark-financial/foundational_pattern_variants.client_id.json |
| intelligence_ask_sessions | tenant_id | 2 | verification/phase-0d/diagnostic-data/brindlemark-financial/intelligence_ask_sessions.tenant_id.json |
| intelligence_ask_turns | tenant_id | 40 | verification/phase-0d/diagnostic-data/brindlemark-financial/intelligence_ask_turns.tenant_id.json |
| kpis | client_id | 44 | verification/phase-0d/diagnostic-data/brindlemark-financial/kpis.client_id.json |
| legal_privileged_contexts | client_id | 4 | verification/phase-0d/diagnostic-data/brindlemark-financial/legal_privileged_contexts.client_id.json |
| pattern_packs | client_id | 7 | verification/phase-0d/diagnostic-data/brindlemark-financial/pattern_packs.client_id.json |
| person_client_memberships | client_id | 35 | verification/phase-0d/diagnostic-data/brindlemark-financial/person_client_memberships.client_id.json |
| program_origination_drafts | client_id | 2 | verification/phase-0d/diagnostic-data/brindlemark-financial/program_origination_drafts.client_id.json |
| program_origination_drafts | committed_engagement_id | 1 | verification/phase-0d/diagnostic-data/brindlemark-financial/program_origination_drafts.committed_engagement_id.engagement-dependent.json |
| spend_breakdown | client_id | 72 | verification/phase-0d/diagnostic-data/brindlemark-financial/spend_breakdown.client_id.json |
| staff_augmentation | client_id | 7 | verification/phase-0d/diagnostic-data/brindlemark-financial/staff_augmentation.client_id.json |
| tech_projects | client_id | 15 | verification/phase-0d/diagnostic-data/brindlemark-financial/tech_projects.client_id.json |
| tech_stack_items | client_id | 33 | verification/phase-0d/diagnostic-data/brindlemark-financial/tech_stack_items.client_id.json |
| telemetry_sources | client_id | 9 | verification/phase-0d/diagnostic-data/brindlemark-financial/telemetry_sources.client_id.json |
| tower_user_preferences | client_id | 1 | verification/phase-0d/diagnostic-data/brindlemark-financial/tower_user_preferences.client_id.json |
| use_cases | client_id | 34 | verification/phase-0d/diagnostic-data/brindlemark-financial/use_cases.client_id.json |
| user_briefing_preferences | client_id | 1 | verification/phase-0d/diagnostic-data/brindlemark-financial/user_briefing_preferences.client_id.json |
| vendor_contracts | client_id | 70 | verification/phase-0d/diagnostic-data/brindlemark-financial/vendor_contracts.client_id.json |
| volumetrics_snapshots | client_id | 30 | verification/phase-0d/diagnostic-data/brindlemark-financial/volumetrics_snapshots.client_id.json |
| deliverables_v2 | engagement_id | 152 | verification/phase-0d/diagnostic-data/brindlemark-financial/deliverables_v2.engagement_id.engagement-dependent.json |
| module_state_log | engagement_id | 52 | verification/phase-0d/diagnostic-data/brindlemark-financial/module_state_log.engagement_id.engagement-dependent.json |
| phase_snapshots | engagement_id | 12 | verification/phase-0d/diagnostic-data/brindlemark-financial/phase_snapshots.engagement_id.engagement-dependent.json |
| program_approval_requests | program_id | 2 | verification/phase-0d/diagnostic-data/brindlemark-financial/program_approval_requests.program_id.engagement-dependent.json |
| program_attachments | program_id | 5 | verification/phase-0d/diagnostic-data/brindlemark-financial/program_attachments.program_id.engagement-dependent.json |
| program_audit_log | engagement_id | 138 | verification/phase-0d/diagnostic-data/brindlemark-financial/program_audit_log.engagement_id.engagement-dependent.json |
| program_evidence_items | program_id | 5 | verification/phase-0d/diagnostic-data/brindlemark-financial/program_evidence_items.program_id.engagement-dependent.json |
| program_milestones | engagement_id | 70 | verification/phase-0d/diagnostic-data/brindlemark-financial/program_milestones.engagement_id.engagement-dependent.json |
| program_modules | engagement_id | 7 | verification/phase-0d/diagnostic-data/brindlemark-financial/program_modules.engagement_id.engagement-dependent.json |
| turns | engagement_id | 64 | verification/phase-0d/diagnostic-data/brindlemark-financial/turns.engagement_id.engagement-dependent.json |

### Helix Therapeutics (helix-therapeutics)

- Planned action: hard-delete
- Client rows found: 1
- Tenant-scoped DB row hits: 121
- Recent AI egress rows, last 30 days: 0
- Clerk diagnostic: ok
- Clerk users matched: 0
- Client row archive: verification/phase-0d/diagnostic-data/helix-therapeutics/clients.rows.json

| Table | Column | Rows | Archive |
|---|---|---:|---|
| staff_augmentation | client_id | 6 | verification/phase-0d/diagnostic-data/helix-therapeutics/staff_augmentation.client_id.json |
| tech_projects | client_id | 12 | verification/phase-0d/diagnostic-data/helix-therapeutics/tech_projects.client_id.json |
| tech_stack_items | client_id | 30 | verification/phase-0d/diagnostic-data/helix-therapeutics/tech_stack_items.client_id.json |
| use_cases | client_id | 43 | verification/phase-0d/diagnostic-data/helix-therapeutics/use_cases.client_id.json |
| volumetrics_snapshots | client_id | 30 | verification/phase-0d/diagnostic-data/helix-therapeutics/volumetrics_snapshots.client_id.json |

### Keystone Energy Holdings (keystone-energy-holdings)

- Planned action: hard-delete
- Client rows found: 1
- Tenant-scoped DB row hits: 533
- Recent AI egress rows, last 30 days: 0
- Clerk diagnostic: ok
- Clerk users matched: 0
- Client row archive: verification/phase-0d/diagnostic-data/keystone-energy-holdings/clients.rows.json

| Table | Column | Rows | Archive |
|---|---|---:|---|
| access_scopes | client_id | 35 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/access_scopes.client_id.json |
| benchmark_cohorts | client_id | 3 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/benchmark_cohorts.client_id.json |
| briefings | client_id | 1 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/briefings.client_id.json |
| clients | tenant_key | 1 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/clients.tenant_key.json |
| contradiction_detection_runs | client_id | 6 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/contradiction_detection_runs.client_id.json |
| contradictions | client_id | 5 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/contradictions.client_id.json |
| engagements | client_id | 6 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/engagements.client_id.json |
| evidence | client_id | 74 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/evidence.client_id.json |
| executive_profiles | client_id | 1 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/executive_profiles.client_id.json |
| external_events | client_id | 6 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/external_events.client_id.json |
| external_sources | client_id | 8 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/external_sources.client_id.json |
| foundational_pattern_variants | client_id | 1 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/foundational_pattern_variants.client_id.json |
| foundational_pattern_variants | tenant_key | 1 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/foundational_pattern_variants.tenant_key.json |
| kpis | client_id | 41 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/kpis.client_id.json |
| pattern_packs | client_id | 7 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/pattern_packs.client_id.json |
| person_client_memberships | client_id | 41 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/person_client_memberships.client_id.json |
| program_audit_log | tenant_key | 67 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/program_audit_log.tenant_key.json |
| program_audit_log | engagement_id | 67 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/program_audit_log.engagement_id.engagement-dependent.json |
| telemetry_sources | client_id | 9 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/telemetry_sources.client_id.json |
| user_briefing_preferences | client_id | 1 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/user_briefing_preferences.client_id.json |
| deliverables_v2 | engagement_id | 118 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/deliverables_v2.engagement_id.engagement-dependent.json |
| program_milestones | engagement_id | 34 | verification/phase-0d/diagnostic-data/keystone-energy-holdings/program_milestones.engagement_id.engagement-dependent.json |

## Diagnostic Interpretation

- This report is generated from live database metadata and tenant-scoped table scans.
- Any non-zero row counts above must be archived before deletion.
- Brindlemark merge/discard classification should use the archived row payloads before hard delete.
- Full raw diagnostic: verification/phase-0d/diagnostic-data/phase0d-diagnostic-raw.json

