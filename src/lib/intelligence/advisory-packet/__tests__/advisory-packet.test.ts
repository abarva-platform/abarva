jest.mock("server-only", () => ({}));

import { readFileSync } from "node:fs";
import path from "node:path";
import {
  advisoryPacketForClientEvent,
  advisoryPacketModelVisibleJson,
  assembleAdvisoryPacket,
  buildTop100AdvisoryAuditInputs,
  evaluateAdvisoryAnswerQuality,
  generateTop100AdvisoryPacketAudit,
  SKYHARBOR_Q001,
} from "@/lib/intelligence/advisory-packet";
import {
  buildIntelligenceConsultantPromptPacketFromAdvisoryPacket,
  buildIntelligenceConsultantUserPrompt,
} from "@/lib/intelligence/intelligence-consultant-text-synthesis";
import { parseIntelligenceTabbedResponse } from "@/lib/intelligence/tabbed-response";
import type {
  AskSource,
  IntentClassification,
} from "@/lib/intelligence/ask/types";

const classification: IntentClassification = {
  intent: "general_synthesis",
  entities: ["SkyHarbor", "IROPS", "AI"],
  confidence: 91,
};

const richSources: AskSource[] = [
  {
    type: "TENANT",
    name: "SkyHarbor AI portfolio decision ledger",
    id: "source-ledger-1",
    detail:
      "SkyHarbor's AI portfolio shows IROPS recovery decisioning at $270M, customer AI/Digital Concierge at $180M, and data estate rationalization at $122M. IROPS recovery is blocked by missing real-time operations data freshness, lineage, accountable owner, and disruption-cost baseline. MRO predictive maintenance has a bounded operational loop.",
    confidence: 0.94,
    structured: {
      tables: [
        {
          id: "portfolio",
          title: "Portfolio",
          columns: [
            { key: "initiative", label: "Initiative" },
            { key: "valuePool", label: "Value pool", format: "currency" },
          ],
          rows: [
            { initiative: "IROPS recovery decisioning", valuePool: 270 },
            { initiative: "Customer AI / Digital Concierge", valuePool: 180 },
            { initiative: "Data estate rationalization", valuePool: 122 },
          ],
        },
      ],
    },
  },
  {
    type: "GRAPH",
    name: "SkyHarbor operational dependency graph",
    id: "source-graph-1",
    detail:
      "IROPS recovery decisioning depends on IBM Z / mainframe operational feeds, Slot-Sabre-Service availability, Weight-SAP-Hub data freshness, and crew legality signals. Relationship evidence shows no single accountable owner for the cross-domain readiness gate.",
    confidence: 0.9,
  },
  {
    type: "TENANT",
    name: "SkyHarbor AI maturity notes",
    id: "source-maturity-1",
    detail:
      "AI maturity is early-stage for IROPS because operational-data certification and benefit measurement are incomplete. AI maturity is emerging for revenue management and pricing.",
    confidence: 0.88,
  },
  {
    type: "PATTERN",
    name: "Airline IROPS AI sequencing pattern",
    id: "pattern-airline-ops",
    detail:
      "Airline industry pattern context: disruption recovery AI works best after operational data freshness is certified and dispatcher review remains in the loop.",
    confidence: 0.82,
  },
  {
    type: "BENCHMARK",
    name: "Airline operational AI benchmark context",
    id: "benchmark-airline-ops",
    detail:
      "Benchmark context: airline IROPS automation value depends on disruption baseline, route network, labor rules, and data maturity.",
    confidence: 0.76,
  },
];

function q001Packet() {
  return assembleAdvisoryPacket({
    tenantKey: "skyharbor",
    tenantName: "SkyHarbor Air",
    question: SKYHARBOR_Q001,
    classification,
    sources: richSources,
    createdAt: "2026-06-28T00:00:00.000Z",
    industry: "airline",
    aliases: ["SkyHarbor Air", "SkyHarbor"],
  });
}

