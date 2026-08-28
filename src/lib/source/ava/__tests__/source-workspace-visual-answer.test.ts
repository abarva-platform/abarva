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
      optimizationOpportunities: {
        recommendation: "Start contract optimization now.",
        opportunities: [
          {
            id: "CTR-090:sla-credit-gap",
            valueType: "recoverable_leakage",
            label: "SLA credits earned but not claimed",
            amount: "$1.3M",
            amountUsd: 1_301_000,
            stageRaw: "quantified",
            grade: "SYSTEM EVIDENCED",
            blockingGap: "SLA and invoice extracts reconciled.",
            nextAction: "Prepare recovery claim.",
            sourceRefs: [
              "sla_incident_service_credit_monthly",
              "invoice_lines",
            ],
            owner: "Vendor management",
          },
          {
            id: "CTR-090:shelfware",
            valueType: "avoided_cost",
            label: "Shelfware removed",
            amount: "$2.4M",
            amountUsd: 2_420_000,
            stageRaw: "quantified",
            grade: "SYSTEM EVIDENCED",
            blockingGap: "Entitlement and usage extracts reconciled.",
            nextAction: "Negotiate removal from renewal baseline.",
            sourceRefs: ["usage_entitlement_monthly"],
            owner: "Sourcing lead",
          },
          {
            id: "CTR-090:negotiated-improvement",
            valueType: "negotiated_improvement",
            label: "Price and term improvement",
            amount: "$1.9M",
            amountUsd: 1_850_000,
            stageRaw: "workflow_required",
            grade: "DOCUMENT EVIDENCED",
            blockingGap: "Levers visible; signed concession pending.",
            nextAction: "Run Door 1 negotiation plan.",
            sourceRefs: ["renewal_negotiation_history"],
            owner: "Procurement",
          },
          {
            id: "CTR-090:vms-rate-card-variance",
            valueType: "recoverable_leakage",
            label: "VMS labor rate-card variance",
            amount: "$22K",
            amountUsd: 22_140,
            stageRaw: "quantified",
            grade: "SYSTEM EVIDENCED",
            blockingGap:
              "VMS rate-card rows reconciled to CLM pricing schedule.",
            nextAction:
              "Confirm no amendment approved the higher billed rates.",
            sourceRefs: ["golden_contract_rate_card_variance"],
            owner: "Procurement",
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

    expect(
      canBuildSourceWorkspaceVisualAnswer({ query, surfaceContext: context }),
    ).toBe(true);

    const answer = buildSourceWorkspaceVisualAnswer({
      query,
      surfaceContext: context,
    });

    expect(answer?.directAnswer).toContain("CTR-090");
    expect(answer?.directAnswer).toContain(
      "outside-in pattern is advisory only",
    );
    expect(answer?.directAnswer).toContain("commercial opportunity line");
    expect(answer?.artifacts.map((artifact) => artifact.artifact)).toEqual([
      "table",
      "chart",
      "graph",
    ]);
    expect(answer?.artifacts[0]).toMatchObject({
      artifact: "table",
      id: "source-contract-opportunity-table",
    });
    expect(answer?.artifacts[1]).toMatchObject({
      artifact: "chart",
      kind: "horizontal-bar",
    });
    expect(answer?.artifacts[2]).toMatchObject({
      artifact: "graph",
      id: "source-contract-evidence-relationship-graph",
    });
    expect(
      answer?.citations.some(
        (citation) => citation.sourceClass === "worldview",
      ),
    ).toBe(true);
  });

  it("does not fall back to raw conflicted values when the governed opportunity is blocked", () => {
    const context = sourceContext() as AskSurfaceContext & {
      sourceV4: {
        selectedContract: Record<string, unknown>;
        optimizationOpportunities: {
          opportunities: Array<Record<string, unknown>>;
        };
        optimizationLedger?: unknown;
        optimizationSpine: Record<string, unknown>;
      };
    };
    context.sourceV4.selectedContract.contractId = "CTR-061";
    context.sourceV4.selectedContract.vendorName = "Microsoft";
    context.sourceV4.selectedContract.contractName =
      "Microsoft Cloud Platform Agreement 2";
    context.sourceV4.optimizationOpportunities = {
      opportunities: [
        {
          id: "CTR-061:baseline-conflict",
          valueType: "recoverable_leakage",
          label: "Invoice and service-credit baseline conflict",
          amount: "Not established",
          amountUsd: null,
          stageRaw: "baseline_conflict",
          grade: "CONFLICT CONTROLLED",
          blockingGap:
            "Do not surface raw recoverable or finance-confirmed values until baseline conflict is resolved.",
          nextAction:
            "Resolve conflicting baseline evidence before calculating value.",
          sourceRefs: [
            "golden_contract_reconciliation",
            "finance_value_confirmation",
          ],
          owner: "Finance and procurement",
        },
      ],
    };
    context.sourceV4.optimizationLedger = {
      lines: [
        {
          id: "legacy-raw-leakage",
          kind: "recoverable_leakage",
          label: "Legacy raw recoverable leakage",
          amount: "$2.34M",
          amountUsd: 2_340_553,
          state: "Raw",
          evidenceClass: "Uncontrolled",
          nextAction: "Do not use.",
        },
      ],
    };

    const answer = buildSourceWorkspaceVisualAnswer({
      query: "Show me a table and chart for this contract evidence.",
      surfaceContext: context,
    });

    expect(answer?.directAnswer).toContain("CTR-061");
    expect(answer?.directAnswer).not.toContain("$2.34M");
    expect(answer?.artifacts.map((artifact) => artifact.artifact)).toEqual([
      "table",
      "graph",
    ]);
    expect(answer?.artifacts[0]).toMatchObject({
      artifact: "table",
      id: "source-contract-opportunity-table",
    });
    expect(
      answer?.caveats.some(
        (caveat) => caveat.id === "chart-evidence-threshold",
      ),
    ).toBe(true);
  });

  it("routes actionability and value-readiness questions to the governed Source answer", () => {
    const context = sourceContext();

    expect(
      canBuildSourceWorkspaceVisualAnswer({
        query: "Why is CTR-090 actionable now?",
        surfaceContext: context,
      }),
    ).toBe(true);
    expect(
      canBuildSourceWorkspaceVisualAnswer({
        query: "What is missing before I can claim value from CTR-090?",
        surfaceContext: context,
      }),
    ).toBe(true);

    const answer = buildSourceWorkspaceVisualAnswer({
      query: "Why is CTR-090 actionable now?",
      surfaceContext: context,
    });

    expect(answer?.directAnswer).toContain("CTR-090");
    expect(answer?.directAnswer).toContain("commercial opportunity line");
    expect(
      answer?.citations.some((citation) => citation.recordId === "CTR-090"),
    ).toBe(true);
  });
});
