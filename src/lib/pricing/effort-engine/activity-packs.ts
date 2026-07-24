/**
 * Nexus Pricing Engine — PR4 activity-pack resolution for one archetype.
 *
 * Pure functions over an already-loaded `EffortEnginePack`. Resolves, for a
 * given archetype: which activity packs apply (via
 * `pricing_archetype_activity_map`), each pack's effort rules (parsed to the
 * typed `EffortOperation` union via `rule-interpreter.ts`), and each pack's
 * role mix.
 */
import { parseEffortOperation } from "./rule-interpreter";
import type {
  EffortEnginePack,
  EffortOperation,
  LineClassification,
  PricingActivityPackRow,
} from "./types";

export interface ResolvedActivityPackRule {
  ruleCode: string;
  operation: EffortOperation;
  classification: LineClassification;
  sequence: number;
}

export interface ResolvedActivityPackRoleMixEntry {
  roleCode: string;
  allocationPct: number;
  levelHint: string | null;
}

export interface ResolvedActivityPack {
  pack: PricingActivityPackRow;
  applicability: "required" | "conditional";
  notes: string | null;
  rules: ResolvedActivityPackRule[];
  roleMix: ResolvedActivityPackRoleMixEntry[];
}

export interface IncludeConditionalOptions {
  /** activity_pack_codes whose 'conditional' mapping the caller opts INTO for this Move. Default: none included. */
  includeConditionalPackCodes?: readonly string[];
}

/**
 * Resolve every activity pack mapped to `archetypeCode` at `applicability
 * IN ('required', 'conditional')`, excluding `excluded` rows entirely and
 * excluding `conditional` rows the caller did not opt into. Returned in a
 * stable order: technical packs first (by activity_pack_code), then shared
 * packs (by activity_pack_code) — deterministic regardless of the loaded
 * pack's own row order.
 */
export function resolveActivityPacksForArchetype(
  pack: EffortEnginePack,
  archetypeCode: string,
  options: IncludeConditionalOptions = {},
): ResolvedActivityPack[] {
  const includeConditional = new Set(options.includeConditionalPackCodes ?? []);
  const mapRows = pack.archetypeActivityMap.filter((m) => m.archetype_code === archetypeCode);
  const packsByCode = new Map(pack.activityPacks.map((p) => [p.activity_pack_code, p]));
  const rulesByPack = new Map<string, ResolvedActivityPackRule[]>();
  for (const rule of pack.effortRules) {
    const parsed: ResolvedActivityPackRule = {
      ruleCode: rule.rule_code,
      operation: parseEffortOperation({
        operation: rule.operation,
        driver_code: rule.driver_code,
        parameters: rule.parameters,
        rule_code: rule.rule_code,
      }),
      classification: rule.classification,
      sequence: rule.sequence,
    };
    const list = rulesByPack.get(rule.activity_pack_code) ?? [];
    list.push(parsed);
    rulesByPack.set(rule.activity_pack_code, list);
  }
  const roleMixByPack = new Map<string, ResolvedActivityPackRoleMixEntry[]>();
  for (const rm of pack.roleMix) {
    const list = roleMixByPack.get(rm.activity_pack_code) ?? [];
    list.push({ roleCode: rm.role_code, allocationPct: rm.allocation_pct, levelHint: rm.level_hint });
    roleMixByPack.set(rm.activity_pack_code, list);
  }

  const resolved: ResolvedActivityPack[] = [];
  for (const mapRow of mapRows) {
    if (mapRow.applicability === "excluded") continue;
    if (mapRow.applicability === "conditional" && !includeConditional.has(mapRow.activity_pack_code)) continue;
    const activityPack = packsByCode.get(mapRow.activity_pack_code);
    if (!activityPack) continue;
    resolved.push({
      pack: activityPack,
      applicability: mapRow.applicability === "conditional" ? "conditional" : "required",
      notes: mapRow.notes,
      rules: (rulesByPack.get(mapRow.activity_pack_code) ?? []).slice().sort((a, b) => a.sequence - b.sequence),
      roleMix: roleMixByPack.get(mapRow.activity_pack_code) ?? [],
    });
  }

  return resolved.sort((a, b) => {
    if (a.pack.category !== b.pack.category) return a.pack.category === "technical" ? -1 : 1;
    return a.pack.activity_pack_code < b.pack.activity_pack_code ? -1 : 1;
  });
}

/** The subset of resolved packs whose category is 'technical' — the default "selected labor" scope for percentage_of_selected_labor. */
export function technicalPackCodes(resolvedPacks: readonly ResolvedActivityPack[]): string[] {
  return resolvedPacks.filter((p) => p.pack.category === "technical").map((p) => p.pack.activity_pack_code);
}
