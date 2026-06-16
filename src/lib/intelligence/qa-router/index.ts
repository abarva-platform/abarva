import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { getContextReadModelForTenant } from "@/lib/intelligence/context-read-model";
import { listContextInsightsForTenant } from "@/lib/intelligence/insight-engine";
import { listContextRefreshEventsForTenant } from "@/lib/intelligence/refresh-events";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

import type { Citation, IntentClass, RoutedAnswer } from "./types";

function classifyIntent(query: string): IntentClass {
  const text = query.toLowerCase();
  if (
    /telling me|attention|material risk|top insights|significant|insights?/.test(
      text,
    )
  )
    return "insight-lookup";
  if (/playbook|best practice|pattern|industry|peers?/.test(text))
    return "corpus";
  if (
    /how many|spend|cost|adoption|what do we have|changed|portfolio|quarter|trend/.test(
      text,
    )
  )
    return "sql-fact";
  if (
    /fresh|board-ready|board ready|stale|trust|reliable|answerability/.test(
      text,
    )
  )
    return "freshness";
  if (/\b[A-Z][a-zA-Z0-9&.-]{2,}\b/.test(query)) return "retrieval";
  return "hybrid";
}

function freshnessFromCounts(
  stale: number,
  review: number,
): "fresh" | "attention" | "stale" | "unknown" {
  if (stale > 0) return "stale";
  if (review > 0) return "attention";
  return "fresh";
}

function citation(
  label: string,
  sourceType: string,
  freshness: "fresh" | "attention" | "stale" | "unknown",
  locator: string | null = null,
): Citation {
  return { label, sourceType, freshness, locator };
}

function listLines(items: string[]): string {
  if (items.length === 0) return "No rows are available yet.";
  return items.map((item) => `- ${item}`).join("\n");
}

