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
  const matchMedia = window.matchMedia;
  const scrollTo = window.scrollTo;
  const scrollY = Object.getOwnPropertyDescriptor(window, "scrollY");

  afterEach(() => {
    window.matchMedia = matchMedia;
    window.scrollTo = scrollTo;
    if (scrollY) Object.defineProperty(window, "scrollY", scrollY);
  });

  function useMobileViewport() {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === "(max-width: 760px)",
      media: query,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    }));
  }

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

  it("shows distinct current documents even when they share a type", () => {
    render(<SourceNewFiles rows={[base, { ...base, id: "another", title: "Second strategy brief", fileName: "another.pdf" }]} initialPhase="define" />);
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(screen.getByRole("option", { name: /Second strategy brief/ })).toBeTruthy();
  });

  it("returns from mobile details to the same filtered list and scroll position", () => {
    useMobileViewport();
    const restoreScroll = jest.fn();
    window.scrollTo = restoreScroll;
    Object.defineProperty(window, "scrollY", { configurable: true, value: 420 });
    const onPreview = jest.fn();
    const { container } = render(<SourceNewFiles rows={rows} onPreview={onPreview} />);
    fireEvent.click(screen.getByRole("button", { name: "Define" }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Search files" }), { target: { value: "strategy" } });
    fireEvent.click(screen.getByLabelText("Older versions"));
    const list = screen.getByRole("listbox", { name: "Files in folder" });
    list.scrollTop = 137;
    const older = screen.getByRole("option", { name: /v2/ });
    fireEvent.click(older);

    expect(container.querySelector(".source-new-files")?.getAttribute("data-mobile-detail")).toBe("true");
    const details = screen.getByLabelText("Selected file details");
    expect(within(details).getByText("strategy-brief.pdf · v2")).toBeTruthy();
    expect(within(details).getByText("superseded")).toBeTruthy();
    expect(within(details).getByText("Editor")).toBeTruthy();
    expect(within(details).getByText(/Approved by Reviewer/)).toBeTruthy();
    expect(within(details).getByText("oldhash")).toBeTruthy();
    expect(within(details).getByRole("button", { name: "Preview" })).toBeTruthy();
    expect(within(details).queryByRole("button", { name: "Download" })).toBeNull();
    expect(document.activeElement).toBe(within(details).getByRole("button", { name: "Back to files" }));

    fireEvent.click(within(details).getByRole("button", { name: "Preview" }));
    expect(onPreview).toHaveBeenCalledWith(rows[1]);
    fireEvent.click(within(details).getByRole("button", { name: "Back to files" }));
    expect(container.querySelector(".source-new-files")?.getAttribute("data-mobile-detail")).toBe("false");
    expect(screen.getByRole("button", { name: "Define" }).getAttribute("aria-current")).toBe("true");
    expect((screen.getByRole("searchbox", { name: "Search files" }) as HTMLInputElement).value).toBe("strategy");
    expect((screen.getByLabelText("Older versions") as HTMLInputElement).checked).toBe(true);
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(list.scrollTop).toBe(137);
    expect(restoreScroll).toHaveBeenCalledWith(0, 420);
    expect(document.activeElement).toBe(older);
  });

  it("opens mobile details by keyboard and returns focus with Escape", () => {
    useMobileViewport();
    window.scrollTo = jest.fn();
    const { container } = render(<SourceNewFiles rows={rows} initialPhase="define" />);
    const row = screen.getByRole("option", { name: /Strategy brief/ });
    row.focus();
    fireEvent.keyDown(row, { key: "Enter" });
    expect(container.querySelector(".source-new-files")?.getAttribute("data-mobile-detail")).toBe("true");
    const back = screen.getByRole("button", { name: "Back to files" });
    expect(document.activeElement).toBe(back);
    fireEvent.keyDown(back, { key: "Escape" });
    expect(container.querySelector(".source-new-files")?.getAttribute("data-mobile-detail")).toBe("false");
    expect(document.activeElement).toBe(row);
    fireEvent.keyDown(row, { key: " " });
    expect(container.querySelector(".source-new-files")?.getAttribute("data-mobile-detail")).toBe("true");
  });
});
