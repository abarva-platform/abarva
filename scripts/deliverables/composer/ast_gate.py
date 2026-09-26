"""Static gate over model-authored composer source.

This runs BEFORE the generated module is imported, so a rejection costs nothing.
It is the primary enforcement point for what generated code may *say*; the audit
hook in bootstrap.py is the second line, for what it may *do*.

Read the threat model in docs/design/deliverables/GOVERNED_MODEL_COMPOSED_PPTX_INCREMENT.md
before relaxing anything here: this is not a security boundary on its own, and it
is not supposed to be. Its job is to fail a confused composer fast and to make a
malicious one loud.
"""

from __future__ import annotations

import ast
import sys

ALLOWED_IMPORTS = frozenset(
    {
        "sdk",
        "math",
        "datetime",
        "json",
        "re",
        "copy",
        "typing",
        "dataclasses",
        "itertools",
        "functools",
        "collections",
        "textwrap",
        "decimal",
        "fractions",
        "statistics",
        "enum",
    }
)

# Names that hand back an execution or reflection primitive. `getattr` is allowed
# only with a literal attribute name — `getattr(o, user_string)` is how an
# allowlist of attributes gets walked around.
FORBIDDEN_NAMES = frozenset(
    {
        "eval",
        "exec",
        "compile",
        "__import__",
        "globals",
        "locals",
        "vars",
        "open",
        "input",
        "breakpoint",
        "help",
        "memoryview",
        "exit",
        "quit",
    }
)

ALLOWED_DUNDER_ATTRS = frozenset({"__name__", "__doc__", "__len__", "__str__"})


class Finding(Exception):
    pass


class Scanner(ast.NodeVisitor):
    def __init__(self) -> None:
        self.findings: list[str] = []

    def flag(self, node: ast.AST, msg: str) -> None:
        self.findings.append(f"line {getattr(node, 'lineno', '?')}: {msg}")

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            root = alias.name.split(".")[0]
            if root not in ALLOWED_IMPORTS:
                self.flag(node, f"import of non-allowlisted module {alias.name!r}")
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        if node.level:
            self.flag(node, "relative import")
        root = (node.module or "").split(".")[0]
        if root not in ALLOWED_IMPORTS:
            self.flag(node, f"import from non-allowlisted module {node.module!r}")
        self.generic_visit(node)

    def visit_Name(self, node: ast.Name) -> None:
        if isinstance(node.ctx, ast.Load) and node.id in FORBIDDEN_NAMES:
            self.flag(node, f"reference to forbidden builtin {node.id!r}")
        self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute) -> None:
        if node.attr.startswith("__") and node.attr not in ALLOWED_DUNDER_ATTRS:
            self.flag(node, f"dunder attribute access {node.attr!r}")
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        fn = node.func
        name = fn.id if isinstance(fn, ast.Name) else getattr(fn, "attr", None)
        if name in {"getattr", "setattr", "delattr"}:
            # A literal name is an ordinary attribute access written the long way.
            # A computed one is an allowlist bypass.
            if len(node.args) < 2 or not isinstance(node.args[1], ast.Constant):
                self.flag(node, f"{name} with a non-literal attribute name")
        self.generic_visit(node)


def scan(source: str) -> list[str]:
    try:
        tree = ast.parse(source)
    except SyntaxError as exc:  # a syntax error is a rejection, not a retry
        return [f"line {exc.lineno}: syntax error: {exc.msg}"]
    scanner = Scanner()
    scanner.visit(tree)
    return scanner.findings


def main() -> int:
    source = sys.stdin.read()
    findings = scan(source)
    for f in findings:
        print(f)
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
