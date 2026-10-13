/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type {
  ChapterView,
  HomeRecordRenderSource,
  HomeReviewBundle,
  TechObjectType,
} from "@/lib/home/preview/types";
import { ChapterCanvas, InspectionEvidence } from "../ChapterCanvas";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
jest.mock("recharts", () => {
  const Container = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Container, BarChart: Container, Bar: () => null,
    LabelList: () => null, CartesianGrid: () => null, Tooltip: () => null,
    XAxis: () => null, YAxis: () => null,
  };
});

const reviewed: HomeRecordRenderSource = {
  kind: "reviewed_snapshot", canonicalSnapshotHash: "stored-reference",
};
const unverified: HomeRecordRenderSource = {
  kind: "ecl_serving_projection", canonicalSnapshotHash: "served-reference",
};
const model = "Delivery system paired with a health plan. Revenue splits 55% delivery / 45% health plan; plan revenue splits 65% Medicare Advantage and Medicare FFS / 35% commercial.";
const originalBusiness = "Vendor spend places infrastructure outside internal control. Medicare Advantage and Medicare FFS comprise a combined share.";
const originalVoice = "The CEO testified that leadership needs clearer value evidence.";

function chapter(chapterId: ChapterView["chapterId"]): ChapterView {
  return {
    chapterId, title: "Reference chapter", guidingQuestion: "What is established?",
    headline: "Published headline", executive_synthesis: "Published synthesis.",
    key_insights: [], tensions: [], what_to_watch: [], questions_to_ask: [],
    visual_opportunities: [], limitations: [],
  };
}

function bundle(): HomeReviewBundle {
  const chapters = [chapter("executive_brief"), chapter("our_business"), chapter("leadership_perspective"), chapter("strategy_value_creation")];
  chapters[0].key_insights = [{
    statement: "Recorded program requires a funding decision.", evidence_ids: ["sig_program"],
    confidence: "high", claim_type: "FACT",
  }];
  chapters[1].executive_synthesis = originalBusiness;
  chapters[1].key_insights = [{
    statement: originalBusiness, evidence_ids: ["ctx_model"],
    confidence: "medium", claim_type: "ADVISORY_INFERENCE",
  }];
  chapters[2].executive_synthesis = originalVoice;
  chapters[2].key_insights = [{
    statement: originalVoice, evidence_ids: ["sig_voice"],
    confidence: "medium", claim_type: "OBSERVATION",
  }];
  return {
    tenantKey: CANONICAL_TENANT_KEYS[0], declaredSyntheticDemo: true,
    provenance: { generated_at: "2026-08-01T00:00:00Z" }, chapters,
    thesis: {
      signalPacket: {
        enterpriseIdentity: { businessModel: model, industry: "Healthcare", revenue: 1000000, employeeCount: 10 },
        businessEconomics: { operatingSegments: ["Care delivery", "Plan operations"], customerSegments: ["Medicare Advantage members", "Medicare FFS beneficiaries"], technologyBudget: null, technologyBudgetShareOfRevenue: null },
        strategicPriorities: ["Improve quality", "Review delivery funding"],
        contextItems: [
          { id: "ctx_model", statement: `Business model: ${model}`, domains: ["tenant_profile"], evidenceRefs: ["profile-row-1"] },
          { id: "ctx_priority", statement: "Declared strategic priority: Improve quality", domains: ["tenant_profile"] },
        ],
        signals: [
          { id: "sig_program", kind: "portfolio", statement: "Recorded program requires a funding decision.", domains: ["program_initiative"], evidenceRefs: ["program-row-1"] },
          { id: "sig_voice", kind: "testimony", statement: 'A Chief Executive Officer said, on the theme of "value": "Review the evidence."', domains: ["ai_value_interview_evidence"], evidenceRefs: ["reference-role"] },
        ],
        visualDatasets: { stalled_programs: [{ program: "Recorded program", pctComplete: 5 }, { program: "Second program", pctComplete: 20 }] },
        sourceSummaries: [], coverageManifest: {},
      },
      publishedGeneration: {}, verificationLedger: [], structuralIssues: [],
    },
    technologyEstate: { recordTypes: [] },
  } as unknown as HomeReviewBundle;
}

