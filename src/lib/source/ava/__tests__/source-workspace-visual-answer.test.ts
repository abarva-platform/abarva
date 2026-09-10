import {
  buildSourceContractOptimizationExportAnswer,
  buildSourceWorkspaceVisualAnswer,
  canBuildSourceContractOptimizationExportAnswer,
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
        performanceObservationCount: 72,
        documentExtractionCount: 45,
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
            confidence: 0.82,
            grade: "SYSTEM EVIDENCED",
            blockingGap: "SLA and invoice extracts reconciled.",
            nextAction: "Prepare recovery claim.",
            sourceRefs: [
              "sla_incident_service_credit_monthly",
              "invoice_lines",
            ],
            owner: "Vendor management",
            buyerAsk:
              "Apply the earned service credit against the next invoice.",
            negotiationLanguage:
              "The March breach is calculated from contract service levels and should be credited under the availability SLA.",
            vendorConcession:
              "The vendor avoids reopening the broader commercial schedule by applying the contractual credit formula.",
            timingDependency:
              "Confirm during the next invoice review cycle.",
            priority: "P0",
            riskIfIgnored:
              "The credit can age out before finance records it.",
          },
          {
            id: "CTR-090:shelfware",
            valueType: "avoided_cost",
            label: "Shelfware removed",
            amount: "$2.4M",
            amountUsd: 2_420_000,
            stageRaw: "quantified",
            confidence: 0.82,
            grade: "SYSTEM EVIDENCED",
            blockingGap: "Entitlement and usage extracts reconciled.",
            nextAction: "Negotiate removal from renewal baseline.",
            sourceRefs: ["usage_entitlement_monthly"],
            owner: "Sourcing lead",
            buyerAsk:
              "Remove unused entitlements from the renewal baseline.",
            negotiationLanguage:
              "Renew only the capacity tied to active users and governed usage.",
            vendorConcession:
              "The vendor preserves active use while removing shelfware from the next commitment.",
            timingDependency: "Complete before renewal pricing is finalized.",
            priority: "P1",
            riskIfIgnored:
              "The unused baseline rolls into the next renewal.",
          },
          {
            id: "CTR-090:negotiated-improvement",
            valueType: "negotiated_improvement",
            label: "Price and term improvement",
            amount: "$1.9M",
            amountUsd: 1_850_000,
            stageRaw: "workflow_required",
            confidence: 0.35,
            grade: "DOCUMENT EVIDENCED",
            blockingGap: "Levers visible; signed concession pending.",
            nextAction: "Run Door 1 negotiation plan.",
            sourceRefs: ["renewal_negotiation_history"],
            owner: "Procurement",
            buyerAsk:
              "Reframe the commercial term around observed usage and renewal timing.",
            negotiationLanguage:
              "Move the concession into the renewal paper without treating it as realized savings today.",
            vendorConcession:
              "The vendor protects the renewal while giving the buyer a governed path to right-size the term.",
            timingDependency: "Complete before outreach is approved.",
            priority: "P2",
            riskIfIgnored:
              "The renewal strategy goes out without a sequenced commercial ask.",
          },
          {
            id: "CTR-090:vms-rate-card-variance",
            valueType: "recoverable_leakage",
            label: "VMS labor rate-card variance",
            amount: "$22K",
            amountUsd: 22_140,
            stageRaw: "quantified",
            confidence: 0.82,
            grade: "SYSTEM EVIDENCED",
            blockingGap:
              "VMS rate-card rows reconciled to CLM pricing schedule.",
            nextAction:
              "Confirm no amendment approved the higher billed rates.",
            sourceRefs: ["golden_contract_rate_card_variance"],
            owner: "Procurement",
            buyerAsk:
              "Correct billed rates back to the governed rate card.",
            negotiationLanguage:
              "The claim is limited to reconciled line variance and does not dispute unrelated delivery scope.",
            vendorConcession:
              "The vendor can correct invoice mechanics without reopening the service model.",
            timingDependency:
              "Confirm before the next AP close and dispute deadline.",
            priority: "P0",
            riskIfIgnored:
              "The higher billed rate becomes the practical baseline.",
          },
          {
            id: "CTR-090:discount-band-signal",
            valueType: "negotiated_improvement",
            label: "Discount band benchmark signal",
            amount: "$510K",
            amountUsd: 510_000,
            stageRaw: "signal",
            confidence: 0.3,
            grade: "SYSTEM EVIDENCED",
            blockingGap:
              "Benchmark comparable required before discount-band value can be treated as supported.",
            nextAction:
              "Load one accepted benchmark comparable before pricing this as an executive ask.",
            sourceRefs: ["benchmark_gap_register"],
            owner: "Strategic sourcing",
            buyerAsk:
              "Hold the discount-band question until a governed comparable is loaded.",
            negotiationLanguage:
              "This is an advisory signal, not a priced finding.",
            vendorConcession:
              "The vendor can evaluate repricing once a comparable benchmark is on the record.",
            timingDependency: "Use after benchmark evidence is loaded.",
            priority: "P3",
            riskIfIgnored:
              "Opening rate too early can invite the vendor to reopen term length.",
          },
        ],
      },
      contractOpportunityDirectory: [
        {
          id: "ctr-090-fallback-row",
          contractId: "CTR-090",
          label: "Fallback directory row should not mask rich opportunity rows",
          amountUsd: 999_999,
          state: "finance_confirmation_required",
          evidenceClass: "present",
          nextAction: "Use only if rich opportunity rows are unavailable.",
          sourceRefs: ["source.contract_action_candidate_v1"],
        },
      ],
      commercialPosture: {
        headline: "Commercial posture",
        summary:
          "Source projects the existing Contract 360 and optimization rows into a decision strip; it does not create a savings claim.",
        items: [
          {
            label: "Commitment posture",
            value: "Commitment ahead of usage",
            detail:
              "$6.1M below committed annual baseline; use this as renegotiation-shape evidence, not realized savings.",
          },
          {
            label: "Value type",
            value: "Recoverable opportunity",
            detail: "$1.3M recoverable; $2.4M avoidable; $1.9M negotiable.",
          },
          {
            label: "Top lever",
            value: "Shelfware removed",
            detail: "Negotiate removal from renewal baseline.",
          },
          {
            label: "Evidence depth",
            value: "Loaded",
            detail:
              "Opportunity evidence is system, document, human, or finance evidenced; finance outcome still remains a separate gate.",
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
    expect(answer?.directAnswer).toContain("Verdict:");
    expect(answer?.directAnswer).toContain("Rationale:");
    expect(answer?.directAnswer).toContain("Lever table:");
    expect(answer?.directAnswer).toContain("Caveat:");
    expect(answer?.directAnswer).toContain(
      "| Lever | Action | Value | Owner | Status / evidence gate |",
    );
    expect(answer?.directAnswer).toContain(
      "| SLA credits earned but not claimed | Prepare recovery claim | $1.3M | Vendor management | Stage quantified; confidence 0.82 (82%); evidence SYSTEM EVIDENCED; gate SLA and invoice extracts reconciled |",
    );
    expect(answer?.directAnswer).toContain(
      "| Discount band benchmark signal | Load one accepted benchmark comparable before pricing this as an executive ask | Not sized | Strategic sourcing | Signal-stage; not sized until evidence closes; confidence 0.30 (30%); evidence SYSTEM EVIDENCED; gate Benchmark comparable required before discount-band value can be treated as supported |",
    );
    expect(answer?.directAnswer).toContain(
      "Commercial posture: Commitment posture = Commitment ahead of usage",
    );
    expect(answer?.directAnswer).toContain(
      "Contract 360 posture detail: Commitment posture = Commitment ahead of usage ($6.1M below committed annual baseline; use this as renegotiation-shape evidence, not realized savings); Value type = Recoverable opportunity ($1.3M recoverable; $2.4M avoidable; $1.9M negotiable)",
    );
    expect(answer?.directAnswer).toContain(
      "outside-in market practice is advisory pattern context only",
    );
    expect(answer?.directAnswer).toContain(
      "lines of contract-specific candidate commercial opportunities",
    );
    expect(answer?.directAnswer).toContain("recorded annual value $43.5M");
    expect(answer?.directAnswer).toContain("actual annual spend $37.4M");
    expect(answer?.directAnswer).toContain("vendor Salesforce");
    expect(answer?.directAnswer).toContain("contract ID CTR-090");
    expect(answer?.directAnswer).toContain("end date 28 Jun 2031");
    expect(answer?.directAnswer).toContain("notice date 28 Feb 2031");
    expect(answer?.directAnswer).toContain("auto-renew no");
    expect(answer?.directAnswer).toContain("75 scope rows");
    expect(answer?.directAnswer).toContain(
      "72 active performance observations",
    );
    expect(answer?.directAnswer).toContain(
      "4 sized lines of contract-specific candidate commercial opportunities total $5.6M",
    );
    expect(answer?.directAnswer).toContain(
      "1 lever is signal-stage and excluded from sized totals and charts until evidence gates close",
    );
    expect(answer?.directAnswer).toContain(
      "These amounts are candidates, not realized savings",
    );
    expect(answer?.directAnswer).toContain("confidence 0.82 (82%)");
    expect(answer?.directAnswer).toContain("confidence 0.35 (35%)");
    expect(answer?.artifacts.map((artifact) => artifact.artifact)).toEqual([
      "table",
      "chart",
      "graph",
    ]);
    expect(answer?.artifacts[0]).toMatchObject({
      artifact: "table",
      id: "source-contract-opportunity-table",
    });
    expect(JSON.stringify(answer?.artifacts[0])).toContain("Confidence");
    expect(JSON.stringify(answer?.artifacts[0])).toContain("Stage");
    expect(JSON.stringify(answer?.artifacts[0])).toContain("Evidence grade");
    expect(JSON.stringify(answer?.artifacts[0])).toContain("Blocking gap");
    expect(JSON.stringify(answer?.artifacts[0])).toContain("0.82 (82%)");
    expect(JSON.stringify(answer?.artifacts[0])).toContain("0.35 (35%)");
    expect(JSON.stringify(answer?.artifacts[0])).toContain(
      "Discount band benchmark signal",
    );
    expect(JSON.stringify(answer?.artifacts[0])).toContain("Not sized");
    expect(answer?.artifacts[1]).toMatchObject({
      artifact: "chart",
      kind: "horizontal-bar",
    });
    expect(JSON.stringify(answer?.artifacts[1])).not.toContain(
      "Discount band benchmark signal",
    );
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

  it("builds a PDF-ready contract optimization export answer without extra visual sections", () => {
    const context = sourceContext();
    const query =
      "For CTR-090, act like a CXO pricing negotiator and give me a PDF-ready table of levers to optimize this contract.";

    expect(
      canBuildSourceContractOptimizationExportAnswer({
        query,
        surfaceContext: { ...context, sourceContract360Mode: true },
      }),
    ).toBe(true);

    const answer = buildSourceContractOptimizationExportAnswer({
      query,
      surfaceContext: { ...context, sourceContract360Mode: true },
    });

    expect(answer?.directAnswer).toContain("Executive read:");
    expect(answer?.directAnswer).toContain(
      "| Sequence | Lever | Action / buyer ask | Why vendor can agree | Evidence basis | Value state | Owner / timing | What not to claim yet |",
    );
    expect(answer?.directAnswer).toContain(
      "Apply the earned service credit against the next invoice.",
    );
    expect(answer?.directAnswer).toContain(
      "The vendor avoids reopening the broader commercial schedule",
    );
    expect(answer?.directAnswer).toContain(
      "Not sized - needs evidence before it carries a number",
    );
    expect(answer?.directAnswer).not.toContain("VISUALS");
    expect(answer?.directAnswer).not.toContain("RELATIONSHIP MAP");
    expect(answer?.directAnswer).not.toContain("DECISION TABLE");
    expect(answer?.artifacts).toHaveLength(1);
    expect(answer?.artifacts[0]).toMatchObject({
      artifact: "table",
      id: "source-contract-optimization-export-table",
      title: "Contract Optimization Lever Table",
    });
    expect(JSON.stringify(answer?.artifacts[0])).toContain(
      "What not to claim yet",
    );
  });

  it("routes simple contract summary prompts through deterministic selected-contract answers", () => {
    const context = sourceContext();
    const query = "Summarize this contract.";

    expect(
      canBuildSourceWorkspaceVisualAnswer({ query, surfaceContext: context }),
    ).toBe(true);

    const answer = buildSourceWorkspaceVisualAnswer({
      query,
      surfaceContext: context,
    });

    expect(answer?.directAnswer).toContain(
      "Salesforce Data Platform Agreement 3 (CTR-090)",
    );
    expect(answer?.directAnswer).toContain("vendor Salesforce");
    expect(answer?.directAnswer).toContain("contract ID CTR-090");
    expect(answer?.directAnswer).not.toContain("()");
    expect(answer?.directAnswer).not.toContain("(contract -)");
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
    expect(answer?.directAnswer).toContain(
      "| SLA credits earned but not claimed | Prepare recovery claim | $1.3M | Vendor management | Stage quantified; confidence 0.82 (82%); evidence SYSTEM EVIDENCED; gate SLA and invoice extracts reconciled |",
    );
    expect(answer?.directAnswer).toContain(
      "lines of contract-specific candidate commercial opportunities",
    );
    expect(
      answer?.citations.some((citation) => citation.recordId === "CTR-090"),
    ).toBe(true);
  });

  it("routes visible Contract 360 header context before portfolio-level synthesis", () => {
    const context = {
      module: "Source",
      activeClient: "Active Demo Client",
      clientKey: "active_demo_client",
      activeTab: "Contract 360 / Story",
      sourceContract360Mode: true,
      contractId: "CTR-0006",
      contractName: "Managed infrastructure agreement",
      vendorName: "Primary Vendor Inc.",
      annualValue: 39_800_000,
      actualAnnualSpend: null,
      endDate: "31 Dec 2027",
      evidencePosture:
        "Header only; contract-specific optimization evidence is not loaded.",
      nextAction:
        "Load contract-specific opportunity and evidence rows before sizing value.",
      contractDatasetSummary:
        "230 contracts / 94 vendors / $1.8402B annual value.",
      contractCubeSummary:
        "3 scope rows / 32 action candidates / 0 claimable value rows.",
      sourceV4: {
        executivePortfolio: {
          contracts: 230,
          annualValue: "$1.8402B",
        },
        contextCoverage: {
          vendors: 94,
          scopeRows: 3,
        },
      },
    } as AskSurfaceContext;

    expect(
      canBuildSourceWorkspaceVisualAnswer({
        query:
          "What is the candidate opportunity value on this contract, and what evidence supports it?",
        surfaceContext: context,
      }),
    ).toBe(true);

    const answer = buildSourceWorkspaceVisualAnswer({
      query:
        "What is the candidate opportunity value on this contract, and what evidence supports it?",
      surfaceContext: context,
    });

    expect(answer?.directAnswer).toContain("CTR-0006");
    expect(answer?.directAnswer).toContain("Primary Vendor Inc.");
    expect(answer?.directAnswer).toContain("end date 31 Dec 2027");
    expect(answer?.directAnswer).toContain(
      "candidate opportunity value is not established",
    );
    expect(answer?.directAnswer).toContain("No governed opportunity row");
    expect(answer?.directAnswer).not.toContain(
      "No specific contract is selected",
    );
    expect(answer?.metricsUsed).toContainEqual(
      expect.objectContaining({
        id: "annual-value",
        value: 39_800_000,
      }),
    );
  });

  it("routes missing requested Contract 360 context before portfolio-level synthesis", () => {
    const context = {
      module: "Source",
      activeClient: "Active Demo Client",
      clientKey: "active_demo_client",
      activeTab: "Contract 360 / Story",
      sourceContract360Mode: true,
      contractId: "MER-TECH-REQUESTED-001",
      contractName: null,
      vendorName: null,
      annualValue: null,
      actualAnnualSpend: null,
      endDate: "Not established",
      evidencePosture:
        "Requested contract was not returned by the active Source provider.",
      nextAction:
        "Select a contract present in the governed Source rows before making a contract-specific value or evidence claim.",
      contractDatasetSummary:
        "230 contracts / 94 vendors / $1.8402B annual value.",
      contractCubeSummary:
        "690 scope rows / 0 invoice lines / 32 action candidates.",
      sourceV4: {
        selectedContract: null,
        executivePortfolio: {
          contracts: 230,
          annualValue: "$1.8402B",
        },
        contextCoverage: {
          vendors: 94,
          scopeRows: 690,
          invoiceLines: 0,
        },
      },
    } as AskSurfaceContext;

    expect(
      canBuildSourceWorkspaceVisualAnswer({
        query:
          "What is the candidate opportunity value on this contract, and what evidence supports it?",
        surfaceContext: context,
      }),
    ).toBe(true);

    const answer = buildSourceWorkspaceVisualAnswer({
      query:
        "What is the candidate opportunity value on this contract, and what evidence supports it?",
      surfaceContext: context,
    });

    expect(answer?.directAnswer).toContain("MER-TECH-REQUESTED-001");
    expect(answer?.directAnswer).toContain("Requested contract");
    expect(answer?.directAnswer).toContain(
      "candidate opportunity value is not established",
    );
    expect(answer?.directAnswer).toContain(
      "Requested contract was not returned by the active Source provider",
    );
    expect(answer?.directAnswer).not.toContain(
      "No specific contract is selected",
    );
  });

  it("fills direct Contract 360 coverage from the matching selected contract packet", () => {
    const context = sourceContext() as AskSurfaceContext & {
      sourceV4: {
        selectedContract: Record<string, unknown>;
      };
    };
    context.sourceContract360Mode = true;
    context.contractId = "CTR-090";
    context.contractName = "Salesforce Data Platform Agreement 3";
    context.vendorName = "Salesforce";
    context.annualValue = 43_500_000;
    context.actualAnnualSpend = 37_400_000;
    context.endDate = "28 Jun 2031";
    context.evidencePosture = "Detail loaded.";
    context.sourceV4.selectedContract.noticePeriodDays = "90";

    const answer = buildSourceWorkspaceVisualAnswer({
      query:
        "What is the annual value, actual spend, scope, performance coverage, and candidate opportunity value?",
      surfaceContext: context,
    });

    expect(answer?.directAnswer).toContain("75 scope rows");
    expect(answer?.directAnswer).toContain(
      "72 active performance observations",
    );
    expect(answer?.directAnswer).toContain("notice period 90 days");
    expect(answer?.directAnswer).toContain("vendor Salesforce");
    expect(answer?.directAnswer).not.toContain(
      "scope coverage not established",
    );
    expect(answer?.directAnswer).not.toContain(
      "performance coverage not established",
    );
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

  it("separates evidence presence from finance-confirmation readiness", () => {
    const context = sourceContext() as AskSurfaceContext & {
      sourceV4: Record<string, unknown>;
    };
    context.sourceV4.optimizationOpportunities = null;
    context.sourceV4.contractOpportunityDirectory = [
      {
        id: "candidate-001",
        contractId: "CTR-090",
        label: "Recover eligible service credits",
        amountUsd: 25_000,
        state: "finance_confirmation_required",
        evidenceClass: "present",
        nextAction: "Submit the evidence packet for finance confirmation.",
        sourceRefs: ["performance evidence"],
      },
      {
        id: "candidate-002",
        contractId: "CTR-090",
        label: "Rebalance delivery mix",
        amountUsd: 620_000,
        state: "review_required",
        evidenceClass: "present",
        nextAction: "Complete commercial review!",
        sourceRefs: ["contract scope evidence"],
      },
    ];

    const answer = buildSourceWorkspaceVisualAnswer({
      query: "Why is this contract actionable and what is still gated?",
      surfaceContext: context,
    });

    expect(answer?.directAnswer).toContain("Evidence is present for 2 lines");
    expect(answer?.directAnswer).toContain(
      "2 lines still require explicit workflow, review, or finance confirmation",
    );
    expect(answer?.directAnswer).toContain(
      "These amounts are candidates, not realized savings",
    );
    expect(answer?.directAnswer).toContain(
      "next action: Submit the evidence packet for finance confirmation.",
    );
    expect(answer?.directAnswer).not.toContain("confirmation..");
  });
});
