#!/usr/bin/env python3

"""Inventory repo-visible CREATE TABLE statements for ECL sunset planning.

This is a static repo scan. It does not connect to Azure/Postgres and does not
authorize deletion. The output is intentionally conservative: ambiguous runtime
tables are marked for live readback before any retirement decision.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_OUT_DIR = Path("reports/ecl-legacy-table-retirement-map-2026-08-22")
CREATE_TABLE_RE = re.compile(
    r"^\s*create\s+table\s+(?:if\s+not\s+exists\s+)?(?P<name>[a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*)?)\b",
    re.IGNORECASE,
)


def iter_sql_files(repo: Path) -> list[Path]:
    ignored_parts = {
        ".claude",
        ".codex_tmp",
        ".git",
        ".next",
        "__pycache__",
        "audit-artifacts",
        "node_modules",
        "outputs",
        "proof",
        "reports",
        "test-results",
    }
    return sorted(
        path
        for path in repo.rglob("*.sql")
        if not any(part in ignored_parts for part in path.parts)
    )


def normalize_table(raw_name: str) -> tuple[str, str, str]:
    name = raw_name.strip().strip('"')
    if "." in name:
        schema, table = name.split(".", 1)
    else:
        schema, table = "public", name
    return schema.lower(), table.lower(), f"{schema.lower()}.{table.lower()}"


def classify(path: Path, schema: str, table: str) -> tuple[str, str, str]:
    path_text = path.as_posix()
    full = f"{schema}.{table}"

    if "docs/architecture/sql-drafts/ecl_" in path_text or schema.startswith("ecl_"):
        return (
            "NEW_ECL_TARGET",
            "New target schema/table drafted for ECL.",
            "Keep as migration candidate; validate through RLS, migration, and product proof.",
        )

    if "supabase/migrations-archive/" in path_text:
        return (
            "ARCHIVE_ONLY",
            "Archived Supabase-era migration evidence.",
            "Do not use as future source of truth; preserve for history until live object inventory is complete.",
        )

    if "scripts/setup-db.sql" in path_text:
        return (
            "REPLACE_OR_BRIDGE",
            "Standalone setup table outside the ECL contract.",
            "Map any live consumer before replacing with ECL source-file/source-record metadata.",
        )

    product_markers = [
        "home_knowledge",
        "source_",
        "tower",
        "cio_tower",
        "move_",
        "program_",
        "pricing_",
        "expert_",
    ]
    if schema in {"cio_tower"} or any(marker in full for marker in product_markers):
        return (
            "REPLACE_WITH_ECL_PROJECTION",
            "Product-specific or product-read-model table.",
            "Rebuild as ECL projection/cube or compatibility bridge after parity and browser proof.",
        )

    context_markers = [
        "enterprise_context",
        "context_",
        "corpus",
        "knowledge",
        "graph_",
        "relationship",
        "signal",
        "evidence",
        "artifact",
    ]
    if any(marker in full for marker in context_markers):
        return (
            "HOLD_UNTIL_ECL_CONTEXT_PARITY",
            "Context, graph, artifact, signal, or evidence substrate.",
            "Map writer/reader and compare against ECL source/context/relationship/document paths before retiring.",
        )

    admin_markers = [
        "auth",
        "user",
        "team",
        "role",
        "notification",
        "audit",
        "access",
        "approval",
        "sensitive",
    ]
    if any(marker in full for marker in admin_markers):
        return (
            "HOLD_PLATFORM_CONTROL",
            "Platform control, auth, audit, notification, or approval table.",
            "Do not fold into ECL; review separately as control-plane schema.",
        )

    engagement_markers = ["engagement", "client", "portfolio", "initiative", "outcome"]
    if any(marker in full for marker in engagement_markers):
        return (
            "REVIEW_FOR_MOVES_OR_CONTEXT_BRIDGE",
            "Engagement, client, portfolio, initiative, or outcome table.",
            "Determine whether it remains transactional control-plane data or becomes an ECL projection/context fact.",
        )

    return (
        "HOLD_UNTIL_LIVE_READBACK",
        "No safe static classification from name/path alone.",
        "Inventory live writers/readers before assigning retire/keep action.",
    )


def execution_fields(status: str) -> dict[str, object]:
    if status == "NEW_ECL_TARGET":
        return {
            "owner_to_confirm": "ECL schema owner",
            "live_readback_required": False,
            "parity_target": "migration candidate",
            "deletion_authorization_required": False,
        }
    if status == "REPLACE_WITH_ECL_PROJECTION":
        return {
            "owner_to_confirm": "product owner plus ECL projection owner",
            "live_readback_required": True,
            "parity_target": "ECL projection or cube",
            "deletion_authorization_required": True,
        }
    if status == "HOLD_UNTIL_ECL_CONTEXT_PARITY":
        return {
            "owner_to_confirm": "context/retrieval owner plus ECL context owner",
            "live_readback_required": True,
            "parity_target": "ECL source/context/document/relationship path",
            "deletion_authorization_required": True,
        }
    if status == "HOLD_PLATFORM_CONTROL":
        return {
            "owner_to_confirm": "platform/control-plane owner",
            "live_readback_required": True,
            "parity_target": "not ECL by default; keep or migrate as control-plane schema",
            "deletion_authorization_required": True,
        }
    if status == "REVIEW_FOR_MOVES_OR_CONTEXT_BRIDGE":
        return {
            "owner_to_confirm": "Moves/product owner plus ECL context owner",
            "live_readback_required": True,
            "parity_target": "control-plane keep decision or ECL context/projection bridge",
            "deletion_authorization_required": True,
        }
    if status == "ARCHIVE_ONLY":
        return {
            "owner_to_confirm": "architecture/release evidence owner",
            "live_readback_required": False,
            "parity_target": "historical evidence only",
            "deletion_authorization_required": False,
        }
    return {
        "owner_to_confirm": "live data-plane owner",
        "live_readback_required": True,
        "parity_target": "to be assigned after live writer/reader inventory",
        "deletion_authorization_required": True,
    }


def scan(repo: Path) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    seen: set[tuple[str, int, str]] = set()
    for path in iter_sql_files(repo):
        relative = path.relative_to(repo)
        for line_no, line in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), start=1):
            if line.lstrip().startswith("--"):
                continue
            match = CREATE_TABLE_RE.search(line)
            if not match:
                continue
            schema, table, full_name = normalize_table(match.group("name"))
            key = (relative.as_posix(), line_no, full_name)
            if key in seen:
                continue
            seen.add(key)
            status, reason, next_action = classify(relative, schema, table)
            execution = execution_fields(status)
            rows.append(
                {
                    "file": relative.as_posix(),
                    "line": line_no,
                    "schema": schema,
                    "table": table,
                    "full_table_name": full_name,
                    "sunset_status": status,
                    "classification_reason": reason,
                    "next_action": next_action,
                    "owner_to_confirm": execution["owner_to_confirm"],
                    "live_readback_required": execution["live_readback_required"],
                    "parity_target": execution["parity_target"],
                    "deletion_authorization_required": execution["deletion_authorization_required"],
                }
            )
    return rows


def write_outputs(rows: list[dict[str, object]], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    csv_path = out_dir / "legacy_table_retirement_map.csv"
    json_path = out_dir / "legacy_table_retirement_summary.json"
    md_path = out_dir / "README.md"

    fieldnames = [
        "file",
        "line",
        "schema",
        "table",
        "full_table_name",
        "sunset_status",
        "classification_reason",
        "next_action",
        "owner_to_confirm",
        "live_readback_required",
        "parity_target",
        "deletion_authorization_required",
    ]
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    status_counts = Counter(str(row["sunset_status"]) for row in rows)
    schema_counts = Counter(str(row["schema"]) for row in rows)
    unique_tables = sorted({str(row["full_table_name"]) for row in rows})
    duplicate_names = {
        name: count
        for name, count in Counter(str(row["full_table_name"]) for row in rows).items()
        if count > 1
    }
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "scope": "static repo-visible SQL CREATE TABLE inventory",
        "boundary": {
            "azure_read": False,
            "azure_write": False,
            "migration_authorization": False,
            "deletion_authorization": False,
            "product_repointing": False,
        },
        "create_table_statements": len(rows),
        "unique_table_names": len(unique_tables),
        "duplicate_table_names": len(duplicate_names),
        "status_counts": dict(sorted(status_counts.items())),
        "schema_counts_top": dict(schema_counts.most_common(25)),
        "csv": csv_path.as_posix(),
    }
    json_path.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    lines = [
        "# ECL Legacy Table Retirement Map",
        "",
        "Static repo-visible SQL inventory only. This does not connect to Azure/Postgres, does not authorize deletion, and does not prove whether a table is live.",
        "",
        "## Summary",
        "",
        "| Metric | Count |",
        "| --- | ---: |",
        f"| CREATE TABLE statements | {len(rows)} |",
        f"| Unique table names | {len(unique_tables)} |",
        f"| Duplicate table names across files | {len(duplicate_names)} |",
        "",
        "## Status Counts",
        "",
        "| Status | Count |",
        "| --- | ---: |",
    ]
    for status, count in sorted(status_counts.items()):
        lines.append(f"| `{status}` | {count} |")
    lines.extend(
        [
            "",
            "## Boundary",
            "",
            "- No Azure read or write.",
            "- No migration authorization.",
            "- No deletion authorization.",
            "- No product route repointing.",
            "",
            "## Next Use",
            "",
            "Use `legacy_table_retirement_map.csv` as the starting table-by-table retirement pressure map. Rows marked `HOLD_*` require live writer/reader readback before any retirement call. Rows marked `REPLACE_WITH_ECL_PROJECTION` are the first parity targets for Home, Source, Tower, Moves, Intelligence, and cube projections.",
            "",
            "The CSV includes execution columns: `owner_to_confirm`, `live_readback_required`, `parity_target`, and `deletion_authorization_required`. These fields are routing aids, not authorization.",
            "",
            "## Files",
            "",
            f"- `{csv_path.name}`",
            f"- `{json_path.name}`",
        ]
    )
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()

    repo = Path.cwd()
    rows = scan(repo)
    write_outputs(rows, args.out_dir)
    print(json.dumps({"rows": len(rows), "out_dir": args.out_dir.as_posix()}, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
