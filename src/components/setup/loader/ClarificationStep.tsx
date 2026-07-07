"use client";

import { COLORS, RADIUS, TYPOGRAPHY } from "@/lib/design/design-tokens";
import type { ClarificationQuestion } from "@/lib/context-ingestion/loader/contract";

/**
 * ClarificationStep — batched, plain-language clarifications.
 *
 * Per the contract these are mapping/interpretation questions only
 * (never "supply data"). Each question's best guess is pre-selected
 * (options[bestGuessIndex]); the operator confirms or corrects with one
 * tap. Pure presentational: it renders `ClarificationQuestion[]`,
 * tracks the selected option locally via controlled `answers`, and
 * emits answer / confirm events.
 *
 * Locked design system: cream surface, serif display, hairline borders,
 * black + ghost buttons. The pre-selected best guess is visually the
 * resting state, so the calm path is one confirm.
 */

export interface ClarificationStepProps {
  questions: ClarificationQuestion[];
  /**
   * Current selection per question, keyed by `fileObjectKey::question`.
   * Defaults (best guess) are applied for any key not present.
   */
  answers?: Record<string, number>;
  /** An option was chosen for a question. */
  onAnswer?: (questionKey: string, optionIndex: number) => void;
  /** Operator confirmed all answers (the calm one-tap path). */
  onConfirmAll?: () => void;
  /** Disable interaction. */
  disabled?: boolean;
  className?: string;
}

export function clarificationKey(question: ClarificationQuestion): string {
  return `${question.fileObjectKey}::${question.question}`;
}

export function ClarificationStep({
  questions,
  answers = {},
  onAnswer,
  onConfirmAll,
  disabled = false,
  className,
}: ClarificationStepProps) {
  if (questions.length === 0) {
    return (
      <div
        className={className}
        style={{
          border: `1px solid ${COLORS.ink}1A`,
          borderRadius: RADIUS.lg,
          background: COLORS.cream,
          padding: "28px 24px",
          textAlign: "center",
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: `${COLORS.ink}99`,
        }}
      >
        No clarifications needed — I had enough to map everything.
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        border: `1px solid ${COLORS.ink}1A`,
        borderRadius: RADIUS.lg,
        background: COLORS.cream,
        padding: "24px",
        fontFamily: TYPOGRAPHY.sans,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 22,
          color: COLORS.ink,
          marginBottom: 4,
        }}
      >
        A few quick checks
      </div>
      <div style={{ fontSize: 13, color: `${COLORS.ink}99`, marginBottom: 20 }}>
        I picked my best guess for each. Confirm, or change any that look off.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {questions.map((question) => {
          const key = clarificationKey(question);
          const selected = answers[key] ?? question.bestGuessIndex;
          return (
            <fieldset
              key={key}
              style={{
                border: `1px solid ${COLORS.ink}14`,
                borderRadius: RADIUS.md,
                background: COLORS.white,
                padding: "14px 16px",
                margin: 0,
              }}
            >
              <legend
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: COLORS.ink,
                  padding: "0 4px",
                }}
              >
                {question.question}
                {question.field ? (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      fontWeight: 400,
                      color: `${COLORS.ink}80`,
                      fontFamily: TYPOGRAPHY.mono,
                    }}
                  >
                    {question.field}
                  </span>
                ) : null}
              </legend>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {question.options.map((option, idx) => {
                  const isSelected = idx === selected;
                  const isBestGuess = idx === question.bestGuessIndex;
                  return (
                    <label
                      key={`${key}-${idx}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        borderRadius: RADIUS.sm,
                        border: `1px solid ${
                          isSelected ? COLORS.navy : `${COLORS.ink}1A`
                        }`,
                        background: isSelected ? COLORS.skyPale : COLORS.white,
                        cursor: disabled ? "not-allowed" : "pointer",
                        fontSize: 13,
                        color: COLORS.ink,
                      }}
                    >
                      <input
                        type="radio"
                        name={key}
                        value={idx}
                        checked={isSelected}
                        disabled={disabled}
                        onChange={() => onAnswer?.(key, idx)}
                        style={{ accentColor: COLORS.navy }}
                      />
                      <span>{option}</span>
                      {isBestGuess ? (
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: 11,
                            color: `${COLORS.ink}80`,
                            fontStyle: "italic",
                          }}
                        >
                          best guess
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          type="button"
          disabled={disabled || !onConfirmAll}
          onClick={onConfirmAll}
          style={{
            padding: "10px 20px",
            borderRadius: RADIUS.md,
            border: "none",
            background: COLORS.ink,
            color: COLORS.white,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            fontWeight: 500,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          Confirm and continue
        </button>
      </div>
    </div>
  );
}

export default ClarificationStep;
