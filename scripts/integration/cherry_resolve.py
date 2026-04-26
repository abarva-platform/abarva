#!/usr/bin/env python3
"""Integration cherry-pick field-merge helper.

Productizes the v2 cherry-resolve logic that has been used manually across
multiple integration packs. Resolves the canonical build trackers safely after
a `git cherry-pick` produces conflicts in:

  - docs/build/build-slices.json
  - docs/build/production-readiness.json
  - docs/build/build-waves.json (optional)

Conflict policies (mirrors OPS1 sections G and H):

  build-slices.json
    - Preserve all existing entries
    - Append the cherry-source slice (by id) if not already present
    - Bump top-level lastUpdated to today (or --date)
    - Validate JSON parse before and after

  production-readiness.json
    - Preserve all existing components
    - Status: conservative-merge - never replace HEAD's status with a higher
      rank from src; rank order is
        not_started < scaffolded < code_complete < tested
        < full_flow_ready < pilot_ready < production_ready
      ("blocked" is treated as a terminal sentinel that never demotes HEAD)
    - Notes: UNION (dedupe by string equality), src appended after HEAD
    - Blockers: UNION (dedupe by id, falling back to description)
    - nextAction: if HEAD == main and src != main, take src; if both diverged
      from main and src content not already in HEAD, append-distinct (single
      space join)
    - Bump top-level lastUpdated

  build-waves.json (only if present)
    - Preserve existing waves
    - completedSlices, skippedSlices, blockedSlices: UNION (dedupe)
    - percentComplete recomputed deterministically as
        round(len(completedSlices) / len(plannedSlices) * 100)

Defensive behaviors:

  - Detect actual conflict markers (`<<<<<<< HEAD`) before running
    `git checkout --ours`; never destroy auto-merged content.
  - Fail with exit 3 if any JSON is malformed.
  - Print a concrete summary of changed components / appended slices / merged
    waves to stdout.
  - --dry-run prints what WOULD change but writes nothing.
  - --summary-json emits a structured JSON summary to stdout instead of the
    human-readable text.

Constraints:

  - No destructive git commands (no reset, push, rebase, branch -D, etc.).
  - The only git invocations are `git show <sha>:<path>` (read-only) and
    `git checkout --ours <path>` (only when conflict markers detected).
  - No network calls.
  - Stdlib imports only (json, subprocess, sys, argparse, pathlib, datetime).
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import date as _date
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BUILD_SLICES_PATH = "docs/build/build-slices.json"
PRT_PATH = "docs/build/production-readiness.json"
WAVES_PATH = "docs/build/build-waves.json"

STATUS_RANK = [
    "not_started",
    "scaffolded",
    "code_complete",
    "tested",
    "full_flow_ready",
    "pilot_ready",
    "production_ready",
]

EXIT_OK = 0
EXIT_USAGE = 2
EXIT_BAD_JSON = 3
EXIT_GIT = 4

CONFLICT_MARKER_HEAD = "<<<<<<< HEAD"
CONFLICT_MARKER_SEP = "======="


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def status_rank(status: str) -> int:
    """Return rank for status ordering. "blocked" / unknown -> -1."""
    if status in STATUS_RANK:
        return STATUS_RANK.index(status)
    return -1


def has_conflict_markers(path: Path) -> bool:
    if not path.exists():
        return False
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return False
    return CONFLICT_MARKER_HEAD in text and CONFLICT_MARKER_SEP in text


def load_json_or_fail(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"error: required file not found: {path}", file=sys.stderr)
        sys.exit(EXIT_BAD_JSON)
    except json.JSONDecodeError as exc:
        print(f"error: malformed JSON in {path}: {exc}", file=sys.stderr)
        sys.exit(EXIT_BAD_JSON)


def parse_json_or_fail(text: str, label: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        print(f"error: malformed JSON from {label}: {exc}", file=sys.stderr)
        sys.exit(EXIT_BAD_JSON)


def git_show(sha: str, repo_path: str) -> str:
    """Return file contents at <sha>:<repo_path>. Read-only invocation."""
    try:
        out = subprocess.check_output(
            ["git", "show", f"{sha}:{repo_path}"],
            stderr=subprocess.PIPE,
        )
    except subprocess.CalledProcessError as exc:
        msg = exc.stderr.decode("utf-8", errors="replace") if exc.stderr else ""
        print(
            f"error: git show {sha}:{repo_path} failed: {msg.strip()}",
            file=sys.stderr,
        )
        sys.exit(EXIT_GIT)
    except FileNotFoundError:
        print("error: git executable not found on PATH", file=sys.stderr)
        sys.exit(EXIT_GIT)
    return out.decode("utf-8", errors="replace")


def git_checkout_ours(path: Path) -> None:
    """Resolve to HEAD's version. Only call when conflict markers detected."""
    try:
        subprocess.run(
            ["git", "checkout", "--ours", str(path)],
            check=True,
            stderr=subprocess.PIPE,
        )
    except subprocess.CalledProcessError as exc:
        msg = exc.stderr.decode("utf-8", errors="replace") if exc.stderr else ""
        print(
            f"error: git checkout --ours {path} failed: {msg.strip()}",
            file=sys.stderr,
        )
        sys.exit(EXIT_GIT)
    except FileNotFoundError:
        print("error: git executable not found on PATH", file=sys.stderr)
        sys.exit(EXIT_GIT)


