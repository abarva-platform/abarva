// Deliverable Quality Transformation — Charter synthesis shaper (W1 vertical)
//
// Deterministically shapes a decision-first, machinery-free Initiative Charter
// from synthesised inputs. This is the proof that the profile→synthesis→gate
// loop produces a senior-consultant artifact: the assembled narrative is built
// to PASS the transformation gates (no phase labels, no source-register in the
// body, ONE Open Inputs table, judgment-led).
//
// Evidence/traceability is emitted SEPARATELY (appendix), never in the body.

export type GateRecommendation = "proceed" | "hold" | "stop";

export interface CharterSource {
  label: string;
  family: string;
  confidence: "high" | "medium" | "low";
}

export interface CharterInput {
  engagement: string;
  client: string;
  /** The decision the sponsor is being asked to make — leads page one. */
  decisionRequested: string;
  recommendation: GateRecommendation;
  recommendationRationale: string;
  whyNow: string;
  known: string[];
  discoveryScope: string[];
  successCriteria: string[];
  gates: { proceed: string; hold: string; stop: string };
  immediateDecisions: string[];
  /** Missing facts — consolidated into ONE Open Inputs table, never scattered. */
  openInputs: string[];
  /** Traceability — appendix only, never in the body. */
  sources?: CharterSource[];
}

export interface CharterSection {
  heading: string;
  /** Body paragraphs (already machinery-free). */
  paragraphs?: string[];
  bullets?: string[];
}

export interface CharterDocument {
  title: string;
  subtitle: string;
  /** Decision-first ordered sections (client-facing, no phase labels). */
  sections: CharterSection[];
  openInputs: string[];
  sources: CharterSource[];
}

const REC_LEAD: Record<GateRecommendation, string> = {
  proceed: "We recommend you approve a focused discovery gate",
  hold: "We recommend you hold and resolve the open inputs before committing",
  stop: "We recommend you stop and reframe before investing further",
};

/** Shape a decision-first charter. Pure + deterministic. */
export function buildCharter(input: CharterInput): CharterDocument {
  const sections: CharterSection[] = [
    {
      heading: "Decision requested",
      paragraphs: [
        `${REC_LEAD[input.recommendation]}. ${input.recommendationRationale}`,
        input.decisionRequested,
      ],
    },
    { heading: "Why this matters now", paragraphs: [input.whyNow] },
    { heading: "What we know", bullets: input.known },
    {
      heading: "Recommended discovery scope",
      bullets: input.discoveryScope,
    },
    { heading: "Success criteria", bullets: input.successCriteria },
    {
      heading: "Proceed / hold / stop",
      bullets: [
        `Proceed if — ${input.gates.proceed}`,
        `Hold if — ${input.gates.hold}`,
        `Stop if — ${input.gates.stop}`,
      ],
    },
    {
      heading: "Immediate decisions required",
      bullets: input.immediateDecisions,
    },
  ];

  return {
    title: "Initiative Charter",
    subtitle: `${input.client} · ${input.engagement}`,
    sections,
    openInputs: input.openInputs,
    sources: input.sources ?? [],
  };
}

/**
 * Assemble the client-facing narrative text (no Open Inputs detail, no source
 * register) — what the gates scan. Open Inputs is referenced once as a pointer.
 */
export function charterNarrativeText(doc: CharterDocument): string {
  const parts: string[] = [`${doc.title}\n${doc.subtitle}`];
  for (const s of doc.sections) {
    parts.push(s.heading);
    if (s.paragraphs) parts.push(...s.paragraphs);
    if (s.bullets) parts.push(...s.bullets.map((b) => `• ${b}`));
  }
  // Single pointer to the consolidated table — not scattered placeholders.
  parts.push(
    "Open Inputs Required — the facts we need to confirm are consolidated in the table below.",
  );
  return parts.join("\n\n");
}

/** Render a clean Markdown charter (body + Open Inputs table + appendix register). */
export function renderCharterMarkdown(doc: CharterDocument): string {
  const lines: string[] = [`# ${doc.title}`, `*${doc.subtitle}*`, ""];
  for (const s of doc.sections) {
    lines.push(`## ${s.heading}`);
    if (s.paragraphs) for (const p of s.paragraphs) lines.push(p, "");
    if (s.bullets) {
      for (const b of s.bullets) lines.push(`- ${b}`);
      lines.push("");
    }
  }
  // ONE Open Inputs Required table.
  lines.push("## Open Inputs Required", "");
  lines.push("| # | Input we need to confirm |", "| --- | --- |");
  doc.openInputs.forEach((o, i) => lines.push(`| ${i + 1} | ${o} |`));
  lines.push("");
  // Traceability — appendix only.
  if (doc.sources.length) {
    lines.push("## Appendix — Traceability", "");
    lines.push("| # | Source | Basis | Confidence |", "| --- | --- | --- | --- |");
    doc.sources.forEach((s, i) =>
      lines.push(`| ${i + 1} | ${s.label} | ${s.family} | ${s.confidence} |`),
    );
  }
  return lines.join("\n");
}
