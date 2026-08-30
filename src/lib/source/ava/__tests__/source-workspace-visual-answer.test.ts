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
    expect(answer?.directAnswer).toContain("$1.3M");
    expect(answer?.directAnswer).toContain(
      "SLA credits earned but not claimed",
    );
    expect(answer?.directAnswer).toContain("commercial opportunity line");
    expect(
      answer?.citations.some((citation) => citation.recordId === "CTR-090"),
    ).toBe(true);
  });

  it("binds a named contract question to the contract directory instead of the visible portfolio selection", () => {
    const context = sourceContext() as AskSurfaceContext & {
      sourceV4: Record<string, unknown>;
    };
    context.sourceV4.selectedContract = null;
    context.sourceV4.contractDirectory = [
      {
        contractId: "CTR-0002",
        vendorName: "Optum Rx",
        contractName: "Pharmacy Benefits Services Agreement",
        annualValueUsd: 8_600_000,
        actualAnnualSpendUsd: 8_587_900,
        totalCommittedValueUsd: 34_400_000,
        endDate: "31 Dec 2027",
        autoRenew: true,
        renewalOwnerRef: "Procurement",
        scopeSummary: "Pharmacy benefits and claims processing services.",
        scopeRowCount: 4,
      },
      {
        contractId: "CTR-0006",
        vendorName: "Epic Systems Corporation",
        contractName: "Epic Systems Corporation Rate Card Agreement",
        annualValueUsd: 86_200_000,
        actualAnnualSpendUsd: null,
        totalCommittedValueUsd: null,
        endDate: "31 Dec 2030",
        autoRenew: false,
        renewalOwnerRef: "Clinical IT",
        scopeSummary: "EHR platform scope.",
        scopeRowCount: 0,
      },
    ];
    context.sourceV4.contractOpportunityDirectory = [
      {
        id: "epic-candidate",
        contractId: "CTR-0006",
        vendorName: "Epic Systems Corporation",
        label: "Review EHR consolidation posture",
        amountUsd: 4_100_000,
        state: "workflow_required",
        evidenceClass: "not_finance_confirmed",
        nextAction: "Confirm module evidence.",
        sourceRefs: ["source.contract_action_candidate_v1"],
      },
    ];

    expect(
      canBuildSourceWorkspaceVisualAnswer({
        query:
          "For CTR-0002, why is this contract actionable and what is missing before I claim value?",
        surfaceContext: context,
      }),
    ).toBe(true);

    const answer = buildSourceWorkspaceVisualAnswer({
      query:
        "For CTR-0002, why is this contract actionable and what is missing before I claim value?",
      surfaceContext: context,
    });

    expect(answer?.directAnswer).toContain("CTR-0002");
    expect(answer?.directAnswer).toContain("Optum Rx");
    expect(answer?.directAnswer).toContain(
      "No governed opportunity row is tied to this contract",
    );
    expect(answer?.directAnswer).not.toContain("Epic Systems");
    expect(answer?.directAnswer).not.toContain("$4.1M");
    expect(
      answer?.citations.some((citation) => citation.recordId === "CTR-0002"),
    ).toBe(true);
  });

  it("renders source references as client-facing evidence basis labels", () => {
    const context = sourceContext() as AskSurfaceContext & {
      sourceV4: Record<string, unknown>;
    };
    context.sourceV4.selectedContract = null;
    context.sourceV4.contractDirectory = [
      {
        contractId: "CTR-0002",
        vendorName: "Optum Rx",
        contractName: "Pharmacy Benefits Services Agreement",
        annualValueUsd: 8_600_000,
        actualAnnualSpendUsd: 8_587_900,
        totalCommittedValueUsd: 34_400_000,
        endDate: "31 Dec 2027",
        autoRenew: true,
        renewalOwnerRef: "Procurement",
        scopeSummary: "Pharmacy benefits and claims processing services.",
        scopeRowCount: 4,
      },
    ];
    context.sourceV4.contractOpportunityDirectory = [
      {
        id: "ctr-0002-sla-credit",
        contractId: "CTR-0002",
        vendorName: "Optum Rx",
        label: "Unclaimed service credits",
        amountUsd: 43_000,
        state: "workflow_required",
        evidenceClass: "not_finance_confirmed",
        nextAction: "Prepare service-credit claim.",
        sourceRefs: [
          JSON.stringify({
            "Contract Ref": "CTR-0002",
            "Opportunity Ref": "CTR-0002:sla-credit-recovery",
            "Finance Confirmation State": "Not Confirmed",
            "Evidence Coverage": {
              "source.Contract 360": {
                "Change Order Rows": 0,
                "Document Page Text Rows": 0,
              },
              "consumption.Sourcing Opportunity V1": 2,
              "consumption.Sourcing Performance V1": 24,
              "consumption.Sourcing Spend Monthly V1": 24,
              "consumption.Sourcing Contract Scope V1": 0,
            },
          }),
        ],
      },
    ];

    const answer = buildSourceWorkspaceVisualAnswer({
      query:
        "For CTR-0002, why is this contract actionable and what is missing before I claim value?",
      surfaceContext: context,
    });

    const table = answer?.artifacts.find(
      (artifact) => artifact.id === "source-contract-opportunity-table",
    );
    const rows = table?.artifact === "table" ? table.rows : [];
    const evidenceBasis =
      typeof rows?.[0]?.sourceRefs === "string" ? rows[0].sourceRefs : "";
    const tableText = JSON.stringify(table);

    expect(tableText).toContain("Evidence basis");
    expect(evidenceBasis).toContain("Contract record");
    expect(evidenceBasis).toContain("Opportunity record");
    expect(evidenceBasis).toContain("Finance confirmation not complete");
    expect(evidenceBasis).toContain("SLA performance history: 24 rows");
    expect(evidenceBasis).toContain("Monthly spend history: 24 rows");
    expect(evidenceBasis).not.toContain("source.Contract 360");
    expect(evidenceBasis).not.toContain("consumption.Sourcing");
    expect(evidenceBasis).not.toContain("Finance Confirmation State");
    expect(evidenceBasis).not.toContain("{");
  });
});
