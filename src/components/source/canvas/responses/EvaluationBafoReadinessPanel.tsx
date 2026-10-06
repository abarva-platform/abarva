"use client";

import type { CSSProperties } from "react";
import type {
  EvaluationBafoReadinessView,
  Stage07NegotiationBriefCandidate,
} from "@/lib/source/proposal-intelligence";
import { CANVAS } from "../canvas-tokens";

function stateLabel(state: EvaluationBafoReadinessView["state"]): string {
  if (state === "ready_for_evaluator_review") return "Evaluator review";
  if (state === "clarify_before_bafo") return "Conditional";
  if (state === "blocked") return "Blocked";
  return "No records";
}

function stateStyle(
  state: EvaluationBafoReadinessView["state"],
): CSSProperties {
  if (state === "ready_for_evaluator_review") return GOOD;
  if (state === "blocked" || state === "no_records") return BAD;
  return WARN;
}

function comparabilityStyle(
  state: EvaluationBafoReadinessView["comparable"][number]["comparability"],
): CSSProperties {
  if (state === "comparable") return GOOD;
  if (state === "blocked") return BAD;
  return WARN;
}

function packageLabel(
  status: EvaluationBafoReadinessView["received"][number]["packageStatus"],
): string {
  if (status === "received") return "Received";
  if (status === "received_with_gaps") return "Received with gaps";
  return "Not score ready";
}

function questionResponsePriority(
  row: EvaluationBafoReadinessView["questionResponses"][number],
): number {
  if (row.answerState === "missing") return 0;
  if (row.answerState === "exception") return 1;
  if (row.answerState === "partial") return 2;
  return 3;
}

