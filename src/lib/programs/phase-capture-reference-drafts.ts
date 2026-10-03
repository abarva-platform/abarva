import type { ProgramModuleRow } from "./types.db";

export function readSyntheticReferenceDraft(
  module: Pick<ProgramModuleRow, "status" | "state"> | undefined,
): string | null {
  if (
    module?.status !== "not_started" ||
    module.state.provenance_class !== "synthetic_reference" ||
    module.state.requires_human_review !== true ||
    module.state.gate_credit !== false
  ) {
    return null;
  }

  const draft = module.state.synthetic_reference_draft;
  return typeof draft === "string" && draft.trim() ? draft : null;
}
