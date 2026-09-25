/** @jest-environment jsdom */

/**
 * U-507 — the Source estimate-assumption disclosure has to be ON a surface a
 * reader reaches, not merely renderable in its own suite.
 *
 * `EstimateAssumptionDisclosure` passed its own rendering suite for months
 * while its only importer was that suite, so every Source estimate shipped
 * without it. A test that mounts the disclosure directly cannot tell the two
 * states apart. This one renders the whole renewal cockpit — the reachable
 * surface at /source/renewal/[contractId] — from a cockpit built by the real
 * `buildRenewalCockpit`, and asserts the caveat and the assumptions reach the
 * DOM there.
 *
 * The should-cost range is worth disclosing because it is modelled, not read:
 * the builder assumes a vendor margin, a two-role run team, a rate card, a
 * term and an offshore split, none of which the reader can see in the numbers.
 * The assumption assertions below are keyed to those constants rather than to
 * prose, so moving a constant without moving the disclosure fails here.
 */

import { render, screen, within } from "@testing-library/react";
import type { VendorContractInput } from "@/lib/source/decision-queue/detector-inputs";
import {
  RENEWAL_SHOULD_COST_DURATION_MONTHS,
  RENEWAL_SHOULD_COST_OFFSHORE_RATIO,
  RENEWAL_SHOULD_COST_VENDOR_MARGIN_RATIO,
  buildRenewalCockpit,
  type RenewalCockpitInput,
} from "@/lib/source/renewal-cockpit/cockpit";
import { RenewalCockpitView } from "../RenewalCockpitView";
import { RenewalCockpitActionBar } from "../RenewalCockpitActionBar";

const AS_OF = new Date("2026-05-17T00:00:00Z");
const DISCLOSURE = "source-estimate-assumption-disclosure";

function isoOffset(days: number): string {
  const d = new Date(AS_OF);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function contract(overrides: Partial<VendorContractInput> = {}): VendorContractInput {
  return {
    contractId: "vc:test",
    vendorName: "TestVendor",
    product: "Test Product",
    category: "crm",
    annualSpendUsd: 500_000,
    termEndDate: isoOffset(120),
    autoRenew: false,
    noticePeriodDays: null,
    utilizationRate: 0.9,
    criticality: "medium",
    ...overrides,
  };
}

function cockpitInput(overrides: Partial<RenewalCockpitInput> = {}): RenewalCockpitInput {
  return {
    clientKey: "apexretail",
    contract: contract(),
    categoryBenchmarkUsd: 420_000,
    alternatives: [],
    asOf: AS_OF,
    ...overrides,
  };
}

function renderCockpit(overrides: Partial<RenewalCockpitInput> = {}) {
  const cockpit = buildRenewalCockpit(cockpitInput(overrides));
  render(<RenewalCockpitView cockpit={cockpit} />);
  return cockpit;
}

describe("U-507 — the renewal cockpit should-cost estimate carries its disclosure", () => {
  it("renders the caveat on the cockpit, not only in the component's own suite", () => {
    renderCockpit();

    const disclosure = screen.getByTestId(DISCLOSURE);
    expect(disclosure.textContent).toMatch(/Directional estimate only/i);
    expect(disclosure.textContent).toMatch(
      /validate against signed pricing, scope, utilization, and finance-approved baseline/i,
    );
  });

  it("states the assumptions the should-cost model actually made", () => {
    const cockpit = renderCockpit();
    const disclosure = screen.getByTestId(DISCLOSURE);

    const rendered = within(disclosure)
      .getAllByRole("listitem")
      .map((li) => li.textContent ?? "");
    expect(rendered.length).toBeGreaterThan(0);

    // Every assumption the builder recorded reaches the DOM — no truncation.
    expect(rendered).toEqual(cockpit.shouldCost.estimateAssumptions);

    // ...and each figure is read off the LINE THAT OWNS IT, not off the joined
    // text. Joining first made this vacuous: a mutation that pinned the
    // offshore sentence to a stale literal still passed, because the very next
    // sentence quotes the effective split and happened to carry the new number.
    // A second source absorbing the mutation is the failure mode; capture the
    // figure from its own sentence and compare it to the constant.
    const figure = (pattern: RegExp): number => {
      const owning = rendered.filter((line) => pattern.test(line));
      expect(owning).toHaveLength(1);
      return Number(pattern.exec(owning[0])![1]);
    };

    expect(figure(/Vendor margin assumed at (\d+)% of the quote/)).toBe(
      Math.round(RENEWAL_SHOULD_COST_VENDOR_MARGIN_RATIO * 100),
    );
    expect(figure(/Delivery assumed (\d+)% offshore/)).toBe(
      Math.round(RENEWAL_SHOULD_COST_OFFSHORE_RATIO * 100),
    );
    expect(figure(/over (\d+) months/)).toBe(RENEWAL_SHOULD_COST_DURATION_MONTHS);
  });

  it("puts the disclosure inside the should-cost card and nowhere else", () => {
    renderCockpit();

    // Exactly one — the timing, usage, leverage and alternatives cards are
    // ordinary non-estimate panels and must not acquire the caveat.
    const all = screen.getAllByTestId(DISCLOSURE);
    expect(all).toHaveLength(1);

    const card = all[0].parentElement?.closest("section");
    expect(card).not.toBeNull();
    expect(card?.textContent).toContain("Should-cost low");
    expect(card?.textContent).toContain("Should-cost high");
  });

  it("leaves an ordinary non-estimate Source panel without the caveat", () => {
    const cockpit = buildRenewalCockpit(cockpitInput());
    render(<RenewalCockpitActionBar cockpit={cockpit} />);

    expect(screen.queryAllByTestId(DISCLOSURE)).toHaveLength(0);
    expect(screen.queryByText(/Directional estimate only/i)).toBeNull();
  });
});
