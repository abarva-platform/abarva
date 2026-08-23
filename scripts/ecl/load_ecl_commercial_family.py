#!/usr/bin/env python3

"""Load the ECL commercial family into an explicitly gated target DB.

This runner is intended for a future ACA Container Apps Job, but this PR only
proves it locally. It refuses to run unless the merged preflight run contract,
an explicit gate manifest, the readback contract, local proof hashes, an
idempotency key, and a lab/preprod/disposable target classification all agree.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import tarfile
import tempfile
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse


DEFAULT_RUN_CONTRACT = Path("reports/ecl-commercial-lab-load-preflight-2026-08-23/ecl_commercial_lab_load_run_contract.json")
DEFAULT_OUT_DIR = Path("reports/ecl-commercial-local-load-runner-2026-08-23")
FAMILY = "vendor_contract_commercial"
ALLOWED_TARGET_CLASSIFICATIONS = {"local_disposable", "lab", "preprod", "client_preprod"}
ACK_KEYS = [
    "approved_for_future_aca_job_submission",
    "tenant_scope_confirmed",
    "digest_pinned_image_required",
    "private_data_plane_target_confirmed",
    "independent_readback_required",
    "no_product_route_change",
    "human_review_after_readback_required",
]
TRUTHY = {"1", "true", "yes", "on"}
PROOF_BEGIN = "__SEMANTIC2_PROOF_TGZ_BEGIN__"
PROOF_END = "__SEMANTIC2_PROOF_TGZ_END__"


class Refusal(RuntimeError):
    def __init__(self, issues: list[str]):
        self.issues = issues
        super().__init__("; ".join(issues))


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_json_text(raw: str, label: str) -> Any:
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise Refusal([f"{label}_invalid_json:{exc.msg}"]) from exc


def sha256_bytes(value: bytes) -> str:
    import hashlib

    return hashlib.sha256(value).hexdigest()


def file_sha(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def repo_relative(path: Path) -> str:
    return path.as_posix()


def validate_hashes(repo: Path, expected_hashes: dict[str, Any], label: str) -> list[str]:
    issues: list[str] = []
    if not isinstance(expected_hashes, dict) or not expected_hashes:
        return [f"{label}_expected_local_proof_hashes_missing"]
    for rel_path, expected in expected_hashes.items():
        path = repo / str(rel_path)
        if not path.exists():
            issues.append(f"{label}_proof_file_missing:{rel_path}")
            continue
        current = file_sha(path)
        if current != expected:
            issues.append(f"{label}_proof_hash_mismatch:{rel_path}")
    return issues


def validate_target(target_db_url: str | None, classification: str | None) -> list[str]:
    issues: list[str] = []
    if not target_db_url:
        issues.append("target_database_url_missing")
    if not classification:
        issues.append("target_database_classification_missing")
    elif classification not in ALLOWED_TARGET_CLASSIFICATIONS:
        issues.append("target_database_classification_not_allowed")
    if target_db_url and any(token in target_db_url.lower() for token in ["prod", "production"]):
        if classification not in {"preprod", "client_preprod"}:
            issues.append("target_database_url_not_marked_preprod_or_disposable")
    return issues


def validate_gate(repo: Path, run_contract: dict[str, Any], gate: dict[str, Any], readback_contract: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    if gate.get("approved") is not True:
        issues.append("gate_not_approved")
    if gate.get("approval_file_purpose") == "template_only_not_approval":
        issues.append("gate_template_is_not_approval")
    for field in ["family", "tenant_scope", "build_version", "input_source_version", "idempotency_key"]:
        if gate.get(field) != run_contract.get(field):
            issues.append(f"gate_{field}_mismatch")
    if gate.get("family") != FAMILY:
        issues.append("gate_family_not_commercial")
    if gate.get("family") != readback_contract.get("family"):
        issues.append("readback_family_mismatch")
    if gate.get("tenant_scope") != readback_contract.get("tenant_scope"):
        issues.append("readback_tenant_scope_mismatch")
    for key in ACK_KEYS:
        if gate.get("acknowledgements", {}).get(key) is not True:
            issues.append(f"gate_acknowledgement_missing:{key}")

    gate_hashes = gate.get("expected_local_proof_hashes")
    run_hashes = run_contract.get("expected_local_proof_hashes")
    readback_hashes = readback_contract.get("local_proof_hashes")
    if gate_hashes != run_hashes:
        issues.append("gate_expected_local_proof_hashes_mismatch")
    if readback_hashes != run_hashes:
        issues.append("readback_expected_local_proof_hashes_mismatch")
    issues.extend(validate_hashes(repo, run_hashes, "run_contract"))
    issues.extend(validate_hashes(repo, gate_hashes, "gate"))

    readback_ref = gate.get("readback_contract")
    if not isinstance(readback_ref, dict):
        issues.append("gate_readback_contract_missing")
    else:
        readback_path = Path(str(readback_ref.get("path", "")))
        if readback_path.as_posix() == "." or not (repo / readback_path).exists():
            issues.append("gate_readback_contract_file_missing")
        elif readback_ref.get("sha256") != file_sha(repo / readback_path):
            issues.append("gate_readback_contract_hash_mismatch")
    return issues


def load_gate_manifest(gate_manifest_path: Path | None) -> dict[str, Any]:
    if gate_manifest_path:
        if not gate_manifest_path.exists():
            raise Refusal([f"gate_contract_missing:{gate_manifest_path.as_posix()}"])
        return read_json(gate_manifest_path)

    gate_json = os.environ.get("ECL_COMMERCIAL_GATE_MANIFEST_JSON")
    gate_b64 = os.environ.get("ECL_COMMERCIAL_GATE_MANIFEST_B64")
    if gate_json and gate_b64:
        raise Refusal(["gate_contract_ambiguous_json_and_b64"])
    if gate_json:
        return parse_json_text(gate_json, "gate_contract_env_json")
    if gate_b64:
        try:
            decoded = base64.b64decode(gate_b64, validate=True).decode("utf-8")
        except Exception as exc:
            raise Refusal(["gate_contract_env_b64_invalid"]) from exc
        return parse_json_text(decoded, "gate_contract_env_b64")
    raise Refusal(["gate_contract_missing"])


def load_contracts(repo: Path, run_contract_path: Path, gate_manifest_path: Path | None) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    issues: list[str] = []
    if not (repo / run_contract_path).exists():
        raise Refusal([f"run_contract_missing:{run_contract_path.as_posix()}"])
    run_contract = read_json(repo / run_contract_path)

    gate = load_gate_manifest(gate_manifest_path)

    if run_contract.get("family") != FAMILY:
        issues.append("run_contract_family_not_commercial")
    if not run_contract.get("tenant_scope"):
        issues.append("run_contract_tenant_scope_missing")
    if not run_contract.get("idempotency_key"):
        issues.append("idempotency_key_missing")
    readback_path_raw = run_contract.get("readback_contract")
    if not readback_path_raw:
        issues.append("readback_contract_missing")
        readback_contract = {}
    else:
        readback_path = repo / Path(str(readback_path_raw))
        if not readback_path.exists():
            issues.append(f"readback_contract_missing:{readback_path_raw}")
            readback_contract = {}
        else:
            readback_contract = read_json(readback_path)
    if readback_contract:
        issues.extend(validate_gate(repo, run_contract, gate, readback_contract))
    if issues:
        raise Refusal(sorted(set(issues)))
    return run_contract, gate, readback_contract


def source_summary_path(run_contract: dict[str, Any]) -> Path:
    for rel_path in run_contract.get("expected_local_proof_hashes", {}):
        if rel_path.endswith("source_layer_completion_summary.json"):
            return Path(rel_path)
    raise Refusal(["source_summary_not_declared_in_proof_hashes"])


def build_load_rows(source_summary: dict[str, Any], readback_contract: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    counts = source_summary.get("commercial_counts", {})
    expected_counts = readback_contract.get("expected_counts", {})
    metric_rows: list[dict[str, Any]] = []
    for key in sorted(counts):
        value = counts[key]
        if isinstance(value, bool):
            metric_rows.append({"metric_key": key, "numeric_value": None, "text_value": str(value).lower(), "is_gap": False})
        elif isinstance(value, (int, float)):
            metric_rows.append({"metric_key": key, "numeric_value": str(Decimal(str(value))), "text_value": None, "is_gap": False})
        else:
            metric_rows.append({"metric_key": key, "numeric_value": None, "text_value": json.dumps(value, sort_keys=True) if isinstance(value, dict) else str(value), "is_gap": False})

    for key in sorted(expected_counts):
        if key not in counts:
            metric_rows.append({"metric_key": key, "numeric_value": None, "text_value": None, "is_gap": True})

    gap_rows = [
        {
            "gap_key": f"known_gap_{index + 1}",
            "gap_reason": reason,
            "numeric_value": None,
        }
        for index, reason in enumerate(source_summary.get("why_not_full_source_complete", []))
    ]
    gap_rows.append(
        {
            "gap_key": "independent_lab_readback_not_executed",
            "gap_reason": "Independent data-plane readback is a future human-gated operation and is not represented as zero.",
            "numeric_value": None,
        }
    )
    return metric_rows, gap_rows


def row_count_summary(metric_rows: list[dict[str, Any]], gap_rows: list[dict[str, Any]]) -> dict[str, int]:
    return {
        "commercial_metric_rows": len(metric_rows),
        "numeric_metric_rows": sum(1 for row in metric_rows if row["numeric_value"] is not None),
        "text_metric_rows": sum(1 for row in metric_rows if row["text_value"] is not None),
        "gap_metric_rows": sum(1 for row in metric_rows if row["is_gap"]),
        "gap_record_rows": len(gap_rows),
    }


def json_db_path(target_db_url: str) -> Path:
    parsed = urlparse(target_db_url)
    if parsed.scheme not in {"json", "mock"}:
        raise Refusal(["json_adapter_requires_json_or_mock_url"])
    raw_path = unquote(parsed.path or parsed.netloc)
    if parsed.netloc and parsed.path:
        raw_path = f"/{parsed.netloc}{parsed.path}"
    if not raw_path:
        raise Refusal(["json_adapter_path_missing"])
    return Path(raw_path)


def load_json_db(target_db_url: str, run_contract: dict[str, Any], metric_rows: list[dict[str, Any]], gap_rows: list[dict[str, Any]], target_classification: str) -> dict[str, Any]:
    db_path = json_db_path(target_db_url)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    if db_path.exists():
        db = read_json(db_path)
    else:
        db = {"load_runs": {}, "commercial_counts": [], "gap_records": []}
    idempotency_key = run_contract["idempotency_key"]
    previous = db.get("load_runs", {}).get(idempotency_key, {})
    rerun_count = int(previous.get("rerun_count", 0)) + 1
    db["commercial_counts"] = [row for row in db.get("commercial_counts", []) if row.get("idempotency_key") != idempotency_key]
    db["gap_records"] = [row for row in db.get("gap_records", []) if row.get("idempotency_key") != idempotency_key]
    for row in metric_rows:
        db["commercial_counts"].append({"idempotency_key": idempotency_key, **row})
    for row in gap_rows:
        db["gap_records"].append({"idempotency_key": idempotency_key, **row})
    rows = row_count_summary(metric_rows, gap_rows)
    db.setdefault("load_runs", {})[idempotency_key] = {
        "build_version": run_contract["build_version"],
        "family": run_contract["family"],
        "idempotency_key": idempotency_key,
        "input_source_version": run_contract["input_source_version"],
        "loaded_at": now_iso(),
        "rerun_count": rerun_count,
        "row_counts": rows,
        "run_id": run_contract["run_id"],
        "status": "local_load_succeeded",
        "target_classification": target_classification,
        "tenant_scope": run_contract["tenant_scope"],
    }
    write_json(db_path, db)
    return {"adapter": "json", "target": db_path.as_posix(), "rerun_count": rerun_count, "row_counts": rows}


def sql_literal(value: Any) -> str:
    if value is None:
        return "NULL"
    text = str(value)
    return "'" + text.replace("'", "''") + "'"


def run_psql(target_db_url: str, sql: str) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False) as handle:
        handle.write(sql)
        sql_path = handle.name
    try:
        result = subprocess.run(
            ["psql", target_db_url, "-v", "ON_ERROR_STOP=1", "-f", sql_path],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            raise Refusal([f"postgres_load_failed:{(result.stderr or result.stdout).strip()}"])
    finally:
        Path(sql_path).unlink(missing_ok=True)


def load_postgres(target_db_url: str, run_contract: dict[str, Any], metric_rows: list[dict[str, Any]], gap_rows: list[dict[str, Any]], target_classification: str) -> dict[str, Any]:
    idempotency_key = run_contract["idempotency_key"]
    rows = row_count_summary(metric_rows, gap_rows)
    metric_values = "\n".join(
        f"({sql_literal(idempotency_key)}, {sql_literal(row['metric_key'])}, {row['numeric_value'] if row['numeric_value'] is not None else 'NULL'}, {sql_literal(row['text_value'])}, {'true' if row['is_gap'] else 'false'}),"
        for row in metric_rows
    ).rstrip(",")
    gap_values = "\n".join(
        f"({sql_literal(idempotency_key)}, {sql_literal(row['gap_key'])}, {sql_literal(row['gap_reason'])}, NULL),"
        for row in gap_rows
    ).rstrip(",")
    sql = f"""
