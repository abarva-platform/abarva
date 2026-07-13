/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, within } from "@testing-library/react";

import { AdminSetupExperience } from "../AdminSetupExperience";
import { buildAdminSetupControlReadModel } from "@/lib/admin/setup-control";
import { buildLoadStudioView } from "@/lib/admin/setup-load-studio-view";

const view = buildLoadStudioView({
  tenantName: "Lakeshore Holdings",
  vertical: "Enterprise",
  snapshot: null,
});

const sourceFiles = [
  {
    sourceDoc: "04_cmdb_application_portfolio.csv",
    chunkCount: 12,
    firstLoadedAt: "2026-06-14T12:00:00.000Z",
    sampleChunkId: "chunk-1",
  },
  {
    sourceDoc: "06_api_file_transfer_landscape.csv",
    chunkCount: 8,
    firstLoadedAt: "2026-06-14T12:10:00.000Z",
    sampleChunkId: "chunk-2",
  },
];

const setupControl = buildAdminSetupControlReadModel({
  tenantKey: "lakeshore",
  displayName: "Lakeshore Holdings",
  coverName: "Lakeshore Holdings",
  snapshot: null,
  sourceFiles: sourceFiles.map((file) => ({
    source_doc: file.sourceDoc,
    chunk_count: file.chunkCount,
    first_loaded_at: file.firstLoadedAt,
    sample_chunk_id: file.sampleChunkId,
  })),
});

function renderSetup(options: { withSetupControl?: boolean } = {}) {
  return render(
    <AdminSetupExperience
      tenantName="Lakeshore Holdings"
      tenantInitials="LH"
      tenantKey="lakeshore-holdings"
      clientId="client-1"
      view={view}
      setupControl={options.withSetupControl ? setupControl : undefined}
      sourceFiles={sourceFiles}
    />,
  );
}

describe("AdminSetupExperience", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ records: [], total: 0 }),
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps a single primary data action outside the Data tab", () => {
    renderSetup();

    expect(screen.getByRole("button", { name: /^Add data$/ })).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /Data Load, confirm, connect 2/ }),
    );

    expect(
      screen.queryByRole("button", { name: /^Add data$/ }),
    ).not.toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /^Upload file$/ }),
    ).not.toBeTruthy();
  });

  it("binds the confirm count and loaded-file table to source files", () => {
    renderSetup();
    fireEvent.click(
      screen.getByRole("button", { name: /Data Load, confirm, connect 2/ }),
    );

    const tabs = screen.getByRole("tablist", { name: "Data setup tabs" });
    expect(
      within(tabs).getByRole("button", { name: /Confirm 2/ }),
    ).toBeTruthy();

    fireEvent.click(within(tabs).getByRole("button", { name: /Confirm 2/ }));

    expect(screen.getByText("04_cmdb_application_portfolio.csv")).toBeTruthy();
    expect(screen.getByText("06_api_file_transfer_landscape.csv")).toBeTruthy();
  });

  it("defaults first-time data loading to a governed setup package lane", () => {
    renderSetup();
    fireEvent.click(
      screen.getByRole("button", { name: /Data Load, confirm, connect 2/ }),
    );

    expect(
      screen
        .getByRole("radio", { name: /First-time load Start with/ })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.queryByText("Package intake is review-first")).toBeNull();
    expect(
      screen.getByText(/Start with the file that best represents/),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("radio", { name: /Update one file Refresh one area/ }),
    );

    expect(
      screen.getAllByText(/when one data area needs a refresh/).length,
    ).toBeGreaterThan(0);
  });

  it("shows a workflow-led Data Intake Library with all template contracts", () => {
    renderSetup({ withSetupControl: true });

    fireEvent.click(
      screen.getByRole("button", {
        name: /Data Intake Library Templates and guides 19/,
      }),
    );

    expect(screen.getByText("Start with the right templates before uploading files")).toBeTruthy();
    expect(screen.getByText("Choose setup path")).toBeTruthy();
    expect(screen.getByText("Create candidate preview")).toBeTruthy();
    expect(screen.getByText("Promote with proof")).toBeTruthy();
    expect(screen.getByText("Template contracts and readiness impact")).toBeTruthy();
    expect(screen.getByText("Applications & Systems")).toBeTruthy();
    expect(screen.getByText("Source Event Pack")).toBeTruthy();
    expect(screen.getAllByText("View guide").length).toBeGreaterThan(0);
    const downloadTemplateButton = screen.getAllByRole("button", {
      name: "Download template",
    })[0] as HTMLButtonElement;
    expect(downloadTemplateButton.disabled).toBe(true);
  });

  it("uses setup-control source files for honest template status without making data active", () => {
    renderSetup({ withSetupControl: true });

    fireEvent.click(
      screen.getByRole("button", {
        name: /Data Intake Library Templates and guides 19/,
      }),
    );

    expect(
      screen.getAllByText("Matched: 04_cmdb_application_portfolio.csv").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        "Evidence source is visible; parsing, mapping, validation, and candidate promotion are not proven here.",
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        "Template contract defined - downloadable file not yet generated.",
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Promotions")).toBeTruthy();
    expect(screen.getByText("read-only catalog")).toBeTruthy();
  });
});
