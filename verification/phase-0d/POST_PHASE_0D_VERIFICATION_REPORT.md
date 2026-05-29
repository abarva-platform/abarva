# Phase 0D Tenant Canonicalization Verification Report

Generated: 2026-05-29T12:17:44.599Z
Status: complete

## Canonical Tenants

| Tenant key | Name | Industry | Client id |
|---|---|---|---|
| apex-retail | Apex Retail | retail | `bb8ed961-a049-4d0c-a38f-f8912138fceb` |
| first-capital | First Capital | financial_services_banking | `7dbf2cc9-79c2-44bd-98f7-95337b882807` |
| meridian-health | Meridian Health | healthcare_provider | `a20ecef5-f0ea-4890-b9d5-7375fab223ff` |
| northstar-clinical | Northstar Clinical Technologies | healthcare_medtech | `2702b525-4c6a-4fbe-973d-99a8480d8318` |
| skyharbor-air | SkyHarbor Air | airline | `6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301` |

## Archive Manifests

| Tenant | Manifest | Files |
|---|---|---:|
| brindlemark-financial | verification/phase-0d/archives/brindlemark-financial-2026-05-29T12-17-44-599Z/MANIFEST.md | 49 |
| helix-therapeutics | verification/phase-0d/archives/helix-therapeutics-2026-05-29T12-17-44-599Z/MANIFEST.md | 6 |
| keystone-energy-holdings | verification/phase-0d/archives/keystone-energy-holdings-2026-05-29T12-17-44-599Z/MANIFEST.md | 23 |

## Brindlemark Merge

| Table / action | Column | Rows |
|---|---|---:|
| delete duplicate person_client_memberships before merge |  | 3 |
| access_scopes | client_id | 32 |
| ai_business_goals | client_id | 4 |
| ai_egress_audit | tenant_id | 160 |
| ai_initiatives | client_id | 49 |
| applications | client_id | 180 |
| atlas_reasoning_traces | tenant_id | 206 |
| benchmark_cohorts | client_id | 3 |
| briefings | client_id | 1 |
| contradiction_detection_runs | client_id | 5 |
| contradictions | client_id | 21 |
| cost_centers | client_id | 6 |
| engagements | client_id | 9 |
| enterprise_context_chunks | client_id | 400 |
| evidence | client_id | 66 |
| executive_profiles | client_id | 1 |
| external_events | client_id | 6 |
| external_sources | client_id | 8 |
| foundational_pattern_variants | client_id | 1 |
| intelligence_ask_sessions | tenant_id | 2 |
| intelligence_ask_turns | tenant_id | 40 |
| kpis | client_id | 44 |
| legal_privileged_contexts | client_id | 4 |
| pattern_packs | client_id | 7 |
| person_client_memberships | client_id | 32 |
| program_origination_drafts | client_id | 2 |
| spend_breakdown | client_id | 72 |
| staff_augmentation | client_id | 7 |
| tech_projects | client_id | 15 |
| tech_stack_items | client_id | 33 |
| telemetry_sources | client_id | 9 |
| tower_user_preferences | client_id | 1 |
| use_cases | client_id | 34 |
| user_briefing_preferences | client_id | 1 |
| vendor_contracts | client_id | 70 |
| volumetrics_snapshots | client_id | 30 |
| delete Brindlemark client row |  | 1 |

## Helix Deletion

| Table / action | Column | Rows |
|---|---|---:|
| staff_augmentation | client_id | 6 |
| tech_projects | client_id | 12 |
| tech_stack_items | client_id | 30 |
| use_cases | client_id | 43 |
| volumetrics_snapshots | client_id | 30 |
| clients | id | 1 |

## Keystone Deletion

| Table / action | Column | Rows |
|---|---|---:|
| program_audit_log | engagement_id | 67 |
| deliverables_v2 | engagement_id | 118 |
| program_milestones | engagement_id | 34 |
| access_scopes | client_id | 35 |
| benchmark_cohorts | client_id | 3 |
| briefings | client_id | 1 |
| contradiction_detection_runs | client_id | 6 |
| contradictions | client_id | 5 |
| engagements | client_id | 6 |
| evidence | client_id | 74 |
| executive_profiles | client_id | 1 |
| external_events | client_id | 6 |
| external_sources | client_id | 8 |
| foundational_pattern_variants | client_id | 1 |
| kpis | client_id | 41 |
| pattern_packs | client_id | 7 |
| person_client_memberships | client_id | 41 |
| telemetry_sources | client_id | 9 |
| user_briefing_preferences | client_id | 1 |
| clients | id | 1 |

Note: `program_audit_log` rows were exported before deletion. The no-delete trigger was temporarily disabled only for the scoped Keystone deletion and verified enabled afterward.

## Canonical Client Updates

| Table / action | Column | Rows |
|---|---|---:|
| apex-retail |  | 1 |
| meridian-health |  | 1 |
| northstar-clinical |  | 1 |
| first-capital |  | 1 |
| skyharbor-air |  | 1 |

## Corpus Vocabulary Updates

| Table / action | Column | Rows |
|---|---|---:|
| corpus_patterns |  | 0 |
| canonical_industry_ai_patterns |  | 0 |

## Northstar Tenant-Key Canonicalization

| Table / action | Column | Rows |
|---|---|---:|
| enterprise_context_chunks | tenant_key northstar-medtech -> northstar-clinical | 878 |

Archive manifest: verification/phase-0d/archives/northstar-canonicalization-2026-05-29T12-22-23-461Z/MANIFEST.md

## Tenant-Key Alias Cleanup

| Table / action | Column | Rows |
|---|---|---:|
| Source and program canonicalization tables | tenant_key/client_key aliases -> canonical keys | 575 |

Archive manifest: verification/phase-0d/archives/tenant-key-alias-cleanup-2026-05-29T12-24-02-987Z/MANIFEST.md

## Orphan Scan

Retired tenant reference scan returned zero rows across all tenant-scoped columns.
