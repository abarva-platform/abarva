"use client";

// Tab 1 — Executive View.
//
// The attached design is the visual contract for this surface. This component
// keeps the same Layer 4 boundary as the previous Command Center: it only
// projects the governed Tower command-center view model.

import { formatCount, formatUsdM } from "@/lib/tower/command-center/format";
import type {
  TowerCommandCenterView,
  TowerEvidenceGapView,
} from "@/lib/tower/command-center/types";
import styles from "../TowerCommandCenter.module.css";
import { cx } from "../primitives";
import { approvedAiCaseFunding, isBusinessCase, isToolRollout } from "./portfolio-kind";
import { byEvidencePriority, evidenceGapAmount } from "./evidence-gap-amount";

interface ExecutiveMetric {
  label: string;
  badge?: string;
  value: string;
  note: string;
  tone: "teal" | "amber" | "red" | "gray";
}

interface ExecutiveDecision {
  order: string;
  kicker: string;
  title: string;
  detail: string;
  metricLabel: string;
  metricValue: string;
  suggestedSequence: string;
  tone: "red" | "amber" | "gray";
  reviewTarget: "funnel" | "ai" | "actions";
}

function formatLoadedUsdM(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "not verified"
    : formatUsdM(value);
}

function fundingSentence(view: TowerCommandCenterView): string {
  const amount = view.summary.approvedInvestmentUsd;
  return amount === null
    ? "Approved FY26 project funding is not verified from the source files."
    : `${formatUsdM(amount)} in approved FY26 project funding.`;
}

function clearedValueSentence(view: TowerCommandCenterView): string {
  const s = view.summary;
  return s.claimableAmountLoaded === true
    ? `${formatUsdM(s.claimableUsd)} cleared for reporting in the loaded months.`
    : "A cleared amount is not verified for the loaded months.";
}

function usageValueLabel(summary: TowerCommandCenterView["summary"]): string {
  if (summary.usageSupportedValueCoverage === "none") return "Not measured";
  const value = formatUsdM(summary.usageSupportedUsd);
  return summary.usageSupportedValueCoverage === "partial" ? `${value} (partial)` : value;
}

function valueClaimCount(view: TowerCommandCenterView): number {
  return view.summary.valueClaimCount;
}

function openClaimCount(view: TowerCommandCenterView): number {
  const s = view.summary;
  return Math.max(0, valueClaimCount(view) - s.claimableClaimCount);
}

function aiToolRolloutCount(view: TowerCommandCenterView): number {
  return view.allInitiatives.filter(isToolRollout).length;
}

function toolCostGap(view: TowerCommandCenterView): string {
  const tools = view.allInitiatives.filter(isToolRollout);
  const missing = tools.filter((item) => !item.aiSpendLoaded).length;
  if (missing === 0) return "";
  return ` Costs for ${formatCount(missing)} of ${formatCount(tools.length)} tool rollouts are not loaded.`;
}

function commandFreshnessLine(view: TowerCommandCenterView): string {
  const s = view.summary;
  const asOf = s.asOfPeriod
    ? `As of ${s.asOfPeriod}`
    : "As-of date not recorded";
  const built = s.refreshTimestamp
    ? `built ${s.refreshTimestamp.slice(0, 10)}`
    : "build date not recorded";
  return `${asOf} · ${built}`;
}

function conflictCount(view: TowerCommandCenterView): number {
  return Math.max(
    view.summary.conflictedProgramCount,
    view.evidenceFacts.filter((fact) => fact.lineageState === "CONFLICT")
      .length,
  );
}

function executiveHeadline(view: TowerCommandCenterView): string {
  const claims = valueClaimCount(view);
  const outcomeRecords = view.summary.valueProofOutcomeRecordCount ?? 0;
  if (claims <= 0) {
    return `Tower view: ${fundingSentence(view)} No benefit claims are loaded, so cleared value is unknown.${outcomeRecords > 0 ? ` ${formatCount(outcomeRecords)} separate outcome-measure records are loaded.` : ""}`;
  }

  return `Tower view: ${fundingSentence(view)} ${clearedValueSentence(view)} ${formatCount(openClaimCount(view))} of ${formatCount(
    claims,
  )} benefit claims do not show an amount cleared for reporting.${outcomeRecords > 0 ? ` ${formatCount(outcomeRecords)} outcome-measure records are separate.` : ""}`;
}

