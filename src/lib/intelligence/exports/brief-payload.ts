// Intelligence · CXO brief export · payload builder
//
// Gap G9: the Intelligence surface generated nothing downloadable. This
// module assembles a downloadable CXO brief from REAL per-tenant data
// and produces a markdown body that the DOCX / PDF renderers consume.
//
// Grounding rules (NO FABRICATION — see PR #2143):
//
//   - Tenants with a seeded Intelligence corpus carry the corpus Brief
//     content — ranked AI bets, value-at-stake, triggered patterns —
//     PLUS the ai_initiatives portfolio derived from `page-data.ts`.
//
//   - Tenants without a seeded Intelligence corpus export ONLY the
//     genuinely-real `ai_initiatives`-derived portfolio content, and
//     render an explicit, honest "Intelligence corpus not yet seeded"
//     section in place of the corpus brief. The builder NEVER emits
//     fabricated bets, value-at-stake figures, or pattern records.
//
// The builder is pure: (BriefData | null, IntelligenceV3PageData) →
// IntelligenceBriefPayload. The route does the I/O.

import type { BriefData } from "@/lib/knowledge-corpus/types";

// Minimal shape of the ai_initiatives-derived page data consumed by this
// builder. Previously imported from @/components/intelligence-v3/types
// (now deleted). Only the fields actually accessed below are listed.
interface IntelligenceV3PageData {
  tenantName: string;
  industry: string;
  stats: { patterns: number; contradictions: number; syntheses: number };
  aiTrajectory: { headline: string; body: string };
  pressureCards: ReadonlyArray<{
    severity: string;
    title: string;
    body: string;
  }>;
  artOfThePossible: ReadonlyArray<{
    name: string;
    parenthetical: string;
    gating: string;
    moves: ReadonlyArray<{ name: string; rationale: string }>;
  }>;
  whatWeCantSee: ReadonlyArray<string>;
}

/** Sentinel marker string asserted by tests for the honest no-corpus state. */
export const CORPUS_NOT_SEEDED_MARKER =
  "Intelligence corpus not yet seeded for this tenant";

/** Payload the Intelligence brief renderers (DOCX + PDF) consume. */
export interface IntelligenceBriefPayload {
  /** Display name of the active tenant. */
  tenantName: string;
  /** ISO 8601 generated-at timestamp. */
  generatedAt: string;
  /** True when a real Intelligence corpus is bound. */
  hasCorpus: boolean;
  /** Stable slug used in the download filename. */
  filenameSlug: string;
  /** One-line CXO synthesis read at the top of the brief. */
  synthesis: string;
  /** Markdown body — walked into DOCX paragraphs / PDF nodes. */
  body: string;
  /** Compact CFO one-pager lines (label · value) for the PDF cover. */
  onePager: Array<{ label: string; value: string }>;
}

interface BuildArgs {
  tenantName: string;
  /** Tenant corpus brief; null for tenants with no seeded corpus. */
  briefData: BriefData | null;
  /** ai_initiatives-derived page data — real for all 3 tenants. */
  pageData: IntelligenceV3PageData;
  generatedAt: string;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tenant"
  );
}

/**
 * Build the Intelligence CXO brief payload for the active tenant.
 *
 * When `briefData` is non-null the tenant has a real corpus and
 * the brief leads with the corpus synthesis, ranked bets, value-at-
 * stake, and triggered patterns. When it is null the corpus sections
 * are replaced with the honest "corpus not yet seeded" disclosure and
 * only the ai_initiatives portfolio is exported.
 */
