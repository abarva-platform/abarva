import type { GeneratedArtifactRecord } from "@/lib/artifacts/repository";
import {
  validateArchitectureModel,
  type ArchitectureModel,
} from "@/lib/visual-system/architecture-model";

/** Restore the governed architecture model saved alongside the renderable doc. */
export function architectureModelForArtifact(
  artifact: Pick<GeneratedArtifactRecord, "metadata">,
): ArchitectureModel | undefined {
  const doc = artifact.metadata.renderableDoc;
  const required =
    artifact.metadata.registryKey === "target_state_architecture" ||
    (doc != null &&
      typeof doc === "object" &&
      !Array.isArray(doc) &&
      (doc as Record<string, unknown>).deliverableTypeKey ===
        "target_state_architecture");
  const stored = artifact.metadata.architectureModel;
  if (stored == null) {
    if (required) throw new Error("stored_architecture_model_missing");
    return undefined;
  }
  if (typeof stored !== "object" || Array.isArray(stored)) {
    throw new Error("stored_architecture_model_invalid");
  }
  try {
    const model = stored as ArchitectureModel;
    if (
      validateArchitectureModel(model).some((issue) => issue.level === "error")
    ) {
      throw new Error("stored_architecture_model_invalid");
    }
    return model;
  } catch {
    throw new Error("stored_architecture_model_invalid");
  }
}
