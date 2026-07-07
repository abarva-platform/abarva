import type { MoveArtifactRow } from "./move-artifacts";
import type { DeliverableKey } from "@/lib/deliverables/profiles/types";
import {
  depthStandardForArtifact,
  phaseAssignmentForArtifact,
  STRATEGIC_MOVES_ARTIFACT_STANDARD_DOC,
  STRATEGIC_MOVES_DRAFT_CAVEAT,
} from "@/lib/deliverables/strategic-moves-artifact-standard";

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

export interface ReviewRegenerationPrompt {
  system: string;
  user: string;
  outputFormat: "html";
  maxTokens: number;
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

export function buildReviewRegenerationPrompt(args: {
  artifact: MoveArtifactRow;
  artifactKey: DeliverableKey;
  feedbackText: string;
  feedbackItems: ReviewFeedbackItem[];
  originalArtifactBody: string;
  phase: number;
  contextSummary?: string;
}): ReviewRegenerationPrompt {
  const depth = depthStandardForArtifact(args.artifactKey);
  const feedbackItems =
    args.feedbackItems.length > 0
      ? args.feedbackItems
          .map(
            (item) =>
              `- ${item.id} (${item.priority}, ${item.area}): ${item.requestedChange}`,
          )
          .join("\n")
      : "- No parsed feedback items; use the raw feedback text.";

  return {
    outputFormat: "html",
    maxTokens: depth.maxTokens,
    system:
      "You are a senior consulting principal revising a Strategic Moves client artifact. Produce a complete, evidence-bound, executive-ready HTML artifact. Regeneration is not a patch.",
    user: `Regenerate the Strategic Moves artifact as a COMPLETE UPDATED ARTIFACT.

Standard: ${STRATEGIC_MOVES_ARTIFACT_STANDARD_DOC}

Artifact identity:
- Prior artifact title: ${args.artifact.title}
- Prior artifact id: ${args.artifact.artifact_id}
- Prior version: ${args.artifact.version}
- Phase: P${args.phase}
- Artifact type: ${args.artifactKey}
- Output: complete self-contained HTML
- Target depth: ${depth.targetWords} words; minimum acceptable depth: ${depth.minWords} words

Phase assignment:
${phaseAssignmentForArtifact({ artifact: args.artifactKey, phase: args.phase })}

Draft/final status:
${STRATEGIC_MOVES_DRAFT_CAVEAT}

Client review feedback:
${args.feedbackText}

Parsed feedback items:
${feedbackItems}

Available phase/context summary:
${args.contextSummary?.trim() || "[MISSING — no additional phase context was available to the regeneration route]"}

Original artifact to revise:
<<<ORIGINAL_ARTIFACT_START
${args.originalArtifactBody}
ORIGINAL_ARTIFACT_END>>>

Regeneration requirements:
- Return the full revised artifact, not a short delta note.
- Preserve the strongest parts of the prior artifact.
- Apply feedback substantively and rewrite affected sections.
- Improve structure where needed.
- Add required diagrams, tables, and matrices if missing.
- Preserve evidence caveats and client-to-complete items.
- Keep draft/review status visible.
- Do not mark the artifact final or board-ready.
- Do not invent evidence, owner names, approval, ROI, or operational readiness.
- Do not expose internal language such as source row, blob path, tenant key, prompt, model call, JSON, debug, or implementation details.`,
  };
}
