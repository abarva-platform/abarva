#!/usr/bin/env python3

"""Load dense source-room extracts through ecl_commercial locally.

Local proof only. This runner loads dense source-room rows into ecl_source,
maps them into ecl_context, and then materializes the commercial contract,
service-line, scope, invoice, and SLA-observation tables in disposable Postgres.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import load_dense_source_room_context_layer as context_layer
import load_dense_source_room_source_layer as source_layer


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DENSE_OUT_DIR = ROOT / "outputs/source-room-depth-catchup-2026-08-23"
DEFAULT_OUT_DIR = ROOT / "reports/ecl-dense-commercial-layer-local-load-2026-08-23"
TENANT_KEY = os.environ.get("ECL_DENSE_TENANT_KEY", source_layer.TENANT_KEY)
ASSESSMENT_ID = os.environ.get("ECL_DENSE_ASSESSMENT_ID", source_layer.ASSESSMENT_ID)
DDL_FILES = [ROOT / "docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql"]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def source_record_id(family: str, row: dict[str, str], index: int) -> str:
    return source_layer.stable_uuid("source_record", family, row.get("source_row_id") or index)


def object_id(object_type: str, object_key: str) -> str:
    return source_layer.stable_uuid("object", object_type, object_key)


def as_num(value: str | None) -> float | None:
    return context_layer.as_num(value)


def sql_date(value: str | None) -> str:
    return source_layer.sql_text(value) if value else "null"


def insert_sql(table: str, columns: list[str], rows: list[dict[str, str]], batch_size: int = 500) -> str:
    if not rows:
        return ""
    chunks: list[str] = []
    for start in range(0, len(rows), batch_size):
        batch = rows[start : start + batch_size]
        values = ",\n".join("(" + ", ".join(row[column] for column in columns) + ")" for row in batch)
        chunks.append(f"insert into {table} ({', '.join(columns)}) values\n{values};")
    return "\n".join(chunks) + "\n"


def service_category(service_tower: str | None) -> str:
    tower = (service_tower or "").lower()
    if "ai" in tower:
        return "ai"
    if "data" in tower:
        return "data"
    if "clinical_apps" in tower:
        return "software"
    if "infra" in tower or "bpo" in tower or "claims" in tower:
        return "managed_service"
    return "professional_service"


def build_commercial_sql(dense_out_dir: Path, out_dir: Path) -> dict[str, Any]:
    manifest = read_csv(dense_out_dir / "dense_source_room_manifest.csv")
    paths = {row["source_room_family"]: dense_out_dir / row["file_path"] for row in manifest}
    contracts_source = read_csv(paths["SP08_Vendor_Contract"])
    finance_source = read_csv(paths["SP06_Finance_ERP"])
    kpi_source = read_csv(paths["SP10_KPI_Operations"])

    contracts: list[dict[str, str]] = []
    service_lines: list[dict[str, str]] = []
    scopes: list[dict[str, str]] = []
    invoice_lines: list[dict[str, str]] = []
    sla_rows: list[dict[str, str]] = []
    contract_id_by_number: dict[str, str] = {}

    for index, row in enumerate(contracts_source, start=1):
        sid = source_record_id("SP08_Vendor_Contract", row, index)
        contract_id = source_layer.stable_uuid("commercial_contract", row["contract_id"])
        service_line_id = source_layer.stable_uuid("commercial_service_line", row["contract_id"], row.get("service_tower"))
        contract_id_by_number[row["contract_id"]] = contract_id
        annual_value = as_num(row.get("annualized_value_usd"))
        contracts.append(
            {
                "id": source_layer.sql_text(contract_id),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "contract_object_id": source_layer.sql_text(object_id("contract", row["contract_id"])),
                "vendor_object_id": source_layer.sql_text(object_id("vendor", row["supplier_name"])),
                "contract_number": source_layer.sql_text(row["contract_id"]),
                "contract_name": source_layer.sql_text(f"{row['supplier_name']} {row['service_tower']} agreement"),
                "contract_type": source_layer.sql_text("master_service_agreement"),
                "start_date": sql_date(row.get("start_date")),
                "end_date": sql_date(row.get("end_date")),
                "renewal_notice_date": "null",
                "annualized_value_usd": source_layer.sql_num(annual_value),
                "total_contract_value_usd": source_layer.sql_num(annual_value * 5 if annual_value is not None else None),
                "currency": source_layer.sql_text("USD"),
                "source_document_id": "null",
                "source_record_id": source_layer.sql_text(sid),
                "basis": source_layer.sql_text("source_recorded"),
                "value_state": source_layer.sql_text("known"),
                "review_state": source_layer.sql_text("not_reviewed"),
                "attributes_json": source_layer.sql_json(
                    {
                        "service_tower": row.get("service_tower"),
                        "notice_window_days": row.get("notice_window_days"),
                        "benchmarking_right": row.get("benchmarking_right"),
                        "synthetic_dataset_id": row.get("synthetic_dataset_id"),
                    }
                ),
            }
        )
        service_lines.append(
            {
                "id": source_layer.sql_text(service_line_id),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "contract_id": source_layer.sql_text(contract_id),
                "service_line_key": source_layer.sql_text(row["service_tower"]),
                "service_category": source_layer.sql_text(service_category(row.get("service_tower"))),
                "description": source_layer.sql_text(f"{row['service_tower']} services under {row['contract_id']}"),
                "annualized_value_usd": source_layer.sql_num(annual_value),
                "value_state": source_layer.sql_text("known"),
                "source_record_id": source_layer.sql_text(sid),
                "document_extraction_id": "null",
                "review_state": source_layer.sql_text("not_reviewed"),
            }
        )
        scoped_apps = [value for value in row.get("scoped_applications", "").split(";") if value]
        allocation_percent = round(100 / len(scoped_apps), 4) if scoped_apps else None
        for app_ref in scoped_apps:
            scopes.append(
                {
                    "id": source_layer.sql_text(source_layer.stable_uuid("commercial_scope", row["contract_id"], app_ref, row.get("service_tower"))),
                    "tenant_key": source_layer.sql_text(TENANT_KEY),
                    "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                    "contract_id": source_layer.sql_text(contract_id),
                    "scoped_object_id": source_layer.sql_text(object_id("application", app_ref)),
                    "scope_type": source_layer.sql_text("application"),
                    "allocation_percent": source_layer.sql_num(allocation_percent),
                    "allocation_amount_usd": source_layer.sql_num(round((annual_value or 0) / len(scoped_apps), 2) if scoped_apps else None),
                    "basis": source_layer.sql_text("source_recorded"),
                    "value_state": source_layer.sql_text("known"),
                    "source_record_id": source_layer.sql_text(sid),
                    "review_state": source_layer.sql_text("not_reviewed"),
                }
            )

    contract_numbers = sorted(contract_id_by_number)
    for index, row in enumerate(finance_source, start=1):
        sid = source_record_id("SP06_Finance_ERP", row, index)
        period_start, period_end, _scenario = context_layer.period_dates(row.get("fiscal_period"))
        supplier = row.get("supplier_name") or "Unknown Supplier"
        contract_number = contract_numbers[index % len(contract_numbers)] if index % 3 == 0 else None
        invoice_lines.append(
            {
                "id": source_layer.sql_text(source_layer.stable_uuid("commercial_invoice", row["source_row_id"])),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "invoice_line_key": source_layer.sql_text(row["source_row_id"]),
                "vendor_object_id": source_layer.sql_text(object_id("vendor", supplier)),
                "contract_id": source_layer.sql_text(contract_id_by_number[contract_number]) if contract_number else "null",
                "cost_center_object_id": "null",
                "period_start": source_layer.sql_text(period_start),
                "period_end": source_layer.sql_text(period_end),
                "amount_usd": source_layer.sql_num(as_num(row.get("actual_usd"))),
                "gl_account": source_layer.sql_text(row.get("account_category")),
                "spend_category": source_layer.sql_text(row.get("account_category")),
                "source_record_id": source_layer.sql_text(sid),
                "basis": source_layer.sql_text("source_recorded"),
                "value_state": source_layer.sql_text("known"),
                "review_state": source_layer.sql_text("not_reviewed"),
                "zero_amount_reason": "null",
            }
        )

    for index, row in enumerate(kpi_source, start=1):
        sid = source_record_id("SP10_KPI_Operations", row, index)
        period_start, period_end, _scenario = context_layer.period_dates(row.get("period"))
        metric_key = "kpi_" + source_layer.hashlib.sha1(row["kpi_name"].encode("utf-8")).hexdigest()[:12]
        scoped_object_id = object_id("application", row["source_application_ref"])
        sla_rows.append(
            {
                "id": source_layer.sql_text(source_layer.stable_uuid("commercial_sla", row["source_row_id"])),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "contract_id": "null",
                "service_line_id": "null",
                "scoped_object_id": source_layer.sql_text(scoped_object_id),
                "metric_key": source_layer.sql_text(metric_key),
                "target_value_number": source_layer.sql_num(as_num(row.get("target_value"))),
                "actual_value_number": source_layer.sql_num(as_num(row.get("kpi_value"))),
                "unit": source_layer.sql_text(row.get("kpi_unit") or "value"),
                "period_start": source_layer.sql_text(period_start),
                "period_end": source_layer.sql_text(period_end),
                "source_record_id": source_layer.sql_text(sid),
                "document_extraction_id": "null",
                "basis": source_layer.sql_text("source_recorded"),
                "value_state": source_layer.sql_text("known"),
                "quality_state": source_layer.sql_text("estimated"),
                "review_state": source_layer.sql_text("not_reviewed"),
            }
        )

    columns = {
        "ecl_commercial.contract": ["id", "tenant_key", "assessment_id", "contract_object_id", "vendor_object_id", "contract_number", "contract_name", "contract_type", "start_date", "end_date", "renewal_notice_date", "annualized_value_usd", "total_contract_value_usd", "currency", "source_document_id", "source_record_id", "basis", "value_state", "review_state", "attributes_json"],
        "ecl_commercial.contract_service_line": ["id", "tenant_key", "assessment_id", "contract_id", "service_line_key", "service_category", "description", "annualized_value_usd", "value_state", "source_record_id", "document_extraction_id", "review_state"],
        "ecl_commercial.contract_scope": ["id", "tenant_key", "assessment_id", "contract_id", "scoped_object_id", "scope_type", "allocation_percent", "allocation_amount_usd", "basis", "value_state", "source_record_id", "review_state"],
        "ecl_commercial.invoice_line": ["id", "tenant_key", "assessment_id", "invoice_line_key", "vendor_object_id", "contract_id", "cost_center_object_id", "period_start", "period_end", "amount_usd", "gl_account", "spend_category", "source_record_id", "basis", "value_state", "review_state", "zero_amount_reason"],
        "ecl_commercial.sla_observation": ["id", "tenant_key", "assessment_id", "contract_id", "service_line_id", "scoped_object_id", "metric_key", "target_value_number", "actual_value_number", "unit", "period_start", "period_end", "source_record_id", "document_extraction_id", "basis", "value_state", "quality_state", "review_state"],
    }
    sql_path = out_dir / "dense_source_room_ecl_commercial_load.sql"
    sql_parts = ["begin;"]
    sql_parts.append(insert_sql("ecl_commercial.contract", columns["ecl_commercial.contract"], contracts))
    sql_parts.append(insert_sql("ecl_commercial.contract_service_line", columns["ecl_commercial.contract_service_line"], service_lines))
    sql_parts.append(insert_sql("ecl_commercial.contract_scope", columns["ecl_commercial.contract_scope"], scopes))
    sql_parts.append(insert_sql("ecl_commercial.invoice_line", columns["ecl_commercial.invoice_line"], invoice_lines))
    sql_parts.append(insert_sql("ecl_commercial.sla_observation", columns["ecl_commercial.sla_observation"], sla_rows))
    sql_parts.append("commit;")
    sql_path.parent.mkdir(parents=True, exist_ok=True)
    sql_path.write_text("\n".join(sql_parts) + "\n", encoding="utf-8")
    verify_sql = out_dir / "dense_source_room_ecl_commercial_verify.sql"
    verify_sql.write_text(
        """
