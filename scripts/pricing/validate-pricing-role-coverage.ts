#!/usr/bin/env tsx
/**
 * Nexus Pricing Engine — PR1 role-coverage validator.
 *
 * Reads the reference pack under `datasets/reference/pricing-engine-v1/`
 * (or a directory supplied via `--dir` / `PRICING_REFERENCE_PACK_DIR`) and
 * fails (non-zero exit) on any of the checks in `validateCoverage()` below.
 *
 * The validation *functions* in this file (`validateCoverage` and its
 * per-check helpers) are pure — they take already-parsed row arrays and
 * return `{ errors, warnings, summary }` — specifically so they can be unit
 * tested against small synthetic fixtures (see
 * `scripts/pricing/__tests__/validate-pricing-role-coverage.test.ts`)
 * without touching the filesystem or the real committed CSVs.
 *
 * ## What this validator does NOT check yet (by design, not oversight)
 *
 * - "Active roles that have neither a direct rate nor an approved fallback
 *   band": PR1 has no fallback-band concept yet (no tenant/provider rate
 *   cards exist — that's PR2/PR5's 6-tier resolver). This validator checks
 *   only what PR1 *can* check: a direct `pricing_rate_bands.csv` row for the
 *   role, or an explicit `status: "no_default_rate"` flag on the role. The
 *   full fallback-resolver check is deferred to PR2/PR5.
 * - "Ambiguous aliases ... in the same tenant/provider context": PR1 has no
 *   tenant/provider-scoped rate cards yet, so ambiguity is checked at global
 *   scope only (an alias label mapping to more than one active role_code,
 *   full stop). Tenant/provider-scoped ambiguity is N/A until PR2.
 * - "Activity-pack roles missing from the catalog" / "launch archetypes with
 *   unresolved roles": N/A until PR4 (activity packs/archetypes don't exist
 *   yet) — not implemented, per the brief's own PR sequencing.
 */
import path from "node:path";
import { readCsv } from "./csv-utils";

// ---------------------------------------------------------------------------
// Types (loosely typed — CSV fields arrive as strings)
// ---------------------------------------------------------------------------
export interface TowerRow {
  tower_code: string;
  status: string;
}
export interface CapabilityRow {
  capability_code: string;
  tower_code: string;
  status: string;
}
export interface RoleRow {
  role_code: string;
  tower_code: string;
  capability_code: string;
  allowed_level_min: string;
  allowed_level_max: string;
  status: string;
}
export interface AliasRow {
  alias_code: string;
  role_code: string;
  alias_label: string;
  status: string;
}
export interface SeniorityLevelRow {
  level_name: string;
  rank: string;
  status: string;
}
export interface RateBandRow {
  role_code: string;
  status: string;
}

export interface CoverageInput {
  towers: TowerRow[];
  capabilities: CapabilityRow[];
  roles: RoleRow[];
  aliases: AliasRow[];
  levels: SeniorityLevelRow[];
  rateBands: RateBandRow[];
}

export interface CoverageResult {
  errors: string[];
  warnings: string[];
  summary: {
    towerCount: number;
    capabilityCount: number;
    roleCount: number;
    aliasCount: number;
    rateBandCount: number;
    rolesByTower: Record<string, number>;
  };
}

// Numeric floors from brief §4.3 — hard failure below these, regardless of
// how the coverage was reached. Not a target to pad toward; a minimum.
const MIN_ROLES = 220;
const MIN_TOWERS = 18;
const MIN_CAPABILITIES = 65;

const RETIRED_STATUSES = new Set(["retired", "superseded", "deprecated"]);
function isCounted(status: string): boolean {
  return !RETIRED_STATUSES.has(status);
}