def write_json(path: Path, data: dict, dry_run: bool) -> None:
    if dry_run:
        return
    text = json.dumps(data, indent=2) + "\n"
    path.write_text(text, encoding="utf-8")


# ---------------------------------------------------------------------------
# build-slices.json merge
# ---------------------------------------------------------------------------


def merge_build_slices(
    head: dict,
    src: dict,
    slice_id: str,
    today: str,
) -> tuple[dict, dict]:
    """Return (merged_dict, summary)."""
    summary = {
        "appended_slices": [],
        "skipped_slices": [],
        "lastUpdated": today,
    }
    head_ids = {s.get("id") for s in head.get("slices", [])}
    src_slices = src.get("slices", [])
    new_entries = [s for s in src_slices if s.get("id") == slice_id]
    if not new_entries:
        print(
            f"error: slice id {slice_id!r} not present in cherry source's "
            f"build-slices.json",
            file=sys.stderr,
        )
        sys.exit(EXIT_USAGE)
    new_entry = new_entries[0]
    if slice_id in head_ids:
        summary["skipped_slices"].append(slice_id)
    else:
        head.setdefault("slices", []).append(new_entry)
        summary["appended_slices"].append(slice_id)
    head["lastUpdated"] = today
    return head, summary


# ---------------------------------------------------------------------------
# production-readiness.json merge
# ---------------------------------------------------------------------------


def _index_components(doc: dict) -> dict[str, dict]:
    return {c["id"]: c for c in doc.get("components", []) if "id" in c}


def _blocker_key(b: dict) -> str:
    return b.get("id") or b.get("description") or json.dumps(b, sort_keys=True)


def _union_notes(head_notes: list, src_notes: list) -> list:
    out = list(head_notes)
    seen = set(out)
    for n in src_notes:
        if n not in seen:
            seen.add(n)
            out.append(n)
    return out


def _union_blockers(head_blockers: list, src_blockers: list) -> list:
    out = list(head_blockers)
    seen = {_blocker_key(b) for b in out}
    for b in src_blockers:
        k = _blocker_key(b)
        if k not in seen:
            seen.add(k)
            out.append(b)
    return out


def _merge_next_action(head_na: str, src_na: str, main_na: str) -> str:
    if head_na == src_na:
        return head_na
    if head_na == main_na and src_na != main_na:
        return src_na
    # Both diverged from main; append-distinct if src content not already there
    if src_na and src_na != main_na and src_na not in head_na:
        return (head_na.rstrip() + " " + src_na.lstrip()).strip()
    return head_na


def _conservative_status(head_status: str, src_status: str) -> str:
    """Never replace HEAD with a higher rank from src.

    "blocked" is treated as a terminal sentinel: if HEAD is blocked, keep
    blocked; otherwise, src=blocked never replaces a non-blocked HEAD with
    blocked through this helper (blockers themselves go through the union
    logic).
    """
    if head_status == src_status:
        return head_status
    if head_status == "blocked":
        return head_status
    if src_status == "blocked":
        # Don't silently mark HEAD blocked from a src signal alone.
        return head_status
    h_rank = status_rank(head_status)
    s_rank = status_rank(src_status)
    if s_rank < h_rank:
        return src_status
    return head_status