export function EvaluationBafoReadinessPanel({
  view,
  negotiationBriefCandidate,
}: {
  view?: EvaluationBafoReadinessView | null;
  negotiationBriefCandidate?: Stage07NegotiationBriefCandidate | null;
}) {
  if (!view) return null;
  const visibleQuestionResponses = [...view.questionResponses]
    .sort((a, b) => questionResponsePriority(a) - questionResponsePriority(b))
    .slice(0, 6);
  const visibleEvaluatorScorecards = view.evaluatorScorecards.slice(0, 6);
  const visibleCommercialComparisons = view.commercialComparison.slice(0, 3);
  const visibleClarifications = view.clarificationRequests.slice(0, 6);
  const visibleBlockers = view.blockers.slice(0, 5);
  const reviewedFacts =
    negotiationBriefCandidate?.acceptedFacts.filter((fact) => fact.reviewState) ??
    [];
  const otherFacts =
    negotiationBriefCandidate?.acceptedFacts.filter(
      (fact) => !fact.reviewState,
    ) ?? [];
  const concessionFact = reviewedFacts.find(
    (fact) => fact.category === "bafo_concession",
  );
  const visibleReviewedFacts = [
    ...reviewedFacts.slice(0, 1),
    ...(concessionFact ? [concessionFact] : reviewedFacts.slice(1, 2)),
  ].filter(
    (fact, index, facts) =>
      facts.findIndex((candidate) => candidate.factId === fact.factId) ===
      index,
  );
  const visibleFacts = [...visibleReviewedFacts, ...otherFacts].slice(0, 4);
  const visibleAsks = negotiationBriefCandidate?.proposedAsks.slice(0, 4) ?? [];
  const visibleRefusals = negotiationBriefCandidate?.refusals.slice(0, 3) ?? [];

  return (
    <section
      data-testid="source-evaluation-bafo-readiness"
      style={CARD}
      aria-label="Evaluation and BAFO readiness"
    >
      <div style={HEADER}>
        <div>
          <div style={EYEBROW}>Stage 07 decision support</div>
          <h3 style={TITLE}>{view.headline}</h3>
          <p style={COPY}>{view.contextLine}</p>
          <p style={SUBTLE_COPY}>{view.archetypeLine}</p>
        </div>
        <div style={STATUS_WRAP}>
          <span style={{ ...PILL, ...stateStyle(view.state) }}>
            {stateLabel(view.state)}
          </span>
          <strong style={ACTION_LABEL}>Next action</strong>
          <span style={ACTION_TEXT}>{view.singleNextAction}</span>
        </div>
      </div>

      <div style={GRID}>
        <div style={PANEL}>
          <div style={PANEL_HEAD}>
            <span style={EYEBROW}>Received</span>
            <strong>{view.received.length} package set</strong>
          </div>
          <div style={STACK}>
            {view.received.length > 0 ? (
              view.received.map((row) => (
                <div key={row.vendorId} style={ROW}>
                  <div>
                    <strong>{row.vendorName}</strong>
                    <span style={ROW_NOTE}>
                      {row.sectionsAnswered}/{row.sectionsTotal} sections ·{" "}
                      {row.exhibitCount} exhibits · {row.extractionCardCount}{" "}
                      extraction cards
                    </span>
                  </div>
                  <span
                    style={{
                      ...PILL_SMALL,
                      ...(row.packageStatus === "received"
                        ? GOOD
                        : row.packageStatus === "received_with_gaps"
                          ? WARN
                          : BAD),
                    }}
                  >
                    {packageLabel(row.packageStatus)}
                  </span>
                </div>
              ))
            ) : (
              <p style={EMPTY_COPY}>No governed response profiles loaded.</p>
            )}
          </div>
        </div>

        <div style={PANEL}>
          <div style={PANEL_HEAD}>
            <span style={EYEBROW}>Comparable</span>
            <strong>{view.comparable.length} vendor read</strong>
          </div>
          <div style={STACK}>
            {view.comparable.length > 0 ? (
              view.comparable.map((row) => (
                <div key={row.vendorId} style={COMPARABLE_ROW}>
                  <div style={COMPARABLE_HEAD}>
                    <strong>{row.vendorName}</strong>
                    <span
                      style={{
                        ...PILL_SMALL,
                        ...comparabilityStyle(row.comparability),
                      }}
                    >
                      {row.comparability}
                    </span>
                  </div>
                  <span style={ROW_NOTE}>{row.scorePosture}</span>
                  <span style={ROW_NOTE}>{row.rationale}</span>
                  {row.evidenceBasis.length > 0 ? (
                    <span style={EVIDENCE_NOTE}>
                      Evidence: {row.evidenceBasis.join("; ")}
                    </span>
                  ) : null}
                </div>
              ))
            ) : (
              <p style={EMPTY_COPY}>
                No scorecard or response evidence to compare.
              </p>
            )}
          </div>
        </div>
      </div>

      <div style={PRICING_PANEL}>
        <div style={PANEL_HEAD}>
          <span style={EYEBROW}>Pricing comparability</span>
          <strong>{view.pricing.length} vendor TCO read</strong>
        </div>
        <div style={PRICING_GRID}>
          {view.pricing.length > 0 ? (
            view.pricing.map((row) => (
              <article key={row.vendorId} style={PRICING_CARD}>
                <div style={COMPARABLE_HEAD}>
                  <strong>{row.vendorName}</strong>
                  <span
                    style={{
                      ...PILL_SMALL,
                      ...comparabilityStyle(row.comparability),
                    }}
                  >
                    {row.comparability}
                  </span>
                </div>
                <div style={METRIC_GRID}>
                  <span>
                    <strong>{row.fiveYearTcoLabel}</strong>
                    <small>Five-year TCO</small>
                  </span>
                  <span>
                    <strong>{row.yearOneRunCostLabel}</strong>
                    <small>Year-one run</small>
                  </span>
                  <span>
                    <strong>{row.transitionCostLabel}</strong>
                    <small>Transition</small>
                  </span>
                  <span>
                    <strong>{row.oneTimeCostLabel}</strong>
                    <small>One-time</small>
                  </span>
                </div>
                <p style={ROW_NOTE}>{row.pricingBasis}</p>
                <p style={NEXT_ACTION}>{row.rationale}</p>
              </article>
            ))
          ) : (
            <p style={EMPTY_COPY}>
              No pricing records available for comparison.
            </p>
          )}
        </div>
      </div>

      <div style={GRID}>
        <div style={PANEL}>
          <div style={PANEL_HEAD}>
            <span style={EYEBROW}>Normalized question rows</span>
            <strong>{view.questionResponses.length} row</strong>
          </div>
          <div style={STACK}>
            {visibleQuestionResponses.length > 0 ? (
              visibleQuestionResponses.map((row) => (
                <div key={`${row.vendorId}:${row.questionId}`} style={COMPARABLE_ROW}>
                  <div style={COMPARABLE_HEAD}>
                    <strong>{row.questionLabel}</strong>
                    <span
                      style={{
                        ...PILL_SMALL,
                        ...(row.answerState === "complete"
                          ? GOOD
                          : row.answerState === "missing"
                            ? BAD
                            : WARN),
                      }}
                    >
                      {row.answerState}
                    </span>
                  </div>
                  <span style={ROW_NOTE}>{row.vendorName}</span>
                  <span style={ROW_NOTE}>{row.normalizedResponse}</span>
                  <span style={EVIDENCE_NOTE}>
                    Evidence: {row.evidenceReference}
                  </span>
                  <span style={NEXT_ACTION}>{row.evaluatorUse}</span>
                </div>
              ))
            ) : (
              <p style={EMPTY_COPY}>No normalized question rows available.</p>
            )}
          </div>
        </div>

        <div style={PANEL}>
          <div style={PANEL_HEAD}>
            <span style={EYEBROW}>Named evaluator review</span>
            <strong>{view.evaluatorScorecards.length} score</strong>
          </div>
          <div style={STACK}>
            {visibleEvaluatorScorecards.length > 0 ? (
              visibleEvaluatorScorecards.map((row) => (
                <div
                  key={`${row.vendorId}:${row.criterionId}:${row.evaluatorName}`}
                  style={COMPARABLE_ROW}
                >
                  <div style={COMPARABLE_HEAD}>
                    <strong>{row.vendorName}</strong>
                    <span
                      style={{
                        ...PILL_SMALL,
                        ...(row.reviewState === "locked_named_human_review"
                          ? GOOD
                          : row.reviewState === "not_loaded"
                            ? WARN
                            : BAD),
                      }}
                    >
                      {row.reviewState.replaceAll("_", " ")}
                    </span>
                  </div>
                  <span style={ROW_NOTE}>
                    {row.criterionLabel}: {row.scoreLabel}
                  </span>
                  <span style={ROW_NOTE}>Evaluator: {row.evaluatorName}</span>
                  <span style={EVIDENCE_NOTE}>
                    Evidence: {row.evidenceReference}; lock {row.lockState}
                  </span>
                </div>
              ))
            ) : (
              <p style={EMPTY_COPY}>No named evaluator review is loaded.</p>
            )}
          </div>
        </div>
      </div>

      <div style={PRICING_PANEL}>
        <div style={PANEL_HEAD}>
          <span style={EYEBROW}>Support-only TCO comparison</span>
          <strong>{view.commercialComparison.length} vendor basis</strong>
        </div>
        <div style={PRICING_GRID}>
          {visibleCommercialComparisons.length > 0 ? (
            visibleCommercialComparisons.map((row) => (
              <article key={row.vendorId} style={PRICING_CARD}>
                <div style={COMPARABLE_HEAD}>
                  <strong>{row.vendorName}</strong>
                  <span
                    style={{
                      ...PILL_SMALL,
                      ...comparabilityStyle(row.comparability),
                    }}
                  >
                    {row.comparability}
                  </span>
                </div>
                <span style={ROW_NOTE}>
                  Support-only TCO: {row.supportOnlyTcoLabel}
                </span>
                <ul style={PLAIN_LIST}>
                  {row.includedAmountLabels.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
                <ul style={PLAIN_LIST_MUTED}>
                  {row.excludedUnsupportedAmountLabels.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
                <p style={EVIDENCE_NOTE}>{row.guardrail}</p>
              </article>
            ))
          ) : (
            <p style={EMPTY_COPY}>No support-only TCO basis is available.</p>
          )}
        </div>
      </div>

      <div style={GRID}>
        <div style={PANEL}>
          <div style={PANEL_HEAD}>
            <span style={EYEBROW}>Clarification drafts</span>
            <strong>{view.clarificationRequests.length} draft</strong>
          </div>
          <div style={STACK}>
            {visibleClarifications.length > 0 ? (
              visibleClarifications.map((row) => (
                <div key={row.clarificationId} style={COMPARABLE_ROW}>
                  <div style={COMPARABLE_HEAD}>
                    <strong>{row.vendorName}</strong>
                    <span style={{ ...PILL_SMALL, ...WARN }}>
                      draft only
                    </span>
                  </div>
                  <span style={ROW_NOTE}>{row.question}</span>
                  <span style={EVIDENCE_NOTE}>
                    Source: {row.source}; priority {row.priority}
                  </span>
                  {row.evidenceBasis.length > 0 ? (
                    <span style={EVIDENCE_NOTE}>
                      Evidence basis: {row.evidenceBasis.join("; ")}
                    </span>
                  ) : null}
                </div>
              ))
            ) : (
              <p style={EMPTY_COPY}>No clarification drafts are available.</p>
            )}
          </div>
        </div>

        <div style={PANEL}>
          <div style={PANEL_HEAD}>
            <span style={EYEBROW}>{view.bafoRound.roundLabel}</span>
            <span style={{ ...PILL_SMALL, ...WARN }}>
              {view.bafoRound.state === "candidate_not_dispatched"
                ? "candidate, not dispatched"
                : "blocked"}
            </span>
          </div>
          <dl style={ROUND_FACTS}>
            <div>
              <dt>Vendors</dt>
              <dd>{view.bafoRound.vendorCount}</dd>
            </div>
            <div>
              <dt>Questions</dt>
              <dd>{view.bafoRound.questionCount}</dd>
            </div>
          </dl>
          <p style={NEXT_ACTION}>{view.bafoRound.nextAction}</p>
          <p style={EVIDENCE_NOTE}>{view.bafoRound.guardrail}</p>
        </div>
      </div>

      <div style={BLOCKER_PANEL}>
        <div style={PANEL_HEAD}>
          <span style={EYEBROW}>Blockers and evidence gaps</span>
          <strong>{view.blockers.length} open item</strong>
        </div>
        {visibleBlockers.length > 0 ? (
          <div style={BLOCKER_GRID}>
            {visibleBlockers.map((blocker) => (
              <article key={blocker.blockerId} style={BLOCKER_CARD}>
                <div style={COMPARABLE_HEAD}>
                  <strong>{blocker.vendorName}</strong>
                  <span
                    style={{
                      ...PILL_SMALL,
                      ...(blocker.severity === "blocker" ? BAD : WARN),
                    }}
                  >
                    {blocker.severity}
                  </span>
                </div>
                <span style={BLOCKER_LABEL}>{blocker.label}</span>
                <p style={ROW_NOTE}>{blocker.detail}</p>
                <p style={NEXT_ACTION}>{blocker.nextAction}</p>
              </article>
            ))}
          </div>
        ) : (
          <p style={EMPTY_COPY}>
            No deterministic blocker is recorded. Named evaluators still own the
            final scoring decision.
          </p>
        )}
      </div>

      {negotiationBriefCandidate ? (
        <div style={NEGOTIATION_PANEL}>
          <div style={PANEL_HEAD}>
            <span style={EYEBROW}>Negotiation brief candidate</span>
            <span
              style={{
                ...PILL_SMALL,
                ...(negotiationBriefCandidate.state === "candidate"
                  ? GOOD
                  : BAD),
              }}
            >
              {negotiationBriefCandidate.state === "candidate"
                ? "Candidate"
                : "Refused"}
            </span>
          </div>
          <p style={ROW_NOTE}>{negotiationBriefCandidate.headline}</p>
          {visibleRefusals.length > 0 ? (
            <div style={BRIEF_LIST}>
              {visibleRefusals.map((refusal) => (
                <article
                  key={`${refusal.evidenceFamily}:${refusal.vendorId ?? "all"}`}
                  style={BRIEF_ITEM}
                >
                  <strong>{refusal.vendorName}</strong>
                  <span style={ROW_NOTE}>{refusal.reason}</span>
                  <span style={NEXT_ACTION}>{refusal.nextAction}</span>
                </article>
              ))}
            </div>
          ) : (
            <div style={BRIEF_COLUMNS}>
              <div>
                <strong style={BRIEF_LABEL}>Accepted facts</strong>
                <div style={BRIEF_LIST}>
                  {visibleFacts.map((fact) => (
                    <article key={fact.factId} style={BRIEF_ITEM}>
                      <strong>{fact.vendorName}</strong>
                      <span style={ROW_NOTE}>{fact.statement}</span>
                      {fact.reviewState ? (
                        <span style={EVIDENCE_NOTE}>
                          Review state: {fact.reviewState}
                        </span>
                      ) : null}
                      {fact.citation ? (
                        <span style={EVIDENCE_NOTE}>
                          Citation: {fact.citation}
                        </span>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
              <div>
                <strong style={BRIEF_LABEL}>Proposed asks</strong>
                <div style={BRIEF_LIST}>
                  {visibleAsks.map((ask) => (
                    <article key={ask.askId} style={BRIEF_ITEM}>
                      <strong>{ask.vendorName}</strong>
                      <span style={ROW_NOTE}>{ask.ask}</span>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div style={GUARDRAIL}>
            {negotiationBriefCandidate.guardrails.join(" ")}
          </div>
        </div>
      ) : null}

      <div style={GUARDRAIL}>{view.guardrail}</div>
    </section>
  );
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  background: "#FFFFFF",
  boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
  padding: 18,
};

const HEADER: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 280px)",
  gap: 18,
  alignItems: "start",
};

const EYEBROW: CSSProperties = {
  color: CANVAS.INK_MUTED,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0,
  textTransform: "uppercase",
};

const TITLE: CSSProperties = {
  margin: "4px 0 0",
  color: CANVAS.INK,
  fontSize: 20,
  lineHeight: 1.2,
  letterSpacing: 0,
};

const COPY: CSSProperties = {
  margin: "8px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: 13,
  lineHeight: 1.5,
};

const SUBTLE_COPY: CSSProperties = {
  ...COPY,
  color: CANVAS.INK_MUTED,
};

const STATUS_WRAP: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  background: "#F8FAFC",
  padding: 12,
  display: "grid",
  gap: 8,
};

const ACTION_LABEL: CSSProperties = {
  color: CANVAS.INK,
  fontSize: 12,
};

const ACTION_TEXT: CSSProperties = {
  color: CANVAS.INK_SOFT,
  fontSize: 13,
  lineHeight: 1.4,
};

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
  gap: 14,
  marginTop: 16,
};

const PANEL: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  padding: 14,
  minWidth: 0,
};

const PRICING_PANEL: CSSProperties = {
  ...PANEL,
  marginTop: 14,
};

const PANEL_HEAD: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  color: CANVAS.INK,
  fontSize: 13,
};

const STACK: CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 12,
};

const ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 12,
  alignItems: "start",
  color: CANVAS.INK,
  fontSize: 13,
};

const COMPARABLE_ROW: CSSProperties = {
  borderTop: `1px solid ${CANVAS.RULE}`,
  paddingTop: 10,
  display: "grid",
  gap: 5,
  color: CANVAS.INK,
  fontSize: 13,
};

const PRICING_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 10,
  marginTop: 12,
};

const PRICING_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  background: "#FBFCFE",
  padding: 12,
  display: "grid",
  gap: 8,
  minWidth: 0,
};

const METRIC_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const COMPARABLE_HEAD: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
};

const ROW_NOTE: CSSProperties = {
  display: "block",
  color: CANVAS.INK_SOFT,
  fontSize: 12,
  lineHeight: 1.4,
};

const EVIDENCE_NOTE: CSSProperties = {
  display: "block",
  color: CANVAS.INK_MUTED,
  fontSize: 11,
  lineHeight: 1.35,
};

const PLAIN_LIST: CSSProperties = {
  margin: 0,
  paddingLeft: 16,
  color: CANVAS.INK,
  fontSize: 12,
  lineHeight: 1.45,
};

const PLAIN_LIST_MUTED: CSSProperties = {
  ...PLAIN_LIST,
  color: CANVAS.INK_MUTED,
};

const ROUND_FACTS: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  margin: "12px 0",
  color: CANVAS.INK,
  fontSize: 13,
};

