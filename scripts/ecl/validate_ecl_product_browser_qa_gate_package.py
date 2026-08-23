#!/usr/bin/env python3

"""Validate the ECL product browser QA gate package."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


DEFAULT_OUT_DIR = Path("reports/ecl-product-browser-qa-gate-package-2026-08-23")
REQUIRED_PRODUCTS = {"Source", "Home", "Tower", "Intelligence"}
REQUIRED_FILES = {
    "manifest": "ecl_product_browser_qa_gate_manifest.template.json",
    "status": "ecl_product_browser_qa_gate_status.json",
    "checklist": "ecl_product_browser_qa_acceptance_checklist.json",
    "summary": "ecl_product_browser_qa_gate_summary.json",
    "report": "PRODUCT_BROWSER_QA_GATE.md",
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def expect(condition: bool, message: str, issues: list[str]) -> None:
    if not condition:
        issues.append(message)


def validate(out_dir: Path) -> list[str]:
    issues: list[str] = []
    paths = {name: out_dir / rel for name, rel in REQUIRED_FILES.items()}
    for name, path in paths.items():
        expect(path.exists(), f"missing {name}: {path.as_posix()}", issues)
    if issues:
        return issues

    manifest = read_json(paths["manifest"])
    status = read_json(paths["status"])
    checklist = read_json(paths["checklist"])
    summary = read_json(paths["summary"])
    report = paths["report"].read_text(encoding="utf-8")

    expect(manifest.get("approval_file_purpose") == "template_only_not_approval", "manifest must be a template only", issues)
    expect(manifest.get("approved") is False, "manifest must not be approved", issues)
    expect(manifest.get("actual_browser_execution") is False, "manifest must not claim browser execution", issues)
    expect(manifest.get("actual_route_repointing") is False, "manifest must not claim route repointing", issues)
    hard_gates = manifest.get("hard_gates_preserved", {})
    for key in ["azure_data_plane_write", "product_route_repointing", "browser_live_claim", "legacy_retirement"]:
        expect(hard_gates.get(key) == "not_run", f"{key} must remain not_run", issues)

    surfaces = manifest.get("surfaces", [])
    expect(isinstance(surfaces, list), "surfaces must be a list", issues)
    products = {surface.get("product") for surface in surfaces if isinstance(surface, dict)}
    expect(products == REQUIRED_PRODUCTS, f"products must be {sorted(REQUIRED_PRODUCTS)}", issues)
    assertion_count = 0
    for surface in surfaces if isinstance(surfaces, list) else []:
        assertions = surface.get("required_assertions", [])
        artifacts = surface.get("required_proof_artifacts", [])
        assertion_count += len(assertions) if isinstance(assertions, list) else 0
        expect(surface.get("browser_live_claim") is False, f"{surface.get('product')} must not claim browser proof", issues)
        expect(surface.get("route_repoint_authorized") is False, f"{surface.get('product')} must not authorize route repoint", issues)
        expect(isinstance(assertions, list) and len(assertions) >= 6, f"{surface.get('product')} needs at least 6 assertions", issues)
        expect(isinstance(artifacts, list) and len(artifacts) >= 5, f"{surface.get('product')} needs proof artifact types", issues)

    expect(checklist.get("product_count") == 4, "checklist product count must be 4", issues)
    expect(checklist.get("required_assertion_count") == assertion_count, "checklist assertion count mismatch", issues)
    expect(assertion_count >= 27, "required assertion count must be at least 27", issues)
    expect(checklist.get("actual_browser_execution") is False, "checklist must not claim browser execution", issues)
    expect(checklist.get("actual_route_repointing") is False, "checklist must not claim route repointing", issues)

    prereq = summary.get("prerequisites", {})
    expect(prereq.get("status") == "pass", "summary prerequisites must pass", issues)
    expect(summary.get("accepted") is True, "summary must be accepted after local prerequisites pass", issues)
    expect(summary.get("product_count") == 4, "summary product count must be 4", issues)
    expect(summary.get("required_assertion_count") == assertion_count, "summary assertion count mismatch", issues)
    expect(status.get("actual_browser_execution") is False, "status must not claim browser execution", issues)
    expect(status.get("actual_route_repointing") is False, "status must not claim route repointing", issues)
    expect("Actual browser execution: `false`" in report, "report must state browser execution false", issues)
    return issues


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    issues = validate(args.out_dir)
    result = {
        "accepted": not issues,
        "checked_out_dir": args.out_dir.as_posix(),
        "issues": issues,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["accepted"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
