#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const { quarantined } = JSON.parse(
  readFileSync(path.join(here, "source-ava-library-quarantine.json"), "utf8"),
);
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const patterns = quarantined.map(
  ({ suite }) => `lib/source/ava/__tests__/${escapeRegExp(suite)}$`,
);
process.stdout.write(["--testPathIgnorePatterns", ...patterns].join(" "));
