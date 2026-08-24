#!/usr/bin/env python3

"""Validate dense all-layer local proof counts against the classified count contract."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONTRACT = ROOT / "docs/architecture/ecl-dense-all-layer-count-contract.json"
DEFAULT_OUT_DIR = ROOT / "outputs/ecl-dense-all-layer-count-contract-validation"

SUMMARY_PATHS = {
    "queue": ROOT / "outputs/ecl-no-stop-queue-validation/validation-summary.json",
    "execution": ROOT / "outputs/ecl-no-stop-execution-run/execution-summary.json",
    "operator": ROOT / "outputs/ecl-no-stop-execution-run/operator-status-validation-summary.json",
    "raw": ROOT / "reports/source-excel-raw-landing-2026-08-23/source_excel_raw_landing_summary.json",
    "dense": ROOT / "outputs/source-room-depth-catchup-2026-08-23/dense_source_room_summary.json",
    "producer": ROOT / "reports/ecl-source-room-producer-coverage-2026-08-23/ecl_source_room_producer_coverage_summary.json",
    "source": ROOT / "reports/ecl-dense-source-layer-local-load-2026-08-23/dense_source_room_ecl_source_load_summary.json",
    "context": ROOT / "reports/ecl-dense-context-layer-local-load-2026-08-23/dense_source_room_ecl_context_load_summary.json",
    "commercial": ROOT / "reports/ecl-dense-commercial-layer-local-load-2026-08-23/dense_source_room_ecl_commercial_load_summary.json",
    "review": ROOT / "reports/ecl-dense-review-layer-local-load-2026-08-23/dense_source_room_ecl_review_load_summary.json",
    "projection": ROOT / "reports/ecl-dense-source-projection-local-load-2026-08-23/dense_source_room_ecl_source_projection_load_summary.json",
    "cube": ROOT / "reports/ecl-dense-cube-layer-local-load-2026-08-23/dense_source_room_ecl_cube_load_summary.json",
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def layer_payload(layer: str, summary: dict[str, Any]) -> dict[str, Any]:
    if layer in {"source", "context", "commercial", "review", "projection", "cube"}:
        return summary.get("readback", {})
    return summary


def validate_delta_classifications(contract: dict[str, Any]) -> list[str]:
    failures: list[str] = []
    release_record = contract.get("release_record")
    if not release_record:
        failures.append("count contract must name a release_record")
    for row in contract.get("delta_classifications", []):
        key = row.get("key", "<missing>")
        before = row.get("before")
        after = row.get("after")
        delta = row.get("delta")
        if not row.get("classification"):
            failures.append(f"{key}: missing classification")
        if not row.get("explanation"):
            failures.append(f"{key}: missing explanation")
        if isinstance(before, (int, float)) and isinstance(after, (int, float)) and after - before != delta:
            failures.append(f"{key}: before/after do not match delta {delta}")
        if isinstance(delta, (int, float)) and delta < 0:
            if row.get("release_record_required") is not True:
                failures.append(f"{key}: negative delta must set release_record_required=true")
            if not release_record:
                failures.append(f"{key}: negative delta requires release record reference")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--contract", type=Path, default=DEFAULT_CONTRACT)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()

    contract = read_json(args.contract)
    failures = validate_delta_classifications(contract)
    expected_by_layer = contract.get("expected", {})
    observed: dict[str, dict[str, Any]] = {}
    compared = 0

    for layer, expected in expected_by_layer.items():
        path = SUMMARY_PATHS.get(layer)
        if path is None:
            failures.append(f"{layer}: no summary path declared")
            continue
        if not path.exists():
            failures.append(f"{layer}: missing summary {path.relative_to(ROOT).as_posix()}")
            continue
        payload = layer_payload(layer, read_json(path))
        observed[layer] = {}
        for key, expected_value in expected.items():
            actual_value = payload.get(key)
            observed[layer][key] = actual_value
            compared += 1
            if actual_value != expected_value:
                failures.append(f"{layer}.{key}={actual_value}, expected {expected_value}")

    summary = {
        "accepted": not failures,
        "contract": args.contract.relative_to(ROOT).as_posix(),
        "compared_count": compared,
        "delta_classification_count": len(contract.get("delta_classifications", [])),
        "negative_delta_count": sum(1 for row in contract.get("delta_classifications", []) if row.get("delta", 0) < 0),
        "release_record": contract.get("release_record"),
        "observed": observed,
        "failures": failures,
    }
    write_json(args.out_dir / "dense_all_layer_count_contract_validation_summary.json", summary)
    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
