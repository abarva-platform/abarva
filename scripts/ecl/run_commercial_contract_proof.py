#!/usr/bin/env python3

"""Run the full local commercial source-room to ECL proof.

This is a local proof harness only. It starts a disposable Postgres instance,
loads the draft ECL DDL, loads the generated commercial SQL, captures readback,
writes the run summary, and refreshes the proof-bundle manifest.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_OUT_DIR = Path("outputs/ecl-commercial-contract-supply-correction-2026-08-22")
DDL_FILES = [
    Path("docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql"),
    Path("docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql"),
    Path("docs/architecture/sql-drafts/ecl_cube_read_models_v1_draft.sql"),
    Path("docs/architecture/sql-drafts/ecl_metric_dictionary_seed_v1_draft.sql"),
]


class CommandFailure(RuntimeError):
    def __init__(self, result: dict[str, object]):
        self.result = result
        super().__init__(json.dumps(result, indent=2, sort_keys=True))


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def postgres_env() -> dict[str, str]:
    env = os.environ.copy()
    # Homebrew Postgres 18 on macOS can fail during postmaster startup when
    # inherited from a sparse launcher environment. Pin every locale category.
    locale_name = "C.UTF-8"
    env["LANG"] = locale_name
    env["LC_ALL"] = locale_name
    for category in ["LC_COLLATE", "LC_CTYPE", "LC_MESSAGES", "LC_MONETARY", "LC_NUMERIC", "LC_TIME"]:
        env[category] = locale_name
    if env.get("USER"):
        env.setdefault("LOGNAME", env["USER"])
    env.setdefault("SHELL", "/bin/sh")
    env.setdefault("__CF_USER_TEXT_ENCODING", "0x1F6:0x0:0x0")
    return env


def run(
    cmd: list[str],
    *,
    cwd: Path,
    stdout_path: Path | None = None,
    append: bool = False,
    env: dict[str, str] | None = None,
) -> dict[str, object]:
    started = datetime.now(timezone.utc)
    mode = "ab" if append else "wb"
    if stdout_path:
        with stdout_path.open(mode) as handle:
            proc = subprocess.run(cmd, cwd=cwd, stdout=handle, stderr=subprocess.PIPE, text=True, env=env)
        stdout = stdout_path.as_posix()
    else:
        proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, env=env)
        stdout = proc.stdout.strip()
    ended = datetime.now(timezone.utc)
    result = {
        "command": cmd,
        "started_at": started.isoformat(),
        "ended_at": ended.isoformat(),
        "exit_code": proc.returncode,
        "stdout": stdout,
        "stderr": proc.stderr.strip(),
    }
    if proc.returncode != 0:
        raise CommandFailure(result)
    return result


def fail_postgres_startup(exc: CommandFailure, out_dir: Path) -> None:
    cmd = " ".join(str(part) for part in exc.result.get("command", []))
    stderr = str(exc.result.get("stderr", "")).strip()
    message = [
        "Unable to start the disposable Postgres proof database.",
        "The proof runner pins LANG/LC_* to C.UTF-8 for initdb/pg_ctl, so this should not depend on the caller's shell locale.",
        f"Failed command: {cmd}",
        f"Startup logs: {(out_dir / 'commercial_proof_initdb.log').as_posix()}, {(out_dir / 'commercial_proof_pgctl_start.log').as_posix()}, {(out_dir / 'commercial_proof_postgres.log').as_posix()}",
    ]
    if stderr:
        message.append(f"Postgres stderr: {stderr}")
    raise SystemExit("\n".join(message))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--keep-postgres", action="store_true")
    args = parser.parse_args()

    repo = Path.cwd()
    out_dir = args.out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    run_summary_path = out_dir / "commercial_proof_run_summary.json"
    db_proof_path = out_dir / "commercial_contract_supply_db_proof.txt"
    pg_log_path = out_dir / "commercial_proof_postgres.log"
    load_log_path = out_dir / "commercial_proof_db_load.log"

    commands: list[dict[str, object]] = []
    started = datetime.now(timezone.utc)
    source_room = out_dir / "source_room/SP08_Vendor_Contract"
    for script, needs_source_room in [
        ("build_commercial_contract_slice.py", False),
        ("validate_commercial_source_room.py", True),
        ("write_commercial_validator_planted_failures.py", True),
        ("write_commercial_field_lineage.py", True),
        ("write_commercial_scope_dense_requirements.py", False),
        ("write_commercial_client_extraction_mapping.py", False),
        ("write_commercial_product_consumption_mapping.py", False),
        ("write_source_360_page_fact_contract.py", False),
        ("validate_commercial_document_quality.py", False),
    ]:
        command = [sys.executable, f"scripts/ecl/{script}", "--out-dir", out_dir.as_posix()]
        if needs_source_room:
            command.extend(["--source-room", source_room.as_posix()])
        if script == "validate_commercial_document_quality.py":
            command.extend(["--document-dir", (source_room / "documents").as_posix()])
        commands.append(run(command, cwd=repo))

    pg_tmp = Path(tempfile.mkdtemp(prefix="ecl-commercial-pg."))
    port = free_port()
    pg_started = False
    pg_env = postgres_env()
    try:
        try:
            commands.append(
                run(
                    [
                        "initdb",
                        "-D",
                        (pg_tmp / "data").as_posix(),
                        "--encoding=UTF8",
                        "--locale=C.UTF-8",
                    ],
                    cwd=repo,
                    stdout_path=out_dir / "commercial_proof_initdb.log",
                    env=pg_env,
                )
            )
            commands.append(
                run(
                    [
                        "pg_ctl",
                        "-D",
                        (pg_tmp / "data").as_posix(),
                        "-l",
                        pg_log_path.as_posix(),
                        "-o",
                        f"-p {port} -k {pg_tmp.as_posix()}",
                        "start",
                    ],
                    cwd=repo,
                    stdout_path=out_dir / "commercial_proof_pgctl_start.log",
                    env=pg_env,
                )
            )
        except CommandFailure as exc:
            fail_postgres_startup(exc, out_dir)
        pg_started = True
        commands.append(run(["createdb", "-h", pg_tmp.as_posix(), "-p", str(port), "ecl_commercial_proof"], cwd=repo, env=pg_env))
        if load_log_path.exists():
            load_log_path.unlink()
        for ddl in DDL_FILES:
            commands.append(
                run(
                    ["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", "ecl_commercial_proof", "-v", "ON_ERROR_STOP=1", "-f", ddl.as_posix()],
                    cwd=repo,
                    stdout_path=load_log_path,
                    append=True,
                    env=pg_env,
                )
            )
        commands.append(
            run(
                [
                    "psql",
                    "-h",
                    pg_tmp.as_posix(),
                    "-p",
                    str(port),
                    "-d",
                    "ecl_commercial_proof",
                    "-v",
                    "ON_ERROR_STOP=1",
                    "-f",
                    (out_dir / "commercial_contract_supply_ecl_load.sql").as_posix(),
                ],
                cwd=repo,
                stdout_path=load_log_path,
                append=True,
                env=pg_env,
            )
        )
        commands.append(
            run(
                [
                    "psql",
                    "-h",
                    pg_tmp.as_posix(),
                    "-p",
                    str(port),
                    "-d",
                    "ecl_commercial_proof",
                    "-f",
                    (out_dir / "commercial_contract_supply_verify.sql").as_posix(),
                ],
                cwd=repo,
                stdout_path=db_proof_path,
                env=pg_env,
            )
        )
    finally:
        if pg_started:
            try:
                commands.append(
                    run(
                        ["pg_ctl", "-D", (pg_tmp / "data").as_posix(), "stop", "-m", "fast"],
                        cwd=repo,
                        stdout_path=out_dir / "commercial_proof_pgctl_stop.log",
                        env=pg_env,
                    )
                )
            except CommandFailure:
                pass
        if not args.keep_postgres:
            shutil.rmtree(pg_tmp, ignore_errors=True)

    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "started_at": started.isoformat(),
        "out_dir": out_dir.as_posix(),
        "boundary": {
            "azure_load": False,
            "active_tenant_input_mutation": False,
            "migration_authorization": False,
            "product_route_repointing": False,
            "browser_qa": False,
        },
        "postgres": {
            "disposable": True,
            "kept": args.keep_postgres,
            "locale_env": {
                "LANG": pg_env["LANG"],
                "LC_ALL": pg_env["LC_ALL"],
                "LC_CTYPE": pg_env["LC_CTYPE"],
                "LOGNAME_PRESENT": bool(pg_env.get("LOGNAME")),
                "SHELL_PRESENT": bool(pg_env.get("SHELL")),
            },
            "port": port,
        },
        "commands": commands,
        "artifacts": {
            "db_proof": db_proof_path.as_posix(),
            "db_load_log": load_log_path.as_posix(),
            "postgres_log": pg_log_path.as_posix(),
        },
    }
    run_summary_path.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    commands.append(run([sys.executable, "scripts/ecl/validate_commercial_proof_acceptance.py", "--out-dir", out_dir.as_posix()], cwd=repo))
    commands.append(run([sys.executable, "scripts/ecl/write_commercial_proof_bundle_manifest.py", "--out-dir", out_dir.as_posix()], cwd=repo))
    print(json.dumps({"run_summary": run_summary_path.as_posix(), "db_proof": db_proof_path.as_posix(), "commands": len(commands)}, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
