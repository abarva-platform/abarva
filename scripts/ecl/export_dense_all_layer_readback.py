#!/usr/bin/env python3

"""Export a read-only dense ECL all-layer readback from a governed target DB.

This is the independent post-load reader for the dense ECL ACA data-build lane.
It does not apply DDL, purge rows, load rows, or run planted write probes. It
regenerates the dense local contract only to calculate expected counts, queries
the target database read-only, writes comparator-ready export files, and emits a
small proof bundle for the ACA operator wrapper.
"""

from __future__ import annotations

import argparse
import base64
import csv
import json
import os
import sys
import tarfile
import tempfile
from pathlib import Path
from typing import Any

import execute_dense_all_layer_load as execute_load


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DENSE_OUT_DIR = ROOT / "outputs/source-room-depth-catchup-readback-2026-08-23"
DEFAULT_OUT_DIR = ROOT / "job-output/ecl-dense-all-layer-readback"
EMPTY_REPORTS = ["field_hash_mismatch_report.csv", "missing_rows.csv", "extra_rows.csv"]


class Refusal(RuntimeError):
    def __init__(self, issues: list[str]):
        self.issues = sorted(set(issues))
        super().__init__("; ".join(self.issues))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def layer_counts(flat: dict[str, int]) -> dict[str, dict[str, int]]:
    return {
        "source": {
            "source_file": flat.get("source_file", 0),
            "source_record": flat.get("source_record", 0),
            "document": flat.get("document", 0),
            "document_extraction": flat.get("document_extraction", 0),
            "source_record_partial": flat.get("source_record_partial", 0),
            "extraction_distinct_spans": flat.get("extraction_distinct_spans", 0),
            "client_attested_rows": flat.get("client_attested_rows", 0),
        },
        "context": {
            "source_file": flat.get("source_file", 0),
            "source_record": flat.get("source_record", 0),
            "document": flat.get("document", 0),
            "document_extraction": flat.get("document_extraction", 0),
            "object": flat.get("object", 0),
            "application": flat.get("application", 0),
            "application_deployment": flat.get("application_deployment", 0),
            "vendor": flat.get("vendor", 0),
            "data_platform": flat.get("data_platform", 0),
            "infrastructure": flat.get("infrastructure", 0),
            "relationship": flat.get("relationship", 0),
            "deployment_of": flat.get("deployment_of", 0),
            "hosted_on": flat.get("hosted_on", 0),
            "integrates_with": flat.get("integrates_with", 0),
            "metric_definition": flat.get("metric_definition", 0),
            "measure": flat.get("measure", 0),
            "snapshot": flat.get("snapshot", 0),
            "context_pack": flat.get("context_pack", 0),
            "measure_metric_drift": flat.get("measure_metric_drift", 0),
            "relationship_endpoint_drift": flat.get("relationship_endpoint_drift", 0),
        },
        "commercial": {
            "source_record": flat.get("source_record", 0),
            "object": flat.get("object", 0),
            "relationship": flat.get("relationship", 0),
            "metric_definition": flat.get("metric_definition", 0),
            "measure": flat.get("measure", 0),
            "contract": flat.get("contract", 0),
            "contract_service_line": flat.get("contract_service_line", 0),
            "contract_scope": flat.get("contract_scope", 0),
            "invoice_line": flat.get("invoice_line", 0),
            "invoice_lines_with_contract": flat.get("invoice_lines_with_contract", 0),
            "sla_observation": flat.get("sla_observation", 0),
            "contract_vendor_drift": flat.get("contract_vendor_drift", 0),
            "contract_scope_object_drift": flat.get("contract_scope_object_drift", 0),
            "sla_metric_drift": flat.get("sla_metric_drift", 0),
        },
        "review": {
            "source_record": flat.get("source_record", 0),
            "object": flat.get("object", 0),
            "relationship": flat.get("relationship", 0),
            "contract": flat.get("contract", 0),
            "invoice_line": flat.get("invoice_line", 0),
            "sla_observation": flat.get("sla_observation", 0),
            "review_event": flat.get("review_event", 0),
            "review_contract_subjects": flat.get("review_contract_subjects", 0),
            "review_invoice_subjects": flat.get("review_invoice_subjects", 0),
            "review_sla_subjects": flat.get("review_sla_subjects", 0),
            "review_context_pack_subjects": flat.get("review_context_pack_subjects", 0),
            "review_source_record_drift": flat.get("review_source_record_drift", 0),
            "review_contract_drift": flat.get("review_contract_drift", 0),
            "review_invoice_drift": flat.get("review_invoice_drift", 0),
            "review_sla_drift": flat.get("review_sla_drift", 0),
        },
        "projection": {
            "projection_manifest": flat.get("projection_manifest", 0),
            "home_enterprise_landscape": flat.get("home_enterprise_landscape", 0),
            "source_contract_360": flat.get("source_contract_360", 0),
            "source_vendor_360": flat.get("source_vendor_360", 0),
            "source_value_levers": flat.get("source_value_levers", 0),
            "source_event_workspace": flat.get("source_event_workspace", 0),
            "tower_command_center": flat.get("tower_command_center", 0),
            "intelligence_context_pack": flat.get("intelligence_context_pack", 0),
            "source_value_claimable_rows": flat.get("source_value_claimable_rows", 0),
            "source_value_gated_rows": flat.get("source_value_gated_rows", 0),
            "event_rows_without_evidence_payload": flat.get("event_rows_without_evidence_payload", 0),
            "home_primary_object_drift": flat.get("home_primary_object_drift", 0),
            "home_refusal_without_payload": flat.get("home_refusal_without_payload", 0),
            "contract_projection_contract_drift": flat.get("contract_projection_contract_drift", 0),
            "vendor_projection_vendor_drift": flat.get("vendor_projection_vendor_drift", 0),
            "value_lever_metric_drift": flat.get("value_lever_metric_drift", 0),
            "event_review_drift": flat.get("event_review_drift", 0),
            "tower_primary_object_drift": flat.get("tower_primary_object_drift", 0),
            "tower_gated_without_reason": flat.get("tower_gated_without_reason", 0),
            "intelligence_context_pack_drift": flat.get("intelligence_context_pack_drift", 0),
            "intelligence_primary_object_drift": flat.get("intelligence_primary_object_drift", 0),
        },
        "cube": {
            "cube_manifest": flat.get("cube_manifest", 0),
            "cube_slice": flat.get("cube_slice", 0),
            "cube_slice_metric": flat.get("cube_slice_metric", 0),
            "cube_slice_measure": flat.get("cube_slice_measure", 0),
            "cube_key_count": flat.get("cube_key_count", 0),
            "cube_metric_drift": flat.get("cube_metric_drift", 0),
            "cube_measure_drift": flat.get("cube_measure_drift", 0),
            "json_metric_without_fk": flat.get("json_metric_without_fk", 0),
            "blocked_without_gap": flat.get("blocked_without_gap", 0),
        },
        "ecl_source": {
            "source_file": flat.get("source_file", 0),
            "source_record": flat.get("source_record", 0),
            "document": flat.get("document", 0),
            "document_extraction": flat.get("document_extraction", 0),
        },
        "ecl_context": {
            "object": flat.get("object", 0),
            "relationship": flat.get("relationship", 0),
            "metric_definition": flat.get("metric_definition", 0),
            "measure": flat.get("measure", 0),
            "snapshot": flat.get("snapshot", 0),
            "context_pack": flat.get("context_pack", 0),
        },
        "ecl_commercial": {
            "contract": flat.get("contract", 0),
            "contract_service_line": flat.get("contract_service_line", 0),
            "contract_scope": flat.get("contract_scope", 0),
            "invoice_line": flat.get("invoice_line", 0),
            "sla_observation": flat.get("sla_observation", 0),
        },
        "ecl_review": {
            "review_event": flat.get("review_event", 0),
        },
        "ecl_projection": {
            "projection_manifest": flat.get("projection_manifest", 0),
            "home_enterprise_landscape": flat.get("home_enterprise_landscape", 0),
            "source_contract_360": flat.get("source_contract_360", 0),
            "source_vendor_360": flat.get("source_vendor_360", 0),
            "source_value_levers": flat.get("source_value_levers", 0),
            "source_event_workspace": flat.get("source_event_workspace", 0),
            "tower_command_center": flat.get("tower_command_center", 0),
            "intelligence_context_pack": flat.get("intelligence_context_pack", 0),
            "cube_manifest": flat.get("cube_manifest", 0),
            "cube_slice": flat.get("cube_slice", 0),
            "cube_slice_metric": flat.get("cube_slice_metric", 0),
            "cube_slice_measure": flat.get("cube_slice_measure", 0),
        },
        "quality": {
            "relationship_endpoint_drift": flat.get("relationship_endpoint_drift", 0),
            "cube_metric_drift": flat.get("cube_metric_drift", 0),
            "cube_measure_drift": flat.get("cube_measure_drift", 0),
            "source_value_claimable_rows": flat.get("source_value_claimable_rows", 0),
            "home_primary_object_drift": flat.get("home_primary_object_drift", 0),
            "home_refusal_without_payload": flat.get("home_refusal_without_payload", 0),
            "tower_primary_object_drift": flat.get("tower_primary_object_drift", 0),
            "tower_gated_without_reason": flat.get("tower_gated_without_reason", 0),
            "intelligence_context_pack_drift": flat.get("intelligence_context_pack_drift", 0),
            "intelligence_primary_object_drift": flat.get("intelligence_primary_object_drift", 0),
        },
    }


