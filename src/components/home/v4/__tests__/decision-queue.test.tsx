/**
 * @jest-environment jsdom
 */

/**
 * The decision queue.
 *
 * The chapter that asks "what should leadership take up next" answered it with tables about
 * attention rather than a list of it. A table per family makes the reader assemble the queue.
 *
 * Every row comes from a declared field. Nothing is scored, weighted or inferred: a ranked list is
 * a claim about priority, and this one has to be the record's claim rather than ours.
 */
import "@testing-library/jest-dom";

import { render } from "@testing-library/react";

import { DecisionQueue, buildDecisionQueue } from "../DecisionQueue";
import type { EstateRow } from "../page-tables";

const risks: EstateRow[] = [
  {
    riskOrControlName: "Standing privileged credentials",
    severity: "high",
    controlStatus: "open",
  },
  {
    riskOrControlName: "Contained",
    severity: "high",
    controlStatus: "operating",
  },
  { riskOrControlName: "Minor", severity: "low", controlStatus: "open" },
];

const programs: EstateRow[] = [
  {
    programName: "RAF Modernisation",
    status: "at_risk",
    blockedReason: "funding unconfirmed",
  },
  { programName: "Community Connect", status: "execution_delayed" },
  { programName: "Steady", status: "on_track" },
];

const contracts: EstateRow[] = [
  {
    vendorName: "Inside notice",
    termEnd: "2026-09-30",
    noticePeriodDays: "90",
    autoRenewFlag: "no",
  },
  {
    vendorName: "Auto renews",
    termEnd: "2026-09-30",
    noticePeriodDays: "90",
    autoRenewFlag: "yes",
  },
  {
    vendorName: "Far off",
    termEnd: "2028-01-01",
    noticePeriodDays: "30",
    autoRenewFlag: "no",
  },
];

describe("what reaches the queue", () => {
  it("takes a risk only where severity and control state both say so", () => {
    const { items } = buildDecisionQueue({ risks });
    const names = items.map((i) => i.headline);
    expect(names).toContain("Standing privileged credentials");
    expect(names).not.toContain("Contained");
    expect(names).not.toContain("Minor");
  });

  it("takes a programme on its own declared status, not on a reading of its progress", () => {
    const { items } = buildDecisionQueue({ programs });
    expect(items.map((i) => i.headline)).toEqual(
      expect.arrayContaining(["RAF Modernisation", "Community Connect"]),
    );
    expect(items.map((i) => i.headline)).not.toContain("Steady");
  });

  it("carries the declared reason where the record gives one", () => {
    const { items } = buildDecisionQueue({ programs });
    const raf = items.find((i) => i.headline === "RAF Modernisation");
    expect(raf?.because).toMatch(/funding unconfirmed/);
  });

  it("measures a notice window against the record's date, never today's", () => {
    // A queue whose contents change with the day it is opened is not reproducible.
    const open = buildDecisionQueue({ contracts, asOf: "2026-08-21" });
    expect(open.items.map((i) => i.headline)).toEqual([
      "Inside notice — notice window is open",
    ]);
    const earlier = buildDecisionQueue({ contracts, asOf: "2026-01-01" });
    expect(earlier.items).toHaveLength(0);
  });

  it("puts what the record rates ahead of what it does not", () => {
    const { items } = buildDecisionQueue({ risks, programs });
    expect(items[0].rated).toBe("high");
  });
});

describe("what the queue says about itself", () => {
  it("names the predicates it checked and found nothing for", () => {
    const { checkedAndEmpty } = buildDecisionQueue({
      risks: [
        {
          riskOrControlName: "Fine",
          severity: "low",
          controlStatus: "operating",
        },
      ],
      programs: [{ programName: "Steady", status: "on_track" }],
    });
    expect(checkedAndEmpty).toHaveLength(2);
  });

  it("says a short queue is about the record, not about all being well", () => {
    const { container } = render(
      <DecisionQueue
        risks={[
          {
            riskOrControlName: "Fine",
            severity: "low",
            controlStatus: "operating",
          },
        ]}
        programs={[{ programName: "Steady", status: "on_track" }]}
      />,
    );
    const note = container.querySelector("[data-home-queue-checked]");
    expect(note).not.toBeNull();
    expect(note!.textContent ?? "").toMatch(
      /not a statement that all is well/i,
    );
  });

  it("renders nothing at all when no family is served", () => {
    const { container } = render(<DecisionQueue />);
    expect(container.innerHTML).toBe("");
  });
});
