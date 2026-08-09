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

it("integrates context and architecture into the approved eight-tab canvas", () => {
  render(<HomeEnterpriseLandscapeV2 />);

  expect(
    screen.queryByRole("tab", { name: "Context" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("tab", { name: "Architecture" }),
  ).not.toBeInTheDocument();

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
  expect(window.location.search).toBe("?view=patterns");

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
    screen.getByRole("img", {
      name: /Data and AI mesh diagram showing source applications, integration, governed data products, BI, analytics, AI agents, and proof gates/i,
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("img", {
      name: /Private cloud and mainframe architecture diagram showing two data centers, IBM mainframe, private cloud, replicated operations, integration, and cloud analytics egress/i,
    }),
  ).toBeInTheDocument();
  expect(screen.getByText("Data and AI mesh")).toBeInTheDocument();
  expect(screen.getByText("ERP and finance core")).toBeInTheDocument();
  expect(screen.getByText("Private cloud and mainframe")).toBeInTheDocument();
  expect(screen.getByText("Digital airline channels")).toBeInTheDocument();
  expect(screen.getByText("IBM z/OS · CICS")).toBeInTheDocument();
  expect(screen.getByText("DB2 · MQ")).toBeInTheDocument();
  expect(screen.getByText("Private DC / mainframe")).toBeInTheDocument();
  expect(screen.getByText("Digital edge")).toBeInTheDocument();
  expect(screen.getByText("Teradata EDW · marts")).toBeInTheDocument();
  expect(screen.getByText("Power BI · Tableau")).toBeInTheDocument();
  expect(screen.getByText("Ops Control · Crew · MRO")).toBeInTheDocument();
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
    screen.getByRole("heading", { name: "Normalized enterprise posture" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Posture" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

it("redirects legacy Context and Architecture view params into approved tabs", () => {
  window.history.replaceState(null, "", "/home?view=context");
  const { unmount } = render(<HomeEnterpriseLandscapeV2 />);
  expect(screen.getByRole("tab", { name: "Patterns" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(window.location.search).toBe("?view=patterns");

  unmount();
  window.history.replaceState(null, "", "/home?view=architecture");
  render(<HomeEnterpriseLandscapeV2 />);
  expect(screen.getByRole("tab", { name: "Coherence" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(window.location.search).toBe("?view=coherence");
});
