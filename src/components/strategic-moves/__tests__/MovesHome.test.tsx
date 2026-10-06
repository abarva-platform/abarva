/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import {
  MovesHome,
  type MovesHomeProps,
} from "../MovesHome";

const props: MovesHomeProps = {
  tenantName: "Meridian Health",
  headline: "8 moves in flight · 3 waiting on a decision",
  valueLine: "Value declared on 1 of 8 — the rest declare value in Charter.",
  newMoveHref: "/strategic-moves/new",
  waiting: [
    {
      id: "w1",
      where: "P1 Charter · step 2",
      name: "Member Service Agent Assist",
      ask: "Confirm who approves scope, spend and phase advance.",
      sponsor: "VP Member Services",
      when: "3 days ago",
      href: "/strategic-moves/w1/phase/1",
    },
  ],
  moves: [
    {
      id: "m1",
      name: "Member Service Agent Assist",
      code: "IDN-MEMBER-2026",
      phaseLabel: "P1 Charter",
      phaseIndex: 1,
      status: "In charter",
      statusTone: "active",
      sponsor: "VP Member Services",
      value: "Declares in Charter",
      activity: "3 days ago",
      href: "/strategic-moves/m1",
    },
    {
      id: "m2",
      name: "Prior authorization automation",
      code: "IDN-PRIORAUTH-2026",
      phaseLabel: "P2 Discover",
      phaseIndex: 2,
      status: "Needs baseline",
      statusTone: "watch",
      sponsor: "Grace Okafor",
      value: "Declares in Charter",
      activity: "Yesterday",
      href: "/strategic-moves/m2",
    },
  ],
  reconciliation: {
    declaredPrograms: "38 programmes",
    trackedRecords: "52 records",
    declaredBudget: "$739.7M",
    declaredValue: "$845.9M",
  },
  footerNote: "Composite reference tenant · seed portfolio",
};

describe("MovesHome", () => {
  it("renders the headline, value line, and the New move action", () => {
    render(<MovesHome {...props} />);
    expect(
      screen.getByRole("heading", {
        name: "8 moves in flight · 3 waiting on a decision",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Value declared on 1 of 8/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New move" })).toHaveAttribute(
      "href",
      "/strategic-moves/new",
    );
  });

  it("shows 'Waiting on you' with the specific ask and a link to the move", () => {
    render(<MovesHome {...props} />);
    const waiting = screen.getByRole("region", { name: "Waiting on you" });
    expect(
      within(waiting).getByText(
        "Confirm who approves scope, spend and phase advance.",
      ),
    ).toBeInTheDocument();
    expect(within(waiting).getByText("P1 Charter · step 2")).toBeInTheDocument();
  });

  it("renders the all-moves table with a row per move and a phase rail", () => {
    const { container } = render(<MovesHome {...props} />);
    const table = screen.getByRole("table", { name: "All moves" });
    // header row + 2 move rows
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(within(table).getByText("Member Service Agent Assist")).toBeInTheDocument();
    expect(within(table).getByText("Needs baseline")).toBeInTheDocument();
    // phase rail: P2 move (phaseIndex 2) lights 3 of 6 dots
    const rows = container.querySelectorAll(".mh-row:not(.mh-row-head)");
    const secondRowOnDots = rows[1].querySelectorAll(".mh-rail-dot.on");
    expect(secondRowOnDots).toHaveLength(3);
  });

  it("renders the reconciliation panel with its governed caveat", () => {
    render(<MovesHome {...props} />);
    const recon = screen.getByRole("region", {
      name: "Reconciliation with client inventory",
    });
    expect(within(recon).getByText("38 programmes")).toBeInTheDocument();
    expect(within(recon).getByText("$739.7M")).toBeInTheDocument();
    expect(within(recon).getByText(/Reconciled, not merged/)).toBeInTheDocument();
  });

  it("hides the Waiting and reconciliation sections when empty", () => {
    render(
      <MovesHome
        {...props}
        waiting={[]}
        reconciliation={null}
        footerNote={undefined}
      />,
    );
    expect(
      screen.queryByRole("region", { name: "Waiting on you" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", {
        name: "Reconciliation with client inventory",
      }),
    ).not.toBeInTheDocument();
  });
});
