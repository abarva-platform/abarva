#!/usr/bin/env python3
"""Generate governed-loader-compatible enrichment-pack-v1 files for the
Meridian Health (`meridian-health`) synthetic tenant.

These files extend the existing 26 healthcare upload templates with richer,
buyer-grade synthetic context: deeper org/decision rights, Epic/ERP/data
estate, a KPI library, plan/provider analytics, an Azure Databricks target
model, AMS/vendor contracts, and a use-case evidence register.

Every file is:
  - PHI-free, synthetic, and explicitly inspired-by (not real) PHS/Meridian.
  - Compatible with the c5-csv-upload-connector governed Admin loader
    (1 structured row -> 1 chunk; <= 12 text columns so nothing truncates).
  - Carries lightweight source provenance columns where natural
    (source_system / source_owner / last_validated_date) so chunk provenance
    is preserved end to end.

Run from repo root:
    python3 datasets/meridian-health-synthetic-v1/tools/generate_enrichment_pack_v1.py

Output is deterministic (no randomness) so re-running yields identical files.
"""

from __future__ import annotations

import csv
import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
OUT_DIR = REPO_ROOT / "datasets/meridian-health-synthetic-v1/17-upload-templates"

VALIDATED = "2026-06-01"


def write_csv(filename: str, header: list[str], rows: list[list]) -> None:
    path = OUT_DIR / filename
    with path.open("w", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(header)
        for row in rows:
            writer.writerow(row)
    print(f"wrote {path.relative_to(REPO_ROOT)} ({len(rows)} rows)")


# 1. Org structure + decision rights -----------------------------------------
def org_decision_rights() -> None:
    header = [
        "role_id", "role_title", "reports_to", "decision_rights",
        "span_of_control_fte", "vacancy_status", "source_owner",
        "last_validated_date",
    ]
    data = [
        ("MR-ROLE-CEO", "Chief Executive Officer", "Board", "Enterprise strategy; capital allocation", 58000, "filled", "Board Secretary", VALIDATED),
        ("MR-ROLE-COO", "Chief Operating Officer", "MR-ROLE-CEO", "Hospital operations; throughput", 41000, "filled", "Office of the COO", VALIDATED),
        ("MR-ROLE-CFO", "Chief Financial Officer", "MR-ROLE-CEO", "Budget; business case approval >$5M", 900, "filled", "FP&A", VALIDATED),
        ("MR-ROLE-CIO", "Chief Information Officer", "MR-ROLE-CEO", "IT strategy; platform standards", 1240, "filled", "IT PMO", VALIDATED),
        ("MR-ROLE-CMIO", "Chief Medical Information Officer", "MR-ROLE-CIO", "Clinical informatics; Epic clinical content", 180, "filled", "Clinical Informatics", VALIDATED),
        ("MR-ROLE-CDAO", "Chief Data & Analytics Officer", "MR-ROLE-CIO", "Data platform; AI governance co-chair", 210, "filled", "Data Office", VALIDATED),
        ("MR-ROLE-CDO-DIG", "Chief Digital Officer", "MR-ROLE-CEO", "Digital front door; consumer experience", 120, "filled", "Digital Office", VALIDATED),
        ("MR-ROLE-CNO", "Chief Nursing Officer", "MR-ROLE-COO", "Nursing practice; staffing models", 22000, "filled", "Nursing Admin", VALIDATED),
        ("MR-ROLE-CMO", "Chief Medical Officer", "MR-ROLE-CEO", "Medical staff; clinical quality", 7400, "filled", "Medical Affairs", VALIDATED),
        ("MR-ROLE-CISO", "Chief Information Security Officer", "MR-ROLE-CIO", "Security posture; risk acceptance", 64, "filled", "Security GRC", VALIDATED),
        ("MR-ROLE-CPO", "Chief Privacy Officer", "MR-ROLE-CFO", "HIPAA; BAA approval", 22, "filled", "Privacy Office", VALIDATED),
        ("MR-ROLE-PLAN-COO", "Health Plan COO", "MR-ROLE-CEO", "Plan operations; network adequacy", 2100, "filled", "Plan Operations", VALIDATED),
        ("MR-ROLE-PLAN-ACT", "Chief Actuary (Plan)", "MR-ROLE-PLAN-COO", "Risk pool; medical loss ratio", 38, "filled", "Actuarial", VALIDATED),
        ("MR-ROLE-CPHO", "Chief Population Health Officer", "MR-ROLE-CMO", "VBC contracts; quality gaps", 340, "filled", "Population Health", VALIDATED),
        ("MR-ROLE-VP-EA", "VP Enterprise Applications", "MR-ROLE-CIO", "Application portfolio; ERP", 210, "filled", "Enterprise Apps", VALIDATED),
        ("MR-ROLE-VP-CLINAPP", "VP Clinical Applications", "MR-ROLE-CMIO", "Epic build; clinical app run", 160, "filled", "Clinical Apps", VALIDATED),
        ("MR-ROLE-VP-APPSVC", "VP Application Services", "MR-ROLE-CIO", "AMS; integration delivery", 0, "VACANT", "IT PMO", VALIDATED),
        ("MR-ROLE-VP-RCM", "VP Revenue Cycle", "MR-ROLE-CFO", "RCM; prior auth; denials", 1900, "filled", "Revenue Cycle", VALIDATED),
        ("MR-ROLE-VP-PROC", "VP Procurement", "MR-ROLE-CFO", "Vendor contracts; sourcing", 70, "filled", "Procurement", VALIDATED),
        ("MR-ROLE-VP-PA", "VP Patient Access", "MR-ROLE-COO", "Scheduling; contact center", 1200, "filled", "Patient Access", VALIDATED),
        ("MR-ROLE-VP-DH", "VP Digital Health", "MR-ROLE-CDO-DIG", "Telehealth; remote monitoring", 95, "filled", "Digital Health", VALIDATED),
        ("MR-ROLE-VP-POPHLTH", "VP Population Health Analytics", "MR-ROLE-CPHO", "Risk panels; outcome analytics", 88, "filled", "Population Health", VALIDATED),
        ("MR-ROLE-RAD-CHAIR", "Radiology Chair", "MR-ROLE-CMO", "Imaging AI safety review", 520, "filled", "Radiology", VALIDATED),
        ("MR-ROLE-AIGOV", "AI Governance Council Chair", "MR-ROLE-CDAO", "AI use-case gating; model risk", 18, "filled", "AI Governance", VALIDATED),
    ]
    write_csv("org-structure-decision-rights.csv", header, [list(r) for r in data])


# 2. Epic optimization backlog -------------------------------------------------
def epic_optimization_backlog() -> None:
    header = [
        "backlog_id", "epic_module", "optimization", "expected_benefit",
        "effort_tshirt", "owner_role", "service_line", "last_validated_date",
    ]
    data = [
        ("MR-EPIC-001", "Ambulatory", "SmartPhrase cleanup + note bloat reduction", "Note time -2.1 min/visit", "M", "VP Clinical Applications", "Primary Care", VALIDATED),
        ("MR-EPIC-002", "Inpatient", "Sepsis BPA tuning to cut alert fatigue", "Override rate -18 pts", "L", "CMIO", "Critical Care", VALIDATED),
        ("MR-EPIC-003", "Willow Pharmacy", "Closed-loop med admin gaps", "Verify-step misses -30%", "M", "VP Clinical Applications", "Pharmacy", VALIDATED),
        ("MR-EPIC-004", "Cadence", "Decision-tree scheduling for specialty", "Wait time -4.2 days", "M", "VP Patient Access", "Specialty Care", VALIDATED),
        ("MR-EPIC-005", "Resolute PB/HB", "Prior-auth automation hooks", "Denials -12%", "L", "VP Revenue Cycle", "Revenue Cycle", VALIDATED),
        ("MR-EPIC-006", "Beaker", "Lab result turnaround dashboards", "TAT -22 min", "S", "Lab Medical Director", "Laboratory", VALIDATED),
        ("MR-EPIC-007", "Radiant", "Imaging AI worklist embed", "Critical-result triage -19 min", "M", "Radiology Chair", "Radiology", VALIDATED),
        ("MR-EPIC-008", "MyChart", "Digital front-door scheduling expansion", "Self-service +14 pts", "M", "Chief Digital Officer", "Consumer", VALIDATED),
        ("MR-EPIC-009", "Healthy Planet", "Risk-panel registry refresh", "Gap closure +9 pts", "L", "VP Population Health Analytics", "Population Health", VALIDATED),
        ("MR-EPIC-010", "Tapestry", "Plan claims auto-adjudication rules", "Manual touch -25%", "L", "Health Plan COO", "Health Plan", VALIDATED),
        ("MR-EPIC-011", "Ambulatory", "Ambient documentation write-back", "Clinician satisfaction +0.4", "M", "CMIO", "Primary Care", VALIDATED),
        ("MR-EPIC-012", "Inpatient", "Nursing flowsheet acuity capture", "Acuity accuracy +11 pts", "M", "Chief Nursing Officer", "Med-Surg", VALIDATED),
        ("MR-EPIC-013", "Bridges", "HL7-to-FHIR migration for orders", "Interface defects -30%", "L", "Integration Architecture Lead", "Interoperability", VALIDATED),
        ("MR-EPIC-014", "Cogito", "Reporting workbench self-service", "Ad hoc tickets -40%", "M", "Chief Data & Analytics Officer", "Analytics", VALIDATED),
        ("MR-EPIC-015", "Care Everywhere", "External record reconciliation", "Duplicate records -15%", "S", "CMIO", "HIM", VALIDATED),
        ("MR-EPIC-016", "Hyperdrive", "Browser migration completion", "Page-load -1.3s", "S", "VP Clinical Applications", "Enterprise", VALIDATED),
        ("MR-EPIC-017", "Resolute", "Denial root-cause coding rules", "Avoidable write-off -8%", "M", "VP Revenue Cycle", "Revenue Cycle", VALIDATED),
        ("MR-EPIC-018", "Cadence", "No-show predictive overbooking", "No-show impact -3.1 pts", "M", "VP Patient Access", "Ambulatory", VALIDATED),
        ("MR-EPIC-019", "Willow", "340B inventory optimization", "Pharmacy margin +$2.4M", "M", "Chief Supply Chain Officer", "Pharmacy", VALIDATED),
        ("MR-EPIC-020", "Healthy Planet", "VBC measure capture automation", "STAR measure capture +6 pts", "L", "Chief Population Health Officer", "Population Health", VALIDATED),
        ("MR-EPIC-021", "Inpatient", "Discharge milestone orchestration", "ALOS -0.2 days", "L", "Chief Operating Officer", "Med-Surg", VALIDATED),
        ("MR-EPIC-022", "MyChart", "Proactive outreach for care gaps", "Outreach conversion +12 pts", "M", "VP Digital Health", "Consumer", VALIDATED),
    ]
    write_csv("epic-optimization-backlog.csv", header, [list(r) for r in data])


# 3. ERP / data estate ---------------------------------------------------------
def erp_data_estate() -> None:
    header = [
        "system_id", "domain", "platform", "data_classification",
        "integration_pattern", "owner_role", "source_system",
        "last_validated_date",
    ]
    data = [
        ("MR-ERP-001", "Finance / GL", "Workday Financials", "confidential_business", "API + nightly batch", "VP Enterprise Applications", "Workday", VALIDATED),
        ("MR-ERP-002", "Supply Chain", "Workday SCM", "confidential_business", "API", "Chief Supply Chain Officer", "Workday", VALIDATED),
        ("MR-ERP-003", "HCM / Payroll", "Workday HCM", "restricted_pii", "API", "Chief Human Resources Officer", "Workday", VALIDATED),
        ("MR-ERP-004", "Revenue / Billing", "Epic Resolute", "phi", "HL7 + FHIR", "VP Revenue Cycle", "Epic", VALIDATED),
        ("MR-ERP-005", "Clinical EHR", "Epic Hyperspace", "phi", "FHIR + Care Everywhere", "VP Clinical Applications", "Epic", VALIDATED),
        ("MR-ERP-006", "Health Plan Core", "Epic Tapestry", "phi", "X12 EDI + FHIR", "Health Plan COO", "Epic", VALIDATED),
        ("MR-ERP-007", "Enterprise Data Platform", "Azure Databricks Lakehouse", "phi", "Delta + Unity Catalog", "Chief Data Architect", "Databricks", VALIDATED),
        ("MR-ERP-008", "Legacy DW", "On-prem SQL Server EDW", "phi", "ETL nightly", "Chief Data & Analytics Officer", "SQL Server", VALIDATED),
        ("MR-ERP-009", "Master Data", "Reltio MDM", "confidential_business", "API streaming", "Chief Data & Analytics Officer", "Reltio", VALIDATED),
        ("MR-ERP-010", "Claims Analytics", "SAS Health", "phi", "Batch extract", "Chief Actuary (Plan)", "SAS", VALIDATED),
        ("MR-ERP-011", "Lab (LIS)", "Sunquest", "phi", "HL7 v2", "Lab Medical Director", "Sunquest", VALIDATED),
        ("MR-ERP-012", "Imaging (PACS)", "Sectra PACS", "phi", "DICOM + HL7", "Radiology Chair", "Sectra", VALIDATED),
        ("MR-ERP-013", "Patient Engagement", "Salesforce Health Cloud", "restricted_pii", "API", "Chief Digital Officer", "Salesforce", VALIDATED),
        ("MR-ERP-014", "Contact Center", "Genesys Cloud", "restricted_pii", "API + event stream", "VP Patient Access", "Genesys", VALIDATED),
        ("MR-ERP-015", "Identity", "Microsoft Entra ID", "restricted_pii", "SCIM + SAML", "Chief Information Security Officer", "Entra", VALIDATED),
        ("MR-ERP-016", "Population Health", "Epic Healthy Planet + Databricks", "phi", "FHIR + Delta", "VP Population Health Analytics", "Epic/Databricks", VALIDATED),
        ("MR-ERP-017", "Document Mgmt", "Hyland OnBase", "phi", "API + scan ingest", "VP Clinical Applications", "Hyland", VALIDATED),
        ("MR-ERP-018", "Procurement Analytics", "Power BI on Databricks", "confidential_business", "Delta Sharing", "VP Procurement", "Power BI", VALIDATED),
        ("MR-ERP-019", "AI Feature Store", "Databricks Feature Store", "phi", "Delta + MLflow", "Chief Data Architect", "Databricks", VALIDATED),
        ("MR-ERP-020", "Quality Registry", "Q-Centrix + Databricks", "phi", "Batch + Delta", "VP Quality", "Q-Centrix", VALIDATED),
    ]
    write_csv("erp-data-estate.csv", header, [list(r) for r in data])


# 4. KPI library ---------------------------------------------------------------
def kpi_library() -> None:
    header = [
        "kpi_id", "kpi_name", "domain", "definition", "target_value",
        "owner_role", "provider_plan_shared", "last_validated_date",
    ]
    rows = [
        ("MR-KPI-001", "ALOS", "Operations", "Average length of stay, observation-adjusted", "4.3 days", "Chief Operating Officer", "provider", VALIDATED),
        ("MR-KPI-002", "ED Boarding Hours", "Operations", "Hours admitted patients held in ED", "<3.0 hrs", "Chief Operating Officer", "provider", VALIDATED),
        ("MR-KPI-003", "30-Day Readmission", "Quality", "Risk-adjusted all-cause readmission", "<13.5%", "Chief Medical Officer", "shared", VALIDATED),
        ("MR-KPI-004", "HCAHPS Top Box", "Experience", "Top-box patient experience, bias-noted", ">72", "Chief Nursing Officer", "provider", VALIDATED),
        ("MR-KPI-005", "Gross Denial Rate", "Revenue Cycle", "Initial claim denial rate gross", "<7.0%", "VP Revenue Cycle", "provider", VALIDATED),
        ("MR-KPI-006", "Net Denial Rate", "Revenue Cycle", "Denials net of overturns", "<3.0%", "VP Revenue Cycle", "provider", VALIDATED),
        ("MR-KPI-007", "Prior Auth Cycle Time", "Revenue Cycle", "Submit-to-decision median", "<24 hrs", "VP Revenue Cycle", "shared", VALIDATED),
        ("MR-KPI-008", "Medical Loss Ratio", "Health Plan", "Plan medical loss ratio", "<86%", "Chief Actuary (Plan)", "plan", VALIDATED),
        ("MR-KPI-009", "STAR Rating", "Health Plan", "CMS STAR composite", ">=4.0", "Health Plan COO", "plan", VALIDATED),
        ("MR-KPI-010", "Network Adequacy", "Health Plan", "Time/distance standard met", ">95%", "Health Plan COO", "plan", VALIDATED),
        ("MR-KPI-011", "Care Gap Closure", "Population Health", "HEDIS gaps closed in-year", ">68%", "Chief Population Health Officer", "shared", VALIDATED),
        ("MR-KPI-012", "Risk Adjustment Accuracy", "Population Health", "RAF capture vs suspected", ">92%", "Chief Population Health Officer", "shared", VALIDATED),
        ("MR-KPI-013", "Note Documentation Time", "Clinical Ops", "Clinician note minutes/visit", "<6.0 min", "CMIO", "provider", VALIDATED),
        ("MR-KPI-014", "Clinician Burnout Index", "Workforce", "Validated burnout survey index", "<35", "Chief Medical Officer", "provider", VALIDATED),
        ("MR-KPI-015", "RN Turnover", "Workforce", "Annualized RN turnover", "<14%", "Chief Nursing Officer", "provider", VALIDATED),
        ("MR-KPI-016", "Premium Labor %", "Workforce", "Premium/agency labor of total", "<8%", "Chief Nursing Officer", "provider", VALIDATED),
        ("MR-KPI-017", "Operating Margin", "Finance", "System operating margin", ">2.5%", "Chief Financial Officer", "shared", VALIDATED),
        ("MR-KPI-018", "Days Cash on Hand", "Finance", "Liquidity coverage", ">180 days", "Chief Financial Officer", "shared", VALIDATED),
        ("MR-KPI-019", "IT Run Cost % Revenue", "IT", "IT run cost as % net revenue", "<3.4%", "Chief Information Officer", "shared", VALIDATED),
        ("MR-KPI-020", "Application Rationalization", "IT", "Apps retired vs portfolio", ">12/yr", "VP Enterprise Applications", "provider", VALIDATED),
        ("MR-KPI-021", "Critical Incident MTTR", "IT", "Mean time to restore Sev1", "<2.0 hrs", "VP IT Operations", "provider", VALIDATED),
        ("MR-KPI-022", "Change Failure Rate", "IT", "Failed changes / total", "<8%", "VP Engineering", "provider", VALIDATED),
        ("MR-KPI-023", "Digital Self-Service", "Consumer", "Visits booked self-service", ">45%", "Chief Digital Officer", "provider", VALIDATED),
        ("MR-KPI-024", "Contact Center Abandon", "Consumer", "Call abandonment rate", "<5%", "VP Patient Access", "provider", VALIDATED),
        ("MR-KPI-025", "Telehealth Utilization", "Consumer", "Telehealth share of ambulatory", ">12%", "VP Digital Health", "provider", VALIDATED),
        ("MR-KPI-026", "Imaging Critical-Result TAT", "Clinical Ops", "Critical result notify time", "<15 min", "Radiology Chair", "provider", VALIDATED),
        ("MR-KPI-027", "Sepsis Bundle Compliance", "Quality", "3-hour bundle compliance", ">90%", "Chief Medical Officer", "provider", VALIDATED),
        ("MR-KPI-028", "Medication Safety Events", "Quality", "Harmful med events / 1k doses", "<0.5", "Chief Pharmacy Officer", "provider", VALIDATED),
        ("MR-KPI-029", "AI Model Validation Coverage", "AI Governance", "Models with current validation", "100%", "AI Governance Council Chair", "shared", VALIDATED),
        ("MR-KPI-030", "Shadow AI Tools", "AI Governance", "Unsanctioned AI tools in use", "0", "Chief Data & Analytics Officer", "shared", VALIDATED),
        ("MR-KPI-031", "Data Quality Score", "Data", "Curated data product quality", ">0.9", "Chief Data Officer", "shared", VALIDATED),
        ("MR-KPI-032", "PHI Access Anomalies", "Security", "Anomalous PHI access events", "<5/mo", "Chief Information Security Officer", "shared", VALIDATED),
        ("MR-KPI-033", "Downtime Drill Coverage", "Resilience", "Tier-0 systems drilled/yr", "100%", "Chief Information Security Officer", "provider", VALIDATED),
        ("MR-KPI-034", "Supply Cost / CMI Day", "Supply Chain", "Supply cost per CMI-adj day", "<$640", "Chief Supply Chain Officer", "provider", VALIDATED),
        ("MR-KPI-035", "340B Margin Capture", "Pharmacy", "Eligible 340B margin captured", ">94%", "Chief Pharmacy Officer", "provider", VALIDATED),
        ("MR-KPI-036", "VBC Revenue at Risk", "Health Plan", "Revenue under risk contracts", ">$420M", "Chief Population Health Officer", "shared", VALIDATED),
        ("MR-KPI-037", "Quality Bonus Realization", "Health Plan", "STAR bonus realized", ">$58M", "Health Plan COO", "plan", VALIDATED),
        ("MR-KPI-038", "Specialist Access Days", "Access", "3rd-next-available specialty", "<10 days", "VP Patient Access", "provider", VALIDATED),
        ("MR-KPI-039", "Coding Accuracy", "Revenue Cycle", "Inpatient coding accuracy", ">96%", "VP Revenue Cycle", "provider", VALIDATED),
        ("MR-KPI-040", "Forecast Accuracy (Census)", "Operations", "Census forecast accuracy", ">90%", "Chief Operating Officer", "provider", VALIDATED),
    ]
    write_csv("kpi-library.csv", header, [list(r) for r in rows])


# 5. Databricks lakehouse target model ----------------------------------------
def databricks_target_model() -> None:
    header = [
        "layer", "component", "current_state", "target_state",
        "unity_catalog_domain", "migration_wave", "owner_role",
        "last_validated_date",
    ]
    data = [
        ("Ingestion", "Epic Clarity extract", "Nightly SQL ETL", "Delta Live Tables CDC", "clinical_raw", "Wave 1", "Chief Data Architect", VALIDATED),
        ("Ingestion", "Tapestry claims (X12)", "Batch flat files", "Autoloader + DLT", "plan_raw", "Wave 1", "Chief Data Architect", VALIDATED),
        ("Ingestion", "HL7/FHIR events", "Interface engine logs", "Structured streaming", "interop_raw", "Wave 2", "Integration Architecture Lead", VALIDATED),
        ("Ingestion", "Workday finance", "API nightly", "Partner connect + DLT", "finance_raw", "Wave 2", "VP Enterprise Applications", VALIDATED),
        ("Bronze", "Raw clinical", "On-prem landing", "UC managed Delta", "clinical_bronze", "Wave 1", "Chief Data Architect", VALIDATED),
        ("Bronze", "Raw claims", "SAS work tables", "UC managed Delta", "plan_bronze", "Wave 1", "Chief Data Architect", VALIDATED),
        ("Silver", "Patient master", "Reltio + EDW joins", "Conformed Delta + MDM keys", "patient_conformed", "Wave 2", "Chief Data & Analytics Officer", VALIDATED),
        ("Silver", "Encounter fact", "EDW star schema", "Conformed Delta", "encounter_conformed", "Wave 2", "Chief Data & Analytics Officer", VALIDATED),
        ("Silver", "Claims fact", "SAS marts", "Conformed Delta", "claims_conformed", "Wave 2", "Chief Actuary (Plan)", VALIDATED),
        ("Gold", "Population health panels", "Healthy Planet exports", "Gold Delta + dashboards", "population_health_gold", "Wave 3", "VP Population Health Analytics", VALIDATED),
        ("Gold", "Service-line P&L", "Excel + Cognos", "Gold Delta + Power BI", "finance_gold", "Wave 3", "CFO FP&A", VALIDATED),
        ("Gold", "Denials analytics", "Resolute reports", "Gold Delta", "revenue_cycle_gold", "Wave 3", "VP Revenue Cycle", VALIDATED),
        ("Governance", "Unity Catalog", "None (Hive metastore)", "UC enterprise metastore", "platform", "Wave 1", "Chief Data Architect", VALIDATED),
        ("Governance", "PHI access policy", "DB-level grants", "UC row/column masks + ABAC", "platform", "Wave 1", "Chief Privacy Officer", VALIDATED),
        ("Governance", "Lineage", "Manual docs", "UC system tables lineage", "platform", "Wave 2", "Chief Data Officer", VALIDATED),
        ("ML", "Feature store", "Ad hoc tables", "Databricks Feature Store", "ml_features", "Wave 3", "Chief Data Architect", VALIDATED),
        ("ML", "Model registry", "Scattered notebooks", "MLflow + UC models", "ml_models", "Wave 3", "AI Governance Council Chair", VALIDATED),
        ("ML", "Model monitoring", "None", "Lakehouse Monitoring", "ml_models", "Wave 4", "AI Governance Council Chair", VALIDATED),
        ("Consumption", "Self-service BI", "Cognos + Excel", "Power BI Delta Sharing", "consumption", "Wave 3", "Chief Data & Analytics Officer", VALIDATED),
        ("Consumption", "Genie / NL query", "None", "Genie spaces (governed)", "consumption", "Wave 4", "Chief Data & Analytics Officer", VALIDATED),
        ("Consumption", "Reverse ETL to Epic", "Manual", "Delta -> FHIR write-back", "interop_gold", "Wave 4", "Integration Architecture Lead", VALIDATED),
        ("Resilience", "DR / region", "Single region", "Paired-region replication", "platform", "Wave 4", "Chief Information Security Officer", VALIDATED),
        ("FinOps", "Cluster policy", "Open clusters", "Policy + serverless budgets", "platform", "Wave 2", "Chief Information Officer", VALIDATED),
        ("FinOps", "Cost attribution", "None", "UC tags + chargeback", "platform", "Wave 3", "Chief Financial Officer", VALIDATED),
    ]
    write_csv("databricks-lakehouse-target-model.csv", header, [list(r) for r in data])


# 6. Plan / provider analytics -------------------------------------------------
def plan_provider_analytics() -> None:
    header = [
        "measure", "line_of_business", "current_value", "benchmark",
        "gap", "ai_lever", "owner_role", "last_validated_date",
    ]
    data = [
        ("Diabetes A1c control", "Medicare Advantage", "68%", "75%", "-7 pts", "Risk-panel outreach prioritization", "Chief Population Health Officer", VALIDATED),
        ("Breast cancer screening", "Medicare Advantage", "71%", "78%", "-7 pts", "Care-gap nudge + scheduling", "VP Population Health Analytics", VALIDATED),
        ("Colorectal screening", "Commercial", "62%", "70%", "-8 pts", "Predictive outreach", "VP Population Health Analytics", VALIDATED),
        ("Medication adherence (statins)", "Medicare Advantage", "82%", "88%", "-6 pts", "Pharmacy adherence model", "Chief Pharmacy Officer", VALIDATED),
        ("Plan all-cause readmission", "Medicaid", "15.2%", "12.5%", "+2.7 pts", "Post-discharge risk model", "Chief Population Health Officer", VALIDATED),
        ("ED utilization / 1k", "Medicaid", "640", "520", "+120", "ED diversion analytics", "Health Plan COO", VALIDATED),
        ("Annual wellness visit rate", "Medicare Advantage", "58%", "70%", "-12 pts", "AWV gap targeting", "Chief Population Health Officer", VALIDATED),
        ("RAF capture vs suspected", "Medicare Advantage", "88%", "94%", "-6 pts", "Suspecting model + NLP", "Chief Actuary (Plan)", VALIDATED),
        ("Network leakage", "Commercial", "19%", "12%", "+7 pts", "Steerage analytics", "Health Plan COO", VALIDATED),
        ("Prior auth turnaround", "All LOB", "31 hrs", "24 hrs", "+7 hrs", "Auto-approval rules", "VP Revenue Cycle", VALIDATED),
        ("Specialty referral completion", "Commercial", "74%", "85%", "-11 pts", "Referral loop-closure", "VP Patient Access", VALIDATED),
        ("Maternity bundle variance", "Medicaid", "+9%", "0%", "+9%", "Bundle pathway analytics", "Chief Medical Officer", VALIDATED),
        ("Behavioral health access", "All LOB", "12 days", "7 days", "+5 days", "Capacity + tele-BH routing", "VP Digital Health", VALIDATED),
        ("Avoidable admissions", "Medicare Advantage", "7.1%", "5.0%", "+2.1 pts", "Rising-risk model", "Chief Population Health Officer", VALIDATED),
        ("Post-acute LOS", "Medicare Advantage", "21 days", "16 days", "+5 days", "PAC network analytics", "Health Plan COO", VALIDATED),
        ("Quality bonus measures met", "Medicare Advantage", "31/40", "37/40", "-6", "Measure-capture automation", "Health Plan COO", VALIDATED),
        ("Provider documentation gap", "All LOB", "14%", "6%", "+8 pts", "Ambient + CDI assist", "CMIO", VALIDATED),
        ("Hospitalist throughput", "Provider", "1.9 disch/day", "2.3 disch/day", "-0.4", "Discharge orchestration", "Chief Operating Officer", VALIDATED),
        ("Imaging appropriate use", "Provider", "81%", "90%", "-9 pts", "CDS + AppropriateUse model", "Radiology Chair", VALIDATED),
        ("Sepsis mortality index", "Provider", "0.94", "0.80", "+0.14", "Early-warning model tuning", "Chief Medical Officer", VALIDATED),
        ("Care management engagement", "Medicaid", "44%", "60%", "-16 pts", "Outreach propensity model", "VP Care Management", VALIDATED),
        ("SDOH screening rate", "Medicaid", "38%", "65%", "-27 pts", "SDOH screening prompts", "Chief Population Health Officer", VALIDATED),
        ("Telehealth follow-up adherence", "All LOB", "61%", "75%", "-14 pts", "Tele follow-up nudges", "VP Digital Health", VALIDATED),
        ("Pharmacy generic dispensing", "All LOB", "88%", "92%", "-4 pts", "Formulary steerage", "Chief Pharmacy Officer", VALIDATED),
        ("Denied days (concurrent)", "Provider", "3.8%", "2.0%", "+1.8 pts", "Utilization review model", "VP Revenue Cycle", VALIDATED),
        ("HEDIS composite", "Medicare Advantage", "3.5", "4.0", "-0.5", "Composite gap orchestration", "Chief Population Health Officer", VALIDATED),
        ("Member NPS", "All LOB", "31", "45", "-14", "Experience analytics", "Chief Digital Officer", VALIDATED),
        ("Provider NPS", "Provider", "22", "40", "-18", "Burden-reduction program", "Chief Medical Officer", VALIDATED),
    ]
    write_csv("plan-provider-analytics.csv", header, [list(r) for r in data])


# 7. AMS / vendor contracts ----------------------------------------------------
def ams_vendor_contracts() -> None:
    header = [
        "vendor", "contract_id", "service_scope", "annual_value_usd",
        "ams_tier", "renewal_date", "ai_clause_status", "owner_role",
    ]
    data = [
        ("Epic", "MR-CTR-EPIC", "EHR license + hosting", 42000000, "strategic", "2027-09-30", "negotiating", "VP Procurement"),
        ("Accenture", "MR-CTR-ACN-AMS", "Epic AMS + integration", 28000000, "strategic", "2026-12-31", "absent", "VP Application Services"),
        ("Deloitte", "MR-CTR-DELOITTE", "Revenue cycle transformation", 14500000, "strategic", "2026-08-31", "present", "VP Revenue Cycle"),
        ("Microsoft", "MR-CTR-MSFT", "Azure + Databricks + M365", 19800000, "strategic", "2027-03-31", "present", "Chief Information Officer"),
        ("Databricks", "MR-CTR-DBX", "Lakehouse platform", 5200000, "strategic", "2027-03-31", "present", "Chief Data Architect"),
        ("Nuance", "MR-CTR-NUANCE", "Ambient documentation (DAX)", 6400000, "preferred", "2026-11-30", "present", "CMIO"),
        ("Abridge", "MR-CTR-ABRIDGE", "Ambient documentation pilot", 1800000, "pilot", "2026-07-31", "present", "CMIO"),
        ("Sectra", "MR-CTR-SECTRA", "Imaging PACS + AI", 4900000, "preferred", "2027-01-31", "negotiating", "Radiology Chair"),
        ("Genesys", "MR-CTR-GENESYS", "Contact center platform", 3600000, "preferred", "2026-10-31", "absent", "VP Patient Access"),
        ("Salesforce", "MR-CTR-SFDC", "Health Cloud CRM", 4100000, "preferred", "2027-02-28", "present", "Chief Digital Officer"),
        ("Workday", "MR-CTR-WDAY", "ERP/HCM/SCM", 11200000, "strategic", "2027-06-30", "absent", "VP Enterprise Applications"),
        ("Reltio", "MR-CTR-RELTIO", "MDM platform", 2300000, "preferred", "2026-12-31", "negotiating", "Chief Data & Analytics Officer"),
        ("SAS", "MR-CTR-SAS", "Plan analytics", 3800000, "legacy", "2026-09-30", "absent", "Chief Actuary (Plan)"),
        ("Sunquest", "MR-CTR-SUNQUEST", "Lab LIS", 4200000, "legacy", "2026-08-31", "absent", "Lab Medical Director"),
        ("Hyland", "MR-CTR-HYLAND", "Document management", 2700000, "preferred", "2027-04-30", "absent", "VP Clinical Applications"),
        ("Cohere Health", "MR-CTR-COHERE", "Prior-auth automation", 3100000, "pilot", "2026-07-31", "present", "VP Revenue Cycle"),
        ("Q-Centrix", "MR-CTR-QCENTRIX", "Quality registry abstraction", 2900000, "preferred", "2026-12-31", "negotiating", "VP Quality"),
        ("Olive (legacy)", "MR-CTR-OLIVE", "RPA (sunsetting)", 900000, "legacy", "2026-06-30", "absent", "VP Application Services"),
        ("Press Ganey", "MR-CTR-PG", "Experience surveys", 1600000, "preferred", "2027-01-31", "absent", "Chief Nursing Officer"),
        ("Vizient", "MR-CTR-VIZIENT", "Supply chain GPO + analytics", 3400000, "preferred", "2026-12-31", "absent", "Chief Supply Chain Officer"),
        ("Tableau (legacy)", "MR-CTR-TABLEAU", "BI (migrating to Power BI)", 700000, "legacy", "2026-09-30", "absent", "Chief Data & Analytics Officer"),
        ("Innovaccer", "MR-CTR-INNOVACCER", "Population health platform", 4600000, "preferred", "2027-02-28", "negotiating", "Chief Population Health Officer"),
    ]
    write_csv("ams-vendor-contracts.csv", header, [list(r) for r in data])


# 8. Use-case evidence register ------------------------------------------------
def use_case_evidence_register() -> None:
    header = [
        "use_case_id", "use_case", "evidence_type", "evidence_ref",
        "confidence", "public_or_synthetic", "owner_role",
        "last_validated_date",
    ]
    data = [
        ("MR-UC-001", "Ambient clinical documentation", "pilot_metric", "ambient-documentation-pilot.csv", "high", "synthetic", "CMIO", VALIDATED),
        ("MR-UC-002", "Prior-auth automation", "workqueue_metric", "prior-auth-workqueue.csv", "high", "synthetic", "VP Revenue Cycle", VALIDATED),
        ("MR-UC-003", "Denials prevention", "denials_metric", "rcm-denials.csv", "high", "synthetic", "Revenue Integrity Director", VALIDATED),
        ("MR-UC-004", "Sepsis early warning", "model_inventory", "clinical-ai-model-inventory.csv", "medium", "synthetic", "Chief Medical Officer", VALIDATED),
        ("MR-UC-005", "Imaging AI triage", "worklist_metric", "imaging-ai-worklist.csv", "medium", "synthetic", "Radiology Chair", VALIDATED),
        ("MR-UC-006", "Population health gap closure", "panel_metric", "population-health-risk-panels.csv", "high", "synthetic", "VP Population Health Analytics", VALIDATED),
        ("MR-UC-007", "VBC measure capture", "vbc_panel", "value-based-care-panel.csv", "medium", "synthetic", "Chief Population Health Officer", VALIDATED),
        ("MR-UC-008", "Nurse staffing optimization", "acuity_metric", "nursing-workload-acuity.csv", "medium", "synthetic", "Chief Nursing Officer", VALIDATED),
        ("MR-UC-009", "Digital front door deflection", "journey_metric", "patient-digital-front-door.csv", "medium", "synthetic", "Chief Digital Officer", VALIDATED),
        ("MR-UC-010", "Contact center deflection", "queue_metric", "patient-access-contact-center.csv", "medium", "synthetic", "VP Patient Access", VALIDATED),
        ("MR-UC-011", "Supply / pharmacy savings", "spend_metric", "supply-chain-pharmacy.csv", "medium", "synthetic", "Chief Supply Chain Officer", VALIDATED),
        ("MR-UC-012", "AI governance gating", "decision_log", "governance-committee-decisions.csv", "high", "synthetic", "AI Governance Council Chair", VALIDATED),
        ("MR-UC-013", "HIPAA AI controls", "control_register", "hipaa-ai-controls.csv", "high", "synthetic", "Chief Privacy Officer", VALIDATED),
        ("MR-UC-014", "Databricks modernization", "target_model", "databricks-lakehouse-target-model.csv", "medium", "synthetic", "Chief Data Architect", VALIDATED),
        ("MR-UC-015", "Plan analytics gap closure", "plan_metric", "plan-provider-analytics.csv", "medium", "synthetic", "Health Plan COO", VALIDATED),
        ("MR-UC-016", "Vendor / AMS consolidation", "contract_register", "ams-vendor-contracts.csv", "high", "synthetic", "VP Procurement", VALIDATED),
        ("MR-UC-017", "Epic optimization backlog", "backlog_register", "epic-optimization-backlog.csv", "high", "synthetic", "VP Clinical Applications", VALIDATED),
        ("MR-UC-018", "KPI baseline library", "kpi_library", "kpi-library.csv", "high", "synthetic", "VP Enterprise Performance", VALIDATED),
        ("MR-UC-019", "Care management engagement", "staffing_metric", "care-management-staffing.csv", "medium", "synthetic", "VP Care Management", VALIDATED),
        ("MR-UC-020", "Interoperability data contracts", "data_contract", "clinical-data-contracts.csv", "medium", "synthetic", "Chief Data Officer", VALIDATED),
        ("MR-UC-021", "Downtime resilience", "readiness_metric", "security-downtime-readiness.csv", "medium", "synthetic", "CISO", VALIDATED),
        ("MR-UC-022", "Interoperability compliance", "compliance_metric", "cms-interoperability.csv", "high", "synthetic", "Interoperability Program Director", VALIDATED),
        ("MR-UC-023", "Service-line margin", "pnl_metric", "service-line-pnl.csv", "high", "synthetic", "CFO FP&A", VALIDATED),
        ("MR-UC-024", "Delivery DORA baseline", "dora_metric", "dora-baseline.csv", "medium", "synthetic", "VP Engineering", VALIDATED),
        ("MR-UC-025", "Shadow AI footprint", "tool_register", "ai-tool-footprint.csv", "medium", "synthetic", "AI Governance Lead", VALIDATED),
        ("MR-UC-026", "Application rationalization", "portfolio", "application-portfolio.csv", "high", "synthetic", "VP Enterprise Applications", VALIDATED),
        ("MR-UC-027", "Interop topology", "topology", "hl7-fhir-integration-topology.json", "medium", "synthetic", "Integration Architecture Lead", VALIDATED),
        ("MR-UC-028", "Org decision rights", "org_register", "org-structure-decision-rights.csv", "high", "synthetic", "Chief Administrative Officer", VALIDATED),
        ("MR-UC-029", "ERP / data estate", "estate_register", "erp-data-estate.csv", "high", "synthetic", "VP Enterprise Applications", VALIDATED),
        ("MR-UC-030", "Enterprise profile", "profile", "enterprise-profile.yaml", "high", "synthetic", "Chief Strategy Officer", VALIDATED),
    ]
    write_csv("use-case-evidence-register.csv", header, [list(r) for r in data])


# 9. Care management staffing --------------------------------------------------
def care_management_staffing() -> None:
    header = [
        "team", "role", "fte", "vacancy_rate_pct", "ai_augmentation",
        "owner_role", "line_of_business", "last_validated_date",
    ]
    data = [
        ("Complex Care", "RN Care Manager", 84, 11, "rising-risk model", "VP Care Management", "Medicare Advantage", VALIDATED),
        ("Complex Care", "Social Worker", 36, 18, "SDOH screening assist", "VP Care Management", "Medicaid", VALIDATED),
        ("Transitions of Care", "RN Care Manager", 52, 9, "post-discharge model", "VP Care Management", "All LOB", VALIDATED),
        ("Transitions of Care", "Care Coordinator", 40, 14, "outreach propensity", "VP Care Management", "All LOB", VALIDATED),
        ("Behavioral Health", "BH Care Manager", 28, 21, "tele-BH routing", "VP Digital Health", "All LOB", VALIDATED),
        ("Chronic Disease", "RN Educator", 33, 12, "adherence model", "VP Care Management", "Commercial", VALIDATED),
        ("Utilization Mgmt", "UM Nurse", 61, 7, "auto-approval rules", "VP Revenue Cycle", "All LOB", VALIDATED),
        ("Utilization Mgmt", "UM Pharmacist", 12, 8, "drug-policy model", "Chief Pharmacy Officer", "All LOB", VALIDATED),
        ("Population Health", "Quality Abstractor", 24, 16, "measure-capture NLP", "VP Population Health Analytics", "Medicare Advantage", VALIDATED),
        ("Population Health", "Data Analyst", 18, 6, "panel analytics", "VP Population Health Analytics", "All LOB", VALIDATED),
        ("Ambulatory Care Mgmt", "RN Care Manager", 47, 13, "gap-closure targeting", "VP Care Management", "Commercial", VALIDATED),
        ("Maternal Health", "OB Care Manager", 19, 10, "maternity risk model", "Chief Medical Officer", "Medicaid", VALIDATED),
        ("Pharmacy Care", "Clinical Pharmacist", 22, 9, "adherence outreach", "Chief Pharmacy Officer", "All LOB", VALIDATED),
        ("Member Engagement", "Outreach Specialist", 38, 19, "engagement propensity", "Chief Digital Officer", "All LOB", VALIDATED),
        ("Care Mgmt Ops", "Team Lead", 14, 5, "workload balancing", "VP Care Management", "All LOB", VALIDATED),
        ("Tele-Triage", "Triage Nurse", 30, 15, "symptom triage assist", "VP Digital Health", "All LOB", VALIDATED),
        ("SNF Liaison", "PAC Coordinator", 16, 12, "PAC network analytics", "Health Plan COO", "Medicare Advantage", VALIDATED),
        ("Care Mgmt Analytics", "Reporting Analyst", 9, 0, "engagement dashboards", "VP Population Health Analytics", "All LOB", VALIDATED),
    ]
    write_csv("care-management-staffing.csv", header, [list(r) for r in data])


# 10. Clinical / interoperability data contracts ------------------------------
def clinical_data_contracts() -> None:
    header = [
        "data_product", "consumer", "contract_terms", "phi_class",
        "refresh_sla", "owner_role", "source_system", "last_validated_date",
    ]
    data = [
        ("Patient master conformed", "Population Health", "FHIR Patient; daily", "phi", "24h", "Chief Data Officer", "Databricks", VALIDATED),
        ("Encounter fact gold", "Service-line P&L", "Delta share; daily", "phi", "24h", "Chief Data & Analytics Officer", "Databricks", VALIDATED),
        ("Claims fact conformed", "Plan analytics", "Delta; weekly", "phi", "7d", "Chief Actuary (Plan)", "Databricks", VALIDATED),
        ("Risk panel registry", "Care Management", "FHIR Group; daily", "phi", "24h", "VP Population Health Analytics", "Epic/Databricks", VALIDATED),
        ("Denials analytics", "Revenue Cycle", "Delta; daily", "phi", "24h", "VP Revenue Cycle", "Databricks", VALIDATED),
        ("Imaging worklist", "Radiology AI", "DICOM + HL7; realtime", "phi", "realtime", "Radiology Chair", "Sectra", VALIDATED),
        ("Sepsis features", "Early-warning model", "Feature store; hourly", "phi", "1h", "Chief Data Architect", "Databricks", VALIDATED),
        ("Care-gap measures", "Quality registry", "Delta; daily", "phi", "24h", "VP Quality", "Q-Centrix", VALIDATED),
        ("Member 360", "Digital front door", "FHIR + CRM; daily", "restricted_pii", "24h", "Chief Digital Officer", "Salesforce", VALIDATED),
        ("Supply spend mart", "Procurement analytics", "Delta share; weekly", "confidential_business", "7d", "VP Procurement", "Power BI", VALIDATED),
        ("Workforce acuity", "Staffing model", "Delta; daily", "restricted_pii", "24h", "Chief Nursing Officer", "Databricks", VALIDATED),
        ("Pharmacy adherence", "Pharmacy care", "Delta; daily", "phi", "24h", "Chief Pharmacy Officer", "Databricks", VALIDATED),
        ("PHI access audit", "Security GRC", "System tables; hourly", "restricted_pii", "1h", "Chief Information Security Officer", "Databricks", VALIDATED),
        ("Lineage metadata", "Data governance", "UC system tables; daily", "confidential_business", "24h", "Chief Data Officer", "Databricks", VALIDATED),
        ("STAR measure mart", "Health Plan", "Delta; weekly", "phi", "7d", "Health Plan COO", "Databricks", VALIDATED),
        ("SDOH screening", "Care Management", "FHIR Observation; daily", "phi", "24h", "Chief Population Health Officer", "Epic/Databricks", VALIDATED),
        ("Referral loop", "Patient Access", "FHIR ServiceRequest; daily", "phi", "24h", "VP Patient Access", "Epic", VALIDATED),
        ("Telehealth utilization", "Digital Health", "Delta; daily", "phi", "24h", "VP Digital Health", "Databricks", VALIDATED),
    ]
    write_csv("clinical-data-contracts.csv", header, [list(r) for r in data])


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    org_decision_rights()
    epic_optimization_backlog()
    erp_data_estate()
    kpi_library()
    databricks_target_model()
    plan_provider_analytics()
    ams_vendor_contracts()
    use_case_evidence_register()
    care_management_staffing()
    clinical_data_contracts()
    print("enrichment-pack-v1 complete")


if __name__ == "__main__":
    main()
