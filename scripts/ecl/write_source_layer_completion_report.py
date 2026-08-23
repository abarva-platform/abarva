#!/usr/bin/env python3
"""Write an ECL Source layer-completion report from local proof artifacts.

This report is deliberately conservative. It treats local disposable-DB proof,
static render proof, route-readiness proof, Azure data-plane load, and live
browser proof as separate states.
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT_DIR = ROOT / "reports/ecl-source-layer-completion-2026-08-23"
DEFAULT_COMMERCIAL_OUT = ROOT / "outputs/ecl-commercial-contract-supply-correction-2026-08-22"
DEFAULT_PLANNING_OUT = ROOT / "outputs/ecl-next-slice-planning-2026-08-23"
DEFAULT_WORKBOOK_OUT = ROOT / "outputs/ecl-client-workbook-execution-2026-08-23"
DEFAULT_ROUTE_OUT = ROOT / "outputs/ecl-source-route-readiness-2026-08-23"
DEFAULT_QUEUE_OUT = ROOT / "outputs/ecl-no-stop-execution-run"
DEFAULT_LEGACY_OUT = ROOT / "reports/ecl-legacy-table-retirement-map-2026-08-22"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_json(path: Path, default: Any | None = None) -> Any:
    if not path.exists():
        return {} if default is None else default
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def rel(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def parse_builder_counts(commercial_summary: dict[str, Any]) -> dict[str, Any]:
    commands = commercial_summary.get("commands", [])
    if not commands:
        return {}
    stdout = commands[0].get("stdout", "")
    try:
        parsed = json.loads(stdout)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def add_layer(
    rows: list[dict[str, Any]],
    *,
    layer: str,
    area: str,
    state: str,
    denominator: str,
    passed: str,
    evidence: str,
    what_loaded: str,
    remaining: str,
    next_gate: str,
) -> None:
    rows.append(
        {
            "layer": layer,
            "area": area,
            "state": state,
            "denominator": denominator,
            "passed": passed,
            "evidence": evidence,
            "what_loaded": what_loaded,
            "remaining": remaining,
            "next_gate": next_gate,
        }
    )


def build_report(args: argparse.Namespace) -> tuple[dict[str, Any], list[dict[str, Any]], list[dict[str, Any]]]:
    commercial_acceptance = read_json(
        args.commercial_out / "commercial_proof_acceptance_summary.json"
    )
    commercial_run = read_json(args.commercial_out / "commercial_proof_run_summary.json")
    route_readiness = read_json(args.route_out / "source_360_route_readiness_summary.json")
    queue_summary = read_json(args.queue_out / "execution-summary.json")
    workbook_summary = read_json(args.workbook_out / "workbook_execution_package_summary.json")
    workbook_validation = read_json(
        args.workbook_out / "workbook_execution_package_validation_summary.json"
    )
    planning_acceptance = read_json(
        args.planning_out / "ecl_next_slice_acceptance_summary.json"
    )
    dense_summary = read_json(args.planning_out / "ecl_dense_source_room_requirements_summary.json")
    product_summary = read_json(
        args.planning_out / "ecl_product_deterministic_fact_contracts_summary.json"
    )
    legacy_summary = read_json(args.legacy_out / "legacy_table_retirement_summary.json")

    builder = parse_builder_counts(commercial_run)
    checks = commercial_acceptance.get("checks", {})
    route_checks = route_readiness.get("checks", {})

    layers: list[dict[str, Any]] = []
    add_layer(
        layers,
        layer="Backlog queue",
        area="20-slice local execution queue",
        state="local_proof_complete_with_hard_gate",
        denominator=f"{queue_summary.get('executable_slice_count', 0)} executable / {len(queue_summary.get('slices', []))} total",
        passed=f"{queue_summary.get('passed_executable_slice_count', 0)} executable passed; {queue_summary.get('hard_gated_slice_count', 0)} hard-gated",
        evidence=rel(args.queue_out / "execution-summary.json"),
        what_loaded="All local proof/report slices in the next queue ran successfully.",
        remaining="Item 20 requires product route repointing and live/browser proof.",
        next_gate="product_route_repointing",
    )
    add_layer(
        layers,
        layer="L1 client intake",
        area="Client workbook execution package",
        state="local_package_contract_ready_not_published",
        denominator=f"{workbook_summary.get('workbook_folder_count', 0)} workbook folders / {workbook_summary.get('source_family_count', 0)} source families",
        passed=f"{workbook_summary.get('field_guide_rows', 0)} field-guide rows; {workbook_summary.get('example_rows', 0)} example rows; {workbook_validation.get('issue_count', 0)} issues",
        evidence=rel(args.workbook_out / "workbook_execution_package_validation_summary.json"),
        what_loaded="Business-facing folder/package contract exists for applications, hosting, vendors/contracts, budget/spend, D&A volumetrics, AI usage, interviews, infrastructure, and programs.",
        remaining="Package is not published/replaced in Azure and not yet filled with dense client-scale synthetic rows across every family.",
        next_gate="client_package_replacement",
    )
    add_layer(
        layers,
        layer="L1 source room",
        area="Commercial contract source room",
        state="local_source_room_loaded",
        denominator=f"{builder.get('source_files', 0)} files / {builder.get('source_records', 0)} source records",
        passed=f"{checks.get('source_room_hash_count', 0)} source-room hashes; {checks.get('field_lineage_rows', 0)} lineage rows; {checks.get('document_quality_issues', 0)} document quality issues",
        evidence=rel(args.commercial_out / "proof_bundle_manifest.json"),
        what_loaded="Commercial contract source extracts, document inventory, contract register, scope, pricing, AP, SLA, benchmark, and protection assessment are locally generated and hashed.",
        remaining="Other source families are mapped as requirements, not yet source-room dense-loaded.",
        next_gate="active_tenant_source_replacement_or_dense_package_promotion",
    )
    add_layer(
        layers,
        layer="L2 adapters/builders",
        area="Commercial source-room builder and validators",
        state="local_builder_proven",
        denominator="1 commercial vertical builder",
        passed=f"{checks.get('expected_counts', 0)} expected-count checks; {checks.get('extracts_documented', 0)} extracts documented; planted failures pass",
        evidence=rel(args.commercial_out / "commercial_proof_acceptance_summary.json"),
        what_loaded="The commercial builder generates source, context, commercial, review, projection, and cube load artifacts and rejects known bad rows.",
        remaining="Reusable adapters for all nine source families are not built and no ACA data-build job executed.",
        next_gate="migration_or_aca_data_build_execution",
    )
    add_layer(
        layers,
        layer="L3 ecl_source",
        area="Source files, source records, documents, extractions",
        state="loaded_in_disposable_postgres",
        denominator="ecl_source local proof tables",
        passed=f"{builder.get('source_files', 0)} source files; {builder.get('source_records', 0)} records; {builder.get('documents', 0)} documents; {builder.get('document_extractions', 0)} extractions",
        evidence=rel(args.commercial_out / "commercial_contract_supply_db_proof.txt"),
        what_loaded="Commercial source evidence is loaded with real document page/span extraction coverage in local disposable Postgres.",
        remaining="No Azure/client-preprod load; no retrieval/index publication.",
        next_gate="Azure_data_plane_load",
    )
    add_layer(
        layers,
        layer="L3 ecl_context",
        area="Objects, relationships, measures",
        state="loaded_in_disposable_postgres",
        denominator="ecl_context local proof tables",
        passed=f"{builder.get('objects', 0)} objects; {builder.get('relationships', 0)} relationships; {builder.get('measures', 0)} measures",
        evidence=rel(args.commercial_out / "commercial_contract_supply_db_proof.txt"),
        what_loaded="Supplier, contract, scope, document, measure, and application-scope context loads locally with FK/readback proof.",
        remaining="Dense application/data/AI/interview context across all source families is not loaded yet.",
        next_gate="dense_source_room_build_then_Azure_load",
    )
    add_layer(
        layers,
        layer="L3 ecl_commercial",
        area="Contracts, service lines, scope, invoice, SLA",
        state="loaded_in_disposable_postgres",
        denominator="5 ecl_commercial tables",
        passed=f"{builder.get('contracts', 0)} contracts; {builder.get('service_lines', 0)} service lines; {builder.get('contract_scope', 0)} scope links; {builder.get('invoice_lines', 0)} invoice lines; {builder.get('sla_observations', 0)} SLA observations",
        evidence=rel(args.commercial_out / "commercial_contract_supply_db_proof.txt"),
        what_loaded="Commercial domain is the strongest Source vertical now: contract economics, scope, invoice variance, SLA, protection, and benchmark basis are populated locally.",
        remaining="The slice is deliberately five contracts, not a full tenant-scale commercial portfolio.",
        next_gate="dense_commercial_population_and_Azure_load",
    )
    add_layer(
        layers,
        layer="L3 ecl_review",
        area="Review events and gates",
        state="loaded_in_disposable_postgres",
        denominator="review events produced by commercial proof",
        passed=f"{builder.get('review_events', 0)} review events",
        evidence=rel(args.commercial_out / "commercial_contract_supply_db_proof.txt"),
        what_loaded="Review and gate states exist for commercial evidence and Source/Tower consumption.",
        remaining="Human review workflow UI and real approvals are not executed.",
        next_gate="review_workflow_and_product_adoption",
    )
    add_layer(
        layers,
        layer="L4 Source 360",
        area="Contract, vendor, value, and event projections",
        state="local_projection_ready_not_repointed",
        denominator="Source 360 projection artifacts",
        passed=(
            f"{route_checks.get('source_contract_projection_rows', 0)} contracts; "
            f"{route_checks.get('source_vendor_projection_rows', 0)} vendors; "
            f"{route_checks.get('source_value_levers_projection_rows', 0)} value levers; "
            f"{route_checks.get('source_event_workspace_projection_rows', 0)} workspace rows"
        ),
        evidence=rel(args.route_out / "source_360_route_readiness_summary.json"),
        what_loaded="Local ECL Source projections and healthy/weak static previews are accepted; weak contract leverage is visible.",
        remaining="Current product routes are not repointed; signed-in browser QA is not claimed.",
        next_gate="product_route_repointing_then_signed_in_browser_QA",
    )
    add_layer(
        layers,
        layer="L4 Tower",
        area="Tower command center preview",
        state="local_static_preview_only",
        denominator="Tower projection artifact",
        passed=f"{builder.get('tower_rows', 0)} tower rows",
        evidence=rel(args.queue_out / "logs/tower_command_center_static_preview.log"),
        what_loaded="Commercial risk/value gates are rendered into a static Tower command preview.",
        remaining="Tower runtime dashboards and signed-in browser QA remain open.",
        next_gate="product_route_repointing_then_signed_in_browser_QA",
    )
    add_layer(
        layers,
        layer="Product fact contracts",
        area="Home, Source, Tower, Intelligence, Moves, Cubes",
        state="planning_contract_ready",
        denominator=f"{product_summary.get('contracts', 0)} product fact contracts",
        passed=f"{planning_acceptance.get('product_fact_contracts', 0)} contracts accepted; browser proof status {product_summary.get('browser_proof_status', 'unknown')}",
        evidence=rel(args.planning_out / "ecl_product_deterministic_fact_contracts_summary.json"),
        what_loaded="Page-level deterministic needs are specified for product consumers and partial/refusal behavior.",
        remaining="Home, Intelligence, Moves, and most Tower consumers are not built against ECL yet.",
        next_gate="product_projection_build_and_browser_QA",
    )
    add_layer(
        layers,
        layer="Cubes",
        area="Commercial/source/tower cube slices",
        state="loaded_in_disposable_postgres",
        denominator="cube manifests/slices in commercial proof",
        passed=f"{builder.get('cube_manifests', 0)} manifests; {builder.get('cube_slices', 0)} slices; {builder.get('cube_slice_metrics', 0)} metric links; {builder.get('cube_slice_measures', 0)} measure links",
        evidence=rel(args.commercial_out / "commercial_contract_supply_db_proof.txt"),
        what_loaded="Commercial cube metrics/measures are FK-backed and locally read back.",
        remaining="Cross-family cubes for Home architecture, D&A, AI usage, Moves, and Intelligence are not populated.",
        next_gate="dense_source_family_population",
    )
    add_layer(
        layers,
        layer="Dense source coverage",
        area="Nine required source families",
        state="requirements_ready_not_dense_loaded",
        denominator=f"{dense_summary.get('requirements', 0)} dense requirements",
        passed=f"{planning_acceptance.get('extraction_families', 0)} extraction families accepted; partial processing supported={planning_acceptance.get('partial_processing_supported', False)}",
        evidence=rel(args.planning_out / "ecl_dense_source_room_requirements_summary.json"),
        what_loaded="Requirements explicitly cover CMDB, deployments, vendors/contracts, budget/spend, D&A volumetrics, AI usage, interviews, infrastructure, and programs.",
        remaining="The dense source rooms are not fully generated/loaded across all families, so full Source comprehensiveness is not complete.",
        next_gate="active_tenant_source_replacement_or_dense_synthetic_package_promotion",
    )
    add_layer(
        layers,
        layer="Azure/data plane",
        area="Client preprod/lab load",
        state="not_loaded",
        denominator="Azure DB/data-build job",
        passed="0 Azure loads performed by this batch",
        evidence=rel(args.queue_out / "execution-summary.json"),
        what_loaded="Nothing was written to Azure by this local lane.",
        remaining="Run governed ACA data-build job and independent Azure readback after approval.",
        next_gate="Azure_data_plane_load_authorization",
    )
    add_layer(
        layers,
        layer="Browser/live product",
        area="Source/Tower route and signed-in proof",
        state="hard_gated",
        denominator="item 20 browser/product repointing proof",
        passed="0 live browser claims; route readiness accepted",
        evidence=rel(args.route_out / "source_360_route_readiness_summary.json"),
        what_loaded="Routes remain protected from unguarded ECL repointing.",
        remaining="Repoint behind explicit adapter flag, deploy through approved lane, then run signed-in browser QA.",
        next_gate="product_route_repointing",
    )
    add_layer(
        layers,
        layer="Legacy sunset",
        area="Static table retirement pressure map",
        state="static_inventory_ready_not_retired",
        denominator=f"{legacy_summary.get('create_table_statements', 0)} CREATE TABLE statements",
        passed=f"{legacy_summary.get('unique_table_names', 0)} unique table names; deletion authorization={legacy_summary.get('boundary', {}).get('deletion_authorization', False)}",
        evidence=rel(args.legacy_out / "legacy_table_retirement_summary.json"),
        what_loaded="Static retirement pressure map is current.",
        remaining="No live readback, parity proof, or retirement authorization.",
        next_gate="live_readback_and_retirement_authorization",
    )

    queue_rows: list[dict[str, Any]] = []
    for item in queue_summary.get("slices", []):
        queue_rows.append(
            {
                "order": item.get("order"),
                "slice_id": item.get("slice_id"),
                "result_state": item.get("result_state"),
                "checkpoint_percent": item.get("checkpoint_percent"),
                "lane_decision": item.get("lane_decision"),
                "stop_gate": item.get("stop_gate"),
                "evidence": item.get("log_path", ""),
            }
        )

    is_commercial_loaded = all(
        row["state"]
        in {
            "local_source_room_loaded",
            "local_builder_proven",
            "loaded_in_disposable_postgres",
            "local_projection_ready_not_repointed",
            "local_static_preview_only",
        }
        for row in layers
        if row["area"]
        in {
            "Commercial contract source room",
            "Commercial source-room builder and validators",
            "Source files, source records, documents, extractions",
            "Objects, relationships, measures",
            "Contracts, service lines, scope, invoice, SLA",
            "Review events and gates",
            "Contract, vendor, value, and event projections",
            "Tower command center preview",
        }
    )
    is_full_source_loaded = False
    summary = {
        "generated_at": utc_now(),
        "accepted": True,
        "local_queue": {
            "total_slices": len(queue_summary.get("slices", [])),
            "executable_slices": queue_summary.get("executable_slice_count", 0),
            "passed_executable_slices": queue_summary.get("passed_executable_slice_count", 0),
            "hard_gated_slices": queue_summary.get("hard_gated_slice_count", 0),
        },
        "commercial_source_vertical_loaded_locally_across_layers": is_commercial_loaded,
        "full_source_fully_loaded_and_comprehensive_across_all_layers": is_full_source_loaded,
        "why_not_full_source_complete": [
            "Dense source rooms for all nine families are requirements/planning artifacts, not fully populated source-room data.",
            "Azure/client-preprod load and independent readback were not performed in this local lane.",
            "Current product routes were not repointed to ECL and signed-in browser QA was not claimed.",
            "Home, Intelligence, Moves, and cross-family cube consumers are not all built against ECL yet.",
        ],
        "commercial_counts": builder,
        "evidence": {
            "layer_matrix_csv": rel(args.out_dir / "source_layer_completion_matrix.csv"),
            "backlog_csv": rel(args.out_dir / "source_backlog_20_status.csv"),
            "markdown_report": rel(args.out_dir / "SOURCE_LAYER_COMPLETION_REPORT.md"),
            "json_summary": rel(args.out_dir / "source_layer_completion_summary.json"),
        },
    }
    return summary, layers, queue_rows


def write_markdown(path: Path, summary: dict[str, Any], layers: list[dict[str, Any]], queue_rows: list[dict[str, Any]]) -> None:
    lines = [
        "# ECL Source Layer Completion Report",
        "",
        f"- Generated: `{summary['generated_at']}`",
        f"- Local queue passed: `{summary['local_queue']['passed_executable_slices']} / {summary['local_queue']['executable_slices']}` executable slices",
        f"- Hard-gated slices: `{summary['local_queue']['hard_gated_slices']}`",
        f"- Commercial Source vertical loaded locally across layers: `{str(summary['commercial_source_vertical_loaded_locally_across_layers']).lower()}`",
        f"- Full Source fully loaded and comprehensive across all layers: `{str(summary['full_source_fully_loaded_and_comprehensive_across_all_layers']).lower()}`",
        "",
        "## Plain-English Verdict",
        "",
        "The commercial Source 360 vertical is locally loaded through source room, builder, ECL core tables, Source/Tower projections, and commercial cubes with disposable-Postgres proof and static previews. Full Source is not yet 100% comprehensive because the remaining source families are mapped and specified, but not dense-loaded through Azure, product routes, live browser proof, retrieval, and all cross-product cubes.",
        "",
        "## Why Full Source Is Not Yet Complete",
        "",
    ]
    for reason in summary["why_not_full_source_complete"]:
        lines.append(f"- {reason}")

    lines.extend(
        [
            "",
            "## Layer Matrix",
            "",
            "| Layer | Area | State | Passed | Remaining | Next gate |",
            "|---|---|---|---|---|---|",
        ]
    )
    for row in layers:
        lines.append(
            "| {layer} | {area} | `{state}` | {passed} | {remaining} | {next_gate} |".format(
                **{key: str(value).replace("|", "/") for key, value in row.items()}
            )
        )

    lines.extend(
        [
            "",
            "## 20 Backlog Items",
            "",
            "| Order | Slice | Result | Checkpoint | Stop gate |",
            "|---:|---|---|---:|---|",
        ]
    )
    for row in queue_rows:
        lines.append(
            "| {order} | `{slice_id}` | `{result_state}` | {checkpoint_percent}% | {stop_gate} |".format(
                **{key: str(value).replace("|", "/") for key, value in row.items()}
            )
        )

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--commercial-out", type=Path, default=DEFAULT_COMMERCIAL_OUT)
    parser.add_argument("--planning-out", type=Path, default=DEFAULT_PLANNING_OUT)
    parser.add_argument("--workbook-out", type=Path, default=DEFAULT_WORKBOOK_OUT)
    parser.add_argument("--route-out", type=Path, default=DEFAULT_ROUTE_OUT)
    parser.add_argument("--queue-out", type=Path, default=DEFAULT_QUEUE_OUT)
    parser.add_argument("--legacy-out", type=Path, default=DEFAULT_LEGACY_OUT)
    args = parser.parse_args()
    args.out_dir = args.out_dir.resolve()
    args.commercial_out = args.commercial_out.resolve()
    args.planning_out = args.planning_out.resolve()
    args.workbook_out = args.workbook_out.resolve()
    args.route_out = args.route_out.resolve()
    args.queue_out = args.queue_out.resolve()
    args.legacy_out = args.legacy_out.resolve()

    summary, layers, queue_rows = build_report(args)
    args.out_dir.mkdir(parents=True, exist_ok=True)
    write_csv(
        args.out_dir / "source_layer_completion_matrix.csv",
        layers,
        [
            "layer",
            "area",
            "state",
            "denominator",
            "passed",
            "evidence",
            "what_loaded",
            "remaining",
            "next_gate",
        ],
    )
    write_csv(
        args.out_dir / "source_backlog_20_status.csv",
        queue_rows,
        [
            "order",
            "slice_id",
            "result_state",
            "checkpoint_percent",
            "lane_decision",
            "stop_gate",
            "evidence",
        ],
    )
    (args.out_dir / "source_layer_completion_summary.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    write_markdown(args.out_dir / "SOURCE_LAYER_COMPLETION_REPORT.md", summary, layers, queue_rows)
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
