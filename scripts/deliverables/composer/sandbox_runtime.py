"""The runtime half of the composer sandbox: limits, audit hook, import blocker.

Separated from bootstrap.py so each layer can be proven on its own. The static
AST gate stops most hostile source before it runs, which means a planted-failure
test driven through the full entry point only ever exercises the static gate —
and a runtime guard that is never reached by its own test suite is not a proven
guard. See feedback in the increment brief §10.5: the guard must be OBSERVED to
fire, and it can only be observed if the layer above it is stepped around.

None of this is the security boundary; §10.1 of the brief says what is.
"""

from __future__ import annotations

import os
import resource
import sys

CPU_SECONDS = int(os.environ.get("COMPOSER_CPU_SECONDS", "60"))
ADDRESS_SPACE_MB = int(os.environ.get("COMPOSER_MEMORY_MB", "1536"))
OUTPUT_MAX_MB = int(os.environ.get("COMPOSER_OUTPUT_MB", "64"))

BLOCKED_EVENTS = frozenset(
    {
        "socket.connect",
        "socket.bind",
        "socket.getaddrinfo",
        "socket.gethostbyname",
        "subprocess.Popen",
        "os.system",
        "os.exec",
        "os.posix_spawn",
        "os.fork",
        "os.forkpty",
        "os.putenv",
        "os.unsetenv",
        "ctypes.dlopen",
        "ctypes.dlsym",
        "ctypes.call_function",
        "ctypes.set_exception",
        "urllib.Request",
        "http.client.connect",
        "ftplib.connect",
        "smtplib.connect",
        "pickle.find_class",
    }
)
# sys._getframe is deliberately absent: dataclasses and enum use it during
# ordinary construction, so blocking it breaks the approved SDK rather than the
# composer. A guard that cannot be switched on is worse than no guard, because
# the list reads as protection.

VIOLATIONS: list[str] = []


class SandboxViolation(PermissionError):
    pass


class DeniedImport(ImportError):
    pass


def install_limits() -> dict[str, bool | int]:
    """CPU and output-size ceilings. Returns which ones this platform accepted.

    RLIMIT_NPROC is deliberately not set: a zero process limit kills the running
    interpreter on macOS rather than the child it is meant to prevent. Process
    creation is blocked by the audit hook, and the container caps processes in
    the deployed lane.
    """
    resource.setrlimit(resource.RLIMIT_CPU, (CPU_SECONDS, CPU_SECONDS))
    resource.setrlimit(resource.RLIMIT_FSIZE, (OUTPUT_MAX_MB << 20, OUTPUT_MAX_MB << 20))
    try:
        resource.setrlimit(resource.RLIMIT_AS, (ADDRESS_SPACE_MB << 20, ADDRESS_SPACE_MB << 20))
        address_space = True
    except (ValueError, OSError):
        address_space = False
    return {
        "cpuSeconds": CPU_SECONDS,
        "outputMaxMb": OUTPUT_MAX_MB,
        "memoryMb": ADDRESS_SPACE_MB,
        "addressSpaceLimited": address_space,
    }


def install_audit_hook(scratch: str, readable_roots: tuple[str, ...]) -> None:
    """A PEP 578 hook — it cannot be removed once installed, which is the point.

    Monkeypatching `socket` or `open` would be undone by any code that re-imports
    them. An audit hook is not reachable from the code it guards.
    """
    scratch = os.path.realpath(scratch)
    roots = tuple(os.path.realpath(r) for r in readable_roots)

    def _audit(event: str, args):  # noqa: ANN001
        if event in BLOCKED_EVENTS:
            VIOLATIONS.append(event)
            raise SandboxViolation(f"sandbox: blocked audit event {event!r}")
        if event == "open":
            raw = args[0]
            if not isinstance(raw, (bytes, str, int)) or isinstance(raw, int):
                return
            target = os.path.realpath(os.fspath(raw))
            writing = any(c in str(args[1] or "r") for c in "wax+")
            inside = target == scratch or target.startswith(scratch + os.sep)
            if writing and not inside:
                VIOLATIONS.append(f"open:w:{target}")
                raise SandboxViolation(f"sandbox: write outside scratch: {target}")
            if not writing and not (inside or any(target.startswith(r) for r in roots)):
                VIOLATIONS.append(f"open:r:{target}")
                raise SandboxViolation(f"sandbox: read outside approved roots: {target}")

    sys.addaudithook(_audit)


def install_import_blocker(allowed: frozenset[str], caller_module: str = "composer") -> None:
    """Denies an import that generated code is not allowed to make.

    TWO mechanisms, because one is not enough:

    `sys.meta_path` catches modules that have never been loaded. It does NOT
    catch a module that is already in sys.modules — the import system resolves
    those before any finder is consulted. Loading python-pptx pulls in roughly
    two hundred stdlib modules, `socket` and `base64` among them, so a finder
    alone leaves all of those reachable from generated code. The planted-failure
    suite found exactly that: `import base64` walked straight through.

    So the real gate is a `builtins.__import__` wrapper, which runs for EVERY
    import statement including sys.modules hits. It applies the allowlist only
    when the importing frame is the generated module, so approved library code
    keeps its own lazy imports — python-pptx resolves `pptx.oxml.ns` at call
    time, and a blanket block would break the SDK rather than the composer.

    Generated code cannot undo this: the AST gate forbids the name `__import__`
    and every dunder attribute, so it has no handle on the wrapper.
    """
    import builtins

    real_import = builtins.__import__

    def _guarded_import(name, globals=None, locals=None, fromlist=(), level=0):  # noqa: A002
        origin = (globals or {}).get("__name__")
        if origin == caller_module:
            root = name.split(".")[0]
            if root not in allowed:
                VIOLATIONS.append(f"import:{name}")
                raise DeniedImport(f"sandbox: import of {name!r} is not allowed")
        return real_import(name, globals, locals, fromlist, level)

    builtins.__import__ = _guarded_import

    class _Blocker:
        """Second line, for modules never loaded at all — including ones reached
        indirectly, where there is no generated-code frame to key on."""

        def find_module(self, fullname, path=None):  # legacy API, still consulted
            return self.find_spec(fullname, path)

        def find_spec(self, fullname, path=None, target=None):  # noqa: ANN001
            root = fullname.split(".")[0]
            if root in allowed or root in sys.modules:
                return None
            VIOLATIONS.append(f"import:{fullname}")
            raise DeniedImport(f"sandbox: import of {fullname!r} is not allowed")

    sys.meta_path.insert(0, _Blocker())
