// Source Decision Queue surface — the triggered-decision inbox for Source.
//
// Renders the assembled `SourceDecisionQueue`: a consistently ordered
// list of BUNDLED decision cards — one card per contract/vendor decision
// (Practitioner-Fit FIX 2) — grouped by urgency band, each deep-linking into
// a pre-loaded workflow. The sub-issues (renewal, notice window, benchmark,
// shelfware flags) live inside the card, not as competing rows.
//
// Also carries the mid-stream entry rail (FIX 4): a VP who already knows what
// they have — a vendor, a renewal, an RFP response — jumps straight in rather
// than waiting for a detector to surface it.
//
// Never empty-and-silent — an empty queue renders the `emptyState` line.
// Locked design system (cream paper, serif headings, black/ghost buttons).

import Link from "next/link";
import type { CSSProperties } from "react";
import { SHELL } from "@/lib/shell/shell-tokens";
import {
  URGENCY_LABEL,
  type BundleAccountability,
  type DecisionPosture,
  type DecisionTriggerKind,
  type DecisionUrgency,
  type SourceDecisionBundle,
  type SourceDecisionQueue,
} from "@/lib/source/decision-queue/types";
import {
  resolveEvidenceTraces,
  type EvidenceResolutionContext,
} from "@/lib/source/evidence-trace/evidence-trace";
import { EvidenceTraceTrigger } from "./EvidenceTraceDrawer";
import { SourceTriageBands } from "./SourceTriageBands";
import {
  buildSourceTriageQueueView,
  TRIAGE_BAND_LABELS,
  TRIAGE_SORT_LABELS,
  triageBandForUrgency,
  type SourceTriageBand,
  type SourceTriageBandFilter,
  type SourceTriageSort,
} from "@/lib/source/queue/triage-banding";

// Native <select> elements ignore most custom styling (border/radius render,
// but the browser's own dropdown arrow still paints on top), which reads as
// an unstyled system control next to the custom-designed Apply/New event
// buttons beside it. appearance:none + an inlined SVG chevron makes it match.
const SOURCE_QUEUE_SELECT_STYLE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK,
  background: `${SHELL.CARD_WHITE} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23525866' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 10px center`,
  border: "1px solid " + SHELL.CARD_LINE,
  borderRadius: 6,
  padding: "8px 26px 8px 10px",
  appearance: "none",
  WebkitAppearance: "none",
  cursor: "pointer",
};

const CARD: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: "1px solid " + SHELL.CARD_LINE,
  borderRadius: 10,
  padding: "16px 18px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const URGENCY_META: Record<
  DecisionUrgency,
  { bg: string; line: string; text: string }
> = {
  due_now: { bg: SHELL.RUST_BG, line: SHELL.PEACH_LINE, text: SHELL.RUST_TEXT },
  next_14_days: {
    bg: SHELL.PEACH_BG,
    line: SHELL.PEACH_LINE,
    text: SHELL.PEACH_TEXT,
  },
  next_45_days: {
    bg: SHELL.BLUE_BG,
    line: SHELL.BLUE_LINE,
    text: SHELL.INK_MID,
  },
  next_90_days: {
    bg: SHELL.GRAY_BG,
    line: SHELL.GRAY_LINE,
    text: SHELL.INK_SOFT,
  },
  watch: { bg: SHELL.GRAY_BG, line: SHELL.GRAY_LINE, text: SHELL.GRAY_TEXT },
};

const KIND_LABEL: Record<DecisionTriggerKind, string> = {
  renewal: "Renewal",
  notice_window: "Auto-renewal trap",
  overlap_shelfware: "Overlap / shelfware",
  savings_opportunity: "Savings opportunity",
  blocked_missing_evidence: "Blocked — context gap",
};

const POSTURE_LABEL: Record<DecisionPosture, string> = {
  renegotiate: "Renegotiate",
  consolidate: "Consolidate",
  right_size: "Right-size",
  review: "Review",
  unblock: "Unblock",
};

