/**
 * @jest-environment jsdom
 */

// U-509. `U-508` made `canViewFinancialValues` a required prop on eight Source
// components, so a caller can no longer stay silent. It bounded itself to the
// prop contract and said so in its own test file: the components' OWN bodies
// were left alone and filed separately. This is that filing.
//
// The shape: a component can thread the flag correctly into every child and
// then print the same magnitude itself, from its own JSX, through a `formatUsd`
// call that consults no flag at all. `AbarVaSourceDashboard` redacts its alert
// panel and its event table and then prints "$98.3M under management" two lines
// above them.
//
// WHERE THE GATE BELONGS — the item offered two options and one of them is not
// available as written, which is the finding rather than a quibble:
//
//   (a) each call site reads the flag — an omission is not a compile error;
//   (b) `formatUsd` itself takes the flag as a required argument.
//
// (b) assumes one `formatUsd`. There is not one. `src/components/source` holds
// EIGHT independent local `formatUsd`/`formatCompactUsd` definitions, and the
// shared `@/lib/source/value-ledger` export is the IMPLEMENTATION of
// `formatSourceFinancialValue` — so requiring a flag on it would force that
// helper to pass `true` and re-author this exact defect one layer down.
//
// So the changed sites go through `formatSourceFinancialValue(value, flag)`,
// whose flag is already a required positional parameter. At a changed site an
// omission IS a compile error (TS2554), which is (b)'s enforceability obtained
// at a boundary that already exists. The last `describe` proves that arity is
// load-bearing rather than asserted.
//
// Both directions per changed site: restricted renders no magnitude, granted
// renders what it renders today. A component that restricts unconditionally
// must not satisfy this file.

import "@testing-library/jest-dom";
import { render } from "@testing-library/react";

jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("@/components/source/SourceSubNav", () => ({
  SourceSubNav: () => <nav data-testid="subnav-mock" />,
}));
jest.mock("@/components/agent/AgentDock", () => ({
  AgentDock: ({ workspace }: { workspace?: React.ReactNode }) => (
    <div data-testid="agent-dock-mock">{workspace}</div>
  ),
}));
jest.mock("@/lib/source/queries", () => ({}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/source",
  useSearchParams: () => new URLSearchParams(),
}));

import { AbarVaSourceDashboard } from "../AbarVaSourceDashboard";
import { SourceOptimizeContractPage } from "../SourceOptimizeContractPage";
import { formatSourceFinancialValue } from "@/lib/source/financial-display";
import { getSourceDashboardSeed } from "@/lib/source/mock-seed";
import type {
  ContractOptimizationCandidate,
  ContractOptimizationSpine,
} from "@/lib/source/data-model/contract-optimization-spine";

// Any string of the form $<digits>...<K|M|B> is a magnitude. The restricted
// assertions match the SHAPE rather than a list of figures, so a fifth
// disclosure added to either body later fails this file instead of slipping
// past a hard-coded set of four.
const MAGNITUDE = /\$\d[\d.,]*\s?[KMB]?/;

function dashboard(canView: boolean) {
  const { container } = render(
    <AbarVaSourceDashboard
      data={getSourceDashboardSeed()}
      canViewFinancialValues={canView}
    />,
  );
  return container;
}

// The four figures the item named, read from the seed rather than pasted, so
// this file cannot drift from the fixture it renders.
function seedFigures() {
  const data = getSourceDashboardSeed();
  const waitingOrBlocked = data.events.filter(
    (event) => event.blocker || event.status.startsWith("waiting_on"),
  );
  const mostExposed =
    data.events.find((event) => event.isAtRisk) ??
    waitingOrBlocked[0] ??
    data.events[0];
  return {
    valueAtStakeUsd: data.metrics.valueAtStakeUsd,
    mostExposedUsd: mostExposed?.valueAtStakeUsd ?? 0,
    waitingOrBlockedUsd: waitingOrBlocked.reduce(
      (total, event) => total + event.valueAtStakeUsd,
      0,
    ),
  };
}

const CANDIDATE: ContractOptimizationCandidate = {
  contractId: "ctr-u509",
  vendorRef: "vendor-u509",
  vendorName: "U509 Vendor",
  contractName: "U509 Managed Services Agreement",
  annualValue: 12_300_000,
  score: 71,
  rank: 1,
  band: "high",
  action: "Renegotiate",
  reasons: [],
};

