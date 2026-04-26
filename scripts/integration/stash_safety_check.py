#!/usr/bin/env python3
"""Integration Stash Safety Check.

Checks git stash state before an integration session begins, preventing
accidental stash pop from the wrong branch from introducing conflict markers.

In a prior build session a `git stash pop` re-applied a stash from a
different branch mid-integration, inserting conflict markers into 5 files.
This script detects risky stash state and recommends remediation actions
before any destructive integration step is taken.

Features:
  - List stashes via `git stash list` (read-only)
  - Parse entries into structured records (index, branch, description)
  - Report count and source-branch context
  - Flag stashes that belong to a branch OTHER than the current branch
  - Recommend a specific action per stash (inspect / create-recovery-branch /
    drop-after-confirmation)
  - --json: emit JSON instead of human-readable output
  - --fail-if-stashes: exit 1 when any stashes exist (CI use)
  - --help: show usage

Constraints:
  - Stdlib only (subprocess, json, sys, argparse, pathlib, datetime)
  - No destructive git operations — never pop, apply, or drop
  - The only git invocations are `git stash list` and
    `git rev-parse --abbrev-ref HEAD` (both read-only)
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Exit codes
# ---------------------------------------------------------------------------

EXIT_OK = 0
EXIT_STASHES_FOUND = 1
EXIT_GIT_ERROR = 4

# ---------------------------------------------------------------------------
# Git helpers (read-only)
# ---------------------------------------------------------------------------


def _run_git(args: list[str]) -> tuple[int, str, str]:
    """Run a git command. Returns (returncode, stdout, stderr)."""
    try:
        result = subprocess.run(
            ["git"] + args,
            capture_output=True,
            text=True,
        )
        return result.returncode, result.stdout, result.stderr
    except FileNotFoundError:
        return -1, "", "git executable not found on PATH"


def get_current_branch() -> str:
    """Return the current git branch name."""
    code, stdout, stderr = _run_git(["rev-parse", "--abbrev-ref", "HEAD"])
    if code != 0:
        print(f"error: could not determine current branch: {stderr.strip()}", file=sys.stderr)
        sys.exit(EXIT_GIT_ERROR)
    branch = stdout.strip()
    if not branch or branch == "HEAD":
        # Detached HEAD
        return "HEAD"
    return branch


def list_stash_entries() -> list[str]:
    """Return raw stash list lines from `git stash list`."""
    code, stdout, stderr = _run_git(["stash", "list"])
    if code != 0:
        print(f"error: git stash list failed: {stderr.strip()}", file=sys.stderr)
        sys.exit(EXIT_GIT_ERROR)
    lines = [l for l in stdout.splitlines() if l.strip()]
    return lines


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

# git stash list format:
#   stash@{0}: On <branch>: <description>
#   stash@{0}: WIP on <branch>: <sha> <description>
#   stash@{0}: index on <branch>: <sha> <description>
_STASH_RE = re.compile(
    r"^stash@\{(\d+)\}:\s+"
    r"(?:(?:WIP on|On|index on)\s+([^:]+?)\s*:\s*)?"
    r"(.+)$"
)


def parse_stash_line(line: str) -> dict:
    """Parse a single stash list line into a structured record."""
    m = _STASH_RE.match(line.strip())
    if m:
        index = int(m.group(1))
        branch = (m.group(2) or "").strip()
        description = (m.group(3) or line).strip()
    else:
        # Fallback: couldn't parse structure
        index = 0
        branch = ""
        description = line.strip()
    return {
        "index": index,
        "raw": line.strip(),
        "branch": branch,
        "description": description,
    }


# ---------------------------------------------------------------------------
# Recommended actions
# ---------------------------------------------------------------------------


def recommended_action(stash: dict, current_branch: str) -> str:
    """Return the recommended action string for a stash entry."""
    branch = stash.get("branch", "")
    if not branch:
        # Unknown origin — safest to inspect first
        return "inspect"
    if branch == current_branch:
        # Same branch stash: still potentially risky if forgotten; inspect first
        return "inspect"
    # Different branch: could cause mis-apply conflict markers
    return "create-recovery-branch"


# ---------------------------------------------------------------------------
# Report builder
# ---------------------------------------------------------------------------


def build_report(stashes: list[dict], current_branch: str) -> dict:
    """Build the full safety report dict."""
    records = []
    for stash in stashes:
        branch = stash.get("branch", "")
        is_current = (branch == current_branch) and bool(branch)
        action = recommended_action(stash, current_branch)
        records.append(
            {
                "index": stash["index"],
                "branch": branch,
                "description": stash["description"],
                "isCurrentBranch": is_current,
                "recommendedAction": action,
                "raw": stash["raw"],
            }
        )

    total = len(records)
    other_branch_count = sum(1 for r in records if not r["isCurrentBranch"] and r["branch"])
    is_safe = total == 0

    safety_warning: str | None = None
    preflight_actions: list[str] = []

    if total > 0:
        if other_branch_count > 0:
            safety_warning = (
                f"{other_branch_count} stash(es) from OTHER branches detected. "
                "A stash pop from a different branch can inject conflict markers "
                "into the working tree. DO NOT run `git stash pop` until these "
                "are resolved."
            )
        else:
            safety_warning = (
                f"{total} stash(es) detected on the current branch. "
                "Inspect them before running integration steps."
            )

        preflight_actions.append(
            "Run `git stash list` to review all stash entries."
        )
        for rec in records:
            if not rec["isCurrentBranch"] and rec["branch"]:
                preflight_actions.append(
                    f"stash@{{{rec['index']}}}: Create a recovery branch from this stash "
                    f"(branch '{rec['branch']}') before integration: "
                    f"`git stash branch recovery/{rec['branch']}-stash-{rec['index']} "
                    f"stash@{{{rec['index']}}}`"
                )
            else:
                preflight_actions.append(
                    f"stash@{{{rec['index']}}}: Inspect with "
                    f"`git stash show -p stash@{{{rec['index']}}}` "
                    "and drop only after confirming it is safe: "
                    f"`git stash drop stash@{{{rec['index']}}}`"
                )

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "currentBranch": current_branch,
        "totalStashes": total,
        "stashesFromOtherBranches": other_branch_count,
        "isSafeToIntegrate": is_safe,
        "safetyWarning": safety_warning,
        "stashes": records,
        "recommendedPreflightActions": preflight_actions,
    }


# ---------------------------------------------------------------------------
# Human-readable output
# ---------------------------------------------------------------------------

ACTION_LABELS = {
    "inspect": "INSPECT",
    "create-recovery-branch": "CREATE RECOVERY BRANCH",
    "drop-after-confirmation": "DROP AFTER CONFIRMATION",
}


def print_report(report: dict) -> None:
    """Print a human-readable stash safety report."""
    sep = "-" * 60
    print("Integration Stash Safety Check")
    print(sep)
    print(f"Generated at : {report['generatedAt']}")
    print(f"Current branch: {report['currentBranch']}")
    print(f"Total stashes : {report['totalStashes']}")
    print(f"From other branches: {report['stashesFromOtherBranches']}")
    print(f"Safe to integrate  : {'YES' if report['isSafeToIntegrate'] else 'NO'}")

    if report["safetyWarning"]:
        print()
        print(f"WARNING: {report['safetyWarning']}")

    stashes = report.get("stashes", [])
    if stashes:
        print()
        print("Stash entries:")
        for stash in stashes:
            label = ACTION_LABELS.get(stash["recommendedAction"], stash["recommendedAction"].upper())
            same = " (current branch)" if stash["isCurrentBranch"] else " (OTHER branch)"
            print(f"  stash@{{{stash['index']}}}: [{label}]{same}")
            print(f"    branch     : {stash['branch'] or '(unknown)'}")
            print(f"    description: {stash['description']}")

    preflight = report.get("recommendedPreflightActions", [])
    if preflight:
        print()
        print("Recommended preflight actions:")
        for i, action in enumerate(preflight, 1):
            print(f"  {i}. {action}")

    print()
    if report["isSafeToIntegrate"]:
        print("Result: SAFE — no stashes found, integration may proceed.")
    else:
        print("Result: NOT SAFE — resolve stash state before integration.")


# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="stash_safety_check.py",
        description=(
            "Integration Stash Safety Check — inspect git stash state before\n"
            "beginning an integration session to prevent accidental stash pop\n"
            "from the wrong branch introducing conflict markers."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "exit codes:\n"
            "  0  safe (no stashes) or --fail-if-stashes not set\n"
            "  1  stashes found and --fail-if-stashes is set\n"
            "  4  git invocation error\n\n"
            "examples:\n"
            "  python3 stash_safety_check.py\n"
            "  python3 stash_safety_check.py --json\n"
            "  python3 stash_safety_check.py --fail-if-stashes\n"
            "  python3 stash_safety_check.py --repo-root /path/to/repo"
        ),
    )
    parser.add_argument(
        "--json",
        action="store_true",
        dest="json_output",
        help="emit JSON output instead of human-readable text",
    )
    parser.add_argument(
        "--fail-if-stashes",
        action="store_true",
        dest="fail_if_stashes",
        help="exit 1 if any stashes are found (for CI integration)",
    )
    parser.add_argument(
        "--repo-root",
        default=".",
        help="repository root to run git commands in (default: cwd)",
    )
    return parser


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    # Change to repo root so git commands target the right repo
    repo_root = Path(args.repo_root).resolve()
    if not repo_root.exists():
        print(f"error: repo-root does not exist: {repo_root}", file=sys.stderr)
        return EXIT_GIT_ERROR

    import os
    os.chdir(repo_root)

    current_branch = get_current_branch()
    raw_lines = list_stash_entries()
    stashes = [parse_stash_line(line) for line in raw_lines]
    report = build_report(stashes, current_branch)

    if args.json_output:
        print(json.dumps(report, indent=2))
    else:
        print_report(report)

    if args.fail_if_stashes and report["totalStashes"] > 0:
        return EXIT_STASHES_FOUND

    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
