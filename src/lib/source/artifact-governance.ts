export const SOURCE_AI_DRAFT_GOVERNANCE_LABEL = "AI-prepared draft";

export const SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE =
  "AI-prepared draft. Human review is required before external use.";

export const SOURCE_AI_DRAFT_GOVERNANCE_DETAIL =
  "AbarVa prepared this working draft from current Source evidence and approved inputs. A human must review, edit, and accept the client-final version before it becomes the authoritative deliverable of record.";

export const SOURCE_HUMAN_REVIEW_GOVERNANCE_MESSAGE =
  "Working draft. Human review is required before external use.";

export const SOURCE_CLIENT_FINAL_GOVERNANCE_MESSAGE =
  "AbarVa generated the working draft. The client reviewed, edited, and uploaded the approved final. The uploaded client-final artifact is now the authoritative deliverable of record.";

export function sourceDraftGovernanceMessage(args: {
  isAiGenerated: boolean;
}): string {
  return args.isAiGenerated
    ? SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE
    : SOURCE_HUMAN_REVIEW_GOVERNANCE_MESSAGE;
}

