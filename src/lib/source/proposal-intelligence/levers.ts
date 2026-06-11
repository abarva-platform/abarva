// Negotiation levers engine — Top-N optimization opportunities, with honesty rules.
//
// Derives levers from normalized rows + health findings. Hard rules:
//  - A value range is emitted ONLY when numeric evidence supports it
//    (valueBasis 'evidenced'); otherwise the lever is 'opportunity_to_test' with a
//    null range. No fabricated savings, ever.
//  - Every lever carries its evidence basis and a BAFO priority.

import type {
  HealthFinding,
  LeverType,
  NegotiationLever,
  ProposalNormalizationRow,
} from "./types";

export interface LeverInput {
  vendorName: string;
  rows: ProposalNormalizationRow[];
  findings: HealthFinding[];
  /** evidenced annual run-rate for the vendor, when pricing parsed (USD). */
  annualRunRateUsd: number | null;
}

interface Rule {
  leverType: LeverType;
  matches: (input: LeverInput) => { issue: string; evidence: string[] } | null;
  ask: string;
  /** evidenced value range as share of run-rate, when run-rate is known. */
  valueShare?: [number, number];
  priority: "P0" | "P1" | "P2";
  owner: string;
}

const text = (
  rows: ProposalNormalizationRow[],
  cat: ProposalNormalizationRow["normalizedCategory"],
) => rows.filter((r) => r.normalizedCategory === cat);

const RULES: Rule[] = [
  {
    leverType: "cost_transparency",
    matches: (i) => {
      const pricing = text(i.rows, "pricing_structure");
      const bundled = pricing.find(
        (r) =>
          r.deviations.some((d) =>
            /bundl|not broken|no breakout|aggregate/i.test(d),
          ) || r.normalizedAnswer === null,
      );
      return bundled
        ? {
            issue: `Pricing not provided at tower/line level (${bundled.deviations[0] ?? "no comparable breakout"}).`,
            evidence: bundled.evidenceReference
              ? [bundled.evidenceReference]
              : [],
          }
        : null;
    },
    ask: "Require tower-level cost breakout (run vs transition vs tooling vs pass-through) before commercial scoring.",
    priority: "P0",
    owner: "Commercial lead",
  },
  {
    leverType: "cola_indexation",
    matches: (i) => {
      const com = text(i.rows, "commercial_model");
      const cola = com.find((r) =>
        /cola|indexation|cpi|escalat/i.test(
          `${r.vendorResponseSummary} ${r.assumptions.join(" ")}`,
        ),
      );
      return cola && !/cap|capped|fixed/i.test(cola.vendorResponseSummary)
        ? {
            issue: "COLA/indexation proposed without a cap.",
            evidence: cola.evidenceReference ? [cola.evidenceReference] : [],
          }
        : null;
    },
    ask: "Cap COLA/indexation (e.g. lesser of CPI or a fixed %), applied only after year 1.",
    valueShare: [0.01, 0.03],
    priority: "P1",
    owner: "Commercial lead",
  },
  {
    leverType: "productivity_commitment",
    matches: (i) => {
      const auto = text(i.rows, "automation_productivity");
      const vague = auto.find(
        (r) =>
          r.deviations.some((d) =>
            /vague|uncommitted|marketing|not committed/i.test(d),
          ) ||
          (r.completeness !== "complete" && r.vendorResponseSummary.length > 0),
      );
      return vague
        ? {
            issue:
              "Productivity/automation claims are not contractually committed.",
            evidence: vague.evidenceReference ? [vague.evidenceReference] : [],
          }
        : null;
    },
    ask: "Convert productivity claims into a committed year-over-year glidepath that reduces run-rate.",
    valueShare: [0.03, 0.07],
    priority: "P0",
    owner: "Sourcing lead",
  },
  {
    leverType: "service_credits",
    matches: (i) => {
      const sla = text(i.rows, "sla_commitments");
      const weak = sla.find((r) =>
        r.deviations.some((d) => /credit|earn[- ]?back|teeth/i.test(d)),
      );
      return weak
        ? {
            issue: "SLA regime lacks meaningful credits / has easy earn-back.",
            evidence: weak.evidenceReference ? [weak.evidenceReference] : [],
          }
        : null;
    },
    ask: "Add service-credit teeth on chronic-miss SLAs; earn-back only after sustained performance.",
    priority: "P1",
    owner: "Service delivery lead",
  },
  {
    leverType: "location_mix",
    matches: (i) => {
      const staff = text(i.rows, "staffing_model");
      const onshore = staff.find((r) =>
        r.deviations.some((d) => /onshore|high[- ]cost|location mix/i.test(d)),
      );
      return onshore
        ? {
            issue: "Higher-cost onshore mix than the baseline requires.",
            evidence: onshore.evidenceReference
              ? [onshore.evidenceReference]
              : [],
          }
        : null;
    },
    ask: "Challenge the onshore/offshore mix against the service catalog; reprice affected towers.",
    valueShare: [0.02, 0.05],
    priority: "P1",
    owner: "Sourcing lead",
  },
  {
    leverType: "transition_risk",
    matches: (i) => {
      const t = text(i.rows, "transition_approach");
      const fee = t.find(
        (r) =>
          /transition (fee|cost)/i.test(r.vendorResponseSummary) &&
          !/at risk|holdback|milestone/i.test(r.vendorResponseSummary),
      );
      return fee
        ? {
            issue: "Transition fee not at risk / not milestone-gated.",
            evidence: fee.evidenceReference ? [fee.evidenceReference] : [],
          }
        : null;
    },
    ask: "Put a share of transition fees at risk against milestone acceptance; align payments to outcomes.",
    priority: "P1",
    owner: "Commercial lead",
  },
  {
    leverType: "pass_through",
    matches: (i) => {
      const p = text(i.rows, "pricing_structure").concat(
        text(i.rows, "tooling_approach"),
      );
      const dup = p.find((r) =>
        r.deviations.some((d) =>
          /pass[- ]?through|tooling cost|duplicate/i.test(d),
        ),
      );
      return dup
        ? {
            issue: "Opaque or duplicated tooling/pass-through costs.",
            evidence: dup.evidenceReference ? [dup.evidenceReference] : [],
          }
        : null;
    },
    ask: "Require pass-through transparency at cost (no markup) and remove duplicated tooling charges.",
    priority: "P2",
    owner: "Commercial lead",
  },
  {
    leverType: "subcontractor_terms",
    matches: (i) => {
      const f = i.findings.find(
        (x) => x.dimension === "subcontractors" && x.severity !== "info",
      );
      return f
        ? {
            issue: f.finding,
            evidence: f.evidenceReference ? [f.evidenceReference] : [],
          }
        : null;
    },
    ask: "Cap subcontractor markup and require named-sub approval rights.",
    priority: "P2",
    owner: "Procurement",
  },
];

