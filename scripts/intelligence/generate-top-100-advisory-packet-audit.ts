import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  generateTop100AdvisoryPacketAudit,
  type Top100AdvisoryAuditResult,
} from "@/lib/intelligence/advisory-packet";

const DATE = process.env.ADVISORY_AUDIT_DATE ?? "20260628";
const ROOT = path.join(
  process.cwd(),
  "docs",
  "intelligence",
  "prompt_audit",
  "top_100",
  DATE,
);
const SUMMARY_PATH = path.join(
  process.cwd(),
  "docs",
  "intelligence",
  `TOP_100_PROMPT_AUDIT_SUMMARY_${DATE}.md`,
);

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function average(values: number[]): string {
  if (values.length === 0) return "n/a";
  return (
    values.reduce((sum, value) => sum + value, 0) / values.length
  ).toFixed(2);
}

function categorySummary(results: Top100AdvisoryAuditResult[]): string {
  const categories = Array.from(
    new Set(results.map((result) => result.input.category)),
  ).sort();
  return categories
    .map((category) => {
      const scoped = results.filter(
        (result) => result.input.category === category,
      );
      return `| ${category} | ${scoped.length} | ${average(
        scoped.map(
          (result) => result.packet.retrievalDiagnostics.richnessScore,
        ),
      )} | ${average(scoped.map((result) => result.packet.retrievalDiagnostics.evidenceIntegrityScore))} | ${Array.from(
        new Set(
          scoped.map((result) => result.packet.retrievalDiagnostics.corpusRole),
        ),
      ).join(", ")} |`;
    })
    .join("\n");
}

function lensSummary(results: Top100AdvisoryAuditResult[]): string {
  const counts = new Map<string, number>();
  for (const result of results) {
    for (const lens of result.packet.modelVisiblePacket.expertLenses) {
      counts.set(
        `${lens.lens} ${lens.role}`,
        (counts.get(`${lens.lens} ${lens.role}`) ?? 0) + 1,
      );
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([lens, count]) => `- ${lens}: ${count}`)
    .join("\n");
}

function gapSummary(results: Top100AdvisoryAuditResult[]): string {
  const counts = new Map<string, number>();
  for (const result of results) {
    const gap =
      result.packet.retrievalDiagnostics.biggestMissingInput ?? "none named";
    counts.set(gap, (counts.get(gap) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([gap, count]) => `- ${gap}: ${count}`)
    .join("\n");
}

function summaryMarkdown(results: Top100AdvisoryAuditResult[]): string {
  const richnessReady = results.filter(
    (result) => result.packet.retrievalDiagnostics.richnessScore >= 4,
  ).length;
  const leakageFree = results.filter(
    (result) => result.packet.retrievalDiagnostics.rawLeakageScan.passed,
  ).length;
  const answerSamples = results.filter((result) => result.answerQuality);
  const belowBar = results.filter(
    (result) => result.packet.retrievalDiagnostics.richnessScore < 4,
  );
  return [
    `# Intelligence Top 100 AdvisoryPacket Audit · ${DATE}`,
    "",
    "Generated from the reusable `assembleAdvisoryPacket` runtime assembler. This is a packet-construction proof, not a live signed-in proof.",
    "",
    "## Rollup",
    "",
    `- Questions audited: ${results.length}`,
    `- Richness >= 4: ${richnessReady} / ${results.length}`,
    `- Raw leakage passed: ${leakageFree} / ${results.length}`,
    `- Q001 richness: ${results[0]?.packet.retrievalDiagnostics.richnessScore ?? "n/a"}`,
    `- Answer-quality samples: ${answerSamples.length}`,
    `- Average sampled answer quality: ${average(answerSamples.map((result) => result.answerQuality?.score ?? 0))}`,
    "",
    "## Category Scores",
    "",
    "| Category | Questions | Avg richness | Avg evidence integrity | Corpus roles |",
    "| --- | ---: | ---: | ---: | --- |",
    categorySummary(results),
    "",
    "## Expert Lens Demand",
    "",
    lensSummary(results),
    "",
    "## Most Common Missing Inputs",
    "",
    gapSummary(results),
    "",
    "## Gap Report",
    "",
    belowBar.length === 0
      ? "All generated packets reached advisory context richness >= 4."
      : belowBar
          .map(
            (result) =>
              `- ${result.input.id}: richness ${result.packet.retrievalDiagnostics.richnessScore}; ${result.packet.retrievalDiagnostics.recommendedImprovement}`,
          )
          .join("\n"),
    "",
    "## V1 Must-Fixes",
    "",
    "- Capture signed-in live Q001 model input/output/rendered proof before claiming runtime V1 safety.",
    "- Compare local Q001 packet sections against live Q001 packet sections and save the diff.",
    "- Keep renderer tests focused on table preservation and zero semantic substitution.",
    "",
    "## Backlog",
    "",
    "- Add tenant-specific Top 100 banks for Lakeshore after SkyHarbor live trace passes.",
    "- Add production artifact capture for evidence/actions/visual payloads.",
  ].join("\n");
}

async function main() {
  const results = generateTop100AdvisoryPacketAudit();
  await mkdir(ROOT, { recursive: true });
  for (const result of results) {
    const base = `${result.input.id}-${slug(result.input.category)}`;
    await writeFile(
      path.join(ROOT, `${base}.prompt.json`),
      `${result.promptJson}\n`,
    );
    await writeFile(
      path.join(ROOT, `${base}.prompt.md`),
      `${result.promptMarkdown}\n`,
    );
    await writeFile(
      path.join(ROOT, `${base}.summary.md`),
      `${result.summaryMarkdown}\n`,
    );
  }
  await writeFile(SUMMARY_PATH, `${summaryMarkdown(results)}\n`);
  console.log(
    `Wrote ${results.length} AdvisoryPacket audit records to ${ROOT}`,
  );
  console.log(`Wrote summary to ${SUMMARY_PATH}`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
