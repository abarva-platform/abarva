import "server-only";

import type { DeliverableKey } from "@/lib/deliverables/profiles/types";
import type { GenerateArtifactResult } from "@/lib/deliverables/generate-artifact";
import { getDeliverableProfile } from "@/lib/deliverables/profiles/registry";
import { buildGeneratedPhaseDigest } from "@/lib/deliverables/generated-phase-digest";
import {
  buildPhaseWordEquivalentDocx,
  phaseWordEquivalentFileName,
} from "@/lib/deliverables/phase-word-equivalent";
import { draftModuleDeliverable } from "@/lib/programs/nexus";
import { getPhaseDeliverablePackageContract } from "@/lib/programs/phase-deliverable-package-contract";
import { saveMoveArtifact } from "@/lib/programs/deliverables/move-artifacts";
import type { ProgramCore, TenancyCtx } from "@/lib/programs/types.db";

const PHASE_LABEL: Record<number, string> = {
  0: "P0 Originate",
  1: "P1 Charter",
  2: "P2 Discover & Diagnose",
  3: "P3 Design Future State",
  4: "P4 Roadmap & Business Case",
  5: "P5 Mobilize & Handoff",
};

function safeArtifactFileName(title: string, artifact: string): string {
  const base = (title || artifact)
    .replace(/[^\w\s.-]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${base || artifact}.html`;
}

function gateCaveatReasons(result: {
  draftCaveats?: Array<{ reason: string }>;
  contextCaveats?: string[];
}): string[] {
  return [
    ...(result.draftCaveats ?? []).map((caveat) => caveat.reason),
    ...(result.contextCaveats ?? []).map(
      (missing) => `${missing} is not yet captured or approved for final use.`,
    ),
  ];
}

type GeneratedArtifactResult = Extract<GenerateArtifactResult, { status: "generated" }>;

export interface PersistMoveGeneratedArtifactInput {
  ctx: TenancyCtx;
  program: Pick<ProgramCore, "id" | "name">;
  phase: number;
  artifact: DeliverableKey;
  title?: string;
  result: GeneratedArtifactResult;
}

export interface PersistMoveGeneratedArtifactResult {
  deliverableId: string;
  versionId: string;
  artifactId: string;
  artifactVersion: number;
  artifactBlobStored: boolean;
  editableArtifactId: string;
  editableArtifactVersion: number;
  editableArtifactBlobStored: boolean;
}

export async function persistMoveGeneratedArtifact({
  ctx,
  program,
  phase,
  artifact,
  title,
  result,
}: PersistMoveGeneratedArtifactInput): Promise<PersistMoveGeneratedArtifactResult> {
  const profile = getDeliverableProfile(artifact);
  const deliverablePackageContract = getPhaseDeliverablePackageContract({ artifact, phase });
  const phaseLabel = PHASE_LABEL[phase] ?? `P${phase}`;
  const artifactTitle = title ?? profile.title;
  const solutionContextDigest = buildGeneratedPhaseDigest({
    artifact,
    phase,
    html: result.html,
    context: result.context,
  });
  const isPreGateDraft = result.generationMode === "draft";
  const draftStatusLabel = isPreGateDraft
    ? "Pre-gate draft — review required"
    : "Draft";
  const qualityStatus = isPreGateDraft
    ? result.goldenBar.pass
      ? "Draft quality passed"
      : "Needs review"
    : result.goldenBar.pass
      ? "Passed"
      : "Needs review";
  const goldenBarStatus = isPreGateDraft
    ? result.goldenBar.pass
      ? "Passed with caveats"
      : "Needs review"
    : result.goldenBar.pass
      ? "Passed"
      : "Failed";
  const draftCaveat =
    "Draft status: This artifact was generated before formal phase approval. It reflects available evidence and is intended for sponsor review, workshop preparation, and refinement. It is not final or board-ready until sponsor assignment, charter signoff, and phase gate approval are completed.";
  const openItems = isPreGateDraft
    ? [
        "Sponsor assignment required before final approval.",
        "Charter signoff required before final approval.",
        "Phase gate approval required before final generation.",
        "Baseline capture may require sponsor ratification before final approval.",
        ...gateCaveatReasons(result),
      ]
    : [];

  const { deliverableId, versionId } = await draftModuleDeliverable(ctx, {
    programId: program.id,
    moduleKey: artifact,
    deliverableTypeKey: artifact,
    title: artifactTitle,
    draftContent: result.html,
    structuredData: {
      phase,
      artifact,
      output_format: "html",
      output_role: "html_visual_review_companion",
      editable_word_equivalent_required:
        deliverablePackageContract.formalEditableRecordRequired,
      primary_editable_record_label:
        deliverablePackageContract.primaryEditableRecordLabel,
      deliverablePackageContract,
      mode: "program_generate",
      solutionContextDigest,
      solution_context: result.context,
      golden_bar: result.goldenBar,
      generationMode: result.generationMode,
      draftOnly: result.draftOnly,
      draftCaveats: result.draftCaveats,
      contextCaveats: result.contextCaveats,
    },
    provenanceMap: {
      program: program.name,
      phase,
      phase_label: phaseLabel,
      artifact,
      output_format: "html",
      output_role: "html_visual_review_companion",
      provenance_category: "abarva_generated_deliverable",
      editable_word_equivalent_required:
        deliverablePackageContract.formalEditableRecordRequired,
      required_companion_outputs: deliverablePackageContract.outputs.map(
        (output) => output.kind,
      ),
      generation_mode: result.generationMode,
    },
  });

  const savedArtifact = await saveMoveArtifact(ctx, {
    moveId: program.id,
    phase,
    artifactType: artifact,
    artifactFamily: "generated_deliverable",
    title: artifactTitle,
    description: isPreGateDraft
      ? "Pre-gate review draft generated through the governed Moves artifact path. It does not satisfy phase approval and is not final."
      : "Generated through the governed Moves artifact generation path. Review before final client use.",
    fileName: safeArtifactFileName(artifactTitle, artifact),
    fileFormat: "html",
    body: result.html,
    status: isPreGateDraft ? "review_required" : "draft",
    generatedBy: ctx.email ?? ctx.userId ?? "moves-generate",
    qualityScore: result.goldenBar.pass ? 96 : null,
    unsupportedClaimsCount: 0,
    sourceBasis: "moves_solution_context",
    confidence: result.goldenBar.hasDataGap ? "medium" : "high",
    citationReady: !result.goldenBar.hasDataGap,
    metadata: {
      deliverableId,
      versionId,
      phaseLabel,
      outputFormat: "html",
      outputRole: "html_visual_review_companion",
      provenanceCategory: "abarva_generated_deliverable",
      editableWordEquivalentRequired:
        deliverablePackageContract.formalEditableRecordRequired,
      primaryEditableRecordLabel:
        deliverablePackageContract.primaryEditableRecordLabel,
      requiredCompanionOutputs: deliverablePackageContract.outputs,
      wordEquivalentSections: deliverablePackageContract.wordDocumentSections,
      requiredWorkshopEvidence:
        deliverablePackageContract.requiredWorkshopEvidence,
      provenanceRules: deliverablePackageContract.provenanceRules,
      generationMode: result.generationMode,
      draftOnly: result.draftOnly,
      draftCaveats: result.draftCaveats,
      contextCaveats: result.contextCaveats,
      qualityStatus,
      goldenBarStatus,
      artifactStatus: draftStatusLabel,
      preliminaryCaveat: isPreGateDraft ? draftCaveat : null,
      openItems,
      reviewStatus: isPreGateDraft ? "pre_gate_review_required" : "not_reviewed",
      clientFacingVersionLabel: "Version 1",
    },
  });

  const editableDocx = await buildPhaseWordEquivalentDocx({
    artifact,
    phase,
    moveName: program.name,
    title: artifactTitle,
    html: result.html,
    context: result.context,
    generationMode: result.generationMode,
    reviewStatus: isPreGateDraft ? "review_required" : "draft",
    qualityStatus,
    goldenBarStatus,
    contract: deliverablePackageContract,
  });

  const editableArtifact = await saveMoveArtifact(ctx, {
    moveId: program.id,
    phase,
    artifactType: `${artifact}_editable_docx`,
    artifactFamily: "generated_deliverable",
    title: `${artifactTitle} — Editable Deliverable`,
    description: isPreGateDraft
      ? "Editable Word-equivalent phase deliverable for sponsor review, redlines, and client comments. It is not final until phase approval is recorded."
      : "Editable Word-equivalent phase deliverable for client review, redlines, and approval workflow.",
    fileName: phaseWordEquivalentFileName({ title: artifactTitle, artifact }),
    fileFormat: "docx",
    body: editableDocx,
    status: isPreGateDraft ? "review_required" : "draft",
    generatedBy: ctx.email ?? ctx.userId ?? "moves-generate",
    qualityScore: result.goldenBar.pass ? 96 : null,
    unsupportedClaimsCount: 0,
    sourceBasis: "moves_solution_context",
    confidence: result.goldenBar.hasDataGap ? "medium" : "high",
    citationReady: !result.goldenBar.hasDataGap,
    metadata: {
      deliverableId,
      versionId,
      phaseLabel,
      outputFormat: "docx",
      outputRole: "docx_editable_phase_record",
      provenanceCategory: "abarva_generated_deliverable",
      pairedVisualCompanionArtifactId: savedArtifact.artifactId,
      visualCompanionArtifactType: artifact,
      editableWordEquivalentRequired:
        deliverablePackageContract.formalEditableRecordRequired,
      primaryEditableRecordLabel:
        deliverablePackageContract.primaryEditableRecordLabel,
      requiredCompanionOutputs: deliverablePackageContract.outputs,
      wordEquivalentSections: deliverablePackageContract.wordDocumentSections,
      requiredWorkshopEvidence:
        deliverablePackageContract.requiredWorkshopEvidence,
      provenanceRules: deliverablePackageContract.provenanceRules,
      generationMode: result.generationMode,
      draftOnly: result.draftOnly,
      draftCaveats: result.draftCaveats,
      contextCaveats: result.contextCaveats,
      qualityStatus,
      goldenBarStatus,
      artifactStatus: draftStatusLabel,
      preliminaryCaveat: isPreGateDraft ? draftCaveat : null,
      openItems,
      reviewStatus: isPreGateDraft ? "pre_gate_review_required" : "not_reviewed",
      clientFacingVersionLabel: "Version 1",
    },
  });

  return {
    deliverableId,
    versionId,
    artifactId: savedArtifact.artifactId,
    artifactVersion: savedArtifact.version,
    artifactBlobStored: savedArtifact.blobStored,
    editableArtifactId: editableArtifact.artifactId,
    editableArtifactVersion: editableArtifact.version,
    editableArtifactBlobStored: editableArtifact.blobStored,
  };
}
