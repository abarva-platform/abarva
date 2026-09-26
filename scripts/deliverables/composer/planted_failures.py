"""Planted-failure proof for the composer sandbox.

Every case here must be OBSERVED to fail. A suite that merely asserts "the
sandbox ran and nothing bad happened" proves nothing: the guard has to be seen to
fire, with the mechanism that caught it named. So each case records WHICH layer
stopped it, and a case caught by no layer is a failure of the suite, not a pass.

The layers are proven separately on purpose. Driven through the full entry point,
almost every hostile source is stopped by the static AST gate — which would leave
the runtime audit hook completely unexercised while the report claimed fourteen
green cases. Layer-2 cases therefore step around the static gate deliberately, to
prove the second line actually holds if the first is ever defeated.

Run: python planted_failures.py [--json]
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.realpath(__file__))
PYTHON = os.environ.get("COMPOSER_PYTHON", sys.executable)

# ── layer 1 · static AST gate ────────────────────────────────────────────────
STATIC_CASES = {
    "import os": "import os\nos.listdir('/')\n",
    "import socket": "import socket\ns = socket.socket()\n",
    "import subprocess": "import subprocess\nsubprocess.run(['ls'])\n",
    "import ctypes": "import ctypes\nctypes.CDLL('libc.dylib')\n",
    "import urllib": "from urllib.request import urlopen\nurlopen('http://x')\n",
    "eval": "x = eval('1+1')\n",
    "exec": "exec('x=1')\n",
    "dynamic __import__": "m = __import__('os')\n",
    "builtin open": "f = open('/etc/passwd')\n",
    "dunder escape": "import sdk\nc = sdk.Deck.__class__.__bases__\n",
    "computed getattr": "import sdk\nname = 'sy' + 's'\nm = getattr(sdk, name)\n",
    "globals()": "g = globals()\n",
    "syntax error": "def broken(:\n",
}

# ── layer 2 · runtime guards, static gate stepped around ─────────────────────
RUNTIME_PROBE = r"""
import sys, os, json
sys.path.insert(0, {sdk!r})
from sandbox_runtime import (
    VIOLATIONS, install_audit_hook, install_import_blocker,
    SandboxViolation, DeniedImport,
)
import sdk  # approved library loads first, exactly as bootstrap.py does
import encodings.idna  # the codec socket reaches for; pre-loaded so the DNS case
                       # exercises the socket audit event and not a codec import
install_audit_hook({scratch!r}, (sys.prefix, sys.base_prefix, {sdk!r}, {scratch!r}))
if {with_blocker}:
    install_import_blocker(frozenset({{"sdk", "json", "math"}}))

BODY = {body!r}
# Executed under __name__ == "composer" so the guards see generated code, which
# is the only frame identity they are supposed to act on.
ns = {{"__name__": "composer", "sdk": sdk}}
outcome = {{"blocked": False, "by": None, "detail": None, "violations": []}}
try:
    exec(compile(BODY, "composer.py", "exec"), ns)
except BaseException as exc:
    outcome["by"] = type(exc).__name__
    outcome["detail"] = str(exc)[:160]
