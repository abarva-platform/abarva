/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import fs from "node:fs";
import path from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import type { HomeReviewBundle } from "@/lib/home/preview/types";
import { ArchitectureCanvas } from "../ArchitectureCanvas";
import { LeadershipCanvas, OperatingCanvas } from "../ContextViews";
import { FlowRecordCanvas } from "../FlowRecordCanvas";
import { flowRecords, leadershipContext } from "../context-coverage";

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
const source = {
  kind: "reviewed_snapshot" as const,
  canonicalSnapshotHash: "reviewed-version",
};
function bundle(): HomeReviewBundle {
  return {
    ...JSON.parse(
      fs.readFileSync(
        path.join(
          process.cwd(),
          "src/lib/home/preview/golden-snapshots/meridian-health.json",
        ),
        "utf8",
      ),
    ),
    declaredSyntheticDemo: true,
  };
}

describe("context-rich canvas views", () => {
  it("shows recorded themes, retains minority themes and filters exact source excerpts", () => {
    const record = bundle(),
      inspect = jest.fn();
    const context = leadershipContext(record, source);
    const { container } = render(
      <LeadershipCanvas bundle={record} source={source} inspect={inspect} />,
    );
    expect(
      screen.getByLabelText("Leadership theme").querySelectorAll("option"),
    ).toHaveLength(30);
    expect(
      screen.getByText(/not client-attested testimony/),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Theme order"), {
      target: { value: "minority" },
    });
    const themes = [...container.querySelectorAll("[aria-pressed]")];
    expect(themes[0].querySelector("strong")).toHaveTextContent("1");
    const excerpt = context.excerpts[0];
    fireEvent.change(screen.getByLabelText("Leadership theme"), {
      target: { value: excerpt.theme },
    });
    expect(container.querySelector("blockquote")?.textContent).toBe(
      excerpt.text,
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: "Read & verify excerpt" })[0],
    );
    expect(inspect).toHaveBeenLastCalledWith(
      expect.objectContaining({
        text: excerpt.text,
        evidenceIds: excerpt.evidenceIds,
      }),
    );
  });
  it("keeps the entire supplied excerpt selection accessible", () => {
    const record = bundle(),
      inspect = jest.fn();
    const context = leadershipContext(record, source);
    render(
      <LeadershipCanvas bundle={record} source={source} inspect={inspect} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "All 17 supplied excerpts" }),
    );
    const detail = inspect.mock.calls.at(-1)![0];
    for (const excerpt of context.excerpts)
      expect(detail.text).toContain(excerpt.text);
    expect(detail.evidenceIds).toHaveLength(17);
  });
  it("makes every declared operating segment selectable without assigning unlinked functions", () => {
    const record = bundle(),
      inspect = jest.fn();
    render(
      <OperatingCanvas bundle={record} source={source} inspect={inspect} />,
    );
    const select = screen.getByLabelText("Operating segment");
    const options = [...select.querySelectorAll("option")];
    expect(options).toHaveLength(4);
    for (const option of options) {
      fireEvent.change(select, { target: { value: option.value } });
      expect(
        screen.getByRole("heading", { name: option.textContent! }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/supplies no function-to-segment links/),
      ).toBeInTheDocument();
    }
    fireEvent.click(
      screen.getByRole("button", { name: "All 22 recorded functions" }),
    );
    expect(inspect.mock.calls.at(-1)![0].basis).toContain(
      "Not segment attribution",
    );
  });
  it("renders an admitted data-flow graph and offers its actual movement records", () => {
    const record = bundle();
    const { container } = render(
      <ArchitectureCanvas
        bundle={record}
        tenantKey={record.tenantKey}
        tenantName="Reference"
        flow
        inspect={jest.fn()}
        recordsHref="/home/canvas?view=tech:data_asset_or_integration"
      />,
    );
    expect(container.querySelectorAll("[data-node-id]").length).toBeGreaterThan(
      10,
    );
    fireEvent.click(screen.getByRole("button", { name: "Recorded movements" }));
    expect(
      container.querySelectorAll("[data-recorded-flow-pair]"),
    ).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: "Back to diagram" }));
    expect(container.querySelectorAll("[data-node-id]").length).toBeGreaterThan(
      10,
    );
  });
  it("renders operating detail and function capabilities for each declared segment, with evidence", () => {
    const record = bundle(),
      inspect = jest.fn();
    const segments = ["Care", "Clinics", "Plan", "Enterprise"].map(
      (name, index) => ({
        segmentKey: `segment-${index}`,
        segmentName: name,
        pnlOwnerRole: `Accountable role ${index}`,
        governanceCouncil: `Governance forum ${index}`,
        regulatoryRegime: `Regime ${index}`,
        segmentNotes: `Delivery context for ${name}`,
      }),
    );
    const functions = segments.map((segment, index) => ({
      functionName: `Function ${index}`,
      businessSegmentKey: segment.segmentKey,
      executiveOwner: `Function owner ${index}`,
      businessCapabilities: `Capability ${index}`,
    }));
    functions.push(
      ...[1, 2, 3].map((index) => ({
        functionName: `Additional function ${index}`,
        businessSegmentKey: segments[0].segmentKey,
        executiveOwner: `Additional owner ${index}`,
        businessCapabilities: `Additional capability ${index}`,
      })),
    );
    record.technologyEstate!.recordTypes = [
      {
        objectType: "business_segment",
        label: "Segments",
        rows: segments,
        columns: [],
        primaryDimension: "segmentName",
        dimensionCounts: [],
        rowSourceRefs: segments.map((_, i) => [`segment-ref-${i}`]),
      },
      {
        objectType: "business_function",
        label: "Functions",
        rows: functions,
        columns: [],
        primaryDimension: "functionName",
        dimensionCounts: [],
        rowSourceRefs: functions.map((_, i) => [`function-ref-${i}`]),
      },
    ];
    const { container } = render(
      <OperatingCanvas bundle={record} source={source} inspect={inspect} />,
    );
    segments.forEach((segment, index) => {
      fireEvent.change(screen.getByLabelText("Operating segment"), {
        target: { value: segment.segmentKey },
      });
      expect(screen.getByText(segment.segmentNotes)).toBeInTheDocument();
      expect(screen.getByText(segment.pnlOwnerRole)).toBeInTheDocument();
      expect(screen.getByText(segment.governanceCouncil)).toBeInTheDocument();
      expect(screen.getByText(segment.regulatoryRegime)).toBeInTheDocument();
      expect(screen.getByText(`Capability ${index}`)).toBeInTheDocument();
      expect(
        container.querySelectorAll("[data-segment-functions] li"),
      ).toHaveLength(index === 0 ? 3 : 1);
      fireEvent.click(
        screen.getAllByRole("button", { name: "Function evidence" })[0],
      );
      expect(inspect).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sourceRefs: [`function-ref-${index}`],
          text: expect.stringContaining(`Capability ${index}`),
        }),
      );
    });
    expect(
      screen.queryByText("Not supplied in this bundle"),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Operating segment"), {
      target: { value: segments[0].segmentKey },
    });
    expect(screen.getByText("Functions 1-3 of 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next function page" }));
    expect(screen.getByText("Additional capability 3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next function page" }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Previous function page" }),
    );
    expect(screen.getByText("Capability 0")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next function page" }));
    fireEvent.change(screen.getByLabelText("Operating segment"), {
      target: { value: segments[1].segmentKey },
    });
    fireEvent.change(screen.getByLabelText("Operating segment"), {
      target: { value: segments[0].segmentKey },
    });
    expect(screen.getByText("Functions 1-3 of 4")).toBeInTheDocument();
  });
  it("keeps inspectable pair records when the independent architecture gate refuses", () => {
    const record = bundle(),
      inspect = jest.fn();
    const refusal = {
      format: "end_to_end_data_flow" as const,
      question: "Flow",
      failedRules: [
        {
          ruleId: "FLOW-CONVERGENCE",
          headline: "Shared convergence is not established",
          detail: "Insufficient convergence",
        },
      ],
      evidenceNeeded: [],
      supportedAlternatives: [],
    };
    const { container } = render(
      <FlowRecordCanvas
        bundle={record}
        refusal={refusal}
        recordsHref="/home/canvas?view=tech:data_asset_or_integration"
        inspect={inspect}
      />,
    );
    expect(
      container.querySelectorAll("[data-recorded-flow-pair]"),
    ).toHaveLength(6);
    expect(screen.getByText(/full diagram is withheld/)).toBeInTheDocument();
    expect(
      screen.getByText(/not proof of an ordered intermediate hop/),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Source records" })[0],
    );
    expect(inspect.mock.calls.at(-1)![0].basis).toContain(
      "No ordered platform hop inferred",
    );
    fireEvent.click(screen.getByRole("button", { name: "Next flow page" }));
    expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();
    const firstOrigin = flowRecords(record).pairs[0].source;
    fireEvent.change(screen.getByLabelText("Flow origin"), {
      target: { value: firstOrigin },
    });
    expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Full data record" }),
    ).toHaveAttribute(
      "href",
      "/home/canvas?view=tech:data_asset_or_integration",
    );
  });
  it("does not disguise a missing flow slice as zero enterprise movement", () => {
    const record = bundle();
    record.technologyEstate!.recordTypes = [];
    const { container } = render(
      <FlowRecordCanvas bundle={record} recordsHref="#" inspect={jest.fn()} />,
    );
    expect(
      screen.getByText("Data-flow detail is not supplied in this bundle"),
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll("[data-recorded-flow-pair]"),
    ).toHaveLength(0);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
