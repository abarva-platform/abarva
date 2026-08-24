#!/usr/bin/env python3

"""Validate the dense ECL Azure load gate package.

The package is intentionally non-mutating. This validator proves the generated
artifacts are ready for gate review while still refusing Azure execution,
product route repointing, browser-proof claims, and legacy retirement.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


DEFAULT_OUT_DIR = Path("reports/ecl-dense-azure-load-gate-package-2026-08-23")

REQUIRED_FILES = {
    "run_contract": "ecl_dense_azure_load_run_contract.json",
    "readback_contract": "ecl_dense_azure_row_for_row_readback_contract.json",
    "command_plan": "ecl_dense_azure_command_plan.json",
    "gate_template": "ecl_dense_azure_load_gate_manifest.template.json",
    "checklist": "ecl_dense_azure_load_approval_checklist.json",
    "status": "ecl_dense_azure_load_gate_status.json",
    "progress": "ecl_dense_azure_execution_progress.json",
    "summary": "ecl_dense_azure_load_gate_package_summary.json",
    "report": "AZURE_LOAD_GATE_PACKAGE.md",
}

EXPECTED_LAYERS = {"source", "context", "commercial", "review", "projection", "cube"}

REQUIRED_READBACK_KEYS = {
    "source": {
        "source_record",
        "source_file",
        "document",
        "document_extraction",
        "extraction_distinct_spans",
        "client_attested_rows",
    },
    "context": {
        "object_type_catalog",
        "object",
        "application",
        "application_deployment",
        "vendor",
        "data_platform",
        "infrastructure",
        "relationship",
        "deployment_of",
        "hosted_on",
        "integrates_with",
        "metric_definition",
        "measure",
        "measure_metric_drift",
        "relationship_endpoint_drift",
    },
    "commercial": {
        "contract",
        "contract_service_line",
        "contract_scope",
        "invoice_line",
        "sla_observation",
        "contract_scope_object_drift",
        "contract_vendor_drift",
        "sla_metric_drift",
    },
    "review": {
        "review_event",
        "review_contract_subjects",
        "review_invoice_subjects",
        "review_sla_subjects",
        "review_context_pack_subjects",
        "review_contract_drift",
        "review_invoice_drift",
        "review_sla_drift",
        "review_source_record_drift",
    },
    "projection": {
        "projection_manifest",
        "home_enterprise_landscape",
        "source_contract_360",
        "source_vendor_360",
        "source_value_levers",
        "source_event_workspace",
        "tower_command_center",
        "tower_value_chain",
        "tower_evidence_queue",
        "tower_ai_portfolio",
        "intelligence_context_pack",
        "intelligence_pattern_evidence",
        "intelligence_question_context",
        "home_primary_object_drift",
        "home_refusal_without_payload",
        "home_application_count_basis_drift",
        "home_application_page_deployment_rows",
        "contract_projection_contract_drift",
        "event_review_drift",
        "event_rows_without_evidence_payload",
        "source_value_claimable_rows",
        "source_value_gated_rows",
        "tower_primary_object_drift",
        "tower_gated_without_reason",
        "tower_value_chain_gated_without_reason",
        "tower_value_chain_measure_drift",
        "tower_evidence_queue_missing_gate_payload",
        "tower_evidence_queue_measure_drift",
        "tower_ai_primary_object_drift",
        "intelligence_context_pack_drift",
        "intelligence_primary_object_drift",
        "intelligence_pattern_primary_object_drift",
        "intelligence_question_context_pack_drift",
        "value_lever_metric_drift",
        "vendor_projection_vendor_drift",
    },
    "cube": {
        "cube_manifest",
        "cube_slice",
        "cube_slice_metric",
        "cube_slice_measure",
        "cube_key_count",
        "cube_metric_drift",
        "cube_measure_drift",
        "json_metric_without_fk",
    },
}

ZERO_READBACK_KEYS = {
    "source.client_attested_rows",
    "context.measure_metric_drift",
    "context.relationship_endpoint_drift",
    "commercial.contract_scope_object_drift",
    "commercial.contract_vendor_drift",
    "commercial.sla_metric_drift",
    "review.review_contract_drift",
    "review.review_invoice_drift",
    "review.review_sla_drift",
    "review.review_source_record_drift",
    "projection.home_primary_object_drift",
    "projection.home_refusal_without_payload",
    "projection.home_application_count_basis_drift",
    "projection.home_application_page_deployment_rows",
    "projection.contract_projection_contract_drift",
    "projection.event_review_drift",
    "projection.event_rows_without_evidence_payload",
    "projection.source_value_claimable_rows",
    "projection.tower_primary_object_drift",
    "projection.tower_gated_without_reason",
    "projection.tower_value_chain_gated_without_reason",
    "projection.tower_value_chain_measure_drift",
    "projection.tower_evidence_queue_missing_gate_payload",
    "projection.tower_evidence_queue_measure_drift",
    "projection.tower_ai_primary_object_drift",
    "projection.intelligence_context_pack_drift",
    "projection.intelligence_primary_object_drift",
    "projection.intelligence_pattern_primary_object_drift",
    "projection.intelligence_question_context_pack_drift",
    "projection.value_lever_metric_drift",
    "projection.vendor_projection_vendor_drift",
    "cube.cube_metric_drift",
    "cube.cube_measure_drift",
    "cube.json_metric_without_fk",
}

ACK_KEYS = {
    "approved_for_future_aca_job_submission",
    "tenant_scope_confirmed",
    "digest_pinned_image_confirmed",
    "private_data_plane_target_confirmed",
    "idempotency_key_confirmed",
    "proof_bundle_hash_confirmed",
    "independent_readback_required",
    "no_product_route_change",
    "no_active_source_promotion",
    "human_review_after_readback_required",
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def expect(condition: bool, message: str, issues: list[str]) -> None:
    if not condition:
        issues.append(message)


def expect_no_azure(payload: dict[str, Any], label: str, issues: list[str]) -> None:
    if "actual_azure_execution" in payload:
        expect(payload.get("actual_azure_execution") is False, f"{label} must prove actual_azure_execution=false", issues)
    if "actual_readback_execution" in payload:
        expect(payload.get("actual_readback_execution") is False, f"{label} must prove actual_readback_execution=false", issues)


def validate_readback_layer(layer: str, actual: dict[str, Any], issues: list[str]) -> None:
    for key in sorted(REQUIRED_READBACK_KEYS[layer]):
        value = actual.get(key)
        expect(isinstance(value, int) and not isinstance(value, bool), f"readback.{layer}.{key} must be an integer", issues)
        if f"{layer}.{key}" in ZERO_READBACK_KEYS:
            expect(value == 0, f"readback.{layer}.{key} must be 0, got {value!r}", issues)


def validate(out_dir: Path) -> list[str]:
    issues: list[str] = []
    paths = {name: out_dir / rel for name, rel in REQUIRED_FILES.items()}
    for name, path in paths.items():
        expect(path.exists(), f"missing {name}: {path.as_posix()}", issues)
    if issues:
        return issues

    run_contract = read_json(paths["run_contract"])
    readback_contract = read_json(paths["readback_contract"])
    command_plan = read_json(paths["command_plan"])
    gate_template = read_json(paths["gate_template"])
    checklist = read_json(paths["checklist"])
    status = read_json(paths["status"])
    progress = read_json(paths["progress"])
    summary = read_json(paths["summary"])
    report = paths["report"].read_text(encoding="utf-8")

    for label, payload in [
        ("run_contract", run_contract),
        ("readback_contract", readback_contract),
        ("command_plan", command_plan),
        ("checklist", checklist),
        ("status", status),
        ("progress", progress),
        ("summary", summary),
    ]:
        expect_no_azure(payload, label, issues)

    expect(run_contract.get("status") == "planned_not_executed", "run contract must be planned_not_executed", issues)
    expect(run_contract.get("dry_run_only") is True, "run contract must remain dry_run_only", issues)
    expect(run_contract.get("mode") == "gate_package_not_executed", "run contract mode mismatch", issues)
    expect(str(run_contract.get("image_digest", "")).startswith("${"), "run contract image must be a future placeholder", issues)

    expect(readback_contract.get("status") == "contract_ready_not_executed", "readback contract must be ready but not executed", issues)
    expect(readback_contract.get("comparison_type") == "row_for_row_against_local_dense_all_layer_proof", "readback comparison type mismatch", issues)
    expectations = readback_contract.get("expected_readback_by_layer", {})
    expect(set(expectations) == EXPECTED_LAYERS, f"readback layers must be {sorted(EXPECTED_LAYERS)}", issues)
    if isinstance(expectations, dict):
        for layer in sorted(REQUIRED_READBACK_KEYS):
            layer_actual = expectations.get(layer)
            expect(isinstance(layer_actual, dict), f"readback layer {layer} missing or invalid", issues)
            if isinstance(layer_actual, dict):
                validate_readback_layer(layer, layer_actual, issues)
    expect(readback_contract.get("field_hash_required") is True, "readback must require field hashes", issues)

    dry_run_command = command_plan.get("dry_run_selected_command", [])
    future_command = command_plan.get("future_execute_command_not_run", [])
    expect(command_plan.get("command_was_executed") is False, "command plan must not execute", issues)
    expect(command_plan.get("az_invoked") is False, "command plan must not invoke az", issues)
    expect(isinstance(dry_run_command, list) and dry_run_command[:3] == ["npm", "run", "ops:aca-job"], "dry-run command must use ops:aca-job", issues)
    expect(isinstance(future_command, list) and future_command[:3] == ["npm", "run", "ops:aca-job"], "future command must use ops:aca-job", issues)
    expect("--plan-only" in dry_run_command, "dry-run selected command must include --plan-only", issues)
    expect("--plan-only" not in future_command, "future command may not include --plan-only", issues)
    expect("az" not in dry_run_command and "az" not in future_command, "commands must not call az directly", issues)

    expect(gate_template.get("approval_file_purpose") == "template_only_not_approval", "gate template purpose mismatch", issues)
    expect(gate_template.get("approved") is False, "gate template must not be approved", issues)
    acknowledgements = gate_template.get("acknowledgements", {})
    expect(set(acknowledgements) == ACK_KEYS, "gate template acknowledgements mismatch", issues)
    if isinstance(acknowledgements, dict):
        for key in ACK_KEYS:
            expect(acknowledgements.get(key) is False, f"acknowledgement {key} must be false", issues)
    readback_link = gate_template.get("readback_contract", {})
    expect(readback_link.get("path") == run_contract.get("readback_contract"), "gate/readback contract path mismatch", issues)
    expect(isinstance(readback_link.get("sha256"), str) and len(readback_link["sha256"]) == 64, "gate readback hash must be sha256", issues)

    check_rows = {row.get("name"): row for row in checklist.get("checks", [])}
    for required in ["digest_pinned_image", "private_data_plane_target", "database_secret_binding", "blob_proof_bundle_binding"]:
        expect(check_rows.get(required, {}).get("status") == "pending_future_approval", f"{required} must be pending future approval", issues)
    expect(check_rows.get("product_route_repointing", {}).get("status") == "explicitly_not_authorized", "product route change must be unauthorized", issues)
    expect(check_rows.get("legacy_retirement", {}).get("status") == "explicitly_not_authorized", "legacy retirement must be unauthorized", issues)

    expect(status.get("status") == "ready_for_explicit_future_gate_review", "status must be ready for future gate review", issues)
    expect(any(row.get("name") == "azure_execution_refused_by_design" for row in status.get("events", [])), "status must include Azure refusal event", issues)
    steps = {row.get("step"): row for row in progress.get("steps", [])}
    expect(progress.get("overall_percent_complete") == 50, "overall percent should remain 50 before Azure/load/browser gates", issues)
    for step in [1, 2, 3, 4]:
        expect(steps.get(step, {}).get("percent_complete") == 100, f"progress step {step} must be 100", issues)
    for step in [5, 6, 7]:
        expect(steps.get(step, {}).get("percent_complete") == 0, f"progress step {step} must remain 0", issues)
        expect(steps.get(step, {}).get("state") == "blocked_by_hard_gate", f"progress step {step} must be hard gated", issues)

    expect(summary.get("status") == "gate_package_ready_not_executed", "summary status mismatch", issues)
    expect(summary.get("run_contract") == paths["run_contract"].as_posix(), "summary run contract path mismatch", issues)
    expect("Actual Azure execution: `false`" in report, "report must state Azure execution false", issues)
    expect("does not load Azure" in report, "report must state non-mutating boundary", issues)
    return issues


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    issues = validate(args.out_dir)
    result = {
        "accepted": not issues,
        "checked_out_dir": args.out_dir.as_posix(),
        "issues": issues,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not issues else 1


if __name__ == "__main__":
    raise SystemExit(main())
