#!/usr/bin/env python3

"""Run the ECL commercial-family load against an explicitly safe target.

This is the local/disposable execution runner for the commercial Source slice.
It is intended to be the script an ACA data-build job calls later, but this
implementation does not submit ACA jobs, does not mutate Azure by itself, does
not repoint product routes, and does not deploy anything.

Execute mode is deliberately fail-closed:
- the merged preflight run contract and readback contract must exist;
- an explicit approved gate manifest must match that contract;
- committed proof hashes must still match the files on disk;
- the idempotency key must be present and match;
- the target database must be marked local_disposable or lab_preprod by config;
- tests use only a disposable local Postgres instance.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse


FAMILY = "vendor_contract_commercial"
TENANT_KEY = "meridian-health"
ASSESSMENT_ID = "assessment-commercial-contract-supply"
DEFAULT_OUT_DIR = Path("reports/ecl-commercial-family-local-load-2026-08-23")
DEFAULT_PREFLIGHT_DIR = Path("reports/ecl-commercial-lab-load-preflight-2026-08-23")
DEFAULT_RUN_CONTRACT = DEFAULT_PREFLIGHT_DIR / "ecl_commercial_lab_load_run_contract.json"
DEFAULT_READBACK_CONTRACT = DEFAULT_PREFLIGHT_DIR / "ecl_commercial_lab_load_readback_contract.json"
DEFAULT_GATE_TEMPLATE = DEFAULT_PREFLIGHT_DIR / "ecl_commercial_lab_load_gate_manifest.template.json"
GENERATED_PROOF_SUBDIR = "generated_commercial_proof"
RELEASE_RECORD = "docs/releases/records/2026-08-23-ecl-commercial-family-local-load-runner.md"
DDL_FILES = [
    Path("docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql"),
    Path("docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql"),
    Path("docs/architecture/sql-drafts/ecl_cube_read_models_v1_draft.sql"),
    Path("docs/architecture/sql-drafts/ecl_metric_dictionary_seed_v1_draft.sql"),
]

DELETE_TABLES = [
    "ecl_projection.cube_slice_measure",
    "ecl_projection.cube_slice_metric",
    "ecl_projection.cube_slice",
    "ecl_projection.cube_manifest",
    "ecl_projection.tower_command_center",
    "ecl_projection.source_event_workspace",
    "ecl_projection.source_value_levers",
    "ecl_projection.source_vendor_360",
    "ecl_projection.source_contract_360",
    "ecl_projection.projection_manifest",
    "ecl_review.review_event",
    "ecl_commercial.sla_observation",
    "ecl_commercial.invoice_line",
    "ecl_commercial.contract_scope",
    "ecl_commercial.contract_service_line",
    "ecl_commercial.contract",
    "ecl_context.context_pack",
    "ecl_context.snapshot",
    "ecl_context.measure",
    "ecl_context.relationship",
    "ecl_context.object",
    "ecl_source.document_extraction",
    "ecl_source.document",
    "ecl_source.source_record",
    "ecl_source.source_file",
]

EXPECTED_COUNT_MAP = {
    "source_files": "ecl_source.source_file",
    "source_records": "ecl_source.source_record",
    "documents": "ecl_source.document",
    "document_extractions": "ecl_source.document_extraction",
    "contracts": "ecl_commercial.contract",
    "service_lines": "ecl_commercial.contract_service_line",
    "contract_scope": "ecl_commercial.contract_scope",
    "invoice_lines": "ecl_commercial.invoice_line",
    "sla_observations": "ecl_commercial.sla_observation",
    "source_contract_360_rows": "ecl_projection.source_contract_360",
    "source_vendor_360_rows": "ecl_projection.source_vendor_360",
    "source_value_levers_rows": "ecl_projection.source_value_levers",
    "source_event_workspace_rows": "ecl_projection.source_event_workspace",
}

SAFE_LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1"}
LOCAL_MARKER = "ECL_LOCAL_DISPOSABLE_DB"
LAB_PREPROD_MARKER = "ECL_LAB_PREPROD_DB_CONFIRMED"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def file_sha(path: Path) -> str:
    import hashlib

    return hashlib.sha256(path.read_bytes()).hexdigest()


def repo_relative(path: Path) -> str:
    try:
        return path.relative_to(Path.cwd()).as_posix()
    except ValueError:
        return path.as_posix()


def as_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "y"}


class Refusal(RuntimeError):
    def __init__(self, issues: list[str]):
        self.issues = issues
        super().__init__("; ".join(issues))


class CommandFailure(RuntimeError):
    def __init__(self, command: list[str], returncode: int, stdout: str, stderr: str):
        self.command = command
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr
        super().__init__(stderr or stdout or f"command failed with exit {returncode}")


def run_command(command: list[str], *, cwd: Path, env: dict[str, str] | None = None) -> str:
    proc = subprocess.run(command, cwd=cwd, capture_output=True, text=True, env=env)
    if proc.returncode != 0:
        raise CommandFailure(command, proc.returncode, proc.stdout.strip(), proc.stderr.strip())
    return proc.stdout


def psql(database_url: str, args: list[str], *, cwd: Path, input_sql: str | None = None) -> str:
    command = ["psql", database_url, *args]
    proc = subprocess.run(command, cwd=cwd, input=input_sql, capture_output=True, text=True)
    if proc.returncode != 0:
        redacted = ["psql", "<redacted-database-url>", *args]
        raise CommandFailure(redacted, proc.returncode, proc.stdout.strip(), proc.stderr.strip())
    return proc.stdout


def load_target_config(path: Path | None) -> dict[str, Any]:
    config: dict[str, Any] = {}
    if path:
        if not path.exists():
            raise Refusal([f"target_config_not_found:{path.as_posix()}"])
        config.update(read_json(path))
    env_url_name = str(config.get("database_url_env") or "ECL_COMMERCIAL_TARGET_DATABASE_URL")
    if "database_url" not in config and os.environ.get(env_url_name):
        config["database_url"] = os.environ[env_url_name]
    config.setdefault("target_environment", os.environ.get("ECL_COMMERCIAL_TARGET_ENV", ""))
    config.setdefault("target_safety_marker", os.environ.get("ECL_COMMERCIAL_TARGET_SAFETY_MARKER", ""))
    config.setdefault("allow_database_write", os.environ.get("ECL_COMMERCIAL_ALLOW_DATABASE_WRITE", ""))
    config.setdefault("operator_approval_reference", os.environ.get("ECL_COMMERCIAL_OPERATOR_APPROVAL_REFERENCE", ""))
    return config


def target_is_local_disposable(database_url: str) -> bool:
    parsed = urlparse(database_url)
    query = parse_qs(parsed.query)
    socket_hosts = query.get("host", [])
    has_socket_host = any(value.startswith(("/tmp", "/var/folders", "/private/tmp")) for value in socket_hosts)
    return (parsed.hostname or "").lower() in SAFE_LOCAL_HOSTS or has_socket_host


def validate_target_config(config: dict[str, Any]) -> tuple[str, str]:
    issues: list[str] = []
    database_url = str(config.get("database_url") or "").strip()
    target_environment = str(config.get("target_environment") or "").strip()
    marker = str(config.get("target_safety_marker") or "").strip()

    if not database_url:
        issues.append("missing_target_database_url")
    if as_bool(config.get("allow_database_write")) is not True:
        issues.append("target_database_write_not_explicitly_allowed")
    if target_environment not in {"local_disposable", "lab_preprod"}:
        issues.append("target_environment_must_be_local_disposable_or_lab_preprod")

    if database_url and target_environment == "local_disposable":
        if marker != LOCAL_MARKER:
            issues.append("local_disposable_target_marker_mismatch")
        if not target_is_local_disposable(database_url):
            issues.append("local_disposable_target_must_use_localhost_or_socket")

    if database_url and target_environment == "lab_preprod":
        if marker != LAB_PREPROD_MARKER:
            issues.append("lab_preprod_target_marker_mismatch")
        approval_ref = str(config.get("operator_approval_reference") or "").strip()
        if not approval_ref or approval_ref.startswith("fill-in"):
            issues.append("lab_preprod_requires_operator_approval_reference")

    if issues:
        raise Refusal(issues)
    return database_url, target_environment


def validate_hashes(expected_hashes: dict[str, str]) -> list[str]:
    issues: list[str] = []
    for rel_path, expected_hash in sorted(expected_hashes.items()):
        path = Path(rel_path)
        if not path.exists():
            issues.append(f"expected_local_proof_file_missing:{rel_path}")
            continue
        current_hash = file_sha(path)
        if current_hash != expected_hash:
            issues.append(f"expected_local_proof_hash_mismatch:{rel_path}")
    return issues


def validate_contracts(run_contract_path: Path, readback_contract_path: Path, gate_path: Path | None, *, mode: str) -> dict[str, Any]:
    issues: list[str] = []
    if not run_contract_path.exists():
        issues.append(f"missing_run_contract:{run_contract_path.as_posix()}")
    if not readback_contract_path.exists():
        issues.append(f"missing_readback_contract:{readback_contract_path.as_posix()}")
    if issues:
        raise Refusal(issues)

    run_contract = read_json(run_contract_path)
    readback_contract = read_json(readback_contract_path)
    expected_hashes = run_contract.get("expected_local_proof_hashes")
    if not isinstance(expected_hashes, dict) or not expected_hashes:
        issues.append("missing_expected_local_proof_hashes")

    for name, value in [
        ("family", run_contract.get("family")),
        ("tenant_scope", run_contract.get("tenant_scope")),
        ("idempotency_key", run_contract.get("idempotency_key")),
        ("input_source_version", run_contract.get("input_source_version")),
        ("build_version", run_contract.get("build_version")),
    ]:
        if not value:
            issues.append(f"missing_run_contract_field:{name}")

    if run_contract.get("family") != FAMILY:
        issues.append("wrong_family")
    if run_contract.get("tenant_scope") != TENANT_KEY:
        issues.append("wrong_tenant")
    if readback_contract.get("family") != FAMILY:
        issues.append("readback_contract_wrong_family")
    if readback_contract.get("tenant_scope") != TENANT_KEY:
        issues.append("readback_contract_wrong_tenant")
    if readback_contract.get("comparison_type") != "row_for_row_against_local_commercial_proof":
        issues.append("readback_contract_wrong_comparison_type")

    if isinstance(expected_hashes, dict):
        issues.extend(validate_hashes(expected_hashes))

    gate: dict[str, Any] | None = None
    if mode == "execute":
        if gate_path is None:
            issues.append("missing_gate_manifest")
        elif not gate_path.exists():
            issues.append(f"gate_manifest_not_found:{gate_path.as_posix()}")
        else:
            gate = read_json(gate_path)
            if gate.get("approved") is not True:
                issues.append("gate_not_approved")
            if gate.get("approval_file_purpose") != "operator_gate_manifest":
                issues.append("gate_manifest_not_operator_approval")
            for field in ["family", "tenant_scope", "idempotency_key", "input_source_version", "build_version"]:
                if gate.get(field) != run_contract.get(field):
                    issues.append(f"gate_{field}_mismatch")
            gate_hashes = gate.get("expected_local_proof_hashes")
            if not isinstance(gate_hashes, dict):
                issues.append("gate_missing_expected_local_proof_hashes")
            elif gate_hashes != expected_hashes:
                issues.append("gate_expected_local_proof_hashes_mismatch")
            readback_ref = gate.get("readback_contract")
            if not isinstance(readback_ref, dict):
                issues.append("gate_readback_contract_missing")
            else:
                ref_path = Path(str(readback_ref.get("path") or ""))
                if ref_path.as_posix() != readback_contract_path.as_posix():
                    issues.append("gate_readback_contract_path_mismatch")
                elif readback_ref.get("sha256") != file_sha(readback_contract_path):
                    issues.append("gate_readback_contract_hash_mismatch")
            acknowledgements = gate.get("acknowledgements")
            if not isinstance(acknowledgements, dict) or not all(value is True for value in acknowledgements.values()):
                issues.append("gate_acknowledgements_incomplete")

    if issues:
        raise Refusal(issues)

    return {
        "gate": gate,
        "readback_contract": readback_contract,
        "run_contract": run_contract,
    }


def build_commercial_sql(out_dir: Path) -> dict[str, Any]:
    generated_dir = out_dir / GENERATED_PROOF_SUBDIR
    generated_dir.mkdir(parents=True, exist_ok=True)
    run_command(
        [sys.executable, "scripts/ecl/build_commercial_contract_slice.py", "--out-dir", generated_dir.as_posix()],
        cwd=Path.cwd(),
    )
    load_sql = generated_dir / "commercial_contract_supply_ecl_load.sql"
    if not load_sql.exists():
        raise Refusal([f"generated_load_sql_missing:{load_sql.as_posix()}"])
    return {
        "generated_dir": generated_dir,
        "load_sql": load_sql,
        "summary": read_json(generated_dir / "commercial_contract_supply_manifest.json"),
    }


def write_cleanup_sql(path: Path) -> None:
    lines = ["begin;"]
    for table in DELETE_TABLES:
        lines.append(
            f"delete from {table} where tenant_key = '{TENANT_KEY}' and assessment_id = '{ASSESSMENT_ID}';"
        )
    lines.append("commit;")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def ensure_operator_table(database_url: str) -> None:
    sql = """
