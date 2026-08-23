#!/usr/bin/env python3

"""Run the dense ECL Azure gate package local proof chain."""

from __future__ import annotations

import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "reports/ecl-dense-azure-load-gate-package-2026-08-23"
SUMMARY = OUT_DIR / "ecl_dense_azure_gate_local_proof_summary.json"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def run_step(name: str, command: list[str]) -> dict[str, object]:
    env = os.environ.copy()
    env.setdefault("LANG", "C.UTF-8")
    env.setdefault("LC_ALL", "C.UTF-8")
    started = now_iso()
    completed = subprocess.run(
        command,
        cwd=ROOT,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    log_path = OUT_DIR / f"{name}.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.write_text(completed.stdout, encoding="utf-8")
    return {
        "name": name,
        "command": command,
        "started_at": started,
        "completed_at": now_iso(),
        "exit_code": completed.returncode,
        "log_path": log_path.relative_to(ROOT).as_posix(),
        "status": "pass" if completed.returncode == 0 else "fail",
    }


def main() -> int:
    steps = [
        ("aca_dry_run_from_existing_queue_proof", ["npm", "run", "ecl:dense-aca-job:dry-run", "--", "--skip-proof-run"]),
        ("aca_dry_run_validate", ["npm", "run", "ecl:dense-aca-job:validate"]),
        ("package", ["npm", "run", "ecl:dense-azure-gate:package", "--", "--skip-dry-run"]),
        ("validate", ["npm", "run", "ecl:dense-azure-gate:validate"]),
        (
            "execute_preflight_template_rejection",
            ["npm", "run", "ecl:dense-azure-gate:execute-preflight", "--", "--expect-template-rejection"],
        ),
    ]
    results = [run_step(name, command) for name, command in steps]
    accepted = all(row["exit_code"] == 0 for row in results)
    payload = {
        "accepted": accepted,
        "actual_azure_execution": False,
        "command_was_executed": False,
        "completed_at": now_iso(),
        "steps": results,
    }
    SUMMARY.parent.mkdir(parents=True, exist_ok=True)
    SUMMARY.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(payload, indent=2, sort_keys=True))
    return 0 if accepted else 1


if __name__ == "__main__":
    raise SystemExit(main())
