/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import type {
  HomeRecordRenderSource,
  HomeReviewBundle,
  Signal,
  TechRecordType,
} from "@/lib/home/preview/types";
import { LeadershipCanvas, OperatingCanvas } from "../ContextViews";

const source: HomeRecordRenderSource = {
  kind: "reviewed_snapshot",
  canonicalSnapshotHash: "reference-record-version",
};

function bundle(): HomeReviewBundle {
  const tenantKey = CANONICAL_TENANT_KEYS[0];
  if (!tenantKey)
    throw new Error("A canonical tenant key is required for this fixture.");
  return {
    tenantKey,
    declaredSyntheticDemo: true,
    provenance: {
      home_synthesis_contract_version: "unit-fixture",
      thesis_prompt_version: "unit-fixture",
      chapter_prompt_version: "unit-fixture",
      model: "unit-fixture",
      signal_packet_version: "unit-fixture",
      canonical_snapshot_hash: source.canonicalSnapshotHash,
      verification_version: "unit-fixture",
      generated_at: "2026-01-01T00:00:00Z",
      generation_commit_sha: null,
      generation_image_digest: null,
    },
    chapters: [],
    technologyEstate: { recordTypes: [] },
    thesis: {
      signalPacket: {
        enterpriseIdentity: {
          businessModel: null,
          industry: null,
          revenue: null,
          employeeCount: null,
        },
        businessEconomics: {
          operatingSegments: [],
          customerSegments: [],
          technologyBudget: null,
          technologyBudgetShareOfRevenue: null,
        },
        strategicPriorities: [],
        contextItems: [],
        signals: [],
        visualDatasets: {},
        sourceSummaries: [],
        analyticalLenses: [],
        coverageManifest: {
          dimensionCoverage: [],
          leadershipToPortfolioLinkage: {
            resolvableRows: 0,
            totalRows: 0,
            coveragePct: 0,
            linkedPrograms: 0,
            interpretation: "Linkage not established.",
          },
          vendorDocumentEvidence: {
            contractsWithExtraction: 0,
            totalContracts: 0,
            interpretation: "Document evidence not supplied.",
          },
          metricComparability: {
            comparable: 0,
            total: 0,
            inconsistentNotation: 0,
            interpretation: "Comparability not established.",
          },
          prohibitedComparisons: [],
        },
      },
      publishedGeneration: {
        enterprise_story: "",
        enterprise_story_claims: [],
        value_creation_model: {
          summary: "",
          primary_value_drivers: [],
          economic_dependencies: [],
        },
        strategic_bets: [],
        structural_constraints: [],
        operating_tensions: [],
        leadership_consensus: [],
        leadership_disagreements: [],
        performance_story: {
          where_improving: [],
          where_off_track: [],
          where_unknown: [],
        },
        technology_and_data_implications: [],
        material_risks: [],
        value_realization_tensions: [],
        what_needs_attention: [],
        evidence_gaps: [],
        things_a_new_cxo_should_know: [],
        questions_for_management: [],
        visual_opportunities: [],
      },
      verificationLedger: [],
      structuralIssues: [],
    },
  };
}

function family(
  objectType: TechRecordType["objectType"],
  rows: TechRecordType["rows"],
  rowSourceRefs: string[][] = [],
): TechRecordType {
  return {
    objectType,
    label: "Reference records",
    rows,
    columns: [],
    primaryDimension: null,
    dimensionCounts: [],
    rowSourceRefs,
  };
}

function excerpt(
  id: string,
  text: string,
  role = "Operations lead",
  theme = "data trust",
): Signal {
  return {
    id,
    kind: "testimony",
    statement: `A ${role} said, on the theme of "${theme}": "${text}"`,
    domains: ["executive_interview"],
    evidenceRefs: [`reference-${id}`],
  };
}

function interview(
  response: string,
  extra: TechRecordType["rows"][number] = {},
) {
  return {
    response,
    stakeholderRole: "Operations lead",
    executiveArea: "Operations",
    priorityTheme: "data trust",
    responseBasis: "modelled - not a transcript",
    ...extra,
  };
}

