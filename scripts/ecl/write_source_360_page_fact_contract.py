#!/usr/bin/env python3

"""Write Source 360 page-level deterministic fact contracts.

This is a local proof artifact. It records which Source pages can be driven
from the commercial ECL slice today and which pages must stay gated until a
specific projection/builder exists. It is intentionally product-first: page
needs determine fields, not the other way around.
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_OUT_DIR = Path("outputs/ecl-commercial-contract-supply-correction-2026-08-22")

FIELDNAMES = [
    "product_module",
    "page_or_tab",
    "fact_key",
    "business_label",
    "cxo_question",
    "projection_status",
    "projection_table",
    "projection_field_path",
    "source_extracts",
    "ecl_tables",
    "basis_rule",
    "missing_data_behavior",
    "page_render_obligation",
    "next_required_builder",
    "route_status",
]

COMMON_COMMERCIAL_EXTRACTS = (
    "contract_register.csv; supplier_master.csv; contract_document_inventory.csv; "
    "document_clause_extractions.csv"
)

ROWS: list[dict[str, str]] = [
    {
        "page_or_tab": "Vendor Portfolio",
        "fact_key": "vendor_identity",
        "business_label": "Supplier identity and category",
        "cxo_question": "Which suppliers concentrate commercial exposure?",
        "projection_status": "supplied",
        "projection_table": "ecl_projection.source_vendor_360",
        "projection_field_path": "vendor_object_id; vendor_name; risk_control_json.category",
        "source_extracts": "supplier_master.csv; contract_register.csv",
        "ecl_tables": "ecl_context.object; ecl_commercial.contract",
        "basis_rule": "Supplier identity resolves through supplier_master and ecl_context.object; no string-inferred vendor attribution.",
        "missing_data_behavior": "Render supplier as unresolved with source gap; do not merge by display name.",
        "page_render_obligation": "Show vendor name, category, review state, and unresolved identity gaps.",
        "next_required_builder": "none",
        "route_status": "not_repointed",
    },
    {
        "page_or_tab": "Vendor Portfolio",
        "fact_key": "vendor_contract_exposure",
        "business_label": "Contract count and annualized spend",
        "cxo_question": "How much value is concentrated by supplier?",
        "projection_status": "supplied",
        "projection_table": "ecl_projection.source_vendor_360",
        "projection_field_path": "contract_count; annualized_spend_usd; renewal_exposure_usd",
        "source_extracts": "contract_register.csv; source_ap_po_invoice_lines.csv",
        "ecl_tables": "ecl_commercial.contract; ecl_commercial.invoice_line; ecl_context.measure",
        "basis_rule": "Spend comes from contract register and AP lines; synthetic benchmarks cannot become source-recorded spend.",
        "missing_data_behavior": "Render unknown spend as unknown, not zero; show finance review gate.",
        "page_render_obligation": "Show exposure and review state alongside concentration metrics.",
        "next_required_builder": "none",
        "route_status": "not_repointed",
    },
    {
        "page_or_tab": "Vendor Portfolio",
        "fact_key": "vendor_scope",
        "business_label": "Covered applications and functions",
        "cxo_question": "Which applications/functions depend on this supplier?",
        "projection_status": "supplied",
        "projection_table": "ecl_projection.source_vendor_360",
        "projection_field_path": "covered_object_count; covered_objects_json",
        "source_extracts": "contract_scope_application_links.csv; source_contract_scope_services.csv",
        "ecl_tables": "ecl_commercial.contract_scope; ecl_commercial.contract_service_line; ecl_context.relationship",
        "basis_rule": "Only named objects with tenant-composite FK relationships count as covered scope.",
        "missing_data_behavior": "Render unresolved scope names as required additions; do not infer from vendor name.",
        "page_render_obligation": "Separate resolved application scope from unresolved scope additions.",
        "next_required_builder": "none",
        "route_status": "not_repointed",
    },
    {
        "page_or_tab": "Vendor 360",
        "fact_key": "vendor_document_proof",
        "business_label": "Contract document proof",
        "cxo_question": "Which documents and clauses support this supplier view?",
        "projection_status": "supplied",
        "projection_table": "ecl_projection.source_vendor_360",
        "projection_field_path": "source_refs_json; gap_flags_json",
        "source_extracts": COMMON_COMMERCIAL_EXTRACTS,
        "ecl_tables": "ecl_source.document; ecl_source.document_extraction",
        "basis_rule": "Document facts cite page/span and remain unverified until human verification state changes.",
        "missing_data_behavior": "Show document gap and unverified state; no clause becomes a client claim.",
        "page_render_obligation": "Expose document count, evidence state, and open proof gaps.",
        "next_required_builder": "none",
        "route_status": "not_repointed",
    },
    {
        "page_or_tab": "Vendor 360",
        "fact_key": "vendor_weaknesses",
        "business_label": "Commercial protection weaknesses",
        "cxo_question": "Which suppliers have weak leverage or exit economics?",
        "projection_status": "supplied",
        "projection_table": "ecl_projection.source_vendor_360",
        "projection_field_path": "risk_control_json; gap_flags_json",
        "source_extracts": "contract_commercial_protection_assessment.csv; document_clause_extractions.csv",
        "ecl_tables": "ecl_context.measure; ecl_source.document_extraction",
        "basis_rule": "Protection scores are computed; clause facts should cite document spans; score itself is not document-extracted.",
        "missing_data_behavior": "Render protection as provisional when clause extraction or review is missing.",
        "page_render_obligation": "Show weakness, basis, and next evidence request.",
        "next_required_builder": "none",
        "route_status": "not_repointed",
    },
    {
        "page_or_tab": "Contract 360",
        "fact_key": "contract_header",
        "business_label": "Contract term, renewal, and value",
        "cxo_question": "What does this contract cover and when can we act?",
        "projection_status": "supplied",
        "projection_table": "ecl_projection.source_contract_360",
        "projection_field_path": "contract_name; renewal_notice_date; end_date; annualized_value_usd; total_contract_value_usd",
        "source_extracts": "contract_register.csv; source_ap_po_invoice_lines.csv",
        "ecl_tables": "ecl_commercial.contract; ecl_commercial.invoice_line",
        "basis_rule": "Contract dollars come from register/AP, not unverified document extraction.",
        "missing_data_behavior": "Unknown dates or values render as unknown with owner/finance gap.",
        "page_render_obligation": "Show term, notice, value, quality state, and review state.",
        "next_required_builder": "none",
        "route_status": "not_repointed",
    },
    {
        "page_or_tab": "Contract 360",
        "fact_key": "contract_scope",
        "business_label": "Service lines and application scope",
        "cxo_question": "Which services and systems are contractually in scope?",
        "projection_status": "supplied",
        "projection_table": "ecl_projection.source_contract_360",
        "projection_field_path": "service_lines_json; scope_json",
        "source_extracts": "source_contract_scope_services.csv; contract_scope_application_links.csv",
        "ecl_tables": "ecl_commercial.contract_service_line; ecl_commercial.contract_scope; ecl_context.relationship",
        "basis_rule": "Scope uses explicit contract/SOW links to declared objects; unresolved names stay unresolved.",
        "missing_data_behavior": "Render partial scope and required additions; never show broad supplier association as proven scope.",
        "page_render_obligation": "Separate explicit scope, unresolved scope, and missing source files.",
        "next_required_builder": "none",
        "route_status": "not_repointed",
    },
    {
        "page_or_tab": "Contract 360",
        "fact_key": "contract_performance",
        "business_label": "AP variance, SLA credits, and document proof",
        "cxo_question": "Where are recovery and performance issues evidenced?",
        "projection_status": "supplied",
        "projection_table": "ecl_projection.source_contract_360",
        "projection_field_path": "spend_summary_json; sla_summary_json; document_proof_json",
        "source_extracts": "source_ap_po_invoice_lines.csv; source_sla_kpi_events.csv; contract_document_inventory.csv; document_clause_extractions.csv",
        "ecl_tables": "ecl_commercial.invoice_line; ecl_commercial.sla_observation; ecl_source.document; ecl_source.document_extraction",
        "basis_rule": "AP/SLA amounts are source-recorded; document extraction is evidence context unless verified.",
        "missing_data_behavior": "Missing SLA extract renders as gap, not zero breaches or zero credits.",
        "page_render_obligation": "Show variance/recovery with source basis and unverified evidence warnings.",
        "next_required_builder": "none",
        "route_status": "not_repointed",
    },
    {
        "page_or_tab": "Renewal",
        "fact_key": "renewal_action_window",
        "business_label": "Notice date, spend at risk, and action state",
        "cxo_question": "Which renewals require action now?",
        "projection_status": "supplied",
        "projection_table": "ecl_projection.source_contract_360",
        "projection_field_path": "renewal_notice_date; end_date; annualized_value_usd; risk_control_json.primary_weakness",
        "source_extracts": "contract_register.csv; contract_commercial_protection_assessment.csv; document_clause_extractions.csv",
        "ecl_tables": "ecl_commercial.contract; ecl_context.measure; ecl_source.document_extraction",
        "basis_rule": "Renewal dates come from contract register and clause extraction; action status remains gated until owner review.",
        "missing_data_behavior": "Render missing notice as evidence-needed, not low risk.",
        "page_render_obligation": "Show action urgency, source basis, and missing clause/review gate.",
        "next_required_builder": "none",
        "route_status": "not_repointed",
    },
    {
        "page_or_tab": "Events",
        "fact_key": "sourcing_event_workspace",
        "business_label": "Sourcing event and incumbent context",
        "cxo_question": "What sourcing event is active and what evidence gates remain?",
        "projection_status": "supplied",
        "projection_table": "ecl_projection.source_event_workspace",
        "projection_field_path": "workspace_tab; event_stage; event_status; gate_status; gate_reason_code; due_date; evidence_needed_json; decision_context_json; next_action_json",
        "source_extracts": "source_review_queue.csv",
        "ecl_tables": "ecl_context.object; ecl_context.relationship; ecl_review.review_event",
        "basis_rule": "Events require declared review/workflow rows; do not synthesize event status from contract age.",
        "missing_data_behavior": "Render gated event rows with required evidence; no empty event list and no award recommendation.",
        "page_render_obligation": "Show event stage, owner role, due date, gate reason, and required evidence for every active event row.",
        "next_required_builder": "none",
        "route_status": "not_repointed",
    },
    {
        "page_or_tab": "Compare",
        "fact_key": "vendor_response_compare",
        "business_label": "Bid response, price deltas, and exceptions",
        "cxo_question": "Which vendor response is advantaged and why?",
        "projection_status": "supplied",
        "projection_table": "ecl_projection.source_event_workspace",
        "projection_field_path": "workspace_tab=compare; row_type=vendor_response_compare; decision_context_json.rank; decision_context_json.annual_price_usd; decision_context_json.savings_vs_baseline_usd; decision_context_json.overall_score; decision_context_json.primary_exception",
        "source_extracts": "source_vendor_response_tracker.csv; source_pricing_response_lines.csv; source_evaluation_scorecard.csv",
        "ecl_tables": "ecl_context.measure; ecl_review.review_event",
        "basis_rule": "Compare requires submitted responses and evaluation state; market benchmarks alone cannot rank vendors.",
        "missing_data_behavior": "Render response-pack gap when no submitted response or scorecard exists; do not rank from benchmark-only rows.",
        "page_render_obligation": "Show vendor, response status, price delta, rank, score, exceptions, source basis, and award-approval boundary.",
        "next_required_builder": "none",
        "route_status": "not_repointed",
    },
    {
        "page_or_tab": "Value",
        "fact_key": "commercial_value_levers",
        "business_label": "Validated value, blocked value, and leverage basis",
        "cxo_question": "What value can be counted and what remains blocked?",
        "projection_status": "supplied",
        "projection_table": "ecl_projection.source_value_levers",
        "projection_field_path": "lever_type; opportunity_title; baseline_spend_usd; estimated_value_low_usd; estimated_value_high_usd; claimable_value_usd; blocked_value_usd; value_gate_status; value_gate_reason_code; benchmark_context_json; protection_context_json",
        "source_extracts": "source_finance_realization.csv; source_ap_po_invoice_lines.csv; source_sla_kpi_events.csv; source_market_benchmark_rates.csv",
        "ecl_tables": "ecl_context.measure; ecl_commercial.invoice_line; ecl_commercial.sla_observation",
        "basis_rule": "Claimable value requires finance-confirmed source_recorded measure and review approval.",
        "missing_data_behavior": "Render zero claimable value with gate reasons when finance/owner review is absent; never total blocked value as achieved savings.",
        "page_render_obligation": "Show claimable, blocked, modeled opportunity range, benchmark/protection basis, and next evidence request separately.",
        "next_required_builder": "none",
        "route_status": "not_repointed",
    },
    {
        "page_or_tab": "Approvals",
        "fact_key": "approval_gate_queue",
        "business_label": "Review decisions and required evidence",
        "cxo_question": "Who must approve or verify the claim before action?",
        "projection_status": "supplied",
        "projection_table": "ecl_projection.source_event_workspace",
        "projection_field_path": "workspace_tab; review_event_id; gate_status; gate_reason_code; owner_role; evidence_needed_json; decision_context_json",
        "source_extracts": "source_review_queue.csv; future owner_attestation_log.csv",
        "ecl_tables": "ecl_review.review_event",
        "basis_rule": "Approval state comes from review events; product UI may not infer approval from complete data.",
        "missing_data_behavior": "Render approval queue as gated until owner/finance/legal decisions exist.",
        "page_render_obligation": "Show required approver role, gate reason, evidence needed, and no approved/claimable status until review events change.",
        "next_required_builder": "none",
        "route_status": "not_repointed",
    },
    {
        "page_or_tab": "Sourcing Opportunities",
        "fact_key": "opportunity_rules",
        "business_label": "Opportunity, value range, and affected scope",
        "cxo_question": "Where should Source act first and what evidence supports it?",
        "projection_status": "supplied",
        "projection_table": "ecl_projection.source_value_levers",
        "projection_field_path": "opportunity_type; opportunity_title; affected_scope_json; estimated_value_low_usd; estimated_value_high_usd; evidence_state; confidence; next_action_json; gap_flags_json",
        "source_extracts": "source_finance_realization.csv; contract_commercial_protection_assessment.csv; source_market_benchmark_rates.csv; source_sla_kpi_events.csv",
        "ecl_tables": "ecl_context.measure; ecl_commercial.contract; ecl_commercial.sla_observation",
        "basis_rule": "Opportunity rules may use model_inferred context, but value claimability follows Tower-compatible gates.",
        "missing_data_behavior": "Render opportunity as provisional/evidence-needed; do not rank vendors or recommend award without response/review facts.",
        "page_render_obligation": "Show opportunity, confidence/evidence state, affected apps/functions, gate reason, and next Source action.",
        "next_required_builder": "none",
        "route_status": "not_repointed",
    },
]

for row in ROWS:
    row["product_module"] = "Source 360"


def write_csv(path: Path) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(ROWS)


def write_markdown(path: Path) -> None:
    lines = [
        "# Source 360 Page Fact Contract",
        "",
        "Local proof artifact only. This is not route repointing, browser proof, or a claim that every Source page is ready. It records which Source 360 pages can be driven by the commercial ECL projection slice today and which must render a gate/refusal until a named builder exists.",
        "",
        "| Page/tab | Fact | Status | Projection field | Source extracts | Render obligation |",
        "|---|---|---|---|---|---|",
    ]
    for row in ROWS:
        lines.append(
            "| {page_or_tab} | {business_label} | {projection_status} | `{projection_table}.{projection_field_path}` | {source_extracts} | {page_render_obligation} |".format(
                **{key: value.replace("|", "/") for key, value in row.items()}
            )
        )
    lines.extend(
        [
            "",
            "## Deferred Builders",
            "",
        ]
    )
    for builder, count in sorted(Counter(row["next_required_builder"] for row in ROWS if row["next_required_builder"] != "none").items()):
        lines.append(f"- `{builder}`: {count} fact contract row(s)")
    lines.extend(
        [
            "",
            "## Boundary",
            "",
            "- Product route repointing: closed",
            "- Browser proof: not started",
            "- Azure/data-plane mutation: closed",
        ]
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def validate_rows() -> list[dict[str, str]]:
    issues: list[dict[str, str]] = []
    required_pages = {
        "Vendor Portfolio",
        "Vendor 360",
        "Contract 360",
        "Renewal",
        "Events",
        "Compare",
        "Value",
        "Approvals",
        "Sourcing Opportunities",
    }
    pages = {row["page_or_tab"] for row in ROWS}
    for page in sorted(required_pages - pages):
        issues.append({"rule_id": "missing_page_contract", "subject": page, "expected": "present", "actual": "missing"})
    for index, row in enumerate(ROWS, start=1):
        for field in FIELDNAMES:
            if not row.get(field):
                issues.append({"rule_id": "blank_field", "subject": f"row_{index}.{field}", "expected": "nonblank", "actual": ""})
        if row["projection_status"] == "supplied":
            if row["projection_field_path"] == "not_available" or row["next_required_builder"] != "none":
                issues.append(
                    {
                        "rule_id": "supplied_row_not_fully_supplied",
                        "subject": row["fact_key"],
                        "expected": "real projection field and no builder",
                        "actual": f"{row['projection_field_path']} / {row['next_required_builder']}",
                    }
                )
        elif row["projection_status"] == "missing_projection":
            if row["projection_field_path"] != "not_available" or row["next_required_builder"] == "none":
                issues.append(
                    {
                        "rule_id": "missing_projection_without_builder",
                        "subject": row["fact_key"],
                        "expected": "not_available plus named builder",
                        "actual": f"{row['projection_field_path']} / {row['next_required_builder']}",
                    }
                )
        else:
            issues.append({"rule_id": "unknown_projection_status", "subject": row["fact_key"], "expected": "supplied or missing_projection", "actual": row["projection_status"]})
    return issues


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    out_dir = args.out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    csv_path = out_dir / "source_360_page_fact_contract.csv"
    md_path = out_dir / "source_360_page_fact_contract.md"
    summary_path = out_dir / "source_360_page_fact_contract_summary.json"
    issues = validate_rows()
    write_csv(csv_path)
    write_markdown(md_path)
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "accepted": not issues,
        "issue_count": len(issues),
        "issues": issues,
        "rows": len(ROWS),
        "pages": sorted({row["page_or_tab"] for row in ROWS}),
        "supplied_rows": sum(1 for row in ROWS if row["projection_status"] == "supplied"),
        "missing_projection_rows": sum(1 for row in ROWS if row["projection_status"] == "missing_projection"),
        "route_status": "not_repointed",
        "browser_proof": "not_started",
        "csv": csv_path.as_posix(),
        "markdown": md_path.as_posix(),
    }
    summary_path.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2, sort_keys=True))
    if issues:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
