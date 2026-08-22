#!/usr/bin/env python3

"""Validate client-visible synthetic contract document prose quality."""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_DOCUMENT_DIR = Path(
    "outputs/ecl-commercial-contract-supply-correction-2026-08-22/source_room/SP08_Vendor_Contract/documents"
)
DEFAULT_OUT_DIR = Path("outputs/ecl-commercial-contract-supply-correction-2026-08-22")

FORBIDDEN_PHRASES = [
    "Extraction anchor",
    "Extraction method",
    "termination_for_convenience_state",
    "shortfall_penalty_state",
    "market_benchmark_extract_missing",
    "no_benchmarking_right",
    "uncapped_exit_cost",
    "auto_renewal_long_notice_and_shortfall_penalty",
]
SNAKE_CASE_RE = re.compile(r"\b[a-z]+_[a-z0-9_]*[a-z0-9]\b")


def is_allowed_machine_line(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return True
    if stripped.startswith("SYNTHETIC DEMO DATA"):
        return True
    if stripped.startswith(("Contract:", "Supplier:", "Scenario as-of:")):
        return True
    if "`" in stripped:
        return True
    return False


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--document-dir", type=Path, default=DEFAULT_DOCUMENT_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()

    document_dir = args.document_dir.resolve()
    out_dir = args.out_dir.resolve()
    issues: list[dict[str, str]] = []
    docs = sorted(document_dir.glob("*.md"))
    for path in docs:
        lines = path.read_text(encoding="utf-8").splitlines()
        for line_number, line in enumerate(lines, start=1):
            for phrase in FORBIDDEN_PHRASES:
                if phrase in line:
                    issues.append(
                        {
                            "file_name": path.name,
                            "line_number": str(line_number),
                            "rule_id": "forbidden_builder_phrase",
                            "evidence": phrase,
                            "line_excerpt": line[:240],
                        }
                    )
            if is_allowed_machine_line(line):
                continue
            for match in SNAKE_CASE_RE.findall(line):
                issues.append(
                    {
                        "file_name": path.name,
                        "line_number": str(line_number),
                        "rule_id": "snake_case_leaked_to_prose",
                        "evidence": match,
                        "line_excerpt": line[:240],
                    }
                )

    out_dir.mkdir(parents=True, exist_ok=True)
    issue_path = out_dir / "commercial_document_quality_issues.csv"
    with issue_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["file_name", "line_number", "rule_id", "evidence", "line_excerpt"])
        writer.writeheader()
        writer.writerows(issues)

    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "document_dir": document_dir.as_posix(),
        "documents_checked": len(docs),
        "issue_count": len(issues),
        "issues_by_rule": dict(Counter(issue["rule_id"] for issue in issues)),
        "issues_csv": issue_path.as_posix(),
    }
    summary_path = out_dir / "commercial_document_quality_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2, sort_keys=True))
    if issues:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
