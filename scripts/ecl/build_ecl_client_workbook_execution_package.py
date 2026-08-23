#!/usr/bin/env python3

"""Build a client-execution workbook folder package from product-first ECL mappings.

This is a local proof artifact only. It does not replace client-facing workbook
packages, upload to Azure, mutate tenant inputs, or generate active synthetic
data.
"""

from __future__ import annotations

import argparse
import csv
import html
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from write_ecl_client_extraction_mapping import ROWS as EXTRACTION_ROWS
from write_ecl_product_fact_contracts import ROWS as PRODUCT_ROWS


DEFAULT_OUT_DIR = Path("outputs/ecl-client-workbook-execution-2026-08-23")

FIELD_HINTS = {
    "account": ("Finance account or natural account", "Must match the finance export account code."),
    "active_users": ("Active users in the period", "Must be a non-negative count; Unknown is allowed."),
    "ai_implication": ("AI implication", "Short business statement, not a generated recommendation."),
    "allocation_basis": ("Allocation basis", "State direct, allocated, estimated, or Unknown."),
    "amount": ("Amount", "Currency value with period and basis."),
    "annualized_value": ("Annualized value", "Must reconcile to register or finance source."),
    "application_id": ("Application ID", "Declared ID; do not derive from folder or display name."),
    "application_name": ("Application name", "Business-recognizable name from CMDB or application portfolio."),
    "budget": ("Approved budget", "Budget value from PMO or finance source."),
    "budget_or_actual": ("Budget or actual", "Use budget, actual, forecast, or estimate."),
    "business_function": ("Business function", "Function that owns or consumes the object."),
    "business_owner": ("Business owner", "Owner role or group; Unknown is allowed."),
    "capability_id": ("Capability ID", "Declared capability identifier when available."),
    "confidence": ("Confidence", "Use source_recorded, estimated, model_inferred, or Unknown."),
    "contract_id": ("Contract ID", "Stable contract identifier from register or CLM."),
    "cost": ("Cost", "Period cost from admin, finance, or allocation source."),
    "cost_center": ("Cost center", "Finance cost center or owning budget center."),
    "data_volume_tb": ("Data volume TB", "Storage or workload volume in terabytes where available."),
    "dependent_applications": ("Dependent applications", "Declared application IDs or names; unresolved names remain gaps."),
    "deployment_id": ("Deployment ID", "Stable deployment/environment identifier."),
    "document_id": ("Document ID", "Stable document identifier tied to an inventory row."),
    "dr_tier": ("DR tier", "Declared recovery tier or Unknown."),
    "effective_date": ("Effective date", "Contract or program effective date."),
    "environment": ("Environment", "Production, Test, Training, DR, or other explicit environment."),
    "expiration_date": ("Expiration date", "Contract expiration or term end date."),
    "forecast": ("Forecast", "Forecast value from PMO or finance source."),
    "function": ("Function", "Business function or operating domain."),
    "hosting_model": ("Hosting model", "On-prem, private cloud, SaaS, AWS, Azure, GCP, or Unknown."),
    "hosting_platform_id": ("Hosting platform ID", "Declared platform/account/cluster ID."),
    "initiative_id": ("Initiative ID", "Stable initiative identifier."),
    "interview_id": ("Interview ID", "Stable interview/session identifier."),
    "interviewee_role": ("Interviewee role", "Role title, not personal performance detail."),
    "licensed_users": ("Licensed users", "Licensed population count from admin or procurement source."),
    "lifecycle": ("Lifecycle", "Current, watch, replace, retire, or Unknown."),
    "notice_window": ("Notice window", "Notice period from contract register or clause extraction."),
    "owner": ("Owner", "Owning group or role."),
    "period": ("Period", "Month, quarter, or date period for the measure."),
    "platform_id": ("Platform ID", "Declared platform, cluster, account, appliance, or hosting segment ID."),
    "platform_name": ("Platform name", "Recognizable platform, cluster, account, or appliance name."),
    "program_id": ("Program ID", "Stable program identifier."),
    "question_id": ("Question ID", "Interview guide question identifier."),
    "region": ("Region", "Cloud region or data center region."),
    "review_state": ("Review state", "not_reviewed, reviewed, approved, rejected, or needs_follow_up."),
    "runtime_status": ("Runtime status", "Active, inactive, planned, retired, or Unknown."),
    "service_tower_id": ("Service tower ID", "Contract service tower identifier."),
    "spend_type": ("Spend type", "Software, services, labor, infrastructure, or other finance category."),
    "sponsor": ("Sponsor", "Business sponsor role or group."),
    "status": ("Status", "Current workflow or lifecycle state."),
    "supplier_id": ("Supplier ID", "Declared supplier identifier from vendor/finance source."),
    "target_capability": ("Target capability", "Capability the program or initiative improves."),
    "technical_owner": ("Technical owner", "IT owner role or group; Unknown is allowed."),
    "technology": ("Technology", "Technology/tool/platform name."),
    "tier": ("Criticality tier", "Tier 1, Tier 2, Tier 3, or Unknown."),
    "tool_name": ("Tool name", "Licensed tool or AI service name."),
    "use_case_category": ("Use-case category", "Category of usage; Unknown is allowed."),
    "user_segment": ("User segment", "Role, function, or persona segment."),
    "vendor": ("Vendor", "Supplier or product vendor as declared by source."),
    "value_case": ("Value case", "Proposed value case; Tower claimable value needs finance confirmation."),
    "workload_type": ("Workload type", "Reports, jobs, scripts, marts, models, dashboards, or usage."),
}

