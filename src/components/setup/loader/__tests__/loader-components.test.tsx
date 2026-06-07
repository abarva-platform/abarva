/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { DropZone } from "@/components/setup/loader/DropZone";
import { ReviewTable } from "@/components/setup/loader/ReviewTable";
import type {
  MappingProposal,
  PreservedSourceFile,
  StewardFinding,
} from "@/lib/context-ingestion/loader/contract";

function makeSource(overrides: Partial<PreservedSourceFile> = {}): PreservedSourceFile {
  return {
    tenantKey: "apex-retail",
    filename: "leadership.csv",
    container: "landing",
    objectKey: "landing/apex-retail/inbox/abc-leadership.csv",
    blobUrl: "https://example.blob.core.windows.net/landing/abc-leadership.csv",
    fileHash: "a".repeat(64),
    bytes: 4096,
    contentType: "text/csv",
    ingestedAt: "2026-06-07T00:00:00.000Z",
    ...overrides,
  };
}

const sampleProposals: MappingProposal[] = [
  {
    source: makeSource(),
    dimension: "leadership_org",
    dimensionConfidence: 0.92,
    fieldMappings: [
      { sourceColumn: "Name", canonicalField: "person.name", confidence: 0.95 },
      { sourceColumn: "Title", canonicalField: "person.title", confidence: 0.9 },
    ],
    reviewRequired: false,
  },
  {
    source: makeSource({
      filename: "org-chart.pdf",
      objectKey: "landing/apex-retail/inbox/def-org-chart.pdf",
      contentType: "application/pdf",
    }),
    dimension: "leadership_org",
    dimensionConfidence: 0.55,
    fieldMappings: [
      { sourceColumn: "p.1", canonicalField: "person.title", confidence: 0.5 },
    ],
    reviewRequired: true,
  },
];

const sampleFindings: Record<string, StewardFinding[]> = {
  "landing/apex-retail/inbox/abc-leadership.csv": [
    {
      kind: "conflict",
      severity: "warn",
      message: "Two people titled CFO — pick current",
      source: "deterministic",
      suggestedAction: "Choose the current CFO",
    },
  ],
};

describe("ReviewTable", () => {
  it("renders one row per proposal with the pre-filled dimension", () => {
    render(
      <ReviewTable proposals={sampleProposals} findingsByObjectKey={sampleFindings} />,
    );

    expect(screen.getByText("leadership.csv")).toBeTruthy();
    expect(screen.getByText("org-chart.pdf")).toBeTruthy();
    expect(screen.getByText("Two people titled CFO — pick current")).toBeTruthy();

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    expect(selects).toHaveLength(2);
    expect(selects[0].value).toBe("leadership_org");
  });

  it("emits dimension changes and row actions", () => {
    const onDimensionChange = jest.fn();
    const onRowAction = jest.fn();
    render(
      <ReviewTable
        proposals={sampleProposals}
        onDimensionChange={onDimensionChange}
        onRowAction={onRowAction}
      />,
    );

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    fireEvent.change(selects[0], { target: { value: "kpis" } });
    expect(onDimensionChange).toHaveBeenCalledWith(
      "landing/apex-retail/inbox/abc-leadership.csv",
      "kpis",
    );

    fireEvent.click(screen.getAllByRole("button", { name: /commit/i })[0]);
    expect(onRowAction).toHaveBeenCalledWith(
      "landing/apex-retail/inbox/abc-leadership.csv",
      "commit",
    );
  });

  it("shows a calm empty state with no proposals", () => {
    render(<ReviewTable proposals={[]} />);
    expect(screen.getByText(/Nothing to review yet/i)).toBeTruthy();
  });
});

describe("DropZone", () => {
  it("renders the add-data surface and both on-ramps", () => {
    render(
      <DropZone
        onFilesSelected={jest.fn()}
        onChooseDimension={jest.fn()}
        onConnectAzureStorage={jest.fn()}
      />,
    );

    expect(screen.getByText("Add your data")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Load into a specific dimension/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Connect Azure Storage/i }),
    ).toBeTruthy();
  });

  it("emits the chosen on-ramp event", () => {
    const onChooseDimension = jest.fn();
    render(
      <DropZone onFilesSelected={jest.fn()} onChooseDimension={onChooseDimension} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Load into a specific dimension/i }),
    );
    expect(onChooseDimension).toHaveBeenCalledTimes(1);
  });
});