export function validateCoverage(input: CoverageInput): CoverageResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const towerCodes = new Set(input.towers.map((t) => t.tower_code));
  const capabilityCodes = new Set(input.capabilities.map((c) => c.capability_code));
  const levelRank = new Map(input.levels.map((l) => [l.level_name, Number(l.rank)]));

  // --- Duplicate role codes ---
  const roleCodeSeen = new Map<string, number>();
  for (const r of input.roles) {
    roleCodeSeen.set(r.role_code, (roleCodeSeen.get(r.role_code) ?? 0) + 1);
  }
  for (const [code, count] of roleCodeSeen) {
    if (count > 1) errors.push(`Duplicate role_code "${code}" appears ${count} times in pricing_roles.csv`);
  }

  // --- Duplicate alias codes / duplicate (role_code, alias_label) pairs ---
  const aliasCodeSeen = new Map<string, number>();
  const aliasPairSeen = new Map<string, number>();
  for (const a of input.aliases) {
    aliasCodeSeen.set(a.alias_code, (aliasCodeSeen.get(a.alias_code) ?? 0) + 1);
    const pairKey = `${a.role_code}::${a.alias_label.trim().toLowerCase()}`;
    aliasPairSeen.set(pairKey, (aliasPairSeen.get(pairKey) ?? 0) + 1);
  }
  for (const [code, count] of aliasCodeSeen) {
    if (count > 1) errors.push(`Duplicate alias_code "${code}" appears ${count} times in pricing_role_aliases.csv`);
  }
  for (const [pairKey, count] of aliasPairSeen) {
    if (count > 1) {
      const [roleCode, label] = pairKey.split("::");
      errors.push(`Duplicate alias "${label}" for role_code "${roleCode}" appears ${count} times`);
    }
  }

  // --- Invalid tower/capability references ---
  for (const c of input.capabilities) {
    if (!towerCodes.has(c.tower_code)) {
      errors.push(`Capability "${c.capability_code}" references unknown tower_code "${c.tower_code}"`);
    }
  }
  for (const r of input.roles) {
    if (!towerCodes.has(r.tower_code)) {
      errors.push(`Role "${r.role_code}" references unknown tower_code "${r.tower_code}"`);
    }
    if (!capabilityCodes.has(r.capability_code)) {
      errors.push(`Role "${r.role_code}" references unknown capability_code "${r.capability_code}"`);
    }
  }

  // --- Invalid allowed-level ranges ---
  for (const r of input.roles) {
    const minRank = levelRank.get(r.allowed_level_min);
    const maxRank = levelRank.get(r.allowed_level_max);
    if (minRank === undefined) {
      errors.push(`Role "${r.role_code}" has allowed_level_min "${r.allowed_level_min}" not present in pricing_seniority_levels.csv`);
      continue;
    }
    if (maxRank === undefined) {
      errors.push(`Role "${r.role_code}" has allowed_level_max "${r.allowed_level_max}" not present in pricing_seniority_levels.csv`);
      continue;
    }
    // rank 1 = most senior. min (least senior) must have a rank >= max (most senior)'s rank.
    if (maxRank > minRank) {
      errors.push(
        `Role "${r.role_code}" has an inverted allowed-level range: allowed_level_min "${r.allowed_level_min}" (rank ${minRank}) is more senior than allowed_level_max "${r.allowed_level_max}" (rank ${maxRank})`,
      );
    }
  }

  // --- Active roles missing rate (direct band or explicit no_default_rate) ---
  const roleCodesWithRate = new Set(input.rateBands.map((b) => b.role_code));
  for (const r of input.roles) {
    if (r.status === "no_default_rate") continue;
    if (!roleCodesWithRate.has(r.role_code)) {
      errors.push(
        `Role "${r.role_code}" (status "${r.status}") has no pricing_rate_bands.csv row and is not flagged status "no_default_rate"`,
      );
    }
  }

  // --- Ambiguous aliases (global scope only for PR1 — see file header) ---
  const activeRoleCodes = new Set(input.roles.filter((r) => isCounted(r.status)).map((r) => r.role_code));
  const aliasLabelToRoleCodes = new Map<string, Set<string>>();
  for (const a of input.aliases) {
    if (!activeRoleCodes.has(a.role_code)) continue;
    const key = a.alias_label.trim().toLowerCase();
    if (!aliasLabelToRoleCodes.has(key)) aliasLabelToRoleCodes.set(key, new Set());
    aliasLabelToRoleCodes.get(key)!.add(a.role_code);
  }
  for (const [label, codes] of aliasLabelToRoleCodes) {
    if (codes.size > 1) {
      errors.push(
        `Ambiguous alias "${label}" maps to ${codes.size} distinct active roles: ${Array.from(codes).sort().join(", ")}`,
      );
    }
  }
  // Also flag a canonical_name-shaped alias colliding with a *different*
  // role's own role_code being referenced under a shared alias is covered
  // above; additionally guard against an alias label that is identical to
  // another role's *own* alias set already covered by the loop above.

  // --- Numeric floors ---
  const countedTowers = input.towers.filter((t) => isCounted(t.status)).length;
  const countedCapabilities = input.capabilities.filter((c) => isCounted(c.status)).length;
  const countedRoles = input.roles.filter((r) => isCounted(r.status)).length;
  if (countedRoles < MIN_ROLES) {
    errors.push(`Role count floor violated: ${countedRoles} active roles, minimum is ${MIN_ROLES}`);
  }
  if (countedTowers < MIN_TOWERS) {
    errors.push(`Tower count floor violated: ${countedTowers} active towers, minimum is ${MIN_TOWERS}`);
  }
  if (countedCapabilities < MIN_CAPABILITIES) {
    errors.push(`Capability count floor violated: ${countedCapabilities} active capabilities, minimum is ${MIN_CAPABILITIES}`);
  }

  // --- Summary ---
  const rolesByTower: Record<string, number> = {};
  for (const r of input.roles) {
    rolesByTower[r.tower_code] = (rolesByTower[r.tower_code] ?? 0) + 1;
  }

  return {
    errors,
    warnings,
    summary: {
      towerCount: input.towers.length,
      capabilityCount: input.capabilities.length,
      roleCount: input.roles.length,
      aliasCount: input.aliases.length,
      rateBandCount: input.rateBands.length,
      rolesByTower,
    },
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function defaultDir(): string {
  return path.resolve(__dirname, "..", "..", "datasets", "reference", "pricing-engine-v1");
}

function loadFromDir(dir: string): CoverageInput {
  return {
    towers: readCsv(path.join(dir, "pricing_towers.csv")) as unknown as TowerRow[],
    capabilities: readCsv(path.join(dir, "pricing_capabilities.csv")) as unknown as CapabilityRow[],
    roles: readCsv(path.join(dir, "pricing_roles.csv")) as unknown as RoleRow[],
    aliases: readCsv(path.join(dir, "pricing_role_aliases.csv")) as unknown as AliasRow[],
    levels: readCsv(path.join(dir, "pricing_seniority_levels.csv")) as unknown as SeniorityLevelRow[],
    rateBands: readCsv(path.join(dir, "pricing_rate_bands.csv")) as unknown as RateBandRow[],
  };
}

function runCli() {
  const argDirIndex = process.argv.indexOf("--dir");
  const dir =
    (argDirIndex >= 0 ? process.argv[argDirIndex + 1] : undefined) ??
    process.env.PRICING_REFERENCE_PACK_DIR ??
    defaultDir();

  const input = loadFromDir(dir);
  const result = validateCoverage(input);

  console.log(`Nexus Pricing Engine — role coverage validation (${dir})`);
  console.log("");
  if (result.errors.length > 0) {
    console.error(`FAILED — ${result.errors.length} error(s):`);
    for (const e of result.errors) console.error(`  - ${e}`);
    if (result.warnings.length > 0) {
      console.warn(`\n${result.warnings.length} warning(s):`);
      for (const w of result.warnings) console.warn(`  - ${w}`);
    }
    process.exit(1);
  }

  console.log("PASSED");
  console.log("");
  console.log("Coverage summary:");
  console.log(`  Towers:      ${result.summary.towerCount}`);
  console.log(`  Capabilities:${result.summary.capabilityCount}`);
  console.log(`  Roles:       ${result.summary.roleCount}`);
  console.log(`  Aliases:     ${result.summary.aliasCount}`);
  console.log(`  Rate bands:  ${result.summary.rateBandCount}`);
  console.log("");
  console.log("  Roles by tower:");
  const rows = Object.entries(result.summary.rolesByTower).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [tower, count] of rows) {
    console.log(`    ${tower}: ${count}`);
  }
  if (result.warnings.length > 0) {
    console.log(`\n${result.warnings.length} warning(s):`);
    for (const w of result.warnings) console.log(`  - ${w}`);
  }
}

// Run the CLI only when this file is executed directly (via `tsx` / `node`),
// not when imported for its exported functions in tests.
if (require.main === module) {
  runCli();
}