BEGIN;
CREATE SCHEMA IF NOT EXISTS ecl_operator_load;
CREATE TABLE IF NOT EXISTS ecl_operator_load.load_runs (
  idempotency_key text PRIMARY KEY,
  run_id text NOT NULL,
  family text NOT NULL,
  tenant_scope text NOT NULL,
  build_version text NOT NULL,
  input_source_version text NOT NULL,
  target_classification text NOT NULL,
  row_counts jsonb NOT NULL,
  rerun_count integer NOT NULL DEFAULT 0,
  status text NOT NULL,
  loaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ecl_operator_load.commercial_counts (
  idempotency_key text NOT NULL,
  metric_key text NOT NULL,
  numeric_value numeric NULL,
  text_value text NULL,
  is_gap boolean NOT NULL,
  PRIMARY KEY (idempotency_key, metric_key)
);
CREATE TABLE IF NOT EXISTS ecl_operator_load.gap_records (
  idempotency_key text NOT NULL,
  gap_key text NOT NULL,
  gap_reason text NOT NULL,
  numeric_value numeric NULL,
  PRIMARY KEY (idempotency_key, gap_key)
);
INSERT INTO ecl_operator_load.load_runs (
  idempotency_key, run_id, family, tenant_scope, build_version, input_source_version,
  target_classification, row_counts, rerun_count, status, loaded_at
) VALUES (
  {sql_literal(idempotency_key)}, {sql_literal(run_contract['run_id'])}, {sql_literal(run_contract['family'])},
  {sql_literal(run_contract['tenant_scope'])}, {sql_literal(run_contract['build_version'])},
  {sql_literal(run_contract['input_source_version'])}, {sql_literal(target_classification)},
  {sql_literal(json.dumps(rows, sort_keys=True))}::jsonb, 1, 'local_load_succeeded', now()
)
ON CONFLICT (idempotency_key) DO UPDATE SET
  row_counts = EXCLUDED.row_counts,
  rerun_count = ecl_operator_load.load_runs.rerun_count + 1,
  status = EXCLUDED.status,
  loaded_at = now();
DELETE FROM ecl_operator_load.commercial_counts WHERE idempotency_key = {sql_literal(idempotency_key)};
DELETE FROM ecl_operator_load.gap_records WHERE idempotency_key = {sql_literal(idempotency_key)};
INSERT INTO ecl_operator_load.commercial_counts (idempotency_key, metric_key, numeric_value, text_value, is_gap)
VALUES
{metric_values};
INSERT INTO ecl_operator_load.gap_records (idempotency_key, gap_key, gap_reason, numeric_value)
VALUES
{gap_values};
COMMIT;
"""
    run_psql(target_db_url, sql)
    return {"adapter": "postgres", "target": "postgres://<redacted>", "rerun_count": None, "row_counts": rows}


def choose_adapter(adapter: str, target_db_url: str) -> str:
    if adapter != "auto":
        return adapter
    parsed = urlparse(target_db_url)
    if parsed.scheme in {"json", "mock"}:
        return "json"
    if parsed.scheme in {"postgres", "postgresql"}:
        return "postgres"
    raise Refusal([f"unsupported_target_database_scheme:{parsed.scheme or 'missing'}"])


def should_emit_proof_bundle(args: argparse.Namespace) -> bool:
    return args.emit_proof_bundle or os.environ.get("ECL_COMMERCIAL_EMIT_PROOF_BUNDLE", "").lower() in TRUTHY


def emit_proof_bundle(out_dir: Path) -> None:
    with tempfile.NamedTemporaryFile(suffix=".tgz", delete=False) as handle:
        tar_path = Path(handle.name)
    try:
        with tarfile.open(tar_path, "w:gz") as archive:
            for file_path in sorted(path for path in out_dir.rglob("*") if path.is_file()):
                archive.add(file_path, arcname=file_path.relative_to(out_dir.parent))
        encoded = base64.b64encode(tar_path.read_bytes()).decode("ascii")
        print(PROOF_BEGIN)
        for index in range(0, len(encoded), 76):
            print(encoded[index : index + 76])
        print(PROOF_END)
    finally:
        tar_path.unlink(missing_ok=True)


def write_refusal(out_dir: Path, issues: list[str]) -> None:
    write_json(
        out_dir / "ecl_commercial_local_load_refusal.json",
        {
            "accepted": False,
            "actual_azure_execution": False,
            "actual_shared_data_plane_mutation": False,
            "generated_at": now_iso(),
            "issues": sorted(set(issues)),
            "status": "refused",
        },
    )


def run_load(repo: Path, args: argparse.Namespace) -> dict[str, Any]:
    out_dir: Path = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    target_db_url = args.target_db_url or os.environ.get("ECL_COMMERCIAL_TARGET_DATABASE_URL")
    target_classification = args.target_db_classification or os.environ.get("ECL_COMMERCIAL_TARGET_DB_CLASSIFICATION")
    issues = validate_target(target_db_url, target_classification)
    try:
        run_contract, _gate, readback_contract = load_contracts(repo, args.run_contract, args.gate_manifest)
    except Refusal as exc:
        issues.extend(exc.issues)
        write_refusal(out_dir, issues)
        raise
    if issues:
        write_refusal(out_dir, issues)
        raise Refusal(sorted(set(issues)))

    summary = read_json(repo / source_summary_path(run_contract))
    metric_rows, gap_rows = build_load_rows(summary, readback_contract)
    adapter = choose_adapter(args.db_adapter, target_db_url)
    if adapter == "json":
        db_result = load_json_db(target_db_url, run_contract, metric_rows, gap_rows, target_classification)
    elif adapter == "postgres":
        db_result = load_postgres(target_db_url, run_contract, metric_rows, gap_rows, target_classification)
    else:
        raise Refusal([f"unsupported_db_adapter:{adapter}"])

    status_path = out_dir / "ecl_commercial_local_load_status.json"
    row_counts_path = out_dir / "ecl_commercial_local_load_row_counts.json"
    progress_path = out_dir / "ecl_commercial_execution_progress.json"
    validation_path = out_dir / "ecl_commercial_local_load_validation_summary.json"
    report_path = out_dir / "LOCAL_LOAD_RUNNER_REPORT.md"
    result = {
        "accepted": True,
        "actual_azure_execution": False,
        "actual_shared_data_plane_mutation": False,
        "adapter": db_result["adapter"],
        "family": run_contract["family"],
        "generated_at": now_iso(),
        "idempotency_key": run_contract["idempotency_key"],
        "rerun_count": db_result["rerun_count"],
        "row_counts": db_result["row_counts"],
        "run_id": run_contract["run_id"],
        "status": "local_load_succeeded",
        "target_classification": target_classification,
        "tenant_scope": run_contract["tenant_scope"],
    }
    write_json(status_path, result)
    write_json(row_counts_path, db_result["row_counts"])
    write_json(
        validation_path,
        {
            "accepted": True,
            "checks": [
                {"name": "gate_contract_present", "status": "pass"},
                {"name": "tenant_family_match", "status": "pass"},
                {"name": "local_proof_hashes_match", "status": "pass"},
                {"name": "idempotency_key_present", "status": "pass"},
                {"name": "readback_contract_present", "status": "pass"},
                {"name": "target_classification_allowed", "status": "pass"},
                {"name": "gaps_preserved_as_null", "status": "pass"},
            ],
            "status": "local_load_runner_validated",
        },
    )
    write_json(
        progress_path,
        {
            "accepted": True,
            "generated_at": now_iso(),
            "overall_percent_complete": 35,
            "source": "ecl_commercial_local_load_runner",
            "steps": [
                {"step": 1, "name": "build_aca_data_build_job_to_contract_no_data", "percent_complete": 95, "status": "runner_consumes_merged_contracts", "gate": "no_data_plane_mutation_in_this_pr", "evidence": [repo_relative(status_path)]},
                {"step": 2, "name": "commercial_family_load_to_lab_preprod", "percent_complete": 65, "status": "local_load_runner_ready_actual_lab_load_gated", "gate": "azure_data_plane_write", "evidence": [repo_relative(status_path), repo_relative(row_counts_path)]},
                {"step": 3, "name": "independent_commercial_row_for_row_readback", "percent_complete": 40, "status": "readback_contract_required_not_executed", "gate": "readback_after_approved_load", "evidence": ["reports/ecl-commercial-lab-load-preflight-2026-08-23/ecl_commercial_lab_load_readback_contract.json"]},
                {"step": 4, "name": "dense_source_rooms_for_remaining_8_families", "percent_complete": 0, "status": "deferred_after_commercial_readback", "gate": "commercial_readback_parity", "evidence": []},
                {"step": 5, "name": "full_local_validation_across_all_9_families", "percent_complete": 0, "status": "deferred_after_remaining_8_dense_rooms", "gate": "all_9_local_artifacts_exist", "evidence": []},
                {"step": 6, "name": "reload_and_readback_all_9_families", "percent_complete": 0, "status": "deferred_hard_gated", "gate": "azure_data_plane_write_and_readback", "evidence": []},
                {"step": 7, "name": "route_browser_qa_source_first", "percent_complete": 0, "status": "deferred_hard_gated", "gate": "product_route_repointing_and_browser_live_claim", "evidence": []},
            ],
        },
    )
    report_path.write_text(
        "\n".join(
            [
                "# ECL Commercial Local Load Runner",
                "",
                f"- Run id: `{run_contract['run_id']}`",
                f"- Adapter: `{db_result['adapter']}`",
                f"- Target classification: `{target_classification}`",
                f"- Row counts: `{repo_relative(row_counts_path)}`",
                f"- Status: `{repo_relative(status_path)}`",
                "",
                "Hard gates preserved: no Azure job submission, no shared data-plane mutation, no route repointing, no deploy.",
                "",
            ]
        ),
        encoding="utf-8",
    )
    if should_emit_proof_bundle(args):
        emit_proof_bundle(out_dir)
    return result


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-contract", type=Path, default=DEFAULT_RUN_CONTRACT)
    parser.add_argument("--gate-manifest", type=Path)
    parser.add_argument("--target-db-url")
    parser.add_argument("--target-db-classification")
    parser.add_argument("--db-adapter", choices=["auto", "json", "postgres"], default="auto")
    parser.add_argument("--emit-proof-bundle", action="store_true")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    return parser.parse_args(argv)


def main() -> None:
    args = parse_args(sys.argv[1:])
    try:
        result = run_load(Path.cwd(), args)
        print(json.dumps(result, indent=2, sort_keys=True))
    except Refusal as exc:
        print(json.dumps({"accepted": False, "issues": sorted(set(exc.issues))}, indent=2, sort_keys=True), file=sys.stderr)
        raise SystemExit(2)


if __name__ == "__main__":
    main()
