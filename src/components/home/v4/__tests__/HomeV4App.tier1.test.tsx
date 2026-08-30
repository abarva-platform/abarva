/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";

import fs from "node:fs";
import path from "node:path";

import { fireEvent, render, screen } from "@testing-library/react";

import type { HomeReviewBundle } from "@/lib/home/preview/types";
import { HomeV4App } from "../HomeV4App";
import {
  collectTier1ExecutiveStoryRawClaimStatements,
  cxoText,
  findHomeTier1GenerationLanguage,
} from "../ExecutiveStoryPage";

jest.mock("@/components/home/preview/HomeAvaChat", () => ({
  HomeAvaChat: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const REPO_ROOT = process.cwd();

function loadMeridianBundle(): HomeReviewBundle {
  return JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "src/lib/home/preview/golden-snapshots/meridian-health.json"), "utf8"),
  ) as HomeReviewBundle;
}

describe("Home v4 Tier 1 executive story", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/home/preview");
  });

  it("opens on a single executive story instead of the old chapter tabs", () => {
    const { container } = render(<HomeV4App bundle={loadMeridianBundle()} tenantKey="meridian-health" />);

    expect(screen.getAllByText("Executive story").length).toBeGreaterThan(0);
    expect(screen.getByText("Open on the number")).toBeInTheDocument();
    expect(screen.getByText(/Six-section executive story: 6 of 6 sections present/i)).toBeInTheDocument();
    expect(screen.queryByText("The briefing")).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

    const sections = Array.from(container.querySelectorAll("[data-home-tier1-section]"));
    expect(sections).toHaveLength(6);
    expect(sections.map((section) => section.getAttribute("data-home-tier1-terminal-state"))).toEqual(
      Array(6).fill("published"),
    );
    expect(screen.getByRole("heading", { name: "What this enterprise is" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What it is betting on" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What it runs on" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What it costs and returns" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What is exposed" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What needs attention" })).toBeInTheDocument();
  });

  it("keeps evidence drilldowns available without making them the opening experience", () => {
    const bundle = loadMeridianBundle();
    const appCount =
      bundle.technologyEstate?.recordTypes.find((recordType) => recordType.objectType === "application_system")?.rows.length ?? 0;
    render(<HomeV4App bundle={bundle} tenantKey="meridian-health" />);

    fireEvent.click(screen.getByRole("button", { name: /Open architecture map/i }));

    expect(screen.getByRole("heading", { name: /Current-state architecture map/i })).toBeInTheDocument();
    expect(document.body.textContent ?? "").toMatch(new RegExp(`${appCount}\\s+applications`, "i"));
  });

  it("keeps implementation vocabulary off the CXO opening path", () => {
    render(<HomeV4App bundle={loadMeridianBundle()} tenantKey="meridian-health" />);

    const visibleText = document.body.textContent ?? "";
    expect(visibleText).not.toMatch(/\bECL\b/);
    expect(visibleText).not.toMatch(/\bprojection\b/i);
    expect(visibleText).not.toMatch(/\bserving view\b/i);
    expect(visibleText).not.toMatch(/\bloaded rows?\b/i);
    expect(visibleText).not.toMatch(/\bcanonical entit(?:y|ies)\b/i);
    expect(visibleText).not.toMatch(/\bpayload\b/i);
    expect(visibleText).not.toMatch(/\bschema\b/i);
    expect(visibleText).not.toMatch(/\bsource room\b/i);
    expect(visibleText).not.toMatch(/\bprovider flag\b/i);
    expect(visibleText).not.toMatch(/not enough verified evidence yet/i);
    expect(visibleText).not.toMatch(/coverage gap in the build/i);
  });

  it("keeps implementation vocabulary out of the raw Tier 1 claim inputs before render cleanup", () => {
    const rawClaimStatements = collectTier1ExecutiveStoryRawClaimStatements(loadMeridianBundle().chapters);
    const launderedInputs = rawClaimStatements.filter((statement) => cxoText(statement) !== statement);
    const generationLanguage = findHomeTier1GenerationLanguage(rawClaimStatements);

    expect({
      rawClaimStatements: rawClaimStatements.length,
      unlaunderedClaimCount: launderedInputs.length,
      generationLanguage,
    }).toEqual({
      rawClaimStatements: 21,
      unlaunderedClaimCount: 0,
      generationLanguage: [],
    });
  });

  it("proves the raw-language gate catches a builder term that the renderer does not launder", () => {
    const findings = findHomeTier1GenerationLanguage([
      "The adapter hydration step completed after the executive claim was drafted.",
    ]);

    expect(findings).toEqual([
      {
        term: "adapter",
        statement: "The adapter hydration step completed after the executive claim was drafted.",
      },
      {
        term: "hydration step",
        statement: "The adapter hydration step completed after the executive claim was drafted.",
      },
    ]);
  });
});
