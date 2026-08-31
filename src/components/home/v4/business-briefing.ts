import type { EnterpriseSignalPacket, Signal } from "@/lib/home/preview/types";

/**
 * What a new executive needs in their first ten minutes.
 *
 * The question this answers is not "what is in the technology estate" -- that is the estate pages --
 * but "what is this company, how does it make money, what is it trying to do, and what do the people
 * running it say about it". All of that is already in the packet: the business model and revenue
 * split as declared identity, the priorities verbatim, and the leadership position as consensus,
 * dissent and contradiction signals computed from 996 recorded responses across 44 roles.
 *
 * Nothing here is generated. Every line is a declared fact or a counted signal, and the section that
 * has no evidence behind it says so rather than being quietly dropped -- a briefing that omits its
 * own blind spots is worse than one that names them, because a new executive cannot tell the
 * difference between "not a factor here" and "we never collected it".
 */

export interface BriefingSection {
  heading: string;
  /** One line of orientation. Never a claim -- the claims are the items. */
  standfirst?: string;
  items: Array<{ text: string; detail?: string; attribution?: string }>;
}

export interface BusinessBriefing {
  sections: BriefingSection[];
  /** Questions a new executive would ask that this record cannot answer. Rendered, not hidden. */
  notInTheRecord: Array<{ question: string; why: string }>;
}

const signalsOfKind = (packet: EnterpriseSignalPacket, kind: string): Signal[] =>
  (packet.signals ?? []).filter((s) => s.kind === kind);

/** Pulls the quoted phrase out of a testimony signal, keeping the role and theme around it. */
function testimonyItem(signal: Signal): { text: string; attribution?: string } | null {
  const statement = signal.statement ?? "";
  const quote = /""(.+?)""|"([^"]{25,})"/.exec(statement);
  const role = /^A (.+?) said/.exec(statement)?.[1];
  const theme = /theme of "([^"]+)"/.exec(statement)?.[1];
  if (!quote) return null;
  const text = (quote[1] ?? quote[2] ?? "").trim();
  if (!text) return null;
  return {
    text,
    attribution: [role, theme ? theme.replace(/_/g, " ") : null].filter(Boolean).join(" · "),
  };
}

export function buildBusinessBriefing(packet: EnterpriseSignalPacket): BusinessBriefing {
  const sections: BriefingSection[] = [];
  const identity = (packet as { enterpriseIdentity?: Record<string, unknown> }).enterpriseIdentity ?? {};
  const economics = (packet as { businessEconomics?: Record<string, unknown> }).businessEconomics ?? {};
  const priorities = ((packet as { strategicPriorities?: unknown[] }).strategicPriorities ?? []) as string[];

  // 1. How the money is made. The business model text carries the revenue split as declared, so it
  // is quoted rather than re-derived -- restating a split in our own arithmetic invents precision.
  const businessModel = String(identity.businessModel ?? "").trim();
  const segments = (economics.operatingSegments as string[] | undefined) ?? [];
  const customers = (economics.customerSegments as string[] | undefined) ?? [];
  if (businessModel || segments.length) {
    sections.push({
      heading: "How this business makes money",
      standfirst: [
        identity.industry ? String(identity.industry) : null,
        identity.revenue ? `$${(Number(identity.revenue) / 1e9).toFixed(0)}B revenue` : null,
        identity.employeeCount ? `${Number(identity.employeeCount).toLocaleString()} people` : null,
      ].filter(Boolean).join(" · "),
      items: [
        ...(businessModel ? [{ text: businessModel }] : []),
        ...(segments.length ? [{ text: "Operating segments", detail: segments.join(" · ") }] : []),
        ...(customers.length ? [{ text: "Who pays", detail: customers.join(" · ") }] : []),
      ],
    });
  }

  // 2. What it is trying to do, in its own words and in its own order.
  if (priorities.length) {
    sections.push({
      heading: "What it is trying to do",
      standfirst: `${priorities.length} declared corporate priorities, in the order the record states them.`,
      items: priorities.map((p) => ({ text: String(p).replace(/^\d+\)\s*/, "") })),
    });
  }

  // 3. Where leadership agrees, disagrees, and contradicts the systems. Counted, not characterised.
  const consensus = signalsOfKind(packet, "consensus");
  const dissent = signalsOfKind(packet, "dissent");
  const contradiction = signalsOfKind(packet, "contradiction");
  if (consensus.length || dissent.length || contradiction.length) {
    sections.push({
      heading: "What the leadership says",
      standfirst: "Counted across every recorded interview response, not selected.",
      items: [
        ...consensus.slice(0, 4).map((s) => ({ text: s.statement, detail: "Consensus" })),
        ...dissent.slice(0, 2).map((s) => ({ text: s.statement, detail: "Minority view" })),
        ...contradiction.map((s) => ({ text: s.statement, detail: "Conflicts with the record" })),
      ],
    });
  }

  // 4. What they actually said. Quotes carry a role and a theme so a reader can weigh them.
  const quotes = signalsOfKind(packet, "testimony").map(testimonyItem).filter(Boolean).slice(0, 5) as Array<{
    text: string;
    attribution?: string;
  }>;
  if (quotes.length) {
    sections.push({
      heading: "In their own words",
      items: quotes,
    });
  }

  // 5. Industry patterns the record says apply here. Labels only -- see notInTheRecord.
  const lenses = ((packet as { analyticalLenses?: Array<{ kind: string; label: string }> }).analyticalLenses ?? []);
  const patterns = lenses.filter((l) => l.kind === "industry_pattern");
  const expert = lenses.filter((l) => l.kind !== "industry_pattern");
  if (patterns.length) {
    sections.push({
      heading: "Industry patterns the record says apply here",
      standfirst: `${patterns.length} patterns, each recorded as applying to this enterprise specifically.`,
      items: patterns.slice(0, 6).map((p) => ({ text: p.label })),
    });
  }
  if (expert.length) {
    sections.push({
      heading: "What an expert would ask next",
      standfirst: `${expert.length} lenses, each naming the question and what the answer would decide.`,
      items: expert.slice(0, 5).map((l) => ({ text: l.label, detail: l.kind.replace(/_/g, " ") })),
    });
  }

  return { sections, notInTheRecord: notInTheRecord(packet, patterns.length > 0) };
}

/**
 * The blind spots, named. A new executive asks these on day one, and three of them this intake does
 * not answer at all -- so the page says which, rather than letting silence read as "no issue here".
 */
function notInTheRecord(packet: EnterpriseSignalPacket, hasPatterns: boolean): BusinessBriefing["notInTheRecord"] {
  const out: BusinessBriefing["notInTheRecord"] = [
    {
      question: "Who are the competitors, and where is share being won or lost?",
      why: "No intake family carries a competitor, a peer plan, or a market-share figure. This is a collection gap, not a finding about the market.",
    },
    {
      question: "How does performance compare with peer organisations?",
      why: "Targets are declared against the enterprise's own baselines. Nothing external benchmarks them, so a target being met says nothing about being ahead.",
    },
  ];
  if (hasPatterns) {
    out.push({
      question: "Why does each industry pattern apply to this enterprise?",
      why: "The patterns reach the page as titles. The recorded business context, the applicability to this enterprise, and the stated caveats are held in the intake and are not carried into the packet.",
    });
  }
  return out;
}
