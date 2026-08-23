#!/usr/bin/env python3

"""Write product-consumption mapping for the commercial ECL slice."""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_OUT_DIR = Path("outputs/ecl-commercial-contract-supply-correction-2026-08-22")


ROWS = [
    {
        "product_module": "Source 360",
        "page_or_cube": "Contract 360",
        "user_question": "What does this contract cover, what is it worth, what documents back it, and what action is possible?",
        "deterministic_facts": "contract header, supplier, annualized value, renewal date, service lines, scoped applications, AP variance, SLA credits, protection score, benchmark variance",
        "source_extracts": "contract_register.csv; supplier_master.csv; contract_document_inventory.csv; document_clause_extractions.csv; source_contract_scope_services.csv; contract_scope_application_links.csv; source_contract_pricing_rate_cards.csv; source_ap_po_invoice_lines.csv; source_sla_kpi_events.csv; source_market_benchmark_rates.csv; contract_commercial_protection_assessment.csv",
        "ecl_tables": "ecl_source.document; ecl_source.document_extraction; ecl_context.object; ecl_context.relationship; ecl_context.measure; ecl_commercial.contract; ecl_commercial.contract_service_line; ecl_commercial.contract_scope; ecl_commercial.invoice_line; ecl_commercial.sla_observation",
        "projection_or_cube_tables": "ecl_projection.source_contract_360",
        "gate_or_refusal": "No refusal gate; row is visible with unverified evidence and action gates. Money remains non-claimable until finance and owner review pass.",
        "basis_rule": "Contract dollars come from register/AP; clause-derived protection components cite document spans; synthetic benchmarks remain model_inferred.",
        "browser_proof_status": "not_started",
    },
    {
        "product_module": "Source 360",
        "page_or_cube": "Vendor 360",
        "user_question": "Which suppliers concentrate contract value, scope, weak protections, documents, and optimization opportunities?",
        "deterministic_facts": "supplier identity, contract count, annualized value, service categories, protection weaknesses, document count, open evidence gates",
        "source_extracts": "supplier_master.csv; contract_register.csv; contract_document_inventory.csv; contract_commercial_protection_assessment.csv",
        "ecl_tables": "ecl_context.object; ecl_context.relationship; ecl_context.measure; ecl_commercial.contract",
        "projection_or_cube_tables": "ecl_projection.source_vendor_360",
        "gate_or_refusal": "No refusal gate; display must show synthetic/not-reviewed state and open gates.",
        "basis_rule": "Supplier identity must resolve through supplier_master; no vendor attribution by string inference.",
        "browser_proof_status": "not_started",
    },
    {
        "product_module": "Source 360",
        "page_or_cube": "Value and Sourcing Opportunities",
        "user_question": "Which commercial opportunities are visible, what value is blocked, and what evidence is required before action?",
        "deterministic_facts": "lever type, opportunity type, modeled value range, claimable value, blocked value, gate status, gate reason, affected scope, benchmark context, protection context, next evidence request",
        "source_extracts": "contract_register.csv; source_ap_po_invoice_lines.csv; source_sla_kpi_events.csv; source_market_benchmark_rates.csv; contract_commercial_protection_assessment.csv",
        "ecl_tables": "ecl_context.measure; ecl_commercial.contract; ecl_commercial.invoice_line; ecl_commercial.sla_observation",
        "projection_or_cube_tables": "ecl_projection.source_value_levers",
        "gate_or_refusal": "Rows are visible as gated opportunities. Claimable value remains zero until finance attestation and owner approval exist.",
        "basis_rule": "Opportunity ranges may use model_inferred benchmark/protection context; achieved or claimable value requires source_recorded finance confirmation plus review approval.",
        "browser_proof_status": "not_started",
    },
    {
        "product_module": "Source 360",
        "page_or_cube": "Events and Approvals",
        "user_question": "Which sourcing event and approval gates are open, who owns them, and what evidence is needed?",
        "deterministic_facts": "event stage, event status, gate status, gate reason, owner role, due date, required evidence, review event linkage",
        "source_extracts": "source_review_queue.csv",
        "ecl_tables": "ecl_source.source_record; ecl_review.review_event; ecl_commercial.contract",
        "projection_or_cube_tables": "ecl_projection.source_event_workspace",
        "gate_or_refusal": "Rows are visible as gated workflow/review items. No approval or award state may be inferred from complete data.",
        "basis_rule": "Every row must resolve to an ecl_review.review_event and a contract FK; workflow and approval state cannot be inferred from data completeness.",
        "browser_proof_status": "not_started",
    },
    {
        "product_module": "Source 360",
        "page_or_cube": "Compare",
        "user_question": "Which submitted vendor response is advantaged, what price delta exists, and what exceptions block award approval?",
        "deterministic_facts": "submitted response status, bidder vendor, response price, baseline price, savings delta, exception count, commercial/delivery/risk/overall score, rank, recommended sourcing position",
        "source_extracts": "source_vendor_response_tracker.csv; source_pricing_response_lines.csv; source_evaluation_scorecard.csv",
        "ecl_tables": "ecl_source.source_record; ecl_context.object; ecl_review.review_event; ecl_commercial.contract",
        "projection_or_cube_tables": "ecl_projection.source_event_workspace",
        "gate_or_refusal": "Compare rows are visible when submitted response and scorecard facts exist. Award approval remains outside Compare and must not be inferred from rank.",
        "basis_rule": "Vendor ranking comes from submitted response and scorecard extracts; market benchmarks can contextualize price but cannot rank vendors alone.",
        "browser_proof_status": "not_started",
    },
    {
        "product_module": "Tower",
        "page_or_cube": "Commercial action queue",
        "user_question": "Which contract actions are blocked, claimable, or require evidence before value can be counted?",
        "deterministic_facts": "commercial protection score, exit-cost exposure, notice window, shortfall exposure, rate variance, unclaimed credits, finance-confirmed value",
        "source_extracts": "source_finance_realization.csv; source_ap_po_invoice_lines.csv; source_sla_kpi_events.csv; source_market_benchmark_rates.csv; contract_commercial_protection_assessment.csv; document_clause_extractions.csv",
        "ecl_tables": "ecl_context.measure; ecl_source.document_extraction; ecl_commercial.invoice_line; ecl_commercial.sla_observation",
        "projection_or_cube_tables": "ecl_projection.tower_command_center; ecl_projection.cube_slice; ecl_projection.cube_slice_metric; ecl_projection.cube_slice_measure",
        "gate_or_refusal": "Rows stay gated when finance confirmation or owner approval is missing. Gate reason must render, not be hidden as empty value.",
        "basis_rule": "Tower may display model_inferred risk/benchmark context, but claimable value requires source_recorded finance confirmation plus review approval.",
        "browser_proof_status": "not_started",
    },
    {
        "product_module": "Home",
        "page_or_cube": "Architecture/vendor lineage context",
        "user_question": "Which applications and functions are touched by commercial contracts and managed services?",
        "deterministic_facts": "contract-to-application scope, supplier, service tower, business domain, allocation percent",
        "source_extracts": "contract_scope_application_links.csv; source_contract_scope_services.csv; contract_register.csv; supplier_master.csv",
        "ecl_tables": "ecl_context.object; ecl_context.relationship; ecl_commercial.contract; ecl_commercial.contract_scope",
        "projection_or_cube_tables": "future Home projection; current local proof records required additions",
        "gate_or_refusal": "Home architecture pages must use admission/resolver logic when claiming topology completeness. Commercial scope can show as partial until dense CMDB reconciliation completes.",
        "basis_rule": "Scope links require named application/platform objects; unresolved scope names go to dense-build required additions, not inferred joins.",
        "browser_proof_status": "not_started",
    },
    {
        "product_module": "Intelligence",
        "page_or_cube": "Commercial context pack",
        "user_question": "What cited commercial facts can the assistant use, and which facts are blocked or provisional?",
        "deterministic_facts": "contract facts, supplier facts, evidence spans, protection caveats, benchmark confidence, review state",
        "source_extracts": "contract_register.csv; contract_document_inventory.csv; document_clause_extractions.csv; source_market_benchmark_rates.csv; contract_commercial_protection_assessment.csv",
        "ecl_tables": "ecl_source.document; ecl_source.document_extraction; ecl_context.object; ecl_context.measure",
        "projection_or_cube_tables": "ecl_projection.intelligence_context_pack",
        "gate_or_refusal": "Blocked/provisional facts must remain marked; no unverified document extraction can become a client claim.",
        "basis_rule": "Only cited spans and governed source records enter context; synthetic benchmarks must remain estimated/model_inferred.",
        "browser_proof_status": "not_started",
    },
    {
        "product_module": "Cubes",
        "page_or_cube": "Source/Tower commercial cubes",
        "user_question": "How do contract value, protection, benchmark variance, SLA credits, and finance gates slice by supplier, service tower, contract, function, and period?",
        "deterministic_facts": "metric dictionary keys, measure IDs, units, source measure lineage, cube slice dimensions",
        "source_extracts": "all 12 commercial extracts",
        "ecl_tables": "ecl_context.metric_definition; ecl_context.measure; ecl_commercial.*",
        "projection_or_cube_tables": "ecl_projection.cube_manifest; ecl_projection.cube_slice; ecl_projection.cube_slice_metric; ecl_projection.cube_slice_measure",
        "gate_or_refusal": "Cube metrics must resolve through FK-backed metric definitions and measure rows; JSON is display/cache only.",
        "basis_rule": "Metric keys and measure IDs are FK-enforced; unit mismatches fail proof.",
        "browser_proof_status": "not_started",
    },
]


