import { buildContractIntelligencePrompt } from "../prompt";
import type { ContractIntelligenceRecord } from "../types";

const record = {
  modelVersion: "source-contract-intelligence-v1",
  tenantKey: "synthetic-tenant",
  datasetVersion: "dataset-1",
  contractId: "contract-1",
  vendorName: "Synthetic Vendor",
  contractName: "Synthetic Agreement",
  category: "Cloud",
  archetype: "consumption_commit",
  contract: {
    contractId: "contract-1",
    vendorId: "vendor-1",
    vendorName: "Synthetic Vendor",
    title: "Synthetic Agreement",
    archetypeKey: "consumption_commit",
    archetypeLabel: "consumption commitment",
    archetypeSourceBasis: "document_declared",
    archetypeConfidence: "high",
    startDate: "2026-01-01",
    endDate: "2027-12-31",
    noticePeriodDays: 90,
    annualValueUsd: 100000,
  },
  story: {
    headline: "A usable baseline exists.",
    purpose: "A cloud consumption commitment provides platform capacity.",
    scope: "One named workload.",
    decision: "Review one documented lever.",
    evidenceBoundary: "Benchmark evidence is missing.",
  },
  baseline: { metrics: [], facts: [] },
  evidenceLanes: [],
  anatomy: {
    plainEnglish: "The map connects the contract to its evidence.",
    nodes: [],
    relationships: [],
  },
  findings: [],
  levers: [],
  derivedInsights: [],
  industryIntelligence: {
    state: "missing_benchmark",
    archetype: "consumption commitment",
    plainEnglish: "The playbook is available.",
    benchmarkBoundary: "No external benchmark is loaded.",
    benchmarkSources: [],
    allowedUses: ["select the authored playbook"],
    blockedClaims: ["external market benchmark"],
  },
  review: {
    status: "draft",
    plainEnglish: "Review required.",
    missingEvidence: ["benchmark"],
    reviewerRole: null,
    reviewedAt: null,
    derivedFromLoadRunId: "dataset-1",
  },
  provenance: {
    tenantKey: "synthetic-tenant",
    datasetVersion: "dataset-1",
    modelVersion: "source-contract-intelligence-v1",
    sourceRefs: [],
    loadRunId: null,
    sourceFiles: [],
    sourceSystems: [],
    buildVersion: "source-contract-intelligence-v1",
  },
} satisfies ContractIntelligenceRecord;

describe("buildContractIntelligencePrompt", () => {
  it("puts the governing restrictions before the record and preserves prompt-first output ownership", () => {
    const prompt = buildContractIntelligencePrompt(record, {
      recipient: "client_sample",
    });

    expect(prompt.indexOf("NON-NEGOTIABLE EVIDENCE RULES")).toBeLessThan(
      prompt.indexOf("GOVERNED CONTRACT INTELLIGENCE RECORD"),
    );
    expect(prompt).toContain(
      "Candidate, signal-stage, draft, pending, approval-required, or finance-unconfirmed amounts are not savings",
    );
    expect(prompt).toContain(
      "Never turn a buyer-portfolio comparison into an external market benchmark",
    );
    expect(prompt).toContain(
      "Do not rewrite, soften, or silently remove a Claude-authored sentence after generation",
    );
    expect(prompt).toContain("Sequence | Lever | Action / buyer ask");
    expect(prompt).toContain('"contractId": "contract-1"');
  });
});
