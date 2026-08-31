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
  return attachStoryPlan(JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "src/lib/home/preview/golden-snapshots/meridian-health.json"), "utf8"),
  ) as HomeReviewBundle);
}

function chapterClaims(chapter: HomeReviewBundle["chapters"][number]) {
  return [...chapter.key_insights, ...chapter.tensions, ...chapter.what_to_watch];
}

function attachStoryPlan(bundle: HomeReviewBundle): HomeReviewBundle {
  const allClaims = bundle.chapters.flatMap((chapter) =>
    chapterClaims(chapter).map((claim, index) => {
      claim.claim_ref = claim.claim_ref ?? `${chapter.chapterId}_fixture_claim_${String(index + 1).padStart(3, "0")}`;
      return { ...claim, chapterId: chapter.chapterId, claimRef: claim.claim_ref };
    }),
  );
  const commercialPattern = /IBM Corporation|largest supplier group|contract value|vendor|supplier|contract|commercial exposure/i;
  const evidenceBoundaryPattern =
    /not supplied|not yet supplied|not available|does not yet establish|should therefore be limited|do not infer|coverage gap|evidence gap|missing evidence|not enough verified evidence|not client-attested|synthetic/i;
  const unsuitableOpening = (statement: string) => commercialPattern.test(statement) || evidenceBoundaryPattern.test(statement);
  const opening =
    allClaims.find((claim) => claim.chapterId === "executive_brief" && !unsuitableOpening(claim.statement)) ??
    allClaims.find((claim) => !unsuitableOpening(claim.statement)) ??
    null;
  const scale = allClaims.find((claim) => claim.claimRef !== opening?.claimRef && /\d/.test(claim.statement)) ?? null;
  const sectionClaims = (chapterIds: string[]) => allClaims.filter((claim) => chapterIds.includes(claim.chapterId));
  const section = (
    sectionId: "enterprise" | "bets" | "runs-on" | "costs-returns" | "exposed" | "attention",
    chapterIds: string[],
  ) => {
    const claims = sectionId === "enterprise" && opening ? [opening, ...sectionClaims(chapterIds)] : sectionClaims(chapterIds);
    const unique = Array.from(new Map(claims.map((claim) => [claim.claimRef, claim])).values());
    return {
      sectionId,
      state: unique.length ? "published" as const : "deferred" as const,
      leadClaimRef: unique[0]?.claimRef ?? null,
      supportingClaimRefs: unique.slice(1, 4).map((claim) => claim.claimRef),
      reasonCode: unique.length ? null : "no_verified_claim_for_section",
    };
  };
  bundle.executiveStoryPlan = {
    contractVersion: "home-executive-story-plan/v1",
    tenantKey: bundle.tenantKey,
    assessmentId: "fixture",
    snapshotId: null,
    openingThesisClaimRef: opening?.claimRef ?? null,
    openingSupportingClaimRefs: allClaims
      .filter((claim) => claim.claimRef !== opening?.claimRef)
      .filter((claim) => !unsuitableOpening(claim.statement))
      .slice(0, 3)
      .map((claim) => claim.claimRef),
    scaleFactRef: scale?.claimRef ?? null,
    decisions: [],
    sectionOrder: ["enterprise", "bets", "runs-on", "costs-returns", "exposed", "attention"],
    sections: [
      section("enterprise", ["our_business", "executive_brief"]),
      section("bets", ["strategy_value_creation"]),
      section("runs-on", ["how_we_operate", "technology_data"]),
      section("costs-returns", ["performance_value"]),
      section("exposed", ["technology_data", "what_needs_attention"]),
      section("attention", ["what_needs_attention", "leadership_perspective"]),
    ],
    chapterStates: Object.fromEntries(
      bundle.chapters.map((chapter) => [
        chapter.chapterId,
        {
          state: chapterClaims(chapter).length ? "published" : "deferred",
          reasonCode: chapterClaims(chapter).length ? null : "no_verified_claims",
        },
      ]),
    ) as NonNullable<HomeReviewBundle["executiveStoryPlan"]>["chapterStates"],
    heroVisualDatasetRef: "application_landscape_by_function",
    overallEvidenceBoundary: "Fixture story plan uses published claim refs.",
    sourceClaimRefs: allClaims.map((claim) => claim.claimRef),
    storyPlanHash: "fixture-story-plan",
  };
  return bundle;
}

