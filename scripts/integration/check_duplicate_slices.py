#!/usr/bin/env python3
"""Duplicate Slice Preflight (OPS6).

Read-only preflight that classifies one or more candidate SLICE IDs against
the canonical build manifest at ``docs/build/build-slices.json``. The script
prevents agents from rebuilding slices that have already been merged or are
in flight.

Classifications
---------------
- ``readyToRun``: the slice id is not present in the manifest at all. Safe to
  build (modulo dependency review the operator owns).
- ``duplicates``: the slice id is in the manifest with status ``code_complete``
  or ``verified``. BLOCKING. Agent must NOT rebuild.
- ``missing``: alias for ``readyToRun`` (same set, kept for caller convenience).
- ``blocked``: the slice id is in the manifest with status ``blocked`` or
  ``in_progress``. Caution. Caller must pass ``--allow-blocked`` to proceed
  past the exit-4 guard.

Exit codes
----------
- 0: every target is ``readyToRun`` (or blocked-but-allowed); no duplicates
- 2: one or more targets are duplicates (``code_complete`` / ``verified``)
- 3: manifest is malformed JSON, unreadable, or missing
- 4: one or more targets are blocked / in_progress and ``--allow-blocked``
     was not supplied

Notes
-----
- Imports ONLY stdlib modules (json, sys, argparse, pathlib).
- Makes NO network calls.
- DOES NOT modify any files.
- Default manifest path is ``docs/build/build-slices.json`` resolved relative
  to ``Path.cwd()``. Override with ``--manifest=PATH``.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple

DEFAULT_MANIFEST_REL = "docs/build/build-slices.json"

DUPLICATE_STATUSES = frozenset({"code_complete", "verified"})
BLOCKED_STATUSES = frozenset({"blocked", "in_progress"})

EXIT_OK = 0
EXIT_DUPLICATE = 2
EXIT_MANIFEST_ERROR = 3
EXIT_BLOCKED = 4


def parse_args(argv: List[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="check_duplicate_slices.py",
        description=(
            "Duplicate Slice Preflight (OPS6). Classify candidate slice ids "
            "against the canonical build manifest. Exits 0 when safe to build, "
            "2 when a target is already code_complete or verified, 3 on "
            "malformed manifest, and 4 when a target is blocked or in_progress "
            "without --allow-blocked."
        ),
        epilog=(
            "Read-only. No network. No file mutations. Reads "
            "docs/build/build-slices.json by default."
        ),
    )
    parser.add_argument(
        "--json",
        dest="emit_json",
        action="store_true",
        help="Emit a structured JSON report instead of the default text report.",
    )
    parser.add_argument(
        "--manifest",
        dest="manifest",
        default=None,
        metavar="PATH",
        help=(
            "Path to the build-slices manifest. Defaults to "
            "docs/build/build-slices.json relative to the current working "
            "directory."
        ),
    )
    parser.add_argument(
        "--allow-blocked",
        dest="allow_blocked",
        action="store_true",
        help=(
            "Treat blocked / in_progress slices as non-fatal (exit 0 instead "
            "of exit 4). Duplicates are still blocking."
        ),
    )
    parser.add_argument(
        "slice_ids",
        nargs="+",
        metavar="SLICE_ID",
        help="One or more slice ids to classify (e.g. OPS6 PROD5 ACT8).",
    )
    return parser.parse_args(argv)


def resolve_manifest_path(arg_value: str | None) -> Path:
    if arg_value:
        return Path(arg_value)
    return Path.cwd() / DEFAULT_MANIFEST_REL


def load_manifest(path: Path) -> Tuple[Dict[str, str] | None, str | None]:
    """Return (status_index, error_message). Exactly one is None."""
    try:
        raw = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return None, f"manifest not found: {path}"
    except OSError as exc:
        return None, f"manifest unreadable: {path}: {exc}"

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        return None, f"manifest malformed JSON: {path}: {exc}"

    if not isinstance(data, dict):
        return None, f"manifest root must be an object: {path}"

    slices = data.get("slices")
    if not isinstance(slices, list):
        return None, f"manifest 'slices' must be a list: {path}"

    index: Dict[str, str] = {}
    for entry in slices:
        if not isinstance(entry, dict):
            continue
        slice_id = entry.get("id")
        status = entry.get("status")
        if isinstance(slice_id, str) and isinstance(status, str):
            # Last write wins; the manifest is canonically unique-by-id but
            # we tolerate accidental duplicates rather than crash.
            index[slice_id] = status
    return index, None


def classify(
    slice_ids: List[str],
    status_index: Dict[str, str],
) -> Dict[str, List[str | Dict[str, str]]]:
    ready: List[str] = []
    duplicates: List[Dict[str, str]] = []
    blocked: List[Dict[str, str]] = []

    seen: set[str] = set()
    for raw in slice_ids:
        if raw in seen:
            continue
        seen.add(raw)
        if raw in status_index:
            status = status_index[raw]
            if status in DUPLICATE_STATUSES:
                duplicates.append({"id": raw, "status": status})
            elif status in BLOCKED_STATUSES:
                blocked.append({"id": raw, "status": status})
            else:
                # Statuses outside the duplicate / blocked vocabulary
                # (e.g. "ready", "merged") are treated as ready-to-run; the
                # caller decides whether merged means rebuild-or-skip.
                ready.append(raw)
        else:
            ready.append(raw)

    return {
        "readyToRun": ready,
        "duplicates": duplicates,
        "missing": list(ready),
        "blocked": blocked,
    }


def recommended_action(
    classified: Dict[str, List[str | Dict[str, str]]],
    allow_blocked: bool,
) -> str:
    duplicates = classified["duplicates"]
    blocked = classified["blocked"]
    ready = classified["readyToRun"]
    if duplicates:
        ids = ", ".join(d["id"] for d in duplicates)  # type: ignore[index]
        return (
            f"BLOCK: refuse to rebuild already-landed slices ({ids}). "
            "Pick a different slice."
        )
    if blocked and not allow_blocked:
        ids = ", ".join(b["id"] for b in blocked)  # type: ignore[index]
        return (
            f"CAUTION: in-flight or blocked slices ({ids}). Re-run with "
            "--allow-blocked only if the operator has confirmed the lane is free."
        )
    if blocked and allow_blocked:
        ids = ", ".join(b["id"] for b in blocked)  # type: ignore[index]
        ready_label = ", ".join(ready) if ready else "(none)"
        return (
            f"PROCEED with operator override: blocked={ids}; ready={ready_label}."
        )
    if ready:
        return f"PROCEED: ready to build ({', '.join(ready)})."
    return "PROCEED: no targets supplied beyond manifest scan."


def emit_text(
    classified: Dict[str, List[str | Dict[str, str]]],
    action: str,
    manifest_path: Path,
) -> None:
    duplicates = classified["duplicates"]
    blocked = classified["blocked"]
    ready = classified["readyToRun"]

    print(f"manifest: {manifest_path}")
    print(f"readyToRun: {ready}")
    dup_ids = [f"{d['id']}@{d['status']}" for d in duplicates]  # type: ignore[index]
    print(f"duplicates: {dup_ids}")
    print(f"missing: {ready}")
    blk_ids = [f"{b['id']}@{b['status']}" for b in blocked]  # type: ignore[index]
    print(f"blocked: {blk_ids}")
    print(f"recommendedAction: {action}")


def emit_json(
    classified: Dict[str, List[str | Dict[str, str]]],
    action: str,
    manifest_path: Path,
    exit_code: int,
) -> None:
    payload = {
        "manifest": str(manifest_path),
        "readyToRun": classified["readyToRun"],
        "duplicates": classified["duplicates"],
        "missing": classified["missing"],
        "blocked": classified["blocked"],
        "recommendedAction": action,
        "exitCode": exit_code,
    }
    print(json.dumps(payload, indent=2, sort_keys=True))


def main(argv: List[str]) -> int:
    args = parse_args(argv)
    manifest_path = resolve_manifest_path(args.manifest)

    status_index, error = load_manifest(manifest_path)
    if status_index is None:
        # Honour --json on the error path so machine callers can parse it.
        if args.emit_json:
            payload = {
                "manifest": str(manifest_path),
                "error": error,
                "exitCode": EXIT_MANIFEST_ERROR,
            }
            print(json.dumps(payload, indent=2, sort_keys=True))
        else:
            print(f"ERROR: {error}", file=sys.stderr)
        return EXIT_MANIFEST_ERROR

    classified = classify(args.slice_ids, status_index)
    action = recommended_action(classified, args.allow_blocked)

    if classified["duplicates"]:
        exit_code = EXIT_DUPLICATE
    elif classified["blocked"] and not args.allow_blocked:
        exit_code = EXIT_BLOCKED
    else:
        exit_code = EXIT_OK

    if args.emit_json:
        emit_json(classified, action, manifest_path, exit_code)
    else:
        emit_text(classified, action, manifest_path)

    return exit_code


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
