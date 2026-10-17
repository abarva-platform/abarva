import type { RenderableDeliverable } from "../types";
import type { PurposeChart } from "../purpose-page-plan";

/** Minimal synthetic renderer inputs, unrelated to any tenant or engagement. */
export function purposeFixture(): RenderableDeliverable {
  const intent = (question: string) => ({
    question,
    scopeNote:
      "Synthetic layout fixture. Findings and proposed decisions require human review.",
  });
  return {
    title: "Discovery identifies the evidence needed for design",
    deliverableType: "discovery_report",
    purposePageDesign: true,
    clientDisplayName: "Synthetic organization",
    initiativeDisplayName: "Service experience review",
    generatedSections: [],
    assumptions: [],
    clientCompleteChecklist: [],
    recommendation:
      "Confirm the measurement definitions before selecting a design.",
    nextActions: [
      "The service owner should reconcile the baseline definitions.",
    ],
    sourceRegister: [
      {
        citationNumber: 1,
        label: "Synthetic workflow and roles",
        evidenceFamily: "workflow",
        confidence: "medium",
        asOf: "2026-01",
      },
      {
        citationNumber: 2,
        label: "Synthetic operational observations",
        evidenceFamily: "baseline",
        confidence: "medium",
        asOf: "2026-01",
      },
    ],
    deckSlides: [
      {
        key: "decision",
        governingMessage: "The sponsor can authorize a bounded design study",
        pageIntent: {
          ...intent("What should be authorized?"),
          tableKey: "decision",
        },
        citationsUsed: [1],
      },
      {
        key: "workflow",
        governingMessage: "The current service journey includes a human review",
        exhibitKey: "workflow",
        pageIntent: intent("Where does work pass between people?"),
        citationsUsed: [1],
      },
      {
        key: "roles",
        governingMessage:
          "Service and data owners have different closure responsibilities",
        pageIntent: { ...intent("Who closes each gap?"), tableKey: "roles" },
        citationsUsed: [1],
      },
      {
        key: "options",
        governingMessage: "The evidence supports comparing two approaches",
        pageIntent: {
          ...intent("Which options deserve design work?"),
          tableKey: "options",
        },
        citationsUsed: [1],
      },
      {
        key: "layers",
        governingMessage: "The design needs a reviewed information foundation",
        exhibitKey: "layers",
        pageIntent: intent("What information supports the service?"),
        citationsUsed: [1],
      },
      {
        key: "gaps",
        governingMessage:
          "Different measurement definitions prevent a common baseline",
        points: [
          "The two observations use different inclusion rules. They cannot establish an improvement or a saving until the owner reconciles them.",
        ],
        pageIntent: intent("What prevents a defensible business case?"),
        citationsUsed: [2],
      },
    ],
    tables: [
      {
        key: "decision",
        title: "Proposed decision",
        pageShape: "decision",
        columns: ["Scope", "Decision"],
        rows: [
          ["Authorize now", "Compare the service designs."],
          [
            "Reserve for later",
            "Build funding and production access need separate approval.",
          ],
        ],
        targetFormat: "pptx",
      },
      {
        key: "roles",
        title: "Closure responsibilities",
        pageShape: "roles",
        columns: ["Role", "Responsibility"],
        rows: [
          ["Service owner", "Confirm the service boundary."],
          ["Data owner", "Reconcile the metric definition."],
        ],
        targetFormat: "pptx",
      },
      {
        key: "options",
        title: "Options to assess",
        pageShape: "comparison",
        columns: ["Option", "What changes"],
        rows: [
          [
            "Process redesign",
            "Clarify handoffs before introducing automation.",
          ],
          [
            "Agent support",
            "Assist the colleague while retaining human judgment.",
          ],
        ],
        targetFormat: "pptx",
      },
      {
        key: "closure",
        title: "Evidence closure precedes investment approval",
        columns: ["Gap", "Owner", "Next action"],
        rows: [
          [
            "Metric definition [2]",
            "Data owner",
            "Publish the common inclusion rule.",
          ],
          [
            "Service boundary [1]",
            "Service owner",
            "Confirm the pilot perimeter.",
          ],
        ],
        targetFormat: "pptx",
      },
    ],
    exhibits: [
      {
        key: "workflow",
        title: "Current handoffs",
        kind: "flow",
        description:
          "A synthetic declared sequence. The colleague retains the review step. No automation performance is established.",
        targetFormat: "pptx",
        data: {
          kind: "flow",
          nodes: [
            { id: "a", label: "Receive", role: "Service team" },
            { id: "b", label: "Investigate", role: "Service team" },
            { id: "c", label: "Review", role: "Supervisor" },
          ],
          edges: [
            { from: "a", to: "b" },
            { from: "b", to: "c" },
          ],
        },
      },
      {
        key: "layers",
        title: "Information foundation",
        kind: "logical_architecture",
        description:
          "A synthetic logical grouping. It does not establish integration or access approval.",
        targetFormat: "pptx",
        data: {
          kind: "logical_architecture",
          lanes: [
            {
              label: "Sources",
              items: ["Reviewed service guidance", "Operational observations"],
            },
            {
              label: "Context",
              items: ["Source references", "Definitions and known gaps"],
            },
            {
              label: "Service",
              items: ["Colleague review", "Documented decisions"],
            },
          ],
        },
      },
    ],
  };
}

export function purposeChartFixture(): PurposeChart {
  return {
    key: "observations",
    title: "Observed demand varies across the reporting periods",
    metric: "Synthetic observations",
    unit: "count",
    period: "Three fixture periods",
    sourceIds: [2],
    interpretation: "No intervention or causal effect is established.",
    points: [
      { label: "Period A", value: 12, sourceRow: "synthetic-test:row-1" },
      { label: "Period B", value: 18, sourceRow: "synthetic-test:row-2" },
      { label: "Period C", value: 15, sourceRow: "synthetic-test:row-3" },
    ],
  };
}
