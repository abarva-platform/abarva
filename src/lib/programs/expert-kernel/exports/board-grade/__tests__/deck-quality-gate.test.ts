// Deck Quality Gate — enforces the Moves Deliverable Standard
// (docs/build/agent-response-contract/MOVES_DELIVERABLE_STANDARD.md) across
// every board-grade Move deck.
//
// This is the GLOBAL, all-clients quality floor. It renders each deck for a
// representative BOUND Move (healthcare, retail, and banking — proving the bar
// is industry-agnostic) and for a deliberately UNBOUND Move (proving honest
// degradation, never fabrication). A deck fails CI when it: renders thin,
// lacks exhibits, lacks an evidence/verdict cue, contains placeholder/
// fabrication tokens, leaks cross-tenant terms, or (for a bound Move) renders
// as unbound.

import {
  renderMoveCostedBusinessCaseHtml,
  renderMoveDiscoverBriefHtml,
  renderMoveSolutionArchitectureHtml,
  renderMoveEstimateModelHtml,
  renderMoveMobilizePacketHtml,
  renderMoveCharterSkeletonHtml,
  renderMoveCfoPackHtml,
  renderMoveMasterDossierHtml,
} from "../index";
import type { MoveBusinessCaseInput } from "../../../../move-business-case";

const GENERATED_ON = "2026-06-06";

type DeckRenderer = (move: MoveBusinessCaseInput) => string;

// All eight Move decks, normalised to a single (move) => html signature.
const DECKS: Record<string, DeckRenderer> = {
  "costed-business-case": (m) =>
    renderMoveCostedBusinessCaseHtml(m, GENERATED_ON),
  "discover-brief": (m) => renderMoveDiscoverBriefHtml(m, GENERATED_ON),
  "solution-architecture": (m) =>
    renderMoveSolutionArchitectureHtml(m, GENERATED_ON),
  "estimate-model": (m) => renderMoveEstimateModelHtml(m, GENERATED_ON),
  "mobilize-packet": (m) => renderMoveMobilizePacketHtml(m, GENERATED_ON),
  "charter-skeleton": (m) => renderMoveCharterSkeletonHtml(m, GENERATED_ON),
  "cfo-pack": (m) => renderMoveCfoPackHtml(m, GENERATED_ON),
  "master-dossier": (m) =>
    renderMoveMasterDossierHtml(m, m.id ?? "move", GENERATED_ON),
};

// Per-deck signature exhibits/sections that MUST appear in a bound deck.
// Anchored to the labels the generic Move renderers actually emit.
const REQUIRED_SIGNATURES: Record<string, string[]> = {
  "costed-business-case": ["Investment waterfall", "Sensitivity tornado"],
  "discover-brief": [
    "Baseline coverage meter",
    "Opportunity range",
    "Gap closure queue",
  ],
  "solution-architecture": ["context diagram"],
  "estimate-model": [
    "cost stack",
    "Sensitivity tornado",
    "Payback range cash-flow",
  ],
  "mobilize-packet": ["heatmap", "Gap closure queue"],
  "charter-skeleton": [
    "Value vs effort",
    "Sensitivity tornado",
    "Gap closure queue",
  ],
  "cfo-pack": ["Value vs effort", "Sensitivity tornado", "gap matrix"],
  "master-dossier": ["Investment waterfall", "Sensitivity tornado"],
};

// Representative BOUND Moves across three industries — proves the bar is the
// same for all clients, regardless of vertical.
const BOUND_TENANTS: Array<{
  label: string;
  move: MoveBusinessCaseInput;
  foreignTerms: string[];
}> = [
  {
    label: "meridian-health (healthcare)",
    move: bound(
      "HEALTHCARE_IDN",
      "Meridian Health System",
      "meridian-health",
      "population_health_value_based_care",
    ),
    foreignTerms: ["Apex Retail", "SkyHarbor", "First Capital"],
  },
  {
    label: "apex-retail (retail)",
    move: bound(
      "RETAIL",
      "Apex Retail Group",
      "apex-retail",
      "pricing_promotions",
    ),
    foreignTerms: ["Meridian", "SkyHarbor", "First Capital"],
  },
  {
    label: "first-capital (banking)",
    move: bound(
      "FINANCIAL_SERVICES",
      "First Capital Financial",
      "first-capital",
      "fraud_financial_crime",
    ),
    foreignTerms: ["Meridian", "Apex Retail", "SkyHarbor"],
  },
];

