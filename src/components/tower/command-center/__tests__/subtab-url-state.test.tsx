/**
 * @jest-environment jsdom
 */

/**
 * A sub-view must be linkable and must survive a reload.
 *
 * The six-tab shell shipped with sub-tab selection held in component state only, so
 * `/tower?tab=decisions` always opened on that tab's first sub-view no matter which one the person
 * was actually looking at — and a link to a specific view could not be sent at all. In a review
 * that means "look at this" degrades to "click through to the thing I meant".
 *
 * A `view` value is only honoured when it belongs to the tab the URL names. A stale one from a
 * different tab must not be trusted, because it would select nothing and silently fall back while
 * still sitting in the URL.
 */

import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { TowerCommandCenter } from "../TowerCommandCenter";

const replace = jest.fn();
let mockedSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: (...args: unknown[]) => replace(...args) }),
  usePathname: () => "/tower/command",
  useSearchParams: () => mockedSearchParams,
}));

jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <actual.ResponsiveContainer width={900} height={320}>
        {children}
      </actual.ResponsiveContainer>
    ),
  };
});

const view = buildTowerCommandCenterView(designFixtureMart(), {
  tenantName: "Fixture Tenant",
})!;

function renderPage() {
  return render(<TowerCommandCenter view={view} tenantName="Fixture Tenant" />);
}

function renderPageWithReviewDecisions() {
  const nextView = {
    ...view,
    summary: {
      ...view.summary,
      valueClaimCount: 3,
      usageSupportedClaimCount: 1,
      outcomeMeasuredClaimCount: 1,
      financeAttestedClaimCount: 1,
      claimableClaimCount: 1,
      promisedUsd: 3_000_000,
      financeValidatedUsd: 1_000_000,
      usageSupportedUsd: 1_000_000,
      claimableUsd: 1_000_000,
    },
  };
  return render(
    <TowerCommandCenter view={nextView} tenantName="Fixture Tenant" />,
  );
}

beforeEach(() => {
  replace.mockClear();
  mockedSearchParams = new URLSearchParams();
});

describe("sub-tab URL state", () => {
  it("opens on the sub-view named by the URL", () => {
    mockedSearchParams = new URLSearchParams("tab=decisions&view=owner");
    renderPage();
    expect(screen.getByRole("tab", { name: /By owner/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("ignores a view that does not belong to the named tab", () => {
    // `owner` is a decisions sub-view; on the tools tab it means nothing.
    mockedSearchParams = new URLSearchParams("tab=tools&view=owner");
    renderPage();
    expect(screen.getByRole("tab", { name: /Rollouts/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("writes the sub-view to the URL when one is chosen", () => {
    mockedSearchParams = new URLSearchParams("tab=decisions&view=queue");
    renderPage();
    fireEvent.click(screen.getByRole("tab", { name: /By owner/ }));
    expect(replace).toHaveBeenCalledWith(
      "/tower/command?tab=decisions&view=owner",
      { scroll: false },
    );
  });

  it("resets to the new tab's first sub-view when the tab changes", () => {
    mockedSearchParams = new URLSearchParams("tab=decisions&view=owner");
    renderPage();
    fireEvent.click(screen.getByRole("tab", { name: /Where the money goes/ }));
    expect(replace).toHaveBeenCalledWith(
      "/tower/command?tab=budget&view=shape",
      { scroll: false },
    );
  });

  it("carries no view for a tab that has no sub-views", () => {
    mockedSearchParams = new URLSearchParams("tab=decisions&view=owner");
    renderPage();
    fireEvent.click(screen.getByRole("tab", { name: /Today's verdict/ }));
    expect(replace).toHaveBeenCalledWith("/tower/command?tab=verdict", {
      scroll: false,
    });
  });

  it("sends decision review links to the evidence sub-view they name", () => {
    const cases: ReadonlyArray<[number, string]> = [
      [0, "/tower/command?tab=tools&view=portfolio"],
      [1, "/tower/command?tab=initiatives&view=proof"],
      [2, "/tower/command?tab=decisions&view=queue"],
    ];

    cases.forEach(([index, expected]) => {
      cleanup();
      replace.mockClear();
      mockedSearchParams = new URLSearchParams("tab=decisions&view=review");
      renderPageWithReviewDecisions();
      fireEvent.click(screen.getAllByRole("button", { name: /Review/ })[index]);
      expect(replace).toHaveBeenCalledWith(expected, { scroll: false });
    });
  });
});
