#!/usr/bin/env python3

"""Write product-first client extraction mapping for the next ECL source-room families."""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_OUT_DIR = Path("outputs/ecl-next-slice-planning-2026-08-23")


ROWS = [
    {
        "family_id": "cmdb_application_portfolio",
        "workbook_folder": "01_Applications_and_Technology",
        "business_facing_workbook": "Applications and Technology.xlsx",
        "extract_or_tab": "CMDB application services",
        "source_owner": "CMDB/application portfolio owner",
        "likely_source_systems": "ServiceNow CMDB, LeanIX, Apptio, application portfolio spreadsheet",
        "one_row_represents": "One business application or application service, not one environment instance",
        "right_grain": "Base application with separate deployment/environment records when available",
        "minimum_fields": "application_id, application_name, business_owner, technical_owner, vendor, lifecycle, tier, hosting_model, business_function",
        "primary_join_keys": "application_id, application_name, cmdb_ci_id",
        "product_need": "Home architecture, Source contract scope, Tower exposure, Intelligence context",
        "product_consumers": "Home; Source 360; Tower; Intelligence; cubes",
        "target_ecl_domains": "ecl_context.object; ecl_context.relationship; ecl_context.measure",
        "acceptable_partial_behavior": "Unknown owner, tier, or hosting remains Unknown; missing application IDs block joins rather than inferred joins.",
        "quality_gate": "Environment suffixes cannot inflate base application count; vendor names must resolve through supplier/tool reference where possible.",
        "do_not_collect": "Do not collect Epic internal schema/table details or credentials.",
        "example_prefilled_row": "APP-1042 | Epic Tapestry | Health Plan Operations | Epic Systems Corporation | tier_1 | aws_hosted | Revenue Cycle",
    },
    {
        "family_id": "application_deployment_and_hosting",
        "workbook_folder": "01_Applications_and_Technology",
        "business_facing_workbook": "Applications and Technology.xlsx",
        "extract_or_tab": "Application deployments and environments",
        "source_owner": "Infrastructure operations with CMDB owner",
        "likely_source_systems": "CMDB relationship export, cloud inventory, virtualization inventory",
        "one_row_represents": "One deployment/environment for a declared base application",
        "right_grain": "Application deployment, environment, region, hosting platform",
        "minimum_fields": "application_id, deployment_id, environment, hosting_platform_id, hosting_model, region, dr_tier, runtime_status",
        "primary_join_keys": "application_id, deployment_id, hosting_platform_id",
        "product_need": "Prevents Production/Test/Training from becoming three separate applications while preserving operational reality.",
        "product_consumers": "Home; Source 360; Tower; Intelligence",
        "target_ecl_domains": "ecl_context.object; ecl_context.relationship",
        "acceptable_partial_behavior": "If deployment export is unavailable, show application as declared with deployment coverage gap.",
        "quality_gate": "Every deployment must reference an existing base application; environment must be a field, not name parsing.",
        "do_not_collect": "Do not collect server credentials, IP secrets, or network diagrams with restricted data.",
        "example_prefilled_row": "APP-1042-PRD | APP-1042 | Production | AWS us-east-1 Epic VPC | warm_dr | active",
    },
    {
        "family_id": "vendor_contract_commercial",
        "workbook_folder": "02_Vendors_and_Contracts",
        "business_facing_workbook": "Vendors and Contracts.xlsx",
        "extract_or_tab": "Contract register and document inventory",
        "source_owner": "Vendor management, procurement, legal operations",
        "likely_source_systems": "CLM, Coupa Contracts, Ariba Contracts, SharePoint contract library",
        "one_row_represents": "One contract plus linked documents, scope, pricing, SLA, and AP extracts",
        "right_grain": "Contract header, service tower, application scope, rate card line, invoice line, SLA observation",
        "minimum_fields": "contract_id, supplier_id, effective_date, expiration_date, annualized_value, notice_window, document_id, service_tower_id",
        "primary_join_keys": "contract_id, supplier_id, document_id, service_tower_id, application_id",
        "product_need": "Source 360 optimization, Tower claim gates, Home vendor lineage, commercial cubes",
        "product_consumers": "Source 360; Tower; Home; Intelligence; cubes",
        "target_ecl_domains": "ecl_source.document; ecl_context.object; ecl_commercial.*; ecl_projection.*",
        "acceptable_partial_behavior": "Missing SLA or benchmark data renders as a gap; it must not become zero savings or zero exposure.",
        "quality_gate": "Money must reconcile across register, rate card, and AP; synthetic benchmarks use model_inferred basis.",
        "do_not_collect": "Do not collect privileged legal advice, bank details, tax IDs, or personal payment data.",
        "example_prefilled_row": "MER-CTR-SSO-BPO-001 | PeopleBridge HR Operations LLC | $10.7M | 365-day notice | auto-renewal active",
    },
    {
        "family_id": "budget_spend_finance",
        "workbook_folder": "03_Budget_and_Spend",
        "business_facing_workbook": "Budget and Spend.xlsx",
        "extract_or_tab": "IT budget, actuals, forecasts, and allocation rules",
        "source_owner": "IT finance, FP&A, controllership",
        "likely_source_systems": "ERP GL, Workday Finance, Oracle, SAP, Apptio, Anaplan, Hyperion",
        "one_row_represents": "One spend or budget line at period, cost center, vendor, application or service grain",
        "right_grain": "Monthly or quarterly amount with explicit basis and allocation rule",
        "minimum_fields": "period, cost_center, account, supplier_id, application_id, amount, spend_type, budget_or_actual, allocation_basis",
        "primary_join_keys": "period, cost_center, account, supplier_id, application_id",
        "product_need": "Tower value gates, Source commercial economics, Home cost context, cubes",
        "product_consumers": "Tower; Source 360; Home; cubes",
        "target_ecl_domains": "ecl_context.measure; ecl_context.relationship; ecl_commercial.invoice_line where contract-linked",
        "acceptable_partial_behavior": "Allocated values stay estimated; missing application allocation remains unallocated spend, not dropped.",
        "quality_gate": "Unknown is not zero; repeated tier constants across many rows fail distribution checks.",
        "do_not_collect": "Do not collect payroll detail, patient billing detail, bank data, or employee-level compensation.",
        "example_prefilled_row": "2026-Q1 | CC-4100 | software_subscription | Epic Systems Corporation | APP-1042 | $2.4M | actual",
    },
    {
        "family_id": "data_analytics_volumetrics",
        "workbook_folder": "04_Data_and_Analytics",
        "business_facing_workbook": "Data and Analytics Current State.xlsx",
        "extract_or_tab": "Marts, reports, jobs, scripts, users, and platform volumetrics",
        "source_owner": "Data platform owner, BI owner, analytics engineering leader",
        "likely_source_systems": "Tableau Server, Power BI admin, SSRS, Business Objects, Informatica, SSIS catalog, Airflow, DB catalogs",
        "one_row_represents": "One summarized workload segment by function, platform, tool, and period",
        "right_grain": "Counts by mart/function/tool, not every ETL job, report, stored procedure, or script",
        "minimum_fields": "function, platform_name, technology, workload_type, count, active_users, data_volume_tb, refresh_frequency, owner",
        "primary_join_keys": "function, platform_name, technology, workload_type",
        "product_need": "Home data architecture, Intelligence data readiness, Tower analytics spend, AI use-case feasibility",
        "product_consumers": "Home; Intelligence; Tower; cubes",
        "target_ecl_domains": "ecl_context.object; ecl_context.measure; ecl_context.relationship",
        "acceptable_partial_behavior": "If exact report/job inventory is unavailable, accept certified counts with basis and confidence and show the item-level inventory gap.",
        "quality_gate": "Do not ask for all pipelines; require technology name, segmentation, volumetric counts, users, and data volume where available.",
        "do_not_collect": "Do not collect report row-level data, patient data, credentials, or proprietary vendor schema internals.",
        "example_prefilled_row": "Finance | SQL Server Finance Mart | SSRS | reports | 420 | 760 users | 14 TB | daily | Finance BI",
    },
    {
        "family_id": "ai_tool_usage",
        "workbook_folder": "05_AI_Tools_and_Usage",
        "business_facing_workbook": "AI Tools and Usage.xlsx",
        "extract_or_tab": "Copilot, agent, automation, and model usage",
        "source_owner": "M365 admin, ServiceNow admin, GitHub admin, AI platform owner",
        "likely_source_systems": "M365 admin center, GitHub Enterprise, ServiceNow Now Assist, Azure OpenAI, internal agent telemetry",
        "one_row_represents": "One tool, population, use-case segment, period, and usage/adoption measure",
        "right_grain": "Monthly tool usage by business function, persona, and use-case category",
        "minimum_fields": "period, tool_name, vendor, user_segment, business_function, licensed_users, active_users, prompts_or_actions, cost, use_case_category",
        "primary_join_keys": "period, tool_name, business_function, user_segment",
        "product_need": "Tower AI value, Moves AI opportunities, Intelligence context, Source AI sourcing decisions",
        "product_consumers": "Tower; Moves; Intelligence; Source 360; cubes",
        "target_ecl_domains": "ecl_context.object; ecl_context.measure; ecl_context.relationship",
        "acceptable_partial_behavior": "Tool-level usage can load before use-case attribution; attribution gap must stay visible.",
        "quality_gate": "Adoption, cost, and value cannot be inferred from license count alone.",
        "do_not_collect": "Do not collect prompt contents, PHI, source code, secrets, or individual employee behavior unless explicitly approved.",
        "example_prefilled_row": "2026-07 | Microsoft 365 Copilot | Finance FP&A | 820 licensed | 310 active | analysis_assist | $24K",
    },
    {
        "family_id": "executive_and_director_interviews",
        "workbook_folder": "06_Interviews",
        "business_facing_workbook": "Interviews and Current-State Notes.xlsx",
        "extract_or_tab": "CXO and director interview notes",
        "source_owner": "AbarVa interview team with client sponsor coordination",
        "likely_source_systems": "Interview workbook, approved notes, transcript excerpts when permitted",
        "one_row_represents": "One interview answer or theme attributed to a role, function, and question",
        "right_grain": "Question-answer-theme-priority, separated from deterministic system facts",
        "minimum_fields": "interview_id, interviewee_role, function, question_id, answer_excerpt, theme, priority, pain_point, ai_implication, review_state",
        "primary_join_keys": "interview_id, question_id, function",
        "product_need": "Home business narrative, Intelligence priorities, Moves ideation, Tower context for gates",
        "product_consumers": "Home; Intelligence; Moves; Tower",
        "target_ecl_domains": "ecl_source.document; ecl_context.object; ecl_context.relationship",
        "acceptable_partial_behavior": "Strategic interviews can load before director-level tactical interviews; missing functions remain coverage gaps.",
        "quality_gate": "Interview excerpts inform priorities and themes; they cannot create spend, application, or value facts by themselves.",
        "do_not_collect": "Do not collect confidential HR details, personal performance comments, or privileged legal material.",
        "example_prefilled_row": "INT-042 | Director, Data Governance | Data and Analytics | Q-DQ-03 | data quality rules exist but are manual | governance maturity",
    },
    {
        "family_id": "infrastructure_cloud_datacenter",
        "workbook_folder": "07_Infrastructure_and_Cloud",
        "business_facing_workbook": "Infrastructure and Cloud.xlsx",
        "extract_or_tab": "Platforms, hosting, data centers, cloud accounts, mainframe, and storage",
        "source_owner": "Infrastructure, cloud platform, data center, and mainframe leaders",
        "likely_source_systems": "CMDB, cloud billing/inventory, VMware, storage tools, mainframe inventory, data-center DCIM",
        "one_row_represents": "One platform, cluster, account, appliance, or hosting segment",
        "right_grain": "Platform or capacity segment, not every server unless required for dependency proof",
        "minimum_fields": "platform_id, platform_name, technology, hosting_model, location, capacity, utilization, dr_tier, owner, supported_functions",
        "primary_join_keys": "platform_id, platform_name, application_id where mapped",
        "product_need": "Home architecture, Tower resilience/cost risk, Intelligence modernization context, AI readiness",
        "product_consumers": "Home; Tower; Intelligence; cubes",
        "target_ecl_domains": "ecl_context.object; ecl_context.relationship; ecl_context.measure",
        "acceptable_partial_behavior": "If server-level exports are unavailable, accept capacity and dependency counts by platform with confidence marked and show the server-level gap.",
        "quality_gate": "Major platforms such as mainframe, Teradata/Netezza, private cloud, and strategic cloud estates must be explicitly present or explicitly absent.",
        "do_not_collect": "Do not collect secrets, network keys, firewall rules, or vulnerability exploit detail.",
        "example_prefilled_row": "PLAT-MF-01 | IBM z16 Claims Mainframe | mainframe | owned_datacenter | 68% MIPS used | tier_1 | Claims",
    },
    {
        "family_id": "program_portfolio_moves",
        "workbook_folder": "08_Programs_and_Transformation",
        "business_facing_workbook": "Programs and Transformation.xlsx",
        "extract_or_tab": "Programs, initiatives, dependencies, value case, and status",
        "source_owner": "PMO, transformation office, business sponsors, finance value owner",
        "likely_source_systems": "Planview, Clarity, Jira Align, Smartsheet, business-case tracker",
        "one_row_represents": "One program or initiative with owner, target capability, cost, value, and dependency state",
        "right_grain": "Program and initiative, with separate milestones and dependency links when available",
        "minimum_fields": "program_id, initiative_id, sponsor, function, status, budget, forecast, value_case, target_capability, dependent_applications",
        "primary_join_keys": "program_id, initiative_id, application_id, capability_id",
        "product_need": "Moves workflow, Tower value gates, Home strategy, Intelligence context",
        "product_consumers": "Moves; Tower; Home; Intelligence; cubes",
        "target_ecl_domains": "ecl_context.object; ecl_context.relationship; ecl_context.measure",
        "acceptable_partial_behavior": "Partial program data can load with proposed business-case value; claimable value requires finance confirmation.",
        "quality_gate": "Programs may propose value; Tower cannot count it until source_recorded finance evidence and review gates pass.",
        "do_not_collect": "Do not collect named employee performance issues or confidential acquisition details.",
        "example_prefilled_row": "PROG-2026-RAF | RAF modernization | CFO/COO | in-flight | $18M budget | $31M value case | Health Plan",
    },
]