outcome["violations"] = list(VIOLATIONS)
# Blocked means a DESIGNED guard fired and said so. An incidental failure — a
# missing codec, a network that happens to be down — is not the guard working,
# and recording it as one would make the whole report worthless.
outcome["blocked"] = bool(VIOLATIONS) and outcome["by"] in {{
    "SandboxViolation", "DeniedImport", "PermissionError", "ImportError",
}}
print(json.dumps(outcome))
"""

RUNTIME_CASES = {
    # A literal address: name resolution would exercise the DNS guard instead,
    # and then this case would not be testing socket.connect at all.
    "network connect": "import socket\ns = socket.socket()\ns.settimeout(2)\ns.connect(('93.184.216.34', 80))",
    "dns lookup": "import socket\nsocket.getaddrinfo('example.com', 80)",
    "http client": "import http.client\nhttp.client.HTTPConnection('example.com').connect()",
    "subprocess spawn": "import subprocess\nsubprocess.Popen(['/bin/echo', 'x'])",
    "os.system": "import os\nos.system('echo x')",
    "fork": "import os\nos.fork()",
    "ctypes dlopen": "import ctypes\nctypes.CDLL(None)",
    "read outside scratch": "open('/etc/hosts').read()",
    "write outside scratch": "open('/tmp/composer-escape-probe', 'w').write('x')",
    "env mutation": "import os\nos.putenv('X', 'y')",
    "preloaded stdlib import": "import base64\nbase64.b64encode(b'x')",
    "preloaded socket import": "import socket\nsocket.socket()",
}

# ── layer 2b · the audit hook ALONE ──────────────────────────────────────────
# With the import wrapper installed, every network and process case above is
# stopped at `import socket` and the audit hook never runs — so the suite would
# report twelve green cases while one of the two runtime guards sat unexercised.
# These cases run with the wrapper off, so the hook is the only thing left that
# can stop them, and a failure here is unambiguous.
AUDIT_ONLY_CASES = {
    "connect (hook only)": "import socket\ns = socket.socket()\ns.settimeout(2)\ns.connect(('93.184.216.34', 80))",
    "dns (hook only)": "import socket\nsocket.getaddrinfo('example.com', 80)",
    "subprocess (hook only)": "import subprocess\nsubprocess.Popen(['/bin/echo', 'x'])",
    "fork (hook only)": "import os\nos.fork()",
    "ctypes (hook only)": "import ctypes\nctypes.CDLL(None)",
    "read escape (hook only)": "open('/etc/hosts').read()",
}

# ── layer 3 · limits and caps, through the full entry point ──────────────────
ENTRY_CASES = {
    "cpu limit": "import sdk\nwhile True:\n    pass\n",
    "slide cap": "import sdk\nd = sdk.Deck()\nfor _ in range(5000):\n    d.add_slide()\n",
    "shape cap": (
        "import sdk\nd = sdk.Deck()\ns = d.add_slide()\n"
        "for i in range(500):\n    s.add_shape('rect', 0.5, 0.5, 0.2, 0.2)\n"
    ),
    "off-canvas shape": "import sdk\nd = sdk.Deck()\ns = d.add_slide()\ns.add_text('x', 12.5, 1.0, 4.0)\n",
    "save outside scratch": "import sdk\nd = sdk.Deck()\nd.add_slide()\nd.save('/tmp/composer-escape.pptx')\n",
    "read outside via image": (
        "import sdk\nd = sdk.Deck()\ns = d.add_slide()\n"
        "s.add_image('/etc/hosts', 1.0, 1.0, 2.0, 2.0)\n"
    ),
    "empty deck": "import sdk\nd = sdk.Deck()\nd.save('deck.pptx')\n",
}


def run_entry(source: str, cpu_seconds: int = 5) -> tuple[int, str]:
    scratch = tempfile.mkdtemp(prefix="composer-sb-")
    path = os.path.join(scratch, "composer.py")
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(source)
    proc = subprocess.run(
        [PYTHON, "-I", os.path.join(HERE, "bootstrap.py"), scratch, path, HERE],
        capture_output=True,
        text=True,
        timeout=120,
        env={
            "PATH": "/usr/bin:/bin",
            "HOME": scratch,
            "COMPOSER_CPU_SECONDS": str(cpu_seconds),
        },
    )
    return proc.returncode, (proc.stdout.strip() or proc.stderr.strip()[-400:])


def run_runtime_probe(body: str, with_blocker: bool = True) -> tuple[int, str]:
    scratch = tempfile.mkdtemp(prefix="composer-rt-")
    probe = RUNTIME_PROBE.format(
        sdk=HERE, scratch=scratch, body=body, with_blocker=with_blocker
    )
    path = os.path.join(scratch, "probe.py")
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(probe)
    proc = subprocess.run(
        [PYTHON, "-I", path],
        capture_output=True,
        text=True,
        timeout=120,
        env={"PATH": "/usr/bin:/bin", "HOME": scratch},
    )
    return proc.returncode, (proc.stdout.strip() or proc.stderr.strip()[-400:])


def main() -> int:
    sys.path.insert(0, HERE)
    from ast_gate import scan

    results = []

    for name, source in STATIC_CASES.items():
        findings = scan(source)
        results.append(
            {
                "layer": "static_gate",
                "case": name,
                "blocked": bool(findings),
                "by": findings[0] if findings else None,
            }
        )

    for name, body in RUNTIME_CASES.items():
        _code, out = run_runtime_probe(body)
        try:
            parsed = json.loads(out)
        except json.JSONDecodeError:
            parsed = {"blocked": False, "detail": out[-200:]}
        results.append(
            {
                "layer": "runtime_guard",
                "case": name,
                "blocked": bool(parsed.get("blocked")),
                "by": parsed.get("by"),
                "mechanism": (parsed.get("violations") or [None])[0],
                "detail": parsed.get("detail"),
            }
        )

    for name, body in AUDIT_ONLY_CASES.items():
        _code, out = run_runtime_probe(body, with_blocker=False)
        try:
            parsed = json.loads(out)
        except json.JSONDecodeError:
            parsed = {"blocked": False, "detail": out[-200:]}
        mechanism = (parsed.get("violations") or [None])[0]
        results.append(
            {
                "layer": "audit_hook",
                "case": name,
                # The hook is the only designed guard running here, so a block
                # that did not come from it is not a pass.
                "blocked": bool(parsed.get("blocked"))
                and not str(mechanism).startswith("import:"),
                "by": parsed.get("by"),
                "mechanism": mechanism,
                "detail": parsed.get("detail"),
            }
        )

    for name, source in ENTRY_CASES.items():
        code, out = run_entry(source)
        results.append(
            {
                "layer": "entry_point",
                "case": name,
                "blocked": code != 0,
                "by": out[:220],
            }
        )

    escaped = [r for r in results if not r["blocked"]]
    if "--json" in sys.argv:
        print(json.dumps({"results": results, "escaped": len(escaped)}, indent=2))
    else:
        for r in results:
            mark = "BLOCKED" if r["blocked"] else "ESCAPED"
            why = r.get("mechanism") or r.get("by")
            print(f"  {mark:8} {r['layer']:14} {r['case']:26} {str(why)[:92]}")
        print(f"\n{len(results) - len(escaped)}/{len(results)} blocked")
    return 1 if escaped else 0


if __name__ == "__main__":
    raise SystemExit(main())
