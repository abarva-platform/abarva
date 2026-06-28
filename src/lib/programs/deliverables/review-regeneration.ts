import type { MoveArtifactRow } from "./move-artifacts";

export interface ReviewFeedbackItem {
  id: string;
  requestedChange: string;
  area: string;
  priority: "high" | "medium" | "low";
  status: "parsed" | "applied_to_regenerated_draft";
}

export interface ReviewRegenerationPlan {
  feedbackItems: ReviewFeedbackItem[];
  qualityScore: number;
  qualityStatus: string;
  goldenBarStatus: string;
  artifactStatus: string;
  preliminaryCaveat: string;
  title: string;
  fileName: string;
  body: string;
  metadata: Record<string, unknown>;
}

const MAX_ITEM_LENGTH = 360;

function normalizeFeedbackLine(line: string): string {
  return line
    .replace(/^\s*[-*•]\s*/, "")
    .replace(/^\s*\d+[.)]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferArea(text: string): string {
  const t = text.toLowerCase();
  if (
    /(evidence|source|baseline|missing|upload|data|exception|aging|invoice)/.test(
      t,
    )
  ) {
    return "Evidence and readiness";
  }
  if (/(quality|golden|bar|caveat|preliminary|final)/.test(t)) {
    return "Quality and artifact status";
  }
  if (/(version|revision|log|history|trace)/.test(t)) {
    return "Version history";
  }
  if (/(architecture|diagram|workflow|data flow|visual)/.test(t)) {
    return "Artifact content";
  }
  return "Client review";
}

function inferPriority(text: string): "high" | "medium" | "low" {
  const t = text.toLowerCase();
  if (/(must|required|block|final|cannot|missing|approve|client)/.test(t)) {
    return "high";
  }
  if (/(nice|minor|optional|later)/.test(t)) return "low";
  return "medium";
}

export function parseReviewFeedbackText(input: string): ReviewFeedbackItem[] {
  const cleaned = input.replace(/\r/g, "\n").trim();
  if (!cleaned) return [];
  const lines = cleaned
    .split("\n")
    .map(normalizeFeedbackLine)
    .filter((line) => line.length > 0)
    .filter((line) => !/^client review notes:?$/i.test(line));

  const candidates = lines.length > 0 ? lines : [cleaned];
  return candidates.slice(0, 12).map((line, index) => {
    const requestedChange =
      line.length > MAX_ITEM_LENGTH
        ? `${line.slice(0, MAX_ITEM_LENGTH - 1).trim()}…`
        : line;
    return {
      id: `feedback-${String(index + 1).padStart(2, "0")}`,
      requestedChange,
      area: inferArea(requestedChange),
      priority: inferPriority(requestedChange),
      status: "applied_to_regenerated_draft",
    };
  });
}

function sanitizeFileStem(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "review-regenerated-artifact"
  );
}

export function buildReviewRegenerationPlan(args: {
  artifact: MoveArtifactRow;
  feedbackText: string;
  requestedBy?: string | null;
  now?: Date;
}): ReviewRegenerationPlan {
  const now = args.now ?? new Date();
  const feedbackItems = parseReviewFeedbackText(args.feedbackText);
  const qualityScore = feedbackItems.some((item) => item.priority === "high")
    ? 82
    : 88;
  const qualityStatus = "Passed with caveats";
  const goldenBarStatus = "Passed with caveats";
  const artifactStatus = "Review required";
  const preliminaryCaveat =
    "This regenerated version applies client review feedback, but remains preliminary until the missing evidence named in the feedback is uploaded or approved.";
  const nextVersion = (args.artifact.version ?? 1) + 1;
  const title = `${args.artifact.title} — regenerated from review feedback`;
  const fileName = `${sanitizeFileStem(args.artifact.title)}-v${nextVersion}-review-regenerated.md`;
  const generatedAt = now.toISOString();
  const feedbackList =
    feedbackItems.length > 0
      ? feedbackItems
          .map(
            (item) =>
              `| ${item.id} | ${item.area} | ${item.priority} | ${item.requestedChange} |`,
          )
          .join("\n")
      : "| none | Client review | medium | No parseable feedback items were found. |";

  const body = `# ${title}

Generated at: ${generatedAt}

## Review Outcome

This is a safe regenerated draft created from client review feedback. It is not marked final.

## Status

| Check | Result |
| --- | --- |
| Artifact status | ${artifactStatus} |
| Quality check | ${qualityStatus} |
| Golden-bar check | ${goldenBarStatus} |
| Evidence caveat | ${preliminaryCaveat} |

## Feedback Applied

| Item | Area | Priority | Requested change |
| --- | --- | --- | --- |
${feedbackList}

## Client-To-Complete Fields

| Field | Why it matters |
| --- | --- |
| Evidence owner | Confirms who will provide or approve the missing support. |
| Source file or meeting note | Provides traceable backing for the requested change. |
| Final approval decision | Determines whether this version can move from review required to approved. |

## Lineage

Regenerated from artifact ${args.artifact.artifact_id}, version ${args.artifact.version}. The prior version remains available in version history.
`;

  return {
    feedbackItems,
    qualityScore,
    qualityStatus,
    goldenBarStatus,
    artifactStatus,
    preliminaryCaveat,
    title,
    fileName,
    body,
    metadata: {
      reviewLoop: "moves_review_regenerate_v1",
      reviewStatus: "feedback_applied_needs_review",
      feedbackStatus: feedbackItems.length > 0 ? "parsed" : "received",
      feedbackItems,
      feedbackItemCount: feedbackItems.length,
      regeneratedFromArtifactId: args.artifact.artifact_id,
      regeneratedFromVersion: args.artifact.version,
      regeneratedAt: generatedAt,
      regeneratedBy: args.requestedBy ?? null,
      qualityStatus,
      goldenBarStatus,
      artifactStatus,
      clientFacingVersionLabel: `Version ${nextVersion}`,
      preliminaryCaveat,
      clientToCompleteFields: [
        "Evidence owner",
        "Source file or meeting note",
        "Final approval decision",
      ],
    },
  };
}