export function buildIntelligenceBriefPayload(
  args: BuildArgs,
): IntelligenceBriefPayload {
  const { tenantName, briefData, pageData, generatedAt } = args;
  const hasCorpus = Boolean(briefData);
  const dateLabel = generatedAt.slice(0, 10);

  const synthesis = hasCorpus
    ? (briefData!.synthesis ??
      "Sentinel has synthesised the Intelligence corpus into a ranked set of AI bets for executive review.")
    : `This brief reports ${tenantName}'s AI initiative portfolio. The Intelligence corpus — ranked AI bets, value-at-stake, and pattern records — is not yet seeded for this tenant, so those sections are omitted rather than fabricated.`;

  const sections: string[] = [];

  // ── Header / synthesis ───────────────────────────────────────────
  sections.push(`# Intelligence Brief — ${tenantName}`);
  sections.push(`*Prepared by AbarVa Sentinel · ${dateLabel}*`);
  sections.push("## Executive synthesis");
  sections.push(synthesis);

  // ── Corpus brief (seeded tenants only) ───────────────────────────
  if (hasCorpus && briefData) {
    sections.push(...buildCorpusSections(briefData));
  } else {
    sections.push("## Intelligence corpus");
    sections.push(
      `> ${CORPUS_NOT_SEEDED_MARKER}. The ranked AI-bet analysis, value-at-stake breakdown, and triggered-pattern review require a seeded Intelligence corpus. ${tenantName} has not yet had its corpus loaded. The portfolio section below is built directly from real \`ai_initiatives\` records and is the genuine, verifiable content for this tenant.`,
    );
  }

  // ── AI initiative portfolio (all 3 tenants — real ai_initiatives) ─
  sections.push(...buildPortfolioSections(pageData));

  // ── Provenance footer ────────────────────────────────────────────
  sections.push("## Provenance");
  sections.push(
    hasCorpus
      ? `Corpus sections compose ${tenantName}'s seeded Intelligence corpus (patterns, use cases, sources, open tensions). The portfolio section reflects live \`ai_initiatives\` records. Generated ${generatedAt}.`
      : `All content reflects live \`ai_initiatives\` records for ${tenantName}. No corpus-derived figures are included because the corpus is not yet seeded. Generated ${generatedAt}.`,
  );

  const onePager = buildOnePager(tenantName, briefData, pageData, hasCorpus);

  return {
    tenantName,
    generatedAt,
    hasCorpus,
    filenameSlug: slugify(tenantName),
    synthesis,
    body: sections.join("\n\n"),
    onePager,
  };
}

/** Corpus-derived markdown sections for seeded tenants. */
function buildCorpusSections(brief: BriefData): string[] {
  const out: string[] = [];

  // Ranked AI bets ---------------------------------------------------
  out.push("## Ranked AI bets");
  if (brief.bets.length === 0) {
    out.push("No corpus bets are currently ranked above the line.");
  }
  for (const bet of brief.bets) {
    out.push(`### ${bet.rank}. ${bet.useCase.name} — score ${bet.score}`);
    const meta: string[] = [];
    if (bet.initiativeDisplayId)
      meta.push(`Initiative ${bet.initiativeDisplayId}`);
    meta.push(`Engagement: ${bet.engagementState.replace(/_/g, " ")}`);
    if (bet.decision) {
      meta.push(`Decision: **${bet.decision.label}**`);
    }
    out.push(meta.join(" · "));
    if (bet.decision?.reason) {
      out.push(`*${bet.decision.reason}*`);
    }
    out.push(bet.useCase.problemStatement);
    if (bet.bindingPatterns.length > 0) {
      out.push("Binding patterns:");
      out.push(
        bet.bindingPatterns
          .map(
            (bp) =>
              `- ${bp.pattern.name} — ${bp.quantifiedRow.withoutLabel} (${bp.quantifiedRow.description})`,
          )
          .join("\n"),
      );
    }
    if (bet.vendors.length > 0) {
      out.push(
        `Vendor landscape: ${bet.vendors
          .map((v) => `${v.vendor.name} (${v.tier})`)
          .join(", ")}`,
      );
    }
  }

  // Below the line ---------------------------------------------------
  if (brief.belowTheLine && brief.belowTheLine.length > 0) {
    out.push("## Below the line — tracked candidates");
    out.push(
      brief.belowTheLine
        .map(
          (b) =>
            `- ${b.rank}. ${b.useCaseName} — score ${b.score} · ${b.valueLabel} · ${b.ttvLabel} · ${b.hint}`,
        )
        .join("\n"),
    );
  }

  // Value at stake ---------------------------------------------------
  if (brief.valueAtStake && brief.valueAtStake.length > 0) {
    out.push("## Value at stake");
    out.push(
      brief.valueAtStake
        .map(
          (v) =>
            `- ${v.label}: ${v.value} (captured ${v.captured}% · blocked ${v.blocked}% · candidate ${v.candidate}%)`,
        )
        .join("\n"),
    );
  }

  // Open tensions ----------------------------------------------------
  if (brief.openTensions && brief.openTensions.length > 0) {
    out.push("## Open tensions Sentinel would raise");
    for (const tension of brief.openTensions) {
      out.push(`### ${tension.title} (${tension.severity})`);
      out.push(tension.body);
    }
  }

  // Patterns triggered ----------------------------------------------
  if (brief.patternsTriggered.length > 0) {
    out.push("## Patterns triggered");
    for (const pt of brief.patternsTriggered) {
      out.push(`### ${pt.pattern.name}`);
      out.push(`Issue: ${pt.issue}`);
      out.push(`Recommended action: ${pt.recommendedAction}`);
    }
  }

  // Corpus totals ----------------------------------------------------
  out.push("## Corpus coverage");
  out.push(
    [
      `- Use cases: ${brief.totals.totalUseCases}`,
      `- Patterns: ${brief.totals.totalPatterns}`,
      `- Vendors: ${brief.totals.totalVendors}`,
      `- Regulatory references: ${brief.totals.totalRegulatory}`,
      `- Refresh cadence: ${brief.totals.refreshCadence}`,
    ].join("\n"),
  );

  return out;
}