FAMILY_EXAMPLES = {
    "cmdb_application_portfolio": {
        "application_id": "APP-1042",
        "application_name": "Epic Tapestry",
        "business_owner": "Health Plan Operations",
        "technical_owner": "Clinical Platforms",
        "vendor": "Epic Systems Corporation",
        "lifecycle": "current",
        "tier": "tier_1",
        "hosting_model": "aws_hosted",
        "business_function": "Revenue Cycle",
    },
    "application_deployment_and_hosting": {
        "application_id": "APP-1042",
        "deployment_id": "APP-1042-PRD",
        "environment": "Production",
        "hosting_platform_id": "PLAT-AWS-EPIC-01",
        "hosting_model": "aws_hosted",
        "region": "us-east-1",
        "dr_tier": "warm_dr",
        "runtime_status": "active",
    },
    "vendor_contract_commercial": {
        "contract_id": "MER-CTR-SSO-BPO-001",
        "supplier_id": "MER-VEN-PEOPLEBRIDGE",
        "effective_date": "2024-01-01",
        "expiration_date": "2027-12-31",
        "annualized_value": "10710000",
        "notice_window": "365 days",
        "document_id": "DOC-SSO-BPO-001-MSA",
        "service_tower_id": "HR-BPO",
    },
    "budget_spend_finance": {
        "period": "2026-Q1",
        "cost_center": "CC-4100",
        "account": "software_subscription",
        "supplier_id": "MER-VEN-EPIC",
        "application_id": "APP-1042",
        "amount": "2400000",
        "spend_type": "software",
        "budget_or_actual": "actual",
        "allocation_basis": "direct",
    },
    "data_analytics_volumetrics": {
        "function": "Finance",
        "platform_name": "SQL Server Finance Mart",
        "technology": "SSRS",
        "workload_type": "reports",
        "count": "420",
        "active_users": "760",
        "data_volume_tb": "14",
        "refresh_frequency": "daily",
        "owner": "Finance BI",
    },
    "ai_tool_usage": {
        "period": "2026-07",
        "tool_name": "Microsoft 365 Copilot",
        "vendor": "Microsoft Corporation",
        "user_segment": "Finance FP&A",
        "business_function": "Finance",
        "licensed_users": "820",
        "active_users": "310",
        "prompts_or_actions": "18400",
        "cost": "24000",
        "use_case_category": "analysis_assist",
    },
    "executive_and_director_interviews": {
        "interview_id": "INT-042",
        "interviewee_role": "Director, Data Governance",
        "function": "Data and Analytics",
        "question_id": "Q-DQ-03",
        "answer_excerpt": "Data quality rules exist but are manually reconciled across marts.",
        "theme": "governance maturity",
        "priority": "high",
        "pain_point": "manual issue triage",
        "ai_implication": "needs governed data-quality workflow before broad self-service AI",
        "review_state": "not_reviewed",
    },
    "infrastructure_cloud_datacenter": {
        "platform_id": "PLAT-MF-01",
        "platform_name": "IBM z16 Claims Mainframe",
        "technology": "IBM z16",
        "hosting_model": "owned_datacenter",
        "location": "Lakeview Data Center",
        "capacity": "14800 MIPS",
        "utilization": "68%",
        "dr_tier": "tier_1",
        "owner": "Mainframe Operations",
        "supported_functions": "Claims; Enrollment; Finance",
    },
    "program_portfolio_moves": {
        "program_id": "PROG-2026-RAF",
        "initiative_id": "INIT-RAF-DATA-001",
        "sponsor": "CFO/COO",
        "function": "Health Plan",
        "status": "in_flight",
        "budget": "18000000",
        "forecast": "19500000",
        "value_case": "31000000 proposed",
        "target_capability": "RAF modernization",
        "dependent_applications": "APP-1042; APP-1190",
    },
}