const POSTURE_GUIDANCE: Record<DecisionPosture, string> = {
  renegotiate: "Negotiation ready",
  consolidate: "Consolidation candidate",
  right_size: "Right-size before renewal",
  review: "Review required",
  unblock: "Needs evidence before action",
};

function cleanQueueCopy(text: string): string {
  return text
    .replace(/\bvendor_contracts\b/g, "vendor contract evidence")
    .replace(/\bit_financials\b/g, "financial baseline evidence")
    .replace(/\bposture:\s*unblock\b/gi, "needs evidence before action")
    .replace(/\bposture:\s*review\b/gi, "needs review")
    .replace(/\bposture:\s*renegotiate\b/gi, "ready for negotiation")
    .replace(/\bposture:\s*consolidate\b/gi, "consolidation candidate")
    .replace(/\bposture:\s*right[_-]?size\b/gi, "right-size before renewal")
    .replace(/\bgrounding\b/gi, "evidence")
    .replace(
      /\bAbarVa should decline rather than guess\b/g,
      "Do not recommend until the missing evidence is refreshed",
    )
    .replace(/\s+/g, " ")
    .trim();
}

/** The mid-stream entry points (FIX 4) — "I already have …". */
const ENTRY_POINTS: { label: string; href: string }[] = [
  { label: "I have a vendor", href: "/source/new?intent=vendor" },
  { label: "I have a renewal", href: "/source/new?intent=renewal" },
  { label: "I have an RFP response", href: "/source/new?intent=rfp-response" },
  {
    label: "I have a business request",
    href: "/source/new?intent=business-request",
  },
  { label: "I need to cut spend", href: "/source/new?intent=cut-spend" },
  {
    label: "I need to compare vendors",
    href: "/source/new?intent=compare-vendors",
  },
];

function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function formatCompactUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)
    return `$${Math.round(value / 1_000).toLocaleString("en-US")}K`;
  return formatUsd(value);
}

function Pill({
  text,
  bg,
  line,
  color,
}: {
  text: string;
  bg: string;
  line: string;
  color: string;
}) {
  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        background: bg,
        border: "1px solid " + line,
        color,
        borderRadius: 5,
        padding: "3px 7px",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function SubIssueRow({
  label,
  detail,
  valueAtStakeUsd,
  evidenceContext,
  evidenceRefs,
}: {
  label: string;
  detail: string;
  valueAtStakeUsd: number | null;
  evidenceContext?: EvidenceResolutionContext;
  evidenceRefs: string[];
}) {
  return (
    <li
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "7px 0",
        borderTop: "1px solid " + SHELL.CARD_LINE_SOFT,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "baseline",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            fontWeight: 600,
            color: SHELL.INK_MID,
          }}
        >
          {label}
        </span>
        {valueAtStakeUsd !== null ? (
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.MINT_TEXT,
            }}
          >
            {formatUsd(valueAtStakeUsd)}
          </span>
        ) : null}
        {evidenceContext ? (
          <EvidenceTraceTrigger
            variant="chip"
            claimLabel={label}
            traces={resolveEvidenceTraces(evidenceRefs, evidenceContext)}
          />
        ) : null}
      </div>
      <span
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_SOFT,
          lineHeight: 1.5,
        }}
      >
        {detail}
      </span>
    </li>
  );
}

/**
 * Owner + SLA accountability row — surfaces who owns the renewal and when it
 * is due directly on the card, so a VP sees accountability without opening
 * the cockpit. Projected from persisted `sourcing_work_items`.
 */
