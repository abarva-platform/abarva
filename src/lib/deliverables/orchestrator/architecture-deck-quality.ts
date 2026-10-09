import JSZip from "jszip";
import { createHash } from "node:crypto";
import {
  ARCHITECTURE_V2_EXHIBITS,
  type ArchitectureModel,
} from "@/lib/visual-system/architecture-model";
import { renderArchitectureVisualExhibits } from "@/lib/visual-system/architecture-html-renderer";

export function architectureVisualDigest(svg: string): string {
  return createHash("sha256").update(svg).digest("hex").slice(0, 16);
}

/** Check the exported file, not merely the visual list handed to its renderer. */
export async function judgeArchitectureDeck(
  buffer: Buffer,
  model: ArchitectureModel,
): Promise<{ ok: boolean; findings: string[]; embeddedKeys: string[] }> {
  const findings: string[] = [];
  if (!model.provenanceNote?.trim()) {
    findings.push("architecture_provenance_missing");
  }
  const visuals = new Map(
    renderArchitectureVisualExhibits(model).map((visual) => [visual.id, visual]),
  );
  const panelsFor = (key: string): string[] => {
    const visual = visuals.get(key as (typeof ARCHITECTURE_V2_EXHIBITS)[number]);
    return visual ? [visual.svg, ...(visual.continuationSvgs ?? [])] : [];
  };
  const flowSources = [
    ["current_state_system_data_flow", model.current.flows, ["data", "event"]],
    ["end_to_end_data_flow", model.target.flows, ["data", "event"]],
    ["ai_recommendation_control_flow", model.target.flows, ["control", "human_approval"]],
  ] as const;
  for (const [key, flows, kinds] of flowSources) {
    const rendered = panelsFor(key)
      .flatMap((svg) =>
        [...svg.matchAll(/data-arch-item-id="([^"]+)"/g)].map(
          (match) => match[1],
        ),
      )
      .sort();
    const expected = flows
      .filter((flow) => (kinds as readonly string[]).includes(flow.kind))
      .map((flow) => flow.id)
      .sort();
    if (rendered.join("\u0000") !== expected.join("\u0000")) {
      findings.push(`architecture_flow_identity_mismatch:${key}`);
    }
  }
  for (const [key, visual] of visuals) {
    for (const svg of [visual.svg, ...(visual.continuationSvgs ?? [])]) {
      const sizes = [
        ...svg.matchAll(/<text\b[^>]*font-size="(\d+(?:\.\d+)?)"/g),
      ].map((match) => Number(match[1]));
      if (sizes.length === 0 || sizes.some((size) => size < 12)) {
        findings.push(`architecture_label_scale:${key}`);
      }
      if (/marker-end="url\(#arrow\)"/.test(svg)) {
        findings.push(`architecture_undeclared_edge:${key}`);
      }
    }
  }
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
  const embeddedDigests = new Map<string, string[]>();
  for (const name of slideNames) {
    const xml = await zip.file(name)!.async("string");
    for (const match of xml.matchAll(
      /<p:cNvPr\b[^>]*\bname="architecture-exhibit:([a-z0-9_]+):([a-f0-9]{16})"/g,
    )) {
      embeddedKeys.push(match[1]);
      const digests = embeddedDigests.get(match[1]) ?? [];
      digests.push(match[2]);
      embeddedDigests.set(match[1], digests);
    }
  }

  const counts = new Map<string, number>();
  for (const key of embeddedKeys) counts.set(key, (counts.get(key) ?? 0) + 1);
  for (const key of expected) {
    const count = counts.get(key) ?? 0;
    const expectedDigests = panelsFor(key).map(architectureVisualDigest).sort();
    if (count !== expectedDigests.length)
      findings.push(`architecture_exhibit_export_count:${key}:${count}`);
    const actualDigests = [...(embeddedDigests.get(key) ?? [])].sort();
    if (actualDigests.join("\u0000") !== expectedDigests.join("\u0000")) {
      findings.push(`architecture_exhibit_source_mismatch:${key}`);
    }
  }
  for (const key of counts.keys()) {
    if (!expected.has(key))
      findings.push(`architecture_exhibit_unexpected:${key}`);
  }

  return { ok: findings.length === 0, findings, embeddedKeys };
}
