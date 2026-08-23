#!/usr/bin/env python3

"""Generate a dense synthetic source-room package for the current intake contract.

This is Layer 1 source simulation only. It creates source-system shaped CSV
extracts with realistic volume, provenance marks, partial/unknown states, and
row-grain declarations so adapters can be tested without pretending the values
are client-attested.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from datetime import date, datetime, timezone
from pathlib import Path
from random import Random
from typing import Any


DEFAULT_OUT_DIR = Path("outputs/source-room-depth-catchup-2026-08-23")
SEED = 20260823

TARGETS = {
    "SP01_Documents_Interviews": ("Leadership_Interview_Notes_SYNTHETIC.csv", 220, "one row per interview answer or thematic excerpt"),
    "SP02_HRIS": ("HRIS_Workforce_Role_Summary_SYNTHETIC.csv", 360, "one row per function-role-location segment"),
    "SP03_CMDB": ("ServiceNow_Business_Applications_SYNTHETIC.csv", 750, "one row per base application service"),
    "SP04_Data_BI_ETL": ("BI_ETL_Analytics_Volumes_SYNTHETIC.csv", 360, "one row per function-platform-technology-workload segment"),
    "SP05_Infrastructure": ("Hosting_Platforms_SYNTHETIC.csv", 220, "one row per platform, cluster, account, appliance, or hosting segment"),
    "SP06_Finance_ERP": ("GL_Budget_Actuals_SYNTHETIC.csv", 480, "one row per fiscal period-cost center-account-supplier/application allocation"),
    "SP07_PPM": ("PPM_Programs_SYNTHETIC.csv", 140, "one row per program or initiative record"),
    "SP08_Vendor_Contract": ("Contract_Register_SYNTHETIC.csv", 230, "one row per contract, service tower, renewal, or rate-card segment"),
    "SP09_GRC": ("GRC_Risk_Control_Exceptions_SYNTHETIC.csv", 200, "one row per risk, control, exception, or audit finding"),
    "SP10_KPI_Operations": ("KPI_Operations_Summary_SYNTHETIC.csv", 260, "one row per period-function-KPI segment"),
    "SP11_AI_Usage_Models": ("AI_Usage_Telemetry_SYNTHETIC.csv", 360, "one row per period-tool-function-user segment"),
    "SP12_Evidence_Room": ("Owner_Attestation_and_Evidence_Register_SYNTHETIC.csv", 500, "one row per evidence artifact, attestation, or extraction pointer"),
    "SP13_Data_Flows_Integrations": ("Data_Flows_Integrations_SYNTHETIC.csv", 1350, "one row per source-target-system data movement or integration flow"),
    "SP14_Deployments_Hosting": ("Application_Deployments_Hosting_SYNTHETIC.csv", 1650, "one row per application deployment/environment hosted on a platform"),
}

SOURCE_METADATA = {
    "SP01_Documents_Interviews": {
        "owner": "Executive sponsors, function leaders, and engagement interview lead",
        "source_system": "Interview workbook and transcript notes",
        "export_query": "Export director-and-above interview response table with role, function, question, theme, excerpt, priority, and review state.",
        "acceptable_unfilled_state": "Known Gap when interview not scheduled; Unknown when theme is not yet coded.",
    },
    "SP02_HRIS": {
        "owner": "HRIS and workforce planning",
        "source_system": "Workday/HCM workforce summary",
        "export_query": "Export workforce role summaries by function, role family, worker type, location segment, and period.",
        "acceptable_unfilled_state": "Unknown for open requisitions or attrition where HR does not share the value.",
    },
    "SP03_CMDB": {
        "owner": "CMDB/application portfolio owner",
        "source_system": "ServiceNow CMDB or LeanIX application export",
        "export_query": "Export active/planned business application services; exclude server-only and environment-only CIs.",
        "acceptable_unfilled_state": "Unknown for owners, lifecycle, hosting, or user counts not maintained in CMDB.",
    },
    "SP04_Data_BI_ETL": {
        "owner": "Data, analytics, BI, and ETL platform owners",
        "source_system": "BI admin exports, ETL catalog, database catalog summaries",
        "export_query": "Export counts by function, technology, workload type, platform, refresh frequency, user segment, and governed state; do not collect every report row by default.",
        "acceptable_unfilled_state": "Known Gap for platforms that cannot export admin telemetry; Unknown for business-owned marts not catalogued.",
    },
    "SP05_Infrastructure": {
        "owner": "Infrastructure, cloud, data center, hosting, and platform engineering",
        "source_system": "Cloud inventory, virtualization inventory, CMDB platform CIs, data center asset records",
        "export_query": "Export platform/cluster/account/appliance segments with capacity, utilization, function, hosting location, DR tier, and ownership.",
        "acceptable_unfilled_state": "Unknown for utilization where monitoring data is not retained; Not Applicable for SaaS platform capacity.",
    },
    "SP06_Finance_ERP": {
        "owner": "IT finance, FP&A, ERP finance data owner",
        "source_system": "ERP GL, Apptio, Anaplan, Hyperion, or finance mart",
        "export_query": "Export IT cost-center actuals, budget, forecast, account category, supplier, application/platform allocation, and basis by fiscal period.",
        "acceptable_unfilled_state": "Known Gap when allocation is not maintained; Unknown when supplier/app mapping is unresolved.",
    },
    "SP07_PPM": {
        "owner": "PMO, transformation office, and value office",
        "source_system": "Clarity, Planview, Jira Align, or PMO portfolio workbook",
        "export_query": "Export programs and initiatives with status, sponsor, function, budget, forecast, target value, dependencies, and benefits basis.",
        "acceptable_unfilled_state": "Unknown for target value before finance review; blank for optional dependent applications.",
    },
    "SP08_Vendor_Contract": {
        "owner": "Vendor management, procurement, legal operations, and CLM owner",
        "source_system": "CLM/Coupa/Ariba contract register plus document inventory",
        "export_query": "Export contract register rows with supplier, service tower, term, annualized value, notice window, benchmark rights, commitments, and scoped application refs.",
        "acceptable_unfilled_state": "Known Gap for terms missing from register until document extraction is permitted.",
    },
    "SP09_GRC": {
        "owner": "GRC, security, privacy, audit, and compliance owners",
        "source_system": "GRC platform, audit issue tracker, control register",
        "export_query": "Export risks, controls, exceptions, affected subjects, severity, control state, evidence refs, and owner.",
        "acceptable_unfilled_state": "Unknown for affected subject when issue is not mapped; Known Gap for evidence not uploaded.",
    },
    "SP10_KPI_Operations": {
        "owner": "Operations analytics and KPI owners",
        "source_system": "Operations KPI marts, scorecards, and business performance dashboards",
        "export_query": "Export KPI observations by period, function, metric, target, source application, and unit.",
        "acceptable_unfilled_state": "Unknown for target where no approved target exists; Known Gap for metrics without source owner.",
    },
    "SP11_AI_Usage_Models": {
        "owner": "M365, GitHub, ServiceNow, AI platform admins, finance, and business sponsors",
        "source_system": "M365 admin center, GitHub Copilot org insights, ServiceNow Now Assist, AI gateway telemetry",
        "export_query": "Export usage by tool, period, function, user segment, licensed users, active users, actions, cost, and use-case category.",
        "acceptable_unfilled_state": "Unknown for business function when admin telemetry lacks org mapping; Known Gap when vendor cannot export usage.",
    },
    "SP12_Evidence_Room": {
        "owner": "Evidence coordinator, data owners, document owners, and review leads",
        "source_system": "Document room, SharePoint/Box/Drive export, evidence register",
        "export_query": "Export evidence artifact inventory with owner, type, subject, date, verification state, page/span where extracted, and review state.",
        "acceptable_unfilled_state": "Known Gap for missing artifact; blank page/span when the artifact is not text-extracted.",
    },
    "SP13_Data_Flows_Integrations": {
        "owner": "Integration platform, data engineering, application, and interface owners",
        "source_system": "Integration catalog, ETL catalog, CMDB relationships, API gateway, and interface inventory",
        "export_query": "Export source-target data movements with landing layer, consumption layer, integration pattern, cadence, regulated-data flag, and owning function.",
        "acceptable_unfilled_state": "Known Gap when interface catalog is missing; Unknown when source or target ownership is unresolved.",
    },
    "SP14_Deployments_Hosting": {
        "owner": "CMDB, application platform, cloud, infrastructure, and hosting owners",
        "source_system": "CMDB CI relationships, cloud inventory, virtualization inventory, and hosting runbook",
        "export_query": "Export application deployments/environments with application id, environment, hosting platform, region/location, runtime state, and DR posture.",
        "acceptable_unfilled_state": "Unknown for DR posture or runtime state when not maintained; Not Applicable for single-tenant SaaS deployments.",
    },
}

FUNCTIONS = [
    "Health Plan Operations",
    "Clinical Operations",
    "Revenue Cycle",
    "Finance",
    "Supply Chain",
    "Human Resources",
    "Data and Analytics",
    "Information Technology",
    "Risk and Compliance",
    "Member Services",
    "Provider Network",
    "Pharmacy",
]

APP_PRODUCTS = [
    ("Epic Tapestry", "Epic Systems Corporation", "health_plan", "claims"),
    ("Facets", "TriZetto Corporation", "health_plan", "core_admin"),
    ("HealthRules Payor", "HealthEdge Software", "health_plan", "core_admin"),
    ("QNXT", "Cognizant Technology Solutions", "health_plan", "claims"),
    ("Jiva", "ZeOmega", "health_plan", "care_management"),
    ("TruCare", "Casenet LLC", "health_plan", "care_management"),
    ("Epic Hyperspace", "Epic Systems Corporation", "clinical", "ehr"),
    ("Epic Beaker", "Epic Systems Corporation", "clinical", "lab"),
    ("Epic Radiant", "Epic Systems Corporation", "clinical", "imaging"),
    ("Oracle Health Millennium", "Oracle Corporation", "clinical", "ehr"),
    ("Meditech Expanse", "Medical Information Technology Inc.", "clinical", "ehr"),
    ("Workday Financial Management", "Workday Inc.", "shared", "finance"),
    ("Workday HCM", "Workday Inc.", "shared", "hr"),
    ("Infor Lawson ERP", "Infor Inc.", "shared", "erp"),
    ("ServiceNow ITSM", "ServiceNow Inc.", "shared", "it_ops"),
    ("Tableau Server", "Salesforce Inc.", "data", "bi"),
    ("Power BI Premium", "Microsoft Corporation", "data", "bi"),
    ("Informatica PowerCenter", "Informatica LLC", "data", "etl"),
    ("Netezza Warehouse", "IBM Corporation", "data", "warehouse"),
    ("Snowflake Enterprise", "Snowflake Inc.", "data", "warehouse"),
]

VENDORS = sorted({vendor for _product, vendor, _domain, _subdomain in APP_PRODUCTS} | {
    "R1 RCM Inc.",
    "PeopleBridge Services LLC",
    "ProcureHealth Operations LLC",
    "LedgerWorks BPO LLC",
    "Helix Clinical Services LLC",
    "Microsoft Corporation",
    "Amazon Web Services Inc.",
    "Oracle Corporation",
    "IBM Corporation",
})
VENDORS.extend(
    f"{category} Supplier {index:03d} LLC"
    for category in ["Clinical Services", "Revenue Cycle", "Facilities", "Staffing", "Data Services", "Security", "Cloud Operations", "Member Services"]
    for index in range(1, 25)
)

DATA_TECH = ["Power BI", "Tableau", "SSRS", "Business Objects", "Cognos", "Qlik", "SAS", "Informatica", "SSIS", "DataStage", "SQL Agent", "Python", "Alteryx"]
WORKLOADS = ["reports", "dashboards", "etl_jobs", "stored_procedures", "scripts", "data_marts", "semantic_models", "notebooks"]
INFRA_TYPES = ["mainframe", "teradata_appliance", "netezza_appliance", "sql_server_cluster", "epic_aws", "vmware_cluster", "azure_subscription", "aws_account", "storage_platform", "citrix_farm", "network_segment", "security_platform"]
AI_TOOLS = [
    "Microsoft 365 Copilot",
    "GitHub Copilot",
    "ServiceNow Now Assist",
    "ChatGPT Enterprise",
    "Azure OpenAI",
    "Claude Team",
    "Databricks Assistant",
    "Epic ambient assistant",
    "Salesforce Einstein",
    "Workday AI",
    "Oracle Digital Assistant",
    "ServiceNow Virtual Agent",
    "UiPath Autopilot",
    "Power Platform Copilot",
    "Tableau Pulse",
    "Power BI Copilot",
    "Snowflake Cortex",
    "Databricks Genie",
    "Amazon Q Business",
    "Google Gemini Enterprise",
    "Docusign AI",
    "Box AI",
    "Zoom AI Companion",
    "Slack AI",
    "Atlassian Intelligence",
    "SAS Viya Copilot",
]
AI_MODELS = [
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4o",
    "gpt-4o-mini",
    "o4-mini",
    "claude-sonnet-4",
    "claude-opus-4",
    "claude-haiku-3.5",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "llama-3.3-70b",
    "mistral-large",
    "command-r-plus",
    "titan-text-premier",
    "phi-4",
    "deepseek-r1",
    "snowflake-arctic",
    "databricks-dbrx",
    "biomed-summarizer-v2",
    "claims-denial-classifier-v3",
    "clinical-note-summarizer-v1",
    "contract-clause-extractor-v2",
    "invoice-anomaly-detector-v1",
    "member-churn-propensity-v4",
    "care-gap-prioritizer-v2",
    "provider-network-risk-v1",
    "supply-demand-forecast-v3",
    "revenue-cycle-copilot-v2",
    "it-service-routing-v1",
    "security-alert-triage-v2",
    "workforce-schedule-assistant-v1",
    "budget-variance-explainer-v1",
    "data-quality-remediation-v1",
    "prior-auth-intake-assistant-v2",
]
AI_USE_CASES = [
    "clinical note summarization",
    "claims denial appeal drafting",
    "member contact center assist",
    "provider contract review",
    "invoice anomaly review",
    "IT service ticket triage",
    "data quality issue clustering",
    "budget variance explanation",
    "supply backorder prediction",
    "nurse scheduling assist",
    "care-gap outreach prioritization",
    "RAF evidence summarization",
    "HEDIS measure gap analysis",
    "cyber alert triage",
    "policy Q&A",
    "contract clause extraction",
    "renewal risk scoring",
    "developer code completion",
    "BI narrative generation",
    "SQL generation assist",
    "meeting recap",
    "patient access scheduling assist",
    "prior authorization intake",
    "clinical trial matching",
    "pharmacy formulary exception review",
    "fraud waste abuse triage",
    "population health segmentation",
    "vendor performance summarization",
    "program status synthesis",
    "architecture decision support",
]
RISK_TYPES = ["access_control", "data_quality", "sox", "hipaa", "vendor_resilience", "model_risk", "disaster_recovery", "shadow_it", "change_control"]
KPI_NAMES = ["claims auto-adjudication rate", "denial overturn rate", "days in AR", "operating margin", "supply fill rate", "nursing vacancy rate", "member NPS", "appointment access days", "cloud cost variance", "report freshness SLA"]


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    return hashlib.sha256(path.read_bytes()).hexdigest()


def field_dictionary_rows(source_family: str, rows: list[dict[str, Any]], grain: str) -> list[dict[str, Any]]:
    metadata = SOURCE_METADATA[source_family]
    dictionary = []
    for field in rows[0].keys():
        dictionary.append(
            {
                "source_room_family": source_family,
                "field_name": field,
                "owner": metadata["owner"],
                "source_system": metadata["source_system"],
                "export_query": metadata["export_query"],
                "row_grain": grain,
                "acceptable_unfilled_state": metadata["acceptable_unfilled_state"],
                "do_not_collect": "Do not collect person-level confidential values, vendor-confidential protected material, or raw records beyond the declared grain unless specifically approved.",
                "client_fillability_state": "fillable_by_named_export",
            }
        )
    return dictionary


def row_basis(index: int) -> str:
    if index % 19 == 0:
        return "known_gap"
    if index % 11 == 0:
        return "owner_estimated"
    return "synthetic_source_recorded"


def review_state(index: int) -> str:
    return "not_reviewed" if index % 7 else "needs_follow_up"


def applications(rng: Random, count: int) -> list[dict[str, Any]]:
    rows = []
    for i in range(1, count + 1):
        product, vendor, domain, subdomain = APP_PRODUCTS[(i - 1) % len(APP_PRODUCTS)]
        function = FUNCTIONS[(i * 5) % len(FUNCTIONS)]
        rows.append(
            {
                "source_system": "ServiceNow CMDB synthetic export",
                "source_row_id": f"CMDB-{i:04d}",
                "application_id": f"APP-{i:04d}",
                "application_name": f"{product} {subdomain.title()} {i:03d}" if i > len(APP_PRODUCTS) else product,
                "base_product_name": product,
                "vendor_name": vendor,
                "application_domain": domain,
                "application_subdomain": subdomain,
                "business_function": function,
                "business_owner": f"{function} VP Office",
                "technical_owner": f"{domain.title()} Platform Team",
                "criticality_tier": "tier_1" if i % 9 == 0 else ("tier_2" if i % 3 == 0 else "tier_3"),
                "lifecycle_state": "replace_candidate" if i % 13 == 0 else ("watch" if i % 5 == 0 else "current"),
                "hosting_model": ["saas", "on_prem", "aws_hosted", "azure_hosted", "private_cloud"][i % 5],
                "environment_count": 3 if i % 4 == 0 else 1,
                "interface_count": 2 + (i % 9),
                "user_count_estimate": 50 + (i * 17) % 9000,
                "annual_cost_usd": 25000 + (i * 7319) % 3500000,
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    return rows


def interviews(count: int) -> list[dict[str, Any]]:
    roles = ["CIO", "CFO", "COO", "Chief Data Officer", "VP Clinical Operations", "VP Health Plan Ops", "Director Data Governance", "Director IT Finance", "Director Revenue Cycle", "Director Security"]
    themes = ["strategy", "operating model", "data quality", "governance", "application debt", "AI readiness", "vendor leverage", "budget pressure"]
    rows = []
    for i in range(1, count + 1):
        function = FUNCTIONS[i % len(FUNCTIONS)]
        theme = themes[i % len(themes)]
        rows.append(
            {
                "source_system": "interview workbook synthetic notes",
                "source_row_id": f"INT-{i:04d}",
                "interview_id": f"INT-{i:04d}",
                "interviewee_role": roles[i % len(roles)],
                "function": function,
                "seniority_band": "executive" if i % 5 == 0 else "director_plus",
                "question_id": f"Q-{theme.upper().replace(' ', '-')}-{i % 9 + 1:02d}",
                "theme": theme,
                "answer_excerpt": f"{function} reports {theme} as a current-state constraint with uneven tooling maturity and partial evidence coverage.",
                "priority_signal": ["high", "medium", "low"][i % 3],
                "ai_implication": f"AI use cases for {function} require verified {theme} controls before scaling.",
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    return rows


def hris(count: int) -> list[dict[str, Any]]:
    rows = []
    roles = ["analyst", "manager", "engineer", "architect", "product_owner", "support", "clinical_informaticist", "data_steward"]
    for i in range(1, count + 1):
        rows.append(
            {
                "source_system": "HRIS role summary synthetic export",
                "source_row_id": f"HR-{i:04d}",
                "function": FUNCTIONS[i % len(FUNCTIONS)],
                "role_family": roles[i % len(roles)],
                "location_segment": ["corporate", "hospital", "remote", "shared_services"][i % 4],
                "employee_count": 8 + (i * 13) % 740,
                "contractor_count": (i * 7) % 90,
                "open_requisition_count": i % 11,
                "attrition_rate": round(0.04 + (i % 12) / 100, 3),
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    return rows


def data_bi(count: int) -> list[dict[str, Any]]:
    rows = []
    for i in range(1, count + 1):
        workload = WORKLOADS[i % len(WORKLOADS)]
        tech = DATA_TECH[i % len(DATA_TECH)]
        function = FUNCTIONS[(i * 3) % len(FUNCTIONS)]
        rows.append(
            {
                "source_system": "BI ETL analytics volume synthetic export",
                "source_row_id": f"DA-{i:04d}",
                "function": function,
                "platform_name": f"{tech} {function} estate",
                "technology_name": tech,
                "workload_type": workload,
                "workload_count": 5 + (i * 23) % 1600,
                "active_user_count": 12 + (i * 37) % 12000,
                "data_volume_tb": round(0.5 + ((i * 17) % 900) / 10, 1),
                "refresh_frequency": ["real_time", "hourly", "daily", "weekly", "monthly"][i % 5],
                "governance_state": ["governed", "partially_governed", "shadow", "unknown"][i % 4],
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    return rows


def infrastructure(count: int) -> list[dict[str, Any]]:
    rows = []
    for i in range(1, count + 1):
        infra_type = INFRA_TYPES[i % len(INFRA_TYPES)]
        rows.append(
            {
                "source_system": "hosting platform synthetic export",
                "source_row_id": f"PLAT-{i:04d}",
                "platform_id": f"PLAT-{i:04d}",
                "platform_name": f"{infra_type.replace('_', ' ').title()} {i:03d}",
                "platform_type": infra_type,
                "hosting_location": ["primary_dc", "secondary_dc", "aws", "azure", "saas_vendor"][i % 5],
                "business_function": FUNCTIONS[(i * 2) % len(FUNCTIONS)],
                "capacity_unit": "mips" if "mainframe" in infra_type else ("tb" if "storage" in infra_type or "appliance" in infra_type else "vcore"),
                "capacity_value": 100 + (i * 47) % 28000,
                "utilization_percent": 25 + (i * 7) % 74,
                "dr_tier": ["tier_1_active_active", "tier_2_warm", "tier_3_backup_only", "unknown"][i % 4],
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    return rows


def finance(count: int) -> list[dict[str, Any]]:
    rows = []
    accounts = ["software", "services", "cloud", "telecom", "labor", "hardware", "maintenance", "bpo"]
    for i in range(1, count + 1):
        rows.append(
            {
                "source_system": "ERP GL budget actuals synthetic export",
                "source_row_id": f"FIN-{i:04d}",
                "fiscal_period": f"2026-{(i % 12) + 1:02d}",
                "cost_center": f"CC-{1000 + i % 240:04d}",
                "business_function": FUNCTIONS[i % len(FUNCTIONS)],
                "account_category": accounts[i % len(accounts)],
                "supplier_name": VENDORS[i % len(VENDORS)],
                "application_or_platform_ref": f"APP-{(i % 750) + 1:04d}" if i % 3 else f"PLAT-{(i % 220) + 1:04d}",
                "budget_usd": 20000 + (i * 9137) % 2500000,
                "actual_usd": 18000 + (i * 10007) % 2700000,
                "allocation_basis": ["direct", "allocated", "estimated", "unknown"][i % 4],
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    return rows


def ppm(count: int) -> list[dict[str, Any]]:
    rows = []
    for i in range(1, count + 1):
        rows.append(
            {
                "source_system": "PPM synthetic export",
                "source_row_id": f"PPM-{i:04d}",
                "program_id": f"PROG-{i:04d}",
                "initiative_id": f"INIT-{i:04d}",
                "program_name": f"{FUNCTIONS[i % len(FUNCTIONS)]} modernization wave {i % 17 + 1}",
                "sponsor_function": FUNCTIONS[i % len(FUNCTIONS)],
                "status": ["proposed", "approved", "in_flight", "at_risk", "closed"][i % 5],
                "approved_budget_usd": 250000 + (i * 28391) % 25000000,
                "forecast_usd": 260000 + (i * 30103) % 28000000,
                "target_value_usd": 500000 + (i * 42137) % 45000000,
                "dependent_applications": f"APP-{(i % 750) + 1:04d};APP-{((i + 39) % 750) + 1:04d}",
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    return rows


def contracts(count: int) -> list[dict[str, Any]]:
    rows = []
    towers = ["clinical_apps", "claims_admin", "hr_bpo", "finance_bpo", "supply_chain_bpo", "data_platform", "managed_infra", "ai_platform"]
    for i in range(1, count + 1):
        rows.append(
            {
                "source_system": "CLM contract register synthetic export",
                "source_row_id": f"CTR-{i:04d}",
                "contract_id": f"CTR-{i:04d}",
                "supplier_name": VENDORS[i % len(VENDORS)],
                "service_tower": towers[i % len(towers)],
                "annualized_value_usd": 100000 + (i * 117731) % 18000000,
                "start_date": f"202{1 + i % 5}-01-01",
                "end_date": f"202{6 + i % 5}-12-31",
                "notice_window_days": [90, 120, 180, 365][i % 4],
                "benchmarking_right": ["present", "absent", "limited", "unknown"][i % 4],
                "minimum_commitment_usd": 0 if i % 5 else 250000 + (i * 31111) % 9000000,
                "scoped_applications": f"APP-{(i % 750) + 1:04d};APP-{((i + 71) % 750) + 1:04d};APP-{((i + 113) % 750) + 1:04d}",
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    return rows


def grc(count: int) -> list[dict[str, Any]]:
    rows = []
    for i in range(1, count + 1):
        rows.append(
            {
                "source_system": "GRC synthetic export",
                "source_row_id": f"GRC-{i:04d}",
                "risk_or_control_id": f"RISK-{i:04d}" if i % 2 else f"CTRL-{i:04d}",
                "risk_type": RISK_TYPES[i % len(RISK_TYPES)],
                "business_function": FUNCTIONS[i % len(FUNCTIONS)],
                "object_ref": f"APP-{(i % 750) + 1:04d}" if i % 4 else f"PLAT-{(i % 220) + 1:04d}",
                "severity": ["critical", "high", "medium", "low"][i % 4],
                "control_state": ["effective", "partially_effective", "missing", "unknown"][i % 4],
                "open_exception_count": i % 13,
                "evidence_ref": f"EVID-{(i % 500) + 1:04d}",
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    return rows


def kpis(count: int) -> list[dict[str, Any]]:
    rows = []
    for i in range(1, count + 1):
        rows.append(
            {
                "source_system": "operations KPI synthetic export",
                "source_row_id": f"KPI-{i:04d}",
                "period": f"2026-Q{(i % 4) + 1}",
                "business_function": FUNCTIONS[i % len(FUNCTIONS)],
                "kpi_name": KPI_NAMES[i % len(KPI_NAMES)],
                "kpi_value": round(20 + (i * 1.7) % 95, 2),
                "kpi_unit": ["percent", "days", "usd", "count"][i % 4],
                "target_value": round(25 + (i * 1.3) % 90, 2),
                "source_application_ref": f"APP-{(i % 750) + 1:04d}",
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    return rows


def ai_usage(count: int) -> list[dict[str, Any]]:
    rows = []
    for i in range(1, count + 1):
        tool_name = AI_TOOLS[i % len(AI_TOOLS)]
        rows.append(
            {
                "source_system": "AI usage telemetry synthetic export",
                "source_row_id": f"AIU-{i:04d}",
                "period": f"2026-{(i % 12) + 1:02d}",
                "tool_name": tool_name,
                "model_name": AI_MODELS[i % len(AI_MODELS)],
                "use_case_name": AI_USE_CASES[i % len(AI_USE_CASES)],
                "vendor_name": "Microsoft Corporation" if "Copilot" in tool_name else ("ServiceNow Inc." if "ServiceNow" in tool_name else "AbarVa synthetic vendor mapping"),
                "business_function": FUNCTIONS[i % len(FUNCTIONS)],
                "user_segment": ["executive", "director", "manager", "analyst", "engineer", "clinical_user"][i % 6],
                "licensed_users": 25 + (i * 19) % 6000,
                "active_users": 5 + (i * 17) % 4500,
                "usage_events": 100 + (i * 271) % 250000,
                "monthly_cost_usd": 500 + (i * 503) % 180000,
                "use_case_category": ["summarization", "coding", "analytics", "service_desk", "clinical_documentation", "knowledge_search"][i % 6],
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    return rows


def evidence(count: int) -> list[dict[str, Any]]:
    rows = []
    non_contract_types = ["interview_note", "cmdb_export", "finance_extract", "sla_report", "dashboard_export", "policy_document", "attestation"]
    for i in range(1, count + 1):
        artifact_type = "contract_pdf" if i <= 420 else non_contract_types[i % len(non_contract_types)]
        supported_ref = f"CTR-{(i % 230) + 1:04d}" if artifact_type == "contract_pdf" else (f"APP-{(i % 750) + 1:04d}" if i % 3 else f"CTR-{(i % 230) + 1:04d}")
        rows.append(
            {
                "source_system": "evidence room synthetic register",
                "source_row_id": f"EVID-{i:04d}",
                "evidence_id": f"EVID-{i:04d}",
                "artifact_type": artifact_type,
                "owning_function": FUNCTIONS[i % len(FUNCTIONS)],
                "supports_object_ref": supported_ref,
                "document_date": f"2026-{(i % 12) + 1:02d}-{(i % 27) + 1:02d}",
                "verification_state": ["unverified", "owner_attested", "system_exported", "needs_follow_up"][i % 4],
                "page_ref": "" if i % 2 else f"p{(i % 18) + 1}",
                "span_ref": "" if i % 2 else f"{100 + i}-{180 + i}",
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    return rows


def data_flows(count: int) -> list[dict[str, Any]]:
    rows = []
    patterns = ["batch_file", "api", "hl7", "edi", "streaming", "database_replication", "etl", "message_queue"]
    landing_layers = ["raw", "ods", "canonical", "mart", "reporting", "api_consumer"]
    for i in range(1, count + 1):
        source = f"APP-{(i % 750) + 1:04d}"
        if i % 7 == 0:
            target = "PLAT-DATA-HUB-001"
        elif i % 11 == 0:
            target = "PLAT-EPIC-COGITO-001"
        elif i % 13 == 0:
            target = "PLAT-FIN-MART-001"
        else:
            target = f"APP-{((i * 3) % 750) + 1:04d}"
        rows.append(
            {
                "source_system": "integration and data-flow synthetic export",
                "source_row_id": f"FLOW-{i:04d}",
                "flow_id": f"FLOW-{i:04d}",
                "source_object_ref": source,
                "target_object_ref": target,
                "source_function": FUNCTIONS[i % len(FUNCTIONS)],
                "target_function": FUNCTIONS[(i * 2) % len(FUNCTIONS)],
                "integration_pattern": patterns[i % len(patterns)],
                "landing_layer": landing_layers[i % len(landing_layers)],
                "consumption_layer": landing_layers[(i + 3) % len(landing_layers)],
                "cadence": ["real_time", "hourly", "daily", "weekly", "monthly"][i % 5],
                "regulated_data_flag": "yes" if i % 4 == 0 else "no",
                "interface_owner": f"{FUNCTIONS[(i * 5) % len(FUNCTIONS)]} Integration Owner",
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    return rows


def deployments(count: int) -> list[dict[str, Any]]:
    rows = []
    envs = ["Production", "Test", "Training", "DR"]
    for i in range(1, count + 1):
        app_index = (i % 750) + 1
        platform_index = (i % 220) + 1
        env = envs[i % len(envs)]
        rows.append(
            {
                "source_system": "deployment hosting synthetic export",
                "source_row_id": f"DEP-{i:04d}",
                "deployment_id": f"DEP-{i:04d}",
                "application_id": f"APP-{app_index:04d}",
                "environment": env,
                "hosting_platform_ref": f"PLAT-{platform_index:04d}",
                "hosting_model": ["saas", "on_prem", "aws_hosted", "azure_hosted", "private_cloud"][i % 5],
                "region_or_location": ["primary_dc", "secondary_dc", "us-east-1", "us-east-2", "central-us"][i % 5],
                "runtime_state": "retired" if i % 37 == 0 else ("planned" if i % 23 == 0 else "active"),
                "dr_tier": ["tier_1_active_active", "tier_2_warm", "tier_3_backup_only", "unknown"][i % 4],
                "deployment_owner": f"{FUNCTIONS[(i * 4) % len(FUNCTIONS)]} Platform Owner",
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    return rows


BUILDERS = {
    "SP01_Documents_Interviews": interviews,
    "SP02_HRIS": hris,
    "SP03_CMDB": lambda count: applications(Random(SEED), count),
    "SP04_Data_BI_ETL": data_bi,
    "SP05_Infrastructure": infrastructure,
    "SP06_Finance_ERP": finance,
    "SP07_PPM": ppm,
    "SP08_Vendor_Contract": contracts,
    "SP09_GRC": grc,
    "SP10_KPI_Operations": kpis,
    "SP11_AI_Usage_Models": ai_usage,
    "SP12_Evidence_Room": evidence,
    "SP13_Data_Flows_Integrations": data_flows,
    "SP14_Deployments_Hosting": deployments,
}


def build_report(summary: dict[str, Any], inventory: list[dict[str, Any]]) -> str:
    lines = [
        "# Dense Source Room Catch-Up Report",
        "",
        "This is a Layer 1 synthetic source-room catch-up package. It creates realistic source-system extract volumes for adapter and workbook QA; it does not assert client truth, load Azure, rebuild cubes, or prove products.",
        "",
        "## Summary",
        "",
        f"- Generated extracts: {summary['extract_count']}",
        f"- Generated rows: {summary['row_count']}",
        f"- Output directory: `{summary['out_dir']}`",
        f"- Manifest: `{summary['manifest_path']}`",
        "",
        "## Extracts",
        "",
        "| Source playbook | Rows | Grain | SHA-256 |",
        "|---|---:|---|---|",
    ]
    for row in inventory:
        lines.append(f"| `{row['source_room_family']}` | {row['row_count']} | {row['row_grain']} | `{row['sha256']}` |")
    lines.extend(
        [
            "",
            "## Current Boundary",
            "",
            "- Values are marked as synthetic source-room data and are not client-attested.",
            "- Rows include `source_basis` and `review_state` so partial/unknown states survive downstream.",
            "- This package is meant to feed Layer 2 adapter QA, not product pages directly.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    out_dir = args.out_dir.resolve()
    source_root = out_dir / "__synthetic_sources__"
    inventory: list[dict[str, Any]] = []
    dictionary_rows: list[dict[str, Any]] = []
    total_rows = 0

    for family, (filename, target_count, grain) in TARGETS.items():
        rows = BUILDERS[family](target_count)
        for row in rows:
            row["synthetic_dataset_id"] = "SOURCE_ROOM_DENSE_CATCHUP_2026_08_23"
            row["synthetic_generation_basis"] = "deterministic_depth_simulation"
            row["client_attestation_state"] = "not_client_attested"
        path = source_root / family / filename
        sha = write_csv(path, rows, list(rows[0].keys()))
        dictionary_rows.extend(field_dictionary_rows(family, rows, grain))
        total_rows += len(rows)
        inventory.append(
            {
                "source_room_family": family,
                "file_path": path.relative_to(out_dir).as_posix(),
                "row_count": len(rows),
                "row_grain": grain,
                "sha256": sha,
            }
        )

    manifest_path = out_dir / "dense_source_room_manifest.csv"
    write_csv(manifest_path, inventory, ["source_room_family", "file_path", "row_count", "row_grain", "sha256"])
    dictionary_path = out_dir / "dense_source_room_field_dictionary.csv"
    write_csv(
        dictionary_path,
        dictionary_rows,
        [
            "source_room_family",
            "field_name",
            "owner",
            "source_system",
            "export_query",
            "row_grain",
            "acceptable_unfilled_state",
            "do_not_collect",
            "client_fillability_state",
        ],
    )
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "out_dir": out_dir.as_posix(),
        "manifest_path": manifest_path.as_posix(),
        "field_dictionary_path": dictionary_path.as_posix(),
        "extract_count": len(inventory),
        "field_dictionary_rows": len(dictionary_rows),
        "row_count": total_rows,
        "synthetic_dataset_id": "SOURCE_ROOM_DENSE_CATCHUP_2026_08_23",
        "client_attestation_state": "not_client_attested",
        "seed": SEED,
    }
    (out_dir / "dense_source_room_summary.json").write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    (out_dir / "DENSE_SOURCE_ROOM_CATCHUP_REPORT.md").write_text(build_report(summary, inventory), encoding="utf-8")
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