describe("AdvisoryPacket assembler", () => {
  it("separates model-visible context, audit lineage, and retrieval diagnostics", () => {
    const packet = q001Packet();

    expect(packet.modelVisiblePacket.tenantFacts.length).toBeGreaterThan(0);
    expect(packet.auditLineage.sourceRefs.length).toBe(richSources.length);
    expect(packet.auditLineage.hiddenRawRefs).toHaveLength(richSources.length);
    expect(packet.retrievalDiagnostics.retrievalMode).toBe(
      "advisory-packet-v1",
    );
    expect(packet.retrievalDiagnostics.richnessScore).toBe(5);
    expect(
      packet.retrievalDiagnostics.evidenceIntegrityScore,
    ).toBeGreaterThanOrEqual(4);
  });

  it("keeps raw storage and record markers out of modelVisiblePacket while preserving audit lineage", () => {
    const packet = assembleAdvisoryPacket({
      tenantKey: "skyharbor",
      tenantName: "SkyHarbor Air",
      question: "Which AI investments should we scale?",
      classification,
      sources: [
        {
          type: "TENANT",
          name: "Raw source label",
          id: "SHA-CAP-123",
          detail:
            "Loaded from datasets/enterprise-reads.json Row: 14 APP-OPS-999 ai_maturity: 1. Business fact: IROPS readiness is missing lineage. app id: Weight-SAP-Hub-0687 and Slot-Sabre-Service-0685 are operational dependencies.",
          confidence: 0.9,
        },
      ],
    });
    const modelVisible = advisoryPacketModelVisibleJson(packet);

    expect(modelVisible).not.toMatch(
      /\.csv|Row:|SHA-CAP|APP-|datasets\/|enterprise-reads\.json|ai_maturity:|Weight-SAP-Hub-0687|Slot-Sabre-Service-0685/i,
    );
    expect(modelVisible).toContain("Weight SAP Hub");
    expect(modelVisible).toContain("Slot Sabre Service");
    expect(packet.auditLineage.hiddenRawRefs).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "SHA-CAP-123" })]),
    );
  });

  it("streams a safe packet projection unless operator audit lineage is explicitly requested", () => {
    const packet = q001Packet();
    const safePacket = advisoryPacketForClientEvent(packet);
    const auditPacket = advisoryPacketForClientEvent(packet, true);

    expect(safePacket.auditLineage.hiddenRawRefs).toBeUndefined();
    expect(safePacket.auditLineage.sourceDossier).toBeUndefined();
    expect(safePacket.auditLineage.sourceRefs.length).toBeGreaterThan(0);
    expect(auditPacket.auditLineage.hiddenRawRefs).toHaveLength(
      richSources.length,
    );
    expect(auditPacket.auditLineage.sourceDossier).toBeTruthy();
  });

  it("passes only model-visible content into the Claude prompt adapter", () => {
    const packet = q001Packet();
    const promptPacket =
      buildIntelligenceConsultantPromptPacketFromAdvisoryPacket(packet);
    const prompt = buildIntelligenceConsultantUserPrompt(promptPacket);

    expect(prompt).toContain("SkyHarbor");
    expect(prompt).toContain("IROPS recovery");
    expect(prompt).toContain("Industry context");
    expect(prompt).not.toContain("hiddenRawRefs");
    expect(prompt).not.toContain("source-ledger-1");
    expect(prompt).not.toContain("retrievalDiagnostics");
    expect(prompt).not.toMatch(/SHA-CAP|APP-|ai_maturity:|datasets\/|Row:/i);
  });

  it("keeps SkyHarbor packets isolated from other tenant facts", () => {
    const packet = q001Packet();
    const modelVisible = advisoryPacketModelVisibleJson(packet);

    expect(packet.tenantIdentity.tenantKey).toBe("skyharbor");
    expect(modelVisible).toContain("SkyHarbor");
    expect(modelVisible).not.toMatch(
      /\bApex\b|\bLakeshore\b|\bMeridian\b|\bNorthstar\b/i,
    );
  });
});

