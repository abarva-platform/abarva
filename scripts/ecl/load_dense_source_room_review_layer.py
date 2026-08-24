#!/usr/bin/env python3

"""Load dense source-room extracts through ecl_review locally.

Local proof only. This runner composes the source, context, and commercial
local loaders, then materializes review events against existing ECL subjects in
a disposable Postgres database.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import load_dense_source_room_commercial_layer as commercial_layer
import load_dense_source_room_context_layer as context_layer
import load_dense_source_room_source_layer as source_layer


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DENSE_OUT_DIR = ROOT / "outputs/source-room-depth-catchup-2026-08-23"
DEFAULT_OUT_DIR = ROOT / "reports/ecl-dense-review-layer-local-load-2026-08-23"
TENANT_KEY = "meridian-health"
ASSESSMENT_ID = "assessment-dense-source-room-20260823"
DDL_FILES = [ROOT / "docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql"]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def source_record_id(family: str, row: dict[str, str], index: int) -> str:
    return source_layer.stable_uuid("source_record", family, row.get("source_row_id") or index)


def insert_sql(table: str, columns: list[str], rows: list[dict[str, str]], batch_size: int = 500) -> str:
    if not rows:
        return ""
    chunks: list[str] = []
    for start in range(0, len(rows), batch_size):
        batch = rows[start : start + batch_size]
        values = ",\n".join("(" + ", ".join(row[column] for column in columns) + ")" for row in batch)
        chunks.append(f"insert into {table} ({', '.join(columns)}) values\n{values};")
    return "\n".join(chunks) + "\n"


def source_paths(dense_out_dir: Path) -> dict[str, Path]:
    manifest = read_csv(dense_out_dir / "dense_source_room_manifest.csv")
    return {row["source_room_family"]: dense_out_dir / row["file_path"] for row in manifest}


def review_event_row(
    *,
    key: str,
    subject_kind: str,
    subject_column: str,
    subject_id: str,
    review_event_type: str,
    decision_basis: str,
    reviewer_role: str,
    source_record_id_value: str | None,
    previous_value: dict[str, Any] | None,
    new_value: dict[str, Any] | None,
    notes: str,
) -> dict[str, str]:
    columns = {
        "subject_object_id": "null",
        "subject_relationship_id": "null",
        "subject_measure_id": "null",
        "subject_contract_id": "null",
        "subject_service_line_id": "null",
        "subject_scope_id": "null",
        "subject_invoice_line_id": "null",
        "subject_sla_observation_id": "null",
        "subject_document_extraction_id": "null",
        "subject_context_pack_id": "null",
    }
    columns[subject_column] = source_layer.sql_text(subject_id)
    return {
        "id": source_layer.sql_text(source_layer.stable_uuid("review_event", key)),
        "tenant_key": source_layer.sql_text(TENANT_KEY),
        "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
        "subject_kind": source_layer.sql_text(subject_kind),
        **columns,
        "review_event_type": source_layer.sql_text(review_event_type),
        "previous_value_json": source_layer.sql_json(previous_value) if previous_value is not None else "null",
        "new_value_json": source_layer.sql_json(new_value) if new_value is not None else "null",
        "decision_basis": source_layer.sql_text(decision_basis),
        "reviewer_role": source_layer.sql_text(reviewer_role),
        "source_document_id": "null",
        "source_record_id": source_layer.sql_text(source_record_id_value) if source_record_id_value else "null",
        "notes": source_layer.sql_text(notes),
    }


def build_review_sql(dense_out_dir: Path, out_dir: Path) -> dict[str, Any]:
    paths = source_paths(dense_out_dir)
    contracts_source = read_csv(paths["SP08_Vendor_Contract"])
    finance_source = read_csv(paths["SP06_Finance_ERP"])
    kpi_source = read_csv(paths["SP10_KPI_Operations"])

    review_events: list[dict[str, str]] = []

    context_pack_id = source_layer.stable_uuid(
        "context_pack",
        TENANT_KEY,
        ASSESSMENT_ID,
        "dense-source-room-context-pack",
        1,
    )
    review_events.append(
        review_event_row(
            key="dense-source-room-context-pack-review",
            subject_kind="context_pack",
            subject_column="subject_context_pack_id",
            subject_id=context_pack_id,
            review_event_type="confirm",
            decision_basis="calculated",
            reviewer_role="data_steward",
            source_record_id_value=None,
            previous_value=None,
            new_value={"status": "ready_for_local_projection_build", "source_families_loaded": 14},
            notes="Local context pack compiled from the dense source-room extract set; product use still requires projection and browser proof.",
        )
    )

    for index, row in enumerate(contracts_source, start=1):
        sid = source_record_id("SP08_Vendor_Contract", row, index)
        contract_id = source_layer.stable_uuid("commercial_contract", row["contract_id"])
        notice_days = int(float(row.get("notice_window_days") or 0))
        minimum_commitment = float(row.get("minimum_commitment_usd") or 0)
        benchmarking_right = row.get("benchmarking_right") or "unknown"
        if benchmarking_right in {"absent", "limited"}:
            review_events.append(
                review_event_row(
                    key=f"contract-benchmarking-{row['contract_id']}",
                    subject_kind="contract",
                    subject_column="subject_contract_id",
                    subject_id=contract_id,
                    review_event_type="block" if benchmarking_right == "absent" else "mark_unknown",
                    decision_basis="source_recorded",
                    reviewer_role="sourcing_lead",
                    source_record_id_value=sid,
                    previous_value={"benchmarking_right": benchmarking_right},
                    new_value={"evidence_needed": "Confirm contractual benchmarking rights and any repricing trigger before market-rate claims."},
                    notes=f"Benchmarking right is {benchmarking_right}; Source may show this as a commercial-leverage gap, not a legal conclusion.",
                )
            )
        if notice_days >= 180:
            review_events.append(
                review_event_row(
                    key=f"contract-notice-window-{row['contract_id']}",
                    subject_kind="contract",
                    subject_column="subject_contract_id",
                    subject_id=contract_id,
                    review_event_type="block" if notice_days >= 365 else "confirm",
                    decision_basis="source_recorded",
                    reviewer_role="contract_owner",
                    source_record_id_value=sid,
                    previous_value={"notice_window_days": notice_days},
                    new_value={"commercial_action": "Validate renewal calendar and sourcing runway."},
                    notes=f"Renewal notice window is {notice_days} days; long notice windows require owner review before opportunity scoring.",
                )
            )
        if minimum_commitment > 0:
            review_events.append(
                review_event_row(
                    key=f"contract-minimum-commitment-{row['contract_id']}",
                    subject_kind="contract",
                    subject_column="subject_contract_id",
                    subject_id=contract_id,
                    review_event_type="confirm",
                    decision_basis="source_recorded",
                    reviewer_role="finance_partner",
                    source_record_id_value=sid,
                    previous_value={"minimum_commitment_usd": minimum_commitment},
                    new_value={"commercial_action": "Compare commitment against run-rate invoice actuals."},
                    notes="Minimum commitment is present; finance should confirm shortfall exposure before optimization claims.",
                )
            )

    for index, row in enumerate(finance_source, start=1):
        allocation_basis = row.get("allocation_basis") or "unknown"
        if allocation_basis not in {"estimated", "unknown"}:
            continue
        sid = source_record_id("SP06_Finance_ERP", row, index)
        invoice_id = source_layer.stable_uuid("commercial_invoice", row["source_row_id"])
        evidence_needed = (
            "Provide cost-center or contract allocation proof before treating this spend as directly attributable."
            if allocation_basis == "estimated"
            else "Provide allocation basis and owner confirmation before treating this spend as attributable."
        )
        review_events.append(
            review_event_row(
                key=f"invoice-{allocation_basis}-allocation-{row['source_row_id']}",
                subject_kind="invoice_line",
                subject_column="subject_invoice_line_id",
                subject_id=invoice_id,
                review_event_type="mark_unknown",
                decision_basis="source_recorded",
                reviewer_role="it_finance",
                source_record_id_value=sid,
                previous_value={"allocation_basis": allocation_basis, "actual_usd": row.get("actual_usd")},
                new_value={"evidence_needed": evidence_needed},
                notes=f"Invoice line uses {allocation_basis} allocation; keep the amount but mark attribution as needing finance review.",
            )
        )

    for index, row in enumerate(kpi_source, start=1):
        sid = source_record_id("SP10_KPI_Operations", row, index)
        sla_id = source_layer.stable_uuid("commercial_sla", row["source_row_id"])
        actual = float(row.get("kpi_value") or 0)
        target = float(row.get("target_value") or 0)
        misses_target = actual > target if row.get("kpi_unit") in {"days", "usd"} else actual < target
        review_events.append(
            review_event_row(
                key=f"sla-observation-review-{row['source_row_id']}",
                subject_kind="sla_observation",
                subject_column="subject_sla_observation_id",
                subject_id=sla_id,
                review_event_type="block" if misses_target else "confirm",
                decision_basis="source_recorded",
                reviewer_role="service_owner",
                source_record_id_value=sid,
                previous_value={"actual": actual, "target": target, "unit": row.get("kpi_unit")},
                new_value={"review_action": "Confirm whether KPI variance maps to a contractual SLA or only an operating KPI."},
                notes="KPI row is loaded as an SLA observation candidate; service owner must confirm contractual applicability.",
            )
        )

    columns = [
        "id",
        "tenant_key",
        "assessment_id",
        "subject_kind",
        "subject_object_id",
        "subject_relationship_id",
        "subject_measure_id",
        "subject_contract_id",
        "subject_service_line_id",
        "subject_scope_id",
        "subject_invoice_line_id",
        "subject_sla_observation_id",
        "subject_document_extraction_id",
        "subject_context_pack_id",
        "review_event_type",
        "previous_value_json",
        "new_value_json",
        "decision_basis",
        "reviewer_role",
        "source_document_id",
        "source_record_id",
        "notes",
    ]
    sql_path = out_dir / "dense_source_room_ecl_review_load.sql"
    sql_path.parent.mkdir(parents=True, exist_ok=True)
    sql_path.write_text(
        "begin;\n"
        + insert_sql("ecl_review.review_event", columns, review_events)
        + "commit;\n",
        encoding="utf-8",
    )
    verify_sql = out_dir / "dense_source_room_ecl_review_verify.sql"
    verify_sql.write_text(
        """