def write_csv(path: Path) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(ROWS[0].keys()))
        writer.writeheader()
        writer.writerows(ROWS)


def write_markdown(path: Path) -> None:
    lines = [
        "# Commercial Product Consumption Mapping",
        "",
        "Local proof artifact only. This maps the commercial source-room and ECL rows to the deterministic needs of Source 360, Tower, Home, Intelligence, and cubes. It is not product route integration or browser QA.",
        "",
        "| Product | Page/cube | User question | Facts | Source extracts | ECL/projection tables | Gate/refusal |",
        "|---|---|---|---|---|---|---|",
    ]
    for row in ROWS:
        lines.append(
            "| {product_module} | {page_or_cube} | {user_question} | {deterministic_facts} | {source_extracts} | {ecl_tables}; {projection_or_cube_tables} | {gate_or_refusal} |".format(
                **{key: value.replace("|", "/") for key, value in row.items()}
            )
        )
    lines.extend(["", "## Basis Rules", ""])
    for row in ROWS:
        lines.append(f"- **{row['product_module']} / {row['page_or_cube']}:** {row['basis_rule']}")
    lines.extend(["", "## Browser Proof", "", "All rows remain `not_started` for browser proof. This file maps deterministic supply; it does not prove a product route renders it."])
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    out_dir = args.out_dir.resolve()
    csv_path = out_dir / "commercial_product_consumption_mapping.csv"
    md_path = out_dir / "commercial_product_consumption_mapping.md"
    summary_path = out_dir / "commercial_product_consumption_mapping_summary.json"
    write_csv(csv_path)
    write_markdown(md_path)
    summary_path.write_text(
        json.dumps(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "mappings": len(ROWS),
                "products": sorted({row["product_module"] for row in ROWS}),
                "browser_proof": "not_started",
                "csv": csv_path.as_posix(),
                "markdown": md_path.as_posix(),
            },
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"csv": csv_path.as_posix(), "markdown": md_path.as_posix(), "mappings": len(ROWS)}, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
