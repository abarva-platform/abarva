import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES,
  MERIDIAN_KNOWLEDGE_HOME_INSIGHTS,
  validateDimensionNarrative,
  validateHomeInsightSummary,
} from "../../src/lib/enterprise-knowledge/narratives/knowledge-narrative-store";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/home-knowledge-story-quality");
const failures: string[] = [];

function requireFile(relativePath: string) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`missing required artifact: ${relativePath}`);
    return "";
  }
  return readFileSync(absolutePath, "utf8");
}

const prompt = requireFile(
  "reports/home-knowledge-story-quality/claude-prompts/meridian-home-story-prompt.txt",
);
const rawResponse = requireFile(
  "reports/home-knowledge-story-quality/claude-responses/meridian-home-story-response.txt",
);
const generationLogText = requireFile(
  "reports/home-knowledge-story-quality/claude-generation-log.json",
);
requireFile("reports/home-knowledge-story-quality/rendered-review-table.md");
requireFile("reports/home-knowledge-story-quality/rendered-review-table.html");

if (MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.generated_by !== "claude") {
  failures.push(
    `home insights generated_by must be claude, found ${MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.generated_by}`,
  );
}

for (const narrative of MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES) {
  if (narrative.generated_by !== "claude") {
    failures.push(
      `${narrative.dimension_key}: generated_by must be claude, found ${narrative.generated_by}`,
    );
  }
}

if (!prompt.includes("Meridian") || !prompt.includes("Databricks")) {
  failures.push("Claude prompt does not include Meridian target-state context.");
}

if (!rawResponse.includes("Meridian") && !rawResponse.includes("Healthcare Demo")) {
  failures.push("Claude raw response does not look tenant-specific.");
}

let generationLog: Record<string, unknown> = {};
try {
  generationLog = JSON.parse(generationLogText) as Record<string, unknown>;
} catch {
  failures.push("Claude generation log is not valid JSON.");
}

if (generationLog.status !== "passed") {
  failures.push(`Claude generation log status is not passed: ${String(generationLog.status)}`);
}

failures.push(...validateHomeInsightSummary(MERIDIAN_KNOWLEDGE_HOME_INSIGHTS));
for (const narrative of MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES) {
  failures.push(...validateDimensionNarrative(narrative));
}

if (MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.length !== 19) {
  failures.push(
    `expected 19 Meridian dimensions, found ${MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.length}`,
  );
}

const visibleText = JSON.stringify({
  home: MERIDIAN_KNOWLEDGE_HOME_INSIGHTS,
  dimensions: MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES,
}).toLowerCase();

for (const forbidden of [
  "questions this supports",
  "not yet supported",
  "packet generated",
  "loaded records",
  "v4",
  "v5",
  "v6",
  "v7",
]) {
  if (visibleText.includes(forbidden)) {
    failures.push(`visible story contains forbidden user-guide/legacy phrase: ${forbidden}`);
  }
}

for (const required of [
  "member service",
  "contact center",
  "crm",
  "claims",
  "eligibility",
  "knowledge base",
  "epic clarity",
  "epic caboodle",
  "sql server",
  "tableau",
  "sas",
  "aws",
  "databricks",
  "target-state",
  "not current production",
  "phi",
]) {
  if (!visibleText.includes(required)) {
    failures.push(`visible story missing required Meridian term: ${required}`);
  }
}

const review = {
  status: failures.length ? "failed" : "passed",
  failureCount: failures.length,
  failures,
  checkedAt: new Date().toISOString(),
};
writeFileSync(
  path.join(outDir, "story-quality-stopline-audit.json"),
  `${JSON.stringify(review, null, 2)}\n`,
);

if (failures.length > 0) {
  console.error("Home Knowledge story quality stopline failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Home Knowledge story quality stopline passed.");