/** ai_initiatives-derived markdown sections — real for all 3 tenants. */
function buildPortfolioSections(page: IntelligenceV3PageData): string[] {
  const out: string[] = [];

  out.push("## AI initiative portfolio");
  out.push(
    `Industry: ${page.industry}. ${page.stats.patterns} initiatives tracked · ${page.stats.contradictions} under pressure · ${page.stats.syntheses} aligned bets.`,
  );

  out.push("### AI trajectory");
  out.push(`**${page.aiTrajectory.headline}** — ${page.aiTrajectory.body}`);

  if (page.pressureCards.length > 0) {
    out.push("### Initiatives under pressure");
    for (const card of page.pressureCards) {
      out.push(`#### [${card.severity}] ${card.title}`);
      out.push(card.body);
    }
  }

  const layersWithMoves = page.artOfThePossible.filter(
    (layer) => layer.moves.length > 0,
  );
  if (layersWithMoves.length > 0) {
    out.push("### Portfolio by office layer");
    for (const layer of layersWithMoves) {
      out.push(`#### ${layer.name} (${layer.parenthetical})`);
      out.push(`*${layer.gating}*`);
      out.push(
        layer.moves.map((m) => `- ${m.name} — ${m.rationale}`).join("\n"),
      );
    }
  }

  if (page.whatWeCantSee.length > 0) {
    out.push("### What the substrate cannot yet see");
    out.push(page.whatWeCantSee.map((gap) => `- ${gap}`).join("\n"));
  }

  return out;
}

/** Compact CFO one-pager lines for the PDF cover. */
function buildOnePager(
  tenantName: string,
  brief: BriefData | null,
  page: IntelligenceV3PageData,
  hasCorpus: boolean,
): Array<{ label: string; value: string }> {
  const lines: Array<{ label: string; value: string }> = [
    { label: "Tenant", value: tenantName },
    { label: "Industry", value: page.industry },
    { label: "Initiatives tracked", value: String(page.stats.patterns) },
    {
      label: "Initiatives under pressure",
      value: String(page.stats.contradictions),
    },
    { label: "Aligned bets", value: String(page.stats.syntheses) },
  ];
  if (hasCorpus && brief) {
    lines.push({
      label: "Corpus use cases",
      value: String(brief.totals.totalUseCases),
    });
    lines.push({
      label: "Corpus patterns",
      value: String(brief.totals.totalPatterns),
    });
    lines.push({
      label: "Ranked AI bets",
      value: String(brief.bets.length),
    });
  } else {
    lines.push({
      label: "Intelligence corpus",
      value: "Not yet seeded",
    });
  }
  return lines;
}
