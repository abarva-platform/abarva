"use client";

/**
 * Shared presentational primitives for Knowledge vNext. All are content-class /
 * availability-state aware and expose evidence one interaction away. Status is
 * always rendered with a word, never color alone.
 */

import type { ReactNode } from "react";
import type {
  AvailabilityState,
  ContentClass,
  EvidenceDescriptor,
  GovernedMetricValue,
} from "@/lib/knowledge/consumption-contracts";
import { availabilityHasDisplayableValue } from "@/lib/knowledge/consumption-contracts";
import { useShell } from "./state";

const CONTENT_CLASS_LABEL: Record<ContentClass, string> = {
  accepted_fact: "Accepted fact",
  leadership_perspective: "Leadership view",
  abarva_interpretation: "AbarVa view",
  industry_benchmark: "Benchmark",
  industry_pattern: "Pattern",
  candidate_insight: "Candidate",
  evidence_gap: "Gap",
  approved_target: "Approved target",
  proposed_target: "Proposed target",
};

const AVAILABILITY_LABEL: Record<AvailabilityState, string> = {
  available: "Available",
  not_loaded: "Not loaded",
  not_measured: "Not measured",
  withheld: "Withheld",
  conflicting: "Conflicting",
  stale: "Stale",
  candidate: "Candidate",
  accepted: "Accepted",
  superseded: "Superseded",
  not_applicable: "N/A",
};

export function ContentClassBadge({ contentClass }: { contentClass: ContentClass }) {
  return (
    <span className="kv-classbadge" data-c={contentClass}>
      {CONTENT_CLASS_LABEL[contentClass]}
    </span>
  );
}

export function AvailabilityPill({ state }: { state: AvailabilityState }) {
  return (
    <span className="kv-pill" data-a={state}>
      {AVAILABILITY_LABEL[state]}
    </span>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <section className="kv-card">{children}</section>;
}

export function SectionHeading({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return (
    <header>
      {eyebrow ? <div className="kv-eyebrow">{eyebrow}</div> : null}
      <h2 className="kv-section-h">{children}</h2>
    </header>
  );
}

/** A button that opens the evidence drawer for one or more descriptors. */
export function EvidenceButton({
  title,
  descriptors,
  context,
  label = "Evidence",
}: {
  title: string;
  descriptors: EvidenceDescriptor[];
  context?: string;
  label?: string;
}) {
  const { openEvidence } = useShell();
  if (descriptors.length === 0) return null;
  return (
    <button
      type="button"
      className="kv-evbtn"
      onClick={() => openEvidence({ title, descriptors, context })}
    >
      {label} ({descriptors.length})
    </button>
  );
}

/**
 * Renders a governed metric. Missing/withheld/not_measured render as an explicit
 * "no value" label — never 0.
 */
export function MetricValue({
  metric,
  resolveEvidence,
}: {
  metric: GovernedMetricValue;
  resolveEvidence?: (refs: string[]) => EvidenceDescriptor[];
}) {
  const showable = availabilityHasDisplayableValue(metric.availabilityState) && metric.value !== null;
  const descriptors = resolveEvidence ? resolveEvidence(metric.evidenceRefs) : [];
  return (
    <div className="kv-metric">
      {showable ? (
        <span className="kv-metric-val">
          {formatNumber(metric.value as number)}
          {metric.unit ? <span style={{ fontSize: 13, marginLeft: 4 }}>{unitLabel(metric.unit)}</span> : null}
        </span>
      ) : (
        <span className="kv-metric-noval" title={metric.unavailableReason ?? undefined}>
          No value · {AVAILABILITY_LABEL[metric.availabilityState]}
        </span>
      )}
      <span className="kv-metric-label">
        {metric.label ?? metric.metricKey}
        {metric.period ? ` · ${metric.period}` : ""}
      </span>
      {descriptors.length > 0 ? (
        <EvidenceButton title={metric.label ?? metric.metricKey} descriptors={descriptors} />
      ) : null}
    </div>
  );
}

export function formatNumber(n: number): string {
  if (Math.abs(n) >= 1000) return n.toLocaleString("en-US");
  return String(n);
}

function unitLabel(unit: string): string {
  switch (unit) {
    case "USD_millions": return "M USD";
    case "percent": return "%";
    case "count": return "";
    case "index": return "";
    default: return unit;
  }
}

/** A warning banner rendered from an envelope warning. */
export function Banner({
  tone = "warn",
  children,
}: {
  tone?: "warn" | "alert" | "info";
  children: ReactNode;
}) {
  const t = tone === "warn" ? undefined : tone;
  return (
    <div className="kv-banner" data-tone={t} role="status">
      <span aria-hidden>{tone === "alert" ? "!" : "i"}</span>
      <span>{children}</span>
    </div>
  );
}
