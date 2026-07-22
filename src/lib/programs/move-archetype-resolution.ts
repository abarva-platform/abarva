import "server-only";

import type { TenancyCtx, ProgramCore } from "@/lib/programs/types.db";
import { resolveProgramArchetype } from "@/lib/programs/archetypes/registry";
import type { StrategicMoveArchetype } from "@/lib/programs/archetypes/types";
import { getModuleState, getProgramById } from "@/lib/programs/queries";
import {
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";

function textFromUnknown(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const parts = [
    record.archetype,
    record.classification,
    record.label,
    record.name,
    record.title,
    record.summary,
    record.value,
  ].filter(
    (part): part is string =>
      typeof part === "string" && part.trim().length > 0,
  );

  return parts.length ? parts.join(" ") : null;
}

function charterText(
  charter: Record<string, unknown> | null,
  key: string,
): string | null {
  if (!charter) return null;
  const direct = textFromUnknown(charter[key]);
  if (direct) return direct;
  const scaffold = charter.scaffold;
  if (!scaffold || typeof scaffold !== "object") return null;
  return textFromUnknown((scaffold as Record<string, unknown>)[key]);
}

function moduleText(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const state = value as Record<string, unknown>;
  const raw = state.value;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return null;
}

async function phaseCaptureText(
  ctx: TenancyCtx,
  programId: string,
): Promise<string> {
  const modules = await getModuleState(ctx, programId);
  const parts: string[] = [];

  for (const phase of [0, 1]) {
    for (const section of getPhaseCaptureSections(phase)) {
      const moduleKey = phaseCaptureModuleKey(phase, section.key);
      const row = modules.find((entry) => entry.moduleKey === moduleKey);
      const text = moduleText(row?.state);
      if (text) parts.push(text);
    }
  }

  return parts.join(" ");
}

export async function resolveMoveArchetypeForProgram(
  ctx: TenancyCtx,
  programId: string,
  loadedProgram?: ProgramCore | null,
): Promise<StrategicMoveArchetype> {
  const program = loadedProgram ?? (await getProgramById(ctx, programId));
  if (!program) return resolveProgramArchetype({});

  const charter = program.charter ?? null;
  let capture = "";
  try {
    capture = await phaseCaptureText(ctx, programId);
  } catch {
    capture = "";
  }

  const classification = [
    program.functionPackKey,
    program.problemStatement,
    program.targetOutcome,
    charterText(charter, "archetype"),
    charterText(charter, "classification"),
    charterText(charter, "resolved_program_archetype"),
    charterText(charter, "problem_statement"),
    charterText(charter, "scope_boundary"),
    charterText(charter, "evidence_family"),
    charterText(charter, "known_evidence"),
    charterText(charter, "initial_value_hypothesis"),
    capture,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" ");

  return resolveProgramArchetype({
    archetype: program.archetype,
    classification,
    name: program.name,
  });
}
