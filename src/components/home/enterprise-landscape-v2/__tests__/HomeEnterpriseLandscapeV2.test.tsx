/**
 * @jest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { HomeEnterpriseLandscapeV2 } from "../HomeEnterpriseLandscapeV2";
import type { OrientationPack } from "@/lib/home/orientation-pack-read-adapter";

/**
 * Home's shell, tested on the two things that are easy to get wrong and expensive when wrong:
 * what a tenant is allowed to see, and what the page says when it has nothing to say.
 *
 * The previous tests asserted "$2.35B" and "$2.18B" — a technology budget and a prior-year actual
 * that were string literals with no data path behind either. They passed for as long as nobody
 * changed the literals, which is the opposite of what a test is for. They are gone.
 */

const pack: OrientationPack = {
  tenantKey: "meridian-health",
  buildVersion: "test-build",
  generatedAt: "2026-08-18T00:00:00Z",
  blocks: [
    {
      id: "identity",
      heading: "Who this organisation is",
      question: "What business are we actually in?",
      facts: [{ label: "Revenue", value: "$25.00B" }],
      narrative: null,
    },
    {
      id: "organisation",
      heading: "How the organisation is arranged",
      question: "How are we organised?",
      facts: [{ label: "Operating segments", value: "4" }],
      narrative: "Four operating segments are recorded.",
    },
  ],
  dimensions: [
    {
      key: "applications",
      objectType: "application_system",
      label: "Applications and systems",
      recordCount: 301,
      distinctNameCount: 301,
      evidencedCount: 301,
      sampleEntities: ["Epic EHR"],
      categories: [],
      numerics: [],
      sparseAttributes: [],
      notable: [],
      insight: null,
    },
  ],
  provenance: {
    packVersion: "v1",
    status: "candidate",
    validationStatus: "pass",
    claudeModel: "claude-sonnet-5",
    promptVersion: "home-orientation/v1",
    qualityScore: 1,
    approvedBy: null,
    approvedAt: null,
    narrativesGenerated: 1,
    narrativesRejected: 1,
  },
};

describe("Home enterprise landscape shell", () => {
  it("renders orientation tabs named after the reader's question", () => {
    render(<HomeEnterpriseLandscapeV2 pack={pack} />);
    for (const label of [
      "Who we are",
      "Strategy",
      "How we're measured",
      "What we run",
      "What people say",
      "Where we stand",
      "Explore the data",
    ]) {
      expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
    }
  });

  it("withholds authored tabs from a tenant they were not written for", () => {
    // The architecture and evidence content belongs to one client. Rendering it for another is a
    // cross-tenant leak, not a missing-content gap, so it must not appear at all.
    render(<HomeEnterpriseLandscapeV2 pack={pack} showAuthoredTabs={false} />);
    expect(screen.queryByRole("tab", { name: "Architecture" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Evidence" })).toBeNull();
    expect(screen.getByRole("tab", { name: "Who we are" })).toBeInTheDocument();
  });

  it("shows authored tabs for the tenant they belong to", () => {
    render(<HomeEnterpriseLandscapeV2 pack={pack} showAuthoredTabs />);
    expect(
      screen.getByRole("tab", { name: "Architecture" }),
    ).toBeInTheDocument();
  });

  it("renders facts even when the narrative was withheld", () => {
    // A block whose generated prose failed validation still carries every figure. Losing the
    // sentence must never lose the data.
    render(<HomeEnterpriseLandscapeV2 pack={pack} />);
    expect(screen.getByText("$25.00B")).toBeInTheDocument();
    expect(
      screen.getAllByText(/Narrative not generated/).length,
    ).toBeGreaterThan(0);
  });

  it("states that the build has not run rather than showing an empty page", () => {
    // "No pack" and "this client has no data" are different claims. Only one of them is true here,
    // and showing a blank panel asserts the wrong one.
    render(<HomeEnterpriseLandscapeV2 pack={null} showAuthoredTabs={false} />);
    expect(screen.getAllByText(/Not yet generated/).length).toBeGreaterThan(0);
  });

  it("surfaces that generated content has not been reviewed by a person", () => {
    render(<HomeEnterpriseLandscapeV2 pack={pack} />);
    expect(screen.getAllByText("Not yet reviewed").length).toBeGreaterThan(0);
  });

  it("keeps orientation build telemetry out of the client-facing provenance strip", () => {
    render(<HomeEnterpriseLandscapeV2 pack={pack} />);

    expect(screen.getAllByText("Not yet reviewed").length).toBeGreaterThan(0);
    expect(screen.queryByText("Build test-build")).not.toBeInTheDocument();
    expect(screen.queryByText("Validation pass")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Narrative claude-sonnet-5"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("1 narrated · 1 withheld"),
    ).not.toBeInTheDocument();
  });
});
