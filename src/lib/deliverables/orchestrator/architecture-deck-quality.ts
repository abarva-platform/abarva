import JSZip from "jszip";
import {
  ARCHITECTURE_V2_EXHIBITS,
  type ArchitectureModel,
} from "@/lib/visual-system/architecture-model";

/** Check the exported file, not merely the visual list handed to its renderer. */
export async function judgeArchitectureDeck(
  buffer: Buffer,
  model: ArchitectureModel,
): Promise<{ ok: boolean; findings: string[]; embeddedKeys: string[] }> {
  const findings: string[] = [];
  const expected = new Set<string>(ARCHITECTURE_V2_EXHIBITS);
  const planned = new Map(model.exhibitPlan?.map((item) => [item.id, item]));
  for (const key of expected) {
    const interpretation = planned.get(
      key as (typeof ARCHITECTURE_V2_EXHIBITS)[number],
    );
    if (
      !interpretation?.soWhat?.trim() ||
      !interpretation.decisionImplication?.trim()
    ) {
      findings.push(`architecture_exhibit_missing_interpretation:${key}`);
    }
  }

  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files).filter((name) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(name),
  );
  const embeddedKeys: string[] = [];
  for (const name of slideNames) {
    const xml = await zip.file(name)!.async("string");
    for (const match of xml.matchAll(
      /<p:cNvPr\b[^>]*\bname="architecture-exhibit:([a-z0-9_]+)"/g,
    )) {
      embeddedKeys.push(match[1]);
    }
  }

  const counts = new Map<string, number>();
  for (const key of embeddedKeys) counts.set(key, (counts.get(key) ?? 0) + 1);
  for (const key of expected) {
    const count = counts.get(key) ?? 0;
    if (count !== 1)
      findings.push(`architecture_exhibit_export_count:${key}:${count}`);
  }
  for (const key of counts.keys()) {
    if (!expected.has(key))
      findings.push(`architecture_exhibit_unexpected:${key}`);
  }

  return { ok: findings.length === 0, findings, embeddedKeys };
}