def merge_production_readiness(
    head: dict,
    main: dict,
    src: dict,
    today: str,
) -> tuple[dict, dict]:
    """Return (merged_doc, summary)."""
    summary = {
        "changed_components": [],
        "added_components": [],
        "lastUpdated": today,
    }
    head_components = head.setdefault("components", [])
    hc = _index_components(head)
    mc = _index_components(main)
    sc = _index_components(src)

    for cid, scomp in sc.items():
        # If src didn't actually change this component vs main, skip.
        if cid in mc and scomp == mc[cid]:
            continue
        if cid not in hc:
            head_components.append(scomp)
            summary["added_components"].append(cid)
            continue
        hcomp = hc[cid]
        mcomp = mc.get(cid, {})
        merged = dict(hcomp)
        change_fields = []

        # Status: conservative
        new_status = _conservative_status(
            hcomp.get("status", ""), scomp.get("status", "")
        )
        if new_status != hcomp.get("status", ""):
            merged["status"] = new_status
            change_fields.append("status")

        # Notes: UNION
        union_notes = _union_notes(
            list(hcomp.get("notes", [])),
            list(scomp.get("notes", [])),
        )
        if union_notes != list(hcomp.get("notes", [])):
            merged["notes"] = union_notes
            change_fields.append("notes")

        # Blockers: UNION
        union_blockers = _union_blockers(
            list(hcomp.get("blockers", [])),
            list(scomp.get("blockers", [])),
        )
        if union_blockers != list(hcomp.get("blockers", [])):
            merged["blockers"] = union_blockers
            change_fields.append("blockers")

        # nextAction: take src if HEAD untouched vs main, else append-distinct
        new_na = _merge_next_action(
            hcomp.get("nextAction", ""),
            scomp.get("nextAction", ""),
            mcomp.get("nextAction", ""),
        )
        if new_na != hcomp.get("nextAction", ""):
            merged["nextAction"] = new_na
            change_fields.append("nextAction")

        # Other fields (excluding the merged ones above and identity fields):
        # take src when HEAD == main and src diverged.
        for f in scomp:
            if f in {"id", "name", "status", "notes", "blockers", "nextAction"}:
                continue
            s_val = scomp[f]
            m_val = mcomp.get(f) if mcomp else None
            h_val = hcomp.get(f)
            if f in mcomp:
                if s_val != m_val and h_val == m_val:
                    if merged.get(f) != s_val:
                        merged[f] = s_val
                        change_fields.append(f)
            else:
                if f not in hcomp:
                    merged[f] = s_val
                    change_fields.append(f)

        if merged != hcomp:
            idx = head_components.index(hcomp)
            head_components[idx] = merged
            summary["changed_components"].append(
                {"id": cid, "fields": sorted(set(change_fields))}
            )

    head["lastUpdated"] = today
    return head, summary


# ---------------------------------------------------------------------------
# build-waves.json merge (optional)
# ---------------------------------------------------------------------------


def merge_build_waves(head: dict, src: dict, today: str) -> tuple[dict, dict]:
    summary = {"merged_waves": [], "lastUpdated": today}
    head_waves = {w.get("id"): w for w in head.get("waves", []) if "id" in w}
    src_waves = {w.get("id"): w for w in src.get("waves", []) if "id" in w}

    for wid, swave in src_waves.items():
        if wid not in head_waves:
            head.setdefault("waves", []).append(swave)
            head_waves[wid] = swave
            summary["merged_waves"].append({"id": wid, "added": True})
            continue
        hwave = head_waves[wid]
        merged = dict(hwave)
        changed = False
        for arr_field in ("completedSlices", "skippedSlices", "blockedSlices"):
            h_arr = list(hwave.get(arr_field, []))
            s_arr = list(swave.get(arr_field, []))
            seen = set(h_arr)
            for item in s_arr:
                if item not in seen:
                    seen.add(item)
                    h_arr.append(item)
            if h_arr != list(hwave.get(arr_field, [])):
                merged[arr_field] = h_arr
                changed = True

        # Always recompute percentComplete deterministically
        planned = list(merged.get("plannedSlices", hwave.get("plannedSlices", [])))
        completed = list(merged.get("completedSlices", hwave.get("completedSlices", [])))
        if planned:
            pct = round(len(completed) / len(planned) * 100)
        else:
            pct = 0
        if merged.get("percentComplete") != pct:
            merged["percentComplete"] = pct
            changed = True

        if changed:
            for i, w in enumerate(head["waves"]):
                if w.get("id") == wid:
                    head["waves"][i] = merged
                    break
            summary["merged_waves"].append(
                {"id": wid, "added": False, "percentComplete": pct}
            )

    head["lastUpdated"] = today
    return head, summary


