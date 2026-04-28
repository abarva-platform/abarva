#!/usr/bin/env python3
"""OPS8 - Worktree Cleanup Assistant.

Lists git worktrees, classifies each one by branch name pattern, and prints
recommended cleanup commands. NEVER deletes anything: this script is a
read-only assistant. The human operator runs the printed commands manually.

Usage::

    worktree_cleanup_report.py [--json] [--fixture=PATH]

Default mode runs ``git worktree list --porcelain`` via ``subprocess`` from
inside a git repository. ``--fixture=PATH`` mode reads porcelain-formatted
text (and optional ``last_commit_ts``/``dirty``/``on_origin`` metadata lines)
from a fixture file - this lets the integration tests cover stale, dirty,
and missing-on-origin classifications without touching real worktrees.

Module imports are stdlib only (``subprocess``, ``sys``, ``argparse``,
``json``, ``pathlib``, ``datetime``).
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Classification vocabulary
# ---------------------------------------------------------------------------

CLASSIFICATION_ACTIVE_MAIN = "active-main"
CLASSIFICATION_ACTIVE_INTEGRATION = "active-integration"
CLASSIFICATION_LANE_WORKTREE = "lane-worktree"
CLASSIFICATION_STALE_LANE = "stale-lane"
CLASSIFICATION_UNKNOWN = "unknown"

LANE_BRANCH_PREFIXES = ("pack/", "night/", "loop/", "enterprise/", "ops/", "big/")
INTEGRATION_BRANCH_PREFIX = "codex/"
MAIN_BRANCH_NAME = "main"
STALE_THRESHOLD_DAYS = 14

PROVENANCE = "ops8_worktree_cleanup_report"

# ---------------------------------------------------------------------------
# Porcelain parsing
# ---------------------------------------------------------------------------


def _parse_porcelain(text: str) -> list[dict]:
    """Parse ``git worktree list --porcelain`` output into raw records.

    Each record block is separated by a blank line. Recognized keys:
    ``worktree`` (path), ``HEAD`` (sha), ``branch`` (full ref name like
    ``refs/heads/main``), ``bare``, ``detached``. Fixture files may also
    include vendor-specific metadata lines (``last_commit_ts``, ``dirty``,
    ``on_origin``) that we surface to the classifier.
    """
    records: list[dict] = []
    current: dict = {}
    for raw in text.splitlines():
        line = raw.rstrip()
        if not line:
            if current:
                records.append(current)
                current = {}
            continue
        if " " in line:
            key, _, value = line.partition(" ")
        else:
            key, value = line, ""
        current[key] = value
    if current:
        records.append(current)
    return records


def _short_branch(ref: str) -> str:
    if ref.startswith("refs/heads/"):
        return ref[len("refs/heads/") :]
    return ref


# ---------------------------------------------------------------------------
# Real-git probes (skipped in --fixture mode)
# ---------------------------------------------------------------------------


def _git_worktree_list_porcelain() -> str:
    result = subprocess.run(
        ["git", "worktree", "list", "--porcelain"],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def _git_last_commit_ts(branch: str) -> int | None:
    if not branch:
        return None
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%ct", branch],
            check=True,
            capture_output=True,
            text=True,
        )
        ts = result.stdout.strip()
        return int(ts) if ts else None
    except (subprocess.CalledProcessError, ValueError):
        return None


def _git_status_dirty(worktree_path: str) -> bool:
    try:
        result = subprocess.run(
            ["git", "-C", worktree_path, "status", "--short"],
            check=True,
            capture_output=True,
            text=True,
        )
        return bool(result.stdout.strip())
    except subprocess.CalledProcessError:
        return False


def _git_branch_on_origin(branch: str) -> bool:
    if not branch:
        return False
    try:
        result = subprocess.run(
            ["git", "ls-remote", "--heads", "origin", branch],
            check=True,
            capture_output=True,
            text=True,
        )
        return bool(result.stdout.strip())
    except subprocess.CalledProcessError:
        return False


# ---------------------------------------------------------------------------
# Classification
# ---------------------------------------------------------------------------


def classify_branch(branch: str, last_commit_days: int | None) -> str:
    if not branch:
        return CLASSIFICATION_UNKNOWN
    if branch == MAIN_BRANCH_NAME:
        return CLASSIFICATION_ACTIVE_MAIN
    if branch.startswith(INTEGRATION_BRANCH_PREFIX):
        return CLASSIFICATION_ACTIVE_INTEGRATION
    if any(branch.startswith(prefix) for prefix in LANE_BRANCH_PREFIXES):
        if last_commit_days is not None and last_commit_days > STALE_THRESHOLD_DAYS:
            return CLASSIFICATION_STALE_LANE
        return CLASSIFICATION_LANE_WORKTREE
    return CLASSIFICATION_UNKNOWN


def recommend_command(
    classification: str,
    is_dirty: bool,
    on_origin: bool,
    path: str,
    branch: str,
) -> str:
    if classification in (CLASSIFICATION_ACTIVE_MAIN, CLASSIFICATION_ACTIVE_INTEGRATION):
        return "do not remove (active branch)"
    if is_dirty:
        return "warning: working tree dirty - stash or commit first; no removal command emitted"
    if classification == CLASSIFICATION_STALE_LANE:
        if not on_origin:
            return (
                "warning: branch not on origin (would lose work) - push before removing; "
                f"then: git worktree remove --force {path} && git branch -D {branch}"
            )
        return f"git worktree remove --force {path} && git branch -D {branch}"
    if classification == CLASSIFICATION_LANE_WORKTREE:
        return "active lane (within 14 days) - leave in place"
    return "manual review required"


# ---------------------------------------------------------------------------
# Report assembly
# ---------------------------------------------------------------------------


def _now_ts() -> int:
    return int(datetime.now(timezone.utc).timestamp())


def build_report(records: list[dict], *, use_real_git: bool, now_ts: int) -> list[dict]:
    rows: list[dict] = []
    for record in records:
        path = record.get("worktree", "")
        branch_ref = record.get("branch", "")
        branch = _short_branch(branch_ref)

        # Resolve last-commit timestamp.
        last_commit_ts: int | None = None
        if "last_commit_ts" in record and record["last_commit_ts"]:
            try:
                last_commit_ts = int(record["last_commit_ts"])
            except ValueError:
                last_commit_ts = None
        elif use_real_git:
            last_commit_ts = _git_last_commit_ts(branch)

        last_commit_days: int | None = None
        if last_commit_ts is not None:
            last_commit_days = max(0, (now_ts - last_commit_ts) // 86400)

        # Resolve dirty-ness.
        if "dirty" in record:
            is_dirty = record["dirty"].strip().lower() in ("1", "true", "yes")
        elif use_real_git and path:
            is_dirty = _git_status_dirty(path)
        else:
            is_dirty = False

        # Resolve on-origin flag.
        if "on_origin" in record:
            on_origin = record["on_origin"].strip().lower() in ("1", "true", "yes")
        elif use_real_git and branch:
            on_origin = _git_branch_on_origin(branch)
        else:
            on_origin = True  # Conservative: assume safe to remove if unknown.

        classification = classify_branch(branch, last_commit_days)
        recommended = recommend_command(
            classification=classification,
            is_dirty=is_dirty,
            on_origin=on_origin,
            path=path,
            branch=branch,
        )

        rows.append(
            {
                "path": path,
                "branch": branch,
                "classification": classification,
                "isDirty": is_dirty,
                "lastCommitDays": last_commit_days,
                "onOrigin": on_origin,
                "recommendedCommand": recommended,
                "createdFrom": PROVENANCE,
            }
        )
    return rows


# ---------------------------------------------------------------------------
# Output rendering
# ---------------------------------------------------------------------------


def render_text(rows: list[dict]) -> str:
    lines: list[str] = []
    lines.append("OPS8 Worktree Cleanup Report")
    lines.append("=" * 64)
    lines.append("")
    lines.append("This report is READ-ONLY. No worktrees or branches will be removed.")
    lines.append("Run the printed commands manually after review.")
    lines.append("")
    if not rows:
        lines.append("(no worktrees found)")
        return "\n".join(lines) + "\n"
    for row in rows:
        lines.append(f"path:           {row['path']}")
        lines.append(f"branch:         {row['branch']}")
        lines.append(f"classification: {row['classification']}")
        lines.append(f"isDirty:        {row['isDirty']}")
        lines.append(f"lastCommitDays: {row['lastCommitDays']}")
        lines.append(f"onOrigin:       {row['onOrigin']}")
        lines.append(f"recommended:    {row['recommendedCommand']}")
        lines.append("-" * 64)
    return "\n".join(lines) + "\n"


def render_json(rows: list[dict]) -> str:
    payload = {
        "schemaVersion": 1,
        "createdFrom": PROVENANCE,
        "destructive": False,
        "rows": rows,
    }
    return json.dumps(payload, indent=2, sort_keys=True) + "\n"


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="worktree_cleanup_report.py",
        description=(
            "OPS8 worktree cleanup assistant. Lists git worktrees, classifies "
            "each one by branch pattern, and prints recommended cleanup "
            "commands. NEVER deletes anything: human-run only."
        ),
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit structured JSON instead of human-readable text.",
    )
    parser.add_argument(
        "--fixture",
        type=str,
        default=None,
        help=(
            "Read porcelain-formatted text from this file instead of running "
            "git. Used by the integration tests."
        ),
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.fixture:
        fixture_path = Path(args.fixture)
        if not fixture_path.is_file():
            print(f"error: fixture not found: {fixture_path}", file=sys.stderr)
            return 2
        text = fixture_path.read_text(encoding="utf-8")
        use_real_git = False
    else:
        try:
            text = _git_worktree_list_porcelain()
        except (subprocess.CalledProcessError, FileNotFoundError) as exc:
            print(f"error: failed to run git worktree list: {exc}", file=sys.stderr)
            return 2
        use_real_git = True

    records = _parse_porcelain(text)
    rows = build_report(records, use_real_git=use_real_git, now_ts=_now_ts())

    if args.json:
        sys.stdout.write(render_json(rows))
    else:
        sys.stdout.write(render_text(rows))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
