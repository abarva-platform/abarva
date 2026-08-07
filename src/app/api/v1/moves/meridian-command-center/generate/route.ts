import { NextRequest, NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import {
  generateMeridianCommandCenterArtifact,
  type MeridianCommandCenterArtifactKind,
  type MeridianGenerationCorpusPatternRef,
  type MeridianGenerationEvidenceRef,
  type MeridianGenerationWorkloadRef,
} from "@/lib/context-ingestion/meridian-command-center-generation";
import type { MeridianPhase0Manifest } from "@/lib/context-ingestion/meridian-phase0-manifest";
import { getMeridianStageReadinessInputForClient } from "@/lib/context-ingestion/meridian-stage-readiness-read-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MeridianGenerationPhase = "1" | "2" | "3" | "4" | "5";

interface MeridianCommandCenterGenerateBody {
  artifactId?: unknown;
  artifactKind?: unknown;
  phase?: unknown;
  clientName?: unknown;
  audience?: unknown;
  manifest?: unknown;
  evidenceRefs?: unknown;
  corpusPatternRefs?: unknown;
  workloadRefs?: unknown;
  humanInputs?: unknown;
  additionalInstructions?: unknown;
  model?: unknown;
  maxOutputTokens?: unknown;
}

const ARTIFACT_KINDS = new Set<MeridianCommandCenterArtifactKind>([
  "current-state-operating-model",
  "ai-strategy-memo",
  "use-case-portfolio-scorecard",
  "databricks-target-architecture",
  "investment-benefits-realization",
  "mobilization-plan",
]);

const PHASES = new Set<MeridianGenerationPhase>(["1", "2", "3", "4", "5"]);

function stringField(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field}_required`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function artifactKind(value: unknown): MeridianCommandCenterArtifactKind {
  const candidate = stringField(
    value,
    "artifactKind",
  ) as MeridianCommandCenterArtifactKind;
  if (!ARTIFACT_KINDS.has(candidate)) throw new Error("artifactKind_invalid");
  return candidate;
}

function phase(value: unknown): MeridianGenerationPhase {
  const candidate = stringField(value, "phase") as MeridianGenerationPhase;
  if (!PHASES.has(candidate)) throw new Error("phase_invalid");
  return candidate;
}

function objectArray<T>(value: unknown, field: string): T[] {
  if (!Array.isArray(value)) throw new Error(`${field}_required`);
  return value as T[];
}

function optionalObjectArray<T>(value: unknown): T[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new Error("workloadRefs_invalid");
  return value as T[];
}

function stringArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new Error("humanInputs_invalid");
  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function manifest(value: unknown): MeridianPhase0Manifest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("manifest_required");
  }
  return value as MeridianPhase0Manifest;
}

function optionalPositiveInteger(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error("maxOutputTokens_invalid");
  }
  return value;
}

export async function POST(request: NextRequest) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error) as NextResponse;
  }

  let body: MeridianCommandCenterGenerateBody;
  try {
    body = (await request.json()) as MeridianCommandCenterGenerateBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const parsedManifest = manifest(body.manifest);
    const readinessInput = await getMeridianStageReadinessInputForClient({
      clientId: tenancy.clientId,
      manifest: parsedManifest,
    });
    const result = await generateMeridianCommandCenterArtifact({
      tenantId: tenancy.clientId,
      userId: tenancy.userId,
      clientName: optionalString(body.clientName) ?? parsedManifest.clientName,
      audience:
        optionalString(body.audience) ??
        "CEO, CFO, CDIO, plan COO, and clinical leadership",
      artifactId: stringField(body.artifactId, "artifactId"),
      artifactKind: artifactKind(body.artifactKind),
      phase: phase(body.phase),
      readinessInput,
      evidenceRefs: objectArray<MeridianGenerationEvidenceRef>(
        body.evidenceRefs,
        "evidenceRefs",
      ),
      corpusPatternRefs: objectArray<MeridianGenerationCorpusPatternRef>(
        body.corpusPatternRefs,
        "corpusPatternRefs",
      ),
      workloadRefs: optionalObjectArray<MeridianGenerationWorkloadRef>(
        body.workloadRefs,
      ),
      humanInputs: stringArray(body.humanInputs),
      additionalInstructions: optionalString(body.additionalInstructions),
      model: optionalString(body.model),
      maxOutputTokens: optionalPositiveInteger(body.maxOutputTokens),
    });

    if (result.status === "blocked") {
      return NextResponse.json(
        {
          ok: false,
          status: result.status,
          blockers: result.blockers,
          readiness: result.readiness,
          openAiCalled: result.openAiCalled,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: result.status,
      text: result.text,
      auditId: result.auditId,
      model: result.model,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      stopReason: result.stopReason,
      evidenceIds: result.evidenceIds,
      corpusPatternIds: result.corpusPatternIds,
      readiness: result.readiness,
      openAiCalled: result.openAiCalled,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "meridian_command_center_generation_invalid",
        detail: message,
      },
      { status: 400 },
    );
  }
}
