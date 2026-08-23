#!/usr/bin/env python3
"""Validate Source 360 ECL route-readiness without repointing a product route."""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ECL_OUT_DIR = ROOT / "outputs/ecl-commercial-contract-supply-correction-2026-08-22"
DEFAULT_OUT_DIR = ROOT / "outputs/ecl-source-route-readiness-2026-08-23"

ROUTE_FILES = [
    {
        "route": "/source/vendor-portfolio/[contractId]",
        "path": ROOT / "src/app/(maestro)/source/vendor-portfolio/[contractId]/page.tsx",
        "expected_markers": [
            "SOURCE_WORKSPACE_ROUTE",
            "/source/preview/workspace",
            "redirect(",
        ],
        "current_read_path": "redirects_to_source_workspace",
        "required_next": "Preserve bookmark redirect; route adoption should happen in the workspace surface, not this archived route.",
    },
    {
        "route": "/source/preview/workspace",
        "path": ROOT / "src/app/(maestro)/source/preview/workspace/page.tsx",
        "expected_markers": [
            "requireTenancy",
            "loadSourceWorkspacePortfolio",
            "WorkspaceClient",
            "force-dynamic",
        ],
        "current_read_path": "current_source_data_plane_adapter",
        "required_next": "Introduce an ECL-backed adapter behind an explicit route/data-source flag, then run signed-in browser QA.",
    },
    {
        "route": "/source/preview/workspace/live/portfolioAdapter",
        "path": ROOT / "src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts",
        "expected_markers": [
            "listContract360",
            "listVendorContractPortfolio",
            "listContractApplicationScope",
            "loadSourceV4WorkspaceSnapshot",
            "SOURCE_WORKSPACE_PROVIDER",
            "SOURCE_WORKSPACE_ECL_PROJECTION_DIR",
            "EclProjectionCsvProvider",
        ],
        "current_read_path": "legacy_default_with_flagged_ecl_projection_adapter",
        "required_next": "Run signed-in browser QA with SOURCE_WORKSPACE_PROVIDER=ecl_projection before any production default switch.",
    },
]

ECL_ADAPTER_GUARD_MARKERS = [
    "SOURCE_WORKSPACE_PROVIDER",
    "SOURCE_WORKSPACE_ECL_PROJECTION_DIR",
    "EclProjectionCsvProvider",
]