# ---------------------------------------------------------------------------
# Source loader (real git OR fixture path)
# ---------------------------------------------------------------------------


def load_src_doc(
    sha: str,
    repo_path: str,
    fixture_path: str | None,
    label: str,
) -> dict | None:
    """Return parsed src doc, or None if unavailable.

    If fixture_path is provided (test mode), read that file. Otherwise try
    `git show <sha>:<repo_path>`; on failure for the optional waves file,
    return None instead of exiting.
    """
    if fixture_path:
        p = Path(fixture_path)
        if not p.exists():
            print(f"error: fixture not found: {p}", file=sys.stderr)
            sys.exit(EXIT_USAGE)
        return parse_json_or_fail(p.read_text(encoding="utf-8"), str(p))
    text = subprocess.run(
        ["git", "show", f"{sha}:{repo_path}"],
        capture_output=True,
    )
    if text.returncode != 0:
        return None
    return parse_json_or_fail(text.stdout.decode("utf-8", errors="replace"), label)


# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="cherry_resolve.py",
        description=(
            "Resolve build-slices.json + production-readiness.json + "
            "build-waves.json conflicts after a cherry-pick using AbarVa's "
            "OPS1 conservative-merge / union-notes / no-false-promotion "
            "policy."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "exit codes:\n"
            "  0  success\n"
            "  2  usage error\n"
            "  3  malformed JSON\n"
            "  4  git invocation failed"
        ),
    )
    parser.add_argument(
        "cherry_sha",
        metavar="CHERRY_SHA",
        help="cherry-pick source commit SHA (any git revision)",
    )
    parser.add_argument(
        "slice_id",
        metavar="SLICE_ID",
        help="slice id to extract from CHERRY_SHA's build-slices.json",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="print what would change but do not write files",
    )
    parser.add_argument(
        "--summary-json",
        action="store_true",
        help="emit a structured JSON summary on stdout instead of human text",
    )
    parser.add_argument(
        "--date",
        default=None,
        help="override today's date (ISO YYYY-MM-DD); default = today",
    )
    parser.add_argument(
        "--repo-root",
        default=".",
        help="repo root containing docs/build/* (default: cwd)",
    )
    # Fixture-mode flags (used by tests; bypass git show)
    parser.add_argument(
        "--src-build-slices",
        default=None,
        help=argparse.SUPPRESS,
    )
    parser.add_argument(
        "--src-readiness",
        default=None,
        help=argparse.SUPPRESS,
    )
    parser.add_argument(
        "--src-waves",
        default=None,
        help=argparse.SUPPRESS,
    )
    parser.add_argument(
        "--main-readiness",
        default=None,
        help=argparse.SUPPRESS,
    )
    parser.add_argument(
        "--main-ref",
        default="main",
        help="git ref for the integration base (default: main)",
    )
    return parser


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    today = args.date or _date.today().isoformat()
    repo_root = Path(args.repo_root).resolve()
    bs_path = repo_root / BUILD_SLICES_PATH
    prt_path = repo_root / PRT_PATH
    waves_path = repo_root / WAVES_PATH

    overall_summary = {
        "cherry_sha": args.cherry_sha,
        "slice_id": args.slice_id,
        "dry_run": bool(args.dry_run),
        "date": today,
        "build_slices": None,
        "production_readiness": None,
        "build_waves": None,
    }

    # ----- build-slices.json -----
    if not bs_path.exists():
        print(f"error: required file not found: {bs_path}", file=sys.stderr)
        return EXIT_BAD_JSON
    if has_conflict_markers(bs_path):
        git_checkout_ours(bs_path)
    bs_head = load_json_or_fail(bs_path)
    bs_src = load_src_doc(
        args.cherry_sha,
        BUILD_SLICES_PATH,
        args.src_build_slices,
        f"{args.cherry_sha}:{BUILD_SLICES_PATH}",
    )
    if bs_src is None:
        print(
            f"error: cannot read build-slices.json from {args.cherry_sha}",
            file=sys.stderr,
        )
        return EXIT_GIT
    bs_merged, bs_summary = merge_build_slices(
        bs_head, bs_src, args.slice_id, today
    )
    write_json(bs_path, bs_merged, args.dry_run)
    # Re-parse to validate post-write
    if not args.dry_run:
        load_json_or_fail(bs_path)
    overall_summary["build_slices"] = bs_summary

    # ----- production-readiness.json -----
    if not prt_path.exists():
        print(f"error: required file not found: {prt_path}", file=sys.stderr)
        return EXIT_BAD_JSON
    if has_conflict_markers(prt_path):
        git_checkout_ours(prt_path)
    prt_head = load_json_or_fail(prt_path)
    prt_src = load_src_doc(
        args.cherry_sha,
        PRT_PATH,
        args.src_readiness,
        f"{args.cherry_sha}:{PRT_PATH}",
    )
    if prt_src is None:
        print(
            f"error: cannot read production-readiness.json from "
            f"{args.cherry_sha}",
            file=sys.stderr,
        )
        return EXIT_GIT
    prt_main = load_src_doc(
        args.main_ref,
        PRT_PATH,
        args.main_readiness,
        f"{args.main_ref}:{PRT_PATH}",
    )
    if prt_main is None:
        # Fall back to HEAD as the "main baseline" - merge is still valid; the
        # nextAction append-distinct simply degrades to "always append".
        prt_main = json.loads(json.dumps(prt_head))
    prt_merged, prt_summary = merge_production_readiness(
        prt_head, prt_main, prt_src, today
    )
    write_json(prt_path, prt_merged, args.dry_run)
    if not args.dry_run:
        load_json_or_fail(prt_path)
    overall_summary["production_readiness"] = prt_summary

    # ----- build-waves.json (optional) -----
    if waves_path.exists() or args.src_waves:
        if waves_path.exists() and has_conflict_markers(waves_path):
            git_checkout_ours(waves_path)
        if waves_path.exists():
            waves_head = load_json_or_fail(waves_path)
        else:
            waves_head = {"waves": []}
        waves_src = load_src_doc(
            args.cherry_sha,
            WAVES_PATH,
            args.src_waves,
            f"{args.cherry_sha}:{WAVES_PATH}",
        )
        if waves_src is not None:
            waves_merged, waves_summary = merge_build_waves(
                waves_head, waves_src, today
            )
            write_json(waves_path, waves_merged, args.dry_run)
            if waves_path.exists() and not args.dry_run:
                load_json_or_fail(waves_path)
            overall_summary["build_waves"] = waves_summary

    # ----- Summary -----
    if args.summary_json:
        print(json.dumps(overall_summary, indent=2))
    else:
        prefix = "[dry-run] " if args.dry_run else ""
        print(f"{prefix}cherry_resolve {args.cherry_sha} {args.slice_id}")
        bs = overall_summary["build_slices"] or {}
        print(
            f"{prefix}build-slices: appended={bs.get('appended_slices', [])} "
            f"skipped={bs.get('skipped_slices', [])}"
        )
        prt = overall_summary["production_readiness"] or {}
        print(
            f"{prefix}production-readiness: changed="
            f"{[c['id'] for c in prt.get('changed_components', [])]} "
            f"added={prt.get('added_components', [])}"
        )
        if overall_summary["build_waves"] is not None:
            wv = overall_summary["build_waves"]
            print(
                f"{prefix}build-waves: merged="
                f"{[w['id'] for w in wv.get('merged_waves', [])]}"
            )
        print(f"{prefix}lastUpdated: {today}")

    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
