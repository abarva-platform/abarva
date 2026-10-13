/** @jest-environment jsdom */
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { isValidElement, type ReactElement, type ReactNode } from "react";

import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import {
  buildHomeWalkthroughPdf,
  renderHomeWalkthroughHtml,
} from "@/lib/home/export/walkthrough-export";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import type {
  GroundedClaim,
  HomeRecordRenderSource,
  HomeReviewBundle,
} from "@/lib/home/preview/types";

jest.mock("@/components/home/v4/chapter-page-content", () => ({
  chapterDepth: () => ({ tables: [], findings: [], unsupported: [] }),
}));

const syntheticLimit = "Synthetic leadership reference; not client-attested testimony. Mentions are not agreement.";
const modelledLimit = "Modelled responses present; published transcript basis not established. Mentions are not agreement.";
const unknownLimit = "Leadership response basis not established. Mentions are not agreement.";
const combinedLimit = "Combined MA + Medicare FFS share is not an MA-only share or Star Rating exposure.";
const spendLimit = "Vendor spend does not establish an internal-control deficit.";

const reviewed: HomeRecordRenderSource = {
  kind: "reviewed_snapshot",
  canonicalSnapshotHash: "reviewed-reference-marker",
};
const mixed: HomeRecordRenderSource = {
  kind: "ecl_serving_projection",
  canonicalSnapshotHash: "served-reference-marker",
  contextVersion: {
    assessmentId: "reference-assessment",
    projectionContentHash: "reference-projection",
    sourceLineageHash: "reference-lineage",
    sourceCoverage: { totalRecordRows: 0, linkedRecordRows: 0, families: [] },
    deterministicPacketHash: "reference-packet",
    narrativePacketHash: null,
    narrativeGeneratedAt: "2026-08-01T00:00:00Z",
    dataAsOf: null,
    coherence: "stored_narrative",
  },
};
const coherent: HomeRecordRenderSource = {
  ...mixed,
  contextVersion: { ...mixed.contextVersion!, coherence: "coherent" },
};

function claim(statement: string, evidenceIds: string[] = []): GroundedClaim {
  return {
    statement, evidence_ids: evidenceIds,
    confidence: "medium", claim_type: "ADVISORY_INFERENCE",
  };
}

function fixture(): HomeReviewBundle {
  const tenantKey = CANONICAL_TENANT_KEYS.find((key) => getHomeReviewBundle(key));
  const base = tenantKey ? getHomeReviewBundle(tenantKey) : null;
  if (!base) throw new Error("Expected a Home bundle for a canonical tenant");
  const bundle = JSON.parse(JSON.stringify(base)) as HomeReviewBundle;
  bundle.declaredSyntheticDemo = true;
  bundle.provenance.generated_at = "2026-08-01T00:00:00Z";
  bundle.chapters = [{
    chapterId: "executive_brief",
    title: "Illustrative executive brief",
    headline: "Stored reference interpretation",
    guidingQuestion: "What does this reference establish?",
    executive_synthesis: "Illustrative leadership was interviewed. Medicare Advantage and Medicare FFS have a combined share. Vendor spend indicates an internal-control deficit.",
    key_insights: [claim("Illustrative leaders described a delivery priority.", ["sig_voice"])],
    tensions: [claim("Medicare Advantage and Medicare FFS have a combined share.")],
    what_to_watch: [claim("Vendor spend indicates an internal-control deficit.")],
    questions_to_ask: ["Which source basis needs review?"],
    limitations: ["Current attestation and transcript basis are not established."],
    visual_opportunities: [],
  }];
  bundle.thesis.signalPacket.signals = [{
    id: "sig_voice", kind: "testimony",
    statement: "Illustrative reference response.",
    domains: ["executive_interview"], evidenceRefs: ["reference-response-row"],
  }];
  bundle.thesis.signalPacket.contextItems = [];
  bundle.thesis.signalPacket.homeEnterpriseContext = null;
  bundle.technologyEstate = { recordTypes: [] };
  return bundle;
}

