// Renewal Cockpit surface — the per-renewal decision view.
//
// The headline is the recommended posture; everything below it is the
// evidence behind that call: current spend, term & timing + auto-renewal
// risk, usage/shelfware, should-cost benchmark, incumbent leverage, and
// alternatives. Progressive disclosure: the posture answers first, the
// reasoning sits beneath. Locked design system.

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { SHELL } from "@/lib/shell/shell-tokens";
import type {
  RenewalCockpit,
  RenewalPosture,
} from "@/lib/source/renewal-cockpit/cockpit";
import {
  resolveEvidenceTraces,
  type EvidenceResolutionContext,
} from "@/lib/source/evidence-trace/evidence-trace";
import {
  RESTRICTED_SOURCE_FINANCIAL_LABEL,
  redactSourceFinancialText,
} from "@/lib/source/financial-display";
import { EstimateAssumptionDisclosure } from "./EstimateAssumptionDisclosure";
import { RenewalCockpitActionBar } from "./RenewalCockpitActionBar";
import { EvidenceTraceTrigger } from "./EvidenceTraceDrawer";

const CARD: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: "1px solid " + SHELL.CARD_LINE,
  borderRadius: 10,
  padding: "16px 18px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const POSTURE_META: Record<
  RenewalPosture,
  { bg: string; line: string; text: string }
> = {
  renew: { bg: SHELL.MINT_BG, line: SHELL.MINT_LINE, text: SHELL.MINT_TEXT },
  renegotiate: {
    bg: SHELL.PEACH_BG,
    line: SHELL.PEACH_LINE,
    text: SHELL.PEACH_TEXT,
  },
  rebid: { bg: SHELL.BLUE_BG, line: SHELL.BLUE_LINE, text: SHELL.INK_MID },
  consolidate: {
    bg: SHELL.BLUE_BG,
    line: SHELL.BLUE_LINE,
    text: SHELL.INK_MID,
  },
  exit: { bg: SHELL.RUST_BG, line: SHELL.PEACH_LINE, text: SHELL.RUST_TEXT },
};

/**
 * U-520 — the exact-magnitude gate for this surface.
 *
 * The flag is a REQUIRED second parameter, not an option with a default, so a
 * call site that does not answer fails to compile. That is the property the
 * item asks for and the reason the eight duplicate local formatters were never
 * the defect: a shared ungated `formatUsd` would be no safer than eight of
 * them, because neither makes omission an error.
 *
 * The granted branch keeps this surface's own formatting untouched. Routing it
 * through the shared `formatSourceFinancialValue` would have re-rendered every
 * figure here in the value-ledger's compact style ("$500K" for "$500,000"),
 * which is a change to a locked design and not what this item is for. Only the
 * restricted LABEL is shared, so there is one spelling of the withheld state.
 *
 * `null` stays "not priced" in both directions: that is a statement about the
 * contract, not about the reader, and replacing it with the restricted label
 * would tell a restricted reader a price exists when none does.
 */
function formatUsd(value: number | null, canViewFinancialValues: boolean): string {
  if (value === null) return "not priced";
  if (!canViewFinancialValues) return RESTRICTED_SOURCE_FINANCIAL_LABEL;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: "0.09em",
        color: SHELL.INK_MUTED,
      }}
    >
      {children}
    </span>
  );
}

function EvidenceCard({
  label,
  headline,
  body,
  children,
  traceTrigger,
}: {
  label: string;
  headline: string;
  body: string;
  children?: ReactNode;
  /** Optional evidence-trace affordance, rendered beside the section label. */
  traceTrigger?: ReactNode;
}) {
  return (
    <section style={CARD}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <SectionLabel>{label}</SectionLabel>
        {traceTrigger}
      </div>
      <h3
        style={{
          fontFamily: SHELL.SERIF,
          fontWeight: "normal",
          fontSize: 16,
          color: SHELL.INK,
          margin: 0,
        }}
      >
        {headline}
      </h3>
      <p
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK_SOFT,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {body}
      </p>
      {children}
    </section>
  );
}