/** Build levers for one vendor. Deterministic; honesty enforced. */
export function buildVendorLevers(input: LeverInput): NegotiationLever[] {
  const levers: NegotiationLever[] = [];
  let n = 0;
  for (const rule of RULES) {
    const hit = rule.matches(input);
    if (!hit) continue;
    n += 1;
    const evidenced =
      Boolean(rule.valueShare) &&
      input.annualRunRateUsd !== null &&
      hit.evidence.length > 0;
    levers.push({
      leverId: `LEV-${input.vendorName.replace(/\W+/g, "").toUpperCase().slice(0, 8)}-${String(n).padStart(2, "0")}`,
      vendorName: input.vendorName,
      leverType: rule.leverType,
      currentIssue: hit.issue,
      negotiationAsk: rule.ask,
      valueBasis: evidenced ? "evidenced" : "opportunity_to_test",
      expectedValueLowUsd: evidenced
        ? Math.round(input.annualRunRateUsd! * rule.valueShare![0])
        : null,
      expectedValueHighUsd: evidenced
        ? Math.round(input.annualRunRateUsd! * rule.valueShare![1])
        : null,
      confidence: evidenced ? "medium" : "low",
      evidenceBasis: hit.evidence,
      owner: rule.owner,
      bafoPriority: rule.priority,
    });
  }
  return levers;
}

/** Top-N across vendors: P0 first, then evidenced value, then priority. */
export function topLevers(all: NegotiationLever[], n = 10): NegotiationLever[] {
  const prio = { P0: 0, P1: 1, P2: 2 } as const;
  return [...all]
    .sort((a, b) => {
      if (prio[a.bafoPriority] !== prio[b.bafoPriority])
        return prio[a.bafoPriority] - prio[b.bafoPriority];
      const av = a.expectedValueHighUsd ?? -1;
      const bv = b.expectedValueHighUsd ?? -1;
      return bv - av;
    })
    .slice(0, n);
}
