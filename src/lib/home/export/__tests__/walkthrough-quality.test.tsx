import { Document, Page, Text, View } from "@react-pdf/renderer";
import { isValidElement, type ReactElement, type ReactNode } from "react";

import { chapterDepth } from "@/components/home/v4/chapter-page-content";
import type { TableSpec } from "@/components/home/v4/page-tables";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { buildHomeWalkthroughPdf } from "@/lib/home/export/walkthrough-export";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import { homeRecordSourceToken } from "@/lib/home/preview/record-source-token";
import type {
  ChapterView,
  GroundedClaim,
  HomeRecordRenderSource,
  HomeReviewBundle,
} from "@/lib/home/preview/types";

jest.mock("@/components/home/v4/chapter-page-content", () => ({
  chapterDepth: jest.fn(() => ({ tables: [], findings: [], unsupported: [] })),
}));

interface PdfNodeProps {
  children?: ReactNode;
  fixed?: boolean;
  wrap?: boolean;
  minPresenceAhead?: number;
  render?: (props: { pageNumber: number; totalPages: number }) => string;
  style?: { paddingTop?: number; paddingBottom?: number; top?: number; bottom?: number };
}

const primitives = new Set<ReactElement["type"]>([Document, Page, Text, View]);

function resolve(node: ReactElement<PdfNodeProps>): ReactNode {
  if (typeof node.type === "function" && !primitives.has(node.type)) {
    return (node.type as (props: PdfNodeProps) => ReactNode)(node.props);
  }
  return node.props.children;
}

function nodes(node: ReactNode): ReactElement<PdfNodeProps>[] {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!isValidElement<PdfNodeProps>(node)) return [];
  return [node, ...nodes(resolve(node))];
}

function content(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(content).join("");
  if (!isValidElement<PdfNodeProps>(node)) return "";
  return content(resolve(node));
}

function claim(statement: string): GroundedClaim {
  return {
    statement,
    evidence_ids: ["EVID-001"],
    confidence: "medium",
    claim_type: "OBSERVATION",
  };
}

function fixture(): HomeReviewBundle {
  const tenantKey = CANONICAL_TENANT_KEYS.find((key) => getHomeReviewBundle(key));
  const base = tenantKey ? getHomeReviewBundle(tenantKey) : null;
  if (!base) throw new Error("Expected a Home bundle for a canonical tenant");
  const bundle = structuredClone(base);
  const leadership: ChapterView = {
    chapterId: "leadership_perspective",
    title: "Leadership Perspective",
    guidingQuestion: "Which perspectives need further evidence?",
    headline: "Compiled leadership perspectives",
    executive_synthesis: "A stored summary requiring source review.",
    key_insights: [claim("Illustrative perspective on delivery")],
    tensions: [claim("Illustrative perspective on accountability")],
    what_to_watch: [claim("Illustrative perspective on measurement")],
    questions_to_ask: ["What evidence would confirm this perspective?"],
    limitations: ["Interview detail is not supplied."],
    visual_opportunities: [],
  };
  bundle.declaredSyntheticDemo = true;
  bundle.provenance.generated_at = "2026-08-21T00:00:00Z";
  bundle.chapters = [leadership];
  bundle.thesis.signalPacket.signals = [];
  bundle.thesis.signalPacket.contextItems = [];
  bundle.thesis.signalPacket.homeEnterpriseContext = null;
  bundle.technologyEstate = { recordTypes: [] };
  return bundle;
}

const storedSource: HomeRecordRenderSource = {
  kind: "reviewed_snapshot",
  canonicalSnapshotHash: "reviewed-record-marker",
};

const servingSource: HomeRecordRenderSource = {
  kind: "ecl_serving_projection",
  canonicalSnapshotHash: "serving-row-marker",
  contextVersion: {
    assessmentId: "assessment-001",
    projectionContentHash: "projection-hash",
    sourceLineageHash: "lineage-hash",
    sourceCoverage: { totalRecordRows: 3, linkedRecordRows: 1, families: [] },
    deterministicPacketHash: "packet-hash",
    narrativePacketHash: null,
    narrativeGeneratedAt: "2026-08-21T00:00:00Z",
    dataAsOf: null,
    coherence: "stored_narrative",
  },
};

function documentFor(bundle = fixture(), recordSource = storedSource) {
  return buildHomeWalkthroughPdf({
    bundle,
    recordSource,
    tenantLabel: "Synthetic Enterprise",
    format: "pdf",
  });
}

