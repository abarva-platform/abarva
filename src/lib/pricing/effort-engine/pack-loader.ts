/**
 * Nexus Pricing Engine — PR4 effort-engine pack loader.
 *
 * The PR4 analogue of PR2's `reference-pack-loader.ts`: takes the 8
 * hand-authored CSVs `scripts/pricing/generate-pr4-effort-pack.ts` produced
 * under `datasets/reference/pricing-engine-v1/` and idempotently loads them
 * into the tables `supabase/migrations/20260723235500_pricing_effort_engine_v1.sql`
 * created, versioned against `pricing_model_versions` (an INDEPENDENT
 * version axis from PR1/PR2's `pricing_taxonomy_versions` — see that
 * migration's header comment). Same parse -> content-hash -> diff ->
 * no-op-or-new-version-insert shape, reusing `versioning.ts`'s
 * `computeContentHash`/`decideVersionAction` unchanged.
 *
 * Like PR2's loader, this is a directly-callable service + test harness
 * ONLY — no API route or admin UI wires it in this PR (that is PR5+ scope).
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import Papa from "papaparse";
import { azureRead } from "@/lib/data-plane/azureRead";
import { createTxSession, type TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";
import { computeContentHash, decideVersionAction, type VersionDecision } from "../versioning";

type RawRow = Record<string, string>;

function readCsvFile(filePath: string): RawRow[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = Papa.parse<RawRow>(raw, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    throw new Error(
      `${filePath}: CSV parse error(s): ${parsed.errors.map((e) => `${e.message} (row ${e.row})`).join("; ")}`,
    );
  }
  return parsed.data;
}

export interface EffortPackData {
  archetypes: RawRow[];
  activityPacks: RawRow[];
  effortDrivers: RawRow[];
  effortRules: RawRow[];
  roleMix: RawRow[];
  archetypeActivityMap: RawRow[];
  rangePolicies: RawRow[];
  agentCosts: RawRow[];
}

const CSV_FILES = {
  archetypes: "pricing_archetypes.csv",
  activityPacks: "pricing_activity_packs.csv",
  effortDrivers: "pricing_effort_drivers.csv",
  effortRules: "pricing_effort_rules.csv",
  roleMix: "pricing_activity_role_mix.csv",
  archetypeActivityMap: "pricing_archetype_activity_map.csv",
  rangePolicies: "pricing_range_policies.csv",
  agentCosts: "pricing_agent_costs.csv",
} as const;

export function readEffortPackDir(dir: string): EffortPackData {
  return {
    archetypes: readCsvFile(path.join(dir, CSV_FILES.archetypes)),
    activityPacks: readCsvFile(path.join(dir, CSV_FILES.activityPacks)),
    effortDrivers: readCsvFile(path.join(dir, CSV_FILES.effortDrivers)),
    effortRules: readCsvFile(path.join(dir, CSV_FILES.effortRules)),
    roleMix: readCsvFile(path.join(dir, CSV_FILES.roleMix)),
    archetypeActivityMap: readCsvFile(path.join(dir, CSV_FILES.archetypeActivityMap)),
    rangePolicies: readCsvFile(path.join(dir, CSV_FILES.rangePolicies)),
    agentCosts: readCsvFile(path.join(dir, CSV_FILES.agentCosts)),
  };
}

export function rowCountsByTable(data: EffortPackData): Record<string, number> {
  return {
    [CSV_FILES.archetypes]: data.archetypes.length,
    [CSV_FILES.activityPacks]: data.activityPacks.length,
    [CSV_FILES.effortDrivers]: data.effortDrivers.length,
    [CSV_FILES.effortRules]: data.effortRules.length,
    [CSV_FILES.roleMix]: data.roleMix.length,
    [CSV_FILES.archetypeActivityMap]: data.archetypeActivityMap.length,
    [CSV_FILES.rangePolicies]: data.rangePolicies.length,
    [CSV_FILES.agentCosts]: data.agentCosts.length,
  };
}

function toNum(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}
function toInt(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

/** sha256 of the whole normalized row set (every table, rows sorted by their natural code column). */
export function computePackContentHash(data: EffortPackData): string {
  const sortBy = (rows: RawRow[], key: string) => [...rows].sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0));
  return computeContentHash({
    archetypes: sortBy(data.archetypes, "archetype_code"),
    activityPacks: sortBy(data.activityPacks, "activity_pack_code"),
    effortDrivers: sortBy(data.effortDrivers, "driver_code"),
    effortRules: sortBy(data.effortRules, "rule_code"),
    roleMix: [...data.roleMix].sort((a, b) =>
      `${a.activity_pack_code}::${a.role_code}` < `${b.activity_pack_code}::${b.role_code}` ? -1 : 1,
    ),
    archetypeActivityMap: [...data.archetypeActivityMap].sort((a, b) =>
      `${a.archetype_code}::${a.activity_pack_code}` < `${b.archetype_code}::${b.activity_pack_code}` ? -1 : 1,
    ),
    rangePolicies: sortBy(data.rangePolicies, "policy_code"),
    agentCosts: sortBy(data.agentCosts, "agent_cost_code"),
  });
}

