/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { SourceNewFiles, type SourceNewFileRow } from "./SourceNewFiles";

const base: SourceNewFileRow = {
  id: "current",
  phase: "define",
  artifactGroup: "generated",
  artifactType: "strategy_brief",
  artifactFamily: "strategy",
  description: "CIO strategy package preview",
  title: "Strategy brief",
  fileName: "strategy-brief.pdf",
  fileFormat: "pdf",
  fileSize: 2048,
  version: 3,
  status: "approved",
  lifecycleState: "current",
  generatedAt: "2026-01-01T00:00:00Z",
  generatedBy: "Editor",
  sourceBasis: "Recorded request and scope notes",
  confidence: "reviewed",
  citationReady: true,
  evidenceFamiliesUsed: ["intake", "scope"],
  sourceRegisterId: "SRC-REG-1",
  contextBundleTraceId: "CTX-TRACE-1",
  missingInputs: ["validated baseline"],
  clientCompleteItems: ["scope owner"],
  assumptions: ["budget holder remains unchanged"],
  supersedesArtifactId: "previous-file",
  supersededByArtifactId: null,
  blobSha256: "abc123",
  approvalState: "approved",
  approvedBy: "Reviewer",
  approvedAt: "2026-01-02T00:00:00Z",
  isClientFinal: true,
  isCurrentAuthoritative: true,
  sourceGeneratedArtifactId: "GEN-1",
  clientFinalUploadedBy: "Uploader",
  clientFinalUploadedAt: "2026-01-03T00:00:00Z",
  clientFinalAcceptedBy: "Sponsor",
  clientFinalAcceptedAt: "2026-01-04T00:00:00Z",
  clientFinalNote: "Accepted for sourcing kickoff.",
  clientFinalReviewMeetingDate: "2026-01-05",
  clientFinalStakeholderGroup: "Procurement council",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-06T00:00:00Z",
};

