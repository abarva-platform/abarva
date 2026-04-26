#!/usr/bin/env python3
"""
OPS13 — Demo Pack Final Report Validator
Usage: python3 scripts/integration/validate_demo_pack_report.py <report_file.md> [--json] [--help]

Validates that a final report markdown file contains all required sections and fields.
Non-destructive. No network calls. No file mutation.
"""

import sys
import json
import re
import os

REQUIRED_SECTIONS = [
    "PR number",
    "merge commit",
    "lanes completed",
    "route",
    "readiness",
    "hygiene gate",
    "CI",
    "Vercel",
    "build",
    "Run Metrics",
    "next",
]

REQUIRED_HYGIENE_FIELDS = [
    "git diff --check",
    "conflict marker",
    "JSON",
    "tsc",
    "eslint",
]

REQUIRED_METRICS_FIELDS = [
    "elapsed",
    "subagent",
    "test",
]

def validate_report(content: str) -> dict:
    errors = []
    warnings = []

    lower = content.lower()

    for section in REQUIRED_SECTIONS:
        if section.lower() not in lower:
            errors.append(f"Missing required section/field: '{section}'")

    for field in REQUIRED_HYGIENE_FIELDS:
        if field.lower() not in lower:
            warnings.append(f"Hygiene gate field may be missing: '{field}'")

    for field in REQUIRED_METRICS_FIELDS:
        if field.lower() not in lower:
            warnings.append(f"Run Metrics field may be missing: '{field}'")

    # Check for PR number pattern
    if not re.search(r'#\d+|PR\s*\d+|pull request\s*\d+', content, re.IGNORECASE):
        errors.append("No PR number found (expected #NNN or 'PR NNN' pattern)")

    word_count = len(content.split())
    if word_count < 200:
        warnings.append(f"Report seems short ({word_count} words). Final reports should be comprehensive.")

    return {
        "valid": len(errors) == 0,
        "errorCount": len(errors),
        "warningCount": len(warnings),
        "errors": errors,
        "warnings": warnings,
        "wordCount": word_count,
        "checkedSections": REQUIRED_SECTIONS,
    }

def main():
    args = sys.argv[1:]

    use_json = "--json" in args
    show_help = "--help" in args
    report_args = [a for a in args if not a.startswith("--")]

    if show_help:
        print(__doc__)
        print("Required sections:", ", ".join(REQUIRED_SECTIONS))
        sys.exit(0)

    if not report_args:
        if use_json:
            print(json.dumps({"error": "No report file provided. Use --help for usage."}, indent=2))
        else:
            print("Error: No report file provided.")
            print("Usage: python3 scripts/integration/validate_demo_pack_report.py <report_file.md> [--json]")
        sys.exit(1)

    report_path = report_args[0]

    if not os.path.exists(report_path):
        result = {"error": f"File not found: {report_path}", "valid": False}
        if use_json:
            print(json.dumps(result, indent=2))
        else:
            print(f"Error: File not found: {report_path}")
        sys.exit(1)

    with open(report_path, "r", encoding="utf-8") as f:
        content = f.read()

    result = validate_report(content)
    result["file"] = report_path

    if use_json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Validating: {report_path}")
        print(f"Word count: {result['wordCount']}")
        if result["errors"]:
            print(f"\nERRORS ({result['errorCount']}):")
            for e in result["errors"]:
                print(f"  [ERROR] {e}")
        if result["warnings"]:
            print(f"\nWARNINGS ({result['warningCount']}):")
            for w in result["warnings"]:
                print(f"  [WARN]  {w}")
        print(f"\nResult: {'VALID' if result['valid'] else 'INVALID'}")

    sys.exit(0 if result["valid"] else 1)

if __name__ == "__main__":
    main()