/** Build the physical per-table row payloads (tagged with `model_version` + per-row `content_hash`) ready for INSERT. */
export function buildTaggedTableRows(data: EffortPackData, modelVersion: number): Record<string, Record<string, unknown>[]> {
  const tag = <T extends Record<string, unknown>>(row: T) => ({ ...row, model_version: modelVersion, content_hash: computeContentHash(row) });

  return {
    pricing_archetypes: data.archetypes.map((r) =>
      tag({
        archetype_code: r.archetype_code,
        archetype_name: r.archetype_name,
        description: r.description || null,
        source_artifact: r.source_artifact || null,
        status: r.status || "active",
      }),
    ),
    pricing_activity_packs: data.activityPacks.map((r) =>
      tag({
        activity_pack_code: r.activity_pack_code,
        activity_pack_name: r.activity_pack_name,
        category: r.category,
        tower_code: r.tower_code || null,
        capability_code: r.capability_code || null,
        description: r.description || null,
        source_artifact: r.source_artifact || null,
        status: r.status || "active",
      }),
    ),
    pricing_effort_drivers: data.effortDrivers.map((r) =>
      tag({
        driver_code: r.driver_code,
        driver_name: r.driver_name,
        unit_label: r.unit_label,
        description: r.description || null,
        source_artifact: r.source_artifact || null,
        status: r.status || "active",
      }),
    ),
    pricing_effort_rules: data.effortRules.map((r) =>
      tag({
        activity_pack_code: r.activity_pack_code,
        rule_code: r.rule_code,
        operation: r.operation,
        driver_code: r.driver_code || null,
        parameters: JSON.parse(r.parameters),
        classification: r.classification || "initiative_specific",
        sequence: toInt(r.sequence) ?? 1,
        source_artifact: r.source_artifact || null,
        status: r.status || "active",
      }),
    ),
    pricing_activity_role_mix: data.roleMix.map((r) =>
      tag({
        activity_pack_code: r.activity_pack_code,
        role_code: r.role_code,
        allocation_pct: toNum(r.allocation_pct),
        level_hint: r.level_hint || null,
        source_artifact: r.source_artifact || null,
        status: r.status || "active",
      }),
    ),
    pricing_archetype_activity_map: data.archetypeActivityMap.map((r) =>
      tag({
        archetype_code: r.archetype_code,
        activity_pack_code: r.activity_pack_code,
        applicability: r.applicability || "required",
        notes: r.notes || null,
        source_artifact: r.source_artifact || null,
        status: r.status || "active",
      }),
    ),
    pricing_range_policies: data.rangePolicies.map((r) =>
      tag({
        policy_code: r.policy_code,
        policy_name: r.policy_name,
        min_score: toInt(r.min_score),
        max_score: toInt(r.max_score),
        low_multiplier: toNum(r.low_multiplier),
        high_multiplier: toNum(r.high_multiplier),
        description: r.description || null,
        source_artifact: r.source_artifact || null,
        status: r.status || "active",
      }),
    ),
    pricing_agent_costs: data.agentCosts.map((r) =>
      tag({
        agent_cost_code: r.agent_cost_code,
        cost_key: r.cost_key,
        applies_to_archetype_code: r.applies_to_archetype_code || null,
        cost_value: toNum(r.cost_value),
        unit: r.unit,
        description: r.description || null,
        source_artifact: r.source_artifact || null,
        status: r.status || "active",
      }),
    ),
  };
}

