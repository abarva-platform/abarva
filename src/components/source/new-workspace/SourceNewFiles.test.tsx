/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { SourceNewFiles, type SourceNewFileRow } from "./SourceNewFiles";

const base: SourceNewFileRow = {
  id: "current",
  phase: "define",
  artifactGroup: "generated",
  artifactType: "strategy_brief",
  title: "Strategy brief",
  fileName: "strategy-brief.pdf",
  fileFormat: "pdf",
  fileSize: 2048,
  version: 3,
  status: "approved",
  lifecycleState: "current",
  generatedAt: "2026-01-01T00:00:00Z",
  generatedBy: "Editor",
  sourceBasis: null,
  blobSha256: "abc123",
  approvalState: "approved",
  approvedBy: "Reviewer",
  approvedAt: "2026-01-02T00:00:00Z",
};

const rows: SourceNewFileRow[] = [
  base,
  { ...base, id: "older", version: 2, lifecycleState: "superseded", status: "superseded", blobSha256: "oldhash" },
  { ...base, id: "request", phase: "request", artifactType: "intake", title: "Intake record", version: 1 },
];

describe("SourceNewFiles", () => {
  it("filters by folder and search, hiding superseded versions until requested", () => {
    render(<SourceNewFiles rows={rows} />);
    expect(screen.getByRole("option", { name: /Intake record/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Define" }));
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: /Strategy brief/ }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByLabelText("Older versions"));
    expect(screen.getAllByRole("option")).toHaveLength(2);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search files" }), { target: { value: "missing" } });
    expect(screen.getByText("No matching files")).toBeTruthy();
  });

  it("selects a historical version and passes that exact row to actions", () => {
    const onPreview = jest.fn();
    const onDownload = jest.fn();
    const onReview = jest.fn();
    render(<SourceNewFiles rows={rows} onPreview={onPreview} onDownload={onDownload} onReview={onReview} />);
    fireEvent.click(screen.getByRole("button", { name: "Define" }));
    fireEvent.click(screen.getByLabelText("Older versions"));
    fireEvent.click(screen.getByRole("option", { name: /v2/ }));
    const details = screen.getByLabelText("Selected file details");
    expect(within(details).getByText("oldhash")).toBeTruthy();
    expect(within(details).getByText("superseded")).toBeTruthy();
    fireEvent.click(within(details).getByRole("button", { name: "Preview" }));
    fireEvent.click(within(details).getByRole("button", { name: "Download" }));
    fireEvent.click(within(details).getByRole("button", { name: "Review" }));
    expect(onPreview).toHaveBeenCalledWith(rows[1]);
    expect(onDownload).toHaveBeenCalledWith(rows[1]);
    expect(onReview).toHaveBeenCalledWith(rows[1]);
    fireEvent.click(screen.getByLabelText("Older versions"));
    expect(within(details).getByText("abc123")).toBeTruthy();
  });

  it("shows a quiet empty state and delegates upload for the selected phase", () => {
    const onUpload = jest.fn();
    render(<SourceNewFiles rows={[]} onUpload={onUpload} />);
    expect(screen.getByText("No files here yet")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Preview" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Suppliers" }));
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));
    expect(onUpload).toHaveBeenCalledWith("suppliers");
  });

  it("opens the current workflow folder when supplied", () => {
    render(<SourceNewFiles rows={rows} initialPhase="define" />);
    expect(screen.getByRole("option", { name: /Strategy brief/ })).toBeTruthy();
    expect(screen.queryByRole("option", { name: /Intake record/ })).toBeNull();
  });
});
