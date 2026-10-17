/** Read-only text oracle over native review documents and their supplied evidence. */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { validatePurposeText } from "@/lib/deliverables/orchestrator/purpose-story-contract";
import type {
  PurposeClaimContext,
  PurposeClaimEvidence,
} from "@/lib/deliverables/orchestrator/purpose-claim-classifier";
import type { SourceRegisterEntry } from "@/lib/deliverables/orchestrator/types";

const parser = new XMLParser({ ignoreAttributes: false, preserveOrder: true });
function text(node: unknown): string {
  if (Array.isArray(node))
    return node.map(text).join(" ").replace(/\s+/g, " ").trim();
  if (node && typeof node === "object")
    return Object.entries(node)
      .filter(([key]) => key !== ":@")
      .map(([key, value]) => (key === "#text" ? String(value) : text(value)))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  return "";
}
function paragraphs(node: unknown): string[] {
  if (Array.isArray(node)) return node.flatMap(paragraphs);
  if (node && typeof node === "object")
    return Object.entries(node).flatMap(([key, value]) =>
      key === "w:p" || key === "a:p" ? [text(value)] : paragraphs(value),
    );
  return [];
}
type Block = {
  text: string;
  role: PurposeClaimContext["textRole"];
  citations: string;
};
async function main() {
  const [configPath, filePath, outPath] = process.argv.slice(2);
  if (!configPath || !filePath || !outPath)
    throw new Error("Usage: config.json golden.docx|pptx report.json");
  const config = JSON.parse(readFileSync(configPath, "utf8")) as {
    synthetic: boolean;
    phase: "P1" | "P2";
    sources: {
      id: string;
      path: string;
      sha256: string;
      label: string;
      family: string;
      approvalState: PurposeClaimEvidence["approvalState"];
    }[];
  };
  if (!config.synthetic) throw new Error("Offline synthetic oracle only");
  const digest = (data: Buffer | string) =>
    createHash("sha256").update(data).digest("hex");
  const evidence: PurposeClaimEvidence[] = config.sources.map((s, i) => {
    const bytes = readFileSync(s.path);
    if (digest(bytes) !== s.sha256)
      throw new Error(`Source hash mismatch: ${s.id}`);
    if (!/\.(?:csv|md|txt)$/.test(s.path))
      throw new Error("Oracle requires explicit text/CSV extracts");
    return {
      citationNumber: i + 1,
      label: s.label,
      approvalState: s.approvalState,
      statement: bytes.toString("utf8"),
    };
  });
  const sourceRegister: SourceRegisterEntry[] = config.sources.map((s, i) => ({
    citationNumber: i + 1,
    referenceId: s.id,
    label: s.label,
    evidenceFamily: s.family,
    confidence: "low",
  }));
  const bytes = readFileSync(filePath),
    zip = await JSZip.loadAsync(bytes);
  const issues: unknown[] = [],
    inventory: unknown[] = [];
  for (const name of Object.keys(zip.files).filter((n) =>
    /^(word\/document|ppt\/slides\/slide\d+)\.xml$/.test(n),
  )) {
    const xml = await zip.file(name)!.async("string"),
      rows = paragraphs(parser.parse(xml));
    const citations = rows
      .map((s) => s.match(/Sources ([A-Z\d, ]+)/)?.[1] || "")
      .join(" ")
      .replace(/\b([A-Z]+\d+)\b/g, "[$1]");
    const blocks: Block[] = [];
    if (config.phase === "P1")
      rows.forEach((row) =>
        blocks.push({
          text: row,
          role: /^(?:Basis:|Provenance:|Source files accompany)/.test(row)
            ? "disclosure"
            : "body",
          citations,
        }),
      );
    else {
      for (const match of xml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)) {
        const y =
          Number(match[0].match(/<a:off x="\d+" y="(\d+)"/)?.[1]) / 914400;
        const role: Block["role"] =
          y >= 6.9 ? "disclosure" : y >= 1.9 && y <= 2.3 ? "scope" : "body";
        paragraphs(parser.parse(match[0])).forEach((row) =>
          blocks.push({ text: row, role, citations }),
        );
      }
      for (const match of xml.matchAll(/<a:tr\b[^>]*>[\s\S]*?<\/a:tr>/g)) {
        const cells = paragraphs(parser.parse(match[0]));
        const id = cells.find((s) =>
          sourceRegister.some((ref) => ref.referenceId === s),
        );
        cells.forEach((row) =>
          blocks.push({
            text: row,
            role: id ? "source" : "body",
            citations: id ? `[${id}]` : citations,
          }),
        );
      }
      for (const block of blocks)
        if (/^Evidence snapshot:/.test(block.text)) block.role = "disclosure";
    }
    for (const block of blocks) {
      const errors = validatePurposeText(
        `${block.text} ${block.citations}`,
        {
          deliverableType:
            config.phase === "P1" ? "charter" : "discovery_report",
          sourceRegister,
        },
        evidence,
        {
          completeInputBundle: true,
          syntheticInputBundle: true,
          textRole: block.role,
        },
      );
      inventory.push({ part: name, ...block });
      if (errors.length) issues.push({ part: name, ...block, errors });
    }
  }
  const report = {
    schema: "purpose-native-text-oracle-v1",
    fileHash: digest(bytes),
    sourceHashes: config.sources.map((s) => ({ id: s.id, sha256: s.sha256 })),
    scope:
      "Native text policies. Office files do not contain the authoring schema; this does not assert phase-schema or visual acceptance.",
    paragraphCount: inventory.length,
    flagCount: issues.length,
    issues,
    inventory,
  };
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify({
      paragraphCount: inventory.length,
      flagCount: issues.length,
    }),
  );
  if (issues.length) process.exitCode = 1;
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
