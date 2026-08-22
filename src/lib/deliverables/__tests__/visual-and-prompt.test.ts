import {
  visualContractFor,
  checkVisualArtifactContract,
  VISUAL_ARTIFACT_STANDARD,
} from "../visual-artifact-contract";
import { buildArtifactPrompt } from "../solution-prompt-factory";
import {
  emptySolutionContext,
  applyPhaseDigest,
  type SolutionContext,
} from "@/lib/programs/solution-context";
import {
  modelTokenBudgetForArtifact,
  STRATEGIC_MOVES_DRAFT_CAVEAT,
} from "../strategic-moves-artifact-standard";
import {
  getPhaseDeliverablePackageContract,
  renderPhaseDeliverablePackagePrompt,
} from "@/lib/programs/phase-deliverable-package-contract";

describe("VisualArtifactContract — richness as a contract", () => {
  it("the architecture artifact requires conceptual/logical/physical + pattern visuals", () => {
    const c = visualContractFor("target_state_architecture")!;
    expect(c.requiredVisuals.join(" ")).toMatch(/conceptual/);
    expect(c.requiredVisuals.join(" ")).toMatch(/logical/);
    expect(c.requiredVisuals.join(" ")).toMatch(/physical/);
    expect(c.requiredVisuals.join(" ")).toMatch(/native/);
    expect(c.requiredVisuals.join(" ")).toMatch(/human \+ AI role model/);
    expect(c.requiredTables.join(" ")).toMatch(/current-to-future logic table/);
    expect(c.requiredTables.join(" ")).toMatch(
      /implementation work package table/,
    );
  });

  it("current-state/gap requires current-state diagram + data flow + gap matrix", () => {
    const c = visualContractFor("discovery_report")!;
    expect(c.requiredVisuals.join(" ")).toMatch(/current-state/);
    expect(c.requiredVisuals.join(" ")).toMatch(/data-flow/);
    expect(c.requiredTables.join(" ")).toMatch(/gap matrix/);
  });

  it("FAILS when required visuals/tables are missing (prose-only)", () => {
    const r = checkVisualArtifactContract("target_state_architecture", {
      visuals: ["conceptual architecture diagram"],
      tables: [],
    });
    expect(r.pass).toBe(false);
    expect(r.missingVisuals.length).toBeGreaterThan(0);
  });

  it("PASSES when the required exhibits are present", () => {
    const r = checkVisualArtifactContract("solution_approach_options", {
      visuals: ["approach arc / increments"],
      tables: [
        "solution-options matrix",
        "tradeoff table",
        "recommendation scorecard",
      ],
    });
    expect(r.pass).toBe(true);
  });
});

function richContext(): SolutionContext {
  let ctx = emptySolutionContext("m1", "skyharbor");
  ctx = applyPhaseDigest(ctx, {
    useCase: "unify clinical + claims to drive VBC",
    kpis: [
      {
        name: "30-day readmissions",
        baseline: "15.8%",
        target: "13%",
        domain: "clinical",
      },
    ],
    currentState: "Epic Clarity/Caboodle on SQL Server, Tableau",
    gaps: ["no unified member spine", "no ML path"],
    chosenOption: "Option C — Databricks Lakehouse",
  });
  return ctx;
}

