"use client";

import type { ConsumptionEnvelope } from "@/lib/knowledge/providers/types";
import type { AvaAnswer } from "@/lib/knowledge/providers/read-models";
import { GatedSection } from "../state/GatedSection";
import { StateBadge } from "../state/StateBanner";

/**
 * Renders either the refusal shape (4 parts: Not answerable yet / What is
 * present / What is missing / What we will not do) or the full 6-part answer
 * contract (Answer / Why / Evidence and authority / Limits / What would
 * change this / Next best actions). The two are mutually exclusive by
 * `refusal` -- this component never blends them, and a refusal answer is
 * never styled to look like a confident grounded claim.
 */
export function AvaAnswerCard({
  envelope,
  onAskAnother,
}: {
  readonly envelope: ConsumptionEnvelope<AvaAnswer> | undefined;
  readonly onAskAnother: () => void;
}) {
  return (
    <GatedSection
      envelope={envelope}
      label="aVa answer"
      emptyTitle="aVa cannot answer yet"
      emptyBody="The knowledge packet this question would be answered from has not resolved."
    >
      {(answer) => (
        <div
          className={`rounded-md border p-3 ${
            answer.refusal
              ? "border-[rgba(163,45,45,0.24)] bg-[rgba(163,45,45,0.04)]"
              : "border-[rgba(10,10,11,0.12)] bg-white"
          }`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-[#2c2c2a]">
              &ldquo;{answer.questionText}&rdquo;
            </p>
            <StateBadge
              tone={answer.refusal ? "blocked" : "neutral"}
              label={
                answer.refusal
                  ? "Declined -- insufficient evidence"
                  : `Model reasoning -- ephemeral -- ${answer.avaMode}`
              }
            />
          </div>
          <dl className="space-y-2.5">
            {answer.blocks.map((block) => (
              <div key={block.key}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#888780]">
                  {block.key}
                </dt>
                {block.text ? (
                  <dd className="mt-0.5 text-sm text-[#2c2c2a]">
                    {block.text}
                  </dd>
                ) : null}
                {block.items ? (
                  <dd className="mt-0.5 list-disc pl-4 text-sm text-[#2c2c2a]">
                    <ul className="list-disc space-y-0.5">
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </dd>
                ) : null}
              </div>
            ))}
          </dl>
          <button
            type="button"
            onClick={onAskAnother}
            className="mt-3 text-sm font-medium text-[#0066CC] hover:underline"
          >
            Ask another question
          </button>
        </div>
      )}
    </GatedSection>
  );
}
