/**
 * U-554. The Home walkthrough export reads `bundle.thesis.signalPacket.homeEnterpriseContext`
 * and emits a per-chapter source-linked enterprise-context section from it. When that context is
 * absent the section is not emitted and the export says nothing about it, so a reader holding only
 * the document cannot tell a record that carries no enterprise context from one whose context was
 * served and rendered. Six of the seven elements the section carries disappear together, which is
 * why "some elements are missing" is not a safe way to read the output.
 *
 * These cases drive the real exporter over a real context built by the real
 * `buildHomeEnterpriseContext` from the synthetic pack, not a hand-written context literal, so the
 * completeness case below asserts what the shipped builder actually produces.
 */
import { rm } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";

import {
  buildHomeEnterpriseContext,
  type HomeEnterpriseContext,
} from "@/lib/home/preview/ecl-enterprise-context";
import { ENTERPRISE_CONTEXT_CHAPTER_IDS } from "@/lib/home/export/enterprise-context";
import { buildTechnologyEstateFromHomeProjectionRows } from "@/lib/home/preview/ecl-projection-bundle";
import {
  getHomeReviewBundle,
  HOME_PREVIEW_TENANT_KEYS,
} from "@/lib/home/preview/golden-snapshot";
import {
  buildHomeWalkthroughPdf,
  renderHomeWalkthroughHtml,
} from "@/lib/home/export/walkthrough-export";
import type {
  HomeRecordRenderSource,
  HomeReviewBundle,
} from "@/lib/home/preview/types";
import { generatePack } from "../../../../../scripts/ecl/load_synthetic_enterprise_v1";
import {
  buildSyntheticHomeDependencyRows,
  buildSyntheticHomeRows,
} from "../../../../../scripts/ecl/synthetic_enterprise_home_rows";

