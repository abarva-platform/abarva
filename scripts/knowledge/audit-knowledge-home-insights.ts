import {
  MERIDIAN_KNOWLEDGE_HOME_INSIGHTS,
  validateHomeInsightSummary,
} from "../../src/lib/enterprise-knowledge/narratives/knowledge-narrative-store";

const failures = validateHomeInsightSummary(MERIDIAN_KNOWLEDGE_HOME_INSIGHTS);

const text = JSON.stringify(MERIDIAN_KNOWLEDGE_HOME_INSIGHTS).toLowerCase();
for (const required of [
  "member service",
  "contact center",
  "crm",
  "claims",
  "eligibility",
  "knowledge",
  "aht",
  "fcr",
  "aws",
  "databricks",
  "target-state",
  "not current production",
  "phi",
  "hitl",
]) {
  if (!text.includes(required)) {
    failures.push(`home insights missing ${required}`);
  }
}

for (const section of [
  ["top insights", MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.top_insights.length, 5],
  [
    "enterprise context map",
    MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.enterprise_context_map.length,
    8,
  ],
  ["readiness matrix", MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.readiness_matrix.length, 5],
  ["evidence heatmap", MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.evidence_heatmap.length, 5],
  ["top gaps", MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.top_gaps.length, 4],
  ["module readiness", MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.module_readiness.length, 5],
] as const) {
  const [label, actual, minimum] = section;
  if (actual < minimum) failures.push(`${label} too thin: ${actual}`);
}

if (failures.length > 0) {
  console.error("Knowledge Home insight audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Knowledge Home insight audit passed for Meridian Health.");