RECIPE_TEXT = {
    "cmdb_application_portfolio": {
        "recipe_name": "CMDB application service export",
        "system_extract": "ServiceNow: cmdb_ci_service and application service list export, or LeanIX application factsheet export",
        "right_filter": "Active and planned business applications/application services; exclude servers and environment-only CIs",
        "output_format": "CSV or XLSX, one row per base application/application service",
    },
    "application_deployment_and_hosting": {
        "recipe_name": "Application environment and hosting export",
        "system_extract": "CMDB relationship export plus cloud account or virtualization inventory",
        "right_filter": "Production/Test/Training/DR environments that reference declared applications",
        "output_format": "CSV or XLSX, one row per deployment/environment",
    },
    "vendor_contract_commercial": {
        "recipe_name": "Contract register plus document inventory",
        "system_extract": "CLM/Coupa/Ariba contract report, AP invoice export, SLA report, document library inventory",
        "right_filter": "Active contracts and renewal candidates in technology, BPO, data, AI, and managed services",
        "output_format": "CSV/XLSX plus linked PDFs or document exports where sharing is approved",
    },
    "budget_spend_finance": {
        "recipe_name": "IT finance actuals and forecast extract",
        "system_extract": "ERP GL, Apptio, Anaplan, Hyperion, or finance data mart export",
        "right_filter": "IT cost centers and technology suppliers by period; exclude payroll/person-level compensation",
        "output_format": "CSV or XLSX, monthly or quarterly grain",
    },
    "data_analytics_volumetrics": {
        "recipe_name": "D&A workload volumetric export",
        "system_extract": "Tableau/Power BI/SSRS/Business Objects admin exports, ETL catalog counts, DB catalog size summaries",
        "right_filter": "Counts by function, platform, technology, and workload type; do not export every report or pipeline unless requested later",
        "output_format": "CSV or XLSX summarized counts by segment",
    },
    "ai_tool_usage": {
        "recipe_name": "AI tool adoption and usage export",
        "system_extract": "M365 admin center, GitHub Enterprise, ServiceNow Now Assist, Azure OpenAI, internal agent telemetry",
        "right_filter": "Monthly usage by function/persona/use-case category; exclude prompt contents and PHI",
        "output_format": "CSV or XLSX summarized by period/tool/function/persona",
    },
    "executive_and_director_interviews": {
        "recipe_name": "Interview answer and theme capture",
        "system_extract": "Approved interview workbook or transcript excerpts when permitted",
        "right_filter": "Director-and-above current-state answers, strategic priorities, tactical process gaps, and AI implications",
        "output_format": "XLSX interview workbook, one answer/theme per row",
    },
    "infrastructure_cloud_datacenter": {
        "recipe_name": "Platform and capacity segment export",
        "system_extract": "CMDB, cloud inventory, VMware, storage tools, mainframe inventory, DCIM",
        "right_filter": "Major platforms, clusters, cloud accounts, mainframe, private cloud, data centers, and D&A appliances",
        "output_format": "CSV or XLSX, one row per platform/capacity segment",
    },
    "program_portfolio_moves": {
        "recipe_name": "Program and initiative portfolio export",
        "system_extract": "Planview, Clarity, Jira Align, Smartsheet, business-case tracker",
        "right_filter": "Active and planned transformation/AI/technology initiatives with owner, status, budget, value case, dependencies",
        "output_format": "CSV or XLSX, one row per program or initiative",
    },
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str] | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if fieldnames is None:
        fieldnames = []
        for row in rows:
            for key in row.keys():
                if key not in fieldnames:
                    fieldnames.append(key)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def split_fields(value: str) -> list[str]:
    return [part.strip() for part in value.split(",") if part.strip()]


