"""Sandbox entry point for model-authored composer source.

ORDER MATTERS, and the order is the design:

  1. resource limits        — before anything can allocate
  2. import the approved SDK (and, through it, python-pptx and Pillow)
  3. install the audit hook — after the approved libraries are loaded
  4. install the import blocker
  5. static-gate the generated source
  6. execute it

Step 3 comes after step 2 deliberately. python-pptx and Pillow open files and
touch the import machinery as they load; a hook installed before them would be
fighting approved code rather than guarding against unapproved code. The window
closes before any model-authored byte runs, which is the property that matters.

Usage: bootstrap.py <scratch-dir> <source-file> <sdk-dir>
"""

from __future__ import annotations

import json
import os
import sys

SCRATCH = os.path.realpath(sys.argv[1])
SOURCE_PATH = os.path.realpath(sys.argv[2])
SDK_DIR = os.path.realpath(sys.argv[3])
sys.path.insert(0, SDK_DIR)

from sandbox_runtime import (  # noqa: E402
    VIOLATIONS,
    install_audit_hook,
    install_import_blocker,
    install_limits,
)

limits = install_limits()

import sdk  # noqa: E402,F401

# python-pptx defers Pillow until the first add_picture, which would land after
# the import blocker is installed. Load it now so an image-bearing deck is not
# refused for reaching a dependency the SDK legitimately needs.
try:
    import PIL.Image  # noqa: F401,E402
except ImportError:  # pragma: no cover — image primitives then fail loudly
    pass

from ast_gate import ALLOWED_IMPORTS, scan  # noqa: E402

# The installed interpreter and its site-packages are approved read-only assets:
# python-pptx loads its default template from there on Presentation(). Writes
# stay scratch-only regardless.
install_audit_hook(SCRATCH, (sys.prefix, sys.base_prefix, SDK_DIR, SCRATCH))
install_import_blocker(ALLOWED_IMPORTS)

with open(SOURCE_PATH, "r", encoding="utf-8") as handle:
    source = handle.read()

findings = scan(source)
if findings:
    print(json.dumps({"ok": False, "stage": "static_gate", "findings": findings}))
    raise SystemExit(2)

os.chdir(SCRATCH)
namespace = {"__name__": "composer", "sdk": sdk}
try:
    exec(compile(source, "composer.py", "exec"), namespace)  # noqa: S102
except BaseException as exc:  # noqa: BLE001 — every failure is reported, not raised
    print(
        json.dumps(
            {
                "ok": False,
                "stage": "execution",
                "error": f"{type(exc).__name__}: {exc}",
                "violations": VIOLATIONS,
                **limits,
            }
        )
    )
    raise SystemExit(3) from None

print(
    json.dumps(
        {
            "ok": True,
            "stage": "complete",
            "outputs": sorted(f for f in os.listdir(SCRATCH) if f.endswith(".pptx")),
            "violations": VIOLATIONS,
            **limits,
        }
    )
)
