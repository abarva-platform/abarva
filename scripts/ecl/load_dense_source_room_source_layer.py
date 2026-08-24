#!/usr/bin/env python3

"""Load dense source-room extracts into ecl_source in disposable Postgres.

Local proof only. This script generates the dense synthetic source-room package,
builds an ecl_source-only SQL load, applies the ECL physical DDL in a disposable
Postgres instance, loads source_file/source_record/document/document_extraction,
and independently reads row counts back.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import random
import shutil
import socket
import subprocess
import sys
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DENSE_OUT_DIR = ROOT / "outputs/source-room-depth-catchup-2026-08-23"
DEFAULT_OUT_DIR = ROOT / "reports/ecl-dense-source-layer-local-load-2026-08-23"
TENANT_KEY = "meridian-health"
ASSESSMENT_ID = "assessment-dense-source-room-20260823"
DDL_FILES = [ROOT / "docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql"]

DOCUMENT_TYPE_BY_ARTIFACT = {
    "contract_pdf": "contract",
    "interview_note": "interview_notes",
    "cmdb_export": "architecture_doc",
    "finance_extract": "invoice",
    "sla_report": "sla_report",
    "dashboard_export": "architecture_doc",
    "policy_document": "architecture_doc",
    "attestation": "attestation",
}


class CommandFailure(RuntimeError):
    def __init__(self, command: list[str], returncode: int, stdout: str, stderr: str):
        self.command = command
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr
        super().__init__(f"{' '.join(command)} failed with {returncode}: {stderr[:500]}")


def stable_uuid(*parts: object) -> str:
    digest = bytearray(hashlib.sha256("|".join(str(part) for part in parts).encode("utf-8")).digest()[:16])
    digest[6] = (digest[6] & 0x0F) | 0x40
    digest[8] = (digest[8] & 0x3F) | 0x80
    return str(uuid.UUID(bytes=bytes(digest)))


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(path)
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def sql_text(value: object | None) -> str:
    if value is None or value == "":
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def sql_num(value: object | None) -> str:
    if value is None or value == "":
        return "null"
    return str(value)


def sql_json(value: object) -> str:
    return sql_text(json.dumps(value, ensure_ascii=True, sort_keys=True)) + "::jsonb"


def insert_sql(table: str, columns: list[str], rows: list[dict[str, str]], batch_size: int = 500) -> str:
    chunks: list[str] = []
    for start in range(0, len(rows), batch_size):
        batch = rows[start : start + batch_size]
        values = ",\n".join("(" + ", ".join(row[column] for column in columns) + ")" for row in batch)
        chunks.append(f"insert into {table} ({', '.join(columns)}) values\n{values};")
    return "\n".join(chunks) + "\n"


def command_env() -> dict[str, str]:
    env = os.environ.copy()
    env.update(
        {
            "LANG": "C.UTF-8",
            "LC_ALL": "C.UTF-8",
            "LC_CTYPE": "C.UTF-8",
            "LC_COLLATE": "C.UTF-8",
            "LC_MESSAGES": "C.UTF-8",
            "LC_MONETARY": "C.UTF-8",
            "LC_NUMERIC": "C.UTF-8",
            "LC_TIME": "C.UTF-8",
        }
    )
    return env


def run(command: list[str], *, cwd: Path, env: dict[str, str], stdout_path: Path | None = None, append: bool = False) -> dict[str, Any]:
    result = subprocess.run(command, cwd=cwd, env=env, text=True, capture_output=True)
    if stdout_path:
        stdout_path.parent.mkdir(parents=True, exist_ok=True)
        mode = "a" if append else "w"
        with stdout_path.open(mode, encoding="utf-8") as handle:
            handle.write(result.stdout)
            if result.stderr:
                handle.write("\n-- stderr --\n")
                handle.write(result.stderr)
    if result.returncode != 0:
        raise CommandFailure(command, result.returncode, result.stdout, result.stderr)
    return {"command": command, "returncode": result.returncode, "stdout": result.stdout, "stderr": result.stderr}


def find_open_port() -> int:
    for _ in range(100):
        port = random.randint(25432, 35432)
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            if sock.connect_ex(("127.0.0.1", port)) != 0:
                return port
    raise RuntimeError("no open port found for disposable Postgres")


def generate_dense_package(dense_out_dir: Path) -> None:
    run([sys.executable, "scripts/ecl/generate_dense_source_room_extracts.py", "--out-dir", dense_out_dir.as_posix()], cwd=ROOT, env=command_env())
    run([sys.executable, "scripts/ecl/validate_dense_source_room_extracts.py", "--out-dir", dense_out_dir.as_posix()], cwd=ROOT, env=command_env())


def review_state(value: str) -> str:
    return "in_review" if value == "needs_follow_up" else "not_reviewed"


def page_number(value: str) -> int | None:
    if not value:
        return None
    digits = "".join(char for char in value if char.isdigit())
    return int(digits) if digits else None


def build_sql(dense_out_dir: Path, out_dir: Path) -> dict[str, Any]:
    manifest = read_csv(dense_out_dir / "dense_source_room_manifest.csv")
    source_file_rows: list[dict[str, str]] = []
    source_record_rows: list[dict[str, str]] = []
    document_rows: list[dict[str, str]] = []
    extraction_rows: list[dict[str, str]] = []
    file_id_by_family: dict[str, str] = {}
    counts_by_family: dict[str, int] = {}

    for manifest_row in manifest:
        family = manifest_row["source_room_family"]
        file_path = dense_out_dir / manifest_row["file_path"]
        file_id = stable_uuid("source_file", family, manifest_row["sha256"])
        file_id_by_family[family] = file_id
        rows = read_csv(file_path)
        counts_by_family[family] = len(rows)
        source_file_rows.append(
            {
                "id": sql_text(file_id),
                "tenant_key": sql_text(TENANT_KEY),
                "assessment_id": sql_text(ASSESSMENT_ID),
                "source_type": sql_text("synthetic_source_room"),
                "origin": sql_text("synthetic_generator"),
                "source_owner": sql_text(family),
                "file_name": sql_text(file_path.name),
                "blob_uri": sql_text(file_path.as_posix()),
                "file_hash": sql_text(manifest_row["sha256"]),
                "source_date": sql_text("2026-08-23"),
                "access_class": sql_text("internal"),
                "quality_state": sql_text("partial"),
                "metadata_json": sql_json(
                    {
                        "source_room_family": family,
                        "row_grain": manifest_row["row_grain"],
                        "synthetic_dataset_id": "SOURCE_ROOM_DENSE_CATCHUP_2026_08_23",
                        "client_attestation_state": "not_client_attested",
                    }
                ),
            }
        )
        for index, row in enumerate(rows, start=1):
            source_record_id = stable_uuid("source_record", family, row.get("source_row_id") or index)
            source_record_rows.append(
                {
                    "id": sql_text(source_record_id),
                    "tenant_key": sql_text(TENANT_KEY),
                    "assessment_id": sql_text(ASSESSMENT_ID),
                    "source_file_id": sql_text(file_id),
                    "native_id": sql_text(row.get("source_row_id") or f"{family}-{index:05d}"),
                    "record_type": sql_text(family),
                    "row_number": sql_num(index),
                    "payload_json": sql_json(row),
                    "parse_state": sql_text("partial" if row.get("source_basis") == "known_gap" else "parsed"),
                    "parse_notes": sql_text("synthetic_not_client_attested"),
                }
            )
            if family == "SP01_Documents_Interviews":
                document_id = stable_uuid("document", family, row.get("interview_id") or index)
                document_rows.append(
                    {
                        "id": sql_text(document_id),
                        "tenant_key": sql_text(TENANT_KEY),
                        "assessment_id": sql_text(ASSESSMENT_ID),
                        "source_file_id": sql_text(file_id),
                        "document_key": sql_text(f"INT-DOC-{index:04d}"),
                        "document_type": sql_text("interview_notes"),
                        "title": sql_text(f"{row.get('interviewee_role', 'Interview')} - {row.get('theme', 'theme')}"),
                        "file_hash": sql_text(stable_uuid("document_hash", family, index).replace("-", "")),
                        "page_count": sql_num(1),
                        "effective_date": sql_text("2026-08-23"),
                        "access_class": sql_text("internal"),
                        "review_state": sql_text(review_state(row.get("review_state", ""))),
                    }
                )
            elif family == "SP12_Evidence_Room":
                document_id = stable_uuid("document", family, row.get("evidence_id") or index)
                artifact_type = row.get("artifact_type", "")
                doc_type = DOCUMENT_TYPE_BY_ARTIFACT.get(artifact_type, "architecture_doc")
                document_rows.append(
                    {
                        "id": sql_text(document_id),
                        "tenant_key": sql_text(TENANT_KEY),
                        "assessment_id": sql_text(ASSESSMENT_ID),
                        "source_file_id": sql_text(file_id),
                        "document_key": sql_text(row.get("evidence_id") or f"EVID-{index:04d}"),
                        "document_type": sql_text(doc_type),
                        "title": sql_text(f"{artifact_type.replace('_', ' ').title()} {index:04d}"),
                        "file_hash": sql_text(stable_uuid("document_hash", family, index).replace("-", "")),
                        "page_count": sql_num(18 if artifact_type == "contract_pdf" else 4),
                        "effective_date": sql_text(row.get("document_date") or "2026-08-23"),
                        "access_class": sql_text("internal"),
                        "review_state": sql_text(review_state(row.get("review_state", ""))),
                    }
                )
                if row.get("page_ref") and row.get("span_ref"):
                    extraction_rows.append(
                        {
                            "id": sql_text(stable_uuid("document_extraction", family, row.get("evidence_id") or index)),
                            "tenant_key": sql_text(TENANT_KEY),
                            "assessment_id": sql_text(ASSESSMENT_ID),
                            "document_id": sql_text(document_id),
                            "field_key": sql_text(f"{artifact_type}_supporting_subject"),
                            "extracted_value": sql_text(row.get("supports_object_ref") or artifact_type),
                            "normalized_value_json": sql_json({"supports_object_ref": row.get("supports_object_ref"), "artifact_type": artifact_type}),
                            "page_number": sql_num(page_number(row.get("page_ref", ""))),
                            "span_reference": sql_text(row.get("span_ref")),
                            "basis": sql_text("document_extracted"),
                            "confidence": sql_num(round(0.71 + (index % 23) / 100, 4)),
                            "human_verification_state": sql_text("unverified"),
                        }
                    )

    sql = "\n".join(
        [
            "begin;",
            insert_sql(
                "ecl_source.source_file",
                ["id", "tenant_key", "assessment_id", "source_type", "origin", "source_owner", "file_name", "blob_uri", "file_hash", "source_date", "access_class", "quality_state", "metadata_json"],
                source_file_rows,
            ),
            insert_sql(
                "ecl_source.source_record",
                ["id", "tenant_key", "assessment_id", "source_file_id", "native_id", "record_type", "row_number", "payload_json", "parse_state", "parse_notes"],
                source_record_rows,
            ),
            insert_sql(
                "ecl_source.document",
                ["id", "tenant_key", "assessment_id", "source_file_id", "document_key", "document_type", "title", "file_hash", "page_count", "effective_date", "access_class", "review_state"],
                document_rows,
            ),
            insert_sql(
                "ecl_source.document_extraction",
                ["id", "tenant_key", "assessment_id", "document_id", "field_key", "extracted_value", "normalized_value_json", "page_number", "span_reference", "basis", "confidence", "human_verification_state"],
                extraction_rows,
            ),
            "commit;",
        ]
    )
    load_sql_path = out_dir / "dense_source_room_ecl_source_load.sql"
    load_sql_path.parent.mkdir(parents=True, exist_ok=True)
    load_sql_path.write_text(sql, encoding="utf-8")

    verify_sql_path = out_dir / "dense_source_room_ecl_source_verify.sql"
    verify_sql_path.write_text(
        """
