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
import { approvedAiCaseFunding, isToolRollout } from "./portfolio-kind";
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
  due: string;
  tone: "red" | "amber" | "gray";
  reviewTarget: "funnel" | "ai" | "actions";
}

function formatLoadedUsdM(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "not loaded"
    : formatUsdM(value);
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
  return Math.max(0, view.allInitiatives.length - view.programs.length);
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

function absentCount(view: TowerCommandCenterView): number {
  return view.unknownSlots.length + view.pipelineGaps.length;
}

function executiveHeadline(view: TowerCommandCenterView): string {
  const s = view.summary;
  const claims = valueClaimCount(view);
  if (claims <= 0) {
    return `Tower view: ${formatLoadedUsdM(
      s.approvedInvestmentUsd,
    )} in approved project funding. Value cleared for reporting is not loaded. No value records are loaded.`;
  }

  return `Tower view: ${formatLoadedUsdM(s.approvedInvestmentUsd)} in approved project funding. ${formatUsdM(
    s.claimableUsd,
  )} cleared for reporting in the loaded months. ${formatCount(openClaimCount(view))} of ${formatCount(
    claims,
  )} value records do not show an amount cleared for reporting.`;
}

function executiveSummary(view: TowerCommandCenterView): string {
  const s = view.summary;
  const claims = valueClaimCount(view);
  const caseFunding = approvedAiCaseFunding(view.allInitiatives);
  const fundingSentence = caseFunding === null
    ? "The approved AI case funding amount is not fully loaded."
    : `This includes ${formatUsdM(caseFunding)} in approved funding for AI business cases.`;
  if (claims <= 0) {
    return `${view.summary.tenantName} has ${formatLoadedUsdM(
      s.approvedInvestmentUsd,
    )} in the reviewed project portfolio. ${fundingSentence}${toolCostGap(view)} No value records are loaded yet, so Tower cannot assess their value.`;
  }

  return `${view.summary.tenantName} has ${formatLoadedUsdM(
    s.approvedInvestmentUsd,
  )} in the reviewed project portfolio. ${fundingSentence}${toolCostGap(view)} The loaded claims project ${formatUsdM(
    s.promisedUsd,
  )} in yearly benefit; ${formatUsdM(
    s.claimableUsd,
  )} cleared the reporting gate in the loaded months, and ${formatCount(
    Math.max(0, claims - s.claimableClaimCount),
  )} value records do not show an amount cleared for reporting. Each type needs its own evidence review.`;
}

function metrics(view: TowerCommandCenterView): ExecutiveMetric[] {
  const s = view.summary;
  const claims = valueClaimCount(view);
  const caseFunding = approvedAiCaseFunding(view.allInitiatives);
  const emitting = view.ai.filter(
    (item) => item.usageHeadline || item.usageBars.some((bar) => bar.pct > 0),
  ).length;
  return [
    {
      label: "Approved project funding",
      value: formatLoadedUsdM(s.approvedInvestmentUsd),
      // The count of subjects, not the board-scope count and not however many rows loaded.
      // The view model already resolves absence; a second fallback here silently swapped in a
      // different metric whenever the first was zero.
      note: `${formatCount(s.totalProgramSubjectCount)} projects · approved budgets, not actual spending`,
      tone: "teal",
    },
    {
      label: "Projected yearly benefit",
      badge:
        claims <= 0 ? "NOT LOADED" : s.claimableUsd > 0 ? "PARTIAL" : "UNPROVEN",
      value: claims <= 0 ? "Not loaded" : formatUsdM(s.promisedUsd),
      note:
        claims <= 0
          ? "No value records are loaded, so there is no yearly estimate to show."
          : "A planning estimate, not proven savings; the claim list can contain different kinds of opportunities",
      tone: claims <= 0 ? "gray" : "amber",
    },
    {
      label: "Cleared in loaded months",
      badge: claims <= 0 ? "NOT LOADED" : s.claimableUsd > 0 ? "OPEN" : "BLOCKED",
      value: claims <= 0 ? "Not loaded" : formatUsdM(s.claimableUsd),
      note:
        claims <= 0
          ? "No value records are loaded for Finance review."
          : `${formatCount(s.financeAttestedClaimCount)} of ${formatCount(
              claims,
            )} value records have Finance sign-off`,
      tone: claims <= 0 ? "gray" : s.claimableUsd > 0 ? "teal" : "red",
    },
    {
      label: "AI initiatives and tools tracked",
      badge: emitting > 0 ? "VISIBLE" : "DARK",
      value: `${formatCount(s.aiInitiativeCount)}`,
      note: `${formatCount(view.programs.length)} AI business cases + ${formatCount(
        aiToolRolloutCount(view),
      )} tool rollouts · ${caseFunding === null ? "AI case funding incomplete" : `${formatUsdM(caseFunding)} approved AI case funding`}`,
      tone: emitting > 0 ? "teal" : "red",
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
          ? "No value claims loaded; usage evidence cannot be assessed."
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
      due: "Next review",
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
      due: "Next month",
      tone: "amber",
      reviewTarget: "funnel",
    },
    {
      order: "3",
      kicker: "Assign · only then",
      title: "Review which financial claims need Finance sign-off",
      detail: `${formatCount(claimsMissingFinance)} value records have no Finance sign-off recorded. Check which types require it before reporting a dollar benefit. ${s.valueClaimCount > 0 ? `${formatUsdM(s.claimableUsd)} has cleared reporting in the loaded months.` : "No cleared amount is loaded."}`,
      metricLabel: "Finance sign-offs recorded",
      metricValue: formatCount(s.financeAttestedClaimCount),
      due: "Following review",
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
        ["Projected yearly benefit", formatUsdM(s.promisedUsd)],
        ["Usage-linked claim value", usageValueLabel(s)],
      ],
    },
    {
      heading: "Finance review · loaded months",
      note: "Finance may validate a claim that is still blocked from board reporting. Only the cleared amount has passed every required gate.",
      rows: [
        ["Finance validated", formatUsdM(s.financeValidatedUsd)],
        ["Cleared for reporting", formatUsdM(s.claimableUsd)],
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
                {formatCount(conflictCount(view))} Tower projection conflicts
              </span>
              <span className={styles.auditAmber}>
                {formatCount(absentCount(view))} Tower projection gaps
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
                  <span>Due</span>
                  <strong>{decision.due}</strong>
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
                No value claims are loaded, so Tower cannot create claim-proof
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
              : "No value claims are loaded, so Tower cannot assess the value evidence states yet."}
          </div>
        </div>
      </section>

      <section className={styles.executiveFindings}>
        <article className={styles.findingRed}>
          <div className={styles.findingKicker}>Outcome evidence gap</div>
          <strong>{claims > 0 ? `${formatCount(missingActualClaims)} of ${formatCount(claims)}` : "Not loaded"}</strong>
          <p>
            {claims > 0
              ? "value records have no measured result. A tool being used does not by itself prove a dollar benefit."
              : "No value records are loaded yet, so Tower cannot tell which results have been proven."}
          </p>
        </article>
        <article className={styles.findingTeal}>
          <div className={styles.findingKicker}>
            Finance review gap
          </div>
          <strong>{claims > 0 ? `${formatCount(missingFinanceClaims)} of ${formatCount(claims)}` : "Not loaded"}</strong>
          <p>
            {claims > 0
              ? `claims have no Finance sign-off recorded. Check which claim types need one before adding them to a board figure. ${formatUsdM(s.claimableUsd)} has cleared the reporting gate in the loaded months.`
              : "No value records are loaded for Finance review."}
          </p>
        </article>
      </section>

      <section className={styles.executiveLinks}>
        <span>Detail lives where it belongs:</span>
        <button type="button" onClick={onGoToFunnel}>
          {claims > 0
            ? `${formatCount(claims)} value claims and the gate that holds them →`
            : "Value claims not loaded →"}
        </button>
        <button type="button" onClick={onGoToAi}>
          {formatCount(s.aiInitiativeCount)} AI initiatives
          and tool rollouts by cost, risk and adoption →
        </button>
        <button type="button" onClick={onGoToActions}>
          {formatCount(evidenceFooterCount(view))} open evidence actions →
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
              <strong>{evidenceGapAmount(gap).value}</strong>
              <small>{evidenceGapAmount(gap).label}</small>
              <small>{gap.owner ?? "No owner"}</small>
            </button>
          ))}
        </section>
      ) : null}

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