\\pset format unaligned
\\pset tuples_only on
select jsonb_pretty(jsonb_build_object(
  'source_record', (select count(*) from ecl_source.source_record),
  'object', (select count(*) from ecl_context.object),
  'relationship', (select count(*) from ecl_context.relationship),
  'metric_definition', (select count(*) from ecl_context.metric_definition),
  'measure', (select count(*) from ecl_context.measure),
  'contract', (select count(*) from ecl_commercial.contract),
  'contract_service_line', (select count(*) from ecl_commercial.contract_service_line),
  'contract_scope', (select count(*) from ecl_commercial.contract_scope),
  'invoice_line', (select count(*) from ecl_commercial.invoice_line),
  'invoice_lines_with_contract', (select count(*) from ecl_commercial.invoice_line where contract_id is not null),
  'sla_observation', (select count(*) from ecl_commercial.sla_observation),
  'contract_vendor_drift', (
    select count(*) from ecl_commercial.contract c
    left join ecl_context.object v on v.tenant_key = c.tenant_key and v.assessment_id = c.assessment_id and v.id = c.vendor_object_id
    where v.id is null
  ),
  'contract_scope_object_drift', (
    select count(*) from ecl_commercial.contract_scope cs
    left join ecl_context.object o on o.tenant_key = cs.tenant_key and o.assessment_id = cs.assessment_id and o.id = cs.scoped_object_id
    where o.id is null
  ),
  'sla_metric_drift', (
    select count(*) from ecl_commercial.sla_observation s
    left join ecl_context.metric_definition md on md.tenant_key = s.tenant_key and md.metric_key = s.metric_key
    where md.metric_key is null
  )
));
""".strip()
        + "\n",
        encoding="utf-8",
    )
    return {
        "commercial_sql": sql_path.as_posix(),
        "verify_sql": verify_sql.as_posix(),
        "expected_counts": {
            "contract": len(contracts),
            "contract_service_line": len(service_lines),
            "contract_scope": len(scopes),
            "invoice_line": len(invoice_lines),
            "sla_observation": len(sla_rows),
        },
    }


def run_postgres_load(out_dir: Path, source_sql: Path, context_sql: Path, commercial_sql: Path, verify_sql: Path, keep_postgres: bool) -> dict[str, Any]:
    env = source_layer.command_env()
    pg_tmp = Path(source_layer.tempfile.mkdtemp(prefix="ecl-dense-commercial-layer-pg-"))
    port = source_layer.find_open_port()
    db_name = "ecl_dense_commercial_layer_proof"
    commands: list[dict[str, Any]] = []
    pg_started = False
    try:
        commands.append(source_layer.run(["initdb", "-D", (pg_tmp / "data").as_posix(), "--encoding=UTF8", "--locale=C.UTF-8"], cwd=ROOT, env=env, stdout_path=out_dir / "postgres_initdb.log"))
        commands.append(source_layer.run(["pg_ctl", "-D", (pg_tmp / "data").as_posix(), "-l", (out_dir / "postgres.log").as_posix(), "-o", f"-p {port} -k {pg_tmp.as_posix()}", "start"], cwd=ROOT, env=env, stdout_path=out_dir / "postgres_start.log"))
        pg_started = True
        commands.append(source_layer.run(["createdb", "-h", pg_tmp.as_posix(), "-p", str(port), db_name], cwd=ROOT, env=env))
        load_log = out_dir / "dense_source_room_ecl_commercial_load.log"
        for ddl in DDL_FILES:
            commands.append(source_layer.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-f", ddl.as_posix()], cwd=ROOT, env=env, stdout_path=load_log, append=True))
        for sql_path in [source_sql, context_sql, commercial_sql]:
            commands.append(source_layer.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-f", sql_path.as_posix()], cwd=ROOT, env=env, stdout_path=load_log, append=True))
        bad_scope_sql = "insert into ecl_commercial.contract_scope (tenant_key, assessment_id, contract_id, scoped_object_id, scope_type, basis, value_state, review_state) select tenant_key, assessment_id, id, gen_random_uuid(), 'application', 'source_recorded', 'known', 'not_reviewed' from ecl_commercial.contract limit 1;"
        bad_invoice_sql = "insert into ecl_commercial.invoice_line (tenant_key, assessment_id, invoice_line_key, vendor_object_id, period_start, period_end, amount_usd, source_record_id, basis, value_state, review_state) select tenant_key, assessment_id, 'bad-invoice', gen_random_uuid(), '2026-01-01', '2026-01-31', 1, source_record_id, 'source_recorded', 'known', 'not_reviewed' from ecl_commercial.contract limit 1;"
        planted_failures = []
        for key, sql in [("contract_scope_object_fk", bad_scope_sql), ("invoice_vendor_fk", bad_invoice_sql)]:
            result = source_layer.subprocess.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-c", sql], cwd=ROOT, env=env, text=True, capture_output=True)
            planted_failures.append({"key": key, "rejected": result.returncode != 0, "stderr": result.stderr[:500]})
        verify = source_layer.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-f", verify_sql.as_posix()], cwd=ROOT, env=env, stdout_path=out_dir / "dense_source_room_ecl_commercial_readback.json")
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
    commercial_sql_summary = build_commercial_sql(dense_out_dir, out_dir)
    pg_summary = run_postgres_load(
        out_dir,
        Path(source_sql_summary["load_sql"]),
        Path(context_sql_summary["context_sql"]),
        Path(commercial_sql_summary["commercial_sql"]),
        Path(commercial_sql_summary["verify_sql"]),
        args.keep_postgres,
    )
    readback = pg_summary["readback"]
    expected = {**commercial_sql_summary["expected_counts"]}
    issues = [
        f"{key}_count_expected_{expected[key]}_got_{readback.get(key)}"
        for key in expected
        if int(readback.get(key, -1)) != int(expected[key])
    ]
    if int(readback.get("contract", 0)) < 195:
        issues.append("contract_floor_not_met")
    if int(readback.get("invoice_line", 0)) < 400:
        issues.append("invoice_line_floor_not_met")
    if int(readback.get("contract_scope", 0)) < 320:
        issues.append("contract_scope_floor_not_met")
    for drift_key in ["contract_vendor_drift", "contract_scope_object_drift", "sla_metric_drift"]:
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
        "readback": readback,
        "planted_failures": pg_summary["planted_failures"],
        "issues": issues,
        "status": "pass" if not issues else "fail",
    }
    write_json(out_dir / "dense_source_room_ecl_commercial_load_summary.json", summary)
    if issues:
        for issue in issues:
            print(f"FAIL: {issue}", file=sys.stderr)
        return 1
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