ROUTE_REPOINT_MARKERS = [
    "ecl_projection.source_contract_360",
    "source_contract_360_projection.csv",
    "source_vendor_360_projection.csv",
    "source_value_levers_projection.csv",
    "source_event_workspace_projection.csv",
]


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def display_path(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def route_status_rows() -> tuple[list[dict[str, Any]], list[str], bool]:
    rows: list[dict[str, Any]] = []
    issues: list[str] = []
    unguarded_ecl_repointed = False

    for route in ROUTE_FILES:
        path = route["path"]
        if not path.exists():
            issues.append(f"Missing route file: {display_path(path)}")
            text = ""
        else:
            text = path.read_text(encoding="utf-8")

        missing = [marker for marker in route["expected_markers"] if marker not in text]
        repoint_hits = [marker for marker in ROUTE_REPOINT_MARKERS if marker in text]
        guarded_adapter = bool(repoint_hits) and all(
            marker in text for marker in ECL_ADAPTER_GUARD_MARKERS
        )
        unguarded_ecl_repointed = unguarded_ecl_repointed or (
            bool(repoint_hits) and not guarded_adapter
        )
        if missing:
            issues.append(
                f"{route['route']}: missing expected markers: {', '.join(missing)}"
            )

        rows.append(
            {
                "route": route["route"],
                "file": display_path(path),
                "current_read_path": route["current_read_path"],
                "expected_marker_count": len(route["expected_markers"]),
                "missing_expected_markers": "; ".join(missing),
                "ecl_repoint_marker_hits": "; ".join(repoint_hits),
                "route_repointed_to_ecl": "guarded_adapter"
                if guarded_adapter
                else "yes"
                if repoint_hits
                else "no",
                "required_next": route["required_next"],
            }
        )

    return rows, issues, unguarded_ecl_repointed


def assert_no_unguarded_ecl_route_repointing() -> tuple[bool, list[str]]:
    source_route_root = ROOT / "src/app/(maestro)/source"
    source_component_root = ROOT / "src/components/source"
    hits: list[str] = []
    for root in [source_route_root, source_component_root]:
        for path in root.rglob("*"):
            if path.suffix not in {".ts", ".tsx"}:
                continue
            text = path.read_text(encoding="utf-8")
            for marker in ROUTE_REPOINT_MARKERS:
                if marker in text:
                    if all(guard in text for guard in ECL_ADAPTER_GUARD_MARKERS):
                        continue
                    hits.append(f"{path.relative_to(ROOT).as_posix()}::{marker}")
    return (len(hits) == 0), hits


def build_summary(ecl_out_dir: Path, out_dir: Path) -> dict[str, Any]:
    issues: list[str] = []

    acceptance_path = ecl_out_dir / "commercial_proof_acceptance_summary.json"
    mapping_path = ecl_out_dir / "commercial_product_consumption_mapping_summary.json"
    healthy_preview_path = (
        ecl_out_dir
        / "source_360_static_preview/mer-ctr-rcm-001-source-360-preview-qa.json"
    )
    weak_preview_path = (
        ecl_out_dir
        / "source_360_static_preview/mer-ctr-sso-bpo-001-source-360-preview-qa.json"
    )
    contract_projection_path = ecl_out_dir / "source_contract_360_projection.csv"
    vendor_projection_path = ecl_out_dir / "source_vendor_360_projection.csv"
    value_projection_path = ecl_out_dir / "source_value_levers_projection.csv"
    event_projection_path = ecl_out_dir / "source_event_workspace_projection.csv"

    required_paths = [
        acceptance_path,
        mapping_path,
        healthy_preview_path,
        weak_preview_path,
        contract_projection_path,
        vendor_projection_path,
        value_projection_path,
        event_projection_path,
    ]
    for path in required_paths:
        if not path.exists():
            issues.append(f"Missing ECL proof artifact: {display_path(path)}")

    acceptance = read_json(acceptance_path) if acceptance_path.exists() else {}
    mapping = read_json(mapping_path) if mapping_path.exists() else {}
    healthy_preview = read_json(healthy_preview_path) if healthy_preview_path.exists() else {}
    weak_preview = read_json(weak_preview_path) if weak_preview_path.exists() else {}
    contract_rows = read_csv(contract_projection_path) if contract_projection_path.exists() else []
    vendor_rows = read_csv(vendor_projection_path) if vendor_projection_path.exists() else []
    value_rows = read_csv(value_projection_path) if value_projection_path.exists() else []
    event_rows = read_csv(event_projection_path) if event_projection_path.exists() else []

    route_rows, route_issues, route_file_repointed = route_status_rows()
    issues.extend(route_issues)
    global_no_repointing, global_repoint_hits = assert_no_unguarded_ecl_route_repointing()
    if not global_no_repointing:
        issues.append(
            "Source route/component tree references ECL projection artifacts without the explicit adapter flag guard: "
            + "; ".join(global_repoint_hits)
        )

    weak_checks = weak_preview.get("checks", {})
    browser_status = mapping.get("browser_proof")
    route_ready_checks = {
        "commercial_proof_accepted": bool(acceptance.get("accepted")),
        "source_contract_projection_rows": len(contract_rows),
        "source_vendor_projection_rows": len(vendor_rows),
        "source_value_levers_projection_rows": len(value_rows),
        "source_event_workspace_projection_rows": len(event_rows),
        "source_event_workspace_event_rows": sum(1 for row in event_rows if row.get("workspace_tab") == "events"),
        "source_event_workspace_approval_rows": sum(1 for row in event_rows if row.get("workspace_tab") == "approvals"),
        "source_event_workspace_compare_rows": sum(1 for row in event_rows if row.get("workspace_tab") == "compare"),
        "ecl_adapter_flag_markers_present": any(
            row.get("route") == "/source/preview/workspace/live/portfolioAdapter"
            and row.get("missing_expected_markers") == ""
            for row in route_rows
        ),
        "healthy_static_preview_accepted": bool(healthy_preview.get("accepted")),
        "weak_static_preview_accepted": bool(weak_preview.get("accepted")),
        "weak_contract_selected": bool(weak_checks.get("weak_contract_selected")),
        "weak_contract_leverage_visible": bool(
            weak_checks.get("weak_score_visible")
            and weak_checks.get("long_notice_visible")
            and weak_checks.get("shortfall_visible")
        ),
        "product_consumption_browser_proof_status": browser_status,
        "current_routes_not_repointed_to_ecl": not route_file_repointed and global_no_repointing,
        "current_routes_not_unguarded_repointed_to_ecl": (
            not route_file_repointed and global_no_repointing
        ),
        "hard_gate_browser_live_claim": "blocked",
        "hard_gate_product_route_repointing": "blocked",
    }

    if route_ready_checks["source_contract_projection_rows"] != 5:
        issues.append(
            f"Expected 5 Source contract projection rows; got {route_ready_checks['source_contract_projection_rows']}"
        )
    if route_ready_checks["source_vendor_projection_rows"] != 5:
        issues.append(
            f"Expected 5 Source vendor projection rows; got {route_ready_checks['source_vendor_projection_rows']}"
        )
    if route_ready_checks["source_value_levers_projection_rows"] != 5:
        issues.append(
            f"Expected 5 Source value levers projection rows; got {route_ready_checks['source_value_levers_projection_rows']}"
        )
    if route_ready_checks["source_event_workspace_projection_rows"] != 13:
        issues.append(
            f"Expected 13 Source event workspace projection rows; got {route_ready_checks['source_event_workspace_projection_rows']}"
        )
    if route_ready_checks["source_event_workspace_event_rows"] != 5:
        issues.append(
            f"Expected 5 Source event workspace event rows; got {route_ready_checks['source_event_workspace_event_rows']}"
        )
    if route_ready_checks["source_event_workspace_approval_rows"] != 5:
        issues.append(
            f"Expected 5 Source event workspace approval rows; got {route_ready_checks['source_event_workspace_approval_rows']}"
        )
    if route_ready_checks["source_event_workspace_compare_rows"] != 3:
        issues.append(
            f"Expected 3 Source event workspace compare rows; got {route_ready_checks['source_event_workspace_compare_rows']}"
        )
    for key in [
        "commercial_proof_accepted",
        "healthy_static_preview_accepted",
        "weak_static_preview_accepted",
        "weak_contract_selected",
        "weak_contract_leverage_visible",
        "ecl_adapter_flag_markers_present",
        "current_routes_not_unguarded_repointed_to_ecl",
    ]:
        if not route_ready_checks[key]:
            issues.append(f"Readiness check failed: {key}")
    if browser_status != "not_started":
        issues.append(
            f"Expected browser proof to remain not_started before route adoption; got {browser_status}"
        )

    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "accepted": not issues,
        "issue_count": len(issues),
        "issues": issues,
        "readiness_decision": (
            "local_ecl_source_360_projection_ready_for_route_adapter_design"
            if not issues
            else "not_ready"
        ),
        "route_repointing_performed": False,
        "live_browser_proof_claimed": False,
        "next_gate": "product_route_repointing",
        "checks": route_ready_checks,
        "routes_checked": len(route_rows),
        "source_route_repoint_hits": global_repoint_hits,
        "route_readiness_csv": display_path(out_dir / "source_360_route_readiness.csv"),
        "route_readiness_markdown": display_path(out_dir / "source_360_route_readiness.md"),
    }

    write_csv(
        out_dir / "source_360_route_readiness.csv",
        route_rows,
        [
            "route",
            "file",
            "current_read_path",
            "expected_marker_count",
            "missing_expected_markers",
            "ecl_repoint_marker_hits",
            "route_repointed_to_ecl",
            "required_next",
        ],
    )
    render_markdown(out_dir / "source_360_route_readiness.md", summary, route_rows)
    return summary