function executiveSummary(view: TowerCommandCenterView): string {
  const s = view.summary;
  const claims = valueClaimCount(view);
  const outcomeRecords = s.valueProofOutcomeRecordCount ?? 0;
  const caseFunding = approvedAiCaseFunding(view.allInitiatives);
  const caseFundingSentence = caseFunding === null
    ? "Approved FY26 AI case funding is not verified."
    : `This includes ${formatUsdM(caseFunding)} in approved FY26 funding for AI business cases.`;
  if (claims <= 0) {
    return `${view.summary.tenantName}: ${fundingSentence(view)} ${caseFundingSentence}${toolCostGap(view)} No benefit claims are loaded yet, so Tower cannot assess their value.${outcomeRecords > 0 ? ` ${formatCount(outcomeRecords)} outcome-measure records are separate.` : ""}`;
  }

  const projected = s.promisedBenefitLoaded
    ? `The loaded claims project ${formatUsdM(s.promisedUsd)} in yearly benefit.`
    : "A reconciled yearly benefit amount is not loaded.";
  return `${view.summary.tenantName}: ${fundingSentence(view)} ${caseFundingSentence}${toolCostGap(view)} ${projected} ${clearedValueSentence(view)} ${formatCount(
    Math.max(0, claims - s.claimableClaimCount),
  )} benefit claims do not show an amount cleared for reporting.${outcomeRecords > 0 ? ` ${formatCount(outcomeRecords)} outcome-measure records are separate.` : ""} Each claim type needs its own evidence review.`;
}

function metrics(view: TowerCommandCenterView): ExecutiveMetric[] {
  const s = view.summary;
  const claims = valueClaimCount(view);
  const caseFunding = approvedAiCaseFunding(view.allInitiatives);
  return [
    {
      label: "Approved FY26 project funding",
      value: formatLoadedUsdM(s.approvedInvestmentUsd),
      // The count of subjects, not the board-scope count and not however many rows loaded.
      // The view model already resolves absence; a second fallback here silently swapped in a
      // different metric whenever the first was zero.
      note: s.approvedInvestmentUsd === null
        ? `${formatCount(s.totalProgramSubjectCount)} projects · funding period or approval not verified`
        : `${formatCount(s.totalProgramSubjectCount)} projects · approved budgets, not actual spending`,
      tone: "teal",
    },
    {
      label: "Projected yearly benefit",
      badge:
        !s.promisedBenefitLoaded ? "NOT LOADED" : s.claimableAmountLoaded !== true ? "NOT VERIFIED" : s.claimableUsd > 0 ? "PARTIAL" : "UNPROVEN",
      value: s.promisedBenefitLoaded ? formatUsdM(s.promisedUsd) : "Not loaded",
      note:
        !s.promisedBenefitLoaded
          ? "A reconciled yearly benefit estimate is not loaded."
          : "A planning estimate, not proven savings; the claim list can contain different kinds of opportunities",
      tone: s.promisedBenefitLoaded ? "amber" : "gray",
    },
    {
      label: "Cleared in loaded months",
      badge: s.claimableAmountLoaded === true ? (s.claimableClaimCount > 0 ? "OPEN" : "RECORDED") : "NOT VERIFIED",
      value: s.claimableAmountLoaded === true ? formatUsdM(s.claimableUsd) : "Not verified",
      note:
        claims <= 0
          ? "No benefit claims are loaded for Finance review."
          : `${formatCount(s.financeAttestedClaimCount)} of ${formatCount(
              claims,
            )} benefit claims have Finance sign-off`,
      tone: s.claimableAmountLoaded === true && s.claimableClaimCount > 0 ? "teal" : "gray",
    },
    {
      label: "AI initiatives and tools tracked",
      badge: s.aiInitiativeCount > 0 ? "TRACKED" : "NOT LOADED",
      value: `${formatCount(s.aiInitiativeCount)}`,
      note: `${formatCount(view.allInitiatives.filter(isBusinessCase).length)} AI use cases + ${formatCount(
        aiToolRolloutCount(view),
      )} tool rollouts · ${formatCount(view.usageObservations.length)} separate adoption-source rows · ${caseFunding === null ? "AI case funding not verified" : `${formatUsdM(caseFunding)} recorded AI case funding`}`,
      tone: s.aiInitiativeCount > 0 ? "teal" : "gray",
    },
    {
      label: "Claims with usage evidence",
      badge:
        claims <= 0
          ? "NOT LOADED"
          : s.usageSupportedClaimCount > 0 ? "RECORDED" : "NONE RECORDED",
      value:
        claims <= 0
          ? "Not loaded"
          : formatCount(s.usageSupportedClaimCount),
      note:
        claims <= 0
          ? "No benefit claims loaded; usage evidence cannot be assessed."
          : "Usage proof applies where adoption drives the benefit; sourcing and foundation claims need different proof.",
      tone: claims <= 0 ? "gray" : s.usageSupportedClaimCount > 0 ? "amber" : "red",
    },
  ];
}

