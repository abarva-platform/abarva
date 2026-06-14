/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, within } from "@testing-library/react";

import { AdminSetupExperience } from "../AdminSetupExperience";
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

function renderSetup() {
  return render(
    <AdminSetupExperience
      tenantName="Lakeshore Holdings"
      tenantInitials="LH"
      tenantKey="lakeshore-holdings"
      clientId="client-1"
      view={view}
      sourceFiles={sourceFiles}
    />,
  );
}

describe("AdminSetupExperience", () => {
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
        .getByRole("radio", { name: /Setup package First load/ })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.getByText("Package intake is review-first")).toBeTruthy();
    expect(screen.getByText(/ZIP packages use Advanced review/)).toBeTruthy();

    fireEvent.click(
      screen.getByRole("radio", { name: /Single file update Ongoing update/ }),
    );

    expect(screen.getAllByText("Single file update").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Older matching facts are superseded/).length,
    ).toBeGreaterThan(0);
  });
});