const UNBOUND_MOVE: MoveBusinessCaseInput = bound(
  "HEALTHCARE_IDN",
  "Meridian Health System",
  "meridian-health",
  "no_such_function_key_xyz",
);

const PLACEHOLDER =
  /(lorem ipsum|\bTKTK\b|\bTODO\b|\{\{|>\s*undefined\s*<|>\s*NaN\s*<)/;
const VERDICT_CUE = /(verdict|shape|fund|kill|advance|go\/no-go|recommend)/i;
const EVIDENCE_CUE = /(evidence|source|as of|confidence|assumption)/i;

function bound(
  industry: string,
  tenantName: string,
  tenantKey: string,
  functionKey: string,
): MoveBusinessCaseInput {
  return {
    industry_code: industry,
    name: `${tenantName} — Strategic Move`,
    tenant_key: tenantKey,
    tenant_name: tenantName,
    id: `eng_${tenantKey}_gate`,
    function_pack_key: functionKey,
    charter: { functionPackKey: functionKey },
  };
}

function title(html: string): string {
  return (html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "").trim();
}

function countSvg(html: string): number {
  return (html.match(/<svg/g) ?? []).length;
}

describe("Deck Quality Gate — Moves Deliverable Standard", () => {
  for (const tenant of BOUND_TENANTS) {
    describe(`bound · ${tenant.label}`, () => {
      for (const [deck, render] of Object.entries(DECKS)) {
        describe(deck, () => {
          let html = "";
          beforeAll(() => {
            html = render(tenant.move);
          });

          it("renders substantial HTML", () => {
            expect(html.length).toBeGreaterThan(30_000);
          });

          it("is bound (never the unbound fallback for a covered function)", () => {
            expect(title(html).toLowerCase()).not.toContain("unbound");
          });

          it("renders at least two SVG exhibits", () => {
            expect(countSvg(html)).toBeGreaterThanOrEqual(2);
          });

          it("carries a verdict/answer cue and an evidence cue", () => {
            expect(VERDICT_CUE.test(html)).toBe(true);
            expect(EVIDENCE_CUE.test(html)).toBe(true);
          });

          it("shows the tenant and never another tenant", () => {
            expect(html).toContain(tenant.move.tenant_name as string);
            for (const foreign of tenant.foreignTerms) {
              expect(html).not.toContain(foreign);
            }
          });

          it("contains no placeholder or fabrication tokens", () => {
            expect(PLACEHOLDER.test(html)).toBe(false);
          });
        });
      }
    });
  }

  describe("required exhibits per deck (representative bound Move)", () => {
    const move = BOUND_TENANTS[0].move;
    for (const [deck, render] of Object.entries(DECKS)) {
      it(`${deck} includes its required signature exhibits/sections`, () => {
        const html = render(move);
        for (const sig of REQUIRED_SIGNATURES[deck]) {
          expect(html.toLowerCase()).toContain(sig.toLowerCase());
        }
      });
    }
  });

  describe("honest unbound degradation (no curated function pack)", () => {
    for (const [deck, render] of Object.entries(DECKS)) {
      it(`${deck} renders the honest unbound deck without fabrication`, () => {
        const html = render(UNBOUND_MOVE);
        expect(html.length).toBeGreaterThan(2_000);
        expect(/unbound|no curated/i.test(html)).toBe(true);
        expect(PLACEHOLDER.test(html)).toBe(false);
      });
    }
  });
});