function decisions(view: TowerCommandCenterView): ExecutiveDecision[] {
  const s = view.summary;
  const claims = valueClaimCount(view);
  if (claims <= 0) return [];

  const claimsMissingActual = Math.max(0, claims - s.outcomeMeasuredClaimCount);
  const claimsMissingFinance = Math.max(0, claims - s.financeAttestedClaimCount);

  return [
    {
      order: "1",
      kicker: "Check · do this first",
      title: "Match each benefit claim to the proof it needs",
      detail: `Usage evidence is recorded for ${formatCount(s.usageSupportedClaimCount)} claims. Check adoption for cases where use drives the benefit; sourcing opportunities need financial evidence, and foundations need a link to downstream results.`,
      metricLabel: "Claims with usage evidence",
      metricValue: formatCount(s.usageSupportedClaimCount),
      suggestedSequence: "First review step",
      tone: "red",
      reviewTarget: "ai",
    },
    {
      order: "2",
      kicker: "Measure · then this",
      title: "Review claims without a measured outcome",
      detail:
        `${formatCount(claimsMissingActual)} claims have no measured outcome recorded. Decide which need a direct result and which need a documented link to another result. A plan is not an earned benefit.`,
      metricLabel: "No outcome recorded",
      metricValue: formatCount(claimsMissingActual),
      suggestedSequence: "After proof mapping",
      tone: "amber",
      reviewTarget: "funnel",
    },
    {
      order: "3",
      kicker: "Assign · only then",
      title: "Review which financial claims need Finance sign-off",
      detail: `${formatCount(claimsMissingFinance)} benefit claims have no Finance sign-off recorded. Check which types require it before reporting a dollar benefit. ${clearedValueSentence(view)}`,
      metricLabel: "Finance sign-offs recorded",
      metricValue: formatCount(s.financeAttestedClaimCount),
      suggestedSequence: "After outcome review",
      tone: "gray",
      reviewTarget: "actions",
    },
  ];
}

function evidenceFooterCount(view: TowerCommandCenterView): number {
  return view.actions.length;
}

function evidenceQueue(gaps: readonly TowerEvidenceGapView[]) {
  return [...gaps]
    .sort(byEvidencePriority)
    .slice(0, 5);
}

