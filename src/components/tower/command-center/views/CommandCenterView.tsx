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
    return `Tower projection: ${formatLoadedUsdM(
      s.approvedInvestmentUsd,
    )} approved. Board-claimable not loaded. No value claims loaded.`;
  }

  return `Tower projection: ${formatLoadedUsdM(s.approvedInvestmentUsd)} approved. ${formatUsdM(
    s.claimableUsd,
  )} board-claimable YTD. ${formatCount(openClaimCount(view))} of ${formatCount(
    claims,
  )} claims still need proof.`;
}

function executiveSummary(view: TowerCommandCenterView): string {
  const s = view.summary;
  const claims = valueClaimCount(view);
  if (claims <= 0) {
    return `${view.summary.tenantName} has ${formatLoadedUsdM(
      s.approvedInvestmentUsd,
    )} in the reviewed project portfolio, including ${formatUsdM(
      s.aiAttributedInitiativeSpendUsd,
    )} tied to AI initiatives and tool rollouts. No value claims are loaded yet, so Tower cannot prove or disprove business-case value.`;
  }

  return `${view.summary.tenantName} has ${formatLoadedUsdM(
    s.approvedInvestmentUsd,
  )} in the reviewed project portfolio, including ${formatUsdM(
    s.aiAttributedInitiativeSpendUsd,
  )} tied to AI initiatives and tool rollouts. Business cases project ${formatUsdM(
    s.promisedUsd,
  )} of annual value; ${formatUsdM(
    s.claimableUsd,
  )} is board-claimable year to date, and ${formatCount(
    Math.max(0, claims - s.claimableClaimCount),
  )} claims still need usage, outcome, or Finance proof.`;
}

function metrics(view: TowerCommandCenterView): ExecutiveMetric[] {
  const s = view.summary;
  const claims = valueClaimCount(view);
  const emitting = view.ai.filter(
    (item) => item.usageHeadline || item.usageBars.some((bar) => bar.pct > 0),
  ).length;
  return [
    {
      label: "Approved IT project portfolio",
      value: formatLoadedUsdM(s.approvedInvestmentUsd),
      // The count of subjects, not the board-scope count and not however many rows loaded.
      // The view model already resolves absence; a second fallback here silently swapped in a
      // different metric whenever the first was zero.
      note: `${formatCount(s.totalProgramSubjectCount)} projects · approved capital only`,
      tone: "teal",
    },
    {
      label: "Asserted benefit",
      badge:
        claims <= 0 ? "NOT LOADED" : s.claimableUsd > 0 ? "PARTIAL" : "UNPROVEN",
      value: claims <= 0 ? "Not loaded" : formatUsdM(s.promisedUsd),
      note:
        claims <= 0
          ? "No value claims loaded; no asserted benefit population."
          : `${formatCount(claims)} claims · planning values, not outcomes`,
      tone: claims <= 0 ? "gray" : "amber",
    },
    {
      label: "Board-claimable",
      badge: claims <= 0 ? "NOT LOADED" : s.claimableUsd > 0 ? "OPEN" : "BLOCKED",
      value: claims <= 0 ? "Not loaded" : formatUsdM(s.claimableUsd),
      note:
        claims <= 0
          ? "No value claims loaded for Finance attestation."
          : `${formatCount(s.financeAttestedClaimCount)} of ${formatCount(
              claims,
            )} claims attested by Finance`,
      tone: claims <= 0 ? "gray" : s.claimableUsd > 0 ? "teal" : "red",
    },
    {
      label: "AI initiatives and tools tracked",
      badge: emitting > 0 ? "VISIBLE" : "DARK",
      value: `${formatCount(s.aiInitiativeCount)}`,
      note: `${formatCount(view.programs.length)} AI business cases + ${formatCount(
        aiToolRolloutCount(view),
      )} tool rollouts · ${formatUsdM(
        s.aiAttributedInitiativeSpendUsd,
      )} attributed`,
      tone: emitting > 0 ? "teal" : "red",
    },
    {
      label: "Usage evidence mapped",
      badge:
        claims <= 0
          ? "NOT LOADED"
          : s.usageSupportedClaimCount === claims
            ? "COMPLETE"
            : "PARTIAL",
      value:
        claims <= 0
          ? "Not loaded"
          : `${formatCount(s.usageSupportedClaimCount)} of ${formatCount(
              claims,
            )}`,
      note:
        claims <= 0
          ? "No value claims loaded; usage support cannot be assessed."
          : s.usageSupportedClaimCount === claims
          ? "Every value claim has usage-to-value support"
          : `${formatCount(
              Math.max(0, claims - s.usageSupportedClaimCount),
            )} claims still need usage-to-value mapping`,
      tone: claims <= 0 ? "gray" : s.usageSupportedClaimCount > 0 ? "amber" : "red",
    },
  ];
}

