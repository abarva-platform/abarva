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
  expect(screen.queryByText(/444 nodes/i)).not.toBeInTheDocument();
});

it("supports Evidence action, URL view state, and arrow-key tab movement", () => {
  render(<HomeEnterpriseLandscapeV2 />);

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
    screen.getByRole("heading", { name: "Current posture by evidence domain" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Posture" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});
