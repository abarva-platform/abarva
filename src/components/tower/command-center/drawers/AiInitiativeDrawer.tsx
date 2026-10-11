"use client";

// The AI capability drawer — opened from a bubble point or inventory row.
// Transcribed from `aiDrawer()` (design line ~1139).

import {
  controlBlockerCell,
  controlBlockerExplanation,
  formatCount,
  formatUsdM,
  gatingConstraintExplanation,
} from "@/lib/tower/command-center/format";
import type { TowerAiView } from "@/lib/tower/command-center/types";

import { AI_KIND_WORD, Dot, cx } from "../primitives";
import styles from "../TowerCommandCenter.module.css";
import {
  DrawerRow,
  DrawerSection,
  DrawerShell,
  DrawerStat,
} from "./DrawerShell";

const KIND_LABEL: Record<TowerAiView["kind"], string> = {
  funded: "Funded program",
  embedded: "Embedded platform work",
  candidate: "Candidate idea",
  governance: "Governance",
  platform: "Platform",
};

/**
 * The "in plain terms" sentence for an AI item. Definitions are fixed per spend
 * type — they explain the *category*, which is a stable product concept, not a
 * claim about this tenant.
 */
/**
 * The most recent month that actually recorded a reading, with the month it belongs to. Months
 * are carried in order, so the last one carrying a value is the latest reading. A case whose
 * observations all record nothing says so rather than showing the baseline as though it were
 * current.
 */
function latestReading(a: TowerAiView): string {
  const withValue = [...a.valueObservationMonths]
    .reverse()
    .find((m) => m.actualValue !== null);
  if (withValue === undefined) {
    return a.valueObservationMonths.length === 0
      ? "Not recorded"
      : "No month records a reading";
  }
  return `${withValue.actualValue}${
    a.metricUnit === null ? "" : ` ${a.metricUnit}`
  } · ${withValue.month}`;
}

/**
 * Canonical event and basis keys are snake_case identifiers. They are readable as words and are
 * shown as words; nothing is renamed, only spaced.
 */
function humanizeEvent(value: string | null): string {
  if (value === null) return "Not recorded";
  return value.replace(/_/g, " ");
}

function isToolRollout(a: TowerAiView): boolean {
  return a.sourceFile === "23_ai_tool_rollout.csv";
}

function financeAmount(a: TowerAiView): string {
  const hasValidationRecord =
    /validat/i.test(a.financeStatus ?? "") ||
    a.financeApprovalEvents.some((event) =>
      /validat/i.test(`${event.eventType ?? ""} ${event.approvalState ?? ""}`),
    ) ||
    a.valueObservationMonths.some((month) =>
      /validat/i.test(month.validationState ?? ""),
    );
  if (a.financeValidatedUsd === 0 && !hasValidationRecord) {
    return "Not established in this record (projection displays $0)";
  }
  return formatUsdM(a.financeValidatedUsd);
}