function AccountabilityRow({
  accountability,
}: {
  accountability: BundleAccountability;
}) {
  const { owner, dueDate, openCount, hasOpenNotice, hasTowerWatch } =
    accountability;
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
        padding: "6px 0 2px",
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: SHELL.INK_MUTED,
        }}
      >
        Accountability
      </span>
      <Pill
        text={owner ? `Owner: ${owner}` : "Owner: unassigned"}
        bg={owner ? SHELL.BLUE_BG : SHELL.PAPER_DEEP}
        line={SHELL.CARD_LINE}
        color={owner ? SHELL.INK_MID : SHELL.INK_MUTED}
      />
      <Pill
        text={dueDate ? `SLA: ${dueDate}` : "SLA: not set"}
        bg={dueDate ? SHELL.PEACH_BG : SHELL.PAPER_DEEP}
        line={dueDate ? SHELL.PEACH_LINE : SHELL.CARD_LINE}
        color={dueDate ? SHELL.PEACH_TEXT : SHELL.INK_MUTED}
      />
      {hasOpenNotice ? (
        <Pill
          text="Notice in flight"
          bg={SHELL.RUST_BG}
          line={SHELL.PEACH_LINE}
          color={SHELL.RUST_TEXT}
        />
      ) : null}
      {hasTowerWatch ? (
        <Pill
          text="Tower watch"
          bg={SHELL.MINT_BG}
          line={SHELL.MINT_LINE}
          color={SHELL.MINT_TEXT}
        />
      ) : null}
      {openCount > 0 ? (
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            color: SHELL.INK_MUTED,
          }}
        >
          {openCount} open work item{openCount === 1 ? "" : "s"}
        </span>
      ) : null}
    </div>
  );
}

function DecisionBundleCard({
  bundle,
  evidenceContext,
}: {
  bundle: SourceDecisionBundle;
  evidenceContext?: EvidenceResolutionContext;
}) {
  const urgency = URGENCY_META[bundle.urgency];
  const band = triageBandForUrgency(bundle.urgency);
  return (
    <article
      style={CARD}
      data-testid={`source-decision-card-${bundle.bundleId}`}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Pill
          text={`${TRIAGE_BAND_LABELS[band]} · ${URGENCY_LABEL[bundle.urgency]}`}
          bg={urgency.bg}
          line={urgency.line}
          color={urgency.text}
        />
        <Pill
          text={
            POSTURE_GUIDANCE[bundle.posture] ?? POSTURE_LABEL[bundle.posture]
          }
          bg={SHELL.PAPER_DEEP}
          line={SHELL.CARD_LINE}
          color={SHELL.INK_SOFT}
        />
        {bundle.valueAtStakeUsd !== null ? (
          <Pill
            text={`${formatUsd(bundle.valueAtStakeUsd)} at stake`}
            bg={SHELL.MINT_BG}
            line={SHELL.MINT_LINE}
            color={SHELL.MINT_TEXT}
          />
        ) : null}
      </div>
      <h3
        style={{
          fontFamily: SHELL.SERIF,
          fontWeight: "normal",
          fontSize: 17,
          color: SHELL.INK,
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        {cleanQueueCopy(bundle.headline)}
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
        {cleanQueueCopy(bundle.summary)}
      </p>

      {bundle.accountability ? (
        <AccountabilityRow accountability={bundle.accountability} />
      ) : null}

      {bundle.subIssues.length > 0 ? (
        <details style={{ marginTop: 2 }}>
          <summary
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: SHELL.INK_MUTED,
              cursor: "pointer",
            }}
          >
            {bundle.subIssues.length} signal
            {bundle.subIssues.length === 1 ? "" : "s"} on this contract
          </summary>
          <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0 }}>
            {bundle.subIssues.map((sub, idx) => (
              <SubIssueRow
                key={`${sub.kind}:${idx}`}
                label={`${KIND_LABEL[sub.kind]} — ${sub.label}`}
                detail={sub.detail}
                valueAtStakeUsd={sub.valueAtStakeUsd}
                evidenceContext={evidenceContext}
                evidenceRefs={sub.evidenceRefs}
              />
            ))}
          </ul>
        </details>
      ) : null}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginTop: 4,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_MUTED,
          }}
        >
          {cleanQueueCopy(bundle.recommendedAction)}
        </span>
        <Link
          href={bundle.deepLink}
          data-testid={`source-decision-open-${bundle.bundleId}`}
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            fontWeight: 600,
            color: SHELL.PAPER,
            background: SHELL.INK,
            border: "1px solid " + SHELL.INK,
            borderRadius: 6,
            padding: "7px 14px",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Open event
        </Link>
        <SecondaryDecisionAction band={band} bundleId={bundle.bundleId} />
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
          }}
        >
          Evidence: {bundle.evidenceRefs.length} linked source
          {bundle.evidenceRefs.length === 1 ? "" : "s"}
        </span>
        {evidenceContext ? (
          <EvidenceTraceTrigger
            claimLabel={`${bundle.vendorName} — decision evidence`}
            traces={resolveEvidenceTraces(bundle.evidenceRefs, evidenceContext)}
          />
        ) : null}
      </div>
    </article>
  );
}

