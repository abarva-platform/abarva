/**
 * HomeEnterpriseBriefApp · V2 evidence/chart containment regression tests
 *
 * Confirms the fix for a real production defect: `evidenceFor()` fell back
 * to the pack-wide global EVIDENCE list whenever a dimension had no EVID[key]
 * bucket of its own, presenting unrelated real citations (e.g. "AWS
 * Analytics Foundation") as if they specifically supported dimensions they
 * have no connection to. The same fixture also had no DATA[key] rows,
 * previously triggering a hardcoded single-bar "Directional" chart stub
 * identical across every under-generated dimension.
 *
 * Covers the four dimensions the user named directly from the live page:
 * Enterprise Thesis, Leadership Agenda, Proven Strengths, Architecture
 * Dependencies — all of which showed the same global evidence and the same
 * stub chart on the real live tenant before this fix.
 */

import { renderToStaticMarkup } from "react-dom/server";

import { HomeEnterpriseBriefApp } from "../HomeEnterpriseBriefApp";
import type { HomeKnowledgeDesignContractPack } from "@/lib/home/home-knowledge-design-contract";

const NAMED_DIMENSIONS = [
  "enterprise_thesis",
  "leadership_agenda",
  "proven_strengths",
  "architecture_dependencies",
] as const;

function basePack(): HomeKnowledgeDesignContractPack {
  return {
    tenant_key: "test-tenant",
    tenant_name: "Test Tenant",
    artifact_type: "home_enterprise_brief",
    design_slots: {
      DIMS: NAMED_DIMENSIONS.map((key) => ({
        key,
        name: key
          .split("_")
          .map((w) => w[0].toUpperCase() + w.slice(1))
          .join(" "),
      })),
      FACTS: [],
      KPIS: [],
      BRIEF_COLS: [],
      PRIORITIES: [],
      SIGNALS: [],
      DEC_CAN: [],
      DEC_CANNOT: [],
      CONF_TABLE: [],
      GAPS: [],
      USE_CASES: [],
      // A real, unrelated global evidence source that must never leak into
      // a dimension that has no EVID[key] bucket of its own.
      EVIDENCE: [
        {
          name: "AWS Analytics Foundation",
          type: "Data Source",
          supports: "Confirms real-time analytics coverage",
        },
      ],
      NEXT_EVIDENCE: [],
      DATA: {},
      INSIGHTS: {},
      STORY: {},
      REL: {},
      DGAPS: {},
      // Deliberately empty: none of the four named dimensions have their
      // own evidence bucket, matching the real defect's reproduction shape.
      EVID: {},
    },
  };
}

describe("<HomeEnterpriseBriefApp /> · evidence containment", () => {
  it.each(NAMED_DIMENSIONS)(
    "does not leak pack-wide global evidence into %s",
    (dimKey) => {
      const html = renderToStaticMarkup(
        <HomeEnterpriseBriefApp pack={basePack()} selectedDimension={dimKey} />,
      );
      expect(html).not.toContain("AWS Analytics Foundation");
      expect(html).toContain(
        "No dimension-specific evidence has been linked yet.",
      );
    },
  );

  it.each(NAMED_DIMENSIONS)(
    "shows an honest empty chart state for %s instead of a stub bar",
    (dimKey) => {
      const html = renderToStaticMarkup(
        <HomeEnterpriseBriefApp pack={basePack()} selectedDimension={dimKey} />,
      );
      expect(html).toContain(
        "No dataset rows are available yet to chart for this dimension.",
      );
      // The old defect rendered a single bar labeled "Directional" regardless
      // of dimension — assert that stub language is gone.
      expect(html).not.toContain("Directional");
    },
  );

  it("shows a source's own null support honestly rather than a generic reassurance", () => {
    const pack = basePack();
    pack.design_slots.EVID.enterprise_thesis = [
      { name: "Executive Interview Notes", type: "Interview" },
    ];
    const html = renderToStaticMarkup(
      <HomeEnterpriseBriefApp pack={pack} selectedDimension="enterprise_thesis" />,
    );
    expect(html).toContain("Executive Interview Notes");
    expect(html).toContain("No explicit relationship stated for this source.");
    expect(html).not.toContain("Supports the context boundary");
  });

  it("isolates a real EVID bucket to its own dimension only", () => {
    const pack = basePack();
    pack.design_slots.EVID.enterprise_thesis = [
      {
        name: "Board Strategy Memo",
        type: "Document",
        supports: "States the enterprise thesis directly",
      },
    ];
    const htmlForOwner = renderToStaticMarkup(
      <HomeEnterpriseBriefApp pack={pack} selectedDimension="enterprise_thesis" />,
    );
    expect(htmlForOwner).toContain("Board Strategy Memo");

    const htmlForOther = renderToStaticMarkup(
      <HomeEnterpriseBriefApp pack={pack} selectedDimension="leadership_agenda" />,
    );
    expect(htmlForOther).not.toContain("Board Strategy Memo");
  });
});
