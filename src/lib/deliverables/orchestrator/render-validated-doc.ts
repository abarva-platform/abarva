import { Packer } from "docx";
import { judgeRenderedDocx } from "./doc-quality";
import { renderDeliverableDocx } from "./renderers";
import type { RenderableDeliverable } from "./types";
import type { ArchitectureModel } from "@/lib/visual-system/architecture-model";

export async function renderValidatedDocx(
  doc: RenderableDeliverable,
  architectureModel?: ArchitectureModel,
): Promise<Buffer> {
  const buffer = await Packer.toBuffer(
    renderDeliverableDocx(doc, architectureModel),
  );
  const verdict = await judgeRenderedDocx(buffer, doc, architectureModel);
  if (!verdict.ok) {
    throw new Error(
      `generated_docx_failed_quality:${verdict.findings.join(";")}`,
    );
  }
  return buffer;
}
