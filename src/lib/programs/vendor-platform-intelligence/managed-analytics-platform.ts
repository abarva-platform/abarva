export const MANAGED_ANALYTICS_PLATFORM = {
  archetypeId: "MANAGED_ANALYTICS_PLATFORM",
  label: "Managed Analytics Platform",
  governingRule:
    "Public vendor intelligence tells AbarVa what to investigate. Client contracts and evidence establish what is true for the client.",
  capabilityCategories: [
    "ingestion",
    "orchestration",
    "identity",
    "quality",
    "semantic/business logic",
    "analytics/models",
    "benchmark/external data",
    "reporting",
    "workflow activation",
    "support/adoption",
    "contract/exit",
  ],
} as const;
