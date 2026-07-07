// Home "Executive Morning Brief" composer — pure, no I/O.
//
// Turns the real per-tenant reads (AI initiatives + the program approval
// queue) into the calm, money-anchored brief the redesigned Home renders.
// Build-for-pilot discipline: every field degrades to an honest empty
// state — never a fabricated number. A client with no loaded initiatives
// shows "No initiatives in flight yet", not sample rows.

import type { AIInitiative } from "@/lib/admin/ai-initiatives/queries";
import {
  STAGE_LABELS,
  STATUS_LABELS,
  formatUsd,
} from "@/lib/admin/ai-initiatives/labels";
import type { ApprovalRequest } from "@/lib/programs/approval";

export interface HomeKpi {
  label: string;
  value: string;
  /** Sub-line under the number. Empty string renders nothing. */
  note: string;
}

export interface HomePortfolioRow {
  name: string;
  owner: string;
  value: string;
  stage: string;
  status: string;
  /** 'risk' | 'ok' | 'gate' drives the hairline pill accent. */
  tone: "risk" | "ok" | "gate";
}

export interface HomeAttentionItem {
  module: string;
  text: string;
}

export interface HomeDecision {
  /** Eyebrow line, e.g. "Needs review today · $4.0M · Store Labor AI". */
  eyebrow: string;
  /** The question the executive must route into Source/Moves to resolve. */
  question: string;
  /** One-paragraph plain-language framing. */
  detail: string;
  /** Route INTO the owning workspace — Home never decides inline. */
  href: string;
}

export interface HomeBrief {
  /** Identity band. */
  tenantName: string;
  industryLabel: string | null;
  logoColor: string | null;
  initials: string;
  /** Greeting — binds to the signed-in user with a graceful fallback. */
  greeting: string;
  /** True when there is real substance to show. */
  hasPortfolio: boolean;
  kpis: HomeKpi[];
  portfolio: HomePortfolioRow[];
  attention: HomeAttentionItem[];
  decision: HomeDecision | null;
}

const RISK_STATUSES = new Set([
  "adoption_gap",
  "value_lag",
  "cost_overrun",
  "duplication_risk",
  "stalled",
]);

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function statusTone(
  flag: AIInitiative["statusFlag"],
): HomePortfolioRow["tone"] {
  if (flag === "healthy") return "ok";
  if (RISK_STATUSES.has(flag)) return "risk";
  return "gate"; // foundation_phase / in_move — neutral amber
}

function greetingFor(firstName: string | null): string {
  const name = firstName?.trim();
  if (!name) return "Good morning.";

  const punctuation = /[.!?]$/.test(name) ? "" : ".";
  return `Good morning, ${name}${punctuation}`;
}

export function buildHomeBrief(input: {
  tenantName: string;
  industryLabel: string | null;
  logoColor: string | null;
  firstName: string | null;
  initiatives: ReadonlyArray<AIInitiative>;
  approvals: ReadonlyArray<ApprovalRequest>;
}): HomeBrief {
  const {
    tenantName,
    industryLabel,
    logoColor,
    firstName,
    initiatives,
    approvals,
  } = input;

  const hasPortfolio = initiatives.length > 0;
  const decisionsCount = approvals.length;

  const sortedInitiatives = [...initiatives].sort(
    (a, b) => (b.committedTotalUsd ?? 0) - (a.committedTotalUsd ?? 0),
  );

  // ── Portfolio rows: highest committed value first, top 6. ──
  const portfolio: HomePortfolioRow[] = sortedInitiatives
    .slice(0, 6)
    .map((i) => ({
      name: i.name,
      owner: i.ownerName,
      value: formatUsd(i.committedTotalUsd),
      stage: STAGE_LABELS[i.stage] ?? i.stage,
      status: STATUS_LABELS[i.statusFlag] ?? i.statusFlag,
      tone: statusTone(i.statusFlag),
    }));

  // ── KPIs: derived from REAL committed/measured USD. ──
  const valueAtStake = initiatives.reduce(
    (sum, i) => sum + (i.committedTotalUsd ?? 0),
    0,
  );
  const realized = initiatives.reduce(
    (sum, i) => sum + (i.measuredValueUsd ?? 0),
    0,
  );
  const riskInitiatives = sortedInitiatives.filter((i) =>
    RISK_STATUSES.has(i.statusFlag),
  );
  const atRisk = riskInitiatives.length;
  const realizedPct =
    valueAtStake > 0 ? Math.round((realized / valueAtStake) * 100) : 0;

  const kpis: HomeKpi[] = [
    {
      label: "Value at stake",
      value: valueAtStake > 0 ? formatUsd(valueAtStake) : "—",
      note: hasPortfolio
        ? `${initiatives.length} initiatives`
        : "No initiatives loaded",
    },
    {
      label: "Realized to date",
      value: realized > 0 ? formatUsd(realized) : "—",
      note: valueAtStake > 0 ? `${realizedPct}% of committed` : "",
    },
    {
      label: "Decisions for you",
      value: String(decisionsCount),
      note: decisionsCount > 0 ? "awaiting review" : "none pending",
    },
    {
      label: "Initiatives at risk",
      value: hasPortfolio ? `${atRisk}/${initiatives.length}` : "—",
      note: atRisk > 0 ? "need attention" : "all healthy",
    },
  ];

  // ── The single decision: most recently-requested pending approval.
  //    Home only SURFACES it; the CTA routes into the owning workspace
  //    (Moves/Source) where evidence, audit, and permission live. ──
  let decision: HomeDecision | null = null;
  if (approvals.length > 0) {
    const top = approvals[approvals.length - 1]!; // queue is oldest-first; newest last
    const briefTitle =
      (top.briefSnapshot?.title as string | undefined) ??
      (top.briefSnapshot?.programName as string | undefined) ??
      "Program decision";
    decision = {
      eyebrow: "Needs review today",
      question: `Review and decide: ${briefTitle}.`,
      detail:
        "Decision-support only — Home surfaces the request. Approve, send back, " +
        "and the rationale + audit happen inside the owning workspace, where the " +
        "full evidence pack and your permission checks live.",
      href: `/strategic-moves?program=${encodeURIComponent(top.programId)}`,
    };
  }

  const greeting = greetingFor(firstName);
  const attention: HomeAttentionItem[] = [
    ...(decision
      ? [
          {
            module: "Decision",
            text: decision.question.replace(/^Review and decide:\s*/, ""),
          },
        ]
      : []),
    ...riskInitiatives.slice(0, 3).map((i) => ({
      module: STAGE_LABELS[i.stage] ?? i.stage,
      text: `${i.name} — ${STATUS_LABELS[i.statusFlag] ?? i.statusFlag}`,
    })),
  ];

  return {
    tenantName,
    industryLabel,
    logoColor,
    initials: initialsFor(tenantName),
    greeting,
    hasPortfolio,
    kpis,
    portfolio,
    attention,
    decision,
  };
}