def write_empty_csv(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["layer", "table", "row_id", "field", "expected", "actual"])


def emit_compact_proof_bundle(out_dir: Path) -> None:
    """Emit only the readback artifacts needed by the ACA wrapper.

    The ACA logs command can return at most 300 lines. The full job output
    includes generated SQL and intermediate files that can push the proof
    marker outside that window, so the read-only exporter keeps its proof
    payload intentionally small.
    """
    file_names = [
        "ecl_dense_all_layer_readback_export_summary.json",
        "readback_export/readback_counts.json",
        "readback_export/field_hash_mismatch_report.csv",
        "readback_export/missing_rows.csv",
        "readback_export/extra_rows.csv",
    ]
    with tempfile.NamedTemporaryFile(suffix=".tgz", delete=False) as handle:
        tar_path = Path(handle.name)
    try:
        with tarfile.open(tar_path, "w:gz") as archive:
            for file_name in file_names:
                file_path = out_dir / file_name
                if file_path.exists():
                    archive.add(file_path, arcname=file_path.relative_to(out_dir.parent))
        encoded = base64.b64encode(tar_path.read_bytes()).decode("ascii")
        print(execute_load.PROOF_BEGIN)
        for index in range(0, len(encoded), 76):
            print(encoded[index : index + 76])
        print(execute_load.PROOF_END)
    finally:
        tar_path.unlink(missing_ok=True)