afterEach(() => {
  jest.mocked(chapterDepth).mockReturnValue({
    tables: [], findings: [], unsupported: [],
  });
});

describe("Home PDF briefing quality", () => {
  it("labels the textual scope and compiled-versus-inspectable basis on the cover", () => {
    const cover = nodes(documentFor()).find((node) => node.type === Page);
    const output = content(cover);
    expect(output).toContain("AbarVa Home Walkthrough Export");
    expect(output).toContain("Text and table briefing");
    expect(output).toContain("Charts and architecture/data-flow maps are not included");
    expect(output).toContain("Exhibits are textual summaries");
    expect(output).toContain("Synthetic reference - Not client-attested");
    expect(output).toContain("Compiled packet:");
    expect(output).toContain("do not establish inspectable detail rows");
    expect(output).toContain("Evidence references are not proof that source rows can be opened");
    expect(output).toContain("Counting basis: rows present in each record family in this Home bundle");
    expect(output).toContain("not an aVa chat transcript");
    expect(output).toContain("Data as of not established");
  });

  it.each([storedSource, servingSource, {
    ...storedSource, kind: "reviewed_snapshot_fallback" as const,
  }])("retains the source binding and source state for $kind", (recordSource) => {
    const bundle = fixture();
    const output = content(documentFor(bundle, recordSource));
    expect(output).toContain(homeRecordSourceToken(bundle.tenantKey, recordSource));
    expect(output).toContain(recordSource.canonicalSnapshotHash);
    expect(output).toContain("only rows in this Home bundle");
    if (recordSource.kind === "ecl_serving_projection") {
      expect(output).toContain("Record on screen: Live governed rows");
      expect(output).toContain("Reviewed narrative; live rows may differ");
      expect(output).toContain("Source-linked: 1 of 3 record rows");
      expect(output).toContain("No leadership interview rows are served here");
    } else {
      expect(output).toContain("Reviewed stored record");
      expect(output).toContain("Reviewed stored narrative");
      expect(output).not.toContain("Record on screen: Live governed rows");
    }
  });

  it.each([storedSource, servingSource])("keeps synthetic basis with Leadership synthesis and every claim for $kind", (recordSource) => {
    const bundle = fixture();
    const document = documentFor(bundle, recordSource);
    const unbreakable = nodes(document).filter((node) =>
      node.type === View && node.props.wrap === false,
    );
    const chapter = bundle.chapters[0];
    const excerpts = [chapter.executive_synthesis, ...[
      ...chapter.key_insights, ...chapter.tensions, ...chapter.what_to_watch,
    ].map((item) => item.statement)];
    for (const excerpt of excerpts) {
      const group = unbreakable.find((node) => content(node).includes(excerpt));
      expect(group).toBeDefined();
      expect(content(group)).toContain("Synthetic reference - Not client-attested");
      expect(content(group)).toContain("do not establish what leaders actually said");
      expect(content(group)).toContain("Theme mentions do not establish agreement");
    }
    for (const item of [...chapter.key_insights, ...chapter.tensions, ...chapter.what_to_watch]) {
      expect(content(document)).toContain(item.statement);
      expect(content(document)).toContain("Evidence: EVID-001");
    }
    expect(content(document)).toContain(chapter.questions_to_ask[0]);
    expect(content(document)).toContain(chapter.limitations[0]);
  });

  it.each([false, undefined])("does not infer synthetic status when declaration is %s", (declaration) => {
    const bundle = fixture();
    bundle.declaredSyntheticDemo = declaration;
    const output = content(documentFor(bundle));
    expect(output).not.toContain("Synthetic reference - Not client-attested");
    expect(output).toContain("Client attestation is not established by this export");
    expect(output).toContain("Leadership response basis: client attestation is not established");
  });

  it("distinguishes absent families from supplied empty rows", () => {
    const bundle = fixture();
    bundle.technologyEstate = undefined;
    const absent = content(documentFor(bundle));
    expect(absent).toContain("Applications: Not supplied; platforms: Not supplied");
    expect(absent).toContain("Data asset and integration records: Not supplied");
    expect(absent).not.toContain("0 data asset and integration records");
    bundle.technologyEstate = { recordTypes: [{
      objectType: "application_system", label: "Applications & Systems",
      rows: [], columns: [], primaryDimension: "status", dimensionCounts: [],
    }] };
    expect(content(documentFor(bundle))).toContain("Applications: 0 records; platforms: Not supplied");
  });

  it.each([0, 1, 6, 7, 17])("keeps the final %i-row table chunk, total and note together without losing cells", (rowCount) => {
    const table: TableSpec = {
      caption: "Record coverage",
      columns: ["Record", "Basis"],
      rows: Array.from({ length: rowCount }, (_, index) => [
        `ROW-${String(index + 1).padStart(2, "0")}`, `BASIS-${index + 1}`,
      ]),
      total: ["TOTAL-MARKER", rowCount],
      note: "Table note: all supplied rows are retained; missing detail is unknown.",
    };
    jest.mocked(chapterDepth).mockReturnValue({
      tables: [table], findings: [], unsupported: [],
    });
    const document = documentFor();
    const groups = nodes(document).filter((node) =>
      node.type === View && node.props.wrap === false && content(node).includes(table.caption),
    );
    expect(groups).toHaveLength(Math.max(1, Math.ceil(rowCount / 6)));
    const final = groups.at(-1);
    expect(content(final)).toContain(table.total![0]);
    expect(content(final)).toContain(table.note);
    expect(nodes(document).filter((node) =>
      node.type === Text && content(node) === table.note,
    )).toHaveLength(1);
    expect(nodes(document).filter((node) =>
      node.type === Text && content(node) === "TOTAL-MARKER",
    )).toHaveLength(1);
    for (const row of table.rows) {
      for (const cell of row) {
        expect(nodes(document).filter((node) =>
          node.type === Text && content(node) === cell,
        )).toHaveLength(1);
      }
    }
    if (rowCount) expect(content(final)).toContain(table.rows.at(-1)![0]);
    for (const group of groups) {
      expect(content(group)).toContain("RecordBasis");
    }
  });

  it("reserves margins and repeats section context and global page numbers on every page", () => {
    const pages = nodes(documentFor()).filter((node) => node.type === Page);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      const descendants = nodes(page.props.children);
      const heading = descendants.find((node) =>
        node.type === Text && node.props.fixed && !node.props.render,
      );
      const footer = descendants.find((node) =>
        node.type === Text && node.props.fixed && node.props.render,
      );
      expect(heading).toBeDefined();
      expect(footer?.props.render?.({ pageNumber: 4, totalPages: 12 })).toBe("Page 4 of 12");
      expect(page.props.style?.paddingTop).toBeGreaterThan(heading?.props.style?.top ?? 0);
      expect(page.props.style?.paddingBottom).toBeGreaterThan(footer?.props.style?.bottom ?? 0);
    }
    const leadershipHeader = nodes(pages[1].props.children).find((node) =>
      node.type === Text && node.props.fixed && !node.props.render,
    );
    expect(content(leadershipHeader)).toContain("Chapter 01 - Leadership Perspective");
    expect(content(leadershipHeader)).toContain("Synthetic reference - Not client-attested");
  });

  it("keeps each section heading with its first content block", () => {
    jest.mocked(chapterDepth).mockReturnValue({
      findings: [{ kind: "established", claim: "Finding marker", owner: "Record owner", because: "Row basis" }],
      tables: [{ caption: "Table marker", columns: ["Record"], rows: [["ROW-01"]] }],
      unsupported: [{ caption: "Gap marker", missingColumn: "detail", why: "Not supplied" }],
    });
    const bundle = fixture();
    const groups = nodes(documentFor(bundle)).filter((node) =>
      node.type === View && node.props.wrap === false,
    );
    const firstContent = [
      ["Key insights", bundle.chapters[0].key_insights[0].statement],
      ["Tensions", bundle.chapters[0].tensions[0].statement],
      ["What to watch", bundle.chapters[0].what_to_watch[0].statement],
      ["Questions to ask", bundle.chapters[0].questions_to_ask[0]],
      ["Limitations", bundle.chapters[0].limitations[0]],
      ["Deterministic Findings", "Finding marker"],
      ["Deterministic Tables", "ROW-01"],
      ["Evidence Gaps", "Gap marker"],
    ];
    for (const [heading, first] of firstContent) {
      expect(groups.some((group) =>
        content(group).includes(heading) && content(group).includes(first),
      )).toBe(true);
    }
  });
});