function addFamily(record: HomeReviewBundle, objectType: TechObjectType, rows: Record<string, string>[]) {
  record.technologyEstate!.recordTypes.push({
    objectType, label: "Reference family", columns: [], rows,
    primaryDimension: "name", dimensionCounts: [], rowSourceRefs: rows.map((_, i) => [`row-ref-${i}`]),
  });
}

function canvas(
  chapterId: ChapterView["chapterId"],
  panel: "overview" | "reading" | "evidence" = "overview",
  record = bundle(),
  source = reviewed,
) {
  const inspect = jest.fn();
  const rendered = render(<ChapterCanvas
    chapter={record.chapters.find((item) => item.chapterId === chapterId)!}
    bundle={record} source={source} tenantName="Reference enterprise" panel={panel}
    href={(view, selected = "overview") => `/home?view=${view}&panel=${selected}`}
    inspect={inspect}
  />);
  return { ...rendered, inspect };
}

afterEach(cleanup);

describe("bounded Home chapter story and provenance", () => {
  it("leads with the same declared business mix and preserves cited executive inspection", () => {
    const { inspect } = canvas("executive_brief");
    expect(screen.getByRole("heading", { name: /delivery \(55% of revenue\).*health plan \(45% of revenue\)/ })).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 2 programs in the 2-program execution exhibit/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Read & verify" })[0]);
    const detail = inspect.mock.calls[0][0];
    expect(detail.title).toBe("Claim and evidence");
    expect(detail.text).toContain("Recorded program requires a funding decision.");
    expect(detail.text).toContain('"pctComplete":5');
    expect(detail.evidenceIds).toContain("sig_program");
    expect(detail.basis).toMatch(/not schedule variance/);
  });

  it("keeps MA and FFS combined and leads with declared populations and segments", () => {
    const { inspect } = canvas("our_business");
    expect(screen.getByText(model)).toBeInTheDocument();
    expect(screen.getByText(/Combined MA \+ Medicare FFS share/)).toBeInTheDocument();
    expect(screen.getByText("Medicare FFS beneficiaries")).toBeInTheDocument();
    expect(screen.getByText("Care delivery; Plan operations")).toBeInTheDocument();
    expect(screen.queryByText(/internal-control deficit/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Profile basis" }));
    expect(inspect.mock.calls[0][0]).toMatchObject({ text: model, evidenceIds: ["ctx_model"] });
  });

  it("retains original generated text in reading with specific limits and source state", () => {
    const record = bundle();
    const before = JSON.stringify(record);
    const { container, inspect } = canvas("our_business", "reading", record);
    expect(screen.getAllByText(originalBusiness)).toHaveLength(2);
    expect(container.querySelector("[data-reading-basis]")).toHaveTextContent("Vendor spend does not establish an internal-control deficit.");
    expect(screen.getByText(/Reviewed stored record.*Data as of not established/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Read & verify" }));
    expect(inspect.mock.calls[0][0].text).toBe(originalBusiness);
    expect(inspect.mock.calls[0][0].basis).toContain("MA-only share");
    expect(JSON.stringify(record)).toBe(before);
  });

  it("keeps synthetic basis local to leadership reading, claims and inspection", () => {
    const { container, inspect } = canvas("leadership_perspective", "reading");
    expect(container.querySelector("[data-reading-basis]")).toHaveTextContent("Synthetic leadership reference; not client-attested testimony.");
    expect(within(container.querySelector("article")!).getByText(/Synthetic leadership reference/)).toBeInTheDocument();
    expect(screen.getAllByText(originalVoice)).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Read & verify" }));
    expect(inspect.mock.calls[0][0]).toMatchObject({ text: originalVoice, evidenceIds: ["sig_voice"] });
    expect(inspect.mock.calls[0][0].basis).toContain("not client-attested testimony");
  });

  it("carries synthetic basis through claim-source and additional-context evidence lanes", () => {
    const { inspect } = canvas("leadership_perspective", "evidence");
    fireEvent.click(screen.getByRole("button", { name: /Published claim sources/ }));
    expect(screen.getByText(/Synthetic leadership reference/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Additional on-topic context/ }));
    expect(screen.getByText(/Synthetic leadership reference/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Read & verify" }));
    expect(inspect.mock.calls[0][0].basis).toContain("not client-attested testimony");
  });

  it("labels modelled voices without inventing a synthetic declaration", () => {
    const record = bundle();
    delete record.declaredSyntheticDemo;
    addFamily(record, "executive_interview", [{ responseBasis: "modelled", response: "Reference response" }]);
    const { container } = canvas("leadership_perspective", "reading", record);
    expect(container.querySelector("[data-reading-basis]")).toHaveTextContent("Modelled responses present");
    expect(screen.queryByText(/Synthetic leadership reference/)).not.toBeInTheDocument();
  });

  it("keeps undeclared response basis unknown", () => {
    const record = bundle();
    delete record.declaredSyntheticDemo;
    canvas("leadership_perspective", "reading", record);
    expect(screen.getAllByText(/Leadership response basis not established/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Synthetic leadership reference/)).not.toBeInTheDocument();
  });

  it("labels resolved reference excerpts without denying supplied lineage", () => {
    render(<InspectionEvidence detail={{ title: "Reference", text: originalVoice, evidenceIds: ["sig_voice", "ctx_model"] }} bundle={bundle()} />);
    expect(screen.getAllByText(/not client-attested testimony/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("1 declared source references")).toHaveLength(2);
    expect(screen.getByText("profile-row-1")).toBeInTheDocument();
    expect(screen.getByText("reference-role")).toBeInTheDocument();
    expect(screen.getAllByText(/source-row or document links are not resolved here/)).toHaveLength(2);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText(/row-level verification not established/)).not.toBeInTheDocument();
  });

  it("shows aligned compiled program coverage without calling exhibit rows a record count", () => {
    const { inspect } = canvas("strategy_value_creation");
    const metric = screen.getByRole("button", { name: "Inspect Programs basis" }).parentElement!;
    expect(metric).toHaveTextContent("Summary available");
    expect(metric).toHaveTextContent("Compiled summary; detail rows not supplied");
    expect(metric.querySelector("strong")).toHaveTextContent("Summary available");
    fireEvent.click(screen.getByRole("button", { name: "Inspect Programs basis" }));
    const detail = inspect.mock.calls[0][0];
    expect(detail.evidenceIds).toContain("sig_program");
    expect(detail.text).toContain("Recorded program");
    expect(detail.text).toContain("stored-reference");
    expect(detail.text).toContain("sig_program");
    expect(detail.basis).toContain("summary coverage does not establish detail coverage");
  });

  it("preserves recorded zero despite an available summary", () => {
    const record = bundle();
    addFamily(record, "program_initiative", []);
    canvas("strategy_value_creation", "overview", record);
    const metric = screen.getByRole("button", { name: "Inspect Programs basis" }).parentElement!;
    expect(metric.querySelector("strong")).toHaveTextContent(/^0$/);
    expect(metric).toHaveTextContent("Rows in selected record");
  });

  it("keeps exact supplied rows and their references inspectable", () => {
    const record = bundle();
    addFamily(record, "program_initiative", [{ name: "Recorded program" }]);
    const { inspect } = canvas("strategy_value_creation", "overview", record);
    const metric = screen.getByRole("button", { name: "Inspect Programs basis" }).parentElement!;
    expect(metric.querySelector("strong")).toHaveTextContent(/^1$/);
    fireEvent.click(screen.getByRole("button", { name: "Inspect Programs basis" }));
    expect(inspect.mock.calls[0][0].sourceRefs).toContain("row-ref-0");
  });

  it("does not promote unaligned compiled coverage or old execution into the served overview", () => {
    const { container, inspect } = canvas("strategy_value_creation", "overview", bundle(), unverified);
    const metric = screen.getByRole("button", { name: "Inspect Programs basis" }).parentElement!;
    expect(metric.querySelector("strong")).toHaveTextContent("Detail not supplied");
    fireEvent.click(screen.getByRole("button", { name: "Inspect Programs basis" }));
    expect(inspect.mock.calls[0][0].evidenceIds).toEqual([]);
    expect(container).not.toHaveTextContent("Summary available");
    cleanup();
    const executive = canvas("executive_brief", "overview", bundle(), unverified);
    expect(executive.container).not.toHaveTextContent("55% of revenue");
    fireEvent.click(screen.getAllByRole("button", { name: "Read & verify" })[0]);
    expect(executive.inspect.mock.calls[0][0].evidenceIds).toEqual([]);
    expect(executive.inspect.mock.calls[0][0].text).not.toContain('"pctComplete"');
  });
});
