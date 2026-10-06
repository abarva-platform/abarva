const redirectMock = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

jest.mock("@/app/(maestro)/source/workspace/page", () => ({
  __esModule: true,
  default: jest.fn(),
  metadata: { title: "Source Workspace · AbarVa" },
}));

import SourcePage from "@/app/(maestro)/source/page";
import SourceWorkspacePage from "@/app/(maestro)/source/workspace/page";
import SourceEventsPage from "@/app/(maestro)/source/events/page";
import SourceDecisionQueuePage from "@/app/(maestro)/source/queue/page";
import ArchivedSourceVendorPortfolioRoute from "@/app/(maestro)/source/vendor-portfolio/page";
import ArchivedSourceContract360Route from "@/app/(maestro)/source/vendor-portfolio/[contractId]/page";

describe("Source canonical route contract", () => {
  beforeEach(() => {
    redirectMock.mockClear();
  });

  it("mounts the governed workspace directly at /source", () => {
    expect(SourcePage).toBe(SourceWorkspacePage);
  });

  it.each([
    ["retired event index", SourceEventsPage],
    ["retired decision queue", SourceDecisionQueuePage],
  ])("redirects the %s to /source", (_label, route) => {
    route();

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/source");
  });

  it("preserves vendor-portfolio query context on the canonical route", async () => {
    await ArchivedSourceVendorPortfolioRoute({
      searchParams: Promise.resolve({
        asOf: "2027-06-30",
        client: "tenant-alias",
      }),
    });

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith(
      "/source?asOf=2027-06-30&client=tenant-alias",
    );
  });

  it("preserves contract focus and query context on the canonical route", async () => {
    await ArchivedSourceContract360Route({
      params: Promise.resolve({ contractId: "CTR%2D001" }),
      searchParams: Promise.resolve({
        asOf: "2027-06-30",
        client: "tenant-alias",
      }),
    });

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith(
      "/source?contractId=CTR-001&asOf=2027-06-30&client=tenant-alias",
    );
  });
});
