#!/usr/bin/env python3

"""Load dense source-room cube/read-model rows locally.

Local proof only. This runner composes the dense source-room source/context/
commercial/review/projection local loaders and then writes compact cube
manifests, slices, metric FKs, and measure FKs in disposable Postgres.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import load_dense_source_room_commercial_layer as commercial_layer
import load_dense_source_room_context_layer as context_layer
import load_dense_source_room_review_layer as review_layer
import load_dense_source_room_source_layer as source_layer
import load_dense_source_room_source_projection_layer as source_projection_layer


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DENSE_OUT_DIR = ROOT / "outputs/source-room-depth-catchup-2026-08-23"
DEFAULT_OUT_DIR = ROOT / "reports/ecl-dense-cube-layer-local-load-2026-08-23"
TENANT_KEY = os.environ.get("ECL_DENSE_TENANT_KEY", source_layer.TENANT_KEY)
ASSESSMENT_ID = os.environ.get("ECL_DENSE_ASSESSMENT_ID", source_layer.ASSESSMENT_ID)
CUBE_VERSION = 1
DDL_FILES = [
    ROOT / "docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql",
    ROOT / "docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql",
    ROOT / "docs/architecture/sql-drafts/ecl_cube_read_models_v1_draft.sql",
]


CUBE_METRICS = {
    "home_coverage_cube": ["employee_count", "contractor_count", "open_requisition_count", "application_count"],
    "architecture_cube": ["annual_cost_usd", "user_count_estimate", "interface_count", "environment_count"],
    "data_analytics_cube": ["workload_count", "active_user_count", "data_volume_tb"],
    "source_vendor_cube": ["contract_annualized_value_usd", "minimum_commitment_usd", "notice_window_days"],
    "source_contract_cube": ["contract_annualized_value_usd", "minimum_commitment_usd", "notice_window_days"],
    "tower_spend_value_cube": ["budget_usd", "actual_usd", "approved_budget_usd", "forecast_usd", "target_value_usd"],
    "tower_evidence_cube": ["open_exception_count", "control_open_exception_count", "risk_open_exception_count"],
    "ai_portfolio_cube": ["licensed_users", "ai_active_users", "usage_events", "monthly_cost_usd"],
    "intelligence_citation_cube": ["interface_count", "open_exception_count", "data_volume_tb"],
}


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def sql_unquote(value: str) -> str | None:
    if value == "null":
        return None
    if value.startswith("'") and value.endswith("'"):
        return value[1:-1].replace("''", "'")
    return value


def sql_number(value: str) -> float | None:
    if value in {"null", ""}:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def source_hash(payload: object) -> str:
    return source_projection_layer.source_hash(payload)


def snapshot_id() -> str:
    return source_projection_layer.snapshot_id()


def cube_manifest_id(cube_key: str) -> str:
    return source_layer.stable_uuid("cube_manifest", TENANT_KEY, ASSESSMENT_ID, cube_key, CUBE_VERSION)


def insert_sql(table: str, columns: list[str], rows: list[dict[str, str]], batch_size: int = 500) -> str:
    if not rows:
        return ""
    chunks: list[str] = []
    for start in range(0, len(rows), batch_size):
        batch = rows[start : start + batch_size]
        values = ",\n".join("(" + ", ".join(row[column] for column in columns) + ")" for row in batch)
        chunks.append(f"insert into {table} ({', '.join(columns)}) values\n{values};")
    return "\n".join(chunks) + "\n"


def build_cube_sql(dense_out_dir: Path, out_dir: Path) -> dict[str, Any]:
    context = context_layer.ContextBuilder(dense_out_dir).build()
    measures_by_metric: dict[str, list[dict[str, str]]] = defaultdict(list)
    units_by_metric: dict[str, str] = {}
    for measure in context["measures"]:
        metric_key = sql_unquote(measure["metric_key"]) or ""
        if not metric_key:
            continue
        measures_by_metric[metric_key].append(measure)
        units_by_metric.setdefault(metric_key, sql_unquote(measure["unit"]) or "value")

    cube_manifest_rows: list[dict[str, str]] = []
    cube_slice_rows: list[dict[str, str]] = []
    cube_metric_rows: list[dict[str, str]] = []
    cube_measure_rows: list[dict[str, str]] = []
    snap_id = snapshot_id()

    for cube_key, metric_candidates in CUBE_METRICS.items():
        available_metrics = [metric for metric in metric_candidates if measures_by_metric.get(metric)]
        if not available_metrics:
            available_metrics = ["annual_cost_usd"]
        manifest_id = cube_manifest_id(cube_key)
        cube_manifest_rows.append(
            {
                "id": source_layer.sql_text(manifest_id),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "snapshot_id": source_layer.sql_text(snap_id),
                "cube_key": source_layer.sql_text(cube_key),
                "cube_version": str(CUBE_VERSION),
                "rebuild_command": source_layer.sql_text("npm run ecl:source-room-cube-layer:load"),
                "source_hash": source_layer.sql_text(source_hash({"cube": cube_key, "source": "dense-source-room"})),
                "cube_hash": source_layer.sql_text(source_hash({"cube": cube_key, "metrics": available_metrics})),
                "slice_count": str(len(available_metrics)),
                "quality_state": source_layer.sql_text("warning" if cube_key == "intelligence_citation_cube" else "passed"),
                "admission_status": source_layer.sql_text("not_applicable"),
                "admission_gate_results_json": source_layer.sql_json([]),
                "proof_uri": source_layer.sql_text("local-disposable-postgres"),
            }
        )
        for sort_index, metric_key in enumerate(available_metrics, start=1):
            metric_measures = measures_by_metric[metric_key]
            linked_measures = metric_measures[:150]
            values = [sql_number(measure["value_number"]) for measure in metric_measures]
            numeric_values = [value for value in values if value is not None]
            primary = linked_measures[0]
            primary_object_id = sql_unquote(primary["subject_object_id"])
            aggregate = {
                "measure_count": len(metric_measures),
                "linked_measure_count": len(linked_measures),
                "sum": round(sum(numeric_values), 4) if numeric_values else None,
                "average": round(sum(numeric_values) / len(numeric_values), 4) if numeric_values else None,
                "unit": units_by_metric.get(metric_key, "value"),
            }
            slice_id = source_layer.stable_uuid("cube_slice", cube_key, metric_key, CUBE_VERSION)
            gap_flags = []
            if len(linked_measures) < len(metric_measures):
                gap_flags.append({"gap": "slice_lineage_sampled", "linked": len(linked_measures), "available": len(metric_measures)})
            if cube_key == "intelligence_citation_cube":
                gap_flags.append({"gap": "citation_depth_uses_existing_context_measures", "state": "evidence_room_measures_not_promoted_yet"})
            cube_slice_rows.append(
                {
                    "id": source_layer.sql_text(slice_id),
                    "tenant_key": source_layer.sql_text(TENANT_KEY),
                    "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                    "snapshot_id": source_layer.sql_text(snap_id),
                    "cube_manifest_id": source_layer.sql_text(manifest_id),
                    "cube_key": source_layer.sql_text(cube_key),
                    "cube_version": str(CUBE_VERSION),
                    "slice_key": source_layer.sql_text(f"{cube_key}:{metric_key}"),
                    "grain_key": source_layer.sql_text("metric_family"),
                    "primary_object_id": source_layer.sql_text(primary_object_id),
                    "dimensions_json": source_layer.sql_json({"cube_key": cube_key, "metric_key": metric_key, "grain": "metric_family"}),
                    "measures_json": source_layer.sql_json({metric_key: aggregate}),
                    "primary_metric_key": source_layer.sql_text(metric_key),
                    "metric_keys_json": source_layer.sql_json(available_metrics),
                    "source_refs_json": source_layer.sql_json([sql_unquote(measure["source_record_id"]) for measure in linked_measures[:20] if sql_unquote(measure["source_record_id"])]),
                    "basis_summary": source_layer.sql_text("Dense source-room local cube slice with FK-backed metric and measure lineage."),
                    "value_state": source_layer.sql_text("known"),
                    "quality_state": source_layer.sql_text("warning" if gap_flags else "passed"),
                    "gap_flags_json": source_layer.sql_json(gap_flags),
                    "source_hash": source_layer.sql_text(source_hash({"cube": cube_key, "metric": metric_key, "count": len(metric_measures)})),
                }
            )
            for metric_order, linked_metric in enumerate(available_metrics, start=1):
                cube_metric_rows.append(
                    {
                        "tenant_key": source_layer.sql_text(TENANT_KEY),
                        "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                        "cube_slice_id": source_layer.sql_text(slice_id),
                        "metric_key": source_layer.sql_text(linked_metric),
                        "metric_role": source_layer.sql_text("primary" if linked_metric == metric_key else "supporting"),
                        "unit": source_layer.sql_text(units_by_metric.get(linked_metric, "value")),
                        "sort_order": str(metric_order),
                        "source_hash": source_layer.sql_text(source_hash({"cube_metric": cube_key, "metric": linked_metric})),
                    }
                )
            for measure in linked_measures:
                cube_measure_rows.append(
                    {
                        "tenant_key": source_layer.sql_text(TENANT_KEY),
                        "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                        "cube_slice_id": source_layer.sql_text(slice_id),
                        "measure_id": measure["id"],
                        "metric_key": source_layer.sql_text(metric_key),
                        "measure_role": source_layer.sql_text("primary"),
                        "source_hash": source_layer.sql_text(source_hash({"cube_measure": cube_key, "metric": metric_key, "measure": measure["id"]})),
                    }
                )

    columns = {
        "ecl_projection.cube_manifest": ["id", "tenant_key", "assessment_id", "snapshot_id", "cube_key", "cube_version", "rebuild_command", "source_hash", "cube_hash", "slice_count", "quality_state", "admission_status", "admission_gate_results_json", "proof_uri"],
        "ecl_projection.cube_slice": ["id", "tenant_key", "assessment_id", "snapshot_id", "cube_manifest_id", "cube_key", "cube_version", "slice_key", "grain_key", "primary_object_id", "dimensions_json", "measures_json", "primary_metric_key", "metric_keys_json", "source_refs_json", "basis_summary", "value_state", "quality_state", "gap_flags_json", "source_hash"],
        "ecl_projection.cube_slice_metric": ["tenant_key", "assessment_id", "cube_slice_id", "metric_key", "metric_role", "unit", "sort_order", "source_hash"],
        "ecl_projection.cube_slice_measure": ["tenant_key", "assessment_id", "cube_slice_id", "measure_id", "metric_key", "measure_role", "source_hash"],
    }
    sql_path = out_dir / "dense_source_room_ecl_cube_load.sql"
    sql_parts = ["begin;"]
    sql_parts.append(insert_sql("ecl_projection.cube_manifest", columns["ecl_projection.cube_manifest"], cube_manifest_rows))
    sql_parts.append(insert_sql("ecl_projection.cube_slice", columns["ecl_projection.cube_slice"], cube_slice_rows))
    sql_parts.append(insert_sql("ecl_projection.cube_slice_metric", columns["ecl_projection.cube_slice_metric"], cube_metric_rows))
    sql_parts.append(insert_sql("ecl_projection.cube_slice_measure", columns["ecl_projection.cube_slice_measure"], cube_measure_rows))
    sql_parts.append("commit;")
    sql_path.parent.mkdir(parents=True, exist_ok=True)
    sql_path.write_text("\n".join(sql_parts) + "\n", encoding="utf-8")
    verify_sql = out_dir / "dense_source_room_ecl_cube_verify.sql"
    verify_sql.write_text(
        """
