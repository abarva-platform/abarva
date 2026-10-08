import JSZip from "jszip";
import type { RenderableDeliverable } from "./types";

export interface DocQualityVerdict {
  ok: boolean;
  figures: number;
  findings: string[];
}

/** Inspect packaged OOXML so a dropped or zero-size exhibit cannot ship. */
export async function judgeRenderedDocx(
  buffer: Buffer,
  doc: RenderableDeliverable,
): Promise<DocQualityVerdict> {
  const findings: string[] = [];
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml)
    return { ok: false, figures: 0, findings: ["missing_document_xml"] };
  const expected = doc.exhibits.filter((exhibit) => exhibit.data).length;
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
  const escapedTitle = doc.title
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
  if (!xml.includes(escapedTitle)) findings.push("missing_title");
  return { ok: findings.length === 0, figures, findings };
}
