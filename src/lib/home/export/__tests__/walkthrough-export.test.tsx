import { pdf, View } from "@react-pdf/renderer";
import { rm } from "node:fs/promises";
import { isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import * as chapterPageContent from "@/components/home/v4/chapter-page-content";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import { buildHomeEnterpriseContext } from "@/lib/home/preview/ecl-enterprise-context";
import { buildTechnologyEstateFromHomeProjectionRows } from "@/lib/home/preview/ecl-projection-bundle";
import { generatePack } from "../../../../../scripts/ecl/load_synthetic_enterprise_v1";
import { buildSyntheticHomeRows } from "../../../../../scripts/ecl/synthetic_enterprise_home_rows";
import {
  buildHomeWalkthroughPdf,
  renderHomeWalkthroughHtml,
} from "@/lib/home/export/walkthrough-export";
import type {
  HomeRecordRenderSource,
  HomeReviewBundle,
} from "@/lib/home/preview/types";

jest.mock("@/components/home/v4/chapter-page-content", () => {
  const actual = jest.requireActual(
    "@/components/home/v4/chapter-page-content",
  );
  return { ...actual, chapterDepth: jest.fn(actual.chapterDepth) };
});

async function pdfText(element: ReturnType<typeof buildHomeWalkthroughPdf>) {
  const stream = await pdf(element).toBuffer();
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("latin1");
}

const recordSource: HomeRecordRenderSource = {
  kind: "ecl_serving_projection",
  canonicalSnapshotHash: "ecl:test:serving.home_*:3311",
  contextVersion: {
    assessmentId: "assessment-test",
    projectionContentHash: "rows-hash",
    sourceSetHash: null,
    sourceLineageHash: "lineage-hash",
    sourceCoverage: {
      totalRecordRows: 3,
      linkedRecordRows: 2,
      families: [
        { pageKey: "applications_systems", totalRows: 1, linkedRows: 1 },
        { pageKey: "metrics_outcomes", totalRows: 1, linkedRows: 0 },
        { pageKey: "vendor_contracts", totalRows: 1, linkedRows: 1 },
      ],
    },
    sourceCatalogHash: "source-catalog-hash",
    sourceFileReview: {
      totalFiles: 14,
      acceptedFiles: 0,
      partialFiles: 14,
      blockedFiles: 0,
      supersededFiles: 0,
    },
    sourceDateCoverage: {
      earliest: "2026-08-23",
      latest: "2026-08-23",
      datedFiles: 14,
      totalFiles: 14,
    },
    deterministicPacketHash: "read-packet-hash",
    narrativePacketHash: null,
    narrativeGeneratedAt: "2026-08-21T00:00:00Z",
    dataAsOf: null,
    coherence: "stored_narrative",
  },
};

function bundleWithGraph(): HomeReviewBundle {
  const baseBundle = getHomeReviewBundle("meridian-health");
  if (!baseBundle) {
    throw new Error("Expected meridian-health Home review bundle fixture");
  }
  const bundle = structuredClone(baseBundle);
  const recordTypes = (bundle.technologyEstate?.recordTypes ?? []).filter(
    (recordType) =>
      !["risk_control", "program_initiative", "relationship_edge"].includes(
        recordType.objectType,
      ),
  );
  bundle.technologyEstate = {
    ...(bundle.technologyEstate ?? { recordTypes: [] }),
    recordTypes: [
      ...recordTypes,
      {
        objectType: "risk_control",
        label: "Risks & Controls",
        columns: ["riskOrControlName", "severity", "controlOwner"],
        primaryDimension: "riskDomain",
        dimensionCounts: [],
        rows: [
          {
            riskOrControlName:
              "Standing privileged credentials outside PAM coverage",
            severity: "high",
            controlOwner: "Chief Information Security Officer",
          },
        ],
      },
      {
        objectType: "program_initiative",
        label: "Programs & Initiatives",
        columns: ["programName", "pctComplete", "status"],
        primaryDimension: "status",
        dimensionCounts: [{ value: "in flight", count: 1 }],
        rows: [
          {
            programName: "Privileged Access Management Rollout",
            pctComplete: 20,
            status: "in flight",
          },
        ],
      },
      {
        objectType: "relationship_edge",
        label: "Declared Relationships",
        columns: [
          "fromObjectName",
          "fromObjectType",
          "relationshipType",
          "toObjectName",
          "toObjectType",
          "relationshipStrength",
          "confidence",
          "evidenceBasis",
        ],
        primaryDimension: "relationshipType",
        dimensionCounts: [{ value: "impacts", count: 1 }],
        rows: [
          {
            fromObjectName:
              "Standing privileged credentials outside PAM coverage",
            fromObjectType: "risk",
            relationshipType: "impacts",
            toObjectName: "Privileged Access Management Rollout",
            toObjectType: "program",
            relationshipStrength: "direct",
            confidence: "high",
            evidenceBasis: "relationship row",
          },
        ],
      },
    ],
  };
  return bundle;
}

describe("Home walkthrough export", () => {
  it("preserves generated enterprise context in HTML and PDF", async () => {
    const pack = await generatePack("v2");
    try {
      const rows = buildSyntheticHomeRows(pack.normalized.objects.map((object) => ({
        id: object.id,
        object_key: object.id,
        object_type: object.type,
        display_name: object.name,
        source_record_id: `source-${object.id}`,
        value_state: "known",
        attributes_json: object.attributes,
      })));
      const sourceByRow = new Map(rows.map((row) => [row.row_key, row.source_record_id]));
      const context = buildHomeEnterpriseContext(rows, (row) => {
        const source = sourceByRow.get(row.row_key);
        return source ? [source] : [];
      });
      expect(context).not.toBeNull();
      const bundle = bundleWithGraph();
      bundle.technologyEstate = buildTechnologyEstateFromHomeProjectionRows(rows);
      bundle.thesis.signalPacket.homeEnterpriseContext = context;

      const html = renderHomeWalkthroughHtml({
        bundle, recordSource, tenantLabel: "Synthetic Enterprise", format: "html",
      });
      const pdfDocument = buildHomeWalkthroughPdf({
        bundle, recordSource, tenantLabel: "Synthetic Enterprise", format: "pdf",
      });
      const pdfMarkup = renderToStaticMarkup(pdfDocument);
      const output = await pdfText(pdfDocument);
      expect(output.startsWith("%PDF-")).toBe(true);
      for (const label of [
        "Source-linked enterprise context",
        "Declared enterprise scale",
        "Segment scale and governed footprint",
        "Priority ownership and delivery",
        "Function ownership and footprint",
        "High and critical risks needing control review",
      ]) {
        expect(html).toContain(label);
        expect(pdfMarkup).toContain(label);
      }
      expect(html).toContain("Not client-attested");
      expect(pdfMarkup).toContain("Not client-attested");
      expect(html).toContain("At-risk linked programs");
      expect(pdfMarkup).toContain("At-risk linked programs");
      expect(html).toContain("Unknown is not uncontrolled");
      expect(pdfMarkup).toContain("Unknown is not uncontrolled");
      expect(html).toContain("Recovery capacity gap: Informatica PowerCenter");
      expect(pdfMarkup).toContain("Recovery capacity gap: Informatica PowerCenter");
      const businessChapter = html.slice(html.indexOf("Chapter 02"), html.indexOf("Chapter 03"));
      expect(businessChapter).toContain("Current source-linked record");
      expect(businessChapter).not.toContain("No current chapter-specific tables");
      expect(pdfMarkup).toContain("Current source-linked record");
      expect(html).toContain("Vendor Contracts</td><td>230");
      expect(html).not.toContain("Vendor Contracts</td><td>72");
    } finally {
      await rm(pack.dir, { recursive: true, force: true });
    }
  });

  it("exports Home content and record-source state as HTML", () => {
    const bundle = bundleWithGraph();
    const html = renderHomeWalkthroughHtml({
      bundle,
      recordSource,
      tenantLabel: "Meridian Health",
      format: "html",
    });

    expect(html).toContain("AbarVa Home Walkthrough Export");
    expect(html).toContain("Record on screen: Live governed rows");
    expect(html).toContain("Reviewed narrative; live rows may differ");
    expect(html).toContain("Source-linked: 2 of 3 record rows");
    expect(html).toContain("Source-file quality: 0 of 14 accepted; 14 partial");
    expect(html).toContain(
      "Registered source dates: 2026-08-23 (14 of 14 files); data currency not attested",
    );
    expect(html).toContain("incomplete for metrics");
    expect(html).toContain("Data as of not established");
    expect(html).toContain("home_*:3311");
    expect(html).toContain("Vendor Contracts");
    expect(html).toContain("Data Assets &amp; Integrations");
    expect(html).toContain("What Needs Attention");
    expect(html).toContain("Relationship-backed exposure paths");
    expect(html).toContain("Serving-row marker");
    expect(html).toContain("This export is a Home walkthrough export");
    expect(html).not.toContain(
      "This export contains the aVa chat session only",
    );
  });

  it("builds a structurally valid PDF with the same scope label", async () => {
    const bundle = bundleWithGraph();
    const output = await pdfText(
      buildHomeWalkthroughPdf({
        bundle,
        recordSource,
        tenantLabel: "Meridian Health",
        format: "pdf",
      }),
    );

    expect(output.startsWith("%PDF-")).toBe(true);
    expect(output).toContain("AbarVa Home Walkthrough Export");
    expect(output).toContain("Live governed rows");
    expect(output).toContain("Reviewed narrative; live rows may differ");
    expect(output).toContain("Source-linked: 2 of 3 record rows");
    expect(output).toContain(
      "Source-file quality: 0 of 14 accepted; 14 partial",
    );
    expect(output).toContain("Registered source dates: 2026-08-23");
    expect(output).toContain("Home chapters");
  });

  it("preserves table rows, totals, gaps, and cautious lineage in both formats", () => {
    const rows = Array.from({ length: 17 }, (_, index) => [
      `ROW-${String(index + 1).padStart(2, "0")}`,
      index + 1,
    ]);
    const depth = jest.mocked(chapterPageContent.chapterDepth).mockReturnValue({
      findings: [
        {
          kind: "established",
          claim: "A deterministic finding",
          owner: "Record owner",
          because: "Computed from rows",
          trace: {
            file: "unverified-generated-file.csv",
            grain: "one contract",
            rule: "count active contracts",
          },
        },
      ],
      tables: [
        {
          caption: "Long table",
          columns: ["Name", "Count"],
          rows,
          total: ["TOTAL-MARKER", 153],
          note: "All rows shown",
        },
      ],
      unsupported: [
        {
          caption: "Unsupported exhibit",
          missingColumn: "missing_column",
          why: "The source field is absent",
        },
      ],
    });

    try {
      const bundle = bundleWithGraph();
      const html = renderHomeWalkthroughHtml({
        bundle,
        recordSource,
        tenantLabel: "Test Enterprise",
        format: "html",
      });
      const pdfMarkup = renderToStaticMarkup(
        buildHomeWalkthroughPdf({
          bundle,
          recordSource,
          tenantLabel: "Test Enterprise",
          format: "pdf",
        }),
      );

      for (const output of [html, pdfMarkup]) {
        expect(output).toContain("ROW-01");
        expect(output).toContain("ROW-17");
        expect(output).toContain("TOTAL-MARKER");
        expect(output).toContain("Unsupported exhibit");
        expect(output).toContain("The source field is absent");
        expect(output).toContain("Rule; source mapping pending");
        expect(output).toContain("count active contracts");
        expect(output).not.toContain("unverified-generated-file.csv");
      }
      expect(pdfMarkup).toContain("Current-State Exhibits");
      expect(pdfMarkup).toContain("Architecture");
      expect(pdfMarkup).toContain("Data flow");
      for (const output of [html, pdfMarkup]) {
        expect(output).toContain("not a count of verified flows");
        expect(output).not.toContain("source-to-target data movement rows");
      }
    } finally {
      depth.mockImplementation(
        jest.requireActual("@/components/home/v4/chapter-page-content")
          .chapterDepth,
      );
    }
  });

  it("keeps each prior interpretation with its heading and question in one PDF block", () => {
    const bundle = bundleWithGraph();
    const chapter = bundle.chapters.find(
      (item) => item.chapterId === "what_needs_attention",
    );
    expect(chapter).toBeDefined();
    const document = buildHomeWalkthroughPdf({
      bundle,
      recordSource,
      tenantLabel: "Test Enterprise",
      format: "pdf",
    });

    function rawText(node: ReactNode): string {
      if (typeof node === "string" || typeof node === "number") {
        return String(node);
      }
      if (Array.isArray(node)) return node.map(rawText).join("");
      if (!isValidElement(node)) return "";
      return rawText((node.props as { children?: ReactNode }).children);
    }

    let unbreakablePriorFound = false;
    function visit(node: ReactNode): void {
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      if (!isValidElement(node)) return;
      const props = node.props as { children?: ReactNode; wrap?: boolean };
      if (
        node.type === View &&
        props.wrap === false &&
        rawText(props.children).includes(chapter!.headline) &&
        rawText(props.children).includes(chapter!.guidingQuestion) &&
        rawText(props.children).includes(chapter!.executive_synthesis)
      ) {
        unbreakablePriorFound = true;
      }
      if (typeof node.type === "function") {
        visit(
          (
            node.type as (input: {
              children?: ReactNode;
              wrap?: boolean;
            }) => ReactNode
          )(props),
        );
      } else {
        visit(props.children);
      }
    }

    visit(document);
    expect(unbreakablePriorFound).toBe(true);
  });

  it("leads each mixed chapter with current depth and labels prior interpretation", () => {
    const html = renderHomeWalkthroughHtml({
      bundle: bundleWithGraph(),
      recordSource,
      tenantLabel: "Meridian Health",
      format: "html",
    });
    const chapters = [
      ...html.matchAll(/<article class="chapter">([\s\S]*?)<\/article>/g),
    ].map((match) => match[1]);

    expect(chapters).toHaveLength(8);
    for (const chapter of chapters) {
      expect(
        chapter.indexOf("Current record, interpretation pending review"),
      ).toBeLessThan(chapter.indexOf("Prior reviewed interpretation"));
      expect(chapter).toContain(
        "Prior reviewed interpretation - generated Aug 21, 2026; not reconciled with current rows",
      );
    }
    const leadership = chapters.find((chapter) =>
      chapter.includes("Leadership Perspective"),
    );
    expect(leadership).toContain(
      "No leadership interview rows are served here",
    );
    expect(
      leadership?.indexOf("No leadership interview rows are served here"),
    ).toBeLessThan(leadership?.indexOf("Leaders are unanimous") ?? -1);
  });

  it("keeps coherent and reviewed exports free of a mixed-chapter label", () => {
    const bundle = bundleWithGraph();
    for (const source of [
      {
        ...recordSource,
        contextVersion: {
          ...recordSource.contextVersion!,
          coherence: "coherent" as const,
        },
      },
      {
        kind: "reviewed_snapshot" as const,
        canonicalSnapshotHash: "reviewed-hash",
      },
    ]) {
      const html = renderHomeWalkthroughHtml({
        bundle,
        recordSource: source,
        tenantLabel: "Meridian Health",
        format: "html",
      });
      expect(html).not.toContain("Prior reviewed interpretation - generated");
      expect(html).not.toContain(
        "Current record, interpretation pending review",
      );
    }
  });

  it("does not call an unverified narrative reviewed", () => {
    const html = renderHomeWalkthroughHtml({
      bundle: bundleWithGraph(),
      recordSource: {
        ...recordSource,
        contextVersion: {
          ...recordSource.contextVersion!,
          coherence: "unverified",
        },
      },
      tenantLabel: "Meridian Health",
      format: "html",
    });
    expect(html.match(/Earlier interpretation - generated/g)).toHaveLength(8);
    expect(html).not.toContain("Prior reviewed interpretation - generated");
  });
});