export interface EffortEnginePackStorePort {
  getCurrentVersion(): Promise<{ version: number; contentHash: string } | null>;
  insertNewVersion(input: { version: number; contentHash: string; tables: Record<string, Record<string, unknown>[]> }): Promise<void>;
}

const TABLE_INSERT_ORDER = [
  "pricing_archetypes",
  "pricing_activity_packs",
  "pricing_effort_drivers",
  "pricing_effort_rules",
  "pricing_activity_role_mix",
  "pricing_archetype_activity_map",
  "pricing_range_policies",
  "pricing_agent_costs",
] as const;

function defaultEffortEnginePackStore(session: TxSessionRunner = createTxSession("abarva-pricing-write")): EffortEnginePackStorePort {
  return {
    async getCurrentVersion() {
      const row = await azureRead.maybeSingle<{ version: number; content_hash: string }>({
        table: "pricing_model_versions",
        where: { is_current: true },
        missingTable: "empty",
      });
      return row ? { version: row.version, contentHash: row.content_hash } : null;
    },
    async insertNewVersion(input) {
      await session(async (run) => {
        await run(`UPDATE pricing_model_versions SET is_current = false WHERE is_current = true`, []);
        await run(
          `INSERT INTO pricing_model_versions (id, version, description, status, is_current, content_hash)
           VALUES ($1, $2, $3, 'active', true, $4)`,
          [randomUUID(), input.version, "Nexus Pricing Engine PR4 effort/cost model", input.contentHash],
        );
        for (const table of TABLE_INSERT_ORDER) {
          const rows = input.tables[table] ?? [];
          for (const row of rows) {
            const columns = Object.keys(row);
            const placeholders = columns.map((_, i) => `$${i + 2}`);
            await run(
              `INSERT INTO ${table} (id, ${columns.join(", ")}) VALUES ($1, ${placeholders.join(", ")})`,
              [randomUUID(), ...columns.map((c) => (typeof row[c] === "object" && row[c] !== null ? JSON.stringify(row[c]) : row[c]))],
            );
          }
        }
      });
    },
  };
}

export type EffortPackLoadResult =
  | { action: "noop"; modelVersion: number; rowCounts: Record<string, number> }
  | { action: "new_version"; modelVersion: number; previousVersion: number | null; rowCounts: Record<string, number> };

export interface LoadEffortEnginePackOptions {
  store?: EffortEnginePackStorePort;
}

/** Load the PR4 effort-engine reference pack at `dir` into the `pricing_*` tables, idempotently. */
export async function loadEffortEnginePack(dir: string, options: LoadEffortEnginePackOptions = {}): Promise<EffortPackLoadResult> {
  const store = options.store ?? defaultEffortEnginePackStore();
  const data = readEffortPackDir(dir);

  const contentHash = computePackContentHash(data);
  const current = await store.getCurrentVersion();
  const decision: VersionDecision = decideVersionAction(contentHash, current);
  const rowCounts = rowCountsByTable(data);

  if (decision.action === "noop") {
    return { action: "noop", modelVersion: decision.version, rowCounts };
  }

  const tables = buildTaggedTableRows(data, decision.version);
  await store.insertNewVersion({ version: decision.version, contentHash, tables });

  return { action: "new_version", modelVersion: decision.version, previousVersion: decision.previousVersion, rowCounts };
}

/** Default location of the PR4 effort-engine pack CSVs — same directory as PR1's taxonomy pack. */
export function defaultEffortEnginePackDir(): string {
  return path.resolve(__dirname, "..", "..", "..", "..", "datasets", "reference", "pricing-engine-v1");
}