const servingRecordSource: HomeRecordRenderSource = {
  kind: "ecl_serving_projection",
  canonicalSnapshotHash: "ecl:u554:serving.home_*:1",
  contextVersion: {
    assessmentId: "assessment-u554",
    projectionContentHash: "rows-hash",
    sourceSetHash: null,
    sourceLineageHash: "lineage-hash",
    sourceCoverage: {
      totalRecordRows: 3,
      linkedRecordRows: 2,
      families: [],
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

const reviewedSnapshotRecordSource: HomeRecordRenderSource = {
  kind: "reviewed_snapshot",
  canonicalSnapshotHash: "reviewed:u554",
};

/**
 * The seven elements #8846 claims the export preserves, each named by strings the exporter itself
 * emits. Six come from the enterprise-context section; `source dates` is the only one the document
 * header also carries, which is why the section can vanish while one element still reads present.
 */
const CLAIMED_ELEMENTS: ReadonlyArray<{
  element: string;
  needles: readonly string[];
}> = [
  {
    element: "business scale",
    needles: ["Declared enterprise scale", "Declared annual revenue"],
  },
  {
    element: "operating segments",
    needles: [
      "Declared business segments",
      "Segment scale and governed footprint",
    ],
  },
  {
    element: "priorities",
    needles: [
      "Declared priorities and programs",
      "Priority ownership and delivery",
    ],
  },
  {
    element: "function ownership",
    needles: [
      "Declared operating functions",
      "Function ownership and footprint",
    ],
  },
  {
    element: "attribution gaps",
    needles: ["no declared priority", "Program without a declared priority"],
  },
  { element: "source dates", needles: ["As of "] },
  { element: "synthetic evidence labels", needles: ["Not client-attested"] },
];

function absentElements(html: string): string[] {
  return CLAIMED_ELEMENTS.filter(
    ({ needles }) => !needles.every((needle) => html.includes(needle)),
  ).map(({ element }) => element);
}

/**
 * The tenant key is read from `HOME_PREVIEW_TENANT_KEYS` rather than written here, so these cases
 * cover whichever Home preview tenants exist now and later, and no tenant identifier is spelled
 * into a public artifact.
 */
function homeBundleFixture(): HomeReviewBundle {
  const [tenantKey] = HOME_PREVIEW_TENANT_KEYS;
  const bundle = tenantKey ? getHomeReviewBundle(tenantKey) : null;
  if (!bundle) {
    throw new Error(
      "Expected at least one Home preview tenant to carry a review bundle fixture",
    );
  }
  return bundle;
}

function renderWith(
  bundle: HomeReviewBundle,
  recordSource: HomeRecordRenderSource,
): string {
  return renderHomeWalkthroughHtml({
    bundle,
    recordSource,
    tenantLabel: "Synthetic Enterprise",
    format: "html",
  });
}

async function syntheticContext(): Promise<{
  context: HomeEnterpriseContext;
  bundle: HomeReviewBundle;
  cleanup: () => Promise<void>;
}> {
  const pack = await generatePack("v2");
  const objects = pack.normalized.objects.map((object) => ({
    id: object.id,
    object_key: object.id,
    object_type: object.type,
    display_name: object.name,
    source_record_id: `source-${object.id}`,
    value_state: "known",
    attributes_json: {
      ...object.attributes,
      source_as_of: object.source_as_of,
    },
  }));
  const rows = [
    ...buildSyntheticHomeRows(objects),
    ...buildSyntheticHomeDependencyRows(
      objects,
      pack.normalized.relationships.map((edge) => ({
        id: edge.id,
        from_object_id: edge.from_object_id,
        to_object_id: edge.to_object_id,
        relationship_type: edge.type,
        source_record_id: `source-${edge.id}`,
        value_state: "known",
        attributes_json: {
          native_relationship_id: edge.id,
          source_as_of: edge.source_as_of,
        },
      })),
    ),
  ];
  const sourceByRow = new Map(
    rows.map((row) => [row.row_key, row.source_record_id]),
  );
  const context = buildHomeEnterpriseContext(rows, (row) => {
    const source = sourceByRow.get(row.row_key);
    return source ? [source] : [];
  });
  if (!context) {
    throw new Error(
      "Expected the synthetic pack to establish an enterprise context",
    );
  }
  const bundle = structuredClone(homeBundleFixture());
  bundle.technologyEstate = buildTechnologyEstateFromHomeProjectionRows(rows);
  bundle.thesis.signalPacket.homeEnterpriseContext = context;
  return {
    context,
    bundle,
    cleanup: () => rm(pack.dir, { recursive: true, force: true }),
  };
}

function bundleWithContext(
  context: HomeEnterpriseContext | null | undefined,
): HomeReviewBundle {
  const bundle = structuredClone(homeBundleFixture());
  bundle.thesis.signalPacket.homeEnterpriseContext = context;
  return bundle;
}

describe("Home walkthrough export · source-linked enterprise context", () => {
  it("carries all seven claimed elements when the served record establishes a context", async () => {
    const { bundle, cleanup } = await syntheticContext();
    try {
      const html = renderWith(bundle, servingRecordSource);
      expect(absentElements(html)).toEqual([]);
      // The guarantee this case protects: a declaration must not stand in for a section that
      // could have been rendered.
      expect(html).not.toContain("ENTERPRISE CONTEXT NOT SERVED");
    } finally {
      await cleanup();
    }
  });

  it("declares that the served projection could not establish an enterprise context", () => {
    const html = renderWith(bundleWithContext(null), servingRecordSource);
    expect(absentElements(html)).not.toEqual([]);
    expect(html).toContain("ENTERPRISE CONTEXT NOT SERVED");
    expect(html).toContain(
      "A serving projection was read and its rows could not establish a source-linked enterprise context",
    );
  });

  it("declares that a reviewed-snapshot export emits no source-linked enterprise context", () => {
    const html = renderWith(
      bundleWithContext(undefined),
      reviewedSnapshotRecordSource,
    );
    expect(html).toContain("ENTERPRISE CONTEXT NOT SERVED");
    expect(html).toContain(
      "This export was built from the reviewed Home snapshot, which carries no source-linked enterprise context",
    );
  });

  it("names the absent dependency proof rather than dropping the technology chapter's section in silence", async () => {
    const { bundle, cleanup } = await syntheticContext();
    try {
      const context = bundle.thesis.signalPacket.homeEnterpriseContext;
      if (!context)
        throw new Error(
          "Expected a context to strip the dependency proof from",
        );
      const html = renderWith(
        bundleWithContext({ ...context, dependencyProof: null }),
        servingRecordSource,
      );
      expect(html).toContain("ENTERPRISE CONTEXT NOT SERVED");
      expect(html).toContain(
        "no canonical ID-linked dependency path reached this export",
      );
      // The other six elements are unaffected: this is a per-chapter gap, not the whole section.
      expect(html).toContain("Declared enterprise scale");
      expect(html).toContain("Function ownership and footprint");
    } finally {
      await cleanup();
    }
  });

  it("declares the gap on every chapter that carries a context section, and on no other chapter", () => {
    const html = renderWith(bundleWithContext(null), servingRecordSource);
    const declarations = html.split("ENTERPRISE CONTEXT NOT SERVED").length - 1;
    expect(declarations).toBe(ENTERPRISE_CONTEXT_CHAPTER_IDS.length);
    // The eighth chapter of this bundle never carries a context section, so it must not be
    // declared as a gap. Counting against the list alone would pass if every chapter were
    // declared and the list happened to be the same length.
    const chapterCount = bundleWithContext(null).chapters.length;
    expect(chapterCount).toBeGreaterThan(ENTERPRISE_CONTEXT_CHAPTER_IDS.length);
    expect(declarations).toBeLessThan(chapterCount);
  });

  it("carries the same declaration into the PDF, not only the HTML", () => {
    const markup = renderToStaticMarkup(
      buildHomeWalkthroughPdf({
        bundle: bundleWithContext(null),
        recordSource: servingRecordSource,
        tenantLabel: "Synthetic Enterprise",
        format: "pdf",
      }),
    );
    expect(markup).toContain("ENTERPRISE CONTEXT NOT SERVED");
    expect(markup).toContain(
      "its rows could not establish a source-linked enterprise context",
    );
  });

  it("treats an aligned narrative as a deliberate suppression, not a gap", () => {
    // `coherence === "coherent"` means the narrative is aligned with the served record, so the
    // export renders the aligned narrative alone rather than repeating the source-linked tables.
    // That is a declared choice; this case exists so a later reader cannot mistake it for a miss.
    const coherent: HomeRecordRenderSource = {
      ...servingRecordSource,
      contextVersion: {
        ...servingRecordSource.contextVersion!,
        coherence: "coherent",
      },
    };
    const html = renderWith(bundleWithContext(null), coherent);
    expect(html).not.toContain("ENTERPRISE CONTEXT NOT SERVED");
  });
});