function optimizeSpine(): ContractOptimizationSpine {
  return {
    selected: CANDIDATE,
    candidates: [CANDIDATE],
    topCandidates: [CANDIDATE],
    sourceConnections: [],
    missingEvidenceSources: [],
    contractStory: [],
    missingEvidenceStory: [],
  } as unknown as ContractOptimizationSpine;
}

function optimizeHeader(canView: boolean) {
  const { container } = render(
    <SourceOptimizeContractPage
      tenantName="U509 Tenant"
      asOfDateIso="2026-09-25T00:00:00.000Z"
      spine={optimizeSpine()}
      opportunitySet={null}
      canViewFinancialValues={canView}
    />,
  );
  return container.querySelector("header")?.textContent ?? "";
}

describe("U-509 — the dashboard's own body redacts, not only its children", () => {
  it("prints no magnitude anywhere in its own body when restricted", () => {
    const container = dashboard(false);
    const text = container.textContent ?? "";
    const figures = seedFigures();
    // Named, so a failure says WHICH of the four leaked rather than only that
    // the body contains a dollar sign somewhere.
    expect(text).not.toContain("$98.3M under management");
    expect(text).not.toMatch(/\$[\d.,]+\s?[KMB]? sits in waiting or blocked/);
    expect(figures.valueAtStakeUsd).toBeGreaterThan(0);
    expect(figures.mostExposedUsd).toBeGreaterThan(0);
    expect(figures.waitingOrBlockedUsd).toBeGreaterThan(0);
    // And the shape assertion, which is the one that catches a fifth line.
    expect(text).not.toMatch(MAGNITUDE);
  });

  it("names the restriction rather than rendering an empty slot", () => {
    const container = dashboard(false);
    const text = container.textContent ?? "";
    expect(text).toContain("Restricted under management");
    expect(text).toContain("Restricted sits in waiting or blocked events");
  });

  // PER CARRIER, and that is not a stylistic preference. The first draft of
  // this test asserted `toMatch(MAGNITUDE)` over the whole container, and a
  // mutation that made the body restrict UNCONDITIONALLY passed it 7 of 7 —
  // because the alert panel and the event table are granted in the same render
  // and their figures satisfied a container-wide match. Each of the four sites
  // is therefore asserted against the label it sits next to, so the assertion
  // cannot be met by some other figure on the page.
  it.each([
    ["narrative", /\$[\d.,]+\s?[KMB]? under management/],
    ["most-exposed", /Value exposed\$[\d.,]+\s?[KMB]?/],
    ["value-at-stake KPI", /Value At Stake\$[\d.,]+\s?[KMB]?/],
    ["waiting-or-blocked detail", /\$[\d.,]+\s?[KMB]? sits in waiting or blocked/],
  ])("still prints the %s figure when granted", (_label, pattern) => {
    expect(dashboard(true).textContent ?? "").toMatch(pattern);
  });
});

describe("U-509 — the Optimize page header is gated, not only its workflow pane", () => {
  // The census that this item's acceptance asked for found this one. It is a
  // DEFENCE-IN-DEPTH gap and must not be reported as a live disclosure: the
  // route starves the data when the flag is false, so `spine.selected` is null
  // there today. This suite reaches the branch the route cannot, which is
  // exactly why the component's own contract has to hold.
  it("prints no contract magnitude in the header when restricted", () => {
    const header = optimizeHeader(false);
    expect(header).toContain("U509 Vendor contract optimization");
    expect(header).not.toMatch(MAGNITUDE);
  });

  it("still prints the annual value in the header when granted", () => {
    const header = optimizeHeader(true);
    expect(header).toContain("$12.3M annual value");
  });
});

describe("U-509 — the chosen mechanism's arity is load-bearing", () => {
  // This is the whole argument for routing through `formatSourceFinancialValue`
  // rather than writing a ternary at each site. If the helper's second
  // parameter ever goes optional or acquires a default, this suppression stops
  // being an error and `tsc --noEmit` fails with "Unused '@ts-expect-error'
  // directive" — so the control fails in the direction the defect returns.
  it("rejects a flagless call at compile time", () => {
    const rejected = [
      // @ts-expect-error U-509: the visibility flag is a required argument
      () => formatSourceFinancialValue(12_300_000),
    ];
    expect(rejected).toHaveLength(1);
  });

  it("still answers both ways at run time", () => {
    expect(formatSourceFinancialValue(12_300_000, true)).toMatch(MAGNITUDE);
    expect(formatSourceFinancialValue(12_300_000, false)).toBe("Restricted");
  });
});