const BLOCKER_PANEL: CSSProperties = {
  ...PANEL,
  marginTop: 14,
};

const NEGOTIATION_PANEL: CSSProperties = {
  ...PANEL,
  marginTop: 14,
  background: "#F8FAFC",
};

const BRIEF_COLUMNS: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  marginTop: 12,
};

const BRIEF_LIST: CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 8,
};

const BRIEF_ITEM: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  background: "#FFFFFF",
  padding: 10,
  display: "grid",
  gap: 4,
  minWidth: 0,
};

const BRIEF_LABEL: CSSProperties = {
  color: CANVAS.INK,
  fontSize: 12,
};

const BLOCKER_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
  marginTop: 12,
};

const BLOCKER_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  background: "#FBFCFE",
  padding: 12,
  display: "grid",
  gap: 6,
};

const BLOCKER_LABEL: CSSProperties = {
  color: CANVAS.INK,
  fontSize: 12,
  fontWeight: 800,
  textTransform: "capitalize",
};

const NEXT_ACTION: CSSProperties = {
  margin: 0,
  color: "#7C2D12",
  fontSize: 12,
  lineHeight: 1.4,
  fontWeight: 700,
};

const GUARDRAIL: CSSProperties = {
  marginTop: 14,
  borderRadius: 8,
  background: "#F8FAFC",
  color: CANVAS.INK_MUTED,
  fontSize: 12,
  lineHeight: 1.45,
  padding: 12,
};

const EMPTY_COPY: CSSProperties = {
  margin: 0,
  color: CANVAS.INK_MUTED,
  fontSize: 13,
  lineHeight: 1.4,
};

const PILL: CSSProperties = {
  justifySelf: "start",
  borderRadius: 999,
  padding: "5px 9px",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
};

const PILL_SMALL: CSSProperties = {
  borderRadius: 999,
  padding: "3px 7px",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const GOOD: CSSProperties = {
  background: "#DCFCE7",
  color: "#166534",
};

const WARN: CSSProperties = {
  background: "#FEF3C7",
  color: "#92400E",
};

const BAD: CSSProperties = {
  background: "#FEE2E2",
  color: "#991B1B",
};
