/**
 * SRC-S4 · SourceArtifactDrawer — tier indicator snapshot tests.
 *
 * Verifies:
 *   - Renders with each tier key: rich, outline, stub
 *   - TierIndicator data-testid and data-tier attributes are present
 *   - Provenance panel renders when provenance prop provided
 *   - No tier renders as stub fallback
 *   - No forbidden imports
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SourceArtifactDrawer } from "@/components/source/SourceArtifactDrawer";
import type {
  SourceArtifactDetail,
  SourceArtifactTier,
} from "@/lib/source/types";

const BASE_ARTIFACT: SourceArtifactDetail = {
  id: "test-artifact-001",
  eventId: "test-event",
  title: "Test Artifact",
  kind: "charter",
  status: "draft",
  summary: "A test artifact for tier indicator verification.",
  sourceCount: 2,
  updatedAt: "2026-04-28",
  sections: [
    { label: "Section A", body: "Body text for section A." },
    { label: "Section B", body: "Body text for section B." },
  ],
  governanceNotes: ["Note one.", "Note two."],
  patternLinks: [],
};

const PROVENANCE = {
  createdFrom: "deterministic_seed",
  storeKey: "source-artifact:test-event:test-artifact-001",
  freshness: "2026-04-28",
  evidenceLedgerEntryId: "test-artifact-001",
};

// ---------------------------------------------------------------------------
// Tier variants
// ---------------------------------------------------------------------------

describe("SourceArtifactDrawer · tier indicator", () => {
  const TIERS: SourceArtifactTier[] = ["rich", "outline", "stub"];
  const TIER_LABELS: Record<SourceArtifactTier, string> = {
    rich: "Authored",
    outline: "Prepared",
    stub: "Template",
  };

  for (const tier of TIERS) {
    it(`renders tier="${tier}" with correct data-tier attribute`, () => {
      const html = renderToStaticMarkup(
        createElement(SourceArtifactDrawer, {
          artifact: { ...BASE_ARTIFACT, tier },
        }),
      );
      expect(html).toContain('data-testid="tier-indicator"');
      expect(html).toContain(`data-tier="${tier}"`);
      expect(html).toContain(TIER_LABELS[tier]);
    });
  }

  it("renders undefined tier as stub fallback", () => {
    const html = renderToStaticMarkup(
      createElement(SourceArtifactDrawer, {
        artifact: { ...BASE_ARTIFACT, tier: undefined },
      }),
    );
    expect(html).toContain('data-tier="stub"');
  });
});

// ---------------------------------------------------------------------------
// Provenance panel
// ---------------------------------------------------------------------------

describe("SourceArtifactDrawer · provenance panel", () => {
  it("renders provenance panel when prop provided", () => {
    const html = renderToStaticMarkup(
      createElement(SourceArtifactDrawer, {
        artifact: { ...BASE_ARTIFACT, tier: "rich" },
        provenance: PROVENANCE,
      }),
    );
    expect(html).toContain('data-testid="provenance-panel"');
    expect(html).toContain("Visible provenance");
    expect(html).toContain("Curated source workspace");
    expect(html).toContain("Evidence ledger entry");
  });

  it("formats Date provenance freshness before rendering", () => {
    const html = renderToStaticMarkup(
      createElement(SourceArtifactDrawer, {
        artifact: { ...BASE_ARTIFACT, tier: "rich" },
        provenance: {
          ...PROVENANCE,
          freshness: new Date("2026-04-28T12:30:00.000Z"),
        },
      }),
    );
    expect(html).toContain("2026-04-28T12:30:00.000Z");
    expect(html).not.toContain("[object Date]");
  });

  it("does not render provenance panel when prop omitted", () => {
    const html = renderToStaticMarkup(
      createElement(SourceArtifactDrawer, {
        artifact: { ...BASE_ARTIFACT, tier: "outline" },
      }),
    );
    expect(html).not.toContain('data-testid="provenance-panel"');
    expect(html).not.toContain("Visible provenance");
  });
});

// ---------------------------------------------------------------------------
// Drawer shell
// ---------------------------------------------------------------------------

describe("SourceArtifactDrawer · shell", () => {
  it("renders sections from artifact", () => {
    const html = renderToStaticMarkup(
      createElement(SourceArtifactDrawer, { artifact: BASE_ARTIFACT }),
    );
    expect(html).toContain("Section A");
    expect(html).toContain("Section B");
    expect(html).toContain("Source: curated workspace");
    expect(html).not.toMatch(/seed-backed/i);
  });

  it("renders governance notes", () => {
    const html = renderToStaticMarkup(
      createElement(SourceArtifactDrawer, { artifact: BASE_ARTIFACT }),
    );
    expect(html).toContain("Note one");
    expect(html).toContain("Note two");
  });

  it("renders draft artifact disclaimer", () => {
    const html = renderToStaticMarkup(
      createElement(SourceArtifactDrawer, { artifact: BASE_ARTIFACT }),
    );
    expect(html).toContain("Draft artifact shell only");
  });

  it("uses aVa language for the disabled artifact prompt", () => {
    const html = renderToStaticMarkup(
      createElement(SourceArtifactDrawer, { artifact: BASE_ARTIFACT }),
    );
    expect(html).toContain(
      "Ask aVa about this artifact, evidence chain, or source version",
    );
    expect(html).not.toContain("Ask Sentinel about this artifact");
  });

  it("renders generated markdown tables as responsive HTML tables instead of raw pipe text", () => {
    const html = renderToStaticMarkup(
      createElement(SourceArtifactDrawer, {
        artifact: {
          ...BASE_ARTIFACT,
          title: "Normalized Evaluation Scorecard",
          summary:
            "# Normalized Evaluation Scorecard\n\n| Category | Weight | Vendor A | Vendor B |\n|---|---:|---:|---:|\n| Commercial value | 20% | 7.0 | 8.3 |",
          sections: [
            {
              label: "Weighted Scorecard",
              body: [
                "# Weighted Scorecard",
                "",
                "| Category | Weight | Vendor A | Vendor B |",
                "|---|---:|---:|---:|",
                "| Commercial value | 20% | 7.0 | 8.3 |",
                "| **Total** | **100%** | **7.4** | **6.6** |",
              ].join("\n"),
            },
          ],
        },
      }),
    );

    expect(html).toContain("<table");
    expect(html).toContain("Commercial value");
    expect(html).toContain("Vendor A");
    expect(html).not.toContain("| Category | Weight | Vendor A | Vendor B |");
    expect(html).not.toContain("|---|---:");
  });

  it("renders generated MVE profile sections with headings, lists, and tables", () => {
    const html = renderToStaticMarkup(
      createElement(SourceArtifactDrawer, {
        artifact: {
          ...BASE_ARTIFACT,
          title: "Vendor Response MVE Profiles",
          summary:
            "# Vendor Response MVE Profiles\n\nSource extracts only sourcing-critical signals.\n\n| Area | Vendor A | Vendor B |\n|---|---|---|\n| Role | Risk-adjusted lead | Price benchmark |",
          sections: [
            {
              label: "Minimum Viable Extraction Profiles",
              body: [
                "## Minimum Viable Extraction Profiles",
                "",
                "Source extracts only sourcing-critical signals.",
                "",
                "- Completeness",
                "- Claims and evidence",
                "",
                "| Area | Vendor A | Vendor B |",
                "|---|---|---|",
                "| Role | Risk-adjusted lead | Price benchmark |",
              ].join("\n"),
            },
          ],
        },
      }),
    );

    expect(html).toContain("Minimum Viable Extraction Profiles");
    expect(html).toContain("<ul");
    expect(html).toContain("<table");
    expect(html).not.toContain("| Area | Vendor A | Vendor B |");
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe("SourceArtifactDrawer · hygiene", () => {
  it("does not import from model/upload/workflow packages", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/source/SourceArtifactDrawer.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/from ['"][^'"]*(openai|anthropic|@ai-sdk)['"]/);
    expect(src).not.toMatch(
      /from ['"][^'"]*(upload|parser|approval-engine|workflow-engine)['"]/,
    );
  });

  it("artifact route has updated Sentinel voice format", () => {
    const src = readFileSync(
      join(
        process.cwd(),
        "src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx",
      ),
      "utf8",
    );
    expect(src).toContain("Artifact state:");
    expect(src).toContain("Source:");
    expect(src).toContain("Evidence chain:");
    expect(src).not.toContain("Artifact tier:");
    expect(src).not.toContain("Provenance:");
  });
});