interface PdfProps {
  children?: ReactNode;
  wrap?: boolean;
}
const primitives = new Set<ReactElement["type"]>([Document, Page, Text, View]);

function children(node: ReactElement<PdfProps>): ReactNode {
  return typeof node.type === "function" && !primitives.has(node.type)
    ? (node.type as (props: PdfProps) => ReactNode)(node.props)
    : node.props.children;
}

function nodes(node: ReactNode): ReactElement<PdfProps>[] {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!isValidElement<PdfProps>(node)) return [];
  return [node, ...nodes(children(node))];
}

function content(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(content).join("");
  return isValidElement<PdfProps>(node) ? content(children(node)) : "";
}

function outputs(bundle: HomeReviewBundle, recordSource = reviewed) {
  const input = { bundle, recordSource, tenantLabel: "Illustrative enterprise" };
  const html = new DOMParser().parseFromString(
    renderHomeWalkthroughHtml({ ...input, format: "html" }), "text/html",
  );
  const pdf = buildHomeWalkthroughPdf({ ...input, format: "pdf" });
  const groups = nodes(pdf).filter((node) => node.type === View && node.props.wrap === false);
  return { html, pdf, groups };
}

describe("Home walkthrough interpretation basis parity", () => {
  it.each([reviewed, coherent, mixed])("qualifies stored synthesis before its unchanged text for $kind / $contextVersion.coherence", (recordSource) => {
    const bundle = fixture();
    const before = JSON.stringify(bundle);
    const { html, pdf, groups } = outputs(bundle, recordSource);
    const synthesis = bundle.chapters[0].executive_synthesis;
    const chapter = html.querySelector("article.chapter")!;
    const limits = chapter.querySelector(".interpretation-limits")!;
    const group = groups.find((node) => content(node).includes(synthesis));
    expect(limits.textContent).toContain("Published interpretation limits");
    for (const caveat of [syntheticLimit, combinedLimit, spendLimit]) {
      expect(limits.textContent).toContain(caveat);
      expect(chapter.textContent!.indexOf(caveat)).toBeLessThan(chapter.textContent!.indexOf(synthesis));
      expect(content(group).indexOf(caveat)).toBeGreaterThanOrEqual(0);
      expect(content(group).indexOf(caveat)).toBeLessThan(content(group).indexOf(synthesis));
    }
    expect(chapter.textContent).toContain(synthesis);
    expect(content(pdf)).toContain("Synthetic reference - Not client-attested");
    expect(JSON.stringify(bundle)).toBe(before);
  });

  it.each([reviewed, coherent, mixed])("keeps each applicable qualifier with its claim across all sections for $kind / $contextVersion.coherence", (recordSource) => {
    const bundle = fixture();
    const { html, groups } = outputs(bundle, recordSource);
    const chapter = bundle.chapters[0];
    const cases = [
      [chapter.key_insights[0], syntheticLimit],
      [chapter.tensions[0], combinedLimit],
      [chapter.what_to_watch[0], spendLimit],
    ] as const;
    for (const [item, caveat] of cases) {
      const li = Array.from(html.querySelectorAll("article.chapter li")).find((node) => node.textContent?.includes(item.statement));
      const group = groups.find((node) => content(node).includes(item.statement) && !content(node).includes(chapter.executive_synthesis));
      expect(li?.textContent).toContain(caveat);
      expect(content(group)).toContain(caveat);
      expect(li!.textContent!.indexOf(caveat)).toBeLessThan(li!.textContent!.indexOf(item.statement));
      expect(content(group).indexOf(caveat)).toBeLessThan(content(group).indexOf(item.statement));
    }
    expect(html.querySelector("article.chapter")?.textContent).toContain("Evidence: reference-response-row");
    expect(content(groups)).toContain("Evidence: reference-response-row");
  });

  it.each(["testimony", "context"] as const)("uses resolved %s evidence even when the claim has no leadership keyword", (origin) => {
    const bundle = fixture();
    const statement = "Illustrative operating priority needs review.";
    bundle.chapters[0].key_insights = [claim(statement, ["voice_ref"])];
    bundle.thesis.signalPacket.signals = origin === "testimony" ? [{
      id: "voice_ref", kind: "testimony", statement, domains: [], evidenceRefs: [],
    }] : [];
    bundle.thesis.signalPacket.contextItems = origin === "context" ? [{
      id: "voice_ref", statement, domains: ["executive_interview"],
    }] : [];
    const { html, groups } = outputs(bundle);
    const li = Array.from(html.querySelectorAll("li")).find((node) => node.textContent?.includes(statement));
    const group = groups.find((node) => content(node).includes(statement));
    expect(li?.textContent).toContain(syntheticLimit);
    expect(content(group)).toContain(syntheticLimit);
  });

  it.each(["modelled", "modeled"])("retains %s response and transcript limits without declaring synthetic status", (responseBasis) => {
    const bundle = fixture();
    delete bundle.declaredSyntheticDemo;
    bundle.technologyEstate!.recordTypes = [{
      objectType: "executive_interview", label: "Illustrative response records",
      rows: [{ responseBasis }], columns: [], primaryDimension: null, dimensionCounts: [],
    }];
    const { html, groups } = outputs(bundle);
    expect(html.querySelector(".interpretation-limits")?.textContent).toContain(modelledLimit);
    const li = html.querySelector("article.chapter li")!;
    const group = groups.find((node) => content(node).includes(bundle.chapters[0].key_insights[0].statement));
    expect(li.textContent).toContain(modelledLimit);
    expect(content(group)).toContain(modelledLimit);
    expect(html.body.textContent).not.toContain(syntheticLimit);
    expect(content(groups)).not.toContain(syntheticLimit);
  });

  it("keeps missing response basis, data date and detail unknown", () => {
    const bundle = fixture();
    delete bundle.declaredSyntheticDemo;
    delete bundle.technologyEstate;
    const { html, pdf } = outputs(bundle);
    expect(html.body.textContent).toContain(unknownLimit);
    expect(content(pdf)).toContain(unknownLimit);
    for (const output of [html.body.textContent!, content(pdf)]) {
      expect(output).toContain("Data as of not established");
      expect(output).toContain("Applications: Not supplied");
      expect(output).not.toContain(syntheticLimit);
      expect(output).not.toContain("Applications: 0 records");
    }
  });

  it("retains current and prior labels, questions and limitations in a mixed record", () => {
    const bundle = fixture();
    const { html, pdf } = outputs(bundle, mixed);
    const prior = html.querySelector(".prior-interpretation")!;
    expect(prior.querySelector(".interpretation-limits")?.textContent).toContain(syntheticLimit);
    for (const output of [html.body.textContent!, content(pdf)]) {
      expect(output).toContain("Current record, interpretation pending review");
      expect(output).toContain("Prior reviewed interpretation");
      expect(output).toContain("Reviewed narrative; live rows may differ");
      expect(output).toContain(bundle.chapters[0].questions_to_ask[0]);
      expect(output).toContain(bundle.chapters[0].limitations[0]);
    }
    expect(html.querySelector(".chapter-state")?.textContent).not.toContain(syntheticLimit);
  });

  it("adds no unrelated caveats to an ordinary record claim", () => {
    const bundle = fixture();
    bundle.chapters[0].key_insights = [claim("Illustrative application owner is recorded.", ["unresolved_ref"])];
    const { html, groups } = outputs(bundle);
    const li = html.querySelector("article.chapter li")!;
    const group = groups.find((node) => content(node).includes(bundle.chapters[0].key_insights[0].statement));
    for (const output of [li.textContent!, content(group)]) {
      expect(output).toContain("Evidence: unresolved_ref");
      for (const caveat of [syntheticLimit, combinedLimit, spendLimit]) expect(output).not.toContain(caveat);
    }
  });
});