function ValueEvidenceGroups({ view }: { view: TowerCommandCenterView }) {
  const s = view.summary;
  if (s.valueClaimCount <= 0) {
    return <div className={styles.emptyPanel}>Value claims are not loaded, so these amounts are unknown.</div>;
  }
  const groups = [
    {
      heading: "Planning and adoption evidence",
      note: s.usageSupportedValueCoverage === "partial"
        ? "The yearly benefit is an estimate. The usage-linked amount covers measured rows only; other claims have no measured amount. Finance has not confirmed this as a saving."
        : "The yearly benefit is an estimate. A usage-linked dollar amount appears only when separately measured; it does not mean Finance has confirmed a saving.",
      rows: [
        ["Projected yearly benefit", s.promisedBenefitLoaded ? formatUsdM(s.promisedUsd) : "Not loaded"],
        ["Usage-linked claim value", usageValueLabel(s)],
      ],
    },
    {
      heading: "Finance review · loaded months",
      note: "Finance may validate a claim that is still blocked from board reporting. Only the cleared amount has passed every required gate.",
      rows: [
        ["Finance validated", s.financeValidatedAmountLoaded === true ? formatUsdM(s.financeValidatedUsd) : "Not verified"],
        ["Cleared for reporting", s.claimableAmountLoaded === true ? formatUsdM(s.claimableUsd) : "Not verified"],
      ],
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, height: "100%" }}>
      {groups.map((group) => (
        <article key={group.heading} style={{ border: "1px solid var(--canon-border)", padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>{group.heading}</h3>
          {group.rows.map(([label, value]) => (
            <div key={label} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, borderBottom: "1px solid var(--canon-border)", paddingBottom: 12 }}>
              <span>{label}</span>
              <strong style={{ fontSize: 22, whiteSpace: "nowrap" }}>{value}</strong>
            </div>
          ))}
          <p style={{ margin: "auto 0 0", lineHeight: 1.5 }}>{group.note}</p>
        </article>
      ))}
    </div>
  );
}