def render_markdown(path: Path, summary: dict[str, Any], route_rows: list[dict[str, Any]]) -> None:
    checks = summary["checks"]
    lines = [
        "# Source 360 Route Readiness",
        "",
        "Local proof only. This report verifies that the ECL commercial slice can supply a Source 360 contract preview while the live Source route remains unrepointed.",
        "",
        f"- Accepted: `{str(summary['accepted']).lower()}`",
        f"- Readiness decision: `{summary['readiness_decision']}`",
        f"- Route repointing performed: `{str(summary['route_repointing_performed']).lower()}`",
        f"- Live browser proof claimed: `{str(summary['live_browser_proof_claimed']).lower()}`",
        f"- Next gate: `{summary['next_gate']}`",
        "",
        "## Checks",
        "",
        "| Check | Value |",
        "|---|---:|",
    ]
    for key, value in checks.items():
        lines.append(f"| `{key}` | `{value}` |")
    lines.extend(
        [
            "",
            "## Route Read Path",
            "",
            "| Route | Current read path | Repointed to ECL | Required next |",
            "|---|---|---|---|",
        ]
    )
    for row in route_rows:
        lines.append(
            "| {route} | `{current_read_path}` | {route_repointed_to_ecl} | {required_next} |".format(
                **row
            )
        )
    lines.extend(
        [
            "",
            "## Boundary",
            "",
            "Passing this gate means the local ECL projection and static Source preview are ready for adapter design. It does not mean the signed-in Source route is using ECL, and it does not claim browser/live proof.",
        ]
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ecl-out-dir", type=Path, default=DEFAULT_ECL_OUT_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()

    out_dir = args.out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    summary = build_summary(args.ecl_out_dir.resolve(), out_dir)
    summary_path = out_dir / "source_360_route_readiness_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0 if summary["accepted"] else 1


if __name__ == "__main__":
    sys.exit(main())
