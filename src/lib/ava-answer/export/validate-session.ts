import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";
import { isIntactModelAuthoredPacket } from "@/lib/intelligence/answer/model-authored-answer";
import type {
  AvaChatSessionExport,
  AvaChatSessionExportTurn,
} from "./session-types";

function isTurn(value: unknown): value is AvaChatSessionExportTurn {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    (record.role === "user" || record.role === "agent") &&
    typeof record.body === "string"
  );
}

export function validateSession(raw: AvaChatSessionExport): {
  session?: AvaChatSessionExport;
  error?: Response;
} {
  if (!raw || typeof raw !== "object") {
    return {
      error: Response.json(
        { error: "invalid_session", detail: "Session must be an object." },
        { status: 400 },
      ),
    };
  }
  if (typeof raw.surface !== "string" || !raw.surface.trim()) {
    return {
      error: Response.json(
        { error: "invalid_session", detail: "Session surface is required." },
        { status: 400 },
      ),
    };
  }
  if (!Array.isArray(raw.turns) || raw.turns.length === 0) {
    return {
      error: Response.json(
        {
          error: "empty_session",
          detail: "Session must include at least one turn.",
        },
        { status: 400 },
      ),
    };
  }
  if (raw.turns.length > 80) {
    return {
      error: Response.json(
        {
          error: "session_too_large",
          detail: "Session export is limited to 80 turns.",
        },
        { status: 413 },
      ),
    };
  }
  if (JSON.stringify(raw).length > 2_000_000) {
    return {
      error: Response.json(
        {
          error: "session_too_large",
          detail:
            "Session exceeds the export size limit; no content was truncated.",
        },
        { status: 413 },
      ),
    };
  }

  const turns: AvaChatSessionExportTurn[] = [];
  for (const [index, turn] of raw.turns.entries()) {
    if (!isTurn(turn)) {
      return {
        error: Response.json(
          {
            error: "invalid_session_turn",
            detail: `Turn ${index + 1} is invalid.`,
          },
          { status: 400 },
        ),
      };
    }
    if (turn.body.length > 100_000) {
      return {
        error: Response.json(
          {
            error: "session_turn_too_large",
            detail:
              "An answer exceeds the export size limit; no content was truncated.",
          },
          { status: 413 },
        ),
      };
    }
    if (
      turn.answer?.modelAuthored &&
      (!isIntactModelAuthoredPacket(turn.answer) ||
        turn.role !== "agent" ||
        turn.body !== (turn.answer.prose ?? turn.answer.directAnswer))
    ) {
      return {
        error: Response.json(
          {
            error: "invalid_model_answer",
            detail: "The model response and its decoded exhibits must match.",
          },
          { status: 400 },
        ),
      };
    }
    const answer =
      turn.answer && !turn.answer.modelAuthored
        ? validateAvaAnswerPacket(turn.answer)
        : null;
    turns.push({
      id: turn.id,
      role: turn.role,
      body: turn.body,
      at: typeof turn.at === "string" ? turn.at : undefined,
      answer: turn.answer?.modelAuthored
        ? turn.answer
        : answer?.passed
          ? answer.packet
          : null,
      reviewStatus: ["complete", "failed", "cancelled"].includes(
        turn.reviewStatus ?? "",
      )
        ? turn.reviewStatus
        : undefined,
    });
  }

  return {
    session: {
      title:
        typeof raw.title === "string" ? raw.title.slice(0, 180) : undefined,
      surface: raw.surface,
      tenantKey:
        typeof raw.tenantKey === "string"
          ? raw.tenantKey.slice(0, 120)
          : undefined,
      turns,
      qualityReview:
        raw.qualityReview && raw.surface === "intelligence"
          ? {
              suiteId: String(raw.qualityReview.suiteId),
              startedAt: String(raw.qualityReview.startedAt),
              finishedAt: raw.qualityReview.finishedAt
                ? String(raw.qualityReview.finishedAt)
                : undefined,
              plannedQuestions: 10,
              includeOriginalResponses:
                raw.qualityReview.includeOriginalResponses === true,
              completedQuestions: turns.filter(
                (t) =>
                  t.role === "agent" &&
                  t.reviewStatus === "complete" &&
                  t.answer?.modelAuthored,
              ).length,
            }
          : undefined,
    },
  };
}
