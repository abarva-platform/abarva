#!/usr/bin/env python3

"""Write the ECL product browser QA gate package.

This package prepares future browser QA acceptance criteria for product routes.
It does not repoint routes, start a browser, deploy, or claim live proof.
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT_DIR = ROOT / "reports/ecl-product-browser-qa-gate-package-2026-08-23"
OPERATOR_STATUS = ROOT / "outputs/ecl-no-stop-execution-run/operator-status.json"
POST_QUEUE_PROOF = ROOT / "reports/ecl-dense-azure-load-gate-package-2026-08-23/ecl_dense_azure_gate_local_proof_summary.json"
READBACK_COMPARE = ROOT / "reports/ecl-dense-azure-readback-compare-2026-08-23/readback_compare_summary.json"
READBACK_NEGATIVE = ROOT / "reports/ecl-dense-azure-readback-compare-negative-2026-08-23/readback_compare_expected_failure_summary.json"
MIN_ACTUAL_READBACK_TABLES = 24
ACTUAL_READBACK_COMPARE_ENV = "ECL_ACA_READBACK_COMPARE_PATH"
ACTUAL_READBACK_EXPORT_SUMMARY_ENV = "ECL_ACA_READBACK_EXPORT_SUMMARY_PATH"
QUALITY_ZERO_CHECKS = (
    "relationship_endpoint_drift",
    "cube_metric_drift",
    "cube_measure_drift",
    "home_application_count_basis_drift",
    "home_application_page_deployment_rows",
    "source_value_claimable_rows",
)


PRODUCT_SURFACES = [
    {
        "product": "Source",
        "future_routes": [
            "/source/contracts/[contractId]",
            "/source/vendors/[vendorId]",
            "/source/events/[eventId]",
        ],
        "required_assertions": [
            "contract_360_rows_match_projection_readback",
            "vendor_360_rows_match_projection_readback",
            "contract_scope_links_render_named_applications_and_functions",
            "value_levers_show_gate_reason_when_not_claimable",
            "document_citations_show_page_span_and_verification_state",
            "known_gaps_render_as_gaps_not_zeroes",
            "no_builder_vocabulary_visible_to_client",
            "no_synthetic_directional_benchmark_rendered_as_source_recorded",
        ],
    },
    {
        "product": "Home",
        "future_routes": [
            "/home/preview",
            "/home/preview?tab=architecture",
            "/home/preview?tab=data-flow",
        ],
        "required_assertions": [
            "home_counts_match_projection_or_refusal_payload",
            "architecture_view_uses_admission_gate_result",
            "data_flow_view_uses_admission_gate_result",
            "refused_views_render_failed_rule_measurement_and_evidence_needed",
            "no_partial_topology_renders_as_complete_architecture",
            "visual_layout_has_no_overlap_or_empty_striped_tiles",
            "executive_text_does_not_expose_builder_terms",
        ],
    },
    {
        "product": "Tower",
        "future_routes": [
            "/tower",
            "/tower/command-center",
            "/tower/value-evidence",
        ],
        "required_assertions": [
            "command_center_metrics_match_cube_and_projection_readback",
            "blocked_value_items_carry_gate_reason",
            "unverified_extractions_do_not_back_dollar_claims",
            "claimable_vs_gated_counts_render_with_reason",
            "budget_and_value_measures_preserve_basis_and_review_state",
            "no_zero_substitution_for_unknown_values",
        ],
    },
    {
        "product": "Intelligence",
        "future_routes": [
            "/intelligence",
            "/intelligence/context-pack",
        ],
        "required_assertions": [
            "context_pack_rows_match_projection_readback",
            "agent_context_uses_governed_bundle_only",
            "blocked_context_objects_are_not_sent_to_model",
            "citations_render_source_record_or_document_basis",
            "basis_quality_and_review_state_are_visible_in_evidence_panel",
            "no_raw_context_or_unindexed_claims_are_used",
        ],
    },
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def read_json_if_exists(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def repo_relative(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return path.resolve().as_posix()


def newest_existing(paths: list[Path]) -> Path | None:
    existing = [path for path in paths if path.exists()]
    if not existing:
        return None
    return max(existing, key=lambda path: (path.stat().st_mtime_ns, path.as_posix()))


def discover_json_path(*, env_var: str, patterns: tuple[str, ...]) -> Path | None:
    env_value = os.environ.get(env_var)
    if env_value:
        env_path = Path(env_value).expanduser()
        if env_path.exists():
            return env_path

    search_roots = [
        ROOT,
        ROOT.parent / "ecl-aca-execute",
    ]
    candidates: list[Path] = []
    for search_root in search_roots:
        for pattern in patterns:
            candidates.extend(search_root.glob(pattern))
    return newest_existing(candidates)


def actual_readback_proof() -> dict[str, Any]:
    compare_path = discover_json_path(
        env_var=ACTUAL_READBACK_COMPARE_ENV,
        patterns=("reports/ecl-dense-aca-readback-direct-compare-*/readback_direct_compare_summary.json",),
    )
    export_summary_path = discover_json_path(
        env_var=ACTUAL_READBACK_EXPORT_SUMMARY_ENV,
        patterns=(
            "reports/ecl-dense-aca-job-readback-*/proof/ecl-dense-all-layer-readback/ecl_dense_all_layer_readback_export_summary.json",
        ),
    )
    compare = read_json_if_exists(compare_path) if compare_path else {}
    export_summary = read_json_if_exists(export_summary_path) if export_summary_path else {}
    readback_counts = export_summary.get("readback", {})
    quality_zero = compare.get("quality_zero_checks", {})
    if not isinstance(quality_zero, dict) or not quality_zero:
        quality_zero = {
            check: readback_counts.get(check)
            for check in QUALITY_ZERO_CHECKS
            if check in readback_counts
        }
    issues: list[str] = []

    if not compare_path:
        issues.append("missing actual ACA direct readback compare summary")
    if not export_summary_path:
        issues.append("missing actual ACA readback export summary")
    if compare.get("accepted") is not True:
        issues.append("direct readback compare is not accepted")
    if compare.get("issues") not in ([], None):
        issues.append("direct readback compare has issues")
    if int(compare.get("tables_compared", 0) or 0) < MIN_ACTUAL_READBACK_TABLES:
        issues.append("direct readback compare table count is below the ECL minimum")
    for check in QUALITY_ZERO_CHECKS:
        if quality_zero.get(check) != 0:
            issues.append(f"{check} is not zero in direct readback compare")
    if export_summary.get("accepted") is not True:
        issues.append("readback export summary is not accepted")
    if export_summary.get("status") != "pass":
        issues.append("readback export summary status is not pass")
    if export_summary.get("issues") not in ([], None):
        issues.append("readback export summary has issues")
    if export_summary.get("actual_target_database_mutation") is not False:
        issues.append("readback proof must be read-only")

    return {
        "accepted": not issues,
        "issues": issues,
        "compare": repo_relative(compare_path) if compare_path else None,
        "export_summary": repo_relative(export_summary_path) if export_summary_path else None,
        "run_id": export_summary.get("run_id"),
        "tables_compared": compare.get("tables_compared"),
        "quality_zero_checks": quality_zero,
        "tenant_key": export_summary.get("tenant_key"),
        "target_classification": export_summary.get("target_classification"),
    }


def prerequisites() -> dict[str, Any]:
    operator_status = read_json_if_exists(OPERATOR_STATUS)
    post_queue_proof = read_json_if_exists(POST_QUEUE_PROOF)
    readback_compare = read_json_if_exists(READBACK_COMPARE)
    readback_negative = read_json_if_exists(READBACK_NEGATIVE)
    actual_readback = actual_readback_proof()
    quality = {
        row.get("area"): row
        for row in operator_status.get("quality_denominators", [])
        if isinstance(row, dict)
    }
    required_quality = [
        "raw_14_workbook_coverage",
        "dense_realistic_source_room_families",
        "application_realism_gates",
        "ecl_table_producer_coverage",
        "local_layer_readback_chain",
    ]
    checks = [
        operator_status.get("run_state") == "completed",
        all(quality.get(area, {}).get("status") == "pass" for area in required_quality),
        actual_readback.get("accepted") is True,
    ]
    return {
        "passed": sum(1 for value in checks if value),
        "total": len(checks),
        "status": "pass" if all(checks) else "pending",
        "required_quality_areas": required_quality,
        "operator_status": repo_relative(OPERATOR_STATUS),
        "post_queue_proof": repo_relative(POST_QUEUE_PROOF),
        "readback_compare": repo_relative(READBACK_COMPARE),
        "readback_negative": repo_relative(READBACK_NEGATIVE),
        "legacy_readback_compare": {
            "accepted": readback_compare.get("accepted"),
            "tables_compared": readback_compare.get("tables_compared"),
        },
        "legacy_readback_negative": {
            "accepted": readback_negative.get("accepted"),
            "expected_failed": readback_negative.get("expected_failed"),
        },
        "actual_aca_readback": actual_readback,
    }


def write_outputs(out_dir: Path) -> dict[str, str]:
    generated_at = now_iso()
    prereq = prerequisites()
    manifest_path = out_dir / "ecl_product_browser_qa_gate_manifest.template.json"
    status_path = out_dir / "ecl_product_browser_qa_gate_status.json"
    checklist_path = out_dir / "ecl_product_browser_qa_acceptance_checklist.json"
    report_path = out_dir / "PRODUCT_BROWSER_QA_GATE.md"
    summary_path = out_dir / "ecl_product_browser_qa_gate_summary.json"

    surfaces = []
    for surface in PRODUCT_SURFACES:
        surfaces.append({
            **surface,
            "browser_live_claim": False,
            "route_repoint_authorized": False,
            "required_proof_artifacts": [
                "signed_in_browser_screenshot",
                "dom_text_snapshot",
                "network_or_read_model_source_trace",
                "row_count_or_metric_parity_json",
                "visual_overlap_scan",
                "client_visible_language_scan",
            ],
        })

    manifest = {
        "approval_file_purpose": "template_only_not_approval",
        "approved": False,
        "actual_browser_execution": False,
        "actual_route_repointing": False,
        "generated_at": generated_at,
        "mode": "future_product_browser_gate",
        "prerequisites": prereq,
        "surfaces": surfaces,
        "hard_gates_preserved": {
            "azure_data_plane_write": "not_run",
            "product_route_repointing": "not_run",
            "browser_live_claim": "not_run",
            "legacy_retirement": "not_run",
        },
    }
    write_json(manifest_path, manifest)

    total_assertions = sum(len(surface["required_assertions"]) for surface in surfaces)
    checklist = {
        "accepted": True,
        "actual_browser_execution": False,
        "actual_route_repointing": False,
        "product_count": len(surfaces),
        "required_assertion_count": total_assertions,
        "required_products": [surface["product"] for surface in surfaces],
        "status": "ready_for_future_browser_gate_review" if prereq["status"] == "pass" else "pending_prerequisites",
    }
    write_json(checklist_path, checklist)

    status = {
        "actual_browser_execution": False,
        "actual_route_repointing": False,
        "events": [
            {"at": generated_at, "name": "product_browser_qa_gate_package_generated"},
            {"at": generated_at, "name": "route_repointing_refused_by_design"},
            {"at": generated_at, "name": "browser_live_claim_refused_by_design"},
        ],
        "status": checklist["status"],
    }
    write_json(status_path, status)

    summary = {
        "accepted": prereq["status"] == "pass",
        "actual_browser_execution": False,
        "actual_route_repointing": False,
        "manifest": repo_relative(manifest_path),
        "product_count": len(surfaces),
        "prerequisites": prereq,
        "required_assertion_count": total_assertions,
        "status": checklist["status"],
    }
    write_json(summary_path, summary)

    lines = [
        "# ECL Product Browser QA Gate",
        "",
        f"- Products: `{len(surfaces)}`",
        f"- Required assertions: `{total_assertions}`",
        "- Actual browser execution: `false`",
        "- Actual route repointing: `false`",
        f"- Prerequisites: `{prereq['passed']} / {prereq['total']}`",
        "",
        "This package defines the future browser QA bar for Source, Home, Tower, and Intelligence. It does not repoint routes, start browser proof, deploy, load Azure, or claim live proof.",
    ]
    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {
        "checklist": repo_relative(checklist_path),
        "manifest": repo_relative(manifest_path),
        "report": repo_relative(report_path),
        "status": repo_relative(status_path),
        "summary": repo_relative(summary_path),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    outputs = write_outputs(args.out_dir.resolve())
    print(json.dumps(outputs, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