describe("Top 100 AdvisoryPacket audit", () => {
  it("generates 100 packets through the reusable assembler with at least 80 rich packets", () => {
    const results = generateTop100AdvisoryPacketAudit();
    const rich = results.filter(
      (result) => result.packet.retrievalDiagnostics.richnessScore >= 4,
    );
    const leakageFree = results.filter(
      (result) => result.packet.retrievalDiagnostics.rawLeakageScan.passed,
    );

    expect(results).toHaveLength(100);
    expect(rich.length).toBeGreaterThanOrEqual(80);
    expect(leakageFree).toHaveLength(100);
    expect(results[0]?.packet.retrievalDiagnostics.richnessScore).toBe(5);
    expect(
      results.every((result) => result.packet.retrievalDiagnostics.corpusRole),
    ).toBe(true);
    expect(
      results.every(
        (result) => result.packet.modelVisiblePacket.expertLenses.length > 0,
      ),
    ).toBe(true);
  });

  it("does not hand a separate local-only packet path to audit generation", () => {
    const inputs = buildTop100AdvisoryAuditInputs();
    const auditSource = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/intelligence/advisory-packet/top-100-audit.ts",
      ),
      "utf8",
    );
    const liveAskSource = readFileSync(
      path.join(process.cwd(), "src/lib/intelligence/ask/index.ts"),
      "utf8",
    );

    expect(inputs).toHaveLength(100);
    expect(auditSource).toContain("assembleAdvisoryPacket");
    expect(liveAskSource).toContain("assembleAdvisoryPacket");
  });

  it("scores selected answer-quality regressions", () => {
    const packet = q001Packet();
    const answer = [
      "SkyHarbor should hold autonomous IROPS scale until the readiness gate clears, while scaling bounded MRO loops first because tenant facts show the IROPS value pool is large but blocked by readiness.",
      "Industry context supports the sequencing, but it is not tenant proof.",
      "The missing evidence is SkyHarbor's AI portfolio shows IROPS recovery decisioning at $270M, customer AI/Digital Concierge at $180M, and data estate rationalization at $122M. IROPS recovery is blocked by missing real-time operations data freshness, lineage, accountable owner, and disruption-cost baseline.",
      "Next, validate the disruption baseline, assign the owner, and approve readiness work before expansion.",
      "| Initiative | Posture |",
      "| --- | --- |",
      "| IROPS recovery decisioning | Hold scale |",
    ].join("\n\n");
    const score = evaluateAdvisoryAnswerQuality(answer, packet);

    expect(score.score).toBeGreaterThanOrEqual(4);
    expect(score.checks.avoidsRawIds).toBe(true);
  });
});

describe("Intelligence renderer preservation", () => {
  it("preserves main answer and Markdown tables without placeholder substitution", () => {
    const raw = [
      "SkyHarbor should hold IROPS scale until the operational-data gate clears.",
      "",
      "<<<TAB: Table | grounding: tenant-evidence>>>",
      "| Initiative | Posture |",
      "| --- | --- |",
      "| IROPS recovery decisioning | Hold scale |",
      "",
      "<<<TAB: Industry Insights | grounding: industry-context>>>",
      "Industry context only: airlines sequence IROPS autonomy after freshness and dispatcher controls.",
    ].join("\n");
    const parsed = parseIntelligenceTabbedResponse(raw);

    expect(parsed.mainAnswer).toBe(
      "SkyHarbor should hold IROPS scale until the operational-data gate clears.",
    );
    expect(parsed.tabs.find((tab) => tab.id === "table")?.content).toContain(
      "| IROPS recovery decisioning | Hold scale |",
    );
    expect(parsed.rawText).not.toContain("the referenced evidence");
    expect(
      parsed.tabs.find((tab) => tab.id === "industry_insights")?.grounding,
    ).toBe("industry-context");
  });
});
