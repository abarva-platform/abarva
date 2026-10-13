/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import fs from "node:fs";
import path from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import type {
  HomeReviewBundle,
  TechRecordType,
} from "@/lib/home/preview/types";
import {
  computeEvidenceCoverage,
  type ArchitectureView,
} from "@/lib/visual-system/architecture-view-contract";
import * as resolver from "@/lib/visual-system/resolveArchitectureView";
import { ArchitectureCanvas } from "../ArchitectureCanvas";
import { FlowRecordCanvas } from "../FlowRecordCanvas";
import { InspectionEvidence, type CanvasInspection } from "../ChapterCanvas";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

jest.mock("@/lib/visual-system/resolveArchitectureView", () => {
  const actual = jest.requireActual(
    "@/lib/visual-system/resolveArchitectureView",
  );
  return {
    ...actual,
    resolveArchitectureView: jest.fn(actual.resolveArchitectureView),
  };
});

const TENANT_KEY = CANONICAL_TENANT_KEYS[0];
const BASE_BUNDLE: HomeReviewBundle = JSON.parse(
  fs.readFileSync(
    path.join(
      process.cwd(),
      "src/lib/home/preview/golden-snapshots",
      `${TENANT_KEY}.json`,
    ),
    "utf8",
  ),
);

function family(
  objectType: TechRecordType["objectType"],
  rows: TechRecordType["rows"],
): TechRecordType {
  return {
    objectType,
    label: "Reference records",
    rows,
    columns: [],
    primaryDimension: null,
    dimensionCounts: [],
  };
}

function bundle(recordTypes: TechRecordType[]): HomeReviewBundle {
  return {
    ...BASE_BUNDLE,
    tenantKey: TENANT_KEY,
    declaredSyntheticDemo: true,
    technologyEstate: { recordTypes },
  };
}

function architecture(
  record: HomeReviewBundle,
  flow = false,
  inspect = jest.fn(),
) {
  return render(
    <ArchitectureCanvas
      bundle={record}
      tenantKey={TENANT_KEY}
      tenantName="Reference enterprise"
      flow={flow}
      recordsHref="/home?view=tech:data_asset_or_integration"
      inspect={inspect}
    />,
  );
}

function flowView(): ArchitectureView {
  const nodes: ArchitectureView["nodes"] = Array.from(
    { length: 25 },
    (_, i) => ({
      id: `node-${i}`,
      label: i === 0 ? "Reference hub" : `Reference endpoint ${i}`,
      semanticRole: "application",
      layer: "source_systems",
      evidenceBasis: "CANONICAL",
      evidenceIds: [`field-reference-${i}`],
    }),
  );
  nodes[0] = {
    ...nodes[0],
    evidenceBasis: "ABARVA_DERIVED",
    aggregation: {
      groupByField: "systemName",
      groupByValue: "Reference hub",
      memberCount: 2,
      memberNodeIds: ["environment-1", "environment-2"],
      basis: "CANONICAL_FIELD",
    },
  };
  const edges: ArchitectureView["edges"] = nodes.slice(1).flatMap((node, i) => [
    {
      id: `out-${i}`,
      from: "node-0",
      to: node.id,
      evidenceBasis: "CANONICAL",
      evidenceIds: [`flow-reference-${i}`],
      weight: i + 1,
    },
    {
      id: `in-${i}`,
      from: node.id,
      to: "node-0",
      evidenceBasis: "ABARVA_DERIVED",
      evidenceIds: [`flow-reference-${i}`],
      weight: i + 1,
    },
  ]);
  return {
    viewType: "integration_topology",
    audienceLevel: "L1_domain",
    layerScheme: "current_state_zones_v1",
    validationProfile: "enterprise_current_state",
    tenantKey: TENANT_KEY,
    title: "Reference movement map",
    primaryQuestion: "Where do recorded movements connect?",
    contextLine: "Original projection caption",
    nodes,
    edges,
    groups: [],
    boundaries: [],
    overlays: [],
    evidenceCoverage: computeEvidenceCoverage(nodes, edges, "reference-build"),
    limitations: ["Unclassified records remain unclassified."],
  };
}

afterEach(() => {
  jest
    .mocked(resolver.resolveArchitectureView)
    .mockImplementation(
      jest.requireActual("@/lib/visual-system/resolveArchitectureView")
        .resolveArchitectureView,
    );
});