function financeBasisRead(a: TowerAiView): string | null {
  if (isToolRollout(a)) return null;
  const latest = a.valueObservationMonths.at(-1);
  const dated = a.valueObservationMonths
    .map((month) => month.month)
    .filter(Boolean);
  const monthRange =
    dated.length > 0
      ? `${dated[0]} to ${dated[dated.length - 1]}`
      : "no dated monthly observations";
  const eventDates = a.financeApprovalEvents
    .map((event) => event.eventDate)
    .filter((date): date is string => Boolean(date));
  const eventRange =
    eventDates.length > 0
      ? `${eventDates[0]} to ${eventDates[eventDates.length - 1]}`
      : "no dated Finance events";
  const mismatch =
    latest && latest.financeValidatedUsd !== a.financeValidatedUsd;
  const differingFinanceEvents = a.financeApprovalEvents.filter(
    (event) =>
      /validat/i.test(
        `${event.eventType ?? ""} ${event.approvalState ?? ""}`,
      ) && event.amountUsd !== a.financeValidatedUsd,
  );
  const timingConflict = Boolean(
    a.realizationStartMonth &&
    dated.some((month) => month < a.realizationStartMonth!),
  );
  const gateConflict = Boolean(
    a.gatingConstraint &&
    a.valueObservationMonths.some((month) => month.boardClaimableUsd > 0),
  );
  return [
    `Monthly observations: ${monthRange}. Finance events: ${eventRange}. The portfolio Finance amount has no period or amount basis on this record.`,
    mismatch
      ? `The latest monthly validated amount (${formatUsdM(latest.financeValidatedUsd)} in ${latest.month}) differs from the portfolio amount (${formatUsdM(a.financeValidatedUsd)}); their bases have not been reconciled.`
      : null,
    differingFinanceEvents.length > 0
      ? "At least one dated Finance validation event has a different amount; confirm its period and amount basis before presenting the portfolio amount as reconciled."
      : null,
    timingConflict
      ? `A monthly observation predates the recorded realization start (${a.realizationStartMonth}); confirm whether it is a target, review event, or realized value.`
      : null,
    gateConflict
      ? `A board-claimable monthly amount is recorded while the case still names a stopping gate (${a.gatingConstraint}); confirm the current gate state.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function optionalCount(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "Not loaded"
    : formatCount(value);
}

function optionalPct(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "Not loaded"
    : `${Math.round(value)}%`;
}

function adoptionGap(a: TowerAiView): string {
  if (a.adoptionTargetPct === null || a.adoptionActualPct == null) {
    return "Not loaded";
  }
  return `${Math.max(0, Math.round(a.adoptionTargetPct - a.adoptionActualPct))} pts`;
}

export function plainAi(a: TowerAiView): string {
  if (isToolRollout(a)) {
    return "This is an AI tool rollout. Read it through adoption against target, active usage, linked business cases and the controls that govern use.";
  }
  const definition: Record<TowerAiView["kind"], string> = {
    funded: "an approved program with recorded funding",
    embedded:
      "AI work attributed to an existing platform; any extra cost needs separate evidence",
    candidate: "a candidate idea whose funding status needs checking",
    governance:
      "a control that unblocks other AI, not a value generator on its own",
    platform: "shared platform consumption spread across many teams",
  };
  return `This is ${definition[a.kind]}. Recommended posture: ${a.posture}.`;
}

export function AiInitiativeDrawer({
  item,
  onClose,
}: {
  item: TowerAiView | null;
  onClose: () => void;
}) {
  const open = item !== null;
  const a = item;
  const plainTone =
    a?.kind === "funded"
      ? "pTeal"
      : a?.kind === "governance"
        ? "pAmber"
        : "pGray";

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      eyebrow={a ? `AI capability ${a.n} · ${KIND_LABEL[a.kind]}` : ""}
      title={a?.name ?? ""}
      footer={
        <>
          <span className={styles.drTrust}>
            <Dot
              tone={
                a && a.readinessScoreLoaded && a.readinessScore >= 60
                  ? "teal"
                  : "amber"
              }
            />
            {a?.posture ?? ""}
          </span>
          <button type="button" className={styles.btn} onClick={onClose}>
            Back to list
          </button>
        </>
      }
    >
      {a ? (
        <>
          <div className={styles.drGrid}>
            <DrawerStat
              label={a.aiAmountBasis === "approved_funding" ? "Approved AI funding" : a.aiAmountBasis === "annualized_tool_cost" ? "Yearly tool cost" : "Amount basis"}
              value={a.aiAmountBasis === "unknown" ? "Not verified" : formatUsdM(a.aiSpendUsd)}
            />
            <DrawerStat label="Recommended posture" value={a.posture} small />
            <DrawerStat
              label={
                isToolRollout(a) ? "Adoption potential" : "Value potential"
              }
              value={`${a.valueScore}/100`}
              small
              tone="vTeal"
            />
            <DrawerStat
              label="Readiness"
              value={
                a.readinessScoreLoaded
                  ? `${a.readinessScore}/100`
                  : "Not scored"
              }
              small
              tone={
                a.readinessScoreLoaded && a.readinessScore >= 60
                  ? "vTeal"
                  : "vAmber"
              }
            />
          </div>

          <div className={cx(styles.drPlain, styles[plainTone])}>
            <div className={styles.pk}>In plain terms</div>
            <p className={styles.pt}>{plainAi(a)}</p>
          </div>

          {isToolRollout(a) ? (
            <>
              <DrawerSection note="usage, target and controls">
                Tool rollout detail
              </DrawerSection>
              <DrawerRow
                label="Rollout goal"
                value={a.rolloutGoal ?? "Not recorded"}
              />
              <DrawerRow
                label="Rollout stage"
                value={a.rolloutStage ?? "Not recorded"}
              />
              <DrawerRow
                label="Target users"
                value={optionalCount(a.rolloutTargetUsers)}
              />
              <DrawerRow
                label="Enabled users"
                value={optionalCount(a.enabledUsers)}
              />
              <DrawerRow
                label="Monthly active users"
                value={optionalCount(a.monthlyActiveUsers)}
              />
              <DrawerRow
                label="Adoption"
                value={`${optionalPct(a.adoptionActualPct)} vs ${optionalPct(
                  a.adoptionTargetPct,
                )} target`}
                sub="Actual active adoption is compared only with this rollout's own loaded target."
              />
              <DrawerRow label="Adoption gap" value={adoptionGap(a)} />
              <DrawerRow
                label="Linked business cases"
                value={optionalCount(a.linkedBusinessCaseCount)}
                sub="Cases are loaded links from the rollout record, not inferred from vendor name."
              />
            </>
          ) : null}

          {!isToolRollout(a) ? (
            <>
              <DrawerSection>Where this sits</DrawerSection>
              <DrawerRow
                label="Project"
                value={a.projectName ?? "Not recorded"}
              />
              <DrawerRow
                label="Lifecycle stage"
                value={a.lifecycleStage ?? "Not recorded"}
              />
              <DrawerRow
                label="Value type"
                value={a.businessValueType ?? "Not recorded"}
              />
              <DrawerRow
                label="Stopped at"
                value={a.gatingConstraint ?? "Not recorded"}
                sub={gatingConstraintExplanation(a.gatingConstraint)}
              />
              <DrawerRow
                label="Finance status"
                value={humanizeEvent(a.financeStatus)}
              />
              <DrawerRow
                label="Control blocker"
                value={controlBlockerCell(a).text}
                sub={controlBlockerExplanation(a)}
              />
              <DrawerRow
                label="Operating metric"
                value={a.successMetric ?? "Not recorded"}
              />
              <DrawerRow
                label="Payback target"
                value={
                  a.paybackMonthsTarget === null
                    ? "Not recorded"
                    : `${formatCount(a.paybackMonthsTarget)} months`
                }
              />

              <DrawerSection>Who answers for it</DrawerSection>
              <DrawerRow
                label="Sponsor"
                value={a.sponsorRole ?? "Not recorded"}
              />
              <DrawerRow
                label="Finance partner"
                value={a.financePartnerRole ?? "Not recorded"}
              />

              <DrawerSection>Proof basis and timing</DrawerSection>
              <p className={cx(styles.recBox, styles.muted)}>
                {financeBasisRead(a)}
              </p>

              {/*
            The waterfall by month, not just its total. A single "finance validated $0" says the
            claim has not landed; the sequence says whether it is moving. Months are rendered as
            the source recorded them, and a case with no observations says so rather than
            drawing an empty chart frame.
          */}
              <DrawerSection>What the claim did, month by month</DrawerSection>
              {a.valueObservationMonths.length === 0 ? (
                <div className={styles.urow}>
                  No monthly value observations are recorded for this case. That
                  is a measurement gap, not evidence that the claim did not
                  move.
                </div>
              ) : (
                <>
                  {a.valueObservationMonths.slice(-4).map((m) => (
                    <DrawerRow
                      key={m.month}
                      label={m.month}
                      value={`${formatUsdM(m.sponsorClaimedUsd)} claimed · ${formatUsdM(
                        m.financeReviewedUsd,
                      )} reviewed · ${formatUsdM(m.financeValidatedUsd)} validated${
                        m.validationState === null
                          ? ""
                          : ` · ${m.validationState}`
                      }`}
                    />
                  ))}
                  <DrawerRow
                    label="Observations on file"
                    value={`${formatCount(a.valueObservationMonths.length)} months`}
                  />
                </>
              )}

              {/*
            The dated finance trail. A case showing "nothing validated" is a statement about the
            total; the trail is what turns it into "no validator has been named", which is the
            actionable version and the design's whole point.
          */}
              {/*
            Approved, spent, forecast. A budget on its own says what was allowed; it takes the
            other two to say whether the project is on plan, and the design leads with all three
            for that reason. Each renders absence as absence — a project that has spent nothing
            records 0, which is not the same as a project whose spend was never recorded.
          */}
              <DrawerSection>Money</DrawerSection>
              <DrawerRow
                label={a.aiAmountBasis === "approved_funding" ? "Approved AI funding" : a.aiAmountBasis === "annualized_tool_cost" ? "Yearly tool cost" : "Amount basis"}
                value={
                  a.aiAmountBasis === "unknown" ? "Not verified" : formatUsdM(a.aiSpendUsd)
                }
              />
              <DrawerRow
                label="Spent to date"
                value={
                  a.actualSpendYtdUsd === null
                    ? "Not recorded"
                    : formatUsdM(a.actualSpendYtdUsd)
                }
              />
              <DrawerRow
                label="Forecast"
                value={
                  a.forecastSpendUsd === null
                    ? "Not recorded"
                    : formatUsdM(a.forecastSpendUsd)
                }
              />

              {/*
            The operating metric with its own numbers. Carried by name since the previous slice;
            without a baseline and a target the name is a label with nothing behind it, and a
            reader can see what a case is measured on but not whether it has moved.
          */}
              <DrawerSection>Operating metric</DrawerSection>
              <DrawerRow
                label="Metric"
                value={a.successMetric ?? "Not recorded"}
              />
              <DrawerRow
                label="Baseline → target"
                value={
                  a.metricBaselineValue === null || a.metricTargetValue === null
                    ? "Not recorded"
                    : `${a.metricBaselineValue} → ${a.metricTargetValue}${
                        a.metricUnit === null ? "" : ` ${a.metricUnit}`
                      }`
                }
              />
              <DrawerRow label="Latest reading" value={latestReading(a)} />

              <DrawerSection>Timing</DrawerSection>
              <DrawerRow
                label="Technology owner"
                value={a.technologyOwnerRole ?? "Not recorded"}
              />
              <DrawerRow
                label="Target go-live"
                value={a.targetGoLiveDate ?? "Not recorded"}
              />
              <DrawerRow
                label="Realization starts"
                value={
                  a.realizationStartMonth ??
                  (a.benefitRealizationLagMonths === null
                    ? "Not recorded"
                    : `Not dated · ${formatCount(
                        a.benefitRealizationLagMonths,
                      )}-month lag recorded`)
                }
              />

              <DrawerSection>Finance trail</DrawerSection>
              {a.financeApprovalEvents.length === 0 ? (
                <div className={styles.urow}>
                  No finance events are recorded against this case. Nothing has
                  been reviewed or validated in the dated Finance trail.
                </div>
              ) : (
                a.financeApprovalEvents.map((e, i) => (
                  <DrawerRow
                    key={`${e.eventDate ?? "undated"}-${e.eventType ?? i}`}
                    label={e.eventDate ?? "Not dated"}
                    value={`${humanizeEvent(e.eventType)} · ${formatUsdM(
                      e.amountUsd,
                    )}${e.amountBasis === null ? "" : ` (${humanizeEvent(e.amountBasis)})`} · ${
                      e.approverRole ?? "No role recorded"
                    }`}
                  />
                ))
              )}

              {/*
            What is on file, and what it measures. The design's reading is that a case can hold
            current, high-confidence evidence and still prove nothing, because the evidence
            describes the plan rather than the result.
          */}
              <DrawerSection>Evidence on file</DrawerSection>
              {a.evidenceItems.length === 0 ? (
                <div className={styles.urow}>
                  No evidence item is recorded against this case.
                </div>
              ) : (
                a.evidenceItems.map((e, i) => (
                  <DrawerRow
                    key={`${e.evidenceName ?? "unnamed"}-${i}`}
                    label={e.evidenceName ?? "Unnamed item"}
                    value={`${e.freshnessState ?? "freshness not recorded"} · ${
                      e.ownerRole ?? "no owner recorded"
                    } · ${
                      e.confidence === null
                        ? "confidence not recorded"
                        : `${e.confidence} confidence`
                    }`}
                  />
                ))
              )}
            </>
          ) : null}

          <DrawerSection>Vendor &amp; system</DrawerSection>
          <DrawerRow label="Vendor" value={a.vendor ?? "Not recorded"} />
          <DrawerRow label="System" value={a.system ?? "Not recorded"} />
          <DrawerRow label="Spend type" value={AI_KIND_WORD[a.kind]} />
          <DrawerRow label="Category" value={a.category ?? "Not recorded"} />
          {!isToolRollout(a) ? (
            <>
              <DrawerRow
                label="Explicit source-backed benefit"
                value={
                  a.promisedBenefitLoaded
                    ? formatUsdM(a.promisedUsd)
                    : "Not loaded"
                }
              />
              <DrawerRow
                label="Finance-validated · period not recorded"
                value={financeAmount(a)}
              />
            </>
          ) : null}

          <DrawerSection>Usage &amp; adoption evidence</DrawerSection>
          {a.usageBars.length === 0 ? (
            <div className={styles.urow}>
              <div className={styles.ut}>
                <span className={styles.un}>Usage evidence</span>
                <span
                  className={styles.uv}
                  style={{ color: "var(--canon-gray-500)" }}
                >
                  Thin
                </span>
              </div>
              <p className={styles.us}>
                {isToolRollout(a)
                  ? "No adoption measurement is recorded for this rollout. Linked case value must be proved on each case."
                  : "No usage-linked measurement is recorded for this case. Its value cannot be usage-supported until one exists."}
              </p>
            </div>
          ) : (
            <div className={styles.usageGroup}>
              {a.usageHeadline ? (
                <div className={styles.usageGroupHead}>
                  {a.usageHeadline}
                  {a.vendor ? ` · ${a.vendor}` : ""}
                </div>
              ) : null}
              {a.usageBars.map((bar) => (
                <div key={bar.label} className={styles.urow}>
                  <div className={styles.ut}>
                    <span className={styles.un}>{bar.label}</span>
                    <span className={styles.uv}>{bar.valueText}</span>
                  </div>
                  <div className={styles.ubar}>
                    <i
                      style={{
                        width: `${bar.pct}%`,
                        background:
                          bar.tone === "teal"
                            ? "var(--canon-teal)"
                            : bar.tone === "amber"
                              ? "var(--canon-amber)"
                              : "var(--canon-red)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <DrawerSection>The read</DrawerSection>
          <div className={styles.efact}>
            <p className={styles.es}>
              {a.note ?? "No caveat recorded for this capability."}
            </p>
            <div className={styles.eloc}>
              <span className={styles.file}>
                {a.sourceFile ?? "source file not recorded"}
              </span>{" "}
              · {isToolRollout(a) ? "tool rollout record" : "case record"}
            </div>
            {isToolRollout(a) ? (
              <>
                <DrawerRow
                  label="Source system"
                  value={a.sourceSystem ?? "Not recorded"}
                />
                <DrawerRow
                  label="Source record"
                  value={a.sourceRecordId ?? "Not recorded"}
                />
                <DrawerRow
                  label="Extracted"
                  value={a.extractDate ?? "Not recorded"}
                />
                <DrawerRow
                  label="As of"
                  value={a.sourceAsOfDate ?? "Not recorded"}
                />
                <DrawerRow
                  label="Refresh cadence"
                  value={a.refreshCadence ?? "Not recorded"}
                />
                <DrawerRow
                  label="Quality state"
                  value={a.sourceQualityState ?? "Not recorded"}
                />
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </DrawerShell>
  );
}