function secondaryActionLabel(band: SourceTriageBand): string {
  if (band === "overdue") return "Defer to Q4";
  if (band === "due_this_quarter") return "Schedule scoping";
  return "Snooze 30 days";
}

function SecondaryDecisionAction({
  band,
  bundleId,
}: {
  band: SourceTriageBand;
  bundleId: string;
}) {
  const label = secondaryActionLabel(band);
  return (
    <details
      data-testid={`source-decision-secondary-${bundleId}`}
      style={{
        border: "1px solid " + SHELL.CARD_LINE,
        borderRadius: 6,
        background: SHELL.CARD_WHITE,
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          listStyle: "none",
          fontFamily: SHELL.SANS,
          fontSize: 12,
          fontWeight: 600,
          color: SHELL.INK_MID,
          padding: "7px 12px",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </summary>
      <div
        style={{
          width: 220,
          borderTop: "1px solid " + SHELL.CARD_LINE,
          padding: 10,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            lineHeight: 1.45,
            color: SHELL.INK_SOFT,
          }}
        >
          Confirm before changing deadlines. No queue date is changed silently.
        </span>
        <Link
          href="/source/workspace"
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            fontWeight: 700,
            color: SHELL.INK,
            textDecoration: "none",
          }}
        >
          Review in Portfolio →
        </Link>
      </div>
    </details>
  );
}

/**
 * Mid-stream entry — "＋ Start" collapses the six entry-point links.
 * Six peer chips competed with the queue cards for the eye (audit M4).
 * One summary button keeps the affordance without the visual noise.
 */
function EntryRail() {
  return (
    <details
      style={{
        ...CARD,
        background: SHELL.PAPER_SOFT,
        gap: 0,
        padding: "8px 14px",
      }}
    >
      <summary
        style={{
          listStyle: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: SHELL.MONO,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: SHELL.INK_MUTED,
          userSelect: "none",
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 14,
            fontWeight: 700,
            color: SHELL.INK,
            lineHeight: 1,
          }}
        >
          ＋
        </span>
        Already mid-stream? Start here
      </summary>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {ENTRY_POINTS.map((entry) => (
          <Link
            key={entry.href}
            href={entry.href}
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              fontWeight: 600,
              color: SHELL.INK,
              background: SHELL.PAPER,
              border: "1px solid " + SHELL.CARD_LINE,
              borderRadius: 6,
              padding: "7px 12px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {entry.label}
          </Link>
        ))}
      </div>
    </details>
  );
}

