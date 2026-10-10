/** @jest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { StepPageHostProps } from "../phase-step-pages";
import { P0_STEP_PAGES } from "../p0-step-pages";
import { P1_STEP_PAGES } from "../p1-step-pages";
import type { StepPageView } from "@/lib/programs/step-page-views";

let mockEvidenceReadable = true;
jest.mock("../StepEvidence", () => ({
  useStepEvidence: () => ({
    pending: [], approvedCount: 1, readable: mockEvidenceReadable, loaded: true, message: null, uploading: false,
    upload: async () => undefined, pickFor: () => undefined,
    pendingLabels: [], rowIdFor: () => null, summary: "1 approved file",
    clauses: [], rows: [], uploadControl: null,
  }),
}));

afterEach(() => { cleanup(); mockEvidenceReadable = true; });

function host(phase: number, values: Record<string, string> = {}, participants: Array<{ personId: string; name: string; role: string }> = []): StepPageHostProps {
  return {
    move: { id: "move-1", displayCode: "SYNTHETIC-MOVE", name: "Synthetic Move", archetype: "technical_product", participants } as StepPageHostProps["move"],
    phase, values, setValue: jest.fn(), priorPhaseCapture: null,
    canApproveGates: true, currentUser: null, stepDone: {},
    chrome: {
      stepIndex: 0, phaseHref: (value) => `/phase/${value}`, tabs: null,
      phases: [{ code: `P${phase}`, name: phase === 0 ? "Originate" : "Charter", status: "", current: true }],
      steps: Array.from({ length: 5 }, (_, index) => ({ title: `Step ${index + 1}`, depth: "full" as const, href: `/step/${index + 1}` })),
    },
    dock: (page: ReactNode, options) => <>{page}{options.notesPanel}</>,
    gateProps: {} as StepPageHostProps["gateProps"],
  };
}

function page(view: StepPageView, props: StepPageHostProps) {
  const component = (props.phase === 0 ? P0_STEP_PAGES : P1_STEP_PAGES)[view];
  if (!component) throw new Error(`No page for ${view}`);
  return render(<>{component(props)}</>);
}

const views: Array<[StepPageView, number, string]> = [
  ["p0-signal", 0, "Business trigger"],
  ["p0-scope", 0, "In scope"],
  ["p0-value", 0, "Initial value hypothesis"],
  ["p0-owner-evidence", 0, "Known evidence"],
  ["p1-sponsor-scope", 1, "Sponsor contact and progress updates"],
  ["p1-stakeholders", 1, "Decision rights"],
  ["p1-success", 1, "Success criteria"],
  ["p1-evidence-change", 1, "Evidence plan"],
];

describe("P0 and P1 text capture step pages", () => {
  it.each(views)("mounts %s with a decision row and count", (view, phase, label) => {
    page(view, host(phase));
    expect(screen.getByRole("heading", { name: /Needs your decision/ })).toBeTruthy();
    expect(screen.getByText(label, { selector: ".rc-cause" })).toBeTruthy();
    expect(screen.getByRole("status", { name: "What to do next" }).textContent).toContain("0 of");
    if (view === "p0-signal") expect(screen.getByRole("status", { name: "What to do next" }).textContent).toContain("Record business trigger and problem statement.");
  });

  it("saves typed team words through the capture setter and settles the saved row", () => {
    const props = host(0);
    const mounted = page("p0-signal", props);
    fireEvent.change(screen.getByRole("textbox", { name: "Business trigger" }), { target: { value: "An observed signal" } });
    expect(screen.getByText("Your capture answer · review")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Save" })[0]);
    expect(props.setValue).toHaveBeenCalledWith("business_trigger", "An observed signal");
    expect(props.setValue).toHaveBeenCalledWith("p0_signal_step", expect.stringContaining('"status":"accepted"'));
    mounted.rerender(<>{P0_STEP_PAGES["p0-signal"]?.(host(0, { business_trigger: "An observed signal", problem_statement: "A team problem" }))}</>);
    expect(screen.getByRole("heading", { name: /Settled/ })).toBeTruthy();
    expect(screen.getByRole("status", { name: "What to do next" }).textContent).toContain("2 of 2 settled");
  });

  it("copies exact session-note lines into a draft without overwriting a saved answer", () => {
    const props = host(0, { business_trigger: "Already recorded" });
    page("p0-signal", props);
    fireEvent.change(screen.getByRole("textbox", { name: "Paste labelled session notes" }), { target: { value: "Business trigger: Overwrite attempt\nProblem statement: Verbatim team note" } });
    fireEvent.click(screen.getByRole("button", { name: "Fill this step from my notes" }));
    expect(props.setValue).toHaveBeenCalledWith("p0_signal_step", expect.stringContaining("Verbatim team note"));
    expect(props.setValue).not.toHaveBeenCalledWith("business_trigger", "Overwrite attempt");
  });

  it("does not infer sponsor assignment from contact text", () => {
    page("p1-sponsor-scope", host(1, { sponsor_commitment: "Contact only", scope_boundary: "In and out" }));
    expect(screen.getByText(/contact answer does not assign a Move participant/)).toBeTruthy();
    expect(screen.getByText(/sponsor role must then be assigned separately/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open Users & Access →" }).getAttribute("href")).toBe("/admin/users-access");
    expect(screen.getByRole("status", { name: "What to do next" }).textContent).toContain("2 of 3 settled");
  });

  it("keeps P0.4 open until the specific source evidence requirement is covered", () => {
    const props = host(0, {
      stakeholder_owner_view: "Owner role", known_evidence: "Source list", missing_evidence_open_questions: "Open caveats",
    });
    props.p0SourceEvidenceReady = false;
    page("p0-owner-evidence", props);
    expect(screen.getByText("P0 source evidence", { selector: ".rc-cause" })).toBeTruthy();
    expect(screen.getByRole("status", { name: "What to do next" }).textContent).toContain("3 of 4 settled");
  });

  it("keeps a P0 answer open while its autosave is pending", () => {
    const props = host(0, { business_trigger: "A trigger", problem_statement: "A problem" });
    props.captureSaved = { business_trigger: true, problem_statement: false };
    page("p0-signal", props);
    expect(screen.getByText(/answer is still saving/)).toBeTruthy();
    expect(screen.getByRole("status", { name: "What to do next" }).textContent).toContain("1 of 2 settled");
  });

  it("keeps a saved P1 answer open while its charter basis is not ready", () => {
    const props = host(1, { success_criteria: "A directional measure" });
    props.sectionReady = { success_criteria: false };
    page("p1-success", props);
    expect(screen.getByText(/charter basis or required evidence is still open/)).toBeTruthy();
    expect(screen.getByRole("status", { name: "What to do next" }).textContent).toContain("0 of 1 settled");
  });

  it("blocks when evidence status cannot be read and links to the evidence surface", () => {
    mockEvidenceReadable = false;
    page("p0-signal", host(0));
    expect(screen.getByRole("status", { name: "What to do next" }).textContent).toContain("Wait for the evidence review status");
    expect(screen.getByRole("link", { name: "Open evidence →" }).getAttribute("href")).toContain("legacy=1");
  });

  it("holds an uncited planning figure and accepts a register-cited estimate", () => {
    const props = host(1);
    page("p1-success", props);
    fireEvent.change(screen.getByRole("textbox", { name: "Success criteria" }), { target: { value: "Improve by 20%." } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("alert").textContent).toContain("Assumptions register");
    expect(props.setValue).not.toHaveBeenCalledWith("success_criteria", "Improve by 20%.");
    fireEvent.change(screen.getByRole("textbox", { name: "Success criteria" }), { target: { value: "Improve by 20% [A:1]." } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(props.setValue).toHaveBeenCalledWith("success_criteria", "Improve by 20% [A:1].");
  });

  it("reuses the structured business change editor and charter basis control", () => {
    const props = host(1);
    props.charterBasis = { active: true, values: {}, approvedSources: {}, errors: {}, setValue: jest.fn() };
    page("p1-evidence-change", props);
    expect(screen.getByRole("combobox", { name: "Expected workflow change" })).toBeTruthy();
    expect(screen.getAllByText("How do you know this?").length).toBe(2);
  });
});
