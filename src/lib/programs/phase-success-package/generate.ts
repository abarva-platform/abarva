import "server-only";

import { createHash } from "node:crypto";
import { getPhasePackV2 } from "@/lib/programs/phase-packs/v2";
import {
  getMovePhasePlaybook,
  type MovePhase,
} from "@/lib/programs/playbook/move-phase-playbook";
import { AI_PDLC_SESSION_OVERRIDES } from "@/lib/programs/playbook/ai-pdlc-design-sessions";
import {
  listMoveArtifacts,
  saveMoveArtifact,
} from "@/lib/programs/deliverables/move-artifacts";
import type { TenancyCtx } from "@/lib/programs/types.db";
import type { StrategicMove } from "@/lib/programs/types.ui";
import {
  buildDefaultPhaseSuccessRuntimeTruth,
  buildPhaseSuccessPackages,
  type PhaseSuccessPackageArtifact,
} from "./core";

export interface GeneratePhaseSuccessPackagesResult {
  phase: number;
  packages: Array<
    PhaseSuccessPackageArtifact & {
      artifactId: string;
      version: number;
      blobStored: boolean;
      downloadUrl: string;
      reusedExisting: boolean;
    }
  >;
}

export async function generatePhaseSuccessPackages(
  ctx: TenancyCtx,
  input: { move: StrategicMove; phase?: number | null; generatedAt?: string },
): Promise<GeneratePhaseSuccessPackagesResult> {
  const phase = normalizePhase(input.phase ?? input.move.currentPhase);
  const phasePack = getPhasePackV2(phase);
  const playbook = getMovePhasePlaybook(phase, resolveSessionOverrides(input.move));
  const existingArtifacts = await listMoveArtifacts(ctx, input.move.id, {
    currentOnly: true,
  });
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const runtime = buildDefaultPhaseSuccessRuntimeTruth({
    move: input.move,
    phase,
    generatedAt,
    generatedBy: ctx.userId ?? "phase-success-package",
    phasePack,
    sourceArtifacts: existingArtifacts
      .filter((artifact) => artifact.phase === phase)
      .filter((artifact) => !isPhaseSuccessPackageArtifactType(artifact.artifact_type))
      .map((artifact) => ({
        id: artifact.artifact_id,
        title: artifact.title,
        artifactType: artifact.artifact_type,
        status: artifact.status,
      })),
  });
  const packages = buildPhaseSuccessPackages({
    move: input.move,
    phase,
    phasePack,
    playbook,
    runtime,
  });

  const saved = [];
  for (const pkg of packages) {
    const duplicate = findDuplicateCurrentArtifact(existingArtifacts, pkg);
    if (duplicate) {
      saved.push({
        ...pkg,
        artifactId: duplicate.artifact_id,
        version: duplicate.version,
        blobStored: duplicate.metadata?.storage === "azure_blob",
        downloadUrl: `/api/v1/programs/${input.move.id}/artifacts/${duplicate.artifact_id}/download`,
        reusedExisting: true,
      });
      continue;
    }
    const current = existingArtifacts.find(
      (artifact) =>
        artifact.artifact_type === pkg.artifactType &&
        artifact.lifecycle_state === "current",
    );
    if (current?.status === "approved") {
      throw new Error(
        `approved_package_requires_manual_regeneration:${pkg.artifactType}`,
      );
    }
    const row = await saveMoveArtifact(ctx, {
      moveId: input.move.id,
      phase,
      archetype: input.move.archetype,
      artifactType: pkg.artifactType,
      artifactFamily: "session_artifact",
      title: pkg.title,
      description:
        pkg.kind === "phase_execution_package"
          ? "Generated phase execution package with sessions, evidence, templates, and approval checklist."
          : "Generated next-phase readiness package with carry-forward inputs, evidence gaps, and blockers.",
      fileName: pkg.fileName,
      fileFormat: "md",
      body: pkg.body,
      status: pkg.status,
      sourceBasis: "phase_success_package_orchestrator",
      confidence: "medium",
      citationReady: false,
      generatedBy: "phase-success-package",
      metadata: pkg.metadata,
    });
    saved.push({
      ...pkg,
      artifactId: row.artifactId,
      version: row.version,
      blobStored: row.blobStored,
      downloadUrl: `/api/v1/programs/${input.move.id}/artifacts/${row.artifactId}/download`,
      reusedExisting: false,
    });
  }

  return { phase, packages: saved };
}

function isPhaseSuccessPackageArtifactType(artifactType: string): boolean {
  return /_phase_execution_package$|_next_phase_readiness_package$/.test(
    artifactType,
  );
}

function findDuplicateCurrentArtifact(
  artifacts: Awaited<ReturnType<typeof listMoveArtifacts>>,
  pkg: PhaseSuccessPackageArtifact,
) {
  const sha256 = createHash("sha256").update(pkg.body).digest("hex");
  return artifacts.find(
    (artifact) =>
      artifact.artifact_type === pkg.artifactType &&
      artifact.lifecycle_state === "current" &&
      artifact.metadata?.sha256 === sha256,
  );
}

function normalizePhase(phase: number | null | undefined): number {
  if (typeof phase !== "number" || !Number.isFinite(phase)) return 1;
  return Math.max(0, Math.min(5, Math.trunc(phase)));
}

function resolveSessionOverrides(
  move: Pick<StrategicMove, "archetype" | "name">,
): Partial<Record<MovePhase, (typeof AI_PDLC_SESSION_OVERRIDES)[3]>> | undefined {
  const blob = `${move.archetype ?? ""} ${move.name ?? ""}`.toLowerCase();
  if (!/pdlc|product development lifecycle|ai-?pdlc|sdlc/.test(blob)) {
    return undefined;
  }
  return AI_PDLC_SESSION_OVERRIDES as Partial<
    Record<MovePhase, (typeof AI_PDLC_SESSION_OVERRIDES)[3]>
  >;
}