const rows: SourceNewFileRow[] = [
  base,
  {
    ...base,
    id: "older",
    version: 2,
    lifecycleState: "superseded",
    status: "superseded",
    blobSha256: "oldhash",
  },
  {
    ...base,
    id: "request",
    phase: "request",
    artifactType: "intake",
    title: "Intake record",
    version: 1,
  },
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

  it("does not call a folder empty when the history toggle is hiding its files", () => {
    const supersededOnly: SourceNewFileRow = {
      ...base,
      id: "old-only",
      phase: "suppliers",
      version: 1,
      lifecycleState: "superseded",
      status: "superseded",
    };
    render(<SourceNewFiles rows={[supersededOnly]} />);
    fireEvent.click(screen.getByRole("button", { name: "Suppliers" }));
    expect(screen.queryByText("No files here yet")).toBeNull();
    expect(
      screen.getByText(/No current version here\. 1 older version is hidden/),
    ).toBeTruthy();
    // Turning history on reveals the file rather than changing the message
    fireEvent.click(screen.getByLabelText("Older versions"));
    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("still says a genuinely empty folder is empty", () => {
    render(<SourceNewFiles rows={rows} />);
    fireEvent.click(screen.getByRole("button", { name: "Suppliers" }));
    expect(screen.getByText("No files here yet")).toBeTruthy();
  });

  it("offers the other-stages folder only when such files exist, and never hides them", () => {
    const { unmount } = render(<SourceNewFiles rows={rows} />);
    const folderNames = () =>
      within(screen.getByRole("navigation", { name: "File folders" }))
        .getAllByRole("button")
        .map((button) => button.textContent);
    expect(folderNames()).not.toContain("Other stages");
    unmount();

    const elsewhere: SourceNewFileRow = {
      ...base,
      id: "score",
      phase: "other",
      artifactType: "score_summary",
      title: "Evaluation score summary",
    };
    render(<SourceNewFiles rows={[...rows, elsewhere]} />);
    expect(folderNames()).toContain("Other stages");
    fireEvent.click(screen.getByRole("button", { name: "Other stages" }));
    expect(
      screen.getByRole("option", { name: /Evaluation score summary/ }),
    ).toBeTruthy();
  });

  it("filters by folder and search, hiding superseded versions until requested", () => {
    render(<SourceNewFiles rows={rows} />);
    expect(screen.getByRole("option", { name: /Intake record/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Define" }));
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(
      screen
        .getByRole("option", { name: /Strategy brief/ })
        .getAttribute("aria-selected"),
    ).toBe("true");
    fireEvent.click(screen.getByLabelText("Older versions"));
    expect(screen.getAllByRole("option")).toHaveLength(2);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search files" }), {
      target: { value: "missing" },
    });
    expect(screen.getByText("No matching files")).toBeTruthy();
  });

  it("selects a historical version and passes that exact row to actions", () => {
    const onPreview = jest.fn();
    const onDownload = jest.fn();
    const onReview = jest.fn();
    render(
      <SourceNewFiles
        rows={rows}
        onPreview={onPreview}
        onDownload={onDownload}
        onReview={onReview}
      />,
    );
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

  it("renders a defined detail view from existing file metadata without inventing missing fields", () => {
    const sparse: SourceNewFileRow = {
      ...base,
      id: "sparse",
      title: "Sparse intake note",
      fileName: "sparse.md",
      fileFormat: "md",
      fileSize: null,
      artifactFamily: null,
      description: null,
      generatedBy: null,
      sourceBasis: null,
      confidence: null,
      citationReady: false,
      evidenceFamiliesUsed: [],
      sourceRegisterId: null,
      contextBundleTraceId: null,
      missingInputs: [],
      clientCompleteItems: [],
      assumptions: [],
      supersedesArtifactId: null,
      supersededByArtifactId: null,
      blobSha256: null,
      approvalState: null,
      approvedBy: null,
      approvedAt: null,
      isClientFinal: false,
      isCurrentAuthoritative: false,
      sourceGeneratedArtifactId: null,
      clientFinalUploadedBy: null,
      clientFinalUploadedAt: null,
      clientFinalAcceptedBy: null,
      clientFinalAcceptedAt: null,
      clientFinalNote: null,
      clientFinalReviewMeetingDate: null,
      clientFinalStakeholderGroup: null,
    };

    render(<SourceNewFiles rows={[base, sparse]} initialPhase="define" />);
    fireEvent.click(screen.getByRole("option", { name: /Strategy brief/ }));
    const details = screen.getByLabelText("Selected file details");
    expect(within(details).getByText("Preview metadata")).toBeTruthy();
    expect(within(details).getByText("Version")).toBeTruthy();
    expect(within(details).getByText("Evidence links")).toBeTruthy();
    expect(within(details).getByText("Approvals and comments")).toBeTruthy();
    expect(within(details).getByText("Authenticity state")).toBeTruthy();
    expect(
      within(details).getByText("CIO strategy package preview"),
    ).toBeTruthy();
    expect(
      within(details).getByText("Recorded request and scope notes"),
    ).toBeTruthy();
    expect(within(details).getByText("SRC-REG-1")).toBeTruthy();
    expect(within(details).getByText("CTX-TRACE-1")).toBeTruthy();
    expect(within(details).getByText("intake, scope")).toBeTruthy();
    expect(within(details).getByText(/Accepted by Sponsor/)).toBeTruthy();
    expect(
      within(details).getByText("Accepted for sourcing kickoff."),
    ).toBeTruthy();
    expect(within(details).getByText("GEN-1")).toBeTruthy();
    expect(within(details).getByText("validated baseline")).toBeTruthy();
    expect(
      within(details).queryByRole("button", { name: "Download" }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("option", { name: /Sparse intake note/ }));
    const sparseDetails = screen.getByLabelText("Selected file details");
    expect(
      within(sparseDetails).getAllByText("Not recorded").length,
    ).toBeGreaterThan(8);
    expect(
      within(sparseDetails).getAllByText("No").length,
    ).toBeGreaterThanOrEqual(3);
    expect(
      within(sparseDetails).queryByRole("button", { name: "Download" }),
    ).toBeNull();
  });

  it("renders explicit unresolved states instead of internal UUIDs in client-facing metadata", () => {
    const internalId = "24fc65af-8223-4884-9241-ef5736960a1b";
    const unresolved: SourceNewFileRow = {
      ...base,
      id: "uuid-metadata",
      generatedBy: internalId,
      sourceRegisterId: internalId,
      supersedesArtifactId: internalId,
      supersededByArtifactId: internalId,
      approvedBy: internalId,
      clientFinalAcceptedBy: internalId,
      clientFinalUploadedBy: internalId,
    };

    render(<SourceNewFiles rows={[unresolved]} initialPhase="define" />);
    const details = screen.getByLabelText("Selected file details");

    expect(within(details).queryByText(internalId)).toBeNull();
    expect(within(details).getByText("Origin name unresolved")).toBeTruthy();
    expect(
      within(details).getByText("Register reference unresolved"),
    ).toBeTruthy();
    expect(
      within(details).getAllByText("Artifact reference unresolved"),
    ).toHaveLength(2);
    expect(
      within(details).getByText(/^Recorded approver; name unresolved ·/),
    ).toBeTruthy();
    expect(
      within(details).getByText(
        /^Accepted by recorded user; name unresolved ·/,
      ),
    ).toBeTruthy();
    expect(
      within(details).getByText(
        /^Uploaded by recorded user; name unresolved ·/,
      ),
    ).toBeTruthy();
  });

  it("separates accepted client-final authority from draft workflow approval", () => {
    render(
      <SourceNewFiles
        rows={[
          {
            ...base,
            approvalState: "draft",
            approvedBy: null,
            approvedAt: null,
            isClientFinal: true,
            isCurrentAuthoritative: true,
            clientFinalAcceptedBy: "Executive sponsor",
            clientFinalAcceptedAt: "2026-01-04T00:00:00Z",
          },
        ]}
        initialPhase="define"
      />,
    );

    const details = screen.getByLabelText("Selected file details");
    expect(within(details).getByText("Workflow approval")).toBeTruthy();
    expect(within(details).getByText("draft")).toBeTruthy();
    expect(
      within(details).getByText(/Accepted by Executive sponsor/),
    ).toBeTruthy();
    expect(
      within(details).getByText(
        "Client-final authority is accepted; workflow approval is draft.",
      ),
    ).toBeTruthy();
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
    render(
      <SourceNewFiles
        rows={[
          base,
          {
            ...base,
            id: "another",
            title: "Second strategy brief",
            fileName: "another.pdf",
          },
        ]}
        initialPhase="define"
      />,
    );
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(
      screen.getByRole("option", { name: /Second strategy brief/ }),
    ).toBeTruthy();
  });

  it("returns from mobile details to the same filtered list and scroll position", () => {
    useMobileViewport();
    const restoreScroll = jest.fn();
    window.scrollTo = restoreScroll;
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 420,
    });
    const onPreview = jest.fn();
    const { container } = render(
      <SourceNewFiles rows={rows} onPreview={onPreview} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Define" }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Search files" }), {
      target: { value: "strategy" },
    });
    fireEvent.click(screen.getByLabelText("Older versions"));
    const list = screen.getByRole("listbox", { name: "Files in folder" });
    list.scrollTop = 137;
    const older = screen.getByRole("option", { name: /v2/ });
    fireEvent.click(older);

    expect(
      container
        .querySelector(".source-new-files")
        ?.getAttribute("data-mobile-detail"),
    ).toBe("true");
    const details = screen.getByLabelText("Selected file details");
    expect(within(details).getByText("strategy-brief.pdf · v2")).toBeTruthy();
    expect(within(details).getByText("superseded")).toBeTruthy();
    expect(within(details).getByText("Editor")).toBeTruthy();
    expect(within(details).getByText(/Approved by Reviewer/)).toBeTruthy();
    expect(within(details).getByText("oldhash")).toBeTruthy();
    expect(
      within(details).getByRole("button", { name: "Preview" }),
    ).toBeTruthy();
    expect(
      within(details).queryByRole("button", { name: "Download" }),
    ).toBeNull();
    expect(document.activeElement).toBe(
      within(details).getByRole("button", { name: "Back to files" }),
    );

    fireEvent.click(within(details).getByRole("button", { name: "Preview" }));
    expect(onPreview).toHaveBeenCalledWith(rows[1]);
    fireEvent.click(
      within(details).getByRole("button", { name: "Back to files" }),
    );
    expect(
      container
        .querySelector(".source-new-files")
        ?.getAttribute("data-mobile-detail"),
    ).toBe("false");
    expect(
      screen
        .getByRole("button", { name: "Define" })
        .getAttribute("aria-current"),
    ).toBe("true");
    expect(
      (
        screen.getByRole("searchbox", {
          name: "Search files",
        }) as HTMLInputElement
      ).value,
    ).toBe("strategy");
    expect(
      (screen.getByLabelText("Older versions") as HTMLInputElement).checked,
    ).toBe(true);
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(list.scrollTop).toBe(137);
    expect(restoreScroll).toHaveBeenCalledWith(0, 420);
    expect(document.activeElement).toBe(older);
  });

  it("opens mobile details by keyboard and returns focus with Escape", () => {
    useMobileViewport();
    window.scrollTo = jest.fn();
    const { container } = render(
      <SourceNewFiles rows={rows} initialPhase="define" />,
    );
    const row = screen.getByRole("option", { name: /Strategy brief/ });
    row.focus();
    fireEvent.keyDown(row, { key: "Enter" });
    expect(
      container
        .querySelector(".source-new-files")
        ?.getAttribute("data-mobile-detail"),
    ).toBe("true");
    const back = screen.getByRole("button", { name: "Back to files" });
    expect(document.activeElement).toBe(back);
    fireEvent.keyDown(back, { key: "Escape" });
    expect(
      container
        .querySelector(".source-new-files")
        ?.getAttribute("data-mobile-detail"),
    ).toBe("false");
    expect(document.activeElement).toBe(row);
    fireEvent.keyDown(row, { key: " " });
    expect(
      container
        .querySelector(".source-new-files")
        ?.getAttribute("data-mobile-detail"),
    ).toBe("true");
  });

  // The market-package folder holds artifacts whose recorded type still
  // carries the reused solicitation key (`rfp_package` is a real artifact
  // type in the file cabinet, and `sourceNewFilePhase` files it here). That
  // key does not record whether the event is an RFI or an RFP, so printing it
  // raw invents an authority the column does not carry — the same defect the
  // phase rail and the folder rail were already corrected for.
  const marketPackageFile: SourceNewFileRow = {
    ...base,
    id: "market-package",
    phase: "rfi",
    artifactGroup: "generated",
    artifactType: "rfp_package",
    artifactFamily: "solicitation",
    title: "Sourcing package draft",
    fileName: "sourcing-package-draft.pdf",
    version: 1,
    lifecycleState: "current",
    status: "approved",
  };

  function openMarketPackageDetail(folderLabel: string) {
    const folders = screen.getByRole("navigation", { name: "File folders" });
    fireEvent.click(within(folders).getByRole("button", { name: folderLabel }));
    const list = screen.getByRole("listbox", { name: "Files in folder" });
    fireEvent.click(
      within(list).getByRole("option", { name: /Sourcing package draft/ }),
    );
    return screen.getByRole("complementary", { name: "Selected file details" });
  }

  it("states the accepted RFI motion on a market-package artifact instead of its reused RFP key", () => {
    render(
      <SourceNewFiles rows={[marketPackageFile]} marketPackageLabel="RFI" />,
    );

    const detail = openMarketPackageDetail("RFI");
    expect(within(detail).getByText("RFI package")).toBeTruthy();
    expect(within(detail).queryByText(/rfp/i)).toBeNull();
  });

  it("states the accepted RFP motion on the same artifact rather than inferring it from the key", () => {
    render(
      <SourceNewFiles rows={[marketPackageFile]} marketPackageLabel="RFP" />,
    );

    const detail = openMarketPackageDetail("RFP");
    expect(within(detail).getByText("RFP package")).toBeTruthy();
    expect(within(detail).queryByText(/rfi/i)).toBeNull();
  });

  it("keeps a market-package artifact neutral while no motion is accepted", () => {
    render(<SourceNewFiles rows={[marketPackageFile]} />);

    const detail = openMarketPackageDetail("Market package");
    expect(within(detail).getByText("Market package")).toBeTruthy();
    expect(within(detail).queryByText(/rfi/i)).toBeNull();
    expect(within(detail).queryByText(/rfp/i)).toBeNull();
  });

  // Artifact types are free text and the legacy `rfp_rfi_package` stage key is
  // still live in `phase-state.ts`, so an artifact named after it carries two
  // solicitation tokens, not one. Neither may reach the operator.
  it("withholds every solicitation token, not just the first", () => {
    render(
      <SourceNewFiles
        rows={[{ ...marketPackageFile, artifactType: "rfp_rfi_package" }]}
        marketPackageLabel="RFI"
      />,
    );

    const detail = openMarketPackageDetail("RFI");
    expect(within(detail).getByText("RFI package")).toBeTruthy();
    expect(within(detail).queryByText(/rfp/i)).toBeNull();
  });

  // The rule is keyed on the solicitation token, not on the folder. A package
  // copy filed against a later stage lands in "Other stages", where the folder
  // label carries no motion at all — and that is exactly where a raw `rfp_`
  // key would go unnoticed.
  it("withholds a solicitation key from an artifact filed outside the market-package folder", () => {
    render(
      <SourceNewFiles
        rows={[{ ...marketPackageFile, id: "late-copy", phase: "other" }]}
        initialPhase="other"
        marketPackageLabel="RFI"
      />,
    );

    const detail = screen.getByRole("complementary", {
      name: "Selected file details",
    });
    expect(within(detail).getByText("RFI package")).toBeTruthy();
    expect(within(detail).queryByText(/rfp/i)).toBeNull();
  });

  // An artifact that never carried a solicitation key keeps the type recorded
  // against it. Withholding an unrecorded motion is the point; rewording a
  // recorded fact is not.
  it("leaves an artifact that carries no solicitation key on its recorded type", () => {
    render(
      <SourceNewFiles
        rows={[base]}
        initialPhase="define"
        marketPackageLabel="RFI"
      />,
    );

    const detail = screen.getByRole("complementary", {
      name: "Selected file details",
    });
    expect(within(detail).getByText("strategy brief")).toBeTruthy();
  });
});