export async function routeQuestion(args: {
  query: string;
  tenantKey: string;
  clientId: string;
}): Promise<RoutedAnswer> {
  const tenantKey = canonicalTenantKey(args.tenantKey);
  const routeUsed = classifyIntent(args.query);

  if (routeUsed === "insight-lookup") {
    const { insights } = await listContextInsightsForTenant(tenantKey);
    const top = insights.slice(0, 5);
    return {
      routeUsed,
      answer: top.length
        ? `Here are the strongest derived insights right now:\n${listLines(
            top.map(
              (insight) =>
                `${insight.headline} (${insight.domain}, ${insight.ruleId}, ${insight.confidence} confidence)`,
            ),
          )}`
        : "I do not have derived insights yet. Run context evaluation after loading tenant dimensions so the explorer can derive significance from facts.",
      citations: top.map((insight) =>
        citation(
          insight.evidence ?? insight.ruleId,
          "context_insights",
          insight.freshnessStatus === "fresh" ? "fresh" : "attention",
          insight.id ?? null,
        ),
      ),
      confidence: top.length ? "high" : "none",
      freshnessStatus: top.some(
        (insight) => insight.freshnessStatus !== "fresh",
      )
        ? "attention"
        : top.length
          ? "fresh"
          : "unknown",
      missingContext: top.length ? [] : ["context_insights"],
      viewDirective: { tab: "insights" },
      factsUsed: top.flatMap((insight) => insight.derivedFromFactIds),
    };
  }

  if (routeUsed === "sql-fact") {
    const [summary, refresh] = await Promise.all([
      getContextReadModelForTenant(tenantKey),
      listContextRefreshEventsForTenant(tenantKey),
    ]);
    const recent = refresh.events.slice(0, 5);
    return {
      routeUsed,
      answer: `I found ${summary.entitySummaries.length} live entity summaries, ${summary.factsActive.toLocaleString()} active facts, and ${recent.length} recent refresh event${recent.length === 1 ? "" : "s"}.\n${listLines(
        recent.map(
          (event) =>
            `${event.sourceLabel ?? event.triggeredBy}: ${event.rowsAccepted} accepted, ${event.rowsRejected} needing review`,
        ),
      )}`,
      citations: [
        citation(
          "Context summary",
          "context-read-model",
          summary.latestUpdatedAt ? "fresh" : "unknown",
          null,
        ),
        ...recent.map((event) =>
          citation(
            event.sourceLabel ?? event.triggeredBy,
            "context_refresh_events",
            "fresh",
            event.id,
          ),
        ),
      ],
      confidence:
        summary.errors.length || refresh.errors.length ? "medium" : "high",
      freshnessStatus: recent.some((event) => event.approvalRequired)
        ? "attention"
        : "fresh",
      missingContext: [...summary.errors, ...refresh.errors],
      viewDirective: { tab: "change" },
    };
  }

  if (routeUsed === "freshness") {
    const summary = await getContextReadModelForTenant(tenantKey);
    const stale = summary.sourceHealth.filter(
      (source) => source.freshnessStatus === "stale",
    ).length;
    const review = summary.sourceHealth.filter(
      (source) => source.freshnessStatus === "review",
    ).length;
    const missing = summary.dimensionCoverage.filter(
      (dimension) => dimension.recordCount === 0,
    ).length;
    return {
      routeUsed,
      answer: `Board-readiness is ${summary.evidenceCoverage}% evidence-covered across ${summary.dimensionsLoaded}/14 loaded dimensions. ${stale} source${stale === 1 ? "" : "s"} are stale, ${review} need review, and ${missing} loaded dimension row${missing === 1 ? "" : "s"} have no records.`,
      citations: [
        citation(
          "Coverage summary",
          "v_context_dimension_coverage",
          freshnessFromCounts(stale, review),
          null,
        ),
        ...summary.sourceHealth
          .slice(0, 5)
          .map((source) =>
            citation(
              source.displayName,
              "enterprise_context_sources",
              source.freshnessStatus === "fresh"
                ? "fresh"
                : source.freshnessStatus === "stale"
                  ? "stale"
                  : "attention",
              source.sourceId,
            ),
          ),
      ],
      confidence: summary.errors.length ? "medium" : "high",
      freshnessStatus: freshnessFromCounts(stale, review),
      missingContext: summary.errors,
      viewDirective: { tab: "trust" },
    };
  }

  if (routeUsed === "corpus") {
    return {
      routeUsed,
      answer:
        "I can identify this as a corpus-style question, but the S5 router is not yet connected to the corpus search adapter in this slice. Use the Corpus tab while that adapter is wired into the answer route.",
      citations: [],
      confidence: "none",
      freshnessStatus: "unknown",
      missingContext: ["corpus-search-adapter"],
      viewDirective: { tab: "corpus" },
    };
  }

  const summary = await getContextReadModelForTenant(tenantKey);
  return {
    routeUsed,
    answer: `I routed this to ${routeUsed}. I can ground the answer in ${summary.entitySummaries.length} entity summaries and ${summary.factsActive.toLocaleString()} active facts, but document retrieval is not wired into this S5 slice yet.`,
    citations: [
      citation(
        "Context summary",
        "context-read-model",
        summary.latestUpdatedAt ? "fresh" : "unknown",
        null,
      ),
    ],
    confidence: summary.entitySummaries.length ? "medium" : "low",
    freshnessStatus: summary.latestUpdatedAt ? "fresh" : "unknown",
    missingContext:
      routeUsed === "retrieval"
        ? ["enterprise-context-retrieval-adapter"]
        : ["retrieval-adapter", "corpus-search-adapter"],
    viewDirective: { tab: "explore" },
  };
}

export async function recordQaAudit(args: {
  clientId: string;
  tenantKey: string;
  question: string;
  answer: RoutedAnswer;
}): Promise<void> {
  const result = await getAzureWriteFluentClient()
    .from("context_explorer_answer_audit")
    .insert({
      client_id: args.clientId,
      tenant_key: canonicalTenantKey(args.tenantKey),
      question: args.question,
      route_used: args.answer.routeUsed,
      answer_text: args.answer.answer,
      citation_count: args.answer.citations.length,
      facts_used: args.answer.factsUsed ?? [],
      chunks_used: args.answer.chunksUsed ?? [],
      confidence: args.answer.confidence,
      freshness_status: args.answer.freshnessStatus,
      missing_context: args.answer.missingContext,
      view_directive: args.answer.viewDirective ?? null,
    });
  if (result.error) {
    console.warn("[qa-router] audit insert failed", {
      tenantKey: args.tenantKey,
      routeUsed: args.answer.routeUsed,
      error: result.error.message,
    });
  }
}