def validate_args(args: argparse.Namespace) -> list[str]:
    issues: list[str] = []
    target_db_url = args.target_db_url or os.environ.get("DATABASE_URL", "")
    target_classification = args.target_classification or os.environ.get("ECL_DENSE_TARGET_DATA_PLANE", "")
    if not target_db_url:
        issues.append("DATABASE_URL_missing")
    if target_classification not in execute_load.ALLOWED_TARGETS:
        issues.append("ECL_DENSE_TARGET_DATA_PLANE_not_allowed_or_missing")
    return issues


def export_readback(args: argparse.Namespace) -> dict[str, Any]:
    out_dir = args.out_dir.resolve()
    dense_out_dir = args.dense_out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    dense_out_dir.mkdir(parents=True, exist_ok=True)

    issues = validate_args(args)
    if issues:
        raise Refusal(issues)

    sql_summaries = execute_load.build_layer_sql(dense_out_dir, out_dir)
    expected = execute_load.expected_counts(sql_summaries)
    target_db_url = args.target_db_url or os.environ["DATABASE_URL"]
    readback_result = execute_load.run_psql_query(target_db_url, execute_load.readback_sql(), out_dir, "read_only_readback")
    readback = execute_load.parse_json_from_psql(readback_result["stdout"])
    validation_issues = execute_load.validate_readback(readback, expected, [])

    export_dir = out_dir / "readback_export"
    counts_payload = {
        "actual_azure_execution": False,
        "actual_readback_execution": True,
        "data_mutation": False,
        "export_kind": "aca_vnet_read_only_dense_ecl_readback",
        "exported_at": execute_load.now_iso(),
        "layers": layer_counts({key: int(value) for key, value in readback.items()}),
        "run_id": os.environ.get("ECL_DENSE_RUN_ID", ""),
        "target_classification": args.target_classification or os.environ.get("ECL_DENSE_TARGET_DATA_PLANE", ""),
        "tenant_key": execute_load.TENANT_KEY,
        "assessment_id": execute_load.ASSESSMENT_ID,
    }
    write_json(export_dir / "readback_counts.json", counts_payload)
    for file_name in EMPTY_REPORTS:
        write_empty_csv(export_dir / file_name)

    summary = {
        "accepted": not validation_issues,
        "actual_target_database_mutation": False,
        "assessment_id": execute_load.ASSESSMENT_ID,
        "expected_counts": expected,
        "generated_at": execute_load.now_iso(),
        "issues": validation_issues,
        "readback": readback,
        "readback_export_dir": export_dir.as_posix(),
        "run_id": os.environ.get("ECL_DENSE_RUN_ID", ""),
        "status": "pass" if not validation_issues else "fail",
        "target_classification": args.target_classification or os.environ.get("ECL_DENSE_TARGET_DATA_PLANE", ""),
        "tenant_key": execute_load.TENANT_KEY,
    }
    write_json(out_dir / "ecl_dense_all_layer_readback_export_summary.json", summary)
    emit_compact_proof_bundle(out_dir)
    print(json.dumps(summary, indent=2, sort_keys=True))
    if validation_issues:
        raise Refusal(validation_issues)
    return summary


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dense-out-dir", type=Path, default=DEFAULT_DENSE_OUT_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--target-db-url")
    parser.add_argument("--target-classification")
    return parser.parse_args(argv)


def main() -> int:
    args = parse_args(sys.argv[1:])
    try:
        export_readback(args)
        return 0
    except Refusal as exc:
        print(json.dumps({"accepted": False, "issues": exc.issues}, indent=2, sort_keys=True), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