describe("Home v4 Tier 1 executive story", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/home/preview");
  });

  it("opens on a single executive story instead of the old chapter tabs", () => {
    const { container } = render(<HomeV4App bundle={loadMeridianBundle()} tenantKey="meridian-health" />);

    expect(screen.getAllByText("Executive story").length).toBeGreaterThan(0);
    expect(screen.getByText("Open on the thesis")).toBeInTheDocument();
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

  it("opens the executive story on enterprise shape, not supplier concentration", () => {
    render(<HomeV4App bundle={loadMeridianBundle()} tenantKey="meridian-health" />);

    const hero = document.querySelector("[data-home-tier1-hero-metric]");
    expect(hero?.textContent ?? "").toMatch(/\b(?:provider|health plan|estate|workload|risk|value|operating model|priority)\b/i);
    expect(hero?.textContent ?? "").not.toMatch(/\b(?:vendor|supplier|contract|commercial exposure)\b/i);
  });

  it("does not let supplier concentration lead the enterprise identity section", () => {
    const bundle = JSON.parse(JSON.stringify(loadMeridianBundle())) as HomeReviewBundle;
    const executive = bundle.chapters.find((chapter) => chapter.chapterId === "executive_brief");
    const business = bundle.chapters.find((chapter) => chapter.chapterId === "our_business");
    expect(executive).toBeTruthy();
    expect(business).toBeTruthy();
    executive!.key_insights = [
      {
        statement:
          "The largest application functions by recorded application count are Clinical Operations (167 of 750, 22.3%) and Health Plan Operations (122 of 750, 16.3%).",
        evidence_ids: ["sig_ecl_application_function_ranking_012"],
        claim_type: "FACT",
        confidence: "high",
      },
    ];
    business!.key_insights = [
      {
        statement:
          "IBM Corporation is the largest supplier group at 12.2% of reviewed contract value; the top five supplier groups account for 47.1%.",
        evidence_ids: ["sig_ecl_vendor_concentration_004"],
        claim_type: "FACT",
        confidence: "high",
      },
    ];
    attachStoryPlan(bundle);

    const { container } = render(<HomeV4App bundle={bundle} tenantKey="meridian-health" />);

    const enterpriseSection = container.querySelector('[data-home-tier1-section="enterprise"]');
    const lead = enterpriseSection?.querySelector("[data-home-tier1-section-body] p");
    expect(lead?.textContent ?? "").toMatch(/application functions/i);
    expect(lead?.textContent ?? "").not.toMatch(/IBM Corporation|largest supplier group|contract value/i);
    expect(enterpriseSection?.textContent ?? "").not.toMatch(/IBM Corporation|largest supplier group/i);
  });

  it("does not let evidence-boundary caveats become the opening thesis", () => {
    const bundle = JSON.parse(JSON.stringify(loadMeridianBundle())) as HomeReviewBundle;
    const executive = bundle.chapters.find((chapter) => chapter.chapterId === "executive_brief");
    expect(executive).toBeTruthy();
    executive!.key_insights = [
      {
        statement:
          "Segment revenue, customer economics, and formal enterprise identity attributes are not supplied by the current Home narrative input; business-model conclusions should therefore be limited.",
        evidence_ids: ["ctx_ecl_scope_business_economics_001"],
        claim_type: "OBSERVATION",
        confidence: "high",
      },
      {
        statement:
          "Clinical Operations is the largest application function and the primary operating-model risk because it carries 167 of 750 applications, making modernization sequencing a leadership decision rather than a technology cleanup.",
        evidence_ids: ["sig_ecl_application_function_002", "sig_ecl_application_criticality_003"],
        claim_type: "CROSS_DOMAIN_INSIGHT",
        confidence: "high",
      },
    ];
    executive!.tensions = [];
    executive!.what_to_watch = [];
    attachStoryPlan(bundle);

    render(<HomeV4App bundle={bundle} tenantKey="meridian-health" />);

    const hero = document.querySelector("[data-home-tier1-hero-metric]");
    expect(hero?.textContent ?? "").toMatch(/Clinical Operations|operating-model risk|modernization sequencing/i);
    expect(hero?.textContent ?? "").not.toMatch(/not supplied|should therefore be limited|business-model conclusions/i);
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

  it("renders empty chapter evidence as an executive terminal state, not a build apology", () => {
    const bundle = JSON.parse(JSON.stringify(loadMeridianBundle())) as HomeReviewBundle;
    const chapter = bundle.chapters.find((item) => item.chapterId === "strategy_value_creation");
    expect(chapter).toBeTruthy();
    chapter!.headline = "Strategy & Value Creation is deferred pending stronger evidence";
    chapter!.executive_synthesis =
      "This chapter is not ready for executive review. The current record does not yet connect enough verified statements to answer the leadership question with confidence.";
    chapter!.key_insights = [];
    chapter!.tensions = [];
    chapter!.what_to_watch = [];
    chapter!.questions_to_ask = [];
    chapter!.visual_opportunities = [];
    chapter!.limitations = [
      "No verified statements are linked to this chapter yet; review the source coverage before using it in an executive readout.",
    ];
    window.history.replaceState(null, "", "/home/preview#strategy_value_creation");

    render(<HomeV4App bundle={bundle} tenantKey="meridian-health" />);

    const visibleText = document.body.textContent ?? "";
    expect(screen.getByText("Decision this page supports")).toBeInTheDocument();
    expect(screen.getByText("Record signal")).toBeInTheDocument();
    expect(visibleText).toMatch(/not ready for executive review/i);
    expect(visibleText).not.toMatch(/not enough verified evidence yet/i);
    expect(visibleText).not.toMatch(/coverage gap in the build/i);
    expect(visibleText).not.toMatch(/No verified claims were routed/i);
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
      rawClaimStatements: 46,
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
