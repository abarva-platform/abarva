import { buildStructuredExhibits } from "@/lib/intelligence/answer/structured-exhibits";
import { routeQuestion } from "@/lib/intelligence/answer/router";
import { advisorRequiredArtifactForQuery } from "@/lib/intelligence/ask/advisor-composer";
import type { RoutingDecision } from "@/lib/intelligence/answer/router";
import type { AskSource } from "@/lib/intelligence/ask/types";

const routing: RoutingDecision = {
  query: "Show me a chart of Epic spend by category",
  experts: [
    {
      id: "xp.healthcare.revenue-cycle",
      name: "Healthcare Revenue Cycle Expert",
    },
  ],
  outputShape: "chart",
  scores: [],
};

const sources: AskSource[] = [
  {
    id: "chunk-1",
    type: "TENANT",
    name: "F12 IT budget",
    detail: "Epic maintenance and integration spend records.",
    confidence: 0.8,
  },
];

function tableRouting(
  query = "Show me a table of the answer",
): RoutingDecision {
  return { ...routing, query, outputShape: "table" };
}

function graphRouting(query = "Show me a dependency graph"): RoutingDecision {
  return { ...routing, query, outputShape: "graph" };
}

describe("buildStructuredExhibits", () => {
  it("does not infer chart data from figures mentioned in prose", () => {
    const exhibits = buildStructuredExhibits({
      routing,
      sources,
      prose:
        "Epic maintenance is $1.2M for the current run baseline. Epic integration work is $350K for the roadmap tranche.",
    });

    expect(exhibits.citations).toHaveLength(1);
    expect(exhibits.tables).toHaveLength(0);
    expect(exhibits.charts).toHaveLength(0);
    expect(exhibits.prose).toContain("Epic integration work is $350K");
    expect(JSON.stringify(exhibits)).not.toContain(
      "Requested Visual Boundary",
    );
  });

  it("renders charts from structured retrieved source rows instead of prose", () => {
    const exhibits = buildStructuredExhibits({
      routing,
      sources: [
        {
          id: "apex:structured:vendor_contracts",
          type: "TENANT",
          name: "Structured vendor contracts (apex-retail)",
          detail: "Largest vendor contracts from public.vendor_contracts.",
          confidence: 0.99,
          structured: {
            tables: [
              {
                id: "apex-vendor-contracts",
                title: "Vendor Contracts",
                columns: [
                  { key: "vendor", label: "Vendor" },
                  {
                    key: "annualValue",
                    label: "Annual Value",
                    format: "currency",
                    align: "right",
                  },
                ],
                rows: [
                  { vendor: "Retail Lakehouse", annualValue: 95_000_000 },
                  { vendor: "Toshiba POS", annualValue: 23_000_000 },
                  { vendor: "IBM Sterling OMS", annualValue: 22_000_000 },
                ],
                chart: {
                  labelKey: "vendor",
                  valueKey: "annualValue",
                  title: "Annual Contract Value by Vendor",
                },
              },
            ],
          },
        },
      ],
      prose:
        "The loaded vendor portfolio has three visible spend lines. Next move: validate the renewal owner.",
    });

    expect(exhibits.tables[0]).toEqual(
      expect.objectContaining({
        id: "source-apex-vendor-contracts",
        title: "Vendor Contracts",
        rows: [
          expect.objectContaining({
            vendor: "Retail Lakehouse",
            annualValue: 95_000_000,
          }),
          expect.objectContaining({
            vendor: "Toshiba POS",
            annualValue: 23_000_000,
          }),
          expect.objectContaining({
            vendor: "IBM Sterling OMS",
            annualValue: 22_000_000,
          }),
        ],
      }),
    );
    expect(exhibits.charts).toEqual([
      expect.objectContaining({
        id: "source-apex-vendor-contracts-chart",
        kind: "cost-stack",
        title: "Annual Contract Value by Vendor",
        data: [
          expect.objectContaining({
            label: "Retail Lakehouse",
            value: 95_000_000,
          }),
          expect.objectContaining({ label: "Toshiba POS", value: 23_000_000 }),
          expect.objectContaining({
            label: "IBM Sterling OMS",
            value: 22_000_000,
          }),
        ],
      }),
    ]);
  });

  it("renders graphs from structured retrieved source relationships", () => {
    const exhibits = buildStructuredExhibits({
      routing: graphRouting(
        "Show me a dependency graph of applications to functions",
      ),
      sources: [
        {
          id: "apex:structured:applications",
          type: "TENANT",
          name: "Structured application portfolio (apex-retail)",
          detail: "Application portfolio rows from public.applications.",
          confidence: 0.99,
          structured: {
            tables: [
              {
                id: "apex-applications",
                title: "Application Portfolio",
                columns: [
                  { key: "application", label: "Application" },
                  { key: "function", label: "Function" },
                  { key: "vendor", label: "Vendor" },
                ],
                rows: [
                  {
                    application: "Retail Lakehouse",
                    function: "Data & Analytics",
                    vendor: "Databricks",
                  },
                  {
                    application: "Toshiba POS",
                    function: "Store Operations",
                    vendor: "Toshiba",
                  },
                ],
                graph: {
                  fromKey: "application",
                  toKey: "function",
                  labelKey: "vendor",
                  title: "Application to Function Map",
                },
              },
            ],
          },
        },
      ],
      prose:
        "The dependency map is application to owning function. Next move: validate owners.",
    });

    expect(exhibits.graphs).toEqual([
      expect.objectContaining({
        id: "source-apex-applications-graph",
        title: "Application to Function Map",
        nodes: expect.arrayContaining([
          expect.objectContaining({ label: "Retail Lakehouse" }),
          expect.objectContaining({ label: "Data & Analytics" }),
          expect.objectContaining({ label: "Toshiba POS" }),
          expect.objectContaining({ label: "Store Operations" }),
        ]),
        edges: expect.arrayContaining([
          expect.objectContaining({ label: "Databricks" }),
          expect.objectContaining({ label: "Toshiba" }),
        ]),
      }),
    ]);
  });

  it("keeps cited prose without renderer-invented tables when no table artifact exists", () => {
    const exhibits = buildStructuredExhibits({
      routing: tableRouting("Show me a denial-category table"),
      sources,
      prose:
        "The right breakdown is denial reason category, AR days, and overturn rate. Next move: ask Revenue Cycle Operations to validate the category extract from the evidence ledger.",
    });

    expect(exhibits.tables).toHaveLength(0);
    expect(exhibits.charts).toHaveLength(0);
    expect(exhibits.citations[0]).toEqual(
      expect.objectContaining({ label: "F12 IT budget" }),
    );
  });

  it("renders cited evidence for chart requests without inventing chart rows", () => {
    const exhibits = buildStructuredExhibits({
      routing,
      sources: [
        {
          id: "surface-denials",
          type: "SURFACE",
          name: "Revenue cycle denial chart support",
          detail:
            "Medical necessity leakage exposure is $1.2M. Prior authorization leakage exposure is $650K. Eligibility leakage exposure is $310K.",
          confidence: 0.92,
        },
      ],
      prose:
        "Medical Necessity is the highest-priority investment target. Prior Authorization is second, and Eligibility should be handled as a cleanup lane.",
    });

    expect(exhibits.citations).toHaveLength(1);
    expect(exhibits.citations[0]?.sourceClass).toBe("tenant-fact");
    expect(exhibits.tables).toHaveLength(0);
    expect(exhibits.charts).toHaveLength(0);
    expect(exhibits.prose).toContain(
      "Medical Necessity is the highest-priority",
    );
  });

  it("does not generate a CXO summary table from prose for executive trend asks", () => {
    const exhibits = buildStructuredExhibits({
      routing: tableRouting(
        "For Healthcare Demo, summarize the top AI trends for payer operations. Include one concise table and one chart if useful.",
      ),
      sources,
      prose:
        "Payment integrity is the cleanest first value pool because leakage recovery has measurable ownership. Prior authorization is the second bet, but clinical policy and appeal handling need governed workflow controls. Member service agent assist can improve productivity once call-center quality and deflection baselines are validated. A clinical and claims data foundation is the enabling move because repeatable AI depends on governed definitions.",
    });

    expect(exhibits.tables).toHaveLength(0);
    expect(exhibits.charts).toHaveLength(0);
    expect(exhibits.prose).toContain("Payment integrity");
  });

  it("converts complete markdown tables from Ava prose into typed tables", () => {
    const exhibits = buildStructuredExhibits({
      routing,
      sources,
      prose: [
        "Here are planning ranges from the cited context.",
        "",
        "| Use case | Primary benefit | Range |",
        "|---|---|---|",
        "| Demand forecasting | Inventory turn | 2-5% margin lift |",
        "| Markdown optimization | Recovered margin | 1-2% category margin |",
        "",
        "Next move: validate tenant-specific numbers before board use.",
      ].join("\n"),
    });

    expect(exhibits.prose).toContain(
      "Here are planning ranges from the cited context.",
    );
    expect(exhibits.prose).toContain(
      "Next, validate tenant-specific numbers before board use.",
    );
    expect(exhibits.prose).not.toContain("| Use case |");
    expect(exhibits.tables[0]).toEqual(
      expect.objectContaining({
        id: "answer-markdown-table-1",
        title: "Answer Table",
        rows: [
          expect.objectContaining({
            use_case: "Demand forecasting",
            primary_benefit: "Inventory turn",
            range: "2-5% margin lift",
          }),
          expect.objectContaining({
            use_case: "Markdown optimization",
            primary_benefit: "Recovered margin",
            range: "1-2% category margin",
          }),
        ],
      }),
    );
    expect(exhibits.tables[0]?.note).toBeUndefined();
    expect(exhibits.charts).toHaveLength(0);
  });

  it("keeps model-emitted markdown tables as typed export artifacts even when routing is prose", () => {
    const exhibits = buildStructuredExhibits({
      routing: {
        ...routing,
        query: "What is the purpose of AbarVa?",
        outputShape: "prose",
      },
      sources,
      prose: [
        "AbarVa is decision infrastructure for CXOs.",
        "",
        "| Surface | Purpose | When to use |",
        "|---|---|---|",
        "| Intelligence | Shape the executive read | Strategy questions |",
        "| Source | Build sourcing evidence | Vendor and contract decisions |",
        "| Moves | Govern execution | Phase-based transformation work |",
        "",
        "Decision boundary: accountable owners approve the decision.",
      ].join("\n"),
    });

    expect(exhibits.prose).toContain("decision infrastructure");
    expect(exhibits.prose).toContain("Decision boundary");
    expect(exhibits.prose).not.toContain("| Surface |");
    expect(exhibits.tables).toEqual([
      expect.objectContaining({
        id: "answer-markdown-table-1",
        title: "Answer Table",
        rows: [
          expect.objectContaining({
            surface: "Intelligence",
            purpose: "Shape the executive read",
          }),
          expect.objectContaining({
            surface: "Source",
            when_to_use: "Vendor and contract decisions",
          }),
          expect.objectContaining({
            surface: "Moves",
            purpose: "Govern execution",
          }),
        ],
      }),
    ]);
  });

  it("assembles the canonical Moves phase table for strategy-to-execution answers", () => {
    const exhibits = buildStructuredExhibits({
      routing: tableRouting(
        "Develop an AI strategy with Moves and show Tower outcomes.",
      ),
      sources,
      prose: [
        "Lakeshore Holdings should run this as a governed Moves sprint.",
        "",
        "Moves phase plan",
        "- P0 Originate: frame the bet.",
        "- P1 Charter: sign the charter.",
        "- P2 Discover & Diagnose: ground the evidence.",
        "- P3 Design Future State: compare options.",
        "- P4 Roadmap & Business Case: build the roadmap.",
        "- P5 Approval & Mobilization: confirm readiness.",
        "- Tower Track Outcomes: track value evidence.",
      ].join("\n"),
    });

    expect(exhibits.prose).not.toContain("|---|");
    expect(exhibits.tables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "answer-moves-phase-plan",
          title: "Moves Phase Plan",
          rows: expect.arrayContaining([
            expect.objectContaining({ phase: "P0 Originate" }),
            expect.objectContaining({ phase: "P5 Approval & Mobilization" }),
            expect.objectContaining({
              phase: "Tower Track Outcomes",
              boundary:
                "Tower supports Finance or outcome-owner certification; it does not certify by itself.",
            }),
          ]),
        }),
      ]),
    );
  });

  it("converts collapsed inline markdown tables from live Ava prose into typed tables", () => {
    const exhibits = buildStructuredExhibits({
      routing: tableRouting("Show me an omnichannel dependency risk table"),
      sources,
      prose:
        "Here's the visual cut. Omnichannel dependency risk — ranked | System | Annual cost | Integrations | Posture | Risk driver | |---|---|---|---|---| | IBM Sterling OMS | $22M/yr | 10 | Contain | Routing ship-from-store | | Toshiba POS | $23M/yr | 11 | Replace | Store-edge transition | The single chart that matters is dependency concentration.",
    });

    expect(exhibits.prose).toContain("Here's the visual cut.");
    expect(exhibits.prose).toContain(
      "The single chart that matters is dependency concentration.",
    );
    expect(exhibits.prose).not.toContain("| System |");
    expect(exhibits.tables[0]).toEqual(
      expect.objectContaining({
        id: "answer-inline-table-1",
        title: "Answer Table",
        rows: [
          expect.objectContaining({
            system: "IBM Sterling OMS",
            annual_cost: "$22M/yr",
            integrations: "10",
            posture: "Contain",
            risk_driver: "Routing ship-from-store",
          }),
          expect.objectContaining({
            system: "Toshiba POS",
            annual_cost: "$23M/yr",
            integrations: "11",
            posture: "Replace",
            risk_driver: "Store-edge transition",
          }),
        ],
      }),
    );
    expect(exhibits.tables[0]?.note).toBeUndefined();
    expect(exhibits.charts).toHaveLength(0);
  });

  it("formats dense prose after extracting typed tables", () => {
    const exhibits = buildStructuredExhibits({
      routing: tableRouting("Show me an analytics technology table"),
      sources,
      prose:
        "Honest read first: I don't have the full Apex IT landscape inventory loaded, so I cannot list every analytics vendor. What the loaded context does tell me is the strategic shape. Apex's Retail Lakehouse & Customer Inventory Graph has $95M committed and $12M realized. Analytics technology cut | Layer | Typical stack | |---|---| | Lakehouse / warehouse | Databricks or Snowflake | | Legacy marts | Teradata / Oracle / SQL Server | This is the consolidation bet meant to replace fragmented banner-level analytics. Inventory truth is the gating risk for any AI workload on top of it. Next move: assign the accountable data owner to validate the missing tenant evidence before approving a board number.",
    });

    expect(exhibits.prose).toContain(
      "Retail Lakehouse & Customer Inventory Graph",
    );
    expect(exhibits.prose).toContain("This is the consolidation bet");
    expect(exhibits.prose).toContain("Next, assign");
    expect(exhibits.prose).not.toContain("The supporting evidence is that");
    expect(exhibits.prose).not.toContain("That means");
    expect(exhibits.prose).not.toContain("| Layer |");
    expect(exhibits.tables[0]).toEqual(
      expect.objectContaining({
        id: "answer-inline-table-1",
        rows: [
          expect.objectContaining({
            layer: "Lakehouse / warehouse",
            typical_stack: "Databricks or Snowflake",
          }),
          expect.objectContaining({
            layer: "Legacy marts",
            typical_stack: "Teradata / Oracle / SQL Server",
          }),
        ],
      }),
    );
  });

  it("keeps Apex-style inline tables out of prose and preserves readable sections", () => {
    const exhibits = buildStructuredExhibits({
      routing: tableRouting(
        "Show me a table of technology investments by urgency",
      ),
      sources,
      prose:
        "Read: Your loaded D&A estate shows eight data products spanning sales, customer, inventory, digital, loss prevention, supply chain, merchandising, and workforce — but the maturity profile is uneven, and the customer/digital domains are your weakest links. Evidence — what's actually in your estate: | Data Product | Domain | Owner Team | Cadence | Maturity | Known Gap | |---|---|---|---|---|---| | POS transaction lake | Sales | Analytics platform | Daily | Silver | Partial lineage | | Customer 360 / loyalty graph | Customer | Customer data team | Near real-time | Bronze | Identity gaps | Implication: Merch planning is your only gold-grade asset, and it is leaking trust through manual overrides. Next move: assign the accountable owner to validate the cited evidence and decide whether this should move into Source or Moves.",
    });

    expect(exhibits.tables).toHaveLength(1);
    expect(exhibits.tables[0]?.rows).toEqual([
      expect.objectContaining({
        data_product: "POS transaction lake",
        domain: "Sales",
        owner_team: "Analytics platform",
      }),
      expect.objectContaining({
        data_product: "Customer 360 / loyalty graph",
        domain: "Customer",
        owner_team: "Customer data team",
      }),
    ]);
    expect(exhibits.prose).toContain(
      "Merch planning is your only gold-grade asset",
    );
    expect(exhibits.prose).toContain("assign the accountable owner");
    expect(exhibits.prose).not.toContain("The supporting evidence is that");
    expect(exhibits.prose).not.toContain("That means");
    expect(exhibits.prose).not.toContain("| Data Product |");
    expect(exhibits.prose).not.toMatch(
      /^(Read|Evidence|Implication|Next move):/gim,
    );
  });

  it("strips orphan table fragments when the model emits an incomplete visual table", () => {
    const exhibits = buildStructuredExhibits({
      routing: tableRouting(
        "Show me a table of technology investments by urgency",
      ),
      sources,
      prose:
        "Read: First Capital Financial has several live technology investments where the risk profile and ownership are clear enough to drive action now — the table below organizes them by urgency.\n2M run cost | Critical; restricted non-public data, vendor-hosted | Data residency and exit rights review — restricted classification + vendor-hosted is a red flag combination |\n| Marqeta Dispute Manager | Head of Cards & Payments | $4.\nNext move: assign the accountable owner to validate the cited evidence and decide whether this should move into Source or Moves.",
    });

    expect(exhibits.tables).toHaveLength(0);
    expect(exhibits.prose).toContain("First Capital Financial");
    expect(exhibits.prose).toContain("Next, assign");
    expect(exhibits.prose).not.toContain("|");
    expect(exhibits.prose).not.toContain("Marqeta Dispute Manager");
  });

  it("strips lone visual table headers when requested chart data is not validated", () => {
    const exhibits = buildStructuredExhibits({
      routing: {
        ...routing,
        query:
          "Give me the top 5 AI use cases and rank them in a 2x2 matrix chart across value and complexity.",
        outputShape: "chart",
      },
      sources,
      prose:
        "| AI Use Case | Value (1-5) | Complexity (1-5) | Quadrant | Industry Case Evidence | Lakeshore Holdings-Specific Signal |",
    });

    expect(exhibits.prose).toBe("");
    expect(exhibits.tables).toHaveLength(0);
    expect(JSON.stringify(exhibits)).not.toContain("| AI Use Case |");
    expect(JSON.stringify(exhibits)).not.toContain(
      "Requested Visual Boundary",
    );
  });

  it("turns Claude-emitted value/complexity GFM tables into typed matrix charts", () => {
    const exhibits = buildStructuredExhibits({
      routing: {
        ...routing,
        query:
          "For FS Demo, rank five AI investment use cases by business value and implementation complexity. Show an executive 2x2 value/complexity matrix and a horizontal bar chart.",
        outputShape: "chart",
      },
      sources,
      prose: [
        "This is a directional planning view, not finance-validated scoring.",
        "",
        "| Use case | Value | Complexity | Basis |",
        "|---|---|---|---|",
        "| Commercial credit automation | High | Medium | Cited company evidence with live owner |",
        "| Capital markets research | High | Medium | Cited company evidence with measured value signal |",
        "| Fraud detection expansion | Medium-high | High | Governance gaps still need owner and metric basis |",
        "| KYC automation | Medium | High | Evidence remediation needed before funding |",
        "| Servicing AI | Medium | Medium | Candidate use case, not yet validated |",
        "",
        "Next move: validate scoring with Finance before board use.",
      ].join("\n"),
    });

    expect(exhibits.charts).toEqual([
      expect.objectContaining({
        id: "answer-markdown-table-1-quadrant-matrix",
        kind: "quadrant-matrix",
      }),
    ]);
    expect(exhibits.tables[0]).toEqual(
      expect.objectContaining({
        id: "answer-markdown-table-1",
        rows: expect.arrayContaining([
          expect.objectContaining({
            use_case: "Commercial credit automation",
            value: "High",
            complexity: "Medium",
          }),
        ]),
      }),
    );
    expect(JSON.stringify(exhibits.charts)).toContain(
      "Capital markets research",
    );
    expect(JSON.stringify(exhibits.charts)).toContain("Servicing AI");
    expect(exhibits.tables[0]?.title).not.toBe("Requested Visual Boundary");
  });

  it("renders a chart only from exact numeric columns in an extracted table", () => {
    const exhibits = buildStructuredExhibits({
      routing,
      sources,
      prose:
        "Here's the visual cut. Omnichannel dependency risk — ranked | System | Annual cost | Integrations | Posture | Risk driver | |---|---|---|---|---| | IBM Sterling OMS | $22M/yr | 10 | Contain | Routing ship-from-store | | Toshiba POS | $23M/yr | 11 | Replace | Store-edge transition | | Salesforce Commerce | $12M/yr | 8 | Invest | Healthy posture | Next move: validate the risk owner.",
    });

    expect(exhibits.tables).toHaveLength(1);
    expect(exhibits.charts).toEqual([
      expect.objectContaining({
        id: "answer-table-chart-1",
        kind: "cost-stack",
        title: "Annual cost by System",
        data: [
          expect.objectContaining({
            label: "IBM Sterling OMS",
            value: 22_000_000,
          }),
          expect.objectContaining({ label: "Toshiba POS", value: 23_000_000 }),
          expect.objectContaining({
            label: "Salesforce Commerce",
            value: 12_000_000,
          }),
        ],
      }),
    ]);
  });

  it("converts value and complexity tables into typed quadrant matrix charts", () => {
    const exhibits = buildStructuredExhibits({
      routing: {
        ...routing,
        query:
          "Give me the top 5 AI use cases for supply chain and rank them in a 2x2 matrix across value and complexity.",
        outputShape: "chart",
      },
      sources,
      prose:
        "Use-case priority\n\n| Use case | Value | Complexity | Rationale |\n|---|---|---|---|\n| Demand sensing | High | Medium | Improves forecast accuracy |\n| Supplier risk sensing | Medium | Low | Uses supplier and shipment signals |\n| Autonomous planning exception triage | Very high | High | Needs workflow integration |\n\nNext move: validate source coverage.",
    });

    expect(exhibits.tables).toHaveLength(1);
    expect(exhibits.charts).toEqual([
      expect.objectContaining({
        id: "answer-markdown-table-1-quadrant-matrix",
        kind: "quadrant-matrix",
        title: "Value / Complexity 2x2 Matrix",
        data: expect.objectContaining({
          xAxisLabel: "Implementation complexity",
          yAxisLabel: "Business value",
          points: expect.arrayContaining([
            expect.objectContaining({
              label: "Demand sensing",
              x: 52,
              y: 78,
            }),
            expect.objectContaining({
              label: "Autonomous planning exception triage",
              x: 78,
              y: 92,
            }),
          ]),
        }),
      }),
    ]);
  });

  it("converts value and complexity tables into quadrant charts even when routing is prose", () => {
    const exhibits = buildStructuredExhibits({
      routing: {
        ...routing,
        query:
          "Give me the top 5 AI use cases for supply chain and rank them in a 2x2 matrix across value and complexity.",
        outputShape: "prose",
      },
      sources,
      prose:
        "Use-case priority\n\n| Use case | Value | Complexity | Rationale |\n|---|---|---|---|\n| Demand sensing | High | Medium | Improves forecast accuracy |\n| Supplier risk sensing | Medium | Low | Uses supplier and shipment signals |\n| Autonomous planning exception triage | Very high | High | Needs workflow integration |\n\nNext move: validate source coverage.",
    });

    expect(exhibits.tables).toHaveLength(1);
    expect(exhibits.charts).toEqual([
      expect.objectContaining({
        id: "answer-markdown-table-1-quadrant-matrix",
        kind: "quadrant-matrix",
      }),
    ]);
  });

  it("converts governed chart fences into typed chart artifacts", () => {
    const exhibits = buildStructuredExhibits({
      routing: {
        ...routing,
        query: "Show me an AI adoption trend chart for back-office functions.",
        outputShape: "chart",
      },
      sources,
      prose:
        'Adoption has moved from pilots into operating workflows.\n\n```chart\n{"type":"line","title":"AI adoption trend","subtitle":"Back-office functions","xKey":"Year","yKey":"Adoption","unit":"%","data":[{"Year":"2024","Adoption":22},{"Year":"2025","Adoption":41},{"Year":"2026","Adoption":68}],"note":"Directional benchmark view"}\n```\n\nThe slope is the board message.',
    });

    expect(exhibits.prose).toContain(
      "Adoption has moved from pilots into operating workflows.",
    );
    expect(exhibits.prose).toContain("The slope is the board message.");
    expect(exhibits.prose).not.toContain("```chart");
    expect(exhibits.prose).not.toContain('"type":"line"');
    expect(exhibits.charts).toEqual([
      expect.objectContaining({
        id: "answer-chart-fence-1",
        kind: "line",
        title: "AI adoption trend",
        builder: "inlineChart",
        data: expect.objectContaining({
          type: "line",
          xKey: "Year",
          yKey: "Adoption",
          unit: "%",
          data: [
            { Year: "2024", Adoption: 22 },
            { Year: "2025", Adoption: 41 },
            { Year: "2026", Adoption: 68 },
          ],
        }),
      }),
    ]);
  });

  it("converts bare multiline chart blocks into typed chart artifacts", () => {
    const exhibits = buildStructuredExhibits({
      routing: {
        ...routing,
        query: "Rank five AI use cases by value and complexity with a chart.",
        outputShape: "chart",
      },
      sources,
      prose:
        'Start with wire fraud interdiction because measured value is strongest.\nchart\n{"type":"horizontal-bar","title":"FS Demo — AI Use Case Value Scores vs. Complexity Scores","xKey":"use_case","yKey":"valueScore","unit":"score","data":[{"use_case":"Wire fraud interdiction","valueScore":95},{"use_case":"Servicing copilot","valueScore":74},{"use_case":"Loan exception routing","valueScore":68}]}\n```\nEvidence boundary: validate the planning scores before board use.',
    });

    expect(exhibits.prose).toContain(
      "Start with wire fraud interdiction because measured value is strongest.",
    );
    expect(exhibits.prose).toContain(
      "Evidence boundary: validate the planning scores before board use.",
    );
    expect(exhibits.prose).not.toContain('"type":"horizontal-bar"');
    expect(exhibits.charts).toEqual([
      expect.objectContaining({
        id: "answer-chart-fence-1",
        kind: "horizontal-bar",
        title: "FS Demo — AI Use Case Value Scores vs. Complexity Scores",
        builder: "inlineChart",
      }),
    ]);
  });

  it("strips invalid chart fences without creating fabricated exhibits", () => {
    const exhibits = buildStructuredExhibits({
      routing,
      sources,
      prose:
        'Here is the recommendation.\n\n```chart\n{"type":"line","title":"Bad chart","xKey":"Year","yKey":"Adoption","data":[{"Year":"2026","Adoption":"directional"}]}\n```\n\nUse the loaded facts only.',
    });

    expect(exhibits.prose).toContain("Here is the recommendation.");
    expect(exhibits.prose).toContain("Use the loaded facts only.");
    expect(exhibits.prose).not.toContain("Bad chart");
    expect(exhibits.charts).toHaveLength(0);
  });

  it("does not chart directional ranges from an extracted table", () => {
    const exhibits = buildStructuredExhibits({
      routing,
      sources,
      prose:
        "Merchandising AI benefit pools — planning ranges | Use case | Primary benefit | Planning range | Basis | |---|---|---|---| | Demand forecasting | Inventory turn | 2-5% margin lift | Apex evidence ledger | | Assortment optimization | SKU productivity | 3-8% margin lift | Corpus pattern | Next move: validate tenant-specific numbers.",
    });

    expect(exhibits.tables).toHaveLength(1);
    expect(exhibits.charts).toHaveLength(0);
  });

  it("converts relationship tables into typed graphs for graph-shaped questions", () => {
    const exhibits = buildStructuredExhibits({
      routing: graphRouting(
        "Show me a dependency graph of platform relationships",
      ),
      sources,
      prose:
        "Dependency graph | From | Relationship | To | Evidence | |---|---|---|---| | Retail Lakehouse | feeds | Demand Forecasting | Inventory history | | Toshiba POS | sends transactions to | Retail Lakehouse | Store sales feed | Next move: validate the integration owner.",
    });

    expect(exhibits.tables).toHaveLength(1);
    expect(exhibits.graphs).toEqual([
      expect.objectContaining({
        id: "answer-relationship-graph-1",
        nodes: expect.arrayContaining([
          expect.objectContaining({ label: "Retail Lakehouse" }),
          expect.objectContaining({ label: "Demand Forecasting" }),
          expect.objectContaining({ label: "Toshiba POS" }),
        ]),
        edges: expect.arrayContaining([
          expect.objectContaining({ label: "feeds" }),
          expect.objectContaining({ label: "sends transactions to" }),
        ]),
      }),
    ]);
  });

  it("does not infer percentage charts from cited source prose", () => {
    const exhibits = buildStructuredExhibits({
      routing,
      sources: [
        {
          id: "surface-denial-rates",
          type: "SURFACE",
          name: "Revenue cycle denial rate support",
          detail:
            "Medical necessity denial rate is 11.8%. Prior authorization denial rate is 8.4%. Eligibility denial rate is 4.9%.",
          confidence: 0.92,
        },
      ],
      prose:
        "Medical necessity is the highest-priority investment target because the rate and AR drag are both worse than the other categories.",
    });

    expect(exhibits.citations).toHaveLength(1);
    expect(exhibits.tables).toHaveLength(0);
    expect(exhibits.charts).toHaveLength(0);
    expect(exhibits.prose).toContain(
      "Medical necessity is the highest-priority",
    );
  });

  it("does not invent an evidence-required table when a table is requested without cited rows", () => {
    const exhibits = buildStructuredExhibits({
      routing: tableRouting("Show me a denial-category table"),
      sources: [],
      prose:
        "The requested denial-category table is not in the connected tenant evidence. Next move: validate the source extract before approving numbers.",
    });

    expect(exhibits.tables).toHaveLength(0);
    expect(exhibits.citations).toHaveLength(0);
    expect(exhibits.prose).toContain("validate the source extract");
  });

  it("keeps prose-only chart caveats when chart rows are not extractable", () => {
    const exhibits = buildStructuredExhibits({
      routing: { ...routing, outputShape: "chart" },
      sources,
      prose:
        "The strongest signal is ticket deflection, but the answer has no exact comparable chart rows. The retrieved evidence points to ServiceNow and finance support, but the monthly ticket baseline still needs validation.",
    });

    expect(exhibits.charts).toHaveLength(0);
    expect(exhibits.tables).toHaveLength(0);
    expect(exhibits.prose).toContain("monthly ticket baseline");
  });

  it("keeps prose-only graph caveats when edge rows are not extractable", () => {
    const exhibits = buildStructuredExhibits({
      routing: graphRouting("Show me an integration dependency graph"),
      sources,
      prose:
        "The integration dependency picture is concentrated in a few platforms, but the answer did not include From / Relationship / To rows that can be safely rendered as a graph.",
    });

    expect(exhibits.graphs).toHaveLength(0);
    expect(exhibits.tables).toHaveLength(0);
    expect(exhibits.prose).toContain("integration dependency picture");
  });

  it("scrubs orphan pipe headers from visual answers with no validated rows", () => {
    const exhibits = buildStructuredExhibits({
      routing: {
        ...routing,
        query:
          "Give me the top 5 AI use cases for supply chain and rank them in a 2x2 matrix across value and complexity.",
        outputShape: "chart",
      },
      sources,
      prose:
        "| AI Use Case | Value (1-5) | Complexity (1-5) | Quadrant |\n\nNo source-backed rows were available.",
    });

    expect(exhibits.prose).not.toContain("| AI Use Case |");
    expect(exhibits.tables).toHaveLength(0);
    expect(JSON.stringify(exhibits)).not.toContain(
      "Requested Visual Boundary",
    );
  });

  it("lifts an agent-assist ranking table into typed table and chart artifacts", () => {
    const exhibits = buildStructuredExhibits({
      routing: {
        ...routing,
        query:
          "Rank the Meridian agent assist opportunities and show the value tradeoff.",
        outputShape: "chart",
      },
      sources,
      prose: `Healthcare Demo should prioritize agent assist where operational value is high and readiness can be proven.

| Opportunity | Value score | Complexity score | Basis |
|---|---:|---:|---|
| Real-time agent assist | 88 | 62 | Call-center workflow and knowledge-access context |
| Intent detection | 74 | 48 | Transcript and CRM readiness context |
| Next-best action | 69 | 70 | Claims, benefits, and authorization dependency context |

Use the first wave to validate data access, compliance controls, and supervisor adoption before scaling.`,
    });

    expect(exhibits.tables).toHaveLength(1);
    expect(exhibits.charts).toHaveLength(1);
    expect(exhibits.prose).toContain("Healthcare Demo should prioritize");
    expect(exhibits.prose).not.toContain("| Opportunity |");
  });

  it.each([
    "What is the single best AI investment SkyHarbor should make next?",
    "Where is AI spend most likely being wasted?",
    "What must be true before agentic IROPS can safely scale?",
    "What are the top three operational risks in scaling IROPS AI?",
    "Which AI product-development bets should SkyHarbor prioritize?",
    "How should product, data, operations, and risk work together on AI releases?",
    "Which customer experience AI investments are likely to improve NPS fastest?",
    "What governance decision would unlock the most AI value?",
  ])(
    "does not auto-render evidence support tables for advisory prompt: %s",
    (query) => {
      const routed = routeQuestion({ query, industry: "airline" });
      const forcedShape = advisorRequiredArtifactForQuery(query);
      const exhibits = buildStructuredExhibits({
        routing: {
          ...routed,
          outputShape: forcedShape ?? routed.outputShape,
        },
        sources,
        prose:
          "SkyHarbor should hold broad scale-up until operational data readiness and model-risk gates are signed. The better decision is to fund the recovery workflow with strict release gates, not spread capital across every AI idea.",
      });

      expect(exhibits.citations).toHaveLength(1);
      expect(exhibits.tables).toHaveLength(0);
      expect(exhibits.charts).toHaveLength(0);
      expect(exhibits.graphs).toHaveLength(0);
      expect(exhibits.prose).not.toContain("Supporting Material");
    },
  );

  describe("governed decision-table fence (Fix Slice 1/2)", () => {
    const decisionTableJson = JSON.stringify({
      title: "Meridian AI Investment Priorities",
      rows: [
        {
          initiative: "Agent Assist",
          value: "High — projected $4.2M annual savings",
          valueScore: 88,
          complexity: "Medium — requires EHR integration",
          complexityScore: 55,
          readiness: "Medium — pilot data available",
          readinessScore: 62,
          evidenceBasis: "Tenant call-volume data; industry AHT benchmarks",
          recommendation: "Prioritize as the next 90-day initiative",
          nextAction: "Scope pilot with contact-center ops",
          directional: false,
        },
        {
          initiative: "Payment Integrity",
          value: "High — reduces claims leakage",
          valueScore: 81,
          complexity: "High — multiple payer integrations",
          complexityScore: 76,
          readiness: "Low — data quality gaps",
          readinessScore: 34,
          evidenceBasis:
            "Industry benchmark; tenant claims volume is directional",
          recommendation: "Fund a data-quality remediation sprint first",
          nextAction: "Commission a claims data audit",
          directional: true,
        },
        {
          initiative: "Cost Transparency",
          value: "Medium — improves patient satisfaction",
          valueScore: 58,
          complexity: "Low — vendor tool available",
          complexityScore: 28,
          readiness: "High — vendor contract in place",
          readinessScore: 84,
          evidenceBasis: "Vendor contract; tenant satisfaction survey",
          recommendation: "Quick win — implement in parallel",
          nextAction: "Confirm vendor SOW scope",
          directional: false,
        },
      ],
    });

    function decisionTableProse(json: string, tail = ""): string {
      return [
        "Ranked by value, complexity, and readiness.",
        "",
        "```decision-table",
        json,
        "```",
        "",
        `Next move: validate the payment-integrity data quality gap before funding.${tail}`,
      ].join("\n");
    }

    it("promotes a ranked decision-table fence into a typed table and three derived charts", () => {
      const exhibits = buildStructuredExhibits({
        routing: {
          ...routing,
          query:
            "rank agent assist vs payment integrity vs cost transparency by value, complexity, readiness",
          outputShape: "chart",
        },
        sources,
        prose: decisionTableProse(decisionTableJson),
      });

      expect(exhibits.prose).toContain("Ranked by value, complexity");
      expect(exhibits.prose).toContain(
        "Next, validate the payment-integrity data quality gap before funding.",
      );
      expect(exhibits.prose).not.toContain("decision-table");
      expect(exhibits.prose).not.toContain("Requested Visual Boundary");

      expect(exhibits.tables).toHaveLength(1);
      const table = exhibits.tables[0];
      expect(table?.title).toBe("Meridian AI Investment Priorities");
      expect(table?.columns.map((column) => column.key)).toEqual([
        "initiative",
        "value",
        "complexity",
        "readiness",
        "evidenceBasis",
        "recommendation",
        "nextAction",
      ]);
      expect(table?.rows).toHaveLength(3);
      expect(table?.rows[1]).toEqual(
        expect.objectContaining({
          initiative: "Payment Integrity",
          value: expect.stringContaining("(directional)"),
        }),
      );
      expect(table?.note).toContain("directional");

      expect(exhibits.charts.map((chart) => chart.id)).toEqual([
        "answer-decision-table-quadrant-matrix",
        "answer-decision-table-readiness-bar",
        "answer-decision-table-priority-stack",
      ]);

      const matrix = exhibits.charts[0];
      expect(matrix?.kind).toBe("quadrant-matrix");
      expect(matrix?.title).toContain("(directional estimate)");
      expect((matrix?.data as { points: unknown[] }).points).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "Agent Assist", x: 55, y: 88 }),
        ]),
      );

      const readinessBar = exhibits.charts[1];
      expect(readinessBar?.kind).toBe("horizontal-bar");
      expect((readinessBar?.data as { data: unknown[] }).data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            initiative: "Cost Transparency",
            readiness: 84,
          }),
        ]),
      );

      const priorityStack = exhibits.charts[2];
      expect(priorityStack?.kind).toBe("bar");
      expect(
        (priorityStack?.data as { data: Array<{ initiative: string }> }).data[0]
          ?.initiative,
      ).toBe("Agent Assist");
    });

    it("does not render a fallback table when the decision-table fence is malformed and no other rows exist", () => {
      const exhibits = buildStructuredExhibits({
        routing: tableRouting(
          "rank agent assist vs payment integrity by value, complexity, readiness",
        ),
        sources,
        prose: [
          "```decision-table",
          "{not valid json",
          "```",
          "",
          "Next move: validate the source extract.",
        ].join("\n"),
      });

      expect(exhibits.tables).toHaveLength(0);
      expect(exhibits.prose).toContain("validate the source extract");
    });

    it("renders the table even when too few rows carry numeric scores to derive charts", () => {
      const oneScoredRow = JSON.stringify({
        title: "Partial Priorities",
        rows: [
          {
            initiative: "Agent Assist",
            value: "High",
            valueScore: 88,
            complexity: "Medium",
            complexityScore: 55,
            readiness: "Medium",
            readinessScore: 62,
            evidenceBasis: "Tenant data",
            recommendation: "Prioritize",
            nextAction: "Scope pilot",
            directional: false,
          },
          {
            initiative: "Payment Integrity",
            value: "Not yet scored",
            evidenceBasis: "Awaiting claims audit",
            recommendation: "Hold",
            nextAction: "Commission audit",
            directional: true,
          },
        ],
      });

      const exhibits = buildStructuredExhibits({
        routing: tableRouting("rank agent assist vs payment integrity"),
        sources,
        prose: decisionTableProse(oneScoredRow),
      });

      expect(exhibits.tables).toHaveLength(1);
      expect(exhibits.tables[0]?.rows).toHaveLength(2);
      expect(exhibits.charts).toHaveLength(0);
    });

    it("accepts records as a decision-table row alias and strips malformed chart/followup fragments from prose", () => {
      const exhibits = buildStructuredExhibits({
        routing: tableRouting(
          "For Meridian agent assist, rank the top opportunities by value and complexity. Show the tradeoff in an executive-ready way.",
        ),
        sources,
        prose: [
          "Recommendation first.",
          '```decision-table {"title":"Agent Assist Ranking","records":[{"initiative":"Clinical Documentation Assist","value":"High","valueScore":82,"complexity":"Medium","complexityScore":45,"readiness":"Medium-High","readinessScore":70,"evidenceBasis":"EHR workflow dependency","recommendation":"Start here","nextAction":"Scope pilot","directional":true},{"initiative":"Call Center Agent Assist","value":"High","valueScore":78,"complexity":"High","complexityScore":80,"readiness":"Low","readinessScore":28,"evidenceBasis":"Identity gap","recommendation":"Certify first","nextAction":"Close identity gate","directional":false}]} chart {"type":"horizontal-bar","title":"Value","xKey":"initiative","yKey":"valueScore","data":[{"initiative":"Clinical Doc","valueScore":82},{"initiative":"Call Center","valueScore":78}]} `',
          "Sequence clinical documentation before call center deployment.",
          '`followups ["What proof is missing?"] ``',
        ].join("\n"),
      });

      expect(exhibits.prose).toContain("Recommendation first.");
      expect(exhibits.prose).toContain(
        "Sequence clinical documentation before call center deployment.",
      );
      expect(exhibits.prose).not.toContain("decision-table");
      expect(exhibits.prose).not.toContain('"records"');
      expect(exhibits.prose).not.toContain('"type":"horizontal-bar"');
      expect(exhibits.prose).not.toContain("followups");
      expect(exhibits.tables[0]?.rows).toHaveLength(2);
      expect(exhibits.charts.map((chart) => chart.kind)).toContain(
        "quadrant-matrix",
      );
    });
  });

  describe("contextual follow-up questions fence", () => {
    it("extracts a governed ```followups fence into typed follow-up strings and strips it from prose", () => {
      const exhibits = buildStructuredExhibits({
        routing,
        sources,
        prose: [
          "Payment integrity has the biggest recoverable dollar pool.",
          "",
          "```followups",
          '["Should we pilot this with one business unit first?", "What would closing the readiness gap cost?"]',
          "```",
        ].join("\n"),
      });

      expect(exhibits.followups).toEqual([
        "Should we pilot this with one business unit first?",
        "What would closing the readiness gap cost?",
      ]);
      expect(exhibits.prose).toContain(
        "Payment integrity has the biggest recoverable dollar pool.",
      );
      expect(exhibits.prose).not.toContain("followups");
    });

    it("caps follow-ups at 3 and ignores non-string entries", () => {
      const exhibits = buildStructuredExhibits({
        routing,
        sources,
        prose: [
          "Answer body.",
          "```followups",
          '["Q1", "Q2", 42, "Q3", "Q4"]',
          "```",
        ].join("\n"),
      });

      expect(exhibits.followups).toEqual(["Q1", "Q2", "Q3"]);
    });

    it("returns an empty array when no followups fence is present", () => {
      const exhibits = buildStructuredExhibits({
        routing,
        sources,
        prose: "Answer body with no fence.",
      });

      expect(exhibits.followups).toEqual([]);
    });

    it("ignores a malformed followups fence without throwing", () => {
      const exhibits = buildStructuredExhibits({
        routing,
        sources,
        prose: ["Answer body.", "```followups", "not valid json", "```"].join(
          "\n",
        ),
      });

      expect(exhibits.followups).toEqual([]);
      expect(exhibits.prose).toContain("Answer body.");
    });
  });
});
