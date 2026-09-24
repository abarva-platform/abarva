import { pdf } from "@react-pdf/renderer";

import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import {
  buildHomeWalkthroughPdf,
  renderHomeWalkthroughHtml,
} from "@/lib/home/export/walkthrough-export";
import type {
  HomeRecordRenderSource,
  HomeReviewBundle,
} from "@/lib/home/preview/types";

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
  it("exports Home content and record-source state as HTML", () => {
    const bundle = bundleWithGraph();
    const html = renderHomeWalkthroughHtml({
      bundle,
      recordSource,
      tenantLabel: "Meridian Health",
      format: "html",
    });

    expect(html).toContain("AbarVa Home Walkthrough Export");
    expect(html).toContain("Record on screen: Live governed record");
    expect(html).toContain("home_*:3311");
    expect(html).toContain("Vendor Contracts");
    expect(html).toContain("Data Assets &amp; Integrations");
    expect(html).toContain("What Needs Attention");
    expect(html).toContain("Relationship-backed exposure paths");
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
    expect(output).toContain("Live governed record");
    expect(output).toContain("Home chapters");
  });
});
