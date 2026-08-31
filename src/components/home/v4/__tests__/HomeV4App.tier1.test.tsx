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
  const narrowProgramPattern = /named strategic priority|named program|named initiative|\d+(?:\.\d+)?%\s+complete|blocked on unconfirmed|single program/i;
  const individualAssetPattern = /regional server room|server room|appliance|cluster|single system|single platform|named infrastructure|named platform/i;
  const inventoryPattern =
    /largest application functions|recorded application count|data-movement inventory|recorded source-to-target movement rows|infrastructure or platform records|named infrastructure or platform examples|\d+(?:,\d{3})*(?:\.\d+)?\s+(?:applications|systems|source-target|data movements|flows|workload items|reports|ETL jobs|scripts|platforms|vendors|suppliers|contracts)|\d+(?:,\d{3})*(?:\.\d+)?\s+of\s+\d+(?:,\d{3})*/i;
  const consequencePattern = /because|therefore|so that|making|means leadership|requires leadership|materially changes|constrains|unlocks/i;
  const broadEnterprisePattern = /operating[-\s]model|business[-\s]model|value creation|provider|payer|health plan|member|patient|care delivery|book of business|leadership agenda|executive agenda/i;
  const unsuitableOpening = (statement: string) =>
    commercialPattern.test(statement) ||
    evidenceBoundaryPattern.test(statement) ||
    narrowProgramPattern.test(statement) ||
    individualAssetPattern.test(statement) ||
    (inventoryPattern.test(statement) && !consequencePattern.test(statement));
  const opening =
    allClaims.find((claim) => claim.chapterId === "executive_brief" && broadEnterprisePattern.test(claim.statement) && !unsuitableOpening(claim.statement)) ??
    allClaims.find((claim) => broadEnterprisePattern.test(claim.statement) && !unsuitableOpening(claim.statement)) ??
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

  it("opens on a single executive story canvas instead of the old chapter tabs or a long story scroll", () => {
    const { container } = render(<HomeV4App bundle={loadMeridianBundle()} tenantKey="meridian-health" />);

    expect(screen.getAllByText("Executive story").length).toBeGreaterThan(0);
    expect(screen.getByText("Boardroom thesis")).toBeInTheDocument();
    expect(screen.getByText(/6 of 6 sections ready/i)).toBeInTheDocument();
    expect(screen.getByText("Evidence basis")).toBeInTheDocument();
    expect(screen.queryByText("The briefing")).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

    const shell = container.querySelector("[data-home-tier1-shell]");
    expect(shell).toHaveStyle({ height: "100%", overflow: "hidden" });
    expect(container.querySelector("[data-home-tier1-main]")).toHaveStyle({ overflowY: "auto" });

    const sections = Array.from(container.querySelectorAll("[data-home-tier1-section]"));
    expect(sections).toHaveLength(1);
    expect(sections.map((section) => section.getAttribute("data-home-tier1-terminal-state"))).toEqual(
      ["published"],
    );
    expect(sections[0]).toHaveAttribute("data-home-tier1-section", "enterprise");
    expect(screen.getByRole("button", { name: /What this enterprise is/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: /What it is betting on/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /What it runs on/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "What it runs on" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /What it runs on/i }));

    const selectedSections = Array.from(container.querySelectorAll("[data-home-tier1-section]"));
    expect(selectedSections).toHaveLength(1);
    expect(selectedSections[0]).toHaveAttribute("data-home-tier1-section", "runs-on");
    expect(screen.getByRole("heading", { name: "What it runs on" })).toBeInTheDocument();
    expect(screen.queryByText("Boardroom thesis")).not.toBeInTheDocument();
  });

  it("keeps evidence drilldowns available without making them the opening experience", () => {
    const bundle = loadMeridianBundle();
    const appCount =
      bundle.technologyEstate?.recordTypes.find((recordType) => recordType.objectType === "application_system")?.rows.length ?? 0;
    render(<HomeV4App bundle={bundle} tenantKey="meridian-health" />);

    fireEvent.click(screen.getByRole("button", { name: /What it runs on/i }));
    fireEvent.click(screen.getByRole("button", { name: /Open architecture map/i }));

    expect(screen.getByRole("heading", { name: /Current-state architecture map/i })).toBeInTheDocument();
    expect(document.body.textContent ?? "").toMatch(new RegExp(`${appCount}\\s+applications`, "i"));
  });

  it("renders next-level entry cards as professional title and body text, never concatenated labels", () => {
    render(<HomeV4App bundle={loadMeridianBundle()} tenantKey="meridian-health" />);

    const architectureCard = screen.getByRole("button", {
      name: "Architecture: Conceptual blocks first, then logical and physical drilldown.",
    });
    expect(
      screen.getByRole("button", {
        name: "Data flow: Sources, integration, landing, analysis, and consumption layers.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Data browser: Slice and inspect the governed records behind the story.",
      }),
    ).toBeInTheDocument();

    expect(architectureCard.children).toHaveLength(2);
    expect(architectureCard.children[0]).toHaveTextContent("Architecture");
    expect(architectureCard.children[1]).toHaveTextContent("Conceptual blocks first, then logical and physical drilldown.");
    expect(architectureCard).toHaveAttribute("data-home-evidence-entry-card");
    expect(architectureCard).toHaveStyle({ display: "grid", gap: "10px", alignContent: "start" });
    expect(architectureCard.children[0]).toHaveAttribute("data-home-evidence-entry-title");
    expect(architectureCard.children[0]).toHaveStyle({ display: "block", margin: "0px" });
    expect(architectureCard.children[1]).toHaveAttribute("data-home-evidence-entry-body");
    expect(architectureCard.children[1]).toHaveStyle({ display: "block", margin: "0px" });
  });

  it("opens the executive story on enterprise shape, not supplier concentration", () => {
    render(<HomeV4App bundle={loadMeridianBundle()} tenantKey="meridian-health" />);

    const hero = document.querySelector("[data-home-tier1-hero-metric]");
    expect(hero?.textContent ?? "").toMatch(/\b(?:provider|health plan|estate|workload|risk|value|operating model|priority)\b/i);
    expect(hero?.textContent ?? "").not.toMatch(/\b(?:vendor|supplier|contract|commercial exposure|largest application functions|recorded application count)\b/i);
  });

  it("reports section readiness from published states instead of counting every terminal state as ready", () => {
    const bundle = loadMeridianBundle();
    expect(bundle.executiveStoryPlan).toBeTruthy();
    bundle.executiveStoryPlan!.sections = bundle.executiveStoryPlan!.sections.map((section, index) => {
      if (index < 2) return { ...section, state: "published" as const };
      if (index === 2) return { ...section, state: "refused" as const, reasonCode: "insufficient_evidence" };
      return { ...section, state: "deferred" as const, reasonCode: "not_ready_for_executive_story" };
    });

    render(<HomeV4App bundle={bundle} tenantKey="meridian-health" />);

    expect(screen.getByText("2 of 6 sections ready · 1 held · 3 deferred")).toBeInTheDocument();
    expect(screen.queryByText("6 of 6 sections ready")).not.toBeInTheDocument();
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

    render(<HomeV4App bundle={bundle} tenantKey="meridian-health" />);

    const hero = document.querySelector("[data-home-tier1-hero-metric]");
    expect(hero?.textContent ?? "").not.toMatch(/largest application functions|recorded application count/i);
    expect(hero?.textContent ?? "").not.toMatch(/IBM Corporation|largest supplier group|contract value/i);
  });

  it("does not let a standalone application-count inventory become the opening thesis", () => {
    const bundle = JSON.parse(JSON.stringify(loadMeridianBundle())) as HomeReviewBundle;
    const executive = bundle.chapters.find((chapter) => chapter.chapterId === "executive_brief");
    const business = bundle.chapters.find((chapter) => chapter.chapterId === "our_business");
    expect(executive).toBeTruthy();
    expect(business).toBeTruthy();
    executive!.key_insights = [
      {
        statement:
          "The largest application functions by recorded application count are Clinical Operations (167 of 750, 22.3%), Health Plan Operations (122 of 750, 16.3%), Data and Analytics (71 of 750, 9.5%), Revenue Cycle (68 of 750, 9.1%), Information Technology (62 of 750, 8.3%), Member Services (56 of 750, 7.5%), Provider Network (50 of 750, 6.7%), Finance (41 of 750, 5.5%).",
        evidence_ids: ["sig_ecl_application_function_ranking_012"],
        claim_type: "FACT",
        confidence: "high",
      },
    ];
    business!.key_insights = [
      {
        statement:
          "Clinical Operations is the largest application function and the primary operating-model risk because it carries 167 of 750 applications, making modernization sequencing a leadership decision rather than a technology cleanup.",
        evidence_ids: ["sig_ecl_application_function_002", "sig_ecl_application_criticality_003"],
        claim_type: "CROSS_DOMAIN_INSIGHT",
        confidence: "high",
      },
    ];
    attachStoryPlan(bundle);

    render(<HomeV4App bundle={bundle} tenantKey="meridian-health" />);

    const hero = document.querySelector("[data-home-tier1-hero-metric]");
    expect(hero?.textContent ?? "").toMatch(/operating-model risk/i);
    expect(hero?.textContent ?? "").not.toMatch(/largest application functions by recorded application count/i);
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