create schema if not exists ecl_operator;
create table if not exists ecl_operator.commercial_family_load_run (
  idempotency_key text primary key,
  tenant_key text not null,
  assessment_id text not null,
  family text not null,
  target_environment text not null,
  input_source_version text not null,
  build_version text not null,
  run_count integer not null default 0,
  last_loaded_at timestamptz not null,
  row_count_json jsonb not null,
  quality_gate_json jsonb not null
);
"""
    psql(database_url, ["-v", "ON_ERROR_STOP=1", "-c", sql], cwd=Path.cwd())


def read_scalar_rows(database_url: str, sql: str) -> dict[str, int]:
    out = psql(database_url, ["-A", "-t", "-F", "|", "-c", sql], cwd=Path.cwd())
    rows: dict[str, int] = {}
    for line in out.splitlines():
        if not line.strip():
            continue
        key, value = line.split("|", 1)
        rows[key] = int(float(value))
    return rows


def read_counts(database_url: str) -> dict[str, int]:
    union_sql = "\nunion all\n".join(
        [
            f"select '{key}' as name, count(*)::bigint as value from {table} "
            f"where tenant_key = '{TENANT_KEY}' and assessment_id = '{ASSESSMENT_ID}'"
            for key, table in EXPECTED_COUNT_MAP.items()
        ]
    )
    return read_scalar_rows(database_url, union_sql)


def read_quality(database_url: str) -> dict[str, int]:
    sql = f"""
