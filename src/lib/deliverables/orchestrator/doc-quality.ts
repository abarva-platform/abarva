import JSZip from "jszip";
import type { RenderableDeliverable } from "./types";
import {
  ARCHITECTURE_V2_EXHIBITS,
  type ArchitectureModel,
} from "@/lib/visual-system/architecture-model";

export interface DocQualityVerdict {
  ok: boolean;
  figures: number;
  findings: string[];
}

/** Inspect packaged OOXML so a dropped or zero-size exhibit cannot ship. */
export async function judgeRenderedDocx(
  buffer: Buffer,
  doc: RenderableDeliverable,
  architectureModel?: ArchitectureModel,
): Promise<DocQualityVerdict> {
  const findings: string[] = [];
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml)
    return { ok: false, figures: 0, findings: ["missing_document_xml"] };
  const expected =
    doc.exhibits.filter((exhibit) => exhibit.data).length +
    (architectureModel ? ARCHITECTURE_V2_EXHIBITS.length : 0);
  const figures = (xml.match(/<w:drawing\b/g) ?? []).length;
  const embeddedPngs = Object.keys(zip.files).filter((name) =>
    /^word\/media\/.*\.png$/i.test(name),
  ).length;
  if (figures < expected || (expected > 0 && embeddedPngs === 0)) {
    findings.push(
      `empty_figure:expected_${expected}:drawings_${figures}:media_${embeddedPngs}`,
    );
  }
  const extents = [
    ...xml.matchAll(/<wp:extent\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/g),
  ];
  if (extents.some((match) => Number(match[1]) <= 0 || Number(match[2]) <= 0)) {
    findings.push("zero_size_figure");
  }
  if (expected && extents.length < expected)
    findings.push("missing_figure_extent");
  if (architectureModel) {
    const imageNames = new Set(
      [...xml.matchAll(/<wp:docPr\b[^>]*\bname="([^"]+)"/g)].map(
        (match) => match[1],
      ),
    );
    for (const key of ARCHITECTURE_V2_EXHIBITS) {
      if (!imageNames.has(key))
        findings.push(`missing_architecture_figure:${key}`);
    }
  }
  const escapedTitle = doc.title
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
  if (!xml.includes(escapedTitle)) findings.push("missing_title");
  return { ok: findings.length === 0, figures, findings };
}
