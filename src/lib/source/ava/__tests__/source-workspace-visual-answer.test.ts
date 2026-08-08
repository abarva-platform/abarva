import {
  buildSourceWorkspaceVisualAnswer,
  canBuildSourceWorkspaceVisualAnswer,
} from "@/lib/source/ava/source-workspace-visual-answer";
import type { AskSurfaceContext } from "@/lib/intelligence/ask/types";

function sourceContext(): AskSurfaceContext {
  return {
    module: "Source",
    activeClient: "SkyHarbor Global",
    clientKey: "skyharbor_global",
    activeTab: "Contract 360 / Story",
    sourceV4: {
      selectedContract: {
        contractId: "CTR-090",
        vendorName: "Salesforce",
        contractName: "Salesforce Data Platform Agreement 3",
        annualValueUsd: 43_500_000,
        actualAnnualSpendUsd: 37_400_000,
        totalCommittedValueUsd: 173_900_000,
        contractedToActualVarianceUsd: 6_100_000,
        endDate: "28 Jun 2031",
        noticeDate: "28 Feb 2031",
        autoRenew: false,
        renewalOwnerRef: "LDR-032",
        scopeSummary: "Enterprise data platform and managed application scope.",
        scopeRowCount: 75,
      },
      optimizationLedger: {
        headline: "Contract has quantified optimization evidence.",
        quantifiedLeakageUsd: 1_301_000,
        realizedValueUsd: 940_000,
        evidenceReady: "5",
        evidenceGaps: "0",
        lines: [
          {
            id: "leakage",
            kind: "recoverable_leakage",
            label: "SLA credits earned but not claimed",
            amount: "$1.3M",
            amountUsd: 1_301_000,
            state: "Quantified",
            evidenceClass: "SYSTEM EVIDENCED",
            evidence: "SLA and invoice extracts reconciled.",
            nextAction: "Prepare recovery claim.",
            sourceRefs: ["sla_incident_service_credit_monthly", "invoice_lines"],
          },
          {
            id: "avoided",
            kind: "avoided_cost",
            label: "Shelfware removed",
            amount: "$2.4M",
            amountUsd: 2_420_000,
            state: "Quantified",
            evidenceClass: "SYSTEM EVIDENCED",
            evidence: "Entitlement and usage extracts reconciled.",
            nextAction: "Negotiate removal from renewal baseline.",
            sourceRefs: ["usage_entitlement_monthly"],
          },
          {
            id: "negotiated",
            kind: "negotiated_improvement",
            label: "Price and term improvement",
            amount: "$1.9M",
            amountUsd: 1_850_000,
            state: "Workflow required",
            evidenceClass: "DOCUMENT EVIDENCED",
            evidence: "Levers visible; signed concession pending.",
            nextAction: "Run Door 1 negotiation plan.",
            sourceRefs: ["renewal_negotiation_history"],
          },
          {
            id: "realized",
            kind: "realized_value",
            label: "Finance-confirmed realized value",
            amount: "$940K",
            amountUsd: 940_000,
            state: "Quantified",
            evidenceClass: "HUMAN VALIDATED",
            evidence: "Finance value confirmation row present.",
            nextAction: "Attach Tower claim reference.",
            sourceRefs: ["finance_value_confirmation"],
          },
        ],
      },
      optimizationSpine: {
        sourceConnections: [
          {
            id: "clm",
            sourceSystem: "CLM / contract repository",
            ledgers: ["Negotiated improvement"],
            extract: "agreement, SOW, order forms, pricing schedules",
            fields: ["contract_id", "document_id", "term", "price"],
            outcome: "Anchors contract rights.",
          },
          {
            id: "ap",
            sourceSystem: "AP / ERP / financial subledger",
            ledgers: ["Recoverable leakage"],
            extract: "invoice lines, payments, PO match",
            fields: ["invoice_id", "line_id", "amount", "contract_id"],
            outcome: "Finds off-contract and rate variance.",
          },
        ],
      },
    },
  } as AskSurfaceContext;
}

describe("Source Workspace visual aVa answer", () => {
  it("builds deterministic table chart and graph artifacts from Source context", () => {
    const context = sourceContext();
    const query =
      "Show me a chart, table, and relationship graph for this contract evidence.";

    expect(canBuildSourceWorkspaceVisualAnswer({ query, surfaceContext: context })).toBe(
      true,
    );

    const answer = buildSourceWorkspaceVisualAnswer({ query, surfaceContext: context });

    expect(answer?.directAnswer).toContain("CTR-090");
    expect(answer?.directAnswer).toContain("outside-in pattern is advisory only");
    expect(answer?.artifacts.map((artifact) => artifact.artifact)).toEqual([
      "table",
      "chart",
      "graph",
    ]);
    expect(answer?.artifacts[0]).toMatchObject({
      artifact: "table",
      id: "source-contract-four-ledger-table",
    });
    expect(answer?.artifacts[1]).toMatchObject({
      artifact: "chart",
      kind: "horizontal-bar",
    });
    expect(answer?.artifacts[2]).toMatchObject({
      artifact: "graph",
      id: "source-contract-evidence-relationship-graph",
    });
    expect(answer?.citations.some((citation) => citation.sourceClass === "worldview")).toBe(
      true,
    );
  });
});