function metric(label: string) {
  return screen.getByText(label).parentElement!;
}

describe("Leadership Overview evidence quality", () => {
  it("combines repeated compiled wording while retaining every signal reference and original text", () => {
    const record = bundle();
    const inspect = jest.fn();
    const wording = "  Review the reporting handoff before a decision.  ";
    record.thesis.signalPacket.signals = [
      excerpt("sig-first", wording),
      excerpt("sig-repeat", "Review the reporting handoff before a decision."),
      excerpt("sig-third", "Check the delivery scope.", "Delivery lead"),
      excerpt("sig-fourth", "Confirm the control evidence.", "Control lead"),
    ];
    const originalSignals = JSON.stringify(record.thesis.signalPacket.signals);
    const { container } = render(
      <LeadershipCanvas bundle={record} source={source} inspect={inspect} />,
    );

    expect(container.querySelectorAll("blockquote")).toHaveLength(3);
    expect(container.querySelector("blockquote")?.textContent).toBe(wording);
    expect(
      within(metric("Supplied excerpts")).getByText("4"),
    ).toBeInTheDocument();
    expect(screen.getByText(/3 distinct excerpts/)).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Read & verify excerpt" })[0],
    );
    expect(inspect).toHaveBeenLastCalledWith(
      expect.objectContaining({
        text: wording,
        evidenceIds: ["sig-first", "sig-repeat"],
        basis: expect.stringContaining(
          "synthetic reference, not client testimony",
        ),
      }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "All 4 supplied excerpts" }),
    );
    const detail = inspect.mock.calls.at(-1)![0];
    expect(detail.evidenceIds).toEqual([
      "sig-first",
      "sig-repeat",
      "sig-third",
      "sig-fourth",
    ]);
    expect(detail.text.match(/Review the reporting handoff/g)).toHaveLength(1);
    expect(detail.basis).toContain("Reviewed stored record on screen");
    expect(detail.basis).toContain("not client-attested testimony");
    expect(JSON.stringify(record.thesis.signalPacket.signals)).toBe(
      originalSignals,
    );
  });

  it("retains source-row references, every theme membership and the local modelled/synthetic basis", () => {
    const record = bundle();
    const inspect = jest.fn();
    const wording = "The handoff needs review.";
    record.technologyEstate!.recordTypes = [
      family(
        "executive_interview",
        [
          interview(wording),
          interview(wording, { priorityTheme: "delivery scope" }),
        ],
        [
          ["row-first", "shared-ref"],
          ["row-second", "shared-ref"],
        ],
      ),
    ];
    const originalRows = JSON.stringify(
      record.technologyEstate!.recordTypes[0],
    );
    const { container } = render(
      <LeadershipCanvas bundle={record} source={source} inspect={inspect} />,
    );

    expect(container.querySelectorAll("blockquote")).toHaveLength(1);
    expect(
      screen.getByText("Illustrative role: Operations lead"),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "All 2 supplied excerpts" }),
    );
    expect(inspect.mock.calls.at(-1)![0].sourceRefs).toEqual([
      "row-first",
      "shared-ref",
      "row-second",
    ]);
    for (const theme of ["data trust", "delivery scope"]) {
      fireEvent.change(screen.getByLabelText("Leadership theme"), {
        target: { value: theme },
      });
      expect(container.querySelector("blockquote")?.textContent).toBe(wording);
      fireEvent.click(
        screen.getByRole("button", { name: "Read & verify excerpt" }),
      );
      const detail = inspect.mock.calls.at(-1)![0];
      expect(detail.sourceRefs).toEqual([
        "row-first",
        "shared-ref",
        "row-second",
      ]);
      expect(detail.title).toContain("data trust");
      expect(detail.title).toContain("delivery scope");
      expect(detail.basis).toContain("Modelled response - not a transcript");
      expect(detail.basis).toContain(
        "synthetic reference, not client testimony",
      );
    }
    expect(JSON.stringify(record.technologyEstate!.recordTypes[0])).toBe(
      originalRows,
    );
  });

  it("keeps matching wording from different roles and different response bases separate", () => {
    const record = bundle();
    record.declaredSyntheticDemo = false;
    record.technologyEstate!.recordTypes = [
      family("executive_interview", [
        interview("Review this handoff."),
        interview("Review this handoff.", { stakeholderRole: "Delivery lead" }),
        interview("Review this handoff.", { responseBasis: "attributed" }),
      ]),
    ];
    const inspect = jest.fn();
    const { container } = render(
      <LeadershipCanvas bundle={record} source={source} inspect={inspect} />,
    );

    expect(container.querySelectorAll("blockquote")).toHaveLength(3);
    expect(
      screen.getByText(
        "Attributed response; transcript verification not supplied",
      ),
    ).toBeInTheDocument();
    const attributed = screen
      .getByText(/Attributed response;/)
      .closest("article")!;
    fireEvent.click(within(attributed).getByRole("button"));
    expect(inspect.mock.calls.at(-1)![0].basis).toContain(
      "transcript verification not supplied",
    );
    expect(screen.queryByText(/Illustrative role/)).not.toBeInTheDocument();
  });

  it("keeps minority ordering and recorded theme counts independent of quote repetition", () => {
    const record = bundle();
    const inspect = jest.fn();
    record.thesis.signalPacket.visualDatasets.leadership_theme_frequency = [
      { theme: "data trust", leaderCount: 8 },
      { theme: "delivery scope", leaderCount: 1 },
    ];
    record.thesis.signalPacket.signals = [
      excerpt("sig-first", "Review the handoff."),
      excerpt("sig-repeat", "Review the handoff."),
    ];
    const { container } = render(
      <LeadershipCanvas bundle={record} source={source} inspect={inspect} />,
    );

    fireEvent.change(screen.getByLabelText("Theme order"), {
      target: { value: "minority" },
    });
    expect(container.querySelector("[aria-pressed] strong")).toHaveTextContent(
      "1",
    );
    expect(
      within(metric("Widest theme reach")).getByText("8"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Minority attention does not establish disagreement/),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Leadership theme"), {
      target: { value: "delivery scope" },
    });
    expect(container.querySelectorAll("blockquote")).toHaveLength(0);
    expect(
      screen.getByText(/Theme breadth does not provide the missing wording/),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "All 2 themes & basis" }),
    );
    expect(inspect.mock.calls.at(-1)![0].basis).toContain(
      "not client-attested testimony",
    );
  });

  it("preserves unknown response and theme breadth rather than manufacturing zero or testimony", () => {
    const record = bundle();
    record.technologyEstate!.recordTypes = [
      family("executive_interview", [
        interview("An illustrative response.", {
          executiveArea: null,
          responseBasis: null,
          stakeholderRole: null,
        }),
      ]),
    ];
    const inspect = jest.fn();
    render(
      <LeadershipCanvas bundle={record} source={source} inspect={inspect} />,
    );

    expect(
      screen.getByText(
        "Response basis not supplied - synthetic reference, not client testimony",
      ),
    ).toBeInTheDocument();
    expect(
      within(metric("Widest theme reach")).getByText("Not supplied"),
    ).toBeInTheDocument();
    expect(
      within(metric("Roles in supplied excerpts")).getByText("Not supplied"),
    ).toHaveAttribute("data-unknown", "true");
    fireEvent.click(
      screen.getByRole("button", { name: "All 1 themes & basis" }),
    );
    expect(inspect.mock.calls.at(-1)![0].text).toContain(
      "Breadth not supplied",
    );
    expect(inspect.mock.calls.at(-1)![0].text).not.toContain(
      "0 executive areas",
    );
  });

  it("retains an explicitly recorded zero theme count rather than treating it as missing breadth", () => {
    const record = bundle();
    record.thesis.signalPacket.visualDatasets.leadership_theme_frequency = [
      { theme: "delivery scope", leaderCount: 0 },
    ];
    const inspect = jest.fn();
    render(
      <LeadershipCanvas bundle={record} source={source} inspect={inspect} />,
    );
    expect(within(metric("Widest theme reach")).getByText("0")).toHaveAttribute(
      "data-unknown",
      "false",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "All 1 themes & basis" }),
    );
    expect(inspect.mock.calls.at(-1)![0].text).toContain("0 leaders");
  });

  it("keeps absent excerpts and themes unknown, and withholds unaligned compiled excerpts", () => {
    const record = bundle();
    const { container, rerender } = render(
      <LeadershipCanvas bundle={record} source={source} inspect={jest.fn()} />,
    );
    for (const label of [
      "Recorded themes",
      "Supplied excerpts",
      "Roles in supplied excerpts",
      "Widest theme reach",
    ]) {
      expect(
        within(metric(label)).getByText("Not supplied"),
      ).toBeInTheDocument();
    }
    expect(screen.queryByText(/0 distinct excerpts/)).not.toBeInTheDocument();
    record.thesis.signalPacket.signals = [
      excerpt("sig-old", "Earlier wording."),
    ];
    const served: HomeRecordRenderSource = {
      ...source,
      kind: "ecl_serving_projection",
    };
    rerender(
      <LeadershipCanvas bundle={record} source={served} inspect={jest.fn()} />,
    );
    expect(container.querySelectorAll("blockquote")).toHaveLength(0);
    expect(
      screen.getAllByText(/Live governed rows on screen/)[0],
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Earlier excerpts are not current testimony/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Earlier wording.")).not.toBeInTheDocument();
  });
});

