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

it("integrates context, systems, architecture, Evidence action, and URL tab state", () => {
  render(<HomeEnterpriseLandscapeV2 />);

  fireEvent.click(screen.getByRole("tab", { name: "Context" }));
  expect(
    screen.getByRole("heading", {
      name: "Loaded context, integrated into the Home story",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Global airline operating context"),
  ).toBeInTheDocument();
  expect(
    screen.getAllByText("Applications, cloud, data, integration").length,
  ).toBeGreaterThan(0);
  expect(
    screen.getByText("architecture_graph · data_capability_packet"),
  ).toBeInTheDocument();
  expect(window.location.search).toBe("?view=context");

  fireEvent.click(screen.getByRole("tab", { name: "Architecture" }));
  expect(
    screen.getByRole("heading", {
      name: "Data and AI current-state architecture by lane",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getAllByText("Applications and core systems").length,
  ).toBeGreaterThan(0);
  expect(
    screen.getAllByText("Integration, ETL, and event movement").length,
  ).toBeGreaterThan(0);
  expect(
    screen.getAllByText("Storage, EDW, and data marts").length,
  ).toBeGreaterThan(0);
  expect(screen.getAllByText("Teradata Vantage").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Power BI Copilot").length).toBeGreaterThan(0);
  expect(screen.getAllByText("On-prem / private DC").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Hybrid cloud").length).toBeGreaterThan(0);
  expect(screen.getAllByText("ERP and finance core").length).toBeGreaterThan(0);
  expect(
    screen.getByText("Resolve contradictory lifecycle states"),
  ).toBeInTheDocument();
  expect(screen.getByText("Route value claims to Tower")).toBeInTheDocument();
  expect(window.location.search).toBe("?view=architecture");

  fireEvent.click(screen.getByRole("button", { name: "Evidence" }));
  expect(
    screen.getByRole("heading", { name: "Evidence and content provenance" }),
  ).toBeInTheDocument();
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
    screen.getByRole("heading", {
      name: "Data and AI current-state architecture by lane",
    }),
  ).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Architecture" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});
