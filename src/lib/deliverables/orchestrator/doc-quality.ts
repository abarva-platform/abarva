import JSZip from "jszip";
import type { RenderableDeliverable } from "./types";
import {
  ARCHITECTURE_V2_EXHIBITS,
  type ArchitectureModel,
} from "@/lib/visual-system/architecture-model";
import { renderArchitectureVisualExhibits } from "@/lib/visual-system/architecture-html-renderer";
import { architectureVisualDigest } from "./architecture-deck-quality";

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
  const architectureVisuals = architectureModel
    ? renderArchitectureVisualExhibits(architectureModel)
    : [];
  const expected =
    doc.exhibits.filter((exhibit) => exhibit.data).length +
    architectureVisuals.reduce(
      (count, visual) => count + 1 + (visual.continuationSvgs?.length ?? 0),
      0,
    );
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
    const actual = new Map<string, string[]>();
    for (const match of xml.matchAll(
      /<wp:docPr\b[^>]*\bname="architecture-exhibit:([a-z0-9_]+):([a-f0-9]{16})"/g,
    )) {
      const digests = actual.get(match[1]) ?? [];
      digests.push(match[2]);
      actual.set(match[1], digests);
    }
    for (const key of ARCHITECTURE_V2_EXHIBITS) {
      const visual = architectureVisuals.find((item) => item.id === key);
      const expectedDigests = visual
        ? [visual.svg, ...(visual.continuationSvgs ?? [])]
            .map(architectureVisualDigest)
            .sort()
        : [];
      const actualDigests = [...(actual.get(key) ?? [])].sort();
      if (actualDigests.length === 0)
        findings.push(`missing_architecture_figure:${key}`);
      if (actualDigests.length !== expectedDigests.length) {
        findings.push(
          `architecture_figure_count:${key}:${actualDigests.length}`,
        );
      }
      if (actualDigests.join("\u0000") !== expectedDigests.join("\u0000")) {
        findings.push(`architecture_figure_source_mismatch:${key}`);
      }
    }
    for (const key of actual.keys()) {
      if (!ARCHITECTURE_V2_EXHIBITS.includes(key as (typeof ARCHITECTURE_V2_EXHIBITS)[number])) {
        findings.push(`unexpected_architecture_figure:${key}`);
      }
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
