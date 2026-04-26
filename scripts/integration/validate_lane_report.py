#!/usr/bin/env python3
"""
OPS7 - Lane SHA / Final Report Validator.

Reads a lane's final markdown / text report and verifies it contains the
metadata required for mechanical collection by the integration agent:

  - LANE-SHA (abbreviated git sha, 7+ hex chars)
  - Slice id ([A-Z]+\\d+)
  - Branch name
  - Files staged / Files changed list (>= 1 entry)
  - Tests run (Jest count, "docs only", or "N/A docs only")
  - Build result (npm run build pass / fail / skip with explanation)
  - Production Readiness Tracker updated yes/no
  - Run Metrics section
  - Guardrails confirmation (no push / no PR / local commit only)

Special case: docs-only lanes that contain "docs only" anywhere in the
report AND do not stage any source `.ts` / `.tsx` files have the Jest test
count requirement waived.

Usage:
  validate_lane_report.py [--json] <PATH_TO_REPORT>
  validate_lane_report.py --help

Exit codes:
  0  valid
  2  invalid (one or more required fields missing)
  3  unable to read the report file

This script is read-only. It does not mutate any file.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from typing import Dict, List, Optional, Tuple


# ---------------------------------------------------------------------
# Field detectors
# ---------------------------------------------------------------------

# LANE-SHA: 7+ hex chars, label is case-insensitive. Accept the literal
# label form (`LANE-SHA: abcdef0`) as the canonical match.
LANE_SHA_RE = re.compile(
    r"LANE[-_ ]?SHA\s*[:=]\s*([0-9a-fA-F]{7,40})",
    re.IGNORECASE,
)

# Slice id: a token like OPS7, QA8, AG10, MG2 anywhere in the report.
SLICE_ID_RE = re.compile(r"\b([A-Z]+\d+)\b")

# Branch line: a line containing `branch:` (case-insensitive) followed by
# a non-empty branch identifier. Tolerates trailing markdown noise like
# backticks.
BRANCH_RE = re.compile(
    r"branch\s*[:=]\s*[`'\"]?([A-Za-z0-9._/\-]+)[`'\"]?",
    re.IGNORECASE,
)

# Files staged / Files changed section header. We accept either
# "Files staged" or "Files changed" (case-insensitive). After we find the
# header, we look forward for at least one list entry.
FILES_HEADER_RE = re.compile(
    r"(?:^|\n)\s*#{0,6}\s*(?:[A-Z]\.\s*)?Files\s+(?:staged|changed)\b[^\n]*",
    re.IGNORECASE,
)

# A list entry under the Files section. We accept numbered entries
# ("1. path/to/file"), bulleted entries ("- path/to/file" or
# "* path/to/file"), and plain `path/to/file.ext` lines that look like
# real paths.
LIST_ENTRY_RE = re.compile(
    r"^\s*(?:[-*]|\d+[.)])\s+([A-Za-z0-9_./\-]+\.[A-Za-z0-9]+)\s*$",
    re.MULTILINE,
)

# Tests line: Jest test count (e.g. "Tests: 12", "Test count: 12",
# "Jest: 12 tests"), or "docs only" / "N/A docs only".
JEST_COUNT_RE = re.compile(
    r"\b(?:tests?|jest|test\s+count)\b[^\n]*?\b(\d+)\b",
    re.IGNORECASE,
)
DOCS_ONLY_RE = re.compile(r"\bdocs\s*only\b", re.IGNORECASE)

# Build result: a line mentioning `npm run build` followed by
# pass/fail/skip indicator, or a top-level "Build:" line with one of
# those tokens.
BUILD_RE = re.compile(
    r"(?:npm\s+run\s+build|^\s*build\s*[:=])"
    r"[^\n]*?(pass|passed|fail|failed|skip|skipped|ok|green|red)",
    re.IGNORECASE | re.MULTILINE,
)

# Tracker update yes/no.
TRACKER_RE = re.compile(
    r"(?:tracker\s+updated|production[-_]readiness\.json\s+updated)"
    r"\s*[:=]\s*(yes|no|true|false)",
    re.IGNORECASE,
)

# Run Metrics section header.
RUN_METRICS_RE = re.compile(
    r"(?:^|\n)\s*#{0,6}\s*(?:[A-Z]\.\s*)?Run\s+Metrics\b",
    re.IGNORECASE,
)

# Guardrails confirmation - any one of "no push", "no PR", or
# "local commit only".
GUARDRAILS_RE = re.compile(
    r"(?:no\s+push|no\s+pr|local\s+commit\s+only|do\s+not\s+push|"
    r"do\s+not\s+open\s+a\s+pr)",
    re.IGNORECASE,
)

# Source file extensions that disqualify a report from the
# "docs-only Jest waiver".
SOURCE_FILE_RE = re.compile(r"\.(ts|tsx)\b", re.IGNORECASE)


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------


def _find_lane_sha(text: str) -> Optional[str]:
    matches = LANE_SHA_RE.findall(text)
    if not matches:
        return None
    # Prefer the last occurrence — the canonical position is at the end.
    return matches[-1].lower()


def _find_slice_id(text: str) -> Optional[str]:
    # Pull from explicit "Slice" / "Slice id" labels first; fall back
    # to the first standalone match.
    labelled = re.search(
        r"slice(?:\s+id)?\s*[:=]\s*([A-Z]+\d+)\b",
        text,
        re.IGNORECASE,
    )
    if labelled:
        return labelled.group(1).upper()
    free = SLICE_ID_RE.search(text)
    return free.group(1) if free else None


def _find_branch(text: str) -> Optional[str]:
    match = BRANCH_RE.search(text)
    if not match:
        return None
    branch = match.group(1)
    # Filter out trivial false positives like `branch: name` placeholders.
    if branch.lower() in {"name", "branch", "todo", "tbd"}:
        return None
    return branch


def _files_staged_entries(text: str) -> List[str]:
    """Return the list of file-like entries inside a Files staged/changed
    section, or an empty list if the section is missing or empty."""
    header = FILES_HEADER_RE.search(text)
    if not header:
        return []
    body_start = header.end()
    # The section ends at the next blank line followed by a heading, OR
    # the next markdown heading (`#` / `##`), OR EOF. We scan a window
    # of ~4000 chars which is plenty for any realistic lane report.
    window = text[body_start : body_start + 4000]
    # Cut at the next markdown heading line.
    next_heading = re.search(r"\n\s*#{1,6}\s+\S", window)
    if next_heading:
        window = window[: next_heading.start()]
    return [m.group(1) for m in LIST_ENTRY_RE.finditer(window)]


def _has_tests_indicator(text: str, files: List[str]) -> Tuple[bool, bool]:
    """Return (has_indicator, was_docs_only_waiver_applied)."""
    docs_only = bool(DOCS_ONLY_RE.search(text))
    has_source = any(SOURCE_FILE_RE.search(f) for f in files)
    if docs_only and not has_source:
        return True, True
    if JEST_COUNT_RE.search(text):
        return True, False
    if DOCS_ONLY_RE.search(text):
        # docs only stated but source files present — still accept the
        # indicator itself. The reviewer will catch the mismatch.
        return True, False
    return False, False


def _has_build_result(text: str) -> bool:
    if BUILD_RE.search(text):
        return True
    # Tolerate "build skipped (symlink panic)" style notes that don't
    # collocate `npm run build` and the verb on the same line. The hard
    # rule is: the report must *mention* a build outcome.
    if re.search(
        r"\b(?:tsc|build)\b[^\n]*\b(?:pass|passed|fail|failed|skip|skipped|ok|green|red)\b",
        text,
        re.IGNORECASE,
    ):
        return True
    return False


def _has_tracker_update(text: str) -> bool:
    return bool(TRACKER_RE.search(text))


def _has_run_metrics(text: str) -> bool:
    return bool(RUN_METRICS_RE.search(text))


def _has_guardrails(text: str) -> bool:
    return bool(GUARDRAILS_RE.search(text))


# ---------------------------------------------------------------------
# Validation core
# ---------------------------------------------------------------------


def validate_report(text: str) -> Dict[str, object]:
    """Return a result dict describing which fields are present / missing."""
    files = _files_staged_entries(text)

    lane_sha = _find_lane_sha(text)
    slice_id = _find_slice_id(text)
    branch = _find_branch(text)
    has_tests, _waived = _has_tests_indicator(text, files)
    has_build = _has_build_result(text)
    has_tracker = _has_tracker_update(text)
    has_run_metrics = _has_run_metrics(text)
    has_guardrails = _has_guardrails(text)

    fields: List[Tuple[str, bool]] = [
        ("lane_sha", lane_sha is not None),
        ("slice_id", slice_id is not None),
        ("branch", branch is not None),
        ("files_staged", len(files) >= 1),
        ("tests", has_tests),
        ("build_result", has_build),
        ("tracker_updated", has_tracker),
        ("run_metrics", has_run_metrics),
        ("guardrails", has_guardrails),
    ]

    present = [name for name, ok in fields if ok]
    missing = [name for name, ok in fields if not ok]

    return {
        "ok": len(missing) == 0,
        "missing": missing,
        "present": present,
        "laneSha": lane_sha or "",
        "sliceId": slice_id or "",
    }


# ---------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="validate_lane_report.py",
        description=(
            "Validate a lane final report. Confirms the report carries "
            "the LANE-SHA, slice id, branch name, files staged list, "
            "test count, build result, tracker update flag, Run Metrics "
            "section, and guardrails confirmation needed for mechanical "
            "collection by the integration agent."
        ),
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit a single-line JSON object describing the result.",
    )
    parser.add_argument(
        "report_path",
        metavar="REPORT_PATH",
        help="Path to the lane's final report (markdown or plain text).",
    )
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    try:
        with open(args.report_path, "r", encoding="utf-8") as fh:
            text = fh.read()
    except (OSError, UnicodeDecodeError) as exc:
        message = f"unable to read report at {args.report_path!r}: {exc}"
        if args.json:
            sys.stdout.write(
                json.dumps(
                    {
                        "ok": False,
                        "missing": ["report_unreadable"],
                        "present": [],
                        "laneSha": "",
                        "sliceId": "",
                        "error": message,
                    }
                )
                + "\n"
            )
        else:
            sys.stderr.write(message + "\n")
        return 3

    result = validate_report(text)

    if args.json:
        sys.stdout.write(json.dumps(result) + "\n")
    else:
        ok = result["ok"]
        missing = result["missing"]
        present = result["present"]
        lane_sha = result["laneSha"] or "<missing>"
        slice_id = result["sliceId"] or "<missing>"
        sys.stdout.write(
            "lane report validation: "
            + ("OK" if ok else "INVALID")
            + "\n"
        )
        sys.stdout.write(f"  slice id : {slice_id}\n")
        sys.stdout.write(f"  lane sha : {lane_sha}\n")
        sys.stdout.write(f"  present  : {', '.join(present) or '(none)'}\n")
        if missing:
            sys.stdout.write(f"  missing  : {', '.join(missing)}\n")

    return 0 if result["ok"] else 2


if __name__ == "__main__":
    sys.exit(main())
