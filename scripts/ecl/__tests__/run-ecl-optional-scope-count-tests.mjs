#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const LOADER_PATH = "scripts/ecl/load_dense_source_room_source_projection_layer.py";
const loaderSource = fs.readFileSync(LOADER_PATH, "utf8");

assert(
  !loaderSource.includes('len(row.get("scoped_applications", "").split(";"))'),
  "scoped_applications counts must filter blank optional scope refs before counting",
);
assert.match(
  loaderSource,
  /def split_semicolon_refs\(value: str \| None\) -> list\[str\]:/,
  "projection loader must centralize optional semicolon reference parsing",
);

const probe = spawnSync(
  "python3",
  [
    "-c",
    `
import importlib.util
import pathlib
import sys

path = pathlib.Path("${LOADER_PATH}")
sys.path.insert(0, str(path.parent.resolve()))
spec = importlib.util.spec_from_file_location("loader", path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

cases = {
    None: [],
    "": [],
    "   ": [],
    ";": [],
    " APP-0001 ; ; APP-0002 ": ["APP-0001", "APP-0002"],
}
for value, expected in cases.items():
    actual = mod.split_semicolon_refs(value)
    assert actual == expected, (value, actual, expected)
`,
  ],
  { encoding: "utf8" },
);

assert.equal(
  probe.status,
  0,
  `optional scope parser probe failed\nSTDOUT:\n${probe.stdout}\nSTDERR:\n${probe.stderr}`,
);

console.log("ECL optional scope count guard passed.");