\\pset format unaligned
\\pset tuples_only on
select jsonb_pretty(jsonb_build_object(
  'source_record', (select count(*) from ecl_source.source_record),
  'object', (select count(*) from ecl_context.object),
  'relationship', (select count(*) from ecl_context.relationship),
  'contract', (select count(*) from ecl_commercial.contract),
  'invoice_line', (select count(*) from ecl_commercial.invoice_line),
  'sla_observation', (select count(*) from ecl_commercial.sla_observation),
  'review_event', (select count(*) from ecl_review.review_event),
  'review_contract_subjects', (select count(*) from ecl_review.review_event where subject_kind = 'contract'),
  'review_invoice_subjects', (select count(*) from ecl_review.review_event where subject_kind = 'invoice_line'),
  'review_sla_subjects', (select count(*) from ecl_review.review_event where subject_kind = 'sla_observation'),
  'review_context_pack_subjects', (select count(*) from ecl_review.review_event where subject_kind = 'context_pack'),
  'review_source_record_drift', (
    select count(*) from ecl_review.review_event re
    left join ecl_source.source_record sr
      on sr.tenant_key = re.tenant_key and sr.assessment_id = re.assessment_id and sr.id = re.source_record_id
    where re.source_record_id is not null and sr.id is null
  ),
  'review_contract_drift', (
    select count(*) from ecl_review.review_event re
    left join ecl_commercial.contract c
      on c.tenant_key = re.tenant_key and c.assessment_id = re.assessment_id and c.id = re.subject_contract_id
    where re.subject_kind = 'contract' and c.id is null
  ),
  'review_invoice_drift', (
    select count(*) from ecl_review.review_event re
    left join ecl_commercial.invoice_line i
      on i.tenant_key = re.tenant_key and i.assessment_id = re.assessment_id and i.id = re.subject_invoice_line_id
    where re.subject_kind = 'invoice_line' and i.id is null
  ),
  'review_sla_drift', (
    select count(*) from ecl_review.review_event re
    left join ecl_commercial.sla_observation s
      on s.tenant_key = re.tenant_key and s.assessment_id = re.assessment_id and s.id = re.subject_sla_observation_id
    where re.subject_kind = 'sla_observation' and s.id is null
  )
));
""".strip()
        + "\n",
        encoding="utf-8",
    )
    return {
        "review_sql": sql_path.as_posix(),
        "verify_sql": verify_sql.as_posix(),
        "expected_counts": {
            "review_event": len(review_events),
        },
    }


def run_postgres_load(
    out_dir: Path,
    source_sql: Path,
    context_sql: Path,
    commercial_sql: Path,
    review_sql: Path,
    verify_sql: Path,
    keep_postgres: bool,
) -> dict[str, Any]:
    env = source_layer.command_env()
    pg_tmp = Path(source_layer.tempfile.mkdtemp(prefix="ecl-dense-review-layer-pg-"))
    port = source_layer.find_open_port()
    db_name = "ecl_dense_review_layer_proof"
    commands: list[dict[str, Any]] = []
    pg_started = False
    try:
        commands.append(source_layer.run(["initdb", "-D", (pg_tmp / "data").as_posix(), "--encoding=UTF8", "--locale=C.UTF-8"], cwd=ROOT, env=env, stdout_path=out_dir / "postgres_initdb.log"))
        commands.append(source_layer.run(["pg_ctl", "-D", (pg_tmp / "data").as_posix(), "-l", (out_dir / "postgres.log").as_posix(), "-o", f"-p {port} -k {pg_tmp.as_posix()}", "start"], cwd=ROOT, env=env, stdout_path=out_dir / "postgres_start.log"))
        pg_started = True
        commands.append(source_layer.run(["createdb", "-h", pg_tmp.as_posix(), "-p", str(port), db_name], cwd=ROOT, env=env))
        load_log = out_dir / "dense_source_room_ecl_review_load.log"
        for ddl in DDL_FILES:
            commands.append(source_layer.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-f", ddl.as_posix()], cwd=ROOT, env=env, stdout_path=load_log, append=True))
        for sql_path in [source_sql, context_sql, commercial_sql, review_sql]:
            commands.append(source_layer.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-f", sql_path.as_posix()], cwd=ROOT, env=env, stdout_path=load_log, append=True))
        bad_missing_subject_sql = "insert into ecl_review.review_event (tenant_key, assessment_id, subject_kind, review_event_type, decision_basis) values ('meridian-health', 'assessment-dense-source-room-20260823', 'contract', 'confirm', 'owner_confirmed');"
        bad_contract_fk_sql = "insert into ecl_review.review_event (tenant_key, assessment_id, subject_kind, subject_contract_id, review_event_type, decision_basis) values ('meridian-health', 'assessment-dense-source-room-20260823', 'contract', gen_random_uuid(), 'confirm', 'owner_confirmed');"
        planted_failures = []
        for key, sql in [("review_event_missing_subject_check", bad_missing_subject_sql), ("review_event_contract_fk", bad_contract_fk_sql)]:
            result = source_layer.subprocess.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-c", sql], cwd=ROOT, env=env, text=True, capture_output=True)
            planted_failures.append({"key": key, "rejected": result.returncode != 0, "stderr": result.stderr[:500]})
        verify = source_layer.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-f", verify_sql.as_posix()], cwd=ROOT, env=env, stdout_path=out_dir / "dense_source_room_ecl_review_readback.json")
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
    review_sql_summary = build_review_sql(dense_out_dir, out_dir)
    pg_summary = run_postgres_load(
        out_dir,
        Path(source_sql_summary["load_sql"]),
        Path(context_sql_summary["context_sql"]),
        Path(commercial_sql_summary["commercial_sql"]),
        Path(review_sql_summary["review_sql"]),
        Path(review_sql_summary["verify_sql"]),
        args.keep_postgres,
    )
    readback = pg_summary["readback"]
    expected = review_sql_summary["expected_counts"]
    issues = [
        f"{key}_count_expected_{expected[key]}_got_{readback.get(key)}"
        for key in expected
        if int(readback.get(key, -1)) != int(expected[key])
    ]
    if int(readback.get("review_event", 0)) < 300:
        issues.append("review_event_floor_not_met")
    for drift_key in ["review_source_record_drift", "review_contract_drift", "review_invoice_drift", "review_sla_drift"]:
        if int(readback.get(drift_key, 1)) != 0:
            issues.append(drift_key)
    if any(not failure["rejected"] for failure in pg_summary["planted_failures"]):
        issues.append("planted_failure_not_rejected")
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "boundary": {"azure_load": False, "projection_or_cube_rebuild": False, "product_route_repointing": False},
        "dense_out_dir": dense_out_dir.as_posix(),
        "out_dir": out_dir.as_posix(),
        "source_sql": source_sql_summary,
        "context_sql": context_sql_summary,
        "commercial_sql": commercial_sql_summary,
        "review_sql": review_sql_summary,
        "readback": readback,
        "planted_failures": pg_summary["planted_failures"],
        "issues": issues,
        "status": "pass" if not issues else "fail",
    }
    write_json(out_dir / "dense_source_room_ecl_review_load_summary.json", summary)
    if issues:
        for issue in issues:
            print(f"FAIL: {issue}", file=sys.stderr)
        return 1
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
