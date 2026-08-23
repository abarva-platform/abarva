#!/usr/bin/env python3

"""Write page-level deterministic fact contracts for ECL product consumers."""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_OUT_DIR = Path("outputs/ecl-next-slice-planning-2026-08-23")


ROWS = [
    {
        "contract_id": "PFC-SOURCE-001",
        "product_module": "Source 360",
        "page_or_view": "Contract 360",
        "cxo_question": "What does this contract cover, what is it worth, where is leverage lost, and what can we do next?",
        "deterministic_facts": "supplier identity; contract value; renewal/notice; scope; pricing; AP variance; SLA credits; protection score; benchmark basis; document evidence",
        "required_entities": "supplier, contract, document, service tower, application/platform, business function",
        "required_relationships": "contract supplied_by supplier; contract covers service tower; contract scopes application/platform; document supports contract",
        "required_measures": "annualized value, invoice actuals, rate variance, SLA credit, notice days, TFC estimate, minimum commitment, shortfall exposure",
        "required_extracts": "vendor_contract_commercial; cmdb_application_portfolio; application_deployment_and_hosting; budget_spend_finance",
        "projection_or_cube": "source_contract_360; source_vendor_360; commercial cubes",
        "admission_or_gate": "No topology refusal; render row-level gates for missing SLA, benchmark, finance approval, or unverified documents.",
        "partial_input_behavior": "Show partial coverage counts and required additions; do not hide missing scope as empty lists.",
        "not_allowed": "No value claim from unverified extraction; no vendor inference by product name alone.",
    },
    {
        "contract_id": "PFC-SOURCE-002",
        "product_module": "Source 360",
        "page_or_view": "Vendor 360",
        "cxo_question": "Which vendors concentrate spend, contracts, weak terms, application exposure, and workflow opportunities?",
        "deterministic_facts": "vendor parent, supplier entities, contract count, annualized value, weak-protection count, scoped application count, document count",
        "required_entities": "vendor parent, supplier, contract, application, service tower, document",
        "required_relationships": "supplier rolls_up_to vendor; contract supplied_by supplier; supplier supports applications through contract scope",
        "required_measures": "annualized value, protection score, benchmark variance, SLA credit exposure, AP variance",
        "required_extracts": "vendor_contract_commercial; cmdb_application_portfolio; budget_spend_finance",
        "projection_or_cube": "source_vendor_360; commercial cubes",
        "admission_or_gate": "Gate supplier rollups when parent identity is not declared; render unknown parent rather than grouping by name similarity.",
        "partial_input_behavior": "Vendor page can load before every document is extracted, but evidence coverage must be visible.",
        "not_allowed": "No stale supplier IDs after re-vendoring; no invented managed-service suppliers.",
    },
    {
        "contract_id": "PFC-TOWER-001",
        "product_module": "Tower",
        "page_or_view": "Value and action command center",
        "cxo_question": "What value is claimable, blocked, or still evidence-gated?",
        "deterministic_facts": "finance-confirmed value, proposed value, blocked reason, owner approval, contract exposure, shortfall exposure, SLA credit",
        "required_entities": "program, initiative, contract, supplier, application, finance owner",
        "required_relationships": "initiative depends_on application; contract funds service; measure supported_by evidence; value approved_by owner",
        "required_measures": "budget, forecast, actual spend, finance-confirmed value, AP variance, SLA credit, risk exposure",
        "required_extracts": "budget_spend_finance; vendor_contract_commercial; program_portfolio_moves; executive_and_director_interviews",
        "projection_or_cube": "tower_command_center; tower/source cubes",
        "admission_or_gate": "Claims remain blocked until basis and approval requirements pass; gate reason must be rendered.",
        "partial_input_behavior": "Partial finance data can load as proposed or estimated; claimable value remains zero until confirmed.",
        "not_allowed": "No model-calculated ROI; no business-case value counted as realized value.",
    },
    {
        "contract_id": "PFC-HOME-001",
        "product_module": "Home",
        "page_or_view": "Executive landscape",
        "cxo_question": "Where is complexity, fragility, and value concentrated across the enterprise?",
        "deterministic_facts": "business functions, application count, tier distribution, lifecycle watch, vendor exposure, platform exposure, data estate signals",
        "required_entities": "business function, capability, application, platform, supplier, data platform, interview theme",
        "required_relationships": "application supports function; application hosted_on platform; contract scopes application; theme applies_to function",
        "required_measures": "application count, tier count, lifecycle count, annual cost, platform utilization, D&A workload counts",
        "required_extracts": "cmdb_application_portfolio; application_deployment_and_hosting; infrastructure_cloud_datacenter; data_analytics_volumetrics; executive_and_director_interviews",
        "projection_or_cube": "home_enterprise_landscape; architecture/data-flow views",
        "admission_or_gate": "Architecture/data-flow views with declared admission gates must render refusal payloads when evidence is insufficient.",
        "partial_input_behavior": "Show known coverage and missing domains; do not present topology as complete when convergence/input thresholds fail.",
        "not_allowed": "No raw intake rendering; no treemap/tile view that hides missing topology or sparse data.",
    },
    {
        "contract_id": "PFC-HOME-002",
        "product_module": "Home",
        "page_or_view": "Data and analytics current state",
        "cxo_question": "What data estate exists by function, tool, workload, users, and volume?",
        "deterministic_facts": "marts, reports, ETL jobs, scripts, active users, data volume, platform/tool, refresh cadence, owner",
        "required_entities": "data platform, mart, reporting tool, business function, owner group",
        "required_relationships": "mart serves function; report_tool consumes mart; platform hosted_on infrastructure",
        "required_measures": "report count, job count, script count, active user count, data volume TB, refresh failures where available",
        "required_extracts": "data_analytics_volumetrics; infrastructure_cloud_datacenter; cmdb_application_portfolio",
        "projection_or_cube": "home data architecture projection; D&A cubes",
        "admission_or_gate": "If volumetrics are counts-only, mark confidence and keep drilldown disabled until inventory arrives.",
        "partial_input_behavior": "Partial counts by function/tool are enough for current-state view; exact lists can catch up later and remain a visible gap.",
        "not_allowed": "No exhaustive ETL/report collection demand unless a product view needs item-level evidence.",
    },
    {
        "contract_id": "PFC-INTEL-001",
        "product_module": "Intelligence",
        "page_or_view": "Context pack",
        "cxo_question": "Which governed facts and cited evidence can the assistant use safely?",
        "deterministic_facts": "facts, measures, review state, basis, document spans, interview excerpts, gaps, admission/refusal state",
        "required_entities": "document, interview, application, platform, supplier, program, metric",
        "required_relationships": "evidence supports fact; interview theme applies_to function; metric measures object",
        "required_measures": "all model-usable measures with basis, quality, confidence, and review state",
        "required_extracts": "all mapped source-room families",
        "projection_or_cube": "intelligence_context_pack",
        "admission_or_gate": "Blocked/provisional facts do not enter agent-ready context; refusal context is included as refusal, not as fact.",
        "partial_input_behavior": "Incomplete context is usable only with coverage and confidence stated.",
        "not_allowed": "No raw context to models; no synthetic directional benchmark as source_recorded fact.",
    },
    {
        "contract_id": "PFC-MOVES-001",
        "product_module": "Moves",
        "page_or_view": "Opportunity and workflow intake",
        "cxo_question": "Which AI or transformation opportunities are grounded in current-state evidence and owner priorities?",
        "deterministic_facts": "programs, initiatives, interview priorities, AI tool usage, process pain points, application dependencies, budget/value case",
        "required_entities": "program, initiative, AI use case, interview theme, application, function, tool",
        "required_relationships": "initiative implements use case; use case targets process; program depends_on application; theme supports opportunity",
        "required_measures": "budget, forecast, proposed value, licensed users, active users, current process volume where available",
        "required_extracts": "program_portfolio_moves; ai_tool_usage; executive_and_director_interviews; cmdb_application_portfolio; budget_spend_finance",
        "projection_or_cube": "future Moves ECL projection; AI/current-state cubes",
        "admission_or_gate": "Opportunity can be proposed from interviews, but automation/value claims require deterministic measures.",
        "partial_input_behavior": "Strategic themes can load before tactical director detail; partial recommendations carry coverage gaps.",
        "not_allowed": "No AI solutioning from generic pattern library without client current-state evidence.",
    },
    {
        "contract_id": "PFC-CUBE-001",
        "product_module": "Cubes",
        "page_or_view": "Cross-product deterministic cubes",
        "cxo_question": "How do facts slice by function, vendor, platform, application, period, tool, and source basis?",
        "deterministic_facts": "metric dictionary, measure IDs, units, dimensions, source basis, review state, quality state",
        "required_entities": "metric, measure, application, supplier, platform, function, contract, period",
        "required_relationships": "measure describes object; cube metric resolves to metric definition; cube measure resolves to governed measure",
        "required_measures": "all cube measures must have FK-backed metric keys and units",
        "required_extracts": "all mapped source-room families",
        "projection_or_cube": "cube_manifest; cube_slice; cube_slice_metric; cube_slice_measure",
        "admission_or_gate": "Cube slices with missing required dimensions carry gap flags and cannot silently coerce Unknown to zero.",
        "partial_input_behavior": "A cube can publish partial dimensions when quality state and missing dimension flags are explicit.",
        "not_allowed": "No metric key only in JSON; no ungoverned display metric without dictionary and measure FK.",
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
        "# ECL Product Deterministic Fact Contracts",
        "",
        "Local planning/proof artifact only. This file defines what each product page is allowed to ask from ECL and how it must behave when intake is partial.",
        "",
        "| Contract | Product | Page/view | CXO question | Required extracts | Admission/gate | Partial behavior |",
        "|---|---|---|---|---|---|---|",
    ]
    for row in rows:
        safe = {key: value.replace("|", "/") for key, value in row.items()}
        lines.append(
            "| {contract_id} | {product_module} | {page_or_view} | {cxo_question} | {required_extracts} | {admission_or_gate} | {partial_input_behavior} |".format(
                **safe
            )
        )
    lines.extend(["", "## Non-Negotiables", ""])
    for row in rows:
        lines.append(f"- **{row['contract_id']} {row['product_module']} / {row['page_or_view']}:** {row['not_allowed']}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    out_dir = args.out_dir.resolve()
    csv_path = out_dir / "ecl_product_deterministic_fact_contracts.csv"
    md_path = out_dir / "ecl_product_deterministic_fact_contracts.md"
    summary_path = out_dir / "ecl_product_deterministic_fact_contracts_summary.json"
    write_csv(ROWS, csv_path)
    write_markdown(ROWS, md_path)
    summary_path.write_text(
        json.dumps(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "accepted": True,
                "contracts": len(ROWS),
                "product_modules": sorted({row["product_module"] for row in ROWS}),
                "requires_refusal_or_gate_behavior": True,
                "browser_proof_status": "not_started",
                "csv": csv_path.as_posix(),
                "markdown": md_path.as_posix(),
            },
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"csv": csv_path.as_posix(), "markdown": md_path.as_posix(), "contracts": len(ROWS)}, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
