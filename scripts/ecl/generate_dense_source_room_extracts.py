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
from collections import Counter
from datetime import date, datetime, timezone
from pathlib import Path
from random import Random
from typing import Any


DEFAULT_OUT_DIR = Path("outputs/source-room-depth-catchup-2026-08-23")
SEED = 20260823
DEMO_AS_OF_DATE = date(2026, 9, 15)

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


def stable_index(*parts: object, modulo: int) -> int:
    digest = hashlib.sha256("|".join(str(part) for part in parts).encode("utf-8")).hexdigest()
    return int(digest[:12], 16) % modulo


def app_ref(*parts: object) -> str:
    return f"APP-{stable_index('app-ref', *parts, modulo=750) + 1:04d}"


def platform_ref(*parts: object) -> str:
    return f"PLAT-{stable_index('platform-ref', *parts, modulo=220) + 1:04d}"


def distinct_app_refs(label: str, row_index: int, count: int) -> list[str]:
    refs: list[str] = []
    salt = 0
    while len(refs) < count:
        ref = app_ref(label, row_index, salt)
        if ref not in refs:
            refs.append(ref)
        salt += 1
    return refs


def weighted_choice(label: str, row_index: int, weighted_values: list[tuple[str, int]], salt: object = "") -> str:
    total = sum(weight for _value, weight in weighted_values)
    pick = stable_index(label, row_index, salt, modulo=total)
    cursor = 0
    for value, weight in weighted_values:
        cursor += weight
        if pick < cursor:
            return value
    return weighted_values[-1][0]


def weighted_function(label: str, row_index: int, salt: object = "") -> str:
    return weighted_choice(label, row_index, FUNCTION_WEIGHTS, salt)

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

