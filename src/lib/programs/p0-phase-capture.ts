import "server-only";

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  evaluatePhaseCapture,
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";
import type { TenancyCtx } from "@/lib/programs/types.db";

export interface P0PhaseCaptureSource {
  name?: string | null;
  problemStatement?: string | null;
  targetOutcome?: string | null;
  timelineHorizon?: string | null;
  charter?: Record<string, unknown> | null;
}

export interface P0PhaseCapturePersistResult {
  complete: boolean;
  missing: string[];
  values: Record<string, string>;
  persisted: boolean;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readCharterString(
  charter: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = clean(charter?.[key]);
    if (value) return value;
  }
  return "";
}

function readScaffoldString(
  charter: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string {
  const scaffold = charter?.scaffold;
  if (!scaffold || typeof scaffold !== "object") return "";
  const record = scaffold as Record<string, unknown>;
  for (const key of keys) {
    const value = clean(record[key]);
    if (value) return value;
  }
  return "";
}

export function buildP0PhaseCaptureValues(
  source: P0PhaseCaptureSource,
): Record<string, string> {
  const charter = source.charter ?? null;
  const problem =
    clean(source.problemStatement) ||
    readScaffoldString(charter, "problem_statement", "problemStatement") ||
    readCharterString(charter, "problem_statement", "problemStatement");
  const scope =
    readScaffoldString(charter, "scope_boundary", "scopeBoundary") ||
    readCharterString(charter, "scope_boundary", "scopeBoundary", "initial_scope");
  const valueHypothesis =
    clean(source.targetOutcome) ||
    readScaffoldString(charter, "value_hypothesis", "valueHypothesis") ||
    readCharterString(
      charter,
      "value_hypothesis",
      "valueHypothesis",
      "target_outcome",
      "targetOutcome",
    );
  const sponsor =
    readScaffoldString(charter, "sponsor_candidate", "sponsorCandidate") ||
    readCharterString(charter, "sponsor_candidate", "sponsorCandidate", "sponsor");
  const evidence =
    readScaffoldString(charter, "evidence_family", "evidenceFamily") ||
    readCharterString(charter, "evidence_family", "evidenceFamily", "known_evidence");
  const foundation =
    clean(source.timelineHorizon) ||
    readScaffoldString(charter, "foundation_readiness", "foundationReadiness") ||
    readCharterString(charter, "foundation_readiness", "foundationReadiness", "timeline");
  const archetype =
    readScaffoldString(charter, "archetype", "classification") ||
    readCharterString(charter, "archetype", "classification", "resolved_program_archetype");
  const moveName = clean(source.name);
  const enoughForRecommendation =
    problem && scope && valueHypothesis && sponsor && evidence && foundation;

  return {
    business_trigger: problem,
    problem_statement: problem,
    affected_function_process: scope || archetype || moveName,
    initial_value_hypothesis: valueHypothesis,
    stakeholder_owner_view: sponsor,
    known_evidence: [evidence, foundation].filter(Boolean).join("\n\n"),
    missing_evidence_open_questions: foundation
      ? `P1/P2 must validate foundation readiness: ${foundation}`
      : "",
    recommendation_to_advance: enoughForRecommendation
      ? "Advance to P1 Charter. P1 should confirm decision rights, lock success criteria, and convert the P0 brief into a governed charter and evidence plan."
      : "",
  };
}

export async function persistP0PhaseCaptureFromSource(
  ctx: TenancyCtx,
  programId: string,
  source: P0PhaseCaptureSource,
): Promise<P0PhaseCapturePersistResult> {
  const values = buildP0PhaseCaptureValues(source);
  const evaluation = evaluatePhaseCapture(0, values);
  if (!evaluation.complete) {
    return {
      complete: false,
      missing: evaluation.missing,
      values,
      persisted: false,
    };
  }

  const sb = getAzureWriteFluentClient();
  const nowIso = new Date().toISOString();
  const moduleKeys = getPhaseCaptureSections(0).map((section) =>
    phaseCaptureModuleKey(0, section.key),
  );
  const { data: existingRows, error: existingError } = await sb
    .from("program_modules")
    .select("id, module_key")
    .eq("engagement_id", programId)
    .in("module_key", moduleKeys);
  if (existingError) throw existingError;
  const existingByKey = new Map(
    ((existingRows as Array<{ id: string; module_key: string }> | null) ?? []).map(
      (row) => [row.module_key, row],
    ),
  );

  for (const [order, section] of evaluation.sections.entries()) {
    const moduleKey = phaseCaptureModuleKey(0, section.key);
    const state = {
      capture_section_key: section.key,
      label: section.label,
      description: section.description,
      value: section.value,
      completed_from_phase_capture_path: true,
      completed_from_origination_charter: true,
      updated_at: nowIso,
    };
    const existing = existingByKey.get(moduleKey);
    if (existing) {
      const { error } = await sb
        .from("program_modules")
        .update({
          module_name: section.label,
          phase_number: 0,
          module_order: order,
          status: "completed",
          state_jsonb: state,
          completed_at: nowIso,
        })
        .eq("id", existing.id)
        .eq("engagement_id", programId);
      if (error) throw error;
    } else {
      const { error } = await sb.from("program_modules").insert({
        engagement_id: programId,
        module_key: moduleKey,
        module_name: section.label,
        phase_number: 0,
        module_order: order,
        status: "completed",
        state_jsonb: state,
        started_at: nowIso,
        completed_at: nowIso,
      });
      if (error) throw error;
    }
  }

  return {
    complete: true,
    missing: [],
    values,
    persisted: true,
  };
}
