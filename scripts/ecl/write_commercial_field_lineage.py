#!/usr/bin/env python3

"""Write field-level lineage for the commercial source-room ECL slice."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


DEFAULT_SOURCE_ROOM = Path(
    "outputs/ecl-commercial-contract-supply-correction-2026-08-22/source_room/SP08_Vendor_Contract"
)
DEFAULT_OUT_DIR = Path("outputs/ecl-commercial-contract-supply-correction-2026-08-22")

PRODUCTS = "Source 360; Tower; commercial cubes"

PROMOTED_FIELDS = {
    "contract_register.csv": {
        "contract_id": [("ecl_commercial.contract", "contract_key"), ("ecl_context.object", "native_key")],
        "vendor_parent_id": [("ecl_context.object", "native_key"), ("ecl_context.relationship", "to_object_id via supplier lookup")],
        "supplier_legal_name": [("ecl_context.object", "display_name"), ("ecl_projection.source_contract_360", "vendor_name")],
        "contract_name": [("ecl_commercial.contract", "contract_name"), ("ecl_projection.source_contract_360", "contract_name")],
        "category": [("ecl_commercial.contract", "commercial_category"), ("ecl_projection.source_vendor_360", "category_json")],
        "annual_value_usd": [("ecl_commercial.contract", "annualized_value_usd"), ("ecl_context.measure", "annual_contract_value_usd"), ("ecl_projection.source_value_levers", "baseline_spend_usd")],
        "committed_value_usd": [("ecl_commercial.contract", "total_contract_value_usd"), ("ecl_context.measure", "committed_contract_value_usd")],
        "effective_date": [("ecl_commercial.contract", "effective_date")],
        "expiration_date": [("ecl_commercial.contract", "expiration_date")],
        "notice_deadline": [("ecl_commercial.contract", "renewal_notice_date")],
        "review_state": [("ecl_commercial.contract", "review_state")],
    },
    "supplier_master.csv": {
        "vendor_parent_id": [("ecl_context.object", "native_key")],
        "supplier_id": [("ecl_source.source_record", "payload_json.supplier_id"), ("ecl_context.object", "attributes_json.supplier_id")],
        "supplier_legal_name": [("ecl_context.object", "display_name"), ("ecl_projection.source_vendor_360", "vendor_name")],
        "supplier_category": [("ecl_context.object", "domain")],
        "supplier_status": [("ecl_context.object", "lifecycle_status")],
        "review_state": [("ecl_context.object", "review_state")],
    },
    "contract_document_inventory.csv": {
        "contract_id": [("ecl_source.document", "contract linkage via source_record"), ("ecl_projection.source_contract_360", "document_proof_json")],
        "document_id": [("ecl_source.document", "document_key"), ("ecl_source.document_extraction", "document_id FK")],
        "document_role": [("ecl_source.document", "document_type")],
        "source_file_path": [("ecl_source.document", "storage_uri")],
        "sha256": [("ecl_source.document", "document_hash")],
        "review_state": [("ecl_source.document", "review_state")],
    },
    "document_clause_extractions.csv": {
        "contract_id": [("ecl_source.document_extraction", "contract lineage via source_record"), ("ecl_context.measure", "contract-scoped measure lookup")],
        "document_id": [("ecl_source.document_extraction", "document_id FK")],
        "concept_ref": [("ecl_source.document_extraction", "extraction_key"), ("ecl_context.measure", "metric_key for protection clause facts")],
        "source_page": [("ecl_source.document_extraction", "page_number")],
        "span_start": [("ecl_source.document_extraction", "span_start")],
        "span_end": [("ecl_source.document_extraction", "span_end")],
        "extracted_text": [("ecl_source.document_extraction", "extracted_text")],
        "confidence": [("ecl_source.document_extraction", "confidence_score")],
        "review_state": [("ecl_source.document_extraction", "human_verification_state")],
    },
    "source_contract_scope_services.csv": {
        "contract_id": [("ecl_commercial.contract_service_line", "contract_id FK")],
        "service_tower_id": [("ecl_commercial.contract_service_line", "service_line_key")],
        "service_tower": [("ecl_commercial.contract_service_line", "service_line_name")],
        "process_name": [("ecl_commercial.contract_service_line", "description_json.process_name")],
        "system_of_record": [("ecl_commercial.contract_service_line", "description_json.system_of_record")],
        "review_state": [("ecl_commercial.contract_service_line", "review_state")],
    },
    "contract_scope_application_links.csv": {
        "contract_id": [("ecl_commercial.contract_scope", "contract_id FK")],
        "scope_type": [("ecl_commercial.contract_scope", "scope_type")],
        "application_name": [("ecl_context.object", "display_name lookup"), ("ecl_commercial.contract_scope", "scoped_object_id FK")],
        "business_domain": [("ecl_projection.source_contract_360", "scope_json.business_domain")],
        "allocation_percent": [("ecl_commercial.contract_scope", "allocation_percent"), ("ecl_projection.source_value_levers", "affected_scope_json.allocation_percent")],
        "review_state": [("ecl_commercial.contract_scope", "review_state")],
    },
    "source_contract_pricing_rate_cards.csv": {
        "contract_id": [("ecl_commercial.contract_service_line", "contract_id FK"), ("ecl_context.measure", "pricing measure subject")],
        "pricing_line_id": [("ecl_context.measure", "attributes_json.pricing_line_id")],
        "service_tower_id": [("ecl_commercial.contract_service_line", "service_line_key lookup")],
        "annual_value_usd": [("ecl_context.measure", "rate_card_annual_value_usd")],
        "unit_price_usd": [("ecl_context.measure", "attributes_json.unit_price_usd")],
        "uplift_cap_pct": [("ecl_context.measure", "attributes_json.uplift_cap_pct")],
        "review_state": [("ecl_context.measure", "review_state")],
    },
    "source_market_benchmark_rates.csv": {
        "contract_id": [("ecl_context.measure", "contract-scoped benchmark measure subject"), ("ecl_projection.source_contract_360", "spend_summary_json.market_benchmark")],
        "service_tower_id": [("ecl_context.measure", "attributes_json.service_tower_id")],
        "benchmark_category": [("ecl_context.measure", "attributes_json.benchmark_category")],
        "contract_rate_annual_usd": [("ecl_context.measure", "attributes_json.contract_rate_annual_usd")],
        "market_median_annual_usd": [("ecl_context.measure", "attributes_json.market_median_annual_usd")],
        "market_variance_usd": [("ecl_context.measure", "market_benchmark_variance_usd"), ("ecl_projection.source_value_levers", "benchmark_context_json.market_benchmark_variance_usd")],
        "market_variance_pct": [("ecl_context.measure", "market_benchmark_variance_percent"), ("ecl_projection.source_value_levers", "benchmark_context_json.market_benchmark_variance_percent")],
        "benchmark_dataset_id": [("ecl_context.measure", "attributes_json.benchmark_dataset_id")],
        "benchmark_confidence": [("ecl_context.measure", "attributes_json.benchmark_confidence")],
        "benchmark_generation_basis": [("ecl_context.measure", "attributes_json.benchmark_generation_basis")],
        "review_state": [("ecl_context.measure", "review_state")],
    },
    "source_ap_po_invoice_lines.csv": {
        "contract_id": [("ecl_commercial.invoice_line", "contract_id FK")],
        "supplier_id": [("ecl_commercial.invoice_line", "attributes_json.supplier_id")],
        "invoice_line_id": [("ecl_commercial.invoice_line", "invoice_line_key")],
        "service_period": [("ecl_commercial.invoice_line", "service_period")],
        "invoice_amount_usd": [("ecl_commercial.invoice_line", "invoice_amount_usd"), ("ecl_context.measure", "invoice_amount_usd"), ("ecl_projection.source_value_levers", "next_action_json evidence basis")],
        "contract_rate_amount_usd": [("ecl_commercial.invoice_line", "contract_rate_amount_usd")],
        "variance_amount_usd": [("ecl_commercial.invoice_line", "variance_amount_usd"), ("ecl_context.measure", "invoice_variance_usd")],
        "credit_linkage_state": [("ecl_commercial.invoice_line", "attributes_json.credit_linkage_state")],
        "review_state": [("ecl_commercial.invoice_line", "review_state")],
    },
    "source_sla_kpi_events.csv": {
        "contract_id": [("ecl_commercial.sla_observation", "contract_id FK")],
        "service_tower_id": [("ecl_commercial.sla_observation", "service_line_id lookup")],
        "event_date": [("ecl_commercial.sla_observation", "observation_date")],
        "sla_name": [("ecl_commercial.sla_observation", "sla_key")],
        "breach_state": [("ecl_commercial.sla_observation", "breach_state")],
        "service_credits_earned_usd": [("ecl_commercial.sla_observation", "credit_earned_usd"), ("ecl_context.measure", "service_credit_earned_usd")],
        "service_credits_claimed_usd": [("ecl_commercial.sla_observation", "credit_claimed_usd"), ("ecl_context.measure", "service_credit_claimed_usd")],
        "review_state": [("ecl_commercial.sla_observation", "review_state")],
    },
    "source_finance_realization.csv": {
        "contract_id": [("ecl_context.measure", "contract-scoped measure subject")],
        "locked_baseline_usd": [("ecl_context.measure", "locked_baseline_usd")],
        "approved_value_usd": [("ecl_context.measure", "approved_value_usd")],
        "vendor_cost_usd": [("ecl_context.measure", "vendor_cost_usd")],
        "finance_confirmed_value_usd": [("ecl_context.measure", "finance_confirmed_value_usd")],
        "review_state": [("ecl_context.measure", "review_state")],
    },
    "contract_commercial_protection_assessment.csv": {
        "contract_id": [("ecl_context.measure", "contract-scoped measure subject"), ("ecl_projection.source_contract_360", "spend_summary_json")],
        "protection_score": [("ecl_context.measure", "commercial_protection_score"), ("ecl_projection.cube_slice_metric", "metric_key"), ("ecl_projection.source_value_levers", "protection_context_json.commercial_protection_score")],
        "notice_window_days": [("ecl_context.measure", "notice_window_days"), ("ecl_projection.cube_slice_metric", "metric_key"), ("ecl_projection.source_value_levers", "protection_context_json.notice_window_days")],
        "estimated_tfc_cost_usd": [("ecl_context.measure", "estimated_tfc_cost_usd"), ("ecl_projection.cube_slice_metric", "metric_key"), ("ecl_projection.source_value_levers", "protection_context_json.estimated_tfc_cost_usd")],
        "minimum_commitment_usd": [("ecl_context.measure", "minimum_commitment_usd"), ("ecl_projection.source_value_levers", "protection_context_json.minimum_commitment_usd")],
        "modeled_shortfall_exposure_usd": [("ecl_context.measure", "modeled_shortfall_exposure_usd"), ("ecl_projection.cube_slice_metric", "metric_key"), ("ecl_projection.source_value_levers", "protection_context_json.modeled_shortfall_exposure_usd")],
        "primary_weakness": [("ecl_projection.source_contract_360", "risk_control_json.primary_weakness"), ("ecl_projection.tower_command_center", "gate_reason_json"), ("ecl_projection.source_value_levers", "lever_type and opportunity_type derivation")],
        "review_state": [("ecl_context.measure", "review_state")],
    },
    "source_review_queue.csv": {
        "review_event_key": [("ecl_review.review_event", "native review key"), ("ecl_projection.source_event_workspace", "event_key")],
        "contract_id": [("ecl_review.review_event", "subject_contract_id FK"), ("ecl_projection.source_event_workspace", "contract_id FK")],
        "workspace_tab": [("ecl_projection.source_event_workspace", "workspace_tab")],
        "event_stage": [("ecl_projection.source_event_workspace", "event_stage")],
        "event_status": [("ecl_projection.source_event_workspace", "event_status")],
        "gate_status": [("ecl_projection.source_event_workspace", "gate_status")],
        "gate_reason_code": [("ecl_projection.source_event_workspace", "gate_reason_code")],
        "gate_reason_detail": [("ecl_review.review_event", "notes"), ("ecl_projection.source_event_workspace", "gate_reason_detail")],
        "owner_role": [("ecl_review.review_event", "reviewer_role"), ("ecl_projection.source_event_workspace", "owner_role")],
        "due_date": [("ecl_projection.source_event_workspace", "due_date")],
        "evidence_needed": [("ecl_projection.source_event_workspace", "evidence_needed_json")],
        "review_event_type": [("ecl_review.review_event", "review_event_type")],
        "decision_basis": [("ecl_review.review_event", "decision_basis"), ("ecl_projection.source_event_workspace", "decision_context_json.decision_basis")],
        "review_state": [("ecl_projection.source_event_workspace", "decision_context_json.review_state")],
    },
}


def headers(path: Path) -> list[str]:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.reader(handle)
        return next(reader)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-room", type=Path, default=DEFAULT_SOURCE_ROOM)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()

    source_room = args.source_room.resolve()
    out_dir = args.out_dir.resolve()
    rows: list[dict[str, str]] = []
    for csv_path in sorted((source_room / "extracts").glob("*.csv")):
        file_name = csv_path.name
        promoted = PROMOTED_FIELDS.get(file_name, {})
        for source_field in headers(csv_path):
            rows.append(
                {
                    "source_file": file_name,
                    "source_field": source_field,
                    "target_schema": "ecl_source",
                    "target_table": "source_record",
                    "target_field": f"payload_json.{source_field}",
                    "mapping_type": "preserve",
                    "transformation": "verbatim source payload preservation",
                    "product_consumers": "audit; adapters",
                }
            )
            for target_table, target_field in promoted.get(source_field, []):
                schema, table = target_table.split(".", 1)
                rows.append(
                    {
                        "source_file": file_name,
                        "source_field": source_field,
                        "target_schema": schema,
                        "target_table": table,
                        "target_field": target_field,
                        "mapping_type": "promote",
                        "transformation": "normalized by commercial ECL builder",
                        "product_consumers": PRODUCTS,
                    }
                )
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "commercial_contract_supply_field_lineage.csv"
    with out_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "source_file",
                "source_field",
                "target_schema",
                "target_table",
                "target_field",
                "mapping_type",
                "transformation",
                "product_consumers",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)
    print(f"{out_path.as_posix()} rows={len(rows)}")


if __name__ == "__main__":
    main()
