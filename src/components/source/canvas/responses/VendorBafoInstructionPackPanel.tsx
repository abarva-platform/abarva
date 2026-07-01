"use client";

import type { CSSProperties } from "react";
import type { VendorBafoInstructionPack } from "@/lib/source/proposal-intelligence";
import { CANVAS } from "../canvas-tokens";

export function VendorBafoInstructionPackPanel({
  pack,
}: {
  pack?: VendorBafoInstructionPack | null;
}) {
  if (!pack || pack.vendorInstructions.length === 0) return null;
  const questions = pack.vendorInstructions.flatMap(
    (instruction) => instruction.questions,
  );
  if (questions.length === 0) return null;

  return (
    <section
      data-testid="source-vendor-bafo-instruction-pack"
      style={CARD}
      aria-label="BAFO Instruction Pack"
    >
      <div style={HEADER}>
        <div>
          <div style={EYEBROW}>BAFO instruction pack</div>
          <h3 style={TITLE}>Vendor-specific asks before scoring hardens</h3>
          <p style={COPY}>{pack.executiveSummary}</p>
        </div>
        <div style={COUNT_WRAP}>
          <Count label="Vendors" value={pack.vendorCount} />
          <Count label="BAFO asks" value={pack.questionCount} />
        </div>
      </div>

      <div style={RULE_BOX}>
        <div>
          <div style={EYEBROW}>Common response rules</div>
          <ul style={RULE_LIST}>
            {pack.commonResponseRequirements.slice(0, 5).map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
        <div>
          <div style={EYEBROW}>Completeness criteria</div>
          <ul style={RULE_LIST}>
            {pack.completenessCriteria.slice(0, 4).map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={VENDOR_GRID}>
        {pack.vendorInstructions.map((instruction) => (
          <article key={instruction.vendorId} style={VENDOR_CARD}>
            <div style={ROW_TOP}>
              <strong style={VENDOR_NAME}>{instruction.vendorName}</strong>
              <span style={{ ...PILL, ...priorityTone(instruction.priority) }}>
                {instruction.priority}
              </span>
            </div>
            <p style={MINI_COPY}>
              {instruction.instructionCount} BAFO ask
              {instruction.instructionCount === 1 ? "" : "s"} · evaluation
              status: {instruction.readyForEvaluation}
            </p>
            <div style={QUESTION_LIST}>
              {instruction.questions.slice(0, 4).map((question) => (
                <div key={question.questionId} style={QUESTION}>
                  <div style={QUESTION_HEAD}>
                    <span style={QUESTION_ID}>{question.questionId}</span>
                    <span style={QUESTION_PRIORITY}>
                      {question.priority.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p style={QUESTION_TEXT}>{question.question}</p>
                  <dl style={DETAILS}>
                    <Detail
                      label="Response format"
                      value={question.requiredResponseFormat}
                    />
                    <Detail label="Evidence" value={question.evidenceLabel} />
                    <Detail
                      label="Scoring holdback"
                      value={question.scoringDisposition}
                    />
                  </dl>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div style={COUNT}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={DETAIL}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function priorityTone(
  priority: VendorBafoInstructionPack["vendorInstructions"][number]["priority"],
): CSSProperties {
  if (priority === "high") return BAD;
  if (priority === "medium") return WARN;
  return GOOD;
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 14,
  display: "grid",
  gap: 14,
};

const HEADER: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 16,
  alignItems: "start",
};

const EYEBROW: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  fontWeight: 700,
};

const TITLE: CSSProperties = {
  margin: "4px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 23,
  lineHeight: 1.12,
  color: CANVAS.INK,
};

const COPY: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
  maxWidth: 860,
};

const MINI_COPY: CSSProperties = {
  margin: 0,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const COUNT_WRAP: CSSProperties = {
  display: "flex",
  gap: 8,
};

const COUNT: CSSProperties = {
  minWidth: 88,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  padding: "7px 10px",
  display: "grid",
  gap: 2,
  textAlign: "right",
  color: CANVAS.INK,
};

const RULE_BOX: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(255,255,255,0.52)",
  padding: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 14,
};

const RULE_LIST: CSSProperties = {
  margin: "8px 0 0",
  paddingLeft: 18,
  display: "grid",
  gap: 5,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const VENDOR_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 12,
};

const VENDOR_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(255,255,255,0.55)",
  padding: 12,
  display: "grid",
  gap: 10,
};

const ROW_TOP: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 8,
  alignItems: "start",
};

const VENDOR_NAME: CSSProperties = {
  color: CANVAS.INK,
  fontSize: 14,
  lineHeight: 1.25,
};

const PILL: CSSProperties = {
  border: "1px solid",
  borderRadius: 999,
  padding: "3px 8px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 700,
};

const QUESTION_LIST: CSSProperties = {
  display: "grid",
  gap: 8,
};

const QUESTION: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: CANVAS.CARD,
  padding: 10,
  display: "grid",
  gap: 7,
};

const QUESTION_HEAD: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  alignItems: "center",
};

const QUESTION_ID: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  color: CANVAS.INK_MUTED,
  fontWeight: 700,
};

const QUESTION_PRIORITY: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  color: CANVAS.WAITING,
  textTransform: "uppercase",
  fontWeight: 700,
};

const QUESTION_TEXT: CSSProperties = {
  margin: 0,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const DETAILS: CSSProperties = {
  margin: 0,
  display: "grid",
  gap: 5,
};

const DETAIL: CSSProperties = {
  display: "grid",
  gap: 2,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
};

const GOOD: CSSProperties = {
  color: CANVAS.ACTIVE,
  borderColor: CANVAS.ACTIVE,
  background: "rgba(29,158,117,0.06)",
};

const WARN: CSSProperties = {
  color: CANVAS.WAITING,
  borderColor: CANVAS.WAITING,
  background: "rgba(186,117,23,0.06)",
};

const BAD: CSSProperties = {
  color: CANVAS.BLOCKED,
  borderColor: CANVAS.BLOCKED,
  background: "rgba(163,45,45,0.06)",
};
