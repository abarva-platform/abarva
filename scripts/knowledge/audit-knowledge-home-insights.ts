import {
  MERIDIAN_KNOWLEDGE_HOME_INSIGHTS,
  knowledgeNarrativeValidationFailures,
} from "../../src/lib/enterprise-knowledge/narratives/knowledge-narrative-store";

// Covers both the home summary and every dimension narrative, including the
// CXO structural gate (first sentence must not open with provenance or
// methodology, tenant name capped at 2 occurrences, forbidden meta-language).
const failures = knowledgeNarrativeValidationFailures();

const text = JSON.stringify(MERIDIAN_KNOWLEDGE_HOME_INSIGHTS).toLowerCase();
for (const required of [
  ["member service", /member service/],
  ["contact center", /contact center/],
  ["crm", /\bcrm\b/],
  ["claims", /claims/],
  ["eligibility", /eligibility/],
  ["knowledge", /knowledge/],
  ["contact-center KPI baseline", /contact center (?:kpis?|baselines?)|aht|fcr/],
  ["aws", /\baws\b/],
  ["databricks", /databricks/],
  ["target-state", /target-state|target state|declared direction/],
  ["not current production", /not current production|target-state, not current production|target state, not current production/],
  ["phi", /\bphi\b/],
  ["human-in-the-loop", /human-in-the-loop|hitl/],
] as const) {
  const [label, pattern] = required;
  if (!pattern.test(text)) {
    failures.push(`home insights missing ${label}`);
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