export function RenewalCockpitView({
  cockpit,
  evidenceContext,
  canViewFinancialValues,
}: {
  cockpit: RenewalCockpit;
  /** Substrate for resolving the evidence-trace drawer; omit to hide triggers. */
  evidenceContext?: EvidenceResolutionContext;
  /**
   * U-520 — required, and deliberately not optional. This surface prints nine
   * exact magnitudes; an optional flag lets a caller stay silent and be
   * answered "yes" on its behalf, which is the fail-open shape U-508 removed
   * from the eight components that already read this prop.
   */
  canViewFinancialValues: boolean;
}) {
  const posture = POSTURE_META[cockpit.recommendedPosture];
  const sc = cockpit.shouldCost;
  /**
   * U-520, second half — the builder's PROSE carries magnitudes too.
   *
   * The item counted nineteen formatter call sites. Gating only those left this
   * surface reading "Current annual spend Restricted." three lines above
   * "Current spend $500,000 runs $80,000/yr above the $420,000 category
   * benchmark", because that sentence is authored by `buildRenewalCockpit` and
   * rendered as a string, never through `formatUsd`. A gate that a neighbouring
   * sentence walks straight around is worse than none: it tells the reader the
   * figure was withheld while showing it to them.
   *
   * `redactSourceFinancialText` is the existing shared mechanism for exactly
   * this — the same one `redactSourcingEventSummaryForDisplay` already applies
   * to `blocker` and `nextAction`. Granted readers get the string untouched.
   */
  const prose = (text: string) =>
    redactSourceFinancialText(text, canViewFinancialValues);
  // Evidence refs mirror the detector convention: the contract row plus the
  // backing context segments. Should-cost additionally leans on it_financials.
  const contractRefs = [cockpit.contractId, "vendor_contracts"];
  const shouldCostRefs = [
    cockpit.contractId,
    "vendor_contracts",
    "it_financials",
  ];
  const contractTraces = evidenceContext
    ? resolveEvidenceTraces(contractRefs, evidenceContext)
    : [];
  const shouldCostTraces = evidenceContext
    ? resolveEvidenceTraces(shouldCostRefs, evidenceContext)
    : [];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxWidth: 860,
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Link
          href="/source"
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_SOFT,
            textDecoration: "none",
          }}
        >
          ← Sourcing book
        </Link>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: SHELL.INK_MUTED,
          }}
        >
          Source · Renewal Cockpit
        </span>
        <h1
          style={{
            fontFamily: SHELL.SERIF,
            fontWeight: "normal",
            fontSize: 26,
            color: SHELL.INK,
            margin: 0,
          }}
        >
          {cockpit.vendorName} — {cockpit.product}
        </h1>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_SOFT,
            margin: 0,
            display: "flex",
            gap: 8,
            alignItems: "baseline",
            flexWrap: "wrap",
          }}
        >
          <span>
            Current annual spend {formatUsd(cockpit.currentAnnualSpendUsd, canViewFinancialValues)}.
          </span>
          {evidenceContext ? (
            <EvidenceTraceTrigger
              claimLabel={`Current annual spend — ${formatUsd(cockpit.currentAnnualSpendUsd, canViewFinancialValues)}`}
              traces={contractTraces}
            />
          ) : null}
        </p>
      </header>

      {/* THE HEADLINE — recommended posture */}
      <section
        style={{
          ...CARD,
          background: posture.bg,
          border: "1px solid " + posture.line,
          gap: 10,
        }}
      >
        <SectionLabel>Recommended posture</SectionLabel>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontWeight: "normal",
              fontSize: 30,
              color: posture.text,
            }}
          >
            {cockpit.postureLabel}
          </span>
        </div>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 14,
            color: SHELL.INK_MID,
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          {prose(cockpit.postureRationale)}
        </p>
        <Link
          href={`/source/renewal/${encodeURIComponent(cockpit.contractId)}/execution`}
          style={{
            alignSelf: "flex-start",
            fontFamily: SHELL.SANS,
            fontSize: 13,
            fontWeight: 700,
            color: "#ffffff",
            background: SHELL.INK,
            border: "1px solid " + SHELL.INK,
            borderRadius: 7,
            padding: "8px 12px",
            textDecoration: "none",
          }}
        >
          Open execution room
        </Link>
      </section>

      {/* THE ACTION BAR — let the VP act, not just read (Practitioner-Fit §2) */}
      <RenewalCockpitActionBar cockpit={cockpit} />

      {/* Evidence behind the posture */}
      <EvidenceCard
        label="Term & timing · auto-renewal risk"
        headline={
          cockpit.timing.noticeWindowAtRisk
            ? "Notice window is closing"
            : cockpit.timing.autoRenew
              ? "Auto-renewing contract"
              : "Standard renewal"
        }
        body={prose(cockpit.timing.summary)}
        traceTrigger={
          evidenceContext ? (
            <EvidenceTraceTrigger
              variant="chip"
              claimLabel="Term & timing — contract calendar"
              traces={contractTraces}
            />
          ) : undefined
        }
      >
        <div
          style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 4 }}
        >
          <Metric label="Term end" value={cockpit.timing.termEndDate ?? "—"} />
          <Metric
            label="Days to term end"
            value={
              cockpit.timing.daysToTermEnd === null
                ? "—"
                : String(cockpit.timing.daysToTermEnd)
            }
          />
          <Metric
            label="Auto-renew"
            value={cockpit.timing.autoRenew ? "Yes" : "No"}
          />
          <Metric
            label="Days to notice deadline"
            value={
              cockpit.timing.daysToNoticeDeadline === null
                ? "—"
                : String(cockpit.timing.daysToNoticeDeadline)
            }
          />
        </div>
      </EvidenceCard>

      <EvidenceCard
        label="Usage · adoption · shelfware"
        headline={
          cockpit.usage.utilizationRate === null
            ? "Utilization not measured"
            : `${Math.round(cockpit.usage.utilizationRate * 100)}% utilized`
        }
        body={prose(cockpit.usage.summary)}
        traceTrigger={
          evidenceContext ? (
            <EvidenceTraceTrigger
              variant="chip"
              claimLabel="Usage / adoption read"
              traces={contractTraces}
            />
          ) : undefined
        }
      />

      <EvidenceCard
        label="Should-cost benchmark"
        headline={
          sc.benchmarkUsd !== null
            ? `Benchmark ${formatUsd(sc.benchmarkUsd, canViewFinancialValues)}/yr`
            : "Should-cost iceberg framing"
        }
        body={prose(sc.summary)}
        traceTrigger={
          evidenceContext ? (
            <EvidenceTraceTrigger
              variant="chip"
              claimLabel={
                sc.benchmarkUsd !== null
                  ? `Should-cost benchmark — ${formatUsd(sc.benchmarkUsd, canViewFinancialValues)}/yr`
                  : "Should-cost framing"
              }
              traces={shouldCostTraces}
            />
          ) : undefined
        }
      >
        <div
          style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 4 }}
        >
          <Metric
            label="Should-cost low"
            value={formatUsd(sc.estimate.totalLow, canViewFinancialValues)}
          />
          <Metric
            label="Should-cost high"
            value={formatUsd(sc.estimate.totalHigh, canViewFinancialValues)}
          />
          {sc.overspendVsBenchmarkUsd !== null ? (
            <Metric
              label="Vs benchmark"
              value={
                sc.overspendVsBenchmarkUsd > 0
                  ? `+${formatUsd(sc.overspendVsBenchmarkUsd, canViewFinancialValues)}`
                  : formatUsd(sc.overspendVsBenchmarkUsd, canViewFinancialValues)
              }
            />
          ) : null}
        </div>
        {/*
          The low/high pair above is modelled, not quoted. Without this the
          reader sees two dollar figures and nothing that says what was
          assumed to reach them. Basis and assumptions come from the builder
          that made the assumptions, so they cannot drift from the numbers.
        */}
        <EstimateAssumptionDisclosure
          title="Should-cost estimate basis"
          basis={prose(sc.estimateBasis)}
          assumptions={sc.estimateAssumptions.map(prose)}
        />
      </EvidenceCard>

      <EvidenceCard
        label="Incumbent leverage"
        headline={
          cockpit.leverage.leverageHolder === "buyer"
            ? "Leverage sits with the buyer"
            : cockpit.leverage.leverageHolder === "vendor"
              ? "Leverage sits with the vendor"
              : "Leverage is balanced"
        }
        body={prose(cockpit.leverage.assessment)}
      >
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_MID,
            margin: "4px 0 0",
            lineHeight: 1.5,
          }}
        >
          <strong>Play:</strong> {prose(cockpit.leverage.recommendedPlay)}
        </p>
      </EvidenceCard>

      <section style={CARD}>
        <SectionLabel>Alternatives</SectionLabel>
        {cockpit.alternatives.length === 0 ? (
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_SOFT,
              margin: 0,
            }}
          >
            No deal-ready alternative is scouted. Without competitive tension
            the incumbent holds the price; scouting one alternative materially
            shifts leverage.
          </p>
        ) : (
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {cockpit.alternatives.map((alt) => (
              <li
                key={alt.vendorName}
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  color: SHELL.INK_MID,
                  lineHeight: 1.5,
                }}
              >
                <strong>{alt.vendorName}</strong>
                {alt.indicativeAnnualUsd !== null
                  ? ` — ${formatUsd(alt.indicativeAnnualUsd, canViewFinancialValues)}/yr`
                  : ""}
                . {alt.switchingNote}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: SHELL.INK_MUTED,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 14,
          color: SHELL.INK,
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}
