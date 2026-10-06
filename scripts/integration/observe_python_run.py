#!/usr/bin/env python3
"""
Run a Python script and report what it actually did, so a suite can assert the
"stdlib only, no network" contract by OBSERVATION instead of by reading the
script's source text.

Usage:
  python3 scripts/integration/observe_python_run.py \
      --observation <out.json> -- <script.py> [script args...]

Item T-774. Two ops suites asserted that contract with a regular expression
over the script's bytes: a list of allowed import names matched line by line,
plus `not.toMatch(/urllib|requests|http.client|socket/)`. Both are blind to an
`importlib.import_module` call, to an import inside a function, and to a socket
reached through any alias — and both go red on a comment that merely mentions
the word. The question is about a run, so it is answered by a run.

This harness:
  * snapshots `sys.modules`, then executes the target as `__main__`;
  * reports every top-level module the run added that is not in
    `sys.stdlib_module_names`;
  * replaces the socket entry points with recorders that refuse the call, so a
    network attempt is both blocked and named rather than merely absent;
  * exits with the target's own exit code, so the caller can still assert it.

The observation file is written even when the target raises, because "it
crashed" and "it imported something it should not have" are different findings
and a missing file cannot tell them apart.
"""

import json
import runpy
import socket
import sys
import traceback


def main() -> int:
    argv = sys.argv[1:]
    if "--observation" not in argv or "--" not in argv:
        print(__doc__, file=sys.stderr)
        return 64

    observation_path = argv[argv.index("--observation") + 1]
    target = argv[argv.index("--") + 1 :]
    if not target:
        print("no target script given after --", file=sys.stderr)
        return 64

    network_attempts: list[str] = []

    def _refuse(name):
        def _call(*args, **kwargs):
            network_attempts.append(f"{name}{args!r}")
            raise OSError(f"network is not permitted in this run: {name}")

        return _call

    socket.socket = _refuse("socket.socket")  # type: ignore[assignment]
    socket.create_connection = _refuse("socket.create_connection")  # type: ignore[assignment]
    socket.getaddrinfo = _refuse("socket.getaddrinfo")  # type: ignore[assignment]

    before = set(sys.modules)
    exit_code = 0
    error = None

    sys.argv = list(target)
    try:
        runpy.run_path(target[0], run_name="__main__")
    except SystemExit as exc:
        exit_code = exc.code if isinstance(exc.code, int) else (0 if exc.code is None else 1)
    except BaseException:  # noqa: BLE001 — the crash is an observation, not a failure here
        exit_code = 1
        error = traceback.format_exc()

    added = {name.split(".")[0] for name in set(sys.modules) - before}
    stdlib = set(sys.stdlib_module_names)
    non_stdlib = sorted(
        name
        for name in added
        if name not in stdlib and not name.startswith("_") and name != "__main__"
    )

    with open(observation_path, "w", encoding="utf-8") as handle:
        json.dump(
            {
                "script": target[0],
                "args": target[1:],
                "exitCode": exit_code,
                "nonStdlibModules": non_stdlib,
                "networkAttempts": network_attempts,
                "error": error,
            },
            handle,
            indent=2,
        )

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