describe("executive map quality", () => {
  it("bounds a dense function view and preserves the full existing map", () => {
    const record = bundle([
      family("application_system", [
        ...Array.from({ length: 30 }, (_, i) => ({
          systemName: `Reference application ${i}`,
          businessFunction: "Operations",
        })),
        { systemName: "Reference ledger", businessFunction: "Finance" },
      ]),
    ]);
    const before = JSON.stringify(record);
    const { container } = architecture(record);
    expect(screen.getByLabelText("Architecture business function")).toHaveValue(
      "Operations",
    );
    expect(container.querySelectorAll("[data-node-id]")).toHaveLength(12);
    expect(container.querySelectorAll("[data-edge-id]")).toHaveLength(11);
    expect(screen.getByText(/12 of 31 nodes/)).toBeInTheDocument();
    expect(
      screen.getByText(/do not establish canonical dependencies/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Full map" }));
    expect(container.querySelectorAll("[data-node-id]")).toHaveLength(31);
    expect(container.querySelectorAll("[data-edge-id]")).toHaveLength(30);
    fireEvent.change(screen.getByLabelText("Architecture business function"), {
      target: { value: "Finance" },
    });
    expect(container.querySelectorAll("[data-node-id]")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Full map" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    fireEvent.change(screen.getByLabelText("Architecture business function"), {
      target: { value: "" },
    });
    expect(container.querySelectorAll("[data-edge-id]")).toHaveLength(0);
    expect(JSON.stringify(record)).toBe(before);
  });

  it("bounds flow connections without adding edges or mutating the admitted projection", () => {
    const view = flowView();
    const before = JSON.stringify(view);
    jest
      .mocked(resolver.resolveArchitectureView)
      .mockReturnValue({ status: "ready", view });
    const { container } = architecture(bundle([]), true);
    expect(container.querySelectorAll("[data-node-id]")).toHaveLength(12);
    expect(container.querySelectorAll("[data-edge-id]")).toHaveLength(18);
    const recordedEdges = new Set(view.edges.map((edge) => edge.id));
    for (const edge of container.querySelectorAll("[data-edge-id]")) {
      expect(recordedEdges.has(edge.getAttribute("data-edge-id")!)).toBe(true);
    }
    expect(
      screen.getByText(/must not be summed as unique flows/),
    ).toBeInTheDocument();
    expect(screen.getByText(/business criticality/)).toBeInTheDocument();
    expect(
      container.querySelector('[data-node-id="node-0"]'),
    ).toHaveTextContent("2 environments");
    expect(
      container.querySelector('[data-node-id="node-0"]'),
    ).not.toHaveTextContent("2 systems");
    fireEvent.click(screen.getByRole("button", { name: "Full map" }));
    expect(container.querySelectorAll("[data-node-id]")).toHaveLength(25);
    expect(container.querySelectorAll("[data-edge-id]")).toHaveLength(48);
    fireEvent.change(screen.getByLabelText("Flow connection focus"), {
      target: { value: "node-1" },
    });
    expect(container.querySelectorAll("[data-node-id]")).toHaveLength(2);
    expect(container.querySelectorAll("[data-edge-id]")).toHaveLength(2);
    expect(JSON.stringify(view)).toBe(before);
  });

  it("preserves unknown costs and distinguishes a genuine recorded zero", () => {
    const record = bundle([
      family("application_system", [
        { systemName: "Reference A", annualCostUsd: null },
        { systemName: "Reference B", annualCostUsd: "" },
        { systemName: "Reference C", annualCostUsd: "Unknown" },
        { systemName: "Reference D", annualCostUsd: false },
      ]),
    ]);
    const { rerender } = architecture(record);
    expect(
      screen.getByText(/Unknown; no numeric cost supplied/),
    ).toBeInTheDocument();
    expect(screen.getByText(/4 records have unknown cost/)).toBeInTheDocument();
    record.technologyEstate!.recordTypes[0].rows[0].annualCostUsd = 0;
    rerender(
      <ArchitectureCanvas
        bundle={record}
        tenantKey={TENANT_KEY}
        tenantName="Reference"
        flow={false}
        recordsHref="#"
        inspect={jest.fn()}
      />,
    );
    expect(
      screen.getByText(
        /Recorded annual cost \(USD\/year\): 0 known subtotal across 1 of 4/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/3 records have unknown cost/)).toBeInTheDocument();
    expect(
      screen.getByText(/not verified spend or Finance approval/),
    ).toBeInTheDocument();
  });

  it("states the selected cost population without replacing partial coverage with a total", () => {
    architecture(
      bundle([
        family("application_system", [
          {
            systemName: "Reference A",
            businessFunction: "Operations",
            annualCostUsd: 1200,
          },
          {
            systemName: "Reference B",
            businessFunction: "Operations",
            annualCostUsd: "2500",
          },
          {
            systemName: "Reference C",
            businessFunction: "Operations",
            annualCostUsd: null,
          },
          {
            systemName: "Reference D",
            businessFunction: "Finance",
            annualCostUsd: 90000,
          },
        ]),
      ]),
    );
    expect(
      screen.getByText(
        /3,700 known subtotal across 2 of 3 application records/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 record has unknown cost/)).toBeInTheDocument();
  });

  it("keeps full labels and the original projection caption inspectable with honest references", () => {
    const longName =
      "Reference application with a deliberately long continuousrecordidentifierandbusinessdescription";
    const inspect = jest.fn();
    const { container } = architecture(
      bundle([
        family("application_system", [
          { systemName: longName, businessFunction: "Operations" },
        ]),
      ]),
      false,
      inspect,
    );
    const label = screen
      .getAllByRole("button", { name: longName, hidden: true })
      .at(-1)!;
    expect(label).toHaveStyle({
      overflowWrap: "anywhere",
      whiteSpace: "normal",
    });
    expect(container.querySelector("[data-node-id] title")).toHaveTextContent(
      "Operations",
    );
    fireEvent.click(label);
    expect(inspect).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: longName,
        evidenceIds: [],
        sourceRefs: [longName],
        text: expect.stringContaining("Projection caption as supplied:"),
        basis: expect.stringContaining("not proof of inspected source rows"),
      }),
    );
    const node = container.querySelector(`[aria-label="${longName}"]`)!;
    expect(node.querySelector("text")!.textContent).not.toContain("\u2026");
    expect(
      node.querySelector("text")!.textContent!.replace(/-/g, ""),
    ).toContain("continuousrecordidentifierandbusinessdescription");
    fireEvent.keyDown(node, { key: "Enter" });
    expect(inspect.mock.calls.at(-1)![0].title).toBe(longName);
    const frame = container.querySelector("[data-map-frame]")!;
    expect(frame).toHaveAttribute("tabindex", "0");
    expect(frame).toHaveStyle({
      maxHeight: "min(65vh, 680px)",
      maxWidth: "100%",
    });
    fireEvent.change(screen.getByLabelText("Diagram zoom"), {
      target: { value: "160" },
    });
    expect(screen.getByLabelText("Diagram zoom")).toHaveValue("160");
    fireEvent.click(screen.getByRole("button", { name: "Reset diagram zoom" }));
    expect(screen.getByLabelText("Diagram zoom")).toHaveValue("100");
  });

  it("keeps a missing architecture family unknown", () => {
    const { container } = architecture(bundle([]));
    expect(
      screen.getByText("Architecture view is not supported"),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("[data-node-id]")).toHaveLength(0);
    expect(screen.queryByText(/0 known subtotal/)).not.toBeInTheDocument();
  });

  it("keeps supplied projection references visible through the actual inspection drawer", () => {
    const name = "Reference application, Inc.";
    const record = bundle([
      family("application_system", [
        { systemName: name, businessFunction: "Operations" },
      ]),
    ]);
    const inspect = jest.fn<void, [CanvasInspection]>();
    const { container } = architecture(record, false, inspect);
    fireEvent.click(
      container.querySelector(`[data-node-id][aria-label="${name}"]`)!,
    );
    const detail = inspect.mock.calls.at(-1)![0];
    const drawer = render(
      <InspectionEvidence detail={detail} bundle={record} />,
    );
    expect(
      within(drawer.container).getByText(name, { selector: "li" }),
    ).toBeInTheDocument();
    expect(
      within(drawer.container).queryByText("Source mapping needed"),
    ).not.toBeInTheDocument();
    expect(drawer.container.querySelectorAll("a")).toHaveLength(0);
    expect(detail.sourceRefs).toEqual([name]);
    expect(detail.evidenceIds).toEqual([]);
    expect(detail.basis).toContain(record.provenance.canonical_snapshot_hash);
    expect(detail.sourceRefs).not.toContain(
      record.provenance.canonical_snapshot_hash,
    );
  });

  it("preserves real packet IDs separately from names and field references", () => {
    const record = bundle([]);
    record.thesis = {
      ...record.thesis,
      signalPacket: {
        ...record.thesis.signalPacket,
        signals: [
          {
            ...record.thesis.signalPacket.signals[0],
            id: "sig_map_reference",
            statement: "Recorded support reference.",
            evidenceRefs: ["reference-row-1"],
          },
        ],
        contextItems: [
          {
            ...record.thesis.signalPacket.contextItems[0],
            id: "ctx_map_reference",
            statement: "Declared application context.",
            evidenceRefs: ["reference-context-row"],
          },
        ],
      },
    };
    const view = flowView();
    view.nodes[0].evidenceIds = [
      "sig_map_reference",
      "ctx_map_reference",
      "Reference application, Inc.",
      "application_system.business_function=Operations",
    ];
    jest
      .mocked(resolver.resolveArchitectureView)
      .mockReturnValue({ status: "ready", view });
    const inspect = jest.fn<void, [CanvasInspection]>();
    const { container } = architecture(record, true, inspect);
    fireEvent.click(container.querySelector('[data-node-id="node-0"]')!);
    const detail = inspect.mock.calls.at(-1)![0];
    expect(detail.evidenceIds).toEqual([
      "sig_map_reference",
      "ctx_map_reference",
    ]);
    expect(detail.sourceRefs).toEqual([
      "Reference application, Inc.",
      "application_system.business_function=Operations",
    ]);
    const drawer = render(
      <InspectionEvidence detail={detail} bundle={record} />,
    );
    expect(
      within(drawer.container).getByText("Recorded support reference."),
    ).toBeInTheDocument();
    expect(
      within(drawer.container).getByText("Declared application context."),
    ).toBeInTheDocument();
    expect(
      within(drawer.container).getByText("Reference application, Inc.", {
        selector: "li",
      }),
    ).toBeInTheDocument();
    expect(
      within(drawer.container).getByText(
        "application_system.business_function=Operations",
        { selector: "li" },
      ),
    ).toBeInTheDocument();
    expect(
      within(drawer.container).queryByText("Source mapping needed"),
    ).not.toBeInTheDocument();
  });

  it.each([
    { width: 390, flow: false },
    { width: 1440, flow: false },
    { width: 390, flow: true },
    { width: 1440, flow: true },
  ])(
    "fits node centers within a $width px frame at default zoom (flow=$flow)",
    ({ width, flow }) => {
      const record = flow
        ? bundle(BASE_BUNDLE.technologyEstate!.recordTypes)
        : bundle([
            family("application_system", [
              {
                systemName: "Reference application",
                businessFunction: "Operations",
              },
            ]),
          ]);
      const { container } = architecture(record, flow);
      const frame = container.querySelector<HTMLElement>("[data-map-frame]")!;
      const wrapper = frame.firstElementChild as HTMLElement;
      const svg = wrapper.querySelector("svg")!;
      expect(wrapper).toHaveStyle({ width: "100%", minWidth: "0" });
      expect(svg).toHaveStyle({ width: "100%", minWidth: "0" });
      const viewBoxWidth = Number(svg.getAttribute("viewBox")!.split(/\s+/)[2]);
      expect(svg.querySelectorAll("[data-node-id]").length).toBeGreaterThan(0);
      for (const node of svg.querySelectorAll("[data-node-id]")) {
        const rect = node.querySelector("rect")!;
        const center =
          ((Number(rect.getAttribute("x")) +
            Number(rect.getAttribute("width")) / 2) *
            width) /
          viewBoxWidth;
        expect(center).toBeGreaterThan(0);
        expect(center).toBeLessThan(width);
      }
      fireEvent.change(screen.getByLabelText("Diagram zoom"), {
        target: { value: "160" },
      });
      expect(wrapper).toHaveStyle({ width: "160%" });
      if (flow) {
        fireEvent.click(
          screen.getByRole("button", { name: "Recorded movements" }),
        );
        expect(
          container.querySelectorAll("[data-recorded-flow-pair]"),
        ).toHaveLength(6);
      }
    },
  );
});