function decisions(view: TowerCommandCenterView): ExecutiveDecision[] {
  const s = view.summary;
  const claims = valueClaimCount(view);
  if (claims <= 0) return [];

  const claimsMissingUsage = Math.max(0, claims - s.usageSupportedClaimCount);
  const claimsMissingActual = Math.max(0, claims - s.outcomeMeasuredClaimCount);
  const claimsMissingFinance = Math.max(0, claims - s.financeAttestedClaimCount);

  return [
    {
      order: "1",
      kicker: "Map · do this first",
      title:
        claimsMissingUsage > 0
          ? `Close usage-to-value gaps on ${formatCount(claimsMissingUsage)} claims`
          : "Keep usage mapped as actuals refresh",
      detail:
        claimsMissingUsage > 0
          ? `${formatCount(s.usageSupportedClaimCount)} of ${formatCount(
              claims,
            )} claims have usage support. The remaining claims need tool, workflow, or adoption evidence before the value can advance.`
          : "Usage-to-value support is loaded for the current claim set. Keep it current as monthly actuals are refreshed.",
      metricLabel: "Usage-supported claims",
      metricValue: `${formatCount(s.usageSupportedClaimCount)}/${formatCount(
        claims,
      )}`,
      due: "Next review",
      tone: "red",
      reviewTarget: "ai",
    },
    {
      order: "2",
      kicker: "Measure · then this",
      title: `Backfill measured outcome on the ${formatCount(
        claimsMissingActual,
      )} claims that carry no actual`,
      detail:
        "Measured outcomes create something a validator can sign. Until then, planning value remains planning value.",
      metricLabel: "Claims short",
      metricValue: formatCount(claimsMissingActual),
      due: "Next month",
      tone: "amber",
      reviewTarget: "funnel",
    },
    {
      order: "3",
      kicker: "Assign · only then",
      title: `Finance-attest the ${formatCount(claimsMissingFinance)} claims still outside the board number`,
      detail: `${formatCount(s.financeAttestedClaimCount)} of ${formatCount(claims)} claims carry Finance attestation. ${formatUsdM(s.claimableUsd)} is board-claimable year to date; usage support alone does not establish a measured financial outcome.`,
      metricLabel: "Finance-attested claims",
      metricValue: `${formatCount(s.financeAttestedClaimCount)}/${formatCount(claims)}`,
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
    .sort((a, b) => (b.valueAtStakeUsd ?? 0) - (a.valueAtStakeUsd ?? 0))
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
      note: "The annual assertion is a plan. Usage-linked claim value shows adoption support, not a measured financial outcome; its reporting period is not recorded here.",
      rows: [
        ["Asserted annual benefit", formatUsdM(s.promisedUsd)],
        ["Usage-linked claim value", formatUsdM(s.usageSupportedUsd)],
      ],
    },
    {
      heading: "Finance review · year to date",
      note: "Finance-validated value can still be blocked. Board-claimable is the amount that has cleared the claim gate.",
      rows: [
        ["Finance validated YTD", formatUsdM(s.financeValidatedUsd)],
        ["Board claimable YTD", formatUsdM(s.claimableUsd)],
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
              ? `Annual asserted benefit and usage-linked claim value are planning measures. Finance-validated and board-claimable amounts are year to date. These bars are separate states, not an additive waterfall or a conversion rate.`
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
              ? "claims have no outcome-measured flag in the governed Tower read. Their monetary amount cannot be inferred from usage support."
              : "No asserted-benefit population is loaded yet. Tower cannot mark value as proven or unproven without claims."}
          </p>
        </article>
        <article className={styles.findingTeal}>
          <div className={styles.findingKicker}>
            Finance attestation gap
          </div>
          <strong>{claims > 0 ? `${formatCount(missingFinanceClaims)} of ${formatCount(claims)}` : "Not loaded"}</strong>
          <p>
            {claims > 0
              ? `claims remain outside Finance attestation. ${formatUsdM(s.claimableUsd)} is board-claimable year to date; there is no defensible portfolio ceiling in this projection.`
              : "No Finance-attestation population is loaded because no value claims are loaded."}
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
              <strong>
                {gap.valueAtStakeUsd === null
                  ? "Unknown"
                  : formatUsdM(gap.valueAtStakeUsd)}
              </strong>
              <small>{gap.owner ?? "No owner"}</small>
            </button>
          ))}
        </section>
      ) : null}

      <footer className={styles.executiveFoot}>
        {view.summary.tenantName} · adoption, finance validation and claimable
        value are separate gates
      </footer>
    </div>
  );
}

/** Re-exported so the tab bar can badge the same condition the verdict shows. */
export function commandCenterAttention(view: TowerCommandCenterView): boolean {
  return view.summary.claimableUsd <= 0 && view.summary.promisedUsd > 0;
}