def write_csv(rows: list[dict[str, str]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def write_markdown(rows: list[dict[str, str]], path: Path) -> None:
    lines = [
        "# ECL Client Extraction Mapping",
        "",
        "Local planning/proof artifact only. This is product-first intake guidance: product deterministic needs define the extract, not an internal ECL table and not an old source-file layout.",
        "",
        "## Rules",
        "",
        "- Collect from the owner who can export the data in one action.",
        "- Accept partial extracts and carry Unknown or gap states forward.",
        "- Do not ask for all reports, all pipelines, all scripts, or row-level operational data when counts by function/tool/platform answer the product need.",
        "- A blank is better than invented precision.",
        "",
        "| Family | Workbook folder | Extract/tab | Owner | Grain | Product need | Quality gate |",
        "|---|---|---|---|---|---|---|",
    ]
    for row in rows:
        safe = {key: value.replace("|", "/") for key, value in row.items()}
        lines.append(
            "| {family_id} | {workbook_folder} | {extract_or_tab} | {source_owner} | {one_row_represents} | {product_need} | {quality_gate} |".format(
                **safe
            )
        )
    lines.extend(["", "## Per-Family Guidance", ""])
    for row in rows:
        lines.extend(
            [
                f"### {row['business_facing_workbook']} - {row['extract_or_tab']}",
                "",
                f"- **Source owner:** {row['source_owner']}",
                f"- **Likely source systems:** {row['likely_source_systems']}",
                f"- **Right grain:** {row['right_grain']}",
                f"- **Minimum fields:** {row['minimum_fields']}",
                f"- **Join keys:** {row['primary_join_keys']}",
                f"- **Product consumers:** {row['product_consumers']}",
                f"- **Target ECL domains:** {row['target_ecl_domains']}",
                f"- **Partial behavior:** {row['acceptable_partial_behavior']}",
                f"- **Do not collect:** {row['do_not_collect']}",
                f"- **Example row:** {row['example_prefilled_row']}",
                "",
            ]
        )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    out_dir = args.out_dir.resolve()
    csv_path = out_dir / "ecl_client_extraction_mapping.csv"
    md_path = out_dir / "ecl_client_extraction_mapping.md"
    summary_path = out_dir / "ecl_client_extraction_mapping_summary.json"
    write_csv(ROWS, csv_path)
    write_markdown(ROWS, md_path)
    summary_path.write_text(
        json.dumps(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "accepted": True,
                "families": len(ROWS),
                "workbook_folders": sorted({row["workbook_folder"] for row in ROWS}),
                "product_consumers": sorted(
                    {
                        consumer.strip()
                        for row in ROWS
                        for consumer in row["product_consumers"].split(";")
                    }
                ),
                "partial_input_supported": True,
                "csv": csv_path.as_posix(),
                "markdown": md_path.as_posix(),
            },
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"csv": csv_path.as_posix(), "markdown": md_path.as_posix(), "families": len(ROWS)}, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