export function CommandCenterView({
  view,
  onOpenGap,
  onGoToFunnel,
  onGoToAi,
  onGoToActions,
}: {
  view: TowerCommandCenterView;
  onOpenGap: (id: string) => void;
  onGoToFunnel: () => void;
  onGoToAi: () => void;
  onGoToActions: () => void;
}) {
  const plannedCases = view.allInitiatives.filter((item) => isBusinessCase(item) && item.sourcePlan != null);
  if (plannedCases.length > 0) {
    const topCases = [...plannedCases]
      .sort((a, b) => (b.sourcePlan?.fundingUsd ?? -1) - (a.sourcePlan?.fundingUsd ?? -1))
      .slice(0, 6);
    const withProjectedRoi = plannedCases.filter((item) => item.sourcePlan?.roiLowMultiple != null).length;
    const withProjectSpend = plannedCases.filter((item) => item.projectName && item.actualSpendYtdUsd != null).length;
    return (
      <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <h2 style={{ margin: 0, fontFamily: "var(--abarva-serif)", fontWeight: 500, fontSize: 26 }}>
          Decide which AI bets to scale, repair, or stop after comparing the synthetic plan with use and measured results.
        </h2>
        <p style={{ margin: 0, maxWidth: 1000, fontSize: 15, lineHeight: 1.6 }}>
          {formatCount(plannedCases.length)} source case plans are loaded; {formatCount(withProjectedRoi)} show projected return on investment and {formatCount(withProjectSpend)} link to project spending records. These counts describe source coverage, not successful investments. The Finance stages are synthetic source assertions, not independent approval.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          <article style={{ padding: 20, background: "var(--canon-bg-surface)", border: "1px solid var(--canon-border)" }}><h3>Scale only with proof</h3><p>Match actual tool use, measured outcomes, and a Finance-cleared value to the same case and period.</p><button type="button" onClick={onGoToFunnel}>Review results and proof</button></article>
          <article style={{ padding: 20, background: "var(--canon-bg-surface)", border: "1px solid var(--canon-border)" }}><h3>Repair the weak spots</h3><p>Check underused rollouts, missing baselines, and cases whose source plan lacks a clear result.</p><button type="button" onClick={onGoToAi}>Review tools and cases</button></article>
          <article style={{ padding: 20, background: "var(--canon-bg-surface)", border: "1px solid var(--canon-border)" }}><h3>Consider a stop decision</h3><p>Pause expansion where evidence is missing; decide to stop only after the owner and Finance review costs, usage, and alternatives.</p><button type="button" onClick={onGoToActions}>Review the proof queue</button></article>
        </div>
        <div style={{ background: "var(--canon-bg-surface)", border: "1px solid var(--canon-border)", padding: "20px 24px" }}>
          <h3 style={{ margin: "0 0 10px" }}>Largest proposed case funding to examine</h3>
          {topCases.map((item) => (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "minmax(200px, 1fr) 120px minmax(130px, 1fr)", gap: 16, borderTop: "1px solid var(--canon-border)", padding: "12px 0" }}>
              <span>{item.name}{item.vendor ? ` · ${item.vendor}` : ""}</span>
              <strong>{item.sourcePlan?.fundingUsd == null ? "Not stated" : formatUsdM(item.sourcePlan.fundingUsd)}</strong>
              <span>Finance stage in synthetic source: {item.financeStatus?.replaceAll("_", " ") ?? "Not stated"}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--canon-gray-500)" }}>
          Proposed funding is case-level and may overlap project spend. No proposed funding, project spend, tool bill, or projected benefit is added into an approved portfolio total here.
        </p>
      </section>
    );
  }
  const s = view.summary;
  const claims = valueClaimCount(view);
  const missingActualClaims = Math.max(0, claims - s.outcomeMeasuredClaimCount);
  const missingFinanceClaims = Math.max(0, claims - s.financeAttestedClaimCount);
  const executiveMetrics = metrics(view);
  const executiveDecisions = decisions(view);

  return (
    <div className={styles.executiveView}>
      <header className={styles.executiveHero}>
        <div className={styles.executiveEyebrow}>
          IT Investment Tower · Today&apos;s verdict
        </div>
        <h1>{executiveHeadline(view)}</h1>
        <div className={styles.executiveSummaryGrid}>
          <p>{executiveSummary(view)}</p>
          <aside className={styles.executiveAudit}>
            <div>{commandFreshnessLine(view)}</div>
            <div>Intake lineage status not loaded · verify before quoting</div>
            <div>{s.sourceStandard}</div>
            <div>
              {s.sourceFiles.slice(0, 4).join(" · ") || "No source files"}
            </div>
            <div className={styles.auditBadges}>
              <span className={styles.auditRed}>
                {formatCount(conflictCount(view))} conflicts in this Tower projection · intake reconciliation not assessed
              </span>
              <span className={styles.auditAmber}>
                {formatCount(view.unknownSlots.length)} Tower details not available
              </span>
              <span className={styles.auditAmber}>
                {formatCount(view.pipelineGaps.length)} records need source details or proof
              </span>
              <span>
                {s.refreshTimestamp
                  ? "build recorded"
                  : "build date not recorded"}
              </span>
            </div>
          </aside>
        </div>

        <section className={styles.executiveMetrics}>
          {executiveMetrics.map((metric) => (
            <article
              key={metric.label}
              className={cx(
                styles.executiveMetric,
                styles[`metric${metric.tone}`],
              )}
            >
              <div className={styles.metricLabel}>
                {metric.label}
                {metric.badge ? <span>{metric.badge}</span> : null}
              </div>
              <div className={styles.metricValue}>{metric.value}</div>
              <div className={styles.metricNote}>{metric.note}</div>
            </article>
          ))}
        </section>
      </header>

      <section className={styles.reviewDecisions}>
        <div className={styles.sectionTitle}>
          <h2>Decisions for this review</h2>
          <span>{executiveDecisions.length}</span>
          <p>Each is a precondition for the next</p>
        </div>
        <div className={styles.decisionStack}>
          {executiveDecisions.length > 0 ? (
            executiveDecisions.map((decision) => (
            <article
              key={decision.order}
              className={cx(
                styles.executiveDecision,
                styles[`decision${decision.tone}`],
              )}
            >
              <div className={styles.decisionOrder}>{decision.order}</div>
              <div className={styles.decisionMain}>
                <div className={styles.decisionKicker}>{decision.kicker}</div>
                <h3>{decision.title}</h3>
                <p>{decision.detail}</p>
              </div>
              <div className={styles.decisionMeta}>
                <div>
                  <span>{decision.metricLabel}</span>
                  <strong>{decision.metricValue}</strong>
                </div>
                <div>
                  <span>Suggested sequence</span>
                  <strong>{decision.suggestedSequence}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (decision.reviewTarget === "ai") onGoToAi();
                    else if (decision.reviewTarget === "actions")
                      onGoToActions();
                    else onGoToFunnel();
                  }}
                >
                  Review →
                </button>
              </div>
            </article>
            ))
          ) : (
            <div className={styles.emptyPanel}>
              <h2>No review decisions loaded</h2>
              <p>
                No benefit claims are loaded, so Tower cannot create claim-proof
                work or mark usage evidence complete.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className={styles.valueLoss}>
        <div className={styles.sectionTitle}>
          <h2>Value by evidence state</h2>
          <p>Distinct measures and periods; use the claim ledger for record detail</p>
        </div>
        <div className={styles.valueChartCard}>
          <div className={styles.executiveWaterfall}>
            <ValueEvidenceGroups view={view} />
          </div>
          <div className={styles.valueChartLegend}>
            {claims > 0
              ? `The yearly benefit is a plan. Finance-reviewed and cleared amounts cover the loaded months. These amounts describe different stages; do not add them together or use them to calculate a success rate.`
              : "No benefit claims are loaded, so Tower cannot assess the value evidence states yet."}
          </div>
        </div>
      </section>

      <section className={styles.executiveFindings}>
        <article className={styles.findingRed}>
          <div className={styles.findingKicker}>Outcome evidence gap</div>
          <strong>{claims > 0 ? `${formatCount(missingActualClaims)} of ${formatCount(claims)}` : "Not loaded"}</strong>
          <p>
            {claims > 0
              ? "benefit claims have no measured result. A tool being used does not by itself prove a dollar benefit."
              : "No benefit claims are loaded yet, so Tower cannot tell which results have been proven."}
          </p>
        </article>
        <article className={styles.findingTeal}>
          <div className={styles.findingKicker}>
            Finance review gap
          </div>
          <strong>{claims > 0 ? `${formatCount(missingFinanceClaims)} of ${formatCount(claims)}` : "Not loaded"}</strong>
          <p>
            {claims > 0
              ? `claims have no Finance sign-off recorded. Check which claim types need one before adding them to a board figure. ${clearedValueSentence(view)}`
              : "No benefit claims are loaded for Finance review."}
          </p>
        </article>
      </section>

      <section className={styles.executiveLinks}>
        <span>Detail lives where it belongs:</span>
        <button type="button" onClick={onGoToFunnel}>
          {claims > 0
            ? `${formatCount(claims)} benefit claims and the gate that holds them →`
            : "Benefit claims not loaded →"}
        </button>
        <button type="button" onClick={onGoToAi}>
          {formatCount(view.allInitiatives.filter(isBusinessCase).length)} AI use cases + {formatCount(aiToolRolloutCount(view))} tool rollouts by cost, risk and adoption →
        </button>
        <button type="button" onClick={onGoToActions}>
          {evidenceFooterCount(view) > 0
            ? `${formatCount(evidenceFooterCount(view))} recorded evidence actions →`
            : "Evidence actions not loaded →"}
        </button>
      </section>

      {evidenceQueue(view.gaps).length > 0 ? (
        <section
          className={styles.executiveEvidenceTail}
          aria-label="Top evidence queue"
        >
          {evidenceQueue(view.gaps).map((gap) => (
            <button
              key={gap.id}
              type="button"
              onClick={() => onOpenGap(gap.id)}
            >
              <span>{gap.missing}</span>
              <strong>{evidenceGapAmount(gap).value === "Not loaded" ? "Amount not loaded" : evidenceGapAmount(gap).value}</strong>
              {evidenceGapAmount(gap).value === "Not loaded" ? null : <small>{evidenceGapAmount(gap).label}</small>}
              <small>{gap.owner ?? "No owner"}</small>
            </button>
          ))}
        </section>
      ) : (
        <div className={styles.emptyPanel}>
          No evidence queue is loaded. Tower cannot treat an empty queue as proof that every claim is ready.
        </div>
      )}

      <footer className={styles.executiveFoot}>
        {view.summary.tenantName} · tool use, Finance review, and permission to report a benefit are separate steps
      </footer>
    </div>
  );
}

/** Re-exported so the tab bar can badge the same condition the verdict shows. */
export function commandCenterAttention(view: TowerCommandCenterView): boolean {
  return view.summary.claimableUsd <= 0 && view.summary.promisedUsd > 0;
}
