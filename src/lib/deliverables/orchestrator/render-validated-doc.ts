import { Packer } from "docx";
import { judgeRenderedDocx } from "./doc-quality";
import { renderDeliverableDocx } from "./renderers";
import type { RenderableDeliverable } from "./types";

export async function renderValidatedDocx(
  doc: RenderableDeliverable,
): Promise<Buffer> {
  const buffer = await Packer.toBuffer(renderDeliverableDocx(doc));
  const verdict = await judgeRenderedDocx(buffer, doc);
  if (!verdict.ok) {
    throw new Error(
      `generated_docx_failed_quality:${verdict.findings.join(";")}`,
    );
  }
  return buffer;
}