def label_for(field: str) -> str:
    if field in FIELD_HINTS:
        return FIELD_HINTS[field][0]
    return field.replace("_", " ").title()


def validation_for(field: str) -> str:
    if field in FIELD_HINTS:
        return FIELD_HINTS[field][1]
    if field.endswith("_id"):
        return "Stable identifier from the source extract; do not infer."
    if "date" in field:
        return "ISO date when available; Unknown is allowed."
    if field in {"count", "capacity", "utilization"}:
        return "Numeric or percentage value with basis; Unknown is allowed."
    return "Use the source export value or Unknown; do not invent."


def example_for(family_id: str, field: str) -> str:
    return FAMILY_EXAMPLES.get(family_id, {}).get(field, "Unknown")


def html_page(title: str, body: str) -> str:
    return f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>{html.escape(title)}</title>
  <style>
    body {{ font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; color: #172033; background: #f7f8fb; }}
    main {{ max-width: 1120px; margin: 0 auto; padding: 40px 28px 56px; }}
    h1 {{ margin: 0 0 8px; font-size: 30px; line-height: 1.15; }}
    h2 {{ margin-top: 28px; border-top: 1px solid #d9dfeb; padding-top: 20px; }}
    p, li {{ line-height: 1.55; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 16px; background: white; }}
    th, td {{ text-align: left; padding: 10px 12px; border: 1px solid #dfe5ef; vertical-align: top; }}
    th {{ background: #eef3f8; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }}
    .meta {{ color: #5b6678; }}
    .callout {{ background: #fff7e6; border: 1px solid #f0cc89; padding: 14px 16px; margin: 18px 0; }}
    code {{ background: #eef3f8; padding: 2px 5px; border-radius: 4px; }}
  </style>
</head>
<body>
<main>
{body}
</main>
</body>
</html>
"""


def render_folder_readme(folder_rows: list[dict[str, str]]) -> str:
    folder = folder_rows[0]["workbook_folder"]
    workbook = folder_rows[0]["business_facing_workbook"]
    lines = [
        f"# {folder} - {workbook}",
        "",
        "This folder is a client-execution proof package. It explains what to export, who owns it, how to fill the workbook tab, how partial intake catches up, and which product pages need the data.",
        "",
        "Do not fill plausible values. Use blank, Unknown, or Not Applicable when the source does not provide the field.",
        "",
        "## Files",
        "",
        "- `Field_Guide.csv`: business labels, source hints, validation rules, examples, and blank behavior.",
        "- `Example_Rows.csv`: one practical prefilled row per extract/tab.",
        "- `Source_Extract_Recipes.csv`: how the owner can pull the source extract at the right grain.",
        "- `Product_Mapping.csv`: why the extract exists and which product pages consume it.",
        "- `How_To_Use.html`: readable client guide for the folder.",
        "",
        "## Extracts",
        "",
    ]
    for row in folder_rows:
        lines.extend(
            [
                f"### {row['extract_or_tab']}",
                "",
                f"- Owner: {row['source_owner']}",
                f"- One row represents: {row['one_row_represents']}",
                f"- Right grain: {row['right_grain']}",
                f"- Partial behavior: {row['acceptable_partial_behavior']}",
                f"- Do not collect: {row['do_not_collect']}",
                "",
            ]
        )
    return "\n".join(lines)


def build_folder_artifacts(rows: list[dict[str, str]], out_dir: Path) -> dict[str, object]:
    rows_by_folder: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        rows_by_folder[row["workbook_folder"]].append(row)

    manifest_rows: list[dict[str, str]] = []
    total_field_rows = 0
    total_recipe_rows = 0
    total_example_rows = 0

    for folder, folder_rows in sorted(rows_by_folder.items()):
        folder_dir = out_dir / folder
        folder_dir.mkdir(parents=True, exist_ok=True)

        field_rows: list[dict[str, str]] = []
        example_rows: list[dict[str, str]] = []
        recipe_rows: list[dict[str, str]] = []
        product_rows: list[dict[str, str]] = []

        for row in folder_rows:
            family_id = row["family_id"]
            fields = split_fields(row["minimum_fields"])
            for field in fields:
                field_rows.append(
                    {
                        "family_id": family_id,
                        "extract_or_tab": row["extract_or_tab"],
                        "field_code": field,
                        "business_label": label_for(field),
                        "source_owner": row["source_owner"],
                        "source_system_hint": row["likely_source_systems"],
                        "why_needed": row["product_need"],
                        "example_value": example_for(family_id, field),
                        "required_for_minimum_load": "yes",
                        "allowed_blank": "yes, if unavailable from source",
                        "blank_behavior": row["acceptable_partial_behavior"],
                        "validation_rule": validation_for(field),
                        "product_consumers": row["product_consumers"],
                        "do_not_collect": row["do_not_collect"],
                    }
                )

            example = {"family_id": family_id, "extract_or_tab": row["extract_or_tab"]}
            for field in fields:
                example[field] = example_for(family_id, field)
            example_rows.append(example)

            recipe = RECIPE_TEXT[family_id]
            recipe_rows.append(
                {
                    "family_id": family_id,
                    "extract_or_tab": row["extract_or_tab"],
                    "recipe_name": recipe["recipe_name"],
                    "source_owner": row["source_owner"],
                    "system_extract": recipe["system_extract"],
                    "right_filter": recipe["right_filter"],
                    "row_grain": row["right_grain"],
                    "output_format": recipe["output_format"],
                    "join_keys": row["primary_join_keys"],
                    "partial_load_behavior": row["acceptable_partial_behavior"],
                    "quality_gate": row["quality_gate"],
                    "do_not_collect": row["do_not_collect"],
                }
            )
            product_rows.append(
                {
                    "family_id": family_id,
                    "extract_or_tab": row["extract_or_tab"],
                    "product_consumers": row["product_consumers"],
                    "product_need": row["product_need"],
                    "target_ecl_domains": row["target_ecl_domains"],
                    "quality_gate": row["quality_gate"],
                    "partial_behavior": row["acceptable_partial_behavior"],
                }
            )

        write_csv(folder_dir / "Field_Guide.csv", field_rows)
        write_csv(folder_dir / "Example_Rows.csv", example_rows)
        write_csv(folder_dir / "Source_Extract_Recipes.csv", recipe_rows)
        write_csv(folder_dir / "Product_Mapping.csv", product_rows)
        (folder_dir / "README.md").write_text(render_folder_readme(folder_rows) + "\n", encoding="utf-8")

        body = [
            f"<h1>{html.escape(folder_rows[0]['business_facing_workbook'])}</h1>",
            f"<p class=\"meta\">Folder: <code>{html.escape(folder)}</code></p>",
            "<div class=\"callout\">Use the source extract as-is at the right grain. Blank, Unknown, and Not Applicable are valid answers. Do not fill plausible values.</div>",
            "<h2>What To Pull</h2>",
            "<table><thead><tr><th>Extract</th><th>Owner</th><th>Source</th><th>Grain</th><th>Partial Behavior</th></tr></thead><tbody>",
        ]
        for recipe in recipe_rows:
            body.append(
                "<tr>"
                f"<td>{html.escape(recipe['extract_or_tab'])}</td>"
                f"<td>{html.escape(recipe['source_owner'])}</td>"
                f"<td>{html.escape(recipe['system_extract'])}</td>"
                f"<td>{html.escape(recipe['row_grain'])}</td>"
                f"<td>{html.escape(recipe['partial_load_behavior'])}</td>"
                "</tr>"
            )
        body.extend(["</tbody></table>", "<h2>Minimum Fields</h2>", "<table><thead><tr><th>Field</th><th>Business Meaning</th><th>Example</th><th>Validation</th></tr></thead><tbody>"])
        for field in field_rows:
            body.append(
                "<tr>"
                f"<td><code>{html.escape(field['field_code'])}</code></td>"
                f"<td>{html.escape(field['business_label'])}</td>"
                f"<td>{html.escape(field['example_value'])}</td>"
                f"<td>{html.escape(field['validation_rule'])}</td>"
                "</tr>"
            )
        body.extend(["</tbody></table>", "<h2>Product Use</h2>", "<ul>"])
        for product in product_rows:
            body.append(
                f"<li><strong>{html.escape(product['extract_or_tab'])}</strong>: {html.escape(product['product_need'])}</li>"
            )
        body.append("</ul>")
        (folder_dir / "How_To_Use.html").write_text(
            html_page(folder_rows[0]["business_facing_workbook"], "\n".join(body)),
            encoding="utf-8",
        )

        total_field_rows += len(field_rows)
        total_recipe_rows += len(recipe_rows)
        total_example_rows += len(example_rows)
        manifest_rows.append(
            {
                "workbook_folder": folder,
                "business_facing_workbook": folder_rows[0]["business_facing_workbook"],
                "extract_count": str(len(folder_rows)),
                "field_count": str(len(field_rows)),
                "example_row_count": str(len(example_rows)),
                "recipe_count": str(len(recipe_rows)),
                "required_files": "README.md; How_To_Use.html; Field_Guide.csv; Example_Rows.csv; Source_Extract_Recipes.csv; Product_Mapping.csv",
                "status": "local_proof_only_not_client_package_replacement",
            }
        )

    write_csv(out_dir / "workbook_folder_manifest.csv", manifest_rows)
    (out_dir / "workbook_folder_manifest.md").write_text(
        "# ECL Client Workbook Folder Manifest\n\n"
        "Local proof artifact only. Each workbook has its own folder, field guide, examples, source extract recipes, product mapping, and readable HTML guide.\n\n"
        "| Folder | Workbook | Extracts | Fields | Examples | Recipes |\n"
        "|---|---|---:|---:|---:|---:|\n"
        + "\n".join(
            f"| {row['workbook_folder']} | {row['business_facing_workbook']} | {row['extract_count']} | {row['field_count']} | {row['example_row_count']} | {row['recipe_count']} |"
            for row in manifest_rows
        )
        + "\n",
        encoding="utf-8",
    )

    summary = {
        "generated_at": utc_now(),
        "accepted": True,
        "workbook_folder_count": len(rows_by_folder),
        "source_family_count": len(rows),
        "field_guide_rows": total_field_rows,
        "example_rows": total_example_rows,
        "source_extract_recipes": total_recipe_rows,
        "product_contracts_referenced": len(PRODUCT_ROWS),
        "partial_processing_supported": True,
        "client_package_replacement": False,
        "active_tenant_replacement": False,
        "out_dir": out_dir.as_posix(),
    }
    (out_dir / "workbook_execution_package_summary.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return summary


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    summary = build_folder_artifacts(EXTRACTION_ROWS, args.out_dir.resolve())
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
