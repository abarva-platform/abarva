import type { EnterpriseSignalPacket, Signal } from "@/lib/home/preview/types";
import { cxoText } from "./cxo-language";

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
  items: Array<{
    text: string;
    detail?: string;
    attribution?: string;
    caveat?: string;
  }>;
}

interface AnalyticalLens {
  kind: string;
  label: string;
  context?: string;
  appliesHere?: string;
  questions?: string;
  decisionUse?: string;
  expertRole?: string;
  caveats?: string;
}

export interface BusinessBriefing {
  sections: BriefingSection[];
  /**
   * Sector patterns and expert lenses, kept apart from the business sections.
   *
   * They answer a different question -- where is this heading -- and they belong on the chapter
   * that asks it. Kept separate so that placing them cannot drag the business sections with them.
   */
  perspective: BriefingSection[];
  /** Questions a new executive would ask that this record cannot answer. Rendered, not hidden. */
  notInTheRecord: Array<{ question: string; why: string }>;
}

const signalsOfKind = (
  packet: EnterpriseSignalPacket,
  kind: string,
): Signal[] => (packet.signals ?? []).filter((s) => s.kind === kind);

/**
 * Round-robin over speakers: every role gets a first quote before any role gets a second.
 *
 * Ordering by rank alone gave five quotes from one office, which reads as a single person's view of
 * the enterprise rather than the leadership team's.
 */
function byDistinctRole<T extends { attribution?: string }>(
  items: T[],
  limit: number,
): T[] {
  const byRole = new Map<string, T[]>();
  for (const item of items) {
    const role = (item.attribution ?? "").split(" · ")[0] || "unattributed";
    if (!byRole.has(role)) byRole.set(role, []);
    byRole.get(role)!.push(item);
  }
  const picked: T[] = [];
  for (let round = 0; picked.length < limit; round += 1) {
    let addedThisRound = false;
    for (const queue of byRole.values()) {
      if (picked.length >= limit) break;
      const next = queue[round];
      if (!next) continue;
      picked.push(next);
      addedThisRound = true;
    }
    if (!addedThisRound) break;
  }
  return picked;
}

/** Pulls the quoted phrase out of a testimony signal, keeping the role and theme around it. */
function testimonyItem(
  signal: Signal,
): { text: string; attribution?: string } | null {
  const statement = signal.statement ?? "";
  const quote = /""(.+?)""|"([^"]{25,})"/.exec(statement);
  const role = /^A (.+?) said/.exec(statement)?.[1];
  const theme = /theme of "([^"]+)"/.exec(statement)?.[1];
  if (!quote) return null;
  const text = (quote[1] ?? quote[2] ?? "").trim();
  if (!text) return null;
  return {
    text,
    attribution: [role, theme ? theme.replace(/_/g, " ") : null]
      .filter(Boolean)
      .join(" · "),
  };
}

