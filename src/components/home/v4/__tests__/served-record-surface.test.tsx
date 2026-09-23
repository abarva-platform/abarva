/**
 * @jest-environment jsdom
 */

/**
 * The surface, rendered from the path the product actually serves.
 *
 * Every other suite here renders the stored copy of the record. The served view is built by a
 * different function, from different rows, and it writes its own chapter text when no statements
 * have been published for a chapter. Two build-state strings reached the live page through that
 * path while the stored-copy tests stayed green, because no fixture could reach the branch that
 * produced them.
 *
 * So this suite renders the served path and holds it to the same rules.
 */
import "@testing-library/jest-dom";
// Must precede the served-path builder import below; see the module for why.
import "../test-support/text-encoder-polyfill";

import { render, screen } from "@testing-library/react";

import {
  buildHomeReviewBundleFromEclProjectionRows,
  type HomeProjectionRow,
} from "@/lib/home/preview/ecl-projection-bundle";
import type { HomeReviewBundle } from "@/lib/home/preview/types";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import { HomeV4App } from "../HomeV4App";

jest.mock("@/components/home/preview/HomeAvaChat", () => ({
  HomeAvaChat: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

/** One row, enough for the builder to produce a bundle whose chapters have no published claims. */
function servedBundle(): HomeReviewBundle {
  const base = getHomeReviewBundle("meridian-health");
  if (!base) throw new Error("stored copy missing");
  const rows: HomeProjectionRow[] = [
    {
      page_key: "applications_systems",
      row_key: "app-1",
      row_type: "application",
      title: "Claims Administration Platform",
      summary: null,
      display_payload_json: {
        application_name: "Claims Administration Platform",
        business_function: "Health Plan Operations",
        hosting_model: "on_premise",
        lifecycle_state: "current",
      },
    } as HomeProjectionRow,
  ];
  return buildHomeReviewBundleFromEclProjectionRows(
    base,
    rows,
    "assessment-test",
  );
}

const CHAPTER_IDS = [
  "executive_brief",
  "our_business",
  "strategy_value_creation",
  "how_we_operate",
  "technology_data",
  "performance_value",
  "leadership_perspective",
  "what_needs_attention",
] as const;

function chapterSummaries(): HomeProjectionRow[] {
  return CHAPTER_IDS.map(
    (chapterId) =>
      ({
        page_key: chapterId,
        row_key: `${chapterId}_summary`,
        row_type: "summary",
        title: `${chapterId} headline`,
        summary: `${chapterId} summary.`,
        display_payload_json: {},
      }) as HomeProjectionRow,
  );
}

function servedBundleWithPublishedTechnology(): HomeReviewBundle {
  const base = getHomeReviewBundle("meridian-health");
  if (!base) throw new Error("stored copy missing");
  const rows: HomeProjectionRow[] = [
    ...chapterSummaries(),
    {
      page_key: "technology_data",
      row_key: "technology_data_claim_001",
      row_type: "chapter_claim",
      title: "Application and contract evidence is current",
      summary: "Applications and contracts are counted from the served record.",
      display_payload_json: {
        evidence_ids: ["sig_ecl_estate_001"],
        claim_type: "FACT",
      },
    } as HomeProjectionRow,
    ...["Claims Platform", "Member Portal"].map(
      (name, index) =>
        ({
          page_key: "applications_systems",
          row_key: `APP-${index + 1}`,
          row_type: "application",
          title: name,
          summary: null,
          display_payload_json: {
            application_name: name,
            business_function:
              index === 0 ? "Claims Operations" : "Member Services",
            hosting_model: "saas",
            annual_cost_usd: "1000000",
          },
        }) as HomeProjectionRow,
    ),
    ...[
      ["CTR-1", "Epic Systems Corporation", "1000000"],
      ["CTR-2", "AWS", "250000"],
    ].map(
      ([id, supplier, value]) =>
        ({
          page_key: "vendor_contracts",
          row_key: id,
          row_type: "contract",
          title: supplier,
          summary: null,
          display_payload_json: {
            contract_id: id,
            supplier_name: supplier,
            contract_name: `${supplier} agreement`,
            annualized_value_usd: value,
          },
        }) as HomeProjectionRow,
    ),
  ];
  return buildHomeReviewBundleFromEclProjectionRows(
    base,
    rows,
    "assessment-test",
  );
}

function bundleWithReviewedNarrativeAndLiveRows(): HomeReviewBundle {
  const base = getHomeReviewBundle("meridian-health");
  if (!base) throw new Error("stored copy missing");
  const value = JSON.parse(JSON.stringify(base)) as HomeReviewBundle;
  const estate = value.technologyEstate;
  if (!estate) throw new Error("technology estate missing");

  estate.recordTypes = estate.recordTypes.map((recordType) => {
    if (recordType.objectType === "vendor_contract") {
      const vendors = [
        ["IBM Corporation", 12200000],
        ["Oracle Corporation", 12100000],
        ["Epic Systems Corporation", 8400000],
        ["Microsoft Corporation", 7600000],
      ] as const;
      return {
        ...recordType,
        rows: Array.from({ length: 230 }, (_value, index) => {
          const [vendorName, annualSpendUsd] = vendors[index] ?? [
            `Supplier ${index + 1}`,
            264159.29203539825,
          ];
          return {
            vendorName,
            contractName: `${vendorName} agreement ${index + 1}`,
            annualSpendUsd,
            serviceCategory: "Managed Services",
            pricingHistory: index === 0 ? "Loaded pricing history" : "",
          };
        }),
      };
    }
    if (recordType.objectType === "data_asset_or_integration") {
      return {
        ...recordType,
        rows: Array.from({ length: 1710 }, (_value, index) => ({
          assetName: `Data asset ${index + 1}`,
          integrationPattern: index % 2 === 0 ? "api" : "etl",
        })),
      };
    }
    return recordType;
  });

  value.thesis.signalPacket.visualDatasets = {
    ...(value.thesis.signalPacket.visualDatasets ?? {}),
    vendor_spend_concentration: [
      { vendor: "IBM Corporation", sharePct: 12.2 },
      { vendor: "Oracle Corporation", sharePct: 12.1 },
      { vendor: "Epic Systems Corporation", sharePct: 8.4 },
      { vendor: "Microsoft Corporation", sharePct: 7.6 },
    ],
  };

  return value;
}

function servedBundleWithModelledInterview(): HomeReviewBundle {
  const base = getHomeReviewBundle("meridian-health");
  if (!base) throw new Error("stored copy missing");
  return buildHomeReviewBundleFromEclProjectionRows(
    base,
    [
      {
        page_key: "executive_interviews",
        row_key: "INT-001",
        row_type: "interview",
        title: "CFO interview response",
        summary: null,
        display_payload_json: {
          interview_id: "INT-001",
          executive_area: "CFO / Finance",
          stakeholder_role: "Chief Financial Officer",
          priority_theme: "value realization",
          synthetic_answer: "The value story needs clearer proof.",
        },
      } as HomeProjectionRow,
    ],
    "assessment-test",
  );
}

function open(hash: string) {
  window.location.hash = hash;
  return render(
    <HomeV4App bundle={servedBundle()} tenantKey="meridian-health" />,
  );
}

describe("the served path", () => {
  it("preserves reviewed executive chapters when the served record has no published chapter claims", () => {
    const base = getHomeReviewBundle("meridian-health");
    if (!base) throw new Error("stored copy missing");
    const served = servedBundle();

    expect(served.chapters.map((chapter) => chapter.headline)).toEqual(
      base.chapters.map((chapter) => chapter.headline),
    );
    expect(
      served.chapters.find((chapter) => chapter.chapterId === "executive_brief")
        ?.headline,
    ).toBe(
      base.chapters.find((chapter) => chapter.chapterId === "executive_brief")
        ?.headline,
    );
    expect(served.provenance.canonical_snapshot_hash).toBe(
      "ecl:assessment-test:serving.home_*:1",
    );
    expect(
      served.technologyEstate?.recordTypes.find(
        (recordType) => recordType.objectType === "application_system",
      )?.rows[0],
    ).toMatchObject({
      systemName: "Claims Administration Platform",
    });
  });

  it("states when the record on screen came from the ECL serving projection", () => {
    render(<HomeV4App bundle={servedBundle()} tenantKey="meridian-health" />);

    expect(screen.getByText("Record on screen")).toBeInTheDocument();
    const recordSource = screen
      .getByText("Live governed record")
      .closest("[data-home-record-source]");
    expect(recordSource).toHaveAttribute(
      "data-home-record-source",
      "ecl_serving_projection",
    );
    expect(recordSource).toHaveAttribute(
      "data-home-canonical-snapshot-hash",
      "ecl:assessment-test:serving.home_*:1",
    );
  });

  it("states when the record on screen is the reviewed snapshot fallback", () => {
    const bundle = getHomeReviewBundle("meridian-health");
    if (!bundle) throw new Error("stored copy missing");

    render(
      <HomeV4App
        bundle={bundle}
        recordSource={{
          kind: "reviewed_snapshot_fallback",
          canonicalSnapshotHash: bundle.provenance.canonical_snapshot_hash,
        }}
        tenantKey="meridian-health"
      />,
    );

    const recordSource = screen
      .getByText("Reviewed stored record fallback")
      .closest("[data-home-record-source]");
    expect(recordSource).toHaveAttribute(
      "data-home-record-source",
      "reviewed_snapshot_fallback",
    );
    expect(recordSource).toHaveAttribute(
      "data-home-canonical-snapshot-hash",
      bundle.provenance.canonical_snapshot_hash,
    );
  });

  it.each([
    "executive_brief",
    "our_business",
    "strategy_value_creation",
    "leadership_perspective",
    "what_needs_attention",
  ])("shows no build state on %s", (chapterId) => {
    const { container } = open(chapterId);
    document.querySelectorAll("style").forEach((n) => n.remove());
    const text = container.textContent ?? "";
    for (const pattern of [
      /deferred pending/i,
      /not ready for executive/i,
      /CXO readout/i,
      /verified chapter claims/i,
      /projection counts/i,
      /\bprojection\b/i,
      /grounded statements/i,
    ]) {
      expect(text).not.toMatch(pattern);
    }
  });

  it("never leads a chapter with a build state", () => {
    for (const chapter of servedBundle().chapters) {
      const { container, unmount } = open(chapter.chapterId);
      expect(container.querySelector("h1")?.textContent ?? "").not.toMatch(
        /deferred pending|not ready for executive/i,
      );
      unmount();
    }
  });

  it("renders served exhibits in executive language with counts from the same record", () => {
    window.location.hash = "technology_data";
    const { container } = render(
      <HomeV4App
        bundle={servedBundleWithPublishedTechnology()}
        tenantKey="meridian-health"
      />,
    );
    document.querySelectorAll("style").forEach((n) => n.remove());
    const text = container.textContent ?? "";

    expect(text).toContain("2 applications");
    expect(text).toContain("2 contracts · $1.3M");
    expect(text).not.toMatch(/\bECL\b/);
    expect(text).not.toMatch(/\bprojection\b/i);
    expect(text).not.toMatch(/\bloaded\b/i);
    expect(text).not.toMatch(/306-row legacy snapshot/i);
  });

  it("does not render stale authored counts or concentration copy over live rows", () => {
    window.location.hash = "technology_data";
    const { container } = render(
      <HomeV4App
        bundle={bundleWithReviewedNarrativeAndLiveRows()}
        tenantKey="meridian-health"
      />,
    );
    document.querySelectorAll("style").forEach((n) => n.remove());
    const text = container.textContent ?? "";

    expect(text).toContain("230 contracts");
    expect(text).toContain(
      "IBM Corporation is the largest supplier group at 12.2% of the current contract value.",
    );
    expect(text).not.toMatch(/\b72 declared vendor contracts\b/i);
    expect(text).not.toMatch(/\b395 of 540 tracked data assets/i);
    expect(text).not.toMatch(
      /Epic(?: Systems Corporation)?[^.]{0,120}Microsoft(?: Corporation)?[^.]{0,120}(?:over|more than)[^.]{0,80}quarter/i,
    );
  });

  it("states the leadership response basis before modelled interview content can be read as testimony", () => {
    window.location.hash = "leadership_perspective";
    const { container } = render(
      <HomeV4App
        bundle={servedBundleWithModelledInterview()}
        tenantKey="meridian-health"
      />,
    );
    const note = container.querySelector("[data-leadership-basis-note]");

    expect(note).not.toBeNull();
    expect(note?.textContent ?? "").toMatch(/modelled, not transcribed/i);
    expect(note?.textContent ?? "").toMatch(
      /not treat modelled responses as verbatim testimony/i,
    );
  });

  it("opens the Executive Brief as an executive orientation, not a raw finding", () => {
    const { container } = open("executive_brief");
    const text = container.textContent ?? "";
    const headline = container.querySelector("h1")?.textContent ?? "";

    expect(headline).toContain("strategic program");
    expect(headline).not.toContain("100% of the estate is self-hosted.");
    expect(text).not.toMatch(/Executive Brief is not yet answered/i);
    expect(text).not.toMatch(
      /Nothing in the loaded record speaks to this question yet/i,
    );
    expect(text).not.toMatch(/Nothing established here yet/i);
    expect(container.querySelector("[data-home-briefing-opening]")).toBeNull();
    expect(text).toContain("In your first ten minutes");
  });

  it("opens Our Business as a business briefing rather than an empty chapter", () => {
    const { container } = open("our_business");
    const text = container.textContent ?? "";
    const headline = container.querySelector("h1")?.textContent ?? "";

    expect(headline).toContain("provider/health-plan model");
    expect(text).not.toMatch(/Our Business is not yet answered/i);
    expect(text).not.toMatch(
      /Nothing in the loaded record speaks to this question yet/i,
    );
    expect(text).not.toMatch(/Nothing established here yet/i);
    expect(container.querySelector("[data-home-briefing-opening]")).toBeNull();
    expect(text).toContain(
      "This enterprise creates value through a 60/40 split",
    );
  });
});

describe("the perspective layer on the served path", () => {
  /**
   * This pins a gap rather than a behaviour, and it should be deleted when the gap closes.
   *
   * Sector patterns and expert lenses reach the stored copy because that packet is built from
   * intake records. The served packet is built from projection rows, and neither family is in the
   * serving path -- so the perspective section renders on the fixture and renders nothing live.
   *
   * The section whose entire purpose is refusing to imply a comparison is currently not in front of
   * a reader at all. That is worth a failing signal the day it is fixed, not silence until someone
   * notices.
   */
  it("carries no analytical lenses yet, so the section cannot render", () => {
    const packet = servedBundle().thesis.signalPacket as {
      analyticalLenses?: unknown[];
    };
    expect(packet.analyticalLenses ?? []).toHaveLength(0);
  });

  it("renders the section as soon as the packet carries them", () => {
    const value = servedBundle();
    (
      value.thesis.signalPacket as { analyticalLenses?: unknown[] }
    ).analyticalLenses = [
      {
        kind: "industry_pattern",
        label: "A pattern",
        appliesHere: "It applies here because the record says so.",
      },
      {
        kind: "expert_lens",
        label: "A lens",
        expertRole: "Chief Data Officer",
        questions: "What would an answer decide?",
      },
    ];
    window.location.hash = "leadership_perspective";
    const { container } = render(
      <HomeV4App bundle={value} tenantKey="meridian-health" />,
    );
    const block = container.querySelector("[data-home-perspective]");
    expect(block).not.toBeNull();
    expect(block!.querySelector("[data-home-no-comparison]")).not.toBeNull();
  });
});

describe("the decision queue on the served path", () => {
  // The stored copy carries four families; the served path carries nine. The queue reads three of
  // the five that only exist on the served path, so a fixture-only test would prove nothing about
  // whether a reader ever sees it -- which is how the perspective section shipped inert.
  it("populates from the families only the served path carries", () => {
    const value = servedBundle();
    const estate = value.technologyEstate!;
    estate.recordTypes.push(
      {
        objectType: "risk_control",
        label: "Risks & Controls",
        columns: [],
        rows: [
          {
            riskOrControlName: "Standing privileged credentials",
            severity: "high",
            controlStatus: "open",
          },
        ],
      } as never,
      {
        objectType: "program_initiative",
        label: "Programs & Initiatives",
        columns: [],
        rows: [{ programName: "RAF Modernisation", status: "at_risk" }],
      } as never,
    );
    window.location.hash = "what_needs_attention";
    const { container } = render(
      <HomeV4App bundle={value} tenantKey="meridian-health" />,
    );
    const queue = container.querySelector("[data-home-decision-queue]");
    expect(queue).not.toBeNull();
    expect(Number(queue!.getAttribute("data-home-decision-queue"))).toBe(2);
    // What the record rates leads.
    expect(queue!.querySelector("[data-home-queue-rated]")).not.toBeNull();
  });
});