describe("Operating Overview purpose and evidence quality", () => {
  it("keeps all declared functions inspectable and resets pagination when the segment changes", () => {
    const record = bundle();
    const inspect = jest.fn();
    record.technologyEstate!.recordTypes = [
      family("business_segment", [
        { segmentKey: "SEG-01", segmentName: "Service Segment" },
        { segmentKey: "SEG-02", segmentName: "Support Segment" },
      ]),
      family(
        "business_function",
        [
          ...[1, 2, 3, 4].map((index) => ({
            functionName: `Service function ${index}`,
            businessSegmentKey: "SEG-01",
            businessCapabilities: `Service capability ${index}`,
          })),
          { functionName: "Support function", businessSegmentKey: "SEG-02" },
        ],
        [
          ["function-1"],
          ["function-2"],
          ["function-3"],
          ["function-4"],
          ["support-function"],
        ],
      ),
    ];
    const { container } = render(
      <OperatingCanvas bundle={record} source={source} inspect={inspect} />,
    );
    expect(
      container.querySelectorAll("[data-segment-functions] li"),
    ).toHaveLength(3);
    expect(screen.getByText("Functions 1-3 of 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next function page" }));
    expect(screen.getByText("Functions 4-4 of 4")).toBeInTheDocument();
    expect(screen.getByText("Service capability 4")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next function page" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Function evidence" }));
    expect(inspect.mock.calls.at(-1)![0].sourceRefs).toEqual(["function-4"]);
    expect(inspect.mock.calls.at(-1)![0].text).toContain(
      "Declared annual budget: Not supplied",
    );
    fireEvent.change(screen.getByLabelText("Operating segment"), {
      target: { value: "SEG-02" },
    });
    expect(screen.getByText("Support function")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Operating segment"), {
      target: { value: "SEG-01" },
    });
    expect(screen.getByText("Functions 1-3 of 4")).toBeInTheDocument();
    expect(screen.getByText("Service capability 1")).toBeInTheDocument();
    expect(screen.queryByText("Service capability 4")).not.toBeInTheDocument();
  });
  it("leads with supplied process context and keeps application roles separate from unknown segment accountability", () => {
    const record = bundle();
    const inspect = jest.fn();
    record.thesis.signalPacket.businessEconomics!.operatingSegments = [
      "Service Segment",
    ];
    record.thesis.signalPacket.signals = [
      {
        id: "sig-process",
        kind: "operational",
        statement: "The approval handoff has a recorded control gap.",
        domains: ["operational_process"],
        evidenceRefs: ["reference-process"],
      },
    ];
    record.technologyEstate!.recordTypes = [
      family(
        "application_system",
        [
          {
            applicationName: "Service Register",
            businessFunction: "Service Operations",
            businessOwner: "System business owner",
            technologyOwner: "System technology owner",
          },
        ],
        [["application-row-ref"]],
      ),
    ];
    const { container } = render(
      <OperatingCanvas bundle={record} source={source} inspect={inspect} />,
    );
    const section = screen
      .getByRole("heading", { name: "Declared operating structure" })
      .closest("section")!;
    expect(section.querySelectorAll("dd")).toHaveLength(3);
    expect(
      [...section.querySelectorAll("dd")].map((item) => item.textContent),
    ).toEqual(["Not supplied", "Not supplied", "Not supplied"]);
    expect(
      within(section).queryByText("System business owner"),
    ).not.toBeInTheDocument();
    expect(container.querySelector("[data-segment-functions]")).toBeNull();
    expect(
      screen.queryByRole("heading", {
        name: "How the enterprise is organized",
      }),
    ).not.toBeInTheDocument();
    const process = screen.getByText(
      record.thesis.signalPacket.signals[0].statement,
    );
    const details = container.querySelector("details")!;
    expect(process.closest("details")).toBeNull();
    expect(details).not.toHaveAttribute("open");
    expect(
      process.compareDocumentPosition(details) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Context basis" }));
    expect(inspect).toHaveBeenLastCalledWith(
      expect.objectContaining({
        evidenceIds: ["sig-process"],
        basis: expect.stringContaining(
          "Compiled workforce/process context, not inspectable process rows",
        ),
      }),
    );
    expect(inspect.mock.calls.at(-1)![0].basis).toContain(
      "Synthetic reference",
    );
    fireEvent.click(screen.getByRole("button", { name: "Segment evidence" }));
    const segmentDetail = inspect.mock.calls.at(-1)![0];
    expect(segmentDetail.text).toContain("P&L owner: Not supplied");
    expect(segmentDetail.text).toContain("Governance: Not supplied");
    expect(segmentDetail.text).toContain(
      "Function-to-segment links: Not supplied",
    );
    details.open = true;
    fireEvent.click(
      screen.getByRole("button", { name: "Application accountability basis" }),
    );
    expect(inspect).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sourceRefs: ["application-row-ref"],
        basis: expect.stringContaining(
          "Not segment attribution, P&L ownership or an organization hierarchy",
        ),
      }),
    );
  });

  it("uses supplied organization facts without bringing off-question system or strategy context into the process section", () => {
    const record = bundle();
    const inspect = jest.fn();
    record.thesis.signalPacket.contextItems = [
      {
        id: "ctx-operating",
        domains: ["organization_ownership"],
        statement:
          "Service review accountability is recorded at function level.",
      },
      {
        id: "ctx-system",
        domains: ["application_system"],
        statement: "System deployment topology.",
      },
      {
        id: "ctx-strategy",
        domains: ["program_initiative"],
        statement: "Investment portfolio summary.",
      },
    ];
    render(
      <OperatingCanvas bundle={record} source={source} inspect={inspect} />,
    );

    expect(
      screen.getByText(record.thesis.signalPacket.contextItems[0].statement),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("System deployment topology."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Investment portfolio summary."),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Context basis" }));
    expect(inspect.mock.calls.at(-1)![0].evidenceIds).toEqual([
      "ctx-operating",
    ]);
  });

  it("retains every compiled process reference in the all-context inspection", () => {
    const record = bundle();
    record.thesis.signalPacket.signals = [1, 2, 3, 4].map((index) => ({
      id: `sig-process-${index}`,
      kind: "operational",
      statement: `Recorded handoff context ${index}.`,
      domains: ["operational_process"],
      evidenceRefs: [`process-ref-${index}`],
    }));
    const inspect = jest.fn();
    render(
      <OperatingCanvas bundle={record} source={source} inspect={inspect} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "All 4 workforce & process signals" }),
    );
    const detail = inspect.mock.calls.at(-1)![0];
    expect(detail.evidenceIds).toEqual(
      record.thesis.signalPacket.signals.map((item) => item.id),
    );
    for (const item of record.thesis.signalPacket.signals)
      expect(detail.text).toContain(item.statement);
    expect(detail.basis).toContain(
      "No segment assignment without declared links",
    );
  });

  it("uses declared segment keys, preserves supplied detail and reports gaps for the selected segment", () => {
    const record = bundle();
    const inspect = jest.fn();
    record.technologyEstate!.recordTypes = [
      family(
        "business_segment",
        [
          {
            segmentKey: "SEG-01",
            segmentName: "Service Segment",
            pnlOwnerRole: "Segment owner",
            governanceCouncil: "Service review forum",
            segmentNotes: "Supplied delivery responsibilities.",
          },
          { segmentKey: "SEG-02", segmentName: "Support Segment" },
        ],
        [["segment-source-1"], ["segment-source-2"]],
      ),
      family(
        "business_function",
        [
          {
            functionName: "Service delivery",
            businessSegmentKey: "SEG-01",
            executiveOwner: "Function owner",
            businessCapabilities: "Service coordination",
            fteCount: 0,
            annualBudgetUsd: 0,
          },
          {
            functionName: "Support Segment",
            businessSegmentKey: null,
            executiveOwner: "Unlinked owner",
          },
        ],
        [["function-source-1"], ["function-source-2"]],
      ),
    ];
    const { container } = render(
      <OperatingCanvas bundle={record} source={source} inspect={inspect} />,
    );

    expect(screen.getByText("Segment owner")).toBeInTheDocument();
    expect(screen.getByText("Service review forum")).toBeInTheDocument();
    expect(
      screen.getByText("Supplied delivery responsibilities."),
    ).toBeInTheDocument();
    expect(screen.getByText("Service coordination")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Function evidence" }));
    expect(inspect.mock.calls.at(-1)![0].sourceRefs).toEqual([
      "function-source-1",
    ]);
    expect(inspect.mock.calls.at(-1)![0].text).toContain("FTE: 0");
    expect(inspect.mock.calls.at(-1)![0].text).toContain(
      "Declared annual budget: 0",
    );

    fireEvent.change(screen.getByLabelText("Operating segment"), {
      target: { value: "SEG-02" },
    });
    expect(container.querySelector("[data-segment-functions]")).toBeNull();
    expect(screen.queryByText("Unlinked owner")).not.toBeInTheDocument();
    expect(
      screen.getByText(/1 supplied function rows have no link/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Segment evidence" }));
    const detail = inspect.mock.calls.at(-1)![0];
    expect(detail.sourceRefs).toEqual(["segment-source-2"]);
    expect(detail.basis).toContain(
      "No function-to-segment links supplied for this segment",
    );
    expect(detail.basis).not.toContain("source-linked functions");
    expect(detail.text).toContain("P&L owner: Not supplied");
  });

  it("keeps missing operating context unknown and withholds compiled summaries from an unaligned served record", () => {
    const record = bundle();
    const { rerender } = render(
      <OperatingCanvas bundle={record} source={source} inspect={jest.fn()} />,
    );
    for (const label of [
      "Declared operating segments",
      "Segment-linked functions",
      "Segments with operating detail",
      "Workforce & process signals",
    ]) {
      expect(
        within(metric(label)).getByText("Not supplied"),
      ).toBeInTheDocument();
    }
    expect(
      screen.queryByLabelText("Operating segment"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Aligned workforce\/process context is not supplied/),
    ).toBeInTheDocument();
    record.thesis.signalPacket.businessEconomics!.operatingSegments = [
      "Earlier segment",
    ];
    record.thesis.signalPacket.signals = [
      {
        id: "sig-old",
        kind: "workforce",
        statement: "Earlier workforce summary.",
        domains: ["workforce_role"],
        evidenceRefs: [],
      },
    ];
    const served: HomeRecordRenderSource = {
      ...source,
      kind: "ecl_serving_projection",
    };
    rerender(
      <OperatingCanvas bundle={record} source={served} inspect={jest.fn()} />,
    );
    expect(screen.queryByText("Earlier segment")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Earlier workforce summary."),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/Live governed rows on screen/)[0],
    ).toBeInTheDocument();
  });
});
