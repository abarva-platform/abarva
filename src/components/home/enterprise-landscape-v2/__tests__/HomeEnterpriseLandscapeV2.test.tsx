/**
 * @jest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { HomeEnterpriseLandscapeV2 } from "@/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2";

beforeEach(() => {
  window.history.replaceState(null, "", "/home");
});

it("renders the compact executive Summary without the old AI Success thesis", () => {
  render(<HomeEnterpriseLandscapeV2 />);

  expect(
    screen.getByRole("heading", { name: "Executive read" }),
  ).toBeInTheDocument();
  expect(screen.getAllByText("$2.35B").length).toBeGreaterThan(0);
  expect(screen.getAllByText("$2.18B").length).toBeGreaterThan(0);
  expect(screen.getAllByText("$1.48B").length).toBeGreaterThan(0);
  expect(screen.getAllByText("119").length).toBeGreaterThan(0);
  expect(screen.getByText("Strength to preserve")).toBeInTheDocument();
  expect(screen.getByText("Structural constraint")).toBeInTheDocument();
  expect(screen.getByText("Transformation in motion")).toBeInTheDocument();

  expect(
    screen.queryByText(/AI scale is real. Value management has not caught up/i),
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/source pending/i)).not.toBeInTheDocument();
});

it("preserves context and architecture as native Home tabs", () => {
  render(<HomeEnterpriseLandscapeV2 />);

  expect(
    screen.getByRole("tab", { name: "Context" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("tab", { name: "Architecture" }),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("tab", { name: "Patterns" }));
  expect(
    screen.getByRole("heading", {
      name: "Balanced enterprise portrait",
    }),
  ).toBeInTheDocument();
  expect(screen.getByText("Operationally critical")).toBeInTheDocument();
  expect(
    screen.getByText("Investment capacity, constrained flexibility"),
  ).toBeInTheDocument();
  expect(
    screen.getByText("AI-enabled, outcome proof developing"),
  ).toBeInTheDocument();
  expect(screen.getAllByText("Architecture graph").length).toBeGreaterThan(0);
  expect(screen.getAllByText("586").length).toBeGreaterThan(0);
  expect(
    screen.queryByLabelText(
      "Enterprise operating system pattern map stored SVG exhibit",
    ),
  ).not.toBeInTheDocument();
  expect(window.location.search).toBe("?view=patterns");

  fireEvent.click(screen.getByRole("tab", { name: "Context" }));
  expect(
    screen.getByRole("heading", {
      name: "Loaded context, integrated into the Home story",
    }),
  ).toBeInTheDocument();
  expect(screen.getByText("Industry context")).toBeInTheDocument();
  expect(screen.getByText("Global airline operating context")).toBeInTheDocument();
  expect(window.location.search).toBe("?view=context");

  fireEvent.click(screen.getByRole("tab", { name: "Architecture" }));
  expect(
    screen.getByRole("heading", {
      name: "Scoped current-state architecture",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getAllByLabelText("Data and AI platform detailed architecture canvas")
      .length,
  ).toBeGreaterThan(0);
  expect(
    screen.getAllByLabelText(
      "Private cloud, data centers, and mainframe detailed architecture canvas",
    ).length,
  ).toBeGreaterThan(0);
  expect(screen.getAllByText("Data and AI platform").length).toBeGreaterThan(0);
  expect(screen.getAllByText("ERP and finance core").length).toBeGreaterThan(0);
  expect(
    screen.getAllByText("Private cloud, data centers, and mainframe").length,
  ).toBeGreaterThan(0);
  expect(screen.getAllByText("Digital airline channels").length).toBeGreaterThan(0);

  fireEvent.click(screen.getByRole("tab", { name: "Coherence" }));
  expect(
    screen.getByRole("heading", {
      name: "Why enterprise coherence is difficult",
    }),
  ).toBeInTheDocument();
  expect(screen.getByText("Enterprise constraint map")).toBeInTheDocument();
  expect(
    screen.getAllByText("Current-state architecture exhibits").length,
  ).toBeGreaterThan(0);
  expect(
    screen.queryByLabelText(
      "Scoped architecture diagram index stored SVG exhibit",
    ),
  ).not.toBeInTheDocument();
  expect(screen.getAllByText("Operational sources").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Integration fabric").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Data platforms").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Analytics + AI").length).toBeGreaterThan(0);
  expect(screen.getAllByText("IBM mainframe").length).toBeGreaterThan(0);
  expect(
    screen.getAllByText(/z\/OS, CICS transactions, DB2 records/i).length,
  ).toBeGreaterThan(0);
  expect(screen.getAllByText("Hot / warm recovery").length).toBeGreaterThan(0);
  expect(
    screen.getAllByText("CDP + personalization").length,
  ).toBeGreaterThan(0);
  expect(screen.getAllByText("Agent runtime").length).toBeGreaterThan(0);
  expect(
    screen.getAllByText("Power BI, Tableau, scorecards, operating reviews")
      .length,
  ).toBeGreaterThan(0);
  expect(
    screen.getAllByText("Finance owns recognized value, not Claude").length,
  ).toBeGreaterThan(0);
  expect(
    screen.getAllByText(
      "Mainframe integration is a modernization constraint, not a footnote",
    ).length,
  ).toBeGreaterThan(0);
  expect(
    screen.getAllByText(
      "AI assist needs action guardrails and service recovery context",
    ).length,
  ).toBeGreaterThan(0);
  expect(
    screen.getAllByText(
      "A credible airline current-state diagram must explicitly show mainframe gravity, dual data centers, private cloud, replicated controls, and selective cloud egress.",
    ).length,
  ).toBeGreaterThan(0);
  expect(
    screen.queryByRole("img", {
      name: /Data and AI mesh diagram/i,
    }),
  ).not.toBeInTheDocument();
  expect(screen.getAllByText("Hybrid cloud").length).toBeGreaterThan(0);
  expect(
    screen.getByText("Resolve contradictory lifecycle states"),
  ).toBeInTheDocument();
  expect(screen.getByText("Route value claims to Tower")).toBeInTheDocument();
  expect(window.location.search).toBe("?view=coherence");

  fireEvent.click(screen.getByRole("button", { name: "Evidence" }));
  expect(
    screen.getByRole("heading", { name: "Executive confidence view" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Broad, uneven depth")).toBeInTheDocument();
  expect(screen.getByText("Identity facts")).toBeInTheDocument();
  expect(window.location.search).toBe("?view=evidence");

  const economics = screen.getByRole("tab", { name: "Economics" });
  fireEvent.click(economics);
  expect(
    screen.getByRole("heading", { name: "Economics without value overclaim" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByLabelText(
      "Economics and value-control architecture stored SVG exhibit",
    ),
  ).not.toBeInTheDocument();
  expect(screen.getByText("Budget commitment bridge")).toBeInTheDocument();
  expect(screen.getByText("63% committed")).toBeInTheDocument();
  expect(screen.getByText("$170.2M visible")).toBeInTheDocument();
  expect(
    screen.getByText("Claimable value not established"),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("Claimable value", { selector: "div" }),
  ).not.toBeInTheDocument();
  expect(window.location.search).toBe("?view=economics");

  economics.focus();
  fireEvent.keyDown(economics, { key: "ArrowRight" });
  expect(
    screen.getByRole("heading", { name: "Scoped current-state architecture" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Architecture" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  const architecture = screen.getByRole("tab", { name: "Architecture" });
  architecture.focus();
  fireEvent.keyDown(architecture, { key: "ArrowRight" });
  expect(
    screen.getByRole("heading", { name: "Normalized enterprise posture" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByLabelText(
      "Evidence and authority posture map stored SVG exhibit",
    ),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Posture" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

it("loads native Context and Architecture view params without redirect", () => {
  window.history.replaceState(null, "", "/home?view=context");
  const { unmount } = render(<HomeEnterpriseLandscapeV2 />);
  expect(screen.getByRole("tab", { name: "Context" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(window.location.search).toBe("?view=context");

  unmount();
  window.history.replaceState(null, "", "/home?view=architecture");
  render(<HomeEnterpriseLandscapeV2 />);
  expect(screen.getByRole("tab", { name: "Architecture" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(window.location.search).toBe("?view=architecture");
});
