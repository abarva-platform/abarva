import "server-only";

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  evaluatePhaseCapture,
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";

export interface P0PhaseCaptureSource {
  name?: string | null;
  problemStatement?: string | null;
  targetOutcome?: string | null;
  timelineHorizon?: string | null;
  charter?: Record<string, unknown> | null;
}

function readScaffoldOrCharter(
  charter: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string {
  return (
    readScaffoldString(charter, ...keys) || readCharterString(charter, ...keys)
  );
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

function declaredSignalFields(
  text: string,
): { trigger: string; problem: string } | null {
  const values = { trigger: [] as string[], problem: [] as string[] };
  const seen = new Set<string>();
  let active: "trigger" | "problem" | null = null;
  let invalid = false;
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(
      /^\s*(Business trigger|Problem statement)\s*:\s*(.*)$/i,
    );
    if (match) {
      active =
        match[1].toLowerCase() === "business trigger" ? "trigger" : "problem";
      if (seen.has(active)) invalid = true;
      seen.add(active);
      values[active].push(match[2]);
    } else if (active) {
      values[active].push(line);
    } else if (line.trim()) {
      invalid = true;
    }
  }
  if (seen.size === 0) return null;
  if (invalid) return { trigger: "", problem: "" };
  return {
    trigger: values.trigger.join("\n").trim(),
    problem: values.problem.join("\n").trim(),
  };
}

export function buildP0PhaseCaptureValues(
  source: P0PhaseCaptureSource,
  options: { separateDeclaredSignal?: boolean } = {},
): Record<string, string> {
  const charter = source.charter ?? null;
  const problem =
    clean(source.problemStatement) ||
    readScaffoldString(charter, "problem_statement", "problemStatement") ||
    readCharterString(charter, "problem_statement", "problemStatement");
  const declaredSignal = options.separateDeclaredSignal
    ? declaredSignalFields(problem)
    : null;
  // Prefer the split scope-in/scope-out fields; fall back to the legacy
  // blended scope_boundary for Moves originated before the split.
  const scopeIn =
    readScaffoldOrCharter(charter, "scope_in", "scopeIn") ||
    readScaffoldOrCharter(charter, "scope_boundary", "scopeBoundary");
  const scopeOut = readScaffoldOrCharter(charter, "scope_out", "scopeOut");
  const outcomesSuccess = readScaffoldOrCharter(
    charter,
    "outcomes_success",
    "outcomesSuccess",
  );
  const discoveryQuestions = readScaffoldOrCharter(
    charter,
    "discovery_questions",
    "discoveryQuestions",
  );
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
    readCharterString(
      charter,
      "sponsor_candidate",
      "sponsorCandidate",
      "sponsor",
    );
  const evidence =
    readScaffoldString(charter, "evidence_family", "evidenceFamily") ||
    readCharterString(
      charter,
      "evidence_family",
      "evidenceFamily",
      "known_evidence",
    );
  const foundation =
    clean(source.timelineHorizon) ||
    readScaffoldString(
      charter,
      "foundation_readiness",
      "foundationReadiness",
    ) ||
    readCharterString(
      charter,
      "foundation_readiness",
      "foundationReadiness",
      "timeline",
    );
  const archetype =
    readScaffoldString(charter, "archetype", "classification") ||
    readCharterString(
      charter,
      "archetype",
      "classification",
      "resolved_program_archetype",
    );
  const moveName = clean(source.name);
  const enoughForRecommendation =
    (declaredSignal
      ? declaredSignal.trigger && declaredSignal.problem
      : problem) &&
    scopeIn &&
    valueHypothesis &&
    sponsor &&
    evidence &&
    foundation &&
    outcomesSuccess &&
    discoveryQuestions;

  return {
    business_trigger: declaredSignal?.trigger ?? problem,
    problem_statement: declaredSignal?.problem ?? problem,
    affected_function_process: scopeIn || archetype || moveName,
    scope_out: scopeOut,
    initial_value_hypothesis: valueHypothesis,
    outcomes_success: outcomesSuccess,
    discovery_questions: discoveryQuestions,
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
  const preserveStoredCapture = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_extended_intake_fields_v1",
  );
  const values = buildP0PhaseCaptureValues(source, {
    separateDeclaredSignal: preserveStoredCapture,
  });
  const evaluation = evaluatePhaseCapture(0, values);
  if (!preserveStoredCapture && !evaluation.complete) {
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
    .select(
      preserveStoredCapture ? "id, module_key, state_jsonb" : "id, module_key",
    )
    .eq("engagement_id", programId)
    .in("module_key", moduleKeys);
  if (existingError) throw existingError;
  if (preserveStoredCapture && !Array.isArray(existingRows))
    throw new Error("P0 stored capture rows unavailable");
  const existingByKey = new Map(
    (
      (existingRows as Array<{
        id: string;
        module_key: string;
        state_jsonb?: Record<string, unknown> | null;
      }> | null) ?? []
    ).map((row) => [row.module_key, row]),
  );

  if (preserveStoredCapture) {
    const captured: Record<string, string> = {};
    for (const section of getPhaseCaptureSections(0)) {
      const state = existingByKey.get(
        phaseCaptureModuleKey(0, section.key),
      )?.state_jsonb;
      if (state != null && (typeof state !== "object" || Array.isArray(state)))
        throw new Error("P0 stored capture state unavailable");
      const value = state?.value;
      if (value != null && typeof value !== "string")
        throw new Error("P0 stored capture value unavailable");
      captured[section.key] = typeof value === "string" ? value : "";
    }
    if (existingByKey.size > 0) {
      const storedEvaluation = evaluatePhaseCapture(0, captured);
      return {
        complete: storedEvaluation.complete,
        missing: storedEvaluation.missing,
        values: captured,
        persisted: false,
      };
    }
  }
  if (!evaluation.complete) {
    return {
      complete: false,
      missing: evaluation.missing,
      values,
      persisted: false,
    };
  }

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
