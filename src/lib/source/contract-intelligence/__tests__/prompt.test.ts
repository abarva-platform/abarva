import { buildContractIntelligencePrompt } from "../prompt";
import type { ContractIntelligenceRecord } from "../types";

const record = {
  contractId: "contract-1",
  vendorName: "Synthetic Vendor",
  contractName: "Synthetic Agreement",
  category: "Cloud",
  archetype: "consumption_commit",
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
  },
  review: {
    status: "draft",
    plainEnglish: "Review required.",
    missingEvidence: ["benchmark"],
  },
  provenance: {
    tenantKey: "synthetic-tenant",
    datasetVersion: "dataset-1",
    modelVersion: "source-contract-intelligence-v1",
    sourceRefs: [],
    loadRunId: null,
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
