"use client";

import type { AvaAnswer } from "@/lib/knowledge/consumption-contracts";
import { StateBadge } from "../state/StateBanner";

/**
 * Renders the real AvaAnswer contract: a refused answer (outcome ===
 * "refused") shows its refusalReason/limitations/whatWouldChangeIt; an
 * answered/partial answer shows its structured sections, evidence refs, and
 * the same limitations/whatWouldChangeIt fields every answer must carry. The
 * two are visually distinct -- a refusal is never styled to look like a
 * confident grounded claim -- but both come from the ONE real AvaAnswer
 * shape now, not the duplicate provider's separate refusal/blocks structure.
 */
export function AvaAnswerCard({
  question,
  answer,
  onAskAnother,
}: {
  readonly question: string;
  readonly answer: AvaAnswer;
  readonly onAskAnother: () => void;
}) {
  const refused = answer.outcome === "refused";

  return (
    <div
      className={`rounded-md border p-3 ${
        refused
          ? "border-[rgba(163,45,45,0.24)] bg-[rgba(163,45,45,0.04)]"
          : "border-[rgba(10,10,11,0.12)] bg-white"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#2c2c2a]">
          &ldquo;{question}&rdquo;
        </p>
        <StateBadge
          tone={
            refused
              ? "blocked"
              : answer.outcome === "partial"
                ? "candidate"
                : "neutral"
          }
          label={
            refused
              ? "Declined -- insufficient evidence"
              : `${answer.outcome === "partial" ? "Partial" : "Answered"} -- ephemeral, not accepted`
          }
        />
      </div>

      {refused ? (
        <p className="text-sm text-[#2c2c2a]">{answer.refusalReason}</p>
      ) : (
        <dl className="space-y-2.5">
          {answer.sections.map((section) => (
            <div key={section.heading}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#888780]">
                {section.heading}
              </dt>
              <dd className="mt-0.5 text-sm text-[#2c2c2a]">{section.body}</dd>
            </div>
          ))}
        </dl>
      )}

      {answer.limitations.length > 0 ? (
        <div className="mt-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#888780]">
            Limits
          </p>
          <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-sm text-[#2c2c2a]">
            {answer.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {answer.whatWouldChangeIt.length > 0 ? (
        <div className="mt-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#888780]">
            What would change this
          </p>
          <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-sm text-[#2c2c2a]">
            {answer.whatWouldChangeIt.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onAskAnother}
        className="mt-3 text-sm font-medium text-[#0066CC] hover:underline"
      >
        Ask another question
      </button>
    </div>
  );
}