describe("recorded flow coverage", () => {
  function rows(): TechRecordType["rows"] {
    return Array.from({ length: 8 }, (_, i) => ({
      sourceSystem: `Reference origin ${i}`,
      targetSystem: `Reference destination ${i}`,
      currentStateOrTargetState: "current_state",
      integrationType: i === 0 ? "" : "Recorded API",
      platformOrDatabase: null,
      rowCount: 0,
    }));
  }

  it("pages six actual combinations, filters origins, and preserves unknown source fields", () => {
    const inspect = jest.fn();
    const record = bundle([
      family("data_asset_or_integration", [
        ...rows(),
        {
          sourceSystem: "Unstated origin",
          targetSystem: "Unstated destination",
        },
        { sourceSystem: "Incomplete origin", targetSystem: null },
        {
          sourceSystem: "Target origin",
          targetSystem: "Target destination",
          currentStateOrTargetState: "target_state",
        },
        {
          sourceSystem: "Workload origin",
          targetSystem: "Workload destination",
          recordKind: "data_analytics_workload",
        },
      ]),
    ]);
    const { container, rerender } = render(
      <FlowRecordCanvas bundle={record} recordsHref="#" inspect={inspect} />,
    );
    expect(
      container.querySelectorAll("[data-recorded-flow-pair]"),
    ).toHaveLength(6);
    expect(
      screen.getByText(/Showing combinations 1-6 of 9/),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 without a declared state/)).toBeInTheDocument();
    expect(
      screen.getByText("Mechanism not supplied", { exact: false }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Source records" })[0],
    );
    expect(inspect.mock.calls.at(-1)![0].text).toContain(
      "integrationType: Not supplied",
    );
    expect(inspect.mock.calls.at(-1)![0].text).toContain("rowCount: 0");
    expect(inspect.mock.calls.at(-1)![0].basis).toContain(
      "No inspectable source links supplied",
    );
    fireEvent.click(screen.getByRole("button", { name: "Next flow page" }));
    expect(
      container.querySelectorAll("[data-recorded-flow-pair]"),
    ).toHaveLength(3);
    expect(
      screen.getByText(/Showing combinations 7-9 of 9/),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Flow origin"), {
      target: { value: "Reference origin 0" },
    });
    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
    expect(
      container.querySelectorAll("[data-recorded-flow-pair]"),
    ).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Next flow page" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Flow origin"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next flow page" }));
    rerender(
      <FlowRecordCanvas
        bundle={bundle([
          family("data_asset_or_integration", rows().slice(0, 1)),
        ])}
        recordsHref="#"
        inspect={inspect}
      />,
    );
    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
    expect(
      container.querySelectorAll("[data-recorded-flow-pair]"),
    ).toHaveLength(1);
  });

  it("retains the evidence gate while showing populated recorded movements", () => {
    const record = bundle([family("data_asset_or_integration", rows())]);
    const { container } = architecture(record, true);
    expect(container.querySelectorAll("[data-node-id]")).toHaveLength(0);
    expect(
      container.querySelectorAll("[data-recorded-flow-pair]"),
    ).toHaveLength(6);
    expect(screen.getByText(/full diagram is withheld/)).toBeInTheDocument();
    expect(
      screen.getByText(/not proof of an ordered intermediate hop/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/blank/i)).not.toBeInTheDocument();
  });

  it("does not manufacture zero movement when the family is absent", () => {
    render(
      <FlowRecordCanvas
        bundle={bundle([])}
        recordsHref="#"
        inspect={jest.fn()}
      />,
    );
    expect(
      screen.getByText("Data-flow detail is not supplied in this bundle"),
    ).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Flow origin")).not.toBeInTheDocument();
  });

  it("does not label undeclared data synthetic or claim serving proof", () => {
    const record = bundle([family("data_asset_or_integration", rows())]);
    delete record.declaredSyntheticDemo;
    render(
      <FlowRecordCanvas bundle={record} recordsHref="#" inspect={jest.fn()} />,
    );
    expect(
      screen.getByText(
        /Stored review bundle; live serving state is not established here/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Data as of: not established/)).toBeInTheDocument();
    expect(screen.queryByText(/Synthetic reference/)).not.toBeInTheDocument();
  });

  it("distinguishes serving lineage from verified serving state and an established data date", () => {
    const record = bundle([family("data_asset_or_integration", rows())]);
    record.contextVersion = {
      assessmentId: "reference-assessment",
      projectionContentHash: "reference-projection",
      sourceLineageHash: "reference-source-lineage",
      sourceSetHash: null,
      sourceCoverage: { totalRecordRows: 8, linkedRecordRows: 0, families: [] },
      deterministicPacketHash: "reference-packet",
      narrativePacketHash: null,
      narrativeGeneratedAt: null,
      dataAsOf: null,
      coherence: "unverified",
    };
    render(
      <FlowRecordCanvas bundle={record} recordsHref="#" inspect={jest.fn()} />,
    );
    expect(
      screen.getByText(/Projection bundle with serving lineage/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not independently verify serving state/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Data as of: not established/)).toBeInTheDocument();
    expect(screen.queryByText(/Stored review bundle/)).not.toBeInTheDocument();
  });
});