export function buildBusinessBriefing(
  packet: EnterpriseSignalPacket,
): BusinessBriefing {
  const sections: BriefingSection[] = [];
  const identity =
    (packet as { enterpriseIdentity?: Record<string, unknown> })
      .enterpriseIdentity ?? {};
  const economics =
    (packet as { businessEconomics?: Record<string, unknown> })
      .businessEconomics ?? {};
  const priorities = ((packet as { strategicPriorities?: unknown[] })
    .strategicPriorities ?? []) as string[];

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
        identity.revenue
          ? `$${(Number(identity.revenue) / 1e9).toFixed(0)}B revenue`
          : null,
        identity.employeeCount
          ? `${Number(identity.employeeCount).toLocaleString()} people`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
      items: [
        ...(businessModel ? [{ text: businessModel }] : []),
        ...(segments.length
          ? [{ text: "Operating segments", detail: segments.join(" · ") }]
          : []),
        ...(customers.length
          ? [{ text: "Who pays", detail: customers.join(" · ") }]
          : []),
      ],
    });
  }

  // 2. What it is trying to do, in its own words and in its own order.
  if (priorities.length) {
    sections.push({
      heading: "What it is trying to do",
      standfirst: `${priorities.length} declared corporate priorities, in the order the record states them.`,
      items: priorities.map((p) => ({
        text: String(p).replace(/^\d+\)\s*/, ""),
      })),
    });
  }

  // 3. Where leadership agrees, disagrees, and contradicts the systems. Counted, not characterised.
  const consensus = signalsOfKind(packet, "consensus");
  const dissent = signalsOfKind(packet, "dissent");
  const contradiction = signalsOfKind(packet, "contradiction");
  if (consensus.length || dissent.length || contradiction.length) {
    sections.push({
      heading: "What the leadership says",
      standfirst:
        "Counted across every recorded interview response, not selected.",
      items: [
        ...consensus
          .slice(0, 4)
          .map((s) => ({ text: cxoText(s.statement), detail: "Consensus" })),
        ...dissent.slice(0, 2).map((s) => ({
          text: cxoText(s.statement),
          detail: "Minority view",
        })),
        ...contradiction.map((s) => ({
          text: s.statement,
          detail: "Conflicts with the record",
        })),
      ],
    });
  }

  // 4. What they actually said. Quotes carry a role and a theme so a reader can weigh them.
  // One voice repeated five times reads as one opinion, not as a leadership team. Take the first
  // quote from each distinct role before taking a second from anyone, so the roles that were
  // interviewed are the roles that appear.
  const allQuotes = signalsOfKind(packet, "testimony")
    .map(testimonyItem)
    .filter(Boolean) as Array<{ text: string; attribution?: string }>;
  const quotes = byDistinctRole(allQuotes, 5);
  if (quotes.length) {
    sections.push({
      heading: "In their own words",
      items: quotes,
    });
  }

  // 5. Industry patterns the record says apply here. Labels only -- see notInTheRecord.
  const lenses =
    (packet as { analyticalLenses?: AnalyticalLens[] }).analyticalLenses ?? [];
  const patterns = lenses.filter((l) => l.kind === "industry_pattern");
  const expert = lenses.filter((l) => l.kind !== "industry_pattern");
  const perspective: BriefingSection[] = [];
  if (patterns.length) {
    perspective.push({
      heading: "Industry patterns the record says apply here",
      standfirst: `${patterns.length} patterns. Each carries the recorded reason it applies to this enterprise, not just the pattern.`,
      items: patterns.map((p) => ({
        text: p.label,
        // The applicability is the point: a pattern without it is a generality about the industry.
        detail: p.appliesHere ?? p.context,
        caveat: p.caveats,
      })),
    });
  }
  if (expert.length) {
    perspective.push({
      heading: "What an expert would ask next",
      standfirst: `${expert.length} lenses, each written from a named operating role, with what an answer would decide.`,
      items: expert.map((l) => ({
        text: l.questions ?? l.label,
        attribution: l.expertRole,
        detail: l.decisionUse ? `Informs: ${l.decisionUse}` : undefined,
        caveat: l.caveats,
      })),
    });
  }

  return { sections, perspective, notInTheRecord: notInTheRecord() };
}

/**
 * The blind spots, named. A new executive asks these on day one, and three of them this intake does
 * not answer at all -- so the page says which, rather than letting silence read as "no issue here".
 */
function notInTheRecord(): BusinessBriefing["notInTheRecord"] {
  const out: BusinessBriefing["notInTheRecord"] = [
    {
      question:
        "Who are the competitors, and where is share being won or lost?",
      why: "No intake family carries a competitor, a peer plan, or a market-share figure. This is a collection gap, not a finding about the market.",
    },
    {
      question: "How does performance compare with peer organisations?",
      why: "Targets are declared against the enterprise's own baselines. Nothing external benchmarks them, so a target being met says nothing about being ahead.",
    },
  ];
  return out;
}
