import type { SourceStageKey } from "@/lib/source/types";

export type SourceCommunicationDraftType =
  | "qa_follow_up"
  | "bafo_request"
  | "award_notice"
  | "vendor_follow_up";

export interface SourceCommunicationDraftInput {
  draftType: SourceCommunicationDraftType;
  clientName: string;
  eventName: string;
  eventSlug: string;
  currentStage: SourceStageKey;
  decisionOwner: string | null;
  valueAtStakeUsd: number | null;
  scopeDescription: string | null;
  recipientName: string | null;
  note: string | null;
}

export interface SourceCommunicationDraft {
  draftType: SourceCommunicationDraftType;
  subject: string;
  body: string;
  disclaimer: string;
}

const DRAFT_LABELS: Record<SourceCommunicationDraftType, string> = {
  qa_follow_up: "Q&A follow-up",
  bafo_request: "BAFO request",
  award_notice: "Award notice",
  vendor_follow_up: "Vendor follow-up",
};

export function labelForCommunicationDraft(
  draftType: SourceCommunicationDraftType,
): string {
  return DRAFT_LABELS[draftType];
}

export function isSourceCommunicationDraftType(
  value: unknown,
): value is SourceCommunicationDraftType {
  return (
    value === "qa_follow_up" ||
    value === "bafo_request" ||
    value === "award_notice" ||
    value === "vendor_follow_up"
  );
}

export function buildSourceCommunicationDraft(
  input: SourceCommunicationDraftInput,
): SourceCommunicationDraft {
  const recipient = input.recipientName?.trim() || "team";
  const owner = input.decisionOwner?.trim() || "the sourcing sponsor";
  const value = formatUsd(input.valueAtStakeUsd);
  const scope =
    input.scopeDescription?.trim() ||
    "the scope documented in the active Source event";
  const note = input.note?.trim();
  const eventLine = `${input.clientName} · ${input.eventName}`;
  const contextLines = [
    `Context: ${eventLine}.`,
    `Current stage: ${labelize(input.currentStage)}.`,
    `Decision owner: ${owner}.`,
    value ? `Value at stake: ${value}.` : null,
    `Scope anchor: ${scope}`,
    note ? `Maestro note: ${note}` : null,
  ].filter(Boolean);

  if (input.draftType === "bafo_request") {
    return {
      draftType: input.draftType,
      subject: `${input.clientName} ${input.eventName}: best-and-final request`,
      body: [
        `Hello ${recipient},`,
        "",
        `Thank you for your response to ${input.eventName}. ${input.clientName} is entering a controlled best-and-final step before final recommendation.`,
        "",
        "Please provide your updated response using the same pricing, scope, transition, and assumption structure already requested so the comparison remains fair across all finalist vendors.",
        "",
        "Please address:",
        "- Commercial improvements and any revised total contract value",
        "- Confirmed scope inclusions and exclusions",
        "- Transition timeline, staffing, and risk mitigations",
        "- SLA, governance, security, and reporting commitments",
        "- Any assumptions that materially change your proposal",
        "",
        ...contextLines,
        "",
        "AbarVa draft status: review before sending. The client sourcing team must approve wording, recipients, deadlines, and attachments before any external use.",
      ].join("\n"),
      disclaimer: reviewDisclaimer(),
    };
  }

  if (input.draftType === "award_notice") {
    return {
      draftType: input.draftType,
      subject: `${input.clientName} ${input.eventName}: award communication draft`,
      body: [
        `Hello ${recipient},`,
        "",
        `${input.clientName} has completed the current sourcing evaluation for ${input.eventName}. This message is a draft award communication for review by procurement, legal, finance, and the decision owner before release.`,
        "",
        "Before this is sent externally, confirm:",
        "- Final approval record and named approver",
        "- Commercial terms, transition dates, and any conditions precedent",
        "- Required legal or procurement language",
        "- Whether this is an award, intent-to-award, or non-award communication",
        "",
        ...contextLines,
        "",
        "AbarVa draft status: review before sending. No vendor should rely on this draft until the client approves final wording through its procurement process.",
      ].join("\n"),
      disclaimer: reviewDisclaimer(),
    };
  }

  if (input.draftType === "qa_follow_up") {
    return {
      draftType: input.draftType,
      subject: `${input.clientName} ${input.eventName}: Q&A follow-up`,
      body: [
        `Hello ${recipient},`,
        "",
        `We are preparing the next Q&A update for ${input.eventName}. Please review the questions and proposed answers against the event scope and confirm which items can be released to vendors.`,
        "",
        "For each answer, please confirm:",
        "- It is factually accurate for the current scope",
        "- It does not disclose confidential internal data",
        "- It applies consistently to all vendors unless explicitly marked vendor-specific",
        "- It has the right owner approval before release",
        "",
        ...contextLines,
        "",
        "AbarVa draft status: review before sending. The client owns the final answers and release decision.",
      ].join("\n"),
      disclaimer: reviewDisclaimer(),
    };
  }

  return {
    draftType: input.draftType,
    subject: `${input.clientName} ${input.eventName}: follow-up`,
    body: [
      `Hello ${recipient},`,
      "",
      `Following up on ${input.eventName}. Please review the current request and respond with the missing information, clarifications, or approvals needed to keep the sourcing event moving.`,
      "",
      ...contextLines,
      "",
      "AbarVa draft status: review before sending. This is an internal working draft and is not sent by AbarVa.",
    ].join("\n"),
    disclaimer: reviewDisclaimer(),
  };
}

function reviewDisclaimer(): string {
  return "Internal draft only. Review, approve, and send through the client's procurement or communication system.";
}

function labelize(value: string): string {
  return value.replaceAll("_", " ");
}

function formatUsd(value: number | null): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