FUNCTION_WEIGHTS = [
    ("Clinical Operations", 22),
    ("Health Plan Operations", 18),
    ("Data and Analytics", 13),
    ("Information Technology", 11),
    ("Revenue Cycle", 10),
    ("Member Services", 8),
    ("Provider Network", 7),
    ("Finance", 7),
    ("Pharmacy", 6),
    ("Supply Chain", 5),
    ("Human Resources", 4),
    ("Risk and Compliance", 3),
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
DATA_TECH_WEIGHTS = [
    ("Power BI", 18),
    ("Tableau", 14),
    ("SSRS", 10),
    ("Business Objects", 7),
    ("Cognos", 6),
    ("Qlik", 5),
    ("SAS", 8),
    ("Informatica", 9),
    ("SSIS", 10),
    ("DataStage", 5),
    ("SQL Agent", 12),
    ("Python", 9),
    ("Alteryx", 4),
]
WORKLOAD_WEIGHTS = [
    ("reports", 26),
    ("dashboards", 20),
    ("etl_jobs", 18),
    ("stored_procedures", 13),
    ("scripts", 11),
    ("data_marts", 7),
    ("semantic_models", 4),
    ("notebooks", 3),
]
INFRA_TYPE_WEIGHTS = [
    ("mainframe", 3),
    ("teradata_appliance", 2),
    ("netezza_appliance", 2),
    ("sql_server_cluster", 18),
    ("epic_aws", 5),
    ("vmware_cluster", 18),
    ("azure_subscription", 12),
    ("aws_account", 14),
    ("storage_platform", 12),
    ("citrix_farm", 5),
    ("network_segment", 11),
    ("security_platform", 9),
]
HOSTING_LOCATION_WEIGHTS = [
    ("primary_dc", 22),
    ("secondary_dc", 12),
    ("aws", 24),
    ("azure", 17),
    ("saas_vendor", 25),
]
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
APPLICATION_COST_TOTAL_USD = 436_500_000
CONTRACT_VALUE_TOTAL_USD = 496_400_000

STRATEGIC_CONTRACT_VENDOR_COUNTS = [
    ("Epic Systems Corporation", 8),
    ("Microsoft Corporation", 7),
    ("Amazon Web Services Inc.", 7),
    ("Oracle Corporation", 6),
    ("IBM Corporation", 6),
    ("Workday Inc.", 6),
    ("Infor Inc.", 5),
    ("Salesforce Inc.", 5),
    ("ServiceNow Inc.", 5),
    ("TriZetto Corporation", 5),
    ("HealthEdge Software", 5),
]

STRATEGIC_CONTRACT_VENDOR_WEIGHTS = {
    "Epic Systems Corporation": 18.0,
    "Microsoft Corporation": 14.0,
    "Amazon Web Services Inc.": 14.0,
    "Oracle Corporation": 12.0,
    "IBM Corporation": 12.0,
    "Workday Inc.": 10.0,
    "Infor Inc.": 9.0,
    "Salesforce Inc.": 8.0,
    "ServiceNow Inc.": 8.0,
    "TriZetto Corporation": 7.0,
    "HealthEdge Software": 7.0,
}


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
    weights: list[float] = []
    for i in range(1, count + 1):
        product, _vendor, domain, subdomain = APP_PRODUCTS[(i - 1) % len(APP_PRODUCTS)]
        function = weighted_function("applications", i)
        base = 1.0
        if "Epic" in product:
            base *= 7.5
        if product in {"Facets", "HealthRules Payor", "QNXT", "Netezza Warehouse", "Snowflake Enterprise", "Informatica PowerCenter"}:
            base *= 4.5
        if domain in {"clinical", "health_plan"}:
            base *= 2.2
        if function in {"Data and Analytics", "Information Technology", "Revenue Cycle"}:
            base *= 1.6
        if subdomain in {"ehr", "core_admin", "claims", "warehouse", "etl"}:
            base *= 1.7
        base *= 0.55 + ((i * 37) % 100) / 100
        base *= 1 + (i / (count * 19))
        base += (i % 97) / 1000
        weights.append(base)
    weight_total = sum(weights)

    for i in range(1, count + 1):
        product, vendor, domain, subdomain = APP_PRODUCTS[(i - 1) % len(APP_PRODUCTS)]
        function = weighted_function("applications", i)
        environment_count = [1, 1, 1, 2, 2, 3, 3, 4, 5][i % 9]
        annual_cost = round((weights[i - 1] / weight_total) * APPLICATION_COST_TOTAL_USD, 2)
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
                "environment_count": environment_count,
                "interface_count": 2 + (i % 9),
                "user_count_estimate": 50 + (i * 17) % 9000,
                "annual_cost_usd": annual_cost,
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    plant_demo_application_findings(rows)
    return rows


def plant_demo_application_findings(rows: list[dict[str, Any]]) -> None:
    f4_vendors = [
        "Epic Systems Corporation",
        "Oracle Corporation",
        "Microsoft Corporation",
        "HealthEdge Software",
        "Cognizant Technology Solutions",
    ]
    for offset, row in enumerate(rows[:5]):
        row.update(
            {
                "application_domain": "health_plan",
                "application_subdomain": "claims",
                "business_function": "Health Plan Operations",
                "vendor_name": f4_vendors[offset],
                "lifecycle_state": "current",
            }
        )

    for row in rows[5:10]:
        row.update(
            {
                "application_domain": "clinical",
                "application_subdomain": "ehr",
                "business_function": "Clinical Operations",
                "vendor_name": "Epic Systems Corporation",
                "lifecycle_state": "current",
            }
        )


def interviews(count: int) -> list[dict[str, Any]]:
    roles = ["CIO", "CFO", "COO", "Chief Data Officer", "VP Clinical Operations", "VP Health Plan Ops", "Director Data Governance", "Director IT Finance", "Director Revenue Cycle", "Director Security"]
    themes = ["strategy", "operating model", "data quality", "governance", "application debt", "AI readiness", "vendor leverage", "budget pressure"]
    rows = []
    for i in range(1, count + 1):
        function = weighted_function("interviews", i)
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
                "function": weighted_function("hris", i),
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
        workload = weighted_choice("data-bi-workload", i, WORKLOAD_WEIGHTS)
        tech = weighted_choice("data-bi-tech", i, DATA_TECH_WEIGHTS)
        function = weighted_function("data-bi", i)
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
    plant_demo_data_bi_findings(rows)
    return rows


def plant_demo_data_bi_findings(rows: list[dict[str, Any]]) -> None:
    technologies = ["Power BI", "Tableau", "SSRS", "SAS"]
    governance_states = ["governed", "partially_governed", "governed", "ungoverned"]
    for offset, row in enumerate(rows[:4]):
        row.update(
            {
                "function": "Finance",
                "platform_name": f"{technologies[offset]} finance-close reporting estate",
                "technology_name": technologies[offset],
                "workload_type": "reports",
                "workload_count": 220 + (offset * 47),
                "active_user_count": 650 + (offset * 140),
                "governance_state": governance_states[offset],
            }
        )


def infrastructure(count: int) -> list[dict[str, Any]]:
    rows = []
    for i in range(1, count + 1):
        infra_type = weighted_choice("infrastructure-type", i, INFRA_TYPE_WEIGHTS)
        support_end_date = ""
        if "mainframe" in infra_type:
            support_end_date = f"202{7 + (i % 3)}-06-30"
        elif infra_type == "netezza_appliance":
            support_end_date = "2027-12-31" if i % 5 == 0 else "2026-06-30"
        elif "sql_server" in infra_type:
            support_end_date = f"202{6 + (i % 4)}-10-14"
        rows.append(
            {
                "source_system": "hosting platform synthetic export",
                "source_row_id": f"PLAT-{i:04d}",
                "platform_id": f"PLAT-{i:04d}",
                "platform_name": f"{infra_type.replace('_', ' ').title()} {i:03d}",
                "platform_type": infra_type,
                "hosting_location": weighted_choice("infrastructure-hosting-location", i, HOSTING_LOCATION_WEIGHTS),
                "business_function": weighted_function("infrastructure", i),
                "capacity_unit": "mips" if "mainframe" in infra_type else ("tb" if "storage" in infra_type or "appliance" in infra_type else "vcore"),
                "capacity_value": 100 + (i * 47) % 28000,
                "utilization_percent": 25 + (i * 7) % 74,
                "dr_tier": ["tier_1_active_active", "tier_2_warm", "tier_3_backup_only", "unknown"][i % 4],
                "support_end_date": support_end_date,
                "demo_as_of_date": DEMO_AS_OF_DATE.isoformat(),
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    plant_demo_infrastructure_findings(rows)
    return rows


def plant_demo_infrastructure_findings(rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    rows[0].update(
        {
            "platform_id": "PLAT-CLIN-NETEZZA-001",
            "platform_name": "Clinical Quality Netezza Appliance",
            "platform_type": "netezza_appliance",
            "hosting_location": "primary_dc",
            "business_function": "Clinical Operations",
            "capacity_unit": "tb",
            "capacity_value": 480,
            "utilization_percent": 91,
            "dr_tier": "tier_3_backup_only",
            "support_end_date": "2027-12-31",
        }
    )


def finance(count: int) -> list[dict[str, Any]]:
    rows = []
    accounts = ["software", "services", "cloud", "telecom", "labor", "hardware", "maintenance", "bpo"]
    for i in range(1, count + 1):
        rows.append(
            {
                "source_system": "ERP GL budget actuals synthetic export",
                "source_row_id": f"FIN-{i:04d}",
                "fiscal_period": f"{2025 + ((i - 1) // 240)}-{((i - 1) % 12) + 1:02d}",
                "cost_center": f"CC-{1000 + stable_index('finance-cost-center', i, modulo=180):04d}",
                "business_function": weighted_function("finance", i),
                "account_category": accounts[i % len(accounts)],
                "supplier_name": VENDORS[i % len(VENDORS)],
                "application_or_platform_ref": app_ref("finance", i) if i % 3 else platform_ref("finance", i),
                "budget_usd": 20000 + (i * 9137) % 2500000,
                "actual_usd": 18000 + (i * 10007) % 2700000,
                "allocation_basis": ["direct", "allocated", "estimated", "unknown"][i % 4],
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    plant_demo_finance_findings(rows)
    return rows


def plant_demo_finance_findings(rows: list[dict[str, Any]]) -> None:
    unattributed_count = round(len(rows) * 0.12)
    for index, row in enumerate(rows):
        if index < unattributed_count:
            row.update(
                {
                    "business_function": "Finance",
                    "application_or_platform_ref": "",
                    "allocation_basis": "unknown",
                }
            )
        elif row["allocation_basis"] == "unknown":
            row["allocation_basis"] = "allocated"


def ppm(count: int) -> list[dict[str, Any]]:
    rows = []
    for i in range(1, count + 1):
        rows.append(
            {
                "source_system": "PPM synthetic export",
                "source_row_id": f"PPM-{i:04d}",
                "program_id": f"PROG-{i:04d}",
                "initiative_id": f"INIT-{i:04d}",
                "program_name": f"{weighted_function('ppm', i)} modernization wave {i % 17 + 1}",
                "sponsor_function": weighted_function("ppm", i),
                "status": ["proposed", "approved", "in_flight", "at_risk", "closed"][i % 5],
                "approved_budget_usd": 250000 + (i * 28391) % 25000000,
                "forecast_usd": 260000 + (i * 30103) % 28000000,
                "target_value_usd": 500000 + (i * 42137) % 45000000,
                "dependent_applications": ";".join(distinct_app_refs("ppm-dependent", i, 2)),
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    return rows


def contract_vendor_sequence(count: int) -> list[str]:
    vendors: list[str] = []
    for vendor, vendor_count in STRATEGIC_CONTRACT_VENDOR_COUNTS:
        vendors.extend([vendor] * vendor_count)

    tail_vendors = [vendor for vendor in VENDORS if vendor not in {name for name, _count in STRATEGIC_CONTRACT_VENDOR_COUNTS}]
    tail_index = 0
    while len(vendors) < count:
        vendor = tail_vendors[tail_index % len(tail_vendors)]
        repeat_count = 2 if tail_index < 75 else 1
        vendors.extend([vendor] * min(repeat_count, count - len(vendors)))
        tail_index += 1
    return vendors[:count]


def contracts(count: int) -> list[dict[str, Any]]:
    rows = []
    towers = ["clinical_apps", "claims_admin", "hr_bpo", "finance_bpo", "supply_chain_bpo", "data_platform", "managed_infra", "ai_platform"]
    suppliers = contract_vendor_sequence(count)
    weights: list[float] = []
    for i, supplier_name in enumerate(suppliers, start=1):
        tower = towers[i % len(towers)]
        base = STRATEGIC_CONTRACT_VENDOR_WEIGHTS.get(supplier_name, 1.0)
        if tower in {"clinical_apps", "claims_admin", "data_platform", "managed_infra"}:
            base *= 1.25
        if i % 17 == 0:
            base *= 1.4
        base *= 0.82 + ((i * 29) % 35) / 100
        weights.append(base)
    weight_total = sum(weights)
    for i in range(1, count + 1):
        supplier_name = suppliers[i - 1]
        annualized_value = round((weights[i - 1] / weight_total) * CONTRACT_VALUE_TOTAL_USD, 2)
        rows.append(
            {
                "source_system": "CLM contract register synthetic export",
                "source_row_id": f"CTR-{i:04d}",
                "contract_id": f"CTR-{i:04d}",
                "supplier_name": supplier_name,
                "service_tower": towers[i % len(towers)],
                "annualized_value_usd": annualized_value,
                "start_date": f"202{1 + i % 5}-01-01",
                "end_date": f"202{6 + i % 5}-12-31",
                "notice_window_days": [90, 120, 180, 365][i % 4],
                "benchmarking_right": ["present", "absent", "limited", "unknown"][i % 4],
                "minimum_commitment_usd": 0 if i % 5 else 250000 + (i * 31111) % 9000000,
                "termination_for_convenience": "true",
                "auto_renew": "false",
                "demo_as_of_date": DEMO_AS_OF_DATE.isoformat(),
                "scoped_applications": ";".join(distinct_app_refs("contract-scope", i, 3)),
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    plant_demo_contract_findings(rows)
    return rows


def plant_demo_contract_findings(rows: list[dict[str, Any]]) -> None:
    for offset, row in enumerate(rows[:3]):
        row.update(
            {
                "supplier_name": ["R1 RCM Inc.", "Optum Rx", "HealthEdge Software"][offset],
                "service_tower": "claims_admin",
                "annualized_value_usd": round(7_500_000 + (offset * 1_100_000), 2),
                "scoped_applications": "APP-0001;APP-0002;APP-0003",
            }
        )

    for row in rows[:34]:
        row.update(
            {
                "benchmarking_right": "absent",
                "minimum_commitment_usd": max(float(row["annualized_value_usd"]) * 0.8, 500_000),
                "notice_window_days": max(int(row["notice_window_days"]), 90),
                "termination_for_convenience": "false",
            }
        )

    if len(rows) >= 2:
        rows[1].update(
            {
                "end_date": "2026-10-15",
                "notice_window_days": 90,
                "benchmarking_right": "absent",
                "minimum_commitment_usd": 1_250_000,
                "auto_renew": "true",
            }
        )


def grc(count: int) -> list[dict[str, Any]]:
    rows = []
    for i in range(1, count + 1):
        rows.append(
            {
                "source_system": "GRC synthetic export",
                "source_row_id": f"GRC-{i:04d}",
                "risk_or_control_id": f"RISK-{i:04d}" if i % 2 else f"CTRL-{i:04d}",
                "risk_type": RISK_TYPES[i % len(RISK_TYPES)],
                "business_function": weighted_function("grc", i),
                "object_ref": app_ref("grc", i) if i % 4 else platform_ref("grc", i),
                "severity": ["critical", "high", "medium", "low"][i % 4],
                "control_state": ["effective", "partially_effective", "missing", "unknown"][i % 4],
                "open_exception_count": i % 13,
                "evidence_ref": f"EVID-{(i % 500) + 1:04d}",
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    plant_demo_grc_findings(rows)
    return rows


def plant_demo_grc_findings(rows: list[dict[str, Any]]) -> None:
    for offset, row in enumerate(rows[:5], start=6):
        row.update(
            {
                "risk_type": "security",
                "business_function": "Clinical Operations",
                "object_ref": f"APP-{offset:04d}",
                "severity": "high",
                "control_state": "missing",
                "open_exception_count": 3 + offset,
                "evidence_ref": f"EVID-{offset:04d}",
            }
        )


def kpis(count: int) -> list[dict[str, Any]]:
    rows = []
    for i in range(1, count + 1):
        rows.append(
            {
                "source_system": "operations KPI synthetic export",
                "source_row_id": f"KPI-{i:04d}",
                "period": f"2026-Q{(i % 4) + 1}",
                "business_function": weighted_function("kpi", i),
                "kpi_name": KPI_NAMES[i % len(KPI_NAMES)],
                "kpi_value": round(20 + (i * 1.7) % 95, 2),
                "kpi_unit": ["percent", "days", "usd", "count"][i % 4],
                "target_value": round(25 + (i * 1.3) % 90, 2),
                "source_application_ref": app_ref("kpi", i),
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
                "business_function": weighted_function("ai-usage", i),
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
        supported_ref = f"CTR-{(i % 230) + 1:04d}" if artifact_type == "contract_pdf" else (app_ref("evidence", i) if i % 3 else f"CTR-{(i % 230) + 1:04d}")
        rows.append(
            {
                "source_system": "evidence room synthetic register",
                "source_row_id": f"EVID-{i:04d}",
                "evidence_id": f"EVID-{i:04d}",
                "artifact_type": artifact_type,
                "owning_function": weighted_function("evidence", i),
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
        source = app_ref("flow-source", i)
        if i % 7 == 0:
            target = "PLAT-DATA-HUB-001"
        elif i % 11 == 0:
            target = "PLAT-EPIC-COGITO-001"
        elif i % 13 == 0:
            target = "PLAT-FIN-MART-001"
        else:
            target = app_ref("flow-target", i)
            if target == source:
                target = app_ref("flow-target-alt", i)
        rows.append(
            {
                "source_system": "integration and data-flow synthetic export",
                "source_row_id": f"FLOW-{i:04d}",
                "flow_id": f"FLOW-{i:04d}",
                "source_object_ref": source,
                "target_object_ref": target,
                "source_function": weighted_function("data-flow-source", i),
                "target_function": weighted_function("data-flow-target", i),
                "integration_pattern": patterns[i % len(patterns)],
                "landing_layer": landing_layers[i % len(landing_layers)],
                "consumption_layer": landing_layers[(i + 3) % len(landing_layers)],
                "cadence": ["real_time", "hourly", "daily", "weekly", "monthly"][i % 5],
                "regulated_data_flag": "yes" if i % 4 == 0 else "no",
                "interface_owner": f"{weighted_function('data-flow-owner', i)} Integration Owner",
                "source_basis": row_basis(i),
                "review_state": review_state(i),
            }
        )
    plant_demo_data_flow_findings(rows)
    return rows


def plant_demo_data_flow_findings(rows: list[dict[str, Any]]) -> None:
    for offset, row in enumerate(rows[:18]):
        row.update(
            {
                "source_function": "Revenue Cycle",
                "target_function": "Revenue Cycle",
                "source_object_ref": f"APP-{100 + offset:04d}",
                "target_object_ref": f"APP-{300 + offset:04d}",
                "landing_layer": "unknown",
                "consumption_layer": "unknown",
            }
        )


def deployments(count: int) -> list[dict[str, Any]]:
    rows = []
    envs = ["Production", "Test", "Training", "DR"]
    for i in range(1, count + 1):
        env = envs[i % len(envs)]
        rows.append(
            {
                "source_system": "deployment hosting synthetic export",
                "source_row_id": f"DEP-{i:04d}",
                "deployment_id": f"DEP-{i:04d}",
                "application_id": app_ref("deployment", i),
                "environment": env,
                "hosting_platform_ref": platform_ref("deployment", i),
                "hosting_model": ["saas", "on_prem", "aws_hosted", "azure_hosted", "private_cloud"][i % 5],
                "region_or_location": ["primary_dc", "secondary_dc", "us-east-1", "us-east-2", "central-us"][i % 5],
                "runtime_state": "retired" if i % 37 == 0 else ("planned" if i % 23 == 0 else "active"),
                "dr_tier": ["tier_1_active_active", "tier_2_warm", "tier_3_backup_only", "unknown"][i % 4],
                "deployment_owner": f"{weighted_function('deployment-owner', i)} Platform Owner",
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
        f"- Application annual cost total: `${summary['application_annual_cost_total_usd']:,.2f}`",
        f"- Application top-decile cost share: `{summary['application_top_decile_cost_share']:.2%}`",
        f"- Application distinct annual costs: `{summary['distinct_application_annual_costs']}`",
        f"- Application environment counts: `{', '.join(map(str, summary['application_environment_count_values']))}`",
        f"- Contract annualized value total: `${summary['contract_annualized_value_total_usd']:,.2f}`",
        f"- Contract top-decile value share: `{summary['contract_top_decile_value_share']:.2%}`",
        f"- Contracts per supplier: `{summary['contracts_per_supplier']:.2f}`",
        f"- Top supplier contract count: `{summary['contract_top_supplier_contract_count']}`",
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


def application_realism_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    costs = sorted((float(row["annual_cost_usd"]) for row in rows), reverse=True)
    cost_total = round(sum(costs), 2)
    top_decile_count = max(1, len(costs) // 10)
    top_decile_share = round(sum(costs[:top_decile_count]) / max(sum(costs), 1), 4)
    tier_1_ratio = round(sum(1 for row in rows if row["criticality_tier"] == "tier_1") / len(rows), 4)
    environment_values = sorted({int(row["environment_count"]) for row in rows})
    failures = 0
    if abs(cost_total - APPLICATION_COST_TOTAL_USD) / APPLICATION_COST_TOTAL_USD > 0.005:
        failures += 1
    if not 0.30 <= top_decile_share <= 0.75:
        failures += 1
    if len({row["annual_cost_usd"] for row in rows}) != len(rows):
        failures += 1
    if len(environment_values) < 4:
        failures += 1
    if not 0.10 <= tier_1_ratio <= 0.15:
        failures += 1
    return {
        "application_annual_cost_total_usd": cost_total,
        "application_top_decile_cost_share": top_decile_share,
        "distinct_application_annual_costs": len({row["annual_cost_usd"] for row in rows}),
        "application_environment_count_values": environment_values,
        "application_tier_1_ratio": tier_1_ratio,
        "application_realism_gate_failures": failures,
    }


def contract_realism_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    values = sorted((float(row["annualized_value_usd"]) for row in rows), reverse=True)
    value_total = round(sum(values), 2)
    top_decile_count = max(1, len(values) // 10)
    top_decile_share = round(sum(values[:top_decile_count]) / max(sum(values), 1), 4)
    max_contract_share = round(max(values, default=0) / max(sum(values), 1), 4)
    supplier_counts = Counter(row["supplier_name"] for row in rows)
    contracts_per_supplier = round(len(rows) / max(len(supplier_counts), 1), 4)
    failures = 0
    if contracts_per_supplier < 1.6:
        failures += 1
    if max(supplier_counts.values(), default=0) < 5:
        failures += 1
    if not 0.30 <= top_decile_share <= 0.75:
        failures += 1
    if max_contract_share > 0.06:
        failures += 1
    return {
        "contract_annualized_value_total_usd": value_total,
        "contract_top_decile_value_share": top_decile_share,
        "contract_max_single_value_share": max_contract_share,
        "contract_distinct_suppliers": len(supplier_counts),
        "contracts_per_supplier": contracts_per_supplier,
        "contract_top_supplier_contract_count": max(supplier_counts.values(), default=0),
        "contract_value_vs_application_cost_delta_usd": round(value_total - APPLICATION_COST_TOTAL_USD, 2),
        "contract_value_reconciliation_note": "Contract annualized value includes vendor-managed services and BPO scope outside application run cost; application annual cost remains the governed IT application baseline.",
        "contract_realism_gate_failures": failures,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    out_dir = args.out_dir.resolve()
    source_root = out_dir / "__synthetic_sources__"
    inventory: list[dict[str, Any]] = []
    dictionary_rows: list[dict[str, Any]] = []
    total_rows = 0
    application_rows: list[dict[str, Any]] = []
    contract_rows: list[dict[str, Any]] = []

    for family, (filename, target_count, grain) in TARGETS.items():
        rows = BUILDERS[family](target_count)
        if family == "SP03_CMDB":
            application_rows = rows
        if family == "SP08_Vendor_Contract":
            contract_rows = rows
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
        **application_realism_summary(application_rows),
        **contract_realism_summary(contract_rows),
    }
    (out_dir / "dense_source_room_summary.json").write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    (out_dir / "DENSE_SOURCE_ROOM_CATCHUP_REPORT.md").write_text(build_report(summary, inventory), encoding="utf-8")
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