select 'gap_flagged_contract_rows', count(*)::bigint
from ecl_projection.source_contract_360
where tenant_key = '{TENANT_KEY}' and assessment_id = '{ASSESSMENT_ID}'
  and jsonb_array_length(gap_flags_json) > 0
union all
select 'gated_value_levers_with_blocked_value', count(*)::bigint
from ecl_projection.source_value_levers
where tenant_key = '{TENANT_KEY}' and assessment_id = '{ASSESSMENT_ID}'
  and value_gate_status = 'gated'
  and blocked_value_usd > 0
  and claimable_value_usd = 0
union all
select 'unknown_zero_measure_rows', count(*)::bigint
from ecl_context.measure
where tenant_key = '{TENANT_KEY}' and assessment_id = '{ASSESSMENT_ID}'
  and coalesce(value_number, 999999999) = 0
  and (
    value_state ilike '%unknown%'
    or quality_state ilike '%unknown%'
    or review_state ilike '%unknown%'
  )
union all
select 'zero_invoice_lines_without_reason', count(*)::bigint
from ecl_commercial.invoice_line
where tenant_key = '{TENANT_KEY}' and assessment_id = '{ASSESSMENT_ID}'
  and amount_usd = 0
  and zero_amount_reason is null
union all
select 'not_reviewed_or_estimated_measures', count(*)::bigint
from ecl_context.measure
where tenant_key = '{TENANT_KEY}' and assessment_id = '{ASSESSMENT_ID}'
  and (quality_state = 'estimated' or review_state = 'not_reviewed');
