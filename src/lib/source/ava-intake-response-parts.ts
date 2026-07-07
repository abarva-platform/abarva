import type { AgentResponsePart } from "@/lib/agent/response-parts";

export interface AvaIntakeResponseField {
  id: string;
  label: string;
  prompt: string;
}

export interface BuildAvaIntakeResponsePartsInput {
  body: string;
  fields: AvaIntakeResponseField[];
  capturedIds: Set<string>;
  routeLabel?: string;
}

export function buildAvaIntakeResponseParts(
  input: BuildAvaIntakeResponsePartsInput,
): AgentResponsePart[] {
  const fieldsTotal = input.fields.length;
  const fieldsCaptured = input.fields.filter((field) =>
    input.capturedIds.has(field.id),
  ).length;
  const fieldsOpen = Math.max(0, fieldsTotal - fieldsCaptured);
  const routeLabel = input.routeLabel ?? "Approval route";
  const trimmedBody = input.body.trim();

  return [
    {
      type: "text",
      title: "aVa sourcing read",
      text:
        trimmedBody ||
        "aVa is shaping the sourcing brief and will keep the next action visible.",
    },
    {
      type: "metricStrip",
      title: "Intake readiness",
      metrics: [
        {
          label: "Facts captured",
          value: `${fieldsCaptured}/${fieldsTotal}`,
          tone: fieldsOpen === 0 ? "good" : "warning",
        },
        {
          label: "Still open",
          value: `${fieldsOpen}`,
          tone: fieldsOpen === 0 ? "good" : "warning",
        },
        {
          label: "Next surface",
          value: routeLabel,
          tone: "info",
        },
      ],
    },
    {
      type: "table",
      title: "Brief fields aVa is assembling",
      columns: ["Field", "Status", "What aVa needs"],
      rows: input.fields.map((field) => [
        field.label,
        input.capturedIds.has(field.id) ? "Captured" : "Needed",
        field.prompt,
      ]),
      caption:
        "Captured fields can still be edited by the human owner before the event opens.",
    },
    {
      type: "barChart",
      title: "Intake completion",
      unit: "count",
      bars: [
        {
          label: "Captured",
          value: fieldsCaptured,
          displayValue: `${fieldsCaptured}`,
          tone: "good",
        },
        {
          label: "Open",
          value: fieldsOpen,
          displayValue: `${fieldsOpen}`,
          tone: fieldsOpen === 0 ? "good" : "warning",
        },
      ],
      caption:
        "aVa keeps the sourcing process moving from intake to approval.",
    },
    {
      type: "nextAction",
      label: "Recommended next action",
      detail:
        fieldsOpen === 0
          ? "Review the captured brief, then open the approval route."
          : "Answer the remaining intake fields or edit the brief directly before opening approval.",
      confidence: fieldsOpen === 0 ? "high" : "medium",
    },
  ];
}
