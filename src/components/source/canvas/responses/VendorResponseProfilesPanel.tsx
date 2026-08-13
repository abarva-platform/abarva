"use client";

import type { CSSProperties } from "react";
import type { VendorResponseProfileSet } from "@/lib/source/proposal-intelligence";
import { CANVAS } from "../canvas-tokens";

function money(value: number | null): string {
  if (value === null) return "Not provided";
  return `$${(value / 1_000_000).toFixed(1)}M`;
}

function readinessTone(status: "yes" | "no" | "conditional"): CSSProperties {
  if (status === "yes") return GOOD;
  if (status === "no") return BAD;
  return WARN;
}

export function VendorResponseProfilesPanel({
  profileSet,
}: {
  profileSet?: VendorResponseProfileSet | null;
}) {
  const profiles = profileSet?.profiles ?? [];
  if (profiles.length === 0) return null;

  return (
    <section
      data-testid="source-vendor-response-mve-profiles"
      style={CARD}
      aria-label="Vendor Response Profiles"
    >
      <div style={HEADER}>
        <div>
          <div style={EYEBROW}>Minimum viable extraction</div>
          <h3 style={TITLE}>Vendor Response Profiles</h3>
          <p style={COPY}>
            Long response packages are reduced to sourcing-critical records:
            completeness, pricing, claims, evidence, commitments, exceptions,
            and evaluation readiness.
          </p>
        </div>
        <div style={COUNT_BADGE}>
          {profileSet?.profileCount ?? profiles.length} profiles
        </div>
      </div>

      <div style={PROFILE_GRID}>
        {profiles.map((profile) => (
          <article key={profile.vendorId} style={PROFILE_CARD}>
            <div style={PROFILE_HEAD}>
              <div>
                <h4 style={PROFILE_TITLE}>{profile.vendorName}</h4>
                <p style={PROFILE_SUMMARY}>{profile.packageSummary}</p>
              </div>
              <span
                style={{
                  ...PILL,
                  ...readinessTone(profile.readyForEvaluation),
                }}
              >
                {profile.readyForEvaluation === "yes"
                  ? "ready"
                  : profile.readyForEvaluation}
              </span>
            </div>

            <div style={METRIC_GRID}>
              <Metric
                label="Sections"
                value={`${profile.responseCompleteness.completeSections}/${profile.responseCompleteness.totalSections}`}
              />
              <Metric
                label="Completeness"
                value={`${profile.responseCompleteness.percent}%`}
              />
              <Metric
                label="5-year TCO"
                value={money(profile.pricingSummary.fiveYearTcoUsd)}
              />
              <Metric
                label="Transition"
                value={money(profile.pricingSummary.transitionCostUsd)}
              />
            </div>

            <dl style={FACT_LIST}>
              <Fact
                label="Productivity"
                value={profile.productivityCommitment}
              />
              <Fact label="SLA" value={profile.slaCommitments} />
              <Fact label="Staffing" value={profile.staffingModelSummary} />
              <Fact label="Transition" value={profile.transitionCommitments} />
            </dl>

            <div style={ISSUE_GRID}>
              <IssueList
                title="Unsupported claims"
                items={profile.unsupportedClaims}
              />
              <IssueList
                title="Clarifications"
                items={profile.clarificationQuestions}
              />
            </div>

            <div style={EVIDENCE_STRIP}>
              <span>{profile.narrativePageEquivalent}</span>
              <span>{profile.exhibits.length} exhibits checked</span>
              <span>{profile.extractionCards.length} extraction cards</span>
              <span>Synthetic demo evidence</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={METRIC}>
      <span style={METRIC_LABEL}>{label}</span>
      <strong style={METRIC_VALUE}>{value}</strong>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={FACT_ROW}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function IssueList({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={ISSUE_BOX}>
      <div style={ISSUE_TITLE}>{title}</div>
      {items.length > 0 ? (
        <ul style={ISSUE_LIST}>
          {items.slice(0, 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p style={ISSUE_EMPTY}>None flagged in the minimum profile.</p>
      )}
    </div>
  );
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
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
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
  lineHeight: 1.1,
  color: CANVAS.INK,
};

const COPY: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
  maxWidth: 760,
};

const COUNT_BADGE: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 999,
  padding: "5px 10px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  whiteSpace: "nowrap",
};

const PROFILE_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 12,
};

const PROFILE_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 13,
  display: "grid",
  gap: 12,
};

const PROFILE_HEAD: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 10,
  alignItems: "start",
};

const PROFILE_TITLE: CSSProperties = {
  margin: 0,
  color: CANVAS.INK,
  fontSize: 15,
  lineHeight: 1.25,
};

const PROFILE_SUMMARY: CSSProperties = {
  margin: "5px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const PILL: CSSProperties = {
  border: "1px solid",
  borderRadius: 999,
  padding: "3px 8px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 800,
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

const METRIC_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 7,
};

// The label inherited the card's body font size, so "Completeness" and
// "5-year TCO" were wider than their 1fr column and spilled over the
// neighbouring tile. Matching the metric size used by the file-readiness panel
// keeps the label inside its tile; overflowWrap is the backstop for any label
// long enough to exceed the column on a narrow viewport.
const METRIC: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  padding: "7px 8px",
  display: "grid",
  gap: 2,
  minWidth: 0,
  fontSize: CANVAS.T_MICRO_SMALL,
  overflowWrap: "anywhere",
};

const METRIC_LABEL: CSSProperties = {
  color: CANVAS.INK_MUTED,
  lineHeight: 1.3,
};

const METRIC_VALUE: CSSProperties = {
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.25,
};

const FACT_LIST: CSSProperties = {
  margin: 0,
  display: "grid",
  gap: 7,
};

const FACT_ROW: CSSProperties = {
  display: "grid",
  gap: 2,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const ISSUE_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const ISSUE_BOX: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  padding: 9,
  background: "rgba(255,255,255,0.45)",
};

const ISSUE_TITLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  fontWeight: 800,
};

const ISSUE_LIST: CSSProperties = {
  margin: "6px 0 0",
  paddingLeft: 16,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const ISSUE_EMPTY: CSSProperties = {
  margin: "6px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const EVIDENCE_STRIP: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 7,
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  paddingTop: 9,
  color: CANVAS.INK_MUTED,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.04em",
};