\\pset format unaligned
\\pset tuples_only on
select jsonb_pretty(jsonb_build_object(
  'cube_manifest', (select count(*) from ecl_projection.cube_manifest),
  'cube_slice', (select count(*) from ecl_projection.cube_slice),
  'cube_slice_metric', (select count(*) from ecl_projection.cube_slice_metric),
  'cube_slice_measure', (select count(*) from ecl_projection.cube_slice_measure),
  'cube_key_count', (select count(distinct cube_key) from ecl_projection.cube_manifest),
  'cube_metric_drift', (
    select count(*) from ecl_projection.cube_slice_metric csm
    left join ecl_context.metric_definition md on md.tenant_key = csm.tenant_key and md.metric_key = csm.metric_key
    where md.metric_key is null
  ),
  'cube_measure_drift', (
    select count(*) from ecl_projection.cube_slice_measure csm
    left join ecl_context.measure m on m.tenant_key = csm.tenant_key and m.assessment_id = csm.assessment_id and m.id = csm.measure_id
    where m.id is null
  ),
  'json_metric_without_fk', (
    select count(*) from ecl_projection.cube_slice cs
    where exists (
      select 1
      from jsonb_array_elements_text(cs.metric_keys_json) as metric_key
      left join ecl_projection.cube_slice_metric csm
        on csm.tenant_key = cs.tenant_key and csm.assessment_id = cs.assessment_id and csm.cube_slice_id = cs.id and csm.metric_key = metric_key
      where csm.metric_key is null
    )
  ),
  'blocked_without_gap', (select count(*) from ecl_projection.cube_slice where quality_state = 'blocked' and gap_flags_json = '[]'::jsonb)
));
""".strip()
        + "\n",
        encoding="utf-8",
    )
    return {
        "cube_sql": sql_path.as_posix(),
        "verify_sql": verify_sql.as_posix(),
        "expected_counts": {
            "cube_manifest": len(cube_manifest_rows),
            "cube_slice": len(cube_slice_rows),
            "cube_slice_metric": len(cube_metric_rows),
            "cube_slice_measure": len(cube_measure_rows),
        },
    }


def run_postgres_load(
    out_dir: Path,
    source_sql: Path,
    context_sql: Path,
    commercial_sql: Path,
    review_sql: Path,
    projection_sql: Path,
    cube_sql: Path,
    verify_sql: Path,
    keep_postgres: bool,
) -> dict[str, Any]:
    env = source_layer.command_env()
    pg_tmp = Path(source_layer.tempfile.mkdtemp(prefix="ecl-dense-cube-layer-pg-"))
    port = source_layer.find_open_port()
    db_name = "ecl_dense_cube_layer_proof"
    commands: list[dict[str, Any]] = []
    pg_started = False
    try:
        commands.append(source_layer.run(["initdb", "-D", (pg_tmp / "data").as_posix(), "--encoding=UTF8", "--locale=C.UTF-8"], cwd=ROOT, env=env, stdout_path=out_dir / "postgres_initdb.log"))
        commands.append(source_layer.run(["pg_ctl", "-D", (pg_tmp / "data").as_posix(), "-l", (out_dir / "postgres.log").as_posix(), "-o", f"-p {port} -k {pg_tmp.as_posix()}", "start"], cwd=ROOT, env=env, stdout_path=out_dir / "postgres_start.log"))
        pg_started = True
        commands.append(source_layer.run(["createdb", "-h", pg_tmp.as_posix(), "-p", str(port), db_name], cwd=ROOT, env=env))
        load_log = out_dir / "dense_source_room_ecl_cube_load.log"
        for ddl in DDL_FILES:
            commands.append(source_layer.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-f", ddl.as_posix()], cwd=ROOT, env=env, stdout_path=load_log, append=True))
        for sql_path in [source_sql, context_sql, commercial_sql, review_sql, projection_sql, cube_sql]:
            commands.append(source_layer.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-f", sql_path.as_posix()], cwd=ROOT, env=env, stdout_path=load_log, append=True))
        bad_metric_sql = "insert into ecl_projection.cube_slice_metric (tenant_key, assessment_id, cube_slice_id, metric_key, metric_role, source_hash) select tenant_key, assessment_id, id, 'invented_metric_key', 'display', 'bad' from ecl_projection.cube_slice limit 1;"
        bad_measure_sql = "insert into ecl_projection.cube_slice_measure (tenant_key, assessment_id, cube_slice_id, measure_id, metric_key, measure_role, source_hash) select tenant_key, assessment_id, id, gen_random_uuid(), primary_metric_key, 'display', 'bad' from ecl_projection.cube_slice limit 1;"
        planted_failures = []
        for key, sql in [("cube_metric_fk", bad_metric_sql), ("cube_measure_fk", bad_measure_sql)]:
            result = source_layer.subprocess.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-c", sql], cwd=ROOT, env=env, text=True, capture_output=True)
            planted_failures.append({"key": key, "rejected": result.returncode != 0, "stderr": result.stderr[:500]})
        verify = source_layer.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-f", verify_sql.as_posix()], cwd=ROOT, env=env, stdout_path=out_dir / "dense_source_room_ecl_cube_readback.json")
        readback = source_layer.parse_readback(verify["stdout"])
    finally:
        if pg_started:
            try:
                commands.append(source_layer.run(["pg_ctl", "-D", (pg_tmp / "data").as_posix(), "stop", "-m", "fast"], cwd=ROOT, env=env, stdout_path=out_dir / "postgres_stop.log"))
            except source_layer.CommandFailure:
                pass
        if not keep_postgres:
            source_layer.shutil.rmtree(pg_tmp, ignore_errors=True)
    return {"commands": commands, "postgres": {"socket_dir": pg_tmp.as_posix(), "port": port, "kept": keep_postgres}, "readback": readback, "planted_failures": planted_failures}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dense-out-dir", type=Path, default=DEFAULT_DENSE_OUT_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--keep-postgres", action="store_true")
    args = parser.parse_args()
    dense_out_dir = args.dense_out_dir.resolve()
    out_dir = args.out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    source_layer.generate_dense_package(dense_out_dir)
    source_sql_summary = source_layer.build_sql(dense_out_dir, out_dir)
    context_sql_summary = context_layer.build_context_sql(dense_out_dir, out_dir)
    commercial_sql_summary = commercial_layer.build_commercial_sql(dense_out_dir, out_dir)
    review_sql_summary = review_layer.build_review_sql(dense_out_dir, out_dir)
    projection_sql_summary = source_projection_layer.build_projection_sql(dense_out_dir, out_dir)
    cube_sql_summary = build_cube_sql(dense_out_dir, out_dir)
    pg_summary = run_postgres_load(
        out_dir,
        Path(source_sql_summary["load_sql"]),
        Path(context_sql_summary["context_sql"]),
        Path(commercial_sql_summary["commercial_sql"]),
        Path(review_sql_summary["review_sql"]),
        Path(projection_sql_summary["projection_sql"]),
        Path(cube_sql_summary["cube_sql"]),
        Path(cube_sql_summary["verify_sql"]),
        args.keep_postgres,
    )
    readback = pg_summary["readback"]
    expected = cube_sql_summary["expected_counts"]
    issues = [
        f"{key}_count_expected_{expected[key]}_got_{readback.get(key)}"
        for key in expected
        if int(readback.get(key, -1)) != int(expected[key])
    ]
    if int(readback.get("cube_key_count", 0)) != 9:
        issues.append("cube_key_count_not_9")
    for drift_key in ["cube_metric_drift", "cube_measure_drift", "json_metric_without_fk", "blocked_without_gap"]:
        if int(readback.get(drift_key, 1)) != 0:
            issues.append(drift_key)
    if any(not failure["rejected"] for failure in pg_summary["planted_failures"]):
        issues.append("planted_failure_not_rejected")
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "boundary": {"azure_load": False, "product_route_repointing": False, "browser_proof": False},
        "dense_out_dir": dense_out_dir.as_posix(),
        "out_dir": out_dir.as_posix(),
        "cube_sql": cube_sql_summary,
        "readback": readback,
        "planted_failures": pg_summary["planted_failures"],
        "issues": issues,
        "status": "pass" if not issues else "fail",
    }
    write_json(out_dir / "dense_source_room_ecl_cube_load_summary.json", summary)
    if issues:
        for issue in issues:
            print(f"FAIL: {issue}", file=sys.stderr)
        return 1
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
