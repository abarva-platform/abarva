"use client";

import type { CSSProperties, ReactNode } from "react";
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from "@/lib/source/canvas-substrate";
import { buildSourceExecutiveDecisionSummary } from "@/lib/source/executive-decision-summary";
import { formatSourceFinancialValue } from "@/lib/source/financial-display";
import { buildSourcePricingNormalization } from "@/lib/source/pricing-normalization";
import type { SourceStageKey } from "@/lib/source/types";
import { CANVAS } from "../canvas-tokens";
import type { ActivityEntry } from "../workspace-tabs/LogTab";
import { ExecutiveSummaryHeader } from "./ExecutiveSummaryHeader";

export function ExecutiveDecisionStageView({
  event,
  artifacts,
  criteria,
  evidence,
  activityEntries,
  documentWorkspace,
}: {
  event: {
    id: string;
    name: string;
    owner: string;
    currentStageKey?: SourceStageKey;
    valueAtStakeUsd?: number;
  };
  artifacts: SourceEventArtifactState[];
  criteria: SourceEventGateCriterion[];
  evidence: SourceEventEvidence[];
  activityEntries: ActivityEntry[];
  documentWorkspace: ReactNode;
}) {
  const decisionBrief = artifacts.find(
    (artifact) => artifact.artifactCode === "d24_decision_brief",
  );
  const hasAuthoredRecommendation = Boolean(decisionBrief?.body?.trim());

  if (!hasAuthoredRecommendation) {
    return (
      <div data-testid="source-executive-decision-stage-view" style={WRAP}>
        <section
          data-testid="source-executive-decision-next-move"
          style={NEXT_CARD}
        >
          <div>
            <div style={EYEBROW}>Stage 8 · Executive Decision</div>
            <h2 style={TITLE}>Draft the decision brief</h2>
            <p style={COPY}>
              The executive summary stays hidden until the decision brief has a
              client-authored recommendation. Source will not export a blank
              board answer or imply approval before a human owns the decision.
            </p>
          </div>
          <div style={ACTION_BOX}>
            <strong>Required before selection</strong>
            <span>
              Recommendation, value case, risks, dissent, and approval evidence
              must be recorded before this stage can advance.
            </span>
          </div>
        </section>
        <div data-testid="source-executive-decision-document-workspace">
          {documentWorkspace}
        </div>
      </div>
    );
  }

  const page = buildExecutiveDecisionPage({
    event,
    criteria,
    evidence,
    activityEntries,
  });

  return (
    <div data-testid="source-executive-decision-stage-view" style={WRAP}>
      <ExecutiveSummaryHeader {...page.header} eventName={event.name} />

      <section data-testid="source-executive-decision-missing-data" style={GAP_CARD}>
        <div style={EYEBROW}>Decision input quality</div>
        <h3 style={SMALL_TITLE}>{page.missingData.title}</h3>
        <p style={COPY}>{page.missingData.body}</p>
      </section>

      <div style={DETAIL_GRID}>
        <section style={DETAIL_CARD}>
          <div style={EYEBROW}>Why this recommendation</div>
          <h3 style={SMALL_TITLE}>Three findings carried the decision</h3>
          <div style={STACK}>
            {page.evidenceFindings.map((finding) => (
              <div key={finding.id} style={EVIDENCE_ROW}>
                <span style={CITATION}>{finding.id}</span>
                <span>
                  <strong>{finding.title}:</strong> {finding.body}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section style={DETAIL_CARD}>
          <div style={EYEBROW}>Risks on the recommendation</div>
          <h3 style={SMALL_TITLE}>Named, owned, and decision-visible</h3>
          <div style={STACK}>
            {page.risks.map((risk) => (
              <div key={risk.title} style={RISK_ROW}>
                <span
                  aria-hidden="true"
                  style={{
                    ...RISK_DOT,
                    background:
                      risk.level === "high"
                        ? CANVAS.BLOCKED
                        : risk.level === "medium"
                          ? CANVAS.WAITING
                          : CANVAS.ACTIVE,
                  }}
                />
                <span>
                  <strong>{risk.title}.</strong> {risk.mitigation}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section id="dissent" data-testid="source-executive-decision-dissent" style={DETAIL_CARD}>
        <div style={EYEBROW}>Recorded dissent · first-class</div>
        <h3 style={SMALL_TITLE}>{page.dissent.title}</h3>
        <p style={QUOTE}>{page.dissent.body}</p>
        <p style={COPY}>{page.dissent.provenance}</p>
      </section>

      <section data-testid="source-executive-decision-approval-record" style={DETAIL_CARD}>
        <div style={EYEBROW}>Approval record</div>
        <h3 style={SMALL_TITLE}>Human approval required before award</h3>
        <p style={COPY}>
          AbarVa can draft the recommendation and route the decision package,
          but vendor award, external communication, and contract commitment
          require named client approval in the event log.
        </p>
      </section>

      <div data-testid="source-executive-decision-document-workspace">
        {documentWorkspace}
      </div>
    </div>
  );
}

function buildExecutiveDecisionPage({
  event,
  criteria,
  evidence,
  activityEntries,
}: {
  event: {
    id: string;
    name: string;
    owner: string;
    currentStageKey?: SourceStageKey;
    valueAtStakeUsd?: number;
  };
  criteria: SourceEventGateCriterion[];
  evidence: SourceEventEvidence[];
  activityEntries: ActivityEntry[];
}) {
  const executiveSummary = buildSourceExecutiveDecisionSummary({
    event: {
      id: event.id,
      name: event.name,
      currentStageKey: event.currentStageKey ?? "executive_decision",
      valueAtStakeUsd: event.valueAtStakeUsd,
    },
  });
  const pricing = buildSourcePricingNormalization({
    event: {
      id: event.id,
      name: event.name,
      currentStageKey: "pricing",
    },
  });
  const ranked = pricing.comparison.find((row) => row.comparable) ?? pricing.comparison[0];
  const winner =
    executiveSummary.vendorTradeoffs.find(
      (vendor) => vendor.vendorId === ranked?.vendorId,
    ) ?? executiveSummary.vendorTradeoffs[0];
  const runnerUpRank = pricing.comparison.find((row) => row.rank === 2);
  const winnerSnapshot = pricing.snapshots.find(
    (snapshot) => snapshot.vendorId === winner?.vendorId,
  );
  const runnerUpSnapshot = pricing.snapshots.find(
    (snapshot) => snapshot.vendorId === runnerUpRank?.vendorId,
  );
  const winnerTco = totalTco(winnerSnapshot);
  const runnerUpTco = totalTco(runnerUpSnapshot);
  const delta = runnerUpTco && winnerTco ? Math.abs(winnerTco - runnerUpTco) : 0;
  const baseline = event.valueAtStakeUsd ?? 35_000_000;
  const savings = winnerTco ? Math.max(0, baseline - winnerTco) : 0;
  const blockers = executiveSummary.blockers;
  const openCriteria = criteria.filter((criterion) => criterion.state !== "met");
  const usableEvidence = evidence.filter(
    (row) =>
      row.currentState === "Usable Evidence" ||
      row.currentState === "Available" ||
      row.currentState === "Parsed",
  );
  const signed = activityEntries.some((entry) =>
    /approv|sign/i.test(`${entry.actor ?? ""} ${entry.body}`),
  );

  return {
    header: {
      recommendation: {
        vendor: winner?.vendorName ?? ranked?.vendorName ?? "preferred vendor",
        tco: winnerTco ? `${formatMoney(winnerTco)} TCO` : "TCO pending",
        decidingAxis: "transition realism + evidence confidence",
        runnerUp: runnerUpRank?.vendorName,
        delta: delta ? formatMoney(delta) : undefined,
        whyNot:
          runnerUpSnapshot?.commercialTraps[0]?.signal ??
          "its evidence package is weaker on the decision criteria",
      },
      savings: {
        npv3yr: savings ? formatMoney(savings) : "Pending",
        baselineLabel: `3-yr vs locked ${formatMoney(baseline)} baseline`,
      },
      tradeoff: {
        gaveUp: delta ? `${formatMoney(delta)} cheaper bid` : "headline price certainty",
        gained: "transition rigor + evidence-backed pricing",
      },
      dissent: buildDissent(activityEntries),
      approval: {
        requiredSignoffs: [
          {
            name: event.owner || "Decision owner",
            role: "Executive sponsor",
            status: signed ? ("signed" as const) : ("pending" as const),
          },
          {
            name: "Named co-approver",
            role: "Finance or procurement co-sign",
            status: "pending" as const,
          },
        ],
      },
      riskCount: Math.max(blockers.length, openCriteria.length, 1),
    },
    missingData: {
      title:
        blockers.length > 0
          ? `${blockers.length} input${blockers.length === 1 ? "" : "s"} still open`
          : "No blocking input gap detected",
      body:
        blockers[0] ??
        `${usableEvidence.length} evidence item${usableEvidence.length === 1 ? "" : "s"} are available for the decision record.`,
    },
    evidenceFindings: buildEvidenceFindings({
      pricing,
      executiveSummary,
      usableEvidence,
    }),
    risks: buildRisks({
      blockers,
      openCriteria,
      executiveSummary,
    }),
    dissent: buildDissentPanel(activityEntries),
  };
}

function totalTco(snapshot: ReturnType<typeof buildSourcePricingNormalization>["snapshots"][number] | undefined): number {
  if (!snapshot) return 0;
  return (
    snapshot.costByYear.year1 +
    snapshot.costByYear.year2 +
    snapshot.costByYear.year3
  );
}

function formatMoney(value: number): string {
  return formatSourceFinancialValue(value, true);
}

function buildDissent(activityEntries: ActivityEntry[]) {
  const dissent = activityEntries.find((entry) =>
    /dissent|challenge|disagree/i.test(entry.body),
  );
  if (!dissent) return [];
  return [
    {
      reviewerName: dissent.actor ?? "Reviewer",
      reviewerRole: "Decision reviewer",
      oneLine: dissent.body,
    },
  ];
}

function buildDissentPanel(activityEntries: ActivityEntry[]) {
  const dissent = activityEntries.find((entry) =>
    /dissent|challenge|disagree/i.test(entry.body),
  );
  if (dissent) {
    return {
      title: "One reviewer disagreed",
      body: dissent.body,
      provenance: `Recorded in the event log${dissent.actor ? ` by ${dissent.actor}` : ""}.`,
    };
  }
  return {
    title: "No dissent recorded",
    body:
      "No dissent is present in the event log. Keep this section visible so a challenge view has a named home before approval.",
    provenance: "Dissent state is derived from the event activity log.",
  };
}

function buildEvidenceFindings({
  pricing,
  executiveSummary,
  usableEvidence,
}: {
  pricing: ReturnType<typeof buildSourcePricingNormalization>;
  executiveSummary: ReturnType<typeof buildSourceExecutiveDecisionSummary>;
  usableEvidence: SourceEventEvidence[];
}) {
  const top = pricing.comparison[0];
  const trap = pricing.topCommercialTraps[0];
  return [
    {
      id: "E-PRC",
      title: "Normalized TCO",
      body:
        top?.reason ??
        "Pricing normalization ranked the finalist set on comparable commercial inputs.",
    },
    {
      id: "E-RSK",
      title: "Risk posture",
      body:
        trap?.impact ??
        `Commercial risk is ${executiveSummary.commercialRisk}; transition risk is ${executiveSummary.transitionRisk}.`,
    },
    {
      id: "E-LOG",
      title: "Evidence coverage",
      body: `${usableEvidence.length} stage evidence item${usableEvidence.length === 1 ? "" : "s"} are loaded, and evidence confidence is ${executiveSummary.evidenceConfidence}.`,
    },
  ];
}

function buildRisks({
  blockers,
  openCriteria,
  executiveSummary,
}: {
  blockers: string[];
  openCriteria: SourceEventGateCriterion[];
  executiveSummary: ReturnType<typeof buildSourceExecutiveDecisionSummary>;
}) {
  const rows = [
    {
      title: blockers[0] ?? "Residual commercial caveat",
      mitigation:
        executiveSummary.decisionOptions[0] ??
        "Name an owner before approving the recommendation.",
      level: executiveSummary.commercialRisk,
    },
    {
      title:
        openCriteria[0]?.notes ??
        openCriteria[0]?.criterionId ??
        "Approval evidence capture",
      mitigation:
        "Close or explicitly waive the criterion before moving from executive decision to selection.",
      level: openCriteria.length > 0 ? ("medium" as const) : ("low" as const),
    },
    {
      title: "Human approval boundary",
      mitigation:
        "Award, vendor notice, and contract commitment stay blocked until a named client approver signs.",
      level: "low" as const,
    },
  ];
  return rows;
}

const WRAP: CSSProperties = {
  display: "grid",
  gap: 12,
};

const NEXT_CARD: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(250px, 370px)",
  gap: 14,
  alignItems: "stretch",
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 16,
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
  margin: "5px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 28,
  lineHeight: 1.05,
  color: CANVAS.INK,
  fontWeight: 400,
};

const SMALL_TITLE: CSSProperties = {
  margin: "5px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 21,
  lineHeight: 1.1,
  color: CANVAS.INK,
  fontWeight: 400,
};

const COPY: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
};

const ACTION_BOX: CSSProperties = {
  border: `1px solid ${CANVAS.WAITING}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(186,117,23,0.06)",
  padding: 12,
  display: "grid",
  gap: 5,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const GAP_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.WAITING}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(186,117,23,0.06)",
  padding: 14,
};

const DETAIL_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 12,
};

const DETAIL_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 14,
};

const STACK: CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 12,
};

const EVIDENCE_ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "64px minmax(0, 1fr)",
  gap: 10,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
};

const CITATION: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.08em",
  color: "#1d4ed8",
  fontWeight: 800,
};

const RISK_ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "10px minmax(0, 1fr)",
  gap: 10,
  alignItems: "baseline",
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
};

const RISK_DOT: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  marginTop: 5,
};

const QUOTE: CSSProperties = {
  margin: "10px 0 0",
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY,
  lineHeight: 1.55,
};
