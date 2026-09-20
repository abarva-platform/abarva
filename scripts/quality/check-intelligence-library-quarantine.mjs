#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { computeRouteReachability } from "../audit/lib/route-reachability.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const listPath = path.join(here, "intelligence-library-quarantine.json");

export function evaluateIntelligenceLibraryQuarantine(
  payload,
  { exists = () => true, reachable = new Set() } = {},
) {
  const problems = [];
  const entries = payload?.quarantined;
  if (!Array.isArray(entries)) return ["quarantined must be an array"];
  if (entries.length !== payload.ceiling) {
    problems.push(
      `quarantine size ${entries.length} does not match ratchet ${payload.ceiling}`,
    );
  }

  const suites = new Set();
  for (const entry of entries) {
    if (!entry?.suite || suites.has(entry.suite)) {
      problems.push(`missing or duplicate suite: ${entry?.suite ?? "<missing>"}`);
      continue;
    }
    suites.add(entry.suite);
    const suitePath = `src/lib/intelligence/__tests__/${entry.suite}`;
    if (!exists(suitePath)) problems.push(`missing suite: ${suitePath}`);
    if (!entry.owner || !entry.reason) {
      problems.push(`${entry.suite} must name an owner and reason`);
    }
    if (!Array.isArray(entry.subjects) || entry.subjects.length === 0) {
      problems.push(`${entry.suite} must name at least one primary subject`);
      continue;
    }
    for (const subject of entry.subjects) {
      if (!exists(subject)) problems.push(`missing subject: ${subject}`);
      if (reachable.has(subject)) {
        problems.push(
          `${entry.suite} reason expired: ${subject} is product-reachable`,
        );
      }
    }
  }
  return problems;
}

export function evaluateRealRepository() {
  const payload = JSON.parse(readFileSync(listPath, "utf8"));
  const { roots, reachable } = computeRouteReachability(repo);
  if (roots.length === 0) return ["route reachability found no product roots"];
  const relativeReachable = new Set(
    [...reachable].map((file) => path.relative(repo, file)),
  );
  return evaluateIntelligenceLibraryQuarantine(payload, {
    exists: (relative) => existsSync(path.join(repo, relative)),
    reachable: relativeReachable,
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = evaluateRealRepository();
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log("Intelligence library quarantine is current (5 named suites).");
}
