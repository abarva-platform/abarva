#!/usr/bin/env tsx
/**
 * add-tenant.ts — one-pass tenant onboarding script.
 *
 * Adds a brand-new pilot tenant to the four hardcoded registries that the
 * app consults at runtime:
 *
 *   1. src/lib/client-config.ts             (ALL_CLIENTS, CLIENT_KEY_TO_DB_NAME,
 *                                            CLIENT_KEY_TO_INDUSTRY_CODE,
 *                                            EMAIL_DOMAIN_TO_CLIENT_KEY)
 *   2. src/lib/tenant/aliases.ts            (TENANT_ALIAS_PROFILES)
 *   3. src/lib/tenants/demo-tenant-data-tiers.ts  (DEMO_TENANT_DATA_TIERS — shell_only default)
 *   4. src/lib/auth/canonical-auth-roster.ts (CANONICAL_AUTH_EMAILS, CANONICAL_CLIENT_ADMIN_EMAILS)
 *
 * Closes the P0-1 gap surfaced by the synthetic pilot rehearsal
 * (docs/pilot/SYNTHETIC-PILOT-REHEARSAL-LOG.md). Prior to this script,
 * onboarding a new pilot tenant required hand-edits to all four files;
 * easy to miss one and ship a half-configured tenant.
 *
 * Usage:
 *   npx tsx src/scripts/tenants/add-tenant.ts \
 *     --key northwind \
 *     --name "Northwind Retail" \
 *     --industry RETAIL \
 *     --admin-email cdo@northwind-retail
 *
 * Flags:
 *   --key           canonical client key (lowercase, no dash). Required.
 *   --name          display name (e.g. "Northwind Retail"). Required.
 *   --industry      one of RETAIL | HEALTHCARE_IDN | FINSERV | DIVERSIFIED. Required.
 *   --admin-email   admin email or local part (e.g. cdo@northwind-retail OR
 *                   cdo@northwind-retail.example.com). Required.
 *   --short-name    optional short display name. Defaults to --name.
 *   --color         optional hex color for nav chrome. Defaults to a stable color.
 *   --dry-run       print the patch summary without writing.
 *
 * Idempotency:
 *   Re-running with the same --key for an already-registered tenant is a
 *   no-op (the script reports "already registered" per file and exits 0).
 *   Partial state from a previous half-run is repaired by writing only the
 *   missing pieces.
 *
 * What this script does NOT do:
 *   - It does NOT touch the database. The clients table row, seed data,
 *     and Clerk user provisioning are separate steps documented in
 *     docs/pilot/ONBOARDING-NEW-TENANT.md.
 *   - It does NOT seed Programs / Source / Intelligence / Tower content.
 *     The new tenant starts as `shell_only` until you seed it.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types + constants
// ---------------------------------------------------------------------------

export const VALID_INDUSTRIES = [
  "RETAIL",
  "HEALTHCARE_IDN",
  "FINSERV",
  "DIVERSIFIED",
] as const;
export type IndustryCode = (typeof VALID_INDUSTRIES)[number];

const INDUSTRY_VERTICAL: Record<IndustryCode, string> = {
  RETAIL: "Retail",
  HEALTHCARE_IDN: "Healthcare",
  FINSERV: "Financial Services",
  DIVERSIFIED: "Diversified Holdco",
};

const DEFAULT_NEW_TENANT_COLOR = "#94A3B8"; // slate-400 — neutral until brand color picked.

export interface AddTenantInput {
  key: string;
  name: string;
  shortName?: string;
  industry: IndustryCode;
  adminEmail: string;
  color?: string;
}

export interface RegistryPatchResult {
  registry: string;
  filePath: string;
  changed: boolean;
  reason: string;
}

export interface AddTenantResult {
  key: string;
  industry: IndustryCode;
  adminEmail: string;
  emailDomain: string;
  patches: RegistryPatchResult[];
  nextSteps: string[];
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const KEY_PATTERN = /^[a-z][a-z0-9]*$/;

export function validateInput(raw: Partial<AddTenantInput>): AddTenantInput {
  const key = (raw.key ?? "").trim();
  const name = (raw.name ?? "").trim();
  const industry = (raw.industry ?? "") as IndustryCode;
  const adminEmail = (raw.adminEmail ?? "").trim();

  if (!key) throw new Error("--key is required");
  if (!KEY_PATTERN.test(key)) {
    throw new Error(
      `--key must be lowercase letters/digits, starting with a letter, no dashes (got "${key}"). ` +
        `Canonical convention: "northwind", "helios", "atlas". Add a dashed variant to db-slugs separately.`,
    );
  }

  // Reserve existing canonical keys to avoid collision.
  const RESERVED: ReadonlyArray<string> = [
    "apexretail",
    "meridian",
    "arcturus",
  ];
  if (RESERVED.includes(key)) {
    throw new Error(
      `--key "${key}" is already a reserved canonical key. Use a fresh key for the new tenant.`,
    );
  }

  if (!name) throw new Error("--name is required");
  if (!industry) throw new Error("--industry is required");
  if (!VALID_INDUSTRIES.includes(industry)) {
    throw new Error(
      `--industry must be one of ${VALID_INDUSTRIES.join(" | ")} (got "${industry}")`,
    );
  }

  if (!adminEmail) throw new Error("--admin-email is required");
  // Accept either a full email (cdo@northwind-retail.example.com) or a short
  // local@domain form (cdo@northwind-retail). The latter is auto-completed
  // with `.example.com` to match the canonical demo-account pattern.
  if (!adminEmail.includes("@")) {
    throw new Error(`--admin-email must contain '@' (got "${adminEmail}")`);
  }

  return {
    key,
    name,
    shortName: raw.shortName?.trim() || name,
    industry,
    adminEmail,
    color: raw.color?.trim() || DEFAULT_NEW_TENANT_COLOR,
  };
}

export function normalizeAdminEmail(adminEmail: string): {
  email: string;
  domain: string;
} {
  const trimmed = adminEmail.trim().toLowerCase();
  const [localPart, rawDomain] = trimmed.split("@", 2);
  if (!localPart || !rawDomain) {
    throw new Error(`Invalid admin email: "${adminEmail}"`);
  }
  // Demo-account convention: `*.example.com` domain. Auto-complete if the
  // caller passed only the short form (e.g. `cdo@northwind-retail`).
  const domain = rawDomain.includes(".")
    ? rawDomain
    : `${rawDomain}.example.com`;
  return { email: `${localPart}@${domain}`, domain };
}

// ---------------------------------------------------------------------------
// File path resolution
// ---------------------------------------------------------------------------

interface RegistryPaths {
  clientConfig: string;
  activeClient: string;
  demoTenantDataTiers: string;
  canonicalAuthRoster: string;
}

export function resolveRegistryPaths(repoRoot: string): RegistryPaths {
  const paths: RegistryPaths = {
    clientConfig: path.join(repoRoot, "src/lib/client-config.ts"),
    activeClient: path.join(repoRoot, "src/lib/tenant/aliases.ts"),
    demoTenantDataTiers: path.join(
      repoRoot,
      "src/lib/tenants/demo-tenant-data-tiers.ts",
    ),
    canonicalAuthRoster: path.join(
      repoRoot,
      "src/lib/auth/canonical-auth-roster.ts",
    ),
  };
  for (const [name, p] of Object.entries(paths)) {
    if (!existsSync(p)) {
      throw new Error(`Registry file not found: ${name} → ${p}`);
    }
  }
  return paths;
}

// ---------------------------------------------------------------------------
// Patch helpers — pure string functions for testability
// ---------------------------------------------------------------------------

// ---------- 1. client-config.ts ----------

export function patchClientConfig(
  source: string,
  input: AddTenantInput,
): { content: string; changed: boolean; reason: string } {
  // Idempotency: if `id: '<key>'` already appears in ALL_CLIENTS we treat
  // client-config as already registered.
  const allClientsToken = `id: '${input.key}'`;
  const alreadyAllClients = source.includes(allClientsToken);

  let content = source;
  let anyChange = false;
  const reasons: string[] = [];

  if (!alreadyAllClients) {
    // Insert a new ClientOption block before the closing `] as const;` of
    // ALL_CLIENTS.
    const block =
      `  {\n` +
      `    id: '${input.key}',\n` +
      `    name: '${escapeSingleQuote(input.name)}',\n` +
      `    shortName: '${escapeSingleQuote(input.shortName ?? input.name)}',\n` +
      `    color: '${input.color ?? DEFAULT_NEW_TENANT_COLOR}',\n` +
      `    vertical: '${INDUSTRY_VERTICAL[input.industry]}',\n` +
      `  },\n`;
    const ALL_CLIENTS_CLOSE = "] as const;";
    const ALL_CLIENTS_START = "export const ALL_CLIENTS:";
    const startIdx = source.indexOf(ALL_CLIENTS_START);
    if (startIdx === -1)
      throw new Error("ALL_CLIENTS array not found in client-config.ts");
    const closeIdx = source.indexOf(ALL_CLIENTS_CLOSE, startIdx);
    if (closeIdx === -1) throw new Error("ALL_CLIENTS close marker not found");
    content = content.slice(0, closeIdx) + block + content.slice(closeIdx);
    anyChange = true;
    reasons.push("added ClientOption to ALL_CLIENTS");
  }

  // CLIENT_KEY_TO_DB_NAME entry.
  const dbNameToken = `\n  ${input.key}:`;
  if (
    !content.includes(dbNameToken) ||
    !insertedInBlock(content, "CLIENT_KEY_TO_DB_NAME", dbNameToken)
  ) {
    const dbNamesBlock = `  ${input.key}: ['${escapeSingleQuote(input.name)}'],\n`;
    const r = insertAtEndOfRecord(
      content,
      "CLIENT_KEY_TO_DB_NAME",
      input.key,
      dbNamesBlock,
    );
    content = r.content;
    if (r.changed) {
      anyChange = true;
      reasons.push("added CLIENT_KEY_TO_DB_NAME entry");
    }
  }

  // CLIENT_KEY_TO_INDUSTRY_CODE entry.
  {
    const industryBlock = `  ${input.key}: '${input.industry}',\n`;
    const r = insertAtEndOfRecord(
      content,
      "CLIENT_KEY_TO_INDUSTRY_CODE",
      input.key,
      industryBlock,
    );
    content = r.content;
    if (r.changed) {
      anyChange = true;
      reasons.push("added CLIENT_KEY_TO_INDUSTRY_CODE entry");
    }
  }

  // EMAIL_DOMAIN_TO_CLIENT_KEY entry — derived from admin email domain.
  {
    const { domain } = normalizeAdminEmail(input.adminEmail);
    const domainEntry = `  ['${domain}', '${input.key}'],\n`;
    const r = insertAtEndOfTupleArray(
      content,
      "EMAIL_DOMAIN_TO_CLIENT_KEY",
      domain,
      domainEntry,
    );
    content = r.content;
    if (r.changed) {
      anyChange = true;
      reasons.push(`added EMAIL_DOMAIN_TO_CLIENT_KEY entry for ${domain}`);
    }
  }

  return {
    content,
    changed: anyChange,
    reason: anyChange ? reasons.join(", ") : "already registered",
  };
}

function insertedInBlock(
  source: string,
  blockName: string,
  token: string,
): boolean {
  const startIdx = source.indexOf(blockName);
  if (startIdx === -1) return false;
  const closeIdx = source.indexOf("};", startIdx);
  if (closeIdx === -1) return false;
  return source.slice(startIdx, closeIdx).includes(token);
}

function insertAtEndOfRecord(
  source: string,
  recordName: string,
  key: string,
  block: string,
): { content: string; changed: boolean } {
  const startIdx = source.indexOf(recordName);
  if (startIdx === -1) throw new Error(`Record ${recordName} not found`);
  const closeIdx = source.indexOf("};", startIdx);
  if (closeIdx === -1)
    throw new Error(`Record ${recordName} close marker not found`);
  const section = source.slice(startIdx, closeIdx);
  // Idempotency: a line beginning with `<key>:` already present.
  const keyPattern = new RegExp(`\\n\\s*${escapeRegex(key)}\\s*:`);
  if (keyPattern.test(section)) {
    return { content: source, changed: false };
  }
  const content = source.slice(0, closeIdx) + block + source.slice(closeIdx);
  return { content, changed: true };
}

function insertAtEndOfTupleArray(
  source: string,
  arrayName: string,
  uniqueToken: string,
  block: string,
): { content: string; changed: boolean } {
  const startIdx = source.indexOf(arrayName);
  if (startIdx === -1) throw new Error(`Array ${arrayName} not found`);
  // Tuple arrays in this codebase close with `];` after a leading `[`.
  const openIdx = source.indexOf("[", startIdx);
  if (openIdx === -1)
    throw new Error(`Array ${arrayName} open marker not found`);
  const closeIdx = source.indexOf("];", openIdx);
  if (closeIdx === -1)
    throw new Error(`Array ${arrayName} close marker not found`);
  const section = source.slice(openIdx, closeIdx);
  if (section.includes(`'${uniqueToken}'`)) {
    return { content: source, changed: false };
  }
  const content = source.slice(0, closeIdx) + block + source.slice(closeIdx);
  return { content, changed: true };
}

function escapeSingleQuote(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------- 2. active-client.ts ----------

export function patchActiveClient(
  source: string,
  input: AddTenantInput,
): { content: string; changed: boolean; reason: string } {
  // Tenant alias profiles replaced the old active-client db-slug record.
  // New tenants need the canonical app key plus dashed and natural aliases so
  // URL/query/session/database forms resolve through one tenant boundary.
  const dashed = slugifyFromName(input.name);
  const natural = input.name.toLowerCase().trim().replace(/\s+/g, " ");
  const aliases = Array.from(new Set([input.key, dashed, natural]));
  if (source.includes(`appClientKey: '${input.key}'`)) {
    return { content: source, changed: false, reason: "already registered" };
  }
  const arrayName = "TENANT_ALIAS_PROFILES";
  const startIdx = source.indexOf(arrayName);
  if (startIdx === -1) throw new Error(`${arrayName} not found`);
  const closeIdx = source.indexOf("] as const;", startIdx);
  if (closeIdx === -1) throw new Error(`${arrayName} close marker not found`);
  const block =
    `  {\n` +
    `    appClientKey: '${input.key}',\n` +
    `    canonicalKey: '${dashed}',\n` +
    `    brokerKey: '${dashed}',\n` +
    `    displayName: '${escapeSingleQuote(input.name)}',\n` +
    `    industryCode: CLIENT_KEY_TO_INDUSTRY_CODE.${input.key},\n` +
    `    aliases: [${aliases.map((s) => `'${escapeSingleQuote(s)}'`).join(", ")}],\n` +
    `  },\n`;
  const content = source.slice(0, closeIdx) + block + source.slice(closeIdx);
  return {
    content,
    changed: true,
    reason: `added TENANT_ALIAS_PROFILES entry (aliases: ${aliases.join(", ")})`,
  };
}

function slugifyFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------- 3. demo-tenant-data-tiers.ts ----------

export function patchDemoTenantDataTiers(
  source: string,
  input: AddTenantInput,
): { content: string; changed: boolean; reason: string } {
  const idempotencyToken = `tenantSlug: '${input.key}'`;
  if (source.includes(idempotencyToken)) {
    return { content: source, changed: false, reason: "already registered" };
  }

  // New tenants begin life as `shell_only` — no Programs / Source / Intelligence
  // / Tower data is seeded yet. The honest empty state ships with the tenant.
  const block =
    `  {\n` +
    `    tenantSlug: '${input.key}',\n` +
    `    tenantName: '${escapeSingleQuote(input.name)}',\n` +
    `    richness: 'shell_only',\n` +
    `    surfaces: [\n` +
    `      {\n` +
    `        surface: 'programs',\n` +
    `        availability: 'unavailable',\n` +
    `        caveat: '${escapeSingleQuote(input.name)} is a shell-only tenant. No program, source, or intelligence data seeded.',\n` +
    `        routeHint: null,\n` +
    `      },\n` +
    `      {\n` +
    `        surface: 'source',\n` +
    `        availability: 'unavailable',\n` +
    `        caveat: '${escapeSingleQuote(input.name)} is a shell-only tenant. No program, source, or intelligence data seeded.',\n` +
    `        routeHint: null,\n` +
    `      },\n` +
    `      {\n` +
    `        surface: 'intelligence',\n` +
    `        availability: 'unavailable',\n` +
    `        caveat: '${escapeSingleQuote(input.name)} is a shell-only tenant. No program, source, or intelligence data seeded.',\n` +
    `        routeHint: null,\n` +
    `      },\n` +
    `      {\n` +
    `        surface: 'control_tower',\n` +
    `        availability: 'unavailable',\n` +
    `        caveat: '${escapeSingleQuote(input.name)} is a shell-only tenant. No program, source, or intelligence data seeded.',\n` +
    `        routeHint: null,\n` +
    `      },\n` +
    `      {\n` +
    `        surface: 'admin',\n` +
    `        availability: 'unavailable',\n` +
    `        caveat: '${escapeSingleQuote(input.name)} is a shell-only tenant. No program, source, or intelligence data seeded.',\n` +
    `        routeHint: null,\n` +
    `      },\n` +
    `    ],\n` +
    `    sourceProgramLinkage: false,\n` +
    `    deterministicSeed: true,\n` +
    `    dataNote: '${escapeSingleQuote(input.name)} is a new pilot tenant. Shell-only until Programs / Source / Intelligence / Tower data is seeded.',\n` +
    `  },\n`;

  // Insert before the closing `];` of DEMO_TENANT_DATA_TIERS.
  const arrayName = "DEMO_TENANT_DATA_TIERS";
  const startIdx = source.indexOf(arrayName);
  if (startIdx === -1) throw new Error("DEMO_TENANT_DATA_TIERS not found");
  const closeIdx = source.indexOf("];", startIdx);
  if (closeIdx === -1)
    throw new Error("DEMO_TENANT_DATA_TIERS close marker not found");
  const content = source.slice(0, closeIdx) + block + source.slice(closeIdx);
  return {
    content,
    changed: true,
    reason: "added DEMO_TENANT_DATA_TIERS entry (shell_only)",
  };
}

// ---------- 4. canonical-auth-roster.ts ----------

export function patchCanonicalAuthRoster(
  source: string,
  input: AddTenantInput,
): { content: string; changed: boolean; reason: string } {
  const { email } = normalizeAdminEmail(input.adminEmail);
  const idempotencyToken = `'${email}'`;
  if (source.includes(idempotencyToken)) {
    return { content: source, changed: false, reason: "already registered" };
  }

  let content = source;
  const reasons: string[] = [];

  // CANONICAL_AUTH_EMAILS — add to the tuple. Insert before `] as const;`.
  {
    const r = insertAtEndOfTupleConstArray(
      content,
      "CANONICAL_AUTH_EMAILS",
      email,
      `  '${email}', // admin · ${escapeSingleQuote(input.name)}\n`,
    );
    content = r.content;
    if (r.changed) reasons.push("added CANONICAL_AUTH_EMAILS entry");
  }

  // CANONICAL_CLIENT_ADMIN_EMAILS — same shape.
  {
    const r = insertAtEndOfTupleConstArray(
      content,
      "CANONICAL_CLIENT_ADMIN_EMAILS",
      email,
      `  '${email}',\n`,
    );
    content = r.content;
    if (r.changed) reasons.push("added CANONICAL_CLIENT_ADMIN_EMAILS entry");
  }

  return {
    content,
    changed: reasons.length > 0,
    reason: reasons.length > 0 ? reasons.join(", ") : "already registered",
  };
}

function insertAtEndOfTupleConstArray(
  source: string,
  arrayName: string,
  uniqueToken: string,
  block: string,
): { content: string; changed: boolean } {
  const startIdx = source.indexOf(arrayName);
  if (startIdx === -1) throw new Error(`Array ${arrayName} not found`);
  const closeIdx = source.indexOf("] as const;", startIdx);
  if (closeIdx === -1)
    throw new Error(`Array ${arrayName} close marker not found`);
  const section = source.slice(startIdx, closeIdx);
  if (section.includes(`'${uniqueToken}'`)) {
    return { content: source, changed: false };
  }
  const content = source.slice(0, closeIdx) + block + source.slice(closeIdx);
  return { content, changed: true };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export interface ExecuteOptions {
  repoRoot: string;
  dryRun?: boolean;
}

export function executeAddTenant(
  input: AddTenantInput,
  opts: ExecuteOptions,
): AddTenantResult {
  const paths = resolveRegistryPaths(opts.repoRoot);
  const patches: RegistryPatchResult[] = [];

  // 1 — client-config
  {
    const original = readFileSync(paths.clientConfig, "utf8");
    const result = patchClientConfig(original, input);
    if (result.changed && !opts.dryRun) {
      writeFileSync(paths.clientConfig, result.content, "utf8");
    }
    patches.push({
      registry: "client-config",
      filePath: paths.clientConfig,
      changed: result.changed,
      reason: result.reason,
    });
  }

  // 2 — active-client
  {
    const original = readFileSync(paths.activeClient, "utf8");
    const result = patchActiveClient(original, input);
    if (result.changed && !opts.dryRun) {
      writeFileSync(paths.activeClient, result.content, "utf8");
    }
    patches.push({
      registry: "active-client",
      filePath: paths.activeClient,
      changed: result.changed,
      reason: result.reason,
    });
  }

  // 3 — demo-tenant-data-tiers
  {
    const original = readFileSync(paths.demoTenantDataTiers, "utf8");
    const result = patchDemoTenantDataTiers(original, input);
    if (result.changed && !opts.dryRun) {
      writeFileSync(paths.demoTenantDataTiers, result.content, "utf8");
    }
    patches.push({
      registry: "demo-tenant-data-tiers",
      filePath: paths.demoTenantDataTiers,
      changed: result.changed,
      reason: result.reason,
    });
  }

  // 4 — canonical-auth-roster
  {
    const original = readFileSync(paths.canonicalAuthRoster, "utf8");
    const result = patchCanonicalAuthRoster(original, input);
    if (result.changed && !opts.dryRun) {
      writeFileSync(paths.canonicalAuthRoster, result.content, "utf8");
    }
    patches.push({
      registry: "canonical-auth-roster",
      filePath: paths.canonicalAuthRoster,
      changed: result.changed,
      reason: result.reason,
    });
  }

  const { email, domain } = normalizeAdminEmail(input.adminEmail);

  return {
    key: input.key,
    industry: input.industry,
    adminEmail: email,
    emailDomain: domain,
    patches,
    nextSteps: [
      `Insert a row in the 'clients' table with tenant_key='${input.key}' (industry_code='${input.industry}'). See docs/pilot/ONBOARDING-NEW-TENANT.md.`,
      `Provision a Clerk user for ${email} (publicMetadata.clientId='${input.key}', role='client').`,
      `Seed Programs / Source / Intelligence / Tower data when ready. The tenant currently renders 'shell_only' empty states.`,
      `Promote the tenant from 'shell_only' to 'thin' or 'rich' in src/lib/tenants/demo-tenant-data-tiers.ts once data lands.`,
      `Run \`npx tsc --noEmit\` and \`npm run test:behaviors\` before committing.`,
    ],
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

export function parseArgv(
  argv: string[],
): Partial<AddTenantInput> & { dryRun?: boolean } {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") {
      out.dryRun = true;
      continue;
    }
    if (a?.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        out[camelCase(key)] = next;
        i++;
      } else {
        out[camelCase(key)] = true;
      }
    }
  }
  return out as Partial<AddTenantInput> & { dryRun?: boolean };
}

function camelCase(s: string): string {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function renderSummary(result: AddTenantResult): string {
  const lines: string[] = [];
  lines.push("");
  lines.push("═════════════════════════════════════════════════════════════");
  lines.push(`Tenant onboarding summary · key="${result.key}"`);
  lines.push("═════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push("Registries:");
  for (const p of result.patches) {
    const status = p.changed ? "  + WROTE" : "  · skipped";
    lines.push(`${status}  ${p.registry}  (${p.reason})`);
    lines.push(`            ${p.filePath}`);
  }
  lines.push("");
  lines.push("Identity:");
  lines.push(`  industry      ${result.industry}`);
  lines.push(`  admin email   ${result.adminEmail}`);
  lines.push(`  email domain  ${result.emailDomain}`);
  lines.push("");
  lines.push("Next manual steps:");
  result.nextSteps.forEach((s, i) => lines.push(`  ${i + 1}. ${s}`));
  lines.push("");
  return lines.join("\n");
}

// Entry-point guard — only run when invoked as a script (not when imported
// from tests).
async function main(): Promise<void> {
  const raw = parseArgv(process.argv.slice(2));
  const dryRun = !!raw.dryRun;
  delete (raw as { dryRun?: boolean }).dryRun;
  const input = validateInput(raw);

  // Resolve repo root by walking up from this file's location.
  const repoRoot = resolveRepoRoot(__dirname);

  const result = executeAddTenant(input, { repoRoot, dryRun });
  process.stdout.write(renderSummary(result));
  if (dryRun) {
    process.stdout.write("\n(--dry-run: no files written)\n");
  }
}

function resolveRepoRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 8; i++) {
    if (existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`Could not resolve repo root from ${startDir}`);
}

// Only run main() when this file is the entry script.
if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(
      `add-tenant: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(1);
  });
}
