/**
 * @jest-environment jsdom
 */

/**
 * Regression: a claim set of zero must read as "nothing to evaluate", never as success.
 *
 * On live production the Executive View rendered a green COMPLETE badge over "0 of 0" captioned
 * "Every value claim has usage-to-value support" — vacuously true, because `0 === 0` satisfied the
 * complete branch. The headline said "0 of 0 claims still need proof", and all three review
 * decisions rendered instructions to act on zero items ("Backfill measured outcome on the 0 claims
 * that carry no actual"). Together they presented an unloaded portfolio as a settled one, which is
 * the single most misleading state this surface can reach.
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { TowerCommandCenter } from "../TowerCommandCenter";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => "/tower/command",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <actual.ResponsiveContainer width={1200} height={420}>
        {children}
      </actual.ResponsiveContainer>
    ),
  };
});

/**
 * The design fixture already carries `valueClaimCount: 0` and no `valueClaims` array, so it *is*
 * the zero-claim case. That is precisely why this defect survived every prior test run and every
 * render-harness pass: the only fixture in the suite exercises the empty path, and "COMPLETE"
 * looked like a pass.
 */
function zeroClaimView() {
  return buildTowerCommandCenterView(designFixtureMart(), {
    tenantName: "Fixture Tenant",
  })!;
}

/** The same fixture with a populated claim set, to prove the guard is not always-on. */
function populatedClaimView() {
  const mart = designFixtureMart();
  return buildTowerCommandCenterView(
    {
      ...mart,
      command: {
        ...mart.command,
        valueClaimCount: 12,
        knownValueClaimCount: 12,
        usageSupportedClaimCount: 4,
        outcomeMeasuredClaimCount: 5,
        financeAttestedClaimCount: 2,
      },
    },
    { tenantName: "Fixture Tenant" },
  )!;
}

describe("Executive View with a zero claim set", () => {
  beforeEach(() => {
    render(
      <TowerCommandCenter view={zeroClaimView()} tenantName="Fixture Tenant" />,
    );
  });

  it("does not claim the usage gate is complete", () => {
    expect(screen.queryByText("COMPLETE")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Every value claim has usage-to-value support"),
    ).not.toBeInTheDocument();
  });

  it("says the usage gate has nothing to evaluate", () => {
    expect(
      screen.getByText(
        "No value claims in this read — the usage gate has nothing to evaluate",
      ),
    ).toBeInTheDocument();
  });

  it("does not headline '0 of 0 claims still need proof'", () => {
    expect(document.body.textContent).not.toMatch(/0 of 0 claims still need proof/);
    expect(document.body.textContent).toMatch(
      /No value claims are loaded, so nothing can be proven or disproven yet/,
    );
  });

  it("renders no review decisions rather than actions targeting zero items", () => {
    expect(document.body.textContent).not.toMatch(/the 0 claims/);
    expect(document.body.textContent).toMatch(
      /No claim set is loaded, so there is nothing to decide yet/,
    );
  });
});

describe("Executive View with a populated claim set", () => {
  beforeEach(() => {
    render(
      <TowerCommandCenter
        view={populatedClaimView()}
        tenantName="Fixture Tenant"
      />,
    );
  });

  it("renders the real usage ratio rather than the gap state", () => {
    expect(document.body.textContent).toMatch(/4 of 12/);
    expect(screen.queryByText("NO CLAIMS")).not.toBeInTheDocument();
  });

  it("renders review decisions", () => {
    expect(document.body.textContent).not.toMatch(
      /No claim set is loaded, so there is nothing to decide yet/,
    );
    expect(document.body.textContent).toMatch(/claims that carry no actual/);
  });

  it("headlines the real open-claim ratio", () => {
    expect(document.body.textContent).toMatch(/of 12 claims still need proof/);
  });
});