describe("solution-prompt-factory — simple prompt, rich context", () => {
  it("binds the real SolutionContext into the prompt (no DATA GAP stubs)", () => {
    const p = buildArtifactPrompt({
      artifact: "target_state_architecture",
      phase: 3,
      context: richContext(),
    });
    expect(p.outputFormat).toBe("html");
    expect(p.user).toContain("unify clinical + claims");
    expect(p.user).toContain("Epic Clarity/Caboodle on SQL Server");
    expect(p.user).toContain("30-day readmissions");
    expect(p.user).toContain(VISUAL_ARTIFACT_STANDARD.slice(0, 30));
    expect(p.system).toMatch(/visual-first/i);
  });

  it("architecture prompt uses the approved chosenOption", () => {
    const p = buildArtifactPrompt({
      artifact: "target_state_architecture",
      phase: 3,
      context: richContext(),
    });
    expect(p.user).toContain("Option C — Databricks Lakehouse");
    expect(p.user).toMatch(/Do NOT choose the solution approach here/);
  });

  it("architecture prompt STOPS when no option has been approved", () => {
    const ctx = emptySolutionContext("m1", "t");
    const p = buildArtifactPrompt({
      artifact: "target_state_architecture",
      phase: 3,
      context: ctx,
    });
    expect(p.user).toMatch(/STOP and request P3a approval/);
  });

  it("P3 draft prompt refuses to shape architecture without an approved option", () => {
    const ctx = applyPhaseDigest(emptySolutionContext("m1", "lakeshore"), {
      useCase: "AP exception redesign",
      currentState:
        "Average monthly invoice exceptions, 1872; Manual touch hours per month, 2345; Average resolution days, 7.4.",
      gaps: [
        "payment hold governance inconsistent",
        "duplicate-payment control risk",
      ],
      metricsThatMatter: [
        { label: "Monthly invoice exceptions", value: "1,872" },
        { label: "Manual touch hours per month", value: "2,345" },
        { label: "Average resolution days", value: "7.4" },
      ],
    });
    const p = buildArtifactPrompt({
      artifact: "target_state_architecture",
      phase: 3,
      context: ctx,
      generationMode: "draft",
      draftCaveat: "P2 approved only for P3 draft shaping.",
    });
    expect(p.user).toContain("P3 FUTURE-STATE BLUEPRINT DRAFT");
    expect(p.user).toContain(
      "P3 Draft — based on approved P2 diagnostic for design shaping",
    );
    expect(p.user).toContain("P2 is not final. P3 is not final");
    expect(p.user).toContain("No approved option is present");
    expect(p.user).toContain("Do not draft architecture");
    expect(p.user).toContain("1,872");
    expect(p.user).toContain("2,345");
    expect(p.user).toContain("7.4");
    expect(p.user).toContain("Human + AI Role Model table");
    expect(p.user).toContain("Implementation Work Package table");
    expect(p.user).toContain(
      "Client and delivery teams own detailed process redesign",
    );
  });

  it("P3 commercial lending Agent Assist prompt does not import unrelated AP/payment examples", () => {
    const ctx = applyPhaseDigest(emptySolutionContext("m1", "firstcapital"), {
      useCase:
        "Commercial Lending Agent Assist for banker, credit analyst, KYC, collateral, and servicing handoffs.",
      scope:
        "Loan onboarding, document intake, KYC/sanctions review, credit-policy support, LOS, CRM, document management, and core banking read paths.",
      currentState:
        "Commercial lending teams work across LOS, CRM, document management, KYC/sanctions, credit policy, collateral, and core banking handoffs.",
      gaps: [
        "No unified semantic layer",
        "Manual document completeness checks",
      ],
      metricsThatMatter: [
        { label: "Median onboarding cycle time", value: "18.6 days" },
        { label: "Manual touch hours per loan", value: "11.4 hours" },
      ],
    });
    const p = buildArtifactPrompt({
      artifact: "target_state_architecture",
      phase: 3,
      context: ctx,
      generationMode: "draft",
      draftCaveat: "P2 approved only for P3 draft shaping.",
    });

    expect(p.user).toContain(
      "Domain-specific evidence priorities for commercial lending Agent Assist",
    );
    expect(p.user).toContain("Conceptual Architecture");
    expect(p.user).toContain("Logical Architecture");
    expect(p.user).toContain("Physical Architecture");
    expect(p.user).toContain("current evidence → design implication");
    expect(p.user).toContain("loan onboarding cycle time");
    expect(p.user).not.toContain("1,872 monthly exceptions");
    expect(p.user).not.toContain("AP/payment");
    expect(p.user).not.toContain("payment holds");
    expect(p.user).not.toContain("ERP/AP");
    expect(p.user).not.toContain("vendor master");
  });

  it("strips internal proof prefixes from the client-facing move reference", () => {
    const ctx = applyPhaseDigest(emptySolutionContext("m1", "skyharbor"), {
      useCase: "QA-SYNTHETIC - Baggage Disruption Recovery",
      currentState:
        "Baggage recovery teams reconcile exceptions across station, customer-care, and vendor-escalation handoffs.",
      chosenOption: "Option B — governed baggage-recovery intelligence layer",
    });
    const p = buildArtifactPrompt({
      artifact: "target_state_architecture",
      phase: 3,
      context: ctx,
      generationMode: "draft",
    });

    expect(p.user).toContain(
      "Client-facing move reference: Baggage Disruption Recovery",
    );
    expect(p.user).toContain(
      "This artifact is for Baggage Disruption Recovery.",
    );
    expect(p.user).not.toContain("Client-facing move reference: QA-SYNTHETIC");
  });

  it.each([
    [
      "solution_design",
      "SOLUTION DESIGN SPECIFICATION",
      "Experience Flow",
      "Target 3,200-4,800 body words",
    ],
    [
      "operating_model_design",
      "OPERATING MODEL DESIGN",
      "Decision Rights Matrix",
      "Stop before 4,600 rendered words",
    ],
    [
      "sourcing_strategy",
      "SOURCING STRATEGY BRIEF",
      "Options Matrix",
      "Stop before 3,600 rendered words",
    ],
  ] as const)(
    "uses an artifact-specific P3 brief for %s",
    (artifact, assignment, requiredExhibit, lengthRule) => {
      const ctx = applyPhaseDigest(emptySolutionContext("m1", "firstcapital"), {
        useCase: "Commercial Lending Agent Assist",
        currentState:
          "Loan onboarding work crosses LOS, CRM, KYC, and document systems.",
      });
      const p = buildArtifactPrompt({
        artifact,
        phase: 3,
        context: ctx,
        generationMode: "draft",
      });

      expect(p.user).toContain(assignment);
      expect(p.user).toContain(requiredExhibit);
      expect(p.user).toContain(lengthRule);
      expect(p.user).not.toContain("P3 FUTURE-STATE BLUEPRINT DRAFT");
      expect(p.user).toContain(
        "Every client-facing sentence containing a number, date, dollar amount, or percentage",
      );
    },
  );

  it("marks missing required context as a blocking input, not invented", () => {
    const ctx = emptySolutionContext("m1", "t");
    const p = buildArtifactPrompt({
      artifact: "discovery_report",
      phase: 2,
      context: ctx,
    });
    expect(p.user).toMatch(/\[MISSING/);
    expect(p.user).toMatch(/Do not invent facts/);
  });

  it("P1 charter prompt carries the compact gate-record assignment and target depth", () => {
    const p = buildArtifactPrompt({
      artifact: "charter",
      phase: 1,
      context: richContext(),
    });
    expect(p.user).toContain("STRATEGIC MOVES PREMIUM ARTIFACT BRIEF");
    expect(p.user).toContain("PHASE-SPECIFIC ASSIGNMENT — P1 MOVE CHARTER");
    expect(p.user).toContain(
      "authorizes and bounds the Discovery phase for this Move",
    );
    expect(p.user).toContain("Document presentation standard");
    expect(p.user).toContain("Target 900-1,100 body words");
    expect(p.user).toContain("Hard maximum 1,300 body words");
    expect(p.user).toContain("Charter Decision box");
    expect(p.user).toContain("Discovery Preparation table");
    expect(p.user).toContain("Discovery Activities table");
    expect(p.user).toContain("Target depth: 900-1,100 words");
    expect(p.user).toContain("Discovery Preparation");
    expect(p.user).toContain("Discovery Guidebook");
    expect(p.user).toContain("Client Decision Required");
    expect(p.user).toContain("To Validate During Discovery");
    expect(p.user).toContain("Evidence Required for P2");
  });

  it("P1 package contract stays compact and does not ask for a board-pack charter", () => {
    const contract = getPhaseDeliverablePackageContract({
      artifact: "charter",
      phase: 1,
    });
    expect(contract.primaryEditableRecordLabel).toBe(
      "P1 Charter Brief / Decision Record",
    );
    expect(contract.outputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "docx_editable_phase_record",
          clientFacingLabel: "P1 Charter brief / decision record",
          required: true,
        }),
        expect.objectContaining({
          kind: "html_visual_review_companion",
          required: false,
        }),
      ]),
    );
    expect(contract.outputs.map((output) => output.kind)).not.toContain(
      "workshop_evidence_pack",
    );
    expect(contract.outputs.map((output) => output.kind)).not.toContain(
      "derived_visualization_inventory",
    );
    expect(contract.wordDocumentSections.join(" ")).not.toContain(
      "Storyline and narrative arc",
    );
    expect(contract.wordDocumentSections.join(" ")).toContain(
      "Directional value hypothesis and success criteria to validate in P2",
    );
  });

  it("P2 diagnostic prompt requires handoffs, evidence matrix, and process-vs-AI analysis", () => {
    const p = buildArtifactPrompt({
      artifact: "discovery_report",
      phase: 2,
      context: richContext(),
    });
    expect(p.user).toContain(
      "PHASE-SPECIFIC ASSIGNMENT — P2 CURRENT WORK DIAGNOSTIC",
    );
    expect(p.user).toContain("Current-State Handoff Map");
    expect(p.user).toContain("Evidence Coverage table");
    expect(p.user).toContain(
      "Process vs Data vs Policy vs Ownership vs AI Matrix",
    );
    expect(p.user).toContain(
      "Word-ready Current State Process Document structure",
    );
    expect(p.user).toContain("Workshop Agenda and Session Notes appendix");
    expect(p.user).toContain("leadership, teams, decision rights, locations");
  });

  it("P2 package contract makes Word the editable phase record and HTML the visual companion", () => {
    const contract = getPhaseDeliverablePackageContract({
      artifact: "discovery_report",
      phase: 2,
    });
    expect(contract.formalEditableRecordRequired).toBe(true);
    expect(contract.primaryEditableRecordLabel).toBe(
      "Current State Process and Diagnostic Word Document",
    );
    expect(contract.outputs.map((output) => output.kind)).toEqual(
      expect.arrayContaining([
        "docx_editable_phase_record",
        "html_visual_review_companion",
        "evidence_provenance_manifest",
        "workshop_evidence_pack",
        "derived_visualization_inventory",
      ]),
    );
    expect(contract.wordDocumentSections.join(" ")).toContain(
      "Current-state business process narrative before diagrams",
    );
    expect(contract.wordDocumentSections.join(" ")).toContain(
      "Storyline and narrative arc",
    );
    expect(contract.wordDocumentSections.join(" ")).toContain(
      "Change, adoption, culture, and readiness observations",
    );
    expect(contract.requiredWorkshopEvidence).toContain(
      "Business process discovery workshop agenda",
    );
    expect(contract.requiredWorkshopEvidence).toContain(
      "Client-confirmed process corrections",
    );
  });

  it("phase package prompt labels AbarVa-derived visuals separately from client evidence", () => {
    const prompt = renderPhaseDeliverablePackagePrompt({
      artifact: "discovery_report",
      phase: 2,
    });
    expect(prompt).toContain(
      "The HTML artifact is the visual review companion",
    );
    expect(prompt).toContain("executive summary, storyline, narrative arc");
    expect(prompt).toContain("Required workshop/session evidence");
    expect(prompt).toContain(
      "AbarVa-generated visualization derived from client-loaded evidence",
    );
    expect(prompt).toContain("client-loaded evidence");
    expect(prompt).toContain("operator proof");
  });

  it("P2 diagnostic prompt foregrounds metricsThatMatter and evidence taxonomy when available", () => {
    const ctx = applyPhaseDigest(richContext(), {
      metricsThatMatter: [
        {
          label: "Monthly invoice exceptions",
          value: "1,872",
          source: "LSH_AP_Exception_Category_Report_Q2_2026.csv",
        },
        {
          label: "Manual touch hours per month",
          value: "2,345",
          source: "LSH_AP_Value_Baseline_Worksheet.xlsx",
          caveat: "Finance validation required before funding approval",
        },
      ],
      evidenceTaxonomy: [
        {
          category: "Missing PO",
          volume: "420",
          riskLevel: "Medium",
          owner: "Accounts Payable",
        },
      ],
      clientActionableMissingInputs: [
        {
          needed: "AP/procurement systems landscape",
          whyItMatters: "Confirms systems of record.",
          owner: "Enterprise Architecture",
          howItWillBeUsed: "P3 target architecture",
          gateImpact: "Blocks final P3 architecture",
        },
      ],
    });
    const p = buildArtifactPrompt({
      artifact: "discovery_report",
      phase: 2,
      context: ctx,
    });
    expect(p.user).toContain(
      "Metrics that must be foregrounded when available",
    );
    expect(p.user).toContain("Client-facing move reference:");
    expect(p.user).toContain(
      "Internal move id, audit only, do NOT display in the client-facing artifact body",
    );
    expect(p.user).toContain("Monthly invoice exceptions: 1,872");
    expect(p.user).toContain("Manual touch hours per month: 2,345");
    expect(p.user).toContain(
      "Finance validation required before funding approval",
    );
    expect(p.user).toContain(
      "Missing PO | volume=420 | risk=Medium | owner=Accounts Payable",
    );
    expect(p.user).toContain("Needed: AP/procurement systems landscape");
    expect(p.user).toMatch(/If the evidence packet contains exact metrics/);
  });

  it("draft prompt uses the standard pre-gate caveat", () => {
    const p = buildArtifactPrompt({
      artifact: "charter",
      phase: 1,
      context: richContext(),
      generationMode: "draft",
    });
    expect(p.user).toContain(STRATEGIC_MOVES_DRAFT_CAVEAT);
  });

  it("uses artifact-specific model token budgets", () => {
    expect(modelTokenBudgetForArtifact("discovery_report")).toBeGreaterThan(
      modelTokenBudgetForArtifact("charter"),
    );
    expect(modelTokenBudgetForArtifact("charter")).toBeLessThanOrEqual(10000);
  });
});
