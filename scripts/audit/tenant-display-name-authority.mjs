#!/usr/bin/env node
/**
 * The tenant registry is the authority for a tenant's display name.
 *
 * Two vocabularies name the same tenants and disagree. `buildAgentContext`
 * says `Meridian Health System`; the client registry says `Retail Demo` and
 * `SkyHarbor Global`. The backlog framed this as choosing between them.
 * Neither is right: the data operating model already names the authority —
 * *"Identity is declared, never inferred. Tenancy comes from
 * `datasets/tenant-inputs/tenant-input-registry.json`."* Measured against
 * that file, `buildAgentContext` gets two of three and the client registry
 * one of three. **Both drift; the registry decides.**
 *
 * That is a decision, and 64 non-test files already carry a name the registry
 * does not declare. Renaming them is a large cross-cutting change that has to
 * be done deliberately and is not done here. What this stops is the drift
 * getting worse: each non-registry name has a baseline count that can only go
 * down.
 *
 * Counts, not a ban, and quoted literals only — the same shape as the Source
 * integration quarantine, which works. A ban would fail on day one and be
 * switched off; a name appearing inside prose or a comment is not a
 * declaration, and treating it as one would make the number describe
 * something other than the problem.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../..");
const REGISTRY = "datasets/tenant-inputs/tenant-input-registry.json";
const BASELINE = "scripts/audit/tenant-display-name-baseline.json";

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (["node_modules", ".git", ".next"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const registry = JSON.parse(readFileSync(path.join(REPO, REGISTRY), "utf8"));
const declaredNames = new Set(
  [...(registry.activeTenants ?? []), ...(registry.retiredTenants ?? [])]
    .map((tenant) => tenant.displayName)
    .filter(Boolean),
);

if (declaredNames.size === 0) {
  console.error(`${REGISTRY} declares no display names — refusing to treat that as "nothing drifts".`);
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(path.join(REPO, BASELINE), "utf8"));
const files = walk(path.join(REPO, "src")).filter((file) => {
  const rel = path.relative(REPO, file);
  return !rel.includes("__tests__") && !/\.test\.tsx?$/.test(rel);
});

const problems = [];
const measured = {};

for (const [name, allowed] of Object.entries(baseline.nonRegistryNames)) {
  if (declaredNames.has(name)) {
    problems.push(
      `"${name}" is now declared in ${REGISTRY}. Remove it from the baseline — it is no longer drift.`,
    );
    continue;
  }
  const count = files.filter((file) => {
    const body = readFileSync(file, "utf8");
    return (
      body.includes(`"${name}"`) || body.includes(`'${name}'`) || body.includes(`\`${name}\``)
    );
  }).length;
  measured[name] = count;
  if (count > allowed) {
    problems.push(
      `"${name}" appears in ${count} non-test files, up from ${allowed}. The tenant registry does not ` +
        `declare it, so a new use is new drift. Use the declared name, or declare this one in ${REGISTRY}.`,
    );
  }
}

if (problems.length > 0) {
  console.error("Tenant display-name authority:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

const total = Object.values(measured).reduce((a, b) => a + b, 0);
const allowedTotal = Object.values(baseline.nonRegistryNames).reduce((a, b) => a + b, 0);
console.log(
  `Tenant display names: ${declaredNames.size} declared in the registry. ` +
    `${total} non-test files still carry a name it does not declare (baseline ${allowedTotal}, never rises).`,
);
for (const [name, count] of Object.entries(measured)) {
  const allowed = baseline.nonRegistryNames[name];
  const moved = count < allowed ? `  ↓ ${allowed - count} since baseline — lower the baseline` : "";
  console.log(`  ${name}: ${count}${moved}`);
}