export function SourceDecisionQueueView({
  queue,
  evidenceContext,
  activeBand = "all",
  sort = "deadline",
  activeEventsCount = 0,
}: {
  queue: SourceDecisionQueue;
  /** Substrate for resolving the evidence-trace drawer; omit to hide triggers. */
  evidenceContext?: EvidenceResolutionContext;
  activeBand?: SourceTriageBandFilter;
  sort?: SourceTriageSort;
  activeEventsCount?: number;
}) {
  const triage = buildSourceTriageQueueView(queue, { activeBand, sort });
  const total = triage.totalCount;
  const activeBandLabel =
    activeBand === "all" ? "All triage bands" : TRIAGE_BAND_LABELS[activeBand];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        maxWidth: 1040,
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: SHELL.INK_MUTED,
            }}
          >
            Source · Attention
          </span>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontWeight: "normal",
              fontSize: 30,
              color: SHELL.INK,
              margin: 0,
            }}
          >
            {total > 0
              ? `${total} decision${total === 1 ? "" : "s"} in queue`
              : "Nothing needs you"}
          </h1>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_SOFT,
              margin: 0,
            }}
          >
            {total} decision{total === 1 ? "" : "s"} in queue ·{" "}
            {triage.overdueCount} overdue ·{" "}
            {formatCompactUsd(triage.aggregateValueThisQuarterUsd)} at stake
            this quarter
          </p>
        </div>
        <QueueToolbar activeBand={activeBand} sort={sort} />
      </header>

      <EntryRail />

      <SourceTriageBands
        summaries={triage.summaries}
        activeBand={activeBand}
        sort={sort}
      />

      {queue.emptyState || triage.visibleBundles.length === 0 ? (
        <div
          style={{
            ...CARD,
            alignItems: "flex-start",
            background: SHELL.PAPER_SOFT,
          }}
        >
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 14,
              color: SHELL.INK_MID,
              margin: 0,
            }}
          >
            {queue.emptyState
              ? `Nothing needs you. ${activeEventsCount} active event${activeEventsCount === 1 ? "" : "s"} in Portfolio →`
              : `Nothing in ${activeBandLabel}. ${activeEventsCount} active event${activeEventsCount === 1 ? "" : "s"} in Portfolio →`}
          </p>
          {queue.emptyState ? (
            <p
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.INK_MUTED,
                margin: 0,
              }}
            >
              {queue.emptyState}
            </p>
          ) : null}
          <Link
            href="/source/workspace"
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              fontWeight: 700,
              color: SHELL.INK,
              textDecoration: "none",
            }}
          >
            Open Portfolio →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {triage.visibleBundles.map((bundle) => (
            <DecisionBundleCard
              key={bundle.bundleId}
              bundle={bundle}
              evidenceContext={evidenceContext}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QueueToolbar({
  activeBand,
  sort,
}: {
  activeBand: SourceTriageBandFilter;
  sort: SourceTriageSort;
}) {
  return (
    <form
      action="/source/workspace"
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "flex-end",
        flexWrap: "wrap",
      }}
    >
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: SHELL.INK_MUTED,
        }}
      >
        Filter
        <select
          name="band"
          defaultValue={activeBand}
          data-testid="source-triage-filter"
          style={SOURCE_QUEUE_SELECT_STYLE}
        >
          <option value="all">All</option>
          <option value="overdue">Overdue</option>
          <option value="due_this_quarter">Due</option>
          <option value="pipeline">Pipeline</option>
        </select>
      </label>
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: SHELL.INK_MUTED,
        }}
      >
        Sort
        <select
          name="sort"
          defaultValue={sort}
          data-testid="source-triage-sort"
          style={SOURCE_QUEUE_SELECT_STYLE}
        >
          {Object.entries(TRIAGE_SORT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        style={{
          alignSelf: "flex-end",
          fontFamily: SHELL.SANS,
          fontSize: 12,
          fontWeight: 700,
          color: SHELL.INK,
          background: SHELL.PAPER_SOFT,
          border: "1px solid " + SHELL.CARD_LINE,
          borderRadius: 6,
          padding: "8px 12px",
          cursor: "pointer",
        }}
      >
        Apply
      </button>
      <Link
        href="/source/new"
        style={{
          alignSelf: "flex-end",
          fontFamily: SHELL.SANS,
          fontSize: 12,
          fontWeight: 700,
          color: SHELL.PAPER,
          background: SHELL.INK,
          border: "1px solid " + SHELL.INK,
          borderRadius: 6,
          padding: "8px 12px",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        New event
      </Link>
    </form>
  );
}