"""
    return read_scalar_rows(database_url, sql)


def upsert_operator_run(
    database_url: str,
    *,
    run_contract: dict[str, Any],
    target_environment: str,
    actual_counts: dict[str, int],
    quality: dict[str, int],
) -> int:
    def sql_literal(value: Any) -> str:
        if isinstance(value, dict):
            value = json.dumps(value, sort_keys=True)
        return "'" + str(value).replace("'", "''") + "'"

    payload = {
        "idempotency_key": run_contract["idempotency_key"],
        "tenant_key": TENANT_KEY,
        "assessment_id": ASSESSMENT_ID,
        "family": FAMILY,
        "target_environment": target_environment,
        "input_source_version": run_contract["input_source_version"],
        "build_version": run_contract["build_version"],
        "row_count_json": actual_counts,
        "quality_gate_json": quality,
    }
    sql = """
with upserted as (
  insert into ecl_operator.commercial_family_load_run (
    idempotency_key,
    tenant_key,
    assessment_id,
    family,
    target_environment,
    input_source_version,
    build_version,
    run_count,
    last_loaded_at,
    row_count_json,
    quality_gate_json
  )
  values (
    {idempotency_key},
    {tenant_key},
    {assessment_id},
    {family},
    {target_environment},
    {input_source_version},
    {build_version},
    1,
    now(),
    {row_count_json}::jsonb,
    {quality_gate_json}::jsonb
  )
  on conflict (idempotency_key) do update set
    run_count = ecl_operator.commercial_family_load_run.run_count + 1,
    last_loaded_at = excluded.last_loaded_at,
    row_count_json = excluded.row_count_json,
    quality_gate_json = excluded.quality_gate_json
  returning run_count
)
select run_count from upserted;
""".format(**{key: sql_literal(value) for key, value in payload.items()})
    out = psql(database_url, ["-A", "-t", "-c", sql], cwd=Path.cwd())
    return int(out.strip().splitlines()[-1])


def apply_load(
    database_url: str,
    target_environment: str,
    generated: dict[str, Any],
    run_contract: dict[str, Any],
    readback_contract: dict[str, Any],
    out_dir: Path,
) -> dict[str, Any]:
    load_log = out_dir / "ecl_commercial_family_load_psql.log"
    cleanup_sql = out_dir / "ecl_commercial_family_load_cleanup.sql"
    write_cleanup_sql(cleanup_sql)

    commands: list[dict[str, Any]] = []
    for ddl in DDL_FILES:
        psql(database_url, ["-v", "ON_ERROR_STOP=1", "-f", ddl.as_posix()], cwd=Path.cwd())
        commands.append({"kind": "ddl", "path": ddl.as_posix()})
    psql(database_url, ["-v", "ON_ERROR_STOP=1", "-f", cleanup_sql.as_posix()], cwd=Path.cwd())
    commands.append({"kind": "cleanup", "path": repo_relative(cleanup_sql)})
    psql(database_url, ["-v", "ON_ERROR_STOP=1", "-f", generated["load_sql"].as_posix()], cwd=Path.cwd())
    commands.append({"kind": "load", "path": repo_relative(generated["load_sql"])})

    ensure_operator_table(database_url)
    actual_counts = read_counts(database_url)
    expected_counts = readback_contract.get("expected_counts", {})
    parity = {
        key: {
            "expected": int(expected_counts[key]),
            "actual": actual_counts.get(key),
            "match": actual_counts.get(key) == int(expected_counts[key]),
        }
        for key in EXPECTED_COUNT_MAP
        if key in expected_counts
    }
    quality = read_quality(database_url)
    quality_pass = (
        quality.get("gap_flagged_contract_rows", 0) > 0
        and quality.get("gated_value_levers_with_blocked_value", 0) > 0
        and quality.get("unknown_zero_measure_rows", -1) == 0
        and quality.get("zero_invoice_lines_without_reason", -1) == 0
    )
    run_count = upsert_operator_run(
        database_url,
        run_contract=run_contract,
        target_environment=target_environment,
        actual_counts=actual_counts,
        quality=quality,
    )
    readback = {
        "accepted": all(item["match"] for item in parity.values()) and quality_pass,
        "actual_counts": actual_counts,
        "commands": commands,
        "comparison_type": readback_contract.get("comparison_type"),
        "expected_counts": {key: int(value) for key, value in expected_counts.items() if key in EXPECTED_COUNT_MAP},
        "generated_at": now_iso(),
        "idempotency_key": run_contract["idempotency_key"],
        "idempotent_run_count": run_count,
        "load_log": repo_relative(load_log),
        "parity": parity,
        "quality": quality,
        "quality_pass": quality_pass,
        "target_environment": target_environment,
        "tenant_key": TENANT_KEY,
    }
    write_json(out_dir / "ecl_commercial_family_load_readback.json", readback)
    load_log.write_text(json.dumps({"commands": commands}, indent=2) + "\n", encoding="utf-8")
    return readback


def write_refusal(out_dir: Path, issues: list[str], mode: str) -> None:
    write_json(
        out_dir / "ecl_commercial_family_load_refusal.json",
        {
            "accepted": False,
            "actual_azure_execution": False,
            "actual_database_write": False,
            "generated_at": now_iso(),
            "issues": issues,
            "mode": mode,
            "reason": "commercial_family_load_refused",
        },
    )


def write_dry_run_outputs(out_dir: Path, contracts: dict[str, Any]) -> None:
    run_contract = contracts["run_contract"]
    readback_contract = contracts["readback_contract"]
    progress = {
        "accepted": True,
        "actual_azure_execution": False,
        "actual_database_write": False,
        "generated_at": now_iso(),
        "overall_percent_complete": 34,
        "source": "ecl_commercial_family_local_load_runner",
        "steps": [
            {
                "evidence": [repo_relative(DEFAULT_RUN_CONTRACT), repo_relative(DEFAULT_READBACK_CONTRACT)],
                "gate": "no_database_write_in_dry_run",
                "name": "build_aca_data_build_job_to_contract_no_data",
                "percent_complete": 95,
                "status": "runner_contract_validated_locally",
                "step": 1,
            },
            {
                "evidence": [repo_relative(out_dir / "ecl_commercial_family_load_runner_status.json")],
                "gate": "database_target_must_be_local_disposable_or_lab_preprod",
                "name": "commercial_family_load_to_lab_preprod",
                "percent_complete": 60,
                "status": "local_disposable_loader_ready_not_azure_executed",
                "step": 2,
            },
            {
                "evidence": [repo_relative(DEFAULT_READBACK_CONTRACT)],
                "gate": "load_execution_required_before_row_for_row_readback",
                "name": "independent_commercial_row_for_row_readback",
                "percent_complete": 40,
                "status": "readback_contract_validated_runner_not_executed",
                "step": 3,
            },
            {"evidence": [], "gate": "commercial_readback_parity", "name": "dense_source_rooms_for_remaining_8_families", "percent_complete": 0, "status": "deferred_after_commercial_readback", "step": 4},
            {"evidence": [], "gate": "all_9_local_artifacts_exist", "name": "full_local_validation_across_all_9_families", "percent_complete": 0, "status": "deferred_after_remaining_8_dense_rooms", "step": 5},
            {"evidence": [], "gate": "azure_data_plane_write_and_readback", "name": "reload_and_readback_all_9_families", "percent_complete": 0, "status": "deferred_hard_gated", "step": 6},
            {"evidence": [], "gate": "product_route_repointing_and_browser_live_claim", "name": "route_browser_qa_source_first", "percent_complete": 0, "status": "deferred_hard_gated", "step": 7},
        ],
    }
    status = {
        "accepted": True,
        "actual_azure_execution": False,
        "actual_database_write": False,
        "family": FAMILY,
        "generated_at": now_iso(),
        "idempotency_key": run_contract.get("idempotency_key"),
        "mode": "dry-run",
        "readback_contract": repo_relative(DEFAULT_READBACK_CONTRACT),
        "readback_expected_counts": readback_contract.get("expected_counts", {}),
        "run_contract": repo_relative(DEFAULT_RUN_CONTRACT),
        "status": "runner_ready_execute_requires_gate_and_safe_target",
        "tenant_key": TENANT_KEY,
    }
    write_json(out_dir / "ecl_commercial_family_load_runner_status.json", status)
    write_json(out_dir / "ecl_commercial_execution_progress.json", progress)
    (out_dir / "LOCAL_LOAD_RUNNER_REPORT.md").write_text(
        "\n".join(
            [
                "# ECL Commercial Family Local Load Runner",
                "",
                "Dry-run proof only. No database write, no Azure job submission, no route repointing, and no deploy.",
                "",
                f"- Family: `{FAMILY}`",
                f"- Tenant: `{TENANT_KEY}`",
                f"- Run contract: `{repo_relative(DEFAULT_RUN_CONTRACT)}`",
                f"- Readback contract: `{repo_relative(DEFAULT_READBACK_CONTRACT)}`",
                "- Execute mode requires an approved gate manifest and an explicitly marked local/disposable or lab-preprod database target.",
                "",
            ]
        ),
        encoding="utf-8",
    )


def write_execute_status(out_dir: Path, readback: dict[str, Any], run_contract: dict[str, Any]) -> None:
    status = {
        "accepted": readback["accepted"],
        "actual_azure_execution": False,
        "actual_database_write": True,
        "family": FAMILY,
        "generated_at": now_iso(),
        "idempotency_key": run_contract["idempotency_key"],
        "mode": "execute",
        "readback": repo_relative(out_dir / "ecl_commercial_family_load_readback.json"),
        "status": "loaded_to_explicit_safe_target" if readback["accepted"] else "loaded_with_readback_issues",
        "tenant_key": TENANT_KEY,
    }
    write_json(out_dir / "ecl_commercial_family_load_runner_status.json", status)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["dry-run", "execute"], default="dry-run")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--gate-manifest", type=Path)
    parser.add_argument("--run-contract", type=Path, default=DEFAULT_RUN_CONTRACT)
    parser.add_argument("--readback-contract", type=Path, default=DEFAULT_READBACK_CONTRACT)
    parser.add_argument("--target-config", type=Path)
    args = parser.parse_args()

    args.out_dir.mkdir(parents=True, exist_ok=True)
    try:
        contracts = validate_contracts(args.run_contract, args.readback_contract, args.gate_manifest, mode=args.mode)
        if args.mode == "dry-run":
            write_dry_run_outputs(args.out_dir, contracts)
            print(
                json.dumps(
                    {
                        "accepted": True,
                        "actual_azure_execution": False,
                        "actual_database_write": False,
                        "out_dir": repo_relative(args.out_dir),
                        "status": "dry_run_ready",
                    },
                    indent=2,
                    sort_keys=True,
                )
            )
            return

        target_config = load_target_config(args.target_config)
        database_url, target_environment = validate_target_config(target_config)
        generated = build_commercial_sql(args.out_dir)
        readback = apply_load(
            database_url,
            target_environment,
            generated,
            contracts["run_contract"],
            contracts["readback_contract"],
            args.out_dir,
        )
        write_execute_status(args.out_dir, readback, contracts["run_contract"])
        print(
            json.dumps(
                {
                    "accepted": readback["accepted"],
                    "actual_azure_execution": False,
                    "actual_database_write": True,
                    "idempotent_run_count": readback["idempotent_run_count"],
                    "out_dir": repo_relative(args.out_dir),
                    "readback": repo_relative(args.out_dir / "ecl_commercial_family_load_readback.json"),
                    "status": "execute_completed",
                },
                indent=2,
                sort_keys=True,
            )
        )
        if not readback["accepted"]:
            raise SystemExit(1)
    except Refusal as exc:
        write_refusal(args.out_dir, exc.issues, args.mode)
        print("Refused: " + "; ".join(exc.issues), file=sys.stderr)
        raise SystemExit(1)
    except CommandFailure as exc:
        write_json(
            args.out_dir / "ecl_commercial_family_load_command_failure.json",
            {
                "accepted": False,
                "command": exc.command,
                "exit_code": exc.returncode,
                "generated_at": now_iso(),
                "stderr": exc.stderr,
                "stdout": exc.stdout,
            },
        )
        print(f"Command failed: {exc}", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