\\pset format unaligned
\\pset tuples_only on
select jsonb_pretty(jsonb_build_object(
  'source_file', (select count(*) from ecl_source.source_file),
  'source_record', (select count(*) from ecl_source.source_record),
  'document', (select count(*) from ecl_source.document),
  'document_extraction', (select count(*) from ecl_source.document_extraction),
  'source_record_partial', (select count(*) from ecl_source.source_record where parse_state = 'partial'),
  'extraction_distinct_spans', (select count(distinct span_reference) from ecl_source.document_extraction),
  'client_attested_rows', (select count(*) from ecl_source.source_record where payload_json ->> 'client_attestation_state' <> 'not_client_attested')
));
""".strip()
        + "\n",
        encoding="utf-8",
    )
    return {
        "load_sql": load_sql_path.as_posix(),
        "verify_sql": verify_sql_path.as_posix(),
        "expected_counts": {
            "source_file": len(source_file_rows),
            "source_record": len(source_record_rows),
            "document": len(document_rows),
            "document_extraction": len(extraction_rows),
        },
        "counts_by_family": counts_by_family,
    }


def parse_readback(raw: str) -> dict[str, Any]:
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError(f"readback did not contain a JSON object: {raw[:500]}")
    return json.loads(raw[start : end + 1])


def run_postgres_load(out_dir: Path, load_sql: Path, verify_sql: Path, keep_postgres: bool) -> dict[str, Any]:
    env = command_env()
    pg_tmp = Path(tempfile.mkdtemp(prefix="ecl-dense-source-layer-pg-"))
    port = find_open_port()
    db_name = "ecl_dense_source_layer_proof"
    commands: list[dict[str, Any]] = []
    pg_started = False
    try:
        commands.append(run(["initdb", "-D", (pg_tmp / "data").as_posix(), "--encoding=UTF8", "--locale=C.UTF-8"], cwd=ROOT, env=env, stdout_path=out_dir / "postgres_initdb.log"))
        commands.append(
            run(
                ["pg_ctl", "-D", (pg_tmp / "data").as_posix(), "-l", (out_dir / "postgres.log").as_posix(), "-o", f"-p {port} -k {pg_tmp.as_posix()}", "start"],
                cwd=ROOT,
                env=env,
                stdout_path=out_dir / "postgres_start.log",
            )
        )
        pg_started = True
        commands.append(run(["createdb", "-h", pg_tmp.as_posix(), "-p", str(port), db_name], cwd=ROOT, env=env))
        load_log = out_dir / "dense_source_room_ecl_source_load.log"
        for ddl in DDL_FILES:
            commands.append(run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-f", ddl.as_posix()], cwd=ROOT, env=env, stdout_path=load_log, append=True))
        commands.append(run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-f", load_sql.as_posix()], cwd=ROOT, env=env, stdout_path=load_log, append=True))
        verify = run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-f", verify_sql.as_posix()], cwd=ROOT, env=env, stdout_path=out_dir / "dense_source_room_ecl_source_readback.json")
        readback = parse_readback(verify["stdout"])
    finally:
        if pg_started:
            try:
                commands.append(run(["pg_ctl", "-D", (pg_tmp / "data").as_posix(), "stop", "-m", "fast"], cwd=ROOT, env=env, stdout_path=out_dir / "postgres_stop.log"))
            except CommandFailure:
                pass
        if not keep_postgres:
            shutil.rmtree(pg_tmp, ignore_errors=True)
    return {"commands": commands, "postgres": {"socket_dir": pg_tmp.as_posix(), "port": port, "kept": keep_postgres}, "readback": readback}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dense-out-dir", type=Path, default=DEFAULT_DENSE_OUT_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--keep-postgres", action="store_true")
    args = parser.parse_args()
    dense_out_dir = args.dense_out_dir.resolve()
    out_dir = args.out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    generate_dense_package(dense_out_dir)
    sql_summary = build_sql(dense_out_dir, out_dir)
    pg_summary = run_postgres_load(out_dir, Path(sql_summary["load_sql"]), Path(sql_summary["verify_sql"]), args.keep_postgres)
    expected = sql_summary["expected_counts"]
    readback = pg_summary["readback"]
    issues = [
        f"{key}_count_expected_{expected[key]}_got_{readback.get(key)}"
        for key in expected
        if int(readback.get(key, -1)) != int(expected[key])
    ]
    if int(readback.get("client_attested_rows", 1)) != 0:
        issues.append("client_attested_rows_must_be_zero")
    if int(readback.get("extraction_distinct_spans", 0)) < 200:
        issues.append("document_extraction_spans_too_thin")
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "boundary": {
            "azure_load": False,
            "canonical_context_load": False,
            "projection_or_cube_rebuild": False,
            "product_route_repointing": False,
        },
        "dense_out_dir": dense_out_dir.as_posix(),
        "out_dir": out_dir.as_posix(),
        "sql": sql_summary,
        "readback": readback,
        "issues": issues,
        "status": "pass" if not issues else "fail",
    }
    write_json(out_dir / "dense_source_room_ecl_source_load_summary.json", summary)
    if issues:
        for issue in issues:
            print(f"FAIL: {issue}", file=sys.stderr)
        return 1
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
