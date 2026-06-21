import { createHash } from "node:crypto";

import type { ExpertPack } from "./expert-pack";
import { EXPERT_PACK_DEPTH_MINIMUMS } from "./expert-pack";
import type { GateResult } from "./quality-gate";
import { gateExpertPack } from "./quality-gate";

export type ExpertPackDepthKey = keyof typeof EXPERT_PACK_DEPTH_MINIMUMS;

export type ExpertPackDepthCounts = Record<ExpertPackDepthKey, number>;

export interface ExpertPackValidationResult {
  packId: string;
  expertName: string;
  pass: boolean;
  depthCounts: ExpertPackDepthCounts;
  gateResult: GateResult;
}

export interface ExpertPackStoreRow {
  pack_id: string;
  pack_version: ExpertPack["packVersion"];
  expert_name: string;
  kind: ExpertPack["identity"]["kind"];
  industry: string | null;
  function_key: string | null;
  cross_cutting_domain: string | null;
  scope_note: string;
  pack: ExpertPack;
  depth_counts: ExpertPackDepthCounts;
  gate_result: GateResult;
  gate_pass: boolean;
  blocker_count: number;
  concern_count: number;
  pack_hash: string;
  authored_by: string | null;
  review_tier: string | null;
  provenance_confidence: string | null;
  as_of: string | null;
}

export interface ExpertPackValidationIssue {
  packId: string;
  expertName: string;
  message: string;
}

export interface ExpertPackCollectionValidation {
  rows: ExpertPackStoreRow[];
  invalid: ExpertPackValidationIssue[];
}

function count(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

export function getExpertPackDepthCounts(
  pack: ExpertPack,
): ExpertPackDepthCounts {
  return {
    operatingMetrics: count(pack.domain?.operatingMetrics),
    painThemes: count(pack.domain?.painThemes),
    aiUseCaseArchetypes: count(pack.domain?.aiUseCaseArchetypes),
    referenceSolutionPatterns: count(pack.domain?.referenceSolutionPatterns),
    evidenceAnchors: count(pack.domain?.evidenceAnchors),
    discoveryQuestions: count(pack.diagnostics?.discoveryQuestions),
    redFlags: count(pack.diagnostics?.redFlags),
    outputRecipes: count(pack.outputRecipes),
  };
}

export function validateExpertPackForStore(
  pack: ExpertPack,
): ExpertPackValidationResult {
  const gateResult = gateExpertPack(pack);
  return {
    packId: pack.identity?.id ?? "(missing id)",
    expertName: pack.identity?.expertName ?? "(missing expertName)",
    pass: gateResult.pass,
    depthCounts: getExpertPackDepthCounts(pack),
    gateResult,
  };
}

export function hashExpertPack(pack: ExpertPack): string {
  return createHash("sha256").update(JSON.stringify(pack)).digest("hex");
}

export function toExpertPackStoreRow(pack: ExpertPack): ExpertPackStoreRow {
  const validation = validateExpertPackForStore(pack);
  const { identity, provenance } = pack;

  return {
    pack_id: identity.id,
    pack_version: pack.packVersion,
    expert_name: identity.expertName,
    kind: identity.kind,
    industry: identity.industry ?? null,
    function_key: identity.functionKey ?? null,
    cross_cutting_domain: identity.crossCuttingDomain ?? null,
    scope_note: identity.scopeNote,
    pack,
    depth_counts: validation.depthCounts,
    gate_result: validation.gateResult,
    gate_pass: validation.gateResult.pass,
    blocker_count: validation.gateResult.blockerCount,
    concern_count: validation.gateResult.concernCount,
    pack_hash: hashExpertPack(pack),
    authored_by: provenance?.authoredBy ?? null,
    review_tier: provenance?.reviewTier ?? null,
    provenance_confidence: provenance?.confidence ?? null,
    as_of: provenance?.asOf ?? null,
  };
}

export function validateExpertPackCollection(
  packs: readonly ExpertPack[],
): ExpertPackCollectionValidation {
  const seenIds = new Map<string, string>();
  const rows: ExpertPackStoreRow[] = [];
  const invalid: ExpertPackValidationIssue[] = [];

  for (const pack of packs) {
    const row = toExpertPackStoreRow(pack);
    const previousName = seenIds.get(row.pack_id);
    if (previousName) {
      invalid.push({
        packId: row.pack_id,
        expertName: row.expert_name,
        message: `duplicate pack id also used by "${previousName}"`,
      });
      continue;
    }
    seenIds.set(row.pack_id, row.expert_name);

    if (!row.gate_pass) {
      invalid.push({
        packId: row.pack_id,
        expertName: row.expert_name,
        message: `${row.blocker_count} blocker(s), ${row.concern_count} concern(s)`,
      });
      continue;
    }

    rows.push(row);
  }

  return { rows, invalid };
}

export const EXPERT_PACK_UPSERT_SQL = `
insert into public.expert_packs (
  pack_id,
  pack_version,
  expert_name,
  kind,
  industry,
  function_key,
  cross_cutting_domain,
  scope_note,
  pack,
  depth_counts,
  gate_result,
  gate_pass,
  blocker_count,
  concern_count,
  pack_hash,
  authored_by,
  review_tier,
  provenance_confidence,
  as_of,
  updated_at
) values (
  $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12,
  $13, $14, $15, $16, $17, $18, $19::date, now()
)
on conflict (pack_id) do update set
  pack_version = excluded.pack_version,
  expert_name = excluded.expert_name,
  kind = excluded.kind,
  industry = excluded.industry,
  function_key = excluded.function_key,
  cross_cutting_domain = excluded.cross_cutting_domain,
  scope_note = excluded.scope_note,
  pack = excluded.pack,
  depth_counts = excluded.depth_counts,
  gate_result = excluded.gate_result,
  gate_pass = excluded.gate_pass,
  blocker_count = excluded.blocker_count,
  concern_count = excluded.concern_count,
  pack_hash = excluded.pack_hash,
  authored_by = excluded.authored_by,
  review_tier = excluded.review_tier,
  provenance_confidence = excluded.provenance_confidence,
  as_of = excluded.as_of,
  updated_at = now()
`;

export function expertPackRowParams(row: ExpertPackStoreRow): unknown[] {
  return [
    row.pack_id,
    row.pack_version,
    row.expert_name,
    row.kind,
    row.industry,
    row.function_key,
    row.cross_cutting_domain,
    row.scope_note,
    JSON.stringify(row.pack),
    JSON.stringify(row.depth_counts),
    JSON.stringify(row.gate_result),
    row.gate_pass,
    row.blocker_count,
    row.concern_count,
    row.pack_hash,
    row.authored_by,
    row.review_tier,
    row.provenance_confidence,
    row.as_of,
  ];
}
